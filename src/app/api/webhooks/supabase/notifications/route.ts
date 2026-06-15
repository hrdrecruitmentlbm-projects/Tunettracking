import { NextRequest, NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram-sender";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const secretHeader = request.headers.get("x-webhook-secret");
  if (WEBHOOK_SECRET) {
    if (secretHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  } else {
    console.warn(
      "[supabase-webhook] WEBHOOK_SECRET not configured — accepting unauthenticated requests. Set WEBHOOK_SECRET in env to harden."
    );
  }

  const body = await request.json().catch(() => null);

  // Supabase Database Webhook payload format:
  //   { type: "INSERT", table: "notifications", record: { id, user_id, ... }, schema, old_record: null }
  const record = body?.record;
  const notificationId = record?.id;
  const eventType = body?.type;

  if (eventType !== "INSERT" || !notificationId) {
    return NextResponse.json({ ok: true, skipped: "non-insert or no id" });
  }

  const result = await sendTelegramNotification(notificationId);

  if (!result.ok) {
    console.error(
      "[supabase-webhook] dispatch failed for",
      notificationId,
      result.error,
      result.detail
    );
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, skipped: result.skipped });
}

export async function GET() {
  return NextResponse.json({
    status: "Supabase notifications webhook is active",
    timestamp: new Date().toISOString(),
  });
}
