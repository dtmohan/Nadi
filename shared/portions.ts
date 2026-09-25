// BPHS 7.13-16: hora, decanate, and trimsamsa effects.
// 7.13  Jupiter, the Sun and Mars give (pronounced) effects in the Sun's hora; the Moon, Venus and Saturn in the
//       Moon's hora; Mercury in both.
// 7.14  In an even rasi the Moon's hora is powerful in effect, in an odd sign the Sun's hora.
// 7.15  Full, medium and nil are the effects in the beginning, middle and end of a hora; the same applies to a
//       decanate, turyamsa (chaturthamsa), navamsa "etc.".
// 7.16  For trimsamsa effects the Sun is akin to Mars and the Moon to Venus; what applies to a rasi applies to a
//       trimsamsa.
import { SIGN_LORD, type Planet, type PlanetPosition } from "./astro";
import { compoundRelation, SEVEN, type Compound, type Seven } from "./shadbala";
import { VARGA_BY_KEY, type Viswa } from "./vargas";
import { BPHS_URL } from "./parashari-data";

export interface PortionSource {
  label: string;
  url: string;
  provisional?: boolean;
}
const S = (v: string, provisional = false): PortionSource => ({ label: `Parashara 7.${v}`, url: BPHS_URL(7), provisional });

export const PORTION_SOURCES = {
  horaFit: S("13"),
  horaParity: S("14"),
  stages: S("15"),
  stagesWidth: S("15", true),
  trimsamsa: S("16", true),
};

export type Stage = "beginning" | "middle" | "end";
export const STAGE_EFFECT: Record<Stage, string> = { beginning: "full", middle: "medium", end: "nil" };

export interface PortionPlace {
  /** Which portion of the sign the planet stands in, 1-based, and its width in degrees. */
  index: number;
  width: number;
  /** Fraction of the portion traversed, 0..1. */
  fraction: number;
  stage: Stage;
  /** Sign the portion maps to under ch. 6. */
  signIndex: number;
}

export interface HoraReading {
  place: PortionPlace;
  /** Sun's or Moon's hora by 6.5-6. */
  horaOf: "Sun" | "Moon";
  /** 7.13: whether this hora is the one in which the planet gives pronounced effects (Mercury: both). */
  fits: boolean | "both";
  /** 7.14: the hora that is powerful in this sign by its parity. */
  powerfulIn: "Sun" | "Moon";
  powerful: boolean;
}

export interface TrimsamsaReading {
  signIndex: number;
  lord: Planet;
  /** The planet as which the occupant is judged: Sun as Mars, Moon as Venus (7.16). */
  judgedAs: Seven;
  relation: Viswa;
}

export interface PlanetPortions {
  planet: Planet;
  signIndex: number;
  deg: number;
  hora: HoraReading;
  drekkana: PortionPlace;
  chaturthamsa: PortionPlace;
  navamsa: PortionPlace;
  /** Only for the seven; the nodes have no relationship table. */
  trimsamsa?: TrimsamsaReading;
}

export interface PortionsResult {
  planets: PlanetPortions[];
  sources: typeof PORTION_SOURCES;
  caveats: string[];
}

const isSeven = (p: Planet): p is Seven => (SEVEN as readonly string[]).includes(p);

function place(signIndex: number, deg: number, n: number, key: "D2" | "D3" | "D4" | "D9"): PortionPlace {
  const width = 30 / n;
  const index = Math.min(n - 1, Math.floor(deg / width));
  const fraction = (deg - index * width) / width;
  const stage: Stage = fraction < 1 / 3 ? "beginning" : fraction < 2 / 3 ? "middle" : "end";
  return { index: index + 1, width, fraction, stage, signIndex: VARGA_BY_KEY[key].signOf(signIndex, deg) };
}

export function computePortions(positions: PlanetPosition[]): PortionsResult {
  const planets: PlanetPortions[] = positions.map((p) => {
    const deg = ((p.lon % 30) + 30) % 30;
    const s = p.signIndex;
    const odd = s % 2 === 0;
    const horaPlace = place(s, deg, 2, "D2");
    // 6.5-6: hora sign Leo (4) is the Sun's, Cancer (3) the Moon's.
    const horaOf: "Sun" | "Moon" = horaPlace.signIndex === 4 ? "Sun" : "Moon";
    const fits: boolean | "both" =
      p.planet === "Mercury" ? "both" : ["Jupiter", "Sun", "Mars"].includes(p.planet) ? horaOf === "Sun" : ["Moon", "Venus", "Saturn"].includes(p.planet) ? horaOf === "Moon" : false;
    const powerfulIn: "Sun" | "Moon" = odd ? "Sun" : "Moon";
    const hora: HoraReading = { place: horaPlace, horaOf, fits, powerfulIn, powerful: horaOf === powerfulIn };

    let trimsamsa: TrimsamsaReading | undefined;
    if (isSeven(p.planet)) {
      const signIndex = VARGA_BY_KEY.D30.signOf(s, deg);
      const lord = SIGN_LORD[signIndex];
      const judgedAs: Seven = p.planet === "Sun" ? "Mars" : p.planet === "Moon" ? "Venus" : p.planet;
      let relation: Viswa;
      if (lord === judgedAs) relation = "own";
      else {
        const lordPos = positions.find((q) => q.planet === lord)!;
        relation = compoundRelation(judgedAs, lord as Seven, s, lordPos.signIndex) as Compound;
      }
      trimsamsa = { signIndex, lord, judgedAs, relation };
    }

    return {
      planet: p.planet,
      signIndex: s,
      deg,
      hora,
      drekkana: place(s, deg, 3, "D3"),
      chaturthamsa: place(s, deg, 4, "D4"),
      navamsa: place(s, deg, 9, "D9"),
      trimsamsa,
    };
  });
  return { planets, sources: PORTION_SOURCES, caveats: PORTION_CAVEATS };
}

export const PORTION_CAVEATS = [
  "7.13 assigns the Sun's hora to Jupiter, the Sun and Mars, the Moon's to the Moon, Venus and Saturn, and both to Mercury; the nodes are not named, so their hora fit is left blank.",
  "7.14 says the Moon's hora is powerful in an even sign and the Sun's in an odd one. Under 6.5-6 that is always the first half of the sign; the verse is applied as written, not by halves.",
  "7.15 names three stages, beginning, middle and end, with full, medium and nil effect, and extends them to the decanate, turyamsa, navamsa 'etc.'. The verse gives no widths, so each portion is split into equal thirds here; that trisection is provisional, and the 'etc.' is not extended past the four divisions the verse names.",
  "7.16 makes the Sun akin to Mars and the Moon to Venus in the trimsamsa and applies rasi effects to it, so the Sun and Moon are judged as Mars and Venus against the trimsamsa lord. The trimsamsa lords and spans are 6.27-28; their mapping to signs is the commentators' (see the divisional chart notes), so this reading is provisional.",
];
