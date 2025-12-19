import { NextRequest, NextResponse } from "next/server";
import { getIncompleteJobs, getJobById, updateJob } from "@/lib/models/Job";
import type { JobResponse } from "@/lib/types/job";
import { getSignedVideoUrl } from "@/lib/services/storageService";
import { processVideoAnalysis } from "@/lib/services/videoAnalysisProcessor";

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

/**
 * Decide whether a job should be restarted.
 * - Skip `completed` and `failed`
 * - Skip jobs updated within last 15 minutes (likely still progressing)
 */
function shouldRestart(job: JobResponse): boolean {
  if (job.status === "completed" || job.status === "failed") return false;

  const now = Date.now();
  const last = new Date(job.updatedAt).getTime();

  // Only restart if last update was >= 15 minutes ago
  if (now - last < 15 * 60 * 1000) return false;

  return true;
}

/**
 * Import the processVideoAnalysis function
 * Note: This is the same function from the analyze route
 */
async function restartJobProcessing(jobId: string) {
  try {
    const job = await getJobById(jobId);
    
    if (!job) {
      console.error(`Job ${jobId} not found for restart`);
      return;
    }

    if (!job.videoMetadata?.storagePath) {
      await updateJob(jobId, {
        status: "failed",
        error: "Missing storage path; please re-upload and retry.",
      });
      console.error(`Job ${jobId} missing storagePath; marked failed.`);
      return;
    }

    const signedUrl = await getSignedVideoUrl(job.videoMetadata.storagePath, 3600);
    if (!signedUrl) {
      await updateJob(jobId, {
        status: "failed",
        error: "Could not fetch video from storage for restart. Please re-upload and retry.",
      });
      console.error(`Job ${jobId} unable to get signed URL; marked failed.`);
      return;
    }

    const response = await fetch(signedUrl);
    if (!response.ok) {
      await updateJob(jobId, {
        status: "failed",
        error: "Failed to download video for restart. Please re-upload and retry.",
      });
      console.error(`Job ${jobId} download failed with status ${response.status}`);
      return;
    }

    const buffer = await response.arrayBuffer();
    const mimeType = job.videoMetadata.mimeType || "video/mp4";
    const fileName = job.videoMetadata.fileName || "video.mp4";
    const blob = new Blob([buffer], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    // Reset job status before reprocessing
    await updateJob(jobId, { status: "created", progress: 0, error: undefined });

    const subject = job.subject || "General Teaching";
    const language = job.language || "English";

    await processVideoAnalysis(jobId, file, job.userId, subject, language);
    console.log(`Job ${jobId} restarted successfully`);
  } catch (error) {
    console.error(`Error restarting job ${jobId}:`, error);
    await updateJob(jobId, {
      status: "failed",
      error: `Restart failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * POST /api/jobs/restart
 * Restarts all incomplete jobs (called on server startup)
 * Requires INTERNAL_SERVICE_KEY for security
 */
export async function POST(req: NextRequest) {
  try {
    // Verify internal service key
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== INTERNAL_SERVICE_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Checking for incomplete jobs to restart...");
    const incompleteJobs = await getIncompleteJobs();

    if (incompleteJobs.length === 0) {
      console.log("No incomplete jobs found");
      return NextResponse.json({
        success: true,
        message: "No incomplete jobs to restart",
        count: 0,
      });
    }

    console.log(`Found ${incompleteJobs.length} incomplete jobs`);

    // Apply additional filter to avoid restarting very recent jobs
    const eligibleJobs = incompleteJobs.filter(shouldRestart);
    if (eligibleJobs.length === 0) {
      console.log("No eligible jobs after filtering by last update time");
      return NextResponse.json({
        success: true,
        message: "No jobs eligible for restart (updated <15m)",
        count: 0,
      });
    }

    // Restart all eligible incomplete jobs
    const restartPromises = eligibleJobs.map((job) => restartJobProcessing(job.id));
    await Promise.allSettled(restartPromises);

    return NextResponse.json({
      success: true,
      message: `Processed ${eligibleJobs.length} eligible incomplete jobs`,
      count: eligibleJobs.length,
    });
  } catch (error: any) {
    console.error("Error restarting jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to restart jobs",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/restart
 * Get count of incomplete jobs (for monitoring)
 */
export async function GET(req: NextRequest) {
  try {
    const incompleteJobs = await getIncompleteJobs();
    
    return NextResponse.json({
      success: true,
      count: incompleteJobs.length,
      jobs: incompleteJobs.map(j => ({
        id: j.id,
        status: j.status,
        createdAt: j.createdAt,
        subject: j.subject,
      })),
    });
  } catch (error: any) {
    console.error("Error getting incomplete jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get incomplete jobs",
      },
      { status: 500 }
    );
  }
}
