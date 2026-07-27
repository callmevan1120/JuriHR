"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { getStore } from "@/lib/data/store";
import { navigate } from "@/lib/router/use-route";
import { cn, formatDateTimeMed } from "@/lib/utils";
import { toast } from "sonner";
import type { NotificationCategory } from "@/lib/types";

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  KONTRAK: "Kontrak",
  JADWAL: "Jadwal",
  TUKAR_SHIFT: "Tukar Shift",
  TUKAR_LIBUR: "Tukar Libur",
  LEMBUR: "Lembur",
  ABSENSI: "Absensi",
  CUTI: "Cuti",
  PAYROLL: "Payroll",
  DOMISILI: "Domisili",
  ANOMALI: "Anomali",
};

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

export function NotificationPopover() {
  const notifications = useStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length;

  const markAsRead = (id: string) => {
    const store = getStore();
    const updated = store.getState().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    store.setCollection("notifications", updated);
  };

  const markAllAsRead = () => {
    const store = getStore();
    const updated = store.getState().notifications.map((n) =>
      n.archived ? n : { ...n, read: true },
    );
    store.setCollection("notifications", updated);
    toast.success("Semua notifikasi ditandai dibaca");
  };

  const handleOpen = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      navigate(link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-full"
          aria-label="Notifikasi"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifikasi</span>
            {unreadCount > 0 ? (
              <Badge className="bg-destructive text-destructive-foreground">
                {unreadCount} baru
              </Badge>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="size-3.5" />
            Tandai dibaca
          </Button>
        </div>
        <ScrollArea className="max-h-[380px]">
          <div className="divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <BellOff className="size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Tidak ada notifikasi
                </p>
              </div>
            ) : (
              notifications.slice(0, 12).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n.id, n.link)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !n.read && "bg-primary/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      CATEGORY_DOT[n.category],
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {CATEGORY_LABEL[n.category]}
                      </span>
                      {!n.read ? (
                        <span className="size-1.5 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    <p className="text-xs font-medium text-foreground line-clamp-1">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatDateTimeMed(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
