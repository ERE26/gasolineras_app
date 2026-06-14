"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

type Station = { id: number; name: string; brand: string; address: string; province: string; municipality: string; latitude: number; longitude: number; price: string; fuel_type: string; distance_meters?: number; schedule?: string };
type Props = { stations: Station[]; userLocation?: { lat: number; lon: number } | null };
function getPriceColor(price: number) { if (price <= 1.45) return "#10b981"; if (price <= 1.6) return "#f59e0b"; return "#ef4444"; }
function createPriceIcon(price: number) { const color = getPriceColor(price); return L.divIcon({ className: "custom-price-marker", html: `<div style="background:${color};color:white;min-width:58px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;border:3px solid white;box-shadow:0 12px 26px rgba(15,23,42,.25);padding:0 9px;">${price.toFixed(2)}€</div>`, iconSize: [58, 40], iconAnchor: [29, 20] }); }
function createUserIcon() { return L.divIcon({ className: "user-location-marker", html: `<div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 0 0 8px rgba(37,99,235,.22);"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] }); }
function escapeHtml(value: string | undefined | null) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function StationClusterLayer({ stations, userLocation }: Props) {
  const map = useMap();
  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({ showCoverageOnHover: false, spiderfyOnMaxZoom: true, maxClusterRadius: 48, iconCreateFunction: (cluster) => L.divIcon({ html: `<div style="width:48px;height:48px;border-radius:50%;background:#ffffff;color:#0f172a;border:3px solid #10b981;display:flex;align-items:center;justify-content:center;font-weight:900;box-shadow:0 12px 30px rgba(15,23,42,.22);">${cluster.getChildCount()}</div>`, className: "custom-cluster", iconSize: [48, 48] }) });
    stations.forEach((station) => {
      const lat = Number(station.latitude); const lon = Number(station.longitude); const price = Number(station.price);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(price)) return;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      const distanceText = station.distance_meters ? `${(station.distance_meters / 1000).toFixed(2)} km` : "Distancia no calculada";
      const popupHtml = `<div style="min-width:260px;font-family:Arial,sans-serif;color:#0f172a;"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px;"><div><div style="font-size:15px;font-weight:900;">${escapeHtml(station.name)}</div><div style="font-size:12px;color:#64748b;">${escapeHtml(station.municipality)}, ${escapeHtml(station.province)}</div></div><div style="background:${getPriceColor(price)};color:white;border-radius:12px;padding:8px 10px;font-weight:900;white-space:nowrap;">${price.toFixed(3)} €/L</div></div><div style="font-size:13px;line-height:1.45;margin-bottom:10px;"><strong>Marca:</strong> ${escapeHtml(station.brand || station.name)}<br/><strong>Dirección:</strong><br/>${escapeHtml(station.address)}</div><div style="font-size:13px;line-height:1.45;margin-bottom:10px;"><strong>Distancia:</strong> ${distanceText}<br/><strong>Combustible:</strong> ${escapeHtml(station.fuel_type)}</div>${station.schedule ? `<div style="font-size:13px;margin-bottom:10px;"><strong>Horario:</strong> ${escapeHtml(station.schedule)}</div>` : ""}<a href="${googleMapsUrl}" target="_blank" rel="noreferrer" style="background:#0f172a;color:white;text-decoration:none;border-radius:12px;padding:10px;text-align:center;font-weight:800;display:block;">Abrir ruta en Google Maps</a></div>`;
      clusterGroup.addLayer(L.marker([lat, lon], { icon: createPriceIcon(price) }).bindPopup(popupHtml));
    });
    if (userLocation) clusterGroup.addLayer(L.marker([userLocation.lat, userLocation.lon], { icon: createUserIcon() }).bindPopup("<strong>Tu ubicación</strong>"));
    map.addLayer(clusterGroup);
    if (stations.length > 0) { const bounds = clusterGroup.getBounds(); if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: userLocation ? 13 : 8 }); }
    return () => { map.removeLayer(clusterGroup); };
  }, [map, stations, userLocation]);
  return null;
}
export default function GasMap({ stations, userLocation }: Props) {
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lon] : [40.4168, -3.7038];
  return <div className="relative h-full w-full"><MapContainer center={center} zoom={userLocation ? 12 : 6} scrollWheelZoom style={{ height: "100%", width: "100%" }}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><StationClusterLayer stations={stations} userLocation={userLocation} /></MapContainer><div className="absolute bottom-4 left-4 z-[1000] rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-800 shadow-2xl backdrop-blur"><p className="mb-2 font-black">Leyenda</p><div className="space-y-1"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500"></span><span>Barata</span></div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500"></span><span>Media</span></div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500"></span><span>Cara</span></div></div></div></div>;
}
