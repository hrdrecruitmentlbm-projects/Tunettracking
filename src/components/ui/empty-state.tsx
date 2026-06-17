import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EmptyGlyphTeam,
  EmptyGlyphTasks,
  EmptyGlyphNotifications,
  EmptyGlyphInbox,
} from "./empty-glyphs";

type GlyphKind = "team" | "tasks" | "notifications" | "inbox" | "generic";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "card" | "inline";
  className?: string;
  iconClassName?: string;
  /** New: contextual glyph. If provided, takes precedence over `icon`. */
  glyph?: GlyphKind;
}

function resolveGlyph(g: GlyphKind | undefined) {
  switch (g) {
    case "team":
      return <EmptyGlyphTeam />;
    case "tasks":
      return <EmptyGlyphTasks />;
    case "notifications":
      return <EmptyGlyphNotifications />;
    case "inbox":
      return <EmptyGlyphInbox />;
    default:
      return <EmptyGlyphInbox />;
  }
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "card",
  className,
  iconClassName,
  glyph,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div
        data-slot="empty-state"
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-8 px-4 text-center",
          "rounded-lg bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.06),transparent_60%)]",
          className
        )}
      >
        <div className="text-tunet-text-muted/70">
          {glyph ? resolveGlyph(glyph) : <Inbox className="w-5 h-5" />}
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="font-display text-sm font-semibold tracking-tight text-tunet-text">
            {title}
          </h3>
          {description && (
            <p className="text-[11px] leading-relaxed text-tunet-text-muted">{description}</p>
          )}
        </div>
        {action && <div className="mt-1">{action}</div>}
      </div>
    );
  }

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-xl",
        "border border-tunet-border bg-tunet-surface/40",
        "bg-[radial-gradient(circle_at_30%_0%,rgba(34,211,238,0.05),transparent_55%)]",
        "px-6 py-14 text-center overflow-hidden",
        className
      )}
    >
      <div className="text-tunet-text-muted/70">
        {glyph ? (
          resolveGlyph(glyph)
        ) : Icon ? (
          <div className="w-12 h-12 rounded-full bg-tunet-surface flex items-center justify-center">
            <Icon className={cn("w-6 h-6 text-tunet-text-muted", iconClassName)} />
          </div>
        ) : null}
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-display text-base font-semibold tracking-tight text-tunet-text">
          {title}
        </h3>
        {description && (
          <p className="text-xs leading-relaxed text-tunet-text-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
