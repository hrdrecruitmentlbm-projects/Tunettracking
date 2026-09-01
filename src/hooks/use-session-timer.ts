"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_DURATION_MS = 45 * 60 * 1000; // 45 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // warn 2 minutes before expiry

export type SessionPhase = "active" | "warning" | "expired";

function getLoginAt(): number | null {
  if (typeof window === "undefined") return null;
  const loginAtStr = localStorage.getItem("tutrack-login-at");
  if (!loginAtStr) return null;
  const loginAt = Number(loginAtStr);
  return Number.isNaN(loginAt) ? null : loginAt;
}

function getInitialPhase(): SessionPhase {
  const loginAt = getLoginAt();
  if (loginAt === null) return "expired";
  return Date.now() - loginAt >= SESSION_DURATION_MS ? "expired" : "active";
}

/**
 * Session lifecycle state machine: "active" → "warning" (T-2 minutes) →
 * "expired". The user can extend the session from the warning dialog
 * without losing page state; expiry keeps them in place with an explicit
 * re-login action instead of a blind redirect.
 */
export function useSessionTimer() {
  const [phase, setPhase] = useState<SessionPhase>(getInitialPhase);
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    const loginAt = getLoginAt();
    return loginAt === null ? null : loginAt + SESSION_DURATION_MS;
  });
  const [now, setNow] = useState<number>(() => Date.now());

  /** Reset the 45-minute window from right now (no reload). */
  const extendSession = useCallback(() => {
    const loginAt = Date.now();
    try {
      localStorage.setItem("tutrack-login-at", String(loginAt));
    } catch {
      // Storage unavailable — session still extends for this tab.
    }
    setExpiresAt(loginAt + SESSION_DURATION_MS);
    setNow(loginAt);
    setPhase("active");
  }, []);

  /** Clear storage and move to the expired screen. */
  const expireSession = useCallback(() => {
    try {
      localStorage.removeItem("tutrack-user");
      localStorage.removeItem("tutrack-login-at");
    } catch {
      // ignore
    }
    setPhase("expired");
  }, []);

  // Schedule the warning + expiry transitions.
  useEffect(() => {
    if (phase === "expired" || expiresAt === null) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("expired");
      return;
    }
    const warningTimer = window.setTimeout(
      () => setPhase("warning"),
      Math.max(0, remaining - WARNING_BEFORE_MS)
    );
    const expiryTimer = window.setTimeout(expireSession, remaining);
    return () => {
      window.clearTimeout(warningTimer);
      window.clearTimeout(expiryTimer);
    };
  }, [phase, expiresAt, expireSession]);

  // Tick once per second while warning so the countdown stays live.
  useEffect(() => {
    if (phase !== "warning") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const timeLeft =
    phase === "warning" && expiresAt !== null
      ? Math.max(0, expiresAt - now)
      : null;

  return { phase, isExpired: phase === "expired", timeLeft, extendSession, expireSession };
}

