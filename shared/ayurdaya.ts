/**
 * Ayurdaya (span of life), Brihat Jataka adhyaya 7 (Varahamihira).
 *
 * 7.1   Years at exaltation: Sun 19, Moon 25, Mars 15, Mercury 12, Jupiter 15, Venus 21, Saturn 20 (Maya, Yavana,
 *       Manittha, Saktipurva). This is the Pindayu.
 * 7.2   Half at debilitation, proportional between; the lagna gives the navamsas of the rising sign that have risen
 *       (others: the signs from Aries); a planet in an enemy's sign loses a third, a combust planet half, the
 *       retrograde planet (vakra) excepted from the first, Venus and Saturn from the second.
 * 7.3   Malefics in the 12th to the 7th lose all, a half, a third, a quarter, a fifth, a sixth; benefics half of that;
 *       of several in one sign only the strongest loses (Satya).
 * 7.4   A malefic in the lagna: the total loses the fraction navamsas-from-Aries / 108; half if a benefic aspects.
 * 7.5-8 Animal spans, the 120-year-and-5-day maximum, the Pindayu critics (7.7-8, held interpolated by the commentator).
 * 7.9   Jivasarma's seventh of the maximum (unsupported); Satya: years equal to the navamsas passed.
 * 7.10  Satya's rule: longitude in minutes / 200, the twelves cast off, the remainder in years and months.
 * 7.11  Satya's multipliers: exalted or retrograde x3; vargottama, own navamsa, own sign or own drekkana x2.
 * 7.12  The lagna gives its navamsas, or its signs when the rising sign is strong (1.19); no krurodaya reduction.
 * 7.13  Satya's method is the best; where several multipliers apply, only the largest.
 * 7.14  Cancer rising with Jupiter and the Moon, Mercury and Venus in kendras, the rest in 3, 6, 11: unlimited life.
 *
 * Sources: Neely's translation on wisdomlib (verse pages), the public-domain Iyer 1885 translation on archive.org
 * (pp. 59-72) and the Adyar Library 1951 Sanskrit edition with Aiyangar's commentary (pp. 330-368). Parashara's
 * treatment (BPHS 43) is cited where it fills a gap the verses leave. Anything not stated in the verses is provisional.
 */
import {
  EXALTATION,
  OWN_SIGNS,
  SIGN_LORD,
  houseFrom,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { navamsaOf } from "./jaimini";
import {
  DEFAULT_ASPECT_FLOOR,
  drishtiQuarters,
  naturalBenefic,
  type AspectFloor,
  type ParashariSource,
} from "./parashari";
import { BPHS_URL } from "./parashari-data";
import type { ShadbalaResult } from "./shadbala";

const WL =
  "https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/";
const IYER = "https://archive.org/details/brihatjatakavar00iyergoog";
const ADYAR = "https://archive.org/details/in.ernet.dli.2015.382698";

const V = (n: number, doc: number): ParashariSource => ({
  label: `Brihat Jataka 7.${n}`,
  url: `${WL}doc${doc}.html`,
});

export const AYURDAYA_SOURCES: Record<string, ParashariSource> = {
  v1: V(1, 1501673),
  v2: V(2, 1501674),
  v3: V(3, 1501675),
  v4: V(4, 1501676),
  v7: V(7, 1501679),
  v9: V(9, 1501681),
  v10: V(10, 1501682),
  v11: V(11, 1501683),
  v12: V(12, 1501684),
  v13: V(13, 1501685),
  v14: V(14, 1501686),
  v119: { label: "Brihat Jataka 1.19", url: `${WL}doc1501582.html` },
  iyer: { label: "Iyer 1885, pp. 59-72", url: IYER },
  adyar: { label: "Adyar 1951, pp. 330-368", url: ADYAR },
  iyerOrbs: {
    label: "Iyer 1885, p. 62 note (f)",
    url: IYER,
    provisional: true,
  },
  iyerVakra: {
    label: "Iyer 1885, p. 62 note (g)",
    url: IYER,
    provisional: true,
  },
  iyerLagna: {
    label: "Iyer 1885, p. 61 note (d)",
    url: IYER,
    provisional: true,
  },
  bphsYears: { label: "Parashara 43.4-8", url: BPHS_URL(43) },
  bphsReductions: { label: "Parashara 43.9-13", url: BPHS_URL(43) },
  bphsLagna: { label: "Parashara 43.15", url: BPHS_URL(43), provisional: true },
  bphsLargest: {
    label: "Parashara 43.22",
    url: BPHS_URL(43),
    provisional: true,
  },
  bphsChoice: {
    label: "Parashara 43.32",
    url: BPHS_URL(43),
    provisional: true,
  },
};

export type Seven =
  "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn";
export const SEVEN: Seven[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];
const isSeven = (p: Planet): p is Seven => (SEVEN as string[]).includes(p);

/** 7.1: years at the exaltation degree. */
export const PINDA_YEARS: Record<Seven, number> = {
  Sun: 19,
  Moon: 25,
  Mars: 15,
  Mercury: 12,
  Jupiter: 15,
  Venus: 21,
  Saturn: 20,
};

/** Maximum human span, 7.5: 120 years and 5 days. */
export const PARAMAYUS_YEARS = 120 + 5 / 365.25;

/**
 * Combustion limits from Iyer's note (f) under 7.2 (direct, retrograde), in degrees from the Sun. The verse only
 * names the combust planet; the limits are the commentator's, so they are provisional.
 */
export const COMBUST_LIMIT: Partial<Record<Seven, [number, number]>> = {
  Moon: [12, 12],
  Mars: [17, 17],
  Mercury: [14, 12],
  Jupiter: [11, 11],
  Venus: [10, 8],
  Saturn: [15, 15],
};

/** 7.3: the fraction lost by a malefic in the 12th ... 7th from the lagna. */
export const CHAKRAPATA_FRACTION: Record<number, number> = {
  12: 1,
  11: 1 / 2,
  10: 1 / 3,
  9: 1 / 4,
  8: 1 / 5,
  7: 1 / 6,
};

export type ReductionKind = "enemy" | "combust" | "chakrapata";
export const REDUCTION_LABEL: Record<ReductionKind, string> = {
  enemy: "enemy's sign (satru-kshetra harana)",
  combust: "combust (astangata harana)",
  chakrapata: "in the 7th to 12th (chakrapata harana)",
};

export interface Reduction {
  kind: ReductionKind;
  /** Fraction of the planet's years lost. */
  fraction: number;
  note: string;
  /** Applied (the largest), or set aside because a larger one applies. */
  applied: boolean;
}

export type Multiplier = 1 | 2 | 3;

export interface AyurPlanet {
  planet: Seven;
  lon: number;
  signIndex: number;
  house: number;
  benefic: boolean;
  retrograde: boolean;
  /** Pindayu, 7.1-3. */
  pinda: {
    base: number;
    /** Degrees from the debilitation point, 0..180. */
    fromDebilitation: number;
    proportioned: number;
    reductions: Reduction[];
    final: number;
  };
  /** Amsayu, 7.9-13. */
  amsa: {
    /** Navamsas from the start of Aries, fractional. */
    navamsas: number;
    base: number;
    multiplier: Multiplier;
    multiplierReasons: string[];
    /** All grounds for x2 and x3; only the largest is used (7.13). */
    multiplied: number;
    reductions: Reduction[];
    final: number;
  };
}

export interface LagnaYears {
  lon: number;
  signIndex: number;
  degInSign: number;
  /** Navamsas of the rising sign that have risen, as years (Varahamihira's first reading, 7.2). */
  navamsasRisen: number;
  /** Signs from Aries and the fraction of the rising sign, as years (Manittha's school, 7.2). */
  signsFromAries: number;
  /** Navamsas from Aries, the twelves cast off (Satya, 7.12). */
  navamsasFromAries: number;
  /** 1.19: the lagna's lord, Jupiter or Mercury occupies or aspects it. */
  strong: boolean;
  strongBy: Planet[];
  /** Pindayu choice: navamsas risen unless the sign lord out-weighs the navamsa lord (Iyer note d, Parashara 43.15). */
  pindaChoice: "navamsasRisen" | "signsFromAries";
  pindaChoiceNote: string;
  pindaYears: number;
  /** Amsayu choice: signs when the rising sign is strong (7.12), else navamsas. */
  amsaChoice: "signsFromAries" | "navamsasFromAries";
  amsaYears: number;
}

export interface Krurodaya {
  /** Malefics of the seven in the lagna sign. */
  malefics: Seven[];
  /** Benefics of the seven aspecting the lagna sign at or above the floor. */
  aspectedBy: Planet[];
  /** Fraction of the total lost: navamsas from Aries / 108, halved under a benefic's aspect. */
  fraction: number;
  /** The alternative reading (Iyer note b): navamsas of the rising sign risen / 108. */
  altFraction: number;
  years: number;
}

export interface AyurdayaResult {
  planets: AyurPlanet[];
  lagna: LagnaYears;
  pinda: {
    planetsTotal: number;
    subtotal: number;
    krurodaya: Krurodaya;
    total: number;
  };
  amsa: {
    planetsTotal: number;
    total: number;
  };
  /** 7.14 Amitayu combination. */
  amita: { applies: boolean; met: string[]; missing: string[] };
  /** Planets sharing a sign in 7-12 where only the strongest was reduced. */
  sharedSigns: { signIndex: number; planets: Seven[]; reduced: Seven }[];
  /** Whether Shadbala was available for the strength tests. */
  shadbalaKnown: boolean;
  caveats: string[];
  sources: typeof AYURDAYA_SOURCES;
}

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Years to a "Ny Mm Dd" string. */
export function formatYears(y: number): string {
  if (!isFinite(y)) return "—";
  const sign = y < 0 ? "-" : "";
  let v = Math.abs(y);
  const years = Math.floor(v);
  v = (v - years) * 12;
  const months = Math.floor(v);
  const days = Math.round((v - months) * 30);
  const parts = [`${years}y`];
  if (months || days) parts.push(`${months}m`);
  if (days) parts.push(`${days}d`);
  return sign + parts.join(" ");
}

function drekkanaSign(sign: number, deg: number) {
  return (sign + 4 * Math.floor(deg / 10)) % 12;
}

function largestOnly(list: Reduction[]): Reduction[] {
  if (!list.length) return list;
  const max = Math.max(...list.map((r) => r.fraction));
  let taken = false;
  return list.map((r) => {
    const applied = !taken && r.fraction === max;
    if (applied) taken = true;
    return { ...r, applied };
  });
}

function applyReductions(years: number, list: Reduction[]): number {
  const r = list.find((x) => x.applied);
  return r ? years * (1 - r.fraction) : years;
}

export function computeAyurdaya(
  positions: PlanetPosition[],
  lagnaLon: number,
  shadbala?: ShadbalaResult,
  aspectFloor: AspectFloor = DEFAULT_ASPECT_FLOOR,
): AyurdayaResult {
  const src = AYURDAYA_SOURCES;
  const caveats: string[] = [];
  const lagnaSign = Math.floor(norm360(lagnaLon) / 30);
  const lagnaDeg = norm360(lagnaLon) - lagnaSign * 30;
  const seven = positions.filter((p) => isSeven(p.planet));
  const sun = positions.find((p) => p.planet === "Sun");
  const rupas = (p: Planet) =>
    shadbala?.planets.find((x) => x.planet === p)?.total;

  // Chakrapata: of several planets in one sign only the strongest loses (7.3).
  const inRear = seven.filter((p) => {
    const h = houseFrom(lagnaSign, p.signIndex);
    return h >= 7 && h <= 12;
  });
  const bySign = new Map<number, PlanetPosition[]>();
  for (const p of inRear) {
    const list = bySign.get(p.signIndex) ?? [];
    list.push(p);
    bySign.set(p.signIndex, list);
  }
  const sharedSigns: AyurdayaResult["sharedSigns"] = [];
  const chakrapataTarget = new Set<Seven>();
  bySign.forEach((list, signIndex) => {
    if (list.length === 1) {
      chakrapataTarget.add(list[0].planet as Seven);
      return;
    }
    let strongest = list[0];
    if (shadbala) {
      strongest = list.reduce((a, b) =>
        (rupas(b.planet) ?? 0) > (rupas(a.planet) ?? 0) ? b : a,
      );
    }
    chakrapataTarget.add(strongest.planet as Seven);
    sharedSigns.push({
      signIndex,
      planets: list.map((p) => p.planet as Seven),
      reduced: strongest.planet as Seven,
    });
  });
  if (sharedSigns.length && !shadbala) {
    caveats.push(
      "Several planets share a sign in the 7th to 12th and Shadbala is not available, so the first of them is treated as the strongest for the chakrapata reduction.",
    );
  }

  const reductionsFor = (p: PlanetPosition, withChakrapata: boolean) => {
    const list: Reduction[] = [];
    const planet = p.planet as Seven;
    if (p.dignity === "Inimical") {
      if (p.retrograde) {
        list.push({
          kind: "enemy",
          fraction: 0,
          note: "in an enemy's sign but retrograde, so exempt (vakra, 7.2)",
          applied: false,
        });
      } else {
        list.push({
          kind: "enemy",
          fraction: 1 / 3,
          note: "in an enemy's sign, a third lost (7.2)",
          applied: false,
        });
      }
    }
    if (sun && planet !== "Sun" && COMBUST_LIMIT[planet]) {
      const d = Math.abs(((p.lon - sun.lon + 540) % 360) - 180);
      const limit = COMBUST_LIMIT[planet]![p.retrograde ? 1 : 0];
      if (d <= limit) {
        if (planet === "Venus" || planet === "Saturn") {
          list.push({
            kind: "combust",
            fraction: 0,
            note: `within ${limit}° of the Sun, but Venus and Saturn are exempt (7.2)`,
            applied: false,
          });
        } else {
          list.push({
            kind: "combust",
            fraction: 1 / 2,
            note: `within ${limit}° of the Sun, half lost (7.2)`,
            applied: false,
          });
        }
      }
    }
    if (withChakrapata) {
      const h = houseFrom(lagnaSign, p.signIndex);
      const f = CHAKRAPATA_FRACTION[h];
      if (f !== undefined) {
        const benefic = naturalBenefic(p, positions);
        const frac = benefic ? f / 2 : f;
        if (chakrapataTarget.has(planet)) {
          list.push({
            kind: "chakrapata",
            fraction: frac,
            note: `${benefic ? "benefic" : "malefic"} in the ${h}th, ${fractionLabel(frac)} lost (7.3)`,
            applied: false,
          });
        } else {
          list.push({
            kind: "chakrapata",
            fraction: 0,
            note: `in the ${h}th with a stronger planet, which alone loses (7.3)`,
            applied: false,
          });
        }
      }
    }
    return largestOnly(list.filter((r) => r.fraction > 0)).concat(
      list.filter((r) => r.fraction === 0),
    );
  };

  const planets: AyurPlanet[] = seven.map((p) => {
    const planet = p.planet as Seven;
    const ex = EXALTATION[planet]!;
    const exLon = ex.sign * 30 + ex.deg;
    const debLon = norm360(exLon + 180);
    let d = norm360(p.lon - debLon);
    if (d > 180) d = 360 - d;
    const base = PINDA_YEARS[planet];
    const proportioned = (base / 2) * (1 + d / 180);
    const pindaRed = reductionsFor(p, true);
    const pindaFinal = applyReductions(proportioned, pindaRed);

    const navamsas = (norm360(p.lon) * 108) / 360;
    const amsaBase = navamsas % 12;
    const reasons: string[] = [];
    let mult: Multiplier = 1;
    if (p.signIndex === ex.sign) {
      reasons.push("in its exaltation sign (x3)");
      mult = 3;
    }
    if (p.retrograde) {
      reasons.push("retrograde (x3)");
      mult = 3;
    }
    const d9 = navamsaOf(norm360(p.lon)).signIndex;
    if (d9 === p.signIndex) {
      reasons.push("vargottama (x2)");
      if (mult < 2) mult = 2;
    } else if (SIGN_LORD[d9] === planet) {
      reasons.push("in its own navamsa (x2)");
      if (mult < 2) mult = 2;
    }
    if (OWN_SIGNS[planet]?.includes(p.signIndex)) {
      reasons.push("in its own sign (x2)");
      if (mult < 2) mult = 2;
    }
    const d3 = drekkanaSign(p.signIndex, p.degInSign);
    if (SIGN_LORD[d3] === planet) {
      reasons.push("in its own drekkana (x2)");
      if (mult < 2) mult = 2;
    }
    const multiplied = amsaBase * mult;
    const amsaRed = reductionsFor(p, true);
    const amsaFinal = applyReductions(multiplied, amsaRed);
    return {
      planet,
      lon: p.lon,
      signIndex: p.signIndex,
      house: houseFrom(lagnaSign, p.signIndex),
      benefic: naturalBenefic(p, positions),
      retrograde: p.retrograde,
      pinda: {
        base,
        fromDebilitation: d,
        proportioned,
        reductions: pindaRed,
        final: pindaFinal,
      },
      amsa: {
        navamsas,
        base: amsaBase,
        multiplier: mult,
        multiplierReasons: reasons,
        multiplied,
        reductions: amsaRed,
        final: amsaFinal,
      },
    };
  });

  // Lagna years.
  const lagnaLord = SIGN_LORD[lagnaSign];
  const navLagna = navamsaOf(norm360(lagnaLon)).signIndex;
  const navLord = SIGN_LORD[navLagna];
  const strongBy: Planet[] = [];
  for (const p of seven) {
    if (!["Jupiter", "Mercury", lagnaLord].includes(p.planet)) continue;
    if (p.signIndex === lagnaSign) strongBy.push(p.planet);
    else if (drishtiQuarters(p.planet, p.signIndex, lagnaSign) >= aspectFloor)
      strongBy.push(p.planet);
  }
  const navamsasRisen = (lagnaDeg / 30) * 9;
  const signsFromAries = norm360(lagnaLon) / 30;
  const navamsasFromAries = ((norm360(lagnaLon) * 108) / 360) % 12;
  let pindaChoice: LagnaYears["pindaChoice"] = "navamsasRisen";
  let pindaChoiceNote =
    "the navamsas of the rising sign that have risen, Varahamihira's first reading (7.2)";
  if (shadbala && lagnaLord !== navLord) {
    const a = (rupas(lagnaLord) ?? 0) / 60;
    const b = (rupas(navLord) ?? 0) / 60;
    if (a > b) {
      pindaChoice = "signsFromAries";
      pindaChoiceNote = `the signs from Aries, because the sign lord ${lagnaLord} (${a.toFixed(1)} rupas) out-weighs the navamsa lord ${navLord} (${b.toFixed(1)}), the commentator's test`;
    } else {
      pindaChoiceNote = `the navamsas risen, because the navamsa lord ${navLord} (${b.toFixed(1)} rupas) out-weighs the sign lord ${lagnaLord} (${a.toFixed(1)}), the commentator's test`;
    }
  } else if (shadbala) {
    pindaChoiceNote =
      "the navamsas risen; the sign and navamsa lords coincide, so the commentator's test does not separate the readings";
  }
  const lagna: LagnaYears = {
    lon: norm360(lagnaLon),
    signIndex: lagnaSign,
    degInSign: lagnaDeg,
    navamsasRisen,
    signsFromAries,
    navamsasFromAries,
    strong: strongBy.length > 0,
    strongBy,
    pindaChoice,
    pindaChoiceNote,
    pindaYears:
      pindaChoice === "navamsasRisen" ? navamsasRisen : signsFromAries,
    amsaChoice: strongBy.length ? "signsFromAries" : "navamsasFromAries",
    amsaYears: strongBy.length ? signsFromAries % 12 : navamsasFromAries,
  };

  // Krurodaya, 7.4.
  const inLagna = seven.filter((p) => p.signIndex === lagnaSign);
  const malefics = inLagna
    .filter((p) => !naturalBenefic(p, positions))
    .map((p) => p.planet as Seven);
  const aspectedBy = seven
    .filter(
      (p) =>
        naturalBenefic(p, positions) &&
        p.signIndex !== lagnaSign &&
        drishtiQuarters(p.planet, p.signIndex, lagnaSign) >= aspectFloor,
    )
    .map((p) => p.planet);
  const planetsTotal = planets.reduce((a, p) => a + p.pinda.final, 0);
  const subtotal = planetsTotal + lagna.pindaYears;
  let fraction = 0;
  let altFraction = 0;
  if (malefics.length) {
    fraction = norm360(lagnaLon) / 360;
    altFraction = navamsasRisen / 108;
    if (aspectedBy.length) {
      fraction /= 2;
      altFraction /= 2;
    }
  }
  const krurodaya: Krurodaya = {
    malefics,
    aspectedBy,
    fraction,
    altFraction,
    years: subtotal * fraction,
  };
  const pindaTotal = subtotal - krurodaya.years;

  const amsaPlanets = planets.reduce((a, p) => a + p.amsa.final, 0);
  const amsaTotal = amsaPlanets + lagna.amsaYears;

  // 7.14 Amitayu.
  const met: string[] = [];
  const missing: string[] = [];
  const at = (p: Planet) => positions.find((x) => x.planet === p);
  const kendra = (p: Planet) =>
    [1, 4, 7, 10].includes(houseFrom(lagnaSign, at(p)!.signIndex));
  if (lagnaSign === 3) met.push("Cancer rising");
  else missing.push("Cancer rising");
  for (const p of ["Jupiter", "Moon"] as Planet[]) {
    if (at(p)?.signIndex === lagnaSign) met.push(`${p} in the lagna`);
    else missing.push(`${p} in the lagna`);
  }
  for (const p of ["Mercury", "Venus"] as Planet[]) {
    if (at(p) && kendra(p)) met.push(`${p} in a kendra`);
    else missing.push(`${p} in a kendra`);
  }
  for (const p of ["Sun", "Mars", "Saturn"] as Planet[]) {
    const h = at(p) ? houseFrom(lagnaSign, at(p)!.signIndex) : 0;
    if ([3, 6, 11].includes(h)) met.push(`${p} in the 3rd, 6th or 11th`);
    else missing.push(`${p} in the 3rd, 6th or 11th`);
  }

  caveats.push(
    "Where two reductions fall on one planet the verses do not say whether both apply; only the larger is taken here, following Parashara 43.22, which keeps the halving over the third.",
    "The combustion limits are the commentator's (Iyer note f under 7.2): Moon 12°, Mars 17°, Mercury 14° (12° retrograde), Jupiter 11°, Venus 10° (8° retrograde), Saturn 15°.",
    "Vakra in 7.2 is read as the retrograde planet, the reading Iyer says Varahamihira himself concurs in; Badarayana reads it as Mars, which would exempt Mars alone from the enemy's-sign loss.",
    "Rahu and Ketu give no years in this chapter and are not counted among the malefics for the chakrapata or krurodaya reductions.",
    "Strength for the chakrapata tie (7.3) and for the lagna's Pindayu reading (Iyer note d, Parashara 43.15) is taken from Shadbala; Varahamihira states neither test.",
    "Parashara 43.32 chooses Pindayu, Amsayu or Nisargayu by the strongest of the Sun, the lagna and the Moon; Varahamihira instead calls Satya's Amsayu the best method (7.13). Both totals are shown and neither is preferred by the app.",
    "Iyer's commentator holds 7.7-8 (the objection that Pindayu never falls below twenty years) to be interpolated and shows a chart yielding under twenty; nothing here depends on those two verses.",
  );

  return {
    planets,
    lagna,
    pinda: { planetsTotal, subtotal, krurodaya, total: pindaTotal },
    amsa: { planetsTotal: amsaPlanets, total: amsaTotal },
    amita: { applies: missing.length === 0, met, missing },
    sharedSigns,
    shadbalaKnown: !!shadbala,
    caveats,
    sources: src,
  };
}

function fractionLabel(f: number): string {
  const table: [number, string][] = [
    [1, "all"],
    [1 / 2, "a half"],
    [1 / 3, "a third"],
    [1 / 4, "a quarter"],
    [1 / 5, "a fifth"],
    [1 / 6, "a sixth"],
    [1 / 8, "an eighth"],
    [1 / 10, "a tenth"],
    [1 / 12, "a twelfth"],
  ];
  for (const [v, l] of table) if (Math.abs(v - f) < 1e-9) return l;
  return `${Math.round(f * 100)}%`;
}
export { fractionLabel };
