"use client";

import { useState, useMemo } from "react";
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
import { MapPin, Clock, User as UserIcon, Trash2, ChevronDown } from "lucide-react";
import { formatShortDate } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { permanentDeleteTask } from "@/lib/db";
import { toast } from "sonner";
import { TaskCard } from "@/components/tasks/task-card";
import { BulkActions } from "@/components/tasks/bulk-actions";
import { cn } from "@/lib/utils";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  canPermanentDelete?: boolean;
  onPermanentDelete?: (taskId: string) => void;
  groupByStatus?: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDeleted?: (taskId: string) => void;
  onReassign?: (taskId: string, userId: string) => void;
  users?: User[];
}

const PRIORITY_DOT: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#6B7280",
};

export function TaskListView({
  tasks,
  onTaskClick,
  canPermanentDelete = false,
  onPermanentDelete,
  groupByStatus = false,
  onStatusChange,
  onDeleted,
  onReassign,
  users = [],
}: TaskListViewProps) {
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleting, setPermDeleting] = useState(false);
  const [permDeleteTarget, setPermDeleteTarget] = useState<Task | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const colCount = canPermanentDelete ? 8 : 7;

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

  // Group tasks by status for grouped view
  const groupedTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      (map[t.status] ??= []).push(t);
    }
    return map;
  }, [tasks]);

  const isOverdue = (task: Task) => task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

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
      {groupByStatus ? (
        <div className="flex flex-col gap-2 pb-24">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const group = groupedTasks[status] || [];
            if (group.length === 0) return null;
            return (
              <details key={status} className="group rounded-xl border border-tunet-border/70 bg-tunet-surface/20" open>
                <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium text-tunet-text select-none hover:bg-tunet-surface-hover/50 rounded-xl transition-colors [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="size-4 text-tunet-text-muted transition-transform group-open:rotate-0 -rotate-90" />
                  <span className="size-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span>{config.label}</span>
                  <span className="ml-auto font-mono text-xs tabular-nums text-tunet-text-muted">{group.length}</span>
                </summary>
                <div className="px-2 pb-2">
                  {group.map(task => (
                    <div
                      key={task.id}
                      className="grid cursor-pointer grid-cols-[36px_8px_1fr_auto_auto_minmax(0,120px)] items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1.5 text-xs hover:bg-tunet-surface-hover/60 transition-colors"
                      onClick={() => onTaskClick?.(task)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        onClick={e => e.stopPropagation()}
                        className="size-4 accent-tunet-green"
                      />
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: PRIORITY_DOT[task.priority] }} />
                      <span className={cn("truncate text-tunet-text", isOverdue(task) && "text-status-overdue")}>
                        {task.title}
                      </span>
                      <span className="text-tunet-text-muted truncate max-w-24">{task.assignee?.name || COPY.taskList.unassigned}</span>
                      <span className={cn("tabular-nums", isOverdue(task) ? "text-status-overdue font-medium" : "text-tunet-text-muted")}>
                        {task.deadline ? formatShortDate(task.deadline) : "—"}
                      </span>
                      <span className="truncate text-tunet-text-muted">{task.location_name}</span>
                    </div>
                  ))}
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
                {canPermanentDelete && (
                  <Button variant="destructive" className="min-h-11" onClick={() => { setPermDeleteTarget(task); setPermDeleteOpen(true); }}>
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

          {/* Desktop: flat table */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-tunet-border">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="size-4 accent-tunet-green" />
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colTask}</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colStatus}</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colPriority}</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colAssignee}</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colLocation}</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colDeadline}</th>
                {canPermanentDelete && <th className="text-right py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.trash.colActions}</th>}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const statusConfig = STATUS_CONFIG[task.status];
                const overdue = isOverdue(task);
                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="border-b border-tunet-border last:border-0 hover:bg-tunet-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleSelect(task.id)} className="size-4 accent-tunet-green" />
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
                        <span className={`text-xs ${overdue ? "text-red-400 font-medium" : "text-tunet-text-muted"}`}>
                          {task.deadline ? formatShortDate(task.deadline) : "—"}
                        </span>
                        {overdue && <Badge variant="destructive" className="text-[10px] px-1 py-0">{COPY.taskList.overdue}</Badge>}
                      </div>
                    </td>
                    {canPermanentDelete && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPermDeleteTarget(task); setPermDeleteOpen(true); }}
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
