"use client";

import { Task, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User } from "lucide-react";
import { formatShortDate } from "@/lib/time";
import { COPY } from "@/lib/copy";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
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
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-tunet-text-muted text-sm">
                {COPY.taskList.emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
