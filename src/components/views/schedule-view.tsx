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
import { Input } from "@/components/ui/input";
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
import { EmptyState } from "@/components/common/states";
import { useStore } from "@/hooks/use-store";
import {
  scheduleService,
  shiftSwapService,
  holidayService,
  type ConflictInfo,
} from "@/lib/services/schedule";
import { lookupService } from "@/lib/services/master-data";
import {
  addDaysISO,
  formatDateMed,
  formatDateLong,
  todayISODate,
  cn,
  initials,
  monthLabel,
} from "@/lib/utils";
import type { Schedule, ShiftSwapStatus, ShiftSwapType } from "@/lib/types";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  CalendarDays,
  Calendar,
  Lock,
  Unlock,
  Copy,
  Wand2,
  AlertTriangle,
  Users,
  Filter,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeftRight,
} from "lucide-react";
import { format } from "date-fns";

type ViewMode = "harian" | "mingguan" | "bulanan";

export function ScheduleView() {
  return (
    <Tabs defaultValue="kalender" className="space-y-4">
      <TabsList className="bg-muted/40 p-1">
        <TabsTrigger value="kalender" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
          <CalendarRange className="size-3.5" /> Kalender Jadwal
        </TabsTrigger>
        <TabsTrigger value="tukar" className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-soft">
          <ArrowLeftRight className="size-3.5" /> Pengajuan &amp; Tukar Shift
        </TabsTrigger>
      </TabsList>
      <TabsContent value="kalender"><CalendarTab /></TabsContent>
      <TabsContent value="tukar"><SwapTab /></TabsContent>
    </Tabs>
  );
}

// ============================================================
// Calendar Tab
// ============================================================
function CalendarTab() {
  const [mode, setMode] = React.useState<ViewMode>("mingguan");
  const [anchorDate, setAnchorDate] = React.useState<Date>(new Date());
  const [filterOutlet, setFilterOutlet] = React.useState<string>("all");
  const [filterDivision, setFilterDivision] = React.useState<string>("all");
  const [filterShiftGroup, setFilterShiftGroup] = React.useState<string>("all");
  const [assignTarget, setAssignTarget] = React.useState<{ employeeId: string; date: string } | null>(null);
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [copyOpen, setCopyOpen] = React.useState(false);
  const [lockTarget, setLockTarget] = React.useState<{ from: string; to: string; lock: boolean } | null>(null);

  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  const divisions = useStore((s) => s.divisions);
  const shiftGroups = useStore((s) => s.shiftGroups);
  const schedules = useStore((s) => s.schedules);

  // Filter employees
  const filteredEmps = employees.filter((e) => {
    if (e.status !== "AKTIF") return false;
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    if (filterDivision !== "all" && e.divisionId !== filterDivision) return false;
    if (filterShiftGroup !== "all" && e.shiftGroupId !== filterShiftGroup) return false;
    return true;
  });

  const navigate = (dir: number) => {
    if (mode === "harian") {
      setAnchorDate((d) => addDays(d, dir));
    } else if (mode === "mingguan") {
      setAnchorDate((d) => addDays(d, dir * 7));
    } else {
      const newDate = new Date(anchorDate);
      newDate.setMonth(newDate.getMonth() + dir);
      setAnchorDate(newDate);
    }
  };

  const today = todayISODate();
  // Date range untuk tampilan
  const range = React.useMemo(() => {
    if (mode === "harian") {
      const d = format(anchorDate, "yyyy-MM-dd");
      return { from: d, to: d, dates: [d] };
    }
    if (mode === "mingguan") {
      // Senin sebagai awal minggu
      const dow = anchorDate.getDay();
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      const monday = addDays(anchorDate, mondayOffset);
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) dates.push(addDaysISO(format(monday, "yyyy-MM-dd"), i));
      return { from: dates[0]!, to: dates[6]!, dates };
    }
    // bulanan
    const y = anchorDate.getFullYear();
    const m = anchorDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const dates: string[] = [];
    for (let d = 1; d <= last.getDate(); d++) {
      dates.push(format(new Date(y, m, d), "yyyy-MM-dd"));
    }
    return { from: format(first, "yyyy-MM-dd"), to: format(last, "yyyy-MM-dd"), dates };
  }, [mode, anchorDate]);

  const [filterOpen, setFilterOpen] = React.useState(false);
  const isFilterActive = filterOutlet !== "all" || filterDivision !== "all" || filterShiftGroup !== "all";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kalender Jadwal"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
              <Copy className="size-4" /> Copy Minggu
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGenerateOpen(true)}>
              <Wand2 className="size-4" /> Generate
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLockTarget({ from: range.from, to: range.to, lock: true })}>
              <Lock className="size-4" /> Lock Periode
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <Card className="border-border shadow-soft">
        <CardContent className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
              {(["harian", "mingguan", "bulanan"] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "harian" ? <Calendar className="size-3.5" /> : m === "mingguan" ? <CalendarDays className="size-3.5" /> : <CalendarRange className="size-3.5" />}
                  {m}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => navigate(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAnchorDate(new Date())}>
                Hari Ini
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => navigate(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Date picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Calendar className="size-4" />
                  {formatDateMed(format(anchorDate, "yyyy-MM-dd"))}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={anchorDate}
                  onSelect={(d) => d && setAnchorDate(d)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Collapsible Filter Button */}
          <div className="flex items-center gap-2">
            <Button
              variant={isFilterActive ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterOpen(!filterOpen)}
              className="gap-1.5 text-xs rounded-xl font-semibold"
            >
              <Filter className="size-3.5" />
              <span>Filter Jadwal</span>
              {isFilterActive && <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px]">Aktif</span>}
            </Button>

            <Badge variant="outline" className="text-xs">
              <Users className="size-3 mr-1" /> {filteredEmps.length} karyawan
            </Badge>
          </div>
        </CardContent>

        {/* Collapsible Filter Panel */}
        {filterOpen && (
          <div className="border-t border-border/60 bg-muted/20 p-3 flex flex-wrap items-center gap-2 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold text-foreground mr-1 flex items-center gap-1">
              <Filter className="size-3 text-primary" /> Filter:
            </span>

            <Select value={filterOutlet} onValueChange={setFilterOutlet}>
              <SelectTrigger className="h-8 w-[140px] text-xs bg-background rounded-xl"><SelectValue placeholder="Outlet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Outlet</SelectItem>
                {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterDivision} onValueChange={setFilterDivision}>
              <SelectTrigger className="h-8 w-[140px] text-xs bg-background rounded-xl"><SelectValue placeholder="Divisi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Divisi</SelectItem>
                {divisions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterShiftGroup} onValueChange={setFilterShiftGroup}>
              <SelectTrigger className="h-8 w-[160px] text-xs bg-background rounded-xl"><SelectValue placeholder="Shift Group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Shift Group</SelectItem>
                {shiftGroups.filter((g) => g.status === "active").map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFilterOutlet("all");
                  setFilterDivision("all");
                  setFilterShiftGroup("all");
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Calendar grid */}
      <Card className="border-border shadow-soft">
        <CardContent className="p-0">
          {mode === "harian" ? (
            <DailyView date={range.from} employees={filteredEmps} onAssign={setAssignTarget} />
          ) : mode === "mingguan" ? (
            <WeeklyView dates={range.dates} employees={filteredEmps} onAssign={setAssignTarget} />
          ) : (
            <MonthlyView dates={range.dates} employees={filteredEmps} anchorDate={anchorDate} onAssign={setAssignTarget} />
          )}
        </CardContent>
      </Card>

      {/* Lock toggle for range */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Lock className="size-3.5" />
        Periode tampilan saat ini: {formatDateMed(range.from)} — {formatDateMed(range.to)}
        <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setLockTarget({ from: range.from, to: range.to, lock: false })}>
          <Unlock className="size-3.5" /> Buka Kunci Periode
        </Button>
      </div>

      {assignTarget ? (
        <AssignDialog
          target={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      ) : null}
      {generateOpen ? (
        <GenerateDialog range={range} onClose={() => setGenerateOpen(false)} />
      ) : null}
      {copyOpen ? (
        <CopyWeekDialog onClose={() => setCopyOpen(false)} />
      ) : null}
      <ConfirmDialog
        open={!!lockTarget}
        onOpenChange={(o) => !o && setLockTarget(null)}
        title={lockTarget?.lock ? "Kunci periode jadwal?" : "Buka kunci periode jadwal?"}
        description={`${lockTarget?.lock ? "Mengunci" : "Membuka kunci"} seluruh jadwal ${lockTarget?.from} — ${lockTarget?.to}.`}
        confirmLabel={lockTarget?.lock ? "Kunci" : "Buka Kunci"}
        onConfirm={() => {
          if (!lockTarget) return;
          const count = scheduleService.toggleLockRange(lockTarget.from, lockTarget.to, lockTarget.lock);
          toast.success(`${count} jadwal ${lockTarget.lock ? "dikunci" : "dibuka kuncinya"}`);
        }}
      />
    </div>
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ------------------------------------------------------------
// Daily View
// ------------------------------------------------------------
function DailyView({
  date,
  employees,
  onAssign,
}: {
  date: string;
  employees: ReturnType<typeof useStore<any>> extends infer T ? any : never;
  onAssign: (t: { employeeId: string; date: string }) => void;
}) {
  const schedules = useStore((s) => s.schedules);
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const dayScheds = schedules.filter((s) => s.date === date);

  return (
    <div className="divide-y divide-border">
      <div className="flex items-center justify-between bg-muted/30 px-4 py-2.5">
        <div>
          <p className="text-sm font-semibold text-foreground">{formatDateLong(date)}</p>
          <p className="text-[11px] text-muted-foreground">{dayScheds.length} jadwal · {employees.length - dayScheds.length} tanpa jadwal</p>
        </div>
      </div>
      {employees.length === 0 ? (
        <EmptyState title="Tidak ada karyawan" description="Sesuaikan filter untuk menampilkan karyawan." className="m-4" />
      ) : (
        <div className="grid grid-cols-1 gap-1.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp: any) => {
            const sched = dayScheds.find((s) => s.employeeId === emp.id);
            const shift = sched?.shiftTemplateId ? shiftTemplates.find((st) => st.id === sched.shiftTemplateId) : undefined;
            return (
              <ScheduleCell
                key={emp.id}
                emp={emp}
                shift={shift}
                locked={sched?.locked}
                hasSched={!!sched}
                conflicts={sched?.shiftTemplateId ? scheduleService.detectConflicts(emp.id, date) : []}
                onClick={() => onAssign({ employeeId: emp.id, date })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Weekly View
// ------------------------------------------------------------
function WeeklyView({
  dates,
  employees,
  onAssign,
}: {
  dates: string[];
  employees: any[];
  onAssign: (t: { employeeId: string; date: string }) => void;
}) {
  const schedules = useStore((s) => s.schedules);
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const holidays = useStore((s) => s.holidays);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="sticky left-0 z-10 min-w-[160px] bg-muted/30 px-3 py-2 text-left font-semibold text-muted-foreground">Karyawan</th>
            {dates.map((d) => {
              const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
              const isToday = d === todayISODate();
              const hol = holidays.find((h) => h.date === d);
              return (
                <th key={d} className={cn("min-w-[110px] px-2 py-2 text-center font-semibold", isToday ? "text-primary" : "text-muted-foreground")}>
                  <div className="flex flex-col">
                    <span>{dayNames[dow]}</span>
                    <span className={cn("text-sm", isToday && "font-bold")}>{d.slice(8)}</span>
                    {hol && <span className="text-[9px] font-normal text-destructive">🔴 {hol.name.slice(0, 12)}</span>}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={dates.length + 1} className="py-8 text-center text-muted-foreground">
                Tidak ada karyawan pada filter ini.
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="sticky left-0 z-10 bg-card px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">
                      {initials(emp.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{emp.fullName}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{lookupService.positionName(emp.positionId)}</p>
                    </div>
                  </div>
                </td>
                {dates.map((d) => {
                  const sched = schedules.find((s) => s.employeeId === emp.id && s.date === d);
                  const shift = sched?.shiftTemplateId ? shiftTemplates.find((st) => st.id === sched.shiftTemplateId) : undefined;
                  const conflicts = sched?.shiftTemplateId ? scheduleService.detectConflicts(emp.id, d) : [];
                  const hol = holidays.find((h) => h.date === d);
                  return (
                    <td key={d} className="px-1 py-1 text-center">
                      <button
                        onClick={() => onAssign({ employeeId: emp.id, date: d })}
                        className={cn(
                          "flex h-full min-h-[44px] w-full flex-col items-center justify-center gap-0.5 rounded-md border text-[10px] transition-all hover:scale-[1.03]",
                          shift
                            ? "border-transparent text-white shadow-soft"
                            : hol
                            ? "border-destructive/30 bg-destructive/5 text-destructive"
                            : sched
                            ? "border-dashed border-border bg-muted/30 text-muted-foreground"
                            : "border-dashed border-border/50 text-muted-foreground/50 hover:border-primary/40",
                        )}
                        style={shift ? { background: shift.color } : undefined}
                        title={shift ? `${shift.name} (${shift.startTime}-${shift.endTime})` : hol ? `Libur: ${hol.name}` : "Klik untuk atur jadwal"}
                      >
                        {shift ? (
                          <>
                            <span className="font-mono font-bold">{shift.startTime}</span>
                            {sched?.locked ? <Lock className="size-2.5" /> : null}
                            {conflicts.length > 0 ? <AlertTriangle className="size-2.5 text-destructive" /> : null}
                          </>
                        ) : hol ? (
                          <span className="text-[8px] font-semibold">🔴 Libur</span>
                        ) : sched ? (
                          <span>Libur</span>
                        ) : (
                          <Plus className="size-3" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------
// Monthly View
// ------------------------------------------------------------
function MonthlyView({
  dates,
  employees,
  anchorDate,
  onAssign,
}: {
  dates: string[];
  employees: any[];
  anchorDate: Date;
  onAssign: (t: { employeeId: string; date: string }) => void;
}) {
  const schedules = useStore((s) => s.schedules);
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const holidays = useStore((s) => s.holidays);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Build calendar grid with leading/trailing days
  const firstDate = dates[0]!;
  const firstDow = new Date(`${firstDate}T00:00:00Z`).getUTCDay();
  const gridDates: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) gridDates.push(null);
  gridDates.push(...dates);

  const selectedDayScheds = selectedDate ? schedules.filter((s) => s.date === selectedDate) : [];
  const noScheduleEmps = selectedDate ? employees.filter((e) => !selectedDayScheds.find((s) => s.employeeId === e.id)) : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-7 gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 p-2">
          {gridDates.map((d, i) => {
            if (!d) return <div key={i} className="aspect-square rounded-md bg-muted/20" />;
            const dayScheds = schedules.filter((s) => s.date === d);
            const isToday = d === todayISODate();
            const isSelected = d === selectedDate;
            const hol = holidays.find((h) => h.date === d);
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-start gap-0.5 rounded-md border p-1 text-center transition-all hover:scale-[1.03]",
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border",
                  isToday ? "bg-primary/10" : hol ? "bg-destructive/5" : "bg-card",
                )}
              >
                <span className={cn("text-xs font-bold", isToday ? "text-primary" : "text-foreground")}>{d.slice(8)}</span>
                {hol ? (
                  <span className="text-[7px] text-destructive font-medium truncate w-full text-center">🔴 {hol.name.slice(0, 10)}</span>
                ) : dayScheds.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {dayScheds.slice(0, 4).map((s) => {
                      const shift = s.shiftTemplateId ? shiftTemplates.find((st) => st.id === s.shiftTemplateId) : undefined;
                      return (
                        <span
                          key={s.id}
                          className="size-1.5 rounded-full"
                          style={{ background: shift?.color ?? "#EADFCB" }}
                        />
                      );
                    })}
                    {dayScheds.length > 4 ? <span className="text-[8px] text-muted-foreground">+{dayScheds.length - 4}</span> : null}
                  </div>
                ) : null}
                <span className="text-[8px] text-muted-foreground">{dayScheds.length} jadwal</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Side panel: detail tanggal terpilih */}
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {selectedDate ? formatDateLong(selectedDate) : `Detail ${monthLabel(format(anchorDate, "yyyy-MM"))}`}
          </CardTitle>
          <CardDescription className="text-xs">
            {selectedDate ? `${selectedDayScheds.length} jadwal · ${noScheduleEmps.length} tanpa jadwal` : "Pilih tanggal untuk lihat detail"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            <div className="space-y-2">
              {selectedDayScheds.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Belum ada jadwal.</p>
              ) : (
                <div className="max-h-[300px] space-y-1 overflow-y-auto">
                  {selectedDayScheds.map((s) => {
                    const emp = employees.find((e) => e.id === s.employeeId);
                    const shift = s.shiftTemplateId ? shiftTemplates.find((st) => st.id === s.shiftTemplateId) : undefined;
                    if (!emp) return null;
                    return (
                      <button
                        key={s.id}
                        onClick={() => onAssign({ employeeId: emp.id, date: selectedDate })}
                        className="flex w-full items-center gap-2 rounded-md border border-border p-1.5 text-left hover:bg-muted/30"
                      >
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[8px] font-bold text-primary-foreground">
                          {initials(emp.fullName)}
                        </div>
                        <span className="flex-1 truncate text-xs font-medium">{emp.fullName}</span>
                        {shift ? (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: shift.color }}>
                            {shift.startTime}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Libur</span>
                        )}
                        {s.locked ? <Lock className="size-2.5 text-muted-foreground" /> : null}
                      </button>
                    );
                  })}
                </div>
              )}
              {noScheduleEmps.length > 0 ? (
                <div className="border-t border-border pt-2">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-warning">
                    <AlertTriangle className="size-3" /> Tanpa jadwal ({noScheduleEmps.length})
                  </p>
                  <div className="max-h-[150px] space-y-0.5 overflow-y-auto">
                    {noScheduleEmps.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => onAssign({ employeeId: emp.id, date: selectedDate })}
                        className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] hover:bg-muted/30"
                      >
                        <Plus className="size-2.5 text-muted-foreground" />
                        <span className="truncate text-muted-foreground">{emp.fullName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-muted-foreground">Klik tanggal pada kalender.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Schedule Cell (for daily view)
// ------------------------------------------------------------
function ScheduleCell({
  emp,
  shift,
  locked,
  hasSched,
  conflicts,
  onClick,
}: {
  emp: any;
  shift: any;
  locked?: boolean;
  hasSched: boolean;
  conflicts: ConflictInfo[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2 text-left transition-all hover:scale-[1.02]",
        shift ? "border-transparent text-white shadow-soft" : hasSched ? "border-dashed border-border bg-muted/30" : "border-border bg-card hover:border-primary/40",
      )}
      style={shift ? { background: shift.color } : undefined}
    >
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold", shift ? "bg-white/20 text-white" : "bg-primary/15 text-primary-foreground")}>
        {initials(emp.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-xs font-medium", shift ? "text-white" : "text-foreground")}>{emp.fullName}</p>
        <p className={cn("truncate text-[10px]", shift ? "text-white/80" : "text-muted-foreground")}>
          {shift ? `${shift.name} · ${shift.startTime}-${shift.endTime}` : hasSched ? "Libur" : "Tanpa jadwal"}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        {locked ? <Lock className={cn("size-2.5", shift ? "text-white/70" : "text-muted-foreground")} /> : null}
        {conflicts.length > 0 ? <AlertTriangle className="size-3 text-destructive" /> : null}
      </div>
    </button>
  );
}

// ------------------------------------------------------------
// Assign Dialog (individual schedule)
// ------------------------------------------------------------
function AssignDialog({
  target,
  onClose,
}: {
  target: { employeeId: string; date: string };
  onClose: () => void;
}) {
  const employees = useStore((s) => s.employees);
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const schedules = useStore((s) => s.schedules);
  const emp = employees.find((e) => e.id === target.employeeId);
  const existing = schedules.find((s) => s.employeeId === target.employeeId && s.date === target.date);
  const [shiftId, setShiftId] = React.useState<string>(existing?.shiftTemplateId ?? "libur");
  const [note, setNote] = React.useState(existing?.note ?? "");
  const conflicts = shiftId !== "libur" ? scheduleService.detectConflicts(target.employeeId, target.date, shiftId) : [];

  const save = () => {
    try {
      if (shiftId === "libur") {
        scheduleService.remove(target.employeeId, target.date);
        toast.success("Jadwal dihapus (libur)");
      } else {
        scheduleService.upsert({
          employeeId: target.employeeId,
          date: target.date,
          shiftTemplateId: shiftId,
          outletId: emp?.primaryOutletId,
          source: "MANUAL",
          note: note.trim() || undefined,
        });
        toast.success("Jadwal disimpan");
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  };

  if (!emp) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" /> Atur Jadwal
          </DialogTitle>
          <DialogDescription>
            {emp.fullName} · {formatDateLong(target.date)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Shift">
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="libur">Libur</SelectItem>
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
          </Field>
          <Field label="Catatan">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
          </Field>
          {conflicts.length > 0 ? (
            <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="size-3.5" /> {conflicts.length} Konflik Terdeteksi
              </p>
              {conflicts.map((c, i) => (
                <p key={i} className="text-[11px] text-destructive">• [{c.type}] {c.message}</p>
              ))}
            </div>
          ) : shiftId !== "libur" ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/5 p-3 text-xs text-success">
              <CheckCircle2 className="size-3.5" /> Tidak ada konflik terdeteksi.
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={save}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Generate from Shift Group Dialog
// ------------------------------------------------------------
function GenerateDialog({ range, onClose }: { range: { from: string; to: string }; onClose: () => void }) {
  const shiftGroups = useStore((s) => s.shiftGroups);
  const [groupId, setGroupId] = React.useState("");
  const [from, setFrom] = React.useState(range.from);
  const [to, setTo] = React.useState(addDaysISO(range.from, 13));
  const [overwrite, setOverwrite] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const run = () => {
    if (!groupId) { setError("Pilih shift group."); return; }
    if (from > to) { setError("Tanggal akhir harus setelah tanggal awal."); return; }
    const count = scheduleService.generateFromShiftGroup(groupId, from, to, overwrite);
    toast.success(`${count} jadwal digenerate`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="size-5 text-primary" /> Generate dari Shift Group</DialogTitle>
          <DialogDescription>Otomatis buat jadwal dari pola mingguan shift group.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Shift Group" required>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger><SelectValue placeholder="Pilih shift group..." /></SelectTrigger>
              <SelectContent>
                {shiftGroups.filter((g) => g.status === "active").map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <FormRow>
            <Field label="Dari Tanggal"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="Sampai Tanggal"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </FormRow>
          <div className="flex items-center gap-2 rounded-lg border border-border p-2.5">
            <input type="checkbox" id="ow" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="accent-primary" />
            <label htmlFor="ow" className="text-xs text-foreground">Timpa jadwal yang sudah ada</label>
          </div>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={run}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Copy Week Dialog
// ------------------------------------------------------------
function CopyWeekDialog({ onClose }: { onClose: () => void }) {
  const [srcMonday, setSrcMonday] = React.useState(addDaysISO(todayISODate(), -7));
  const [dstMonday, setDstMonday] = React.useState(todayISODate());

  const run = () => {
    const count = scheduleService.copyWeek(srcMonday, dstMonday);
    toast.success(`${count} jadwal disalin`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Copy className="size-5 text-primary" /> Copy Minggu</DialogTitle>
          <DialogDescription>Salin seluruh jadwal dari minggu sumber ke minggu target.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Minggu Sumber (Senin)">
            <Input type="date" value={srcMonday} onChange={(e) => setSrcMonday(e.target.value)} />
          </Field>
          <Field label="Minggu Target (Senin)">
            <Input type="date" value={dstMonday} onChange={(e) => setDstMonday(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={run}>Copy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Swap Tab (Pengajuan & Tukar Shift)
// ============================================================
function SwapTab() {
  const swaps = useStore((s) => s.shiftSwaps);
  const [filter, setFilter] = React.useState<string>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [reviewTarget, setReviewTarget] = React.useState<string | null>(null);

  const filtered = swaps.filter((s) => filter === "all" || s.status === filter);

  const counts = {
    PENDING: swaps.filter((s) => s.status === "PENDING").length,
    APPROVED: swaps.filter((s) => s.status === "APPROVED").length,
    REJECTED: swaps.filter((s) => s.status === "REJECTED").length,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengajuan & Tukar Shift"
        description="Kelola pengajuan tukar shift antar karyawan, antar hari, dan antar outlet."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Buat Pengajuan</Button>}
      />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "Semua", count: swaps.length, color: "" },
          { key: "PENDING", label: "Pending", count: counts.PENDING, color: "bg-warning/10 text-warning border-warning/30" },
          { key: "APPROVED", label: "Approved", count: counts.APPROVED, color: "bg-success/10 text-success border-success/30" },
          { key: "REJECTED", label: "Rejected", count: counts.REJECTED, color: "bg-destructive/10 text-destructive border-destructive/30" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
              filter === t.key ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", t.color || "bg-muted text-muted-foreground")}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <EmptyState title="Tidak ada pengajuan" description="Belum ada pengajuan tukar shift pada filter ini." />
        ) : (
          filtered.map((swap) => (
            <SwapCard key={swap.id} swap={swap} onReview={() => setReviewTarget(swap.id)} />
          ))
        )}
      </div>

      {createOpen ? <CreateSwapDialog onClose={() => setCreateOpen(false)} /> : null}
      {reviewTarget ? <ReviewSwapDialog swapId={reviewTarget} onClose={() => setReviewTarget(null)} /> : null}
    </div>
  );
}

function SwapCard({ swap, onReview }: { swap: any; onReview: () => void }) {
  const employees = useStore((s) => s.employees);
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const outlets = useStore((s) => s.outlets);
  const preview = shiftSwapService.preview(swap);
  const requester = employees.find((e) => e.id === swap.requesterId);
  const counterpart = swap.counterpartId ? employees.find((e) => e.id === swap.counterpartId) : undefined;

  const typeLabel: Record<string, string> = {
    TUKAR_DUA_KARYAWAN: "Tukar Dua Karyawan",
    PINDAH_SATU_KARYAWAN: "Pindah Satu Karyawan",
    PERTUKARAN_HARI_KERJA: "Pertukaran Hari Kerja",
    ANTAR_OUTLET: "Antar Outlet",
  };

  return (
    <Card className="border-border shadow-soft transition-all hover:shadow-soft-md">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowLeftRight className="size-4" />
            </div>
            <div>
              <p className="font-mono text-xs font-medium text-foreground">{swap.requestNo}</p>
              <p className="text-[11px] text-muted-foreground">{typeLabel[swap.type]}</p>
            </div>
          </div>
          <StatusBadgeSwap status={swap.status} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* Before */}
          <div className="rounded-lg border border-border bg-muted/20 p-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Sebelum</p>
            <p className="text-xs text-foreground"><span className="font-medium">{requester?.fullName}</span>: {preview.before.requester ?? "—"}</p>
            {counterpart ? <p className="text-xs text-foreground"><span className="font-medium">{counterpart.fullName}</span>: {preview.before.counterpart ?? "—"}</p> : null}
          </div>
          {/* After */}
          <div className="rounded-lg border border-success/30 bg-success/5 p-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase text-success">Sesudah</p>
            <p className="text-xs text-foreground"><span className="font-medium">{requester?.fullName}</span>: {preview.after.requester ?? "—"}</p>
            {counterpart ? <p className="text-xs text-foreground"><span className="font-medium">{counterpart.fullName}</span>: {preview.after.counterpart ?? "—"}</p> : null}
          </div>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">Alasan: {swap.reason}</p>

        {swap.status === "PENDING" ? (
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={onReview}>Review</Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatusBadgeSwap({ status }: { status: ShiftSwapStatus }) {
  const map: Record<ShiftSwapStatus, string> = {
    PENDING: "bg-warning/15 text-warning border-warning/30",
    APPROVED: "bg-success/15 text-success border-success/30",
    REJECTED: "bg-destructive/10 text-destructive border-destructive/30",
    CANCELLED: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={map[status]}>{status}</Badge>;
}

function ReviewSwapDialog({ swapId, onClose }: { swapId: string; onClose: () => void }) {
  const swaps = useStore((s) => s.shiftSwaps);
  const employees = useStore((s) => s.employees);
  const swap = swaps.find((s) => s.id === swapId);
  const [note, setNote] = React.useState("");
  if (!swap) return null;
  const requester = employees.find((e) => e.id === swap.requesterId);
  const counterpart = swap.counterpartId ? employees.find((e) => e.id === swap.counterpartId) : undefined;
  const conflicts = scheduleService.detectConflicts(swap.requesterId, swap.targetDate);

  const approve = () => {
    shiftSwapService.approve(swapId, "hrd-staff-id", note || undefined);
    toast.success("Pengajuan disetujui & jadwal diperbarui");
    onClose();
  };
  const reject = () => {
    shiftSwapService.reject(swapId, "hrd-staff-id", note || undefined);
    toast.success("Pengajuan ditolak");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Review Pengajuan Tukar Shift</DialogTitle>
          <DialogDescription>{swap.requestNo}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p><span className="text-muted-foreground">Pengaju:</span> <span className="font-medium">{requester?.fullName}</span></p>
            {counterpart ? <p><span className="text-muted-foreground">Lawan Tukar:</span> <span className="font-medium">{counterpart.fullName}</span></p> : null}
            <p><span className="text-muted-foreground">Tanggal Sumber:</span> {formatDateMed(swap.sourceDate)}</p>
            <p><span className="text-muted-foreground">Tanggal Target:</span> {formatDateMed(swap.targetDate)}</p>
            <p><span className="text-muted-foreground">Alasan:</span> {swap.reason}</p>
          </div>
          {conflicts.length > 0 ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive"><AlertTriangle className="size-3.5" /> Konflik terdeteksi</p>
              {conflicts.map((c, i) => <p key={i} className="text-[11px] text-destructive">• [{c.type}] {c.message}</p>)}
            </div>
          ) : null}
          <Field label="Catatan Approval">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button variant="destructive" onClick={reject}><XCircle className="size-4" /> Tolak</Button>
          <Button onClick={approve}><CheckCircle2 className="size-4" /> Setujui</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateSwapDialog({ onClose }: { onClose: () => void }) {
  const employees = useStore((s) => s.employees);
  const shiftTemplates = useStore((s) => s.shiftTemplates);
  const outlets = useStore((s) => s.outlets);
  const [type, setType] = React.useState<ShiftSwapType>("PINDAH_SATU_KARYAWAN");
  const [requesterId, setRequesterId] = React.useState("");
  const [counterpartId, setCounterpartId] = React.useState("");
  const [sourceDate, setSourceDate] = React.useState(todayISODate());
  const [targetDate, setTargetDate] = React.useState(todayISODate());
  const [sourceShift, setSourceShift] = React.useState("");
  const [targetShift, setTargetShift] = React.useState("");
  const [sourceOutlet, setSourceOutlet] = React.useState("");
  const [targetOutlet, setTargetOutlet] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string>();

  const submit = () => {
    if (!requesterId) { setError("Pilih karyawan pengaju."); return; }
    if ((type === "TUKAR_DUA_KARYAWAN" || type === "PERTUKARAN_HARI_KERJA" || type === "ANTAR_OUTLET") && !counterpartId) {
      setError("Pilih lawan tukar untuk tipe ini."); return;
    }
    shiftSwapService.create({
      requestNo: `SWP/${todayISODate().slice(0, 4)}/${String(Date.now()).slice(-4)}`,
      type,
      requesterId,
      counterpartId: counterpartId || undefined,
      sourceDate,
      targetDate,
      sourceShiftTemplateId: sourceShift || undefined,
      targetShiftTemplateId: targetShift || undefined,
      sourceOutletId: sourceOutlet || undefined,
      targetOutletId: targetOutlet || undefined,
      reason,
      originalSubmitterId: requesterId,
    });
    toast.success("Pengajuan tukar shift dibuat");
    onClose();
  };

  const activeEmps = employees.filter((e) => e.status === "AKTIF");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="size-5 text-primary" /> Buat Pengajuan Tukar Shift</DialogTitle>
          <DialogDescription>Pilih tipe & isi detail tukar shift.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Tipe Tukar Shift">
            <Select value={type} onValueChange={(v) => setType(v as ShiftSwapType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PINDAH_SATU_KARYAWAN">Pindah Satu Karyawan</SelectItem>
                <SelectItem value="TUKAR_DUA_KARYAWAN">Tukar Dua Karyawan</SelectItem>
                <SelectItem value="PERTUKARAN_HARI_KERJA">Pertukaran Hari Kerja</SelectItem>
                <SelectItem value="ANTAR_OUTLET">Antar Outlet</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <FormRow>
            <Field label="Karyawan Pengaju" required>
              <Select value={requesterId} onValueChange={setRequesterId}>
                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {activeEmps.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName} — {e.nik}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {(type === "TUKAR_DUA_KARYAWAN" || type === "PERTUKARAN_HARI_KERJA" || type === "ANTAR_OUTLET") ? (
              <Field label="Lawan Tukar" required>
                <Select value={counterpartId} onValueChange={setCounterpartId}>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {activeEmps.filter((e) => e.id !== requesterId).map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName} — {e.nik}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </FormRow>
          <FormRow>
            <Field label="Tanggal Sumber"><Input type="date" value={sourceDate} onChange={(e) => setSourceDate(e.target.value)} /></Field>
            <Field label="Tanggal Target"><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></Field>
          </FormRow>
          <FormRow>
            <Field label="Shift Target">
              <Select value={targetShift} onValueChange={setTargetShift}>
                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {shiftTemplates.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {type === "ANTAR_OUTLET" ? (
              <Field label="Outlet Target">
                <Select value={targetOutlet} onValueChange={setTargetOutlet}>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </FormRow>
          <Field label="Alasan"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan pengajuan" /></Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit}>Buat Pengajuan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
