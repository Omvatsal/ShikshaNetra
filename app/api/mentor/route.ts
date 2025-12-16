import { NextResponse } from "next/server";
import { createMentor, searchMentors } from "@/lib/db/mentor";
import { MentorSearchFilters } from "@/lib/types/mentor";

// POST /api/mentor (Create)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMentor = await createMentor(body);
    return NextResponse.json(newMentor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create mentor" }, { status: 500 });
  }
}

// GET /api/mentor?institutionId=XYZ&name=Rahul (Search)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const institutionId = searchParams.get("institutionId");

  if (!institutionId) {
    return NextResponse.json({ error: "Institution ID is required" }, { status: 400 });
  }

  const filters: MentorSearchFilters = {
    institutionId,
    name: searchParams.get("name") || undefined,
    minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
    isActive: searchParams.get("isActive") === "true" ? true : undefined,
  };

  const mentors = await searchMentors(filters);
  return NextResponse.json(mentors);
}