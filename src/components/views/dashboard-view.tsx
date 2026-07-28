"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  AttendanceTrendChart,
  ContractStatusChart,
  PositionDistributionChart,
  OvertimePlanVsActualChart,
} from "@/components/dashboard/charts";
import { OutletEmployeeDistribution } from "@/components/dashboard/outlet-employee-distribution";
import { useDataState } from "@/hooks/use-store";
import { computeDashboardStats } from "@/lib/services/dashboard";
import { navigate } from "@/lib/router/use-route";
import { todayISODate, formatDateLong } from "@/lib/utils";
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
} from "lucide-react";

export function DashboardView() {
  const state = useDataState();
  const stats = computeDashboardStats(state);
  const today = todayISODate();
  const weekday = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard HRD"
        description={`Selamat datang kembali. Hari ini ${weekday}, ${formatDateLong(today)}.`}
      />

      {/* Stat cards (Grid 3x3 dengan Tinggi Sejajar) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 items-stretch">
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

      {/* Baris Chart 1: Tren Kehadiran (2 cols) & Status Kontrak (1 col) dengan Tinggi Sejajar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2 h-full">
          <AttendanceTrendChart />
        </div>
        <div className="h-full">
          <ContractStatusChart />
        </div>
      </div>

      {/* Baris Chart 2: Distribusi Posisi (1 col) & Planning vs Actual Lembur (2 cols) dengan Tinggi Sejajar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-stretch">
        <div className="h-full">
          <PositionDistributionChart />
        </div>
        <div className="lg:col-span-2 h-full">
          <OvertimePlanVsActualChart />
        </div>
      </div>

      {/* Baris Outlet Center Insights: Spotlight 3 Outlet Kunci */}
      <div>
        <OutletEmployeeDistribution />
      </div>
    </div>
  );
}
