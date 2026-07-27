"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Skeleton placeholder untuk chart card saat data belum siap. */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-48 animate-pulse rounded bg-muted/60" />
      </div>
      <div className="flex h-[220px] items-end gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t bg-muted"
            style={{
              height: `${40 + Math.sin(i * 0.8) * 30 + 20}%`,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton untuk metric stat card. */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2 rounded-xl border border-border bg-card p-4 shadow-soft", className)}>
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="h-8 w-16 animate-pulse rounded bg-muted/70" />
      <div className="h-3 w-32 animate-pulse rounded bg-muted/50" />
    </div>
  );
}
