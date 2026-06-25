import Link from "next/link";

export const metadata = {
  title: "Primeros pasos | Rivvo",
  description: "Configura Rivvo para ahorrar en cada repostaje.",
};

const steps = [
  {
    number: "01",
    title: "Permite tu ubicación",
    text: "Así Rivvo puede mostrarte gasolineras cercanas y ordenar resultados por distancia.",
    href: "/buscar",
    action: "Buscar cerca de mí",
  },
  {
    number: "02",
    title: "Añade tu vehículo",
    text: "Guarda consumo, combustible y depósito para calcular mejor el ahorro real.",
    href: "/mis-vehiculos",
    action: "Añadir vehículo",
  },
  {
    number: "03",
    title: "Guarda favoritas",
    text: "Marca tus estaciones habituales para encontrarlas rápido y comparar precios.",
    href: "/favoritas",
    action: "Ver favoritas",
  },
  {
    number: "04",
    title: "Planifica tus viajes",
    text: "Calcula paradas, compara rutas y decide dónde repostar antes de salir.",
    href: "/planificar-viaje",
    action: "Planificar viaje",
  },
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F7FAFC] text-[#0B132B]">
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-sm font-black tracking-tight text-[#0B132B]">
            Rivvo
          </Link>
          <Link
            href="/buscar"
            className="rounded-full bg-[#14B8A6] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
          >
            Saltar
          </Link>
        </nav>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#14B8A6]">
              Primeros pasos
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
              Configura Rivvo en menos de un minuto
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Activa ubicación, guarda tu vehículo y empieza a comparar gasolineras
              con datos útiles para ahorrar de verdad.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buscar"
                className="rounded-full bg-[#0B132B] px-6 py-4 text-center text-sm font-black text-white shadow-sm hover:opacity-90"
              >
                Empezar a buscar
              </Link>
              <Link
                href="/mis-vehiculos"
                className="rounded-full border border-slate-300 bg-white px-6 py-4 text-center text-sm font-black text-[#0B132B] shadow-sm hover:bg-slate-50"
              >
                Añadir mi vehículo
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-[#0B132B] to-[#123052] p-6 text-white">
              <p className="text-sm font-bold text-[#BDEFE8]">Tu copiloto de repostaje</p>
              <h2 className="mt-3 text-3xl font-black">Ahorra en cada parada</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Rivvo combina precio, distancia, vehículo y ruta para ayudarte a decidir
                dónde repostar.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-2xl font-black">95</p>
                  <p className="text-xs text-white/70">Gasolina</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-2xl font-black">B7</p>
                  <p className="text-xs text-white/70">Diésel</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-2xl font-black">€</p>
                  <p className="text-xs text-white/70">Ahorro</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-black text-[#14B8A6]">{step.number}</p>
              <h2 className="mt-3 text-xl font-black">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
              <Link
                href={step.href}
                className="mt-5 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50"
              >
                {step.action}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-6">
          <h2 className="text-xl font-black">Consejo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Para que Rivvo calcule mejor el ahorro, añade al menos un vehículo y permite
            ubicación cuando busques gasolineras cercanas.
          </p>
        </div>
      </section>
    </main>
  );
}
