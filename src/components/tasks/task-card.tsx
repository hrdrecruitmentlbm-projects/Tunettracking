"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Task, TaskStatus, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
import { MapPin, Clock, User, AlertTriangle, Trash2, ArrowUpRight, Camera } from "lucide-react";
import { getTimeRemaining } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { softDeleteTask } from "@/lib/db";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: Task["status"]) => void;
  onClick?: (task: Task) => void;
  canChangeStatus?: boolean;
  canDelete?: boolean;
  onDeleted?: (taskId: string) => void;
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
}: TaskCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const getAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return COPY.taskCard.today;
    if (diffDays === 1) return COPY.taskCard.oneDay;
    return COPY.taskCard.daysAgo(diffDays);
  };

  const isOverdue =
    task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";
  const timeRemaining = getTimeRemaining(task.deadline);
  const isDeleted = !!task.deleted_at;

  const handleDelete = async () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("tutrack-user");
    if (!stored) return;
    const currentUser = JSON.parse(stored);
    setDeleting(true);
    const ok = await softDeleteTask(task.id, currentUser.id);
    if (ok) {
      toast.success(COPY.taskDetail.deleteSuccess);
      onDeleted?.(task.id);
      setDeleteOpen(false);
    } else {
      toast.error(COPY.taskDetail.deleteFailedDefault);
    }
    setDeleting(false);
  };

  const handleAdvance = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dest = NEXT_STATUS[task.status];
    if (dest && onStatusChange) {
      onStatusChange(task.id, dest);
    }
  };

  const showAdvance = onStatusChange && task.status !== "done" && !isDeleted;

  return (
    <Card
      className={cn(
        "group relative bg-tunet-surface border border-tunet-border overflow-hidden",
        "transition-all duration-200 ease-out cursor-pointer",
        "hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35),0_4px_12px_-6px_rgba(0,0,0,0.5)]"
      )}
      onClick={() => onClick?.(task)}
    >
      {/* Top status rail — 2px full-width bar matching the status color */}
      <div className="h-0.5 w-full" style={{ backgroundColor: statusConfig.color }} />

      {canDelete && !isDeleted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteOpen(true);
          }}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-status-overdue/10 text-tunet-text-muted hover:text-status-overdue transition-opacity"
          aria-label={COPY.actions.delete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-3">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${priorityConfig.dot}`} />
          <h3 className="font-medium text-tunet-text text-sm leading-tight pr-6">{task.title}</h3>
        </div>

        <div className="flex items-center gap-1.5 mb-3 text-tunet-text-muted">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs truncate">{task.location_name}</span>
        </div>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: statusConfig.color + "20", color: statusConfig.color }}
          >
            {statusConfig.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              {COPY.taskCard.overdue}
            </Badge>
          )}
          {isDeleted && (
            <Badge variant="destructive" className="text-xs">
              Deleted
            </Badge>
          )}
          {timeRemaining && !isOverdue && timeRemaining.isUrgent && task.status !== "done" && (
            <Badge
              variant="secondary"
              className="text-xs bg-status-progress/20 text-status-progress"
            >
              <Clock className="w-3 h-3 mr-1" />
              {timeRemaining.label}
            </Badge>
          )}
          {timeRemaining && isOverdue && task.status !== "done" && (
            <Badge
              variant="secondary"
              className="text-xs bg-status-overdue/20 text-status-overdue"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              {timeRemaining.label}
            </Badge>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-tunet-surface text-tunet-text-muted"
            >
              <Camera className="w-3 h-3 mr-1" />
              {task.attachments.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-tunet-text-muted">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{task.assigned_to ? COPY.taskCard.assigned : COPY.taskCard.unassigned}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{getAge(task.created_at)}</span>
          </div>
        </div>

        {showAdvance && (
          <div className="mt-3 pt-3 border-t border-tunet-border/60 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-tunet-text-muted">
              {COPY.taskCard.advanceTo}
            </span>
            <button
              onClick={handleAdvance}
              disabled={!canChangeStatus}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-tunet-signal/15 text-tunet-signal hover:bg-tunet-signal/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-tunet-signal/15"
            >
              {NEXT_STATUS_LABEL[task.status]}
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {!canChangeStatus && showAdvance && (
          <p className="text-[10px] text-tunet-text-muted text-center mt-2">
            Status hanya bisa diubah oleh NOC
          </p>
        )}
      </CardContent>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-tunet-surface border-tunet-border">
          <DialogHeader>
            <DialogTitle className="text-tunet-text">
              {COPY.taskDetail.deleteConfirmTitle}
            </DialogTitle>
            <DialogDescription className="text-tunet-text-muted">
              {COPY.taskDetail.deleteConfirmDesc(task.title)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="border-tunet-border text-tunet-text"
            >
              {COPY.actions.cancel}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-status-overdue hover:bg-status-overdue/90 text-white"
            >
              {deleting ? COPY.taskDetail.deleting : COPY.actions.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
