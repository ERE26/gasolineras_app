"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";

type FavoriteStation = {
  id: number;
  name: string;
  brand?: string;
  address?: string;
  province?: string;
  municipality?: string;
  price?: string;
  fuel_type?: string;
  latitude?: number;
  longitude?: number;
  manual?: boolean;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualBrand, setManualBrand] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("favoriteStationsData");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  function save(next: FavoriteStation[]) {
    setFavorites(next);
    localStorage.setItem("favoriteStationsData", JSON.stringify(next));
    localStorage.setItem("favoriteStations", JSON.stringify(next.map((item) => item.id)));
  }

  function addManualFavorite() {
    if (!manualName.trim()) {
      alert("Escribe el nombre de la gasolinera.");
      return;
    }

    const station: FavoriteStation = {
      id: Date.now(),
      name: manualName.trim(),
      address: manualAddress.trim(),
      brand: manualBrand.trim(),
      manual: true,
    };

    save([...favorites, station]);
    setManualName("");
    setManualAddress("");
    setManualBrand("");
  }

  function removeFavorite(id: number) {
    save(favorites.filter((station) => station.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-black text-yellow-600">Tus estaciones habituales</p>
          <h1 className="mt-1 text-4xl font-black">Mis gasolineras favoritas</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Guarda las gasolineras que sueles usar. Puedes añadirlas desde cualquier resultado del buscador o manualmente aquí.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_.75fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black">Favoritas guardadas</h2>
                <p className="text-sm text-slate-500">Se guardan en tu navegador.</p>
              </div>
              <Link href="/buscar" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800">
                Buscar para añadir
              </Link>
            </div>

            <div className="grid gap-4">
              {favorites.map((station) => {
                const mapsUrl = station.latitude && station.longitude
                  ? `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${station.name} ${station.address || ""}`)}`;

                return (
                  <div key={station.id} className="rounded-3xl bg-yellow-50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">{station.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{station.brand || "Marca no indicada"}</p>
                        {station.address && <p className="mt-1 text-sm text-slate-500">{station.address}</p>}
                        {(station.municipality || station.province) && (
                          <p className="text-sm text-slate-500">{station.municipality}, {station.province}</p>
                        )}
                        {station.price && (
                          <p className="mt-2 font-black text-emerald-700">{Number(station.price).toFixed(3)} €/L</p>
                        )}
                      </div>
                      <button onClick={() => removeFavorite(station.id)} className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-red-600 hover:bg-red-50">
                        Quitar
                      </button>
                    </div>
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-4 block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800">
                      Cómo llegar
                    </a>
                  </div>
                );
              })}

              {favorites.length === 0 && (
                <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                  Todavía no tienes favoritas. Entra en el buscador y pulsa “Guardar” en las gasolineras que más uses.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Añadir manualmente</h2>
            <p className="mt-1 text-sm text-slate-500">Útil para guardar una estación habitual aunque no la tengas en resultados ahora mismo.</p>
            <div className="mt-5 space-y-3">
              <input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Nombre de la gasolinera" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              <input value={manualBrand} onChange={(e) => setManualBrand(e.target.value)} placeholder="Marca: Repsol, Moeve, Galp..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              <input value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} placeholder="Dirección" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              <button onClick={addManualFavorite} className="w-full rounded-2xl bg-yellow-400 px-4 py-3 font-black text-slate-950 hover:bg-yellow-300">
                Añadir favorita
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
