// BPHS chapter 45 (avasthas of the planets), read from http://jyotishvidya.com/ch45.htm, with the
// Lajjitadi verses (45.11-29) checked against the Sanskrit at sanskritdocuments.org.
// Five schemes: Baladi by degree (45.3-4), Jagradadi by dignity (45.5-6), Deeptadi by
// dignity and company (45.7-10), Lajjitadi by house, company and aspect (45.11-29) and
// Sayanadi by the arithmetic of 45.30-39 with the effects of 45.40-155.
import { SIGNS, SIGN_LORD, ENEMIES, FRIENDS, EXALTATION, OWN_SIGNS, MOOLATRIKONA, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import { compoundRelation, inMoolatrikona, SEVEN, type Seven, type ShadbalaBase, type ShadbalaResult } from "./shadbala";
import type { ParashariFinding, ParashariSource } from "./parashari";
import type { HouseDeps } from "./parashari-houses";
import { parashariCombust, parashariCombustOrb } from "./vargas";
import { houseGloss, thePlanet, withGloss } from "./house-gloss";

const S = (verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara 45.${verse}`, url: BPHS_URL(45), provisional });
const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());
export const AVASTHA_CH = BPHS_URL(45);
/** The Sanskrit of ch. 45, for the verses where the translation departs from it (45.15-17, 45.20-21). */
export const AVASTHA_SANSKRIT = "https://sanskritdocuments.org/doc_z_misc_sociology_astrology/par4145.html";
const SK = (verse: string, provisional?: boolean): ParashariSource => ({ label: `Parashara 45.${verse}, Sanskrit`, url: AVASTHA_SANSKRIT, provisional });

export type Tone = ParashariFinding["tone"];
export const BALADI = ["Bala", "Kumara", "Yuva", "Vriddha", "Mrita"] as const;
// Plain names; the fifth, Mrita, gives no result, and the plain reading calls it spent rather than dead.
export const BALADI_PLAIN = ["infant", "youthful", "adolescent", "old", "spent"] as const;
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

/**
 * One planet's Lajjitadi states read together. A planet can hold good and harsh states at once; the
 * text has strength decide (45.19), and reads delight joined with a harsh state as mixed: loss when
 * weak, great results when strong (45.20).
 */
export interface StateLine {
  planet: Planet;
  house: number;
  /** The states held, in the order of 45.11. */
  names: string[];
  /** A good state (Garvita, Mudita) held with a harsh one. */
  mixed: boolean;
  /**
   * What strength makes of the states: "good" (with strength, great or greater results), "loss" (delight
   * with a harsh state, without strength), "reduced" (good states without strength). Absent when only
   * harsh states are held or strength cannot be measured (the nodes).
   */
  lean?: "good" | "loss" | "reduced";
  tone: Tone;
  /** Shadbala against its requirement (27.32-33); absent for the nodes. */
  shadbala?: { total: number; required: number; strong: boolean };
  /** Combust by the Parashari orbs (7.28-29 note), counted without strength (6.53, 79.4-5). */
  combust: boolean;
  /** Defeated in planetary war, counted without strength (6.53). */
  defeated: boolean;
  /** Age and wakefulness both at their lowest (45.4, 45.6): little of either side comes through. */
  little: boolean;
  text: string;
  plain: string;
  /** The same in a line, for the period readings. */
  brief: string;
  briefPlain: string;
  source: ParashariSource;
}

/** The stated effect of one of the six states (45.24-29), with the planets holding it. */
export interface StateEffect {
  name: string;
  verse: string;
  text: string;
  plain: string;
  planets: Planet[];
  source: ParashariSource;
}

export interface AvasthaResult {
  planets: PlanetAvasthas[];
  ghatis?: number;
  findings: ParashariFinding[];
  /** Lajjitadi per planet, with strength deciding the side (45.19-20). */
  lines: StateLine[];
  /** The effects of the states held in this chart (45.24-29). */
  effects: StateEffect[];
  caveats: string[];
}

export const AVASTHA_CAVEATS: string[] = [
  "Baladi (45.3-4) runs infant, youthful, adolescent, old and dead through the five 6-degree bands of the sign, ascending in odd signs and reversed in even ones, with results a quarter, a half, full, negligible and nil. Jagradadi (45.5-6): awake in own or exaltation sign (full), dreaming in a friend's or neutral sign (medium), asleep in an enemy's or debilitation sign (nil). Deeptadi (45.7-10): Deepta exalted, Swastha own, Pramudita great friend, Santa friend, Deena neutral, Vikala with a malefic, Khala enemy's sign, Kopa combust; the translation counts nine but names eight. Combustion uses the Surya Siddhanta orbs quoted under 7.28-29 (the Moon 12°, Mars 17° or 8° retrograde, Mercury 14° or 12°, Jupiter 11°, Venus 10° or 8°, Saturn 16°), as in the varga and house readings, not the Nadi 3°20'.",
  "Lajjitadi (45.11-17), read from the Sanskrit: Lajjita in the 5th with a node, the Sun, Saturn or Mars; Garvita exalted or in moolatrikona; Kshudhita in an enemy's sign, with or aspected by an enemy, or with Saturn; Trushita in a watery sign aspected by an enemy and by no benefic; Mudita in a friend's sign, with or aspected by a friend, or with Jupiter; Kshobhita with the Sun and aspected by a malefic or by an enemy. For Trushita, Mudita and Kshobhita the translation reads a malefic, a benefic, and a malefic with or aspecting the planet; the Sanskrit has शत्रुणा (by an enemy), मित्र (friend) and पापा पश्यन्ति (malefics aspect), and P.V.R. Narasimha Rao reads them the same way (Vedic Astrology: An Integrated Approach, p. 191). Each condition is read as enough on its own, as the translations read them. The house held by a Kshudhita or Kshobhita planet is spoiled (45.18), to be weighed by strength (45.19); 45.20 reads delight joined with them as mixed, loss when weak and great results when strong, a clause the translation leaves out; 45.21-23 give the 10th, 5th and 7th house rules, the Sanskrit listing Trushita in the 10th where the translation does not; 45.24-29 give the effects of the six states, with no mention of a dasa.",
  "Sayanadi (45.30-39): the planet's star number times its number (Sun 1 to Ketu 9) times its navamsa number, plus the birth star number, the ghatis elapsed from sunrise and the count of the lagna sign from Aries; the remainder on division by twelve names one of Sayana, Upavesana, Netrapani, Prakasa, Gamana, Agamana, Sabha, Agama, Bhojana, Nrityalipsa, Kautuka and Nidra. Effects from 45.40-146 by planet and 45.147-155 in general.",
  "Provisional readings: Jagradadi names three classes, friend, neutral and enemy, and uses the natural relations of 3.55; Deeptadi names a thick friend as well, so it uses the compound relations of 3.55-58 for the seven planets, and the basis shows how the compound relation arose. Chapter 3 gives no relationships for Rahu and Ketu; their rows follow the Nadi convention (Rahu as Saturn, Ketu as Mars, both hostile to the luminaries) and every reading that rests on them is provisional. The two columns can therefore differ, as when a planet stands in a natural neutral's sign whose lord is a temporal enemy; Lajjitadi uses the natural relations of 3.55 alone; moolatrikona is counted with own sign for Jagradadi; aspects follow the chapter's aspect setting (full aspects only by default); strength for 45.19-20 is Shadbala at its requirement (27.32-33), with a combust planet or one defeated in planetary war counted without strength (6.53, 79.4-5), and the nodes, which have no Shadbala, are left undecided; 45.20 is read as applying to a planet that holds delight with a harsh state, where the translations render it as mutually joyful planets giving mixed results; the states are shown as description and are not counted in any verdict, since they restate dignity, company and aspect, which the other readings already weigh; the ghatis of birth are whole ghatis from the computed sunrise and the lagna count takes Aries as 1. The sub-states Drishti, Cheshta and Vicheshta (45.36-39) need the numeral value of the first syllable of the native's name in the Sanskrit scheme and are not computed. Where the translation gives no effect for a planet in a state, the cell says so.",
];

/** 45.24-29: the effects of the six states, in the Sanskrit order, from the translation. None names a dasa. */
export const LAJJITADI_EFFECTS: Record<string, { verse: string; text: string; plain: string }> = {
  Garvita: { verse: "24", text: "New houses and gardens, royal favour, skill in the arts, gains at all times and growth in business.", plain: "A settled home, recognition, skill and steady gains." },
  Mudita: { verse: "25", text: "Fine residences, clothes and ornaments, happiness from land and spouse and among one's own people, life in great houses, enemies overcome, and growth in wisdom and learning.", plain: "Comfort at home, good company, the upper hand over rivals and growth in learning." },
  Lajjita: { verse: "26", text: "Aversion to God, loss of judgement, futile journeys, a taste for quarrelsome talk and none for good things. The Sanskrit adds illness coming to the children, where the translation has loss of a child.", plain: "A mind less given to devotion and good judgement, wasted journeys and quarrels, and worries around children." },
  Kshobhita: { verse: "27", text: "Acute want, a perverse mind, hardship, loss of wealth, trouble in the feet, and income blocked by the displeasure of those in power.", plain: "Money pressure, poor judgement, hardship, trouble with the feet and friction with those in authority." },
  Kshudhita: { verse: "28", text: "A fall through grief and infatuation, distress through relatives, wasting of the body, trouble from enemies, money troubles, loss of strength and a mind clouded by sorrow.", plain: "Grief and worry, strain through relatives, low energy, opposition and money troubles." },
  Trushita: { verse: "29", text: "Illness through intimacy with women, charge of base work, loss of wealth through the blame of one's own people, weakness, trouble from the wicked and loss of honour.", plain: "Health strain, loss through one's own people, weakness and a dent in standing." },
};

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
  /** Natural relation of the planet to the lord of its sign (3.55), for the three classes of 45.5. */
  const natToLord = (a: Planet): "own" | "friend" | "neutral" | "enemy" => {
    const lord = SIGN_LORD[pos(a).signIndex] as Planet;
    return lord === a ? "own" : rel(a, lord);
  };
  /** How the compound relation to the sign lord arose (3.56-58), for the Deeptadi basis. */
  const compoundWhy = (a: Planet): string => {
    const lord = SIGN_LORD[pos(a).signIndex] as Planet;
    if (!seven(a) || !seven(lord) || lord === a) return "";
    const nat = rel(a, lord);
    const h = houseFrom(pos(a).signIndex, pos(lord).signIndex);
    const temp = [2, 3, 4, 10, 11, 12].includes(h) ? "friend" : "enemy";
    return `${lord} is ${nat === "neutral" ? "neutral" : nat === "enemy" ? "an enemy" : "a friend"} by nature and a temporal ${temp}, standing in the ${ord(h)} from ${a}`;
  };
  const enemyOf = (a: Planet, b: Planet) => rel(a, b) === "enemy";
  const natLord = (a: Planet) => rel(a, SIGN_LORD[pos(a).signIndex] as Planet);
  const exalted = (p: PlanetPosition) => EXALTATION[p.planet]?.sign === p.signIndex;
  const debilitated = (p: PlanetPosition) => EXALTATION[p.planet] !== undefined && (EXALTATION[p.planet]!.sign + 6) % 12 === p.signIndex;
  const own = (p: PlanetPosition) => OWN_SIGNS[p.planet]?.includes(p.signIndex) ?? false;
  const moola = (p: PlanetPosition) => (seven(p.planet) ? inMoolatrikona(p.planet, p.signIndex, p.degInSign) : MOOLATRIKONA[p.planet] === p.signIndex);
  const ghatis = base ? Math.max(0, Math.floor((base.jd - base.sunriseJd) * 60)) : undefined;
  const birthStar = pos("Moon").nakshatraIndex + 1;
  // Combustion by the Parashari orbs (7.28-29 note), not the Nadi flag on the position.
  const sunLon = pos("Sun").lon;
  const combustP = (p: PlanetPosition) => parashariCombust(p, sunLon);
  const combustTxt = (p: PlanetPosition) => `combust, ${(Math.abs((((p.lon - sunLon) % 360) + 540) % 360 - 180)).toFixed(1)}° from the Sun within the ${parashariCombustOrb(p)}° orb`;

  const F: ParashariFinding[] = [];
  const push = (id: string, title: string, text: string, tone: Tone, planets: Planet[], verse: string, provisional?: boolean, plain?: string) =>
    F.push({ id: `av-${id}`, kind: "yoga", title: cap(title), text: cap(text), tone, planets, source: S(verse, provisional), ...(plain ? { plain: cap(plain) } : {}) });

  const planets: PlanetAvasthas[] = positions.map((p) => {
    const pl = p.planet;
    // Baladi 45.3-4
    const band = Math.min(4, Math.floor(p.degInSign / 6));
    const bi = p.signIndex % 2 === 0 ? band : 4 - band;
    const baladi = { name: BALADI[bi], plain: BALADI_PLAIN[bi], result: BALADI_RESULT[bi], band };
    // Jagradadi 45.5-6: three classes, friend, neutral and enemy, taken from the natural table of 3.55.
    const r = relToLord(pl);
    const rn = natToLord(pl);
    let jag: PlanetAvasthas["jagradadi"];
    const nodeTag = seven(pl) ? "" : ", Nadi table, ch. 3 gives none for the nodes";
    if (exalted(p) || own(p) || moola(p)) jag = { name: "Jagrat", plain: "awake", result: "full", basis: exalted(p) ? "exalted" : moola(p) ? "moolatrikona" : "own sign" };
    else if (debilitated(p) || rn === "enemy") jag = { name: "Sushupti", plain: "asleep", result: "nil", basis: debilitated(p) ? "debilitated" : `enemy's sign by nature${nodeTag}` };
    else jag = { name: "Swapna", plain: "dreaming", result: "medium", basis: `${rn}'s sign by nature${nodeTag}` };
    // Deeptadi 45.7-10
    const names: string[] = [];
    const basis: string[] = [];
    if (exalted(p)) { names.push("Deepta"); basis.push("exalted"); }
    else if (own(p) || moola(p)) { names.push("Swastha"); basis.push("own sign"); }
    else {
      const why = compoundWhy(pl);
      const tag = why ? ` by compound relation: ${why}` : seven(pl) ? "" : " by the Nadi table, since ch. 3 gives no relations for the nodes";
      if (r === "great friend") { names.push("Pramudita"); basis.push(`great friend's sign${tag}`); }
      else if (r === "friend") { names.push("Santa"); basis.push(`friend's sign${tag}`); }
      else if (r === "neutral") { names.push("Deena"); basis.push(`neutral sign${tag}`); }
      else { names.push("Khala"); basis.push(`${r}'s sign${tag}`); }
    }
    const malWith = with_(pl).filter((q) => !isBen(q));
    if (malWith.length) { names.push("Vikala"); basis.push(`with ${list(malWith.map((q) => q.planet))}`); }
    if (combustP(p)) { names.push("Kopa"); basis.push(combustTxt(p)); }
    const deeptadi = { names, basis: basis.join("; ") };
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
    // 45.15: in a watery sign, aspected by an enemy (शत्रुणा), and by no benefic.
    if (WATERY.includes(p.signIndex)) {
      const enA = asp.filter((q) => enemyOf(pl, q.planet)).map((q) => q.planet);
      const benA = asp.filter((q) => isBen(q));
      if (enA.length && !benA.length) laj.push({ name: "Trushita", why: `in watery ${SIGNS[p.signIndex]}, aspected by the enemy ${list(enA)} and by no benefic` });
    }
    // 45.16: in a friend's sign, with a friend, aspected by a friend (मित्र), or with Jupiter.
    {
      const isFriend = (q: PlanetPosition) => rel(pl, q.planet) === "friend";
      const why: string[] = [];
      if (natLord(pl) === "friend") why.push("in a friend's sign");
      const fc = co.filter(isFriend).map((q) => q.planet);
      if (fc.length) why.push(`with the friend ${list(fc)}`);
      const fa = asp.filter(isFriend).map((q) => q.planet);
      if (fa.length) why.push(`aspected by the friend ${list(fa)}`);
      if (pl !== "Jupiter" && co.some((q) => q.planet === "Jupiter") && !fc.includes("Jupiter")) why.push("with Jupiter");
      if (why.length) laj.push({ name: "Mudita", why: list(why) });
    }
    // 45.17: with the Sun, and aspected by malefics (पापा पश्यन्ति) or by an enemy.
    if (pl !== "Sun" && co.some((q) => q.planet === "Sun")) {
      const malA = asp.filter((q) => !isBen(q)).map((q) => q.planet);
      const ea = asp.filter((q) => enemyOf(pl, q.planet) && !malA.includes(q.planet)).map((q) => q.planet);
      const by = [malA.length ? `the malefic ${list(malA)}` : "", ea.length ? `the enemy ${list(ea)}` : ""].filter(Boolean);
      if (by.length) laj.push({ name: "Kshobhita", why: `with the Sun and aspected by ${by.join(" and by ")}` });
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

  // 45.18-23: the house rules. 45.19 has every one of them weighed by strength.
  const byName = (name: string) => planets.filter((a) => a.lajjitadi.some((l) => l.name === name));
  const HARSH = ["Lajjita", "Kshudhita", "Trushita", "Kshobhita"];
  const defeated = new Set<Planet>((shadbala?.wars ?? []).map((w) => w.loser));
  const sbOf = (pl: Planet) => shadbala?.planets.find((s) => s.planet === pl);
  /** Strength for 45.19-20: Shadbala at its requirement, not combust and not defeated in war (6.53, 79.4-5). Undefined without Shadbala (the nodes). */
  const strongOf = (pl: Planet): boolean | undefined => {
    const sb = sbOf(pl);
    if (!sb) return undefined;
    return sb.strong && !combustP(pos(pl)) && !defeated.has(pl);
  };
  const weigh = (xs: Planet[]) => {
    const w = xs.filter((pl) => strongOf(pl) === true);
    const wo = xs.filter((pl) => strongOf(pl) === false);
    const parts = [w.length ? `with strength, ${list(w)}` : "", wo.length ? `without strength, ${list(wo)}` : ""].filter(Boolean);
    return parts.length ? ` 45.19 has this weighed by strength: ${parts.join("; ")}.` : "";
  };
  const spoiled = planets.filter((a) => a.lajjitadi.some((l) => l.name === "Kshudhita" || l.name === "Kshobhita"));
  const spoiledPlain = () => {
    const byH = new Map<number, Planet[]>();
    for (const a of spoiled) byH.set(houseOf(a.planet), [...(byH.get(houseOf(a.planet)) ?? []), a.planet]);
    const parts = Array.from(byH.entries())
      .sort((x, y) => x[0] - y[0])
      .map(([h, ps]) => `the ${withGloss("parashari", h)} from ${list(ps.map(thePlanet))}`);
    return `Under strain (45.18): ${parts.join("; ")}. Parashara has each weighed by the planet's strength (45.19).`;
  };
  if (spoiled.length) push("spoiled", "Houses held by hungry or agitated planets", `${list(spoiled.map((a) => `${a.planet} (${a.lajjitadi.filter((l) => l.name === "Kshudhita" || l.name === "Kshobhita").map((l) => l.name).join(", ")}) in the ${withGloss("parashari", houseOf(a.planet))}`))}: Parashara says the house a Kshudhita or Kshobhita planet occupies is destroyed (45.18); read as the affairs of that house being strained.${weigh(spoiled.map((a) => a.planet))}`, "strain", spoiled.map((a) => a.planet), "18-19", undefined, spoiledPlain());
  {
    const tenth = planets.filter((a) => houseOf(a.planet) === 10 && a.lajjitadi.some((l) => HARSH.includes(l.name)));
    if (tenth.length) F.push({ id: "av-tenth", kind: "yoga", title: "Lajjita, Trushita, Kshudhita or Kshobhita planet in the 10th", text: `${list(tenth.map((a) => a.planet))} in the 10th in such a state: the text says the native meets sorrow; read as strain in work and standing (45.21). The translation leaves out Trushita, which the Sanskrit lists.${weigh(tenth.map((a) => a.planet))}`, tone: "strain", planets: tenth.map((a) => a.planet), source: SK("21"), plain: `${list(tenth.map((a) => a.planet))} in the 10th in a harsh mood: strain in work and standing (45.21).` });
    const fifth = byName("Lajjita").filter((a) => houseOf(a.planet) === 5);
    if (fifth.length) push("fifth", "Lajjita planet in the 5th", `${list(fifth.map((a) => a.planet))} ashamed in the 5th: the text says loss of children, with one always surviving, shown as written; read as strain around children (45.22).${weigh(fifth.map((a) => a.planet))}`, "strain", fifth.map((a) => a.planet), "22", undefined, `${list(fifth.map((a) => a.planet))} ashamed in the 5th: care is needed around children (45.22).`);
    const seventh = planets.filter((a) => houseOf(a.planet) === 7 && a.lajjitadi.some((l) => l.name === "Kshobhita" || l.name === "Trushita"));
    if (seventh.length) push("seventh", "Kshobhita or Trushita planet in the 7th", `${list(seventh.map((a) => a.planet))} in the 7th agitated or thirsty: the text speaks of the spouse's end, shown as written; read as strain on the marriage (45.23).${weigh(seventh.map((a) => a.planet))}`, "strain", seventh.map((a) => a.planet), "23", undefined, `${list(seventh.map((a) => a.planet))} agitated or thirsty in the 7th: strain on the marriage (45.23).`);
  }

  // 45.19-20 per planet: the states qualify the planet and its strength decides which side shows.
  const PLAIN_NAME: Record<string, string> = { Lajjita: "ashamed", Garvita: "proud", Kshudhita: "hungry", Trushita: "thirsty", Mudita: "delighted", Kshobhita: "agitated" };
  const pn = (xs: string[]) => list(xs.map((n) => PLAIN_NAME[n] ?? n));
  const lines: StateLine[] = planets
    .filter((a) => a.lajjitadi.length)
    .map((a) => {
      const pl = a.planet;
      const p = pos(pl);
      const h = houseOf(pl);
      const names = a.lajjitadi.map((l) => l.name);
      const good = names.filter((n) => n === "Garvita" || n === "Mudita");
      const harsh = names.filter((n) => HARSH.includes(n));
      const mixed = good.length > 0 && harsh.length > 0;
      const sb = sbOf(pl);
      const combust = combustP(p);
      const lostWar = defeated.has(pl);
      const strong = strongOf(pl);
      const little = (a.baladi.result === "nil" || a.baladi.result === "negligible") && a.jagradadi.result === "nil";
      // 45.20 names delight (मुदा) joined with the harsh states; a proud planet with a harsh state falls under 45.19.
      const v20 = mixed && names.includes("Mudita");
      const lean: StateLine["lean"] = strong === undefined || !good.length ? undefined : strong ? "good" : v20 ? "loss" : "reduced";
      const tone: Tone = lean === "good" ? "support" : lean === "loss" || (!good.length && harsh.length) ? "strain" : "mixed";
      // Practitioner.
      const lostTxt = [combust ? combustTxt(p) : "", lostWar ? "defeated in planetary war" : ""].filter(Boolean).join(", and ");
      const sbTxt = sb
        ? `Shadbala ${Math.round(sb.total)} of ${Math.round(sb.required)} virupas, ${sb.strong ? "at the requirement" : "short of it"} (27.32-33)${lostTxt ? `; ${lostTxt}, ${sb.strong ? "so counted without strength" : "which also takes strength away"} (6.53, 79.4-5)` : ""}`
        : seven(pl)
          ? "Shadbala not available"
          : "no Shadbala for the nodes (ch. 27 covers the seven planets), so strength does not decide";
      let judge = "";
      if (strong !== undefined) {
        if (mixed) judge = v20 ? (strong ? "Mixed; with strength, great results (45.20)." : "Mixed; without strength, loss (45.20).") : strong ? "Mixed; with strength, greater effects (45.19)." : "Mixed; without strength, the good is reduced (45.19).";
        else if (good.length) judge = strong ? "With strength, greater effects (45.19)." : "Without strength, its good effects are reduced (45.19).";
        else judge = "To be weighed by strength (45.19).";
      } else if (mixed) judge = "Mixed (45.20).";
      const hungry = names.includes("Kshudhita");
      const agitated = names.includes("Kshobhita");
      const spoils = hungry || agitated ? ` Hungry or agitated, it strains the house it holds (45.18): the ${ord(h)}, which covers ${houseGloss("parashari", h)}.` : "";
      const spoilsPlain = spoils ? ` ${hungry && agitated ? "Hunger and agitation put" : hungry ? "Hunger puts" : "Agitation puts"} the house it holds under strain (45.18): the ${ord(h)}, which covers ${houseGloss("parashari", h)}.` : "";
      const grades = `Age ${a.baladi.result}, wakefulness ${a.jagradadi.result} (45.4, 45.6)${little ? ": little comes through either way" : ""}.`;
      const text = `${pl} in the ${ord(h)}: ${names.join(", ")}.${spoils} ${cap(sbTxt)}. ${judge} ${grades}`.replace(/\s+/g, " ").trim();
      // Plain.
      const head = mixed ? `${pl} (${ord(h)} house) is ${pn(good)}, but also ${pn(harsh)}.` : `${pl} (${ord(h)} house) is ${pn(names)}.`;
      const sPlain = !sb
        ? ""
        : strong
          ? "It is strong"
          : sb.strong
            ? combust
              ? "It is strong, but so close to the Sun that it loses strength"
              : "It is strong, but loses a planetary war, which takes strength away"
            : combust
              ? "It is short of strength and close to the Sun"
              : "It is short of strength";
      let jPlain: string;
      if (!sb) jPlain = seven(pl) ? "" : mixed ? "Parashara calls this mixed; he gives no strength measure for the nodes, so which side shows stays open." : "Parashara gives no strength measure for the nodes, so how much shows stays open.";
      else if (mixed) jPlain = `Parashara calls this mixed and lets strength decide. ${sPlain}, so ${strong ? "the good side may weigh more" : "the strain may weigh more"}.`;
      else if (good.length) jPlain = `${sPlain}, so ${strong ? "its good can show fully" : "its good is reduced"}.`;
      else jPlain = `${sPlain}; Parashara asks that this be weighed by strength.`;
      const littlePlain = little ? " Its age and wakefulness say little comes through either way." : "";
      const plain = `${head}${spoilsPlain} ${jPlain}${littlePlain}`.replace(/\s+/g, " ").trim();
      // One line for the period readings.
      const briefJudge = mixed
        ? strong === undefined
          ? "mixed (45.20), strength not measured"
          : v20
            ? strong ? "mixed; with strength, great results (45.20)" : "mixed; without strength, loss (45.20)"
            : strong ? "mixed; with strength, greater effects (45.19)" : "mixed; without strength, the good is reduced (45.19)"
        : good.length
          ? strong === undefined ? "" : strong ? "with strength, greater effects (45.19)" : "without strength, good effects reduced (45.19)"
          : "to be weighed by strength (45.19)";
      const brief = `${names.join(", ")}${briefJudge ? `: ${briefJudge}` : ""}${lostTxt ? `; ${lostTxt}` : ""}${little ? "; age and wakefulness give little" : ""}`;
      const plainJudgeShort = !sb
        ? ""
        : mixed
          ? strong ? "strong, so the good side may weigh more" : `${combust && sb.strong ? "close to the Sun" : "short of strength"}, so the strain may weigh more`
          : good.length
            ? strong ? "strong, so its good can show" : `${combust && sb.strong ? "close to the Sun" : "short of strength"}, so its good is reduced`
            : "";
      const briefPlain = `${mixed ? `${pn(good)}, but also ${pn(harsh)}` : pn(names)}${plainJudgeShort ? `; ${plainJudgeShort}` : ""}${little ? "; little comes through either way" : ""}`;
      const provisional = mixed || Boolean(lostTxt) || !seven(pl);
      return {
        planet: pl,
        house: h,
        names,
        mixed,
        ...(lean ? { lean } : {}),
        tone,
        ...(sb ? { shadbala: { total: sb.total, required: sb.required, strong: sb.strong } } : {}),
        combust,
        defeated: lostWar,
        little,
        text,
        plain,
        brief,
        briefPlain,
        source: v20 ? SK("19-20", provisional) : S(mixed || good.length ? "19" : "18-19", provisional),
      };
    });

  const effects: StateEffect[] = ["Garvita", "Mudita", "Lajjita", "Kshobhita", "Kshudhita", "Trushita"]
    .map((n) => ({ n, holders: byName(n).map((a) => a.planet) }))
    .filter((x) => x.holders.length)
    .map(({ n, holders }) => ({ name: n, verse: LAJJITADI_EFFECTS[n].verse, text: LAJJITADI_EFFECTS[n].text, plain: LAJJITADI_EFFECTS[n].plain, planets: holders, source: S(LAJJITADI_EFFECTS[n].verse) }));
  // General Sayanadi 45.147-155
  for (const a of planets) {
    if (!a.sayanadi) continue;
    const p = pos(a.planet), h = houseOf(a.planet), mal = !isBen(p), n = a.sayanadi.name;
    if (!mal && n === "Sayana") push(`gen-${a.planet}`, `benefic ${a.planet} lying down`, `A benefic in Sayana gives good results (45.147).`, "support", [a.planet], "147");
    if (mal && n === "Bhojana") push(`gen-${a.planet}`, `malefic ${a.planet} eating`, `A malefic in Bhojana spoils the house it holds (45.148): the ${ord(h)}, which covers ${houseGloss("parashari", h)}.`, "strain", [a.planet], "148", undefined, `${thePlanet(a.planet)}, a harsher planet, is in the eating state (Bhojana), which puts the house it holds under strain (45.148): the ${ord(h)}, which covers ${houseGloss("parashari", h)}.`);
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

  return { planets, ghatis, findings: F, lines, effects, caveats: AVASTHA_CAVEATS };
}
