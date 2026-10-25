import { houseFrom, type Planet, type PlanetPosition, type TransitPeriod } from "./astro";
import { TRANSIT_ACTIVATION, type Finding, type LifeArea, type Roles } from "./rules";
import { AREA_ONSET } from "./life-stage";

/**
 * Personalised Nadi timing.
 *
 * A transit is not read against a planet in isolation but against the natal
 * combination that planet belongs to: when Jupiter walks over natal Venus that
 * sits with Mars, it is the Venus–Mars story (marriage, property) that ripens,
 * not "Venus" in the abstract. So each passage is scored against the chart's own
 * findings, and the passage is also counted from the natal Jeeva (Jupiter) and
 * Karma (Saturn), the Nadi equivalent of a progression.
 */

export interface TransitReading {
  period: TransitPeriod;
  conjunct: Planet[];
  trine: Planet[];
  opposite: Planet[];
  /** Sign of this passage counted from natal Jupiter (1–12). */
  fromJeeva: number;
  /** Sign of this passage counted from natal Saturn (1–12). */
  fromKarma: number;
  /** One-line personalised summary. */
  headline: string;
  /** Life areas that ripen, most weighted first. */
  areas: LifeArea[];
  /** Findings from the reading that this passage brings to life, strongest first. */
  activated: Finding[];
  /** Returns, double transits and other period notes. */
  notes: string[];
  /** 0 quiet · 1 single trine or 7th · 2 over a natal planet or two-plus trines · 3 over a natal cluster or double transit */
  weight: 0 | 1 | 2 | 3;
}

const FROM_JEEVA: Record<number, string> = {
  1: "Jupiter on the natal Jeeva: a fresh chapter for the native, identity and body renewed",
  2: "2nd from the Jeeva: speech, family and accumulation gain",
  3: "3rd from the Jeeva: effort, siblings and short journeys; results by initiative",
  4: "4th from the Jeeva: home, mother, property and vehicles",
  5: "5th from the Jeeva: children, learning, mantra and merit ripen",
  6: "6th from the Jeeva: service, debts and rivals; health needs attention",
  7: "7th from the Jeeva: partnership, marriage and public dealings",
  8: "8th from the Jeeva: hidden matters, inheritance and transformation; a slower year",
  9: "9th from the Jeeva: fortune, father, guru and dharma; auspicious undertakings",
  10: "10th from the Jeeva: career, honour and visibility",
  11: "11th from the Jeeva: gains, friends and wishes fulfilled",
  12: "12th from the Jeeva: expenses, foreign places, retreat and closure before the return",
};

const FROM_KARMA: Record<number, string> = {
  1: "Saturn on the natal Karma: the profession is restructured; a Saturn return",
  2: "2nd from the Karma: earnings from work stabilise, family duty",
  3: "3rd from the Karma: hard effort, communication and travel for work",
  4: "4th from the Karma: work bears on home and property; possible relocation",
  5: "5th from the Karma: discipline in learning; responsibility for children",
  6: "6th from the Karma: service, subordinates and health of the working body",
  7: "7th from the Karma: partnerships and public standing tested",
  8: "8th from the Karma: endings and slow transformation in livelihood",
  9: "9th from the Karma: work tied to father, teachers or distant lands",
  10: "10th from the Karma: peak responsibility; recognition through labour",
  11: "11th from the Karma: gains from past effort consolidate",
  12: "12th from the Karma: loss or release in work; foreign work; rest before renewal",
};

/**
 * The held-back areas each progression line speaks of (life-stage.ts AREA_ONSET), so a minor's reading can
 * leave it out. Saturn is the karaka of work in the Nadi reading, so every line from the Karma is about work.
 */
const FROM_JEEVA_AREAS: Record<number, LifeArea[]> = {
  2: ["wealth"],
  4: ["wealth"],
  5: ["children"],
  6: ["career", "wealth"],
  7: ["marriage"],
  8: ["wealth"],
  10: ["career"],
  11: ["wealth"],
  12: ["wealth"],
};
const fromKarmaAreas = (h: number): LifeArea[] =>
  h === 2 ? ["career", "wealth"] : h === 5 ? ["career", "children"] : h === 7 ? ["career", "marriage"] : h === 11 ? ["career", "wealth"] : ["career"];

const AREA_SHORT: Record<LifeArea, string> = {
  self: "self",
  career: "career",
  authority: "standing and authority",
  marriage: "marriage",
  children: "children",
  wealth: "wealth",
  education: "learning",
  family: "family",
  health: "health",
  spirituality: "the spiritual path",
  travel: "travel and foreign ties",
};

function list(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function ageAt(iso: string, birthIso: string): number {
  return (Date.parse(iso) - Date.parse(birthIso)) / (365.25 * 86400e3);
}

/** Rank the reading's findings by how directly this passage touches them. */
function activatedFindings(findings: Finding[], strong: Set<Planet>, mid: Set<Planet>, weak: Set<Planet>, limit: number): Finding[] {
  const scored = findings
    .map((f) => {
      const inStrong = f.planets.filter((p) => strong.has(p)).length;
      const inMid = f.planets.filter((p) => mid.has(p)).length;
      const inWeak = f.planets.filter((p) => weak.has(p)).length;
      if (inStrong === 0 && inMid === 0 && inWeak === 0) return null;
      let w = f.score;
      if (inStrong > 0) w *= 1 + 0.5 * inStrong;
      if (inStrong > 0 && strong.has(f.planets[0])) w *= 1.25; // subject of the rule is directly touched
      if (inStrong === f.planets.length && f.planets.length > 1) w *= 1.3; // whole combination under the transit
      if (inStrong === 0 && inMid > 0) w *= 0.75; // trine only: same direction, in combination
      if (inStrong === 0 && inMid === 0) w *= 0.5; // 7th only
      return { f, w };
    })
    .filter((x): x is { f: Finding; w: number } => x !== null)
    .sort((a, b) => b.w - a.w);
  // Prefer breadth of life areas: first pass one per area, then fill.
  const out: Finding[] = [];
  const seenArea = new Set<LifeArea>();
  for (const { f } of scored) {
    if (out.length >= limit) break;
    if (seenArea.has(f.area)) continue;
    seenArea.add(f.area);
    out.push(f);
  }
  for (const { f } of scored) {
    if (out.length >= limit) break;
    if (!out.includes(f)) out.push(f);
  }
  return out;
}

export function readTransit(
  t: TransitPeriod,
  positions: PlanetPosition[],
  findings: Finding[],
  allTransits: TransitPeriod[],
  birthIso: string,
  roles?: Roles,
  /** Areas held back for a minor (life-stage.ts heldAreasAt); none by default. */
  held: (area: LifeArea) => boolean = () => false,
): TransitReading {
  const jeevaPlanet: Planet = roles?.native ?? "Jupiter";
  const female = roles?.gender === "female";
  const conjunct = positions.filter((p) => p.signIndex === t.signIndex).map((p) => p.planet);
  const trine = positions.filter((p) => [5, 9].includes(houseFrom(t.signIndex, p.signIndex))).map((p) => p.planet);
  const opposite = positions.filter((p) => houseFrom(t.signIndex, p.signIndex) === 7).map((p) => p.planet);
  const natalJu = positions.find((p) => p.planet === jeevaPlanet)!;
  const natalSa = positions.find((p) => p.planet === "Saturn")!;
  const fromJeeva = houseFrom(natalJu.signIndex, t.signIndex);
  const fromKarma = houseFrom(natalSa.signIndex, t.signIndex);

  // Nadi: planets in the same direction (1-5-9) are in combination, so a passage through a
  // trine sign is a genuine trigger (~75%), the 7th a weaker one (~50%).
  const strong = new Set(conjunct);
  const mid = new Set(trine);
  const weak = new Set(opposite);
  const limit = conjunct.length ? 4 : trine.length ? 3 : 2;
  // A minor's held-back areas are read from the in-season lines only, and no sentence below names them:
  // the same gate as the Parashari topic periods and the Overview briefing.
  const anyHeld = (Object.keys(AREA_ONSET) as LifeArea[]).some((a) => held(a));
  const activatedAll = activatedFindings(findings, strong, mid, weak, limit);
  const activated = anyHeld
    ? activatedFindings(findings.filter((f) => !held(f.area)), strong, mid, weak, limit)
    : activatedAll;
  // The passage wakes lines of held-back areas only: it says so, rather than fall back on the generic
  // activation wording, which names marriage, work and money.
  const heldOnly = anyHeld && activatedAll.some((f) => held(f.area));
  const areas: LifeArea[] = [];
  for (const f of activated) if (!areas.includes(f.area)) areas.push(f.area);

  const notes: string[] = [];
  const age = ageAt(t.start, birthIso);

  // Returns and karaka crossings.
  if (t.planet === "Jupiter" && conjunct.includes("Jupiter") && age > 1) {
    notes.push(`Jupiter return around age ${Math.round(age)}: a twelve-year chapter closes and a new one opens for the native${age >= 18 && !held("children") ? "; in Nadi this is the classic window for a child" : ""}.`);
  }
  if (t.planet === "Saturn" && conjunct.includes("Saturn") && age > 1) {
    notes.push(
      held("career")
        ? `Saturn return around age ${Math.round(age)}: duties are restructured; what was built is tested.`
        : `Saturn return around age ${Math.round(age)}: the profession and duties are restructured; what was built is tested.`,
    );
  }
  if (t.planet === "Saturn" && conjunct.includes(jeevaPlanet)) {
    notes.push("Saturn over the Jeeva: responsibility, slower pace and care for health; maturity is forced rather than chosen.");
  }
  if (female && t.planet === "Jupiter" && conjunct.includes("Venus")) {
    notes.push(
      held("marriage") || held("children")
        ? "Jupiter over the Deha (Venus, the native herself): a fresh chapter in her own life; a move is favoured."
        : "Jupiter over the Deha (Venus, the native herself): a fresh chapter in her own life; marriage, children or a move are favoured.",
    );
  }
  if (female && t.planet === "Saturn" && conjunct.includes("Venus")) {
    notes.push(
      held("marriage")
        ? "Saturn over the Deha (Venus): duties weigh on her personally; health and comforts need care."
        : "Saturn over the Deha (Venus): duties weigh on her personally; health and comforts need care, and a marriage matter is settled slowly.",
    );
  }
  if (female && t.planet === "Jupiter" && conjunct.includes("Mars") && !held("marriage")) {
    notes.push("Jupiter over the husband's karaka (Mars): marriage, or a turn in the husband's fortunes and position.");
  }
  if (female && t.planet === "Saturn" && conjunct.includes("Mars") && !held("marriage")) {
    notes.push("Saturn over the husband's karaka (Mars): a delayed marriage may now be released; the husband's work grows heavier.");
  }
  if (t.planet === "Jupiter" && conjunct.includes("Saturn") && !held("career")) {
    notes.push("Jupiter over the Karma: the profession is blessed; promotion, a new role or a long-awaited outcome at work.");
  }

  // Progression from the karakas (folded into the headline when the sign is empty); left out when it speaks
  // of a held-back area.
  const progAreas = t.planet === "Jupiter" ? (FROM_JEEVA_AREAS[fromJeeva] ?? []) : fromKarmaAreas(fromKarma);
  const progression = progAreas.some((a) => held(a))
    ? undefined
    : t.planet === "Jupiter"
      ? FROM_JEEVA[fromJeeva]
      : FROM_KARMA[fromKarma];
  if (progression && (conjunct.length || trine.length || opposite.length)) notes.push(progression);

  // Double transit: the other karaka touching the same natal planets in an overlapping window.
  const other = t.planet === "Jupiter" ? "Saturn" : "Jupiter";
  const s = Date.parse(t.start);
  const e = Date.parse(t.end);
  let double = false;
  if (conjunct.length) {
    const overlaps = allTransits.filter((o) => o.planet === other && Date.parse(o.start) < e && Date.parse(o.end) > s);
    for (const o of overlaps) {
      const rel = houseFrom(o.signIndex, t.signIndex);
      if ([1, 5, 9, 7].includes(rel)) {
        const how = rel === 1 ? "is also over" : rel === 7 ? "faces" : "supports from trine";
        const from = new Date(Math.max(s, Date.parse(o.start)));
        const to = new Date(Math.min(e, Date.parse(o.end)));
        const fmt = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        notes.push(`Double transit: ${other} in ${o.sign} ${how} ${list(conjunct)} (${fmt(from)} – ${fmt(to)}). Both karakas press the same matter; events tend to materialise.`);
        double = true;
        break;
      }
    }
  }

  // Headline.
  let headline: string;
  let weight: TransitReading["weight"];
  // With nothing in season to name, a minor's passage says what it wakes is held, or names "their matters".
  const HELD_LINE = "what it wakes is held for later at this age";
  const generic = (p: Planet) => (anyHeld ? "their matters" : TRANSIT_ACTIVATION[t.planet][p]);
  if (conjunct.length) {
    const what = areas.length ? list(areas.slice(0, 3).map((a) => AREA_SHORT[a])) : generic(conjunct[0]);
    const lead =
      conjunct.length >= 3 ? `${t.planet} enters the natal ${t.sign} cluster of ${list(conjunct)}` : `${t.planet} over natal ${list(conjunct)}`;
    headline =
      !areas.length && heldOnly
        ? `${lead}; ${HELD_LINE}.`
        : conjunct.length >= 3
          ? `${lead}: ${what} all come due at once.`
          : `${lead}: ${what} come to the fore.`;
    weight = conjunct.length >= 2 || double ? 3 : 2;
  } else if (trine.length) {
    const what = areas.length ? list(areas.slice(0, 3).map((a) => AREA_SHORT[a])) : generic(trine[0]);
    const extra = opposite.length ? `, and faces ${list(opposite)}` : "";
    headline =
      !areas.length && heldOnly
        ? `${t.planet} in trine to natal ${list(trine)}${extra}; ${HELD_LINE}.`
        : `${t.planet} in trine to natal ${list(trine)}${extra}: same direction, so ${what} ripen at about three-quarter strength.`;
    weight = trine.length >= 2 ? 2 : 1;
  } else if (opposite.length) {
    const what = areas.length ? list(areas.slice(0, 2).map((a) => AREA_SHORT[a])) : "their matters";
    headline =
      !areas.length && heldOnly
        ? `${t.planet} faces natal ${list(opposite)} from the 7th; ${HELD_LINE}.`
        : `${t.planet} faces natal ${list(opposite)} from the 7th: ${what} stir, at about half strength.`;
    weight = 1;
  } else {
    headline = `No natal planet in ${t.sign}; a quieter passage.${progression ? ` ${progression}.` : ""}`;
    weight = 0;
  }

  return { period: t, conjunct, trine, opposite, fromJeeva, fromKarma, headline, areas, activated, notes, weight };
}

/** Every passage read; pass `held` (life-stage.ts heldAreasAt) so a minor's reading names no held-back area. */
export function readTransits(
  transits: TransitPeriod[],
  positions: PlanetPosition[],
  findings: Finding[],
  birthIso: string,
  roles?: Roles,
  held?: (area: LifeArea) => boolean,
): TransitReading[] {
  return transits.map((t) => readTransit(t, positions, findings, transits, birthIso, roles, held));
}


/** The matters drawn as rows under the BNN life line. */
export const LINE_AREAS = ["career", "wealth", "health", "family"] as const;
export type LineArea = (typeof LINE_AREAS)[number];

/** How directly a passage touches one area among the lines it brings to life. */
export interface AreaTouch {
  area: LifeArea;
  /** The most direct contact with a natal planet of the area's lines: over it, in trine, or from the 7th. */
  contact: "over" | "trine" | "7th";
  /** The app's activation fractions for the three contacts, as in readTransit: 1, three-quarters, a half (provisional). */
  strength: 1 | 0.75 | 0.5;
  /** Natal planets of those lines touched at that contact. */
  planets: Planet[];
  /** The area's lines among those the passage brings to life, the most direct contact first. */
  findings: Finding[];
}

const CONTACT_RANK = { over: 3, trine: 2, "7th": 1 } as const;
const CONTACT_STRENGTH = { over: 1, trine: 0.75, "7th": 0.5 } as const;

/**
 * The listed areas among the lines a passage brings to life (`activated`, the same ranking the Timing list
 * names), with how directly each is touched. A row of the life line lights only where the Timing list would
 * name that area for the passage. Cancelled lines and lines without strength are left out.
 */
export function areaTouches(
  r: Pick<TransitReading, "conjunct" | "trine" | "opposite" | "activated">,
  areas: readonly LifeArea[],
): AreaTouch[] {
  const contactOf = (p: Planet): AreaTouch["contact"] | null =>
    r.conjunct.includes(p) ? "over" : r.trine.includes(p) ? "trine" : r.opposite.includes(p) ? "7th" : null;
  const out: AreaTouch[] = [];
  for (const area of areas) {
    const touched: { f: Finding; c: AreaTouch["contact"] }[] = [];
    for (const f of r.activated) {
      if (f.area !== area || !(f.score > 0) || f.grade?.level === "cancelled") continue;
      let best: AreaTouch["contact"] | null = null;
      for (const p of f.planets) {
        const c = contactOf(p);
        if (c && (!best || CONTACT_RANK[c] > CONTACT_RANK[best])) best = c;
      }
      if (best) touched.push({ f, c: best });
    }
    if (!touched.length) continue;
    touched.sort((a, b) => CONTACT_RANK[b.c] - CONTACT_RANK[a.c]);
    const contact = touched[0].c;
    const planets: Planet[] = [];
    for (const { f, c } of touched) {
      if (c !== contact) continue;
      for (const p of f.planets) if (contactOf(p) === contact && !planets.includes(p)) planets.push(p);
    }
    out.push({ area, contact, strength: CONTACT_STRENGTH[contact], planets, findings: touched.map((x) => x.f) });
  }
  return out;
}
