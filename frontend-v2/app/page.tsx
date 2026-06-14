"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "./components/TopNav";

const GasMap = dynamic(() => import("./components/GasMap"), {
  ssr: false,
});

type Summary = {
  totalStations: number;
  totalPrices: number;
  lastUpdate: string | null;
};

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cheapStations, setCheapStations] = useState<Station[]>([]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const summaryResponse = await fetch(`${API_URL}/api/summary`);
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      } catch (error) {
        console.error("Error cargando resumen:", error);
      }

      try {
        const rankingResponse = await fetch(
          `${API_URL}/api/ranking?fuel=gasolina95&limit=6`
        );
        const rankingData = await rankingResponse.json();
        setCheapStations(Array.isArray(rankingData) ? rankingData : []);
      } catch (error) {
        console.error("Error cargando ranking inicial:", error);
      }
    }

    loadHomeData();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#bbf7d0,transparent_34%),radial-gradient(circle_at_top_right,#bfdbfe,transparent_38%),linear-gradient(135deg,#ffffff,#f8fafc)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              Datos oficiales actualizados automáticamente
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Encuentra la gasolinera más barata cerca de ti.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Busca precios por ubicación, marca, provincia o municipio. Guarda tus vehículos,
              calcula el coste de llenar el depósito y compara si merece la pena desplazarte.
            </p>

            <div className="mt-8">
              <Link
                href="/buscar"
                className="inline-flex w-full max-w-xl items-center justify-center rounded-[1.7rem] bg-slate-950 px-8 py-6 text-xl font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
              >
                Buscar gasolineras cerca de mí
              </Link>
            </div>

            <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Estaciones
                </p>
                <p className="mt-1 text-2xl font-black">
                  {summary?.totalStations ?? "-"}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Precios
                </p>
                <p className="mt-1 text-2xl font-black">
                  {summary?.totalPrices ?? "-"}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Actualización
                </p>
                <p className="mt-1 text-xs font-black leading-5">
                  {summary?.lastUpdate
                    ? new Date(summary.lastUpdate).toLocaleString("es-ES")
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl">
            <p className="text-sm font-black text-blue-600">Accesos rápidos</p>
            <h2 className="mt-1 text-2xl font-black">
              Todo lo importante en tres apartados
            </h2>

            <div className="mt-5 grid gap-4">
              <Link
                href="/buscar"
                className="rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <p className="text-3xl">⛽</p>
                <h3 className="mt-3 text-xl font-black">
                  Buscar gasolineras baratas
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Encuentra precios por zona, marca o combustible.
                </p>
              </Link>

              <Link
                href="/mis-vehiculos"
                className="rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <p className="text-3xl">🚗</p>
                <h3 className="mt-3 text-xl font-black">Mis vehículos</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Guarda depósitos y consumos para calcular ahorro real.
                </p>
              </Link>

              <Link
                href="/analisis"
                className="rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <p className="text-3xl">🧠</p>
                <h3 className="mt-3 text-xl font-black">
                  Analizador de ahorro
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Entiende si compensa repostar, desviarte o cambiar de marca.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-emerald-600">Más baratas ahora</p>
          <h2 className="mt-1 text-3xl font-black">
            Gasolina 95 más barata en la muestra actual
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Como Canarias tiene fiscalidad diferente y precios normalmente más bajos,
            en análisis avanzados conviene compararla aparte de Península y Baleares.
          </p>

          <div className="mt-6 grid gap-3">
            {cheapStations.slice(0, 5).map((station, index) => (
              <div
                key={station.id}
                className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50 p-4"
              >
                <div>
                  <p className="text-sm font-black text-slate-500">
                    #{index + 1} · {station.municipality}, {station.province}
                  </p>
                  <p className="font-black">{station.name}</p>
                  <p className="text-sm text-slate-500">
                    {station.brand || "Marca no indicada"}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500 px-4 py-3 text-right text-white">
                  <p className="text-xl font-black">
                    {Number(station.price).toFixed(3)} €
                  </p>
                  <p className="text-xs font-bold">por litro</p>
                </div>
              </div>
            ))}

            {cheapStations.length === 0 && (
              <p className="rounded-3xl bg-slate-50 p-5 text-slate-500">
                Cargando gasolineras...
              </p>
            )}
          </div>
        </div>

        <div className="h-[520px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <GasMap stations={cheapStations} userLocation={null} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-blue-600">Cómo se calcula el ahorro</p>
          <h2 className="mt-1 text-3xl font-black">
            No solo importa el precio: también la distancia.
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            La web compara el precio por litro con la media de los resultados y, si
            tienes vehículos guardados, estima el coste de llenar el depósito y el
            coste de desplazarte. Así puedes ver si realmente compensa ir a otra
            estación.
          </p>
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
