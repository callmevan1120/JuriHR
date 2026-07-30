"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Field, FormRow } from "@/components/common/field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable, selectionColumn } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { useStore } from "@/hooks/use-store";
import { positionService, divisionService, lookupService } from "@/lib/services/master-data";
import {
  formatRupiah,
  cn,
} from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Division, Position, RecordStatus } from "@/lib/types";
import { toast } from "sonner";
import {
  UniversalImportDialog,
  UniversalExportDialog,
  type ImportExportField,
} from "@/components/common/import-export-dialog";
import {
  Plus,
  Pencil,
  Archive,
  Briefcase,
  Building2,
  Users,
  Hash,
  ArrowLeft,
  Save,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export function PositionsView() {
  const positions = useStore((s) => s.positions);
  const divisions = useStore((s) => s.divisions);
  const employees = useStore((s) => s.employees);

  const [activeTab, setActiveTab] = React.useState<"positions" | "divisions">("positions");

  const [formState, setFormState] = React.useState<{
    type: "position" | "division" | null;
    mode: "create" | "edit";
    data?: Position | Division;
  }>({ type: null, mode: "create" });

  const [confirm, setConfirm] = React.useState<{
    type: "position" | "division";
    id: string;
    name: string;
  } | null>(null);

  const empCountByPosition = React.useMemo(() => {
    const m = new Map<string, number>();
    employees.forEach((e) => m.set(e.positionId, (m.get(e.positionId) ?? 0) + 1));
    return m;
  }, [employees]);

  const empCountByDivision = React.useMemo(() => {
    const m = new Map<string, number>();
    employees.forEach((e) => m.set(e.divisionId, (m.get(e.divisionId) ?? 0) + 1));
    return m;
  }, [employees]);

  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

  if (formState.type === "position") {
    return (
      <PositionFormPage
        mode={formState.mode}
        data={formState.data as Position | undefined}
        onBack={() => setFormState({ type: null, mode: "create" })}
      />
    );
  }

  if (formState.type === "division") {
    return (
      <DivisionFormPage
        mode={formState.mode}
        data={formState.data as Division | undefined}
        onBack={() => setFormState({ type: null, mode: "create" })}
      />
    );
  }

  const activePositionsCount = positions.filter((p) => p.status === "active").length;
  const activeDivisionsCount = divisions.filter((d) => d.status === "active").length;
  const outletPositionsCount = positions.filter((p) => p.category === "OUTLET").length;

  const positionImportFields: ImportExportField[] = [
    { key: "code", label: "Kode Posisi", priority: "wajib", defaultChecked: true, sampleValue: "BAR" },
    { key: "name", label: "Nama Posisi / Jabatan", priority: "wajib", defaultChecked: true, sampleValue: "Barista Senior" },
    { key: "category", label: "Kategori Operasional", priority: "wajib", defaultChecked: true, sampleValue: "OUTLET" },
    { key: "defaultMonthlySalary", label: "Default Gaji Bulanan", priority: "disarankan", defaultChecked: true, sampleValue: "4500000" },
    { key: "defaultDailySalary", label: "Default Gaji Harian", priority: "disarankan", defaultChecked: true, sampleValue: "180000" },
    { key: "note", label: "Catatan Jabatan", priority: "opsional", defaultChecked: false, sampleValue: "Posisi operasional cabang" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Posisi &amp; Divisi Karyawan"
        description="Pengelolaan struktur jabatan, departemen divisi, dan acuan default kompensasi gaji JURI Bun."
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
            <Button
              variant="outline"
              onClick={() => setFormState({ type: "division", mode: "create" })}
              className="gap-1.5 rounded-xl font-semibold text-xs"
            >
              <Plus className="size-4 text-primary" /> Tambah Divisi
            </Button>
            <Button
              onClick={() => setFormState({ type: "position", mode: "create" })}
              className="gap-1.5 rounded-xl font-semibold text-xs"
            >
              <Plus className="size-4" /> Tambah Posisi
            </Button>
          </div>
        }
      />

      {/* Simple summary line */}
      <p className="text-xs text-muted-foreground">
        {activePositionsCount} jabatan aktif, {activeDivisionsCount} divisi, {outletPositionsCount} posisi outlet, total {employees.length} karyawan.
      </p>

      {/* Segmented Tab Switcher */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="inline-flex rounded-xl bg-muted/50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("positions")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-150",
              activeTab === "positions"
                ? "bg-background text-foreground font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Briefcase className="size-4 text-primary" />
            <span>Master Posisi &amp; Jabatan</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary font-bold">
              {positions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("divisions")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-150",
              activeTab === "divisions"
                ? "bg-background text-foreground font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="size-4 text-info" />
            <span>Master Divisi &amp; Departemen</span>
            <span className="rounded-full bg-info/15 px-2 py-0.5 text-[10px] text-info font-bold">
              {divisions.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "positions" ? (
        <PositionsTableSection
          positions={positions}
          empCount={empCountByPosition}
          onEdit={(p) => setFormState({ type: "position", mode: "edit", data: p })}
          onArchive={(p) => setConfirm({ type: "position", id: p.id, name: p.name })}
        />
      ) : (
        <DivisionsTableSection
          divisions={divisions}
          empCount={empCountByDivision}
          onEdit={(d) => setFormState({ type: "division", mode: "edit", data: d })}
          onArchive={(d) => setConfirm({ type: "division", id: d.id, name: d.name })}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Arsipkan data?"
        description={`"${confirm?.name}" akan diarsipkan (soft delete). Data tetap tersimpan dan dapat dipulihkan.`}
        destructive
        confirmLabel="Arsipkan"
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === "position") positionService.softDelete(confirm.id);
          else divisionService.softDelete(confirm.id);
          toast.success("Data berhasil diarsipkan");
        }}
      />

      <UniversalImportDialog
        moduleTitle={activeTab === "positions" ? "Posisi & Jabatan" : "Divisi & Departemen"}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(rows) => {
          if (activeTab === "positions") {
            const existingCodes = new Set(positionService.list().map((p) => p.code));
            const validCats = ["OUTLET", "NON_OUTLET"];
            let created = 0, skipped = 0;
            for (const row of rows) {
              const code = row.code?.trim();
              const name = row.name?.trim();
              if (!code || !name || existingCodes.has(code)) { skipped++; continue; }
              const category = (row.category?.trim() || "OUTLET") as "OUTLET" | "NON_OUTLET";
              if (!validCats.includes(category)) { skipped++; continue; }
              existingCodes.add(code);
              positionService.create({
                code, name, category,
                defaultMonthlySalary: Number(row.defaultMonthlySalary) || 0,
                defaultDailySalary: Number(row.defaultDailySalary) || 0,
                status: "active",
                note: row.note?.trim() || undefined,
              });
              created++;
            }
            if (skipped > 0) toast.warning(`${created} posisi ditambah, ${skipped} dilewati (kode duplikat/invalid).`);
            else toast.success(`${created} posisi berhasil ditambahkan.`);
          } else {
            const existingCodes = new Set(divisionService.list().map((d) => d.code));
            let created = 0, skipped = 0;
            for (const row of rows) {
              const code = row.code?.trim();
              const name = row.name?.trim();
              if (!code || !name || existingCodes.has(code)) { skipped++; continue; }
              const category = (row.category?.trim() || "NON_OUTLET") as "OUTLET" | "NON_OUTLET";
              existingCodes.add(code);
              divisionService.create({
                code, name, category,
                status: "active",
                note: row.note?.trim() || undefined,
              });
              created++;
            }
            if (skipped > 0) toast.warning(`${created} divisi ditambah, ${skipped} dilewati (kode duplikat/invalid).`);
            else toast.success(`${created} divisi berhasil ditambahkan.`);
          }
        }}
        fields={positionImportFields}
      />

      <UniversalExportDialog
        moduleTitle={activeTab === "positions" ? "Posisi & Jabatan" : "Divisi & Departemen"}
        open={exportOpen}
        onOpenChange={setExportOpen}
        fields={positionImportFields}
        exportData={activeTab === "positions" ? positions : divisions}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Positions Table
// ------------------------------------------------------------
function PositionsTableSection({
  positions,
  empCount,
  onEdit,
  onArchive,
}: {
  positions: Position[];
  empCount: Map<string, number>;
  onEdit: (p: Position) => void;
  onArchive: (p: Position) => void;
}) {
  const columns: ColumnDef<Position>[] = [
    {
      accessorKey: "code",
      header: "Kode Jabatan",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-foreground bg-muted/40 px-2 py-1 rounded-md border border-border/60">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Posisi / Jabatan",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Briefcase className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{row.original.name}</p>
            {row.original.note && (
              <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">{row.original.note}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategori Operasional",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.category}
          label={row.original.category === "OUTLET" ? "Cabang Outlet" : "Non-Outlet / HQ"}
          className={cn(
            row.original.category === "OUTLET"
              ? "bg-primary/15 text-primary border-primary/30 font-semibold"
              : "bg-info/15 text-info border-info/30 font-semibold",
          )}
        />
      ),
    },
    {
      id: "salaryMonthly",
      header: "Default Gaji Bulanan",
      cell: ({ row }) => (
        <span className="tabular-nums font-semibold text-foreground">
          {row.original.defaultMonthlySalary > 0
            ? formatRupiah(row.original.defaultMonthlySalary)
            : "—"}
        </span>
      ),
    },
    {
      id: "salaryDaily",
      header: "Default Gaji Harian",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.defaultDailySalary > 0
            ? formatRupiah(row.original.defaultDailySalary)
            : "—"}
        </span>
      ),
    },
    {
      id: "empCount",
      header: "Jumlah Karyawan",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums font-semibold text-foreground bg-muted/30 px-2.5 py-1 rounded-lg border border-border/50">
          <Users className="size-3.5 text-primary" />
          {empCount.get(row.original.id) ?? 0} Anggota
        </span>
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
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
            title="Edit Posisi"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(row.original);
            }}
            title="Arsipkan"
          >
            <Archive className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Daftar Lengkap Posisi & Jabatan</h3>
        <DataTable
          tableKey="positions"
          columns={[selectionColumn<Position>(), ...columns] as ColumnDef<Position>[]}
          data={positions}
          searchPlaceholder="Cari berdasarkan nama atau kode posisi..."
          pageSize={10}
          globalFilterFn={(row, q) =>
            (row.name + row.code + (row.note ?? "")).toLowerCase().includes(q.toLowerCase())
          }
        />
      </div>
  );
}

// ------------------------------------------------------------
// Divisions Table
// ------------------------------------------------------------
function DivisionsTableSection({
  divisions,
  empCount,
  onEdit,
  onArchive,
}: {
  divisions: Division[];
  empCount: Map<string, number>;
  onEdit: (d: Division) => void;
  onArchive: (d: Division) => void;
}) {
  const columns: ColumnDef<Division>[] = [
    {
      accessorKey: "code",
      header: "Kode Divisi",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-foreground bg-muted/40 px-2 py-1 rounded-md border border-border/60">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Divisi / Departemen",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
            <Building2 className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{row.original.name}</p>
            {row.original.note && (
              <p className="text-[11px] text-muted-foreground truncate max-w-[240px]">{row.original.note}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategori Divisi",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.category}
          label={row.original.category === "OUTLET" ? "Divisi Outlet" : "HQ / Non-Outlet"}
          className={cn(
            row.original.category === "OUTLET"
              ? "bg-primary/15 text-primary border-primary/30 font-semibold"
              : "bg-info/15 text-info border-info/30 font-semibold",
          )}
        />
      ),
    },
    {
      id: "head",
      header: "Kepala Divisi",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {lookupService.employeeName(row.original.headId) || "—"}
        </span>
      ),
    },
    {
      id: "empCount",
      header: "Jumlah Anggota",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums font-semibold text-foreground bg-muted/30 px-2.5 py-1 rounded-lg border border-border/50">
          <Users className="size-3.5 text-info" />
          {empCount.get(row.original.id) ?? 0} Karyawan
        </span>
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
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
            title="Edit Divisi"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(row.original);
            }}
            title="Arsipkan"
          >
            <Archive className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Daftar Lengkap Divisi & Departemen</h3>
        <DataTable
          tableKey="divisions"
          columns={[selectionColumn<Division>(), ...columns] as ColumnDef<Division>[]}
          data={divisions}
          searchPlaceholder="Cari berdasarkan nama atau kode divisi..."
          pageSize={10}
          globalFilterFn={(row, q) =>
            (row.name + row.code + (row.note ?? "")).toLowerCase().includes(q.toLowerCase())
          }
        />
      </div>
  );
}

// ------------------------------------------------------------
// Full-Page Position Form
// ------------------------------------------------------------
function PositionFormPage({
  mode,
  data,
  onBack,
}: {
  mode: "create" | "edit";
  data?: Position;
  onBack: () => void;
}) {
  const [code, setCode] = React.useState(data?.code ?? "");
  const [name, setName] = React.useState(data?.name ?? "");
  const [category, setCategory] = React.useState<"OUTLET" | "NON_OUTLET">(data?.category ?? "OUTLET");
  const [monthly, setMonthly] = React.useState(String(data?.defaultMonthlySalary ?? 0));
  const [daily, setDaily] = React.useState(String(data?.defaultDailySalary ?? 0));
  const [status, setStatus] = React.useState<RecordStatus>(data?.status ?? "active");
  const [note, setNote] = React.useState(data?.note ?? "");
  const [error, setError] = React.useState<string>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Kode dan nama posisi wajib diisi.");
      return;
    }
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      defaultMonthlySalary: Number(monthly) || 0,
      defaultDailySalary: Number(daily) || 0,
      status,
      note: note.trim() || undefined,
    };
    if (mode === "edit" && data) {
      positionService.update(data.id, payload);
      toast.success("Data posisi berhasil diperbarui");
    } else {
      try {
        positionService.create(payload);
        toast.success("Posisi baru berhasil ditambahkan");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menambah posisi");
        return;
      }
    }
    onBack();
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-12">
      <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/80 bg-background/95 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" type="button" onClick={onBack} className="size-8 text-muted-foreground hover:text-foreground rounded-xl" title="Kembali" aria-label="Kembali">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              {mode === "edit" ? `Edit Posisi — ${data?.name}` : "Tambah Posisi Jabatan Baru"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Formulir kelola kode posisi, nama jabatan, kategori outlet/HQ, dan acuan standar gaji.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onBack} className="gap-1.5 rounded-xl font-semibold text-xs">
            Batal
          </Button>
          <Button type="submit" className="gap-1.5 font-semibold rounded-xl px-5 text-xs">
            <Save className="size-4" />
            {mode === "edit" ? "Simpan Perubahan" : "Simpan Posisi"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-w-4xl space-y-6">
        <Card className="rounded-2xl border border-border/60">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold">1. Identitas Posisi &amp; Kategori</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <FormRow>
              <Field label="Kode Posisi" required hint="Singkatan unik maks 6 karakter (cth: BAR, KSR, BKR)">
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BAR" className="pl-9 font-mono uppercase font-bold" maxLength={6} />
                </div>
              </Field>
              <Field label="Nama Posisi / Jabatan" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Barista Senior" className="font-semibold" />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Kategori Operasional" hint="Menentukan penempatan posisi di cabang outlet atau markas HQ">
                <Select value={category} onValueChange={(v) => setCategory(v as "OUTLET" | "NON_OUTLET")}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTLET">Cabang Outlet (Operasional)</SelectItem>
                    <SelectItem value="NON_OUTLET">Non-Outlet / Markas Utama (HQ)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status Rekaman">
                <Select value={status} onValueChange={(v) => setStatus(v as RecordStatus)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold">2. Acuan Kompensasi &amp; Catatan</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <FormRow>
              <Field label="Default Gaji Bulanan (Rp)" hint="Default nilai penggajian bagi karyawan tipe bulanan">
                <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} className="tabular-nums font-mono font-semibold" />
              </Field>
              <Field label="Default Gaji Harian (Rp)" hint="Default nilai penggajian bagi karyawan tipe harian/part-time">
                <Input type="number" value={daily} onChange={(e) => setDaily(e.target.value)} className="tabular-nums font-mono" />
              </Field>
            </FormRow>

            <Field label="Catatan Tambahan">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tuliskan deskripsi tugas atau syarat khusus posisi ini (opsional)..." />
            </Field>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Full-Page Division Form
// ------------------------------------------------------------
function DivisionFormPage({
  mode,
  data,
  onBack,
}: {
  mode: "create" | "edit";
  data?: Division;
  onBack: () => void;
}) {
  const employees = useStore((s) => s.employees);
  const [code, setCode] = React.useState(data?.code ?? "");
  const [name, setName] = React.useState(data?.name ?? "");
  const [category, setCategory] = React.useState<"OUTLET" | "NON_OUTLET">(data?.category ?? "NON_OUTLET");
  const [headId, setHeadId] = React.useState(data?.headId ?? "");
  const [status, setStatus] = React.useState<RecordStatus>(data?.status ?? "active");
  const [note, setNote] = React.useState(data?.note ?? "");
  const [error, setError] = React.useState<string>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Kode dan nama divisi wajib diisi.");
      return;
    }
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      headId: headId || undefined,
      status,
      note: note.trim() || undefined,
    };
    if (mode === "edit" && data) {
      divisionService.update(data.id, payload);
      toast.success("Data divisi berhasil diperbarui");
    } else {
      try {
        divisionService.create(payload);
        toast.success("Divisi baru berhasil ditambahkan");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menambah divisi");
        return;
      }
    }
    onBack();
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-12">
      <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/80 bg-background/95 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" type="button" onClick={onBack} className="size-8 text-muted-foreground hover:text-foreground rounded-xl" title="Kembali" aria-label="Kembali">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="size-5 text-info" />
              {mode === "edit" ? `Edit Divisi — ${data?.name}` : "Tambah Divisi / Departemen Baru"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Formulir kelola divisi organisasi, kepala divisi, dan struktur departemen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onBack} className="gap-1.5 rounded-xl font-semibold text-xs">
            Batal
          </Button>
          <Button type="submit" className="gap-1.5 font-semibold rounded-xl px-5 text-xs">
            <Save className="size-4" />
            {mode === "edit" ? "Simpan Perubahan" : "Simpan Divisi"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-w-4xl space-y-6">
        <Card className="rounded-2xl border border-border/60">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-semibold">Identitas Divisi &amp; Struktural</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <FormRow>
              <Field label="Kode Divisi" required hint="Kode unik maks 6 karakter (cth: OPS, MKT, HRD, FIN)">
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="OPS" className="pl-9 font-mono uppercase font-bold" maxLength={6} />
                </div>
              </Field>
              <Field label="Nama Divisi / Departemen" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Operasional Outlet" className="font-semibold" />
              </Field>
            </FormRow>

            <FormRow>
              <Field label="Kategori Divisi">
                <Select value={category} onValueChange={(v) => setCategory(v as "OUTLET" | "NON_OUTLET")}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTLET">Divisi Operasional Outlet</SelectItem>
                    <SelectItem value="NON_OUTLET">HQ / Headquarter (Non-Outlet)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Kepala Divisi (Opsional)">
                <Select value={headId || "none"} onValueChange={(v) => setHeadId(v === "none" ? "" : v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih Kepala Divisi..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Belum Ada --</SelectItem>
                    {employees.filter((e) => e.status === "AKTIF").map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.fullName} ({e.nik})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>

            <Field label="Catatan / Lingkup Kerja">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tuliskan wewenang &amp; ruang lingkup divisi ini (opsional)..." />
            </Field>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
