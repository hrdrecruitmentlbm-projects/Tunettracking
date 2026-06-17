import { NextResponse } from "next/server";
import { getSessionTokenFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const session = getSessionTokenFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      name: session.name,
      role: session.role,
    },
  });
}
