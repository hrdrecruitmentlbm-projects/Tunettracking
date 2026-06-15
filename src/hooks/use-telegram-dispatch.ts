"use client";

import { useEffect } from "react";
import {
  fetchNotifications,
  subscribeToNotifications,
} from "@/lib/db";

async function dispatch(notificationId: string) {
  try {
    const res = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: notificationId }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram dispatch failed:", res.status, body);
    }
  } catch (e) {
    console.error("Telegram dispatch error:", e);
  }
}

export function useTelegramDispatch(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const all = await fetchNotifications(userId);
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pending = (all as any[]).filter((n) => {
          if (n.telegram_sent_at) return false;
          // Skip stale notifications older than 5 minutes on initial load
          const age = Date.now() - new Date(n.created_at).getTime();
          return age < 5 * 60 * 1000;
        });
        for (const n of pending) {
          await dispatch(n.id);
        }
      } catch (err) {
        console.error("[telegram-dispatch]", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToNotifications(userId, (n) => {
      if (n.telegram_sent_at) return;
      dispatch(n.id);
    });
    return unsubscribe;
  }, [userId]);
}
