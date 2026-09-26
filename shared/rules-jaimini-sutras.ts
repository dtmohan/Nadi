// Jaimini rules harvested from B. Suryanarain Rao's translation of the Jaimini Sutras (Adhyaya 1, padas 2-4).
// Karakamsa rules are read in the navamsa with rasi drishti; Arudha lagna and Upapada rules in the rasi chart.
// Wording is deliberately softened where the sutra is blunt; the sutra text itself is in the sutra library.

import { SIGNS, SIGN_LORD, dignityOf, houseFrom, type Planet, type PlanetPosition } from "./astro";
import { argalaOn, isBenefic, rasiAspects } from "./jaimini";
import type { JaiminiArea } from "./jaimini-areas";
import type { JaiminiContext, JaiminiRule, JaiminiSource } from "./rules-jaimini";

const JS = (n: string): JaiminiSource => ({ label: `Jaimini Sutras ${n}`, url: "https://vedichora.org/classical/jaimini-sutras", sutra: n });
/** Parashara's Arudha chapter (Padadhyaya), the classical commentary on Jaimini 1.3; `note` marks an extension of a verse rather than its letter. */
const BP29 = (n: string, note?: string): JaiminiSource => ({ label: `Parashara, Arudha chapter ${n}${note ? ` (${note})` : ""}`, url: "http://jyotishvidya.com/ch29.htm" });
const MALEFIC = new Set<Planet>(["Saturn", "Mars", "Rahu", "Ketu", "Sun"]);
const ODD = (sign: number) => sign % 2 === 0; // Aries = 0 is odd

function pos(ctx: JaiminiContext, p: Planet): PlanetPosition {
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
  return new Set(ctx.positions.filter((p) => !b.has(p.planet) && MALEFIC.has(p.planet)).map((p) => p.planet));
}
/** Planets occupying (or, with `aspect`, aspecting by rasi drishti) the nth house from `sign` in a chart. */
function influence(chart: { planet: Planet; signIndex: number }[], sign: number, n: number, aspect: boolean): Planet[] {
  const target = (sign + n - 1) % 12;
  return chart.filter((p) => p.signIndex === target || (aspect && rasiAspects(p.signIndex, target))).map((p) => p.planet);
}
const d9 = (ctx: JaiminiContext, n: number, aspect = false) => influence(ctx.navamsa, ctx.karakamsa, n, aspect);
const rasi = (ctx: JaiminiContext, sign: number, n: number, aspect = false) => influence(ctx.positions, sign, n, aspect);
const AL = (ctx: JaiminiContext) => ctx.arudhas[0].signIndex;
const UL = (ctx: JaiminiContext) => ctx.arudhas[11].signIndex;
const akSign = (ctx: JaiminiContext) => pos(ctx, ctx.karakas[0].planet).signIndex;
const nonEmpty = (l: Planet[]) => (l.length ? l : null);
const hasAll = (l: Planet[], ...ps: Planet[]) => ps.every((p) => l.includes(p));
const uniq = (l: Planet[]) => Array.from(new Set(l));
/** Planets giving unobstructed argala on `sign` (2nd, 4th, 11th primary; 5th secondary), the same reckoning as the Jaimini tab's argala table. */
const freeArgala = (ctx: JaiminiContext, sign: number): Planet[] => uniq(argalaOn(sign, ctx.positions).filter((a) => !a.obstructed).flatMap((a) => a.planets));

/** Life area for each rule in this file, merged into AREA_OF_RULE. */
export const SUTRA_RULE_AREA: Record<string, JaiminiArea> = {};
function area<T extends { id: string }>(rule: T, a: JaiminiArea): T {
  SUTRA_RULE_AREA[rule.id] = a;
  return rule;
}

// ── 1.2: Karakamsa (navamsa) ─────────────────────────────────────────────────

const KETU_ASPECT_GLOSS: Array<{ planets: Planet[]; text: string; sutra: string }> = [
  { planets: ["Venus"], text: "Venus: one initiated into ritual or a formal spiritual practice (1.2.33)", sutra: "1.2.33" },
  { planets: ["Mercury", "Saturn"], text: "Mercury and Saturn: low vitality; energy needs guarding (1.2.34)", sutra: "1.2.34" },
  { planets: ["Venus", "Mercury"], text: "Venus and Mercury: a habit of repeating oneself in speech (1.2.35)", sutra: "1.2.35" },
  { planets: ["Saturn"], text: "Saturn: an ascetic bent, or a life spent in another's service (1.2.36)", sutra: "1.2.36" },
];

const FOURTH_SKILL: Partial<Record<Planet, string>> = {
  Saturn: "Saturn: skill with sharp instruments, surgery or arms (1.2.96)",
  Ketu: "Ketu: clocks, instruments and things that measure time (1.2.97)",
  Mercury: "Mercury: a yogic or renunciate discipline (1.2.98)",
  Rahu: "Rahu: machinery, metals and mechanical work (1.2.99)",
  Sun: "Sun: a living by the sword, armed or uniformed service (1.2.100)",
  Mars: "Mars: staffs, maces and the martial arts (1.2.101)",
};

export const SUTRA_RULES_KARAKAMSA: JaiminiRule[] = [
  area(
    {
      id: "jks-ketu-aspects",
      group: "karakamsa",
      chart: "navamsa",
      when: "Ketu in the Karakamsa, read by the planets aspecting it",
      text: "Ketu in the Karakamsa coloured by the aspects on it.",
      weight: 1,
      source: JS("1.2.32-36"),
      test: (ctx) => {
        const ketu = ctx.navamsa.find((p) => p.planet === "Ketu")!;
        if (ketu.signIndex !== ctx.karakamsa) return null;
        const asp = ctx.navamsa.filter((p) => p.planet !== "Ketu" && rasiAspects(p.signIndex, ctx.karakamsa)).map((p) => p.planet);
        const hits = KETU_ASPECT_GLOSS.filter((g) => g.planets.every((p) => asp.includes(p)));
        if (!hits.length && !asp.some((p) => MALEFIC.has(p))) return null;
        return uniq(["Ketu", ...asp]);
      },
    },
    "self",
  ),
  area(
    {
      id: "jks-sun-venus-aspect",
      group: "karakamsa",
      chart: "navamsa",
      when: "Sun and Venus both aspect the Karakamsa",
      text: "Sun and Venus aspecting the Karakamsa: work done for rulers, governments or powerful patrons.",
      weight: 1,
      source: JS("1.2.38"),
      test: (ctx) => {
        const asp = ctx.navamsa.filter((p) => p.signIndex !== ctx.karakamsa && rasiAspects(p.signIndex, ctx.karakamsa)).map((p) => p.planet);
        return hasAll(asp, "Sun", "Venus") ? ["Sun", "Venus"] : null;
      },
    },
    "career",
  ),
  area(
    {
      id: "jks-10th-benefic-aspect",
      group: "karakamsa",
      chart: "navamsa",
      when: "a benefic aspects the 10th from the Karakamsa",
      text: "Benefic aspect on the 10th from the Karakamsa: steady purpose in work, not capricious.",
      weight: 1,
      source: JS("1.2.40"),
      test: (ctx) => {
        const b = benefics(ctx);
        const t = (ctx.karakamsa + 9) % 12;
        return nonEmpty(ctx.navamsa.filter((p) => p.signIndex !== t && rasiAspects(p.signIndex, t) && b.has(p.planet)).map((p) => p.planet));
      },
    },
    "career",
  ),
  area(
    {
      id: "jks-10th-sun-jupiter",
      group: "karakamsa",
      chart: "navamsa",
      when: "Sun in the 10th from the Karakamsa aspected only by Jupiter",
      text: "Sun in the 10th from the Karakamsa with Jupiter's aspect alone: a living from land, cattle or the care of living things.",
      weight: 1,
      source: JS("1.2.41"),
      test: (ctx) => {
        const t = (ctx.karakamsa + 9) % 12;
        const sunD9 = ctx.navamsa.find((p) => p.planet === "Sun")!;
        if (sunD9.signIndex !== t) return null;
        const asp = ctx.navamsa.filter((p) => p.planet !== "Sun" && rasiAspects(p.signIndex, t)).map((p) => p.planet);
        return asp.length === 1 && asp[0] === "Jupiter" ? ["Sun", "Jupiter"] : null;
      },
    },
    "career",
  ),
  area(
    {
      id: "jks-malefic-sign-saturn-venus",
      group: "karakamsa",
      chart: "navamsa",
      when: "Saturn or Venus in a Karakamsa that falls in a malefic's sign",
      text: "Saturn or Venus in a Karakamsa ruled by a malefic: drawn to fierce deities, the occult or unorthodox worship.",
      weight: 1,
      source: JS("1.2.80-81"),
      test: (ctx) => {
        if (!MALEFIC.has(SIGN_LORD[ctx.karakamsa])) return null;
        return nonEmpty(d9(ctx, 1).filter((p) => (p === "Saturn" || p === "Venus") && p !== ctx.karakas[0].planet));
      },
    },
    "self",
  ),
  area(
    {
      id: "jks-5-9-malefics",
      group: "karakamsa",
      chart: "navamsa",
      when: "malefics in the 5th or 9th from the Karakamsa, read by the company they keep",
      text: "Malefics in the 5th or 9th from the Karakamsa: power over mantra and the unseen; with malefic company it is used to expel and bind, with benefic company to help others.",
      weight: 1,
      source: JS("1.2.84-85"),
      test: (ctx) => {
        const m = malefics(ctx);
        const hits = [...d9(ctx, 5), ...d9(ctx, 9)].filter((p) => m.has(p));
        return nonEmpty(uniq(hits));
      },
    },
    "self",
  ),
  area(
    {
      id: "jks-venus-karakamsa-moon",
      group: "karakamsa",
      chart: "navamsa",
      when: "Venus aspects both the Karakamsa and the Moon in the navamsa",
      text: "Venus aspecting the Karakamsa and the Moon: an alchemist's bent, chemistry, perfumes or the transformation of materials.",
      weight: 1,
      source: JS("1.2.86"),
      test: (ctx) => {
        const v = ctx.navamsa.find((p) => p.planet === "Venus")!;
        const moon = ctx.navamsa.find((p) => p.planet === "Moon")!;
        return rasiAspects(v.signIndex, ctx.karakamsa) && rasiAspects(v.signIndex, moon.signIndex) ? ["Venus", "Moon"] : null;
      },
    },
    "career",
  ),
  area(
    {
      id: "jks-mercury-karakamsa-moon",
      group: "karakamsa",
      chart: "navamsa",
      when: "Mercury aspects both the Karakamsa and the Moon in the navamsa",
      text: "Mercury aspecting the Karakamsa and the Moon: medicine, healing or diagnosis as a vocation.",
      weight: 1,
      source: JS("1.2.87"),
      test: (ctx) => {
        const me = ctx.navamsa.find((p) => p.planet === "Mercury")!;
        const moon = ctx.navamsa.find((p) => p.planet === "Moon")!;
        return rasiAspects(me.signIndex, ctx.karakamsa) && rasiAspects(me.signIndex, moon.signIndex) ? ["Mercury", "Moon"] : null;
      },
    },
    "career",
  ),
  area(
    {
      id: "jks-4th-moon-skin",
      group: "karakamsa",
      chart: "navamsa",
      when: "Moon in the 4th from the Karakamsa aspected by Venus or Mars",
      text: "Moon in the 4th from the Karakamsa under the aspect of Venus or Mars: the skin needs care (Venus: pigmentation; Mars: inflammatory skin conditions).",
      weight: 1,
      source: JS("1.2.88-89"),
      test: (ctx) => {
        const t = (ctx.karakamsa + 3) % 12;
        const moon = ctx.navamsa.find((p) => p.planet === "Moon")!;
        if (moon.signIndex !== t) return null;
        const asp = ctx.navamsa.filter((p) => (p.planet === "Venus" || p.planet === "Mars") && rasiAspects(p.signIndex, t)).map((p) => p.planet);
        return asp.length ? ["Moon", ...asp] : null;
      },
    },
    "health",
  ),
  area(
    {
      id: "jks-4-5-health",
      group: "karakamsa",
      chart: "navamsa",
      when: "Mars, Rahu or Ketu in the 4th or 5th from the Karakamsa",
      text: "Health themes from the 4th and 5th of the Karakamsa.",
      weight: 1,
      source: JS("1.2.91-94"),
      test: (ctx) => {
        const hits = [...d9(ctx, 4), ...d9(ctx, 5)].filter((p) => p === "Mars" || p === "Rahu" || p === "Ketu");
        return nonEmpty(uniq(hits));
      },
    },
    "health",
  ),
  area(
    {
      id: "jks-4th-skill",
      group: "karakamsa",
      chart: "navamsa",
      when: "Saturn, Ketu, Mercury, Rahu, Sun or Mars in the 4th from the Karakamsa",
      text: "Skills shown by the 4th from the Karakamsa.",
      weight: 1,
      source: JS("1.2.96-101"),
      test: (ctx) => nonEmpty(d9(ctx, 4).filter((p) => FOURTH_SKILL[p] !== undefined)),
    },
    "career",
  ),
];

// ── 1.3: Arudha lagna and raja yogas (rasi chart) ─────────────────────────────

const SOURCE_GLOSS: Array<{ planets: Planet[]; text: string }> = [
  { planets: ["Sun"], text: "Sun: the state, authority and official dues" },
  { planets: ["Rahu"], text: "Rahu: penalties, foreigners and unconventional dealings" },
  { planets: ["Venus"], text: "Venus: patrons, luxuries and the pleasures of life" },
  { planets: ["Mercury"], text: "Mercury: relatives, cousins and litigation" },
  { planets: ["Jupiter"], text: "Jupiter: taxes, dues and the counsel of the learned" },
  { planets: ["Mars", "Saturn"], text: "Mars and Saturn: brothers and siblings" },
  { planets: ["Moon"], text: "Moon: the public, and a certainty to the outcome" },
];

/** Planets for which the sutras name a source (Mars and Saturn only as a pair). */
function glossed(planets: Planet[]): Planet[] {
  return planets.filter((p) => SOURCE_GLOSS.some((g) => g.planets.includes(p) && g.planets.every((q) => planets.includes(q))));
}

const PADA_SHORT = ["AL", "A2 wealth", "A3 siblings", "A4 home", "A5 children", "A6 rivals", "A7 marriage", "A8 longevity", "A9 fortune", "A10 career", "A11 gains", "UL"];

export const SUTRA_RULES_ARUDHA: JaiminiRule[] = [
  area(
    {
      id: "ja-al-12th-sources",
      group: "arudha",
      chart: "rasi",
      when: "planets in or aspecting the 12th from the Arudha lagna, read planet by planet",
      text: "Where money goes: sources of expense from the 12th of the Arudha lagna.",
      weight: 1,
      source: JS("1.3.7-12"),
      test: (ctx) => nonEmpty(glossed(uniq(rasi(ctx, AL(ctx), 12, true)))),
    },
    "wealth",
  ),
  area(
    {
      id: "ja-al-11th-sources",
      group: "arudha",
      chart: "rasi",
      when: "planets in or aspecting the 11th from the Arudha lagna, read planet by planet",
      text: "Where money comes from: sources of gain from the 11th of the Arudha lagna.",
      weight: 1,
      source: JS("1.3.12"),
      test: (ctx) => nonEmpty(glossed(uniq(rasi(ctx, AL(ctx), 11, true)))),
    },
    "wealth",
  ),
  area(
    {
      id: "ja-al-7th-nodes",
      group: "arudha",
      chart: "rasi",
      when: "Rahu or Ketu in or aspecting the 7th from the Arudha lagna",
      text: "Rahu or Ketu on the 7th from the Arudha lagna: the digestion needs attention.",
      weight: 1,
      source: JS("1.3.13"),
      test: (ctx) => nonEmpty(rasi(ctx, AL(ctx), 7, true).filter((p) => p === "Rahu" || p === "Ketu")),
    },
    "health",
  ),
  area(
    {
      id: "ja-al-2nd-ketu",
      group: "arudha",
      chart: "rasi",
      when: "Ketu in the 2nd from the Arudha lagna",
      text: "Ketu in the 2nd from the Arudha lagna: an older, more weathered appearance than the years.",
      weight: 1,
      source: JS("1.3.14"),
      test: (ctx) => (rasi(ctx, AL(ctx), 2).includes("Ketu") ? ["Ketu"] : null),
    },
    "self",
  ),
  area(
    {
      id: "ja-al-2nd-exalted",
      group: "arudha",
      chart: "rasi",
      when: "an exalted planet in the 2nd from the Arudha lagna",
      text: "Exalted planet in the 2nd from the Arudha lagna: wealth, whatever the planet's nature.",
      weight: 2,
      source: JS("1.3.16"),
      test: (ctx) => nonEmpty(rasi(ctx, AL(ctx), 2).filter((p) => dignityOf(p, pos(ctx, p).signIndex, pos(ctx, p).degInSign) === "Exalted")),
    },
    "wealth",
  ),
  area(
    {
      id: "ja-al-from-lagna",
      group: "arudha",
      chart: "rasi",
      when: "the Arudha lagna's house from the lagna",
      text: "Arudha lagna in a kendra or trikona from the lagna: standing and prosperity come easily; in the 6th, 8th or 12th the image struggles to match the self.",
      weight: 2,
      source: JS("1.3.18-19"),
      test: (ctx) => {
        const h = houseFrom(ctx.lagnaSign, AL(ctx));
        return [1, 4, 7, 10, 5, 9, 6, 8, 12].includes(h) ? [SIGN_LORD[AL(ctx)]] : null;
      },
    },
    "self",
  ),
  area(
    {
      id: "ja-a7-from-lagna",
      group: "arudha",
      chart: "rasi",
      when: "the Darapada (A7) in a kendra, trikona or upachaya from the lagna, other than the 6th",
      text: "Darapada in a kendra, trikona or upachaya from the lagna: agreement between the partners.",
      weight: 2,
      source: JS("1.3.20"),
      test: (ctx) => {
        const h = houseFrom(ctx.lagnaSign, ctx.arudhas[6].signIndex);
        return [1, 4, 7, 10, 5, 9, 3, 11].includes(h) ? [SIGN_LORD[ctx.arudhas[6].signIndex]] : null;
      },
    },
    "marriage",
  ),
  area(
    {
      id: "ja-padas-dusthana",
      group: "arudha",
      chart: "rasi",
      when: "any pada (A2-A11) in the 6th, 8th or 12th from the lagna",
      text: "Padas in the 6th, 8th or 12th from the lagna meet obstruction in their matters.",
      weight: 1,
      source: JS("1.3.21"),
      test: (ctx) => {
        const bad = ctx.arudhas.filter((a, i) => i > 0 && i < 11 && [6, 8, 12].includes(houseFrom(ctx.lagnaSign, a.signIndex)));
        return bad.length ? uniq(bad.map((a) => SIGN_LORD[a.signIndex])) : null;
      },
    },
    "self",
  ),
  area(
    {
      id: "ja-al-argala",
      group: "arudha",
      chart: "rasi",
      when: "argala on the Arudha lagna and its 7th",
      text: "Argala on the Arudha lagna and its 7th: unobstructed argala brings good fortune; benefic argala brings plenty.",
      weight: 2,
      source: JS("1.3.22-23"),
      test: (ctx) => {
        const b = benefics(ctx);
        const hits = uniq([...freeArgala(ctx, AL(ctx)), ...freeArgala(ctx, (AL(ctx) + 6) % 12)]);
        // 1.3.22 credits any unobstructed argala; 1.3.23 the benefic ones. Benefics are listed first.
        return nonEmpty([...hits.filter((p) => b.has(p)), ...hits.filter((p) => !b.has(p))]);
      },
    },
    "wealth",
  ),
  area(
    {
      id: "ja-three-lagnas",
      group: "arudha",
      chart: "rasi",
      when: "one planet aspects the lagna, the Hora lagna and the Ghatika lagna",
      text: "A planet aspecting the lagna, Hora lagna and Ghatika lagna together: authority and a leading position (Jaimini's raja yoga of the lagnas).",
      weight: 3,
      source: JS("1.3.24"),
      test: (ctx) => {
        if (ctx.horaLagna === undefined || ctx.ghatikaLagna === undefined) return null;
        const targets = [ctx.lagnaSign, ctx.horaLagna, ctx.ghatikaLagna];
        return nonEmpty(ctx.positions.filter((p) => targets.every((t) => p.signIndex === t || rasiAspects(p.signIndex, t))).map((p) => p.planet));
      },
    },
    "career",
  ),
  area(
    {
      id: "ja-venus-moon-vehicles",
      group: "arudha",
      chart: "rasi",
      when: "Venus and Moon in mutual rasi aspect, or in the 3rd from each other",
      text: "Venus and Moon in mutual aspect or the 3rd from each other: vehicles and comforts.",
      weight: 1,
      source: JS("1.3.28"),
      test: (ctx) => {
        const v = pos(ctx, "Venus").signIndex;
        const m = pos(ctx, "Moon").signIndex;
        const third = houseFrom(v, m) === 3 || houseFrom(m, v) === 3;
        return rasiAspects(v, m) || third ? ["Venus", "Moon"] : null;
      },
    },
    "wealth",
  ),
  area(
    {
      id: "ja-ak-2-4-5-benefics",
      group: "arudha",
      chart: "rasi",
      when: "benefics in the 2nd, 4th and 5th from the Atmakaraka's sign",
      text: "Benefics in the 2nd, 4th and 5th from the Atmakaraka: a position of rank and command.",
      weight: 2,
      source: JS("1.3.30"),
      test: (ctx) => {
        const b = benefics(ctx);
        const s = akSign(ctx);
        const hits = [2, 4, 5].map((h) => rasi(ctx, s, h).filter((p) => b.has(p)));
        return hits.every((h) => h.length) ? uniq(hits.flat()) : null;
      },
    },
    "career",
  ),
  area(
    {
      id: "ja-ak-3-6-malefics",
      group: "arudha",
      chart: "rasi",
      when: "malefics in both the 3rd and 6th from the Atmakaraka's sign",
      text: "Malefics in the 3rd and 6th from the Atmakaraka: the drive and combativeness of a raja yoga.",
      weight: 2,
      source: JS("1.3.31"),
      test: (ctx) => {
        const m = malefics(ctx);
        const s = akSign(ctx);
        const a = rasi(ctx, s, 3).filter((p) => m.has(p));
        const c = rasi(ctx, s, 6).filter((p) => m.has(p));
        return a.length && c.length ? uniq([...a, ...c]) : null;
      },
    },
    "career",
  ),
  area(
    {
      id: "ja-lord-5th-benefics",
      group: "arudha",
      chart: "rasi",
      when: "Jupiter, Venus or Moon in the 5th from the lagna lord or the 7th lord",
      text: "Jupiter, Venus or Moon in the 5th from the lagna lord or the 7th lord: high office and influence in public affairs.",
      weight: 2,
      source: JS("1.3.35"),
      test: (ctx) => {
        const lords = uniq([SIGN_LORD[ctx.lagnaSign], SIGN_LORD[(ctx.lagnaSign + 6) % 12]]);
        const hits = lords.flatMap((l) => rasi(ctx, pos(ctx, l).signIndex, 5).filter((p) => p === "Jupiter" || p === "Venus" || p === "Moon"));
        return nonEmpty(uniq(hits));
      },
    },
    "career",
  ),
  area(
    {
      id: "ja-lord-3-6-malefics",
      group: "arudha",
      chart: "rasi",
      when: "malefics in both the 3rd and 6th from the lagna lord or from the 7th lord",
      text: "Malefics in the 3rd and 6th from the lagna lord or 7th lord: command over others; leadership in forces, security or competition.",
      weight: 1,
      source: JS("1.3.36"),
      test: (ctx) => {
        const m = malefics(ctx);
        const lords = uniq([SIGN_LORD[ctx.lagnaSign], SIGN_LORD[(ctx.lagnaSign + 6) % 12]]);
        for (const l of lords) {
          const s = pos(ctx, l).signIndex;
          const a = rasi(ctx, s, 3).filter((p) => m.has(p));
          const c = rasi(ctx, s, 6).filter((p) => m.has(p));
          if (a.length && c.length) return uniq([...a, ...c]);
        }
        return null;
      },
    },
    "career",
  ),
  area(
    {
      id: "ja-lords-aspect-lagnas",
      group: "arudha",
      chart: "rasi",
      when: "the lord of the 4th, 8th or 12th aspects both the lagna and the Atmakaraka's sign; or the lagna lord aspects the lagna and the Karaka-lagna lord aspects the Atmakaraka's sign",
      text: "Lords aspecting the lagna and the Atmakaraka's sign together.",
      weight: 1,
      source: JS("1.3.38-41"),
      test: (ctx) => {
        const L = ctx.lagnaSign;
        const K = akSign(ctx);
        const both = (p: Planet) => {
          const s = pos(ctx, p).signIndex;
          return (s === L || rasiAspects(s, L)) && (s === K || rasiAspects(s, K));
        };
        const hits: Planet[] = [];
        for (const h of [4, 8, 12]) {
          const lord = SIGN_LORD[(L + h - 1) % 12];
          if (both(lord)) hits.push(lord);
        }
        const ll = SIGN_LORD[L];
        const kl = SIGN_LORD[K];
        const lls = pos(ctx, ll).signIndex;
        const kls = pos(ctx, kl).signIndex;
        if ((lls === L || rasiAspects(lls, L)) && (kls === K || rasiAspects(kls, K))) hits.push(ll, kl);
        return nonEmpty(uniq(hits));
      },
    },
    "self",
  ),
  area(
    {
      id: "ja-bandhana",
      group: "arudha",
      chart: "rasi",
      when: "equal numbers of planets in the 2nd and 12th, 5th and 9th, 6th and 12th, or 4th and 10th from the lagna",
      text: "Bandhana yoga: equal numbers of planets in opposing pairs of houses (2/12, 5/9, 6/12, 4/10) point to periods of confinement or restricted freedom of movement.",
      weight: 1,
      source: JS("1.3.42"),
      test: (ctx) => {
        const hits: Planet[] = [];
        for (const [a, b] of [
          [2, 12],
          [5, 9],
          [6, 12],
          [4, 10],
        ]) {
          const pa = rasi(ctx, ctx.lagnaSign, a);
          const pb = rasi(ctx, ctx.lagnaSign, b);
          if (pa.length && pa.length === pb.length) hits.push(...pa, ...pb);
        }
        return nonEmpty(uniq(hits));
      },
    },
    "self",
  ),
  area(
    {
      id: "ja-al-5th-rahu-sun",
      group: "arudha",
      chart: "rasi",
      when: "Rahu in the 5th from the Arudha lagna aspected by the Sun",
      text: "Rahu in the 5th from the Arudha lagna under the Sun's aspect: eyesight needs care.",
      weight: 1,
      source: JS("1.3.43"),
      test: (ctx) => {
        const t = (AL(ctx) + 4) % 12;
        if (pos(ctx, "Rahu").signIndex !== t) return null;
        return rasiAspects(pos(ctx, "Sun").signIndex, t) ? ["Rahu", "Sun"] : null;
      },
    },
    "health",
  ),
  area(
    {
      id: "ja-ak-4th-venus-moon",
      group: "arudha",
      chart: "rasi",
      when: "Venus and Moon together in the 4th from the Atmakaraka's sign",
      text: "Venus and Moon in the 4th from the Atmakaraka: the trappings of status, a well-appointed home and ceremony.",
      weight: 1,
      source: JS("1.3.44"),
      test: (ctx) => (hasAll(rasi(ctx, akSign(ctx), 4), "Venus", "Moon") ? ["Venus", "Moon"] : null),
    },
    "wealth",
  ),

  // ── Dhana pada (A2) and Labha pada (A11) ───────────────────────────────────
  // Jaimini 1.3.2-5 and 1.3.16 read wealth from the 11th and 2nd of the Arudha lagna; Parashara's Arudha chapter
  // adds the padas of the 2nd and the 11th and their distance from the Arudha lagna (29.30-37).
  area(
    {
      id: "ja-a2-from-al",
      group: "arudha",
      chart: "rasi",
      when: "the Dhana pada (A2) in a kendra, trikona, 3rd or 11th from the Arudha lagna, or in its 6th, 8th or 12th",
      text: "Dhana pada well placed from the Arudha lagna: savings and family wealth stand behind the public image; in the 6th, 8th or 12th from it, what is accumulated does not show, or drains away.",
      weight: 2,
      source: BP29("29.30-37", "Dhana pada read with the Dara pada, as the passage directs"),
      test: (ctx) => {
        const h = houseFrom(AL(ctx), ctx.arudhas[1].signIndex);
        return [1, 4, 7, 10, 5, 9, 3, 11, 6, 8, 12].includes(h) ? [SIGN_LORD[ctx.arudhas[1].signIndex]] : null;
      },
    },
    "wealth",
  ),
  area(
    {
      id: "ja-a11-from-al",
      group: "arudha",
      chart: "rasi",
      when: "the Labha pada (A11) in a kendra, trikona, 3rd or 11th from the Arudha lagna, or in its 6th, 8th or 12th",
      text: "Labha pada well placed from the Arudha lagna: income and allies support the standing; in the 6th, 8th or 12th from it, gains come irregularly or at a cost to reputation.",
      weight: 2,
      source: BP29("29.34-37", "extended to A11 as the verse allows"),
      test: (ctx) => {
        const h = houseFrom(AL(ctx), ctx.arudhas[10].signIndex);
        return [1, 4, 7, 10, 5, 9, 3, 11, 6, 8, 12].includes(h) ? [SIGN_LORD[ctx.arudhas[10].signIndex]] : null;
      },
    },
    "wealth",
  ),
  area(
    {
      id: "ja-a2-a11-mutual",
      group: "arudha",
      chart: "rasi",
      when: "the Dhana pada and the Labha pada mutually in a kendra, trikona or the 3rd and 11th, or mutually in the 6th and 8th",
      text: "Dhana pada and Labha pada in harmony: income turns into savings; in mutual 6th and 8th, what is earned does not accumulate.",
      weight: 1,
      source: BP29("29.34", "provisional extension"),
      test: (ctx) => {
        const h = houseFrom(ctx.arudhas[1].signIndex, ctx.arudhas[10].signIndex);
        return [1, 4, 7, 10, 5, 9, 3, 11, 6, 8].includes(h) ? uniq([SIGN_LORD[ctx.arudhas[1].signIndex], SIGN_LORD[ctx.arudhas[10].signIndex]]) : null;
      },
    },
    "wealth",
  ),
  area(
    {
      id: "ja-al-11th-argala",
      group: "arudha",
      chart: "rasi",
      when: "unobstructed argala on the 11th from the Arudha lagna, with the 12th from the Arudha lagna free of malefics",
      text: "Argala on the 11th from the Arudha lagna multiplies the gains; benefic argala more so, an exalted benefic most. The 12th from the Arudha lagna must stay free of malefics for the gains to hold.",
      weight: 2,
      source: BP29("29.13-15", "malefic association of the 12th read as occupancy; aspects are not tested"),
      test: (ctx) => {
        const eleventh = (AL(ctx) + 10) % 12;
        const m = malefics(ctx);
        if (rasi(ctx, AL(ctx), 12).some((p) => m.has(p))) return null;
        const hits = freeArgala(ctx, eleventh);
        const b = benefics(ctx);
        const exalted = (p: Planet) => dignityOf(p, pos(ctx, p).signIndex, pos(ctx, p).degInSign) === "Exalted";
        // order: exalted benefics, benefics, the rest, so the strongest reading leads the list
        return nonEmpty([...hits.filter((p) => b.has(p) && exalted(p)), ...hits.filter((p) => b.has(p) && !exalted(p)), ...hits.filter((p) => !b.has(p))]);
      },
    },
    "wealth",
  ),
  area(
    {
      id: "ja-al-12th-clear",
      group: "arudha",
      chart: "rasi",
      when: "planets in or aspecting the 11th from the Arudha lagna while its 12th is neither occupied nor aspected",
      text: "The 11th from the Arudha lagna is touched by planets and its 12th by none: the gains are uninterrupted.",
      weight: 1,
      source: BP29("29.12"),
      test: (ctx) => {
        const gains = rasi(ctx, AL(ctx), 11, true);
        return gains.length && rasi(ctx, AL(ctx), 12, true).length === 0 ? nonEmpty(uniq(gains)) : null;
      },
    },
    "wealth",
  ),
  area(
    {
      id: "ja-al-7th-wealth",
      group: "arudha",
      chart: "rasi",
      when: "Jupiter, Venus or the Moon in the 7th from the Arudha lagna, or any planet exalted there",
      text: "Jupiter, Venus or the Moon in the 7th from the Arudha lagna, or an exalted planet there: wealth, and a name that carries.",
      weight: 2,
      source: BP29("29.25-26"),
      test: (ctx) =>
        nonEmpty(
          rasi(ctx, AL(ctx), 7).filter((p) => ["Jupiter", "Venus", "Moon"].includes(p) || dignityOf(p, pos(ctx, p).signIndex, pos(ctx, p).degInSign) === "Exalted"),
        ),
    },
    "wealth",
  ),
  area(
    {
      id: "ja-al-2nd-soft",
      group: "arudha",
      chart: "rasi",
      when: "Jupiter, Venus or the Moon in the 2nd from the Arudha lagna",
      text: "Jupiter, Venus or the Moon in the 2nd from the Arudha lagna: wealth; Parashara extends the 7th-house yogas to the 2nd, and Jaimini names the same three planets there.",
      weight: 2,
      source: BP29("29.25-27, Jaimini 1.3.15"),
      test: (ctx) => nonEmpty(rasi(ctx, AL(ctx), 2).filter((p) => ["Jupiter", "Venus", "Moon"].includes(p))),
    },
    "wealth",
  ),
  area(
    {
      id: "ja-al-2nd-exalted-benefic",
      group: "arudha",
      chart: "rasi",
      when: "Mercury, Jupiter or Venus exalted in the 2nd from the Arudha lagna",
      text: "Mercury, Jupiter or Venus exalted in the 2nd from the Arudha lagna: riches; Mercury there gives command over people, Venus eloquence.",
      weight: 2,
      source: BP29("29.28, 29.30"),
      test: (ctx) =>
        nonEmpty(rasi(ctx, AL(ctx), 2).filter((p) => ["Mercury", "Jupiter", "Venus"].includes(p) && dignityOf(p, pos(ctx, p).signIndex, pos(ctx, p).degInSign) === "Exalted")),
    },
    "wealth",
  ),
];

// ── 1.4: Upapada (rasi chart) ────────────────────────────────────────────────

const SPOUSE_HEALTH: Array<{ signs?: number[]; planets: Planet[]; text: string; sutra: string }> = [
  { planets: ["Mercury", "Ketu"], text: "Mercury and Ketu: bones, joints and weight (1.4.14, 1.4.16)", sutra: "1.4.14" },
  { planets: ["Saturn", "Sun", "Rahu"], text: "Saturn, Sun and Rahu: chronic low-grade ailments (1.4.15)", sutra: "1.4.15" },
  { signs: [0, 7], planets: ["Mars", "Saturn"], text: "Mars and Saturn on a Mars sign: nose and sinuses (1.4.18)", sutra: "1.4.18" },
  { signs: [0, 7, 2, 5], planets: ["Jupiter", "Saturn"], text: "Jupiter and Saturn on a Mars or Mercury sign: ears and nerves (1.4.19)", sutra: "1.4.19" },
  { signs: [0, 7, 2, 5], planets: ["Jupiter", "Rahu"], text: "Jupiter and Rahu on a Mars or Mercury sign: teeth (1.4.20)", sutra: "1.4.20" },
  { signs: [5, 6], planets: ["Saturn", "Rahu"], text: "Saturn and Rahu on Virgo or Libra: limbs and joints, wind disorders (1.4.21)", sutra: "1.4.21" },
];

export const SUTRA_RULES_UPAPADA: JaiminiRule[] = [
  area(
    {
      id: "ju-2nd-ak",
      group: "upapada",
      chart: "rasi",
      when: "the Atmakaraka in the 2nd from the Upapada",
      text: "Atmakaraka in the 2nd from the Upapada: Jaimini reads the later years as spent without the partner's company; distance or independence in late life.",
      weight: 1,
      source: JS("1.4.8"),
      test: (ctx) => (rasi(ctx, UL(ctx), 2).includes(ctx.karakas[0].planet) ? [ctx.karakas[0].planet] : null),
    },
    "marriage",
  ),
  area(
    {
      id: "ju-2nd-spouse-health",
      group: "upapada",
      chart: "rasi",
      when: "planet pairs in or aspecting the 2nd from the Upapada, some tied to the sign it falls in; a benefic on the 2nd cancels",
      text: "Health themes for the spouse from the 2nd of the Upapada.",
      weight: 1,
      source: JS("1.4.14-22"),
      test: (ctx) => {
        const t = (UL(ctx) + 1) % 12;
        const infl = rasi(ctx, UL(ctx), 2, true);
        const b = benefics(ctx);
        if (rasi(ctx, UL(ctx), 2).some((p) => b.has(p))) return null;
        const hits = SPOUSE_HEALTH.filter((s) => (!s.signs || s.signs.includes(t)) && s.planets.every((p) => infl.includes(p)));
        return hits.length ? uniq(hits.flatMap((h) => h.planets)) : null;
      },
    },
    "marriage",
  ),
  area(
    {
      id: "ju-7th-children-few",
      group: "upapada",
      chart: "rasi",
      when: "Mercury, Saturn and Venus all touch the 7th from the Upapada or its lord",
      text: "Mercury, Saturn and Venus on the 7th from the Upapada and its lord: children come late, few or through other means.",
      weight: 1,
      source: JS("1.4.24"),
      test: (ctx) => {
        const t = (UL(ctx) + 6) % 12;
        const lord = SIGN_LORD[t];
        const infl = uniq([...rasi(ctx, UL(ctx), 7, true), ...rasi(ctx, pos(ctx, lord).signIndex, 1, true)]);
        return hasAll(infl, "Mercury", "Saturn", "Venus") ? ["Mercury", "Saturn", "Venus"] : null;
      },
    },
    "children",
  ),
  area(
    {
      id: "ju-11th-children",
      group: "upapada",
      chart: "rasi",
      when: "the 5th from the 7th of the Upapada (its 11th): Sun, Rahu or Jupiter, Moon alone, Mars with Saturn, and the sign's parity",
      text: "Children from the 5th of the Upapada's 7th.",
      weight: 1,
      source: JS("1.4.25-30"),
      test: (ctx) => {
        const infl = rasi(ctx, UL(ctx), 11, true);
        const hits = infl.filter((p) => ["Sun", "Rahu", "Jupiter", "Moon", "Mars", "Saturn"].includes(p));
        return hits.length ? uniq(hits) : [SIGN_LORD[(UL(ctx) + 10) % 12]];
      },
    },
    "children",
  ),
  area(
    {
      id: "ju-3-11-siblings",
      group: "upapada",
      chart: "rasi",
      when: "planets in or aspecting the 3rd and 11th from the Upapada",
      text: "Siblings from the 3rd and 11th of the Upapada.",
      weight: 1,
      source: JS("1.4.32-38"),
      test: (ctx) => {
        const infl = uniq([...rasi(ctx, UL(ctx), 3, true), ...rasi(ctx, UL(ctx), 11, true)]);
        return nonEmpty(infl.filter((p) => p !== "Sun"));
      },
    },
    "family",
  ),
  area(
    {
      id: "ju-8th-nodes",
      group: "upapada",
      chart: "rasi",
      when: "Rahu or Ketu in the 2nd from the 7th of the Upapada (its 8th)",
      text: "Rahu in the 8th from the Upapada: the teeth need care; Ketu there: indistinct speech or a stammer.",
      weight: 1,
      source: JS("1.4.39-40"),
      test: (ctx) => nonEmpty(rasi(ctx, UL(ctx), 8).filter((p) => p === "Rahu" || p === "Ketu")),
    },
    "health",
  ),
];

/** Per-planet glosses used by evaluateJaimini to expand list-type rules into text. */
export function sutraRuleText(id: string, planets: Planet[], ctx: JaiminiContext): string | null {
  const list = (gl: Partial<Record<Planet, string>>) => planets.map((p) => gl[p]).filter(Boolean).join("; ");
  switch (id) {
    case "jks-ketu-aspects": {
      const asp: Planet[] = planets.filter((p) => p !== "Ketu");
      const parts = KETU_ASPECT_GLOSS.filter((g) => g.planets.every((p) => asp.includes(p))).map((g) => g.text);
      if (asp.some((p) => MALEFIC.has(p))) parts.unshift("malefic aspect: hearing needs care (1.2.32)");
      return `Ketu in the Karakamsa aspected by ${asp.join(", ")}: ${parts.join("; ")}.`;
    }
    case "jks-5-9-malefics": {
      const b = benefics(ctx);
      const hitSigns = new Set(ctx.navamsa.filter((p) => planets.includes(p.planet)).map((p) => p.signIndex));
      const company = ctx.navamsa.filter((p) => !planets.includes(p.planet) && Array.from(hitSigns).some((s) => p.signIndex === s || rasiAspects(p.signIndex, s))).map((p) => p.planet);
      const good = company.some((p) => b.has(p));
      return `${planets.join(", ")} in the 5th or 9th from the Karakamsa: a grip on mantra and the unseen; ${good ? "with benefic company it is turned to helping others (1.2.85)" : "with malefic company it expels and binds (1.2.84)"}.`;
    }
    case "jks-4-5-health": {
      const parts: string[] = [];
      if (planets.includes("Mars") && planets.includes("Rahu")) parts.push("Mars with Rahu: the chest and lungs need care (1.2.91-92)");
      else if (planets.includes("Mars")) parts.push("Mars: heat, boils, cuts and heavy sweating (1.2.93)");
      if (planets.includes("Ketu")) parts.push("Ketu: digestion, glands and fluid balance (1.2.94)");
      if (planets.includes("Rahu") && !planets.includes("Mars")) parts.push("Rahu: sensitivity to toxins and infections (1.2.95)");
      return `${planets.join(", ")} in the 4th or 5th from the Karakamsa: ${parts.join("; ")}.`;
    }
    case "jks-4th-skill":
      return `4th from the Karakamsa shows skills: ${list(FOURTH_SKILL)}.`;
    case "ja-al-12th-sources": {
      const gl = SOURCE_GLOSS.filter((g) => g.planets.every((p) => planets.includes(p))).map((g) => g.text);
      return `Expenses flow through the 12th from the Arudha lagna (${planets.join(", ")}): ${gl.join("; ")}.`;
    }
    case "ja-al-11th-sources": {
      const gl = SOURCE_GLOSS.filter((g) => g.planets.every((p) => planets.includes(p))).map((g) => g.text);
      return `Gains flow through the 11th from the Arudha lagna (${planets.join(", ")}): ${gl.join("; ")}.`;
    }
    case "ja-al-from-lagna": {
      const h = houseFrom(ctx.lagnaSign, AL(ctx));
      if ([6, 8, 12].includes(h)) return `Arudha lagna in the ${h}th from the lagna: the public image runs at odds with the self; standing is won against resistance (1.3.19).`;
      return `Arudha lagna in the ${h}${h === 1 ? "st" : "th"} from the lagna, a ${[1, 4, 7, 10].includes(h) ? "kendra" : "trikona"}: standing and prosperity come readily (1.3.18).`;
    }
    case "ja-a2-from-al":
    case "ja-a11-from-al": {
      const i = id === "ja-a2-from-al" ? 1 : 10;
      const a = ctx.arudhas[i];
      const h = houseFrom(AL(ctx), a.signIndex);
      const ord = h === 1 ? "1st" : h === 3 ? "3rd" : `${h}th`;
      const what = i === 1 ? "savings and family wealth" : "income and allies";
      if ([6, 8, 12].includes(h)) return `${a.label} in ${SIGNS[a.signIndex]}, the ${ord} from the Arudha lagna: ${what} do not show behind the public image, or drain away (Parashara 29.31, 29.36).`;
      if (h === 1) return `${a.label} shares ${SIGNS[a.signIndex]} with the Arudha lagna: ${what} are part of the public image itself (Parashara 29.31, 29.37).`;
      const kind = [4, 7, 10].includes(h) ? "a kendra" : [5, 9].includes(h) ? "a trikona" : "the 3rd-11th axis";
      return `${a.label} in ${SIGNS[a.signIndex]}, the ${ord} from the Arudha lagna, ${kind}: ${what} stand behind the public image (Parashara 29.31, 29.37).`;
    }
    case "ja-al-11th-argala": {
      const b = benefics(ctx);
      const good = planets.filter((p) => b.has(p));
      const exalted = good.filter((p) => dignityOf(p, pos(ctx, p).signIndex, pos(ctx, p).degInSign) === "Exalted");
      const grade = exalted.length ? `${exalted.join(", ")} exalted: the gains are at their highest` : good.length ? `benefic argala from ${good.join(", ")}: the gains multiply` : "malefic argala: gains, but pressed for";
      return `Unobstructed argala on the 11th from the Arudha lagna (${SIGNS[(AL(ctx) + 10) % 12]}) from ${planets.join(", ")}, with its 12th free of malefics; ${grade} (Parashara 29.13-15).`;
    }
    case "ja-al-7th-wealth": {
      const exalted = planets.filter((p) => dignityOf(p, pos(ctx, p).signIndex, pos(ctx, p).degInSign) === "Exalted");
      const soft = planets.filter((p) => ["Jupiter", "Venus", "Moon"].includes(p));
      const parts = [soft.length ? `${soft.join(", ")} in the 7th from the Arudha lagna: wealth (29.25)` : "", exalted.length ? `${exalted.join(", ")} exalted there: affluence and a name that carries (29.26)` : ""].filter(Boolean);
      return `${parts.join("; ")}.`;
    }
    case "ja-a2-a11-mutual": {
      const h = houseFrom(ctx.arudhas[1].signIndex, ctx.arudhas[10].signIndex);
      if ([6, 8].includes(h)) return `Dhana pada (${SIGNS[ctx.arudhas[1].signIndex]}) and Labha pada (${SIGNS[ctx.arudhas[10].signIndex]}) in mutual 6th and 8th: what is earned does not accumulate (provisional, extended from Parashara 29.34).`;
      if (h === 1) return `Dhana pada and Labha pada share ${SIGNS[ctx.arudhas[1].signIndex]}: income and savings are one stream (provisional, extended from Parashara 29.34).`;
      return `Dhana pada (${SIGNS[ctx.arudhas[1].signIndex]}) and Labha pada (${SIGNS[ctx.arudhas[10].signIndex]}) in mutual ${[4, 7, 10].includes(h) ? "kendra" : [5, 9].includes(h) ? "trikona" : "3rd and 11th"}: income turns into savings (provisional, extended from Parashara 29.34).`;
    }
    case "ja-padas-dusthana": {
      const bad = ctx.arudhas.filter((a, i) => i > 0 && i < 11 && [6, 8, 12].includes(houseFrom(ctx.lagnaSign, a.signIndex))).map((a) => `${PADA_SHORT[ctx.arudhas.indexOf(a)]} in the ${houseFrom(ctx.lagnaSign, a.signIndex)}th`);
      return `Padas in the 6th, 8th or 12th from the lagna meet obstruction in their matters: ${bad.join(", ")}.`;
    }
    case "ja-lords-aspect-lagnas": {
      const L = ctx.lagnaSign;
      const parts: string[] = [];
      const lord = (h: number) => SIGN_LORD[(L + h - 1) % 12];
      if (planets.includes(lord(4))) parts.push(`the 4th lord ${lord(4)}: contentment and a settled home (1.3.38)`);
      if (planets.includes(lord(8))) parts.push(`the 8th lord ${lord(8)}: money is hard to hold (1.3.39)`);
      if (planets.includes(lord(12))) parts.push(`the 12th lord ${lord(12)}: a free hand with spending (1.3.40)`);
      if (planets.includes(SIGN_LORD[L]) && planets.includes(SIGN_LORD[akSign(ctx)])) parts.push("the lagna lord on the lagna and the Karaka-lagna lord on the Atmakaraka's sign: a strong raja yoga (1.3.41)");
      return `Lords aspecting the lagna and the Atmakaraka's sign: ${parts.join("; ")}.`;
    }
    case "ju-8th-nodes": {
      const parts: string[] = [];
      if (planets.includes("Rahu")) parts.push("Rahu: the teeth need care (1.4.39)");
      if (planets.includes("Ketu")) parts.push("Ketu: indistinct speech or a stammer (1.4.40)");
      return `${planets.join(" and ")} in the 8th from the Upapada (the 2nd from its 7th): ${parts.join("; ")}.`;
    }
    case "ju-2nd-spouse-health": {
      const t = (UL(ctx) + 1) % 12;
      const infl = rasi(ctx, UL(ctx), 2, true);
      const hits = SPOUSE_HEALTH.filter((s) => (!s.signs || s.signs.includes(t)) && s.planets.every((p) => infl.includes(p))).map((s) => s.text);
      return `Spouse's health themes from the 2nd of the Upapada: ${hits.join("; ")}. A benefic on the 2nd would cancel these (1.4.22).`;
    }
    case "ju-11th-children": {
      const sign = (UL(ctx) + 10) % 12;
      const parts: string[] = [];
      if (planets.some((p) => p === "Sun" || p === "Rahu" || p === "Jupiter")) parts.push("Sun, Rahu or Jupiter: several children (1.4.25)");
      if (planets.includes("Moon") && planets.length === 1) parts.push("Moon alone: one child (1.4.26)");
      if (planets.includes("Mars") && planets.includes("Saturn")) parts.push("Mars with Saturn: a child raised or adopted through others (1.4.28)");
      parts.push(ODD(sign) ? "an odd sign: the count leans higher (1.4.29)" : "an even sign: the count leans lower (1.4.30)");
      return `Children from the 5th of the Upapada's 7th: ${parts.join("; ")}.`;
    }
    case "ju-3-11-siblings": {
      const parts: string[] = [];
      if (planets.includes("Saturn") && planets.includes("Rahu")) parts.push("Saturn with Rahu: distance from or loss among siblings (1.4.32)");
      if (planets.includes("Venus")) parts.push("Venus: siblings' paths diverge from one's own (1.4.33)");
      const many = planets.filter((p) => ["Mars", "Jupiter", "Moon", "Mercury"].includes(p));
      if (many.length) parts.push(`${many.join(", ")}: a large sibling group (1.4.35)`);
      if (planets.includes("Saturn") && planets.includes("Mars")) parts.push("Saturn with Mars: strain among siblings (1.4.36)");
      else if (planets.includes("Saturn") && !planets.includes("Rahu")) parts.push("Saturn: few siblings, or a self-reliant place among them (1.4.37)");
      if (planets.includes("Ketu")) parts.push("Ketu: sisters are many (1.4.38)");
      return `Siblings from the 3rd and 11th of the Upapada (${planets.join(", ")}): ${parts.join("; ")}.`;
    }
    default:
      return null;
  }
}

export const SUTRA_RULES: JaiminiRule[] = [...SUTRA_RULES_KARAKAMSA, ...SUTRA_RULES_ARUDHA, ...SUTRA_RULES_UPAPADA];
