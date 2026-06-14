import { pool } from "./db.js";

async function setupDatabase() {
  console.log("Preparando base de datos...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stations (
      id SERIAL PRIMARY KEY,
      external_id TEXT UNIQUE,
      name TEXT,
      brand TEXT,
      address TEXT,
      province TEXT,
      municipality TEXT,
      postal_code TEXT,
      schedule TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prices (
      id SERIAL PRIMARY KEY,
      station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
      fuel_type TEXT,
      price NUMERIC(6,3),
      captured_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_prices_fuel
    ON prices(fuel_type);

    CREATE INDEX IF NOT EXISTS idx_prices_captured
    ON prices(captured_at);

    CREATE INDEX IF NOT EXISTS idx_prices_station_fuel_captured
    ON prices(station_id, fuel_type, captured_at DESC);

    CREATE INDEX IF NOT EXISTS idx_stations_province_municipality
    ON stations(province, municipality);

    CREATE INDEX IF NOT EXISTS idx_stations_lat_lon
    ON stations(latitude, longitude);
  `);

  console.log("Base de datos preparada.");
}

setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error preparando base de datos:", error);
    process.exit(1);
  });