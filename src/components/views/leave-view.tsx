"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FormRow } from "@/components/common/field";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/states";
import { useStore } from "@/hooks/use-store";
import { useRoute } from "@/lib/router/use-route";
import { leaveService } from "@/lib/services/workforce";
import { lookupService } from "@/lib/services/master-data";
import {
  formatDateMed,
  formatDateLong,
  todayISODate,
  cn,
  initials,
} from "@/lib/utils";
import type { Leave, LeaveStatus, LeaveType } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Palmtree,
  Stethoscope,
  FileText,
  AlertTriangle,
  Calendar,
  Download,
} from "lucide-react";

const TYPE_META: Record<LeaveType, { label: string; icon: typeof Palmtree; color: string }> = {
  CUTI: { label: "Cuti", icon: Palmtree, color: "text-success" },
  IZIN: { label: "Izin", icon: FileText, color: "text-info" },
  SAKIT: { label: "Sakit", icon: Stethoscope, color: "text-warning" },
};

const STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export function LeaveView() {
  const route = useRoute();
  const initialFilter = route.query.get("filter") ?? "all";
  const [filter, setFilter] = React.useState<string>(initialFilter);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [reviewTarget, setReviewTarget] = React.useState<Leave | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<Leave | null>(null);

  const leaves = useStore((s) => s.leaves);
  const employees = useStore((s) => s.employees);

  const filtered = leaves
    .filter((l) => filter === "all" || l.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts = {
    all: leaves.length,
    PENDING: leaves.filter((l) => l.status === "PENDING").length,
    APPROVED: leaves.filter((l) => l.status === "APPROVED").length,
    REJECTED: leaves.filter((l) => l.status === "REJECTED").length,
    CANCELLED: leaves.filter((l) => l.status === "CANCELLED").length,
  };

  const handleExport = () => {
    const headers = ["No", "Karyawan", "NIK", "Tipe", "Mulai", "Selesai", "Hari", "Alasan", "Status", "Pengaju"];
    const rows = filtered.map((l) => {
      const emp = employees.find((e) => e.id === l.employeeId);
      return [
        l.id, emp?.fullName ?? "", emp?.nik ?? "", l.type, l.startDate, l.endDate,
        leaveService.leaveDays(l.startDate, l.endDate), l.reason, l.status,
        lookupService.employeeName(l.originalSubmitterId),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cuti-${todayISODate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data cuti diekspor");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cuti / Izin / Sakit"
        description="Pengajuan cuti, izin, dan sakit dengan pengurangan saldo otomatis & anti-tabrakan."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="size-4" /> Export</Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Buat Pengajuan</Button>
          </>
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Semua", count: counts.all },
          { key: "PENDING", label: "Pending", count: counts.PENDING },
          { key: "APPROVED", label: "Disetujui", count: counts.APPROVED },
          { key: "REJECTED", label: "Ditolak", count: counts.REJECTED },
          { key: "CANCELLED", label: "Dibatalkan", count: counts.CANCELLED },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
              filter === t.key ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Aturan info */}
      <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-xs text-info">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">Aturan:</p>
          <p>• Saldo cuti berkurang otomatis saat pengajuan CUTI disetujui.</p>
          <p>• Saldo kembali jika approval cuti dibatalkan.</p>
          <p>• Pengajuan approved tidak boleh bertabrakan dengan pengajuan lain.</p>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <EmptyState title="Tidak ada pengajuan" description="Belum ada pengajuan pada filter ini." />
        ) : (
          filtered.map((leave) => (
            <LeaveCard key={leave.id} leave={leave} onReview={() => setReviewTarget(leave)} onCancel={() => setCancelTarget(leave)} />
          ))
        )}
      </div>

      {createOpen ? <CreateLeaveDialog onClose={() => setCreateOpen(false)} /> : null}
      {reviewTarget ? <ReviewLeaveDialog leave={reviewTarget} onClose={() => setReviewTarget(null)} /> : null}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Batalkan pengajuan cuti yang sudah disetujui?"
        description={`Saldo cuti akan dikembalikan. Pastikan sudah koordinasi dengan karyawan.`}
        destructive
        confirmLabel="Batalkan & Kembalikan Saldo"
        onConfirm={() => {
          if (cancelTarget) {
            leaveService.cancelApproved(cancelTarget.id, "Dibatalkan oleh HRD");
            toast.success("Pengajuan dibatalkan, saldo cuti dikembalikan");
          }
        }}
      />
    </div>
  );
}

function LeaveCard({ leave, onReview, onCancel }: { leave: Leave; onReview: () => void; onCancel: () => void }) {
  const employees = useStore((s) => s.employees);
  const emp = employees.find((e) => e.id === leave.employeeId);
  const meta = TYPE_META[leave.type];
  const Icon = meta.icon;
  const days = leaveService.leaveDays(leave.startDate, leave.endDate);
  const conflict = leave.status === "PENDING" ? leaveService.checkConflict(leave.employeeId, leave.startDate, leave.endDate, leave.id) : undefined;

  return (
    <Card className="group border-border transition-all hover:border-primary/40">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn("flex size-10 items-center justify-center rounded-xl bg-muted", meta.color)}>
              <Icon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{emp?.fullName ?? "—"}</p>
                <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                <span className="text-[11px] text-muted-foreground">{days} hari</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                <Calendar className="mr-1 inline size-3" />
                {formatDateMed(leave.startDate)} — {formatDateMed(leave.endDate)}
              </p>
            </div>
          </div>
          <StatusBadge status={leave.status} label={STATUS_LABEL[leave.status]} />
        </div>

        <p className="mt-2 text-sm text-foreground">{leave.reason}</p>
        {leave.attachmentUrl ? (
          <p className="mt-1 text-[11px] text-muted-foreground">📎 {leave.attachmentUrl}</p>
        ) : null}
        {leave.approvalNote ? (
          <p className="mt-1 text-[11px] text-muted-foreground">Catatan: {leave.approvalNote}</p>
        ) : null}

        {conflict ? (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-[11px] text-destructive">
            <AlertTriangle className="size-3.5" />
            Konflik dengan pengajuan {conflict.startDate}–{conflict.endDate} ({conflict.status})
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
          <span className="text-[10px] text-muted-foreground">Pengaju: {lookupService.employeeName(leave.originalSubmitterId)}</span>
          {leave.status === "PENDING" ? (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onReview}>Review</Button>
          ) : leave.status === "APPROVED" ? (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={onCancel}>
              <RotateCcw className="size-3" /> Batalkan
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Create Leave Dialog
// ------------------------------------------------------------
function CreateLeaveDialog({ onClose }: { onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const [employeeId, setEmployeeId] = React.useState("");
  const [type, setType] = React.useState<LeaveType>("CUTI");
  const [startDate, setStartDate] = React.useState(todayISODate());
  const [endDate, setEndDate] = React.useState(todayISODate());
  const [reason, setReason] = React.useState("");
  const [attachmentUrl, setAttachmentUrl] = React.useState("");
  const [error, setError] = React.useState<string>();

  const emp = employees.find((e) => e.id === employeeId);
  const days = leaveService.leaveDays(startDate, endDate);
  const conflict = emp ? leaveService.checkConflict(emp.id, startDate, endDate) : undefined;
  const insufficientBalance = type === "CUTI" && emp ? emp.leaveBalanceDays < days : false;

  const submit = () => {
    if (!employeeId) { setError("Pilih karyawan."); return; }
    if (!reason.trim()) { setError("Alasan wajib diisi."); return; }
    if (daysBetween(endDate, startDate) < 0) { setError("Tanggal selesai harus setelah mulai."); return; }
    if (conflict) { setError("Ada konflik dengan pengajuan lain yang sudah ada."); return; }
    if (insufficientBalance) { setError(`Saldo cuti tidak cukup (tersisa ${emp?.leaveBalanceDays} hari, butuh ${days} hari).`); return; }
    leaveService.create({
      employeeId,
      type,
      startDate,
      endDate,
      reason: reason.trim(),
      attachmentUrl: attachmentUrl.trim() || undefined,
      originalSubmitterId: employeeId,
    });
    toast.success("Pengajuan dibuat");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" /> Buat Pengajuan</DialogTitle>
          <DialogDescription>Cuti, izin, atau sakit. Saldo cuti berkurang saat disetujui.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormRow>
            <Field label="Karyawan" required>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {employees.filter((e) => e.status === "AKTIF").map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.fullName} — {e.nik}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipe" required>
              <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUTI">Cuti</SelectItem>
                  <SelectItem value="IZIN">Izin</SelectItem>
                  <SelectItem value="SAKIT">Sakit</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Tanggal Mulai" required><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
            <Field label="Tanggal Selesai" required><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
          </FormRow>

          {emp ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Durasi: <strong className="text-foreground">{days} hari</strong></span>
              {type === "CUTI" ? (
                <span className={cn("font-medium", insufficientBalance ? "text-destructive" : "text-foreground")}>
                  Saldo: {emp.leaveBalanceDays} hari {insufficientBalance ? "(tidak cukup)" : `→ sisa ${Math.max(0, emp.leaveBalanceDays - days)} hari`}
                </span>
              ) : null}
            </div>
          ) : null}

          {conflict ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-3.5" /> Konflik dengan pengajuan {conflict.startDate}–{conflict.endDate} ({conflict.status})
            </div>
          ) : null}

          <Field label="Alasan" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Alasan pengajuan" /></Field>
          <Field label="Lampiran (simulasi)" hint="Nama file, cth: surat-dokter.pdf"><Input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="Opsional" /></Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit}>Buat Pengajuan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86400000);
}

// ------------------------------------------------------------
// Review Leave Dialog
// ------------------------------------------------------------
function ReviewLeaveDialog({ leave, onClose }: { leave: Leave; onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const emp = employees.find((e) => e.id === leave.employeeId);
  const [note, setNote] = React.useState("");
  const days = leaveService.leaveDays(leave.startDate, leave.endDate);
  const conflict = leaveService.checkConflict(leave.employeeId, leave.startDate, leave.endDate, leave.id);

  const approve = () => {
    leaveService.approve(leave.id, "hrd-staff-id", note || undefined);
    toast.success("Pengajuan disetujui, saldo cuti diperbarui");
    onClose();
  };
  const reject = () => {
    leaveService.reject(leave.id, "hrd-staff-id", note || undefined);
    toast.success("Pengajuan ditolak");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Review Pengajuan</DialogTitle>
          <DialogDescription>{emp?.fullName} · {TYPE_META[leave.type].label}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            <p><span className="text-muted-foreground">Periode:</span> {formatDateMed(leave.startDate)} — {formatDateMed(leave.endDate)} ({days} hari)</p>
            <p><span className="text-muted-foreground">Alasan:</span> {leave.reason}</p>
            {leave.attachmentUrl ? <p><span className="text-muted-foreground">Lampiran:</span> {leave.attachmentUrl}</p> : null}
            {leave.type === "CUTI" && emp ? (
              <p><span className="text-muted-foreground">Saldo saat ini:</span> <strong>{emp.leaveBalanceDays} hari</strong> → sisa {Math.max(0, emp.leaveBalanceDays - days)} hari</p>
            ) : null}
          </div>
          {conflict ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-3.5" /> Konflik dengan pengajuan {conflict.startDate}–{conflict.endDate}
            </div>
          ) : null}
          <Field label="Catatan Approval"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button variant="destructive" onClick={reject}><XCircle className="size-4" /> Tolak</Button>
          <Button onClick={approve}><CheckCircle2 className="size-4" /> Setujui</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
