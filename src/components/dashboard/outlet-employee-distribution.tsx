"use client";

import * as React from "react";
import { useDataState } from "@/hooks/use-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { navigate } from "@/lib/router/use-route";
import { daysBetween, todayISODate } from "@/lib/utils";
import {
  Building2,
  Users,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ChevronRight,
  Info,
} from "lucide-react";

export type OutletHealthCategory = "GREEN" | "YELLOW" | "RED";

export interface OutletHealthInfo {
  category: OutletHealthCategory;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  salesStatus: string;
  ageStatus: string;
}

/** Mapping kategori kesehatan outlet sesuai instruksi HRD. */
export const OUTLET_HEALTH_MAP: Record<string, OutletHealthInfo> = {
  "out-sudirman": {
    category: "GREEN",
    title: "Sehat & Performa Tinggi",
    badgeLabel: "Hijau — Sehat & Bagus",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotColor: "#22c55e",
    icon: CheckCircle2,
    description: "Outlet > 1 tahun & penjualan sangat bagus (Flagship).",
    salesStatus: "Penjualan Sangat Tinggi (+24%)",
    ageStatus: "> 1 Tahun (Est. 2021)",
  },
  "out-kemang": {
    category: "GREEN",
    title: "Sehat & Stable Revenue",
    badgeLabel: "Hijau — Sehat & Bagus",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotColor: "#22c55e",
    icon: CheckCircle2,
    description: "Outlet > 1 tahun & profit konsisten.",
    salesStatus: "Penjualan Stabil & Bagus",
    ageStatus: "> 1 Tahun (Est. 2022)",
  },
  "out-kelapa-gading": {
    category: "GREEN",
    title: "Sehat & High Demand",
    badgeLabel: "Hijau — Sehat & Bagus",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotColor: "#22c55e",
    icon: CheckCircle2,
    description: "Outlet > 1 tahun & volume penjualan memuaskan.",
    salesStatus: "Penjualan Bagus",
    ageStatus: "> 1 Tahun (Est. 2022)",
  },
  "out-pondok-indah": {
    category: "YELLOW",
    title: "Overhead Tinggi / BEP",
    badgeLabel: "Kuning — Moderat / BEP",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotColor: "#eab308",
    icon: AlertTriangle,
    description: "Outlet > 1 tahun tapi sewa tinggi (belum untung maksimal).",
    salesStatus: "Break-Even Point (BEP)",
    ageStatus: "> 1 Tahun (Est. 2023)",
  },
  "out-bekasi": {
    category: "YELLOW",
    title: "Outlet Baru — Trend Positive",
    badgeLabel: "Kuning — Baru & Oke",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotColor: "#eab308",
    icon: AlertTriangle,
    description: "Outlet < 1 tahun tapi omset menunjukkan tren oke.",
    salesStatus: "Penjualan Positif",
    ageStatus: "< 1 Tahun (Est. 2024)",
  },
  "out-tangerang": {
    category: "YELLOW",
    title: "Outlet Baru — Performance Oke",
    badgeLabel: "Kuning — Baru & Oke",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotColor: "#eab308",
    icon: AlertTriangle,
    description: "Outlet < 1 tahun, omset cukup memenuhi target bulanan.",
    salesStatus: "Penjualan Oke",
    ageStatus: "< 1 Tahun (Est. 2024)",
  },
  "out-bogor": {
    category: "YELLOW",
    title: "Outlet Baru — Express Growth",
    badgeLabel: "Kuning — Baru & Oke",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotColor: "#eab308",
    icon: AlertTriangle,
    description: "Outlet < 1 tahun dengan performa berkembang.",
    salesStatus: "Penjualan Cukup",
    ageStatus: "< 1 Tahun (Est. 2024)",
  },
  "out-depok": {
    category: "RED",
    title: "Kritis — Unprofitable",
    badgeLabel: "Merah — Tidak Sehat",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    dotColor: "#ef4444",
    icon: XCircle,
    description: "Outlet belum balik modal & omset sangat sedikit.",
    salesStatus: "Omset Rendah / Rugi",
    ageStatus: "Belum Balik Modal",
  },
  "out-kebon-jeruk": {
    category: "RED",
    title: "Kritis — Kiosk Underperforming",
    badgeLabel: "Merah — Tidak Sehat",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    dotColor: "#ef4444",
    icon: XCircle,
    description: "Outlet Kiosk dengan traffic rendah & belum balik modal.",
    salesStatus: "Omset Sangat Sedikit",
    ageStatus: "Belum Balik Modal",
  },
};

export function OutletEmployeeDistribution() {
  const state = useDataState();
  const [activeTab, setActiveTab] = React.useState<"ALL" | "GREEN" | "YELLOW" | "RED">("ALL");

  const today = todayISODate();
  const activeEmployees = state.employees.filter((e) => e.status === "AKTIF");

  // Hitung data agregat per outlet
  const outletData = state.outlets
    .filter((o) => o.status === "active")
    .map((o) => {
      const health = OUTLET_HEALTH_MAP[o.id] || {
        category: "YELLOW",
        title: "Performa Moderat",
        badgeLabel: "Kuning — Moderat",
        badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
        dotColor: "#eab308",
        icon: AlertTriangle,
        description: "Status dalam pemantauan.",
        salesStatus: "Penjualan Standar",
        ageStatus: "Standar",
      };

      const employees = activeEmployees.filter((e) => e.primaryOutletId === o.id);
      
      // Karyawan baru (bekerja < 90 hari)
      const newHires = employees.filter((e) => {
        const days = daysBetween(e.startDate, today);
        return days >= 0 && days <= 90;
      });

      // Sebaran posisi
      const positionsMap: Record<string, number> = {};
      employees.forEach((e) => {
        const pos = state.positions.find((p) => p.id === e.positionId);
        const posName = pos ? pos.name : "Staf";
        positionsMap[posName] = (positionsMap[posName] || 0) + 1;
      });

      return {
        outlet: o,
        health,
        employeeCount: employees.length,
        newHiresCount: newHires.length,
        positionsMap,
      };
    });

  // Hitung summary per kategori
  const greenCount = outletData.filter((d) => d.health.category === "GREEN");
  const yellowCount = outletData.filter((d) => d.health.category === "YELLOW");
  const redCount = outletData.filter((d) => d.health.category === "RED");

  const totalOutletEmployees = outletData.reduce((s, d) => s + d.employeeCount, 0);

  const filteredData = outletData.filter((d) => {
    if (activeTab === "ALL") return true;
    return d.health.category === activeTab;
  });

  return (
    <Card className="border-border shadow-soft overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Building2 className="size-4 text-primary" />
              Distribusi Karyawan & Performa Kesehatan Outlet
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Pemantauan sebaran karyawan berdasarkan kategori kondisi & omset outlet.
            </CardDescription>
          </div>
          
          {/* Quick Filter Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                activeTab === "ALL"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Semua ({outletData.length})
            </button>
            <button
              onClick={() => setActiveTab("GREEN")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "GREEN"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              Sehat ({greenCount.length})
            </button>
            <button
              onClick={() => setActiveTab("YELLOW")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "YELLOW"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              <span className="size-2 rounded-full bg-amber-500" />
              Moderat ({yellowCount.length})
            </button>
            <button
              onClick={() => setActiveTab("RED")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "RED"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
              }`}
            >
              <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
              Kritis ({redCount.length})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Ringkasan 3 Kategori Kinerja */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card Hijau */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Outlet Sehat & Bagus
                </span>
                <span className="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {greenCount.reduce((s, d) => s + d.employeeCount, 0)} Kar.
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                {greenCount.length} outlet (&gt;1 th, omset bagus)
              </p>
            </div>
          </div>

          {/* Card Kuning */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Outlet BEP / Prospektif
                </span>
                <span className="text-xs font-bold tabular-nums text-amber-700 dark:text-amber-300">
                  {yellowCount.reduce((s, d) => s + d.employeeCount, 0)} Kar.
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                {yellowCount.length} outlet (BEP / &lt;1 th sales oke)
              </p>
            </div>
          </div>

          {/* Card Merah */}
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <XCircle className="size-4 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                  Outlet Kritis / Tidak Sehat
                </span>
                <span className="text-xs font-bold tabular-nums text-rose-700 dark:text-rose-300">
                  {redCount.reduce((s, d) => s + d.employeeCount, 0)} Kar.
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                {redCount.length} outlet (belum balik modal & omset low)
              </p>
            </div>
          </div>
        </div>

        {/* List Outlet & Distribusi Karyawan */}
        <div className="space-y-2.5">
          {filteredData.map((d) => {
            const Icon = d.health.icon;
            const pct = Math.round((d.employeeCount / (totalOutletEmployees || 1)) * 100);

            return (
              <div
                key={d.outlet.id}
                onClick={() => navigate(`#/outlet?id=${d.outlet.id}`)}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-soft cursor-pointer"
              >
                {/* Info Outlet & Health Badge */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm mt-0.5"
                    style={{ backgroundColor: d.health.dotColor }}
                  >
                    <Building2 className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {d.outlet.name}
                      </span>
                      <Badge className="text-[10px] bg-muted text-muted-foreground border-border">
                        {d.outlet.classification}
                      </Badge>
                      <Badge className={`text-[10px] font-medium ${d.health.badgeClass}`}>
                        {d.health.badgeLabel}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{d.health.description}</span>
                      <span className="text-border">•</span>
                      <span className="text-[11px] font-medium text-foreground/80">{d.health.salesStatus}</span>
                    </p>

                    {/* Breakdown Posisi */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {Object.entries(d.positionsMap).map(([posName, count]) => (
                        <span
                          key={posName}
                          className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          <span className="font-medium text-foreground">{posName}:</span> {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stat Karyawan & New Hires Warning */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50 shrink-0">
                  {/* Warning Karyawan Baru jika Outlet Red */}
                  {d.health.category === "RED" && d.newHiresCount > 0 && (
                    <div className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <UserPlus className="size-3.5 shrink-0" />
                      <span className="font-semibold text-[11px]">
                        {d.newHiresCount} Kar. Baru (Perlu Perhatian)
                      </span>
                    </div>
                  )}

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Users className="size-3.5 text-muted-foreground" />
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        {d.employeeCount} Karyawan
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (d.employeeCount / 12) * 100)}%`,
                            backgroundColor: d.health.dotColor,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{pct}%</span>
                    </div>
                  </div>

                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 hidden sm:block" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
