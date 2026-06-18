"use client";

import Link from "next/link";
import FuelAssistant from "../components/FuelAssistant";
import TopNav from "../components/TopNav";

export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black text-blue-600">Análisis</p>
            <h1 className="mt-1 text-4xl font-black">Decide si realmente compensa repostar</h1>
            <p className="mt-3 max-w-4xl leading-7 text-slate-600">
              Esta página no busca el precio más barato de toda España. Analiza tu última
              búsqueda cercana y calcula la decisión con contexto: zona, radio, precio local
              y distancia.
            </p>

            <Link
              href="/buscar"
              className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800"
            >
              Hacer búsqueda cercana
            </Link>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-emerald-50 to-blue-50 p-6 shadow-sm">
            <p className="text-sm font-black text-emerald-700">Criterio del asistente</p>
            <h2 className="mt-1 text-2xl font-black">Primero cercanía, luego precio</h2>
            <p className="mt-3 leading-7 text-slate-600">
              El ahorro solo tiene sentido si la gasolinera está dentro de un radio razonable.
              Por eso el análisis usa tu ubicación antes de recomendar.
            </p>
          </div>
        </div>

        <FuelAssistant />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">1. Precio local</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Compara contra una referencia cercana, no contra todo el país.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">2. Distancia real</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ir más lejos puede eliminar el ahorro por el coste del trayecto.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">3. Vehículo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Con depósito y consumo guardados el análisis es mucho más útil.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
