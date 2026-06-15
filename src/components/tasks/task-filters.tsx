"use client";

import { useState, useEffect } from "react";
import { TaskStatus, TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
import { fetchUsers } from "@/lib/db";
import { User } from "@/types";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  assignee: string | "all";
}

export function TaskFilters({ onFiltersChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    priority: "all",
    assignee: "all",
  });
  const [focUsers, setFocUsers] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers().then((users) =>
      setFocUsers(users.filter((u) => u.role === "foc"))
    );
  }, []);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const empty: FilterState = { status: "all", priority: "all", assignee: "all" };
    setFilters(empty);
    onFiltersChange(empty);
  };

  const hasActiveFilters =
    filters.status !== "all" || filters.priority !== "all" || filters.assignee !== "all";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className={`border-tunet-border text-xs ${
          hasActiveFilters
            ? "border-tunet-green text-tunet-green"
            : "text-tunet-text-muted"
        }`}
      >
        <Filter className="w-3.5 h-3.5 mr-1.5" />
        Filters
        {hasActiveFilters && (
          <span className="ml-1.5 w-4 h-4 rounded-full bg-tunet-green text-white text-[10px] flex items-center justify-center">
            {[filters.status, filters.priority, filters.assignee].filter((f) => f !== "all").length}
          </span>
        )}
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-tunet-text-muted text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}

      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value as TaskStatus | "all")}
            className="rounded-md border border-tunet-border bg-tunet-surface px-2 py-1 text-xs text-tunet-text focus:outline-none focus:ring-1 focus:ring-tunet-green/50"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filters.priority}
            onChange={(e) => updateFilter("priority", e.target.value as TaskPriority | "all")}
            className="rounded-md border border-tunet-border bg-tunet-surface px-2 py-1 text-xs text-tunet-text focus:outline-none focus:ring-1 focus:ring-tunet-green/50"
          >
            <option value="all">All Priority</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Assignee filter */}
          <select
            value={filters.assignee}
            onChange={(e) => updateFilter("assignee", e.target.value)}
            className="rounded-md border border-tunet-border bg-tunet-surface px-2 py-1 text-xs text-tunet-text focus:outline-none focus:ring-1 focus:ring-tunet-green/50"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {focUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
