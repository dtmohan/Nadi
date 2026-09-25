// Bhava chalit by the Sripati method, offered as a cross-check on the whole-sign (rasi) bhavas.
// Parashara assumes bhava madhyas exist (bhava bala in 27.26-31 is measured on cusps, and 5.9 has
// bhava charts prepared from the special lagnas) but the translation gives no verse that lays out the
// twelve madhyas and sandhis. The construction here is the Sripati Paddhati one: the lagna degree is the
// madhya of the 1st, the meridian that of the 10th, their opposites the 7th and 4th, the arcs between
// them trisected for the intermediate madhyas, and each bhava running from the midpoint with the
// previous madhya to the midpoint with the next. Everything in this file is provisional.
import { SIGNS, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";

export interface ChalitSource {
  label: string;
  url: string;
  provisional?: boolean;
}

export const CHALIT_SOURCES = {
  method: { label: "Sripati Paddhati (not Parashara)", url: BPHS_URL(27), provisional: true } as ChalitSource,
  cusps: { label: "Parashara 27.26-31", url: BPHS_URL(27), provisional: true } as ChalitSource,
  special: { label: "Parashara 5.9", url: BPHS_URL(5), provisional: true } as ChalitSource,
};

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
}

export interface ChalitResult {
  asc: number;
  mc: number;
  bhavas: ChalitBhava[];
  planets: ChalitPlanet[];
  /** Planets within `sandhiOrb` degrees of a sandhi. */
  sandhiOrb: number;
  sources: typeof CHALIT_SOURCES;
  caveats: string[];
}

export function computeChalit(positions: PlanetPosition[], asc: number, mc: number, sandhiOrb = 1): ChalitResult {
  const lagnaSign = Math.floor(norm360(asc) / 30);
  const m: number[] = new Array(12);
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

  const start: number[] = new Array(12);
  for (let i = 0; i < 12; i++) {
    const prev = m[(i + 11) % 12];
    start[i] = norm360(prev + arc(prev, m[i]) / 2);
  }
  const inSpan = (lon: number, i: number) => arc(start[i], lon) < arc(start[i], start[(i + 1) % 12]);

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
    return { planet: p.planet, lon, rasiHouse, chalitHouse, shifted: rasiHouse !== chalitHouse, sandhiGap: best, sandhiBetween: between };
  });

  const bhavas: ChalitBhava[] = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    madhya: m[i],
    start: start[i],
    end: start[(i + 1) % 12],
    signIndex: Math.floor(m[i] / 30),
    planets: planets.filter((p) => p.chalitHouse === i + 1).map((p) => p.planet),
    rasiPlanets: planets.filter((p) => p.rasiHouse === i + 1).map((p) => p.planet),
  }));

  return { asc: m[0], mc: m[9], bhavas, planets, sandhiOrb, sources: CHALIT_SOURCES, caveats: CHALIT_CAVEATS };
}

export const CHALIT_CAVEATS = [
  "The cusps are Sripati's, not Parashara's. The translation in use has no verse that computes the twelve madhyas; 27.26-31 measures bhava bala at cusps and 5.9 speaks of bhava charts from the special lagnas, which shows the notion is Parashari, but the trisection method is from Sripati Paddhati. The whole section is provisional.",
  "Madhyas: lagna degree for the 1st, meridian for the 10th, their opposites for the 7th and 4th, and the arcs between trisected for the rest (the Porphyry construction). Each bhava runs from the midpoint with the previous madhya to the midpoint with the next; a bhava is named after the sign its madhya falls in.",
  "Every Parashari rule harvested so far (lordships, yogas, dasa effects, Ashtakavarga) is stated in signs and continues to be read on the rasi chart. The chalit is shown only to flag planets whose bhava would differ and planets close to a sandhi, where 7.13-16's remark that effects fade toward the end of a division is the nearest textual analogue.",
  "The sandhi orb of one degree is a display choice with no textual basis.",
];

export const signDeg = (lon: number) => {
  const s = Math.floor(norm360(lon) / 30);
  const d = norm360(lon) - s * 30;
  const total = Math.round(d * 60);
  return `${SIGNS[s].slice(0, 3)} ${Math.floor(total / 60)}°${String(total % 60).padStart(2, "0")}'`;
};
