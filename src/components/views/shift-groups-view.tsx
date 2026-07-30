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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { shiftGroupService } from "@/lib/services/schedule";
import { lookupService } from "@/lib/services/master-data";
import { formatDateMed, todayISODate, cn, initials } from "@/lib/utils";
import type { ShiftGroup, WeeklyPatternDay, RecordStatus } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Archive,
  CalendarDays,
  Users,
  Check,
  ChevronsUpDown,
  Search,
  ArrowLeft,
  Save,
  AlertCircle,
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

export function ShiftGroupsView() {
  const shiftGroups = useStore((s) => s.shiftGroups);
  const [dialog, setDialog] = React.useState<{ mode: "create" | "edit"; data?: ShiftGroup } | null>(null);
  const [confirm, setConfirm] = React.useState<{ id: string; name: string } | null>(null);

  if (dialog) {
    return (
      <ShiftGroupFormPage
        mode={dialog.mode}
        data={dialog.data}
        onBack={() => setDialog(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shift Group"
        description="Pola shift mingguan per outlet/divisi beserta anggota & periode berlaku."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="size-4" /> Tambah Group
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {shiftGroups.filter((g) => g.status !== "archived").map((group) => (
          <ShiftGroupCard
            key={group.id}
            group={group}
            onEdit={() => setDialog({ mode: "edit", data: group })}
            onArchive={() => setConfirm({ id: group.id, name: group.name })}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Arsipkan shift group?"
        description={`"${confirm?.name}" akan diarsipkan.`}
        destructive
        confirmLabel="Arsipkan"
        onConfirm={() => {
          if (confirm) {
            shiftGroupService.softDelete(confirm.id);
            toast.success("Shift group diarsipkan");
          }
        }}
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

  const scopeName =
    group.scopeType === "OUTLET"
      ? outlets.find((o) => o.id === group.scopeId)?.name
      : divisions.find((d) => d.id === group.scopeId)?.name;

  const memberCount = group.memberIds.length;
  const activeMembers = group.memberIds.filter((id) =>
    employees.find((e) => e.id === id)?.status === "AKTIF",
  ).length;

  return (
    <Card className="group border-border shadow-soft transition-all hover:shadow-soft-md">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{group.name}</CardTitle>
            <CardDescription className="text-xs">
              {group.scopeType === "OUTLET" ? "Scope: Outlet" : "Scope: Divisi"}
              {scopeName ? ` · ${scopeName}` : ""}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={onArchive}>
            <Archive className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Weekly pattern visual */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Pola Mingguan</p>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => {
              const pattern = group.weeklyPattern.find((p) => p.day === d.day);
              const shift = pattern?.shiftTemplateId ? shiftTemplates.find((s) => s.id === pattern.shiftTemplateId) : undefined;
              return (
                <div
                  key={d.day}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md border py-1.5",
                    shift ? "border-border bg-card" : "border-dashed border-border bg-muted/30",
                  )}
                  title={shift ? `${d.short}: ${shift.name} (${shift.startTime}-${shift.endTime})` : `${d.short}: Libur`}
                >
                  <span className="text-[9px] font-medium text-muted-foreground">{d.label}</span>
                  {shift ? (
                    <div className="size-3 rounded-full" style={{ background: shift.color }} />
                  ) : (
                    <div className="size-3 rounded-full border border-dashed border-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Members & period */}
        <div className="flex items-center justify-between border-t border-border pt-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{activeMembers}</span>
            <span className="text-muted-foreground">anggota aktif</span>
            {memberCount !== activeMembers ? (
              <span className="text-muted-foreground/70">/ {memberCount} total</span>
            ) : null}
          </div>
          <StatusBadge status={group.status} />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarDays className="size-3" />
          Berlaku: {formatDateMed(group.effectiveFrom)}
          {group.effectiveUntil ? ` — ${formatDateMed(group.effectiveUntil)}` : " — sekarang"}
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Full-Page Shift Group Form Component (ERPNext Architecture)
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
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  const divisions = useStore((s) => s.divisions);

  const [name, setName] = React.useState(data?.name ?? "");
  const [scopeType, setScopeType] = React.useState<"OUTLET" | "DIVISI">(data?.scopeType === "DIVISI" ? "DIVISI" : "OUTLET");
  const [scopeId, setScopeId] = React.useState(data?.scopeId ?? "");
  const [outletIds, setOutletIds] = React.useState<string[]>(data?.outletIds ?? (data?.scopeId ? [data.scopeId] : []));
  const [divisionIds, setDivisionIds] = React.useState<string[]>(data?.divisionIds ?? (data?.scopeId ? [data.scopeId] : []));
  const [pattern, setPattern] = React.useState<Record<number, string | undefined>>(
    () => {
      const m: Record<number, string | undefined> = {};
      DAYS.forEach((d) => {
        const p = data?.weeklyPattern.find((wp) => wp.day === d.day);
        m[d.day] = p?.shiftTemplateId;
      });
      return m;
    },
  );
  const [memberIds, setMemberIds] = React.useState<string[]>(data?.memberIds ?? []);
  const [effectiveFrom, setEffectiveFrom] = React.useState(data?.effectiveFrom ?? todayISODate());
  const [effectiveUntil, setEffectiveUntil] = React.useState(data?.effectiveUntil ?? "");
  const [status, setStatus] = React.useState<RecordStatus>(data?.status ?? "active");
  const [memberOpen, setMemberOpen] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const toggleMember = (id: string) => {
    setMemberIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleOutlet = (id: string) => {
    setOutletIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleDivision = (id: string) => {
    setDivisionIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama group wajib diisi.");
      return;
    }
    const weeklyPattern: WeeklyPatternDay[] = DAYS.map((d) => ({
      day: d.day,
      shiftTemplateId: pattern[d.day] || undefined,
    }));
    const payload = {
      name: name.trim(),
      scopeType: scopeType === "OUTLET" && outletIds.length > 1 ? ("MULTI_OUTLET" as const) : scopeType,
      scopeId: scopeType === "OUTLET" ? outletIds[0] : divisionIds[0],
      outletIds,
      divisionIds,
      weeklyPattern,
      memberIds,
      effectiveFrom,
      effectiveUntil: effectiveUntil || undefined,
      status,
    };
    if (mode === "edit" && data) {
      shiftGroupService.update(data.id, payload);
      toast.success("Shift group diperbarui");
    } else {
      shiftGroupService.create(payload);
      toast.success("Shift group ditambahkan");
    }
    onBack();
  };

  const memberCandidates = employees.filter((e) => e.status === "AKTIF");

  return (
    <form onSubmit={submit} className="space-y-6 pb-12">
      <div className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border/80 bg-background/95 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between shadow-xs">
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
              Pengaturan pola shift mingguan, lokasi outlet/divisi, dan anggota karyawan.
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
          <Card className="border-border/80 shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">1. Info Group &amp; Scope Lokasi</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormRow>
                <Field label="Nama Shift Group" required hint="Contoh: Outlet 5 Hari (Sen–Jum)">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Outlet 5 Hari (Sen–Jum)" className="font-semibold" />
                </Field>
                <Field label="Tipe Scope">
                  <Select value={scopeType} onValueChange={(v) => setScopeType(v as "OUTLET" | "DIVISI")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OUTLET">Outlet Cabang</SelectItem>
                      <SelectItem value="DIVISI">Divisi Perusahaan</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FormRow>

              <Field
                label={scopeType === "OUTLET" ? "Pilih Outlet Cabang (Bisa Pilih Beberapa)" : "Pilih Divisi (Bisa Pilih Beberapa)"}
                hint={scopeType === "OUTLET" ? `${outletIds.length} outlet dipilih` : `${divisionIds.length} divisi dipilih`}
              >
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/80 bg-muted/20 p-3 max-h-[160px] overflow-y-auto">
                  {scopeType === "OUTLET"
                    ? outlets.filter((o) => o.status === "active").map((o) => {
                        const checked = outletIds.includes(o.id);
                        return (
                          <label key={o.id} className={cn("flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1 text-xs transition-colors", checked ? "bg-primary/15 border-primary text-primary font-semibold" : "bg-card border-border text-foreground hover:bg-muted/40")}>
                            <Checkbox checked={checked} onCheckedChange={() => toggleOutlet(o.id)} className="size-3.5" />
                            <span>{o.name}</span>
                          </label>
                        );
                      })
                    : divisions.filter((d) => d.status === "active").map((d) => {
                        const checked = divisionIds.includes(d.id);
                        return (
                          <label key={d.id} className={cn("flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1 text-xs transition-colors", checked ? "bg-primary/15 border-primary text-primary font-semibold" : "bg-card border-border text-foreground hover:bg-muted/40")}>
                            <Checkbox checked={checked} onCheckedChange={() => toggleDivision(d.id)} className="size-3.5" />
                            <span>{d.name}</span>
                          </label>
                        );
                      })}
                </div>
              </Field>

              <FormRow>
                <Field label="Tanggal Berlaku Dari" required>
                  <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                </Field>
                <Field label="Tanggal Berlaku Sampai" hint="Kosongkan jika tanpa batas akhir">
                  <Input type="date" value={effectiveUntil} onChange={(e) => setEffectiveUntil(e.target.value)} />
                </Field>
              </FormRow>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">2. Pola Shift Mingguan (Senin — Minggu)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {DAYS.map((d) => (
                  <div key={d.day} className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 shadow-2xs">
                    <span className="w-14 text-xs font-semibold text-foreground">{d.short}</span>
                    <Select
                      value={pattern[d.day] ?? "libur"}
                      onValueChange={(v) => setPattern((prev) => ({ ...prev, [d.day]: v === "libur" ? undefined : v }))}
                    >
                      <SelectTrigger className="h-8 flex-1 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="libur">Libur (Off)</SelectItem>
                        {shiftTemplates.filter((s) => s.status === "active").map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="flex items-center gap-1.5">
                              <span className="size-2 rounded-full" style={{ background: s.color }} />
                              {s.name} ({s.startTime}-{s.endTime})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                        {memberCandidates.map((e) => (
                          <CommandItem key={e.id} value={`${e.fullName} ${e.nik}`} onSelect={() => toggleMember(e.id)}>
                            <Checkbox checked={memberIds.includes(e.id)} className="mr-2" />
                            <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">
                              {initials(e.fullName)}
                            </div>
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

