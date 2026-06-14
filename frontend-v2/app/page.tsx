"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "./components/TopNav";

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
};

type CheapestSummary = {
  fuel: string;
  peninsulaBaleares: Station[];
  canarias: Station[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatDate(value: string | null | undefined) {
  if (!value) return "datos automáticos";
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MiniStation({ station, index }: { station: Station; index: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-emerald-600">#{index + 1} más barata</p>
          <h3 className="mt-1 text-base font-black text-slate-950">{station.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {station.municipality}, {station.province}
          </p>
          <p className="mt-1 text-xs text-slate-400">{station.brand || "Marca no indicada"}</p>
        </div>
        <div className="rounded-2xl bg-emerald-500 px-3 py-2 text-right text-white">
          <p className="text-lg font-black">{Number(station.price).toFixed(3)} €</p>
          <p className="text-[10px] font-bold opacity-90">/ litro</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cheapest, setCheapest] = useState<CheapestSummary | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryResponse, cheapestResponse] = await Promise.all([
          fetch(`${API_URL}/api/summary`),
          fetch(`${API_URL}/api/cheapest-summary?fuel=gasolina95&limit=4`),
        ]);

        setSummary(await summaryResponse.json());
        setCheapest(await cheapestResponse.json());
      } catch (error) {
        console.error("Error cargando datos de la home:", error);
      }
    }

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#bbf7d0,transparent_34%),radial-gradient(circle_at_top_right,#bfdbfe,transparent_38%),linear-gradient(135deg,#ffffff,#f8fafc)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              Datos oficiales · actualización automática
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Encuentra la gasolinera más barata cerca de ti.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Compara precios por zona, marca y combustible. Guarda tus vehículos, calcula el ahorro real
              y usa el analizador para decidir dónde te compensa repostar.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-black text-slate-600">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                {summary?.totalStations?.toLocaleString("es-ES") ?? "-"} estaciones
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                {summary?.totalPrices?.toLocaleString("es-ES") ?? "-"} precios
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Actualizado: {formatDate(summary?.lastUpdate)}
              </span>
            </div>

            <div className="mt-9">
              <Link
                href="/buscar"
                className="inline-flex rounded-[2rem] bg-slate-950 px-10 py-6 text-xl font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800 md:text-2xl"
              >
                Buscar gasolineras cerca de mí
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <Link href="/buscar" className="group rounded-[2rem] border border-emerald-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">📍</div>
              <h2 className="mt-5 text-2xl font-black">Buscar gasolineras baratas</h2>
              <p className="mt-3 text-slate-600">Busca por ubicación, dirección, provincia, municipio, marca o combustible.</p>
              <p className="mt-5 font-black text-emerald-600 group-hover:underline">Ir al buscador →</p>
            </Link>

            <Link href="/mis-vehiculos" className="group rounded-[2rem] border border-purple-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-3xl">🚗</div>
              <h2 className="mt-5 text-2xl font-black">Mis vehículos</h2>
              <p className="mt-3 text-slate-600">Guarda depósito, consumo y combustible para calcular cuánto te cuesta llenar y desplazarte.</p>
              <p className="mt-5 font-black text-purple-600 group-hover:underline">Configurar vehículos →</p>
            </Link>

            <Link href="/analisis" className="group rounded-[2rem] border border-blue-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">🤖</div>
              <h2 className="mt-5 text-2xl font-black">Analizador de ahorro</h2>
              <p className="mt-3 text-slate-600">Interpreta precios, compara Canarias con Península+Baleares y decide si compensa el desvío.</p>
              <p className="mt-5 font-black text-blue-600 group-hover:underline">Abrir análisis →</p>
            </Link>
          </div>
        </div>
      </section>

      <section id="mas-baratas" className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black text-emerald-600">Gasolina 95</p>
            <h2 className="text-3xl font-black">Más baratas ahora</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Separamos Canarias porque sus precios suelen ser más bajos por su fiscalidad específica,
              así la comparación es más justa.
            </p>
          </div>
          <Link href="/buscar" className="rounded-2xl bg-emerald-500 px-5 py-3 text-center font-black text-white hover:bg-emerald-400">
            Ver ranking completo
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xl font-black">Península y Baleares</h3>
            <div className="grid gap-3">
              {cheapest?.peninsulaBaleares?.map((station, index) => (
                <MiniStation key={station.id} station={station} index={index} />
              ))}
              {!cheapest?.peninsulaBaleares?.length && <p className="text-slate-500">Cargando datos...</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xl font-black">Canarias</h3>
            <div className="grid gap-3">
              {cheapest?.canarias?.map((station, index) => (
                <MiniStation key={station.id} station={station} index={index} />
              ))}
              {!cheapest?.canarias?.length && <p className="text-slate-500">Cargando datos...</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-3">
            <Link href="/favoritas" className="rounded-3xl bg-yellow-50 p-5 hover:bg-yellow-100">
              <p className="text-3xl">⭐</p>
              <h2 className="mt-3 text-xl font-black">Mis favoritas</h2>
              <p className="mt-2 text-sm text-slate-600">Guarda tus gasolineras habituales y tenlas siempre localizadas.</p>
            </Link>
            <Link href="/buscar#mapa" className="rounded-3xl bg-blue-50 p-5 hover:bg-blue-100">
              <p className="text-3xl">🗺️</p>
              <h2 className="mt-3 text-xl font-black">Mapa siempre visible</h2>
              <p className="mt-2 text-sm text-slate-600">Empieza en el mapa de España y se actualiza con cada búsqueda.</p>
            </Link>
            <Link href="/analisis" className="rounded-3xl bg-emerald-50 p-5 hover:bg-emerald-100">
              <p className="text-3xl">💡</p>
              <h2 className="mt-3 text-xl font-black">Consejo inteligente</h2>
              <p className="mt-2 text-sm text-slate-600">No mires solo el precio: mira distancia, depósito, consumo y ahorro neto.</p>
            </Link>
          </div>
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
