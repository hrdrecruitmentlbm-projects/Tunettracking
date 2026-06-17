import { NextRequest } from "next/server";
import { verifySessionToken } from "./auth";

const SESSION_COOKIE_NAME = "tunetops-session";

export interface ApiSession {
  userId: string;
  role: "admin" | "noc" | "foc";
  name: string;
}

export function getApiSession(request: NextRequest): ApiSession | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function requireRole(
  session: ApiSession | null,
  allowedRoles: Array<"admin" | "noc" | "foc">
): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}
