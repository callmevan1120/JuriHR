"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useStore } from "@/hooks/use-store";
import { useTheme } from "next-themes";
import { getStore } from "@/lib/data/store";
import { navigate } from "@/lib/router/use-route";
import { cn, todayISODate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Database,
  RotateCcw,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Info,
  HardDrive,
  Layers,
  Activity,
  Shield,
  Zap,
  FileText,
  ExternalLink,
  CheckCircle2,
  MapPin,
} from "lucide-react";

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [resetConfirm, setResetConfirm] = React.useState(false);
  const [clearAuditConfirm, setClearAuditConfirm] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Statistik data dari store
  const stats = useStore((s) => ({
    employees: s.employees.length,
    outlets: s.outlets.length,
    positions: s.positions.length,
    divisions: s.divisions.length,
    contracts: s.contracts.length,
    domiciles: s.domiciles.length,
    shiftTemplates: s.shiftTemplates.length,
    shiftGroups: s.shiftGroups.length,
    schedules: s.schedules.length,
    holidays: s.holidays.length,
    holidayGroups: s.holidayGroups.length,
    attendances: s.attendances.length,
    leaves: s.leaves.length,
    overtimePlannings: s.overtimePlannings.length,
    overtimeActuals: s.overtimeActuals.length,
    payrolls: s.payrolls.length,
    notifications: s.notifications.length,
    auditLogs: s.auditLogs.length,
    changeHistories: s.changeHistories.length,
    shiftSwaps: s.shiftSwaps.length,
    holidayOverrides: s.holidayOverrides.length,
  }));

  const totalRecords = Object.values(stats).reduce((s, n) => s + n, 0);

  const handleReset = () => {
    getStore().reset();
    toast.success("Data direset ke seed awal");
    setTimeout(() => navigate("#/"), 500);
  };

  const handleClearAudit = () => {
    const store = getStore();
    store.setCollection("auditLogs", []);
    toast.success("Audit log dibersihkan");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengaturan"
        description="Kelola data mock, tampilan, dan informasi sistem JURI HR."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tampilan */}
        <Card className="border-border shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="size-4 text-primary" /> Tampilan
            </CardTitle>
            <CardDescription className="text-xs">Pilih tema aplikasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <ThemeButton
                active={mounted && theme === "light"}
                onClick={() => setTheme("light")}
                icon={Sun}
                label="Terang"
                desc="Cream & golden"
              />
              <ThemeButton
                active={mounted && theme === "dark"}
                onClick={() => setTheme("dark")}
                icon={Moon}
                label="Gelap"
                desc="Warm dark brown"
              />
            </div>
          </CardContent>
        </Card>

        {/* Manajemen Data */}
        <Card className="border-border shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-primary" /> Manajemen Data
            </CardTitle>
            <CardDescription className="text-xs">Kelola data mock in-memory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <RotateCcw className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Reset Data</p>
                  <p className="text-[11px] text-muted-foreground">Kembalikan semua data ke seed awal</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setResetConfirm(true)}>
                Reset
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Bersihkan Audit Log</p>
                  <p className="text-[11px] text-muted-foreground">Hapus semua riwayat aktivitas</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setClearAuditConfirm(true)}>
                Bersihkan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistik Data */}
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="size-4 text-primary" /> Statistik Data
          </CardTitle>
          <CardDescription className="text-xs">
            Total {totalRecords.toLocaleString("id-ID")} record tersimpan di central data service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <DataStat label="Karyawan" value={stats.employees} icon="users" />
            <DataStat label="Outlet" value={stats.outlets} />
            <DataStat label="Posisi" value={stats.positions} />
            <DataStat label="Divisi" value={stats.divisions} />
            <DataStat label="Kontrak" value={stats.contracts} />
            <DataStat label="Domisili" value={stats.domiciles} />
            <DataStat label="Shift Template" value={stats.shiftTemplates} />
            <DataStat label="Shift Group" value={stats.shiftGroups} />
            <DataStat label="Jadwal" value={stats.schedules} />
            <DataStat label="Holiday" value={stats.holidays} />
            <DataStat label="Holiday Group" value={stats.holidayGroups} />
            <DataStat label="Holiday Override" value={stats.holidayOverrides} />
            <DataStat label="Absensi" value={stats.attendances} />
            <DataStat label="Cuti/Izin/Sakit" value={stats.leaves} />
            <DataStat label="OT Planning" value={stats.overtimePlannings} />
            <DataStat label="OT Actual" value={stats.overtimeActuals} />
            <DataStat label="Payroll" value={stats.payrolls} />
            <DataStat label="Notifikasi" value={stats.notifications} />
            <DataStat label="Shift Swap" value={stats.shiftSwaps} />
            <DataStat label="Audit Log" value={stats.auditLogs} />
            <DataStat label="Change History" value={stats.changeHistories} />
          </div>
        </CardContent>
      </Card>

      {/* Informasi Sistem */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-primary" /> Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow label="Aplikasi" value="JURI HR" />
            <InfoRow label="Versi" value={<Badge className="bg-primary/15 text-primary-foreground border-primary/30">v1.0.0</Badge>} />
            <InfoRow label="Modul Aktif" value="18 modul" />
            <InfoRow label="Fase" value="6 fase selesai" />
            <InfoRow label="Tanggal" value={todayISODate()} />
            <InfoRow label="Status" value={<span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-3" /> Stabil</span>} />
          </CardContent>
        </Card>

        <Card className="border-border shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="size-4 text-primary" /> Teknologi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <TechRow icon={Zap} label="Framework" value="Next.js 16 (App Router)" />
            <TechRow icon={FileText} label="Language" value="TypeScript 5 (strict)" />
            <TechRow icon={Layers} label="Styling" value="Tailwind CSS 4 + shadcn/ui" />
            <TechRow icon={Activity} label="Charts" value="Recharts 2" />
            <TechRow icon={MapPin} label="Peta" value="Leaflet + OpenStreetMap" />
            <TechRow icon={Shield} label="State" value="DataStore (useSyncExternalStore)" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ExternalLink className="size-4 text-primary" /> Tautan Cepat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <QuickLink label="Dashboard" href="#/" />
            <QuickLink label="Data Karyawan" href="#/karyawan" />
            <QuickLink label="Kalender Jadwal" href="#/jadwal" />
            <QuickLink label="Payroll" href="#/payroll" />
            <QuickLink label="Laporan" href="#/laporan" />
            <QuickLink label="Audit Log" href="#/audit" />
            <QuickLink label="Notifikasi" href="#/notifikasi" />
            <QuickLink label="Domisili & Peta" href="#/domisili" />
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetConfirm}
        onOpenChange={setResetConfirm}
        title="Reset semua data?"
        description="Seluruh perubahan akan hilang dan data kembali ke seed awal. Tindakan ini tidak dapat dibatalkan."
        destructive
        confirmLabel="Ya, Reset"
        onConfirm={handleReset}
      />
      <ConfirmDialog
        open={clearAuditConfirm}
        onOpenChange={setClearAuditConfirm}
        title="Bersihkan audit log?"
        description="Semua riwayat aktivitas akan dihapus permanen."
        destructive
        confirmLabel="Ya, Bersihkan"
        onConfirm={handleClearAudit}
      />
    </div>
  );
}

function ThemeButton({
  active,
  onClick,
  icon: Icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sun;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all",
        active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/30",
      )}
    >
      <div className={cn("flex size-9 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function DataStat({ label, value }: { label: string; value: number; icon?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function TechRow({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}

function QuickLink({ label, href }: { label: string; href: string }) {
  return (
    <button
      onClick={() => navigate(href)}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
    >
      <span className="text-xs font-medium text-foreground">{label}</span>
      <ExternalLink className="size-3 text-muted-foreground" />
    </button>
  );
}

