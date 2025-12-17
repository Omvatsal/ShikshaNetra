import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

// Prevent caching so the progress bar updates in real-time
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get Job ID
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("id");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    let objectId;
    try {
      objectId = new ObjectId(jobId);
    } catch {
      return NextResponse.json({ error: "Invalid Job ID format" }, { status: 400 });
    }

    // 3. Connect & Fetch Status
    const db = await getDatabase();
    const collection = db.collection("analyses");

    // We use "projection" to ONLY fetch status fields (Very fast)
    const job = await collection.findOne(
      { _id: objectId, userId: user.id },
      { 
        projection: { 
          status: 1, 
          progress: 1, 
          processingStatus: 1, 
          error: 1 
        } 
      }
    );

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 4. Return Status
    return NextResponse.json({
      id: job._id.toString(),
      status: job.status || "processing",
      progress: job.progress || 0,
      processingStatus: job.processingStatus,
      error: job.error
    }, { status: 200 });

  } catch (error) {
    console.error("Job poll error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}