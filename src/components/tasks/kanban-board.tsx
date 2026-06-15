"use client";

import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Task, TaskStatus, STATUS_CONFIG } from "@/types";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  canChangeStatus?: boolean;
}

const COLUMNS: TaskStatus[] = ["todo", "assigned", "in_progress", "review", "done"];

export function KanbanBoard({ tasks, onStatusChange, onTaskClick, canChangeStatus = true }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
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
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onStatusChange={onStatusChange}
            onTaskClick={onTaskClick}
            canChangeStatus={canChangeStatus}
          />
        ))}
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
}

function KanbanColumn({ status, tasks, onStatusChange, onTaskClick, canChangeStatus }: KanbanColumnProps) {
  const config = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
        <h3 className="font-medium text-tunet-text text-sm">{config.label}</h3>
        <span className="text-xs text-tunet-text-muted bg-tunet-surface px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "h-[calc(100vh-280px)] rounded-lg transition-colors",
          isOver && "bg-tunet-surface-hover/40"
        )}
      >
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-4">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onClick={onTaskClick}
                canChangeStatus={canChangeStatus}
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
    </div>
  );
}

interface SortableTaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onClick?: (task: Task) => void;
  canChangeStatus: boolean;
}

function SortableTaskCard({ task, onStatusChange, onClick, canChangeStatus }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onStatusChange={onStatusChange}
        onClick={onClick}
        canChangeStatus={canChangeStatus}
      />
    </div>
  );
}
