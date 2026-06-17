"use client";

import { useEffect, useState } from "react";
import { Activity, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminHeroProps {
  totalUsers: number;
  activeUsers: number;
  overdueCount: number;
  className?: string;
}

function useJakartaClock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(fmt());
    const id = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function AdminHero({ totalUsers, activeUsers, overdueCount, className }: AdminHeroProps) {
  const time = useJakartaClock();
  const status: "live" | "degraded" = overdueCount > 5 ? "degraded" : "live";

  return (
    <div
      className={cn(
        "relative h-16 border-b border-tunet-border px-6 flex items-center justify-between",
        "bg-gradient-to-r from-tunet-surface via-tunet-surface to-tunet-bg",
        className
      )}
    >
      {/* subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          color: "rgb(34, 211, 238)",
        }}
      />

      <div className="relative flex items-center gap-6 min-w-0">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-tunet-text">
            Network Operations
          </h1>
          <p className="text-[11px] text-tunet-text-muted">
            Tunet division · real-time task and field tracking
          </p>
        </div>
      </div>

      <div className="relative flex items-center gap-6">
        {/* Live status pill */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
            status === "live"
              ? "bg-tunet-signal/10 text-tunet-signal"
              : "bg-status-overdue/10 text-status-overdue"
          )}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
                status === "live" ? "bg-tunet-signal" : "bg-status-overdue"
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                status === "live" ? "bg-tunet-signal" : "bg-status-overdue"
              )}
            />
          </span>
          <span className="font-mono uppercase tracking-wider">
            {status === "live" ? "All systems live" : "Attention required"}
          </span>
        </div>

        {/* Active users */}
        <div className="flex items-center gap-2 text-xs text-tunet-text-muted">
          <Activity className="w-3.5 h-3.5 text-tunet-signal" />
          <span>
            <span className="font-mono tabular-nums text-tunet-text">{activeUsers}</span>
            <span className="text-tunet-text-muted"> / {totalUsers} online</span>
          </span>
        </div>

        {/* Jakarta clock */}
        <div className="flex items-baseline gap-2">
          <Radio className="w-3.5 h-3.5 text-tunet-text-muted" />
          <span className="font-mono tabular-nums text-base text-tunet-text">{time}</span>
          <span className="text-[10px] uppercase tracking-wider text-tunet-text-muted">WIB</span>
        </div>
      </div>
    </div>
  );
}
