import { NextResponse } from "next/server";
import { getSessionDate } from "@/lib/db";

export async function GET() {
  // Compute session date for "now" and for a few sample timestamps so
  // the user can verify the 06:00 WIB day-reset boundary works correctly.
  const now = new Date();
  const samples = [
    { label: "now", date: now },
    { label: "today_00:00_WIB", date: new Date("2026-06-17T00:00:00+07:00") },
    { label: "today_05:59_WIB", date: new Date("2026-06-17T05:59:00+07:00") },
    { label: "today_06:00_WIB", date: new Date("2026-06-17T06:00:00+07:00") },
    { label: "today_23:59_WIB", date: new Date("2026-06-17T23:59:00+07:00") },
  ];

  const results = samples.map(({ label, date }) => ({
    label,
    inputIso: date.toISOString(),
    inputUtc: date.toUTCString(),
    sessionDate: getSessionDate(date),
  }));

  return NextResponse.json({
    now: now.toISOString(),
    serverSessionDate: getSessionDate(now),
    samples: results,
  });
}
