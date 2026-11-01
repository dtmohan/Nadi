/**
 * A deliberately partial, descriptive reconstruction of P.V.R. Narasimha
 * Rao's published event analysis. It is not his complete rectification
 * method or a score. Each item is a chart fact or a source-specific clue;
 * an absent clue does not deny an event. This module is independent of KP.
 *
 * Sources: https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=74
 * examples 53, 130 and real-life example 5 in the same book; and for the
 * later D24 sign convention, https://www.vedicastrologer.org/articles/pp_transits.pdf
 */
import { drishtiQuarters, houseFrom, norm360, SIGN_LORD, type Planet, type PlanetPosition } from "./astro";
import { VARGA_BY_KEY, type VargaKey } from "./vargas";
import { arudhaOf } from "./jaimini";
import { pvrKalachakraAt, type PvrKalaPath } from "./pvr-kalachakra";
import { vimshottariPathAt, type VimshottariLevel } from "./vimshottari-depth";

export type PvrMatter = "abroad" | "move" | "marriage" | "child" | "job" | "education" | "vehicle";
export type PvrD24Variant = "book-2000-forward" | "article-2013-reverse-even";
type ResearchVarga = "D1" | "D4" | "D7" | "D9" | "D10" | "D16" | "D24";

export interface PvrPeriodFact {
  level: number;
  planet: Planet;
  sign: number;
  house: number;
  owns: number[];
  /** Objective relations to the source's particular house and natural significators. */
  clues: string[];
}
export interface PvrFrame {
  division: ResearchVarga;
  ascendant: number;
  matterHouse: number;
  houseLord: Planet;
  houseSign: number;
  signs: Record<Planet, number>;
  periods: PvrPeriodFact[];
  /** D10 only; the app's traditional single-lord arudha convention. */
  arudhaLagna?: number;
}
export interface PvrEventEvidence {
  matter: PvrMatter;
  division: Exclude<ResearchVarga, "D1">;
  d24Variant: PvrD24Variant;
  /** 360-day Vimshottari is a named research variant, not the app's default. */
  vimshottari: VimshottariLevel[];
  kalachakra: PvrKalaPath;
  d1: PvrFrame;
  divisionFrame: PvrFrame;
  /** Separate literal sign relationships from Rao's marriage examples. */
  marriageKala?: { major: string[]; sub: string[] };
}

const TOPICS: Record<PvrMatter, { division: Exclude<ResearchVarga, "D1">; house: number; significators: Planet[] }> = {
  abroad: { division: "D4", house: 12, significators: ["Rahu"] },
  move: { division: "D4", house: 4, significators: ["Moon"] },
  marriage: { division: "D9", house: 7, significators: ["Venus"] },
  child: { division: "D7", house: 5, significators: ["Jupiter"] },
  job: { division: "D10", house: 10, significators: ["Sun", "Mercury", "Jupiter", "Saturn"] },
  education: { division: "D24", house: 4, significators: ["Mercury", "Jupiter"] },
  vehicle: { division: "D16", house: 4, significators: ["Venus"] },
};

/**
 * The 2000 book's conventional forward D24 and the 2013 article's reversal
 * for even signs. This is only the article's D24 sign construction; it does
 * not imply that Pushya-paksha ayanamsa or its other chart settings are used.
 */
export function pvrVargaSign(division: ResearchVarga, longitude: number,
  variant: PvrD24Variant = "book-2000-forward"): number {
  if (!Number.isFinite(longitude)) throw new RangeError("Finite longitude required");
  const lon = norm360(longitude), sign = Math.floor(lon / 30), deg = lon % 30;
  if (division === "D24" && variant === "article-2013-reverse-even" && sign % 2 === 1) {
    const part = Math.min(23, Math.floor(deg * 24 / 30));
    return (3 - part + 24) % 12;
  }
  return VARGA_BY_KEY[division as VargaKey].signOf(sign, deg);
}

function frame(division: ResearchVarga, house: number, significators: Planet[], natal: PlanetPosition[], lagna: number,
  path: VimshottariLevel[], variant: PvrD24Variant, matter: PvrMatter): PvrFrame {
  const ascendant = pvrVargaSign(division, lagna, variant);
  const signs = Object.fromEntries(natal.map((p) => [p.planet, pvrVargaSign(division, p.lon, variant)])) as Record<Planet, number>;
  const houseSign = (ascendant + house - 1) % 12, houseLord = SIGN_LORD[houseSign];
  if (signs[houseLord] === undefined) throw new Error(`Missing ${houseLord} in natal chart`);
  const arudhaLagna = division === "D10"
    ? arudhaOf(1, ascendant, natal.map((p) => ({ ...p, signIndex: signs[p.planet] }))).signIndex : undefined;
  const periods = path.map(({ level, lord: planet }) => {
    const s = signs[planet];
    if (s === undefined) throw new Error(`Missing ${planet} in natal chart`);
    const owns = Array.from({ length: 12 }, (_, i) => i + 1).filter((h) => SIGN_LORD[(ascendant + h - 1) % 12] === planet);
    const clues: string[] = [];
    if (owns.includes(house)) clues.push(`owns house ${house}`);
    if (s === houseSign) clues.push(`occupies house ${house}`);
    if (drishtiQuarters(planet, s, houseSign) === 4) clues.push(`fully aspects house ${house}`);
    if (planet !== houseLord && s === signs[houseLord]) clues.push(`conjoins house ${house} lord ${houseLord}`);
    if (significators.includes(planet)) clues.push("is a listed natural significator");
    if (matter === "abroad" && division === "D4") {
      if (owns.includes(9)) clues.push("owns house 9");
      if (houseFrom(ascendant, s) === 7) clues.push("occupies house 7");
      if (planet !== "Rahu" && s === signs.Rahu) clues.push("conjoins Rahu");
    }
    if (matter === "job" && division === "D10" && arudhaLagna !== undefined) {
      const fromAl = houseFrom(arudhaLagna, s);
      if ([1, 5, 10].includes(fromAl)) clues.push(`occupies house ${fromAl} from arudha lagna`);
    }
    return { level, planet, sign: s, house: houseFrom(ascendant, s), owns, clues };
  });
  return { division, ascendant, matterHouse: house, houseLord, houseSign, signs, periods, arudhaLagna };
}

/** Resolve one event using the same immutable natal chart for both frames. */
export function pvrEventEvidence(matter: PvrMatter, natal: PlanetPosition[], lagna: number, birthMs: number, eventMs: number,
  variant: PvrD24Variant = "book-2000-forward"): PvrEventEvidence {
  const topic = TOPICS[matter], moon = natal.find((p) => p.planet === "Moon");
  if (!topic || !moon) throw new Error("Supported matter and natal Moon are required");
  const vimshottari = vimshottariPathAt(moon.lon, birthMs, eventMs, 3, { yearDays: 360 });
  const kalachakra = pvrKalachakraAt(moon.lon, birthMs, eventMs);
  const d1 = frame("D1", topic.house, topic.significators, natal, lagna, vimshottari, variant, matter);
  const divisionFrame = frame(topic.division, topic.house, topic.significators, natal, lagna, vimshottari, variant, matter);
  let marriageKala: PvrEventEvidence["marriageKala"];
  if (matter === "marriage") {
    const clues = (sign: number): string[] => {
      const result: string[] = [];
      if (sign === divisionFrame.ascendant) result.push("D9 ascendant");
      if (sign === divisionFrame.houseSign) result.push("D9 seventh house");
      if (sign === divisionFrame.signs.Venus) result.push("contains Venus in D9");
      if (sign === (divisionFrame.signs.Venus + 6) % 12) result.push("seventh from D9 Venus");
      return result;
    };
    marriageKala = { major: clues(kalachakra.major.sign), sub: clues(kalachakra.sub.sign) };
  }
  return { matter, division: topic.division, d24Variant: variant, vimshottari, kalachakra, d1, divisionFrame, marriageKala };
}
