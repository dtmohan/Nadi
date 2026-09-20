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

/** Chapter scaffold. Titles for the printed volumes are placeholders until each is read. */
export const ALP_CHAPTERS: AlpChapter[] = [
  { id: "web-intro", book: "alpastrology.org", title: "Introduction and the progression rate", note: "Ten years per sign, one pada in 1 year 1 month 10 days." },
  { id: "web-magazine", book: "ALP e-magazine 1", title: "Worked examples (Dhoni retirement, a sibling's child)", note: "Principles read off the published examples." },
  { id: "web-magazine-2", book: "ALP e-magazine 2", title: "Marriage timing, the nakshatra lord, houses from the ALP lagna", note: "Principles read off the marriage-timing and property/bereavement examples." },
  // Printed volumes, titled from the publisher's table of contents (alpastrology.org/books). Rules are entered from the books themselves.
  { id: "book1", book: "Book 1", title: "Introduction to ALP; planetary characteristics; the three karmas; dasa-bhukti and gochar; remedial temples", note: "Pending: to be entered from the printed volume." },
  { id: "book2", book: "Book 2", title: "Akshaya Rasi; calculating the Akshaya lagna and rasi; purpose of this birth; karma and time", note: "Pending. Settles the calculation questions (start point, year length) and defines the Akshaya rasi (ARP)." },
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
    id: "alp2-activated-touches-lagna-7",
    chapter: "web-magazine-2",
    when: { activatedFromJanma: [1, 7] },
    text: "The current pada's navamsa sign is the janma lagna or its 7th: a window in which partnership matters (marriage, a formal alliance) come to a head, if the natal chart promises them.",
    weight: 2,
    source: "ALP e-magazine 2, marriage-timing example (Magha 2nd pada in Taurus touching the janma lagna, pp. 22, 34-35)",
    sourceUrl: ALP_SOURCE_MAGAZINE_2,
  },
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
];

export interface AlpContext {
  positions: PlanetPosition[];
  janma: number;
  alp: number;
  point: AlpPoint;
  natalLagna: AlpPoint;
  houses: AlpHouse[];
  placements: AlpPlacement[];
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
    if (w.role) {
      const pl = byRole(w.role);
      if (!pl) continue;
      if (w.roleInHouse && !w.roleInHouse.includes(pl.houseFromAlp)) continue;
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
