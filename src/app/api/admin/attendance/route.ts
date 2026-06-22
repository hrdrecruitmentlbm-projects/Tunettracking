import { NextRequest, NextResponse } from "next/server";
import { getApiSession, requireRole } from "@/lib/api-auth";
import { getAllAttendance } from "@/lib/db-attendance";

/**
 * GET /api/admin/attendance
 * Admin-only: fetch attendance across all employees.
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can view all attendance" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const rows = await getAllAttendance(startDate, endDate);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("GET /api/admin/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
