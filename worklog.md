# JURI HR — Worklog & Handover

## Status Proyek Saat Ini

**Fase 1 — Fondasi & Design System: SELESAI** ✅
**Fase 2 — Core HR & Master Data: SELESAI** ✅

Aplikasi JURI HR berhasil dibangun hingga Fase 2. Semua modul master data (Karyawan, Outlet, Posisi & Divisi, Domisili & Peta Leaflet, Kontrak & Monitoring) berfungsi penuh dengan CRUD reaktif, konsistensi data antar-modul, peta interaktif, dan histori perpanjangan kontrak. Aplikasi berjalan tanpa error TypeScript/build/runtime. Menunggu persetujuan user sebelum melanjutkan ke Fase 3.

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

---

## Task ID: FASE-2
Agent: Z.ai Code (webDevReview cron)
Task: QA Fase 1 + Membangun Fase 2 — Core HR & Master Data

Work Log:
- **QA Fase 1**: verifikasi dashboard stabil (9 kartu metrik + 4 chart), dev.log bersih, lint 0 error. Fase 1 dinilai stabil → lanjut Fase 2.
- Install `leaflet@1.9.4` + `react-leaflet@5.0.0` (v5 untuk React 19) + `@types/leaflet` untuk modul Domisili & Peta.
- **Service layer** `src/lib/services/master-data.ts`: CRUD lengkap untuk Position, Division, Outlet, Employee, Domicile, Contract — semua mutasi via central store + logAudit + logChangeHistory. Termasuk `employeeService.bulkUpdate`, `outletService.stats` (karyawan per posisi, rata-rata jarak, terdekat/terjauh), `domicileService.nearestOutlets`, `contractService.extend` (perpanjangan dengan histori), `contractService.reminderCategory` (90/60/30/14/7/3/lewat), `lookupService` (resolve nama).
- **Komponen reusable baru**:
  - `src/components/common/field.tsx` — Field wrapper (label, required, hint, error) + FormRow.
  - `src/components/common/info-row.tsx` — InfoRow label-value untuk panel detail.
- **Router**: update `routes.ts` — modul Fase 2 (Karyawan, Outlet, Posisi, Domisili, Kontrak) ditandai `available: true`. Buat `route-view.tsx` (registry view per route, dynamic import DomicileView dengan ssr:false untuk hindari error SSR Leaflet `window is not defined`). Sederhanakan `app-shell.tsx` (footer update ke "Fase 2").
- **Modul Posisi & Divisi** (`positions-view.tsx`): dual-panel. Posisi pakai DataTable (kode, nama, kategori, gaji default, jumlah karyawan, status) + form dialog (kode, nama, kategori, default gaji bulanan/harian, status switch, catatan). Divisi pakai list card dengan kode, nama, kepala, jumlah karyawan, kategori badge, edit/archive. CRUD lengkap dengan soft delete (archive) + toast + audit log.
- **Modul Outlet** (`outlet-view.tsx`): list DataTable (kode, nama+alamat, klasifikasi badge, kepala outlet, geofence radius, status) + detail view (`?id=`): 4 mini-stat (total karyawan, rata-rata jarak, radius geofence, klasifikasi), info outlet lengkap (koordinat, kepala, dll), distribusi karyawan per posisi, kartu Terdekat/Terjauh (dengan Haversine), daftar karyawan outlet (klik → detail karyawan). Form dialog dengan koordinat lat/lon, radius, klasifikasi, kepala outlet.
- **Modul Data Karyawan** (`employees-view.tsx` + `employee-form-dialog.tsx` + `employee-detail.tsx`):
  - List: 4 stat pill (Total/Aktif/Nonaktif/Resign), filter (outlet, kategori, status), search, DataTable dengan avatar+nama+NIK, posisi/divisi, outlet, kategori badge, gaji (bulanan/harian), status, aksi edit + activate/deactivate. Bulk update (nonaktifkan massal). Export CSV. Import simulasi.
  - Form dialog: 4 section (Identitas, Penempatan, Gaji & Cuti, Shift & Libur) + catatan. Validasi NIK unik, posisi/divisi wajib, outlet wajib untuk kategori OUTLET. Auto-set kategori & default gaji dari posisi. Filter posisi/divisi/outlet berdasarkan kategori. Supervisor selector.
  - Detail (`?id=`): header card (avatar, nama, NIK, posisi, outlet, status+kategori badge, edit). 9 tab: **Profil** (4 card: Data Pribadi, Penempatan & Kepegawaian, Gaji & Cuti, Catatan), **Domisili** (alamat + peta mini Leaflet + jarak ke outlet + rekomendasi outlet terdekat + editor dengan address search Nominatim + map picker), **Kontrak** (kartu kontrak dengan badge reminder, kontrak terbaru di-highlight, "↳ Perpanjangan dari kontrak sebelumnya"), **Jadwal** (7 hari terakhir dengan shift), **Absensi** (riwayat dengan status + potongan), **Cuti** (riwayat + saldo), **Lembur** (planning + actual dengan anomali), **Payroll** (per periode dengan rincian gaji), **Histori** (timeline perubahan dengan old→new value, entity type badge, aktor, alasan).
- **Modul Domisili & Peta** (`domicile-view.tsx`): peta Leaflet full-size (520px) dengan TileLayer OpenStreetMap. Marker outlet (ikon coklat + circle geofence) + marker karyawan (dot emas, hijau jika <3km ke outlet). Filter (search, kategori, outlet) + toggle samarkan koordinat (obfuscateCoord ke 3 desimal). Panel samping "Jarak ke Outlet" terurut dari terdekat dengan badge warna jarak. Popup marker menampilkan info karyawan + jarak. Catatan Haversine & rekomendasi (bukan mutasi otomatis).
- **Komponen peta** (`employee-mini-map.tsx`): MapContainer Leaflet dengan marker emas (karyawan, draggable saat editable) + marker outlet + circle geofence. Click handler untuk map picker. Recenter saat koordinat berubah. Popup info.
- **Domicile editor** (`domicile-editor.tsx`): view mode (info alamat + peta + jarak + rekomendasi) + edit mode (address search via Nominatim API, map picker, form alamat lengkap, source koordinat). Dynamic import EmployeeMiniMap (ssr:false).
- **Modul Kontrak & Monitoring** (`contracts-view.tsx`): 8 bucket reminder card (Lewat, ≤3, ≤7, ≤14, ≤30, ≤60, ≤90, Aman) yang dapat diklik untuk filter. DataTable (no kontrak, karyawan, jenis, periode, reminder badge berwarna, status, aksi). Filter status + search. Export CSV. Dialog perpanjang kontrak (tanggal mulai/berakhir baru, jenis, catatan — default +1 tahun). Dialog edit (status, decision, last working date, note).
- **Global search topbar** (`app-topbar.tsx`): command palette (⌘K / Ctrl+K) dengan CommandDialog — cari karyawan (nama/NIK) & outlet, navigasi langsung ke detail. Tombol search di mobile.
- **Bug fix kritis** `src/hooks/use-store.ts`: selector dengan `.filter()` mengembalikan array baru setiap render → infinite loop `useSyncExternalStore` ("getSnapshot should be cached"). Perbaiki dengan shallow equality cache (Object.is per elemen array/objek) agar referensi stabil selama konten tidak berubah. Ini juga memperbaiki potensi bug di Fase 1.

Stage Summary:
- **Verifikasi end-to-end via Agent Browser**:
  - Semua 5 modul Fase 2 + dashboard dapat diakses (judul halaman benar).
  - Tambah karyawan baru → Total 56→57, Aktif 54→55 di tabel, DAN dashboard ikut update (konsistensi antar-modul terbukti). Audit log mencatat "Menambah karyawan".
  - Perpanjangan kontrak → kontrak lama ditandai "Diperpanjang", kontrak baru dibuat (CTR/2026/0057) dengan "↳ Perpanjangan dari kontrak sebelumnya" (histori tidak menimpa). Toast konfirmasi muncul.
  - Tab detail karyawan (9 tab) semua berfungsi: Profil, Domisili (peta Leaflet + jarak 7.0km + rekomendasi), Kontrak (2 kontrak setelah perpanjangan), Jadwal, Absensi, Cuti, Lembur, Payroll, Histori (timeline gaji lama→baru).
  - Peta Domisili & Peta global: Leaflet + OpenStreetMap render, marker emas (karyawan) + gelap (outlet) + geofence circle, filter bekerja, panel jarak terurut, toggle samarkan koordinat.
  - Global search ⌘K: command palette dengan hasil karyawan + outlet, navigasi ke detail.
  - Filter bucket reminder kontrak (klik ≤3 hari → filter tabel).
  - Responsif di viewport sempit (tabel horizontal scroll, stat pill wrap).
- **VLM verification**: employee detail (header card + tab nav + Profil cards), peta domisili karyawan (marker emas + outlet + geofence + jarak 7.0km), peta global (filter bar + side panel terurut), mobile responsive — semua bersih tanpa layout issue.
- **Lint**: 0 error, 1 warning (TanStack Table — known).
- **TypeScript**: 0 error pada kode JURI HR.
- **Runtime**: tidak ada error di dev.log setelah fix useStore (sebelumnya ada infinite loop + SSR window error, keduanya diperbaiki).

## Isu / Risiko & Rekomendasi Fase Berikutnya

- **Prioritas Fase 3**: Shift Template (CRUD + konfigurasi PH), Shift Group (pola mingguan + anggota), Kalender Jadwal (harian/mingguan/bulanan + jadwal massal + copy minggu + deteksi konflik + lock periode), Pengajuan & Tukar Shift (preview sebelum/sesudah + deteksi konflik), Holiday Group (CRUD + holiday swap + workday override + preview dampak).
- Data Fase 3 sudah tersedia di seed (shiftTemplates, shiftGroups, schedules, holidays, holidayGroups) — siap dipakai.
- Service layer siap di-extend: tambah `shiftService.ts`, `scheduleService.ts`, `holidayService.ts` dengan deteksi konflik.
- Leaflet CSS di-import per komponen (`import "leaflet/dist/leaflet.css"`) — sudah berfungsi, tidak perlu global.
- `useStore` dengan shallow equality sudah robust untuk selector derived; aman dipakai di semua modul berikutnya.

## Catatan Arsitektur (untuk integrasi backend nyata)

- `src/lib/data/store.ts` = central data service (in-memory). `src/lib/services/*` = dummy API (pure functions).
- Untuk integrasi backend: ganti isi service layer dengan `fetch()` ke API nyata; hook `useStore` diganti dengan TanStack Query hooks. Signature service tetap sama → UI tidak perlu berubah.
- Prisma + SQLite tersedia (`src/lib/db.ts`) bila ingin persistensi, namun prototype Fase 1 memakai in-memory store sesuai prinsip "central data service, bukan localStorage".
