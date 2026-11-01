/**
 * A descriptive Parashari cross-check, deliberately separate from KP and
 * Jaimini scoring. BPHS 7.1–8 assigns the subject of each division; the
 * house-by-house reading of D7/D9/D10 follows the named practitioner sources.
 * None of these placements is, on its own, a yes/no promise of an event.
 */
import { drishtiQuarters, EXALTATION, houseFrom, naturalBenefic, norm360, OWN_SIGNS, SIGN_LORD, type Planet, type PlanetPosition } from "./astro";
import { VARGA_BY_KEY, type VargaKey } from "./vargas";
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

/** Use the same BPHS sign mapping as the Parashari tab. */
export function vargaSignAt(key: VargaKey, lon: number): number {
  const degree = norm360(lon);
  const sign = Math.floor(degree / 30);
  return VARGA_BY_KEY[key].signOf(sign, degree - sign * 30);
}

export type PlacementDignity = "own sign" | "exaltation sign" | "debilitation sign" | "other";

function signDignity(planet: Planet, sign: number): PlacementDignity {
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

export function parashariVargaEvidence(
  event: { label: string; date: string; matter?: string },
  positions: PlanetPosition[],
  lagnaLon: number,
  periods: [Planet, Planet, Planet] | null,
): ParashariVargaEvidence | undefined {
  const topic = vargaTopicFor(event.matter);
  if (!topic || !event.matter) return undefined;
  const signs = (key: VargaKey) => new Map(positions.map((p) => [p.planet, vargaSignAt(key, p.lon)]));
  const d1 = signs("D1");
  const dv = signs(topic.division);
  const frame = (key: "D1" | PromiseVarga, p: Map<Planet, number>): PromiseHouseEvidence => {
    const lagnaSign = vargaSignAt(key, lagnaLon);
    const houseSign = (lagnaSign + topic.house - 1) % 12;
    const houseLord = SIGN_LORD[houseSign];
    const lordSign = p.get(houseLord);
    if (lordSign === undefined) throw new Error(`Missing ${houseLord} in ${key}`);
    return {
      chart: key, lagnaSign, house: topic.house, houseSign, houseLord,
      lordSign, lordHouse: houseFrom(lagnaSign, lordSign), lordDignity: signDignity(houseLord, lordSign),
      occupants: positions.filter((x) => p.get(x.planet) === houseSign).map((x) => x.planet),
      fullAspects: positions.filter((x) => p.get(x.planet) !== houseSign && drishtiQuarters(x.planet, p.get(x.planet)!, houseSign) >= 4).map((x) => x.planet),
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
  const rashiLordSign = dv.get(rashi.houseLord)!;
  const lagnaLord = SIGN_LORD[varga.lagnaSign];
  const lagnaLordSign = dv.get(lagnaLord)!;
  const levels = ["dasa", "bhukti", "antara"] as const;
  return {
    label: event.label, date: event.date, matter: event.matter, subject: topic.subject,
    division: topic.division, practitionerSource: topic.practitionerSource, rashi, varga,
    rashiAssessment: { tone: assessment.tone, support: assessment.support, strain: assessment.strain },
    rashiLordInVarga: { planet: rashi.houseLord, sign: rashiLordSign, house: houseFrom(varga.lagnaSign, rashiLordSign), dignity: signDignity(rashi.houseLord, rashiLordSign) },
    vargaLagnaLord: { planet: lagnaLord, sign: lagnaLordSign, house: houseFrom(varga.lagnaSign, lagnaLordSign), dignity: signDignity(lagnaLord, lagnaLordSign) },
    periods: (periods ?? []).map((planet, i) => {
      const links: string[] = [];
      if (planet === rashi.houseLord) links.push(`D1 house ${topic.house} lord`);
      if (d1.get(planet) === rashi.houseSign) links.push(`in D1 house ${topic.house}`);
      if (rashi.fullAspects.includes(planet)) links.push(`aspects D1 house ${topic.house}`);
      if (planet === varga.houseLord) links.push(`${topic.division} house ${topic.house} lord`);
      if (planet === lagnaLord) links.push(`${topic.division} ascendant lord`);
      if (dv.get(planet) === varga.houseSign) links.push(`in ${topic.division} house ${topic.house}`);
      if (varga.fullAspects.includes(planet)) links.push(`aspects ${topic.division} house ${topic.house}`);
      return { level: levels[i], planet, links };
    }),
  };
}
