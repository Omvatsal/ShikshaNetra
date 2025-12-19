import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
// UPDATE: Import from the new models folder
import { createAnalysis } from "@/lib/models/Analysis"; 
import { createJob, updateJob } from "@/lib/models/Job";
import { updateMemoryFromAnalysis } from "@/lib/models/Memory";
import { transformMLResponse } from "@/lib/services/analysisService";
import { generateCoachFeedback, generateFallbackFeedback } from "@/lib/services/feedbackService";
import { uploadVideoToStorage } from "@/lib/utils/videoUpload";
import { Client } from "@gradio/client";
import type { JobStatus } from "@/lib/types/job";

function toUserFriendlyJobError(raw: unknown): string {
  const message = typeof raw === "string" ? raw : (raw as any)?.message;
  const msg = (message || "").toString();
  const lower = msg.toLowerCase();

  if (!msg) return "Analysis failed. Please try again.";
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Analysis timed out. Please try again with a shorter video or retry later.";
  }
  if (lower.includes("rate") && (lower.includes("limit") || lower.includes("429"))) {
    return "The analysis service is busy (rate-limited). Please wait a minute and try again.";
  }
  if (lower.includes("upload")) {
    return "Video upload failed. Please check your connection and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("econn") || lower.includes("enotfound")) {
    return "Network error while contacting the analysis service. Please try again.";
  }

  return msg.length > 180 ? `${msg.slice(0, 180)}…` : msg;
}

const HF_SPACE = "genathon00/sikshanetra-model";

/**
 * Async background processor for video analysis
 */
export async function processVideoAnalysis(
  jobId: string,
  file: File,
  userId: string,
  subject: string,
  language: string
) {
  const statusRank: Record<JobStatus, number> = {
    created: 0,
    uploading: 1,
    uploaded: 2,
    analyzing: 3,
    analysis_done: 4,
    generating_feedback: 5,
    completed: 6,
    failed: 99,
  };

  let currentStatus: JobStatus = "created";
  let currentProgress = 0;

  const setStatus = async (
    nextStatus: JobStatus,
    nextProgress?: number,
    extra?: Record<string, unknown>
  ) => {
    if (statusRank[nextStatus] < statusRank[currentStatus]) return;
    currentStatus = nextStatus;
    if (typeof nextProgress === "number") {
      currentProgress = Math.max(currentProgress, nextProgress);
    }
    await updateJob(jobId, {
      status: nextStatus,
      ...(typeof nextProgress === "number" ? { progress: currentProgress } : {}),
      ...(extra || {}),
    } as any);
  };

  const bumpProgressTo = async (minProgress: number) => {
    const next = Math.max(currentProgress, minProgress);
    if (next === currentProgress) return;
    currentProgress = next;
    await updateJob(jobId, { progress: currentProgress });
  };

  try {
    // ============================
    // PHASE 1 — UPLOAD (DECOUPLED)
    // ============================
    await setStatus("uploading", 5);

    const uploadResult = await uploadVideoToStorage(file, userId);

    if (!uploadResult.success || !uploadResult.videoMetadata) {
      await setStatus("failed", undefined, {
        error: toUserFriendlyJobError(uploadResult.error || "Upload failed"),
      });
      return;
    }

    const videoMetadata = uploadResult.videoMetadata;

    // 🔒 CRITICAL: persist storagePath BEFORE analysis
    await setStatus("uploaded", 20, { videoMetadata });

    // ============================
    // PHASE 2 — ANALYSIS
    // ============================
    await setStatus("analyzing", 30);

    const client = await Client.connect(HF_SPACE);
    const buffer = await file.arrayBuffer();
    const videoBlob = new Blob([buffer], { type: file.type });

    const result = await client.predict(
      "/analyze_session_with_status",
      {
        video: videoBlob,
        topic_name: subject,
      }
    );

    if (!result || !result.data) {
      await setStatus("failed", undefined, {
        error: toUserFriendlyJobError("Analysis service returned no data"),
      });
      return;
    }

    await setStatus("analysis_done", 70);

    const [, , , rawData] = (result as any).data;

    const transformed = transformMLResponse(
      { success: true, data: rawData },
      userId,
      videoMetadata,
      subject,
      language,
      videoMetadata.videoUrl
    );

    // ============================
    // PHASE 3 — FEEDBACK
    // ============================
    await setStatus("generating_feedback", 75);

    let coachFeedback;
    let coachFeedbackError;

    try {
      const feedbackResult = await generateCoachFeedback({
        userId,
        topic: rawData.topic || subject,
        language,
        transcript: rawData.transcript || "",
        scores: rawData.scores,
      });

      if (feedbackResult.success) {
        coachFeedback = feedbackResult.feedback;
      } else {
        coachFeedbackError = feedbackResult.error;
        const user = await import("@/lib/models/User").then(m => m.getUserById(userId));
        coachFeedback = generateFallbackFeedback(user?.name || "Teacher", rawData.scores);
      }
    } catch (err: any) {
      coachFeedbackError = err?.message;
      const user = await import("@/lib/models/User").then(m => m.getUserById(userId));
      coachFeedback = generateFallbackFeedback(user?.name || "Teacher", rawData.scores);
    }

    await setStatus("generating_feedback", 90);

    const savedAnalysis = await createAnalysis({
      ...transformed,
      sessionId: transformed.sessionId || `sess_${Date.now()}`,
      coachFeedback,
      coachFeedbackError,
    });

    // 🔄 Update memory in background (non-blocking, not critical)
    // Report is already delivered regardless of memory update outcome
    updateMemoryFromAnalysis(userId, savedAnalysis).catch((error) => {
      console.warn("Memory update failed (non-critical):", error?.message);
      // Don't crash the flow - memory is a nice-to-have feature
    });

    await setStatus("completed", 100, { analysisId: savedAnalysis.id });

  } catch (error: any) {
    console.error("Background processing error for job:", jobId, error);

    // 🔁 Upload already persisted → restartable
    await updateJob(jobId, {
      status: "failed",
      error: toUserFriendlyJobError(error),
    });
  }
}


export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - invalid or missing token" },
        { status: 401 }
      );
    }

    // 2. Parse form-data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const subject = formData.get("subject") as string;
    const language = formData.get("language") as string;

    if (!file || !subject || !language) {
      return NextResponse.json(
        { error: "File, subject, and language are required" },
        { status: 400 }
      );
    }

    if (!HF_SPACE) {
      return NextResponse.json(
        { error: "ML microservice URL is not configured" },
        { status: 500 }
      );
    }

    // 3. Create job immediately
    const job = await createJob({
      userId: user.id,
      videoMetadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
      subject,
      language,
    });

    console.log("Created job:", job.id);

    // 4. Start async processing (don't await)
    // This runs in the background while we return the job to the frontend
    processVideoAnalysis(job.id, file, user.id, subject, language).catch(
      (error) => {
        console.error("Fatal error in background process:", error);
      }
    );

    // 5. Return job immediately for frontend tracking
    return NextResponse.json(
      {
        success: true,
        job,
      },
      { status: 202 } // 202 Accepted - processing started
    );

  } catch (error: any) {
    console.error("Job creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create analysis job",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}