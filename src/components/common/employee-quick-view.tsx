"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Eye,
  CreditCard,
  FileText,
} from "lucide-react";

interface Props {
  employee: Employee;
  children: React.ReactNode;
}

export function EmployeeQuickView({ employee, children }: Props) {
  const [open, setOpen] = React.useState(false);

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

  const categoryLabels: Record<string, string> = {
    OUTLET: "Karyawan Outlet",
    PH_KLATEN: "PH Klaten",
    GUDANG_JAKARTA: "Gudang Jakarta",
    NON_OUTLET: "Head Office HQ",
  };

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
        {children}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border-border shadow-2xl">
          {/* Header Dialog di Tengah Layar */}
          <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-lg font-bold shadow-md">
                {initials(employee.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-base font-bold text-foreground">{employee.fullName}</h3>
                  <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                    {employee.nik}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={employee.status} />
                  <Badge
                    className={cn(
                      employee.category === "OUTLET"
                        ? "bg-primary/15 text-primary-foreground border-primary/30"
                        : "bg-info/15 text-info border-info/30",
                    )}
                  >
                    {categoryLabels[employee.category] || employee.category}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Body Info Rapi */}
          <div className="p-5 space-y-3.5">
            <div className="divide-y divide-border/60 text-xs border border-border/60 rounded-xl bg-card overflow-hidden">
              <QuickRow icon={Briefcase} label="Posisi / Jabatan" value={position?.name} />
              <QuickRow
                icon={Building2}
                label="Divisi / Lokasi"
                value={`${division?.name ?? "-"}${
                  employee.category === "OUTLET" && outlet
                    ? " · " + outlet.name.replace("JURI Bun — ", "")
                    : ""
                }`}
              />
              <QuickRow
                icon={Wallet}
                label="Gaji"
                value={`${formatRupiah(employee.salaryAmount)} ${
                  employee.salaryType === "BULANAN" ? "/bulan" : "/hari"
                }`}
              />
              <QuickRow
                icon={CreditCard}
                label="Rekening Bank"
                value={`${employee.bankName || "BCA"} - ${employee.accountNumber || "—"}`}
              />
              <QuickRow
                icon={FileText}
                label="Masa Kerja / Kontrak"
                value={`${employee.contractType || "PKWT"} (${employee.contractDurationMonths || 12} Bln)`}
              />
              <QuickRow
                icon={Plane}
                label="Saldo Cuti"
                value={`${employee.leaveBalanceDays} hari${
                  pendingLeaves > 0 ? ` · ${pendingLeaves} pengajuan pending` : ""
                }`}
              />
              <QuickRow
                icon={CalendarDays}
                label="Jatuh Tempo Kontrak"
                value={activeContract ? formatDateMed(activeContract.endDate) : "-"}
              />
              {todayAtt ? (
                <QuickRow
                  icon={User}
                  label="Absensi Hari Ini"
                  value={<StatusBadge status={todayAtt.status} />}
                />
              ) : null}
            </div>

            {/* Kontak Telepon & Email */}
            {(employee.phone || employee.email) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-muted/30 p-3 text-xs border border-border/40">
                {employee.phone ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                    <Phone className="size-3.5 text-primary shrink-0" />
                    <span>{employee.phone}</span>
                  </div>
                ) : null}
                {employee.email ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                    <Mail className="size-3.5 text-primary shrink-0" />
                    <span>{employee.email}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Action Footer Modal */}
          <div className="border-t border-border/60 bg-muted/20 p-3 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => {
                setOpen(false);
                window.location.hash = `#/karyawan?id=${employee.id}`;
              }}
            >
              Lihat Detail Halaman <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold text-foreground truncate text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}
