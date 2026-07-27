"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Peta status -> kelas warna (menggunakan token tema JURI HR).
const STATUS_STYLES: Record<string, string> = {
  // Karyawan
  AKTIF: "bg-success/15 text-success border-success/30",
  NONAKTIF: "bg-muted text-muted-foreground border-border",
  RESIGN: "bg-destructive/10 text-destructive border-destructive/30",

  // Kontrak
  DRAFT: "bg-muted text-muted-foreground border-border",
  AKTIF_KONTRAK: "bg-success/15 text-success border-success/30",
  AKAN_BERAKHIR: "bg-warning/15 text-warning border-warning/30",
  BERAKHIR: "bg-destructive/10 text-destructive border-destructive/30",
  DIPERPANJANG: "bg-primary/15 text-primary-foreground border-primary/30 bg-primary/20",
  DITOLAK: "bg-destructive/10 text-destructive border-destructive/30",
  DIBATALKAN: "bg-muted text-muted-foreground border-border",

  // Approval umum
  PENDING: "bg-warning/15 text-warning border-warning/30",
  APPROVED: "bg-success/15 text-success border-success/30",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/30",
  CANCELLED: "bg-muted text-muted-foreground border-border",

  // Verifikasi lembur
  BELUM_DIISI: "bg-muted text-muted-foreground border-border",
  DIISI: "bg-info/15 text-info border-info/30",
  TERVERIFIKASI: "bg-success/15 text-success border-success/30",
  DITOLAK_VERIFIKASI: "bg-destructive/10 text-destructive border-destructive/30",

  // Payroll
  DRAFT_PAYROLL: "bg-muted text-muted-foreground border-border",
  REVIEWED: "bg-info/15 text-info border-info/30",
  FINALIZED: "bg-success/15 text-success border-success/30",

  // Record status
  active: "bg-success/15 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",

  // Absensi
  HADIR: "bg-success/15 text-success border-success/30",
  TERLAMBAT: "bg-warning/15 text-warning border-warning/30",
  TIDAK_HADIR: "bg-destructive/10 text-destructive border-destructive/30",
  CUTI: "bg-info/15 text-info border-info/30",
  IZIN: "bg-info/15 text-info border-info/30",
  SAKIT: "bg-info/15 text-info border-info/30",
  LIBUR: "bg-muted text-muted-foreground border-border",
  PH: "bg-primary/20 text-primary-foreground border-primary/30",
};

function statusKey(status: string): string {
  // Normalisasi: beberapa status punya nama sama di domain berbeda.
  // Kita gunakan nilai mentah; khusus kontrak "AKTIF" & payroll "DRAFT"
  // sudah unik karena status kontrak "AKTIF" -> tampilkan hijau.
  return status;
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const style = STATUS_STYLES[statusKey(status)];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        style ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {label ?? status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}

/** Label ramah untuk status (Title Case). */
export function statusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
