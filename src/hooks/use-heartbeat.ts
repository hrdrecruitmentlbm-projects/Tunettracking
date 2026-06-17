"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { fetchActiveCount, recordHeartbeat } from "@/lib/db";

const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const REFRESH_INTERVAL_MS = 30 * 1000;
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

    // Fire immediately on mount
    void send();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (watchCount) void refresh();

    const beatId = setInterval(() => void send(), HEARTBEAT_INTERVAL_MS);
    const refreshId = watchCount
      ? setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
      : null;

    // Also send on tab focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void send();
        if (watchCount) void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stoppedRef.current = true;
      clearInterval(beatId);
      if (refreshId) clearInterval(refreshId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId, watchCount, send, refresh]);

  return { activeCount, thresholdMs: ACTIVE_THRESHOLD_MS };
}
