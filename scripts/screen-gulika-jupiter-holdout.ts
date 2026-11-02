// Fixed placement-first holdout; see docs/gulika-jupiter-holdout-protocol.md.
// Input is public birth fields prepared from the source's C-name XML, not outcomes.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { ascendantAt, gulikaComparisons, julianDay, positionsAt } from "../server/ephemeris";
import { gulikaNatalClues } from "@shared/gulika-clues";
import { SIGNS } from "@shared/astro";

type Entry = { id: string; name: string; date: string; jd: number; zone: string; latitude: number; longitude: number;
  countryKey: string; country: string; place: string; adb: string; wikipedia: string };
if (process.argv.length !== 3) throw new Error("Expected prepared public-input JSON");
const input = JSON.parse(readFileSync(process.argv[2], "utf8")) as Entry[];
const prior = JSON.parse(readFileSync("docs/gulika-fifth-discovery-screen.json", "utf8")) as { selected: Entry[] };
const excluded = new Set(prior.selected.map((e) => e.id));
const opts = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
let stableFifth = 0, errors = 0;
const groups: Record<"aspect" | "noAspect", Array<Entry & { priority: string; nominal: unknown }>> = { aspect: [], noAspect: [] };
for (const row of input) {
  if (excluded.has(row.id)) continue;
  try {
    const birth = DateTime.fromISO(row.date, { zone: row.zone });
    if (!birth.isValid || Math.abs(julianDay(birth.toUTC()) - row.jd) * 86400 > 3) throw new Error("Time mismatch");
    const samples = [-5, 0, 5].map((minutes) => {
      const jd = julianDay(birth.plus({ minutes }).toUTC());
      const asc = Math.floor(ascendantAt(jd, row.latitude, row.longitude, opts) / 30);
      const point = gulikaComparisons(jd, row.latitude, row.longitude, row.zone, opts)["kerala-ghati"];
      return { jd, asc, point, house: (point.signIndex - asc + 12) % 12 + 1 };
    });
    if (!samples.every((x) => x.house === 5 && x.point.day === samples[1].point.day)) continue;
    stableFifth++;
    const sample = samples[1], positions = positionsAt(sample.jd, opts);
    const clue = gulikaNatalClues(positions, sample.point, sample.asc);
    const priority = createHash("sha256").update(`Nadi-gulika-aspect-holdout-2026:${row.id}`, "utf8").digest("hex");
    const group = clue.jupiterFifthOrNinthAspect ? "aspect" : "noAspect";
    groups[group].push({ ...row, priority, nominal: { ascendant: SIGNS[sample.asc],
      gulikaSign: SIGNS[sample.point.signIndex], gulikaLongitude: sample.point.lon, house: sample.house,
      day: sample.point.day, jupiterSign: SIGNS[clue.jupiter.fromSign], jupiterToGulika: clue.jupiter } });
  } catch {
    errors++;
  }
}
const select = (rows: typeof groups.aspect) => {
  const counts = new Map<string, number>();
  return rows.sort((a, b) => a.priority.localeCompare(b.priority)).filter((row) => {
    const n = counts.get(row.countryKey) ?? 0;
    if (n >= 4) return false;
    counts.set(row.countryKey, n + 1);
    return true;
  }).slice(0, 10);
};
console.log(JSON.stringify({ protocol: "docs/gulika-jupiter-holdout-protocol.md", eligibleInput: input.length,
  excludedEarlierDiscoveries: excluded.size, stableFifth, calculationErrors: errors,
  available: { aspect: groups.aspect.length, noAspect: groups.noAspect.length },
  selected: { aspect: select(groups.aspect), noAspect: select(groups.noAspect) } }, null, 2));
