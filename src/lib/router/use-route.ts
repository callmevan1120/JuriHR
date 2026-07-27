"use client";

import * as React from "react";

/** Parse hash menjadi path, mis. "#/karyawan?filter=aktif" -> { path: "#/karyawan", query } */
export interface ParsedRoute {
  path: string;
  query: URLSearchParams;
  hash: string;
}

function parseHash(rawHash: string): ParsedRoute {
  let h = rawHash || "#/";
  if (!h.startsWith("#")) h = "#" + h;
  if (h === "#" || h === "#/") return { path: "#/", query: new URLSearchParams(), hash: h };
  // Pisahkan query string
  const qIndex = h.indexOf("?");
  let path = h;
  let query = new URLSearchParams();
  if (qIndex >= 0) {
    path = h.slice(0, qIndex);
    query = new URLSearchParams(h.slice(qIndex + 1));
  }
  return { path, query, hash: h };
}

/** Hook untuk membaca route saat ini (hash-based). */
export function useRoute(): ParsedRoute {
  const [route, setRoute] = React.useState<ParsedRoute>(() =>
    parseHash(typeof window !== "undefined" ? window.location.hash : "#/"),
  );

  React.useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener("hashchange", onChange);
    // Pastikan ada hash awal
    if (!window.location.hash) {
      window.location.hash = "#/";
    }
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

/** Navigasi ke path tertentu. */
export function navigate(path: string): void {
  if (typeof window === "undefined") return;
  if (window.location.hash === path) {
    // trigger manual jika sama
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = path;
  }
}
