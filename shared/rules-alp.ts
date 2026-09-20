// ALP rule book. Rules are grouped by source chapter so the four printed volumes can be
// entered one chapter at a time. A chapter with no rules yet is still listed, marked pending.
//
// A rule matches on the structure computeAlp() produces: which house from the ALP lagna a
// planet or a lord occupies, which house from the janma lagna the ALP lagna itself has reached,
// and which house the current pada's navamsa sign "activates". Keep rules declarative so they
// print in the rule book as written.

import type { Planet, PlanetPosition } from "./astro";
import type { AlpHouse, AlpPlacement, AlpPoint, ArpResult } from "./alp";

export interface AlpChapter {
  id: string;
  /** Book and chapter as printed. */
  book: string;
  title: string;
  /** What the chapter covers; shown while it is still pending. */
  note?: string;
}

export const ALP_SOURCE_SITE = "https://www.alpastrology.org/";
export const ALP_SOURCE_MAGAZINE = "https://www.alpastrology.com/ebook/ALP_BOOK_EBOOK_MAGAZINE_01.pdf";
export const ALP_SOURCE_MAGAZINE_2 = "https://www.alpastrology.com/ebook/ALP_EBOOK_MAGAZINE_PART_02.pdf";
export const ALP_SOURCE_BOOKS = "https://www.alpastrology.org/books";
const CLASS1 = "Book 1 class notes (basic ALP class), rules 1-5";
const BOOK2 = (pages: string) => `Akshaya Lagna Paddhati Vol. 2, Dr. S. Pothuvudaimoorthy, ${pages}`;

/** Chapter scaffold. Titles for the printed volumes are placeholders until each is read. */
export const ALP_CHAPTERS: AlpChapter[] = [
  { id: "web-intro", book: "alpastrology.org", title: "Introduction and the progression rate", note: "Ten years per sign, one pada in 1 year 1 month 10 days." },
  { id: "web-magazine", book: "ALP e-magazine 1", title: "Worked examples (Dhoni retirement, a sibling's child)", note: "Principles read off the published examples." },
  { id: "web-magazine-2", book: "ALP e-magazine 2", title: "Marriage timing, the nakshatra lord, houses from the ALP lagna", note: "Principles read off the marriage-timing and property/bereavement examples." },
  // Printed volumes, titled from the publisher's table of contents (alpastrology.org/books). Rules are entered from the books themselves.
  { id: "book1", book: "Book 1", title: "Introduction to ALP; planetary characteristics; the three karmas; dasa-bhukti and gochar; remedial temples", note: "The volume itself is not in hand; the class notes below stand in for it." },
  { id: "book1-notes", book: "Book 1, class notes", title: "Rules 1-5: the ALP lord and the ALP nakshatra lord in the 6th, 8th, 10th and 12th; the lords of those houses; the general reading for each ALP sign", note: "Entered from the practitioner's handwritten notes of the basic class (Aries reading complete, Taurus partial; the other signs are built from the house themes)." },
  { id: "book2-calc", book: "Book 2, ch. 2", title: "Calculating the ALP point; case studies 1-6 (pp. 32-42)", note: "Entered from the printed volume." },
  { id: "book2-ch3", book: "Book 2, ch. 3", title: "Bhavas signifying the present: 1, 4, 7, 10 and their karma bhavas (pp. 43-47)", note: "Entered from the printed volume; the karma-bhava table is shown on the chart page." },
  { id: "book2-ch4", book: "Book 2, ch. 4", title: "Bhavas signifying the past: 2, 5, 8, 11 (pp. 48-52)", note: "Entered from the printed volume." },
  { id: "book2-ch5", book: "Book 2, ch. 5", title: "Bhavas signifying the future: 3, 6, 9, 12; free-will and destined bhavas; birth lagna and ALP lagna (pp. 53-67)", note: "Entered from the printed volume; the two-planet tables (pp. 59-67) are shown as a column in the houses working." },
  { id: "book2-ch6", book: "Book 2, ch. 6-7", title: "AR - Akshaya Rasi: the mind, and the technique of finding it (pp. 68-71)", note: "Entered from the printed volume: the Akshaya rasi tracks the mind as the Akshaya lagna tracks the body; it indicates a bhava and a planet." },
  { id: "book2-ch8", book: "Book 2, ch. 8", title: "Akshaya rasi calculating method: the Vimshottari shift of the Moon; body and mind in alignment; free-will and destined bhavas restated (pp. 72-77)", note: "Entered from the printed volume; the computation is shown in the Akshaya rasi working." },
  { id: "book2-ch10", book: "Book 2, ch. 9-10", title: "The purpose of life; Akshaya rasi and nakshatra: dasa lord with bhukti lord, ALP with ARP, gochar through the 8th (pp. 78-82)", note: "Entered from the printed volume; the gochar (transit) rules wait for Book 3 and live planet positions." },
  { id: "book2-ch11", book: "Book 2, ch. 11", title: "The nature of Akshaya rasi; predictions through its four padas; the dasa lord from the Akshaya rasi (pp. 83-85)", note: "Entered from the printed volume." },
  { id: "book2-ch12", book: "Book 2, ch. 12-13", title: "Karma and time: what is taken is returned; Akshaya lagna with Akshaya rasi, their lords together from the birth lagna (pp. 86-89)", note: "Entered from the printed volume." },
  { id: "book2-ch14", book: "Book 2, ch. 14-15", title: "ALP point with dasa-bhukti; the ten features to be noted (pp. 90-91)", note: "Entered from the printed volume; the ten-point checklist is in the method notes." },
  { id: "book2-ch16", book: "Book 2, ch. 16", title: "Example horoscopes 1-5: reading the questions from the ALP nakshatra lord, the dasa and bhukti lords, and the Akshaya rasi (pp. 92-99 so far)", note: "Examples 1-4 entered; example 5 continues on the next pages." },
  { id: "book2-ch17", book: "Book 2, ch. 17", title: "Understanding the nakshatra and its sookshma: the three ways (lagna nakshatra point, its lord, the lagna lord) and the present/past/future mix; the activated nakshatra lord's lordship and placement (pp. 137-143)", note: "pp. 140-141 (the sookshma working and example horoscope 1) are not yet photographed." },
  { id: "book2-rest", book: "Book 2, later chapters", title: "Characteristics of the nakshatras; prasna", note: "Pending." },
  { id: "book3", book: "Book 3", title: "Introduction to gochar; the nakshatras of Leo; Aries-lagna ALP; the planets through the 12 bhavas by gochar", note: "Pending. Nakshatra-by-nakshatra readings begin here (Magha, Purva Phalguni, Uttara Phalguni)." },
  { id: "book4", book: "Book 4", title: "The nakshatras of Sagittarius; marriage matching; horoscope analysis", note: "Pending. Continues the nakshatra readings (Mula, Purva Ashadha, Uttara Ashadha)." },
];

export type AlpRole = "alp-lord" | "janma-lord" | "nakshatra-lord" | "navamsa-lord";

export interface AlpRuleWhen {
  /** The ALP lagna sign is this house counted from the janma lagna. */
  alpHouseFromJanma?: number[];
  /** A role planet (by role) occupies one of these houses from the ALP lagna. */
  role?: AlpRole;
  roleInHouse?: number[];
  /** A named planet occupies one of these houses from the ALP lagna. */
  planet?: Planet;
  planetInHouse?: number[];
  /** The navamsa sign of the current pada is one of these houses from the ALP lagna. */
  activatedHouse?: number[];
  /** The role planet shares a sign with any of these planets. */
  roleWith?: Planet[];
  /** The lord of the nakshatra the ALP lagna currently occupies is one of these planets. */
  nakshatraLord?: Planet[];
  /** The navamsa sign of the current pada, counted as a house from the janma lagna. */
  activatedFromJanma?: number[];
  /** The role planet occupies one of these houses counted from the janma lagna. */
  roleInHouseFromJanma?: number[];
  /** The role planet owns one of these houses counted from the ALP lagna (nodes own nothing). */
  roleOwnsHouse?: number[];
  /** The lord of this house from the ALP lagna ... */
  lordOf?: number;
  /** ... occupies one of these houses from the ALP lagna. */
  lordOfInHouse?: number[];
  /** Book 2 p. 35: the pada's navamsa sign is the ALP lagna, its 7th, the janma lagna or its 7th (true), or none of them (false). */
  activatedTouches?: boolean;
  /** The pada's navamsa sign and the sign of the ALP nakshatra lord stand 6/8 from each other (shashtashtaka). */
  activatedNakLordShashtashtaka?: boolean;
  /** The current nakshatra runs on past the end of the current sign, so a sign change falls inside it. */
  nakshatraStraddlesAhead?: boolean;
  /** The lords of these two houses from the ALP lagna share a sign (nodes excluded). */
  lordsTogether?: [number, number];
  /** The Akshaya rasi (ARP) sign is one of these houses counted from the ALP lagna. */
  arpHouseFromAlp?: number[];
  /** The Akshaya rasi lord's sign is one of these houses counted from the ALP lagna lord's sign. */
  arpLordFromAlpLord?: number[];
  /** The ARP nakshatra lord (the running dasa lord) stands in one of these houses from the ALP nakshatra lord. */
  arpNakLordFromAlpNakLord?: number[];
  /** The running bhukti lord stands in one of these houses from the running dasa lord. */
  bhuktiFromDasa?: number[];
  /** The ALP lagna sign is one of these houses counted from a named planet. */
  alpHouseFromPlanet?: { planet: Planet; houses: number[] };
  /** The Akshaya rasi point stands in this nakshatra (and, if given, one of these padas). */
  arpNakshatra?: string;
  arpPada?: number[];
  /** The Akshaya rasi lord stands in one of these houses counted from the Akshaya rasi. */
  arpLordFromArp?: number[];
  /** The running dasa lord (the ARP nakshatra lord) stands in one of these houses from the Akshaya rasi. */
  dasaLordFromArp?: number[];
  /** The running dasa lord stands in one of these houses from the ALP lagna. */
  dasaLordFromAlp?: number[];
  /** The running bhukti lord stands in one of these houses from the ALP lagna. */
  bhuktiLordFromAlp?: number[];
  /** The ALP lagna lord and the Akshaya rasi lord share a sign (two different planets), and that sign is one of these houses from the janma lagna. */
  alpArpLordsTogetherFromJanma?: number[];
  /** The ALP nakshatra lord stands in one of these houses counted from the ALP lagna lord's sign (different planets only). */
  nakLordFromAlpLord?: number[];
  /** Book 2 ch. 17: how many of the three ways (birth lagna nakshatra point by kalapurusha, its lord from the lagna, the lagna lord from the lagna) fall in present (1-4-7-10), past (2-5-8-11) and future (3-6-9-12) houses. */
  threeWays?: { present: number; past: number; future: number };
}

export interface AlpRule {
  id: string;
  chapter: string;
  when: AlpRuleWhen;
  text: string;
  weight: 1 | 2 | 3;
  source: string;
  sourceUrl?: string;
}

export interface AlpFinding {
  ruleId: string;
  chapter: string;
  text: string;
  weight: 1 | 2 | 3;
  source: string;
  sourceUrl?: string;
  planets: Planet[];
}

const ROLE_LABEL: Record<AlpRole, string> = {
  "alp-lord": "ALP lagna lord",
  "janma-lord": "Janma lagna lord",
  "nakshatra-lord": "Lord of the ALP nakshatra",
  "navamsa-lord": "Lord of the activated navamsa sign",
};

/**
 * Starting rules. The first group states the framework itself; the second is read off the
 * published worked examples, so each is tagged to that source and kept general.
 */
export const ALP_RULES: AlpRule[] = [
  {
    id: "alp-lord-kendra",
    chapter: "web-magazine",
    when: { role: "alp-lord", roleInHouse: [1, 4, 7, 10] },
    text: "The ALP lagna lord stands in a kendra from the ALP lagna: the decade's affairs are out in the open and turn on the matters of that house (self, home, partnership, career).",
    weight: 2,
    source: "ALP e-magazine 1, Dhoni example (ALP lord Venus in the 10th)",
    sourceUrl: ALP_SOURCE_MAGAZINE,
  },
  {
    id: "alp-lord-dusthana",
    chapter: "web-magazine",
    when: { role: "alp-lord", roleInHouse: [6, 8, 12] },
    text: "The ALP lagna lord stands in the 6th, 8th or 12th from the ALP lagna: the decade asks for effort, carries a change of course, or draws the native away from the previous setting.",
    weight: 2,
    source: "ALP e-magazine 1 (8th-lord and 12th-lord links read as obstacle and detachment)",
    sourceUrl: ALP_SOURCE_MAGAZINE,
  },
  {
    id: "alp-lord-rahu-ketu",
    chapter: "web-magazine",
    when: { role: "alp-lord", roleWith: ["Rahu", "Ketu"] },
    text: "The ALP lagna lord shares its sign with a node: the decade's turns come unexpectedly (Rahu) or as a letting go (Ketu).",
    weight: 1,
    source: "ALP e-magazine 1, Dhoni example (Venus with Rahu, aspected by Ketu)",
    sourceUrl: ALP_SOURCE_MAGAZINE,
  },
  {
    id: "alp-activated-6-10",
    chapter: "web-magazine",
    when: { activatedHouse: [6] },
    text: "The current pada activates the 6th from the ALP lagna: work and duty press, and the career path meets an obstacle before it clears.",
    weight: 1,
    source: "ALP e-magazine 1 (Swati 4th pada activating Pisces, the 6th, read as a career obstacle)",
    sourceUrl: ALP_SOURCE_MAGAZINE,
  },
  {
    id: "alp-activated-9",
    chapter: "web-magazine",
    when: { activatedHouse: [9] },
    text: "The current pada activates the 9th from the ALP lagna: the 12th from the 10th, a stepping back from the present work, or a turn toward teaching, travel and belief.",
    weight: 1,
    source: "ALP e-magazine 1 (the 9th read as the house of retirement)",
    sourceUrl: ALP_SOURCE_MAGAZINE,
  },
  {
    id: "alp-janma-lord-in-alp",
    chapter: "web-intro",
    when: { role: "janma-lord", roleInHouse: [1] },
    text: "The janma lagna lord sits in the ALP lagna sign itself: the decade brings the native's own nature to the front; a period of personal visibility.",
    weight: 2,
    source: "ALP framework (the crossover of lagna lords, Vol 2 introduction)",
    sourceUrl: ALP_SOURCE_SITE,
  },

  // e-magazine 2: the nakshatra lord "indicates the subject matter of the event through its house placement" (p. 16),
  // and the pada's navamsa touching the janma lagna or its 7th times marriage (pp. 22, 34-35).
  {
    id: "alp2-nak-lord-7",
    chapter: "web-magazine-2",
    when: { role: "nakshatra-lord", roleInHouse: [7] },
    text: "The lord of the ALP nakshatra stands in the 7th from the ALP lagna: the stretch is about the partner and the public face; agreements, marriage and dealings with others set its tone.",
    weight: 2,
    source: "ALP e-magazine 2 (the 7th from the ALP used for spouse and partnership, pp. 5-6, 16)",
    sourceUrl: ALP_SOURCE_MAGAZINE_2,
  },
  {
    id: "alp2-nak-lord-6-8-12",
    chapter: "web-magazine-2",
    when: { role: "nakshatra-lord", roleInHouse: [6, 8, 12] },
    text: "The lord of the ALP nakshatra stands in the 6th, 8th or 12th from the ALP lagna: the stretch carries debt, dispute or ill health (6th), an abrupt change or loss (8th), or expense and withdrawal (12th); the house names the subject.",
    weight: 2,
    source: "ALP e-magazine 2 (6th read as debt, dispute, disease; 8th and 12th as danger and loss, pp. 12, 16-17)",
    sourceUrl: ALP_SOURCE_MAGAZINE_2,
  },
  {
    id: "alp2-nak-lord-2-11",
    chapter: "web-magazine-2",
    when: { role: "nakshatra-lord", roleInHouse: [2, 11] },
    text: "The lord of the ALP nakshatra stands in the 2nd or 11th from the ALP lagna: money and property move in this stretch; family holdings (2nd) or a sizeable gain (11th).",
    weight: 1,
    source: "ALP e-magazine 2 (2nd read as property and family gains, 11th as large financial results, pp. 14-19)",
    sourceUrl: ALP_SOURCE_MAGAZINE_2,
  },
  {
    id: "alp2-nak-lord-10",
    chapter: "web-magazine-2",
    when: { role: "nakshatra-lord", roleInHouse: [10] },
    text: "The lord of the ALP nakshatra stands in the 10th from the ALP lagna: the stretch is about work and position; a change in employment or standing is the likely theme.",
    weight: 1,
    source: "ALP e-magazine 2 (10th used for profession and employment)",
    sourceUrl: ALP_SOURCE_MAGAZINE_2,
  },
  {
    id: "alp2-nak-lord-5",
    chapter: "web-magazine-2",
    when: { role: "nakshatra-lord", roleInHouse: [5] },
    text: "The lord of the ALP nakshatra stands in the 5th from the ALP lagna: children, earlier merit and what one has built come to the front in this stretch.",
    weight: 1,
    source: "ALP e-magazine 2 (5th read as children and previous merit, p. 16)",
    sourceUrl: ALP_SOURCE_MAGAZINE_2,
  },
  {
    id: "alp2-nak-lord-saturn-aspect",
    chapter: "web-magazine-2",
    when: { role: "nakshatra-lord", roleWith: ["Saturn"] },
    text: "The lord of the ALP nakshatra shares its sign with Saturn: what the stretch promises comes slowly, with delay or a burden attached.",
    weight: 1,
    source: "ALP e-magazine 2 (nakshatra lord under Saturn's influence read as blocked gains, p. 16)",
    sourceUrl: ALP_SOURCE_MAGAZINE_2,
  },

  // Book 2, chapter 2 (pp. 32-42). The house the ALP lagna has reached from the janma lagna names the
  // matters the native is occupied with now ("the question could be regarding the 4th bhava", pp. 34, 38, 40; 5th p. 36; 2nd p. 41).
  ...([
    [1, "the native's own person, health and direction"],
    [2, "family, money and education (the karakatwa of the 2nd, p. 41)"],
    [3, "siblings, effort and short journeys"],
    [4, "mother, home, property and vehicles (p. 34, 38, 40)"],
    [5, "children, the mind and personal matters (p. 36)"],
    [6, "debt, disease, disputes and service"],
    [7, "spouse, partnership and dealings with others"],
    [8, "longevity, inheritance and sudden change"],
    [9, "father, fortune and belief"],
    [10, "profession and standing"],
    [11, "gains and elder siblings"],
    [12, "expenditure, loss, distant places and rest"],
  ] as [number, string][]).map(
    ([h, theme]): AlpRule => ({
      id: `b2-alp-in-janma-${h}`,
      chapter: "book2-calc",
      when: { alpHouseFromJanma: [h] },
      text: `The ALP lagna stands in the ${h}${h === 1 ? "st" : h === 2 ? "nd" : h === 3 ? "rd" : "th"} from the janma lagna: the matters that press now are those of that house: ${theme}. Read that house as a temporary lagna and judge it from the ALP point.`,
      weight: 2,
      source: BOOK2("case studies pp. 34-41: the bhava the ALP lagna occupies from the birth lagna indicates the question"),
      sourceUrl: ALP_SOURCE_BOOKS,
    }),
  ),
  {
    id: "b2-marriage-navamsa-touches",
    chapter: "book2-calc",
    when: { activatedTouches: true },
    text: "The current pada's navamsa sign touches the ALP lagna, its 7th, the janma lagna or its 7th: this is a period in which a marriage or alliance can take place, if the chart otherwise allows it.",
    weight: 3,
    source: BOOK2("p. 35, Rule for marriage event"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-marriage-navamsa-away",
    chapter: "book2-calc",
    when: { activatedTouches: false },
    text: "The current pada's navamsa sign touches none of the ALP lagna, its 7th, the janma lagna or its 7th: the book does not read such a pada as one that brings a marriage; the window opens in a later pada.",
    weight: 1,
    source: BOOK2("p. 35: Uttara Phalguni 2nd and 3rd padas, Hasta and Chitra padas read as no chance of marriage"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-12th-lord-in-4",
    chapter: "book2-calc",
    when: { lordOf: 12, lordOfInHouse: [4] },
    text: "The lord of the 12th from the ALP lagna sits in the 4th: expenditure on the mother, the home or property; a caution on medical spending.",
    weight: 2,
    source: BOOK2("p. 34, case study 2: 12th lord (Sun) to ALP in the 4th of ALP indicating loss, expenditure for mother"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-4th-lord-in-12",
    chapter: "book2-calc",
    when: { lordOf: 4, lordOfInHouse: [12] },
    text: "The lord of the 4th from the ALP lagna sits in the 12th: a house or landed property may be lost or given up in this period; the book asks that the native be forewarned.",
    weight: 2,
    source: BOOK2("p. 39, case study 4: lord of Capricorn (4th from ALP) in the 12th of ALP, loss of housing property"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-nak-lord-rahu",
    chapter: "book2-calc",
    when: { nakshatraLord: ["Rahu"] },
    text: "The lagna is passing through a nakshatra of Rahu: pressure, unusual turns and a sense of being pushed mark the stretch; the bhava Rahu occupies from the ALP lagna is activated and names the field.",
    weight: 2,
    source: BOOK2("pp. 36-37, case study 3: ALP nakshatra point travelling in the nakshatra of Rahu; p. 44: if Rahu or Ketu becomes the star lord it activates the bhava in which it is positioned"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-nak-lord-rahu-5",
    chapter: "book2-calc",
    when: { nakshatraLord: ["Rahu"], role: "nakshatra-lord", roleInHouse: [5] },
    text: "Rahu rules the ALP nakshatra and stands in the 5th from the ALP lagna: mental pressure and mind-related trouble for the length of the pada; the book offers no remedy and advises moving with the flow for 1 year 1 month 10 days.",
    weight: 3,
    source: BOOK2("p. 37, case study 3: Rahu in the 5th house from ALP indicates mental pressure"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-navamsa-naklord-68",
    chapter: "book2-calc",
    when: { activatedNakLordShashtashtaka: true },
    text: "The pada's navamsa sign and the sign holding the ALP nakshatra lord stand 6/8 from each other (shashtashtaka): friction between what the period activates and the planet running it; difficulties to be lived through rather than solved.",
    weight: 2,
    source: BOOK2("p. 37, case study 3: shastaashtaka formed between Pisces (D9 of Aridra 4) and Rahu at Libra"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-nak-lord-owns-6",
    chapter: "book2-calc",
    when: { role: "nakshatra-lord", roleOwnsHouse: [6] },
    text: "The lord of the ALP nakshatra also owns the 6th from the ALP lagna: debts and effort colour the stretch; work is found or kept only with strain.",
    weight: 2,
    source: BOOK2("p. 39 (Jupiter holding the 3rd and 6th from ALP indicating debts) and p. 40 (the effort in finding employment)"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-10th-lord-dusthana",
    chapter: "book2-calc",
    when: { lordOf: 10, lordOfInHouse: [6, 8, 12] },
    text: "The lord of the 10th from the ALP lagna sits in the 6th, 8th or 12th: work in this period is unsatisfactory, delayed or ill-matched, and the native waits for something better.",
    weight: 2,
    source: BOOK2("pp. 40-41, case study 5: 10th lord (Moon) in the 8th, then 10th lord (Sun) in the 6th, read as unemployment"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-nak-lord-alp-10",
    chapter: "book2-calc",
    when: { role: "nakshatra-lord", roleInHouse: [1] },
    text: "The lord of the ALP nakshatra sits in the ALP lagna itself: the period's business is personal and immediate; what the nakshatra lord owns from the ALP lagna says whether it helps or burdens.",
    weight: 1,
    source: BOOK2("p. 39, case study 4: ALP nakshatra lord Jupiter in the ALP itself"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2-nak-split",
    chapter: "book2-calc",
    when: { nakshatraStraddlesAhead: true },
    text: "The present nakshatra runs on into the next sign, so a sign change falls inside it: whatever the nakshatra has started (a course of study, a post) meets a break at the sign boundary; plan to finish within the padas that remain in this sign, or start after the boundary.",
    weight: 1,
    source: BOOK2("p. 42, case study 6: Mrigashira split between Taurus and Gemini indicating a break in education"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },

  // Book 2, chapter 3: Bhavas signifying the present (p. 43).
  {
    id: "b2c3-nak-lord-kendra",
    chapter: "book2-ch3",
    when: { role: "nakshatra-lord", roleInHouse: [1, 4, 7, 10] },
    text: "The lord of the ALP nakshatra stands in the 1st, 4th, 7th or 10th from the ALP lagna: the native experiences the good of the period in full.",
    weight: 2,
    source: BOOK2("p. 43: if the nakshatra lord is placed in 1, 4, 7, 10 positions the native experiences all the goodness"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c3-alp-lord-9",
    chapter: "book2-ch3",
    when: { role: "alp-lord", roleInHouse: [9] },
    text: "The ALP lagna lord stands in the 9th from the ALP lagna: the native's fortune in the present comes through the father, teachers and belief.",
    weight: 2,
    source: BOOK2("p. 43: Gemini ALP with Mercury in Aquarius, the 9th, the native experiences all his bhagya through his father"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c3-nak-lord-past",
    chapter: "book2-ch3",
    when: { role: "nakshatra-lord", roleInHouse: [2, 5, 8, 11] },
    text: "The lord of the ALP nakshatra stands in the 2nd, 5th, 8th or 11th from the ALP lagna: what the period brings is rooted in the past; the native lives out the fruit of earlier deeds rather than starting new ones.",
    weight: 2,
    source: BOOK2("p. 44: if the nakshatra lord is placed in 2, 5, 8, 11 positions the native will have experiences based on his past"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c3-nak-lord-future",
    chapter: "book2-ch3",
    when: { role: "nakshatra-lord", roleInHouse: [3, 6, 9, 12] },
    text: "The lord of the ALP nakshatra stands in the 3rd, 6th, 9th or 12th from the ALP lagna: the native plans and succeeds in undertakings aimed at the future; the period is for building rather than reaping.",
    weight: 2,
    source: BOOK2("p. 44: if the nakshatra lord is placed in 3, 6, 9, 12 positions the native will plan and succeed in his future endeavours"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c3-nak-lord-ketu",
    chapter: "book2-ch3",
    when: { nakshatraLord: ["Ketu"] },
    text: "The lagna is passing through a nakshatra of Ketu: the bhava Ketu occupies from the ALP lagna is activated for the stretch; its matters come up in a detached, concluding way.",
    weight: 2,
    source: BOOK2("p. 44: if Rahu and Ketu become the star lord, it will activate the bhava in which they are positioned"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c3-kendras-strong",
    chapter: "book2-ch3",
    when: { role: "alp-lord", roleInHouse: [1, 4, 7, 10] },
    text: "The ALP lagna lord stands in a kendra from the ALP lagna (1, 4, 7, 10, the bhavas of the present): the karma received through the mother and the body is lived out directly and, the book says, is very beneficial when these four bhavas are well placed.",
    weight: 2,
    source: BOOK2("p. 44: if these four bhavas, 1, 4, 7, 10, are positioned well, then the karma from the mother is very beneficial to the natal"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c4-lords-2-11-together",
    chapter: "book2-ch4",
    when: { lordsTogether: [2, 11] },
    text: "The lords of the 2nd and the 11th from the ALP lagna share a sign: the 2nd is the karma bhava of the 11th, and their union is the yoga the book describes; gains come, and the 2nd (family, speech, income) is the door to open for them.",
    weight: 3,
    source: BOOK2("p. 49: by combining both these houses (2nd and 11th lords) the native can achieve yoga; p. 51: the 2nd and the 11th bhava function hand-in-hand"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c4-lords-8-11-together",
    chapter: "book2-ch4",
    when: { lordsTogether: [8, 11] },
    text: "The lords of the 8th and the 11th from the ALP lagna share a sign: the 11th is the karma bhava of the 8th; the book reads the pair as sudden luck, name and fame, with the 8th's health and debt themes tied to the gains.",
    weight: 2,
    source: BOOK2("p. 49: the good and the bad, the growth and the downfall is indicated by the connection of the 8th and the 11th bhava; the two work parallelly and give sudden name, fame and luck"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c4-lords-5-8-together",
    chapter: "book2-ch4",
    when: { lordsTogether: [5, 8] },
    text: "The lords of the 5th and the 8th from the ALP lagna share a sign: the 8th is the karma bhava of the 5th; children, the mind and the kula devata are bound up with longevity and sudden fortune, and the book's remedy runs through both lords.",
    weight: 2,
    source: BOOK2("pp. 50, 52: for the 8th bhava it is essential to get hold of the kula devatha indicated by the 5th bhava; to achieve 5th house characteristics one has to activate the 8th bhava"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c4-lords-2-5-together",
    chapter: "book2-ch4",
    when: { lordsTogether: [2, 5] },
    text: "The lords of the 2nd and the 5th from the ALP lagna share a sign: the 5th is the karma bhava of the 2nd; income, speech and education draw on the merit of the 5th (mind, children, kula devata).",
    weight: 2,
    source: BOOK2("pp. 51-52: the negative impact ... is exhibited by the 5th bhava; if the kula devatha, mind, children, intelligence, income are good then the 2nd bhava aspects are assured"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },

  // Book 2, chapter 5 (pp. 53-67).
  {
    id: "b2c5-nak-lord-destined",
    chapter: "book2-ch5",
    when: { role: "nakshatra-lord", roleInHouse: [4, 5, 6, 7, 8, 9] },
    text: "The ALP nakshatra lord stands in one of the destined bhavas (4th to 9th from the ALP lagna: mother, children and kula devata, disease and inherited debt, spouse, longevity, father): the book holds that what this stretch brings cannot be changed by remedy; only involvement in spiritual activity and the native's own temple visits give respite.",
    weight: 1,
    source: BOOK2("p. 57: 4, 5, 6, 7, 8, 9 are the six bhavas we have no control over; remedies will not be effective for experiences related to these six bhavas based on the ALP lagna and ALP lagna point"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c5-nak-lord-free-will",
    chapter: "book2-ch5",
    when: { role: "nakshatra-lord", roleInHouse: [10, 11, 12, 1, 2, 3] },
    text: "The ALP nakshatra lord stands in one of the free-will bhavas (10th, 11th, 12th, 1st, 2nd, 3rd from the ALP lagna: profession, gains, expenses and investments, oneself, speech and actions, effort): this is ground the native can work on, and the book allows remedies to strengthen the bhava if it is afflicted.",
    weight: 1,
    source: BOOK2("p. 57: 10, 11, 12, 1, 2, 3 are the six bhavas we can exercise our control over; if any gets afflicted, one can do remedies to strengthen these bhavas"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c5-alp-lord-in-1",
    chapter: "book2-ch5",
    when: { role: "alp-lord", roleInHouse: [1] },
    text: "The ALP lagna lord stands in the ALP sign itself: the book infers that the native is in good condition through these ten years.",
    weight: 3,
    source: BOOK2("p. 58: if Mars is in Aries during the ten-year period of ALP lagna Aries, the natal will be in good condition"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c5-6th-lord-in-9",
    chapter: "book2-ch5",
    when: { lordOf: 6, lordOfInHouse: [9] },
    text: "The lord of the 6th from the ALP lagna stands in the 9th, its karma bhava: hurdles, disputes and debts of this stretch have a route to conversion into luck, through the father and the ista devata.",
    weight: 2,
    source: BOOK2("pp. 55-56: arguments, fights, disputes, illness, debts, enemies can be converted to luck or benefits; to activate the goodness of the 6th house one should get hold of the 9th bhava"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 2 ch. 6-8: the Akshaya rasi (the mind) against the Akshaya lagna (the body).
  {
    id: "b2c6-alp-arp-1-7",
    chapter: "book2-ch6",
    when: { arpHouseFromAlp: [1, 7] },
    text: "The Akshaya rasi stands in the ALP lagna or its 7th: body and mind are connected through the 1st and 7th, the native meets people unexpectedly during this stretch and a vipareeta raja yoga can be set in motion.",
    weight: 2,
    source: BOOK2("p. 71 (Mrigashirsha Akshaya rasi against a Scorpio ALP)"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c8-lords-1-7",
    chapter: "book2-ch8",
    when: { arpLordFromAlpLord: [1, 7] },
    text: "The ALP lagna lord and the Akshaya rasi lord stand together or opposite each other: body and mind are in alignment, and the book calls this a good yoga period in which the native's success comes more easily.",
    weight: 3,
    source: BOOK2("pp. 74, 81"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c8-nak-lords-1-7",
    chapter: "book2-ch8",
    when: { arpNakLordFromAlpNakLord: [1, 7] },
    text: "The lord of the ALP nakshatra and the lord of the Akshaya rasi nakshatra (the running dasa lord) stand together or opposite each other: the finer alignment of body and mind, again read as a good yoga period.",
    weight: 2,
    source: BOOK2("p. 74"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c8-nak-lord-destined-arp",
    chapter: "book2-ch8",
    when: { role: "nakshatra-lord", roleInHouse: [4, 5, 6, 7, 8, 9] },
    text: "Book 2 restates it beside the Akshaya rasi: when the ALP nakshatra point activates a destined bhava (4 to 9), the remedy is the native's own to perform; an astrologer who takes part in it shares the karma. From the bhava the Akshaya rasi occupies, the transiting planets have the greater impact.",
    weight: 1,
    source: BOOK2("p. 76"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 2 ch. 10: dasa lord with bhukti lord, ALP with ARP.
  {
    id: "b2c10-alp-arp-6-8",
    chapter: "book2-ch10",
    when: { arpHouseFromAlp: [6, 8] },
    text: "The Akshaya rasi stands 6/8 (shashtashtaka) from the ALP lagna: no synchronisation between body and mind for the stretch; the book asks that the two nakshatra lords be judged before calling it good or bad.",
    weight: 2,
    source: BOOK2("p. 81 (Gemini ALP against a Capricorn Akshaya rasi)"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c10-lords-6-8",
    chapter: "book2-ch10",
    when: { arpLordFromAlpLord: [6, 8] },
    text: "The ALP lagna lord and the Akshaya rasi lord stand 6/8 from each other: even an exalted planet among them will not deliver, since body and mind pull apart (the rule of \"vimati\").",
    weight: 2,
    source: BOOK2("p. 81 (Mars in Capricorn with the Sun in Gemini)"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c10-arp-in-3",
    chapter: "book2-ch10",
    when: { arpHouseFromAlp: [3] },
    text: "The Akshaya rasi is the 3rd from the ALP lagna: the questions of the time turn on the 3rd house karakatwas, success, general efforts and efforts for marriage; a marriage in this stretch comes as a sudden event, and the same period suits registering it.",
    weight: 1,
    source: BOOK2("p. 80 (Aries ALP with a Gemini Akshaya rasi)"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c10-dasa-bhukti-trine",
    chapter: "book2-ch10",
    when: { bhuktiFromDasa: [1, 5, 9] },
    text: "The bhukti lord stands in a trine (1st, 5th or 9th) from the dasa lord: the book's yoga for the Akshaya rasi, read from the two lords' placement towards each other (its example is a bhukti lord in the 9th from the dasa lord).",
    weight: 1,
    source: BOOK2("p. 79"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c10-dasa-bhukti-6-8",
    chapter: "book2-ch10",
    when: { bhuktiFromDasa: [6, 8] },
    text: "The bhukti lord stands 6/8 from the dasa lord: the two lords whose mutual placement the book reads for the Akshaya rasi are out of step, so the stretch runs less smoothly (the shashtashtaka measure the same pages apply to ALP and ARP).",
    weight: 1,
    source: BOOK2("pp. 79, 81"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 2 ch. 11: the nature of the Akshaya rasi.
  {
    id: "b2c11-alp-from-rahu",
    chapter: "book2-ch11",
    when: { alpHouseFromPlanet: { planet: "Rahu", houses: [2, 5, 8, 11] } },
    text: "The ALP lagna stands in the 2nd, 5th, 8th or 11th from Rahu: the native has to experience the fruits of past deeds in this stretch.",
    weight: 2,
    source: BOOK2("p. 83"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 2 ch. 11 (pp. 84-85): predictions through the four padas of the Akshaya rasi; the dasa lord from the ARP.
  {
    id: "b2c11-ashlesha-1",
    chapter: "book2-ch11",
    when: { arpNakshatra: "Ashlesha", arpPada: [1] },
    text: "The Akshaya rasi is in Cancer at Ashlesha pada 1: even with the dasa and bhukti lords well placed, the native has trouble fulfilling desires through this pada (51 months of the Mercury dasa); the planets will be oriented that way too.",
    weight: 1,
    source: BOOK2("p. 84"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c11-ashlesha-2",
    chapter: "book2-ch11",
    when: { arpNakshatra: "Ashlesha", arpPada: [2] },
    text: "The Akshaya rasi is at Ashlesha pada 2: these 51 months give good benefits.",
    weight: 1,
    source: BOOK2("p. 84"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c11-ashlesha-3",
    chapter: "book2-ch11",
    when: { arpNakshatra: "Ashlesha", arpPada: [3] },
    text: "The Akshaya rasi is at Ashlesha pada 3: a phase of troubles for these 51 months.",
    weight: 1,
    source: BOOK2("p. 84"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c11-ashlesha-4",
    chapter: "book2-ch11",
    when: { arpNakshatra: "Ashlesha", arpPada: [4] },
    text: "The Akshaya rasi is at Ashlesha pada 4: average benefits, with some good, for these 51 months.",
    weight: 1,
    source: BOOK2("p. 84"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c11-arp-lord-7-from-arp",
    chapter: "book2-ch11",
    when: { arpLordFromArp: [7] },
    text: "The Akshaya rasi lord stands in the 7th from the Akshaya rasi: the native is guided, or driven, by the spouse or friends (the book's Sagittarius example with Jupiter in the 7th).",
    weight: 1,
    source: BOOK2("p. 85"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c11-dasa-lord-10-from-arp",
    chapter: "book2-ch11",
    when: { dasaLordFromArp: [10] },
    text: "The running dasa lord stands in the 10th from the Akshaya rasi: the question on the mind is joint-venture work or business.",
    weight: 1,
    source: BOOK2("p. 85"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c11-dasa-lord-8-from-arp",
    chapter: "book2-ch11",
    when: { dasaLordFromArp: [8] },
    text: "The running dasa lord is the 8th from the Akshaya rasi (an ashtamadhipathi dasa): the period favours the opponent and troubles the native; extreme thoughts, too much wandering and travel. Count the dasa lord from the Akshaya rasi, not from the birth rasi. Be cautious in this stretch.",
    weight: 2,
    source: BOOK2("pp. 85, 87-88"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c11-dasa-lord-6-from-arp",
    chapter: "book2-ch11",
    when: { dasaLordFromArp: [6] },
    text: "The running dasa lord is the 6th from the Akshaya rasi: a beneficial period for the native and a problematic one for the native's opponents.",
    weight: 1,
    source: BOOK2("p. 85"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 2 ch. 12-13 (pp. 86-89): karma and time; ALP with ARP.
  {
    id: "b2c12-10th-lord-in-5",
    chapter: "book2-ch12",
    when: { lordOf: 10, lordOfInHouse: [5] },
    text: "The 10th lord from the ALP lagna stands in the 5th, the 8th from the 10th: growth in work and money is stuck or stagnant, and the book's example has the profession blocked for the ten years of this sign. What was taken is returned to the same place.",
    weight: 2,
    source: BOOK2("pp. 86-87"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c12-10th-lord-in-2",
    chapter: "book2-ch12",
    when: { lordOf: 10, lordOfInHouse: [2] },
    text: "The 10th lord from the ALP lagna stands in the 2nd: a beneficial period for work and income (the book's Sagittarius-ALP example at ages 61-70).",
    weight: 1,
    source: BOOK2("p. 87"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c12-4th-lord-in-11",
    chapter: "book2-ch12",
    when: { lordOf: 4, lordOfInHouse: [11] },
    text: "The 4th lord from the ALP lagna stands in the 11th, the 8th from the 4th: care is needed over the 4th's matters (mother, home, property) in this stretch.",
    weight: 1,
    source: BOOK2("p. 86"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c12-7th-lord-in-11",
    chapter: "book2-ch12",
    when: { lordOf: 7, lordOfInHouse: [11] },
    text: "The 7th lord from the ALP lagna stands in the 11th: happiness comes to the native through the partner or the people met, though the book notes it can be an indirect, temporary pleasure that distracts from work.",
    weight: 1,
    source: BOOK2("p. 86"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c13-lords-together-present",
    chapter: "book2-ch12",
    when: { alpArpLordsTogetherFromJanma: [1, 4, 7, 10] },
    text: "The ALP lagna lord and the Akshaya rasi lord are together in the 1st, 4th, 7th or 10th from the birth lagna: the ten-year period of this ALP sign is beneficial (Book 2's Taurus-ALP, Leo-ARP example with Sun and Venus together). Their dignity, exalted, own or friendly sign, changes the flavour.",
    weight: 2,
    source: BOOK2("p. 89"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c13-lords-together-past",
    chapter: "book2-ch12",
    when: { alpArpLordsTogetherFromJanma: [2, 5, 8, 11] },
    text: "The ALP lagna lord and the Akshaya rasi lord are together in the 2nd, 5th, 8th or 11th from the birth lagna: the pair gives a struggling life in this stretch.",
    weight: 2,
    source: BOOK2("p. 89"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c13-lords-together-future",
    chapter: "book2-ch12",
    when: { alpArpLordsTogetherFromJanma: [3, 6, 9, 12] },
    text: "The ALP lagna lord and the Akshaya rasi lord are together in the 3rd, 6th, 9th or 12th from the birth lagna: the native only plans for the future and experiences nothing much at present.",
    weight: 2,
    source: BOOK2("p. 89"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 2 ch. 14 (p. 90): the ALP point with the dasa-bhukti.
  {
    id: "b2c14-dasa-lord-on-alp",
    chapter: "book2-ch14",
    when: { dasaLordFromAlp: [1] },
    text: "The running dasa lord stands in the ALP lagna sign itself: the dasa lord, the ALP point and the Moon are connected, and during this nakshatra's stretch (1 year 1 month 10 days) the native achieves and fulfils wishes and reaches a good position in some manner.",
    weight: 2,
    source: BOOK2("p. 90"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c14-bhukti-lord-on-alp",
    chapter: "book2-ch14",
    when: { bhuktiLordFromAlp: [1] },
    text: "The running bhukti lord stands in the ALP lagna sign: the bhukti joins the ALP point, which the book reads as the period's lords backing the body's present position.",
    weight: 1,
    source: BOOK2("p. 90"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 2 ch. 16 (pp. 92-99): example horoscopes 1-4.
  {
    id: "b2c16-nak-lord-12",
    chapter: "book2-ch16",
    when: { role: "nakshatra-lord", roleInHouse: [12] },
    text: "The lord of the ALP nakshatra stands in the 12th from the ALP lagna: expenses and struggle through this nakshatra's 1 year 1 month 10 days, after which the native bounces back (examples on pp. 88 and 93).",
    weight: 2,
    source: BOOK2("pp. 88, 93"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c16-nak-lord-8",
    chapter: "book2-ch16",
    when: { role: "nakshatra-lord", roleInHouse: [8] },
    text: "The lord of the ALP nakshatra stands in the 8th from the ALP lagna: unresolved troubles are what bring the native; the mind cannot take decisions, there is regret over lost things and a low mood, and the body shows allergies (examples 2 and 4).",
    weight: 2,
    source: BOOK2("pp. 94, 98"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c16-nak-lord-6",
    chapter: "book2-ch16",
    when: { role: "nakshatra-lord", roleInHouse: [6] },
    text: "The lord of the ALP nakshatra stands in the 6th from the ALP lagna: the main questions asked are 6th-house ones, debts, disease and court cases; the answer lies in the future bhavas (3, 6, 9, 12).",
    weight: 1,
    source: BOOK2("pp. 96-97"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c16-nak-lord-12-dasa-lord-4",
    chapter: "book2-ch16",
    when: { role: "nakshatra-lord", roleInHouse: [12], dasaLordFromAlp: [4] },
    text: "The ALP nakshatra lord is in the 12th and the ARP nakshatra lord (the dasa lord) in the 4th from the ALP lagna: health issues related to the mother (example 1).",
    weight: 1,
    source: BOOK2("p. 93"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c16-arp-in-10",
    chapter: "book2-ch16",
    when: { arpHouseFromAlp: [10] },
    text: "The Akshaya rasi is the 10th from the ALP lagna: profession-related questions are possible (example 2).",
    weight: 1,
    source: BOOK2("p. 95"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "b2c16-9th-lord-in-6",
    chapter: "book2-ch16",
    when: { lordOf: 9, lordOfInHouse: [6] },
    text: "The 9th lord from the ALP lagna stands in the 6th: debts come through the father and his health is affected; care is needed by both (example 4).",
    weight: 1,
    source: BOOK2("p. 99"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 1 class notes, rules 1-5.
  {
    id: "b1n-alp-lord-6",
    chapter: "book1-notes",
    when: { role: "alp-lord", roleInHouse: [6] },
    text: "Rule 1: the ALP lagna lord should not stand in the 6th; here it does, and the decade brings short-term issues: debts, disease and disputes that can be resolved.",
    weight: 1,
    source: CLASS1,
  },
  {
    id: "b1n-alp-lord-8",
    chapter: "book1-notes",
    when: { role: "alp-lord", roleInHouse: [8] },
    text: "Rule 1: the ALP lagna lord should not stand in the 8th; here it does, and the decade brings long-term issues: unresolved debts, disease, disputes, accidents, and also sudden and unexpected turns.",
    weight: 1,
    source: CLASS1,
  },
  {
    id: "b1n-alp-lord-10",
    chapter: "book1-notes",
    when: { role: "alp-lord", roleInHouse: [10] },
    text: "Rule 1: the ALP lagna lord should not stand in the 10th; here it does, and the decade brings pressure, through job, business and profession.",
    weight: 2,
    source: CLASS1,
  },
  {
    id: "b1n-alp-lord-12",
    chapter: "book1-notes",
    when: { role: "alp-lord", roleInHouse: [12] },
    text: "Rule 1: the ALP lagna lord should not stand in the 12th; here it does, and the decade brings losses: expenses, travel, foreign lands, investments, sleep.",
    weight: 1,
    source: CLASS1,
  },
  {
    id: "b1n-nak-lord-6",
    chapter: "book1-notes",
    when: { role: "nakshatra-lord", roleInHouse: [6] },
    text: "Rule 2: the ALP nakshatra lord should not stand in the 6th; here it does, so this nakshatra's stretch carries short-term debts, disease and disputes.",
    weight: 1,
    source: CLASS1,
  },
  {
    id: "b1n-nak-lord-8",
    chapter: "book1-notes",
    when: { role: "nakshatra-lord", roleInHouse: [8] },
    text: "Rule 2: the ALP nakshatra lord should not stand in the 8th; here it does, so this nakshatra's stretch carries long-term, unresolved matters and sudden turns.",
    weight: 1,
    source: CLASS1,
  },
  {
    id: "b1n-nak-lord-10",
    chapter: "book1-notes",
    when: { role: "nakshatra-lord", roleInHouse: [10] },
    text: "Rule 2: the ALP nakshatra lord should not stand in the 10th; here it does, so this nakshatra's stretch carries pressure from work and profession.",
    weight: 2,
    source: CLASS1,
  },
  {
    id: "b1n-nak-lord-12",
    chapter: "book1-notes",
    when: { role: "nakshatra-lord", roleInHouse: [12] },
    text: "Rule 2: the ALP nakshatra lord should not stand in the 12th; here it does, so this nakshatra's stretch carries losses and expenses, travel and foreign connections.",
    weight: 1,
    source: CLASS1,
  },
  {
    id: "b1n-nak-lord-from-alp-lord-6-8",
    chapter: "book1-notes",
    when: { nakLordFromAlpLord: [6, 8] },
    text: "Rule 3: the ALP nakshatra lord stands 6/8 from the ALP lagna lord: no fulfilment or satisfaction from this nakshatra's stretch, whatever the two planets promise separately.",
    weight: 2,
    source: CLASS1,
  },
  // Book 2 ch. 17: the three ways and the present/past/future mix (p. 139).
  {
    id: "ch17-3w-present-3",
    chapter: "book2-ch17",
    when: { threeWays: { present: 3, past: 0, future: 0 } },
    text: "The three ways all fall in present houses (1-4-7-10): the results come in the present.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-past-3",
    chapter: "book2-ch17",
    when: { threeWays: { present: 0, past: 3, future: 0 } },
    text: "The three ways all fall in past houses (2-5-8-11): the native does not live in the present or plan for the future, but experiences past karmic deeds through others and struggles in life.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-future-3",
    chapter: "book2-ch17",
    when: { threeWays: { present: 0, past: 0, future: 3 } },
    text: "The three ways all fall in future houses (3-6-9-12): the results come in the future.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-all-three",
    chapter: "book2-ch17",
    when: { threeWays: { present: 1, past: 1, future: 1 } },
    text: "The three ways touch present, past and future, one each: a magnificent yoga; the native creates a name and an everlasting history.",
    weight: 3,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-past-2-present-1",
    chapter: "book2-ch17",
    when: { threeWays: { present: 1, past: 2, future: 0 } },
    text: "Two of the three ways are in past houses and one in the present: the native is born to experience the problems and losses of past lives.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-past-1-present-2",
    chapter: "book2-ch17",
    when: { threeWays: { present: 2, past: 1, future: 0 } },
    text: "One of the three ways is in a past house and two in the present: some loss, and many profits and yogas in this life.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-past-1-future-2",
    chapter: "book2-ch17",
    when: { threeWays: { present: 0, past: 1, future: 2 } },
    text: "One of the three ways is in a past house and two in the future: the native is born to plan for the future, on the strength of good deeds in past lives.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-past-2-future-1",
    chapter: "book2-ch17",
    when: { threeWays: { present: 0, past: 2, future: 1 } },
    text: "Two of the three ways are in past houses and one in the future: the mind is carried away by whims and fancies, faces struggles, and educates the next generation from its experience of life.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-present-1-future-2",
    chapter: "book2-ch17",
    when: { threeWays: { present: 1, past: 0, future: 2 } },
    text: "One of the three ways is in the present and two in the future: through hard work and self-effort the native makes a prosperous life in the future.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-3w-present-2-future-1",
    chapter: "book2-ch17",
    when: { threeWays: { present: 2, past: 0, future: 1 } },
    text: "Two of the three ways are in the present and one in the future: the native lives in the present and the future for wealth, honour, status, name, fame and success.",
    weight: 2,
    source: BOOK2("p. 139"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  // Book 2 ch. 17, example horoscopes (pp. 142-143).
  {
    id: "ch17-nak-lord-6-body",
    chapter: "book2-ch17",
    when: { role: "nakshatra-lord", roleInHouse: [6] },
    text: "The activated nakshatra lord stands in the 6th, the house of disease: the illness shows in the body parts of the houses this planet owns from the ALP lagna (a 3rd lord in the 6th gave throat trouble in the book's example).",
    weight: 1,
    source: BOOK2("p. 143"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-nak-lord-12-janma",
    chapter: "book2-ch17",
    when: { role: "nakshatra-lord", roleInHouseFromJanma: [12] },
    text: "The activated nakshatra lord stands in the 12th from the birth lagna: this stretch brings expenses, in the book's example on account of disease.",
    weight: 1,
    source: BOOK2("p. 143"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-dasa-1-bhukti-9",
    chapter: "book2-ch17",
    when: { dasaLordFromAlp: [1], bhuktiLordFromAlp: [9] },
    text: "The dasa lord stands on the ALP lagna and the bhukti lord in the 9th from it: the 1st and the 9th are connected, so the native and the father share this bhukti's experience.",
    weight: 1,
    source: BOOK2("p. 142"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
  {
    id: "ch17-dasa-1-bhukti-9-nak-8",
    chapter: "book2-ch17",
    when: { dasaLordFromAlp: [1], bhuktiLordFromAlp: [9], role: "nakshatra-lord", roleInHouse: [8] },
    text: "The dasa lord on the ALP lagna, the bhukti lord in the 9th and the activated nakshatra lord in the 8th: the 1st is joined to both the 9th and the 8th, and the book reads a dreadful experience, equivalent to death, for the native and the father.",
    weight: 3,
    source: BOOK2("p. 142"),
    sourceUrl: ALP_SOURCE_BOOKS,
  },
];

/** Book 2 ch. 15 (p. 91): the ten features to observe before predicting. */
export const ALP_TEN_FEATURES = [
  "Lagna",
  "Rasi",
  "Akshaya rasi",
  "Akshaya rasi through the dasa-bhukti",
  "The planets in dasa, bhukti and antara",
  "The connection with gochar planets",
  "The connection between ALP and ARP",
  "The connection between the ALP nakshatra point and the ARP nakshatra point",
  "Akshaya lagna",
  "The gochar in connection with the Akshaya rasi",
];

/** Book 2 pp. 95-96: where the questions come from. */
export const ARP_QUESTIONS_NOTE =
  "Book 2 (pp. 95-96): the house the ALP nakshatra lord occupies from the ALP lagna gives the most important questions the native asks; the houses the running dasa and bhukti lords occupy from the ALP lagna, and from the Akshaya rasi, add theirs. Check first that the question asked matches the horoscope (p. 99).";

/** Book 2 pp. 70-77: what the Akshaya rasi is and how it is found. */
export const ARP_NOTE =
  "Book 2 (pp. 70-73): the Moon's birth nakshatra is the birth rasi. With each Vimshottari dasa the Moon shifts to the next nakshatra, one pada for each quarter of the dasa (Mars dasa in Mrigashirsha: 21 months a pada, the first two in Taurus, the last two in Gemini). The sign the current pada falls in is the Akshaya rasi, the mind; the dasa lord and the house it occupies show the condition of the mind, and the pada's navamsa sign is its subtle point.";

/** Book 2, ch. 3-5: every bhava's "past-life karma bhava" is the 4th from it (the 10th counted backwards). */
export interface KarmaBhavaRow {
  house: number;
  group: "present" | "past" | "future";
  /** Book 2 p. 57: 10, 11, 12, 1, 2, 3 are free-will bhavas (remedies work); 4 to 9 are destined (no remedy, only respite through spiritual activity). */
  control: "free will" | "destined";
  karmaHouse: number;
  theme: string;
  karmaNote: string;
  page: string;
}

export const KARMA_BHAVAS: KarmaBhavaRow[] = [
  { house: 1, control: "free will", group: "present", karmaHouse: 4, theme: "the native, the body, how life is handled", karmaNote: "Past karma is experienced through the body the mother gave; medicine from the mother's hand is itself a remedy.", page: "pp. 43-44" },
  { house: 2, control: "free will", group: "past", karmaHouse: 5, theme: "family income, speech, commitments, education", karmaNote: "Commitments not honoured and money wrongly earned in the past show through the 5th; strengthen the 5th to gain the 2nd.", page: "pp. 51-52" },
  { house: 3, control: "free will", group: "future", karmaHouse: 6, theme: "success, courage, fame, vigour, social connection", karmaNote: "The 6th is the sookshma bhava of the 3rd, the source of all its happenings; the 3rd and the 12th are connected, and handled well they give success.", page: "pp. 53, 57" },
  { house: 4, control: "destined", group: "present", karmaHouse: 7, theme: "mother, home, property", karmaNote: "\"Wife is his second mother\": the spouse depends on how the native treats the mother; neglect of her is paid through the 7th.", page: "p. 45" },
  { house: 5, control: "destined", group: "past", karmaHouse: 8, theme: "children, mind, kula devata, research, grandfather, maternal uncle", karmaNote: "An afflicted 5th brings depression, fear and near-death situations; activate the 8th to gain the 5th.", page: "pp. 50, 52" },
  { house: 6, control: "destined", group: "future", karmaHouse: 9, theme: "hurdles to success, enemies, debt of this life, curable disease, the father's profession and income", karmaNote: "The 6th is the central point of the horoscope: disputes, illness and debts convert to luck through the 9th (ista devata, the father kept happy).", page: "pp. 54-56" },
  { house: 7, control: "destined", group: "present", karmaHouse: 10, theme: "spouse, friends, the people met (the mirror of the 1st)", karmaNote: "Harm done to spouse or friend is given back through the 10th; two parties are needed for any event.", page: "pp. 46-47" },
  { house: 8, control: "destined", group: "past", karmaHouse: 11, theme: "long illness, debts, expenses, losses from previous-birth deeds; sudden luck", karmaNote: "8th and 11th work in parallel: growth and downfall both; for health and longevity activate the 11th.", page: "pp. 49, 51" },
  { house: 9, control: "destined", group: "future", karmaHouse: 12, theme: "father, bhagya, longevity, the mind (with the 6th as the body)", karmaNote: "The father's blessing rests on the debt of birth; in a 9th-house dasa or bhukti, donations, pilgrimage on foot and good expenses bring its benefit, which is delivered through the 12th.", page: "pp. 55-56" },
  { house: 10, control: "free will", group: "present", karmaHouse: 1, theme: "profession, name, position; all deeds, carried to the next birth", karmaNote: "The 10th is also the remedy bhava that washes away sins; what is gained wrongly through it leaves the same way.", page: "pp. 46-47" },
  { house: 11, control: "free will", group: "past", karmaHouse: 2, theme: "efforts, profits, gains, second marriage, elder siblings", karmaNote: "No gains without a strong 2nd; fake talk and wrong earning in the past leave the 11th barren.", page: "pp. 48, 51" },
  { house: 12, control: "free will", group: "future", karmaHouse: 3, theme: "moksha, expenses, future planning, sleeplessness", karmaNote: "The 3rd is the subtly activated bhava of the 12th: get hold of the 3rd to win over the 12th.", page: "pp. 56-57" },
];

/** Book 2 pp. 59-67: for a question on house N from the ALP lagna, the ALP lord and the lord of N are the two planets to see. */
export const TWO_PLANET_NOTE =
  "Book 2 (pp. 59-67) gives, for every ALP sign, the two planets to judge for each bhava: the ALP lord and the lord of that bhava counted from the ALP lagna. Their placements decide the matter asked about (Aries ALP, property: Mars and Moon; Taurus, education: Venus and Mercury; Capricorn, profession: Saturn and Venus).";

/** Book 2 p. 49-50: to activate a bhava, strengthen the lords of that bhava and of its karma bhava (e.g. puja on one lord's weekday in the other lord's hora). */
export const KARMA_REMEDY_NOTE =
  "To bring a bhava's results, the book strengthens the lords of the bhava and of its karma bhava together, for instance worship on the weekday of one lord during the hora of the other (Aries ALP: Venus and Saturn for the 11th on Saturday in Venus hora, p. 49; Sun and Mars for the 5th on Sunday in Mars hora, p. 50).";

export interface AlpContext {
  positions: PlanetPosition[];
  janma: number;
  alp: number;
  point: AlpPoint;
  natalLagna: AlpPoint;
  houses: AlpHouse[];
  placements: AlpPlacement[];
  nakStraddlesAhead: boolean;
  arp: ArpResult;
}

export function evaluateAlp(ctx: AlpContext): AlpFinding[] {
  const out: AlpFinding[] = [];
  const houseOfSign = (signIndex: number) => ((signIndex - ctx.alp + 12) % 12) + 1;
  const activated = houseOfSign(ctx.point.navamsaSign);
  const byRole = (role: AlpRole) => ctx.placements.find((p) => p.role === ROLE_LABEL[role]);
  const alpHouseFromJanma = ((ctx.alp - ctx.janma + 12) % 12) + 1;

  for (const r of ALP_RULES) {
    const w = r.when;
    const planets: Planet[] = [];
    if (w.alpHouseFromJanma && !w.alpHouseFromJanma.includes(alpHouseFromJanma)) continue;
    if (w.activatedHouse && !w.activatedHouse.includes(activated)) continue;
    if (w.nakshatraLord && !w.nakshatraLord.includes(ctx.point.nakshatraLord)) continue;
    if (w.activatedFromJanma && !w.activatedFromJanma.includes(((ctx.point.navamsaSign - ctx.janma + 12) % 12) + 1)) continue;
    if (w.activatedTouches !== undefined) {
      const nav = ctx.point.navamsaSign;
      const touches = [ctx.alp, (ctx.alp + 6) % 12, ctx.janma, (ctx.janma + 6) % 12].includes(nav);
      if (touches !== w.activatedTouches) continue;
    }
    if (w.activatedNakLordShashtashtaka !== undefined) {
      const nl = ctx.positions.find((p) => p.planet === ctx.point.nakshatraLord);
      const d = nl ? ((nl.signIndex - ctx.point.navamsaSign + 12) % 12) + 1 : 0;
      const is68 = d === 6 || d === 8;
      if (is68 !== w.activatedNakLordShashtashtaka) continue;
      if (nl) planets.push(nl.planet);
    }
    if (w.nakshatraStraddlesAhead !== undefined && ctx.nakStraddlesAhead !== w.nakshatraStraddlesAhead) continue;
    if (w.arpHouseFromAlp && !w.arpHouseFromAlp.includes(ctx.arp.houseFromAlp)) continue;
    if (w.arpLordFromAlpLord) {
      if (!w.arpLordFromAlpLord.includes(ctx.arp.arpLord.houseFromAlpLord)) continue;
      planets.push(ctx.point.lord, ctx.arp.point.lord);
    }
    if (w.arpNakLordFromAlpNakLord) {
      if (!w.arpNakLordFromAlpNakLord.includes(ctx.arp.nakLordsMutual)) continue;
      planets.push(ctx.point.nakshatraLord, ctx.arp.dasaLord.planet);
    }
    if (w.bhuktiFromDasa) {
      if (!w.bhuktiFromDasa.includes(ctx.arp.bhuktiLord.houseFromDasaLord)) continue;
      planets.push(ctx.arp.dasaLord.planet, ctx.arp.bhuktiLord.planet);
    }
    if (w.arpNakshatra && ctx.arp.point.nakshatra !== w.arpNakshatra) continue;
    if (w.arpPada && !w.arpPada.includes(ctx.arp.point.pada ?? 0)) continue;
    if (w.arpLordFromArp) {
      if (!w.arpLordFromArp.includes(ctx.arp.arpLord.houseFromArp)) continue;
      planets.push(ctx.arp.arpLord.planet);
    }
    if (w.dasaLordFromArp) {
      if (!w.dasaLordFromArp.includes(ctx.arp.dasaLord.houseFromArp)) continue;
      planets.push(ctx.arp.dasaLord.planet);
    }
    if (w.dasaLordFromAlp) {
      if (!w.dasaLordFromAlp.includes(ctx.arp.dasaLord.houseFromAlp)) continue;
      planets.push(ctx.arp.dasaLord.planet);
    }
    if (w.bhuktiLordFromAlp) {
      if (!w.bhuktiLordFromAlp.includes(ctx.arp.bhuktiLord.houseFromAlp)) continue;
      planets.push(ctx.arp.bhuktiLord.planet);
    }
    if (w.threeWays) {
      const tw = threeWaysFor(ctx.natalLagna, ctx.natalLagna.signIndex, ctx.positions);
      const c = threeWaysCount(tw);
      if (c.present !== w.threeWays.present || c.past !== w.threeWays.past || c.future !== w.threeWays.future) continue;
      planets.push(ctx.natalLagna.nakshatraLord, ctx.natalLagna.lord);
    }
    if (w.nakLordFromAlpLord) {
      const l1 = ctx.point.lord;
      const l2 = ctx.point.nakshatraLord;
      if (l1 === l2) continue;
      const p1 = ctx.positions.find((x) => x.planet === l1);
      const p2 = ctx.positions.find((x) => x.planet === l2);
      if (!p1 || !p2) continue;
      if (!w.nakLordFromAlpLord.includes(((p2.signIndex - p1.signIndex + 12) % 12) + 1)) continue;
      planets.push(l1, l2);
    }
    if (w.alpArpLordsTogetherFromJanma) {
      const l1 = ctx.point.lord;
      const l2 = ctx.arp.point.lord;
      if (l1 === l2) continue;
      const p1 = ctx.positions.find((x) => x.planet === l1);
      const p2 = ctx.positions.find((x) => x.planet === l2);
      if (!p1 || !p2 || p1.signIndex !== p2.signIndex) continue;
      if (!w.alpArpLordsTogetherFromJanma.includes(((p1.signIndex - ctx.janma + 12) % 12) + 1)) continue;
      planets.push(l1, l2);
    }
    if (w.alpHouseFromPlanet) {
      const p = ctx.positions.find((x) => x.planet === w.alpHouseFromPlanet!.planet);
      if (!p) continue;
      if (!w.alpHouseFromPlanet.houses.includes(((ctx.alp - p.signIndex + 12) % 12) + 1)) continue;
      planets.push(p.planet);
    }
    if (w.lordsTogether) {
      const [h1, h2] = w.lordsTogether;
      const l1 = ctx.houses[h1 - 1].lord;
      const l2 = ctx.houses[h2 - 1].lord;
      if (l1 === l2) continue;
      const p1 = ctx.positions.find((x) => x.planet === l1);
      const p2 = ctx.positions.find((x) => x.planet === l2);
      if (!p1 || !p2 || p1.signIndex !== p2.signIndex) continue;
      planets.push(l1, l2);
    }
    if (w.lordOf) {
      const lord = ctx.houses[w.lordOf - 1].lord;
      const p = ctx.positions.find((x) => x.planet === lord);
      if (!p) continue;
      if (w.lordOfInHouse && !w.lordOfInHouse.includes(houseOfSign(p.signIndex))) continue;
      planets.push(lord);
    }
    if (w.role) {
      const pl = byRole(w.role);
      if (!pl) continue;
      if (w.roleInHouse && !w.roleInHouse.includes(pl.houseFromAlp)) continue;
      if (w.roleInHouseFromJanma && !w.roleInHouseFromJanma.includes(pl.houseFromJanma)) continue;
      if (w.roleOwnsHouse && !ctx.houses.some((h) => w.roleOwnsHouse!.includes(h.house) && h.lord === pl.planet && pl.planet !== "Rahu" && pl.planet !== "Ketu")) continue;
      if (w.roleWith) {
        const mates = ctx.positions.filter((p) => p.signIndex === pl.signIndex && p.planet !== pl.planet && w.roleWith!.includes(p.planet));
        if (!mates.length) continue;
        planets.push(...mates.map((m) => m.planet));
      }
      planets.unshift(pl.planet);
    }
    if (w.planet) {
      const p = ctx.positions.find((x) => x.planet === w.planet);
      if (!p) continue;
      const h = houseOfSign(p.signIndex);
      if (w.planetInHouse && !w.planetInHouse.includes(h)) continue;
      planets.push(w.planet);
    }
    out.push({ ruleId: r.id, chapter: r.chapter, text: r.text, weight: r.weight, source: r.source, sourceUrl: r.sourceUrl, planets: Array.from(new Set(planets)) });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

export const ALP_ROLE_LABEL = ROLE_LABEL;

/** Book 1 class notes: what each house from the ALP lagna stands for (body part included). */
export const ALP_HOUSE_THEMES: Record<number, string> = {
  1: "self, the body, how life is handled",
  2: "income, education, vision, family, speech, eyes, face",
  3: "efforts, communication, competitive exams, younger sibling, neck, shoulders, hands",
  4: "house, vehicles, customers, business partners, mother",
  5: "mind, love, children, maternal uncle, purva punya, grandparents",
  6: "short-term debts, diseases, enemies, disputes, lower abdomen",
  7: "marriage, spouse, friends, partnership, spinal cord",
  8: "long-term unresolved debts, diseases, disputes, accidents, court cases, sudden luck, occult, lottery, lower leg",
  9: "blessings, father, ishta devata, spiritual travel, thigh",
  10: "pressure, job, business, profession, promotion, knee",
  11: "gains, promotion, increment, elder sibling, second marriage",
  12: "losses, travel, foreign lands, expenses, sleep, investments, maids and employees, foot",
};

/** Book 1 class notes, rules 4 and 5. */
export const DUSTHANA_NOTE =
  "Class notes, rules 4 and 5: wherever the lords of the 6th, 8th, 10th and 12th from the ALP lagna are positioned, problems of that lord's house are felt in the house it occupies (destiny); and whichever planets occupy the 6th, 8th, 10th or 12th trouble the houses they own (free will). 6th: short-term issues; 8th: long-term issues; 10th: pressure; 12th: losses.";

/** Class-note text for a sign's general reading, keyed by the planet that rules the listed houses. */
export interface AlpSignReadingRow {
  planet: Planet;
  houses: number[];
  text: string;
  /** True when the text is the practitioner's class note; false when generated from the house themes. */
  fromNotes: boolean;
}

const NOTE_TEXT: Partial<Record<string, string>> = {
  // Aries ALP (class notes, complete).
  "Aries:Mars": "Self is connected to unknown or unresolved long-term debts, diseases and court cases. Mars carries this; check the status of Mars.",
  "Aries:Venus": "Income, education, vision, family, speech, eyes and face join marriage, friends, spouse, spine and partnership: the native gets income from spouse, friends or partnerships, and decides on education with help from friends or the partner if married.",
  "Aries:Mercury": "Efforts, communication, competitive exams, neck, shoulders and hands join short-term debts, diseases and enemies: any effort the native takes can end in short-term debts, disease, enemies, and short-term disputes with a younger sibling.",
  "Aries:Moon": "House, vehicles, customers, business partners and the mother: the mother is very caring.",
  "Aries:Sun": "Mind, love, children, maternal uncle, purva punya and grandparents.",
  "Aries:Jupiter": "Blessings, father, ishta devata and thigh join sleep, loss and foreign travel: through the father the native experiences expenses; spiritual travels.",
  "Aries:Saturn": "Pressure, business and profession join gains, promotion, increment, second marriage and the elder sibling: profit and gains are expected through the profession, with pressure along the way.",
  // Taurus ALP (class notes, partial).
  "Taurus:Jupiter": "Long-term debts, diseases and disputes, accidents, court cases, enemies, lower leg join the second marriage and the elder sibling: long-term disputes with an elder sibling, sudden unexpected profits or gains (8 and 11), possible surgery on the lower leg, and problems with promotion or increment.",
  "Taurus:Saturn": "Blessings and father join profession: pressure from the father; the father's business or profession can be taken over by the native; professional relationships with the spiritual field.",
};

const SIGN_LORD: Planet[] = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
const ORDER: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

/** Book 1 class notes: the general reading for an ALP sign, one row per ruling planet, houses it owns from that lagna. */
export function alpSignReading(alpSignIndex: number, signName: string): AlpSignReadingRow[] {
  const byPlanet = new Map<Planet, number[]>();
  for (let h = 1; h <= 12; h++) {
    const lord = SIGN_LORD[(alpSignIndex + h - 1) % 12];
    byPlanet.set(lord, [...(byPlanet.get(lord) ?? []), h]);
  }
  return ORDER.filter((p) => byPlanet.has(p)).map((planet) => {
    const houses = byPlanet.get(planet)!;
    const note = NOTE_TEXT[`${signName}:${planet}`];
    const text = note ?? houses.map((h) => `${h}: ${ALP_HOUSE_THEMES[h]}`).join(". ") + (houses.length > 1 ? `. The two houses are lived through one planet: what happens in one shows in the other.` : ".");
    return { planet, houses, text, fromNotes: Boolean(note) };
  }).sort((x, y) => x.houses[0] - y.houses[0]);
}

// Book 2 ch. 17 (pp. 137-139): the three ways of reading a lagna, and the present/past/future grouping of houses.
export type TimeGroup = "present" | "past" | "future";
export function timeGroupOf(house: number): TimeGroup {
  return [1, 4, 7, 10].includes(house) ? "present" : [2, 5, 8, 11].includes(house) ? "past" : "future";
}
export interface ThreeWay {
  label: string;
  detail: string;
  house: number;
  group: TimeGroup;
}
/**
 * The three ways for a lagna point: (1) the nakshatra point's bhava by the kalapurusha (its sign counted from Aries),
 * (2) the nakshatra lord's house counted from the lagna, (3) the lagna lord's house counted from the lagna.
 */
export function threeWaysFor(point: AlpPoint, fromSign: number, positions: PlanetPosition[]): ThreeWay[] {
  const h = (sign: number) => ((sign - fromSign + 12) % 12) + 1;
  const nl = positions.find((p) => p.planet === point.nakshatraLord);
  const ll = positions.find((p) => p.planet === point.lord);
  const kala = point.signIndex + 1;
  const out: ThreeWay[] = [
    { label: "Lagna nakshatra point", detail: `${point.nakshatra} ${point.pada}, in ${point.sign}: the ${kala}${["st", "nd", "rd"][kala - 1] ?? "th"} sign of the kalapurusha`, house: kala, group: timeGroupOf(kala) },
  ];
  if (nl) {
    const hh = h(nl.signIndex);
    out.push({ label: "Lagna nakshatra lord", detail: `${point.nakshatraLord}, in the ${hh}${["st", "nd", "rd"][hh - 1] ?? "th"} from the lagna`, house: hh, group: timeGroupOf(hh) });
  }
  if (ll) {
    const hh = h(ll.signIndex);
    out.push({ label: "Lagna lord", detail: `${point.lord}, in the ${hh}${["st", "nd", "rd"][hh - 1] ?? "th"} from the lagna`, house: hh, group: timeGroupOf(hh) });
  }
  return out;
}
export function threeWaysCount(ways: ThreeWay[]): Record<TimeGroup, number> {
  const c: Record<TimeGroup, number> = { present: 0, past: 0, future: 0 };
  for (const w of ways) c[w.group]++;
  return c;
}
export const THREE_WAYS_NOTE =
  "Book 2 ch. 17 (pp. 137-139): the lagna nakshatra point is the beginning of the previous birth, read by the bhava it holds for the kalapurusha; the bhava of the lagna nakshatra lord from the lagna is where the native's deeds are relevant; the bhava of the lagna lord defines the future path and how the native plans. Houses 1-4-7-10 give the present, 2-5-8-11 the past, 3-6-9-12 the future.";
