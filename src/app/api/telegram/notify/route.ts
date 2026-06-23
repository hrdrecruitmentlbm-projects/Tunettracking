import { NextRequest, NextResponse } from "next/server";
import { sendMessage, formatTaskNotification } from "@/lib/telegram";
import { getTelegramChatId } from "@/lib/telegram-cache";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, type } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Get user's telegram_id from DB
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, telegram_id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.telegram_id) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "User has no Telegram username configured",
      });
    }

    const chatId = getTelegramChatId(user.telegram_id);
    if (!chatId) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason:
          "User hasn't started the bot yet. They need to send /start to @TuTrackTrackingBot",
      });
    }

    // Send notification
    const text = title
      ? `<b>${title}</b>\n\n${message || ""}`
      : message || "You have a new notification";

    const success = await sendMessage(chatId, text);

    return NextResponse.json({ ok: success });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function notifyTaskAssigned(
  userId: string,
  task: {
    title: string;
    priority: string;
    location_name: string;
    deadline?: string;
    description?: string;
  }
): Promise<boolean> {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, telegram_id")
      .eq("id", userId)
      .single();

    if (userError || !user || !user.telegram_id) return false;

    const chatId = getTelegramChatId(user.telegram_id);
    if (!chatId) return false;

    const message = formatTaskNotification(task);
    return await sendMessage(chatId, message);
  } catch (error) {
    console.error("notifyTaskAssigned error:", error);
    return false;
  }
}
