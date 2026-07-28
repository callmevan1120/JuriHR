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

  // Dialog State ERPNext Style
  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

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
          <div className="flex items-center justify-end gap-1">
            <EmployeeQuickView employee={e}>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={(ev) => ev.stopPropagation()}
                title="Preview cepat"
              >
                <Eye className="size-3.5" />
              </button>
            </EmployeeQuickView>
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Karyawan"
        description="Kelola data karyawan lengkap dengan penempatan cabang/pabrik/gudang, rekening bank, serta histori."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-1.5">
              <Upload className="size-4" /> Import Data
            </Button>
            <Button variant="outline" onClick={() => setExportOpen(true)} className="gap-1.5">
              <Download className="size-4" /> Export Data
            </Button>
            <Button onClick={() => setFormOpen({ mode: "create" })} className="gap-1.5">
              <Plus className="size-4" /> Tambah Karyawan
            </Button>
          </>
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
  const [fileFormat, setFileFormat] = React.useState<"excel" | "csv">("excel");
  const [step, setStep] = React.useState<"upload" | "mapping" | "preview">("upload");
  const [fileName, setFileName] = React.useState<string>();
  const [isImporting, setIsImporting] = React.useState(false);

  // Default mapping ERPNext Style
  const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>({
    "NIK": "nik",
    "Nama Lengkap": "fullName",
    "No Telepon": "phone",
    "Email": "email",
    "Kategori Karyawan": "category",
    "Posisi / Jabatan": "positionId",
    "Divisi": "divisionId",
    "Outlet": "primaryOutletId",
    "Status": "status",
    "Skema Gaji": "salaryType",
    "Nominal Gaji": "salaryAmount",
    "Nama Bank": "bankName",
    "No Rekening": "accountNumber",
    "Atas Nama Rekening": "accountHolderName",
    "Tipe Kontrak": "contractType",
    "Durasi Kontrak (Bulan)": "contractDurationMonths",
    "Tanggal Bergabung": "startDate",
    "Alamat Rumah": "homeAddress",
    "Link Google Maps": "mapsUrl",
  });

  const availableFields = [
    { key: "nik", label: "NIK (Nomor Induk Karyawan)" },
    { key: "fullName", label: "Nama Lengkap" },
    { key: "phone", label: "Nomor Telepon / WA" },
    { key: "email", label: "Email" },
    { key: "category", label: "Kategori (Outlet / PH Klaten / Gudang / HQ)" },
    { key: "positionId", label: "Posisi / Jabatan" },
    { key: "divisionId", label: "Divisi" },
    { key: "primaryOutletId", label: "Penempatan Outlet" },
    { key: "status", label: "Status (Aktif / Nonaktif / Resign)" },
    { key: "salaryType", label: "Skema Gaji (Bulanan / Harian)" },
    { key: "salaryAmount", label: "Nominal Gaji (Rp)" },
    { key: "bankName", label: "Nama Bank (BCA/Mandiri/BNI/dll)" },
    { key: "accountNumber", label: "Nomor Rekening" },
    { key: "accountHolderName", label: "Atas Nama Rekening" },
    { key: "contractType", label: "Tipe Kontrak (PKWT/PKWTT/Probation)" },
    { key: "contractDurationMonths", label: "Durasi Kontrak (Bulan)" },
    { key: "startDate", label: "Tanggal Bergabung (YYYY-MM-DD)" },
    { key: "homeAddress", label: "Alamat Rumah Lengkap" },
    { key: "mapsUrl", label: "Link Google Maps" },
  ];

  const handleDownloadTemplate = () => {
    const headers = Object.keys(columnMapping);
    const sampleRow = [
      "JBD00099",
      "Budi Santoso",
      "081299887766",
      "budi.santoso@juribun.co.id",
      "OUTLET",
      "Barista",
      "Operasional Outlet",
      "JURI Bun — Sudirman",
      "AKTIF",
      "HARIAN",
      "180000",
      "BCA",
      "8830918273",
      "Budi Santoso",
      "PKWT",
      "12",
      "2025-01-15",
      "Jl. Sudirman No 45, Jakarta",
      "https://maps.google.com/?q=-6.19,106.82",
    ];

    const csvContent = [headers.join(","), sampleRow.map((c) => `"${c}"`).join(",")].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: fileFormat === "excel" ? "application/vnd.ms-excel;charset=utf-8;" : "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_import_karyawan.${fileFormat === "excel" ? "xlsx" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Template ${fileFormat.toUpperCase()} berhasil diunduh!`);
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
      toast.success("12 Karyawan berhasil di-import dari file spreadsheet!");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Upload className="size-5 text-primary" /> Import Data Karyawan (ERPNext Style)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Unggah file data karyawan dalam format Excel (.xlsx) atau CSV, lalu tentukan pemetaan kolom secara presisi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format Selector & Template Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="space-y-1">
              <span className="text-xs font-bold text-foreground block">1. Unduh Template File</span>
              <p className="text-[11px] text-muted-foreground">Pilih format spreadsheet template yang Anda inginkan.</p>
            </div>

            <div className="flex items-center gap-2">
              <Select value={fileFormat} onValueChange={(v) => setFileFormat(v as any)}>
                <SelectTrigger className="h-8 w-24 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="h-8 gap-1.5 text-xs">
                <Download className="size-3.5 text-primary" /> Template
              </Button>
            </div>
          </div>

          {/* Step 1: Upload Dropzone */}
          {step === "upload" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground block">2. Unggah File Data Karyawan</span>
              <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 py-8 px-4 text-center hover:bg-muted/40 transition-colors">
                <FileSpreadsheet className="size-10 text-primary/70 mb-2" />
                <p className="text-sm font-medium text-foreground">Seret &amp; Lepaskan File di Sini</p>
                <p className="text-xs text-muted-foreground mt-0.5">Mendukung format Excel (.xlsx) dan CSV (.csv)</p>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleSimulateUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button size="sm" variant="secondary" className="mt-3 text-xs gap-1.5">
                  <Upload className="size-3.5" /> Pilih File Spreadsheet
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: ERPNext Column Mapping */}
          {step === "mapping" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground">
                  3. Pemetaan Kolom Spreadsheet ke Field System ({fileName})
                </span>
                <Button variant="ghost" size="sm" onClick={() => setStep("upload")} className="h-7 text-xs">
                  Ganti File
                </Button>
              </div>

              <div className="rounded-lg border border-border overflow-hidden divide-y divide-border text-xs max-h-[300px] overflow-y-auto">
                <div className="bg-muted/40 p-2.5 font-bold grid grid-cols-2 text-muted-foreground">
                  <span>Kolom File Spreadsheet Anda</span>
                  <span>Field Target System JURI HR</span>
                </div>

                {Object.entries(columnMapping).map(([fileCol, targetKey]) => (
                  <div key={fileCol} className="p-2.5 grid grid-cols-2 items-center gap-2 hover:bg-muted/20">
                    <span className="font-medium text-foreground truncate">{fileCol}</span>
                    <Select
                      value={targetKey}
                      onValueChange={(newTarget) =>
                        setColumnMapping((prev) => ({ ...prev, [fileCol]: newTarget }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          {step === "mapping" && (
            <Button onClick={handleExecuteImport} disabled={isImporting} className="gap-1.5">
              {isImporting ? <RefreshCw className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
              {isImporting ? "Memproses Import..." : "Jalankan Import Data"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// ERPNext-Style Export Dialog Component
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
  const [exportFormat, setExportFormat] = React.useState<"excel" | "csv">("excel");
  const [exportScope, setExportScope] = React.useState<"filtered" | "all">("filtered");

  // Dibuat pilihan checkbox field seperti ERPNext
  const ALL_EXPORT_FIELDS = [
    { key: "nik", label: "NIK", defaultChecked: true },
    { key: "fullName", label: "Nama Lengkap", defaultChecked: true },
    { key: "phone", label: "Nomor Telepon", defaultChecked: true },
    { key: "email", label: "Email", defaultChecked: true },
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
    const targetData = exportScope === "filtered" ? filteredEmployees : allEmployees;
    const activeFieldKeys = ALL_EXPORT_FIELDS.filter((f) => selectedFields[f.key]);

    if (activeFieldKeys.length === 0) {
      toast.error("Pilih minimal satu kolom untuk dieksport.");
      return;
    }

    const headers = activeFieldKeys.map((f) => f.label);

    const rows = targetData.map((e) => {
      return activeFieldKeys.map((f) => {
        switch (f.key) {
          case "nik": return e.nik;
          case "fullName": return e.fullName;
          case "phone": return e.phone || "";
          case "email": return e.email || "";
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

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: exportFormat === "excel" ? "application/vnd.ms-excel;charset=utf-8;" : "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_karyawan_${exportScope}_${new Date().toISOString().slice(0, 10)}.${exportFormat === "excel" ? "xlsx" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`${targetData.length} Karyawan berhasil dieksport (${exportFormat.toUpperCase()})`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Download className="size-5 text-primary" /> Export Data Karyawan (ERPNext Style)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pilih format spreadsheet, cakupan filter karyawan, serta centang kolom/field mana saja yang ingin dieksport.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format & Scope Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">1. Format File Export</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                <SelectTrigger className="h-9 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">2. Cakupan Data Karyawan</Label>
              <Select value={exportScope} onValueChange={(v) => setExportScope(v as any)}>
                <SelectTrigger className="h-9 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filtered">
                    Karyawan Terfiltrasi Saat Ini ({filteredEmployees.length} Staf)
                  </SelectItem>
                  <SelectItem value="all">
                    Seluruh Data Karyawan ({allEmployees.length} Staf)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Field Selection Checklist (ERPNext Style) */}
          <div className="space-y-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto rounded-lg border border-border p-3 text-xs bg-muted/10">
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
