CREATE EXTENSION IF NOT EXISTS postgis;

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
  location GEOGRAPHY(Point, 4326),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prices (
  id SERIAL PRIMARY KEY,
  station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
  fuel_type TEXT,
  price NUMERIC(6,3),
  captured_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_location
ON stations USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_prices_fuel
ON prices(fuel_type);

CREATE INDEX IF NOT EXISTS idx_prices_captured
ON prices(captured_at);