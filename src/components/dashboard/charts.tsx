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

/** Hook simulasi loading awal chart (200ms) untuk efek skeleton. */
function useChartLoading(delay = 200) {
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
  const data = computeAttendanceTrend(state);
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tren Kehadiran</CardTitle>
        <CardDescription className="text-xs">
          7 hari terakhir — hadir, terlambat, tidak hadir
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ChartContainer config={ATTENDANCE_CONFIG} className="h-[220px] w-full">
            <LineChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
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

const OUTLET_CONFIG: ChartConfig = {
  employees: { label: "Karyawan", color: "var(--chart-1)" },
};

export function OutletDistributionChart() {
  const state = useDataState();
  const loading = useChartLoading(300);
  const data = computeOutletDistribution(state);
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Jumlah Karyawan per Outlet</CardTitle>
        <CardDescription className="text-xs">
          Peringkat sebaran staf aktif per lokasi outlet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ChartContainer config={OUTLET_CONFIG} className="h-[220px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickMargin={4}
                className="text-[11px]"
              />
              <YAxis
                type="category"
                dataKey="outletName"
                tickLine={false}
                axisLine={false}
                width={100}
                tickMargin={4}
                className="text-[11px]"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="employees"
                fill="var(--color-employees)"
                radius={[0, 6, 6, 0]}
                barSize={16}
              />
            </BarChart>
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
    <Card className="border-border shadow-soft flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Status Kontrak Kerja</CardTitle>
        <CardDescription className="text-xs">
          Distribusi status seluruh kontrak aktif & berakhir
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <ChartContainer config={CONTRACT_CONFIG} className="mx-auto h-[180px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* SVG Text Presisi di Tengah Donut Hole */}
                  <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-2xl font-bold tabular-nums"
                  >
                    {total}
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider"
                  >
                    Total Kontrak
                  </text>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Legenda Proporsional & Terorganisir */}
            <div className="mt-2 pt-2 border-t border-border/60 space-y-1.5">
              {data.map((d) => {
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                return (
                  <div key={d.status} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2.5 shrink-0 rounded-full shadow-xs"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="truncate text-muted-foreground">{d.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold tabular-nums text-foreground">{d.count}</span>
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
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
    <Card className="border-border shadow-soft flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribusi Posisi Karyawan</CardTitle>
        <CardDescription className="text-xs">
          Komposisi peran staf aktif per jabatan
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <ChartContainer config={{ count: { label: "Posisi" } }} className="mx-auto h-[180px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="positionName" />} />
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="positionName"
                    innerRadius={54}
                    outerRadius={78}
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
                    className="fill-foreground text-2xl font-bold tabular-nums"
                  >
                    {total}
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider"
                  >
                    Total Staf
                  </text>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Legenda Posisi Top 5 */}
            <div className="mt-2 pt-2 border-t border-border/60 space-y-1.5">
              {data.slice(0, 5).map((d, i) => {
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                return (
                  <div key={d.positionId} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2.5 shrink-0 rounded-full shadow-xs"
                        style={{ backgroundColor: POSITION_COLORS[i % POSITION_COLORS.length] }}
                      />
                      <span className="truncate text-muted-foreground">{d.positionName}</span>
                      <Badge className="text-[9px] px-1 py-0 h-4 bg-muted text-muted-foreground">
                        {d.category === "OUTLET" ? "Outlet" : "HQ"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold tabular-nums text-foreground">{d.count}</span>
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
              {data.length > 5 && (
                <div className="text-[11px] text-right text-muted-foreground pt-0.5">
                  + {data.length - 5} posisi lainnya
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
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Planning vs Actual Lembur</CardTitle>
        <CardDescription className="text-xs">
          Perbandingan jam planning & aktual 7 hari terakhir
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ChartContainer config={OVERTIME_CONFIG} className="h-[220px] w-full">
            <BarChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
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
