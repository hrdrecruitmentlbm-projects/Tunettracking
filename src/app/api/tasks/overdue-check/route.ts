import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";
import { sendTelegramNotification } from "@/lib/telegram-sender";
import { formatDateTimeWIB, formatLateDuration } from "@/lib/time";

function verifySameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.host === host;
  } catch {
    return false;
  }
}

function verifyCronSecret(request: NextRequest): boolean {
  const expected =
    process.env.REMINDER_SECRET || process.env.CLEANUP_SECRET || "";
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  const bearer =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
  const provided =
    request.headers.get("x-reminder-secret") ||
    request.headers.get("x-cleanup-secret") ||
    bearer;

  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface RawOverdueTask {
  id: string;
  title: string;
  status: string;
  deadline: string;
  created_by: string | null;
  assigned_to: string | null;
  location_name: string | null;
  priority?: { name?: string } | null;
  assignee?: { id: string; name: string } | null;
  creator?: { id: string; name: string } | null;
}

/**
 * POST /api/tasks/overdue-check
 * Scans active tasks whose deadline (WIB) has passed and status !== 'done'.
 * Inserts idempotent 'overdue' notifications (deduped per user_id + task_id + deadline)
 * for both the assigned employee and the assigning leader, and dispatches Telegram alerts.
 */
export async function POST(request: NextRequest) {
  try {
    const hasCronSecret = verifyCronSecret(request);
    let callerRole: string = "cron";

    if (!hasCronSecret) {
      if (!verifySameOrigin(request)) {
        return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
      }
      const session = getApiSession(request);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      callerRole = session.role;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const { data: taskRows, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        status,
        deadline,
        created_by,
        assigned_to,
        location_name,
        priority:priorities(name),
        assignee:users!tasks_assigned_to_fkey(id, name),
        creator:users!tasks_created_by_fkey(id, name)
      `)
      .is("deleted_at", null)
      .neq("status", "done")
      .lt("deadline", nowIso);

    if (tasksError) {
      console.error("POST /api/tasks/overdue-check tasks query error:", tasksError);
      return NextResponse.json({ error: "Failed to check overdue tasks" }, { status: 500 });
    }

    const overdueTasks = ((taskRows || []) as unknown as RawOverdueTask[]).filter(
      (t) => Boolean(t.deadline) && new Date(t.deadline) < now
    );

    if (overdueTasks.length === 0) {
      return NextResponse.json({
        ok: true,
        checkedOverdueTasks: 0,
        notificationsCreated: 0,
        telegramSent: 0,
      });
    }

    // Fetch existing 'overdue' notifications to deduplicate cleanly
    const { data: existingNotifs, error: notifError } = await supabase
      .from("notifications")
      .select("user_id, metadata")
      .eq("type", "overdue")
      .limit(2000);

    if (notifError) {
      console.error("POST /api/tasks/overdue-check existing notifs error:", notifError);
      return NextResponse.json({ error: "Failed to verify existing notifications" }, { status: 500 });
    }

    const sentKeys = new Set<string>();
    for (const row of existingNotifs || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (row as any).metadata as Record<string, unknown> | null;
      const taskId = meta?.task_id ? String(meta.task_id) : "";
      const deadline = meta?.deadline ? String(meta.deadline) : "";
      if (row.user_id && taskId) {
        sentKeys.add(`${row.user_id}::${taskId}::${deadline}`);
      }
    }

    const toInsert: Array<{
      user_id: string;
      type: "overdue";
      title: string;
      message: string;
      metadata: Record<string, unknown>;
    }> = [];

    for (const task of overdueTasks) {
      const deadlineStr = task.deadline;
      const deadlineWib = formatDateTimeWIB(deadlineStr);
      const lateDuration = formatLateDuration(deadlineStr, now);
      const locationName = task.location_name || "Lokasi tidak ditentukan";
      const priorityLower = (task.priority?.name || "medium").toLowerCase();
      const assigneeName = task.assignee?.name || "Belum ditugaskan";

      // 1) Notify assigned employee
      if (task.assigned_to) {
        const key = `${task.assigned_to}::${task.id}::${deadlineStr}`;
        if (!sentKeys.has(key)) {
          sentKeys.add(key);
          toInsert.push({
            user_id: task.assigned_to,
            type: "overdue",
            title: "Tenggat Tugas Terlewat",
            message: `"${task.title}" di ${locationName} melewati tenggat (${deadlineWib}, terlambat ${lateDuration}). Tercatat di Rapot Karyawan.`,
            metadata: {
              task_id: task.id,
              title: task.title,
              location_name: locationName,
              priority: priorityLower,
              status: task.status,
              deadline: deadlineStr,
              assignee_id: task.assigned_to,
              assignee_name: assigneeName,
              recipient_role: "assignee",
            },
          });
        }
      }

      // 2) Notify leader who created/assigned the task (if distinct from assignee)
      if (task.created_by && task.created_by !== task.assigned_to) {
        const leaderKey = `${task.created_by}::${task.id}::${deadlineStr}`;
        if (!sentKeys.has(leaderKey)) {
          sentKeys.add(leaderKey);
          toInsert.push({
            user_id: task.created_by,
            type: "overdue",
            title: task.assigned_to
              ? "Karyawan Melewati Tenggat"
              : "Tugas Tanpa Penugasan Melewati Tenggat",
            message: task.assigned_to
              ? `${assigneeName} belum menyelesaikan "${task.title}" melewati tenggat (${deadlineWib}, terlambat ${lateDuration}).`
              : `Tugas "${task.title}" di ${locationName} melewati tenggat (${deadlineWib}).`,
            metadata: {
              task_id: task.id,
              title: task.title,
              location_name: locationName,
              priority: priorityLower,
              status: task.status,
              deadline: deadlineStr,
              assignee_id: task.assigned_to,
              assignee_name: assigneeName,
              recipient_role: "leader",
            },
          });
        }
      }
    }

    let notificationsCreated = 0;
    let telegramSent = 0;

    if (toInsert.length > 0) {
      const { data: insertedRows, error: insertError } = await supabase
        .from("notifications")
        .insert(toInsert)
        .select("id");

      if (insertError) {
        console.error("POST /api/tasks/overdue-check insert error:", insertError);
        return NextResponse.json({ error: "Failed to record overdue notifications" }, { status: 500 });
      }

      const createdIds = (insertedRows || []).map((r) => String(r.id));
      notificationsCreated = createdIds.length;

      if (process.env.TELEGRAM_BOT_TOKEN && createdIds.length > 0) {
        const results = await Promise.allSettled(
          createdIds.map((id) => sendTelegramNotification(id))
        );
        for (const res of results) {
          if (res.status === "fulfilled" && res.value.ok && !res.value.skipped) {
            telegramSent++;
          }
        }
      }
    }

    const canSeeDetails =
      hasCronSecret || callerRole === "admin" || callerRole === "noc";

    return NextResponse.json({
      ok: true,
      checkedOverdueTasks: overdueTasks.length,
      notificationsCreated,
      telegramSent,
      ...(canSeeDetails
        ? { overdueTaskIds: overdueTasks.map((t) => t.id) }
        : {}),
    });
  } catch (error) {
    console.error("POST /api/tasks/overdue-check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
