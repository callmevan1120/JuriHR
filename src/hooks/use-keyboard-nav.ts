"use client";

import * as React from "react";
import { navigate } from "@/lib/router/use-route";

/**
 * Global keyboard navigation dengan two-key sequence (ala Gmail/GitHub).
 * Tekan `g` lalu huruf kedua untuk navigasi cepat ke modul.
 *
 * Peta shortcut:
 *   g d → Dashboard
 *   g k → Karyawan
 *   g o → Outlet
 *   g p → Posisi & Divisi
 *   g m → Domisili & Peta (map)
 *   g c → Kontrak
 *   g s → Shift Template
 *   g g → Shift Group
 *   g j → Jadwal
 *   g h → Holiday
 *   g a → Absensi
 *   g l → Cuti (leave)
 *   g e → Lembur
 *   g w → Payroll (wallet)
 *   g n → Notifikasi
 *   g r → Laporan (report)
 *   g u → aUdit
 *   g t → pengaTuran
 *
 * Hanya aktif jika tidak sedang mengetik di input/textarea/select.
 */
const NAV_MAP: Record<string, string> = {
  d: "#/",
  k: "#/karyawan",
  o: "#/outlet",
  p: "#/posisi",
  m: "#/domisili",
  c: "#/kontrak",
  s: "#/shift",
  g: "#/shift-group",
  j: "#/jadwal",
  h: "#/libur",
  a: "#/absensi",
  l: "#/cuti",
  e: "#/lembur",
  w: "#/payroll",
  n: "#/notifikasi",
  r: "#/laporan",
  u: "#/audit",
  t: "#/pengaturan",
};

export function useKeyboardNav() {
  const [pendingG, setPendingG] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Abaikan jika sedang mengetik
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }
      // Abaikan jika modifier ditekan (kecuali untuk shortcut yang sudah handle sendiri)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (pendingG) {
        e.preventDefault();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const target = NAV_MAP[key];
        if (target) {
          navigate(target);
        }
        setPendingG(false);
        return;
      }

      if (key === "g") {
        e.preventDefault();
        setPendingG(true);
        // Reset setelah 800ms jika tidak ada key kedua
        timeoutRef.current = setTimeout(() => setPendingG(false), 800);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pendingG]);
}

/** Daftar shortcut untuk ditampilkan di Help dialog. */
export const KEYBOARD_NAV_SHORTCUTS = [
  { keys: ["g", "d"], label: "Dashboard" },
  { keys: ["g", "k"], label: "Karyawan" },
  { keys: ["g", "o"], label: "Outlet" },
  { keys: ["g", "p"], label: "Posisi & Divisi" },
  { keys: ["g", "m"], label: "Domisili & Peta" },
  { keys: ["g", "c"], label: "Kontrak" },
  { keys: ["g", "s"], label: "Shift Template" },
  { keys: ["g", "g"], label: "Shift Group" },
  { keys: ["g", "j"], label: "Jadwal" },
  { keys: ["g", "h"], label: "Holiday" },
  { keys: ["g", "a"], label: "Absensi" },
  { keys: ["g", "l"], label: "Cuti" },
  { keys: ["g", "e"], label: "Lembur" },
  { keys: ["g", "w"], label: "Payroll" },
  { keys: ["g", "n"], label: "Notifikasi" },
  { keys: ["g", "r"], label: "Laporan" },
  { keys: ["g", "u"], label: "Audit Log" },
  { keys: ["g", "t"], label: "Pengaturan" },
];
