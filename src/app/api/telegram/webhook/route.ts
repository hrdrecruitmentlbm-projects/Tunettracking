import { NextRequest, NextResponse } from "next/server";
import { sendMessage, TelegramUpdate } from "@/lib/telegram";
import {
  findUserByPin,
  bindTelegramChat,
  findUserByTelegramUsername,
  findUserByTelegramChatId,
  upsertLocation,
  recordPing,
  fetchTasks,
  createNotification,
  getSessionDate,
} from "@/lib/db";
import { User, STATUS_CONFIG, TaskStatus } from "@/types";
import { cacheTelegramChat, cacheUserChat } from "@/lib/telegram-cache";
import { COPY } from "@/lib/copy";

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    // Handle edited_message (live location updates) BEFORE the early-return on missing message
    const editedMessage = update.edited_message;
    if (editedMessage?.location) {
      const chatId = editedMessage.chat.id;
      const user = await findUserByTelegramChatId(chatId);
      if (user) {
        await upsertLocation(
          user.id,
          editedMessage.location.latitude,
          editedMessage.location.longitude,
          undefined,
          "telegram_live"
        );
        // Create numbered ping for route history (ON CONFLICT prevents duplicates)
        await recordPing(
          user.id,
          editedMessage.location.latitude,
          editedMessage.location.longitude,
          "telegram_live",
          getSessionDate()
        );
      }
      return NextResponse.json({ ok: true });
    }

    const message = update.message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const username = message.from.username;
    const text = (message.text || "").trim();
    const location = message.location;

    // Opportunistic username cache (DB is the source of truth, this is a hot-path accelerator)
    if (username) {
      cacheTelegramChat(username, chatId);
    }

    // ============================================================
    // STEP 1: Identify the sender.
    //
    //   a) message.text is a 4-digit PIN -> findUserByPin
    //   b) from.username set            -> findUserByTelegramUsername
    //   c) chat.id already in DB        -> findUserByTelegramChatId
    //
    // If a candidate is found, persist the binding to DB and update the
    // in-memory cache. The DB write makes the link survive server restarts.
    // ============================================================
    let user: User | null = null;
    let bindHappened = false;
    const isPinAttempt = /^\d{4}$/.test(text);

    if (isPinAttempt) {
      const matched = await findUserByPin(text);
      if (matched) {
        if (matched.telegram_chat_id !== chatId) {
          const ok = await bindTelegramChat(matched.id, chatId, username);
          if (ok) bindHappened = true;
        }
        cacheUserChat(matched.id, chatId);
        user = matched;
      }
    }

    if (!user && username) {
      const matched = await findUserByTelegramUsername(`@${username}`);
      if (matched) {
        if (matched.telegram_chat_id !== chatId) {
          const ok = await bindTelegramChat(matched.id, chatId, undefined);
          if (ok) bindHappened = true;
        }
        cacheUserChat(matched.id, chatId);
        user = matched;
      }
    }

    if (!user) {
      user = await findUserByTelegramChatId(chatId);
    }

    // ============================================================
    // STEP 2: Handle unlinked senders
    // ============================================================
    if (!user) {
      if (isPinAttempt) {
        await sendMessage(chatId, COPY.telegram.pinNotRecognized);
      } else {
        await sendMessage(chatId, COPY.telegram.welcomeWithPin);
      }
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // STEP 3: Confirm a fresh PIN-based binding
    // ============================================================
    if (isPinAttempt && bindHappened) {
      await sendMessage(chatId, COPY.telegram.linked(user.name));
      return NextResponse.json({ ok: true });
    }

    // If they re-sent a PIN but we didn't rebind (already linked to this chat), acknowledge it
    if (isPinAttempt && !bindHappened) {
      await sendMessage(chatId, COPY.telegram.alreadyLinked(user.name));
      return NextResponse.json({ ok: true });
    }

    // ============================================================
    // STEP 4: Handle commands and content for an identified user
    // ============================================================

    if (text === "/start") {
      await sendMessage(chatId, COPY.telegram.alreadyLinked(user.name));
      return NextResponse.json({ ok: true });
    }

    if (text === "/help") {
      await sendMessage(chatId, COPY.telegram.help);
      return NextResponse.json({ ok: true });
    }

    if (text === "/tasks") {
      const tasks = await fetchTasks();
      const myTasks = tasks.filter((t) => t.assigned_to === user.id);
      const activeTasks = myTasks.filter((t) => t.status !== "done");

      if (activeTasks.length === 0) {
        await sendMessage(chatId, COPY.telegram.noActiveTasks);
        return NextResponse.json({ ok: true });
      }

      let taskMsg = COPY.telegram.activeTasksHeader(activeTasks.length);
      activeTasks.slice(0, 5).forEach((task) => {
        const emoji =
          task.priority === "critical"
            ? "🔴"
            : task.priority === "high"
            ? "🟠"
            : task.priority === "medium"
            ? "🟡"
            : "⚪";
        taskMsg += `${emoji} <b>${task.title}</b>\n`;
        taskMsg += `   ${COPY.telegram.tasksLocation} ${task.location_name}\n`;
        if (task.deadline) {
          taskMsg += `   ${COPY.telegram.tasksDeadline} ${new Date(task.deadline).toLocaleString()}\n`;
        }
        const statusLabel = STATUS_CONFIG[task.status as TaskStatus]?.label || task.status;
        taskMsg += `   ${COPY.telegram.statusLabel(statusLabel)}\n\n`;
      });

      await sendMessage(chatId, taskMsg);
      return NextResponse.json({ ok: true });
    }

    if (location) {
      const success = await upsertLocation(
        user.id,
        location.latitude,
        location.longitude,
        undefined,
        "telegram_request"
      );

      // Create numbered ping for route history (ON CONFLICT prevents duplicates)
      await recordPing(
        user.id,
        location.latitude,
        location.longitude,
        "telegram_request",
        getSessionDate()
      );

      if (success) {
        await sendMessage(
          chatId,
          COPY.telegram.locationSendSuccess(location.latitude, location.longitude)
        );
        await createNotification(
          user.id,
          COPY.telegram.locationReceivedTitle,
          COPY.telegram.locationReceivedMessage(new Date().toLocaleTimeString()),
          "status_update"
        );
      } else {
        await sendMessage(chatId, COPY.telegram.failedToSaveLocation);
      }
      return NextResponse.json({ ok: true });
    }

    if (text) {
      await sendMessage(chatId, COPY.telegram.fallback(text));
    }

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
