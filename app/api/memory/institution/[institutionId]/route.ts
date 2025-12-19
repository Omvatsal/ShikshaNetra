import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getMemoriesByUserIds } from "@/lib/models/Memory";
import { getDatabase } from "@/lib/db/mongodb";

/**
 * GET /api/memory/institution/[institutionId]
 * Fetch memory summaries for all users in an institution
 * Only accessible to institution admins
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { institutionId: string } }
) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { institutionId } = params;

    // Only admins or users from that institution can view
    if (user.role !== "admin" && (user as any).institutionId !== institutionId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get all users from this institution
    const db = await getDatabase();
    const usersCollection = db.collection("users");

    const users = await usersCollection
      .find({ institutionId })
      .project({ _id: 1 })
      .toArray();

    const userIds = users.map((u) => u._id.toString());

    // Fetch memories for these users
    const memories = await getMemoriesByUserIds(userIds);

    return NextResponse.json(
      { success: true, count: memories.length, memories },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching institution memories:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories", details: error?.message },
      { status: 500 }
    );
  }
}
