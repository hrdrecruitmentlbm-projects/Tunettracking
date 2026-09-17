"use client";

import { useState, useEffect } from "react";
import { TaskStatus, TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG, Tag } from "@/types";
import { fetchUsers, fetchTags } from "@/lib/db";
import { User } from "@/types";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { PRESET_LABELS, type ListPreset } from "@/lib/task-list-grouping";
import { cn } from "@/lib/utils";

interface TaskFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  assignee: string | "all";
  tag: string | "all";
  /** Saved view (risk / overdue / unassigned). Composes with the filters above. */
  preset: ListPreset;
}

interface Chip {
  key: keyof FilterState;
  label: string;
  /** Overrides the raw key shown before the value. */
  prefix?: string;
  onRemove: () => void;
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Mirrors the task form's assignable set (FOC + marketing) — filtering by
    // only FOC silently hid marketing-assigned tasks from the list.
    fetchUsers().then((users) =>
      setAssignableUsers(
        users.filter((u) => (u.role === "foc" || u.role === "marketing") && u.is_active !== false)
      )
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
    onFiltersChange({ status: "all", priority: "all", assignee: "all", tag: "all", preset: "all" });
  };

  const chips: Chip[] = [];
  if (filters.preset !== "all") {
    chips.push({
      key: "preset",
      label: PRESET_LABELS[filters.preset],
      prefix: COPY.taskList.presetLabel,
      onRemove: () => removeFilter("preset"),
    });
  }
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
        : assignableUsers.find((u) => u.id === filters.assignee)?.name || "Unknown";
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
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className={cn(
          "min-h-11",
          hasActiveFilters ? "border-tunet-green text-tunet-green" : "text-tunet-text-muted"
        )}
        aria-expanded={showFilters}
      >
        <Filter data-icon="inline-start" aria-hidden="true" />
        {COPY.filters.active}
        {hasActiveFilters && (
          <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-tunet-green font-mono text-xs text-primary-foreground">
            {chips.length}
          </span>
        )}
      </Button>

      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-tunet-border bg-tunet-surface px-3 text-xs text-tunet-text transition-colors hover:border-tunet-green/50 hover:text-tunet-green"
          aria-label={`Hapus filter ${chip.key}: ${chip.label}`}
        >
          <span className="text-tunet-text-muted">{chip.prefix ?? chip.key}:</span>
          <span>{chip.label}</span>
          <X className="ml-0.5 size-3" aria-hidden="true" />
        </button>
      ))}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={resetFilters}
          className="min-h-11 text-tunet-text-muted"
        >
          <X data-icon="inline-start" aria-hidden="true" />
          {COPY.filters.clearAll}
        </Button>
      )}

      {showFilters && (
        <div className="flex w-full flex-col gap-2 rounded-xl border border-tunet-border bg-tunet-surface p-3 sm:flex-row sm:flex-wrap">
          <select
            aria-label="Filter berdasarkan status"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value as TaskStatus | "all")}
            className="min-h-11 flex-1 rounded-lg border border-tunet-border bg-tunet-bg px-3 text-sm text-tunet-text focus:outline-none focus:ring-2 focus:ring-tunet-green/50"
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
            className="min-h-11 flex-1 rounded-lg border border-tunet-border bg-tunet-bg px-3 text-sm text-tunet-text focus:outline-none focus:ring-2 focus:ring-tunet-green/50"
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
            className="min-h-11 flex-1 rounded-lg border border-tunet-border bg-tunet-bg px-3 text-sm text-tunet-text focus:outline-none focus:ring-2 focus:ring-tunet-green/50"
          >
            <option value="all">{COPY.filters.allAssignees}</option>
            <option value="unassigned">{COPY.filters.unassigned}</option>
            {assignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>

          {tags.length > 0 && (
            <select
              aria-label="Filter berdasarkan label"
              value={filters.tag}
              onChange={(e) => updateFilter("tag", e.target.value)}
              className="min-h-11 flex-1 rounded-lg border border-tunet-border bg-tunet-bg px-3 text-sm text-tunet-text focus:outline-none focus:ring-2 focus:ring-tunet-green/50"
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
