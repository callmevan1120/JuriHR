// ============================================================
// JURI HR — Mock Seed Data
// Single source of truth for the prototype.
// Bisnis: JURI Bun — bakery & coffee bun multi-outlet (Jabodetabek).
// ============================================================
import type {
  AuditLog,
  AppNotification,
  Attendance,
  ChangeHistoryEntry,
  Contract,
  ContractStatus,
  ContractType,
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
import {
  addDaysISO,
  daysBetween,
  todayISODate,
} from "@/lib/utils";

// Deterministic pseudo-random agar data stabil antar render.
let _seed = 20250114;
function rng(): number {
  // LCG sederhana
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const NOW = new Date().toISOString();
const TODAY = todayISODate();

// ------------------------------------------------------------
// Posisi
// ------------------------------------------------------------
export const positions: Position[] = [
  {
    id: "pos-kepala-outlet",
    code: "KO",
    name: "Kepala Outlet",
    category: "OUTLET",
    defaultMonthlySalary: 6500000,
    defaultDailySalary: 0,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-spv-outlet",
    code: "SPO",
    name: "Supervisor Outlet",
    category: "OUTLET",
    defaultMonthlySalary: 5200000,
    defaultDailySalary: 0,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-barista",
    code: "BAR",
    name: "Barista",
    category: "OUTLET",
    defaultMonthlySalary: 4200000,
    defaultDailySalary: 180000,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-kasir",
    code: "KAS",
    name: "Kasir",
    category: "OUTLET",
    defaultMonthlySalary: 4000000,
    defaultDailySalary: 170000,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-baker",
    code: "BAK",
    name: "Baker",
    category: "OUTLET",
    defaultMonthlySalary: 4500000,
    defaultDailySalary: 190000,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-pramusaji",
    code: "PRM",
    name: "Pramusaji",
    category: "OUTLET",
    defaultMonthlySalary: 3800000,
    defaultDailySalary: 165000,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-crew-produksi",
    code: "CRP",
    name: "Crew Produksi",
    category: "NON_OUTLET",
    defaultMonthlySalary: 4300000,
    defaultDailySalary: 185000,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-spv-produksi",
    code: "SPP",
    name: "Supervisor Produksi",
    category: "NON_OUTLET",
    defaultMonthlySalary: 5800000,
    defaultDailySalary: 0,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-qc-staff",
    code: "QC",
    name: "QC Staff",
    category: "NON_OUTLET",
    defaultMonthlySalary: 5000000,
    defaultDailySalary: 0,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-marketing-staff",
    code: "MKT",
    name: "Marketing Staff",
    category: "NON_OUTLET",
    defaultMonthlySalary: 5500000,
    defaultDailySalary: 0,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-hr-staff",
    code: "HR",
    name: "HR Staff",
    category: "NON_OUTLET",
    defaultMonthlySalary: 5800000,
    defaultDailySalary: 0,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "pos-finance-staff",
    code: "FIN",
    name: "Finance Staff",
    category: "NON_OUTLET",
    defaultMonthlySalary: 6000000,
    defaultDailySalary: 0,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ------------------------------------------------------------
// Divisi
// ------------------------------------------------------------
export const divisions: Division[] = [
  {
    id: "div-operasional",
    code: "OPS",
    name: "Operasional Outlet",
    category: "OUTLET",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "div-produksi",
    code: "PRD",
    name: "Produksi",
    category: "NON_OUTLET",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "div-qc",
    code: "QCD",
    name: "Quality Control",
    category: "NON_OUTLET",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "div-marketing",
    code: "MKG",
    name: "Marketing",
    category: "NON_OUTLET",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "div-hrd",
    code: "HRD",
    name: "HRD & General Affairs",
    category: "NON_OUTLET",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "div-finance",
    code: "FIN",
    name: "Finance & Accounting",
    category: "NON_OUTLET",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ------------------------------------------------------------
// Outlet (Jabodetabek)
// ------------------------------------------------------------
export const outlets: Outlet[] = [
  {
    id: "out-sudirman",
    code: "JBD-SDR",
    name: "JURI Bun — Sudirman",
    address: "Jl. Jend. Sudirman Kav. 28, Jakarta Pusat",
    latitude: -6.1957,
    longitude: 106.8232,
    geofenceRadiusMeters: 120,
    classification: "FLAGSHIP",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "out-kemang",
    code: "JBD-KMG",
    name: "JURI Bun — Kemang",
    address: "Jl. Kemang Raya No. 8, Jakarta Selatan",
    latitude: -6.2621,
    longitude: 106.8135,
    geofenceRadiusMeters: 100,
    classification: "STANDARD",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "out-pondok-indah",
    code: "JBD-PI",
    name: "JURI Bun — Pondok Indah",
    address: "Jl. Metro Pondok Indah, Jakarta Selatan",
    latitude: -6.2654,
    longitude: 106.7846,
    geofenceRadiusMeters: 100,
    classification: "STANDARD",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "out-kelapa-gading",
    code: "JBD-KG",
    name: "JURI Bun — Kelapa Gading",
    address: "Jl. Boulevard Raya, Jakarta Utara",
    latitude: -6.1588,
    longitude: 106.9064,
    geofenceRadiusMeters: 110,
    classification: "STANDARD",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "out-bekasi",
    code: "BKS-SCT",
    name: "JURI Bun — Summarecon Bekasi",
    address: "Jl. Boulevard Summarecon, Bekasi",
    latitude: -6.2241,
    longitude: 106.9847,
    geofenceRadiusMeters: 110,
    classification: "STANDARD",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "out-tangerang",
    code: "TGR-SDC",
    name: "JURI Bun — Serpong Digital Center",
    address: "Jl. Boulevard Gading Serpong, Tangerang",
    latitude: -6.2383,
    longitude: 106.6299,
    geofenceRadiusMeters: 100,
    classification: "STANDARD",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "out-depok",
    code: "DPK-MRG",
    name: "JURI Bun — Margonda Depok",
    address: "Jl. Margonda Raya, Depok",
    latitude: -6.3694,
    longitude: 106.8286,
    geofenceRadiusMeters: 90,
    classification: "EXPRESS",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "out-bogor",
    code: "BGR-BTM",
    name: "JURI Bun — Botani Square Bogor",
    address: "Jl. Raya Pajajaran, Bogor",
    latitude: -6.5971,
    longitude: 106.806,
    geofenceRadiusMeters: 90,
    classification: "EXPRESS",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "out-kp-damai",
    code: "JBD-KPD",
    name: "JURI Bun — Kebon Jeruk Kiosk",
    address: "Jl. Meruya Ilir, Jakarta Barat",
    latitude: -6.1969,
    longitude: 106.759,
    geofenceRadiusMeters: 70,
    classification: "KIOSK",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ------------------------------------------------------------
// Shift Template
// ------------------------------------------------------------
export const shiftTemplates: ShiftTemplate[] = [
  {
    id: "shift-pagi",
    name: "Shift Pagi",
    startTime: "07:00",
    endTime: "15:00",
    toleranceLateMinutes: 5,
    crossesMidnight: false,
    color: "#FCBA0C",
    status: "active",
    phConfig: { isPH: false },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "shift-siang",
    name: "Shift Siang",
    startTime: "13:00",
    endTime: "21:00",
    toleranceLateMinutes: 5,
    crossesMidnight: false,
    color: "#E8A604",
    status: "active",
    phConfig: { isPH: false },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "shift-malam",
    name: "Shift Malam (Produksi)",
    startTime: "22:00",
    endTime: "06:00",
    toleranceLateMinutes: 5,
    crossesMidnight: true,
    color: "#3A2518",
    status: "active",
    phConfig: { isPH: true, multiplier: 2 },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "shift-produksi-pagi",
    name: "Shift Produksi Pagi",
    startTime: "06:00",
    endTime: "14:00",
    toleranceLateMinutes: 5,
    crossesMidnight: false,
    color: "#C2780C",
    status: "active",
    phConfig: { isPH: false },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "shift-office",
    name: "Shift Office (HQ)",
    startTime: "09:00",
    endTime: "17:00",
    toleranceLateMinutes: 10,
    crossesMidnight: false,
    color: "#74665D",
    status: "active",
    phConfig: { isPH: false },
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ------------------------------------------------------------
// Shift Group
// ------------------------------------------------------------
export const shiftGroups: ShiftGroup[] = [
  {
    id: "sg-outlet-5day",
    name: "Outlet 5 Hari (Sen–Jum)",
    scopeType: "OUTLET",
    weeklyPattern: [
      { day: 0 },
      { day: 1, shiftTemplateId: "shift-pagi" },
      { day: 2, shiftTemplateId: "shift-pagi" },
      { day: 3, shiftTemplateId: "shift-pagi" },
      { day: 4, shiftTemplateId: "shift-pagi" },
      { day: 5, shiftTemplateId: "shift-pagi" },
      { day: 6 },
    ],
    memberIds: [],
    effectiveFrom: addDaysISO(TODAY, -180),
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "sg-produksi",
    name: "Produksi 2 Shift",
    scopeType: "DIVISI",
    scopeId: "div-produksi",
    weeklyPattern: [
      { day: 0, shiftTemplateId: "shift-produksi-pagi" },
      { day: 1, shiftTemplateId: "shift-produksi-pagi" },
      { day: 2, shiftTemplateId: "shift-produksi-pagi" },
      { day: 3, shiftTemplateId: "shift-produksi-pagi" },
      { day: 4, shiftTemplateId: "shift-produksi-pagi" },
      { day: 5, shiftTemplateId: "shift-produksi-pagi" },
      { day: 0, shiftTemplateId: "shift-malam" },
    ],
    memberIds: [],
    effectiveFrom: addDaysISO(TODAY, -180),
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "sg-office",
    name: "Office HQ (Sen–Jum)",
    scopeType: "DIVISI",
    scopeId: "div-hrd",
    weeklyPattern: [
      { day: 0 },
      { day: 1, shiftTemplateId: "shift-office" },
      { day: 2, shiftTemplateId: "shift-office" },
      { day: 3, shiftTemplateId: "shift-office" },
      { day: 4, shiftTemplateId: "shift-office" },
      { day: 5, shiftTemplateId: "shift-office" },
      { day: 6 },
    ],
    memberIds: [],
    effectiveFrom: addDaysISO(TODAY, -180),
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ------------------------------------------------------------
// Holiday & Holiday Group
// ------------------------------------------------------------
export const holidays: Holiday[] = [
  {
    id: "hol-newyear",
    name: "Tahun Baru Masehi",
    date: `${TODAY.slice(0, 4)}-01-01`,
    type: "NASIONAL",
  },
  {
    id: "hol-kemerdekaan",
    name: "Hari Kemerdekaan RI",
    date: `${TODAY.slice(0, 4)}-08-17`,
    type: "NASIONAL",
  },
  {
    id: "hol-ultah-perusahaan",
    name: "Hari Ulang Tahun JURI Bun",
    date: addDaysISO(TODAY, 20),
    type: "PERUSAHAAN",
    description: "Libur perusahaan tahunan",
  },
  {
    id: "hol-isra-miraj",
    name: "Isra Mikraj",
    date: addDaysISO(TODAY, -8),
    type: "KEAGAMAAN",
  },
];

export const holidayGroups: HolidayGroup[] = [
  {
    id: "hg-all",
    name: "Holiday Group Seluruh Karyawan",
    description: "Berlaku untuk seluruh karyawan aktif",
    memberIds: [],
    holidayIds: ["hol-newyear", "hol-kemerdekaan", "hol-ultah-perusahaan"],
    effectiveFrom: `${TODAY.slice(0, 4)}-01-01`,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "hg-produksi",
    name: "Holiday Group Produksi",
    description: "Libur alternatif untuk tim produksi",
    memberIds: [],
    holidayIds: ["hol-newyear", "hol-kemerdekaan", "hol-isra-miraj"],
    effectiveFrom: `${TODAY.slice(0, 4)}-01-01`,
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ------------------------------------------------------------
// Karyawan + Domicile + Kontrak (di-generate konsisten)
// ------------------------------------------------------------

const firstNames = [
  "Andi", "Budi", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hadi",
  "Indah", "Joko", "Kartika", "Lukman", "Maya", "Nanda", "Oki",
  "Putri", "Rizky", "Sari", "Tono", "Umar", "Vina", "Wawan", "Yuni",
  "Zaki", "Bagus", "Rina", "Hendra", "Lina", "Ferry", "Sinta",
  "Dian", "Rudi", "Tika", "Yoga", "Wati", "Galih", "Nia", "Bayu",
  "Meta", "Yusuf", "Ayu", "Dito", "Krisna", "Rahma", "Surya",
];
const lastNames = [
  "Pratama", "Wijaya", "Saputra", "Lestari", "Hidayat", "Maulana",
  "Anggraini", "Setiawan", "Nugroho", "Permata", "Kusuma", "Ramadhan",
  "Halim", "Susanto", "Wibowo", "Fauziah", "Rahmat", "Santoso",
];

interface EmployeeSeed {
  nik: string;
  fullName: string;
  positionId: string;
  divisionId: string;
  primaryOutletId?: string;
  category: "OUTLET" | "NON_OUTLET";
  salaryType: "HARIAN" | "BULANAN";
  salaryAmount: number;
  startDate: string;
  contractEndOffsetDays: number; // relatif terhadap hari ini
  contractType: ContractType;
  status: "AKTIF" | "NONAKTIF" | "RESIGN";
  leaveBalanceDays: number;
  domLat: number;
  domLon: number;
  domCity: string;
  domProvince: string;
}

// Helper untuk membuat config karyawan per outlet
function outletStaff(
  outletId: string,
  baseLat: number,
  baseLon: number,
  city: string,
  province: string,
  startIdx: number,
): EmployeeSeed[] {
  const positions = ["pos-kepala-outlet", "pos-spv-outlet", "pos-barista", "pos-kasir", "pos-baker", "pos-pramusaji"];
  const list: EmployeeSeed[] = [];
  for (let i = 0; i < positions.length; i++) {
    const posId = positions[i]!;
    const pos = positions.find((p) => p === posId)!;
    const posObj = positionsList.find((p) => p.id === posId)!;
    const isKepala = posId === "pos-kepala-outlet";
    const isSpv = posId === "pos-spv-outlet";
    // Jarak domisili acak 1-25km dari outlet
    const distKm = randInt(2, 24);
    const angle = rng() * 2 * Math.PI;
    const dLat = (distKm / 111) * Math.cos(angle);
    const dLon = (distKm / (111 * Math.cos((baseLat * Math.PI) / 180))) * Math.sin(angle);
    const salaryType = isKepala || isSpv ? "BULANAN" : pick(["HARIAN", "BULANAN", "HARIAN"] as const);
    const fn = firstNames[(startIdx + i) % firstNames.length]!;
    const ln = lastNames[(startIdx + i * 3) % lastNames.length]!;
    list.push({
      nik: `JBD${String(1000 + startIdx + i).padStart(5, "0")}`,
      fullName: `${fn} ${ln}`,
      positionId: posId,
      divisionId: "div-operasional",
      primaryOutletId: outletId,
      category: "OUTLET",
      salaryType,
      salaryAmount: salaryType === "BULANAN" ? posObj.defaultMonthlySalary : posObj.defaultDailySalary,
      startDate: addDaysISO(TODAY, -randInt(120, 720)),
      contractEndOffsetDays: pick([90, 88, 62, 60, 45, 31, 28, 15, 14, 8, 6, 3, 1, -5, 200, 320]),
      contractType: isKepala ? "PKWTT" : pick(["PKWT", "PKWT", "PROBATION", "HARIAN"] as ContractType[]),
      status: i === 5 && rng() > 0.6 ? "NONAKTIF" : "AKTIF",
      leaveBalanceDays: randInt(3, 12),
      domLat: baseLat + dLat,
      domLon: baseLon + dLon,
      domCity: city,
      domProvince: province,
    });
  }
  return list;
}

const positionsList = positions;

const seedConfigs: EmployeeSeed[] = [
  ...outletStaff("out-sudirman", -6.1957, 106.8232, "Jakarta Pusat", "DKI Jakarta", 0),
  ...outletStaff("out-kemang", -6.2621, 106.8135, "Jakarta Selatan", "DKI Jakarta", 6),
  ...outletStaff("out-pondok-indah", -6.2654, 106.7846, "Jakarta Selatan", "DKI Jakarta", 12),
  ...outletStaff("out-kelapa-gading", -6.1588, 106.9064, "Jakarta Utara", "DKI Jakarta", 18),
  ...outletStaff("out-bekasi", -6.2241, 106.9847, "Bekasi", "Jawa Barat", 24),
  ...outletStaff("out-tangerang", -6.2383, 106.6299, "Tangerang", "Banten", 30),
  ...outletStaff("out-depok", -6.3694, 106.8286, "Depok", "Jawa Barat", 36),
  ...outletStaff("out-bogor", -6.5971, 106.806, "Bogor", "Jawa Barat", 42),
  // HQ staff (NON_OUTLET)
  ...hqStaff(),
];

function hqStaff(): EmployeeSeed[] {
  const cfgs: { positionId: string; divisionId: string; salary: number }[] = [
    { positionId: "pos-spv-produksi", divisionId: "div-produksi", salary: 5800000 },
    { positionId: "pos-crew-produksi", divisionId: "div-produksi", salary: 4300000 },
    { positionId: "pos-crew-produksi", divisionId: "div-produksi", salary: 4300000 },
    { positionId: "pos-qc-staff", divisionId: "div-qc", salary: 5000000 },
    { positionId: "pos-marketing-staff", divisionId: "div-marketing", salary: 5500000 },
    { positionId: "pos-hr-staff", divisionId: "div-hrd", salary: 5800000 },
    { positionId: "pos-hr-staff", divisionId: "div-hrd", salary: 5800000 },
    { positionId: "pos-finance-staff", divisionId: "div-finance", salary: 6000000 },
  ];
  return cfgs.map((c, i) => {
    const fn = firstNames[(48 + i) % firstNames.length]!;
    const ln = lastNames[(i * 5) % lastNames.length]!;
    return {
      nik: `HQ${String(2000 + i).padStart(5, "0")}`,
      fullName: `${fn} ${ln}`,
      positionId: c.positionId,
      divisionId: c.divisionId,
      category: "NON_OUTLET",
      salaryType: "BULANAN",
      salaryAmount: c.salary,
      startDate: addDaysISO(TODAY, -randInt(200, 900)),
      contractEndOffsetDays: pick([90, 60, 30, 14, 7, 3, 1, 180, 365, -10] as number[]),
      contractType: "PKWTT",
      status: "AKTIF",
      leaveBalanceDays: randInt(5, 12),
      domLat: -6.2 + (rng() - 0.5) * 0.4,
      domLon: 106.8 + (rng() - 0.5) * 0.4,
      domCity: pick(["Jakarta Selatan", "Jakarta Barat", "Jakarta Timur", "Depok"]),
      domProvince: "DKI Jakarta",
    } satisfies EmployeeSeed;
  });
}

// ------------------------------------------------------------
// Bangun Employee, Domicile, Contract
// ------------------------------------------------------------

export const employees: Employee[] = [];
export const domiciles: Domicile[] = [];
export const contracts: Contract[] = [];
export const changeHistories: ChangeHistoryEntry[] = [];

seedConfigs.forEach((cfg, idx) => {
  const empId = `emp-${String(idx + 1).padStart(3, "0")}`;
  const nowMinusStart = cfg.startDate;
  const contractEnd = addDaysISO(TODAY, cfg.contractEndOffsetDays);

  const outletPosition = positions.find((p) => p.id === cfg.positionId)!;

  employees.push({
    id: empId,
    nik: cfg.nik,
    fullName: cfg.fullName,
    phone: `08${randInt(11, 89)}${String(randInt(10000000, 99999999))}`,
    email: `${cfg.fullName.toLowerCase().replace(/\s+/g, ".")}@juribun.co.id`,
    startDate: cfg.startDate,
    category: cfg.category,
    positionId: cfg.positionId,
    divisionId: cfg.divisionId,
    primaryOutletId: cfg.primaryOutletId,
    status: cfg.status,
    salaryType: cfg.salaryType,
    salaryAmount: cfg.salaryAmount,
    shiftGroupId: cfg.category === "OUTLET" ? "sg-outlet-5day" : cfg.divisionId === "div-produksi" ? "sg-produksi" : "sg-office",
    holidayGroupId: cfg.divisionId === "div-produksi" ? "hg-produksi" : "hg-all",
    leaveBalanceDays: cfg.leaveBalanceDays,
    supervisorId: undefined,
    photoUrl: undefined,
    note: undefined,
    createdAt: nowMinusStart,
    updatedAt: NOW,
  });

  domiciles.push({
    id: `dom-${empId}`,
    employeeId: empId,
    address: `Jl. ${pick(["Melati", "Mawar", "Anggrek", "Cempaka", "Kenanga", "Flamboyan", "Seroja"])} No. ${randInt(1, 120)}`,
    province: cfg.domProvince,
    city: cfg.domCity,
    district: pick(["Cilandak", "Kebayoran", "Mampang", "Pasar Minggu", "Pondok Aren", "Cipinang", "Jatinegara"]),
    village: pick(["Kel. A", "Kel. B", "Kel. C", "Kel. D"]),
    postalCode: String(randInt(12000, 16999)),
    latitude: cfg.domLat,
    longitude: cfg.domLon,
    source: pick(["MAP_PICKER", "ADDRESS_LOOKUP", "MANUAL"] as const),
    lastUpdated: NOW,
  });

  // Status kontrak berdasarkan offset
  let contractStatus: ContractStatus = "AKTIF";
  const remaining = daysBetween(TODAY, contractEnd);
  if (remaining < 0) contractStatus = "BERAKHIR";
  else if (remaining <= 90) contractStatus = "AKAN_BERAKHIR";

  contracts.push({
    id: `ctr-${empId}`,
    contractNo: `CTR/${TODAY.slice(0, 4)}/${String(idx + 1).padStart(4, "0")}`,
    employeeId: empId,
    type: cfg.contractType,
    startDate: cfg.startDate,
    endDate: contractEnd,
    outletId: cfg.primaryOutletId,
    positionId: cfg.positionId,
    divisionId: cfg.divisionId,
    pjHrdId: "emp-hrd-1",
    supervisorId: undefined,
    status: contractStatus,
    decision: "PENDING",
    lastWorkingDate: remaining < 0 ? addDaysISO(contractEnd, -1) : undefined,
    note: undefined,
    createdAt: cfg.startDate,
    updatedAt: NOW,
  });

  // Histori perubahan contoh (gaji) untuk beberapa karyawan
  if (idx % 7 === 0) {
    changeHistories.push({
      id: `hist-${empId}-salary`,
      entityType: "SALARY",
      entityId: empId,
      field: "salaryAmount",
      oldValue: String(Math.round(cfg.salaryAmount * 0.9)),
      newValue: String(cfg.salaryAmount),
      changedBy: "HRD",
      changedAt: addDaysISO(TODAY, -randInt(30, 180)),
      reason: "Kenaikan gaji tahunan",
    });
  }
});

// Set atasan & kepala outlet (supervisor)
employees.forEach((emp) => {
  if (emp.category === "OUTLET" && emp.primaryOutletId) {
    const kepala = employees.find(
      (e) => e.primaryOutletId === emp.primaryOutletId && e.positionId === "pos-kepala-outlet" && e.status === "AKTIF",
    );
    if (kepala && kepala.id !== emp.id) {
      emp.supervisorId = kepala.id;
    }
  }
});

// Set kepala outlet pada outlet
outlets.forEach((o, i) => {
  const kepala = employees.find(
    (e) => e.primaryOutletId === o.id && e.positionId === "pos-kepala-outlet" && e.status === "AKTIF",
  );
  if (kepala) o.headId = kepala.id;
  // alternatif fallback untuk kiosk/express bila tidak ada kepala
  if (!kepala) {
    const spv = employees.find(
      (e) => e.primaryOutletId === o.id && e.positionId === "pos-spv-outlet" && e.status === "AKTIF",
    );
    if (spv) o.headId = spv.id;
  }
});

// Set head divisi
divisions.forEach((d) => {
  const head = employees.find(
    (e) => e.divisionId === d.id && e.status === "AKTIF" && e.category === "NON_OUTLET",
  );
  if (head) d.headId = head.id;
});

// Set PJ HRD pada kontrak (ambil HR staff pertama)
const hrdStaff = employees.find((e) => e.positionId === "pos-hr-staff");
contracts.forEach((c) => {
  c.pjHrdId = hrdStaff?.id;
});

// Isi memberIds shift group & holiday group
shiftGroups.forEach((sg) => {
  if (sg.scopeType === "OUTLET") {
    sg.memberIds = employees.filter((e) => e.shiftGroupId === sg.id).map((e) => e.id);
  } else {
    sg.memberIds = employees.filter((e) => e.shiftGroupId === sg.id).map((e) => e.id);
  }
});
holidayGroups.forEach((hg) => {
  if (hg.id === "hg-all") hg.memberIds = employees.filter((e) => e.status === "AKTIF").map((e) => e.id);
  else hg.memberIds = employees.filter((e) => e.divisionId === "div-produksi" && e.status === "AKTIF").map((e) => e.id);
});

// ------------------------------------------------------------
// Jadwal (Schedule) — 7 hari terakhir sampai hari ini
// ------------------------------------------------------------
export const schedules: Schedule[] = [];
const activeEmps = employees.filter((e) => e.status === "AKTIF");
for (let d = 0; d < 7; d++) {
  const date = addDaysISO(TODAY, d - 6);
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  activeEmps.forEach((emp) => {
    const sg = shiftGroups.find((g) => g.id === emp.shiftGroupId);
    const pattern = sg?.weeklyPattern.find((p) => p.day === dow);
    if (pattern?.shiftTemplateId) {
      schedules.push({
        id: `sch-${emp.id}-${date}`,
        employeeId: emp.id,
        date,
        outletId: emp.primaryOutletId,
        shiftTemplateId: pattern.shiftTemplateId,
        shiftGroupId: sg?.id,
        source: "SHIFT_GROUP",
        locked: d < 6, // hari kemarin dan sebelumnya terkunci
        createdAt: NOW,
        updatedAt: NOW,
      });
    }
  });
}

// ------------------------------------------------------------
// Absensi — 7 hari terakhir (termasuk hari ini sebagian)
// ------------------------------------------------------------
export const attendances: Attendance[] = [];
const LATE_DEDUCTION = 7000;
for (let d = 0; d < 7; d++) {
  const date = addDaysISO(TODAY, d - 6);
  const isToday = d === 6;
  activeEmps.forEach((emp) => {
    const sch = schedules.find((s) => s.employeeId === emp.id && s.date === date);
    if (!sch?.shiftTemplateId) return; // libur
    const r = rng();
    let status: Attendance["status"];
    let lateMinutes = 0;
    let deduction = 0;
    let checkIn: string | undefined;
    let checkOut: string | undefined;

    if (isToday) {
      // Hari ini: sebagian sudah hadir, sebagian belum
      if (r < 0.55) {
        status = r < 0.1 ? "TERLAMBAT" : "HADIR";
        if (status === "TERLAMBAT") {
          lateMinutes = randInt(6, 35);
          deduction = LATE_DEDUCTION;
        }
        checkIn = `${date}T${pad(randInt(6, 9))}:${pad(status === "TERLAMBAT" ? randInt(10, 45) : randInt(55, 59))}:00+07:00`;
      } else {
        // belum hadir
        status = "HADIR"; // masih dianggap hadir tapi belum check-in; ditampilkan sebagai "belum hadir" di dashboard
        return;
      }
    } else {
      // hari lalu
      if (r < 0.84) {
        status = r < 0.18 ? "TERLAMBAT" : "HADIR";
        if (status === "TERLAMBAT") {
          lateMinutes = randInt(6, 40);
          deduction = LATE_DEDUCTION;
        }
        checkIn = `${date}T${pad(randInt(6, 9))}:${pad(status === "TERLAMBAT" ? randInt(10, 45) : randInt(50, 59))}:00+07:00`;
        checkOut = `${date}T${pad(randInt(14, 21))}:${pad(randInt(0, 59))}:00+07:00`;
      } else if (r < 0.9) {
        status = "CUTI";
      } else if (r < 0.94) {
        status = "SAKIT";
      } else if (r < 0.97) {
        status = "IZIN";
      } else {
        status = "TIDAK_HADIR";
      }
    }

    attendances.push({
      id: `att-${emp.id}-${date}`,
      employeeId: emp.id,
      date,
      outletId: emp.primaryOutletId,
      shiftTemplateId: sch.shiftTemplateId,
      checkIn,
      checkOut,
      status,
      lateMinutes,
      deduction,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// ------------------------------------------------------------
// Cuti / Izin / Sakit
// ------------------------------------------------------------
const _leaves: Leave[] = [
  {
    id: "leave-1",
    employeeId: employees[3]?.id ?? "",
    type: "CUTI",
    startDate: addDaysISO(TODAY, 3),
    endDate: addDaysISO(TODAY, 5),
    reason: "Liburan keluarga ke Bandung",
    status: "PENDING",
    originalSubmitterId: employees[3]?.id ?? "",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "leave-2",
    employeeId: employees[10]?.id ?? "",
    type: "SAKIT",
    startDate: addDaysISO(TODAY, -1),
    endDate: TODAY,
    reason: "Demam dan flu",
    attachmentUrl: "simulasi-surat-dokter.pdf",
    status: "PENDING",
    originalSubmitterId: employees[10]?.id ?? "",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "leave-3",
    employeeId: employees[20]?.id ?? "",
    type: "IZIN",
    startDate: addDaysISO(TODAY, 1),
    endDate: addDaysISO(TODAY, 1),
    reason: "Mengurus dokumen perpanjangan KTP",
    status: "APPROVED",
    approverId: hrdStaff?.id,
    approvalNote: "Disetujui, jadwal sudah diatur.",
    originalSubmitterId: employees[20]?.id ?? "",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "leave-4",
    employeeId: employees[30]?.id ?? "",
    type: "CUTI",
    startDate: addDaysISO(TODAY, -3),
    endDate: addDaysISO(TODAY, -1),
    reason: "Acara keluarga",
    status: "APPROVED",
    approverId: hrdStaff?.id,
    approvalNote: "Disetujui.",
    originalSubmitterId: employees[30]?.id ?? "",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "leave-5",
    employeeId: employees[40]?.id ?? "",
    type: "CUTI",
    startDate: addDaysISO(TODAY, 7),
    endDate: addDaysISO(TODAY, 9),
    reason: "Cuti tahunan",
    status: "PENDING",
    originalSubmitterId: employees[40]?.id ?? "",
    createdAt: NOW,
    updatedAt: NOW,
  },
];
export const leaves: Leave[] = _leaves.filter((l) => l.employeeId !== "");

// ------------------------------------------------------------
// Lembur — Planning + Actual
// ------------------------------------------------------------
const _overtimePlannings: OvertimePlanning[] = [
  {
    id: "ot-plan-1",
    requestNo: `OT/${TODAY.slice(0, 4)}/001`,
    originalSubmitterId: hrdStaff?.id ?? "",
    category: "OUTLET",
    outletId: "out-sudirman",
    shiftOrTeam: "Tim Pagi",
    employeeIds: employees.filter((e) => e.primaryOutletId === "out-sudirman" && e.status === "AKTIF").slice(0, 3).map((e) => e.id),
    date: TODAY,
    startTime: "16:00",
    endTime: "20:00",
    durationMinutes: 240,
    reason: "Restock produk menjelang akhir pekan",
    workDescription: "Produksi tambahan coffee bun varian baru",
    picId: outlets[0]?.headId,
    status: "PENDING",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "ot-plan-2",
    requestNo: `OT/${TODAY.slice(0, 4)}/002`,
    originalSubmitterId: hrdStaff?.id ?? "",
    category: "OUTLET",
    outletId: "out-kemang",
    shiftOrTeam: "Tim Siang",
    employeeIds: employees.filter((e) => e.primaryOutletId === "out-kemang" && e.status === "AKTIF").slice(0, 2).map((e) => e.id),
    date: addDaysISO(TODAY, -1),
    startTime: "18:00",
    endTime: "21:00",
    durationMinutes: 180,
    reason: "Persiapan promo weekend",
    workDescription: "Display dan dekorasi outlet",
    picId: outlets[1]?.headId,
    status: "APPROVED",
    approverId: hrdStaff?.id,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "ot-plan-3",
    requestNo: `OT/${TODAY.slice(0, 4)}/003`,
    originalSubmitterId: hrdStaff?.id ?? "",
    category: "NON_OUTLET",
    divisionId: "div-produksi",
    shiftOrTeam: "Shift Produksi",
    employeeIds: employees.filter((e) => e.divisionId === "div-produksi" && e.status === "AKTIF").slice(0, 3).map((e) => e.id),
    date: addDaysISO(TODAY, -2),
    startTime: "05:00",
    endTime: "08:00",
    durationMinutes: 180,
    reason: "Produksi tambahan untuk outlet baru",
    workDescription: "Adonan dan pemanggangan",
    picId: divisions[1]?.headId,
    status: "APPROVED",
    approverId: hrdStaff?.id,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "ot-plan-4",
    requestNo: `OT/${TODAY.slice(0, 4)}/004`,
    originalSubmitterId: hrdStaff?.id ?? "",
    category: "OUTLET",
    outletId: "out-bekasi",
    shiftOrTeam: "Tim Tutup",
    employeeIds: employees.filter((e) => e.primaryOutletId === "out-bekasi" && e.status === "AKTIF").slice(0, 2).map((e) => e.id),
    date: TODAY,
    startTime: "20:00",
    endTime: "23:00",
    durationMinutes: 180,
    reason: "Inventaris akhir bulan",
    workDescription: "Stock opname",
    picId: outlets[4]?.headId,
    status: "PENDING",
    createdAt: NOW,
    updatedAt: NOW,
  },
];
export const overtimePlannings: OvertimePlanning[] = _overtimePlannings.filter((p) => p.employeeIds.length > 0);

const OT_RATE = 25000; // per jam
const _overtimeActuals: OvertimeActual[] = [
  // Actual untuk plan-2 (approved, sudah terjadi kemarin) — terverifikasi
  {
    id: "ot-act-1",
    planningId: "ot-plan-2",
    employeeId: overtimePlannings[1]?.employeeIds[0] ?? "",
    date: overtimePlannings[1]?.date ?? TODAY,
    actualStart: `${overtimePlannings[1]?.date ?? TODAY}T18:10:00+07:00`,
    actualEnd: `${overtimePlannings[1]?.date ?? TODAY}T21:30:00+07:00`,
    actualDurationMinutes: 200,
    timeSource: "SYSTEM",
    workResult: "Display selesai, dekorasi terpasang rapi.",
    evidenceUrl: "simulasi-foto-display.jpg",
    planningDiffMinutes: 20,
    diffReason: "Penyelesaian dekorasi memakan waktu lebih lama.",
    verifierId: hrdStaff?.id,
    verificationStatus: "TERVERIFIKASI",
    rate: OT_RATE,
    estimatedNominal: Math.round((200 / 60) * OT_RATE),
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "ot-act-2",
    planningId: "ot-plan-3",
    employeeId: overtimePlannings[2]?.employeeIds[0] ?? "",
    date: overtimePlannings[2]?.date ?? TODAY,
    actualStart: `${overtimePlannings[2]?.date ?? TODAY}T05:05:00+07:00`,
    actualEnd: `${overtimePlannings[2]?.date ?? TODAY}T07:50:00+07:00`,
    actualDurationMinutes: 165,
    timeSource: "SYSTEM",
    workResult: "Adonan 200 pcs siap panggang.",
    planningDiffMinutes: -15,
    diffReason: "Lebih cepat dari estimasi.",
    verifierId: hrdStaff?.id,
    verificationStatus: "TERVERIFIKASI",
    rate: OT_RATE,
    estimatedNominal: Math.round((165 / 60) * OT_RATE),
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Actual belum diisi (plan-3 employee kedua)
  {
    id: "ot-act-3",
    planningId: "ot-plan-3",
    employeeId: overtimePlannings[2]?.employeeIds[1] ?? "",
    date: overtimePlannings[2]?.date ?? TODAY,
    verificationStatus: "BELUM_DIISI",
    rate: OT_RATE,
    estimatedNominal: 0,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Anomali: lembur tanpa planning
  {
    id: "ot-act-4",
    planningId: undefined,
    employeeId: employees.filter((e) => e.primaryOutletId === "out-pondok-indah" && e.status === "AKTIF")[0]?.id ?? "",
    date: addDaysISO(TODAY, -1),
    actualStart: `${addDaysISO(TODAY, -1)}T19:00:00+07:00`,
    actualEnd: `${addDaysISO(TODAY, -1)}T21:00:00+07:00`,
    actualDurationMinutes: 120,
    timeSource: "APPROVER",
    workResult: "Menutup outlet karena kasir sakit mendadak.",
    verifierId: undefined,
    verificationStatus: "DIISI",
    rate: OT_RATE,
    estimatedNominal: Math.round((120 / 60) * OT_RATE),
    note: "Tidak ada planning — anomali.",
    createdAt: NOW,
    updatedAt: NOW,
  },
];
export const overtimeActuals: OvertimeActual[] = _overtimeActuals.filter((a) => a.employeeId !== "");

// ------------------------------------------------------------
// Payroll — periode bulan lalu (draft) & bulan ini (draft)
// ------------------------------------------------------------
export const payrolls: PayrollEntry[] = [];
const lastPeriod = addDaysISO(TODAY, -30).slice(0, 7);
const thisPeriod = TODAY.slice(0, 7);
const payrollEmps = employees.filter((e) => e.status === "AKTIF").slice(0, 20);
payrollEmps.forEach((emp, i) => {
  const base = emp.salaryType === "BULANAN" ? emp.salaryAmount : emp.salaryAmount * 25;
  const lateDeduction = i % 3 === 0 ? 7000 : 0;
  const overtimeAmount = i % 4 === 0 ? Math.round((180 / 60) * OT_RATE) : 0;
  const total = Math.max(0, base - lateDeduction + overtimeAmount);
  payrolls.push({
    id: `pay-${emp.id}-${thisPeriod}`,
    employeeId: emp.id,
    period: thisPeriod,
    baseSalary: base,
    phCount: i % 5 === 0 ? 1 : 0,
    phDeduction: 0,
    overtimeAmount,
    additions: [],
    deductions: [],
    lateDeduction,
    absenceDeduction: 0,
    total,
    status: i < 14 ? "DRAFT" : "REVIEWED",
    createdAt: NOW,
    updatedAt: NOW,
  });
});

// ------------------------------------------------------------
// Notifications
// ------------------------------------------------------------
export const notifications: AppNotification[] = [
  {
    id: "notif-1",
    category: "KONTRAK",
    title: "Kontrak akan berakhir dalam 7 hari",
    message: `${employees.find((e) => contracts.find((c) => c.employeeId === e.id && daysBetween(TODAY, c.endDate) === 7)?.employeeId === e.id)?.fullName ?? "Seorang karyawan"} — kontrak berakhir 7 hari lagi.`,
    read: false,
    archived: false,
    createdAt: NOW,
    link: "#/kontrak?filter=akan_berakhir",
  },
  {
    id: "notif-2",
    category: "LEMBUR",
    title: "Pengajuan lembur menunggu approval",
    message: "Pengajuan lembur OT/2025/001 (JURI Bun — Sudirman) menunggu persetujuan.",
    read: false,
    archived: false,
    createdAt: NOW,
    link: "#/lembur?filter=pending",
  },
  {
    id: "notif-3",
    category: "CUTI",
    title: "Pengajuan cuti menunggu approval",
    message: "Pengajuan cuti karyawan menunggu review HRD.",
    read: false,
    archived: false,
    createdAt: NOW,
    link: "#/cuti?filter=pending",
  },
  {
    id: "notif-4",
    category: "ANOMALI",
    title: "Lembur tanpa planning terdeteksi",
    message: "Actual lembur di Outlet Pondok Indah tidak memiliki planning.",
    read: false,
    archived: false,
    createdAt: NOW,
    link: "#/lembur?filter=anomali",
  },
  {
    id: "notif-5",
    category: "PAYROLL",
    title: "Payroll periode ini perlu review",
    message: `${payrolls.filter((p) => p.status === "DRAFT").length} entri payroll berstatus Draft.`,
    read: false,
    archived: false,
    createdAt: NOW,
    link: "#/payroll?filter=draft",
  },
  {
    id: "notif-6",
    category: "ABSENSI",
    title: "Karyawan belum hadir hari ini",
    message: "Beberapa karyawan belum melakukan check-in hari ini.",
    read: true,
    archived: false,
    createdAt: NOW,
    link: "#/absensi",
  },
  {
    id: "notif-7",
    category: "JADWAL",
    title: "Konflik jadwal terdeteksi",
    message: "Terdapat tumpang tindih jadwal pada minggu ini.",
    read: true,
    archived: false,
    createdAt: NOW,
    link: "#/jadwal",
  },
];

// ------------------------------------------------------------
// Audit Log
// ------------------------------------------------------------
export const auditLogs: AuditLog[] = [
  {
    id: "log-1",
    actor: "HRD Admin",
    module: "Karyawan",
    action: "UPDATE",
    description: "Memperbarui gaji karyawan Andi Pratama.",
    before: { salaryAmount: 4050000 },
    after: { salaryAmount: 4500000 },
    createdAt: addDaysISO(TODAY, -2),
  },
  {
    id: "log-2",
    actor: "HRD Admin",
    module: "Kontrak",
    action: "CREATE",
    description: "Membuat kontrak baru untuk karyawan Rina Lestari.",
    createdAt: addDaysISO(TODAY, -3),
  },
  {
    id: "log-3",
    actor: "HRD Admin",
    module: "Lembur",
    action: "APPROVE",
    description: "Menyetujui pengajuan lembur OT/2025/002.",
    createdAt: addDaysISO(TODAY, -1),
  },
  {
    id: "log-4",
    actor: "HRD Admin",
    module: "Cuti",
    action: "APPROVE",
    description: "Menyetujui pengajuan izin karyawan.",
    createdAt: addDaysISO(TODAY, -1),
  },
  {
    id: "log-5",
    actor: "HRD Admin",
    module: "Jadwal",
    action: "UPDATE",
    description: "Mengubah jadwal shift karyawan di Outlet Bekasi.",
    createdAt: TODAY,
  },
];

// ------------------------------------------------------------
// Holiday Overrides (Tukar Libur / Workday Override)
// ------------------------------------------------------------
export const holidayOverrides: HolidayOverride[] = [
  {
    id: "hov-1",
    holidayGroupId: "hg-produksi",
    type: "HOLIDAY_SWAP",
    employeeIds: [], // seluruh anggota grup produksi
    originalHolidayDate: holidays.find((h) => h.id === "hol-isra-miraj")?.date ?? addDaysISO(TODAY, -8),
    replacementDate: addDaysISO(TODAY, 14),
    reason: "Tim produksi bekerja pada Isra Mikraj & mengganti libur ke Sabtu berikutnya.",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "hov-2",
    holidayGroupId: "hg-all",
    type: "ADDITIONAL_HOLIDAY",
    employeeIds: employees.filter((e) => e.primaryOutletId === "out-sudirman").slice(0, 2).map((e) => e.id),
    replacementDate: addDaysISO(TODAY, 10),
    reason: "Libur tambahan untuk karyawan Sudirman setelah event besar.",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "hov-3",
    holidayGroupId: "hg-all",
    type: "WORKDAY_OVERRIDE",
    employeeIds: employees.filter((e) => e.primaryOutletId === "out-kemang").slice(0, 1).map((e) => e.id),
    replacementDate: addDaysISO(TODAY, 5),
    reason: "Override hari kerja menjadi libur untuk keperluan pribadi disetujui.",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// ------------------------------------------------------------
// Shift Swap Requests (Pengajuan & Tukar Shift)
// ------------------------------------------------------------
const outletEmpFirst = (outletId: string) =>
  employees.find((e) => e.primaryOutletId === outletId && e.status === "AKTIF");

const _shiftSwaps: ShiftSwapRequest[] = [
  {
    id: "swap-1",
    requestNo: `SWP/${TODAY.slice(0, 4)}/001`,
    type: "TUKAR_DUA_KARYAWAN",
    requesterId: outletEmpFirst("out-sudirman")?.id ?? "",
    counterpartId: outletEmpFirst("out-sudirman")?.id ? employees.filter((e) => e.primaryOutletId === "out-sudirman" && e.status === "AKTIF")[1]?.id : undefined,
    sourceDate: addDaysISO(TODAY, 2),
    sourceShiftTemplateId: "shift-pagi",
    sourceOutletId: "out-sudirman",
    targetDate: addDaysISO(TODAY, 3),
    targetShiftTemplateId: "shift-siang",
    targetOutletId: "out-sudirman",
    reason: "Keperluan keluarga — bertukar shift pagi/siang.",
    status: "PENDING",
    originalSubmitterId: hrdStaff?.id ?? "",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "swap-2",
    requestNo: `SWP/${TODAY.slice(0, 4)}/002`,
    type: "PINDAH_SATU_KARYAWAN",
    requesterId: outletEmpFirst("out-kemang")?.id ?? "",
    sourceDate: addDaysISO(TODAY, 4),
    sourceShiftTemplateId: "shift-pagi",
    sourceOutletId: "out-kemang",
    targetDate: addDaysISO(TODAY, 4),
    targetShiftTemplateId: "shift-siang",
    targetOutletId: "out-kemang",
    reason: "Pindah shift siang karena ada urusan pagi.",
    status: "PENDING",
    originalSubmitterId: hrdStaff?.id ?? "",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "swap-3",
    requestNo: `SWP/${TODAY.slice(0, 4)}/003`,
    type: "ANTAR_OUTLET",
    requesterId: outletEmpFirst("out-pondok-indah")?.id ?? "",
    counterpartId: outletEmpFirst("out-bekasi")?.id ?? "",
    sourceDate: addDaysISO(TODAY, 5),
    sourceShiftTemplateId: "shift-pagi",
    sourceOutletId: "out-pondok-indah",
    targetDate: addDaysISO(TODAY, 5),
    targetShiftTemplateId: "shift-pagi",
    targetOutletId: "out-bekasi",
    reason: "Pertukaran antar outlet untuk rotasi.",
    status: "APPROVED",
    approverId: hrdStaff?.id,
    approvalNote: "Disetujui — rotasi antar outlet.",
    originalSubmitterId: hrdStaff?.id ?? "",
    createdAt: NOW,
    updatedAt: NOW,
  },
];
export const shiftSwaps: ShiftSwapRequest[] = _shiftSwaps.filter((s) => s.requesterId !== "");
