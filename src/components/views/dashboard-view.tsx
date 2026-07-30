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
import { todayISODate, formatDateLong } from "@/lib/utils";
import {
  Users,
  UserCheck,
  Clock,
  ClipboardList,
  Store,
  CalendarDays,
  Umbrella,
  Receipt,
  FileText,
  Map,
} from "lucide-react";

const QUICK_ACTIONS = [
  { icon: Users, label: "Karyawan", href: "#/karyawan", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  { icon: Store, label: "Outlet", href: "#/outlet", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { icon: UserCheck, label: "Absensi", href: "#/absensi", color: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  { icon: Umbrella, label: "Cuti", href: "#/cuti", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
  { icon: CalendarDays, label: "Jadwal", href: "#/jadwal", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
  { icon: Receipt, label: "Payroll", href: "#/payroll", color: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
  { icon: FileText, label: "Kontrak", href: "#/kontrak", color: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
  { icon: Map, label: "Domisili", href: "#/domisili", color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" },
];

export function DashboardView() {
  const state = useDataState();
  const stats = computeDashboardStats(state);
  const today = todayISODate();
  const weekday = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long" }).format(new Date());

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {weekday} &middot; {formatDateLong(today)}
        </p>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Selamat Datang, <span className="text-primary">HRD Admin</span>
        </h1>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border/60 bg-card px-1.5 py-2 sm:p-2.5">
        <div className="grid grid-cols-4 gap-0.5 sm:gap-1 md:grid-cols-8">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className="flex flex-col items-center gap-1.5 rounded-xl px-1.5 py-2 sm:py-2.5 transition-all active:scale-95"
            >
              <div className={`flex size-9 sm:size-11 items-center justify-center rounded-2xl transition-colors duration-200 ${action.color}`}>
                <action.icon className="size-4 sm:size-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Karyawan Aktif" value={stats.totalActiveEmployees} icon={Users} accent="primary" onAction={() => navigate("#/karyawan")} />
        <StatCard label="Hadir Hari Ini" value={stats.presentToday} icon={UserCheck} accent="success" onAction={() => navigate("#/absensi")} />
        <StatCard label="Terlambat" value={stats.lateToday} icon={Clock} accent="warning" onAction={() => navigate("#/absensi?filter=terlambat")} />
        <StatCard label="Pending" value={stats.pendingSubmissions} icon={ClipboardList} accent="info" onAction={() => navigate("#/cuti?filter=pending")} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AttendanceTrendChart />
        </div>
        <div className="lg:col-span-2">
          <ContractStatusChart />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Outlet" value={stats.totalOutlets} icon={Store} accent="neutral" onAction={() => navigate("#/outlet")} />
        <StatCard label="Belum Hadir" value={stats.notPresentYet} icon={Clock} accent="destructive" onAction={() => navigate("#/absensi")} />
        <StatCard label="Kontrak Exp." value={stats.expiringContracts} icon={FileText} accent="warning" onAction={() => navigate("#/kontrak")} />
        <StatCard label="Lembur Review" value={stats.overtimeAwaitingReview} icon={ClipboardList} accent="primary" onAction={() => navigate("#/lembur")} />
        <StatCard label="Payroll Draft" value={stats.payrollNeedsReview} icon={Receipt} accent="info" onAction={() => navigate("#/payroll")} />
      </div>

      {/* Outlet Distribution */}
      <OutletEmployeeDistribution />
    </div>
  );
}
