"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowUpRight, Clock, MapPin, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COPY } from "@/lib/copy";
import { softDeleteTask } from "@/lib/db";
import { getTimeRemaining, getUrgencyTier } from "@/lib/time";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, STATUS_CONFIG, Task, TaskStatus } from "@/types";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: Task["status"]) => void;
  onClick?: (task: Task) => void;
  canChangeStatus?: boolean;
  canDelete?: boolean;
  onDeleted?: (taskId: string) => void;
  dragHandle?: ReactNode;
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  assigned: "in_progress",
  in_progress: "review",
  review: "done",
  done: null,
};

const NEXT_STATUS_LABEL: Record<TaskStatus, string | null> = {
  assigned: COPY.taskCard.start,
  in_progress: COPY.taskCard.submitReview,
  review: COPY.taskCard.complete,
  done: null,
};

export function TaskCard({
  task,
  onStatusChange,
  onClick,
  canChangeStatus = true,
  canDelete = false,
  onDeleted,
  dragHandle,
}: TaskCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renderedAt] = useState(() => Date.now());
  const status = STATUS_CONFIG[task.status];
  const priority = PRIORITY_CONFIG[task.priority];
  const remaining = getTimeRemaining(task.deadline);
  const urgency = getUrgencyTier(task.deadline, task.status);
  const isDeleted = Boolean(task.deleted_at);
  const showAdvance = Boolean(onStatusChange && task.status !== "done" && !isDeleted);

  const ageInDays = Math.floor(
    (renderedAt - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const age =
    ageInDays === 0
      ? COPY.taskCard.today
      : ageInDays === 1
        ? COPY.taskCard.oneDay
        : COPY.taskCard.daysAgo(ageInDays);

  const handleDelete = async () => {
    const stored = localStorage.getItem("tutrack-user");
    if (!stored) return;

    setDeleting(true);
    const success = await softDeleteTask(task.id, JSON.parse(stored).id);
    if (success) {
      toast.success(COPY.taskDetail.deleteSuccess);
      onDeleted?.(task.id);
      setDeleteOpen(false);
    } else {
      toast.error(COPY.taskDetail.deleteFailedDefault);
    }
    setDeleting(false);
  };

  const handleAdvance = (event: React.MouseEvent) => {
    event.stopPropagation();
    const destination = NEXT_STATUS[task.status];
    if (destination) onStatusChange?.(task.id, destination);
  };

  return (
    <Card
      className={cn(
        "relative border border-tunet-border bg-tunet-surface transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none",
        "hover:-translate-y-0.5 hover:border-tunet-signal/35 hover:shadow-[0_16px_36px_-28px_rgba(34,211,238,0.7)] motion-reduce:hover:translate-y-0",
        "border-l-[3px]",
        task.status === "assigned" && "border-l-status-assigned",
        task.status === "in_progress" && "border-l-status-progress",
        task.status === "review" && "border-l-status-review",
        task.status === "done" && "border-l-status-done"
      )}
    >
      {dragHandle && <div className="absolute left-2 top-2">{dragHandle}</div>}

      {canDelete && !isDeleted && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          className="absolute right-1.5 top-1.5 size-11 text-tunet-text-muted hover:text-status-overdue"
          aria-label={`${COPY.actions.delete}: ${task.title}`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      )}

      <CardContent className="px-0">
        <button
          type="button"
          onClick={() => onClick?.(task)}
          className="block w-full rounded-lg px-4 pb-3 pt-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tunet-signal"
        >
          <div
            className={cn(
              "flex items-center gap-2 pr-8",
              dragHandle && "pl-8"
            )}
          >
            <Badge variant="secondary">{priority.label}</Badge>
            <span className="truncate text-xs text-tunet-text-muted">{status.label}</span>
          </div>

          <h3
            className={cn(
              "mt-3 text-pretty text-sm font-semibold leading-5 text-tunet-text",
              dragHandle && "pl-8"
            )}
          >
            {task.title}
          </h3>

          <div className="mt-4 flex flex-col gap-2 text-xs text-tunet-text-muted">
            <span className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{task.location_name}</span>
            </span>
            <span className="flex items-center gap-2">
              <User className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {task.assignee?.name || (task.assigned_to ? COPY.taskCard.assigned : COPY.taskCard.unassigned)}
              </span>
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-tunet-border/60 pt-3">
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs",
                remaining?.isOverdue
                  ? "font-medium text-status-overdue"
                  : remaining?.isUrgent
                    ? "font-medium text-tunet-ember"
                    : "text-tunet-text-muted"
              )}
            >
              {remaining?.isOverdue ? (
                <AlertTriangle className="size-3.5" aria-hidden="true" />
              ) : (
                <Clock className="size-3.5" aria-hidden="true" />
              )}
              {remaining?.label || "Tanpa tenggat"}
            </span>
            <span className="font-mono text-xs tabular-nums text-tunet-text-muted">{age}</span>
          </div>
        </button>

        {showAdvance && (
          <div className="border-t border-tunet-border/60 px-3 py-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAdvance}
              disabled={!canChangeStatus}
              className="min-h-11 w-full"
              aria-label={`${COPY.taskCard.advanceTo} ${NEXT_STATUS_LABEL[task.status]}`}
            >
              {NEXT_STATUS_LABEL[task.status]}
              <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-tunet-surface">
          <DialogHeader>
            <DialogTitle>{COPY.taskDetail.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>{COPY.taskDetail.deleteConfirmDesc(task.title)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {COPY.actions.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? COPY.taskDetail.deleting : COPY.actions.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
