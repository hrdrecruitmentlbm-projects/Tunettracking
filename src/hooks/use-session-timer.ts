"use client";

import { useState, useEffect } from "react";

const SESSION_DURATION_MS = 45 * 60 * 1000; // 45 minutes

function getInitialExpired(): boolean {
  const loginAtStr = localStorage.getItem("tutrack-login-at");
  if (!loginAtStr) return true;
  const loginAt = Number(loginAtStr);
  if (Number.isNaN(loginAt)) return true;
  return Date.now() - loginAt >= SESSION_DURATION_MS;
}

function getRemainingTime(): number | null {
  const loginAtStr = localStorage.getItem("tutrack-login-at");
  if (!loginAtStr) return null;
  const loginAt = Number(loginAtStr);
  if (Number.isNaN(loginAt)) return null;
  const remaining = SESSION_DURATION_MS - (Date.now() - loginAt);
  return remaining > 0 ? remaining : null;
}

export function useSessionTimer() {
  const [isExpired, setIsExpired] = useState<boolean>(getInitialExpired);
  const [timeLeft, setTimeLeft] = useState<number | null>(getRemainingTime);

  useEffect(() => {
    if (isExpired) return;

    const timer = setTimeout(() => {
      localStorage.removeItem("tutrack-user");
      localStorage.removeItem("tutrack-login-at");
      setIsExpired(true);
    }, timeLeft ?? 0);

    return () => clearTimeout(timer);
  }, [isExpired, timeLeft]);

  return { isExpired, timeLeft };
}
