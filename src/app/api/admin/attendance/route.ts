import { NextRequest, NextResponse } from "next/server";
import { getApiSession, requireRole } from "@/lib/api-auth";
import { getActiveUsersRoster, getAllAttendance } from "@/lib/db-attendance";

/**
 * GET /api/admin/attendance
 * Admin-only: fetch attendance across all employees.
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Returns BOTH the punch rows and the active roster. The roster is what makes
 * absence computable -- rows only exist for people who clocked in, so without
 * it an absent employee is simply absent from the payload.
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

    const [rows, roster] = await Promise.all([
      getAllAttendance(startDate, endDate),
      getActiveUsersRoster(),
    ]);
    return NextResponse.json({ rows, roster });
  } catch (error) {
    console.error("GET /api/admin/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
