"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task, STATUS_CONFIG, PRIORITY_CONFIG, User } from "@/types";
import {
  fetchTaskHistory,
  updateTaskStatus,
  fetchUsers,
  reassignTask,
  softDeleteTask,
  TaskHistoryEntry,
} from "@/lib/db";
import { toast } from "sonner";
import {
  MapPin,
  Calendar,
  User as UserIcon,
  Clock,
  Tag,
  ArrowRight,
  History,
  Pencil,
} from "lucide-react";
import { COPY } from "@/lib/copy";
import { formatLongDate } from "@/lib/time";
import { TaskForm } from "./task-form";

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (taskId: string, status: Task["status"]) => void;
  canChangeStatus?: boolean;
  onReassigned?: (taskId: string, newAssigneeId: string) => void;
  canDelete?: boolean;
  onDeleted?: (taskId: string) => void;
  canEdit?: boolean;
  onUpdated?: (task: Task) => void;
}

export function TaskDetail({
  task,
  open,
  onOpenChange,
  onStatusChange,
  canChangeStatus = true,
  onReassigned,
  canDelete = false,
  onDeleted,
  canEdit = false,
  onUpdated,
}: TaskDetailProps) {
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [focUsers, setFocUsers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [reassigning, setReassigning] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const canReassign = currentUser?.role === "admin" || currentUser?.role === "noc";
  const isDeleted = !!task?.deleted_at;

  useEffect(() => {
    if (open && task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingHistory(true);
      fetchTaskHistory(task.id).then((h) => {
        setHistory(h);
        setLoadingHistory(false);
      });
      fetchUsers().then((u) => {
        setFocUsers(u.filter((x) => x.role === "foc"));
      });
      if (task.assigned_to) {
        setSelectedAssignee(task.assigned_to);
      }
    }
  }, [open, task]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("tunetops-user");
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleReassign = async () => {
    if (!currentUser || !task) return;
    if (!selectedAssignee || selectedAssignee === task.assigned_to) {
      toast.error("Pilih anggota FOC yang berbeda");
      return;
    }
    setReassigning(true);
    const ok = await reassignTask(task.id, selectedAssignee, currentUser.id);
    if (ok) {
      toast.success("Tugas dialihkan. Penerima tugas lama akan diberi tahu melalui Telegram.");
      onReassigned?.(task.id, selectedAssignee);
      onOpenChange(false);
    } else {
      toast.error("Gagal mengalihkan tugas");
    }
    setReassigning(false);
  };

  const handleDelete = async () => {
    if (!currentUser || !task) return;
    setDeleting(true);
    const ok = await softDeleteTask(task.id, currentUser.id);
    if (ok) {
      toast.success("Tugas dipindahkan ke sampah");
      onDeleted?.(task.id);
      setDeleteOpen(false);
      onOpenChange(false);
    } else {
      toast.error(
        currentUser.role === "noc"
          ? "Anda hanya dapat menghapus tugas yang Anda buat"
          : "Gagal menghapus tugas"
      );
    }
    setDeleting(false);
  };

  if (!task) return null;

  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const handleStatusChange = async (newStatus: Task["status"]) => {
    const storedUser = localStorage.getItem("tunetops-user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    if (!currentUser) return;

    const success = await updateTaskStatus(task.id, newStatus, currentUser.id);
    if (success) {
      toast.success(COPY.taskDetail.movedTo(STATUS_CONFIG[newStatus].label));
      onStatusChange?.(task.id, newStatus);
      onOpenChange(false);
    } else {
      toast.error(COPY.taskDetail.failedUpdate);
    }
  };

  const isOverdue =
    task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

  const formatDate = (dateStr: string) => formatLongDate(dateStr);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-tunet-surface border-tunet-border w-full sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle className="text-tunet-text text-lg">{task.title}</SheetTitle>
          <SheetDescription className="text-tunet-text-muted">
            {COPY.taskDetail.title}
          </SheetDescription>
        </SheetHeader>

        {canEdit && !isDeleted && (
          <div className="px-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="w-full border-tunet-border text-tunet-text hover:bg-tunet-surface-hover"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              {COPY.actions.edit}
            </Button>
          </div>
        )}

        <div className="px-4 pb-4 space-y-5 overflow-y-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: statusConfig.color + "20", color: statusConfig.color }}
            >
              {statusConfig.label}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor:
                  task.priority === "critical" ? "#EF444420" :
                  task.priority === "high" ? "#F9731620" :
                  task.priority === "medium" ? "#EAB30820" : "#6B728020",
                color:
                  task.priority === "critical" ? "#EF4444" :
                  task.priority === "high" ? "#F97316" :
                  task.priority === "medium" ? "#EAB308" : "#6B7280",
              }}
            >
              {COPY.taskDetail.priorityLabel(priorityConfig.label)}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                {COPY.taskCard.overdue}
              </Badge>
            )}
          </div>

          <div>
            <h4 className="text-xs font-medium text-tunet-text-muted uppercase mb-1">{COPY.taskDetail.description}</h4>
            <p className="text-sm text-tunet-text">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <UserIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{COPY.taskDetail.assignee}</span>
              </div>
              <p className="text-sm text-tunet-text">
                {task.assignee?.name || COPY.taskDetail.unassigned}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <UserIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{COPY.taskDetail.createdBy}</span>
              </div>
              <p className="text-sm text-tunet-text">
                {task.creator?.name || COPY.taskDetail.unknown}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{COPY.taskDetail.location}</span>
              </div>
              <p className="text-sm text-tunet-text">{task.location_name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{COPY.taskDetail.deadline}</span>
              </div>
              <p className="text-sm text-tunet-text">
                {task.deadline ? formatDate(task.deadline) : COPY.taskDetail.noDeadline}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{COPY.taskDetail.created}</span>
              </div>
              <p className="text-sm text-tunet-text">{formatDate(task.created_at)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{COPY.taskDetail.updated}</span>
              </div>
              <p className="text-sm text-tunet-text">{formatDate(task.updated_at)}</p>
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-tunet-text-muted mb-2">
                <Tag className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{COPY.taskDetail.tags}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-tunet-text-muted uppercase mb-2">
              {COPY.taskDetail.changeStatus}
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.status === "assigned" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("in_progress")}
                  className="bg-tunet-green hover:bg-tunet-green-dark text-white text-xs"
                >
                  {COPY.taskDetail.startWork}
                </Button>
              )}
              {task.status === "in_progress" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("review")}
                  className="bg-status-review hover:opacity-90 text-white text-xs"
                >
                  {COPY.taskDetail.submitReview}
                </Button>
              )}
              {task.status === "review" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("done")}
                  className="bg-status-done hover:opacity-90 text-white text-xs"
                >
                  {COPY.taskDetail.markComplete}
                </Button>
              )}
              {task.status !== "done" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const nextStatuses: Record<string, string> = {
                      todo: "assigned",
                      assigned: "in_progress",
                      in_progress: "review",
                      review: "done",
                    };
                    const next = nextStatuses[task.status];
                    if (next) handleStatusChange(next as Task["status"]);
                  }}
                  className="border-tunet-border text-tunet-text-muted text-xs"
                >
                  {COPY.taskDetail.skipToNext}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-tunet-text-muted mb-2">
              <History className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{COPY.taskDetail.statusHistory}</span>
            </div>
            {loadingHistory ? (
              <p className="text-xs text-tunet-text-muted">{COPY.taskDetail.loadingHistory}</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-tunet-text-muted">{COPY.taskDetail.noStatusChanges}</p>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 text-xs p-2 rounded bg-tunet-bg border border-tunet-border"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-tunet-green mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-tunet-text">
                        {COPY.taskDetail.statusChangedBy(
                          entry.performer?.name || COPY.taskDetail.unknown,
                          STATUS_CONFIG[(entry.old_value?.status as string) as keyof typeof STATUS_CONFIG]?.label || String(entry.old_value?.status),
                          STATUS_CONFIG[(entry.new_value?.status as string) as keyof typeof STATUS_CONFIG]?.label || String(entry.new_value?.status)
                        )}
                      </p>
                      <p className="text-tunet-text-muted mt-0.5">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
          )}
        </div>
        </div>

        <TaskForm
          open={editOpen}
          onOpenChange={setEditOpen}
          onTaskCreated={() => {}}
          onTaskUpdated={(updated) => {
            onUpdated?.(updated);
            onOpenChange(false);
          }}
          editingTask={task}
        />
      </SheetContent>
    </Sheet>
  );
}
