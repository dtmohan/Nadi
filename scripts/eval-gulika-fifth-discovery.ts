// Reproduce calculations for the frozen public discovery list. This intentionally contains
// no person's family outcome: research sources and unresolved cases are in the review.
// Run: node --import tsx scripts/eval-gulika-fifth-discovery.ts
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { ascendantAt, gulikaComparisons, julianDay, positionsAt } from "../server/ephemeris";
import { SIGNS } from "@shared/astro";
import { GULIKA_METHODS } from "@shared/gulika-methods";
import { parashariVargaEvidence } from "@shared/parashari-varga-evidence";
import { parashariPromiseNatal } from "@shared/parashari-promise";
import type { SunriseDefinition } from "@shared/schema";

type Entry = { name: string; date: string; jd: number; zone: string; latitude: number; longitude: number };
const input = JSON.parse(readFileSync("docs/gulika-fifth-discovery-screen.json", "utf8")) as { selected: Entry[] };
const outcomesChecked = new Set([
  "Witold Conti", "Ray Crowe", "Guy Camberabero", "Celia Cruz", "Bobby Clancy",
  "Cachimbal", "Nicole Calfan", "Mercedes Cabanillas",
]);
const sunrises: SunriseDefinition[] = ["edge", "centre", "edge-true", "centre-true"];
const offsets = [-15, -5, 0, 5, 15];

const results = input.selected.map((entry) => {
  const birth = DateTime.fromISO(entry.date, { zone: entry.zone });
  if (!birth.isValid || Math.abs(julianDay(birth.toUTC()) - entry.jd) * 86400 > 3)
    throw new Error(`Inconsistent published time and UTC instant: ${entry.name}`);
  function at(minutes: number, ayanamsa = "lahiri", sunrise: SunriseDefinition = "edge") {
    const jd = julianDay(birth.plus({ minutes }).toUTC());
    const options = { ayanamsa, nodeType: "mean" as const, sunrise };
    const ascendant = Math.floor(ascendantAt(jd, entry.latitude, entry.longitude, options) / 30);
    const comparisons = gulikaComparisons(jd, entry.latitude, entry.longitude, entry.zone, options);
    const values = Object.fromEntries(GULIKA_METHODS.map(({ id }) => {
      const point = comparisons[id];
      return [id, { sign: SIGNS[point.signIndex], longitude: point.lon,
        house: (point.signIndex - ascendant + 12) % 12 + 1, day: point.day }];
    }));
    return { offsetMinutes: minutes, ascendant: SIGNS[ascendant], values };
  }
  const samples = offsets.map((offset) => at(offset));
  const nominal = samples[2];
  const sampledEveryMinute = outcomesChecked.has(entry.name)
    ? Array.from({ length: 31 }, (_, i) => at(i - 15)) : [];
  const variants = outcomesChecked.has(entry.name)
    ? ["lahiri", "raman"].flatMap((ayanamsa) => sunrises.map((sunrise) => {
      const sample = at(0, ayanamsa, sunrise);
      return { ayanamsa, sunrise, ascendant: sample.ascendant, ...sample.values["kerala-ghati"] };
    })) : [];
  // This is a descriptive audit of the existing Parashari subset, without dates, timing
  // scores or any invented rule that cancels a Gulika statement.
  const natalChildrenSubset = outcomesChecked.has(entry.name) ? (() => {
    const jd = julianDay(birth.toUTC());
    const options = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
    const positions = positionsAt(jd, options);
    const ascendant = ascendantAt(jd, entry.latitude, entry.longitude, options);
    const evidence = parashariVargaEvidence({ label: "Children", date: "", matter: "child" }, positions, ascendant, null);
    if (!evidence) throw new Error(`Missing child evidence: ${entry.name}`);
    return { ...parashariPromiseNatal(evidence, positions), rashi: evidence.rashi, d7: evidence.varga };
  })() : null;
  return {
    name: entry.name, nominal, samples,
    everyMinuteWithin15: sampledEveryMinute.length ? {
      minutesTested: sampledEveryMinute.length,
      allFifth: sampledEveryMinute.every((s) => s.values["kerala-ghati"].house === 5),
      allSameDayNight: sampledEveryMinute.every((s) => s.values["kerala-ghati"].day === nominal.values["kerala-ghati"].day),
    } : null,
    nominalAyanamsaSunriseVariants: variants,
    natalChildrenSubset,
  };
});
console.log(JSON.stringify({ protocol: "docs/gulika-fifth-discovery-protocol.md",
  note: "Minute samples and nominal variants are sensitivity checks, not proof of exact birth times; family outcomes are documented separately.", results }, null, 2));
