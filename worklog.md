# JURI HR — Worklog & Handover

## Status Proyek Saat Ini

**Fase 1 — Fondasi & Design System: SELESAI** ✅

Aplikasi JURI HR (sistem manajemen HR untuk HRD bisnis multi-outlet bakery & coffee bun) berhasil dibangun hingga Fase 1. Aplikasi berjalan tanpa error TypeScript/build/runtime pada route `/` (SPA dengan hash-based routing). Menunggu persetujuan user sebelum melanjutkan ke Fase 2.

---

## Task ID: FASE-1
Agent: Z.ai Code (main)
Task: Membangun Fase 1 — Fondasi & Design System JURI HR

Work Log:
- Eksplorasi struktur proyek Next.js 16 + shadcn/ui yang sudah ada (full komponen UI tersedia).
- Setup design system di `src/app/globals.css` dengan palet brand JURI HR:
  - Primary `#FCBA0C`, Dark brown `#3A2518`, Cream `#FFF8E7`, Surface `#FFFDF8`, Muted `#74665D`, Border `#EADFCB`.
  - Radius 12px, shadow lembut, scrollbar custom, light + dark mode (warm dark brown).
- Update `src/app/layout.tsx`: metadata JURI HR, ThemeProvider (next-themes), QueryProvider (TanStack Query), Toaster + SonnerToaster, lang="id".
- Buat TypeScript data models lengkap di `src/lib/types/index.ts` (Employee, Outlet, Position, Division, Domicile, Contract, ShiftTemplate, ShiftGroup, Schedule, Holiday, HolidayGroup, Attendance, Leave, OvertimePlanning, OvertimeActual, PayrollEntry, AppNotification, AuditLog, ChangeHistoryEntry, + dashboard aggregates).
- Buat utility helpers di `src/lib/utils.ts`: formatRupiah, formatDateLong/Med, formatDateTimeMed, formatDuration, haversineKm, formatDistance, obfuscateCoord, todayISODate (Asia/Jakarta), daysBetween, addDaysISO, initials, uid, sleep.
- Buat central mock seed data di `src/lib/data/seed.ts`: 9 outlet (Jabodetabek), 6 divisi, 12 posisi, 56 karyawan (48 outlet + 8 HQ) dengan domicile + kontrak, 5 shift template, 3 shift group, holiday & holiday group, jadwal 7 hari, absensi 7 hari, 5 cuti, 4 overtime planning + 4 actual (1 anomali), payroll, 7 notifikasi, 5 audit log. Deterministic (seeded RNG).
- Buat central data store di `src/lib/data/store.ts`: singleton in-memory DataStore dengan subscribe/notify (useSyncExternalStore via `src/hooks/use-store.ts`). Single source of truth.
- Buat service layer: `src/lib/services/dashboard.ts` (computeDashboardStats, attendanceTrend, outletDistribution, contractStatus, overtimePlanVsActual, recentActivities — pure functions) + `src/lib/services/audit.ts` (logAudit, logChangeHistory).
- Buat hash router: `src/lib/router/routes.ts` (NAV_GROUPS semua modul Fase 1–5 dengan flag `available`) + `src/lib/router/use-route.ts` (useRoute, navigate).
- Bangun layout utama `src/components/layout/`:
  - `app-shell.tsx` — SidebarProvider + AppSidebar + SidebarInset (topbar + main + footer sticky).
  - `app-sidebar.tsx` — collapsible (icon mode), logo JURI HR, 5 nav group, badge fase, tooltip, footer prototipe.
  - `app-topbar.tsx` — sidebar trigger, breadcrumb, theme toggle, notification popover, profil HRD.
  - `app-breadcrumb.tsx` — Dashboard > [Modul].
  - `notification-popover.tsx` — fungsional: badge unread, list kategori, mark as read, mark all read, deep link navigate, toast.
- Bangun komponen reusable `src/components/common/`:
  - `status-badge.tsx` — peta status→warna untuk semua domain.
  - `page-header.tsx` — title + description + actions.
  - `data-table.tsx` — TanStack Table wrapper (search, sort, pagination, bulk selection, column visibility).
  - `states.tsx` — EmptyState, ErrorState, LoadingState, TableSkeleton.
  - `confirm-dialog.tsx` — AlertDialog wrapper.
  - `coming-soon.tsx` — halaman "Segera Hadir" jujur untuk modul fase berikutnya.
- Bangun dashboard `src/components/dashboard/` + `src/components/views/dashboard-view.tsx`:
  - 9 StatCard metrik (klik → navigate ke modul terkait dengan filter): total karyawan aktif (54), total outlet (9), kehadiran hari ini (29), terlambat (7), belum hadir (25), pengajuan pending (5), kontrak akan berakhir (39), lembur menunggu review (4), payroll perlu review (14).
  - 4 grafik Recharts: Tren Kehadiran (line), Distribusi Karyawan per Outlet (horizontal bar), Status Kontrak (donut), Planning vs Actual Lembur (grouped bar).
  - RecentActivity list (dari audit log) + QuickSummaryCard (kategori outlet/non-outlet, cuti hari ini, anomali lembur).
- Update `src/app/page.tsx` → render AppShell.
- Tambah `allowedDevOrigins` di next.config.ts.

Stage Summary:
- **Verifikasi Agent Browser**: dashboard render sempurna, 9 kartu metrik data nyata, 4 chart dengan data+legend, recent activity, quick summary. Interaktivitas teruji: klik kartu → halaman Coming Soon jujur; notification popover → mark all read (reaktif, tombol disabled + toast); theme toggle (dark mode aktif); sidebar collapse (state=collapsed). Tidak ada runtime error di dev.log.
- **VLM verification**: layout clean/professional, brand color benar (golden accent, dark brown text, cream bg), kartu & chart terorganisir, tidak ada overlap.
- **Lint**: 0 error, 1 warning (TanStack Table useReactTable — library known warning, tidak menghentikan).
- **TypeScript**: 0 error pada kode JURI HR (error pre-existing di examples/skills diabaikan).
- **Struktur data konsisten**: dashboard membaca dari central data service yang sama dengan tabel/form/laporan (modul fase berikutnya). Single source of truth via DataStore singleton.

## Tujuan Saat Ini / Modifikasi Selesai / Hasil Verifikasi

- Fase 1 selesai & terverifikasi end-to-end via Agent Browser + VLM.
- Aplikasi dapat dijalankan di `bun run dev` (port 3000), diakses via Preview Panel.
- Tidak ada tombol palsu (search global di topbar sengaja tidak ditampilkan hingga ada data untuk dicari di Fase 2; modul fase berikutnya menampilkan ComingSoon jujur).
- Sticky footer: struktur `min-h-svh` + `flex-1` + `mt-auto` benar; footer menempel saat konten pendek & terdorong natural saat konten panjang.

## Isu / Risiko Belum Terselesaikan & Rekomendasi Fase Berikutnya

- Modul Fase 2–5 saat ini menampilkan halaman ComingSoon (jujur). Tidak ada placeholder palsu.
- Viewport Agent Browser kecil (577px) — ComingSoon content > viewport, tapi struktur sticky footer sudah benar.
- **Prioritas Fase 2**: Data Karyawan (CRUD lengkap + tab detail: Profil/Domisili/Kontrak/Jadwal/Absensi/Cuti/Lembur/Payroll), Outlet (detail + geofence), Posisi, Divisi, Domisili & Peta (Leaflet/OpenStreetMap + Haversine sudah ada helper), Kontrak (monitoring jatuh tempo 90/60/30/14/7/3 hari + histori perpanjangan).
- Service layer siap di-extend: tambah `employeeService.ts`, `outletService.ts`, dll dengan async CRUD + logAudit/logChangeHistory. Komponen DataTable + StatusBadge + ConfirmDialog sudah siap pakai.
- Global search di topbar perlu diaktifkan kembali saat Fase 2 (dengan data karyawan/outlet).

## Catatan Arsitektur (untuk integrasi backend nyata)

- `src/lib/data/store.ts` = central data service (in-memory). `src/lib/services/*` = dummy API (pure functions).
- Untuk integrasi backend: ganti isi service layer dengan `fetch()` ke API nyata; hook `useStore` diganti dengan TanStack Query hooks. Signature service tetap sama → UI tidak perlu berubah.
- Prisma + SQLite tersedia (`src/lib/db.ts`) bila ingin persistensi, namun prototype Fase 1 memakai in-memory store sesuai prinsip "central data service, bukan localStorage".
