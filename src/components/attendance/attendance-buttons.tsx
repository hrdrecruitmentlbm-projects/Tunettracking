"use client";

import { useState } from "react";
import { Attendance, AttendanceType } from "@/types";
import { cn } from "@/lib/utils";
import { formatTimeWIB } from "@/lib/time";
import { COPY } from "@/lib/copy";
import { ArrowRightToLine, ArrowLeftFromLine, Check, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AttendanceButtonsProps {
  today: Attendance[];
  onRecorded: (record: Attendance) => void;
}

interface ButtonState {
  type: AttendanceType;
  recorded: Attendance | null;
  disabled: boolean;
}

export function AttendanceButtons({ today, onRecorded }: AttendanceButtonsProps) {
  const [submitting, setSubmitting] = useState<AttendanceType | null>(null);

  const berangkat = today.find((t) => t.type === "berangkat") ?? null;
  const pulang = today.find((t) => t.type === "pulang") ?? null;

  const states: ButtonState[] = [
    { type: "berangkat", recorded: berangkat, disabled: !!berangkat },
    { type: "pulang", recorded: pulang, disabled: !!pulang },
  ];

  const handleClick = async (type: AttendanceType) => {
    if (type === "pulang" && !berangkat) {
      toast.error("Absen berangkat dulu sebelum absen pulang");
      return;
    }

    setSubmitting(type);

    let lat: number | null = null;
    let lng: number | null = null;

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 60_000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Permission denied or unavailable — record without location
        if (type === "berangkat") {
          toast.message(COPY.attendance.locationDenied);
        }
      }
    }

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, location_lat: lat, location_lng: lng }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409) {
          toast.error(COPY.attendance.duplicate);
        } else {
          toast.error(body.error || COPY.attendance.failedRecord);
        }
        return;
      }

      const record = (await res.json()) as Attendance;
      onRecorded(record);
      if (lat != null && lng != null) {
        toast.success(COPY.attendance.locationSaved(lat, lng));
      }
      toast.success(
        `${type === "berangkat" ? COPY.attendance.berangkatLabel : COPY.attendance.pulangLabel} ${COPY.attendance.recorded}`
      );
    } catch (err) {
      console.error("Attendance record error:", err);
      toast.error(COPY.attendance.failedRecord);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {states.map((s) => (
        <ButtonCard
          key={s.type}
          state={s}
          loading={submitting === s.type}
          onClick={() => handleClick(s.type)}
        />
      ))}
    </div>
  );
}

function ButtonCard({
  state,
  loading,
  onClick,
}: {
  state: ButtonState;
  loading: boolean;
  onClick: () => void;
}) {
  const isBerangkat = state.type === "berangkat";
  const Icon = isBerangkat ? ArrowRightToLine : ArrowLeftFromLine;
  const label = isBerangkat
    ? COPY.attendance.berangkatLabel
    : COPY.attendance.pulangLabel;
  const time = formatTimeWIB(state.recorded?.timestamp);

  const accent = isBerangkat
    ? "from-tunet-green/15 via-tunet-green/5 to-transparent"
    : "from-tunet-ember/15 via-tunet-ember/5 to-transparent";
  const ring = isBerangkat
    ? "ring-tunet-green/40 hover:ring-tunet-green/70"
    : "ring-tunet-ember/40 hover:ring-tunet-ember/70";
  const iconBg = isBerangkat
    ? "bg-tunet-green/15 text-tunet-green"
    : "bg-tunet-ember/15 text-tunet-ember";
  const textAccent = isBerangkat ? "text-tunet-green" : "text-tunet-ember";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state.disabled || loading}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-tunet-border bg-tunet-surface",
        "p-6 text-left transition-all ring-1 ring-transparent",
        "hover:-translate-y-0.5 hover:shadow-lg",
        ring,
        (state.disabled || loading) && "opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-none"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70",
          accent
        )}
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg",
              iconBg
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {state.disabled ? (
            <div className="flex items-center gap-1.5 text-xs text-tunet-text-muted">
              <Check className="h-3.5 w-3.5 text-tunet-green" />
              {COPY.attendance.recorded}
            </div>
          ) : loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-tunet-text-muted" />
          ) : (
            <span className="text-[11px] uppercase tracking-wider text-tunet-text-muted">
              {COPY.attendance.belumAbsen}
            </span>
          )}
        </div>

        <div>
          <p className={cn("text-sm font-medium", textAccent)}>{label}</p>
          <p className="mt-1 font-mono-data text-3xl font-semibold tabular-nums text-tunet-text">
            {state.recorded ? time : "— —"}
          </p>
          {state.recorded && (
            <p className="mt-1 text-[11px] text-tunet-text-muted">
              {COPY.attendance.recordedAt(time)}
            </p>
          )}
        </div>

        {state.recorded?.location_lat != null &&
          state.recorded?.location_lng != null && (
            <div className="flex items-center gap-1.5 text-[11px] text-tunet-text-muted">
              <MapPin className="h-3 w-3" />
              <span className="font-mono-data tabular-nums">
                {state.recorded.location_lat.toFixed(4)},{" "}
                {state.recorded.location_lng.toFixed(4)}
              </span>
            </div>
          )}
      </div>
    </button>
  );
}
