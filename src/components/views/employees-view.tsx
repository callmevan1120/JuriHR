"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/common/import-export-dialog";
import { EmployeeFormPage } from "./employee-form-page";
import { EmployeeDetail } from "@/components/views/employee-detail";
import { useStore } from "@/hooks/use-store";
import { useRoute } from "@/lib/router/use-route";
import { employeeService, lookupService } from "@/lib/services/master-data";
import { formatRupiah, initials } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Employee, EmployeeCategory, EmployeeStatus } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  Eye,
  Upload,
  Download,
  MoreVertical,
  Trash2,
  Search,
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
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [formOpen, setFormOpen] = React.useState<{ mode: "create" | "edit"; data?: Employee } | null>(null);
  const [confirm, setConfirm] = React.useState<{ id: string; name: string; action: "deactivate" | "activate" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ id: string; name: string } | null>(null);
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
    OUTLET: "Outlet",
    PH_KLATEN: "PH Klaten",
    GUDANG_JAKARTA: "Gudang Jakarta",
    NON_OUTLET: "HQ",
  };

  const filtered = employees.filter((e) => {
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    return true;
  });

  const filteredData = filtered.filter((e) =>
    (e.fullName + " " + e.nik).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = employees.filter((e) => e.status === "AKTIF").length;
  const outletCount = employees.filter((e) => e.category === "OUTLET").length;

  const columns: ColumnDef<Employee>[] = [
    {
      id: "name",
      header: "Karyawan",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary-foreground">
              {initials(e.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{e.fullName}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{e.nik}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "position",
      header: "Posisi",
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
      header: "Penempatan",
      cell: ({ row }) => {
        const e = row.original;
        if (e.category === "OUTLET") {
          return <span className="text-sm font-medium text-foreground">{lookupService.outletName(e.primaryOutletId)}</span>;
        }
        return <Badge variant="outline" className="text-[10px]">{categoryLabels[e.category] || e.category}</Badge>;
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
          <p className="text-[10px] text-muted-foreground">
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
          <div className="flex items-center justify-end gap-0.5" onClick={(ev) => ev.stopPropagation()}>
            <EmployeeQuickView employee={e}>
              <div
                role="button"
                tabIndex={0}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                title="Preview"
              >
                <Eye className="size-3.5" />
              </div>
            </EmployeeQuickView>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setFormOpen({ mode: "edit", data: e })}>
              <Pencil className="size-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setConfirm({
                      id: e.id,
                      name: e.fullName,
                      action: active ? "deactivate" : "activate",
                    });
                  }}
                  className="gap-2"
                >
                  {active ? <PowerOff className="size-3.5 text-warning" /> : <Power className="size-3.5 text-success" />}
                  {active ? "Nonaktifkan" : "Aktifkan"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteConfirm({ id: e.id, name: e.fullName })}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Hapus Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <div className="relative w-full sm:w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / NIK..."
              className="h-8 pl-8 text-xs rounded-xl"
            />
          </div>
          <Select value={filterOutlet} onValueChange={setFilterOutlet}>
            <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Semua Outlet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="OUTLET">Outlet</SelectItem>
              <SelectItem value="PH_KLATEN">PH Klaten</SelectItem>
              <SelectItem value="GUDANG_JAKARTA">Gudang Jakarta</SelectItem>
              <SelectItem value="NON_OUTLET">HQ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="AKTIF">Aktif</SelectItem>
              <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
              <SelectItem value="RESIGN">Resign</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">{activeCount} aktif · {filtered.length} tampil</span>
          <Button size="sm" onClick={() => setFormOpen({ mode: "create" })} className="gap-1 rounded-xl text-xs font-semibold h-8">
            <Plus className="size-3.5" /> Tambah
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="size-8 rounded-xl">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setImportOpen(true)} className="gap-2">
                <Upload className="size-3.5" /> Import Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportOpen(true)} className="gap-2">
                <Download className="size-3.5" /> Export Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DataTable
        tableKey="employees"
        columns={[selectionColumn<Employee>(), ...columns] as ColumnDef<Employee>[]}
        data={filteredData}
        searchPlaceholder="Cari nama atau NIK..."
        pageSize={15}
        onRowClick={(e) => (window.location.hash = `#/karyawan?id=${e.id}`)}
        globalFilterFn={(row, q) => (row.fullName + " " + row.nik).toLowerCase().includes(q.toLowerCase())}
        bulkActions={(rows) => (
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
            }}
          >
            <PowerOff className="size-3.5" /> Nonaktifkan
          </Button>
        )}
      />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === "deactivate" ? "Nonaktifkan karyawan?" : "Aktifkan kembali?"}
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
        description={`Yakin ingin menghapus "${deleteConfirm?.name}"? Seluruh data terkait akan dihapus.`}
        destructive
        confirmLabel="Hapus"
        onConfirm={() => {
          if (deleteConfirm) {
            employeeService.delete(deleteConfirm.id);
            toast.success("Data karyawan dihapus");
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
            toast.warning(`${created} ditambah, ${skipped} dilewati.`);
          } else {
            toast.success(`${created} karyawan ditambahkan.`);
          }
        }}
        fields={[
          { key: "nik", label: "NIK", priority: "wajib", defaultChecked: true, sampleValue: "JBD0001" },
          { key: "fullName", label: "Nama Lengkap", priority: "wajib", defaultChecked: true, sampleValue: "Budi Santoso" },
          { key: "category", label: "Kategori", priority: "wajib", defaultChecked: true, sampleValue: "OUTLET" },
          { key: "primaryOutletId", label: "ID Outlet", priority: "wajib", defaultChecked: true, sampleValue: "out-sudirman" },
          { key: "divisionId", label: "ID Divisi", priority: "wajib", defaultChecked: true, sampleValue: "div-ops" },
          { key: "positionId", label: "ID Posisi", priority: "wajib", defaultChecked: true, sampleValue: "pos-barista" },
          { key: "monthlySalary", label: "Gaji (Rp)", priority: "disarankan", defaultChecked: true, sampleValue: "4500000" },
          { key: "phone", label: "No. HP", priority: "opsional", defaultChecked: false, sampleValue: "08123456789" },
        ]}
      />

      <UniversalExportDialog
        moduleTitle="Data Karyawan"
        open={exportOpen}
        onOpenChange={setExportOpen}
        fields={[
          { key: "nik", label: "NIK", priority: "wajib", defaultChecked: true, sampleValue: "JBD0001" },
          { key: "fullName", label: "Nama Lengkap", priority: "wajib", defaultChecked: true, sampleValue: "Budi Santoso" },
          { key: "category", label: "Kategori", priority: "wajib", defaultChecked: true, sampleValue: "OUTLET" },
          { key: "employmentStatus", label: "Status Kerja", priority: "disarankan", defaultChecked: true, sampleValue: "PKWT" },
          { key: "joinDate", label: "Tanggal Bergabung", priority: "disarankan", defaultChecked: true, sampleValue: "2024-01-15" },
          { key: "monthlySalary", label: "Gaji Bulanan", priority: "disarankan", defaultChecked: true, sampleValue: "4500000" },
          { key: "status", label: "Status", priority: "disarankan", defaultChecked: true, sampleValue: "AKTIF" },
        ]}
        exportData={filtered as any[]}
      />
    </div>
  );
}
