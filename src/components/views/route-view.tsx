"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRoute } from "@/lib/router/use-route";
import { findNavItem } from "@/lib/router/routes";
import { DashboardView } from "@/components/views/dashboard-view";
import { ComingSoon } from "@/components/common/coming-soon";
import { EmployeesView } from "@/components/views/employees-view";
import { OutletView } from "@/components/views/outlet-view";
import { PositionsView } from "@/components/views/positions-view";
import { ContractsView } from "@/components/views/contracts-view";
import { ShiftTemplatesView } from "@/components/views/shift-templates-view";
import { ShiftGroupsView } from "@/components/views/shift-groups-view";
import { ScheduleView } from "@/components/views/schedule-view";
import { HolidayView } from "@/components/views/holiday-view";
import { AttendanceView } from "@/components/views/attendance-view";
import { LeaveView } from "@/components/views/leave-view";
import { OvertimeView } from "@/components/views/overtime-view";

// DomicileView memakai Leaflet (akses `window` saat import) → client-only.
const DomicileView = dynamic(
  () => import("@/components/views/domicile-view").then((m) => m.DomicileView),
  { ssr: false },
);

/** Registry view per route. */
const VIEWS: Record<string, React.ComponentType> = {
  "#/karyawan": EmployeesView,
  "#/outlet": OutletView,
  "#/posisi": PositionsView,
  "#/domisili": DomicileView,
  "#/kontrak": ContractsView,
  "#/shift": ShiftTemplatesView,
  "#/shift-group": ShiftGroupsView,
  "#/jadwal": ScheduleView,
  "#/libur": HolidayView,
  "#/absensi": AttendanceView,
  "#/cuti": LeaveView,
  "#/lembur": OvertimeView,
};

export function RouteView() {
  const route = useRoute();
  const item = findNavItem(route.path);

  if (route.path === "#/") {
    return <DashboardView />;
  }

  if (item && item.available && VIEWS[route.path]) {
    const View = VIEWS[route.path]!;
    return <View />;
  }

  if (item) {
    return <ComingSoon item={item} />;
  }

  // Unknown route -> fallback ke dashboard
  return <DashboardView />;
}
