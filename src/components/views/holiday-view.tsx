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
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field, FormRow } from "@/components/common/field";
import { InfoRow } from "@/components/common/info-row";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/states";
import { useStore } from "@/hooks/use-store";
import { holidayService } from "@/lib/services/schedule";
import { lookupService } from "@/lib/services/master-data";
import {
  formatDateMed,
  formatDateLong,
  todayISODate,
  addDaysISO,
  cn,
  initials,
  monthLabel,
} from "@/lib/utils";
import type {
  Holiday,
  HolidayGroup,
  HolidayOverride,
  HolidayOverrideType,
  HolidayType,
  RecordStatus,
} from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Archive,
  Trash2,
  PartyPopper,
  CalendarDays,
  Users,
  ChevronsUpDown,
  ArrowRightLeft,
  CalendarPlus,
  CalendarX,
  CalendarOff,
  UserCog,
  Eye,
  ArrowLeft,
  Save,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

const HOLIDAY_TYPE_LABEL: Record<HolidayType, string> = {
  NASIONAL: "Nasional",
  KEAGAMAAN: "Keagamaan",
  PERUSAHAAN: "Perusahaan",
  ADDITIONAL: "Tambahan",
  CANCELLED: "Dibatalkan",
};

const HOLIDAY_TYPE_STYLE: Record<HolidayType, string> = {
  NASIONAL: "bg-destructive/10 text-destructive border-destructive/30",
  KEAGAMAAN: "bg-info/10 text-info border-info/30",
  PERUSAHAAN: "bg-primary/15 text-primary-foreground border-primary/30",
  ADDITIONAL: "bg-success/10 text-success border-success/30",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

const OVERRIDE_TYPE_META: Record<HolidayOverrideType, { label: string; icon: typeof ArrowRightLeft; color: string }> = {
  HOLIDAY_SWAP: { label: "Holiday Swap", icon: ArrowRightLeft, color: "text-info" },
  WORKDAY_OVERRIDE: { label: "Workday Override", icon: CalendarOff, color: "text-warning" },
  ADDITIONAL_HOLIDAY: { label: "Additional Holiday", icon: CalendarPlus, color: "text-success" },
  CANCELLED_HOLIDAY: { label: "Cancelled Holiday", icon: CalendarX, color: "text-destructive" },
  EMPLOYEE_SPECIFIC: { label: "Employee Specific", icon: UserCog, color: "text-primary" },
};

export function HolidayView() {
  const [activeGroup, setActiveGroup] = React.useState<string | null>(null);
  const holidayGroups = useStore((s) => s.holidayGroups);
  const [groupDialog, setGroupDialog] = React.useState<{ mode: "create" | "edit"; data?: HolidayGroup } | null>(null);
  const [holidayDialog, setHolidayDialog] = React.useState(false);
  const [overrideDialog, setOverrideDialog] = React.useState(false);
  const [confirm, setConfirm] = React.useState<{ type: "group" | "holiday" | "override"; id: string; name: string } | null>(null);
  const [previewOverride, setPreviewOverride] = React.useState<HolidayOverride | null>(null);

  const activeGroups = holidayGroups.filter((g) => g.status !== "archived");
  const selected = activeGroup ? holidayGroups.find((g) => g.id === activeGroup) : null;

  React.useEffect(() => {
    if (!activeGroup && activeGroups.length > 0) setActiveGroup(activeGroups[0]!.id);
  }, [activeGroups, activeGroup]);

  if (groupDialog) {
    return (
      <HolidayGroupFormPage
        mode={groupDialog.mode}
        data={groupDialog.data}
        onBack={() => setGroupDialog(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Holiday Group"
        description="Kelola hari libur, anggota grup, holiday swap, dan workday override."
        actions={
          <>
            <Button variant="outline" onClick={() => setHolidayDialog(true)}>
              <Plus className="size-4" /> Hari Libur
            </Button>
            <Button onClick={() => setGroupDialog({ mode: "create" })}>
              <Plus className="size-4" /> Holiday Group
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Group list */}
        <Card className="border-border shadow-soft lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PartyPopper className="size-4 text-primary" /> Daftar Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border p-3 text-left transition-all",
                  activeGroup === g.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/30",
                )}
              >
                <div className={cn("flex size-9 items-center justify-center rounded-lg", activeGroup === g.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                  <PartyPopper className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="size-3" /> {g.memberIds.length} anggota · {g.holidayIds.length} libur
                  </p>
                </div>
                <StatusBadge status={g.status} />
              </button>
            ))}
            {activeGroups.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Belum ada holiday group.</p>
            ) : null}
          </CardContent>
        </Card>

        {/* Group detail */}
        <div className="space-y-4 lg:col-span-2">
          {selected ? (
            <>
              <GroupDetail
                group={selected}
                onEdit={() => setGroupDialog({ mode: "edit", data: selected })}
                onArchive={() => setConfirm({ type: "group", id: selected.id, name: selected.name })}
                onAddOverride={() => setOverrideDialog(true)}
                onPreviewOverride={(o) => setPreviewOverride(o)}
                onDeleteOverride={(o) => setConfirm({ type: "override", id: o.id, name: OVERRIDE_TYPE_META[o.type].label })}
              />
              <HolidayCalendar group={selected} />
            </>
          ) : (
            <EmptyState title="Pilih holiday group" description="Pilih group di kiri untuk melihat detail." />
          )}
        </div>
      </div>


      {holidayDialog ? <HolidayFormDialog onClose={() => setHolidayDialog(false)} /> : null}
      {overrideDialog && selected ? (
        <OverrideFormDialog group={selected} onClose={() => setOverrideDialog(false)} />
      ) : null}
      {previewOverride ? <PreviewOverrideDialog override={previewOverride} onClose={() => setPreviewOverride(null)} /> : null}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Hapus data?"
        description={`"${confirm?.name}" akan dihapus/diarsipkan.`}
        destructive
        confirmLabel="Hapus"
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === "group") holidayService.softDeleteGroup(confirm.id);
          else if (confirm.type === "holiday") holidayService.deleteHoliday(confirm.id);
          else if (confirm.type === "override") holidayService.deleteOverride(confirm.id);
          toast.success("Data dihapus");
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Group Detail
// ------------------------------------------------------------
function GroupDetail({
  group,
  onEdit,
  onArchive,
  onAddOverride,
  onPreviewOverride,
  onDeleteOverride,
}: {
  group: HolidayGroup;
  onEdit: () => void;
  onArchive: () => void;
  onAddOverride: () => void;
  onPreviewOverride: (o: HolidayOverride) => void;
  onDeleteOverride: (o: HolidayOverride) => void;
}) {
  const holidays = useStore((s) => s.holidays);
  const overrides = useStore((s) => s.holidayOverrides.filter((o) => o.holidayGroupId === group.id));
  const employees = useStore((s) => s.employees);
  const groupHolidays = holidays.filter((h) => group.holidayIds.includes(h.id));

  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <PartyPopper className="size-4 text-primary" /> {group.name}
          </CardTitle>
          <CardDescription className="text-xs">{group.description ?? "Tanpa deskripsi"}</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}><Pencil className="size-3.5" /></Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={onArchive}><Archive className="size-3.5" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info */}
        <div className="divide-y divide-border rounded-lg border border-border bg-muted/20 px-3">
          <InfoRow label="Berlaku" value={`${formatDateMed(group.effectiveFrom)} — ${group.effectiveUntil ? formatDateMed(group.effectiveUntil) : "sekarang"}`} />
          <InfoRow label="Anggota" value={`${group.memberIds.length} karyawan`} />
          <InfoRow label="Hari Libur" value={`${group.holidayIds.length} tanggal`} />
        </div>

        {/* Anggota */}
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="size-3" /> Anggota
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.memberIds.slice(0, 12).map((id) => {
              const emp = employees.find((e) => e.id === id);
              if (!emp) return null;
              return (
                <div key={id} className="flex items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pl-0.5 pr-2.5">
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[8px] font-bold text-primary-foreground">
                    {initials(emp.fullName)}
                  </div>
                  <span className="text-[11px] text-foreground">{emp.fullName}</span>
                </div>
              );
            })}
            {group.memberIds.length > 12 ? (
              <Badge variant="outline" className="text-[11px]">+{group.memberIds.length - 12} lainnya</Badge>
            ) : null}
            {group.memberIds.length === 0 ? <span className="text-[11px] text-muted-foreground">Belum ada anggota</span> : null}
          </div>
        </div>

        {/* Overrides */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <ArrowRightLeft className="size-3" /> Override &amp; Tukar Libur
            </p>
            <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={onAddOverride}>
              <Plus className="size-3" /> Tambah
            </Button>
          </div>
          <div className="space-y-1.5">
            {overrides.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border py-3 text-center text-[11px] text-muted-foreground">
                Belum ada override.
              </p>
            ) : (
              overrides.map((o) => {
                const meta = OVERRIDE_TYPE_META[o.type];
                const Icon = meta.icon;
                return (
                  <div key={o.id} className="group flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                    <div className={cn("flex size-7 items-center justify-center rounded-md bg-muted", meta.color)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">{meta.label}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {o.originalHolidayDate ? `${formatDateMed(o.originalHolidayDate)} → ` : ""}
                        {o.replacementDate ? formatDateMed(o.replacementDate) : ""}
                        {o.employeeIds.length === 0 ? " · Semua anggota" : ` · ${o.employeeIds.length} karyawan`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => onPreviewOverride(o)}>
                      <Eye className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-6 text-destructive hover:text-destructive" onClick={() => onDeleteOverride(o)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Holiday Calendar (mini month view)
// ------------------------------------------------------------
function HolidayCalendar({ group }: { group: HolidayGroup }) {
  const holidays = useStore((s) => s.holidays);
  const groupHolidays = holidays.filter((h) => group.holidayIds.includes(h.id));
  const [month, setMonth] = React.useState(new Date());

  const monthHolidays = groupHolidays
    .filter((h) => h.date.startsWith(format(month, "yyyy-MM")))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" /> Kalender Libur
          </CardTitle>
          <CardDescription className="text-xs">{monthLabel(format(month, "yyyy-MM"))}</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setMonth((d) => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setMonth(new Date())}>Hari Ini</Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setMonth((d) => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {monthHolidays.length === 0 ? (
            <p className="col-span-full py-4 text-center text-xs text-muted-foreground">Tidak ada libur pada bulan ini.</p>
          ) : (
            monthHolidays.map((h) => (
              <div key={h.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <div className="flex size-9 flex-col items-center justify-center rounded-lg bg-muted text-center">
                  <span className="text-[8px] font-medium uppercase text-muted-foreground">{format(new Date(h.date + "T00:00:00"), "MMM", { locale: undefined })}</span>
                  <span className="text-sm font-bold leading-none text-foreground">{h.date.slice(8)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{h.name}</p>
                  <Badge variant="outline" className={cn("mt-0.5 text-[9px]", HOLIDAY_TYPE_STYLE[h.type])}>
                    {HOLIDAY_TYPE_LABEL[h.type]}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Full-Page Holiday Group Form Component (ERPNext Architecture)
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Nama wajib diisi."); return; }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      outletIds,
      divisionIds,
      memberIds,
      holidayIds,
      effectiveFrom,
      effectiveUntil: effectiveUntil || undefined,
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
            <p className="text-xs text-muted-foreground">
              Halaman kelola kelompok hari libur nasional &amp; khusus per outlet / divisi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" type="button" onClick={onBack} className="rounded-xl">
            Batal
          </Button>
          <Button type="submit" className="gap-1.5 font-semibold rounded-xl px-5">
            <Save className="size-4" />
            {mode === "edit" ? "Simpan Perubahan" : "Simpan Holiday Group"}
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

              <Field label="Pilih Scope Outlet / Divisi (Bisa Pilih Beberapa)" hint="Tentukan outlet &amp; divisi yang menggunakan kelompok hari libur ini">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Cabang Outlet ({outletIds.length} dipilih):</p>
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/80 bg-muted/20 p-2.5 max-h-[120px] overflow-y-auto">
                      {outlets.filter((o) => o.status === "active").map((o) => {
                        const checked = outletIds.includes(o.id);
                        return (
                          <label key={o.id} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors", checked ? "bg-primary/15 border-primary text-primary font-semibold" : "bg-card border-border text-foreground hover:bg-muted/40")}>
                            <Checkbox checked={checked} onCheckedChange={() => setOutletIds((prev) => prev.includes(o.id) ? prev.filter((x) => x !== o.id) : [...prev, o.id])} className="size-3.5" />
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
                            <Checkbox checked={checked} onCheckedChange={() => setDivisionIds((prev) => prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id])} className="size-3.5" />
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
                <Field label="Tanggal Berlaku Sampai" hint="Kosongkan untuk tanpa batas">
                  <Input type="date" value={effectiveUntil} onChange={(e) => setEffectiveUntil(e.target.value)} />
                </Field>
              </FormRow>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">2. Daftar Hari Libur Terpilih</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="max-h-[260px] space-y-1.5 overflow-y-auto rounded-xl border border-border/80 p-2.5">
                {holidays.map((h) => (
                  <label key={h.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-muted/40 transition-colors">
                    <Checkbox checked={holidayIds.includes(h.id)} onCheckedChange={(c) => setHolidayIds((prev) => c ? [...prev, h.id] : prev.filter((x) => x !== h.id))} className="size-4" />
                    <span className="flex-1 text-xs font-semibold text-foreground">{h.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{formatDateLong(h.date)}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{h.type}</Badge>
                  </label>
                ))}
              </div>
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
                    {memberIds.length === 0 ? "Pilih anggota..." : `${memberIds.length} karyawan dipilih`}
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

              <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto pt-1">
                {memberIds.map((id) => {
                  const emp = employees.find((e) => e.id === id);
                  if (!emp) return null;
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 rounded-lg text-xs py-1">
                      <span>{emp.fullName}</span>
                      <button type="button" onClick={() => setMemberIds((prev) => prev.filter((x) => x !== id))} className="ml-1 text-muted-foreground hover:text-foreground">×</button>
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

// ------------------------------------------------------------
// Holiday Form Dialog (create/edit holiday)
// ------------------------------------------------------------
function HolidayFormDialog({ onClose }: { onClose: () => void }) {
  const holidays = useStore((s) => s.holidays);
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState(todayISODate());
  const [type, setType] = React.useState<HolidayType>("PERUSAHAAN");
  const [description, setDescription] = React.useState("");
  const [editId, setEditId] = React.useState<string>("");
  const [error, setError] = React.useState<string>();

  const submit = () => {
    if (!name.trim()) { setError("Nama wajib diisi."); return; }
    if (editId) {
      holidayService.updateHoliday(editId, { name: name.trim(), date, type, description: description.trim() || undefined });
      toast.success("Hari libur diperbarui");
    } else {
      holidayService.createHoliday({ name: name.trim(), date, type, description: description.trim() || undefined });
      toast.success("Hari libur ditambahkan");
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarDays className="size-5 text-primary" /> Kelola Hari Libur</DialogTitle>
          <DialogDescription>Tambah atau edit hari libur nasional/perusahaan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Edit yang ada (opsional)">
            <Select value={editId} onValueChange={(v) => {
              const h = holidays.find((x) => x.id === v);
              setEditId(v === "none" ? "" : v);
              if (h) { setName(h.name); setDate(h.date); setType(h.type); setDescription(h.description ?? ""); }
            }}>
              <SelectTrigger><SelectValue placeholder="Buat baru..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Buat Baru —</SelectItem>
                {holidays.map((h) => <SelectItem key={h.id} value={h.id}>{h.name} ({formatDateMed(h.date)})</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nama" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tahun Baru Masehi" /></Field>
          <FormRow>
            <Field label="Tanggal"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Tipe">
              <Select value={type} onValueChange={(v) => setType(v as HolidayType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(HOLIDAY_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </FormRow>
          <Field label="Deskripsi"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Opsional" /></Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit}>{editId ? "Simpan" : "Tambah"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Override Form Dialog
// ------------------------------------------------------------
function OverrideFormDialog({ group, onClose }: { group: HolidayGroup; onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const holidays = useStore((s) => s.holidays);
  const [type, setType] = React.useState<HolidayOverrideType>("HOLIDAY_SWAP");
  const [employeeIds, setEmployeeIds] = React.useState<string[]>([]);
  const [originalDate, setOriginalDate] = React.useState(todayISODate());
  const [replacementDate, setReplacementDate] = React.useState(addDaysISO(todayISODate(), 7));
  const [reason, setReason] = React.useState("");
  const [empOpen, setEmpOpen] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const submit = () => {
    if (!reason.trim()) { setError("Alasan wajib diisi."); return; }
    holidayService.createOverride({
      holidayGroupId: group.id,
      type,
      employeeIds,
      originalHolidayDate: (type === "HOLIDAY_SWAP" || type === "CANCELLED_HOLIDAY") ? originalDate : undefined,
      replacementDate: (type === "HOLIDAY_SWAP" || type === "WORKDAY_OVERRIDE" || type === "ADDITIONAL_HOLIDAY") ? replacementDate : undefined,
      reason: reason.trim(),
      status: "active",
    });
    toast.success("Override libur ditambahkan");
    onClose();
  };

  const groupMembers = employees.filter((e) => group.memberIds.includes(e.id));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="size-5 text-primary" /> Tambah Override Libur</DialogTitle>
          <DialogDescription>{group.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Tipe Override">
            <Select value={type} onValueChange={(v) => setType(v as HolidayOverrideType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(OVERRIDE_TYPE_META).map(([k, m]) => (
                  <SelectItem key={k} value={k}>
                    <span className="flex items-center gap-1.5"><m.icon className="size-3.5" /> {m.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Karyawan terdampak */}
          <Field label="Karyawan Terdampak" hint={employeeIds.length === 0 ? "Semua anggota grup" : `${employeeIds.length} karyawan`}>
            <Popover open={empOpen} onOpenChange={setEmpOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {employeeIds.length === 0 ? "Semua anggota grup" : `${employeeIds.length} karyawan dipilih`}
                  <ChevronsUpDown className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari karyawan..." />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {groupMembers.map((e) => (
                        <CommandItem key={e.id} value={`${e.fullName} ${e.nik}`} onSelect={() => setEmployeeIds((prev) => prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id])}>
                          <Checkbox checked={employeeIds.includes(e.id)} className="mr-2" />
                          <span className="text-sm">{e.fullName}</span>
                          <span className="ml-auto font-mono text-[10px] text-muted-foreground">{e.nik}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>

          {(type === "HOLIDAY_SWAP" || type === "CANCELLED_HOLIDAY") ? (
            <Field label="Tanggal Libur Asli" required>
              <Input type="date" value={originalDate} onChange={(e) => setOriginalDate(e.target.value)} />
            </Field>
          ) : null}
          {(type === "HOLIDAY_SWAP" || type === "WORKDAY_OVERRIDE" || type === "ADDITIONAL_HOLIDAY") ? (
            <Field label="Tanggal Pengganti" required hint={type === "HOLIDAY_SWAP" ? "Karyawan bekerja di hari libur & libur diganti ke tanggal ini" : type === "WORKDAY_OVERRIDE" ? "Hari kerja di-override menjadi libur" : "Libur tambahan"}>
              <Input type="date" value={replacementDate} onChange={(e) => setReplacementDate(e.target.value)} />
            </Field>
          ) : null}

          <Field label="Alasan" required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Alasan override" /></Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit}>Tambah</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Preview Override Dialog (dampak)
// ------------------------------------------------------------
function PreviewOverrideDialog({ override, onClose }: { override: HolidayOverride; onClose: () => void }) {
  const groups = useStore((s) => s.holidayGroups);
  const employees = useStore((s) => s.employees);
  const holidays = useStore((s) => s.holidays);
  const schedules = useStore((s) => s.schedules);
  const group = groups.find((g) => g.id === override.holidayGroupId);
  const meta = OVERRIDE_TYPE_META[override.type];
  const Icon = meta.icon;
  const impactedEmps = override.employeeIds.length === 0
    ? employees.filter((e) => group?.memberIds.includes(e.id))
    : employees.filter((e) => override.employeeIds.includes(e.id));

  // Hitung dampak: jadwal di tanggal pengganti, PH, dll
  const replacementSchedules = override.replacementDate ? schedules.filter((s) => s.date === override.replacementDate && impactedEmps.some((e) => e.id === s.employeeId)) : [];
  const originalSchedules = override.originalHolidayDate ? schedules.filter((s) => s.date === override.originalHolidayDate && impactedEmps.some((e) => e.id === s.employeeId)) : [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Eye className="size-5 text-primary" /> Preview Dampak Override</DialogTitle>
          <DialogDescription>{meta.label} — {group?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
            <Icon className={cn("size-5", meta.color)} />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">{override.reason}</p>
              <p className="text-[11px] text-muted-foreground">
                {override.originalHolidayDate ? `Libur asli: ${formatDateMed(override.originalHolidayDate)}` : ""}
                {override.replacementDate ? ` → Pengganti: ${formatDateMed(override.replacementDate)}` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ImpactCard label="Karyawan Terdampak" value={impactedEmps.length} icon={Users} color="text-info" />
            <ImpactCard label="Jadwal di Tanggal Pengganti" value={replacementSchedules.length} icon={CalendarDays} color="text-warning" />
            <ImpactCard label="Jadwal di Tanggal Asli" value={originalSchedules.length} icon={CalendarDays} color="text-muted-foreground" />
            <ImpactCard label="Potongan PH" value={override.type === "HOLIDAY_SWAP" ? impactedEmps.length : 0} icon={AlertTriangle} color="text-primary" />
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase text-muted-foreground">Dampak Modul</p>
            <div className="space-y-1 text-xs">
              <DampakRow label="Jadwal" impact={override.type === "HOLIDAY_SWAP" ? "Karyawan bekerja di hari libur, libur dipindah" : override.type === "WORKDAY_OVERRIDE" ? "Hari kerja menjadi libur" : override.type === "ADDITIONAL_HOLIDAY" ? "Libur tambahan" : "Libur dibatalkan"} />
              <DampakRow label="Absensi" impact={override.type === "WORKDAY_OVERRIDE" || override.type === "ADDITIONAL_HOLIDAY" ? "Tidak dihitung absen" : "Disesuaikan"} />
              <DampakRow label="PH" impact={override.type === "HOLIDAY_SWAP" ? "Dihitung PH sesuai konfigurasi shift" : "—"} />
              <DampakRow label="Lembur" impact={override.type === "HOLIDAY_SWAP" ? "Berdasar shift PH" : "—"} />
              <DampakRow label="Payroll" impact={override.type === "HOLIDAY_SWAP" ? "Komponen PH masuk perhitungan" : "Penyesuaian hari kerja"} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImpactCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Users; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("size-3.5", color)} />
        <span className="text-[10px] font-medium uppercase text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function DampakRow({ label, impact }: { label: string; impact: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{impact}</span>
    </div>
  );
}
