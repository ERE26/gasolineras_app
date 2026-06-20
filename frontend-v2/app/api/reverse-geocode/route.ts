import { NextResponse } from "next/server";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResult = {
  formatted_address: string;
  address_components?: GoogleAddressComponent[];
};

function getComponent(components: GoogleAddressComponent[] | undefined, type: string) {
  return components?.find((component) => component.types.includes(type))?.long_name || "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (!key) {
    return NextResponse.json({
      label: "Tu ubicación actual",
      shortLabel: "Tu ubicación actual",
      municipality: "",
      province: "",
    });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lon}`);
  url.searchParams.set("language", "es");
  url.searchParams.set("region", "es");
  url.searchParams.set("key", key);

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 * 10 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Reverse geocoding failed" }, { status: 502 });
  }

  const data = await response.json();
  const first = data.results?.[0] as GoogleGeocodeResult | undefined;

  if (!first) {
    return NextResponse.json({
      label: "Tu ubicación actual",
      shortLabel: "Tu ubicación actual",
      municipality: "",
      province: "",
    });
  }

  const components = first.address_components;
  const locality =
    getComponent(components, "locality") ||
    getComponent(components, "postal_town") ||
    getComponent(components, "administrative_area_level_3");
  const province = getComponent(components, "administrative_area_level_2");

  const shortLabel =
    locality && province && locality !== province
      ? `Tu ubicación actual · ${locality}, ${province}`
      : locality
        ? `Tu ubicación actual · ${locality}`
        : "Tu ubicación actual";

  return NextResponse.json({
    label: first.formatted_address || shortLabel,
    shortLabel,
    municipality: locality,
    province,
  });
}
