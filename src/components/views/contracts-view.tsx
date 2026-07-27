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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useStore } from "@/hooks/use-store";
import {
  contractService,
  lookupService,
} from "@/lib/services/master-data";
import {
  formatDateMed,
  daysBetween,
  todayISODate,
  cn,
} from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Contract, ContractType } from "@/lib/types";
import { toast } from "sonner";
import {
  FileText,
  Search,
  CalendarClock,
  AlertTriangle,
  RotateCcw,
  Pencil,
  Download,
  TrendingDown,
  CalendarX,
} from "lucide-react";

const REMINDER_BUCKETS = [
  { key: "all", label: "Semua", color: "" },
  { key: "lewat", label: "Lewat Jatuh Tempo", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "3h", label: "≤ 3 hari", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "7h", label: "≤ 7 hari", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "14h", label: "≤ 14 hari", color: "bg-warning/10 text-warning border-warning/30" },
  { key: "30h", label: "≤ 30 hari", color: "bg-warning/10 text-warning border-warning/30" },
  { key: "60h", label: "≤ 60 hari", color: "bg-info/10 text-info border-info/30" },
  { key: "90h", label: "≤ 90 hari", color: "bg-info/10 text-info border-info/30" },
  { key: "aman", label: "Aman (>90 hari)", color: "bg-success/10 text-success border-success/30" },
] as const;

export function ContractsView() {
  const contracts = useStore((s) => s.contracts);
  const employees = useStore((s) => s.employees);
  const [filterBucket, setFilterBucket] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [extendTarget, setExtendTarget] = React.useState<Contract | null>(null);
  const [editTarget, setEditTarget] = React.useState<Contract | null>(null);

  // Hitung distribusi reminder
  const today = todayISODate();
  const bucketCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    contracts.forEach((c) => {
      const r = contractService.reminderCategory(c.endDate);
      counts.set(r.bucket, (counts.get(r.bucket) ?? 0) + 1);
    });
    return counts;
  }, [contracts]);

  // Filter
  const filtered = contracts.filter((c) => {
    const r = contractService.reminderCategory(c.endDate);
    if (filterBucket !== "all" && r.bucket !== filterBucket) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    const emp = employees.find((e) => e.id === c.employeeId);
    if (search) {
      const hay = `${c.contractNo} ${emp?.fullName ?? ""} ${emp?.nik ?? ""}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const columns: ColumnDef<Contract>[] = [
    {
      accessorKey: "contractNo",
      header: "No. Kontrak",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-foreground">{row.original.contractNo}</span>
      ),
    },
    {
      id: "employee",
      header: "Karyawan",
      cell: ({ row }) => {
        const emp = employees.find((e) => e.id === row.original.employeeId);
        return emp ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{emp.fullName}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{emp.nik}</p>
          </div>
        ) : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "type",
      header: "Jenis",
      cell: ({ row }) => <span className="text-sm">{row.original.type}</span>,
    },
    {
      id: "periode",
      header: "Periode",
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="text-foreground">{formatDateMed(row.original.startDate)}</p>
          <p className="text-muted-foreground">s/d {formatDateMed(row.original.endDate)}</p>
        </div>
      ),
    },
    {
      id: "reminder",
      header: "Reminder",
      cell: ({ row }) => {
        const r = contractService.reminderCategory(row.original.endDate);
        const style =
          r.bucket === "lewat" || r.bucket === "3h" || r.bucket === "7h"
            ? "bg-destructive/10 text-destructive border-destructive/30"
            : r.bucket === "14h" || r.bucket === "30h"
            ? "bg-warning/10 text-warning border-warning/30"
            : r.bucket === "60h" || r.bucket === "90h"
            ? "bg-info/10 text-info border-info/30"
            : "bg-success/10 text-success border-success/30";
        return (
          <Badge variant="outline" className={style}>
            <CalendarClock className="size-3" />
            {r.days < 0 ? `${Math.abs(r.days)}h lewat` : `${r.days}h lagi`}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            title="Edit kontrak"
            onClick={(e) => { e.stopPropagation(); setEditTarget(row.original); }}
          >
            <Pencil className="size-3.5" />
          </Button>
          {row.original.status !== "DIPERPANJANG" && row.original.status !== "BERAKHIR" ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-primary"
              title="Perpanjang kontrak"
              onClick={(e) => { e.stopPropagation(); setExtendTarget(row.original); }}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const handleExport = () => {
    const headers = ["No Kontrak", "Karyawan", "NIK", "Jenis", "Mulai", "Berakhir", "Status", "Sisa Hari"];
    const rows = filtered.map((c) => {
      const emp = employees.find((e) => e.id === c.employeeId);
      const r = contractService.reminderCategory(c.endDate);
      return [c.contractNo, emp?.fullName ?? "", emp?.nik ?? "", c.type, c.startDate, c.endDate, c.status, String(r.days)];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring-kontrak-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} kontrak diekspor`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kontrak & Monitoring"
        description="Pantau jatuh tempo kontrak (90/60/30/14/7/3 hari) dan perpanjang kontrak dengan histori."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" /> Export
          </Button>
        }
      />

      {/* Reminder bucket summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {REMINDER_BUCKETS.slice(1).map((b) => {
          const count = bucketCounts.get(b.key) ?? 0;
          const active = filterBucket === b.key;
          return (
            <button
              key={b.key}
              onClick={() => setFilterBucket(active ? "all" : b.key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-soft",
                active ? "border-primary ring-2 ring-primary/20" : "border-border",
              )}
            >
              <span className={cn("inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold", b.color)}>
                {count}
              </span>
              <span className="text-[10px] font-medium leading-tight text-muted-foreground">{b.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter + table */}
      <Card className="border-border shadow-soft">
        <CardContent className="pt-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kontrak/karyawan..." className="pl-8" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="AKAN_BERAKHIR">Akan Berakhir</SelectItem>
                <SelectItem value="BERAKHIR">Berakhir</SelectItem>
                <SelectItem value="DIPERPANJANG">Diperpanjang</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            {filterBucket !== "all" ? (
              <Button variant="ghost" size="sm" onClick={() => setFilterBucket("all")}>
                Reset filter reminder
              </Button>
            ) : null}
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Cari..."
            pageSize={10}
            globalFilterFn={() => true}
            emptyMessage="Tidak ada kontrak pada filter ini."
          />
        </CardContent>
      </Card>

      {extendTarget ? (
        <ExtendDialog
          contract={extendTarget}
          onClose={() => setExtendTarget(null)}
        />
      ) : null}

      {editTarget ? (
        <EditDialog
          contract={editTarget}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------
// Dialog Perpanjang Kontrak
// ------------------------------------------------------------
function ExtendDialog({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const emp = employees.find((e) => e.id === contract.employeeId);
  const [newStart, setNewStart] = React.useState(contract.endDate);
  const [newEnd, setNewEnd] = React.useState("");
  const [type, setType] = React.useState<ContractType>(contract.type === "PROBATION" ? "PKWT" : contract.type);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    // Default end = +1 year from new start
    if (newStart) {
      const d = new Date(newStart);
      d.setFullYear(d.getFullYear() + 1);
      setNewEnd(d.toISOString().slice(0, 10));
    }
  }, [newStart]);

  const submit = () => {
    if (!newStart || !newEnd) {
      setError("Tanggal mulai & berakhir wajib diisi.");
      return;
    }
    if (daysBetween(newStart, newEnd) <= 0) {
      setError("Tanggal berakhir harus setelah tanggal mulai.");
      return;
    }
    contractService.extend(contract.id, { newStartDate: newStart, newEndDate: newEnd, type, note: note.trim() || undefined });
    toast.success(`Kontrak ${emp?.fullName ?? ""} diperpanjang hingga ${formatDateMed(newEnd)}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-5 text-primary" /> Perpanjang Kontrak
          </DialogTitle>
          <DialogDescription>
            Kontrak lama akan ditandai DIPERPANJANG dan kontrak baru dibuat sebagai histori terpisah.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
            <p className="font-medium text-foreground">{emp?.fullName}</p>
            <p className="text-muted-foreground">Kontrak lama: {contract.contractNo}</p>
            <p className="text-muted-foreground">{formatDateMed(contract.startDate)} — {formatDateMed(contract.endDate)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Mulai Baru</Label>
              <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Berakhir Baru</Label>
              <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Jenis Kontrak Baru</Label>
            <Select value={type} onValueChange={(v) => setType(v as ContractType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PROBATION">Probation</SelectItem>
                <SelectItem value="PKWT">PKWT</SelectItem>
                <SelectItem value="PKWTT">PKWTT</SelectItem>
                <SelectItem value="MAGANG">Magang</SelectItem>
                <SelectItem value="HARIAN">Harian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Catatan Perpanjangan</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
          </div>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit}>Perpanjang Kontrak</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Dialog Edit Kontrak (status, decision, last working date, note)
// ------------------------------------------------------------
function EditDialog({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const emp = employees.find((e) => e.id === contract.employeeId);
  const [status, setStatus] = React.useState(contract.status);
  const [decision, setDecision] = React.useState(contract.decision);
  const [lastWorkingDate, setLastWorkingDate] = React.useState(contract.lastWorkingDate ?? "");
  const [note, setNote] = React.useState(contract.note ?? "");

  const submit = () => {
    contractService.update(contract.id, {
      status,
      decision,
      lastWorkingDate: lastWorkingDate || undefined,
      note: note.trim() || undefined,
    });
    toast.success("Kontrak diperbarui");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-primary" /> Edit Kontrak
          </DialogTitle>
          <DialogDescription>{contract.contractNo} — {emp?.fullName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Contract["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="AKAN_BERAKHIR">Akan Berakhir</SelectItem>
                  <SelectItem value="BERAKHIR">Berakhir</SelectItem>
                  <SelectItem value="DIPERPANJANG">Diperpanjang</SelectItem>
                  <SelectItem value="DITOLAK">Ditolak</SelectItem>
                  <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Keputusan</Label>
              <Select value={decision} onValueChange={(v) => setDecision(v as Contract["decision"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PERPANJANG">Perpanjang</SelectItem>
                  <SelectItem value="TIDAK_DIPERPANJANG">Tidak Diperpanjang</SelectItem>
                  <SelectItem value="KONVERSI">Konversi</SelectItem>
                  <SelectItem value="RESIGN">Resign</SelectItem>
                  <SelectItem value="PHK">PHK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Last Working Date</Label>
            <Input type="date" value={lastWorkingDate} onChange={(e) => setLastWorkingDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Catatan</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
