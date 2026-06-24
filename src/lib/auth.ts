import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "tutrack-dev-secret-change-in-production";
const SESSION_COOKIE_NAME = "tutrack-session";
const SESSION_TTL_HOURS = 24;

export interface SessionData {
  userId: string;
  role: "admin" | "noc" | "foc" | "marketing";
  name: string;
  expiresAt: number;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
}

export function createSessionToken(userId: string, role: "admin" | "noc" | "foc" | "marketing", name: string): string {
  const expiresAt = Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000;
  const payload: SessionData = { userId, role, name, expiresAt };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionData | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expectedSignature = sign(encoded);

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as SessionData;

    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionTokenFromRequest(request: Request): SessionData | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!sessionCookie) return null;

  const token = sessionCookie.substring(SESSION_COOKIE_NAME.length + 1);
  return verifySessionToken(token);
}

export const SESSION_CONFIG = {
  cookieName: SESSION_COOKIE_NAME,
  ttlSeconds: SESSION_TTL_HOURS * 60 * 60,
};
