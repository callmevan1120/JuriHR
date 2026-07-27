// ============================================================
// JURI HR — Central Data Store
// Singleton in-memory store. Single source of truth untuk prototype.
// Mendukung subscribe/notify agar UI reaktif terhadap perubahan.
// ============================================================
import * as seed from "./seed";
import type {
  AppNotification,
  Attendance,
  AuditLog,
  ChangeHistoryEntry,
  Contract,
  Division,
  Domicile,
  Employee,
  Holiday,
  HolidayGroup,
  HolidayOverride,
  Leave,
  OvertimeActual,
  OvertimePlanning,
  Outlet,
  PayrollEntry,
  Position,
  Schedule,
  ShiftGroup,
  ShiftSwapRequest,
  ShiftTemplate,
} from "@/lib/types";

export interface DataState {
  positions: Position[];
  divisions: Division[];
  outlets: Outlet[];
  employees: Employee[];
  domiciles: Domicile[];
  contracts: Contract[];
  shiftTemplates: ShiftTemplate[];
  shiftGroups: ShiftGroup[];
  schedules: Schedule[];
  holidays: Holiday[];
  holidayGroups: HolidayGroup[];
  holidayOverrides: HolidayOverride[];
  shiftSwaps: ShiftSwapRequest[];
  attendances: Attendance[];
  leaves: Leave[];
  overtimePlannings: OvertimePlanning[];
  overtimeActuals: OvertimeActual[];
  payrolls: PayrollEntry[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  changeHistories: ChangeHistoryEntry[];
}

type Listener = () => void;

function createInitialState(): DataState {
  // Deep clone seed agar mutasi tidak mempengaruhi modul seed.
  return structuredClone({
    positions: seed.positions,
    divisions: seed.divisions,
    outlets: seed.outlets,
    employees: seed.employees,
    domiciles: seed.domiciles,
    contracts: seed.contracts,
    shiftTemplates: seed.shiftTemplates,
    shiftGroups: seed.shiftGroups,
    schedules: seed.schedules,
    holidays: seed.holidays,
    holidayGroups: seed.holidayGroups,
    holidayOverrides: seed.holidayOverrides,
    shiftSwaps: seed.shiftSwaps,
    attendances: seed.attendances,
    leaves: seed.leaves,
    overtimePlannings: seed.overtimePlannings,
    overtimeActuals: seed.overtimeActuals,
    payrolls: seed.payrolls,
    notifications: seed.notifications,
    auditLogs: seed.auditLogs,
    changeHistories: seed.changeHistories,
  });
}

class DataStore {
  private state: DataState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = createInitialState();
  }

  /** Snapshot state saat ini (referensi — jangan mutasi langsung). */
  getState(): DataState {
    return this.state;
  }

  /** Update state sebagian & notify listeners. */
  setState(patch: Partial<DataState>): void {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  /** Update satu koleksi array. */
  setCollection<K extends keyof DataState>(key: K, value: DataState[K]): void {
    this.state = { ...this.state, [key]: value };
    this.notify();
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  /** Reset ke seed (untuk demo / testing). */
  reset(): void {
    this.state = createInitialState();
    this.notify();
  }
}

// Singleton — satu instance untuk seluruh aplikasi (client-side).
let _store: DataStore | null = null;

export function getStore(): DataStore {
  if (!_store) {
    _store = new DataStore();
  }
  return _store;
}
