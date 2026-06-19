"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import TopNav from "../components/TopNav";

type Vehicle = {
  id: string;
  name: string;
  fuel: string;
  tankLiters: number;
  consumption: number;
};

type Station = {
  id?: number;
  station_id?: number;
  name?: string;
  brand?: string;
  address?: string;
  province?: string;
  municipality?: string;
  latitude?: number | string;
  longitude?: number | string;
  price?: string | number;
  fuel_type?: string;
  detourMeters?: number;
};

type TripResult = {
  origin: {
    label: string;
    location: { lat: number; lon: number };
  };
  destination: {
    label: string;
    location: { lat: number; lon: number };
  };
  route: {
    distanceMeters: number;
    duration: string;
  };
  fuel: string;
  sortBy: string;
  maxDetourKm: number;
  googleMapsUrl: string;
  stops: Array<{
    id: string;
    label: string;
    input: string;
    point: { lat: number; lon: number };
    radiusKm: number;
    stations: Station[];
    best?: Station | null;
  }>;
};

const fuelOptions = [
  { value: "gasolina95", label: "Gasolina 95" },
  { value: "gasolina98", label: "Gasolina 98" },
  { value: "diesel", label: "Diésel" },
  { value: "diesel_premium", label: "Diésel premium" },
  { value: "glp", label: "GLP" },
];

const stopPresets = [
  "mitad",
  "primer tercio",
  "segundo tercio",
  "25%",
  "75%",
];

function formatKm(meters?: number) {
  const value = Number(meters);

  if (!Number.isFinite(value)) return "-";

  return `${(value / 1000).toFixed(1)} km`;
}

function formatDetour(meters?: number) {
  const value = Number(meters);

  if (!Number.isFinite(value)) return "-";

  if (value < 1000) return `${Math.round(value)} m`;

  return `${(value / 1000).toFixed(1)} km`;
}

function stationLocation(station: Station) {
  const lat = Number(station.latitude);
  const lon = Number(station.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}

function stationMapsUrl(station: Station) {
  const location = stationLocation(station);

  if (location) {
    return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${station.name || ""} ${station.address || ""} ${station.municipality || ""}`
  )}`;
}

export default function TripPlannerPage() {
  const [originMode, setOriginMode] = useState<"current" | "address">("current");
  const [originAddress, setOriginAddress] = useState("");
  const [originLocation, setOriginLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [destination, setDestination] = useState("");
  const [fuel, setFuel] = useState("gasolina95");
  const [sortBy, setSortBy] = useState<"price" | "distance" | "balanced">("price");
  const [stops, setStops] = useState<string[]>(["mitad"]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [result, setResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);

  useMemo(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("myVehicles");

    if (!saved) return;

    try {
      setVehicles(JSON.parse(saved));
    } catch {
      setVehicles([]);
    }
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Tu navegador no permite usar ubicación.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOriginMode("current");
        setOriginLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        alert("No he podido obtener tu ubicación. Puedes escribir el origen manualmente.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  function changeStopCount(count: number) {
    setStops((current) => {
      const next = [...current];

      while (next.length < count) {
        const defaults = ["mitad", "primer tercio", "segundo tercio", "75%"];
        next.push(defaults[next.length] || "mitad");
      }

      return next.slice(0, count);
    });
  }

  function updateStop(index: number, value: string) {
    setStops((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function selectVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);

    const vehicle = vehicles.find((item) => item.id === vehicleId);

    if (vehicle?.fuel) {
      setFuel(vehicle.fuel);
    }
  }

  async function planTrip() {
    if (originMode === "current" && !originLocation) {
      alert("Pulsa primero “Usar mi ubicación” o escribe un origen.");
      return;
    }

    if (originMode === "address" && !originAddress.trim()) {
      alert("Escribe el origen.");
      return;
    }

    if (!destination.trim()) {
      alert("Escribe el destino.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/trip-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin:
            originMode === "current"
              ? {
                  lat: originLocation?.lat,
                  lon: originLocation?.lon,
                  label: "Mi ubicación actual",
                }
              : {
                  address: originAddress.trim(),
                },
          destination: {
            address: destination.trim(),
          },
          fuel,
          sortBy,
          maxDetourKm: 5,
          stops: stops.map((value, index) => ({
            label: `Parada ${index + 1}`,
            value,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No he podido planificar el viaje.");
      }

      setResult(data);
    } catch (error: any) {
      alert(error?.message || "No he podido planificar el viaje.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-emerald-600">Nuevo apartado</p>
          <h1 className="mt-1 text-4xl font-black">Planifica tu viaje</h1>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            Indica origen, destino y dónde quieres parar. La app calcula la ruta
            con Google Maps y busca gasolineras cercanas a cada parada, con un
            desvío máximo aproximado de 5 km.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Datos del viaje</h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-2 text-sm font-black">Origen</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={useCurrentLocation}
                    className={
                      originMode === "current"
                        ? "rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                        : "rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
                    }
                  >
                    Usar mi ubicación
                  </button>

                  <button
                    onClick={() => setOriginMode("address")}
                    className={
                      originMode === "address"
                        ? "rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                        : "rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
                    }
                  >
                    Escribir origen
                  </button>
                </div>

                {originMode === "current" && (
                  <p className="mt-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                    {originLocation
                      ? "Ubicación lista. Ya puedes analizar la ruta."
                      : "Pulsa “Usar mi ubicación” para guardarla como origen."}
                  </p>
                )}

                {originMode === "address" && (
                  <input
                    value={originAddress}
                    onChange={(event) => setOriginAddress(event.target.value)}
                    placeholder="Ej: Madrid, Calle Serrano..."
                    className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black">Destino</label>
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Ej: Valencia, Málaga, San Sebastián..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-black">Vehículo guardado</p>
                {vehicles.length > 0 ? (
                  <select
                    value={selectedVehicleId}
                    onChange={(event) => selectVehicle(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Sin vehículo concreto</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} · {vehicle.tankLiters} L · {vehicle.consumption} L/100 km
                      </option>
                    ))}
                  </select>
                ) : (
                  <Link
                    href="/mis-vehiculos"
                    className="block rounded-2xl bg-purple-50 px-4 py-3 text-sm font-black text-purple-700 hover:bg-purple-100"
                  >
                    Añadir vehículo para mejorar el análisis
                  </Link>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-black">Combustible</p>
                <div className="flex flex-wrap gap-2">
                  {fuelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFuel(option.value)}
                      className={
                        fuel === option.value
                          ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white"
                          : "rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-black">Paradas</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => changeStopCount(count)}
                      className={
                        stops.length === count
                          ? "rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                          : "rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                      }
                    >
                      {count} {count === 1 ? "parada" : "paradas"}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {stops.map((stop, index) => (
                    <div key={index} className="rounded-3xl bg-slate-50 p-4">
                      <label className="mb-2 block text-sm font-black">
                        Parada {index + 1}
                      </label>
                      <input
                        value={stop}
                        onChange={(event) => updateStop(index, event.target.value)}
                        placeholder="Ej: mitad, Zaragoza, 60%, antes de Valencia..."
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />

                      <div className="mt-2 flex flex-wrap gap-2">
                        {stopPresets.map((preset) => (
                          <button
                            key={preset}
                            onClick={() => updateStop(index, preset)}
                            className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-100"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-black">Ordenar recomendaciones</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["price", "Más barata"],
                    ["distance", "Menor desvío"],
                    ["balanced", "Equilibrio"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setSortBy(value as "price" | "distance" | "balanced")}
                      className={
                        sortBy === value
                          ? "rounded-2xl bg-slate-950 px-3 py-3 text-sm font-black text-white"
                          : "rounded-2xl bg-slate-100 px-3 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Este MVP limita las recomendaciones a gasolineras situadas a máximo
                5 km aproximados de la zona de parada sobre la ruta.
              </div>

              <button
                onClick={planTrip}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white shadow-lg hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analizando ruta..." : "Analizar viaje"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Resultado</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ruta + mejores gasolineras cerca de cada parada.
                </p>
              </div>

              {result?.googleMapsUrl && (
                <a
                  href={result.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
                >
                  Abrir ruta en Google Maps
                </a>
              )}
            </div>

            {!result && (
              <div className="mt-6 rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                Cuando analices un viaje, aquí aparecerán las paradas recomendadas
                y las gasolineras más interesantes.
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase text-slate-500">Distancia</p>
                    <p className="mt-1 text-xl font-black">
                      {formatKm(result.route.distanceMeters)}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase text-slate-500">Duración</p>
                    <p className="mt-1 text-xl font-black">{result.route.duration}</p>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase text-slate-500">Desvío máx.</p>
                    <p className="mt-1 text-xl font-black">{result.maxDetourKm} km</p>
                  </div>
                </div>

                {result.stops.map((stop, index) => (
                  <article key={stop.id} className="rounded-[1.7rem] border border-slate-200 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-emerald-600">
                          Parada {index + 1}
                        </p>
                        <h3 className="text-xl font-black">{stop.label}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Buscando gasolineras a máximo {stop.radiusKm} km.
                        </p>
                      </div>
                    </div>

                    {stop.stations.length === 0 && (
                      <p className="mt-4 rounded-3xl bg-red-50 p-4 text-sm font-bold text-red-700">
                        No he encontrado gasolineras dentro del desvío máximo para esta parada.
                      </p>
                    )}

                    <div className="mt-4 space-y-3">
                      {stop.stations.map((station, stationIndex) => (
                        <div
                          key={`${station.id || station.station_id || stationIndex}`}
                          className={
                            stationIndex === 0
                              ? "rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-4"
                              : "rounded-3xl bg-slate-50 p-4"
                          }
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase text-slate-500">
                                {stationIndex === 0 ? "Recomendada" : "Alternativa"}
                              </p>
                              <h4 className="mt-1 text-lg font-black">
                                {station.name || "Gasolinera"}
                              </h4>
                              <p className="text-sm text-slate-500">
                                {station.brand || "Marca no indicada"} · {station.address || ""}
                              </p>
                              <p className="text-sm text-slate-500">
                                {station.municipality || ""} {station.province ? `(${station.province})` : ""}
                              </p>
                            </div>

                            <div className="sm:text-right">
                              <p className="text-2xl font-black">
                                {Number(station.price).toFixed(3)} €/L
                              </p>
                              <p className="text-sm font-bold text-slate-500">
                                Desvío aprox. {formatDetour(station.detourMeters)}
                              </p>
                              <a
                                href={stationMapsUrl(station)}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-100"
                              >
                                Ver en Maps
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
