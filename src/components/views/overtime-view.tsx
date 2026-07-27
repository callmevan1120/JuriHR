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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
import {
  overtimeService,
  type OvertimeAnomaly,
} from "@/lib/services/workforce";
import { lookupService } from "@/lib/services/master-data";
import {
  formatRupiah,
  formatDuration,
  formatDateMed,
  formatDateLong,
  todayISODate,
  cn,
  initials,
} from "@/lib/utils";
import type {
  OvertimeActual,
  OvertimePlanning,
  OvertimeApprovalStatus,
  OvertimeVerificationStatus,
} from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ChevronsUpDown,
  ShieldCheck,
  ShieldAlert,
  FileWarning,
  TrendingUp,
  Calendar,
  Users,
  Download,
} from "lucide-react";

const OT_RATE_DEFAULT = 25000;

export function OvertimeView() {
  return (
    <Tabs defaultValue="planning" className="space-y-4">
      <TabsList className="bg-muted/40 p-1">
        <TabsTrigger value="planning" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
          <Clock className="size-3.5" /> Planning
        </TabsTrigger>
        <TabsTrigger value="actual" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
          <CheckCircle2 className="size-3.5" /> Actual &amp; Verifikasi
        </TabsTrigger>
        <TabsTrigger value="anomali" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
          <AlertTriangle className="size-3.5" /> Anomali
        </TabsTrigger>
      </TabsList>
      <TabsContent value="planning"><PlanningTab /></TabsContent>
      <TabsContent value="actual"><ActualTab /></TabsContent>
      <TabsContent value="anomali"><AnomalyTab /></TabsContent>
    </Tabs>
  );
}

// ============================================================
// Planning Tab
// ============================================================
function PlanningTab() {
  const route = useRoute();
  const initialFilter = route.query.get("filter") ?? "all";
  const [filter, setFilter] = React.useState<string>(initialFilter);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [reviewTarget, setReviewTarget] = React.useState<OvertimePlanning | null>(null);

  const plannings = useStore((s) => s.overtimePlannings);

  const filtered = plannings
    .filter((p) => filter === "all" || p.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts = {
    all: plannings.length,
    PENDING: plannings.filter((p) => p.status === "PENDING").length,
    APPROVED: plannings.filter((p) => p.status === "APPROVED").length,
    REJECTED: plannings.filter((p) => p.status === "REJECTED").length,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Planning Lembur"
        description="Pengajuan lembur per kategori outlet/non-outlet, outlet/divisi, shift/tim."
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Buat Planning</Button>}
      />

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Semua", count: counts.all },
          { key: "PENDING", label: "Pending", count: counts.PENDING },
          { key: "APPROVED", label: "Approved", count: counts.APPROVED },
          { key: "REJECTED", label: "Rejected", count: counts.REJECTED },
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

      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <EmptyState title="Tidak ada planning" description="Belum ada pengajuan lembur." />
        ) : (
          filtered.map((plan) => (
            <PlanningCard key={plan.id} plan={plan} onReview={() => setReviewTarget(plan)} />
          ))
        )}
      </div>

      {createOpen ? <CreatePlanningDialog onClose={() => setCreateOpen(false)} /> : null}
      {reviewTarget ? <ReviewPlanningDialog plan={reviewTarget} onClose={() => setReviewTarget(null)} /> : null}
    </div>
  );
}

function PlanningCard({ plan, onReview }: { plan: OvertimePlanning; onReview: () => void }) {
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  const actuals = useStore((s) => s.overtimeActuals.filter((a) => a.planningId === plan.id));

  const empCount = plan.employeeIds.length;
  const outletName = plan.outletId ? outlets.find((o) => o.id === plan.outletId)?.name : undefined;
  const divName = plan.divisionId ? lookupService.divisionName(plan.divisionId) : undefined;

  return (
    <Card className="group border-border shadow-soft transition-all hover:shadow-soft-md">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn("flex size-10 items-center justify-center rounded-xl", plan.category === "OUTLET" ? "bg-primary/10 text-primary" : "bg-info/10 text-info")}>
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs font-medium text-foreground">{plan.requestNo}</p>
                <Badge variant="outline" className="text-[10px]">{plan.category === "OUTLET" ? "Outlet" : "Non-Outlet"}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {formatDateMed(plan.date)} · {plan.startTime}–{plan.endTime} ({formatDuration(plan.durationMinutes)})
              </p>
            </div>
          </div>
          <StatusBadge status={plan.status} />
        </div>

        <p className="mt-2 text-sm text-foreground">{plan.reason}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Pekerjaan: {plan.workDescription}</p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Users className="size-3" /> {empCount} karyawan</span>
          {outletName ? <span>📍 {outletName}</span> : null}
          {divName ? <span>🏢 {divName}</span> : null}
          {plan.shiftOrTeam ? <span>👥 {plan.shiftOrTeam}</span> : null}
          <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3" /> PJ: {lookupService.employeeName(plan.picId)}</span>
        </div>

        {actuals.length > 0 ? (
          <div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-[11px]">
            <span className="text-muted-foreground">Actual: {actuals.length} record</span>
            <Badge variant="outline" className="text-[9px]">
              {actuals.filter((a) => a.verificationStatus === "TERVERIFIKASI").length} terverifikasi
            </Badge>
            {actuals.some((a) => a.verificationStatus === "BELUM_DIISI") ? (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[9px]">ada belum diisi</Badge>
            ) : null}
          </div>
        ) : null}

        {plan.status === "PENDING" ? (
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onReview}>Review</Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CreatePlanningDialog({ onClose }: { onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  const divisions = useStore((s) => s.divisions);
  const [category, setCategory] = React.useState<"OUTLET" | "NON_OUTLET">("OUTLET");
  const [outletId, setOutletId] = React.useState("");
  const [divisionId, setDivisionId] = React.useState("");
  const [shiftOrTeam, setShiftOrTeam] = React.useState("");
  const [employeeIds, setEmployeeIds] = React.useState<string[]>([]);
  const [date, setDate] = React.useState(todayISODate());
  const [startTime, setStartTime] = React.useState("16:00");
  const [endTime, setEndTime] = React.useState("20:00");
  const [reason, setReason] = React.useState("");
  const [workDescription, setWorkDescription] = React.useState("");
  const [picId, setPicId] = React.useState("");
  const [empOpen, setEmpOpen] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const durationMin = computeDuration(startTime, endTime);
  const activeEmps = employees.filter((e) => e.status === "AKTIF");

  const submit = () => {
    if (employeeIds.length === 0) { setError("Pilih minimal 1 karyawan."); return; }
    if (!reason.trim()) { setError("Alasan wajib diisi."); return; }
    overtimeService.createPlanning({
      requestNo: `OT/${todayISODate().slice(0, 4)}/${String(Date.now()).slice(-4)}`,
      originalSubmitterId: "hrd-staff-id",
      category,
      outletId: category === "OUTLET" ? outletId || undefined : undefined,
      divisionId: category === "NON_OUTLET" ? divisionId || undefined : undefined,
      shiftOrTeam: shiftOrTeam || undefined,
      employeeIds,
      date,
      startTime,
      endTime,
      durationMinutes: durationMin,
      reason: reason.trim(),
      workDescription: workDescription.trim(),
      picId: picId || undefined,
    });
    toast.success("Planning lembur dibuat");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" /> Buat Planning Lembur</DialogTitle>
          <DialogDescription>Pengajuan lembur untuk satu/beberapa karyawan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormRow>
            <Field label="Kategori" required>
              <Select value={category} onValueChange={(v) => setCategory(v as "OUTLET" | "NON_OUTLET")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTLET">Outlet</SelectItem>
                  <SelectItem value="NON_OUTLET">Non-Outlet</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tanggal" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          </FormRow>
          <FormRow>
            <Field label="Jam Mulai"><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="font-mono" /></Field>
            <Field label="Jam Selesai"><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="font-mono" /></Field>
          </FormRow>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Durasi planning</span>
            <span className="font-medium tabular-nums text-foreground">{formatDuration(durationMin)}</span>
          </div>
          {category === "OUTLET" ? (
            <Field label="Outlet">
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <Field label="Divisi">
              <Select value={divisionId} onValueChange={setDivisionId}>
                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          <FormRow>
            <Field label="Shift / Tim"><Input value={shiftOrTeam} onChange={(e) => setShiftOrTeam(e.target.value)} placeholder="Tim Pagi" /></Field>
            <Field label="Penanggung Jawab">
              <Select value={picId} onValueChange={setPicId}>
                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {activeEmps.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </FormRow>

          <Field label="Daftar Karyawan" hint={`${employeeIds.length} karyawan terpilih`} required>
            <Popover open={empOpen} onOpenChange={setEmpOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {employeeIds.length === 0 ? "Pilih karyawan..." : `${employeeIds.length} karyawan dipilih`}
                  <ChevronsUpDown className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari karyawan..." />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {activeEmps.map((e) => (
                        <CommandItem key={e.id} value={`${e.fullName} ${e.nik}`} onSelect={() => setEmployeeIds((prev) => prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id])}>
                          <Checkbox checked={employeeIds.includes(e.id)} className="mr-2" />
                          <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">{initials(e.fullName)}</div>
                          <span className="flex-1 text-sm">{e.fullName}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{e.nik}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>

          <Field label="Alasan" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Alasan lembur" /></Field>
          <Field label="Pekerjaan"><Textarea value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} rows={2} placeholder="Deskripsi pekerjaan" /></Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit}>Buat Planning</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function computeDuration(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // lewat tengah malam
  return mins;
}

function ReviewPlanningDialog({ plan, onClose }: { plan: OvertimePlanning; onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const [note, setNote] = React.useState("");

  const approve = () => {
    overtimeService.approvePlanning(plan.id, "hrd-staff-id");
    toast.success("Planning disetujui");
    onClose();
  };
  const reject = () => {
    overtimeService.rejectPlanning(plan.id, "hrd-staff-id");
    toast.success("Planning ditolak");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Review Planning Lembur</DialogTitle>
          <DialogDescription>{plan.requestNo}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            <p><span className="text-muted-foreground">Tanggal:</span> {formatDateLong(plan.date)} · {plan.startTime}–{plan.endTime} ({formatDuration(plan.durationMinutes)})</p>
            <p><span className="text-muted-foreground">Kategori:</span> {plan.category}</p>
            <p><span className="text-muted-foreground">Karyawan:</span> {plan.employeeIds.length} orang</p>
            <p><span className="text-muted-foreground">Alasan:</span> {plan.reason}</p>
          </div>
          <div className="max-h-[150px] space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {plan.employeeIds.map((id) => {
              const emp = employees.find((e) => e.id === id);
              return emp ? (
                <div key={id} className="flex items-center gap-2 text-xs">
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[8px] font-bold text-primary-foreground">{initials(emp.fullName)}</div>
                  <span className="flex-1">{emp.fullName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{emp.nik}</span>
                </div>
              ) : null;
            })}
          </div>
          <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></Field>
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

// ============================================================
// Actual Tab
// ============================================================
function ActualTab() {
  const [filter, setFilter] = React.useState<string>("all");
  const [editTarget, setEditTarget] = React.useState<OvertimeActual | null>(null);
  const actuals = useStore((s) => s.overtimeActuals);
  const plannings = useStore((s) => s.overtimePlannings);

  const filtered = actuals
    .filter((a) => {
      if (filter === "all") return true;
      if (filter === "TERVERIFIKASI") return a.verificationStatus === "TERVERIFIKASI";
      if (filter === "BELUM_DIISI") return a.verificationStatus === "BELUM_DIISI";
      if (filter === "BELUM_DIVERIFIKASI") return a.verificationStatus === "DIISI";
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const counts = {
    all: actuals.length,
    TERVERIFIKASI: actuals.filter((a) => a.verificationStatus === "TERVERIFIKASI").length,
    BELUM_DIISI: actuals.filter((a) => a.verificationStatus === "BELUM_DIISI").length,
    BELUM_DIVERIFIKASI: actuals.filter((a) => a.verificationStatus === "DIISI").length,
  };
  const totalVerified = actuals.filter((a) => a.verificationStatus === "TERVERIFIKASI").reduce((s, a) => s + a.estimatedNominal, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Actual Lembur & Verifikasi"
        description="Input actual lembur, verifikasi HRD. Payroll hanya membaca actual terverifikasi."
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-1.5 text-xs">
            <TrendingUp className="size-4 text-success" />
            <span className="text-muted-foreground">Total Terverifikasi:</span>
            <span className="font-bold tabular-nums text-success">{formatRupiah(totalVerified)}</span>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Semua", count: counts.all },
          { key: "TERVERIFIKASI", label: "Terverifikasi", count: counts.TERVERIFIKASI },
          { key: "BELUM_DIVERIFIKASI", label: "Belum Diverifikasi", count: counts.BELUM_DIVERIFIKASI },
          { key: "BELUM_DIISI", label: "Belum Diisi", count: counts.BELUM_DIISI },
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

      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <EmptyState title="Tidak ada actual" description="Belum ada record actual lembur." />
        ) : (
          filtered.map((actual) => (
            <ActualCard key={actual.id} actual={actual} onEdit={() => setEditTarget(actual)} />
          ))
        )}
      </div>

      {editTarget ? <EditActualDialog actual={editTarget} onClose={() => setEditTarget(null)} /> : null}
    </div>
  );
}

function ActualCard({ actual, onEdit }: { actual: OvertimeActual; onEdit: () => void }) {
  const employees = useStore((s) => s.employees);
  const plannings = useStore((s) => s.overtimePlannings);
  const emp = employees.find((e) => e.id === actual.employeeId);
  const plan = actual.planningId ? plannings.find((p) => p.id === actual.planningId) : undefined;

  const statusColor: Record<OvertimeVerificationStatus, string> = {
    TERVERIFIKASI: "bg-success/15 text-success border-success/30",
    DIISI: "bg-warning/15 text-warning border-warning/30",
    BELUM_DIISI: "bg-muted text-muted-foreground border-border",
    DITOLAK: "bg-destructive/10 text-destructive border-destructive/30",
  };
  const statusLabel: Record<OvertimeVerificationStatus, string> = {
    TERVERIFIKASI: "Terverifikasi",
    DIISI: "Diisi",
    BELUM_DIISI: "Belum Diisi",
    DITOLAK: "Ditolak",
  };

  return (
    <Card className="group border-border shadow-soft transition-all hover:shadow-soft-md">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary-foreground">
              {emp ? initials(emp.fullName) : "?"}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{emp?.fullName ?? "—"}</p>
              <p className="text-[11px] text-muted-foreground">{formatDateMed(actual.date)}</p>
            </div>
          </div>
          <Badge variant="outline" className={statusColor[actual.verificationStatus]}>{statusLabel[actual.verificationStatus]}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">Actual</p>
            <p className="font-medium text-foreground">
              {actual.actualStart && actual.actualEnd ? `${actual.actualStart.slice(11, 16)}–${actual.actualEnd.slice(11, 16)}` : "—"}
            </p>
          </div>
          <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">Durasi</p>
            <p className="font-medium text-foreground">{actual.actualDurationMinutes ? formatDuration(actual.actualDurationMinutes) : "—"}</p>
          </div>
          <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">Planning</p>
            <p className="font-medium text-foreground">{plan ? `${plan.startTime}–${plan.endTime}` : "⚠ Tanpa planning"}</p>
          </div>
          <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">Nominal</p>
            <p className="font-medium tabular-nums text-foreground">{actual.estimatedNominal > 0 ? formatRupiah(actual.estimatedNominal) : "—"}</p>
          </div>
        </div>

        {actual.planningDiffMinutes != null && actual.planningDiffMinutes !== 0 ? (
          <p className={cn("mt-2 text-[11px] font-medium", actual.planningDiffMinutes > 0 ? "text-warning" : "text-success")}>
            Selisih planning: {actual.planningDiffMinutes > 0 ? "+" : ""}{actual.planningDiffMinutes}m
            {actual.diffReason ? ` · ${actual.diffReason}` : ""}
          </p>
        ) : null}
        {actual.workResult ? <p className="mt-1 text-[11px] text-muted-foreground">Hasil: {actual.workResult}</p> : null}

        <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-2">
          {actual.verificationStatus === "DIISI" ? (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => { overtimeService.verifyActual(actual.id, "hrd-staff-id", false); toast.success("Actual ditolak"); }}>
                <XCircle className="size-3" /> Tolak
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-success hover:text-success" onClick={() => { overtimeService.verifyActual(actual.id, "hrd-staff-id", true); toast.success("Actual diverifikasi"); }}>
                <ShieldCheck className="size-3" /> Verifikasi
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onEdit}>
            {actual.verificationStatus === "BELUM_DIISI" ? "Isi Actual" : "Edit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditActualDialog({ actual, onClose }: { actual: OvertimeActual; onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const emp = employees.find((e) => e.id === actual.employeeId);
  const [actualStart, setActualStart] = React.useState(actual.actualStart?.slice(11, 16) ?? "");
  const [actualEnd, setActualEnd] = React.useState(actual.actualEnd?.slice(11, 16) ?? "");
  const [workResult, setWorkResult] = React.useState(actual.workResult ?? "");
  const [evidenceUrl, setEvidenceUrl] = React.useState(actual.evidenceUrl ?? "");
  const [diffReason, setDiffReason] = React.useState(actual.diffReason ?? "");
  const [note, setNote] = React.useState(actual.note ?? "");
  const [rate, setRate] = React.useState(String(actual.rate));

  const durationMin = actualStart && actualEnd ? computeDuration(actualStart, actualEnd) : 0;
  const nominal = Math.round((durationMin / 60) * (Number(rate) || 0));

  const save = () => {
    overtimeService.upsertActual({
      id: actual.id,
      planningId: actual.planningId,
      employeeId: actual.employeeId,
      date: actual.date,
      actualStart: actualStart ? `${actual.date}T${actualStart}:00+07:00` : undefined,
      actualEnd: actualEnd ? `${actual.date}T${actualEnd}:00+07:00` : undefined,
      actualDurationMinutes: durationMin || undefined,
      timeSource: "MANUAL",
      workResult: workResult.trim() || undefined,
      evidenceUrl: evidenceUrl.trim() || undefined,
      diffReason: diffReason.trim() || undefined,
      rate: Number(rate) || 0,
      note: note.trim() || undefined,
    });
    toast.success("Actual lembur disimpan");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Clock className="size-5 text-primary" /> Actual Lembur</DialogTitle>
          <DialogDescription>{emp?.fullName} · {formatDateLong(actual.date)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormRow>
            <Field label="Actual Start"><Input type="time" value={actualStart} onChange={(e) => setActualStart(e.target.value)} className="font-mono" /></Field>
            <Field label="Actual End"><Input type="time" value={actualEnd} onChange={(e) => setActualEnd(e.target.value)} className="font-mono" /></Field>
          </FormRow>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Durasi · Nominal</span>
            <span className="font-medium tabular-nums text-foreground">{formatDuration(durationMin)} · {formatRupiah(nominal)}</span>
          </div>
          <Field label="Hasil Pekerjaan"><Textarea value={workResult} onChange={(e) => setWorkResult(e.target.value)} rows={2} placeholder="Hasil pekerjaan lembur" /></Field>
          <FormRow>
            <Field label="Bukti (simulasi)"><Input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="foto-bukti.jpg" /></Field>
            <Field label="Rate per jam"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="tabular-nums" /></Field>
          </FormRow>
          <Field label="Alasan Selisih Planning" hint="Jika actual berbeda dari planning"><Input value={diffReason} onChange={(e) => setDiffReason(e.target.value)} placeholder="Opsional" /></Field>
          <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Anomaly Tab
// ============================================================
function AnomalyTab() {
  const anomalies = overtimeService.anomalies();
  const [filter, setFilter] = React.useState<string>("all");

  const types = ["all", "TANPA_PLANNING", "MELEBIHI_PLANNING", "BELUM_DIISI", "BELUM_DIVERIFIKASI", "KONFLIK_CUTI", "KONFLIK_LIBUR"];
  const typeLabel: Record<string, string> = {
    all: "Semua",
    TANPA_PLANNING: "Tanpa Planning",
    MELEBIHI_PLANNING: "Melebihi Planning",
    BELUM_DIISI: "Belum Diisi",
    BELUM_DIVERIFIKASI: "Belum Diverifikasi",
    KONFLIK_CUTI: "Konflik Cuti",
    KONFLIK_LIBUR: "Konflik Libur",
  };

  const filtered = anomalies.filter((a) => filter === "all" || a.type === filter);
  const counts = {
    high: anomalies.filter((a) => a.severity === "high").length,
    medium: anomalies.filter((a) => a.severity === "medium").length,
    low: anomalies.filter((a) => a.severity === "low").length,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Anomali Lembur"
        description="Deteksi otomatis: tanpa planning, melebihi planning, belum diisi, belum diverifikasi, konflik cuti/libur."
      />

      {/* Severity cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive" />
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">High</p>
              <p className="text-2xl font-bold tabular-nums text-destructive">{counts.high}</p>
            </div>
          </div>
        </Card>
        <Card className="border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2">
            <FileWarning className="size-5 text-warning" />
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Medium</p>
              <p className="text-2xl font-bold tabular-nums text-warning">{counts.medium}</p>
            </div>
          </div>
        </Card>
        <Card className="border-info/30 bg-info/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-info" />
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Low/Info</p>
              <p className="text-2xl font-bold tabular-nums text-info">{counts.low}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {types.map((t) => {
          const count = t === "all" ? anomalies.length : anomalies.filter((a) => a.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                filter === t ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {typeLabel[t]}
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Anomaly list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState title="Tidak ada anomali" description="Semua actual lembur dalam kondisi baik." icon={<CheckCircle2 className="size-6 text-success" />} />
        ) : (
          filtered.map((a, i) => <AnomalyRow key={i} anomaly={a} />)
        )}
      </div>
    </div>
  );
}

function AnomalyRow({ anomaly }: { anomaly: OvertimeAnomaly }) {
  const employees = useStore((s) => s.employees);
  const emp = employees.find((e) => e.id === anomaly.employeeId);
  const severityConfig = {
    high: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: ShieldAlert },
    medium: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", icon: FileWarning },
    low: { color: "text-info", bg: "bg-info/10", border: "border-info/30", icon: AlertTriangle },
    info: { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: AlertTriangle },
  };
  const cfg = severityConfig[anomaly.severity];
  const Icon = cfg.icon;
  const typeLabel: Record<string, string> = {
    TANPA_PLANNING: "Tanpa Planning",
    MELEBIHI_PLANNING: "Melebihi Planning",
    BELUM_DIISI: "Belum Diisi",
    BELUM_DIVERIFIKASI: "Belum Diverifikasi",
    KONFLIK_CUTI: "Konflik Cuti",
    KONFLIK_LIBUR: "Konflik Libur",
  };

  return (
    <Card className={cn("border p-3", cfg.border, cfg.bg)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", cfg.bg, cfg.color)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{emp?.fullName ?? "—"}</span>
            <Badge variant="outline" className={cn("text-[9px]", cfg.border, cfg.color)}>{typeLabel[anomaly.type]}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">{anomaly.message}</p>
          <p className="text-[10px] text-muted-foreground">{formatDateMed(anomaly.date)}</p>
        </div>
        <a
          href={`#/lembur?filter=actual`}
          onClick={() => { window.location.hash = "#/lembur"; }}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          Lihat →
        </a>
      </div>
    </Card>
  );
}
