"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  UserCheck,
  UserX,
  UserMinus,
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

  // Dialog State ERPNext Style
  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

  // Render Dedicated Full-Page Form ERPNext Style
  if (formOpen) {
    return (
      <EmployeeFormPage
        mode={formOpen.mode}
        data={formOpen.data}
        onBack={() => setFormOpen(null)}
      />
    );
  }

  // Detail view jika ada ?id=
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
            <p className="font-semibold text-foreground">{e.bankName || "BCA"}</p>
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
            {/* REVISI ITEM 3: Fix Preview Cepat Trigger Click */}
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

  // Stats
  const totalActive = employees.filter((e) => e.status === "AKTIF").length;
  const totalInactive = employees.filter((e) => e.status === "NONAKTIF").length;
  const totalResign = employees.filter((e) => e.status === "RESIGN").length;

  return (
    <div className="space-y-5">
      {/* Header dengan Responsive & Collapsible Buttons */}
      <PageHeader
        title="Data Karyawan"
        description="Kelola data karyawan lengkap dengan penempatan cabang/pabrik/gudang, rekening bank, serta histori."
        actions={
          <div className="flex items-center gap-2">
            {/* Tampilan Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-1.5 text-xs">
                <Upload className="size-3.5 text-primary" /> Import Data
              </Button>
              <Button variant="outline" onClick={() => setExportOpen(true)} className="gap-1.5 text-xs">
                <Download className="size-3.5 text-primary" /> Export Data
              </Button>
              <Button onClick={() => setFormOpen({ mode: "create" })} className="gap-1.5 text-xs">
                <Plus className="size-3.5" /> Tambah Karyawan
              </Button>
            </div>

            {/* Tampilan Mobile Collapsible Menu */}
            <div className="flex sm:hidden items-center gap-2">
              <Button size="sm" onClick={() => setFormOpen({ mode: "create" })} className="gap-1 text-xs">
                <Plus className="size-3.5" /> Tambah
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="size-8">
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill icon={Users} label="Total Karyawan" value={employees.length} color="text-foreground" bg="bg-muted" />
        <StatPill icon={UserCheck} label="Karyawan Aktif" value={totalActive} color="text-success" bg="bg-success/10" />
        <StatPill icon={UserX} label="Nonaktif" value={totalInactive} color="text-warning" bg="bg-warning/10" />
        <StatPill icon={UserMinus} label="Resign" value={totalResign} color="text-destructive" bg="bg-destructive/10" />
      </div>

      <Card className="border-border shadow-soft">
        <CardContent className="pt-4">
          <DataTable
            tableKey="employees"
            columns={[selectionColumn<Employee>(), ...columns] as ColumnDef<Employee>[]}
            data={filtered}
            searchPlaceholder="Cari nama atau NIK..."
            pageSize={10}
            onRowClick={(e) => (window.location.hash = `#/karyawan?id=${e.id}`)}
            globalFilterFn={(row, q) => (row.fullName + " " + row.nik).toLowerCase().includes(q.toLowerCase())}
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterOutlet} onValueChange={setFilterOutlet}>
                  <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Outlet" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Outlet</SelectItem>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="OUTLET">Karyawan Outlet</SelectItem>
                    <SelectItem value="PH_KLATEN">Karyawan PH Klaten</SelectItem>
                    <SelectItem value="GUDANG_JAKARTA">Gudang Jakarta</SelectItem>
                    <SelectItem value="NON_OUTLET">Karyawan HQ</SelectItem>
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

      {/* Dialog Import ERPNext Style */}
      <EmployeeImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Dialog Export ERPNext Style */}
      <EmployeeExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        filteredEmployees={filtered}
        allEmployees={employees}
      />
    </div>
  );
}

// ------------------------------------------------------------
// ERPNext-Style Import Dialog Component
// ------------------------------------------------------------
function EmployeeImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const outlets = useStore((s) => s.outlets);
  const [fileFormat, setFileFormat] = React.useState<"excel" | "csv">("excel");
  const [step, setStep] = React.useState<"upload" | "mapping">("upload");
  const [fileName, setFileName] = React.useState<string>();
  const [isImporting, setIsImporting] = React.useState(false);

  const [importTargetOutlet, setImportTargetOutlet] = React.useState("all");
  const [importTargetCategory, setImportTargetCategory] = React.useState("all");

  const ALL_IMPORT_FIELDS = [
    { key: "nik", label: "ID / NIK Karyawan", priority: "wajib", defaultChecked: true },
    { key: "fullName", label: "Nama Lengkap", priority: "wajib", defaultChecked: true },
    { key: "email", label: "Email (Login / SSO)", priority: "disarankan", defaultChecked: true },
    { key: "birthDate", label: "Tanggal Lahir", priority: "disarankan", defaultChecked: true },
    { key: "phone", label: "Nomor WhatsApp", priority: "disarankan", defaultChecked: true },
    { key: "category", label: "Kategori Operasional", priority: "wajib", defaultChecked: true },
    { key: "positionId", label: "Posisi Jabatan", priority: "wajib", defaultChecked: true },
    { key: "divisionId", label: "Divisi Departemen", priority: "wajib", defaultChecked: true },
    { key: "primaryOutletId", label: "Outlet Utama", priority: "wajib", defaultChecked: true },
    { key: "bankName", label: "Nama Bank", priority: "disarankan", defaultChecked: true },
    { key: "accountNumber", label: "Nomor Rekening Bank", priority: "disarankan", defaultChecked: true },
    { key: "accountHolderName", label: "Atas Nama Rekening", priority: "disarankan", defaultChecked: true },
    { key: "contractType", label: "Tipe Kontrak", priority: "wajib", defaultChecked: true },
    { key: "contractDurationMonths", label: "Durasi Kontrak (Bulan)", priority: "disarankan", defaultChecked: true },
    { key: "startDate", label: "Tanggal Bergabung", priority: "wajib", defaultChecked: true },
    { key: "salaryAmount", label: "Nominal Gaji", priority: "disarankan", defaultChecked: true },
    { key: "homeAddress", label: "Alamat Rumah", priority: "opsional", defaultChecked: false },
    { key: "mapsUrl", label: "Link Google Maps", priority: "opsional", defaultChecked: false },
  ];

  const [selectedImportColumns, setSelectedImportColumns] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ALL_IMPORT_FIELDS.forEach((f) => {
      init[f.key] = f.defaultChecked;
    });
    return init;
  });

  const toggleImportAll = (check: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_IMPORT_FIELDS.forEach((f) => {
      updated[f.key] = check;
    });
    setSelectedImportColumns(updated);
  };

  const handleDownloadTemplate = () => {
    const activeFields = ALL_IMPORT_FIELDS.filter((f) => selectedImportColumns[f.key]);
    const headers = activeFields.map((f) => f.label);
    const sampleRow = activeFields.map((f) => {
      switch (f.key) {
        case "nik": return "JBD00099";
        case "fullName": return "Budi Santoso";
        case "email": return "budi.santoso@juribun.co.id";
        case "birthDate": return "1998-05-20";
        case "phone": return "081299887766";
        case "category": return "OUTLET";
        case "positionId": return "Barista";
        case "divisionId": return "Operasional Outlet";
        case "primaryOutletId": return "JURI Bun — Sudirman";
        case "bankName": return "BCA";
        case "accountNumber": return "8830918273";
        case "accountHolderName": return "Budi Santoso";
        case "contractType": return "PKWT";
        case "contractDurationMonths": return "12";
        case "startDate": return "2025-01-15";
        case "salaryAmount": return "180000";
        case "homeAddress": return "Jl. Sudirman No 45, Jakarta";
        case "mapsUrl": return "https://maps.google.com/?q=-6.19,106.82";
        default: return "";
      }
    });

    if (fileFormat === "excel") {
      // Format HTML Table Web Archive untuk Excel (.xls) — Bebas Peringatan Corrupt Excel!
      const htmlTable = `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Template Import</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table>
<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
<tbody><tr>${sampleRow.map((s) => `<td>${s}</td>`).join("")}</tr></tbody>
</table>
</body>
</html>`;

      const blob = new Blob([htmlTable], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_import_karyawan.xls";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csvContent = [headers.join(","), sampleRow.map((c) => `"${c}"`).join(",")].join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_import_karyawan.csv";
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`Template ${fileFormat.toUpperCase()} diunduh (${activeFields.length} kolom dipilih)!`);
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setStep("mapping");
    }
  };

  const handleExecuteImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      onOpenChange(false);
      setStep("upload");
      toast.success("Import data karyawan dari file spreadsheet berhasil dipproses!");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Upload className="size-5 text-primary" /> Import Data Karyawan (ERPNext Style)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pilih kolom mana saja yang ingin di-import, tentukan filter target, dan unduh template kustom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Section Filter & Formats ERPNext */}
          <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">1. Pilih Kolom &amp; Format Template</span>
                <p className="text-[11px] text-muted-foreground">Unduh template file spreadsheet sesuai kolom pilihan Anda.</p>
              </div>

              <div className="flex items-center gap-2">
                <Select value={fileFormat} onValueChange={(v) => setFileFormat(v as any)}>
                  <SelectTrigger className="h-8 w-28 bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xls)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="h-8 gap-1.5 text-xs">
                  <Download className="size-3.5 text-primary" /> Download
                </Button>
              </div>
            </div>

            {/* Filter Target ERPNext Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-primary/10">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Filter Target Kategori:</Label>
                <Select value={importTargetCategory} onValueChange={setImportTargetCategory}>
                  <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="OUTLET">Karyawan Outlet</SelectItem>
                    <SelectItem value="PH_KLATEN">Karyawan PH Klaten</SelectItem>
                    <SelectItem value="GUDANG_JAKARTA">Gudang Jakarta</SelectItem>
                    <SelectItem value="NON_OUTLET">Karyawan HQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Filter Target Outlet:</Label>
                <Select value={importTargetOutlet} onValueChange={setImportTargetOutlet}>
                  <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Outlet Cabang</SelectItem>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ERPNext Column Selection for Import */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sliders className="size-3.5 text-primary" /> 2. Pilih Kolom Mana Saja yang Ingin Di-Import
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleImportAll(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Pilih Semua
                </button>
                <span className="text-muted-foreground text-xs">•</span>
                <button
                  type="button"
                  onClick={() => toggleImportAll(false)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Batal Pilih
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto rounded-lg border border-border p-3 text-xs bg-muted/10">
              {ALL_IMPORT_FIELDS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center justify-between gap-2 rounded-lg p-2 border border-border/60 bg-background hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={!!selectedImportColumns[f.key]}
                      onCheckedChange={(checked) =>
                        setSelectedImportColumns((prev) => ({ ...prev, [f.key]: !!checked }))
                      }
                      className="size-4"
                    />
                    <span className="text-foreground font-semibold text-xs truncate">{f.label}</span>
                  </div>
                  {f.priority === "wajib" ? (
                    <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[9px] font-bold shrink-0">🔴 Wajib</Badge>
                  ) : f.priority === "disarankan" ? (
                    <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px] font-bold shrink-0">🟡 Disarankan</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/40 text-muted-foreground text-[9px] shrink-0">⚪ Opsional</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground block">3. Unggah File Spreadsheet Karyawan</span>
            <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 py-6 px-4 text-center hover:bg-muted/40 transition-colors">
              <FileSpreadsheet className="size-8 text-primary/70 mb-2" />
              <p className="text-xs font-medium text-foreground">
                {fileName ? `File terpilih: ${fileName}` : "Seret &amp; Lepaskan File Spreadsheet di Sini"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Mendukung format Excel (.xlsx / .xls) dan CSV (.csv)</p>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleSimulateUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleExecuteImport} disabled={isImporting} className="gap-1.5">
            {isImporting ? <RefreshCw className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {isImporting ? "Memproses Import..." : "Proses Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// ERPNext-Style Export Dialog Component (REVISI ITEM 2: Excel HTML Archive tanpa Error Dialog Excel)
// ------------------------------------------------------------
function EmployeeExportDialog({
  open,
  onOpenChange,
  filteredEmployees,
  allEmployees,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  filteredEmployees: Employee[];
  allEmployees: Employee[];
}) {
  const outlets = useStore((s) => s.outlets);
  const [exportFormat, setExportFormat] = React.useState<"excel" | "csv">("excel");
  const [exportScope, setExportScope] = React.useState<"filtered" | "all">("filtered");

  const [exportOutletFilter, setExportOutletFilter] = React.useState("all");
  const [exportCategoryFilter, setExportCategoryFilter] = React.useState("all");
  const [exportStatusFilter, setExportStatusFilter] = React.useState("all");

  const ALL_EXPORT_FIELDS = [
    { key: "nik", label: "NIK", defaultChecked: true },
    { key: "fullName", label: "Nama Lengkap", defaultChecked: true },
    { key: "email", label: "Email (Login v2)", defaultChecked: true },
    { key: "birthDate", label: "Tanggal Lahir (Login v2)", defaultChecked: true },
    { key: "phone", label: "Nomor Telepon", defaultChecked: true },
    { key: "category", label: "Kategori Karyawan", defaultChecked: true },
    { key: "position", label: "Posisi / Jabatan", defaultChecked: true },
    { key: "division", label: "Divisi", defaultChecked: true },
    { key: "placement", label: "Penempatan Lokasi / Outlet", defaultChecked: true },
    { key: "status", label: "Status Kepegawaian", defaultChecked: true },
    { key: "salaryType", label: "Tipe Skema Gaji", defaultChecked: true },
    { key: "salaryAmount", label: "Nominal Gaji", defaultChecked: true },
    { key: "bankName", label: "Nama Bank Payroll", defaultChecked: true },
    { key: "accountNumber", label: "Nomor Rekening", defaultChecked: true },
    { key: "accountHolderName", label: "Atas Nama Rekening", defaultChecked: true },
    { key: "contractType", label: "Tipe Kontrak", defaultChecked: true },
    { key: "contractDurationMonths", label: "Durasi Kontrak (Bulan)", defaultChecked: true },
    { key: "startDate", label: "Tanggal Bergabung", defaultChecked: true },
    { key: "leaveBalanceDays", label: "Saldo Cuti", defaultChecked: false },
    { key: "homeAddress", label: "Alamat Rumah", defaultChecked: false },
    { key: "mapsUrl", label: "Link Google Maps", defaultChecked: false },
  ];

  const [selectedFields, setSelectedFields] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALL_EXPORT_FIELDS.forEach((f) => {
      initial[f.key] = f.defaultChecked;
    });
    return initial;
  });

  const toggleAll = (check: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_EXPORT_FIELDS.forEach((f) => {
      updated[f.key] = check;
    });
    setSelectedFields(updated);
  };

  const handleExecuteExport = () => {
    let sourceData = exportScope === "filtered" ? filteredEmployees : allEmployees;

    if (exportOutletFilter !== "all") {
      sourceData = sourceData.filter((e) => e.primaryOutletId === exportOutletFilter);
    }
    if (exportCategoryFilter !== "all") {
      sourceData = sourceData.filter((e) => e.category === exportCategoryFilter);
    }
    if (exportStatusFilter !== "all") {
      sourceData = sourceData.filter((e) => e.status === exportStatusFilter);
    }

    const activeFieldKeys = ALL_EXPORT_FIELDS.filter((f) => selectedFields[f.key]);

    if (activeFieldKeys.length === 0) {
      toast.error("Pilih minimal satu kolom untuk dieksport.");
      return;
    }

    const headers = activeFieldKeys.map((f) => f.label);

    const rows = sourceData.map((e) => {
      return activeFieldKeys.map((f) => {
        switch (f.key) {
          case "nik": return e.nik;
          case "fullName": return e.fullName;
          case "email": return e.email || "";
          case "birthDate": return e.birthDate || "1998-05-20";
          case "phone": return e.phone || "";
          case "category": return e.category;
          case "position": return lookupService.positionName(e.positionId);
          case "division": return lookupService.divisionName(e.divisionId);
          case "placement":
            return e.category === "OUTLET"
              ? lookupService.outletName(e.primaryOutletId)
              : e.category === "PH_KLATEN"
              ? "Pabrik PH Klaten"
              : e.category === "GUDANG_JAKARTA"
              ? "Gudang Jakarta"
              : "Head Office";
          case "status": return e.status;
          case "salaryType": return e.salaryType;
          case "salaryAmount": return e.salaryAmount;
          case "bankName": return e.bankName || "BCA";
          case "accountNumber": return e.accountNumber || "";
          case "accountHolderName": return e.accountHolderName || e.fullName;
          case "contractType": return e.contractType || "PKWT";
          case "contractDurationMonths": return e.contractDurationMonths || 12;
          case "startDate": return e.startDate;
          case "leaveBalanceDays": return e.leaveBalanceDays;
          case "homeAddress": return e.homeAddress || "";
          case "mapsUrl": return e.mapsUrl || "";
          default: return "";
        }
      });
    });

    if (exportFormat === "excel") {
      // Format HTML Table MSO Web Archive untuk Excel (.xls) — BEBAS PERINGATAN CORRUPT/EXTENSION MISMATCH!
      const escapeHtml = (str: any) =>
        String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

      const htmlContent = `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Data Karyawan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table border="1">
<thead>
  <tr style="background-color: #f4f4f4; font-weight: bold;">
    ${headers.map((h) => `<th style="padding: 6px; text-align: left;">${escapeHtml(h)}</th>`).join("")}
  </tr>
</thead>
<tbody>
  ${rows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td style="padding: 5px;">${escapeHtml(c)}</td>`).join("")}</tr>`,
    )
    .join("\n")}
</tbody>
</table>
</body>
</html>`;

      const blob = new Blob([htmlContent], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_karyawan_${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Standard CSV Export
      const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_karyawan_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`${sourceData.length} Data Karyawan berhasil dieksport (${exportFormat.toUpperCase()})`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Download className="size-5 text-primary" /> Export Data Karyawan (ERPNext Style)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pilih format spreadsheet, filter kustom, serta centang kolom/field mana saja yang ingin dieksport.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format & Scope Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">1. Format File Export</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                <SelectTrigger className="h-8 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xls Standard Web Archive)</SelectItem>
                  <SelectItem value="csv">CSV (.csv standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">2. Cakupan Data</Label>
              <Select value={exportScope} onValueChange={(v) => setExportScope(v as any)}>
                <SelectTrigger className="h-8 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filtered">
                    Karyawan Terfiltrasi ({filteredEmployees.length} Staf)
                  </SelectItem>
                  <SelectItem value="all">
                    Seluruh Data Karyawan ({allEmployees.length} Staf)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Kustom Tambahan ERPNext Style */}
          <div className="rounded-xl border border-border/80 p-3 bg-muted/20 space-y-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Filter className="size-3.5 text-primary" /> Filter Kustom Tambahan (ERPNext Style)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <Select value={exportOutletFilter} onValueChange={setExportOutletFilter}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Outlet" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Outlet</SelectItem>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={exportCategoryFilter} onValueChange={setExportCategoryFilter}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="OUTLET">Outlet</SelectItem>
                  <SelectItem value="PH_KLATEN">PH Klaten</SelectItem>
                  <SelectItem value="GUDANG_JAKARTA">Gudang Jkt</SelectItem>
                  <SelectItem value="NON_OUTLET">HQ</SelectItem>
                </SelectContent>
              </Select>

              <Select value={exportStatusFilter} onValueChange={setExportStatusFilter}>
                <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                  <SelectItem value="RESIGN">Resign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Field Selection Checklist (ERPNext Style) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sliders className="size-3.5 text-primary" /> 3. Pilih Kolom / Field yang Ingin Dieksport
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAll(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Pilih Semua
                </button>
                <span className="text-muted-foreground text-xs">•</span>
                <button
                  type="button"
                  onClick={() => toggleAll(false)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Batal Pilih
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto rounded-lg border border-border p-3 text-xs bg-muted/10">
              {ALL_EXPORT_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={!!selectedFields[field.key]}
                    onCheckedChange={(checked) =>
                      setSelectedFields((prev) => ({ ...prev, [field.key]: !!checked }))
                    }
                  />
                  <span className="text-foreground font-medium">{field.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleExecuteExport} className="gap-1.5">
            <Download className="size-3.5" /> Export Data ({exportFormat.toUpperCase()})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
