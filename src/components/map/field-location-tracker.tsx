"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { upsertLocation } from "@/lib/db";
import { User } from "@/types";

const DEFAULT_INTERVAL_MINUTES = 2;

function clampMinutes(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_INTERVAL_MINUTES;
  return Math.min(60, Math.max(1, Math.round(num)));
}

interface FieldLocationTrackerProps {
  user: User;
}

/**
 * Silent background GPS tracker for field roles (FOC & Marketing).
 * Runs automatically while the app is open on screen, using the interval
 * configured in Pengaturan, and stops cleanly when the browser is closed
 * or phone screen is turned off — resuming automatically when reopened.
 * Never displays persistent reminder banners across pages.
 */
export function FieldLocationTracker({ user }: FieldLocationTrackerProps) {
  const isFieldRole = user.role === "foc" || user.role === "marketing";
  const [intervalMinutes, setIntervalMinutes] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_INTERVAL_MINUTES;
    return clampMinutes(
      localStorage.getItem("tutrack-location-interval-minutes")
    );
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingActiveRef = useRef<boolean>(false);
  const lastSentAtRef = useRef<number>(0);
  const inFlightRef = useRef<boolean>(false);

  const intervalMs = intervalMinutes * 60 * 1000;

  const sendPing = useCallback(
    async (force: boolean = false): Promise<boolean> => {
      if (!isFieldRole || typeof window === "undefined") return false;
      if (!("geolocation" in navigator)) return false;
      if (inFlightRef.current) return false;

      const minGap = Math.min(45_000, Math.floor(intervalMs * 0.7));
      if (!force && Date.now() - lastSentAtRef.current < minGap) {
        return true;
      }

      inFlightRef.current = true;
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const now = new Date();
            lastSentAtRef.current = now.getTime();
            try {
              await upsertLocation(
                user.id,
                latitude,
                longitude,
                accuracy,
                "web_app"
              );
              localStorage.setItem("tutrack-location-enabled", "true");
              localStorage.setItem("tutrack-gps-prompt-seen", "true");
              sessionStorage.removeItem("tutrack-location-paused");
              window.dispatchEvent(
                new CustomEvent("tutrack-location-updated", {
                  detail: {
                    lat: latitude,
                    lng: longitude,
                    updatedAt: now.toISOString(),
                    enabled: true,
                  },
                })
              );
              resolve(true);
            } catch {
              resolve(false);
            } finally {
              inFlightRef.current = false;
            }
          },
          (error) => {
            inFlightRef.current = false;
            if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
              localStorage.setItem("tutrack-location-enabled", "false");
            }
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
        );
      });
    },
    [intervalMs, isFieldRole, user.id]
  );

  const stopTrackingLoop = useCallback(() => {
    trackingActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTrackingLoop = useCallback(
    (sendImmediately: boolean) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      trackingActiveRef.current = true;
      if (sendImmediately && document.visibilityState === "visible") {
        void sendPing(true);
      }
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          void sendPing(false);
        }
      }, intervalMs);
    },
    [intervalMs, sendPing]
  );

  useEffect(() => {
    if (!isFieldRole) return;
    let cancelled = false;

    async function loadSettings() {
      try {
        const res = await fetch("/api/location/settings", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          settings?: { interval_minutes?: number };
        };
        const mins = json.settings?.interval_minutes;
        if (typeof mins === "number" && mins >= 1 && mins <= 60) {
          localStorage.setItem(
            "tutrack-location-interval-minutes",
            String(mins)
          );
          setIntervalMinutes(mins);
        }
      } catch {
        // Keep cached or default interval
      }
    }

    void loadSettings();

    const onSettingsUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ interval_minutes?: number }>;
      if (typeof custom.detail?.interval_minutes === "number") {
        const mins = clampMinutes(custom.detail.interval_minutes);
        localStorage.setItem(
          "tutrack-location-interval-minutes",
          String(mins)
        );
        setIntervalMinutes(mins);
      }
    };

    window.addEventListener(
      "tutrack-location-settings-updated",
      onSettingsUpdated
    );
    return () => {
      cancelled = true;
      window.removeEventListener(
        "tutrack-location-settings-updated",
        onSettingsUpdated
      );
    };
  }, [isFieldRole]);

  useEffect(() => {
    if (!isFieldRole) return;
    let cancelled = false;

    async function init() {
      if (!("geolocation" in navigator)) return;

      const isPaused =
        sessionStorage.getItem("tutrack-location-paused") === "true";
      if (isPaused) {
        stopTrackingLoop();
        return;
      }

      let permState: PermissionState | null = null;
      if ("permissions" in navigator && navigator.permissions?.query) {
        try {
          const perm = await navigator.permissions.query({
            name: "geolocation",
          });
          permState = perm.state;
          perm.onchange = () => {
            if (cancelled) return;
            if (perm.state === "granted") {
              if (sessionStorage.getItem("tutrack-location-paused") !== "true") {
                startTrackingLoop(true);
              }
            } else {
              stopTrackingLoop();
            }
          };
        } catch {
          // Permissions API unavailable
        }
      }

      if (cancelled) return;

      const wasEnabled =
        localStorage.getItem("tutrack-location-enabled") === "true";

      if (permState === "granted" || (permState === null && wasEnabled)) {
        startTrackingLoop(true);
      }
    }

    void init();

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        sessionStorage.getItem("tutrack-location-paused") !== "true" &&
        (trackingActiveRef.current ||
          localStorage.getItem("tutrack-location-enabled") === "true")
      ) {
        void sendPing(false);
      }
    };

    const onControlEvent = (event: Event) => {
      const custom = event as CustomEvent<{
        action?: "start" | "stop" | "ping";
      }>;
      const action = custom.detail?.action;
      if (action === "stop") {
        sessionStorage.setItem("tutrack-location-paused", "true");
        localStorage.setItem("tutrack-location-enabled", "false");
        stopTrackingLoop();
        window.dispatchEvent(
          new CustomEvent("tutrack-location-updated", {
            detail: { enabled: false },
          })
        );
      } else if (action === "start") {
        sessionStorage.removeItem("tutrack-location-paused");
        startTrackingLoop(true);
      } else if (action === "ping") {
        void sendPing(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("tutrack-location-control", onControlEvent);

    return () => {
      cancelled = true;
      stopTrackingLoop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("tutrack-location-control", onControlEvent);
    };
  }, [isFieldRole, sendPing, startTrackingLoop, stopTrackingLoop]);

  return null;
}
