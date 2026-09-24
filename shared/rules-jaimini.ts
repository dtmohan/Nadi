// Jaimini rule set: Karakamsa (read in the navamsa), Arudha lagna and Upapada (read in the rasi chart).
// Each rule is a small predicate over the assembled Jaimini data; the rule book lists them as text.

import { SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { SUTRA_RULES, sutraRuleText } from "./rules-jaimini-sutras";
import { isBenefic, rasiAspects, type ArudhaPada, type CharaKaraka, type JaiminiFinding, type JaiminiRuleGroup, type VargaPosition } from "./jaimini";

export interface JaiminiContext {
  positions: PlanetPosition[];
  navamsa: VargaPosition[];
  lagnaSign: number;
  karakas: CharaKaraka[];
  karakamsa: number;
  arudhas: ArudhaPada[];
  /** Sign indices of the Hora and Ghatika lagnas when known. */
  horaLagna?: number;
  ghatikaLagna?: number;
}

export interface JaiminiRule {
  id: string;
  group: JaiminiRuleGroup;
  /** Plain-language condition shown in the rule book. */
  when: string;
  text: string;
  weight: 1 | 2 | 3;
  source: JaiminiSource;
  chart: "rasi" | "navamsa";
  /** Planets that satisfy the rule, or null when it does not apply. */
  test: (ctx: JaiminiContext) => Planet[] | null;
}

/** Rule-book view: everything except the predicate. */
export type JaiminiRuleInfo = Omit<JaiminiRule, "test">;

/** A source; `sutra` is a Jaimini Sutras reference ("1.2.16" or "1.2.2-13") that the in-app sutra library can open. */
export type JaiminiSource = { label: string; url: string; sutra?: string };
export const JAIMINI_TEXT_SOURCE = { label: "Jaimini Sutras, tr. B. Suryanarain Rao", url: "https://archive.org/details/in.ernet.dli.2015.134405" };
const JS = (n: string): JaiminiSource => ({ label: `Jaimini Sutras ${n}`, url: "https://vedichora.org/classical/jaimini-sutras", sutra: n });
const BPHS30 = (n: string) => ({ label: `Parashara, Upapada chapter ${n}`, url: "http://jyotishvidya.com/ch30.htm" });
const BPHS29 = (n: string) => ({ label: `Parashara, Arudha chapter ${n}`, url: "http://jyotishvidya.com/ch29.htm" });

const MALEFIC = new Set<Planet>(["Saturn", "Mars", "Rahu", "Ketu"]);

function pos(ctx: JaiminiContext, p: Planet) {
  return ctx.positions.find((x) => x.planet === p)!;
}
function sunLon(ctx: JaiminiContext) {
  return pos(ctx, "Sun").lon;
}
function benefics(ctx: JaiminiContext): Set<Planet> {
  return new Set(ctx.positions.filter((p) => isBenefic(p, sunLon(ctx))).map((p) => p.planet));
}
function malefics(ctx: JaiminiContext): Set<Planet> {
  const b = benefics(ctx);
  return new Set(ctx.positions.filter((p) => !b.has(p.planet) && (MALEFIC.has(p.planet) || p.planet === "Sun" || p.planet === "Moon")).map((p) => p.planet));
}

/** Planets in the nth house from the Karakamsa, in the navamsa. */
function d9House(ctx: JaiminiContext, n: number): Planet[] {
  return ctx.navamsa.filter((p) => houseFrom(ctx.karakamsa, p.signIndex) === n).map((p) => p.planet);
}
/** Planets in the Karakamsa or its 5th, the Atmakaraka itself excluded (Jaimini 1.2.102-116 read both houses alike). */
function d9House15(ctx: JaiminiContext): Planet[] {
  return [...d9House(ctx, 1), ...d9House(ctx, 5)].filter((p) => p !== ctx.karakas[0].planet);
}
/** Planets in the nth house from a rasi sign, or aspecting it by rasi drishti when `aspect` is set. */
function rasiHouse(ctx: JaiminiContext, sign: number, n: number, aspect = false): Planet[] {
  const target = (sign + n - 1) % 12;
  return ctx.positions.filter((p) => p.signIndex === target || (aspect && rasiAspects(p.signIndex, target))).map((p) => p.planet);
}
function has(list: Planet[], ...ps: Planet[]) {
  return ps.every((p) => list.includes(p));
}
function nonEmpty(list: Planet[]): Planet[] | null {
  return list.length ? list : null;
}
function AL(ctx: JaiminiContext) {
  return ctx.arudhas[0].signIndex;
}
function UL(ctx: JaiminiContext) {
  return ctx.arudhas[11].signIndex;
}

const KARAKAMSA_PLANET: Array<{ planet: Planet; text: string; sutra: string }> = [
  { planet: "Sun", text: "Sun in the Karakamsa: work in government or public service; the self is expressed through authority.", sutra: "1.2.14" },
  { planet: "Moon", text: "Moon in the Karakamsa: a comfortable life earned through learning; with Venus this becomes marked.", sutra: "1.2.15" },
  { planet: "Mars", text: "Mars in the Karakamsa: work with metals, chemistry, weapons or fire; an engineering or martial bent.", sutra: "1.2.16" },
  { planet: "Mercury", text: "Mercury in the Karakamsa: trade, crafts, textiles or skill in law and negotiation.", sutra: "1.2.17" },
  { planet: "Jupiter", text: "Jupiter in the Karakamsa: devotion to ritual and knowledge; a teacher or scholar of tradition.", sutra: "1.2.18" },
  { planet: "Venus", text: "Venus in the Karakamsa: service to the powerful, a romantic nature and a long life.", sutra: "1.2.19" },
  { planet: "Saturn", text: "Saturn in the Karakamsa: a livelihood in a well-known, established profession.", sutra: "1.2.20" },
  { planet: "Rahu", text: "Rahu in the Karakamsa: skill with poisons and their cure (medicine, chemistry), machines, or a life at the edge of the law.", sutra: "1.2.21" },
  { planet: "Ketu", text: "Ketu in the Karakamsa: dealing in large animals or vehicles; a detached, sometimes secretive temperament.", sutra: "1.2.22" },
];

const KARAKAMSA_SIGN: string[] = [
  "Aries: trouble from small creatures such as rats and cats.",
  "Taurus: comfort from, or trouble with, four-footed animals.",
  "Gemini: itching skin complaints and a tendency to put on weight.",
  "Cancer: troubles from water, and skin disease.",
  "Leo: danger from wild animals and dogs.",
  "Virgo: as Gemini, and burns from fire or sparks.",
  "Libra: a livelihood by trade.",
  "Scorpio: danger from water creatures; loss of the mother's milk in infancy.",
  "Sagittarius: falls from vehicles or heights.",
  "Capricorn: trouble from aquatic creatures and birds; wounds and swellings.",
  "Aquarius: one who builds tanks, wells and public works.",
  "Pisces: steadfast in dharma; a chart pointed at liberation.",
];

const DEITY: Array<{ planets: Planet[]; text: string; sutra: string }> = [
  { planets: ["Sun"], text: "Shiva", sutra: "1.2.72" },
  { planets: ["Ketu"], text: "Ganesha or Skanda", sutra: "1.2.79" },
  { planets: ["Moon"], text: "Gauri", sutra: "1.2.73" },
  { planets: ["Venus"], text: "Lakshmi", sutra: "1.2.74" },
  { planets: ["Mars"], text: "Skanda", sutra: "1.2.75" },
  { planets: ["Mercury"], text: "Vishnu", sutra: "1.2.76" },
  { planets: ["Saturn"], text: "Vishnu", sutra: "1.2.76" },
  { planets: ["Jupiter"], text: "Shiva with Uma (Samba-Shiva)", sutra: "1.2.77" },
  { planets: ["Rahu"], text: "Durga", sutra: "1.2.78" },
];

export const JAIMINI_RULES: JaiminiRule[] = [
  // ── Karakas ──
  {
    id: "jk-ak-sign",
    group: "karakamsa",
    chart: "navamsa",
    when: "Atmakaraka's navamsa sign (the Karakamsa)",
    text: "Karakamsa sign indication (Jaimini 1.2.2-13): see finding text.",
    weight: 1,
    source: JS("1.2.2-13"),
    test: (ctx) => [ctx.karakas[0].planet],
  },
  {
    id: "jk-ak-amk-together",
    group: "karaka",
    chart: "rasi",
    when: "Atmakaraka and Amatyakaraka in the same sign or in mutual rasi aspect",
    text: "The soul's purpose and the career act together: a chart where work becomes the self's vehicle (raja yoga of the karakas).",
    weight: 2,
    source: { label: "Moonketu, chara karakas", url: "https://moonketu.com/learn/jaimini/jaimini-chara-dasha" },
    test: (ctx) => {
      const ak = pos(ctx, ctx.karakas[0].planet);
      const amk = pos(ctx, ctx.karakas[1].planet);
      return ak.signIndex === amk.signIndex || rasiAspects(ak.signIndex, amk.signIndex) ? [ak.planet, amk.planet] : null;
    },
  },
  // ── Karakamsa: planets in it ──
  ...KARAKAMSA_PLANET.map<JaiminiRule>(({ planet, text, sutra }) => ({
    id: `jks-${planet.toLowerCase()}`,
    group: "karakamsa",
    chart: "navamsa",
    when: `${planet} in the Karakamsa (navamsa)`,
    text,
    weight: 2,
    source: JS(sutra),
    test: (ctx) => (planet === ctx.karakas[0].planet ? null : nonEmpty(d9House(ctx, 1).filter((p) => p === planet))),
  })),
  {
    id: "jks-sun-rahu",
    group: "karakamsa",
    chart: "navamsa",
    when: "Sun and Rahu together in the Karakamsa",
    text: "Sun with Rahu in the Karakamsa: danger from snakes or poison; a benefic aspect on the Karakamsa averts it, and a benefic-only connection makes a healer of poisons.",
    weight: 2,
    source: JS("1.2.23-25"),
    test: (ctx) => (has(d9House(ctx, 1), "Sun", "Rahu") ? ["Sun", "Rahu"] : null),
  },
  {
    id: "jks-author",
    group: "karakamsa",
    chart: "navamsa",
    when: "Moon and Jupiter in the Karakamsa or in the 5th from it",
    text: "Moon and Jupiter in the Karakamsa or its 5th: an author of books.",
    weight: 2,
    source: JS("1.2.102"),
    test: (ctx) => {
      const k = d9House(ctx, 1);
      const f = d9House(ctx, 5);
      return has(k, "Moon", "Jupiter") || has(f, "Moon", "Jupiter") ? ["Moon", "Jupiter"] : null;
    },
  },
  {
    id: "jks-5th-venus",
    group: "karakamsa",
    chart: "navamsa",
    when: "Venus in the Karakamsa or the 5th from it",
    text: "Venus in the Karakamsa or its 5th: a poet, eloquent, a connoisseur of literature.",
    weight: 1,
    source: JS("1.2.105"),
    test: (ctx) => nonEmpty(d9House15(ctx).filter((p) => p === "Venus")),
  },
  {
    id: "jks-5th-jupiter",
    group: "karakamsa",
    chart: "navamsa",
    when: "Jupiter in the Karakamsa or the 5th from it",
    text: "Jupiter in the Karakamsa or its 5th: broad learning, well-versed in books, a grammarian or knower of scripture.",
    weight: 1,
    source: JS("1.2.106-108"),
    test: (ctx) => nonEmpty(d9House15(ctx).filter((p) => p === "Jupiter")),
  },
  {
    id: "jks-5th-mercury",
    group: "karakamsa",
    chart: "navamsa",
    when: "Mercury in the Karakamsa or the 5th from it",
    text: "Mercury in the Karakamsa or its 5th: a scholar of interpretation and analysis (Mimamsa).",
    weight: 1,
    source: JS("1.2.110"),
    test: (ctx) => nonEmpty(d9House15(ctx).filter((p) => p === "Mercury")),
  },
  {
    id: "jks-5th-mars",
    group: "karakamsa",
    chart: "navamsa",
    when: "Mars in the Karakamsa or the 5th from it",
    text: "Mars in the Karakamsa or its 5th: a logician, sharp in argument.",
    weight: 1,
    source: JS("1.2.111"),
    test: (ctx) => nonEmpty(d9House15(ctx).filter((p) => p === "Mars")),
  },
  {
    id: "jks-5th-moon",
    group: "karakamsa",
    chart: "navamsa",
    when: "Moon in the Karakamsa or the 5th from it",
    text: "Moon in the Karakamsa or its 5th: versed in Sankhya and Yoga, in literature, and a singer.",
    weight: 1,
    source: JS("1.2.112"),
    test: (ctx) => nonEmpty(d9House15(ctx).filter((p) => p === "Moon")),
  },
  {
    id: "jks-5th-sun",
    group: "karakamsa",
    chart: "navamsa",
    when: "Sun in the Karakamsa or the 5th from it",
    text: "Sun in the Karakamsa or its 5th: a knower of Vedanta and of music.",
    weight: 1,
    source: JS("1.2.113"),
    test: (ctx) => nonEmpty(d9House15(ctx).filter((p) => p === "Sun")),
  },
  {
    id: "jks-5th-ketu",
    group: "karakamsa",
    chart: "navamsa",
    when: "Ketu in the Karakamsa or the 5th from it",
    text: "Ketu in the Karakamsa or its 5th: a mathematician.",
    weight: 1,
    source: JS("1.2.114"),
    test: (ctx) => nonEmpty(d9House15(ctx).filter((p) => p === "Ketu")),
  },
  {
    id: "jks-5th-saturn",
    group: "karakamsa",
    chart: "navamsa",
    when: "Saturn in the Karakamsa or the 5th from it",
    text: "Saturn in the Karakamsa or its 5th: slow to speak in an assembly.",
    weight: 1,
    source: JS("1.2.109"),
    test: (ctx) => nonEmpty(d9House15(ctx).filter((p) => p === "Saturn")),
  },
  {
    id: "jks-3rd-malefic",
    group: "karakamsa",
    chart: "navamsa",
    when: "a malefic in the 3rd from the Karakamsa",
    text: "Malefic in the 3rd from the Karakamsa: brave, willing to fight.",
    weight: 1,
    source: JS("1.2.64"),
    test: (ctx) => nonEmpty(d9House(ctx, 3).filter((p) => MALEFIC.has(p))),
  },
  {
    id: "jks-3rd-benefic",
    group: "karakamsa",
    chart: "navamsa",
    when: "a benefic in the 3rd from the Karakamsa",
    text: "Benefic in the 3rd from the Karakamsa: gentle, avoids confrontation.",
    weight: 1,
    source: JS("1.2.65"),
    test: (ctx) => nonEmpty(d9House(ctx, 3).filter((p) => p === "Jupiter" || p === "Venus" || p === "Mercury")),
  },
  {
    id: "jks-4th-moon-venus",
    group: "karakamsa",
    chart: "navamsa",
    when: "Moon and Venus in the 4th from the Karakamsa",
    text: "Moon and Venus in the 4th from the Karakamsa: a fine, palatial dwelling.",
    weight: 1,
    source: JS("1.2.42"),
    test: (ctx) => (has(d9House(ctx, 4), "Moon", "Venus") ? ["Moon", "Venus"] : null),
  },
  {
    id: "jks-4th-material",
    group: "karakamsa",
    chart: "navamsa",
    when: "Rahu and Saturn, Mars and Ketu, Jupiter, or Sun in the 4th from the Karakamsa",
    text: "4th from the Karakamsa shows the house one lives in: Rahu and Saturn stone, Mars and Ketu brick, Jupiter wood, Sun thatch.",
    weight: 1,
    source: JS("1.2.44-47"),
    test: (ctx) => {
      const h = d9House(ctx, 4);
      if (has(h, "Rahu", "Saturn")) return ["Rahu", "Saturn"];
      if (has(h, "Mars", "Ketu")) return ["Mars", "Ketu"];
      return nonEmpty(h.filter((p) => p === "Jupiter" || p === "Sun"));
    },
  },
  {
    id: "jks-9th-benefic",
    group: "karakamsa",
    chart: "navamsa",
    when: "a benefic in or aspecting the 9th from the Karakamsa",
    text: "Benefics on the 9th from the Karakamsa: steadfast in dharma, truthful, devoted to elders and teachers.",
    weight: 2,
    source: JS("1.2.48"),
    test: (ctx) => {
      const t = (ctx.karakamsa + 8) % 12;
      return nonEmpty(ctx.navamsa.filter((p) => (p.signIndex === t || rasiAspects(p.signIndex, t)) && (p.planet === "Jupiter" || p.planet === "Venus" || p.planet === "Mercury")).map((p) => p.planet));
    },
  },
  {
    id: "jks-9th-malefic",
    group: "karakamsa",
    chart: "navamsa",
    when: "only malefics in the 9th from the Karakamsa",
    text: "Malefics alone on the 9th from the Karakamsa: a strained relation with teachers and tradition; with Saturn and Rahu, a break with the guru.",
    weight: 2,
    source: JS("1.2.49-50"),
    test: (ctx) => {
      const h = d9House(ctx, 9);
      return h.length && h.every((p) => MALEFIC.has(p)) ? h : null;
    },
  },
  {
    id: "jks-7th-spouse",
    group: "karakamsa",
    chart: "navamsa",
    when: "planets in the 7th from the Karakamsa",
    text: "7th from the Karakamsa describes the spouse: Moon and Jupiter beautiful; Rahu previously widowed or from afar; Saturn older, ascetic or of delicate health; Mars a physical mark; Sun protective of their own family; Mercury artistic.",
    weight: 2,
    source: JS("1.2.57-62"),
    test: (ctx) => nonEmpty(d9House(ctx, 7).filter((p) => p !== "Venus" && p !== "Ketu")),
  },
  {
    id: "jks-12th-benefic",
    group: "karakamsa",
    chart: "navamsa",
    when: "a benefic in the 12th from the Karakamsa",
    text: "Benefic in the 12th from the Karakamsa: a good passage after death; the spiritual life is well supported.",
    weight: 1,
    source: JS("1.2.68"),
    test: (ctx) => nonEmpty(d9House(ctx, 12).filter((p) => p === "Jupiter" || p === "Venus" || p === "Mercury")),
  },
  {
    id: "jks-12th-ketu",
    group: "karakamsa",
    chart: "navamsa",
    when: "Ketu in the 12th from the Karakamsa",
    text: "Ketu in the 12th from the Karakamsa: the chart points at liberation (moksha), especially in Aries or Sagittarius.",
    weight: 2,
    source: JS("1.2.69-70"),
    test: (ctx) => nonEmpty(d9House(ctx, 12).filter((p) => p === "Ketu")),
  },
  {
    id: "jks-12th-deity",
    group: "karakamsa",
    chart: "navamsa",
    when: "planets in the 12th from the Karakamsa",
    text: "Ishta devata, the form of the divine the native turns to, is shown by the 12th from the Karakamsa.",
    weight: 1,
    source: JS("1.2.72-79"),
    test: (ctx) => nonEmpty(d9House(ctx, 12)),
  },
  {
    id: "jks-2nd-ketu",
    group: "karakamsa",
    chart: "navamsa",
    when: "Ketu in the 2nd from the Karakamsa with a malefic aspect",
    text: "Ketu in the 2nd from the Karakamsa under malefic aspect: halting or unusual speech.",
    weight: 1,
    source: JS("1.2.118"),
    test: (ctx) => {
      const t = (ctx.karakamsa + 1) % 12;
      const ketu = ctx.navamsa.find((p) => p.planet === "Ketu")!;
      if (ketu.signIndex !== t) return null;
      const mal = ctx.navamsa.filter((p) => MALEFIC.has(p.planet) && p.planet !== "Ketu" && rasiAspects(p.signIndex, t)).map((p) => p.planet);
      return mal.length ? ["Ketu", ...mal] : null;
    },
  },
  // ── Arudha lagna ──
  {
    id: "ja-al-occupant",
    group: "arudha",
    chart: "rasi",
    when: "Mercury, Jupiter or Venus in the Arudha lagna",
    text: "Planet in the Arudha lagna colours the public image: Mercury a leader of people, Jupiter a person of knowledge, Venus a speaker or poet.",
    weight: 2,
    source: BPHS30("30.39"),
    test: (ctx) => nonEmpty(rasiHouse(ctx, AL(ctx), 1).filter((p) => p === "Mercury" || p === "Jupiter" || p === "Venus")),
  },
  {
    id: "ja-al-2nd-benefic",
    group: "arudha",
    chart: "rasi",
    when: "a benefic in the 2nd from the Arudha lagna",
    text: "Benefic in the 2nd from the Arudha lagna: wealth of every kind and a sharp intelligence.",
    weight: 2,
    source: BPHS30("30.40"),
    test: (ctx) => {
      const b = benefics(ctx);
      return nonEmpty(rasiHouse(ctx, AL(ctx), 2).filter((p) => b.has(p)));
    },
  },
  {
    id: "ja-al-11th",
    group: "arudha",
    chart: "rasi",
    when: "planets in or aspecting the 11th from the Arudha lagna",
    text: "Planets influencing the 11th from the Arudha lagna are the sources of income: benefics by fair means, malefics by harder or questionable ones. More planets, more gain.",
    weight: 2,
    source: BPHS29("29.8-11, Jaimini 1.3.2-5"),
    test: (ctx) => nonEmpty(rasiHouse(ctx, AL(ctx), 11, true)),
  },
  {
    id: "ja-al-12th",
    group: "arudha",
    chart: "rasi",
    when: "planets in or aspecting the 12th from the Arudha lagna",
    text: "Planets influencing the 12th from the Arudha lagna show where money goes; if more planets touch the 12th than the 11th, spending outruns income.",
    weight: 2,
    source: BPHS29("29.12, 29.22"),
    test: (ctx) => nonEmpty(rasiHouse(ctx, AL(ctx), 12, true)),
  },
  {
    id: "ja-al-rahu-7-12",
    group: "arudha",
    chart: "rasi",
    when: "Rahu in the 7th or 12th from the Arudha lagna, or aspecting them",
    text: "Rahu on the 7th or 12th from the Arudha lagna: spiritual knowledge and good fortune.",
    weight: 1,
    source: BPHS30("30.38"),
    test: (ctx) => {
      const al = AL(ctx);
      const r = pos(ctx, "Rahu").signIndex;
      const h7 = (al + 6) % 12;
      const h12 = (al + 11) % 12;
      return r === h7 || r === h12 || rasiAspects(r, h7) || rasiAspects(r, h12) ? ["Rahu"] : null;
    },
  },
  {
    id: "ja-al-3-11-nodes-saturn",
    group: "arudha",
    chart: "rasi",
    when: "Saturn or Rahu in the 3rd or 11th from the Arudha lagna",
    text: "Saturn or Rahu in the 3rd or 11th from the Arudha lagna: loss or estrangement among siblings (3rd younger, 11th elder).",
    weight: 1,
    source: BPHS30("30.31"),
    test: (ctx) => nonEmpty([...rasiHouse(ctx, AL(ctx), 3), ...rasiHouse(ctx, AL(ctx), 11)].filter((p) => p === "Saturn" || p === "Rahu")),
  },
  {
    id: "ja-al-3-11-benefic",
    group: "arudha",
    chart: "rasi",
    when: "Moon, Jupiter, Mercury or Mars in the 3rd or 11th from the Arudha lagna",
    text: "Moon, Jupiter, Mercury or Mars in the 3rd or 11th from the Arudha lagna: many capable siblings.",
    weight: 1,
    source: BPHS30("30.33-36"),
    test: (ctx) => nonEmpty([...rasiHouse(ctx, AL(ctx), 3), ...rasiHouse(ctx, AL(ctx), 11)].filter((p) => p === "Moon" || p === "Jupiter" || p === "Mercury" || p === "Mars")),
  },
  {
    id: "ja-al-6th-malefic",
    group: "arudha",
    chart: "rasi",
    when: "a malefic alone in the 6th from the Arudha lagna, no benefic with it or aspecting",
    text: "Unrelieved malefic in the 6th from the Arudha lagna: a reputation for sharp practice; rivals are dealt with harshly.",
    weight: 1,
    source: BPHS30("30.37"),
    test: (ctx) => {
      const al = AL(ctx);
      const t = (al + 5) % 12;
      const occ = rasiHouse(ctx, al, 6);
      const b = benefics(ctx);
      if (!occ.length || !occ.every((p) => MALEFIC.has(p))) return null;
      const relief = ctx.positions.some((p) => b.has(p.planet) && rasiAspects(p.signIndex, t));
      return relief ? null : occ;
    },
  },
  {
    id: "ja-kemadruma",
    group: "arudha",
    chart: "rasi",
    when: "malefics in both the 2nd and the 8th from the Arudha lagna",
    text: "Malefics in the 2nd and 8th from the Arudha lagna: Kemadruma, a period of want that the native must work through.",
    weight: 2,
    source: JS("1.2.119"),
    test: (ctx) => {
      const m = malefics(ctx);
      const a = rasiHouse(ctx, AL(ctx), 2).filter((p) => m.has(p));
      const b = rasiHouse(ctx, AL(ctx), 8).filter((p) => m.has(p));
      return a.length && b.length ? [...a, ...b] : null;
    },
  },
  // ── Upapada ──
  {
    id: "ju-ul-benefic",
    group: "upapada",
    chart: "rasi",
    when: "a benefic in or aspecting the Upapada",
    text: "Benefic on the Upapada: full happiness from the spouse and children.",
    weight: 3,
    source: BPHS30("30.1-6"),
    test: (ctx) => {
      const b = benefics(ctx);
      return nonEmpty(rasiHouse(ctx, UL(ctx), 1, true).filter((p) => b.has(p)));
    },
  },
  {
    id: "ju-ul-malefic",
    group: "upapada",
    chart: "rasi",
    when: "the Upapada in a malefic's sign or with a malefic, and no benefic on it",
    text: "Malefic Upapada without benefic relief: a tendency to renounce or delay marriage, or a marriage kept at a distance.",
    weight: 3,
    source: BPHS30("30.1-6"),
    test: (ctx) => {
      const ul = UL(ctx);
      const b = benefics(ctx);
      const m = malefics(ctx);
      const occ = rasiHouse(ctx, ul, 1, true);
      if (occ.some((p) => b.has(p))) return null;
      const bad = occ.filter((p) => m.has(p));
      if (bad.length) return bad;
      // Upapada in a malefic's sign with nothing benefic on it
      const lord = SIGN_LORD[ul];
      return MALEFIC.has(lord) ? [lord] : null;
    },
  },
  {
    id: "ju-ul-lord-exalted",
    group: "upapada",
    chart: "rasi",
    when: "the lord of the Upapada exalted",
    text: "Upapada lord exalted: a spouse from a respected family.",
    weight: 2,
    source: BPHS30("30.13-15"),
    test: (ctx) => {
      const l = pos(ctx, SIGN_LORD[UL(ctx)]);
      return l.dignity === "Exalted" ? [l.planet] : null;
    },
  },
  {
    id: "ju-ul-lord-debilitated",
    group: "upapada",
    chart: "rasi",
    when: "the lord of the Upapada debilitated",
    text: "Upapada lord debilitated: the spouse's background is modest or contested.",
    weight: 2,
    source: BPHS30("30.13-15"),
    test: (ctx) => {
      const l = pos(ctx, SIGN_LORD[UL(ctx)]);
      return l.dignity === "Debilitated" ? [l.planet] : null;
    },
  },
  {
    id: "ju-2nd-benefic",
    group: "upapada",
    chart: "rasi",
    when: "a benefic in or aspecting the 2nd from the Upapada",
    text: "Benefic on the 2nd from the Upapada: the marriage endures; a fortunate and graceful spouse.",
    weight: 2,
    source: BPHS30("30.7-15"),
    test: (ctx) => {
      const b = benefics(ctx);
      return nonEmpty(rasiHouse(ctx, UL(ctx), 2, true).filter((p) => b.has(p)));
    },
  },
  {
    id: "ju-2nd-afflicted",
    group: "upapada",
    chart: "rasi",
    when: "a planet in the 2nd from the Upapada debilitated or joined by a malefic",
    text: "Afflicted 2nd from the Upapada: strain in the marriage, separation or loss of the spouse, unless a benefic also touches it.",
    weight: 3,
    source: BPHS30("30.7-12"),
    test: (ctx) => {
      const ul = UL(ctx);
      const occ = ctx.positions.filter((p) => p.signIndex === (ul + 1) % 12);
      if (!occ.length) return null;
      const m = malefics(ctx);
      const hit = occ.filter((p) => p.dignity === "Debilitated" || m.has(p.planet)).map((p) => p.planet);
      return hit.length ? hit : null;
    },
  },
  {
    id: "ju-2nd-exalted",
    group: "upapada",
    chart: "rasi",
    when: "a planet exalted in the 2nd from the Upapada",
    text: "Exalted planet in the 2nd from the Upapada: a charming, virtuous spouse; more than one strong attachment in life.",
    weight: 2,
    source: BPHS30("30.7-12"),
    test: (ctx) => nonEmpty(ctx.positions.filter((p) => p.signIndex === (UL(ctx) + 1) % 12 && p.dignity === "Exalted").map((p) => p.planet)),
  },
  {
    id: "ju-2nd-gemini",
    group: "upapada",
    chart: "rasi",
    when: "Gemini is the 2nd from the Upapada",
    text: "Gemini in the 2nd from the Upapada: more than one marriage or partnership is possible.",
    weight: 1,
    source: BPHS30("30.7-12"),
    test: (ctx) => ((UL(ctx) + 1) % 12 === 2 ? [] : null),
  },
  {
    id: "ju-2nd-saturn-rahu",
    group: "upapada",
    chart: "rasi",
    when: "Saturn and Rahu together in the 2nd from the Upapada",
    text: "Saturn and Rahu in the 2nd from the Upapada: loss of the spouse through slander or bereavement; guard the marriage.",
    weight: 3,
    source: BPHS30("30.16"),
    test: (ctx) => (has(rasiHouse(ctx, UL(ctx), 2), "Saturn", "Rahu") ? ["Saturn", "Rahu"] : null),
  },
  {
    id: "ju-2nd-venus-ketu",
    group: "upapada",
    chart: "rasi",
    when: "Venus and Ketu together in the 2nd from the Upapada",
    text: "Venus and Ketu in the 2nd from the Upapada: the spouse's health, especially the blood, needs care.",
    weight: 2,
    source: BPHS30("30.17"),
    test: (ctx) => (has(rasiHouse(ctx, UL(ctx), 2), "Venus", "Ketu") ? ["Venus", "Ketu"] : null),
  },
  {
    id: "ju-own-lord",
    group: "upapada",
    chart: "rasi",
    when: "the Upapada or the 2nd from it holds its own lord",
    text: "Own lord in the Upapada or its 2nd: the spouse lives long; the marriage lasts into old age.",
    weight: 2,
    source: BPHS30("30.7-12"),
    test: (ctx) => {
      const ul = UL(ctx);
      const hits: Planet[] = [];
      for (const s of [ul, (ul + 1) % 12]) {
        const l = pos(ctx, SIGN_LORD[s]);
        if (l.signIndex === s) hits.push(l.planet);
      }
      return nonEmpty(hits);
    },
  },
];

JAIMINI_RULES.push(...SUTRA_RULES);

export const JAIMINI_RULE_INFO: JaiminiRuleInfo[] = JAIMINI_RULES.map(({ test: _t, ...rest }) => rest);

export function evaluateJaimini(ctx: JaiminiContext): JaiminiFinding[] {
  const out: JaiminiFinding[] = [];
  for (const r of JAIMINI_RULES) {
    const planets = r.test(ctx);
    if (planets === null) continue;
    let text = sutraRuleText(r.id, planets, ctx) ?? r.text;
    if (r.id === "jk-ak-sign") text = `Karakamsa in ${KARAKAMSA_SIGN[ctx.karakamsa]}`;
    if (r.id === "jks-12th-deity") {
      const forms = DEITY.filter((d) => d.planets.every((p) => planets.includes(p))).map((d) => d.text);
      if (!forms.length) continue;
      text = `Ishta devata from the 12th of the Karakamsa (${planets.join(", ")}): ${Array.from(new Set(forms)).join("; ")}.`;
    }
    if (r.id === "jks-7th-spouse") {
      const glosses: Partial<Record<Planet, string>> = {
        Moon: "Moon: a beautiful, gentle spouse",
        Jupiter: "Jupiter: a wise, good-looking spouse",
        Rahu: "Rahu: a spouse from another culture or previously bereaved",
        Saturn: "Saturn: a spouse older, austere or of delicate health",
        Mars: "Mars: a spouse with a physical mark or a fiery temper",
        Sun: "Sun: a spouse protective of their own family",
        Mercury: "Mercury: a spouse skilled in the arts",
      };
      text = `7th from the Karakamsa describes the spouse. ${planets.map((p) => glosses[p]).filter(Boolean).join("; ")}.`;
    }
    out.push({ id: r.id, group: r.group, text, planets, weight: r.weight, source: r.source, chart: r.chart });
  }
  return out;
}

export const JAIMINI_GROUP_LABEL: Record<JaiminiRuleGroup, string> = {
  karaka: "Chara karakas",
  karakamsa: "Karakamsa (navamsa)",
  arudha: "Arudha lagna",
  upapada: "Upapada",
  dasha: "Chara dasha",
};

