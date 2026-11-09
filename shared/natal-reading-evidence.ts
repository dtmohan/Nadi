/** Natal-only projections of the same Parashari and KP event-rule engines. */
import type { ChartResult } from "./schema";
import { EVENT_MATTERS, matterOf } from "./events";
import { eventReadingAllowed } from "./event-reading";
import { createManleyFrameScorer, manleyNatalEvidence, MANLEY_TOPICS, type ManleyNatalEvidence } from "./manley-evidence";
import { kpNatalFrame } from "./kp";
import { AURORA_MATTERS, auroraNatalEvidence, type AuroraNatalEvidence } from "./kp-aurora";
import { auroraV2NatalEvidence, type AuroraV2NatalEvidence } from "./kp-aurora-v2";
import type { Planet } from "./astro";
import { parashariVargaEvidence, type ParashariVargaEvidence } from "./parashari-varga-evidence";
import { parashariPromiseNatal } from "./parashari-promise";
import { parashariSpecificNatal, type ParashariSpecificNatal } from "./parashari-specific";
import { createParashariFoundationScorer, type ParashariFoundations } from "./parashari-hierarchy";
import { createKpCuspScorer } from "./kp-event-evidence";
import { kpPlanetContext, natalPlanetContext, planetPositions } from "./planet-context";
import { createKpEventNatalRules, kpRuleFrame, type KpEventNatalRules } from "./kp-event-natal-rules";
import { areaSeason, lifeAsOf, sensitiveGate } from "./life-stage";
import { normaliseParashariHouseMethod } from "./schema";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "./parashari";
import { createParashariNatalCatalogue, type ParashariNatalCatalogue } from "./parashari-event-natal-rules";
import { createAdditionalSchoolNatalRules } from "./additional-school-event-rules";
import { computeGulikaReading, computePrasna, computeProgeny } from "./rules-prasna";
import { gulikaNatalClues } from "./gulika-clues";
import { normaliseGulikaMethod } from "./gulika-methods";
import { computeKarmajiva, karmajivaCareerContext } from "./karmajiva";

type NatalChart = Pick<ChartResult, "positions" | "jaimini" | "utc" | "chart" | "now" | "kp" | "shadbala" | "dasaStarts">;

/** Ordinary BNN/Jaimini/Prasna snapshots projected to event areas. */
export function additionalSchoolNatalConditions(result: ChartResult) {
  const context = natalPlanetContext(result), lagna = Math.floor(result.jaimini.lagna.lon / 30);
  const gender = result.chart.gender;
  const progeny = gender === "male" || gender === "female" ? computeProgeny(result.positions, gender) : undefined;
  const catalogue = createAdditionalSchoolNatalRules({ bnn: result.reading, jaimini: result.jaimini,
    brihatJataka: karmajivaCareerContext(computeKarmajiva(context, lagna)),
    prasnaHouses: computePrasna(context, lagna),
    gulikaMethod: normaliseGulikaMethod(result.chart.gulikaMethod),
    gulika: result.gulika ? computeGulikaReading(result.gulika, lagna) : undefined,
    gulikaClues: result.gulika ? gulikaNatalClues(context, result.gulika, lagna,
      progeny ? { kind: progeny.kind, signIndex: progeny.signIndex } : undefined) : undefined,
    withhold: sensitiveGate(result.chart, result.utc, result.now.asOf).withheld,
    allowed: (matter) => eventReadingAllowed(matter, result.utc, result.now.asOf, result.chart),
    areaAllowed: (area) => areaSeason(area, result.utc, lifeAsOf(result.chart, result.now.asOf), result.chart).inSeason,
  });
  return EVENT_MATTERS.flatMap(({ id }) => { const evidence = catalogue(id); return evidence ? [evidence] : []; });
}

/** Every registered Manley topic appears automatically if the chart's
 * ordinary reading policy permits it. No period or event date is fabricated. */
export type ParashariNatalConditions = ManleyNatalEvidence & {
  varga?: ParashariVargaEvidence;
  support?: ReturnType<typeof parashariPromiseNatal>;
  specific?: ParashariSpecificNatal;
  foundation?: ParashariFoundations;
  ordinary?: ParashariNatalCatalogue;
};

export function parashariNatalConditions(result: NatalChart): ParashariNatalConditions[] {
  const context = natalPlanetContext(result);
  const positions = planetPositions(context);
  const scorer = createManleyFrameScorer(context, result.jaimini.lagna.lon);
  const foundations = createParashariFoundationScorer(context, result.jaimini.lagna.lon);
  const full = computeParashari(context, result.jaimini.lagna.lon, result.utc, lifeAsOf(result.chart, result.now.asOf),
    result.shadbala, result.dasaStarts, DEFAULT_ASPECT_FLOOR, sensitiveGate(result.chart, result.utc, result.now.asOf).withheld,
    normaliseParashariHouseMethod(result.chart.parashariHouseMethod));
  const ordinary = createParashariNatalCatalogue(full,
    (matter) => eventReadingAllowed(matter, result.utc, result.now.asOf, result.chart));
  return Object.keys(MANLEY_TOPICS).flatMap((matter) => {
    if (!eventReadingAllowed(matter, result.utc, result.now.asOf, result.chart)) return [];
    const e = manleyNatalEvidence(matter, context, result.jaimini.lagna.lon, scorer);
    if (!e) return [];
    const v = parashariVargaEvidence({ label: matterOf(matter).label, date: result.chart.birthDate, matter },
      context, result.jaimini.lagna.lon, null);
    return [{ ...e, varga: v,
      support: v ? parashariPromiseNatal(v, positions) : undefined,
      specific: v ? parashariSpecificNatal(v, positions) : undefined, foundation: foundations(matter), ordinary: ordinary(matter) }];
  });
}

export interface KpNatalConditions {
  matter: string;
  label: string;
  basic: { cusp: number; cuspSubLord: Planet; matterHouses: number[]; signified: number[]; matched: boolean; deniedAtCusp: boolean };
  strict?: AuroraNatalEvidence;
  mixed?: AuroraV2NatalEvidence;
  natalRules?: KpEventNatalRules;
}

/** The basic cusp is available for each registered event matter. The two
 * separately named Aurora scripts are available only for their mapped topics.
 * Period and transit layers are not assessed without an actual event date. */
export function kpNatalConditions(result: NatalChart): KpNatalConditions[] {
  const { cusps, planets, significators } = kpNatalFrame(kpPlanetContext(result), result.kp.cusps);
  const scoreCusp = createKpCuspScorer(cusps, significators);
  const natalRules = createKpEventNatalRules(kpRuleFrame(cusps, planets, significators), {
    withhold: sensitiveGate(result.chart, result.utc, result.now.asOf).withheld,
    allowed: (matter) => eventReadingAllowed(matter, result.utc, result.now.asOf, result.chart),
  });
  return EVENT_MATTERS.flatMap(({ id: matter, label, houses, cusp }) => {
    if (!eventReadingAllowed(matter, result.utc, result.now.asOf, result.chart)) return [];
    const check = scoreCusp(houses, cusp);
    if (!check.cuspSubLord || check.promised === undefined) throw new Error(`Missing KP cusp for ${matter}`);
    const hasAurora = AURORA_MATTERS.some((topic) => topic.matter === matter);
    const strict = hasAurora ? auroraNatalEvidence({ matter, planets, cusps, significators }) : undefined;
    const mixed = hasAurora ? auroraV2NatalEvidence({ matter, planets, cusps }) : undefined;
    return [{ matter, label, basic: { cusp, cuspSubLord: check.cuspSubLord, matterHouses: houses,
      signified: check.cuspSignified, matched: check.promised, deniedAtCusp: check.deniedAtCusp }, strict, mixed,
      natalRules: natalRules(matter, houses, cusp) }];
  });
}
