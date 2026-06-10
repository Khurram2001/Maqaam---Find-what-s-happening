import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function parseCsvLine(line) {
  const cols = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cols.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cols.push(current);
  return cols;
}

const csv = await fetchText(
  "https://raw.githubusercontent.com/datasets/country-codes/master/data/country-codes.csv"
);

const map = new Map();
for (const line of csv.split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  const cols = parseCsvLine(line);
  const name = cols[40]?.trim() || cols[20]?.trim() || cols[0]?.trim();
  const iso = cols[9]?.trim();
  let dial = cols[1]?.trim();
  if (!name || !iso || !dial || dial.toLowerCase() === "nan") continue;
  dial = `+${dial.split("-")[0].replace(/\D/g, "")}`;
  if (!/^\+\d+$/.test(dial)) continue;
  const key = `${iso}|${dial}`;
  if (!map.has(key)) {
    map.set(key, { code: dial, iso, name });
  }
}

const all = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));

const commonIsos = new Set([
  "SA", "AE", "BH", "QA", "KW", "OM", "JO", "LB", "EG", "MA", "TR", "PK", "IN", "ID", "MY",
  "GB", "US", "CA", "AU", "ZA", "NG", "FR", "DE", "NL", "BD", "IR", "IQ", "SY", "YE", "SD",
]);

const common = all.filter((item) => commonIsos.has(item.iso));
const commonKeys = new Set(common.map((item) => `${item.iso}|${item.code}`));

const out = `/** Auto-generated ITU calling codes — do not edit by hand. */
export const PHONE_COUNTRY_CODES_ALL = ${JSON.stringify(all, null, 2)};

export const PHONE_COUNTRY_CODES_COMMON = ${JSON.stringify(common, null, 2)};

export const PHONE_COUNTRY_CODE_KEYS_COMMON = new Set(${JSON.stringify([...commonKeys])});
`;

const target = path.join(__dirname, "..", "lib", "phone-country-codes-data.js");
fs.writeFileSync(target, out, "utf8");
console.log(`Wrote ${all.length} countries to ${target}`);
