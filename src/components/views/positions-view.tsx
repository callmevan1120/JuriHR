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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Field, FormRow } from "@/components/common/field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable, selectionColumn } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { useStore } from "@/hooks/use-store";
import { positionService, divisionService, lookupService } from "@/lib/services/master-data";
import {
  formatRupiah,
  formatDateMed,
  cn,
} from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Division, Position, RecordStatus } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Archive,
  Briefcase,
  Building2,
  Users,
  Hash,
} from "lucide-react";

export function PositionsView() {
  const positions = useStore((s) => s.positions);
  const divisions = useStore((s) => s.divisions);
  const employees = useStore((s) => s.employees);

  const [dialog, setDialog] = React.useState<{
    type: "position" | "division" | null;
    mode: "create" | "edit";
    data?: Position | Division;
  }>({ type: null, mode: "create" });

  const [confirm, setConfirm] = React.useState<{
    type: "position" | "division";
    id: string;
    name: string;
  } | null>(null);

  const empCountByPosition = React.useMemo(() => {
    const m = new Map<string, number>();
    employees.forEach((e) => m.set(e.positionId, (m.get(e.positionId) ?? 0) + 1));
    return m;
  }, [employees]);
  const empCountByDivision = React.useMemo(() => {
    const m = new Map<string, number>();
    employees.forEach((e) => m.set(e.divisionId, (m.get(e.divisionId) ?? 0) + 1));
    return m;
  }, [employees]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Posisi & Divisi"
        description="Master data jabatan dan divisi beserta kategori OUTLET atau NON_OUTLET."
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog({ type: "division", mode: "create" })}>
              <Plus className="size-4" /> Divisi
            </Button>
            <Button onClick={() => setDialog({ type: "position", mode: "create" })}>
              <Plus className="size-4" /> Posisi
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PositionsPanel
          positions={positions}
          empCount={empCountByPosition}
          onEdit={(p) => setDialog({ type: "position", mode: "edit", data: p })}
          onArchive={(p) => setConfirm({ type: "position", id: p.id, name: p.name })}
        />
        <DivisionsPanel
          divisions={divisions}
          empCount={empCountByDivision}
          onEdit={(d) => setDialog({ type: "division", mode: "edit", data: d })}
          onArchive={(d) => setConfirm({ type: "division", id: d.id, name: d.name })}
        />
      </div>

      {dialog.type ? (
        dialog.type === "position" ? (
          <PositionFormDialog
            open
            onOpenChange={(o) => !o && setDialog({ type: null, mode: "create" })}
            mode={dialog.mode}
            data={dialog.data as Position | undefined}
          />
        ) : (
          <DivisionFormDialog
            open
            onOpenChange={(o) => !o && setDialog({ type: null, mode: "create" })}
            mode={dialog.mode}
            data={dialog.data as Division | undefined}
          />
        )
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Arsipkan data?"
        description={`"${confirm?.name}" akan diarsipkan (soft delete). Data tetap tersimpan dan dapat dipulihkan.`}
        destructive
        confirmLabel="Arsipkan"
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.type === "position") positionService.softDelete(confirm.id);
          else divisionService.softDelete(confirm.id);
          toast.success("Data diarsipkan");
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Panel Posisi
// ------------------------------------------------------------
function PositionsPanel({
  positions,
  empCount,
  onEdit,
  onArchive,
}: {
  positions: Position[];
  empCount: Map<string, number>;
  onEdit: (p: Position) => void;
  onArchive: (p: Position) => void;
}) {
  const columns: ColumnDef<Position>[] = [
    {
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-foreground">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Posisi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Briefcase className="size-3.5" />
          </div>
          <span className="font-medium text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.category}
          label={row.original.category === "OUTLET" ? "Outlet" : "Non-Outlet"}
          className={cn(
            row.original.category === "OUTLET"
              ? "bg-primary/15 text-primary-foreground border-primary/30"
              : "bg-info/15 text-info border-info/30",
          )}
        />
      ),
    },
    {
      id: "salary",
      header: "Gaji (Bulanan)",
      cell: ({ row }) => (
        <span className="tabular-nums text-foreground">
          {row.original.defaultMonthlySalary > 0
            ? formatRupiah(row.original.defaultMonthlySalary)
            : "—"}
        </span>
      ),
    },
    {
      id: "empCount",
      header: "Karyawan",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
          <Users className="size-3" />
          {empCount.get(row.original.id) ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.original);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(row.original);
            }}
          >
            <Archive className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Daftar Posisi</CardTitle>
              <CardDescription className="text-xs">{positions.length} posisi terdaftar</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={[selectionColumn<Position>(), ...columns] as ColumnDef<Position>[]}
          data={positions}
          searchPlaceholder="Cari posisi..."
          pageSize={8}
          globalFilterFn={(row, q) =>
            (row.name + row.code).toLowerCase().includes(q.toLowerCase())
          }
        />
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Panel Divisi
// ------------------------------------------------------------
function DivisionsPanel({
  divisions,
  empCount,
  onEdit,
  onArchive,
}: {
  divisions: Division[];
  empCount: Map<string, number>;
  onEdit: (d: Division) => void;
  onArchive: (d: Division) => void;
}) {
  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-info/10 text-info">
            <Building2 className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base">Daftar Divisi</CardTitle>
            <CardDescription className="text-xs">{divisions.length} divisi terdaftar</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {divisions.map((d) => (
          <div
            key={d.id}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-info/10 text-info">
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-medium text-muted-foreground">{d.code}</span>
                <span className="truncate text-sm font-medium text-foreground">{d.name}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" />
                  {empCount.get(d.id) ?? 0} karyawan
                </span>
                <span>·</span>
                <span>Kepala: {lookupService.employeeName(d.headId)}</span>
              </div>
            </div>
            <StatusBadge
              status={d.category}
              label={d.category === "OUTLET" ? "Outlet" : "Non-Outlet"}
              className={cn(
                d.category === "OUTLET"
                  ? "bg-primary/15 text-primary-foreground border-primary/30"
                  : "bg-info/15 text-info border-info/30",
              )}
            />
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="size-7" onClick={() => onEdit(d)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => onArchive(d)}
              >
                <Archive className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {divisions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada divisi.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
// Form Dialog Posisi
// ------------------------------------------------------------
function PositionFormDialog({
  open,
  onOpenChange,
  mode,
  data,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  data?: Position;
}) {
  const [code, setCode] = React.useState(data?.code ?? "");
  const [name, setName] = React.useState(data?.name ?? "");
  const [category, setCategory] = React.useState<"OUTLET" | "NON_OUTLET">(data?.category ?? "OUTLET");
  const [monthly, setMonthly] = React.useState(String(data?.defaultMonthlySalary ?? 0));
  const [daily, setDaily] = React.useState(String(data?.defaultDailySalary ?? 0));
  const [status, setStatus] = React.useState<RecordStatus>(data?.status ?? "active");
  const [note, setNote] = React.useState(data?.note ?? "");
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (open) {
      setCode(data?.code ?? "");
      setName(data?.name ?? "");
      setCategory(data?.category ?? "OUTLET");
      setMonthly(String(data?.defaultMonthlySalary ?? 0));
      setDaily(String(data?.defaultDailySalary ?? 0));
      setStatus(data?.status ?? "active");
      setNote(data?.note ?? "");
      setError(undefined);
    }
  }, [open, data]);

  const submit = () => {
    if (!code.trim() || !name.trim()) {
      setError("Kode dan nama wajib diisi.");
      return;
    }
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      defaultMonthlySalary: Number(monthly) || 0,
      defaultDailySalary: Number(daily) || 0,
      status,
      note: note.trim() || undefined,
    };
    if (mode === "edit" && data) {
      positionService.update(data.id, payload);
      toast.success("Posisi diperbarui");
    } else {
      positionService.create(payload);
      toast.success("Posisi ditambahkan");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Posisi" : "Tambah Posisi"}</DialogTitle>
          <DialogDescription>
            Master jabatan dengan kategori dan default gaji.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormRow>
            <Field label="Kode Posisi" required>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BAR" className="pl-8" maxLength={6} />
              </div>
            </Field>
            <Field label="Nama Posisi" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Barista" />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Kategori">
              <Select value={category} onValueChange={(v) => setCategory(v as "OUTLET" | "NON_OUTLET")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTLET">Outlet</SelectItem>
                  <SelectItem value="NON_OUTLET">Non-Outlet</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as RecordStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Default Gaji Bulanan" hint="Untuk karyawan bergaji bulanan.">
              <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} className="tabular-nums" />
            </Field>
            <Field label="Default Gaji Harian" hint="Untuk karyawan bergaji harian.">
              <Input type="number" value={daily} onChange={(e) => setDaily(e.target.value)} className="tabular-nums" />
            </Field>
          </FormRow>
          <Field label="Catatan">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Opsional" />
          </Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit}>{mode === "edit" ? "Simpan" : "Tambah"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Form Dialog Divisi
// ------------------------------------------------------------
function DivisionFormDialog({
  open,
  onOpenChange,
  mode,
  data,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  data?: Division;
}) {
  const [code, setCode] = React.useState(data?.code ?? "");
  const [name, setName] = React.useState(data?.name ?? "");
  const [category, setCategory] = React.useState<"OUTLET" | "NON_OUTLET">(data?.category ?? "NON_OUTLET");
  const [status, setStatus] = React.useState<RecordStatus>(data?.status ?? "active");
  const [note, setNote] = React.useState(data?.note ?? "");
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (open) {
      setCode(data?.code ?? "");
      setName(data?.name ?? "");
      setCategory(data?.category ?? "NON_OUTLET");
      setStatus(data?.status ?? "active");
      setNote(data?.note ?? "");
      setError(undefined);
    }
  }, [open, data]);

  const submit = () => {
    if (!code.trim() || !name.trim()) {
      setError("Kode dan nama wajib diisi.");
      return;
    }
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      status,
      note: note.trim() || undefined,
    };
    if (mode === "edit" && data) {
      divisionService.update(data.id, payload);
      toast.success("Divisi diperbarui");
    } else {
      divisionService.create(payload);
      toast.success("Divisi ditambahkan");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Divisi" : "Tambah Divisi"}</DialogTitle>
          <DialogDescription>Master divisi organisasi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormRow>
            <Field label="Kode Divisi" required>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="OPS" className="pl-8" maxLength={6} />
              </div>
            </Field>
            <Field label="Nama Divisi" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Operasional Outlet" />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Kategori">
              <Select value={category} onValueChange={(v) => setCategory(v as "OUTLET" | "NON_OUTLET")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTLET">Outlet</SelectItem>
                  <SelectItem value="NON_OUTLET">Non-Outlet</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <div className="flex items-center gap-2">
                <Switch checked={status === "active"} onCheckedChange={(c) => setStatus(c ? "active" : "inactive")} />
                <span className="text-sm">{status === "active" ? "Aktif" : "Nonaktif"}</span>
              </div>
            </Field>
          </FormRow>
          <Field label="Catatan">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Opsional" />
          </Field>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit}>{mode === "edit" ? "Simpan" : "Tambah"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
