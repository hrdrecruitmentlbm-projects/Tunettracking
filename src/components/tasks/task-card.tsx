"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
import { MapPin, Clock, User } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: Task["status"]) => void;
  onClick?: (task: Task) => void;
}

export function TaskCard({ task, onStatusChange, onClick }: TaskCardProps) {
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const getAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

  return (
    <Card
      className="bg-tunet-surface border-tunet-border hover:border-tunet-green/50 transition-colors cursor-pointer"
      onClick={() => onClick?.(task)}
    >
      <CardContent className="p-4">
        {/* Priority dot + Title */}
        <div className="flex items-start gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityConfig.dot}`} />
          <h3 className="font-medium text-tunet-text text-sm leading-tight">{task.title}</h3>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3 text-tunet-text-muted">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs truncate">{task.location_name}</span>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-3">
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: statusConfig.color + "20", color: statusConfig.color }}
          >
            {statusConfig.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        {/* Assignee + Age */}
        <div className="flex items-center justify-between text-xs text-tunet-text-muted">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{task.assigned_to ? "Assigned" : "Unassigned"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{getAge(task.created_at)}</span>
          </div>
        </div>

        {/* Quick actions */}
        {onStatusChange && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-tunet-border">
            {task.status === "assigned" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, "in_progress");
                }}
                className="flex-1 text-xs py-1.5 rounded bg-tunet-green/20 text-tunet-green hover:bg-tunet-green/30 transition-colors"
              >
                Start
              </button>
            )}
            {task.status === "in_progress" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, "review");
                }}
                className="flex-1 text-xs py-1.5 rounded bg-status-review/20 text-status-review hover:bg-status-review/30 transition-colors"
              >
                Submit Review
              </button>
            )}
            {task.status === "review" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, "done");
                }}
                className="flex-1 text-xs py-1.5 rounded bg-status-done/20 text-status-done hover:bg-status-done/30 transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
