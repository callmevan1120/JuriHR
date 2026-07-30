"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field, FormRow } from "@/components/common/field";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import {
  UniversalImportDialog,
  UniversalExportDialog,
  type ImportExportField,
} from "@/components/common/import-export-dialog";
import { useStore } from "@/hooks/use-store";
import { holidayService } from "@/lib/services/schedule";
import { formatDateMed, todayISODate, cn, initials } from "@/lib/utils";
import type { Holiday, HolidayGroup, HolidayOverride, HolidayType, RecordStatus } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Archive,
  PartyPopper,
  Users,
  ChevronsUpDown,
  ArrowRightLeft,
  ArrowLeft,
  Save,
  AlertCircle,
  FileSpreadsheet,
  Globe,
  Store,
  Building2,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

const COUNTRY_OPTIONS = [
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "SG", name: "Singapura", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "GLOBAL", name: "Internasional / Global", flag: "🌐" },
];

export function HolidayView() {
  const holidays = useStore((s) => s.holidays);
  const holidayGroups = useStore((s) => s.holidayGroups);
  const holidayOverrides = useStore((s) => s.holidayOverrides);

  const [activeTab, setActiveTab] = React.useState<"groups" | "holidays" | "swaps">("groups");

  // Full-page form state (zero popup modals for input!)
  const [formState, setFormState] = React.useState<{
    type: "group" | "holiday" | "swap" | null;
    mode: "create" | "edit";
    data?: any;
  }>({ type: null, mode: "create" });

  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<{ type: "group" | "holiday" | "swap"; id: string; name: string } | null>(null);

  const handleGenerateNationalHolidays = () => {
    const count = holidayService.generateNationalHolidaysByCountry("ID", 2026);
    if (count > 0) {
      toast.success(`${count} libur nasional Indonesia tahun 2026 berhasil ditambahkan!`);
    } else {
      toast.info("Seluruh libur nasional Indonesia tahun 2026 sudah terdaftar.");
    }
  };

  // Import fields for Holiday Module
  const holidayImportFields: ImportExportField[] = [
    { key: "name", label: "Nama Hari Libur / Group", priority: "wajib", defaultChecked: true, sampleValue: "Hari Raya Idul Fitri 1447 H" },
    { key: "date", label: "Tanggal (YYYY-MM-DD)", priority: "wajib", defaultChecked: true, sampleValue: todayISODate() },
    { key: "type", label: "Tipe Libur (NASIONAL/KEAGAMAAN/PERUSAHAAN)", priority: "wajib", defaultChecked: true, sampleValue: "NASIONAL" },
    { key: "country", label: "Kode Negara (ID/SG/MY/GLOBAL)", priority: "disarankan", defaultChecked: true, sampleValue: "ID" },
    { key: "description", label: "Deskripsi Catatan", priority: "opsional", defaultChecked: false, sampleValue: "Libur Operasional Seluruh Cabang" },
  ];

  if (formState.type === "group") {
    return (
      <HolidayGroupFormPage
        mode={formState.mode}
        data={formState.data as HolidayGroup | undefined}
        onBack={() => setFormState({ type: null, mode: "create" })}
      />
    );
  }

  if (formState.type === "holiday") {
    return (
      <HolidayFormPage
        mode={formState.mode}
        data={formState.data as Holiday | undefined}
        onBack={() => setFormState({ type: null, mode: "create" })}
      />
    );
  }

  if (formState.type === "swap") {
    return (
      <HolidaySwapFormPage
        mode={formState.mode}
        data={formState.data as HolidayOverride | undefined}
        onBack={() => setFormState({ type: null, mode: "create" })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hari Libur &amp; Penyesuaian"
        description="Kelola kelompok libur per outlet/divisi, master libur nasional per negara, dan tukar hari libur operasional."
        actions={
          <div className="flex flex-wrap items-center gap-2">
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

            {activeTab === "holidays" && (
              <Button
                variant="outline"
                onClick={handleGenerateNationalHolidays}
                className="gap-1.5 rounded-xl font-semibold border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs"
              >
                <span>🇮🇩 Auto-Populate Libur Nasional ID</span>
              </Button>
            )}

            {activeTab === "groups" && (
              <Button onClick={() => setFormState({ type: "group", mode: "create" })} className="gap-1.5 rounded-xl font-semibold text-xs">
                <Plus className="size-4" /> Tambah Holiday Group
              </Button>
            )}
            {activeTab === "holidays" && (
              <Button onClick={() => setFormState({ type: "holiday", mode: "create" })} className="gap-1.5 rounded-xl font-semibold text-xs">
                <Plus className="size-4" /> Tambah Hari Libur
              </Button>
            )}
            {activeTab === "swaps" && (
              <Button onClick={() => setFormState({ type: "swap", mode: "create" })} className="gap-1.5 rounded-xl font-semibold text-xs">
                <Plus className="size-4" /> Buat Tukar Libur
              </Button>
            )}
          </div>
        }
      />

      {/* Segmented Control Tab Switcher */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="inline-flex rounded-2xl bg-muted/60 p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-150",
              activeTab === "groups"
                ? "bg-background text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PartyPopper className="size-4 text-primary" />
            <span>Holiday Group</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary font-bold">
              {holidayGroups.filter((g) => g.status !== "archived").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("holidays")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-150",
              activeTab === "holidays"
                ? "bg-background text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe className="size-4 text-info" />
            <span>Hari Libur Nasional &amp; Negara</span>
            <span className="rounded-full bg-info/15 px-2 py-0.5 text-[10px] text-info font-bold">
              {holidays.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("swaps")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-150",
              activeTab === "swaps"
                ? "bg-background text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowRightLeft className="size-4 text-warning" />
            <span>Tukar &amp; Override Libur</span>
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] text-warning font-bold">
              {holidayOverrides.length}
            </span>
          </button>
        </div>
      </div>

      {/* Render Main Content depending on Tab */}
      {activeTab === "groups" && (
        <HolidayGroupsSection
          groups={holidayGroups}
          onEdit={(g) => setFormState({ type: "group", mode: "edit", data: g })}
          onArchive={(g) => setConfirmDelete({ type: "group", id: g.id, name: g.name })}
        />
      )}

      {activeTab === "holidays" && (
        <HolidaysTableSection
          holidays={holidays}
          onEdit={(h) => setFormState({ type: "holiday", mode: "edit", data: h })}
          onDelete={(h) => setConfirmDelete({ type: "holiday", id: h.id, name: h.name })}
        />
      )}

      {activeTab === "swaps" && (
        <HolidaySwapsSection
          swaps={holidayOverrides}
          onEdit={(s) => setFormState({ type: "swap", mode: "edit", data: s })}
          onDelete={(s) => setConfirmDelete({ type: "swap", id: s.id, name: s.reason })}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Hapus / Arsipkan Data Libur?"
        description={`"${confirmDelete?.name}" akan dihapus / diarsipkan.`}
        destructive
        confirmLabel="Hapus / Arsipkan"
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.type === "group") {
            holidayService.softDeleteGroup(confirmDelete.id);
            toast.success("Holiday group diarsipkan");
          } else if (confirmDelete.type === "holiday") {
            holidayService.deleteHoliday(confirmDelete.id);
            toast.success("Hari libur dihapus");
          }
        }}
      />

      <UniversalImportDialog
        moduleTitle="Master Hari Libur"
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={holidayImportFields}
      />

      <UniversalExportDialog
        moduleTitle="Master Hari Libur"
        open={exportOpen}
        onOpenChange={setExportOpen}
        fields={holidayImportFields}
        exportData={holidays as any[]}
      />
    </div>
  );
}

// ------------------------------------------------------------
// 1. Holiday Groups Table / Card Section
// ------------------------------------------------------------
function HolidayGroupsSection({
  groups,
  onEdit,
  onArchive,
}: {
  groups: HolidayGroup[];
  onEdit: (g: HolidayGroup) => void;
  onArchive: (g: HolidayGroup) => void;
}) {
  const outlets = useStore((s) => s.outlets);
  const divisions = useStore((s) => s.divisions);
  const employees = useStore((s) => s.employees);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {groups.filter((g) => g.status !== "archived").map((group) => {
        const targetOutletNames = (group.outletIds ?? []).map((id) => outlets.find((o) => o.id === id)?.name).filter(Boolean);
        const targetDivisionNames = (group.divisionIds ?? []).map((id) => divisions.find((d) => d.id === id)?.name).filter(Boolean);
        const activeMembers = employees.filter((e) => group.memberIds.includes(e.id) && e.status === "AKTIF").length;

        return (
          <Card key={group.id} className="group border-border/80 shadow-xs rounded-2xl transition-all hover:border-primary/40">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="size-4 text-primary" />
                    <CardTitle className="text-base font-bold">{group.name}</CardTitle>
                  </div>
                  {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}

                  {(targetOutletNames.length > 0 || targetDivisionNames.length > 0) && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {targetOutletNames.map((name) => (
                        <Badge key={name} variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                          <Store className="size-2.5 mr-1" /> {name}
                        </Badge>
                      ))}
                      {targetDivisionNames.map((name) => (
                        <Badge key={name} variant="outline" className="bg-info/10 text-info border-info/30 text-[10px]">
                          <Building2 className="size-2.5 mr-1" /> {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => onEdit(group)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive hover:text-destructive" onClick={() => onArchive(group)}>
                    <Archive className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Users className="size-3.5 text-primary" />
                  <span>{activeMembers} karyawan aktif terdaftar</span>
                </div>
                <StatusBadge status={group.status} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// 2. Master Holidays Full-Width DataTable
// ------------------------------------------------------------
function HolidaysTableSection({
  holidays,
  onEdit,
  onDelete,
}: {
  holidays: Holiday[];
  onEdit: (h: Holiday) => void;
  onDelete: (h: Holiday) => void;
}) {
  const columns = React.useMemo<ColumnDef<Holiday>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Tanggal Libur",
        size: 140,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground">
            <CalendarDays className="size-3.5 text-primary" />
            <span>{formatDateMed(row.original.date)}</span>
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Nama Hari Libur",
        size: 260,
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-sm text-foreground block">{row.original.name}</span>
            {row.original.description && <span className="text-[11px] text-muted-foreground">{row.original.description}</span>}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipe Libur",
        size: 130,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-bold">
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "country",
        header: "Negara",
        size: 140,
        cell: ({ row }) => {
          const countryCode = (row.original as any).country || "ID";
          const countryObj = COUNTRY_OPTIONS.find((c) => c.code === countryCode) || COUNTRY_OPTIONS[0]!;
          return (
            <Badge variant="secondary" className="gap-1 text-xs font-medium">
              <span>{countryObj.flag}</span>
              <span>{countryObj.name}</span>
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        size: 90,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => onEdit(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive hover:text-destructive" onClick={() => onDelete(row.original)}>
              <Archive className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  return <DataTable tableKey="holidays" data={holidays} columns={columns} searchPlaceholder="Cari nama hari libur nasional..." />;
}

// ------------------------------------------------------------
// 3. Holiday Swaps / Override Section
// ------------------------------------------------------------
function HolidaySwapsSection({
  swaps,
  onEdit,
  onDelete,
}: {
  swaps: HolidayOverride[];
  onEdit: (s: HolidayOverride) => void;
  onDelete: (s: HolidayOverride) => void;
}) {
  const outlets = useStore((s) => s.outlets);
  const employees = useStore((s) => s.employees);

  const columns = React.useMemo<ColumnDef<HolidayOverride>[]>(
    () => [
      {
        accessorKey: "reason",
        header: "Alasan Tukar / Override",
        size: 260,
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-sm text-foreground block">{row.original.reason}</span>
            <span className="text-[11px] text-muted-foreground font-mono">Tipe: {row.original.type}</span>
          </div>
        ),
      },
      {
        accessorKey: "originalHolidayDate",
        header: "Tanggal Asal Libur",
        size: 140,
        cell: ({ row }) => <span className="font-mono text-xs text-foreground font-semibold">{formatDateMed(row.original.originalHolidayDate || (row.original as any).originalDate || todayISODate())}</span>,
      },
      {
        accessorKey: "replacementDate",
        header: "Tanggal Pengganti / Masuk",
        size: 160,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-primary">
            {row.original.replacementDate ? formatDateMed(row.original.replacementDate) : "—"}
          </span>
        ),
      },
      {
        id: "scope",
        header: "Scope Cabang / Karyawan",
        size: 200,
        cell: ({ row }) => {
          const outletIds = (row.original as any).outletIds as string[] | undefined;
          if (!outletIds || outletIds.length === 0) {
            return <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">🌐 Seluruh Outlet (Global)</Badge>;
          }
          const names = outletIds.map((id) => outlets.find((o) => o.id === id)?.name.replace("JURI Bun — ", "")).filter(Boolean);
          return (
            <div className="flex flex-wrap gap-1">
              {names.map((n) => (
                <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        size: 90,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => onEdit(row.original)}>
              <Pencil className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [outlets, onEdit]
  );

  return <DataTable tableKey="holiday_swaps" data={swaps} columns={columns} searchPlaceholder="Cari penyesuaian libur..." />;
}

// ------------------------------------------------------------
// FULL-PAGE FORM 1: Holiday Group Form Page
// ------------------------------------------------------------
function HolidayGroupFormPage({
  mode,
  data,
  onBack,
}: {
  mode: "create" | "edit";
  data?: HolidayGroup;
  onBack: () => void;
}) {
  const employees = useStore((s) => s.employees);
  const holidays = useStore((s) => s.holidays);
  const outlets = useStore((s) => s.outlets);
  const divisions = useStore((s) => s.divisions);

  const [name, setName] = React.useState(data?.name ?? "");
  const [description, setDescription] = React.useState(data?.description ?? "");
  const [outletIds, setOutletIds] = React.useState<string[]>(data?.outletIds ?? []);
  const [divisionIds, setDivisionIds] = React.useState<string[]>(data?.divisionIds ?? []);
  const [memberIds, setMemberIds] = React.useState<string[]>(data?.memberIds ?? []);
  const [holidayIds, setHolidayIds] = React.useState<string[]>(data?.holidayIds ?? []);
  const [effectiveFrom, setEffectiveFrom] = React.useState(data?.effectiveFrom ?? todayISODate());
  const [effectiveUntil, setEffectiveUntil] = React.useState(data?.effectiveUntil ?? "");
  const [status, setStatus] = React.useState<RecordStatus>(data?.status ?? "active");
  const [memberOpen, setMemberOpen] = React.useState(false);
  const [error, setError] = React.useState<string>();

  // Otomatis tarik karyawan ketika outlet atau divisi dipilih!
  const syncEmployeesFromOutletsAndDivisions = (selectedOutlets: string[], selectedDivisions: string[]) => {
    if (selectedOutlets.length === 0 && selectedDivisions.length === 0) return;
    const matching = employees
      .filter(
        (e) =>
          e.status === "AKTIF" &&
          ((e.primaryOutletId && selectedOutlets.includes(e.primaryOutletId)) || selectedDivisions.includes(e.divisionId))
      )
      .map((e) => e.id);

    setMemberIds((prev) => Array.from(new Set([...prev, ...matching])));
  };

  const handleOutletToggle = (id: string) => {
    const next = outletIds.includes(id) ? outletIds.filter((x) => x !== id) : [...outletIds, id];
    setOutletIds(next);
    syncEmployeesFromOutletsAndDivisions(next, divisionIds);
  };

  const handleDivisionToggle = (id: string) => {
    const next = divisionIds.includes(id) ? divisionIds.filter((x) => x !== id) : [...divisionIds, id];
    setDivisionIds(next);
    syncEmployeesFromOutletsAndDivisions(outletIds, next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Nama kelompok wajib diisi."); return; }
    const payload = {
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
      outletIds,
      divisionIds,
      memberIds,
      holidayIds,
      effectiveFrom,
      effectiveUntil: effectiveUntil ? effectiveUntil : undefined,
      status,
    };
    if (mode === "edit" && data) {
      holidayService.updateGroup(data.id, payload);
      toast.success("Holiday group diperbarui");
    } else {
      holidayService.createGroup(payload);
      toast.success("Holiday group ditambahkan");
    }
    onBack();
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-12">
      <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/80 bg-background/95 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" type="button" onClick={onBack} className="size-8 text-muted-foreground hover:text-foreground rounded-xl" title="Kembali" aria-label="Kembali">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <PartyPopper className="size-5 text-primary" />
              {mode === "edit" ? `Edit Holiday Group — ${data?.name}` : "Tambah Holiday Group Baru"}
            </h1>
            <p className="text-xs text-muted-foreground">Form kelola kelompok hari libur per outlet / divisi.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onBack} className="rounded-xl">Batal</Button>
          <Button type="submit" className="gap-1.5 font-semibold rounded-xl px-5">
            <Save className="size-4" /> {mode === "edit" ? "Simpan Perubahan" : "Simpan Holiday Group"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/80 shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">1. Profil Holiday Group &amp; Scope Lokasi</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormRow>
                <Field label="Nama Holiday Group" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Holiday Group Seluruh Karyawan" className="font-semibold" />
                </Field>
                <Field label="Deskripsi (Opsional)">
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Catatan libur operasional" />
                </Field>
              </FormRow>

              <Field label="Pilih Scope Outlet / Divisi (Otomatis Menarik Karyawan Terkait)" hint="Karyawan di outlet/divisi terpilih akan otomatis terdaftar">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Cabang Outlet ({outletIds.length} dipilih):</p>
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/80 bg-muted/20 p-2.5 max-h-[120px] overflow-y-auto">
                      {outlets.filter((o) => o.status === "active").map((o) => {
                        const checked = outletIds.includes(o.id);
                        return (
                          <label key={o.id} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors", checked ? "bg-primary/15 border-primary text-primary font-semibold" : "bg-card border-border text-foreground hover:bg-muted/40")}>
                            <Checkbox checked={checked} onCheckedChange={() => handleOutletToggle(o.id)} className="size-3.5" />
                            <span>{o.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Divisi ({divisionIds.length} dipilih):</p>
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/80 bg-muted/20 p-2.5 max-h-[120px] overflow-y-auto">
                      {divisions.filter((d) => d.status === "active").map((d) => {
                        const checked = divisionIds.includes(d.id);
                        return (
                          <label key={d.id} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors", checked ? "bg-primary/15 border-primary text-primary font-semibold" : "bg-card border-border text-foreground hover:bg-muted/40")}>
                            <Checkbox checked={checked} onCheckedChange={() => handleDivisionToggle(d.id)} className="size-3.5" />
                            <span>{d.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/80 shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
                <span>Anggota Karyawan</span>
                <span className="text-xs font-normal text-muted-foreground">{memberIds.length} terpilih</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Popover open={memberOpen} onOpenChange={setMemberOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal rounded-xl">
                    {memberIds.length === 0 ? "Pilih anggota..." : `${memberIds.length} karyawan terpilih`}
                    <ChevronsUpDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari karyawan..." />
                    <CommandList>
                      <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {employees.filter((e) => e.status === "AKTIF").map((e) => (
                          <CommandItem key={e.id} value={`${e.fullName} ${e.nik}`} onSelect={() => setMemberIds((prev) => prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id])}>
                            <Checkbox checked={memberIds.includes(e.id)} className="mr-2" />
                            <span className="flex-1 text-sm">{e.fullName}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Status Aktif</span>
                <Switch checked={status === "active"} onCheckedChange={(c) => setStatus(c ? "active" : "inactive")} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// FULL-PAGE FORM 2: Master Holiday Form Page with Country Selector
// ------------------------------------------------------------
function HolidayFormPage({
  mode,
  data,
  onBack,
}: {
  mode: "create" | "edit";
  data?: Holiday;
  onBack: () => void;
}) {
  const [name, setName] = React.useState(data?.name ?? "");
  const [date, setDate] = React.useState(data?.date ?? todayISODate());
  const [type, setType] = React.useState<HolidayType>(data?.type ?? "NASIONAL");
  const [country, setCountry] = React.useState<string>((data as any)?.country ?? "ID");
  const [description, setDescription] = React.useState(data?.description ?? "");
  const [error, setError] = React.useState<string>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Nama hari libur wajib diisi."); return; }
    const payload = {
      name: name.trim(),
      date,
      type,
      country,
      description: description.trim() ? description.trim() : undefined,
    };
    if (mode === "edit" && data) {
      holidayService.updateHoliday(data.id, payload as any);
      toast.success("Hari libur diperbarui");
    } else {
      holidayService.createHoliday(payload as any);
      toast.success("Hari libur ditambahkan");
    }
    onBack();
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-12">
      <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/80 bg-background/95 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" type="button" onClick={onBack} className="size-8 text-muted-foreground hover:text-foreground rounded-xl" title="Kembali" aria-label="Kembali">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              {mode === "edit" ? `Edit Hari Libur — ${data?.name}` : "Tambah Hari Libur Nasional & Negara"}
            </h1>
            <p className="text-xs text-muted-foreground">Input data libur nasional lengkap dengan penentuan negara terdaftar.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onBack} className="rounded-xl">Batal</Button>
          <Button type="submit" className="gap-1.5 font-semibold rounded-xl px-5">
            <Save className="size-4" /> {mode === "edit" ? "Simpan Perubahan" : "Simpan Hari Libur"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="max-w-2xl border-border/80 shadow-xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold text-foreground">Informasi Hari Libur &amp; Negara Target</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <Field label="Nama Hari Libur" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hari Raya Idul Fitri 1447 H" className="font-semibold" />
          </Field>

          <FormRow>
            <Field label="Tanggal Libur">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Tipe Hari Libur">
              <Select value={type} onValueChange={(v) => setType(v as HolidayType)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NASIONAL">🔴 Nasional</SelectItem>
                  <SelectItem value="KEAGAMAAN">🔵 Keagamaan</SelectItem>
                  <SelectItem value="PERUSAHAAN">🟡 Perusahaan</SelectItem>
                  <SelectItem value="ADDITIONAL">⚪ Tambahan</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormRow>

          <Field label="Pilih Negara Target (Kategori Libur Nasional)" hint="Menentukan skema libur nasional berdasarkan negara tempat outlet/karyawan berada">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="rounded-xl font-semibold"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="mr-2">{c.flag}</span>
                    <span>{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Catatan / Deskripsi Libur (Opsional)">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instruksi operasional cabang saat libur" />
          </Field>
        </CardContent>
      </Card>
    </form>
  );
}

// ------------------------------------------------------------
// FULL-PAGE FORM 3: Holiday Swap / Workday Override Form Page (Global or Multi-Outlet Scope)
// ------------------------------------------------------------
function HolidaySwapFormPage({
  mode,
  data,
  onBack,
}: {
  mode: "create" | "edit";
  data?: HolidayOverride;
  onBack: () => void;
}) {
  const outlets = useStore((s) => s.outlets);
  const employees = useStore((s) => s.employees);

  const [reason, setReason] = React.useState(data?.reason ?? "");
  const [originalDate, setOriginalDate] = React.useState(data?.originalHolidayDate ?? todayISODate());
  const [replacementDate, setReplacementDate] = React.useState(data?.replacementDate ?? "");
  const [scopeType, setScopeType] = React.useState<"GLOBAL" | "MULTI_OUTLET">((data as any)?.scopeType ?? "GLOBAL");
  const [selectedOutletIds, setSelectedOutletIds] = React.useState<string[]>((data as any)?.outletIds ?? []);
  const [error, setError] = React.useState<string>();

  // Otomatis deteksi jumlah karyawan yang tercakup dalam override
  const resolvedEmployeesCount = React.useMemo(() => {
    if (scopeType === "GLOBAL") {
      return employees.filter((e) => e.status === "AKTIF").length;
    }
    return employees.filter((e) => e.status === "AKTIF" && e.primaryOutletId && selectedOutletIds.includes(e.primaryOutletId)).length;
  }, [employees, scopeType, selectedOutletIds]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Alasan penyesuaian libur wajib diisi."); return; }
    toast.success("Tukar libur / override berhasil disimpan!");
    onBack();
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-12">
      <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/80 bg-background/95 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" type="button" onClick={onBack} className="size-8 text-muted-foreground hover:text-foreground rounded-xl" title="Kembali" aria-label="Kembali">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-warning" />
              {mode === "edit" ? "Edit Tukar Hari Libur" : "Buat Tukar Hari Libur / Workday Override Baru"}
            </h1>
            <p className="text-xs text-muted-foreground">Form penyesuaian tukar libur operasional cabang atau seluruh perusahaan.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onBack} className="rounded-xl">Batal</Button>
          <Button type="submit" className="gap-1.5 font-semibold rounded-xl px-5">
            <Save className="size-4" /> Simpan Penyesuaian Libur
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="max-w-2xl border-border/80 shadow-xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold text-foreground">Detail Penyesuaian Tanggal &amp; Target Outlet</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <Field label="Alasan Penyesuaian / Alasan Tukar Libur" required>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Penyesuaian shift Idul Fitri cabang mall" className="font-semibold" />
          </Field>

          <FormRow>
            <Field label="Tanggal Asal Libur">
              <Input type="date" value={originalDate} onChange={(e) => setOriginalDate(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Tanggal Pengganti / Masuk Kerjanya">
              <Input type="date" value={replacementDate} onChange={(e) => setReplacementDate(e.target.value)} className="font-mono" />
            </Field>
          </FormRow>

          <Field label="Target Scope Outlet">
            <Select value={scopeType} onValueChange={(v) => setScopeType(v as any)}>
              <SelectTrigger className="rounded-xl font-semibold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">🌐 Seluruh Outlet &amp; HQ (Global)</SelectItem>
                <SelectItem value="MULTI_OUTLET">🏪 Outlet Cabang Spesifik</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {scopeType === "MULTI_OUTLET" && (
            <Field label="Pilih Cabang Outlet yang Mengikuti Tukar Libur Ini">
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/80 bg-muted/20 p-2.5 max-h-[140px] overflow-y-auto">
                {outlets.filter((o) => o.status === "active").map((o) => {
                  const checked = selectedOutletIds.includes(o.id);
                  return (
                    <label key={o.id} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors", checked ? "bg-primary/15 border-primary text-primary font-semibold" : "bg-card border-border text-foreground hover:bg-muted/40")}>
                      <Checkbox checked={checked} onCheckedChange={() => setSelectedOutletIds((prev) => prev.includes(o.id) ? prev.filter((x) => x !== o.id) : [...prev, o.id])} className="size-3.5" />
                      <span>{o.name}</span>
                    </label>
                  );
                })}
              </div>
            </Field>
          )}

          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span className="font-semibold text-foreground">Karyawan Otomatis Terpengaruh:</span>
            </div>
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-bold">
              {resolvedEmployeesCount} karyawan terdaftar
            </Badge>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
