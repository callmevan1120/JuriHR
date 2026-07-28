# AGENTS.md — Konteks & Panduan Pengembangan AI untuk JURI HR

Selamat datang di **JURI HR**, Sistem Manajemen Human Resources (HR) untuk bisnis multi-outlet Bakery & Coffee Bun (**JURI Bun**). File ini berfungsi sebagai rujukan dan pedoman utama bagi AI Assistants (Gemini, Claude, Cursor, AGY, dll.) untuk memahami arsitektur, struktur proyek, pola coding, serta instruksi eksekusi di lingkungan ini.

---

## 1. Ikhtisar Proyek & Domain Bisnis

- **Nama Aplikasi**: JURI HR (Sistem Manajemen HR Multi-Outlet)
- **Bisnis Target**: JURI Bun (Bisnis Bakery & Coffee Bun multi-outlet di wilayah Jabodetabek)
- **Cakupan Entitas Data Mock**:
  - **9 Outlet**: Sudirman (Flagship), Kemang, Pondok Indah, Kelapa Gading, Bekasi, Tangerang, Depok, Bogor, Kebon Jeruk (Kiosk).
  - **6 Divisi**: Operasional Outlet, Produksi, QC, Marketing, HRD, Finance.
  - **12 Posisi**: Kepala Outlet, Supervisor Outlet, Barista, Kasir, Baker, Pramusaji, Crew Produksi, Supervisor Produksi, QC Staff, Marketing Staff, HR Staff, Finance Staff.
  - **56 Karyawan**: 48 karyawan outlet + 8 HQ.
- **Bahasa & Lokalisasi**:
  - Bahasa Antarmuka: Indonesia (`id-ID`)
  - Mata Uang: Indonesian Rupiah (`Rp`, format integer tanpa desimal, misal: `Rp 5.000.000`)
  - Zona Waktu: `Asia/Jakarta` (WIB)

---

## 2. Tech Stack & Arsitektur

### Core Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI Library & Components**: React 19, Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Visualisasi & Peta**: Recharts (Chart & Grafik Dashboard/Laporan), Leaflet & React-Leaflet (Peta Domisili & Geofencing)
- **Database & ORM**: Prisma ORM v6 dengan SQLite (`db/custom.db`, schema `prisma/schema.prisma`)

### State Management & Navigation Architecture
- **Central DataStore**: Single source of truth berbasis in-memory singleton (`src/lib/data/store.ts`) dengan `useSyncExternalStore` dan shallow comparison cache (`src/hooks/use-store.ts`).
- **Data Persistence**: Semua mutasi data melalui **Service Layer** (`src/lib/services/*`) yang secara otomatis:
  1. Memperbarui `DataStore` in-memory.
  2. Memicu event listener untuk re-render komponen yang ter-subscribe.
  3. Mencatat riwayat ke **Audit Log** (`audit.ts`).
- **Routing**: Single Page Application (SPA) berbasis Hash Router kustom (`src/lib/router/use-route.ts` & `src/lib/router/routes.ts`). Komponen view dimuat secara terpusat dari `src/components/views/`.

---

## 3. Struktur Direktori Proyek

```
JuriHR/
├── AGENTS.md                  # Context AI file ini
├── README.md                  # Dokumentasi proyek & daftar modul
├── worklog.md                 # Log progress pengerjaan proyek
├── package.json               # Dependensi & script proyek
├── tsconfig.json              # Konfigurasi TypeScript
├── tailwind.config.ts         # Konfigurasi Tailwind CSS
├── postcss.config.mjs         # Konfigurasi PostCSS
├── components.json            # Konfigurasi shadcn/ui
├── Caddyfile                  # Konfigurasi Caddy web server
├── db/
│   └── custom.db              # Database SQLite
├── prisma/
│   └── schema.prisma          # Schema Prisma Database
├── src/
│   ├── app/                   # Next.js App Router root
│   │   ├── layout.tsx         # Root layout (ThemeProvider, QueryProvider)
│   │   ├── page.tsx           # Entry point → AppShell
│   │   └── globals.css        # Design tokens & CSS Variables
│   ├── components/
│   │   ├── layout/            # AppShell, Sidebar, Topbar, Breadcrumbs, Notifications
│   │   ├── common/            # DataTable, StatusBadge, PageHeader, EmptyState, Field, dll.
│   │   ├── dashboard/         # StatCard, Charts, RecentActivity
│   │   ├── providers/         # ThemeProvider, QueryProvider
│   │   ├── ui/                # Komponen UI primitive (shadcn/ui)
│   │   └── views/             # 17 Modul Tampilan Utama:
│   │       ├── dashboard-view.tsx
│   │       ├── employees-view.tsx & employee-detail.tsx & employee-form-dialog.tsx
│   │       ├── outlet-view.tsx
│   │       ├── positions-view.tsx
│   │       ├── domicile-view.tsx & domicile-editor.tsx & employee-mini-map.tsx
│   │       ├── contracts-view.tsx
│   │       ├── shift-templates-view.tsx
│   │       ├── shift-groups-view.tsx
│   │       ├── schedule-view.tsx
│   │       ├── holiday-view.tsx
│   │       ├── attendance-view.tsx
│   │       ├── leave-view.tsx
│   │       ├── overtime-view.tsx
│   │       ├── payroll-view.tsx
│   │       ├── notification-view.tsx
│   │       ├── reports-view.tsx
│   │       ├── audit-view.tsx
│   │       ├── settings-view.tsx
│   │       └── route-view.tsx
│   ├── hooks/
│   │   ├── use-store.ts       # Hook penyambung komponen ke DataStore
│   │   └── use-mobile.ts      # Responsiveness helper hook
│   └── lib/
│       ├── types/             # Type definitions domain (Employee, Outlet, Shift, Payroll, dll.)
│       ├── data/
│       │   ├── store.ts       # Singleton DataStore in-memory
│       │   └── seed.ts        # Mock deterministic seed data
│       ├── services/
│       │   ├── master-data.ts # Service Employee, Outlet, Position, Division, Domicile, Contract
│       │   ├── schedule.ts    # Service Shift, ShiftGroup, Schedule, Holiday, ShiftSwap
│       │   ├── workforce.ts   # Service Attendance, Leave, Overtime + Anomali
│       │   ├── finance.ts     # Service Payroll, Notification, Report
│       │   ├── dashboard.ts   # Agregasi data metrik & statistik dashboard
│       │   └── audit.ts       # Audit logging utility
│       ├── router/
│       │   ├── routes.ts      # Definisi 17 rute & navigasi
│       │   └── use-route.ts   # Client hash-router hook
│       ├── db.ts              # Instansiasi Prisma Client
│       └── utils.ts           # Helper (formatRupiah, formatDate, Haversine distance, dll.)
```

---

## 4. Brand Design Tokens & System

Saat menambah atau mengubah UI, wajib mematuhi skema warna dan token desain brand **JURI Bun**:

| Token | Hex / Value | Penggunaan |
|-------|-------------|------------|
| **Primary** | `#FCBA0C` | Warna aksen utama, tombol primer, badge aktif |
| **Dark Brown** | `#3A2518` | Teks utama, background footer/sidebar |
| **Cream** | `#FFF8E7` | Background permukaan sekunder, card accent |
| **Surface** | `#FFFDF8` | Background utama aplikasi |
| **Muted** | `#74665D` | Teks sekunder, subtitle, label subtle |
| **Border** | `#EADFCB` | Border komponen, divider, tabel |
| **Border Radius** | `12px` (`rounded-xl` / `rounded-lg`) | Sudut komponen |

---

## 5. Instruksi Environment & Executable Commands (Windows OS)

Komputer ini menggunakan **Windows OS**. Karena kebijakan eksekusi PowerShell (`ExecutionPolicy`), perintah skrip `.ps1` diblokir secara bawaan. Oleh karena itu, AI harus selalu menggunakan executable bawaan CMD/binary `npm.cmd` dan `npx.cmd`.

### Perintah Utama:
- **Install Dependencies**:
  ```powershell
  npm.cmd install
  ```
- **Menjalankan Dev Server (Port 3000)**:
  ```powershell
  npm.cmd run dev
  ```
- **Type Checking (TypeScript)**:
  ```powershell
  npx.cmd tsc --noEmit
  ```
- **Linting**:
  ```powershell
  npm.cmd run lint
  ```
- **Build Production**:
  ```powershell
  npm.cmd run build
  ```
- **Prisma Database**:
  ```powershell
  npx.cmd prisma generate
  npx.cmd prisma db push
  ```

---

## 6. Panduan & Aturan Coding untuk AI Agent

1. **JANGAN melakukan mutasi state langsung**: Selalu gunakan fungsi dari Service Layer (`src/lib/services/*`) untuk menambah/mengubah data. Hal ini memastikan Audit Log tercatat dan komponen UI memperbarui tampilan secara konsisten.
2. **Konsistensi Data**: Ketika membuat fitur baru, perhatikan dampaknya ke modul lain (misal: persetujuan cuti memotong saldo cuti & meng-update kalender absensi; perpanjangan kontrak menambah riwayat kontrak).
3. **Format Data**:
   - Uang: Selalu gunakan `formatRupiah()` dari `src/lib/utils.ts`.
   - Tanggal: Selalu format sesuai standar Indonesia menggunakan helper di `src/lib/utils.ts`.
4. **Navigasi Rute**: Gunakan hook `useRoute()` dari `src/lib/router/use-route.ts` untuk manipulasi rute hash (`#dashboard`, `#employees`, dll.).
5. **Eksekusi Perintah**: Selalu gunakan `npm.cmd` / `npx.cmd` jika mengeksekusi CLI di lingkungan Windows.
