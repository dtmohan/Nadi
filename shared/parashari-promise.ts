/**
 * Experimental, source-informed event-ranking rule. The five equal points
 * are the app's operationalisation, not a numerical formula in the sources.
 * See docs/parashari-ranking-protocol.md for exact scope and limitations.
 */
import { drishtiQuarters, naturalBenefic, type Planet, type PlanetPosition } from "./astro";
import type { ParashariVargaEvidence } from "./parashari-varga-evidence";

export interface ParashariPromiseCheck {
  label: string;
  date: string;
  matter: "marriage" | "child" | "job";
  division: "D7" | "D9" | "D10";
  /** Scoring input order: D1, division, dasa, bhukti, double transit. */
  factors: [boolean, boolean, boolean, boolean, boolean];
  score: number;
  max: 5;
  d1Support: string[];
  d1Strain: string[];
  divisionSupport: string[];
  divisionStrain: string[];
  periods: Array<{ level: "dasa" | "bhukti"; planet: Planet; links: string[] }>;
  /** Targets touched by both Jupiter and Saturn in the event's sky. */
  doubleTransitTargets: string[];
}

/** The date-independent portion of v1/v2/v3; shared with the chart reading. */
export function parashariPromiseNatal(evidence: ParashariVargaEvidence, natal: PlanetPosition[]) {
  const varga = evidence.varga;
  const benefic = (p: Planet) => {
    const position = natal.find((x) => x.planet === p);
    return Boolean(position && naturalBenefic(position, natal));
  };
  const divisionSupport: string[] = [];
  const inHouse = varga.occupants.filter(benefic);
  const aspects = varga.fullAspects.filter(benefic);
  if (inHouse.length) divisionSupport.push(`${inHouse.join(", ")} in ${varga.chart} house ${varga.house}`);
  if (aspects.length) divisionSupport.push(`${aspects.join(", ")} aspect ${varga.chart} house ${varga.house}`);
  if (varga.lordDignity === "own sign" || varga.lordDignity === "exaltation sign")
    divisionSupport.push(`${varga.houseLord}, ${varga.chart} house ${varga.house} lord, in ${varga.lordDignity}`);
  const divisionStrain = varga.lordDignity === "debilitation sign"
    ? [`${varga.houseLord}, ${varga.chart} house ${varga.house} lord, in debilitation sign`] : [];
  return { d1Support: evidence.rashiAssessment.support, d1Strain: evidence.rashiAssessment.strain, divisionSupport, divisionStrain };
}

export function parashariPromiseCheck(
  evidence: ParashariVargaEvidence | undefined,
  outcome: "favourable" | "unfavourable" | "mixed" | undefined,
  natal: PlanetPosition[],
  eventSky: Array<Pick<PlanetPosition, "planet" | "signIndex">>,
): ParashariPromiseCheck | undefined {
  if (!evidence || !["marriage", "child", "job"].includes(evidence.matter)
    || (outcome && outcome !== "favourable") || evidence.periods.length < 2) return undefined;
  const { rashi } = evidence;
  const { divisionSupport, divisionStrain } = parashariPromiseNatal(evidence, natal);
  const periods = evidence.periods.slice(0, 2).map((p) => ({
    level: p.level as "dasa" | "bhukti", planet: p.planet,
    // Ascendant-lord links are displayed in the evidence, but this fixed,
    // narrower scoring rule counts matter-house links alone.
    links: p.links.filter((link) => link.includes(`house ${rashi.house}`)),
  }));
  const jupiter = eventSky.find((p) => p.planet === "Jupiter");
  const saturn = eventSky.find((p) => p.planet === "Saturn");
  if (!jupiter || !saturn) throw new Error("Event sky must contain Jupiter and Saturn");
  const touches = (p: typeof jupiter, target: number) => p.signIndex === target || drishtiQuarters(p.planet, p.signIndex, target) >= 4;
  const targets = [
    { sign: rashi.houseSign, label: `D1 house ${rashi.house}` },
    { sign: rashi.lordSign, label: `D1 house ${rashi.house} lord ${rashi.houseLord}` },
  ];
  const doubleTransitTargets = targets.filter((t) => touches(jupiter, t.sign) && touches(saturn, t.sign)).map((t) => t.label);
  const factors: ParashariPromiseCheck["factors"] = [
    evidence.rashiAssessment.support.length > 0, divisionSupport.length > 0,
    periods[0].links.length > 0, periods[1].links.length > 0,
    doubleTransitTargets.length > 0,
  ];
  return {
    label: evidence.label, date: evidence.date, matter: evidence.matter as ParashariPromiseCheck["matter"],
    division: evidence.division, factors, score: factors.filter(Boolean).length, max: 5,
    d1Support: evidence.rashiAssessment.support, d1Strain: evidence.rashiAssessment.strain,
    divisionSupport, divisionStrain, periods, doubleTransitTargets,
  };
}
