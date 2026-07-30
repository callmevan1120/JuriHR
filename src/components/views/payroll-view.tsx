"use client";

import * as React from "react";
import { PageHeader, FilterBar } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable, selectionColumn } from "@/components/common/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { useStore } from "@/hooks/use-store";
import { payrollService } from "@/lib/services/finance";
import {
  formatRupiah,
  formatDateMed,
  formatDateTimeMed,
  todayISODate,
  cn,
  initials,
  monthLabel,
} from "@/lib/utils";
import type {
  PayrollComponent,
  PayrollEntry,
  PayrollEntryStatus,
  PayrollPeriod,
  PayrollPeriodStatus,
} from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Wallet,
  Wand2,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Lock,
  Eye,
  Plus,
  AlertCircle,
  Upload,
  CalendarDays,
  RotateCcw,
  Flag,
  Users,
} from "lucide-react";

const PERIOD_STATUS_LABEL: Record<PayrollPeriodStatus, string> = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  REVIEWED: "Reviewed",
  FINALIZED: "Finalized",
};

const PERIOD_STATUS_STYLE: Record<PayrollPeriodStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  GENERATED: "bg-info/15 text-info border-info/30",
  REVIEWED: "bg-warning/15 text-warning border-warning/30",
  FINALIZED: "bg-success/15 text-success border-success/30",
};

const ENTRY_STATUS_STYLE: Record<PayrollEntryStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  REVIEWED: "bg-info/15 text-info border-info/30",
  FINALIZED: "bg-success/15 text-success border-success/30",
};

export function PayrollView() {
  const periods = useStore((s) => s.payrollPeriods);
  const [selectedPeriodId, setSelectedPeriodId] = React.useState<string>("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailTarget, setDetailTarget] = React.useState<PayrollEntry | null>(null);

  React.useEffect(() => {
    if (!selectedPeriodId && periods.length > 0) setSelectedPeriodId(periods[0]!.id);
  }, [periods, selectedPeriodId]);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll"
        description="Kelola periode payroll, generate, review, finalize, dan export."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Buat Periode
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Period list sidebar */}
        <div className="rounded-xl border border-border lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <CalendarDays className="size-4 text-primary" />
            <span className="text-sm font-semibold">Periode Payroll</span>
          </div>
          <div className="space-y-2 p-3">
            {periods.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Belum ada periode.</p>
            ) : (
              periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriodId(p.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-all",
                    selectedPeriodId === p.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
                    <Badge variant="outline" className={cn("text-[9px]", PERIOD_STATUS_STYLE[p.status])}>{PERIOD_STATUS_LABEL[p.status]}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{monthLabel(p.period)} · {formatDateMed(p.startDate)} — {formatDateMed(p.endDate)}</span>
                  {p.scopeType !== "ALL" ? <span className="text-[10px] text-muted-foreground">Scope: {p.scopeType}</span> : null}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Period detail */}
        <div className="space-y-4 lg:col-span-3">
          {selectedPeriod ? (
            <PeriodDetail
              period={selectedPeriod}
              onEntryClick={setDetailTarget}
            />
          ) : (
            <div className="rounded-xl border border-border py-12 text-center text-sm text-muted-foreground">
              Pilih atau buat periode payroll untuk memulai.
            </div>
          )}
        </div>
      </div>

      {createOpen ? <CreatePeriodDialog onClose={() => setCreateOpen(false)} onCreated={(id) => setSelectedPeriodId(id)} /> : null}
      {detailTarget ? <EntryDetailDialog entry={detailTarget} onClose={() => setDetailTarget(null)} /> : null}
    </div>
  );
}

// ============================================================
// Period Detail (dashboard + table)
// ============================================================
function PeriodDetail({
  period,
  onEntryClick,
}: {
  period: PayrollPeriod;
  onEntryClick: (e: PayrollEntry) => void;
}) {
  const entries = useStore((s) => s.payrolls.filter((p) => p.periodId === period.id));
  const dash = React.useMemo(() => payrollService.dashboard(period.id), [period.id, entries]);
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [reviewConfirm, setReviewConfirm] = React.useState(false);
  const [finalizeConfirm, setFinalizeConfirm] = React.useState(false);
  const [filterOutlet, setFilterOutlet] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState("all");

  const outlets = useStore((s) => s.outlets);
  const isFinalized = period.status === "FINALIZED";
  const isGenerated = period.status !== "DRAFT";

  const filtered = entries.filter((e) => {
    if (filterOutlet !== "all" && !e.outletName.includes(outlets.find((o) => o.id === filterOutlet)?.name ?? "")) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    return true;
  });

  const handleExportCSV = () => {
    const csv = payrollService.exportCSV(period.id);
    downloadCSV(csv, `payroll-${period.period}.csv`);
    toast.success("Excel/CSV diekspor");
  };
  const handleExportPerOutlet = () => {
    const csv = payrollService.exportPerOutlet(period.id);
    downloadCSV(csv, `payroll-per-outlet-${period.period}.csv`);
    toast.success("Rekap per outlet diekspor");
  };
  const handlePrint = () => {
    window.print();
    toast.info("Gunakan 'Save as PDF' pada dialog cetak.");
  };

  const columns: ColumnDef<PayrollEntry>[] = [
    {
      id: "name",
      header: "Karyawan",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">{initials(row.original.fullName)}</div>
          <div><p className="text-sm font-medium">{row.original.fullName}</p><p className="font-mono text-[10px] text-muted-foreground">{row.original.nik}</p></div>
        </div>
      ),
    },
    { accessorKey: "positionName", header: "Posisi", cell: ({ row }) => <span className="text-xs">{row.original.positionName}</span> },
    { accessorKey: "outletName", header: "Outlet", cell: ({ row }) => <span className="text-xs">{row.original.outletName.replace("JURI Bun — ", "")}</span> },
    {
      id: "salaryType",
      header: "Jenis",
      cell: ({ row }) => <Badge variant="outline" className="text-[9px]">{row.original.salaryType === "BULANAN" ? "Bulanan" : "Harian"}</Badge>,
    },
    { accessorKey: "salaryRate", header: "Tarif", cell: ({ row }) => <span className="tabular-nums text-xs">{formatRupiah(row.original.salaryRate)}</span> },
    { accessorKey: "paidDays", header: "Hari", cell: ({ row }) => <span className="tabular-nums text-center text-xs">{row.original.paidDays}</span> },
    { accessorKey: "baseSalary", header: "Gaji Dasar", cell: ({ row }) => <span className="tabular-nums text-xs">{formatRupiah(row.original.baseSalary)}</span> },
    { accessorKey: "overtimeAmount", header: "Lembur", cell: ({ row }) => <span className="tabular-nums text-xs text-success">{formatRupiah(row.original.overtimeAmount)}</span> },
    {
      id: "deductions",
      header: "Potongan",
      cell: ({ row }) => {
        const total = row.original.lateDeduction + row.original.absenceDeduction + row.original.otherDeduction + row.original.kasbon;
        return <span className="tabular-nums text-xs text-destructive">{formatRupiah(total)}</span>;
      },
    },
    { accessorKey: "total", header: "Total", cell: ({ row }) => <span className="font-semibold tabular-nums text-xs">{formatRupiah(row.original.total)}</span> },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={cn("text-[9px]", ENTRY_STATUS_STYLE[row.original.status])}>{row.original.status}</Badge>
          {row.original.needsReview ? <Flag className="size-3 text-warning" /> : null}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); onEntryClick(row.original); }}>
          <Eye className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Period info bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{period.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {monthLabel(period.period)} · {formatDateMed(period.startDate)} — {formatDateMed(period.endDate)}
              {period.generatedAt ? ` · Generated ${formatDateTimeMed(period.generatedAt)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={PERIOD_STATUS_STYLE[period.status]}>{PERIOD_STATUS_LABEL[period.status]}</Badge>
          {!isGenerated ? (
            <Button size="sm" onClick={() => setGenerateOpen(true)}><Wand2 className="size-4" /> Generate</Button>
          ) : null}
          {period.status === "GENERATED" ? (
            <Button size="sm" variant="outline" onClick={() => setReviewConfirm(true)}><CheckCircle2 className="size-4" /> Review Semua</Button>
          ) : null}
          {period.status === "REVIEWED" ? (
            <Button size="sm" onClick={() => setFinalizeConfirm(true)}><Lock className="size-4" /> Finalisasi</Button>
          ) : null}
          {isGenerated ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="size-4" /> Import</Button>
              <Button size="sm" variant="outline" onClick={handleExportCSV}><FileSpreadsheet className="size-4" /> Excel</Button>
              <Button size="sm" variant="outline" onClick={handleExportPerOutlet}><Download className="size-4" /> Per Outlet</Button>
              <Button size="sm" variant="outline" onClick={handlePrint}><FileText className="size-4" /> PDF</Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Stats row */}
      {isGenerated ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Payroll" value={formatRupiah(dash.totalPayroll)} icon={Wallet} accent="primary" />
          <StatCard label="Jumlah Karyawan" value={String(dash.employeeCount)} icon={Users} accent="info" />
          <StatCard label="Total Gaji Dasar" value={formatRupiah(dash.totalBaseSalary)} icon={FileSpreadsheet} accent="success" />
          <StatCard label="Total Potongan" value={formatRupiah(dash.totalDeductions)} icon={AlertCircle} accent="destructive" />
          <StatCard label="Total Lembur" value={formatRupiah(dash.totalOvertime)} icon={CheckCircle2} accent="success" />
          <StatCard label="Total PH" value={formatRupiah(dash.totalPH)} icon={Wallet} accent="info" />
          <StatCard label="Total Bonus/Insentif" value={formatRupiah(dash.totalBonus)} icon={Plus} accent="warning" />
          <StatCard label="Total Penambah" value={formatRupiah(dash.totalAdditions)} icon={Plus} accent="success" />
        </div>
      ) : null}

      {/* Table */}
      {isGenerated ? (
        <div className="space-y-3">
          <FilterBar>
            <Select value={filterOutlet} onValueChange={setFilterOutlet}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Outlet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Outlet</SelectItem>
                {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="FINALIZED">Finalized</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">{filtered.length} karyawan</Badge>
            {dash.needsReviewCount > 0 ? (
              <Badge className="bg-warning/15 text-warning border-warning/30"><Flag className="size-3" /> {dash.needsReviewCount} perlu review</Badge>
            ) : null}
          </FilterBar>
          <DataTable
            columns={[selectionColumn<PayrollEntry>(), ...columns] as ColumnDef<PayrollEntry>[]}
            data={filtered}
            searchPlaceholder="Cari karyawan..."
            pageSize={15}
            onRowClick={onEntryClick}
            globalFilterFn={(row, q) => `${row.fullName} ${row.nik}`.toLowerCase().includes(q.toLowerCase())}
            emptyMessage="Belum ada data. Klik Generate untuk membuat."
          />
        </div>
      ) : null}

      {generateOpen ? <GenerateDialog period={period} onClose={() => setGenerateOpen(false)} /> : null}
      {importOpen ? <ImportDialog period={period} onClose={() => setImportOpen(false)} /> : null}
      <ConfirmDialog
        open={reviewConfirm}
        onOpenChange={setReviewConfirm}
        title="Review semua entry payroll?"
        description={`Semua ${entries.length} entry akan ditandai sebagai Reviewed. Anda masih bisa mengedit sebelum finalisasi.`}
        confirmLabel="Ya, Review Semua"
        onConfirm={() => {
          payrollService.reviewPeriod(period.id);
          toast.success("Periode direview");
        }}
      />
      <ConfirmDialog
        open={finalizeConfirm}
        onOpenChange={setFinalizeConfirm}
        title="Finalisasi periode payroll?"
        description="Periode yang difinalisasi TIDAK dapat diubah lagi. Semua entry akan dikunci."
        destructive
        confirmLabel="Ya, Finalisasi"
        onConfirm={() => {
          try {
            payrollService.finalizePeriod(period.id, "HRD Admin");
            toast.success("Periode difinalisasi & dikunci");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Gagal");
          }
        }}
      />
    </div>
  );
}

// ============================================================
// Create Period Dialog
// ============================================================
function CreatePeriodDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const outlets = useStore((s) => s.outlets);
  const divisions = useStore((s) => s.divisions);
  const [name, setName] = React.useState("");
  const [period, setPeriod] = React.useState(todayISODate().slice(0, 7));
  const [scopeType, setScopeType] = React.useState<"ALL" | "OUTLET" | "DIVISI">("ALL");
  const [scopeId, setScopeId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string>();
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Auto-set name & dates from period
  React.useEffect(() => {
    if (!name) setName(`Payroll ${monthLabel(period)}`);
    const [y, m] = period.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;
    setStartDate(start);
    setEndDate(end);
  }, [period, name]);

  const submit = () => {
    if (!name.trim()) { setError("Nama wajib diisi."); return; }
    if (!period || !startDate || !endDate) { setError("Periode & tanggal wajib diisi."); return; }
    const pp = payrollService.createPeriod({
      name: name.trim(),
      period,
      startDate,
      endDate,
      scopeType,
      scopeId: scopeId || undefined,
      note: note.trim() || undefined,
    });
    toast.success("Periode payroll dibuat");
    onCreated(pp.id);
    onClose();
  };

  const scopeOptions = scopeType === "OUTLET" ? outlets : scopeType === "DIVISI" ? divisions : [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" /> Buat Periode Payroll</DialogTitle>
          <DialogDescription>Buat periode baru, lalu generate data karyawan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormRow>
            <Field label="Nama Periode" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Payroll ${monthLabel(period)}`} /></Field>
            <Field label="Bulan/Tahun" required><Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></Field>
          </FormRow>
          <FormRow>
            <Field label="Tanggal Mulai"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
            <Field label="Tanggal Selesai"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
          </FormRow>
          <FormRow>
            <Field label="Scope">
              <Select value={scopeType} onValueChange={(v) => { setScopeType(v as "ALL" | "OUTLET" | "DIVISI"); setScopeId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Karyawan</SelectItem>
                  <SelectItem value="OUTLET">Per Outlet</SelectItem>
                  <SelectItem value="DIVISI">Per Divisi</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {scopeType !== "ALL" ? (
              <Field label={scopeType === "OUTLET" ? "Outlet" : "Divisi"}>
                <Select value={scopeId} onValueChange={setScopeId}>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </FormRow>
          <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit}>Buat Periode</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Generate Dialog
// ============================================================
function GenerateDialog({ period, onClose }: { period: PayrollPeriod; onClose: () => void }) {
  const [loading, setLoading] = React.useState(false);

  const run = () => {
    setLoading(true);
    try {
      const count = payrollService.generate(period.id, "HRD Admin");
      toast.success(`${count} entry payroll digenerate dengan snapshot`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="size-5 text-primary" /> Generate Payroll</DialogTitle>
          <DialogDescription>
            Generate entry payroll untuk "{period.name}". Data karyawan, gaji, absensi, dan lembur akan di-SNAPSHOT.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-info">
            <p className="font-medium">Snapshot yang disimpan:</p>
            <p className="mt-1">NIK, nama, posisi, divisi, outlet, jenis gaji, tarif, hari dibayar, seluruh komponen, total.</p>
            <p className="mt-1 font-medium">Perubahan data setelah generate TIDAK mengubah payroll.</p>
          </div>
          {period.status === "GENERATED" || period.status === "REVIEWED" ? (
            <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
              <AlertCircle className="size-4" />
              Generate ulang akan menghapus entry yang belum finalized.
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={run} disabled={loading}>
            {loading ? <RotateCcw className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Import Dialog
// ============================================================
function ImportDialog({ period, onClose }: { period: PayrollPeriod; onClose: () => void }) {
  const handleDownloadTemplate = () => {
    const headers = ["NIK", "Bonus", "Insentif", "Kasbon", "Potongan Lain", "Catatan"];
    const csv = headers.join(",") + "\nJBD01000,500000,0,0,0,Bonus performa";
    downloadCSV(csv, `template-import-payroll-${period.period}.csv`);
    toast.success("Template CSV diunduh");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="size-5 text-primary" /> Import Komponen Payroll</DialogTitle>
          <DialogDescription>Import bonus, insentif, kasbon, dan potongan lain via CSV.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-info">
            <p className="font-medium">Format CSV:</p>
            <p className="mt-1 font-mono text-[10px]">NIK, Bonus, Insentif, Kasbon, Potongan Lain, Catatan</p>
          </div>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-8 text-center">
            <div>
              <Upload className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Seret file CSV ke sini atau</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleDownloadTemplate}>
                <Download className="size-4" /> Unduh Template
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Prototipe: import aktual memerlukan backend. Template CSV dapat diunduh untuk referensi format.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Entry Detail Dialog
// ============================================================
function EntryDetailDialog({ entry, onClose }: { entry: PayrollEntry; onClose: () => void }) {
  const periods = useStore((s) => s.payrollPeriods);
  const period = periods.find((p) => p.id === entry.periodId);
  const [adjOpen, setAdjOpen] = React.useState(false);
  const isFinalized = entry.status === "FINALIZED";
  const additions = entry.additions.reduce((s, c) => s + c.amount, 0);
  const deductions = entry.deductions.reduce((s, c) => s + c.amount, 0);

  const refresh = () => {
    const updated = payrollService.getEntry(entry.id);
    if (updated) Object.assign(entry, updated);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wallet className="size-5 text-primary" /> Rincian Payroll</DialogTitle>
          <DialogDescription>{entry.fullName} · {period?.name ?? entry.periodId}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Snapshot info */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Snapshot (tersimpan saat generate)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><span className="text-muted-foreground">NIK:</span> <span className="font-mono">{entry.nik}</span></div>
              <div><span className="text-muted-foreground">Posisi:</span> {entry.positionName}</div>
              <div><span className="text-muted-foreground">Outlet:</span> {entry.outletName}</div>
              <div><span className="text-muted-foreground">Divisi:</span> {entry.divisionName}</div>
              <div><span className="text-muted-foreground">Jenis Gaji:</span> {entry.salaryType === "BULANAN" ? "Bulanan" : "Harian"}</div>
              <div><span className="text-muted-foreground">Tarif:</span> <span className="tabular-nums">{formatRupiah(entry.salaryRate)}</span></div>
              <div><span className="text-muted-foreground">Hari Dibayar:</span> {entry.paidDays}</div>
              <div><span className="text-muted-foreground">Gaji Harian:</span> <span className="tabular-nums">{formatRupiah(entry.dailyRate)}</span></div>
            </div>
          </div>

          {/* Status & review */}
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={ENTRY_STATUS_STYLE[entry.status]}>{entry.status}</Badge>
              {entry.needsReview ? <Badge className="bg-warning/15 text-warning border-warning/30"><Flag className="size-3" /> Perlu Review</Badge> : null}
            </div>
            {!isFinalized ? (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { payrollService.toggleReview(entry.id); refresh(); toast.success(entry.needsReview ? "Flag review dihapus" : "Ditandai perlu review"); }}>
                  <Flag className="size-3" /> {entry.needsReview ? "Hapus Flag" : "Tandai Review"}
                </Button>
              </div>
            ) : null}
          </div>

          {/* Komponen gaji */}
          <div className="divide-y divide-border rounded-lg border border-border">
            <Row label="Gaji Dasar" value={formatRupiah(entry.baseSalary)} hint={entry.salaryType === "HARIAN" ? `${entry.paidDays} × ${formatRupiah(entry.dailyRate)}` : "Bulanan"} />
            <Row label="Tunjangan PH" value={formatRupiah(entry.phAllowance)} type="addition" />
            <Row label="Lembur Terverifikasi" value={formatRupiah(entry.overtimeAmount)} type="addition" />
            {entry.bonus > 0 ? <Row label="Bonus" value={formatRupiah(entry.bonus)} type="addition" /> : null}
            {entry.incentive > 0 ? <Row label="Insentif" value={formatRupiah(entry.incentive)} type="addition" /> : null}
            {entry.additions.map((c, i) => (
              <Row key={`add-${i}`} label={`+ ${c.label}${c.note ? ` (${c.note})` : ""}`} value={formatRupiah(c.amount)} type="addition" action={
                !isFinalized ? <button onClick={() => { payrollService.removeComponent(entry.id, "ADDITION", i); refresh(); }} className="text-destructive hover:underline text-[10px]">hapus</button> : undefined
              } />
            ))}
            {entry.kasbon > 0 ? <Row label="Kasbon" value={formatRupiah(entry.kasbon)} type="deduction" /> : null}
            <Row label="Potongan Keterlambatan" value={formatRupiah(entry.lateDeduction)} type="deduction" />
            <Row label="Potongan Tidak Hadir" value={formatRupiah(entry.absenceDeduction)} type="deduction" />
            {entry.otherDeduction > 0 ? <Row label="Potongan Lain" value={formatRupiah(entry.otherDeduction)} type="deduction" /> : null}
            {entry.deductions.map((c, i) => (
              <Row key={`ded-${i}`} label={`- ${c.label}${c.note ? ` (${c.note})` : ""}`} value={formatRupiah(c.amount)} type="deduction" action={
                !isFinalized ? <button onClick={() => { payrollService.removeComponent(entry.id, "DEDUCTION", i); refresh(); }} className="text-destructive hover:underline text-[10px]">hapus</button> : undefined
              } />
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Total Akhir</span>
            <span className="text-xl font-bold tabular-nums text-primary">{formatRupiah(entry.total)}</span>
          </div>

          {!isFinalized ? (
            <Button variant="outline" className="w-full" onClick={() => setAdjOpen(true)}>
              <Plus className="size-4" /> Tambah Adjustment
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-xs text-success">
              <Lock className="size-4" /> Entry telah difinalisasi. Tidak dapat diubah.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>

      {adjOpen ? <AdjustmentDialog entry={entry} onClose={() => { setAdjOpen(false); refresh(); }} /> : null}
    </Dialog>
  );
}

function Row({ label, value, type, hint, action }: { label: string; value: string; type?: "addition" | "deduction"; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div>
        <span className="text-sm text-muted-foreground">{label}</span>
        {hint ? <span className="ml-1 text-[10px] text-muted-foreground/70">({hint})</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm font-medium tabular-nums", type === "addition" ? "text-success" : type === "deduction" ? "text-destructive" : "text-foreground")}>
          {type === "deduction" ? "-" : type === "addition" ? "+" : ""}{value}
        </span>
        {action}
      </div>
    </div>
  );
}

function AdjustmentDialog({ entry, onClose }: { entry: PayrollEntry; onClose: () => void }) {
  const [label, setLabel] = React.useState("");
  const [type, setType] = React.useState<"ADDITION" | "DEDUCTION">("ADDITION");
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string>();

  const save = () => {
    if (!label.trim()) { setError("Label wajib diisi."); return; }
    if (!amount || Number(amount) <= 0) { setError("Nominal harus > 0."); return; }
    const comp: PayrollComponent = { label: label.trim(), type, amount: Number(amount), note: note.trim() || undefined };
    payrollService.addComponent(entry.id, comp);
    toast.success("Adjustment ditambahkan");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Tambah Adjustment</DialogTitle>
          <DialogDescription>{entry.fullName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Jenis">
            <Select value={type} onValueChange={(v) => setType(v as "ADDITION" | "DEDUCTION")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADDITION">Penambah (Bonus, Tunjangan)</SelectItem>
                <SelectItem value="DEDUCTION">Pengurang (Pinjaman, Denda)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Label" required><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Bonus performa" /></Field>
          <Field label="Nominal" required><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="tabular-nums" /></Field>
          <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save}>Tambah</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Helpers
// ============================================================
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
