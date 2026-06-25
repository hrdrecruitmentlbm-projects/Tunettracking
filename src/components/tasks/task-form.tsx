"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchUsers,
  fetchTags,
  createTask,
  getCurrentUser,
  updateTask,
  CreateTaskInput,
} from "@/lib/db";
import { User, Tag, Task, PRIORITY_CONFIG } from "@/types";
import { toast } from "sonner";
import { MapPin, Calendar, Tag as TagIcon } from "lucide-react";
import { COPY } from "@/lib/copy";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  editingTask?: Task | null;
}

export function TaskForm({
  open,
  onOpenChange,
  onTaskCreated,
  onTaskUpdated,
  editingTask,
}: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<string>("");
  const [locationLng, setLocationLng] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [focUsers, setFocUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const isEditMode = !!editingTask;

  useEffect(() => {
    if (open) {
      fetchUsers().then((users) =>
        setFocUsers(users.filter((u) => u.role === "foc" || u.role === "marketing"))
      );
      fetchTags().then(setTags);
    }
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignedTo("");
    setLocationName("");
    setLocationLat("");
    setLocationLng("");
    setDeadline("");
    setSelectedTags([]);
  };

  useEffect(() => {
    if (open && editingTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(editingTask.title);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(editingTask.description);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPriority(editingTask.priority);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssignedTo(editingTask.assigned_to || "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationName(editingTask.location_name);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationLat(String(editingTask.location_lat));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationLng(String(editingTask.location_lng));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDeadline(
        editingTask.deadline
          ? new Date(editingTask.deadline).toISOString().slice(0, 16)
          : ""
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTags((editingTask.tags || []).map((t) => t.id));
    } else if (open && !editingTask) {
      resetForm();
    }
  }, [open, editingTask]);

  const handleSessionExpired = () => {
    localStorage.removeItem("tutrack-user");
    toast.error("Sesi berakhir. Silakan masuk lagi.");
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !locationName.trim()) {
      toast.error(COPY.taskForm.requiredFieldsMissing);
      return;
    }

    const storedUser = localStorage.getItem("tutrack-user");
    const cachedUser = storedUser ? JSON.parse(storedUser) : null;
    if (!cachedUser?.id) {
      handleSessionExpired();
      return;
    }

    const currentUser = await getCurrentUser(cachedUser.id);
    if (!currentUser) {
      handleSessionExpired();
      return;
    }

    setSubmitting(true);

    const input: CreateTaskInput = {
      title: title.trim(),
      description: description.trim(),
      priority,
      assigned_to: assignedTo || undefined,
      location_name: locationName.trim(),
      location_lat: parseFloat(locationLat) || -6.9175,
      location_lng: parseFloat(locationLng) || 107.6191,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    };

    if (isEditMode && editingTask) {
      const { task, error } = await updateTask(
        editingTask.id,
        {
          ...input,
          assigned_to: assignedTo || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        },
        currentUser
      );
      if (task) {
        toast.success(COPY.taskForm.updated);
        onTaskUpdated?.(task);
        onOpenChange(false);
      } else {
        toast.error(error || COPY.taskForm.failedUpdate);
      }
    } else {
      const { task, error } = await createTask(input, currentUser);
      if (task) {
        toast.success(COPY.taskForm.created);
        resetForm();
        onOpenChange(false);
        onTaskCreated(task);
      } else {
        toast.error(error || COPY.taskForm.failed);
      }
    }

    setSubmitting(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-tunet-surface border-tunet-border w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-tunet-text">
            {isEditMode ? COPY.taskForm.editTitle : COPY.taskForm.createTitle}
          </SheetTitle>
          <SheetDescription className="text-tunet-text-muted">
            {isEditMode ? COPY.taskForm.editSubtitle : COPY.taskForm.createSubtitle}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium text-tunet-text">
              {COPY.taskForm.title} <span className="text-red-400">*</span>
            </label>
            <Input
              id="task-title"
              placeholder={COPY.taskForm.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-tunet-bg border-tunet-border text-tunet-text"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="task-description" className="text-sm font-medium text-tunet-text">
              {COPY.taskForm.description} <span className="text-red-400">*</span>
            </label>
            <textarea
              id="task-description"
              placeholder={COPY.taskForm.descPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-tunet-border bg-tunet-bg px-3 py-2 text-sm text-tunet-text placeholder:text-tunet-text-muted focus:outline-none focus:ring-2 focus:ring-tunet-green/50 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="task-priority" className="text-sm font-medium text-tunet-text">{COPY.taskForm.priority}</label>
            <div id="task-priority" className="flex gap-2 flex-wrap">
              {(Object.entries(PRIORITY_CONFIG) as [string, { label: string; color: string; dot: string }][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      priority === key
                        ? `${config.color} border-current text-tunet-text`
                        : "border-tunet-border text-tunet-text-muted hover:border-tunet-green/50"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                    {config.label}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="task-assignee" className="text-sm font-medium text-tunet-text">{COPY.taskForm.assignTo}</label>
            <select
              id="task-assignee"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              aria-label={COPY.taskForm.assignTo}
              className="w-full rounded-md border border-tunet-border bg-tunet-bg px-3 py-2 text-sm text-tunet-text focus:outline-none focus:ring-2 focus:ring-tunet-green/50"
            >
              <option value="">{COPY.taskCard.unassigned}</option>
              {focUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="task-location" className="text-sm font-medium text-tunet-text">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              {COPY.taskForm.location} <span className="text-red-400">*</span>
            </label>
            <Input
              id="task-location"
              placeholder={COPY.taskForm.locationPlaceholder}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="bg-tunet-bg border-tunet-border text-tunet-text"
              required
            />
            <div className="flex gap-2">
              <Input
                id="task-lat"
                placeholder={COPY.taskForm.latitude}
                value={locationLat}
                onChange={(e) => setLocationLat(e.target.value)}
                className="bg-tunet-bg border-tunet-border text-tunet-text"
                type="number"
                step="any"
                inputMode="decimal"
              />
              <Input
                id="task-lng"
                placeholder={COPY.taskForm.longitude}
                value={locationLng}
                onChange={(e) => setLocationLng(e.target.value)}
                className="bg-tunet-bg border-tunet-border text-tunet-text"
                type="number"
                step="any"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="task-deadline" className="text-sm font-medium text-tunet-text">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {COPY.taskForm.deadline}
            </label>
            <Input
              id="task-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-tunet-bg border-tunet-border text-tunet-text"
            />
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-tunet-text">
                <TagIcon className="w-3.5 h-3.5 inline mr-1" />
                {COPY.taskForm.tags}
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "border-current text-tunet-text"
                        : "border-tunet-border text-tunet-text-muted hover:border-tunet-green/50"
                    }`}
                    style={
                      selectedTags.includes(tag.id)
                        ? { backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color }
                        : undefined
                    }
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        <SheetFooter>
          <SheetClose
            render={
              <Button
                variant="outline"
                className="border-tunet-border text-tunet-text-muted"
              />
            }
          >
            {COPY.taskForm.cancel}
          </SheetClose>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !description.trim() || !locationName.trim()}
            className="bg-tunet-green hover:bg-tunet-green-dark text-white"
          >
            {submitting
              ? isEditMode
                ? COPY.taskForm.saving
                : COPY.taskForm.creating
              : isEditMode
              ? COPY.taskForm.save
              : COPY.taskForm.create}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
