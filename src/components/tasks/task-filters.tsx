"use client";

import { useState, useEffect } from "react";
import { TaskStatus, TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG, Tag } from "@/types";
import { fetchUsers, fetchTags } from "@/lib/db";
import { User } from "@/types";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

interface TaskFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  assignee: string | "all";
  tag: string | "all";
}

interface Chip {
  key: keyof FilterState;
  label: string;
  onRemove: () => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const [focUsers, setFocUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers().then((users) =>
      setFocUsers(users.filter((u) => u.role === "foc"))
    );
    fetchTags().then(setTags);
  }, []);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const removeFilter = (key: keyof FilterState) => {
    onFiltersChange({ ...filters, [key]: "all" });
  };

  const resetFilters = () => {
    onFiltersChange({ status: "all", priority: "all", assignee: "all", tag: "all" });
  };

  const chips: Chip[] = [];
  if (filters.status !== "all") {
    chips.push({
      key: "status",
      label: STATUS_CONFIG[filters.status].label,
      onRemove: () => removeFilter("status"),
    });
  }
  if (filters.priority !== "all") {
    chips.push({
      key: "priority",
      label: PRIORITY_CONFIG[filters.priority].label,
      onRemove: () => removeFilter("priority"),
    });
  }
  if (filters.assignee !== "all") {
    const label =
      filters.assignee === "unassigned"
        ? COPY.filters.unassigned
        : focUsers.find((u) => u.id === filters.assignee)?.name || "Unknown";
    chips.push({
      key: "assignee",
      label,
      onRemove: () => removeFilter("assignee"),
    });
  }
  if (filters.tag !== "all") {
    const label = tags.find((t) => t.id === filters.tag)?.name || "Unknown";
    chips.push({
      key: "tag",
      label,
      onRemove: () => removeFilter("tag"),
    });
  }

  const hasActiveFilters = chips.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
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
        {COPY.filters.active}
        {hasActiveFilters && (
          <span className="ml-1.5 w-4 h-4 rounded-full bg-tunet-green text-white text-[10px] flex items-center justify-center">
            {chips.length}
          </span>
        )}
      </Button>

      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-tunet-surface border border-tunet-border text-xs text-tunet-text hover:border-tunet-green/50 hover:text-tunet-green transition-colors"
        >
          <span className="text-tunet-text-muted">{chip.key}:</span>
          <span>{chip.label}</span>
          <X className="w-3 h-3 ml-0.5" />
        </button>
      ))}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-tunet-text-muted text-xs h-7"
        >
          <X className="w-3 h-3 mr-1" />
          {COPY.filters.clearAll}
        </Button>
      )}

      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            aria-label="Filter berdasarkan status"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value as TaskStatus | "all")}
            className="rounded-md border border-tunet-border bg-tunet-surface px-2 py-1 text-xs text-tunet-text focus:outline-none focus:ring-1 focus:ring-tunet-green/50"
          >
            <option value="all">{COPY.filters.allStatus}</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter berdasarkan prioritas"
            value={filters.priority}
            onChange={(e) => updateFilter("priority", e.target.value as TaskPriority | "all")}
            className="rounded-md border border-tunet-border bg-tunet-surface px-2 py-1 text-xs text-tunet-text focus:outline-none focus:ring-1 focus:ring-tunet-green/50"
          >
            <option value="all">{COPY.filters.allPriority}</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter berdasarkan penugasan"
            value={filters.assignee}
            onChange={(e) => updateFilter("assignee", e.target.value)}
            className="rounded-md border border-tunet-border bg-tunet-surface px-2 py-1 text-xs text-tunet-text focus:outline-none focus:ring-1 focus:ring-tunet-green/50"
          >
            <option value="all">{COPY.filters.allAssignees}</option>
            <option value="unassigned">{COPY.filters.unassigned}</option>
            {focUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          {tags.length > 0 && (
            <select
              aria-label="Filter berdasarkan label"
              value={filters.tag}
              onChange={(e) => updateFilter("tag", e.target.value)}
              className="rounded-md border border-tunet-border bg-tunet-surface px-2 py-1 text-xs text-tunet-text focus:outline-none focus:ring-1 focus:ring-tunet-green/50"
            >
              <option value="all">{COPY.filters.allLabels}</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
