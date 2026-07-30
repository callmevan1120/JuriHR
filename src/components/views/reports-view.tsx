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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useStore } from "@/hooks/use-store";
import { reportService } from "@/lib/services/finance";
import { lookupService } from "@/lib/services/master-data";
import {
  formatRupiah,
  formatDateMed,
  todayISODate,
  addDaysISO,
  cn,
  formatDuration,
  monthLabel,
} from "@/lib/utils";
import { toast } from "sonner";
import {
  Download,
  Printer,
  FileBarChart,
  Users,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Plane,
  Clock,
  Wallet,
  FileText,
  TrendingUp,
  MapPin,
} from "lucide-react";

const REPORT_TYPES = [
  { value: "workforce", label: "Ringkasan Workforce", icon: Users },
  { value: "employee", label: "Data Karyawan", icon: FileText },
  { value: "distribution", label: "Distribusi Outlet & Divisi", icon: Building2 },
  { value: "attendance", label: "Kehadiran", icon: ClipboardCheck },
  { value: "late", label: "Keterlambatan", icon: Clock },
  { value: "leave", label: "Cuti & Izin", icon: Plane },
  { value: "overtime", label: "Planning vs Actual Lembur", icon: TrendingUp },
  { value: "contract", label: "Kontrak Akan Berakhir", icon: FileText },
  { value: "payroll", label: "Payroll Preview", icon: Wallet },
];

export function ReportsView() {
  const [fromDate, setFromDate] = React.useState(addDaysISO(todayISODate(), -30));
  const [toDate, setToDate] = React.useState(todayISODate());
  const [filterOutlet, setFilterOutlet] = React.useState<string>("all");
  const [reportType, setReportType] = React.useState("workforce");

  const state = useStore((s) => s);
  const summary = React.useMemo(() => reportService.workforceSummary(fromDate, toDate), [state, fromDate, toDate]);

  const handleExport = () => {
    toast.success("Laporan diekspor (CSV)");
  };

  const handlePrint = () => {
    window.print();
    toast.info("Gunakan 'Save as PDF' pada dialog cetak.");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan"
        description="Laporan multi-modul dengan filter periode, outlet, dan export."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="size-4" /> Print/PDF</Button>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="size-4" /> Export</Button>
          </>
        }
      />

      {/* Filter bar */}
      <Card className="border-border ">
        <CardContent className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[150px]" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[150px]" />
          </div>
          <Select value={filterOutlet} onValueChange={setFilterOutlet}>
            <SelectTrigger className="h-9 w-[170px] text-sm"><SelectValue placeholder="Outlet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {state.outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="h-9 w-[200px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Report content */}
      {reportType === "workforce" ? <WorkforceReport summary={summary} /> : null}
      {reportType === "employee" ? <EmployeeReport state={state} filterOutlet={filterOutlet} /> : null}
      {reportType === "distribution" ? <DistributionReport state={state} /> : null}
      {reportType === "attendance" ? <AttendanceReport state={state} fromDate={fromDate} toDate={toDate} filterOutlet={filterOutlet} /> : null}
      {reportType === "late" ? <LateReport state={state} fromDate={fromDate} toDate={toDate} filterOutlet={filterOutlet} /> : null}
      {reportType === "leave" ? <LeaveReport state={state} fromDate={fromDate} toDate={toDate} filterOutlet={filterOutlet} /> : null}
      {reportType === "overtime" ? <OvertimeReport state={state} fromDate={fromDate} toDate={toDate} /> : null}
      {reportType === "contract" ? <ContractReport state={state} /> : null}
      {reportType === "payroll" ? <PayrollReport state={state} /> : null}
    </div>
  );
}

// ------------------------------------------------------------
// Workforce Summary Report
// ------------------------------------------------------------
function WorkforceReport({ summary }: { summary: ReturnType<typeof reportService.workforceSummary> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total Karyawan" value={String(summary.totalEmployees)} icon={Users} color="text-primary" bg="bg-primary/10" />
        <SummaryCard label="Hadir" value={String(summary.attendance.hadir)} icon={ClipboardCheck} color="text-success" bg="bg-success/10" />
        <SummaryCard label="Terlambat" value={String(summary.attendance.terlambat)} icon={Clock} color="text-warning" bg="bg-warning/10" />
        <SummaryCard label="Tidak Hadir" value={String(summary.attendance.tidakHadir)} icon={ClipboardCheck} color="text-destructive" bg="bg-destructive/10" />
        <SummaryCard label="Cuti/Izin/Sakit" value={String(summary.leaves.total)} icon={Plane} color="text-info" bg="bg-info/10" />
        <SummaryCard label="Lembur Terverifikasi" value={String(summary.overtime.verified)} icon={Clock} color="text-success" bg="bg-success/10" />
        <SummaryCard label="Nominal Lembur" value={formatRupiah(summary.overtime.totalAmount)} icon={Wallet} color="text-primary" bg="bg-primary/10" />
        <SummaryCard label="Kontrak Akan Berakhir" value={String(summary.contracts.expiring)} icon={FileText} color="text-warning" bg="bg-warning/10" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border ">
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribusi Kehadiran</CardTitle></CardHeader>
          <CardContent>
            <PieChartDist data={[
              { name: "Hadir", value: summary.attendance.hadir, color: "var(--success)" },
              { name: "Terlambat", value: summary.attendance.terlambat, color: "var(--warning)" },
              { name: "Tidak Hadir", value: summary.attendance.tidakHadir, color: "var(--destructive)" },
              { name: "Cuti/Izin/Sakit", value: summary.attendance.cuti + summary.attendance.izin + summary.attendance.sakit, color: "var(--info)" },
            ]} />
          </CardContent>
        </Card>
        <Card className="border-border ">
          <CardHeader className="pb-2"><CardTitle className="text-base">Potongan & Lembur</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div><p className="text-xs text-muted-foreground">Total Potongan Keterlambatan</p><p className="text-lg font-bold text-destructive">{formatRupiah(summary.attendance.totalLateDeduction)}</p></div>
              <Clock className="size-8 text-destructive/30" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 p-3">
              <div><p className="text-xs text-muted-foreground">Total Lembur Terverifikasi</p><p className="text-lg font-bold text-success">{formatRupiah(summary.overtime.totalAmount)}</p></div>
              <TrendingUp className="size-8 text-success/30" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3">
              <div><p className="text-xs text-muted-foreground">Anomali Lembur</p><p className="text-lg font-bold text-warning">{summary.overtime.anomalies}</p></div>
              <Clock className="size-8 text-warning/30" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Employee Report
// ------------------------------------------------------------
function EmployeeReport({ state, filterOutlet }: { state: any; filterOutlet: string }) {
  const filtered = state.employees.filter((e: any) => {
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    return true;
  });
  return (
    <Card className="border-border ">
      <CardHeader className="pb-3"><CardTitle className="text-base">Data Karyawan ({filtered.length})</CardTitle><CardDescription className="text-xs">Filter: {filterOutlet === "all" ? "Semua Outlet" : state.outlets.find((o: any) => o.id === filterOutlet)?.name}</CardDescription></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">NIK</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Nama</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Posisi</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Outlet</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Gaji</th>
            </tr></thead>
            <tbody>
              {filtered.map((e: any) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono">{e.nik}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{e.fullName}</td>
                  <td className="px-3 py-2">{lookupService.positionName(e.positionId)}</td>
                  <td className="px-3 py-2">{lookupService.outletName(e.primaryOutletId)}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className={e.status === "AKTIF" ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}>{e.status}</Badge></td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(e.salaryAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Distribution Report
// ------------------------------------------------------------
function DistributionReport({ state }: { state: any }) {
  const distribution = reportService.employeeDistribution();
  const divDistribution = state.divisions.filter((d: any) => d.status === "active").map((d: any) => ({
    name: d.name,
    count: state.employees.filter((e: any) => e.divisionId === d.id && e.status === "AKTIF").length,
  })).filter((x: any) => x.count > 0);

  const config: ChartConfig = { count: { label: "Karyawan", color: "var(--chart-1)" } };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="border-border ">
        <CardHeader className="pb-2"><CardTitle className="text-base">Distribusi per Outlet</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-[280px] w-full">
            <BarChart data={distribution.map((d: any) => ({ name: d.outlet.name.replace("JURI Bun — ", ""), count: d.employees }))} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} className="text-[11px]" />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} className="text-[11px]" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="border-border ">
        <CardHeader className="pb-2"><CardTitle className="text-base">Distribusi per Divisi</CardTitle></CardHeader>
        <CardContent>
          <PieChartDist data={divDistribution.map((d: any, i: number) => ({ name: d.name, value: d.count, color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"][i % 5] }))} />
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Attendance Report
// ------------------------------------------------------------
function AttendanceReport({ state, fromDate, toDate, filterOutlet }: { state: any; fromDate: string; toDate: string; filterOutlet: string }) {
  const attendances = state.attendances.filter((a: any) => a.date >= fromDate && a.date <= toDate);
  const filteredEmps = state.employees.filter((e: any) => {
    if (e.status !== "AKTIF") return false;
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    return true;
  });

  const data = filteredEmps.map((emp: any) => {
    const recs = attendances.filter((a: any) => a.employeeId === emp.id);
    return {
      emp,
      hadir: recs.filter((a: any) => a.status === "HADIR").length,
      terlambat: recs.filter((a: any) => a.status === "TERLAMBAT").length,
      tidakHadir: recs.filter((a: any) => a.status === "TIDAK_HADIR").length,
      cuti: recs.filter((a: any) => a.status === "CUTI").length,
      totalLate: recs.reduce((s: number, a: any) => s + a.lateMinutes, 0),
      deduction: recs.reduce((s: number, a: any) => s + a.deduction, 0),
    };
  });

  return (
    <Card className="border-border ">
      <CardHeader className="pb-3"><CardTitle className="text-base">Laporan Kehadiran ({data.length} karyawan)</CardTitle><CardDescription className="text-xs">{formatDateMed(fromDate)} — {formatDateMed(toDate)}</CardDescription></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Karyawan</th>
              <th className="px-2 py-2 text-center font-semibold text-success">Hadir</th>
              <th className="px-2 py-2 text-center font-semibold text-warning">Telat</th>
              <th className="px-2 py-2 text-center font-semibold text-destructive">TH</th>
              <th className="px-2 py-2 text-center font-semibold text-info">Cuti</th>
              <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Telat Total</th>
              <th className="px-3 py-2 text-right font-semibold text-destructive">Potongan</th>
            </tr></thead>
            <tbody>
              {data.map((d: any) => (
                <tr key={d.emp.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-3 py-2"><p className="font-medium text-foreground">{d.emp.fullName}</p><p className="text-[10px] text-muted-foreground">{lookupService.outletName(d.emp.primaryOutletId)}</p></td>
                  <td className="px-2 py-2 text-center tabular-nums text-success">{d.hadir}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-warning">{d.terlambat}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-destructive">{d.tidakHadir}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-info">{d.cuti}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatDuration(d.totalLate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-destructive">{formatRupiah(d.deduction)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Late Report
// ------------------------------------------------------------
function LateReport({ state, fromDate, toDate, filterOutlet }: { state: any; fromDate: string; toDate: string; filterOutlet: string }) {
  const lateRecords = state.attendances.filter((a: any) => {
    if (a.status !== "TERLAMBAT") return false;
    if (a.date < fromDate || a.date > toDate) return false;
    if (filterOutlet !== "all") {
      const emp = state.employees.find((e: any) => e.id === a.employeeId);
      if (emp?.primaryOutletId !== filterOutlet) return false;
    }
    return true;
  }).sort((a: any, b: any) => b.lateMinutes - a.lateMinutes);

  const totalDeduction = lateRecords.reduce((s: number, a: any) => s + a.deduction, 0);
  const totalMinutes = lateRecords.reduce((s: number, a: any) => s + a.lateMinutes, 0);
  const avgLate = lateRecords.length ? Math.round(totalMinutes / lateRecords.length) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total Kejadian" value={String(lateRecords.length)} icon={Clock} color="text-warning" bg="bg-warning/10" />
        <SummaryCard label="Rata-rata Telat" value={`${avgLate}m`} icon={Clock} color="text-info" bg="bg-info/10" />
        <SummaryCard label="Total Potongan" value={formatRupiah(totalDeduction)} icon={Wallet} color="text-destructive" bg="bg-destructive/10" />
      </div>
      <Card className="border-border ">
        <CardHeader className="pb-3"><CardTitle className="text-base">Daftar Keterlambatan</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {lateRecords.slice(0, 50).map((a: any) => {
              const emp = state.employees.find((e: any) => e.id === a.employeeId);
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex size-8 items-center justify-center rounded-full bg-warning/15 text-[9px] font-bold text-warning">{emp ? emp.fullName.charAt(0) : "?"}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{emp?.fullName}</p><p className="text-[10px] text-muted-foreground">{formatDateMed(a.date)}</p></div>
                  <Badge className="bg-warning/15 text-warning border-warning/30">+{a.lateMinutes}m</Badge>
                  <span className="text-xs font-medium text-destructive">-{formatRupiah(a.deduction)}</span>
                </div>
              );
            })}
            {lateRecords.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada keterlambatan.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Leave Report
// ------------------------------------------------------------
function LeaveReport({ state, fromDate, toDate, filterOutlet }: { state: any; fromDate: string; toDate: string; filterOutlet: string }) {
  const leaves = state.leaves.filter((l: any) => l.startDate <= toDate && l.endDate >= fromDate);
  const filtered = leaves.filter((l: any) => {
    if (filterOutlet === "all") return true;
    const emp = state.employees.find((e: any) => e.id === l.employeeId);
    return emp?.primaryOutletId === filterOutlet;
  });

  return (
    <Card className="border-border ">
      <CardHeader className="pb-3"><CardTitle className="text-base">Laporan Cuti & Izin ({filtered.length})</CardTitle><CardDescription className="text-xs">{formatDateMed(fromDate)} — {formatDateMed(toDate)}</CardDescription></CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {filtered.map((l: any) => {
            const emp = state.employees.find((e: any) => e.id === l.employeeId);
            return (
              <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-info/10 text-info"><Plane className="size-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{emp?.fullName}</p>
                  <p className="text-[10px] text-muted-foreground">{l.type} · {formatDateMed(l.startDate)} — {formatDateMed(l.endDate)}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">{l.reason}</span>
                <Badge variant="outline" className={l.status === "APPROVED" ? "bg-success/15 text-success border-success/30" : l.status === "PENDING" ? "bg-warning/15 text-warning border-warning/30" : "bg-muted text-muted-foreground"}>{l.status}</Badge>
              </div>
            );
          })}
          {filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada data cuti/izin.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Overtime Report
// ------------------------------------------------------------
function OvertimeReport({ state, fromDate, toDate }: { state: any; fromDate: string; toDate: string }) {
  const plannings = state.overtimePlannings.filter((p: any) => p.date >= fromDate && p.date <= toDate);
  const actuals = state.overtimeActuals.filter((a: any) => a.date >= fromDate && a.date <= toDate);
  const verified = actuals.filter((a: any) => a.verificationStatus === "TERVERIFIKASI");
  const totalPlannedMin = plannings.reduce((s: number, p: any) => s + p.durationMinutes * p.employeeIds.length, 0);
  const totalActualMin = verified.reduce((s: number, a: any) => s + (a.actualDurationMinutes ?? 0), 0);
  const totalAmount = verified.reduce((s: number, a: any) => s + a.estimatedNominal, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Planning" value={String(plannings.length)} icon={Clock} color="text-info" bg="bg-info/10" />
        <SummaryCard label="Actual Terverifikasi" value={String(verified.length)} icon={ClipboardCheck} color="text-success" bg="bg-success/10" />
        <SummaryCard label="Total Jam Actual" value={formatDuration(totalActualMin)} icon={Clock} color="text-primary" bg="bg-primary/10" />
        <SummaryCard label="Total Nominal" value={formatRupiah(totalAmount)} icon={Wallet} color="text-success" bg="bg-success/10" />
      </div>
      <Card className="border-border ">
        <CardHeader className="pb-2"><CardTitle className="text-base">Planning vs Actual (jam)</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={{ planning: { label: "Planning", color: "var(--chart-4)" }, actual: { label: "Actual", color: "var(--chart-1)" } }} className="h-[260px] w-full">
            <BarChart data={[{ name: "Total", planning: Math.round(totalPlannedMin / 60), actual: Math.round(totalActualMin / 60) }]} margin={{ left: -16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" className="text-[11px]" />
              <YAxis className="text-[11px]" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="planning" fill="var(--color-planning)" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Contract Report
// ------------------------------------------------------------
function ContractReport({ state }: { state: any }) {
  const today = todayISODate();
  const expiring = state.contracts.filter((c: any) => {
    const days = Math.ceil((new Date(c.endDate).getTime() - new Date(today).getTime()) / 86400000);
    return days >= 0 && days <= 90 && c.status !== "DIPERPANJANG";
  }).sort((a: any, b: any) => a.endDate.localeCompare(b.endDate));

  return (
    <Card className="border-border ">
      <CardHeader className="pb-3"><CardTitle className="text-base">Kontrak Akan Berakhir ({expiring.length})</CardTitle><CardDescription className="text-xs">Jatuh tempo ≤ 90 hari</CardDescription></CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {expiring.map((c: any) => {
            const emp = state.employees.find((e: any) => e.id === c.employeeId);
            const days = Math.ceil((new Date(c.endDate).getTime() - new Date(today).getTime()) / 86400000);
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10 text-warning"><FileText className="size-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{emp?.fullName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{c.contractNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{formatDateMed(c.endDate)}</p>
                  <Badge variant="outline" className={days <= 7 ? "bg-destructive/10 text-destructive border-destructive/30" : days <= 30 ? "bg-warning/15 text-warning border-warning/30" : "bg-info/10 text-info border-info/30"}>{days}h lagi</Badge>
                </div>
              </div>
            );
          })}
          {expiring.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada kontrak akan berakhir.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Payroll Report
// ------------------------------------------------------------
function PayrollReport({ state }: { state: any }) {
  const period = todayISODate().slice(0, 7);
  const entries = state.payrolls.filter((p: any) => p.period === period);
  const total = entries.reduce((s: number, p: any) => s + p.total, 0);
  const draft = entries.filter((p: any) => p.status === "DRAFT").length;
  const finalized = entries.filter((p: any) => p.status === "FINALIZED").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total Entri" value={String(entries.length)} icon={Wallet} color="text-primary" bg="bg-primary/10" />
        <SummaryCard label="Draft" value={String(draft)} icon={FileText} color="text-muted-foreground" bg="bg-muted/50" />
        <SummaryCard label="Grand Total" value={formatRupiah(total)} icon={TrendingUp} color="text-success" bg="bg-success/10" />
      </div>
      <Card className="border-border ">
        <CardHeader className="pb-3"><CardTitle className="text-base">Payroll Preview — {monthLabel(period)}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Karyawan</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Gaji Dasar</th>
                <th className="px-3 py-2 text-right font-semibold text-success">Lembur</th>
                <th className="px-3 py-2 text-right font-semibold text-destructive">Potongan</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">Total</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
              </tr></thead>
              <tbody>
                {entries.map((p: any) => {
                  const emp = state.employees.find((e: any) => e.id === p.employeeId);
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium text-foreground">{emp?.fullName}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(p.baseSalary)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-success">{formatRupiah(p.overtimeAmount)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-destructive">{formatRupiah(p.lateDeduction + p.absenceDeduction)}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatRupiah(p.total)}</td>
                      <td className="px-3 py-2 text-center"><Badge variant="outline" className={p.status === "FINALIZED" ? "bg-success/15 text-success border-success/30" : p.status === "REVIEWED" ? "bg-info/15 text-info border-info/30" : "bg-muted text-muted-foreground"}>{p.status}</Badge></td>
                    </tr>
                  );
                })}
                {entries.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada payroll periode ini.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Shared components
// ------------------------------------------------------------
function SummaryCard({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: typeof Users; color: string; bg: string }) {
  return (
    <Card className="border-border p-4 ">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", bg, color)}><Icon className="size-4" /></div>
        <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="truncate text-lg font-bold tabular-nums text-foreground">{value}</p></div>
      </div>
    </Card>
  );
}

function PieChartDist({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const config: ChartConfig = { value: { label: "Jumlah" } };
  return (
    <div className="relative">
      <ChartContainer config={config} className="mx-auto h-[220px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={2} strokeWidth={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-foreground">{total}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
            <span className="font-medium tabular-nums text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
