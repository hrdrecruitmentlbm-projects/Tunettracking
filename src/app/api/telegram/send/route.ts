import { NextRequest, NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram-sender";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const notificationId = body?.notification_id;
  if (!notificationId) {
    return NextResponse.json(
      { error: "notification_id required" },
      { status: 400 }
    );
  }

  const result = await sendTelegramNotification(notificationId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, skipped: result.skipped });
}
