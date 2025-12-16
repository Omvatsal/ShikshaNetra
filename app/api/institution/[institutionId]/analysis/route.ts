import { NextResponse } from "next/server";
import { getInstitutionAnalysis } from "@/lib/db/mentor";

export async function GET(
  request: Request,
  { params }: { params: { institutionId: string } }
) {
  try {
    const { institutionId } = params;

    // Call the function we just wrote in lib/db/mentor.ts
    const report = await getInstitutionAnalysis(institutionId);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching institution analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}