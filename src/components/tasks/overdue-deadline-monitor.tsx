"use client";

import { useEffect } from "react";
import type { UserRole } from "@/types";

const THROTTLE_KEY = "tutrack-overdue-check-at";
const THROTTLE_MS = 90 * 1000;
const POLL_INTERVAL_MS = 3 * 60 * 1000;

export function OverdueDeadlineMonitor({ role }: { role: UserRole }) {
  useEffect(() => {
    if (role === "finance") return;

    let cancelled = false;

    const runCheck = async (respectThrottle: boolean) => {
      if (cancelled || typeof window === "undefined") return;
      if (respectThrottle) {
        try {
          const lastRaw = localStorage.getItem(THROTTLE_KEY);
          const lastTs = lastRaw ? Number(lastRaw) : 0;
          if (Number.isFinite(lastTs) && Date.now() - lastTs < THROTTLE_MS) {
            return;
          }
          localStorage.setItem(THROTTLE_KEY, String(Date.now()));
        } catch {
          // ignore storage failure
        }
      }

      try {
        const res = await fetch("/api/tasks/overdue-check", {
          method: "POST",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          ok?: boolean;
          notificationsCreated?: number;
        };
        if (data.ok && (data.notificationsCreated || 0) > 0) {
          window.dispatchEvent(new CustomEvent("tutrack:refresh-notifications"));
        }
      } catch {
        // Silent background check
      }
    };

    const initialTimer = setTimeout(() => {
      void runCheck(true);
    }, 1500);

    const interval = setInterval(() => {
      void runCheck(true);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [role]);

  return null;
}
