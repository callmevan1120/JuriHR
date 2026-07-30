"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

/** ERPNext-style Action Bar: Renders action buttons directly above content without redundant header title text */
export function PageHeader({
  actions,
  className,
}: PageHeaderProps) {
  if (!actions) return null;
  return (
    <div
      className={cn(
        "no-print flex flex-wrap items-center justify-end gap-2 pb-2 transition-all",
        className,
      )}
    >
      {actions}
    </div>
  );
}
