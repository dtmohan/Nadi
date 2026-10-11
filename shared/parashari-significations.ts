/**
 * Planet significations for the Parashari layer. Display only: no rule, verdict or kernel code
 * imports this module (guarded in scripts/significations.test.ts), so a signification never moves
 * a reading.
 *
 * Two tiers, kept apart and never merged:
 * - Classical: BPHS ch. 3 and 32 (R. Santhanam's translation) and Phaladeepika ch. 2
 *   (V. Subrahmanya Sastri, 1950), cited by verse. The glosses are our own short wording; the
 *   translations are linked, not copied.
 * - Modern: M.S. Mehta, Analysing Horoscope Through Modern Techniques (3rd revised ed., Sagar
 *   Publications; Kindle edition, ASIN B09TFNMQ9C), cited by the page the Kindle reader shows (a
 *   passage low on a two-column screen may fall on the next page); and Tanu Aggarwal, The Complete
 *   Guide to Karakatva in Vedic Astrology (Notion Press, 2026), cited by part and planet, with no
 *   page numbers yet (provisional). Mehta comes first; Aggarwal fills only what Mehta leaves.
 *
 * Era rule (an app convention, provisional): a modern reading that names a recent field carries the
 * approximate year the field arose (`since`), and shows only when that year falls by the native's
 * 60th. The years are round approximations, not dates of record.
 */
import { PLANETS, type Planet } from "./astro";
import { BPHS_URL } from "./parashari-data";
import type { SensitiveTag } from "./life-stage";

export type SignificationTier = "classical" | "modern";
export type SignificationSource = "BPHS" | "Phaladeepika" | "Mehta" | "Aggarwal";

export interface Signification {
  planet: Planet;
  /** Our own short gloss. */
  word: string;
  tier: SignificationTier;
  source: SignificationSource;
  /** Verse ("3.12-13"), page ("p. 181") or section ("Part 2, Rahu"). */
  ref: string;
  /** Condition or context, shown with the word ("under a strong Sun"). */
  note?: string;
  /** Practitioner reading only: the verse's own wording where the display differs. */
  verseNote?: string;
  /** Practitioner reading only: the classical root of a modern reading. */
  root?: string;
  /** Era rule: the approximate year the field arose. */
  since?: number;
  /** Topics withheld for a minor; must agree with `sensitiveTags(word)`. */
  tags?: SensitiveTag[];
}

export const PHALADEEPIKA_CH2_URL =
  "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621574.html";

export const SIGNIFICATION_SOURCES = {
  BPHS3: { label: "Parashara ch. 3", url: BPHS_URL(3) },
  BPHS32: { label: "ch. 32", url: BPHS_URL(32) },
  Phaladeepika: { label: "Phaladeepika ch. 2", url: PHALADEEPIKA_CH2_URL },
  Mehta: "M.S. Mehta, Analysing Horoscope Through Modern Techniques (3rd revised ed., Kindle pages)",
  Aggarwal: "Tanu Aggarwal, The Complete Guide to Karakatva in Vedic Astrology (2026; cited by part, no pages yet)",
} as const;

const B = (planet: Planet, ref: string, word: string, extra: Partial<Signification> = {}): Signification => ({
  planet, word, tier: "classical", source: "BPHS", ref, ...extra,
});
const P = (planet: Planet, ref: string, word: string, extra: Partial<Signification> = {}): Signification => ({
  planet, word, tier: "classical", source: "Phaladeepika", ref, ...extra,
});
const M = (planet: Planet, ref: string, word: string, extra: Partial<Signification> = {}): Signification => ({
  planet, word, tier: "modern", source: "Mehta", ref, ...extra,
});
const A = (planet: Planet, ref: string, word: string, extra: Partial<Signification> = {}): Signification => ({
  planet, word, tier: "modern", source: "Aggarwal", ref, ...extra,
});

export const PARASHARI_SIGNIFICATIONS: Signification[] = [
  // Sun
  B("Sun", "3.12-13", "soul"),
  B("Sun", "3.14-15", "royal"),
  B("Sun", "32.18-24", "father if stronger than Venus, with the 9th from it"),
  P("Sun", "2.1", "father, prowess, government service, glory"),
  P("Sun", "2.17", "physicians among its people"),
  P("Sun", "2.25", "father in a day birth"),
  P("Sun", "2.26", "soul"),
  M("Sun", "p. 4", "health, vitality", { note: "under a strong Sun", root: "Phaladeepika 2.1 prowess, power" }),
  M("Sun", "p. 182", "success and fame", { root: "Phaladeepika 2.1 glory" }),

  // Moon
  B("Moon", "3.12-13", "mind"),
  B("Moon", "3.14-15", "royal"),
  B("Moon", "3.21", "commerce"),
  B("Moon", "32.18-24", "mother if stronger than Mars, with the 4th from it"),
  P("Moon", "2.2", "mother, water, milk, fame, tenderness"),
  P("Moon", "2.25", "mother in a night birth"),
  P("Moon", "2.26", "body"),
  M("Moon", "pp. 6, 9", "public life, publicity", { root: "Phaladeepika 2.2 fame" }),
  M("Moon", "pp. 6, 9", "travel"),
  M("Moon", "pp. 6, 9", "emotional nature", { root: "BPHS 3.12-13 mind" }),
  M("Moon", "p. 204", "drugs and liquids", { note: "in medical careers", root: "Phaladeepika 2.2 water, milk" }),

  // Mars
  B("Mars", "3.12-13", "strength"),
  B("Mars", "3.14-15", "army chief"),
  B("Mars", "32.18-24", "younger brother, sister, brother-in-law, and mother if stronger than the Moon, with the 3rd from it for brothers"),
  P("Mars", "2.3", "brothers, products of the earth, fire, daring, weapons, wounds, energy"),
  P("Mars", "2.25", "youngest brother"),
  M("Mars", "pp. 7, 14; also p. 138, quoting K.N. Rao", "land and immovable property", { note: "as karaka for property", root: "Phaladeepika 2.3 products of the earth" }),
  M("Mars", "p. 7", "mechanical skill, engineering, surgery, police", { note: "under a strong Mars", root: "Phaladeepika 2.3 weapons, wounds, commanding an army" }),
  M("Mars", "p. 195", "plastics", { note: "read as fire", root: "Phaladeepika 2.3 fire", since: 1907 }),
  M("Mars", "p. 132", "the husband, in a woman's chart", { note: "in the note on second marriage", root: "Venus in BPHS 32.18-21" }),

  // Mercury
  B("Mercury", "3.12-13", "speech"),
  B("Mercury", "3.14-15", "prince"),
  B("Mercury", "3.21", "commerce"),
  B("Mercury", "32.18-24", "maternal relatives, with the 6th from it for the maternal uncle"),
  P("Mercury", "2.4", "learning, eloquence, fine arts, maternal uncle, mechanical arts"),
  P("Mercury", "2.18", "accountants and artisans among its people"),
  P("Mercury", "2.25", "adopted son"),
  M("Mercury", "p. 7 (\"author\"); p. 228 (a novelist's chart)", "writing", { root: "Phaladeepika 2.4 learning" }),

  // Jupiter
  B("Jupiter", "3.12-13", "knowledge and happiness"),
  B("Jupiter", "3.14-15", "minister"),
  B("Jupiter", "32.18-24", "paternal grandfather, with the 5th from it for sons"),
  P("Jupiter", "2.5", "knowledge, sons, teaching, religious faith, treasure-house, wisdom"),
  P("Jupiter", "2.19", "preceptors among its people"),
  P("Jupiter", "2.25", "eldest brother"),
  M("Jupiter", "p. 181", "banking", { root: "Phaladeepika 2.5 treasure-house" }),
  M("Jupiter", "p. 204", "cure", { note: "in medical careers" }),

  // Venus
  B("Venus", "3.12-13", "potency", { verseNote: "the translation reads \"semen (potency)\"", tags: ["intimacy"] }),
  B("Venus", "3.14-15", "minister"),
  B("Venus", "32.18-24", "husband, and father if stronger than the Sun, with the 7th from it for the wife"),
  P("Venus", "2.6", "wealth, vehicles, ornaments, music, dance, poetry, wife, marriage, charming speech"),
  P("Venus", "2.25", "mother in a day birth"),
  M("Venus", "p. 181", "textiles", { root: "Phaladeepika 2.6 cloths" }),
  M("Venus", "p. 217, after Naval Singh", "hotels"),

  // Saturn
  B("Saturn", "3.12-13", "grief"),
  B("Saturn", "3.14-15", "servant"),
  B("Saturn", "32.18-21", "sons"),
  B("Saturn", "32.22-24", "longevity, from the 8th from it", { verseNote: "the verse says death", tags: ["longevity"] }),
  P("Saturn", "2.7", "longevity", { tags: ["longevity"] }),
  P("Saturn", "2.7", "labourers, constancy"),
  P("Saturn", "2.20", "servants and blacksmiths among its people"),
  P("Saturn", "2.25", "father in a night birth"),
  M("Saturn", "p. 204", "profession"),
  M("Saturn", "p. 204", "factories, tools", { root: "Phaladeepika 2.20 blacksmiths" }),
  M("Saturn", "p. 9", "discipline", { note: "in a spiritual sense", root: "Phaladeepika 2.7 constancy" }),

  // Rahu
  B("Rahu", "3.14-15", "army, with Ketu"),
  M("Rahu", "p. 183", "electricity, telecommunication", { since: 1880 }),
  M("Rahu", "p. 183", "electronics", { since: 1906 }),
  M("Rahu", "p. 221 (pilots); the Rahu-Ketu axis, p. 217", "foreign travel"),
  A("Rahu", "Part 2, Rahu", "AI, internet, robotics", { since: 1990 }),
  A("Rahu", "Part 2, Rahu", "sudden gains and losses", { root: "Mehta, only with Mercury in the 10th" }),

  // Ketu
  B("Ketu", "3.14-15", "army, with Rahu"),
  B("Ketu", "32.18-21", "wife, father, mother, parents-in-law, maternal grandfather"),
  M("Ketu", "p. 210", "language and learning"),
  M("Ketu", "p. 210", "computer education, software", { since: 1950 }),
  A("Ketu", "Part 2, Ketu", "healing, occult"),
];

/** Mehta's modern house readings, shown under each house's BPHS 11.2-13 significations. */
export interface ModernHouseReading {
  house: number;
  reading: string;
  source: "Mehta";
  ref: string;
  note?: string;
  /** Practitioner reading only. */
  root?: string;
}

export const MODERN_HOUSE_READINGS: ModernHouseReading[] = [
  { house: 2, reading: "food business, hotels", source: "Mehta", ref: "p. 217, after Naval Singh", note: "with Venus", root: "BPHS 11.3 food and grains" },
  { house: 3, reading: "performing arts", source: "Mehta", ref: "p. 238, citing K.N. Rao", note: "counted from the birth chart" },
  { house: 4, reading: "education", source: "Mehta", ref: "p. 182", root: "BPHS 11.6, which gives learning to the 5th" },
  { house: 5, reading: "professional courses", source: "Mehta", ref: "p. 182", root: "BPHS 11.6 learning, knowledge" },
  { house: 8, reading: "inheritance", source: "Mehta", ref: "p. 138", root: "BPHS 11.9" },
  { house: 12, reading: "foreign travel, mysticism", source: "Mehta", ref: "p. 270" },
];

/** Where the sources assign a matter differently: each keeps its own column, nothing is merged. */
export interface SignificationConflict {
  matter: string;
  bphs: string;
  phaladeepika: string;
  mehta: string;
  aggarwal: string;
  since?: number;
}

export const SIGNIFICATION_CONFLICTS: SignificationConflict[] = [
  { matter: "Father", bphs: "the stronger of the Sun and Venus (32.18-21)", phaladeepika: "the Sun by day, Saturn by night (2.25)", mehta: "the Sun, \"Karka for father\" (p. 4); the day and night rule (ch. IX)", aggarwal: "none" },
  { matter: "Mother", bphs: "the stronger of the Moon and Mars (32.18-21)", phaladeepika: "Venus by day, the Moon by night (2.25)", mehta: "the Moon (pp. 14, 16)", aggarwal: "none" },
  { matter: "Husband, in a woman's chart", bphs: "Venus (32.18-21)", phaladeepika: "none", mehta: "Mars (p. 132), in the note on second marriage", aggarwal: "none" },
  { matter: "Software", bphs: "none", phaladeepika: "none", mehta: "Ketu (p. 210)", aggarwal: "Mercury (Part 2)", since: 1950 },
  { matter: "Surgery", bphs: "none", phaladeepika: "Mars: weapons, wounds (2.3); physicians among the Sun's people (2.17)", mehta: "a strong Mars (p. 7); a strong Sun (p. 4); Saturn in a sign of Mars (p. 204); Rahu (ch. X, XIII)", aggarwal: "none" },
  { matter: "Engineering", bphs: "none", phaladeepika: "Mercury: mechanical arts (2.4)", mehta: "a strong Mars (p. 7); the technical planets Mars, Saturn, Rahu and Ketu (p. 210)", aggarwal: "Saturn (Part 2)" },
  { matter: "Finance", bphs: "none", phaladeepika: "Jupiter: treasure-house (2.5); Venus: wealth (2.6)", mehta: "Jupiter, banking (p. 181)", aggarwal: "Venus (Part 2)" },
];

/** The era window: a field shows if it arose by the native's 60th year. */
export const ERA_WINDOW_YEARS = 60;

/** True when an entry passes the era rule for a birth year (always, when either year is unknown). */
export function eraShows(entry: { since?: number }, birthYear?: number): boolean {
  return entry.since === undefined || birthYear === undefined || entry.since <= birthYear + ERA_WINDOW_YEARS;
}

export interface SignificationView {
  /** Shown entries, in table order. */
  shown: Signification[];
  /** Modern entries hidden by the era rule. */
  eraHidden: Signification[];
  /** Number of entries withheld for a minor. */
  withheldCount: number;
  conflicts: SignificationConflict[];
}

/** The entries to show for a native: the era rule, then the minor's gate (tagged topics withheld). */
export function significationView(opts: { birthYear?: number; withheld: boolean }): SignificationView {
  const shown: Signification[] = [];
  const eraHidden: Signification[] = [];
  let withheldCount = 0;
  for (const s of PARASHARI_SIGNIFICATIONS) {
    if (opts.withheld && s.tags?.length) {
      withheldCount++;
      continue;
    }
    if (!eraShows(s, opts.birthYear)) {
      eraHidden.push(s);
      continue;
    }
    shown.push(s);
  }
  return {
    shown,
    eraHidden,
    withheldCount,
    conflicts: SIGNIFICATION_CONFLICTS.filter((c) => eraShows(c, opts.birthYear)),
  };
}

/** Shown entries grouped by planet, in the usual planet order. */
export function significationsByPlanet(shown: Signification[]): Array<{ planet: Planet; classical: Signification[]; modern: Signification[] }> {
  return PLANETS.map((planet) => ({
    planet,
    classical: shown.filter((s) => s.planet === planet && s.tier === "classical"),
    modern: shown.filter((s) => s.planet === planet && s.tier === "modern"),
  }));
}
