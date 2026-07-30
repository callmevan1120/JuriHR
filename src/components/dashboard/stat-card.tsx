"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  accent?: "primary" | "warning" | "destructive" | "info" | "success" | "neutral";
  trend?: { direction: "up" | "down" | "neutral"; value: string };
}

const ACCENT_BG: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/15",
  warning: "bg-warning/10",
  destructive: "bg-destructive/10",
  info: "bg-info/10",
  success: "bg-success/10",
  neutral: "bg-muted/50",
};

const ACCENT_ICON: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "text-primary",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
  success: "text-success",
  neutral: "text-muted-foreground",
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
    <div
      onClick={onAction}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAction?.(); } }
          : undefined
      }
      className={cn(
        "flex items-center gap-3 rounded-2xl p-3.5 transition-all duration-200",
        ACCENT_BG[accent],
        clickable && "cursor-pointer active:scale-[0.97] hover:brightness-95",
      )}
    >
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", ACCENT_ICON[accent], "bg-background/80")}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground leading-tight">{label}</p>
        <p className="text-lg font-bold tracking-tight text-foreground tabular-nums leading-tight">
          {value}
        </p>
        {hint && <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5">{hint}</p>}
        {trend && (
          <p className={cn("text-[10px] font-medium mt-0.5", trend.direction === "up" && "text-success", trend.direction === "down" && "text-destructive")}>
            {trend.value}
          </p>
        )}
      </div>
      {actionLabel && (
        <ArrowUpRight className={cn("size-4 shrink-0 text-muted-foreground/50", !clickable && "hidden")} />
      )}
    </div>
  );
}
