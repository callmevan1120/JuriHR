"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
} from "@/lib/services/dashboard";
import { useDataState } from "@/hooks/use-store";
import { statusLabel } from "@/components/common/status-badge";

const ATTENDANCE_CONFIG: ChartConfig = {
  hadir: { label: "Hadir", color: "var(--chart-1)" },
  terlambat: { label: "Terlambat", color: "var(--chart-3)" },
  tidakHadir: { label: "Tidak Hadir", color: "var(--chart-5)" },
};

export function AttendanceTrendChart() {
  const state = useDataState();
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
      </CardContent>
    </Card>
  );
}

const OUTLET_CONFIG: ChartConfig = {
  employees: { label: "Karyawan", color: "var(--chart-1)" },
};

export function OutletDistributionChart() {
  const state = useDataState();
  const data = computeOutletDistribution(state);
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribusi Karyawan per Outlet</CardTitle>
        <CardDescription className="text-xs">
          Jumlah karyawan aktif tiap outlet
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              width={96}
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
      </CardContent>
    </Card>
  );
}

const CONTRACT_COLORS = [
  "var(--chart-1)",
  "var(--chart-5)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-2)",
];

const CONTRACT_CONFIG: ChartConfig = {
  count: { label: "Kontrak" },
};

export function ContractStatusChart() {
  const state = useDataState();
  const raw = computeContractStatus(state);
  const data = raw.map((d) => ({ ...d, label: statusLabel(d.status) }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Status Kontrak</CardTitle>
        <CardDescription className="text-xs">
          Distribusi status seluruh kontrak aktif & berakhir
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ChartContainer config={CONTRACT_CONFIG} className="mx-auto h-[220px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                innerRadius={56}
                outerRadius={84}
                paddingAngle={2}
                strokeWidth={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CONTRACT_COLORS[i % CONTRACT_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {total}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Total Kontrak
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {data.map((d, i) => (
            <div key={d.status} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: CONTRACT_COLORS[i % CONTRACT_COLORS.length] }}
              />
              <span className="flex-1 truncate text-muted-foreground">{d.label}</span>
              <span className="font-medium tabular-nums text-foreground">{d.count}</span>
            </div>
          ))}
        </div>
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
      </CardContent>
    </Card>
  );
}
