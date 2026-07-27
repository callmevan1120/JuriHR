"use client";

import * as React from "react";
import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/states";
import { useStore } from "@/hooks/use-store";
import { reportService } from "@/lib/services/finance";
import { cn, formatDateTimeMed } from "@/lib/utils";
import { toast } from "sonner";
import {
  ScrollText,
  Search,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";

const MODULE_COLORS: Record<string, string> = {
  Karyawan: "bg-primary/15 text-primary-foreground border-primary/30",
  Kontrak: "bg-warning/15 text-warning border-warning/30",
  Lembur: "bg-primary/15 text-primary border-primary/30",
  Jadwal: "bg-info/15 text-info border-info/30",
  Cuti: "bg-success/15 text-success border-success/30",
  Payroll: "bg-chart-4/15 text-foreground border-chart-4/30",
  Outlet: "bg-info/15 text-info border-info/30",
  Posisi: "bg-muted text-muted-foreground border-border",
  Divisi: "bg-muted text-muted-foreground border-border",
  Domisili: "bg-chart-5/15 text-foreground border-chart-5/30",
  "Shift Template": "bg-info/15 text-info border-info/30",
  "Shift Group": "bg-info/15 text-info border-info/30",
  "Holiday Group": "bg-success/15 text-success border-success/30",
  "Holiday": "bg-success/15 text-success border-success/30",
  "Holiday Override": "bg-success/15 text-success border-success/30",
  "Tukar Shift": "bg-info/15 text-info border-info/30",
  Absensi: "bg-chart-3/15 text-foreground border-chart-3/30",
  Notifikasi: "bg-muted text-muted-foreground border-border",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-success/15 text-success border-success/30",
  UPDATE: "bg-info/15 text-info border-info/30",
  DELETE: "bg-destructive/10 text-destructive border-destructive/30",
  APPROVE: "bg-success/15 text-success border-success/30",
  REJECT: "bg-destructive/10 text-destructive border-destructive/30",
  GENERATE: "bg-primary/15 text-primary border-primary/30",
  BULK_CREATE: "bg-primary/15 text-primary border-primary/30",
  BULK_UPDATE: "bg-info/15 text-info border-info/30",
  EXTEND: "bg-primary/15 text-primary border-primary/30",
  LOCK: "bg-warning/15 text-warning border-warning/30",
  UNLOCK: "bg-info/15 text-info border-info/30",
  COPY_WEEK: "bg-info/15 text-info border-info/30",
  VERIFY: "bg-success/15 text-success border-success/30",
  MARK_ALL_READ: "bg-muted text-muted-foreground border-border",
};

export function AuditView() {
  const auditLogs = useStore((s) => s.auditLogs);
  const [search, setSearch] = React.useState("");
  const [filterModule, setFilterModule] = React.useState("all");
  const [filterAction, setFilterAction] = React.useState("all");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const modules = Array.from(new Set(auditLogs.map((l) => l.module))).sort();
  const actions = Array.from(new Set(auditLogs.map((l) => l.action))).sort();

  const filtered = auditLogs
    .filter((l) => {
      if (filterModule !== "all" && l.module !== filterModule) return false;
      if (filterAction !== "all" && l.action !== filterAction) return false;
      if (search) {
        const hay = `${l.description} ${l.actor} ${l.module} ${l.action}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const headers = ["Waktu", "Aktor", "Modul", "Aksi", "Deskripsi"];
    const rows = filtered.map((l) => [l.createdAt, l.actor, l.module, l.action, l.description]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log diekspor");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Audit Log"
        description="Catatan perubahan penting: aktor, waktu, modul, aksi, data sebelum & sesudah."
        actions={<Button variant="outline" size="sm" onClick={handleExport}><Download className="size-4" /> Export</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Log" value={auditLogs.length} color="text-foreground" />
        <StatCard label="Create" value={auditLogs.filter((l) => l.action === "CREATE").length} color="text-success" />
        <StatCard label="Update" value={auditLogs.filter((l) => l.action === "UPDATE").length} color="text-info" />
        <StatCard label="Delete" value={auditLogs.filter((l) => l.action === "DELETE").length} color="text-destructive" />
      </div>

      {/* Filter */}
      <Card className="border-border shadow-soft">
        <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari log..." className="pl-8" />
          </div>
          <Filter className="size-4 text-muted-foreground" />
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="h-9 w-[150px] text-sm"><SelectValue placeholder="Modul" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Modul</SelectItem>
              {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="h-9 w-[150px] text-sm"><SelectValue placeholder="Aksi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          {(search || filterModule !== "all" || filterAction !== "all") ? (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSearch(""); setFilterModule("all"); setFilterAction("all"); }}>Reset</Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><ScrollText className="size-4 text-primary" /> Timeline Aktivitas</CardTitle>
          <CardDescription className="text-xs">{filtered.length} log</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title="Tidak ada log" description="Belum ada aktivitas tercatat pada filter ini." className="m-4" />
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="relative px-4 py-3 before:absolute before:left-7 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-border">
                {filtered.map((log) => {
                  const isExpanded = expanded.has(log.id);
                  const hasData = log.before || log.after;
                  return (
                    <div key={log.id} className="relative flex gap-3 pb-3">
                      <button
                        onClick={() => hasData && toggleExpand(log.id)}
                        className={cn(
                          "relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground",
                          hasData ? "cursor-pointer hover:scale-110" : "",
                        )}
                      >
                        {log.action === "CREATE" ? "C" : log.action === "UPDATE" ? "U" : log.action === "DELETE" ? "D" : log.action === "APPROVE" ? "A" : log.action.slice(0, 1)}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className={cn("text-[10px]", MODULE_COLORS[log.module] ?? "bg-muted text-muted-foreground border-border")}>{log.module}</Badge>
                          <Badge variant="outline" className={cn("text-[10px]", ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground border-border")}>{log.action}</Badge>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><User className="size-2.5" />{log.actor}</span>
                          <span className="text-[10px] text-muted-foreground/70">· {formatDateTimeMed(log.createdAt)}</span>
                          {hasData ? (
                            <button onClick={() => toggleExpand(log.id)} className="ml-auto text-[10px] text-primary hover:underline">
                              {isExpanded ? "Sembunyikan" : "Detail"}
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-foreground">{log.description}</p>
                        {hasData && isExpanded ? (
                          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {log.before ? (
                              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                                <p className="mb-1 text-[10px] font-semibold uppercase text-destructive">Sebelum</p>
                                <pre className="overflow-x-auto text-[10px] text-foreground">{typeof log.before === "string" ? log.before : JSON.stringify(log.before, null, 2)}</pre>
                              </div>
                            ) : null}
                            {log.after ? (
                              <div className="rounded-lg border border-success/30 bg-success/5 p-2">
                                <p className="mb-1 text-[10px] font-semibold uppercase text-success">Sesudah</p>
                                <pre className="overflow-x-auto text-[10px] text-foreground">{typeof log.after === "string" ? log.after : JSON.stringify(log.after, null, 2)}</pre>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="border-border p-4 shadow-soft">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", color)}>{value}</p>
    </Card>
  );
}
