"use client";

import * as React from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { RouteView } from "@/components/views/route-view";

export function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <div className="flex flex-1 flex-col">
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6 sm:py-6">
            <RouteView />
          </main>
          <footer className="mt-auto border-t border-border bg-card px-4 py-3 sm:px-6">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
              <p>
                © {new Date().getFullYear()} JURI HR — Sistem Manajemen HR
                Bakery &amp; Coffee Bun
              </p>
              <p className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-success" />
                Prototipe Fase 2 · Core HR &amp; Master Data
              </p>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
