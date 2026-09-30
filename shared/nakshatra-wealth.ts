// Nakshatra wealth rules: the twenty "important nakshatras of wealth" from S.
// Prakash's DNA Astrology of Wealth (2022), each with the book's own rule list
// (pp. 96-169). Every rule is a page-cited, book-faithful transcription of one
// "Astrological combination to see Wealth" sentence, with its conditioning kept
// exactly: which planet (or the lagna) occupies the nakshatra, which house class
// it must sit in (wealth-giving 2/5/9/11, Kendra 1/4/7/10, Trikon 1/5/9 —
// p. 24 and the book's usage), whether a pair must be conjunct there, and the
// two special forms the book phrases differently (a sign-house condition and a
// cross-trine condition).
//
// Provenance: a 2022 self-published research work, not a classical text; the
// rules are read as the author states them and labelled with their pages.

import {
  NAKSHATRAS,
  SIGNS,
  houseFrom,
  norm360,
  type Planet,
  type PlanetPosition,
} from "./astro";

export interface NakshatraWealthHit {
  /** The nakshatra the rule belongs to. */
  nakshatra: string;
  /** The planet the rule names (undefined for the lagna rules). */
  planet: Planet | null;
  /** The second planet when the rule requires a conjunction in the nakshatra. */
  conjunctWith?: Planet;
  /** House class the rule demands, as the book phrases it. */
  houses: "any" | "wealth" | "kendra" | "trikon" | "kendra-trikon" | "wealth-kendra";
  /** Special forms: a named house for a single planet, or a trine to another planet. */
  special?:
    | { kind: "house"; ns: number[]; or?: NakshatraWealthHit["houses"] }
    | { kind: "trine"; to: Planet };
  text: string;
  pages: string;
}

export interface NakshatraWealthReading {
  /** Nakshatra occupied by the lagna, for the lagna rules. */
  lagnaNakshatra: string | null;
  hits: NakshatraWealthHit[];
  headline: string;
  notes: string[];
}

type HouseClass = NakshatraWealthHit["houses"];

/** Wealth-giving houses per the book's own front matter: 2, 5, 9, 11 (p. 24). */
const WEALTH_HOUSES = [2, 5, 9, 11];
/** Kendra 1/4/7/10 and Trikon 1/5/9 (the book's usage, pp. 100-169). */
const KENDRA = [1, 4, 7, 10];
const TRIKON = [1, 5, 9];

function okClass(houseClass: HouseClass, house: number): boolean {
  switch (houseClass) {
    case "any":
      return true;
    case "wealth":
      return WEALTH_HOUSES.includes(house);
    case "kendra":
      return KENDRA.includes(house);
    case "trikon":
      return TRIKON.includes(house);
    case "kendra-trikon":
      return KENDRA.includes(house) || TRIKON.includes(house);
    case "wealth-kendra":
      return WEALTH_HOUSES.includes(house) || KENDRA.includes(house);
  }
}

interface NwSpec {
  /** The nakshatra's wealth theme, from its chapter. */
  theme: string;
  rules: Array<{
    planet: Planet | null;
    conjunctWith?: Planet;
    houses?: HouseClass;
    special?: NakshatraWealthHit["special"];
    text: string;
  }>;
  pages: string;
}

// House classes as the book phrases each rule. "any" is used where the rule
// names no house ("If Rahu is in Rohini Nakshatra", p. 104). A rule naming a
// specific house ("Mars in the 2nd or 11th house", p. 111) is carried in
// `special` with its house numbers noted in the text, following the book
// exactly rather than folding it into a class.
export const NAKSHATRA_WEALTH: Record<string, NwSpec> = {
  "Ashlesha": {
    theme: "business intellect and analysis; wealth through research, mining or the hidden trades",
    rules: [
      { planet: "Sun", conjunctWith: "Mars", houses: "wealth", text: "Sun and Mars conjunct in Ashlesha in wealth-giving houses." },
      { planet: "Venus", conjunctWith: "Sun", houses: "kendra-trikon", text: "Venus and Sun conjunct in Ashlesha in Kendra or Trikon houses." },
      { planet: "Rahu", conjunctWith: "Venus", houses: "any", text: "Rahu and Venus conjunct in Ashlesha." },
      { planet: "Mercury", conjunctWith: "Jupiter", houses: "kendra", text: "Mercury and Jupiter conjunct in Ashlesha in Kendra houses." },
      { planet: "Venus", houses: "wealth", text: "Venus in Ashlesha in wealth-giving houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 100",
  },
  "Rohini": {
    theme: "growth, jewellery, gold, food, fashion, entertainment and automobiles",
    rules: [
      { planet: "Moon", conjunctWith: "Venus", houses: "wealth-kendra", text: "Moon and Venus conjunct in Rohini in wealth-giving or Kendra houses." },
      { planet: "Sun", houses: "wealth", text: "Sun in Rohini in wealth-giving houses." },
      { planet: "Moon", houses: "kendra-trikon", text: "Moon in Rohini in Kendra or Trikon houses." },
      { planet: "Venus", houses: "wealth", special: { kind: "trine", to: "Moon" }, text: "Venus in Rohini in wealth-giving houses, with the Moon in trine to Venus." },
      { planet: "Rahu", houses: "any", text: "Rahu in Rohini." },
      { planet: "Saturn", conjunctWith: "Moon", houses: "wealth", text: "Saturn and Moon conjunct in Rohini in wealth-giving houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 104",
  },
  "Ardra": {
    theme: "research, healing and transformation; wealth through the unconventional",
    rules: [
      { planet: "Mars", houses: "wealth", text: "Mars in Ardra in wealth-giving houses." },
      { planet: "Saturn", conjunctWith: "Ketu", houses: "kendra-trikon", text: "Saturn and Ketu conjunct in Ardra in Kendra or Trikon houses." },
      { planet: "Moon", houses: "kendra-trikon", text: "Moon in Ardra in Kendra or Trikon houses." },
      { planet: "Moon", conjunctWith: "Venus", houses: "wealth-kendra", text: "Moon and Venus conjunct in Ardra in wealth or Kendra houses." },
      { planet: "Sun", houses: "kendra", text: "Sun in Ardra in Kendra houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 108",
  },
  "Dhanishta": {
    theme: "property, real estate, music and rhythm; abundance through the eight Vasus",
    rules: [
      { planet: "Venus", houses: "any", text: "Venus in Dhanishta." },
      { planet: "Saturn", houses: "wealth", text: "Saturn in Dhanishta in wealth-giving houses." },
      { planet: "Moon", houses: "wealth", text: "Moon in Dhanishta in wealth-giving houses." },
      { planet: "Mars", special: { kind: "house", ns: [2, 11] }, text: "Mars in Dhanishta in the 2nd or 11th house." },
      { planet: "Saturn", conjunctWith: "Venus", houses: "any", text: "Saturn and Venus conjunct in Dhanishta." },
      { planet: "Jupiter", conjunctWith: "Sun", houses: "any", text: "Jupiter and Sun conjunct in Dhanishta." },
    ],
    pages: "DNA Astrology of Wealth, p. 111",
  },
  "Purva Phalguni": {
    theme: "design, art, entertainment and pleasure; wealth through recognition",
    rules: [
      { planet: "Venus", houses: "wealth", text: "Venus in Purva Phalguni in wealth-giving houses." },
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Purva Phalguni in Kendra or Trikon houses." },
      { planet: "Sun", houses: "kendra-trikon", text: "Sun in Purva Phalguni in Kendra or Trikon houses." },
      { planet: "Sun", conjunctWith: "Venus", houses: "any", text: "Sun and Venus conjunct in Purva Phalguni." },
      { planet: "Sun", conjunctWith: "Moon", houses: "kendra-trikon", text: "Sun and Moon conjunct in Purva Phalguni in Kendra or wealth-giving houses." },
      { planet: "Sun", conjunctWith: "Mars", houses: "any", text: "Sun and Mars conjunct in Purva Phalguni." },
      { planet: "Venus", conjunctWith: "Jupiter", houses: "wealth", text: "Venus and Jupiter conjunct in Purva Phalguni in wealth-giving houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 114",
  },
  "Uttara Ashadha": {
    theme: "the unconquered; leadership and lasting authority",
    rules: [
      { planet: "Venus", conjunctWith: "Saturn", houses: "kendra-trikon", text: "Venus and Saturn in Uttara Ashadha in Kendra or Trikon houses." },
      { planet: "Rahu", conjunctWith: "Saturn", houses: "wealth", text: "Rahu and Saturn in Uttara Ashadha in wealth-giving houses." },
      { planet: "Rahu", conjunctWith: "Venus", houses: "any", text: "Rahu and Venus in Uttara Ashadha." },
      { planet: "Saturn", houses: "any", text: "Saturn in Uttara Ashadha." },
      { planet: "Mars", special: { kind: "house", ns: [10], or: "wealth" }, text: "Mars in Uttara Ashadha in the 10th or wealth-giving houses." },
      { planet: "Saturn", conjunctWith: "Mars", houses: "wealth", text: "Saturn and Mars conjunct in Uttara Ashadha in wealth-giving houses." },
      { planet: "Jupiter", conjunctWith: "Saturn", houses: "any", text: "Jupiter and Saturn conjunct in Uttara Ashadha." },
    ],
    pages: "DNA Astrology of Wealth, p. 117",
  },
  "Mula": {
    theme: "roots, research and renewal; wealth from digging deep",
    rules: [
      { planet: "Sun", houses: "kendra-trikon", text: "Sun in Mula in Kendra or Trikon houses." },
      { planet: "Ketu", houses: "kendra", text: "Ketu in Mula in Kendra houses." },
      { planet: "Jupiter", houses: "wealth", text: "Jupiter in Mula in wealth-giving houses." },
      { planet: "Sun", conjunctWith: "Jupiter", houses: "any", text: "Sun and Jupiter conjunct in Mula." },
      { planet: "Jupiter", houses: "any", special: { kind: "trine", to: "Mars" }, text: "Jupiter in Mula, in trine with Mars." },
      { planet: "Mercury", conjunctWith: "Sun", houses: "wealth", text: "Mercury and Sun conjunct in Mula in wealth-giving houses." },
      { planet: "Rahu", conjunctWith: "Venus", houses: "any", text: "Rahu and Venus conjunct in Mula." },
      { planet: "Mercury", conjunctWith: "Venus", houses: "any", text: "Mercury and Venus conjunct in Mula." },
      { planet: "Saturn", houses: "wealth", text: "Saturn in Mula in wealth-giving houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 120",
  },
  "Purva Ashadha": {
    theme: "invincible waters; wealth that flows and cannot be dried up",
    rules: [
      { planet: "Venus", houses: "kendra-trikon", text: "Venus in Purva Ashadha in Kendra or Trikon houses." },
      { planet: "Mercury", houses: "any", text: "Mercury in Purva Ashadha." },
      { planet: "Mercury", conjunctWith: "Venus", houses: "any", text: "Mercury and Venus conjunct in Purva Ashadha." },
      { planet: "Mars", houses: "kendra-trikon", text: "Mars in Purva Ashadha in Kendra or Trikon houses." },
      { planet: "Rahu", houses: "kendra-trikon", text: "Rahu in Purva Ashadha in Kendra or Trikon houses." },
      { planet: "Sun", conjunctWith: "Mercury", houses: "wealth", text: "Sun and Mercury conjunct in Purva Ashadha in Trikon and wealth-giving houses." },
      { planet: "Moon", conjunctWith: "Rahu", houses: "wealth", text: "Moon and Rahu conjunct in Purva Ashadha in wealth-giving houses." },
      { planet: "Sun", conjunctWith: "Venus", houses: "kendra", text: "Sun and Venus conjunct in Purva Ashadha in Kendra houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 123; Sagittarius sign rules (10th or 1st house with the nakshatra) omitted as lagna-sign conditions outside the app's model",
  },
  "Magha": {
    theme: "the royal throne; power and wealth through lineage",
    rules: [
      { planet: "Moon", houses: "wealth", text: "Moon in Magha in wealth-giving houses." },
      { planet: null, houses: "any", text: "Lagna in Magha." },
      { planet: "Mercury", houses: "any", text: "Mercury in Magha." },
      { planet: "Jupiter", houses: "any", text: "Jupiter in Magha." },
      { planet: "Mars", houses: "wealth", text: "Mars in Magha in wealth-giving houses." },
      { planet: "Sun", houses: "kendra-trikon", text: "Sun in Magha in Kendra or Trikon houses." },
      { planet: "Mars", conjunctWith: "Jupiter", houses: "wealth-kendra", text: "Mars and Jupiter conjunct in Magha in wealth or Kendra houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 126",
  },
  "Shravana": {
    theme: "learning through listening; wealth through knowledge and the guru",
    rules: [
      { planet: null, houses: "any", text: "Lagna in Shravana." },
      { planet: "Saturn", houses: "wealth", text: "Saturn in Shravana in wealth-giving houses." },
      { planet: "Moon", houses: "wealth-kendra", text: "Moon in Shravana in Kendra or wealth-giving houses." },
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Shravana in Kendra or Trikon houses." },
      { planet: "Mars", conjunctWith: "Jupiter", houses: "any", text: "Mars and Jupiter conjunct in Shravana." },
      { planet: "Saturn", conjunctWith: "Jupiter", houses: "kendra-trikon", text: "Saturn and Jupiter conjunct in Shravana in Kendra or Trikon houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 129",
  },
  "Uttara Bhadrapada": {
    theme: "deep water and counsel; wealth through wisdom and patience",
    rules: [
      { planet: "Mars", houses: "any", text: "Mars in Uttara Bhadrapada." },
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Uttara Bhadrapada in Kendra or Trikon houses." },
      { planet: "Venus", houses: "kendra-trikon", text: "Venus in Uttara Bhadrapada in Kendra or Trikon houses." },
      { planet: "Rahu", houses: "wealth-kendra", text: "Rahu in Uttara Bhadrapada in wealth or Kendra houses." },
      { planet: "Saturn", conjunctWith: "Rahu", houses: "wealth", text: "Saturn and Rahu conjunct in Uttara Bhadrapada in wealth-giving houses." },
      { planet: "Rahu", conjunctWith: "Venus", houses: "wealth", text: "Rahu and Venus conjunct in Uttara Bhadrapada in wealth-giving houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 132",
  },
  "Jyeshtha": {
    theme: "the eldest; Alakshmi's star, where defences against loss matter",
    rules: [
      { planet: "Moon", conjunctWith: "Rahu", houses: "wealth", text: "Moon and Rahu conjunct in Jyeshtha in wealth-giving houses." },
      { planet: "Ketu", houses: "kendra-trikon", text: "Ketu in Jyeshtha in Kendra or Trikon houses." },
      { planet: "Jupiter", special: { kind: "house", ns: [9] }, text: "Jupiter in Jyeshtha in the 9th house." },
      { planet: "Mars", conjunctWith: "Jupiter", houses: "kendra-trikon", text: "Mars and Jupiter in Jyeshtha in Kendra or Trikon houses." },
      { planet: "Jupiter", conjunctWith: "Mercury", houses: "kendra-trikon", text: "Jupiter and Mercury conjunct in Jyeshtha in Kendra or Trikon houses." },
      { planet: "Saturn", conjunctWith: "Mars", houses: "wealth-kendra", text: "Saturn and Mars conjunct in Jyeshtha in Kendra or wealth-giving houses." },
      { planet: "Mars", conjunctWith: "Mercury", houses: "kendra", text: "Mars and Mercury conjunct in Jyeshtha in Kendra houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 136",
  },
  "Hasta": {
    theme: "the hand; craft, business plans and the clever economy",
    rules: [
      { planet: "Mercury", houses: "any", text: "Mercury in Hasta." },
      { planet: "Mars", houses: "wealth", text: "Mars in Hasta in wealth-giving houses." },
      { planet: "Mars", conjunctWith: "Mercury", houses: "wealth", text: "Mars and Mercury conjunct in Hasta in wealth-giving houses." },
      { planet: "Jupiter", conjunctWith: "Ketu", houses: "wealth", text: "Jupiter and Ketu conjunct in Hasta in wealth-giving houses." },
      { planet: "Mercury", conjunctWith: "Venus", houses: "any", text: "Mercury and Venus conjunct in Hasta." },
      { planet: "Saturn", conjunctWith: "Jupiter", houses: "wealth", text: "Saturn and Jupiter conjunct in Hasta in wealth-giving houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 140",
  },
  "Shatabhisha": {
    theme: "the hundred physicians; wealth through healing and the technical arts",
    rules: [
      { planet: "Jupiter", houses: "kendra-trikon", text: "Jupiter in Shatabhisha in Kendra or Trikon houses." },
      { planet: "Sun", houses: "kendra-trikon", text: "Sun in Shatabhisha in Kendra or Trikon houses." },
      { planet: "Saturn", houses: "wealth", text: "Saturn in Shatabhisha in wealth-giving houses." },
      { planet: "Mercury", houses: "wealth", text: "Mercury in Shatabhisha in wealth-giving houses." },
      { planet: "Mars", houses: "kendra-trikon", text: "Mars in Shatabhisha in Kendra or Trikon houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 144",
  },
  "Anuradha": {
    theme: "collaboration and numbers; wealth through partnership and groups",
    rules: [
      { planet: "Sun", houses: "wealth", text: "Sun in Anuradha in wealth-giving houses." },
      { planet: "Ketu", houses: "wealth", text: "Ketu in Anuradha in wealth-giving houses." },
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Anuradha in Kendra or Trikon houses." },
      { planet: "Jupiter", houses: "kendra-trikon", text: "Jupiter in Anuradha in Kendra or Trikon houses." },
      { planet: "Saturn", conjunctWith: "Moon", houses: "wealth", text: "Saturn and Moon conjunct in Anuradha in wealth-giving houses." },
      { planet: "Saturn", conjunctWith: "Mars", houses: "wealth-kendra", text: "Saturn and Mars conjunct in Anuradha in wealth or Kendra houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 148",
  },
  "Krittika": {
    theme: "the cutter; wealth through sharpness, fire and purification",
    rules: [
      { planet: "Rahu", houses: "kendra", text: "Rahu in Krittika in Kendra houses." },
      { planet: "Jupiter", houses: "wealth", text: "Jupiter in Krittika in wealth-giving houses." },
      { planet: "Moon", houses: "any", text: "Moon in Krittika." },
      { planet: "Venus", conjunctWith: "Mercury", houses: "kendra-trikon", text: "Venus and Mercury conjunct in Krittika in Kendra or Trikon houses." },
      { planet: "Mars", houses: "wealth", text: "Mars in Krittika in wealth-giving houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 152",
  },
  "Swati": {
    theme: "independence and trade; the businessman's star",
    rules: [
      { planet: "Venus", conjunctWith: "Rahu", houses: "wealth", text: "Venus and Rahu conjunct in Swati in wealth-giving houses." },
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Swati in Kendra or Trikon houses." },
      { planet: "Moon", houses: "wealth", text: "Moon in Swati in wealth-giving houses." },
      { planet: "Venus", houses: "kendra-trikon", text: "Venus in Swati in Kendra or Trikon houses." },
      { planet: "Rahu", houses: "kendra-trikon", text: "Rahu in Swati in Kendra or Trikon houses." },
      { planet: "Jupiter", houses: "wealth", text: "Jupiter in Swati in wealth-giving houses." },
      { planet: "Sun", conjunctWith: "Mercury", houses: "wealth", text: "Sun and Mercury conjunct in Swati in wealth-giving houses." },
      { planet: "Mars", conjunctWith: "Mercury", houses: "kendra-trikon", text: "Mars and Mercury conjunct in Swati in Kendra or Trikon houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 156",
  },
  "Vishakha": {
    theme: "perseverance; the star of those who never feel the lack of money",
    rules: [
      { planet: "Saturn", houses: "any", text: "Saturn in Vishakha." },
      { planet: "Venus", houses: "wealth", text: "Venus in Vishakha in wealth-giving houses." },
      { planet: "Moon", houses: "any", text: "Moon in Vishakha." },
      { planet: "Rahu", houses: "wealth", text: "Rahu in Vishakha in wealth-giving houses." },
      { planet: "Jupiter", conjunctWith: "Venus", houses: "wealth", text: "Jupiter and Venus conjunct in Vishakha in wealth-giving houses." },
      { planet: "Mercury", conjunctWith: "Venus", houses: "wealth", text: "Mercury and Venus conjunct in Vishakha in wealth-giving houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 159 (the book lists 'Saturn in Vishakha' twice; carried once)",
  },
  "Revati": {
    theme: "the wealthy; safe journeys and nourishment",
    rules: [
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Revati in Kendra or Trikon houses." },
      { planet: "Sun", houses: "kendra-trikon", text: "Sun in Revati in Kendra or Trikon houses." },
      { planet: "Venus", houses: "kendra-trikon", text: "Venus in Revati in Kendra or Trikon houses." },
      { planet: "Venus", conjunctWith: "Sun", houses: "kendra-trikon", text: "Venus and Sun conjunct in Revati in Kendra or Trikon houses." },
      { planet: "Saturn", conjunctWith: "Venus", houses: "wealth", text: "Saturn and Venus conjunct in Revati in wealth-giving houses." },
      { planet: "Jupiter", houses: "wealth", text: "Jupiter in Revati in wealth-giving houses." },
      { planet: "Jupiter", conjunctWith: "Moon", houses: "kendra-trikon", text: "Jupiter and Moon conjunct in Revati in Kendra or Trikon houses." },
      { planet: "Moon", conjunctWith: "Mars", houses: "kendra-trikon", text: "Moon and Mars conjunct in Revati in Kendra or Trikon houses." },
      { planet: "Saturn", conjunctWith: "Rahu", houses: "kendra-trikon", text: "Saturn and Rahu conjunct in Revati in Kendra or Trikon houses." },
      { planet: "Mars", conjunctWith: "Venus", houses: "kendra-trikon", text: "Mars and Venus conjunct in Revati in Kendra or Trikon houses." },
      { planet: "Jupiter", conjunctWith: "Mars", houses: "kendra-trikon", text: "Jupiter and Mars conjunct in Revati in Kendra or Trikon houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 162",
  },
  "Punarvasu": {
    theme: "the return of light; finance, management and second-attempt success",
    rules: [
      { planet: "Mars", houses: "kendra-trikon", text: "Mars in Punarvasu in Kendra or Trikon houses." },
      { planet: "Sun", houses: "kendra-trikon", text: "Sun in Punarvasu in Kendra or Trikon houses." },
      { planet: "Sun", conjunctWith: "Mars", houses: "any", text: "Sun and Mars conjunct in Punarvasu." },
      { planet: "Jupiter", conjunctWith: "Sun", houses: "wealth", text: "Jupiter and Sun conjunct in Punarvasu in wealth-giving houses." },
      { planet: "Venus", special: { kind: "house", ns: [2] }, text: "Venus in Punarvasu in the 2nd house of wealth." },
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Punarvasu in Kendra or Trikon houses." },
    ],
    pages: "DNA Astrology of Wealth, p. 165",
  },
  "Pushya": {
    theme: "the nourisher; steady provision and the trusted position",
    rules: [
      { planet: "Mercury", houses: "wealth-kendra", text: "Mercury in Pushya in wealth or Kendra houses." },
      { planet: "Venus", houses: "kendra-trikon", text: "Venus in Pushya in Kendra or Trikon houses." },
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Pushya in Kendra or Trikon houses." },
      { planet: "Jupiter", conjunctWith: "Mercury", houses: "any", text: "Jupiter and Mercury conjunct in Pushya." },
      { planet: "Saturn", conjunctWith: "Venus", houses: "any", text: "Saturn and Venus conjunct in Pushya." },
      { planet: "Ketu", conjunctWith: "Jupiter", houses: "kendra-trikon", text: "Ketu and Jupiter conjunct in Pushya in Kendra or Trikon houses." },
      { planet: "Rahu", houses: "wealth-kendra", text: "Rahu in Pushya in Kendra or wealth-giving houses." },
      { planet: "Venus", houses: "wealth", text: "Venus in Pushya in wealth-giving houses." },
      { planet: "Sun", houses: "any", text: "Sun in Pushya." },
      { planet: "Saturn", houses: "kendra-trikon", text: "Saturn in Pushya (the book lists Saturn twice; the second entry is carried once)." },
      { planet: "Moon", houses: "wealth", text: "Moon in Pushya in Trikon or wealth-giving houses." },
      { planet: "Moon", conjunctWith: "Venus", houses: "any", text: "Moon and Venus conjunct in Pushya." },
    ],
    pages: "DNA Astrology of Wealth, p. 169",
  },
};

/** Wealth theme of each of the twenty stars, from its chapter. */
export const NAKSHATRA_WEALTH_THEMES: Record<string, string> = Object.fromEntries(
  Object.entries(NAKSHATRA_WEALTH).map(([nak, spec]) => [nak, spec.theme]),
);

export function assessNakshatraWealth(
  positions: PlanetPosition[],
  lagnaLon: number,
): NakshatraWealthReading {
  const pos = (p: Planet) => positions.find((x) => x.planet === p);
  const nakIndex = (lon: number) => Math.floor(norm360(lon) / (360 / 27));
  const lagnaNak = lagnaLon != null && isFinite(lagnaLon) ? NAKSHATRAS[nakIndex(lagnaLon)] : null;
  const lagnaSign = lagnaLon != null && isFinite(lagnaLon) ? Math.floor(norm360(lagnaLon) / 30) : null;

  const hits: NakshatraWealthHit[] = [];
  for (const [nak, spec] of Object.entries(NAKSHATRA_WEALTH)) {
    const idx = NAKSHATRAS.indexOf(nak as (typeof NAKSHATRAS)[number]);
    for (const r of spec.rules) {
      if (r.planet === null) {
        // Lagna rule: the lagna itself in the nakshatra.
        if (lagnaNak === nak) {
          hits.push({ nakshatra: nak, planet: null, houses: r.houses ?? "any", text: r.text, pages: spec.pages });
        }
        continue;
      }
      const p = pos(r.planet);
      if (!p || p.nakshatra !== nak) continue;

      // House class from the lagna (whole sign).
      if (lagnaSign == null) continue;
      const house = houseFrom(lagnaSign, p.signIndex);

      // Conjunction rules: the co-planet must be conjunct and in the same nakshatra.
      if (r.conjunctWith) {
        const c = pos(r.conjunctWith);
        if (!c || c.nakshatra !== nak || c.signIndex !== p.signIndex) continue;
      }

      if (r.special?.kind === "trine") {
        const t = pos(r.special.to);
        if (!t) continue;
        const rel = houseFrom(p.signIndex, t.signIndex);
        if (rel !== 1 && rel !== 5 && rel !== 9) continue;
      }
      if (r.special?.kind === "house") {
        // A named house is the condition itself; "or <class>" only where the book says so.
        if (!r.special.ns.includes(house) && !(r.special.or && okClass(r.special.or, house)))
          continue;
      } else if (!okClass(r.houses ?? "any", house)) {
        continue;
      }

      hits.push({
        nakshatra: nak,
        planet: r.planet,
        conjunctWith: r.conjunctWith,
        houses: r.houses ?? "any",
        special: r.special,
        text: r.text,
        pages: spec.pages,
      });
    }
  }

  const naks: string[] = [];
  for (const h of hits) if (!naks.includes(h.nakshatra)) naks.push(h.nakshatra);
  const headline =
    hits.length === 0
      ? "No nakshatra wealth rule of the book's twenty stars fires in this chart."
      : `${hits.length} rule${hits.length === 1 ? "" : "s"} fire${hits.length === 1 ? "s" : ""} across ${naks.length} of the book's twenty wealth nakshatras${naks.length ? ` (${listNaks(naks)})` : ""}.`;

  const notes: string[] = [
    "Wealth-giving houses are 2, 5, 9, 11 (the book, p. 24); Kendra 1/4/7/10, Trikon 1/5/9. Houses are whole-sign from the lagna.",
    `Source: S. Prakash, DNA Astrology of Wealth (2022), the twenty wealth nakshatras, pp. 96-169 — a modern research work, read alongside the Lakshmi and Rao/Naik layers, never in their place.`,
  ];

  return { lagnaNakshatra: lagnaNak, hits, headline, notes };
}

function listNaks(xs: string[]): string {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}
