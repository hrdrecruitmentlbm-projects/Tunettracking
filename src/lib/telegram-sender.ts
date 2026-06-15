import { supabase } from "@/lib/supabase";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

const STATUS_LABEL: Record<string, string> = {
  todo: "Belum dimulai",
  assigned: "Ditugaskan",
  in_progress: "Dikerjakan",
  review: "Review",
  done: "Selesai",
};

const PRIORITY_LABEL: Record<string, { emoji: string; label: string }> = {
  urgent: { emoji: "🔴", label: "Urgent" },
  high: { emoji: "🟠", label: "Tinggi" },
  medium: { emoji: "🟡", label: "Sedang" },
  low: { emoji: "⚪", label: "Rendah" },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "Tidak Ada";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "Tidak Ada";
  const formatted = d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatted} WIB`;
}

export type SendResult =
  | { ok: true; skipped?: "already_claimed" | "no_chat_id" | "no_metadata" | "no_change" }
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
  const description = metadata?.description ?? "";
  const priorityRaw = metadata?.priority ?? "medium";
  const priorityInfo = PRIORITY_LABEL[priorityRaw] ?? PRIORITY_LABEL.medium;
  const statusRaw = metadata?.status ?? "todo";
  const statusLabel = STATUS_LABEL[statusRaw] ?? statusRaw;
  const deadlineText = formatDeadline(metadata?.deadline);

  const isReassignment = notif.type === "status_update";
  const isCompleted = notif.type === "completed";

  // Guard: skip reassignment notification if assignee didn't actually change
  if (isReassignment && metadata?.previous_assignee && metadata?.new_assignee) {
    if (metadata.previous_assignee === metadata.new_assignee) {
      return { ok: true, skipped: "no_change" };
    }
  }

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
    const lines: string[] = [
      `<b>📋 Tugas baru telah ditambahkan</b>`,
      ``,
      `<b>Judul:</b> ${escapeHtml(title)}`,
      `<b>Lokasi:</b> ${escapeHtml(location)}`,
      `<b>Prioritas:</b> ${priorityInfo.emoji} ${priorityInfo.label}`,
      `<b>Status:</b> ${escapeHtml(statusLabel)}`,
      `<b>Deadline:</b> ${deadlineText}`,
    ];
    if (description.trim()) {
      lines.push(``, `<b>Deskripsi:</b>`, escapeHtml(description));
    }
    text = lines.join("\n");
  }

  // No buttons on any notification type (message is fully detailed; location is in the second message)
  const reply_markup: Record<string, unknown> | undefined = undefined;

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

  // For new task assignments, send a second message with a location-sharing keyboard
  if (!isReassignment && !isCompleted && taskId) {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            `<b>📍 Bagikan lokasi Anda</b>\n\n` +
            `Untuk update posisi satu kali, ketuk tombol di bawah.\n` +
            `Untuk live tracking, tap 📎 → Location → Share Live Location.`,
          reply_markup: {
            keyboard: [[{ text: "📍 Perbarui Lokasi", request_location: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }),
      }
    );
  }

  return { ok: true };
}
