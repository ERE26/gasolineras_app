"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";

type FavoriteStation = {
  id: number | string;
  name: string;
  brand?: string;
  address?: string;
  province?: string;
  municipality?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
  fuel_type?: string;
};

type AddressSuggestion = {
  label: string;
  lat: number;
  lon: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const popularBrands = ["REPSOL", "MOEVE", "CEPSA", "GALP", "BP", "SHELL", "PLENOIL", "BALLENOIL", "PETROPRIX"];

function getViewbox(lat: number, lon: number) {
  const delta = 0.35;
  return `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);
  const [results, setResults] = useState<FavoriteStation[]>([]);

  const [brand, setBrand] = useState("");
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>(popularBrands);

  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const [manualName, setManualName] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualAddress, setManualAddress] = useState("");

  useEffect(() => {
    loadFavorites();

    const savedLocation = localStorage.getItem("lastUserLocation");
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        if (parsed.lat && parsed.lon) {
          setUserLocation({ lat: parsed.lat, lon: parsed.lon });
        }
      } catch {}
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setUserLocation(coords);
          localStorage.setItem("lastUserLocation", JSON.stringify({ ...coords, updatedAt: new Date().toISOString() }));
        },
        () => {},
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
      );
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadBrands(brand);
    }, 250);

    return () => clearTimeout(timeout);
  }, [brand]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAddressSuggestions(address);
    }, 350);

    return () => clearTimeout(timeout);
  }, [address, userLocation]);

  function loadFavorites() {
    const savedFull = localStorage.getItem("favoriteStationsFull");

    if (savedFull) {
      try {
        setFavorites(JSON.parse(savedFull));
        return;
      } catch {}
    }

    const savedIds = localStorage.getItem("favoriteStations");
    if (savedIds) {
      try {
        const ids: number[] = JSON.parse(savedIds);
        setFavorites(ids.map((id) => ({ id, name: `Gasolinera ${id}` })));
      } catch {}
    }
  }

  function saveFavorites(next: FavoriteStation[]) {
    setFavorites(next);
    localStorage.setItem("favoriteStationsFull", JSON.stringify(next));
    localStorage.setItem("favoriteStations", JSON.stringify(next.map((item) => item.id)));
  }

  async function loadBrands(search: string) {
    try {
      const response = await fetch(
        `${API_URL}/api/brands?search=${encodeURIComponent(search)}&limit=12`
      );
      const data = await response.json();
      const merged = Array.from(new Set([...popularBrands, ...(Array.isArray(data) ? data : [])]));
      setBrandSuggestions(merged);
    } catch {
      setBrandSuggestions(popularBrands);
    }
  }

  async function loadAddressSuggestions(query: string) {
    if (!query.trim() || query.trim().length < 3) {
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
          }))
        : [];

      setAddressSuggestions(suggestions);
    } catch {
      setAddressSuggestions([]);
    }
  }

  function addFavorite(station: FavoriteStation) {
    const exists = favorites.some((item) => String(item.id) === String(station.id));
    if (exists) return;

    saveFavorites([...favorites, station]);
  }

  function removeFavorite(id: string | number) {
    saveFavorites(favorites.filter((item) => String(item.id) !== String(id)));
  }

  async function searchStationsToSave() {
    try {
      let lat = selectedAddress?.lat || userLocation?.lat;
      let lon = selectedAddress?.lon || userLocation?.lon;

      const params = new URLSearchParams({
        fuel: "gasolina95",
        limit: "12",
      });

      if (lat && lon) {
        params.set("lat", String(lat));
        params.set("lon", String(lon));
        params.set("radius", String(10000));
        if (brand.trim()) params.set("brand", brand.trim());

        const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
        return;
      }

      if (brand.trim()) params.set("brand", brand.trim());

      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      alert("No he podido buscar gasolineras para añadir.");
    }
  }

  function addManualFavorite() {
    if (!manualName.trim()) {
      alert("Pon nombre a la gasolinera.");
      return;
    }

    const item: FavoriteStation = {
      id: crypto.randomUUID(),
      name: manualName.trim(),
      brand: manualBrand.trim(),
      address: manualAddress.trim(),
    };

    saveFavorites([...favorites, item]);
    setManualName("");
    setManualBrand("");
    setManualAddress("");
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-black text-yellow-600">Favoritos inteligentes</p>
          <h1 className="text-4xl font-black">Mis gasolineras favoritas</h1>
          <p className="mx-auto mt-3 max-w-3xl text-slate-600">
            Guarda estaciones habituales y búscalas desde aquí. Puedes buscarlas por
            dirección o marca, igual que en el buscador principal.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Favoritas guardadas</h2>
                <p className="text-sm text-slate-500">Se guardan en tu navegador.</p>
              </div>

              <Link
                href="/buscar"
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
              >
                Buscar más
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {favorites.map((station) => (
                <div key={station.id} className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black">{station.name}</p>
                      <p className="text-sm text-slate-500">{station.brand || "Marca no indicada"}</p>
                      {station.address && <p className="mt-1 text-sm text-slate-500">{station.address}</p>}
                      {station.price && (
                        <p className="mt-2 text-sm font-black text-emerald-700">
                          Último precio visto: {Number(station.price).toFixed(3)} €/L
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      {station.latitude && station.longitude && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-black text-white"
                        >
                          Cómo llegar
                        </a>
                      )}

                      <button
                        onClick={() => removeFavorite(station.id)}
                        className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {favorites.length === 0 && (
                <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                  Todavía no tienes favoritas. Busca por marca o dirección y pulsa “Guardar”.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Buscar para añadir</h2>
              <p className="mt-1 text-sm text-slate-500">
                Busca una estación habitual por marca o dirección cercana.
              </p>

              <div className="mt-5 space-y-4">
                <div className="relative">
                  <label className="mb-2 block text-sm font-black">Dirección o zona</label>
                  <input
                    value={address}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      setSelectedAddress(null);
                    }}
                    placeholder="Ej: Calle Serrano 45, Madrid"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />

                  {address.trim().length >= 3 && addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[76px] z-[2500] max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                      {addressSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.lat}-${suggestion.lon}-${suggestion.label}`}
                          onClick={() => {
                            setSelectedAddress(suggestion);
                            setAddress(suggestion.label);
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

                <div className="relative">
                  <label className="mb-2 block text-sm font-black">Marca</label>
                  <input
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                    placeholder="Ej: Repsol, Moeve, Galp..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />

                  {brand.trim() && brandSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[76px] z-[2500] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                      {brandSuggestions
                        .filter((item) => item.toLowerCase().includes(brand.toLowerCase()))
                        .slice(0, 8)
                        .map((item) => (
                          <button
                            key={item}
                            onClick={() => setBrand(item)}
                            className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
                          >
                            {item}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={searchStationsToSave}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white hover:bg-slate-800"
                >
                  Buscar estaciones
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {results.map((station) => (
                  <div key={station.id} className="rounded-3xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black">{station.name}</p>
                        <p className="text-sm text-slate-500">
                          {station.brand} · {station.municipality}, {station.province}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{station.address}</p>
                        {station.price && (
                          <p className="mt-2 text-sm font-black text-emerald-700">
                            {Number(station.price).toFixed(3)} €/L
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => addFavorite(station)}
                        className="rounded-2xl bg-yellow-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-yellow-200"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Añadir manualmente</h2>
              <p className="mt-1 text-sm text-slate-500">
                Útil si no aparece en la búsqueda.
              </p>

              <div className="mt-5 space-y-4">
                <input
                  value={manualName}
                  onChange={(event) => setManualName(event.target.value)}
                  placeholder="Nombre de la gasolinera"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  value={manualBrand}
                  onChange={(event) => setManualBrand(event.target.value)}
                  placeholder="Marca: Repsol, Moeve, Galp..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  value={manualAddress}
                  onChange={(event) => setManualAddress(event.target.value)}
                  placeholder="Dirección"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  onClick={addManualFavorite}
                  className="w-full rounded-2xl bg-yellow-300 px-4 py-3 font-black text-slate-950 hover:bg-yellow-200"
                >
                  Añadir favorita
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
