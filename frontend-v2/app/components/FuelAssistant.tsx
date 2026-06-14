"use client";

import { useMemo, useState } from "react";

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

type Vehicle = {
  id: string;
  name: string;
  fuel: string;
  tankLiters: number;
  consumption: number;
};

type Props = {
  stations: Station[];
  selectedVehicle?: Vehicle;
  fuel: string;
  brand: string;
  province: string;
  municipality: string;
};

function fuelLabel(fuel: string) {
  const labels: Record<string, string> = {
    gasolina95: "gasolina 95",
    gasolina98: "gasolina 98",
    diesel: "diésel",
    diesel_premium: "diésel premium",
    glp: "GLP",
    gnc: "GNC",
    gnl: "GNL",
    hidrogeno: "hidrógeno",
  };
  return labels[fuel] || fuel;
}

function buildAnalysis(stations: Station[], vehicle: Vehicle | undefined) {
  if (stations.length === 0) {
    return {
      cheapest: null,
      average: null,
      saving: null,
      distanceText: null,
    };
  }

  const cheapest = stations[0];
  const prices = stations.map((station) => Number(station.price)).filter(Number.isFinite);
  const average = prices.reduce((acc, price) => acc + price, 0) / prices.length;
  const tank = vehicle?.tankLiters ?? 50;
  const saving = (average - Number(cheapest.price)) * tank;
  const distanceText = cheapest.distance_meters
    ? `${(cheapest.distance_meters / 1000).toFixed(2)} km`
    : null;

  return { cheapest, average, saving, distanceText };
}

export default function FuelAssistant({
  stations,
  selectedVehicle,
  fuel,
  brand,
  province,
  municipality,
}: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(
    "Haz una búsqueda y te ayudo a interpretar si merece la pena ir a la gasolinera más barata."
  );

  const analysis = useMemo(
    () => buildAnalysis(stations, selectedVehicle),
    [stations, selectedVehicle]
  );

  function answerQuestion(customQuestion?: string) {
    const q = (customQuestion || question).toLowerCase();

    if (stations.length === 0) {
      setAnswer(
        "Todavía no tengo resultados para analizar. Primero busca por ubicación, provincia o marca y después puedo decirte cuál conviene más."
      );
      return;
    }

    const cheapest = analysis.cheapest!;
    const price = Number(cheapest.price).toFixed(3);
    const saving = analysis.saving ?? 0;
    const location = `${cheapest.municipality}, ${cheapest.province}`;

    if (q.includes("canarias") || q.includes("impuesto") || q.includes("península")) {
      setAnswer(
        "Para comparar bien conviene separar Canarias de Península y Baleares, porque Canarias suele tener precios más bajos por su fiscalidad específica. Por eso en la portada aparecen rankings separados."
      );
      return;
    }

    if (q.includes("marca") || q.includes("repsol") || q.includes("moeve") || q.includes("galp") || q.includes("bp")) {
      setAnswer(
        brand
          ? `Ahora estás filtrando por marca o texto parecido a “${brand}”. Si quieres comparar de forma justa, prueba también la misma búsqueda sin marca y mira cuánto sube o baja el precio medio.`
          : "Puedes escribir una marca en el buscador, por ejemplo Repsol, Moeve, Galp o BP. La app te dará sugerencias sin usar desplegables."
      );
      return;
    }

    if (q.includes("compensa") || q.includes("merece") || q.includes("desvío")) {
      if (!selectedVehicle) {
        setAnswer(
          `La más barata ahora es ${cheapest.name}, en ${location}, a ${price} €/L. Para saber si realmente compensa el desvío, añade tu vehículo con depósito y consumo.`
        );
        return;
      }

      const distancePart = analysis.distanceText ? ` Está a ${analysis.distanceText}.` : "";
      setAnswer(
        `Con tu vehículo ${selectedVehicle.name}, la mejor opción es ${cheapest.name}, en ${location}, a ${price} €/L.${distancePart} Frente a la media de los resultados, llenar el depósito aquí supone aproximadamente ${saving.toFixed(2)} € de diferencia.`
      );
      return;
    }

    if (q.includes("barata") || q.includes("mejor") || q.includes("ranking")) {
      setAnswer(
        `La opción más barata de esta búsqueda es ${cheapest.name}, en ${location}, con ${fuelLabel(fuel)} a ${price} €/L. Si llenas un depósito estándar, el ahorro estimado frente a la media mostrada es de ${saving.toFixed(2)} €.`
      );
      return;
    }

    if (q.includes("zona") || q.includes("provincia") || q.includes("municipio")) {
      const zone = municipality || province || "la zona buscada";
      setAnswer(
        `Para ${zone}, yo miraría primero la diferencia entre la gasolinera más barata y la media. Si la diferencia es pequeña, probablemente compensa más una estación cercana que desviarte demasiado.`
      );
      return;
    }

    setAnswer(
      `Resumen rápido: estás mirando ${fuelLabel(fuel)}${brand ? ` con marca/texto “${brand}”` : ""}. La más barata es ${cheapest.name}, en ${location}, a ${price} €/L. Te recomiendo comparar también por cercanía para ver si el ahorro compensa el desplazamiento.`
    );
  }

  const quickQuestions = [
    "¿Cuál me conviene más?",
    "¿Compensa el desvío?",
    "¿Por qué separas Canarias?",
    "¿Cómo comparo por marca?",
  ];

  return (
    <section className="rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-50 to-emerald-50 p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white">
          🤖
        </div>
        <div>
          <h2 className="text-lg font-black">Asistente IA de repostaje</h2>
          <p className="text-sm text-slate-600">
            Pregúntame por ahorro, marcas, zonas o si merece la pena desplazarse.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickQuestions.map((item) => (
          <button
            key={item}
            onClick={() => {
              setQuestion(item);
              answerQuestion(item);
            }}
            className="rounded-full bg-white px-3 py-2 text-xs font-black text-blue-700 shadow-sm hover:bg-blue-100"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") answerQuestion();
          }}
          placeholder="Ej: ¿me compensa ir a la más barata?"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
        <button
          onClick={() => answerQuestion()}
          className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500"
        >
          Analizar
        </button>
      </div>

      <div className="mt-4 rounded-3xl bg-white/85 p-4 text-sm leading-6 text-slate-700 shadow-sm">
        {answer}
      </div>
    </section>
  );
}
