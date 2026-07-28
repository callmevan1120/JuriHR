"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  /** Label tombol aksi & target route. */
  actionLabel?: string;
  onAction?: () => void;
  /** Warna aksen ikon. */
  accent?: "primary" | "warning" | "destructive" | "info" | "success" | "neutral";
  trend?: { direction: TrendDirection; value: string };
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/20 text-primary-foreground",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  neutral: "bg-muted text-muted-foreground",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  actionLabel,
  onAction,
  accent = "neutral",
  trend,
}: StatCardProps) {
  const clickable = Boolean(onAction);
  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden border-border bg-card p-4 shadow-soft transition-all h-full flex flex-col justify-between",
        clickable &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft-md",
      )}
      onClick={onAction}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAction?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="text-[11px] text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            ACCENT_STYLES[accent],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium",
              trend.direction === "up" && "text-success",
              trend.direction === "down" && "text-destructive",
              trend.direction === "neutral" && "text-muted-foreground",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="size-3" />
            ) : trend.direction === "down" ? (
              <ArrowDownRight className="size-3" />
            ) : null}
            {trend.value}
          </span>
        ) : (
          <span />
        )}
        {actionLabel ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100",
            )}
          >
            {actionLabel}
            <ArrowUpRight className="size-3" />
          </span>
        ) : null}
      </div>
    </Card>
  );
}
