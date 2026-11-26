"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlarmClock, BellRing, Clock, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { playAlarmChime, unlockAlarmAudio } from "@/lib/alarm-sound";
import type { AttendanceReminderSettings, AttendanceType } from "@/types";

interface ReminderCheckResponse {
  settings: AttendanceReminderSettings;
  todayStatus: {
    date: string;
    currentWibTime: string;
    currentWibMinutes: number;
    currentWibWeekday: number;
    hasBerangkat: boolean;
    hasPulang: boolean;
  };
}

function getJakartaNowClient(): {
  date: string;
  time: string;
  minutes: number;
  weekday: number;
} {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hourRaw = parseInt(get("hour"), 10);
  const hour = hourRaw === 24 ? 0 : hourRaw;
  const minute = parseInt(get("minute"), 10);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    minutes: hour * 60 + minute,
    weekday: weekdayMap[get("weekday")] ?? now.getDay(),
  };
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function AttendanceAlarmMonitor() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<ReminderCheckResponse | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<AttendanceType | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [wibTime, setWibTime] = useState<string>("");
  const notifiedKeyRef = useRef<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/reminder-settings", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as ReminderCheckResponse;
      setState(json);
    } catch {
      // Ignore transient network errors
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
    const pollId = setInterval(fetchStatus, 60_000);

    const handleRefresh = () => {
      fetchStatus();
    };
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("tutrack-attendance-updated", handleRefresh);
    window.addEventListener("tutrack-reminder-settings-updated", handleRefresh);

    return () => {
      clearInterval(pollId);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("tutrack-attendance-updated", handleRefresh);
      window.removeEventListener(
        "tutrack-reminder-settings-updated",
        handleRefresh
      );
    };
  }, [fetchStatus]);

  const evaluateAlarm = useCallback(() => {
    if (!state?.settings || !state.todayStatus) return;
    const { settings, todayStatus } = state;

    if (!settings.enabled) {
      setActiveAlarm(null);
      return;
    }

    const clock = getJakartaNowClient();
    setWibTime(clock.time);

    if (!settings.active_days.includes(clock.weekday)) {
      setActiveAlarm(null);
      return;
    }

    const berangkatMin =
      parseMinutes(settings.berangkat_time) + settings.grace_minutes;
    const pulangMin =
      parseMinutes(settings.pulang_time) + settings.grace_minutes;

    let due: AttendanceType | null = null;
    if (!todayStatus.hasBerangkat && clock.minutes >= berangkatMin) {
      due = "berangkat";
    } else if (!todayStatus.hasPulang && clock.minutes >= pulangMin) {
      due = "pulang";
    }

    if (!due) {
      setActiveAlarm(null);
      return;
    }

    // Check per-day dismiss or 10-min snooze
    try {
      const dismissKey = `tutrack-alarm-dismiss-${clock.date}-${due}`;
      if (localStorage.getItem(dismissKey) === "1") {
        setActiveAlarm(null);
        return;
      }
      const snoozeKey = `tutrack-alarm-snooze-${clock.date}-${due}`;
      const snoozeUntil = Number(localStorage.getItem(snoozeKey) || "0");
      if (snoozeUntil > Date.now()) {
        setActiveAlarm(null);
        return;
      }
    } catch {
      // ignore storage errors
    }

    setActiveAlarm(due);

    const notifyKey = `${clock.date}-${due}`;
    if (
      notifiedKeyRef.current !== notifyKey &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      notifiedKeyRef.current = notifyKey;
      const targetTime =
        due === "berangkat" ? settings.berangkat_time : settings.pulang_time;
      new Notification(
        due === "berangkat"
          ? "Alarm Absen Berangkat"
          : "Alarm Absen Pulang",
        {
          body: `Anda belum absen ${due} (jadwal ${targetTime} WIB). Buka TuTrack untuk absen sekarang.`,
          tag: notifyKey,
        }
      );
    }
  }, [state]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    evaluateAlarm();
    const tickId = setInterval(evaluateAlarm, 10_000);
    return () => clearInterval(tickId);
  }, [evaluateAlarm]);

  // Unlock Web Audio on first user interaction anywhere in the app
  useEffect(() => {
    const unlock = async () => {
      const ok = await unlockAlarmAudio();
      if (ok) setAudioBlocked(false);
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Ring repeating alarm chime while activeAlarm is open and sound_enabled
  useEffect(() => {
    if (!activeAlarm || !state?.settings.sound_enabled) return;

    let cancelled = false;
    const ring = async () => {
      if (cancelled) return;
      const played = await playAlarmChime();
      if (!cancelled) {
        setAudioBlocked(!played);
      }
    };

    ring();
    const ringId = setInterval(ring, 2800);
    return () => {
      cancelled = true;
      clearInterval(ringId);
    };
  }, [activeAlarm, state?.settings.sound_enabled]);

  if (!activeAlarm || !state) return null;

  const targetTime =
    activeAlarm === "berangkat"
      ? state.settings.berangkat_time
      : state.settings.pulang_time;
  const dateStr = state.todayStatus.date;

  const handleSnooze = () => {
    try {
      localStorage.setItem(
        `tutrack-alarm-snooze-${dateStr}-${activeAlarm}`,
        String(Date.now() + 10 * 60 * 1000)
      );
    } catch {
      // ignore
    }
    setActiveAlarm(null);
  };

  const handleDismissToday = () => {
    try {
      localStorage.setItem(
        `tutrack-alarm-dismiss-${dateStr}-${activeAlarm}`,
        "1"
      );
    } catch {
      // ignore
    }
    setActiveAlarm(null);
  };

  const handleGoAttendance = () => {
    // Snooze briefly for 2 minutes while user completes the check-in form
    try {
      localStorage.setItem(
        `tutrack-alarm-snooze-${dateStr}-${activeAlarm}`,
        String(Date.now() + 2 * 60 * 1000)
      );
    } catch {
      // ignore
    }
    setActiveAlarm(null);
    if (pathname !== "/dashboard/attendance") {
      router.push("/dashboard/attendance");
    }
  };

  const handleEnableSound = async () => {
    const ok = await unlockAlarmAudio();
    if (ok) {
      setAudioBlocked(false);
      await playAlarmChime();
    }
  };

  return (
    <Dialog
      open={Boolean(activeAlarm)}
      onOpenChange={(open) => {
        if (!open) handleSnooze();
      }}
    >
      <DialogContent className="bg-tunet-surface border-tunet-ember/60 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-tunet-ember/20 text-tunet-ember flex items-center justify-center animate-pulse">
              <AlarmClock className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-tunet-text text-lg">
                {activeAlarm === "berangkat"
                  ? "Waktunya Absen Berangkat!"
                  : "Waktunya Absen Pulang!"}
              </DialogTitle>
              <DialogDescription className="text-tunet-text-muted">
                Anda belum mencatat absen {activeAlarm} hari ini.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-tunet-border bg-tunet-bg p-3.5 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-tunet-text-muted flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Jadwal {activeAlarm}
            </span>
            <span className="font-mono-data font-semibold text-tunet-text">
              {targetTime} WIB
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tunet-text-muted flex items-center gap-1.5">
              <BellRing className="w-4 h-4" />
              Waktu saat ini
            </span>
            <span className="font-mono-data font-semibold text-tunet-ember">
              {wibTime || state.todayStatus.currentWibTime} WIB
            </span>
          </div>
        </div>

        {state.settings.sound_enabled && audioBlocked && (
          <Button
            type="button"
            variant="outline"
            onClick={handleEnableSound}
            className="w-full border-tunet-ember/40 text-tunet-ember hover:bg-tunet-ember/10"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Klik untuk Bunyikan Suara Alarm
          </Button>
        )}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            type="button"
            onClick={handleGoAttendance}
            className="w-full bg-tunet-green hover:bg-tunet-green-dark text-white"
          >
            Absen Sekarang
          </Button>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleSnooze}
              className="border-tunet-border text-tunet-text"
            >
              Tunda 10 Menit
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDismissToday}
              className="text-tunet-text-muted hover:text-tunet-text"
            >
              <VolumeX className="w-4 h-4 mr-1.5" />
              Matikan Hari Ini
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
