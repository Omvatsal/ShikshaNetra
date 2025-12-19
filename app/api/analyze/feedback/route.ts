import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { generateCoachFeedback } from "@/lib/services/feedbackService";

/**
 * POST /api/analyze/feedback
 * Generate coach feedback for a session
 * 
 * Body: {
 *   userId: string;
 *   topic: string;
 *   language: string;
 *   transcript: string;
 *   scores: object;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - invalid or missing token" },
        { status: 401 }
      );
    }

    // Parse body
    const body = await req.json();
    const { userId, topic, language, transcript, scores } = body;

    // Validate required fields
    if (!userId || !topic || !language || !transcript || !scores) {
      return NextResponse.json(
        { 
          error: "Missing required fields: userId, topic, language, transcript, scores" 
        },
        { status: 400 }
      );
    }

    // Ensure user can only generate feedback for themselves (unless admin)
    if (user.id !== userId && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - cannot generate feedback for another user" },
        { status: 403 }
      );
    }

    // Generate feedback
    const result = await generateCoachFeedback({
      userId,
      topic,
      language,
      transcript,
      scores,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Failed to generate feedback" 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: result.feedback,
    });

  } catch (error: any) {
    console.error("Feedback generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
