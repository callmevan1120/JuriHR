// ============================================================
// JURI HR — TypeScript Data Models
// Central type definitions for the entire HR domain.
// ============================================================

/** Status umum untuk record dengan soft delete. */
export type RecordStatus = "active" | "inactive" | "archived";

/** Format ISO date string (YYYY-MM-DD) atau ISO datetime. */
export type ISODate = string;

// ------------------------------------------------------------
// Master: Posisi, Divisi, Outlet
// ------------------------------------------------------------

export interface Position {
  id: string;
  code: string;
  name: string;
  category: "OUTLET" | "NON_OUTLET";
  /** Default gaji dasar (Rupiah) bila gaji bulanan. */
  defaultMonthlySalary: number;
  /** Default gaji harian (Rupiah). */
  defaultDailySalary: number;
  status: RecordStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
  note?: string;
}

export interface Division {
  id: string;
  code: string;
  name: string;
  category: "OUTLET" | "NON_OUTLET";
  headId?: string; // employee id
  status: RecordStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
  note?: string;
}

export type OutletClassification =
  | "FLAGSHIP"
  | "STANDARD"
  | "EXPRESS"
  | "KIOSK";

export interface Outlet {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  classification: OutletClassification;
  headId?: string; // Kepala Outlet (employee id)
  status: RecordStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
  note?: string;
}

// ------------------------------------------------------------
// Domicile (Domisili Karyawan)
// ------------------------------------------------------------

export type CoordinateSource =
  | "MANUAL"
  | "MAP_PICKER"
  | "ADDRESS_LOOKUP"
  | "OUTLET_BASED";

export interface Domicile {
  id: string;
  employeeId: string;
  address: string;
  province: string;
  city: string; // kota atau kabupaten
  district: string; // kecamatan
  village: string; // kelurahan
  postalCode: string;
  latitude: number;
  longitude: number;
  source: CoordinateSource;
  lastUpdated: ISODate;
  note?: string;
}

// ------------------------------------------------------------
// Kontrak
// ------------------------------------------------------------

export type ContractType =
  | "PROBATION" // masa percobaan
  | "PKWT"
  | "PKWTT"
  | "MAGANG"
  | "HARIAN";

export type ContractStatus =
  | "DRAFT"
  | "AKTIF"
  | "AKAN_BERAKHIR"
  | "BERAKHIR"
  | "DIPERPANJANG"
  | "DITOLAK"
  | "DIBATALKAN";

export type ContractDecision =
  | "PERPANJANG"
  | "TIDAK_DIPERPANJANG"
  | "KONVERSI"
  | "PENDING"
  | "RESIGN"
  | "PHK";

export interface Contract {
  id: string;
  contractNo: string;
  employeeId: string;
  type: ContractType;
  startDate: ISODate;
  endDate: ISODate;
  outletId?: string;
  positionId: string;
  divisionId: string;
  pjHrdId?: string; // Penanggung Jawab HRD
  supervisorId?: string; // Atasan
  status: ContractStatus;
  decision: ContractDecision;
  lastWorkingDate?: ISODate;
  note?: string;
  previousContractId?: string; // referensi kontrak sebelumnya (histori perpanjangan)
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Karyawan
// ------------------------------------------------------------

export type EmployeeCategory = "OUTLET" | "NON_OUTLET";
export type EmployeeStatus = "AKTIF" | "NONAKTIF" | "RESIGN";
export type SalaryType = "HARIAN" | "BULANAN";

export interface Employee {
  id: string;
  nik: string;
  fullName: string;
  phone: string;
  email: string;
  startDate: ISODate; // tanggal mulai bekerja
  category: EmployeeCategory;
  positionId: string;
  divisionId: string;
  primaryOutletId?: string;
  status: EmployeeStatus;
  salaryType: SalaryType;
  salaryAmount: number; // nominal gaji
  shiftGroupId?: string;
  holidayGroupId?: string;
  leaveBalanceDays: number; // saldo cuti
  supervisorId?: string; // atasan
  photoUrl?: string;
  note?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Shift & Jadwal
// ------------------------------------------------------------

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  toleranceLateMinutes: number; // default 5
  crossesMidnight: boolean;
  color: string;
  status: RecordStatus;
  phConfig: {
    /** Apakah shift ini dihitung sebagai PH (Partial Holiday) saat hari libur. */
    isPH: boolean;
    /** Faktor pengali saat PH. */
    multiplier?: number;
  };
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type WeeklyPatternDay = {
  day: number; // 0 = Minggu ... 6 = Sabtu
  shiftTemplateId?: string; // undefined = libur
};

export interface ShiftGroup {
  id: string;
  name: string;
  scopeType: "OUTLET" | "DIVISI";
  scopeId?: string;
  weeklyPattern: WeeklyPatternDay[];
  memberIds: string[]; // employee ids
  effectiveFrom: ISODate;
  effectiveUntil?: ISODate;
  status: RecordStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Schedule {
  id: string;
  employeeId: string;
  date: ISODate;
  outletId?: string;
  shiftTemplateId?: string; // undefined = libur
  shiftGroupId?: string;
  source: "SHIFT_GROUP" | "MANUAL" | "SWAP";
  note?: string;
  locked: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Holiday
// ------------------------------------------------------------

export type HolidayType =
  | "NASIONAL"
  | "KEAGAMAAN"
  | "PERUSAHAAN"
  | "ADDITIONAL"
  | "CANCELLED";

export interface Holiday {
  id: string;
  name: string;
  date: ISODate;
  type: HolidayType;
  description?: string;
}

export interface HolidayGroup {
  id: string;
  name: string;
  description?: string;
  memberIds: string[]; // employee ids
  holidayIds: string[];
  effectiveFrom: ISODate;
  effectiveUntil?: ISODate;
  status: RecordStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Pengajuan & Tukar Shift
// ------------------------------------------------------------

export type ShiftSwapType =
  | "TUKAR_DUA_KARYAWAN" // dua karyawan bertukar shift
  | "PINDAH_SATU_KARYAWAN" // pemindahan satu karyawan ke shift lain
  | "PERTUKARAN_HARI_KERJA" // pertukaran hari kerja
  | "ANTAR_OUTLET"; // pertukaran antar outlet

export type ShiftSwapStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface ShiftSwapRequest {
  id: string;
  requestNo: string;
  type: ShiftSwapType;
  /** Karyawan pengaju. */
  requesterId: string;
  /** Untuk TUKAR_DUA_KARYAWAN: karyawan lawan tukar. */
  counterpartId?: string;
  /** Tanggal sumber (milik requester). */
  sourceDate: ISODate;
  sourceShiftTemplateId?: string;
  sourceOutletId?: string;
  /** Tanggal target (milik counterpart atau target baru). */
  targetDate: ISODate;
  targetShiftTemplateId?: string;
  targetOutletId?: string;
  reason: string;
  status: ShiftSwapStatus;
  approverId?: string;
  approvalNote?: string;
  originalSubmitterId: string;
  /** Preview dampak (computed, bukan persisten). */
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Holiday Override (Tukar Libur / Workday Override)
// ------------------------------------------------------------

export type HolidayOverrideType =
  | "HOLIDAY_SWAP" // karyawan bekerja di hari libur & mengganti ke hari lain
  | "WORKDAY_OVERRIDE" // hari kerja di-override menjadi libur untuk karyawan tertentu
  | "ADDITIONAL_HOLIDAY" // libur tambahan khusus karyawan
  | "CANCELLED_HOLIDAY" // libur dibatalkan untuk karyawan tertentu
  | "EMPLOYEE_SPECIFIC"; // override khusus per karyawan

export interface HolidayOverride {
  id: string;
  holidayGroupId: string;
  type: HolidayOverrideType;
  /** Karyawan yang terdampak (kosong = seluruh anggota grup). */
  employeeIds: string[];
  /** Tanggal libur asli (untuk HOLIDAY_SWAP / CANCELLED_HOLIDAY). */
  originalHolidayDate?: ISODate;
  /** Tanggal pengganti (untuk HOLIDAY_SWAP / WORKDAY_OVERRIDE / ADDITIONAL_HOLIDAY). */
  replacementDate?: ISODate;
  reason: string;
  status: RecordStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Absensi
// ------------------------------------------------------------

export type AttendanceStatus =
  | "HADIR"
  | "TERLAMBAT"
  | "TIDAK_HADIR"
  | "CUTI"
  | "IZIN"
  | "SAKIT"
  | "LIBUR"
  | "PH";

export interface Attendance {
  id: string;
  employeeId: string;
  date: ISODate;
  outletId?: string;
  shiftTemplateId?: string;
  checkIn?: string; // datetime
  checkOut?: string; // datetime
  status: AttendanceStatus;
  lateMinutes: number;
  deduction: number; // potongan Rupiah
  note?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Cuti / Izin / Sakit
// ------------------------------------------------------------

export type LeaveType = "CUTI" | "IZIN" | "SAKIT";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: ISODate;
  endDate: ISODate;
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  approvalNote?: string;
  approverId?: string;
  /** Pengaju asli (bisa atasan/HRD yang mengajukan untuk karyawan). */
  originalSubmitterId: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Lembur
// ------------------------------------------------------------

export type OvertimeCategory = "OUTLET" | "NON_OUTLET";
export type OvertimeApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
export type OvertimeVerificationStatus =
  | "BELUM_DIISI"
  | "DIISI"
  | "TERVERIFIKASI"
  | "DITOLAK";

export interface OvertimePlanning {
  id: string;
  requestNo: string;
  originalSubmitterId: string;
  category: OvertimeCategory;
  outletId?: string;
  divisionId?: string;
  shiftOrTeam?: string;
  employeeIds: string[];
  date: ISODate;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  durationMinutes: number;
  reason: string;
  workDescription: string;
  picId?: string; // Penanggung Jawab
  status: OvertimeApprovalStatus;
  approverId?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface OvertimeActual {
  id: string;
  planningId?: string; // bisa null => lembur tanpa planning (anomali)
  employeeId: string;
  date: ISODate;
  actualStart?: string;
  actualEnd?: string;
  actualDurationMinutes?: number;
  timeSource?: "MANUAL" | "SYSTEM" | "APPROVER";
  workResult?: string;
  evidenceUrl?: string;
  planningDiffMinutes?: number; // selisih planning vs actual
  diffReason?: string;
  verifierId?: string;
  verificationStatus: OvertimeVerificationStatus;
  rate: number; // rate per jam
  estimatedNominal: number;
  note?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Payroll
// ------------------------------------------------------------

export type PayrollStatus = "DRAFT" | "REVIEWED" | "FINALIZED";

export interface PayrollComponent {
  label: string;
  type: "ADDITION" | "DEDUCTION";
  amount: number;
  note?: string;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  period: string; // "YYYY-MM"
  baseSalary: number;
  phCount: number;
  phDeduction: number;
  overtimeAmount: number; // dari lembur terverifikasi
  additions: PayrollComponent[];
  deductions: PayrollComponent[];
  lateDeduction: number;
  absenceDeduction: number;
  total: number;
  status: PayrollStatus;
  note?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ------------------------------------------------------------
// Notification & Audit
// ------------------------------------------------------------

export type NotificationCategory =
  | "KONTRAK"
  | "JADWAL"
  | "TUKAR_SHIFT"
  | "TUKAR_LIBUR"
  | "LEMBUR"
  | "ABSENSI"
  | "CUTI"
  | "PAYROLL"
  | "DOMISILI"
  | "ANOMALI";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  createdAt: ISODate;
  /** Deep link route (hash). */
  link?: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  module: string;
  action: string;
  before?: unknown;
  after?: unknown;
  description: string;
  createdAt: ISODate;
}

// ------------------------------------------------------------
// Histori perubahan (generic)
// ------------------------------------------------------------

export interface ChangeHistoryEntry {
  id: string;
  entityType:
    | "EMPLOYEE"
    | "POSITION"
    | "DIVISION"
    | "OUTLET"
    | "DOMICILE"
    | "CONTRACT"
    | "SALARY"
    | "SHIFT_GROUP"
    | "HOLIDAY_GROUP"
    | "STATUS";
  entityId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: ISODate;
  reason?: string;
}

// ------------------------------------------------------------
// Dashboard aggregates
// ------------------------------------------------------------

export interface DashboardStats {
  totalActiveEmployees: number;
  totalOutlets: number;
  presentToday: number;
  lateToday: number;
  notPresentYet: number;
  pendingSubmissions: number;
  expiringContracts: number;
  overtimeAwaitingReview: number;
  payrollNeedsReview: number;
}

export interface AttendanceTrendPoint {
  date: string; // label
  hadir: number;
  terlambat: number;
  tidakHadir: number;
}

export interface OutletDistributionPoint {
  outletName: string;
  employees: number;
}

export interface ContractStatusPoint {
  status: ContractStatus;
  count: number;
}

export interface OvertimePlanVsActualPoint {
  date: string;
  planning: number;
  actual: number;
}

export interface RecentActivity {
  id: string;
  module: string;
  action: string;
  description: string;
  actor: string;
  createdAt: ISODate;
}
