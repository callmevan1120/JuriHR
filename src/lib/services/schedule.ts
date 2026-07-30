// ============================================================
// JURI HR — Fase 3 Services: Shift, Schedule, Holiday, Swap
// CRUD + deteksi konflik + generate jadwal dari shift group.
// ============================================================
import { getStore } from "@/lib/data/store";
import { logAudit, logChangeHistory } from "@/lib/services/audit";
import type {
  Holiday,
  HolidayGroup,
  HolidayOverride,
  HolidayOverrideType,
  Schedule,
  ShiftGroup,
  ShiftSwapRequest,
  ShiftSwapStatus,
  ShiftSwapType,
  ShiftTemplate,
  WeeklyPatternDay,
} from "@/lib/types";
import {
  addDaysISO,
  daysBetween,
  haversineKm,
  shiftDurationMinutes,
  todayISODate,
  uid,
} from "@/lib/utils";

const ACTOR = "HRD Admin";
const NOW = () => new Date().toISOString();

// ------------------------------------------------------------
// Shift Template Service
// ------------------------------------------------------------
export const shiftTemplateService = {
  list(): ShiftTemplate[] {
    return getStore().getState().shiftTemplates;
  },
  get(id: string): ShiftTemplate | undefined {
    return getStore().getState().shiftTemplates.find((s) => s.id === id);
  },
  create(input: Omit<ShiftTemplate, "id" | "createdAt" | "updatedAt">): ShiftTemplate {
    const store = getStore();
    const now = NOW();
    const item: ShiftTemplate = { ...input, id: uid("shift"), createdAt: now, updatedAt: now };
    store.setCollection("shiftTemplates", [item, ...store.getState().shiftTemplates]);
    logAudit({ module: "Shift Template", action: "CREATE", description: `Menambah shift template "${item.name}".`, after: item });
    return item;
  },
  update(id: string, patch: Partial<ShiftTemplate>): ShiftTemplate | undefined {
    const store = getStore();
    const list = store.getState().shiftTemplates;
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: ShiftTemplate = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("shiftTemplates", next);
    logAudit({ module: "Shift Template", action: "UPDATE", description: `Memperbarui shift template "${after.name}".`, before, after });
    return after;
  },
  softDelete(id: string): void {
    const store = getStore();
    const list = store.getState().shiftTemplates;
    const item = list.find((s) => s.id === id);
    if (!item) return;
    store.setCollection(
      "shiftTemplates",
      list.map((s) => (s.id === id ? { ...s, status: "archived", updatedAt: NOW() } : s)),
    );
    logAudit({ module: "Shift Template", action: "DELETE", description: `Mengarsipkan shift template "${item.name}".` });
  },
};

// ------------------------------------------------------------
// Shift Group Service
// ------------------------------------------------------------
export const shiftGroupService = {
  list(): ShiftGroup[] {
    return getStore().getState().shiftGroups;
  },
  get(id: string): ShiftGroup | undefined {
    return getStore().getState().shiftGroups.find((g) => g.id === id);
  },
  create(input: Omit<ShiftGroup, "id" | "createdAt" | "updatedAt">): ShiftGroup {
    const store = getStore();
    const now = NOW();
    const item: ShiftGroup = { ...input, id: uid("sg"), createdAt: now, updatedAt: now };
    store.setCollection("shiftGroups", [item, ...store.getState().shiftGroups]);
    logAudit({ module: "Shift Group", action: "CREATE", description: `Menambah shift group "${item.name}".`, after: item });
    return item;
  },
  update(id: string, patch: Partial<ShiftGroup>): ShiftGroup | undefined {
    const store = getStore();
    const list = store.getState().shiftGroups;
    const idx = list.findIndex((g) => g.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: ShiftGroup = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("shiftGroups", next);
    logAudit({ module: "Shift Group", action: "UPDATE", description: `Memperbarui shift group "${after.name}".`, before, after });
    return after;
  },
  softDelete(id: string): void {
    const store = getStore();
    const list = store.getState().shiftGroups;
    const item = list.find((g) => g.id === id);
    if (!item) return;
    store.setCollection(
      "shiftGroups",
      list.map((g) => (g.id === id ? { ...g, status: "archived", updatedAt: NOW() } : g)),
    );
    logAudit({ module: "Shift Group", action: "DELETE", description: `Mengarsipkan shift group "${item.name}".` });
  },
  /** Pattern untuk hari tertentu (0=Min, 6=Sab). */
  patternForDay(group: ShiftGroup, dayOfWeek: number): WeeklyPatternDay | undefined {
    return group.weeklyPattern.find((p) => p.day === dayOfWeek);
  },
};

// ------------------------------------------------------------
// Schedule Service (Kalender Jadwal)
// ------------------------------------------------------------
export const scheduleService = {
  list(): Schedule[] {
    return getStore().getState().schedules;
  },
  byDate(date: string): Schedule[] {
    return getStore().getState().schedules.filter((s) => s.date === date);
  },
  byEmployee(employeeId: string, fromDate?: string, toDate?: string): Schedule[] {
    return getStore()
      .getState()
      .schedules.filter((s) => {
        if (s.employeeId !== employeeId) return false;
        if (fromDate && s.date < fromDate) return false;
        if (toDate && s.date > toDate) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  /** Upsert jadwal untuk karyawan+tanggal. */
  upsert(input: {
    employeeId: string;
    date: string;
    shiftTemplateId?: string;
    outletId?: string;
    shiftGroupId?: string;
    source?: Schedule["source"];
    note?: string;
    locked?: boolean;
  }): Schedule {
    const store = getStore();
    const list = store.getState().schedules;
    const existing = list.find((s) => s.employeeId === input.employeeId && s.date === input.date);
    const now = NOW();
    if (existing) {
      if (existing.locked && input.source !== "SHIFT_GROUP") {
        // tidak boleh menimpa jadwal terkunci kecuali regen dari shift group
        throw new Error("Jadwal terkunci. Buka kunci terlebih dahulu untuk mengubah.");
      }
      const after: Schedule = {
        ...existing,
        shiftTemplateId: input.shiftTemplateId,
        outletId: input.outletId ?? existing.outletId,
        shiftGroupId: input.shiftGroupId ?? existing.shiftGroupId,
        source: input.source ?? existing.source,
        note: input.note ?? existing.note,
        updatedAt: now,
      };
      store.setCollection("schedules", list.map((s) => (s.id === existing.id ? after : s)));
      return after;
    }
    const item: Schedule = {
      id: uid("sch"),
      employeeId: input.employeeId,
      date: input.date,
      shiftTemplateId: input.shiftTemplateId,
      outletId: input.outletId,
      shiftGroupId: input.shiftGroupId,
      source: input.source ?? "MANUAL",
      note: input.note,
      locked: input.locked ?? false,
      createdAt: now,
      updatedAt: now,
    };
    store.setCollection("schedules", [...list, item]);
    return item;
  },
  /** Hapus jadwal (set libur). */
  remove(employeeId: string, date: string): void {
    const store = getStore();
    const list = store.getState().schedules;
    const existing = list.find((s) => s.employeeId === employeeId && s.date === date);
    if (existing?.locked) {
      throw new Error("Jadwal terkunci. Buka kunci terlebih dahulu.");
    }
    store.setCollection(
      "schedules",
      list.filter((s) => !(s.employeeId === employeeId && s.date === date)),
    );
  },
  /** Toggle lock untuk periode. */
  toggleLockRange(fromDate: string, toDate: string, locked: boolean): number {
    const store = getStore();
    const list = store.getState().schedules;
    let count = 0;
    const next = list.map((s) => {
      if (s.date >= fromDate && s.date <= toDate) {
        count += 1;
        return { ...s, locked, updatedAt: NOW() };
      }
      return s;
    });
    store.setCollection("schedules", next);
    logAudit({
      module: "Jadwal",
      action: locked ? "LOCK" : "UNLOCK",
      description: `${locked ? "Mengunci" : "Membuka kunci"} ${count} jadwal periode ${fromDate}–${toDate}.`,
    });
    return count;
  },
  /** Generate jadwal dari shift group untuk range tanggal. */
  generateFromShiftGroup(groupId: string, fromDate: string, toDate: string, overwrite = false): number {
    const store = getStore();
    const state = store.getState();
    const group = state.shiftGroups.find((g) => g.id === groupId);
    if (!group) return 0;
    let count = 0;
    const list = [...state.schedules];
    const now = NOW();
    for (const empId of group.memberIds) {
      let cursor = fromDate;
      while (cursor <= toDate) {
        const dow = new Date(`${cursor}T00:00:00Z`).getUTCDay();
        const pattern = shiftGroupService.patternForDay(group, dow);
        const existingIdx = list.findIndex((s) => s.employeeId === empId && s.date === cursor);
        if (existingIdx >= 0 && !overwrite) {
          // skip jika sudah ada & tidak overwrite
        } else {
          const newSched: Schedule = {
            id: existingIdx >= 0 ? list[existingIdx]!.id : uid("sch"),
            employeeId: empId,
            date: cursor,
            outletId: state.employees.find((e) => e.id === empId)?.primaryOutletId,
            shiftTemplateId: pattern?.shiftTemplateId,
            shiftGroupId: group.id,
            source: "SHIFT_GROUP",
            locked: false,
            createdAt: existingIdx >= 0 ? list[existingIdx]!.createdAt : now,
            updatedAt: now,
          };
          if (existingIdx >= 0) {
            list[existingIdx] = newSched;
          } else {
            list.push(newSched);
          }
          count += 1;
        }
        cursor = addDaysISO(cursor, 1);
      }
    }
    store.setCollection("schedules", list);
    logAudit({
      module: "Jadwal",
      action: "GENERATE",
      description: `Generate ${count} jadwal dari shift group "${group.name}" (${fromDate}–${toDate}).`,
    });
    return count;
  },
  /** Copy jadwal dari minggu sumber ke minggu target. */
  copyWeek(srcMonday: string, dstMonday: string, employeeIds?: string[]): number {
    const store = getStore();
    const list = [...store.getState().schedules];
    const now = NOW();
    let count = 0;
    const emps = employeeIds ?? stateEmployeeIds(store.getState().schedules, srcMonday);
    for (const empId of emps) {
      for (let d = 0; d < 7; d++) {
        const srcDate = addDaysISO(srcMonday, d);
        const dstDate = addDaysISO(dstMonday, d);
        const src = list.find((s) => s.employeeId === empId && s.date === srcDate);
        if (!src) continue;
        const existingIdx = list.findIndex((s) => s.employeeId === empId && s.date === dstDate);
        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...list[existingIdx]!,
            shiftTemplateId: src.shiftTemplateId,
            outletId: src.outletId,
            shiftGroupId: src.shiftGroupId,
            source: "MANUAL",
            note: `Copy dari minggu ${srcMonday}`,
            updatedAt: now,
          };
        } else {
          list.push({
            id: uid("sch"),
            employeeId: empId,
            date: dstDate,
            shiftTemplateId: src.shiftTemplateId,
            outletId: src.outletId,
            shiftGroupId: src.shiftGroupId,
            source: "MANUAL",
            note: `Copy dari minggu ${srcMonday}`,
            locked: false,
            createdAt: now,
            updatedAt: now,
          });
        }
        count += 1;
      }
    }
    store.setCollection("schedules", list);
    logAudit({ module: "Jadwal", action: "COPY_WEEK", description: `Copy ${count} jadwal dari minggu ${srcMonday} ke ${dstMonday}.` });
    return count;
  },
  /** Deteksi konflik untuk karyawan di tanggal tertentu. */
  detectConflicts(employeeId: string, date: string, excludeShiftId?: string): ConflictInfo[] {
    const state = getStore().getState();
    const conflicts: ConflictInfo[] = [];
    // Konflik jadwal: ada 2+ shift di tanggal sama
    const dayScheds = state.schedules.filter((s) => s.employeeId === employeeId && s.date === date && s.shiftTemplateId && s.shiftTemplateId !== excludeShiftId);
    if (dayScheds.length > 1) {
      conflicts.push({ type: "JADWAL", message: "Memiliki lebih dari satu shift pada tanggal yang sama." });
    }
    // Kontrak tidak aktif
    const activeContract = state.contracts.find((c) => c.employeeId === employeeId && (c.status === "AKTIF" || c.status === "AKAN_BERAKHIR"));
    if (!activeContract) {
      conflicts.push({ type: "KONTRAK", message: "Tidak memiliki kontrak aktif." });
    }
    // Cuti approved
    const onLeave = state.leaves.find((l) => l.employeeId === employeeId && l.status === "APPROVED" && l.startDate <= date && l.endDate >= date);
    if (onLeave) {
      conflicts.push({ type: "CUTI", message: `Sedang ${onLeave.type} pada tanggal ini.` });
    }
    // Hari libur (cek holiday group karyawan + holidays)
    const emp = state.employees.find((e) => e.id === employeeId);
    if (emp?.holidayGroupId) {
      const hg = state.holidayGroups.find((g) => g.id === emp.holidayGroupId);
      if (hg) {
        const onHoliday = hg.holidayIds.some((hid) => state.holidays.find((h) => h.id === hid)?.date === date);
        if (onHoliday) {
          conflicts.push({ type: "LIBUR", message: "Tanggal ini adalah hari libur sesuai holiday group karyawan." });
        }
      }
    }
    return conflicts;
  },
};

function stateEmployeeIds(schedules: Schedule[], weekStart: string): string[] {
  const set = new Set<string>();
  for (let d = 0; d < 7; d++) {
    const date = addDaysISO(weekStart, d);
    schedules.filter((s) => s.date === date).forEach((s) => set.add(s.employeeId));
  }
  return Array.from(set);
}

export interface ConflictInfo {
  type: "JADWAL" | "KONTRAK" | "CUTI" | "LIBUR" | "LEMBUR" | "JARAK";
  message: string;
}

// ------------------------------------------------------------
// Holiday Service
// ------------------------------------------------------------
export const holidayService = {
  listHolidays(): Holiday[] {
    return getStore().getState().holidays;
  },
  listGroups(): HolidayGroup[] {
    return getStore().getState().holidayGroups;
  },
  listOverrides(): HolidayOverride[] {
    return getStore().getState().holidayOverrides;
  },
  createHoliday(input: Omit<Holiday, "id">): Holiday {
    const store = getStore();
    const item: Holiday = { ...input, id: uid("hol") };
    store.setCollection("holidays", [...store.getState().holidays, item]);
    logAudit({ module: "Holiday", action: "CREATE", description: `Menambah hari libur "${item.name}".`, after: item });
    return item;
  },
  updateHoliday(id: string, patch: Partial<Holiday>): Holiday | undefined {
    const store = getStore();
    const list = store.getState().holidays;
    const idx = list.findIndex((h) => h.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: Holiday = { ...before, ...patch, id };
    const next = [...list];
    next[idx] = after;
    store.setCollection("holidays", next);
    logAudit({ module: "Holiday", action: "UPDATE", description: `Memperbarui hari libur "${after.name}".`, before, after });
    return after;
  },
  deleteHoliday(id: string): void {
    const store = getStore();
    const item = store.getState().holidays.find((h) => h.id === id);
    store.setCollection("holidays", store.getState().holidays.filter((h) => h.id !== id));
    if (item) logAudit({ module: "Holiday", action: "DELETE", description: `Menghapus hari libur "${item.name}".` });
  },
  generateNationalHolidaysByCountry(country: string, year = 2026): number {
    const store = getStore();
    const existing = store.getState().holidays;

    const PRESET_ID_2026 = [
      { name: "Tahun Baru 2026 Masehi", date: `${year}-01-01`, type: "NASIONAL" as const, country: "ID", description: "Libur Nasional Tahun Baru Masehi" },
      { name: "Isra Mi'raj Nabi Muhammad SAW", date: `${year}-01-16`, type: "KEAGAMAAN" as const, country: "ID", description: "Hari Libur Keagamaan Islam" },
      { name: "Tahun Baru Imlek 2577 Kongzili", date: `${year}-02-17`, type: "NASIONAL" as const, country: "ID", description: "Tahun Baru Imlek" },
      { name: "Hari Suci Nyepi Tahun Baru Saka 1948", date: `${year}-03-19`, type: "KEAGAMAAN" as const, country: "ID", description: "Hari Raya Nyepi" },
      { name: "Hari Raya Idul Fitri 1447 H (Hari Ke-1)", date: `${year}-03-20`, type: "NASIONAL" as const, country: "ID", description: "Hari Raya Idul Fitri" },
      { name: "Hari Raya Idul Fitri 1447 H (Hari Ke-2)", date: `${year}-03-21`, type: "NASIONAL" as const, country: "ID", description: "Hari Raya Idul Fitri" },
      { name: "Wafat Yesus Kristus", date: `${year}-04-03`, type: "KEAGAMAAN" as const, country: "ID", description: "Wafat Isa Almasih" },
      { name: "Hari Buruh Internasional", date: `${year}-05-01`, type: "NASIONAL" as const, country: "ID", description: "May Day / Hari Buruh" },
      { name: "Kenaikan Yesus Kristus", date: `${year}-05-14`, type: "KEAGAMAAN" as const, country: "ID", description: "Kenaikan Isa Almasih" },
      { name: "Hari Raya Waisak 2570 BE", date: `${year}-05-31`, type: "KEAGAMAAN" as const, country: "ID", description: "Hari Raya Waisak" },
      { name: "Hari Lahir Pancasila", date: `${year}-06-01`, type: "NASIONAL" as const, country: "ID", description: "Hari Lahir Pancasila" },
      { name: "Hari Raya Idul Adha 1447 H", date: `${year}-05-27`, type: "NASIONAL" as const, country: "ID", description: "Hari Raya Qurban" },
      { name: "Tahun Baru Islam 1448 H", date: `${year}-06-16`, type: "KEAGAMAAN" as const, country: "ID", description: "1 Muharram 1448 H" },
      { name: "Hari Kemerdekaan RI (HUT RI ke-81)", date: `${year}-08-17`, type: "NASIONAL" as const, country: "ID", description: "HUT Kemerdekaan Republik Indonesia" },
      { name: "Maulid Nabi Muhammad SAW", date: `${year}-08-25`, type: "KEAGAMAAN" as const, country: "ID", description: "Maulid Nabi" },
      { name: "Hari Raya Natal", date: `${year}-12-25`, type: "NASIONAL" as const, country: "ID", description: "Hari Raya Natal" },
    ];

    const presets = country === "ID" ? PRESET_ID_2026 : PRESET_ID_2026;
    let addedCount = 0;
    const nextList = [...existing];

    for (const h of presets) {
      if (!nextList.some((item) => item.date === h.date && item.name === h.name)) {
        nextList.push({ id: uid("hol"), ...h });
        addedCount += 1;
      }
    }

    store.setCollection("holidays", nextList);
    logAudit({
      module: "Holiday",
      action: "CREATE",
      description: `Otomatis generate ${addedCount} hari libur nasional untuk negara ${country} tahun ${year}.`,
    });
    return addedCount;
  },
  createGroup(input: Omit<HolidayGroup, "id" | "createdAt" | "updatedAt">): HolidayGroup {
    const store = getStore();
    const now = NOW();
    const item: HolidayGroup = { ...input, id: uid("hg"), createdAt: now, updatedAt: now };
    store.setCollection("holidayGroups", [item, ...store.getState().holidayGroups]);
    logAudit({ module: "Holiday Group", action: "CREATE", description: `Menambah holiday group "${item.name}".`, after: item });
    return item;
  },
  updateGroup(id: string, patch: Partial<HolidayGroup>): HolidayGroup | undefined {
    const store = getStore();
    const list = store.getState().holidayGroups;
    const idx = list.findIndex((g) => g.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: HolidayGroup = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("holidayGroups", next);
    logAudit({ module: "Holiday Group", action: "UPDATE", description: `Memperbarui holiday group "${after.name}".`, before, after });
    return after;
  },
  softDeleteGroup(id: string): void {
    const store = getStore();
    const list = store.getState().holidayGroups;
    const item = list.find((g) => g.id === id);
    if (!item) return;
    store.setCollection(
      "holidayGroups",
      list.map((g) => (g.id === id ? { ...g, status: "archived", updatedAt: NOW() } : g)),
    );
    logAudit({ module: "Holiday Group", action: "DELETE", description: `Mengarsipkan holiday group "${item.name}".` });
  },
  createOverride(input: Omit<HolidayOverride, "id" | "createdAt" | "updatedAt">): HolidayOverride {
    const store = getStore();
    const now = NOW();
    const item: HolidayOverride = { ...input, id: uid("hov"), createdAt: now, updatedAt: now };
    store.setCollection("holidayOverrides", [item, ...store.getState().holidayOverrides]);
    logAudit({ module: "Holiday Override", action: "CREATE", description: `Menambah override libur (${item.type}).`, after: item });
    return item;
  },
  deleteOverride(id: string): void {
    const store = getStore();
    store.setCollection("holidayOverrides", store.getState().holidayOverrides.filter((o) => o.id !== id));
    logAudit({ module: "Holiday Override", action: "DELETE", description: `Menghapus override libur.` });
  },
  /** Apakah tanggal tertentu libur untuk karyawan (berdasar holiday group + override). */
  isHolidayForEmployee(employeeId: string, date: string): { holiday?: Holiday; override?: HolidayOverride } {
    const state = getStore().getState();
    const emp = state.employees.find((e) => e.id === employeeId);
    if (!emp?.holidayGroupId) return {};
    const hg = state.holidayGroups.find((g) => g.id === emp.holidayGroupId);
    if (!hg) return {};
    const holiday = state.holidays.find((h) => hg.holidayIds.includes(h.id) && h.date === date);
    // Cek override: ADDITIONAL_HOLIDAY / WORKDAY_OVERRIDE
    const overrides = state.holidayOverrides.filter(
      (o) => o.holidayGroupId === hg.id && o.status === "active" && (o.employeeIds.length === 0 || o.employeeIds.includes(employeeId)),
    );
    const additional = overrides.find((o) => (o.type === "ADDITIONAL_HOLIDAY" || o.type === "WORKDAY_OVERRIDE") && o.replacementDate === date);
    if (additional) {
      return { override: additional };
    }
    // Cek CANCELLED_HOLIDAY: jika holiday ada tapi di-cancel untuk karyawan ini
    const cancelled = overrides.find(
      (o) => o.type === "CANCELLED_HOLIDAY" && o.originalHolidayDate === date,
    );
    if (cancelled && holiday) {
      return {}; // libur dibatalkan
    }
    return holiday ? { holiday } : {};
  },
};

// ------------------------------------------------------------
// Shift Swap Service (Pengajuan & Tukar Shift)
// ------------------------------------------------------------
export const shiftSwapService = {
  list(): ShiftSwapRequest[] {
    return getStore().getState().shiftSwaps;
  },
  get(id: string): ShiftSwapRequest | undefined {
    return getStore().getState().shiftSwaps.find((s) => s.id === id);
  },
  create(input: Omit<ShiftSwapRequest, "id" | "createdAt" | "updatedAt" | "status"> & { status?: ShiftSwapStatus }): ShiftSwapRequest {
    const store = getStore();
    const now = NOW();
    const item: ShiftSwapRequest = {
      ...input,
      id: uid("swap"),
      status: input.status ?? "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    store.setCollection("shiftSwaps", [item, ...store.getState().shiftSwaps]);
    logAudit({ module: "Tukar Shift", action: "CREATE", description: `Membuat pengajuan tukar shift ${item.requestNo}.`, after: item });
    return item;
  },
  update(id: string, patch: Partial<ShiftSwapRequest>): ShiftSwapRequest | undefined {
    const store = getStore();
    const list = store.getState().shiftSwaps;
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: ShiftSwapRequest = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("shiftSwaps", next);
    logAudit({ module: "Tukar Shift", action: "UPDATE", description: `Memperbarui pengajuan tukar shift ${after.requestNo}.`, before, after });
    return after;
  },
  /** Approve & apply: ubah jadwal sesuai tipe swap. */
  approve(id: string, approverId: string, note?: string): ShiftSwapRequest | undefined {
    const store = getStore();
    const swap = store.getState().shiftSwaps.find((s) => s.id === id);
    if (!swap || swap.status !== "PENDING") return undefined;
    // Apply perubahan jadwal
    this.applySwap(swap);
    const updated = this.update(id, { status: "APPROVED", approverId, approvalNote: note });
    logChangeHistory({ entityType: "SHIFT_GROUP", entityId: id, field: "status", oldValue: "PENDING", newValue: "APPROVED", reason: note });
    return updated;
  },
  reject(id: string, approverId: string, note?: string): ShiftSwapRequest | undefined {
    return this.update(id, { status: "REJECTED", approverId, approvalNote: note });
  },
  /** Terapkan perubahan jadwal berdasarkan tipe swap. */
  applySwap(swap: ShiftSwapRequest): void {
    const store = getStore();
    const list = [...store.getState().schedules];
    const now = NOW();
    if (swap.type === "TUKAR_DUA_KARYAWAN" && swap.counterpartId) {
      // Tukar jadwal requester pada sourceDate dengan counterpart pada targetDate
      const reqSched = list.find((s) => s.employeeId === swap.requesterId && s.date === swap.sourceDate);
      const cptSched = list.find((s) => s.employeeId === swap.counterpartId && s.date === swap.targetDate);
      if (reqSched && cptSched) {
        // Tukar shiftTemplateId & outletId
        const reqShift = reqSched.shiftTemplateId;
        const reqOutlet = reqSched.outletId;
        const cptShift = cptSched.shiftTemplateId;
        const cptOutlet = cptSched.outletId;
        const reqIdx = list.findIndex((s) => s.id === reqSched.id);
        const cptIdx = list.findIndex((s) => s.id === cptSched.id);
        list[reqIdx] = { ...reqSched, shiftTemplateId: cptShift, outletId: cptOutlet, source: "SWAP", updatedAt: now };
        list[cptIdx] = { ...cptSched, shiftTemplateId: reqShift, outletId: reqOutlet, source: "SWAP", updatedAt: now };
      }
    } else if (swap.type === "PINDAH_SATU_KARYAWAN") {
      // Pindahkan requester ke shift target pada tanggal target
      const idx = list.findIndex((s) => s.employeeId === swap.requesterId && s.date === swap.sourceDate);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx]!,
          shiftTemplateId: swap.targetShiftTemplateId,
          outletId: swap.targetOutletId ?? list[idx]!.outletId,
          source: "SWAP",
          updatedAt: now,
        };
      } else {
        // buat baru
        list.push({
          id: uid("sch"),
          employeeId: swap.requesterId,
          date: swap.sourceDate,
          shiftTemplateId: swap.targetShiftTemplateId,
          outletId: swap.targetOutletId,
          source: "SWAP",
          locked: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else if (swap.type === "ANTAR_OUTLET" && swap.counterpartId) {
      // Tukar outlet antara requester & counterpart pada tanggal yang sama
      const reqIdx = list.findIndex((s) => s.employeeId === swap.requesterId && s.date === swap.sourceDate);
      const cptIdx = list.findIndex((s) => s.employeeId === swap.counterpartId && s.date === swap.targetDate);
      if (reqIdx >= 0 && cptIdx >= 0) {
        const reqOutlet = list[reqIdx]!.outletId;
        list[reqIdx] = { ...list[reqIdx]!, outletId: list[cptIdx]!.outletId, source: "SWAP", updatedAt: now };
        list[cptIdx] = { ...list[cptIdx]!, outletId: reqOutlet, source: "SWAP", updatedAt: now };
      }
    } else if (swap.type === "PERTUKARAN_HARI_KERJA" && swap.counterpartId) {
      // Tukar seluruh jadwal hari requester <-> counterpart
      const reqSched = list.find((s) => s.employeeId === swap.requesterId && s.date === swap.sourceDate);
      const cptSched = list.find((s) => s.employeeId === swap.counterpartId && s.date === swap.targetDate);
      if (reqSched && cptSched) {
        const reqIdx = list.findIndex((s) => s.id === reqSched.id);
        const cptIdx = list.findIndex((s) => s.id === cptSched.id);
        const reqTemplate = reqSched.shiftTemplateId;
        const cptTemplate = cptSched.shiftTemplateId;
        list[reqIdx] = { ...reqSched, shiftTemplateId: cptTemplate, source: "SWAP", updatedAt: now };
        list[cptIdx] = { ...cptSched, shiftTemplateId: reqTemplate, source: "SWAP", updatedAt: now };
      }
    }
    store.setCollection("schedules", list);
  },
  /** Preview dampak swap (sebelum/sesudah) tanpa apply. */
  preview(swap: ShiftSwapRequest): { before: { requester?: string; counterpart?: string }; after: { requester?: string; counterpart?: string } } {
    const state = getStore().getState();
    const shifts = state.shiftTemplates;
    const reqSched = state.schedules.find((s) => s.employeeId === swap.requesterId && s.date === swap.sourceDate);
    const cptSched = swap.counterpartId ? state.schedules.find((s) => s.employeeId === swap.counterpartId && s.date === swap.targetDate) : undefined;
    const shiftName = (id?: string) => (id ? shifts.find((s) => s.id === id)?.name ?? "—" : "Libur");
    const beforeReq = reqSched ? shiftName(reqSched.shiftTemplateId) : "Libur";
    const beforeCpt = cptSched ? shiftName(cptSched.shiftTemplateId) : "Libur";
    if (swap.type === "TUKAR_DUA_KARYAWAN") {
      return {
        before: { requester: beforeReq, counterpart: beforeCpt },
        after: { requester: beforeCpt, counterpart: beforeReq },
      };
    }
    if (swap.type === "PINDAH_SATU_KARYAWAN") {
      return {
        before: { requester: beforeReq },
        after: { requester: shiftName(swap.targetShiftTemplateId) },
      };
    }
    if (swap.type === "ANTAR_OUTLET") {
      const outName = (id?: string) => state.outlets.find((o) => o.id === id)?.name ?? "—";
      return {
        before: { requester: `${outName(swap.sourceOutletId)}`, counterpart: `${outName(swap.targetOutletId)}` },
        after: { requester: `${outName(swap.targetOutletId)}`, counterpart: `${outName(swap.sourceOutletId)}` },
      };
    }
    return { before: { requester: beforeReq, counterpart: beforeCpt }, after: { requester: beforeCpt, counterpart: beforeReq } };
  },
};
