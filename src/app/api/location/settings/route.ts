import { NextRequest, NextResponse } from "next/server";
import { getApiSession, requireRole } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";

const DEFAULT_INTERVAL_MINUTES = 2;

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const session = getApiSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("location_tracking_settings")
      .select("id, interval_minutes, updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      return NextResponse.json({
        settings: {
          id: "default",
          interval_minutes: DEFAULT_INTERVAL_MINUTES,
        },
        tableReady: false,
      });
    }

    const minutes =
      typeof data?.interval_minutes === "number" &&
      data.interval_minutes >= 1 &&
      data.interval_minutes <= 60
        ? data.interval_minutes
        : DEFAULT_INTERVAL_MINUTES;

    return NextResponse.json({
      settings: {
        id: "default",
        interval_minutes: minutes,
        updated_at: data?.updated_at ?? null,
      },
      tableReady: true,
    });
  } catch {
    return NextResponse.json({
      settings: {
        id: "default",
        interval_minutes: DEFAULT_INTERVAL_MINUTES,
      },
      tableReady: false,
    });
  }
}

export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const session = getApiSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { interval_minutes?: unknown };
    const parsed = Number(body.interval_minutes);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 60) {
      return NextResponse.json(
        { error: "Interval GPS harus bilangan bulat antara 1 sampai 60 menit" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("location_tracking_settings")
      .upsert(
        {
          id: "default",
          interval_minutes: parsed,
          updated_by: session.userId,
          updated_at: now,
        },
        { onConflict: "id" }
      )
      .select("id, interval_minutes, updated_at")
      .single();

    if (error) {
      const msg = error.message || "";
      if (
        msg.includes("location_tracking_settings") &&
        (msg.includes("does not exist") || msg.includes("schema cache"))
      ) {
        return NextResponse.json(
          {
            error:
              "Tabel location_tracking_settings belum dibuat di Supabase. Jalankan supabase/location-tracking-settings.sql di SQL Editor Supabase.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: msg || "Gagal menyimpan interval pelacakan GPS" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: {
        id: "default",
        interval_minutes: data.interval_minutes,
        updated_at: data.updated_at,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Gagal memproses pengaturan interval GPS",
      },
      { status: 400 }
    );
  }
}
