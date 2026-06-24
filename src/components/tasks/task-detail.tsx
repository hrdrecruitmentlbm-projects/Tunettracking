"use client";

import { useState, useEffect, useRef } from "react";
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
import { Task, STATUS_CONFIG, PRIORITY_CONFIG, User, Attachment } from "@/types";
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
  Trash2,
  Camera,
  Upload,
  X,
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
  const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canReassign = currentUser?.role === "admin" || currentUser?.role === "noc";
  const isDeleted = !!task?.deleted_at;

  useEffect(() => {
    if (open && task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttachments(task.attachments || []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLightboxUrl(null);
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
    if (!open || !task) return;
    let cancelled = false;
    fetch(`/api/tasks/${task.id}/attachments`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.ok || !data.attachments) return;
        setAttachments((prev) => {
          const byId = new Map(prev.map((a) => [a.id, a]));
          for (const att of data.attachments as Attachment[]) {
            const existing = byId.get(att.id);
            byId.set(att.id, { ...existing, ...att });
          }
          return Array.from(byId.values());
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, task?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("tutrack-user");
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
      toast.success(COPY.taskDetail.deleteSuccess);
      onDeleted?.(task.id);
      setDeleteOpen(false);
      onOpenChange(false);
    } else {
      toast.error(
        currentUser.role === "noc"
          ? COPY.taskDetail.deleteFailedNoc
          : COPY.taskDetail.deleteFailedDefault
      );
    }
    setDeleting(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !task) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("photos", file);
      }

      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ok && data.attachments) {
        setAttachments((prev) => [...prev, ...data.attachments]);
        toast.success(`${data.attachments.length} foto berhasil diunggah`);
      } else {
        toast.error(data.error || "Gagal mengunggah foto");
      }
    } catch {
      toast.error("Gagal mengunggah foto");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId }),
      });

      const data = await res.json();
      if (data.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        toast.success("Foto dihapus");
      } else {
        toast.error(data.error || "Gagal menghapus foto");
      }
    } catch {
      toast.error("Gagal menghapus foto");
    }
  };

  const handleOpenLightbox = (url: string | undefined) => {
    if (url) {
      setLightboxUrl(url);
    }
  };

  if (!task) return null;

  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const handleStatusChange = async (newStatus: Task["status"]) => {
    const storedUser = localStorage.getItem("tutrack-user");
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
          <div className="px-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="flex-1 border-tunet-border text-tunet-text hover:bg-tunet-surface-hover"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              {COPY.actions.edit}
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="flex-1 border-tunet-border text-status-overdue hover:bg-status-overdue/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {COPY.actions.delete}
              </Button>
            )}
          </div>
        )}

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

          {/* Photo Gallery Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-tunet-text-muted">
                <Camera className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  Foto ({attachments.length})
                </span>
                {attachments.length > 0 && (
                  <span className="text-xs text-tunet-text-muted">
                    — {attachments.filter((a) => a.upload_phase === "in_progress").length} proses,{" "}
                    {attachments.filter((a) => a.upload_phase === "completed").length} selesai
                  </span>
                )}
              </div>
              {task.status !== "done" && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-7 text-xs border-tunet-border text-tunet-text"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {uploading ? "Mengunggah..." : "Add Photo"}
                  </Button>
                </>
              )}
            </div>

            {attachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((att) => (
                  <div key={att.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(att.signed_url)}
                      className="w-full aspect-square rounded-lg overflow-hidden bg-tunet-bg border border-tunet-border relative"
                    >
                      {att.signed_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={att.signed_url}
                          alt={att.caption || "Foto lampiran"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-tunet-text-muted">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                    </button>
                    {task.status !== "done" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/60 text-white text-[9px] text-center rounded-b-lg">
                      {att.upload_phase === "completed" ? "Selesai" : "Proses"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-tunet-text-muted">
                Belum ada foto. Unggah bukti kerja melalui Telegram atau web app.
              </p>
            )}
          </div>

          {/* Lightbox Dialog */}
          {lightboxUrl && (
            <Dialog open onOpenChange={() => setLightboxUrl(null)}>
              <DialogContent className="bg-black border-none max-w-2xl p-2">
                <img
                  src={lightboxUrl}
                  alt="Photo attachment"
                  className="w-full h-auto rounded"
                />
              </DialogContent>
            </Dialog>
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
