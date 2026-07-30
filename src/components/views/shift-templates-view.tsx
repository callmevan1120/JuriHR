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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FormRow } from "@/components/common/field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/status-badge";
import { useStore } from "@/hooks/use-store";
import { shiftTemplateService } from "@/lib/services/schedule";
import { shiftDurationMinutes, formatDuration, cn } from "@/lib/utils";
import type { ShiftTemplate, RecordStatus } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Archive,
  Clock,
  Moon,
  Sun,
  AlarmClock,
  Palette,
  CheckCircle2,
} from "lucide-react";

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

export function ShiftTemplatesView() {
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const schedules = useStore((s) => s.schedules);
  const [dialog, setDialog] = React.useState<{ mode: "create" | "edit"; data?: ShiftTemplate } | null>(null);
  const [confirm, setConfirm] = React.useState<{ id: string; name: string } | null>(null);

  // Hitung penggunaan tiap shift template
  const usageCount = React.useMemo(() => {
    const m = new Map<string, number>();
    schedules.forEach((s) => {
      if (s.shiftTemplateId) m.set(s.shiftTemplateId, (m.get(s.shiftTemplateId) ?? 0) + 1);
    });
    return m;
  }, [schedules]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shift Template"
        description="Template shift dengan jam, toleransi keterlambatan, dan konfigurasi PH."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="size-4" /> Tambah Shift
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shiftTemplates.filter((s) => s.status !== "archived").map((shift) => {
          const duration = shiftDurationMinutes(shift.startTime, shift.endTime, shift.crossesMidnight);
          const usage = usageCount.get(shift.id) ?? 0;
          return (
            <Card
              key={shift.id}
              className="group relative overflow-hidden border-border shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-md"
            >
              {/* Color bar */}
              <div className="h-1.5 w-full" style={{ background: shift.color }} />
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex size-10 items-center justify-center rounded-xl text-white shadow-soft"
                      style={{ background: shift.color }}
                    >
                      {shift.crossesMidnight ? <Moon className="size-5" /> : <Sun className="size-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{shift.name}</p>
                      <p className="text-[11px] text-muted-foreground">{usage} jadwal aktif</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setDialog({ mode: "edit", data: shift })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setConfirm({ id: shift.id, name: shift.name })}
                    >
                      <Archive className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="font-mono text-sm font-medium text-foreground">
                    {shift.startTime} – {shift.endTime}
                  </span>
                  {shift.crossesMidnight ? (
                    <Badge className="ml-auto bg-info/15 text-info border-info/30">Lewat Tengah Malam</Badge>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2.5 py-1.5">
                    <AlarmClock className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Toleransi</span>
                    <span className="ml-auto font-medium text-foreground">{shift.toleranceLateMinutes}m</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2.5 py-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Durasi</span>
                    <span className="ml-auto font-medium text-foreground">{formatDuration(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2.5">
                  <div className="flex items-center gap-1.5">
                    {shift.phConfig.isPH ? (
                      <Badge className="bg-primary/15 text-primary-foreground border-primary/30">
                        <CheckCircle2 className="size-3" /> PH
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

      {dialog ? (
        <ShiftFormDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          mode={dialog.mode}
          data={dialog.data}
        />
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Arsipkan shift template?"
        description={`"${confirm?.name}" akan diarsipkan.`}
        destructive
        confirmLabel="Arsipkan"
        onConfirm={() => {
          if (confirm) {
            shiftTemplateService.softDelete(confirm.id);
            toast.success("Shift template diarsipkan");
          }
        }}
      />
    </div>
  );
}

function ShiftFormDialog({
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            {mode === "edit" ? "Edit Shift Template" : "Tambah Shift Template"}
          </DialogTitle>
          <DialogDescription>Default toleransi keterlambatan adalah 5 menit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nama Shift" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Shift Pagi" />
          </Field>
          <FormRow>
            <Field label="Jam Mulai">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="font-mono" />
            </Field>
            <Field label="Jam Selesai">
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="font-mono" />
            </Field>
          </FormRow>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Durasi shift</span>
            </div>
            <span className="text-sm font-medium tabular-nums text-foreground">{formatDuration(duration)}</span>
          </div>
          <FormRow>
            <Field label="Toleransi Terlambat (menit)">
              <Input type="number" value={tolerance} onChange={(e) => setTolerance(e.target.value)} className="tabular-nums" />
            </Field>
            <Field label="Status">
              <div className="flex items-center gap-2">
                <Switch checked={status === "active"} onCheckedChange={(c) => setStatus(c ? "active" : "inactive")} />
                <span className="text-sm">{status === "active" ? "Aktif" : "Nonaktif"}</span>
              </div>
            </Field>
          </FormRow>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <Moon className="size-4 text-info" />
              <div>
                <p className="text-sm font-medium text-foreground">Lewat Tengah Malam</p>
                <p className="text-[11px] text-muted-foreground">Shift berakhir keesokan hari</p>
              </div>
            </div>
            <Switch checked={crossesMidnight} onCheckedChange={setCrossesMidnight} />
          </div>

          {/* Color picker */}
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
                  className="h-8 w-12 cursor-pointer border-border p-0.5 pl-7"
                />
              </div>
            </div>
          </Field>

          {/* PH Config */}
          <div className="space-y-3 rounded-lg border border-border p-3">
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
                <Input type="number" step="0.5" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} className="tabular-nums" />
              </Field>
            ) : null}
          </div>

          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit}>{mode === "edit" ? "Simpan" : "Tambah"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
