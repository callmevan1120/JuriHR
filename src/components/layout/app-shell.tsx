"use client";

import * as React from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { RouteView } from "@/components/views/route-view";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav";

export function AppShell() {
  useKeyboardNav();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 flex-1 flex flex-col h-svh overflow-hidden">
        <AppTopbar />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <main className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5 min-w-0">
            <div className="animate-fade-in min-w-0">
              <RouteView />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
