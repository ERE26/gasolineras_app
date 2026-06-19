"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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
  brands?: string[];
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

const exampleQuestions = [
  "¿Me compensa ir a la más barata?",
  "Compara las marcas que he filtrado",
  "Explícame los resultados del buscador",
  "¿Qué debería mirar antes de repostar?",
];

export default function FuelAssistant() {
  const [context, setContext] = useState<SearchContext | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

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
    context?.areaInfo?.label ||
    context?.area?.label ||
    "sin búsqueda cercana";

  async function askAssistant(customQuestion?: string) {
    const finalQuestion = (customQuestion || question).trim();

    if (!finalQuestion) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: finalQuestion,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/fuel-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: finalQuestion,
          context,
          messages: nextMessages,
        }),
      });

      const data = await response.json();

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.answer || "No he podido generar una respuesta.",
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "No he podido conectar con el asistente. Prueba de nuevo o haz una búsqueda cercana primero.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-blue-600">IA de repostaje</p>
          <h2 className="mt-1 text-3xl font-black">Pregunta sobre tu búsqueda</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Puedes preguntarle sobre ahorro, marcas, distancia, favoritos, vehículos,
            filtros o cómo interpretar la web. Usa tu última búsqueda cercana como contexto.
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
          <p className="text-xs font-black uppercase text-slate-500">Resultados</p>
          <p className="mt-1 font-black">{context?.stations?.length || 0}</p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-500">Mejor precio</p>
          <p className="mt-1 font-black">
            {bestStation ? `${Number(bestStation.price).toFixed(3)} €/L` : "-"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {exampleQuestions.map((item) => (
          <button
            key={item}
            onClick={() => askAssistant(item)}
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 max-h-[420px] space-y-3 overflow-auto rounded-3xl bg-slate-50 p-4">
        {messages.length === 0 && (
          <div className="rounded-3xl bg-white p-5 text-slate-600 shadow-sm">
            Haz una pregunta libre. Por ejemplo: “Estoy en Madrid y he filtrado Repsol y BP,
            ¿cuál elegirías?” o “¿me compensa desviarme 3 km?”.
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "ml-auto max-w-3xl rounded-3xl bg-slate-950 p-4 text-white"
                : "mr-auto max-w-3xl rounded-3xl bg-white p-4 leading-7 text-slate-700 shadow-sm"
            }
          >
            {message.content}
          </div>
        ))}

        {loading && (
          <div className="mr-auto max-w-3xl rounded-3xl bg-white p-4 text-slate-500 shadow-sm">
            Analizando...
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Pregunta lo que quieras sobre gasolineras, ahorro, filtros, ubicación o uso de la web..."
          className="min-h-24 w-full rounded-3xl border border-slate-200 p-4 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />

        <button
          onClick={() => askAssistant()}
          disabled={loading || !question.trim()}
          className="rounded-3xl bg-slate-950 px-7 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </section>
  );
}
