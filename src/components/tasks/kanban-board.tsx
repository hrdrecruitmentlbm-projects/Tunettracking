"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Task, TaskStatus, STATUS_CONFIG, WIP_LIMITS } from "@/types";
import { isTaskOverdue } from "@/lib/time";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { GripVertical, AlertTriangle } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  canChangeStatus?: boolean;
  canDelete?: boolean;
  onDeleted?: (taskId: string) => void;
}

const COLUMNS: TaskStatus[] = ["assigned", "in_progress", "review", "done"];

export function KanbanBoard({
  tasks,
  onStatusChange,
  onTaskClick,
  canChangeStatus = true,
  canDelete = false,
  onDeleted,
}: KanbanBoardProps) {
  const sensors = useSensors(
    // Mouse: small movement threshold so clicks still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Touch: require a 250ms press before dragging so vertical scrolling
    // never turns into an accidental card drag. An 8px wobble within the
    // delay window cancels into a normal scroll.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [announcement, setAnnouncement] = useState("");

  // One-time drag hint for touch users (auto-hides after 8s).
  const isTouch = useMediaQuery("(hover: none)");
  const [showDragHint, setShowDragHint] = useState(false);
  useEffect(() => {
    if (!isTouch) return;
    try {
      if (window.localStorage.getItem("tutrack-kanban-hint-seen")) return;
      window.localStorage.setItem("tutrack-kanban-hint-seen", "1");
    } catch {
      // Storage unavailable — still show the hint for this session.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowDragHint(true);
    const timer = setTimeout(() => setShowDragHint(false), 8000);
    return () => clearTimeout(timer);
  }, [isTouch]);

  const handleDragStart = (_event: DragStartEvent) => {
    // Light haptic tick when a drag activates (Android field tablets).
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
  };

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      assigned: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const t of tasks) {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    }
    for (const key of Object.keys(map) as TaskStatus[]) {
      map[key].sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    }
    return map;
  }, [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let destStatus: TaskStatus | null = null;

    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      destStatus = overTask.status;
    } else if (COLUMNS.includes(overId as TaskStatus)) {
      destStatus = overId as TaskStatus;
    }

    if (destStatus && destStatus !== activeTask.status) {
      onStatusChange?.(activeId, destStatus);
      const destLabel = STATUS_CONFIG[destStatus].label;
      setAnnouncement(`${activeTask.title} dipindahkan ke ${destLabel}`);
      setTimeout(() => setAnnouncement(""), 1000);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {announcement}
      </div>
      <div className="flex h-full min-h-0 flex-col">
        {showDragHint && (
          <p className="shrink-0 px-1 pb-2 text-[11px] text-tunet-text-muted" role="note">
            {COPY.kanban.dragHint}
          </p>
        )}
        <div className="grid min-h-0 flex-1 grid-flow-col auto-cols-[minmax(17rem,1fr)] gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onStatusChange={onStatusChange}
            onTaskClick={onTaskClick}
            canChangeStatus={canChangeStatus}
            canDelete={canDelete}
            onDeleted={onDeleted}
          />
        ))}
        </div>
      </div>
    </DndContext>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  canChangeStatus: boolean;
  canDelete: boolean;
  onDeleted?: (taskId: string) => void;
}

function KanbanColumn({
  status,
  tasks,
  onStatusChange,
  onTaskClick,
  canChangeStatus,
  canDelete,
  onDeleted,
}: KanbanColumnProps) {
  const config = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const overdueCount = useMemo(() => tasks.filter(isTaskOverdue).length, [tasks]);
  const wipLimit = WIP_LIMITS[status];
  const wipPct = wipLimit ? Math.min(100, (tasks.length / wipLimit) * 100) : null;

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-tunet-border/70 bg-tunet-surface/35">
      <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 border-b border-tunet-border/70 bg-tunet-bg/90 px-3 backdrop-blur-xl">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
          aria-hidden="true"
        />
        <h3 className="text-sm font-medium text-tunet-text">{config.label}</h3>
        <span className="ml-auto font-mono text-xs tabular-nums text-tunet-text-muted">
          {COPY.kanban.taskCount(tasks.length)}
        </span>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-status-overdue/15 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-status-overdue">
            <AlertTriangle className="size-3" aria-hidden="true" />
            {COPY.kanban.overdueCount(overdueCount)}
          </span>
        )}
      </header>
      {wipLimit && wipPct !== null && (
        <div
          className="h-0.5 w-full bg-tunet-border/60"
          role="img"
          aria-label={COPY.kanban.wipOf(tasks.length, wipLimit)}
        >
          <div
            className={cn(
              "h-full transition-all duration-300",
              tasks.length > wipLimit
                ? "bg-status-overdue"
                : tasks.length === wipLimit
                  ? "bg-status-progress"
                  : "bg-status-done"
            )}
            style={{ width: `${wipPct}%` }}
          />
        </div>
      )}
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-0 flex-1 rounded-b-xl p-3 transition-colors",
          isOver && "bg-tunet-surface-hover/40"
        )}
      >
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-3">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onClick={onTaskClick}
                canChangeStatus={canChangeStatus}
                canDelete={canDelete}
                onDeleted={onDeleted}
              />
            ))}
            {tasks.length === 0 && (
              <EmptyState
                title={COPY.empty.noTasks.title}
                description={COPY.empty.noTasks.description}
                variant="inline"
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}

interface SortableTaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onClick?: (task: Task) => void;
  canChangeStatus: boolean;
  canDelete: boolean;
  onDeleted?: (taskId: string) => void;
}

function SortableTaskCard({
  task,
  onStatusChange,
  onClick,
  canChangeStatus,
  canDelete,
  onDeleted,
}: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canChangeStatus,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        onStatusChange={onStatusChange}
        onClick={onClick}
        canChangeStatus={canChangeStatus}
        canDelete={canDelete}
        onDeleted={onDeleted}
        dragHandle={
          canChangeStatus ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 cursor-grab touch-none text-tunet-text-muted active:cursor-grabbing"
              aria-label={`Pindahkan ${task.title}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical aria-hidden="true" />
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
