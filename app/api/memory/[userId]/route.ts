import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getMemoryByUserId } from "@/lib/models/Memory";

/**
 * GET /api/memory/[userId]
 * Fetch memory/summary for a specific user
 * Accessible to the user themselves or institution admins
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Users can only view their own memory, or admins can view any
    if (user.id !== userId && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const memory = await getMemoryByUserId(userId);

    if (!memory) {
      return NextResponse.json(
        { error: "Memory not found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, memory },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching memory:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory", details: error?.message },
      { status: 500 }
    );
  }
}
