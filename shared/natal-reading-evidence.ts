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

type NatalChart = Pick<ChartResult, "positions" | "jaimini" | "utc" | "chart" | "now" | "kp">;

/** Every registered Manley topic appears automatically if the chart's
 * ordinary reading policy permits it. No period or event date is fabricated. */
export type ParashariNatalConditions = ManleyNatalEvidence & {
  varga?: ParashariVargaEvidence;
  support?: ReturnType<typeof parashariPromiseNatal>;
  specific?: ParashariSpecificNatal;
  foundation?: ParashariFoundations;
};

export function parashariNatalConditions(result: NatalChart): ParashariNatalConditions[] {
  const context = natalPlanetContext(result);
  const positions = planetPositions(context);
  const scorer = createManleyFrameScorer(context, result.jaimini.lagna.lon);
  const foundations = createParashariFoundationScorer(context, result.jaimini.lagna.lon);
  return Object.keys(MANLEY_TOPICS).flatMap((matter) => {
    if (!eventReadingAllowed(matter, result.utc, result.now.asOf, result.chart)) return [];
    const e = manleyNatalEvidence(matter, context, result.jaimini.lagna.lon, scorer);
    if (!e) return [];
    const v = parashariVargaEvidence({ label: matterOf(matter).label, date: result.chart.birthDate, matter },
      context, result.jaimini.lagna.lon, null);
    return [{ ...e, varga: v,
      support: v ? parashariPromiseNatal(v, positions) : undefined,
      specific: v ? parashariSpecificNatal(v, positions) : undefined, foundation: foundations(matter) }];
  });
}

export interface KpNatalConditions {
  matter: string;
  label: string;
  basic: { cusp: number; cuspSubLord: Planet; matterHouses: number[]; signified: number[]; matched: boolean; deniedAtCusp: boolean };
  strict?: AuroraNatalEvidence;
  mixed?: AuroraV2NatalEvidence;
}

/** The basic cusp is available for each registered event matter. The two
 * separately named Aurora scripts are available only for their mapped topics.
 * Period and transit layers are not assessed without an actual event date. */
export function kpNatalConditions(result: NatalChart): KpNatalConditions[] {
  const { cusps, planets, significators } = kpNatalFrame(kpPlanetContext(result), result.kp.cusps);
  const scoreCusp = createKpCuspScorer(cusps, significators);
  return EVENT_MATTERS.flatMap(({ id: matter, label, houses, cusp }) => {
    if (!eventReadingAllowed(matter, result.utc, result.now.asOf, result.chart)) return [];
    const check = scoreCusp(houses, cusp);
    if (!check.cuspSubLord || check.promised === undefined) throw new Error(`Missing KP cusp for ${matter}`);
    const hasAurora = AURORA_MATTERS.some((topic) => topic.matter === matter);
    const strict = hasAurora ? auroraNatalEvidence({ matter, planets, cusps, significators }) : undefined;
    const mixed = hasAurora ? auroraV2NatalEvidence({ matter, planets, cusps }) : undefined;
    return [{ matter, label, basic: { cusp, cuspSubLord: check.cuspSubLord, matterHouses: houses,
      signified: check.cuspSignified, matched: check.promised, deniedAtCusp: check.deniedAtCusp }, strict, mixed }];
  });
}
