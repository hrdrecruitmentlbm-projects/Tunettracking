import { NextRequest, NextResponse } from "next/server";
import { sendMessage, TelegramUpdate } from "@/lib/telegram";
import { findUserByTelegramUsername, upsertLocation, fetchTasks, createNotification } from "@/lib/db";
import { cacheTelegramChat } from "@/lib/telegram-cache";

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    const message = update.message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const username = message.from.username;
    const text = message.text || "";
    const location = message.location;

    // Cache the chat_id for this username so we can send notifications later
    if (username) {
      cacheTelegramChat(username, chatId);
    }

    // Handle /start command
    if (text === "/start") {
      const welcomeMsg = username
        ? `👋 Welcome to TunetOps!\n\nI found your username: @${username}\n\nTo start sharing your location with the team:\n1. Tap 📎 (attach)\n2. Select Location\n3. Share your current location\n\nYou'll appear on the radar map in real-time!`
        : `👋 Welcome to TunetOps!\n\nPlease set a Telegram username in your Telegram settings, then send /start again.`;

      await sendMessage(chatId, welcomeMsg);
      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (text === "/help") {
      const helpMsg = `🤖 <b>TunetOps Bot Commands</b>\n\n/start - Welcome message\n/help - Show this help\n/tasks - Show your assigned tasks\n\n📍 To share your location:\nTap 📎 → Location → Share\n\nYour location will appear on the radar map in real-time.`;

      await sendMessage(chatId, helpMsg);
      return NextResponse.json({ ok: true });
    }

    // Handle /tasks command
    if (text === "/tasks") {
      if (!username) {
        await sendMessage(chatId, "❌ Please set a Telegram username first.");
        return NextResponse.json({ ok: true });
      }

      const user = await findUserByTelegramUsername(`@${username}`);
      if (!user) {
        await sendMessage(
          chatId,
          `❌ No TunetOps account found for @${username}.\n\nAsk your admin to add your Telegram username to your staff profile.`
        );
        return NextResponse.json({ ok: true });
      }

      const tasks = await fetchTasks();
      const myTasks = tasks.filter((t) => t.assigned_to === user.id);
      const activeTasks = myTasks.filter((t) => t.status !== "done");

      if (activeTasks.length === 0) {
        await sendMessage(chatId, "✅ No active tasks. You're all caught up!");
        return NextResponse.json({ ok: true });
      }

      let taskMsg = `📋 <b>Your Active Tasks (${activeTasks.length})</b>\n\n`;
      activeTasks.slice(0, 5).forEach((task, idx) => {
        const emoji =
          task.priority === "critical"
            ? "🔴"
            : task.priority === "high"
            ? "🟠"
            : task.priority === "medium"
            ? "🟡"
            : "⚪";
        taskMsg += `${emoji} <b>${task.title}</b>\n`;
        taskMsg += `   📍 ${task.location_name}\n`;
        if (task.deadline) {
          taskMsg += `   ⏰ ${new Date(task.deadline).toLocaleString()}\n`;
        }
        taskMsg += `   Status: ${task.status}\n\n`;
      });

      await sendMessage(chatId, taskMsg);
      return NextResponse.json({ ok: true });
    }

    // Handle location sharing
    if (location) {
      if (!username) {
        await sendMessage(chatId, "❌ Please set a Telegram username first.");
        return NextResponse.json({ ok: true });
      }

      const user = await findUserByTelegramUsername(`@${username}`);
      if (!user) {
        await sendMessage(
          chatId,
          `❌ No TunetOps account found for @${username}.\n\nAsk your admin to add your Telegram username to your staff profile.`
        );
        return NextResponse.json({ ok: true });
      }

      const success = await upsertLocation(
        user.id,
        location.latitude,
        location.longitude
      );

      if (success) {
        await sendMessage(
          chatId,
          `✅ Location shared!\n\n📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\nNOC can now see you on the radar map.`
        );

        // Also create a notification in the app
        await createNotification(
          user.id,
          "Location Shared",
          `Location updated via Telegram at ${new Date().toLocaleTimeString()}`,
          "status_update"
        );
      } else {
        await sendMessage(chatId, "❌ Failed to save location. Please try again.");
      }

      return NextResponse.json({ ok: true });
    }

    // Default fallback
    await sendMessage(
      chatId,
      `I received: "${text}"\n\nSend /help to see available commands.`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Telegram webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
