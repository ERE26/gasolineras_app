"use client";

import { useEffect, useMemo, useState } from "react";

type Station = {
  id: number;
  name: string;
  brand: string;
  municipality: string;
  province: string;
  price: string;
  distance_meters?: number;
};

type SearchContext = {
  fuel?: string;
  areaInfo?: {
    municipality?: string;
    chosenRadiusKm?: number;
    reason?: string;
  } | null;
  referencePrice?: number | null;
  stations?: Station[];
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
    if (!context?.stations?.length) return null;
    return context.stations[0];
  }, [context]);

  function buildAnswer(kind?: string) {
    if (!context || !bestStation) {
      setAnswer(
        "Todavía no tengo una búsqueda cercana sobre la que analizar. Ve al buscador, usa tu ubicación o escribe una dirección y después vuelve aquí. Así evitaré recomendarte una gasolinera lejana."
      );
      return;
    }

    const radius = context.areaInfo?.chosenRadiusKm;
    const area = context.areaInfo?.municipality || "tu zona";
    const price = Number(bestStation.price);
    const reference = context.referencePrice;
    const distanceText = bestStation.distance_meters
      ? `${(bestStation.distance_meters / 1000).toFixed(2)} km`
      : "distancia no calculada";

    let text = `Estoy analizando solo opciones razonables para ${area}`;
    if (radius) text += `, con un radio de ${radius} km`;
    text += `. No tiene sentido mandarte a otra ciudad solo porque el precio sea menor. `;

    if (kind === "radius") {
      text += "El criterio de radio evita comparaciones injustas: en una zona urbana se empieza por 1 km; si hay pocas estaciones, se amplía a 5 km. En afueras se usa 5 km directamente.";
      setAnswer(text);
      return;
    }

    text += `La mejor opción de tu última búsqueda es ${bestStation.name}, en ${bestStation.municipality}, a ${price.toFixed(3)} €/L y a ${distanceText}.`;

    if (reference) {
      const diff = reference - price;
      text += ` La referencia media de la zona está alrededor de ${reference.toFixed(3)} €/L, así que esta estación mejora la referencia en ${diff.toFixed(3)} €/L.`;
      text += diff > 0 ? " Puede compensar si no te obliga a desviarte demasiado." : " No parece una gran oportunidad frente a la media local.";
    }

    if (kind === "brand" || question.toLowerCase().includes("marca")) {
      const brands = Array.from(new Set((context.stations || []).map((station) => station.brand).filter(Boolean))).slice(0, 6);
      text += ` En tu búsqueda aparecen estas marcas: ${brands.join(", ") || "no hay marcas suficientes"}. Compara siempre marca, precio y distancia.`;
    }

    setAnswer(text);
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-black text-blue-600">Analizador inteligente</p>
      <h2 className="mt-1 text-3xl font-black">Asistente de repostaje</h2>
      <p className="mt-3 leading-7 text-slate-600">
        Usa tu última búsqueda y tu zona para evitar recomendaciones absurdas. Si estás
        en Madrid, no te mandará a Zaragoza solo porque una estación sea más barata.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <button onClick={() => buildAnswer("best")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
          Mejor opción cercana
        </button>
        <button onClick={() => buildAnswer("compare")} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-400">
          ¿Compensa?
        </button>
        <button onClick={() => buildAnswer("radius")} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500">
          Explicar radio
        </button>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-black">Pregunta al asistente</label>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ej: ¿me compensa ir a la más barata?, ¿qué marca sale mejor?, ¿por qué usa 1 km o 5 km?"
          className="min-h-28 w-full rounded-3xl border border-slate-200 p-4 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
        <button onClick={() => buildAnswer()} className="mt-3 rounded-2xl bg-purple-600 px-5 py-3 font-black text-white hover:bg-purple-500">
          Analizar
        </button>
      </div>

      {answer && <div className="mt-5 rounded-3xl bg-slate-50 p-5 leading-7 text-slate-700">{answer}</div>}
    </section>
  );
}
