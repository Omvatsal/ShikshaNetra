import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getInstitutionById, updateInstitution } from "@/lib/models/Institution";
import { getUserById } from "@/lib/models/User";
import { ObjectId } from "mongodb";

interface AddUserRequest {
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
    const body: AddUserRequest = await request.json();
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
    const userToAdd = await getUserById(userId);
    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already in institution
    if (institution.userIds.includes(userId)) {
      return NextResponse.json(
        { error: "User is already a member of this institution" },
        { status: 400 }
      );
    }

    // Add user to institution
    const updatedInstitution = await updateInstitution(institutionId, {
      userIds: [...institution.userIds, userId],
    });

    if (!updatedInstitution) {
      return NextResponse.json(
        { error: "Failed to add user to institution" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "User added to institution successfully",
        institution: updatedInstitution,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding user to institution:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
