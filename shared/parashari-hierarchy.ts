/**
 * A deliberately partial, conservative research screen. It is an application
 * convention, not a published yes/no promise formula. D1 and the event's own
 * division must each have support without a listed contrary indication before
 * the period links can advance. Missing or mixed indications are unresolved.
 */
import { drishtiQuarters, EXALTATION, naturalBenefic, OWN_SIGNS, SIGN_LORD, type Planet, type PlanetPosition } from "./astro";
import { rashiHouseView } from "./house-view";
import { judgeBhavas } from "./parashari-houses";
import { manleyTopicFor, type ManleyDivision, type ManleyEvidence, type ManleyFrame } from "./manley-evidence";
import { vargaSignAt } from "./parashari-varga-evidence";

export type HierarchyStatus = "supported" | "mixed" | "unresolved";
export interface HierarchyNatalCheck {
  house: number;
  status: HierarchyStatus;
  support: string[];
  strain: string[];
}
export interface HierarchyEvent {
  label: string;
  date: string;
  matter: string;
  division: ManleyDivision;
  moment?: ManleyEvidence["moment"];
  d1: HierarchyNatalCheck;
  divisionCheck: HierarchyNatalCheck;
  periods: Array<{ level: "dasa" | "bhukti" | "antara"; planet: Planet; d1: string[]; division: string[]; passes: boolean }>;
  /** Each flag includes every preceding event-level gate. */
  passes: { d1: boolean; division: boolean; major: boolean; sub: boolean; third: boolean };
}

const status = (support: string[], strain: string[]): HierarchyStatus =>
  support.length && strain.length ? "mixed" : support.length ? "supported" : "unresolved";
const links = (frame: ManleyFrame) => [...frame.primary.house, ...frame.primary.houseLord, ...frame.primary.karaka];

/** Cached natal foundations are shared by every actual and trial date for one candidate. */
export function createParashariHierarchyScorer(natal: PlanetPosition[], lagna: number) {
  const asc = vargaSignAt("D1", lagna);
  const judgements = judgeBhavas(natal, rashiHouseView(asc, natal), {
    aspect: (p, from, to) => drishtiQuarters(p, from, to) >= 4 ? 4 : 0,
    benefic: naturalBenefic,
  });
  const cache = new Map<string, { d1: HierarchyNatalCheck; divisionCheck: HierarchyNatalCheck }>();
  return (evidence: ManleyEvidence | undefined, outcome?: "favourable" | "unfavourable" | "mixed"): HierarchyEvent | undefined => {
    if (!evidence || (outcome && outcome !== "favourable")) return undefined;
    const topic = manleyTopicFor(evidence.matter);
    if (!topic || !evidence.antara || evidence.periods.length !== 2) return undefined;
    let foundation = cache.get(evidence.matter);
    if (!foundation) {
      const judgement = judgements[topic.house - 1];
      const d1: HierarchyNatalCheck = { house: topic.house, status: status(judgement.support, judgement.strain),
        support: judgement.support, strain: judgement.strain };
      const houseSign = (vargaSignAt(topic.division, lagna) + topic.house - 1) % 12;
      const lord = SIGN_LORD[houseSign];
      const position = natal.find((p) => p.planet === lord);
      if (!position) throw new Error(`Missing ${lord} in ${topic.division}`);
      const lordSign = vargaSignAt(topic.division, position.lon);
      const benefit = natal.filter((p) => naturalBenefic(p, natal));
      const occupants = benefit.filter((p) => vargaSignAt(topic.division, p.lon) === houseSign).map((p) => p.planet);
      const aspects = benefit.filter((p) => {
        const from = vargaSignAt(topic.division, p.lon);
        return from !== houseSign && drishtiQuarters(p.planet, from, houseSign) >= 4;
      }).map((p) => p.planet);
      const support: string[] = [];
      if (occupants.length) support.push(`${occupants.join(", ")} in ${topic.division} house ${topic.house}`);
      if (aspects.length) support.push(`${aspects.join(", ")} fully aspect ${topic.division} house ${topic.house}`);
      if ((OWN_SIGNS[lord] ?? []).includes(lordSign)) support.push(`${lord}, the house lord, in its own sign`);
      else if (EXALTATION[lord]?.sign === lordSign) support.push(`${lord}, the house lord, in its exaltation sign`);
      const strain = EXALTATION[lord] && (EXALTATION[lord].sign + 6) % 12 === lordSign
        ? [`${lord}, the house lord, in its debilitation sign`] : [];
      const divisionCheck: HierarchyNatalCheck = { house: topic.house, status: status(support, strain), support, strain };
      foundation = { d1, divisionCheck };
      cache.set(evidence.matter, foundation);
    }
    return hierarchyEventFromFoundations(evidence, foundation);
  };
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
    moment: evidence.moment, ...foundation, periods,
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
