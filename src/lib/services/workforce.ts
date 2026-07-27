// ============================================================
// JURI HR — Fase 4 Services: Attendance, Leave, Overtime
// Aturan bisnis: potongan keterlambatan, saldo cuti, anomali lembur.
// ============================================================
import { getStore } from "@/lib/data/store";
import { logAudit, logChangeHistory } from "@/lib/services/audit";
import type {
  Attendance,
  AttendanceStatus,
  Leave,
  LeaveStatus,
  LeaveType,
  OvertimeActual,
  OvertimeApprovalStatus,
  OvertimePlanning,
  OvertimeVerificationStatus,
} from "@/lib/types";
import {
  addDaysISO,
  daysBetween,
  todayISODate,
  uid,
} from "@/lib/utils";

const ACTOR = "HRD Admin";
const NOW = () => new Date().toISOString();

/** Aturan demo: terlambat <=5 menit tidak dipotong; >5 menit potongan Rp7.000. */
export const LATE_TOLERANCE_MINUTES = 5;
export const LATE_DEDUCTION_RUPIAH = 7000;

// ------------------------------------------------------------
// Attendance Service
// ------------------------------------------------------------
export const attendanceService = {
  list(): Attendance[] {
    return getStore().getState().attendances;
  },
  byDate(date: string): Attendance[] {
    return getStore().getState().attendances.filter((a) => a.date === date);
  },
  byEmployee(employeeId: string, fromDate?: string, toDate?: string): Attendance[] {
    return getStore()
      .getState()
      .attendances.filter((a) => {
        if (a.employeeId !== employeeId) return false;
        if (fromDate && a.date < fromDate) return false;
        if (toDate && a.date > toDate) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  byPeriod(fromDate: string, toDate: string): Attendance[] {
    return getStore()
      .getState()
      .attendances.filter((a) => a.date >= fromDate && a.date <= toDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  /** Hitung potongan berdasarkan menit terlambat (aturan demo). */
  computeDeduction(lateMinutes: number): number {
    return lateMinutes > LATE_TOLERANCE_MINUTES ? LATE_DEDUCTION_RUPIAH : 0;
  },
  /** Tentukan status dari lateMinutes (HADIR / TERLAMBAT). */
  deriveStatus(lateMinutes: number): AttendanceStatus {
    return lateMinutes > LATE_TOLERANCE_MINUTES ? "TERLAMBAT" : "HADIR";
  },
  /** Upsert absensi individual. */
  upsert(input: {
    employeeId: string;
    date: string;
    outletId?: string;
    shiftTemplateId?: string;
    checkIn?: string;
    checkOut?: string;
    status?: AttendanceStatus;
    lateMinutes?: number;
    note?: string;
  }): Attendance {
    const store = getStore();
    const list = store.getState().attendances;
    const existing = list.find((a) => a.employeeId === input.employeeId && a.date === input.date);
    const now = NOW();
    const lateMinutes = input.lateMinutes ?? 0;
    const deduction = input.status === "HADIR" || input.status === "TERLAMBAT" || !input.status
      ? this.computeDeduction(lateMinutes)
      : 0;
    const status = input.status ?? this.deriveStatus(lateMinutes);
    if (existing) {
      const after: Attendance = {
        ...existing,
        outletId: input.outletId ?? existing.outletId,
        shiftTemplateId: input.shiftTemplateId ?? existing.shiftTemplateId,
        checkIn: input.checkIn ?? existing.checkIn,
        checkOut: input.checkOut ?? existing.checkOut,
        status,
        lateMinutes,
        deduction,
        note: input.note ?? existing.note,
        updatedAt: now,
      };
      store.setCollection("attendances", list.map((a) => (a.id === existing.id ? after : a)));
      logAudit({ module: "Absensi", action: "UPDATE", description: `Memperbarui absensi ${lookupEmpName(input.employeeId)} (${input.date}).`, before: existing, after });
      return after;
    }
    const item: Attendance = {
      id: uid("att"),
      employeeId: input.employeeId,
      date: input.date,
      outletId: input.outletId,
      shiftTemplateId: input.shiftTemplateId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      status,
      lateMinutes,
      deduction,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };
    store.setCollection("attendances", [item, ...list]);
    logAudit({ module: "Absensi", action: "CREATE", description: `Menambah absensi ${lookupEmpName(input.employeeId)} (${input.date}).`, after: item });
    return item;
  },
  /** Input massal untuk banyak karyawan di tanggal tertentu. */
  bulkUpsert(employeeIds: string[], date: string, defaults: { status: AttendanceStatus; lateMinutes?: number; note?: string }): number {
    const store = getStore();
    const list = [...store.getState().attendances];
    const now = NOW();
    let count = 0;
    for (const empId of employeeIds) {
      const existingIdx = list.findIndex((a) => a.employeeId === empId && a.date === date);
      const lateMinutes = defaults.lateMinutes ?? 0;
      const deduction = (defaults.status === "HADIR" || defaults.status === "TERLAMBAT")
        ? this.computeDeduction(lateMinutes)
        : 0;
      const item: Attendance = existingIdx >= 0
        ? { ...list[existingIdx]!, status: defaults.status, lateMinutes, deduction, note: defaults.note ?? list[existingIdx]!.note, updatedAt: now }
        : {
            id: uid("att"),
            employeeId: empId,
            date,
            status: defaults.status,
            lateMinutes,
            deduction,
            note: defaults.note,
            createdAt: now,
            updatedAt: now,
          };
      if (existingIdx >= 0) list[existingIdx] = item;
      else list.push(item);
      count += 1;
    }
    store.setCollection("attendances", list);
    logAudit({ module: "Absensi", action: "BULK_CREATE", description: `Input massal absensi ${count} karyawan (${date}).` });
    return count;
  },
  /** Hapus absensi (koreksi). */
  remove(employeeId: string, date: string): void {
    const store = getStore();
    store.setCollection(
      "attendances",
      store.getState().attendances.filter((a) => !(a.employeeId === employeeId && a.date === date)),
    );
    logAudit({ module: "Absensi", action: "DELETE", description: `Menghapus absensi ${lookupEmpName(employeeId)} (${date}).` });
  },
  /** Rekap harian: agregasi per status. */
  dailyRecap(date: string) {
    const list = this.byDate(date);
    const recap = {
      date,
      total: list.length,
      hadir: list.filter((a) => a.status === "HADIR").length,
      terlambat: list.filter((a) => a.status === "TERLAMBAT").length,
      tidakHadir: list.filter((a) => a.status === "TIDAK_HADIR").length,
      cuti: list.filter((a) => a.status === "CUTI").length,
      izin: list.filter((a) => a.status === "IZIN").length,
      sakit: list.filter((a) => a.status === "SAKIT").length,
      libur: list.filter((a) => a.status === "LIBUR").length,
      ph: list.filter((a) => a.status === "PH").length,
      totalLateDeduction: list.reduce((s, a) => s + a.deduction, 0),
      totalLateMinutes: list.reduce((s, a) => s + a.lateMinutes, 0),
    };
    return recap;
  },
  /** Rekap bulanan per karyawan. */
  monthlyRecap(employeeId: string, period: string) {
    const [y, m] = period.split("-");
    const fromDate = `${y}-${m}-01`;
    const toDate = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`;
    const list = this.byEmployee(employeeId, fromDate, toDate);
    return {
      period,
      employeeId,
      totalDays: list.length,
      hadir: list.filter((a) => a.status === "HADIR").length,
      terlambat: list.filter((a) => a.status === "TERLAMBAT").length,
      tidakHadir: list.filter((a) => a.status === "TIDAK_HADIR").length,
      cuti: list.filter((a) => a.status === "CUTI").length,
      izin: list.filter((a) => a.status === "IZIN").length,
      sakit: list.filter((a) => a.status === "SAKIT").length,
      libur: list.filter((a) => a.status === "LIBUR").length,
      ph: list.filter((a) => a.status === "PH").length,
      totalLateDeduction: list.reduce((s, a) => s + a.deduction, 0),
      totalLateMinutes: list.reduce((s, a) => s + a.lateMinutes, 0),
    };
  },
};

function lookupEmpName(id: string): string {
  return getStore().getState().employees.find((e) => e.id === id)?.fullName ?? id;
}

// ------------------------------------------------------------
// Leave Service (Cuti / Izin / Sakit)
// ------------------------------------------------------------
export const leaveService = {
  list(): Leave[] {
    return getStore().getState().leaves;
  },
  byEmployee(employeeId: string): Leave[] {
    return getStore()
      .getState()
      .leaves.filter((l) => l.employeeId === employeeId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  },
  byStatus(status: LeaveStatus): Leave[] {
    return getStore().getState().leaves.filter((l) => l.status === status);
  },
  /** Hitung jumlah hari kerja cuti (inklusif). */
  leaveDays(startDate: string, endDate: string): number {
    return daysBetween(startDate, endDate) + 1;
  },
  /** Cek tabrakan dengan cuti approved lain untuk karyawan yang sama. */
  checkConflict(employeeId: string, startDate: string, endDate: string, excludeId?: string): Leave | undefined {
    return getStore()
      .getState()
      .leaves.find((l) => {
        if (l.id === excludeId) return false;
        if (l.employeeId !== employeeId) return false;
        if (l.status !== "APPROVED" && l.status !== "PENDING") return false;
        // rentang overlap
        return l.startDate <= endDate && l.endDate >= startDate;
      });
  },
  create(input: Omit<Leave, "id" | "createdAt" | "updatedAt" | "status"> & { status?: LeaveStatus }): Leave {
    const store = getStore();
    const now = NOW();
    const item: Leave = {
      ...input,
      id: uid("leave"),
      status: input.status ?? "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    store.setCollection("leaves", [item, ...store.getState().leaves]);
    logAudit({ module: "Cuti", action: "CREATE", description: `Membuat pengajuan ${item.type} ${lookupEmpName(item.employeeId)} (${item.startDate}–${item.endDate}).`, after: item });
    return item;
  },
  update(id: string, patch: Partial<Leave>): Leave | undefined {
    const store = getStore();
    const list = store.getState().leaves;
    const idx = list.findIndex((l) => l.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: Leave = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("leaves", next);
    logAudit({ module: "Cuti", action: "UPDATE", description: `Memperbarui pengajuan cuti ${lookupEmpName(after.employeeId)}.`, before, after });
    return after;
  },
  /** Approve: kurangi saldo cuti (hanya untuk tipe CUTI). */
  approve(id: string, approverId: string, note?: string): Leave | undefined {
    const store = getStore();
    const leave = store.getState().leaves.find((l) => l.id === id);
    if (!leave || leave.status !== "PENDING") return undefined;
    // Kurangi saldo cuti jika tipe CUTI
    if (leave.type === "CUTI") {
      const emp = store.getState().employees.find((e) => e.id === leave.employeeId);
      if (emp) {
        const days = this.leaveDays(leave.startDate, leave.endDate);
        const newBalance = Math.max(0, emp.leaveBalanceDays - days);
        const empList = store.getState().employees.map((e) =>
          e.id === emp.id ? { ...e, leaveBalanceDays: newBalance, updatedAt: NOW() } : e,
        );
        store.setCollection("employees", empList);
        logChangeHistory({ entityType: "EMPLOYEE", entityId: emp.id, field: "leaveBalanceDays", oldValue: String(emp.leaveBalanceDays), newValue: String(newBalance), reason: `Approval cuti ${leave.startDate}–${leave.endDate}` });
      }
    }
    return this.update(id, { status: "APPROVED", approverId, approvalNote: note });
  },
  /** Reject: tidak mengurangi saldo. */
  reject(id: string, approverId: string, note?: string): Leave | undefined {
    return this.update(id, { status: "REJECTED", approverId, approvalNote: note });
  },
  /** Cancel approved: kembalikan saldo cuti. */
  cancelApproved(id: string, reason?: string): Leave | undefined {
    const store = getStore();
    const leave = store.getState().leaves.find((l) => l.id === id);
    if (!leave || leave.status !== "APPROVED") return undefined;
    if (leave.type === "CUTI") {
      const emp = store.getState().employees.find((e) => e.id === leave.employeeId);
      if (emp) {
        const days = this.leaveDays(leave.startDate, leave.endDate);
        const newBalance = emp.leaveBalanceDays + days;
        const empList = store.getState().employees.map((e) =>
          e.id === emp.id ? { ...e, leaveBalanceDays: newBalance, updatedAt: NOW() } : e,
        );
        store.setCollection("employees", empList);
        logChangeHistory({ entityType: "EMPLOYEE", entityId: emp.id, field: "leaveBalanceDays", oldValue: String(emp.leaveBalanceDays), newValue: String(newBalance), reason: reason ?? "Pembatalan cuti approved" });
      }
    }
    return this.update(id, { status: "CANCELLED", approvalNote: reason });
  },
};

// ------------------------------------------------------------
// Overtime Service (Planning + Actual)
// ------------------------------------------------------------
export const overtimeService = {
  // ---- Planning ----
  listPlannings(): OvertimePlanning[] {
    return getStore().getState().overtimePlannings;
  },
  getPlanning(id: string): OvertimePlanning | undefined {
    return getStore().getState().overtimePlannings.find((p) => p.id === id);
  },
  createPlanning(input: Omit<OvertimePlanning, "id" | "createdAt" | "updatedAt" | "status"> & { status?: OvertimeApprovalStatus }): OvertimePlanning {
    const store = getStore();
    const now = NOW();
    const item: OvertimePlanning = {
      ...input,
      id: uid("ot-plan"),
      status: input.status ?? "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    store.setCollection("overtimePlannings", [item, ...store.getState().overtimePlannings]);
    logAudit({ module: "Lembur", action: "CREATE", description: `Membuat planning lembur ${item.requestNo}.`, after: item });
    return item;
  },
  updatePlanning(id: string, patch: Partial<OvertimePlanning>): OvertimePlanning | undefined {
    const store = getStore();
    const list = store.getState().overtimePlannings;
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: OvertimePlanning = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("overtimePlannings", next);
    logAudit({ module: "Lembur", action: "UPDATE", description: `Memperbarui planning lembur ${after.requestNo}.`, before, after });
    return after;
  },
  approvePlanning(id: string, approverId: string): OvertimePlanning | undefined {
    return this.updatePlanning(id, { status: "APPROVED", approverId });
  },
  rejectPlanning(id: string, approverId: string): OvertimePlanning | undefined {
    return this.updatePlanning(id, { status: "REJECTED", approverId });
  },

  // ---- Actual ----
  listActuals(): OvertimeActual[] {
    return getStore().getState().overtimeActuals;
  },
  getActual(id: string): OvertimeActual | undefined {
    return getStore().getState().overtimeActuals.find((a) => a.id === id);
  },
  actualsForPlanning(planningId: string): OvertimeActual[] {
    return getStore().getState().overtimeActuals.filter((a) => a.planningId === planningId);
  },
  /** Upsert actual lembur. */
  upsertActual(input: {
    id?: string;
    planningId?: string;
    employeeId: string;
    date: string;
    actualStart?: string;
    actualEnd?: string;
    actualDurationMinutes?: number;
    timeSource?: "MANUAL" | "SYSTEM" | "APPROVER";
    workResult?: string;
    evidenceUrl?: string;
    diffReason?: string;
    rate: number;
    note?: string;
  }): OvertimeActual {
    const store = getStore();
    const list = store.getState().overtimeActuals;
    const now = NOW();
    // Hitung planning diff bila ada planning
    let planningDiffMinutes: number | undefined;
    if (input.planningId) {
      const plan = this.getPlanning(input.planningId);
      if (plan && input.actualDurationMinutes != null) {
        planningDiffMinutes = input.actualDurationMinutes - plan.durationMinutes;
      }
    }
    const estimatedNominal = input.actualDurationMinutes
      ? Math.round((input.actualDurationMinutes / 60) * input.rate)
      : 0;
    const verificationStatus: OvertimeVerificationStatus = input.actualDurationMinutes != null ? "DIISI" : "BELUM_DIISI";

    if (input.id) {
      const existing = list.find((a) => a.id === input.id);
      if (existing) {
        const after: OvertimeActual = {
          ...existing,
          planningId: input.planningId ?? existing.planningId,
          actualStart: input.actualStart ?? existing.actualStart,
          actualEnd: input.actualEnd ?? existing.actualEnd,
          actualDurationMinutes: input.actualDurationMinutes ?? existing.actualDurationMinutes,
          timeSource: input.timeSource ?? existing.timeSource,
          workResult: input.workResult ?? existing.workResult,
          evidenceUrl: input.evidenceUrl ?? existing.evidenceUrl,
          planningDiffMinutes: planningDiffMinutes ?? existing.planningDiffMinutes,
          diffReason: input.diffReason ?? existing.diffReason,
          rate: input.rate,
          estimatedNominal,
          note: input.note ?? existing.note,
          verificationStatus: existing.verificationStatus === "TERVERIFIKASI" ? "TERVERIFIKASI" : verificationStatus,
          updatedAt: now,
        };
        store.setCollection("overtimeActuals", list.map((a) => (a.id === existing.id ? after : a)));
        logAudit({ module: "Lembur", action: "UPDATE_ACTUAL", description: `Memperbarui actual lembur ${lookupEmpName(input.employeeId)}.`, after });
        return after;
      }
    }
    const item: OvertimeActual = {
      id: uid("ot-act"),
      planningId: input.planningId,
      employeeId: input.employeeId,
      date: input.date,
      actualStart: input.actualStart,
      actualEnd: input.actualEnd,
      actualDurationMinutes: input.actualDurationMinutes,
      timeSource: input.timeSource,
      workResult: input.workResult,
      evidenceUrl: input.evidenceUrl,
      planningDiffMinutes,
      diffReason: input.diffReason,
      verifierId: undefined,
      verificationStatus,
      rate: input.rate,
      estimatedNominal,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };
    store.setCollection("overtimeActuals", [item, ...list]);
    logAudit({ module: "Lembur", action: "CREATE_ACTUAL", description: `Menambah actual lembur ${lookupEmpName(input.employeeId)}.`, after: item });
    return item;
  },
  /** Verifikasi actual lembur. */
  verifyActual(id: string, verifierId: string, approved: boolean): OvertimeActual | undefined {
    const store = getStore();
    const list = store.getState().overtimeActuals;
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: OvertimeActual = {
      ...before,
      verifierId,
      verificationStatus: approved ? "TERVERIFIKASI" : "DITOLAK",
      updatedAt: NOW(),
    };
    const next = [...list];
    next[idx] = after;
    store.setCollection("overtimeActuals", next);
    logAudit({ module: "Lembur", action: "VERIFY", description: `${approved ? "Memverifikasi" : "Menolak"} actual lembur ${lookupEmpName(before.employeeId)}.`, before, after });
    return after;
  },
  /** Daftar anomali lembur. */
  anomalies(): OvertimeAnomaly[] {
    const state = getStore().getState();
    const anomalies: OvertimeAnomaly[] = [];
    const today = todayISODate();
    // 1. Lembur tanpa planning
    state.overtimeActuals
      .filter((a) => !a.planningId && a.actualDurationMinutes)
      .forEach((a) => {
        anomalies.push({
          type: "TANPA_PLANNING",
          severity: "high",
          actualId: a.id,
          employeeId: a.employeeId,
          date: a.date,
          message: `Actual lembur tanpa planning (${a.actualDurationMinutes}m).`,
        });
      });
    // 2. Actual melebihi planning
    state.overtimeActuals.forEach((a) => {
      if (a.planningId && a.actualDurationMinutes != null) {
        const plan = state.overtimePlannings.find((p) => p.id === a.planningId);
        if (plan && a.actualDurationMinutes > plan.durationMinutes * 1.2) {
          anomalies.push({
            type: "MELEBIHI_PLANNING",
            severity: "medium",
            actualId: a.id,
            planningId: a.planningId,
            employeeId: a.employeeId,
            date: a.date,
            message: `Actual ${a.actualDurationMinutes}m melebihi planning ${plan.durationMinutes}m (selisih +${a.actualDurationMinutes - plan.durationMinutes}m).`,
          });
        }
      }
    });
    // 3. Actual belum diisi (planning approved di masa lalu tanpa actual)
    state.overtimePlannings
      .filter((p) => p.status === "APPROVED" && p.date < today)
      .forEach((p) => {
        p.employeeIds.forEach((empId) => {
          const hasActual = state.overtimeActuals.some((a) => a.planningId === p.id && a.employeeId === empId && a.actualDurationMinutes != null);
          if (!hasActual) {
            anomalies.push({
              type: "BELUM_DIISI",
              severity: "medium",
              planningId: p.id,
              employeeId: empId,
              date: p.date,
              message: `Actual lembur belum diisi untuk ${lookupEmpName(empId)} (${p.requestNo}).`,
            });
          }
        });
      });
    // 4. Actual belum diverifikasi
    state.overtimeActuals
      .filter((a) => a.verificationStatus === "DIISI")
      .forEach((a) => {
        anomalies.push({
          type: "BELUM_DIVERIFIKASI",
          severity: "low",
          actualId: a.id,
          employeeId: a.employeeId,
          date: a.date,
          message: `Actual lembur ${lookupEmpName(a.employeeId)} belum diverifikasi.`,
        });
      });
    // 5. Konflik dengan cuti approved
    state.overtimeActuals.forEach((a) => {
      const onLeave = state.leaves.find((l) => l.employeeId === a.employeeId && l.status === "APPROVED" && l.startDate <= a.date && l.endDate >= a.date);
      if (onLeave) {
        anomalies.push({
          type: "KONFLIK_CUTI",
          severity: "high",
          actualId: a.id,
          employeeId: a.employeeId,
          date: a.date,
          message: `Lembur bertabrakan dengan ${onLeave.type} ${onLeave.startDate}–${onLeave.endDate}.`,
        });
      }
    });
    // 6. Konflik dengan hari libur (holiday group)
    state.overtimeActuals.forEach((a) => {
      const emp = state.employees.find((e) => e.id === a.employeeId);
      if (emp?.holidayGroupId) {
        const hg = state.holidayGroups.find((g) => g.id === emp.holidayGroupId);
        if (hg) {
          const onHoliday = hg.holidayIds.some((hid) => state.holidays.find((h) => h.id === hid)?.date === a.date);
          if (onHoliday) {
            anomalies.push({
              type: "KONFLIK_LIBUR",
              severity: "info",
              actualId: a.id,
              employeeId: a.employeeId,
              date: a.date,
              message: `Lembur pada hari libur (perlu konfirmasi PH).`,
            });
          }
        }
      }
    });
    return anomalies.sort((a, b) => {
      const sev = { high: 0, medium: 1, low: 2, info: 3 };
      return sev[a.severity] - sev[b.severity];
    });
  },
  /** Total nominal lembur terverifikasi untuk periode & karyawan. */
  verifiedOvertimeAmount(employeeId: string, period: string): number {
    const [y, m] = period.split("-");
    const fromDate = `${y}-${m}-01`;
    const toDate = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`;
    return getStore()
      .getState()
      .overtimeActuals
      .filter((a) => a.employeeId === employeeId && a.date >= fromDate && a.date <= toDate && a.verificationStatus === "TERVERIFIKASI")
      .reduce((s, a) => s + a.estimatedNominal, 0);
  },
};

export interface OvertimeAnomaly {
  type:
    | "TANPA_PLANNING"
    | "MELEBIHI_PLANNING"
    | "BELUM_DIISI"
    | "BELUM_DIVERIFIKASI"
    | "KONFLIK_CUTI"
    | "KONFLIK_LIBUR"
    | "KONFLIK_JADWAL"
    | "KONFLIK_KONTRAK";
  severity: "high" | "medium" | "low" | "info";
  actualId?: string;
  planningId?: string;
  employeeId: string;
  date: string;
  message: string;
}
