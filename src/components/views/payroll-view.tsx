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
import { DataTable, selectionColumn } from "@/components/common/data-table";
import { useStore } from "@/hooks/use-store";
import { useRoute } from "@/lib/router/use-route";
import { payrollService } from "@/lib/services/finance";
import { getStore } from "@/lib/data/store";
import { lookupService } from "@/lib/services/master-data";
import {
  formatRupiah,
  formatDateMed,
  todayISODate,
  cn,
  initials,
  monthLabel,
} from "@/lib/utils";
import type { PayrollComponent, PayrollEntry, PayrollStatus } from "@/lib/types";
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
  Pencil,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  Eye,
} from "lucide-react";

const STATUS_FLOW: Record<PayrollStatus, string> = {
  DRAFT: "Draft",
  REVIEWED: "Reviewed",
  FINALIZED: "Finalized",
};

export function PayrollView() {
  const route = useRoute();
  const initialFilter = route.query.get("filter") ?? "all";
  const [period, setPeriod] = React.useState(todayISODate().slice(0, 7));
  const [filterOutlet, setFilterOutlet] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>(initialFilter);
  const [detailTarget, setDetailTarget] = React.useState<PayrollEntry | null>(null);
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<PayrollEntry[]>([]);

  const payrolls = useStore((s) => s.payrolls);
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);

  const periodEntries = payrolls.filter((p) => p.period === period);
  const filtered = periodEntries.filter((p) => {
    const emp = employees.find((e) => e.id === p.employeeId);
    if (filterOutlet !== "all" && emp?.primaryOutletId !== filterOutlet) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const totals = {
    count: filtered.length,
    draft: filtered.filter((p) => p.status === "DRAFT").length,
    reviewed: filtered.filter((p) => p.status === "REVIEWED").length,
    finalized: filtered.filter((p) => p.status === "FINALIZED").length,
    grandTotal: filtered.reduce((s, p) => s + p.total, 0),
    totalOvertime: filtered.reduce((s, p) => s + p.overtimeAmount, 0),
    totalDeduction: filtered.reduce((s, p) => s + p.lateDeduction + p.absenceDeduction, 0),
  };

  const handleExportCSV = () => {
    const csv = payrollService.exportCSV(period);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payroll diekspor (CSV)");
  };

  const handleExportExcel = () => {
    // Excel-compatible: CSV dengan ekstensi .xls
    const csv = payrollService.exportCSV(period);
    const blob = new Blob(["\ufeff" + csv], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${period}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payroll diekspor (Excel)");
  };

  const handlePrint = () => {
    window.print();
    toast.info("Gunakan opsi 'Save as PDF' pada dialog cetak.");
  };

  const columns: ColumnDef<PayrollEntry>[] = [
    {
      id: "name",
      header: "Karyawan",
      cell: ({ row }) => {
        const emp = employees.find((e) => e.id === row.original.employeeId);
        return emp ? (
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">{initials(emp.fullName)}</div>
            <div><p className="text-sm font-medium">{emp.fullName}</p><p className="font-mono text-[10px] text-muted-foreground">{emp.nik}</p></div>
          </div>
        ) : <span>—</span>;
      },
    },
    {
      id: "outlet",
      header: "Outlet",
      cell: ({ row }) => {
        const emp = employees.find((e) => e.id === row.original.employeeId);
        return <span className="text-sm">{lookupService.outletName(emp?.primaryOutletId)}</span>;
      },
    },
    { accessorKey: "baseSalary", header: "Gaji Dasar", cell: ({ row }) => <span className="tabular-nums">{formatRupiah(row.original.baseSalary)}</span> },
    { accessorKey: "overtimeAmount", header: "Lembur", cell: ({ row }) => <span className="tabular-nums text-success">{formatRupiah(row.original.overtimeAmount)}</span> },
    {
      id: "deduction",
      header: "Potongan",
      cell: ({ row }) => <span className="tabular-nums text-destructive">{formatRupiah(row.original.lateDeduction + row.original.absenceDeduction)}</span>,
    },
    { accessorKey: "total", header: "Total", cell: ({ row }) => <span className="font-semibold tabular-nums">{formatRupiah(row.original.total)}</span> },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <PayrollStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); setDetailTarget(row.original); }}>
            <Eye className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payroll Preview"
        description={`Periode ${monthLabel(period)} — generate, review, finalize, dan export.`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handlePrint}><FileText className="size-4" /> PDF</Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}><FileSpreadsheet className="size-4" /> Excel</Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="size-4" /> CSV</Button>
            <Button size="sm" onClick={() => setGenerateOpen(true)}><Wand2 className="size-4" /> Generate</Button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard label="Total Entri" value={String(totals.count)} icon={Wallet} color="text-foreground" bg="bg-muted" />
        <SummaryCard label="Draft" value={String(totals.draft)} icon={FileText} color="text-muted-foreground" bg="bg-muted/50" />
        <SummaryCard label="Reviewed" value={String(totals.reviewed)} icon={Eye} color="text-info" bg="bg-info/10" />
        <SummaryCard label="Finalized" value={String(totals.finalized)} icon={Lock} color="text-success" bg="bg-success/10" />
        <SummaryCard label="Grand Total" value={formatRupiah(totals.grandTotal)} icon={TrendingUp} color="text-primary" bg="bg-primary/10" />
      </div>

      {/* Filter bar */}
      <Card className="border-border shadow-soft">
        <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" />
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-[150px]" />
          </div>
          <Select value={filterOutlet} onValueChange={setFilterOutlet}>
            <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="Outlet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="FINALIZED">Finalized</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2 text-xs">
            <Badge className="bg-success/15 text-success border-success/30">Lembur: {formatRupiah(totals.totalOvertime)}</Badge>
            <Badge className="bg-destructive/10 text-destructive border-destructive/30">Potongan: {formatRupiah(totals.totalDeduction)}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border shadow-soft">
        <CardContent className="pt-4">
          <DataTable
            columns={[selectionColumn<PayrollEntry>(), ...columns] as ColumnDef<PayrollEntry>[]}
            data={filtered}
            searchPlaceholder="Cari karyawan..."
            pageSize={10}
            onRowClick={(p) => setDetailTarget(p)}
            globalFilterFn={(row, q) => {
              const emp = employees.find((e) => e.id === row.employeeId);
              return `${emp?.fullName ?? ""} ${emp?.nik ?? ""}`.toLowerCase().includes(q.toLowerCase());
            }}
            emptyMessage="Belum ada payroll. Klik Generate untuk membuat preview."
            bulkActions={(rows) => (
              <>
                {rows.every((r) => r.status === "DRAFT") ? (
                  <Button size="sm" variant="outline" onClick={() => {
                    const n = payrollService.bulkSetStatus(rows.map((r) => r.id), "REVIEWED");
                    toast.success(`${n} payroll di-review`);
                    setSelected([]);
                  }}><Eye className="size-3.5" /> Tandai Reviewed</Button>
                ) : null}
                {rows.every((r) => r.status === "REVIEWED") ? (
                  <Button size="sm" onClick={() => {
                    const n = payrollService.bulkSetStatus(rows.map((r) => r.id), "FINALIZED");
                    toast.success(`${n} payroll difinalisasi`);
                    setSelected([]);
                  }}><Lock className="size-3.5" /> Finalize</Button>
                ) : null}
              </>
            )}
          />
        </CardContent>
      </Card>

      {generateOpen ? <GenerateDialog period={period} onClose={() => setGenerateOpen(false)} /> : null}
      {detailTarget ? <DetailDialog entry={detailTarget} onClose={() => setDetailTarget(null)} /> : null}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: typeof Wallet; color: string; bg: string }) {
  return (
    <Card className="border-border p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", bg, color)}><Icon className="size-4" /></div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold tabular-nums text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const map: Record<PayrollStatus, string> = {
    DRAFT: "bg-muted text-muted-foreground border-border",
    REVIEWED: "bg-info/15 text-info border-info/30",
    FINALIZED: "bg-success/15 text-success border-success/30",
  };
  return <Badge variant="outline" className={map[status]}>{STATUS_FLOW[status]}</Badge>;
}

// ------------------------------------------------------------
// Generate Dialog
// ------------------------------------------------------------
function GenerateDialog({ period, onClose }: { period: string; onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const [scope, setScope] = React.useState<"all" | "outlet">("all");
  const [outletId, setOutletId] = React.useState("");

  const run = () => {
    const empIds = scope === "all" ? undefined : employees.filter((e) => e.primaryOutletId === outletId && e.status === "AKTIF").map((e) => e.id);
    const count = payrollService.generatePreview(period, empIds);
    toast.success(`${count} payroll preview digenerate`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="size-5 text-primary" /> Generate Payroll Preview</DialogTitle>
          <DialogDescription>Periode {monthLabel(period)}. Membaca gaji dasar, PH, lembur terverifikasi, potongan keterlambatan & ketidakhadiran.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Scope">
            <Select value={scope} onValueChange={(v) => setScope(v as "all" | "outlet")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Karyawan Aktif</SelectItem>
                <SelectItem value="outlet">Per Outlet</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {scope === "outlet" ? (
            <Field label="Outlet">
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {getStore().getState().outlets.filter((o) => o.status === "active").map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-info">
            <p className="font-medium">Catatan:</p>
            <p>• Payroll yang sudah FINALIZED tidak akan ditimpa.</p>
            <p>• Komponen adjustment manual dipertahankan.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={run}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Detail Dialog (rincian + adjustment)
// ------------------------------------------------------------
function DetailDialog({ entry, onClose }: { entry: PayrollEntry; onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const emp = employees.find((e) => e.id === entry.employeeId);
  const [adjOpen, setAdjOpen] = React.useState(false);
  const [confirmFinalize, setConfirmFinalize] = React.useState(false);
  const additions = entry.additions.reduce((s, c) => s + c.amount, 0);
  const deductions = entry.deductions.reduce((s, c) => s + c.amount, 0);
  const isFinalized = entry.status === "FINALIZED";

  const refresh = () => {
    const updated = payrollService.get(entry.id);
    if (updated) Object.assign(entry, updated);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wallet className="size-5 text-primary" /> Rincian Payroll</DialogTitle>
          <DialogDescription>{emp?.fullName} · {monthLabel(entry.period)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Status flow */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              <PayrollStatusBadge status={entry.status} />
              {!isFinalized ? (
                <div className="flex gap-1">
                  {entry.status === "DRAFT" ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { payrollService.setStatus(entry.id, "REVIEWED"); refresh(); toast.success("Status: Reviewed"); }}>
                      <Eye className="size-3" /> Review
                    </Button>
                  ) : null}
                  {entry.status === "REVIEWED" ? (
                    <Button size="sm" className="h-7 text-xs" onClick={() => setConfirmFinalize(true)}>
                      <Lock className="size-3" /> Finalize
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Komponen gaji */}
          <div className="divide-y divide-border rounded-lg border border-border">
            <Row label="Gaji Dasar" value={formatRupiah(entry.baseSalary)} />
            <Row label={`PH (${entry.phCount} hari)`} value={formatRupiah(entry.phDeduction)} type="deduction" />
            <Row label="Lembur Terverifikasi" value={formatRupiah(entry.overtimeAmount)} type="addition" />
            {entry.additions.map((c, i) => (
              <Row key={`add-${i}`} label={`+ ${c.label}${c.note ? ` (${c.note})` : ""}`} value={formatRupiah(c.amount)} type="addition" action={
                !isFinalized ? <button onClick={() => { payrollService.removeComponent(entry.id, "ADDITION", i); refresh(); }} className="text-destructive hover:underline text-[10px]">hapus</button> : undefined
              } />
            ))}
            {entry.deductions.map((c, i) => (
              <Row key={`ded-${i}`} label={`- ${c.label}${c.note ? ` (${c.note})` : ""}`} value={formatRupiah(c.amount)} type="deduction" action={
                !isFinalized ? <button onClick={() => { payrollService.removeComponent(entry.id, "DEDUCTION", i); refresh(); }} className="text-destructive hover:underline text-[10px]">hapus</button> : undefined
              } />
            ))}
            <Row label="Potongan Keterlambatan" value={formatRupiah(entry.lateDeduction)} type="deduction" />
            <Row label="Potongan Ketidakhadiran" value={formatRupiah(entry.absenceDeduction)} type="deduction" />
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
              <Lock className="size-4" /> Payroll telah difinalisasi. Tidak dapat diubah.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>

      {adjOpen ? <AdjustmentDialog entry={entry} onClose={() => { setAdjOpen(false); refresh(); }} /> : null}
      <ConfirmDialog
        open={confirmFinalize}
        onOpenChange={setConfirmFinalize}
        title="Finalisasi payroll?"
        description="Payroll yang difinalisasi tidak dapat diubah lagi."
        confirmLabel="Finalize"
        onConfirm={() => {
          try {
            payrollService.setStatus(entry.id, "FINALIZED");
            refresh();
            toast.success("Payroll difinalisasi");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Gagal");
          }
        }}
      />
    </Dialog>
  );
}

function Row({ label, value, type, action }: { label: string; value: string; type?: "addition" | "deduction"; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
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
          <DialogDescription>{lookupService.employeeName(entry.employeeId)} · {monthLabel(entry.period)}</DialogDescription>
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
