const fs = require("fs");
const path = require("path");

const root = process.cwd();

const targets = [
  path.join(root, "app"),
  path.join(root, "components"),
  path.join(root, "docs"),
];

const extensions = new Set([".tsx", ".ts", ".jsx", ".js", ".md", ".css", ".json"]);

const replacements = [
  ["Ã¡", "á"],
  ["Ã©", "é"],
  ["Ã­", "í"],
  ["Ã³", "ó"],
  ["Ãº", "ú"],
  ["Ã�", "Á"],
  ["Ã‰", "É"],
  ["Ã", "Í"],
  ["Ã“", "Ó"],
  ["Ãš", "Ú"],
  ["Ã±", "ñ"],
  ["Ã‘", "Ñ"],
  ["Ã¼", "ü"],
  ["Ãœ", "Ü"],
  ["Â¿", "¿"],
  ["Â¡", "¡"],
  ["Âº", "º"],
  ["Âª", "ª"],
  ["Â·", "·"],
  ["â‚¬", "€"],
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€¦", "…"],

  // Emojis que se suelen romper al pasar por PowerShell/ANSI.
  ["ðŸ“", "📍"],
  ["ðŸš—", "🚗"],
  ["ðŸ—ºï¸", "🗺️"],
  ["ðŸ—º", "🗺"],
  ["ðŸ”", "🔍"],
  ["ðŸ’°", "💰"],
  ["ðŸ›£ï¸", "🛣️"],
  ["ðŸ›£", "🛣"],
  ["âš¡", "⚡"],
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", "android", "ios", ".git"].includes(entry.name)) continue;
      files = files.concat(walk(full));
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }

  return files;
}

let touched = 0;
let totalReplacements = 0;

for (const base of targets) {
  for (const file of walk(base)) {
    let text = fs.readFileSync(file, "utf8");
    let next = text;
    let count = 0;

    for (const [bad, good] of replacements) {
      const parts = next.split(bad);
      if (parts.length > 1) {
        count += parts.length - 1;
        next = parts.join(good);
      }
    }

    // Fix concreto si quedó el onClick del parche anterior sin corregir.
    if (next.includes("onClick={loadManualRanking}")) {
      next = next.replaceAll(
        "onClick={loadManualRanking}",
        "onClick={() => void loadManualRanking()}"
      );
      count += 1;
    }

    if (next !== text) {
      fs.writeFileSync(file, next, "utf8");
      touched += 1;
      totalReplacements += count;
      console.log(`OK ${path.relative(root, file)} (${count})`);
    }
  }
}

console.log("");
console.log(`Archivos corregidos: ${touched}`);
console.log(`Reemplazos totales: ${totalReplacements}`);

if (touched === 0) {
  console.log("No se encontraron textos corruptos. Revisa si estás en la carpeta correcta.");
}
