"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/states";
import { useStore } from "@/hooks/use-store";
import { notificationService } from "@/lib/services/finance";
import { navigate } from "@/lib/router/use-route";
import { cn, formatDateTimeMed } from "@/lib/utils";
import type { NotificationCategory } from "@/lib/types";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  CheckCheck,
  Archive,
  ArchiveRestore,
  Filter,
  Inbox,
} from "lucide-react";

const CATEGORIES: { value: NotificationCategory | "all"; label: string; dot: string }[] = [
  { value: "all", label: "Semua", dot: "" },
  { value: "KONTRAK", label: "Kontrak", dot: "bg-warning" },
  { value: "JADWAL", label: "Jadwal", dot: "bg-info" },
  { value: "TUKAR_SHIFT", label: "Tukar Shift", dot: "bg-info" },
  { value: "TUKAR_LIBUR", label: "Tukar Libur", dot: "bg-info" },
  { value: "LEMBUR", label: "Lembur", dot: "bg-primary" },
  { value: "ABSENSI", label: "Absensi", dot: "bg-chart-3" },
  { value: "CUTI", label: "Cuti", dot: "bg-success" },
  { value: "PAYROLL", label: "Payroll", dot: "bg-chart-4" },
  { value: "DOMISILI", label: "Domisili", dot: "bg-chart-5" },
  { value: "ANOMALI", label: "Anomali", dot: "bg-destructive" },
];

const CATEGORY_DOT: Record<NotificationCategory, string> = {
  KONTRAK: "bg-warning",
  JADWAL: "bg-info",
  TUKAR_SHIFT: "bg-info",
  TUKAR_LIBUR: "bg-info",
  LEMBUR: "bg-primary",
  ABSENSI: "bg-chart-3",
  CUTI: "bg-success",
  PAYROLL: "bg-chart-4",
  DOMISILI: "bg-chart-5",
  ANOMALI: "bg-destructive",
};

export function NotificationView() {
  const notifications = useStore((s) => s.notifications);
  const [filter, setFilter] = React.useState<NotificationCategory | "all">("all");
  const [showArchived, setShowArchived] = React.useState(false);

  const filtered = notifications
    .filter((n) => {
      if (filter !== "all" && n.category !== filter) return false;
      if (!showArchived && n.archived) return false;
      if (showArchived && !n.archived) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length;
  const archivedCount = notifications.filter((n) => n.archived).length;

  const counts = CATEGORIES.map((c) => ({
    ...c,
    count: c.value === "all"
      ? notifications.filter((n) => !n.archived).length
      : notifications.filter((n) => n.category === c.value && !n.archived).length,
  }));

  const handleOpen = (id: string, link?: string) => {
    notificationService.markAsRead(id);
    if (link) navigate(link);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pusat Notifikasi"
        description={`${unreadCount} belum dibaca · ${archivedCount} diarsipkan`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="size-4" /> {showArchived ? "Aktif" : "Arsip"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                notificationService.markAllAsRead();
                toast.success("Semua notifikasi ditandai dibaca");
              }}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="size-4" /> Tandai Semua Dibaca
            </Button>
          </>
        }
      />

      {/* Category filter */}
      <Card className="border-border shadow-soft">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="size-4 shrink-0 text-muted-foreground" />
            {counts.map((c) => (
              <button
                key={c.value}
                onClick={() => setFilter(c.value)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
                  filter === c.value ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c.dot ? <span className={cn("size-2 rounded-full", c.dot)} /> : null}
                {c.label}
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{c.count}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification list */}
      <Card className="border-border shadow-soft">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              title={showArchived ? "Tidak notifikasi diarsip" : "Tidak ada notifikasi"}
              description={showArchived ? "Notifikasi yang diarsipkan akan muncul di sini." : "Notifikasi baru akan muncul di sini."}
              icon={<BellOff className="size-6 text-muted-foreground" />}
              className="m-4"
            />
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="divide-y divide-border">
                {filtered.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/30",
                      !n.read && "bg-primary/[0.03]",
                    )}
                  >
                    <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", CATEGORY_DOT[n.category])} />
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => handleOpen(n.id, n.link)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{n.category.replace(/_/g, " ")}</span>
                        {!n.read ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                        {n.archived ? <Badge variant="outline" className="text-[9px]">Arsip</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-foreground line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">{formatDateTimeMed(n.createdAt)}</p>
                    </button>
                    <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!n.read ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Tandai dibaca"
                          onClick={() => { notificationService.markAsRead(n.id); toast.success("Ditandai dibaca"); }}
                        >
                          <CheckCheck className="size-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title={n.archived ? "Keluarkan dari arsip" : "Arsipkan"}
                        onClick={() => n.archived ? notificationService.unarchive(n.id) : notificationService.archive(n.id)}
                      >
                        {n.archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
