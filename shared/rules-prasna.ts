// Prasna Marga, harvested for the natal chart.
//
// Prasna Marga (attributed to Panakkattu Namboodiri, Kerala) is a horary text, but a set of its
// chapters reads a chart by the bhavas and planets, and those are harvestable for the natal
// reader. The first slice is "Effects of Planets in Houses" (B.V. Raman's translation, Chapter XIV,
// stanzas 50–65): for each of the twelve houses, what a malefic brings and what a benefic brings.
//
// "Malefic" and "benefic" are this app's natural classification (Jupiter and Venus; the waxing
// Moon; Mercury unless with a malefic — BPHS 3.11), applied because the stanzas name "evil" and
// "good" planets without defining them; that choice is provisional. Houses are whole signs counted
// from the ascendant. Every text is paraphrased and cited by chapter and stanza.

import type { Planet, PlanetPosition } from "./astro";
import { houseFrom, SIGN_LORD } from "./astro";
import { drishtiQuarters, naturalBenefic } from "./parashari";
import { toneOfText } from "./synthesis";
import { redactProse } from "./life-stage";
import type { PlanetStrength } from "./strength";

export interface PrasnaHouseRule {
  house: number; // 1..12 from the ascendant
  stanza: string; // "51", "57-58", ...
  malefic: string;
  benefic: string;
}

/** "Effects of Planets in Houses", Chapter XIV, stanzas 51–64 (Raman tr.). */
export const PRASNA_HOUSE_EFFECTS: PrasnaHouseRule[] = [
  {
    house: 1,
    stanza: "51",
    malefic:
      "An evil planet in the Lagna brings failure, disease of the head, sorrow, dishonour, displacement, loss of money and bodily discomfort.",
    benefic:
      "A benefic in the Lagna gives comfort, success, good health, financial prosperity, fame and promotion.",
  },
  {
    house: 2,
    stanza: "52",
    malefic:
      "A malefic in the 2nd brings loss of ancestral property, disease of the face, sickness in the family, trouble to the right eye, scandal and loss of vessels.",
    benefic:
      "A benefic in the 2nd increases family wealth, brings gains of vessels, family amity and happiness.",
  },
  {
    house: 3,
    stanza: "53",
    malefic:
      "A malefic in the 3rd brings misunderstanding with friends and helpers, misfortune to brothers, disease of the chest, neck and right ear, mental affliction, bad conduct and cowardice.",
    benefic:
      "A benefic in the 3rd gives good conduct, courage, happiness to brothers, help from others and good health.",
  },
  {
    house: 4,
    stanza: "54",
    malefic:
      "A malefic in the 4th causes distress to the mother and maternal relations, loss of cattle, beds, landed property and vehicles, heart trouble and general misery.",
    benefic:
      "A benefic in the 4th confers vehicles, lands, cattle, beds and general prosperity and health.",
  },
  {
    house: 5,
    stanza: "55",
    malefic:
      "A malefic in the 5th, afflicted by combustion and the like, brings illness or danger to children, mental uneasiness, an irritable temper and trouble to the native's advisers.",
    benefic:
      "A benefic in the 5th brings children, good health, peace of mind, influence and an increase of good deeds.",
  },
  {
    house: 6,
    stanza: "56",
    malefic:
      "A malefic in the 6th brings a wound or ulcer in the organ ruled by the 6th sign, fear from thieves and enemies, trouble in the waist and navel, obstacles and the ailments signified by the occupying planet.",
    benefic:
      "A benefic in the 6th vanquishes enemies and makes diseases disappear, and new ones do not arise.",
  },
  {
    house: 7,
    stanza: "57-58",
    malefic:
      "Malefics in the 7th bring sickness, separation from the life-partner, disturbance to journeys and urinary trouble; fire may break out in the spouse's house.",
    benefic:
      "Benefics in the 7th indicate marriage, recovery of lost wealth, enjoyment, happiness and the safe return of relations from foreign countries.",
  },
  {
    house: 8,
    stanza: "59-60",
    malefic:
      "Malefics in the 8th bring illness to servants, obstacles in all works, disease of the anus, quarrels, loss of wealth through thieves, rulers or enemies, loss of appetite and a bad name.",
    benefic:
      "A benefic in the 8th gives freedom from disease, courage, longevity and facilities to acquire new houses and build institutions.",
  },
  {
    house: 9,
    stanza: "61",
    malefic:
      "Malefics in the 9th cause illness to elders, the father and grandchildren, ill luck, divine wrath, disinclination to charity, decline of merit, ruin of penance and hard-heartedness.",
    benefic:
      "Benefics in the 9th bring blessings from elders and parents, mental happiness, divine grace, increase of fortune, inclination to good acts and happiness from grandchildren.",
  },
  {
    house: 10,
    stanza: "62",
    malefic:
      "Malefics in the 10th bring failure in efforts, a bad name, loss of respect, ruin to servants, breaks in profession, disease of the ankle and exile.",
    benefic:
      "Benefics in the 10th bring success in all attempts, increase of prestige and influence, rise in profession and acquisition of servants.",
  },
  {
    house: 11,
    stanza: "63",
    malefic:
      "Malefics in the 11th bring illness to elder brothers and sons, fresh ailments in the left ear and legs, but also the gain of articles.",
    benefic:
      "Benefics in the 11th bring abatement of grief, accomplishment of desired objects and fresh sources of wealth.",
  },
  {
    house: 12,
    stanza: "64",
    malefic:
      "Malefics in the 12th bring squandering of money, fall from position, trouble in the soles of the feet and the left eye, and falls through carelessness and sinful acts.",
    benefic:
      "Benefics in the 12th cause heavy expenditure for good purposes, gradual ending of sinful acts and abatement of sickness.",
  },
];

export interface PrasnaHouseReading {
  house: number;
  stanza: string;
  occupants: PlanetPosition[];
  malefics: PlanetPosition[];
  benefics: PlanetPosition[];
  maleficText?: string;
  beneficText?: string;
  source: string;
}

const PM = (stanza: string) => `Prasna Marga 14.${stanza}`;

/**
 * Read "Effects of Planets in Houses" for a chart: for each house that a planet occupies, state
 * the malefic result and the benefic result as the occupants fall. Houses are whole signs counted
 * from the ascendant. Empty houses are left silent (the text reads them by their lord elsewhere).
 */
export function computePrasna(
  positions: PlanetPosition[],
  lagnaIdx: number,
): PrasnaHouseReading[] {
  const out: PrasnaHouseReading[] = [];
  for (const rule of PRASNA_HOUSE_EFFECTS) {
    const occupants = positions.filter(
      (p) => houseFrom(lagnaIdx, p.signIndex) === rule.house,
    );
    if (!occupants.length) continue;
    const malefics = occupants.filter((p) => !naturalBenefic(p, positions));
    const benefics = occupants.filter((p) => naturalBenefic(p, positions));
    out.push({
      house: rule.house,
      stanza: rule.stanza,
      occupants,
      malefics,
      benefics,
      maleficText: malefics.length ? rule.malefic : undefined,
      beneficText: benefics.length ? rule.benefic : undefined,
      source: PM(rule.stanza),
    });
  }
  return out;
}

export const PRASNA_CAVEATS = [
  "Effects of Planets in Houses, Prasna Marga Chapter XIV, stanzas 50–65 (B.V. Raman's English translation). Houses are whole signs counted from the ascendant.",
  "\"Malefic\" and \"benefic\" are this app's natural classification (Jupiter and Venus; the waxing Moon; Mercury unless with a malefic — BPHS 3.11); the stanzas name \"evil\" and \"good\" planets without defining them, so that choice is provisional.",
  "The text's special effects for each planet-and-house combination, and its reading of empty houses by their lords, are not yet entered — this is the first slice.",
];

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Favourable and Unfavourable Positions of Planets" (Chapter XIV, stanzas 90–100): for each planet
// the results when it is well disposed and when it is afflicted. "Favourable" and "unfavourable"
// are this app's reading of the app's own strength pass (strong effective dignity and not combust
// nor hemmed by enemies vs. weak effective dignity, combust or hemmed by enemies); the text only
// says "well disposed" and "afflicted", so that mapping is provisional.

export interface PrasnaPlanetRule {
  planet: Planet; // Sun .. Saturn; the nodes are read by sign lord and are not entered yet
  stanza: string;
  favourable: string;
  unfavourable: string;
}

export const PRASNA_PLANET_DISPOSITIONS: PrasnaPlanetRule[] = [
  {
    planet: "Sun",
    stanza: "90",
    favourable:
      "A well-placed Sun gives a sattwic nature, the favour of Siva, the father and rulers, copper utensils, and wealth through journeys and trade in woollen goods, grass, gold, leather and medicines.",
    unfavourable:
      "An unfavourable Sun brings the wrath of rulers, of God Siva and of the father, disease of the heart, stomach and eyes, bone trouble, Pitta ailments, fear from quadrupeds and fire, loss of copper vessels and decline of influence.",
  },
  {
    planet: "Moon",
    stanza: "91",
    favourable:
      "A favourable Moon brings the grace of the queen and Durga, the mother's satisfaction, money through trade in ghee, sugar and clothes, income by mantras, cattle, marine traffic and diamonds through women, and increase of crops, fame and riches.",
    unfavourable:
      "An unfavourable Moon brings the queen's anger, the mother's dissatisfaction or illness, Vatha and Pitta ailments, impure blood, enmity with superiors and relatives, Durga's fury, loss of crops, danger to life and ill fame.",
  },
  {
    planet: "Mars",
    stanza: "92",
    favourable:
      "A favourable Mars brings land, gold and weapons, the favour of the commander and the grace of Subrahmanya, and profit from the loss of enemies, brothers and kings.",
    unfavourable:
      "An unfavourable Mars brings misunderstanding with brothers, loss of land and gold, fear from fire, thieves and enemies, Subrahmanya's wrath, trouble from the military, impure blood, fever, eye disease, loss of vessels, and cuts and wounds from weapons.",
  },
  {
    planet: "Mercury",
    stanza: "93",
    favourable:
      "A favourable Mercury brings horses, gold and lands, increase of friends, wealth through Brahmins and good advisers, skill in sculpture and arbitration, fame, righteous deeds, earnings by writing and figures, and the grace of Vishnu.",
    unfavourable:
      "An unfavourable Mercury brings Vishnu's ire, the heir-apparent's anger, abusive language and trouble from thieves.",
  },
  {
    planet: "Jupiter",
    stanza: "94",
    favourable:
      "A favourable Jupiter brings clarity of mind, gains from religious practice, from the learned and from the favour of rulers; gold, horses and elephants come unsolicited, and gods and Brahmins bestow blessings.",
    unfavourable:
      "An unfavourable Jupiter brings ear trouble, sickness to sons, the anger of gods and Brahmins, and enmity with the wicked.",
  },
  {
    planet: "Venus",
    stanza: "95",
    favourable:
      "A favourable Venus brings silver utensils, fine clothes, ornaments, diamonds, underground treasures, marriage, money, taste for music, cattle and luxurious food.",
    unfavourable:
      "An unfavourable Venus brings sickness to the wife and female relations, loss of clothes, decline of prosperity, sorrow in love, and the loss of silverware and quadrupeds.",
  },
  {
    planet: "Saturn",
    stanza: "96",
    favourable:
      "A favourable Saturn brings abatement of sorrows, increase of servants and iron goods, headship of a town, buffaloes and grain.",
    unfavourable:
      "An afflicted Saturn brings wind and phlegm ailments, ignorance, a tendency to steal, irritability, calamity, inertia, physical and mental debility, the sarcasm of women, servants and children, dislocation of the limbs and jealousy.",
  },
];

export type PrasnaDisposition = "favourable" | "unfavourable";

export interface PrasnaDispositionReading {
  planet: Planet;
  disposition: PrasnaDisposition;
  text: string;
  source: string;
}

const STRONG_DIGNITY: ReadonlySet<string> = new Set([
  "Exalted",
  "Moolatrikona",
  "Own sign",
]);
const WEAK_DIGNITY: ReadonlySet<string> = new Set(["Debilitated", "Inimical"]);

/** The app's reading of "well disposed" vs "afflicted" for a planet (provisional). */
export function dispositionOf(
  s: PlanetStrength,
): PrasnaDisposition | undefined {
  if (
    STRONG_DIGNITY.has(s.effectiveDignity) &&
    !s.effectiveCombust &&
    s.hemmed !== "enemies"
  )
    return "favourable";
  if (
    WEAK_DIGNITY.has(s.effectiveDignity) ||
    s.effectiveCombust ||
    s.hemmed === "enemies"
  )
    return "unfavourable";
  return undefined;
}

/** Read "Favourable and Unfavourable Positions of Planets" for a chart's strength pass. */
export function computePrasnaDispositions(
  strength: PlanetStrength[],
): PrasnaDispositionReading[] {
  const byPlanet = new Map(strength.map((s) => [s.planet, s]));
  const out: PrasnaDispositionReading[] = [];
  for (const rule of PRASNA_PLANET_DISPOSITIONS) {
    const s = byPlanet.get(rule.planet);
    if (!s) continue;
    const d = dispositionOf(s);
    if (!d) continue;
    out.push({
      planet: rule.planet,
      disposition: d,
      text: d === "favourable" ? rule.favourable : rule.unfavourable,
      source: `Prasna Marga 14.${rule.stanza}`,
    });
  }
  return out;
}

export const PRASNA_NODE_NOTE =
  "Rahu gives the results of the lord of the sign he occupies and of Saturn; Ketu, of the lord of the sign he occupies and of Mars (stanza 97). This is not yet entered.";

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Significations of Bhavas" (Chapter XIV, stanzas 3–14): what each of the twelve houses rules.
// The source numbers the stanzas 3, 4, 5, 5, 7 … and "77" for the ninth; the sequence is restored
// to 3–14 (one stanza per house, in order).

export interface PrasnaBhavaSignification {
  house: number; // 1..12
  stanza: string;
  text: string;
}

export const PRASNA_BHAVA_SIGNIFICATIONS: PrasnaBhavaSignification[] = [
  {
    house: 1,
    stanza: "3",
    text: "The body, shape, health, strength, welfare, fame, general happiness and success in all undertakings.",
  },
  {
    house: 2,
    stanza: "4",
    text: "Family, wealth, speech, the right eye and all kinds of knowledge.",
  },
  {
    house: 3,
    stanza: "5",
    text: "Courage, vitality, evil inclinations, brothers, the right ear and help.",
  },
  {
    house: 4,
    stanza: "6",
    text: "Mother, relatives, uncle, nephew, house and property, happiness, vehicles, things to sit on, popularity, water, beds and cots, affluence, cattle and the house of birth.",
  },
  {
    house: 5,
    stanza: "7",
    text: "Intelligence, prudence, memory, discrimination, merit earned in previous births, capacity to advise, ministers, children and the condition of the mind.",
  },
  {
    house: 6,
    stanza: "8",
    text: "Thieves, enemies, obstacles, mental worries, diseases, wounds and death due to enemies or weapons.",
  },
  {
    house: 7,
    stanza: "9",
    text: "Marriage, sexual instincts, wife or husband, relations with others, beds and cots, the wife's birthplace, lost or hidden things and sex relations.",
  },
  {
    house: 8,
    stanza: "10",
    text: "Ruin of everything, dangers, evil repute, the cause and place of death, servants, outhouses, chronic diseases and obstructions.",
  },
  {
    house: 9,
    stanza: "11",
    text: "Luck or fortune, righteousness, kindness, merit, spirituality, the father, grandchildren, charities, the spiritual quest, good conduct and preceptors.",
  },
  {
    house: 10,
    stanza: "12",
    text: "Places of worship, towns, council halls, wayside inns, servants, all actions, the power to command and service under others.",
  },
  {
    house: 11,
    stanza: "13",
    text: "The gain of everything desired, the elder brother, sons already born, the left ear and monetary gains.",
  },
  {
    house: 12,
    stanza: "14",
    text: "Sinful actions, expenses, breaks and falls, the left eye, loss of position or profession, and bodily injuries.",
  },
];

// "Karakas or Significators" (Chapter XIV, stanzas 31–32): the planets' significations, and how
// their strength makes those results appear or vanish.

export interface PrasnaKaraka {
  planet: Planet;
  stanza: string;
  text: string;
}

export const PRASNA_KARAKAS: PrasnaKaraka[] = [
  { planet: "Sun", stanza: "31", text: "The father and spiritual influence." },
  { planet: "Moon", stanza: "31", text: "The mother and the mind." },
  { planet: "Mars", stanza: "31", text: "Brothers, landed property and courage." },
  { planet: "Mercury", stanza: "31", text: "Speech and knowledge." },
  {
    planet: "Jupiter",
    stanza: "31",
    text: "Intelligence, children, wisdom and bodily health.",
  },
  {
    planet: "Venus",
    stanza: "31",
    text: "Vehicles, the wife and sense-pleasures.",
  },
  {
    planet: "Saturn",
    stanza: "31",
    text: "Death, diseases, sorrow, servants and followers.",
  },
];

export const PRASNA_KARAKA_RULE =
  "If the karakas are strong, the matters they signify are seen predominantly; if weak, only in name. Saturn is the reverse: strong, he lessens misery and disease; weak, he brings them in abundance (14.32).";

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Fructification of Bhavas" (Chapter XIV, stanzas 37–47): whether each house's promise ripens,
// from the house's lord and its karaka — their strength (strong = exalted, moolatrikona, own or
// friendly; weak = debilitated or inimical) and their position counted from the lagna (favourable
// = kendras, trines and the 11th; unfavourable = the 6th, 8th and 12th). The karaka for each house
// is this app's mapping of the planet karakas (14.31) onto the house significations (14.3–14); the
// text does not state it house by house, so that mapping is provisional.

const PRASNA_BHAVA_KARAKA: Planet[] = [
  "Sun", // 1st: body, self
  "Jupiter", // 2nd: family, wealth
  "Mars", // 3rd: brothers, courage
  "Moon", // 4th: mother, home
  "Jupiter", // 5th: children, intellect
  "Saturn", // 6th: disease, enemies
  "Venus", // 7th: spouse
  "Saturn", // 8th: death, chronic disease
  "Sun", // 9th: father, fortune, spirituality
  "Mercury", // 10th: actions, profession
  "Jupiter", // 11th: gains
  "Saturn", // 12th: loss, expenses
];

export type PrasnaBhavaVerdict =
  | "full"
  | "seen-not-enjoyed"
  | "little"
  | "mixed"
  | "negative";

export interface PrasnaBhavaFructification {
  house: number;
  lord: Planet;
  karaka: Planet;
  lordStrong: boolean | null;
  karakaStrong: boolean | null;
  lordFavourable: boolean | null;
  karakaFavourable: boolean | null;
  verdict: PrasnaBhavaVerdict;
  note: string;
  source: string;
}

// Strength for the fructification rule (14.39-41). The text names debilitation as the weakness and
// own/exaltation/friendly as strength; "Neutral" and "Inimical" are not named, so a planet is read
// as strong unless it is clearly weak (debilitated or in an inimical sign). A binary keeps a
// "Neutral" dignity from mass-producing "mixed".
const PRASNA_WEAK = new Set(["Debilitated", "Inimical"]);

const posClass = (house: number): boolean | null =>
  [1, 4, 5, 7, 9, 10, 11].includes(house)
    ? true
    : [6, 8, 12].includes(house)
      ? false
      : null; // 2nd and 3rd are neither

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Issues According to Birth Horoscope" (Chapter XIX): progeny read from the natal chart. The
// core is the Beeja Sphuta (male) and Kshetra Sphuta (female), each the sum of three longitudes
// (19.11), strong when the sum falls in the right sign and navamsa (19.6-7). The benefic aspect
// modifier and the Santana Trisphuta checks (19.18-21) are not yet entered.

export type PrasnaSphutaKind = "beeja" | "kshetra";
export type PrasnaSphutaVerdict = "strong" | "remedy" | "weak";

export interface PrasnaSphuta {
  kind: PrasnaSphutaKind;
  longitude: number;
  signIndex: number;
  navamsaIndex: number; // 0..8 (navamsa 1..9)
  parityOk: boolean;
  beneficSupport: boolean;
  maleficAffliction: boolean;
  verdict: PrasnaSphutaVerdict;
  note: string;
  source: string;
}

/** Graha drishti onto the sphuta's sign (BPHS 26.2-5, the app's aspect). */
const aspectsSphuta = (p: PlanetPosition, targetSign: number): boolean =>
  drishtiQuarters(p.planet, p.signIndex, targetSign) > 0;

const SPHUTA_NOTE: Record<PrasnaSphutaVerdict, string> = {
  strong: "In the required sign and navamsa and supported by benefics — strong.",
  remedy:
    "Partially strong — children come after remedial measures (19.14).",
  weak: "Not in the required sign and navamsa and without benefic support — children come with difficulty.",
};

/** A planet's sphuta contribution: the expired portion of its nakshatra in ghatis (4.5 per degree),
 * divided by 5 and read as signs — i.e. the expired portion in degrees × 27 (19.5, with Raman's
 * example). This is the primary method; the simple longitude sum of 19.11 is an alternative view. */
export function sphutaPlanetLon(planetLon: number): number {
  const NAK = 360 / 27;
  const expired = ((planetLon % NAK) + NAK) % NAK;
  return (((expired * 27) % 360) + 360) % 360;
}

/** Read the progeny sphuta for a chart: Beeja for a male, Kshetra for a female (19.9). */
export function computeProgeny(
  positions: PlanetPosition[],
  gender: "male" | "female" | "unspecified",
): PrasnaSphuta {
  const lon = (p: string) => positions.find((x) => x.planet === p)!.lon;
  const kind: PrasnaSphutaKind = gender === "female" ? "kshetra" : "beeja";
  const sum =
    kind === "kshetra"
      ? sphutaPlanetLon(lon("Moon")) + sphutaPlanetLon(lon("Mars")) + sphutaPlanetLon(lon("Jupiter"))
      : sphutaPlanetLon(lon("Sun")) + sphutaPlanetLon(lon("Venus")) + sphutaPlanetLon(lon("Jupiter"));
  const longitude = ((sum % 360) + 360) % 360;
  const signIndex = Math.floor(longitude / 30);
  const navamsaIndex = Math.floor((longitude - signIndex * 30) / (30 / 9));
  // Aries is the 1st (odd) sign; navamsa 1 is odd. Beeja wants odd/odd, Kshetra wants even/even.
  const oddSign = signIndex % 2 === 0;
  const oddNavamsa = navamsaIndex % 2 === 0;
  const parityOk =
    kind === "beeja" ? oddSign && oddNavamsa : !oddSign && !oddNavamsa;

  // Support and affliction: a benefic or malefic that joins (same sign) or aspects the sphuta.
  const beneficSupport = positions.some(
    (p) =>
      naturalBenefic(p, positions) &&
      (p.signIndex === signIndex || aspectsSphuta(p, signIndex)),
  );
  const maleficAffliction = positions.some(
    (p) =>
      !naturalBenefic(p, positions) &&
      (p.signIndex === signIndex || aspectsSphuta(p, signIndex)),
  );

  const verdict: PrasnaSphutaVerdict =
    parityOk && beneficSupport && !maleficAffliction
      ? "strong"
      : parityOk || beneficSupport
        ? "remedy"
        : "weak";

  return {
    kind,
    longitude,
    signIndex,
    navamsaIndex,
    parityOk,
    beneficSupport,
    maleficAffliction,
    verdict,
    note: SPHUTA_NOTE[verdict],
    source: "Prasna Marga 19.6-7, 19.11, 19.14",
  };
}

// The second progeny method (19.17-19): Santana Graha Sphuta. Each of the Sun, Moon and Jupiter
// is multiplied by 5 and summed, and the result is the Santana Trisphuta. If it falls in the 3rd,
// 5th or 7th asterism from the birth star, or in the 6th, 8th or 12th house from the ascendant, the
// text reads "no issue". The 88th/108th-quarter check from the radical Moon is not yet entered.

export interface PrasnaSantanaTrisphuta {
  trisphuta: number;
  nakshatraIndex: number;
  signIndex: number;
  fromBirthStar: number; // 0..26 offset from the birth nakshatra
  inBadStar: boolean;
  inBadHouse: boolean;
  afflicted: boolean;
  note: string;
  source: string;
}

export function computeSantanaTrisphuta(
  positions: PlanetPosition[],
  lagnaIdx: number,
): PrasnaSantanaTrisphuta {
  const lon = (p: string) => positions.find((x) => x.planet === p)!.lon;
  const moonLon = lon("Moon");
  const trisphuta = (((5 * (lon("Sun") + lon("Moon") + lon("Jupiter"))) % 360) + 360) % 360;
  const NAK = 360 / 27;
  const nakshatraIndex = Math.floor(trisphuta / NAK);
  const birthNak = Math.floor(((moonLon % 360) + 360) % 360 / NAK);
  const fromBirthStar = (nakshatraIndex - birthNak + 27) % 27;
  const inBadStar = [2, 4, 6].includes(fromBirthStar); // 3rd, 5th, 7th asterism
  const signIndex = Math.floor(trisphuta / 30);
  const inBadHouse = [6, 8, 12].includes(houseFrom(lagnaIdx, signIndex));
  const afflicted = inBadStar || inBadHouse;
  const parts: string[] = [];
  if (inBadStar) parts.push(`the ${ord(fromBirthStar + 1)} asterism from the birth star`);
  if (inBadHouse) parts.push(`the ${ord(houseFrom(lagnaIdx, signIndex))} house from the ascendant`);
  return {
    trisphuta,
    nakshatraIndex,
    signIndex,
    fromBirthStar,
    inBadStar,
    inBadHouse,
    afflicted,
    note: afflicted
      ? `Santana Trisphuta falls in ${parts.join(" and ")} — the text reads this as no issue, or issue only after remedies (19.18).`
      : "Santana Trisphuta is clear of the afflicting stars and houses.",
    source: "Prasna Marga 19.18",
  };
}

const ord = (n: number): string =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Effects of Transits" (Chapter XXII): each planet's effect as it transits the twelve houses from
// the natal Moon (Janma Rasi), condensed from Varahamihira's Brihat Samhita (22.1-24). The nodes
// are not given; the sign-portion timing (22.26) and propitiation (22.25, 27) are noted separately.

export const PRASNA_TRANSIT_EFFECTS: Partial<Record<Planet, string[]>> = {
  Sun: [
    "Fatigue, loss of good name and position, painful work and disease.",
    "Loss of money, disease in the eye and deception from others.",
    "Elevation to a new position, ruin to enemies, increase of wealth and good health.",
    "Obstacles in enjoying the wife's company and disease of the stomach.",
    "Affliction from enemies and disease.",
    "Recovery from illness, fall of enemies and pacification of mental grief.",
    "Fatigue from journeys, helplessness and disease of the stomach.",
    "Repulsion from women, fear from rulers and disease.",
    "Calamities of all sorts, privation, severe disease and a break in the profession.",
    "Success in all undertakings and victory in all quarters.",
    "Promotion to an elevated position, prosperity, recovery from disease and a tendency to good actions.",
    "The native cannot reap the fruits of good actions.",
  ],
  Moon: [
    "Wholesome food, bed comfort and the gain of valuable things.",
    "Obstacles to good actions, loss of fame and money.",
    "Enjoyment with women, comfort from good clothes and fresh wealth.",
    "Fear from others.",
    "Troubles of all sorts and obstruction to journeys.",
    "Gain of wealth, happiness, peace with enemies and pacification of disease.",
    "Wholesome food, presents, gain of money, comfortable sleep and enjoyment of women.",
    "Trouble from fire.",
    "Disease of the stomach and fear of imprisonment.",
    "Benefits from the government.",
    "Visits from relatives and increase of wealth.",
    "Loss of money and obstacles to all work.",
  ],
  Mars: [
    "Obstacles to all undertakings.",
    "Fear from rulers, trouble from thieves and fire, sorrow from enemies and ailments from grief.",
    "Gain of valuable metals, the favour of Subrahmanya and easy destruction of enemies.",
    "Association with bad men, disease of the stomach, high fever and unconscious flow of seminal fluid.",
    "Troubles from foes, sorrow over children and dread of disease.",
    "Gain of metals such as copper and gold, fear from quarrels and misunderstandings, and fresh breaks with enemies.",
    "Misunderstanding with the wife and disease of the stomach and eyes.",
    "Blood pressure from severe blows, broken limbs, fear of dishonour and depression.",
    "Loss of money, disease and defeat.",
    "Profits in all ways.",
    "Elevation to the headship of a village and general happiness.",
    "Troubles of all sorts, waste of money, disease from heat, blood pressure and disease of the eye.",
  ],
  Mercury: [
    "Quarrels with relations, loss of money by libel or unlawful words and writings, and journeys to distant places.",
    "Fresh wealth and influence, and general prosperity.",
    "Fear from enemies and the anger of rulers.",
    "Gain of money, prosperity of relatives and progress of the family.",
    "Quarrels with wife and children.",
    "Success in all things, general luck and rapid promotion.",
    "Quarrels.",
    "Victory, happiness from children, gain of clothes, increase of income, peace and learning.",
    "Disease of all kinds.",
    "Destruction of enemies, gain of money and happiness from women.",
    "Good speech, fresh gains, happiness, success in everything, and closer association with wife and children.",
    "Troubles from foes and disease.",
  ],
  Jupiter: [
    "Loss of money, demotion, quarrels and mental dejection.",
    "Gain of wealth, ruin to foes and happiness with women.",
    "Some change in profession and obstacles to all actions.",
    "Sorrow from relatives and want of peace.",
    "Acquisition of vehicles, ornaments and children, happiness from women, clothes and houses.",
    "Unhappiness though one has everything to be comfortable.",
    "Cleverness in speech, sharpness of intellect, accomplishment of actions, gain of money and happiness in enjoyment.",
    "Unbearable grief, disease, loss of liberty, over-exertion and fatigue.",
    "Profits, happiness with wife and children, acquisition of authority and success in all actions.",
    "Loss of position, profession or wealth, and fruitlessness of all actions.",
    "Favours, success in all actions and elevation to a distinguished station.",
    "Fatigue from long walks and severe miseries.",
  ],
  Venus: [
    "Wholesome food, enjoyment with the wife, perfumed articles, fresh bedding, valuable clothes and happiness.",
    "Wealth and grains, ornaments and flowers, the favour of rulers and family happiness.",
    "Respect for one's opinions, profits, honours, clothes and the destruction of enemies.",
    "Happy reconciliation with relatives and great prosperity.",
    "Gain of money, birth of children, help from relatives and the satisfaction of elders.",
    "Troubles from enemies and disease.",
    "Trouble and danger from women.",
    "Happiness from women and household utensils and ornaments.",
    "Gain of wealth, fruition of charitable actions and happiness with women.",
    "Rivalry, quarrels and dishonour.",
    "Enjoyment of good food, perfumed articles and favour from relatives.",
    "Gain of wealth in many ways, and clothes and ornaments.",
  ],
  Saturn: [
    "Fear from poison and fire, loss of relatives and friends, exile, quarrels with relatives, monetary misunderstanding and distant journeys.",
    "Loss of wealth, happiness and health, and decrease of desires.",
    "Gain of elephants and buffaloes, good health and success in all actions.",
    "A cloud on the mind, separation from wife and wealth, and quarrels with all.",
    "Sorrow from the death of children.",
    "Pacification of enemies and disease.",
    "Intimacy with female servants and distant journeys.",
    "Misunderstanding with one's own people and extreme helplessness.",
    "Enmity with all, imprisonment or bondage, obstruction to charity and heart trouble.",
    "Loss of fame, wealth and education, yet success in one's actions.",
    "Intimacy with other women, huge profits, and increase of honour and authority.",
    "A succession of intermittent griefs and overwhelming calamities.",
  ],
};

export type PrasnaTransitTone = "good" | "hard" | "neutral";

export interface PrasnaTransit {
  planet: Planet;
  house: number; // from the natal Moon
  text: string;
  tone: PrasnaTransitTone;
}

/** The seven planets' transit effects read from the natal Moon, per Prasna Marga 22.1-24. */
export function computePrasnaTransits(
  moonSignIndex: number,
  positions: PlanetPosition[],
  withhold = false,
): PrasnaTransit[] {
  return positions
    .filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu")
    .map((p) => {
      const house = houseFrom(moonSignIndex, p.signIndex);
      // The sensitive-content gate (shared/life-stage.ts) strips child-loss and death statements
      // for a minor, matching the Overview's own Saturn transit.
      const text = withhold
        ? redactProse(PRASNA_TRANSIT_EFFECTS[p.planet]?.[house - 1] ?? "")
        : PRASNA_TRANSIT_EFFECTS[p.planet]?.[house - 1] ?? "";
      const t = toneOfText(text);
      return {
        planet: p.planet,
        house,
        text,
        tone: t === "good" ? "good" : t === "hard" ? "hard" : "neutral",
      };
    });
}

export const PRASNA_TRANSIT_NOTES = [
  "Effects of Transits, Prasna Marga Chapter XXII, condensed from Varahamihira's Brihat Samhita (22.1). Counted from the natal Moon.",
  "The Sun and Mars give their effects at the beginning of the sign; Jupiter and Venus in the middle; the Moon and Saturn in the last part; Mercury throughout (22.26).",
  "Unfavourable planets aspected by benefics are not fully evil, and favourable planets aspected by malefics do not give full good (22.26 notes).",
];

const FRUCTIFICATION_NOTE: Record<PrasnaBhavaVerdict, string> = {
  full: "Lord and karaka both strong, in favourable places: the house's promise is fully experienced.",
  "seen-not-enjoyed":
    "Strong, but in an unfavourable place: the promise exists, yet the native does not enjoy it.",
  little:
    "Weak, but favourably placed: the promise is experienced, however little.",
  mixed: "One of the lord and karaka is strong, the other weak: the influence is mixed.",
  negative:
    "Lord and karaka both weak, in unfavourable places: the house's results turn negative.",
};

/** Read "Fructification of Bhavas" for a chart: one verdict per house, from its lord and karaka. */
export function computePrasnaFructification(
  positions: PlanetPosition[],
  strength: PlanetStrength[],
  lagnaIdx: number,
): PrasnaBhavaFructification[] {
  const byStrength = new Map(strength.map((s) => [s.planet, s]));
  const posOf = (p: Planet) => positions.find((x) => x.planet === p)!;
  const out: PrasnaBhavaFructification[] = [];
  for (let house = 1; house <= 12; house++) {
    const signIdx = (lagnaIdx + house - 1) % 12;
    const lord = SIGN_LORD[signIdx];
    const karaka = PRASNA_BHAVA_KARAKA[house - 1];

    const ls = byStrength.get(lord);
    const ks = byStrength.get(karaka);
    const lordStrong = ls ? !PRASNA_WEAK.has(ls.effectiveDignity) : null;
    const karakaStrong = ks ? !PRASNA_WEAK.has(ks.effectiveDignity) : null;

    const lordFavourable = posClass(houseFrom(lagnaIdx, posOf(lord).signIndex));
    const karakaFavourable = posClass(
      houseFrom(lagnaIdx, posOf(karaka).signIndex),
    );

    let verdict: PrasnaBhavaVerdict;
    if (lordStrong === true && karakaStrong === true) {
      verdict =
        lordFavourable === true && karakaFavourable === true
          ? "full"
          : "seen-not-enjoyed";
    } else if (lordStrong === false && karakaStrong === false) {
      verdict =
        lordFavourable === false && karakaFavourable === false
          ? "negative"
          : "little";
    } else {
      verdict = "mixed";
    }

    out.push({
      house,
      lord,
      karaka,
      lordStrong,
      karakaStrong,
      lordFavourable,
      karakaFavourable,
      verdict,
      note: FRUCTIFICATION_NOTE[verdict],
      source: "Prasna Marga 14.39-41",
    });
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Effects of Gulika" (Chapter XIV, stanzas 66–70): Gulika (Mandi), the upagraha, read by the house
// it occupies from the ascendant. Its position is the ascendant at Saturn's portion of the day or
// night, computed server-side (provisional; conventions differ on Saturn's vs the eighth portion).

export const PRASNA_GULIKA_EFFECTS: string[] = [
  "A sickly body, suffering from sores and ailments.",
  "Untidy in dress, generally using abusive language.",
  "Hates brothers, but is valorous.",
  "Generally unhappy, and fear from enemies.",
  "No respect for elders and preceptors, and deprived of issues.",
  "A tendency to find fault with relatives.",
  "Affliction to the wife, and a strong sex instinct.",
  "Short life, chronic complaints, sharp intelligence, and death from poison, weapon or fire.",
  "Irreligious and uncharitable.",
  "Unsullied fame and an inclination for social work.",
  "Greatness, prosperity, courage, wealth, attendants and servants.",
  "Hideous dreams, diseases of the nails, and loss of limbs.",
];

export interface PrasnaGulikaReading {
  signIndex: number;
  house: number;
  text: string;
  source: string;
}

/** Read Gulika for a chart: which house it occupies and what the text says of it (14.67-70). */
export function computeGulikaReading(
  gulika: { signIndex: number; day: boolean },
  lagnaIdx: number,
): PrasnaGulikaReading {
  const house = houseFrom(lagnaIdx, gulika.signIndex);
  return {
    signIndex: gulika.signIndex,
    house,
    text: PRASNA_GULIKA_EFFECTS[house - 1],
    source: "Prasna Marga 14.67-70",
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Marriage Compatibility" (Chapter XXI): the Rasi agreement — the groom's Moon counted from the
// bride's Moon, and what each relative position promises (21.4-16).

export type RasiVerdict = "good" | "moderate" | "bad";

export interface RasiAgreement {
  house: number; // the groom's Moon sign counted from the bride's
  verdict: RasiVerdict;
  note: string;
  source: string;
}

const RASI_AGREEMENT: { verdict: RasiVerdict; note: string }[] = [
  { verdict: "good", note: "The same Janma Rasi: good, provided the nakshatra differs (21.4, 21.16)." },
  { verdict: "bad", note: "Loss of money and poverty (21.6, 21.10)." },
  { verdict: "moderate", note: "Sorrow (21.6)." },
  { verdict: "moderate", note: "Quarrels and misunderstandings; passable if other factors agree (21.6, 21.14)." },
  { verdict: "bad", note: "Loss of children (21.6, 21.10)." },
  { verdict: "bad", note: "Disease, danger and separation; allowed only in special cases (21.5-7, 21.10)." },
  { verdict: "good", note: "The couple love each other dearly (21.16)." },
  { verdict: "bad", note: "Losses and ruin, unless the lords are the same or friendly (21.7); allowed only in special cases (21.5)." },
  { verdict: "good", note: "Prosperity, happiness and wealth (21.10)." },
  { verdict: "good", note: "Prosperity, happiness and wealth (21.10)." },
  { verdict: "good", note: "Prosperity, happiness and wealth (21.10)." },
  { verdict: "bad", note: "Poverty (21.10)." },
];

/** Rasi agreement: the groom's Moon sign counted from the bride's (21.1-16). */
export function rasiAgreement(
  maleMoonSign: number,
  femaleMoonSign: number,
): RasiAgreement {
  const house = houseFrom(femaleMoonSign, maleMoonSign);
  const r = RASI_AGREEMENT[house - 1];
  return {
    house,
    verdict: r.verdict,
    note: r.note,
    source: "Prasna Marga 21.4-16",
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// The sphutas (Ch. V, stanzas 17–19): derived points astrologers read by sign and nakshatra. The
// six here are simple sums of the lagna, Moon, Sun, Rahu and Gulika longitudes, with the author's
// own worked example (Sun 301°12', Moon 18°29', Lagna 43°9', Gulika 64°26', Rahu 6°9').
// The Beeja, Kshetra and Santana Trisphuta of Ch. XIX are separate (progeny).

export interface PrasnaSphutas {
  thrisphuta: number; // Lagna + Moon + Gulika
  chatusphuta: number; // Thrisphuta + Sun
  panchasphuta: number; // Chatusphuta + Rahu
  pranasphuta: number; // Lagna × 5 + Gulika
  dehasphuta: number; // Moon × 8 + Gulika
  mrityusphuta: number; // Gulika × 7 + Sun
}

export function computeSphutas(
  lagnaLon: number,
  moonLon: number,
  sunLon: number,
  rahuLon: number,
  gulikaLon: number,
): PrasnaSphutas {
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const thrisphuta = norm(lagnaLon + moonLon + gulikaLon);
  const chatusphuta = norm(thrisphuta + sunLon);
  const panchasphuta = norm(chatusphuta + rahuLon);
  return {
    thrisphuta,
    chatusphuta,
    panchasphuta,
    pranasphuta: norm(lagnaLon * 5 + gulikaLon),
    dehasphuta: norm(moonLon * 8 + gulikaLon),
    mrityusphuta: norm(gulikaLon * 7 + sunLon),
  };
}

export const PRASNA_SPHUTA_NOTE =
  "The six sphutas of Ch. V (17-19): derived points read by sign and nakshatra. The Ch. XIX progeny sphutas (Beeja, Kshetra, Santana Trisphuta) are shown under Progeny. Not applied: the alternative Pranasphuta by prasna-ghatis (20-22), the Mrityu/Kalasphuta by weekday (23), the Kundagata Sphuta of lagna rectification (8-9), and the obsolete Parahita-to-Drik Moon correction (10-13).";

// ───────────────────────────────────────────────────────────────────────────────────────────────
// Time-based sphutas (Ch. V, stanzas 20–23): the alternative Pranasphuta by prasna-ghatis, and the
// Mrityu/Kalasphuta by weekday. Both use the time of the query in ghatis (1 ghati = 24 minutes,
// counted from sunrise by day or sunset by night) and the day's duration in ghatis.

export interface TimeSphutas {
  pranasphutaAlt: number; // 5.20-22: X = quotient + Sun, then ±4 signs by the Sun's sign
  mrityusphutaAlt: number; // 5.23: Y + the weekday offset
  kalasphuta: number; // 5.23: Y - the weekday offset
}

const WEEKDAY_OFFSET_DEG: number[] = [30, 300, 75, 155, 120, 210, 255]; // Sun..Sat

export function timeSphutasFromGhatis(
  prasnaGhatis: number,
  dayLengthGhatis: number,
  sunLon: number,
  weekday: number, // 0 = Sunday .. 6 = Saturday
): TimeSphutas {
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const quotient = norm((prasnaGhatis * 3600) / dayLengthGhatis);
  const X = norm(quotient + sunLon);
  const sunSign = Math.floor(norm(sunLon) / 30);
  const fixed = [1, 4, 7, 10].includes(sunSign);
  const movable = [0, 3, 6, 9].includes(sunSign);
  const adj = fixed ? -120 : movable ? 0 : 120; // common sign: +4 signs
  const Y = norm((prasnaGhatis * 1050) / dayLengthGhatis);
  const off = WEEKDAY_OFFSET_DEG[weekday] ?? 0;
  return {
    pranasphutaAlt: norm(X + adj),
    mrityusphutaAlt: norm(Y + off),
    kalasphuta: norm(Y - off),
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Effects of Arudha" (Ch. VIII, stanzas 1-6): the prasna is read from six rasis (Arudha, Lagna,
// Navamsa Lagna, Chatra, Sprishtanga, Jaama). Sprishtanga (the organ touched) and Jaama are not
// available to the app; Arudha, Lagna and Chatra are. The organ each sign governs follows
// Varahamihira (8.1 note); an afflicted Arudha or Lagna points disease at that organ (8.3).

export const PRASNA_BODY_PARTS: string[] = [
  "the head", "the face", "the chest", "the heart", "the belly", "the waist",
  "the abdomen", "the sex organs", "the thighs", "the knees", "the buttocks", "the feet",
];

/** Chatra Rasi (8.1 note): count from the Arudha to the Lagna, then mark the same from the
 * Veethi Rasi, which the Sun's sign fixes (Taurus/Gemini/Cancer/Leo → Aries; Scorpio/Sagittarius/
 * Capricorn/Aquarius → Gemini; Virgo/Libra/Pisces/Aries → Taurus). */
export function computeChatraRasi(
  sunSign: number,
  arudhaIdx: number,
  lagnaIdx: number,
): number {
  const veethi = [1, 2, 3, 4].includes(sunSign) ? 0 : [7, 8, 9, 10].includes(sunSign) ? 2 : 1;
  const count = houseFrom(arudhaIdx, lagnaIdx); // 1..12, inclusive
  return (veethi + count - 1) % 12;
}

export type ArudhaVerdict = "fortunate" | "danger" | "mixed";

export interface PrasnaArudhaReading {
  arudhaPart: string;
  lagnaPart: string;
  arudhaAfflicted: boolean;
  lagnaAfflicted: boolean;
  chatraSign: number;
  verdict: ArudhaVerdict;
  note: string;
  source: string;
}

/** Read the Arudha for a query (8.1-6): the organs at risk, the Chatra Rasi, and the fortune or
 * danger verdict from the lords' strength (8.6). The 6th/8th/9th/12th are counted from the Lagna. */
export function computeArudhaReading(
  positions: PlanetPosition[],
  sunSign: number,
  arudhaIdx: number,
  lagnaIdx: number,
): PrasnaArudhaReading {
  const maleficIn = (signIdx: number) =>
    positions.some((p) => p.signIndex === signIdx && !naturalBenefic(p, positions));
  const arudhaAfflicted = maleficIn(arudhaIdx);
  const lagnaAfflicted = maleficIn(lagnaIdx);

  const lordStrong = (signIdx: number): boolean | null => {
    const p = positions.find((x) => x.planet === SIGN_LORD[signIdx]);
    return p ? !PRASNA_WEAK.has(p.dignity) : null;
  };
  const arudhaLord = lordStrong(arudhaIdx);
  const eighth = lordStrong((lagnaIdx + 7) % 12);
  const ninth = lordStrong((lagnaIdx + 8) % 12);
  const sixth = lordStrong((lagnaIdx + 5) % 12);
  const twelfth = lordStrong((lagnaIdx + 11) % 12);

  const danger = arudhaLord === false && eighth === true;
  const fortune =
    arudhaLord === true &&
    ninth === true &&
    sixth === false &&
    eighth === false &&
    twelfth === false;
  const verdict: ArudhaVerdict = danger ? "danger" : fortune ? "fortunate" : "mixed";

  const notes: string[] = [];
  if (arudhaAfflicted || lagnaAfflicted) {
    const seats = [
      arudhaAfflicted ? PRASNA_BODY_PARTS[arudhaIdx] : null,
      lagnaAfflicted ? PRASNA_BODY_PARTS[lagnaIdx] : null,
    ].filter(Boolean);
    notes.push(`an afflicted ${seats.length === 1 ? seats[0] : "seat of " + seats.join(" and ")} points disease or a wound there (8.3)`);
  }
  notes.push(
    verdict === "fortunate"
      ? "the lords of the Arudha and 9th are strong and the 6th, 8th and 12th are weak — an influx of fortune (8.6)"
      : verdict === "danger"
        ? "the lord of the Arudha is weak and the lord of the 8th is strong — beset on all sides by danger (8.6)"
        : "the Arudha lords do not clearly show fortune or danger (8.6)",
  );

  return {
    arudhaPart: PRASNA_BODY_PARTS[arudhaIdx],
    lagnaPart: PRASNA_BODY_PARTS[lagnaIdx],
    arudhaAfflicted,
    lagnaAfflicted,
    chatraSign: computeChatraRasi(sunSign, arudhaIdx, lagnaIdx),
    verdict,
    note: notes.join(" · "),
    source: "Prasna Marga 8.1-6",
  };
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// The cowrie-division Arudha (Ch. IV, stanzas 38, 51-55): the astrologer works with a lot of 108
// cowries. A handful is taken and divided by twelve, and the remainder names the Arudha sign
// (1 = Aries … 11 = Aquarius, 0 = Pisces). The text's canonical Arudha is the gold piece placed by
// an innocent person (4.51-53); the cowrie division by eight yields the Ashtamangala number
// (4.54-55). This helper simulates the handful-and-remainder practice many astrologers use.

export const PRASNA_COWRIES = 108;

/** A handful of cowries divided by twelve, read as the Arudha sign (0 = Aries … 11 = Pisces). */
export function arudhaFromHandful(handful: number): number {
  const remainder = ((handful % 12) + 12) % 12;
  return remainder === 0 ? 11 : remainder - 1;
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// The Ashtamangala Number (Ch. IV, stanzas 54-55): the cowries are divided into three groups
// (left, front, right); each is counted and multiples of eight are expunged, the remainders forming
// the hundreds, tens and units of a three-digit number. The text keeps the remainder of ÷8, so each
// digit is 0-7; some practitioners read a zero remainder as 8.

export interface Ashtamangala {
  digits: [number, number, number]; // left (hundreds), front (tens), right (units)
  number: number;
}

export function ashtamangalaFromGroups(
  left: number,
  front: number,
  right: number,
): Ashtamangala {
  const digits: [number, number, number] = [left % 8, front % 8, right % 8];
  return { digits, number: digits[0] * 100 + digits[1] * 10 + digits[2] };
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// The five tertiary planets or "doshas" (Ch. XIV, stanzas 72-79): Dhuma, Vyatipata, Parivesha,
// Indrachapa and Upaketu. Their longitudes derive from the Sun (14.72); each is read by the house
// it occupies from the lagna, in prasna and in the birth chart alike. Upaketu is the text's
// "Kethu", different from the Moon's descending node; the name is used to avoid the clash.

export type TertiaryPlanet = "Dhuma" | "Vyatipata" | "Parivesha" | "Indrachapa" | "Upaketu";

export const PRASNA_TERTIARY_EFFECTS: Record<TertiaryPlanet, string[]> = {
  Dhuma: [
    "A fall into a well.",
    "Indistinct speech.",
    "A brother becomes lame.",
    "The maternal uncle becomes the guardian of temple property.",
    "Irritable.",
    "Injury from wild tigers.",
    "Excommunication.",
    "Injury by weapons.",
    "An atheist.",
    "Death by lightning.",
    "Acquisition of new residences.",
    "Going away from home.",
  ],
  Vyatipata: [
    "Skin diseases.",
    "Eloquence.",
    "Musical talents.",
    "Owns horses.",
    "Affliction to children.",
    "Quarrels in the family.",
    "Poverty.",
    "Learned in the fine arts.",
    "Unlucky.",
    "Danger from burns or fire.",
    "Favoured by rulers.",
    "A fallen person.",
  ],
  Parivesha: [
    "Death from serpents.",
    "Acquisition of treasures.",
    "An unsound mind.",
    "Will not live in his own house.",
    "Incarceration.",
    "Becomes a thief.",
    "Loses one eye.",
    "Danger from weapons.",
    "Disrespectful towards elders.",
    "Generous.",
    "Poor in speech.",
    "Affected by chronic diseases.",
  ],
  Indrachapa: [
    "Rheumatism.",
    "Deafness.",
    "Inclination to harm Brahmins.",
    "Squandering public wealth.",
    "A magician and a coward.",
    "Fear from foes.",
    "Deformed limbs.",
    "A wanderer in quest of impossible things.",
    "Death through a son, or incarceration.",
    "Shabby dress and quick eating.",
    "Valiant, and a good hunter.",
    "Leaving the native place through the government's disfavour.",
  ],
  Upaketu: [
    "Bald-headed.",
    "Physical debility, and speech through the nose.",
    "Highly sensitive, speaking through the nose.",
    "Fond of perfumes and scents.",
    "Soola disease — for a woman, birth of twins.",
    "Sand-blind, and death through kapha diseases in a stranger's house.",
    "Death while thieving.",
    "Death by poison.",
    "Performs wonderful deeds, and dies in the end.",
    "Death by a fall.",
    "Gains treasure and mines.",
    "Sleepless, squandering money, and meeting calamities.",
  ],
};

export interface TertiaryPosition {
  name: TertiaryPlanet;
  lon: number;
  signIndex: number;
}

/** The five longitudes from the Sun (14.72): Dhuma = Sun + 133°, then each from the last. */
export function computeTertiaryPlanets(sunLon: number): TertiaryPosition[] {
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const dhuma = norm(sunLon + 133);
  const vyatipata = norm(360 - dhuma);
  const parivesha = norm(180 + vyatipata);
  const indrachapa = norm(360 - parivesha);
  const upaketu = norm(indrachapa + 17);
  return [
    { name: "Dhuma", lon: dhuma, signIndex: Math.floor(dhuma / 30) },
    { name: "Vyatipata", lon: vyatipata, signIndex: Math.floor(vyatipata / 30) },
    { name: "Parivesha", lon: parivesha, signIndex: Math.floor(parivesha / 30) },
    { name: "Indrachapa", lon: indrachapa, signIndex: Math.floor(indrachapa / 30) },
    { name: "Upaketu", lon: upaketu, signIndex: Math.floor(upaketu / 30) },
  ];
}

export interface TertiaryReading {
  name: TertiaryPlanet;
  house: number;
  text: string;
  source: string;
}

/** Read the five tertiary planets by their house from the lagna (14.72-79). */
export function computeTertiaryReading(
  sunLon: number,
  lagnaIdx: number,
  withhold = false,
): TertiaryReading[] {
  return computeTertiaryPlanets(sunLon).map((t) => {
    const house = houseFrom(lagnaIdx, t.signIndex);
    const text = PRASNA_TERTIARY_EFFECTS[t.name][house - 1];
    return {
      name: t.name,
      house,
      text: withhold ? redactProse(text) : text,
      source: "Prasna Marga 14.72-79",
    };
  });
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// "Time when Bhavas Fructify" (Ch. XIV, stanzas 81-86). The period a bhava's promise takes to
// materialise is the time allotted to its lord (Brihat Jataka's Ayana, Kshana, Vasara, Ritu, Masa,
// Ardha, Sama) times the navamsas the lord has gained (14.81-82); a sorrow reads the lagna lord's
// time times the signs to the malefic (14.83); and a bhava read whole-sign gives its lord's signs
// away as months in the invisible half, days in the visible (14.85).

export const PRASNA_TIME_PERIODS: Partial<
  Record<Planet, { classical: string; label: string; months: number }>
> = {
  Sun: { classical: "Ayana", label: "six months", months: 6 },
  Moon: { classical: "Kshana", label: "48 minutes", months: 48 / 43200 },
  Mars: { classical: "Vasara", label: "one day", months: 1 / 30 },
  Mercury: { classical: "Ritu", label: "two months", months: 2 },
  Jupiter: { classical: "Masa", label: "one month", months: 1 },
  Venus: { classical: "Ardha", label: "a fortnight", months: 0.5 },
  Saturn: { classical: "Sama", label: "one year", months: 12 },
};

const fmtMonths = (m: number): string => {
  if (m >= 36) return `${(m / 12).toFixed(1).replace(/\.0$/, "")} years`;
  if (m >= 1) return `${Math.round(m)} month${Math.round(m) === 1 ? "" : "s"}`;
  return `${Math.max(1, Math.round(m * 30))} day${Math.round(m * 30) === 1 ? "" : "s"}`;
};

const navamsaNumber = (lon: number) => Math.floor((((lon % 30) + 30) % 30) / (30 / 9)) + 1;
const navamsaSign = (lon: number) => {
  const sign = Math.floor((((lon % 360) + 360) % 360) / 30);
  return (sign * 9 + navamsaNumber(lon) - 1) % 12;
};

export interface FructificationTiming {
  periods: { planet: Planet; classical: string; label: string }[];
  lagnaNavamsa: { navamsaSign: number; lord: Planet; navamsas: number; text: string };
  sorrow: { lord: Planet; signs: number; text: string };
  houses: { house: number; lord: Planet; lordHouse: number; visible: boolean; signs: number; text: string }[];
  source: string;
}

export function computeFructificationTiming(
  positions: PlanetPosition[],
  lagnaLon: number,
  lagnaIdx: number,
): FructificationTiming {
  const lordOf = (signIdx: number) => SIGN_LORD[((signIdx % 12) + 12) % 12];
  const posOf = (p: Planet) => positions.find((x) => x.planet === p)!;

  const periods = Object.entries(PRASNA_TIME_PERIODS)
    .filter(([, v]) => v)
    .map(([planet, v]) => ({ planet: planet as Planet, classical: v!.classical, label: v!.label }));

  // 14.82: the lagna navamsa lord's time × the navamsas it has gained.
  const lnSign = navamsaSign(lagnaLon);
  const lnLord = lordOf(lnSign);
  const lnPos = posOf(lnLord);
  const lnNavamsas = navamsaNumber(lnPos.lon);
  const lnMonths = (PRASNA_TIME_PERIODS[lnLord]?.months ?? 0) * lnNavamsas;
  const lagnaNavamsa = {
    navamsaSign: lnSign,
    lord: lnLord,
    navamsas: lnNavamsas,
    text: `${lnLord}, lord of the rising navamsa, gives ${PRASNA_TIME_PERIODS[lnLord]?.label}; in its ${ord(lnNavamsas)} navamsa that is ${lnNavamsas} × ${PRASNA_TIME_PERIODS[lnLord]?.classical.toLowerCase()} = ${fmtMonths(lnMonths)} (14.82).`,
  };

  // 14.83: the lagna lord's time × the signs to the strongest malefic.
  const lagnaLord = lordOf(lagnaIdx);
  const malefics = positions.filter((p) => p.planet === "Mars" || p.planet === "Saturn" || p.planet === "Sun");
  const strongestMalefic = malefics.sort(
    (a, b) => (PRASNA_TIME_PERIODS[a.planet]?.months ?? 0) - (PRASNA_TIME_PERIODS[b.planet]?.months ?? 0),
  )[0];
  const maleficSigns = strongestMalefic ? houseFrom(lagnaIdx, strongestMalefic.signIndex) : 0;
  const sorrow = {
    lord: lagnaLord,
    signs: maleficSigns,
    text: strongestMalefic
      ? `${strongestMalefic.planet} in the ${ord(maleficSigns)} from the lagna: the lagna lord ${lagnaLord}'s time (${PRASNA_TIME_PERIODS[lagnaLord]?.label}) × ${maleficSigns} = ${fmtMonths((PRASNA_TIME_PERIODS[lagnaLord]?.months ?? 0) * maleficSigns)} of sorrow (14.83).`
      : "No malefic is present to time the sorrow (14.83).",
  };

  // 14.85: each bhava's lord, its house, and the signs between the bhava and the lord.
  const houses = Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
    const houseSign = (lagnaIdx + house - 1) % 12;
    const lord = lordOf(houseSign);
    const lordSign = posOf(lord).signIndex;
    const lordHouse = houseFrom(lagnaIdx, lordSign);
    const visible = lordHouse >= 7 && lordHouse <= 12;
    const signs = houseFrom(houseSign, lordSign);
    const unit = visible ? "days" : "months";
    return {
      house,
      lord,
      lordHouse,
      visible,
      signs,
      text: `${lord} in the ${ord(lordHouse)} (the ${visible ? "visible" : "invisible"} half): ${signs} ${unit} (14.85).`,
    };
  });

  return { periods, lagnaNavamsa, sorrow, houses, source: "Prasna Marga 14.81-85" };
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// Vedha and Vipareeta-vedha (Ch. XXII, stanzas 34-53): a planet transiting a favourable (Vedhya)
// position from the natal Moon has its good nullified when another planet occupies the Vedha
// (obstruction) sign; a planet in an unfavourable place, counter-afflicted from its own Vedha,
// does good instead (22.35, 22.53). The pairs follow 22.46-51, and the exempt pairs 22.52
// (Saturn does not vedha the Sun, nor the Sun Saturn; the Moon and Mercury are not mutually
// afflictive).

export const PRASNA_VEDHA: Partial<Record<Planet, Array<[number, number]>>> = {
  Sun: [[3, 9], [6, 12], [10, 4], [11, 5]],
  Moon: [[7, 2], [1, 5], [6, 12], [11, 8], [10, 9], [3, 4]],
  Mars: [[3, 12], [6, 9], [11, 5]],
  Mercury: [[2, 5], [4, 7], [6, 9], [8, 1], [10, 8], [11, 12]],
  Jupiter: [[2, 12], [5, 4], [9, 10], [7, 3], [11, 8]],
  Venus: [[2, 7], [3, 1], [4, 10], [5, 9], [8, 5], [9, 4], [11, 12], [12, 6]],
  Saturn: [[3, 12], [6, 9], [11, 5]],
  Rahu: [[3, 12], [6, 9], [11, 5]],
  Ketu: [[3, 12], [6, 9], [11, 5]],
};

const VEDHA_EXEMPT: Array<[Planet, Planet]> = [
  ["Sun", "Saturn"],
  ["Moon", "Mercury"],
];

export interface PrasnaVedhaAffliction {
  planet: Planet;
  house: number; // the Vedhya (favourable) house
  vedhaHouse: number; // the obstructing house
  obstructor: Planet;
}

/** Which transiting planets are Vedha-afflicted, from the natal Moon (22.34-53). */
export function computePrasnaVedha(
  positions: PlanetPosition[],
  moonSignIndex: number,
): PrasnaVedhaAffliction[] {
  const houseOf = (p: PlanetPosition) => houseFrom(moonSignIndex, p.signIndex);
  const exempt = (a: Planet, b: Planet) =>
    VEDHA_EXEMPT.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const out: PrasnaVedhaAffliction[] = [];
  for (const p of positions) {
    const table = PRASNA_VEDHA[p.planet];
    if (!table) continue;
    const h = houseOf(p);
    const entry = table.find(([vedhya]) => vedhya === h);
    if (!entry) continue;
    const vedhaHouse = entry[1];
    const obstructor = positions.find(
      (q) => q.planet !== p.planet && !exempt(p.planet, q.planet) && houseOf(q) === vedhaHouse,
    );
    if (obstructor) out.push({ planet: p.planet, house: h, vedhaHouse, obstructor: obstructor.planet });
  }
  return out;
}
