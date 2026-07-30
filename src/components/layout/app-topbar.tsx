"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Sun, Moon, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { AppBreadcrumb } from "./app-breadcrumb";
import { NotificationPopover } from "./notification-popover";
import { useStore } from "@/hooks/use-store";
import { navigate } from "@/lib/router/use-route";

export function AppTopbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 shrink-0 flex h-12 sm:h-14 items-center gap-1.5 border-b border-border/60 bg-background/85 px-2 sm:px-4 lg:px-6 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
        <SidebarTrigger className="size-8 shrink-0 md:hidden -ml-1" />
        <AppBreadcrumb />
        <div className="flex items-center gap-0.5 sm:gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 sm:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="Cari"
          >
            <Search className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-3.5" />
            <span className="hidden lg:inline">Cari...</span>
            <kbd className="ml-0.5 hidden rounded border border-border bg-muted/60 px-1 py-px text-[9px] font-medium text-muted-foreground lg:inline">
              ⌘K
            </kbd>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Ganti tema"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          <NotificationPopover />
        </div>
      </header>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Cari karyawan, outlet, atau modul..." />
        <CommandList>
          <CommandEmpty>Tidak ditemukan.</CommandEmpty>
          <CommandGroup heading="Modul Cepat">
            {[
              { label: "Dashboard", path: "#/dashboard" },
              { label: "Data Karyawan", path: "#/karyawan" },
              { label: "Outlet Cabang", path: "#/outlet" },
              { label: "Kalender Jadwal", path: "#/jadwal" },
              { label: "Absensi Harian", path: "#/absensi" },
              { label: "Penggajian / Payroll", path: "#/payroll" },
            ].map((m) => (
              <CommandItem
                key={m.path}
                onSelect={() => { navigate(m.path); setSearchOpen(false); }}
              >
                <span>{m.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Karyawan">
            {employees.slice(0, 6).map((e) => (
              <CommandItem key={e.id} onSelect={() => { navigate("#/karyawan"); setSearchOpen(false); }}>
                <span>{e.fullName}</span>
                <span className="ml-auto text-xs text-muted-foreground">{e.nik}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Outlet">
            {outlets.slice(0, 6).map((o) => (
              <CommandItem key={o.id} onSelect={() => { navigate("#/outlet"); setSearchOpen(false); }}>
                <span>{o.name.replace("JURI Bun \u2014 ", "")}</span>
                <span className="ml-auto text-xs text-muted-foreground">{o.code}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
