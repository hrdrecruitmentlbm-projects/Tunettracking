import { NextRequest, NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram-sender";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const secretHeader = request.headers.get("x-webhook-secret");
  console.log("[supabase-webhook] hit! headers:", Object.fromEntries(request.headers.entries()));
  if (WEBHOOK_SECRET) {
    if (secretHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => null);
  console.log("[supabase-webhook] body:", JSON.stringify(body)?.slice(0, 500));

  const record = body?.record;
  const notificationId = record?.id;
  const eventType = body?.event ?? body?.type;

  console.log("[supabase-webhook] eventType:", eventType, "notificationId:", notificationId);

  if (eventType !== "INSERT" || !notificationId) {
    console.log("[supabase-webhook] skipped: non-insert or no id");
    return NextResponse.json({ ok: true, skipped: "non-insert or no id" });
  }

  console.log("[supabase-webhook] dispatching notification:", notificationId);
  const result = await sendTelegramNotification(notificationId);
  console.log("[supabase-webhook] result:", JSON.stringify(result));

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
