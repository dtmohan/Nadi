/**
 * Karmajiva (livelihood), Brihat Jataka adhyaya 10 (Varahamihira).
 *
 * 10.1  A planet in the 10th from the lagna or from the Moon gives wealth through the person it stands for:
 *       Sun the father, Moon the mother, Mars enemies, Mercury friends, Jupiter brothers, Venus women, Saturn
 *       servants. When no planet stands there, the calling is read from the lord of the navamsa occupied by the
 *       lord of the 10th counted from the lagna, the Moon and the Sun.
 * 10.2-3 What each navamsa lord gives as a calling.
 * 10.4  The livelihood planet in a friend's, an enemy's or its own sign; the strong exalted Sun; benefics in the
 *       11th, lagna or 2nd.
 *
 * Sources: Neely's translation on wisdomlib (verse pages), the public-domain Iyer 1885 translation on archive.org
 * (pp. 110-112), and the Adyar Library 1951 Sanskrit edition with Aiyangar's commentary (pp. 445-452). Readings that
 * come from a commentary rather than the verse are flagged provisional.
 */
import {
  EXALTATION,
  FRIENDS,
  ENEMIES,
  OWN_SIGNS,
  SIGNS,
  SIGN_LORD,
  houseFrom,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { navamsaOf } from "./jaimini";
import { naturalBenefic, type ParashariSource } from "./parashari";
import type { ShadbalaResult } from "./shadbala";

const WL =
  "https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/";
export const BRIHAT_JATAKA_IYER_URL =
  "https://archive.org/details/brihatjatakavar00iyergoog";
const ADYAR = "https://archive.org/details/in.ernet.dli.2015.382698";

export const KARMAJIVA_SOURCES: Record<string, ParashariSource> = {
  v1: { label: "Brihat Jataka 10.1", url: `${WL}doc1501718.html` },
  v2: { label: "Brihat Jataka 10.2", url: `${WL}doc1501719.html` },
  v3: { label: "Brihat Jataka 10.3", url: `${WL}doc1501720.html` },
  v4: { label: "Brihat Jataka 10.4", url: `${WL}doc1501721.html` },
  iyer: { label: "Iyer 1885, pp. 110-112", url: BRIHAT_JATAKA_IYER_URL },
  adyar: { label: "Adyar 1951, pp. 445-452", url: ADYAR },
  commentary: {
    label: "Adyar commentary, pp. 446-447",
    url: ADYAR,
    provisional: true,
  },
};

export type Reference = "Lagna" | "Moon" | "Sun";
export const KARMAJIVA_REFERENCES: Reference[] = ["Lagna", "Moon", "Sun"];

/** 10.1: the person through whom a planet in the 10th brings wealth. */
export const TENTH_WEALTH: Record<Planet, string> = {
  Sun: "the father",
  Moon: "the mother",
  Mars: "enemies",
  Mercury: "friends",
  Jupiter: "brothers",
  Venus: "the wife or women",
  Saturn: "servants",
  Rahu: "",
  Ketu: "",
};

/** Commentary glosses on 10.1 (Adyar p. 445-446), provisional. */
export const TENTH_WEALTH_GLOSS: Partial<Record<Planet, string>> = {
  Mars: "the commentary adds kinsmen and cousins",
  Mercury: "the commentary adds the maternal uncle",
  Jupiter: "elder brothers in the commentary",
};

/** 10.2-3: the calling given by the lord of the navamsa the 10th lord occupies. */
export const NAVAMSA_CALLING: Record<Planet, string> = {
  Sun: "grass and herbs, gold, wool, medicines",
  Moon: "farming and water products (pearls, conch, fish), dealings with women",
  Mars: "metals and minerals, fire, weapons, daring deeds",
  Mercury:
    "writing, accounts and mathematics, the sciences, poetry, arts and crafts",
  Jupiter:
    "Brahmins, the learned and the gods, mines, religious and virtuous acts",
  Venus: "gems, silver and other metals, cows and buffaloes",
  Saturn: "hard labour, killing and torture, carrying burdens, low crafts",
  Rahu: "",
  Ketu: "",
};

export interface TenthOccupant {
  planet: Planet;
  /** Which references the planet is 10th from. */
  from: Reference[];
  wealthFrom: string;
  gloss?: string;
}

export type SignRelation = "own" | "friend" | "enemy" | "neutral";

export interface ReferenceReading {
  reference: Reference;
  referenceSign: number;
  tenthSign: number;
  tenthLord: Planet;
  tenthLordSign: number;
  navamsaSign: number;
  navamsaLord: Planet;
  calling: string;
  /** 10.4: the 10th lord (the livelihood planet) stands in a friend's, enemy's or its own sign. */
  relation: SignRelation;
  relationNote: string;
  /** Shadbala total (virupas) of the Sun or Moon when the base is known; the lagna has none. */
  rupas?: number;
}

export interface KarmajivaResult {
  tenthOccupants: TenthOccupant[];
  /** No planet in the 10th from the lagna or the Moon: the verse turns to the navamsa reading. */
  fallbackApplies: boolean;
  references: ReferenceReading[];
  /** The stronger of the Sun and the Moon by Shadbala, when known (the commentary's first reading, provisional). */
  strongerLuminary?: Exclude<Reference, "Lagna">;
  /** 10.4: Sun exalted and strong, or benefics in the 11th, lagna or 2nd. */
  sunSelfEffort: boolean;
  beneficsInGain: Planet[];
  caveats: string[];
  sources: typeof KARMAJIVA_SOURCES;
}

function relationOfLord(lord: Planet, sign: number): SignRelation {
  if (OWN_SIGNS[lord]?.includes(sign)) return "own";
  const owner = SIGN_LORD[sign];
  if (owner === lord) return "own";
  if (FRIENDS[lord]?.includes(owner)) return "friend";
  if (ENEMIES[lord]?.includes(owner)) return "enemy";
  return "neutral";
}

const RELATION_NOTE: Record<SignRelation, string> = {
  own: "in its own sign: wealth through one's own house and people",
  friend: "in a friend's sign: wealth through friends",
  enemy: "in an enemy's sign: wealth through enemies",
  neutral:
    "in a neutral sign: the verse names only friend, enemy and own signs",
};

export function computeKarmajiva(
  positions: PlanetPosition[],
  lagnaIdx: number,
  shadbala?: ShadbalaResult,
): KarmajivaResult {
  const moon = positions.find((p) => p.planet === "Moon");
  const sun = positions.find((p) => p.planet === "Sun");
  const seven = positions.filter(
    (p) => p.planet !== "Rahu" && p.planet !== "Ketu",
  );
  const refSign: Record<Reference, number> = {
    Lagna: lagnaIdx,
    Moon: moon?.signIndex ?? lagnaIdx,
    Sun: sun?.signIndex ?? lagnaIdx,
  };

  // 10.1 first half: planets in the 10th from the lagna or the Moon.
  const tenthOccupants: TenthOccupant[] = [];
  for (const p of seven) {
    const from: Reference[] = [];
    if (houseFrom(refSign.Lagna, p.signIndex) === 10) from.push("Lagna");
    if (houseFrom(refSign.Moon, p.signIndex) === 10) from.push("Moon");
    if (from.length)
      tenthOccupants.push({
        planet: p.planet,
        from,
        wealthFrom: TENTH_WEALTH[p.planet],
        gloss: TENTH_WEALTH_GLOSS[p.planet],
      });
  }

  // 10.1 second half: the navamsa of the 10th lord from each reference.
  const references: ReferenceReading[] = KARMAJIVA_REFERENCES.map((ref) => {
    const tenthSign = (refSign[ref] + 9) % 12;
    const tenthLord = SIGN_LORD[tenthSign];
    const lordPos = positions.find((p) => p.planet === tenthLord)!;
    const nav = navamsaOf(lordPos.lon);
    const navamsaLord = SIGN_LORD[nav.signIndex];
    const relation = relationOfLord(tenthLord, lordPos.signIndex);
    const rupas =
      ref === "Lagna"
        ? undefined
        : shadbala?.planets.find((x) => x.planet === ref)?.total;
    return {
      reference: ref,
      referenceSign: refSign[ref],
      tenthSign,
      tenthLord,
      tenthLordSign: lordPos.signIndex,
      navamsaSign: nav.signIndex,
      navamsaLord,
      calling: NAVAMSA_CALLING[navamsaLord],
      relation,
      relationNote: RELATION_NOTE[relation],
      rupas,
    };
  });

  const sunR = references.find((r) => r.reference === "Sun")?.rupas;
  const moonR = references.find((r) => r.reference === "Moon")?.rupas;
  const strongerLuminary =
    sunR !== undefined && moonR !== undefined
      ? sunR >= moonR
        ? "Sun"
        : "Moon"
      : undefined;

  // 10.4: the exalted strong Sun, benefics in the 11th, lagna or 2nd.
  const sunExalted = !!sun && sun.signIndex === EXALTATION.Sun!.sign;
  const sunRupas = shadbala?.planets.find((x) => x.planet === "Sun");
  const sunSelfEffort = sunExalted && (sunRupas ? sunRupas.strong : true);
  const beneficsInGain = seven
    .filter((p) => naturalBenefic(p, positions))
    .filter((p) => [11, 1, 2].includes(houseFrom(lagnaIdx, p.signIndex)))
    .map((p) => p.planet);

  const caveats: string[] = [
    "10.1 names the 10th from the lagna and from the Moon for the planet-in-the-10th rule; the navamsa rule that follows names the lagna, the Moon and the Sun. Iyer reads the navamsa rule as the fallback when the 10th is empty; the Adyar commentary reads both halves together.",
    "Which of the three references decides: the commentary (Adyar p. 446) first gives only the strongest of the lagna, the Moon and the Sun, citing Jataka Parijata, then (p. 447) allows all three, citing Garga, several planets giving several callings each in its own period. Both readings are the commentator's, so they are provisional; the table shows all three and marks the stronger luminary by Shadbala when the base is known.",
    "Neely renders the Moon's person in 10.1 as the father's wife; the Adyar text reads janani, the mother, which Iyer also has. The mother is shown.",
    "The Sun's self-effort clause in 10.4 requires the Sun exalted and strong; strength is taken as Shadbala at or above the required rupas when the base is known, else exaltation alone.",
  ];

  return {
    tenthOccupants,
    fallbackApplies: tenthOccupants.length === 0,
    references,
    strongerLuminary,
    sunSelfEffort,
    beneficsInGain,
    caveats,
    sources: KARMAJIVA_SOURCES,
  };
}

export const signName = (i: number) => SIGNS[i];
