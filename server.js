const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Página oficial solicitada por el usuario.
const DOWNLOAD_PAGE = 'https://geoportalgasolineras.es/geoportal-instalaciones/DescargarFicheros';
const DEFAULT_XLS_URL = 'https://geoportalgasolineras.es/resources/files/preciosEESS_es.xls';

// Endpoint oficial del mismo servicio público del Geoportal/MITECO, en JSON.
// Lo usamos para evitar leer XLS con la librería xlsx vulnerable.
const OFFICIAL_JSON_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

const CACHE_DIR = path.join(__dirname, 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'gasolineras-cache.json');
const RAW_XLS_FILE = path.join(CACHE_DIR, 'preciosEESS_es.xls');
const SOURCE_INFO_FILE = path.join(CACHE_DIR, 'fuente-geoportal.json');
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_HOUR = Number(process.env.REFRESH_HOUR || 4);

let memory = null;
let refreshing = false;

function ensureDataDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).trim().replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function getFirst(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') return row[name];
  }
  return '';
}

function normalizeStation(row, index) {
  const fuels = {
    gasolina95: parseNumber(getFirst(row, ['Precio Gasolina 95 E5', 'Precio Gasolina 95 E10', 'Precio Gasolina 95 E5 Premium'])),
    gasolina98: parseNumber(getFirst(row, ['Precio Gasolina 98 E5', 'Precio Gasolina 98 E10'])),
    dieselA: parseNumber(getFirst(row, ['Precio Gasoleo A', 'Precio Gasóleo A'])),
    dieselPremium: parseNumber(getFirst(row, ['Precio Gasoleo Premium', 'Precio Gasóleo Premium'])),
    dieselB: parseNumber(getFirst(row, ['Precio Gasoleo B', 'Precio Gasóleo B'])),
    glp: parseNumber(getFirst(row, ['Precio Gases licuados del petróleo', 'Precio Gases Licuados del Petróleo'])),
    gnc: parseNumber(getFirst(row, ['Precio Gas Natural Comprimido'])),
    gnl: parseNumber(getFirst(row, ['Precio Gas Natural Licuado'])),
    hidrogeno: parseNumber(getFirst(row, ['Precio Hidrogeno', 'Precio Hidrógeno'])),
    bioetanol: parseNumber(getFirst(row, ['Precio Bioetanol'])),
    biodiesel: parseNumber(getFirst(row, ['Precio Biodiesel']))
  };

  const lat = parseNumber(getFirst(row, ['Latitud']));
  const lon = parseNumber(getFirst(row, ['Longitud (WGS84)', 'Longitud']));
  const id = String(getFirst(row, ['IDEESS', 'ID EESS', 'ID']) || `eess-${index}`);

  return {
    id,
    rotulo: String(getFirst(row, ['Rótulo', 'Rotulo']) || 'Sin rótulo').trim(),
    direccion: String(getFirst(row, ['Dirección', 'Direccion']) || '').trim(),
    localidad: String(getFirst(row, ['Localidad']) || '').trim(),
    municipio: String(getFirst(row, ['Municipio']) || '').trim(),
    provincia: String(getFirst(row, ['Provincia']) || '').trim(),
    cp: String(getFirst(row, ['C.P.', 'Código Postal', 'Codigo Postal']) || '').trim(),
    horario: String(getFirst(row, ['Horario']) || '').trim(),
    margen: String(getFirst(row, ['Margen']) || '').trim(),
    tipoVenta: String(getFirst(row, ['Tipo Venta']) || '').trim(),
    tipoServicio: String(getFirst(row, ['Tipo Servicio', 'Tipo de servicio']) || '').trim(),
    remision: String(getFirst(row, ['Remisión', 'Remision', 'Fecha Remisión', 'Toma de datos']) || '').trim(),
    lat,
    lon,
    fuels,
    raw: row
  };
}

function buildPayload(rows, xlsUrl) {
  const stations = rows
    .map(normalizeStation)
    .filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lon) && Object.values(s.fuels).some(v => Number.isFinite(v)));

  return {
    source: 'Geoportal de Hidrocarburos / MITECO',
    downloadPage: DOWNLOAD_PAGE,
    xlsUrl,
    jsonUrl: OFFICIAL_JSON_URL,
    downloadedAt: new Date().toISOString(),
    total: stations.length,
    provinces: [...new Set(stations.map(s => s.provincia).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    municipios: [...new Set(stations.map(s => s.municipio).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    brands: [...new Set(stations.map(s => s.rotulo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    stations
  };
}

async function discoverXlsUrl() {
  try {
    const res = await fetch(DOWNLOAD_PAGE, { headers: { 'User-Agent': 'GasolinerasEspanaPro/5.0' } });
    const html = await res.text();
    const match = html.match(/https?:\/\/[^"'<>\s]+preciosEESS_es\.xls/i) || html.match(/[^"'<>\s]+preciosEESS_es\.xls/i);
    const xlsUrl = match ? new URL(match[0], DOWNLOAD_PAGE).toString() : DEFAULT_XLS_URL;
    return { xlsUrl, htmlCheckedAt: new Date().toISOString() };
  } catch (e) {
    return { xlsUrl: DEFAULT_XLS_URL, htmlCheckedAt: new Date().toISOString(), warning: e.message };
  }
}

async function downloadRawXls(xlsUrl) {
  try {
    const res = await fetch(xlsUrl, { headers: { 'User-Agent': 'GasolinerasEspanaPro/5.0' } });
    if (!res.ok) throw new Error(`XLS respondió ${res.status}`);
    const ab = await res.arrayBuffer();
    ensureDataDir();
    fs.writeFileSync(RAW_XLS_FILE, Buffer.from(ab));
    return { ok: true, bytes: Buffer.byteLength(Buffer.from(ab)) };
  } catch (e) {
    return { ok: false, warning: e.message };
  }
}

async function fetchOfficialRows() {
  const res = await fetch(OFFICIAL_JSON_URL, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'GasolinerasEspanaPro/5.0' }
  });
  if (!res.ok) throw new Error(`Servicio oficial respondió ${res.status}`);
  const json = await res.json();
  const rows = json?.ListaEESSPrecio || json?.listaEESSPrecio || [];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('El servicio oficial no devolvió estaciones.');
  return rows;
}

function loadFromDisk() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    memory = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    return memory;
  } catch (e) {
    console.warn('No se pudo leer la caché local:', e.message);
    return null;
  }
}

function saveToDisk(payload, sourceInfo) {
  ensureDataDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(payload));
  fs.writeFileSync(SOURCE_INFO_FILE, JSON.stringify(sourceInfo, null, 2));
}

function isFresh(payload) {
  if (!payload?.downloadedAt) return false;
  return Date.now() - new Date(payload.downloadedAt).getTime() < ONE_DAY_MS;
}

async function refreshData(reason = 'manual') {
  if (refreshing) return memory || loadFromDisk();
  refreshing = true;
  try {
    console.log(`🔄 Actualizando datos oficiales del Geoportal (${reason})...`);
    const sourceInfo = await discoverXlsUrl();
    const xlsResult = await downloadRawXls(sourceInfo.xlsUrl);
    const rows = await fetchOfficialRows();
    const payload = buildPayload(rows, sourceInfo.xlsUrl);
    if (!payload.total) throw new Error('No se detectaron estaciones válidas.');
    saveToDisk(payload, { ...sourceInfo, rawXlsCache: xlsResult, jsonUrl: OFFICIAL_JSON_URL });
    memory = payload;
    console.log(`✅ ${payload.total} estaciones guardadas. Sin dependencia xlsx.`);
    return payload;
  } finally {
    refreshing = false;
  }
}

async function getData(force = false) {
  if (!memory) loadFromDisk();
  if (!force && memory && isFresh(memory)) return { payload: memory, cache: 'fresh' };
  try {
    const payload = await refreshData(force ? 'forzada' : 'caché caducada');
    return { payload, cache: 'refreshed' };
  } catch (e) {
    if (memory) return { payload: memory, cache: 'stale', warning: e.message };
    throw e;
  }
}

function msUntilNextDailyRefresh() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(REFRESH_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function scheduleDailyRefresh() {
  const delay = msUntilNextDailyRefresh();
  setTimeout(async function run() {
    try { await refreshData('programada diaria'); }
    catch (e) { console.error('Error refrescando datos:', e.message); }
    setTimeout(run, ONE_DAY_MS);
  }, delay);
  console.log(`⏰ Próxima actualización diaria automática en ${(delay / 3600000).toFixed(1)} horas.`);
}

if (process.argv.includes('--refresh-once')) {
  refreshData('refresh CLI').then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
} else {
  app.use(express.static(__dirname));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, refreshing, hasCache: !!(memory || loadFromDisk()), source: DOWNLOAD_PAGE }));

  app.get('/api/gasolineras', async (req, res) => {
    try {
      const force = req.query.force === '1' || req.query.force === 'true';
      const { payload, cache, warning } = await getData(force);
      res.json({ ...payload, cache, warning });
    } catch (err) {
      res.status(502).json({ error: 'No se pudieron cargar datos oficiales ni caché local.', detail: err.message, source: DOWNLOAD_PAGE });
    }
  });

  app.get('/api/meta', async (_req, res) => {
    try {
      const { payload, cache, warning } = await getData(false);
      res.json({ source: payload.source, downloadPage: payload.downloadPage, xlsUrl: payload.xlsUrl, jsonUrl: payload.jsonUrl, downloadedAt: payload.downloadedAt, total: payload.total, provinces: payload.provinces, municipios: payload.municipios, brands: payload.brands, cache, warning });
    } catch (err) { res.status(502).json({ error: err.message }); }
  });

  app.post('/api/refresh', async (_req, res) => {
    try { res.json(await refreshData('botón usuario')); }
    catch (err) { res.status(502).json({ error: err.message, source: DOWNLOAD_PAGE }); }
  });

  app.get('/api/source-xls', (_req, res) => {
    if (!fs.existsSync(RAW_XLS_FILE)) return res.status(404).send('Aún no hay XLS oficial en caché. Pulsa actualizar primero.');
    res.download(RAW_XLS_FILE, 'preciosEESS_es.xls');
  });

  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

  loadFromDisk();
  getData(false).catch(e => console.warn('Arranque sin datos frescos:', e.message));
  scheduleDailyRefresh();
  app.listen(PORT, () => console.log(`✅ App lista en http://localhost:${PORT}`));
}
