import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  variant?: "card" | "inline"
  className?: string
  iconClassName?: string
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = "card",
  className,
  iconClassName,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div
        data-slot="empty-state"
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 py-6 text-center",
          className
        )}
      >
        <Icon className={cn("w-5 h-5 text-tunet-text-muted", iconClassName)} />
        <p className="text-xs font-medium text-tunet-text-muted">{title}</p>
        {description && (
          <p className="text-[11px] text-tunet-text-muted/70 max-w-xs">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    )
  }

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-tunet-border bg-tunet-surface/40 px-6 py-12 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-tunet-surface flex items-center justify-center">
        <Icon className={cn("w-6 h-6 text-tunet-text-muted", iconClassName)} />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-tunet-text">{title}</h3>
        {description && (
          <p className="text-xs text-tunet-text-muted max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
