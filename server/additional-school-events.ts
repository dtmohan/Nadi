/** Candidate-local snapshots of existing school readings for event context. */
import { computeJaimini } from "@shared/jaimini";
import { evaluate } from "@shared/rules";
import type { Gender } from "@shared/marriage";
import { computeGulikaReading, computePrasna, computeProgeny } from "@shared/rules-prasna";
import { gulikaNatalClues } from "@shared/gulika-clues";
import { normaliseGulikaMethod } from "@shared/gulika-methods";
import { areaSeason, lifeAsOf, sensitiveGate } from "@shared/life-stage";
import { eventReadingAllowed } from "@shared/event-reading";
import { createAdditionalSchoolNatalRules } from "@shared/additional-school-event-rules";
import { planetPositions, type PlanetContext } from "@shared/planet-context";
import { computeKarmajiva, karmajivaCareerContext } from "@shared/karmajiva";
import type { InsertChart } from "@shared/schema";
import { gulikaComparisons, specialLagnas, whenSolarEventAvailable, type EphemerisOptions } from "./ephemeris";

export function additionalSchoolEvents(context: PlanetContext, chart: InsertChart, jd: number,
  lagna: number, birthIso: string, asOf: string, opts: EphemerisOptions) {
  const positions = planetPositions(context);
  const gender = (chart.gender as Gender) ?? "unspecified";
  const reading = evaluate(context, undefined, gender);
  let special: { horaLagna: number; ghatikaLagna: number } | undefined;
  try { special = specialLagnas(jd, chart.latitude, chart.longitude, opts); } catch { special = undefined; }
  const jaimini = computeJaimini(context, lagna, birthIso, special);
  const house = Math.floor(lagna / 30);
  const gulika = whenSolarEventAvailable(() => gulikaComparisons(jd, chart.latitude, chart.longitude, chart.timezone, opts))?.[normaliseGulikaMethod(chart.gulikaMethod)];
  const progeny = gender === "male" || gender === "female" ? computeProgeny(positions, gender) : undefined;
  const catalogue = createAdditionalSchoolNatalRules({ bnn: reading, jaimini, prasnaHouses: computePrasna(context, house),
    brihatJataka: karmajivaCareerContext(computeKarmajiva(context, house)),
    gulikaMethod: normaliseGulikaMethod(chart.gulikaMethod),
    gulika: gulika ? computeGulikaReading(gulika, house) : undefined,
    gulikaClues: gulika ? gulikaNatalClues(context, gulika, house, progeny ? { kind: progeny.kind, signIndex: progeny.signIndex } : undefined) : undefined,
    withhold: sensitiveGate(chart, birthIso, asOf).withheld,
    allowed: (matter) => eventReadingAllowed(matter, birthIso, asOf, chart),
    areaAllowed: (area) => areaSeason(area, birthIso, lifeAsOf(chart, asOf)).inSeason,
  });
  return { reading, jaimini, catalogue };
}
