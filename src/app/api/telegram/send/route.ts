import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  const { notification_id } = await request.json();
  if (!notification_id) {
    return NextResponse.json(
      { error: "notification_id required" },
      { status: 400 }
    );
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 500 }
    );
  }

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_notification",
    { p_notification_id: notification_id }
  );

  if (claimError) {
    return NextResponse.json(
      { error: "Claim failed", detail: claimError.message },
      { status: 500 }
    );
  }

  if (!claimed) {
    return NextResponse.json({ ok: true, skipped: "already claimed" });
  }

  const { data: notif, error } = await supabase
    .from("notifications")
    .select(`*, user:users(telegram_chat_id, name)`)
    .eq("id", notification_id)
    .single();

  if (error || !notif) {
    return NextResponse.json(
      { error: "Notification not found after claim" },
      { status: 404 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRow = notif.user as any;
  const chatId = userRow?.telegram_chat_id;

  if (!chatId) {
    return NextResponse.json(
      { ok: false, reason: "user has no telegram_chat_id" },
      { status: 200 }
    );
  }

  const text = `<b>${escapeHtml(notif.title)}</b>\n\n${escapeHtml(notif.message)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = notif.metadata as any;
  const taskId = metadata?.task_id;
  const reply_markup = taskId
    ? {
        inline_keyboard: [
          [{ text: "View Task", url: `${APP_URL}/dashboard/foc` }],
        ],
      }
    : undefined;

  const tgRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup,
        parse_mode: "HTML",
      }),
    }
  );

  if (!tgRes.ok) {
    const errBody = await tgRes.text();
    console.error("Telegram API error:", errBody);

    await supabase
      .from("notifications")
      .update({ telegram_sent_at: null })
      .eq("id", notification_id);

    return NextResponse.json(
      { error: "Telegram API error", detail: errBody },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
