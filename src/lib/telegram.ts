import { COPY } from "./copy";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  return token;
}

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  photo?: Array<{
    file_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

export async function sendMessage(chatId: number | string, text: string): Promise<boolean> {
  try {
    const token = getBotToken();
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram sendMessage error:", data);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Telegram sendMessage error:", error);
    return false;
  }
}

export async function setWebhook(url: string): Promise<boolean> {
  try {
    const token = getBotToken();
    const res = await fetch(`${TELEGRAM_API}${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    console.log("Telegram setWebhook response:", data);
    return data.ok === true;
  } catch (error) {
    console.error("Telegram setWebhook error:", error);
    return false;
  }
}

export async function getWebhookInfo(): Promise<{ url: string; ok: boolean } | null> {
  try {
    const token = getBotToken();
    const res = await fetch(`${TELEGRAM_API}${token}/getWebhookInfo`);
    const data = await res.json();
    if (data.ok) {
      return { url: data.result.url, ok: true };
    }
    return null;
  } catch {
    return null;
  }
}

export async function downloadFile(fileId: string): Promise<Buffer | null> {
  try {
    const token = getBotToken();

    // Get file info
    const fileRes = await fetch(`${TELEGRAM_API}${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) {
      console.error("Telegram getFile failed:", fileData);
      return null;
    }

    // Download the file
    const url = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
    const downloadRes = await fetch(url);
    if (!downloadRes.ok) {
      console.error("Telegram file download failed:", downloadRes.status);
      return null;
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Telegram downloadFile error:", error);
    return null;
  }
}

export function formatTaskNotification(task: {
  title: string;
  priority: string;
  location_name: string;
  deadline?: string;
  description?: string;
}): string {
  const priorityEmoji =
    task.priority === "critical"
      ? "🔴"
      : task.priority === "high"
      ? "🟠"
      : task.priority === "medium"
      ? "🟡"
      : "⚪";

  let msg = `<b>${priorityEmoji} ${COPY.telegram.newTaskAssigned}</b>\n\n`;
  msg += `<b>${task.title}</b>\n`;
  msg += `${COPY.telegram.priority}: ${task.priority.toUpperCase()}\n`;
  msg += `${COPY.telegram.location}: ${task.location_name}\n`;
  if (task.deadline) {
    const d = new Date(task.deadline);
    msg += `${COPY.telegram.deadline}: ${d.toLocaleString()}\n`;
  }
  if (task.description) {
    msg += `\n${task.description}\n`;
  }
  msg += `\n${COPY.telegram.shareLocationPrompt}`;
  return msg;
}
