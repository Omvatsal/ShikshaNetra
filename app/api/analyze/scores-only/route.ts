import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { createAnalysis, updateAnalysis } from "@/lib/models/Analysis";
import { uploadVideoToStorage } from "@/lib/utils/videoUpload";
import { Client } from "@gradio/client";
import { transformMLResponse } from "@/lib/services/analysisService";
// Vercel pe background tasks ko zinda rakhne ke liye zaroori hai:
import { waitUntil } from '@vercel/functions'; 

const HF_SPACE = "genathon00/sikshanetra-model";
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await authMiddleware(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const subject = formData.get("subject") as string;
    const language = formData.get("language") as string;

    if (!file || !subject || !language) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ---------------------------------------------------------
    // STEP 1: JOB BANANA (Create DB Entry Immediately)
    // ---------------------------------------------------------
    const initialAnalysis = await createAnalysis({
      userId: user.id,
      videoUrl: "", 
      subject,
      language,
      // Status: Processing, Progress: 0%
      progress: 0,
      status: "processing" 
    });

    // ---------------------------------------------------------
    // STEP 2: BACKGROUND TASK DEFINE KARNA
    // (Ye function run karega lekin hum iska wait nahi karenge response ke liye)
    // ---------------------------------------------------------
    const backgroundTask = async () => {
      try {
        console.log(`[Background] Starting job ${initialAnalysis.id}`);
        
        // Update Progress: 10% (Started)
        await updateAnalysis(initialAnalysis.id, { progress: 10 });

        // A. Parallel Execution (Upload + AI)
        const [uploadResult, aiResult] = await Promise.all([
          // Task 1: Upload to Supabase
          uploadVideoToStorage(file, user.id).then(async (res) => {
            if (res.success) {
               // Update Progress: 40% (Video Uploaded)
               await updateAnalysis(initialAnalysis.id, { progress: 40 });
            }
            return res;
          }),

          // Task 2: AI Prediction
          (async () => {
            const buffer = await file.arrayBuffer();
            const client = await Client.connect(HF_SPACE);
            const prediction = await client.predict("/analyze_session", {
              video: new Blob([buffer], { type: file.type }),
            });
            return (prediction as any).data;
          })()
        ]);

        // Progress: 80% (AI Done)
        await updateAnalysis(initialAnalysis.id, { progress: 80 });

        // B. Validation
        if (!uploadResult.success || !uploadResult.videoMetadata) {
          throw new Error("Upload failed: " + uploadResult.error);
        }

        // C. Save Final Result
        const [summary, scores, feedback, rawData] = aiResult;
        
        const transformedData = transformMLResponse(
          { success: true, data: rawData },
          user.id,
          uploadResult.videoMetadata,
          subject,
          language,
          (rawData as any)?.session_id
        );

        // FINAL UPDATE: Completed (100%)
        await updateAnalysis(initialAnalysis.id, {
          ...transformedData,
          videoUrl: uploadResult.videoMetadata.videoUrl,
          status: "completed",
          progress: 100
        });
        
        console.log(`[Background] Job ${initialAnalysis.id} Completed`);

      } catch (err: any) {
        console.error(`[Background] Job ${initialAnalysis.id} Failed:`, err);
        await updateAnalysis(initialAnalysis.id, { 
          status: "failed", 
          progress: 0,
          coachFeedbackError: err.message 
        });
      }
    };

    // ---------------------------------------------------------
    // STEP 3: EXECUTE & RETURN IMMEDIATELY
    // ---------------------------------------------------------
    
    // Agar Vercel pe ho, to waitUntil use karo taaki request close hone ke baad bhi task chale
    // Agar local (Node.js) pe ho, to sirf backgroundTask() call kar sakte ho.
    waitUntil(backgroundTask());

    // Frontend ko turant job ID return kar do
    return NextResponse.json({
      success: true,
      message: "Analysis started in background",
      analysisId: initialAnalysis.id,
      status: "processing",
      progress: 0
    });

  } catch (error: any) {
    console.error("Route error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}