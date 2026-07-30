// ============================================================
// JURI HR — Route Definitions
// Aplikasi SPA di bawah route "/". Navigasi via hash.
// ============================================================
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  MapPin,
  FileText,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  PartyPopper,
  ClipboardCheck,
  Palmtree,
  Clock,
  Wallet,
  Bell,
  FileBarChart,
  ScrollText,
  Settings,
  HelpCircle,
} from "lucide-react";

export interface NavItem {
  /** Hash route, mis. "#/karyawan". */
  path: string;
  label: string;
  icon: LucideIcon;
  /** Fase implementasi (info untuk status "segera hadir"). */
  phase: number;
  /** Apakah modul sudah tersedia di fase saat ini. */
  available: boolean;
  /** Deskripsi singkat modul (untuk halaman "segera hadir"). */
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Utama",
    items: [
      {
        path: "#/",
        label: "Dashboard",
        icon: LayoutDashboard,
        phase: 1,
        available: true,
        description: "Ringkasan metrik HRD dan aktivitas terbaru.",
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        path: "#/karyawan",
        label: "Data Karyawan",
        icon: Users,
        phase: 2,
        available: true,
        description:
          "Kelola data karyawan lengkap: NIK, posisi, divisi, outlet, gaji, kontrak, saldo cuti, dan histori perubahan.",
      },
      {
        path: "#/outlet",
        label: "Outlet",
        icon: Building2,
        phase: 2,
        available: true,
        description:
          "Master outlet dengan geofence, kepala outlet, jumlah karyawan, dan rata-rata jarak domisili.",
      },
      {
        path: "#/posisi",
        label: "Posisi & Divisi",
        icon: Briefcase,
        phase: 2,
        available: true,
        description: "Master posisi/jabatan & divisi beserta kategori OUTLET atau NON_OUTLET.",
      },
      {
        path: "#/domisili",
        label: "Domisili & Peta",
        icon: MapPin,
        phase: 2,
        available: true,
        description:
          "Peta domisili karyawan dengan Leaflet & OpenStreetMap, address search, map picker, dan estimasi jarak ke outlet.",
      },
      {
        path: "#/kontrak",
        label: "Kontrak",
        icon: FileText,
        phase: 2,
        available: true,
        description:
          "Manajemen kontrak & monitoring jatuh tempo (90/60/30/14/7/3 hari) dengan histori perpanjangan.",
      },
    ],
  },
  {
    label: "Penjadwalan",
    items: [
      {
        path: "#/shift",
        label: "Shift",
        icon: CalendarDays,
        phase: 3,
        available: true,
        description: "Kelola pola shift mingguan per outlet/divisi dan master template jam kerja.",
      },
      {
        path: "#/jadwal",
        label: "Kalender Jadwal",
        icon: CalendarRange,
        phase: 3,
        available: true,
        description:
          "Kalender jadwal harian/mingguan/bulanan dengan jadwal massal, copy minggu, dan deteksi konflik.",
      },
      {
        path: "#/libur",
        label: "Holiday Group",
        icon: PartyPopper,
        phase: 3,
        available: true,
        description: "Kelola hari libur, holiday swap, dan workday override.",
      },
    ],
  },
  {
    label: "Kehadiran & Lembur",
    items: [
      {
        path: "#/absensi",
        label: "Absensi",
        icon: ClipboardCheck,
        phase: 4,
        available: true,
        description: "Rekap absensi harian/bulanan dengan potongan keterlambatan otomatis.",
      },
      {
        path: "#/cuti",
        label: "Cuti / Izin / Sakit",
        icon: Palmtree,
        phase: 4,
        available: true,
        description: "Pengajuan cuti, izin, dan sakit dengan pengurangan saldo otomatis.",
      },
      {
        path: "#/lembur",
        label: "Lembur",
        icon: Clock,
        phase: 4,
        available: true,
        description: "Planning & actual lembur dengan deteksi anomali dan verifikasi.",
      },
    ],
  },
  {
    label: "Payroll & Laporan",
    items: [
      {
        path: "#/payroll",
        label: "Payroll",
        icon: Wallet,
        phase: 5,
        available: true,
        description: "Preview payroll dengan adjustment manual dan status Draft/Reviewed/Finalized.",
      },
      {
        path: "#/notifikasi",
        label: "Notifikasi",
        icon: Bell,
        phase: 5,
        available: true,
        description: "Pusat notifikasi dengan filter kategori dan deep link.",
      },
      {
        path: "#/laporan",
        label: "Laporan",
        icon: FileBarChart,
        phase: 5,
        available: true,
        description: "Laporan multi-modul dengan filter, grafik, dan export.",
      },
      {
        path: "#/audit",
        label: "Audit Log",
        icon: ScrollText,
        phase: 5,
        available: true,
        description: "Catatan perubahan penting: aktor, waktu, modul, aksi, data sebelum & sesudah.",
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        path: "#/pengaturan",
        label: "Pengaturan",
        icon: Settings,
        phase: 6,
        available: true,
        description: "Kelola data mock, reset, statistik, dan informasi sistem.",
      },
    ],
  },
];

/** Flatten semua nav item. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Cari nav item berdasarkan path. */
export function findNavItem(path: string): NavItem | undefined {
  if (!path) return undefined;

  let clean = path.split("?")[0] || "#/";
  if (!clean.startsWith("#")) clean = "#" + clean;
  if (clean.endsWith("/") && clean.length > 2) clean = clean.slice(0, -1);
  clean = clean.toLowerCase();

  // Try direct match
  const directMatch = ALL_NAV_ITEMS.find((i) => i.path.toLowerCase() === clean);
  if (directMatch) return directMatch;

  // Fallback map for aliases & legacy paths
  const map: Record<string, { label: string; path: string }> = {
    "#/posisi": { label: "Posisi & Divisi", path: "#/posisi" },
    "#/positions": { label: "Posisi & Divisi", path: "#/posisi" },
    "#/divisi": { label: "Posisi & Divisi", path: "#/posisi" },
    "#/karyawan": { label: "Data Karyawan", path: "#/karyawan" },
    "#/employees": { label: "Data Karyawan", path: "#/karyawan" },
    "#/outlet": { label: "Outlet Cabang", path: "#/outlet" },
    "#/outlets": { label: "Outlet Cabang", path: "#/outlet" },
    "#/domisili": { label: "Domisili & Peta", path: "#/domisili" },
    "#/kontrak": { label: "Kontrak Kerja", path: "#/kontrak" },
    "#/contracts": { label: "Kontrak Kerja", path: "#/kontrak" },
    "#/shift": { label: "Shift & Pola Kerja", path: "#/shift" },
    "#/shifts": { label: "Shift & Pola Kerja", path: "#/shift" },
    "#/shift-groups": { label: "Shift & Pola Kerja", path: "#/shift" },
    "#/shift-templates": { label: "Shift & Pola Kerja", path: "#/shift" },
    "#/jadwal": { label: "Kalender Jadwal", path: "#/jadwal" },
    "#/schedule": { label: "Kalender Jadwal", path: "#/jadwal" },
    "#/libur": { label: "Hari Libur & Penyesuaian", path: "#/libur" },
    "#/holiday": { label: "Hari Libur & Penyesuaian", path: "#/libur" },
    "#/holidays": { label: "Hari Libur & Penyesuaian", path: "#/libur" },
    "#/absensi": { label: "Absensi", path: "#/absensi" },
    "#/attendance": { label: "Absensi", path: "#/absensi" },
    "#/cuti": { label: "Cuti / Izin / Sakit", path: "#/cuti" },
    "#/leave": { label: "Cuti / Izin / Sakit", path: "#/cuti" },
    "#/lembur": { label: "Lembur", path: "#/lembur" },
    "#/overtime": { label: "Lembur", path: "#/lembur" },
    "#/payroll": { label: "Payroll", path: "#/payroll" },
    "#/notifikasi": { label: "Notifikasi", path: "#/notifikasi" },
    "#/notifications": { label: "Notifikasi", path: "#/notifikasi" },
    "#/laporan": { label: "Laporan", path: "#/laporan" },
    "#/reports": { label: "Laporan", path: "#/laporan" },
    "#/audit": { label: "Audit Log", path: "#/audit" },
    "#/pengaturan": { label: "Pengaturan", path: "#/pengaturan" },
    "#/settings": { label: "Pengaturan", path: "#/pengaturan" },
  };

  const found = map[clean];
  if (found) {
    const navObj = ALL_NAV_ITEMS.find((i) => i.path === found.path);
    if (navObj) return { ...navObj, label: found.label };
    return {
      path: found.path,
      label: found.label,
      icon: LayoutDashboard,
      phase: 1,
      available: true,
      description: found.label,
    };
  }

  return undefined;
}

/** Cari NavGroup & NavItem berdasarkan path untuk breadcrumb ERPNext-style. */
export function findNavGroupAndItem(path: string): { group?: NavGroup; item?: NavItem } {
  if (!path) return {};
  let clean = path.split("?")[0] || "#/";
  if (!clean.startsWith("#")) clean = "#" + clean;
  if (clean.endsWith("/") && clean.length > 2) clean = clean.slice(0, -1);
  clean = clean.toLowerCase();

  const ALIAS: Record<string, string> = {
    "#/positions": "#/posisi",
    "#/divisi": "#/posisi",
    "#/employees": "#/karyawan",
    "#/outlets": "#/outlet",
    "#/contracts": "#/kontrak",
    "#/shifts": "#/shift",
    "#/shift-groups": "#/shift",
    "#/shift-templates": "#/shift",
    "#/schedule": "#/jadwal",
    "#/holiday": "#/libur",
    "#/holidays": "#/libur",
    "#/attendance": "#/absensi",
    "#/leave": "#/cuti",
    "#/overtime": "#/lembur",
    "#/notifications": "#/notifikasi",
    "#/reports": "#/laporan",
    "#/settings": "#/pengaturan",
  };

  const targetPath = ALIAS[clean] || clean;

  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.path.toLowerCase() === targetPath);
    if (item) return { group, item };
  }

  const item = findNavItem(path);
  return { item };
}
