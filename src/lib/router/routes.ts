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
        label: "Shift Template",
        icon: CalendarClock,
        phase: 3,
        available: true,
        description: "Template shift dengan toleransi keterlambatan dan konfigurasi PH.",
      },
      {
        path: "#/shift-group",
        label: "Shift Group",
        icon: CalendarDays,
        phase: 3,
        available: true,
        description: "Pola shift mingguan per outlet/divisi beserta anggota.",
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
        available: false,
        description: "Rekap absensi harian/bulanan dengan potongan keterlambatan otomatis.",
      },
      {
        path: "#/cuti",
        label: "Cuti / Izin / Sakit",
        icon: Palmtree,
        phase: 4,
        available: false,
        description: "Pengajuan cuti, izin, dan sakit dengan pengurangan saldo otomatis.",
      },
      {
        path: "#/lembur",
        label: "Lembur",
        icon: Clock,
        phase: 4,
        available: false,
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
        available: false,
        description: "Preview payroll dengan adjustment manual dan status Draft/Reviewed/Finalized.",
      },
      {
        path: "#/notifikasi",
        label: "Notifikasi",
        icon: Bell,
        phase: 5,
        available: false,
        description: "Pusat notifikasi dengan filter kategori dan deep link.",
      },
      {
        path: "#/laporan",
        label: "Laporan",
        icon: FileBarChart,
        phase: 5,
        available: false,
        description: "Laporan multi-modul dengan filter, grafik, dan export.",
      },
      {
        path: "#/audit",
        label: "Audit Log",
        icon: ScrollText,
        phase: 5,
        available: false,
        description: "Catatan perubahan penting: aktor, waktu, modul, aksi, data sebelum & sesudah.",
      },
    ],
  },
];

/** Flatten semua nav item. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Cari nav item berdasarkan path. */
export function findNavItem(path: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => i.path === path);
}
