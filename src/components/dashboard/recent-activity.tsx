"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { formatDateTimeMed, cn } from "@/lib/utils";
import { navigate } from "@/lib/router/use-route";
import {
  FileText,
  Clock,
  CalendarRange,
  Users,
  Wallet,
  CheckCircle2,
  Pencil,
  Plus,
  type LucideIcon,
} from "lucide-react";

const MODULE_META: Record<string, { icon: LucideIcon; color: string }> = {
  Karyawan: { icon: Users, color: "text-info" },
  Kontrak: { icon: FileText, color: "text-warning" },
  Lembur: { icon: Clock, color: "text-primary" },
  Jadwal: { icon: CalendarRange, color: "text-info" },
  Cuti: { icon: CheckCircle2, color: "text-success" },
  Payroll: { icon: Wallet, color: "text-chart-4" },
};

const ACTION_ICON: Record<string, LucideIcon> = {
  CREATE: Plus,
  UPDATE: Pencil,
  APPROVE: CheckCircle2,
};

export function RecentActivity() {
  const activities = useStore((s) => s.auditLogs);

  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
          <CardDescription className="text-xs">
            Riwayat aksi HRD terbaru
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => navigate("#/audit")}
        >
          Lihat semua
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[340px]">
          <div className="divide-y divide-border px-6">
            {activities.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Belum ada aktivitas tercatat.
              </p>
            ) : (
              activities.slice(0, 10).map((a) => {
                const meta = MODULE_META[a.module] ?? {
                  icon: FileText,
                  color: "text-muted-foreground",
                };
                const ActionIcon = ACTION_ICON[a.action] ?? Pencil;
                const Icon = meta.icon;
                return (
                  <div key={a.id} className="flex items-start gap-3 py-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted",
                        meta.color,
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <ActionIcon className="size-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {a.module} · {a.action}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {a.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.actor} · {formatDateTimeMed(a.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
