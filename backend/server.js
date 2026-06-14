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

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API de Gasolineras funcionando",
    endpoints: {
      health: "/api/health",
      summary: "/api/summary",
      filters: "/api/filters",
      brands: "/api/brands",
      cheapestSummary: "/api/cheapest-summary",
      ranking: "/api/ranking",
      nearby: "/api/nearby",
      stations: "/api/stations",
    },
  });
});

app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    message: "Backend funcionando correctamente",
    timestamp: new Date(),
  });
});

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
        LIMIT 700
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

app.get("/api/brands", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const limit = parseNumber(req.query.limit, 12);

    const result = await pool.query(
      `
      SELECT DISTINCT TRIM(brand) AS brand
      FROM stations
      WHERE brand IS NOT NULL
        AND TRIM(brand) <> ''
        AND ($1::text IS NULL OR brand ILIKE $1 OR name ILIKE $1)
      ORDER BY TRIM(brand) ASC
      LIMIT $2
      `,
      [search ? `%${search}%` : null, limit]
    );

    res.json(result.rows.map((row) => row.brand));
  } catch (error) {
    console.error("Error en /api/brands:", error);
    res.status(500).json({ error: "Error obteniendo marcas" });
  }
});

// Ranking rápido para la home: separa Península+Baleares de Canarias.
app.get("/api/cheapest-summary", async (req, res) => {
  try {
    const fuel = req.query.fuel || "gasolina95";
    const limit = parseNumber(req.query.limit, 5);

    const query = `
      SELECT *
      FROM (
        SELECT
          CASE
            WHEN UPPER(TRIM(s.province)) IN ('LAS PALMAS', 'SANTA CRUZ DE TENERIFE', 'STA. CRUZ DE TENERIFE')
              THEN 'canarias'
            ELSE 'peninsula_baleares'
          END AS region_group,
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
          ROW_NUMBER() OVER (
            PARTITION BY
              CASE
                WHEN UPPER(TRIM(s.province)) IN ('LAS PALMAS', 'SANTA CRUZ DE TENERIFE', 'STA. CRUZ DE TENERIFE')
                  THEN 'canarias'
                ELSE 'peninsula_baleares'
              END
            ORDER BY p.price ASC
          ) AS rn
        FROM stations s
        JOIN LATERAL (
          SELECT fuel_type, price, captured_at
          FROM prices
          WHERE prices.station_id = s.id
            AND prices.fuel_type = $1
          ORDER BY captured_at DESC
          LIMIT 1
        ) p ON true
      ) ranked
      WHERE rn <= $2
      ORDER BY region_group ASC, price ASC
    `;

    const result = await pool.query(query, [fuel, limit]);

    res.json({
      fuel,
      peninsulaBaleares: result.rows.filter((row) => row.region_group === "peninsula_baleares"),
      canarias: result.rows.filter((row) => row.region_group === "canarias"),
    });
  } catch (error) {
    console.error("Error en /api/cheapest-summary:", error);
    res.status(500).json({ error: "Error obteniendo resumen de precios" });
  }
});

app.get("/api/nearby", async (req, res) => {
  try {
    const lat = parseNumber(req.query.lat, null);
    const lon = parseNumber(req.query.lon, null);
    const radius = parseNumber(req.query.radius, 10000);
    const fuel = req.query.fuel || "gasolina95";
    const brand = req.query.brand ? `%${String(req.query.brand).trim()}%` : null;
    const limit = parseNumber(req.query.limit, 25);

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Debes indicar lat y lon",
      });
    }

    const result = await pool.query(
      `
      WITH stations_with_distance AS (
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
          (
            6371000 * 2 * ASIN(
              SQRT(
                POWER(SIN(RADIANS((s.latitude - $1) / 2)), 2) +
                COS(RADIANS($1)) *
                COS(RADIANS(s.latitude)) *
                POWER(SIN(RADIANS((s.longitude - $2) / 2)), 2)
              )
            )
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
        WHERE s.latitude IS NOT NULL
          AND s.longitude IS NOT NULL
          AND ($5::text IS NULL OR s.brand ILIKE $5 OR s.name ILIKE $5)
      )
      SELECT *
      FROM stations_with_distance
      WHERE distance_meters <= $3
      ORDER BY price ASC, distance_meters ASC
      LIMIT $6
      `,
      [lat, lon, radius, fuel, brand, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error en /api/nearby:", error);
    res.status(500).json({ error: "Error buscando gasolineras cercanas" });
  }
});

app.get("/api/ranking", async (req, res) => {
  try {
    const fuel = req.query.fuel || "gasolina95";
    const province = req.query.province ? `%${String(req.query.province).trim()}%` : null;
    const municipality = req.query.municipality ? `%${String(req.query.municipality).trim()}%` : null;
    const brand = req.query.brand ? `%${String(req.query.brand).trim()}%` : null;
    const limit = parseNumber(req.query.limit, 25);

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
      WHERE ($2::text IS NULL OR s.province ILIKE $2)
        AND ($3::text IS NULL OR s.municipality ILIKE $3)
        AND ($4::text IS NULL OR s.brand ILIKE $4 OR s.name ILIKE $4)
      ORDER BY p.price ASC
      LIMIT $5
      `,
      [fuel, province, municipality, brand, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error en /api/ranking:", error);
    res.status(500).json({ error: "Error obteniendo ranking" });
  }
});

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

// Endpoint de mantenimiento. No aparece en la web.
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
