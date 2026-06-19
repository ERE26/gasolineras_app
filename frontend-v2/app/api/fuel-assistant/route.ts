export const runtime = "nodejs";

type Station = {
  name?: string;
  brand?: string;
  address?: string;
  municipality?: string;
  province?: string;
  price?: string;
  fuel_type?: string;
  distance_meters?: number;
};

function getOutputText(data: any) {
  if (typeof data?.output_text === "string") return data.output_text;

  const parts: string[] = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function buildFallbackAnswer(question: string, context: any) {
  const stations: Station[] = Array.isArray(context?.stations) ? context.stations : [];
  const best = stations[0];
  const area =
    context?.areaInfo?.municipality ||
    context?.areaInfo?.label ||
    context?.area?.municipality ||
    context?.area?.label ||
    "tu zona";

  if (!best) {
    return "Todavía no tengo una búsqueda cercana para analizar. Ve a Buscar, usa tu ubicación o introduce una dirección, y después vuelve a Análisis. Así podré responder con datos reales de tu zona.";
  }

  const price = Number(best.price);
  const distance = best.distance_meters
    ? `${(best.distance_meters / 1000).toFixed(2)} km`
    : "distancia no calculada";

  const lower = question.toLowerCase();

  if (lower.includes("marca")) {
    const brands = Array.from(
      new Set(stations.map((station) => station.brand).filter(Boolean))
    ).slice(0, 8);

    return `En tu última búsqueda en ${area}, las marcas que aparecen son: ${brands.join(", ") || "no hay marcas suficientes"}. Para decidir, no miraría solo la marca: compararía precio, distancia y si te pilla de camino.`;
  }

  if (lower.includes("compensa") || lower.includes("ahorro")) {
    const reference = Number(context?.referencePrice);

    if (Number.isFinite(reference)) {
      const diff = reference - price;

      return `En ${area}, la mejor opción cercana que tengo es ${best.name}, a ${Number.isFinite(price) ? price.toFixed(3) : best.price} €/L y a ${distance}. La referencia local está alrededor de ${reference.toFixed(3)} €/L, así que mejora la referencia en ${diff.toFixed(3)} €/L. Si no tienes que desviarte mucho, puede compensar; si te obliga a hacer varios kilómetros extra, el ahorro puede desaparecer.`;
    }

    return `En ${area}, la mejor opción cercana que tengo es ${best.name}, a ${best.price} €/L y a ${distance}. Sin referencia local suficiente, miraría sobre todo distancia, horario y si te pilla de paso.`;
  }

  return `Con los datos de tu última búsqueda en ${area}, la opción más interesante ahora es ${best.name}, ${best.brand || "marca no indicada"}, a ${best.price} €/L y a ${distance}. Puedo ayudarte a comparar marcas, valorar si compensa desviarte, explicar el radio usado o interpretar los resultados del buscador.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();
    const context = body?.context || {};
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-8) : [];

    if (!question) {
      return Response.json({ answer: "Escribe una pregunta para poder ayudarte." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        answer: buildFallbackAnswer(question, context),
        fallback: true,
      });
    }

    const instructions = `
Eres el asistente IA de una web de gasolineras en España.
Tu misión es ayudar al usuario a usar la web y decidir dónde repostar.
Responde siempre en español, de forma clara, práctica y breve.

Reglas:
- No recomiendes gasolineras lejanas si la pregunta depende de ubicación.
- Usa siempre el contexto de la última búsqueda cercana cuando exista.
- Si no hay contexto, pide al usuario que haga una búsqueda por ubicación en /buscar.
- Puedes responder sobre: precios, ahorro, distancia, marcas, filtros, favoritos, vehículos, cómo usar la web y cómo interpretar resultados.
- No des asesoramiento fuera del tema de la web.
- No inventes precios ni estaciones que no estén en el contexto.
- Si hay marcas filtradas, compara solo dentro de esas marcas.
- Explica cuándo el precio barato no compensa por distancia.
`;

    const input = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Contexto de la app:\n${JSON.stringify(context, null, 2)}\n\nHistorial reciente:\n${JSON.stringify(messages, null, 2)}\n\nPregunta del usuario:\n${question}`,
          },
        ],
      },
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        instructions,
        input,
        max_output_tokens: 650,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return Response.json({
        answer: buildFallbackAnswer(question, context),
        fallback: true,
      });
    }

    return Response.json({
      answer: getOutputText(data) || buildFallbackAnswer(question, context),
    });
  } catch (error) {
    console.error("Assistant route error:", error);

    return Response.json(
      {
        answer:
          "Ha habido un problema respondiendo. Prueba a hacer una búsqueda cercana primero y vuelve a intentarlo.",
      },
      { status: 500 }
    );
  }
}
