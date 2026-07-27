"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** Wrapper field dengan label, hint, dan pesan error yang konsisten. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

/** Baris dua kolom untuk form. */
export function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}
