"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
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
import { useStore } from "@/hooks/use-store";
import {
  contractService,
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
  UniversalImportDialog,
  UniversalExportDialog,
  type ImportExportField,
} from "@/components/common/import-export-dialog";
import {
  FileText,
  CalendarClock,
  RotateCcw,
  Pencil,
  Download,
  FilterX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";

  const REMINDER_BUCKETS = [
  { key: "all", label: "Semua", color: "border border-border/60" },
  { key: "lewat", label: "Lewat Tempo", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "3h", label: "3 hari", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "7h", label: "7 hari", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "14h", label: "14 hari", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { key: "30h", label: "30 hari", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { key: "60h", label: "60 hari", color: "bg-info/10 text-info border-info/30" },
  { key: "90h", label: "90 hari", color: "bg-info/10 text-info border-info/20" },
  { key: "aman", label: "Aman", color: "bg-success/10 text-success border-success/30" },
] as const;

export function ContractsView() {
  const contracts = useStore((s) => s.contracts);
  const employees = useStore((s) => s.employees);

  const [filterBucket, setFilterBucket] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [filterType, setFilterType] = React.useState<string>("all");

  const [extendTarget, setExtendTarget] = React.useState<Contract | null>(null);
  const [editTarget, setEditTarget] = React.useState<Contract | null>(null);

  const today = todayISODate();

  // Hitung distribusi reminder
  const bucketCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    contracts.forEach((c) => {
      const r = contractService.reminderCategory(c.endDate);
      counts.set(r.bucket, (counts.get(r.bucket) ?? 0) + 1);
    });
    return counts;
  }, [contracts]);

  // Filter gabungan terpusat (tanpa kontrol ganda)
  const filteredContracts = React.useMemo(() => {
    return contracts.filter((c) => {
      const r = contractService.reminderCategory(c.endDate);
      if (filterBucket !== "all" && r.bucket !== filterBucket) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (filterType !== "all" && c.type !== filterType) return false;
      return true;
    });
  }, [contracts, filterBucket, filterStatus, filterType]);

  const hasActiveFilters = filterBucket !== "all" || filterStatus !== "all" || filterType !== "all";

  const resetFilters = () => {
    setFilterBucket("all");
    setFilterStatus("all");
    setFilterType("all");
  };

  const columns: ColumnDef<Contract>[] = [
    {
      accessorKey: "contractNo",
      header: "No. Kontrak",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground px-2 py-1 rounded-md border border-border/60">
          {row.original.contractNo}
        </span>
      ),
    },
    {
      id: "employee",
      header: "Karyawan",
      cell: ({ row }) => {
        const emp = employees.find((e) => e.id === row.original.employeeId);
        return emp ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{emp.fullName}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{emp.nik}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Jenis Kontrak",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-semibold text-xs rounded-lg">
          {row.original.type}
        </Badge>
      ),
    },
    {
      id: "periode",
      header: "Masa Berlaku",
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{formatDateMed(row.original.startDate)}</p>
          <p className="text-muted-foreground">s/d {formatDateMed(row.original.endDate)}</p>
        </div>
      ),
    },
    {
      id: "reminder",
      header: "Status Remind Jatuh Tempo",
      cell: ({ row }) => {
        const r = contractService.reminderCategory(row.original.endDate);
        const style =
          r.bucket === "lewat" || r.bucket === "3h" || r.bucket === "7h"
            ? "bg-destructive/10 text-destructive border-destructive/30 font-semibold"
            : r.bucket === "14h" || r.bucket === "30h"
            ? "bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold"
            : r.bucket === "60h" || r.bucket === "90h"
            ? "bg-info/10 text-info border-info/30"
            : "bg-success/10 text-success border-success/30 font-medium";
        return (
          <Badge variant="outline" className={cn("gap-1.5 py-1 px-2.5 rounded-lg text-xs", style)}>
            <CalendarClock className="size-3.5 shrink-0" />
            {r.days < 0 ? `${Math.abs(r.days)} Hari Lewat` : `${r.days} Hari Lagi`}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status Kontrak",
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
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Edit detail kontrak"
            onClick={(e) => {
              e.stopPropagation();
              setEditTarget(row.original);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          {row.original.status !== "DIPERPANJANG" && row.original.status !== "BERAKHIR" ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-primary hover:text-primary hover:bg-primary/10"
              title="Perpanjang masa kontrak"
              onClick={(e) => {
                e.stopPropagation();
                setExtendTarget(row.original);
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const handleExport = () => {
    const headers = ["No Kontrak", "Nama Karyawan", "NIK", "Jenis", "Mulai", "Berakhir", "Status", "Sisa Hari"];
    const rows = filteredContracts.map((c) => {
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
    toast.success(`${rows.length} data kontrak berhasil diekspor`);
  };

  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

  const contractImportFields: ImportExportField[] = [
    { key: "contractNo", label: "Nomor Kontrak Kerja", priority: "wajib", defaultChecked: true, sampleValue: "PKWT/2025/001" },
    { key: "employeeId", label: "NIK / ID Karyawan", priority: "wajib", defaultChecked: true, sampleValue: "JBD0001" },
    { key: "type", label: "Tipe Kontrak (PKWT/PKWTT/PROBATION/MAGANG/HARIAN)", priority: "wajib", defaultChecked: true, sampleValue: "PKWT" },
    { key: "startDate", label: "Tanggal Mulai Kontrak", priority: "wajib", defaultChecked: true, sampleValue: "2025-01-01" },
    { key: "endDate", label: "Tanggal Berakhir Kontrak", priority: "wajib", defaultChecked: true, sampleValue: "2026-01-01" },
    { key: "salaryAmount", label: "Nominal Gaji Kontrak", priority: "disarankan", defaultChecked: true, sampleValue: "4500000" },
    { key: "note", label: "Catatan Kontrak", priority: "opsional", defaultChecked: false, sampleValue: "Perpanjangan tahun ke-2" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kontrak &amp; Monitoring Masa Kerja"
        description="Pantau tanggal jatuh tempo kontrak kerja karyawan JURI Bun secara otomatis."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="gap-1.5 rounded-xl font-semibold border-border/80 text-xs"
            >
              <FileSpreadsheet className="size-4 text-info" /> Import
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportOpen(true)}
              className="gap-1.5 rounded-xl font-semibold border-border/80 text-xs"
            >
              <FileSpreadsheet className="size-4 text-primary" /> Export
            </Button>
          </div>
        }
      />

      {/* Simple horizontal stat row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
        {REMINDER_BUCKETS.map((b) => {
          const count = b.key === "all" ? contracts.length : bucketCounts.get(b.key) ?? 0;
          const active = filterBucket === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setFilterBucket(b.key)}
              className={cn(
                "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
                active ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              <span className={cn("inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold", b.color)}>
                {count}
              </span>
              {b.label}
            </button>
          );
        })}
      </div>

      {/* Main Table */}
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Daftar Kontrak Kerja</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <FilterX className="size-3.5" /> Reset Semua Filter
            </Button>
          )}
        </div>
        <DataTable
          tableKey="contracts"
          columns={columns}
          data={filteredContracts}
          searchPlaceholder="Cari nomor kontrak, NIK, atau nama karyawan..."
          pageSize={10}
          globalFilterFn={(row, q) => {
            const emp = employees.find((e) => e.id === row.employeeId);
            return (row.contractNo + (emp?.fullName ?? "") + (emp?.nik ?? "")).toLowerCase().includes(q.toLowerCase());
          }}
          toolbar={
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 min-w-[140px] text-xs rounded-xl">
                  <SelectValue placeholder="Status Kontrak" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="AKAN_BERAKHIR">Akan Berakhir</SelectItem>
                  <SelectItem value="BERAKHIR">Berakhir</SelectItem>
                  <SelectItem value="DIPERPANJANG">Diperpanjang</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9 min-w-[140px] text-xs rounded-xl">
                  <SelectValue placeholder="Jenis Kontrak" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="PKWT">PKWT</SelectItem>
                  <SelectItem value="PKWTT">PKWTT</SelectItem>
                  <SelectItem value="PROBATION">Probation</SelectItem>
                  <SelectItem value="MAGANG">Magang</SelectItem>
                  <SelectItem value="HARIAN">Harian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          emptyMessage="Tidak ada kontrak yang sesuai dengan filter pencarian."
        />
      </div>

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
      <UniversalImportDialog
        moduleTitle="Data Kontrak Kerja"
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(rows) => {
          const allEmployees = employees;
          const validTypes = ["PROBATION", "PKWT", "PKWTT", "MAGANG", "HARIAN"];
          let created = 0, skipped = 0;
          for (const row of rows) {
            const contractNo = row.contractNo?.trim();
            const nikOrId = row.employeeId?.trim();
            if (!contractNo || !nikOrId) { skipped++; continue; }
            const emp = allEmployees.find((e) => e.nik === nikOrId || e.id === nikOrId);
            if (!emp) { skipped++; continue; }
            const type = (row.type?.trim() || "PKWT") as ContractType;
            if (!validTypes.includes(type)) { skipped++; continue; }
            const startDate = row.startDate?.trim();
            const endDate = row.endDate?.trim();
            if (!startDate || !endDate || startDate >= endDate) { skipped++; continue; }
            contractService.create({
              contractNo,
              employeeId: emp.id,
              type,
              startDate,
              endDate,
              positionId: emp.positionId,
              divisionId: emp.divisionId,
              outletId: emp.primaryOutletId,
              status: "AKTIF",
              decision: "PENDING",
            });
            created++;
          }
          if (skipped > 0) toast.warning(`${created} kontrak ditambah, ${skipped} dilewati (data invalid/employee tidak ditemukan).`);
          else toast.success(`${created} kontrak berhasil ditambahkan.`);
        }}
        fields={contractImportFields}
      />

      <UniversalExportDialog
        moduleTitle="Data Kontrak Kerja"
        open={exportOpen}
        onOpenChange={setExportOpen}
        fields={contractImportFields}
        exportData={filteredContracts}
      />
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
    toast.success(`Kontrak ${emp?.fullName ?? ""} berhasil diperpanjang hingga ${formatDateMed(newEnd)}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-5 text-primary" /> Perpanjang Kontrak Kerja
          </DialogTitle>
          <DialogDescription>
            Kontrak lama akan ditandai DIPERPANJANG dan kontrak baru dibuat sebagai riwayat terpisah.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 p-3 text-xs space-y-1">
            <p className="font-semibold text-foreground">{emp?.fullName}</p>
            <p className="text-muted-foreground">Kontrak lama: {contract.contractNo}</p>
            <p className="text-muted-foreground font-mono">{formatDateMed(contract.startDate)} — {formatDateMed(contract.endDate)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tanggal Mulai Baru</Label>
              <Input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tanggal Berakhir Baru</Label>
              <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Jenis Kontrak Baru</Label>
            <Select value={type} onValueChange={(v) => setType(v as ContractType)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
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
            <Label className="text-xs font-semibold">Catatan Perpanjangan</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" className="rounded-xl" />
          </div>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Batal</Button>
          <Button onClick={submit} className="rounded-xl font-semibold">Perpanjang Kontrak</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Dialog Edit Kontrak
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
    toast.success("Data kontrak berhasil diperbarui");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-primary" /> Edit Status &amp; Keputusan Kontrak
          </DialogTitle>
          <DialogDescription>{contract.contractNo} — {emp?.fullName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status Kontrak</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Contract["status"])}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
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
              <Label className="text-xs font-semibold">Keputusan Manajemen</Label>
              <Select value={decision} onValueChange={(v) => setDecision(v as Contract["decision"])}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
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
            <Label className="text-xs font-semibold font-mono">Hari Kerja Terakhir (Last Working Date)</Label>
            <Input type="date" value={lastWorkingDate} onChange={(e) => setLastWorkingDate(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Catatan Internal</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" className="rounded-xl" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Batal</Button>
          <Button onClick={submit} className="rounded-xl font-semibold">Simpan Perubahan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
