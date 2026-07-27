"use client";

import { useSyncExternalStore, useRef } from "react";
import { getStore, type DataState } from "@/lib/data/store";

/** Cek kesetaraan dangkal (Object.is per elemen untuk array). */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }
  if (
    typeof a === "object" &&
    typeof b === "object" &&
    a !== null &&
    b !== null
  ) {
    const ka = Object.keys(a as Record<string, unknown>);
    const kb = Object.keys(b as Record<string, unknown>);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      if (
        !Object.is(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k],
        )
      )
        return false;
    }
    return true;
  }
  return false;
}

/**
 * Berlangganan ke central store dengan selector.
 *
 * Selector boleh melakukan `.filter()` / `.map()` (menghasilkan array baru);
 * hook ini memakai shallow equality agar referensi tetap stabil selama
 * konten tidak berubah, mencegah infinite loop di useSyncExternalStore.
 */
export function useStore<T>(selector: (state: DataState) => T): T {
  const store = getStore();
  const lastRef = useRef<{ value: T | undefined; initialized: boolean }>({
    value: undefined,
    initialized: false,
  });

  const getSnap = (): T => {
    const value = selector(store.getState());
    const last = lastRef.current;
    if (!last.initialized || !shallowEqual(last.value, value)) {
      last.value = value;
      last.initialized = true;
    }
    return last.value as T;
  };

  return useSyncExternalStore(store.subscribe, getSnap, getSnap);
}

/** Ambil seluruh state store. */
export function useDataState(): DataState {
  return useStore((s) => s);
}
