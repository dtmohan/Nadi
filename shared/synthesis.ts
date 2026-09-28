// Plain-reading layer over the BNN rule findings.
//
// The rule engine reports every rule that fires. A reader who is not a practitioner needs the
// opposite: one verdict per life area, the two or three signatures that carry it, and a plain
// sentence when the findings pull in different directions (promise against delay). Everything
// the engine produced stays available as "the working".

import type { Planet } from "./astro";
import {
  LIFE_AREAS,
  areaKaraka,
  type Finding,
  type LifeArea,
  type Reading,
} from "./rules";
import type { Gender } from "./marriage";

export type Tone = "good" | "hard" | "neutral";
export type AreaTone =
  | "supportive"
  | "mixed"
  | "care"
  | "contested"
  | "quiet";

export const AREA_TONE_LABEL: Record<AreaTone, string> = {
  supportive: "Supportive",
  mixed: "Mixed",
  care: "Needs care",
  contested: "Contested",
  quiet: "Lightly marked",
};

/**
 * An area is contested when its strongest supportive rule and its strongest hard rule are of
 * comparable weight: each at least CONTEST_FLOOR and within CONTEST_RATIO of the other. Summing
 * such rules into one balance would hide the disagreement; the honest verdict names both. The
 * thresholds are the app's own convention (provisional), not a Nadi rule.
 */
export const CONTEST_FLOOR = 2;
export const CONTEST_RATIO = 0.8;
/** Areas with an outcome to contest; temperament, learning, travel and the inner life are descriptive. */
export const CONTEST_AREAS = new Set<LifeArea>([
  "marriage",
  "children",
  "career",
  "family",
  "wealth",
  "health",
]);

export interface AreaContest {
  /** The strongest supportive rule. */
  good: Finding;
  /** The strongest hard rule. */
  hard: Finding;
}

export interface AreaSynthesis {
  area: LifeArea;
  tone: AreaTone;
  /** One or two sentences a non-practitioner can act on. */
  headline: string;
  /** The findings that carry the verdict, strongest first, after deduplication. */
  key: Finding[];
  /** Everything else that fired in the area, for the working. */
  rest: Finding[];
  /** Why some findings were demoted: ruleId → ruleId of the finding that covers it. */
  coveredBy: Record<string, string>;
  /** Plain sentence reconciling promise against delay or denial, when both are present. */
  reconciliation?: string;
  /** Set when the tone is "contested": the two rules that pull opposite ways. */
  contest?: AreaContest;
  /** Weighted balance: positive leans good, negative leans hard. */
  balance: number;
  total: number;
}

// Stems, anchored on the left only, so "delays", "disputes" and "tempered" all count.
const HARD =
  /\b(delay|late\b|later\b|slow|strain|loss|losses|lose|difficult|deni|care\b|cares\b|careful|accident|surg|injur|separat|estrang|obstacl|obstruct|disput|quarrel|worr|anxi|hardship|drain|reduc|interrupt|haste|hasty|guard|watch|friction|rift|rival|debt|illness|ailment|chronic|toxic|allerg|phobia|numb|disturb|burden|struggl|scatter|unstable|instab|break|broken|cold\b|harsh|secretive|deceit|fraud|litigat|dishonour|fall\b|frustrat|restless|erratic|tension|conflict|weak|lesser|absen|childless|ration|resist|blocked|stiff|complaint|pressure|low mood|temper|impulsiv|excess|over-?confiden|overwork|expens|spend|lost\b|humbl|servitude|austere|isolat|lonel|adverse|shadow|irregular|egoist|doubtful|caution|doubt|delicate|fewer|denial|trouble|hard-?to-?diagnose|withdraw|reversal|hazard|dangerous|short-tempered|tales|defers)/i;
const GOOD =
  /\b(prosper|strong|wealth|gain|support|respect|growth|harmon|success|authority|promis|fortun|good\b|blessed|learned|articulate|dignit|honour|comfort|refined|steady|holds?\b|secure|stable|stabilit|assured|rise|rises|recognition|leadership|generous|devoted|happy|happiness|fulfil|abundan|property|vehicles|inheritance|status|fame|eloquen|wisdom|wise|talent|skill|aptitude|expert|scholar|teacher|advis|early\b|readily|ease\b|smooth|helpful|kind\b|caring|loyal|faithful|long life|longevity|vigour|recover|protect|shelter|favour|benefit|lucky|luck\b|nurturing|calm|graceful|popular|courage|excellent|central|bond\b)/i;

/** Rule ids whose reading tone the keyword scan gets wrong. */
const TONE_OVERRIDE: Record<string, Tone> = {
  "h-ju-8-sa": "neutral",
  "h-ju-6-ma": "good",
};

export function toneOf(f: Finding): Tone {
  const o = TONE_OVERRIDE[f.ruleId];
  if (o) return o;
  return toneOfText(f.text);
}

/** Keyword balance of a rule sentence, for texts that carry no explicit tone (ALP, KP cusp readings). */
export function toneOfText(text: string): Tone {
  const t = text.replace(/^[^:]*:\s*/, ""); // judge the gist, not the label
  const hard = (t.match(new RegExp(HARD.source, "gi")) ?? []).length;
  const good = (t.match(new RegExp(GOOD.source, "gi")) ?? []).length;
  if (hard === 0 && good === 0) return "neutral";
  if (hard > good) return "hard";
  if (good > hard) return "good";
  return "neutral";
}

export function gist(text: string): string {
  const i = text.indexOf(": ");
  const g = i >= 0 && i < 80 ? text.slice(i + 2) : text;
  return g.replace(/\.$/, "");
}

/** Up to the first full stop or semicolon, so two gists join into one readable sentence. */
export function firstClause(g: string): string {
  const m = g.match(/^[^.;]+/);
  return (m ? m[0] : g).trim();
}

const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const uc = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const sameSet = (a: Planet[], b: Planet[]) =>
  a.length === b.length && a.every((p) => b.includes(p));
const subset = (a: Planet[], b: Planet[]) =>
  a.length < b.length && a.every((p) => b.includes(p));

/**
 * Deduplicate an area's findings: a three- or four-planet combination covers the pairs inside it,
 * and when two rules fire on the same planets the stronger one speaks for both.
 */
export function dedupe(items: Finding[]): {
  keep: Finding[];
  demoted: Finding[];
  coveredBy: Record<string, string>;
} {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const coveredBy: Record<string, string> = {};
  for (const f of sorted) {
    if (coveredBy[f.ruleId]) continue;
    for (const g of sorted) {
      if (g === f || coveredBy[g.ruleId]) continue;
      if (g.planets.length < 2) continue; // sign, element and nakshatra rules are separate facts
      if (subset(g.planets, f.planets) && f.planets.length >= 3)
        coveredBy[g.ruleId] = f.ruleId;
      else if (
        sameSet(g.planets, f.planets) &&
        g.score <= f.score &&
        g.house === f.house
      )
        coveredBy[g.ruleId] = f.ruleId;
    }
  }
  return {
    keep: sorted.filter((f) => !coveredBy[f.ruleId]),
    demoted: sorted.filter((f) => coveredBy[f.ruleId]),
    coveredBy,
  };
}

const PROMISE =
  /\b(promis|strong|prosper|assured|steady|supportive|blessed|fortun|raises the native)/i;
const DELAY =
  /\b(delay|late marriage|later\b|late\b|long wait|slow(ly)? to|patien|second round)/i;
const DENIAL = /\b(deni|loss|separat|estrang|childless|absence|absent|break)/i;
/** Areas where promise against delay is the question a reader actually asks. */
const RECONCILE_AREAS = new Set<LifeArea>([
  "marriage",
  "children",
  "wealth",
  "career",
]);
const DELAYERS = new Set<Planet>(["Saturn", "Rahu", "Ketu", "Mars", "Sun"]);

function planetsList(ps: Planet[]): string {
  if (ps.length <= 1) return ps[0] ?? "";
  return `${ps.slice(0, -1).join(", ")} and ${ps[ps.length - 1]}`;
}

function reconcile(
  area: LifeArea,
  all: Finding[],
  karaka: Planet,
): string | undefined {
  if (!RECONCILE_AREAS.has(area)) return undefined;
  const promise = all.filter(
    (f) => PROMISE.test(f.text) && toneOf(f) !== "hard",
  );
  const delay = all.filter((f) => DELAY.test(f.text));
  const denial = all.filter((f) => DENIAL.test(f.text));
  const agents = (fs: Finding[]) =>
    Array.from(
      new Set(
        fs
          .flatMap((f) => f.planets)
          .filter((p) => p !== karaka && DELAYERS.has(p)),
      ),
    );
  const noun = LIFE_AREAS[area].label.split(" &")[0].toLowerCase();
  if (promise.length && (delay.length || denial.length)) {
    const slow = agents([...delay, ...denial]);
    const who = slow.length
      ? planetsList(slow.slice(0, 3))
      : "the slower planets";
    return `The promise is there; ${who} ${slow.length === 1 ? "slows" : "slow"} it: later rather than never. The harder lines describe the road, not the destination.`;
  }
  if (!promise.length && delay.length >= 2) {
    return `Most of what fires here is about timing rather than outcome: ${noun} ${noun.endsWith("s") || noun === "children" ? "come" : "comes"} later than average, not less.`;
  }
  return undefined;
}

function areaTone(
  balance: number,
  total: number,
  hardCount: number,
  goodCount: number,
): AreaTone {
  if (total === 0) return "quiet";
  if (goodCount && hardCount && Math.abs(balance) < 1.5) return "mixed";
  if (balance >= 1.5) return "supportive";
  if (balance <= -1.5) return "care";
  return total >= 2 ? "mixed" : "quiet";
}

function headlineFor(
  area: LifeArea,
  tone: AreaTone,
  key: Finding[],
  reading: Reading,
  reconciled: boolean,
): string {
  if (area === "marriage" && reading.marriage.headline)
    return reading.marriage.headline;
  if (area === "children" && reading.children.headline) {
    // When Saturn or Rahu delay the promise, let the reconciliation speak about timing.
    return reconciled
      ? reading.children.headline.replace(/,? and come without much delay/, "")
      : reading.children.headline;
  }
  const gists = key.slice(0, 2).map((f) => lc(firstClause(gist(f.text))));
  if (!gists.length)
    return "Few Nadi signatures fall here; the chart says little about this area on its own.";
  const lead: Record<AreaTone, string> = {
    supportive: "Well supported.",
    mixed: "A mixed picture.",
    care: "Asks for care.",
    contested: "The strong rules disagree.",
    quiet: "Lightly marked.",
  };
  return `${lead[tone]} ${uc(gists[0])}${gists[1] ? `; ${gists[1]}` : ""}.`;
}

/** Headline for a contested area: both sides named, the supportive one first. */
function contestedHeadline(c: AreaContest): string {
  // Drop a parenthesis the clause cut open, e.g. "... path (provisional wording".
  const clean = (t: string) => t.replace(/\s*\([^)]*$/, "");
  const g = lc(clean(firstClause(gist(c.good.text))));
  const h = lc(clean(firstClause(gist(c.hard.text))));
  return `The strong rules disagree. ${uc(g)}; yet ${h}. Read both before deciding.`;
}

/**
 * A hard finding that speaks only of timing ("delayed", "later", "a long wait") does not contest a
 * promise; promise against delay is reconciled as "later rather than never" below. Only a hard
 * finding about the outcome itself (austere, denied, hazardous, loss) can contest.
 */
function timingOnly(f: Finding): boolean {
  const t = gist(f.text);
  const hard = (t.match(new RegExp(HARD.source, "gi")) ?? []).length;
  const delay = (t.match(new RegExp(DELAY.source, "gi")) ?? []).length;
  return hard <= delay;
}

/**
 * A contest needs two rules that assert opposite outcomes for the same matter, not two rules that
 * describe different kinds of it. A reading of what the work is (vehicles, mining, design) carries
 * incidental tone words ("profit", "hazardous") but no verdict; only a text that promises,
 * denies, delays, breaks or loses states an outcome that another rule can contradict.
 */
const OUTCOME_GOOD =
  /\b(promis\w*|assured|blessed|granted|comes? (early|in time|on time)|happy|happiness|harmon\w*|steady|secure|stable|stabilit\w*|fulfil\w*|prosper\w*|gain(s|ed)?\b|success\w*|rise[sn]?\b|recognition|abundan\w*|holds? firm|well[- ]placed|supported|favour\w*|fortunate|wealth grows|children (come|are granted)|marriage (comes|is granted|is promised)|long and settled)\b/i;
const OUTCOME_HARD =
  /\b(deni\w*|delay\w*|late\b|much later|austere|strain\w*|separat\w*|estrang\w*|break\w*|broken|loss(es)?\b|lose[sr]?\b|childless|no (marriage|children|issue)|obstacl\w*|obstruct\w*|fails?\b|failure|decline[sd]?\b|reduc\w*|unstable|instab\w*|rift|friction|disput\w*|quarrel\w*|debt\w*|hardship|struggl\w*|interrupt\w*|setback\w*|dismiss\w*|demot\w*|scatter\w*|drain\w*|troubled|unhappy|cold\b|distant)\b/i;

/** In marriage and children a favourable description of the spouse or child presupposes the event a denial or delay disputes. */
const PRESUPPOSES = /\b(spouse|partner|wife|husband|marriage|children|child|son|daughter|progeny)\b/i;

function assertsOutcome(f: Finding, tone: "good" | "hard", area: LifeArea): boolean {
  const g = f.text.replace(/^[^:]*:\s*/, "");
  if (tone === "hard") return OUTCOME_HARD.test(g);
  if (OUTCOME_GOOD.test(g)) return true;
  return (area === "marriage" || area === "children") && PRESUPPOSES.test(g);
}

export function findContest(
  area: LifeArea,
  keep: Finding[],
): AreaContest | undefined {
  if (!CONTEST_AREAS.has(area)) return undefined;
  let good: Finding | undefined;
  let hard: Finding | undefined;
  for (const f of keep) {
    const t = toneOf(f);
    if (t === "good" && assertsOutcome(f, "good", area) && (!good || f.score > good.score)) good = f;
    else if (
      t === "hard" &&
      !timingOnly(f) &&
      assertsOutcome(f, "hard", area) &&
      (!hard || f.score > hard.score)
    )
      hard = f;
  }
  if (!good || !hard) return undefined;
  const lo = Math.min(good.score, hard.score);
  const hi = Math.max(good.score, hard.score);
  if (lo < CONTEST_FLOOR || lo < CONTEST_RATIO * hi) return undefined;
  return { good, hard };
}

export function synthesizeArea(
  area: LifeArea,
  items: Finding[],
  reading: Reading,
  gender: Gender,
): AreaSynthesis {
  const { keep, demoted, coveredBy } = dedupe(items);
  let balance = 0;
  let hardCount = 0;
  let goodCount = 0;
  for (const f of keep) {
    const t = toneOf(f);
    if (t === "good") {
      balance += f.score;
      goodCount++;
    } else if (t === "hard") {
      balance -= f.score;
      hardCount++;
    }
  }
  const contest = findContest(area, keep);
  const tone = contest
    ? "contested"
    : areaTone(balance, keep.length, hardCount, goodCount);
  // In a contested area the two opposed rules lead the key findings, whatever their rank.
  const key = contest
    ? [
        contest.good,
        contest.hard,
        ...keep.filter((f) => f !== contest.good && f !== contest.hard),
      ].slice(0, 3)
    : keep.slice(0, 3);
  const rest = [...keep.filter((f) => !key.includes(f)), ...demoted];
  const karaka = areaKaraka(area, gender);
  const reconciliation = reconcile(area, keep, karaka);
  return {
    area,
    tone,
    headline: contest
      ? contestedHeadline(contest)
      : headlineFor(area, tone, key, reading, Boolean(reconciliation)),
    key,
    rest,
    coveredBy,
    reconciliation,
    contest,
    balance: Math.round(balance * 100) / 100,
    total: items.length,
  };
}

export function synthesize(
  reading: Reading,
  gender: Gender,
  findings: Finding[] = reading.findings,
): AreaSynthesis[] {
  const out: AreaSynthesis[] = [];
  for (const area of Object.keys(LIFE_AREAS) as LifeArea[]) {
    const items = findings.filter((f) => f.area === area);
    if (!items.length) continue;
    out.push(synthesizeArea(area, items, reading, gender));
  }
  return out;
}
