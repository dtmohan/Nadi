/**
 * Prasna Marga Ch. XV, "Afflictions due to Deity" (stanzas 2-18): the Deva Kopa mapping, which
 * names the deity behind a favourable or unfavourable karma from each planet's condition — its
 * sign, drekkana and strength. This is the diagnosis half of the chapter; the palliatives
 * (15.12-18) follow as a companion list. The rest of the chapter (curses, evil eye, spirits,
 * enemies and kshudra) is cataloged, not applied.
 */

export interface DeityRow {
  planet: string;
  condition: string;
  deity: string;
  source: string;
}

export const PRASNA_DEITY_MAPPING: DeityRow[] = [
  { planet: "Jupiter", condition: "in any sign", deity: "the supreme divinity, Vishnu in general", source: "Prasna Marga 15.3, 15.6" },
  { planet: "Sun", condition: "in any sign", deity: "Siva", source: "Prasna Marga 15.4" },
  { planet: "Sun", condition: "1st drekkana of a common sign", deity: "Subrahmanya", source: "Prasna Marga 15.4" },
  { planet: "Sun", condition: "2nd drekkana of a common sign", deity: "Ganesha", source: "Prasna Marga 15.4" },
  { planet: "Moon", condition: "strong", deity: "Durga", source: "Prasna Marga 15.4" },
  { planet: "Moon", condition: "weak", deity: "Bhadrakali", source: "Prasna Marga 15.4" },
  { planet: "Moon", condition: "weak in a Martian sign", deity: "the darker aspect, Chamundi", source: "Prasna Marga 15.4" },
  { planet: "Mars", condition: "in an odd (satwic) sign", deity: "Subrahmanya", source: "Prasna Marga 15.5" },
  { planet: "Mars", condition: "in other odd signs", deity: "Bhairava, Chandrakesha", source: "Prasna Marga 15.5" },
  { planet: "Mars", condition: "in an even sign", deity: "Chamundi, Bhadrakali", source: "Prasna Marga 15.5" },
  { planet: "Mercury", condition: "movable or common sign", deity: "the Avataras of Vishnu", source: "Prasna Marga 15.6" },
  { planet: "Mercury", condition: "1st or 2nd drekkana of a fixed sign", deity: "Sri Krishna", source: "Prasna Marga 15.6" },
  { planet: "Mercury", condition: "3rd drekkana of a fixed sign", deity: "Vishnu in general", source: "Prasna Marga 15.6" },
  { planet: "Venus", condition: "own house or a satwic sign", deity: "Annapoorneswari", source: "Prasna Marga 15.7" },
  { planet: "Venus", condition: "a benefic's house or a rajasic sign", deity: "Lakshmi", source: "Prasna Marga 15.7" },
  { planet: "Venus", condition: "an evil house or a tamasic sign", deity: "Yakshi", source: "Prasna Marga 15.7" },
  { planet: "Saturn", condition: "in any sign", deity: "Sastha and Kiratha", source: "Prasna Marga 15.7" },
  { planet: "Rahu", condition: "in any sign", deity: "the serpent god", source: "Prasna Marga 15.7" },
];

/** The three gunas by sign (15.5 note). */
export const PRASNA_SIGN_GUNAS: Array<"satwic" | "rajasic" | "tamasic"> = [
  "tamasic", // Aries
  "rajasic", // Taurus
  "rajasic", // Gemini
  "satwic", // Cancer
  "satwic", // Leo
  "rajasic", // Virgo
  "rajasic", // Libra
  "tamasic", // Scorpio
  "satwic", // Sagittarius
  "tamasic", // Capricorn
  "tamasic", // Aquarius
  "satwic", // Pisces
];

/** The palliatives for the angry planet (15.12-18), in the order of its house or sign. */
export const PRASNA_DEITY_REMEDIES = [
  "The angry planet in the 7th: divine dance; in the Sun's or Mars's signs, illumination; in the Moon's or Venus's signs, milk, ghee and payasa; in Jupiter's sign, sandal anointment and garlands; in Saturn's sign, ornaments and dress (15.12).",
  "The Badhaka planet in the 8th or 10th: puja and Bali; in the 12th, music and drums (15.13).",
  "Remedies by the angry planet's house from the lagna: pratibimbadana (1st), japa (2nd), puja (3rd), building temples (4th), feeding (5th), pratheekara bali (6th), dance (7th), bali (8th), devopasana (9th), dantis-kandha (10th), tarpana (11th) (15.14).",
  "By the angry planet's own nature: worship for the Sun, Sankabhisheka and rice-water for the Moon, illumination and Homa for Mars, dance for Mercury, feeding Brahmins for Jupiter, liberal feeding for Venus, feeding all for Saturn (15.15-18).",
];

export const PRASNA_DEITY_NOTE =
  "The Deva Kopa mapping names the deity each planet signifies (15.3-7), read with the sign's guna (15.5 note). Not applied: the causes and degrees of the deity's wrath (15.8-11), misappropriation of the deity's property (15.19-24), the serpent god's anger, parental and elders' curses, ghosts, the evil eye, and the enemies/kshudra chapters (15.25 onwards).";
