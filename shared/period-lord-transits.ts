/**
 * Period lords in transit (T5): Phaladeepika 20.34-38 and 20.59-61. Display only. Each reading is shown beside the
 * Parashara verdicts and is never netted into them (the text-specific rule); nothing here changes a verdict, a lean
 * or a count.
 *
 * - 20.37: the sub-period lord's own transit state, on a thin strip under the Bhukti band. Own sign or exaltation,
 *   or retrograde: happiness. Debilitation, an enemy's sign or combust: hardship. Both at once: mixed, both named,
 *   no netting (the verse gives no relief between its own clauses).
 * - 20.38: neutral marks on that strip. In a favourable sub-period, the months the Sun, and the stretches Jupiter,
 *   spends in the sub-lord's own or exaltation sign (the Devanagari's bhavanam tungam; wisdomlib's English has the
 *   exaltation only). In a trying one, the months the Sun spends in the sub-lord's debilitation or an enemy's sign.
 *   Favourable and trying are the app's own sub-period verdict (Parashara ch. 52-60); a mixed one gets no marks. The
 *   sub-lord is kept in both halves of the verse, as wisdomlib reads it; vedicpupil reads the dasa lord in the second.
 * - 20.34 and 20.35: the dasa lord's transit by house from the lagna, on a thin strip under the Dasa band. Good when
 *   the lord was supported at birth and is in its own, exaltation or a friend's sign. Hard, on the narrow reading
 *   (vedicpupil, and the Sanskrit's praptas ca), when it was strained at birth and is combust, debilitated or in an
 *   enemy's sign in transit. Wisdomlib's broader reading would mark every house a natally weak lord passes.
 * - 20.59 (Sripati, quoted): a separate mark while the dasa lord transits the lagna or the 3rd, 6th, 10th or 11th
 *   from it. Its first clause only: the saptavarga clause reads two ways and the "friend or benefic in the lagna"
 *   clause fires most months through the Moon alone.
 * - 20.36 with 20.60-61: the Moon today counted from the dasa lord's transit position (vedicpupil's reading of
 *   20.60), judged by the list 20.36 and 20.61 share. Wisdomlib counts the dasa lord's house from the natal Moon,
 *   which needs Phaladeepika 26.2's table (Panchanga code): that count is shown without a verdict.
 *
 * Natural relations by BPHS 3.55 (shared/astro.ts); combustion by the Surya Siddhanta distances (shared/combustion.ts),
 * as in the transit calendar. The nodes are not graded by 20.34, 20.35, 20.37 or 20.38: they have no sign tables in
 * the app's Parashari readings, and the mean nodes are always retrograde. They keep the house-based 20.59 clause. The
 * Moon is not drawn: it changes state about every four days, and its day reading stands in.
 */
import {
  ENEMIES,
  EXALTATION,
  FRIENDS,
  OWN_SIGNS,
  PLANET_ABBR,
  SIGNS,
  SIGN_ABBR,
  SIGN_LORD,
  dignityOf,
  fmtDegShort,
  type Planet,
  type PlanetPosition,
} from "./astro";
import { SS_COMBUST_ORB, SS_ORB_CITE, type CombustPlanet } from "./combustion";
import { HOUSE_AREAS_PLAIN, listJoin, ordH, thePlanet } from "./house-gloss";
import { AREA_ONSET, HOUSE_AREA, heldAreasAt } from "./life-stage";

export const PHALADIPIKA_CH20_VEDICPUPIL_URL = "https://vedicpupil.in/library/books/phaladipika/chapter-20";

/** The planets the server walks: every period lord but the Moon. */
export const PERIOD_TRANSIT_PLANETS = ["Sun", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as const;
/** Years from birth the strips cover, as the Saturn and Jupiter rows do. */
export const PERIOD_TRANSIT_YEARS = 100;

/** One stretch of a period lord's transit as the server samples it: sign, retrograde motion and combustion held. */
export interface LordTransitSegment {
  start: string;
  end: string;
  signIndex: number;
  retro: boolean;
  combust: boolean;
  /** Closest distance from the Sun inside the stretch, in degrees; combust stretches only. */
  closest?: number;
}
export interface LordTransitSpan {
  planet: Planet;
  start: string;
  end: string;
  segments: LordTransitSegment[];
}
export interface SignStretch {
  signIndex: number;
  start: string;
  end: string;
}
export interface PeriodTransits {
  spans: LordTransitSpan[];
  /** The Sun's sign stretches over the whole range, for 20.38. */
  sun: SignStretch[];
}

/** One wire row: [start ms, sign, flags (1 retrograde, 2 combust), closest distance from the Sun when combust]. */
export type WireRow = [number, number, number] | [number, number, number, number];
/** The compact form the server sends: epoch milliseconds, each stretch ending where the next begins. */
export interface PeriodTransitsWire {
  spans: Array<{ planet: Planet; start: string; end: string; rows: WireRow[] }>;
  sun: { end: number; rows: Array<[number, number]> };
}

/** The wire form read back into stretches with ISO instants. */
export function decodePeriodTransits(w: PeriodTransitsWire): PeriodTransits {
  const isoOf = (ms: number) => new Date(ms).toISOString();
  return {
    spans: w.spans.map((s) => ({
      planet: s.planet,
      start: s.start,
      end: s.end,
      segments: s.rows.map((r, i) => {
        const seg: LordTransitSegment = {
          start: i === 0 ? s.start : isoOf(r[0]),
          end: i + 1 < s.rows.length ? isoOf(s.rows[i + 1][0]) : s.end,
          signIndex: r[1],
          retro: (r[2] & 1) === 1,
          combust: (r[2] & 2) === 2,
        };
        if (r.length === 4) seg.closest = r[3];
        return seg;
      }),
    })),
    sun: w.sun.rows.map((r, i) => ({
      signIndex: r[1],
      start: isoOf(r[0]),
      end: isoOf(i + 1 < w.sun.rows.length ? w.sun.rows[i + 1][0] : w.sun.end),
    })),
  };
}

export type Verdict3 = "support" | "mixed" | "strain";
export type StripState = "good" | "hard" | "mixed" | "none";
/** The dasa lord's grading at birth (dasaCondition in shared/parashari-period-significations.ts), passed in. */
export type NatalCondition = "supported" | "moderate" | "mixed" | "strained" | "ungraded";

/** A Vimshottari period as the strips need it (KpPeriod in shared/kp.ts). */
export interface PeriodRef {
  lord: Planet;
  dasaLord: Planet;
  start: string;
  end: string;
}
/** A period the server is asked to walk, clipped to the years the strips cover. */
export interface LordSpan {
  level: "dasa" | "bhukti";
  period: PeriodRef;
  planet: Planet;
  start: string;
  end: string;
}

/** One piece of a strip, with its words for the hover title, the readout and the wrapped detail line. */
export interface StripPiece {
  start: string;
  end: string;
  state: StripState;
  label: string;
  short?: string;
  /** Short, for the one-line readout under the chart. */
  readout: string;
  /** For the hover title, without the dates. */
  title: string;
  /** The wrapped line under the readout. */
  matters?: string;
  current: boolean;
}
/** A neutral mark along the strip's lower edge (20.38, 20.59), shown and not counted. */
export interface StripMark {
  start: string;
  end: string;
  readout: string;
  title: string;
}
export interface Strip {
  pieces: StripPiece[];
  marks: StripMark[];
}

const NODE = (p: Planet) => p === "Rahu" || p === "Ketu";
const YEAR_MS = 365.25 * 86400e3;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const inSpan = (asOfIso: string, start: string, end: string) => {
  const t = Date.parse(asOfIso);
  return t >= Date.parse(start) && t < Date.parse(end);
};

/**
 * The periods to walk: every dasa but the Moon's, and every bhukti but those of the Moon and the nodes, clipped to
 * the first hundred years from birth. The server returns its spans in this order.
 */
export function periodLordSpans(
  vim: { dasas: PeriodRef[]; bhuktis: PeriodRef[] },
  birthIso: string,
  years = PERIOD_TRANSIT_YEARS,
): LordSpan[] {
  const from = Date.parse(birthIso);
  const to = from + years * YEAR_MS;
  const out: LordSpan[] = [];
  const add = (level: LordSpan["level"], p: PeriodRef) => {
    if (p.lord === "Moon" || (level === "bhukti" && NODE(p.lord))) return;
    const s = Math.max(Date.parse(p.start), from);
    const e = Math.min(Date.parse(p.end), to);
    if (!(e > s)) return;
    out.push({ level, period: p, planet: p.lord, start: new Date(s).toISOString(), end: new Date(e).toISOString() });
  };
  for (const d of vim.dasas) add("dasa", d);
  for (const b of vim.bhuktis) add("bhukti", b);
  return out;
}

/** The sampled span for each requested one, matched by order and checked by planet. */
function spanData(spans: LordSpan[], data: PeriodTransits, level: LordSpan["level"]): Array<{ span: LordSpan; segs: LordTransitSegment[] }> {
  const out: Array<{ span: LordSpan; segs: LordTransitSegment[] }> = [];
  spans.forEach((s, i) => {
    const d = data.spans[i];
    if (s.level === level && d && d.planet === s.planet) out.push({ span: s, segs: d.segments });
  });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// 20.37: the sub-period lord's own transit state.

export interface Verse37 {
  state: StripState;
  good: Array<"exalted" | "own" | "retrograde">;
  hard: Array<"debilitated" | "enemy" | "combust">;
}

/** 20.37 for one stretch of the sub-lord's transit. The nodes and the Moon are not graded (none). */
export function verse37(planet: Planet, seg: Pick<LordTransitSegment, "signIndex" | "retro" | "combust">): Verse37 {
  if (NODE(planet) || planet === "Moon") return { state: "none", good: [], hard: [] };
  const dig = dignityOf(planet, seg.signIndex, 15);
  const good: Verse37["good"] = [];
  const hard: Verse37["hard"] = [];
  if (dig === "Exalted") good.push("exalted");
  else if (dig === "Own sign" || dig === "Moolatrikona") good.push("own");
  if (seg.retro) good.push("retrograde");
  if (dig === "Debilitated") hard.push("debilitated");
  else if (dig === "Inimical") hard.push("enemy");
  if (seg.combust) hard.push("combust");
  const state: StripState = good.length && hard.length ? "mixed" : good.length ? "good" : hard.length ? "hard" : "none";
  return { state, good, hard };
}

const GOOD_WORD = { exalted: "exalted", own: "in its own sign", retrograde: "retrograde" } as const;
const GOOD_PLAIN = { exalted: "in its sign of exaltation", own: "in its own sign", retrograde: "retrograde" } as const;
const HARD_PLAIN = { debilitated: "in its sign of debilitation", enemy: "in an unfriendly sign", combust: "close to the Sun" } as const;
const hardWord = (h: Verse37["hard"][number], sign: number) =>
  h === "enemy" ? `in an enemy's sign (${thePlanet(SIGN_LORD[sign])}'s)` : h;
const SHORT_WORD = { exalted: "exalted", own: "own sign", retrograde: "retro", debilitated: "debilitated", enemy: "enemy's sign", combust: "combust" } as const;
/** Mantreswara's words, practitioner view only: sukha and kashta. */
const STATE_WORD: Record<StripState, string> = { good: "happiness", hard: "hardship", mixed: "mixed", none: "" };
const STATE_WORD_LONG: Record<StripState, string> = {
  good: "happiness",
  hard: "hardship",
  mixed: "happiness and hardship, both named and neither netted",
  none: "",
};
const STATE_PLAIN: Record<StripState, string> = {
  good: "a lighter stretch",
  hard: "a stretch to go gently",
  mixed: "a mixed stretch",
  none: "",
};

/** "limit 8° retrograde": the Surya Siddhanta distance that applied. */
function limitText(planet: Planet, retro: boolean): string {
  const orbs = SS_COMBUST_ORB[planet as CombustPlanet];
  if (!orbs) return "";
  return `limit ${orbs[retro ? 1 : 0]}°${retro && orbs[0] !== orbs[1] ? " retrograde" : ""}`;
}

/** " Combust: closest 6.2° from the Sun, limit 8° retrograde (Surya Siddhanta 9.6-9)." */
function combustText(planet: Planet, seg: LordTransitSegment): string {
  if (!seg.combust || seg.closest === undefined) return "";
  const near = seg.closest < 0.05 ? "passes the Sun (conjunction)" : `closest ${seg.closest.toFixed(1)}° from the Sun`;
  return ` Combust: ${near}, ${limitText(planet, seg.retro)} (${SS_ORB_CITE}).`;
}

/** The 20.37 piece for one stretch of the sub-lord's transit. */
function subLordPiece(planet: Planet, seg: LordTransitSegment, plain: boolean, asOfIso: string): StripPiece {
  const v = verse37(planet, seg);
  const ab = PLANET_ABBR[planet];
  const sign = SIGNS[seg.signIndex];
  const reasons = [...v.good.map((g) => GOOD_WORD[g]), ...v.hard.map((h) => hardWord(h, seg.signIndex))];
  const combust = combustText(planet, seg);
  let readout: string;
  let title: string;
  let matters: string | undefined;
  if (plain) {
    const who = `${cap(thePlanet(planet))}, the sub-period planet,`;
    const goodP = listJoin(v.good.map((g) => GOOD_PLAIN[g]));
    const hardP = listJoin(v.hard.map((h) => HARD_PLAIN[h]));
    readout = v.state === "none" ? `${planet} in ${sign}` : `${planet}, ${STATE_PLAIN[v.state]}`;
    matters =
      v.state === "good"
        ? `${who} is ${goodP} in this stretch, which the text reads as lighter (Phaladeepika 20.37).`
        : v.state === "hard"
          ? `${who} is ${hardP} in this stretch, a time the text asks to take gently (Phaladeepika 20.37).`
          : v.state === "mixed"
            ? `${who} is ${goodP} but also ${hardP} in this stretch. The text names both, and neither cancels the other (Phaladeepika 20.37).`
            : undefined;
    title = matters ?? `${cap(thePlanet(planet))} in ${sign}: nothing marked`;
  } else {
    const short = [...v.good, ...v.hard].map((k) => SHORT_WORD[k]);
    readout =
      v.state === "none"
        ? `${ab} ${SIGN_ABBR[seg.signIndex]}`
        : `${ab} ${SIGN_ABBR[seg.signIndex]} ${short.join(", ")}: ${STATE_WORD[v.state]}`;
    matters =
      v.state === "none"
        ? undefined
        : `20.37: ${planet} in ${sign} in transit, ${listJoin(reasons)}: ${STATE_WORD_LONG[v.state]}.${combust}`;
    title = matters ?? `${planet} in ${sign}: none of 20.37's states`;
  }
  return {
    start: seg.start,
    end: seg.end,
    state: v.state,
    label: SIGN_ABBR[seg.signIndex],
    readout,
    title,
    matters,
    current: inSpan(asOfIso, seg.start, seg.end),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// 20.38: the months the Sun (or Jupiter) brings out a sub-period's good or its hardship.

/** The signs 20.38 watches for a sub-lord: own and exaltation for the good case, debilitation and enemies' signs. */
export function verse38Signs(planet: Planet): { good: number[]; hard: number[] } {
  if (NODE(planet)) return { good: [], hard: [] };
  const ex = EXALTATION[planet]!.sign;
  const good = Array.from(new Set([...(OWN_SIGNS[planet] ?? []), ex])).sort((a, b) => a - b);
  const debil = (ex + 6) % 12;
  const hard: number[] = [];
  for (let s = 0; s < 12; s++) if (s === debil || ENEMIES[planet].includes(SIGN_LORD[s])) hard.push(s);
  return { good, hard };
}

type SignRole = "exaltation" | "debilitation" | "own" | "enemy";
function signRole(planet: Planet, sign: number): SignRole {
  const ex = EXALTATION[planet]!.sign;
  if (sign === ex) return "exaltation";
  if (sign === (ex + 6) % 12) return "debilitation";
  if (OWN_SIGNS[planet]?.includes(sign)) return "own";
  return "enemy";
}
function roleText(role: SignRole, planet: Planet, sign: number, view: "short" | "long" | "plain"): string {
  const who = view === "short" ? PLANET_ABBR[planet] : view === "plain" ? thePlanet(planet) : planet;
  if (role === "enemy")
    return view === "plain" ? `a sign unfriendly to ${who}` : view === "short" ? `enemy's sign for ${who}` : `an enemy's sign for ${who} (${thePlanet(SIGN_LORD[sign])}'s)`;
  if (role === "own") return `${who}'s own sign`;
  return view === "plain" ? `${who}'s sign of ${role}` : `${who}'s ${role}`;
}

function verse38Marks(
  span: LordSpan,
  verdict: Verdict3 | undefined,
  sun: SignStretch[],
  jupiter: SignStretch[],
  plain: boolean,
): StripMark[] {
  const sub = span.planet;
  if (NODE(sub) || !verdict || verdict === "mixed") return [];
  const signs = verse38Signs(sub);
  const want = verdict === "support" ? signs.good : signs.hard;
  const a = Date.parse(span.start);
  const b = Date.parse(span.end);
  const out: StripMark[] = [];
  const add = (mover: "Sun" | "Jupiter", list: SignStretch[]) => {
    for (const s of list) {
      if (!want.includes(s.signIndex)) continue;
      const s0 = Math.max(Date.parse(s.start), a);
      const s1 = Math.min(Date.parse(s.end), b);
      if (!(s1 > s0)) continue;
      const role = signRole(sub, s.signIndex);
      const moverAb = mover === "Sun" ? "Sun" : "Ju";
      const good = verdict === "support";
      out.push({
        start: new Date(s0).toISOString(),
        end: new Date(s1).toISOString(),
        readout: plain
          ? good
            ? "the sub-period's good shows (20.38)"
            : "a month to go gently (20.38)"
          : `${moverAb} in ${SIGN_ABBR[s.signIndex]} (${roleText(role, sub, s.signIndex, "short")}): ${good ? "good" : "hardship"} shows (20.38)`,
        title: plain
          ? good
            ? `${cap(thePlanet(mover))} in ${SIGNS[s.signIndex]}, ${roleText(role, sub, s.signIndex, "plain")}: the text says a favourable sub-period shows its good now (Phaladeepika 20.38).`
            : `The Sun in ${SIGNS[s.signIndex]}, ${roleText(role, sub, s.signIndex, "plain")}: a month to go gently in a trying sub-period (Phaladeepika 20.38).`
          : `20.38: ${thePlanet(mover)} in ${SIGNS[s.signIndex]}, ${roleText(role, sub, s.signIndex, "long")}, in a ${good ? "favourable" : "trying"} sub-period: its ${good ? "good" : "hardship"} shows.`,
      });
    }
  };
  add("Sun", sun);
  if (verdict === "support") add("Jupiter", jupiter);
  return out.sort((x, y) => Date.parse(x.start) - Date.parse(y.start));
}

/**
 * The sub-lord strip: 20.37 pieces for each bhukti walked, and 20.38 marks. Moon and node bhuktis get one blank
 * piece each, so the readout says why nothing is drawn.
 */
export function subLordStrip(
  spans: LordSpan[],
  data: PeriodTransits,
  opts: {
    bhuktis: PeriodRef[];
    verdictOf: (b: PeriodRef) => Verdict3 | undefined;
    /** Jupiter's sign stretches (the chart's hundred-year transits). */
    jupiter: SignStretch[];
    birthIso: string;
    asOfIso: string;
    plain: boolean;
  },
): Strip {
  const pieces: StripPiece[] = [];
  const marks: StripMark[] = [];
  const walked = spanData(spans, data, "bhukti");
  const from = Date.parse(opts.birthIso);
  const to = from + PERIOD_TRANSIT_YEARS * YEAR_MS;
  for (const b of opts.bhuktis) {
    if (b.lord !== "Moon" && !NODE(b.lord)) continue;
    const s = Math.max(Date.parse(b.start), from);
    const e = Math.min(Date.parse(b.end), to);
    if (!(e > s)) continue;
    const start = new Date(s).toISOString();
    const end = new Date(e).toISOString();
    const moon = b.lord === "Moon";
    pieces.push({
      start,
      end,
      state: "none",
      label: "",
      readout: opts.plain
        ? moon
          ? "the Moon, read day by day"
          : `${b.lord}, not read here`
        : moon
          ? "Mo, too fast to draw"
          : `${PLANET_ABBR[b.lord]}, not graded`,
      title: opts.plain
        ? moon
          ? "The Moon changes sign every two or three days, too fast to draw here; its day reading is on the Overview."
          : `${b.lord} has no sign of its own in these readings, so this row is left blank in its sub-period.`
        : moon
          ? "The Moon changes state about every four days: not drawn. The Moon-from-dasa-lord line (20.36, 20.60-61) is on the Overview."
          : "The nodes are not graded by 20.37-38: no sign tables in the app's Parashari readings, and the mean nodes are always retrograde.",
      current: inSpan(opts.asOfIso, start, end),
    });
  }
  for (const { span, segs } of walked) {
    for (const seg of segs) pieces.push(subLordPiece(span.planet, seg, opts.plain, opts.asOfIso));
    marks.push(...verse38Marks(span, opts.verdictOf(span.period), data.sun, opts.jupiter, opts.plain));
  }
  pieces.sort((x, y) => Date.parse(x.start) - Date.parse(y.start));
  return { pieces: mergePieces(pieces), marks: mergeMarks(marks) };
}

// ---------------------------------------------------------------------------------------------------------------
// 20.34, 20.35 and 20.59: the dasa lord's transit by house from the lagna.

export type Why34 = "exalted" | "own" | "friend" | "debilitated" | "enemy" | "combust";
export interface Verse34 {
  state: "good" | "hard" | "none";
  /** What placed it. */
  why: Why34[];
  /** Why neither verse applies, for the practitioner. */
  because?: string;
}

/** 20.34 (supported at birth, own, exaltation or a friend's sign) and 20.35 on the narrow reading. */
export function verse34(planet: Planet, natal: NatalCondition | undefined, seg: Pick<LordTransitSegment, "signIndex" | "combust">): Verse34 {
  if (NODE(planet) || planet === "Moon" || !natal || natal === "ungraded")
    return { state: "none", why: [], because: NODE(planet) ? "The nodes are not graded by 20.34-35; 20.59 still applies." : "Not graded at birth." };
  const dig = dignityOf(planet, seg.signIndex, 15);
  const lord = thePlanet(SIGN_LORD[seg.signIndex]);
  if (natal === "supported") {
    if (dig === "Exalted") return { state: "good", why: ["exalted"] };
    if (dig === "Own sign" || dig === "Moolatrikona") return { state: "good", why: ["own"] };
    if (dig === "Friendly") return { state: "good", why: ["friend"] };
    return { state: "none", why: [], because: `20.34 needs the lord in its own, exaltation or a friend's sign in transit; ${SIGNS[seg.signIndex]} is ${dig === "Debilitated" ? "its debilitation" : dig === "Inimical" ? `an enemy's sign (${lord}'s)` : `a neutral sign (${lord}'s)`}.` };
  }
  if (natal === "strained") {
    const why: Why34[] = [];
    if (dig === "Debilitated") why.push("debilitated");
    else if (dig === "Inimical") why.push("enemy");
    if (seg.combust) why.push("combust");
    if (why.length) return { state: "hard", why };
    return { state: "none", why: [], because: "20.35, read narrowly, needs the lord combust, debilitated or in an enemy's sign in transit as well; it is none of these here." };
  }
  return {
    state: "none",
    why: [],
    because: `20.34-35 read a lord supported or strained at birth; ${planet} was ${natal === "mixed" ? "mixed (relieved)" : "moderate"} at birth.`,
  };
}

const WHY34_SHORT: Record<Why34, string> = {
  exalted: "exalted",
  own: "own sign",
  friend: "friend's sign",
  debilitated: "debilitated",
  enemy: "enemy's sign",
  combust: "combust",
};
const WHY34_PLAIN: Record<Why34, string> = {
  exalted: "in its sign of exaltation",
  own: "in its own sign",
  friend: "in a friend's sign",
  debilitated: "in its sign of debilitation",
  enemy: "in an unfriendly sign",
  combust: "close to the Sun",
};
/** The combustion note for a run of combust stretches: the closest approach in the run and the distances that held. */
function combustRunText(planet: Planet, run: LordTransitSegment[]): string {
  const burnt = run.filter((g) => g.combust && g.closest !== undefined);
  if (!burnt.length) return "";
  const closest = Math.min(...burnt.map((g) => g.closest!));
  const flags = Array.from(new Set(burnt.map((g) => g.retro)));
  const orbs = SS_COMBUST_ORB[planet as CombustPlanet];
  const limit =
    flags.length === 1 || !orbs || orbs[0] === orbs[1]
      ? limitText(planet, flags[0])
      : `limit ${orbs[0]}° (${orbs[1]}° retrograde)`;
  const near = closest < 0.05 ? "passes the Sun (conjunction)" : `closest ${closest.toFixed(1)}° from the Sun`;
  return ` Combust: ${near}, ${limit} (${SS_ORB_CITE}).`;
}
function why34Long(w: Why34, sign: number): string {
  const lord = thePlanet(SIGN_LORD[sign]);
  return w === "exalted"
    ? "its exaltation"
    : w === "own"
      ? "its own sign"
      : w === "friend"
        ? `a friend's sign, ${lord}'s`
        : w === "debilitated"
          ? "its debilitation"
          : w === "enemy"
            ? `an enemy's sign, ${lord}'s`
            : "combust";
}

/** 20.59, first clause: the lagna, or the 3rd, 6th, 10th or 11th from it. */
export const VERSE_59_HOUSES = [1, 3, 6, 10, 11];
const NATAL_WORD: Record<NatalCondition, string> = {
  supported: "supported at birth",
  moderate: "moderate at birth",
  mixed: "mixed at birth",
  strained: "strained at birth",
  ungraded: "not graded",
};

/**
 * The dasa-lord strip: a piece per stretch of the lord's transit, labelled with the house from the lagna and coloured
 * by 20.34 and 20.35; 20.59 marks apart. The Moon's dasa gets one blank piece. The house matters go through the
 * minors' topic gate (shared/life-stage.ts): a held house is drawn blank and named only as held.
 */
export function dasaLordStrip(
  spans: LordSpan[],
  data: PeriodTransits,
  opts: {
    dasas: PeriodRef[];
    lagnaSign: number;
    natalOf: (lord: Planet) => NatalCondition | undefined;
    birthIso: string;
    asOfIso: string;
    plain: boolean;
  },
): Strip {
  const pieces: StripPiece[] = [];
  const marks: StripMark[] = [];
  const held = heldAreasAt(opts.birthIso, opts.asOfIso);
  const from = Date.parse(opts.birthIso);
  const to = from + PERIOD_TRANSIT_YEARS * YEAR_MS;
  for (const d of opts.dasas) {
    if (d.lord !== "Moon") continue;
    const s = Math.max(Date.parse(d.start), from);
    const e = Math.min(Date.parse(d.end), to);
    if (!(e > s)) continue;
    const start = new Date(s).toISOString();
    const end = new Date(e).toISOString();
    pieces.push({
      start,
      end,
      state: "none",
      label: "",
      readout: opts.plain ? "the Moon, read day by day" : "Mo, too fast to draw",
      title: opts.plain
        ? "The Moon changes sign every two or three days, too fast to draw here; its day reading is on the Overview."
        : "The Moon changes sign every two or three days: not drawn. The Moon-from-dasa-lord line (20.36, 20.60-61) is on the Overview.",
      current: inSpan(opts.asOfIso, start, end),
    });
  }
  for (const { span, segs } of spanData(spans, data, "dasa")) {
    const planet = span.planet;
    const natal = opts.natalOf(planet);
    // Runs of stretches the verses read alike: the same house, state and reasons. A retrograde change, or a
    // combustion the verses do not read for this lord, starts no new piece, and both views draw the same pieces.
    const runs: Array<{ segs: LordTransitSegment[]; h: number; isHeld: boolean; v: Verse34 }> = [];
    for (const seg of segs) {
      const h = ((seg.signIndex - opts.lagnaSign + 12) % 12) + 1;
      const area = HOUSE_AREA[h];
      const isHeld = area !== undefined && held(area);
      const v: Verse34 = isHeld ? { state: "none", why: [] } : verse34(planet, natal, seg);
      const last = runs[runs.length - 1];
      if (last && last.h === h && last.isHeld === isHeld && last.v.state === v.state && last.v.why.join() === v.why.join() && last.v.because === v.because)
        last.segs.push(seg);
      else runs.push({ segs: [seg], h, isHeld, v });
    }
    for (const { segs: run, h, isHeld, v } of runs) {
      const start = run[0].start;
      const end = run[run.length - 1].end;
      const signIndex = run[0].signIndex;
      const area = HOUSE_AREA[h];
      const ab = PLANET_ABBR[planet];
      const sign = SIGNS[signIndex];
      const areaText = HOUSE_AREAS_PLAIN[h];
      let readout: string;
      let matters: string;
      if (isHeld) {
        readout = opts.plain ? `${planet} in your ${ordH(h)}, held` : `${ab} ${ordH(h)}, held`;
        matters = `${cap(thePlanet(planet))} in the ${ordH(h)} house: held for later, read from age ${AREA_ONSET[area]}.`;
      } else if (opts.plain) {
        const who = `${cap(thePlanet(planet))}, the main-period planet,`;
        const whyP = listJoin(v.why.map((w) => WHY34_PLAIN[w]));
        readout =
          v.state === "good"
            ? `${planet} in your ${ordH(h)}, builds it`
            : v.state === "hard"
              ? `${planet} in your ${ordH(h)}, more care`
              : `${planet} in your ${ordH(h)}`;
        matters =
          v.state === "good"
            ? `${who} strong at birth and ${whyP} in the sky here, builds up your ${ordH(h)} house (${areaText}) in this stretch (Phaladeepika 20.34).`
            : v.state === "hard"
              ? `${who} was under strain at birth and is ${whyP} in the sky here. Matters of your ${ordH(h)} house (${areaText}) may ask for more care in this stretch (Phaladeepika 20.35).`
              : `${who} is passing your ${ordH(h)} house (${areaText}).`;
      } else {
        const short = v.why.map((w) => WHY34_SHORT[w]).join(", ");
        const long = listJoin(v.why.map((w) => why34Long(w, signIndex)));
        readout =
          v.state === "good"
            ? `${ab} ${ordH(h)} (${SIGN_ABBR[signIndex]} ${short}): builds (20.34)`
            : v.state === "hard"
              ? `${ab} ${ordH(h)} (${SIGN_ABBR[signIndex]} ${short}): loss (20.35)`
              : `${ab} ${ordH(h)} (${SIGN_ABBR[signIndex]})`;
        const combust = v.why.includes("combust") ? combustRunText(planet, run) : "";
        matters =
          v.state === "good"
            ? `20.34: ${planet}, ${NATAL_WORD[natal ?? "ungraded"]}, is in ${sign} in transit (${long}): it builds the matters of the ${ordH(h)} from the lagna (${areaText}).`
            : v.state === "hard"
              ? `20.35, narrow reading: ${planet}, ${NATAL_WORD[natal ?? "ungraded"]}, is in ${sign} in transit (${long}): loss to the matters of the ${ordH(h)} from the lagna (${areaText}).${combust}`
              : `${planet} in ${sign}, the ${ordH(h)} from the lagna (${areaText}). ${v.because ?? ""}`.trim();
      }
      pieces.push({
        start,
        end,
        state: v.state,
        label: ordH(h),
        short: String(h),
        readout,
        title: matters,
        matters,
        current: inSpan(opts.asOfIso, start, end),
      });
      if (VERSE_59_HOUSES.includes(h))
        marks.push({
          start,
          end,
          readout: opts.plain ? "a helpful placement (20.59)" : "good for the dasa (20.59)",
          title: opts.plain
            ? `A verse Mantreswara quotes from Sripati counts the ${ordH(h)} house as a helpful place for the main-period planet to pass (Phaladeepika 20.59).`
            : `20.59 (Sripati, quoted): the dasa is good while its lord transits the lagna or the 3rd, 6th, 10th or 11th from it; here the ${ordH(h)}.`,
        });
    }
  }
  pieces.sort((x, y) => Date.parse(x.start) - Date.parse(y.start));
  return { pieces: mergePieces(pieces), marks: mergeMarks(marks) };
}

/** Joins touching pieces that read the same (a retrograde change the dasa strip does not use, for one). */
function mergePieces(ps: StripPiece[]): StripPiece[] {
  const out: StripPiece[] = [];
  for (const p of ps) {
    const last = out[out.length - 1];
    if (last && last.end === p.start && last.state === p.state && last.readout === p.readout && last.matters === p.matters && last.label === p.label) {
      out[out.length - 1] = { ...last, end: p.end, current: last.current || p.current };
    } else out.push(p);
  }
  return out;
}
function mergeMarks(ms: StripMark[]): StripMark[] {
  const out: StripMark[] = [];
  for (const m of ms) {
    const last = out[out.length - 1];
    if (last && last.end === m.start && last.readout === m.readout && last.title === m.title) out[out.length - 1] = { ...last, end: m.end };
    else out.push(m);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// 20.36 with 20.60-61: the Moon today, counted from the dasa lord's transit position.

/** The houses from the dasa lord that 20.36 and 20.61 share: the upachayas, the 5th and 9th, and the 7th. */
export const VERSE_36_HOUSES = [3, 6, 10, 11, 5, 9, 7];

export interface MoonToday {
  /** good: 20.36 and 20.61 agree; trouble: 20.36's "elsewhere"; both: the 1st, which the verses read two ways;
   *  open: a Moon dasa on a day its sign part does not fire, when the count from itself cannot be read. */
  tone: "good" | "trouble" | "both" | "open";
  what: string;
  line: string;
  /** Practitioner detail; undefined in the plain view. */
  detail?: string;
}

/**
 * The Moon today from the dasa lord (Phaladeepika 20.36, 20.60 as vedicpupil reads it, 20.61). `now` holds the
 * positions at the reading instant; `natal` the birth positions, for wisdomlib's count from the natal Moon.
 */
export function moonFromDasaLord(dasaLord: Planet, now: PlanetPosition[], natal: PlanetPosition[], plain: boolean): MoonToday | null {
  const moon = now.find((p) => p.planet === "Moon");
  const lord = now.find((p) => p.planet === dasaLord);
  const natalMoon = natal.find((p) => p.planet === "Moon");
  if (!moon || !lord || !natalMoon) return null;
  const node = NODE(dasaLord);
  const self = dasaLord === "Moon";
  const count = ((moon.signIndex - lord.signIndex + 12) % 12) + 1;
  const ex = node ? undefined : EXALTATION[dasaLord]?.sign;
  const signLord = SIGN_LORD[moon.signIndex];
  const exalt = ex !== undefined && moon.signIndex === ex;
  const friend = !node && FRIENDS[dasaLord].includes(signLord);
  const signGood = exalt || friend;
  const countGood = !self && VERSE_36_HOUSES.includes(count);
  const tone: MoonToday["tone"] = signGood || countGood ? "good" : self ? "open" : count === 1 ? "both" : "trouble";
  const sign = SIGNS[moon.signIndex];
  const lordSign = SIGNS[lord.signIndex];
  const dl = thePlanet(dasaLord);
  // A Moon dasa reads the sign part only: the signs of its exaltation and of its friends.
  const selfSigns = self
    ? SIGNS.filter((_, i) => i === EXALTATION.Moon!.sign || FRIENDS.Moon.includes(SIGN_LORD[i]))
    : [];
  if (plain) {
    const where = exalt
      ? `in ${sign}, where ${dl}, the main-period planet, is exalted`
      : friend
        ? `in ${sign}, the sign of ${thePlanet(signLord)}, a friend of ${dl}, the main-period planet`
        : "";
    const line =
      tone === "good"
        ? countGood
          ? `Today the Moon is ${ordH(count)} from ${dl}, the main-period planet: a helpful day (Phaladeepika 20.36, 20.61).`
          : `Today the Moon is ${where}: a helpful day (Phaladeepika 20.36, 20.61).`
        : tone === "both"
          ? `Today the Moon is with ${dl}, the main-period planet. Phaladeepika's two verses on this differ on such a day (20.36, 20.61).`
          : tone === "open"
            ? `The Moon runs the main period itself, so this day reading only marks the days it passes ${listJoin(selfSigns.map(String)).replace(/ and /, " or ")}, which the text calls helpful (Phaladeepika 20.36). Today it is in ${sign}.`
            : `Today the Moon is ${ordH(count)} from ${dl}, the main-period planet: a day to go gently (Phaladeepika 20.36).`;
    return { tone, what: "The Moon today", line };
  }
  const signWhy = exalt ? `${dasaLord}'s exaltation sign` : friend ? `the sign of ${dasaLord}'s friend ${signLord}` : "";
  const vp = "20.60 as vedicpupil reads it";
  const line =
    tone === "good"
      ? `Moon in ${sign}${signWhy ? `, ${signWhy}` : ""}${self ? "" : `, ${ordH(count)} from ${dasaLord} in transit (${lordSign})`}: good (20.36, 20.61${self ? "" : `; ${vp}`}).`
      : tone === "both"
        ? `Moon in ${sign}, with ${dasaLord} in transit (the 1st from it). 20.36's list leaves the 1st out, so trouble by it; 20.61's trikona may count the 1st. Not judged.`
        : tone === "open"
          ? `Moon dasa: the count from the dasa lord cannot be read. The Moon in ${sign} is in neither its exaltation nor a friend's sign (${selfSigns.join(", ")} would be), so 20.36 gives no reading today.`
          : `Moon in ${sign}, ${ordH(count)} from ${dasaLord} in transit (${lordSign}), in neither ${dasaLord}'s exaltation nor a friend's sign: trouble (20.36; ${vp}).`;
  const fromNatal = ((lord.signIndex - natalMoon.signIndex + 12) % 12) + 1;
  const detail = [
    `Now: the Moon ${fmtDegShort(moon.lon)} ${sign}, ${dl} ${fmtDegShort(lord.lon)} ${lordSign}${lord.retrograde && !node ? " retrograde" : ""}.`,
    node ? "The nodes have no exaltation or friendship tables in the app's Parashari readings, so only the count is read." : "",
    self
      ? ""
      : `Wisdomlib's 20.60 counts the other way, the dasa lord's house from the Moon: ${dl} is ${ordH(fromNatal)} from the natal Moon (${SIGNS[natalMoon.signIndex]}). That count needs Phaladeepika 26.2's table, which the Panchanga tab uses, and is not judged here.`,
  ]
    .filter(Boolean)
    .join(" ");
  return { tone, what: "Moon from the dasa lord", line, detail };
}

// ---------------------------------------------------------------------------------------------------------------
// Notes under the life-periods graphic.

export const PERIOD_LORD_STRIPS_NOTE_PLAIN =
  "The thin Transit row under each period row follows that period's planet through the sky. Under the main period it names the house the planet is passing: green where the text says a planet strong at birth builds that house (Phaladeepika 20.34), pale red where a planet under strain at birth may ask for more care there (20.35), and a dark tick where a verse the text quotes calls the house a helpful place for the period (20.59). Under the sub-period, green is a lighter stretch and pale red a stretch to go gently (20.37); dark ticks mark the months the Sun, or Jupiter, brings out a good sub-period's good, or asks for a gentler pace in a trying one (20.38). These rows sit beside the period's own tone and change nothing in it. The Moon moves too fast to draw; its day reading is on the Overview.";

export const PERIOD_LORD_STRIPS_NOTE =
  "Transit rows, Phaladeepika ch. 20, shown and not counted. Under the dasa: the dasa lord's sign by house from the lagna, good by 20.34 (supported at birth, and in its own, exaltation or a friend's sign in transit) and hard by 20.35 read narrowly (strained at birth, and combust, debilitated or in an enemy's sign in transit; wisdomlib's broader reading would mark every house a natally weak lord passes, for its whole dasa). Ticks: 20.59's first clause (Sripati, quoted: the lagna, 3rd, 6th, 10th or 11th; wisdomlib prints the heading that makes it a transit rule, vedicpupil reads birth placements; the saptavarga and friend-or-benefic clauses are left out). Under the bhukti: 20.37's state of the sub-lord (own sign, exaltation or retrograde: happiness; debilitation, an enemy's sign or combust: hardship; both at once: mixed, both named, not netted). Ticks: 20.38 in a favourable bhukti, the Sun or Jupiter in the sub-lord's own or exaltation sign (the Devanagari; wisdomlib's English has the exaltation only), and in a trying one, the Sun in its debilitation or an enemy's sign. Favourable and trying are the antar verdict (ch. 52-60); a mixed bhukti has no ticks. The sub-lord is kept in both halves of 20.38 as wisdomlib reads it; vedicpupil reads the dasa lord in the second. Natural relations BPHS 3.55; combustion by the Surya Siddhanta distances. The nodes are not graded (no sign tables; the mean nodes are always retrograde) and keep 20.59; the Moon is not drawn.";
