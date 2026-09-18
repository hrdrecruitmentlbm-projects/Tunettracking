"use client";

import { Button } from "@/components/ui/button";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { COPY } from "@/lib/copy";
import {
  GROUP_MODES,
  GROUP_MODE_LABELS,
  LIST_PRESETS,
  PRESET_LABELS,
  SORT_MODES,
  SORT_MODE_LABELS,
  isSortMode,
  type GroupMode,
  type ListPreset,
  type SortMode,
} from "@/lib/task-list-grouping";
import { cn } from "@/lib/utils";

/**
 * Admin-only controls for the triage list: saved views on the left, and the
 * two orthogonal list-shaping controls (grouping, sort order) on the right.
 * Grouping and filtering deliberately stay separate dimensions here, so
 * "belum ditugaskan" and "beban tim" can be combined.
 */
interface AdminListToolbarProps {
  preset: ListPreset;
  onPresetChange: (preset: ListPreset) => void;
  groupMode: GroupMode;
  onGroupModeChange: (mode: GroupMode) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  /** Shown only while grouping is active — collapses/expands every section. */
  collapseAllVisible?: boolean;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
}

export function AdminListToolbar({
  preset,
  onPresetChange,
  groupMode,
  onGroupModeChange,
  sortMode,
  onSortModeChange,
  collapseAllVisible = false,
  allCollapsed = false,
  onToggleCollapseAll,
}: AdminListToolbarProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label={COPY.taskList.presetLabel}
      >
        {LIST_PRESETS.map((key) => {
          const active = preset === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPresetChange(key)}
              aria-pressed={active}
              className={cn(
                "min-h-11 rounded-full border px-3.5 text-xs font-medium transition-colors motion-reduce:transition-none",
                active
                  ? "border-tunet-signal/50 bg-tunet-signal/12 text-tunet-signal"
                  : "border-tunet-border bg-tunet-surface text-tunet-text-muted hover:border-tunet-signal/30 hover:text-tunet-text"
              )}
            >
              {PRESET_LABELS[key]}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div
          className="flex overflow-hidden rounded-lg border border-tunet-border"
          role="group"
          aria-label={COPY.taskList.groupLabel}
        >
          {GROUP_MODES.map((mode) => (
            <Button
              key={mode}
              variant={groupMode === mode ? "secondary" : "ghost"}
              onClick={() => onGroupModeChange(mode)}
              className="min-h-11 rounded-none px-3"
              aria-pressed={groupMode === mode}
            >
              {GROUP_MODE_LABELS[mode]}
            </Button>
          ))}
        </div>

        <select
          aria-label={COPY.taskList.sortLabel}
          value={sortMode}
          onChange={(event) => {
            if (isSortMode(event.target.value)) onSortModeChange(event.target.value);
          }}
          className="min-h-11 rounded-lg border border-tunet-border bg-tunet-bg px-3 text-sm text-tunet-text focus:outline-none focus:ring-2 focus:ring-tunet-signal/40"
        >
          {SORT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {SORT_MODE_LABELS[mode]}
            </option>
          ))}
        </select>

        {collapseAllVisible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapseAll}
            className="size-11"
            aria-label={allCollapsed ? COPY.taskList.expandAll : COPY.taskList.collapseAll}
            title={allCollapsed ? COPY.taskList.expandAll : COPY.taskList.collapseAll}
          >
            {allCollapsed ? (
              <ChevronsUpDown aria-hidden="true" />
            ) : (
              <ChevronsDownUp aria-hidden="true" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
