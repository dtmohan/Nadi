// Sudarshana chakra, Brihat Parashara Hora Sastra ch. 74 (Santhanam translation, jyotishvidya.com).
// Three rings of twelve bhavas counted from the lagna, the Moon and the Sun (74.4-6); every bhava is judged by the
// benefics and malefics that occupy or aspect its three signs (74.10-14), and each bhava then rules one year in turn,
// with the twelve bhavas taking one month each inside the year (74.21-26). Interpretive choices the chapter does not
// state are marked provisional in the sources below.
import { DateTime } from "luxon";
import {
  EXALTATION,
  PLANETS,
  SIGN_LORD,
  SIGNS,
  houseFrom,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { BPHS_URL } from "./parashari-data";
import {
  naturalBenefic,
  ruleAspect,
  type AspectFloor,
  type ParashariSource,
  DEFAULT_ASPECT_FLOOR,
} from "./parashari";
import type { ShadbalaResult } from "./shadbala";
import type { AshtakavargaResult } from "./ashtakavarga";

export type Ring = "Lagna" | "Moon" | "Sun";
export const RINGS: Ring[] = ["Lagna", "Moon", "Sun"];

export type Nature = "benefic" | "malefic" | "neutral";
export type Verdict = "advances" | "harmed" | "mixed";

export interface Placement {
  planet: Planet;
  ring: Ring;
  /** Bhava (1-12) the planet takes in this ring. */
  house: number;
  nature: Nature;
  /** Why the nature departs from the planet's natural class, when it does. */
  note?: string;
}

export interface ChakraCell {
  ring: Ring;
  signIndex: number;
  sign: string;
  lord: Planet;
  occupants: Planet[];
  /** Planets of this ring aspecting the sign at or above the rule floor. */
  aspects: { planet: Planet; quarters: number }[];
}

export interface ChakraBhava {
  house: number;
  cells: ChakraCell[];
  benefics: Placement[];
  malefics: Placement[];
  neutrals: Placement[];
  /** Aspecting planets counted per 74.11-13 ("effects of the aspects will be the same"). */
  beneficAspects: Placement[];
  maleficAspects: Placement[];
  verdict: Verdict;
  /** How the verdict was reached. */
  basis: "majority" | "strength" | "equal" | "lord";
  text: string;
}

export interface SudarshanaYear {
  /** Completed years at the start of the period. */
  age: number;
  /** Bhava that becomes lagna of the year. */
  house: number;
  start: string;
  end: string;
  current: boolean;
  verdict: "favourable" | "unfavourable" | "mixed";
  favourable: string[];
  unfavourable: string[];
  /** Verdict of the 74.24-26 tally alone; the year verdict combines it with the year-lagna bhava's own verdict. */
  tally: "favourable" | "unfavourable" | "mixed";
  /** Points for and against (see caveats). */
  plus: number;
  minus: number;
  /** 74.27-28 cross-check: Sarvashtakavarga rekhas of the year-lagna's sign in the lagna ring. */
  av: { rekhas: number; band: "favourable" | "medium" | "adverse" };
  agreement: "agree" | "differ" | "open";
}

export interface SudarshanaMonth {
  index: number;
  house: number;
  start: string;
  end: string;
  current: boolean;
  verdict: "favourable" | "unfavourable" | "mixed";
  favourable: string[];
  unfavourable: string[];
  plus: number;
  minus: number;
}

/** The reading a bhava gives whenever it becomes lagna of a year or a month (74.24-26 with the bhava's own verdict). */
export interface SudarshanaHouseYear {
  house: number;
  verdict: "favourable" | "unfavourable" | "mixed";
  tally: "favourable" | "unfavourable" | "mixed";
  plus: number;
  minus: number;
  favourable: string[];
  unfavourable: string[];
}

export interface SudarshanaResult {
  /** Birth instant (UTC ISO) the bhava dasa is counted from. */
  birthIso: string;
  /** One entry per bhava, index house - 1; the same reading serves any year or month that bhava rules. */
  houseYears: SudarshanaHouseYear[];
  bases: Record<Ring, { signIndex: number; sign: string }>;
  /** 74.19-20: the chakra is read only when the lagna, Moon and Sun stand in three different signs. */
  applicable: boolean;
  applicabilityText: string;
  bhavas: ChakraBhava[];
  placements: Placement[];
  /** Whether saptavarga dignities were available for the 74.15-16 adjustment. */
  vargasChecked: boolean;
  years: SudarshanaYear[];
  months: SudarshanaMonth[];
  currentYear?: SudarshanaYear;
  currentMonth?: SudarshanaMonth;
  aspectFloor: AspectFloor;
  sources: Record<string, ParashariSource>;
  caveats: string[];
}

const S = (verse: string, provisional?: boolean): ParashariSource => ({
  label: `Parashara 74.${verse}`,
  url: BPHS_URL(74),
  provisional,
});

export const SUDARSHANA_SOURCES = {
  drawing: S("4-6"),
  reading: S("7-9"),
  bhava: S("10-14"),
  vargas: S("15-16"),
  applicability: S("19-20"),
  dasa: S("21-23"),
  effects: S("24-26"),
  av: S("27-28"),
  sunRule: S("7-9"),
  tieStrength: S("11-13", true),
  lordFallback: S("14", true),
  ringCount: S("7-9", true),
  yearStart: S("21-23", true),
  yearRules: S("24-26", true),
  avMapping: S("27-28", true),
} satisfies Record<string, ParashariSource>;

const MALEFIC_VARGA = new Set(["enemy", "great enemy", "debilitation"]);
const BENEFIC_VARGA = new Set([
  "own",
  "moolatrikona",
  "exaltation",
  "great friend",
  "friend",
]);

function ringHouse(
  ring: Ring,
  bases: Record<Ring, number>,
  signIndex: number,
): number {
  return houseFrom(bases[ring], signIndex);
}

/**
 * Nature of a planet for the chakra: the natural class of 3.11, with 74.7-9 (the Sun is auspicious only in the first
 * bhava; an exalted malefic does no harm) and 74.15-16 (a benefic in more malefic vargas, or a malefic in more benefic
 * vargas, loses its character; read here as neutral, which the verse does not spell out).
 */
function chakraNature(
  p: PlanetPosition,
  all: PlanetPosition[],
  house: number,
  shadbala?: ShadbalaResult,
): { nature: Nature; note?: string } {
  if (p.planet === "Sun") {
    return house === 1
      ? {
          nature: "benefic",
          note: "the Sun is auspicious in the first bhava (74.7-9)",
        }
      : {
          nature: "malefic",
          note: "the Sun is malefic outside the first bhava (74.7-9)",
        };
  }
  const benefic = naturalBenefic(p, all);
  if (!benefic) {
    const ex = EXALTATION[p.planet];
    if (ex && p.signIndex === ex.sign)
      return {
        nature: "neutral",
        note: "an exalted malefic produces no evil (74.8)",
      };
  }
  const sb = shadbala?.planets.find((x) => x.planet === p.planet);
  if (sb) {
    const good = sb.sthana.saptavarga.filter((v) =>
      BENEFIC_VARGA.has(v.relation),
    ).length;
    const bad = sb.sthana.saptavarga.filter((v) =>
      MALEFIC_VARGA.has(v.relation),
    ).length;
    if (benefic && bad > good)
      return {
        nature: "neutral",
        note: `benefic in more malefic vargas (${bad} of 7) loses benevolence (74.15-16)`,
      };
    if (!benefic && good > bad)
      return {
        nature: "neutral",
        note: `malefic in more benefic vargas (${good} of 7) loses malevolence (74.15-16)`,
      };
  }
  return { nature: benefic ? "benefic" : "malefic" };
}

const P = (x: Placement) => `${x.planet} (${x.ring})`;

export function computeSudarshana(
  positions: PlanetPosition[],
  lagnaIdx: number,
  birthIso: string,
  asOfIso: string,
  ashtakavarga: AshtakavargaResult,
  shadbala?: ShadbalaResult,
  aspectFloor: AspectFloor = DEFAULT_ASPECT_FLOOR,
): SudarshanaResult {
  const moon = positions.find((p) => p.planet === "Moon");
  const sun = positions.find((p) => p.planet === "Sun");
  const bases: Record<Ring, number> = {
    Lagna: lagnaIdx,
    Moon: moon?.signIndex ?? lagnaIdx,
    Sun: sun?.signIndex ?? lagnaIdx,
  };
  const distinct = new Set(Object.values(bases)).size === 3;
  const asp = ruleAspect(aspectFloor);
  const nine = positions.filter((p) => PLANETS.includes(p.planet));

  // Every planet takes one bhava in each ring.
  const placements: Placement[] = [];
  for (const ring of RINGS) {
    for (const p of nine) {
      const house = ringHouse(ring, bases, p.signIndex);
      const n = chakraNature(p, positions, house, shadbala);
      placements.push({
        planet: p.planet,
        ring,
        house,
        nature: n.nature,
        note: n.note,
      });
    }
  }
  const natureOf = (planet: Planet, ring: Ring) =>
    placements.find((x) => x.planet === planet && x.ring === ring)!;
  const strength = (planet: Planet) =>
    shadbala?.planets.find((x) => x.planet === planet)?.total ?? 0;

  const bhavas: ChakraBhava[] = [];
  for (let h = 1; h <= 12; h++) {
    const cells: ChakraCell[] = RINGS.map((ring) => {
      const signIndex = (bases[ring] + h - 1) % 12;
      const occupants = nine
        .filter((p) => p.signIndex === signIndex)
        .map((p) => p.planet);
      const aspects = nine
        .filter((p) => p.signIndex !== signIndex)
        .map((p) => ({
          planet: p.planet,
          quarters: asp(p.planet, p.signIndex, signIndex),
        }))
        .filter((a) => a.quarters > 0);
      return {
        ring,
        signIndex,
        sign: SIGNS[signIndex],
        lord: SIGN_LORD[signIndex],
        occupants,
        aspects,
      };
    });
    const occ = placements.filter((x) => x.house === h);
    const benefics = occ.filter((x) => x.nature === "benefic");
    const malefics = occ.filter((x) => x.nature === "malefic");
    const neutrals = occ.filter((x) => x.nature === "neutral");
    const aspPl: Placement[] = [];
    for (const c of cells)
      for (const a of c.aspects) {
        const n = natureOf(a.planet, c.ring);
        aspPl.push({ ...n, house: h });
      }
    const beneficAspects = aspPl.filter((x) => x.nature === "benefic");
    const maleficAspects = aspPl.filter((x) => x.nature === "malefic");
    const good = benefics.length + beneficAspects.length;
    const bad = malefics.length + maleficAspects.length;
    let verdict: Verdict;
    let basis: ChakraBhava["basis"];
    let text: string;
    if (occ.length === 0 && aspPl.length === 0) {
      // 74.14: neither occupied nor aspected; judge by the lord. Read as the lords' natural class.
      const lordNatures = cells.map((c) => {
        const lp = positions.find((p) => p.planet === c.lord)!;
        return naturalBenefic(lp, positions);
      });
      const lg = lordNatures.filter(Boolean).length;
      verdict = lg === 3 ? "advances" : lg === 0 ? "harmed" : "mixed";
      basis = "lord";
      text = `No planet occupies or aspects the ${ord(h)} in any ring; its lords ${cells
        .map((c) => `${c.lord} (${c.ring} ring, ${c.sign})`)
        .join(", ")} decide (74.14).`;
    } else if (good !== bad) {
      verdict = good > bad ? "advances" : "harmed";
      basis = "majority";
      text = `${good} benefic and ${bad} malefic influences: ${verdict === "advances" ? "the bhava advances" : "the bhava is harmed"} (74.10-13).`;
    } else {
      const gs = [...benefics, ...beneficAspects].reduce(
        (s, x) => s + strength(x.planet),
        0,
      );
      const bs = [...malefics, ...maleficAspects].reduce(
        (s, x) => s + strength(x.planet),
        0,
      );
      const tiedNode = [
        ...malefics,
        ...maleficAspects,
        ...benefics,
        ...beneficAspects,
      ].some((x) => x.planet === "Rahu" || x.planet === "Ketu");
      if (shadbala && !tiedNode && Math.abs(gs - bs) > 0.05) {
        verdict = gs > bs ? "advances" : "harmed";
        basis = "strength";
        text = `${good} benefic and ${bad} malefic influences; the ${gs > bs ? "benefics" : "malefics"} are stronger by Shadbala (${gs.toFixed(0)} vs ${bs.toFixed(0)} virupas), so they decide (74.13).`;
      } else if (tiedNode && good > 0) {
        verdict = "mixed";
        basis = "equal";
        text = `${good} benefic and ${bad} malefic influences; Rahu and Ketu carry no Shadbala, so strength cannot break the tie: mixed results (74.13).`;
      } else {
        verdict = "mixed";
        basis = "equal";
        text =
          good === 0
            ? `Only neutral influences touch the ${ord(h)}; mixed results (74.13).`
            : `${good} benefic and ${bad} malefic influences of matching strength: mixed results (74.13).`;
      }
    }
    bhavas.push({
      house: h,
      cells,
      benefics,
      malefics,
      neutrals,
      beneficAspects,
      maleficAspects,
      verdict,
      basis,
      text,
    });
  }

  // Dasa of the bhavas: one year each in turn from birth, one month each inside the year (74.21-23).
  const birth = DateTime.fromISO(birthIso, { zone: "utc" });
  const asOf = DateTime.fromISO(asOfIso, { zone: "utc" });
  const ageNow = Math.max(0, Math.floor(asOf.diff(birth, "years").years));
  const cycleStart = Math.floor(ageNow / 12) * 12;
  const yearEffects = (house: number) => {
    const fav: string[] = [];
    const unf: string[] = [];
    const rel = (x: Placement) => houseFrom(house - 1, x.house - 1);
    const benefics = placements.filter((x) => x.nature === "benefic");
    const malefics = placements.filter((x) => x.nature === "malefic");
    const bIn = (hs: number[]) => benefics.filter((x) => hs.includes(rel(x)));
    const mIn = (hs: number[]) => malefics.filter((x) => hs.includes(rel(x)));
    const b1 = bIn([1, 4, 5, 7, 8, 9, 10]);
    if (b1.length)
      fav.push(
        `benefics in the 1st, 4th, 5th, 7th, 8th, 9th or 10th from the year-lagna: ${b1.map(P).join(", ")}`,
      );
    const b6 = bIn([6, 12]);
    if (b6.length)
      unf.push(
        `benefics in the 6th or 12th from the year-lagna: ${b6.map(P).join(", ")}`,
      );
    const m3 = mIn([3, 6, 11]);
    if (m3.length)
      fav.push(
        `malefics in the 3rd, 6th or 11th from the year-lagna: ${m3.map(P).join(", ")}`,
      );
    const here = placements.filter((x) => x.house === house);
    const nodesOnly =
      here.length > 0 &&
      here.every((x) => x.planet === "Rahu" || x.planet === "Ketu");
    if (nodesOnly)
      unf.push(`the year-lagna bhava holds only ${here.map(P).join(", ")}`);
    const mh = here.filter((x) => x.nature === "malefic").length;
    const bh = here.filter((x) => x.nature === "benefic").length;
    if (mh > bh)
      unf.push(
        `the year-lagna bhava holds more malefics (${mh}) than benefics (${bh})`,
      );
    // Score: one point per placement either way, two for the conditions on the year-lagna bhava itself; a margin of
    // two decides the year, anything closer is mixed. The chapter lists the conditions without a tally (provisional).
    const plus = b1.length + m3.length;
    const minus = b6.length + (nodesOnly ? 2 : 0) + (mh > bh ? 2 : 0);
    const score = plus - minus;
    const tally: SudarshanaYear["verdict"] =
      score >= 2 ? "favourable" : score <= -2 ? "unfavourable" : "mixed";
    // The bhava that becomes lagna of the year is judged as any bhava (74.7-14); the 74.24-26 tally confirms or
    // contradicts it. Agreement, or a mixed bhava, lets the tally stand; contradiction gives a mixed year.
    const bv = bhavas[house - 1].verdict;
    const fromBhava: SudarshanaYear["verdict"] =
      bv === "advances"
        ? "favourable"
        : bv === "harmed"
          ? "unfavourable"
          : "mixed";
    const verdict: SudarshanaYear["verdict"] =
      fromBhava === "mixed"
        ? tally
        : tally === "mixed" || tally === fromBhava
          ? fromBhava
          : "mixed";
    return { fav, unf, verdict, tally, plus, minus };
  };

  const houseYears: SudarshanaHouseYear[] = [];
  for (let h = 1; h <= 12; h++) {
    const e = yearEffects(h);
    houseYears.push({
      house: h,
      verdict: e.verdict,
      tally: e.tally,
      plus: e.plus,
      minus: e.minus,
      favourable: e.fav,
      unfavourable: e.unf,
    });
  }

  const years: SudarshanaYear[] = [];
  for (let k = 0; k < 12; k++) {
    const age = cycleStart + k;
    const house = (age % 12) + 1;
    const start = birth.plus({ years: age });
    const end = birth.plus({ years: age + 1 });
    const e = yearEffects(house);
    const avHouse = ashtakavarga.houses.find((x) => x.house === house)!;
    const avGood = avHouse.band === "favourable";
    const avBad = avHouse.band === "adverse";
    const agreement: SudarshanaYear["agreement"] =
      e.verdict === "mixed" || avHouse.band === "medium"
        ? "open"
        : (e.verdict === "favourable" && avGood) ||
            (e.verdict === "unfavourable" && avBad)
          ? "agree"
          : "differ";
    years.push({
      age,
      house,
      start: start.toISO()!,
      end: end.toISO()!,
      current: asOf >= start && asOf < end,
      verdict: e.verdict,
      favourable: e.fav,
      unfavourable: e.unf,
      tally: e.tally,
      plus: e.plus,
      minus: e.minus,
      av: { rekhas: avHouse.rekhas, band: avHouse.band },
      agreement,
    });
  }
  const currentYear = years.find((y) => y.current);
  const months: SudarshanaMonth[] = [];
  if (currentYear) {
    const ys = DateTime.fromISO(currentYear.start, { zone: "utc" });
    const ye = DateTime.fromISO(currentYear.end, { zone: "utc" });
    const span = ye.diff(ys, "milliseconds").milliseconds / 12;
    for (let m = 0; m < 12; m++) {
      const start = ys.plus({ milliseconds: span * m });
      const end = ys.plus({ milliseconds: span * (m + 1) });
      const house = ((currentYear.house - 1 + m) % 12) + 1;
      const e = yearEffects(house);
      months.push({
        index: m,
        house,
        start: start.toISO()!,
        end: end.toISO()!,
        current: asOf >= start && asOf < end,
        verdict: e.verdict,
        favourable: e.fav,
        unfavourable: e.unf,
        plus: e.plus,
        minus: e.minus,
      });
    }
  }

  const caveats = [
    "Each planet is counted once per ring, so it can touch up to three bhavas; the chapter describes the three rings but does not say whether a planet's influence is counted once or thrice (provisional).",
    "Years run from birthday to birthday and months are equal twelfths of the year; the chapter allots one year and one month per bhava without fixing the calendar (provisional).",
    "A tie between benefics and malefics is broken by Shadbala totals (74.13 speaks of strength without naming a measure) and left mixed when a node is involved; an unoccupied, unaspected bhava follows the natural class of its three lords (74.14 says only 'according to its Lord').",
    "A year is read first from its year-lagna bhava's own verdict; the 74.24-26 conditions are tallied one point per placement for or against, two for a year-lagna held only by a node or by more malefics, and a margin of two counts as a verdict. The tally confirms or, when it contradicts, softens the bhava's verdict to mixed. The chapter lists the conditions without a tally.",
    "The Ashtakavarga cross-check of 74.27-28 uses the Sarvashtakavarga rekhas of the year-lagna's sign in the lagna ring; the chapter does not name the figure.",
  ];
  if (!shadbala)
    caveats.push(
      "Saptavarga dignities were not available, so the 74.15-16 adjustment was not applied.",
    );

  return {
    birthIso: birth.toISO()!,
    houseYears,
    bases: {
      Lagna: { signIndex: bases.Lagna, sign: SIGNS[bases.Lagna] },
      Moon: { signIndex: bases.Moon, sign: SIGNS[bases.Moon] },
      Sun: { signIndex: bases.Sun, sign: SIGNS[bases.Sun] },
    },
    applicable: distinct,
    applicabilityText: distinct
      ? `Lagna (${SIGNS[bases.Lagna]}), Moon (${SIGNS[bases.Moon]}) and Sun (${SIGNS[bases.Sun]}) stand in three different signs, so Parashara reads the bhavas from this chakra (74.19-20).`
      : `Two or more of the lagna (${SIGNS[bases.Lagna]}), Moon (${SIGNS[bases.Moon]}) and Sun (${SIGNS[bases.Sun]}) share a sign, so Parashara judges the bhavas from the rasi chart alone and the chakra is shown for reference only (74.19-20).`,
    bhavas,
    placements,
    vargasChecked: Boolean(shadbala),
    years,
    months,
    currentYear,
    currentMonth: months.find((m) => m.current),
    aspectFloor,
    sources: SUDARSHANA_SOURCES,
    caveats,
  };
}

function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
