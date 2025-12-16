import { NextResponse } from "next/server";
import { 
  getMentorById, 
  updateMentor, 
  deleteMentor 
} from "@/lib/db/mentor";

// GET /api/mentor/123
export async function GET(
  request: Request,
  { params }: { params: { mentorId: string } }
) {
  const mentor = await getMentorById(params.mentorId);

  if (!mentor) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  return NextResponse.json(mentor);
}

// PATCH /api/mentor/123 (Update stats or details)
export async function PATCH(
  request: Request,
  { params }: { params: { mentorId: string } }
) {
  try {
    const body = await request.json();
    const updated = await updateMentor(params.mentorId, body);

    if (!updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
  }
}

// DELETE /api/mentor/123
export async function DELETE(
  request: Request,
  { params }: { params: { mentorId: string } }
) {
  const success = await deleteMentor(params.mentorId);

  if (!success) {
    return NextResponse.json({ error: "Delete failed" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}