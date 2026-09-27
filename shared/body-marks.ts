/**
 * Marks on the body and the birth room, Brihat Jataka 5.22-26 (Varahamihira).
 *
 * 5.22 The attendants at the birth are as many as the planets between the lagna and the Moon; those in the visible
 *      half of the sky stand outside the room, those in the invisible half inside (some reverse it).
 * 5.23 Build from the lord of the rising navamsa or the strongest planet; complexion from the lord of the Moon's
 *      navamsa (colours of 2.4); the size of each limb from the sign that stands for it (1.4).
 * 5.24 The twelve houses are the limbs of the body, head first, taken by the rising drekkana: the first drekkana gives
 *      the head, the second the trunk from the neck, the third the body from the pelvis down. Houses 2-6 are the right
 *      side, 8-12 the left.
 * 5.25 A malefic in a house gives a wound in that limb; a benefic there, or a benefic's aspect, gives a mole or mark.
 *      A planet in its own sign or navamsa, or in a fixed sign, gives the mark from birth; otherwise it comes later.
 *      The wound is by stone or wind for Saturn, fire, weapon or poison for Mars, earth for a malefic Mercury, wood or
 *      a quadruped for the Sun, a horned or water animal for the waning Moon; the benefics give an auspicious mark.
 * 5.26 Three planets in one sign mark that limb without fail; a malefic in the 6th wounds; with a benefic's aspect the
 *      mark is a dark and a white mole; benefics in the 6th give dense hair (commentary).
 *
 * Sources: Neely's translation on wisdomlib (verse pages), the public-domain Iyer 1885 translation on archive.org
 * (pp. 49-53), and the Adyar Library 1951 Sanskrit edition with Aiyangar's commentary (pp. 301-308). Readings that come
 * from a commentary rather than the verse are flagged provisional.
 */
import {
  OWN_SIGNS,
  SIGN_LORD,
  SIGN_QUALITY,
  SIGNS,
  houseFrom,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { navamsaOf } from "./jaimini";
import {
  naturalBenefic,
  ruleAspect,
  type AspectFloor,
  type ParashariSource,
  DEFAULT_ASPECT_FLOOR,
} from "./parashari";

const WL =
  "https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/";
const IYER = "https://archive.org/details/brihatjatakavar00iyergoog";
const ADYAR = "https://archive.org/details/in.ernet.dli.2015.382698";

export const BODY_MARKS_SOURCES: Record<string, ParashariSource> = {
  v22: { label: "Brihat Jataka 5.22", url: `${WL}doc1501656.html` },
  v23: { label: "Brihat Jataka 5.23", url: `${WL}doc1501657.html` },
  v24: { label: "Brihat Jataka 5.24", url: `${WL}doc1501658.html` },
  v25: { label: "Brihat Jataka 5.25", url: `${WL}doc1501659.html` },
  v26: { label: "Brihat Jataka 5.26", url: `${WL}doc1501660.html` },
  colours: { label: "Brihat Jataka 2.4", url: `${WL}doc1501554.html` },
  iyer: { label: "Iyer 1885, pp. 49-53", url: IYER },
  adyar: { label: "Adyar 1951, pp. 301-308", url: ADYAR },
  commentary: {
    label: "Adyar commentary, pp. 301-308",
    url: ADYAR,
    provisional: true,
  },
};

/** 5.24: limb of each house (1-12) for the rising drekkana (1-3); the same limb on the right for 2-6 and left for 8-12. */
export const DREKKANA_LIMBS: Record<1 | 2 | 3, string[]> = {
  1: [
    "head",
    "eye",
    "ear",
    "nostril",
    "cheek",
    "jaw",
    "mouth",
    "jaw",
    "cheek",
    "nostril",
    "ear",
    "eye",
  ],
  2: [
    "neck",
    "shoulder",
    "arm",
    "side",
    "breast",
    "belly",
    "navel",
    "belly",
    "breast",
    "side",
    "arm",
    "shoulder",
  ],
  3: [
    "pelvis",
    "genitals",
    "testicle",
    "thigh",
    "knee",
    "shin",
    "feet",
    "shin",
    "knee",
    "thigh",
    "testicle",
    "anus",
  ],
};

/**
 * Which words name the third-drekkana limbs. The verse (5.24) names the genitals and the testicles for
 * houses 2/12 and 3/11; a chart known to be male keeps the verse's words, any other chart uses neutral
 * terms for the same regions.
 */
export type LimbTerms = "verse" | "neutral";
export const NEUTRAL_LIMBS: Record<string, string> = {
  genitals: "lower abdomen",
  testicle: "groin",
};
export function limbTermsFor(gender: string | undefined | null): LimbTerms {
  return gender === "male" ? "verse" : "neutral";
}

/** 1.4 (via 5.23 and 5.26): the twelve-fold body from the lagna, head first. */
export const TWELVE_LIMBS = [
  "head",
  "face",
  "chest",
  "heart",
  "belly",
  "hip",
  "groin",
  "genitals",
  "thighs",
  "knees",
  "shanks",
  "feet",
];

/** 5.25: what inflicts the wound. */
export const WOUND_CAUSE: Partial<Record<Planet, string>> = {
  Saturn: "a stone, or a wind disorder",
  Mars: "fire, a weapon or poison",
  Mercury: "earth (a fall)",
  Sun: "wood, or a quadruped",
  Moon: "a horned animal, or one of the water",
  Rahu: "poison, per the commentary",
  Ketu: "fire, per the commentary",
};

/** 2.4: the colour of each planet, read for the complexion in 5.23. */
export const PLANET_COLOUR: Record<Planet, string> = {
  Sun: "dark red or copper",
  Moon: "fair",
  Mars: "red and fair",
  Mercury: "dark green like durva grass",
  Jupiter: "golden yellow",
  Venus: "neither fair nor dark",
  Saturn: "dark",
  Rahu: "",
  Ketu: "",
};

export type Side = "right" | "left" | "centre";
export type MarkKind = "wound" | "mark" | "both";

export interface LimbMark {
  house: number;
  limb: string;
  side: Side;
  planet: Planet;
  benefic: boolean;
  kind: MarkKind;
  /** From birth (own sign, own navamsa or fixed sign) or acquired later. */
  congenital: boolean;
  congenitalReason: string;
  cause?: string;
  /** Benefics whose full aspect softens a malefic's wound into a mark. */
  aspectedBy: Planet[];
  provisional?: boolean;
}

export interface AspectMark {
  house: number;
  limb: string;
  side: Side;
  by: Planet[];
}

export interface Attendant {
  planet: Planet;
  house: number;
  /** In the visible half (houses 7-12) or the invisible half (1-6) from the lagna. */
  visible: boolean;
  wellDressed: boolean;
}

export interface BodyMarksResult {
  lagnaSign: number;
  drekkana: 1 | 2 | 3;
  drekkanaLabel: string;
  /** The twelve limbs for this drekkana with their side. */
  limbs: Array<{ house: number; limb: string; side: Side }>;
  /** 5.25: a planet in a house marks that limb. */
  marks: LimbMark[];
  /** 5.25: a benefic's full aspect on an empty house marks that limb. */
  aspectMarks: AspectMark[];
  /** 5.26: three or more planets in one sign mark the limb without fail. */
  crowded: Array<{
    house: number;
    limb: string;
    side: Side;
    planets: Planet[];
  }>;
  /** 5.26: a malefic in the 6th wounds the hip; a benefic there gives dense hair (commentary). */
  sixth: { malefics: Planet[]; benefics: Planet[]; aspectedByBenefic: boolean };
  /** 5.22 */
  attendants: Attendant[];
  /** 5.23 */
  build: { navamsaLord: Planet; navamsaSign: number };
  complexion: { navamsaLord: Planet; navamsaSign: number; colour: string };
  caveats: string[];
  sources: typeof BODY_MARKS_SOURCES;
}

export function sideOf(house: number): Side {
  if (house >= 2 && house <= 6) return "right";
  if (house >= 8 && house <= 12) return "left";
  return "centre";
}

export function limbsFor(
  drekkana: 1 | 2 | 3,
  terms: LimbTerms = "verse",
): Array<{ house: number; limb: string; side: Side }> {
  return DREKKANA_LIMBS[drekkana].map((limb, i) => ({
    house: i + 1,
    limb: terms === "neutral" ? (NEUTRAL_LIMBS[limb] ?? limb) : limb,
    side: sideOf(i + 1),
  }));
}

export function limbLabel(l: { limb: string; side: Side }): string {
  return l.side === "centre" ? l.limb : `${l.side} ${l.limb}`;
}

export function computeBodyMarks(
  positions: PlanetPosition[],
  lagnaLon: number,
  aspectFloor: AspectFloor = DEFAULT_ASPECT_FLOOR,
  terms: LimbTerms = "verse",
): BodyMarksResult {
  const lagnaSign = Math.floor(lagnaLon / 30) % 12;
  const degInSign = lagnaLon - Math.floor(lagnaLon / 30) * 30;
  const drekkana = (Math.min(2, Math.floor(degInSign / 10)) + 1) as 1 | 2 | 3;
  const limbs = limbsFor(drekkana, terms);
  const aspect = ruleAspect(aspectFloor);
  const benefics = positions.filter((p) => naturalBenefic(p, positions));
  const houseOf = (p: PlanetPosition) => houseFrom(lagnaSign, p.signIndex);

  const marks: LimbMark[] = positions.map((p) => {
    const house = houseOf(p);
    const l = limbs[house - 1];
    const benefic = naturalBenefic(p, positions);
    const aspectedBy = benefics
      .filter(
        (b) =>
          b.planet !== p.planet &&
          aspect(b.planet, b.signIndex, p.signIndex) > 0,
      )
      .map((b) => b.planet);
    const nav = navamsaOf(p.lon);
    const reasons: string[] = [];
    if (OWN_SIGNS[p.planet]?.includes(p.signIndex)) reasons.push("own sign");
    if (OWN_SIGNS[p.planet]?.includes(nav.signIndex))
      reasons.push("own navamsa");
    if (SIGN_QUALITY[p.signIndex] === "Fixed") reasons.push("fixed sign");
    const node = p.planet === "Rahu" || p.planet === "Ketu";
    return {
      house,
      limb: l.limb,
      side: l.side,
      planet: p.planet,
      benefic,
      kind: benefic ? "mark" : aspectedBy.length ? "both" : "wound",
      congenital: reasons.length > 0,
      congenitalReason: reasons.length ? reasons.join(", ") : "acquired later",
      cause: benefic ? undefined : WOUND_CAUSE[p.planet],
      aspectedBy,
      provisional: node || undefined,
    };
  });

  const occupied = new Set(marks.map((m) => m.house));
  const aspectMarks: AspectMark[] = [];
  for (let h = 1; h <= 12; h++) {
    if (occupied.has(h)) continue;
    const sign = (lagnaSign + h - 1) % 12;
    const by = benefics
      .filter((b) => aspect(b.planet, b.signIndex, sign) > 0)
      .map((b) => b.planet);
    if (by.length) {
      const l = limbs[h - 1];
      aspectMarks.push({ house: h, limb: l.limb, side: l.side, by });
    }
  }

  const bySign = new Map<number, Planet[]>();
  for (const p of positions)
    bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p.planet]);
  const crowded = Array.from(bySign.entries())
    .filter(([, ps]) => ps.length >= 3)
    .map(([sign, planets]) => {
      const house = houseFrom(lagnaSign, sign);
      const l = limbs[house - 1];
      return { house, limb: l.limb, side: l.side, planets };
    })
    .sort((a, b) => a.house - b.house);

  const sixthSign = (lagnaSign + 5) % 12;
  const inSixth = positions.filter((p) => p.signIndex === sixthSign);
  const sixth = {
    malefics: inSixth
      .filter((p) => !naturalBenefic(p, positions))
      .map((p) => p.planet),
    benefics: inSixth
      .filter((p) => naturalBenefic(p, positions))
      .map((p) => p.planet),
    aspectedByBenefic: benefics.some(
      (b) => aspect(b.planet, b.signIndex, sixthSign) > 0,
    ),
  };

  // 5.22: planets between the lagna and the Moon, counted from the lagna forward to the Moon (Adyar commentary).
  const moon = positions.find((p) => p.planet === "Moon");
  const moonHouse = moon ? houseOf(moon) : 1;
  const attendants: Attendant[] = positions
    .filter(
      (p) => p.planet !== "Moon" && p.planet !== "Rahu" && p.planet !== "Ketu",
    )
    .filter((p) => {
      const h = houseOf(p);
      return moonHouse > 1 && h >= 1 && h < moonHouse;
    })
    .map((p) => {
      const h = houseOf(p);
      return {
        planet: p.planet,
        house: h,
        visible: h >= 7,
        wellDressed: naturalBenefic(p, positions),
      };
    })
    .sort((a, b) => a.house - b.house);

  // 5.23: build from the lord of the rising navamsa, complexion from the lord of the Moon's navamsa.
  const lagnaNav = navamsaOf(lagnaLon);
  const moonNav = navamsaOf(moon?.lon ?? lagnaLon);
  const build = {
    navamsaLord: SIGN_LORD[lagnaNav.signIndex],
    navamsaSign: lagnaNav.signIndex,
  };
  const complexion = {
    navamsaLord: SIGN_LORD[moonNav.signIndex],
    navamsaSign: moonNav.signIndex,
    colour: PLANET_COLOUR[SIGN_LORD[moonNav.signIndex]],
  };

  const caveats: string[] = [
    "The limb table follows the rising drekkana, so it changes at 10 and 20 degrees of the rising sign: this is what makes the check useful for a birth time, and why it says nothing about the minutes inside one drekkana.",
    "Benefic and malefic are Parashara's natural classes (3.11): Jupiter, Venus, the waxing Moon and Mercury not joined by a malefic are benefics. The commentary reads Rahu and Ketu into 5.25 (poison and fire); the verse names only the seven, so the nodes are provisional.",
    "Aspects are counted at the Parashari setting in force (full aspects by default); 5.25 says only that a benefic's aspect gives a mark.",
    "Iyer's note has the acquired mark come in the period of the planet concerned; the verse says only that it comes later.",
    "The commentary on 5.24 (Adyar p. 305-306) records a tradition that reads the limbs from the drekkana when its lord is strong, head-first from the lagna when the lagna is strong; the verse itself reads by drekkana, which is what is shown.",
    "5.22 counts the planets from the lagna forward to the Moon (Adyar p. 301); the nodes are left out as the verse says grahas between the lagna and the Moon and the commentary counts the seven. The attendants are a historical check that only the family can confirm.",
  ];
  if (terms === "neutral")
    caveats.push(
      "The verse names the genitals (houses 2 and 12) and the testicles (3 and 11) in the third drekkana; this chart is not marked male, so the same regions are shown as lower abdomen and groin.",
    );

  return {
    lagnaSign,
    drekkana,
    drekkanaLabel: `${SIGNS[lagnaSign]} ${["first", "second", "third"][drekkana - 1]} drekkana`,
    limbs,
    marks,
    aspectMarks,
    crowded,
    sixth,
    attendants,
    build,
    complexion,
    caveats,
    sources: BODY_MARKS_SOURCES,
  };
}

/** One line per house, for the Rectify method card and the PDF. */
export function bodyMarkLines(
  r: BodyMarksResult,
): Array<{ house: number; text: string; kind: MarkKind | "aspect" | "none" }> {
  return r.limbs.map((l) => {
    const here = r.marks.filter((m) => m.house === l.house);
    const asp = r.aspectMarks.find((a) => a.house === l.house);
    if (!here.length && !asp)
      return { house: l.house, text: limbLabel(l), kind: "none" };
    const parts = here.map((m) => {
      const what =
        m.kind === "wound"
          ? `wound (${m.cause ?? "cause not stated"})`
          : m.kind === "both"
            ? `wound softened to a mark by ${m.aspectedBy.join(", ")}`
            : "mole or auspicious mark";
      return `${m.planet}: ${what}, ${m.congenital ? `from birth (${m.congenitalReason})` : "acquired later"}`;
    });
    if (asp) parts.push(`aspected by ${asp.by.join(", ")}: mole or mark`);
    const kind: MarkKind | "aspect" = here.length
      ? here.every((m) => m.kind === "mark")
        ? "mark"
        : here.some((m) => m.kind === "wound")
          ? "wound"
          : "both"
      : "aspect";
    return {
      house: l.house,
      text: `${limbLabel(l)}: ${parts.join("; ")}`,
      kind,
    };
  });
}

/** Limbs the verses predict a mark or wound on, as labels with side, unique and in house order. */
export function predictedLimbs(r: BodyMarksResult): string[] {
  const out: string[] = [];
  const add = (h: number) => {
    const label = limbLabel(r.limbs[h - 1]);
    if (!out.includes(label)) out.push(label);
  };
  for (const m of r.marks) add(m.house);
  for (const a of r.aspectMarks) add(a.house);
  for (const c of r.crowded) add(c.house);
  return out;
}

/** Every limb label the three drekkana tables can name, grouped by region, for the checklist a person fills in. */
export function limbChecklist(
  terms: LimbTerms,
): Array<{ region: string; drekkana: 1 | 2 | 3; limbs: string[] }> {
  return (
    [
      ["Head", 1],
      ["Trunk", 2],
      ["Lower body", 3],
    ] as Array<[string, 1 | 2 | 3]>
  ).map(([region, d]) => {
    const limbs: string[] = [];
    for (const l of limbsFor(d, terms)) {
      const label = limbLabel(l);
      if (!limbs.includes(label)) limbs.push(label);
    }
    return { region, drekkana: d, limbs };
  });
}

/** Score of one drekkana against the limbs a person has confirmed: predicted limbs confirmed, out of those predicted. */
export function scoreMarks(
  r: BodyMarksResult,
  confirmed: Iterable<string>,
): {
  score: number;
  max: number;
  hits: string[];
  misses: string[];
  unexplained: string[];
} {
  const c = new Set(confirmed);
  const predicted = predictedLimbs(r);
  const hits = predicted.filter((l) => c.has(l));
  const misses = predicted.filter((l) => !c.has(l));
  const all = new Set(r.limbs.map(limbLabel));
  const unexplained = Array.from(c).filter(
    (l) => all.has(l) && !predicted.includes(l),
  );
  return {
    score: hits.length,
    max: predicted.length,
    hits,
    misses,
    unexplained,
  };
}
