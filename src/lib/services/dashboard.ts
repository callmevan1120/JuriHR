// ============================================================
// JURI HR — Dashboard Service
// Fungsi pure yang menghitung agregasi dashboard dari DataState.
// Dipakai oleh komponen dashboard (reaktif via useStore).
// ============================================================
import type { DataState } from "@/lib/data/store";
import type {
  AttendanceTrendPoint,
  ContractStatus,
  ContractStatusPoint,
  DashboardStats,
  OvertimePlanVsActualPoint,
  OutletDistributionPoint,
  RecentActivity,
} from "@/lib/types";
import { addDaysISO, daysBetween, todayISODate } from "@/lib/utils";

export function computeDashboardStats(state: DataState): DashboardStats {
  const today = todayISODate();
  const activeEmployees = state.employees.filter((e) => e.status === "AKTIF");
  const activeOutlets = state.outlets.filter((o) => o.status === "active");

  // Absensi hari ini
  const todayAttendances = state.attendances.filter((a) => a.date === today);
  const presentToday = todayAttendances.filter(
    (a) => a.status === "HADIR" || a.status === "TERLAMBAT",
  ).length;
  const lateToday = todayAttendances.filter(
    (a) => a.status === "TERLAMBAT",
  ).length;

  // Karyawan aktif yang punya jadwal hari ini tapi belum ada record hadir
  const employeesScheduledToday = new Set(
    state.schedules
      .filter((s) => s.date === today && s.shiftTemplateId)
      .map((s) => s.employeeId),
  );
  const employeesPresentToday = new Set(
    todayAttendances
      .filter((a) => a.status === "HADIR" || a.status === "TERLAMBAT")
      .map((a) => a.employeeId),
  );
  const notPresentYet = Array.from(employeesScheduledToday).filter(
    (id) => !employeesPresentToday.has(id),
  ).length;

  // Pengajuan pending
  const pendingSubmissions =
    state.leaves.filter((l) => l.status === "PENDING").length +
    state.overtimePlannings.filter((o) => o.status === "PENDING").length;

  // Kontrak akan berakhir (<= 90 hari & belum berakhir)
  const expiringContracts = state.contracts.filter((c) => {
    const remaining = daysBetween(today, c.endDate);
    return remaining >= 0 && remaining <= 90;
  }).length;

  // Lembur menunggu review (planning pending ATAU actual belum diverifikasi)
  const overtimeAwaitingReview =
    state.overtimePlannings.filter((o) => o.status === "PENDING").length +
    state.overtimeActuals.filter(
      (a) => a.verificationStatus === "DIISI" || a.verificationStatus === "BELUM_DIISI",
    ).length;

  // Payroll perlu review (Draft)
  const payrollNeedsReview = state.payrolls.filter(
    (p) => p.status === "DRAFT",
  ).length;

  return {
    totalActiveEmployees: activeEmployees.length,
    totalOutlets: activeOutlets.length,
    presentToday,
    lateToday,
    notPresentYet,
    pendingSubmissions,
    expiringContracts,
    overtimeAwaitingReview,
    payrollNeedsReview,
  };
}

export function computeAttendanceTrend(state: DataState): AttendanceTrendPoint[] {
  const today = todayISODate();
  const points: AttendanceTrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDaysISO(today, -i);
    const dayAtt = state.attendances.filter((a) => a.date === date);
    const hadir = dayAtt.filter((a) => a.status === "HADIR").length;
    const terlambat = dayAtt.filter((a) => a.status === "TERLAMBAT").length;
    const tidakHadir = dayAtt.filter(
      (a) => a.status === "TIDAK_HADIR" || a.status === "CUTI" || a.status === "SAKIT" || a.status === "IZIN",
    ).length;
    points.push({
      date: date.slice(8),
      hadir,
      terlambat,
      tidakHadir,
    });
  }
  return points;
}

export function computeOutletDistribution(
  state: DataState,
): OutletDistributionPoint[] {
  const result: OutletDistributionPoint[] = state.outlets
    .filter((o) => o.status === "active")
    .map((o) => ({
      outletName: o.name.replace("JURI Bun — ", ""),
      employees: state.employees.filter(
        (e) => e.primaryOutletId === o.id && e.status === "AKTIF",
      ).length,
    }))
    .filter((p) => p.employees > 0)
    .sort((a, b) => b.employees - a.employees);
  return result;
}

export function computeContractStatus(
  state: DataState,
): ContractStatusPoint[] {
  const today = todayISODate();
  const counts = new Map<ContractStatus, number>();
  state.contracts.forEach((c) => {
    // Re-derive: jika sudah lewat jatuh tempo, anggap BERAKHIR
    let status = c.status;
    const remaining = daysBetween(today, c.endDate);
    if (remaining < 0 && status !== "BERAKHIR") status = "BERAKHIR";
    else if (remaining >= 0 && remaining <= 90 && status === "AKTIF")
      status = "AKAN_BERAKHIR";
    counts.set(status, (counts.get(status) ?? 0) + 1);
  });
  const order: ContractStatus[] = [
    "AKTIF",
    "AKAN_BERAKHIR",
    "BERAKHIR",
    "DRAFT",
    "DIPERPANJANG",
    "DITOLAK",
    "DIBATALKAN",
  ];
  return order
    .filter((s) => counts.has(s))
    .map((s) => ({ status: s, count: counts.get(s) ?? 0 }));
}

export interface PositionDistributionPoint {
  positionId: string;
  positionName: string;
  category: "OUTLET" | "NON_OUTLET";
  count: number;
}

export function computePositionDistribution(state: DataState): PositionDistributionPoint[] {
  const activeEmps = state.employees.filter((e) => e.status === "AKTIF");
  const counts = new Map<string, number>();
  activeEmps.forEach((e) => {
    counts.set(e.positionId, (counts.get(e.positionId) ?? 0) + 1);
  });
  return state.positions
    .map((p) => ({
      positionId: p.id,
      positionName: p.name,
      category: p.category,
      count: counts.get(p.id) ?? 0,
    }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function computeOvertimePlanVsActual(
  state: DataState,
): OvertimePlanVsActualPoint[] {
  const today = todayISODate();
  const points: OvertimePlanVsActualPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDaysISO(today, -i);
    const plans = state.overtimePlannings.filter((p) => p.date === date);
    const planningMinutes = plans.reduce(
      (sum, p) => sum + p.durationMinutes * Math.max(1, p.employeeIds.length),
      0,
    );
    const actuals = state.overtimeActuals.filter((a) => a.date === date);
    const actualMinutes = actuals.reduce(
      (sum, a) => sum + (a.actualDurationMinutes ?? 0),
      0,
    );
    points.push({
      date: date.slice(8),
      planning: Math.round(planningMinutes / 60),
      actual: Math.round(actualMinutes / 60),
    });
  }
  return points;
}

export function computeRecentActivities(
  state: DataState,
  limit = 8,
): RecentActivity[] {
  return state.auditLogs.slice(0, limit).map((log) => ({
    id: log.id,
    module: log.module,
    action: log.action,
    description: log.description,
    actor: log.actor,
    createdAt: log.createdAt,
  }));
}
