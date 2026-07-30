"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  accent?: "primary" | "warning" | "destructive" | "info" | "success" | "neutral";
}

const ACCENT_BG: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 dark:bg-primary/15",
  warning: "bg-warning/10 dark:bg-warning/15",
  destructive: "bg-destructive/8 dark:bg-destructive/12",
  info: "bg-info/10 dark:bg-info/15",
  success: "bg-success/10 dark:bg-success/15",
  neutral: "bg-muted/60 dark:bg-muted/40",
};

const ACCENT_DOT: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  success: "bg-success",
  neutral: "bg-muted-foreground/40",
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
  onAction,
  accent = "neutral",
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
        "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 transition-all duration-200",
        ACCENT_BG[accent],
        clickable && "cursor-pointer active:scale-[0.98]",
      )}
    >
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/90", ACCENT_ICON[accent])}>
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">{label}</p>
        <p className="text-xl font-bold tracking-tight text-foreground tabular-nums leading-tight">
          {value}
        </p>
        {hint && <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">{hint}</p>}
      </div>
      <div className={cn("size-1.5 shrink-0 rounded-full", ACCENT_DOT[accent])} />
    </div>
  );
}
