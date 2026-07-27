"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Sun, Moon, Search, Users, Building2, User } from "lucide-react";
import { useTheme } from "next-themes";
import { AppBreadcrumb } from "./app-breadcrumb";
import { NotificationPopover } from "./notification-popover";
import { useStore } from "@/hooks/use-store";
import { navigate } from "@/lib/router/use-route";
import { initials } from "@/lib/utils";

export function AppTopbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  React.useEffect(() => setMounted(true), []);

  // Shortcut Ctrl/Cmd + K
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <SidebarTrigger className="size-9" />
      <Separator orientation="vertical" className="mr-1 h-6" />
      <AppBreadcrumb />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Global search — command palette */}
        <Button
          variant="outline"
          className="hidden h-9 gap-2 px-3 text-sm text-muted-foreground md:flex"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4" />
          <span className="hidden lg:inline">Cari karyawan, outlet...</span>
          <kbd className="ml-2 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium lg:inline">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 md:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label="Cari"
        >
          <Search className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Ganti tema"
        >
          {mounted && theme === "dark" ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </Button>

        <NotificationPopover />

        {/* Profil HRD (mock) */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            HR
          </div>
          <div className="hidden leading-none sm:block">
            <p className="text-xs font-medium text-foreground">HRD Admin</p>
            <p className="text-[10px] text-muted-foreground">Human Resources</p>
          </div>
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Cari karyawan (nama/NIK) atau outlet..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
          <CommandGroup heading="Karyawan">
            {employees.slice(0, 12).map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.fullName} ${e.nik}`}
                onSelect={() => {
                  navigate(`#/karyawan?id=${e.id}`);
                  setSearchOpen(false);
                }}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">
                  {initials(e.fullName)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{e.fullName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{e.nik}</p>
                </div>
                <User className="size-3 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Outlet">
            {outlets.map((o) => (
              <CommandItem
                key={o.id}
                value={o.name + " " + o.code}
                onSelect={() => {
                  navigate(`#/outlet?id=${o.id}`);
                  setSearchOpen(false);
                }}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md bg-info/15 text-info">
                  <Building2 className="size-3" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{o.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{o.code}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
