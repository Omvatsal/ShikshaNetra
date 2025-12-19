import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getJobById } from "@/lib/models/Job";
import { computeJobProgress } from "@/lib/utils/jobProgress";

// Prevent caching so polling always gets fresh data
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const job = await getJobById(id, user.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const progress = computeJobProgress(job);

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        progress,
      },
    });
  } catch (error: any) {
    console.error("Job status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch job",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
