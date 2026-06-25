const fs = require("fs");
const path = require("path");

const root = process.cwd();

const folders = [
  path.join(root, "app"),
  path.join(root, "components"),
  path.join(root, "docs"),
];

const exts = new Set([".tsx", ".ts", ".jsx", ".js", ".md", ".css", ".json"]);

const manual = [
  // Doble mojibake frecuente
  ["ÃƒÂ¡", "á"], ["ÃƒÂ©", "é"], ["ÃƒÂ­", "í"], ["ÃƒÂ³", "ó"], ["ÃƒÂº", "ú"],
  ["ÃƒÂ±", "ñ"], ["Ãƒâ€˜", "Ñ"], ["ÃƒÂ¼", "ü"], ["ÃƒÅ“", "Ü"],
  ["Ã‚Â¿", "¿"], ["Ã‚Â¡", "¡"], ["Ã‚Â·", "·"],

  // Mojibake normal: minúsculas
  ["Ã¡", "á"], ["Ã©", "é"], ["Ã­", "í"], ["Ã³", "ó"], ["Ãº", "ú"],
  ["Ã ", "à"], ["Ã¨", "è"], ["Ã¬", "ì"], ["Ã²", "ò"], ["Ã¹", "ù"],
  ["Ã±", "ñ"], ["Ã¼", "ü"],

  // Mojibake normal: mayúsculas
  ["Ã", "Á"], ["Ã‰", "É"], ["Ã", "Í"], ["Ã“", "Ó"], ["Ãš", "Ú"],
  ["Ã€", "À"], ["Ãˆ", "È"], ["ÃŒ", "Ì"], ["Ã’", "Ò"], ["Ã™", "Ù"],
  ["Ã‘", "Ñ"], ["Ãœ", "Ü"],

  // Símbolos
  ["Â¿", "¿"], ["Â¡", "¡"], ["Âº", "º"], ["Âª", "ª"], ["Â·", "·"], ["Â", ""],
  ["â‚¬", "€"], ["â€“", "–"], ["â€”", "—"], ["â€˜", "‘"], ["â€™", "’"],
  ["â€œ", "“"], ["â€", "”"], ["â€¦", "…"], ["â€¢", "•"],

  // Emojis habituales rotos
  ["ðŸ“", "📍"], ["ðŸš—", "🚗"], ["ðŸ—ºï¸", "🗺️"], ["ðŸ—º", "🗺"],
  ["ðŸ”", "🔍"], ["ðŸ’°", "💰"], ["ðŸ›£ï¸", "🛣️"], ["ðŸ›£", "🛣"],
  ["âš¡", "⚡"], ["âœ“", "✓"], ["â†’", "→"],
];

function badScore(s) {
  const markers = ["Ã", "Â", "â", "ðŸ", "�"];
  let score = 0;
  for (const m of markers) {
    let i = 0;
    while ((i = s.indexOf(m, i)) !== -1) {
      score += 10;
      i += m.length;
    }
  }

  // Penaliza controles raros que aparecen en mojibake
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 0x80 && c <= 0x9f) score += 5;
  }

  return score;
}

function latin1DecodeToken(token) {
  try {
    const decoded = Buffer.from(token, "latin1").toString("utf8");
    if (badScore(decoded) < badScore(token)) return decoded;
  } catch (_) {}

  return token;
}

function fixText(input) {
  let text = input;

  for (let pass = 0; pass < 5; pass++) {
    const before = text;

    for (const [bad, good] of manual) {
      text = text.split(bad).join(good);
    }

    // Decodifica solo tokens sospechosos, no todo el archivo, para no romper acentos correctos.
    text = text.replace(/[^\s<>"'`{}()[\],;:]+/g, (token) => {
      if (!/[ÃÂâð�]/.test(token)) return token;
      let fixed = token;
      for (let i = 0; i < 3; i++) {
        const next = latin1DecodeToken(fixed);
        if (next === fixed) break;
        fixed = next;
      }
      for (const [bad, good] of manual) {
        fixed = fixed.split(bad).join(good);
      }
      return fixed;
    });

    // Fix del onClick si aún quedó de v7.5
    text = text.split("onClick={loadManualRanking}").join("onClick={() => void loadManualRanking()}");

    if (text === before) break;
  }

  return text;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "android", "ios", ".git"].includes(entry.name)) continue;
      out.push(...walk(full));
    } else if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

let changedFiles = 0;
let suspiciousBefore = 0;
let suspiciousAfter = 0;

const files = folders.flatMap(walk);

for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const beforeScore = badScore(before);
  suspiciousBefore += beforeScore;

  const after = fixText(before);
  const afterScore = badScore(after);
  suspiciousAfter += afterScore;

  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changedFiles += 1;
    console.log(`OK ${path.relative(root, file)} | score ${beforeScore} -> ${afterScore}`);
  }
}

console.log("");
console.log(`Archivos revisados: ${files.length}`);
console.log(`Archivos modificados: ${changedFiles}`);
console.log(`Puntuación mojibake antes: ${suspiciousBefore}`);
console.log(`Puntuación mojibake después: ${suspiciousAfter}`);

console.log("");
console.log("Comprobación de textos todavía sospechosos:");
let remaining = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  if (/[ÃÂâð�]/.test(text)) {
    remaining += 1;
    console.log(`REVISA ${path.relative(root, file)}`);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/[ÃÂâð�]/.test(line)) {
        console.log(`  ${idx + 1}: ${line.slice(0, 180)}`);
      }
    });
  }
}

if (remaining === 0) {
  console.log("No quedan marcadores típicos de texto corrupto.");
} else {
  console.log(`Quedan ${remaining} archivos con posibles textos corruptos.`);
}
