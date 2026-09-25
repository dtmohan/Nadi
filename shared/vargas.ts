// The sixteen divisional charts of BPHS ch. 6 and the Vimsopaka (twenty-point) strength of ch. 7.
// Pure arithmetic on sidereal positions. Where the translation gives only a rule of thumb and the
// sign mapping is the commentators' (D27 by element, D30 sign assignment, D60 counted from the
// occupied sign), the definition carries a note and the source is marked provisional.
import { SIGNS, SIGN_LORD, EXALTATION, OWN_SIGNS, PLANETS, type Planet, type PlanetPosition } from "./astro";
import { compoundRelation, inMoolatrikona, SEVEN, type Seven, type Compound } from "./shadbala";
import { BPHS_URL } from "./parashari-data";
import { allArudhas } from "./jaimini";

export interface VargaSource {
  label: string;
  url: string;
  provisional?: boolean;
}
const S = (ch: number, verse: string, provisional?: boolean): VargaSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });

export type VargaKey = "D1" | "D2" | "D3" | "D4" | "D7" | "D9" | "D10" | "D12" | "D16" | "D20" | "D24" | "D27" | "D30" | "D40" | "D45" | "D60";

export interface VargaDef {
  key: VargaKey;
  n: number;
  name: string;
  /** What ch. 7.1-8 says the division is for. */
  matter: string;
  source: VargaSource;
  /** Where the translation leaves the sign mapping to convention. */
  note?: string;
  signOf(sign: number, deg: number): number;
}

const isOdd = (sign: number) => sign % 2 === 0; // Aries = 0 is odd
const kind = (sign: number) => sign % 3; // 0 movable, 1 fixed, 2 dual
const part = (deg: number, n: number) => Math.min(n - 1, Math.floor((deg * n) / 30));

export const VARGAS: VargaDef[] = [
  { key: "D1", n: 1, name: "Rasi", matter: "physique", source: S(6, "5"), signOf: (s) => s },
  {
    key: "D2", n: 2, name: "Hora", matter: "wealth", source: S(6, "5-6"),
    signOf: (s, d) => (isOdd(s) ? (d < 15 ? 4 : 3) : d < 15 ? 3 : 4),
  },
  { key: "D3", n: 3, name: "Drekkana", matter: "happiness through co-borns", source: S(6, "7-8"), signOf: (s, d) => (s + 4 * part(d, 3)) % 12 },
  { key: "D4", n: 4, name: "Chaturthamsa", matter: "fortunes", source: S(6, "9"), signOf: (s, d) => (s + 3 * part(d, 4)) % 12 },
  { key: "D7", n: 7, name: "Saptamsa", matter: "sons and grandsons", source: S(6, "10-11"), signOf: (s, d) => (s + (isOdd(s) ? 0 : 6) + part(d, 7)) % 12 },
  {
    key: "D9", n: 9, name: "Navamsa", matter: "spouse", source: S(6, "12"),
    signOf: (s, d) => ([s, s + 8, s + 4][kind(s)] + part(d, 9)) % 12,
  },
  { key: "D10", n: 10, name: "Dasamsa", matter: "power and position", source: S(6, "13-14"), signOf: (s, d) => (s + (isOdd(s) ? 0 : 8) + part(d, 10)) % 12 },
  { key: "D12", n: 12, name: "Dvadasamsa", matter: "parents", source: S(6, "15"), signOf: (s, d) => (s + part(d, 12)) % 12 },
  { key: "D16", n: 16, name: "Shodasamsa", matter: "conveyances, their benefits and adversities", source: S(6, "16"), signOf: (s, d) => ([0, 4, 8][kind(s)] + part(d, 16)) % 12 },
  { key: "D20", n: 20, name: "Vimsamsa", matter: "worship", source: S(6, "17-21"), signOf: (s, d) => ([0, 8, 4][kind(s)] + part(d, 20)) % 12 },
  { key: "D24", n: 24, name: "Siddhamsa", matter: "learning", source: S(6, "22-23"), signOf: (s, d) => ((isOdd(s) ? 4 : 3) + part(d, 24)) % 12 },
  {
    key: "D27", n: 27, name: "Bhamsa", matter: "strength and weakness", source: S(6, "24-26", true),
    note: "6.26 says the count commences from Aries and the other movable signs; the usual reading takes Aries for fiery signs, Cancer for earthy, Libra for airy and Capricorn for watery.",
    signOf: (s, d) => (3 * (s % 4) + part(d, 27)) % 12,
  },
  {
    key: "D30", n: 30, name: "Trimsamsa", matter: "evil effects", source: S(6, "27-28", true),
    note: "6.27-28 names the lords and their degree spans (Mars 5, Saturn 5, Jupiter 8, Mercury 7, Venus 5 in odd signs, reversed in even); placing them in the lord's odd sign for odd signs and even sign for even signs is the commentators' convention.",
    signOf: (s, d) => {
      if (isOdd(s)) return d < 5 ? 0 : d < 10 ? 10 : d < 18 ? 8 : d < 25 ? 2 : 6;
      return d < 5 ? 1 : d < 12 ? 5 : d < 20 ? 11 : d < 25 ? 9 : 7;
    },
  },
  { key: "D40", n: 40, name: "Khavedamsa", matter: "auspicious and inauspicious effects", source: S(6, "29-30"), signOf: (s, d) => ((isOdd(s) ? 0 : 6) + part(d, 40)) % 12 },
  { key: "D45", n: 45, name: "Akshavedamsa", matter: "all indications", source: S(6, "31-32"), signOf: (s, d) => ([0, 4, 8][kind(s)] + part(d, 45)) % 12 },
  {
    key: "D60", n: 60, name: "Shashtiamsa", matter: "all indications", source: S(6, "33-41", true),
    note: "6.33 doubles the degrees traversed, divides by twelve and adds one to the remainder; the result is counted from the sign the planet occupies, as the commentators read it.",
    signOf: (s, d) => (s + (Math.min(59, Math.floor(d * 2)) % 12)) % 12,
  },
];

export const VARGA_BY_KEY: Record<VargaKey, VargaDef> = Object.fromEntries(VARGAS.map((v) => [v.key, v])) as Record<VargaKey, VargaDef>;

// ---------- Vimsopaka schemes, 7.17-25 ----------

export type SchemeKey = "shad" | "sapta" | "dasa" | "shodasa";

export interface Scheme {
  key: SchemeKey;
  name: string;
  weights: Partial<Record<VargaKey, number>>;
  source: VargaSource;
}

const half = 0.5;
export const SCHEMES: Scheme[] = [
  { key: "shad", name: "Shadvarga", weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 }, source: S(7, "17-19") },
  { key: "sapta", name: "Saptavarga", weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 }, source: S(7, "17-19") },
  { key: "dasa", name: "Dasavarga", weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 }, source: S(7, "20") },
  {
    key: "shodasa", name: "Shodasavarga",
    weights: { D1: 3.5, D2: 1, D3: 1, D4: half, D7: half, D9: 3, D10: half, D12: half, D16: 2, D20: half, D24: half, D27: half, D30: 1, D40: half, D45: half, D60: 4 },
    source: S(7, "21-25"),
  },
];

/** Varga viswa of 7.24-25: the twenty stays whole only in the planet's own sign and declines by relationship. */
export type Viswa = "own" | Compound;
export const VISWA: Record<Viswa, number> = { own: 20, "great friend": 18, friend: 15, neutral: 10, enemy: 7, "great enemy": 5 };

export interface VargaCell {
  varga: VargaKey;
  signIndex: number;
  lord: Planet;
  relation: Viswa;
  weight: number;
  /** weight × viswa / 20, 7.26. */
  score: number;
}

export interface SchemeScore {
  scheme: SchemeKey;
  total: number;
  band: "below five" | "some good" | "middling" | "wholly favourable";
  cells: VargaCell[];
}

export interface PlanetVargas {
  planet: Planet;
  /** Sign index in each of the sixteen divisions. */
  signs: Record<VargaKey, number>;
  /** Same sign in rasi and navamsa. Not a term of ch. 6-7; shown because the readers expect it. */
  vargottama: boolean;
  /** Seven planets only; the chapter takes the planets from the Sun on. */
  vimsopaka?: SchemeScore[];
  /** 6.42-53 classification: good vargas counted over each scheme and the designation earned. */
  designation?: Record<SchemeKey, { good: number; name: string | null }>;
  /** Combust by the translator's Surya Siddhanta table under 7.28-29; 6.53 says such a planet's good vargas are not to be counted. */
  combust: boolean;
}

export interface VargaChart {
  key: VargaKey;
  lagnaSign: number;
  positions: { planet: Planet; signIndex: number; degInSign: number; retrograde?: boolean }[];
}

export interface VargasResult {
  planets: PlanetVargas[];
  lagna: Record<VargaKey, number>;
  charts: Record<VargaKey, VargaChart>;
  /** The spouse reading of 7.1-8 from the navamsa: the 7th from the navamsa lagna and its lord. */
  spouse: SpouseReading;
  sources: typeof VARGA_SOURCES;
  caveats: string[];
}

export interface SpouseReading {
  seventhSign: number;
  seventhLord: Planet;
  lordSign: number;
  lordHouse: number;
  occupants: Planet[];
  venusSign: number;
  venusRelation: string;
}

export const VARGA_SOURCES = {
  divisions: S(6, "5-41"),
  uses: S(7, "1-8"),
  vimsopaka: S(7, "17-27"),
  classification: S(6, "42-53"),
  combustion: S(7, "28-29", true),
  hora: S(7, "13-16"),
};

const DESIGNATIONS: Record<SchemeKey, string[]> = {
  // index = number of good vargas; 6.43-52
  shad: ["", "", "Kimsuka", "Vyanjana", "Chaamara", "Chhatra", "Kundala"],
  sapta: ["", "", "Kimsuka", "Vyanjana", "Chaamara", "Chhatra", "Kundala", "Mukuta"],
  dasa: ["", "", "Parijata", "Uttama", "Gopura", "Simhasana", "Paravata", "Devaloka", "Brahmaloka", "Sakravahana", "Sridhama"],
  shodasa: ["", "", "Bhedaka", "Kusuma", "Nagapushpa", "Kanduka", "Kerala", "Kalpavriksha", "Chandana Vana", "Poornachandra", "Uchchaisrava", "Dhanvantari", "Suryakanta", "Vidruma", "Sakrasimhasana", "Goloka", "Sri Vallabha"],
};

/** Surya Siddhanta combustion orbs quoted in the translator's note under 7.28-29 (direct, retrograde). */
const COMBUST_ORB: Partial<Record<Seven, [number, number]>> = {
  Moon: [12, 12], Mars: [17, 8], Mercury: [14, 12], Jupiter: [11, 11], Venus: [10, 8], Saturn: [16, 16],
};

function band(total: number): SchemeScore["band"] {
  if (total < 5) return "below five";
  if (total < 10) return "some good";
  if (total <= 15) return "middling";
  return "wholly favourable";
}

const isSeven = (p: Planet): p is Seven => (SEVEN as readonly string[]).includes(p);

export function computeVargas(positions: PlanetPosition[], lagnaLon: number): VargasResult {
  const lagnaSign = Math.floor(lagnaLon / 30) % 12;
  const lagnaDeg = lagnaLon - lagnaSign * 30;
  const lagna = Object.fromEntries(VARGAS.map((v) => [v.key, v.signOf(lagnaSign, lagnaDeg)])) as Record<VargaKey, number>;
  const sunLon = positions.find((p) => p.planet === "Sun")!.lon;
  const arudhaLagna = allArudhas(lagnaSign, positions)[0].signIndex;
  // 6.52: signs owned by the lord of an angle from the arudha lagna count as good vargas.
  const alKendraSigns = new Set<number>();
  for (const h of [1, 4, 7, 10]) {
    const lord = SIGN_LORD[(arudhaLagna + h - 1) % 12];
    for (const s of OWN_SIGNS[lord] ?? []) alKendraSigns.add(s);
  }

  const planets: PlanetVargas[] = positions
    .filter((p) => PLANETS.includes(p.planet))
    .map((p) => {
      const signs = Object.fromEntries(VARGAS.map((v) => [v.key, v.signOf(p.signIndex, p.degInSign)])) as Record<VargaKey, number>;
      const vargottama = signs.D1 === signs.D9;
      let combust = false;
      if (isSeven(p.planet) && COMBUST_ORB[p.planet]) {
        const d = Math.abs((((p.lon - sunLon) % 360) + 540) % 360 - 180);
        combust = d <= COMBUST_ORB[p.planet]![p.retrograde ? 1 : 0];
      }
      if (!isSeven(p.planet)) return { planet: p.planet, signs, vargottama, combust };
      const me = p.planet;
      const vimsopaka: SchemeScore[] = SCHEMES.map((sch) => {
        const cells: VargaCell[] = (Object.keys(sch.weights) as VargaKey[]).map((k) => {
          const signIndex = signs[k];
          const lord = SIGN_LORD[signIndex];
          let relation: Viswa;
          if (lord === me) relation = "own";
          else {
            const lordPos = positions.find((q) => q.planet === lord)!;
            relation = compoundRelation(me, lord as Seven, p.signIndex, lordPos.signIndex);
          }
          const weight = sch.weights[k]!;
          return { varga: k, signIndex, lord, relation, weight, score: (weight * VISWA[relation]) / 20 };
        });
        const total = cells.reduce((a, c) => a + c.score, 0);
        return { scheme: sch.key, total, band: band(total), cells };
      });
      const designation = Object.fromEntries(
        SCHEMES.map((sch) => {
          const good = (Object.keys(sch.weights) as VargaKey[]).filter((k) => {
            const s = signs[k];
            const deg = k === "D1" ? p.degInSign : 15;
            return EXALTATION[me]!.sign === s || inMoolatrikona(me, s, deg) || (OWN_SIGNS[me] ?? []).includes(s) || alKendraSigns.has(s);
          }).length;
          const names = DESIGNATIONS[sch.key];
          return [sch.key, { good, name: combust ? null : names[good] || null }];
        }),
      ) as PlanetVargas["designation"];
      return { planet: me, signs, vargottama, vimsopaka, designation, combust };
    });

  const charts = Object.fromEntries(
    VARGAS.map((v) => [
      v.key,
      {
        key: v.key,
        lagnaSign: lagna[v.key],
        positions: planets.map((pl) => {
          const src = positions.find((q) => q.planet === pl.planet)!;
          // Degree inside the divisional sign: the fraction of the part, scaled to 30.
          const frac = ((src.degInSign * v.n) / 30) % 1;
          return { planet: pl.planet, signIndex: pl.signs[v.key], degInSign: frac * 30, retrograde: src.retrograde };
        }),
      },
    ]),
  ) as Record<VargaKey, VargaChart>;

  const d9 = charts.D9;
  const seventhSign = (d9.lagnaSign + 6) % 12;
  const seventhLord = SIGN_LORD[seventhSign];
  const lordSign = d9.positions.find((q) => q.planet === seventhLord)!.signIndex;
  const venus = planets.find((q) => q.planet === "Venus")!;
  const venusLord = SIGN_LORD[venus.signs.D9];
  const venusRelation =
    venusLord === "Venus"
      ? "own sign"
      : EXALTATION.Venus!.sign === venus.signs.D9
        ? "exaltation"
        : (EXALTATION.Venus!.sign + 6) % 12 === venus.signs.D9
          ? "debilitation"
          : compoundRelation("Venus", venusLord as Seven, positions.find((q) => q.planet === "Venus")!.signIndex, positions.find((q) => q.planet === venusLord)!.signIndex) + "'s sign";
  const spouse: SpouseReading = {
    seventhSign,
    seventhLord,
    lordSign,
    lordHouse: ((lordSign - d9.lagnaSign + 12) % 12) + 1,
    occupants: d9.positions.filter((q) => q.signIndex === seventhSign).map((q) => q.planet),
    venusSign: venus.signs.D9,
    venusRelation,
  };

  return { planets, lagna, charts, spouse, sources: VARGA_SOURCES, caveats: VARGA_CAVEATS };
}

export const VARGA_CAVEATS = [
  "The divisions follow 6.5-41 as translated. Three mappings are the commentators' rather than the verse's and are marked provisional: the Bhamsa starting sign by element (6.26), the Trimsamsa signs for the lords named in 6.27-28, and the Shashtiamsa counted from the occupied sign (6.33).",
  "Vimsopaka takes the four schemes and weights of 7.17-25 and the varga viswa of 7.24-25 (own 20, great friend 18, friend 15, neutral 10, enemy 7, great enemy 5). Relationships are the compound ones of 3.55-58, the temporary part taken from the rasi positions. The verse keeps the full twenty for the planet's own sign only; exaltation is not given the same standing here, though some readers grant it. Bands are 7.26-27; the eight classes of 7.30-32 (Poorna to Atiswalpa) are named without thresholds and are not applied.",
  "The designations of 6.42-53 count good vargas: exaltation, moolatrikona, own sign, and the signs of the lords of angles from the arudha lagna (the arudha by the Jaimini rule already in use). 6.53 excludes combust, defeated and weak planets and those in bad avasthas; only combustion is applied here, by the Surya Siddhanta orbs in the translator's note under 7.28-29, and the exclusion is provisional.",
  "Vargottama (the same sign in rasi and navamsa) is not a term of ch. 6-7 and is shown for reference only.",
  "The spouse reading follows 7.1-8, which assigns the navamsa to the spouse, and the chapter's closing remark that the lord of a bhava is as important as the bhava; how to weigh the 7th of the navamsa is not spelt out, so the panel reports positions and leaves the judgement.",
];

export const SIGN_NAME = (i: number) => SIGNS[i];
