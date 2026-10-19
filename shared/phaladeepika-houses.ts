/**
 * Phaladeepika ch. 8: the nine planets in each of the twelve houses from the lagna, read by
 * placement. The seven planets are here (8.1-24); the nodes (8.25-33) are in parashari-nodes.ts.
 * Text: Mantreswara's Phaladeepika, tr. V. Subrahmanya Sastri (2nd ed., 1950), ch. 8 on wisdomlib.org.
 * The wisdomlib copy lacks the printed page that carries 8.1-3 (the Sun in the 1st to the 7th); those
 * slokas are read from the Sanskrit text at sanskritdocuments.org, and every entry was checked against it.
 *
 * Each entry lists the verse's results, paraphrased in the app's words and never copied. A result carries
 * its direction (+ favourable, - unfavourable, 0 neither), the topics it bears on, a plain wording where
 * the plain reading words it more gently or in today's register, and the sensitive topic that withholds it
 * for a native under the gate age (shared/life-stage.ts). The hardest results are not worded in the plain
 * reading: it names their topic and leaves them to the practitioner reading, as the hard verses elsewhere
 * are handled (gentle.ts). The tone is counted from the results shown: favourable when the unfavourable
 * ones are none or at most a third as many, unfavourable the other way round, mixed otherwise; an entry
 * may state the verse's balance where the count misleads.
 *
 * Conditions the verses state are kept: the Sun in the 1st by sign (8.1), the Moon in the 1st by waxing or
 * waning (8.5), Saturn in the 1st by own sign or exaltation (8.20). The grading of 8.34-35 (the full effect
 * near the middle of the house, less away from it) is not applied: every reading is shown in full.
 */
import { SIGNS, SIGN_LORD, houseFrom, moonWaxing, type Planet, type PlanetPosition } from "./astro";
import { listJoin, ordH, thePlanet } from "./house-gloss";
import type { HouseView } from "./house-view";
import type { SensitiveTag } from "./life-stage";
import type { ParashariFinding, ParashariSource } from "./parashari";
import { KETU, PHALADEEPIKA_CH8_URL, RAHU } from "./parashari-nodes";

export type PlacementTopic =
  | "longevity"
  | "health"
  | "looks"
  | "wealth"
  | "home"
  | "happiness"
  | "learning"
  | "speech"
  | "children"
  | "spouse"
  | "father"
  | "mother"
  | "siblings"
  | "friends"
  | "status"
  | "conduct";

export type SaidPolarity = "+" | "-" | "0";

export interface SaidOpts {
  /** The plain reading's wording, when it is gentler or more modern than the paraphrase. */
  p?: string;
  /** The topics the result bears on. */
  on?: PlacementTopic | PlacementTopic[];
  /** Withheld for a native under the sensitive age, by this topic of the gate. */
  g?: SensitiveTag;
  /** Not worded in the plain reading: it names this topic and leaves the result to the practitioner reading. */
  h?: string;
}

/** One result of a verse: its direction, the app's paraphrase, and how the plain reading and the gate treat it. */
export type Said = [SaidPolarity, string, SaidOpts?];

type Tone = ParashariFinding["tone"];

export interface PlacementEntry {
  /** The sloka of chapter 8: "4" for 8.4. */
  v: string;
  said: Said[];
  /** The verse's balance where a count of its results misleads; not used once the gate removes a result. */
  tone?: Tone;
  /** A remark of the app's on the seat: practitioner wording, then plain. */
  note?: [string, string];
}

/** A verse condition read from the chart, with the sentence that says which case applies (practitioner, plain). */
export type ConditionalEntry = PlacementEntry & { cond: [string, string] };

export type PlacementSlot = PlacementEntry | ((p: PlanetPosition, positions: PlanetPosition[]) => ConditionalEntry);

/** The reading a placement finding carries, after the gate, for the house-by-house prose. */
export interface PlacementReading {
  planet: Planet;
  house: number;
  /** "8.4" */
  verse: string;
  /** The results shown: the paraphrase, the plain wording (null when left to the practitioner reading), direction and topics. */
  said: { t: string; p: string | null; pol: SaidPolarity; on: PlacementTopic[] }[];
  /** Topics of the results the plain reading leaves to the practitioner reading. */
  harder: string[];
  cond?: [string, string];
  note?: [string, string];
  /** Each topic's direction across the results shown. */
  topics: Partial<Record<PlacementTopic, "+" | "-" | "±">>;
}

/** The Sanskrit text, for 8.1-3, which the wisdomlib copy of the translation lacks. */
export const PHALADEEPIKA_SANSKRIT_URL = "https://sanskritdocuments.org/doc_z_misc_sociology_astrology/phaladIpika.html";

export const placementSource = (verse: string): ParashariSource => ({
  label: `Phaladeepika 8.${verse}`,
  url: Number(verse.split("-")[0]) <= 3 ? PHALADEEPIKA_SANSKRIT_URL : PHALADEEPIKA_CH8_URL,
});

export const PLACEMENT_CAVEATS = [
  "Phaladeepika ch. 8 reads each planet by its house from the lagna alone; apart from the three conditions its verses state (the Sun in the 1st by sign, the Moon in the 1st by waxing or waning, Saturn in the 1st by own sign or exaltation), it sets no condition on sign, aspect or strength, and the readings are shown so.",
  "Mantreswara gives a placement its full effect when the planet stands near the middle of the house and less away from it (8.34-35); the app does not scale the readings by that distance.",
  "The wisdomlib copy of Subrahmanya Sastri's translation lacks the page with 8.1-3 (the Sun in the 1st to the 7th); those readings are paraphrased from the Sanskrit text.",
  "Life-length and loss phrases in these verses are placement readings, not the chart's longevity assessment, and they are withheld for a native under the sensitive age.",
];

const OWN_OR_EXALTED_SATURN = [6, 9, 10];

// prettier-ignore
const SUN: PlacementSlot[] = [
  (p) => {
    const bySign: Record<number, Said[]> = {
      3: [["-", "a disease of the eye (a cataract, in Sastri's reading)", { p: "eye complaints", on: "health" }]],
      0: [["-", "dim sight (timira)", { p: "weak eyesight", on: "health" }]],
      4: [["-", "night blindness", { p: "poor sight at night", on: "health" }]],
      6: [["-", "poverty", { p: "strain on money", on: "wealth" }], ["-", "the loss of children", { on: "children", g: "child-loss", h: "children" }]],
    };
    const extra = bySign[p.signIndex] ?? [];
    const sign = SIGNS[p.signIndex];
    return {
      v: "1",
      said: [
        ["-", "thin hair", { on: "looks" }],
        ["-", "great sloth in action", { p: "a slow start in getting things done" }],
        ["-", "a hot temper and a fierce manner", { p: "a quick temper" }],
        ["0", "a tall build"],
        ["0", "pride", { p: "strong self-regard" }],
        ["-", "rough eyes", { p: "eyes that need care", on: "health" }],
        ["0", "a lean body"],
        ["+", "courage"],
        ["-", "impatience"],
        ["-", "a merciless streak", { p: "a hard edge with others" }],
        ...extra,
      ],
      cond: extra.length
        ? [`In ${sign} the verse adds the sign's own result.`, `For the Sun in ${sign}, Mantreswara adds a result of that sign.`]
        : [`The verse adds results for Cancer, Aries, Leo and Libra; the Sun here is in ${sign}, so none applies.`, ""],
    };
  },
  { v: "2", said: [["-", "little learning, modesty or wealth", { p: "strain on learning, manners and money", on: ["learning", "wealth"] }], ["-", "faltering speech", { p: "speech that can falter", on: "speech" }]] },
  { v: "2", said: [["+", "strength"], ["+", "courage"], ["+", "wealth", { on: "wealth" }], ["+", "a generous nature"], ["-", "enmity with one's own people", { p: "friction with your own relatives" }]] },
  { v: "2", said: [["-", "no comfort, kin, land, friends or home", { p: "strain on comforts, family ties, property, friendships and home", on: ["happiness", "home", "friends"] }], ["0", "service under the ruler", { p: "work for the government or for those in power", on: "status" }], ["-", "the father's property spent", { p: "inherited wealth spent", on: "wealth" }]] },
  { v: "3", said: [["-", "little happiness or wealth", { p: "strain on happiness and money", on: ["happiness", "wealth"] }], ["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["-", "no sons", { on: "children", g: "child-loss", h: "children" }], ["+", "a good mind", { on: "learning" }], ["0", "roaming in forest country", { p: "travel through wild country" }]] },
  { v: "3", said: [["+", "kingship", { p: "high standing", on: "status" }], ["+", "renown"], ["+", "good qualities"], ["+", "wealth", { on: "wealth" }], ["+", "victory", { p: "success over rivals" }]] },
  { v: "3", said: [["-", "the ruler's displeasure", { p: "friction with those in authority", on: "status" }], ["-", "a poorly formed body", { p: "a body that needs care", on: "health" }], ["0", "a wandering life", { p: "much travel" }], ["-", "no wife", { on: "spouse", g: "spouse-loss", h: "marriage" }], ["-", "humiliation", { p: "loss of face at times" }]] },
  { v: "3", said: [["-", "loss of wealth and friends", { p: "strain on money and friendships", on: ["wealth", "friends"] }], ["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["-", "failing sight or blindness", { p: "eyes that need care", on: "health" }]] },
  { v: "4", tone: "mixed", said: [["-", "the loss of the father", { on: "father", g: "parent-loss", h: "the father" }], ["+", "children", { on: "children" }], ["+", "kin"], ["+", "devotion to the gods and the learned", { p: "religious devotion" }]] },
  { v: "4", said: [["+", "sons", { p: "children", on: "children" }], ["+", "vehicles", { on: "home" }], ["+", "praise"], ["+", "intelligence", { on: "learning" }], ["+", "wealth", { on: "wealth" }], ["+", "strength"], ["+", "fame"], ["+", "kingship", { p: "a position of authority", on: "status" }]] },
  { v: "4", said: [["+", "great wealth", { on: "wealth" }], ["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "freedom from sorrow", { on: "happiness" }], ["+", "rule over people", { p: "a leading place among people", on: "status" }]] },
  { v: "4", said: [["-", "enmity with the father", { p: "friction with your father", on: "father" }], ["-", "faulty eyes", { p: "eyes that need care", on: "health" }], ["-", "want of wealth", { p: "strain on money", on: "wealth" }], ["-", "no children", { on: "children", g: "child-loss", h: "children" }]] },
];

// prettier-ignore
const MOON: PlacementSlot[] = [
  (_p, positions) => {
    const waxing = moonWaxing(positions);
    return waxing
      ? {
          v: "5",
          said: [["+", "a sturdy body", { on: "health" }], ["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "fearlessness"], ["+", "great strength"], ["+", "wealth", { on: "wealth" }]],
          cond: ["The Moon is waxing; 8.5 gives this for a waxing Moon and the reverse for a waning one.", "Your Moon is waxing, the case Mantreswara reads well."],
        }
      : {
          v: "5",
          said: [["-", "a frail body", { p: "a body that needs care", on: "health" }], ["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["-", "fearfulness", { p: "a worried mind" }], ["-", "little strength", { p: "strength to build" }], ["-", "want", { p: "strain on money", on: "wealth" }]],
          cond: ["The Moon is waning, and 8.5 reverses its reading for a waxing Moon.", "Your Moon is waning, so Mantreswara's reading for a waxing Moon is reversed."],
        };
  },
  { v: "5", said: [["+", "wealth", { on: "wealth" }], ["+", "learning or a soft voice", { on: "learning" }], ["0", "a taste for the pleasures of the senses", { p: "a love of comforts" }], ["-", "a flaw in speech (vachi vikala; Sastri reads a defective limb)", { p: "speech that needs care", on: "speech" }]] },
  { v: "5", said: [["+", "brothers", { p: "brothers and sisters", on: "siblings" }], ["-", "a strong pull towards women (lascivious, in Sastri's word)", { p: "a strong pull towards romance", g: "intimacy" }], ["+", "strength"], ["+", "valour"], ["-", "great miserliness", { p: "a very tight hold on money" }]] },
  { v: "6", said: [["+", "happiness", { on: "happiness" }], ["+", "enjoyment"], ["+", "generosity"], ["+", "friends", { on: "friends" }], ["+", "vehicles", { on: "home" }], ["+", "renown"]] },
  { v: "6", said: [["+", "good sons", { p: "good children", on: "children" }], ["+", "a sharp intellect", { on: "learning" }], ["0", "a gentle gait"], ["+", "a minister's post", { p: "a senior advisory post", on: "status" }]] },
  { v: "6", said: [["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["-", "a dull mind", { p: "a slower wit", on: "learning" }], ["-", "stomach trouble", { p: "a sensitive stomach", on: "health" }], ["-", "humiliation", { p: "loss of face at times" }]] },
  { v: "6", said: [["+", "a pleasing look", { on: "looks" }], ["+", "the love of a beautiful young woman", { p: "a loving and attractive partner", on: "spouse" }], ["+", "great charm"]] },
  { v: "7", said: [["-", "illness", { p: "health that needs care", on: "health" }], ["-", "a short life", { on: "longevity", g: "longevity", h: "health" }]] },
  { v: "7", said: [["+", "good fortune"], ["+", "a virtuous nature", { on: "conduct" }], ["+", "children", { on: "children" }], ["+", "victory", { p: "success" }], ["+", "undertakings that succeed from the outset"]] },
  { v: "7", said: [["+", "good deeds", { on: "conduct" }], ["+", "kindness to the virtuous", { p: "help given to good people" }]] },
  { v: "7", said: [["+", "a lofty mind"], ["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "wealth", { on: "wealth" }], ["+", "children", { on: "children" }], ["+", "servants"]] },
  { v: "7", said: [["-", "dislike from others", { p: "friction with others" }], ["-", "sorrow", { p: "low spirits at times", on: "happiness" }], ["-", "humiliation", { p: "loss of face at times" }], ["-", "extreme idleness", { p: "a tendency to inertia" }]] },
];

// prettier-ignore
const MARS: PlacementSlot[] = [
  { v: "8", said: [["-", "an injured body", { p: "a body prone to cuts and knocks", on: "health", g: "peril" }], ["-", "great cruelty", { p: "a hard temper" }], ["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["+", "great daring", { p: "boldness" }]] },
  { v: "8", said: [["-", "an unpleasant face or speech", { p: "a blunt manner", on: "speech" }], ["-", "no learning or wealth", { p: "strain on learning and money", on: ["learning", "wealth"] }], ["-", "reliance on bad people", { p: "leaning on the wrong people" }]] },
  { v: "8", said: [["+", "good qualities"], ["+", "wealth", { on: "wealth" }], ["+", "bravery"], ["+", "being hard to overcome"], ["+", "happiness", { on: "happiness" }], ["-", "no younger brother", { p: "few younger siblings", on: "siblings" }]] },
  { v: "8", said: [["-", "no friends", { p: "strain on friendships", on: "friends" }], ["-", "the loss of the mother", { on: "mother", g: "parent-loss", h: "the mother" }], ["-", "no land, comfort, home or vehicles", { p: "strain on property, comforts, home and vehicles", on: ["home", "happiness"] }]] },
  { v: "9", said: [["-", "unhappiness", { p: "low spirits at times", on: "happiness" }], ["-", "no children", { on: "children", g: "child-loss", h: "children" }], ["-", "many misfortunes", { p: "setbacks" }], ["-", "tale-bearing", { p: "loose talk" }], ["-", "a weak mind", { p: "a slower wit", on: "learning" }]] },
  { v: "9", said: [["0", "strong desire (smitten with love, in Sastri's words)", { p: "strong passions", g: "intimacy" }], ["+", "wealth", { on: "wealth" }], ["+", "fame"], ["+", "kingship", { p: "high standing", on: "status" }], ["+", "victory", { p: "success over rivals" }]] },
  { v: "9", said: [["-", "improper acts", { p: "missteps in conduct", on: "conduct" }], ["-", "suffering from illness", { p: "health that needs care", on: "health" }], ["0", "life on the road", { p: "much travel" }], ["-", "the loss of the wife", { on: "spouse", g: "spouse-loss", h: "marriage" }]] },
  { v: "9", said: [["-", "a poorly formed body", { p: "a body that needs care", on: "health" }], ["-", "poverty", { p: "strain on money", on: "wealth" }], ["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["-", "people's censure", { p: "criticism from others" }]] },
  { v: "10", said: [["+", "the ruler's friendship", { p: "friends among those in power", on: "status" }], ["-", "the dislike of others", { p: "friction with others" }], ["-", "the loss of the father", { on: "father", g: "parent-loss", h: "the father" }], ["-", "violence against people (homicide, in Sastri's word)", { on: "conduct", g: "peril", h: "conduct" }]] },
  { v: "10", said: [["+", "kingship", { p: "a position of authority", on: "status" }], ["-", "harshness", { p: "a hard edge" }], ["+", "generosity"], ["+", "praise from leading people"]] },
  { v: "10", said: [["+", "wealth", { on: "wealth" }], ["+", "happiness", { on: "happiness" }], ["+", "freedom from sorrow"], ["+", "bravery"], ["+", "good character", { on: "conduct" }]] },
  { v: "10", said: [["-", "eye trouble", { p: "eyes that need care", on: "health" }], ["-", "cruelty", { p: "a hard temper" }], ["-", "no wife", { on: "spouse", g: "spouse-loss", h: "marriage" }], ["-", "tale-bearing", { p: "loose talk" }], ["-", "a base nature", { p: "a mean streak", on: "conduct" }]] },
];

// prettier-ignore
const MERCURY: PlacementSlot[] = [
  { v: "11", said: [["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "sweet and clever speech", { on: "speech" }], ["+", "learning in all the sciences", { p: "wide learning", on: "learning" }]] },
  { v: "11", said: [["+", "wealth earned by one's own intellect", { p: "wealth earned by your own wits", on: "wealth" }], ["+", "a poet's gift"], ["+", "clear and pleasing speech", { on: "speech" }], ["+", "fine food"]] },
  { v: "11", said: [["+", "bravery"], ["0", "a middle span of life", { p: "an average span of life", on: "longevity", g: "longevity" }], ["+", "good brothers", { p: "good brothers and sisters", on: "siblings" }], ["-", "toil", { p: "tiredness" }], ["-", "dejection", { p: "low spirits at times" }]] },
  { v: "11", said: [["+", "learning", { on: "learning" }], ["+", "witty speech", { on: "speech" }], ["+", "happiness", { on: "happiness" }], ["+", "friends", { on: "friends" }], ["+", "land", { on: "home" }], ["+", "grain"], ["+", "wealth", { on: "wealth" }], ["+", "enjoyment"]] },
  { v: "12", said: [["+", "learning", { on: "learning" }], ["+", "happiness", { on: "happiness" }], ["+", "courage"], ["+", "many children", { on: "children" }], ["0", "skill in mantras (charms or spells, in Sastri's words)", { p: "skill with sacred chants" }]] },
  { v: "12", said: [["-", "anger stirred by quarrels", { p: "a temper roused by disputes" }], ["+", "the defeat of enemies", { p: "the upper hand over rivals" }], ["-", "idleness", { p: "a tendency to inertia" }], ["-", "harsh words", { p: "blunt speech", on: "speech" }]] },
  { v: "12", said: [["+", "wisdom", { on: "learning" }], ["+", "fine dress"], ["+", "greatness in every way"], ["+", "a wealthy wife", { p: "a well-off partner", on: "spouse" }]] },
  { v: "12", said: [["+", "wide renown"], ["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "support of the family"], ["+", "lordship and command of an army", { p: "a leading role, in command of others", on: "status" }]] },
  { v: "13", said: [["+", "learning", { on: "learning" }], ["+", "wealth", { on: "wealth" }], ["+", "good conduct", { on: "conduct" }], ["+", "piety"], ["+", "skill"], ["+", "great eloquence", { on: "speech" }]] },
  { v: "13", said: [["+", "success in one's undertakings", { p: "success in what you take on", on: "status" }], ["+", "good learning", { on: "learning" }], ["+", "strength"], ["+", "intelligence"], ["+", "happiness", { on: "happiness" }], ["+", "good deeds", { on: "conduct" }], ["+", "truthfulness"]] },
  { v: "13", said: [["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "truthfulness"], ["+", "great wealth", { on: "wealth" }], ["+", "happiness", { on: "happiness" }], ["+", "servants"]] },
  { v: "13", said: [["-", "dejection", { p: "low spirits at times" }], ["-", "little learning", { p: "learning that comes hard", on: "learning" }], ["-", "humiliation", { p: "loss of face at times" }], ["-", "cruelty", { p: "a hard streak" }], ["-", "idleness", { p: "a tendency to inertia" }]] },
];

// prettier-ignore
const JUPITER: PlacementSlot[] = [
  { v: "14", said: [["+", "good looks", { on: "looks" }], ["+", "merit from good deeds", { on: "conduct" }], ["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "fearlessness"], ["+", "children", { on: "children" }]] },
  { v: "14", said: [["+", "eloquence", { on: "speech" }], ["+", "a taste for good food"], ["+", "a pleasing face", { on: "looks" }], ["+", "wealth", { on: "wealth" }], ["+", "learning", { on: "learning" }]] },
  { v: "14", said: [["-", "contempt from others", { p: "slights from others" }], ["-", "miserliness", { p: "a tight hold on money" }], ["+", "a well-known brother", { on: "siblings" }], ["-", "sinful acts", { p: "lapses in conduct", on: "conduct" }], ["-", "a wicked mind", { on: "conduct", h: "conduct" }]] },
  { v: "14", said: [["+", "a life among mother, friends, attendants, sons and wife", { p: "a home shared with your mother, friends, helpers, children and partner", on: ["mother", "children", "spouse", "home"] }], ["+", "grain"], ["+", "happiness", { on: "happiness" }]] },
  { v: "15", said: [["-", "distress through sons", { p: "worries through children", on: "children" }], ["+", "intelligence", { on: "learning" }], ["+", "the post of a ruler's adviser", { p: "a role advising people in power", on: "status" }]] },
  { v: "15", said: [["-", "great idleness", { p: "a tendency to inertia" }], ["+", "the destruction of enemies", { p: "the upper hand over rivals" }], ["-", "disrespect", { p: "slights from others" }], ["0", "skill in spells and exorcism", { p: "skill with charms and rites" }]] },
  { v: "15", said: [["+", "a good wife", { p: "a good partner", on: "spouse" }], ["+", "sons", { p: "children", on: "children" }], ["+", "great charm"], ["+", "generosity beyond the father's", { p: "more generosity than your father" }]] },
  { v: "15", said: [["-", "poverty", { p: "strain on money", on: "wealth" }], ["-", "a living earned as a menial", { p: "work in the service of others", on: "status" }], ["-", "sinfulness", { p: "lapses in conduct", on: "conduct" }], ["+", "a long life", { on: "longevity", g: "longevity" }]] },
  { v: "16", said: [["+", "renown"], ["+", "a minister's post", { p: "a senior post", on: "status" }], ["+", "wealth", { on: "wealth" }], ["+", "sons", { p: "children", on: "children" }], ["+", "eagerness for good works", { on: "conduct" }]] },
  { v: "16", said: [["+", "right conduct", { on: "conduct" }], ["+", "good fame"], ["+", "great wealth", { on: "wealth" }], ["+", "the ruler's favour", { p: "the favour of those in power", on: "status" }]] },
  { v: "16", said: [["+", "wealth", { on: "wealth" }], ["+", "fearlessness"], ["-", "few children", { p: "a small family", on: "children" }], ["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "travel in vehicles", { p: "vehicles", on: "home" }]] },
  { v: "16", said: [["-", "dislike from others", { p: "friction with others" }], ["-", "a foul tongue", { p: "harsh speech", on: "speech" }], ["-", "no children", { on: "children", g: "child-loss", h: "children" }], ["-", "sinfulness", { p: "lapses in conduct", on: "conduct" }], ["-", "idleness", { p: "a tendency to inertia" }], ["-", "a menial's lot", { p: "work in the service of others", on: "status" }]] },
];

// prettier-ignore
const VENUS: PlacementSlot[] = [
  { v: "17", said: [["+", "a healthy and handsome body", { on: ["health", "looks"] }], ["+", "happiness", { on: "happiness" }], ["+", "a long life", { on: "longevity", g: "longevity" }]] },
  { v: "17", said: [["+", "a poet's gift"], ["+", "wealth of many kinds", { on: "wealth" }]] },
  { v: "17", said: [["-", "no wife", { on: "spouse", g: "spouse-loss", h: "marriage" }], ["-", "unhappiness", { p: "low spirits at times", on: "happiness" }], ["-", "want", { p: "strain on money", on: "wealth" }], ["-", "miserliness", { p: "a tight hold on money" }], ["-", "unpopularity", { p: "friction with others" }]] },
  { v: "17", said: [["+", "good vehicles", { on: "home" }], ["+", "a good house", { on: "home" }], ["+", "jewels"], ["+", "clothes"], ["+", "scents"]] },
  { v: "18", said: [["+", "unbroken wealth", { on: "wealth" }], ["+", "a ruler's standing (protecting others, in Sastri's words)", { p: "standing and the means to protect others", on: "status" }], ["+", "wisdom", { on: "learning" }], ["+", "children", { on: "children" }]] },
  { v: "18", said: [["+", "no enemies"], ["-", "no wealth", { p: "strain on money", on: "wealth" }], ["-", "corruption by young women", { p: "trouble through romance", g: "intimacy", on: "conduct" }], ["-", "grief", { p: "low spirits at times" }]] },
  { v: "18", said: [["+", "a good wife", { p: "a good partner", on: "spouse" }], ["-", "liaisons with unchaste women", { on: "spouse", g: "intimacy", h: "marriage" }], ["-", "the loss of a wife", { on: "spouse", g: "spouse-loss", h: "marriage" }], ["+", "wealth", { on: "wealth" }]] },
  { v: "18", said: [["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "wealth", { on: "wealth" }], ["+", "rule over land", { p: "a position of authority", on: "status" }]] },
  { v: "19", said: [["+", "a wife", { p: "a partner", on: "spouse" }], ["+", "friends", { on: "friends" }], ["+", "sons", { p: "children", on: "children" }], ["+", "fortune through the ruler's favour", { p: "good fortune through those in power", on: "status" }]] },
  { v: "19", said: [["+", "great fame"], ["+", "friends", { on: "friends" }], ["+", "a happy livelihood", { p: "work that suits you", on: "status" }], ["+", "lordship", { p: "authority", on: "status" }]] },
  { v: "19", said: [["+", "great wealth", { on: "wealth" }], ["-", "a taste for other women", { on: "spouse", g: "intimacy", h: "marriage" }], ["+", "many comforts", { on: "happiness" }]] },
  { v: "19", said: [["0", "the pleasures of love", { p: "joy in love", g: "intimacy" }], ["+", "wealth", { on: "wealth" }], ["+", "splendour"]] },
];

// prettier-ignore
const SATURN: PlacementSlot[] = [
  (p) => {
    const sign = SIGNS[p.signIndex];
    return OWN_OR_EXALTED_SATURN.includes(p.signIndex)
      ? {
          v: "20",
          said: [["+", "standing equal to a ruler's", { p: "standing close to that of a ruler", on: "status" }], ["+", "the headship of a district or a city", { p: "a leading civic role", on: "status" }]],
          cond: [`Saturn rises in ${sign}, ${p.signIndex === 6 ? "its exaltation" : "its own sign"}, the case 8.20 reads well.`, `Saturn rises in ${sign}, ${p.signIndex === 6 ? "where it is exalted" : "one of its own signs"}, the case Mantreswara reads well.`],
        }
      : {
          v: "20",
          said: [["-", "sorrow and trouble from childhood", { p: "a hard start in childhood", on: "happiness" }], ["-", "poverty", { p: "strain on money", on: "wealth" }], ["-", "untidiness", { p: "carelessness in appearance" }], ["-", "idleness", { p: "a tendency to inertia" }]],
          cond: [`Saturn rises in ${sign}, neither its own sign nor its exaltation, the case 8.20 reads as hard.`, `Saturn rises in ${sign}, not one of its own signs, the case Mantreswara reads as hard.`],
        };
  },
  { v: "21", tone: "mixed", said: [["-", "an ugly face", { p: "plain looks", on: "looks" }], ["-", "want of wealth", { p: "strain on money", on: "wealth" }], ["-", "unjust ways", { p: "lapses in conduct", on: "conduct" }], ["+", "later in life, a home abroad with vehicles, wealth and comforts", { p: "later in life, a home in another land with vehicles, wealth and comforts", on: ["wealth", "home"] }]] },
  { v: "21", said: [["+", "a broad mind", { on: "learning" }], ["+", "generosity"], ["+", "happiness with the wife", { p: "happiness with your partner", on: "spouse" }], ["-", "idleness", { p: "a tendency to inertia" }], ["-", "sorrow", { p: "low spirits at times" }]] },
  { v: "22", said: [["-", "unhappiness", { p: "low spirits at times", on: "happiness" }], ["-", "no home or vehicles", { p: "strain on home and vehicles", on: "home" }], ["-", "separation from the mother", { on: "mother", g: "parent-loss", h: "the mother" }], ["-", "illness in childhood", { p: "health that needs care in the early years", on: "health" }]] },
  { v: "22", said: [["-", "a confused mind", { p: "a restless mind" }], ["-", "little knowledge, wealth or joy", { p: "strain on learning, money and happiness", on: ["learning", "wealth", "happiness"] }], ["-", "no children", { on: "children", g: "child-loss", h: "children" }], ["-", "deceit and an evil mind", { on: "conduct", h: "conduct" }]] },
  { v: "22", said: [["0", "a large appetite", { p: "a hearty appetite" }], ["+", "wealth", { on: "wealth" }], ["-", "defeat by enemies (ripuhata, as Sastri reads it)", { p: "trouble from rivals" }], ["0", "stubbornness"], ["+", "self-respect"]] },
  { v: "22", said: [["-", "a bad wife", { p: "strain in the marriage", on: "spouse" }], ["-", "poverty", { p: "strain on money", on: "wealth" }], ["0", "wandering", { p: "much travel" }], ["-", "distress", { p: "low spirits at times" }]] },
  { v: "23", said: [["-", "uncleanliness", { p: "carelessness in habits" }], ["-", "piles", { p: "a health complaint to watch (piles)", on: "health" }], ["-", "want of wealth", { p: "strain on money", on: "wealth" }], ["-", "a harsh mind", { p: "a hard temper" }], ["-", "hunger", { p: "lean times" }], ["-", "contempt from friends", { p: "friction with friends", on: "friends" }]] },
  { v: "24", said: [["-", "want of fortune and wealth", { p: "strain on fortune and money", on: "wealth" }], ["-", "no children", { on: "children", g: "child-loss", h: "children" }], ["-", "the loss of the father", { on: "father", g: "parent-loss", h: "the father" }], ["-", "want of religious merit", { p: "little pull towards religion", on: "conduct" }], ["-", "wickedness", { on: "conduct", h: "conduct" }]] },
  { v: "24", said: [["+", "kingship or a minister's post", { p: "a position of authority or a senior post", on: "status" }], ["+", "wealth", { on: "wealth" }], ["0", "devotion to farming", { p: "work on the land" }], ["+", "bravery"], ["+", "renown"]] },
  { v: "24", said: [["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "lasting wealth", { on: "wealth" }], ["+", "a good income", { on: "wealth" }], ["+", "bravery"], ["+", "freedom from disease", { p: "good health", on: "health" }]] },
  { v: "24", said: [["-", "shamelessness", { p: "brashness" }], ["-", "want of wealth", { p: "strain on money", on: "wealth" }], ["-", "no children", { on: "children", g: "child-loss", h: "children" }], ["-", "a defective limb", { p: "a body that needs care", on: "health" }], ["-", "foolishness", { p: "poor judgement at times" }], ["-", "expulsion by enemies", { p: "trouble from rivals" }]] },
];

export const PLACEMENT_TABLE: Record<Planet, PlacementSlot[]> = {
  Sun: SUN,
  Moon: MOON,
  Mars: MARS,
  Mercury: MERCURY,
  Jupiter: JUPITER,
  Venus: VENUS,
  Saturn: SATURN,
  Rahu: RAHU,
  Ketu: KETU,
};

const NINE: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const NODES = new Set<Planet>(["Rahu", "Ketu"]);

/** The entry for a planet in a house, with its verse condition read from the chart. */
export function placementEntry(planet: Planet, house: number, p: PlanetPosition, positions: PlanetPosition[]): PlacementEntry & { cond?: [string, string] } {
  const slot = PLACEMENT_TABLE[planet][house - 1];
  return typeof slot === "function" ? slot(p, positions) : slot;
}

const topicsOf = (s: Said): PlacementTopic[] => {
  const on = s[2]?.on;
  return on === undefined ? [] : Array.isArray(on) ? on : [on];
};

/** Favourable when the unfavourable results are none or at most a third as many; unfavourable the other way round. */
export function toneOfSaid(said: Said[]): Tone {
  const pos = said.filter((s) => s[0] === "+").length;
  const neg = said.filter((s) => s[0] === "-").length;
  if (neg === 0 && pos === 0) return "mixed";
  if (neg === 0 || pos >= 3 * neg) return "support";
  if (pos === 0 || neg >= 3 * pos) return "strain";
  return "mixed";
}

/** The reading of one placement after the gate, or null when the gate leaves nothing of it. */
export function placementReading(
  planet: Planet,
  house: number,
  p: PlanetPosition,
  positions: PlanetPosition[],
  withhold: boolean,
): (PlacementReading & { tone: Tone }) | null {
  const e = placementEntry(planet, house, p, positions);
  const kept = withhold ? e.said.filter((s) => !s[2]?.g) : e.said;
  if (!kept.length) return null;
  const topics: PlacementReading["topics"] = {};
  for (const s of kept) {
    if (s[0] === "0") continue;
    for (const t of topicsOf(s)) {
      const was = topics[t];
      topics[t] = was === undefined || was === s[0] ? s[0] : "±";
    }
  }
  const harder = Array.from(new Set(kept.flatMap((s) => (s[2]?.h ? [s[2].h] : []))));
  const condApplies = e.cond && (e.cond[0] || e.cond[1]);
  return {
    planet,
    house,
    verse: `8.${e.v}`,
    said: kept.map((s) => ({ t: s[1], p: s[2]?.h ? null : (s[2]?.p ?? s[1]), pol: s[0], on: topicsOf(s) })),
    harder,
    ...(condApplies ? { cond: e.cond } : {}),
    ...(e.note ? { note: e.note } : {}),
    topics,
    tone: kept.length === e.said.length && e.tone ? e.tone : toneOfSaid(kept),
  };
}

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A list of results: commas, an Oxford comma when a result has its own "and", semicolons when one has a comma. */
function joinResults(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  const head = xs.slice(0, -1), last = xs[xs.length - 1];
  const bare = xs.map((x) => x.replace(/\s*\([^)]*\)/g, ""));
  if (bare.some((x) => x.includes(", "))) return `${head.join("; ")}; and ${last}`;
  if (bare.some((x) => x.includes(" and "))) return `${head.join(", ")}, and ${last}`;
  return listJoin(xs);
}

/**
 * The results as one sentence, the favourable first and the hard after "but also", or the hard first and the
 * favourable after "though also" when the hard are more; results that are neither go with the first group.
 */
function readsSentence(items: { text: string; pol: SaidPolarity }[]): string {
  const good = items.filter((i) => i.pol === "+").map((i) => i.text);
  const hard = items.filter((i) => i.pol === "-").map((i) => i.text);
  const neither = items.filter((i) => i.pol === "0").map((i) => i.text);
  const goodFirst = good.length >= hard.length;
  const first = [...(goodFirst ? good : hard), ...neither];
  const second = goodFirst ? hard : good;
  if (!first.length) return joinResults(second);
  return second.length ? `${joinResults(first)}, ${goodFirst ? "but also" : "though also"} ${joinResults(second)}` : joinResults(first);
}

/** "Mantreswara reads a and b, but also c." in the practitioner's words. */
export function readsPractitioner(r: PlacementReading): string {
  return `Mantreswara reads ${readsSentence(r.said.map((s) => ({ text: s.t, pol: s.pol })))}.`;
}

/** The same in plain words: the gentle wordings, then the topics left to the practitioner reading. */
export function readsPlain(r: PlacementReading): string {
  const shown = r.said.flatMap((s) => (s.p === null ? [] : [{ text: s.p, pol: s.pol }]));
  const harder = r.harder.length
    ? `a harder line${shown.length ? "" : " here"} ${listJoin(r.harder.map((h) => `on ${h}`))}, given in full in the practitioner view`
    : "";
  if (shown.length && harder) return `Mantreswara reads ${readsSentence(shown)}, and has ${harder}.`;
  if (shown.length) return `Mantreswara reads ${readsSentence(shown)}.`;
  return `Mantreswara has ${harder}.`;
}

/**
 * Phaladeepika 8.1-33 for the chart: one finding per planet, in the house the chart's house method gives it.
 * A native under the sensitive age gets only the results the gate allows (`withhold`).
 */
export function placementFindings(
  positions: PlanetPosition[],
  view: HouseView,
  lagnaIdx: number,
  withhold: boolean,
): ParashariFinding[] {
  const F: ParashariFinding[] = [];
  const chalit = view.method !== "rashi";
  const methodName = view.method === "sripati" ? "Sripati" : "equal";
  for (const planet of NINE) {
    const p = positions.find((x) => x.planet === planet);
    if (!p) continue;
    const h = view.houseOf(p);
    const r = placementReading(planet, h, p, positions, withhold);
    if (!r) continue;
    const { tone, ...reading } = r;
    const sign = SIGNS[p.signIndex];
    const node = NODES.has(planet);
    const where = node ? `in ${sign}, ${SIGN_LORD[p.signIndex]}'s sign` : `in ${sign}`;
    const src: ParashariSource = placementSource(r.verse.slice(2));
    const rashiH = houseFrom(lagnaIdx, p.signIndex);
    // A bhava placement the same as the whole-sign house reads as the verse states it.
    const moved = chalit && rashiH !== h;
    if (moved) {
      src.label += ", bhava-chalit placement";
      src.provisional = true;
    }
    const cond = r.cond ? [r.cond[0], r.cond[1]] : ["", ""];
    const note = r.note ?? ["", ""];
    F.push({
      id: node ? `pa-node-${planet.toLowerCase()}` : `pa-pd8-${planet.toLowerCase()}`,
      kind: "house",
      house: h,
      title: `${planet} in the ${ordH(h)}`,
      titlePlain: `${capFirst(thePlanet(planet))} in your ${ordH(h)} house`,
      text: [
        `${capFirst(thePlanet(planet))} is in the ${ordH(h)}, ${where}.`,
        cond[0],
        readsPractitioner(reading),
        note[0],
        moved
          ? `Read in the ${ordH(h)} bhava of the ${methodName} construction; by whole sign ${thePlanet(planet)} is in the ${ordH(rashiH)}. Phaladeepika states the result by sign from the lagna, so this is a bhava-chalit reinterpretation, provisional.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      textPlain: [
        `${capFirst(thePlanet(planet))} is in your ${ordH(h)} house, ${where}.`,
        cond[1],
        readsPlain(reading),
        note[1],
        moved ? `This uses the ${methodName} house division; by whole sign it falls in your ${ordH(rashiH)}, and Mantreswara counts by sign, so the reading is provisional.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      tone,
      planets: [planet],
      source: src,
      placement: reading,
    });
  }
  return F;
}
