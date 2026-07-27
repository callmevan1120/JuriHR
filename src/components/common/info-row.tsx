"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
  className?: string;
  /** Jika true, value dirender sebagai blok multiline. */
  block?: boolean;
}

/** Baris info label-value yang konsisten untuk panel detail. */
export function InfoRow({ label, value, className, block }: InfoRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1 py-2 sm:grid-cols-[180px_1fr] sm:gap-3",
        className,
      )}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm text-foreground",
          !block && "truncate",
        )}
      >
        {value == null || value === "" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
