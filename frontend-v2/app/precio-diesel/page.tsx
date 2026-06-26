
import type { Metadata } from "next";
import Link from "next/link";
import TopNav from "../components/TopNav";

export const metadata: Metadata = {
  title: "Precio diésel hoy | Rivvo",
  description: "Compara precios de diésel en España y encuentra gasolineras baratas cerca de ti con Rivvo.",
  alternates: {
    canonical: "https://rivvo.cloud/precio-dieselprecio-diesel",
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
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Precio diésel hoy</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/75">
              El precio del diésel puede cambiar mucho entre gasolineras cercanas. Con Rivvo puedes comparar estaciones, ver opciones cercanas y decidir dónde repostar para ahorrar.
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
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Diésel normal y diésel premium</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                Rivvo te permite buscar diésel normal y, cuando esté disponible, diésel premium. Así puedes comparar lo que realmente necesitas.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Buscar diésel cerca de mí</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                Usa la ubicación o escribe una zona. Después selecciona Diésel y revisa las estaciones recomendadas.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Ahorro real en cada depósito</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                Si repostarás muchos litros, pequeñas diferencias de precio pueden tener un impacto claro en el coste total.
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
