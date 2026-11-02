/**
 * A descriptive Parashari cross-check, deliberately separate from KP and
 * Jaimini scoring. BPHS 7.1–8 assigns the subject of each division; the
 * house-by-house reading of D7/D9/D10 follows the named practitioner sources.
 * None of these placements is, on its own, a yes/no promise of an event.
 */
import { drishtiQuarters, EXALTATION, houseFrom, naturalBenefic, OWN_SIGNS, SIGN_LORD, type Planet, type PlanetPosition } from "./astro";
import { vargaSignAt } from "./varga-sign";
export { vargaSignAt } from "./varga-sign";
import { asPlanetContext, planetPositions, type PlanetInput } from "./planet-context";
import { createDivisionalPlanetContext, type DivisionalPlanetContext } from "./divisional-planet-context";
import { judgeBhavas } from "./parashari-houses";
import { rashiHouseView } from "./house-view";

export type PromiseVarga = "D7" | "D9" | "D10";

export const PARASHARI_VARGA_SOURCE = {
  label: "Brihat Parashara Hora Shastra 7.1–8, 11.14–16",
  url: "https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf",
};

export interface VargaTopic {
  division: PromiseVarga;
  house: number;
  subject: string;
  practitionerSource: string;
}

/** Only mappings with a relevant chart and a documented house reading are used. */
export function vargaTopicFor(matter?: string): VargaTopic | undefined {
  const mehta = "M.S. Mehta, Analysing Horoscope Through Modern Techniques";
  if (matter === "marriage") return { division: "D9", house: 7, subject: "marriage and spouse", practitionerSource: `${mehta}, ch. XVIII §3 (Navamsa)` };
  if (matter === "child") return { division: "D7", house: 5, subject: "children", practitionerSource: `${mehta}, ch. XVIII §6 (Saptamsa)` };
  if (matter === "job" || matter === "job-loss" || matter === "business") return { division: "D10", house: 10, subject: "career and standing", practitionerSource: `${mehta}, profession cases and ch. XVIII §9 (Dasamsa)` };
  return undefined;
}

export type PlacementDignity = "own sign" | "exaltation sign" | "debilitation sign" | "other";

export function signDignity(planet: Planet, sign: number): PlacementDignity {
  if ((OWN_SIGNS[planet] ?? []).includes(sign)) return "own sign";
  const exaltation = EXALTATION[planet];
  if (exaltation?.sign === sign) return "exaltation sign";
  if (exaltation && (exaltation.sign + 6) % 12 === sign) return "debilitation sign";
  return "other";
}

export interface PromiseHouseEvidence {
  chart: "D1" | PromiseVarga;
  lagnaSign: number;
  house: number;
  houseSign: number;
  houseLord: Planet;
  lordSign: number;
  lordHouse: number;
  lordDignity: PlacementDignity;
  occupants: Planet[];
  /** Full sign-based planetary aspects; nodes have no aspect under this convention. */
  fullAspects: Planet[];
}

export interface ParashariVargaEvidence {
  label: string;
  date: string;
  matter: string;
  subject: string;
  division: PromiseVarga;
  practitionerSource: string;
  rashi: PromiseHouseEvidence;
  varga: PromiseHouseEvidence;
  /** Partial D1 house assessment from the existing BPHS 11.14–16 implementation. */
  rashiAssessment: { tone: "support" | "strain" | "mixed" | "none"; support: string[]; strain: string[] };
  /** The D1 matter lord's placement in the relevant divisional chart. */
  rashiLordInVarga: { planet: Planet; sign: number; house: number; dignity: PlacementDignity };
  /** The varga ascendant lord, which Mehta reads with the D7 5th and D10 10th. */
  vargaLagnaLord: { planet: Planet; sign: number; house: number; dignity: PlacementDignity };
  /** Vimshottari lords in the chart's ayanamsa, and their structural links. */
  periods: Array<{ level: "dasa" | "bhukti" | "antara"; planet: Planet; links: string[] }>;
}

/** Period links depend on the natal frames and lords, not on the event date.
 * Shared by the ordinary evidence builder and the per-candidate trial cache. */
export function parashariVargaPeriods(
  evidence: Pick<ParashariVargaEvidence, "rashi" | "varga" | "division" | "vargaLagnaLord">,
  positions: PlanetPosition[], periods: [Planet, Planet, Planet] | null,
): ParashariVargaEvidence["periods"] {
  const { rashi, varga, division } = evidence;
  const levels = ["dasa", "bhukti", "antara"] as const;
  return (periods ?? []).map((planet, i) => {
    const pos = positions.find((p) => p.planet === planet);
    const links: string[] = [];
    if (planet === rashi.houseLord) links.push(`D1 house ${rashi.house} lord`);
    if (pos && vargaSignAt("D1", pos.lon) === rashi.houseSign) links.push(`in D1 house ${rashi.house}`);
    if (rashi.fullAspects.includes(planet)) links.push(`aspects D1 house ${rashi.house}`);
    if (planet === varga.houseLord) links.push(`${division} house ${rashi.house} lord`);
    if (planet === evidence.vargaLagnaLord.planet) links.push(`${division} ascendant lord`);
    if (pos && vargaSignAt(division, pos.lon) === varga.houseSign) links.push(`in ${division} house ${rashi.house}`);
    if (varga.fullAspects.includes(planet)) links.push(`aspects ${division} house ${rashi.house}`);
    return { level: levels[i], planet, links };
  });
}

export function parashariVargaEvidence(
  event: { label: string; date: string; matter?: string },
  input: PlanetInput,
  lagnaLon: number,
  periods: [Planet, Planet, Planet] | null,
): ParashariVargaEvidence | undefined {
  const topic = vargaTopicFor(event.matter);
  if (!topic || !event.matter) return undefined;
  const context = asPlanetContext(input);
  const positions = planetPositions(context);
  const d1 = createDivisionalPlanetContext(context, "D1", lagnaLon);
  const dv = createDivisionalPlanetContext(context, topic.division, lagnaLon);
  const frame = (key: "D1" | PromiseVarga, p: DivisionalPlanetContext): PromiseHouseEvidence => {
    const lagnaSign = p.ascendantSign;
    const houseSign = (lagnaSign + topic.house - 1) % 12;
    const houseLord = SIGN_LORD[houseSign];
    const lordSign = p.requirePlanet(houseLord).signIndex;
    return {
      chart: key, lagnaSign, house: topic.house, houseSign, houseLord,
      lordSign, lordHouse: houseFrom(lagnaSign, lordSign), lordDignity: signDignity(houseLord, lordSign),
      occupants: p.occupants(houseSign).map((x) => x.planet),
      fullAspects: p.planets.filter((x) => x.signIndex !== houseSign && p.fullAspect(x.planet, houseSign)).map((x) => x.planet),
    };
  };
  const rashi = frame("D1", d1);
  const varga = frame(topic.division, dv);
  const assessment = judgeBhavas(positions, rashiHouseView(rashi.lagnaSign, positions), {
    aspect: (planet, from, to) => {
      const quarters = drishtiQuarters(planet, from, to);
      return quarters >= 4 ? quarters : 0;
    },
    benefic: naturalBenefic,
  }).find((h) => h.house === topic.house)!;
  const rashiLordSign = dv.requirePlanet(rashi.houseLord).signIndex;
  const lagnaLord = SIGN_LORD[varga.lagnaSign];
  const lagnaLordSign = dv.requirePlanet(lagnaLord).signIndex;
  const evidence: ParashariVargaEvidence = {
    label: event.label, date: event.date, matter: event.matter, subject: topic.subject,
    division: topic.division, practitionerSource: topic.practitionerSource, rashi, varga,
    rashiAssessment: { tone: assessment.tone, support: assessment.support, strain: assessment.strain },
    rashiLordInVarga: { planet: rashi.houseLord, sign: rashiLordSign, house: houseFrom(varga.lagnaSign, rashiLordSign), dignity: signDignity(rashi.houseLord, rashiLordSign) },
    vargaLagnaLord: { planet: lagnaLord, sign: lagnaLordSign, house: houseFrom(varga.lagnaSign, lagnaLordSign), dignity: signDignity(lagnaLord, lagnaLordSign) },
    periods: [],
  };
  evidence.periods = parashariVargaPeriods(evidence, positions, periods);
  return evidence;
}
