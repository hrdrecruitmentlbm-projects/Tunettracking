"use client";

import { useCallback, useEffect, useState } from "react";

interface UseLocalStorageStateOptions<T> {
  initial: T;
  /** Return true if the parsed value is safe to use; otherwise initial is kept. */
  validate?: (value: unknown) => value is T;
}

/**
 * useState that persists to localStorage. Hydrates once on mount (client
 * only), validates stored values, and writes back on every change. Storage
 * failures (private mode, quota) degrade silently to plain state.
 */
export function useLocalStorageState<T>(
  key: string,
  { initial, validate }: UseLocalStorageStateOptions<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);

  // Hydrate once from storage (client only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return;
      const parsed: unknown = JSON.parse(raw);
      if (!validate || validate(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue(parsed as T);
      } else {
        // Stale/malformed value from an older app version — drop it.
        window.localStorage.removeItem(key);
      }
    } catch {
      // Corrupted JSON — fall back to the initial value.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage unavailable; state still updates for this session.
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set];
}
