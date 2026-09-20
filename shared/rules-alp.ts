// ALP rule book. Rules are grouped by source chapter so the four printed volumes can be
// entered one chapter at a time. A chapter with no rules yet is still listed, marked pending.
//
// A rule matches on the structure computeAlp() produces: which house from the ALP lagna a
// planet or a lord occupies, which house from the janma lagna the ALP lagna itself has reached,
// and which house the current pada's navamsa sign "activates". Keep rules declarative so they
// print in the rule book as written.

import type { Planet, PlanetPosition } from "./astro";
import type { AlpHouse, AlpPlacement, AlpPoint } from "./alp";

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
const BOOK2 = (pages: string) => `Akshaya Lagna Paddhati Vol. 2, Dr. S. Pothuvudaimoorthy, ${pages}`;

/** Chapter scaffold. Titles for the printed volumes are placeholders until each is read. */
export const ALP_CHAPTERS: AlpChapter[] = [
  { id: "web-intro", book: "alpastrology.org", title: "Introduction and the progression rate", note: "Ten years per sign, one pada in 1 year 1 month 10 days." },
  { id: "web-magazine", book: "ALP e-magazine 1", title: "Worked examples (Dhoni retirement, a sibling's child)", note: "Principles read off the published examples." },
  { id: "web-magazine-2", book: "ALP e-magazine 2", title: "Marriage timing, the nakshatra lord, houses from the ALP lagna", note: "Principles read off the marriage-timing and property/bereavement examples." },
  // Printed volumes, titled from the publisher's table of contents (alpastrology.org/books). Rules are entered from the books themselves.
  { id: "book1", book: "Book 1", title: "Introduction to ALP; planetary characteristics; the three karmas; dasa-bhukti and gochar; remedial temples", note: "Not in hand: the practitioner does not own this volume; nothing is entered from it." },
  { id: "book2-calc", book: "Book 2, ch. 2", title: "Calculating the ALP point; case studies 1-6 (pp. 32-42)", note: "Entered from the printed volume." },
  { id: "book2-ch3", book: "Book 2, ch. 3", title: "Bhavas signifying the present: 1, 4, 7, 10 and their karma bhavas (pp. 43-47)", note: "Entered from the printed volume; the karma-bhava table is shown on the chart page." },
  { id: "book2-ch4", book: "Book 2, ch. 4", title: "Bhavas signifying the past: 2, 5, 8, 11 (pp. 48-52)", note: "Entered from the printed volume." },
  { id: "book2-ch5", book: "Book 2, ch. 5", title: "Bhavas signifying the future: 3, 6, 9, 12; free-will and destined bhavas; birth lagna and ALP lagna (pp. 53-67)", note: "Entered from the printed volume; the two-planet tables (pp. 59-67) are shown as a column in the houses working." },
  { id: "book2-ch6", book: "Book 2, ch. 6", title: "AR - Akshaya Rasi (p. 68 onward)", note: "Introduction entered (the Akshaya rasi tracks the mind as the Akshaya lagna tracks the body); how it is computed is on the pages not yet photographed." },
  { id: "book2-rest", book: "Book 2, later chapters", title: "Purpose of this birth; karma and time", note: "Pending." },
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
];

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
