"use client";

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
  captured_at?: string;
  distance_meters?: number;
  schedule?: string;
};

type Vehicle = {
  id: string;
  name: string;
  fuel: string;
  tankLiters: number;
  consumption: number;
};

type Props = {
  station: Station;
  index: number;
  averagePrice: number | null;
  selectedVehicle?: Vehicle;
  isFavorite: boolean;
  onToggleFavorite: (stationId: number) => void;
};

function getFuelLabel(fuel: string) {
  const labels: Record<string, string> = {
    gasolina95: "Gasolina 95",
    gasolina98: "Gasolina 98",
    diesel: "Diésel",
    diesel_premium: "Diésel premium",
    glp: "GLP",
    gnc: "GNC",
    gnl: "GNL",
    hidrogeno: "Hidrógeno",
  };

  return labels[fuel] || fuel;
}

export default function StationCard({
  station,
  index,
  averagePrice,
  selectedVehicle,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const price = Number(station.price);
  const tankLiters = selectedVehicle?.tankLiters ?? 50;
  const consumption = selectedVehicle?.consumption ?? 6;

  const fullTankCost = price * tankLiters;

  const savingVsAverage =
    averagePrice !== null ? (averagePrice - price) * tankLiters : null;

  const distanceKm = station.distance_meters
    ? station.distance_meters / 1000
    : null;

  const roundTripKm = distanceKm !== null ? distanceKm * 2 : null;

  const tripFuelCost =
    roundTripKm !== null ? ((roundTripKm * consumption) / 100) * price : null;

  const netSaving =
    savingVsAverage !== null && tripFuelCost !== null
      ? savingVsAverage - tripFuelCost
      : null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(station.address);
      alert("Dirección copiada.");
    } catch {
      alert(station.address);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-300">#{index + 1}</p>

          <h3 className="mt-1 text-lg font-black">{station.name}</h3>

          <p className="mt-1 text-sm text-slate-300">{station.address}</p>

          <p className="text-sm text-slate-400">
            {station.municipality}, {station.province}
          </p>

          {station.schedule && (
            <p className="mt-1 text-xs text-slate-500">
              Horario: {station.schedule}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-2xl font-black text-emerald-300">
            {price.toFixed(3)} €
          </p>
          <p className="text-xs text-slate-400">por litro</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-slate-950/60 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-slate-400">Combustible</p>
          <p className="font-bold">{getFuelLabel(station.fuel_type)}</p>
        </div>

        <div>
          <p className="text-slate-400">Llenar depósito</p>
          <p className="font-bold text-emerald-300">
            {fullTankCost.toFixed(2)} €
          </p>
        </div>

        {savingVsAverage !== null && (
          <div>
            <p className="text-slate-400">Ahorro vs media mostrada</p>
            <p
              className={
                savingVsAverage >= 0
                  ? "font-bold text-emerald-300"
                  : "font-bold text-red-300"
              }
            >
              {savingVsAverage.toFixed(2)} €
            </p>
          </div>
        )}

        {distanceKm !== null && (
          <div>
            <p className="text-slate-400">Distancia</p>
            <p className="font-bold text-blue-300">
              {distanceKm.toFixed(2)} km
            </p>
          </div>
        )}

        {tripFuelCost !== null && (
          <div>
            <p className="text-slate-400">Coste estimado ida/vuelta</p>
            <p className="font-bold">{tripFuelCost.toFixed(2)} €</p>
          </div>
        )}

        {netSaving !== null && (
          <div>
            <p className="text-slate-400">¿Compensa ir?</p>
            <p
              className={
                netSaving > 0
                  ? "font-bold text-emerald-300"
                  : "font-bold text-red-300"
              }
            >
              {netSaving > 0
                ? `Sí, ahorro neto ${netSaving.toFixed(2)} €`
                : `No compensa: ${netSaving.toFixed(2)} €`}
            </p>
          </div>
        )}
      </div>

      {selectedVehicle && (
        <p className="mt-3 text-xs text-slate-400">
          Cálculo hecho con tu vehículo:{" "}
          <strong className="text-slate-200">{selectedVehicle.name}</strong>,{" "}
          {selectedVehicle.tankLiters} L de depósito y{" "}
          {selectedVehicle.consumption} L/100 km.
        </p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-slate-950 hover:bg-emerald-400"
        >
          Ir
        </a>

        <button
          onClick={copyAddress}
          className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"
        >
          Copiar dirección
        </button>

        <button
          onClick={() => onToggleFavorite(station.id)}
          className={
            isFavorite
              ? "rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-yellow-300"
              : "rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"
          }
        >
          {isFavorite ? "★ Favorita" : "☆ Guardar"}
        </button>
      </div>
    </div>
  );
}