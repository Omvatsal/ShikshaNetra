import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getUserJobs } from "@/lib/models/Job";
import { computeJobProgress } from "@/lib/utils/jobProgress";

// Prevent caching so polling always gets fresh data
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 20;

    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;

    const jobs = await getUserJobs(user.id, safeLimit);
    const withProgress = jobs.map((j) => ({
      ...j,
      progress: computeJobProgress(j),
    }));

    return NextResponse.json({
      success: true,
      jobs: withProgress,
    });
  } catch (error: any) {
    console.error("Jobs list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch jobs",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
