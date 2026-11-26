import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getApiSession, requireRole } from "@/lib/api-auth";
import {
  getAttendanceReminderSettings,
  getJakartaClock,
  getMissingAttendanceForDate,
  getSentReminderUserIds,
  parseTimeToMinutes,
  recordReminderSent,
} from "@/lib/db-attendance";
import { sendMessage } from "@/lib/telegram";
import { getTelegramChatId } from "@/lib/telegram-cache";
import type { AttendanceType } from "@/types";

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

function verifyCronSecret(request: NextRequest): boolean {
  const expected =
    process.env.REMINDER_SECRET || process.env.CLEANUP_SECRET || "";
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  const bearer =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
  const provided =
    request.headers.get("x-reminder-secret") ||
    request.headers.get("x-cleanup-secret") ||
    bearer;

  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * POST /api/attendance/reminders/trigger
 * Checks who has not clocked in/out past the configured schedule and sends
 * Telegram reminders. Accessible by an authenticated admin or a cron job
 * carrying REMINDER_SECRET / CLEANUP_SECRET.
 */
export async function POST(request: NextRequest) {
  try {
    const hasCronSecret = verifyCronSecret(request);
    if (!hasCronSecret) {
      if (!verifySameOrigin(request)) {
        return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
      }
      const session = getApiSession(request);
      if (!requireRole(session, ["admin"])) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json().catch(() => ({}))) as {
      force?: boolean;
      type?: AttendanceType;
    };
    const force = body.force === true;

    const settings = await getAttendanceReminderSettings();
    if (!settings.enabled && !force) {
      return NextResponse.json({
        ok: true,
        skippedReason: "Pengingat absen sedang dinonaktifkan",
        missingCount: 0,
        sentCount: 0,
      });
    }

    const clock = getJakartaClock();
    if (!settings.active_days.includes(clock.weekday) && !force) {
      return NextResponse.json({
        ok: true,
        skippedReason: "Hari ini bukan hari kerja aktif",
        missingCount: 0,
        sentCount: 0,
      });
    }

    const berangkatTriggerMin =
      parseTimeToMinutes(settings.berangkat_time) + settings.grace_minutes;
    const pulangTriggerMin =
      parseTimeToMinutes(settings.pulang_time) + settings.grace_minutes;

    let targetType: AttendanceType | null =
      body.type === "berangkat" || body.type === "pulang" ? body.type : null;

    if (!targetType) {
      if (clock.minutes >= pulangTriggerMin) {
        targetType = "pulang";
      } else if (clock.minutes >= berangkatTriggerMin) {
        targetType = "berangkat";
      } else if (force) {
        targetType = "berangkat";
      }
    }

    if (!targetType) {
      return NextResponse.json({
        ok: true,
        skippedReason: `Belum melewati jam pengingat (${settings.berangkat_time} WIB)`,
        missingCount: 0,
        sentCount: 0,
      });
    }

    const [missingUsers, alreadySent] = await Promise.all([
      getMissingAttendanceForDate(clock.date, targetType),
      getSentReminderUserIds(clock.date, targetType),
    ]);

    const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    let sentCount = 0;

    if (settings.telegram_enabled && telegramConfigured) {
      const targetTime =
        targetType === "berangkat"
          ? settings.berangkat_time
          : settings.pulang_time;
      const typeLabel =
        targetType === "berangkat" ? "Absen Berangkat" : "Absen Pulang";

      for (const emp of missingUsers) {
        if (!force && alreadySent.has(emp.id)) continue;

        const chatId =
          emp.telegram_chat_id ||
          (emp.telegram_id ? getTelegramChatId(emp.telegram_id) : null);
        if (!chatId) continue;

        const message =
          `⏰ <b>Pengingat ${typeLabel}</b>\n\n` +
          `Halo ${escapeHtml(emp.name)}, Anda belum tercatat <b>${typeLabel}</b> hari ini (${clock.date}).\n` +
          `Jadwal: <b>${targetTime} WIB</b> (sekarang ${clock.time} WIB).\n\n` +
          `Silakan buka TuTrack dan lakukan absensi sekarang.`;

        const ok = await sendMessage(chatId, message);
        if (ok) {
          sentCount++;
          await recordReminderSent(clock.date, targetType, emp.id);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      date: clock.date,
      currentWibTime: clock.time,
      type: targetType,
      missingCount: missingUsers.length,
      missingUsers: missingUsers.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
      })),
      sentCount,
      telegramConfigured,
    });
  } catch (error) {
    console.error("POST /api/attendance/reminders/trigger error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
