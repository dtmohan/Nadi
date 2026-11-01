/**
 * A descriptive subset of Paul Manley's event-based divisional-chart method.
 * The book combines clue counts with qualitative judgment, not a universal
 * weighted score. This module reports a subset; it does not choose an ascendant.
 */
import { drishtiQuarters, SIGN_LORD, SIGNS, type Planet, type PlanetPosition } from "./astro";
import { vargaSignAt } from "./parashari-varga-evidence";
import { functionalFrame, type FunctionalFrame } from "./parashari-functional";

export type ManleyDivision = "D4" | "D7" | "D9" | "D10" | "D24";
export const MANLEY_SOURCE = {
  label: "Paul Manley, Birth Time Rectification: How to Find Your Exact Birth Time (2022), ch. 4, pp. 98–128; Prince Harry example, ch. 5",
  url: "https://www.lightonvedicastrology.com/",
};
export const RAO_EDUCATION_SOURCE = {
  label: "P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach, ch. 8, fourth house in D24",
  url: "https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=103",
};

export interface ManleyTopic {
  division: ManleyDivision;
  house: number;
  subject: string;
  karakas: Planet[];
}

/** The five mappings used in the book's introductory funnel; other matters are not inferred. */
export function manleyTopicFor(matter?: string): ManleyTopic | undefined {
  if (matter === "move") return { division: "D4", house: 4, subject: "change of residence", karakas: ["Moon"] };
  if (matter === "child") return { division: "D7", house: 5, subject: "childbirth", karakas: ["Jupiter"] };
  if (matter === "marriage") return { division: "D9", house: 7, subject: "marriage", karakas: ["Venus"] };
  if (matter === "job") return { division: "D10", house: 10, subject: "career", karakas: ["Sun", "Mercury", "Jupiter", "Saturn"] };
  if (matter === "education") return { division: "D24", house: 5, subject: "education", karakas: ["Jupiter", "Mercury"] };
  return undefined;
}

export interface ManleyFrame {
  chart: "D1" | ManleyDivision;
  ascendant: number;
  house: number;
  houseSign: number;
  houseLord: Planet;
  bhavatHouse: number;
  bhavatLord: Planet;
  primary: { house: string[]; houseLord: string[]; karaka: string[] };
  supporting: { ascendant: string[]; natalHouseLord: string[]; bhavat: string[]; nodes: string[] };
  /** Functional lordship of this period planet in this frame; partial and descriptive. */
  functional?: FunctionalFrame;
}

export interface ManleyEvidence {
  label: string;
  date: string;
  /** The clock and zone used for the event; missing inputs are explicit assumptions. */
  moment?: { time: string; timeAssumed: boolean; timezone?: string; timezoneAssumed: boolean };
  matter: string;
  division: ManleyDivision;
  subject: string;
  house: number;
  karakas: Planet[];
  periods: Array<{ level: "dasa" | "bhukti"; planet: Planet; frames: [ManleyFrame, ManleyFrame] }>;
  /** Descriptive third-level check; deliberately does not contribute to v3. */
  antara?: { level: "antara"; planet: Planet; frames: [ManleyFrame, ManleyFrame] };
  /** Rao's alternative D24 education house, kept separate from Manley's fifth. */
  educationFourth?: Array<{
    level: "dasa" | "bhukti" | "antara";
    planet: Planet;
    houseSign: number;
    houseLord: Planet;
    house: string[];
    houseLordLinks: string[];
  }>;
}

export interface ManleyEventInput {
  label: string; date: string; matter?: string; time?: string; timezone?: string; birthTimezone?: string;
}

/** One natal candidate may be evaluated for hundreds of dates. The event
 * frames depend on the candidate, matter, chart and planet, not on the date
 * or the other period lords. Cache those immutable frames per candidate. */
export function createManleyEvidenceScorer(natal: PlanetPosition[], lagnaLon: number) {
  const frameCache = new Map<string, ManleyFrame>();
  const signCache = new Map<string, Map<Planet, number>>();
  return (event: ManleyEventInput, periods: [Planet, Planet, Planet] | null): ManleyEvidence | undefined => {
    const topic = manleyTopicFor(event.matter);
    if (!topic || !event.matter || !periods) return undefined;
    const isNode = (p: Planet) => p === "Rahu" || p === "Ketu";
    const makeFrame = (chart: "D1" | ManleyDivision, p: Planet, eventHouse = topic.house): ManleyFrame => {
      const key = `${event.matter}|${chart}|${p}|${eventHouse}`;
      const cached = frameCache.get(key);
      if (cached) return cached;
      let signs = signCache.get(chart);
      if (!signs) { signs = new Map(natal.map((x) => [x.planet, vargaSignAt(chart, x.lon)])); signCache.set(chart, signs); }
      const signOf = (planet: Planet) => {
        const sign = signs!.get(planet);
        if (sign === undefined) throw new Error(`Missing ${planet} in ${chart}`);
        return sign;
      };
      const asc = vargaSignAt(chart, lagnaLon);
      const houseSign = (asc + eventHouse - 1) % 12;
      const houseLord = SIGN_LORD[houseSign];
      const natalLagna = vargaSignAt("D1", lagnaLon);
      const natalLord = SIGN_LORD[(natalLagna + eventHouse - 1) % 12];
      const bhavatHouse = ((eventHouse - 1) * 2) % 12 + 1;
      const bhavatSign = (asc + bhavatHouse - 1) % 12;
      const bhavatLord = SIGN_LORD[bhavatSign];
      const pSign = signOf(p);
      const aspect = (planet: Planet, from: number, to: number) => !isNode(planet) && drishtiQuarters(planet, from, to) >= 4;
      const relates = (a: Planet, b: Planet): string[] => {
        if (a === b) return [];
        const as = signOf(a), bs = signOf(b);
        const out: string[] = [];
        if (as === bs) out.push(`${a} and ${b} share ${SIGNS[as]}`);
        if (aspect(a, as, bs)) out.push(`${a} fully aspects ${b}`);
        if (aspect(b, bs, as)) out.push(`${b} fully aspects ${a}`);
        return out;
      };
      const nodeDispositor = isNode(p) ? SIGN_LORD[pSign] : undefined;
      const targetLinks = (target: Planet, role: string) => {
        if (p === target) {
          const description = role.endsWith(` ${target}`) ? role.slice(0, -target.length - 1) : role;
          return [`${p} is the ${description}`];
        }
        const links = relates(p, target).map((x) => `${role}: ${x}`);
        if (nodeDispositor === target && nodeDispositor !== p)
          links.push(`${role}: ${p} is in ${target}'s sign`);
        return links;
      };
      const house: string[] = [];
      if (pSign === houseSign) house.push(`${p} is in house ${eventHouse}`);
      if (aspect(p, pSign, houseSign)) house.push(`${p} fully aspects house ${eventHouse}`);
      const ascendant = chart !== "D1" && pSign === asc ? [`${p} is in the divisional ascendant`] : [];
      const natalHouseLord = chart !== "D1" ? targetLinks(natalLord, `D1 house ${eventHouse} lord ${natalLord}`) : [];
      const bhavat: string[] = [];
      if (pSign === bhavatSign) bhavat.push(`${p} is in house ${bhavatHouse} (house ${topic.house} from itself)`);
      if (aspect(p, pSign, bhavatSign)) bhavat.push(`${p} fully aspects house ${bhavatHouse}`);
      bhavat.push(...targetLinks(bhavatLord, `house ${bhavatHouse} lord ${bhavatLord}`));
      const nodes = nodeDispositor ? [`${p} is in ${SIGNS[pSign]}, ruled by ${nodeDispositor}`,
        ...natal.filter((x) => !isNode(x.planet) && aspect(x.planet, signOf(x.planet), pSign)).map((x) => `${p} receives a full aspect from ${x.planet}`)] : [];
      const frame: ManleyFrame = {
        chart, ascendant: asc, house: eventHouse, houseSign, houseLord, bhavatHouse, bhavatLord,
        primary: {
          house,
          houseLord: targetLinks(houseLord, `house ${eventHouse} lord ${houseLord}`),
          karaka: topic.karakas.flatMap((k) => targetLinks(k, `karaka ${k}`)),
        },
        supporting: { ascendant, natalHouseLord, bhavat, nodes },
        functional: functionalFrame(p, asc, pSign, eventHouse, (other) => relates(p, other)),
      };
      frameCache.set(key, frame);
      return frame;
    };
    return {
      label: event.label, date: event.date, matter: event.matter,
      moment: { time: event.time ?? "12:00", timeAssumed: !event.time,
        timezone: event.timezone ?? event.birthTimezone, timezoneAssumed: !event.timezone },
      division: topic.division, subject: topic.subject, house: topic.house, karakas: topic.karakas,
      periods: (["dasa", "bhukti"] as const).map((level, i) => ({
        level, planet: periods[i], frames: [makeFrame("D1", periods[i]), makeFrame(topic.division, periods[i])],
      })),
      antara: { level: "antara", planet: periods[2], frames: [makeFrame("D1", periods[2]), makeFrame(topic.division, periods[2])] },
      educationFourth: event.matter === "education" ? (["dasa", "bhukti", "antara"] as const).map((level, i) => {
        const frame = makeFrame("D24", periods[i], 4);
        return { level, planet: periods[i], houseSign: frame.houseSign, houseLord: frame.houseLord,
          house: frame.primary.house, houseLordLinks: frame.primary.houseLord };
      }) : undefined,
    };
  };
}

export function manleyEvidence(
  event: ManleyEventInput, natal: PlanetPosition[], lagnaLon: number, periods: [Planet, Planet, Planet] | null,
): ManleyEvidence | undefined {
  return createManleyEvidenceScorer(natal, lagnaLon)(event, periods);
}
