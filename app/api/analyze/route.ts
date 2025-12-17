import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
// UPDATE: Import from the new models folder
import { createAnalysis } from "@/lib/models/Analysis"; 
import { transformMLResponse } from "@/lib/services/analysisService";
import { uploadVideoToStorage } from "@/lib/utils/videoUpload";
import { Client } from "@gradio/client";

const HF_SPACE = "genathon00/sikshanetra-model";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await authMiddleware(req); // Added await just in case your auth is async
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

    // 3. Upload video to Storage (Supabase/S3)
    const uploadResult = await uploadVideoToStorage(file, user.id);
    if (!uploadResult.success || !uploadResult.videoMetadata) {
      return NextResponse.json(
        { error: uploadResult.error || "Upload failed" },
        { status: 500 }
      );
    }

    const videoMetadata = uploadResult.videoMetadata;

    // 4. Prepare for Gradio
    const buffer = await file.arrayBuffer();
    const videoBlob = new Blob([buffer], { type: file.type });

    if (!HF_SPACE) {
      return NextResponse.json(
        { error: "ML microservice URL is not configured" },
        { status: 500 }
      );
    }

    console.log("Connecting to Gradio model:", HF_SPACE);
    const client = await Client.connect(HF_SPACE);

    console.log("Sending video to Gradio /analyze_session");

    // 5. Call ML Model (Waits for full completion)
    // Note: This blocks until analysis is 100% done
    const result = await client.predict("/analyze_session", {
      video: videoBlob,
    });
    
    // Destructure result based on your Gradio API 
    // (Assuming this matches your Python return signature)
    const [summary, scores, feedback, rawData, buttonState] = (result as any).data;

    console.log("ML analysis result received");

    // 6. Transform Response
    // FIX: Passed videoMetadata.videoUrl as the correct last argument
    const transformed = transformMLResponse(
      { success: true, data: rawData as any },
      user.id,
      videoMetadata,
      subject,
      language,
      videoMetadata.videoUrl 
    );

    // 7. Save to DB
    // Since 'transformed' already contains { processingStatus: { overall: 'completed' ... } }
    // we don't need to manually set status here.
    const savedAnalysis = await createAnalysis({
      ...transformed,
      // Ensure we have a sessionId even if ML failed to return one
      sessionId: transformed.sessionId || `sess_${Date.now()}`,
    });

    console.log("Analysis saved with ID:", savedAnalysis.id);

    return NextResponse.json(
      {
        success: true,
        analysisId: savedAnalysis.id,
        data: rawData,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Analyze error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ML analysis failed",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}