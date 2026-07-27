"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { Field, FormRow } from "@/components/common/field";
import { InfoRow } from "@/components/common/info-row";
import { useStore } from "@/hooks/use-store";
import { domicileService } from "@/lib/services/master-data";
import {
  formatDistance,
  formatDateMed,
  haversineKm,
} from "@/lib/utils";
import type { CoordinateSource, Domicile, Employee } from "@/lib/types";
import { toast } from "sonner";
import {
  Pencil,
  Save,
  X,
  MapPin,
  Navigation,
  Search,
  Store,
  RefreshCw,
} from "lucide-react";

// Leaflet mengakses `window` saat import → load client-only.
const EmployeeMiniMap = dynamic(
  () => import("./employee-mini-map").then((m) => m.EmployeeMiniMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
        Memuat peta...
      </div>
    ),
  },
);

interface Props {
  employee: Employee;
  editing: boolean;
  onClose: () => void;
}

const SOURCE_LABEL: Record<CoordinateSource, string> = {
  MANUAL: "Manual",
  MAP_PICKER: "Map Picker",
  ADDRESS_LOOKUP: "Address Lookup",
  OUTLET_BASED: "Outlet Based",
};

export function DomicileEditor({ employee, editing, onClose }: Props) {
  const domiciles = useStore((s) => s.domiciles);
  const outlets = useStore((s) => s.outlets);
  const domicile = domiciles.find((d) => d.employeeId === employee.id);

  const primaryOutlet = outlets.find((o) => o.id === employee.primaryOutletId);

  if (editing) {
    return (
      <DomicileForm
        employee={employee}
        initial={domicile}
        onClose={onClose}
      />
    );
  }

  if (!domicile) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Belum ada data domisili untuk karyawan ini.</p>
        <Button onClick={onClose ? () => { onClose(); } : undefined}>
          <Pencil className="size-4" /> Tambah Domisili
        </Button>
      </div>
    );
  }

  const distance = primaryOutlet
    ? haversineKm(domicile.latitude, domicile.longitude, primaryOutlet.latitude, primaryOutlet.longitude)
    : null;
  const nearest = domicileService.nearestOutlets(domicile.latitude, domicile.longitude, 3);

  return (
    <div className="space-y-4">
      <CardContent className="divide-y divide-border px-0">
        <InfoRow label="Alamat" value={domicile.address} block />
        <InfoRow label="Provinsi" value={domicile.province} />
        <InfoRow label="Kota/Kabupaten" value={domicile.city} />
        <InfoRow label="Kecamatan" value={domicile.district} />
        <InfoRow label="Kelurahan" value={domicile.village} />
        <InfoRow label="Kode Pos" value={domicile.postalCode} />
        <InfoRow label="Latitude" value={<span className="font-mono">{domicile.latitude.toFixed(5)}</span>} />
        <InfoRow label="Longitude" value={<span className="font-mono">{domicile.longitude.toFixed(5)}</span>} />
        <InfoRow label="Sumber Koordinat" value={<Badge variant="outline">{SOURCE_LABEL[domicile.source]}</Badge>} />
        <InfoRow label="Terakhir Diperbarui" value={formatDateMed(domicile.lastUpdated)} />
        {domicile.note ? <InfoRow label="Catatan" value={domicile.note} block /> : null}
      </CardContent>

      {/* Jarak ke outlet utama */}
      {primaryOutlet ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Navigation className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Jarak ke Outlet Utama</p>
            <p className="text-sm font-medium text-foreground">{primaryOutlet.name}</p>
          </div>
          <span className="text-lg font-bold tabular-nums text-primary">{formatDistance(distance ?? 0)}</span>
        </div>
      ) : null}

      {/* Peta */}
      <div className="overflow-hidden rounded-xl border border-border">
        <EmployeeMiniMap
          lat={domicile.latitude}
          lon={domicile.longitude}
          outlet={primaryOutlet}
          employeeName={employee.fullName}
        />
      </div>

      {/* Rekomendasi outlet terdekat */}
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Store className="size-3.5" /> Rekomendasi Outlet Terdekat
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {nearest.map(({ outlet, km }, i) => (
            <div
              key={outlet.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {i === 0 ? "★ " : ""}{outlet.name.replace("JURI Bun — ", "")}
                </p>
                <p className="text-[10px] text-muted-foreground">{outlet.code}</p>
              </div>
              <span className="ml-2 shrink-0 text-xs font-semibold tabular-nums text-foreground">
                {formatDistance(km)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          * Jarak hanya informasi rekomendasi, bukan keputusan mutasi otomatis.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Form Domisili
// ------------------------------------------------------------
function DomicileForm({
  employee,
  initial,
  onClose,
}: {
  employee: Employee;
  initial?: Domicile;
  onClose: () => void;
}) {
  const outlets = useStore((s) => s.outlets);
  const primaryOutlet = outlets.find((o) => o.id === employee.primaryOutletId);

  const [address, setAddress] = React.useState(initial?.address ?? "");
  const [province, setProvince] = React.useState(initial?.province ?? "DKI Jakarta");
  const [city, setCity] = React.useState(initial?.city ?? "");
  const [district, setDistrict] = React.useState(initial?.district ?? "");
  const [village, setVillage] = React.useState(initial?.village ?? "");
  const [postalCode, setPostalCode] = React.useState(initial?.postalCode ?? "");
  const [lat, setLat] = React.useState(String(initial?.latitude ?? primaryOutlet?.latitude ?? -6.2));
  const [lon, setLon] = React.useState(String(initial?.longitude ?? primaryOutlet?.longitude ?? 106.8));
  const [source, setSource] = React.useState<CoordinateSource>(initial?.source ?? "MAP_PICKER");
  const [note, setNote] = React.useState(initial?.note ?? "");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const setCoords = (newLat: number, newLon: number) => {
    setLat(newLat.toFixed(6));
    setLon(newLon.toFixed(6));
  };

  // Address search via Nominatim (OpenStreetMap)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(undefined);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=id`,
        { headers: { "Accept-Language": "id" } },
      );
      const data = await res.json();
      if (data && data[0]) {
        setCoords(Number(data[0].lat), Number(data[0].lon));
        setSource("ADDRESS_LOOKUP");
        toast.success("Lokasi ditemukan");
      } else {
        setError("Alamat tidak ditemukan. Coba kata kunci lain.");
      }
    } catch {
      setError("Gagal mencari alamat. Periksa koneksi.");
    } finally {
      setSearching(false);
    }
  };

  const submit = () => {
    if (!address.trim()) {
      setError("Alamat wajib diisi.");
      return;
    }
    domicileService.upsert({
      id: initial?.id,
      employeeId: employee.id,
      address: address.trim(),
      province: province.trim(),
      city: city.trim(),
      district: district.trim(),
      village: village.trim(),
      postalCode: postalCode.trim(),
      latitude: Number(lat),
      longitude: Number(lon),
      source,
      note: note.trim() || undefined,
    });
    toast.success("Domisili disimpan");
    onClose();
  };

  const latNum = Number(lat);
  const lonNum = Number(lon);

  return (
    <div className="space-y-4">
      {/* Address search */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Search className="size-3.5" /> Cari Alamat (OpenStreetMap Nominatim)
        </p>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Cth: Jl. Sudirman, Jakarta"
          />
          <Button onClick={handleSearch} disabled={searching} size="sm">
            {searching ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
            Cari
          </Button>
        </div>
      </div>

      <FormRow>
        <Field label="Alamat" required>
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Jl. ..." />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Provinsi">
            <Input value={province} onChange={(e) => setProvince(e.target.value)} />
          </Field>
          <Field label="Kota/Kabupaten">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Kecamatan">
            <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
          </Field>
          <Field label="Kelurahan">
            <Input value={village} onChange={(e) => setVillage(e.target.value)} />
          </Field>
          <Field label="Kode Pos">
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </Field>
          <Field label="Sumber Koordinat">
            <Select value={source} onValueChange={(v) => setSource(v as CoordinateSource)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MAP_PICKER">Map Picker</SelectItem>
                <SelectItem value="ADDRESS_LOOKUP">Address Lookup</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="OUTLET_BASED">Outlet Based</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormRow>

      <FormRow>
        <Field label="Latitude" hint="Klik peta untuk memindah marker">
          <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} className="font-mono tabular-nums" />
        </Field>
        <Field label="Longitude">
          <Input type="number" step="any" value={lon} onChange={(e) => setLon(e.target.value)} className="font-mono tabular-nums" />
        </Field>
      </FormRow>

      {/* Map picker */}
      <div className="overflow-hidden rounded-xl border border-border">
        <EmployeeMiniMap
          lat={latNum || -6.2}
          lon={lonNum || 106.8}
          outlet={primaryOutlet}
          employeeName={employee.fullName}
          editable
          onPick={(la, lo) => {
            setCoords(la, lo);
            setSource("MAP_PICKER");
          }}
        />
      </div>

      {primaryOutlet ? (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
          <span className="text-xs text-muted-foreground">Jarak ke {primaryOutlet.name}:</span>
          <span className="text-sm font-bold tabular-nums text-primary">
            {formatDistance(haversineKm(latNum, lonNum, primaryOutlet.latitude, primaryOutlet.longitude))}
          </span>
        </div>
      ) : null}

      <Field label="Catatan">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Opsional" />
      </Field>

      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          <X className="size-4" /> Batal
        </Button>
        <Button onClick={submit}>
          <Save className="size-4" /> Simpan
        </Button>
      </div>
    </div>
  );
}
