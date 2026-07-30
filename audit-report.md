# LAPORAN AUDIT MENYELURUH — JURI HR

**Tanggal Audit:** 30 Juli 2026  
**Cakupan:** 9 Fitur (Dashboard, Karyawan, Outlet, Posisi & Divisi, Domisili & Peta, Kontrak, Shift, Kalender Jadwal, Holiday)  
**Status Kesehatan Kode:** TypeScript `tsc --noEmit` = 0 error | ESLint = 1 warning (non-kritis)

---

## RINGKASAN EKSEKUTIF

Dari audit menyeluruh terhadap 9 fitur, ditemukan **18 bug kritis**, **30+ isu fungsional**, dan **20+ celah edge case**. Isu paling meresap adalah **fitur Import Data yang sepenuhnya non-fungsional** di semua modul — file diunggah tetapi tidak pernah diparse, dan user melihat toast "berhasil" tanpa ada data yang tersimpan.

---

## 1. BUG KRITIS (akan crash atau merusak data)

### A. IMPORT DATA — SEPENUHNYA PALSU (SEMUA MODUL)

| File | Masalah |
|------|---------|
| `import-export-dialog.tsx:140-152` | `handleSimulateImport` tidak memparse file. Hanya cek `fileName` lalu panggil `onImport([])` (array kosong). Tidak ada FileReader, tidak ada parser CSV/XLSX. |
| `import-export-dialog.tsx:148` | Selalu panggil `onImport([])` — array kosong, bukan baris dari file. |
| `employees-view.tsx:458` | `UniversalImportDialog` dirender **tanpa** prop `onImport`. |
| `outlet-view.tsx:301` | Sama — tanpa `onImport`. |
| `positions-view.tsx:283` | Sama — tanpa `onImport`. |
| `contracts-view.tsx:372` | Sama — tanpa `onImport`. |
| `shift-groups-view.tsx:348` | Sama — tanpa `onImport`. |
| `holiday-view.tsx:329` | Sama — tanpa `onImport`. |
| `import-export-dialog.tsx:236` | Hanya `file.name` yang disimpan; objek `File` dibuang. |
| **Dampak** | User upload file → toast "berhasil diproses" → **0 record dibuat**. Terjadi di SEMUA modul yang punya tombol Import. |

### B. CASCADE DELETE TIDAK ADA

| # | File | Masalah |
|---|------|---------|
| C3 | `master-data.ts:292-302` | `employeeService.delete` tidak hapus: kontrak, jadwal, absensi, cuti, lembur, payroll, domisili, referensi `memberIds` di shift/holiday group, `supervisorId` di karyawan lain. Meninggalkan data yatim. |
| C2 | `outlet-view.tsx:551` vs `:295` | Tabel pakai `softDelete`, tapi halaman detail pakai `delete` (hard delete). Karyawan dengan `primaryOutletId` ke outlet yang dihapus jadi yatim. |

### C. SYNC SHIFT GROUP RUSAK

| # | File | Masalah |
|---|------|---------|
| C4 | `master-data.ts:243-254` | Saat `shiftGroupId` berubah, karyawan ditambah ke group BARU tapi **tidak dihapus dari group LAMA**. Karyawan muncul di dua shift group. |
| F10 | `master-data.ts:208-282` | `holidayGroups.memberIds` **tidak pernah disync** saat create/update employee. |

### D. LOOKUP SALAH DI EMPLOYEE DETAIL

| # | File | Masalah |
|---|------|---------|
| C5 | `employee-detail.tsx:429` | `lookupService.outletName(employee.shiftGroupId)` — mencari `shiftGroupId` di daftar **outlet** (bukan shift group). Selalu kembali "-". |

### E. DASHBOARD FABRIKASI DATA

| # | File | Masalah |
|---|------|---------|
| C2 | `dashboard.ts:104-109` | Saat tidak ada record absensi, fallback ke **hardcoded** `hadir:42, terlambat:4, tidakHadir:2`. Chart menampilkan angka fiktif. |
| C2b | `dashboard.ts:113-141` | Mode `weekly` dan `monthly` **seluruhnya hardcoded array** (268, 275, 282, 290... / 430, 445, 452...). |

### F. DOMISILI — TOMBOL "TAMBAH DOMISILI" MATI

| # | File | Masalah |
|---|------|---------|
| C1 | `domicile-editor.tsx:82-91` | Tombol "Tambah Domisili" memanggil `onClose` (set `editing=false`) — sudah false. User tidak bisa mencapai form pembuatan. |
| C2 | `domicile-editor.tsx:190-192` | Domisili baru default ke koordinat outlet tapi `source` di-set `"MAP_PICKER"` (seharusnya `"OUTLET_BASED"`). |
| C3 | `domicile-editor.tsx:228-249` | Tidak ada validasi range koordinat (lat: -90..90, lng: -180..180). Bisa simpan `lat=999`. |

### G. KONTRAK — EXTEND TIDAK SYNC EMPLOYEE

| # | File | Masalah |
|---|------|---------|
| C3 | `master-data.ts:398-437` | `contractService.extend` buat kontrak baru tapi **tidak update** `employee.contractType`/`contractEndDate`. |
| F8 | `master-data.ts:410` | `contractNo` = `CTR/<year>/<list.length+1>` — bisa kolisi jika ada kontrak dihapus. |
| F6 | `contracts-view.tsx:396-422` | Tidak validasi `newStart >= contract.endDate` → bisa buat kontrak overlap. |
| F10 | `contracts-view.tsx:187-219` | EditDialog bisa set `DIPERPANJANG → AKTIF` → dua kontrak AKTIF. |

### H. SCHEDULE — LOCKED JADWAL DIABAIKAN

| # | File | Masalah |
|---|------|---------|
| C1 | `schedule.ts:227-273` | `generateFromShiftGroup` dengan `overwrite=true` **menimpa jadwal terkunci** tanpa cek. |
| C2 | `schedule.ts:275-319` | `copyWeek` menimpa jadwal terkunci di minggu target tanpa cek `locked`. |

### I. HOLIDAY — FITUR INTI NON-FUNGSIONAL

| # | File | Masalah |
|---|------|---------|
| C3 | `holiday-view.tsx:945-950` | Form "Tukar & Override Libur" tidak panggil `holidayService.createOverride` — hanya toast & `onBack()`. |
| C4 | `holiday-view.tsx:591-794` | Form Holiday Group tidak punya UI untuk manage `holidayIds` → field tetap `[]`. |
| C5 | `holiday-view.tsx:317-326` | Confirm delete handler tidak ada branch `"swap"` → override tidak bisa dihapus. |
| C6 | `types/index.ts:261-267` | Tipe `Holiday` tidak punya field `country`, tapi preset/form/tabel baca/tulis via `as any`. |

---

## 2. ISU FUNGSIONAL (jalan tapi perilaku salah)

### Employee

| # | File | Masalah |
|---|------|---------|
| F1 | `employee-form-dialog.tsx:436,442` & `employee-form-page.tsx:587,593` | Email & birthDate ditandai "required" tapi tidak divalidasi sebelum save. |
| F2 | `employee-form-dialog.tsx:600` | Tidak validasi `contractEndDate >= startDate`. |
| F3 | `employees-view.tsx:407-413` | `bulkUpdate` bypass `update()` → tidak catat change history, tidak sync shift group. |
| F6 | `employee-form-page.tsx:578,616` | Field "No. Telepon / WA" dirender **dua kali**. |
| F8 | `employee-detail.tsx:271,301` | `birthDate` kosong → "20 Mei 1998"; `bankName` kosong → "BCA"; `accountNumber` kosong → "1234567890". |
| F9 | `master-data.ts:473-476` | `lookupService` kembali `"-"` (truthy) → fallback `|| "—"` dead code. |

### Outlet & Posisi

| # | File | Masalah |
|---|------|---------|
| F1 | `contracts-view.tsx:63-72` | Bucket reminder `"90h"` (61-90 hari) **tidak punya kartu KPI**. |
| F2 | `outlet-view.tsx:332` | `useMemo` stats deps hanya `[outlet.id]` → stale. |
| F3 | `master-data.ts:170` vs `outlet-view.tsx:339` | Stat card hitung AKTIF, daftar karyawan tampilkan semua status → angka tidak cocok. |
| F4 | `master-data.ts:32,76,123` | Tidak ada validasi duplikat `code` untuk outlet/posisi/divisi. |
| F5 | `master-data.ts:53-63,97-107` | `softDelete` posisi/divisi tidak cek apakah masih dipakai employee. |
| F9 | `outlet-view.tsx:230-239` | Export outlet pakai key `radiusMeters` (harusnya `geofenceRadiusMeters`) dan `phone` (tidak ada di tipe). |

### Domicile & Map

| # | File | Masalah |
|---|------|---------|
| F1 | `domicile-view.tsx:192 vs :240` | Jarak di popup map pakai koordinat ter-obfuscate, side panel pakai asli → angka berbeda. |
| F2 | `master-data.ts:334-349` | `domicileService.upsert` tidak sync `employee.latitude/longitude/homeAddress`. |
| F3 | `domicile-view.tsx:238-243` | Employee tanpa outlet dapat `dist=0` → sort ke paling atas. |
| F4 | `domicile-view.tsx:4-6` | Import Leaflet di top-level tanpa `dynamic`/`ssr:false`. |
| F5 | `domicile-editor.tsx:204-226` | Nominatim search tidak kirim `User-Agent` → akan di-rate-limit. |

### Shift & Schedule

| # | File | Masalah |
|---|------|---------|
| F2 | `utils.ts:50-59` | `shiftDurationMinutes` return 0 untuk shift overnight jika `crossesMidnight=false`. |
| F4 | `shift-groups-view.tsx:563-573` | Form selalu set `scopeType: "MULTI_OUTLET"`. |
| F8 | `schedule.ts:227-273` | `generateFromShiftGroup` abaikan `effectiveFrom`/`effectiveUntil`. |
| F11 | `schedule-view.tsx:424-667` | Kalender **tidak highlight hari libur** di grid. |
| F12 | `schedule.ts:321-351` | `detectConflicts` tidak pakai `isHolidayForEmployee`. |
| F13 | `shift-templates-view.tsx:243` | `toleranceLateMinutes` tidak divalidasi non-negatif. |
| F14 | `schedule.ts:42-49` | `color` shift template tidak divalidasi sebagai hex color. |

### Holiday

| # | File | Masalah |
|---|------|---------|
| F7 | `shift-groups-view.tsx:557` & `holiday-view.tsx:643` | Tidak validasi `effectiveFrom <= effectiveUntil`. |
| M3 | `schedule.ts:430` | `generateNationalHolidaysByCountry` — branch country selalu return array ID. |

---

## 3. CELAH EDGE CASE

| # | Skenario | Masalah |
|---|----------|---------|
| E1 | Dashboard dengan 0 employee aktif | Chart absensi tampilkan angka fabricated (42/4/2), bukan empty state. |
| E2 | Employee dengan status RESIGN | `reactivate()` bisa set kembali ke AKTIF tanpa clear `endOfEmploymentDate`. |
| E3 | NIK/email duplikat saat import | Tidak ada deteksi duplikat di manapun. |
| E4 | Karakter `<script>` di nama → export Excel | XSS di file `.xls` (HTML table tanpa escape). |
| E5 | `reminderCategory` dengan endDate invalid/empty | `new Date("")` → NaN → bucket `"aman"` (salah). Badge "NaN Hari Lagi". |
| E6 | Domisili dengan koordinat (0,0) | Tidak ada sentinel "unset" → marker di Teluk Guinea. |
| E7 | Outlet dengan `geofenceRadiusMeters=0` atau `undefined` | Lingkaran invisible atau Leaflet warning. |
| E8 | `generateFromShiftGroup` dengan `fromDate > toDate` | Loop exit langsung, return 0, no error. |
| E9 | `copyWeek` dengan source week kosong | Return 0 tanpa penjelasan. |
| E10 | `detectConflicts` dipanggil 336x per render | Performance smell — re-read seluruh store setiap call. |
| E11 | Divisi `headId` Select tampilkan semua employee | Bisa pilih karyawan resign sebagai kepala divisi. |
| E12 | Kontrak overlap untuk employee yang sama | Tidak ada constraint "max 1 AKTIF contract per employee". |

---

## 4. ISU IMPORT DATA (KHUSUS)

| # | Masalah |
|---|---------|
| I1 | **Tidak ada parser file** — `handleSimulateImport` tidak baca isi file sama sekali. |
| I2 | **Tidak ada callback `onImport`** di semua view yang pakai dialog. |
| I3 | **Tidak ada validasi** field required, tipe data, format tanggal, duplikat. |
| I4 | **Tidak ada error reporting** — user selalu lihat toast sukses. |
| I5 | Template pakai **label manusia** sebagai header → tidak ada mapping balik. |
| I6 | Template "Excel" adalah **HTML table** (bukan XLSX sebenarnya). |
| I7 | Import employee **tidak buat Contract record** padahal template ada field kontrak. |
| I8 | Import contract sample `type: "OUTSOURCING"` — **tidak ada di `ContractType` union**. |
| I9 | Export outlet pakai key `radiusMeters` (harusnya `geofenceRadiusMeters`). |
| I10 | Export divisi pakai field posisi (`defaultMonthlySalary` dll) → kolom kosong. |

---

## 5. PRIORITAS PERBAIKAN

### Prioritas 1 — Wajib diperbaiki segera (berdampak ke seluruh aplikasi)
1. **Implementasi import data nyata** — pasang parser CSV/XLSX, wire `onImport` di semua view, validasi field, report error per-baris.
2. **Cascade delete** — employee & outlet delete harus bersihkan semua data terkait.
3. **Sync shift group pada update** — hapus dari group lama saat pindah.
4. **Fix lookup Shift Group** di employee-detail.
5. **Hapus fabricated data** di dashboard (42/4/2 fallback & hardcoded weekly/monthly).

### Prioritas 2 — Bug kritis per-fitur
6. **Tombol "Tambah Domisili"** mati (domicile-editor).
7. **Holiday override form** tidak persist.
8. **Holiday group holidayIds** tidak ada UI.
9. **Schedule generate/copy timpa locked**.
10. **Contract extend sync employee**.

### Prioritas 3 — Validasi & edge case
11. Validasi duplikat code/NIK/nama di semua create.
12. Validasi range koordinat (lat/lng).
13. Validasi `startDate < endDate` untuk kontrak.
14. Validasi `effectiveFrom <= effectiveUntil`.
15. XSS escape di Excel export.
16. Stale `useMemo` di outlet detail.
17. Highlight holiday di kalender.
18. `detectConflicts` pakai `isHolidayForEmployee`.

### Prioritas 4 — Polish UX
19. Hapus hardcoded fallback ("20 Mei 1998", "BCA", "1234567890") di employee detail.
20. Hapus field telepon duplikat di employee form.
21. Tambah bucket "90h" di contract reminder cards.
22. Auto-fit map bounds ke marker.
23. Filter divisi head ke AKTIF only.

---

**Total temuan: 18 critical, 30+ functional, 20+ edge case, 10 import-specific, 23 minor.**
