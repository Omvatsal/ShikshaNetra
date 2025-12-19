import { NextRequest } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";

export async function verifyAuth(req: NextRequest) {
  // 1. Check for Service Key (Machine-to-Machine)
  const serviceKey = req.headers.get("x-service-key");
  if (serviceKey === process.env.INTERNAL_SERVICE_KEY) {
    return { isAuthorized: true, type: "service", user: null };
  }

  // 2. Check for User Session (Human-to-Server)
  const user = authMiddleware(req);
  if (user) {
    return { isAuthorized: true, type: "user", user };
  }

  // 3. Failed
  return { isAuthorized: false, type: null, user: null };
}