"use client";

import * as React from "react";

/** Parse hash menjadi path, mis. "#/karyawan?filter=aktif" -> { path: "#/karyawan", query } */
export interface ParsedRoute {
  path: string;
  query: URLSearchParams;
  hash: string;
}

export function parseHash(rawHash: string): ParsedRoute {
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

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}

function getSnapshot() {
  return typeof window !== "undefined" ? window.location.hash : "#/";
}

function getServerSnapshot() {
  return "#/";
}

/** Hook berbasis useSyncExternalStore untuk merespons perubahan rute URL hash secara real-time */
export function useRoute(): ParsedRoute {
  const rawHash = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return React.useMemo(() => parseHash(rawHash), [rawHash]);
}

/** Navigasi ke path tertentu. */
export function navigate(path: string): void {
  if (typeof window === "undefined") return;
  if (window.location.hash === path) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = path;
  }
}
