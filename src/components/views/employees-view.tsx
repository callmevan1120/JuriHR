"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, selectionColumn } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmployeeFormDialog } from "@/components/views/employee-form-dialog";
import { EmployeeDetail } from "@/components/views/employee-detail";
import { useStore } from "@/hooks/use-store";
import { useRoute } from "@/lib/router/use-route";
import { employeeService, lookupService } from "@/lib/services/master-data";
import { formatRupiah, formatDateMed, initials, cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Employee, EmployeeCategory, EmployeeStatus, SalaryType } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  Upload,
  Download,
  Users,
  ChevronRight,
  UserCheck,
  UserX,
  UserMinus,
} from "lucide-react";

export function EmployeesView() {
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  const positions = useStore((s) => s.positions);
  const divisions = useStore((s) => s.divisions);
  const route = useRoute();
  const selectedId = route.query.get("id");

  const [filterOutlet, setFilterOutlet] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [formOpen, setFormOpen] = React.useState<{ mode: "create" | "edit"; data?: Employee } | null>(null);
  const [confirm, setConfirm] = React.useState<{ id: string; name: string; action: "deactivate" | "activate" } | null>(null);
  const [selected, setSelected] = React.useState<Employee[]>([]);
  const [importOpen, setImportOpen] = React.useState(false);

  // Detail view jika ada ?id=
  if (selectedId) {
    const emp = employees.find((e) => e.id === selectedId);
    if (emp) {
      return (
        <EmployeeDetail
          employee={emp}
          onEdit={() => setFormOpen({ mode: "edit", data: emp })}
          onBack={() => (window.location.hash = "#/karyawan")}
        />
      );
    }
  }

  const filtered = employees.filter((e) => {
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    return true;
  });

  const columns: ColumnDef<Employee>[] = [
    {
      id: "name",
      header: "Karyawan",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary-foreground">
              {initials(e.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{e.fullName}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{e.nik}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "position",
      header: "Posisi / Divisi",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{lookupService.positionName(e.positionId)}</p>
            <p className="truncate text-[11px] text-muted-foreground">{lookupService.divisionName(e.divisionId)}</p>
          </div>
        );
      },
    },
    {
      id: "outlet",
      header: "Outlet",
      cell: ({ row }) => {
        const name = lookupService.outletName(row.original.primaryOutletId);
        return <span className="text-sm text-foreground">{name}</span>;
      },
    },
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.category}
          label={row.original.category === "OUTLET" ? "Outlet" : "Non-Outlet"}
          className={cn(
            row.original.category === "OUTLET"
              ? "bg-primary/15 text-primary-foreground border-primary/30"
              : "bg-info/15 text-info border-info/30",
          )}
        />
      ),
    },
    {
      id: "salary",
      header: "Gaji",
      cell: ({ row }) => (
        <div className="text-right">
          <p className="tabular-nums text-sm font-medium text-foreground">
            {formatRupiah(row.original.salaryAmount)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {row.original.salaryType === "BULANAN" ? "/bulan" : "/hari"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const e = row.original;
        const active = e.status === "AKTIF";
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(ev) => {
                ev.stopPropagation();
                setFormOpen({ mode: "edit", data: e });
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(ev) => {
                ev.stopPropagation();
                setConfirm({
                  id: e.id,
                  name: e.fullName,
                  action: active ? "deactivate" : "activate",
                });
              }}
              title={active ? "Nonaktifkan" : "Aktifkan kembali"}
            >
              {active ? <PowerOff className="size-3.5 text-warning" /> : <Power className="size-3.5 text-success" />}
            </Button>
          </div>
        );
      },
    },
  ];

  // Stats
  const totalActive = employees.filter((e) => e.status === "AKTIF").length;
  const totalInactive = employees.filter((e) => e.status === "NONAKTIF").length;
  const totalResign = employees.filter((e) => e.status === "RESIGN").length;

  const handleExport = () => {
    const headers = ["NIK", "Nama", "Posisi", "Divisi", "Outlet", "Kategori", "Status", "Tipe Gaji", "Gaji", "Mulai Bekerja"];
    const rows = filtered.map((e) => [
      e.nik,
      e.fullName,
      lookupService.positionName(e.positionId),
      lookupService.divisionName(e.divisionId),
      lookupService.outletName(e.primaryOutletId),
      e.category,
      e.status,
      e.salaryType,
      e.salaryAmount,
      e.startDate,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-karyawan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} karyawan diekspor`);
  };

  const handleImportSim = () => {
    setImportOpen(true);
  };

  const handleDownloadTemplate = () => {
    const headers = ["NIK", "Nama Lengkap", "Telepon", "Email", "Kategori", "Posisi", "Divisi", "Outlet", "Tipe Gaji", "Gaji", "Tanggal Mulai"];
    const csv = headers.join(",") + "\nJBD00001,Contoh Karyawan,081234567890,contoh@juribun.co.id,OUTLET,Barista,Operasional Outlet,JURI Bun — Sudirman,HARIAN,180000,2025-01-01";
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-import-karyawan.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template CSV diunduh");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Karyawan"
        description="Kelola data karyawan lengkap dengan posisi, divisi, outlet, gaji, dan histori."
        actions={
          <>
            <Button variant="outline" onClick={handleImportSim}>
              <Upload className="size-4" /> Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" /> Export
            </Button>
            <Button onClick={() => setFormOpen({ mode: "create" })}>
              <Plus className="size-4" /> Tambah Karyawan
            </Button>
          </>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill icon={Users} label="Total" value={employees.length} color="text-foreground" bg="bg-muted" />
        <StatPill icon={UserCheck} label="Aktif" value={totalActive} color="text-success" bg="bg-success/10" />
        <StatPill icon={UserX} label="Nonaktif" value={totalInactive} color="text-warning" bg="bg-warning/10" />
        <StatPill icon={UserMinus} label="Resign" value={totalResign} color="text-destructive" bg="bg-destructive/10" />
      </div>

      <Card className="border-border shadow-soft">
        <CardContent className="pt-4">
          <DataTable
            columns={[selectionColumn<Employee>(), ...columns] as ColumnDef<Employee>[]}
            data={filtered}
            searchPlaceholder="Cari nama atau NIK..."
            pageSize={10}
            onRowClick={(e) => (window.location.hash = `#/karyawan?id=${e.id}`)}
            globalFilterFn={(row, q) => (row.fullName + " " + row.nik).toLowerCase().includes(q.toLowerCase())}
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterOutlet} onValueChange={setFilterOutlet}>
                  <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Outlet" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Outlet</SelectItem>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="OUTLET">Outlet</SelectItem>
                    <SelectItem value="NON_OUTLET">Non-Outlet</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                    <SelectItem value="RESIGN">Resign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            bulkActions={(rows) => (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const count = employeeService.bulkUpdate(
                      rows.map((r) => r.id),
                      { status: "NONAKTIF" },
                    );
                    toast.success(`${count} karyawan dinonaktifkan`);
                    setSelected([]);
                  }}
                >
                  <PowerOff className="size-3.5" /> Nonaktifkan
                </Button>
              </>
            )}
          />
        </CardContent>
      </Card>

      {formOpen ? (
        <EmployeeFormDialog
          open
          onOpenChange={(o) => !o && setFormOpen(null)}
          mode={formOpen.mode}
          data={formOpen.data}
        />
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === "deactivate" ? "Nonaktifkan karyawan?" : "Aktifkan karyawan kembali?"}
        description={`"${confirm?.name}" akan ${confirm?.action === "deactivate" ? "dinonaktifkan" : "diaktifkan kembali"}.`}
        destructive={confirm?.action === "deactivate"}
        confirmLabel={confirm?.action === "deactivate" ? "Nonaktifkan" : "Aktifkan"}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.action === "deactivate") {
            employeeService.deactivate(confirm.id);
            toast.success("Karyawan dinonaktifkan");
          } else {
            employeeService.reactivate(confirm.id);
            toast.success("Karyawan diaktifkan kembali");
          }
        }}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="size-5 text-primary" /> Import Karyawan (Simulasi)</DialogTitle>
            <DialogDescription>Unggah file CSV untuk menambah karyawan secara massal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-info">
              <p className="font-medium">Format CSV:</p>
              <p className="mt-1 font-mono text-[10px]">NIK, Nama, Telepon, Email, Kategori, Posisi, Divisi, Outlet, Tipe Gaji, Gaji, Tanggal Mulai</p>
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
            <Button variant="outline" onClick={() => setImportOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-border p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", bg, color)}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}
