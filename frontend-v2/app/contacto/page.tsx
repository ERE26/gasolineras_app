import Link from "next/link";

export const metadata = {
  title: "Contacto | Rivvo",
  description: "Contacto de Rivvo.",
};

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-[#F7FAFC] text-[#0B132B]">
      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Link href="/" className="text-sm font-semibold text-[#14B8A6] hover:underline">
          ← Volver a Rivvo
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#14B8A6]">
            Rivvo
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Contacto
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Para dudas, incidencias, solicitudes sobre datos personales o propuestas de mejora,
            puedes contactar con Rivvo por email.
          </p>

          <div className="mt-8 rounded-3xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0B132B]/60">
              Email de contacto
            </p>
            <a
              href="mailto:eduardorodriguezesteban.afz@gmail.com"
              className="mt-2 block break-words text-xl font-black text-[#2563EB] hover:underline"
            >
              eduardorodriguezesteban.afz@gmail.com
            </a>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold">Soporte</h2>
              <p className="mt-2 text-sm text-slate-600">
                Errores de búsqueda, ubicación, favoritos o vehículos.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold">Privacidad</h2>
              <p className="mt-2 text-sm text-slate-600">
                Solicitudes de acceso, eliminación o modificación de datos.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold">Colaboraciones</h2>
              <p className="mt-2 text-sm text-slate-600">
                Propuestas de producto, datos o acuerdos comerciales.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/privacidad"
              className="rounded-full bg-[#0B132B] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Ver privacidad
            </Link>
            <Link
              href="/aviso-legal"
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-[#0B132B] hover:bg-slate-50"
            >
              Ver aviso legal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
