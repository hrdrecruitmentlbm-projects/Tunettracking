"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, Signal } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

interface AdminHeroProps {
  totalUsers: number;
  activeUsers: number;
  overdueCount: number;
  className?: string;
}

function formatJakartaTime() {
  return new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function useJakartaClock() {
  const [now, setNow] = useState(formatJakartaTime);

  useEffect(() => {
    const id = setInterval(() => setNow(formatJakartaTime()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

export function AdminHero({ overdueCount, className }: AdminHeroProps) {
  const time = useJakartaClock();
  const root = useRef<HTMLElement>(null);
  const stable = overdueCount <= 5;

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-reveal]", {
          autoAlpha: 0,
          y: 18,
          duration: 0.65,
          stagger: 0.08,
          ease: "power3.out",
        });
      });
      return () => media.revert();
    },
    { scope: root }
  );

  return (
    <header
      ref={root}
      className={cn(
        "relative isolate flex min-h-40 flex-col justify-between gap-8 overflow-hidden border-b border-tunet-border px-4 py-6 md:flex-row md:items-end md:px-8 lg:min-h-48",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_20%,color-mix(in_srgb,var(--color-tunet-signal)_14%,transparent),transparent_34%),linear-gradient(115deg,color-mix(in_srgb,var(--color-tunet-surface)_96%,transparent),var(--color-tunet-bg))]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative max-w-5xl">
        <p
          data-hero-reveal
          className="mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-tunet-signal"
        >
          <Signal className="size-4" aria-hidden="true" />
          TuTrack command
        </p>
        <h1
          data-hero-reveal
          className="max-w-5xl text-balance font-display text-3xl font-semibold leading-[0.98] tracking-[-0.045em] text-tunet-text md:text-5xl"
        >
          Operasi jaringan, dalam satu pandangan.
        </h1>
        <p
          data-hero-reveal
          className="mt-4 max-w-2xl text-sm leading-6 text-tunet-text-muted md:text-base"
        >
          Prioritaskan gangguan, pantau tim lapangan, dan selesaikan pekerjaan yang paling mendesak.
        </p>
      </div>

      <div data-hero-reveal className="relative flex items-center gap-4 md:flex-col md:items-end">
        <div
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs font-medium",
            stable
              ? "border-tunet-signal/25 bg-tunet-signal/10 text-tunet-signal"
              : "border-status-overdue/25 bg-status-overdue/10 text-status-overdue"
          )}
        >
          <span className="relative flex size-2">
            <span
              className={cn(
                "absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping",
                stable ? "bg-tunet-signal" : "bg-status-overdue"
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                stable ? "bg-tunet-signal" : "bg-status-overdue"
              )}
            />
          </span>
          <span>{stable ? "Sistem stabil" : "Perlu perhatian"}</span>
        </div>

        <div className="flex items-baseline gap-2">
          <Radio className="size-3.5 text-tunet-text-muted" aria-hidden="true" />
          <span className="font-mono text-base tabular-nums text-tunet-text">{time}</span>
          <span className="text-xs tracking-wider text-tunet-text-muted">WIB</span>
        </div>
      </div>
    </header>
  );
}
