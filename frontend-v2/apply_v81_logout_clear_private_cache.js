const fs = require("fs");
const path = require("path");

const root = process.cwd();

const privateKeys = [
  "myVehicles",
  "favoriteStationsFull",
  "favoriteStationIds",
  "favoriteStations",
  "favoriteStationIdsFull",
  "selectedVehicleId",
  "selectedFavoriteId",
];

function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.log(`SKIP ${rel}: no existe`);
    return null;
  }
  return fs.readFileSync(full, "utf8");
}

function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text, "utf8");
  console.log(`OK ${rel}`);
}

function addClearPrivateCacheFunction(text) {
  if (text.includes("function clearPrivateLocalCache()")) return text;

  const fn = `
function clearPrivateLocalCache() {
  if (typeof window === "undefined") return;

  const privateKeys = [
    "myVehicles",
    "favoriteStationsFull",
    "favoriteStationIds",
    "favoriteStations",
    "favoriteStationIdsFull",
    "selectedVehicleId",
    "selectedFavoriteId",
  ];

  privateKeys.forEach((key) => window.localStorage.removeItem(key));
}
`;

  const marker = "export default function";
  if (text.includes(marker)) {
    return text.replace(marker, `${fn}\n${marker}`);
  }

  return `${fn}\n${text}`;
}

/* 1) Perfil: al cerrar sesión limpiamos caché privada */
{
  const rel = "app/perfil/page.tsx";
  let text = read(rel);

  if (text) {
    text = addClearPrivateCacheFunction(text);

    text = text.replace(
      /async function logout\(\) \{\s*await supabase\.auth\.signOut\(\);\s*window\.location\.href = "\/";\s*\}/s,
      `async function logout() {
    clearPrivateLocalCache();
    await supabase.auth.signOut();
    window.location.href = "/";
  }`
    );

    write(rel, text);
  }
}

/* 2) Mis vehículos: si no hay sesión, no se muestran ni guardan vehículos locales */
{
  const rel = "app/mis-vehiculos/page.tsx";
  let text = read(rel);

  if (text) {
    text = addClearPrivateCacheFunction(text);

    text = text.replace(
      /if \(!user\) \{\s*setUserId\(null\);[\s\S]*?setSyncing\(false\);\s*return;\s*\}/,
      `if (!user) {
      setUserId(null);
      clearPrivateLocalCache();
      setVehicles([]);
      setSyncing(false);
      return;
    }`
    );

    text = text.replace(
      /if \(!userId\) \{\s*localStorage\.setItem\("myVehicles", JSON\.stringify\(nextVehicles\)\);\s*return;\s*\}/,
      `if (!userId) {
      clearPrivateLocalCache();
      alert("Inicia sesión para guardar tus vehículos.");
      window.location.href = "/login";
      return;
    }`
    );

    write(rel, text);
  }
}

/* 3) Favoritas: si no hay sesión, no se cargan favoritas locales antiguas */
{
  const rel = "app/favoritas/page.tsx";
  let text = read(rel);

  if (text) {
    text = addClearPrivateCacheFunction(text);

    text = text.replace(
      /if \(!user\) \{\s*setUserId\(null\);[\s\S]*?setSyncing\(false\);\s*return;\s*\}/,
      `if (!user) {
      setUserId(null);
      clearPrivateLocalCache();
      setFavorites([]);
      setSyncing(false);
      return;
    }`
    );

    // Evita que se guarden favoritas en localStorage si no hay cuenta.
    text = text.replace(
      /if \(!userId\) \{\s*localStorage\.setItem\("favoriteStationsFull", JSON\.stringify\((nextFavorites|updatedFavorites|favorites)\)\);\s*return;\s*\}/g,
      `if (!userId) {
      clearPrivateLocalCache();
      alert("Inicia sesión para guardar tus favoritas.");
      window.location.href = "/login";
      return;
    }`
    );

    write(rel, text);
  }
}

/* 4) Buscar: elimina caché privada al detectar que no hay usuario.
      Esto evita que los filtros de vehículos/favoritas usen restos tras logout.
      No toca lastUserLocation, porque ubicación reciente no es cuenta privada. */
{
  const rel = "app/buscar/page.tsx";
  let text = read(rel);

  if (text) {
    text = addClearPrivateCacheFunction(text);

    // En funciones que consultan supabase.auth.getUser(), si no hay user, limpiamos claves privadas.
    text = text.replace(
      /if \(!user\) \{\s*setUserId\(null\);/g,
      `if (!user) {
      clearPrivateLocalCache();
      setUserId(null);`
    );

    // Si el buscar tiene ramas sin setUserId, cubrimos el patrón más común.
    text = text.replace(
      /if \(!user\) \{\s*loadLocalVehicles\(\);\s*return;\s*\}/g,
      `if (!user) {
          clearPrivateLocalCache();
          setVehicles([]);
          return;
        }`
    );

    text = text.replace(
      /if \(!user\) \{\s*loadLocalFavorites\(\);\s*return;\s*\}/g,
      `if (!user) {
          clearPrivateLocalCache();
          setFavoriteStationIds([]);
          setFavoriteStationsFull([]);
          return;
        }`
    );

    write(rel, text);
  }
}

console.log("");
console.log("v8.1 aplicado.");
console.log("Ahora ejecuta: npm run build");
