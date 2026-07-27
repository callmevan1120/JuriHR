"use client";

import { useSyncExternalStore } from "react";
import { getStore, type DataState } from "@/lib/data/store";

/** Berlangganan ke central store dengan selector. */
export function useStore<T>(selector: (state: DataState) => T): T {
  const store = getStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

/** Ambil seluruh state store. */
export function useDataState(): DataState {
  return useStore((s) => s);
}
