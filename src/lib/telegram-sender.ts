import { supabase } from "@/lib/supabase";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const STATUS_LABEL: Record<string, string> = {
  todo: "Belum dimulai",
  assigned: "Ditugaskan",
  in_progress: "Dikerjakan",
  review: "Review",
  done: "Selesai",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type SendResult =
  | { ok: true; skipped?: "already_claimed" | "no_chat_id" | "no_metadata" }
  | { ok: false; error: string; detail?: string };

export async function sendTelegramNotification(
  notificationId: string
): Promise<SendResult> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_notification",
    { p_notification_id: notificationId }
  );

  if (claimError) {
    return { ok: false, error: "Claim failed", detail: claimError.message };
  }

  if (!claimed) {
    return { ok: true, skipped: "already_claimed" };
  }

  const { data: notif, error } = await supabase
    .from("notifications")
    .select(`*, user:users(telegram_chat_id, name)`)
    .eq("id", notificationId)
    .single();

  if (error || !notif) {
    return {
      ok: false,
      error: "Notification not found after claim",
      detail: error?.message,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRow = notif.user as any;
  const chatId = userRow?.telegram_chat_id;

  if (!chatId) {
    return { ok: true, skipped: "no_chat_id" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = notif.metadata as any;
  if (!metadata) {
    return { ok: true, skipped: "no_metadata" };
  }

  const taskId = metadata.task_id;
  const title = metadata?.title ?? "Tugas";
  const location = metadata?.location_name ?? "—";
  const statusRaw = metadata?.status ?? "todo";
  const statusLabel = STATUS_LABEL[statusRaw] ?? statusRaw;

  const isReassignment = notif.type === "status_update";
  const isCompleted = notif.type === "completed";

  let text: string;
  if (isCompleted) {
    text =
      `<b>Tugas telah selesai</b>\n\n` +
      `Tugas "${escapeHtml(title)}" di ${escapeHtml(location)} telah diselesaikan.`;
  } else if (isReassignment) {
    text =
      `<b>Penanggung jawab telah diganti</b>\n\n` +
      `Tugas "${escapeHtml(title)}" di ${escapeHtml(location)} telah dialihkan ke teknisi lain.`;
  } else {
    text =
      `<b>Tugas baru telah ditambahkan</b>\n\n` +
      `Kamu telah ditugaskan untuk "${escapeHtml(title)}" bertempat di "${escapeHtml(location)}"\n` +
      `Status : ${escapeHtml(statusLabel)}`;
  }

  const reply_markup = taskId
    ? {
        inline_keyboard: isReassignment
          ? [[{ text: "📋 Lihat Tugas", url: `${APP_URL}/dashboard/foc` }]]
          : [
              [
                { text: "📋 Lihat Tugas", url: `${APP_URL}/dashboard/foc` },
                ...(isCompleted
                  ? []
                  : [{ text: "📍 Perbarui Lokasi", request_location: true }]),
              ],
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
      .eq("id", notificationId);

    return { ok: false, error: "Telegram API error", detail: errBody };
  }

  return { ok: true };
}
