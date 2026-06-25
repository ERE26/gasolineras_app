import Link from "next/link";

export const metadata = {
  title: "Política de privacidad | Rivvo",
  description: "Política de privacidad de Rivvo.",
};

export default function PrivacidadPage() {
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
            Política de privacidad
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            Última actualización: 25 de junio de 2026
          </p>

          <div className="mt-8 space-y-7 text-slate-700">
            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">1. Responsable</h2>
              <p className="mt-2">
                Rivvo es una aplicación para comparar precios de carburantes, encontrar gasolineras cercanas,
                guardar vehículos y gestionar estaciones favoritas. Esta política explica qué datos se tratan
                y con qué finalidad.
              </p>
              <p className="mt-2">
                Responsable provisional:RIVVO TEAM
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">2. Datos que puede tratar Rivvo</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Email y datos de cuenta cuando el usuario inicia sesión.</li>
                <li>Ubicación aproximada o precisa si el usuario acepta el permiso del navegador o del dispositivo.</li>
                <li>Vehículos guardados por el usuario, como consumo, tipo de combustible, depósito, marca o modelo.</li>
                <li>Gasolineras favoritas guardadas por el usuario.</li>
                <li>Datos técnicos básicos necesarios para el funcionamiento de la aplicación.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">3. Finalidades</h2>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Mostrar gasolineras cercanas y calcular distancias aproximadas.</li>
                <li>Comparar precios de carburantes y estimar ahorro.</li>
                <li>Guardar vehículos y favoritas en la cuenta del usuario.</li>
                <li>Mejorar la experiencia de búsqueda, planificación de viaje y análisis de repostaje.</li>
                <li>Mantener la seguridad y el correcto funcionamiento de Rivvo.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">4. Uso de ubicación</h2>
              <p className="mt-2">
                Rivvo solo accede a la ubicación si el usuario concede permiso. La ubicación se usa para
                mostrar gasolineras cercanas, ordenar resultados por distancia y ayudar en la planificación
                de rutas. El usuario puede retirar el permiso desde los ajustes del navegador o del dispositivo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">5. Base jurídica</h2>
              <p className="mt-2">
                El tratamiento se basa en el consentimiento del usuario, la ejecución del servicio solicitado
                y el interés legítimo de mantener la aplicación segura y funcional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">6. Proveedores</h2>
              <p className="mt-2">
                Rivvo puede apoyarse en servicios externos para autenticación, base de datos, mapas,
                despliegue y analítica técnica. Estos proveedores solo deben tratar los datos necesarios
                para prestar el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">7. Conservación</h2>
              <p className="mt-2">
                Los datos de cuenta, vehículos y favoritas se conservarán mientras el usuario mantenga su
                cuenta o hasta que solicite su eliminación. Los datos técnicos se conservarán durante el
                tiempo necesario para seguridad, mantenimiento y cumplimiento legal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">8. Derechos del usuario</h2>
              <p className="mt-2">
                El usuario puede solicitar acceso, rectificación, eliminación, oposición, limitación del
                tratamiento y portabilidad de sus datos escribiendo al email de contacto.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0B132B]">9. Cambios</h2>
              <p className="mt-2">
                Esta política podrá actualizarse para adaptarse a cambios técnicos, legales o de producto.
                La fecha de actualización indicará la versión vigente.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
