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
import { Badge } from "@/components/ui/badge";
import { Field, FormRow } from "@/components/common/field";
import { InfoRow } from "@/components/common/info-row";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { useStore } from "@/hooks/use-store";
import { useRoute } from "@/lib/router/use-route";
import { outletService, lookupService } from "@/lib/services/master-data";
import dynamic from "next/dynamic";
import {
  formatDistance,
  formatRupiah,
  formatDateMed,
  initials,
  haversineKm,
  cn,
  parseGoogleMapsCoordinates,
} from "@/lib/utils";

const EmployeeMiniMap = dynamic(
  () => import("./employee-mini-map").then((m) => m.EmployeeMiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
        Memuat peta interaktif outlet...
      </div>
    ),
  },
);
import type { Outlet, OutletClassification } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Plus,
  Pencil,
  Archive,
  ChevronRight,
  Users,
  Ruler,
  Navigation,
  Crown,
  Store,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

const CLASSIFICATION_LABEL: Record<OutletClassification, string> = {
  FLAGSHIP: "Flagship",
  STANDARD: "Standard",
  EXPRESS: "Express",
  KIOSK: "Kiosk",
};

const CLASSIFICATION_STYLE: Record<OutletClassification, string> = {
  FLAGSHIP: "bg-primary/15 text-primary-foreground border-primary/30",
  STANDARD: "bg-info/15 text-info border-info/30",
  EXPRESS: "bg-success/15 text-success border-success/30",
  KIOSK: "bg-muted text-muted-foreground border-border",
};

export function OutletView() {
  const outlets = useStore((s) => s.outlets);
  const route = useRoute();
  const selectedId = route.query.get("id");
  const [dialog, setDialog] = React.useState<{ mode: "create" | "edit"; data?: Outlet } | null>(null);
  const [confirm, setConfirm] = React.useState<{ id: string; name: string } | null>(null);

  // Detail view jika ada ?id= (REVISI: Reset state dialog saat Kembali)
  if (selectedId) {
    const outlet = outlets.find((o) => o.id === selectedId);
    if (outlet) {
      return (
        <OutletDetail
          outlet={outlet}
          onEdit={() => setDialog({ mode: "edit", data: outlet })}
          onBack={() => {
            setDialog(null);
            window.location.hash = "#/outlet";
          }}
        />
      );
    }
  }

  const columns: ColumnDef<Outlet>[] = [
    {
      accessorKey: "code",
      header: "Kode",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-foreground">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Outlet",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{row.original.name.replace("JURI Bun — ", "")}</p>
            <p className="truncate text-[11px] text-muted-foreground">{row.original.address}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "classification",
      header: "Klasifikasi",
      cell: ({ row }) => (
        <Badge variant="outline" className={CLASSIFICATION_STYLE[row.original.classification]}>
          {CLASSIFICATION_LABEL[row.original.classification]}
        </Badge>
      ),
    },
    {
      id: "head",
      header: "Kepala Outlet",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {lookupService.employeeName(row.original.headId)}
        </span>
      ),
    },
    {
      id: "geofence",
      header: "Geofence",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
          <Ruler className="size-3" />
          {row.original.geofenceRadiusMeters} m
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
              setDialog({ mode: "edit", data: row.original });
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
              setConfirm({ id: row.original.id, name: row.original.name });
            }}
          >
            <Archive className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Outlet"
        description="Master outlet dengan geofence, kepala outlet, dan statistik karyawan."
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="size-4" /> Tambah Outlet
          </Button>
        }
      />

      <Card className="border-border shadow-soft">
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={outlets.filter((o) => o.status !== "archived")}
            searchPlaceholder="Cari outlet..."
            pageSize={10}
            onRowClick={(o) => (window.location.hash = `#/outlet?id=${o.id}`)}
            globalFilterFn={(row, q) =>
              (row.name + row.code + row.address).toLowerCase().includes(q.toLowerCase())
            }
          />
        </CardContent>
      </Card>

      {dialog ? (
        <OutletFormDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          mode={dialog.mode}
          data={dialog.data}
        />
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Arsipkan outlet?"
        description={`"${confirm?.name}" akan diarsipkan.`}
        destructive
        confirmLabel="Arsipkan"
        onConfirm={() => {
          if (confirm) {
            outletService.softDelete(confirm.id);
            toast.success("Outlet diarsipkan");
          }
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Outlet Detail (REVISI: Mandiri mengelola dialog edit lokal)
// ------------------------------------------------------------
function OutletDetail({
  outlet,
  onEdit,
  onBack,
}: {
  outlet: Outlet;
  onEdit: () => void;
  onBack: () => void;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const stats = React.useMemo(() => outletService.stats(outlet.id), [outlet.id]);
  const employees = useStore((s) => s.employees);
  const positions = useStore((s) => s.positions);
  const domiciles = useStore((s) => s.domiciles);
  const schedules = useStore((s) => s.schedules);
  const attendances = useStore((s) => s.attendances);

  const outletEmps = employees.filter((e) => e.primaryOutletId === outlet.id);
  const todaySched = schedules.filter((s) => s.outletId === outlet.id).length;

  const handleOpenEdit = () => {
    setEditOpen(true);
    if (onEdit) onEdit();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground">
          <ChevronRight className="size-4 rotate-180" /> Kembali
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Detail Outlet</span>
      </div>

      <PageHeader
        title={outlet.name}
        description={outlet.address}
        actions={
          <Button variant="outline" onClick={handleOpenEdit} className="gap-1.5">
            <Pencil className="size-4 text-primary" /> Edit Outlet
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={Users} label="Total Karyawan" value={String(stats.totalEmployees)} accent="primary" />
        <MiniStat icon={Navigation} label="Rata-rata Jarak" value={stats.avgDistanceKm > 0 ? formatDistance(stats.avgDistanceKm) : "—"} accent="info" />
        <MiniStat icon={Ruler} label="Radius Geofence" value={`${outlet.geofenceRadiusMeters} m`} accent="warning" />
        <MiniStat icon={Building2} label="Klasifikasi" value={CLASSIFICATION_LABEL[outlet.classification]} accent="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Info outlet */}
        <Card className="border-border shadow-soft lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" /> Informasi Outlet
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border text-xs">
            <InfoRow label="Kode Outlet" value={<span className="font-mono font-bold text-foreground">{outlet.code}</span>} />
            <InfoRow label="Kepala Outlet" value={lookupService.employeeName(outlet.headId)} />
            <InfoRow label="Klasifikasi" value={<Badge variant="outline" className={CLASSIFICATION_STYLE[outlet.classification]}>{CLASSIFICATION_LABEL[outlet.classification]}</Badge>} />
            <InfoRow label="Status" value={<StatusBadge status={outlet.status} />} />
            <InfoRow label="Latitude (LU / Lintang)" value={<span className="font-mono font-semibold">{outlet.latitude.toFixed(5)}</span>} />
            <InfoRow label="Longitude (LT / Bujur)" value={<span className="font-mono font-semibold">{outlet.longitude.toFixed(5)}</span>} />
            <InfoRow
              label="Buka Peta Maps"
              value={
                <a
                  href={`https://maps.google.com/?q=${outlet.latitude},${outlet.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <MapPin className="size-3.5" /> Peta Google Maps <ExternalLink className="size-3" />
                </a>
              }
            />
            <InfoRow label="Radius Geofence" value={`${outlet.geofenceRadiusMeters} m`} />
            <InfoRow label="Dibuat" value={formatDateMed(outlet.createdAt)} />
            <InfoRow label="Catatan" value={outlet.note} block />
          </CardContent>
        </Card>

        {/* Distribusi posisi + jarak */}
        <Card className="border-border shadow-soft lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" /> Karyawan per Posisi
            </CardTitle>
            <CardDescription className="text-xs">Distribusi &amp; jarak domisili terdekat/terjauh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byPosition.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada karyawan di outlet ini.</p>
            ) : (
              <div className="space-y-2">
                {stats.byPosition.map((p) => (
                  <div key={p.name} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <Badge className="bg-primary/15 text-primary-foreground border-primary/30">{p.count} orang</Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-success">Terdekat</p>
                {stats.nearest ? (
                  <>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{stats.nearest.employee.fullName}</p>
                    <p className="text-xs text-muted-foreground">{formatDistance(stats.nearest.km)}</p>
                  </>
                ) : <p className="mt-1 text-sm text-muted-foreground">—</p>}
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-destructive">Terjauh</p>
                {stats.farthest ? (
                  <>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{stats.farthest.employee.fullName}</p>
                    <p className="text-xs text-muted-foreground">{formatDistance(stats.farthest.km)}</p>
                  </>
                ) : <p className="mt-1 text-sm text-muted-foreground">—</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daftar karyawan outlet */}
      <Card className="border-border shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="size-4 text-primary" /> Daftar Karyawan
          </CardTitle>
          <CardDescription className="text-xs">{outletEmps.length} karyawan di outlet ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {outletEmps.map((e) => {
              const pos = positions.find((p) => p.id === e.positionId);
              const dom = domiciles.find((d) => d.employeeId === e.id);
              const dist = dom ? formatDistance(haversineKm(dom.latitude, dom.longitude, outlet.latitude, outlet.longitude)) : "—";
              const isHead = outlet.headId === e.id;
              return (
                <div
                  key={e.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  onClick={() => (window.location.hash = `#/karyawan?id=${e.id}`)}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary-foreground">
                    {initials(e.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-foreground">{e.fullName}</p>
                      {isHead ? <Crown className="size-3 text-primary" /> : null}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {pos?.name} · {dist}
                    </p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
              );
            })}
          </div>
          {outletEmps.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada karyawan di outlet ini.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Form Edit Dialog Lokal */}
      <OutletFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        data={outlet}
      />
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  accent: "primary" | "info" | "warning" | "neutral";
}) {
  const styles = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
    neutral: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="border-border p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", styles[accent])}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// Form Dialog Outlet (REVISI: Responsif max-h-[90vh] overflow-y-auto)
// ------------------------------------------------------------
function OutletFormDialog({
  open,
  onOpenChange,
  mode,
  data,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  data?: Outlet;
}) {
  const employees = useStore((s) => s.employees);
  const [code, setCode] = React.useState(data?.code ?? "");
  const [name, setName] = React.useState(data?.name ?? "");
  const [address, setAddress] = React.useState(data?.address ?? "");
  const [lat, setLat] = React.useState(String(data?.latitude ?? -6.2));
  const [lon, setLon] = React.useState(String(data?.longitude ?? 106.8));
  const [mapsLink, setMapsLink] = React.useState("");
  const [radius, setRadius] = React.useState(String(data?.geofenceRadiusMeters ?? 100));
  const [classification, setClassification] = React.useState<OutletClassification>(data?.classification ?? "STANDARD");
  const [headId, setHeadId] = React.useState(data?.headId ?? "");
  const [note, setNote] = React.useState(data?.note ?? "");
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (open) {
      setCode(data?.code ?? "");
      setName(data?.name ?? "");
      setAddress(data?.address ?? "");
      setLat(String(data?.latitude ?? -6.2));
      setLon(String(data?.longitude ?? 106.8));
      setMapsLink(data?.latitude ? `https://maps.google.com/?q=${data.latitude},${data.longitude}` : "");
      setRadius(String(data?.geofenceRadiusMeters ?? 100));
      setClassification(data?.classification ?? "STANDARD");
      setHeadId(data?.headId ?? "");
      setNote(data?.note ?? "");
      setError(undefined);
    }
  }, [open, data]);

  const handleMapsLinkChange = (url: string) => {
    setMapsLink(url);
    const coords = parseGoogleMapsCoordinates(url);
    if (coords) {
      setLat(coords.lat.toFixed(6));
      setLon(coords.lon.toFixed(6));
      toast.info(`Koordinat outlet terdeteksi: Lat ${coords.lat.toFixed(5)}, Lon ${coords.lon.toFixed(5)}`);
    }
  };

  const submit = () => {
    if (!code.trim() || !name.trim()) {
      setError("Kode dan nama outlet wajib diisi.");
      return;
    }
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      address: address.trim(),
      latitude: Number(lat) || -6.2,
      longitude: Number(lon) || 106.8,
      geofenceRadiusMeters: Number(radius) || 100,
      classification,
      headId: headId || undefined,
      status: data?.status ?? "active",
      note: note.trim() || undefined,
    };
    if (mode === "edit" && data) {
      outletService.update(data.id, payload);
      toast.success("Outlet berhasil diperbarui");
    } else {
      outletService.create(payload);
      toast.success("Outlet baru berhasil ditambahkan");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Store className="size-5 text-primary" />
            {mode === "edit" ? "Edit Data Outlet Cabang" : "Tambah Outlet Cabang Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Lengkapi profil outlet, lokasi alamat, koordinat (LU / LT), radius geofence, serta penunjukan kepala outlet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FormRow>
            <Field label="Kode Outlet" required hint="Contoh: JBD-SDR">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="JBD-SDR" maxLength={12} className="font-mono" />
            </Field>
            <Field label="Nama Outlet" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="JURI Bun — Sudirman" />
            </Field>
          </FormRow>

          <Field label="Alamat Outlet Lengkap">
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Jl. Jend. Sudirman No. 1, Jakarta Pusat..." />
          </Field>

          <Field label="Link Google Maps (Opsional)" hint="Tempel link peta untuk mengekstrak koordinat otomatis">
            <Input
              value={mapsLink}
              onChange={(e) => handleMapsLinkChange(e.target.value)}
              placeholder="https://maps.google.com/?q=-6.214,106.845"
            />
          </Field>

          <FormRow>
            <Field label="Latitude (LU / Lintang)" required hint="Derajat Lintang (-6.xxxx)">
              <div className="relative">
                <Navigation className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} className="pl-8 font-mono tabular-nums text-xs" />
              </div>
            </Field>
            <Field label="Longitude (LT / Bujur)" required hint="Derajat Bujur Timur (106.xxxx)">
              <div className="relative">
                <Navigation className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input type="number" step="any" value={lon} onChange={(e) => setLon(e.target.value)} className="pl-8 font-mono tabular-nums text-xs" />
              </div>
            </Field>
          </FormRow>

          {/* Pratinjau Peta Lokasi Outlet Langsung */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
              <span>Pratinjau Peta Lokasi Outlet (Real-time):</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                Lat: {Number(lat).toFixed(5)}, Lon: {Number(lon).toFixed(5)}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <EmployeeMiniMap
                lat={Number(lat) || -6.2}
                lon={Number(lon) || 106.8}
                employeeName={name || "Lokasi Outlet Cabang"}
                editable={true}
                height={220}
                onPick={(newLat, newLon) => {
                  setLat(newLat.toFixed(6));
                  setLon(newLon.toFixed(6));
                  setMapsLink(`https://maps.google.com/?q=${newLat.toFixed(6)},${newLon.toFixed(6)}`);
                  toast.success(`Koordinat outlet disesuaikan dari peta: Lat ${newLat.toFixed(5)}, Lon ${newLon.toFixed(5)}`);
                }}
              />
            </div>
          </div>

          <FormRow>
            <Field label="Radius Geofence Presensi (meter)">
              <Input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} className="tabular-nums" />
            </Field>
            <Field label="Klasifikasi Outlet">
              <Select value={classification} onValueChange={(v) => setClassification(v as OutletClassification)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLAGSHIP">Flagship (Utama)</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="EXPRESS">Express</SelectItem>
                  <SelectItem value="KIOSK">Kiosk</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FormRow>

          <Field label="Kepala Outlet (Supervisor Direct)">
            <Select value={headId} onValueChange={setHeadId}>
              <SelectTrigger><SelectValue placeholder="Pilih penanggung jawab..." /></SelectTrigger>
              <SelectContent>
                {employees.filter((e) => e.category === "OUTLET" && e.status === "AKTIF").map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.fullName} — {e.nik}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Catatan Internal Outlet">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Catatan fasilitas atau operasional outlet..." />
          </Field>

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit}>{mode === "edit" ? "Simpan Perubahan" : "Tambah Outlet"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
