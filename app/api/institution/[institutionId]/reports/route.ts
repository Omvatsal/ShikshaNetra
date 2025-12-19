import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getInstitutionById } from "@/lib/models/Institution";
import { getAnalysesByUserId } from "@/lib/models/Analysis";

export async function GET(
  request: NextRequest,
  { params }: { params: { institutionId: string } }
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

    const { institutionId } = params;

    // Validate institutionId
    if (!institutionId) {
      return NextResponse.json(
        { error: "institutionId is required" },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Verify institution exists
    const institution = await getInstitutionById(institutionId);
    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    // Get all reports for all users in the institution
    const userReports: Record<
      string,
      {
        userId: string;
        reports: any[];
      }
    > = {};

    // Fetch reports for each user in the institution
    for (const userId of institution.userIds) {
      const reports = await getAnalysesByUserId(userId, limit, skip);
      if (reports.length > 0) {
        userReports[userId] = {
          userId,
          reports,
        };
      }
    }

    return NextResponse.json(
      {
        message: "Reports retrieved successfully",
        institutionId,
        totalUsers: institution.userIds.length,
        usersWithReports: Object.keys(userReports).length,
        userReports,
        pagination: {
          limit,
          skip,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching institution reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
