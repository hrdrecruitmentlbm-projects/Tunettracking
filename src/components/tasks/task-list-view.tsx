"use client";

import { useState } from "react";
import { Task, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
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
import { MapPin, Clock, User, Trash2 } from "lucide-react";
import { formatShortDate } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { permanentDeleteTask } from "@/lib/db";
import { toast } from "sonner";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  canPermanentDelete?: boolean;
  onPermanentDelete?: (taskId: string) => void;
}

export function TaskListView({
  tasks,
  onTaskClick,
  canPermanentDelete = false,
  onPermanentDelete,
}: TaskListViewProps) {
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [permDeleting, setPermDeleting] = useState(false);
  const [permDeleteTarget, setPermDeleteTarget] = useState<Task | null>(null);

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

  const colCount = canPermanentDelete ? 7 : 6;

  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-tunet-border">
            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colTask}</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colStatus}</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colPriority}</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colAssignee}</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colLocation}</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.taskList.colDeadline}</th>
            {canPermanentDelete && (
              <th className="text-right py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.trash.colActions}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const statusConfig = STATUS_CONFIG[task.status];
            const isOverdue =
              task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="border-b border-tunet-border last:border-0 hover:bg-tunet-surface-hover cursor-pointer transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          task.priority === "critical"
                            ? "#EF4444"
                            : task.priority === "high"
                            ? "#F97316"
                            : task.priority === "medium"
                            ? "#EAB308"
                            : "#6B7280",
                      }}
                    />
                    <span className="text-tunet-text font-medium">{task.title}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: statusConfig.color + "20", color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor:
                        task.priority === "critical" ? "#EF444420" : task.priority === "high" ? "#F9731620" : task.priority === "medium" ? "#EAB30820" : "#6B728020",
                      color:
                        task.priority === "critical" ? "#EF4444" : task.priority === "high" ? "#F97316" : task.priority === "medium" ? "#EAB308" : "#6B7280",
                    }}
                  >
                    {PRIORITY_CONFIG[task.priority].label}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 text-tunet-text-muted">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {task.assignee?.name || COPY.taskList.unassigned}
                    </span>
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
                    <span className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-tunet-text-muted"}`}>
                      {task.deadline ? formatShortDate(task.deadline) : "—"}
                    </span>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">
                        {COPY.taskList.overdue}
                      </Badge>
                    )}
                  </div>
                </td>
                {canPermanentDelete && (
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPermDeleteTarget(task);
                        setPermDeleteOpen(true);
                      }}
                      className="p-1.5 rounded hover:bg-status-overdue/10 text-tunet-text-muted hover:text-status-overdue transition-colors"
                      aria-label={COPY.pages.trash.permanentlyDelete}
                      title={COPY.pages.trash.permanentlyDelete}
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
              <td colSpan={colCount} className="py-12 text-center text-tunet-text-muted text-sm">
                {COPY.taskList.emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Dialog open={permDeleteOpen} onOpenChange={setPermDeleteOpen}>
        <DialogContent className="bg-tunet-surface border-tunet-border">
          <DialogHeader>
            <DialogTitle className="text-tunet-text">
              {COPY.taskDetail.permDeleteConfirmTitle}
            </DialogTitle>
            <DialogDescription className="text-tunet-text-muted">
              {permDeleteTarget && COPY.taskDetail.permDeleteConfirmDesc(permDeleteTarget.title)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermDeleteOpen(false)}
              className="border-tunet-border text-tunet-text"
            >
              {COPY.actions.cancel}
            </Button>
            <Button
              onClick={handlePermanentDelete}
              disabled={permDeleting}
              className="bg-status-overdue hover:bg-status-overdue/90 text-white"
            >
              {permDeleting ? COPY.taskDetail.permDeleting : COPY.pages.trash.permanentlyDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
