// Event check for the karakatwa line beside the periods (provisional; display only).
//
// Question: at the public figures' dated events, do the running period lords' own significations name the
// event's matter more often than at other dates, and does the line's condition lean the way the event went?
// This measures the line against events; it says nothing about how faithfully the line follows its verses
// (that is in period-significations.test.ts).
//
// Matters with a classical karaka in the table (parashari-significations.ts, classical tier): father,
// mother, spouse (the spouse's passing), marriage and child. The other matters in the fixture (job,
// education, abroad, business, job loss, illness) have no single karaka there and are left out.
// Agreement: a loss (father, mother, spouse) agrees with a naming line "under strain"; a marriage or a
// birth with one "supported". Mixed, moderate and ungraded lines neither agree nor oppose.
//
// Two controls, 200 sets each, seeded (mulberry32, as server/validate.ts), so the run is reproducible:
//  - random dates: each event moved to a date drawn uniformly from the span the figure's events cover,
//    as Validate's chance baseline does;
//  - shuffled dates: each figure's scored events trade dates among themselves, which keeps the dates and
//    breaks only the pairing of matter and date.
// p is the share of control sets that reach the real count (one-sided). With 42 events in 8 charts the
// check is small; read it as a screen, not a verdict.
//
// Run from the repository root: npx tsx scripts/eval-period-significations.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Chart } from "@shared/schema";
import { computeChart } from "../server/routes";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import type { DasaReading } from "@shared/parashari-dasa";
import { lifeAsOf, sensitiveGate } from "@shared/life-stage";
import {
  antarSignifications,
  dasaSignifications,
  type PeriodCondition,
  type PeriodSignifications,
} from "@shared/parashari-period-significations";

const AS_OF = "2026-01-01T00:00:00.000Z";
const TRIALS = 200;

const MATTER: Record<string, { re: RegExp; loss: boolean }> = {
  father: { re: /\bfather\b/i, loss: true },
  mother: { re: /\bmother\b/i, loss: true },
  spouse: { re: /\b(wife|husband|marriage)\b/i, loss: true },
  marriage: { re: /\b(wife|husband|marriage)\b/i, loss: false },
  // "Adopted son" (Mercury, Phaladeepika 2.25) is not the birth of a child.
  child: { re: /(?<!adopted )\bsons?\b/i, loss: false },
};

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Figure {
  name: string;
  events: Array<{ id: string; matter: string; date: string }>;
  dasas: DasaReading[];
  line: (d: DasaReading, antarIdx: number | null) => PeriodSignifications;
}

const fx = JSON.parse(readFileSync(join(process.cwd(), "scripts/fixtures/public-figures.json"), "utf8")).charts;
const figures: Figure[] = fx.map((c: Record<string, unknown> & { name: string; events: Figure["events"] }) => {
  const chart = { id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, ...c } as unknown as Chart;
  const r = computeChart(chart);
  const lifeAt = lifeAsOf(chart, AS_OF);
  const withheld = sensitiveGate(chart, r.utc, AS_OF).withheld;
  const par = computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, lifeAt, r.shadbala, r.dasaStarts, DEFAULT_ASPECT_FLOOR, withheld, "rashi");
  const opts = { birthIso: r.utc, asOfIso: lifeAt, withheld };
  const cache = new Map<string, PeriodSignifications>();
  const line = (d: DasaReading, i: number | null) => {
    const key = `${d.lord}-${d.start}-${i}`;
    let k = cache.get(key);
    if (!k) {
      k = i === null ? dasaSignifications(d, r.positions, opts) : antarSignifications(d.lord, d.antars[i], opts);
      cache.set(key, k);
    }
    return k;
  };
  return { name: c.name, events: c.events, dasas: par.dasaReadings, line };
});

/** The main period and sub-period lines running at a date (ms). */
function linesAt(f: Figure, ms: number): PeriodSignifications[] {
  const d = f.dasas.find((x) => Date.parse(x.start) <= ms && ms < Date.parse(x.end));
  if (!d) return [];
  const i = d.antars.findIndex((a) => Date.parse(a.start) <= ms && ms < Date.parse(a.end));
  return i < 0 ? [f.line(d, null)] : [f.line(d, null), f.line(d, i)];
}

const plainText = (k: PeriodSignifications) => k.words.join(", ");
const fullText = (k: PeriodSignifications) => k.entries.map((s) => s.word).join(", ");

interface Score {
  plain: number;
  full: number;
  agree: number;
  oppose: number;
  dasaFull: number;
  antarFull: number;
}

function scoreEvent(f: Figure, matter: string, ms: number): Score {
  const m = MATTER[matter];
  const ls = linesAt(f, ms);
  const naming = ls.filter((k) => m.re.test(fullText(k)));
  const want: PeriodCondition = m.loss ? "strained" : "supported";
  const against: PeriodCondition = m.loss ? "supported" : "strained";
  return {
    plain: ls.some((k) => m.re.test(plainText(k))) ? 1 : 0,
    full: naming.length ? 1 : 0,
    agree: naming.some((k) => k.condition === want) ? 1 : 0,
    oppose: naming.some((k) => k.condition === against) ? 1 : 0,
    dasaFull: naming.some((k) => k.level === "dasa") ? 1 : 0,
    antarFull: naming.some((k) => k.level === "antar") ? 1 : 0,
  };
}

const KEYS: Array<keyof Score> = ["plain", "full", "agree", "oppose", "dasaFull", "antarFull"];
const zero = (): Score => ({ plain: 0, full: 0, agree: 0, oppose: 0, dasaFull: 0, antarFull: 0 });
const add = (a: Score, b: Score) => {
  for (const k of KEYS) a[k] += b[k];
};

// The real events.
const real = zero();
const byMatter = new Map<string, Score & { n: number }>();
const rows: string[] = [];
let n = 0;
for (const f of figures)
  for (const e of f.events) {
    if (!MATTER[e.matter]) continue;
    n++;
    const ms = Date.parse(`${e.date}T12:00:00Z`);
    const s = scoreEvent(f, e.matter, ms);
    add(real, s);
    const bm = byMatter.get(e.matter) ?? { ...zero(), n: 0 };
    add(bm, s);
    bm.n++;
    byMatter.set(e.matter, bm);
    const ls = linesAt(f, ms);
    rows.push(
      `${f.name.padEnd(17)} ${e.date} ${e.matter.padEnd(8)} ${ls.map((k) => `${k.lord}[${k.condition}${MATTER[e.matter].re.test(fullText(k)) ? "*" : ""}]`).join(" / ")}`,
    );
  }

// Control 1: random dates in each figure's span.
const randomSets: Score[] = [];
for (let t = 0; t < TRIALS; t++) randomSets.push(zero());
const randomByMatter = new Map<string, Score[]>();
const shuffleByMatter = new Map<string, Score[]>();
for (const m of Object.keys(MATTER)) {
  randomByMatter.set(m, Array.from({ length: TRIALS }, zero));
  shuffleByMatter.set(m, Array.from({ length: TRIALS }, zero));
}
figures.forEach((f, fi) => {
  const days = f.events.map((e) => Date.parse(`${e.date}T12:00:00Z`));
  const lo = Math.min(...days);
  const hi = Math.max(...days);
  const rnd = seeded(20261025 + fi * 7919);
  for (let t = 0; t < TRIALS; t++)
    for (const e of f.events) {
      if (!MATTER[e.matter]) continue;
      const sc = scoreEvent(f, e.matter, lo + Math.floor(rnd() * (hi - lo)));
      add(randomSets[t], sc);
      add(randomByMatter.get(e.matter)![t], sc);
    }
});

// Control 2: each figure's scored events trade dates among themselves.
const shuffleSets: Score[] = [];
for (let t = 0; t < TRIALS; t++) shuffleSets.push(zero());
figures.forEach((f, fi) => {
  const scored = f.events.filter((e) => MATTER[e.matter]);
  const rnd = seeded(91000 + fi * 104729);
  for (let t = 0; t < TRIALS; t++) {
    const dates = scored.map((e) => Date.parse(`${e.date}T12:00:00Z`));
    for (let i = dates.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [dates[i], dates[j]] = [dates[j], dates[i]];
    }
    scored.forEach((e, i) => {
      const sc = scoreEvent(f, e.matter, dates[i]);
      add(shuffleSets[t], sc);
      add(shuffleByMatter.get(e.matter)![t], sc);
    });
  }
});

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const share = (xs: number[], v: number) => xs.filter((x) => x >= v).length / xs.length;
console.log(`Scored events: ${n} (of ${figures.reduce((a, f) => a + f.events.length, 0)}), in ${figures.length} charts; ${TRIALS} sets per control.\n`);
console.log("measure      real   random mean  p(random>=real)   shuffled mean  p(shuffled>=real)");
for (const k of KEYS) {
  const rv = randomSets.map((s) => s[k]);
  const sv = shuffleSets.map((s) => s[k]);
  console.log(
    `${k.padEnd(11)} ${String(real[k]).padStart(5)}   ${mean(rv).toFixed(2).padStart(11)}  ${share(rv, real[k]).toFixed(3).padStart(15)}   ${mean(sv).toFixed(2).padStart(13)}  ${share(sv, real[k]).toFixed(3).padStart(17)}`,
  );
}
console.log("\nBy matter: real / random mean (p) / shuffled mean (p)");
for (const [m, s] of Array.from(byMatter.entries())) {
  const cell = (k: keyof Score) => {
    const rv = randomByMatter.get(m)!.map((x) => x[k]);
    const sv = shuffleByMatter.get(m)!.map((x) => x[k]);
    return `${k} ${s[k]} / ${mean(rv).toFixed(2)} (${share(rv, s[k]).toFixed(2)}) / ${mean(sv).toFixed(2)} (${share(sv, s[k]).toFixed(2)})`;
  };
  console.log(`  ${m.padEnd(8)} n=${s.n}  ${cell("plain")}  |  ${cell("full")}  |  ${cell("agree")}  |  ${cell("oppose")}`);
}
if (process.argv.includes("--rows")) {
  console.log("\nEvents (main / sub-period lord [condition], * names the matter):");
  for (const r of rows) console.log(`  ${r}`);
}
