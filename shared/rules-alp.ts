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
  { id: "book2-ch3", book: "Book 2, ch. 3", title: "Bhavas signifying the present (p. 43 onward)", note: "First page entered; the rest of the chapter is pending." },
  { id: "book2-rest", book: "Book 2, later chapters", title: "Akshaya Rasi; purpose of this birth; karma and time", note: "Pending. Defines the Akshaya rasi (ARP)." },
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
    text: "The lagna is passing through a nakshatra of Rahu: pressure, unusual turns and a sense of being pushed mark the stretch; the house Rahu occupies from the ALP lagna names the field.",
    weight: 2,
    source: BOOK2("pp. 36-37, case study 3: ALP nakshatra point travelling in the nakshatra of Rahu"),
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
];

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
