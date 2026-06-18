"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  distance_meters?: number;
};

type SearchContext = {
  fuel?: string;
  brand?: string;
  area?: {
    label?: string;
    municipality?: string;
    isMajorCity?: boolean;
  };
  areaInfo?: {
    label?: string;
    municipality?: string;
    chosenRadiusKm?: number;
    reason?: string;
  } | null;
  userLocation?: {
    lat: number;
    lon: number;
  } | null;
  referencePrice?: number | null;
  stations?: Station[];
  updatedAt?: string;
};

export default function FuelAssistant() {
  const [context, setContext] = useState<SearchContext | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("lastFuelSearchContext");
    if (!saved) return;

    try {
      setContext(JSON.parse(saved));
    } catch {
      setContext(null);
    }
  }, []);

  const bestStation = useMemo(() => {
    if (!context?.stations || context.stations.length === 0) return null;
    return context.stations[0];
  }, [context]);

  const contextLabel =
    context?.areaInfo?.municipality ||
    context?.area?.municipality ||
    context?.area?.label ||
    "sin búsqueda cercana";

  function buildAnswer(kind?: string) {
    if (!context || !bestStation) {
      setAnswer(
        "Todavía no tengo una búsqueda cercana para analizar. Ve a Buscar, permite ubicación o escribe una dirección cercana, y después vuelve aquí. Así el análisis se hará sobre tu zona real, no sobre gasolineras lejanas."
      );
      return;
    }

    const radius = context.areaInfo?.chosenRadiusKm;
    const area = contextLabel;
    const price = Number(bestStation.price);
    const reference = context.referencePrice;

    const distanceText = bestStation.distance_meters
      ? `${(bestStation.distance_meters / 1000).toFixed(2)} km`
      : "distancia no calculada";

    let response = `Estoy usando tu última búsqueda en ${area}`;
    if (radius) response += ` con radio de ${radius} km`;
    response += `. La recomendación se limita a esa zona para evitar mandarte a otra ciudad sin sentido. `;

    if (kind === "best" || !kind) {
      response += `La opción más barata encontrada es ${bestStation.name}, en ${bestStation.municipality}, a ${price.toFixed(3)} €/L y a ${distanceText}. `;
    }

    if (kind === "compare" || question.toLowerCase().includes("compensa")) {
      if (reference) {
        const diff = reference - price;
        response += `La referencia local está en torno a ${reference.toFixed(3)} €/L, por lo que la diferencia es de ${diff.toFixed(3)} €/L. `;
        response += diff > 0
          ? "Puede compensar si no te obliga a desviarte demasiado."
          : "No parece una gran ventaja frente al precio medio local.";
      } else {
        response += "No hay referencia local suficiente, así que usaría precio, distancia y horario como criterios principales.";
      }
    }

    if (kind === "radius") {
      response += "El radio se ajusta así: en ciudad densa se empieza por 1 km; si aparecen pocas estaciones se amplía a 5 km. En afueras se usa 5 km directamente.";
    }

    if (kind === "brand" || question.toLowerCase().includes("marca")) {
      const brands = Array.from(
        new Set((context.stations || []).map((station) => station.brand).filter(Boolean))
      ).slice(0, 6);

      response += ` En tu búsqueda aparecen estas marcas: ${brands.join(", ") || "no hay suficientes marcas"}. No elegiría solo por marca: miraría precio, distancia y si está de camino.`;
    }

    setAnswer(response);
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-blue-600">IA de repostaje</p>
          <h2 className="mt-1 text-3xl font-black">Analiza tu última búsqueda cercana</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            El asistente usa ubicación, radio, precio de referencia y resultados cercanos.
            No compara Madrid con Zaragoza ni Canarias con Península si no corresponde.
          </p>
        </div>

        <Link
          href="/buscar"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-center font-black text-white hover:bg-slate-800"
        >
          Actualizar búsqueda
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-500">Zona</p>
          <p className="mt-1 font-black">{contextLabel}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-500">Radio</p>
          <p className="mt-1 font-black">
            {context?.areaInfo?.chosenRadiusKm ? `${context.areaInfo.chosenRadiusKm} km` : "-"}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-500">Mejor precio</p>
          <p className="mt-1 font-black">
            {bestStation ? `${Number(bestStation.price).toFixed(3)} €/L` : "-"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <button
          onClick={() => buildAnswer("best")}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
        >
          Mejor cercana
        </button>
        <button
          onClick={() => buildAnswer("compare")}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-400"
        >
          ¿Compensa?
        </button>
        <button
          onClick={() => buildAnswer("brand")}
          className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white hover:bg-purple-500"
        >
          Comparar marcas
        </button>
        <button
          onClick={() => buildAnswer("radius")}
          className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500"
        >
          Explicar radio
        </button>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-black">
          Pregunta al asistente
        </label>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ej: ¿me compensa ir a la más barata?, ¿qué marca sale mejor en mi zona?"
          className="min-h-28 w-full rounded-3xl border border-slate-200 p-4 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
        <button
          onClick={() => buildAnswer()}
          className="mt-3 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800"
        >
          Analizar
        </button>
      </div>

      {answer && (
        <div className="mt-5 rounded-3xl bg-blue-50 p-5 leading-7 text-blue-950">
          {answer}
        </div>
      )}
    </section>
  );
}
