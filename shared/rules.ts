// Declarative Bhrigu Nandi Nadi rules engine.
// Rules are data. The engine evaluates planet-to-planet relations by sign
// (conjunction, 2nd/12th adjacency, trines, 7th) with the BNN retrograde rule:
// a retrograde classical planet also acts from the previous sign.

import {
  type Planet,
  type PlanetPosition,
  type Relation,
  type Dignity,
  relationOf,
  SIGN_LORD,
  SIGN_ELEMENT,
  KARAKA,
  SIGNS,
  houseFrom,
} from "./astro";
import { EXTRA_RULES } from "./rules-bnn";
import { FEMALE_RULES, MALE_FRAME_IDS } from "./rules-female";
import { CHILDREN_RULES } from "./rules-children";
import { HOUSE_RULES } from "./rules-houses";
import { assessChildren, type ChildrenReading } from "./children";
import { assessLakshmi, type LakshmiReading } from "./lakshmi";
import { assessStrength, type PlanetStrength } from "./strength";
import {
  degreeChains,
  directionClause,
  flowBetween,
  readsFromPreviousSign,
  sameFlow,
  tierLabel,
  type DegreeChain,
  type Flow,
} from "./flow";
import {
  GRADE_CEILING,
  GRADE_FLOOR,
  levelOf,
  type Grade,
  type GradeReason,
} from "./grade";
import { assessMarriage, type Gender, type MarriageReading } from "./marriage";

export type LifeArea =
  | "self"
  | "career"
  | "authority"
  | "marriage"
  | "children"
  | "wealth"
  | "education"
  | "family"
  | "health"
  | "spirituality"
  | "travel";

export const LIFE_AREAS: Record<LifeArea, { label: string; karaka: Planet }> = {
  self: { label: "Self & temperament", karaka: "Jupiter" },
  career: { label: "Career & livelihood", karaka: "Saturn" },
  authority: { label: "Standing & authority", karaka: "Sun" },
  marriage: { label: "Marriage & partnership", karaka: "Venus" },
  children: { label: "Children & progeny", karaka: "Jupiter" },
  wealth: { label: "Wealth & assets", karaka: "Jupiter" },
  education: { label: "Education & intellect", karaka: "Mercury" },
  family: { label: "Parents & family", karaka: "Sun" },
  health: { label: "Health & vitality", karaka: "Sun" },
  spirituality: { label: "Spiritual path", karaka: "Ketu" },
  travel: { label: "Travel & foreign ties", karaka: "Rahu" },
};

export interface RuleCondition {
  subject: Planet;
  object?: Planet;
  relation?: Relation[]; // default ["conjunct"]
  /** Further planets that must also relate to the subject (three- and four-planet yogas). */
  with?: Array<{ planet: Planet; relation?: Relation[] }>;
  /** Subject and object occupy each other's signs (parivartana). */
  exchange?: boolean;
  /** No other planet conjunct, in the 2nd or in the 12th from the subject. */
  alone?: boolean;
  /** Object sits in one of these whole-sign houses counted from the subject (1 = same sign). Replaces `relation`. */
  house?: number[];
  subjectRetro?: boolean;
  subjectDignity?: Dignity[];
  subjectSign?: number[]; // 0 = Aries
  subjectSignLord?: Planet[];
  subjectNakshatraLord?: Planet[];
  subjectElement?: Array<"Fire" | "Earth" | "Air" | "Water">;
  subjectCombust?: boolean;
}

export interface Rule {
  id: string;
  area: LifeArea;
  when: RuleCondition;
  text: string;
  weight: 1 | 2 | 3;
  source?: string;
  /** Which chart the rule is written for. Undefined: both. "male": Venus is the wife. "female": Venus is the native's own person (Deha) and Mars the husband. Jupiter is the Jeeva in both. */
  frame?: "male" | "female";
}

/** Who plays which part in a chart (Rao). */
export interface Roles {
  gender: Gender;
  /** The Jeeva karaka: Jupiter in every chart (Naik: Guru is the native at the subtle level). */
  native: Planet;
  /** The native as a person, the Deha: Jupiter in a male chart; Venus in a female chart (Naik). Marriage, husband and comforts are counted from it. */
  deha: Planet;
  /** The spouse karaka: Venus (wife) in a male chart, Mars (husband) in a female chart. */
  spouse: Planet;
  karma: Planet;
}

export function rolesFor(gender: Gender): Roles {
  const female = gender === "female";
  return {
    gender,
    native: "Jupiter",
    deha: female ? "Venus" : "Jupiter",
    spouse: female ? "Mars" : "Venus",
    karma: "Saturn",
  };
}

/** Area karakas, gender-aware: "self" follows the Jeeva, "marriage" the spouse karaka. */
export function areaKaraka(area: LifeArea, gender: Gender): Planet {
  const roles = rolesFor(gender);
  if (area === "self") return roles.native;
  if (area === "marriage") return roles.spouse;
  return LIFE_AREAS[area].karaka;
}

/** Karaka label for an area heading; the female "self" reads from both the Jeeva and the Deha. */
export function areaKarakaLabel(area: LifeArea, gender: Gender): string {
  const roles = rolesFor(gender);
  if (area === "self" && roles.deha !== roles.native)
    return `${roles.native} (Jeeva) · ${roles.deha} (Deha)`;
  return areaKaraka(area, gender);
}

export interface Finding {
  ruleId: string;
  area: LifeArea;
  text: string;
  score: number;
  planets: Planet[];
  relation: Relation | null;
  viaRetro: boolean;
  /** No longer set: strength now lives in `grade`. Kept so older saved results still read. */
  modifier?: string;
  /** Degree order when the pair shares a sign: the planet ahead hands its matters to the one behind. */
  flow?: Flow;
  /** Whole-sign house of the object counted from the subject, for house rules. */
  house?: number;
  source?: string;
  /** The combination as written (rule weight, sign relation, retrogression, companions), before strength. */
  base?: number;
  /** Full, enhanced, reduced or cancelled, with each reason; `score` is the graded value. */
  grade?: Grade;
  /** Set when the birth-time band changes the line's direction or whether it fires. */
  band?: FlowBand;
}

/** What a line looks like at one end of the birth-time band, when it differs from the stated time. */
export interface BandEdge {
  /** Whether the line still fires at this end. */
  fires: boolean;
  /** The direction at this end, when the planets still share a direction. */
  flow?: Flow;
  /** The sign relation at this end, when it differs. */
  relation?: Relation | null;
  /** For house-count lines, the house at this end, when it differs. */
  house?: number;
}
export interface FlowBand {
  /** Half-width of the band in minutes. */
  minutes: number;
  earlier?: BandEdge;
  later?: BandEdge;
}

export interface PairRelation {
  subject: Planet;
  object: Planet;
  relation: Relation;
  viaRetro: boolean;
  subjectSign: number;
  objectSign: number;
}

export interface Reading {
  findings: Finding[];
  relations: PairRelation[];
  strength: PlanetStrength[];
  /** Planets sharing a sign, in degree order, with hand-offs. */
  chains: DegreeChain[];
  /** Marriage read between karakas, gender-aware (no house lords). */
  marriage: MarriageReading;
  children: ChildrenReading;
  /** Ashtalakshmi: Venus as Lagna, the eight wealth forms (DNA Astrology of Wealth, 2022). */
  lakshmi: LakshmiReading;
  roles: Roles;
  jeeva: {
    sign: string;
    retro: boolean;
    dignity: Dignity;
    companions: Planet[];
    summary: string;
  };
  karma: {
    sign: string;
    retro: boolean;
    dignity: Dignity;
    companions: Planet[];
    summary: string;
  };
  /** Female chart only: Venus as the native's own person (Deha). */
  deha?: {
    sign: string;
    retro: boolean;
    dignity: Dignity;
    companions: Planet[];
    summary: string;
  };
}

const RELATION_STRENGTH: Record<Relation, number> = {
  // Nadi hierarchy: same sign, then trines (~75%), then the 7th (~50%); the 2nd/12th are
  // directional links (ahead/behind) that Rao's rules lean on, so they keep a working weight.
  conjunct: 1,
  trine: 0.75,
  prev: 0.7,
  next: 0.65,
  opposite: 0.5,
  none: 0,
};

/**
 * Score bonus per planet beyond the pair, so "Saturn, Mercury and Ketu" outranks "Saturn with Mercury"
 * on the same contact. Set so that a three-planet statement whose third member stands in trine
 * (0.75) still outranks a two-planet rule of the same weight in the same sign (3 x 0.75 x 1.4 > 3):
 * the more specific combination leads the area, whatever its tone. The figure is the app's choice.
 */
const SPECIFICITY_BONUS = 0.4;

export const RELATION_LABEL: Record<Relation, string> = {
  conjunct: "conjunct",
  prev: "in the 12th (behind)",
  next: "in the 2nd (ahead)",
  trine: "in trine",
  opposite: "in the 7th",
  none: "unrelated",
};

const SRC_RAO = "R.G. Rao, Bhrigu Nandi Nadi";
const SRC_NAIK = "S. Naik, Prediction Secrets: Naadi Astrology";

const pair = (
  id: string,
  area: LifeArea,
  subject: Planet,
  object: Planet,
  text: string,
  weight: 1 | 2 | 3 = 2,
  relation: Relation[] = ["conjunct", "prev", "next", "trine", "opposite"],
  source: string = SRC_RAO,
): Rule => ({
  id,
  area,
  when: { subject, object, relation },
  text,
  weight,
  source,
});

export const RULES: Rule[] = [
  // ───────────── Jeeva karaka (Jupiter): the native ─────────────
  pair(
    "ju-sa",
    "self",
    "Jupiter",
    "Saturn",
    "Jeeva bound to Karma: life is organised around work, duty and responsibility. Maturity comes early; gains arrive slowly but hold.",
    3,
  ),
  pair(
    "ju-ve",
    "self",
    "Jupiter",
    "Venus",
    "Jeeva with Kalatra: the spouse and partnerships shape the life path; taste for comfort, arts and refined living.",
    3,
  ),
  pair(
    "ju-me",
    "self",
    "Jupiter",
    "Mercury",
    "Jeeva with Vidya karaka: learned, articulate, drawn to teaching, writing, trade or advisory roles.",
    3,
  ),
  pair(
    "ju-ma",
    "self",
    "Jupiter",
    "Mars",
    "Jeeva with Mars: energetic and decisive; technical or engineering bent; property and siblings feature strongly.",
    3,
  ),
  pair(
    "ju-su",
    "self",
    "Jupiter",
    "Sun",
    "Jeeva with the Sun: dignity, authority and closeness to power or government; father's influence on the life direction.",
    3,
  ),
  pair(
    "ju-mo",
    "self",
    "Jupiter",
    "Moon",
    "Jeeva with the Moon: emotionally attuned, popular, mobile; life connected with the public, travel or the mother.",
    3,
  ),
  pair(
    "ju-ra",
    "self",
    "Jupiter",
    "Rahu",
    "Jeeva with Rahu: an unconventional life; foreign connections, technology or ambition beyond the family's tradition.",
    3,
  ),
  pair(
    "ju-ke",
    "self",
    "Jupiter",
    "Ketu",
    "Jeeva with Ketu: introspective and philosophical; periodic detachment, interest in healing, research or the occult.",
    3,
  ),
  {
    id: "ju-retro",
    area: "self",
    when: { subject: "Jupiter", subjectRetro: true },
    text: "Retrograde Jupiter: the native revisits decisions and also carries the qualities of the previous sign; life direction is reconsidered more than once.",
    weight: 2,
    source: SRC_NAIK,
  },
  {
    id: "ju-exalt",
    area: "self",
    when: {
      subject: "Jupiter",
      subjectDignity: ["Exalted", "Own sign", "Moolatrikona"],
    },
    text: "Jupiter is dignified: strong protection, sound judgement and natural respect from others.",
    weight: 2,
  },
  {
    id: "ju-debil",
    area: "self",
    when: { subject: "Jupiter", subjectDignity: ["Debilitated"] },
    text: "Jupiter debilitated: self-worth must be earned; early life lacks guidance and the native compensates through effort.",
    weight: 2,
  },
  {
    id: "ju-combust",
    area: "self",
    when: { subject: "Jupiter", subjectCombust: true },
    text: "Jupiter combust: the ego of the father or authority figures overshadows the native early on.",
    weight: 1,
  },

  // ───────────── Karma karaka (Saturn): profession ─────────────
  pair(
    "sa-me",
    "career",
    "Saturn",
    "Mercury",
    "Karma with Mercury: livelihood through commerce, accounts, writing, communication, teaching or documentation.",
    3,
  ),
  pair(
    "sa-ve",
    "career",
    "Saturn",
    "Venus",
    "Karma with Venus: profession linked to finance, arts, luxury goods, vehicles, hospitality or women-centred fields.",
    3,
  ),
  pair(
    "sa-ma",
    "career",
    "Saturn",
    "Mars",
    "Karma with Mars: engineering, machinery, land, construction, defence or surgery; work demands physical or technical effort.",
    3,
  ),
  pair(
    "sa-su",
    "career",
    "Saturn",
    "Sun",
    "Karma with the Sun: government, administration or a large institution; a position of authority reached through service.",
    3,
  ),
  pair(
    "sa-mo",
    "career",
    "Saturn",
    "Moon",
    "Karma with the Moon: work with the public, liquids, food, shipping or frequent travel; fluctuating routines.",
    3,
  ),
  pair(
    "sa-ju",
    "career",
    "Saturn",
    "Jupiter",
    "Karma with Jupiter: advisory, teaching, law, finance or religious institutions; the native's own effort defines status.",
    3,
  ),
  pair(
    "sa-ra",
    "career",
    "Saturn",
    "Rahu",
    "Karma with Rahu: foreign employment, technology, unconventional or high-risk fields; career in a distant land or with foreigners.",
    3,
  ),
  pair(
    "sa-ke",
    "career",
    "Saturn",
    "Ketu",
    "Karma with Ketu: technical, computing, healing or research work; breaks and restarts in the career line.",
    3,
  ),
  {
    id: "sa-retro",
    area: "career",
    when: { subject: "Saturn", subjectRetro: true },
    text: "Retrograde Saturn: career reversals or a change of field; the profession also takes colour from the previous sign.",
    weight: 2,
    source: SRC_NAIK,
  },
  {
    id: "sa-exalt",
    area: "career",
    when: {
      subject: "Saturn",
      subjectDignity: ["Exalted", "Own sign", "Moolatrikona"],
    },
    text: "Saturn dignified: a steady, respected profession with authority over others.",
    weight: 2,
  },
  {
    id: "sa-debil",
    area: "career",
    when: { subject: "Saturn", subjectDignity: ["Debilitated"] },
    text: "Saturn debilitated: struggle for recognition at work; the native may serve under difficult superiors before finding footing.",
    weight: 2,
  },
  {
    id: "sa-fire",
    area: "career",
    when: { subject: "Saturn", subjectElement: ["Fire"] },
    text: "Saturn in a fiery sign: work involving energy, metal, machines, leadership or the armed services.",
    weight: 1,
  },
  {
    id: "sa-earth",
    area: "career",
    when: { subject: "Saturn", subjectElement: ["Earth"] },
    text: "Saturn in an earthy sign: land, agriculture, real estate, finance or material production.",
    weight: 1,
  },
  {
    id: "sa-air",
    area: "career",
    when: { subject: "Saturn", subjectElement: ["Air"] },
    text: "Saturn in an airy sign: communication, information technology, trade, aviation or intellectual work.",
    weight: 1,
  },
  {
    id: "sa-water",
    area: "career",
    when: { subject: "Saturn", subjectElement: ["Water"] },
    text: "Saturn in a watery sign: medicine, chemicals, shipping, beverages or emotionally demanding service roles.",
    weight: 1,
  },

  // ───────────── Kalatra karaka (Venus): marriage ─────────────
  pair(
    "ve-sa",
    "marriage",
    "Venus",
    "Saturn",
    "Venus with Saturn: delayed or duty-bound marriage; spouse may be older, hard-working or met through the workplace.",
    3,
  ),
  pair(
    "ve-ma",
    "marriage",
    "Venus",
    "Mars",
    "Venus with Mars: passionate attraction; love marriage or a spouse with a technical, forceful temperament.",
    3,
  ),
  pair(
    "ve-me",
    "marriage",
    "Venus",
    "Mercury",
    "Venus with Mercury: educated, talkative spouse; friendship precedes romance; more than one attachment is possible.",
    3,
  ),
  pair(
    "ve-ju",
    "marriage",
    "Venus",
    "Jupiter",
    "Venus with Jupiter: a wise, supportive spouse who raises the native's fortune; marriage brings growth.",
    3,
  ),
  pair(
    "ve-su",
    "marriage",
    "Venus",
    "Sun",
    "Venus with the Sun: spouse from an influential family; ego and status enter the relationship.",
    3,
  ),
  pair(
    "ve-mo",
    "marriage",
    "Venus",
    "Moon",
    "Venus with the Moon: emotional, caring spouse, possibly from a distant place; romance is strongly felt.",
    3,
  ),
  pair(
    "ve-ra",
    "marriage",
    "Venus",
    "Rahu",
    "Venus with Rahu: inter-community, inter-faith or foreign spouse; unconventional relationship path.",
    3,
  ),
  pair(
    "ve-ke",
    "marriage",
    "Venus",
    "Ketu",
    "Venus with Ketu: dissatisfaction or detachment in partnership; the spouse may be spiritually inclined or health-troubled.",
    3,
  ),
  {
    id: "ve-retro",
    area: "marriage",
    when: { subject: "Venus", subjectRetro: true },
    text: "Retrograde Venus: a relationship that returns or repeats; the spouse also carries qualities of the previous sign.",
    weight: 2,
    source: SRC_NAIK,
  },
  {
    id: "ve-debil",
    area: "marriage",
    when: { subject: "Venus", subjectDignity: ["Debilitated"] },
    text: "Venus debilitated: adjustments in marriage; the partner's family circumstances may be modest.",
    weight: 2,
  },
  {
    id: "ve-exalt",
    area: "marriage",
    when: {
      subject: "Venus",
      subjectDignity: ["Exalted", "Own sign", "Moolatrikona"],
    },
    text: "Venus dignified: a graceful, prosperous partner and harmony in domestic life.",
    weight: 2,
  },

  // ───────────── Wealth ─────────────
  pair(
    "ju-ve-wealth",
    "wealth",
    "Jupiter",
    "Venus",
    "Jupiter and Venus together: wealth through partnership, finance or refined trades; comfortable living standards.",
    2,
  ),
  pair(
    "ju-me-wealth",
    "wealth",
    "Jupiter",
    "Mercury",
    "Jupiter and Mercury: income through knowledge, trading or consultancy.",
    2,
  ),
  pair(
    "ju-ra-wealth",
    "wealth",
    "Jupiter",
    "Rahu",
    "Jupiter and Rahu: sudden or foreign-sourced gains; wealth from unconventional means.",
    2,
  ),
  pair(
    "ju-ma-wealth",
    "wealth",
    "Jupiter",
    "Mars",
    "Jupiter and Mars: assets in land and buildings; gains through courage and initiative.",
    2,
  ),
  pair(
    "ju-ke-wealth",
    "wealth",
    "Jupiter",
    "Ketu",
    "Jupiter and Ketu: money comes and goes; ancestral property or inheritance issues.",
    2,
  ),
  pair(
    "sa-ve-wealth",
    "wealth",
    "Saturn",
    "Venus",
    "Saturn and Venus: earnings from finance, banking or luxury trades; wealth accrues steadily through the spouse's side.",
    1,
  ),

  // ───────────── Education ─────────────
  pair(
    "me-ju",
    "education",
    "Mercury",
    "Jupiter",
    "Mercury with Jupiter: higher education, classical learning, law, philosophy or teaching.",
    3,
  ),
  pair(
    "me-sa",
    "education",
    "Mercury",
    "Saturn",
    "Mercury with Saturn: education in commerce, accounts, engineering or a discipline requiring long practice; possible interruption.",
    3,
  ),
  pair(
    "me-ma",
    "education",
    "Mercury",
    "Mars",
    "Mercury with Mars: technical education, mathematics, engineering or medicine; sharp analytical mind.",
    3,
  ),
  pair(
    "me-ve",
    "education",
    "Mercury",
    "Venus",
    "Mercury with Venus: arts, music, design, languages or finance; persuasive speech.",
    3,
  ),
  pair(
    "me-su",
    "education",
    "Mercury",
    "Sun",
    "Mercury with the Sun: administration, political science, medicine or leadership studies; father supports learning.",
    2,
  ),
  pair(
    "me-mo",
    "education",
    "Mercury",
    "Moon",
    "Mercury with the Moon: imaginative mind, psychology, hospitality or public relations.",
    2,
  ),
  pair(
    "me-ra",
    "education",
    "Mercury",
    "Rahu",
    "Mercury with Rahu: foreign languages, technology, unconventional or overseas education.",
    2,
  ),
  pair(
    "me-ke",
    "education",
    "Mercury",
    "Ketu",
    "Mercury with Ketu: breaks in education, or a turn toward research, computing and esoteric subjects.",
    2,
  ),
  {
    id: "me-retro",
    area: "education",
    when: { subject: "Mercury", subjectRetro: true },
    text: "Retrograde Mercury: change of stream or a return to studies later in life.",
    weight: 1,
    source: SRC_NAIK,
  },

  // ───────────── Family ─────────────
  pair(
    "su-sa-fam",
    "family",
    "Sun",
    "Saturn",
    "Sun with Saturn: father works hard, possibly in service; distance or strain between father and native.",
    2,
  ),
  pair(
    "su-ra-fam",
    "family",
    "Sun",
    "Rahu",
    "Sun with Rahu: father's life is unconventional or connected with foreign lands; eclipse-like shadow over paternal matters.",
    2,
  ),
  pair(
    "su-ke-fam",
    "family",
    "Sun",
    "Ketu",
    "Sun with Ketu: separation from father or father with spiritual leanings.",
    2,
  ),
  pair(
    "su-ju-fam",
    "family",
    "Sun",
    "Jupiter",
    "Sun with Jupiter: respected, guiding father; the native inherits status.",
    2,
  ),
  pair(
    "mo-sa-fam",
    "family",
    "Moon",
    "Saturn",
    "Moon with Saturn: mother bears hardship; the native's mind is disciplined but prone to worry.",
    2,
  ),
  pair(
    "mo-ra-fam",
    "family",
    "Moon",
    "Rahu",
    "Moon with Rahu: mother's health or circumstances are unusual; the native's mind is restless and imaginative.",
    2,
  ),
  pair(
    "mo-ke-fam",
    "family",
    "Moon",
    "Ketu",
    "Moon with Ketu: separation from the mother or a mother of spiritual bent; emotional detachment.",
    2,
  ),
  pair(
    "mo-ju-fam",
    "family",
    "Moon",
    "Jupiter",
    "Moon with Jupiter: nurturing, wise mother; a calm and generous mind.",
    2,
  ),
  pair(
    "ma-sa-fam",
    "family",
    "Mars",
    "Saturn",
    "Mars with Saturn: siblings face struggles; disputes over property are possible.",
    2,
  ),
  pair(
    "ma-ra-fam",
    "family",
    "Mars",
    "Rahu",
    "Mars with Rahu: a sibling settles abroad or takes an unusual path; caution with land dealings.",
    1,
  ),
  pair(
    "ma-ju-fam",
    "family",
    "Mars",
    "Jupiter",
    "Mars with Jupiter: supportive siblings; property is acquired.",
    1,
  ),

  // ───────────── Health ─────────────
  pair(
    "su-sa-health",
    "health",
    "Sun",
    "Saturn",
    "Sun with Saturn: energy runs down when work is unrelenting; rest, bones, teeth and circulation deserve attention.",
    1,
  ),
  pair(
    "su-ma-health",
    "health",
    "Sun",
    "Mars",
    "Sun with Mars: a hot constitution; blood pressure and the small accidents of hurry are the things to watch.",
    1,
  ),
  pair(
    "mo-sa-health",
    "health",
    "Moon",
    "Saturn",
    "Moon with Saturn: moods can run low and colds linger; routine and warmth steady the mind.",
    1,
  ),
  pair(
    "mo-ma-health",
    "health",
    "Moon",
    "Mars",
    "Moon with Mars: a quick temper; inflammation and blood-related complaints respond to cooling habits.",
    1,
  ),
  pair(
    "ju-sa-health",
    "health",
    "Jupiter",
    "Saturn",
    "Jupiter with Saturn: a slow metabolism; the liver and the joints want movement, more so in later years.",
    1,
  ),
  pair(
    "ju-ma-health",
    "health",
    "Jupiter",
    "Mars",
    "Jupiter with Mars: over-confidence is the usual cause of mishaps; the liver and blood sugar reward moderation.",
    1,
  ),
  pair(
    "ju-ra-health",
    "health",
    "Jupiter",
    "Rahu",
    "Jupiter with Rahu: complaints that take time to diagnose; allergies and sensitivities are the common form.",
    1,
  ),

  // ───────────── Spirituality ─────────────
  pair(
    "ke-ju-spirit",
    "spirituality",
    "Ketu",
    "Jupiter",
    "Ketu with Jupiter: a genuine spiritual guide appears; wisdom through renunciation of some worldly aim.",
    3,
  ),
  pair(
    "ke-sa-spirit",
    "spirituality",
    "Ketu",
    "Saturn",
    "Ketu with Saturn: austerity, service and detachment as a path; possible pilgrimage or ashram connection.",
    2,
  ),
  pair(
    "ke-mo-spirit",
    "spirituality",
    "Ketu",
    "Moon",
    "Ketu with the Moon: intuitive, meditative mind; dreams and psychic sensitivity.",
    2,
  ),
  pair(
    "ke-su-spirit",
    "spirituality",
    "Ketu",
    "Sun",
    "Ketu with the Sun: the ego is tested; leadership in a spiritual or healing tradition.",
    2,
  ),
  pair(
    "ke-me-spirit",
    "spirituality",
    "Ketu",
    "Mercury",
    "Ketu with Mercury: interest in mantra, scripture, computing or esoteric sciences.",
    1,
  ),
  pair(
    "ke-ve-spirit",
    "spirituality",
    "Ketu",
    "Venus",
    "Ketu with Venus: devotion through art and music; renunciation of pleasures at some stage.",
    1,
  ),

  // ───────────── Travel & foreign ─────────────
  pair(
    "ra-sa-travel",
    "travel",
    "Rahu",
    "Saturn",
    "Rahu with Saturn: long residence abroad for work; livelihood among foreigners.",
    3,
  ),
  pair(
    "ra-ju-travel",
    "travel",
    "Rahu",
    "Jupiter",
    "Rahu with Jupiter: the native's fortune improves in a foreign land; overseas education or settlement.",
    3,
  ),
  pair(
    "ra-ve-travel",
    "travel",
    "Rahu",
    "Venus",
    "Rahu with Venus: foreign spouse or travel for pleasure and luxury.",
    2,
  ),
  pair(
    "ra-mo-travel",
    "travel",
    "Rahu",
    "Moon",
    "Rahu with the Moon: frequent relocation; the mind is drawn to distant places.",
    2,
  ),
  pair(
    "ra-me-travel",
    "travel",
    "Rahu",
    "Mercury",
    "Rahu with Mercury: work in foreign languages, IT or international trade.",
    2,
  ),
  pair(
    "ra-su-travel",
    "travel",
    "Rahu",
    "Sun",
    "Rahu with the Sun: father or the native holds a position abroad; recognition from foreign institutions.",
    1,
  ),
  pair(
    "ra-ma-travel",
    "travel",
    "Rahu",
    "Mars",
    "Rahu with Mars: technical work abroad; property in a foreign land.",
    1,
  ),
];

// Sign-lord colouring for the three primary karakas.
for (const [subject, area, prefix] of [
  ["Saturn", "career", "Livelihood takes the colour of"],
  ["Jupiter", "self", "The native's nature takes the colour of"],
  ["Venus", "marriage", "The spouse takes the colour of"],
] as const) {
  const lords: Planet[] = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
  ];
  for (const lord of lords) {
    if (lord === subject) continue;
    RULES.push({
      id: `${subject.toLowerCase().slice(0, 2)}-lord-${lord.toLowerCase().slice(0, 2)}`,
      area,
      when: { subject, subjectSignLord: [lord] },
      text: `${subject} sits in a sign owned by ${lord}: ${prefix} ${lord}'s significations (${KARAKA[lord].significations.slice(0, 3).join(", ")}).`,
      weight: 1,
      source: SRC_NAIK,
    });
  }
}

RULES.push(...EXTRA_RULES);
// Male-framed rules (Venus as the wife) are replaced by FEMALE_RULES in a female chart; Jupiter self rules apply to both.
for (const r of RULES)
  if (MALE_FRAME_IDS.some((re) => re.test(r.id))) r.frame = "male";
RULES.push(...FEMALE_RULES);
RULES.push(...CHILDREN_RULES);
RULES.push(...HOUSE_RULES);
// Dignity, element and combustion notes are general Nadi principles rather than a numbered sutra.
for (const r of RULES)
  if (!r.source) r.source = "General Nadi principles (Rao, Naik)";

// Guard against duplicate ids while authoring rules.
{
  const seen = new Set<string>();
  for (const r of RULES) {
    if (seen.has(r.id)) throw new Error(`Duplicate rule id: ${r.id}`);
    seen.add(r.id);
  }
}

const CLASSICAL: Planet[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

// A planet merely in a house from the karaka, without combining with it (below the 7th's 0.5).
export const HOUSE_STRENGTH = 0.45;

// Rao: a retro planet "will aspect the rear sign by 1/2 strength".
export const RETRO_STRENGTH = 0.5;

// Effective signs a planet acts from. A retrograde classical planet also acts from the previous
// sign, unless it backed into its sign from the sign ahead or sits under Rahu/Ketu (see flow.ts).
function effectiveSigns(
  p: PlanetPosition,
  positions: PlanetPosition[],
): Array<{ sign: number; viaRetro: boolean }> {
  const out = [{ sign: p.signIndex, viaRetro: false }];
  if (readsFromPreviousSign(p, positions))
    out.push({ sign: (p.signIndex + 11) % 12, viaRetro: true });
  return out;
}

// Best relation between two planets, considering retrograde alternates.
function bestRelation(
  a: PlanetPosition,
  b: PlanetPosition,
  positions: PlanetPosition[],
): {
  relation: Relation;
  viaRetro: boolean;
  aSign: number;
  bSign: number;
} | null {
  let best: {
    relation: Relation;
    viaRetro: boolean;
    aSign: number;
    bSign: number;
  } | null = null;
  for (const ea of effectiveSigns(a, positions)) {
    for (const eb of effectiveSigns(b, positions)) {
      const r = relationOf(ea.sign, eb.sign);
      if (r === "none") continue;
      const cand = {
        relation: r,
        viaRetro: ea.viaRetro || eb.viaRetro,
        aSign: ea.sign,
        bSign: eb.sign,
      };
      const score = RELATION_STRENGTH[r] * (cand.viaRetro ? RETRO_STRENGTH : 1);
      const bestScore = best
        ? RELATION_STRENGTH[best.relation] *
          (best.viaRetro ? RETRO_STRENGTH : 1)
        : -1;
      if (score > bestScore) best = cand;
    }
  }
  return best;
}

/** What the grader needs besides the finding: the rule, its kind, and the factors already in the base. */
interface GradeInput {
  f: Finding;
  rule: Rule;
  kind: "house" | "pair" | "extra" | "single";
  /** The same line at full strength: rule weight × specificity (× the house-count weight for house rules). */
  max: number;
  companions: Array<{ planet: Planet; relation: Relation }>;
  relFactor: number;
  extraFactor: number;
  retroFactor: number;
}

const REL_FROM: Record<Relation, string> = {
  conjunct: "in the same sign as",
  prev: "in the 12th from",
  next: "in the 2nd from",
  trine: "in trine to",
  opposite: "in the 7th from",
  none: "unrelated to",
};

const ordinalOf = (n: number) =>
  `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;
const listOf = (ps: string[]) =>
  ps.length <= 1 ? ps.join("") : `${ps.slice(0, -1).join(", ")} and ${ps[ps.length - 1]}`;

/**
 * Grade one line. The base score already holds the combination as written; this names those
 * factors and applies the planets' strength as computed by the Nadi strength layer:
 * combustion of the subject (Naik), effective dignity after its set-asides (Rao's basic rules 5
 * and 8; Naik), hemming (Rao's basic rule 4), the degree contest between enemies in one sign
 * (Naik), and for planets in one direction the tightness and approach of the bond. Only the
 * line's own planets (subject and object) are weighed; companions are named, not weighed.
 * The size of every weight is this app's convention.
 */
/** "the Sun", "the Moon"; other planets by name. */
const nm = (p: string): string => (p === "Sun" || p === "Moon" ? `the ${p}` : p);

function gradeFinding(g: GradeInput, strengthOf: Record<Planet, PlanetStrength>): void {
  const { f, rule, kind } = g;
  const w = rule.when;
  const reasons: GradeReason[] = [];
  const [subject, object] = f.planets;
  const linePlanets: Planet[] =
    (kind === "pair" || kind === "house") && object ? [subject, object] : [subject];

  // The combination as written: already in the base score, named here so the grade reads whole.
  if (kind === "pair" && object) {
    if (w.exchange) reasons.push({ text: `${nm(subject)} and ${nm(object)} exchange signs`, effect: "note" });
    else if (f.relation === "conjunct")
      reasons.push({ text: `${nm(object)} in the same sign as ${nm(subject)}`, effect: "note" });
    else if (f.relation && g.relFactor < 1)
      reasons.push({ text: `${nm(object)} ${REL_FROM[f.relation]} ${nm(subject)}`, effect: "weight", factor: g.relFactor });
  }
  if (kind === "house" && object && f.house)
    reasons.push({ text: `${nm(object)} in the ${ordinalOf(f.house)} from ${nm(subject)}`, effect: "note" });
  const apart = g.companions.filter((c) => c.relation !== "conjunct");
  if (apart.length && g.extraFactor < 1)
    reasons.push({
      text: `with ${listOf(apart.map((c) => `${nm(c.planet)} ${REL_FROM[c.relation]} ${nm(subject)}`))}`,
      effect: "weight",
      factor: g.extraFactor,
    });
  if (f.viaRetro && g.retroFactor < 1)
    reasons.push({
      text: "read from the previous sign by retrogression, at reduced strength",
      effect: "down",
      factor: g.retroFactor,
      source: kind === "extra" ? undefined : "Rao's basic rules",
    });
  // Retrogression's half strength is already in the base score; it still lowers the grade.
  const retroInBase = f.viaRetro && g.retroFactor < 1 ? g.retroFactor : 1;

  // Strength: sourced principles move the score and the grade; the app's own readings
  // (gradeOnly) move the grade alone.
  let mult = 1;
  let gradeMult = 1;
  const apply = (r: GradeReason) => {
    reasons.push(r);
    if ((r.effect === "up" || r.effect === "down") && r.factor) {
      if (r.gradeOnly) gradeMult *= r.factor;
      else mult *= r.factor;
    }
  };
  // Combustion of the subject, unless the rule is about the Sun pairing or about the combustion itself.
  const sst = strengthOf[subject];
  if (sst?.effectiveCombust && !f.planets.includes("Sun") && w.subjectCombust === undefined)
    apply({ text: `${nm(subject)} combust: its results come in lesser degree`, effect: "down", factor: 0.7, source: "Naik" });
  else if (sst?.combust && sst.combustNote && w.subjectCombust === undefined && !f.planets.includes("Sun"))
    reasons.push({ text: sst.combustNote, effect: "note", source: "Naik" });

  for (const p of linePlanets) {
    const st = strengthOf[p];
    if (!st) continue;
    // A rule that names the subject's dignity or sign already says it; do not count it twice.
    const gated =
      p === subject && (w.subjectDignity !== undefined || w.subjectSign !== undefined);
    if (!gated) {
      if (st.effectiveDignity === "Exalted")
        apply({ text: `${nm(p)} exalted, with no enemy beside it and a planet to deliver it`, effect: "up", factor: 1.15, source: "Rao's basic rules 5 and 8" });
      else if (st.effectiveDignity === "Debilitated")
        apply({ text: `${nm(p)} debilitated, and nothing cancels it`, effect: "down", factor: 0.8 });
    }
    if (st.dignityNote)
      reasons.push({ text: `${nm(p)}: ${st.dignityNote.charAt(0).toLowerCase()}${st.dignityNote.slice(1)}`, effect: "note", source: /Rao rule/.test(st.dignityNote) ? undefined : "Naik" });
    if (st.hemmed === "friends")
      apply({ text: `${nm(p)} hemmed by friends: its significations flow freely`, effect: "up", factor: 1.1, source: "Rao's basic rule 4" });
    else if (st.hemmed === "enemies")
      apply({ text: `${nm(p)} hemmed by enemies: its significations are obstructed`, effect: "down", factor: 0.8, source: "Rao's basic rule 4" });
    else if (st.hemmed === "mixed")
      reasons.push({ text: `${nm(p)} flanked by friends and enemies`, effect: "note", source: "Rao's basic rule 4" });
    // Degree contest between enemies in one sign: the planet behind yields (Naik). Only a
    // subject that yields lowers the line; who leads, and an object's contests, are noted.
    if (p === subject) {
      if (st.losingTo.length)
        apply({ text: `${nm(p)} behind ${listOf(st.losingTo.map(nm))} by degree in one sign: it yields to the enemy`, effect: "down", factor: 0.85, source: "Naik" });
      if (st.winningOver.length)
        reasons.push({ text: `${nm(p)} ahead of ${listOf(st.winningOver.map(nm))} by degree in one sign: it leads`, effect: "note", source: "Naik" });
    } else {
      const yields = st.losingTo.filter((q) => q !== subject);
      const leads = st.winningOver.filter((q) => q !== subject);
      if (yields.length)
        reasons.push({ text: `${nm(p)} behind ${listOf(yields.map(nm))} by degree in one sign: it yields`, effect: "note", source: "Naik" });
      if (leads.length)
        reasons.push({ text: `${nm(p)} ahead of ${listOf(leads.map(nm))} by degree in one sign: it leads`, effect: "note", source: "Naik" });
    }
  }

  // The bond between planets in one direction: how tight, and whether they are closing. The
  // direction itself is Rao's and Naik's; this ordering of bonds is the app's reading of it.
  if (f.flow) {
    const t = f.flow.tier;
    if (t === "pada") apply({ text: "in the same pada, the tightest bond", effect: "up", factor: 1.15, gradeOnly: true });
    else if (t === "degree") apply({ text: "at the same degree across signs", effect: "up", factor: 1.1, gradeOnly: true });
    else if (t === "nakshatra") apply({ text: "in the same nakshatra", effect: "up", factor: 1.05, gradeOnly: true });
    if (f.flow.approach === "closing") apply({ text: "closing on each other", effect: "up", factor: 1.1, gradeOnly: true });
    else if (f.flow.approach === "separating") apply({ text: "drawing apart", effect: "down", factor: 0.9, gradeOnly: true });
  }

  const m = Math.min(GRADE_CEILING, Math.max(GRADE_FLOOR, mult));
  f.base = f.score;
  f.score = Math.round(f.score * m * 100) / 100;
  // The level is strength alone: the sign relation and companions rank the line (they are in
  // the score) but do not set its grade.
  const ratio = Math.min(GRADE_CEILING, Math.max(GRADE_FLOOR, mult * gradeMult * retroInBase));
  f.grade = { level: levelOf(ratio), ratio: Math.round(ratio * 100) / 100, reasons };
}

/**
 * Birth-time band: read the chart again at both ends of ±`minutes` and mark each line whose
 * direction or bond changes there, or which stops firing. Nothing is averaged; the reading at the
 * stated time stands, and the band says where it would read differently.
 */
export function applyBand(
  reading: Reading,
  earlier: PlanetPosition[],
  later: PlanetPosition[],
  minutes: number,
  gender: Gender = "unspecified",
): void {
  if (!(minutes > 0)) return;
  const at = (ps: PlanetPosition[]) =>
    new Map(evaluate(ps, RULES, gender).findings.map((x) => [x.ruleId, x]));
  const E = at(earlier);
  const L = at(later);
  for (const f of reading.findings) {
    const edge = (m: Map<string, Finding>): BandEdge | undefined => {
      const g = m.get(f.ruleId);
      if (!g) return { fires: false };
      const relChanged = g.relation !== f.relation;
      const houseChanged = g.house !== f.house;
      if (sameFlow(f.flow, g.flow) && !relChanged && !houseChanged) return undefined;
      return {
        fires: true,
        flow: g.flow,
        relation: relChanged ? g.relation : undefined,
        house: houseChanged ? g.house : undefined,
      };
    };
    const e = edge(E);
    const l = edge(L);
    if (e || l) f.band = { minutes, earlier: e, later: l };
  }
}

// How a bond reads in a sentence, and its order for "tightens" and "loosens" (as the grade weighs them).
const BOND_PHRASE: Record<Flow["tier"], string> = {
  pada: "one pada",
  degree: "the same degree",
  nakshatra: "one nakshatra",
  sign: "one sign",
  trine: "the trine",
};
const TIER_RANK: Record<Flow["tier"], number> = { pada: 4, degree: 3, nakshatra: 2, sign: 1, trine: 1 };

/** "Within the ±15-minute birth-time band: at the later end the order reverses ..." */
export function bandSentence(f: Finding, female = false): string | null {
  const band = f.band;
  if (!band) return null;
  const [subject, object] = f.planets;
  const part = (label: string, e?: BandEdge) => {
    if (!e) return null;
    if (!e.fires) return `at the ${label} end this line does not fire`;
    if (e.flow && f.flow && e.flow.from === f.flow.from && e.flow.to === f.flow.to) {
      const move = TIER_RANK[e.flow.tier] > TIER_RANK[f.flow.tier] ? "tightens" : TIER_RANK[e.flow.tier] < TIER_RANK[f.flow.tier] ? "loosens" : "changes";
      return `at the ${label} end the bond ${move} from ${BOND_PHRASE[f.flow.tier]} to ${BOND_PHRASE[e.flow.tier]}`;
    }
    if (e.flow)
      return `at the ${label} end the order ${f.flow ? "reverses" : "is"}: ${directionClause(e.flow, female)}`;
    if (e.relation && object) return `at the ${label} end ${object} is ${REL_FROM[e.relation]} ${subject}`;
    if (e.house && object) return `at the ${label} end ${object} is in the ${ordinalOf(e.house)} from ${subject}`;
    if (f.flow) return `at the ${label} end the two no longer share a direction`;
    return null;
  };
  const bits = [part("earlier", band.earlier), part("later", band.later)].filter(Boolean);
  if (!bits.length) return null;
  return `Within the ±${band.minutes}-minute birth-time band: ${bits.join("; ")}.`;
}

export function evaluate(
  positions: PlanetPosition[],
  rules: Rule[] = RULES,
  gender: Gender = "unspecified",
): Reading {
  const byPlanet = Object.fromEntries(
    positions.map((p) => [p.planet, p]),
  ) as Record<Planet, PlanetPosition>;

  // Pairwise relations
  const relations: PairRelation[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = 0; j < positions.length; j++) {
      if (i === j) continue;
      const a = positions[i];
      const b = positions[j];
      // Rahu-Ketu are always opposite; skip that trivial pair.
      if (
        (a.planet === "Rahu" && b.planet === "Ketu") ||
        (a.planet === "Ketu" && b.planet === "Rahu")
      )
        continue;
      const r = bestRelation(a, b, positions);
      if (r)
        relations.push({
          subject: a.planet,
          object: b.planet,
          relation: r.relation,
          viaRetro: r.viaRetro,
          subjectSign: r.aSign,
          objectSign: r.bSign,
        });
    }
  }

  const strength = assessStrength(positions);
  const strengthOf = Object.fromEntries(
    strength.map((x) => [x.planet, x]),
  ) as Record<Planet, PlanetStrength>;

  const findings: Finding[] = [];
  const toGrade: GradeInput[] = [];
  // Strength is applied once every rule has fired (gradeFinding), so each reason is named once.
  const push = (f: Finding, g: Omit<GradeInput, "f">) => {
    findings.push(f);
    toGrade.push({ f, ...g });
  };
  const roles = rolesFor(gender);
  const frame = roles.gender === "female" ? "female" : "male";
  for (const rule of rules) {
    if (rule.frame && rule.frame !== frame) continue;
    const s = byPlanet[rule.when.subject];
    if (!s) continue;
    const st = strengthOf[s.planet];
    const w = rule.when;
    if (w.subjectRetro !== undefined && s.retrograde !== w.subjectRetro)
      continue;
    if (
      w.subjectCombust !== undefined &&
      st.effectiveCombust !== w.subjectCombust
    )
      continue;
    if (w.subjectDignity && !w.subjectDignity.includes(st.effectiveDignity))
      continue;
    if (w.subjectSign && !w.subjectSign.includes(s.signIndex)) continue;
    if (
      w.subjectSignLord &&
      !w.subjectSignLord.includes(SIGN_LORD[s.signIndex])
    )
      continue;
    if (
      w.subjectNakshatraLord &&
      !w.subjectNakshatraLord.includes(s.nakshatraLord)
    )
      continue;
    if (
      w.subjectElement &&
      !w.subjectElement.includes(SIGN_ELEMENT[s.signIndex])
    )
      continue;
    if (w.alone) {
      const neighbours = positions.filter(
        (p) =>
          p.planet !== s.planet &&
          ["conjunct", "next", "prev"].includes(
            relationOf(s.signIndex, p.signIndex),
          ),
      );
      if (neighbours.length > 0) continue;
    }

    // Extra companions (three- and four-planet combinations)
    const extra: Planet[] = [];
    const extraRels: GradeInput["companions"] = [];
    let extraOk = true;
    let extraStrength = 1;
    let extraRetro = false;
    for (const c of w.with ?? []) {
      const o = byPlanet[c.planet];
      const rel = o ? bestRelation(s, o, positions) : null;
      const allowed = c.relation ?? ["conjunct", "prev", "next"];
      if (!rel || !allowed.includes(rel.relation)) {
        extraOk = false;
        break;
      }
      extra.push(c.planet);
      extraRels.push({ planet: c.planet, relation: rel.relation });
      extraStrength = Math.min(extraStrength, RELATION_STRENGTH[rel.relation]);
      extraRetro = extraRetro || rel.viaRetro;
    }
    if (!extraOk) continue;
    // A three- or four-planet combination is the more specific statement; let it rank above the pairs it contains.
    const specificity = 1 + SPECIFICITY_BONUS * extra.length;

    if (w.object && w.house) {
      // House rule: whole-sign count from the subject, no retrograde alternates.
      const o = byPlanet[w.object];
      if (!o) continue;
      let h = houseFrom(s.signIndex, o.signIndex);
      let viaRetro = false;
      if (!w.house.includes(h)) {
        // Rao: a retrograde planet also aspects the rear sign at half strength (rules 11/12 permitting).
        const back = houseFrom(s.signIndex, (o.signIndex + 11) % 12);
        if (!(readsFromPreviousSign(o, positions) && w.house.includes(back)))
          continue;
        h = back;
        viaRetro = true;
      }
      const score =
        rule.weight *
        HOUSE_STRENGTH *
        Math.max(extraStrength, 0.6) *
        specificity *
        (viaRetro ? RETRO_STRENGTH : 1);
      push({
        ruleId: rule.id,
        area: rule.area,
        text: rule.text,
        score: Math.round(score * 100) / 100,
        planets: [s.planet, o.planet, ...extra],
        relation: null,
        viaRetro,
        house: h,
        source: rule.source,
      }, {
        rule,
        kind: "house",
        max: rule.weight * HOUSE_STRENGTH * specificity,
        companions: extraRels,
        relFactor: 1,
        extraFactor: Math.max(extraStrength, 0.6),
        retroFactor: viaRetro ? RETRO_STRENGTH : 1,
      });
      continue;
    }

    if (w.object) {
      const o = byPlanet[w.object];
      if (!o) continue;
      if (w.exchange && !(s.signLord === o.planet && o.signLord === s.planet))
        continue;
      const rel = bestRelation(s, o, positions);
      const allowed = w.exchange
        ? (w.relation ?? [
            "conjunct",
            "prev",
            "next",
            "trine",
            "opposite",
            "none",
          ])
        : (w.relation ?? ["conjunct"]);
      const relation: Relation = rel?.relation ?? "none";
      if (!w.exchange && (!rel || !allowed.includes(relation))) continue;
      if (w.exchange && rel && !allowed.includes(relation)) continue;
      const strength = w.exchange
        ? Math.max(0.9, RELATION_STRENGTH[relation])
        : RELATION_STRENGTH[relation];
      const viaRetro = (rel?.viaRetro ?? false) || extraRetro;
      const score =
        rule.weight *
        strength *
        Math.max(extraStrength, 0.6) *
        specificity *
        (viaRetro ? RETRO_STRENGTH : 1);
      const flow =
        (relation === "conjunct" || relation === "trine") && !viaRetro
          ? (flowBetween(s, o) ?? undefined)
          : undefined;
      push({
        ruleId: rule.id,
        area: rule.area,
        text: rule.text,
        score: Math.round(score * 100) / 100,
        planets: [s.planet, o.planet, ...extra],
        relation: w.exchange && relation === "none" ? null : relation,
        viaRetro,
        source: rule.source,
        flow,
      }, {
        rule,
        kind: "pair",
        // An exchange is graded on its own footing: the sign relation does not reduce it.
        max: rule.weight * specificity * (w.exchange ? strength : 1),
        companions: extraRels,
        relFactor: w.exchange ? 1 : strength,
        extraFactor: Math.max(extraStrength, 0.6),
        retroFactor: viaRetro ? RETRO_STRENGTH : 1,
      });
    } else if (extra.length) {
      const score =
        rule.weight *
        Math.max(extraStrength, 0.6) *
        specificity *
        (extraRetro ? 0.85 : 1);
      push({
        ruleId: rule.id,
        area: rule.area,
        text: rule.text,
        score: Math.round(score * 100) / 100,
        planets: [s.planet, ...extra],
        relation: null,
        viaRetro: extraRetro,
        source: rule.source,
      }, {
        rule,
        kind: "extra",
        max: rule.weight * specificity,
        companions: extraRels,
        relFactor: 1,
        extraFactor: Math.max(extraStrength, 0.6),
        retroFactor: extraRetro ? 0.85 : 1,
      });
    } else {
      push({
        ruleId: rule.id,
        area: rule.area,
        text: rule.text,
        score: rule.weight,
        planets: [s.planet],
        relation: null,
        viaRetro: false,
        source: rule.source,
      }, {
        rule,
        kind: "single",
        max: rule.weight,
        companions: [],
        relFactor: 1,
        extraFactor: 1,
        retroFactor: 1,
      });
    }
  }
  for (const g of toGrade) gradeFinding(g, strengthOf);
  findings.sort((a, b) => b.score - a.score);

  const summarise = (p: PlanetPosition, role: string): Reading["jeeva"] => {
    const companions = positions
      .filter((q) => q.planet !== p.planet && q.signIndex === p.signIndex)
      .map((q) => q.planet);
    const st = strengthOf[p.planet];
    const parts: string[] = [];
    parts.push(
      `${p.planet} (${role}) in ${SIGNS[p.signIndex]}${p.retrograde && CLASSICAL.includes(p.planet) ? ", retrograde" : ""}, ${p.dignity.toLowerCase()}${st.effectiveDignity !== p.dignity ? " by sign but set aside" : ""}.`,
    );
    if (st.dignityNote) parts.push(`${st.dignityNote}.`);
    if (companions.length) parts.push(`Conjunct ${companions.join(", ")}.`);
    if (st.winningOver.length)
      parts.push(`Leads ${st.winningOver.join(", ")} by degree.`);
    if (st.losingTo.length)
      parts.push(`Yields to ${st.losingTo.join(", ")} by degree.`);
    if (p.combust)
      parts.push(`${st.combustNote ?? "Combust within the Sun's pada"}.`);
    if (readsFromPreviousSign(p, positions))
      parts.push(
        `Also reads from ${SIGNS[(p.signIndex + 11) % 12]} by retrogression, at half strength.`,
      );
    else if (p.retrograde && CLASSICAL.includes(p.planet))
      parts.push(
        p.retrogradeEntry
          ? `Backed into ${SIGNS[p.signIndex]} from ${SIGNS[(p.signIndex + 1) % 12]}, so it is not read from the sign before.`
          : `Under Rahu or Ketu, so it is not read from the previous sign.`,
      );
    parts.push(
      `Sign lord ${SIGN_LORD[p.signIndex]}; nakshatra ${p.nakshatra} (${p.nakshatraLord}).`,
    );
    return {
      sign: SIGNS[p.signIndex],
      retro: p.retrograde,
      dignity: st.effectiveDignity,
      companions,
      summary: parts.join(" "),
    };
  };

  return {
    findings,
    relations,
    strength,
    chains: degreeChains(positions),
    marriage: assessMarriage(positions, gender),
    children: assessChildren(positions, gender),
    lakshmi: assessLakshmi(positions),
    roles,
    jeeva: summarise(byPlanet[roles.native], "Jeeva karaka"),
    karma: summarise(byPlanet.Saturn, "Karma karaka"),
    deha:
      roles.deha !== roles.native
        ? summarise(byPlanet[roles.deha], "Deha karaka")
        : undefined,
  };
}

// Transit activation text: what Jupiter (or Saturn) touching a natal planet tends to bring.
export const TRANSIT_ACTIVATION: Record<
  "Jupiter" | "Saturn",
  Record<Planet, string>
> = {
  Jupiter: {
    Sun: "recognition, father-related events, dealings with authority",
    Moon: "relocation, mother-related events, emotional turning point",
    Mars: "property, siblings, technical ventures, surgery or courage tested",
    Mercury:
      "education milestones, new contracts, communication, travel for trade",
    Jupiter: "twelve-year return: a new chapter, children, wisdom, expansion",
    Venus: "marriage or partnership, vehicles, comforts, financial gain",
    Saturn:
      "career change or elevation, new responsibilities, long-term commitments",
    Rahu: "foreign travel or settlement, sudden opportunity, technology",
    Ketu: "spiritual turn, detachment, medical or research matters, endings",
  },
  Saturn: {
    Sun: "pressure from authority, father's health, hard-won status",
    Moon: "mental strain, domestic burdens, mother's health",
    Mars: "disputes over property or siblings, accidents from overexertion",
    Mercury: "heavy workload in communication or accounts; slow paperwork",
    Jupiter:
      "discipline imposed on the self; children's responsibilities; delayed rewards",
    Venus: "strain in partnership, financial caution, delayed pleasures",
    Saturn: "Saturn return: profession restructured, karmic settlement",
    Rahu: "foreign obligations, technological grind, isolation",
    Ketu: "spiritual austerity, ancestral debts, disciplined healing",
  },
};
