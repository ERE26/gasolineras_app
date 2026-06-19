export const runtime = "nodejs";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export async function GET(request: Request) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return Response.json(
        { error: "Falta GOOGLE_MAPS_API_KEY." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("q") || "").trim();

    if (query.length < 3) {
      return Response.json({ suggestions: [] });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query);
    url.searchParams.set("region", "es");
    url.searchParams.set("language", "es");
    url.searchParams.set("components", "country:ES");
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || data.status === "REQUEST_DENIED") {
      return Response.json(
        {
          error: data.error_message || "Google no ha permitido buscar direcciones.",
        },
        { status: 500 }
      );
    }

    const suggestions = (data.results || []).slice(0, 6).map((result: any) => ({
      label: result.formatted_address,
      lat: result.geometry?.location?.lat,
      lon: result.geometry?.location?.lng,
      placeId: result.place_id,
    }));

    return Response.json({ suggestions });
  } catch (error: any) {
    console.error("Address suggest error:", error);

    return Response.json(
      { error: error?.message || "No he podido buscar direcciones." },
      { status: 500 }
    );
  }
}
