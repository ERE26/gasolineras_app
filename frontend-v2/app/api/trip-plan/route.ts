export const runtime = "nodejs";

type LatLng = {
  lat: number;
  lon: number;
};

type TripStopInput = {
  label?: string;
  value?: string;
};

type Station = {
  id?: number;
  station_id?: number;
  name?: string;
  brand?: string;
  address?: string;
  province?: string;
  municipality?: string;
  latitude?: number | string;
  longitude?: number | string;
  price?: string | number;
  fuel_type?: string;
  distance_meters?: number;
};

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "";

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMeters(a: LatLng, b: LatLng) {
  const radius = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * radius * Math.asin(Math.sqrt(h));
}

function decodePolyline(encoded: string): LatLng[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      lat: lat / 1e5,
      lon: lng / 1e5,
    });
  }

  return coordinates;
}

function routePointAtPercent(points: LatLng[], percent: number) {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0];

  const clamped = Math.max(0, Math.min(1, percent));
  const totalDistances: number[] = [0];

  for (let i = 1; i < points.length; i++) {
    totalDistances[i] = totalDistances[i - 1] + haversineMeters(points[i - 1], points[i]);
  }

  const total = totalDistances[totalDistances.length - 1];
  const target = total * clamped;

  for (let i = 1; i < totalDistances.length; i++) {
    if (totalDistances[i] >= target) {
      const previous = totalDistances[i - 1];
      const segment = totalDistances[i] - previous;
      const ratio = segment === 0 ? 0 : (target - previous) / segment;

      return {
        lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * ratio,
        lon: points[i - 1].lon + (points[i].lon - points[i - 1].lon) * ratio,
      };
    }
  }

  return points[points.length - 1];
}

function closestRoutePoint(points: LatLng[], target: LatLng) {
  if (points.length === 0) return { point: target, distanceMeters: 0 };

  let best = points[0];
  let bestDistance = haversineMeters(points[0], target);

  for (const point of points) {
    const distance = haversineMeters(point, target);

    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }

  return { point: best, distanceMeters: bestDistance };
}

function parseStopPercent(value: string | undefined, fallbackPercent: number) {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) return fallbackPercent;
  if (normalized.includes("mitad") || normalized.includes("medio")) return 0.5;
  if (normalized.includes("primer tercio") || normalized.includes("1/3")) return 1 / 3;
  if (normalized.includes("segundo tercio") || normalized.includes("2/3")) return 2 / 3;

  const percentMatch = normalized.match(/(\d{1,3})\s*%/);

  if (percentMatch) {
    const percent = Number(percentMatch[1]);

    if (Number.isFinite(percent)) {
      return Math.max(0.05, Math.min(0.95, percent / 100));
    }
  }

  const numberMatch = normalized.match(/^0[,.]\d+$/);

  if (numberMatch) {
    const valueAsNumber = Number(normalized.replace(",", "."));

    if (Number.isFinite(valueAsNumber)) {
      return Math.max(0.05, Math.min(0.95, valueAsNumber));
    }
  }

  return null;
}

async function geocodeAddress(address: string): Promise<{ location: LatLng; formattedAddress: string }> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("region", "es");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok || data.status !== "OK" || !data.results?.[0]) {
    throw new Error(`No he podido localizar: ${address}`);
  }

  const result = data.results[0];

  return {
    formattedAddress: result.formatted_address,
    location: {
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
    },
  };
}

async function computeRoute(origin: LatLng, destination: LatLng) {
  const response = await fetch(
    `https://routes.googleapis.com/directions/v2:computeRoutes?key=${GOOGLE_MAPS_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lon,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lon,
            },
          },
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        computeAlternativeRoutes: false,
        languageCode: "es-ES",
        units: "METRIC",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.routes?.[0]) {
    throw new Error("No he podido calcular la ruta con Google Maps.");
  }

  const route = data.routes[0];

  return {
    distanceMeters: route.distanceMeters || 0,
    duration: route.duration || "",
    encodedPolyline: route.polyline?.encodedPolyline || "",
    points: decodePolyline(route.polyline?.encodedPolyline || ""),
  };
}

async function loadStationsNear(point: LatLng, fuel: string, radiusKm: number, limit = 80) {
  if (!BACKEND_API_URL) {
    throw new Error("Falta NEXT_PUBLIC_API_URL para consultar tu backend de gasolineras.");
  }

  const url = new URL(`${BACKEND_API_URL}/api/nearby`);
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lon));
  url.searchParams.set("fuel", fuel);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("radiusKm", String(radiusKm));

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !Array.isArray(data)) {
    throw new Error("No he podido consultar gasolineras cerca de la parada.");
  }

  return data as Station[];
}

function stationLatLon(station: Station): LatLng | null {
  const lat = Number(station.latitude);
  const lon = Number(station.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { lat, lon };
}

function sortStations(stations: any[], sortBy: string) {
  const copy = [...stations];

  if (sortBy === "distance") {
    return copy.sort(
      (a, b) =>
        Number(a.detourMeters || a.distance_meters || 0) -
        Number(b.detourMeters || b.distance_meters || 0)
    );
  }

  if (sortBy === "balanced") {
    const prices = copy.map((station) => Number(station.price)).filter(Number.isFinite);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxDetour = Math.max(
      ...copy.map((station) => Number(station.detourMeters || station.distance_meters || 0))
    );

    return copy.sort((a, b) => {
      const priceA = Number(a.price);
      const priceB = Number(b.price);
      const distanceA = Number(a.detourMeters || a.distance_meters || 0);
      const distanceB = Number(b.detourMeters || b.distance_meters || 0);

      const priceScoreA = maxPrice === minPrice ? 0 : (priceA - minPrice) / (maxPrice - minPrice);
      const priceScoreB = maxPrice === minPrice ? 0 : (priceB - minPrice) / (maxPrice - minPrice);
      const distanceScoreA = maxDetour === 0 ? 0 : distanceA / maxDetour;
      const distanceScoreB = maxDetour === 0 ? 0 : distanceB / maxDetour;

      return priceScoreA * 0.72 + distanceScoreA * 0.28 - (priceScoreB * 0.72 + distanceScoreB * 0.28);
    });
  }

  return copy.sort((a, b) => Number(a.price) - Number(b.price));
}

function googleMapsDirectionsUrl(origin: LatLng, destination: LatLng, waypoints: LatLng[]) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", `${origin.lat},${origin.lon}`);
  url.searchParams.set("destination", `${destination.lat},${destination.lon}`);
  url.searchParams.set("travelmode", "driving");

  if (waypoints.length > 0) {
    url.searchParams.set(
      "waypoints",
      waypoints.map((point) => `${point.lat},${point.lon}`).join("|")
    );
  }

  return url.toString();
}

function humanDuration(duration: string) {
  const seconds = Number(String(duration || "").replace("s", ""));

  if (!Number.isFinite(seconds) || seconds <= 0) return "-";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours <= 0) return `${minutes} min`;

  return `${hours} h ${minutes} min`;
}

export async function POST(request: Request) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return Response.json(
        {
          error:
            "Falta GOOGLE_MAPS_API_KEY. Añádela en Vercel para poder calcular rutas.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const fuel = body?.fuel || "gasolina95";
    const sortBy = body?.sortBy || "price";
    const radiusKm = Math.min(5, Math.max(1, Number(body?.maxDetourKm || 5)));
    const originInput = body?.origin || {};
    const destinationInput = body?.destination || {};
    const stopInputs: TripStopInput[] = Array.isArray(body?.stops) ? body.stops : [];

    let originLocation: LatLng;
    let originLabel = "Mi ubicación";

    if (originInput?.lat && originInput?.lon) {
      originLocation = {
        lat: Number(originInput.lat),
        lon: Number(originInput.lon),
      };
      originLabel = originInput.label || "Mi ubicación actual";
    } else if (originInput?.address) {
      const geocoded = await geocodeAddress(String(originInput.address));
      originLocation = geocoded.location;
      originLabel = geocoded.formattedAddress;
    } else {
      return Response.json({ error: "Indica origen o usa tu ubicación actual." }, { status: 400 });
    }

    if (!destinationInput?.address) {
      return Response.json({ error: "Indica el destino del viaje." }, { status: 400 });
    }

    const destinationGeocoded = await geocodeAddress(String(destinationInput.address));
    const destinationLocation = destinationGeocoded.location;
    const destinationLabel = destinationGeocoded.formattedAddress;

    const route = await computeRoute(originLocation, destinationLocation);

    if (route.points.length === 0) {
      return Response.json({ error: "Google no ha devuelto puntos de ruta." }, { status: 400 });
    }

    const normalizedStops =
      stopInputs.length > 0
        ? stopInputs.slice(0, 4)
        : [{ label: "Parada 1", value: "mitad" }];

    const analyzedStops = [];

    for (let index = 0; index < normalizedStops.length; index++) {
      const stop = normalizedStops[index];
      const fallbackPercent = (index + 1) / (normalizedStops.length + 1);
      const parsedPercent = parseStopPercent(stop.value, fallbackPercent);

      let stopPoint: LatLng | null = null;
      let stopLabel = stop.value?.trim() || `Parada ${index + 1}`;
      let routeDistanceFromTypedPlace = 0;

      if (parsedPercent !== null) {
        stopPoint = routePointAtPercent(route.points, parsedPercent);
        stopLabel =
          stop.value?.trim() ||
          `Parada ${(parsedPercent * 100).toFixed(0)}% de la ruta`;
      } else if (stop.value?.trim()) {
        const geocodedStop = await geocodeAddress(stop.value.trim());
        const closest = closestRoutePoint(route.points, geocodedStop.location);
        stopPoint = closest.point;
        routeDistanceFromTypedPlace = closest.distanceMeters;
        stopLabel = geocodedStop.formattedAddress;
      }

      if (!stopPoint) continue;

      const rawStations = await loadStationsNear(stopPoint, fuel, radiusKm, 100);

      const candidates = rawStations
        .map((station) => {
          const location = stationLatLon(station);
          const detourMeters = location ? haversineMeters(stopPoint!, location) : station.distance_meters;

          return {
            ...station,
            detourMeters,
            stopDistanceMeters: detourMeters,
          };
        })
        .filter((station) => {
          const price = Number(station.price);
          const detourMeters = Number(station.detourMeters);

          return Number.isFinite(price) && Number.isFinite(detourMeters) && detourMeters <= radiusKm * 1000;
        });

      const sorted = sortStations(candidates, sortBy).slice(0, 6);
      const best = sorted[0] || null;

      analyzedStops.push({
        id: `stop-${index + 1}`,
        label: stopLabel,
        input: stop.value || "",
        point: stopPoint,
        radiusKm,
        distanceFromTypedPlaceMeters: routeDistanceFromTypedPlace,
        stations: sorted,
        best,
      });
    }

    const bestWaypoints = analyzedStops
      .map((stop) => stationLatLon(stop.best || {}))
      .filter(Boolean) as LatLng[];

    return Response.json({
      origin: {
        label: originLabel,
        location: originLocation,
      },
      destination: {
        label: destinationLabel,
        location: destinationLocation,
      },
      route: {
        distanceMeters: route.distanceMeters,
        duration: humanDuration(route.duration),
      },
      fuel,
      sortBy,
      maxDetourKm: radiusKm,
      stops: analyzedStops,
      googleMapsUrl: googleMapsDirectionsUrl(originLocation, destinationLocation, bestWaypoints),
    });
  } catch (error: any) {
    console.error("Trip plan error:", error);

    return Response.json(
      {
        error: error?.message || "No he podido planificar el viaje.",
      },
      { status: 500 }
    );
  }
}
