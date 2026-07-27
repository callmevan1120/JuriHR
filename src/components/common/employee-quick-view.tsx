"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useStore } from "@/hooks/use-store";
import {
  formatRupiah,
  formatDateMed,
  initials,
  cn,
} from "@/lib/utils";
import type { Employee } from "@/lib/types";
import {
  Phone,
  Mail,
  Briefcase,
  Building2,
  Wallet,
  Plane,
  CalendarDays,
  User,
  ChevronRight,
} from "lucide-react";

interface Props {
  employee: Employee;
  children: React.ReactNode;
}

export function EmployeeQuickView({ employee, children }: Props) {
  const positions = useStore((s) => s.positions);
  const divisions = useStore((s) => s.divisions);
  const outlets = useStore((s) => s.outlets);
  const contracts = useStore((s) => s.contracts);
  const attendances = useStore((s) => s.attendances);
  const leaves = useStore((s) => s.leaves);

  const position = positions.find((p) => p.id === employee.positionId);
  const division = divisions.find((d) => d.id === employee.divisionId);
  const outlet = outlets.find((o) => o.id === employee.primaryOutletId);
  const activeContract = contracts.find(
    (c) => c.employeeId === employee.id && (c.status === "AKTIF" || c.status === "AKAN_BERAKHIR"),
  );
  const todayAtt = attendances.find(
    (a) => a.employeeId === employee.id && a.date === new Date().toISOString().slice(0, 10),
  );
  const pendingLeaves = leaves.filter(
    (l) => l.employeeId === employee.id && l.status === "PENDING",
  ).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary-foreground">
            {initials(employee.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{employee.fullName}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{employee.nik}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <StatusBadge status={employee.status} />
              <StatusBadge
                status={employee.category}
                label={employee.category === "OUTLET" ? "Outlet" : "Non-Outlet"}
                className={cn(
                  employee.category === "OUTLET"
                    ? "bg-primary/15 text-primary-foreground border-primary/30"
                    : "bg-info/15 text-info border-info/30",
                )}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-border">
          <QuickRow icon={Briefcase} label="Posisi" value={position?.name} />
          <QuickRow icon={Building2} label="Divisi / Outlet" value={`${division?.name ?? "-"}${outlet ? " · " + outlet.name.replace("JURI Bun — ", "") : ""}`} />
          <QuickRow icon={Wallet} label="Gaji" value={`${formatRupiah(employee.salaryAmount)} ${employee.salaryType === "BULANAN" ? "/bulan" : "/hari"}`} />
          <QuickRow icon={Plane} label="Saldo Cuti" value={`${employee.leaveBalanceDays} hari${pendingLeaves > 0 ? ` · ${pendingLeaves} pending` : ""}`} />
          <QuickRow icon={CalendarDays} label="Kontrak Berakhir" value={activeContract ? formatDateMed(activeContract.endDate) : "-"} />
          {todayAtt ? (
            <QuickRow icon={User} label="Absensi Hari Ini" value={<StatusBadge status={todayAtt.status} />} />
          ) : null}
        </div>

        {/* Kontak */}
        {(employee.phone || employee.email) && (
          <div className="space-y-1 border-t border-border p-3">
            {employee.phone ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Phone className="size-3" /> {employee.phone}
              </div>
            ) : null}
            {employee.email ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Mail className="size-3" /> {employee.email}
              </div>
            ) : null}
          </div>
        )}

        {/* Action */}
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs"
            onClick={() => { window.location.hash = `#/karyawan?id=${employee.id}`; }}
          >
            Lihat Detail Lengkap
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function QuickRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="w-28 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {value ?? "—"}
      </span>
    </div>
  );
}
