// ============================================================
// JURI HR — Master Data Services (Fase 2)
// CRUD operations untuk Posisi, Divisi, Outlet, Karyawan,
// Domisili, dan Kontrak. Semua mutasi melewati central store
// dan mencatat audit log + change history.
// ============================================================
import { getStore } from "@/lib/data/store";
import { logAudit, logChangeHistory } from "@/lib/services/audit";
import type {
  Contract,
  Division,
  Domicile,
  Employee,
  Outlet,
  Position,
} from "@/lib/types";
import { haversineKm, todayISODate, uid } from "@/lib/utils";

const ACTOR = "HRD Admin";
const NOW = () => new Date().toISOString();

// ------------------------------------------------------------
// Posisi
// ------------------------------------------------------------
export const positionService = {
  list(): Position[] {
    return getStore().getState().positions;
  },
  get(id: string): Position | undefined {
    return getStore().getState().positions.find((p) => p.id === id);
  },
  create(input: Omit<Position, "id" | "createdAt" | "updatedAt">): Position {
    const store = getStore();
    const now = NOW();
    const item: Position = { ...input, id: uid("pos"), createdAt: now, updatedAt: now };
    store.setCollection("positions", [item, ...store.getState().positions]);
    logAudit({ module: "Posisi", action: "CREATE", description: `Menambah posisi "${item.name}".`, after: item });
    return item;
  },
  update(id: string, patch: Partial<Position>): Position | undefined {
    const store = getStore();
    const list = store.getState().positions;
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: Position = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("positions", next);
    logAudit({ module: "Posisi", action: "UPDATE", description: `Memperbarui posisi "${after.name}".`, before, after });
    return after;
  },
  softDelete(id: string): void {
    const store = getStore();
    const list = store.getState().positions;
    const item = list.find((p) => p.id === id);
    if (!item) return;
    store.setCollection(
      "positions",
      list.map((p) => (p.id === id ? { ...p, status: "archived", updatedAt: NOW() } : p)),
    );
    logAudit({ module: "Posisi", action: "DELETE", description: `Mengarsipkan posisi "${item.name}".` });
  },
};

// ------------------------------------------------------------
// Divisi
// ------------------------------------------------------------
export const divisionService = {
  list(): Division[] {
    return getStore().getState().divisions;
  },
  get(id: string): Division | undefined {
    return getStore().getState().divisions.find((d) => d.id === id);
  },
  create(input: Omit<Division, "id" | "createdAt" | "updatedAt">): Division {
    const store = getStore();
    const now = NOW();
    const item: Division = { ...input, id: uid("div"), createdAt: now, updatedAt: now };
    store.setCollection("divisions", [item, ...store.getState().divisions]);
    logAudit({ module: "Divisi", action: "CREATE", description: `Menambah divisi "${item.name}".`, after: item });
    return item;
  },
  update(id: string, patch: Partial<Division>): Division | undefined {
    const store = getStore();
    const list = store.getState().divisions;
    const idx = list.findIndex((d) => d.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: Division = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("divisions", next);
    logAudit({ module: "Divisi", action: "UPDATE", description: `Memperbarui divisi "${after.name}".`, before, after });
    return after;
  },
  softDelete(id: string): void {
    const store = getStore();
    const list = store.getState().divisions;
    const item = list.find((d) => d.id === id);
    if (!item) return;
    store.setCollection(
      "divisions",
      list.map((d) => (d.id === id ? { ...d, status: "archived", updatedAt: NOW() } : d)),
    );
    logAudit({ module: "Divisi", action: "DELETE", description: `Mengarsipkan divisi "${item.name}".` });
  },
};

// ------------------------------------------------------------
// Outlet
// ------------------------------------------------------------
export const outletService = {
  list(): Outlet[] {
    return getStore().getState().outlets;
  },
  get(id: string): Outlet | undefined {
    return getStore().getState().outlets.find((o) => o.id === id);
  },
  employeesOf(outletId: string): Employee[] {
    return getStore().getState().employees.filter((e) => e.primaryOutletId === outletId);
  },
  create(input: Omit<Outlet, "id" | "createdAt" | "updatedAt">): Outlet {
    const store = getStore();
    const now = NOW();
    const item: Outlet = { ...input, id: uid("out"), createdAt: now, updatedAt: now };
    store.setCollection("outlets", [item, ...store.getState().outlets]);
    logAudit({ module: "Outlet", action: "CREATE", description: `Menambah outlet "${item.name}".`, after: item });
    return item;
  },
  update(id: string, patch: Partial<Outlet>): Outlet | undefined {
    const store = getStore();
    const list = store.getState().outlets;
    const idx = list.findIndex((o) => o.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: Outlet = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("outlets", next);
    logAudit({ module: "Outlet", action: "UPDATE", description: `Memperbarui outlet "${after.name}".`, before, after });
    return after;
  },
  softDelete(id: string): void {
    const store = getStore();
    const list = store.getState().outlets;
    const item = list.find((o) => o.id === id);
    if (!item) return;
    store.setCollection(
      "outlets",
      list.map((o) => (o.id === id ? { ...o, status: "archived", updatedAt: NOW() } : o)),
    );
    logAudit({ module: "Outlet", action: "DELETE", description: `Mengarsipkan outlet "${item.name}".` });
  },
  delete(id: string): void {
    const store = getStore();
    const list = store.getState().outlets;
    const item = list.find((o) => o.id === id);
    if (!item) return;
    store.setCollection(
      "outlets",
      list.filter((o) => o.id !== id),
    );
    logAudit({ module: "Outlet", action: "DELETE", description: `Menghapus outlet "${item.name}".` });
  },
  /** Statistik karyawan per outlet + jarak domisili rata-rata. */
  stats(outletId: string) {
    const state = getStore().getState();
    const outlet = state.outlets.find((o) => o.id === outletId);
    const emps = state.employees.filter((e) => e.primaryOutletId === outletId && e.status === "AKTIF");
    const byPosition = new Map<string, { name: string; count: number }>();
    emps.forEach((e) => {
      const pos = state.positions.find((p) => p.id === e.positionId);
      const name = pos?.name ?? "-";
      const cur = byPosition.get(e.positionId) ?? { name, count: 0 };
      cur.count += 1;
      byPosition.set(e.positionId, cur);
    });
    const distances = emps
      .map((e) => {
        const dom = state.domiciles.find((d) => d.employeeId === e.id);
        if (!dom || !outlet) return null;
        return { employee: e, km: haversineKm(dom.latitude, dom.longitude, outlet.latitude, outlet.longitude) };
      })
      .filter((x): x is { employee: Employee; km: number } => x !== null);
    const avgKm = distances.length ? distances.reduce((s, d) => s + d.km, 0) / distances.length : 0;
    const sorted = [...distances].sort((a, b) => a.km - b.km);
    return {
      totalEmployees: emps.length,
      byPosition: Array.from(byPosition.values()).sort((a, b) => b.count - a.count),
      avgDistanceKm: avgKm,
      nearest: sorted[0],
      farthest: sorted[sorted.length - 1],
    };
  },
};

// ------------------------------------------------------------
// Karyawan
// ------------------------------------------------------------
export const employeeService = {
  list(): Employee[] {
    return getStore().getState().employees;
  },
  get(id: string): Employee | undefined {
    return getStore().getState().employees.find((e) => e.id === id);
  },
  create(input: Omit<Employee, "id" | "createdAt" | "updatedAt">): Employee {
    const store = getStore();
    const now = NOW();
    const item: Employee = { ...input, id: uid("emp"), createdAt: now, updatedAt: now };
    store.setCollection("employees", [item, ...store.getState().employees]);

    // Otomatis daftarkan karyawan ke memberIds ShiftGroup
    if (item.shiftGroupId) {
      const sgs = store.getState().shiftGroups;
      const sgIdx = sgs.findIndex((s) => s.id === item.shiftGroupId);
      if (sgIdx >= 0) {
        const sg = sgs[sgIdx]!;
        if (!sg.memberIds.includes(item.id)) {
          const newSgs = [...sgs];
          newSgs[sgIdx] = { ...sg, memberIds: [...sg.memberIds, item.id], updatedAt: now };
          store.setCollection("shiftGroups", newSgs);
        }
      }
    }

    logAudit({ module: "Karyawan", action: "CREATE", description: `Menambah karyawan "${item.fullName}".`, after: item });
    return item;
  },
  update(id: string, patch: Partial<Employee>, reason?: string): Employee | undefined {
    const store = getStore();
    const list = store.getState().employees;
    const idx = list.findIndex((e) => e.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: Employee = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("employees", next);

    // Otomatis daftarkan karyawan ke memberIds ShiftGroup jika berubah
    if (after.shiftGroupId) {
      const sgs = store.getState().shiftGroups;
      const sgIdx = sgs.findIndex((s) => s.id === after.shiftGroupId);
      if (sgIdx >= 0) {
        const sg = sgs[sgIdx]!;
        if (!sg.memberIds.includes(id)) {
          const newSgs = [...sgs];
          newSgs[sgIdx] = { ...sg, memberIds: [...sg.memberIds, id], updatedAt: NOW() };
          store.setCollection("shiftGroups", newSgs);
        }
      }
    }
    logAudit({ module: "Karyawan", action: "UPDATE", description: `Memperbarui data karyawan "${after.fullName}".`, before, after });
    // Catat histori untuk field penting
    const tracked: (keyof Employee)[] = ["positionId", "divisionId", "primaryOutletId", "status", "salaryAmount", "shiftGroupId", "holidayGroupId", "supervisorId"];
    tracked.forEach((field) => {
      const oldV = before[field];
      const newV = after[field];
      if (oldV !== newV) {
        const entityType =
          field === "positionId" ? "POSITION" :
          field === "divisionId" ? "DIVISION" :
          field === "primaryOutletId" ? "OUTLET" :
          field === "status" ? "STATUS" :
          field === "salaryAmount" ? "SALARY" :
          field === "shiftGroupId" ? "SHIFT_GROUP" :
          field === "holidayGroupId" ? "HOLIDAY_GROUP" :
          "EMPLOYEE";
        logChangeHistory({
          entityType,
          entityId: id,
          field: String(field),
          oldValue: oldV == null ? undefined : String(oldV),
          newValue: newV == null ? undefined : String(newV),
          reason,
        });
      }
    });
    return after;
  },
  /** Nonaktifkan (soft) — tidak menghapus, set status NONAKTIF. */
  deactivate(id: string, reason?: string): Employee | undefined {
    const emp = this.get(id);
    if (!emp) return undefined;
    return this.update(id, { status: "NONAKTIF" }, reason ?? "Dinonaktifkan oleh HRD");
  },
  reactivate(id: string): Employee | undefined {
    return this.update(id, { status: "AKTIF" }, "Diaktifkan kembali");
  },
  delete(id: string): void {
    const store = getStore();
    const list = store.getState().employees;
    const item = list.find((e) => e.id === id);
    if (!item) return;
    store.setCollection(
      "employees",
      list.filter((e) => e.id !== id),
    );
    logAudit({ module: "Karyawan", action: "DELETE", description: `Menghapus data karyawan "${item.fullName}" (${item.nik}).` });
  },
  histories(entityId: string) {
    return getStore().getState().changeHistories.filter((h) => h.entityId === entityId);
  },
  /** Bulk update field tertentu pada banyak karyawan. */
  bulkUpdate(ids: string[], patch: Partial<Employee>): number {
    const store = getStore();
    const list = store.getState().employees;
    let count = 0;
    const next = list.map((e) => {
      if (ids.includes(e.id)) {
        count += 1;
        return { ...e, ...patch, updatedAt: NOW() };
      }
      return e;
    });
    store.setCollection("employees", next);
    logAudit({ module: "Karyawan", action: "BULK_UPDATE", description: `Memperbarui ${count} karyawan secara massal.`, after: patch });
    return count;
  },
};

// ------------------------------------------------------------
// Domisili
// ------------------------------------------------------------
export const domicileService = {
  list(): Domicile[] {
    return getStore().getState().domiciles;
  },
  getByEmployee(employeeId: string): Domicile | undefined {
    return getStore().getState().domiciles.find((d) => d.employeeId === employeeId);
  },
  upsert(input: Omit<Domicile, "id" | "lastUpdated"> & { id?: string; employeeId: string }): Domicile {
    const store = getStore();
    const list = store.getState().domiciles;
    const existing = list.find((d) => d.employeeId === input.employeeId);
    const now = NOW();
    if (existing) {
      const after: Domicile = { ...existing, ...input, id: existing.id, lastUpdated: now };
      store.setCollection("domiciles", list.map((d) => (d.id === existing.id ? after : d)));
      logAudit({ module: "Domisili", action: "UPDATE", description: `Memperbarui domisili karyawan.`, before: existing, after });
      return after;
    }
    const item: Domicile = { ...input, id: uid("dom"), lastUpdated: now };
    store.setCollection("domiciles", [item, ...list]);
    logAudit({ module: "Domisili", action: "CREATE", description: `Menambah data domisili karyawan.`, after: item });
    return item;
  },
  /** Rekomendasi outlet terdekat dari koordinat domisili (info, bukan mutasi otomatis). */
  nearestOutlets(lat: number, lon: number, limit = 3) {
    const outlets = getStore().getState().outlets.filter((o) => o.status === "active");
    return outlets
      .map((o) => ({ outlet: o, km: haversineKm(lat, lon, o.latitude, o.longitude) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, limit);
  },
};

// ------------------------------------------------------------
// Kontrak
// ------------------------------------------------------------
export const contractService = {
  list(): Contract[] {
    return getStore().getState().contracts;
  },
  get(id: string): Contract | undefined {
    return getStore().getState().contracts.find((c) => c.id === id);
  },
  byEmployee(employeeId: string): Contract[] {
    return getStore().getState().contracts
      .filter((c) => c.employeeId === employeeId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  },
  create(input: Omit<Contract, "id" | "createdAt" | "updatedAt">): Contract {
    const store = getStore();
    const now = NOW();
    const item: Contract = { ...input, id: uid("ctr"), createdAt: now, updatedAt: now };
    store.setCollection("contracts", [item, ...store.getState().contracts]);
    logAudit({ module: "Kontrak", action: "CREATE", description: `Membuat kontrak ${item.contractNo}.`, after: item });
    return item;
  },
  update(id: string, patch: Partial<Contract>): Contract | undefined {
    const store = getStore();
    const list = store.getState().contracts;
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return undefined;
    const before = list[idx]!;
    const after: Contract = { ...before, ...patch, id, updatedAt: NOW() };
    const next = [...list];
    next[idx] = after;
    store.setCollection("contracts", next);
    logAudit({ module: "Kontrak", action: "UPDATE", description: `Memperbarui kontrak ${after.contractNo}.`, before, after });
    logChangeHistory({ entityType: "CONTRACT", entityId: id, field: Object.keys(patch).join(","), oldValue: JSON.stringify(before), newValue: JSON.stringify(after) });
    return after;
  },
  /** Perpanjang kontrak: buat kontrak baru yang mereferensikan kontrak lama, dan tandai kontrak lama sebagai DIPERPANJANG. */
  extend(oldContractId: string, input: { newStartDate: string; newEndDate: string; type: Contract["type"]; note?: string }): Contract | undefined {
    const store = getStore();
    const list = store.getState().contracts;
    const old = list.find((c) => c.id === oldContractId);
    if (!old) return undefined;
    const now = NOW();
    // Tandai kontrak lama
    const updatedOld: Contract = { ...old, status: "DIPERPANJANG", decision: "PERPANJANG", updatedAt: now };
    store.setCollection("contracts", list.map((c) => (c.id === old.id ? updatedOld : c)));
    // Buat kontrak baru
    const newContract: Contract = {
      id: uid("ctr"),
      contractNo: `CTR/${todayISODate().slice(0, 4)}/${String(list.length + 1).padStart(4, "0")}`,
      employeeId: old.employeeId,
      type: input.type,
      startDate: input.newStartDate,
      endDate: input.newEndDate,
      outletId: old.outletId,
      positionId: old.positionId,
      divisionId: old.divisionId,
      pjHrdId: old.pjHrdId,
      supervisorId: old.supervisorId,
      status: "AKTIF",
      decision: "PENDING",
      note: input.note,
      previousContractId: old.id,
      createdAt: now,
      updatedAt: now,
    };
    store.setCollection("contracts", [newContract, ...store.getState().contracts]);
    logAudit({
      module: "Kontrak",
      action: "EXTEND",
      description: `Memperpanjang kontrak ${old.contractNo} → ${newContract.contractNo}.`,
      before: old,
      after: newContract,
    });
    logChangeHistory({ entityType: "CONTRACT", entityId: newContract.id, field: "previousContractId", newValue: old.id, reason: "Perpanjangan kontrak" });
    return newContract;
  },
  /** Hitung kategori reminder berdasarkan tanggal jatuh tempo. */
  reminderCategory(endDate: string): {
    days: number;
    bucket: "lewat" | "3h" | "7h" | "14h" | "30h" | "60h" | "90h" | "aman";
    label: string;
  } {
    const today = todayISODate();
    const days = Math.ceil((new Date(endDate).getTime() - new Date(today).getTime()) / 86_400_000);
    if (days < 0) return { days, bucket: "lewat", label: "Lewat jatuh tempo" };
    if (days <= 3) return { days, bucket: "3h", label: "≤ 3 hari" };
    if (days <= 7) return { days, bucket: "7h", label: "≤ 7 hari" };
    if (days <= 14) return { days, bucket: "14h", label: "≤ 14 hari" };
    if (days <= 30) return { days, bucket: "30h", label: "≤ 30 hari" };
    if (days <= 60) return { days, bucket: "60h", label: "≤ 60 hari" };
    if (days <= 90) return { days, bucket: "90h", label: "≤ 90 hari" };
    return { days, bucket: "aman", label: "Aman" };
  },
};

// ------------------------------------------------------------
// Helper lookups (label resolve)
// ------------------------------------------------------------
export const lookupService = {
  positionName(id?: string): string {
    if (!id) return "-";
    return getStore().getState().positions.find((p) => p.id === id)?.name ?? "-";
  },
  divisionName(id?: string): string {
    if (!id) return "-";
    return getStore().getState().divisions.find((d) => d.id === id)?.name ?? "-";
  },
  outletName(id?: string): string {
    if (!id) return "-";
    return getStore().getState().outlets.find((o) => o.id === id)?.name ?? "-";
  },
  employeeName(id?: string): string {
    if (!id) return "-";
    return getStore().getState().employees.find((e) => e.id === id)?.fullName ?? "-";
  },
};
