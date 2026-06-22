"use client";

import { useEffect, useState } from "react";

type Coords = {
  lat: number;
  lon: number;
};

type LocationPermissionCardProps = {
  onLocationGranted?: (coords: Coords) => void;
};

export default function LocationPermissionCard({ onLocationGranted }: LocationPermissionCardProps) {
  const [status, setStatus] = useState<"idle" | "ready" | "blocked" | "loading">("idle");
  const [label, setLabel] = useState("Activa tu ubicación para ver precios cercanos y rutas más útiles.");

  useEffect(() => {
    const saved = localStorage.getItem("lastUserLocation");

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed.lat && parsed.lon) {
        setStatus("ready");
        setLabel("Ubicación guardada. Rivvo puede priorizar gasolineras cercanas.");
        onLocationGranted?.({ lat: Number(parsed.lat), lon: Number(parsed.lon) });
      }
    } catch {}
  }, [onLocationGranted]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setStatus("blocked");
      setLabel("Tu navegador no permite usar ubicación. Puedes buscar escribiendo una dirección.");
      return;
    }

    setStatus("loading");
    setLabel("Pidiendo permiso de ubicación...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        localStorage.setItem(
          "lastUserLocation",
          JSON.stringify({ ...coords, updatedAt: new Date().toISOString() })
        );

        setStatus("ready");
        setLabel("Ubicación activada. Ya puedes buscar gasolineras cercanas.");
        onLocationGranted?.(coords);
      },
      () => {
        setStatus("blocked");
        setLabel("Ubicación no activada. Puedes seguir usando Rivvo escribiendo una dirección.");
      },
      {
        enableHighAccuracy: false,
        timeout: 9000,
        maximumAge: 10 * 60 * 1000,
      }
    );
  }

  return (
    <section className="rounded-[1.7rem] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-emerald-800">Ubicación</p>
          <p className="mt-1 text-sm font-bold leading-6 text-emerald-950">{label}</p>
        </div>

        <button
          type="button"
          onClick={requestLocation}
          disabled={status === "loading"}
          className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
        >
          {status === "ready" ? "Actualizar ubicación" : status === "loading" ? "Activando..." : "Permitir ubicación"}
        </button>
      </div>
    </section>
  );
}
