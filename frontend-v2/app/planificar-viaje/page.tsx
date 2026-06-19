"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type StopMode = "percent" | "near-place" | "km-before-destination" | "hours-from-start" | "km-from-start";

type StopForm = {
  mode: StopMode;
  value: string;
};

type Suggestion = {
  label: string;
  lat?: number;
  lon?: number;
  placeId?: string;
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
    durationSeconds?: number;
  };
  fuel: string;
  sortBy: string;
  maxDetourKm: number;
  googleMapsUrl: string;
  stops: Array<{
    id: string;
    label: string;
    input: string;
    mode?: string;
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

const quickDestinations = [
  "Madrid",
  "Barcelona",
  "Valencia",
  "Sevilla",
  "Málaga",
  "Zaragoza",
  "Bilbao",
  "Alicante",
  "San Sebastián",
  "Santander",
  "Granada",
  "Cádiz",
  "A Coruña",
  "Vigo",
  "Murcia",
  "Oviedo",
  "Salamanca",
  "Burgos",
  "Pamplona",
  "Logroño",
];

const stopModes: Array<{
  value: StopMode;
  label: string;
  shortLabel: string;
  helper: string;
  placeholder: string;
  examples: string[];
}> = [
  {
    value: "percent",
    label: "Por tramo de ruta",
    shortLabel: "Tramo",
    helper: "Para parar a mitad, al primer tercio o al 70% del viaje.",
    placeholder: "Ej: mitad, 60%, primer tercio...",
    examples: ["mitad", "primer tercio", "segundo tercio", "60%", "75%"],
  },
  {
    value: "near-place",
    label: "Cerca de una ciudad",
    shortLabel: "Ciudad",
    helper: "Busca el punto de la ruta más cercano a esa ciudad.",
    placeholder: "Ej: Zaragoza, Albacete, Burgos...",
    examples: ["Zaragoza", "Albacete", "Burgos", "Lleida", "Córdoba"],
  },
  {
    value: "km-before-destination",
    label: "Km antes del destino",
    shortLabel: "Antes de llegar",
    helper: "Para repostar antes de llegar al destino final.",
    placeholder: "Ej: 50",
    examples: ["30", "50", "80", "100"],
  },
  {
    value: "hours-from-start",
    label: "Tras X horas de viaje",
    shortLabel: "Horas",
    helper: "Calcula una parada aproximada tras X horas conduciendo.",
    placeholder: "Ej: 2,5",
    examples: ["1,5", "2", "2,5", "3"],
  },
  {
    value: "km-from-start",
    label: "Tras X km desde origen",
    shortLabel: "Km desde origen",
    helper: "Para parar tras una distancia concreta desde el inicio.",
    placeholder: "Ej: 250",
    examples: ["100", "200", "300", "400"],
  },
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

function AddressSuggestInput({
  label,
  value,
  onChange,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helper?: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/address-suggest?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok) {
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  const quickMatches = quickDestinations
    .filter((item) => item.toLowerCase().includes(value.trim().toLowerCase()))
    .slice(0, 5);

  const hasSuggestions = suggestions.length > 0 || quickMatches.length > 0 || loading;

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-black">{label}</label>
      <input
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      {helper && <p className="mt-2 text-xs font-bold text-slate-500">{helper}</p>}

      {open && value.trim().length >= 2 && hasSuggestions && (
        <div className="absolute left-0 right-0 top-[4.6rem] z-30 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {loading && (
            <div className="px-4 py-3 text-sm font-bold text-slate-500">
              Buscando direcciones...
            </div>
          )}

          {suggestions.map((item) => (
            <button
              key={item.placeId || item.label}
              type="button"
              onClick={() => {
                onChange(item.label);
                setOpen(false);
              }}
              className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
            >
              <span className="block text-sm font-black text-slate-800">{item.label}</span>
              <span className="mt-1 block text-xs font-bold text-slate-500">
                Dirección encontrada por Google
              </span>
            </button>
          ))}

          {suggestions.length === 0 &&
            !loading &&
            quickMatches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
                className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                {item}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default function TripPlannerPage() {
  const [originMode, setOriginMode] = useState<"current" | "address">("current");
  const [originAddress, setOriginAddress] = useState("");
  const [originLocation, setOriginLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [destination, setDestination] = useState("");
  const [fuel, setFuel] = useState("gasolina95");
  const [sortBy, setSortBy] = useState<"price" | "distance" | "balanced">("balanced");
  const [stops, setStops] = useState<StopForm[]>([{ mode: "percent", value: "mitad" }]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [result, setResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("myVehicles");

    if (!saved) return;

    try {
      setVehicles(JSON.parse(saved));
    } catch {
      setVehicles([]);
    }
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

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

  function addStop() {
    if (stops.length >= 4) {
      alert("Por ahora puedes añadir hasta 4 paradas.");
      return;
    }

    const defaults: StopForm[] = [
      { mode: "percent", value: "mitad" },
      { mode: "hours-from-start", value: "2" },
      { mode: "km-before-destination", value: "80" },
      { mode: "near-place", value: "" },
    ];

    setStops([...stops, defaults[stops.length] || { mode: "percent", value: "mitad" }]);
  }

  function removeStop(index: number) {
    setStops(stops.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateStop(index: number, patch: Partial<StopForm>) {
    setStops((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
              value:
                patch.mode && patch.mode !== item.mode
                  ? stopModes.find((mode) => mode.value === patch.mode)?.examples[0] || ""
                  : patch.value ?? item.value,
            }
          : item
      )
    );
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

    const emptyStop = stops.find((stop) => !stop.value.trim());

    if (emptyStop) {
      alert("Completa todas las paradas o elimina las que no quieras usar.");
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
          vehicle: selectedVehicle,
          stops: stops.map((stop, index) => ({
            label: `Parada ${index + 1}`,
            mode: stop.mode,
            value: stop.value,
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

      <section className="mx-auto max-w-7xl px-6 py-7">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
            <div className="p-7 md:p-8">
              <p className="text-sm font-black text-emerald-600">Planifica tu viaje</p>
              <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
                Encuentra dónde repostar en ruta sin desviarte más de 5 km
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                Elige origen, destino y cuándo quieres parar. Analizamos gasolineras
                cerca de cada punto de la ruta y te damos la recomendada.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-3xl bg-emerald-50 p-4">
                  <p className="font-black text-emerald-950">1. Ruta</p>
                  <p className="mt-1 text-sm font-bold text-emerald-800">
                    Origen y destino con sugerencias.
                  </p>
                </div>

                <div className="rounded-3xl bg-blue-50 p-4">
                  <p className="font-black text-blue-950">2. Paradas</p>
                  <p className="mt-1 text-sm font-bold text-blue-800">
                    Por ciudad, km, horas o tramo.
                  </p>
                </div>

                <div className="rounded-3xl bg-purple-50 p-4">
                  <p className="font-black text-purple-950">3. Resultado</p>
                  <p className="mt-1 text-sm font-bold text-purple-800">
                    Precio, desvío y ruta en Maps.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center bg-slate-950 p-7 text-white md:p-8">
              <p className="text-sm font-black text-emerald-300">Criterio de recomendación</p>
              <h2 className="mt-2 text-3xl font-black">No solo busca la más barata</h2>
              <p className="mt-4 leading-7 text-slate-300">
                Por defecto usa equilibrio entre precio y desvío. Así evita mandarte
                lejos por ahorrar muy poco.
              </p>

              <div className="mt-5 rounded-3xl bg-white/10 p-4 text-sm font-bold leading-6 text-slate-200">
                Desvío máximo aproximado: 5 km desde el punto de parada sobre la ruta.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-500">Paso 1</p>
                <h2 className="text-2xl font-black">Datos de ruta</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                España
              </span>
            </div>

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
                  <div className="mt-3">
                    <AddressSuggestInput
                      label="Origen escrito"
                      value={originAddress}
                      onChange={setOriginAddress}
                      placeholder="Ej: Calle Alcalá 45, Madrid..."
                      helper="Elige una sugerencia para evitar confundir calles con el mismo nombre."
                    />
                  </div>
                )}
              </div>

              <AddressSuggestInput
                label="Destino"
                value={destination}
                onChange={setDestination}
                placeholder="Ej: Hotel en Valencia, Málaga centro..."
                helper="Puedes escribir ciudad, dirección, hotel o zona."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-black">Vehículo</p>
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
                      Añadir vehículo
                    </Link>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-black">Ordenar por</p>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as "price" | "distance" | "balanced")}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="balanced">Equilibrio precio/desvío</option>
                    <option value="price">Más barata</option>
                    <option value="distance">Menor desvío</option>
                  </select>
                </div>
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
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-500">Paso 2</p>
                <h2 className="text-2xl font-black">Cuándo quieres parar</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Puedes combinar varios criterios.
                </p>
              </div>

              <button
                onClick={addStop}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-500"
              >
                Añadir
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {stops.map((stop, index) => {
                const mode = stopModes.find((item) => item.value === stop.mode) || stopModes[0];

                return (
                  <article key={index} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black">Parada {index + 1}</h3>

                      {stops.length > 1 && (
                        <button
                          onClick={() => removeStop(index)}
                          className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {stopModes.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => updateStop(index, { mode: item.value })}
                          className={
                            stop.mode === item.value
                              ? "rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white"
                              : "rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-100"
                          }
                        >
                          {item.shortLabel}
                        </button>
                      ))}
                    </div>

                    <input
                      value={stop.value}
                      onChange={(event) => updateStop(index, { value: event.target.value })}
                      placeholder={mode.placeholder}
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                      {mode.helper}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {mode.examples.map((example) => (
                        <button
                          key={example}
                          onClick={() => updateStop(index, { value: example })}
                          className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 hover:bg-slate-100"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}

              <button
                onClick={planTrip}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white shadow-lg hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analizando ruta..." : "Analizar viaje"}
              </button>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-500">Paso 3</p>
              <h2 className="text-2xl font-black">Resultado del viaje</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recomendaciones con precio, desvío y acceso a Google Maps.
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
                        Gasolineras a máximo {stop.radiusKm} km de ese punto de la ruta.
                      </p>
                    </div>
                  </div>

                  {stop.stations.length === 0 && (
                    <p className="mt-4 rounded-3xl bg-red-50 p-4 text-sm font-bold text-red-700">
                      No he encontrado gasolineras dentro del desvío máximo para esta parada.
                    </p>
                  )}

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
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
      </section>
    </main>
  );
}
