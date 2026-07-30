"use client";

import * as React from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  AttendanceTrendChart,
  ContractStatusChart,
} from "@/components/dashboard/charts";
import { OutletEmployeeDistribution } from "@/components/dashboard/outlet-employee-distribution";
import { useDataState } from "@/hooks/use-store";
import { computeDashboardStats } from "@/lib/services/dashboard";
import { navigate } from "@/lib/router/use-route";
import { todayISODate, formatDateLong, cn } from "@/lib/utils";
import {
  Users,
  UserCheck,
  Clock,
  ClipboardList,
  Store,
  CalendarDays,
  Umbrella,
  Receipt,
  Map,
  FileText,
} from "lucide-react";

const QUICK_ACTIONS = [
  { icon: Users, label: "Karyawan", href: "#/karyawan", color: "bg-primary/15 text-primary" },
  { icon: Store, label: "Outlet", href: "#/outlet", color: "bg-info/15 text-info" },
  { icon: UserCheck, label: "Absensi", href: "#/absensi", color: "bg-success/15 text-success" },
  { icon: Umbrella, label: "Cuti", href: "#/cuti", color: "bg-warning/15 text-warning" },
  { icon: CalendarDays, label: "Jadwal", href: "#/jadwal", color: "bg-primary/15 text-primary" },
  { icon: Receipt, label: "Payroll", href: "#/payroll", color: "bg-info/15 text-info" },
  { icon: FileText, label: "Kontrak", href: "#/kontrak", color: "bg-destructive/10 text-destructive" },
  { icon: Map, label: "Domisili", href: "#/domisili", color: "bg-success/15 text-success" },
];

export function DashboardView() {
  const state = useDataState();
  const stats = computeDashboardStats(state);
  const today = todayISODate();
  const weekday = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">
            Selamat Datang, <span className="text-primary">HRD Admin</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {weekday}, {formatDateLong(today)}
          </p>
        </div>
      </div>

      {/* Quick Stats Row (compact GoPay-style) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard
          label="Karyawan Aktif"
          value={stats.totalActiveEmployees}
          icon={Users}
          accent="primary"
          actionLabel="Lihat"
          onAction={() => navigate("#/karyawan")}
        />
        <StatCard
          label="Hadir Hari Ini"
          value={stats.presentToday}
          icon={UserCheck}
          accent="success"
          actionLabel="Lihat"
          onAction={() => navigate("#/absensi")}
        />
        <StatCard
          label="Terlambat"
          value={stats.lateToday}
          icon={Clock}
          accent="warning"
          actionLabel="Lihat"
          onAction={() => navigate("#/absensi?filter=terlambat")}
        />
        <StatCard
          label="Menunggu Review"
          value={stats.pendingSubmissions}
          icon={ClipboardList}
          accent="info"
          actionLabel="Lihat"
          onAction={() => navigate("#/cuti?filter=pending")}
        />
      </div>

      {/* Quick Actions Grid (GoPay/ShopeePay style icon grid) */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-soft">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Akses Cepat
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-8">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all active:scale-95 hover:bg-muted/50"
            >
              <div className={cn("flex size-10 items-center justify-center rounded-2xl", action.color)}>
                <action.icon className="size-5" />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceTrendChart />
        </div>
        <div>
          <ContractStatusChart />
        </div>
      </div>

      {/* Additional Stats (compact cards below) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Outlets"
          value={stats.totalOutlets}
          icon={Store}
          accent="neutral"
          hint="Lokasi aktif"
          onAction={() => navigate("#/outlet")}
        />
        <StatCard
          label="Belum Hadir"
          value={stats.notPresentYet}
          icon={Clock}
          accent="destructive"
          hint="Dijadwalkan"
          onAction={() => navigate("#/absensi")}
        />
        <StatCard
          label="Kontrak Exp."
          value={stats.expiringContracts}
          icon={FileText}
          accent="warning"
          hint="≤ 90 hari"
          onAction={() => navigate("#/kontrak")}
        />
        <StatCard
          label="Lembur Review"
          value={stats.overtimeAwaitingReview}
          icon={ClipboardList}
          accent="primary"
          hint="Perlu verifikasi"
          onAction={() => navigate("#/lembur")}
        />
        <StatCard
          label="Payroll Draft"
          value={stats.payrollNeedsReview}
          icon={Receipt}
          accent="info"
          hint="Belum final"
          onAction={() => navigate("#/payroll")}
        />
      </div>

      {/* Outlet Distribution Bottom */}
      <OutletEmployeeDistribution />
    </div>
  );
}
