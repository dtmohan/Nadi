// Placement-first screen; see docs/jupiter-ninth-research-protocol.md.
// Reads only public fields prepared by scripts/prepare-gulika-discovery.py.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DateTime } from "luxon";
import { ascendantAt, julianDay, positionsAt } from "../server/ephemeris";
import { createPlanetContext } from "@shared/planet-context";
import { jupiterRelationships } from "@shared/jupiter-relationships";
import { SIGNS } from "@shared/astro";

type Entry = { id: string; name: string; date: string; jd: number; zone: string; latitude: number;
  longitude: number; countryKey: string; country: string; place: string; adb: string; wikipedia: string };
type Group = "classical" | "node_only" | "empty";
type Row = Entry & { priority: string; group: Group; nominal: unknown; sensitivity: unknown };

if (process.argv.length !== 3) throw new Error("Expected public-input JSON from prepare-gulika-discovery.py");
const input = JSON.parse(readFileSync(process.argv[2], "utf8")) as Entry[];
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return files(path);
  return /\.(md|json)$/i.test(entry.name) && !entry.name.startsWith("jupiter-ninth-") ? [path] : [];
});
const corpusPaths = [...files("docs"), ...files("scripts/fixtures")].sort();
const corpus = corpusPaths.map((p) => readFileSync(p, "utf8")).join("\n").toLocaleLowerCase("en-US");
const corpusHash = createHash("sha256").update(corpus).digest("hex");
const groups: Record<Group, Row[]> = { classical: [], node_only: [], empty: [] };
const opts = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
let excludedPrior = 0, nominalFifth = 0, stableFifth = 0, errors = 0;
for (const row of input) {
  if (corpus.includes(row.name.toLocaleLowerCase("en-US"))) { excludedPrior++; continue; }
  try {
    const birth = DateTime.fromISO(row.date, { zone: row.zone });
    if (!birth.isValid || Math.abs(julianDay(birth.toUTC()) - row.jd) * 86400 > 3) throw new Error("UTC instant mismatch");
    const frameAt = (minutes: number) => {
      const jd = julianDay(birth.plus({ minutes }).toUTC());
      return jupiterRelationships(createPlanetContext(positionsAt(jd, opts), {
        kind: "natal", division: "D1", ascendant: ascendantAt(jd, row.latitude, row.longitude, opts),
        ayanamsa: "lahiri", nodeType: "mean", houseMethod: "rashi",
      }));
    };
    const nominal = frameAt(0);
    if (nominal.house !== 5) continue;
    nominalFifth++;
    const minus5 = frameAt(-5), plus5 = frameAt(5);
    if (minus5.house !== 5 || plus5.house !== 5) continue;
    stableFifth++;
    const ninth = nominal.targets.find((t) => t.fromJupiter === 9)!;
    const group: Group = ninth.classicalOccupants.length ? "classical" : ninth.nodeOccupants.length ? "node_only" : "empty";
    const minus15 = frameAt(-15), plus15 = frameAt(15);
    const sensitivity = (frame: ReturnType<typeof frameAt>) => {
      const target = frame.targets.find((t) => t.fromJupiter === 9)!;
      return { risingSign: SIGNS[frame.risingSign], jupiterHouse: frame.house,
        ninthSign: SIGNS[target.signIndex], classical: target.classicalOccupants, nodes: target.nodeOccupants };
    };
    groups[group].push({ ...row, group,
      priority: createHash("sha256").update(`Nadi-jupiter-ninth-2026:${row.id}`, "utf8").digest("hex"),
      nominal: { risingSign: SIGNS[nominal.risingSign], jupiterSign: SIGNS[nominal.signIndex], jupiterHouse: nominal.house,
        ninthSign: SIGNS[ninth.signIndex], classical: ninth.classicalOccupants, nodes: ninth.nodeOccupants },
      sensitivity: { minus15: sensitivity(minus15), minus5: sensitivity(minus5),
        plus5: sensitivity(plus5), plus15: sensitivity(plus15) },
    });
  } catch { errors++; }
}
const select = (rows: Row[]) => {
  const countries = new Map<string, number>();
  const chosen: Row[] = [];
  for (const row of rows.sort((a, b) => a.priority.localeCompare(b.priority))) {
    if ((countries.get(row.countryKey) ?? 0) >= 2) continue;
    chosen.push(row);
    countries.set(row.countryKey, (countries.get(row.countryKey) ?? 0) + 1);
    if (chosen.length === 6) break;
  }
  return chosen;
};
console.log(JSON.stringify({ protocol: "docs/jupiter-ninth-research-protocol.md", inputCount: input.length,
  priorCorpusSha256: corpusHash, excludedPrior, nominalFifth, stableFifth, errors,
  available: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])),
  selected: { classical: select(groups.classical), node_only: select(groups.node_only), empty: select(groups.empty) } }, null, 2));
