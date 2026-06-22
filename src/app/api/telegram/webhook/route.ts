import { NextRequest, NextResponse } from "next/server";
import {
  sendMessage,
  sendMessageWithKeyboard,
  answerCallbackQuery,
  downloadFile,
  TelegramUpdate,
} from "@/lib/telegram";
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
import { uploadTaskAttachment } from "@/lib/db-attachments";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { User, STATUS_CONFIG, TaskStatus } from "@/types";
import { cacheTelegramChat, cacheUserChat } from "@/lib/telegram-cache";
import { COPY } from "@/lib/copy";

const PENDING_PHOTO_TTL_MS = 10 * 60 * 1000;

async function storePendingPhoto(chatId: number, userId: string, fileId: string) {
  const { error } = await supabaseAdmin.from("pending_photo_uploads").upsert({
    chat_id: chatId,
    user_id: userId,
    file_id: fileId,
  });
  if (error) {
    console.error("[tg] storePendingPhoto error:", error);
  }
}

async function getPendingPhoto(chatId: number) {
  const cutoff = new Date(Date.now() - PENDING_PHOTO_TTL_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from("pending_photo_uploads")
    .select("file_id, user_id")
    .eq("chat_id", chatId)
    .gt("created_at", cutoff)
    .maybeSingle();
  if (error) {
    console.error("[tg] getPendingPhoto error:", error);
  }
  return data;
}

async function deletePendingPhoto(chatId: number) {
  const { error } = await supabaseAdmin.from("pending_photo_uploads").delete().eq("chat_id", chatId);
  if (error) {
    console.error("[tg] deletePendingPhoto error:", error);
  }
}

async function fetchAndUploadPhoto(
  chatId: number,
  userId: string,
  fileId: string,
  taskId: string
): Promise<{ success: boolean; title?: string; count?: number; phase?: string }> {
  const fileBuffer = await downloadFile(fileId);
  if (!fileBuffer) {
    await sendMessage(chatId, COPY.telegram.photoDownloadFailed);
    return { success: false };
  }

  const { data: taskInfo } = await supabase
    .from("tasks")
    .select("id, title, status, assigned_to")
    .eq("id", taskId)
    .maybeSingle();

  if (!taskInfo) {
    await sendMessage(chatId, `Tugas dengan ID "${taskId}" tidak ditemukan.`);
    return { success: false };
  }

  const { attachment } = await uploadTaskAttachment(
    taskInfo.id,
    userId,
    fileBuffer,
    `telegram_${Date.now()}.jpg`
  );

  if (!attachment) {
    await sendMessage(chatId, COPY.telegram.photoUploadFailed);
    return { success: false };
  }

  const phaseLabel = attachment.upload_phase === "completed" ? "selesai" : "proses";

  const { count } = await supabase
    .from("task_attachments")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskInfo.id);

  await sendMessage(
    chatId,
    COPY.telegram.photoUploaded(
      taskInfo.title,
      count ?? 1,
      phaseLabel
    )
  );

  return {
    success: true,
    title: taskInfo.title,
    count: count ?? 1,
    phase: phaseLabel,
  };
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    console.log(`[tg] id=${update.update_id} edited=${!!update.edited_message} loc=${!!update.message?.location}`);

    // Handle edited_message (live location updates) BEFORE the early-return on missing message
    const editedMessage = update.edited_message;
    if (editedMessage?.location) {
      const chatId = editedMessage.chat.id;
      const user = await findUserByTelegramChatId(chatId);
      if (user) {
        const upsertResult = await upsertLocation(
          user.id,
          editedMessage.location.latitude,
          editedMessage.location.longitude,
          undefined,
          "telegram_live"
        );
        if (!upsertResult.ok) {
          await supabase.from("error_log").insert({
            source: "telegram-webhook",
            step: "live upsertLocation",
            user_id: user.id,
            error: upsertResult.error || "unknown",
            payload: { update_id: update.update_id },
          });
        }
        const pingResult = await recordPing(
          user.id,
          editedMessage.location.latitude,
          editedMessage.location.longitude,
          "telegram_live",
          getSessionDate()
        );
        if (!pingResult.ok) {
          await supabase.from("error_log").insert({
            source: "telegram-webhook",
            step: "live recordPing",
            user_id: user.id,
            error: pingResult.error || "unknown",
            payload: { update_id: update.update_id },
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Handle callback_query (inline keyboard button taps from photo selection)
    const callbackQuery = update.callback_query;
    if (callbackQuery?.data?.startsWith("photo_task:")) {
      const chatId = callbackQuery.message?.chat.id;
      if (!chatId) {
        await answerCallbackQuery(callbackQuery.id, "Error: chat tidak ditemukan");
        return NextResponse.json({ ok: true });
      }

      const taskId = callbackQuery.data.slice("photo_task:".length);
      const pending = await getPendingPhoto(chatId);

      if (!pending) {
        await answerCallbackQuery(callbackQuery.id, COPY.telegram.photoExpired, true);
        await sendMessage(chatId, COPY.telegram.photoExpired);
        return NextResponse.json({ ok: true });
      }

      const user = await findUserByTelegramChatId(chatId);
      if (!user) {
        await answerCallbackQuery(callbackQuery.id, "User tidak ditemukan", true);
        await deletePendingPhoto(chatId);
        return NextResponse.json({ ok: true });
      }

      await answerCallbackQuery(callbackQuery.id, "⏳ Mengunggah foto...");

      await deletePendingPhoto(chatId);
      await fetchAndUploadPhoto(chatId, user.id, pending.file_id, taskId);
      return NextResponse.json({ ok: true });
    }

    // Cancel button: "photo_cancel"
    if (callbackQuery?.data === "photo_cancel") {
      const chatId = callbackQuery.message?.chat.id;
      if (chatId) {
        await deletePendingPhoto(chatId);
        await answerCallbackQuery(callbackQuery.id, COPY.telegram.photoCancelled);
        await sendMessage(chatId, COPY.telegram.photoCancelled);
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
      const upsertResult = await upsertLocation(
        user.id,
        location.latitude,
        location.longitude,
        undefined,
        "telegram_request"
      );

      if (!upsertResult.ok) {
        await supabase.from("error_log").insert({
          source: "telegram-webhook",
          step: "one-time upsertLocation",
          user_id: user.id,
          error: upsertResult.error || "unknown",
          payload: { update_id: update.update_id, lat: location.latitude, lng: location.longitude },
        });
      }

      // Create numbered ping for route history (ON CONFLICT prevents duplicates)
      const pingResult = await recordPing(
        user.id,
        location.latitude,
        location.longitude,
        "telegram_request",
        getSessionDate()
      );

      if (!pingResult.ok) {
        await supabase.from("error_log").insert({
          source: "telegram-webhook",
          step: "one-time recordPing",
          user_id: user.id,
          error: pingResult.error || "unknown",
          payload: { update_id: update.update_id, lat: location.latitude, lng: location.longitude },
        });
        if (upsertResult.ok) {
          await sendMessage(chatId, "⚠️ Lokasi tersimpan, tapi gagal membuat ping. Hubungi admin.");
        }
      }

      if (upsertResult.ok) {
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

    // Handle photo messages (task attachment)
    if (message.photo && message.photo.length > 0) {
      const caption = message.caption || "";

      // Try to extract task ID from caption first (backward compat)
      const uuidMatch = caption.match(
        /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
      );
      const shortIdMatch = caption.match(/\b([0-9a-f]{6,})\b/i);
      const captionTaskId = uuidMatch?.[1] || shortIdMatch?.[1];

      // Get largest photo file_id
      const largestPhoto = message.photo[message.photo.length - 1];
      const fileId = largestPhoto.file_id;

      // If caption has a task ID, use it directly
      if (captionTaskId) {
        const { data: task } = await supabase
          .from("tasks")
          .select("id, title, status, assigned_to")
          .or(`id.eq.${captionTaskId},id.ilike.${captionTaskId}%`)
          .maybeSingle();

        if (!task) {
          await sendMessage(chatId, `Tugas dengan ID "${captionTaskId}" tidak ditemukan.`);
          return NextResponse.json({ ok: true });
        }

        const isAdminOrNoc = user.role === "admin" || user.role === "noc";
        if (!isAdminOrNoc && task.assigned_to !== user.id) {
          await sendMessage(chatId, "Anda tidak ditugaskan untuk tugas ini.");
          return NextResponse.json({ ok: true });
        }

        await fetchAndUploadPhoto(chatId, user.id, fileId, task.id);
        return NextResponse.json({ ok: true });
      }

      // No caption ID: fetch active tasks and show selection
      const allTasks = await fetchTasks();
      const myActiveTasks = allTasks.filter(
        (t) => t.assigned_to === user.id && t.status !== "done"
      );

      if (myActiveTasks.length === 0) {
        await sendMessage(chatId, COPY.telegram.photoNoActiveTasks);
        return NextResponse.json({ ok: true });
      }

      // Single active task: auto-assign
      if (myActiveTasks.length === 1) {
        const task = myActiveTasks[0];
        await fetchAndUploadPhoto(chatId, user.id, fileId, task.id);
        return NextResponse.json({ ok: true });
      }

      // Multiple active tasks: store pending photo and show inline keyboard
      await storePendingPhoto(chatId, user.id, fileId);

      const inlineKeyboard = myActiveTasks.slice(0, 8).map((task) => {
        const emoji =
          task.priority === "critical"
            ? "🔴"
            : task.priority === "high"
            ? "🟠"
            : task.priority === "medium"
            ? "🟡"
            : "⚪";
        const statusLabel = STATUS_CONFIG[task.status as TaskStatus]?.label || task.status;
        return [
          {
            text: `${emoji} ${task.title} — ${statusLabel}`,
            callback_data: `photo_task:${task.id}`,
          },
        ];
      });

      // Add cancel button
      inlineKeyboard.push([{ text: "❌ Batal", callback_data: "photo_cancel" }]);

      await sendMessageWithKeyboard(
        chatId,
        COPY.telegram.photoSelectTask(myActiveTasks.length),
        { inline_keyboard: inlineKeyboard }
      );
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
