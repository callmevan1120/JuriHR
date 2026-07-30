"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  actions,
  className,
}: PageHeaderProps) {
  if (!actions) return null;
  return (
    <div
      className={cn(
        "no-print flex flex-wrap items-center justify-end gap-2 pb-1",
        className,
      )}
    >
      {actions}
    </div>
  );
}
