import express from "express";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import { pool } from "./db.js";
import { importGeoportalData } from "./importGeoportal.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function parseNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

// Comprobar que el backend funciona
app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    message: "Backend funcionando correctamente",
    timestamp: new Date(),
  });
});

// Resumen general
app.get("/api/summary", async (req, res) => {
  try {
    const stationsResult = await pool.query(`
      SELECT COUNT(*)::int AS total_stations
      FROM stations
    `);

    const pricesResult = await pool.query(`
      SELECT COUNT(*)::int AS total_prices
      FROM prices
    `);

    const updatedResult = await pool.query(`
      SELECT MAX(captured_at) AS last_update
      FROM prices
    `);

    res.json({
      totalStations: stationsResult.rows[0].total_stations,
      totalPrices: pricesResult.rows[0].total_prices,
      lastUpdate: updatedResult.rows[0].last_update,
    });
  } catch (error) {
    console.error("Error en /api/summary:", error);
    res.status(500).json({ error: "Error obteniendo resumen" });
  }
});

// Filtros disponibles: provincias y municipios
app.get("/api/filters", async (req, res) => {
  try {
    const selectedProvince = req.query.province || null;

    const provincesResult = await pool.query(`
      SELECT DISTINCT TRIM(province) AS province
      FROM stations
      WHERE province IS NOT NULL
        AND TRIM(province) <> ''
      ORDER BY TRIM(province) ASC
    `);

    let municipalitiesResult;

    if (selectedProvince) {
      municipalitiesResult = await pool.query(
        `
        SELECT DISTINCT TRIM(municipality) AS municipality
        FROM stations
        WHERE municipality IS NOT NULL
          AND TRIM(municipality) <> ''
          AND LOWER(TRIM(province)) = LOWER(TRIM($1))
        ORDER BY TRIM(municipality) ASC
        `,
        [selectedProvince]
      );
    } else {
      municipalitiesResult = await pool.query(`
        SELECT DISTINCT TRIM(municipality) AS municipality
        FROM stations
        WHERE municipality IS NOT NULL
          AND TRIM(municipality) <> ''
        ORDER BY TRIM(municipality) ASC
        LIMIT 500
      `);
    }

    res.json({
      provinces: provincesResult.rows.map((row) => row.province),
      municipalities: municipalitiesResult.rows.map((row) => row.municipality),
    });
  } catch (error) {
    console.error("Error en /api/filters:", error);
    res.status(500).json({ error: "Error obteniendo filtros" });
  }
});

// Gasolineras cercanas a una ubicación
app.get("/api/nearby", async (req, res) => {
  try {
    const lat = parseNumber(req.query.lat, null);
    const lon = parseNumber(req.query.lon, null);
    const radius = parseNumber(req.query.radius, 10000);
    const fuel = req.query.fuel || "gasolina95";
    const limit = parseNumber(req.query.limit, 50);

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Debes indicar lat y lon",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.external_id,
        s.name,
        s.brand,
        s.address,
        s.province,
        s.municipality,
        s.postal_code,
        s.schedule,
        s.latitude,
        s.longitude,
        p.price,
        p.fuel_type,
        p.captured_at,
        ST_Distance(
          s.location,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) AS distance_meters
      FROM stations s
      JOIN LATERAL (
        SELECT fuel_type, price, captured_at
        FROM prices
        WHERE prices.station_id = s.id
          AND prices.fuel_type = $4
        ORDER BY captured_at DESC
        LIMIT 1
      ) p ON true
      WHERE ST_DWithin(
        s.location,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        $3
      )
      ORDER BY p.price ASC, distance_meters ASC
      LIMIT $5
      `,
      [lat, lon, radius, fuel, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error en /api/nearby:", error);
    res.status(500).json({ error: "Error buscando gasolineras cercanas" });
  }
});

// Ranking nacional / provincia / municipio
app.get("/api/ranking", async (req, res) => {
  try {
    const fuel = req.query.fuel || "gasolina95";
    const province = req.query.province || null;
    const municipality = req.query.municipality || null;
    const limit = parseNumber(req.query.limit, 50);

    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.external_id,
        s.name,
        s.brand,
        s.address,
        s.province,
        s.municipality,
        s.latitude,
        s.longitude,
        p.price,
        p.fuel_type,
        p.captured_at
      FROM stations s
      JOIN LATERAL (
        SELECT fuel_type, price, captured_at
        FROM prices
        WHERE prices.station_id = s.id
          AND prices.fuel_type = $1
        ORDER BY captured_at DESC
        LIMIT 1
      ) p ON true
      WHERE ($2::text IS NULL OR LOWER(TRIM(s.province)) = LOWER(TRIM($2)))
        AND ($3::text IS NULL OR LOWER(TRIM(s.municipality)) = LOWER(TRIM($3)))
      ORDER BY p.price ASC
      LIMIT $4
      `,
      [fuel, province, municipality, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error en /api/ranking:", error);
    res.status(500).json({ error: "Error obteniendo ranking" });
  }
});

// Buscar gasolineras por texto
app.get("/api/stations", async (req, res) => {
  try {
    const search = req.query.search || "";
    const limit = parseNumber(req.query.limit, 100);

    const result = await pool.query(
      `
      SELECT *
      FROM stations
      WHERE 
        name ILIKE $1
        OR brand ILIKE $1
        OR address ILIKE $1
        OR province ILIKE $1
        OR municipality ILIKE $1
      ORDER BY province, municipality, name
      LIMIT $2
      `,
      [`%${search}%`, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error en /api/stations:", error);
    res.status(500).json({ error: "Error buscando estaciones" });
  }
});

// Histórico de precios de una gasolinera
app.get("/api/history/:stationId", async (req, res) => {
  try {
    const stationId = req.params.stationId;
    const fuel = req.query.fuel || "gasolina95";

    const result = await pool.query(
      `
      SELECT 
        fuel_type,
        price,
        captured_at
      FROM prices
      WHERE station_id = $1
        AND fuel_type = $2
      ORDER BY captured_at ASC
      `,
      [stationId, fuel]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error en /api/history:", error);
    res.status(500).json({ error: "Error obteniendo histórico" });
  }
});

// Forzar actualización manual
app.post("/api/update-now", async (req, res) => {
  try {
    await importGeoportalData();

    res.json({
      ok: true,
      message: "Datos actualizados correctamente",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error en /api/update-now:", error);
    res.status(500).json({
      ok: false,
      error: "Error actualizando datos",
    });
  }
});

// Actualización automática diaria a las 02:00
cron.schedule("0 2 * * *", async () => {
  try {
    console.log("Actualización diaria iniciada...");
    await importGeoportalData();
    console.log("Actualización diaria completada.");
  } catch (error) {
    console.error("Error en actualización diaria:", error);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend funcionando en http://localhost:${PORT}`);
});