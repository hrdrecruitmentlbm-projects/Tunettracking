import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/export/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * READ-ONLY export for the AbsenSync desktop app.
 * Protected by the shared secret in env SYNC_SECRET, sent as header
 * "x-sync-secret". Fails CLOSED: if SYNC_SECRET is not configured the
 * endpoint refuses every request (unlike /api/cleanup).
 *
 * Returns only what the sync needs: who clocked in ("berangkat") and when,
 * plus the active roster. No PINs, photos, coordinates, notes or phone numbers.
 */

const SYNC_SECRET = process.env.SYNC_SECRET || "";
const MAX_RANGE_DAYS = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function secretMatches(provided: string | null): boolean {
  if (!SYNC_SECRET || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(SYNC_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Today's date in Asia/Jakarta (WIB) as YYYY-MM-DD. */
function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000
  );
}

interface JoinedUser {
  name: string | null;
  role: string | null;
}

export async function GET(request: NextRequest) {
  if (!SYNC_SECRET) {
    return NextResponse.json(
      { error: "SYNC_SECRET belum diatur di server" },
      { status: 503 }
    );
  }
  if (!secretMatches(request.headers.get("x-sync-secret"))) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const endDate = searchParams.get("endDate") || todayWib();
    const startDate = searchParams.get("startDate") || addDays(endDate, -7);

    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return NextResponse.json(
        { error: "startDate/endDate harus berformat YYYY-MM-DD" },
        { status: 400 }
      );
    }
    const span = daysBetween(startDate, endDate);
    if (span < 0 || span > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `Rentang tanggal maksimal ${MAX_RANGE_DAYS} hari` },
        { status: 400 }
      );
    }

    const [attendanceRes, rosterRes] = await Promise.all([
      supabaseAdmin
        .from("attendance")
        .select("user_id, timestamp, attendance_date, user:users(name, role)")
        .eq("type", "berangkat")
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate)
        .order("attendance_date", { ascending: true })
        .order("timestamp", { ascending: true })
        .limit(5000),
      supabaseAdmin
        .from("users")
        .select("id, name, role")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (attendanceRes.error || rosterRes.error) {
      console.error("GET /api/export/attendance db error:", attendanceRes.error ?? rosterRes.error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const rows = (attendanceRes.data ?? []).map((r) => {
      // Supabase types a to-one join as object or single-item array depending on version.
      const joined = (Array.isArray(r.user) ? r.user[0] : r.user) as JoinedUser | null | undefined;
      return {
        user_id: r.user_id as string,
        name: joined?.name ?? "",
        role: joined?.role ?? "",
        timestamp: r.timestamp as string,
        attendance_date: r.attendance_date as string,
      };
    });

    return NextResponse.json({
      startDate,
      endDate,
      rows,
      roster: rosterRes.data ?? [],
    });
  } catch (error) {
    console.error("GET /api/export/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
