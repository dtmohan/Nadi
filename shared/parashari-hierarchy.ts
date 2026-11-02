/**
 * A deliberately partial, conservative research screen. It is an application
 * convention, not a published yes/no promise formula. D1 and the event's own
 * division must each have support without a listed contrary indication before
 * the period links can advance. Missing or mixed indications are unresolved.
 */
import { drishtiQuarters, ENEMIES, EXALTATION, FRIENDS, houseFrom, naturalBenefic, OWN_SIGNS, SIGN_LORD, type Planet, type PlanetPosition } from "./astro";
import { rashiHouseView } from "./house-view";
import { judgeBhavas } from "./parashari-houses";
import { manleyTopicFor, type ManleyDivision, type ManleyEvidence, type ManleyFrame } from "./manley-evidence";
import { signDignity, vargaSignAt, type PlacementDignity } from "./parashari-varga-evidence";
import { asPlanetContext, planetPositions, type PlanetInput } from "./planet-context";
import { createDivisionalPlanetContext } from "./divisional-planet-context";

export type HierarchyStatus = "supported" | "mixed" | "unresolved";
export const CROSS_CHART_SOURCE = {
  label: "P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach, §§6.5–6.6 and worked example 5",
  url: "https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=74",
};
export interface HierarchyNatalCheck {
  house: number;
  status: HierarchyStatus;
  support: string[];
  strain: string[];
}
export interface CrossChartPlanet {
  planet: Planet;
  roles: Array<"D1 house lord" | "divisional house lord" | "natural significator">;
  d1: CrossChartPlacement;
  division: CrossChartPlacement;
}
export interface CrossChartPlacement {
  sign: number;
  house: number;
  dignity: PlacementDignity;
  signLord: Planet;
  /** Natural relation to the sign lord, not a combined strength judgment. */
  relation: "own" | "friend" | "enemy" | "neutral";
}
export interface CrossChartEvidence {
  /** One entry per planet; multiple roles do not become independent evidence. */
  planets: CrossChartPlanet[];
  periods: Array<{ level: "dasa" | "bhukti" | "antara"; planet: Planet; d1: string[]; division: string[]; linked: boolean }>;
  /** Sequential timing clues only, not a natal promise or a candidate verdict. */
  timing: { first: boolean; third: boolean };
}
export interface HierarchyEvent {
  label: string;
  date: string;
  matter: string;
  division: ManleyDivision;
  moment?: ManleyEvidence["moment"];
  d1: HierarchyNatalCheck;
  divisionCheck: HierarchyNatalCheck;
  /** Source-informed cross-chart clues, even when the older strict gate stops. */
  crossChart?: CrossChartEvidence;
  periods: Array<{ level: "dasa" | "bhukti" | "antara"; planet: Planet; d1: string[]; division: string[]; passes: boolean }>;
  /** Each flag includes every preceding event-level gate. */
  passes: { d1: boolean; division: boolean; major: boolean; sub: boolean; third: boolean };
}
export interface ParashariFoundations {
  d1: HierarchyNatalCheck;
  divisionCheck: HierarchyNatalCheck;
  planets: CrossChartPlanet[];
}

const status = (support: string[], strain: string[]): HierarchyStatus =>
  support.length && strain.length ? "mixed" : support.length ? "supported" : "unresolved";
const links = (frame: ManleyFrame) => [...frame.primary.house, ...frame.primary.houseLord, ...frame.primary.karaka];

/** Shared natal foundations; no period or event date is required. */
export function createParashariFoundationScorer(input: PlanetInput, lagna: number) {
  const context = asPlanetContext(input);
  const natal = planetPositions(context);
  const asc = vargaSignAt("D1", lagna);
  const judgements = judgeBhavas(natal, rashiHouseView(asc, natal), {
    aspect: (p, from, to) => drishtiQuarters(p, from, to) >= 4 ? 4 : 0,
    benefic: naturalBenefic,
  });
  const cache = new Map<string, ParashariFoundations>();
  return (matter: string): ParashariFoundations | undefined => {
    const topic = manleyTopicFor(matter);
    if (!topic) return undefined;
    let foundation = cache.get(matter);
    if (!foundation) {
      const division = createDivisionalPlanetContext(context, topic.division, lagna);
      const judgement = judgements[topic.house - 1];
      const d1: HierarchyNatalCheck = { house: topic.house, status: status(judgement.support, judgement.strain),
        support: judgement.support, strain: judgement.strain };
      const houseSign = (division.ascendantSign + topic.house - 1) % 12;
      const lord = SIGN_LORD[houseSign];
      const position = natal.find((p) => p.planet === lord);
      if (!position) throw new Error(`Missing ${lord} in ${topic.division}`);
      const lordSign = division.requirePlanet(lord).signIndex;
      const benefit = natal.filter((p) => naturalBenefic(p, natal));
      const occupants = benefit.filter((p) => division.requirePlanet(p.planet).signIndex === houseSign).map((p) => p.planet);
      const aspects = benefit.filter((p) => {
        const from = division.requirePlanet(p.planet).signIndex;
        return from !== houseSign && division.fullAspect(p.planet, houseSign);
      }).map((p) => p.planet);
      const support: string[] = [];
      if (occupants.length) support.push(`${occupants.join(", ")} in ${topic.division} house ${topic.house}`);
      if (aspects.length) support.push(`${aspects.join(", ")} fully aspect${aspects.length === 1 ? "s" : ""} ${topic.division} house ${topic.house}`);
      if ((OWN_SIGNS[lord] ?? []).includes(lordSign)) support.push(`${lord}, the house lord, in its own sign`);
      else if (EXALTATION[lord]?.sign === lordSign) support.push(`${lord}, the house lord, in its exaltation sign`);
      const strain = EXALTATION[lord] && (EXALTATION[lord].sign + 6) % 12 === lordSign
        ? [`${lord}, the house lord, in its debilitation sign`] : [];
      const divisionCheck: HierarchyNatalCheck = { house: topic.house, status: status(support, strain), support, strain };
      const divisionAsc = division.ascendantSign;
      const natalLord = SIGN_LORD[(asc + topic.house - 1) % 12];
      const roles = new Map<Planet, CrossChartPlanet["roles"]>();
      const addRole = (planet: Planet, role: CrossChartPlanet["roles"][number]) => {
        const existing = roles.get(planet) ?? [];
        existing.push(role);
        roles.set(planet, existing);
      };
      addRole(natalLord, "D1 house lord");
      addRole(lord, "divisional house lord");
      for (const karaka of topic.karakas) addRole(karaka, "natural significator");
      const planets = Array.from(roles.entries()).map(([planet, planetRoles]) => {
        const p = natal.find((x) => x.planet === planet);
        if (!p) throw new Error(`Missing ${planet} in cross-chart evidence`);
        const d1Sign = vargaSignAt("D1", p.lon), divisionSign = division.requirePlanet(planet).signIndex;
        const place = (sign: number, ascendant: number): CrossChartPlacement => {
          const signLord = SIGN_LORD[sign];
          const relation = signLord === planet ? "own" : FRIENDS[planet].includes(signLord) ? "friend"
            : ENEMIES[planet].includes(signLord) ? "enemy" : "neutral";
          return { sign, house: houseFrom(ascendant, sign), dignity: signDignity(planet, sign), signLord, relation };
        };
        return { planet, roles: planetRoles,
          d1: place(d1Sign, asc), division: place(divisionSign, divisionAsc) };
      });
      foundation = { d1, divisionCheck, planets };
      cache.set(matter, foundation);
    }
    return foundation;
  };
}

/** Cached natal foundations are shared by every actual and trial date. */
export function createParashariHierarchyScorer(natal: PlanetInput, lagna: number) {
  const foundationFor = createParashariFoundationScorer(natal, lagna);
  return (evidence: ManleyEvidence | undefined, outcome?: "favourable" | "unfavourable" | "mixed"): HierarchyEvent | undefined => {
    if (!evidence || (outcome && outcome !== "favourable") || !evidence.antara || evidence.periods.length !== 2) return undefined;
    const foundation = foundationFor(evidence.matter);
    if (!foundation) return undefined;
    const basic = hierarchyEventFromFoundations(evidence, foundation);
    return { ...basic, crossChart: crossChartEvidence(evidence, foundation.planets) };
  };
}

/**
 * Inspect Manley's six families of timing clues without claiming they prove
 * the natal promise. In particular a natal house lord retains that role in
 * the relevant division, even when it has no primary divisional-house link.
 */
export function crossChartEvidence(evidence: ManleyEvidence, planets: CrossChartPlanet[]): CrossChartEvidence {
  if (!evidence.antara || evidence.periods.length !== 2) throw new Error("Cross-chart evidence requires three periods");
  const periods = [...evidence.periods, evidence.antara].map((p) => {
    const d1 = p.frames.find((f) => f.chart === "D1");
    const division = p.frames.find((f) => f.chart === evidence.division);
    const d1Links = d1 ? links(d1) : [];
    const divisionLinks = division ? [...links(division), ...division.supporting.ascendant,
      ...division.supporting.natalHouseLord, ...division.supporting.bhavat] : [];
    return { level: p.level, planet: p.planet, d1: d1Links, division: divisionLinks,
      linked: d1Links.length > 0 && divisionLinks.length > 0 };
  });
  const first = periods[0].linked && periods[1].linked;
  return { planets, periods, timing: { first, third: first && periods[2].linked } };
}

/** Event-level gate, exported separately so predecessor behavior is testable. */
export function hierarchyEventFromFoundations(
  evidence: ManleyEvidence, foundation: { d1: HierarchyNatalCheck; divisionCheck: HierarchyNatalCheck },
): HierarchyEvent {
  if (!evidence.antara || evidence.periods.length !== 2) throw new Error("Hierarchy requires three period levels");
  const d1 = foundation.d1.status === "supported";
  const division = d1 && foundation.divisionCheck.status === "supported";
  let eligible = division;
  const periods = [...evidence.periods, evidence.antara].map((p) => {
    const d1Frame = p.frames.find((f) => f.chart === "D1");
    const divisionFrame = p.frames.find((f) => f.chart === evidence.division);
    const d1Links = d1Frame ? links(d1Frame) : [];
    const divisionLinks = divisionFrame ? links(divisionFrame) : [];
    eligible = eligible && !!d1Links.length && !!divisionLinks.length;
    return { level: p.level, planet: p.planet, d1: d1Links, division: divisionLinks, passes: eligible };
  });
  return { label: evidence.label, date: evidence.date, matter: evidence.matter, division: evidence.division,
    moment: evidence.moment, d1: foundation.d1, divisionCheck: foundation.divisionCheck, periods,
    passes: { d1, division, major: periods[0].passes, sub: periods[1].passes, third: periods[2].passes } };
}

export const HIERARCHY_DIVISIONS: ManleyDivision[] = ["D4", "D7", "D9", "D10", "D24"];
export interface HierarchySelection { matter?: string; outcome?: "favourable" | "unfavourable" | "mixed" }
export interface HierarchyWindowStage { label: string; indices: number[] }

/**
 * Intersect candidate sets, rather than retaining only a score or substituting
 * an unrelated division. Missing evidence for an eligible event is a failure
 * to establish this screen, never evidence that the event was impossible.
 */
export function hierarchyWindowStages(
  selections: HierarchySelection[], candidates: Array<Array<HierarchyEvent | null>>,
): { eligible: number[]; unassessed: number[]; stages: HierarchyWindowStage[] } {
  const eligible = selections.flatMap((e, i) => manleyTopicFor(e.matter) && (!e.outcome || e.outcome === "favourable") ? [i] : []);
  const unassessed = selections.flatMap((_, i) => eligible.includes(i) ? [] : [i]);
  if (!eligible.length) return { eligible, unassessed, stages: [] };
  let indices = candidates.flatMap((events, i) => eligible.every((e) => events[e]?.passes.d1) ? [i] : []);
  const stages: HierarchyWindowStage[] = [{ label: "D1 · all assessed events", indices }];
  for (const division of HIERARCHY_DIVISIONS) {
    const eventIndices = eligible.filter((i) => manleyTopicFor(selections[i].matter)?.division === division);
    if (!eventIndices.length) continue;
    indices = indices.filter((i) => eventIndices.every((e) => candidates[i][e]?.passes.sub));
    stages.push({ label: `${division} · natal and first two periods`, indices });
  }
  indices = indices.filter((i) => eligible.every((e) => candidates[i][e]?.passes.third));
  stages.push({ label: "Third period · all assessed events", indices });
  return { eligible, unassessed, stages };
}
