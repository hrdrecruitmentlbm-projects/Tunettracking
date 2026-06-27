import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { getAttendanceSignedUrl } from "@/lib/storage";

/**
 * GET /api/attendance/photo/[id]?path=attendance/user123/2026-06-27-uuid.webp
 * Returns a fresh signed URL for an attendance photo (1 hour TTL).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params;
    const filePath = request.nextUrl.searchParams.get("path");

    if (!filePath || !filePath.startsWith("attendance/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const signedUrl = await getAttendanceSignedUrl(filePath);
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("GET /api/attendance/photo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
