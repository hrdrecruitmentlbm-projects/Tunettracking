import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-tunet-surface-hover/60", className)}
      {...props}
    />
  )
}

function SkeletonText({
  className,
  lines = 1,
}: {
  className?: string
  lines?: number
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: `${85 - i * 12}%` }}
        />
      ))}
    </div>
  )
}

function SkeletonCircle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonCircle }
