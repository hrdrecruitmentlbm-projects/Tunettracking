"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PROSPECT_STATUSES,
  ProspectStatusConfig,
  UNKNOWN_STATUS_COLOR,
} from "@/types";
import { fetchProspectStatuses } from "@/lib/db";

/**
 * Loads the admin-managed Prospek status labels from `prospect_statuses`.
 * Falls back to the built-in 4 statuses while the DB is unavailable
 * (demo mode / migration not yet run).
 */
export function useProspectStatuses() {
  const [statuses, setStatuses] = useState<ProspectStatusConfig[]>(DEFAULT_PROSPECT_STATUSES);

  const reload = useCallback(async () => {
    const data = await fetchProspectStatuses();
    if (data.length > 0) {
      setStatuses(data);
    }
  }, []);

  useEffect(() => {
    // Statuses are loaded from an external system (Supabase); setState
    // happens asynchronously in the callback, never synchronously here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const map = useMemo(() => new Map(statuses.map((s) => [s.key, s])), [statuses]);

  /** Resolve any stored status key to its label/color (neutral fallback for unknown keys) */
  const getConfig = useCallback(
    (key: string): { label: string; color: string } => {
      const cfg = map.get(key);
      return cfg
        ? { label: cfg.label, color: cfg.color }
        : { label: key, color: UNKNOWN_STATUS_COLOR };
    },
    [map]
  );

  return { statuses, reload, getConfig };
}
