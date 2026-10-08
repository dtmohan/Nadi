// Parashari (BPHS) module. Whole-sign bhavas from the lagna, the traditional seven lords,
// sign-based graha drishti (ch. 26), functional nature by rising sign (ch. 34), lords in houses (ch. 24),
// a first set of named yogas (ch. 34, 36, 41, 42, 75) and Vimshottari periods glossed by lordship.
// Kept strictly separate from the BNN, Jaimini, ALP and KP modules.

import {
  SIGNS,
  SIGN_LORD,
  houseFrom,
  type Planet,
  type PlanetPosition,
  type Sign,
} from "./astro";
import { vimshottari, type Vimshottari } from "./kp";
import {
  conditionalDasas,
  type ConditionalDasasResult,
} from "./conditional-dasas";
import { computeRasiDasas, type RasiDasasResult } from "./parashari-rasi-dasas";
import { computeKalachakra, type KalachakraResult } from "./kalachakra";
import {
  computeShadbala,
  type ShadbalaBase,
  type ShadbalaResult,
  type DasaStartTransit,
} from "./shadbala";
import { computeAshtakavarga, type AshtakavargaResult } from "./ashtakavarga";
import {
  computeBhavaPhala,
  computeVargaPhala,
  type BhavaPhala,
  type VargaPhala,
} from "./bhava-phala";
import { computeDasaReadings, type DasaReading } from "./parashari-dasa";
import {
  LORD_IN_HOUSE,
  LAGNA_NATURE,
  BPHS_URL,
  type FunctionalRole,
} from "./parashari-data";
import {
  neechaBhanga,
  PHALADEEPIKA_CH7_URL,
  type NeechaBhanga,
} from "./neechabhanga";
import {
  houseFindings,
  judgeBhavas,
  type BhavaJudgement,
} from "./parashari-houses";
import { nodeFindings } from "./parashari-nodes";
import { yogaFindings } from "./parashari-yogas";
import { royalFindings } from "./parashari-royal";
import { fatherFindings, fatherDasaLord } from "./parashari-father";
import { computeChalit, bhavaAnnotation, bhavaHouseAnnotation } from "./chalit";
import { houseViewFor, type ParashariHouseMethod } from "./house-view";
import { evilFindings } from "./parashari-evils";
import { curseFindings } from "./parashari-curses";
import { computePadas, type PadaResult } from "./parashari-padas";
import { computeMarakas, type MarakaResult } from "./parashari-marakas";
import { redactSensitive } from "./life-stage";
import { computeAvasthas, type AvasthaResult } from "./parashari-avasthas";

export const SEVEN: Planet[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];
export const KENDRA = [1, 4, 7, 10];
export const TRIKONA = [1, 5, 9];
export const DUSTHANA = [6, 8, 12];

export interface ParashariSource {
  label: string;
  url: string;
  /** Not stated in the text as applied; flagged for the user. */
  provisional?: boolean;
}

export interface Bhava {
  house: number;
  signIndex: number;
  sign: Sign;
  lord: Planet;
  /** House the lord occupies (whole sign). */
  lordIn: number;
  occupants: Planet[];
  /** Planets aspecting this sign, with strength in quarters (1-4). */
  aspects: { planet: Planet; quarters: number }[];
}

export interface PlanetNature {
  planet: Planet;
  /** Houses owned (1-12). */
  owns: number[];
  house: number;
  /** Generic nature from lordship, BPHS 34.2-7. */
  lordship:
    | "kendra"
    | "trikona"
    | "kendraTrikona"
    | "trishadaya"
    | "eighth"
    | "mixed"
    | "node";
  functional: FunctionalRole;
  naturalBenefic: boolean;
}

export interface ParashariFinding {
  id: string;
  kind: "lord" | "yoga" | "strain" | "house" | "evil";
  /** For kind "house": the bhava the chapter concerns (ch. 12 = 1, ch. 13 = 2). */
  house?: number;
  title: string;
  text: string;
  tone: "support" | "strain" | "mixed";
  planets: Planet[];
  source: ParashariSource;
}

export interface DashaGloss {
  lord: Planet;
  start: string;
  end: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  owns: number[];
  house: number;
  functional: FunctionalRole;
  summary: string;
}

export interface ParashariResult {
  lagna: { signIndex: number; sign: Sign };
  bhavas: Bhava[];
  natures: PlanetNature[];
  findings: ParashariFinding[];
  /** Parashari house method used for the house, node and house-effects readings. */
  houseMethod: ParashariHouseMethod;
  /** Set when the selected chalit construction could not be computed, or needs a stated approximation. */
  houseMethodNote?: string;
  vimshottari: Vimshottari;
  /** Other nakshatra dasas of BPHS ch. 46 with their conditions. */
  conditionalDasas: ConditionalDasasResult;
  rasiDasas: RasiDasasResult;
  /** Kalachakra dasa, BPHS 46.52-154 and ch. 49. */
  kalachakra: KalachakraResult;
  /** Padas, Upapada, argala, karakas and Karakamsa, BPHS ch. 29-33. */
  padas: PadaResult;
  /** Maraka planets and the current period, BPHS ch. 44; null when withheld for a native under the sensitive-content age. */
  marakas: MarakaResult | null;
  /** True when the sensitive-content gate stripped length-of-life, maraka, arishta, kin-loss and peril statements from this result. */
  withheld: boolean;
  /** Avasthas of the planets, BPHS ch. 45. */
  avasthas: AvasthaResult;
  dashas: DashaGloss[];
  /** Period effects from BPHS ch. 47-48 and 52-61. */
  dasaReadings: DasaReading[];
  /** Debilitated planets and whether Phaladeepika 7.26-28 cancels the debility. */
  neechaBhanga: NeechaBhanga[];
  /** Minimum aspect strength counted by the rules above. */
  aspectFloor: AspectFloor;
  /** 11.14-16 prosperity and failure signs for each house. */
  bhavaJudgement: BhavaJudgement[];
  /** Six-fold strength of the seven planets, BPHS ch. 27; absent when the server sent no ephemeris facts. */
  shadbala?: ShadbalaResult;
  ashtakavarga: AshtakavargaResult;
  /** 28.15-20 house effects and 28.13-14 varga effects; need the Shadbala base. */
  bhavaPhala?: BhavaPhala[];
  vargaPhala?: VargaPhala[];
}

const S = (
  ch: number,
  verse: string,
  label?: string,
  provisional?: boolean,
): ParashariSource => ({
  label: label ?? `Parashara ${ch}.${verse}`,
  url: BPHS_URL(ch),
  provisional,
});

/**
 * Minimum aspect counted when a rule says "aspected by": 4 = full aspects only (the 7th and the special
 * aspects of Mars, Jupiter and Saturn), 2 = half or more, 1 = any. The texts state the graded strengths
 * (26.2-5) but no threshold for their aspect clauses, so the choice is a provisional convention.
 */
export type AspectFloor = 1 | 2 | 4;
export const ASPECT_FLOOR_LABEL: Record<AspectFloor, string> = {
  4: "full aspects only",
  2: "half or stronger",
  1: "any aspect",
};
export const DEFAULT_ASPECT_FLOOR: AspectFloor = 4;
export type AspectFn = (
  planet: Planet,
  fromSign: number,
  toSign: number,
) => number;
/** Rule aspect: the graded drishti, or 0 when it falls below the floor. */
export function ruleAspect(floor: AspectFloor): AspectFn {
  return (planet, fromSign, toSign) => {
    const q = drishtiQuarters(planet, fromSign, toSign);
    return q >= floor ? q : 0;
  };
}

// Drishti and natural benefic/malefic live in astro.ts (shared by several modules) to avoid a
// module cycle; re-export them here so the Parashari tab keeps its public surface.
export { drishtiQuarters, moonWaxing, naturalBenefic } from "./astro";
import { drishtiQuarters, naturalBenefic } from "./astro";

function lordshipClass(owns: number[]): PlanetNature["lordship"] {
  const k = owns.filter((h) => KENDRA.includes(h)).length;
  const t = owns.filter((h) => [5, 9].includes(h)).length;
  const tri = owns.filter((h) => [3, 6, 11].includes(h)).length;
  const e = owns.includes(8);
  const kinds = [k > 0, t > 0, tri > 0, e].filter(Boolean).length;
  if (k && t && kinds === 2 && !owns.includes(1)) return "kendraTrikona";
  if (kinds > 1) return "mixed";
  if (k) return "kendra";
  if (t) return "trikona";
  if (tri) return "trishadaya";
  if (e) return "eighth";
  return "mixed";
}

function functionalRole(planet: Planet, lagnaIdx: number): FunctionalRole {
  const n = LAGNA_NATURE[lagnaIdx];
  if (n.yogakaraka.includes(planet)) return "yogakaraka";
  if (n.yogaPair?.includes(planet)) return "yogaPair";
  if (n.auspicious.includes(planet)) return "auspicious";
  if (n.maraka.includes(planet) && !n.malefic.includes(planet)) return "maraka";
  if (n.malefic.includes(planet)) return "malefic";
  return "neutral";
}

const strongDignity = (p: PlanetPosition) =>
  p.dignity === "Exalted" ||
  p.dignity === "Own sign" ||
  p.dignity === "Moolatrikona";

export function computeParashari(
  positions: PlanetPosition[],
  lagnaLon: number,
  birthIso: string,
  asOfIso: string,
  shadbalaBase?: ShadbalaBase,
  dasaStarts?: DasaStartTransit[],
  aspectFloor: AspectFloor = DEFAULT_ASPECT_FLOOR,
  withhold = false,
  houseMethod: ParashariHouseMethod = "rashi",
): ParashariResult {
  const lagnaIdx = Math.floor((((lagnaLon % 360) + 360) % 360) / 30);
  const asp = ruleAspect(aspectFloor);
  const shadbala = shadbalaBase
    ? computeShadbala(positions, lagnaIdx, shadbalaBase)
    : undefined;
  // Bhava chalit: the selected construction can also carry the house readings; annotations keep the
  // other construction and the whole-sign placement visible.
  const chalit = shadbalaBase
    ? computeChalit(positions, shadbalaBase.asc, shadbalaBase.mc)
    : undefined;
  const { view: houseView, fellBack } = houseViewFor(houseMethod, lagnaIdx, positions, chalit);
  const houseMethodNote = fellBack
    ? "Bhava chalit could not be computed for this chart (no ephemeris facts for the ascendant and meridian); the readings fell back to rashi houses."
    : houseMethod === "sripati"
      ? "Under Sripati, the bhava bala and cusp aspects in the house-effects table stay measured on the equal cusps of the Shadbala pass; only placement follows Sripati."
      : undefined;
  const bhavaNote = (p: Planet) =>
    chalit ? bhavaAnnotation(chalit, p, houseMethod) : undefined;
  const ashtakavarga = computeAshtakavarga(positions, lagnaIdx);
  const bhavaPhala = shadbala
    ? computeBhavaPhala(positions, shadbala, ashtakavarga, houseView)
    : undefined;
  const vargaPhala = shadbala ? computeVargaPhala(shadbala) : undefined;
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseView.houseOf(pos(pl));
  const signOfHouse = (h: number) => houseView.signOfHouse(h);
  const lordOf = (h: number) => houseView.lordOf(h);
  const inHouse = (h: number) => houseView.occupantsOf(h).map((p) => p.planet);

  const bhavas: Bhava[] = [];
  for (let h = 1; h <= 12; h++) {
    const si = signOfHouse(h);
    const lord = lordOf(h);
    bhavas.push({
      house: h,
      signIndex: si,
      sign: SIGNS[si],
      lord,
      lordIn: houseOf(lord),
      occupants: inHouse(h),
      aspects: SEVEN.map((pl) => ({
        planet: pl,
        quarters: drishtiQuarters(pl, pos(pl).signIndex, si),
      })).filter((a) => a.quarters > 0),
    });
  }

  const natures: PlanetNature[] = positions.map((p) => {
    const owns =
      p.planet === "Rahu" || p.planet === "Ketu"
        ? []
        : bhavas.filter((b) => b.lord === p.planet).map((b) => b.house);
    return {
      planet: p.planet,
      owns,
      house: houseView.houseOf(p),
      lordship: owns.length ? lordshipClass(owns) : "node",
      functional:
        p.planet === "Rahu" || p.planet === "Ketu"
          ? "neutral"
          : functionalRole(p.planet, lagnaIdx),
      naturalBenefic: naturalBenefic(p, positions),
    };
  });

  const findings: ParashariFinding[] = [];

  // Lords in houses, ch. 24.
  for (const b of bhavas) {
    const e = LORD_IN_HOUSE[b.house - 1][b.lordIn - 1];
    const sb = shadbala?.planets.find((x) => x.planet === b.lord);
    const qualifier = sb
      ? ` Strength qualifier (24.145): ${b.lord} has ${sb.total.toFixed(0)} of the ${sb.required} virupas Parashara asks for (27.32-33), so expect ${sb.effect === "full" ? "the full" : sb.effect === "half" ? "about half the" : "about a quarter of the"} effect.`
      : "";
    findings.push({
      id: `pa-lord-${b.house}-${b.lordIn}`,
      kind: "lord",
      title: `Lord of the ${ord(b.house)} in the ${ord(b.lordIn)}`,
      text: `${b.lord}, lord of the ${ord(b.house)} (${b.sign}), stands in the ${ord(b.lordIn)} (${SIGNS[signOfHouse(b.lordIn)]}). ${e.text}${qualifier}${bhavaNote(b.lord) ? ` ${bhavaNote(b.lord)}` : ""}`,
      tone: e.tone,
      planets: [b.lord],
      source: S(24, String(e.verse)),
    });
  }

  // Strength qualifier, 24.145-146: full, half or quarter effect by the lord's strength; dual lordship with contrary results cancels.
  // Kendra-trikona relationship, 34.11-13 and 41.28: conjunction, mutual aspect, or exchange.
  const kendraLords = KENDRA.map(lordOf);
  const trikonaLords = [5, 9].map(lordOf);
  const seen = new Set<string>();
  for (const k of kendraLords) {
    for (const t of trikonaLords) {
      if (k === t) continue;
      const key = [k, t].sort().join("-");
      if (seen.has(key)) continue;
      const pk = pos(k),
        pt = pos(t);
      const conj = pk.signIndex === pt.signIndex;
      const mutual =
        asp(k, pk.signIndex, pt.signIndex) > 0 &&
        asp(t, pt.signIndex, pk.signIndex) > 0;
      const exch = bhavas.some(
        (b) =>
          b.lord === k &&
          bhavas[b.lordIn - 1].lord === t &&
          bhavas[b.lordIn - 1].lordIn === b.house,
      );
      if (!conj && !mutual && !exch) continue;
      seen.add(key);
      const dusthana = natures
        .filter((n) => n.planet === k || n.planet === t)
        .some((n) =>
          n.owns.some((h) => DUSTHANA.includes(h) || [3, 11].includes(h)),
        );
      const how = conj
        ? "conjoined"
        : exch
          ? "in mutual exchange"
          : "in mutual aspect";
      findings.push({
        id: `pa-yoga-kt-${key}`,
        kind: "yoga",
        title: "Kendra-trikona raja yoga",
        text: `${k} (lord of the ${listH(natures.find((n) => n.planet === k)!.owns)}) and ${t} (lord of the ${listH(natures.find((n) => n.planet === t)!.owns)}) are ${how}. A relationship between an angle lord and a trine lord confers yoga.${dusthana ? " One of the pair also owns a 3rd, 6th, 8th, 11th or 12th, which Parashara says dilutes the yoga (34.14-15)." : ""}`,
        tone: dusthana ? "mixed" : "support",
        planets: [k, t],
        source: S(34, "11-15"),
      });
    }
  }

  // Node as yogakaraka, 34.16-17: Rahu or Ketu in a kendra with a trine lord, or in a trine with a kendra lord.
  for (const node of ["Rahu", "Ketu"] as Planet[]) {
    const np = pos(node);
    const nh = houseFrom(lagnaIdx, np.signIndex);
    const mates = positions
      .filter(
        (p) =>
          p.signIndex === np.signIndex &&
          p.planet !== node &&
          p.planet !== "Rahu" &&
          p.planet !== "Ketu",
      )
      .map((p) => p.planet);
    const inK =
      KENDRA.includes(nh) && mates.some((m) => trikonaLords.includes(m));
    const inT =
      [5, 9].includes(nh) && mates.some((m) => kendraLords.includes(m));
    if (inK || inT) {
      findings.push({
        id: `pa-yoga-node-${node}`,
        kind: "yoga",
        title: `${node} as yogakaraka`,
        text: `${node} is in the ${ord(nh)} with ${mates.join(", ")}. A node in an angle with a trine lord, or in a trine with an angle lord, becomes a yoga-giver; without a strong lord in company the yoga does not bear fruit.`,
        tone: "support",
        planets: [node, ...mates],
        source: S(34, "16-17"),
      });
    }
  }

  // Pancha Mahapurusha, 75.1-2.
  const MP: Partial<Record<Planet, string>> = {
    Mars: "Ruchaka",
    Mercury: "Bhadra",
    Jupiter: "Hamsa",
    Venus: "Malavya",
    Saturn: "Sasa",
  };
  for (const pl of Object.keys(MP) as Planet[]) {
    const p = pos(pl);
    const h = houseFrom(lagnaIdx, p.signIndex);
    if (
      KENDRA.includes(h) &&
      (p.dignity === "Exalted" ||
        p.dignity === "Own sign" ||
        p.dignity === "Moolatrikona")
    ) {
      findings.push({
        id: `pa-yoga-mp-${pl}`,
        kind: "yoga",
        title: `${MP[pl]} yoga`,
        text: `${pl} is in the ${ord(h)}, an angle, in ${p.dignity === "Exalted" ? "exaltation" : "its own sign"} (${p.sign}). Parashara counts this as ${MP[pl]}, one of the five Mahapurusha yogas.`,
        tone: "support",
        planets: [pl],
        source: S(75, "1-2"),
      });
    }
  }

  // Gajakesari, 36.3-4: Jupiter in an angle from the lagna or Moon, conjunct or aspected by another benefic, not debilitated, combust or in an enemy's sign.
  {
    const ju = pos("Jupiter"),
      mo = pos("Moon"),
      su = pos("Sun");
    const fromL = KENDRA.includes(houseFrom(lagnaIdx, ju.signIndex));
    const fromM = KENDRA.includes(houseFrom(mo.signIndex, ju.signIndex));
    const combust = Math.abs(((ju.lon - su.lon + 540) % 360) - 180) < 11;
    const benefics = positions.filter(
      (p) => p.planet !== "Jupiter" && naturalBenefic(p, positions),
    );
    const helper = benefics.find(
      (b) =>
        b.signIndex === ju.signIndex ||
        asp(b.planet, b.signIndex, ju.signIndex) >= 2,
    );
    if (
      (fromL || fromM) &&
      helper &&
      ju.dignity !== "Debilitated" &&
      ju.dignity !== "Inimical" &&
      !combust
    ) {
      findings.push({
        id: "pa-yoga-gajakesari",
        kind: "yoga",
        title: "Gajakesari yoga",
        text: `Jupiter is in an angle from ${fromL && fromM ? "both the lagna and the Moon" : fromL ? "the lagna" : "the Moon"} and is ${helper.signIndex === ju.signIndex ? "joined" : "aspected"} by ${helper.planet}, a benefic, while free of debilitation, combustion and an enemy's sign. Parashara gives splendour, wealth, intelligence and the favour of authority.`,
        tone: "support",
        planets: ["Jupiter", helper.planet],
        source: S(36, "3-4"),
      });
    }
  }

  // Amala, 36.5-6: only a benefic in the 10th from the lagna or Moon.
  {
    const mo = pos("Moon");
    for (const [from, label] of [
      [lagnaIdx, "lagna"],
      [mo.signIndex, "Moon"],
    ] as [number, string][]) {
      const tenth = positions.filter(
        (p) => houseFrom(from, p.signIndex) === 10,
      );
      if (tenth.length && tenth.every((p) => naturalBenefic(p, positions))) {
        findings.push({
          id: `pa-yoga-amala-${label}`,
          kind: "yoga",
          title: "Amala yoga",
          text: `${tenth.map((p) => p.planet).join(", ")} alone in the 10th from the ${label}, all benefic. Parashara gives lasting fame, honour from authority and a charitable, helpful disposition.`,
          tone: "support",
          planets: tenth.map((p) => p.planet),
          source: S(36, "5-6"),
        });
        break;
      }
    }
  }

  // Parvata, 36.7-8: benefics in angles while the 7th and 8th are empty or hold only benefics.
  {
    const inAngles = positions.filter((p) =>
      KENDRA.includes(houseFrom(lagnaIdx, p.signIndex)),
    );
    const seventhEighth = positions.filter((p) =>
      [7, 8].includes(houseFrom(lagnaIdx, p.signIndex)),
    );
    if (
      inAngles.length &&
      inAngles.every((p) => naturalBenefic(p, positions)) &&
      seventhEighth.every((p) => naturalBenefic(p, positions))
    ) {
      findings.push({
        id: "pa-yoga-parvata",
        kind: "yoga",
        title: "Parvata yoga",
        text: `Only benefics (${inAngles.map((p) => p.planet).join(", ")}) occupy the angles and the 7th and 8th are ${seventhEighth.length ? "held by benefics" : "empty"}. Parashara gives wealth, eloquence, learning and civic leadership.`,
        tone: "support",
        planets: inAngles.map((p) => p.planet),
        source: S(36, "7-8"),
      });
    }
  }

  // Chamara, 36.11-12: lagna lord exalted in an angle and aspected by Jupiter; or two benefics in the 1st, 7th, 9th or 10th.
  {
    const l1 = lordOf(1),
      p1 = pos(l1),
      ju = pos("Jupiter");
    const a =
      p1.dignity === "Exalted" &&
      KENDRA.includes(houseOf(l1)) &&
      asp("Jupiter", ju.signIndex, p1.signIndex) > 0;
    const twoIn = [1, 7, 9, 10].find(
      (h) =>
        positions.filter(
          (p) =>
            houseFrom(lagnaIdx, p.signIndex) === h &&
            naturalBenefic(p, positions),
        ).length >= 2,
    );
    if (a || twoIn) {
      findings.push({
        id: "pa-yoga-chamara",
        kind: "yoga",
        title: "Chamara yoga",
        text:
          (a
            ? `${l1}, the lagna lord, is exalted in an angle and aspected by Jupiter.`
            : `Two benefics occupy the ${ord(twoIn!)}.`) +
          " Parashara gives honour, long life, learning and eloquence.",
        tone: "support",
        planets: a
          ? [l1, "Jupiter"]
          : positions
              .filter(
                (p) =>
                  houseFrom(lagnaIdx, p.signIndex) === twoIn &&
                  naturalBenefic(p, positions),
              )
              .map((p) => p.planet),
        source: S(36, "11-12"),
      });
    }
  }

  // Sankha, 36.13-14: 5th and 6th lords in mutual angles with a strong lagna lord.
  {
    const l5 = lordOf(5),
      l6 = lordOf(6),
      l1 = lordOf(1);
    if (
      l5 !== l6 &&
      KENDRA.includes(houseFrom(pos(l5).signIndex, pos(l6).signIndex)) &&
      strongDignity(pos(l1))
    ) {
      findings.push({
        id: "pa-yoga-sankha",
        kind: "yoga",
        title: "Sankha yoga",
        text: `${l5} (5th lord) and ${l6} (6th lord) are in mutual angles while ${l1}, the lagna lord, is in ${pos(l1).dignity.toLowerCase()}. Parashara gives wealth, family, kindness and long life.`,
        tone: "support",
        planets: [l5, l6, l1],
        source: S(36, "13-14"),
      });
    }
  }

  // Lakshmi, 36.27-28: 9th lord in an angle in own, moolatrikona or exaltation sign with a strong lagna lord.
  {
    const l9 = lordOf(9),
      l1 = lordOf(1);
    if (
      KENDRA.includes(houseOf(l9)) &&
      strongDignity(pos(l9)) &&
      strongDignity(pos(l1))
    ) {
      findings.push({
        id: "pa-yoga-lakshmi",
        kind: "yoga",
        title: "Lakshmi yoga",
        text: `${l9}, the 9th lord, is in the ${ord(houseOf(l9))}, an angle, in ${pos(l9).dignity.toLowerCase()}, and ${l1}, the lagna lord, is strong. Parashara gives charm, high standing, children and abundant wealth.`,
        tone: "support",
        planets: [l9, l1],
        source: S(36, "27-28"),
      });
    }
  }

  // Khadga, 36.25-26: exchange between the 2nd and 9th lords while the lagna lord is in an angle or trine.
  {
    const l2 = lordOf(2),
      l9 = lordOf(9),
      l1 = lordOf(1);
    if (
      l2 !== l9 &&
      houseOf(l2) === 9 &&
      houseOf(l9) === 2 &&
      [...KENDRA, 5, 9].includes(houseOf(l1))
    ) {
      findings.push({
        id: "pa-yoga-khadga",
        kind: "yoga",
        title: "Khadga yoga",
        text: `${l2} (2nd lord) and ${l9} (9th lord) exchange signs and ${l1}, the lagna lord, is in the ${ord(houseOf(l1))}. Parashara gives wealth, fortune, learning and skill.`,
        tone: "support",
        planets: [l2, l9, l1],
        source: S(36, "25-26"),
      });
    }
  }

  // Kalanidhi, 36.31-32: Jupiter in the 2nd or 5th aspected by Mercury and Venus.
  {
    const ju = pos("Jupiter"),
      h = houseOf("Jupiter");
    const me = pos("Mercury"),
      ve = pos("Venus");
    const aspM =
      me.signIndex === ju.signIndex ||
      asp("Mercury", me.signIndex, ju.signIndex) > 0;
    const aspV =
      ve.signIndex === ju.signIndex ||
      asp("Venus", ve.signIndex, ju.signIndex) > 0;
    if ([2, 5].includes(h) && aspM && aspV) {
      findings.push({
        id: "pa-yoga-kalanidhi",
        kind: "yoga",
        title: "Kalanidhi yoga",
        text: `Jupiter in the ${ord(h)} is joined or aspected by both Mercury and Venus. Parashara gives virtue, honour, health, wealth and learning.`,
        tone: "support",
        planets: ["Jupiter", "Mercury", "Venus"],
        source: S(36, "31-32"),
      });
    }
  }

  // Subha / Asubha, 36.1-2: benefic or malefic in the lagna; benefics or malefics in both the 12th and 2nd.
  {
    const first = positions.filter((p) => houseOf(p.planet) === 1);
    const flank = (h: number) =>
      positions.filter((p) => houseOf(p.planet) === h);
    const ben = (ps: PlanetPosition[]) =>
      ps.length > 0 && ps.every((p) => naturalBenefic(p, positions));
    const mal = (ps: PlanetPosition[]) =>
      ps.length > 0 && ps.every((p) => !naturalBenefic(p, positions));
    if (ben(first) || (ben(flank(12)) && ben(flank(2)))) {
      findings.push({
        id: "pa-yoga-subha",
        kind: "yoga",
        title: "Subha yoga",
        text: `${ben(first) ? `A benefic (${first.map((p) => p.planet).join(", ")}) in the lagna` : "Benefics in both the 12th and the 2nd"}. Parashara gives eloquence, charm and virtue.`,
        tone: "support",
        planets: (ben(first) ? first : [...flank(12), ...flank(2)]).map(
          (p) => p.planet,
        ),
        source: S(36, "1-2"),
      });
    } else if (mal(first) || (mal(flank(12)) && mal(flank(2)))) {
      findings.push({
        id: "pa-yoga-asubha",
        kind: "strain",
        title: "Asubha yoga",
        text: `${mal(first) ? `A malefic (${first.map((p) => p.planet).join(", ")}) in the lagna` : "Malefics in both the 12th and the 2nd"}. Parashara reads this as a sensual, self-serving streak that lives on others' wealth.`,
        tone: "strain",
        planets: (mal(first) ? first : [...flank(12), ...flank(2)]).map(
          (p) => p.planet,
        ),
        source: S(36, "1-2"),
      });
    }
  }

  // Wealth, 41.16: the 5th and 9th lords and planets joined to them give wealth in their periods.
  {
    const l5 = lordOf(5),
      l9 = lordOf(9);
    const joined = positions
      .filter(
        (p) =>
          p.planet !== l5 &&
          p.planet !== l9 &&
          (p.signIndex === pos(l5).signIndex ||
            p.signIndex === pos(l9).signIndex),
      )
      .map((p) => p.planet);
    findings.push({
      id: "pa-wealth-5-9",
      kind: "yoga",
      title: "Wealth-giving periods",
      text: `${l5} (5th lord) and ${l9} (9th lord) can bestow wealth${joined.length ? `, as can ${joined.join(", ")} joined to them` : ""}. Their dasa periods are the ones to watch for gains, read together with their strength and functional nature (41.17).`,
      tone: "support",
      planets: [l5, l9, ...joined],
      source: S(41, "16-17"),
    });
  }

  // Raja yogas born of debility, BPHS ch. 39 (Raja Yogas): 39.19-20, 39.28, 39.29-31. Aspect on the lagna counts any
  // chapter-26 aspect (quarter or more); occupation of the lagna is not an aspect. Combustion in 39.20 is not assessed.
  {
    const l1 = lordOf(1);
    const p1 = pos(l1);
    const aspectsLagna = (pl: Planet) =>
      asp(pl, pos(pl).signIndex, lagnaIdx) > 0;
    const l1Strong =
      (p1.dignity === "Exalted" ||
        p1.dignity === "Own sign" ||
        p1.dignity === "Moolatrikona") &&
      aspectsLagna(l1);
    const l1Text = `${l1}, the lagna lord, ${p1.dignity === "Exalted" ? "exalted" : "in its own sign"} in ${SIGNS[p1.signIndex]}, aspects the lagna`;
    const debilitated = positions.filter((p) => p.dignity === "Debilitated");
    const fallenIn368 = debilitated.filter((p) =>
      [3, 6, 8].includes(houseOf(p.planet)),
    );
    if (l1Strong && fallenIn368.length) {
      findings.push({
        id: "pa-raja-39-19",
        kind: "yoga",
        title: "Raja yoga from debility",
        text: `${l1Text}, while ${fallenIn368.map((p) => `${p.planet} is debilitated in the ${ord(houseOf(p.planet))}`).join(" and ")}. Parashara names this a Raja yoga (39.19). He speaks of the 3rd, 6th and 8th together; this pass accepts a debilitated planet in any of them, which is a reading, not the letter.`,
        tone: "support",
        planets: [l1, ...fallenIn368.map((p) => p.planet)],
        source: S(39, "19", undefined, fallenIn368.length < 3),
      });
    }
    const evil = Array.from(new Set([lordOf(6), lordOf(8), lordOf(12)])).filter(
      (x) => x !== l1,
    );
    const weakEvil = evil.filter(
      (x) => pos(x).dignity === "Debilitated" || pos(x).dignity === "Inimical",
    );
    if (l1Strong && weakEvil.length) {
      findings.push({
        id: "pa-raja-39-20",
        kind: "yoga",
        title: "Raja yoga from weak dusthana lords",
        text: `${l1Text}, while ${weakEvil
          .map(
            (x) =>
              `${x} (lord of the ${[6, 8, 12]
                .filter((h) => lordOf(h) === x)
                .map(ord)
                .join(
                  " and ",
                )}) is ${pos(x).dignity.toLowerCase() === "inimical" ? "in an inimical sign" : "debilitated"}`,
          )
          .join(
            ", ",
          )}. Parashara counts the 6th, 8th and 12th lords in fall, inimical signs or combustion under such a lagna lord as a Raja yoga (39.20). Combustion is not assessed here; he speaks of all three lords, this pass accepts any.`,
        tone: "support",
        planets: [l1, ...weakEvil],
        source: S(39, "20", undefined, true),
      });
    }
    const fallenEvilAspecting = evil.filter(
      (x) => pos(x).dignity === "Debilitated" && aspectsLagna(x),
    );
    if (fallenEvilAspecting.length) {
      findings.push({
        id: "pa-raja-39-28",
        kind: "yoga",
        title: "Debilitated dusthana lord aspects the lagna",
        text: `${fallenEvilAspecting
          .map(
            (x) =>
              `${x}, lord of the ${[6, 8, 12]
                .filter((h) => lordOf(h) === x)
                .map(ord)
                .join(
                  " and ",
                )}, is debilitated in ${SIGNS[pos(x).signIndex]} and aspects the lagna`,
          )
          .join(
            "; ",
          )}. Parashara says even one such lord gives a Raja yoga (39.28).`,
        tone: "support",
        planets: fallenEvilAspecting,
        source: S(39, "28"),
      });
    }
    const fallenAspecting = debilitated.filter(
      (p) =>
        [3, 6, 8, 11].includes(houseOf(p.planet)) && aspectsLagna(p.planet),
    );
    if (fallenAspecting.length) {
      findings.push({
        id: "pa-raja-39-29",
        kind: "yoga",
        title: "Debilitated planet aspects the lagna",
        text: `${fallenAspecting.map((p) => `${p.planet}, debilitated in the ${ord(houseOf(p.planet))}, aspects the lagna`).join("; ")}. Parashara gives a Raja yoga for a debilitated planet in the 6th or 8th, or in the 3rd or 11th, that aspects the lagna (39.29-31). The Arudha Lagna clause of the same verses is not evaluated.`,
        tone: "support",
        planets: fallenAspecting.map((p) => p.planet),
        source: S(39, "29-31"),
      });
    }
  }

  // Neechabhanga, Phaladeepika 7.26-30: cancellation of debilitation. Not a Parashara verse, so cited to Mantreswara.
  const neecha: NeechaBhanga[] = SEVEN.map((pl) =>
    neechaBhanga(pl, positions, lagnaIdx, asp),
  ).filter((x): x is NeechaBhanga => x !== null);
  for (const nb of neecha) {
    const met = nb.conditions.filter((c) => c.met);
    const canon = met.filter((c) => !c.provisional);
    const later = met.filter((c) => c.provisional);
    const PH = (verse: string, provisional?: boolean): ParashariSource => ({
      label: `Phaladeepika 7.${verse}`,
      url: PHALADEEPIKA_CH7_URL,
      provisional,
    });
    if (nb.cancelled) {
      findings.push({
        id: `pa-neecha-${nb.planet}`,
        kind: "yoga",
        title: `Neechabhanga: ${nb.planet}`,
        text: `${nb.planet} is debilitated in ${nb.sign} (${ord(nb.house)}), but ${canon.map((c) => c.text).join("; ")}. Mantreswara cancels the debility and promises standing and means${nb.inDusthana ? `, with the reservation that ${nb.planet} sits in the ${ord(nb.house)}, where 7.28 expects less` : ""}.${later.length ? ` Later practice adds: ${later.map((c) => c.text).join("; ")} (provisional).` : ""} Parashara's own dasa verses do not state this cancellation; the strain they read for ${nb.planet} is softened, not removed.`,
        tone: nb.inDusthana ? "mixed" : "support",
        planets: Array.from(
          new Set([nb.planet, nb.dispositor, nb.exaltationLord]),
        ),
        source: PH(
          Array.from(
            new Set(
              canon.flatMap((c) =>
                Array.from(c.source.matchAll(/7\.(\d+)/g)).map((m) =>
                  Number(m[1]),
                ),
              ),
            ),
          )
            .sort((x, y) => x - y)
            .join(", 7."),
        ),
      });
    } else {
      findings.push({
        id: `pa-neecha-${nb.planet}`,
        kind: "strain",
        title: `${nb.planet} debilitated, not cancelled`,
        text: `${nb.planet} is debilitated in ${nb.sign} (${ord(nb.house)}). ${nb.dispositor} and ${nb.exaltationLord} are in no angle from the lagna or the Moon, not in mutual angles, and ${nb.dispositor} casts no aspect of half or more on it, so Mantreswara's cancellations do not apply.${later.length ? ` Later practice would count: ${later.map((c) => c.text).join("; ")} (provisional, not applied).` : ""}`,
        tone: "strain",
        planets: [nb.planet],
        source: PH("26-28"),
      });
    }
  }

  // Penury, 42.2-6.
  {
    const l1 = lordOf(1),
      l6 = lordOf(6),
      l12 = lordOf(12),
      l8 = lordOf(8),
      l2 = lordOf(2);
    const marakas = LAGNA_NATURE[lagnaIdx].maraka;
    const withOrAspectedByMaraka = (pl: Planet) =>
      positions.some(
        (p) =>
          marakas.includes(p.planet) &&
          p.planet !== pl &&
          (p.signIndex === pos(pl).signIndex ||
            asp(p.planet, p.signIndex, pos(pl).signIndex) > 0),
      );
    if (
      houseOf(l1) === 12 &&
      houseOf(l12) === 1 &&
      withOrAspectedByMaraka(l12)
    ) {
      findings.push({
        id: "pa-penury-42-2",
        kind: "strain",
        title: "Penury combination",
        text: `${l1}, the lagna lord, is in the 12th while ${l12}, the 12th lord, is in the lagna in the company or aspect of a killer planet.`,
        tone: "strain",
        planets: [l1, l12],
        source: S(42, "2"),
      });
    }
    if (houseOf(l1) === 6 && houseOf(l6) === 1 && withOrAspectedByMaraka(l6)) {
      findings.push({
        id: "pa-penury-42-3",
        kind: "strain",
        title: "Penury combination",
        text: `${l1}, the lagna lord, is in the 6th while ${l6}, the 6th lord, is in the lagna in the company or aspect of a killer planet.`,
        tone: "strain",
        planets: [l1, l6],
        source: S(42, "3"),
      });
    }
    const ke = pos("Ketu");
    if (
      (houseOf("Ketu") === 1 || ke.signIndex === pos("Moon").signIndex) &&
      houseOf(l1) === 8
    ) {
      findings.push({
        id: "pa-penury-42-4",
        kind: "strain",
        title: "Penury combination",
        text: `Ketu is with the ${houseOf("Ketu") === 1 ? "lagna" : "Moon"} while ${l1}, the lagna lord, is in the 8th.`,
        tone: "strain",
        planets: ["Ketu", l1],
        source: S(42, "4"),
      });
    }
    const p1 = pos(l1),
      p2 = pos(l2);
    const maleficWith1 = positions.some(
      (p) =>
        p.planet !== l1 &&
        p.signIndex === p1.signIndex &&
        !naturalBenefic(p, positions),
    );
    if (
      DUSTHANA.includes(houseOf(l1)) &&
      maleficWith1 &&
      (p2.dignity === "Inimical" || p2.dignity === "Debilitated")
    ) {
      findings.push({
        id: "pa-penury-42-5",
        kind: "strain",
        title: "Penury combination",
        text: `${l1}, the lagna lord, is in the ${ord(houseOf(l1))} with a malefic while ${l2}, the 2nd lord, is ${p2.dignity.toLowerCase()}.`,
        tone: "strain",
        planets: [l1, l2],
        source: S(42, "5"),
      });
    }
    const evilLords = Array.from(
      new Set([l6, l8, l12].filter((x) => x !== l1)),
    );
    const with1 = positions
      .filter(
        (p) =>
          p.planet !== l1 &&
          p.signIndex === p1.signIndex &&
          (evilLords.includes(p.planet) || p.planet === "Saturn"),
      )
      .map((p) => p.planet);
    const beneficAspect = positions.some(
      (p) =>
        p.planet !== l1 &&
        naturalBenefic(p, positions) &&
        asp(p.planet, p.signIndex, p1.signIndex) > 0,
    );
    if (with1.length && !beneficAspect) {
      findings.push({
        id: "pa-penury-42-6",
        kind: "strain",
        title: "Penury combination",
        text: `${l1}, the lagna lord, is joined by ${with1.join(", ")} (${with1.includes("Saturn") && with1.length === 1 ? "Saturn" : "a lord of the 6th, 8th or 12th"}) and receives no benefic aspect.`,
        tone: "strain",
        planets: [l1, ...with1],
        source: S(42, "6"),
      });
    }
    if (
      pos("Mars").signIndex === pos("Saturn").signIndex &&
      houseOf("Mars") === 2
    ) {
      findings.push({
        id: "pa-penury-42-16",
        kind: "strain",
        title: "Mars and Saturn in the 2nd",
        text: "Mars and Saturn together in the 2nd. Parashara says wealth is destroyed, then lists cancellations that this pass does not yet evaluate.",
        tone: "strain",
        planets: ["Mars", "Saturn"],
        source: S(42, "16-18", undefined, true),
      });
    }
  }

  // Vimshottari, glossed by lordship (Lahiri Moon).
  const vim = vimshottari(pos("Moon").lon, birthIso, asOfIso);
  const condDasas = conditionalDasas(
    positions,
    lagnaLon,
    birthIso,
    asOfIso,
    shadbala?.daytime,
  );
  const rasiOpts = {
    strength: shadbala
      ? (pl: Planet) => shadbala.planets.find((x) => x.planet === pl)?.effect
      : undefined,
    brightMoon: (() => {
      const su = positions.find((p) => p.planet === "Sun")!,
        mo = positions.find((p) => p.planet === "Moon")!;
      return (mo.lon - su.lon + 360) % 360 < 180;
    })(),
    sarva: ashtakavarga.sarva,
  };
  const kalachakra = computeKalachakra(
    positions,
    lagnaLon,
    birthIso,
    asOfIso,
    (p) => naturalBenefic(p, positions),
    rasiOpts,
  );
  const rasiDasas = computeRasiDasas(
    positions,
    lagnaLon,
    birthIso,
    asOfIso,
    {
      positions,
      lagnaIdx,
      benefic: (p) => naturalBenefic(p, positions),
      ...rasiOpts,
    },
    shadbala,
  );
  const dashas: DashaGloss[] = vim.dasas.map((d) => {
    const n = natures.find((x) => x.planet === d.lord)!;
    const lordEff = n.owns.map((h) => LORD_IN_HOUSE[h - 1][n.house - 1]);
    const roleText =
      n.lordship === "node"
        ? `${d.lord} in the ${ord(n.house)}; it gives the results of its sign lord ${SIGN_LORD[pos(d.lord).signIndex]} and of planets in its company`
        : `${d.lord} owns the ${listH(n.owns)} and stands in the ${ord(n.house)}`;
    const eff = lordEff.length
      ? ` Lord-in-house verses: ${lordEff.map((e) => `24.${e.verse}`).join(", ")}.`
      : "";
    const father =
      d.lord === fatherDasaLord(lagnaIdx).lord
        ? " The father enjoys happiness in this dasa (70.16)."
        : "";
    const sandhi = bhavaNote(d.lord);
    return {
      lord: d.lord,
      start: d.start,
      end: d.end,
      ageStart: d.ageStart,
      ageEnd: d.ageEnd,
      current: d.current,
      owns: n.owns,
      house: n.house,
      functional: n.functional,
      summary: roleText + "." + eff + father + (sandhi ? ` ${sandhi}` : ""),
    };
  });

  // Chapters 11-13: house judgement and the stated effects of the 1st and 2nd houses.
  const houseDeps = { aspect: asp, benefic: naturalBenefic };
  const houseReading = houseFindings(positions, houseView, lagnaLon, lagnaIdx, houseDeps, shadbala);
  if (houseMethod !== "rashi" && !fellBack)
    for (const f of houseReading) {
      f.source = { ...f.source, label: `${f.source.label}, bhava-chalit placement`, provisional: true };
    }
  findings.push(...houseReading);
  // Phaladeepika 8.25-33: the nodes by house placement.
  findings.push(...nodeFindings(positions, houseView, lagnaIdx));
  // Chapters 35-38: Nabhasa, remaining ch. 36, lunar and solar yogas.
  findings.push(
    ...yogaFindings(positions, lagnaIdx, lagnaLon, houseDeps, shadbala),
  );
  findings.push(
    ...royalFindings(positions, lagnaIdx, lagnaLon, houseDeps, shadbala),
  );
  findings.push(...fatherFindings(positions, lagnaIdx));
  // Ch. 9-10 evils and their checks are infancy-danger rules: never computed under the gate.
  if (!withhold)
    findings.push(
      ...evilFindings(positions, lagnaIdx, lagnaLon, houseDeps, shadbala),
    );
  findings.push(
    ...curseFindings(positions, lagnaIdx, lagnaLon, houseDeps, shadbala),
  );
  const bhavaJudgement = judgeBhavas(positions, houseView, houseDeps, shadbala);
  if (chalit)
    for (const j of bhavaJudgement)
      j.chalitNote = bhavaHouseAnnotation(chalit, j.house, houseMethod);
  const padas = computePadas(
    positions,
    lagnaIdx,
    lagnaLon,
    houseDeps,
    shadbala,
  );
  const marakas = withhold
    ? null
    : computeMarakas(positions, lagnaIdx, lagnaLon, houseDeps, vim, shadbala);
  const avasthas = computeAvasthas(
    positions,
    lagnaIdx,
    houseDeps,
    shadbala,
    shadbalaBase,
  );

  const dasaReadings = computeDasaReadings(
    positions,
    lagnaIdx,
    LAGNA_NATURE[lagnaIdx].yogakaraka,
    vim,
    birthIso,
    asOfIso,
    shadbala,
    dasaStarts,
    ashtakavarga,
    neecha,
    chalit,
    asp,
  );
  const out: ParashariResult = {
    aspectFloor,
    withheld: withhold,
    houseMethod,
    ...(houseMethodNote ? { houseMethodNote } : {}),
    lagna: { signIndex: lagnaIdx, sign: SIGNS[lagnaIdx] },
    bhavas,
    natures,
    findings,
    neechaBhanga: neecha,
    bhavaJudgement,
    vimshottari: vim,
    conditionalDasas: condDasas,
    rasiDasas,
    kalachakra,
    padas,
    marakas,
    avasthas,
    dashas,
    dasaReadings,
    shadbala,
    ashtakavarga,
    bhavaPhala,
    vargaPhala,
  };
  // The gate: every prose statement on length of life, maraka periods, arishta or the loss of a
  // parent is stripped from the whole result before it reaches any view (shared/life-stage.ts).
  return withhold ? redactSensitive(out) : out;
}

export function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function listH(hs: number[]): string {
  if (!hs.length) return "no house";
  return hs.map(ord).join(" and ");
}

/** Label for a functional role; under the sensitive-content gate the maraka role is named by its lordship only. */
export function roleLabel(r: FunctionalRole, withheld = false): string {
  switch (r) {
    case "yogakaraka":
      return "a yogakaraka, owning an angle and a trine";
    case "yogaPair":
      return "half of the lagna's raja-yoga pair, a yoga-giver only together with its partner";
    case "auspicious":
      return "functionally auspicious";
    case "malefic":
      return "functionally malefic";
    case "maraka":
      return withheld ? "lord of the 2nd or 7th" : "a maraka (killer) planet";
    default:
      return "neutral";
  }
}

export const LORDSHIP_LABEL: Record<PlanetNature["lordship"], string> = {
  kendra: "Angle lord, neutralised (34.2)",
  trikona: "Trine lord, auspicious (34.3)",
  trishadaya: "3rd/6th/11th lord, inauspicious (34.4)",
  eighth: "8th lord (34.5-6)",
  kendraTrikona: "Angle and trine lord, yogakaraka (34.13-14)",
  mixed: "Mixed lordship (34.2-7)",
  node: "Node, through its sign lord (34.16-17)",
};
