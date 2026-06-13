"use client";

import { useState } from "react";
import { Task, TaskStatus, STATUS_CONFIG } from "@/types";
import { TaskCard } from "./task-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const COLUMNS: TaskStatus[] = ["todo", "assigned", "in_progress", "review", "done"];

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const [filter, setFilter] = useState<string>("all");

  const getColumnTasks = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const config = STATUS_CONFIG[status];
        const columnTasks = getColumnTasks(status);

        return (
          <div key={status} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
              <h3 className="font-medium text-tunet-text text-sm">{config.label}</h3>
              <span className="text-xs text-tunet-text-muted bg-tunet-surface px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Column content */}
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-4">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-tunet-text-muted text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
