"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Outlet } from "@/lib/types";
import { formatDistance, haversineKm } from "@/lib/utils";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const employeeIcon = L.divIcon({
  html: `<div style="background:#FCBA0C;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid #3A2518;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
  className: "employee-marker",
  iconSize: [18, 18],
  iconAnchor: [9, 18],
});

const outletIcon = L.divIcon({
  html: `<div style="background:#3A2518;width:20px;height:20px;border-radius:4px;border:2px solid #FCBA0C;display:flex;align-items:center;justify-content:center;color:#FCBA0C;font-size:11px;font-weight:bold;">O</div>`,
  className: "outlet-marker",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface Props {
  lat: number;
  lon: number;
  outlet?: Outlet;
  employeeName?: string;
  editable?: boolean;
  onPick?: (lat: number, lon: number) => void;
  height?: number;
}

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  React.useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const timer = setTimeout(() => {
        try {
          map.invalidateSize();
          map.setView([lat, lon], map.getZoom() || 14);
        } catch {
          // ignore
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [lat, lon, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick?: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function EmployeeMiniMap({
  lat,
  lon,
  outlet,
  employeeName,
  editable,
  onPick,
  height = 280,
}: Props) {
  const validLat = Number.isFinite(lat) ? lat : -6.2;
  const validLon = Number.isFinite(lon) ? lon : 106.8;

  return (
    <div style={{ height }} className="w-full">
      <MapContainer
        center={[validLat, validLon]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", cursor: editable ? "crosshair" : "grab" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={validLat} lon={validLon} />
        {editable ? <ClickHandler onPick={onPick} /> : null}

        <Marker position={[validLat, validLon]} icon={employeeIcon} draggable={editable} eventHandlers={{
          dragend: (e) => {
            if (editable && onPick) {
              const m = e.target as L.Marker;
              const pos = m.getLatLng();
              onPick(pos.lat, pos.lng);
            }
          },
        }}>
          {employeeName ? (
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{employeeName}</p>
                <p className="text-muted-foreground">{validLat.toFixed(5)}, {validLon.toFixed(5)}</p>
              </div>
            </Popup>
          ) : null}
        </Marker>

        {outlet ? (
          <>
            <Marker position={[outlet.latitude, outlet.longitude]} icon={outletIcon}>
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{outlet.name}</p>
                  <p className="text-muted-foreground">Outlet utama</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[outlet.latitude, outlet.longitude]}
              radius={outlet.geofenceRadiusMeters}
              pathOptions={{ color: "#FCBA0C", fillColor: "#FCBA0C", fillOpacity: 0.1, weight: 1.5, dashArray: "4 4" }}
            />
          </>
        ) : null}
      </MapContainer>
      {editable ? (
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          Klik peta atau geser marker kuning untuk mengatur koordinat domisili
        </p>
      ) : outlet ? (
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          Marker kuning = domisili, Marker coklat = outlet utama, Jarak {formatDistance(haversineKm(validLat, validLon, outlet.latitude, outlet.longitude))}
        </p>
      ) : null}
    </div>
  );
}
