import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getInstitutionById } from "@/lib/models/Institution";
import { getAnalysesByUserId } from "@/lib/models/Analysis";

export async function GET(
  request: NextRequest,
  { params }: { params: { institutionId: string; userId: string } }
) {
  try {
    // Verify authentication
    const user = authMiddleware(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing token" },
        { status: 401 }
      );
    }

    const { institutionId, userId } = params;

    // Validate inputs
    if (!institutionId || !userId) {
      return NextResponse.json(
        { error: "institutionId and userId are required" },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Verify institution exists
    const institution = await getInstitutionById(institutionId);
    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    // Verify user belongs to the institution
    if (!institution.userIds.includes(userId)) {
      return NextResponse.json(
        { error: "User does not belong to this institution" },
        { status: 403 }
      );
    }

    // Get reports for the specific user
    const reports = await getAnalysesByUserId(userId, limit, skip);

    return NextResponse.json(
      {
        message: "User reports retrieved successfully",
        institutionId,
        userId,
        reports,
        pagination: {
          limit,
          skip,
          count: reports.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user reports from institution:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
