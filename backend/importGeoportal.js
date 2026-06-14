import { fileURLToPath } from "url";
import axios from "axios";
import { pool } from "./db.js";

function parseSpanishNumber(value) {
  if (!value) return null;

  const cleaned = String(value).trim().replace(",", ".");
  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function pick(obj, names) {
  for (const name of names) {
    if (obj[name] !== undefined && obj[name] !== null && obj[name] !== "") {
      return obj[name];
    }
  }
  return null;
}

export async function importGeoportalData() {
  const client = await pool.connect();

  try {
    console.log("Descargando datos oficiales del Geoportal...");

    const response = await axios.get(process.env.GEO_REST_URL, {
      timeout: 60000,
    });

    const stations = response.data.ListaEESSPrecio || [];
    const capturedAt = new Date();

    console.log(`Estaciones recibidas: ${stations.length}`);

    await client.query("BEGIN");

    await client.query(`
      DELETE FROM prices
      WHERE captured_at::date = CURRENT_DATE
    `);

    for (const s of stations) {
      const externalId = pick(s, ["IDEESS", "Id", "id"]);
      const lat = parseSpanishNumber(pick(s, ["Latitud"]));
      const lon = parseSpanishNumber(pick(s, ["Longitud (WGS84)", "Longitud"]));

      if (!externalId || !lat || !lon) continue;

      const stationResult = await client.query(
        `
        INSERT INTO stations (
          external_id,
          name,
          brand,
          address,
          province,
          municipality,
          postal_code,
          schedule,
          latitude,
          longitude,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()
        )
        ON CONFLICT (external_id)
        DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          address = EXCLUDED.address,
          province = EXCLUDED.province,
          municipality = EXCLUDED.municipality,
          postal_code = EXCLUDED.postal_code,
          schedule = EXCLUDED.schedule,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          updated_at = NOW()
        RETURNING id
        `,
        [
          externalId,
          pick(s, ["Rótulo", "Rotulo"]) || "Sin nombre",
          pick(s, ["Rótulo", "Rotulo"]) || "Sin marca",
          pick(s, ["Dirección", "Direccion"]),
          pick(s, ["Provincia"]),
          pick(s, ["Municipio"]),
          pick(s, ["C.P.", "CP", "Código Postal"]),
          pick(s, ["Horario"]),
          lat,
          lon,
        ]
      );

      const stationId = stationResult.rows[0].id;

      const fuels = [
        ["gasolina95", pick(s, ["Precio Gasolina 95 E5", "Precio Gasolina 95 E10"])],
        ["gasolina98", pick(s, ["Precio Gasolina 98 E5", "Precio Gasolina 98 E10"])],
        ["diesel", pick(s, ["Precio Gasoleo A", "Precio Gasóleo A"])],
        ["diesel_premium", pick(s, ["Precio Gasoleo Premium", "Precio Gasóleo Premium"])],
        ["glp", pick(s, ["Precio Gases licuados del petróleo"])],
        ["gnc", pick(s, ["Precio Gas Natural Comprimido"])],
        ["gnl", pick(s, ["Precio Gas Natural Licuado"])],
        ["hidrogeno", pick(s, ["Precio Hidrogeno", "Precio Hidrógeno"])],
      ];

      for (const [fuelType, rawPrice] of fuels) {
        const price = parseSpanishNumber(rawPrice);

        if (!price) continue;

        await client.query(
          `
          INSERT INTO prices (
            station_id,
            fuel_type,
            price,
            captured_at
          )
          VALUES ($1,$2,$3,$4)
          `,
          [stationId, fuelType, price, capturedAt]
        );
      }
    }

    await client.query("COMMIT");

    console.log("Importación completada correctamente.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error importando datos:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  importGeoportalData()
    .then(() => {
      console.log("Proceso terminado.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error final:", error);
      process.exit(1);
    });
}