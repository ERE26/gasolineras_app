"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AutocompleteInput from "../components/AutocompleteInput";
import StationCard from "../components/StationCard";
import TopNav from "../components/TopNav";

const GasMap = dynamic(() => import("../components/GasMap"), {
  ssr: false,
});

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
  captured_at: string;
  distance_meters?: number;
  schedule?: string;
};

type Vehicle = {
  id: string;
  name: string;
  fuel: string;
  tankLiters: number;
  consumption: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fuelOptions = [
  { value: "gasolina95", label: "Gasolina 95" },
  { value: "gasolina98", label: "Gasolina 98" },
  { value: "diesel", label: "Diésel" },
  { value: "diesel_premium", label: "Diésel premium" },
  { value: "glp", label: "GLP" },
  { value: "gnc", label: "GNC" },
  { value: "gnl", label: "GNL" },
  { value: "hidrogeno", label: "Hidrógeno" },
];

const radiusOptions = [5, 10, 15, 25, 50];
const popularBrands = ["REPSOL", "MOEVE", "CEPSA", "GALP", "BP", "SHELL", "PLENOIL", "BALLENOIL", "PETROPRIX"];

export default function SearchPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fuel, setFuel] = useState("gasolina95");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [brand, setBrand] = useState("");
  const [liters, setLiters] = useState(50);

  const [searchAddress, setSearchAddress] = useState("");
  const [searchRadiusKm, setSearchRadiusKm] = useState(15);

  const [provinces, setProvinces] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>(popularBrands);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [favoriteStationIds, setFavoriteStationIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  async function loadFilters(selectedProvince?: string) {
    try {
      const params = new URLSearchParams();
      if (selectedProvince) params.append("province", selectedProvince);

      const response = await fetch(`${API_URL}/api/filters?${params.toString()}`);
      const data = await response.json();

      setProvinces(data.provinces || []);
      setMunicipalities(data.municipalities || []);
    } catch (error) {
      console.error("Error cargando filtros:", error);
      setProvinces([]);
      setMunicipalities([]);
    }
  }

  async function loadBrands(search: string) {
    try {
      const response = await fetch(
        `${API_URL}/api/brands?search=${encodeURIComponent(search)}&limit=12`
      );
      const data = await response.json();
      const merged = Array.from(new Set([...popularBrands, ...(Array.isArray(data) ? data : [])]));
      setBrandSuggestions(merged);
    } catch (error) {
      console.error("Error cargando marcas:", error);
      setBrandSuggestions(popularBrands);
    }
  }

  function loadVehiclesFromStorage() {
    const saved = localStorage.getItem("myVehicles");
    if (!saved) return;

    const parsed: Vehicle[] = JSON.parse(saved);
    setVehicles(parsed);

    if (parsed.length > 0) {
      setSelectedVehicleId(parsed[0].id);
      setFuel(parsed[0].fuel);
      setLiters(parsed[0].tankLiters);
    }
  }

  function loadFavoritesFromStorage() {
    const saved = localStorage.getItem("favoriteStations");
    if (!saved) return;
    setFavoriteStationIds(JSON.parse(saved));
  }

  function saveFavorites(nextFavorites: number[]) {
    setFavoriteStationIds(nextFavorites);
    localStorage.setItem("favoriteStations", JSON.stringify(nextFavorites));
  }

  function toggleFavoriteStation(stationId: number) {
    const exists = favoriteStationIds.includes(stationId);

    const nextFavorites = exists
      ? favoriteStationIds.filter((id) => id !== stationId)
      : [...favoriteStationIds, stationId];

    saveFavorites(nextFavorites);
  }

  function selectVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    setFuel(vehicle.fuel);
    setLiters(vehicle.tankLiters);
  }

  async function loadRanking() {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        fuel,
        limit: "25",
      });

      if (province.trim()) params.append("province", province.trim());
      if (municipality.trim()) params.append("municipality", municipality.trim());
      if (brand.trim()) params.append("brand", brand.trim());

      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);
      const data = await response.json();

      setStations(Array.isArray(data) ? data : []);
      setUserLocation(null);
    } catch (error) {
      console.error(error);
      alert("Error cargando el ranking.");
    } finally {
      setLoading(false);
    }
  }

  async function searchByAddress() {
    if (!searchAddress.trim()) {
      alert("Escribe una dirección o zona.");
      return;
    }

    setLoading(true);

    try {
      const query = encodeURIComponent(`${searchAddress}, España`);
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`
      );

      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        alert("No he encontrado esa dirección.");
        setLoading(false);
        return;
      }

      const lat = Number(geoData[0].lat);
      const lon = Number(geoData[0].lon);

      setUserLocation({ lat, lon });

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        fuel,
        radius: String(searchRadiusKm * 1000),
        limit: "25",
      });

      if (brand.trim()) params.append("brand", brand.trim());

      const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
      const data = await response.json();

      setStations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Error buscando por dirección.");
    } finally {
      setLoading(false);
    }
  }

  async function loadNearby() {
    if (!navigator.geolocation) {
      alert("Tu navegador no permite geolocalización.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          setUserLocation({ lat, lon });

          const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lon),
            fuel,
            radius: String(searchRadiusKm * 1000),
            limit: "25",
          });

          if (brand.trim()) params.append("brand", brand.trim());

          const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
          const data = await response.json();

          setStations(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error(error);
          alert("Error buscando gasolineras cercanas.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        alert("No se ha podido obtener tu ubicación.");
        setLoading(false);
      }
    );
  }

  useEffect(() => {
    loadFilters();
    loadVehiclesFromStorage();
    loadFavoritesFromStorage();
  }, []);

  useEffect(() => {
    loadFilters(province || undefined);
    setMunicipality("");
  }, [province]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadBrands(brand);
    }, 250);

    return () => clearTimeout(timeout);
  }, [brand]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

  const averagePrice = useMemo(() => {
    if (stations.length === 0) return null;

    const prices = stations
      .map((station) => Number(station.price))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) return null;

    return prices.reduce((acc, price) => acc + price, 0) / prices.length;
  }, [stations]);

  const cheapest = stations[0];

  const estimatedSaving = useMemo(() => {
    if (!cheapest || !averagePrice) return null;
    return (averagePrice - Number(cheapest.price)) * liters;
  }, [cheapest, averagePrice, liters]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-emerald-600">Modo rápido</p>
              <h1 className="mt-1 text-2xl font-black">
                Buscar gasolineras baratas
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Elige una opción rápida o configura tu búsqueda con más detalle.
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  onClick={() => {
                    setFuel("gasolina95");
                    loadNearby();
                  }}
                  className="rounded-2xl bg-slate-950 px-5 py-4 text-left font-black text-white shadow-lg hover:bg-slate-800"
                >
                  Gasolina 95 cerca de mí
                </button>

                <button
                  onClick={() => {
                    setFuel("diesel");
                    loadNearby();
                  }}
                  className="rounded-2xl bg-blue-600 px-5 py-4 text-left font-black text-white shadow-lg hover:bg-blue-500"
                >
                  Diésel cerca de mí
                </button>

                <button
                  onClick={loadRanking}
                  className="rounded-2xl bg-emerald-500 px-5 py-4 text-left font-black text-white shadow-lg hover:bg-emerald-400"
                >
                  Ver ranking por zona
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-blue-600">
                Configura tu búsqueda
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Ajusta filtros y cálculo
              </h2>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="mb-2 text-sm font-black text-slate-800">
                    Combustible
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fuelOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFuel(option.value)}
                        className={
                          fuel === option.value
                            ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
                            : "rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {vehicles.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-black text-slate-800">
                      Calcular con vehículo guardado
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {vehicles.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          onClick={() => selectVehicle(vehicle.id)}
                          className={
                            selectedVehicleId === vehicle.id
                              ? "rounded-full bg-purple-600 px-4 py-2 text-sm font-black text-white"
                              : "rounded-full bg-purple-50 px-4 py-2 text-sm font-black text-purple-700 hover:bg-purple-100"
                          }
                        >
                          {vehicle.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-purple-50 p-4 text-sm text-purple-900">
                    No tienes vehículos guardados todavía. Puedes añadirlos en{" "}
                    <Link href="/mis-vehiculos" className="font-black underline">
                      Mis vehículos
                    </Link>
                    .
                  </div>
                )}

                <AutocompleteInput
                  label="Marca"
                  value={brand}
                  onChange={setBrand}
                  onSelect={setBrand}
                  placeholder="Ej: Repsol, Moeve, Galp, BP..."
                  suggestions={brandSuggestions}
                  helper="Puedes escribir cualquier marca o dejarlo vacío."
                />

                <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
                  <h2 className="mb-3 font-black">
                    Buscar cerca de una dirección
                  </h2>
                  <input
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Ej: Calle Serrano 45, Madrid"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />

                  <div className="mt-4">
                    <p className="mb-2 text-sm font-black text-slate-800">
                      Radio
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {radiusOptions.map((radius) => (
                        <button
                          key={radius}
                          onClick={() => setSearchRadiusKm(radius)}
                          className={
                            searchRadiusKm === radius
                              ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white"
                              : "rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50"
                          }
                        >
                          {radius} km
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={searchByAddress}
                    className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 font-black text-white shadow-lg hover:bg-blue-500"
                  >
                    Buscar cerca de esta dirección
                  </button>
                </div>

                <AutocompleteInput
                  label="Provincia"
                  value={province}
                  onChange={setProvince}
                  onSelect={setProvince}
                  placeholder="Ej: Madrid"
                  suggestions={provinces}
                />

                <AutocompleteInput
                  label="Municipio"
                  value={municipality}
                  onChange={setMunicipality}
                  onSelect={setMunicipality}
                  placeholder="Ej: Alcobendas"
                  suggestions={municipalities}
                />

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Litros del depósito
                  </label>
                  <input
                    type="number"
                    value={liters}
                    onChange={(e) => setLiters(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  onClick={loadRanking}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white shadow-lg hover:bg-emerald-400"
                >
                  Buscar ranking
                </button>
              </div>
            </section>
          </aside>

          <section className="space-y-5">
            <div className="h-[560px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <GasMap stations={stations} userLocation={userLocation} />
            </div>

            {cheapest && (
              <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-sm font-black text-emerald-700">
                  Mejor opción actual
                </p>
                <h3 className="mt-2 text-xl font-black">{cheapest.name}</h3>
                <p className="text-sm text-slate-600">
                  {cheapest.address}, {cheapest.municipality}
                </p>
                <p className="mt-3 text-3xl font-black text-emerald-700">
                  {Number(cheapest.price).toFixed(3)} €/L
                </p>

                {estimatedSaving !== null && (
                  <p className="mt-2 text-sm text-slate-700">
                    Ahorro estimado frente a la media mostrada:{" "}
                    <strong>{estimatedSaving.toFixed(2)} €</strong>
                  </p>
                )}
              </section>
            )}

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Gasolineras encontradas</h2>
                  <p className="text-sm text-slate-500">
                    Ordenadas por precio dentro de tu búsqueda.
                  </p>
                </div>
                {loading && (
                  <p className="text-sm font-black text-emerald-600">
                    Cargando...
                  </p>
                )}
              </div>

              <div className="grid gap-4">
                {stations.map((station, index) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    index={index}
                    averagePrice={averagePrice}
                    selectedVehicle={selectedVehicle}
                    isFavorite={favoriteStationIds.includes(station.id)}
                    onToggleFavorite={toggleFavoriteStation}
                  />
                ))}

                {stations.length === 0 && !loading && (
                  <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                    Todavía no hay resultados. Prueba a buscar por dirección,
                    usar tu ubicación o escribir una provincia.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-sm text-slate-500">
        <div className="mx-auto max-w-7xl">
          Datos obtenidos del Geoportal de Hidrocarburos / MITECO. Esta web no pertenece
          ni está afiliada al Gobierno de España. Los precios pueden variar y deben
          verificarse en la estación de servicio.
        </div>
      </footer>
    </main>
  );
}
