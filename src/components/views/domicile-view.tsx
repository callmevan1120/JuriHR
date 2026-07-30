"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/use-store";
import {
  formatDistance,
  haversineKm,
  initials,
  obfuscateCoord,
  cn,
} from "@/lib/utils";
import type { Outlet } from "@/lib/types";
import {
  Users,
  Navigation,
  Search,
  Filter,
  Layers,
} from "lucide-react";

// Fix marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const outletIcon = L.divIcon({
  html: `<div style="background:#3A2518;width:24px;height:24px;border-radius:5px;border:2px solid #FCBA0C;display:flex;align-items:center;justify-content:center;color:#FCBA0C;font-size:12px;font-weight:bold;">O</div>`,
  className: "outlet-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function employeeMarkerIcon(initial: string, isNear: boolean) {
  return L.divIcon({
    html: `<div style="background:${isNear ? "#2F855A" : "#FCBA0C"};width:16px;height:16px;border-radius:50%;border:2px solid #3A2518;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
    className: "emp-marker",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/** Auto-fit map bounds to all markers when data changes. */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0]!, 13);
      return;
    }
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [positions, map]);
  return null;
}

export function DomicileView() {
  const employees = useStore((s) => s.employees.filter((e) => e.status === "AKTIF"));
  const domiciles = useStore((s) => s.domiciles);
  const outlets = useStore((s) => s.outlets.filter((o) => o.status === "active"));
  const positions = useStore((s) => s.positions);

  const [filterOutlet, setFilterOutlet] = React.useState<string>("all");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [obfuscate, setObfuscate] = React.useState(true);
  const [selectedEmp, setSelectedEmp] = React.useState<string | null>(null);

  // Filter karyawan
  const filtered = employees.filter((e) => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    if (filterOutlet !== "all" && e.primaryOutletId !== filterOutlet) return false;
    if (search && !`${e.fullName} ${e.nik}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Domicile join
  const points = filtered
    .map((e) => {
      const dom = domiciles.find((d) => d.employeeId === e.id);
      if (!dom) return null;
      return { employee: e, domicile: dom };
    })
    .filter((p): p is { employee: typeof employees[number]; domicile: typeof domiciles[number] } => p !== null);

  // Center map: rata-rata outlet atau Jakarta
  const centerLat = outlets.reduce((s, o) => s + o.latitude, 0) / (outlets.length || 1);
  const centerLon = outlets.reduce((s, o) => s + o.longitude, 0) / (outlets.length || 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Domisili & Peta"
        description="Peta persebaran domisili karyawan relatif terhadap outlet. Koordinat dapat disamarkan untuk privasi."
        actions={
          <Button
            variant={obfuscate ? "default" : "outline"}
            onClick={() => setObfuscate(!obfuscate)}
          >
            <Layers className="size-4" />
            {obfuscate ? "Samarkan Koordinat: Aktif" : "Samarkan Koordinat: Nonaktif"}
          </Button>
        }
      />

      {/* Filter bar */}
      <Card className="rounded-2xl border border-border/60">
        <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="size-4" /> Filter
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama/NIK..."
              className="pl-8"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="OUTLET">Outlet</SelectItem>
              <SelectItem value="NON_OUTLET">Non-Outlet</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOutlet} onValueChange={setFilterOutlet}>
            <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Outlet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name.replace("JURI Bun — ", "")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="ml-auto rounded-lg text-xs">
            <Users className="size-3" /> {points.length} karyawan
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Map */}
        <Card className="rounded-2xl border border-border/60 lg:col-span-2">
          <CardContent className="p-1.5">
            <div style={{ height: 520 }} className="overflow-hidden rounded-lg">
              <MapContainer
                center={[centerLat || -6.2, centerLon || 106.8]}
                zoom={11}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds positions={[
                  ...outlets.map((o) => [o.latitude, o.longitude] as [number, number]),
                  ...points.map(({ domicile }) => [domicile.latitude, domicile.longitude] as [number, number]),
                ]} />
                {/* Outlet markers + geofence */}
                {outlets.map((o) => (
                  <React.Fragment key={o.id}>
                    <Marker position={[o.latitude, o.longitude]} icon={outletIcon}>
                      <Popup>
                        <div className="text-xs">
                          <p className="font-semibold">{o.name}</p>
                          <p className="text-muted-foreground">{o.address}</p>
                          <p className="text-muted-foreground">Radius: {o.geofenceRadiusMeters}m</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[o.latitude, o.longitude]}
                      radius={o.geofenceRadiusMeters}
                      pathOptions={{ color: "#3A2518", fillColor: "#3A2518", fillOpacity: 0.05, weight: 1.5, dashArray: "4 4" }}
                    />
                  </React.Fragment>
                ))}
                {/* Employee markers */}
                {points.map(({ employee, domicile }) => {
                  const lat = obfuscate ? obfuscateCoord(domicile.latitude, 3) : domicile.latitude;
                  const lon = obfuscate ? obfuscateCoord(domicile.longitude, 3) : domicile.longitude;
                  const outlet = outlets.find((o) => o.id === employee.primaryOutletId);
                  const dist = outlet ? haversineKm(lat, lon, outlet.latitude, outlet.longitude) : null;
                  return (
                    <Marker
                      key={employee.id}
                      position={[lat, lon]}
                      icon={employeeMarkerIcon(initials(employee.fullName), (dist ?? 999) < 3)}
                      eventHandlers={{ click: () => setSelectedEmp(employee.id) }}
                    >
                      <Popup>
                        <div className="min-w-[180px] text-xs">
                          <p className="font-semibold">{employee.fullName}</p>
                          <p className="text-muted-foreground">{employee.nik}</p>
                          <p className="mt-1 text-muted-foreground">{domicile.city}, {domicile.province}</p>
                          {outlet ? (
                            <p className="mt-1">
                              <span className="font-medium">{formatDistance(dist ?? 0)}</span>
                              <span className="text-muted-foreground"> ke {outlet.name.replace("JURI Bun — ", "")}</span>
                            </p>
                          ) : null}
                          {obfuscate ? (
                            <p className="mt-1 text-[10px] text-muted-foreground">* Koordinat disamarkan</p>
                          ) : null}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Side panel: list karyawan + jarak */}
        <Card className="rounded-2xl border border-border/60">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Navigation className="size-4 text-primary" /> Jarak ke Outlet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[460px] divide-y divide-border overflow-y-auto">
              {points
                .map(({ employee, domicile }) => {
                  const outlet = outlets.find((o) => o.id === employee.primaryOutletId);
                  const dist = outlet ? haversineKm(domicile.latitude, domicile.longitude, outlet.latitude, outlet.longitude) : Infinity;
                  return { employee, domicile, outlet, dist };
                })
                .sort((a, b) => a.dist - b.dist)
                .map(({ employee, domicile, outlet, dist }) => {
                  const pos = positions.find((p) => p.id === employee.positionId);
                  const isSelected = selectedEmp === employee.id;
                  return (
                    <button
                      key={employee.id}
                      onClick={() => setSelectedEmp(employee.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary-foreground">
                        {initials(employee.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{employee.fullName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {pos?.name} · {outlet?.name.replace("JURI Bun — ", "")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={cn(
                          "block text-xs font-semibold tabular-nums",
                          dist < 3 ? "text-success" : dist < 10 ? "text-foreground" : "text-warning",
                        )}>
                          {formatDistance(dist)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{domicile.city}</span>
                      </div>
                    </button>
                  );
                })}
              {points.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada data domisili.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Peta menggunakan <strong>Leaflet</strong> &amp; <strong>OpenStreetMap</strong>. Jarak dihitung dengan formula Haversine dan hanya sebagai informasi rekomendasi, bukan keputusan mutasi otomatis.
      </p>
    </div>
  );
}
