import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { 
  getAnalysisById, 
  updateAnalysis, 
  deleteAnalysis 
} from "@/lib/models/Analysis";
import { verifyAuth } from "@/lib/utils/verifyAuth"; // <--- Import the helper

// 1. GET: Fetch Report (Only Humans allowed)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth Check
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const analysis = await getAnalysisById(id);

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Ownership Check
    if (analysis.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ 
      message: "Analysis retrieved", 
      analysis 
    }, { status: 200 });

  } catch (error) {
    console.error("Get Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 2. PATCH: Update Status (The Waterfall Trigger)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // --- AUTH CHECK (Using Helper) ---
    // This handles BOTH "User Tokens" and "Service Keys" in one line
    const auth = await verifyAuth(req);

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ---------------------------------

    const { id } = params;
    const body = await req.json();

    // The updateAnalysis function automatically handles:
    // 1. Updating scores/data
    // 2. Triggering the "Waterfall" (Video -> Audio -> Text status changes)
    const updated = await updateAnalysis(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysis: updated
    });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 3. DELETE: Remove Report (Only Humans allowed)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    // Verify Owner before deleting
    const analysis = await getAnalysisById(id);
    
    // If analysis exists but user doesn't own it -> Forbidden
    if (analysis && analysis.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const success = await deleteAnalysis(id);

    if (!success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}