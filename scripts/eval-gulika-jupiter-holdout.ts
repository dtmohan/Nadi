// Reproduce observational factors on the fixed holdout. No family outcomes are read here.
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { ascendantAt, gulikaComparisons, julianDay, positionsAt } from "../server/ephemeris";
import { gulikaNatalClues } from "@shared/gulika-clues";
import { parashariVargaEvidence } from "@shared/parashari-varga-evidence";
import { parashariPromiseNatal } from "@shared/parashari-promise";
import { computeProgeny } from "@shared/rules-prasna";
import { SIGNS } from "@shared/astro";

type Entry = { id: string; name: string; date: string; jd: number; zone: string; latitude: number; longitude: number };
const selected = JSON.parse(readFileSync("docs/gulika-jupiter-holdout-screen.json", "utf8")) as { selected: { aspect: Entry[]; noAspect: Entry[] } };
const opts = { ayanamsa: "lahiri", nodeType: "mean" as const, sunrise: "edge" as const };
const results = Object.entries(selected.selected).flatMap(([group, rows]) => rows.map((row) => {
  const birth = DateTime.fromISO(row.date, { zone: row.zone });
  const samples = [-15, -5, 0, 5, 15].map((minutes) => {
    const jd = julianDay(birth.plus({ minutes }).toUTC());
    const ascLon = ascendantAt(jd, row.latitude, row.longitude, opts);
    const ascSign = Math.floor(ascLon / 30);
    const gulika = gulikaComparisons(jd, row.latitude, row.longitude, row.zone, opts)["kerala-ghati"];
    const positions = positionsAt(jd, opts);
    const beeja = computeProgeny(positions, "male"), kshetra = computeProgeny(positions, "female");
    const facts = gulikaNatalClues(positions, gulika, ascSign);
    const children = parashariVargaEvidence({ label: "Children", date: "", matter: "child" }, positions, ascLon, null);
    if (!children) throw new Error(`Missing children evidence: ${row.name}`);
    return { offsetMinutes: minutes, ascendant: SIGNS[ascSign], gulikaSign: SIGNS[gulika.signIndex],
      gulikaLongitude: gulika.lon, day: gulika.day, house: facts.house,
      jupiterSign: SIGNS[facts.jupiter.fromSign], jupiterDistance: facts.jupiter.inclusiveSignDistance,
      jupiterFullAspect: facts.jupiter.fullAspect, jupiterFifthOrNinthAspect: facts.jupiterFifthOrNinthAspect,
      jupiterSameSign: facts.jupiter.sameSign, fifth: facts.fifth,
      // Both points are calculated descriptively; this is not a sex or parenthood assumption.
      beeja: { sign: SIGNS[beeja.signIndex], sameSign: beeja.signIndex === gulika.signIndex },
      kshetra: { sign: SIGNS[kshetra.signIndex], sameSign: kshetra.signIndex === gulika.signIndex },
      parashariSubset: parashariPromiseNatal(children, positions) };
  });
  return { name: row.name, selectedGroup: group, nominal: samples[2], samples };
}));
console.log(JSON.stringify({ protocol: "docs/gulika-jupiter-holdout-protocol.md",
  limitations: "Birth instants and time sampling are conditional; no recorded life outcome or individual prediction is inferred.", results }, null, 2));
