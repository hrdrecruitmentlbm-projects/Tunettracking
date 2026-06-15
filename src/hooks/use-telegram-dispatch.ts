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
    console.log("[telegram-dispatch] hook fired, userId:", userId);
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const all = await fetchNotifications(userId);
        console.log("[telegram-dispatch] fetched notifications:", all.length, all);
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pending = (all as any[]).filter((n) => !n.telegram_sent_at);
        console.log("[telegram-dispatch] pending (no telegram_sent_at):", pending.length);
        for (const n of pending) {
          console.log("[telegram-dispatch] sending notification:", n.id);
          await dispatch(n.id);
        }
      } catch (err) {
        console.error("[telegram-dispatch] error:", err);
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
