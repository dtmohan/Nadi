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
export type AreaTone = "supportive" | "mixed" | "care" | "quiet";

export const AREA_TONE_LABEL: Record<AreaTone, string> = {
  supportive: "Supportive",
  mixed: "Mixed",
  care: "Needs care",
  quiet: "Lightly marked",
};

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
    quiet: "Lightly marked.",
  };
  return `${lead[tone]} ${uc(gists[0])}${gists[1] ? `; ${gists[1]}` : ""}.`;
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
  const tone = areaTone(balance, keep.length, hardCount, goodCount);
  const key = keep.slice(0, 3);
  const rest = [...keep.slice(3), ...demoted];
  const karaka = areaKaraka(area, gender);
  const reconciliation = reconcile(area, keep, karaka);
  return {
    area,
    tone,
    headline: headlineFor(area, tone, key, reading, Boolean(reconciliation)),
    key,
    rest,
    coveredBy,
    reconciliation,
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
