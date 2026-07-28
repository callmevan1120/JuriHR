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
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";

export function OutletEmployeeDistribution() {
  const state = useDataState();
  const today = todayISODate();
  const activeEmployees = state.employees.filter((e) => e.status === "AKTIF");

  // Helper hitung staf & new hires per outlet
  const getOutletStats = (outletId: string) => {
    const employees = activeEmployees.filter((e) => e.primaryOutletId === outletId);
    const newHires = employees.filter((e) => {
      const days = daysBetween(e.startDate, today);
      return days >= 0 && days <= 90;
    });

    const positionsMap: Record<string, number> = {};
    employees.forEach((e) => {
      const pos = state.positions.find((p) => p.id === e.positionId);
      const posName = pos ? pos.name : "Staf";
      positionsMap[posName] = (positionsMap[posName] || 0) + 1;
    });

    return {
      count: employees.length,
      newHiresCount: newHires.length,
      positionsMap,
    };
  };

  const sudirmanStats = getOutletStats("out-sudirman");
  const bekasiStats = getOutletStats("out-bekasi");
  const depokStats = getOutletStats("out-depok");

  const totalOutletEmployees = activeEmployees.filter((e) => e.primaryOutletId).length;

  return (
    <Card className="border-border shadow-soft h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Building2 className="size-4 text-primary" />
              Spotlight Performa & Kesehatan Outlet Kunci
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Highlight 3 outlet paling krusial sebagai sampel insight strategis HRD.
            </CardDescription>
          </div>
          <button
            onClick={() => navigate("#/outlet")}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            Kelola 9 Outlet <ArrowRight className="size-3.5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* 3 Spotlight Outlet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch flex-1">
          
          {/* Card 1: Top Performer (Hijau) */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col justify-between transition-all hover:border-emerald-500/50 hover:shadow-soft">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs">
                    <Award className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Top Performance
                    </h4>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Outlet Paling Sehat
                    </span>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px]">
                  🟢 Hijau
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  JURI Bun — Sudirman
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Flagship • &gt; 1 Tahun • Penjualan +24%
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg bg-background/80 p-2.5 border border-emerald-500/20 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Total Karyawan:</span>
                  <span className="font-bold text-foreground tabular-nums">{sudirmanStats.count} staf</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Proporsi Staf:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {Math.round((sudirmanStats.count / (totalOutletEmployees || 1)) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Retensi Karyawan:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% (Sangat Stabil)</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Penjualan konsisten tertinggi di seluruh cabang. Beban kerja terdistribusi optimal antar barista & kasir.
              </p>
            </div>

            <button
              onClick={() => navigate("#/outlet?id=out-sudirman")}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              Detail Sudirman <ArrowRight className="size-3" />
            </button>
          </div>

          {/* Card 2: Most Prospective (Kuning) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col justify-between transition-all hover:border-amber-500/50 hover:shadow-soft">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Paling Prospektif
                    </h4>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      Pertumbuhan Pesat
                    </span>
                  </div>
                </div>
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px]">
                  🟡 Kuning
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  JURI Bun — Bekasi
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Standard • &lt; 1 Tahun • Tren Omset Positif
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg bg-background/80 p-2.5 border border-amber-500/20 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Total Karyawan:</span>
                  <span className="font-bold text-foreground tabular-nums">{bekasiStats.count} staf</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Proporsi Staf:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    {Math.round((bekasiStats.count / (totalOutletEmployees || 1)) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Target BEP:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">3 Bulan Lagi</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Outlet baru dengan perkembangan omset terpesat. Tim Baker & Kasir berkinerja tinggi memenuhi traksi pasar.
              </p>
            </div>

            <button
              onClick={() => navigate("#/outlet?id=out-bekasi")}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              Detail Bekasi <ArrowRight className="size-3" />
            </button>
          </div>

          {/* Card 3: Critical Alert (Merah) */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 flex flex-col justify-between transition-all hover:border-rose-500/50 hover:shadow-soft">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white shadow-xs">
                    <XCircle className="size-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">
                      Paling Kritis
                    </h4>
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                      Perlu Perhatian HRD
                    </span>
                  </div>
                </div>
                <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 text-[10px]">
                  🔴 Merah
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  JURI Bun — Margonda Depok
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Express • Belum BEP • Omset Rendah
                </p>
              </div>

              <div className="space-y-1.5 rounded-lg bg-background/80 p-2.5 border border-rose-500/20 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Total Karyawan:</span>
                  <span className="font-bold text-foreground tabular-nums">{depokStats.count} staf</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Karyawan Baru:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {depokStats.newHiresCount} Staf (Probation)
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Status Finansial:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">Unprofitable / Rugi</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Penjualan sangat rendah. Keberadaan 2 staf baru di outlet kritis membutuhkan mentoring & rotasi jadwal dari HRD.
              </p>
            </div>

            <button
              onClick={() => navigate("#/outlet?id=out-depok")}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              Detail Depok <ArrowRight className="size-3" />
            </button>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
