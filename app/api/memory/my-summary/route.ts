import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getMemoryByUserId } from "@/lib/models/Memory";

/**
 * GET /api/memory/my-summary
 * Fetch the current user's memory/summary
 * For use in dashboard/insights pages
 */
export async function GET(req: NextRequest) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const memory = await getMemoryByUserId(user.id);

    if (!memory) {
      return NextResponse.json(
        {
          success: true,
          memory: null,
          message: "No memory data available yet. Complete an analysis to populate metrics.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, memory },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user memory:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory", details: error?.message },
      { status: 500 }
    );
  }
}
