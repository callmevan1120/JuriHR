# JURI HR — Sistem Manajemen HR untuk Bisnis Multi-Outlet Bakery & Coffee Bun

Prototipe aplikasi web HRD untuk bisnis bakery & coffee bun multi-outlet (Jabodetabek). Dibangun dengan Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Recharts, dan Leaflet. Seluruh 17 modul fungsional penuh dengan CRUD reaktif, konsistensi data antar-modul, dan audit log.

## Cara Menjalankan

```bash
# Install dependencies
bun install

# Jalankan dev server (port 3000)
bun run dev

# Lint
bun run lint

# Type check
npx tsc --noEmit
```

Aplikasi diakses melalui **Preview Panel** (route `/` saja, SPA dengan hash-based routing). Klik "Open in New Tab" untuk tab terpisah.

## Identitas Brand

| Token | Warna | Penggunaan |
|-------|-------|------------|
| Primary | `#FCBA0C` | Aksen utama, tombol, badge aktif |
| Dark Brown | `#3A2518` | Teks utama, sidebar footer |
| Cream | `#FFF8E7` | Background secondary |
| Surface | `#FFFDF8` | Background utama |
| Muted | `#74665D` | Teks sekunder |
| Border | `#EADFCB` | Border, divider |

- Bahasa: Indonesia
- Zona waktu: Asia/Jakarta
- Format mata uang: Rupiah (id-ID, tanpa desimal)
- Radius: 12px
- Light + Dark mode (warm dark brown)

## Struktur Folder

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (ThemeProvider, QueryProvider)
│   ├── page.tsx            # Entry point → AppShell
│   └── globals.css         # Design system (brand colors, tokens)
├── components/
│   ├── layout/             # AppShell, Sidebar, Topbar, Breadcrumb, Notification
│   ├── common/             # DataTable, StatusBadge, PageHeader, States, Field, dll
│   ├── dashboard/          # StatCard, Charts, RecentActivity
│   ├── providers/          # ThemeProvider, QueryProvider
│   └── views/              # 17 modul view (satu file per modul)
├── hooks/
│   ├── use-store.ts        # Hook subscribe ke central store (shallow equality)
│   └── use-mobile.ts       # shadcn hook
├── lib/
│   ├── types/              # TypeScript models (semua entitas domain)
│   ├── data/
│   │   ├── store.ts        # Central DataStore (singleton, in-memory)
│   │   └── seed.ts         # Mock data terpusat (deterministic)
│   ├── services/
│   │   ├── master-data.ts  # CRUD: Employee, Outlet, Position, Division, Domicile, Contract
│   │   ├── schedule.ts     # CRUD: Shift, ShiftGroup, Schedule, Holiday, ShiftSwap
│   │   ├── workforce.ts    # CRUD: Attendance, Leave, Overtime + anomali
│   │   ├── finance.ts      # CRUD: Payroll, Notification, Report
│   │   ├── dashboard.ts    # Agregasi dashboard (pure functions)
│   │   └── audit.ts        # logAudit, logChangeHistory
│   ├── router/
│   │   ├── routes.ts       # NAV_GROUPS (17 modul, flag available)
│   │   └── use-route.ts    # Hash router (useRoute, navigate)
│   └── utils.ts            # formatRupiah, formatDate*, haversineKm, dll
```

## Daftar Fitur (17 Modul)

### Fase 1 — Fondasi & Design System
1. **Dashboard HRD** — 9 kartu metrik (klik → filter otomatis), 4 grafik Recharts (tren kehadiran, distribusi outlet, status kontrak, planning vs actual lembur), recent activity, quick summary.

### Fase 2 — Core HR & Master Data
2. **Data Karyawan** — CRUD lengkap, filter (outlet/kategori/status), search, bulk update, export CSV, import (template). Detail dengan **9 tab**: Profil, Domisili, Kontrak, Jadwal, Absensi, Cuti, Lembur, Payroll, Histori.
3. **Outlet** — CRUD + detail (4 mini-stat, distribusi karyawan per posisi, karyawan terdekat/terjauh via Haversine, geofence).
4. **Posisi & Divisi** — CRUD master data dual-panel.
5. **Domisili & Peta** — Leaflet + OpenStreetMap, marker clustering, filter, toggle samarkan koordinat, panel jarak terurut, rekomendasi outlet terdekat. Editor dengan address search (Nominatim) + map picker.
6. **Kontrak & Monitoring** — 8 bucket reminder (90/60/30/14/7/3/lewat), perpanjangan dengan histori (tidak menimpa), export CSV.

### Fase 3 — Shift, Jadwal, dan Hari Libur
7. **Shift Template** — CRUD dengan color picker, konfigurasi PH, durasi otomatis, indikator lewat tengah malam.
8. **Shift Group** — CRUD dengan visual pola mingguan, multi-select anggota.
9. **Kalender Jadwal** — 3 mode (harian/mingguan/bulanan), generate dari shift group, copy minggu, lock/unlock periode, deteksi konflik (jadwal/kontrak/cuti/libur).
10. **Pengajuan & Tukar Shift** — 4 tipe (Tukar Dua, Pindah Satu, Pertukaran Hari, Antar Outlet), preview sebelum/sesudah, approval apply otomatis.
11. **Holiday Group** — CRUD + kalender libur + 5 tipe override (Holiday Swap, Workday Override, Additional, Cancelled, Employee Specific) + preview dampak modul.

### Fase 4 — Absensi, Cuti, dan Lembur
12. **Absensi** — 3 tab (Harian/Bulanan/Rekap). Input individual & massal, potongan Rp7.000 untuk >5 menit terlambat, koreksi, export CSV.
13. **Cuti/Izin/Sakit** — Pengajuan dengan saldo otomatis (kurangi saat approve, kembalikan saat cancel), anti-tabrakan, approval flow.
14. **Lembur** — 3 tab (Planning/Actual/Anomali). Planning dengan multi-karyawan, actual dengan verifikasi HRD, **6 jenis deteksi anomali** (tanpa planning, melebihi planning, belum diisi, belum diverifikasi, konflik cuti, konflik libur).

### Fase 5 — Payroll, Notification, dan Laporan
15. **Payroll Preview** — Generate otomatis (baca gaji + lembur terverifikasi + potongan), adjustment manual, status flow Draft→Reviewed→Finalized, export CSV/Excel/PDF.
16. **Notification Center** — Filter 11 kategori, mark read/archive, deep link ke modul.
17. **Laporan** — 9 tipe laporan (Workforce, Karyawan, Distribusi, Kehadiran, Keterlambatan, Cuti, Lembur, Kontrak, Payroll) dengan grafik + export.
18. **Audit Log** — Timeline dengan before/after (JSON), filter module/action, export CSV.

## Central Data Service

Aplikasi menggunakan **single source of truth** via `DataStore` singleton (`src/lib/data/store.ts`):

- In-memory store dengan `useSyncExternalStore` (shallow equality cache agar selector `.filter()` stabil).
- Semua mutasi melewati service layer yang memperbarui store + mencatat audit log.
- Tidak menggunakan `localStorage` sebagai sumber data utama.
- Seed data deterministic (`src/lib/data/seed.ts`): 9 outlet, 6 divisi, 12 posisi, 56 karyawan, kontrak, domisili, jadwal 7 hari, absensi, cuti, lembur, payroll, notifikasi, audit log.

### Konsistensi Data Antar-Modul

Karena semua modul membaca dari store yang sama, perubahan di satu modul langsung tercermin di modul lain:
- Tambah karyawan → dashboard "Total Karyawan Aktif" update.
- Approve cuti → saldo cuti karyawan berkurang → tab Cuti di detail karyawan update.
- Perpanjang kontrak → kontrak lama ditandai "Diperpanjang", kontrak baru muncul sebagai histori.
- Verifikasi actual lembur → payroll preview ikut membaca nominal terverifikasi.

## Mock Data

Seed data mensimulasikan bisnis **JURI Bun** (bakery & coffee bun multi-outlet Jabodetabek):

- **9 Outlet**: Sudirman (Flagship), Kemang, Pondok Indah, Kelapa Gading, Bekasi, Tangerang, Depok, Bogor, Kebon Jeruk (Kiosk).
- **6 Divisi**: Operasional Outlet, Produksi, QC, Marketing, HRD, Finance.
- **12 Posisi**: Kepala Outlet, Supervisor Outlet, Barista, Kasir, Baker, Pramusaji, Crew Produksi, Supervisor Produksi, QC Staff, Marketing Staff, HR Staff, Finance Staff.
- **56 Karyawan**: 48 outlet + 8 HQ, dengan domisili (Haversine distance), kontrak (beragam status jatuh tempo), shift group, holiday group.
- **5 Shift Template**: Pagi, Siang, Malam (produksi, lewat tengah malam), Produksi Pagi, Office.
- **3 Shift Group**: Outlet 5 Hari, Produksi 2 Shift, Office HQ.
- **Holiday**: Tahun Baru, Kemerdekaan, Ultah Perusahaan, Isra Mikraj + 2 Holiday Group + 3 Override.
- **Absensi 7 hari**: hadir, terlambat (dengan potongan), cuti, izin, sakit.
- **Lembur**: 4 planning + 4 actual (1 anomali tanpa planning).
- **Payroll**: 20 entri periode berjalan.
- **Notifikasi**: 7 notifikasi lintas kategori.
- **Audit Log**: riwayat perubahan.

## Endpoint Backend yang Dibutuhkan

Untuk integrasi backend nyata, ganti service layer dengan `fetch()` ke API. Signature service tetap sama → UI tidak perlu berubah.

### Master Data
- `GET/POST/PUT/DELETE /api/employees` (dengan soft delete, bulk update)
- `GET/POST/PUT/DELETE /api/outlets`
- `GET/POST/PUT/DELETE /api/positions`
- `GET/POST/PUT/DELETE /api/divisions`
- `GET/POST/PUT /api/domiciles` (dengan geocoding)
- `GET/POST/PUT/DELETE /api/contracts` (dengan extend endpoint)

### Penjadwalan
- `GET/POST/PUT/DELETE /api/shift-templates`
- `GET/POST/PUT/DELETE /api/shift-groups`
- `GET/POST/PUT/DELETE /api/schedules` (dengan generate, copy-week, lock endpoints)
- `GET/POST/PUT/DELETE /api/shift-swaps` (dengan approve/reject)
- `GET/POST/PUT/DELETE /api/holidays`
- `GET/POST/PUT/DELETE /api/holiday-groups`
- `GET/POST/PUT/DELETE /api/holiday-overrides`

### Kehadiran & Lembur
- `GET/POST/PUT/DELETE /api/attendances` (dengan bulk input, recap endpoints)
- `GET/POST/PUT /api/leaves` (dengan approve/reject/cancel endpoints)
- `GET/POST/PUT /api/overtime-plannings` (dengan approve/reject)
- `GET/POST/PUT /api/overtime-actuals` (dengan verify endpoint)

### Payroll & Laporan
- `GET/POST/PUT /api/payrolls` (dengan generate, finalize endpoints)
- `GET/PUT /api/notifications` (dengan mark-read, archive endpoints)
- `GET /api/reports/workforce-summary`
- `GET /api/audit-logs`

## Batasan Prototipe

- **Data in-memory**: data reset saat refresh browser (tidak persisten). Prisma + SQLite tersedia bila ingin persistensi.
- **Tanpa autentikasi**: role HRD sebagai default; tidak ada login/logout.
- **Tanpa GPS/selfie absensi**: absensi diinput oleh HRD, bukan check-in karyawan.
- **Tanpa e-payslip**: payroll hanya preview, tidak dikirim ke karyawan.
- **Import simulasi**: import karyawan menampilkan dialog template (tidak benar-benar parse CSV).
- **Address search Nominatim**: memerlukan koneksi internet untuk cari alamat di map picker.
- **Leaflet client-only**: modul Domisili & Peta dimuat dengan `ssr: false` (dynamic import).

## Rekomendasi Integrasi Backend

1. **Ganti service layer**: setiap fungsi di `src/lib/services/*` diganti dengan `fetch()` ke API nyata. Contoh:
   ```typescript
   // Sebelum (mock)
   list(): Employee[] { return getStore().getState().employees; }
   // Sesudah (backend)
   async list(): Promise<Employee[]> { return (await fetch('/api/employees')).json(); }
   ```
2. **Ganti hook**: `useStore` diganti dengan TanStack Query hooks (`useQuery`, `useMutation`). UI tidak berubah karena signature data tetap sama.
3. **Persistensi**: aktifkan Prisma + SQLite (`src/lib/db.ts`) atau ganti ke PostgreSQL/MySQL.
4. **Autentikasi**: tambah NextAuth.js (sudah terinstall) dengan role-based access.
5. **Notifikasi real-time**: tambah WebSocket (socket.io) untuk push notification.
6. **File upload**: implementasi upload lampiran cuti & bukti lembur ke object storage.
7. **Export PDF**: gunakan server-side PDF generation (puppeteer/pdfkit) untuk laporan resmi.

## Teknologi

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (strict)
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **State**: Zustand pattern via custom `DataStore` + `useSyncExternalStore`
- **Server state**: TanStack Query (tersedia, siap untuk integrasi backend)
- **Table**: TanStack Table 8
- **Charts**: Recharts 2
- **Map**: Leaflet + react-leaflet 5 + OpenStreetMap
- **Form**: React Hook Form + Zod
- **Icons**: Lucide React
- **Toast**: Sonner
- **Theme**: next-themes (light/dark)

---

© JURI HR — Prototipe HRD untuk bisnis bakery & coffee bun multi-outlet.
