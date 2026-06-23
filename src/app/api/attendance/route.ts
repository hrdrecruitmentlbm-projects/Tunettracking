import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import {
  recordAttendance,
  getTodayAttendance,
  getAttendanceHistoryGrouped,
  getAttendanceStats,
} from "@/lib/db-attendance";
import { AttendanceType } from "@/types";

function isAttendanceType(v: unknown): v is AttendanceType {
  return v === "berangkat" || v === "pulang";
}

/**
 * POST /api/attendance
 * Record a Berangkat or Pulang check-in for the current user.
 * Body: { type: "berangkat" | "pulang", location_lat?, location_lng?, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!isAttendanceType(body.type)) {
      return NextResponse.json(
        { error: "type must be 'berangkat' or 'pulang'" },
        { status: 400 }
      );
    }

    const record = await recordAttendance({
      user_id: session.userId,
      type: body.type,
      location_lat: typeof body.location_lat === "number" ? body.location_lat : null,
      location_lng: typeof body.location_lng === "number" ? body.location_lng : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      todos: Array.isArray(body.todos) ? body.todos.filter((t: unknown) => typeof t === "string" && t.trim().length > 0) : undefined,
    });

    if (!record) {
      return NextResponse.json(
        { error: "Sudah absen untuk tipe ini hari ini" },
        { status: 409 }
      );
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/attendance
 * Fetch current user's today + history + stats.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [today, history, stats] = await Promise.all([
      getTodayAttendance(session.userId),
      getAttendanceHistoryGrouped(session.userId, 60),
      getAttendanceStats(session.userId),
    ]);

    return NextResponse.json({ today, history, stats });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
