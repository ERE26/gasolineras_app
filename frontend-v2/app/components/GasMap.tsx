"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

type Station = {
  id: number;
  name: string;
  brand: string;
  address: string;
  province: string;
  municipality: string;
  latitude: number;
  longitude: number;
  price: string;
  fuel_type: string;
  distance_meters?: number;
  schedule?: string;
};

type Props = {
  stations: Station[];
  userLocation?: {
    lat: number;
    lon: number;
  } | null;
};

function getPriceColor(price: number) {
  if (price <= 1.45) return "#22c55e";
  if (price <= 1.6) return "#facc15";
  return "#ef4444";
}

function createPriceIcon(price: number) {
  const color = getPriceColor(price);

  return L.divIcon({
    className: "custom-price-marker",
    html: `
      <div style="
        background:${color};
        color:${price <= 1.6 && price > 1.45 ? "#111827" : "white"};
        min-width:54px;
        height:38px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:12px;
        font-weight:900;
        border:3px solid white;
        box-shadow:0 10px 25px rgba(0,0,0,.35);
        padding:0 8px;
      ">
        ${price.toFixed(2)}€
      </div>
    `,
    iconSize: [54, 38],
    iconAnchor: [27, 19],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        width:22px;
        height:22px;
        border-radius:50%;
        background:#3b82f6;
        border:4px solid white;
        box-shadow:0 0 0 8px rgba(59,130,246,.25);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function escapeHtml(value: string | undefined | null) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function StationClusterLayer({ stations, userLocation }: Props) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 48,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();

        return L.divIcon({
          html: `
            <div style="
              width:48px;
              height:48px;
              border-radius:50%;
              background:#0f172a;
              color:white;
              border:3px solid #22c55e;
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:900;
              box-shadow:0 12px 30px rgba(0,0,0,.35);
            ">
              ${count}
            </div>
          `,
          className: "custom-cluster",
          iconSize: [48, 48],
        });
      },
    });

    stations.forEach((station) => {
      const lat = Number(station.latitude);
      const lon = Number(station.longitude);
      const price = Number(station.price);

      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(price)) {
        return;
      }

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      const distanceText = station.distance_meters
        ? `${(station.distance_meters / 1000).toFixed(2)} km`
        : "Distancia no calculada";

      const popupHtml = `
        <div style="
          min-width:260px;
          font-family:Arial, sans-serif;
          color:#0f172a;
        ">
          <div style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            align-items:flex-start;
            margin-bottom:10px;
          ">
            <div>
              <div style="font-size:15px;font-weight:900;">
                ${escapeHtml(station.name)}
              </div>
              <div style="font-size:12px;color:#64748b;">
                ${escapeHtml(station.municipality)}, ${escapeHtml(station.province)}
              </div>
            </div>

            <div style="
              background:${getPriceColor(price)};
              color:${price <= 1.6 && price > 1.45 ? "#111827" : "white"};
              border-radius:12px;
              padding:8px 10px;
              font-weight:900;
              white-space:nowrap;
            ">
              ${price.toFixed(3)} €/L
            </div>
          </div>

          <div style="font-size:13px;line-height:1.45;margin-bottom:10px;">
            <strong>Dirección:</strong><br/>
            ${escapeHtml(station.address)}
          </div>

          <div style="font-size:13px;line-height:1.45;margin-bottom:10px;">
            <strong>Distancia:</strong> ${distanceText}<br/>
            <strong>Combustible:</strong> ${escapeHtml(station.fuel_type)}
          </div>

          ${
            station.schedule
              ? `<div style="font-size:13px;margin-bottom:10px;"><strong>Horario:</strong> ${escapeHtml(station.schedule)}</div>`
              : ""
          }

          <div style="display:grid;gap:8px;">
            <a
              href="${googleMapsUrl}"
              target="_blank"
              rel="noreferrer"
              style="
                background:#16a34a;
                color:white;
                text-decoration:none;
                border-radius:12px;
                padding:10px;
                text-align:center;
                font-weight:800;
                display:block;
              "
            >
              Abrir en Google Maps
            </a>

            <button
              data-copy-address="${escapeHtml(station.address)}"
              style="
                background:#e2e8f0;
                color:#0f172a;
                border:none;
                border-radius:12px;
                padding:10px;
                font-weight:800;
                cursor:pointer;
                width:100%;
              "
            >
              Copiar dirección
            </button>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lon], {
        icon: createPriceIcon(price),
      }).bindPopup(popupHtml);

      clusterGroup.addLayer(marker);
    });

    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lon], {
        icon: createUserIcon(),
      }).bindPopup("<strong>Tu ubicación</strong>");

      clusterGroup.addLayer(userMarker);
    }

    map.addLayer(clusterGroup);

    if (stations.length > 0) {
      const bounds = clusterGroup.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: userLocation ? 13 : 8,
        });
      }
    }

    function handlePopupOpen() {
      setTimeout(() => {
        const buttons = document.querySelectorAll("[data-copy-address]");

        buttons.forEach((button) => {
          button.addEventListener("click", async () => {
            const address = button.getAttribute("data-copy-address") || "";

            try {
              await navigator.clipboard.writeText(address);
              alert("Dirección copiada.");
            } catch {
              alert(address);
            }
          });
        });
      }, 0);
    }

    map.on("popupopen", handlePopupOpen);

    return () => {
      map.off("popupopen", handlePopupOpen);
      map.removeLayer(clusterGroup);
    };
  }, [map, stations, userLocation]);

  return null;
}

export default function GasMap({ stations, userLocation }: Props) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lon]
    : [40.4168, -3.7038];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={userLocation ? 12 : 6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <StationClusterLayer stations={stations} userLocation={userLocation} />
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] rounded-2xl border border-white/10 bg-slate-950/90 p-3 text-xs text-white shadow-2xl backdrop-blur">
        <p className="mb-2 font-bold">Leyenda de precios</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
            <span>Barata</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
            <span>Media</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <span>Cara</span>
          </div>
        </div>
      </div>
    </div>
  );
}