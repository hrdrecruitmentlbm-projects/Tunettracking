"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { fetchActiveCount, recordHeartbeat } from "@/lib/db";

const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const ACTIVE_THRESHOLD_MS = 60 * 1000;

interface UseHeartbeatOptions {
  userId: string | undefined;
  /** When true, also polls fetchActiveCount and returns it. */
  watchCount?: boolean;
}

export interface UseHeartbeatResult {
  activeCount: number;
  thresholdMs: number;
}

export function useHeartbeat(options: UseHeartbeatOptions): UseHeartbeatResult {
  const { userId, watchCount = false } = options;
  const [activeCount, setActiveCount] = useState(0);
  const stoppedRef = useRef(false);

  const send = useCallback(async () => {
    if (!userId || stoppedRef.current) return;
    try {
      await recordHeartbeat(userId);
    } catch (err) {
      console.error("[useHeartbeat] send failed:", err);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (stoppedRef.current) return;
    try {
      const count = await fetchActiveCount();
      if (!stoppedRef.current) setActiveCount(count);
    } catch (err) {
      console.error("[useHeartbeat] refresh failed:", err);
    }
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    if (!userId) return;

    // Single chained tick: write first, then read. Avoids the race where
    // refresh() reads the count before send()'s upsert has committed.
    const tick = () => {
      if (stoppedRef.current) return;
      void send().then(() => {
        if (stoppedRef.current) return;
        if (watchCount) void refresh();
      });
    };

    // Fire immediately on mount
    tick();

    const beatId = setInterval(tick, HEARTBEAT_INTERVAL_MS);

    // Also send on tab focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stoppedRef.current = true;
      clearInterval(beatId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId, watchCount, send, refresh]);

  return { activeCount, thresholdMs: ACTIVE_THRESHOLD_MS };
}
