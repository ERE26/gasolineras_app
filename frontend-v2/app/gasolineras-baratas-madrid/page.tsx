
import type { Metadata } from "next";
import Link from "next/link";
import TopNav from "../components/TopNav";

export const metadata: Metadata = {
  title: "Gasolineras baratas en Madrid | Rivvo",
  description: "Encuentra gasolineras baratas en Madrid, compara gasolina 95, gasolina 98 y diésel, y busca estaciones cercanas con Rivvo.",
  alternates: {
    canonical: "https://rivvo.cloud/gasolineras-baratas-madridgasolineras-baratas-madrid",
  },
};

export default function SeoPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="bg-[#0B132B] text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#14B8A6]">Rivvo guías</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Gasolineras baratas en Madrid</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/75">
              Madrid tiene mucha diferencia de precios entre estaciones, incluso dentro de la misma zona. Con Rivvo puedes comparar gasolineras cercanas, filtrar por combustible y decidir si merece la pena desplazarte unos minutos para repostar más barato.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buscar"
                className="rounded-2xl bg-[#14B8A6] px-6 py-4 text-center font-black text-[#07111f] shadow-lg shadow-black/20 hover:bg-[#2dd4bf]"
              >
                Buscar gasolineras cerca de mí
              </Link>
              <Link
                href="/planificar-viaje"
                className="rounded-2xl bg-white/10 px-6 py-4 text-center font-black text-white ring-1 ring-white/15 hover:bg-white/15"
              >
                Planificar viaje
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/15">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">Qué puedes hacer</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-lg font-black">Comparar precios</p>
                <p className="mt-1 text-sm font-semibold text-white/70">Filtra por combustible, marca y ubicación.</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-lg font-black">Buscar cerca de ti</p>
                <p className="mt-1 text-sm font-semibold text-white/70">Encuentra estaciones cercanas y recomendadas.</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">Zona</p>
                <p className="mt-1 text-2xl font-black">Madrid</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Cómo encontrar gasolina barata en Madrid</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                Usa el buscador de Rivvo, permite la ubicación o escribe una zona concreta de Madrid. Después elige el combustible y compara por precio, distancia y marca.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Qué combustibles puedes comparar</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                Puedes comparar gasolina 95, gasolina 98, diésel, diésel premium y otros combustibles disponibles según los datos oficiales.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Cuándo merece la pena desviarse</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                No siempre gana la gasolinera más barata: también importa la distancia. Rivvo te ayuda a ver si el ahorro compensa el desplazamiento.
              </p>
            </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Busca precios actualizados con Rivvo</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
            Rivvo usa datos de precios de carburantes para ayudarte a comparar estaciones. La información puede cambiar, así que antes de repostar revisa siempre el precio mostrado por la gasolinera.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/buscar"
              className="rounded-2xl bg-[#0B132B] px-6 py-4 text-center font-black text-white hover:opacity-90"
            >
              Abrir buscador
            </Link>
            <Link
              href="/"
              className="rounded-2xl bg-slate-100 px-6 py-4 text-center font-black text-slate-800 hover:bg-slate-200"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
