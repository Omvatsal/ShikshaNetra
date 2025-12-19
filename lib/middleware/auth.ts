import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/utils/jwt";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authMiddleware = (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Auth failed: No authorization header or invalid format", {
      hasHeader: !!authHeader,
      headerValue: authHeader?.substring(0, 20),
    });
    return null;
  }

  const token = authHeader.substring(7);
  
  if (!token) {
    console.log("Auth failed: Empty token");
    return null;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    console.log("Auth failed: Token verification failed (expired or invalid)");
    return null;
  }

  return payload;
};

export const withAuth = (handler: Function) => {
  return async (req: NextRequest) => {
    const user = authMiddleware(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing token" },
        { status: 401 }
      );
    }

    const newReq = req as AuthenticatedRequest;
    newReq.user = user;

    return handler(newReq);
  };
};
