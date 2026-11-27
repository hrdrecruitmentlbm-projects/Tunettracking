import type { Notification, Task, User } from "@/types";
import { getWibDateString } from "./time";

export type ReportPeriod = "all" | "7d" | "30d" | "month";

export type TaskDeadlineOutcome =
  | "completed_on_time"
  | "completed_late"
  | "active_overdue"
  | "active_on_track"
  | "no_deadline_done"
  | "no_deadline_active";

export type ReportGrade = "A" | "B" | "C" | "D" | "-";

export interface GradeMeta {
  grade: ReportGrade;
  label: string;
  badgeClass: string;
}

export interface EvaluatedTaskItem {
  task: Task;
  outcome: TaskDeadlineOutcome;
  completedAt: string | null;
  lateMs: number;
  hadOverdueNotification: boolean;
}

export interface EmployeeReportRow {
  user: User;
  totalTasks: number;
  tasksWithDeadline: number;
  completedOnTime: number;
  completedLate: number;
  activeOverdue: number;
  activeOnTrack: number;
  noDeadlineDone: number;
  noDeadlineActive: number;
  totalLateCount: number;
  overdueAlertsCount: number;
  onTimeRate: number | null;
  grade: GradeMeta;
  items: EvaluatedTaskItem[];
}

export interface ReportSummary {
  totalEmployees: number;
  evaluatedEmployees: number;
  teamOnTimeRate: number | null;
  totalActiveOverdue: number;
  totalCompletedLate: number;
  totalLateRecords: number;
}

export function getGradeMeta(
  onTimeRate: number | null,
  activeOverdue: number,
  tasksWithDeadline: number
): GradeMeta {
  if (tasksWithDeadline === 0 || onTimeRate === null) {
    return {
      grade: "-",
      label: "Belum Ada Tenggat",
      badgeClass: "bg-tunet-surface-hover text-tunet-text-muted border-tunet-border",
    };
  }
  if (onTimeRate >= 90 && activeOverdue === 0) {
    return {
      grade: "A",
      label: "Sangat Baik",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  }
  if (onTimeRate >= 75 && activeOverdue <= 1) {
    return {
      grade: "B",
      label: "Baik",
      badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    };
  }
  if (onTimeRate >= 50) {
    return {
      grade: "C",
      label: "Perlu Perhatian",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  }
  return {
    grade: "D",
    label: "Bermasalah",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
  };
}

export function resolveCompletedAt(
  task: Task,
  doneAtByTaskId?: Record<string, string>
): string | null {
  if (task.status !== "done") return null;
  return task.completed_at || doneAtByTaskId?.[task.id] || task.updated_at || null;
}

export function evaluateTaskOutcome(
  task: Task,
  nowMs: number,
  doneAtByTaskId?: Record<string, string>
): { outcome: TaskDeadlineOutcome; completedAt: string | null; lateMs: number } {
  const completedAt = resolveCompletedAt(task, doneAtByTaskId);

  if (!task.deadline) {
    return {
      outcome: task.status === "done" ? "no_deadline_done" : "no_deadline_active",
      completedAt,
      lateMs: 0,
    };
  }

  const deadlineMs = new Date(task.deadline).getTime();
  if (Number.isNaN(deadlineMs)) {
    return {
      outcome: task.status === "done" ? "no_deadline_done" : "no_deadline_active",
      completedAt,
      lateMs: 0,
    };
  }

  if (task.status === "done") {
    const doneMs = completedAt ? new Date(completedAt).getTime() : nowMs;
    const lateMs = Math.max(0, doneMs - deadlineMs);
    return {
      outcome: doneMs > deadlineMs ? "completed_late" : "completed_on_time",
      completedAt,
      lateMs,
    };
  }

  const lateMs = Math.max(0, nowMs - deadlineMs);
  return {
    outcome: nowMs > deadlineMs ? "active_overdue" : "active_on_track",
    completedAt: null,
    lateMs,
  };
}

function matchesPeriod(task: Task, period: ReportPeriod, now: Date): boolean {
  if (period === "all") return true;
  const refIso = task.deadline || task.created_at;
  if (!refIso) return false;

  if (period === "month") {
    const todayWib = getWibDateString(now);
    const taskWib = getWibDateString(refIso);
    return Boolean(todayWib && taskWib && taskWib.slice(0, 7) === todayWib.slice(0, 7));
  }

  const days = period === "7d" ? 7 : 30;
  const cutoffMs = now.getTime() - days * 24 * 60 * 60 * 1000;
  const refMs = new Date(refIso).getTime();
  return !Number.isNaN(refMs) && refMs >= cutoffMs;
}

export interface EvaluateEmployeeReportsInput {
  users: User[];
  tasks: Task[];
  overdueNotifications?: Notification[];
  doneAtByTaskId?: Record<string, string>;
  period?: ReportPeriod;
  now?: Date;
}

export function evaluateEmployeeReports({
  users,
  tasks,
  overdueNotifications = [],
  doneAtByTaskId,
  period = "all",
  now = new Date(),
}: EvaluateEmployeeReportsInput): {
  rows: EmployeeReportRow[];
  summary: ReportSummary;
} {
  const nowMs = now.getTime();

  // Map overdue notifications by task_id + user_id so Rapot knows historical overdue flags too
  const overdueTaskIdsByUser = new Map<string, Set<string>>();
  const overdueAlertsCountByUser = new Map<string, number>();

  for (const notif of overdueNotifications) {
    if (notif.type !== "overdue") continue;
    const taskId = notif.task_id || (notif.metadata?.task_id as string | undefined);
    const assigneeId =
      (notif.metadata?.assignee_id as string | undefined) ||
      (notif.metadata?.recipient_role !== "leader" ? notif.user_id : undefined);

    if (assigneeId) {
      if (taskId) {
        if (!overdueTaskIdsByUser.has(assigneeId)) {
          overdueTaskIdsByUser.set(assigneeId, new Set());
        }
        overdueTaskIdsByUser.get(assigneeId)!.add(taskId);
      }
      overdueAlertsCountByUser.set(
        assigneeId,
        (overdueAlertsCountByUser.get(assigneeId) || 0) + 1
      );
    }
  }

  const filteredTasks = tasks.filter(
    (t) => !t.deleted_at && matchesPeriod(t, period, now)
  );

  const taskUserIds = new Set(
    filteredTasks.map((t) => t.assigned_to).filter(Boolean) as string[]
  );

  // Include active field/operational staff (foc, marketing, noc) + any user who has assigned tasks
  const candidateUsers = users.filter(
    (u) =>
      u.is_active &&
      (u.role === "foc" ||
        u.role === "marketing" ||
        u.role === "noc" ||
        taskUserIds.has(u.id))
  );

  const rows: EmployeeReportRow[] = candidateUsers.map((user) => {
    const userTasks = filteredTasks.filter((t) => t.assigned_to === user.id);
    const notifTaskSet = overdueTaskIdsByUser.get(user.id) || new Set<string>();

    let completedOnTime = 0;
    let completedLate = 0;
    let activeOverdue = 0;
    let activeOnTrack = 0;
    let noDeadlineDone = 0;
    let noDeadlineActive = 0;

    const items: EvaluatedTaskItem[] = userTasks.map((task) => {
      const { outcome, completedAt, lateMs } = evaluateTaskOutcome(
        task,
        nowMs,
        doneAtByTaskId
      );
      const hadOverdueNotification = notifTaskSet.has(task.id);

      switch (outcome) {
        case "completed_on_time":
          completedOnTime++;
          break;
        case "completed_late":
          completedLate++;
          break;
        case "active_overdue":
          activeOverdue++;
          break;
        case "active_on_track":
          activeOnTrack++;
          break;
        case "no_deadline_done":
          noDeadlineDone++;
          break;
        case "no_deadline_active":
          noDeadlineActive++;
          break;
      }

      return {
        task,
        outcome,
        completedAt,
        lateMs,
        hadOverdueNotification,
      };
    });

    // Sort items: active_overdue first, then completed_late, active_on_track, rest
    const outcomeOrder: Record<TaskDeadlineOutcome, number> = {
      active_overdue: 0,
      completed_late: 1,
      active_on_track: 2,
      completed_on_time: 3,
      no_deadline_active: 4,
      no_deadline_done: 5,
    };
    items.sort((a, b) => {
      const diff = outcomeOrder[a.outcome] - outcomeOrder[b.outcome];
      if (diff !== 0) return diff;
      const aTime = new Date(a.task.deadline || a.task.created_at).getTime();
      const bTime = new Date(b.task.deadline || b.task.created_at).getTime();
      return bTime - aTime;
    });

    const tasksWithDeadline = completedOnTime + completedLate + activeOverdue + activeOnTrack;
    const evaluatedTasks = completedOnTime + completedLate + activeOverdue;
    const onTimeRate =
      evaluatedTasks > 0
        ? Math.round((completedOnTime / evaluatedTasks) * 100)
        : null;

    const totalLateCount = completedLate + activeOverdue;
    const grade = getGradeMeta(onTimeRate, activeOverdue, evaluatedTasks);

    return {
      user,
      totalTasks: userTasks.length,
      tasksWithDeadline,
      completedOnTime,
      completedLate,
      activeOverdue,
      activeOnTrack,
      noDeadlineDone,
      noDeadlineActive,
      totalLateCount,
      overdueAlertsCount: overdueAlertsCountByUser.get(user.id) || 0,
      onTimeRate,
      grade,
      items,
    };
  });

  // Sort: employees with active overdue or lower onTimeRate / more tasks first
  rows.sort((a, b) => {
    if (b.activeOverdue !== a.activeOverdue) return b.activeOverdue - a.activeOverdue;
    if (b.totalLateCount !== a.totalLateCount) return b.totalLateCount - a.totalLateCount;
    if (a.onTimeRate !== null && b.onTimeRate !== null && a.onTimeRate !== b.onTimeRate) {
      return a.onTimeRate - b.onTimeRate;
    }
    if (a.onTimeRate !== null && b.onTimeRate === null) return -1;
    if (a.onTimeRate === null && b.onTimeRate !== null) return 1;
    return b.totalTasks - a.totalTasks;
  });

  const evaluatedRows = rows.filter((r) => r.onTimeRate !== null);
  const totalOnTimeAll = evaluatedRows.reduce((s, r) => s + r.completedOnTime, 0);
  const totalEvaluatedAll = evaluatedRows.reduce(
    (s, r) => s + r.completedOnTime + r.completedLate + r.activeOverdue,
    0
  );

  const summary: ReportSummary = {
    totalEmployees: rows.length,
    evaluatedEmployees: evaluatedRows.length,
    teamOnTimeRate:
      totalEvaluatedAll > 0
        ? Math.round((totalOnTimeAll / totalEvaluatedAll) * 100)
        : null,
    totalActiveOverdue: rows.reduce((s, r) => s + r.activeOverdue, 0),
    totalCompletedLate: rows.reduce((s, r) => s + r.completedLate, 0),
    totalLateRecords: rows.reduce((s, r) => s + r.totalLateCount, 0),
  };

  return { rows, summary };
}
