"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { CURRENT_VERSION } from "@/lib/version";

const LS_KEY = "tutrack-alerted-version";
const POLL_INTERVAL = 60_000;

export function VersionChecker() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/version");
        const { version: serverVersion } = await res.json();
        if (serverVersion === CURRENT_VERSION) return;
        if (localStorage.getItem(LS_KEY) === serverVersion) return;

        localStorage.setItem(LS_KEY, serverVersion);
        toast("Update available! Press Ctrl+Shift+R to load the latest version.", {
          duration: Infinity,
        });
      } catch {
        // silent fail
      }
    };

    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, []);

  return null;
}
