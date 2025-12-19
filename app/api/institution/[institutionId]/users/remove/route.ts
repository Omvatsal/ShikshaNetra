import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getInstitutionById, updateInstitution } from "@/lib/models/Institution";
import { getUserById } from "@/lib/models/User";

interface RemoveUserRequest {
  userId: string;
}

export async function POST(
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
    const body: RemoveUserRequest = await request.json();
    const { userId } = body;

    // Validate inputs
    if (!institutionId || !userId) {
      return NextResponse.json(
        { error: "institutionId and userId are required" },
        { status: 400 }
      );
    }

    // Verify institution exists
    const institution = await getInstitutionById(institutionId);
    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    // Verify user exists
    const userToRemove = await getUserById(userId);
    if (!userToRemove) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is actually in institution
    if (!institution.userIds.includes(userId)) {
      return NextResponse.json(
        { error: "User is not a member of this institution" },
        { status: 400 }
      );
    }

    // Remove user from institution
    const updatedInstitution = await updateInstitution(institutionId, {
      userIds: institution.userIds.filter((id) => id !== userId),
    });

    if (!updatedInstitution) {
      return NextResponse.json(
        { error: "Failed to remove user from institution" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "User removed from institution successfully",
        institution: updatedInstitution,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing user from institution:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
