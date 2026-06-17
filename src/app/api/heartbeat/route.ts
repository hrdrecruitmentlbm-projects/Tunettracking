import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Online threshold: 1 minute since last heartbeat
const ACTIVE_THRESHOLD_MS = 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id } = body as { user_id?: string };

    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_sessions")
      .upsert({ user_id, last_seen: new Date().toISOString() });

    if (error) {
      console.error("Heartbeat upsert error:", error);
      return NextResponse.json(
        { error: "Heartbeat failed", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Heartbeat endpoint error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const thresholdIso = new Date(Date.now() - ACTIVE_THRESHOLD_MS).toISOString();

    const { count, error } = await supabase
      .from("user_sessions")
      .select("user_id", { count: "exact", head: true })
      .gt("last_seen", thresholdIso);

    if (error) {
      console.error("Active count error:", error);
      return NextResponse.json(
        { error: "Failed to count active users", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activeCount: count ?? 0,
      thresholdMs: ACTIVE_THRESHOLD_MS,
    });
  } catch (err) {
    console.error("Active count endpoint error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
