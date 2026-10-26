// Karakatwas in the periods: display only, shown and never counted.
//
// BPHS 47.2 divides a dasa's effects into general ones, from the planet's natural characteristics, and
// distinctive ones, from its placement; 47.3-4 scales both by the planet's strength. Phaladeepika 21.1:
// whatever is said of a planet comes to pass in its dasa, its bhukti and its antara. This module sets the
// period lord's classical significations (the classical tier of parashari-significations.ts: BPHS ch. 3
// and 32, Phaladeepika ch. 2) beside its main period and its sub-periods, with the condition that decides
// how they fare:
//  - main period: the lord's strength by sign (BPHS 47.3-4; exalted, moolatrikona or own sign strong,
//    debilitated or inimical weak, as the chapter's own lines read it), with combustion graded by
//    Mantreswara (Phaladeepika 20.30 and 20.57), as the period's counted lines grade it;
//  - sub-period: the sub-period's own reading in the dasa lord's chapter (BPHS ch. 52-60), which weighs its
//    placement from the lagna and from the dasa lord, its dignity and its maraka lordship.
// The period's own lines (ch. 47-60) already name these matters, so the line casts no vote and moves no
// lean or verdict. No rule, verdict or kernel module imports this one (guarded in significations.test.ts).
// Provisional: the texts state the principle; pairing the word lists with the condition is ours.

import type { Planet, PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import type { AntarReading, DasaReading, DasaSource } from "./parashari-dasa";
import { PARASHARI_SIGNIFICATIONS, significationView, type Signification } from "./parashari-significations";
import { parashariCombust } from "./vargas";
import { AREA_ONSET, heldAreasAt } from "./life-stage";
import { thePlanet } from "./house-gloss";

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** "The Sun", "The Moon", "Mars". */
const Name = (p: Planet) => cap(thePlanet(p));

export const PHALADEEPIKA_CH21_URL =
  "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621593.html";

export const PERIOD_SIGNIFICATION_SOURCES: DasaSource[] = [
  { label: "Parashara 47.2-4", url: BPHS_URL(47), provisional: true },
  { label: "Phaladeepika 21.1", url: PHALADEEPIKA_CH21_URL, provisional: true },
];

export const PERIOD_SIGNIFICATIONS_NOT_COUNTED =
  "The period's own lines already name these matters, so this line casts no vote.";

/** How the lord's significations fare in the period, by the verses named in `why`. */
export type PeriodCondition = "supported" | "moderate" | "mixed" | "strained" | "ungraded";

export interface PeriodSignifications {
  level: "dasa" | "antar";
  lord: Planet;
  /** The main period's lord (the same planet for a main period). */
  dasaLord: Planet;
  /** Practitioner view: every classical entry for the lord that passes the minor's gates, with its verse. */
  entries: Signification[];
  /**
   * Plain view: the lord's own unconditional lists (BPHS 3.12-13 and Phaladeepika 2.1-2.7; for the nodes,
   * BPHS 3.14-15 and 32.18-21), without the words the gentle policy keeps out of plain lines.
   */
  words: string[];
  condition: PeriodCondition;
  /** Practitioner reason, with verses. */
  why: string;
  /** Plain reason, gentle. */
  whyPlain: string;
  /** Practitioner view: the condition in a few words with its verse, e.g. "supported: exalted (47.3-4)". */
  tag: string;
  /**
   * The life-periods graphic's line (hover title and readout): plain words in the plain view; the verse tags and the
   * condition tag in the practitioner view. The minor's holds are the same as in `text` and `textPlain`.
   */
  timeline: string;
  timelinePlain: string;
  /** Areas held back for a minor (AREA_ONSET), with the age each opens; empty for an adult. */
  held: Array<{ area: string; from: number }>;
  /** Entries withheld under the sensitive gate (potency, longevity) for a minor. */
  withheldCount: number;
  text: string;
  textPlain: string;
  sources: DasaSource[];
  notCounted: string;
}

export interface PeriodSignificationOptions {
  /** Birth instant (ISO) and reading instant (lifeAsOf), for the minor's area holds. */
  birthIso: string;
  asOfIso: string;
  /** The sensitive gate (sensitiveGate().withheld): drops tagged entries for a minor. */
  withheld: boolean;
}

/** Signification items by life area, for the minor's holds (AREA_ONSET). */
const AREA_ITEM: Array<[string, RegExp]> = [
  ["marriage", /\b(wife|husband|marriage|spouse)\b|in-law/i],
  ["children", /\b(sons?|children)\b/i],
  ["career", /\b(government service|commerce)\b/i],
  ["wealth", /\b(wealth|treasure-house)\b/i],
];

export function itemAreas(item: string): string[] {
  return AREA_ITEM.filter(([, re]) => re.test(item)).map(([a]) => a);
}

/** Plain lines leave out these words; the practitioner view keeps them (gentle policy). */
const PLAIN_SKIP = /^(longevity|grief|potency|wounds)$/i;

const isNode = (p: Planet) => p === "Rahu" || p === "Ketu";

function plainSource(s: Signification): boolean {
  if (isNode(s.planet)) return s.source === "BPHS" && (s.ref === "3.14-15" || s.ref === "32.18-21");
  return (s.source === "BPHS" && s.ref === "3.12-13") || (s.source === "Phaladeepika" && /^2\.[1-7]$/.test(s.ref));
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Plain-view wording for a bare item that reads badly alone. */
const PLAIN_WORD: Record<string, string> = { army: "the army" };

/** Splits an entry into its items, drops those in held areas, and returns what is left (or null). */
function gateEntry(s: Signification, held: (area: string) => boolean, seen: Set<string>): Signification | null {
  const items = s.word.split(/,\s*/);
  const kept = items.filter((it) => {
    const hit = itemAreas(it).filter(held);
    for (const a of hit) seen.add(a);
    return hit.length === 0;
  });
  if (!kept.length) return null;
  if (kept.length === items.length) return s;
  return { ...s, word: kept.join(", ").replace(/^and /, "") };
}

function plainWords(entries: Signification[]): string[] {
  const out: string[] = [];
  for (const s of entries.filter(plainSource)) {
    for (const raw of s.word.split(/,\s*/)) {
      const it = raw.trim().replace(/^and /, "");
      if (!it || /^with /.test(it) || / if |in a (day|night) birth/.test(it) || PLAIN_SKIP.test(it)) continue;
      const re = new RegExp(`\\b${escapeRe(it)}\\b`, "i");
      if (out.some((o) => re.test(o))) continue;
      out.push(PLAIN_WORD[it] ?? it);
    }
  }
  return out;
}

const listJoin = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

const AREA_PLAIN: Record<string, string> = {
  marriage: "marriage",
  children: "children",
  career: "work",
  wealth: "money",
};

function heldNote(held: Array<{ area: string; from: number }>, plain: boolean): string {
  if (!held.length) return "";
  const byAge = new Map<number, string[]>();
  for (const h of held) byAge.set(h.from, [...(byAge.get(h.from) ?? []), plain ? AREA_PLAIN[h.area] ?? h.area : h.area]);
  const parts = Array.from(byAge.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([age, areas]) => `${listJoin(areas)} from ${age}`);
  return plain
    ? ` Matters of ${listJoin(parts)} are held for later.`
    : ` Held for later: ${parts.join("; ")}.`;
}

interface Condition {
  condition: PeriodCondition;
  why: string;
  whyPlain: string;
  /** The condition in a few words with its verse, for the practitioner's timeline line. */
  tag: string;
}

const DIGNITY_PHRASE: Record<string, string> = {
  Exalted: "exalted",
  Moolatrikona: "in its moolatrikona sign",
  "Own sign": "in its own sign",
  Friendly: "in a friend's sign",
  Neutral: "in a neutral sign",
  Inimical: "in an inimical sign",
  Debilitated: "debilitated",
};

/**
 * The main period's condition: the lord's strength by sign (BPHS 47.3-4), with combustion graded as the
 * period's counted lines grade it (Phaladeepika 20.30, 20.57; combustion counted once).
 */
export function dasaCondition(d: DasaReading, positions: PlanetPosition[]): Condition {
  const p = d.lord;
  if (isNode(p))
    return {
      condition: "ungraded",
      why: `${p} has no sign dignity in this reading, so the measure of strength in 47.3-4 gives no grade; the period's own lines carry its condition.`,
      whyPlain: `${p} has no strength by sign of its own, so how these go rests on the period's other lines.`,
      tag: "not graded (47.3-4)",
    };
  const pos = positions.find((x) => x.planet === p);
  const sun = positions.find((x) => x.planet === "Sun");
  const ids = new Set(d.notes.map((n) => n.id));
  const dig = pos?.dignity ?? "—";
  if (ids.has(`${p}-pd-20-57`))
    return {
      condition: "mixed",
      why: `${Name(p)} is combust, but stands in an auspicious sign or navamsa: Mantreswara reads it as mixed, the good results coming in the second half (Phaladeepika 20.57).`,
      whyPlain: `${Name(p)} is close to the Sun (combust) but well placed by sign, so these come with mixed results, the better ones later in the period.`,
      tag: "mixed: combust, relieved by sign or navamsa (Phaladeepika 20.57)",
    };
  if (ids.has(`${p}-pd-20-30`) || (pos && sun && parashariCombust(pos, sun.lon)))
    return {
      condition: "strained",
      why: `${Name(p)} is combust, which Mantreswara counts like debilitation (Phaladeepika 20.30), and neither its sign nor its navamsa relieves it.`,
      whyPlain: `${Name(p)} is close to the Sun (combust) here, so these matters may ask for more care in this period.`,
      tag: "under strain: combust (Phaladeepika 20.30)",
    };
  // N2: a debility cancelled by Phaladeepika 7.26-29 or Jataka Parijata 7.13-14, 7.20 reads mixed here. Display only:
  // Parashara does not state the cancellation, and the period's strain lines stay counted in its lean.
  if (dig === "Debilitated" && d.debilityCancelled) {
    const c = d.debilityCancelled;
    return {
      condition: "mixed",
      why: `${Name(p)} is debilitated, but the debility is cancelled in ${c.verses}${c.less ?? ""}, so the condition reads mixed. Parashara does not state the cancellation, and the period's strain lines stay counted in its lean.`,
      whyPlain: `${Name(p)} is weak by sign, but another rule cancels that${c.less ? " in part" : ""}, so these matters may take effort before they settle.`,
      tag: `mixed: debilitated, cancelled (${c.verses})`,
    };
  }
  if (dig === "Debilitated" || dig === "Inimical")
    return {
      condition: "strained",
      why: `${Name(p)} is ${DIGNITY_PHRASE[dig]}: by 47.3-4 the effects follow the planet's strength.`,
      whyPlain: `${Name(p)} is weak by sign here, so these matters may ask for more care in this period.`,
      tag: `under strain: ${DIGNITY_PHRASE[dig]} (47.3-4)`,
    };
  if (dig === "Exalted" || dig === "Moolatrikona" || dig === "Own sign")
    return {
      condition: "supported",
      why: `${Name(p)} is ${DIGNITY_PHRASE[dig]}: by 47.3-4 a strong lord gives its effects in full.`,
      whyPlain: `${Name(p)} is strong by sign here, so these matters are favoured.`,
      tag: `supported: ${DIGNITY_PHRASE[dig]} (47.3-4)`,
    };
  return {
    condition: "moderate",
    why: `${Name(p)} is ${DIGNITY_PHRASE[dig] ?? "in a neutral sign"}, neither strong nor weak by the measure of 47.3-4; the period's own lines carry its condition.`,
    whyPlain: `${Name(p)} is neither strong nor weak by sign here, so how these go rests on the period's other lines.`,
    tag: `moderate: ${DIGNITY_PHRASE[dig] ?? "in a neutral sign"} (47.3-4)`,
  };
}

const ANTAR_WORD = { support: "favourable", strain: "trying", mixed: "mixed" } as const;

/** The sub-period's condition: its own reading in the dasa lord's chapter (BPHS ch. 52-60). */
export function antarCondition(dasaLord: Planet, a: AntarReading): Condition {
  const ch = a.entry.ch;
  const word = ANTAR_WORD[a.verdict];
  const condition: PeriodCondition = a.verdict === "support" ? "supported" : a.verdict === "strain" ? "strained" : "mixed";
  const plainTail =
    condition === "supported"
      ? "so these matters are favoured"
      : condition === "strained"
        ? "so these matters may ask for more care"
        : "so these come with mixed results";
  return {
    condition,
    why: `The sub-period's own reading in the ${dasaLord} dasa chapter (Parashara ch. ${ch}), from its placement from the lagna and from ${thePlanet(dasaLord)}, its dignity and any maraka lordship, is ${word}.`,
    whyPlain: `The sub-period's placements read ${word}, ${plainTail}.`,
    tag: `${word} (Parashara ch. ${ch})`,
  };
}

const CONDITION_WORD: Record<PeriodCondition, string> = {
  supported: "supported",
  moderate: "moderate",
  mixed: "mixed",
  strained: "under strain",
  ungraded: "not graded",
};

function build(
  level: "dasa" | "antar",
  lord: Planet,
  dasaLord: Planet,
  cond: Condition,
  opts: PeriodSignificationOptions,
): PeriodSignifications {
  const birthYear = Number(opts.birthIso.slice(0, 4)) || undefined;
  const view = significationView({ birthYear, withheld: opts.withheld });
  const all = view.shown.filter((s) => s.tier === "classical" && s.planet === lord);
  const withheldCount = opts.withheld
    ? PARASHARI_SIGNIFICATIONS.filter((s) => s.tier === "classical" && s.planet === lord && s.tags?.length).length
    : 0;
  const isHeld = heldAreasAt(opts.birthIso, opts.asOfIso);
  const seen = new Set<string>();
  const entries = all.map((s) => gateEntry(s, isHeld, seen)).filter((s): s is Signification => s !== null);
  const held = Array.from(seen)
    .map((area) => ({ area, from: AREA_ONSET[area] }))
    .sort((a, b) => a.from - b.from || a.area.localeCompare(b.area));
  const words = plainWords(entries);
  const refs = entries.map((s) => `${s.word} (${s.source === "BPHS" ? "" : "Phaladeepika "}${s.ref})`).join("; ");
  const head = level === "dasa" ? `General effects of the ${lord} dasa` : `${Name(lord)}'s significations in this sub-period`;
  const text =
    `${head} (Parashara 47.2; Phaladeepika 21.1): ${refs || "none left to show"}. ` +
    `Condition: ${CONDITION_WORD[cond.condition]}. ${cond.why}` +
    heldNote(held, false);
  const plainList = words.length ? listJoin(words) : "";
  const textPlain =
    (words.length === 1 && words[0] === "the army" && isNode(lord)
      ? `The classical lists give ${lord} one matter of its own, the army, which it shares with ${lord === "Rahu" ? "Ketu" : "Rahu"}. `
      : plainList
      ? level === "dasa"
        ? `${Name(lord)}'s own matters come forward in this period: ${plainList}. `
        : `Within it, ${thePlanet(lord)}'s own matters come forward: ${plainList}. `
      : `The classical lists give ${thePlanet(lord)} few matters of its own to show here. `) +
    cond.whyPlain +
    heldNote(held, true);
  // The life-periods graphic carries the same matters, shorter: the words alone in the plain view; the verse tags and
  // the condition tag in the practitioner view. The minor's holds are the same as above.
  const timelinePlain =
    `${lord} ${level === "dasa" ? "period" : "sub-period"}: ` +
    (plainList || "few matters of its own to show") +
    "." +
    heldNote(held, true);
  const timeline =
    `${level === "dasa" ? `${lord} dasa (Parashara 47.2; Phaladeepika 21.1)` : `${dasaLord}–${lord} bhukti`}: ` +
    `${refs || "none left to show"}; condition ${cond.tag}.` +
    heldNote(held, false);
  return {
    level,
    lord,
    dasaLord,
    entries,
    words,
    condition: cond.condition,
    why: cond.why,
    whyPlain: cond.whyPlain,
    tag: cond.tag,
    timeline,
    timelinePlain,
    held,
    withheldCount,
    text,
    textPlain,
    sources: PERIOD_SIGNIFICATION_SOURCES,
    notCounted: PERIOD_SIGNIFICATIONS_NOT_COUNTED,
  };
}

/** The main period's line. */
export function dasaSignifications(
  d: DasaReading,
  positions: PlanetPosition[],
  opts: PeriodSignificationOptions,
): PeriodSignifications {
  return build("dasa", d.lord, d.lord, dasaCondition(d, positions), opts);
}

/** A sub-period's line, read in its main period. */
export function antarSignifications(
  dasaLord: Planet,
  a: AntarReading,
  opts: PeriodSignificationOptions,
): PeriodSignifications {
  return build("antar", a.lord, dasaLord, antarCondition(dasaLord, a), opts);
}
