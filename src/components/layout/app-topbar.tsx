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
import { Sun, Moon, Search, Users, Building2, User, HelpCircle, FileText, Palmtree, Clock, Wallet, LayoutDashboard, ArrowRight, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [helpOpen, setHelpOpen] = React.useState(false);
  const employees = useStore((s) => s.employees);
  const outlets = useStore((s) => s.outlets);
  const contracts = useStore((s) => s.contracts);
  const leaves = useStore((s) => s.leaves);
  const overtimePlannings = useStore((s) => s.overtimePlannings);
  const payrolls = useStore((s) => s.payrolls);
  React.useEffect(() => setMounted(true), []);

  // Shortcut Ctrl/Cmd + K (search) dan ? (help)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      // ? untuk help (hanya jika bukan sedang mengetik di input)
      if (e.key === "?" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setHelpOpen(true);
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

        <Button
          variant="ghost"
          size="icon"
          className="hidden size-9 rounded-full sm:inline-flex"
          onClick={() => setHelpOpen(true)}
          aria-label="Bantuan"
        >
          <HelpCircle className="size-5" />
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
        <CommandInput placeholder="Cari karyawan, outlet, kontrak, cuti, lembur, payroll, atau navigasi..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
          <CommandGroup heading="Navigasi Cepat">
            {[
              { label: "Dashboard", href: "#/", icon: LayoutDashboard },
              { label: "Data Karyawan", href: "#/karyawan", icon: Users },
              { label: "Kalender Jadwal", href: "#/jadwal", icon: Hash },
              { label: "Absensi", href: "#/absensi", icon: Hash },
              { label: "Cuti & Izin", href: "#/cuti", icon: Palmtree },
              { label: "Lembur", href: "#/lembur", icon: Clock },
              { label: "Payroll", href: "#/payroll", icon: Wallet },
              { label: "Laporan", href: "#/laporan", icon: Hash },
              { label: "Pengaturan", href: "#/pengaturan", icon: Hash },
            ].map((n) => {
              const Icon = n.icon;
              return (
                <CommandItem
                  key={n.href}
                  value={"navigasi " + n.label}
                  onSelect={() => { navigate(n.href); setSearchOpen(false); }}
                  className="gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground"><Icon className="size-3" /></div>
                  <span className="flex-1 text-sm">{n.label}</span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Karyawan">
            {employees.slice(0, 8).map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.fullName} ${e.nik}`}
                onSelect={() => { navigate(`#/karyawan?id=${e.id}`); setSearchOpen(false); }}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary-foreground">{initials(e.fullName)}</div>
                <div className="flex-1"><p className="text-sm">{e.fullName}</p><p className="font-mono text-[10px] text-muted-foreground">{e.nik}</p></div>
                <User className="size-3 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Outlet">
            {outlets.slice(0, 6).map((o) => (
              <CommandItem
                key={o.id}
                value={o.name + " " + o.code}
                onSelect={() => { navigate(`#/outlet?id=${o.id}`); setSearchOpen(false); }}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md bg-info/15 text-info"><Building2 className="size-3" /></div>
                <div className="flex-1"><p className="text-sm">{o.name}</p><p className="font-mono text-[10px] text-muted-foreground">{o.code}</p></div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Kontrak">
            {contracts.slice(0, 6).map((c) => {
              const emp = employees.find((e) => e.id === c.employeeId);
              return (
                <CommandItem
                  key={c.id}
                  value={`kontrak ${c.contractNo} ${emp?.fullName ?? ""}`}
                  onSelect={() => { navigate(`#/kontrak`); setSearchOpen(false); }}
                  className="gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-warning/15 text-warning"><FileText className="size-3" /></div>
                  <div className="flex-1"><p className="text-sm">{c.contractNo}</p><p className="text-[10px] text-muted-foreground">{emp?.fullName} · {c.endDate}</p></div>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Cuti/Izin/Sakit">
            {leaves.slice(0, 6).map((l) => {
              const emp = employees.find((e) => e.id === l.employeeId);
              return (
                <CommandItem
                  key={l.id}
                  value={`cuti ${l.type} ${emp?.fullName ?? ""} ${l.reason}`}
                  onSelect={() => { navigate(`#/cuti`); setSearchOpen(false); }}
                  className="gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-success/15 text-success"><Palmtree className="size-3" /></div>
                  <div className="flex-1"><p className="text-sm">{emp?.fullName} · {l.type}</p><p className="text-[10px] text-muted-foreground">{l.startDate} — {l.endDate}</p></div>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Lembur (Planning)">
            {overtimePlannings.slice(0, 6).map((p) => (
              <CommandItem
                key={p.id}
                value={`lembur ${p.requestNo} ${p.reason} ${p.workDescription}`}
                onSelect={() => { navigate(`#/lembur`); setSearchOpen(false); }}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary"><Clock className="size-3" /></div>
                <div className="flex-1"><p className="text-sm">{p.requestNo}</p><p className="text-[10px] text-muted-foreground">{p.date} · {p.startTime}–{p.endTime}</p></div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Payroll">
            {payrolls.slice(0, 6).map((p) => {
              const emp = employees.find((e) => e.id === p.employeeId);
              return (
                <CommandItem
                  key={p.id}
                  value={`payroll ${p.period} ${emp?.fullName ?? ""}`}
                  onSelect={() => { navigate(`#/payroll`); setSearchOpen(false); }}
                  className="gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-chart-4/15 text-foreground"><Wallet className="size-3" /></div>
                  <div className="flex-1"><p className="text-sm">{emp?.fullName} · {p.period}</p><p className="text-[10px] text-muted-foreground">{p.status}</p></div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" /> Bantuan & Pintasan
            </DialogTitle>
            <DialogDescription>Pintasan keyboard dan tips penggunaan JURI HR.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pintasan Keyboard</p>
              <div className="space-y-1.5">
                <ShortcutRow keys={["⌘/Ctrl", "K"]} desc="Buka pencarian global" />
                <ShortcutRow keys={["?"]} desc="Buka bantuan ini" />
                <ShortcutRow keys={["⌘/Ctrl", "B"]} desc="Toggle sidebar" />
                <ShortcutRow keys={["Esc"]} desc="Tutup dialog" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tips</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>• Klik kartu di dashboard untuk navigasi dengan filter otomatis.</p>
                <p>• Klik baris tabel untuk membuka detail.</p>
                <p>• Gunakan filter di setiap modul untuk menyaring data.</p>
                <p>• Semua perubahan tercatat di Audit Log.</p>
                <p>• Reset data kapan saja di Pengaturan.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{desc}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd key={i} className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
