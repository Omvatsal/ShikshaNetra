import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { createAnalysis } from "@/lib/models/Analysis";
import { transformMLResponse } from "@/lib/services/analysisService";
import { uploadVideoToStorage } from "@/lib/utils/videoUpload";
import { Client } from "@gradio/client";

const HF_SPACE = "genathon00/sikshanetra-model";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - invalid or missing token" },
        { status: 401 }
      );
    }

    // Parse form-data
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

    // Upload video to Supabase (for saving)
    const uploadResult = await uploadVideoToStorage(file, user.id);
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Upload failed" },
        { status: 500 }
      );
    }

    const videoMetadata = uploadResult.videoMetadata!;

    // Convert uploaded File → Blob for Gradio
    const buffer = await file.arrayBuffer();
    const videoBlob = new Blob([buffer], { type: file.type });

    if (!HF_SPACE) {
      return NextResponse.json(
        { error: "ML microservice URL is not configured" },
        { status: 500 }
      );
    }

    console.log("Connecting to Gradio model:", HF_SPACE);

    // Connect to HuggingFace Gradio Space
    const client = await Client.connect(HF_SPACE);

    console.log("Sending video to Gradio /analyze_session");

    // Call ML model
    const result = await client.predict("/analyze_session", {
      video: videoBlob,
    });
    const [summary, scores, feedback, rawData, buttonState] = (result as any)
      .data;

    console.log("ML analysis result received");

    // Transform ML response
    const transformed = transformMLResponse(
      { success: true, data: rawData as any },
      user.id,
      videoMetadata,
      subject,
      language,
      (rawData as any)?.session_id
    );

    // Save to DB
    const savedAnalysis = await createAnalysis({
      ...transformed,
      videoUrl: videoMetadata.videoUrl,
      status: "completed",
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
