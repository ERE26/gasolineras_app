"use client";

import Link from "next/link";
import FuelAssistant from "../components/FuelAssistant";
import TopNav from "../components/TopNav";

export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-blue-600">Análisis</p>
          <h1 className="mt-1 text-4xl font-black">Analizador de ahorro</h1>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            Esta sección interpreta tu última búsqueda. Tiene en cuenta tu ubicación,
            el radio aplicado, la referencia local y los resultados cercanos, para no
            recomendar opciones que no tienen sentido por distancia.
          </p>

          <Link href="/buscar" className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800">
            Hacer una búsqueda cercana
          </Link>
        </div>

        <FuelAssistant />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Precio local</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Compara contra una referencia cercana, no contra todo el país.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Distancia real</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Ir más lejos puede eliminar todo el ahorro por el coste del trayecto.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Vehículo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Con depósito y consumo guardados el análisis es mucho más útil.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
