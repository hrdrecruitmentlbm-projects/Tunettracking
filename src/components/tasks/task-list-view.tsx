"use client";

import { useMemo, useState } from "react";
import { Task, TaskStatus, User, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  Flag,
  MapPin,
  MoreHorizontal,
  Paperclip,
  Plus,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { formatShortDate, isTaskOverdue } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { permanentDeleteTask, softDeleteTask } from "@/lib/db";
import { toast } from "sonner";
import { TaskCard } from "@/components/tasks/task-card";
import { BulkActions } from "@/components/tasks/bulk-actions";
import {
  describeStaleness,
  groupTasks,
  UNASSIGNED_GROUP_KEY,
  type GroupMode,
  type SortMode,
  type TaskGroup,
} from "@/lib/task-list-grouping";
import { cn } from "@/lib/utils";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  canPermanentDelete?: boolean;
  onPermanentDelete?: (taskId: string) => void;
  groupMode?: GroupMode;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDeleted?: (taskId: string) => void;
  onReassign?: (taskId: string, userId: string) => void;
  users?: User[];
  /**
   * Admin sees the triage affordances: staleness column, per-person workload
   * headers, sortable headers and inline row actions. Every one of them is
   * behind this flag so NOC/FOC keep the original list untouched.
   */
  isAdmin?: boolean;
  sortMode?: SortMode;
  onSortModeChange?: (mode: SortMode) => void;
  /** The trash view keeps the legacy flat table — triage is for the live backlog. */
  isTrashView?: boolean;
  /** Collapsed group keys (persisted by the page) → whether that group is collapsed. */
  collapsedGroups?: Record<string, boolean>;
  onToggleGroupCollapsed?: (groupKey: string, collapsed: boolean) => void;
  /** Admin-only: open the task form pre-filled with this assignee (section "+"). */
  onAddTaskForAssignee?: (userId: string) => void;
}

const PRIORITY_DOT: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#6B7280",
};

/** Max tag chips rendered before collapsing into +N. */
const MAX_TAG_CHIPS = 2;

function readCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem("tutrack-user");
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (parsed && typeof parsed === "object" && "id" in parsed) {
      return String((parsed as { id: unknown }).id);
    }
    return null;
  } catch {
    return null;
  }
}

/** Mockup-style row title: priority flag + title + evidence chip, location beneath. */
function TaskCell({ task, overdue }: { task: Task; overdue: boolean }) {
  const attachmentCount = task.attachments?.length ?? 0;
  const showEvidence =
    attachmentCount > 0 && (task.status === "review" || task.status === "done");

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <Flag
          aria-hidden="true"
          className="size-3.5 shrink-0"
          style={{
            color: PRIORITY_DOT[task.priority],
            fill: PRIORITY_DOT[task.priority],
          }}
        />
        <span aria-hidden="true" className="sr-only">
          {PRIORITY_CONFIG[task.priority].label}
        </span>
        <span className="truncate text-tunet-text">{task.title}</span>
        {showEvidence && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-tunet-border/60 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-tunet-text-muted"
            title={COPY.taskList.attachments(attachmentCount)}
          >
            <Paperclip aria-hidden="true" className="size-3" />
            {attachmentCount}
          </span>
        )}
        {overdue && <span className="sr-only">{COPY.taskList.overdue}</span>}
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-tunet-text-muted">
        <MapPin aria-hidden="true" className="size-3 shrink-0" />
        <span className="truncate">{task.location_name}</span>
      </div>
    </div>
  );
}

function TagChips({ task }: { task: Task }) {
  const tags = task.tags ?? [];
  if (tags.length === 0) return null;
  const visible = tags.slice(0, MAX_TAG_CHIPS);
  const extra = tags.length - visible.length;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
        >
          {tag.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="font-mono text-[10px] text-tunet-text-muted">+{extra}</span>
      )}
    </div>
  );
}

function DeadlineCell({ task }: { task: Task }) {
  const overdue = isTaskOverdue(task);
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap text-xs tabular-nums",
        overdue ? "font-medium text-status-overdue" : "text-tunet-text-muted"
      )}
    >
      <Clock aria-hidden="true" className="size-3.5 shrink-0" />
      {task.deadline ? formatShortDate(task.deadline) : "—"}
    </span>
  );
}

export function TaskListView({
  tasks,
  onTaskClick,
  canPermanentDelete = false,
  onPermanentDelete,
  groupMode = "none",
  onStatusChange,
  onDeleted,
  onReassign,
  users = [],
  isAdmin = false,
  sortMode = "risk",
  onSortModeChange,
  isTrashView = false,
  collapsedGroups,
  onToggleGroupCollapsed,
  onAddTaskForAssignee,
}: TaskListViewProps) {
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleting, setPermDeleting] = useState(false);
  const [permDeleteTarget, setPermDeleteTarget] = useState<Task | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const effectiveGroupMode: GroupMode = isTrashView ? "none" : groupMode;
  const showAdminColumns = isAdmin && !isTrashView;

  // One timestamp per mount keeps staleness labels stable across re-renders,
  // matching how TaskCard stamps its "age" label.
  const [now] = useState(() => Date.now());

  const groups = useMemo<TaskGroup[]>(
    () => (effectiveGroupMode === "none" ? [] : groupTasks(tasks, effectiveGroupMode, users, now)),
    [tasks, effectiveGroupMode, users, now]
  );

  // The tag column only appears when at least one visible task carries tags.
  const hasVisibleTags = tasks.some((task) => (task.tags?.length ?? 0) > 0);

  const colCount =
    1 + // selection
    1 + // status ring
    1 + // task
    (hasVisibleTags && !isTrashView ? 1 : 0) + // tags
    1 + // assignee
    1 + // deadline
    (showAdminColumns ? 1 : 0) + // updated
    (showAdminColumns || canPermanentDelete ? 1 : 0); // actions

  const allSelected = tasks.length > 0 && selectedIds.size === tasks.length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(tasks.map(t => t.id)));
  };

  const handleBulkStatus = (status: TaskStatus) => {
    selectedIds.forEach(id => onStatusChange?.(id, status));
    setSelectedIds(new Set());
  };
  const handleBulkReassign = (userId: string) => {
    selectedIds.forEach(id => onReassign?.(id, userId));
    setSelectedIds(new Set());
  };
  const handleBulkDelete = () => {
    selectedIds.forEach(id => onDeleted?.(id));
    setSelectedIds(new Set());
  };
  const handleClearSelection = () => setSelectedIds(new Set());

  const handleSoftDelete = async (task: Task) => {
    const userId = readCurrentUserId();
    if (!userId) return;
    const ok = await softDeleteTask(task.id, userId);
    if (ok) {
      toast.success(COPY.taskDetail.deleteSuccess);
      onDeleted?.(task.id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    } else {
      toast.error(COPY.taskDetail.deleteFailedDefault);
    }
  };

  const requestPermanentDelete = (task: Task) => {
    setPermDeleteTarget(task);
    setPermDeleteOpen(true);
  };

  const handlePermanentDelete = async () => {
    if (!permDeleteTarget) return;
    setPermDeleting(true);
    const ok = await permanentDeleteTask(permDeleteTarget.id);
    if (ok) {
      toast.success(COPY.taskDetail.permDeleteSuccess);
      onPermanentDelete?.(permDeleteTarget.id);
      setPermDeleteOpen(false);
    } else {
      toast.error(COPY.taskDetail.permDeleteFailed);
    }
    setPermDeleting(false);
  };

  const rowActions = (task: Task, variant: "row" | "card") => (
    <AdminRowActions
      task={task}
      users={users}
      variant={variant}
      onStatusChange={onStatusChange}
      onReassign={onReassign}
      onSoftDelete={handleSoftDelete}
      onRequestPermanentDelete={requestPermanentDelete}
      canPermanentDelete={canPermanentDelete}
    />
  );

  return (
    <div className="h-full w-full overflow-auto">
      {/* Bulk actions toolbar */}
      <div className="sticky top-0 z-10 pb-2">
        <BulkActions
          selectedCount={selectedIds.size}
          users={users}
          onStatusChange={handleBulkStatus}
          onReassign={handleBulkReassign}
          onDelete={handleBulkDelete}
          onClear={handleClearSelection}
        />
      </div>

      {/* Grouped list view */}
      {effectiveGroupMode !== "none" ? (
        <div className="flex flex-col gap-2 pb-24">
          {groups.map((group) => {
            const isCollapsed = collapsedGroups?.[group.key] ?? false;
            const showSectionAdd =
              showAdminColumns &&
              groupMode === "assignee" &&
              group.key !== UNASSIGNED_GROUP_KEY &&
              Boolean(onAddTaskForAssignee);
            return (
              <details
                key={group.key}
                className="group rounded-xl border border-tunet-border/70 bg-tunet-surface/20"
                open={!isCollapsed}
                onToggle={(event) => {
                  const open = (event.currentTarget as HTMLDetailsElement).open;
                  if (isCollapsed === open) {
                    onToggleGroupCollapsed?.(group.key, !open);
                  }
                }}
              >
                <summary className="flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-tunet-text transition-colors hover:bg-tunet-surface-hover/50 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="size-4 -rotate-90 text-tunet-text-muted transition-transform group-open:rotate-0" />
                  <span className="size-2 rounded-full" style={{ backgroundColor: group.accent }} />
                  <span className="truncate">{group.label}</span>
                  {showAdminColumns && group.meta && (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-tunet-text-muted">
                      {group.meta}
                    </span>
                  )}
                  {showAdminColumns && (
                    <span className="flex shrink-0 items-center gap-2 text-[11px] font-normal text-tunet-text-muted">
                      <span>{COPY.taskList.activeCount(group.stats.active)}</span>
                      {group.stats.overdue > 0 && (
                        <span className="text-status-overdue">
                          {COPY.taskList.overdueCount(group.stats.overdue)}
                        </span>
                      )}
                    </span>
                  )}
                  {showAdminColumns && group.stats.capacity ? (
                    <GroupCapacity group={group} />
                  ) : null}
                  <span className="ml-auto font-mono text-xs tabular-nums text-tunet-text-muted">
                    {group.tasks.length}
                  </span>
                  {showSectionAdd && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddTaskForAssignee?.(group.key);
                      }}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-tunet-text-muted transition-colors hover:bg-tunet-surface-hover hover:text-tunet-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal"
                      aria-label={COPY.taskList.addTaskFor(group.label)}
                      title={COPY.taskList.addTaskFor(group.label)}
                    >
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </summary>
                <div className="px-2 pb-2">
                  {group.tasks.map(task => {
                    const overdue = isTaskOverdue(task);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "grid cursor-pointer items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-tunet-surface-hover/60",
                          showAdminColumns
                            ? hasVisibleTags
                              ? "grid-cols-[36px_auto_minmax(0,1fr)_auto_auto_auto_88px_auto]"
                              : "grid-cols-[36px_auto_minmax(0,1fr)_auto_auto_88px_auto]"
                            : hasVisibleTags
                              ? "grid-cols-[36px_auto_minmax(0,1fr)_auto_auto_auto]"
                              : "grid-cols-[36px_auto_minmax(0,1fr)_auto_auto]"
                        )}
                        onClick={() => onTaskClick?.(task)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(task.id)}
                          onChange={() => toggleSelect(task.id)}
                          onClick={e => e.stopPropagation()}
                          aria-label={COPY.bulkActions.selectRow(task.title)}
                          className="size-4 accent-tunet-green"
                        />
                        <StatusRingMenu task={task} onStatusChange={onStatusChange} />
                        <TaskCell task={task} overdue={overdue} />
                        {hasVisibleTags && <TagChips task={task} />}
                        <span className="truncate text-tunet-text-muted">
                          {task.assignee?.name || COPY.taskList.unassigned}
                        </span>
                        <DeadlineCell task={task} />
                        {showAdminColumns && <StalenessCell task={task} now={now} />}
                        {showAdminColumns && (
                          <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                            {rowActions(task, "row")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
          {tasks.length === 0 && (
            <p className="py-12 text-center text-sm text-tunet-text-muted">{COPY.taskList.emptyMessage}</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-3 pb-24 md:hidden">
            {tasks.map((task) => (
              <div key={task.id} className="flex flex-col gap-2">
                <TaskCard task={task} onClick={onTaskClick} />
                {showAdminColumns && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-tunet-border/70 bg-tunet-surface/30 px-3 py-2">
                    <StalenessCell task={task} now={now} />
                    {rowActions(task, "card")}
                  </div>
                )}
                {canPermanentDelete && isTrashView && (
                  <Button variant="destructive" className="min-h-11" onClick={() => requestPermanentDelete(task)}>
                    <Trash2 data-icon="inline-start" aria-hidden="true" />
                    {COPY.pages.trash.permanentlyDelete}
                  </Button>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="py-12 text-center text-sm text-tunet-text-muted">{COPY.taskList.emptyMessage}</p>
            )}
          </div>

          {isTrashView ? (
            /* Trash keeps the legacy archival table verbatim. */
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-tunet-border">
                  <th scope="col" className="w-10 py-3 px-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label={COPY.bulkActions.selectAll(tasks.length)}
                      className="size-4 accent-tunet-green"
                    />
                  </th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">{COPY.taskList.colTask}</th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">{COPY.taskList.colStatus}</th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">{COPY.taskList.colPriority}</th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">{COPY.taskList.colAssignee}</th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">{COPY.taskList.colLocation}</th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">{COPY.taskList.colDeadline}</th>
                  {canPermanentDelete && (
                    <th scope="col" className="py-3 px-4 text-right text-xs font-medium text-tunet-text-muted">
                      {COPY.pages.trash.colActions}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const statusConfig = STATUS_CONFIG[task.status];
                  return (
                    <tr
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className="border-b border-tunet-border last:border-0 hover:bg-tunet-surface-hover cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} aria-label={COPY.bulkActions.selectRow(task.title)} className="size-4 accent-tunet-green" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_DOT[task.priority] }} />
                          <span className="text-tunet-text font-medium">{task.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-xs" style={{ backgroundColor: statusConfig.color + "20", color: statusConfig.color }}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-xs" style={{ backgroundColor: PRIORITY_DOT[task.priority] + "20", color: PRIORITY_DOT[task.priority] }}>
                          {PRIORITY_CONFIG[task.priority].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-tunet-text-muted">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span className="text-xs">{task.assignee?.name || COPY.taskList.unassigned}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-tunet-text-muted">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs truncate max-w-[150px]">{task.location_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-tunet-text-muted" />
                          <span className="text-xs text-tunet-text-muted">
                            {task.deadline ? formatShortDate(task.deadline) : "—"}
                          </span>
                        </div>
                      </td>
                      {canPermanentDelete && (
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => requestPermanentDelete(task)}
                            className="p-1.5 rounded hover:bg-status-overdue/10 text-tunet-text-muted hover:text-status-overdue transition-colors"
                            aria-label={COPY.pages.trash.permanentlyDelete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={colCount} className="py-12 text-center text-tunet-text-muted text-sm">{COPY.taskList.emptyMessage}</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Desktop: flat table, mockup-style rows. */
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-tunet-border">
                  <th scope="col" className="w-10 py-3 px-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label={COPY.bulkActions.selectAll(tasks.length)}
                      className="size-4 accent-tunet-green"
                    />
                  </th>
                  <th scope="col" className="w-10 py-3 px-4">
                    <span className="sr-only">{COPY.taskList.colStatus}</span>
                  </th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">
                    {onSortModeChange ? (
                      <SortButton
                        label={COPY.taskList.colTask}
                        mode="risk"
                        sortMode={sortMode}
                        onSortModeChange={onSortModeChange}
                      />
                    ) : (
                      COPY.taskList.colTask
                    )}
                  </th>
                  {hasVisibleTags && (
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">
                      {COPY.taskList.tagsColumn}
                    </th>
                  )}
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">{COPY.taskList.colAssignee}</th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">
                    {onSortModeChange ? (
                      <SortButton
                        label={COPY.taskList.colDeadline}
                        mode="deadline"
                        sortMode={sortMode}
                        onSortModeChange={onSortModeChange}
                      />
                    ) : (
                      COPY.taskList.colDeadline
                    )}
                  </th>
                  {showAdminColumns && (
                    <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-tunet-text-muted">
                      <SortButton
                        label={COPY.taskList.colUpdated}
                        mode="updated"
                        sortMode={sortMode}
                        onSortModeChange={onSortModeChange}
                      />
                    </th>
                  )}
                  {showAdminColumns && (
                    <th scope="col" className="py-3 px-4 text-right text-xs font-medium text-tunet-text-muted">
                      {COPY.pages.trash.colActions}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  return (
                    <tr
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className="border-b border-tunet-border last:border-0 hover:bg-tunet-surface-hover cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} aria-label={COPY.bulkActions.selectRow(task.title)} className="size-4 accent-tunet-green" />
                      </td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <StatusRingMenu task={task} onStatusChange={onStatusChange} />
                      </td>
                      <td className="py-3 px-4">
                        <TaskCell task={task} overdue={overdue} />
                      </td>
                      {hasVisibleTags && (
                        <td className="py-3 px-4">
                          <TagChips task={task} />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-tunet-text-muted">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span className="text-xs">{task.assignee?.name || COPY.taskList.unassigned}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <DeadlineCell task={task} />
                      </td>
                      {showAdminColumns && (
                        <td className="py-3 px-4">
                          <StalenessCell task={task} now={now} />
                        </td>
                      )}
                      {showAdminColumns && (
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end">{rowActions(task, "row")}</div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={colCount} className="py-12 text-center text-tunet-text-muted text-sm">{COPY.taskList.emptyMessage}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Permanent delete dialog */}
      <Dialog open={permDeleteOpen} onOpenChange={setPermDeleteOpen}>
        <DialogContent className="bg-tunet-surface border-tunet-border">
          <DialogHeader>
            <DialogTitle className="text-tunet-text">{COPY.taskDetail.permDeleteConfirmTitle}</DialogTitle>
            <DialogDescription className="text-tunet-text-muted">
              {permDeleteTarget && COPY.taskDetail.permDeleteConfirmDesc(permDeleteTarget.title)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDeleteOpen(false)} className="border-tunet-border text-tunet-text">
              {COPY.actions.cancel}
            </Button>
            <Button onClick={handlePermanentDelete} disabled={permDeleting} className="bg-status-overdue hover:bg-status-overdue/90 text-white">
              {permDeleting ? COPY.taskDetail.permDeleting : COPY.pages.trash.permanentlyDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Mockup-style status ring that opens a compact status menu on tap. When the
 * task is awaiting review, the menu leads with a one-click approve action.
 */
function StatusRingMenu({
  task,
  onStatusChange,
}: {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}) {
  const color = STATUS_CONFIG[task.status].color;
  const done = task.status === "done";

  return (
    /* Propagation stops outside the trigger: killing it on the trigger itself
       would prevent the click from ever reaching the menu logic. The trigger
       renders its own <button>, so props go directly on it — nesting a second
       button inside it produces invalid HTML that crashes on interaction. */
    <span onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={COPY.taskList.ringMenuAria(task.title)}
          title={STATUS_CONFIG[task.status].label}
          className="inline-flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-tunet-signal"
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-5 items-center justify-center rounded-full border-2 transition-colors motion-reduce:transition-none",
              done && "shadow-[0_0_10px_rgba(16,185,129,0.35)]"
            )}
            style={{ borderColor: color, backgroundColor: done ? color : "transparent" }}
          >
            {done && <Check className="size-3 text-white" strokeWidth={3} />}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-48">
        {task.status === "review" && onStatusChange && (
          <>
            <DropdownMenuItem
              onClick={() => onStatusChange(task.id, "done")}
              className="gap-2 bg-status-done/10 font-medium text-status-done focus:bg-status-done/20 focus:text-status-done"
            >
              <Check aria-hidden="true" />
              {COPY.taskList.approve}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>{COPY.taskList.changeStatus}</DropdownMenuLabel>
        {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(status => (
          <DropdownMenuItem
            key={status}
            disabled={status === task.status}
            onClick={() => onStatusChange?.(task.id, status)}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: STATUS_CONFIG[status].color }}
              aria-hidden="true"
            />
            {STATUS_CONFIG[status].label}
          </DropdownMenuItem>
        ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

/** Relative "last touched" cell — amber once the task reads as stalled. */
function StalenessCell({ task, now }: { task: Task; now: number }) {
  const staleness = describeStaleness(task, now);
  return (
    <span
      className={cn(
        "whitespace-nowrap font-mono text-xs tabular-nums",
        staleness.isStalled ? "text-tunet-ember" : "text-tunet-text-muted"
      )}
      title={staleness.isStalled ? COPY.taskList.stalledNotice(staleness.days) : undefined}
    >
      {staleness.label}
    </span>
  );
}

/** Soft per-person load against ASSIGNEE_CAPACITY. Warning-only. */
function GroupCapacity({ group }: { group: TaskGroup }) {
  const capacity = group.stats.capacity ?? 0;
  if (capacity <= 0) return null;
  const active = group.stats.active;
  const pct = Math.min(100, Math.round((active / capacity) * 100));
  const full = active >= capacity;

  return (
    <span
      className="hidden shrink-0 items-center gap-2 sm:flex"
      title={COPY.taskList.capacityOf(active, capacity)}
    >
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-tunet-border/70">
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: full ? "#EF4444" : group.accent }}
        />
      </span>
      <span className="font-mono text-[10px] tabular-nums text-tunet-text-muted">
        {full ? COPY.taskList.capacityFull : COPY.taskList.capacityOf(active, capacity)}
      </span>
    </span>
  );
}

function SortButton({
  label,
  mode,
  sortMode,
  onSortModeChange,
}: {
  label: string;
  mode: SortMode;
  sortMode: SortMode;
  onSortModeChange?: (mode: SortMode) => void;
}) {
  const active = sortMode === mode;
  const sortLabel = COPY.taskList.sortBy(label);
  return (
    <button
      type="button"
      onClick={() => onSortModeChange?.(mode)}
      aria-label={sortLabel}
      title={sortLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded transition-colors hover:text-tunet-text",
        active && "text-tunet-signal"
      )}
    >
      {label}
      <ArrowUpDown className={cn("size-3", !active && "opacity-50")} aria-hidden="true" />
    </button>
  );
}

/**
 * Inline triage actions. Reassign/status reuse the page handlers (which persist
 * and roll back on failure); delete reuses the same confirm flows as the card.
 */
function AdminRowActions({
  task,
  users,
  variant,
  onStatusChange,
  onReassign,
  onSoftDelete,
  onRequestPermanentDelete,
  canPermanentDelete,
}: {
  task: Task;
  users: User[];
  variant: "row" | "card";
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onReassign?: (taskId: string, userId: string) => void;
  onSoftDelete: (task: Task) => void;
  onRequestPermanentDelete: (task: Task) => void;
  canPermanentDelete: boolean;
}) {
  // Matches what the task form allows: field and marketing staff take work.
  const assignable = users.filter(
    user => user.is_active !== false && (user.role === "foc" || user.role === "marketing")
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${COPY.taskList.rowActions}: ${task.title}`}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-tunet-text-muted outline-none transition-colors hover:bg-tunet-surface-hover hover:text-tunet-text focus-visible:ring-2 focus-visible:ring-tunet-signal",
          variant === "row" ? "size-9" : "min-h-11 gap-1.5 px-3"
        )}
      >
        <MoreHorizontal aria-hidden="true" />
        {variant === "card" && <span className="text-xs">{COPY.taskList.rowActions}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>{COPY.taskList.changeStatus}</DropdownMenuLabel>
        {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(status => (
          <DropdownMenuItem
            key={status}
            disabled={status === task.status}
            onClick={() => onStatusChange?.(task.id, status)}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: STATUS_CONFIG[status].color }}
              aria-hidden="true"
            />
            {STATUS_CONFIG[status].label}
          </DropdownMenuItem>
        ))}

        {onReassign && assignable.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{COPY.taskList.reassign}</DropdownMenuLabel>
            {assignable.map(user => (
              <DropdownMenuItem
                key={user.id}
                disabled={user.id === task.assigned_to}
                onClick={() => onReassign(task.id, user.id)}
              >
                {user.name}
                <span className="ml-auto font-mono text-[10px] uppercase text-tunet-text-muted">
                  {user.role}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onSoftDelete(task)}>
          <Trash2 aria-hidden="true" />
          {COPY.actions.delete}
        </DropdownMenuItem>
        {canPermanentDelete && (
          <DropdownMenuItem variant="destructive" onClick={() => onRequestPermanentDelete(task)}>
            <Trash2 aria-hidden="true" />
            {COPY.pages.trash.permanentlyDelete}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
