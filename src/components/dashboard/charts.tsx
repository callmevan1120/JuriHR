"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  computeAttendanceTrend,
  computeContractStatus,
  computeOutletDistribution,
  computeOvertimePlanVsActual,
  computePositionDistribution,
} from "@/lib/services/dashboard";
import { useDataState } from "@/hooks/use-store";
import { statusLabel } from "@/components/common/status-badge";
import { ChartSkeleton } from "@/components/common/chart-skeleton";
import { Badge } from "@/components/ui/badge";

/** Hook loading awal chart untuk efek skeleton. */
function useChartLoading(delay = 150) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return loading;
}

const ATTENDANCE_CONFIG: ChartConfig = {
  hadir: { label: "Hadir", color: "var(--chart-1)" },
  terlambat: { label: "Terlambat", color: "var(--chart-3)" },
  tidakHadir: { label: "Tidak Hadir", color: "var(--chart-5)" },
};

export function AttendanceTrendChart() {
  const state = useDataState();
  const loading = useChartLoading();
  const [mode, setMode] = React.useState<"daily" | "weekly" | "monthly">("daily");
  
  const data = computeAttendanceTrend(state, mode);

  return (
    <Card className="border-border shadow-soft h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 bg-muted/10">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">Tren Kehadiran Karyawan</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            {mode === "daily" && "7 hari terakhir — pemantauan tingkat presensi harian"}
            {mode === "weekly" && "4 minggu terakhir — agregasi mingguan staf"}
            {mode === "monthly" && "6 bulan terakhir — rekapitulasi bulanan (skala 500+ karyawan)"}
          </CardDescription>
        </div>

        {/* Filter Period Switcher: Harian | Mingguan | Bulanan */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/80 p-1 border border-border/60 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setMode("daily")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              mode === "daily"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setMode("weekly")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              mode === "weekly"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => setMode("monthly")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              mode === "monthly"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bulanan
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-center">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ChartContainer config={ATTENDANCE_CONFIG} className="h-[240px] w-full">
            <LineChart data={data} margin={{ left: -12, right: 12, top: 12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[11px]"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                allowDecimals={false}
                className="text-[11px]"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="hadir"
                stroke="var(--color-hadir)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--color-hadir)" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="terlambat"
                stroke="var(--color-terlambat)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="tidakHadir"
                stroke="var(--color-tidakHadir)"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const CONTRACT_COLORS: Record<string, string> = {
  AKTIF: "#22c55e", // Green
  AKAN_BERAKHIR: "#eab308", // Yellow
  BERAKHIR: "#ef4444", // Red
  DIPERPANJANG: "#3b82f6", // Blue
  DRAFT: "#94a3b8", // Slate
  DITOLAK: "#f43f5e", // Rose
  DIBATALKAN: "#64748b", // Gray
};

const CONTRACT_CONFIG: ChartConfig = {
  count: { label: "Kontrak" },
};

export function ContractStatusChart() {
  const state = useDataState();
  const loading = useChartLoading(400);
  const raw = computeContractStatus(state);
  const data = raw.map((d) => ({
    ...d,
    label: statusLabel(d.status),
    color: CONTRACT_COLORS[d.status] || "var(--chart-1)",
  }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card className="border-border shadow-soft h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/40 bg-muted/10">
        <CardTitle className="text-base font-semibold text-foreground">Status Kontrak Kerja</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Distribusi status seluruh kontrak aktif & berakhir
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-2">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <>
            <div className="relative flex-1 flex items-center justify-center min-h-[160px]">
              <ChartContainer config={CONTRACT_CONFIG} className="mx-auto h-[160px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-xl font-bold tabular-nums"
                  >
                    {total}
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[9px] font-semibold uppercase tracking-wider"
                  >
                    Total Kontrak
                  </text>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Legenda Ringkas & Sejajar */}
            <div className="pt-2 border-t border-border/60 space-y-1">
              {data.map((d) => {
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                return (
                  <div key={d.status} className="flex items-center justify-between gap-2 text-xs py-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="size-2.5 shrink-0 rounded-full shadow-xs"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="truncate text-muted-foreground text-[11px]">{d.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold tabular-nums text-foreground text-xs">{d.count}</span>
                      <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const POSITION_COLORS = [
  "#FCBA0C", // JURI Primary Yellow
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

export function PositionDistributionChart() {
  const state = useDataState();
  const loading = useChartLoading(450);
  const data = computePositionDistribution(state);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card className="border-border shadow-soft h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/40 bg-muted/10">
        <CardTitle className="text-base font-semibold text-foreground">Distribusi Posisi Karyawan</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Komposisi peran staf aktif per jabatan
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-2">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <>
            <div className="relative flex-1 flex items-center justify-center min-h-[160px]">
              <ChartContainer config={{ count: { label: "Posisi" } }} className="mx-auto h-[160px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="positionName" />} />
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="positionName"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={POSITION_COLORS[i % POSITION_COLORS.length]} />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-xl font-bold tabular-nums"
                  >
                    {total}
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[9px] font-semibold uppercase tracking-wider"
                  >
                    Total Staf
                  </text>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Legenda Posisi Top 4 Ringkas agar Sejajar */}
            <div className="pt-2 border-t border-border/60 space-y-1">
              {data.slice(0, 4).map((d, i) => {
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                return (
                  <div key={d.positionId} className="flex items-center justify-between gap-2 text-xs py-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="size-2.5 shrink-0 rounded-full shadow-xs"
                        style={{ backgroundColor: POSITION_COLORS[i % POSITION_COLORS.length] }}
                      />
                      <span className="truncate text-muted-foreground text-[11px]">{d.positionName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold tabular-nums text-foreground text-xs">{d.count}</span>
                      <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
              {data.length > 4 && (
                <div className="text-[10px] text-right text-muted-foreground pt-0.5 font-medium">
                  + {data.length - 4} posisi lainnya
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const OVERTIME_CONFIG: ChartConfig = {
  planning: { label: "Planning (jam)", color: "var(--chart-4)" },
  actual: { label: "Actual (jam)", color: "var(--chart-1)" },
};

export function OvertimePlanVsActualChart() {
  const state = useDataState();
  const loading = useChartLoading(500);
  const data = computeOvertimePlanVsActual(state);
  return (
    <Card className="border-border shadow-soft h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/40 bg-muted/10">
        <CardTitle className="text-base font-semibold text-foreground">Planning vs Actual Lembur</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Perbandingan jam planning & aktual 7 hari terakhir
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col justify-center">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ChartContainer config={OVERTIME_CONFIG} className="h-[240px] w-full">
            <BarChart data={data} margin={{ left: -12, right: 12, top: 12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[11px]"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                allowDecimals={false}
                className="text-[11px]"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="planning" fill="var(--color-planning)" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
