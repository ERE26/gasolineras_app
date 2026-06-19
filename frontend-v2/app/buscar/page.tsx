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
  captured_at?: string;
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

type AddressSuggestion = {
  label: string;
  lat: number;
  lon: number;
  area: {
    label: string;
    municipality: string;
    isMajorCity: boolean;
  };
};

type AreaInfo = {
  label: string;
  municipality: string;
  isMajorCity: boolean;
  chosenRadiusKm: number;
  reason: string;
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

const mainBrands = ["REPSOL", "MOEVE", "GALP", "BP", "DISA", "SHELL", "BALLENOIL", "PLENERGY"];
const brandOptions = [...mainBrands, "OTRA"];

function isMainBrandStation(station: { brand?: string; name?: string }) {
  const text = `${station.brand || ""} ${station.name || ""}`.toUpperCase();
  return mainBrands.some((brand) => text.includes(brand));
}

function filterByBrandSelection<T extends { brand?: string; name?: string }>(items: T[], brand: string) {
  if (!brand.trim()) return items;
  if (brand.toUpperCase() === "OTRA") {
    return items.filter((item) => !isMainBrandStation(item));
  }

  const selected = brand.toUpperCase();
  return items.filter((item) => `${item.brand || ""} ${item.name || ""}`.toUpperCase().includes(selected));
}

type FavoriteStation = Station | {
  id: number | string;
  name: string;
  brand?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
  fuel_type?: string;
  municipality?: string;
  province?: string;
};

const majorCities = [
  "madrid", "barcelona", "valencia", "sevilla", "zaragoza", "malaga", "málaga",
  "murcia", "palma", "bilbao", "alicante", "valladolid", "vigo", "gijon",
  "gijón", "granada", "elche", "oviedo", "cartagena", "sabadell", "mostoles",
  "móstoles", "santa cruz de tenerife",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getAddressArea(address: any) {
  const municipality =
    address?.city ||
    address?.town ||
    address?.municipality ||
    address?.village ||
    address?.county ||
    "";

  const label =
    address?.road ||
    address?.suburb ||
    address?.city_district ||
    address?.city ||
    address?.town ||
    address?.municipality ||
    address?.village ||
    "tu zona";

  const normalizedMunicipality = normalize(String(municipality));
  const isMajorCity = majorCities.some((city) => normalize(city) === normalizedMunicipality);

  return {
    label: String(label),
    municipality: String(municipality || label),
    isMajorCity,
  };
}

function getViewbox(lat: number, lon: number) {
  const delta = 0.35;
  return `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
}

export default function SearchPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fuel, setFuel] = useState("gasolina95");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [brand, setBrand] = useState("");

  const [searchAddress, setSearchAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  const [provinces, setProvinces] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>(brandOptions);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [favoriteStationIds, setFavoriteStationIds] = useState<Array<number | string>>([]);
  const [favoriteStationsFull, setFavoriteStationsFull] = useState<FavoriteStation[]>([]);

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
  const [referencePrice, setReferencePrice] = useState<number | null>(null);

  async function requestUserLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        setUserLocation(coords);
        localStorage.setItem(
          "lastUserLocation",
          JSON.stringify({ ...coords, updatedAt: new Date().toISOString() })
        );
      },
      () => {
        const saved = localStorage.getItem("lastUserLocation");
        if (!saved) return;
        try {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lon) {
            setUserLocation({ lat: parsed.lat, lon: parsed.lon });
          }
        } catch {}
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      }
    );
  }

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
    setBrandSuggestions(brandOptions);
  }

  async function loadAddressSuggestions(query: string) {
    if (!query.trim() || query.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    if (selectedAddress && selectedAddress.label === query) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        format: "json",
        addressdetails: "1",
        limit: "6",
        countrycodes: "es",
        q: query,
      });

      if (userLocation) {
        params.set("viewbox", getViewbox(userLocation.lat, userLocation.lon));
        params.set("bounded", "0");
      }

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      const data = await response.json();

      const suggestions: AddressSuggestion[] = Array.isArray(data)
        ? data.map((item: any) => ({
            label: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
            area: getAddressArea(item.address || {}),
          }))
        : [];

      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error("Error cargando sugerencias de dirección:", error);
      setAddressSuggestions([]);
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
    }
  }

  function loadFavoritesFromStorage() {
    const savedFull = localStorage.getItem("favoriteStationsFull");
    if (savedFull) {
      try {
        const parsed: FavoriteStation[] = JSON.parse(savedFull);
        setFavoriteStationsFull(parsed);
        setFavoriteStationIds(parsed.map((item) => item.id));
        return;
      } catch {}
    }

    const saved = localStorage.getItem("favoriteStations");
    if (!saved) return;

    try {
      const ids = JSON.parse(saved);
      setFavoriteStationIds(ids);
    } catch {}
  }

  function saveFavorites(nextFavorites: FavoriteStation[]) {
    setFavoriteStationsFull(nextFavorites);
    setFavoriteStationIds(nextFavorites.map((item) => item.id));
    localStorage.setItem("favoriteStationsFull", JSON.stringify(nextFavorites));
    localStorage.setItem("favoriteStations", JSON.stringify(nextFavorites.map((item) => item.id)));
  }

  function toggleFavoriteStation(station: Station) {
    const exists = favoriteStationIds.some((id) => String(id) === String(station.id));

    if (exists) {
      saveFavorites(favoriteStationsFull.filter((item) => String(item.id) !== String(station.id)));
      return;
    }

    saveFavorites([...favoriteStationsFull, { ...station }]);
  }

  async function searchFavorite(favorite: FavoriteStation) {
    if ("latitude" in favorite && favorite.latitude && favorite.longitude) {
      await runSmartNearby(
        favorite.latitude,
        favorite.longitude,
        favorite.name,
        fuel,
        {
          label: favorite.name,
          municipality: favorite.municipality || favorite.name,
          isMajorCity: false,
        }
      );
      return;
    }

    if (favorite.brand) setBrand(favorite.brand);
    if (favorite.address) setSearchAddress(favorite.address);
  }

  function selectVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    setFuel(vehicle.fuel);
  }

  async function fetchNearby(lat: number, lon: number, radiusKm: number, selectedFuel = fuel) {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      fuel: selectedFuel,
      radius: String(radiusKm * 1000),
      limit: brand.toUpperCase() === "OTRA" ? "80" : "25",
    });

    if (brand.trim() && brand.toUpperCase() !== "OTRA") {
      params.append("brand", brand.trim());
    }

    const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
    const data = await response.json();

    const result = Array.isArray(data) ? data : [];
    return filterByBrandSelection(result, brand).slice(0, 25);
  }

  async function loadReferenceForMunicipality(areaName: string, selectedFuel = fuel) {
    if (!areaName || areaName === "tu zona") return null;

    try {
      const params = new URLSearchParams({
        fuel: selectedFuel,
        municipality: areaName,
        limit: "80",
      });

      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);
      const data = await response.json();

      const prices = Array.isArray(data)
        ? data.map((item: Station) => Number(item.price)).filter(Number.isFinite)
        : [];

      if (prices.length === 0) return null;

      return prices.reduce((acc: number, price: number) => acc + price, 0) / prices.length;
    } catch {
      return null;
    }
  }

  async function reverseGeocode(lat: number, lon: number) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    return getAddressArea(data.address || {});
  }

  async function runSmartNearby(
    lat: number,
    lon: number,
    sourceLabel: string,
    selectedFuel = fuel,
    areaFromSearch?: { label: string; municipality: string; isMajorCity: boolean }
  ) {
    setLoading(true);

    try {
      const area = areaFromSearch || (await reverseGeocode(lat, lon));
      const firstRadius = area.isMajorCity ? 1 : 5;
      let radiusToUse = firstRadius;
      let reason = area.isMajorCity
        ? "zona urbana: buscamos primero en 1 km"
        : "zona amplia o afueras: usamos 5 km";

      let nearby = await fetchNearby(lat, lon, firstRadius, selectedFuel);

      if (area.isMajorCity && nearby.length < 5) {
        radiusToUse = 5;
        reason = "había pocas estaciones en 1 km, ampliamos a 5 km";
        nearby = await fetchNearby(lat, lon, 5, selectedFuel);
      }

      const reference = await loadReferenceForMunicipality(area.municipality, selectedFuel);

      setStations(nearby);
      setUserLocation({ lat, lon });
      setReferencePrice(reference);
      setAreaInfo({
        label: sourceLabel || area.label,
        municipality: area.municipality,
        isMajorCity: area.isMajorCity,
        chosenRadiusKm: radiusToUse,
        reason,
      });

      localStorage.setItem(
        "lastFuelSearchContext",
        JSON.stringify({
          fuel: selectedFuel,
          brand,
          area,
          areaInfo: {
            label: sourceLabel || area.label,
            municipality: area.municipality,
            isMajorCity: area.isMajorCity,
            chosenRadiusKm: radiusToUse,
            reason,
          },
          userLocation: { lat, lon },
          referencePrice: reference,
          stations: nearby.slice(0, 10),
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error(error);
      alert("Error buscando gasolineras cercanas.");
    } finally {
      setLoading(false);
    }
  }

  async function searchByAddress() {
    if (selectedAddress) {
      await runSmartNearby(selectedAddress.lat, selectedAddress.lon, selectedAddress.label, fuel, selectedAddress.area);
      return;
    }

    if (!searchAddress.trim()) {
      alert("Escribe una dirección o zona.");
      return;
    }

    if (addressSuggestions.length > 0) {
      const first = addressSuggestions[0];
      setSelectedAddress(first);
      setSearchAddress(first.label);
      setAddressSuggestions([]);
      await runSmartNearby(first.lat, first.lon, first.label, fuel, first.area);
      return;
    }

    alert("Elige una dirección sugerida para evitar resultados lejos de tu ubicación.");
  }

  async function loadNearby(selectedFuel = fuel) {
    if (userLocation) {
      await runSmartNearby(userLocation.lat, userLocation.lon, "tu ubicación", selectedFuel);
      return;
    }

    if (!navigator.geolocation) {
      alert("Tu navegador no permite geolocalización.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLoading(false);
        await runSmartNearby(position.coords.latitude, position.coords.longitude, "tu ubicación", selectedFuel);
      },
      () => {
        alert("No se ha podido obtener tu ubicación.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      }
    );
  }

  async function loadManualRanking() {
    if (!province.trim() && !municipality.trim() && !brand.trim()) {
      await loadNearby(fuel);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({ fuel, limit: "25" });

      if (province.trim()) params.append("province", province.trim());
      if (municipality.trim()) params.append("municipality", municipality.trim());
      if (brand.trim() && brand.toUpperCase() !== "OTRA") params.append("brand", brand.trim());

      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);
      const data = await response.json();
      const nextStations = filterByBrandSelection(Array.isArray(data) ? data : [], brand).slice(0, 25);

      setStations(nextStations);
      setAreaInfo(null);

      const prices = nextStations.map((item) => Number(item.price)).filter(Number.isFinite);
      const avg = prices.length
        ? prices.reduce((acc, price) => acc + price, 0) / prices.length
        : null;

      setReferencePrice(avg);

      localStorage.setItem(
        "lastFuelSearchContext",
        JSON.stringify({
          fuel,
          brand,
          area: { label: municipality || province || brand || "ranking manual" },
          areaInfo: null,
          userLocation,
          referencePrice: avg,
          stations: nextStations.slice(0, 10),
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error(error);
      alert("Error cargando el ranking.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFilters();
    loadVehiclesFromStorage();
    loadFavoritesFromStorage();
    requestUserLocation();
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedAddress && selectedAddress.label === searchAddress) {
        setAddressSuggestions([]);
        return;
      }

      loadAddressSuggestions(searchAddress);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchAddress, userLocation, selectedAddress]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

  const visibleAveragePrice = useMemo(() => {
    if (referencePrice !== null) return referencePrice;
    if (stations.length === 0) return null;

    const prices = stations
      .map((station) => Number(station.price))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) return null;

    return prices.reduce((acc, price) => acc + price, 0) / prices.length;
  }, [referencePrice, stations]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-5 py-5">
        <div className="mb-4 grid items-start gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-blue-600">Búsqueda principal</p>
            <h1 className="text-2xl font-black">Busca cerca de ti</h1>

            <div className="relative mt-3">
              <input
                value={searchAddress}
                onChange={(e) => {
                  setSearchAddress(e.target.value);
                  setSelectedAddress(null);
                }}
                placeholder="Ej: Calle Serrano 45, Madrid"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />

              {searchAddress.trim().length >= 3 && addressSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[54px] z-[2500] max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {addressSuggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lon}-${suggestion.label}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSelectedAddress(suggestion);
                        setSearchAddress(suggestion.label);
                        setAddressSuggestions([]);
                      }}
                      className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                onClick={searchByAddress}
                className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white shadow-sm hover:bg-blue-500"
              >
                Buscar esta zona
              </button>

              <button
                onClick={() => loadNearby(fuel)}
                className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white shadow-sm hover:bg-slate-800"
              >
                Usar mi ubicación
              </button>
            </div>
          </div>

          <div className="self-start rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-emerald-600">Atajos rápidos</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <button
                onClick={() => {
                  setFuel("gasolina95");
                  loadNearby("gasolina95");
                }}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-left text-sm font-black text-white shadow-sm hover:bg-slate-800"
              >
                Gasolina 95 cerca de mí
              </button>

              <button
                onClick={() => {
                  setFuel("diesel");
                  loadNearby("diesel");
                }}
                className="rounded-2xl bg-blue-600 px-4 py-3 text-left text-sm font-black text-white shadow-sm hover:bg-blue-500"
              >
                Diésel cerca de mí
              </button>
            </div>
          </div>
        </div>

        {areaInfo && (
          <div className="mb-4 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <strong>{areaInfo.label}</strong> · radio aplicado:{" "}
            <strong>{areaInfo.chosenRadiusKm} km</strong>. {areaInfo.reason}.
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-blue-600">Filtros y cálculo</p>

              <div className="mt-4 space-y-4">
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
                            ? "rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white"
                            : "rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
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
                      Vehículo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {vehicles.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          onClick={() => selectVehicle(vehicle.id)}
                          className={
                            selectedVehicleId === vehicle.id
                              ? "rounded-full bg-purple-600 px-3 py-2 text-xs font-black text-white"
                              : "rounded-full bg-purple-50 px-3 py-2 text-xs font-black text-purple-700 hover:bg-purple-100"
                          }
                        >
                          {vehicle.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-purple-50 p-3 text-xs text-purple-900">
                    Añade tu vehículo en{" "}
                    <Link href="/mis-vehiculos" className="font-black underline">
                      Mis vehículos
                    </Link>{" "}
                    para calcular ahorro real.
                  </div>
                )}

                {favoriteStationsFull.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-black text-slate-800">
                      Favoritas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {favoriteStationsFull.slice(0, 8).map((favorite) => (
                        <button
                          key={favorite.id}
                          onClick={() => searchFavorite(favorite)}
                          className="rounded-full bg-yellow-50 px-3 py-2 text-xs font-black text-yellow-800 hover:bg-yellow-100"
                        >
                          {favorite.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AutocompleteInput
                  label="Marca"
                  value={brand}
                  onChange={setBrand}
                  onSelect={setBrand}
                  placeholder="Repsol, Moeve, Galp, BP, Disa..."
                  suggestions={brandOptions}
                  showSuggestionsOnFocus
                />

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

                <button
                  onClick={loadManualRanking}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white shadow-sm hover:bg-emerald-400"
                >
                  Buscar con filtros
                </button>
              </div>
            </section>
          </aside>

          <section className="space-y-4">
            <div className="h-[520px] overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm">
              <GasMap stations={stations} userLocation={userLocation} />
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
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
                    averagePrice={visibleAveragePrice}
                    selectedVehicle={selectedVehicle}
                    isFavorite={favoriteStationIds.some((id) => String(id) === String(station.id))}
                    onToggleFavorite={toggleFavoriteStation}
                  />
                ))}

                {stations.length === 0 && !loading && (
                  <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                    Todavía no hay resultados. Busca por dirección, usa tu ubicación
                    o escribe una provincia/municipio.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
