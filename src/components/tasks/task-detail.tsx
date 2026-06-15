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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task, User, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
import {
  fetchTaskHistory,
  updateTaskStatus,
  TaskHistoryEntry,
  fetchUsers,
  reassignTask,
  softDeleteTask,
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
  RefreshCw,
  Trash2,
} from "lucide-react";

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (taskId: string, status: Task["status"]) => void;
  canChangeStatus?: boolean;
  onReassigned?: (taskId: string, newAssigneeId: string) => void;
  canDelete?: boolean;
  onDeleted?: (taskId: string) => void;
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
}: TaskDetailProps) {
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [focUsers, setFocUsers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [reassigning, setReassigning] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      toast.error("Pick a different FOC user");
      return;
    }
    setReassigning(true);
    const ok = await reassignTask(task.id, selectedAssignee, currentUser.id);
    if (ok) {
      toast.success("Task reassigned. Old assignee will be notified via Telegram.");
      onReassigned?.(task.id, selectedAssignee);
      onOpenChange(false);
    } else {
      toast.error("Failed to reassign task");
    }
    setReassigning(false);
  };

  const handleDelete = async () => {
    if (!currentUser || !task) return;
    setDeleting(true);
    const ok = await softDeleteTask(task.id, currentUser.id);
    if (ok) {
      toast.success("Task moved to trash");
      onDeleted?.(task.id);
      setDeleteOpen(false);
      onOpenChange(false);
    } else {
      toast.error(
        currentUser.role === "noc"
          ? "You can only delete tasks you created"
          : "Failed to delete task"
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
      toast.success(`Task moved to ${STATUS_CONFIG[newStatus].label}`);
      onStatusChange?.(task.id, newStatus);
      onOpenChange(false);
    } else {
      toast.error("Failed to update task status");
    }
  };

  const isOverdue =
    task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-tunet-surface border-tunet-border w-full sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle className="text-tunet-text text-lg">{task.title}</SheetTitle>
          <SheetDescription className="text-tunet-text-muted">
            Task details and history
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Status + Priority */}
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
                backgroundColor: task.priority === "critical" ? "#EF444420" : task.priority === "high" ? "#F9731620" : task.priority === "medium" ? "#EAB30820" : "#6B728020",
                color: task.priority === "critical" ? "#EF4444" : task.priority === "high" ? "#F97316" : task.priority === "medium" ? "#EAB308" : "#6B7280",
              }}
            >
              {priorityConfig.label} Priority
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
            {isDeleted && (
              <Badge variant="destructive" className="text-xs">
                Deleted
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-tunet-text-muted uppercase mb-1">Description</h4>
            <p className="text-sm text-tunet-text">{task.description}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Assignee */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <UserIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Assignee</span>
              </div>
              <p className="text-sm text-tunet-text">
                {task.assignee?.name || "Unassigned"}
              </p>
            </div>

            {/* Creator */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <UserIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Created by</span>
              </div>
              <p className="text-sm text-tunet-text">
                {task.creator?.name || "Unknown"}
              </p>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Location</span>
              </div>
              <p className="text-sm text-tunet-text">{task.location_name}</p>
            </div>

            {/* Deadline */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Deadline</span>
              </div>
              <p className="text-sm text-tunet-text">
                {task.deadline ? formatDate(task.deadline) : "No deadline"}
              </p>
            </div>

            {/* Created */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Created</span>
              </div>
              <p className="text-sm text-tunet-text">{formatDate(task.created_at)}</p>
            </div>

            {/* Updated */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Updated</span>
              </div>
              <p className="text-sm text-tunet-text">{formatDate(task.updated_at)}</p>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-tunet-text-muted mb-2">
                <Tag className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Tags</span>
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

          {/* Reassign (admin/noc only) */}
          {canReassign && task.status !== "done" && (
            <div className="border-t border-tunet-border pt-4 space-y-2">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase">Reassign</span>
              </div>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full rounded-md border border-tunet-border bg-tunet-bg px-3 py-2 text-sm text-tunet-text focus:outline-none focus:ring-2 focus:ring-tunet-green/50"
              >
                <option value="">— Unassigned —</option>
                {focUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.id === task.assigned_to ? " (current)" : ""}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleReassign}
                disabled={
                  reassigning ||
                  !selectedAssignee ||
                  selectedAssignee === task.assigned_to
                }
                size="sm"
                className="w-full bg-tunet-green hover:bg-tunet-green-dark text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-2 ${reassigning ? "animate-spin" : ""}`}
                />
                {reassigning ? "Reassigning..." : "Confirm Reassign"}
              </Button>
              <p className="text-[10px] text-tunet-text-muted">
                Old assignee will be notified via Telegram.
              </p>
            </div>
          )}

          {/* Quick status actions */}
          <div>
            <h4 className="text-xs font-medium text-tunet-text-muted uppercase mb-2">
              Change Status
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.status === "assigned" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={!canChangeStatus}
                  className="bg-tunet-green hover:bg-tunet-green-dark text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Work
                </Button>
              )}
              {task.status === "in_progress" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("review")}
                  disabled={!canChangeStatus}
                  className="bg-status-review hover:opacity-90 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Review
                </Button>
              )}
              {task.status === "review" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("done")}
                  disabled={!canChangeStatus}
                  className="bg-status-done hover:opacity-90 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark Complete
                </Button>
              )}
              {canChangeStatus && task.status !== "done" && (
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
                  Skip to Next
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
            {!canChangeStatus && (
              <p className="text-[10px] text-tunet-text-muted mt-2">
                Status hanya bisa diubah oleh NOC
              </p>
            )}
          </div>

          {/* Delete (admin/noc only, not for deleted tasks) */}
          {canDelete && !isDeleted && (
            <div className="border-t border-tunet-border pt-4">
              <Button
                onClick={() => setDeleteOpen(true)}
                size="sm"
                variant="outline"
                className="w-full border-status-overdue/50 text-status-overdue hover:bg-status-overdue/10 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete Task
              </Button>
              <p className="text-[10px] text-tunet-text-muted mt-1.5 text-center">
                {currentUser?.role === "noc"
                  ? "You can only delete tasks you created"
                  : "Moves the task to trash. You can view deleted tasks from the tasks page."}
              </p>
            </div>
          )}

          {/* Status History */}
          <div>
            <div className="flex items-center gap-1.5 text-tunet-text-muted mb-2">
              <History className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Status History</span>
            </div>
            {loadingHistory ? (
              <p className="text-xs text-tunet-text-muted">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-tunet-text-muted">No status changes yet</p>
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
                        <span className="font-medium">
                          {entry.performer?.name || "Unknown"}
                        </span>{" "}
                        changed status from{" "}
                        <span className="font-medium">
                          {STATUS_CONFIG[(entry.old_value?.status as string) as keyof typeof STATUS_CONFIG]?.label || String(entry.old_value?.status)}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {STATUS_CONFIG[(entry.new_value?.status as string) as keyof typeof STATUS_CONFIG]?.label || String(entry.new_value?.status)}
                        </span>
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
      </SheetContent>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              This task will be moved to trash and hidden from views. You can view deleted
              tasks from the tasks page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="border-tunet-border text-tunet-text-muted"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-status-overdue hover:opacity-90 text-white"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
