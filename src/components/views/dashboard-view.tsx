"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  AttendanceTrendChart,
  ContractStatusChart,
  OutletDistributionChart,
  OvertimePlanVsActualChart,
} from "@/components/dashboard/charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useDataState } from "@/hooks/use-store";
import { computeDashboardStats } from "@/lib/services/dashboard";
import { navigate } from "@/lib/router/use-route";
import { todayISODate, formatDateLong, cn } from "@/lib/utils";
import {
  Users,
  Building2,
  UserCheck,
  AlarmClock,
  UserX,
  ClipboardList,
  FileText,
  Clock,
  Wallet,
  CalendarDays,
  Zap,
  ClipboardCheck,
  Palmtree,
  FileBarChart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DashboardView() {
  const state = useDataState();
  const stats = computeDashboardStats(state);
  const today = todayISODate();
  const weekday = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard HRD"
        description={`Selamat datang kembali. Hari ini ${weekday}, ${formatDateLong(today)}.`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <StatCard
          label="Total Karyawan Aktif"
          value={stats.totalActiveEmployees}
          icon={Users}
          accent="primary"
          hint="Seluruh karyawan berstatus AKTIF"
          actionLabel="Lihat data"
          onAction={() => navigate("#/karyawan")}
        />
        <StatCard
          label="Total Outlet"
          value={stats.totalOutlets}
          icon={Building2}
          accent="info"
          hint="Outlet aktif seluruh wilayah"
          actionLabel="Lihat outlet"
          onAction={() => navigate("#/outlet")}
        />
        <StatCard
          label="Kehadiran Hari Ini"
          value={stats.presentToday}
          icon={UserCheck}
          accent="success"
          hint="Sudah check-in hari ini"
          actionLabel="Lihat absensi"
          onAction={() => navigate("#/absensi")}
        />
        <StatCard
          label="Karyawan Terlambat"
          value={stats.lateToday}
          icon={AlarmClock}
          accent="warning"
          hint="Terlambat lebih dari 5 menit"
          actionLabel="Lihat absensi"
          onAction={() => navigate("#/absensi?filter=terlambat")}
        />
        <StatCard
          label="Belum Hadir"
          value={stats.notPresentYet}
          icon={UserX}
          accent="destructive"
          hint="Dijadwalkan tapi belum check-in"
          actionLabel="Lihat absensi"
          onAction={() => navigate("#/absensi?filter=belum_hadir")}
        />
        <StatCard
          label="Pengajuan Pending"
          value={stats.pendingSubmissions}
          icon={ClipboardList}
          accent="warning"
          hint="Cuti, izin & lembur menunggu approval"
          actionLabel="Lihat pengajuan"
          onAction={() => navigate("#/cuti?filter=pending")}
        />
        <StatCard
          label="Kontrak Akan Berakhir"
          value={stats.expiringContracts}
          icon={FileText}
          accent="warning"
          hint="Jatuh tempo ≤ 90 hari"
          actionLabel="Lihat kontrak"
          onAction={() => navigate("#/kontrak?filter=akan_berakhir")}
        />
        <StatCard
          label="Lembur Menunggu Review"
          value={stats.overtimeAwaitingReview}
          icon={Clock}
          accent="primary"
          hint="Planning pending & actual belum diverifikasi"
          actionLabel="Lihat lembur"
          onAction={() => navigate("#/lembur?filter=pending")}
        />
        <StatCard
          label="Payroll Perlu Review"
          value={stats.payrollNeedsReview}
          icon={Wallet}
          accent="info"
          hint="Entri berstatus Draft"
          actionLabel="Lihat payroll"
          onAction={() => navigate("#/payroll?filter=draft")}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendChart />
        </div>
        <ContractStatusChart />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <OutletDistributionChart />
        <div className="lg:col-span-2">
          <OvertimePlanVsActualChart />
        </div>
      </div>

      {/* Recent activity + quick summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <QuickSummaryCard />
      </div>
    </div>
  );
}

function QuickSummaryCard() {
  const state = useDataState();
  const activeByCategory = {
    OUTLET: state.employees.filter((e) => e.status === "AKTIF" && e.category === "OUTLET").length,
    NON_OUTLET: state.employees.filter((e) => e.status === "AKTIF" && e.category === "NON_OUTLET").length,
  };
  const onLeaveToday = state.leaves.filter(
    (l) =>
      l.status === "APPROVED" &&
      l.startDate <= todayISODate() &&
      l.endDate >= todayISODate(),
  ).length;
  const anomalies = state.overtimeActuals.filter(
    (a) => !a.planningId || a.verificationStatus === "BELUM_DIISI",
  ).length;

  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ringkasan Cepat</CardTitle>
        <CardDescription className="text-xs">
          Indikator penting hari ini
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryRow
          icon={CalendarDays}
          label="Kategori OUTLET"
          value={`${activeByCategory.OUTLET} karyawan`}
        />
        <SummaryRow
          icon={Building2}
          label="Kategori NON-OUTLET"
          value={`${activeByCategory.NON_OUTLET} karyawan`}
        />
        <SummaryRow
          icon={UserX}
          label="Sedang Cuti Hari Ini"
          value={`${onLeaveToday} karyawan`}
        />
        <SummaryRow
          icon={AlarmClock}
          label="Anomali Lembur"
          value={`${anomalies} item`}
          highlight={anomalies > 0}
        />
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Status Data Mock
            </span>
            <Badge className="bg-success/15 text-success border-success/30">
              Terpusat
            </Badge>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Seluruh data dashboard dibaca dari central data service yang sama
            dengan tabel, form, dan laporan (modul fase berikutnya).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: LucideIconType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg px-1 py-1">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span
        className={
          highlight
            ? "text-xs font-semibold text-destructive"
            : "text-xs font-semibold text-foreground tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

type LucideIconType = React.ComponentType<{ className?: string }>;

// ------------------------------------------------------------
// Quick Actions — shortcut ke aksi umum HRD
// ------------------------------------------------------------
function QuickActions() {
  const actions = [
    { label: "Tambah Karyawan", desc: "Daftarkan karyawan baru", icon: Users, href: "#/karyawan", color: "bg-primary/10 text-primary" },
    { label: "Atur Jadwal", desc: "Kelola kalender jadwal", icon: CalendarDays, href: "#/jadwal", color: "bg-info/10 text-info" },
    { label: "Input Absensi", desc: "Catat kehadiran hari ini", icon: ClipboardCheck, href: "#/absensi", color: "bg-success/10 text-success" },
    { label: "Review Cuti", desc: "Setujui pengajuan cuti", icon: Palmtree, href: "#/cuti?filter=PENDING", color: "bg-success/10 text-success" },
    { label: "Review Lembur", desc: "Verifikasi actual lembur", icon: Clock, href: "#/lembur", color: "bg-primary/10 text-primary" },
    { label: "Generate Payroll", desc: "Buat preview payroll", icon: Wallet, href: "#/payroll", color: "bg-chart-4/10 text-foreground" },
    { label: "Lihat Laporan", desc: "Analisis data workforce", icon: FileBarChart, href: "#/laporan", color: "bg-info/10 text-info" },
    { label: "Monitoring Kontrak", desc: "Cek jatuh tempo", icon: FileText, href: "#/kontrak", color: "bg-warning/10 text-warning" },
  ];
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="size-4 text-primary" /> Aksi Cepat
        </CardTitle>
        <CardDescription className="text-xs">Shortcut ke aktivitas HRD yang sering dilakukan.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => navigate(a.href)}
                className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
              >
                <div className={cn("flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110", a.color)}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{a.label}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{a.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
