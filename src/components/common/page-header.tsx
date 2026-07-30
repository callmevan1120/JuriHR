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

export function PageHeader({
  title,
  description,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "no-print flex flex-col gap-2 pb-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between transition-all",
        className,
      )}
    >
      {/* Left side: Compact Title & Subtitle/Badge */}
      <div className="flex items-center gap-2.5 min-w-0">
        {title && (
          <h2 className="text-lg font-bold tracking-tight text-foreground truncate">
            {title}
          </h2>
        )}
        {badge}
        {description && (
          <span className="hidden md:inline-block text-xs text-muted-foreground border-l border-border/60 pl-2.5 truncate">
            {description}
          </span>
        )}
      </div>

      {/* Right side: Action Buttons */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
