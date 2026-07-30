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
import { Switch } from "@/components/ui/switch";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field, FormRow } from "@/components/common/field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { useStore } from "@/hooks/use-store";
import { shiftGroupService, shiftTemplateService } from "@/lib/services/schedule";
import { formatDateMed, todayISODate, shiftDurationMinutes, formatDuration, cn, initials } from "@/lib/utils";
import type { ShiftGroup, ShiftTemplate, WeeklyPatternDay, RecordStatus } from "@/lib/types";
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
  CalendarDays,
  Users,
  ChevronsUpDown,
  ArrowLeft,
  Save,
  AlertCircle,
  Clock,
  Sun,
  Moon,
  AlarmClock,
  CheckCircle2,
  Palette,
  Building2,
  Store,
  FileSpreadsheet,
} from "lucide-react";

const DAYS = [
  { day: 1, label: "Sen", short: "Senin" },
  { day: 2, label: "Sel", short: "Selasa" },
  { day: 3, label: "Rab", short: "Rabu" },
  { day: 4, label: "Kam", short: "Kamis" },
  { day: 5, label: "Jum", short: "Jumat" },
  { day: 6, label: "Sab", short: "Sabtu" },
  { day: 0, label: "Min", short: "Minggu" },
];

const PRESET_COLORS = [
  "#FCBA0C",
  "#E8A604",
  "#C2780C",
  "#3A2518",
  "#74665D",
  "#2F855A",
  "#2B6CB0",
  "#DC2626",
];

export function ShiftGroupsView() {
  const shiftGroups = useStore((s) => s.shiftGroups);
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const schedules = useStore((s) => s.schedules);

  const [activeTab, setActiveTab] = React.useState<"groups" | "templates">("groups");

  const [groupDialog, setGroupDialog] = React.useState<{ mode: "create" | "edit"; data?: ShiftGroup } | null>(null);
  const [templateDialog, setTemplateDialog] = React.useState<{ mode: "create" | "edit"; data?: ShiftTemplate } | null>(null);

  const [confirmGroup, setConfirmGroup] = React.useState<{ id: string; name: string } | null>(null);
  const [confirmTemplate, setConfirmTemplate] = React.useState<{ id: string; name: string } | null>(null);

  // Hitung penggunaan tiap shift template
  const templateUsageCount = React.useMemo(() => {
    const m = new Map<string, number>();
    schedules.forEach((s) => {
      if (s.shiftTemplateId) m.set(s.shiftTemplateId, (m.get(s.shiftTemplateId) ?? 0) + 1);
    });
    return m;
  }, [schedules]);

  const [importOpen, setImportOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

  const shiftImportFields: ImportExportField[] = [
    { key: "name", label: "Nama Shift / Group", priority: "wajib", defaultChecked: true, sampleValue: "Shift Pagi Operasional" },
    { key: "startTime", label: "Jam Mulai (HH:mm)", priority: "wajib", defaultChecked: true, sampleValue: "07:00" },
    { key: "endTime", label: "Jam Selesai (HH:mm)", priority: "wajib", defaultChecked: true, sampleValue: "15:00" },
    { key: "toleranceLateMinutes", label: "Toleransi Terlambat (Menit)", priority: "disarankan", defaultChecked: true, sampleValue: "5" },
    { key: "crossesMidnight", label: "Lewat Malam (true/false)", priority: "disarankan", defaultChecked: true, sampleValue: "false" },
    { key: "color", label: "Kode Warna (Hex)", priority: "opsional", defaultChecked: false, sampleValue: "#FCBA0C" },
  ];

  if (groupDialog) {
    return (
      <ShiftGroupFormPage
        mode={groupDialog.mode}
        data={groupDialog.data}
        onBack={() => setGroupDialog(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift &amp; Pola Kerja"
        description="Kelola pola shift mingguan per outlet/divisi dan master template jam kerja dalam satu modul."
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
            {activeTab === "groups" ? (
              <Button onClick={() => setGroupDialog({ mode: "create" })} className="gap-1.5 rounded-xl font-semibold">
                <Plus className="size-4" /> Tambah Shift Group
              </Button>
            ) : (
              <Button onClick={() => setTemplateDialog({ mode: "create" })} className="gap-1.5 rounded-xl font-semibold">
                <Plus className="size-4" /> Tambah Shift Template
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
            <CalendarDays className="size-4 text-primary" />
            <span>Pola Shift Group</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary font-bold">
              {shiftGroups.filter((g) => g.status !== "archived").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-150",
              activeTab === "templates"
                ? "bg-background text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="size-4 text-info" />
            <span>Template Jam Kerja</span>
            <span className="rounded-full bg-info/15 px-2 py-0.5 text-[10px] text-info font-bold">
              {shiftTemplates.filter((s) => s.status !== "archived").length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "groups" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shiftGroups.filter((g) => g.status !== "archived").map((group) => (
            <ShiftGroupCard
              key={group.id}
              group={group}
              onEdit={() => setGroupDialog({ mode: "edit", data: group })}
              onArchive={() => setConfirmGroup({ id: group.id, name: group.name })}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shiftTemplates.filter((s) => s.status !== "archived").map((shift) => {
            const duration = shiftDurationMinutes(shift.startTime, shift.endTime, shift.crossesMidnight);
            const usage = templateUsageCount.get(shift.id) ?? 0;
            return (
              <Card
                key={shift.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 transition-all hover:-translate-y-0.5"
              >
                <div className="h-1.5 w-full" style={{ background: shift.color }} />
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex size-10 items-center justify-center rounded-xl text-white"
                        style={{ background: shift.color }}
                      >
                        {shift.crossesMidnight ? <Moon className="size-5" /> : <Sun className="size-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{shift.name}</p>
                        <p className="text-[11px] text-muted-foreground">{usage} jadwal aktif</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg"
                        onClick={() => setTemplateDialog({ mode: "edit", data: shift })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg text-destructive hover:text-destructive"
                        onClick={() => setConfirmTemplate({ id: shift.id, name: shift.name })}
                      >
                        <Archive className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 border border-border/60">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="font-mono text-sm font-bold text-foreground">
                      {shift.startTime} – {shift.endTime}
                    </span>
                    {shift.crossesMidnight ? (
                      <Badge className="ml-auto bg-info/15 text-info border-info/30 text-[10px]">Lewat Malam</Badge>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 rounded-xl border border-border/60 px-2.5 py-1.5">
                      <AlarmClock className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Toleransi</span>
                      <span className="ml-auto font-semibold text-foreground">{shift.toleranceLateMinutes}m</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-border/60 px-2.5 py-1.5">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Durasi</span>
                      <span className="ml-auto font-semibold text-foreground">{formatDuration(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      {shift.phConfig.isPH ? (
                        <Badge className="bg-primary/15 text-primary border-primary/30 font-semibold text-[10px]">
                          <CheckCircle2 className="size-3 mr-1" /> PH
                          {shift.phConfig.multiplier ? ` ×${shift.phConfig.multiplier}` : ""}
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Bukan PH</span>
                      )}
                    </div>
                    <StatusBadge status={shift.status} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {templateDialog ? (
        <ShiftTemplateDialog
          open
          onOpenChange={(o) => !o && setTemplateDialog(null)}
          mode={templateDialog.mode}
          data={templateDialog.data}
        />
      ) : null}

      <ConfirmDialog
        open={!!confirmGroup}
        onOpenChange={(o) => !o && setConfirmGroup(null)}
        title="Arsipkan shift group?"
        description={`"${confirmGroup?.name}" akan diarsipkan.`}
        destructive
        confirmLabel="Arsipkan"
        onConfirm={() => {
          if (confirmGroup) {
            shiftGroupService.softDelete(confirmGroup.id);
            toast.success("Shift group diarsipkan");
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmTemplate}
        onOpenChange={(o) => !o && setConfirmTemplate(null)}
        title="Arsipkan shift template?"
        description={`"${confirmTemplate?.name}" akan diarsipkan.`}
        destructive
        confirmLabel="Arsipkan"
        onConfirm={() => {
          if (confirmTemplate) {
            shiftTemplateService.softDelete(confirmTemplate.id);
            toast.success("Shift template diarsipkan");
          }
        }}
      />

      <UniversalImportDialog
        moduleTitle={activeTab === "groups" ? "Shift Group" : "Shift Template"}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(rows) => {
          if (activeTab === "templates") {
            let created = 0, skipped = 0;
            for (const row of rows) {
              const name = row.name?.trim();
              const startTime = row.startTime?.trim();
              const endTime = row.endTime?.trim();
              if (!name || !startTime || !endTime) { skipped++; continue; }
              const crosses = row.crossesMidnight?.trim().toLowerCase() === "true";
              shiftTemplateService.create({
                name, startTime, endTime,
                toleranceLateMinutes: Number(row.toleranceLateMinutes) || 5,
                crossesMidnight: crosses,
                color: row.color?.trim() || "#FCBA0C",
                status: "active",
                phConfig: { isPH: false },
              });
              created++;
            }
            if (skipped > 0) toast.warning(`${created} shift template ditambah, ${skipped} dilewati (data invalid).`);
            else toast.success(`${created} shift template berhasil ditambahkan.`);
          } else {
            toast.info("Import Shift Group belum didukung. Silakan gunakan form tambah Shift Group untuk membuat kelompok shift lengkap dengan pola mingguan dan anggota.");
          }
        }}
        fields={shiftImportFields}
      />

      <UniversalExportDialog
        moduleTitle={activeTab === "groups" ? "Shift Group" : "Shift Template"}
        open={exportOpen}
        onOpenChange={setExportOpen}
        fields={shiftImportFields}
        exportData={activeTab === "groups" ? (shiftGroups as any[]) : (shiftTemplates as any[])}
      />
    </div>
  );
}

function ShiftGroupCard({
  group,
  onEdit,
  onArchive,
}: {
  group: ShiftGroup;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  const divisions = useStore((s) => s.divisions);

  const getShiftName = (id?: string) => {
    if (!id) return "Libur";
    const st = shiftTemplates.find((t) => t.id === id);
    return st?.name ?? "Custom";
  };

  const getShiftColor = (id?: string) => {
    if (!id) return "#74665D";
    const st = shiftTemplates.find((t) => t.id === id);
    return st?.color ?? "#FCBA0C";
  };

  const activeMembers = employees.filter(
    (e) => group.memberIds.includes(e.id) && e.status === "AKTIF"
  ).length;

  const targetOutletNames = (group.outletIds ?? []).map((id) => outlets.find((o) => o.id === id)?.name).filter(Boolean);
  const targetDivisionNames = (group.divisionIds ?? []).map((id) => divisions.find((d) => d.id === id)?.name).filter(Boolean);

  return (
    <Card className="group rounded-2xl border border-border/60 transition-all hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <CardTitle className="text-base font-bold">{group.name}</CardTitle>
            </div>

            {(targetOutletNames.length > 0 || targetDivisionNames.length > 0) && (
              <div className="flex flex-wrap gap-1 pt-1">
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
            <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-destructive hover:text-destructive"
              onClick={onArchive}
            >
              <Archive className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(({ day, label }) => {
            const pat = group.weeklyPattern.find((p) => p.day === day);
            const shiftId = pat?.shiftTemplateId;
            const shiftName = getShiftName(shiftId);
            const color = getShiftColor(shiftId);
            const isOff = !shiftId;
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl p-1.5 text-center border border-border/60 transition-colors",
                  isOff ? "bg-muted/30 text-muted-foreground" : "bg-card"
                )}
              >
                <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
                <div
                  className="mt-1 flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: color }}
                >
                  {isOff ? "L" : shiftName.charAt(0)}
                </div>
                <span className="mt-1 truncate text-[9px] font-medium text-foreground w-full">
                  {shiftName}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
            <Users className="size-3.5 text-primary" />
            <span>{activeMembers} karyawan aktif</span>
          </div>
          <StatusBadge status={group.status} />
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Full-Page Shift Group Form Component (ERPNext Architecture with Auto Employee Assignment)
// ------------------------------------------------------------
function ShiftGroupFormPage({
  mode,
  data,
  onBack,
}: {
  mode: "create" | "edit";
  data?: ShiftGroup;
  onBack: () => void;
}) {
  const employees = useStore((s) => s.employees);
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const outlets = useStore((s) => s.outlets);
  const divisions = useStore((s) => s.divisions);

  const [name, setName] = React.useState(data?.name ?? "");
  const [outletIds, setOutletIds] = React.useState<string[]>(data?.outletIds ?? []);
  const [divisionIds, setDivisionIds] = React.useState<string[]>(data?.divisionIds ?? []);
  const [effectiveFrom, setEffectiveFrom] = React.useState(data?.effectiveFrom ?? todayISODate());
  const [effectiveUntil, setEffectiveUntil] = React.useState(data?.effectiveUntil ?? "");
  const [status, setStatus] = React.useState<RecordStatus>(data?.status ?? "active");
  const [memberIds, setMemberIds] = React.useState<string[]>(data?.memberIds ?? []);

  const [weeklyPattern, setWeeklyPattern] = React.useState<WeeklyPatternDay[]>(
    data?.weeklyPattern ??
      DAYS.map((d) => ({
        day: d.day,
        shiftTemplateId: d.day === 0 ? undefined : shiftTemplates[0]?.id,
      }))
  );

  const [memberOpen, setMemberOpen] = React.useState(false);
  const [error, setError] = React.useState<string>();

  // Automatic Employee Assignment when Outlet or Division toggles!
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

  const setDayShift = (day: number, shiftTemplateId?: string) => {
    setWeeklyPattern((prev) =>
      prev.map((p) => (p.day === day ? { ...p, shiftTemplateId } : p))
    );
  };

  const toggleMember = (empId: string) => {
    setMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama group wajib diisi.");
      return;
    }
    if (effectiveUntil && effectiveFrom > effectiveUntil) {
      setError("Tanggal berlaku sampai harus setelah tanggal berlaku dari.");
      return;
    }
    const scopeType = outletIds.length > 0 && divisionIds.length > 0 ? "MULTI_OUTLET" as const
      : divisionIds.length > 0 ? "MULTI_DIVISI" as const
      : "MULTI_OUTLET" as const;
    const payload = {
      name: name.trim(),
      scopeType,
      outletIds,
      divisionIds,
      effectiveFrom,
      effectiveUntil: effectiveUntil ? effectiveUntil : undefined,
      status,
      weeklyPattern,
      memberIds,
    };
    if (mode === "edit" && data) {
      shiftGroupService.update(data.id, payload);
      toast.success("Shift group diperbarui");
    } else {
      shiftGroupService.create(payload);
      toast.success("Shift group baru ditambahkan");
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
              <CalendarDays className="size-5 text-primary" />
              {mode === "edit" ? `Edit Shift Group — ${data?.name}` : "Tambah Shift Group Baru"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Pengaturan pola shift mingguan, lokasi outlet/divisi, dan anggota karyawan otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onBack} className="rounded-xl">
            Batal
          </Button>
          <Button type="submit" className="gap-1.5 font-semibold rounded-xl px-5">
            <Save className="size-4" />
            {mode === "edit" ? "Simpan Perubahan" : "Simpan Shift Group"}
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
          <Card className="rounded-2xl border border-border/60">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">1. Profil Group &amp; Scope Multi-Outlet / Divisi</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Field label="Nama Shift Group" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Shift Outlet Sudirman &amp; Kemang" className="font-semibold" />
              </Field>

              <Field label="Pilih Scope Outlet / Divisi (Otomatis Menarik Karyawan Terkait)" hint="Karyawan di outlet/divisi terpilih akan otomatis terdaftar sebagai anggota shift ini">
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

              <FormRow>
                <Field label="Tanggal Berlaku Dari">
                  <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                </Field>
                <Field label="Tanggal Berlaku Sampai" hint="Kosongkan untuk berlaku seterusnya">
                  <Input type="date" value={effectiveUntil} onChange={(e) => setEffectiveUntil(e.target.value)} />
                </Field>
              </FormRow>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">2. Pola Jam Kerja Mingguan (Senin – Minggu)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {DAYS.map(({ day, short }) => {
                const pat = weeklyPattern.find((p) => p.day === day);
                const currentShiftId = pat?.shiftTemplateId;
                return (
                  <div key={day} className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-24 font-bold text-sm text-foreground">{short}</div>
                    <div className="flex flex-1 items-center gap-2">
                      <Select
                        value={currentShiftId ?? "OFF"}
                        onValueChange={(val) => setDayShift(day, val === "OFF" ? undefined : val)}
                      >
                        <SelectTrigger className="w-full sm:w-[260px] rounded-xl font-medium">
                          <SelectValue placeholder="Pilih shift..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OFF" className="font-semibold text-muted-foreground">
                            Libur (OFF)
                          </SelectItem>
                          {shiftTemplates
                            .filter((t) => t.status === "active")
                            .map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name} ({t.startTime} - {t.endTime})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-border/60">
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
                          <CommandItem key={e.id} value={`${e.fullName} ${e.nik}`} onSelect={() => toggleMember(e.id)}>
                            <Checkbox checked={memberIds.includes(e.id)} className="mr-2" />
                            <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">{initials(e.fullName)}</div>
                            <span className="flex-1 text-sm">{e.fullName}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{e.nik}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex flex-wrap gap-1.5 max-h-[260px] overflow-y-auto pt-1">
                {memberIds.map((id) => {
                  const emp = employees.find((e) => e.id === id);
                  if (!emp) return null;
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 rounded-lg text-xs py-1">
                      <span>{emp.fullName}</span>
                      <button type="button" onClick={() => toggleMember(id)} className="ml-1 text-muted-foreground hover:text-foreground">×</button>
                    </Badge>
                  );
                })}
              </div>

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

function ShiftTemplateDialog({
  open,
  onOpenChange,
  mode,
  data,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  data?: ShiftTemplate;
}) {
  const [name, setName] = React.useState(data?.name ?? "");
  const [startTime, setStartTime] = React.useState(data?.startTime ?? "07:00");
  const [endTime, setEndTime] = React.useState(data?.endTime ?? "15:00");
  const [tolerance, setTolerance] = React.useState(String(data?.toleranceLateMinutes ?? 5));
  const [crossesMidnight, setCrossesMidnight] = React.useState(data?.crossesMidnight ?? false);
  const [color, setColor] = React.useState(data?.color ?? "#FCBA0C");
  const [status, setStatus] = React.useState<RecordStatus>(data?.status ?? "active");
  const [isPH, setIsPH] = React.useState(data?.phConfig.isPH ?? false);
  const [multiplier, setMultiplier] = React.useState(String(data?.phConfig.multiplier ?? 2));
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setName(data?.name ?? "");
    setStartTime(data?.startTime ?? "07:00");
    setEndTime(data?.endTime ?? "15:00");
    setTolerance(String(data?.toleranceLateMinutes ?? 5));
    setCrossesMidnight(data?.crossesMidnight ?? false);
    setColor(data?.color ?? "#FCBA0C");
    setStatus(data?.status ?? "active");
    setIsPH(data?.phConfig.isPH ?? false);
    setMultiplier(String(data?.phConfig.multiplier ?? 2));
    setError(undefined);
  }, [open, data]);

  const duration = shiftDurationMinutes(startTime, endTime, crossesMidnight);

  const submit = () => {
    if (!name.trim()) {
      setError("Nama shift wajib diisi.");
      return;
    }
    const payload = {
      name: name.trim(),
      startTime,
      endTime,
      toleranceLateMinutes: Math.max(0, Number(tolerance) || 0),
      crossesMidnight,
      color,
      status,
      phConfig: {
        isPH,
        multiplier: isPH ? Number(multiplier) || 1 : undefined,
      },
    };
    if (mode === "edit" && data) {
      shiftTemplateService.update(data.id, payload);
      toast.success("Shift template diperbarui");
    } else {
      try {
        shiftTemplateService.create(payload);
        toast.success("Shift template ditambahkan");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menambah shift template");
        return;
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            {mode === "edit" ? "Edit Shift Template" : "Tambah Shift Template"}
          </DialogTitle>
          <DialogDescription>Default toleransi keterlambatan adalah 5 menit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nama Shift" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Shift Pagi" className="font-semibold" />
          </Field>
          <FormRow>
            <Field label="Jam Mulai">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Jam Selesai">
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="font-mono" />
            </Field>
          </FormRow>
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Durasi shift</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-foreground">{formatDuration(duration)}</span>
          </div>
          <FormRow>
            <Field label="Toleransi Terlambat (menit)">
              <Input type="number" value={tolerance} onChange={(e) => setTolerance(e.target.value)} className="tabular-nums font-mono" />
            </Field>
            <Field label="Status">
              <div className="flex items-center gap-2">
                <Switch checked={status === "active"} onCheckedChange={(c) => setStatus(c ? "active" : "inactive")} />
                <span className="text-sm">{status === "active" ? "Aktif" : "Nonaktif"}</span>
              </div>
            </Field>
          </FormRow>
          <div className="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2">
            <div className="flex items-center gap-2">
              <Moon className="size-4 text-info" />
              <div>
                <p className="text-sm font-medium text-foreground">Lewat Tengah Malam</p>
                <p className="text-[11px] text-muted-foreground">Shift berakhir keesokan hari</p>
              </div>
            </div>
            <Switch checked={crossesMidnight} onCheckedChange={setCrossesMidnight} />
          </div>

          <Field label="Warna Identitas">
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-8 rounded-lg border-2 transition-all hover:scale-110",
                    color === c ? "border-foreground ring-2 ring-primary/30" : "border-transparent",
                  )}
                  style={{ background: c }}
                  aria-label={`Pilih warna ${c}`}
                />
              ))}
              <div className="relative">
                <Palette className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer border-border p-0.5 pl-7 rounded-lg"
                />
              </div>
            </div>
          </Field>

          <div className="space-y-3 rounded-xl border border-border/80 p-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Konfigurasi PH (Partial Holiday)</p>
                  <p className="text-[11px] text-muted-foreground">Shift dihitung PH saat hari libur</p>
                </div>
              </div>
              <Switch checked={isPH} onCheckedChange={setIsPH} />
            </div>
            {isPH ? (
              <Field label="Faktor Pengali PH">
                <Input type="number" step="0.5" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} className="tabular-nums font-mono" />
              </Field>
            ) : null}
          </div>

          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
          <Button onClick={submit} className="rounded-xl font-semibold">{mode === "edit" ? "Simpan" : "Tambah"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
