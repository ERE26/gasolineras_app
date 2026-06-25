import Link from "next/link";

export const metadata = {
  title: "Aviso legal | Rivvo",
  description: "Aviso legal de Rivvo.",
};

export default function AvisoLegalPage() {
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
            Aviso legal
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            Última actualización: 25 de junio de 2026
          </p>

          <div className="mt-8 space-y-7 text-slate-700">
            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">1. Titularidad</h2>
              <p className="mt-2">
                Rivvo es una aplicación informativa orientada a comparar precios de carburantes,
                localizar gasolineras y ayudar al usuario a estimar ahorro en repostajes.
              </p>
              <p className="mt-2">
                Titular provisional:RIVVO TEAM
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">2. Naturaleza del servicio</h2>
              <p className="mt-2">
                Rivvo muestra información de precios y estaciones de servicio obtenida de fuentes públicas
                y servicios técnicos externos. La información puede variar, retrasarse o contener errores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">3. Uso responsable</h2>
              <p className="mt-2">
                El usuario debe comprobar siempre el precio final en la estación antes de repostar. Rivvo
                no garantiza que el precio mostrado sea idéntico al precio aplicado en el momento exacto
                de la compra.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">4. Responsabilidad</h2>
              <p className="mt-2">
                Rivvo no se hace responsable de decisiones tomadas exclusivamente con base en la información
                mostrada en la aplicación, ni de incidencias derivadas de datos incompletos, cambios de precio,
                errores de ubicación, interrupciones técnicas o servicios de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">5. Propiedad intelectual</h2>
              <p className="mt-2">
                La marca, diseño, textos y elementos propios de Rivvo pertenecen a sus titulares. No se permite
                copiar, distribuir o explotar el contenido propio sin autorización.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">6. Enlaces externos</h2>
              <p className="mt-2">
                Rivvo puede contener enlaces o integraciones con servicios externos. La responsabilidad sobre
                dichos servicios corresponde a sus respectivos titulares.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">7. Modificaciones</h2>
              <p className="mt-2">
                Rivvo podrá modificar este aviso legal para adaptarlo a cambios técnicos, normativos o de producto.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
