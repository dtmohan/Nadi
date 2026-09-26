// Bhava chalit: two constructions of the twelve bhavas, shown side by side so the practitioner can choose.
//
// 1. Sripati (unequal): the lagna degree is the madhya of the 1st, the meridian that of the 10th, their
//    opposites the 7th and 4th, the arcs between them trisected for the intermediate madhyas, and each bhava
//    running from the midpoint with the previous madhya to the midpoint with the next. Parashara assumes
//    madhyas exist (bhava bala in 27.26-31 is measured on cusps, and 5.9 has bhava charts prepared from the
//    special lagnas) but the translation in use has no verse that computes them; the construction is Sripati's.
// 2. Equal (Phaladeepika 8.34): a planet gives the full effect of its bhava when its distance into its sign
//    equals the lagna's distance into the lagna sign, so every madhya sits at the lagna degree of its sign and
//    each bhava spans fifteen degrees either side.
//
// In both, a planet keeps its sign, degree, nakshatra, dignity and lordships; only the bhava whose matters it
// speaks for can differ from the whole-sign house. Phaladeepika 8.35 and 15.14 grade the planet's effect on its
// bhava: full at the madhya, nil at a sandhi, and in proportion between (rule of three); 15.13 says a planet in
// a sandhi is ineffective however strong, to be noted before reading its dasa and bhukti.
import { SIGNS, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";

export interface ChalitSource {
  label: string;
  url: string;
  provisional?: boolean;
}

export const PHALADEEPIKA_CH8_URL =
  "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621580.html";
export const PHALADEEPIKA_CH15_URL =
  "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621587.html";

export const CHALIT_SOURCES = {
  sripati: {
    label: "Sripati Paddhati (not Parashara)",
    url: BPHS_URL(27),
    provisional: true,
  } as ChalitSource,
  cusps: {
    label: "Parashara 27.26-31",
    url: BPHS_URL(27),
    provisional: true,
  } as ChalitSource,
  special: {
    label: "Parashara 5.9",
    url: BPHS_URL(5),
    provisional: true,
  } as ChalitSource,
  equal: {
    label: "Phaladeepika 8.34",
    url: PHALADEEPIKA_CH8_URL,
  } as ChalitSource,
  effect: {
    label: "Phaladeepika 8.35, 15.14",
    url: PHALADEEPIKA_CH8_URL,
  } as ChalitSource,
  sandhi: {
    label: "Phaladeepika 15.13",
    url: PHALADEEPIKA_CH15_URL,
  } as ChalitSource,
};

export type ChalitMethod = "sripati" | "equal";
export const CHALIT_METHODS: ChalitMethod[] = ["sripati", "equal"];
export const CHALIT_METHOD_LABEL: Record<ChalitMethod, string> = {
  sripati: "Sripati (unequal)",
  equal: "Equal from the lagna degree",
};

/** Below this share of the full effect a planet is reported as standing in a sandhi (a display threshold). */
export const SANDHI_EFFECT_THRESHOLD = 0.1;

const norm360 = (x: number) => ((x % 360) + 360) % 360;
/** Forward arc from a to b, 0..360. */
const arc = (a: number, b: number) => norm360(b - a);

export interface ChalitBhava {
  house: number;
  /** Madhya (cusp) longitude. */
  madhya: number;
  /** Bhava begins at the sandhi with the previous house and ends at the sandhi with the next. */
  start: number;
  end: number;
  /** Sign of the madhya, which is the sign the bhava is named after. */
  signIndex: number;
  /** Planets in the bhava by span. */
  planets: Planet[];
  /** Planets in the same-numbered whole-sign house from the lagna sign. */
  rasiPlanets: Planet[];
}

export interface ChalitPlanet {
  planet: Planet;
  lon: number;
  rasiHouse: number;
  chalitHouse: number;
  shifted: boolean;
  /** Degrees to the nearest sandhi and the two houses it divides. */
  sandhiGap: number;
  sandhiBetween: [number, number];
  /** Share of the bhava's full effect, 1 at the madhya and 0 at a sandhi (Phaladeepika 8.35, 15.14). */
  effect: number;
  /** Below SANDHI_EFFECT_THRESHOLD: Phaladeepika 15.13 reads the planet as ineffective. */
  atSandhi: boolean;
}

export interface ChalitConstruction {
  method: ChalitMethod;
  asc: number;
  mc: number;
  bhavas: ChalitBhava[];
  planets: ChalitPlanet[];
  source: ChalitSource;
}

export interface ChalitComparison {
  planet: Planet;
  lon: number;
  rasiHouse: number;
  sripati: ChalitPlanet;
  equal: ChalitPlanet;
  /** Both constructions place the planet in the same bhava. */
  agree: boolean;
  /** Both agree and that bhava is the whole-sign house. */
  unchanged: boolean;
}

export interface ChalitResult {
  asc: number;
  mc: number;
  sripati: ChalitConstruction;
  equal: ChalitConstruction;
  comparison: ChalitComparison[];
  /** Planets within `sandhiOrb` degrees of a sandhi. */
  sandhiOrb: number;
  sources: typeof CHALIT_SOURCES;
  caveats: string[];
}

function build(
  method: ChalitMethod,
  positions: PlanetPosition[],
  asc: number,
  mc: number,
): ChalitConstruction {
  const lagnaSign = Math.floor(norm360(asc) / 30);
  const m: number[] = new Array(12);
  if (method === "sripati") {
    m[0] = norm360(asc);
    m[9] = norm360(mc);
    m[3] = norm360(mc + 180);
    m[6] = norm360(asc + 180);
    // 10th to 1st: 11th and 12th; 1st to 4th: 2nd and 3rd; then the opposites.
    const d1 = arc(m[9], m[0]);
    m[10] = norm360(m[9] + d1 / 3);
    m[11] = norm360(m[9] + (2 * d1) / 3);
    const d2 = arc(m[0], m[3]);
    m[1] = norm360(m[0] + d2 / 3);
    m[2] = norm360(m[0] + (2 * d2) / 3);
    for (const i of [1, 2, 10, 11]) m[(i + 6) % 12] = norm360(m[i] + 180);
  } else {
    for (let i = 0; i < 12; i++) m[i] = norm360(asc + 30 * i);
  }

  const start: number[] = new Array(12);
  for (let i = 0; i < 12; i++) {
    const prev = m[(i + 11) % 12];
    start[i] = norm360(prev + arc(prev, m[i]) / 2);
  }
  const inSpan = (lon: number, i: number) =>
    arc(start[i], lon) < arc(start[i], start[(i + 1) % 12]);

  const planets: ChalitPlanet[] = positions.map((p) => {
    const lon = norm360(p.lon);
    let chalitHouse = 1;
    for (let i = 0; i < 12; i++) if (inSpan(lon, i)) chalitHouse = i + 1;
    const rasiHouse = ((p.signIndex - lagnaSign + 12) % 12) + 1;
    let best = 360;
    let between: [number, number] = [12, 1];
    for (let i = 0; i < 12; i++) {
      const g = Math.min(arc(start[i], lon), arc(lon, start[i]));
      if (g < best) {
        best = g;
        between = [((i + 11) % 12) + 1, i + 1];
      }
    }
    // Rule of three from the madhya to whichever sandhi the planet lies toward (8.35, 15.14).
    const h = chalitHouse - 1;
    const md = m[h];
    const toEnd = arc(md, lon) <= arc(lon, md);
    const half = toEnd ? arc(md, start[(h + 1) % 12]) : arc(start[h], md);
    const dist = toEnd ? arc(md, lon) : arc(lon, md);
    const effect = half > 0 ? Math.max(0, Math.min(1, 1 - dist / half)) : 1;
    return {
      planet: p.planet,
      lon,
      rasiHouse,
      chalitHouse,
      shifted: rasiHouse !== chalitHouse,
      sandhiGap: best,
      sandhiBetween: between,
      effect,
      atSandhi: effect < SANDHI_EFFECT_THRESHOLD,
    };
  });

  const bhavas: ChalitBhava[] = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    madhya: m[i],
    start: start[i],
    end: start[(i + 1) % 12],
    signIndex: Math.floor(m[i] / 30),
    planets: planets
      .filter((p) => p.chalitHouse === i + 1)
      .map((p) => p.planet),
    rasiPlanets: planets
      .filter((p) => p.rasiHouse === i + 1)
      .map((p) => p.planet),
  }));

  return {
    method,
    asc: m[0],
    mc: norm360(mc),
    bhavas,
    planets,
    source:
      method === "sripati" ? CHALIT_SOURCES.sripati : CHALIT_SOURCES.equal,
  };
}

export function computeChalit(
  positions: PlanetPosition[],
  asc: number,
  mc: number,
  sandhiOrb = 1,
): ChalitResult {
  const sripati = build("sripati", positions, asc, mc);
  const equal = build("equal", positions, asc, mc);
  const comparison: ChalitComparison[] = positions.map((p) => {
    const s = sripati.planets.find((x) => x.planet === p.planet)!;
    const e = equal.planets.find((x) => x.planet === p.planet)!;
    const agree = s.chalitHouse === e.chalitHouse;
    return {
      planet: p.planet,
      lon: s.lon,
      rasiHouse: s.rasiHouse,
      sripati: s,
      equal: e,
      agree,
      unchanged: agree && !s.shifted,
    };
  });
  return {
    asc: norm360(asc),
    mc: norm360(mc),
    sripati,
    equal,
    comparison,
    sandhiOrb,
    sources: CHALIT_SOURCES,
    caveats: CHALIT_CAVEATS,
  };
}

/** Phaladeepika 15.13 note for a dasa lord that stands in a sandhi in either construction, or undefined. */
export function sandhiDasaNote(
  c: ChalitResult,
  lord: Planet,
): string | undefined {
  const cmp = c.comparison.find((x) => x.planet === lord);
  if (!cmp) return undefined;
  const hits = CHALIT_METHODS.filter((mth) => cmp[mth].atSandhi);
  if (!hits.length) return undefined;
  const which =
    hits.length === 2
      ? "both bhava constructions"
      : `the ${CHALIT_METHOD_LABEL[hits[0]].toLowerCase()} bhava construction`;
  return `${lord} stands in a bhava sandhi in ${which}; Phaladeepika 15.13 reads such a planet as ineffective in its dasa and bhukti however strong it is (provisional: the text gives no orb).`;
}

export const CHALIT_CAVEATS = [
  "Two constructions are shown and neither is preferred. Sripati's cusps are not Parashara's: the translation in use has no verse that computes the twelve madhyas, though 27.26-31 measures bhava bala at cusps and 5.9 speaks of bhava charts from the special lagnas, which shows the notion is Parashari; the trisection is from Sripati Paddhati and is provisional. The equal construction follows Phaladeepika 8.34, which places a planet's full bhava effect where its distance into its sign equals the lagna's distance into the lagna sign.",
  "Sripati madhyas: lagna degree for the 1st, meridian for the 10th, their opposites for the 7th and 4th, and the arcs between trisected for the rest (the Porphyry construction). Equal madhyas: the lagna degree in every sign. In both, a bhava runs from the midpoint with the previous madhya to the midpoint with the next and is named after the sign its madhya falls in.",
  "A planet that changes bhava keeps its sign, degree, nakshatra, dignity and lordships. Every Parashari rule harvested so far (lordships, yogas, dasa effects, Ashtakavarga) is stated in signs and continues to be read on the rasi chart; the chalit shows where a bhava-based reading would differ and how much of the bhava's effect Phaladeepika 8.35 and 15.14 allow the planet: full at the madhya, nil at a sandhi, in proportion between.",
  "Phaladeepika 15.13 reads a planet in a bhava sandhi as ineffective in its dasa and bhukti however strong it is, but gives no orb; here a planet below one tenth of the full effect is reported as in a sandhi, and the one-degree flag in the summary is likewise a display choice. Both thresholds are provisional.",
];

export const signDeg = (lon: number) => {
  const s = Math.floor(norm360(lon) / 30);
  const d = norm360(lon) - s * 30;
  const total = Math.round(d * 60);
  return `${SIGNS[s].slice(0, 3)} ${Math.floor(total / 60)}°${String(total % 60).padStart(2, "0")}'`;
};
