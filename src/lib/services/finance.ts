// ============================================================
// JURI HR — Payroll, Notification, Report Services
// ============================================================
import { getStore } from "@/lib/data/store";
import { logAudit } from "@/lib/services/audit";
import type {
  AppNotification,
  AuditLog,
  NotificationCategory,
  PayrollComponent,
  PayrollEntry,
  PayrollEntryStatus,
  PayrollPeriod,
  PayrollPeriodStatus,
} from "@/lib/types";
import { formatRupiah, monthLabel, todayISODate, uid } from "@/lib/utils";

const ACTOR = "HRD Admin";
const NOW = () => new Date().toISOString();

// ------------------------------------------------------------
// Payroll Service
// ------------------------------------------------------------
export const payrollService = {
  // ---- Period ----
  listPeriods(): PayrollPeriod[] {
    return getStore().getState().payrollPeriods.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getPeriod(id: string): PayrollPeriod | undefined {
    return getStore().getState().payrollPeriods.find((p) => p.id === id);
  },
  createPeriod(input: Omit<PayrollPeriod, "id" | "createdAt" | "updatedAt" | "status">): PayrollPeriod {
    const store = getStore();
    const now = NOW();
    const item: PayrollPeriod = { ...input, id: uid("pp"), status: "DRAFT", createdAt: now, updatedAt: now };
    store.setCollection("payrollPeriods", [item, ...store.getState().payrollPeriods]);
    logAudit({ module: "Payroll", action: "CREATE_PERIOD", description: `Membuat periode payroll "${item.name}".`, after: item });
    return item;
  },
  updatePeriod(id: string, patch: Partial<PayrollPeriod>): PayrollPeriod | undefined {
    const store = getStore();
    const list = store.getState().payrollPeriods;
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    if (before.status === "FINALIZED") throw new Error("Periode sudah difinalisasi.");
    const after: PayrollPeriod = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("payrollPeriods", next);
    return after;
  },
  setPeriodStatus(id: string, status: PayrollPeriodStatus): PayrollPeriod | undefined {
    return this.updatePeriod(id, { status });
  },

  // ---- Entries ----
  listEntries(periodId: string): PayrollEntry[] {
    return getStore().getState().payrolls.filter((p) => p.periodId === periodId);
  },
  getEntry(id: string): PayrollEntry | undefined {
    return getStore().getState().payrolls.find((p) => p.id === id);
  },
  byEmployee(employeeId: string): PayrollEntry[] {
    return getStore().getState().payrolls.filter((p) => p.employeeId === employeeId);
  },

  /** Generate payroll entries untuk periode — dengan SNAPSHOT.
   *  Membaca: gaji dasar, PH, lembur terverifikasi, potongan keterlambatan/ketidakhadiran.
   *  Snapshot: NIK, nama, posisi, divisi, outlet, jenis gaji, tarif — disimpan saat generate.
   *  Perubahan data karyawan setelah generate TIDAK mengubah entry. */
  generate(periodId: string, generatedBy: string): number {
    const store = getStore();
    const state = store.getState();
    const period = state.payrollPeriods.find((p) => p.id === periodId);
    if (!period) throw new Error("Periode tidak ditemukan.");

    // Filter karyawan berdasarkan scope
    const emps = state.employees.filter((e) => {
      if (e.status !== "AKTIF") return false;
      if (period.scopeType === "OUTLET" && e.primaryOutletId !== period.scopeId) return false;
      if (period.scopeType === "DIVISI" && e.divisionId !== period.scopeId) return false;
      return true;
    });

    // Hapus entry lama untuk periode ini (jika regenerate)
    const existingEntries = state.payrolls.filter((p) => p.periodId === periodId);
    const now = NOW();
    const newEntries: PayrollEntry[] = [];

    for (const emp of emps) {
      const pos = state.positions.find((p) => p.id === emp.positionId);
      const div = state.divisions.find((d) => d.id === emp.divisionId);
      const out = state.outlets.find((o) => o.id === emp.primaryOutletId);

      // Snapshot
      const dailyRate = emp.salaryType === "BULANAN" ? Math.round(emp.salaryAmount / 25) : emp.salaryAmount;
      const paidDays = emp.salaryType === "BULANAN" ? 25 : 22;
      const baseSalary = emp.salaryType === "BULANAN" ? emp.salaryAmount : paidDays * dailyRate;

      // Baca data absensi & lembur dari periode
      const attendances = state.attendances.filter(
        (a) => a.employeeId === emp.id && a.date >= period.startDate && a.date <= period.endDate,
      );
      const lateDeduction = attendances.reduce((s, a) => s + a.deduction, 0);
      const absenceDeduction = attendances.filter((a) => a.status === "TIDAK_HADIR").length * dailyRate;
      const overtimeAmount = state.overtimeActuals
        .filter(
          (a) =>
            a.employeeId === emp.id &&
            a.date >= period.startDate &&
            a.date <= period.endDate &&
            a.verificationStatus === "TERVERIFIKASI",
        )
        .reduce((s, a) => s + a.estimatedNominal, 0);

      const total = Math.max(0, baseSalary + overtimeAmount - lateDeduction - absenceDeduction);

      newEntries.push({
        id: uid("pay"),
        periodId,
        employeeId: emp.id,
        nik: emp.nik,
        fullName: emp.fullName,
        positionName: pos?.name ?? "-",
        divisionName: div?.name ?? "-",
        outletName: out?.name ?? "-",
        salaryType: emp.salaryType,
        salaryRate: emp.salaryAmount,
        paidDays,
        baseSalary,
        dailyRate,
        phAllowance: 0,
        overtimeAmount,
        bonus: 0,
        incentive: 0,
        kasbon: 0,
        lateDeduction,
        absenceDeduction,
        otherDeduction: 0,
        additions: [],
        deductions: [],
        total,
        needsReview: false,
        status: "DRAFT",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Merge: hapus entry lama untuk periode ini, tambah yang baru
    const merged = [
      ...newEntries,
      ...state.payrolls.filter((p) => p.periodId !== periodId),
    ];
    store.setCollection("payrolls", merged);

    // Update period status
    this.updatePeriod(periodId, { status: "GENERATED", generatedBy, generatedAt: now });

    logAudit({ module: "Payroll", action: "GENERATE", description: `Generate ${newEntries.length} entry payroll untuk periode "${period.name}".` });
    return newEntries.length;
  },

  /** Update entry (hanya jika belum finalized). */
  updateEntry(id: string, patch: Partial<PayrollEntry>): PayrollEntry | undefined {
    const store = getStore();
    const list = store.getState().payrolls;
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    if (before.status === "FINALIZED") throw new Error("Entry sudah difinalisasi.");
    const after: PayrollEntry = { ...before, ...patch, id, updatedAt: NOW() };
    after.total = this.computeTotal(after);
    const next = [...list];
    next[idx] = after;
    store.setCollection("payrolls", next);
    logAudit({ module: "Payroll", action: "UPDATE_ENTRY", description: `Memperbarui entry payroll ${after.fullName}.`, before, after });
    return after;
  },

  /** Hitung total akhir berdasarkan formula:
   *  Total = Gaji Dasar + PH + Lembur + Bonus + Insentif + Adjustment Penambah
   *          - Kasbon - Potongan Keterlambatan - Potongan Tidak Hadir - Potongan Lain - Adjustment Pengurang */
  computeTotal(entry: PayrollEntry): number {
    const additions = entry.additions.reduce((s, c) => s + c.amount, 0);
    const deductions = entry.deductions.reduce((s, c) => s + c.amount, 0);
    return Math.max(
      0,
      entry.baseSalary +
        entry.phAllowance +
        entry.overtimeAmount +
        entry.bonus +
        entry.incentive +
        additions -
        entry.kasbon -
        entry.lateDeduction -
        entry.absenceDeduction -
        entry.otherDeduction -
        deductions,
    );
  },

  /** Tambah adjustment component. */
  addComponent(id: string, component: PayrollComponent): PayrollEntry | undefined {
    const entry = this.getEntry(id);
    if (!entry) return undefined;
    const list = component.type === "ADDITION" ? [...entry.additions, component] : [...entry.deductions, component];
    return this.updateEntry(id, component.type === "ADDITION" ? { additions: list } : { deductions: list });
  },

  removeComponent(id: string, type: "ADDITION" | "DEDUCTION", index: number): PayrollEntry | undefined {
    const entry = this.getEntry(id);
    if (!entry) return undefined;
    if (type === "ADDITION") {
      return this.updateEntry(id, { additions: entry.additions.filter((_, i) => i !== index) });
    }
    return this.updateEntry(id, { deductions: entry.deductions.filter((_, i) => i !== index) });
  },

  /** Toggle needsReview flag. */
  toggleReview(id: string): PayrollEntry | undefined {
    const entry = this.getEntry(id);
    if (!entry) return undefined;
    return this.updateEntry(id, { needsReview: !entry.needsReview });
  },

  /** Set entry status. */
  setEntryStatus(id: string, status: PayrollEntryStatus): PayrollEntry | undefined {
    return this.updateEntry(id, { status });
  },

  /** Bulk set status for entries. */
  bulkSetStatus(ids: string[], status: PayrollEntryStatus): number {
    let count = 0;
    for (const id of ids) {
      try {
        this.setEntryStatus(id, status);
        count += 1;
      } catch {
        // skip
      }
    }
    return count;
  },

  /** Review periode: set semua entry ke REVIEWED, period ke REVIEWED. */
  reviewPeriod(periodId: string): void {
    const entries = this.listEntries(periodId);
    for (const e of entries) {
      if (e.status === "DRAFT") this.setEntryStatus(e.id, "REVIEWED");
    }
    this.setPeriodStatus(periodId, "REVIEWED");
    logAudit({ module: "Payroll", action: "REVIEW", description: `Periode payroll direview (${entries.length} entry).` });
  },

  /** Finalisasi periode: set semua entry ke FINALIZED (terkunci), period ke FINALIZED. */
  finalizePeriod(periodId: string, finalizedBy: string): void {
    const period = this.getPeriod(periodId);
    if (!period) throw new Error("Periode tidak ditemukan.");
    if (period.status !== "REVIEWED") throw new Error("Periode harus berstatus Reviewed sebelum difinalisasi.");
    const entries = this.listEntries(periodId);
    for (const e of entries) {
      if (e.status !== "FINALIZED") this.setEntryStatus(e.id, "FINALIZED");
    }
    const now = NOW();
    this.updatePeriod(periodId, { status: "FINALIZED", finalizedBy, finalizedAt: now });
    logAudit({ module: "Payroll", action: "FINALIZE", description: `Periode payroll "${period.name}" difinalisasi (${entries.length} entry terkunci).` });

    // Auto-create notification
    const store = getStore();
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      category: "PAYROLL",
      title: "Payroll difinalisasi",
      message: `Periode "${period.name}" — ${entries.length} karyawan · Total ${formatRupiah(entries.reduce((s, e) => s + e.total, 0))}`,
      read: false,
      archived: false,
      createdAt: now,
      link: "#/payroll",
    };
    store.setCollection("notifications", [notif, ...store.getState().notifications]);
  },

  /** Hapus entry (hanya DRAFT). */
  removeEntry(id: string): void {
    const store = getStore();
    const entry = store.getState().payrolls.find((p) => p.id === id);
    if (!entry || entry.status !== "DRAFT") throw new Error("Hanya entry DRAFT yang dapat dihapus.");
    store.setCollection("payrolls", store.getState().payrolls.filter((p) => p.id !== id));
    logAudit({ module: "Payroll", action: "DELETE_ENTRY", description: `Menghapus entry payroll ${entry.fullName}.` });
  },

  /** Dashboard agregasi untuk periode. */
  dashboard(periodId: string) {
    const entries = this.listEntries(periodId);
    const state = getStore().getState();
    const outlets = state.outlets;
    const perOutlet = outlets.map((o) => ({
      outlet: o,
      count: entries.filter((e) => e.outletName === o.name).length,
      total: entries.filter((e) => e.outletName === o.name).reduce((s, e) => s + e.total, 0),
    })).filter((x) => x.count > 0);

    return {
      totalPayroll: entries.reduce((s, e) => s + e.total, 0),
      totalBaseSalary: entries.reduce((s, e) => s + e.baseSalary, 0),
      totalPH: entries.reduce((s, e) => s + e.phAllowance, 0),
      totalOvertime: entries.reduce((s, e) => s + e.overtimeAmount, 0),
      totalBonus: entries.reduce((s, e) => s + e.bonus + e.incentive, 0),
      totalAdditions: entries.reduce((s, e) => s + e.additions.reduce((x, c) => x + c.amount, 0), 0),
      totalDeductions: entries.reduce((s, e) => s + e.lateDeduction + e.absenceDeduction + e.otherDeduction + e.kasbon + e.deductions.reduce((x, c) => x + c.amount, 0), 0),
      employeeCount: entries.length,
      needsReviewCount: entries.filter((e) => e.needsReview).length,
      draftCount: entries.filter((e) => e.status === "DRAFT").length,
      reviewedCount: entries.filter((e) => e.status === "REVIEWED").length,
      finalizedCount: entries.filter((e) => e.status === "FINALIZED").length,
      perOutlet,
    };
  },

  /** Export CSV (Excel-compatible). */
  exportCSV(periodId: string): string {
    const period = this.getPeriod(periodId);
    const entries = this.listEntries(periodId);
    const headers = ["NIK", "Nama", "Posisi", "Outlet", "Jenis Gaji", "Tarif", "Hari Dibayar", "Gaji Dasar", "PH", "Lembur", "Bonus/Insentif", "Adjustment+", "Potongan Telat", "Potongan Absen", "Potongan Lain", "Total", "Status", "Catatan"];
    const rows = entries.map((e) => {
      const additions = e.additions.reduce((s, c) => s + c.amount, 0);
      const deductions = e.deductions.reduce((s, c) => s + c.amount, 0);
      return [
        e.nik, e.fullName, e.positionName, e.outletName, e.salaryType, e.salaryRate, e.paidDays,
        e.baseSalary, e.phAllowance, e.overtimeAmount, e.bonus + e.incentive, additions,
        e.lateDeduction, e.absenceDeduction, e.otherDeduction + e.kasbon + deductions,
        e.total, e.status, e.note ?? "",
      ];
    });
    // Tambah baris total
    const totalRow = ["", "TOTAL", "", "", "", "", "", 
      entries.reduce((s, e) => s + e.baseSalary, 0),
      entries.reduce((s, e) => s + e.phAllowance, 0),
      entries.reduce((s, e) => s + e.overtimeAmount, 0),
      entries.reduce((s, e) => s + e.bonus + e.incentive, 0),
      entries.reduce((s, e) => s + e.additions.reduce((x, c) => x + c.amount, 0), 0),
      entries.reduce((s, e) => s + e.lateDeduction, 0),
      entries.reduce((s, e) => s + e.absenceDeduction, 0),
      entries.reduce((s, e) => s + e.otherDeduction + e.kasbon + e.deductions.reduce((x, c) => x + c.amount, 0), 0),
      entries.reduce((s, e) => s + e.total, 0),
      "", ""];
    const header = [`JURI HR - Payroll ${period?.name ?? ""}`, `Periode: ${period?.period ?? ""}`, `Generated: ${period?.generatedAt ?? ""}`, ""];
    return [...header, headers, ...rows, totalRow].map((r) => (Array.isArray(r) ? r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",") : `"${r}"`)).join("\n");
  },

  /** Export per outlet summary. */
  exportPerOutlet(periodId: string): string {
    const dash = this.dashboard(periodId);
    const headers = ["Outlet", "Jumlah Karyawan", "Total Payroll"];
    const rows = dash.perOutlet.map((p) => [p.outlet.name.replace("JURI Bun — ", ""), p.count, p.total]);
    const totalRow = ["TOTAL", dash.employeeCount, dash.totalPayroll];
    return [headers, ...rows, totalRow].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  },
};

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
// Report Service
// ------------------------------------------------------------
export const reportService = {
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
  auditLogs(): AuditLog[] {
    return getStore()
      .getState()
      .auditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
