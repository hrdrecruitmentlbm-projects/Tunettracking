import { NextRequest, NextResponse } from "next/server";
import { getApiSession, requireRole } from "@/lib/api-auth";
import {
  getAttendanceReminderSettings,
  getJakartaClock,
  getTodayAttendance,
  updateAttendanceReminderSettings,
} from "@/lib/db-attendance";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function verifySameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.host === host;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [settings, todayRows] = await Promise.all([
      getAttendanceReminderSettings(),
      getTodayAttendance(session.userId),
    ]);

    const clock = getJakartaClock();
    const hasBerangkat = todayRows.some((r) => r.type === "berangkat");
    const hasPulang = todayRows.some((r) => r.type === "pulang");

    return NextResponse.json({
      settings,
      todayStatus: {
        date: clock.date,
        currentWibTime: clock.time,
        currentWibMinutes: clock.minutes,
        currentWibWeekday: clock.weekday,
        hasBerangkat,
        hasPulang,
      },
    });
  } catch (error) {
    console.error("GET /api/attendance/reminder-settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!verifySameOrigin(request)) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }

    const session = getApiSession(request);
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can update attendance reminder settings" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const enabled = typeof body.enabled === "boolean" ? body.enabled : true;
    const berangkat_time =
      typeof body.berangkat_time === "string" ? body.berangkat_time.trim() : "";
    const pulang_time =
      typeof body.pulang_time === "string" ? body.pulang_time.trim() : "";
    const graceRaw = Number(body.grace_minutes ?? 0);
    const sound_enabled =
      typeof body.sound_enabled === "boolean" ? body.sound_enabled : true;
    const telegram_enabled =
      typeof body.telegram_enabled === "boolean" ? body.telegram_enabled : true;

    if (!TIME_RE.test(berangkat_time) || !TIME_RE.test(pulang_time)) {
      return NextResponse.json(
        { error: "Format jam harus HH:mm (contoh: 08:00 dan 17:00)" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(graceRaw) || graceRaw < 0 || graceRaw > 120) {
      return NextResponse.json(
        { error: "Jeda toleransi harus antara 0 hingga 120 menit" },
        { status: 400 }
      );
    }

    const rawDays = Array.isArray(body.active_days) ? body.active_days : [];
    const active_days = Array.from(
      new Set(
        rawDays
          .map((d) => Number(d))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      )
    ).sort((a, b) => a - b);

    if (active_days.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal 1 hari aktif" },
        { status: 400 }
      );
    }

    const updated = await updateAttendanceReminderSettings({
      enabled,
      berangkat_time,
      pulang_time,
      grace_minutes: graceRaw,
      active_days,
      sound_enabled,
      telegram_enabled,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Gagal menyimpan pengaturan alarm absen" },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("PUT /api/attendance/reminder-settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
