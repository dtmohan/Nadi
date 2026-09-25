// Ashtakavarga per Brihat Parashara Hora Sastra ch. 66-72 (Santhanam translation, jyotishvidya.com).
// Ch. 66 gives, for each of the seven planets and the lagna, the houses counted from each of the eight
// contributors (seven planets and lagna) that earn a benefic mark; the chapter calls the benefic mark a
// rekha and the malefic one a bindu (dot), while 28.15-20 and most later usage call the benefic mark a
// bindu. This module says "rekha" for the benefic mark throughout and shows the count only.
// Ch. 67 and 68 are the two reductions, ch. 69 the pindas, ch. 70 the significations and the Saturn
// transit points, ch. 71 the longevity table, ch. 72 the aggregate (Sarvashtakavarga).
import { NAKSHATRAS, SIGNS, SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { SEVEN, type Seven, type BalaSource } from "./shadbala";

export type Contributor = Seven | "Lagna";
export const CONTRIBUTORS: Contributor[] = [...SEVEN, "Lagna"];

/**
 * Houses from each contributor that carry a rekha in the Ashtakavarga of the row planet, 66.43-68.
 * Where the rekha lists of 66.43-68 and the dot lists of 66.16-42 disagree (Sun in the 5th and Saturn in
 * the 5th of Mercury's chart, Jupiter in the 1st and 4th of its own) the dot lists are followed; they match
 * the totals the tradition uses (Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39, Lagna 49).
 */
export const REKHA_TABLE: Record<Contributor, Record<Contributor, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11], Moon: [3, 6, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11], Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11], Venus: [6, 7, 12], Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11], Moon: [1, 3, 6, 7, 9, 10, 11], Mars: [2, 3, 5, 6, 10, 11], Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 2, 4, 7, 8, 10, 11], Venus: [3, 4, 5, 7, 9, 10, 11], Saturn: [3, 5, 6, 11], Lagna: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11], Moon: [3, 6, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12], Venus: [6, 8, 11, 12], Saturn: [1, 4, 7, 8, 9, 10, 11], Lagna: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12], Moon: [2, 4, 6, 8, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11], Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12], Venus: [1, 2, 3, 4, 5, 8, 9, 11], Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], Moon: [2, 5, 7, 9, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11], Venus: [2, 5, 6, 9, 10, 11], Saturn: [3, 5, 6, 12], Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12], Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], Mars: [3, 4, 6, 9, 11, 12], Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11], Saturn: [3, 4, 5, 8, 9, 10, 11], Lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11], Moon: [3, 6, 11], Mars: [3, 5, 6, 10, 11, 12], Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12], Venus: [6, 11, 12], Saturn: [3, 5, 6, 11], Lagna: [1, 3, 4, 6, 10, 11],
  },
  Lagna: {
    Sun: [3, 4, 6, 10, 11, 12], Moon: [3, 6, 10, 11, 12], Mars: [1, 3, 6, 10, 11], Mercury: [1, 2, 4, 6, 8, 10, 11],
    Jupiter: [1, 2, 4, 5, 6, 7, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9], Saturn: [1, 3, 4, 6, 10, 11], Lagna: [3, 6, 10, 11],
  },
};

/** Sign multipliers of 69.1-4 as the translator's Rashimana chakra gives them (Aries first). */
export const RASHI_MANA = [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12];
/** Planet multipliers of 69.1-4 as the Grahamana chakra gives them. */
export const GRAHA_MANA: Record<Seven, number> = { Sun: 5, Moon: 5, Mars: 8, Mercury: 5, Jupiter: 10, Venus: 7, Saturn: 5 };

/** Life spans by rekha count in a sign, 71.1-4, in years (a day is 1/360 of a year as the chapter counts). */
const AYUS_BY_REKHA = [2 / 360, 1.5 / 360, 1 / 360, 0.5 / 360, 7.5 / 360, 2, 4, 6, 8];

export interface Bhinnashtaka {
  owner: Contributor;
  /** Rekha count in each sign, Aries first, before any reduction (66). */
  rekhas: number[];
  /** Which contributors gave a rekha in each sign. */
  givers: Contributor[][];
  /** After Trikona shodhana (67). */
  trikona: number[];
  /** After Ekadhipatya shodhana as well (68). */
  reduced: number[];
  /** Pindas of ch. 69, computed from the reduced figures. */
  rashiPinda: number;
  grahaPinda: number;
  yogaPinda: number;
  total: number;
  /** Longevity contribution of 71.1-4 in years, before the final halving. */
  ayus: number;
}

export interface SaturnPoint {
  /** What the point concerns, ch. 70. */
  matter: string;
  /** The planet whose Ashtakavarga and pinda are used, and the house from it that is read. */
  owner: Seven;
  houseFrom: number;
  signIndex: number;
  rekhas: number;
  product: number;
  nakshatraIndex: number;
  trineNakshatras: number[];
  transitSignIndex: number;
  trineSigns: number[];
  source: BalaSource;
}

export interface AshtakavargaResult {
  charts: Bhinnashtaka[];
  /** Sarvashtakavarga of 72.1-2: sum of the seven planets' rekhas per sign, Aries first (337 in all). */
  sarva: number[];
  /** 72.3-6 band per sign. */
  band: ("favourable" | "medium" | "adverse")[];
  /** Per house from the lagna: sign, rekhas and band. */
  houses: { house: number; signIndex: number; rekhas: number; band: "favourable" | "medium" | "adverse" }[];
  /** 72.7-8 wealth combination. */
  wealthYoga: { holds: boolean; text: string };
  /** 72.9-10: benefics and malefics in the three life-thirds. */
  lifeThirds: { span: string; houses: string; benefics: Planet[]; malefics: Planet[]; verdict: "happiness" | "distress" | "mixed" }[];
  /** 70.37-40: years counted by Saturn's rekhas from lagna to Saturn and from Saturn to lagna. */
  distressYears: { lagnaToSaturn: number; saturnToLagna: number };
  saturnPoints: SaturnPoint[];
  /** 71.1-4: half the total of the eight charts' spans. */
  ayurdaya: number;
  sources: Record<string, BalaSource>;
  caveats: string[];
}

const S = (ch: number, verse: string, provisional?: boolean): BalaSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });

export const ASHTAKAVARGA_SOURCES: Record<string, BalaSource> = {
  rekhas: S(66, "13-68"),
  transit: S(66, "70-72"),
  trikona: S(67, "1-5"),
  ekadhipatya: S(68, "1-5"),
  pinda: S(69, "1-4"),
  significations: S(70, "1-6"),
  father: S(70, "7-14"),
  mother: S(70, "21-23"),
  brothers: S(70, "24-27", true),
  family: S(70, "28-29"),
  progeny: S(70, "30-33"),
  marriage: S(70, "34-36"),
  longevityYears: S(70, "37-40"),
  death: S(70, "41-42"),
  ayus: S(71, "1-4"),
  sarva: S(72, "1-2"),
  bands: S(72, "3-6"),
  wealth: S(72, "7-8"),
  thirds: S(72, "9-10"),
};

export const SIGNIFICATIONS: Record<Seven, string> = {
  Sun: "soul, nature, physical strength, joys and sorrows, father",
  Moon: "mind, wisdom, joy, mother",
  Mars: "co-borns, strength, qualities, land",
  Mercury: "business dealings, livelihood, friends",
  Jupiter: "nourishment of the body, learning, children, wealth and property",
  Venus: "marriage, enjoyments, conveyance, relations with women",
  Saturn: "longevity, source of maintenance, grief, danger, losses, death",
};

const TRINES = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]];

function trikonaShodhana(v: number[]): number[] {
  const out = v.slice();
  for (const t of TRINES) {
    const vals = t.map((s) => v[s]);
    if (vals.some((x) => x === 0)) continue; // 67.4: no reduction when a trine sign has no rekha
    const min = Math.min(...vals);
    for (const s of t) out[s] = v[s] - min; // equal figures all become zero, 67.4
  }
  return out;
}

function ekadhipatyaShodhana(v: number[], occupied: boolean[]): number[] {
  const out = v.slice();
  for (const p of ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as Seven[]) {
    const signs = SIGN_LORD.map((l, i) => (l === p ? i : -1)).filter((i) => i >= 0);
    const [a, b] = signs;
    if (v[a] === 0 || v[b] === 0) continue; // 68.1-2: only when both signs carry a figure
    const oa = occupied[a], ob = occupied[b];
    if (oa && ob) continue; // both occupied: nothing
    if (!oa && !ob) {
      // both empty: different figures -> both take the smaller; equal -> both zero
      if (v[a] === v[b]) { out[a] = 0; out[b] = 0; }
      else { const m = Math.min(v[a], v[b]); out[a] = m; out[b] = m; }
      continue;
    }
    const occ = oa ? a : b, emp = oa ? b : a;
    // one occupied: the empty sign loses the occupied sign's figure when larger, else drops to zero;
    // the occupied sign keeps its figure
    out[emp] = v[emp] > v[occ] ? v[emp] - v[occ] : 0;
  }
  return out;
}

export function computeAshtakavarga(positions: PlanetPosition[], lagnaIdx: number): AshtakavargaResult {
  const pos = (p: Planet) => positions.find((x) => x.planet === p)!;
  const signOf = (c: Contributor) => (c === "Lagna" ? lagnaIdx : pos(c).signIndex);
  const occupied = Array.from({ length: 12 }, (_, s) => SEVEN.some((p) => pos(p).signIndex === s));

  const charts: Bhinnashtaka[] = CONTRIBUTORS.map((owner) => {
    const rekhas = new Array(12).fill(0) as number[];
    const givers: Contributor[][] = Array.from({ length: 12 }, () => []);
    for (const giver of CONTRIBUTORS) {
      const from = signOf(giver);
      for (const h of REKHA_TABLE[owner][giver]) {
        const s = (from + h - 1) % 12;
        rekhas[s] += 1;
        givers[s].push(giver);
      }
    }
    const trikona = trikonaShodhana(rekhas);
    const reduced = ekadhipatyaShodhana(trikona, occupied);
    let rashiPinda = 0, grahaPinda = 0;
    for (let s = 0; s < 12; s++) {
      rashiPinda += reduced[s] * RASHI_MANA[s];
      for (const p of SEVEN) if (pos(p).signIndex === s) grahaPinda += reduced[s] * GRAHA_MANA[p];
    }
    const ayus = rekhas.reduce((a, r) => a + AYUS_BY_REKHA[Math.min(r, 8)], 0);
    return { owner, rekhas, givers, trikona, reduced, rashiPinda, grahaPinda, yogaPinda: rashiPinda + grahaPinda, total: rekhas.reduce((a, b) => a + b, 0), ayus };
  });

  const sarva = Array.from({ length: 12 }, (_, s) => charts.filter((c) => c.owner !== "Lagna").reduce((a, c) => a + c.rekhas[s], 0));
  const bandOf = (n: number) => (n > 30 ? "favourable" : n >= 25 ? "medium" : "adverse") as "favourable" | "medium" | "adverse";
  const band = sarva.map(bandOf);
  const houses = Array.from({ length: 12 }, (_, i) => {
    const signIndex = (lagnaIdx + i) % 12;
    return { house: i + 1, signIndex, rekhas: sarva[signIndex], band: band[signIndex] };
  });

  const hv = (h: number) => houses[h - 1].rekhas;
  const maxRekha = Math.max(...sarva);
  const wealthHolds = hv(11) > hv(10) && hv(12) < hv(11) && hv(1) === maxRekha;
  const wealthYoga = {
    holds: wealthHolds,
    text: wealthHolds
      ? `The 11th (${hv(11)}) exceeds the 10th (${hv(10)}), the 12th (${hv(12)}) falls short of the 11th, and the lagna (${hv(1)}) carries the most rekhas: Parashara's combination for wealth and comfort.`
      : `The 11th has ${hv(11)}, the 10th ${hv(10)}, the 12th ${hv(12)} and the lagna ${hv(1)} (most in any sign ${maxRekha}); the combination of 72.7-8 (11th above 10th, 12th below 11th, lagna highest) is not complete.`,
  };

  const BENEFIC: Planet[] = ["Jupiter", "Venus", "Mercury", "Moon"];
  const lifeThirds = [
    { span: "childhood", houses: "1st to 4th", from: 1 },
    { span: "youth", houses: "5th to 8th", from: 5 },
    { span: "old age", houses: "9th to 12th", from: 9 },
  ].map((t) => {
    const inSection = positions.filter((p) => { const h = houseFrom(lagnaIdx, p.signIndex); return h >= t.from && h < t.from + 4; });
    const benefics = inSection.filter((p) => BENEFIC.includes(p.planet)).map((p) => p.planet);
    const malefics = inSection.filter((p) => !BENEFIC.includes(p.planet)).map((p) => p.planet);
    const verdict = benefics.length > malefics.length ? "happiness" : malefics.length > benefics.length ? "distress" : "mixed";
    return { span: t.span, houses: t.houses, benefics, malefics, verdict: verdict as "happiness" | "distress" | "mixed" };
  });

  const satChart = charts.find((c) => c.owner === "Saturn")!;
  const satSign = pos("Saturn").signIndex;
  const sumRange = (from: number, to: number) => { let a = 0; for (let s = from; ; s = (s + 1) % 12) { a += satChart.rekhas[s]; if (s === to) break; } return a; };
  const distressYears = { lagnaToSaturn: sumRange(lagnaIdx, satSign), saturnToLagna: sumRange(satSign, lagnaIdx) };

  const point = (matter: string, owner: Seven, h: number, source: BalaSource): SaturnPoint => {
    const chart = charts.find((c) => c.owner === owner)!;
    const signIndex = (pos(owner).signIndex + h - 1) % 12;
    const rekhas = chart.rekhas[signIndex];
    const product = rekhas * chart.yogaPinda;
    const nak = product % 27 === 0 ? 26 : (product % 27) - 1;
    const sgn = product % 12 === 0 ? 11 : (product % 12) - 1;
    return {
      matter, owner, houseFrom: h, signIndex, rekhas, product,
      nakshatraIndex: nak, trineNakshatras: [nak, (nak + 9) % 27, (nak + 18) % 27],
      transitSignIndex: sgn, trineSigns: [sgn, (sgn + 4) % 12, (sgn + 8) % 12],
      source,
    };
  };
  const saturnPoints = [
    point("father", "Sun", 9, ASHTAKAVARGA_SOURCES.father),
    point("mother, house and village", "Moon", 4, ASHTAKAVARGA_SOURCES.mother),
    point("co-borns", "Mars", 3, ASHTAKAVARGA_SOURCES.brothers),
    point("family, maternal uncle and friends", "Mercury", 4, ASHTAKAVARGA_SOURCES.family),
    point("knowledge, religion and progeny", "Jupiter", 5, ASHTAKAVARGA_SOURCES.progeny),
    point("marriage and gains", "Venus", 7, ASHTAKAVARGA_SOURCES.marriage),
    point("longevity and death", "Saturn", 8, ASHTAKAVARGA_SOURCES.death),
  ];

  const ayurdaya = charts.reduce((a, c) => a + c.ayus, 0) / 2;

  const caveats = [
    "The rekha tables follow 66.43-68 checked against the dot lists of 66.16-42; where the two disagree (Sun and Saturn in the 5th of Mercury's chart, Jupiter in its own 1st and 4th) the dot lists are used, which gives the totals of 48, 49, 39, 54, 56, 52, 39 and 49 that later manuals also carry. Chapter 66 calls the benefic mark a rekha and 28.15-20 a bindu; the tables here count benefic marks.",
    "Trikona shodhana (67.3-5) subtracts the smallest figure of each trine from all three unless one of them is zero; when the three are equal they all become zero. This is how the translation's wording is read.",
    "Ekadhipatya shodhana (68.1-5) treats a sign as occupied when one of the seven planets stands in it; the nodes are not counted. When the occupied sign's figure equals the empty sign's, the empty sign drops to zero, following the last of the rules in 68.3. Both readings are provisional.",
    "Pinda multipliers (69.1-4) use the Rashimana and Grahamana chakras printed with the verses (Aries 7, Taurus 10, Gemini 8, Cancer 4, Leo 10, Virgo 6, Libra 7, Scorpio 8, Sagittarius 9, Capricorn 5, Aquarius 11, Pisces 12; Sun, Moon, Mercury and Saturn 5, Mars 8, Venus 7, Jupiter 10). The verse text itself reads Capricorn 6, Mars 3 and 6 for the Sun, Moon, Mercury and Saturn; the chakra values are the ones the tradition carries, so the verse variants are noted and not applied.",
    "The Saturn transit points of ch. 70 multiply the unreduced rekhas of the house named (9th from the Sun for father, 4th from the Moon, 4th from Mercury, 5th from Jupiter, 7th from Venus, 8th from Saturn) by the owner's Yoga pinda; a remainder of zero is read as the 27th nakshatra or 12th sign. For co-borns 70.24-27 names Mars's chart but not the house; the 3rd from Mars is used and marked provisional.",
    "The longevity of 71.1-4 sums the spans allotted to every sign of all eight charts and halves the total; it is shown as the chapter states it, without the checks other longevity methods apply.",
    "For 72.9-10 Jupiter, Venus, Mercury and the Moon count as benefics and the rest, nodes included, as malefics; the verse does not say whether the Moon's phase or Mercury's company should be weighed.",
    "The Sarvashtakavarga (72.1-2) sums the seven planets' charts and leaves out the lagna's, which the chapter treats separately; 337 rekhas in all. The bands of 72.3-6 are above 30, 25 to 30 and below 25. The month-by-month dangers of 72.11-28 are not listed.",
  ];

  return { charts, sarva, band, houses, wealthYoga, lifeThirds, distressYears, saturnPoints, ayurdaya, sources: ASHTAKAVARGA_SOURCES, caveats };
}

export function bhinnaOf(av: AshtakavargaResult | undefined, owner: Planet): Bhinnashtaka | undefined {
  return av?.charts.find((c) => c.owner === owner);
}

export const nakshatraName = (i: number) => NAKSHATRAS[i];
export const signName = (i: number) => SIGNS[i];
