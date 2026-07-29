import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// Format helpers — Bahasa Indonesia, Asia/Jakarta
// ============================================================

const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NUMBER_ID = new Intl.NumberFormat("id-ID");

/** Format angka ke Rupiah tanpa desimal. */
export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) return "Rp 0";
  return RUPIAH.format(Math.round(value));
}

/** Format angka biasa dengan pemisah ribuan id-ID. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return NUMBER_ID.format(value);
}

/** Format durasi menit menjadi "Xj Ym" atau "Ym". */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}j`;
  return `${h}j ${m}m`;
}

/** Parse "HH:mm" ke menit sejak tengah malam. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Hitung selisih durasi menit antara start dan end, mendukung tengah malam. */
export function shiftDurationMinutes(
  start: string,
  end: string,
  crossesMidnight: boolean,
): number {
  const s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (crossesMidnight && e <= s) e += 24 * 60;
  return Math.max(0, e - s);
}

// ============================================================
// Tanggal — zona Asia/Jakarta
// ============================================================

export const JAKARTA_TZ = "Asia/Jakarta";

/** Tanggal hari ini sebagai ISO date "YYYY-MM-DD" di zona Jakarta. */
export function todayISODate(): string {
  return toISODate(new Date());
}

/** Konversi Date ke "YYYY-MM-DD" berbasis zona Jakarta. */
export function toISODate(date: Date): string {
  // Gunakan Intl untuk mendapatkan bagian tanggal di zona Jakarta.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/** Tambah hari ke ISO date string. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Selisih hari antara dua ISO date (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86_400_000);
}

const DATE_LONG = new Intl.DateTimeFormat("id-ID", {
  timeZone: JAKARTA_TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATE_MED = new Intl.DateTimeFormat("id-ID", {
  timeZone: JAKARTA_TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATETIME_MED = new Intl.DateTimeFormat("id-ID", {
  timeZone: JAKARTA_TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const WEEKDAY_SHORT = new Intl.DateTimeFormat("id-ID", {
  timeZone: JAKARTA_TZ,
  weekday: "short",
});

/** "12 Januari 2025" */
export function formatDateLong(iso?: string): string {
  if (!iso) return "-";
  try {
    return DATE_LONG.format(new Date(iso));
  } catch {
    return iso;
  }
}

/** "12 Jan 2025" */
export function formatDateMed(iso?: string): string {
  if (!iso) return "-";
  try {
    return DATE_MED.format(new Date(iso));
  } catch {
    return iso;
  }
}

/** "12 Jan 2025, 08:30" */
export function formatDateTimeMed(iso?: string): string {
  if (!iso) return "-";
  try {
    return DATETIME_MED.format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Hari pendek: "Sen", "Sel", ... */
export function weekdayShort(iso: string): string {
  try {
    return WEEKDAY_SHORT.format(new Date(iso));
  } catch {
    return "";
  }
}

/** Nama bulan pendek dari periode "YYYY-MM". */
export function monthLabel(period: string): string {
  const [y, m] = period.split("-");
  const idx = Number(m) - 1;
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${names[idx] ?? ""} ${y}`;
}

// ============================================================
// Geolokasi — Haversine
// ============================================================

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Format jarak: < 1km tampilkan meter. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Bulatkan koordinat untuk menyamarkan lokasi karyawan pada peta umum. */
export function obfuscateCoord(value: number, decimals = 3): number {
  return Number(value.toFixed(decimals));
}

/** Ekstrak koordinat Latitude & Longitude dari berbagai format URL / link Google Maps & teks koordinat. */
export function parseGoogleMapsCoordinates(urlOrText: string): { lat: number; lon: number } | null {
  if (!urlOrText || !urlOrText.trim()) return null;
  const input = urlOrText.trim();

  // 1. Ekstrak dari parameter Google Maps share/embed: !3d-6.1953!4d106.8231
  const d3d4 = input.match(/!3d(-?\d+\.\d+).*?!4d(-?\d+\.\d+)/);
  if (d3d4) {
    const lat = Number(d3d4[1]);
    const lon = Number(d3d4[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }

  const d2d3 = input.match(/!2d(-?\d+\.\d+).*?!3d(-?\d+\.\d+)/);
  if (d2d3) {
    const lat = Number(d2d3[2]);
    const lon = Number(d2d3[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }

  // 2. Ekstrak dari URL berformat @: @-6.1953,106.8231 atau /@-6.1953,106.8231,17z
  const atMatch = input.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lon = Number(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }

  // 3. Ekstrak dari query parameter: ?q=-6.1953,106.8231 atau ?q=-6.1953%2C106.8231 atau ll=-6.1953,106.8231 atau query=-6.1953,106.8231
  const queryMatch = input.match(/(?:q|ll|place|search|center|query)=(-?\d+\.\d+)(?:%2C|,|\s+)(-?\d+\.\d+)/i);
  if (queryMatch) {
    const lat = Number(queryMatch[1]);
    const lon = Number(queryMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }

  // 4. Ekstrak dari path URL dir//-6.1953,106.8231 atau /place/-6.1953,106.8231
  const dirMatch = input.match(/(?:dir|place|maps)\/\/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i);
  if (dirMatch) {
    const lat = Number(dirMatch[1]);
    const lon = Number(dirMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }

  // 5. Ekstrak dari koordinat (-6.xxxx, 106.xxxx) mentah
  const rawMatch = input.match(/(-?\d{1,2}\.\d+)\s*[%2C,\s]\s*(-?\d{1,3}\.\d+)/);
  if (rawMatch) {
    const lat = Number(rawMatch[1]);
    const lon = Number(rawMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }

  return null;
}

// ============================================================
// Lain-lain
// ============================================================

/** Buat id sederhana berbasis counter + waktu. */
let _idCounter = 0;
export function uid(prefix = "id"): string {
  _idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${_idCounter.toString(36)}`;
}

/** Sleep helper untuk simulasi latensi API. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Inisial dari nama untuk avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
