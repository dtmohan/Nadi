// Krishnamurti Paddhati reading rules: what the sub lord of each cusp promises.
//
// Every rule is a paraphrase entered from the practitioner's own copies (Astro Secrets & Krishnamurti
// Padhdhati Part 3, ch. 6 "Principle of Sublords and Relevant Houses", ed. K. Subramaniam, and the
// Kalpurush Astrology KP class notes by Sagar Neogi). The books are cited by volume and page; no
// passage is reproduced. Rules are evaluated on the houses the cuspal sub lord signifies
// (Krishnamurti's four steps, optionally the six-step table taught in the class).

import { SIGNS, type Planet } from "./astro";
import type { KpResult, SignificatorLevel } from "./kp";

export type KpPolarity = "good" | "bad" | "neutral";

export interface KpRuleWhen {
  /** The cusp whose sub lord is judged. */
  cusp: number;
  /** The sub lord must signify every one of these houses. */
  all?: number[];
  /** ... at least one of these. */
  any?: number[];
  /** ... none of these. */
  none?: number[];
  /** ... at least `count` of these houses. */
  minOf?: { houses: number[]; count: number };
  /** ... fewer than `count` of these houses. */
  fewerThan?: { houses: number[]; count: number };
  /** The sub lord is a strong significator (star-lord occupancy or own occupancy) of one of these. */
  strong?: number[];
  subLordIs?: Planet[];
  subLordNot?: Planet[];
  /** The sub lord is posited in one of these bhavas. */
  subLordInHouse?: number[];
  subLordRetro?: boolean;
  subLordInDualSign?: boolean;
  /** The sub lord's own star lord occupies one of these houses ("in the constellation of a planet deposited in..."). */
  starLordOccupies?: number[];
  /** The sub lord's star lord signifies every one of these ("in the constellation of a planet signifying..."). */
  starLordSignifies?: number[];
  /** ... at least one of these. */
  starLordSignifiesAny?: number[];
  starLordIs?: Planet[];
  /** The sub lord is itself deposited in the sub of one of these planets. */
  subLordSubIs?: Planet[];
  /** The sign the sub lord occupies is movable, fixed or dual. */
  subLordSignQuality?: Array<"Movable" | "Fixed" | "Dual">;
  /** The sub lord's star lord signifies the badhaka or a maraka house. */
  starLordBadhakaMaraka?: boolean;
  /** The sub lord is connected to one of these planets: it is that planet, sits with it, is in its star or sub, or has it in its own star. */
  connectedTo?: Planet[];
  /** ... to every one of these. */
  connectedToAll?: Planet[];
  /** The sub lord is connected to none of these planets. */
  connectedToNone?: Planet[];
  /** Tight tie to every listed planet: the sub lord is that planet, is in its star or sub, or is within 3 degrees of it (Part 1 p. 194's sense for profession). */
  tiedToAll?: Planet[];
  /** The sub lord signifies the badhaka house (11 movable / 9 fixed / 7 dual lagna). */
  badhaka?: boolean;
  /** The sub lord signifies a maraka house (2 or 7). */
  maraka?: boolean;
  lagnaQuality?: Array<"Movable" | "Fixed" | "Dual">;
  /** The lagna falls in one of these signs (0 = Aries). */
  lagnaSignIn?: number[];
  /** The sub lord is not a strong significator of any of these. */
  notStrong?: number[];
  /** The sub lord stands in one of these signs (0 = Aries). */
  subLordSignIn?: number[];
  /** A second cusp whose sub lord must also meet a condition. */
  otherCusp?: { cusp: number; all?: number[]; any?: number[]; none?: number[]; minOf?: { houses: number[]; count: number } };
}

export interface KpRule {
  id: string;
  cusp: number;
  topic: string;
  when: KpRuleWhen;
  text: string;
  polarity: KpPolarity;
  /** Houses whose significators' conjoined dasa-bhukti-antara time the event. */
  timing?: number[];
  source: string;
  sourceUrl?: string;
}

export interface KpFinding {
  ruleId: string;
  cusp: number;
  topic: string;
  text: string;
  polarity: KpPolarity;
  timing?: number[];
  source: string;
  /** What was seen: the sub lord and the houses that satisfied the rule. */
  evidence: string;
  sourceUrl?: string;
  subLord: Planet;
}

const C32 = "Kalpurush Astrology, KP class 3.2 (the 1st cusp), S. Neogi";
const C41 = "Kalpurush Astrology, KP class 4.1 (the 2nd cusp), S. Neogi";
const P3 = (p: string) => `Astro Secrets & KP Part 3, ch. 6, p. ${p}`;
const P1 = (p: string) => `Astro Secrets & KP Part 1, ch. 16, p. ${p}`;
const DUTTA_URL = "https://kpastrologylearning.com/free-kp-astrology-rules/";
const DUTTA = (house: string, slug: string) => ({ source: `Dr. Andrew Dutta (Sri Indrajit), free KP bhava rules, ${house} house`, sourceUrl: `https://kpastrologylearning.com/kp-jyotish-astrology-${slug}-house-bhava-rules/` });

const IMPROVING = [1, 2, 3, 6, 10, 11];

export const KP_CUSP_THEMES: Record<number, string> = {
  1: "Self, health, longevity, temperament",
  2: "Finance, family, speech, right eye, marriage (maraka)",
  3: "Courage, siblings, short journeys, writing, communications",
  4: "Education, home, property, vehicles, mother",
  5: "Children, speculation, love, arts, mantra",
  6: "Illness, loans, service, litigation, competitors",
  7: "Marriage, partners, the other party",
  8: "Longevity, accidents, surgery, legacy, debts",
  9: "Father, higher learning, long journeys, faith",
  10: "Profession, status, government",
  11: "Fulfilment of desires, gains, friends, recovery",
  12: "Loss, foreign lands, hospital, confinement, the left eye",
};

export const KP_RULES: KpRule[] = [
  // ---------------- Cusp I ----------------
  { id: "kp1-life-long", cusp: 1, topic: "Longevity", when: { cusp: 1, minOf: { houses: [1, 5, 9, 11], count: 2 }, fewerThan: { houses: [6, 8, 12], count: 2 } }, text: "The lagna sub lord leans on the life-supporting houses 1, 5, 9 and 11 and stays clear of 6, 8, 12: a long span is promised.", polarity: "good", source: C32 },
  { id: "kp1-life-short", cusp: 1, topic: "Longevity", when: { cusp: 1, minOf: { houses: [6, 8, 12], count: 2 }, fewerThan: { houses: [1, 5, 9, 11], count: 2 } }, text: "The lagna sub lord leans on 6, 8 and 12 without the support of 1, 5, 9, 11: the body is under strain and longevity needs care, the more so if the badhaka or a maraka house joins in.", polarity: "bad", source: C32 },
  { id: "kp1-life-medium", cusp: 1, topic: "Longevity", when: { cusp: 1, minOf: { houses: [6, 8, 12], count: 2 }, otherCusp: { cusp: 1, minOf: { houses: [1, 5, 9, 11], count: 2 } } }, text: "The lagna sub lord signifies both the supporting houses (1, 5, 9, 11) and the draining ones (6, 8, 12): a middling span, with health needing care in the periods of the 6-8-12 significators.", polarity: "neutral", source: C32 },
  { id: "kp1-badhaka", cusp: 1, topic: "Longevity", when: { cusp: 1, badhaka: true }, text: "The lagna sub lord signifies the badhaka house (the 11th for a movable lagna, the 9th for fixed, the 7th for dual). The class notes and the book both rank this above a maraka link as an obstruction to health and life.", polarity: "bad", source: `${C32}; ${P3("38")}` },
  { id: "kp1-maraka", cusp: 1, topic: "Longevity", when: { cusp: 1, maraka: true, badhaka: false }, text: "The lagna sub lord signifies a maraka house (2 or 7): the periods of the 2nd and 7th significators call for care with health.", polarity: "bad", source: `${C32}; ${P3("38")}` },
  { id: "kp1-sickly", cusp: 1, topic: "Health", when: { cusp: 1, starLordOccupies: [6] }, text: "The lagna sub lord sits in the star of a planet in the 6th: a constitution prone to illness.", polarity: "bad", source: P3("39") },
  { id: "kp1-healthy", cusp: 1, topic: "Health", when: { cusp: 1, starLordOccupies: [1, 11] }, text: "The lagna sub lord sits in the star of a planet in the 1st or 11th: good health and recovery when ill.", polarity: "good", source: P3("39") },
  { id: "kp1-recovery", cusp: 1, topic: "Health", when: { cusp: 1, minOf: { houses: [1, 3, 5], count: 2 } }, text: "The lagna sub lord signifies 1, 3 and 5: illness is recovered from, in the conjoined period of the 1-5-9-11 significators (for a movable lagna take the 9th rather than the 11th).", polarity: "good", timing: [1, 5, 9, 11], source: C32 },
  { id: "kp1-anxiety", cusp: 1, topic: "Mind", when: { cusp: 1, any: [6] }, text: "The lagna sub lord signifies the 6th, the house of anxiety: worry and low confidence surface in the periods of 3 and 6, and lift in the periods of 1, 5, 9 and 11.", polarity: "bad", timing: [1, 5, 9, 11], source: C32 },
  { id: "kp1-nervous", cusp: 1, topic: "Mind", when: { cusp: 1, any: [3], none: [6] }, text: "The lagna sub lord signifies the 3rd: nervous energy and restlessness rather than settled confidence.", polarity: "neutral", source: C32 },
  { id: "kp1-popular", cusp: 1, topic: "Standing", when: { cusp: 1, minOf: { houses: [1, 3, 10, 11], count: 3 } }, text: "The lagna sub lord signifies 1, 3, 10 and 11: a popular, well-regarded person.", polarity: "good", source: C32 },
  { id: "kp1-decisive", cusp: 1, topic: "Temperament", when: { cusp: 1, minOf: { houses: [1, 6, 10, 11], count: 3 } }, text: "The lagna sub lord signifies 1, 6, 10 and 11: decisive, able to take a stand and carry it through.", polarity: "good", source: C32 },
  { id: "kp1-fame", cusp: 1, topic: "Standing", when: { cusp: 1, any: [10] }, text: "The lagna sub lord is connected to the 10th: name and reputation come through work.", polarity: "good", source: P3("39") },
  { id: "kp1-suicidal", cusp: 1, topic: "Temperament", when: { cusp: 1, all: [2, 7, 8], badhaka: true }, text: "The lagna sub lord signifies 2, 7 and 8 together with the badhaka house: the class notes flag a self-destructive streak under pressure. Read with care and with the 8th cusp.", polarity: "bad", source: C32 },
  { id: "kp1-accident", cusp: 1, topic: "Health", when: { cusp: 1, minOf: { houses: [1, 6, 7, 8, 12], count: 3 }, badhaka: true }, text: "The lagna sub lord signifies several of 1, 6, 7, 8, 12 and the badhaka house: accident-prone; the 8th cusp sub lord shows how serious.", polarity: "bad", source: C32 },
  { id: "kp1-spiritual", cusp: 1, topic: "Temperament", when: { cusp: 1, subLordIs: ["Ketu"], starLordOccupies: [9, 12], connectedTo: ["Saturn"] }, text: "Ketu as lagna sub lord, in the star of a planet in the 9th or 12th and connected to Saturn: a spiritual, withdrawing bent.", polarity: "neutral", source: P3("39") },

  // ---------------- Cusp II ----------------
  { id: "kp2-wealth-high", cusp: 2, topic: "Finance", when: { cusp: 2, minOf: { houses: [6, 10, 11], count: 2 }, none: [5, 8, 12] }, text: "The 2nd sub lord signifies 6, 10 and 11 and none of 5, 8, 12: substantial wealth, gathered in the conjoined periods of the 2-6-10-11 significators.", polarity: "good", timing: [2, 6, 10, 11], source: C41 },
  { id: "kp2-wealth-low", cusp: 2, topic: "Finance", when: { cusp: 2, minOf: { houses: [5, 8, 12], count: 2 }, none: [6, 10, 11] }, text: "The 2nd sub lord signifies 5, 8 and 12 and none of 6, 10, 11: money stays modest and leaks through the houses of loss.", polarity: "bad", source: C41 },
  { id: "kp2-wealth-mixed", cusp: 2, topic: "Finance", when: { cusp: 2, any: [6, 10, 11], minOf: { houses: [5, 8, 12], count: 1 } }, text: "The 2nd sub lord signifies both the gaining houses (6, 10, 11) and the losing ones (5, 8, 12): a middling, up-and-down financial life.", polarity: "neutral", source: C41 },
  { id: "kp2-fin-verygood", cusp: 2, topic: "Finance", when: { cusp: 2, starLordSignifies: [6, 11] }, text: "The 2nd sub lord is in the star of a planet signifying 6 and 11: very good finances.", polarity: "good", source: P3("41") },
  { id: "kp2-fin-moderate", cusp: 2, topic: "Finance", when: { cusp: 2, starLordSignifies: [2, 10] }, text: "The 2nd sub lord is in the star of a planet signifying 2 and 10: moderate but steady finances.", polarity: "neutral", source: P3("41") },
  { id: "kp2-improving", cusp: 2, topic: "Finance", when: { cusp: 2, minOf: { houses: IMPROVING, count: 3 } }, text: "The 2nd sub lord is tied to the improving houses (1, 2, 3, 6, 10, 11): the financial position keeps improving.", polarity: "good", source: P3("42") },
  { id: "kp2-gain", cusp: 2, topic: "Finance", when: { cusp: 2, all: [2], any: [6, 11] }, text: "The 2nd sub lord signifies 2 with 6 or 11: money comes in.", polarity: "good", timing: [2, 6, 11], source: C41 },
  { id: "kp2-loss", cusp: 2, topic: "Finance", when: { cusp: 2, all: [2], any: [8, 12] }, text: "The 2nd sub lord signifies 2 with 8 or 12: losses and money going out.", polarity: "bad", source: C41 },
  { id: "kp2-entangled", cusp: 2, topic: "Finance", when: { cusp: 2, all: [2, 5, 8] }, text: "The 2nd sub lord signifies 2, 5 and 8: money lent gets entangled and is slow to return.", polarity: "bad", source: C41 },
  { id: "kp2-speculation", cusp: 2, topic: "Finance", when: { cusp: 2, all: [5, 11] }, text: "The 2nd sub lord signifies 5 and 11: gains through speculation.", polarity: "good", source: C41 },
  { id: "kp2-lottery", cusp: 2, topic: "Finance", when: { cusp: 2, all: [3, 11] }, text: "The 2nd sub lord signifies 3 and 11: luck in lotteries and draws.", polarity: "good", source: C41 },
  { id: "kp2-insurance", cusp: 2, topic: "Finance", when: { cusp: 2, all: [8, 11] }, text: "The 2nd sub lord signifies 8 and 11: insurance claims, legacies and dues are realised.", polarity: "good", source: C41 },
  { id: "kp2-service", cusp: 2, topic: "Livelihood", when: { cusp: 2, minOf: { houses: [2, 6, 10, 11], count: 3 } }, text: "The 2nd sub lord signifies 2, 6, 10 and 11: income through service.", polarity: "neutral", source: C41 },
  { id: "kp2-business", cusp: 2, topic: "Livelihood", when: { cusp: 2, minOf: { houses: [2, 7, 10, 11], count: 3 }, all: [7] }, text: "The 2nd sub lord signifies 2, 7, 10 and 11: income through business and public dealings.", polarity: "neutral", source: `${C41}; ${P3("40")}` },
  { id: "kp2-src-1", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [1] }, text: "Through the 1st: earnings by personal effort and one's own name.", polarity: "neutral", source: C41 },
  { id: "kp2-src-2", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [2] }, text: "Through the 2nd: family business, speech and oratory, food, hotels.", polarity: "neutral", source: C41 },
  { id: "kp2-src-3", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [3] }, text: "Through the 3rd: marketing, writing, agencies, communications, short travel.", polarity: "neutral", source: C41 },
  { id: "kp2-src-4", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [4] }, text: "Through the 4th: land, property, inheritance, vehicles, the home town.", polarity: "neutral", source: C41 },
  { id: "kp2-src-5", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [5] }, text: "Through the 5th: entertainment, cinema, sports, speculation, children.", polarity: "neutral", source: C41 },
  { id: "kp2-src-6", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [6] }, text: "Through the 6th: service, loans and lending, medicine, hospitality, HR, pets and poultry.", polarity: "neutral", source: C41 },
  { id: "kp2-src-7", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [7] }, text: "Through the 7th: partnerships, marriage, legal and public dealings.", polarity: "neutral", source: C41 },
  { id: "kp2-src-8", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [8] }, text: "Through the 8th: legacies, insurance, gratuity, provident fund, ancestral money.", polarity: "neutral", source: C41 },
  { id: "kp2-src-9", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [9] }, text: "Through the 9th: foreign connections, import-export, religious and charitable bodies.", polarity: "neutral", source: C41 },
  { id: "kp2-src-10", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [10] }, text: "Through the 10th: status, government, politics, the profession itself.", polarity: "neutral", source: C41 },
  { id: "kp2-src-11", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [11] }, text: "Through the 11th: gains with little effort, sudden and easy money.", polarity: "neutral", source: C41 },
  { id: "kp2-src-12", cusp: 2, topic: "Sources of income", when: { cusp: 2, any: [12] }, text: "Through the 12th: hospitals, hostels, prisons, research, complex or hidden subjects.", polarity: "neutral", source: C41 },
  { id: "kp2-property", cusp: 2, topic: "Finance", when: { cusp: 2, any: [4, 8, 9], minOf: { houses: [6, 7, 11], count: 1 }, all: [2] }, text: "The 2nd sub lord ties 4, 8 or 9 with 2 and 6-7-11: income from property.", polarity: "good", timing: [2, 6, 10, 11], source: C41 },
  { id: "kp2-abroad", cusp: 2, topic: "Livelihood", when: { cusp: 2, all: [9, 12], minOf: { houses: [2, 6, 10], count: 1 } }, text: "The 2nd sub lord signifies 9 and 12 with 2, 6 or 10: earning abroad, in the conjoined period of 3, 9 and 12.", polarity: "good", timing: [3, 9, 12], source: C41 },
  { id: "kp2-speech-mars", cusp: 2, topic: "Speech", when: { cusp: 2, subLordIs: ["Mars"] }, text: "Mars as 2nd sub lord: blunt, hasty speech that can stretch the truth; an argumentative streak.", polarity: "neutral", source: P3("40") },
  { id: "kp2-speech-saturn", cusp: 2, topic: "Speech", when: { cusp: 2, subLordIs: ["Saturn"] }, text: "Saturn as 2nd sub lord: slow, guarded speech that keeps things back.", polarity: "neutral", source: P3("40") },
  { id: "kp2-speech-mercury", cusp: 2, topic: "Speech", when: { cusp: 2, subLordIs: ["Mercury"] }, text: "Mercury as 2nd sub lord: detailed, quick and versatile speech.", polarity: "neutral", source: P3("40") },
  { id: "kp2-speech-venus", cusp: 2, topic: "Speech", when: { cusp: 2, subLordIs: ["Venus"] }, text: "Venus as 2nd sub lord: pleasant, peace-making speech.", polarity: "neutral", source: P3("40") },
  { id: "kp2-speech-sun", cusp: 2, topic: "Speech", when: { cusp: 2, subLordIs: ["Sun"] }, text: "Sun as 2nd sub lord: dignified, noble speech.", polarity: "neutral", source: P3("40") },
  { id: "kp2-speech-jupiter", cusp: 2, topic: "Speech", when: { cusp: 2, subLordIs: ["Jupiter"] }, text: "Jupiter as 2nd sub lord: truthful, expansive speech.", polarity: "neutral", source: P3("40") },
  { id: "kp2-orator", cusp: 2, topic: "Speech", when: { cusp: 2, subLordIs: ["Jupiter", "Mercury"], minOf: { houses: [1, 6, 10, 11], count: 2 } }, text: "Jupiter or Mercury as 2nd sub lord signifying 1, 6, 10 and 11: a good orator.", polarity: "good", source: C41 },
  { id: "kp2-speech-defect", cusp: 2, topic: "Speech", when: { cusp: 2, all: [8, 12] }, text: "The 2nd sub lord signifies 8 and 12: a defect of speech or of the right eye is possible.", polarity: "bad", source: `${C41}; ${P3("41")}` },
  { id: "kp2-eye", cusp: 2, topic: "Health", when: { cusp: 2, any: [12], none: [8] }, text: "The 2nd sub lord is connected to the 12th: trouble with eyesight; the 8th would point to the right eye.", polarity: "bad", source: P3("41") },
  { id: "kp2-children", cusp: 2, topic: "Family", when: { cusp: 2, all: [5, 11] }, text: "The 2nd sub lord signifies 5 and 11: children are indicated (the 2nd being the 11th to the 4th, the house of the family).", polarity: "good", timing: [2, 5, 11], source: P3("40") },
  { id: "kp2-marriage", cusp: 2, topic: "Family", when: { cusp: 2, all: [7, 11] }, text: "The 2nd sub lord signifies 7 and 11: marriage and addition to the family.", polarity: "good", timing: [2, 7, 11], source: P3("40") },
  { id: "kp2-borrow", cusp: 2, topic: "Finance", when: { cusp: 2, any: [6], none: [10, 11] }, text: "The 2nd sub lord signifies the 6th without 10 or 11: money by borrowing, debts accumulate.", polarity: "bad", source: P3("40") },
  { id: "kp2-second-marriage", cusp: 2, topic: "Family", when: { cusp: 2, subLordIs: ["Mercury"], all: [7] }, text: "Mercury (a dual planet) as 2nd sub lord signifying the 7th: more than one marriage or a second union is possible.", polarity: "neutral", source: C41 },
  { id: "kp2-maraka", cusp: 2, topic: "Longevity", when: { cusp: 2, all: [7], badhaka: true }, text: "The 2nd sub lord signifies the 7th and the badhaka house: both marakas and the badhaka meet; the conjoined periods need care with health.", polarity: "bad", source: P3("40") },

  // ---------------- Cusp III ----------------
  { id: "kp3-success", cusp: 3, topic: "Communications", when: { cusp: 3, all: [3, 11] }, text: "The 3rd sub lord signifies 3 and 11: success in negotiations, correspondence, agreements and short journeys.", polarity: "good", timing: [3, 11], source: P3("42") },
  { id: "kp3-loss", cusp: 3, topic: "Communications", when: { cusp: 3, all: [3, 12] }, text: "The 3rd sub lord signifies 3 and 12: letters, messages and short trips bring loss or go astray.", polarity: "bad", source: P3("42") },
  { id: "kp3-bold", cusp: 3, topic: "Temperament", when: { cusp: 3, minOf: { houses: [2, 10, 11], count: 2 } }, text: "The 3rd sub lord signifies 2, 10 and 11: boldness that pays.", polarity: "good", source: P3("43") },
  { id: "kp3-courage", cusp: 3, topic: "Temperament", when: { cusp: 3, subLordIs: ["Jupiter", "Sun", "Mars", "Venus"] }, text: "Jupiter, Sun, Mars or Venus as 3rd sub lord: courage to face competition.", polarity: "good", source: P3("43") },
  { id: "kp3-exams", cusp: 3, topic: "Competition", when: { cusp: 3, minOf: { houses: [4, 9, 11], count: 2 } }, text: "The 3rd sub lord signifies 4, 9 and 11: success in competitive examinations (6 and 10 add success in interviews).", polarity: "good", timing: [4, 9, 11], source: P3("43") },
  { id: "kp3-journalism", cusp: 3, topic: "Communications", when: { cusp: 3, all: [3, 11], connectedTo: ["Mercury", "Jupiter"] }, text: "The 3rd sub lord signifies 3 and 11 and is connected to Mercury or Jupiter: writing, journalism, publishing.", polarity: "good", source: P3("43") },
  { id: "kp3-appeal", cusp: 3, topic: "Litigation", when: { cusp: 3, all: [6, 11] }, text: "The 3rd sub lord signifies 6 and 11: appeals and petitions succeed.", polarity: "good", source: P3("44") },
  { id: "kp3-hearing", cusp: 3, topic: "Health", when: { cusp: 3, any: [12], connectedTo: ["Mars"] }, text: "The 3rd sub lord signifies the 12th and is connected to Mars: a weakness of hearing.", polarity: "bad", source: P3("44") },
  // ── Cusp III from Astro Secrets Part 1, ch. 16 (pp. 131-135) and Dutta's free bhava rules ──
  { id: "kp3-trade-dignified", cusp: 3, topic: "Trade", when: { cusp: 3, all: [3], minOf: { houses: [2, 6, 10, 11], count: 2 } }, text: "The 3rd sub lord ties the 3rd to the improving houses 2, 6, 10 and 11: whatever the 10th sub lord has fixed as the profession is carried on at a dignified scale, as wholesale, distribution or export, and with profit, in the periods of the 3rd lord.", polarity: "good", timing: [2, 3, 10, 11], source: P1("132-134") },
  { id: "kp3-trade-hawking", cusp: 3, topic: "Trade", when: { cusp: 3, all: [3], minOf: { houses: [5, 8], count: 1 }, fewerThan: { houses: [2, 6, 10, 11], count: 2 } }, text: "The 3rd sub lord ties the 3rd to 5 and 8 without the support of 2, 6, 10 and 11: the same line of work is done the hard way, hawking, small retail, moving about with little profit.", polarity: "bad", source: P1("132-134") },
  { id: "kp3-goods-sun", cusp: 3, topic: "Trade", when: { cusp: 3, subLordIs: ["Sun"], any: [3] }, text: "Sun as 3rd sub lord signifying the 3rd: the goods traded or carried are metal vessels and utensils.", polarity: "neutral", source: P1("132") },
  { id: "kp3-goods-moon", cusp: 3, topic: "Trade", when: { cusp: 3, subLordIs: ["Moon"], any: [3] }, text: "Moon as 3rd sub lord signifying the 3rd: drinks, fruit, flowers, fresh produce.", polarity: "neutral", source: P1("132") },
  { id: "kp3-goods-mars", cusp: 3, topic: "Trade", when: { cusp: 3, subLordIs: ["Mars"], any: [3] }, text: "Mars as 3rd sub lord signifying the 3rd: hot food and drink, vegetables.", polarity: "neutral", source: P1("132") },
  { id: "kp3-goods-mercury", cusp: 3, topic: "Trade", when: { cusp: 3, subLordIs: ["Mercury"], any: [3] }, text: "Mercury as 3rd sub lord signifying the 3rd: books, paper, sports goods; with 3 and 11 a name in the share market, with 3, 6 and 11 a broker, with 3, 7 and 11 a newspaper.", polarity: "neutral", source: P1("131-132") },
  { id: "kp3-goods-jupiter", cusp: 3, topic: "Trade", when: { cusp: 3, subLordIs: ["Jupiter"], any: [3] }, text: "Jupiter as 3rd sub lord signifying the 3rd: sweets, coconuts, fruit, provisions.", polarity: "neutral", source: P1("132") },
  { id: "kp3-goods-venus", cusp: 3, topic: "Trade", when: { cusp: 3, subLordIs: ["Venus"], any: [3] }, text: "Venus as 3rd sub lord signifying the 3rd: cloth, garments, plastics, finery.", polarity: "neutral", source: P1("132") },
  { id: "kp3-goods-saturn", cusp: 3, topic: "Trade", when: { cusp: 3, subLordIs: ["Saturn"], any: [3] }, text: "Saturn as 3rd sub lord signifying the 3rd: oil, iron and steel, scrap and salvage.", polarity: "neutral", source: P1("131-132") },
  { id: "kp3-broker", cusp: 3, topic: "Trade", when: { cusp: 3, all: [3, 6], minOf: { houses: [10, 11], count: 1 } }, text: "The 3rd sub lord signifies 3, 6 and 10 or 11: work as a broker, agent or middleman.", polarity: "good", timing: [3, 6, 11], source: P1("135") },
  { id: "kp3-newspaper", cusp: 3, topic: "Communications", when: { cusp: 3, all: [3, 10, 11] }, text: "The 3rd sub lord signifies 3, 10 and 11: running a newspaper, a press or a publishing concern.", polarity: "good", source: P1("135") },
  { id: "kp3-journey", cusp: 3, topic: "Travel", when: { cusp: 3, all: [3, 12], minOf: { houses: [1, 11], count: 1 } }, text: "The 3rd sub lord signifies 3 and 12 with 1 or 11: journeys and movement are a settled part of life; with 11 they progress from light to heavy vehicles.", polarity: "neutral", timing: [3, 12], source: P1("135") },
  { id: "kp3-contracts", cusp: 3, topic: "Communications", when: { cusp: 3, all: [3, 11], minOf: { houses: [1, 7], count: 1 } }, text: "The 3rd sub lord signifies 3, 11 and 1 or 7: contracts and agreements are signed and hold.", polarity: "good", timing: [3, 7, 11], source: P1("135") },
  { id: "kp3-negotiation-planet", cusp: 3, topic: "Communications", when: { cusp: 3, all: [3, 11], subLordIs: ["Mercury", "Jupiter"] }, text: "Mercury or Jupiter as 3rd sub lord signifying 3 and 11: negotiations succeed, and the word given is kept.", polarity: "good", timing: [3, 11], source: P1("135") },
  { id: "kp3-meetings", cusp: 3, topic: "Communications", when: { cusp: 3, all: [3], minOf: { houses: [1, 7, 9, 11], count: 2 } }, text: "The 3rd sub lord signifies the 3rd with two of 1, 7, 9 and 11: appointments are kept and the people sought are met.", polarity: "good", source: P1("135") },
  { id: "kp3-electricals", cusp: 3, topic: "Possessions", when: { cusp: 3, all: [3, 12], minOf: { houses: [1, 5], count: 1 } }, text: "The 3rd sub lord signifies 3 and 12 with 1 or 5: purchase of radios, televisions and electrical goods.", polarity: "neutral", source: P1("135") },
  { id: "kp3-vehicle-grand", cusp: 3, topic: "Possessions", when: { cusp: 3, none: [4, 8], minOf: { houses: [1, 3, 5, 10, 11, 12], count: 4 } }, text: "The 3rd sub lord is clear of 4 and 8 and well connected to 3, 11, 12, 5, 1 and 10: with a strong lagna lord and a supporting 4th sub lord, vehicles of the highest class, even ship or aircraft travel as a way of life.", polarity: "good", source: P1("137") },
  { id: "kp3-lottery", cusp: 3, topic: "Gains", when: { cusp: 3, all: [3, 8, 11] }, text: "The 3rd sub lord signifies 3, 8 and 11: gains by lottery, windfall or speculation; timed by the 2, 6 and 11 significators linked to the 3rd.", polarity: "good", timing: [2, 6, 11], ...DUTTA("third", "third") },
  { id: "kp3-rumour-saturn", cusp: 3, topic: "Communications", when: { cusp: 3, starLordIs: ["Saturn"] }, text: "The 3rd sub lord is in the star of Saturn: rumours and news that reach the native are false or delayed.", polarity: "neutral", ...DUTTA("third", "third") },
  { id: "kp3-rumour-mars", cusp: 3, topic: "Communications", when: { cusp: 3, starLordIs: ["Mars"] }, text: "The 3rd sub lord is in the star of Mars: news reaches the native twisted or mischievous.", polarity: "neutral", ...DUTTA("third", "third") },
  { id: "kp3-rumour-jupiter", cusp: 3, topic: "Communications", when: { cusp: 3, starLordIs: ["Jupiter"] }, text: "The 3rd sub lord is in the star of Jupiter: the news and reports that reach the native are true.", polarity: "neutral", ...DUTTA("third", "third") },
  { id: "kp3-content-mars", cusp: 3, topic: "Temperament", when: { cusp: 3, subLordIs: ["Mars"] }, text: "Mars as 3rd sub lord: never quite contented, always reaching for the next thing.", polarity: "neutral", ...DUTTA("third", "third") },
  { id: "kp3-content-jupiter", cusp: 3, topic: "Temperament", when: { cusp: 3, subLordIs: ["Jupiter"] }, text: "Jupiter as 3rd sub lord: legitimate, reasonable ambition.", polarity: "neutral", ...DUTTA("third", "third") },
  { id: "kp3-content-saturn", cusp: 3, topic: "Temperament", when: { cusp: 3, subLordIs: ["Saturn"] }, text: "Saturn as 3rd sub lord: little contentment, a mind that dwells on what is lacking.", polarity: "neutral", ...DUTTA("third", "third") },
  { id: "kp3-daring", cusp: 3, topic: "Temperament", when: { cusp: 3, strong: [1] }, text: "The 3rd sub lord is a full significator of the 1st: a daring person.", polarity: "neutral", ...DUTTA("third", "third") },
  { id: "kp3-warrior", cusp: 3, topic: "Temperament", when: { cusp: 3, all: [10] }, text: "The 3rd sub lord signifies the 10th: a fighter's nature that carries into the career.", polarity: "neutral", ...DUTTA("third", "third") },
  { id: "kp3-negotiation-star", cusp: 3, topic: "Communications", when: { cusp: 3, starLordOccupies: [3, 9], all: [11] }, text: "The 3rd sub lord is in the star of a planet in the 3rd or 9th and signifies the 11th: negotiations succeed (judge the 7th too for marriage, 6 and 10 for business, the 4th for a house); the 3, 9 and 11 significators time it.", polarity: "good", timing: [3, 9, 11], ...DUTTA("third", "third") },
  { id: "kp3-negotiation-fail", cusp: 3, topic: "Communications", when: { cusp: 3, starLordOccupies: [3, 9], all: [12], none: [11] }, text: "The 3rd sub lord is in the star of a planet in the 3rd or 9th and signifies the 12th without the 11th: negotiations fall through.", polarity: "bad", ...DUTTA("third", "third") },

  // ---------------- Cusp IV ----------------
  { id: "kp4-education", cusp: 4, topic: "Education", when: { cusp: 4, starLordIs: ["Mercury", "Jupiter"] }, text: "The 4th sub lord is in the star of Mercury or Jupiter: a studious mind and sound education.", polarity: "good", source: P3("44") },
  { id: "kp4-higher", cusp: 4, topic: "Education", when: { cusp: 4, minOf: { houses: [4, 9, 11], count: 2 } }, text: "The 4th sub lord signifies 4, 9 and 11: education is completed and higher studies come through.", polarity: "good", timing: [4, 9, 11], source: P3("45") },
  { id: "kp4-breaks", cusp: 4, topic: "Education", when: { cusp: 4, all: [8, 12] }, text: "The 4th sub lord signifies 8 and 12: interruptions and breaks in education.", polarity: "bad", source: P3("45") },
  { id: "kp4-exam-11", cusp: 4, topic: "Education", when: { cusp: 4, all: [11], none: [3] }, text: "The 4th sub lord signifies the 11th without the 3rd: examinations are passed.", polarity: "good", source: P3("45") },
  { id: "kp4-house", cusp: 4, topic: "Property", when: { cusp: 4, all: [4], any: [11, 12], connectedTo: ["Mars", "Saturn"] }, text: "The 4th sub lord signifies 4 with 11 or 12 and is connected to Mars or Saturn: building or acquiring a house, in the conjoined period of 4, 11 and 12.", polarity: "good", timing: [4, 11, 12], source: P3("44") },
  { id: "kp4-property", cusp: 4, topic: "Property", when: { cusp: 4, all: [4, 11] }, text: "The 4th sub lord signifies 4 and 11: landed property and a home of one's own.", polarity: "good", timing: [4, 11, 12], source: P3("44") },
  { id: "kp4-transfer", cusp: 4, topic: "Residence", when: { cusp: 4, minOf: { houses: [3, 10, 12], count: 2 } }, text: "The 4th sub lord signifies 3, 10 and 12: transfers in service and moves away from home.", polarity: "neutral", timing: [3, 10, 12], source: P3("45") },
  { id: "kp4-move", cusp: 4, topic: "Residence", when: { cusp: 4, all: [3, 12] }, text: "The 4th sub lord signifies 3 and 12: changes of residence.", polarity: "neutral", timing: [3, 12], source: P3("45") },
  { id: "kp4-vehicles", cusp: 4, topic: "Comforts", when: { cusp: 4, subLordIs: ["Venus"], any: IMPROVING }, text: "Venus as 4th sub lord tied to the improving houses: vehicles and domestic comforts.", polarity: "good", source: P3("46") },
  { id: "kp4-discharge", cusp: 4, topic: "Health", when: { cusp: 4, minOf: { houses: [2, 4, 11], count: 2 } }, text: "The 4th sub lord signifies 2, 4 and 11: after any hospital stay, discharge and return home come in their conjoined period.", polarity: "good", timing: [2, 4, 11], source: P3("44") },
  // ── Cusp IV from Astro Secrets Part 1, ch. 16 (pp. 136-143) and Dutta's free bhava rules ──
  { id: "kp4-fortunate", cusp: 4, topic: "Comforts", when: { cusp: 4, all: [4], minOf: { houses: [2, 5, 9, 10, 11], count: 3 } }, text: "The 4th sub lord ties the 4th to most of 2, 5, 9, 10 and 11: higher education, land and ancestral property, vehicles and an affectionate, helpful mother; possessions to be proud of.", polarity: "good", source: P1("136") },
  { id: "kp4-static", cusp: 4, topic: "Comforts", when: { cusp: 4, all: [4], none: [3, 11, 12] }, text: "The 4th sub lord signifies the 4th with none of 3, 11 and 12: education, land and an ancestral home are promised, but the 4th is a static house; vehicles it gives are old and forever under repair. Roadworthy vehicles need 3, 11 and 12.", polarity: "neutral", source: P1("137") },
  { id: "kp4-vehicle-saturn", cusp: 4, topic: "Vehicles", when: { cusp: 4, subLordIs: ["Saturn"], minOf: { houses: [3, 11, 12], count: 2 } }, text: "Saturn as 4th sub lord tied to 3, 11 and 12: a bicycle or similar vehicle worked by one's own effort.", polarity: "neutral", source: P1("136") },
  { id: "kp4-vehicle-mars", cusp: 4, topic: "Vehicles", when: { cusp: 4, subLordIs: ["Mars"], minOf: { houses: [3, 11, 12], count: 2 } }, text: "Mars as 4th sub lord tied to 3, 11 and 12: a motorised two-wheeler.", polarity: "neutral", source: P1("136") },
  { id: "kp4-vehicle-four", cusp: 4, topic: "Vehicles", when: { cusp: 4, subLordIs: ["Venus", "Jupiter"], minOf: { houses: [3, 11, 12], count: 2 } }, text: "Venus or Jupiter as 4th sub lord tied to 3, 11 and 12: a four-wheeler, provided the lagna lord is strong and Saturn or Mars do not afflict the sub lord.", polarity: "good", timing: [3, 11, 12], source: P1("136-137") },
  { id: "kp4-vehicle-air", cusp: 4, topic: "Vehicles", when: { cusp: 4, subLordIs: ["Mercury", "Venus"], subLordSubIs: ["Venus", "Mercury"], minOf: { houses: [3, 11, 12], count: 2 }, none: [4] }, text: "Mercury in the sub of Venus, or Venus in the sub of Mercury, as 4th sub lord tied to 3, 11 and 12 and clear of the 4th: air travel as a way of life, even one's own aircraft, when the lagna lord and the 2nd, 10th and 11th are all strong.", polarity: "good", source: P1("136-137") },
  { id: "kp4-vehicle-ship", cusp: 4, topic: "Vehicles", when: { cusp: 4, subLordIs: ["Moon"], subLordSubIs: ["Venus"], minOf: { houses: [3, 11, 12], count: 2 } }, text: "Moon in the sub of Venus as 4th sub lord tied to 3, 11 and 12: travel or command of ships; with a strong lagna lord, a vessel of one's own.", polarity: "good", source: P1("136-137") },
  { id: "kp4-edu-intermediate", cusp: 4, topic: "Education", when: { cusp: 4, all: [4], none: [9, 11] }, text: "The 4th sub lord signifies the 4th without 9 or 11: by the sub lord's own significations, schooling to the intermediate level; higher education needs the 9th and its completion the 11th (check the six-step table and the 9th sub lord before concluding).", polarity: "neutral", source: P1("138") },
  { id: "kp4-edu-highest", cusp: 4, topic: "Education", when: { cusp: 4, all: [4, 9, 11], none: [8, 12], otherCusp: { cusp: 9, minOf: { houses: [4, 9, 11], count: 2 } } }, text: "The 4th sub lord signifies 4, 9 and 11 without 8 or 12, and the 9th sub lord joins the same houses: higher education of the highest order, the native becoming an authority in the subject; the grade reached follows the nature of the planet, in its dasa or bhukti.", polarity: "good", timing: [4, 9, 11], source: P1("137-139") },
  { id: "kp4-edu-no-11", cusp: 4, topic: "Education", when: { cusp: 4, all: [4, 9], none: [11] }, text: "The 4th sub lord signifies 4 and 9 but not the 11th: higher studies are begun and not brought to the goal; with a fixed lagna the book has it stopping early.", polarity: "bad", source: P1("138, 142") },
  { id: "kp4-edu-no-9", cusp: 4, topic: "Education", when: { cusp: 4, all: [4, 11], none: [9] }, text: "The 4th sub lord signifies 4 and 11 but not the 9th: education to a lower level is completed, but the higher degree does not come.", polarity: "neutral", source: P1("138, 142") },
  { id: "kp4-edu-none", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Mars", "Saturn"], all: [8, 12] }, text: "Mars or Saturn as 4th sub lord signifying 8 and 12: little or no schooling.", polarity: "bad", source: P1("142") },
  { id: "kp4-line-doctor", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Sun", "Mars"], minOf: { houses: [4, 9, 11], count: 2 } }, text: "Sun or Mars as 4th sub lord with higher education promised: medicine and surgery.", polarity: "neutral", source: P1("141") },
  { id: "kp4-line-venus", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Venus"], minOf: { houses: [4, 9, 11], count: 2 } }, text: "Venus as 4th sub lord with higher education promised: industry, textiles, design.", polarity: "neutral", source: P1("141") },
  { id: "kp4-line-mercury", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Mercury"], minOf: { houses: [4, 9, 11], count: 2 } }, text: "Mercury as 4th sub lord with higher education promised: law, accountancy and audit, computing and engineering.", polarity: "neutral", source: P1("141") },
  { id: "kp4-line-jupiter", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Jupiter"], minOf: { houses: [4, 9, 11], count: 2 } }, text: "Jupiter as 4th sub lord with higher education promised: teaching, law, the administrative services.", polarity: "neutral", source: P1("141") },
  { id: "kp4-line-moon", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Moon"], minOf: { houses: [4, 9, 11], count: 2 } }, text: "Moon as 4th sub lord with higher education promised: chemistry and the chemical line.", polarity: "neutral", source: P1("141") },
  { id: "kp4-line-saturn", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Saturn"], minOf: { houses: [4, 9, 11], count: 2 } }, text: "Saturn as 4th sub lord with higher education promised: research.", polarity: "neutral", source: P1("141") },
  { id: "kp4-line-node", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Rahu", "Ketu"], minOf: { houses: [4, 9, 11], count: 2 } }, text: "Rahu or Ketu as 4th sub lord with higher education promised: the line of study follows the lord of the house the node occupies, for whom it acts as agent.", polarity: "neutral", source: P1("141") },
  { id: "kp4-vedas", cusp: 4, topic: "Education", when: { cusp: 4, subLordIs: ["Saturn"], minOf: { houses: [3, 5, 8, 12], count: 2 } }, text: "Saturn as 4th sub lord tied to 3, 5, 8 and 12: study of the Vedas and mantras.", polarity: "neutral", source: P1("141") },
  { id: "kp4-vocational", cusp: 4, topic: "Education", when: { cusp: 4, all: [4], minOf: { houses: [3, 5, 8, 12], count: 3 }, none: [9, 11] }, text: "The 4th sub lord ties the 4th to 3, 5, 8 and 12 without 9 or 11: formal schooling ends at the school-leaving stage and a craft is learnt instead. Venus acting and the screen, Mars music, Mercury Puranic and scriptural study, Moon stringed instruments, Sun the repair of machines.", polarity: "neutral", source: P1("141") },
  { id: "kp4-arts-school", cusp: 4, topic: "Education", when: { cusp: 4, all: [4, 5, 11], none: [9] }, text: "The 4th sub lord signifies 4, 5 and 11: training in a Veda school or a performing-arts institute; Mercury gives wind instruments, Mars the martial arts, Venus tailoring and vocational crafts.", polarity: "neutral", source: P1("142") },
  { id: "kp4-buy-house", cusp: 4, topic: "Property", when: { cusp: 4, all: [4], minOf: { houses: [1, 6, 9, 12], count: 3 } }, text: "The 4th sub lord signifies 4 with 6, 9, 1 and 12: purchase of a house already built (6 the loan, 12 the outlay).", polarity: "good", timing: [4, 11, 12], source: P1("142") },
  { id: "kp4-buy-land", cusp: 4, topic: "Property", when: { cusp: 4, subLordIs: ["Mars"], all: [4], any: [11, 12] }, text: "Mars as 4th sub lord signifying 4 with 11 or 12: purchase of land; with the 11th and 12th together, a house is built on it.", polarity: "good", timing: [4, 11, 12], source: P1("142") },
  { id: "kp4-ancestral", cusp: 4, topic: "Property", when: { cusp: 4, all: [4, 9], minOf: { houses: [1, 6, 11], count: 2 } }, text: "The 4th sub lord signifies 4 and 9 with 1, 6 and 11: ancestral property comes to the native.", polarity: "good", timing: [4, 9, 11], source: P1("142") },
  { id: "kp4-rental", cusp: 4, topic: "Property", when: { cusp: 4, all: [4, 6], minOf: { houses: [10, 11, 12], count: 2 } }, text: "The 4th sub lord signifies 4 and 6 with 10, 11 and 12: buildings put up or held to let out on rent.", polarity: "good", source: P1("142") },
  { id: "kp4-deposits", cusp: 4, topic: "Finance", when: { cusp: 4, all: [4, 2], minOf: { houses: [10, 11], count: 1 } }, text: "The 4th sub lord signifies 4 and 2 with 10 or 11: money is kept in bank deposits and savings.", polarity: "good", source: P1("142") },
  { id: "kp4-permanent-post", cusp: 4, topic: "Residence", when: { cusp: 4, all: [4, 10], none: [3, 12] }, text: "The 4th sub lord signifies 4 and 10 without 3 or 12: work in one permanent place, without transfers.", polarity: "good", source: P1("142") },
  { id: "kp4-always-sick", cusp: 4, topic: "Health", when: { cusp: 4, all: [1, 4, 6], otherCusp: { cusp: 1, all: [1, 6] } }, text: "The 4th sub lord signifies 1, 4 and 6 and the lagna sub lord also signifies 1 and 6: a constitution that is always ailing.", polarity: "bad", source: P1("142") },
  { id: "kp4-lower-edu", cusp: 4, topic: "Education", when: { cusp: 4, all: [4, 11], none: [8, 12] }, text: "The 4th sub lord signifies 4 and 11 clear of 8 and 12: schooling is completed and admission to college is certain.", polarity: "good", timing: [4, 11], source: `${P1("142")}; Dutta, fourth house` },
  { id: "kp4-adoption", cusp: 4, topic: "Family", when: { cusp: 4, subLordIs: ["Mercury"], any: [8] }, text: "Read in a child's chart. Mercury as 4th sub lord connected to the 8th: the child is brought up by others than the birth parents; the 4th and 8th time it.", polarity: "neutral", timing: [4, 8], ...DUTTA("fourth", "fourth") },
  { id: "kp4-adoption-dual", cusp: 4, topic: "Family", when: { cusp: 4, subLordNot: ["Mercury"], subLordInDualSign: true, any: [8] }, text: "Read in a child's chart. The 4th sub lord in a dual sign connected to the 8th: the child may be raised by others than the birth parents, adopted or fostered.", polarity: "neutral", timing: [4, 8], ...DUTTA("fourth", "fourth") },
  { id: "kp4-treasure", cusp: 4, topic: "Property", when: { cusp: 4, all: [4], minOf: { houses: [2, 6, 11], count: 2 }, connectedTo: ["Saturn"] }, text: "The 4th sub lord signifies 4 with 2, 6 and 11 and is connected to Saturn: hidden wealth in the land or house, buried or found.", polarity: "good", ...DUTTA("fourth", "fourth") },
  { id: "kp4-medical-fit", cusp: 4, topic: "Health", when: { cusp: 4, all: [10, 11] }, text: "The 4th sub lord signifies 10 and 11: the medical fitness examination for a post is passed.", polarity: "good", ...DUTTA("fourth", "fourth") },
  { id: "kp4-venus-movable", cusp: 4, topic: "Comforts", when: { cusp: 4, subLordIs: ["Venus"], subLordSignQuality: ["Movable"], any: IMPROVING }, text: "Venus as 4th sub lord in a movable sign tied to the improving houses: the comforts come as vehicles.", polarity: "good", ...DUTTA("fourth", "fourth") },
  { id: "kp4-venus-fixed", cusp: 4, topic: "Comforts", when: { cusp: 4, subLordIs: ["Venus"], subLordSignQuality: ["Fixed"], any: IMPROVING }, text: "Venus as 4th sub lord in a fixed sign tied to the improving houses: the comforts come as furniture and a well-appointed home.", polarity: "good", ...DUTTA("fourth", "fourth") },
  { id: "kp4-venus-dual", cusp: 4, topic: "Comforts", when: { cusp: 4, subLordIs: ["Venus"], subLordSignQuality: ["Dual"], any: IMPROVING }, text: "Venus as 4th sub lord in a dual sign tied to the improving houses: the comforts come as small luxuries about the house.", polarity: "good", ...DUTTA("fourth", "fourth") },

  // ---------------- Cusp V ----------------
  { id: "kp5-children", cusp: 5, topic: "Children", when: { cusp: 5, minOf: { houses: [2, 5, 11], count: 2 } }, text: "The 5th sub lord signifies 2, 5 and 11: children are promised, in the conjoined period of their significators.", polarity: "good", timing: [2, 5, 11], source: P3("46") },
  { id: "kp5-children-denied", cusp: 5, topic: "Children", when: { cusp: 5, minOf: { houses: [1, 4, 10], count: 2 }, none: [2, 5, 11] }, text: "The 5th sub lord signifies 1, 4 and 10 (the houses opposite to 7, 10 and 4, i.e. the negations of 5, 2 and 11) and none of 2, 5, 11: children are denied or much delayed.", polarity: "bad", source: P3("46") },
  { id: "kp5-spec-win", cusp: 5, topic: "Speculation", when: { cusp: 5, all: [6, 11] }, text: "The 5th sub lord signifies 6 and 11: gains in speculation.", polarity: "good", source: P3("47") },
  { id: "kp5-spec-moderate", cusp: 5, topic: "Speculation", when: { cusp: 5, all: [2, 10], none: [6, 11] }, text: "The 5th sub lord signifies 2 and 10: moderate gains in speculation.", polarity: "neutral", source: P3("47") },
  { id: "kp5-spec-loss", cusp: 5, topic: "Speculation", when: { cusp: 5, all: [5, 12] }, text: "The 5th sub lord signifies 5 and 12: losses in speculation; keep away from it.", polarity: "bad", source: P3("47") },
  { id: "kp5-love-marriage", cusp: 5, topic: "Love", when: { cusp: 5, all: [7, 11] }, text: "The 5th sub lord signifies 7 and 11: a love affair leads to marriage.", polarity: "good", timing: [2, 7, 11], source: P3("47") },
  { id: "kp5-love-fails", cusp: 5, topic: "Love", when: { cusp: 5, all: [6, 12] }, text: "The 5th sub lord signifies 6 and 12: love affairs do not end in marriage.", polarity: "bad", source: P3("47") },
  { id: "kp5-music", cusp: 5, topic: "Arts", when: { cusp: 5, any: [5, 7], connectedTo: ["Venus"] }, text: "The 5th sub lord signifies 5 or 7 and is connected to Venus: proficiency in music and the fine arts.", polarity: "good", source: P3("48") },
  { id: "kp5-statesman", cusp: 5, topic: "Public life", when: { cusp: 5, starLordOccupies: [11], any: [10] }, text: "The 5th sub lord is in the star of a planet in the 11th and signifies the 10th: statesmanship, a public role.", polarity: "good", source: P3("49") },
  { id: "kp5-mantra", cusp: 5, topic: "Practice", when: { cusp: 5, all: [11], connectedTo: ["Saturn"] }, text: "The 5th sub lord signifies the 11th and is connected to Saturn: siddhi through mantra and steady practice.", polarity: "good", source: P3("48") },
  // ── Cusp V from Astro Secrets Part 1, ch. 16 (pp. 143-152) and Dutta's free bhava rules ──
  { id: "kp5-love-6-strong", cusp: 5, topic: "Love", when: { cusp: 5, all: [7, 11], strong: [6] }, text: "The 5th sub lord signifies 7 and 11 but is a strong significator of the 6th as well: the love affair happens, yet the 6th, being 12th to the 7th, keeps it from ending in marriage.", polarity: "bad", source: P1("144-147") },
  { id: "kp5-love-6-weak", cusp: 5, topic: "Love", when: { cusp: 5, all: [7, 11], any: [6], notStrong: [6] }, text: "The 5th sub lord signifies 7 and 11 with the 6th only by occupation or ownership: the love affair meets obstacles and disturbances, and ends in marriage all the same.", polarity: "good", timing: [5, 7, 11], source: P1("146-147") },
  { id: "kp5-children-certain", cusp: 5, topic: "Children", when: { cusp: 5, minOf: { houses: [2, 5, 11], count: 2 }, none: [4, 10] }, text: "The 5th sub lord signifies 2, 5 and 11 and is clear of 4 and 10: children are certain, whatever a node in the 5th or a sarpa dosha may seem to say.", polarity: "good", timing: [2, 5, 11], source: P1("147-150") },
  { id: "kp5-children-limited", cusp: 5, topic: "Children", when: { cusp: 5, all: [2, 5], any: [4], notStrong: [4] }, text: "The 5th sub lord signifies 2 and 5 but also touches the 4th by occupation or ownership: the 4th restricts the number of children without denying them.", polarity: "neutral", source: P1("149-150") },
  { id: "kp5-children-none-4", cusp: 5, topic: "Children", when: { cusp: 5, strong: [4], none: [2, 11] }, text: "The 5th sub lord is a strong significator of the 4th (by its star lord) and has neither 2 nor 11: the book denies progeny outright.", polarity: "bad", source: P1("150") },
  { id: "kp5-children-destined", cusp: 5, topic: "Children", when: { cusp: 5, none: [4, 6, 12], any: [1, 2, 3, 5, 7, 8, 9, 10, 11] }, text: "The 5th sub lord has no connection to 4, 6 or 12: progeny is destined, early or late according to the nature of the planet.", polarity: "good", source: P1("151") },
  { id: "kp5-child-male", cusp: 5, topic: "Children", when: { cusp: 5, starLordIs: ["Sun", "Mars", "Jupiter"] }, text: "The 5th sub lord is in the star of a male planet: the first child is likely a boy (the star lord should also be in a male sign).", polarity: "neutral", source: P1("150") },
  { id: "kp5-child-female", cusp: 5, topic: "Children", when: { cusp: 5, starLordIs: ["Moon", "Venus", "Rahu"] }, text: "The 5th sub lord is in the star of a female planet: the first child is likely a girl (the star lord should also be in a female sign).", polarity: "neutral", source: P1("150") },
  { id: "kp5-twins", cusp: 5, topic: "Children", when: { cusp: 5, subLordIs: ["Mercury", "Jupiter"], subLordInDualSign: true, starLordIs: ["Moon", "Venus", "Rahu"] }, text: "Mercury or Jupiter as 5th sub lord in a dual sign and in the star of a female planet: a twin birth, girls, if the star lord also stands in a female sign.", polarity: "neutral", source: P1("150") },
  { id: "kp5-many-children", cusp: 5, topic: "Children", when: { cusp: 5, subLordIs: ["Mercury"], subLordInDualSign: true, starLordIs: ["Jupiter", "Mercury"], subLordSubIs: ["Jupiter"] }, text: "Mercury as 5th sub lord in a dual sign, in the star of Jupiter or Mercury and in Jupiter's sub: more than two children.", polarity: "neutral", source: P1("150") },
  { id: "kp5-abortion", cusp: 5, topic: "Children", when: { cusp: 5, subLordIs: ["Mars"], all: [4, 12] }, text: "Mars as 5th sub lord signifying 4 and 12: miscarriages.", polarity: "bad", source: P1("151") },
  { id: "kp5-child-lost", cusp: 5, topic: "Children", when: { cusp: 5, strong: [6], badhaka: true }, text: "The 5th sub lord is a strong significator of the 6th and signifies the badhaka house: the book warns of a child lost at or soon after birth in the dasa of one of these lords (it reckons the badhaka from the 5th cusp; the lagna's is used here).", polarity: "bad", source: P1("151") },
  { id: "kp5-child-hands", cusp: 5, topic: "Children", when: { cusp: 5, subLordIs: ["Mercury"], all: [5, 11, 12] }, text: "Mercury as 5th sub lord signifying 5, 11 and 12: a child is born, with a weakness of the hands or arms.", polarity: "bad", source: P1("151") },
  { id: "kp5-child-eyes", cusp: 5, topic: "Children", when: { cusp: 5, subLordIs: ["Venus"], all: [5, 11, 12] }, text: "Venus as 5th sub lord signifying 5, 11 and 12: a child is born, with weak or affected eyesight.", polarity: "bad", source: P1("151") },
  { id: "kp5-child-leg", cusp: 5, topic: "Children", when: { cusp: 5, all: [5, 11, 12], connectedTo: ["Mars"], lagnaSignIn: [9] }, text: "The 5th sub lord signifies 5, 11 and 12 with Mars connected, in a Makara lagna: a child with a defect of the leg.", polarity: "bad", source: P1("151") },
  { id: "kp5-child-speech", cusp: 5, topic: "Children", when: { cusp: 5, subLordIs: ["Mercury"], all: [5, 11], connectedTo: ["Saturn", "Mars"], lagnaSignIn: [8, 11] }, text: "Mercury as 5th sub lord signifying 5 and 11 with Saturn or Mars connected, in a Dhanus or Meena lagna: a child with a speech defect.", polarity: "bad", source: P1("151") },
  { id: "kp5-child-speech-ju", cusp: 5, topic: "Children", when: { cusp: 5, subLordIs: ["Jupiter"], all: [5, 11], lagnaSignIn: [2, 5, 4] }, text: "Jupiter as 5th sub lord signifying 5 and 11 in a Mithuna or Kanya lagna: a child with a speech defect; in Simha, a slow intellect.", polarity: "bad", source: P1("151") },
  { id: "kp5-child-defect", cusp: 5, topic: "Children", when: { cusp: 5, all: [5, 11], badhaka: true, connectedTo: ["Saturn", "Mars"], subLordInHouse: [10, 12, 4] }, text: "The 5th sub lord signifies 5 and 11 with the badhaka, joined to Saturn or Mars and posited in the 6th, 8th or 12th from the 5th: the child born carries one defect or another, of the kind the planet rules.", polarity: "bad", source: P1("152") },
  { id: "kp5-love-affair", cusp: 5, topic: "Love", when: { cusp: 5, all: [5, 7], minOf: { houses: [1, 11], count: 1 } }, text: "The 5th sub lord signifies 5 and 7 with 1 or 11: love affairs, courtship.", polarity: "neutral", timing: [5, 7, 11], source: P1("152") },
  { id: "kp5-love-failure", cusp: 5, topic: "Love", when: { cusp: 5, all: [5], minOf: { houses: [6, 10, 12], count: 2 } }, text: "The 5th sub lord ties the 5th to 6, 10 and 12: love affairs fail.", polarity: "bad", source: P1("152") },
  { id: "kp5-gambling", cusp: 5, topic: "Speculation", when: { cusp: 5, all: [5, 11], minOf: { houses: [2, 6, 8, 10], count: 2 } }, text: "The 5th sub lord signifies 5 and 11 with 2, 6, 8 and 10: gains from betting, cards and the races.", polarity: "good", timing: [5, 6, 11], source: P1("152") },
  { id: "kp5-mantra-learn", cusp: 5, topic: "Practice", when: { cusp: 5, all: [5], minOf: { houses: [3, 4, 11], count: 2 } }, text: "The 5th sub lord ties the 5th to 3, 4 and 11: mantras are learnt and their practice bears fruit.", polarity: "good", source: P1("152") },
  { id: "kp5-actor", cusp: 5, topic: "Arts", when: { cusp: 5, all: [5, 10], minOf: { houses: [7, 11], count: 1 } }, text: "The 5th sub lord signifies 5 and 10 with 7 or 11: acting in cinema or on the stage as a career.", polarity: "good", source: P1("152") },
  { id: "kp5-wealth-jupiter", cusp: 5, topic: "Finance", when: { cusp: 5, subLordIs: ["Jupiter"], all: [5, 11], minOf: { houses: [2, 3, 6], count: 2 }, none: [8, 12] }, text: "Jupiter as 5th sub lord signifying 5 and 11 with 2, 6 and 3, clear of 8 and 12: enormous wealth.", polarity: "good", timing: [2, 5, 11], source: P1("152") },
  { id: "kp5-astrologer", cusp: 5, topic: "Public life", when: { cusp: 5, subLordIs: ["Saturn", "Mercury", "Jupiter"], all: [5], minOf: { houses: [2, 7, 9, 10, 11], count: 3 } }, text: "Saturn, Mercury or Jupiter as 5th sub lord tying the 5th to 9, 10, 11, 2 and 7: a popular astrologer.", polarity: "good", source: P1("152") },
  { id: "kp5-children-denied-full", cusp: 5, topic: "Children", when: { cusp: 5, minOf: { houses: [4, 6, 10, 12], count: 3 }, none: [2, 5, 11] }, text: "The 5th sub lord signifies 4, 12, 10 and 6 with none of 2, 5 and 11: children are denied.", polarity: "bad", source: P1("152") },
  { id: "kp5-intellect", cusp: 5, topic: "Mind", when: { cusp: 5, all: [5, 11], minOf: { houses: [1, 3, 9, 10], count: 2 } }, text: "The 5th sub lord signifies 5 and 11 with 3, 9, 10 and 1: strong intelligence and clear thinking.", polarity: "good", source: P1("152") },
  { id: "kp5-eccentric", cusp: 5, topic: "Mind", when: { cusp: 5, minOf: { houses: [1, 4, 6, 8, 12], count: 3 }, none: [5, 11], connectedTo: ["Rahu", "Ketu"] }, text: "The 5th sub lord ties 4, 8, 6, 1 and 12 together with a node connected and without 5 or 11: loose, eccentric thinking; the book goes as far as near-insanity.", polarity: "bad", source: P1("152") },
  { id: "kp5-alcohol", cusp: 5, topic: "Mind", when: { cusp: 5, subLordIs: ["Saturn", "Mars"], minOf: { houses: [1, 2, 3, 4, 6], count: 3 } }, text: "Saturn or Mars as 5th sub lord tying 3, 6, 2, 1 and 4: a leaning to drink.", polarity: "bad", source: P1("152") },
  { id: "kp5-love-star", cusp: 5, topic: "Love", when: { cusp: 5, starLordSignifies: [7, 11], none: [6, 12] }, text: "The 5th sub lord is in the star of a planet signifying 7 and 11: a love affair materialises into marriage.", polarity: "good", timing: [2, 7, 11], ...DUTTA("fifth", "fifth") },
  { id: "kp5-love-star-fails", cusp: 5, topic: "Love", when: { cusp: 5, starLordSignifies: [6, 12], none: [7, 11] }, text: "The 5th sub lord is in the star of a planet signifying 6 and 12: the love affair does not materialise.", polarity: "bad", ...DUTTA("fifth", "fifth") },
  { id: "kp5-actor-star", cusp: 5, topic: "Arts", when: { cusp: 5, starLordOccupies: [5, 6, 10], connectedTo: ["Venus"] }, text: "The 5th sub lord is in the star of a planet in 5, 6 or 10 and is connected to Venus: a popular performer.", polarity: "good", ...DUTTA("fifth", "fifth") },
  { id: "kp5-debauch-prestige", cusp: 5, topic: "Standing", when: { cusp: 5, all: [10, 12] }, text: "The 5th sub lord signifies 10 and 12: prestige is lost through pleasure-seeking.", polarity: "bad", ...DUTTA("fifth", "fifth") },
  { id: "kp5-debauch-property", cusp: 5, topic: "Standing", when: { cusp: 5, all: [4, 12] }, text: "The 5th sub lord signifies 4 and 12: property is lost through pleasure-seeking.", polarity: "bad", ...DUTTA("fifth", "fifth") },
  { id: "kp5-debauch-cash", cusp: 5, topic: "Standing", when: { cusp: 5, all: [2, 12] }, text: "The 5th sub lord signifies 2 and 12: cash is lost through pleasure-seeking.", polarity: "bad", ...DUTTA("fifth", "fifth") },
  { id: "kp5-spec-small", cusp: 5, topic: "Speculation", when: { cusp: 5, all: [1, 3], none: [6, 11, 2, 10, 12] }, text: "The 5th sub lord signifies 1 and 3 only: speculation brings insignificant gains.", polarity: "neutral", ...DUTTA("fifth", "fifth") },

  // ---------------- Cusp VI ----------------
  { id: "kp6-illness", cusp: 6, topic: "Health", when: { cusp: 6, minOf: { houses: [6, 8, 12], count: 2 } }, text: "The 6th sub lord signifies 6, 8 and 12: sickness in the conjoined period of the 1st and 6th significators; the 12th adds hospitalisation and the 8th seriousness.", polarity: "bad", timing: [1, 6], source: P3("49") },
  { id: "kp6-incurable", cusp: 6, topic: "Health", when: { cusp: 6, subLordInHouse: [12], strong: [6] }, text: "The 6th sub lord sits in the 12th and is a strong significator of the 6th: a long-standing, hard-to-cure complaint.", polarity: "bad", source: P3("50") },
  { id: "kp6-litigation", cusp: 6, topic: "Litigation", when: { cusp: 6, minOf: { houses: [1, 6, 11], count: 2 }, all: [6] }, text: "The 6th sub lord signifies 1, 6 and 11: success in litigation and over competitors.", polarity: "good", timing: [1, 6, 11], source: P3("50") },
  { id: "kp6-money", cusp: 6, topic: "Finance", when: { cusp: 6, all: [2, 6, 11] }, text: "The 6th sub lord signifies 2, 6 and 11: money comes in as wished; loans and overdrafts are sanctioned.", polarity: "good", timing: [2, 6, 11], source: P3("49") },
  { id: "kp6-loan", cusp: 6, topic: "Finance", when: { cusp: 6, any: [2, 6, 11], subLordRetro: false }, text: "The 6th sub lord is direct and connected to 2, 6 or 11: loans are available when needed.", polarity: "good", source: P3("50") },
  { id: "kp6-promotion", cusp: 6, topic: "Career", when: { cusp: 6, minOf: { houses: [2, 6, 11], count: 2 }, otherCusp: { cusp: 10, any: [2, 6, 11] } }, text: "The sub lords of the 6th and 10th both signify 2, 6 and 11: promotions in service, in their conjoined period.", polarity: "good", timing: [2, 6, 10, 11], source: `${P3("49")}; ${P3("55")}` },
  { id: "kp6-success", cusp: 6, topic: "Dealings", when: { cusp: 6, minOf: { houses: IMPROVING, count: 3 } }, text: "The 6th sub lord is tied to the improving houses: success in dealings with others in every field.", polarity: "good", source: P3("50") },
  { id: "kp6-trouble", cusp: 6, topic: "Dealings", when: { cusp: 6, minOf: { houses: [5, 8, 12], count: 2 } }, text: "The 6th sub lord signifies 5, 8 and 12: loss and trouble through servants, pets, debtors and the maternal side.", polarity: "bad", source: P3("50") },
  // ── Cusp VI from Astro Secrets Part 1, ch. 16 (pp. 152-158) and Dutta's free bhava rules ──
  { id: "kp6-sickness", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6] }, text: "The 6th sub lord signifies 1 and 6: the native contracts sickness or develops a disease; its kind follows the sub lord's star lord, its intensity the 5th sub lord.", polarity: "bad", timing: [1, 6], source: P1("153") },
  { id: "kp6-disease-sun", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], starLordIs: ["Sun"] }, text: "The 6th sub lord, signifying 1 and 6, is in the star of the Sun: headaches and troubles of the eyes.", polarity: "bad", source: P1("153") },
  { id: "kp6-disease-moon", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], starLordIs: ["Moon"] }, text: "The 6th sub lord, signifying 1 and 6, is in the star of the Moon: disorders of the blood and ailments of the face.", polarity: "bad", source: P1("153") },
  { id: "kp6-disease-mars", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], starLordIs: ["Mars"] }, text: "The 6th sub lord, signifying 1 and 6, is in the star of Mars: high fevers, circulation, eruptive and infectious diseases.", polarity: "bad", source: P1("153") },
  { id: "kp6-disease-mercury", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], starLordIs: ["Mercury"] }, text: "The 6th sub lord, signifying 1 and 6, is in the star of Mercury: wind disorders and skin complaints.", polarity: "bad", source: P1("153") },
  { id: "kp6-disease-jupiter", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], starLordIs: ["Jupiter"] }, text: "The 6th sub lord, signifying 1 and 6, is in the star of Jupiter: the heart and the stomach.", polarity: "bad", source: P1("153") },
  { id: "kp6-disease-venus", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], starLordIs: ["Venus"] }, text: "The 6th sub lord, signifying 1 and 6, is in the star of Venus: the eyes, the reproductive organs and the rectum.", polarity: "bad", source: P1("153") },
  { id: "kp6-disease-saturn", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], starLordIs: ["Saturn"] }, text: "The 6th sub lord, signifying 1 and 6, is in the star of Saturn: the limbs, colds and coughs, the nerves, fluid about the heart.", polarity: "bad", source: P1("153") },
  { id: "kp6-disease-node", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], starLordIs: ["Rahu", "Ketu"] }, text: "The 6th sub lord, signifying 1 and 6, is in the star of a node: the disease follows the planet the node acts for (the lord of its sign, or a planet with it).", polarity: "bad", source: P1("153") },
  { id: "kp6-sickness-mild", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], otherCusp: { cusp: 5, minOf: { houses: [3, 5, 10], count: 2 } } }, text: "The 6th sub lord signifies 1 and 6, but the 5th sub lord ties 5, 3 and 10: the sickness is no major threat and yields to treatment.", polarity: "neutral", source: P1("154") },
  { id: "kp6-sickness-severe", cusp: 6, topic: "Health", when: { cusp: 6, all: [1, 6], otherCusp: { cusp: 5, all: [4] } }, text: "The 6th sub lord signifies 1 and 6 and the 5th sub lord signifies the 4th: the sickness runs deep and responds poorly to treatment.", polarity: "bad", source: P1("154") },
  { id: "kp6-inflow", cusp: 6, topic: "Finance", when: { cusp: 6, all: [6], minOf: { houses: [2, 11], count: 1 }, none: [5, 8] }, text: "The 6th sub lord ties the 6th to 2 or 11 and is clear of 5 and 8: money flows in during its dasa, bhukti or antara, and on days the Moon transits its stars; the scale depends on the strength of the 2nd and 10th.", polarity: "good", timing: [2, 6, 11], source: P1("154-155") },
  { id: "kp6-inflow-reduced", cusp: 6, topic: "Finance", when: { cusp: 6, all: [5, 8] }, text: "The 6th sub lord signifies 5 and 8: the inflow of money is reduced, or does not come at all.", polarity: "bad", source: P1("155") },
  { id: "kp6-service", cusp: 6, topic: "Career", when: { cusp: 6, all: [6, 10], none: [7] }, text: "The 6th sub lord signifies 6 and 10: a salaried post, service under others.", polarity: "neutral", timing: [2, 6, 10, 11], source: P1("156") },
  { id: "kp6-service-then-business", cusp: 6, topic: "Career", when: { cusp: 6, all: [6, 7] }, text: "The 6th sub lord signifies 6 and 7: service for a time, then an independent profession of one's own (the same when the 7th sub lord signifies 6 and 7).", polarity: "neutral", source: P1("156") },
  { id: "kp6-spouse-ill", cusp: 6, topic: "Marriage", when: { cusp: 6, all: [7, 12] }, text: "The 6th sub lord signifies 7 and 12: separation from the partner, and the partner's health suffers.", polarity: "bad", source: P1("156") },
  { id: "kp6-siblings-apart", cusp: 6, topic: "Family", when: { cusp: 6, all: [3, 6], none: [11] }, text: "The 6th sub lord signifies 3 and 6: separation from brothers and sisters.", polarity: "bad", source: P1("156") },
  { id: "kp6-mother-ill", cusp: 6, topic: "Family", when: { cusp: 6, all: [3, 4, 9] }, text: "The 6th sub lord signifies 3, 4 and 9: the mother's health gives trouble.", polarity: "bad", source: P1("156") },
  { id: "kp6-enemies", cusp: 6, topic: "Rivals", when: { cusp: 6, all: [6, 7], minOf: { houses: [1, 8, 12], count: 2 } }, text: "The 6th sub lord signifies 6 and 7 with 12, 1 and 8: enemies surface and confront the native.", polarity: "bad", source: P1("156") },
  { id: "kp6-debts", cusp: 6, topic: "Finance", when: { cusp: 6, all: [6, 8, 12] }, text: "The 6th sub lord signifies 6, 8 and 12: debts are contracted.", polarity: "bad", source: P1("157") },
  { id: "kp6-separation", cusp: 6, topic: "Marriage", when: { cusp: 6, all: [6, 12], none: [7] }, text: "The 6th sub lord signifies 6 and 12: separation between husband and wife.", polarity: "bad", source: P1("157") },
  { id: "kp6-loss-wealth", cusp: 6, topic: "Finance", when: { cusp: 6, minOf: { houses: [5, 7, 8, 12], count: 3 } }, text: "The 6th sub lord ties 5, 7, 8 and 12: loss of money.", polarity: "bad", source: P1("157") },
  { id: "kp6-livestock", cusp: 6, topic: "Dealings", when: { cusp: 6, all: [6, 11], minOf: { houses: [1, 5], count: 1 } }, text: "The 6th sub lord signifies 6 and 11 with 1 or 5: cattle and pets are acquired.", polarity: "neutral", source: P1("157") },
  { id: "kp6-success-house", cusp: 6, topic: "Property", when: { cusp: 6, all: [4, 6, 11] }, text: "The 6th sub lord signifies 4, 6 and 11: the effort to buy a house succeeds, and a tenant is found when one is wanted.", polarity: "good", timing: [4, 6, 11], source: `${P1("157")}; Dutta, sixth house` },
  { id: "kp6-success-exam", cusp: 6, topic: "Competition", when: { cusp: 6, all: [6, 9, 11] }, text: "The 6th sub lord signifies 9, 6 and 11: success in examinations.", polarity: "good", timing: [6, 9, 11], source: P1("157") },
  { id: "kp6-win-enemy", cusp: 6, topic: "Rivals", when: { cusp: 6, all: [6, 7, 11] }, text: "The 6th sub lord signifies 7, 6 and 11: the native wins over opponents and rivals.", polarity: "good", timing: [6, 7, 11], source: P1("157") },
  { id: "kp6-reappointment", cusp: 6, topic: "Career", when: { cusp: 6, all: [6], minOf: { houses: [2, 10], count: 1 }, none: [1, 5, 9, 12] }, text: "The 6th sub lord signifies 6 with 10 or 2 and none of 1, 5, 9 and 12: reappointment or extension of service comes through.", polarity: "good", ...DUTTA("sixth", "sixth") },
  { id: "kp6-reappointment-denied", cusp: 6, topic: "Career", when: { cusp: 6, minOf: { houses: [1, 5, 9, 12], count: 2 }, none: [2, 6, 10] }, text: "The 6th sub lord signifies 1, 5, 9 or 12 with none of 2, 6 and 10: when a reappointment or extension of service is sought, it is not granted.", polarity: "bad", ...DUTTA("sixth", "sixth") },
  { id: "kp6-recover-money", cusp: 6, topic: "Finance", when: { cusp: 6, all: [2, 6, 11], subLordNot: ["Saturn"] }, text: "The 6th sub lord signifies 2, 6 and 11 and is not Saturn: money stuck with others is recovered.", polarity: "good", timing: [2, 6, 11], ...DUTTA("sixth", "sixth") },
  { id: "kp6-tenant-leaves", cusp: 6, topic: "Property", when: { cusp: 6, all: [6, 8] }, text: "The 6th sub lord signifies 6 and 8 (the 3rd from the 6th): a tenant leaves in the conjoined period of 6 and 8.", polarity: "neutral", timing: [6, 8], ...DUTTA("sixth", "sixth") },

  // ---------------- Cusp VII ----------------
  { id: "kp7-marriage", cusp: 7, topic: "Marriage", when: { cusp: 7, minOf: { houses: [2, 7, 11], count: 2 } }, text: "The 7th sub lord signifies 2, 7 and 11: marriage is promised, fructifying in the conjoined period of the 2-7-11 significators (Venus should be free of affliction).", polarity: "good", timing: [2, 7, 11], source: P3("51") },
  { id: "kp7-marriage-denied", cusp: 7, topic: "Marriage", when: { cusp: 7, minOf: { houses: [1, 6, 10, 12], count: 2 }, none: [2, 7, 11] }, text: "The 7th sub lord signifies 1, 6, 10 or 12 and none of 2, 7, 11: marriage is denied or much delayed.", polarity: "bad", source: P3("51") },
  { id: "kp7-happy", cusp: 7, topic: "Marriage", when: { cusp: 7, subLordIs: ["Venus", "Jupiter"], all: [2, 11] }, text: "Venus or Jupiter as 7th sub lord signifying 2 and 11: a very happy married life.", polarity: "good", source: P3("52") },
  { id: "kp7-harmony", cusp: 7, topic: "Marriage", when: { cusp: 7, minOf: { houses: [2, 5, 7, 11], count: 3 } }, text: "The 7th sub lord signifies 2, 5, 7 and 11: harmony and comfort in the union.", polarity: "good", source: P3("51") },
  { id: "kp7-partner-6-11", cusp: 7, topic: "Partnership", when: { cusp: 7, starLordSignifies: [6, 11] }, text: "The 7th sub lord is in the star of a planet signifying 6 and 11: a business partner is gained.", polarity: "good", source: P3("51") },
  { id: "kp7-partner-break", cusp: 7, topic: "Partnership", when: { cusp: 7, starLordSignifies: [6, 12] }, text: "The 7th sub lord is in the star of a planet signifying 6 and 12: partnerships break.", polarity: "bad", source: P3("51") },
  { id: "kp7-partner-permanent", cusp: 7, topic: "Partnership", when: { cusp: 7, starLordSignifies: [5, 11] }, text: "The 7th sub lord is in the star of a planet signifying 5 and 11: a lasting tie with the partner.", polarity: "good", source: P3("51") },
  { id: "kp7-partner-loss", cusp: 7, topic: "Partnership", when: { cusp: 7, starLordSignifies: [5, 8, 12] }, text: "The 7th sub lord is in the star of a planet signifying 5, 8 and 12: the partner gains and you lose.", polarity: "bad", source: P3("51") },
  { id: "kp7-opponent", cusp: 7, topic: "Opponents", when: { cusp: 7, minOf: { houses: [5, 7, 8, 12], count: 3 } }, text: "The 7th sub lord signifies 7, 8, 12 and 5: opponents are strong in every walk of life.", polarity: "bad", source: P3("51") },
  { id: "kp7-age-saturn", cusp: 7, topic: "Partner", when: { cusp: 7, subLordIs: ["Saturn"] }, text: "Saturn as 7th sub lord: a marked age difference with the partner; a slower, more dutiful union.", polarity: "neutral", source: P3("52") },
  { id: "kp7-age-proper", cusp: 7, topic: "Partner", when: { cusp: 7, subLordIs: ["Jupiter", "Venus", "Sun"] }, text: "Jupiter, Venus or Sun as 7th sub lord: a conventional age difference and a pleasant union.", polarity: "good", source: P3("52") },
  { id: "kp7-age-small", cusp: 7, topic: "Partner", when: { cusp: 7, subLordIs: ["Moon", "Mars", "Mercury"] }, text: "Moon, Mars or Mercury as 7th sub lord: little age difference; the partner may be younger (Mars adds quarrels over trifles, Moon a pleasant temper).", polarity: "neutral", source: P3("52") },
  { id: "kp7-origin-local", cusp: 7, topic: "Partner", when: { cusp: 7, starLordSignifies: [4, 10] }, text: "The 7th sub lord is in the star of a planet signifying 4 and 10: the partner comes from the same locality.", polarity: "neutral", source: P3("52") },
  { id: "kp7-origin-kin", cusp: 7, topic: "Partner", when: { cusp: 7, starLordSignifies: [3] }, text: "The 7th sub lord is in the star of a planet signifying the 3rd: the partner may be a cousin or a neighbour.", polarity: "neutral", source: P3("52") },
  { id: "kp7-origin-friends", cusp: 7, topic: "Partner", when: { cusp: 7, starLordSignifies: [11] }, text: "The 7th sub lord is in the star of a planet signifying the 11th: the partner comes through friends.", polarity: "neutral", source: P3("52") },
  { id: "kp7-origin-love", cusp: 7, topic: "Partner", when: { cusp: 7, starLordSignifies: [5, 9] }, text: "The 7th sub lord is in the star of a planet signifying 5 and 9: a love marriage or a partner from far away.", polarity: "neutral", source: P3("52") },
  { id: "kp7-multiple", cusp: 7, topic: "Marriage", when: { cusp: 7, subLordIs: ["Mercury"], all: [2, 11] }, text: "Mercury (or a planet in a dual sign) as 7th sub lord signifying 2 and 11: more than one union is possible.", polarity: "neutral", source: P3("52") },
  { id: "kp7-multiple-dual", cusp: 7, topic: "Marriage", when: { cusp: 7, subLordInDualSign: true, subLordNot: ["Mercury"], all: [2, 11] }, text: "The 7th sub lord in a dual sign signifying 2 and 11: more than one union is possible.", polarity: "neutral", source: P3("52") },
  { id: "kp7-multi-partners", cusp: 7, topic: "Partnership", when: { cusp: 7, subLordIs: ["Mercury"], any: [11] }, text: "Mercury as 7th sub lord signifying the 11th: more than one business partner and strong ties of partnership.", polarity: "good", source: P3("53") },
  // ── Cusp VII from Astro Secrets Part 1, ch. 16 (pp. 158-179) and Dutta's free bhava rules ──
  { id: "kp7-early", cusp: 7, topic: "Marriage", when: { cusp: 7, all: [2, 3, 7] }, text: "The 7th sub lord signifies 2, 3 and 7: an early marriage; with the 11th as well it stays happy for life, with 6 or 12 the happiness is not lifelong.", polarity: "good", timing: [2, 3, 7, 11], source: P1("158") },
  { id: "kp7-no-marriage", cusp: 7, topic: "Marriage", when: { cusp: 7, subLordIs: ["Saturn", "Mars", "Sun"], starLordSignifies: [6, 12], none: [2, 7, 11], otherCusp: { cusp: 2, all: [6, 12] } }, text: "Saturn, Mars or the Sun as 7th sub lord, tied through its star lord to 6 and 12 with no link to 2, 7 or 11, and the 2nd sub lord also on 6 and 12: no marriage in this life.", polarity: "bad", source: P1("158") },
  { id: "kp7-love-marriage", cusp: 7, topic: "Marriage", when: { cusp: 7, all: [5, 7], minOf: { houses: [2, 11], count: 1 }, none: [6, 12] }, text: "The 7th sub lord signifies 2, 5, 7 and 11: a love marriage, and a happy one.", polarity: "good", timing: [2, 5, 7, 11], source: P1("158, 179") },
  { id: "kp7-love-separation", cusp: 7, topic: "Marriage", when: { cusp: 7, all: [5, 6, 7, 12] }, text: "The 7th sub lord signifies 5, 6, 7 and 12: a love marriage, followed by separation of husband and wife.", polarity: "bad", source: P1("159") },
  { id: "kp7-love-no-marriage", cusp: 7, topic: "Love", when: { cusp: 7, all: [5], minOf: { houses: [1, 6, 12], count: 2 }, none: [7] }, text: "The 7th sub lord signifies 5 with 1, 6 and 12 but not the 7th: love affairs that do not end in marriage.", polarity: "bad", source: P1("159") },
  { id: "kp7-elopement", cusp: 7, topic: "Love", when: { cusp: 7, all: [3, 5, 9, 12] }, text: "The 7th sub lord signifies 5, 9, 12 and 3: a love affair in which the couple leave their homes together.", polarity: "neutral", source: P1("159") },
  { id: "kp7-two-marriages-sign", cusp: 7, topic: "Marriage", when: { cusp: 7, subLordIs: ["Mercury", "Jupiter"], subLordInDualSign: true, all: [2, 7] }, text: "Mercury or Jupiter as 7th sub lord in a dual sign, predominantly signifying 2 and 7: two marriages.", polarity: "neutral", source: P1("159, 179") },
  { id: "kp7-two-marriages-star", cusp: 7, topic: "Marriage", when: { cusp: 7, subLordIs: ["Mercury", "Jupiter"], subLordInDualSign: false, starLordIs: ["Mercury", "Jupiter"], all: [2, 7] }, text: "Mercury or Jupiter as 7th sub lord in the star of a dual-sign lord, predominantly signifying 2 and 7: two marriages.", polarity: "neutral", source: P1("159, 179") },
  { id: "kp7-many-marriages", cusp: 7, topic: "Marriage", when: { cusp: 7, subLordIs: ["Mercury"], subLordSignIn: [3, 7], all: [2, 3, 7] }, text: "Mercury as 7th sub lord in Kataka or Vrischika (or in Aslesha or Jyeshta) signifying 2, 3 and 7: several marriages.", polarity: "neutral", source: P1("159") },
  { id: "kp7-widow", cusp: 7, topic: "Marriage", when: { cusp: 7, subLordIs: ["Rahu", "Saturn"], all: [2, 7, 8], any: [11] }, text: "Rahu or Saturn as 7th sub lord signifying 2, 7, 8 and 11: marriage to a widow or widower (the book's fuller form has Rahu in Meena or Mithuna under Saturn's aspect).", polarity: "neutral", source: P1("159, 179") },
  { id: "kp7-delayed", cusp: 7, topic: "Marriage", when: { cusp: 7, any: [2, 7], minOf: { houses: [4, 6, 10, 12], count: 2 } }, text: "The 7th sub lord keeps a link to 2 or 7 but also carries 6, 12, 10 or 4: obstacles and delay in marriage, not denial; denial needs no link to 2 and 7 at all.", polarity: "neutral", timing: [2, 3, 7, 11], source: P1("163") },
  { id: "kp7-star-in-12", cusp: 7, topic: "Marriage", when: { cusp: 7, starLordOccupies: [12], none: [2, 7, 11] }, text: "The 7th sub lord is in the star of a planet occupying the 12th and has no link of its own to 2, 7 or 11: it signifies 12, 1 and 6 predominantly, and whatever it owns elsewhere is of no use for marriage.", polarity: "bad", source: P1("163-164") },
  { id: "kp7-mixed-lordship", cusp: 7, topic: "Marriage", when: { cusp: 7, all: [7], any: [6, 12], minOf: { houses: [2, 11], count: 1 } }, text: "The 7th sub lord signifies the 7th along with 6 or 12 by ownership: the mixed lordship colours married life for good and bad but does not prevent the marriage itself.", polarity: "neutral", source: P1("164") },
  { id: "kp7-partnership", cusp: 7, topic: "Partnership", when: { cusp: 7, all: [7, 11] }, text: "The 7th sub lord signifies 7 and 11: partnership in business.", polarity: "good", timing: [7, 11], source: P1("179") },
  { id: "kp7-separation", cusp: 7, topic: "Marriage", when: { cusp: 7, all: [7, 6, 12], any: [2] }, text: "The 7th sub lord signifies 2, 7, 6 and 12: marriage takes place, and separation follows.", polarity: "bad", source: P1("179") },
  { id: "kp7-life-sun", cusp: 7, topic: "Married life", when: { cusp: 7, subLordIs: ["Sun"] }, text: "The Sun as 7th sub lord: little joy in married life.", polarity: "neutral", ...DUTTA("seventh", "seventh") },
  { id: "kp7-life-moon", cusp: 7, topic: "Married life", when: { cusp: 7, subLordIs: ["Moon"] }, text: "The Moon as 7th sub lord: a happy married life.", polarity: "good", ...DUTTA("seventh", "seventh") },
  { id: "kp7-life-mars", cusp: 7, topic: "Married life", when: { cusp: 7, subLordIs: ["Mars"] }, text: "Mars as 7th sub lord: quarrels in married life.", polarity: "bad", ...DUTTA("seventh", "seventh") },
  { id: "kp7-life-mercury", cusp: 7, topic: "Married life", when: { cusp: 7, subLordIs: ["Mercury"] }, text: "Mercury as 7th sub lord: varied pleasures in married life.", polarity: "neutral", ...DUTTA("seventh", "seventh") },
  { id: "kp7-life-jupiter", cusp: 7, topic: "Married life", when: { cusp: 7, subLordIs: ["Jupiter"] }, text: "Jupiter as 7th sub lord: contentment in married life.", polarity: "good", ...DUTTA("seventh", "seventh") },
  { id: "kp7-life-venus", cusp: 7, topic: "Married life", when: { cusp: 7, subLordIs: ["Venus"] }, text: "Venus as 7th sub lord: intense enjoyment of married life.", polarity: "good", ...DUTTA("seventh", "seventh") },
  { id: "kp7-life-saturn", cusp: 7, topic: "Married life", when: { cusp: 7, subLordIs: ["Saturn"] }, text: "Saturn as 7th sub lord: dissatisfaction in married life.", polarity: "bad", ...DUTTA("seventh", "seventh") },

  // ---------------- Cusp VIII ----------------
  { id: "kp8-borrowing", cusp: 8, topic: "Debts", when: { cusp: 8, minOf: { houses: [5, 6, 8, 12], count: 3 } }, text: "The 8th sub lord signifies 5, 6, 8 and 12: borrowing from every quarter.", polarity: "bad", source: P3("53") },
  { id: "kp8-repays", cusp: 8, topic: "Debts", when: { cusp: 8, minOf: { houses: [2, 10, 11], count: 2 } }, text: "The 8th sub lord signifies 2, 10 and 11: borrowed money is repaid.", polarity: "good", source: P3("53") },
  { id: "kp8-accident", cusp: 8, topic: "Accidents", when: { cusp: 8, starLordSignifies: [8], starLordBadhakaMaraka: false }, text: "The 8th sub lord is in the star of a planet signifying the 8th: accidents possible in the conjoined period of the 1st and 8th significators, not fatal since the star lord avoids the badhaka and maraka houses.", polarity: "bad", timing: [1, 8], source: P3("54") },
  { id: "kp8-accident-grave", cusp: 8, topic: "Accidents", when: { cusp: 8, starLordSignifies: [8], starLordBadhakaMaraka: true }, text: "The 8th sub lord is in the star of a planet signifying the 8th and the badhaka or a maraka house: accidents in the conjoined period of 1 and 8 can be grave. Mars connected adds violence.", polarity: "bad", timing: [1, 8], source: P3("54") },
  { id: "kp8-surgery", cusp: 8, topic: "Surgery", when: { cusp: 8, minOf: { houses: [6, 8, 12], count: 2 }, connectedTo: ["Mars"] }, text: "The 8th sub lord signifies 6, 8 and 12 and is connected to Mars (knives): surgery, in the conjoined period of 6, 8 and 12.", polarity: "bad", timing: [6, 8, 12], source: P3("54") },
  { id: "kp8-self-harm", cusp: 8, topic: "Accidents", when: { cusp: 8, starLordSignifies: [8], starLordBadhakaMaraka: true, connectedTo: ["Mars"] }, text: "The 8th sub lord's star lord signifies the 8th and the badhaka or maraka houses, and Mars is connected: the book reads a risk of self-inflicted harm. Read with the lagna and with compassion.", polarity: "bad", source: P3("53-54") },
  // ── Cusp VIII from Astro Secrets Part 1, ch. 16 (pp. 179-183) and Dutta's free bhava rules ──
  { id: "kp8-long-life", cusp: 8, topic: "Longevity", when: { cusp: 8, minOf: { houses: [3, 5, 8, 10], count: 3 } }, text: "The 8th sub lord signifies 8, 5, 10 and 3: a long life.", polarity: "good", source: P1("180, 182") },
  { id: "kp8-full-span", cusp: 8, topic: "Longevity", when: { cusp: 8, minOf: { houses: [3, 5, 8, 10], count: 3 }, none: [2, 7], badhaka: false }, text: "The 8th sub lord signifies 5-8-3-10 and is free of the marakas 2 and 7 and of the badhaka: the book allows the full span of life.", polarity: "good", source: P1("180") },
  { id: "kp8-short-life", cusp: 8, topic: "Longevity", when: { cusp: 8, all: [2, 7], badhaka: true }, text: "The 8th sub lord signifies 2 and 7 and the badhaka house: the span of life is threatened in the conjoined periods of the maraka and badhaka significators. Weigh the lagna and 8th cusps together before saying so.", polarity: "bad", timing: [2, 7], source: P1("180, 182") },
  { id: "kp8-manner-mars", cusp: 8, topic: "Longevity", when: { cusp: 8, all: [2, 7], badhaka: true, subLordIs: ["Mars"] }, text: "Mars as 8th sub lord on 2, 7 and the badhaka: the book names weapons or gunfire as the manner of the end.", polarity: "bad", source: P1("180") },
  { id: "kp8-manner-saturn", cusp: 8, topic: "Longevity", when: { cusp: 8, all: [2, 7], badhaka: true, subLordIs: ["Saturn"] }, text: "Saturn as 8th sub lord on 2, 7 and the badhaka: the book names strangulation or hanging.", polarity: "bad", source: P1("180") },
  { id: "kp8-manner-mercury", cusp: 8, topic: "Longevity", when: { cusp: 8, all: [2, 7], badhaka: true, subLordIs: ["Mercury"] }, text: "Mercury as 8th sub lord on 2, 7 and the badhaka: the book names air, wind or poisonous gas.", polarity: "bad", source: P1("180") },
  { id: "kp8-manner-jupiter", cusp: 8, topic: "Longevity", when: { cusp: 8, all: [2, 7], badhaka: true, subLordIs: ["Jupiter"] }, text: "Jupiter as 8th sub lord on 2, 7 and the badhaka: the book names a heavy object falling on the body.", polarity: "bad", source: P1("180") },
  { id: "kp8-manner-venus", cusp: 8, topic: "Longevity", when: { cusp: 8, all: [2, 7], badhaka: true, subLordIs: ["Venus"] }, text: "Venus as 8th sub lord on 2, 7 and the badhaka: the book names a vehicle accident.", polarity: "bad", source: P1("180") },
  { id: "kp8-manner-poison", cusp: 8, topic: "Longevity", when: { cusp: 8, all: [2, 7], badhaka: true, subLordIs: ["Moon", "Rahu"] }, text: "The Moon or Rahu as 8th sub lord on 2, 7 and the badhaka: the book names poison.", polarity: "bad", source: P1("180-181") },
  { id: "kp8-manner-sun", cusp: 8, topic: "Longevity", when: { cusp: 8, all: [2, 7], badhaka: true, subLordIs: ["Sun"] }, text: "The Sun as 8th sub lord on 2, 7 and the badhaka: the book names a blow from an iron rod or bar.", polarity: "bad", source: P1("181") },
  { id: "kp8-others-property", cusp: 8, topic: "Legacy", when: { cusp: 8, all: [2], minOf: { houses: [1, 10, 11], count: 2 } }, text: "The 8th sub lord signifies 10, 2, 1 and 11: property comes from others.", polarity: "good", timing: [2, 8, 11], source: P1("181") },
  { id: "kp8-wife-property", cusp: 8, topic: "Legacy", when: { cusp: 8, all: [2, 7], minOf: { houses: [3, 6, 11], count: 1 } }, text: "The 8th sub lord signifies 2 and 7 with 3, 6 or 11: property comes through the wife (stridhana).", polarity: "good", timing: [2, 7, 11], source: P1("181-182") },
  { id: "kp8-lottery", cusp: 8, topic: "Finance", when: { cusp: 8, all: [11], minOf: { houses: [2, 3, 5, 6], count: 3 } }, text: "The 8th sub lord signifies 6, 11, 2, 3 and 5: money through a lottery or prize.", polarity: "good", timing: [2, 5, 11], source: P1("181") },
  { id: "kp8-perpetual-debt", cusp: 8, topic: "Debts", when: { cusp: 8, all: [1, 5, 8] }, text: "The 8th sub lord signifies 5, 8 and 1: borrowing all through life, paying interest to the end.", polarity: "bad", source: P1("181") },
  { id: "kp8-medicine", cusp: 8, topic: "Career", when: { cusp: 8, all: [9, 11], minOf: { houses: [4, 10], count: 1 } }, text: "The 8th sub lord signifies 4, 9, 11 and 10: study leading to medicine.", polarity: "good", source: P1("181") },
  { id: "kp8-bank", cusp: 8, topic: "Career", when: { cusp: 8, all: [9, 11], minOf: { houses: [4, 10], count: 1 }, subLordIs: ["Jupiter"] }, text: "Jupiter as 8th sub lord on 4-9-11-10: service as a manager in a bank.", polarity: "good", source: P1("181") },
  { id: "kp8-insurance", cusp: 8, topic: "Career", when: { cusp: 8, all: [9, 11], minOf: { houses: [4, 10], count: 1 }, subLordIs: ["Mercury"] }, text: "Mercury as 8th sub lord on 4-9-11-10: a senior post in insurance.", polarity: "good", source: P1("181") },
  { id: "kp8-robber", cusp: 8, topic: "Standing", when: { cusp: 8, subLordIs: ["Mars"], all: [8, 10], minOf: { houses: [2, 11], count: 1 } }, text: "Mars as 8th sub lord signifying 2, 10, 11 and 8: gains led by force; the book says the leader of a band of robbers.", polarity: "bad", source: P1("181") },
  { id: "kp8-disgrace", cusp: 8, topic: "Standing", when: { cusp: 8, all: [1, 5, 8], otherCusp: { cusp: 1, minOf: { houses: [5, 8, 12], count: 2 } } }, text: "The 8th sub lord signifies 1, 5 and 8 and the lagna sub lord is tied to 5, 8 and 12: disgrace and ill repute that follow the native through life.", polarity: "bad", source: P1("181") },
  { id: "kp8-widow-venus", cusp: 8, topic: "Marriage", when: { cusp: 8, subLordIs: ["Venus"], all: [7, 8], minOf: { houses: [2, 5], count: 1 } }, text: "Venus as 8th sub lord connected to 8, 5, 2 and 7: marriage to a young widow or widower.", polarity: "neutral", source: P1("181-182") },
  { id: "kp8-widow-saturn", cusp: 8, topic: "Marriage", when: { cusp: 8, subLordIs: ["Saturn"], all: [7, 8], minOf: { houses: [2, 5], count: 1 } }, text: "Saturn as 8th sub lord connected to 8, 5, 2 and 7: marriage to a widow or widower older in years.", polarity: "neutral", source: P1("181-183") },
  { id: "kp8-widow-rahu", cusp: 8, topic: "Marriage", when: { cusp: 8, subLordIs: ["Rahu"], all: [7, 8], minOf: { houses: [2, 5], count: 1 }, connectedTo: ["Venus"] }, text: "Rahu as 8th sub lord connected to Venus and to 8, 5, 2 and 7: marriage to a widow or widower older in years.", polarity: "neutral", source: P1("181-183") },
  { id: "kp8-widow-jupiter", cusp: 8, topic: "Marriage", when: { cusp: 8, subLordIs: ["Jupiter"], all: [7, 8], minOf: { houses: [2, 5], count: 1 } }, text: "Jupiter as 8th sub lord connected to 8, 5, 2 and 7: marriage to a widow or widower with a child.", polarity: "neutral", source: P1("182") },
  { id: "kp8-wife-property-held", cusp: 8, topic: "Legacy", when: { cusp: 8, all: [2, 7], otherCusp: { cusp: 1, any: [5, 8] } }, text: "The 8th sub lord promises property through the wife, but the lagna sub lord is connected to 5 or 8: it stays in her name, or comes only in small measure.", polarity: "neutral", source: P1("182") },
  { id: "kp8-will-held", cusp: 8, topic: "Legacy", when: { cusp: 8, all: [8, 11], minOf: { houses: [3, 6, 10], count: 2 }, otherCusp: { cusp: 1, any: [5, 8] } }, text: "The 8th sub lord carries the will combination 8-6-11-3-10, but the lagna sub lord is connected to 5 or 8: nothing comes from a stranger's estate.", polarity: "neutral", source: P1("182") },
  { id: "kp8-will", cusp: 8, topic: "Legacy", when: { cusp: 8, subLordIs: ["Saturn"], subLordRetro: false, all: [8, 11], minOf: { houses: [3, 6, 10], count: 2 } }, text: "Saturn, direct, as 8th sub lord signifying 8, 6, 11, 3 and 10: someone else's property comes by will.", polarity: "good", timing: [6, 8, 11], source: P1("182") },
  { id: "kp8-self-harm-list", cusp: 8, topic: "Accidents", when: { cusp: 8, subLordIs: ["Mars", "Sun"], all: [8, 12], minOf: { houses: [1, 6, 7], count: 2 }, badhaka: true }, text: "Mars or the Sun as 8th sub lord signifying 8, 1, 12, 7, 6 and the badhaka: the book's combination for self-destruction. Read with care and alongside the lagna.", polarity: "bad", source: P1("182") },
  { id: "kp8-gratuity", cusp: 8, topic: "Legacy", when: { cusp: 8, subLordIs: ["Jupiter"], all: [8, 11], minOf: { houses: [2, 5, 6], count: 2 } }, text: "Jupiter as 8th sub lord signifying 8, 2, 6, 11 and 5: money through gratuity, insurance or the estate of the deceased.", polarity: "good", timing: [2, 8, 11], source: P1("182") },
  { id: "kp8-two-husbands", cusp: 8, topic: "Marriage", when: { cusp: 8, subLordIs: ["Venus"], connectedTo: ["Mars"], all: [7, 8], minOf: { houses: [2, 3, 5, 11], count: 2 } }, text: "Read in a female chart. Venus as 8th sub lord connected to Mars and signifying 8, 2, 3, 7, 11 and 5: two marriages or two husbands.", polarity: "neutral", source: P1("183") },
  { id: "kp8-cheque", cusp: 8, topic: "Finance", when: { cusp: 8, all: [6, 11] }, text: "The 8th sub lord signifies 6 and 11: money is received from others (a cheque, the lender's loss).", polarity: "good", timing: [6, 11], ...DUTTA("eighth", "eighth") },

  // ---------------- Cusp IX ----------------
  { id: "kp9-father", cusp: 9, topic: "Father", when: { cusp: 9, minOf: { houses: [3, 10], count: 2 } }, text: "The 9th sub lord signifies 3 and 10 (the 7th and 2nd from the 9th, marakas for the father): the father's health needs watching in their periods.", polarity: "bad", source: P3("54") },
  { id: "kp9-father-long", cusp: 9, topic: "Father", when: { cusp: 9, minOf: { houses: [1, 6, 9, 11], count: 2 }, none: [3, 10] }, text: "The 9th sub lord avoids 3 and 10 and leans on 9, 1, 6 or 11: a long life for the father.", polarity: "good", source: P3("54") },
  { id: "kp9-paternal-property", cusp: 9, topic: "Property", when: { cusp: 9, all: [1, 11] }, text: "The 9th sub lord signifies 1 and 11: paternal property comes to the native.", polarity: "good", source: P3("54") },
  { id: "kp9-pilgrimage", cusp: 9, topic: "Journeys", when: { cusp: 9, minOf: { houses: [3, 9, 10], count: 2 } }, text: "The 9th sub lord signifies 3, 9 and 10: pilgrimage and long journeys.", polarity: "good", timing: [3, 9, 10], source: P3("54") },
  { id: "kp9-astrologer", cusp: 9, topic: "Learning", when: { cusp: 9, starLordSignifies: [2, 9, 11], connectedTo: ["Jupiter", "Moon"] }, text: "The 9th sub lord is in the star of a planet signifying 2, 9 and 11, with Jupiter or Moon connected: success as an astrologer.", polarity: "good", source: P3("54") },
  // ── Cusp IX from Astro Secrets Part 1, ch. 16 (pp. 183-188); Dutta's ninth-house rules were already in from Part 3 ──
  { id: "kp9-astrology-genius", cusp: 9, topic: "Learning", when: { cusp: 9, subLordIs: ["Mercury", "Jupiter"], all: [9], minOf: { houses: [2, 5, 10, 11], count: 3 } }, text: "Mercury or Jupiter as 9th sub lord, connected to the 9th and signifying 2, 9, 10, 11 and 5: a genius in astrology, and known for it.", polarity: "good", source: P1("183, 187-188") },
  { id: "kp9-astrology-new", cusp: 9, topic: "Learning", when: { cusp: 9, subLordIs: ["Mercury", "Jupiter"], all: [9, 12], minOf: { houses: [2, 5, 10, 11], count: 3 } }, text: "Mercury or Jupiter as 9th sub lord on 2-9-10-11-5 with the 12th as well: research that brings out new findings in astrology.", polarity: "good", source: P1("187") },
  { id: "kp9-astrology-insight", cusp: 9, topic: "Learning", when: { cusp: 9, subLordIs: ["Mercury", "Jupiter"], all: [9], none: [10, 11] }, text: "Mercury or Jupiter as 9th sub lord connected to the 9th but not to 10 or 11: a deep insight into astrology that stays private, without the popularity 10 and 11 would give.", polarity: "neutral", source: P1("186-187") },
  { id: "kp9-astrology-false", cusp: 9, topic: "Learning", when: { cusp: 9, subLordIs: ["Mercury"], all: [5, 8, 9] }, text: "Mercury as 9th sub lord signifying 9, 5 and 8: pretends to a knowledge of astrology without study; the predictions do not hold.", polarity: "bad", source: P1("183") },
  { id: "kp9-astrology-unconnected", cusp: 9, topic: "Learning", when: { cusp: 9, subLordIs: ["Mercury", "Jupiter"], none: [9] }, text: "Mercury or Jupiter as 9th sub lord with no connection to the 9th: should the native take up astrology, the readings go astray.", polarity: "neutral", source: P1("187") },
  { id: "kp9-scientist", cusp: 9, topic: "Learning", when: { cusp: 9, subLordIs: ["Saturn"], connectedTo: ["Jupiter", "Mercury"], all: [9], minOf: { houses: [2, 3, 5, 6, 10, 11], count: 3 } }, text: "Saturn as 9th sub lord connected to Jupiter or Mercury and signifying 9 with 2, 3, 5, 6, 10 and 11: a leading scientist whose findings travel far.", polarity: "good", source: P1("183, 188") },
  { id: "kp9-research", cusp: 9, topic: "Learning", when: { cusp: 9, subLordIs: ["Saturn"], all: [9], minOf: { houses: [6, 11, 12], count: 2 } }, text: "Saturn as 9th sub lord signifying 9, 12, 6 and 11: research and new findings.", polarity: "good", source: P1("188") },
  { id: "kp9-renunciation", cusp: 9, topic: "Faith", when: { cusp: 9, subLordIs: ["Saturn"], all: [1, 9, 12] }, text: "Saturn as 9th sub lord signifying 1, 9 and 12: renunciation, taken up in Saturn's dasa or that of the 12th lord.", polarity: "neutral", timing: [9, 12], source: P1("184") },
  { id: "kp9-spiritual", cusp: 9, topic: "Faith", when: { cusp: 9, subLordIs: ["Saturn"], connectedTo: ["Jupiter"], all: [9], minOf: { houses: [1, 5, 11, 12], count: 3 } }, text: "Saturn as 9th sub lord connected to Jupiter and signifying 1, 9, 5, 11 and 12: a spiritual life given to worship.", polarity: "good", source: P1("188") },
  { id: "kp9-minister", cusp: 9, topic: "Standing", when: { cusp: 9, subLordIs: ["Mars", "Sun"], all: [9, 10, 11], minOf: { houses: [2, 6], count: 1 }, none: [5, 8], otherCusp: { cusp: 1, minOf: { houses: [2, 6, 9, 10, 11], count: 3 } } }, text: "Mars or the Sun as 9th sub lord signifying 9, 10, 11 with 2 or 6, clear of 5 and 8, and the lagna sub lord also on 2-9-10-11-6: the highest public office, in the periods of the 10 and 11 significators. The book's form has Mars connected to Jupiter, in the 10th or in the star of the 10th lord.", polarity: "good", timing: [10, 11], source: P1("184-186, 188") },
  { id: "kp9-minister-lost", cusp: 9, topic: "Standing", when: { cusp: 9, subLordIs: ["Mars", "Sun"], all: [9, 10, 11], any: [5, 8], otherCusp: { cusp: 1, minOf: { houses: [2, 6, 9, 10, 11], count: 3 } } }, text: "The 9th sub lord carries 9-10-11 but 5 or 8 is mixed in: high office is reached and then lost, more than once.", polarity: "neutral", timing: [10, 11], source: P1("184-186") },
  { id: "kp9-high-post", cusp: 9, topic: "Standing", when: { cusp: 9, all: [9, 10, 11] }, text: "The 9th sub lord signifies 9, 10 and 11: high posts come; whether they last depends on the lagna lord and lagna sub lord also carrying 2-9-10-11, else they are held briefly and at a lower level.", polarity: "good", timing: [9, 10, 11], source: P1("186") },
  { id: "kp9-abroad", cusp: 9, topic: "Travel", when: { cusp: 9, subLordNot: ["Rahu", "Ketu"], all: [9, 12], any: [3] }, text: "The 9th sub lord signifies 9, 3 and 12: going abroad.", polarity: "good", timing: [3, 9, 12], source: P1("188") },
  { id: "kp9-abroad-node", cusp: 9, topic: "Travel", when: { cusp: 9, subLordIs: ["Rahu", "Ketu"], all: [9, 12], any: [3], connectedTo: ["Jupiter", "Mercury", "Saturn", "Moon"] }, text: "A node as 9th sub lord signifying 9, 3 and 12 and connected to Jupiter, Mercury, Saturn or the Moon: going abroad.", polarity: "good", timing: [3, 9, 12], source: P1("188") },
  { id: "kp9-abroad-node-weak", cusp: 9, topic: "Travel", when: { cusp: 9, subLordIs: ["Rahu", "Ketu"], all: [9, 12], any: [3], connectedToNone: ["Jupiter", "Mercury", "Saturn", "Moon"] }, text: "A node as 9th sub lord signifying 9, 3 and 12 without a link to Jupiter, Mercury, Saturn or the Moon: the book doubts the journey abroad.", polarity: "neutral", source: P1("188") },

  // ---------------- Cusp X ----------------
  { id: "kp10-employment", cusp: 10, topic: "Career", when: { cusp: 10, minOf: { houses: [2, 6, 10, 11], count: 3 } }, text: "The 10th sub lord signifies 2, 6, 10 and 11: employment and steady earnings, promotions in the conjoined periods.", polarity: "good", timing: [2, 6, 10, 11], source: P3("55") },
  { id: "kp10-business", cusp: 10, topic: "Career", when: { cusp: 10, all: [7], none: [6] }, text: "The 10th sub lord signifies the 7th and not the 6th: the main livelihood is business.", polarity: "neutral", source: P3("55") },
  { id: "kp10-service", cusp: 10, topic: "Career", when: { cusp: 10, all: [6], none: [7] }, text: "The 10th sub lord signifies the 6th and not the 7th: the main livelihood is service.", polarity: "neutral", source: P3("55") },
  { id: "kp10-both", cusp: 10, topic: "Career", when: { cusp: 10, all: [6, 7] }, text: "The 10th sub lord signifies both 6 and 7: earnings by service as well as business (a dual sign makes the mix explicit).", polarity: "neutral", source: P3("55") },
  { id: "kp10-self", cusp: 10, topic: "Career", when: { cusp: 10, any: [2, 10], none: [6, 7] }, text: "The 10th sub lord signifies 2 or 10 without 6 or 7: earnings by self-exertion and independent work.", polarity: "neutral", source: P3("55") },
  { id: "kp10-politics", cusp: 10, topic: "Public life", when: { cusp: 10, minOf: { houses: [1, 6, 9, 10, 11], count: 4 }, connectedTo: ["Jupiter", "Mercury", "Mars", "Saturn"] }, text: "The 10th sub lord signifies 1, 6, 9, 10 and 11 with Jupiter, Mercury, Mars or Saturn connected: success in politics and public office (1 success, 6 defeat of opponents, 9 fortune, 10 honour, 11 ambition).", polarity: "good", source: P3("55") },
  { id: "kp10-illegal", cusp: 10, topic: "Career", when: { cusp: 10, subLordIs: ["Saturn"], all: [11] }, text: "Saturn as 10th sub lord signifying the 11th: the book warns of earnings by irregular means.", polarity: "bad", source: P3("56") },
  { id: "kp10-tax", cusp: 10, topic: "Career", when: { cusp: 10, minOf: { houses: [7, 8, 12], count: 2 } }, text: "The 10th sub lord signifies 7, 8 and 12: trouble with tax and official scrutiny.", polarity: "bad", source: P3("55") },
  { id: "kp10-sell-property", cusp: 10, topic: "Property", when: { cusp: 10, minOf: { houses: [3, 5, 10], count: 2 }, all: [3] }, text: "The 10th sub lord signifies 3, 5 and 10: disposal or sale of immovable property.", polarity: "neutral", timing: [3, 5, 10], source: `${P3("55")}; ${P3("46")}` },
  { id: "kp10-pilgrimage", cusp: 10, topic: "Journeys", when: { cusp: 10, all: [3, 9] }, text: "The 10th sub lord signifies 3, 9 and 10: pilgrimage.", polarity: "good", source: P3("55") },
  // ── Cusp X from Astro Secrets Part 1, ch. 16 (pp. 188-198), with two more of Dutta's tenth-house rules ──
  { id: "kp10-reinstatement", cusp: 10, topic: "Career", when: { cusp: 10, all: [2, 6, 10] }, text: "The 10th sub lord signifies 2, 6 and 10: reinstatement in service after a break.", polarity: "good", timing: [2, 6, 10], ...DUTTA("tenth", "tenth") },
  { id: "kp10-reinstatement-denied", cusp: 10, topic: "Career", when: { cusp: 10, minOf: { houses: [1, 5, 9, 12], count: 3 }, none: [2, 6, 10] }, text: "The 10th sub lord leans on 1, 5, 9 and 12 without 2, 6 or 10: no reinstatement once service is lost.", polarity: "bad", ...DUTTA("tenth", "tenth") },
  { id: "kp10-public-no-return", cusp: 10, topic: "Career", when: { cusp: 10, all: [7], fewerThan: { houses: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12], count: 1 } }, text: "The 10th sub lord signifies the 7th and nothing else: a life of public activity without material return.", polarity: "neutral", ...DUTTA("tenth", "tenth") },
  { id: "kp10-honest-steady", cusp: 10, topic: "Standing", when: { cusp: 10, all: [10], none: [2, 7], badhaka: false }, text: "The 10th sub lord signifies the 10th clear of the marakas and the badhaka house: a long life, higher status and straight conduct; the gains may be middling but they are steady and honestly earned.", polarity: "good", source: P1("189-190") },
  { id: "kp10-disgrace", cusp: 10, topic: "Standing", when: { cusp: 10, minOf: { houses: [5, 8, 12], count: 2 }, any: [6] }, text: "The 10th sub lord ties the 10th to 5, 8, 12 and 6: the house loses its true nature and offers disgrace, ill repute or scandal.", polarity: "bad", source: P1("190") },
  { id: "kp10-loss", cusp: 10, topic: "Career", when: { cusp: 10, all: [5, 8, 12] }, text: "The 10th sub lord signifies 5, 8 and 12: the profession runs at a loss.", polarity: "bad", timing: [5, 8, 12], source: P1("192") },
  { id: "kp10-prime-minister", cusp: 10, topic: "Public life", when: { cusp: 10, all: [10], any: [9, 11], badhaka: false, otherCusp: { cusp: 1, minOf: { houses: [2, 6, 10, 11], count: 3 } } }, text: "The 10th sub lord connects 10 with 9 or 11, neither acting as badhaka, and the lagna also carries 2-10-11-6: destined for the office of Minister or Prime Minister.", polarity: "good", timing: [9, 10, 11], source: P1("190") },
  { id: "kp10-industrialist", cusp: 10, topic: "Wealth", when: { cusp: 10, all: [2, 6, 10, 11] }, text: "The 10th sub lord signifies the full 2-6-10-11: great wealth through industry, provided its own sub lord repeats the same houses.", polarity: "good", timing: [2, 6, 10, 11], source: P1("190") },
  { id: "kp10-respect-only", cusp: 10, topic: "Career", when: { cusp: 10, all: [1, 10], fewerThan: { houses: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12], count: 1 } }, text: "The 10th sub lord signifies only 1 and 10: respect and appreciation but no material rise; the first post is held unchanged to the end, and the native never stoops to corruption or short cuts.", polarity: "neutral", source: P1("190-191") },
  { id: "kp10-parents-early", cusp: 10, topic: "Family", when: { cusp: 10, all: [7, 8, 10, 11] }, text: "The 10th sub lord signifies 10, 11, 8 and 7: the book links this, read with the sign quality, to the early loss of the parents.", polarity: "bad", source: P1("191") },
  { id: "kp10-buy-house", cusp: 10, topic: "Property", when: { cusp: 10, all: [4, 6, 9, 12], none: [11] }, text: "The 10th sub lord signifies 9, 6, 4 and 12: purchase of a house already built.", polarity: "good", timing: [4, 6, 9, 12], source: P1("191") },
  { id: "kp10-buy-house-profit", cusp: 10, topic: "Property", when: { cusp: 10, all: [4, 6, 9, 11, 12] }, text: "The 10th sub lord signifies 9, 6, 4, 11 and 12: a profitable house purchase and a happy life in it.", polarity: "good", timing: [4, 6, 9, 11, 12], source: P1("191") },
  { id: "kp10-no-house", cusp: 10, topic: "Property", when: { cusp: 10, all: [3, 10], none: [4, 11] }, text: "The 10th sub lord signifies 3 and 10 without 4 or 11: not destined to buy a house.", polarity: "bad", source: P1("191") },
  { id: "kp10-transfer", cusp: 10, topic: "Career", when: { cusp: 10, all: [3, 10, 12], none: [9] }, text: "The 10th sub lord signifies 3, 10 and 12: a change of place in the same job.", polarity: "neutral", timing: [3, 10, 12], source: P1("192") },
  { id: "kp10-transfer-new-job", cusp: 10, topic: "Career", when: { cusp: 10, all: [3, 9, 10, 12] }, text: "The 10th sub lord signifies 3, 9, 10 and 12: a change of job and of place together.", polarity: "neutral", timing: [3, 9, 10, 12], source: P1("192") },
  { id: "kp10-promotion-transfer", cusp: 10, topic: "Career", when: { cusp: 10, all: [2, 3, 6, 10, 11], none: [12] }, text: "The 10th sub lord signifies 2, 3, 6, 10 and 11: a transfer on promotion, to a nearby place.", polarity: "good", timing: [2, 6, 10, 11], source: P1("192") },
  { id: "kp10-promotion-transfer-far", cusp: 10, topic: "Career", when: { cusp: 10, all: [2, 3, 6, 10, 11, 12] }, text: "The 10th sub lord signifies 2, 3, 6, 10, 11 and 12: a transfer on promotion to a distant place.", polarity: "good", timing: [2, 6, 10, 11], source: P1("192") },
  { id: "kp10-brother-accident", cusp: 10, topic: "Family", when: { cusp: 10, all: [2, 10], connectedTo: ["Mars"], none: [3, 11] }, text: "The 10th sub lord signifies 2 and 10 (the marakas of the 3rd) with Mars having a say, and no support from 3 or 11: the book reads danger to a younger brother through accident.", polarity: "bad", source: P1("192") },
  { id: "kp10-wife-property-job-loss", cusp: 10, topic: "Career", when: { cusp: 10, all: [5, 8, 10] }, text: "The 10th sub lord signifies 10, 8 and 5: the wife comes into property while the native loses his profession, in the related dasa and bhukti.", polarity: "neutral", timing: [5, 8, 10], source: P1("192") },
  { id: "kp10-start-profession", cusp: 10, topic: "Career", when: { cusp: 10, all: [2, 10, 11], none: [6] }, text: "The 10th sub lord signifies 2, 10 and 11: a profession of one's own is started in their conjoined period.", polarity: "good", timing: [2, 10, 11], source: P1("192") },
  { id: "kp10-change-occupation", cusp: 10, topic: "Career", when: { cusp: 10, all: [2, 9, 10, 11] }, text: "The 10th sub lord signifies 2, 9, 10 and 11: a change of occupation, the present one left for a new line.", polarity: "neutral", timing: [2, 9, 10, 11], source: P1("192") },
  { id: "kp10-politics-rise", cusp: 10, topic: "Public life", when: { cusp: 10, subLordIs: ["Mercury", "Jupiter"], all: [9, 10, 11] }, text: "Mercury or Jupiter as 10th sub lord signifying 9, 10 and 11: rise in the political field, given a strong lagna lord.", polarity: "good", timing: [9, 10, 11], source: P1("193") },
  { id: "kp10-minister", cusp: 10, topic: "Public life", when: { cusp: 10, subLordIs: ["Mars", "Sun"], all: [9, 10, 11], minOf: { houses: [2, 6], count: 1 }, otherCusp: { cusp: 1, none: [5, 8, 12] } }, text: "Mars or the Sun as 10th sub lord signifying 2-9-10-11-6, with the lagna clear of 5, 8 and 12: a Minister's post.", polarity: "good", timing: [9, 10, 11], source: P1("193") },
  { id: "kp10-minister-jupiter", cusp: 10, topic: "Public life", when: { cusp: 10, subLordIs: ["Jupiter"], connectedTo: ["Sun", "Mars"], all: [9, 10, 11], minOf: { houses: [2, 6], count: 1 }, otherCusp: { cusp: 1, none: [5, 8, 12] } }, text: "Jupiter as 10th sub lord connected to the Sun or Mars, signifying 2-9-10-11-6, with the lagna clear of 5, 8 and 12: a Minister's post.", polarity: "good", timing: [9, 10, 11], source: P1("193") },
  { id: "kp10-mla-only", cusp: 10, topic: "Public life", when: { cusp: 10, all: [9, 10, 11], otherCusp: { cusp: 1, all: [8], none: [5, 12] } }, text: "The 10th sub lord signifies 9, 10 and 11 but the lagna is tied to the 8th: political rise stops at the legislator's level.", polarity: "neutral", timing: [9, 10, 11], source: P1("193") },
  { id: "kp10-local-leader", cusp: 10, topic: "Public life", when: { cusp: 10, all: [9, 10, 11], otherCusp: { cusp: 1, all: [5, 8], none: [12] } }, text: "The 10th sub lord signifies 9, 10 and 11 but the lagna is tied to 5 and 8: a local leader at the district level only.", polarity: "neutral", timing: [9, 10, 11], source: P1("193") },
  { id: "kp10-politics-subservient", cusp: 10, topic: "Public life", when: { cusp: 10, all: [9, 10, 11], otherCusp: { cusp: 1, all: [5, 8, 12] } }, text: "The 10th sub lord signifies 9, 10 and 11 but the lagna is tied to 5, 8 and 12: in politics, but in the service of more influential leaders.", polarity: "neutral", source: P1("193") },
  { id: "kp10-respected-poor", cusp: 10, topic: "Standing", when: { cusp: 10, all: [1, 3, 9, 10], none: [2, 6, 11], otherCusp: { cusp: 1, none: [5, 8, 12] } }, text: "The 10th sub lord signifies 1, 3, 9 and 10 and the lagna is clear of 5, 8 and 12: a respected life honoured by all, but materially poor.", polarity: "neutral", source: P1("193") },
  { id: "kp10-astrologer-expert", cusp: 10, topic: "Learning", when: { cusp: 10, all: [2, 9, 11], none: [10], otherCusp: { cusp: 1, all: [8] } }, text: "The 10th sub lord signifies 2, 9 and 11 while the lagna is tied to the 8th: an expert in astrology who stays unknown to the public.", polarity: "neutral", source: P1("193") },
  { id: "kp10-astrologer-popular", cusp: 10, topic: "Learning", when: { cusp: 10, all: [1, 9, 11], otherCusp: { cusp: 1, minOf: { houses: [3, 10, 11], count: 2 } } }, text: "The 10th sub lord signifies 1, 9 and 11 and the lagna carries 3, 10 and 11: an average astrologer, but popular with the public.", polarity: "neutral", source: P1("193") },
  { id: "kp10-instant-prediction", cusp: 10, topic: "Learning", when: { cusp: 10, all: [1, 9, 10], otherCusp: { cusp: 1, any: [5, 10] } }, text: "The 10th sub lord signifies 1, 9 and 10 and the lagna is connected to the 10th (or the 5th): a hand for horary and instant prediction.", polarity: "neutral", source: P1("193") },
  // Profession by the planets connected to the 10th sub lord (pp. 193-198). "Connected" here follows p. 194: the sub lord is the planet itself, sits in its star (or sub), or is within 3 degrees of it.
  { id: "kp10-trade-jupiter-mercury", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Jupiter", "Mercury"] }, text: "Jupiter and Mercury connected to the 10th: an independent line in finance, speculation, shares or commission, or publishing, the press and astrology; if the 6th is signified, employment as a cashier, in a bank, in money handling, in teaching, or in a textile mill.", polarity: "neutral", source: P1("194, 197") },
  { id: "kp10-trade-jupiter-venus", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Jupiter", "Venus"] }, text: "Jupiter and Venus connected to the 10th: textiles, yarn and power looms.", polarity: "neutral", source: P1("194") },
  { id: "kp10-trade-jupiter-saturn", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Jupiter", "Saturn"] }, text: "Jupiter and Saturn connected to the 10th: metals, mines, iron and steel and things made of iron; with the 6th, employment in such an organisation.", polarity: "neutral", source: P1("195") },
  { id: "kp10-trade-jupiter-moon", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Jupiter", "Moon"] }, text: "Jupiter and the Moon connected to the 10th: blood banks, syrups and cool drinks, cut-piece clothing; with the 6th, employment in such an organisation.", polarity: "neutral", source: P1("195") },
  { id: "kp10-trade-jupiter-sun", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Jupiter", "Sun"] }, text: "Jupiter and the Sun connected to the 10th: making and selling utensils of copper, brass, lead, zinc and stainless steel; with the 6th, employment in such an organisation.", polarity: "neutral", source: P1("195") },
  { id: "kp10-trade-jupiter-mars", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Jupiter", "Mars"] }, text: "Jupiter and Mars connected to the 10th: building construction and contracting; with the 6th, employment there or in watch-and-ward and security work.", polarity: "neutral", source: P1("195") },
  { id: "kp10-trade-saturn-venus", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Saturn", "Venus"] }, text: "Saturn and Venus connected to the 10th: cement, mosaic tiles and granite; with the 6th, employment in factories, mills or transport, and government service if the Sun joins.", polarity: "neutral", source: P1("196") },
  { id: "kp10-trade-saturn-sun", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Saturn", "Sun"] }, text: "Saturn and the Sun connected to the 10th: tools, steel wire, bolts and nuts; with the 6th, employment in such works or in a municipality.", polarity: "neutral", source: P1("196") },
  { id: "kp10-trade-saturn-moon", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Saturn", "Moon"] }, text: "Saturn and the Moon connected to the 10th: oil and oil-based goods; with the 6th, employment in that line.", polarity: "neutral", source: P1("196") },
  { id: "kp10-trade-saturn-mars", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Saturn", "Mars"] }, text: "Saturn and Mars connected to the 10th: renovating old buildings, stone slabs and mechanised stone crushing; with the 6th, manual stone work and service in foul, polluted surroundings.", polarity: "neutral", source: P1("196-197") },
  { id: "kp10-trade-mercury-saturn", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Mercury", "Saturn"] }, text: "Mercury and Saturn connected to the 10th: making wind and string instruments, and a musician or scholar if Mars joins; with the 6th, paid work in beedi or tobacco.", polarity: "neutral", source: P1("197") },
  { id: "kp10-trade-mercury-venus", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Mercury", "Venus"] }, text: "Mercury and Venus connected to the 10th: the cinema field, with an ability to play instruments if Mars and Saturn join; with the 6th, hotel work from server to manager as the lagna lord allows.", polarity: "neutral", source: P1("197") },
  { id: "kp10-trade-mercury-moon", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Mercury", "Moon"] }, text: "Mercury and the Moon connected to the 10th: sweets, milk and milk products, jewellery and clothing.", polarity: "neutral", source: P1("198") },
  { id: "kp10-trade-mercury-mars", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Mercury", "Mars"] }, text: "Mercury and Mars connected to the 10th: polishing and plating, gold-covered ornaments, flowers and fruit; with the 6th, a blacksmith, workshop hand or press compositor.", polarity: "neutral", source: P1("198") },
  { id: "kp10-trade-mercury-rahu", cusp: 10, topic: "Trade", when: { cusp: 10, tiedToAll: ["Mercury", "Rahu"] }, text: "Mercury and Rahu connected to the 10th: watch repair, mirrors and the like.", polarity: "neutral", source: P1("198") },

  // ---------------- Cusp XI ----------------
  { id: "kp11-success", cusp: 11, topic: "Fulfilment", when: { cusp: 11, all: [1, 2, 11] }, text: "The 11th sub lord signifies 1, 2 and 11: success in whatever is undertaken and fulfilment of desires.", polarity: "good", source: P3("56") },
  { id: "kp11-research", cusp: 11, topic: "Learning", when: { cusp: 11, any: [12], all: [9, 11] }, text: "The 11th sub lord is connected to the 12th and signifies 9 and 11: success in research; placement in the 12th points to research abroad.", polarity: "good", source: P3("56") },
  { id: "kp11-phd", cusp: 11, topic: "Learning", when: { cusp: 11, starLordSignifies: [4, 9], connectedTo: ["Jupiter"] }, text: "The 11th sub lord is in the star of a planet signifying 4 and 9 and is connected to Jupiter: a doctorate (early if the sub lord is in a movable sign).", polarity: "good", source: P3("57") },
  { id: "kp11-election-win", cusp: 11, topic: "Public life", when: { cusp: 11, minOf: { houses: [1, 6, 10, 11], count: 3 } }, text: "The 11th sub lord signifies 1, 6, 10 and 11: elections and contests are won.", polarity: "good", source: P3("57") },
  { id: "kp11-election-lose", cusp: 11, topic: "Public life", when: { cusp: 11, minOf: { houses: [5, 8, 12], count: 2 } }, text: "The 11th sub lord signifies 5, 8 and 12: elections and contests are lost.", polarity: "bad", source: P3("57") },
  { id: "kp11-friends", cusp: 11, topic: "Friends", when: { cusp: 11, minOf: { houses: IMPROVING, count: 2 } }, text: "The 11th sub lord signifies the improving houses (1, 2, 3, 6, 10, 11): helpful, beneficial friends.", polarity: "good", source: P3("57") },
  { id: "kp11-interview", cusp: 11, topic: "Competition", when: { cusp: 11, all: [3, 9], subLordRetro: false }, text: "The 11th sub lord is direct and signifies 3 and 9: interviews succeed in the conjoined period of 3 and 9.", polarity: "good", timing: [3, 9], source: P3("57") },
  { id: "kp11-marital", cusp: 11, topic: "Marriage", when: { cusp: 11, minOf: { houses: [2, 5, 7, 11], count: 3 } }, text: "The 11th sub lord signifies 2, 5, 7 and 11: the quality of married life (read from the 11th, while the 7th promises the marriage) is harmonious and happy.", polarity: "good", source: P3("57-58") },
  { id: "kp11-no-cure", cusp: 11, topic: "Health", when: { cusp: 11, all: [6, 12] }, text: "The 11th sub lord signifies 6 and 12: illnesses linger without full recovery.", polarity: "bad", source: P3("58") },
  { id: "kp11-recovery", cusp: 11, topic: "Health", when: { cusp: 11, all: [5, 11] }, text: "The 11th sub lord signifies 5 and 11: recovery from illness is promised.", polarity: "good", source: P3("58") },
  { id: "kp11-siddhi", cusp: 11, topic: "Practice", when: { cusp: 11, all: [5, 10, 11] }, text: "The 11th sub lord signifies 5, 10 and 11: attainment following initiation (5 the mantra, 10 the practice, 11 the achievement).", polarity: "good", source: P3("58") },

  // ---------------- Cusp XII ----------------
  { id: "kp12-foreign", cusp: 12, topic: "Foreign lands", when: { cusp: 12, minOf: { houses: [3, 9, 12], count: 2 } }, text: "The 12th sub lord signifies 3, 9 and 12 (3 leaving home, 9 the long journey, 12 the new surroundings): foreign travel and residence, in their conjoined period.", polarity: "neutral", timing: [3, 9, 12], source: P3("58") },
  { id: "kp12-foreign-work", cusp: 12, topic: "Foreign lands", when: { cusp: 12, minOf: { houses: [3, 9, 12], count: 2 }, strong: [6] }, text: "The 12th sub lord signifies 3, 9 or 12 and is a strong significator of the 6th: travel abroad on work assignments.", polarity: "good", timing: [3, 9, 12], source: P3("58") },
  { id: "kp12-reputation", cusp: 12, topic: "Standing", when: { cusp: 12, all: [8, 12] }, text: "The 12th sub lord signifies 8 and 12: loss of reputation in the conjoined period of 8 and 12.", polarity: "bad", timing: [8, 12], source: P3("58") },
  { id: "kp12-confinement", cusp: 12, topic: "Confinement", when: { cusp: 12, minOf: { houses: [2, 3, 8, 12], count: 3 }, connectedTo: ["Rahu"] }, text: "The 12th sub lord signifies 2, 3, 8 and 12 with Rahu connected: confinement and restriction of movement (2 separation from family, 3 leaving home, 8 restriction, 12 confinement).", polarity: "bad", source: P3("58-59") },
  { id: "kp12-lucky", cusp: 12, topic: "Finance", when: { cusp: 12, subLordIs: ["Jupiter", "Venus", "Mercury"], minOf: { houses: [2, 6, 11], count: 2 } }, text: "A natural benefic as 12th sub lord signifying 2, 6 and 11: lucky in outlay; more returns than expenses.", polarity: "good", source: P3("59") },
  { id: "kp12-left-eye", cusp: 12, topic: "Health", when: { cusp: 12, all: [2, 6, 8, 12] }, text: "The 12th sub lord signifies 6, 8 and 12 and is connected to the 2nd: a defect of the left eye.", polarity: "bad", source: P3("59") },
  { id: "kp12-defect", cusp: 12, topic: "Health", when: { cusp: 12, minOf: { houses: [6, 8, 12], count: 2 }, none: [2] }, text: "The 12th sub lord signifies two of 6, 8 and 12: a bodily defect or weakness; the sub lord's nature and its bhavas show the part affected.", polarity: "bad", source: P3("59") },
  { id: "kp12-cheated", cusp: 12, topic: "Dealings", when: { cusp: 12, starLordSignifies: [5, 8], connectedTo: ["Saturn", "Mercury"] }, text: "The 12th sub lord is in the star of a planet signifying 5 and 8 with Saturn or Mercury connected: liable to be cheated.", polarity: "bad", source: P3("59") },
];

// ---------- evaluation ----------

type Partial = Omit<KpResult, "findings">;

function houses(r: Partial, planet: Planet, six: boolean): number[] {
  const s = r.significators.find((x) => x.planet === planet);
  return s ? (six ? s.housesSix : s.houses) : [];
}

function strongHouses(r: Partial, planet: Planet): number[] {
  const s = r.significators.find((x) => x.planet === planet);
  if (!s) return [];
  return Array.from(new Set([...s.levels.A, ...s.levels.B]));
}

/** Connection between two planets in the KP sense used by the rules. */
export function connected(r: Partial, a: Planet, b: Planet): boolean {
  if (a === b) return true;
  const pa = r.planets.find((p) => p.planet === a)!;
  const pb = r.planets.find((p) => p.planet === b)!;
  return pa.house === pb.house || pa.starLord === b || pa.subLord === b || pb.starLord === a;
}

/** Tight tie used for the profession pairs: identity, star lord, sub lord, or a conjunction within 3 degrees. */
export function tied(r: Partial, a: Planet, b: Planet): boolean {
  if (a === b) return true;
  const pa = r.planets.find((p) => p.planet === a)!;
  const pb = r.planets.find((p) => p.planet === b)!;
  const d = Math.abs(((pa.lon - pb.lon) % 360 + 540) % 360 - 180);
  return pa.starLord === b || pa.subLord === b || d <= 3;
}

function meets(r: Partial, w: KpRuleWhen, six: boolean): { ok: boolean; used: number[] } {
  const cusp = r.cusps[w.cusp - 1];
  const sl = cusp.subLord;
  const slPlanet = r.planets.find((p) => p.planet === sl)!;
  const H = houses(r, sl, six);
  const used = new Set<number>();
  const has = (h: number) => H.includes(h);

  if (w.all && !w.all.every(has)) return { ok: false, used: [] };
  w.all?.forEach((h) => used.add(h));
  if (w.any) {
    const hit = w.any.filter(has);
    if (!hit.length) return { ok: false, used: [] };
    hit.forEach((h) => used.add(h));
  }
  if (w.none && w.none.some(has)) return { ok: false, used: [] };
  if (w.minOf) {
    const hit = w.minOf.houses.filter(has);
    if (hit.length < w.minOf.count) return { ok: false, used: [] };
    hit.forEach((h) => used.add(h));
  }
  if (w.fewerThan && w.fewerThan.houses.filter(has).length >= w.fewerThan.count) return { ok: false, used: [] };
  if (w.strong) {
    const st = strongHouses(r, sl);
    const hit = w.strong.filter((h) => st.includes(h));
    if (!hit.length) return { ok: false, used: [] };
    hit.forEach((h) => used.add(h));
  }
  if (w.subLordIs && !w.subLordIs.includes(sl)) return { ok: false, used: [] };
  if (w.subLordNot && w.subLordNot.includes(sl)) return { ok: false, used: [] };
  if (w.subLordInHouse && !w.subLordInHouse.includes(slPlanet.house)) return { ok: false, used: [] };
  if (w.subLordRetro !== undefined && slPlanet.retrograde !== w.subLordRetro) return { ok: false, used: [] };
  if (w.subLordInDualSign !== undefined && (slPlanet.signIndex % 3 === 2) !== w.subLordInDualSign) return { ok: false, used: [] };
  if (w.subLordSubIs && !w.subLordSubIs.includes(slPlanet.subLord)) return { ok: false, used: [] };
  if (w.subLordSignQuality) {
    const q = (["Movable", "Fixed", "Dual"] as const)[slPlanet.signIndex % 3];
    if (!w.subLordSignQuality.includes(q)) return { ok: false, used: [] };
  }

  const starLord = slPlanet.starLord;
  const starPlanet = r.planets.find((p) => p.planet === starLord)!;
  if (w.starLordIs && !w.starLordIs.includes(starLord)) return { ok: false, used: [] };
  if (w.starLordOccupies && !w.starLordOccupies.includes(starPlanet.house)) return { ok: false, used: [] };
  if (w.starLordSignifies) {
    const SH = houses(r, starLord, six);
    if (!w.starLordSignifies.every((h) => SH.includes(h))) return { ok: false, used: [] };
  }
  if (w.starLordSignifiesAny) {
    const SH = houses(r, starLord, six);
    if (!w.starLordSignifiesAny.some((h) => SH.includes(h))) return { ok: false, used: [] };
  }
  if (w.starLordBadhakaMaraka !== undefined) {
    const SH = houses(r, starLord, six);
    const bm = SH.includes(r.badhaka) || r.marakas.some((m) => SH.includes(m));
    if (bm !== w.starLordBadhakaMaraka) return { ok: false, used: [] };
  }
  if (w.connectedTo && !w.connectedTo.some((p) => connected(r, sl, p))) return { ok: false, used: [] };
  if (w.connectedToAll && !w.connectedToAll.every((p) => connected(r, sl, p))) return { ok: false, used: [] };
  if (w.connectedToNone && w.connectedToNone.some((p) => connected(r, sl, p))) return { ok: false, used: [] };
  if (w.tiedToAll && !w.tiedToAll.every((p) => tied(r, sl, p))) return { ok: false, used: [] };
  if (w.badhaka !== undefined) {
    if (has(r.badhaka) !== w.badhaka) return { ok: false, used: [] };
    if (w.badhaka) used.add(r.badhaka);
  }
  if (w.maraka !== undefined) {
    const hit = r.marakas.filter(has);
    if ((hit.length > 0) !== w.maraka) return { ok: false, used: [] };
    hit.forEach((h) => used.add(h));
  }
  if (w.lagnaQuality && !w.lagnaQuality.includes(r.lagnaQuality)) return { ok: false, used: [] };
  if (w.lagnaSignIn && !w.lagnaSignIn.includes(r.cusps[0].signIndex)) return { ok: false, used: [] };
  if (w.subLordSignIn && !w.subLordSignIn.includes(slPlanet.signIndex)) return { ok: false, used: [] };
  if (w.notStrong) {
    const st = strongHouses(r, sl);
    if (w.notStrong.some((h) => st.includes(h))) return { ok: false, used: [] };
  }
  if (w.otherCusp) {
    const o = w.otherCusp;
    const OH = houses(r, r.cusps[o.cusp - 1].subLord, six);
    if (o.all && !o.all.every((h) => OH.includes(h))) return { ok: false, used: [] };
    if (o.any && !o.any.some((h) => OH.includes(h))) return { ok: false, used: [] };
    if (o.none && o.none.some((h) => OH.includes(h))) return { ok: false, used: [] };
    if (o.minOf && o.minOf.houses.filter((h) => OH.includes(h)).length < o.minOf.count) return { ok: false, used: [] };
  }
  return { ok: true, used: Array.from(used).sort((a, b) => a - b) };
}

export function evaluateKp(r: Partial, six = false): KpFinding[] {
  const out: KpFinding[] = [];
  for (const rule of KP_RULES) {
    const m = meets(r, rule.when, six);
    if (!m.ok) continue;
    const sl = r.cusps[rule.cusp - 1].subLord;
    const slPlanet = r.planets.find((p) => p.planet === sl)!;
    const parts: string[] = [`${sl} is the sub lord of cusp ${rule.cusp}`];
    if (m.used.length) parts.push(`signifies ${m.used.join(", ")}`);
    if (rule.when.starLordOccupies || rule.when.starLordSignifies || rule.when.starLordIs || rule.when.starLordBadhakaMaraka !== undefined) parts.push(`in the star of ${slPlanet.starLord}`);
    if (rule.when.subLordSubIs) parts.push(`in the sub of ${slPlanet.subLord}`);
    if (rule.when.subLordSignQuality) parts.push(`in a ${(["movable", "fixed", "dual"] as const)[slPlanet.signIndex % 3]} sign`);
    if (rule.when.subLordInHouse) parts.push(`posited in the ${slPlanet.house}th`);
    out.push({ ruleId: rule.id, cusp: rule.cusp, topic: rule.topic, text: rule.text, polarity: rule.polarity, timing: rule.timing, source: rule.source, sourceUrl: rule.sourceUrl, evidence: parts.join("; "), subLord: sl });
  }
  return out;
}

/** Human-readable statement of a rule's conditions, for the rule book. */
export function describeKpCondition(w: KpRuleWhen): string {
  const parts: string[] = [];
  const list = (xs: number[]) => xs.join(", ");
  if (w.subLordIs) parts.push(`sub lord is ${w.subLordIs.join(" or ")}`);
  if (w.subLordNot) parts.push(`sub lord is not ${w.subLordNot.join(" or ")}`);
  if (w.all) parts.push(`signifies ${list(w.all)}`);
  if (w.any) parts.push(`signifies ${w.any.length > 1 ? "one of " : ""}${list(w.any)}`);
  if (w.minOf) parts.push(`signifies at least ${w.minOf.count} of ${list(w.minOf.houses)}`);
  if (w.fewerThan) parts.push(`fewer than ${w.fewerThan.count} of ${list(w.fewerThan.houses)}`);
  if (w.none) parts.push(`none of ${list(w.none)}`);
  if (w.strong) parts.push(`strong significator of ${list(w.strong)}`);
  if (w.badhaka !== undefined) parts.push(w.badhaka ? "signifies the badhaka house" : "not the badhaka house");
  if (w.maraka !== undefined) parts.push(w.maraka ? "signifies a maraka house (2 or 7)" : "no maraka house");
  if (w.subLordInHouse) parts.push(`sub lord posited in the ${list(w.subLordInHouse)}`);
  if (w.subLordRetro !== undefined) parts.push(w.subLordRetro ? "sub lord retrograde" : "sub lord direct");
  if (w.subLordInDualSign !== undefined) parts.push(w.subLordInDualSign ? "sub lord in a dual sign" : "sub lord not in a dual sign");
  if (w.starLordIs) parts.push(`in the star of ${w.starLordIs.join(" or ")}`);
  if (w.subLordSubIs) parts.push(`in the sub of ${w.subLordSubIs.join(" or ")}`);
  if (w.subLordSignQuality) parts.push(`in a ${w.subLordSignQuality.map((q) => q.toLowerCase()).join(" or ")} sign`);
  if (w.starLordOccupies) parts.push(`in the star of a planet in the ${list(w.starLordOccupies)}`);
  if (w.starLordSignifies) parts.push(`in the star of a planet signifying ${list(w.starLordSignifies)}`);
  if (w.starLordSignifiesAny) parts.push(`in the star of a planet signifying one of ${list(w.starLordSignifiesAny)}`);
  if (w.starLordBadhakaMaraka !== undefined) parts.push(w.starLordBadhakaMaraka ? "star lord signifies the badhaka or a maraka house" : "star lord clear of badhaka and maraka houses");
  if (w.connectedTo) parts.push(`connected to ${w.connectedTo.length > 3 ? "another planet" : w.connectedTo.join(" or ")}`);
  if (w.connectedToAll) parts.push(`connected to ${w.connectedToAll.join(" and ")}`);
  if (w.connectedToNone) parts.push(`not connected to ${w.connectedToNone.join(", ")}`);
  if (w.tiedToAll) parts.push(`tied to ${w.tiedToAll.join(" and ")} (itself, its star or sub lord, or within 3 degrees)`);
  if (w.lagnaQuality) parts.push(`${w.lagnaQuality.join("/")} lagna`);
  if (w.lagnaSignIn) parts.push(`lagna in ${w.lagnaSignIn.map((i) => SIGNS[i]).join(" or ")}`);
  if (w.subLordSignIn) parts.push(`sub lord in ${w.subLordSignIn.map((i) => SIGNS[i]).join(" or ")}`);
  if (w.notStrong) parts.push(`not a strong significator of ${w.notStrong.join(", ")}`);
  if (w.otherCusp) parts.push(w.otherCusp.cusp === w.cusp ? `also signifies at least ${w.otherCusp.minOf?.count} of ${list(w.otherCusp.minOf?.houses ?? [])}` : `the ${w.otherCusp.cusp}th cusp sub lord signifies ${w.otherCusp.all ? list(w.otherCusp.all) : w.otherCusp.any ? `one of ${list(w.otherCusp.any)}` : w.otherCusp.minOf ? `at least ${w.otherCusp.minOf.count} of ${list(w.otherCusp.minOf.houses)}` : `none of ${list(w.otherCusp.none ?? [])}`}`);
  return parts.join(" · ");
}

export const KP_SOURCES: Array<{ label: string; note: string; url?: string }> = [
  { label: "Astro Secrets & Krishnamurti Padhdhati, Part 1 (M.P. Shanmugam), ch. 16 The 12 Houses", note: "House-by-house cuspal sub-lord readings, pp. 101-209; the 3rd to 10th houses (pp. 131-198) entered so far. Practitioner's own copy." },
  { label: "Dr. Andrew Dutta (Sri Indrajit), free KP bhava rules", note: "Event rules for the twelve houses, published freely by the author for sharing with acknowledgement; used to cross-check each cusp.", url: DUTTA_URL },
  { label: "Astro Secrets & Krishnamurti Padhdhati, Part 3 (ed. K. Subramaniam), ch. 6", note: "Consolidated cuspal sub-lord rules, pp. 35-59. Practitioner's own copy." },
  { label: "Kalpurush Astrology, KP classes 3.1, 3.2 and 4.1 (Sagar Neogi)", note: "Significator tables; the 1st and 2nd cusp readings. Practitioner's own class notes." },
  { label: "Astro Secrets & KP Part 1 (other chapters) and Part 2", note: "Planets, the twelve lagnas, profession, ruling planets and timing; to be entered chapter by chapter." },
];

export const KP_TYPE_LEVEL_LABEL: Record<SignificatorLevel, string> = {
  A: "Star lord occupies",
  B: "Planet occupies",
  C: "Star lord owns",
  D: "Planet owns",
  E: "Sub lord occupies",
  F: "Sub lord owns",
};
