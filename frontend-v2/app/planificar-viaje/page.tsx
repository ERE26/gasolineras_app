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

type StopMode = "near-place" | "km-before-destination" | "hours-from-start" | "km-from-start";

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

const mainBrands = ["REPSOL", "MOEVE", "GALP", "BP", "DISA", "SHELL", "BALLENOIL", "PLENERGY"];
const brandOptions = [...mainBrands, "OTRA"];

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
  helper: string;
  placeholder: string;
  examples: string[];
}> = [
  {
    value: "hours-from-start",
    label: "A X horas de salir",
    helper: "Ej: 2 = buscar gasolineras cuando lleves unas 2 horas conduciendo.",
    placeholder: "2",
    examples: ["1,5", "2", "2,5", "3"],
  },
  {
    value: "km-before-destination",
    label: "A X km de llegar",
    helper: "Ej: 80 = buscar gasolineras unos 80 km antes del destino.",
    placeholder: "80",
    examples: ["30", "50", "80", "100"],
  },
  {
    value: "km-from-start",
    label: "A X km de haber salido",
    helper: "Ej: 250 = buscar gasolineras a los 250 km desde el origen.",
    placeholder: "250",
    examples: ["100", "200", "300", "400"],
  },
  {
    value: "near-place",
    label: "En una dirección concreta",
    helper: "Escribe una dirección, ciudad o zona y elige una sugerencia.",
    placeholder: "Ej: Calle Mayor 10, Zaragoza",
    examples: ["Zaragoza", "Albacete", "Burgos", "Lleida", "Córdoba"],
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
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      {helper && <p className="mt-2 text-xs font-bold text-slate-500">{helper}</p>}

      {open && value.trim().length >= 2 && hasSuggestions && (
        <div className="absolute left-0 right-0 top-[4.6rem] z-50 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {loading && (
            <div className="px-4 py-3 text-sm font-bold text-slate-500">Buscando direcciones...</div>
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
              <span className="mt-1 block text-xs font-bold text-slate-500">Dirección encontrada por Google</span>
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
  const [stops, setStops] = useState<StopForm[]>([{ mode: "hours-from-start", value: "2" }]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [result, setResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showAllStops, setShowAllStops] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);

  function toggleBrandSelection(brand: string) {
    setSelectedBrands((current) =>
      current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand]
    );
  }

  function clearBrandSelection() {
    setSelectedBrands([]);
    setBrandMenuOpen(false);
  }

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

  async function labelCurrentLocation(lat: number, lon: number) {
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
      });

      const response = await fetch(`/api/reverse-geocode?${params.toString()}`);
      const data = await response.json();

      return data.shortLabel || data.label || "Mi ubicación actual";
    } catch {
      return "Mi ubicación actual";
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Tu navegador no permite usar ubicación.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        setOriginMode("current");
        setOriginLocation(nextLocation);

        const locationLabel = await labelCurrentLocation(nextLocation.lat, nextLocation.lon);
        setOriginAddress(locationLabel);
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
      { mode: "hours-from-start", value: "2" },
      { mode: "km-before-destination", value: "80" },
      { mode: "km-from-start", value: "250" },
      { mode: "near-place", value: "" },
    ];

    setStops([...stops, defaults[stops.length] || { mode: "hours-from-start", value: "2" }]);
    setShowAllStops(true);
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

    if (vehicle?.fuel) setFuel(vehicle.fuel);
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
              ? { lat: originLocation?.lat, lon: originLocation?.lon, label: "Mi ubicación actual" }
              : { address: originAddress.trim() },
          destination: { address: destination.trim() },
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
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black text-blue-600">Planifica tu viaje</p>
              <h1 className="text-3xl font-black">Planifica dónde repostar</h1>
              <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                Elige origen, destino y una parada sencilla: por horas, por kilómetros o por una dirección concreta.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
              <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-blue-700">Ruta</div>
              <div className="rounded-2xl bg-blue-50 px-3 py-2 text-blue-700">≤ 5 km</div>
              <div className="rounded-2xl bg-purple-50 px-3 py-2 text-purple-700">Ahorro</div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,.95fr)_minmax(420px,1.05fr)]">
          <section className="space-y-4">
            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-500">Paso 1</p>
                  <h2 className="text-2xl font-black">Ruta</h2>
                </div>


              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-black">Origen</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={useCurrentLocation}
                      className={
                        originMode === "current" && originLocation
                          ? "rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                          : "rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
                      }
                    >
                      Mi ubicación
                    </button>

                    <button
                      onClick={() => setOriginMode("address")}
                      className={
                        originMode === "address"
                          ? "rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                          : "rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
                      }
                    >
                      Escribir
                    </button>
                  </div>

                  {originMode === "current" && (
                    <p className="mt-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                      {originLocation
                        ? `Origen activo: ${originAddress || "Mi ubicación actual"}`
                        : "Pulsa “Mi ubicación” para activarla."}
                    </p>
                  )}

                  {originMode === "address" && (
                    <div className="mt-3">
                      <AddressSuggestInput
                        label="Origen escrito"
                        value={originAddress}
                        onChange={setOriginAddress}
                        placeholder="Ej: Calle Alcalá 45, Madrid"
                        helper="Elige sugerencia para evitar calles repetidas."
                      />
                    </div>
                  )}
                </div>

                <AddressSuggestInput
                  label="Destino"
                  value={destination}
                  onChange={setDestination}
                  placeholder="Ej: Valencia, hotel, dirección..."
                  helper="Puedes escribir ciudad, dirección o zona."
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-500">Paso 2</p>
                  <h2 className="text-2xl font-black">Paradas de repostaje</h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAllStops((show) => !show)}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
                  >
                    {showAllStops ? "Ocultar" : "Ver"}
                  </button>

                  <button
                    onClick={addStop}
                    className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              {showAllStops && (
                <div className="space-y-3">
                  {stops.map((stop, index) => {
                    const mode = stopModes.find((item) => item.value === stop.mode) || stopModes[0];

                    return (
                      <article key={index} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
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

                        <div className="grid gap-3 md:grid-cols-[.9fr_1.1fr]">
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase text-slate-500">
                              Cómo quieres parar
                            </label>
                            <select
                              value={stop.mode}
                              onChange={(event) => updateStop(index, { mode: event.target.value as StopMode })}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            >
                              {stopModes.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            {stop.mode === "near-place" ? (
                              <AddressSuggestInput
                                label="Dirección concreta"
                                value={stop.value}
                                onChange={(value) => updateStop(index, { value })}
                                placeholder={mode.placeholder}
                                helper="Elige una sugerencia para evitar direcciones repetidas."
                              />
                            ) : (
                              <>
                                <label className="mb-2 block text-xs font-black uppercase text-slate-500">
                                  Valor
                                </label>
                                <input
                                  value={stop.value}
                                  onChange={(event) => updateStop(index, { value: event.target.value })}
                                  placeholder={mode.placeholder}
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                />
                              </>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 text-xs font-bold text-slate-500">{mode.helper}</p>

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
                </div>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => setShowOptions((show) => !show)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
              >
                <div>
                  <h2 className="text-xl font-black">Opciones</h2>
                  <p className="text-sm font-bold text-slate-500">
                    {fuelOptions.find((item) => item.value === fuel)?.label} ·{" "}
                    {sortBy === "balanced" ? "Equilibrio" : sortBy === "price" ? "Más barata" : "Menor desvío"}
                  </p>
                </div>

                <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
                  {showOptions ? "Ocultar" : "Abrir"}
                </span>
              </button>

              {showOptions && (
                <div className="border-t border-slate-100 p-5">
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

                  <div className="mt-4 relative">
                    <p className="mb-2 text-sm font-black">Marcas</p>
                    <button
                      type="button"
                      onClick={() => setBrandMenuOpen((open) => !open)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      {selectedBrands.length > 0 ? selectedBrands.join(", ") : "Todas las marcas"}
                    </button>

                    {brandMenuOpen && (
                      <div className="absolute left-0 right-0 top-[76px] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        {brandOptions.map((brandOption) => {
                          const selected = selectedBrands.includes(brandOption);

                          return (
                            <button
                              key={brandOption}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => toggleBrandSelection(brandOption)}
                              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
                            >
                              <span>{brandOption}</span>
                              <span className={selected ? "text-blue-600" : "text-slate-300"}>
                                {selected ? "✓" : "○"}
                              </span>
                            </button>
                          );
                        })}

                        {selectedBrands.length > 0 && (
                          <button
                            type="button"
                            onClick={clearBrandSelection}
                            className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
                          >
                            Quitar filtros de marca
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
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
              )}
              <div className="pt-2">
                <button
                  onClick={planTrip}
                  disabled={loading}
                  className="w-full rounded-3xl bg-blue-600 px-5 py-4 text-base font-black text-white shadow-sm shadow-blue-100 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Analizando viaje..." : "Analizar viaje"}
                </button>
                <p className="mt-2 text-center text-xs font-semibold text-slate-500">
                  Calcularemos el trayecto y las paradas recomendadas sin que tengas que volver arriba.
                </p>
              </div>
            </div>
          </section>

          <section className="self-start rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-500">Resultado</p>
                <h2 className="text-2xl font-black">Así quedaría tu viaje</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Primero verás el resumen del trayecto. Debajo aparecerán las mejores paradas para repostar.
                </p>
              </div>

              {result?.googleMapsUrl && (
                <a
                  href={result.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
                >
                  Abrir Maps
                </a>
              )}
            </div>

            {!result && (
              <div className="mt-5 rounded-3xl bg-slate-50 p-7 text-center text-slate-500">
                Completa la ruta y pulsa “Analizar viaje”. Aquí verás cómo quedaría el trayecto y las paradas recomendadas.
              </div>
            )}

            {result && (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase text-slate-500">Distancia</p>
                    <p className="mt-1 font-black">{formatKm(result.route.distanceMeters)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase text-slate-500">Duración</p>
                    <p className="mt-1 font-black">{result.route.duration}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase text-slate-500">Desvío</p>
                    <p className="mt-1 font-black">{result.maxDetourKm} km</p>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-lg font-black">Mejores paradas para repostar</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Estas son las estaciones recomendadas para cada parada que has configurado.
                  </p>
                </div>

                <div className="max-h-[68vh] space-y-4 overflow-auto pr-1">
                  {result.stops.map((stop, index) => (
                    <article key={stop.id} className="rounded-[1.4rem] border border-slate-200 p-4">
                      <div>
                        <p className="text-sm font-black text-blue-600">Parada {index + 1}</p>
                        <h3 className="text-lg font-black">{stop.label}</h3>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          Gasolineras a máximo {stop.radiusKm} km de ese punto.
                        </p>
                      </div>

                      {stop.stations.length === 0 && (
                        <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
                          No hay gasolineras dentro del desvío máximo.
                        </p>
                      )}

                      <div className="mt-3 space-y-3">
                        {stop.stations.slice(0, 4).map((station, stationIndex) => (
                          <div
                            key={`${station.id || station.station_id || stationIndex}`}
                            className={
                              stationIndex === 0
                                ? "rounded-2xl border-2 border-blue-300 bg-blue-50 p-3"
                                : "rounded-2xl bg-slate-50 p-3"
                            }
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-black uppercase text-slate-500">
                                  {stationIndex === 0 ? "Recomendada" : "Alternativa"}
                                </p>
                                <h4 className="mt-1 font-black">{station.name || "Gasolinera"}</h4>
                                <p className="text-xs font-bold text-slate-500">
                                  {station.brand || "Marca no indicada"} · {station.municipality || ""}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="font-black">{Number(station.price).toFixed(3)} €/L</p>
                                <p className="text-xs font-bold text-slate-500">
                                  {formatDetour(station.detourMeters)}
                                </p>
                              </div>
                            </div>

                            <a
                              href={stationMapsUrl(station)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm hover:bg-slate-100"
                            >
                              Ver en Maps
                            </a>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
