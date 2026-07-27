"use client";

import * as React from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { useRoute } from "@/lib/router/use-route";
import { findNavItem } from "@/lib/router/routes";
import { DashboardView } from "@/components/views/dashboard-view";
import { ComingSoon } from "@/components/common/coming-soon";

export function AppShell() {
  const route = useRoute();
  const item = findNavItem(route.path);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <div className="flex flex-1 flex-col">
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6 sm:py-6">
            {route.path === "#/" ? (
              <DashboardView />
            ) : item ? (
              item.available ? (
                // Modul tersedia — di fase berikutnya akan dirender di sini.
                <ComingSoon item={item} />
              ) : (
                <ComingSoon item={item} />
              )
            ) : (
              // Unknown route -> fallback ke dashboard
              <DashboardView />
            )}
          </main>
          <footer className="mt-auto border-t border-border bg-card px-4 py-3 sm:px-6">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
              <p>
                © {new Date().getFullYear()} JURI HR — Sistem Manajemen HR
                Bakery &amp; Coffee Bun
              </p>
              <p className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-success" />
                Prototipe Fase 1 · Data mock terpusat
              </p>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
