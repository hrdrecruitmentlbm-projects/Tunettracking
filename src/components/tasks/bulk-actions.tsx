"use client";

import { TaskStatus, User, STATUS_CONFIG } from "@/types";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  users: User[];
  onStatusChange: (status: TaskStatus) => void;
  onReassign: (userId: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActions({ selectedCount, users, onStatusChange, onReassign, onDelete, onClear }: BulkActionsProps) {
  if (selectedCount === 0) return null;
  // Same assignable set as the task form — FOC and marketing both take work.
  const assignableUsers = users.filter(
    u => (u.role === "foc" || u.role === "marketing") && u.is_active !== false
  );
  return (
    <div className="flex items-center gap-3 rounded-xl border border-tunet-border bg-tunet-surface px-4 py-2.5 text-sm">
      <span className="text-tunet-text font-medium whitespace-nowrap">
        {COPY.bulkActions.selected(selectedCount)}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm">{COPY.bulkActions.changeStatus}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <DropdownMenuItem key={key} onClick={() => onStatusChange(key as TaskStatus)}>
                {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {assignableUsers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm">{COPY.bulkActions.reassign}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-48">
              {assignableUsers.map(user => (
                <DropdownMenuItem key={user.id} onClick={() => onReassign(user.id)}>
                  {user.name}
                  <span className="ml-auto font-mono text-[10px] uppercase text-tunet-text-muted">
                    {user.role}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button variant="destructive" size="sm" onClick={onDelete}>
          {COPY.bulkActions.delete}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="w-3.5 h-3.5 mr-1" />
          {COPY.bulkActions.clearSelection}
        </Button>
      </div>
    </div>
  );
}
