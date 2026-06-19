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
  onToggleFavorite: (station: Station) => void;
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

export default function StationCard({ station, index, averagePrice, selectedVehicle, isFavorite, onToggleFavorite }: Props) {
  const price = Number(station.price);
  const fullTankCost = selectedVehicle ? price * selectedVehicle.tankLiters : null;
  const savingVsAverage = selectedVehicle && averagePrice !== null ? (averagePrice - price) * selectedVehicle.tankLiters : null;
  const distanceKm = station.distance_meters ? station.distance_meters / 1000 : null;
  const roundTripKm = distanceKm !== null ? distanceKm * 2 : null;
  const tripFuelCost = selectedVehicle && roundTripKm !== null ? ((roundTripKm * selectedVehicle.consumption) / 100) * price : null;
  const netSaving = savingVsAverage !== null && tripFuelCost !== null ? savingVsAverage - tripFuelCost : null;
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
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">#{index + 1} por precio</div>
          <h3 className="mt-3 text-xl font-black text-slate-950">{station.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">{station.brand || "Marca no indicada"}</p>
          <p className="mt-2 text-sm text-slate-500">{station.address}</p>
          <p className="text-sm text-slate-500">{station.municipality}, {station.province}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 px-4 py-3 text-right text-white shadow-lg">
          <p className="text-2xl font-black">{price.toFixed(3)} €</p>
          <p className="text-xs font-bold opacity-90">por litro</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-3xl bg-slate-50 p-4 text-sm md:grid-cols-2">
        <div><p className="text-slate-500">Combustible</p><p className="font-black text-slate-900">{getFuelLabel(station.fuel_type)}</p></div>
        {distanceKm !== null && <div><p className="text-slate-500">Distancia</p><p className="font-black text-blue-700">{distanceKm.toFixed(2)} km</p></div>}
        {selectedVehicle && fullTankCost !== null && <div><p className="text-slate-500">Llenar depósito</p><p className="font-black text-emerald-700">{fullTankCost.toFixed(2)} €</p></div>}
        {savingVsAverage !== null && <div><p className="text-slate-500">Ahorro vs referencia local</p><p className={savingVsAverage >= 0 ? "font-black text-emerald-700" : "font-black text-red-600"}>{savingVsAverage.toFixed(2)} €</p></div>}
        {tripFuelCost !== null && <div><p className="text-slate-500">Coste ida/vuelta</p><p className="font-black text-slate-900">{tripFuelCost.toFixed(2)} €</p></div>}
        {netSaving !== null && <div><p className="text-slate-500">¿Compensa ir?</p><p className={netSaving > 0 ? "font-black text-emerald-700" : "font-black text-red-600"}>{netSaving > 0 ? `Sí, ahorro neto ${netSaving.toFixed(2)} €` : `No compensa: ${netSaving.toFixed(2)} €`}</p></div>}
      </div>

      {selectedVehicle ? <p className="mt-3 text-xs text-slate-500">Cálculo con {selectedVehicle.name}: {selectedVehicle.tankLiters} L y {selectedVehicle.consumption} L/100 km.</p> : <p className="mt-3 text-xs text-slate-500">Para ver ahorro real, selecciona un vehículo guardado en el buscador.</p>}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800">Cómo llegar</a>
        <button onClick={copyAddress} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 hover:bg-slate-200">Copiar dirección</button>
        <button onClick={() => onToggleFavorite(station)} className={isFavorite ? "rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-yellow-200" : "rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"}>{isFavorite ? "★ Favorita" : "☆ Guardar"}</button>
      </div>
    </article>
  );
}
