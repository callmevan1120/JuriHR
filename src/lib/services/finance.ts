// ============================================================
// JURI HR — Fase 5 Services: Payroll, Notification, Report
// ============================================================
import { getStore } from "@/lib/data/store";
import { logAudit } from "@/lib/services/audit";
import type {
  AppNotification,
  AuditLog,
  NotificationCategory,
  PayrollComponent,
  PayrollEntry,
  PayrollStatus,
} from "@/lib/types";
import { todayISODate, uid } from "@/lib/utils";

const ACTOR = "HRD Admin";
const NOW = () => new Date().toISOString();

// ------------------------------------------------------------
// Payroll Service
// ------------------------------------------------------------
export const payrollService = {
  list(): PayrollEntry[] {
    return getStore().getState().payrolls;
  },
  byPeriod(period: string): PayrollEntry[] {
    return getStore()
      .getState()
      .payrolls.filter((p) => p.period === period);
  },
  get(id: string): PayrollEntry | undefined {
    return getStore().getState().payrolls.find((p) => p.id === id);
  },
  /** Generate payroll preview untuk periode & karyawan tertentu.
   *  Membaca: gaji dasar, PH, lembur terverifikasi, potongan keterlambatan & ketidakhadiran.
   */
  generatePreview(period: string, employeeIds?: string[]): number {
    const store = getStore();
    const state = store.getState();
    const [y, m] = period.split("-");
    const fromDate = `${y}-${m}-01`;
    const toDate = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`;
    const emps = employeeIds
      ? state.employees.filter((e) => employeeIds.includes(e.id) && e.status === "AKTIF")
      : state.employees.filter((e) => e.status === "AKTIF");

    const existing = state.payrolls.filter((p) => p.period === period);
    const existingMap = new Map(existing.map((p) => [p.employeeId, p]));
    let count = 0;
    const now = NOW();
    const newEntries: PayrollEntry[] = [];

    for (const emp of emps) {
      // Skip jika sudah finalized
      const ex = existingMap.get(emp.id);
      if (ex?.status === "FINALIZED") continue;

      const baseSalary = emp.salaryType === "BULANAN" ? emp.salaryAmount : emp.salaryAmount * 25;
      // Absensi periode ini
      const attendances = state.attendances.filter(
        (a) => a.employeeId === emp.id && a.date >= fromDate && a.date <= toDate,
      );
      const lateDeduction = attendances.reduce((s, a) => s + a.deduction, 0);
      const phCount = attendances.filter((a) => a.status === "PH").length;
      const absenceCount = attendances.filter((a) => a.status === "TIDAK_HADIR").length;
      // Potongan ketidakhadiran: proporsional gaji harian (untuk harian), untuk bulanan = gaji/25 per hari
      const dailyRate = emp.salaryType === "BULANAN" ? Math.round(emp.salaryAmount / 25) : emp.salaryAmount;
      const absenceDeduction = absenceCount * dailyRate;
      // Lembur terverifikasi
      const overtimeAmount = state.overtimeActuals
        .filter(
          (a) =>
            a.employeeId === emp.id &&
            a.date >= fromDate &&
            a.date <= toDate &&
            a.verificationStatus === "TERVERIFIKASI",
        )
        .reduce((s, a) => s + a.estimatedNominal, 0);

      const total = Math.max(0, baseSalary + overtimeAmount - lateDeduction - absenceDeduction);

      const entry: PayrollEntry = ex
        ? {
            ...ex,
            baseSalary,
            phCount,
            phDeduction: 0,
            overtimeAmount,
            lateDeduction,
            absenceDeduction,
            total,
            updatedAt: now,
          }
        : {
            id: uid("pay"),
            employeeId: emp.id,
            period,
            baseSalary,
            phCount,
            phDeduction: 0,
            overtimeAmount,
            additions: [],
            deductions: [],
            lateDeduction,
            absenceDeduction,
            total,
            status: "DRAFT",
            createdAt: now,
            updatedAt: now,
          };
      newEntries.push(entry);
      count += 1;
    }

    // Merge: replace existing (non-finalized) + add new
    const merged = [
      ...newEntries,
      ...state.payrolls.filter(
        (p) => !(p.period === period && newEntries.some((n) => n.employeeId === p.employeeId)),
      ),
    ];
    store.setCollection("payrolls", merged);
    logAudit({ module: "Payroll", action: "GENERATE", description: `Generate ${count} preview payroll periode ${period}.` });
    return count;
  },
  update(id: string, patch: Partial<PayrollEntry>): PayrollEntry | undefined {
    const store = getStore();
    const list = store.getState().payrolls;
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    if (before.status === "FINALIZED") {
      throw new Error("Payroll sudah difinalisasi. Tidak dapat diubah.");
    }
    // Recompute total
    const after: PayrollEntry = { ...before, ...patch, id, updatedAt: NOW() };
    after.total = this.computeTotal(after);
    const next = [...list];
    next[idx] = after;
    store.setCollection("payrolls", next);
    logAudit({ module: "Payroll", action: "UPDATE", description: `Memperbarui payroll ${lookupEmpName(after.employeeId)} (${after.period}).`, before, after });
    return after;
  },
  /** Tambah/pilih komponen adjustment. */
  addComponent(id: string, component: PayrollComponent): PayrollEntry | undefined {
    const entry = this.get(id);
    if (!entry) return undefined;
    const list = component.type === "ADDITION" ? [...entry.additions, component] : [...entry.deductions, component];
    return this.update(id, component.type === "ADDITION" ? { additions: list } : { deductions: list });
  },
  removeComponent(id: string, type: "ADDITION" | "DEDUCTION", index: number): PayrollEntry | undefined {
    const entry = this.get(id);
    if (!entry) return undefined;
    if (type === "ADDITION") {
      const list = entry.additions.filter((_, i) => i !== index);
      return this.update(id, { additions: list });
    }
    const list = entry.deductions.filter((_, i) => i !== index);
    return this.update(id, { deductions: list });
  },
  /** Hitung total akhir. */
  computeTotal(entry: PayrollEntry): number {
    const additions = entry.additions.reduce((s, c) => s + c.amount, 0);
    const deductions = entry.deductions.reduce((s, c) => s + c.amount, 0);
    return Math.max(
      0,
      entry.baseSalary + entry.overtimeAmount + additions - entry.lateDeduction - entry.absenceDeduction - entry.phDeduction - deductions,
    );
  },
  setStatus(id: string, status: PayrollStatus): PayrollEntry | undefined {
    const entry = this.get(id);
    if (!entry) return undefined;
    // REVIEWED -> FINALIZED hanya jika sudah REVIEWED
    if (status === "FINALIZED" && entry.status !== "REVIEWED") {
      throw new Error("Payroll harus berstatus Reviewed sebelum difinalisasi.");
    }
    const result = this.update(id, { status });
    // Auto-create notifikasi saat finalize
    if (status === "FINALIZED" && result) {
      const empName = lookupEmpName(entry.employeeId);
      const store = getStore();
      const notif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        category: "PAYROLL",
        title: "Payroll difinalisasi",
        message: `${empName} — periode ${entry.period} · ${Math.round(entry.total).toLocaleString("id-ID")} (finalized).`,
        read: false,
        archived: false,
        createdAt: new Date().toISOString(),
        link: "#/payroll?filter=FINALIZED",
      };
      store.setCollection("notifications", [notif, ...store.getState().notifications]);
    }
    return result;
  },
  bulkSetStatus(ids: string[], status: PayrollStatus): number {
    let count = 0;
    for (const id of ids) {
      try {
        this.setStatus(id, status);
        count += 1;
      } catch {
        // skip
      }
    }
    return count;
  },
  /** Hapus payroll (hanya DRAFT). */
  remove(id: string): void {
    const store = getStore();
    const entry = store.getState().payrolls.find((p) => p.id === id);
    if (!entry || entry.status !== "DRAFT") {
      throw new Error("Hanya payroll DRAFT yang dapat dihapus.");
    }
    store.setCollection("payrolls", store.getState().payrolls.filter((p) => p.id !== id));
    logAudit({ module: "Payroll", action: "DELETE", description: `Menghapus payroll ${lookupEmpName(entry.employeeId)}.` });
  },
  /** Export CSV untuk periode. */
  exportCSV(period: string): string {
    const entries = this.byPeriod(period);
    const headers = ["NIK", "Nama", "Outlet", "Gaji Dasar", "PH", "Lembur", "Penambah", "Potongan Telat", "Potongan TH", "Pengurang", "Total", "Status"];
    const rows = entries.map((p) => {
      const emp = getStore().getState().employees.find((e) => e.id === p.employeeId);
      const outlet = getStore().getState().outlets.find((o) => o.id === emp?.primaryOutletId)?.name ?? "";
      const additions = p.additions.reduce((s, c) => s + c.amount, 0);
      const deductions = p.deductions.reduce((s, c) => s + c.amount, 0);
      return [
        emp?.nik ?? "", emp?.fullName ?? "", outlet,
        p.baseSalary, p.phCount, p.overtimeAmount, additions,
        p.lateDeduction, p.absenceDeduction, deductions,
        p.total, p.status,
      ];
    });
    return [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  },
};

function lookupEmpName(id: string): string {
  return getStore().getState().employees.find((e) => e.id === id)?.fullName ?? id;
}

// ------------------------------------------------------------
// Notification Service
// ------------------------------------------------------------
export const notificationService = {
  list(): AppNotification[] {
    return getStore().getState().notifications;
  },
  unreadCount(): number {
    return getStore().getState().notifications.filter((n) => !n.read && !n.archived).length;
  },
  byCategory(category: NotificationCategory | "all"): AppNotification[] {
    return getStore()
      .getState()
      .notifications.filter((n) => category === "all" || n.category === category)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  markAsRead(id: string): void {
    const store = getStore();
    store.setCollection(
      "notifications",
      store.getState().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  },
  markAllAsRead(): void {
    const store = getStore();
    store.setCollection(
      "notifications",
      store.getState().notifications.map((n) => (n.archived ? n : { ...n, read: true })),
    );
    logAudit({ module: "Notifikasi", action: "MARK_ALL_READ", description: "Menandai semua notifikasi sebagai dibaca." });
  },
  archive(id: string): void {
    const store = getStore();
    store.setCollection(
      "notifications",
      store.getState().notifications.map((n) => (n.id === id ? { ...n, archived: true } : n)),
    );
  },
  unarchive(id: string): void {
    const store = getStore();
    store.setCollection(
      "notifications",
      store.getState().notifications.map((n) => (n.id === id ? { ...n, archived: false } : n)),
    );
  },
  create(input: Omit<AppNotification, "id" | "createdAt" | "read" | "archived"> & { read?: boolean }): AppNotification {
    const store = getStore();
    const item: AppNotification = {
      ...input,
      id: uid("notif"),
      read: input.read ?? false,
      archived: false,
      createdAt: NOW(),
    };
    store.setCollection("notifications", [item, ...store.getState().notifications]);
    return item;
  },
};

// ------------------------------------------------------------
// Report Service (agregasi lintas modul)
// ------------------------------------------------------------
export const reportService = {
  /** Ringkasan workforce untuk periode. */
  workforceSummary(fromDate: string, toDate: string) {
    const state = getStore().getState();
    const attendances = state.attendances.filter((a) => a.date >= fromDate && a.date <= toDate);
    const leaves = state.leaves.filter((l) => l.startDate <= toDate && l.endDate >= fromDate);
    const overtimeActuals = state.overtimeActuals.filter((a) => a.date >= fromDate && a.date <= toDate);
    return {
      period: `${fromDate} — ${toDate}`,
      totalEmployees: state.employees.filter((e) => e.status === "AKTIF").length,
      attendance: {
        hadir: attendances.filter((a) => a.status === "HADIR").length,
        terlambat: attendances.filter((a) => a.status === "TERLAMBAT").length,
        tidakHadir: attendances.filter((a) => a.status === "TIDAK_HADIR").length,
        cuti: attendances.filter((a) => a.status === "CUTI").length,
        izin: attendances.filter((a) => a.status === "IZIN").length,
        sakit: attendances.filter((a) => a.status === "SAKIT").length,
        totalLateDeduction: attendances.reduce((s, a) => s + a.deduction, 0),
        totalLateMinutes: attendances.reduce((s, a) => s + a.lateMinutes, 0),
      },
      leaves: {
        total: leaves.length,
        approved: leaves.filter((l) => l.status === "APPROVED").length,
        pending: leaves.filter((l) => l.status === "PENDING").length,
        cuti: leaves.filter((l) => l.type === "CUTI").length,
        izin: leaves.filter((l) => l.type === "IZIN").length,
        sakit: leaves.filter((l) => l.type === "SAKIT").length,
      },
      overtime: {
        totalActuals: overtimeActuals.length,
        verified: overtimeActuals.filter((a) => a.verificationStatus === "TERVERIFIKASI").length,
        totalAmount: overtimeActuals.filter((a) => a.verificationStatus === "TERVERIFIKASI").reduce((s, a) => s + a.estimatedNominal, 0),
        anomalies: state.overtimeActuals.filter((a) => !a.planningId).length,
      },
      contracts: {
        expiring: state.contracts.filter((c) => {
          const today = todayISODate();
          const days = Math.ceil((new Date(c.endDate).getTime() - new Date(today).getTime()) / 86400000);
          return days >= 0 && days <= 90;
        }).length,
        ended: state.contracts.filter((c) => c.endDate < todayISODate()).length,
      },
    };
  },
  /** Data distribusi karyawan per outlet. */
  employeeDistribution() {
    const state = getStore().getState();
    return state.outlets
      .filter((o) => o.status === "active")
      .map((o) => ({
        outlet: o,
        employees: state.employees.filter((e) => e.primaryOutletId === o.id && e.status === "AKTIF").length,
        byPosition: state.positions
          .filter((p) => p.category === "OUTLET")
          .map((p) => ({
            position: p.name,
            count: state.employees.filter((e) => e.primaryOutletId === o.id && e.positionId === p.id && e.status === "AKTIF").length,
          }))
          .filter((x) => x.count > 0),
      }))
      .filter((x) => x.employees > 0);
  },
  /** Audit log list. */
  auditLogs(): AuditLog[] {
    return getStore()
      .getState()
      .auditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
