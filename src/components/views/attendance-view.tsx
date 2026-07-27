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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FormRow } from "@/components/common/field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, selectionColumn } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/states";
import { useStore } from "@/hooks/use-store";
import { useRoute } from "@/lib/router/use-route";
import {
  attendanceService,
  LATE_DEDUCTION_RUPIAH,
  LATE_TOLERANCE_MINUTES,
} from "@/lib/services/workforce";
import { lookupService } from "@/lib/services/master-data";
import {
  formatRupiah,
  formatDuration,
  formatDateMed,
  formatDateLong,
  todayISODate,
  cn,
  initials,
  monthLabel,
} from "@/lib/utils";
import type { Attendance, AttendanceStatus } from "@/lib/types";
import type { ColumnDef as TColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  Users,
  Trash2,
  Pencil,
  Download,
  CalendarDays,
  ClipboardCheck,
  AlarmClock,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "HADIR", label: "Hadir" },
  { value: "TERLAMBAT", label: "Terlambat" },
  { value: "TIDAK_HADIR", label: "Tidak Hadir" },
  { value: "CUTI", label: "Cuti" },
  { value: "IZIN", label: "Izin" },
  { value: "SAKIT", label: "Sakit" },
  { value: "LIBUR", label: "Libur" },
  { value: "PH", label: "PH" },
];

export function AttendanceView() {
  return (
    <Tabs defaultValue="harian" className="space-y-4">
      <TabsList className="bg-muted/40 p-1">
        <TabsTrigger value="harian" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
          <CalendarDays className="size-3.5" /> Harian
        </TabsTrigger>
        <TabsTrigger value="bulanan" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
          <Calendar className="size-3.5" /> Bulanan
        </TabsTrigger>
        <TabsTrigger value="rekap" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
          <ClipboardCheck className="size-3.5" /> Rekap &amp; Laporan
        </TabsTrigger>
      </TabsList>
      <TabsContent value="harian"><DailyTab /></TabsContent>
      <TabsContent value="bulanan"><MonthlyTab /></TabsContent>
      <TabsContent value="rekap"><RecapTab /></TabsContent>
    </Tabs>
  );
}

// ============================================================
// Daily Tab
// ============================================================
function DailyTab() {
  const route = useRoute();
  const initialDate = route.query.get("date") ?? todayISODate();
  const [date, setDate] = React.useState<Date>(new Date(`${initialDate}T00:00:00`));
  const [filterOutlet, setFilterOutlet] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [editTarget, setEditTarget] = React.useState<{ employeeId: string; date: string } | null>(null);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const employees = useStore((s) => s.employees);
  const attendances = useStore((s) => s.attendances);
  const outlets = useStore((s) => s.outlets);

  const dateStr = format(date, "yyyy-MM-dd");
  const dayAttendances = attendances.filter((a) => a.date === dateStr);

  const filteredEmps = employees.filter((e) => {
    if (e.status !== "AKTIF") return false;
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    return true;
  });

  const recap = attendanceService.dailyRecap(dateStr);

  const navigateDay = (dir: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + dir);
    setDate(d);
  };

  const handleExport = () => {
    const rows = filteredEmps.map((emp) => {
      const att = dayAttendances.find((a) => a.employeeId === emp.id);
      return [
        emp.nik,
        emp.fullName,
        lookupService.outletName(emp.primaryOutletId),
        att?.status ?? "TANPA_RECORD",
        att?.checkIn?.slice(11, 16) ?? "",
        att?.checkOut?.slice(11, 16) ?? "",
        att?.lateMinutes ? String(att.lateMinutes) : "0",
        att?.deduction ? String(att.deduction) : "0",
        att?.note ?? "",
      ];
    });
    const headers = ["NIK", "Nama", "Outlet", "Status", "Check-In", "Check-Out", "Telat(m)", "Potongan", "Catatan"];
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absensi-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} record diekspor`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Absensi Harian"
        description={formatDateLong(dateStr)}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setBulkOpen(true)}>
              <Users className="size-4" /> Input Massal
            </Button>
          </>
        }
      />

      {/* Recap cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <RecapCard label="Hadir" value={recap.hadir} color="text-success" bg="bg-success/10" />
        <RecapCard label="Terlambat" value={recap.terlambat} color="text-warning" bg="bg-warning/10" />
        <RecapCard label="Tidak Hadir" value={recap.tidakHadir} color="text-destructive" bg="bg-destructive/10" />
        <RecapCard label="Cuti" value={recap.cuti} color="text-info" bg="bg-info/10" />
        <RecapCard label="Izin" value={recap.izin} color="text-info" bg="bg-info/10" />
        <RecapCard label="Sakit" value={recap.sakit} color="text-info" bg="bg-info/10" />
        <RecapCard label="Libur" value={recap.libur} color="text-muted-foreground" bg="bg-muted" />
        <RecapCard label="PH" value={recap.ph} color="text-primary" bg="bg-primary/10" />
      </div>

      {/* Date navigation + filter */}
      <Card className="border-border shadow-soft">
        <CardContent className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => navigateDay(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Calendar className="size-4" /> {formatDateMed(dateStr)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker mode="single" selected={date} onSelect={(d) => { if (d) { setDate(d); setPickerOpen(false); } }} />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => navigateDay(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDate(new Date())}>Hari Ini</Button>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={filterOutlet} onValueChange={setFilterOutlet}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Outlet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Outlet</SelectItem>
                {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance list */}
      <Card className="border-border shadow-soft">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredEmps.length === 0 ? (
              <EmptyState title="Tidak ada karyawan" description="Sesuaikan filter untuk menampilkan karyawan." className="m-4" />
            ) : (
              filteredEmps.map((emp) => {
                const att = dayAttendances.find((a) => a.employeeId === emp.id);
                if (filterStatus !== "all" && att?.status !== filterStatus) return null;
                return (
                  <AttendanceRow
                    key={emp.id}
                    emp={emp}
                    attendance={att}
                    onEdit={() => setEditTarget({ employeeId: emp.id, date: dateStr })}
                  />
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aturan info */}
      <div className="flex items-center gap-2 rounded-lg border border-info/30 bg-info/5 px-3 py-2 text-xs text-info">
        <AlarmClock className="size-4" />
        Aturan demo: terlambat ≤ {LATE_TOLERANCE_MINUTES} menit tidak dipotong. Terlambat &gt; {LATE_TOLERANCE_MINUTES} menit dikenakan potongan <strong>{formatRupiah(LATE_DEDUCTION_RUPIAH)}</strong> per kejadian.
      </div>

      {editTarget ? (
        <EditAttendanceDialog
          target={editTarget}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
      {bulkOpen ? (
        <BulkInputDialog date={dateStr} employeeIds={filteredEmps.map((e) => e.id)} onClose={() => setBulkOpen(false)} />
      ) : null}
    </div>
  );
}

function RecapCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={cn("rounded-lg border border-border p-2.5", bg)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-xl font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}

function AttendanceRow({
  emp,
  attendance,
  onEdit,
}: {
  emp: any;
  attendance?: Attendance;
  onEdit: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary-foreground">
        {initials(emp.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{emp.fullName}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {lookupService.positionName(emp.positionId)} · {lookupService.outletName(emp.primaryOutletId)}
        </p>
      </div>
      {attendance ? (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            {attendance.checkIn ? (
              <p className="font-mono text-xs text-foreground">{attendance.checkIn.slice(11, 16)}</p>
            ) : <p className="text-xs text-muted-foreground">—</p>}
            {attendance.checkOut ? (
              <p className="font-mono text-[10px] text-muted-foreground">{attendance.checkOut.slice(11, 16)}</p>
            ) : null}
          </div>
          {attendance.lateMinutes > 0 ? (
            <Badge className="bg-warning/15 text-warning border-warning/30">+{attendance.lateMinutes}m</Badge>
          ) : null}
          {attendance.deduction > 0 ? (
            <span className="text-xs font-medium text-destructive">-{formatRupiah(attendance.deduction)}</span>
          ) : null}
          <StatusBadge status={attendance.status} />
        </div>
      ) : (
        <Badge variant="outline" className="bg-muted text-muted-foreground">Belum ada record</Badge>
      )}
      <Button variant="ghost" size="icon" className="size-7 opacity-0 transition-opacity group-hover:opacity-100" onClick={onEdit}>
        {attendance ? <Pencil className="size-3.5" /> : <Plus className="size-3.5" />}
      </Button>
    </div>
  );
}

// ------------------------------------------------------------
// Edit Attendance Dialog
// ------------------------------------------------------------
function EditAttendanceDialog({
  target,
  onClose,
}: {
  target: { employeeId: string; date: string };
  onClose: () => void;
}) {
  const employees = useStore((s) => s.employees);
  const attendances = useStore((s) => s.attendances);
  const emp = employees.find((e) => e.id === target.employeeId);
  const existing = attendances.find((a) => a.employeeId === target.employeeId && a.date === target.date);

  const [status, setStatus] = React.useState<AttendanceStatus>(existing?.status ?? "HADIR");
  const [checkIn, setCheckIn] = React.useState(existing?.checkIn?.slice(11, 16) ?? "");
  const [checkOut, setCheckOut] = React.useState(existing?.checkOut?.slice(11, 16) ?? "");
  const [lateMinutes, setLateMinutes] = React.useState(String(existing?.lateMinutes ?? 0));
  const [note, setNote] = React.useState(existing?.note ?? "");

  const isPresent = status === "HADIR" || status === "TERLAMBAT";
  const deduction = isPresent ? attendanceService.computeDeduction(Number(lateMinutes) || 0) : 0;

  const save = () => {
    attendanceService.upsert({
      employeeId: target.employeeId,
      date: target.date,
      outletId: emp?.primaryOutletId,
      shiftTemplateId: existing?.shiftTemplateId,
      checkIn: checkIn ? `${target.date}T${checkIn}:00+07:00` : undefined,
      checkOut: checkOut ? `${target.date}T${checkOut}:00+07:00` : undefined,
      status,
      lateMinutes: isPresent ? Number(lateMinutes) || 0 : 0,
      note: note.trim() || undefined,
    });
    toast.success("Absensi disimpan");
    onClose();
  };

  const remove = () => {
    attendanceService.remove(target.employeeId, target.date);
    toast.success("Absensi dihapus");
    onClose();
  };

  if (!emp) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-primary" /> Absensi
          </DialogTitle>
          <DialogDescription>{emp.fullName} · {formatDateLong(target.date)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          {isPresent ? (
            <>
              <FormRow>
                <Field label="Check-In"><Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="font-mono" /></Field>
                <Field label="Check-Out"><Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="font-mono" /></Field>
              </FormRow>
              <Field label="Menit Terlambat" hint={`Potongan: ${deduction > 0 ? formatRupiah(deduction) : "Rp 0"} (≤${LATE_TOLERANCE_MINUTES}m tidak dipotong)`}>
                <Input type="number" value={lateMinutes} onChange={(e) => setLateMinutes(e.target.value)} className="tabular-nums" />
              </Field>
            </>
          ) : null}
          <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></Field>
        </div>
        <DialogFooter>
          {existing ? (
            <Button variant="ghost" className="mr-auto text-destructive hover:text-destructive" onClick={remove}>
              <Trash2 className="size-4" /> Hapus
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Bulk Input Dialog
// ------------------------------------------------------------
function BulkInputDialog({
  date,
  employeeIds,
  onClose,
}: {
  date: string;
  employeeIds: string[];
  onClose: () => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<AttendanceStatus>("HADIR");
  const [lateMinutes, setLateMinutes] = React.useState("0");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string>();

  const toggleAll = () => {
    setSelected(selected.length === employeeIds.length ? [] : [...employeeIds]);
  };

  const run = () => {
    if (selected.length === 0) { setError("Pilih minimal 1 karyawan."); return; }
    const count = attendanceService.bulkUpsert(selected, date, {
      status,
      lateMinutes: Number(lateMinutes) || 0,
      note: note.trim() || undefined,
    });
    toast.success(`${count} absensi disimpan`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="size-5 text-primary" /> Input Massal Absensi</DialogTitle>
          <DialogDescription>{formatDateLong(date)} · {employeeIds.length} karyawan tersedia</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
            <span className="text-xs font-medium">{selected.length} dari {employeeIds.length} dipilih</span>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={toggleAll}>
              {selected.length === employeeIds.length ? "Kosongkan" : "Pilih Semua"}
            </Button>
          </div>
          <div className="max-h-[200px] space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            <BulkList employeeIds={employeeIds} selected={selected} onToggle={(id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} />
          </div>
          <FormRow>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {(status === "HADIR" || status === "TERLAMBAT") ? (
              <Field label="Menit Terlambat">
                <Input type="number" value={lateMinutes} onChange={(e) => setLateMinutes(e.target.value)} className="tabular-nums" />
              </Field>
            ) : null}
          </FormRow>
          <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" /></Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={run}>Simpan Massal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkList({ employeeIds, selected, onToggle }: { employeeIds: string[]; selected: string[]; onToggle: (id: string) => void }) {
  const employees = useStore((s) => s.employees);
  return (
    <>
      {employeeIds.map((id) => {
        const emp = employees.find((e) => e.id === id);
        if (!emp) return null;
        return (
          <label key={id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-muted/30">
            <Checkbox checked={selected.includes(id)} onCheckedChange={() => onToggle(id)} />
            <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[8px] font-bold text-primary-foreground">{initials(emp.fullName)}</div>
            <span className="flex-1 text-xs">{emp.fullName}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{emp.nik}</span>
          </label>
        );
      })}
    </>
  );
}

// ============================================================
// Monthly Tab
// ============================================================
function MonthlyTab() {
  const [period, setPeriod] = React.useState(todayISODate().slice(0, 7));
  const [filterOutlet, setFilterOutlet] = React.useState<string>("all");
  const employees = useStore((s) => s.employees);
  const attendances = useStore((s) => s.attendances);
  const outlets = useStore((s) => s.outlets);

  const filteredEmps = employees.filter((e) => {
    if (e.status !== "AKTIF") return false;
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    return true;
  });

  const columns: TColumnDef<any>[] = [
    {
      id: "name",
      header: "Karyawan",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">{initials(row.original.name)}</div>
          <div><p className="text-sm font-medium">{row.original.name}</p><p className="font-mono text-[10px] text-muted-foreground">{row.original.nik}</p></div>
        </div>
      ),
    },
    { accessorKey: "hadir", header: "Hadir", cell: ({ row }) => <span className="tabular-nums text-success font-medium">{row.original.hadir}</span> },
    { accessorKey: "terlambat", header: "Telat", cell: ({ row }) => <span className="tabular-nums text-warning font-medium">{row.original.terlambat}</span> },
    { accessorKey: "tidakHadir", header: "TH", cell: ({ row }) => <span className="tabular-nums text-destructive font-medium">{row.original.tidakHadir}</span> },
    { accessorKey: "cuti", header: "Cuti", cell: ({ row }) => <span className="tabular-nums text-info">{row.original.cuti}</span> },
    { accessorKey: "izin", header: "Izin", cell: ({ row }) => <span className="tabular-nums text-info">{row.original.izin}</span> },
    { accessorKey: "sakit", header: "Sakit", cell: ({ row }) => <span className="tabular-nums text-info">{row.original.sakit}</span> },
    { accessorKey: "libur", header: "Libur", cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.libur}</span> },
    { accessorKey: "ph", header: "PH", cell: ({ row }) => <span className="tabular-nums text-primary">{row.original.ph}</span> },
    { id: "lateMin", header: "Total Telat", cell: ({ row }) => <span className="tabular-nums text-foreground">{formatDuration(row.original.totalLateMinutes)}</span> },
    { id: "deduction", header: "Potongan", cell: ({ row }) => <span className="tabular-nums font-medium text-destructive">{formatRupiah(row.original.totalLateDeduction)}</span> },
  ];

  const data = filteredEmps.map((emp) => {
    const r = attendanceService.monthlyRecap(emp.id, period);
    return { id: emp.id, name: emp.fullName, nik: emp.nik, ...r };
  });

  const totals = data.reduce((acc, d) => ({
    hadir: acc.hadir + d.hadir,
    terlambat: acc.terlambat + d.terlambat,
    tidakHadir: acc.tidakHadir + d.tidakHadir,
    totalLateDeduction: acc.totalLateDeduction + d.totalLateDeduction,
  }), { hadir: 0, terlambat: 0, tidakHadir: 0, totalLateDeduction: 0 });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Absensi Bulanan"
        description={`Rekap kehadiran per karyawan — ${monthLabel(period)}`}
        actions={
          <Select value={filterOutlet} onValueChange={setFilterOutlet}>
            <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="Outlet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <Card className="border-border shadow-soft">
        <CardContent className="flex items-center gap-3 py-3">
          <CalendarDays className="size-5 text-primary" />
          <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-[160px]" />
          <div className="ml-auto flex gap-2 text-xs">
            <Badge className="bg-success/15 text-success border-success/30">Hadir: {totals.hadir}</Badge>
            <Badge className="bg-warning/15 text-warning border-warning/30">Telat: {totals.terlambat}</Badge>
            <Badge className="bg-destructive/10 text-destructive border-destructive/30">TH: {totals.tidakHadir}</Badge>
            <Badge className="bg-destructive/10 text-destructive border-destructive/30">Potongan: {formatRupiah(totals.totalLateDeduction)}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-soft">
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Cari karyawan..."
            pageSize={15}
            globalFilterFn={(row, q) => (row.name + " " + row.nik).toLowerCase().includes(q.toLowerCase())}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Recap Tab (Laporan)
// ============================================================
function RecapTab() {
  const [fromDate, setFromDate] = React.useState(todayISODate().slice(0, 8) + "01");
  const [toDate, setToDate] = React.useState(todayISODate());
  const [filterOutlet, setFilterOutlet] = React.useState<string>("all");
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);

  const filteredEmps = employees.filter((e) => {
    if (e.status !== "AKTIF") return false;
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    return true;
  });

  const records = attendanceService.byPeriod(fromDate, toDate);
  const empStats = filteredEmps.map((emp) => {
    const empRecs = records.filter((r) => r.employeeId === emp.id);
    return {
      emp,
      hadir: empRecs.filter((r) => r.status === "HADIR").length,
      terlambat: empRecs.filter((r) => r.status === "TERLAMBAT").length,
      tidakHadir: empRecs.filter((r) => r.status === "TIDAK_HADIR").length,
      cuti: empRecs.filter((r) => r.status === "CUTI").length,
      izin: empRecs.filter((r) => r.status === "IZIN").length,
      sakit: empRecs.filter((r) => r.status === "SAKIT").length,
      totalLateMinutes: empRecs.reduce((s, r) => s + r.lateMinutes, 0),
      totalDeduction: empRecs.reduce((s, r) => s + r.deduction, 0),
    };
  });

  const handleExport = () => {
    const headers = ["NIK", "Nama", "Outlet", "Hadir", "Terlambat", "Tidak Hadir", "Cuti", "Izin", "Sakit", "Total Telat(m)", "Total Potongan"];
    const rows = empStats.map((s) => [
      s.emp.nik, s.emp.fullName, lookupService.outletName(s.emp.primaryOutletId),
      s.hadir, s.terlambat, s.tidakHadir, s.cuti, s.izin, s.sakit,
      s.totalLateMinutes, s.totalDeduction,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-absensi-${fromDate}-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rekap diekspor");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Rekap & Laporan Absensi"
        description={`${formatDateMed(fromDate)} — ${formatDateMed(toDate)}`}
        actions={<Button variant="outline" size="sm" onClick={handleExport}><Download className="size-4" /> Export CSV</Button>}
      />

      <Card className="border-border shadow-soft">
        <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
          <Filter className="size-4 text-muted-foreground" />
          <Field label="Dari"><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field>
          <Field label="Sampai"><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field>
          <Select value={filterOutlet} onValueChange={setFilterOutlet}>
            <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="Outlet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rekap per Karyawan</CardTitle>
          <CardDescription className="text-xs">{empStats.length} karyawan · {records.length} record</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Karyawan</th>
                  <th className="px-2 py-2 text-center font-semibold text-success">Hadir</th>
                  <th className="px-2 py-2 text-center font-semibold text-warning">Telat</th>
                  <th className="px-2 py-2 text-center font-semibold text-destructive">TH</th>
                  <th className="px-2 py-2 text-center font-semibold text-info">Cuti</th>
                  <th className="px-2 py-2 text-center font-semibold text-info">Izin</th>
                  <th className="px-2 py-2 text-center font-semibold text-info">Sakit</th>
                  <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Telat Total</th>
                  <th className="px-3 py-2 text-right font-semibold text-destructive">Potongan</th>
                </tr>
              </thead>
              <tbody>
                {empStats.map((s) => (
                  <tr key={s.emp.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">{initials(s.emp.fullName)}</div>
                        <div><p className="text-sm font-medium text-foreground">{s.emp.fullName}</p><p className="text-[10px] text-muted-foreground">{lookupService.outletName(s.emp.primaryOutletId)}</p></div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums text-success">{s.hadir}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-warning">{s.terlambat}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-destructive">{s.tidakHadir}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-info">{s.cuti}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-info">{s.izin}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-info">{s.sakit}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-foreground">{formatDuration(s.totalLateMinutes)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-destructive">{formatRupiah(s.totalDeduction)}</td>
                  </tr>
                ))}
                {empStats.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Tidak ada data.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
