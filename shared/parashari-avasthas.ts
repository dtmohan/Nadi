// BPHS chapter 45 (avasthas of the planets), read from http://jyotishvidya.com/ch45.htm.
// Five schemes: Baladi by degree (45.3-4), Jagradadi by dignity (45.5-6), Deeptadi by
// dignity and company (45.7-10), Lajjitadi by house, company and aspect (45.11-29) and
// Sayanadi by the arithmetic of 45.30-39 with the effects of 45.40-155.
import { SIGNS, SIGN_LORD, ENEMIES, FRIENDS, EXALTATION, OWN_SIGNS, MOOLATRIKONA, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { compoundRelation, inMoolatrikona, SEVEN, type Seven, type ShadbalaBase, type ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";

const S = (verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara 45.${verse}`, url: BPHS_URL(45), provisional });
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
export const AVASTHA_CH = BPHS_URL(45);

export type Tone = ParashariFinding["tone"];
export const BALADI = ["Bala", "Kumara", "Yuva", "Vriddha", "Mrita"] as const;
export const BALADI_PLAIN = ["infant", "youthful", "adolescent", "old", "dead"] as const;
export const BALADI_RESULT = ["a quarter", "a half", "full", "negligible", "nil"] as const;
export const SAYANADI = ["Sayana", "Upavesana", "Netrapani", "Prakasa", "Gamana", "Agamana", "Sabha", "Agama", "Bhojana", "Nrityalipsa", "Kautuka", "Nidra"] as const;
export const SAYANADI_PLAIN = ["lying down", "sitting", "hand on the eye", "shining", "going", "returning", "in the assembly", "arriving", "eating", "wishing to dance", "delight", "sleep"] as const;

export interface PlanetAvasthas {
  planet: Planet;
  baladi: { name: (typeof BALADI)[number]; plain: string; result: string; band: number };
  jagradadi: { name: "Jagrat" | "Swapna" | "Sushupti"; plain: string; result: "full" | "medium" | "nil"; basis: string };
  deeptadi: { names: string[]; basis: string };
  lajjitadi: { name: string; why: string }[];
  sayanadi?: {
    index: number;
    name: (typeof SAYANADI)[number];
    plain: string;
    working: string;
    effect: string;
    tone: Tone;
    verse: string;
    asWritten?: boolean;
    /** 45.4, 45.6 and 45.38-39: how much of the stated effect the text expects. */
    measure: string;
  };
}

export interface AvasthaResult {
  planets: PlanetAvasthas[];
  ghatis?: number;
  findings: ParashariFinding[];
  caveats: string[];
}

export const AVASTHA_CAVEATS: string[] = [
  "Baladi (45.3-4) runs infant, youthful, adolescent, old and dead through the five 6-degree bands of the sign, ascending in odd signs and reversed in even ones, with results a quarter, a half, full, negligible and nil. Jagradadi (45.5-6): awake in own or exaltation sign (full), dreaming in a friend's or neutral sign (medium), asleep in an enemy's or debilitation sign (nil). Deeptadi (45.7-10): Deepta exalted, Swastha own, Pramudita great friend, Santa friend, Deena neutral, Vikala with a malefic, Khala enemy's sign, Kopa combust; the translation counts nine but names eight.",
  "Lajjitadi (45.11-18): Lajjita in the 5th with a node, the Sun, Saturn or Mars; Garvita exalted or in moolatrikona; Kshudhita in an enemy's sign, with or aspected by an enemy, or with Saturn; Trushita in a watery sign aspected by a malefic and no benefic; Mudita in a friend's sign, with or aspected by a benefic, or with Jupiter; Kshobhita with the Sun and with or aspected by a malefic or aspected by an enemy. The house held by a Kshudhita or Kshobhita planet is spoiled (45.18); the effects of 45.19-29 follow.",
  "Sayanadi (45.30-39): the planet's star number times its number (Sun 1 to Ketu 9) times its navamsa number, plus the birth star number, the ghatis elapsed from sunrise and the count of the lagna sign from Aries; the remainder on division by twelve names one of Sayana, Upavesana, Netrapani, Prakasa, Gamana, Agamana, Sabha, Agama, Bhojana, Nrityalipsa, Kautuka and Nidra. Effects from 45.40-146 by planet and 45.147-155 in general.",
  "Provisional readings: Jagradadi and Deeptadi use the compound relations of 3.55-58 for the seven planets (the natural table for Rahu and Ketu), since Pramudita needs a great friend; Lajjitadi uses the natural relations of 3.55 alone; moolatrikona is counted with own sign for Jagradadi; aspect is graha drishti of any strength; the ghatis of birth are whole ghatis from the computed sunrise and the lagna count takes Aries as 1. The sub-states Drishti, Cheshta and Vicheshta (45.36-39) need the numeral value of the first syllable of the native's name in the Sanskrit scheme and are not computed. Where the translation gives no effect for a planet in a state, the cell says so.",
];

// 45.40-146: effect per planet per Sayanadi state. `null` where the translation gives none.
type Eff = [string, Tone] | null;
const E: Record<Planet, Eff[]> = {
  Sun: [
    ["weak digestion, many ailments, heaviness of the legs, bile and heart trouble", "strain"],
    ["poverty, carrying loads, litigation, a hard heart and losses in undertakings", "strain"],
    ["always happy, wise and helpful, prowess and wealth, favour of those in power", "support"],
    ["liberal, plenty of wealth, a voice in the assembly, meritorious acts, strength and charm", "support"],
    ["life in distant places, misery, indolence, want of intelligence and wealth, fear and a short temper", "strain"],
    ["a list of faults, shown as written: drawn to others' spouses, without one's own people, restless, skilled in ill deeds, unclean and a tale-bearer", "strain"],
    ["helpful to others, wealth and gems, virtue, lands, new houses and clothes, strength, affection for friends and kindness", "support"],
    ["troubled by enemies, fickle, evil-minded, emaciated, without virtuous acts, proud", "strain"],
    ["joint pains, losses through others' spouses, strength that comes and goes, untruth, headaches, leftovers and bad ways", "strain"],
    ["honoured by the learned, a scholar and poet, adored by those in power", "support"],
    ["always happy, spiritual knowledge and rites, moves among those in power, some fear from enemies, a charming face, poetry", "support"],
    ["drowsy eyes, life in distant places, harm to the spouse, financial ruin", "strain"],
  ],
  Moon: [
    ["honourable but sluggish, given to lust, financial ruin", "mixed"],
    ["troubled by disease, dull, little wealth, a hard heart, unworthy acts, theft of others' wealth", "strain"],
    ["long-lasting diseases, garrulous, wicked and given to bad deeds", "strain"],
    ["famous, virtues shown through the patronage of those in power, horses, elephants, women and ornaments, visits to shrines", "support"],
    ["waning: sinful, cruel and afflicted in sight; waxing: distress from fear", "strain"],
    ["honourable but with diseases of the feet, secret sins, poor, without intelligence or happiness", "strain"],
    ["eminent among men, honoured by rulers and their rulers, beautiful, skilled in love, virtuous", "support"],
    null,
    ["honour, conveyances, attendants, status, spouse and daughters when the Moon is bright; these fail in the dark fortnight", "mixed"],
    ["with fortnightly strength: strong, knowledge of song, a judge of beauty; in the dark fortnight: sinful", "mixed"],
    ["standing among those in power, lordship over wealth, skill in love and sport", "support"],
    ["waxing and with Jupiter: quite eminent; otherwise loss of wealth through women and, as written, jackals crying round the house", "mixed"],
  ],
  Mars: [
    ["wounds, itch and ulcers", "strain"],
    ["strong, eminent and wealthy, yet sinful, untruthful and without virtues", "mixed"],
    ["in the lagna: penury; elsewhere: rulership of a city", "mixed"],
    ["shines with virtues, honoured by those in power; in the 5th: loss of children and spouse, as written; with Rahu: a severe fall", "mixed"],
    ["always roaming, fear of ulcers, misunderstandings with women, boils and itches, financial decline", "strain"],
    ["virtuous, precious gems, fond of a sharp sword, an elephant's gait, destroys enemies and removes the miseries of one's people", "support"],
    ["exalted: skilled in war, upholds the right, wealthy; in the 5th or 9th: bereft of learning; in the 12th: no children, spouse or friends, as written; elsewhere: a scholar at court, wealthy, honourable, charitable", "mixed"],
    ["without virtues or good deeds, distressed by disease, ailments of feet and ears, gout, timid, evil company", "strain"],
    ["strong: eats sweet food; weak: base acts and dishonour", "mixed"],
    ["wealth through those in power, a house full of gold, diamonds and corals", "support"],
    ["a curious disposition, friends and sons; exalted as well: honoured by those in power and virtuous", "support"],
    ["short-tempered, without intelligence or wealth, wicked, fallen from virtue, diseases", "strain"],
  ],
  Mercury: [
    ["in the lagna: lame with reddish eyes; elsewhere licentious and wicked, as written", "strain"],
    ["in the lagna the seven virtues; with malefics penury, with benefics financial happiness", "mixed"],
    ["without learning, wisdom, well-wishers or satisfaction, yet honourable; in the 5th: no happiness from spouse or son, more daughters, abundant finance through patronage", "mixed"],
    ["charitable, merciful, meritorious, crosses the ocean of many branches of learning, great discrimination, destroys evil people", "support"],
    ["visits the courts of those in power often; wealth dwells in the house", "support"],
    ["as in Gamana; exalted as well: affluent and meritorious, equal to Kubera, a ruler or minister, devoted to Vishnu and Siva, virtuous", "support"],
    null,
    ["serves base men and gains wealth by it; two sons and one daughter who brings fame", "mixed"],
    ["losses through litigation, wasting from fear of those in power, fickle, without bodily or conjugal happiness", "strain"],
    ["honour, conveyances, corals, sons, friends, prowess, recognition in the assembly for scholarship; in a malefic's sign: addiction to courtesans, as written", "mixed"],
    ["in the lagna: skilled in music; in the 7th or 8th: addiction to courtesans, as written; in the 9th: meritorious; elsewhere not given", "mixed"],
    ["poor sleep, neck ailments, without co-born, miseries, litigation with one's own people, loss of wealth and honour", "strain"],
  ],
  Jupiter: [
    ["strong but speaks in whispers, tawny, prominent cheeks, fear from enemies", "mixed"],
    ["garrulous, proud, troubled by those in power and by enemies, ulcers on feet, shanks, face and hands", "strain"],
    ["diseases, no wealth, fond of music and dance, libidinous, tawny, attached to other communities", "strain"],
    ["virtue, happiness and splendour, visits to places holy to Krishna; exalted as well: greatness among men, equal to Kubera", "support"],
    ["adventurous, happy through friends, scholarly, many kinds of wealth, Vedic learning", "support"],
    ["servants, excellent women and the goddess of wealth never leave the house", "support"],
    ["speech like Brihaspati's, corals, rubies and wealth, elephants, horses and chariots, supreme learning", "support"],
    ["conveyances, honours, retinue, children, spouse, friends and learning; equal to a ruler, noble, fond of literature, on the virtuous path", "support"],
    ["excellent food, horses, elephants and chariots; Lakshmi never leaves the house", "support"],
    ["honours from those in power, wealth, knowledge of moral law and Tantra, supreme among the learned, a great grammarian", "support"],
    ["curious, very rich, shines like the Sun in his circle, kind, happy, honoured by rulers, sons, wealth, just, strong, a scholar at court", "support"],
    ["foolish in undertakings, irredeemable penury, without righteous acts", "strain"],
  ],
  Venus: [
    ["strong yet dental disease, a short temper, no wealth, seeks courtesans, licentious, as written", "strain"],
    ["the nine gems and golden ornaments, ever happy, destroys enemies, honoured by those in power, growing honours", "support"],
    ["in the 1st, 7th or 10th: loss of wealth through afflicted sight; elsewhere: owner of large houses", "mixed"],
    ["in own, exaltation or a friend's sign: sports like a lofty elephant, equal to a ruler, skilled in poetry and music; elsewhere not given", "support"],
    ["mother not long-lived, as written; laments separation from one's people; fear from enemies", "strain"],
    ["abundant wealth, visits to great shrines, enthusiastic, ailments of hand and foot", "mixed"],
    ["eminence at a ruler's court, virtue, destroys enemies, equal to Kubera, charitable, rides horses, excellent among men", "support"],
    ["no wealth coming in, troubles from enemies, separation from children and relatives, disease, no pleasure from the spouse", "strain"],
    ["distress from hunger, disease and fear of enemies; in Virgo: very rich and honoured by scholars", "mixed"],
    ["skilled in literature, intelligent, plays the lute and drum, meritorious, very affluent", "support"],
    ["equal to Indra, greatness in the assembly, learned, Lakshmi always in the house", "support"],
    ["serves others and blames others, heroic, garrulous, wanders the earth", "mixed"],
  ],
  Saturn: [
    ["hunger and thirst, illness in boyhood, wealth later", "mixed"],
    ["greatly troubled by enemies, dangers, ulcers over the body, self-respecting, punished by those in power", "strain"],
    ["a charming spouse, wealth, favour of those in power, friends, many arts, eloquent", "support"],
    ["very virtuous, wealthy, intelligent, sportive, splendid, merciful, devoted to Siva", "support"],
    ["very rich, sons, seizes the lands of enemies, a scholar at a ruler's court", "support"],
    ["foolish (the text's word is donkey), no happiness from spouse or children, roams without patronage", "strain"],
    ["great possessions of precious stones and gold, judicial or political knowledge, brilliant", "support"],
    ["diseases, not skilled at winning patronage", "strain"],
    ["enjoys food, weak-sighted, fickle from delusion", "mixed"],
    ["righteous, opulent, honoured by those in power, brave, heroic in the field", "support"],
    ["lands and wealth, happy, pleasures through charming women, learned in poetry and the arts", "support"],
    ["rich, charming virtues, valorous, destroys fierce enemies, skilled in pleasures with courtesans, as written", "support"],
  ],
  Rahu: [
    ["miseries galore; in Taurus, Gemini, Virgo or Aries: wealth and grains", "mixed"],
    ["ulcers, association with those in power, honourable, ever without financial happiness", "mixed"],
    ["eye disease, fear from wicked people, snakes and thieves, financial decline", "strain"],
    ["high position, auspicious acts, financial rise, virtue, chief at court, charming like fresh rain clouds, prosperous abroad", "support"],
    ["many children, scholarly, wealthy, charitable, honoured by those in power", "support"],
    ["mental distress, fear from enemies and litigation, without one's own people, financial destruction, crafty and emaciated", "strain"],
    null,
    null,
    ["distress for want of food, dull, timid, no conjugal or progenic happiness", "strain"],
    ["a great unyielding disease, afflicted eyes, fear from enemies, decline in wealth and righteousness", "strain"],
    ["without a position, drawn to others' spouses, steals others' wealth, as written", "strain"],
    ["a repository of virtues, spouse and children, bold, proud, very affluent", "support"],
  ],
  Ketu: [
    ["in Aries, Taurus, Gemini or Virgo: plenty of wealth; elsewhere increased disease", "mixed"],
    ["ulcers, fear from enemies, windy diseases, snakes and thieves", "strain"],
    ["eye diseases, fear from wicked people, snakes, enemies and rulers", "strain"],
    ["wealthy, righteous, lives in foreign places, enthusiastic and genuine, serves those in power", "support"],
    ["many sons, abundant wealth, scholarly, virtuous, charitable, excellent among men", "support"],
    ["many diseases, loss of wealth, hurts others with his teeth, a tale-bearer, blames others", "strain"],
    null,
    ["a notorious sinner, litigation with relatives, wicked, troubled by disease and enemies, as written", "strain"],
    ["hunger, penury and disease, roams the earth", "strain"],
    ["disease, a floral mark on the eye, impertinent, wicked, plans evils", "strain"],
    ["seeks dancers, displacement from position, evil paths, roams", "strain"],
    ["wealth and grain, virtuous, sportive", "support"],
  ],
};
/** The translation numbers each planet's twelve Sayanadi effects as one block, so the block is cited rather than a verse per state. */
const VERSE_BLOCK: Record<Planet, string> = { Sun: "40-51", Moon: "52-63", Mars: "64-75", Mercury: "76-86", Jupiter: "87-98", Venus: "99-110", Saturn: "111-122", Rahu: "123-134", Ketu: "135-146" };
const WATERY = [3, 7, 11];

/**
 * 45.38-39: the effects stated for a Sayanadi state are given full, medium or negligible by the sub-state, and "the good and bad
 * effects of planets be deciphered based on the strength and weakness of the planets". The sub-state needs the numeral of the
 * name's first syllable and is not computed, so the measures the text does give, by age (45.4) and by the sign held (45.6), are
 * placed beside the reading so that it is not taken as a verdict on its own.
 */
function measureNote(age: string, jag: string, basis: string): string {
  return `Measure: ${age} by age (45.4), ${jag} by the ${basis} (45.6); the sub-state of 45.38 that grades this reading is not computed, and 45.39 asks that its good and bad be weighed by the planet's strength.`;
}

export function computeAvasthas(positions: PlanetPosition[], lagnaIdx: number, deps: HouseDeps, shadbala?: ShadbalaResult, base?: ShadbalaBase): AvasthaResult {
  const pos = (pl: Planet) => positions.find((p) => p.planet === pl)!;
  const houseOf = (pl: Planet) => houseFrom(lagnaIdx, pos(pl).signIndex);
  const isBen = (p: PlanetPosition) => deps.benefic(p, positions);
  const seven = (pl: Planet): pl is Seven => (SEVEN as readonly string[]).includes(pl);
  const with_ = (a: Planet) => positions.filter((p) => p.planet !== a && p.signIndex === pos(a).signIndex);
  const aspectedBy = (a: Planet) => positions.filter((p) => p.planet !== a && p.signIndex !== pos(a).signIndex && deps.aspect(p.planet, p.signIndex, pos(a).signIndex) > 0);
  /** Natural relation of `a` towards `b` (3.55), used for Lajjitadi (provisional). */
  const rel = (a: Planet, b: Planet): "friend" | "neutral" | "enemy" => {
    if (FRIENDS[a]?.includes(b)) return "friend";
    if (ENEMIES[a]?.includes(b)) return "enemy";
    return "neutral";
  };
  const relToLord = (a: Planet) => {
    const lord = SIGN_LORD[pos(a).signIndex] as Planet;
    if (lord === a) return "own" as const;
    if (seven(a) && seven(lord)) return compoundRelation(a, lord, pos(a).signIndex, pos(lord).signIndex);
    if (FRIENDS[a]?.includes(lord)) return "friend" as const;
    if (ENEMIES[a]?.includes(lord)) return "enemy" as const;
    return "neutral" as const;
  };
  const enemyOf = (a: Planet, b: Planet) => rel(a, b) === "enemy";
  const natLord = (a: Planet) => rel(a, SIGN_LORD[pos(a).signIndex] as Planet);
  const exalted = (p: PlanetPosition) => EXALTATION[p.planet]?.sign === p.signIndex;
  const debilitated = (p: PlanetPosition) => EXALTATION[p.planet] !== undefined && (EXALTATION[p.planet]!.sign + 6) % 12 === p.signIndex;
  const own = (p: PlanetPosition) => OWN_SIGNS[p.planet]?.includes(p.signIndex) ?? false;
  const moola = (p: PlanetPosition) => (seven(p.planet) ? inMoolatrikona(p.planet, p.signIndex, p.degInSign) : MOOLATRIKONA[p.planet] === p.signIndex);
  const ghatis = base ? Math.max(0, Math.floor((base.jd - base.sunriseJd) * 60)) : undefined;
  const birthStar = pos("Moon").nakshatraIndex + 1;

  const F: ParashariFinding[] = [];
  const push = (id: string, title: string, text: string, tone: Tone, planets: Planet[], verse: string, provisional?: boolean) =>
    F.push({ id: `av-${id}`, kind: "yoga", title: cap(title), text: cap(text), tone, planets, source: S(verse, provisional) });

  const planets: PlanetAvasthas[] = positions.map((p) => {
    const pl = p.planet;
    // Baladi 45.3-4
    const band = Math.min(4, Math.floor(p.degInSign / 6));
    const bi = p.signIndex % 2 === 0 ? band : 4 - band;
    const baladi = { name: BALADI[bi], plain: BALADI_PLAIN[bi], result: BALADI_RESULT[bi], band };
    // Jagradadi 45.5-6
    const r = relToLord(pl);
    let jag: PlanetAvasthas["jagradadi"];
    if (exalted(p) || own(p) || moola(p)) jag = { name: "Jagrat", plain: "awake", result: "full", basis: exalted(p) ? "exalted" : moola(p) ? "moolatrikona" : "own sign" };
    else if (debilitated(p) || r === "enemy" || r === "great enemy") jag = { name: "Sushupti", plain: "asleep", result: "nil", basis: debilitated(p) ? "debilitated" : `${r}'s sign` };
    else jag = { name: "Swapna", plain: "dreaming", result: "medium", basis: `${r}'s sign` };
    // Deeptadi 45.7-10
    const names: string[] = [];
    const basis: string[] = [];
    if (exalted(p)) { names.push("Deepta"); basis.push("exalted"); }
    else if (own(p) || moola(p)) { names.push("Swastha"); basis.push("own sign"); }
    else if (r === "great friend") { names.push("Pramudita"); basis.push("great friend's sign"); }
    else if (r === "friend") { names.push("Santa"); basis.push("friend's sign"); }
    else if (r === "neutral") { names.push("Deena"); basis.push("neutral sign"); }
    else { names.push("Khala"); basis.push(`${r}'s sign`); }
    const malWith = with_(pl).filter((q) => !isBen(q));
    if (malWith.length) { names.push("Vikala"); basis.push(`with ${list(malWith.map((q) => q.planet))}`); }
    if (p.combust) { names.push("Kopa"); basis.push("combust"); }
    const deeptadi = { names, basis: basis.join(", ") };
    // Lajjitadi 45.11-17
    const laj: { name: string; why: string }[] = [];
    const h = houseOf(pl);
    const co = with_(pl);
    const asp = aspectedBy(pl);
    const lajCo = co.filter((q) => ["Rahu", "Ketu", "Sun", "Saturn", "Mars"].includes(q.planet));
    if (h === 5 && lajCo.length) laj.push({ name: "Lajjita", why: `in the 5th with ${list(lajCo.map((q) => q.planet))}` });
    if (exalted(p) || moola(p)) laj.push({ name: "Garvita", why: exalted(p) ? "exalted" : "in moolatrikona" });
    {
      const why: string[] = [];
      if (natLord(pl) === "enemy" && SIGN_LORD[p.signIndex] !== pl) why.push("in an enemy's sign");
      const en = co.filter((q) => enemyOf(pl, q.planet)).map((q) => q.planet);
      if (en.length) why.push(`with the enemy ${list(en)}`);
      const ea = asp.filter((q) => enemyOf(pl, q.planet)).map((q) => q.planet);
      if (ea.length) why.push(`aspected by the enemy ${list(ea)}`);
      if (pl !== "Saturn" && co.some((q) => q.planet === "Saturn") && !en.includes("Saturn")) why.push("with Saturn");
      if (why.length) laj.push({ name: "Kshudhita", why: list(why) });
    }
    if (WATERY.includes(p.signIndex)) {
      const malA = asp.filter((q) => !isBen(q)).map((q) => q.planet);
      const benA = asp.filter((q) => isBen(q));
      if (malA.length && !benA.length) laj.push({ name: "Trushita", why: `in watery ${SIGNS[p.signIndex]} aspected by ${list(malA)} and no benefic` });
    }
    {
      const why: string[] = [];
      if (natLord(pl) === "friend") why.push("in a friend's sign");
      const bc = co.filter((q) => isBen(q)).map((q) => q.planet);
      if (bc.length) why.push(`with the benefic ${list(bc)}`);
      const ba = asp.filter((q) => isBen(q)).map((q) => q.planet);
      if (ba.length) why.push(`aspected by the benefic ${list(ba)}`);
      if (pl !== "Jupiter" && co.some((q) => q.planet === "Jupiter") && !bc.includes("Jupiter")) why.push("with Jupiter");
      if (why.length) laj.push({ name: "Mudita", why: list(why) });
    }
    if (pl !== "Sun" && co.some((q) => q.planet === "Sun")) {
      const malAny = [...co, ...asp].filter((q) => q.planet !== "Sun" && !isBen(q)).map((q) => q.planet);
      const ea = asp.filter((q) => enemyOf(pl, q.planet)).map((q) => q.planet);
      if (malAny.length || ea.length) laj.push({ name: "Kshobhita", why: `with the Sun and ${malAny.length ? `with or aspected by the malefic ${list(malAny)}` : `aspected by the enemy ${list(ea)}`}` });
    }
    // Sayanadi 45.30-39
    let sayanadi: PlanetAvasthas["sayanadi"];
    if (ghatis !== undefined) {
      const pn = (["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as Planet[]).indexOf(pl) + 1;
      const star = p.nakshatraIndex + 1;
      const nav = Math.floor(p.degInSign / (30 / 9)) + 1;
      const total = star * pn * nav + birthStar + ghatis + lagnaIdx + 1;
      const rem = total % 12;
      const index = rem === 0 ? 12 : rem;
      const eff = E[pl][index - 1];
      const working = `${star} × ${pn} × ${nav} + ${birthStar} + ${ghatis} + ${lagnaIdx + 1} = ${total}; remainder ${rem}`;
      const verse = VERSE_BLOCK[pl];
      sayanadi = eff
        ? { index, name: SAYANADI[index - 1], plain: SAYANADI_PLAIN[index - 1], working, effect: cap(eff[0]), tone: eff[1], verse, asWritten: eff[0].includes("as written"), measure: measureNote(baladi.result, jag.result, jag.basis) }
        : { index, name: SAYANADI[index - 1], plain: SAYANADI_PLAIN[index - 1], working, effect: "The translation gives no effect for this planet in this state.", tone: "mixed", verse, measure: measureNote(baladi.result, jag.result, jag.basis) };
    }
    return { planet: pl, baladi, jagradadi: jag, deeptadi, lajjitadi: laj, sayanadi };
  });

  // Findings 45.18-29
  const byName = (name: string) => planets.filter((a) => a.lajjitadi.some((l) => l.name === name));
  const spoiled = planets.filter((a) => a.lajjitadi.some((l) => l.name === "Kshudhita" || l.name === "Kshobhita"));
  if (spoiled.length) push("spoiled", "Houses held by hungry or agitated planets", `${list(spoiled.map((a) => `${a.planet} (${a.lajjitadi.filter((l) => l.name === "Kshudhita" || l.name === "Kshobhita").map((l) => l.name).join(", ")}) in the ${ord(houseOf(a.planet))}`))}: Parashara says the house a Kshudhita or Kshobhita planet occupies is destroyed (45.18); read as the affairs of that house being strained.`, "strain", spoiled.map((a) => a.planet), "18");
  {
    const tenth = planets.filter((a) => houseOf(a.planet) === 10 && a.lajjitadi.some((l) => ["Lajjita", "Kshudhita", "Kshobhita"].includes(l.name)));
    if (tenth.length) push("tenth", "Lajjita, Kshudhita or Kshobhita planet in the 10th", `${list(tenth.map((a) => a.planet))} in the 10th in such a state: miseries in the field of work and standing (45.19).`, "strain", tenth.map((a) => a.planet), "19");
    const fifth = byName("Lajjita").filter((a) => houseOf(a.planet) === 5);
    if (fifth.length) push("fifth", "Lajjita planet in the 5th", `${list(fifth.map((a) => a.planet))} ashamed in the 5th: the text says destruction of progeny, shown as written; read as strain on children (45.20).`, "strain", fifth.map((a) => a.planet), "20");
    const seventh = planets.filter((a) => houseOf(a.planet) === 7 && a.lajjitadi.some((l) => l.name === "Kshobhita" || l.name === "Trushita"));
    if (seventh.length) push("seventh", "Kshobhita or Trushita planet in the 7th", `${list(seventh.map((a) => a.planet))} in the 7th agitated or thirsty: the text speaks of the spouse's end, shown as written; read as strain on the marriage (45.21).`, "strain", seventh.map((a) => a.planet), "21");
    const twoBad = planets.filter((a) => a.lajjitadi.filter((l) => ["Lajjita", "Kshudhita", "Kshobhita", "Trushita"].includes(l.name)).length >= 2);
    if (twoBad.length) push("two", "Two of the harsh states together", `${list(twoBad.map((a) => `${a.planet} (${a.lajjitadi.filter((l) => ["Lajjita", "Kshudhita", "Kshobhita", "Trushita"].includes(l.name)).map((l) => l.name).join(", ")})`))}: the house held loses its good (45.22-23).`, "strain", twoBad.map((a) => a.planet), "22-23");
  }
  {
    const g = byName("Garvita");
    if (g.length) push("garvita", "Proud planets", `${list(g.map((a) => a.planet))} Garvita: happiness in all undertakings, wealth, comforts and standing in the dasa of the planet (45.24).`, "support", g.map((a) => a.planet), "24");
    const m = byName("Mudita");
    if (m.length) push("mudita", "Delighted planets", `${list(m.map((a) => a.planet))} Mudita: houses, clothes, ornaments, wealth and lands, happiness through spouse, children and friends, favour of those in power (45.25-26).`, "support", m.map((a) => a.planet), "25-26");
    const k = byName("Kshudhita");
    if (k.length) push("kshudhita", "Hungry planets", `${list(k.map((a) => a.planet))} Kshudhita: grief, ailments, troubles from relatives and enemies, loss of wealth and standing in the planet's dasa (45.27-28).`, "strain", k.map((a) => a.planet), "27-28");
    const kb = byName("Kshobhita");
    if (kb.length) push("kshobhita", "Agitated planets", `${list(kb.map((a) => a.planet))} Kshobhita: poverty, evil ways, distress, troubles from the powerful and in the family (45.29).`, "strain", kb.map((a) => a.planet), "29");
    const l = byName("Lajjita");
    if (l.length) push("lajjita", "Ashamed planets", `${list(l.map((a) => a.planet))} Lajjita: the text's general effects for shame, given with the house effects of 45.19-20.`, "strain", l.map((a) => a.planet), "19-20");
    const t = byName("Trushita");
    if (t.length) push("trushita", "Thirsty planets", `${list(t.map((a) => a.planet))} Trushita: the text gives its effect only with the 7th house rule of 45.21.`, "mixed", t.map((a) => a.planet), "21");
  }
  // General Sayanadi 45.147-155
  for (const a of planets) {
    if (!a.sayanadi) continue;
    const p = pos(a.planet), h = houseOf(a.planet), mal = !isBen(p), n = a.sayanadi.name;
    if (!mal && n === "Sayana") push(`gen-${a.planet}`, `benefic ${a.planet} lying down`, `A benefic in Sayana gives good results (45.147).`, "support", [a.planet], "147");
    if (mal && n === "Bhojana") push(`gen-${a.planet}`, `malefic ${a.planet} eating`, `A malefic in Bhojana spoils the house it holds, the ${ord(h)} (45.148).`, "strain", [a.planet], "148");
    if (mal && h === 7 && n === "Nidra") {
      const otherMal = positions.some((q) => q.planet !== a.planet && !isBen(q) && q.signIndex !== p.signIndex && deps.aspect(q.planet, q.signIndex, p.signIndex) > 0);
      push(`gen-${a.planet}`, `malefic ${a.planet} asleep in the 7th`, otherMal ? `A malefic in Nidra in the 7th is auspicious only without another malefic's aspect, and here one aspects (45.149).` : `A malefic in Nidra in the 7th with no other malefic aspecting: auspicious (45.149).`, otherMal ? "mixed" : "support", [a.planet], "149");
    }
    if (mal && h === 5 && (n === "Nidra" || n === "Sayana")) push(`gen-${a.planet}`, `malefic ${a.planet} in the 5th, ${a.sayanadi.plain}`, `A malefic in Nidra or Sayana in the 5th is auspicious (45.150).`, "support", [a.planet], "150");
    if (mal && h === 8 && (n === "Nidra" || n === "Sayana")) {
      const benWith = with_(a.planet).some((q) => isBen(q));
      push(`gen-${a.planet}`, `malefic ${a.planet} in the 8th, ${a.sayanadi.plain}`, benWith ? `A malefic in Nidra or Sayana in the 8th with a benefic: the text's harsh line on the end, shown as written, softened by the benefic (45.152).` : `A malefic in Nidra or Sayana in the 8th: a harsh verse on the end through the wrath of those in power, shown as written; read as strain (45.151).`, "strain", [a.planet], benWith ? "152" : "151");
    }
    if (mal && h === 10 && (n === "Sayana" || n === "Bhojana")) push(`gen-${a.planet}`, `malefic ${a.planet} in the 10th, ${a.sayanadi.plain}`, `A malefic in Sayana or Bhojana in the 10th: miseries through one's own deeds (45.153).`, "strain", [a.planet], "153");
    if (a.planet === "Moon" && h === 10 && (n === "Kautuka" || n === "Prakasa")) push("gen-moon", `Moon in the 10th, ${a.sayanadi.plain}`, `The Moon in Kautuka or Prakasa in the 10th: a raja yoga, standing among those in power (45.154).`, "support", ["Moon"], "154");
  }

  return { planets, ghatis, findings: F, caveats: AVASTHA_CAVEATS };
}
