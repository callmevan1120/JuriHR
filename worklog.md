# JURI HR — Worklog & Handover

## Status Proyek Saat Ini

**Fase 1 — Fondasi & Design System: SELESAI** ✅
**Fase 2 — Core HR & Master Data: SELESAI** ✅
**Fase 3 — Shift, Jadwal, dan Hari Libur: SELESAI** ✅
**Fase 4 — Absensi, Cuti, dan Lembur: SELESAI** ✅
**Fase 5 — Payroll, Notification, dan Laporan: SELESAI** ✅
**Fase 6 — Finalisasi & QA: SELESAI** ✅

Aplikasi JURI HR telah selesai seluruh 6 fase. 17 modul fungsional penuh dengan CRUD reaktif, konsistensi data antar-modul, audit log, dan dokumentasi README lengkap. Aplikasi berjalan tanpa error TypeScript/build/runtime.

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

---

## Task ID: FASE-3
Agent: Z.ai Code (webDevReview cron)
Task: QA Fase 2 + Membangun Fase 3 — Shift, Jadwal, dan Hari Libur

Work Log:
- **QA Fase 2**: verifikasi employees view stabil, dev.log bersih, lint 0 error. Fase 2 dinilai stabil → lanjut Fase 3.
- **Tipe data baru** di `src/lib/types/index.ts`: `ShiftSwapRequest` (4 tipe: TUKAR_DUA_KARYAWAN, PINDAH_SATU_KARYAWAN, PERTUKARAN_HARI_KERJA, ANAR_OUTLET), `HolidayOverride` (5 tipe: HOLIDAY_SWAP, WORKDAY_OVERRIDE, ADDITIONAL_HOLIDAY, CANCELLED_HOLIDAY, EMPLOYEE_SPECIFIC).
- **Central store** `src/lib/data/store.ts`: tambah koleksi `holidayOverrides` + `shiftSwaps` ke DataState.
- **Seed data** `src/lib/data/seed.ts`: tambah 3 holiday override (1 HOLIDAY_SWAP tim produksi, 1 ADDITIONAL_HOLIDAY Sudirman, 1 WORKDAY_OVERRIDE Kemang) + 3 shift swap request (1 TUKAR_DUA pending, 1 PINDAH pending, 1 ANAR_OUTLET approved).
- **Service layer** `src/lib/services/schedule.ts`: CRUD untuk shiftTemplateService, shiftGroupService, scheduleService (upsert, remove, toggleLockRange, generateFromShiftGroup, copyWeek, detectConflicts), holidayService (createHoliday/update/delete, createGroup/update/softDelete, createOverride/delete, isHolidayForEmployee), shiftSwapService (create, update, approve+applySwap, reject, preview). Deteksi konflik: JADWAL (2+ shift tanggal sama), KONTRAK (tidak aktif), CUTI (approved), LIBUR (holiday group).
- **Router** `routes.ts`: modul Fase 3 (Shift, Shift Group, Kalender Jadwal, Holiday Group) ditandai `available: true`. `route-view.tsx` registrasi 4 view baru.
- **Modul Shift Template** (`shift-templates-view.tsx`): grid card dengan color bar, ikon Sun/Moon (lewat tengah malam), jam mulai/selesai, durasi, toleransi, badge PH ×multiplier, status, usage count. Form dialog: nama, jam mulai/selesai, toleransi, toggle lewat tengah malam, color picker (8 preset + custom), konfigurasi PH (toggle + multiplier), status. Soft delete + audit.
- **Modul Shift Group** (`shift-groups-view.tsx`): card per group dengan visual pola mingguan (7 hari, dot warna shift), scope (outlet/divisi), anggota aktif/total, periode berlaku, status. Form dialog: nama, scope type+id, editor pola mingguan (dropdown shift per hari), multi-select anggota (Command popover), periode berlaku, status.
- **Modul Kalender Jadwal** (`schedule-view.tsx`): 2 tab (Kalender + Tukar Shift).
  - **Kalender**: 3 mode (harian/mingguan/bulanan) dengan navigasi tanggal + date picker. Filter outlet/divisi/shift group. 
    - Harian: grid card per karyawan dengan shift color, konflik indicator, lock indicator.
    - Mingguan: tabel sticky dengan karyawan sebagai baris, 7 hari sebagai kolom, sel berwarna shift, klik untuk assign.
    - Bulanan: kalender grid dengan dot warna per tanggal, side panel detail tanggal terpilih + daftar karyawan tanpa jadwal.
  - Assign dialog: pilih shift/libur, catatan, deteksi konflik real-time (JADWAL/KONTRAK/CUTI/LIBUR).
  - Generate dari Shift Group: pilih group, range tanggal, toggle overwrite.
  - Copy Minggu: salin jadwal minggu sumber → target.
  - Lock/Unlock Periode: kunci/buka kunci seluruh jadwal range.
  - **Tukar Shift**: status filter tabs (Semua/Pending/Approved/Rejected), card per pengajuan dengan preview Sebelum/Sesudah, tombol Review (approve/reject dengan catatan). Approval apply perubahan jadwal otomatis (applySwap per tipe). Buat pengajuan baru dengan 4 tipe.
- **Modul Holiday Group** (`holiday-view.tsx`): 
  - List group di kiri (klik untuk pilih). Detail group di kanan: info (periode, anggota, libur), daftar anggota (chips), daftar override dengan ikon per tipe, tombol preview + hapus.
  - Holiday Calendar: mini month view dengan navigasi, daftar libur per bulan dengan badge tipe.
  - Form dialog group: nama, deskripsi, multi-select anggota, multi-select holiday, periode, status.
  - Form dialog holiday: tambah/edit hari libur (nama, tanggal, tipe, deskripsi).
  - Form dialog override: tipe (5 tipe), karyawan terdampak (multi-select atau semua anggota), tanggal asli/pengganti sesuai tipe, alasan.
  - **Preview Dampak Override**: dialog dengan impact cards (karyawan terdampak, jadwal di tanggal pengganti/asli, potongan PH) + tabel dampak modul (Jadwal, Absensi, PH, Lembur, Payroll).
- Update footer app-shell ke "Fase 2 · Core HR & Master Data" → siap update ke Fase 3.

Stage Summary:
- **Verifikasi end-to-end via Agent Browser + VLM**:
  - Semua 4 modul Fase 3 + dashboard dapat diakses (judul halaman benar, sidebar tanpa badge fase).
  - Shift Template: grid card dengan color bar, durasi, toleransi, PH badge — VLM verified clean.
  - Shift Group: card dengan visual pola mingguan (dot warna shift per hari), anggota, periode.
  - Kalender Jadwal mingguan: tabel sticky karyawan×hari, sel berwarna shift dengan jam — VLM verified clean.
  - Kalender Jadwal bulanan: grid bulan dengan dot warna + side panel detail tanggal — VLM verified clean.
  - Tukar Shift: 2 Pending + 1 Approved, card dengan preview Sebelum/Sesudah. Approval bekerja — Approved naik 1→2, jadwal diperbarui otomatis.
  - Holiday Group: list group + detail + override list + kalender libur bulanan — VLM verified.
  - Preview Dampak Override: dialog dengan impact cards + tabel dampak modul (Jadwal/Absensi/PH/Lembur/Payroll).
  - Generate dialog, Copy Minggu dialog, Assign dialog dengan deteksi konflik — semua bekerja.
  - Dashboard tidak ada regresi (Fase 1+2 tetap stabil).
- **Lint**: 0 error, 1 warning (TanStack Table — known).
- **TypeScript**: 0 error pada kode JURI HR.
- **Runtime**: tidak ada error di dev.log.

## Isu / Risiko & Rekomendasi Fase Berikutnya

- **Prioritas Fase 4**: Absensi (input individual/massal, koreksi, rekap harian/bulanan, potongan Rp7000 per keterlambatan >5menit), Cuti/Izin/Sakit (pengurangan saldo otomatis, anti-tabrakan), Planning Lembur (pengajuan banyak karyawan/outlet/divisi), Actual Lembur (verifikasi, anomali: tanpa planning/melebihi planning/belum diisi/belum diverifikasi/konflik), Approval timeline.
- Data Fase 4 sudah tersedia di seed (attendances, leaves, overtimePlannings, overtimeActuals) — siap dipakai.
- Service layer siap di-extend: tambah `attendanceService.ts`, `leaveService.ts`, `overtimeService.ts` dengan deteksi anomali.
- `scheduleService.detectConflicts` sudah ada — dapat dipakai ulang di modul absensi/lembur Fase 4.
- `holidayService.isHolidayForEmployee` sudah ada — siap dipakai untuk menandai absensi LIBUR/PH di Fase 4.

## Catatan Arsitektur (untuk integrasi backend nyata)

- `src/lib/data/store.ts` = central data service (in-memory). `src/lib/services/*` = dummy API (pure functions).
- Untuk integrasi backend: ganti isi service layer dengan `fetch()` ke API nyata; hook `useStore` diganti dengan TanStack Query hooks. Signature service tetap sama → UI tidak perlu berubah.
- Prisma + SQLite tersedia (`src/lib/db.ts`) bila ingin persistensi, namun prototype Fase 1 memakai in-memory store sesuai prinsip "central data service, bukan localStorage".

---

## Task ID: FASE-4
Agent: Z.ai Code (webDevReview cron)
Task: QA Fase 3 + Membangun Fase 4 — Absensi, Cuti, dan Lembur

Work Log:
- **QA Fase 3**: verifikasi schedule view stabil, dev.log bersih, lint 0 error. Fase 3 dinilai stabil → lanjut Fase 4.
- **Service layer** `src/lib/services/workforce.ts`: 
  - `attendanceService`: upsert (dengan computeDeduction Rp7000 untuk >5 menit), bulkUpsert, remove, dailyRecap, monthlyRecap, byPeriod. Ekspor konstanta `LATE_TOLERANCE_MINUTES=5` & `LATE_DEDUCTION_RUPIAH=7000`.
  - `leaveService`: create, update, approve (kurangi saldo cuti otomatis untuk tipe CUTI), reject, cancelApproved (kembalikan saldo), checkConflict (anti-tabrakan dengan PENDING/APPROVED), leaveDays.
  - `overtimeService`: createPlanning/update/approve/reject, upsertActual (hitung planningDiff & estimatedNominal otomatis), verifyActual, anomalies (6 jenis: TANPA_PLANNING, MELEBIHI_PLANNING, BELUM_DIISI, BELUM_DIVERIFIKASI, KONFLIK_CUTI, KONFLIK_LIBUR), verifiedOvertimeAmount (untuk payroll).
- **Router** `routes.ts`: modul Fase 4 (Absensi, Cuti, Lembur) ditandai `available: true`. `route-view.tsx` registrasi 3 view baru.
- **Modul Absensi** (`attendance-view.tsx`): 3 tab.
  - **Harian**: 8 recap card (Hadir/Terlambat/Tidak Hadir/Cuti/Izin/Sakit/Libur/PH), navigasi tanggal + date picker, filter outlet/status, list karyawan dengan status badge + late minutes + potongan, edit dialog (status, check-in/out, menit terlambat dengan info potongan real-time, catatan), hapus, input massal (multi-select karyawan + status + menit terlambat), export CSV. Info aturan demo (≤5m tidak dipotong, >5m Rp7000).
  - **Bulanan**: period selector (month), summary badges (Hadir/Telat/TH/Potongan total), DataTable per karyawan (Hadir/Terlat/TH/Cuti/Izin/Sakit/Libur/PH/Total Telat/Potongan).
  - **Rekap & Laporan**: range tanggal + filter outlet, tabel rekap per karyawan dengan total, export CSV.
- **Modul Cuti/Izin/Sakit** (`leave-view.tsx`): filter status (Semua/Pending/Approved/Rejected/Cancelled), card per pengajuan dengan tipe badge (Cuti/Izin/Sakit), durasi hari, alasan, lampiran, deteksi konflik real-time, saldo info. Create dialog dengan: karyawan, tipe, range tanggal, alasan, lampiran, info saldo (cukup/tidak cukup), deteksi konflik. Review dialog dengan info saldo sebelum/sesudah, approve (kurangi saldo) / reject. Cancel approved (kembalikan saldo). Info aturan (saldo otomatis, anti-tabrakan). Export CSV.
- **Modul Lembur** (`overtime-view.tsx`): 3 tab.
  - **Planning**: filter status, card per planning (requestNo, kategori, tanggal, jam, durasi, karyawan count, outlet/divisi, PJ, actual summary), create dialog (kategori outlet/non-outlet, outlet/divisi, shift/tim, multi-select karyawan, tanggal, jam, durasi otomatis, alasan, pekerjaan, PJ), review dialog (approve/reject).
  - **Actual & Verifikasi**: filter (Semua/Terverifikasi/Belum Diverifikasi/Belum Diisi), total terverifikasi badge, card per actual (karyawan, tanggal, actual start/end, durasi, planning ref, nominal, selisih planning, hasil pekerjaan), tombol Verifikasi/Tolak untuk status DIISI, edit/isi actual dialog (actual start/end, durasi & nominal otomatis, hasil, bukti, rate, alasan selisih).
  - **Anomali**: 3 severity card (High/Medium/Low), type filter (6 jenis), list anomali dengan karyawan + deskripsi + tanggal + link ke modul. Deteksi otomatis: tanpa planning, melebihi planning (>20%), belum diisi (planning approved lewat tanggal), belum diverifikasi, konflik cuti, konflik libur.

Stage Summary:
- **Verifikasi end-to-end via Agent Browser + VLM**:
  - Semua 3 modul Fase 4 + dashboard dapat diakses (judul halaman benar).
  - Absensi Harian: 8 recap card, navigasi tanggal, list karyawan dengan status — VLM verified clean.
  - Edit absensi: dialog dengan info potongan "Rp7.000 (≤5m tidak dipotong)".
  - Absensi Bulanan: summary badges (Hadir 166, Telat 54, Potongan Rp 378.000), DataTable per karyawan — VLM verified.
  - Cuti: 3 pending → approve → Disetujui naik ke 3 (saldo otomatis berkurang, review dialog tampilkan "sisa X hari").
  - Lembur Anomali: severity cards (High 1, Medium 3, Low/Info 1), type filter, anomaly list — VLM verified.
  - Lembur Actual: verifikasi actual → Terverifikasi naik 2→3. Total terverifikasi badge.
  - Dashboard tidak ada regresi (Fase 1-3 tetap stabil).
- **Lint**: 0 error, 1 warning (TanStack Table — known).
- **TypeScript**: 0 error pada kode JURI HR.
- **Runtime**: tidak ada error di dev.log.

## Isu / Risiko & Rekomendasi Fase Berikutnya

- **Prioritas Fase 5**: Payroll Preview (gaji dasar + PH + lembur terverifikasi + adjustment + potongan keterlambatan/ketidakhadiran, status Draft/Reviewed/Finalized, export CSV/Excel/PDF), Notification Center (kategori, badge, filter, mark read, deep link), Laporan (multi-modul dengan filter periode/outlet/divisi, summary card, grafik, tabel, print/export), Audit Log (aktor, waktu, modul, aksi, before/after).
- Data Fase 5 sudah tersedia di seed (payrolls, notifications, auditLogs) — siap dipakai.
- Service layer siap di-extend: `payrollService` (generate preview baca dari attendance + overtime verified), `notificationService`, `reportService`.
- `attendanceService.dailyRecap/monthlyRecap` + `overtimeService.verifiedOvertimeAmount` + `leaveService` sudah siap dipakai payroll Fase 5.
- `overtimeService.anomalies()` terhubung ke dashboard "Lembur Menunggu Review" — konsistensi terjaga.

## Catatan Arsitektur (untuk integrasi backend nyata)

- `src/lib/data/store.ts` = central data service (in-memory). `src/lib/services/*` = dummy API (pure functions).
- Untuk integrasi backend: ganti isi service layer dengan `fetch()` ke API nyata; hook `useStore` diganti dengan TanStack Query hooks. Signature service tetap sama → UI tidak perlu berubah.
- Prisma + SQLite tersedia (`src/lib/db.ts`) bila ingin persistensi, namun prototype Fase 1 memakai in-memory store sesuai prinsip "central data service, bukan localStorage".

---

## Task ID: FASE-5
Agent: Z.ai Code (webDevReview cron)
Task: QA Fase 4 + Membangun Fase 5 — Payroll, Notification, dan Laporan

Work Log:
- **QA Fase 4**: verifikasi overtime view stabil, dev.log bersih, lint 0 error. Dev server sempat down, direstart. Fase 4 dinilai stabil → lanjut Fase 5.
- **Service layer** `src/lib/services/finance.ts`:
  - `payrollService`: generatePreview (baca gaji dasar + PH + lembur terverifikasi + potongan keterlambatan/ketidakhadiran, skip FINALIZED), update (recompute total), addComponent/removeComponent (adjustment), computeTotal, setStatus (flow DRAFT→REVIEWED→FINALIZED), bulkSetStatus, remove, exportCSV.
  - `notificationService`: list, unreadCount, byCategory, markAsRead, markAllAsRead, archive/unarchive, create.
  - `reportService`: workforceSummary (agregasi attendance/leaves/overtime/contracts), employeeDistribution, auditLogs.
- **Router** `routes.ts`: modul Fase 5 (Payroll, Notifikasi, Laporan, Audit Log) ditandai `available: true`. `route-view.tsx` registrasi 4 view baru.
- **Modul Payroll Preview** (`payroll-view.tsx`): 5 summary card (Total Entri/Draft/Reviewed/Finalized/Grand Total), filter (period month + outlet + status), DataTable dengan kolom karyawan/outlet/gaji dasar/lembur/potongan/total/status. Generate dialog (scope all/per outlet). Detail dialog dengan rincian gaji (gaji dasar, PH, lembur terverifikasi, additions, deductions, potongan keterlambatan/ketidakhadiran, total akhir), status flow (DRAFT→REVIEWED→FINALIZED), adjustment dialog (tambah penambah/pengurang). Bulk action (tandai reviewed/finalize massal). Export CSV/Excel/PDF (print). Payroll FINALIZED tidak dapat diubah.
- **Modul Notification Center** (`notification-view.tsx`): filter kategori (11 kategori dengan dot warna & count), toggle arsip, list notifikasi dengan kategori/title/message/timestamp, mark as read individual, mark all read, archive/unarchive, deep link ke modul terkait. Empty state.
- **Modul Laporan** (`reports-view.tsx`): 9 tipe laporan (Ringkasan Workforce, Data Karyawan, Distribusi Outlet & Divisi, Kehadiran, Keterlambatan, Cuti & Izin, Planning vs Actual Lembur, Kontrak Akan Berakhir, Payroll Preview). Filter periode (date range) + outlet + report type. Summary cards, grafik Recharts (bar chart distribusi outlet, pie chart distribusi divisi, bar chart planning vs actual, pie chart distribusi kehadiran), tabel detail. Print/PDF + Export CSV.
- **Modul Audit Log** (`audit-view.tsx`): 4 stat card (Total/Create/Update/Delete), filter (search + module + action), timeline aktivitas dengan dot warna per modul & badge aksi, expandable before/after data (JSON pretty print), export CSV.

Stage Summary:
- **Verifikasi end-to-end via Agent Browser + VLM**:
  - Semua 4 modul Fase 5 + dashboard dapat diakses (judul halaman benar).
  - Payroll: 5 summary cards (Total Entri 20, Draft 14, Reviewed 6, Finalized 0, Grand Total Rp 98jt), filter bar, DataTable — VLM verified.
  - Generate payroll: 54 preview digenerate.
  - Payroll detail: rincian gaji (gaji dasar, lembur terverifikasi, potongan), status flow DRAFT→Reviewed→Finalized (toast "Payroll difinalisasi").
  - Notification Center: filter kategori dengan dot warna & count, list notifikasi dengan kategori/title/message/timestamp — VLM verified.
  - Reports: filter bar + 8 summary cards — VLM verified. Distribusi report dengan bar chart + pie chart — VLM verified.
  - Audit Log: mencatat aktivitas Payroll (generate, update, finalize). Timeline dengan before/after.
  - Dashboard tidak ada regresi (Fase 1-4 tetap stabil).
- **Lint**: 0 error, 1 warning (TanStack Table — known).
- **TypeScript**: 0 error pada kode JURI HR.
- **Runtime**: tidak ada error di dev.log.

## SELURUH 5 FASE APLIKASI JURI HR TELAH SELESAI

Aplikasi JURI HR kini memiliki 17 modul fungsional penuh:
1. Dashboard HRD (Fase 1)
2. Data Karyawan + 9-tab detail (Fase 2)
3. Outlet + detail (Fase 2)
4. Posisi & Divisi (Fase 2)
5. Domisili & Peta Leaflet (Fase 2)
6. Kontrak & Monitoring (Fase 2)
7. Shift Template (Fase 3)
8. Shift Group (Fase 3)
9. Kalender Jadwal harian/mingguan/bulanan (Fase 3)
10. Pengajuan & Tukar Shift (Fase 3)
11. Holiday Group + Override (Fase 3)
12. Absensi harian/bulanan/rekap (Fase 4)
13. Cuti/Izin/Sakit + approval (Fase 4)
14. Lembur Planning + Actual + Anomali (Fase 4)
15. Payroll Preview + status flow + export (Fase 5)
16. Notification Center (Fase 5)
17. Laporan multi-modul + Audit Log (Fase 5)

Semua modul terintegrasi via central data service (single source of truth). CRUD bekerja, data konsisten antar-modul, audit log mencatat perubahan, notifikasi terhubung via deep link.

## Rekomendasi Fase 6 (Finalisasi & QA)

- Periksa konsistensi desain, responsive, navigasi, form, CRUD, filter, pagination, loading/empty/error state, toast, confirmation dialog, relasi data, dashboard, peta, kalender, payroll, laporan, audit log.
- Hapus placeholder & tombol tidak berfungsi.
- Buat README dokumentasi.

## Catatan Arsitektur (untuk integrasi backend nyata)

- `src/lib/data/store.ts` = central data service (in-memory). `src/lib/services/*` = dummy API (pure functions).
- Untuk integrasi backend: ganti isi service layer dengan `fetch()` ke API nyata; hook `useStore` diganti dengan TanStack Query hooks. Signature service tetap sama → UI tidak perlu berubah.
- Prisma + SQLite tersedia (`src/lib/db.ts`) bila ingin persistensi, namun prototype Fase 1 memakai in-memory store sesuai prinsip "central data service, bukan localStorage".

---

## Task ID: FASE-6
Agent: Z.ai Code (webDevReview cron)
Task: Finalisasi & QA — polish, perbaiki bug, buat README

Work Log:
- **QA komprehensif**: cek server (running), dev.log (no errors), lint (0 error, 1 warning known), type-check (0 error). Test semua 17 modul via agent-browser — semua load dengan judul halaman benar. Install console.error hook, navigasi through detail views (employee detail, outlet detail, domicile map, schedule, lembur, payroll, laporan) — 0 console errors.
- **VLM audit dashboard**: identifikasi issue — sidebar footer outdated ("Fase 1"), text truncation, spacing. 
- **Perbaikan**:
  - Update sidebar footer: "Fase 1 · Fondasi & Design System" → "JURI HR v1.0 · 17 modul · 5 fase selesai" dengan gradient bg & status dot.
  - Update app-shell footer: "Prototipe Fase 2" → "JURI HR v1.0 · 17 modul aktif".
  - Upgrade tombol Import di Data Karyawan: dari toast info → dialog import simulasi lengkap dengan format CSV, drop zone, dan tombol unduh template CSV.
  - Perbaiki React Hooks rules-of-hooks error (useState setelah conditional return) — pindahkan `importOpen` state ke atas.
- **Audit placeholder**: ComingSoon masih dipakai sebagai safety net untuk modul unavailable (tidak ada lagi — semua 17 modul available). Tidak ada tombol non-fungsional tersisa.
- **README dokumentasi** (`/home/z/my-project/README.md`): lengkap dengan cara menjalankan, identitas brand, struktur folder, daftar 17 fitur per fase, central data service, mock data, endpoint backend yang dibutuhkan, batasan prototipe, rekomendasi integrasi backend, teknologi.

Stage Summary:
- **Verifikasi via Agent Browser**:
  - Sidebar footer: "JURI HR v1.0 · 17 modul · 5 fase selesai" ✓
  - App footer: "JURI HR v1.0 · 17 modul aktif" ✓
  - Import dialog: format CSV + drop zone + unduh template ✓
  - Semua 17 modul tetap load dengan benar (no regression).
- **Lint**: 0 error, 1 warning (TanStack Table — known).
- **TypeScript**: 0 error.
- **Runtime**: 0 console errors, dev.log bersih.
- **Dokumentasi**: README.md lengkap (cara menjalankan, brand, struktur, fitur, arsitektur, endpoint backend, batasan, integrasi).

## PROYEK JURI HR SELESAI

Seluruh 6 fase aplikasi JURI HR telah diselesaikan:
- **Fase 1**: Fondasi, design system, dashboard.
- **Fase 2**: Core HR & master data (Karyawan, Outlet, Posisi, Domisili & Peta, Kontrak).
- **Fase 3**: Shift, Jadwal, Holiday Group.
- **Fase 4**: Absensi, Cuti, Lembur.
- **Fase 5**: Payroll, Notification, Laporan, Audit Log.
- **Fase 6**: Finalisasi, polish, README.

17 modul fungsional penuh, CRUD reaktif, konsistensi data antar-modul, audit log, dokumentasi lengkap. Siap untuk demo end-to-end dan integrasi backend nyata.
