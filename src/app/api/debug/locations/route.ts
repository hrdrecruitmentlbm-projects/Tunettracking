import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Missing 'date' query param (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const targetDate = new Date(date + "T00:00:00Z");
  if (Number.isNaN(targetDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  // Also probe ±1 and ±2 days to catch any off-by-one timezone issues.
  const offsets = [-2, -1, 0, 1, 2];
  const dates = offsets.map((d) => {
    const dt = new Date(targetDate);
    dt.setUTCDate(dt.getUTCDate() + d);
    return dt.toISOString().slice(0, 10);
  });

  const [pingsRes, visitsRes, storageRes] = await Promise.all([
    supabase
      .from("location_pings")
      .select("id, user_id, session_date, ping_number, lat, lng, source, created_at")
      .in("session_date", dates)
      .order("session_date", { ascending: false })
      .order("ping_number", { ascending: true })
      .limit(500),
    supabase
      .from("location_visits")
      .select("id, user_id, session_date, visit_number, lat, lng, arrived_at, departed_at, source")
      .in("session_date", dates)
      .order("session_date", { ascending: false })
      .order("visit_number", { ascending: true })
      .limit(500),
    supabase.rpc("get_storage_stats"),
  ]);

  // Group pings by session_date for easy scanning.
  const pingsByDate: Record<string, unknown[]> = {};
  for (const row of pingsRes.data ?? []) {
    const sd = (row as { session_date: string }).session_date;
    pingsByDate[sd] = pingsByDate[sd] ?? [];
    pingsByDate[sd].push(row);
  }
  const visitsByDate: Record<string, unknown[]> = {};
  for (const row of visitsRes.data ?? []) {
    const sd = (row as { session_date: string }).session_date;
    visitsByDate[sd] = visitsByDate[sd] ?? [];
    visitsByDate[sd].push(row);
  }

  return NextResponse.json({
    targetDate: date,
    probedDates: dates,
    pingsByDate,
    visitsByDate,
    pingsError: pingsRes.error?.message ?? null,
    visitsError: visitsRes.error?.message ?? null,
    storageStats: storageRes.data ?? null,
  });
}
