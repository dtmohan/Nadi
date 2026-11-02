// Re-run the placement-first screen from public input extracted by prepare-gulika-discovery.py.
// Usage: node --import tsx scripts/screen-gulika-fifth-discovery.ts /tmp/gulika-input.json
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { ascendantAt, gulikaComparisons, julianDay } from "../server/ephemeris";

type Input = { id: string; name: string; date: string; zone: string; latitude: number; longitude: number; countryKey: string };
if (process.argv.length !== 3) throw new Error("Expected path to prepared public-input JSON");
const records = JSON.parse(readFileSync(process.argv[2], "utf8")) as Input[];
const opts = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
let nominalFifth = 0, errors = 0;
const stable = [] as Array<Input & { priority: string }>;
for (const row of records) {
  try {
    const birth = DateTime.fromISO(row.date, { zone: row.zone });
    if (!birth.isValid) throw new Error("Invalid offset");
    const observations = [-5, 0, 5].map((minutes) => {
      const jd = julianDay(birth.plus({ minutes }).toUTC());
      const asc = Math.floor(ascendantAt(jd, row.latitude, row.longitude, opts) / 30);
      const point = gulikaComparisons(jd, row.latitude, row.longitude, row.zone, opts)["kerala-ghati"];
      return { house: (point.signIndex - asc + 12) % 12 + 1, day: point.day };
    });
    if (observations[1].house === 5) nominalFifth++;
    if (observations.every((x) => x.house === 5 && x.day === observations[1].day)) {
      const priority = createHash("sha256").update(`Nadi-gulika-fifth-2026:${row.id}`, "utf8").digest("hex");
      stable.push({ ...row, priority });
    }
  } catch {
    errors++;
  }
}
stable.sort((a, b) => a.priority.localeCompare(b.priority));
const countries = new Map<string, number>();
const selected = [] as typeof stable;
for (const row of stable) {
  const count = countries.get(row.countryKey) ?? 0;
  if (count < 4) {
    selected.push(row);
    countries.set(row.countryKey, count + 1);
  }
  if (selected.length === 20) break;
}
console.log(JSON.stringify({ eligibleInput: records.length, nominalFifth, stableFifth: stable.length,
  calculationErrors: errors, selected: selected.map(({ id, name, priority }) => ({ id, name, priority })) }, null, 2));
