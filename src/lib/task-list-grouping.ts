import { COPY } from "@/lib/copy";
import { isTaskOverdue } from "@/lib/time";
import { STATUS_CONFIG, Task, TaskPriority, TaskStatus, User, UserRole } from "@/types";

/**
 * Pure list-shaping helpers for the task list. Kept free of React so the admin
 * triage list can group, sort and filter without bloating TaskListView, and so
 * the rules stay in one readable place.
 */

export type GroupMode = "none" | "status" | "assignee" | "deadline";
export type SortMode = "risk" | "deadline" | "priority" | "updated";
export type ListPreset = "all" | "risk" | "overdue" | "unassigned";
export type DeadlineBucket = "overdue" | "today" | "week" | "later" | "none";

export const GROUP_MODES: readonly GroupMode[] = ["none", "status", "assignee", "deadline"];
export const SORT_MODES: readonly SortMode[] = ["risk", "deadline", "priority", "updated"];
export const LIST_PRESETS: readonly ListPreset[] = ["all", "risk", "overdue", "unassigned"];

/** Days a task may sit untouched in a non-done status before it reads as stalled. */
export const STALE_AFTER_DAYS = 3;

/**
 * Soft per-person ceiling for the capacity bar in the assignee grouping.
 * Warning-only, mirroring WIP_LIMITS' spirit — it never blocks or reassigns.
 */
export const ASSIGNEE_CAPACITY = 8;

export const UNASSIGNED_GROUP_KEY = "__unassigned";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const ROLE_ACCENT: Record<UserRole, string> = {
  admin: "#F59E0B",
  noc: "#37D9F2",
  foc: "#10B981",
  marketing: "#8B5CF6",
};

const NEUTRAL_ACCENT = "#6B7280";

export const GROUP_MODE_LABELS: Record<GroupMode, string> = {
  none: COPY.taskList.groupNone,
  status: COPY.taskList.groupStatus,
  assignee: COPY.taskList.groupAssignee,
  deadline: COPY.taskList.groupDeadline,
};

export const SORT_MODE_LABELS: Record<SortMode, string> = {
  risk: COPY.taskList.sortRisk,
  deadline: COPY.taskList.sortDeadline,
  priority: COPY.taskList.sortPriority,
  updated: COPY.taskList.sortUpdated,
};

export const PRESET_LABELS: Record<ListPreset, string> = {
  all: COPY.taskList.presetAll,
  risk: COPY.taskList.presetRisk,
  overdue: COPY.taskList.presetOverdue,
  unassigned: COPY.taskList.presetUnassigned,
};

const DEADLINE_BUCKETS: readonly DeadlineBucket[] = ["overdue", "today", "week", "later", "none"];

const DEADLINE_BUCKET_META: Record<DeadlineBucket, { label: string; accent: string }> = {
  overdue: { label: COPY.taskList.deadlineOverdue, accent: "#EF4444" },
  today: { label: COPY.taskList.deadlineToday, accent: "#F59E0B" },
  week: { label: COPY.taskList.deadlineWeek, accent: "#3B82F6" },
  later: { label: COPY.taskList.deadlineLater, accent: "#6B7280" },
  none: { label: COPY.taskList.deadlineNone, accent: "#4B5563" },
};

export interface TaskGroupStats {
  /** Everything not done. */
  active: number;
  overdue: number;
  /** Only set for assignee groups, where a per-person ceiling is meaningful. */
  capacity?: number;
}

export interface TaskGroup {
  key: string;
  label: string;
  /** Raw role, shown as a badge next to the label in assignee groups. */
  meta?: string;
  accent: string;
  tasks: Task[];
  stats: TaskGroupStats;
}

export interface StalenessInfo {
  days: number;
  hours: number;
  label: string;
  isStalled: boolean;
}

export function isGroupMode(value: unknown): value is GroupMode {
  return typeof value === "string" && (GROUP_MODES as readonly string[]).includes(value);
}

export function isSortMode(value: unknown): value is SortMode {
  return typeof value === "string" && (SORT_MODES as readonly string[]).includes(value);
}

export function isListPreset(value: unknown): value is ListPreset {
  return typeof value === "string" && (LIST_PRESETS as readonly string[]).includes(value);
}

function timeOf(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

/** Time since a task was last touched — the signal that a task is stuck. */
export function describeStaleness(task: Task, now = Date.now()): StalenessInfo {
  const updated = timeOf(task.updated_at) || timeOf(task.created_at);
  const elapsed = Number.isFinite(updated) ? Math.max(0, now - updated) : 0;
  const hours = Math.floor(elapsed / HOUR_MS);
  const days = Math.floor(elapsed / DAY_MS);
  const label =
    hours < 1 ? COPY.time.justNow : hours < 24 ? `${hours}j` : COPY.taskList.staleDays(days);

  return {
    days,
    hours,
    label,
    isStalled: task.status !== "done" && days >= STALE_AFTER_DAYS,
  };
}

export function isStalled(task: Task, now = Date.now()): boolean {
  return describeStaleness(task, now).isStalled;
}

export function deadlineBucket(task: Task, now = Date.now()): DeadlineBucket {
  if (!task.deadline) return "none";

  const due = timeOf(task.deadline);
  if (!Number.isFinite(due)) return "none";

  // Finished work is never a deadline risk, even once its date has passed.
  if (task.status === "done") return "later";
  if (due < now) return "overdue";

  const today = new Date(now);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();
  if (due < endOfDay) return "today";
  if (due - now < 7 * DAY_MS) return "week";
  return "later";
}

/**
 * Higher means "needs a human sooner": overdue first, then due-in-an-hour,
 * unassigned work, priority, and finally how long it has been untouched.
 */
export function computeRiskScore(task: Task, now = Date.now()): number {
  if (task.status === "done") return 0;

  let score = 0;
  if (isTaskOverdue(task)) score += 100;
  if (!task.assigned_to) score += 25;
  score += PRIORITY_WEIGHT[task.priority] * 5;
  score += Math.min(describeStaleness(task, now).days, 30) * 2;

  const due = timeOf(task.deadline);
  if (Number.isFinite(due) && due >= now) {
    const remaining = due - now;
    if (remaining < HOUR_MS) score += 60;
    else if (remaining < DAY_MS) score += 40;
    else if (remaining < 7 * DAY_MS) score += 15;
  }

  return score;
}

/** Earliest deadline first; tasks without a deadline sink to the bottom. */
function compareDeadline(first: Task, second: Task): number {
  const a = timeOf(first.deadline);
  const b = timeOf(second.deadline);
  if (!Number.isFinite(a) && !Number.isFinite(b)) return 0;
  if (!Number.isFinite(a)) return 1;
  if (!Number.isFinite(b)) return -1;
  return a - b;
}

export function sortTasks(tasks: Task[], mode: SortMode, now = Date.now()): Task[] {
  const next = [...tasks];

  switch (mode) {
    case "deadline":
      next.sort(
        (a, b) =>
          compareDeadline(a, b) || PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
      );
      break;
    case "priority":
      next.sort(
        (a, b) =>
          PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || compareDeadline(a, b)
      );
      break;
    case "updated":
      next.sort((a, b) => (timeOf(b.updated_at) || 0) - (timeOf(a.updated_at) || 0));
      break;
    default:
      next.sort(
        (a, b) => computeRiskScore(b, now) - computeRiskScore(a, now) || compareDeadline(a, b)
      );
  }

  return next;
}

/**
 * Saved views are plain predicates over a single task so they compose with the
 * existing status/priority/assignee/tag filters instead of replacing them.
 */
export function matchesPreset(task: Task, preset: ListPreset, now = Date.now()): boolean {
  switch (preset) {
    case "overdue":
      return isTaskOverdue(task);
    case "unassigned":
      return !task.assigned_to;
    case "risk":
      return isTaskOverdue(task) || !task.assigned_to || isStalled(task, now);
    default:
      return true;
  }
}

function summarize(tasks: Task[], capacity?: number): TaskGroupStats {
  return {
    active: tasks.filter((task) => task.status !== "done").length,
    overdue: tasks.filter((task) => isTaskOverdue(task)).length,
    capacity,
  };
}

function statusGroups(tasks: Task[]): TaskGroup[] {
  return (Object.keys(STATUS_CONFIG) as TaskStatus[]).flatMap((status) => {
    const group = tasks.filter((task) => task.status === status);
    if (group.length === 0) return [];
    return [
      {
        key: status,
        label: STATUS_CONFIG[status].label,
        accent: STATUS_CONFIG[status].color,
        tasks: group,
        stats: summarize(group),
      },
    ];
  });
}

function deadlineGroups(tasks: Task[], now: number): TaskGroup[] {
  return DEADLINE_BUCKETS.flatMap((bucket) => {
    const group = tasks.filter((task) => deadlineBucket(task, now) === bucket);
    if (group.length === 0) return [];
    return [
      {
        key: bucket,
        label: DEADLINE_BUCKET_META[bucket].label,
        accent: DEADLINE_BUCKET_META[bucket].accent,
        tasks: group,
        stats: summarize(group),
      },
    ];
  });
}

/**
 * Busiest person first — the whole point of this view is spotting who is
 * over-loaded at a glance. Unassigned work always sits last so it cannot hide.
 */
function assigneeGroups(tasks: Task[], users: User[]): TaskGroup[] {
  const byAssignee = new Map<string, Task[]>();
  const unassigned: Task[] = [];

  for (const task of tasks) {
    if (!task.assigned_to) {
      unassigned.push(task);
      continue;
    }
    const bucket = byAssignee.get(task.assigned_to);
    if (bucket) bucket.push(task);
    else byAssignee.set(task.assigned_to, [task]);
  }

  const usersById = new Map(users.map((user) => [user.id, user]));

  const groups: TaskGroup[] = Array.from(byAssignee.entries()).map(([userId, group]) => {
    const user = usersById.get(userId);
    return {
      key: userId,
      label: user?.name ?? group[0].assignee?.name ?? COPY.taskList.unassigned,
      meta: user?.role,
      accent: user ? (ROLE_ACCENT[user.role] ?? NEUTRAL_ACCENT) : NEUTRAL_ACCENT,
      tasks: group,
      stats: summarize(group, ASSIGNEE_CAPACITY),
    };
  });

  groups.sort(
    (a, b) => b.stats.active - a.stats.active || a.label.localeCompare(b.label, "id")
  );

  if (unassigned.length > 0) {
    groups.push({
      key: UNASSIGNED_GROUP_KEY,
      label: COPY.taskList.unassignedGroup,
      accent: "#EF4444",
      tasks: unassigned,
      stats: summarize(unassigned),
    });
  }

  return groups;
}

export function groupTasks(
  tasks: Task[],
  mode: GroupMode,
  users: User[] = [],
  now = Date.now()
): TaskGroup[] {
  switch (mode) {
    case "status":
      return statusGroups(tasks);
    case "deadline":
      return deadlineGroups(tasks, now);
    case "assignee":
      return assigneeGroups(tasks, users);
    default:
      return [];
  }
}
