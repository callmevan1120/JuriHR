"use client";

import * as React from "react";
import { PageHeader, FilterBar } from "@/components/common/page-header";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, selectionColumn } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { EmployeeQuickView } from "@/components/common/employee-quick-view";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  UniversalImportDialog,
  UniversalExportDialog,
  type ImportExportField,
} from "@/components/common/import-export-dialog";
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
import { EmployeeFormPage } from "./employee-form-page";
import { useStore } from "@/hooks/use-store";
import { useRoute } from "@/lib/router/use-route";
import { employeeService, lookupService } from "@/lib/services/master-data";
import { formatRupiah, formatDateMed, initials, cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Employee, EmployeeCategory, EmployeeStatus } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  Upload,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  ArrowRight,
  RefreshCw,
  Sliders,
  Filter,
  MoreVertical,
  Trash2,
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
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; name: string } | null>(null);
  const [selected, setSelected] = React.useState<Employee[]>([]);

  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

  if (formOpen) {
    return (
      <EmployeeFormPage
        mode={formOpen.mode}
        data={formOpen.data}
        onBack={() => setFormOpen(null)}
      />
    );
  }

  if (selectedId) {
    const emp = employees.find((e) => e.id === selectedId);
    if (emp) {
      return (
        <EmployeeDetail
          employee={emp}
          onEdit={() => {}}
          onBack={() => {
            setFormOpen(null);
            window.location.hash = "#/karyawan";
          }}
        />
      );
    }
  }

  const categoryLabels: Record<string, string> = {
    OUTLET: "Karyawan Outlet",
    PH_KLATEN: "Karyawan PH Klaten",
    GUDANG_JAKARTA: "Karyawan Gudang Jakarta",
    NON_OUTLET: "Karyawan HQ",
  };

  const filtered = employees.filter((e) => {
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    return true;
  });

  const columns: ColumnDef<Employee>[] = [
    {
      id: "employee_id",
      header: "ID Karyawan",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="font-mono text-xs font-semibold text-foreground">
            <span className="text-primary font-bold">{e.id}</span>
            <p className="text-[11px] text-muted-foreground font-normal">{e.nik}</p>
          </div>
        );
      },
    },
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
      id: "placement",
      header: "Penempatan Lokasi",
      cell: ({ row }) => {
        const e = row.original;
        if (e.category === "OUTLET") {
          return <span className="text-sm font-medium text-foreground">{lookupService.outletName(e.primaryOutletId)}</span>;
        }
        if (e.category === "PH_KLATEN") return <Badge variant="outline">Pabrik PH Klaten</Badge>;
        if (e.category === "GUDANG_JAKARTA") return <Badge variant="outline">Gudang Jakarta</Badge>;
        return <Badge variant="outline">Head Office (HQ)</Badge>;
      },
    },
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => (
        <Badge
          className={cn(
            row.original.category === "OUTLET"
              ? "bg-primary/15 text-primary-foreground border-primary/30"
              : "bg-info/15 text-info border-info/30",
          )}
        >
          {categoryLabels[row.original.category] || row.original.category}
        </Badge>
      ),
    },
    {
      id: "bank",
      header: "Bank & Rekening",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="text-xs">
            <p className="font-semibold text-foreground">{e.bankName || "—"}</p>
            <p className="font-mono text-muted-foreground text-[11px]">{e.accountNumber || "—"}</p>
          </div>
        );
      },
    },
    {
      id: "salary",
      header: "Gaji",
      cell: ({ row }) => (
        <div className="text-right">
          <p className="tabular-nums text-sm font-semibold text-foreground">
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
          <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
            <EmployeeQuickView employee={e}>
              <div
                role="button"
                tabIndex={0}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                title="Preview cepat di tengah layar"
              >
                <Eye className="size-3.5" />
              </div>
            </EmployeeQuickView>

            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setFormOpen({ mode: "edit", data: e })}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => {
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
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteConfirm({ id: e.id, name: e.fullName })}
              title="Hapus Data Karyawan"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Data Karyawan"
        description="Kelola data karyawan lengkap dengan penempatan cabang/pabrik/gudang, rekening bank, serta histori."
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5 rounded-xl text-xs font-semibold">
                <Upload className="size-3.5 text-primary" /> Import Data
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-1.5 rounded-xl text-xs font-semibold">
                <Download className="size-3.5 text-primary" /> Export Data
              </Button>
              <Button size="sm" onClick={() => setFormOpen({ mode: "create" })} className="gap-1.5 rounded-xl text-xs font-semibold">
                <Plus className="size-3.5" /> Tambah Karyawan
              </Button>
            </div>

            <div className="flex sm:hidden items-center gap-2">
              <Button size="sm" onClick={() => setFormOpen({ mode: "create" })} className="gap-1 rounded-xl text-xs font-semibold">
                <Plus className="size-3.5" /> Tambah
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="size-8 rounded-xl">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setImportOpen(true)} className="gap-2 text-xs">
                    <Upload className="size-3.5 text-primary" /> Import Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExportOpen(true)} className="gap-2 text-xs">
                    <Download className="size-3.5 text-primary" /> Export Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        }
      />

      <FilterBar>
        <Select value={filterOutlet} onValueChange={setFilterOutlet}>
          <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue placeholder="Outlet" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Outlet</SelectItem>
            {outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="OUTLET">Karyawan Outlet</SelectItem>
            <SelectItem value="PH_KLATEN">Karyawan PH Klaten</SelectItem>
            <SelectItem value="GUDANG_JAKARTA">Gudang Jakarta</SelectItem>
            <SelectItem value="NON_OUTLET">Karyawan HQ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="AKTIF">Aktif</SelectItem>
            <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
            <SelectItem value="RESIGN">Resign</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        tableKey="employees"
        columns={[selectionColumn<Employee>(), ...columns] as ColumnDef<Employee>[]}
        data={filtered}
        searchPlaceholder="Cari nama atau NIK..."
        pageSize={10}
        onRowClick={(e) => (window.location.hash = `#/karyawan?id=${e.id}`)}
        globalFilterFn={(row, q) => (row.fullName + " " + row.nik).toLowerCase().includes(q.toLowerCase())}
        bulkActions={(rows) => (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
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

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title="Hapus Data Karyawan?"
        description={`Apakah Anda yakin ingin menghapus data karyawan "${deleteConfirm?.name}"? Data yang dihapus akan dihilangkan dari sistem.`}
        destructive
        confirmLabel="Hapus Karyawan"
        onConfirm={() => {
          if (deleteConfirm) {
            employeeService.delete(deleteConfirm.id);
            toast.success("Data karyawan berhasil dihapus");
          }
        }}
      />

      <UniversalImportDialog
        moduleTitle="Data Karyawan"
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(rows) => {
          const existingNiks = new Set(employeeService.list().map((e) => e.nik));
          const validCategories = ["OUTLET", "PH_KLATEN", "GUDANG_JAKARTA", "NON_OUTLET"];
          let created = 0;
          let skipped = 0;
          for (const row of rows) {
            const nik = row.nik?.trim();
            const fullName = row.fullName?.trim();
            if (!nik || !fullName) { skipped++; continue; }
            if (existingNiks.has(nik)) { skipped++; continue; }
            const category = (row.category?.trim() || "OUTLET") as EmployeeCategory;
            if (!validCategories.includes(category)) { skipped++; continue; }
            const salaryAmount = Number(row.monthlySalary) || 0;
            existingNiks.add(nik);
            employeeService.create({
              nik,
              fullName,
              phone: row.phone?.trim() || "",
              email: "",
              startDate: row.joinDate?.trim() || new Date().toISOString().slice(0, 10),
              category,
              positionId: row.positionId?.trim() || "",
              divisionId: row.divisionId?.trim() || "",
              primaryOutletId: row.primaryOutletId?.trim() || undefined,
              status: "AKTIF",
              salaryType: salaryAmount > 0 ? "BULANAN" : "HARIAN",
              salaryAmount,
              leaveBalanceDays: 12,
              contractType: row.employmentStatus?.trim() || undefined,
              contractEndDate: row.contractEndDate?.trim() || undefined,
              bankName: row.bankName?.trim() || undefined,
              accountNumber: row.bankAccountNumber?.trim() || undefined,
            });
            created++;
          }
          if (skipped > 0) {
            toast.warning(`${created} karyawan berhasil ditambah, ${skipped} baris dilewati (NIK kosong/duplikat atau kategori invalid).`);
          } else {
            toast.success(`${created} karyawan berhasil ditambahkan.`);
          }
        }}
        fields={[
          { key: "nik", label: "NIK (Nomor Induk Karyawan)", priority: "wajib", defaultChecked: true, sampleValue: "JBD0001" },
          { key: "fullName", label: "Nama Lengkap Karyawan", priority: "wajib", defaultChecked: true, sampleValue: "Budi Santoso" },
          { key: "employeeIdNumber", label: "Nomor ID Karyawan", priority: "wajib", defaultChecked: true, sampleValue: "ID-001" },
          { key: "category", label: "Kategori Operasional", priority: "wajib", defaultChecked: true, sampleValue: "OUTLET" },
          { key: "primaryOutletId", label: "ID Outlet Penempatan", priority: "wajib", defaultChecked: true, sampleValue: "out-sudirman" },
          { key: "divisionId", label: "ID Divisi", priority: "wajib", defaultChecked: true, sampleValue: "div-ops" },
          { key: "positionId", label: "ID Posisi / Jabatan", priority: "wajib", defaultChecked: true, sampleValue: "pos-barista" },
          { key: "employmentStatus", label: "Status Kerja (PKWT/PKWTT)", priority: "disarankan", defaultChecked: true, sampleValue: "PKWT" },
          { key: "joinDate", label: "Tanggal Bergabung (YYYY-MM-DD)", priority: "disarankan", defaultChecked: true, sampleValue: "2024-01-15" },
          { key: "contractEndDate", label: "Tanggal Berakhir Kontrak (YYYY-MM-DD)", priority: "disarankan", defaultChecked: true, sampleValue: "2026-01-15" },
          { key: "monthlySalary", label: "Gaji Bulanan (Rp)", priority: "disarankan", defaultChecked: true, sampleValue: "4500000" },
          { key: "bankName", label: "Nama Bank", priority: "opsional", defaultChecked: false, sampleValue: "BCA" },
          { key: "bankAccountNumber", label: "Nomor Rekening Bank", priority: "opsional", defaultChecked: false, sampleValue: "1234567890" },
          { key: "phone", label: "Nomor HP / WhatsApp", priority: "opsional", defaultChecked: false, sampleValue: "08123456789" },
        ]}
      />

      <UniversalExportDialog
        moduleTitle="Data Karyawan"
        open={exportOpen}
        onOpenChange={setExportOpen}
        fields={[
          { key: "nik", label: "NIK", priority: "wajib", defaultChecked: true, sampleValue: "JBD0001" },
          { key: "fullName", label: "Nama Lengkap", priority: "wajib", defaultChecked: true, sampleValue: "Budi Santoso" },
          { key: "employeeIdNumber", label: "Nomor ID", priority: "wajib", defaultChecked: true, sampleValue: "ID-001" },
          { key: "category", label: "Kategori", priority: "wajib", defaultChecked: true, sampleValue: "OUTLET" },
          { key: "employmentStatus", label: "Status Kerja", priority: "disarankan", defaultChecked: true, sampleValue: "PKWT" },
          { key: "joinDate", label: "Tanggal Bergabung", priority: "disarankan", defaultChecked: true, sampleValue: "2024-01-15" },
          { key: "monthlySalary", label: "Gaji Bulanan", priority: "disarankan", defaultChecked: true, sampleValue: "4500000" },
          { key: "status", label: "Status Karyawan", priority: "disarankan", defaultChecked: true, sampleValue: "AKTIF" },
        ]}
        exportData={filtered as any[]}
      />
    </div>
  );
}

