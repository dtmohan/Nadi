// Karakatwas in the periods (display only): every main period and sub-period of the public figures,
// the conditions against their verses, the minor's gates in both views, the report, and the guard that
// keeps the line out of rules, verdicts and kernels.
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { DateTime } from "luxon";

import type { Chart, ChartResult } from "@shared/schema";
import { computeChart } from "../server/routes";
import { computeParashari, DEFAULT_ASPECT_FLOOR, type ParashariResult } from "@shared/parashari";
import type { Planet } from "@shared/astro";
import { parashariCombust } from "@shared/vargas";
import { lifeAsOf, sensitiveGate } from "@shared/life-stage";
import { plainViolations } from "@shared/gentle";
import { buildReport } from "@shared/report";
import type { ReportSection } from "@shared/report/types";
import { PARASHARI_SIGNIFICATIONS } from "@shared/parashari-significations";
import {
  antarSignifications,
  dasaSignifications,
  itemAreas,
  PERIOD_SIGNIFICATION_SOURCES,
  type PeriodSignifications,
} from "@shared/parashari-period-significations";

const FIGURES = JSON.parse(readFileSync(join(process.cwd(), "scripts/fixtures/public-figures.json"), "utf8"))
  .charts as Array<Record<string, unknown> & { name: string; deathDate: string | null }>;
const asChart = (c: Record<string, unknown>) =>
  ({ id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, ...c }) as unknown as Chart;

/** A fixed reading date for the living, so the test does not drift with the calendar. */
const AS_OF = "2026-01-01T00:00:00.000Z";

interface Read {
  name: string;
  r: ChartResult;
  par: ParashariResult;
  opts: { birthIso: string; asOfIso: string; withheld: boolean };
}

/** The figure read as the report reads it: at the reading date, or at the date of passing. */
function read(c: Record<string, unknown> & { name: string }, asOf = AS_OF): Read {
  const chart = asChart(c);
  const r = computeChart(chart);
  const lifeAt = lifeAsOf(chart, asOf);
  const withheld = sensitiveGate(chart, r.utc, asOf).withheld;
  const par = computeParashari(
    r.positions,
    r.jaimini.lagna.lon,
    r.utc,
    lifeAt,
    r.shadbala,
    r.dasaStarts,
    DEFAULT_ASPECT_FLOOR,
    withheld,
    "rashi",
  );
  return { name: c.name, r, par, opts: { birthIso: r.utc, asOfIso: lifeAt, withheld } };
}

const READS = FIGURES.map((c) => read(c));

function allLines(x: Read): Array<{ k: PeriodSignifications; where: string }> {
  const out: Array<{ k: PeriodSignifications; where: string }> = [];
  for (const d of x.par.dasaReadings) {
    out.push({ k: dasaSignifications(d, x.r.positions, x.opts), where: `${x.name} ${d.lord} dasa` });
    for (const a of d.antars)
      out.push({ k: antarSignifications(d.lord, a, x.opts), where: `${x.name} ${d.lord}-${a.lord}` });
  }
  return out;
}

const PLAIN_SKIP = /\b(longevity|grief|potency|wounds)\b/i;
const DEATH_WORDS = /\b(death|die|dies|dying|died|passing|demise|loss of)\b/i;

test("period significations: every main and sub-period of the eight public figures carries a line", () => {
  assert.equal(READS.length, 8);
  let n = 0;
  let want = 0;
  for (const x of READS) {
    assert.equal(x.par.dasaReadings.length, 9, x.name);
    // The period running at birth keeps only the sub-periods left in it; every later one has all nine.
    x.par.dasaReadings.forEach((d, i) => {
      if (i > 0) assert.equal(d.antars.length, 9, `${x.name} ${d.lord}: nine sub-periods`);
      want += 1 + d.antars.length;
    });
    for (const { k, where } of allLines(x)) {
      n++;
      assert.ok(k.entries.length > 0, `${where}: entries`);
      assert.ok(k.entries.every((s) => s.tier === "classical" && s.planet === k.lord), `${where}: classical, own lord`);
      assert.ok(k.words.length > 0, `${where}: plain words`);
      assert.match(k.text, /\(Parashara 47\.2; Phaladeepika 21\.1\): .+\. Condition: (supported|moderate|mixed|under strain|not graded)\. /, where);
      assert.doesNotMatch(`${k.text} ${k.textPlain}`, /undefined|NaN|\[object/, where);
      // Plain: words only, no verses, none of the words the gentle policy keeps out, nothing of death.
      assert.doesNotMatch(k.textPlain, /\d+\.\d+|Parashara|Phaladeepika|47\.|21\./, `${where}: plain has no verses`);
      assert.doesNotMatch(k.textPlain, PLAIN_SKIP, `${where}: gentle words`);
      assert.doesNotMatch(k.textPlain, DEATH_WORDS, `${where}: no death words`);
      assert.deepEqual(plainViolations(k.textPlain), [], `${where}: plain violations`);
      assert.deepEqual(k.sources, PERIOD_SIGNIFICATION_SOURCES);
      assert.ok(k.sources.every((s) => s.provisional), `${where}: provisional`);
      assert.deepEqual(k.held, [], `${where}: an adult has nothing held`);
    }
  }
  assert.equal(n, want, "a line for every main period and every sub-period");
  assert.ok(n > 8 * 9 * 9, `${n} lines`);
});

test("period significations: the main period's condition is the lord's strength by sign, combustion graded by Mantreswara", () => {
  const seen = new Set<string>();
  for (const x of READS) {
    const pos = (p: Planet) => x.r.positions.find((q) => q.planet === p)!;
    for (const d of x.par.dasaReadings) {
      const k = dasaSignifications(d, x.r.positions, x.opts);
      const ids = new Set(d.notes.map((n) => n.id));
      const where = `${x.name} ${d.lord} dasa`;
      seen.add(k.condition);
      if (d.lord === "Rahu" || d.lord === "Ketu") {
        assert.equal(k.condition, "ungraded", where);
        continue;
      }
      const combust = parashariCombust(pos(d.lord), pos("Sun").lon);
      const dig = pos(d.lord).dignity;
      if (combust) {
        // Combustion counted once, by Phaladeepika 20.30 and 20.57, as the period's counted lines count it.
        const relieved = ids.has(`${d.lord}-pd-20-57`);
        assert.ok(relieved || ids.has(`${d.lord}-pd-20-30`), `${where}: a Mantreswara combustion line`);
        assert.equal(k.condition, relieved ? "mixed" : "strained", where);
        assert.match(k.why, relieved ? /Phaladeepika 20\.57/ : /Phaladeepika 20\.30/, where);
      } else if (dig === "Debilitated" || dig === "Inimical") {
        assert.equal(k.condition, "strained", where);
        assert.match(k.why, /47\.3-4/);
      } else if (dig === "Exalted" || dig === "Moolatrikona" || dig === "Own sign") {
        assert.equal(k.condition, "supported", where);
        assert.match(k.why, /47\.3-4/);
      } else {
        assert.equal(k.condition, "moderate", where);
      }
    }
  }
  // The eight charts exercise every grade.
  assert.deepEqual(Array.from(seen).sort(), ["mixed", "moderate", "strained", "supported", "ungraded"]);
});

test("period significations: a sub-period's condition is its own reading in the dasa lord's chapter", () => {
  for (const x of READS)
    for (const d of x.par.dasaReadings)
      for (const a of d.antars) {
        const k = antarSignifications(d.lord, a, x.opts);
        const want = a.verdict === "support" ? "supported" : a.verdict === "strain" ? "strained" : "mixed";
        assert.equal(k.condition, want, `${x.name} ${d.lord}-${a.lord}`);
        assert.equal(k.dasaLord, d.lord);
        assert.ok(k.why.includes(`Parashara ch. ${a.entry.ch}`), `${x.name} ${d.lord}-${a.lord}: chapter`);
      }
});

test("period significations: shown, not counted; the readings are unchanged and no kernel imports the line", () => {
  for (const x of READS.slice(0, 3)) {
    const before = JSON.stringify(x.par.dasaReadings);
    allLines(x);
    assert.equal(JSON.stringify(x.par.dasaReadings), before, x.name);
  }
  const allowed = new Set(["client/src/components/parashari-panel.tsx", "shared/report/parashari.ts"]);
  const root = process.cwd();
  const importers: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && /parashari-period-significations["']/.test(readFileSync(full, "utf8")))
        importers.push(relative(root, full));
    }
  };
  for (const d of ["shared", "server", "client/src"]) walk(join(root, d));
  assert.deepEqual(importers.sort(), Array.from(allowed).sort());
});

/** The same public figure read as a child of `age`. */
function readAtAge(name: string, age: number): Read {
  const c = FIGURES.find((f) => f.name === name)!;
  const at = DateTime.fromISO(`${c.birthDate as string}T12:00:00Z`).plus({ years: age, days: 10 }).toUTC().toISO()!;
  return read({ ...c, deathDate: null }, at);
}

const heldItem = (k: PeriodSignifications, areas: string[]) =>
  [...k.entries.flatMap((s) => s.word.split(/,\s*/)), ...k.words].filter((it) => itemAreas(it).some((a) => areas.includes(a)));

test("period significations: a minor's gates hold the same matters back in both views", () => {
  const ten = readAtAge("Sachin Tendulkar", 10);
  assert.equal(ten.opts.withheld, true, "under 18: the sensitive gate is on");
  for (const { k, where } of allLines(ten)) {
    assert.deepEqual(heldItem(k, ["marriage", "children", "career", "wealth"]), [], `${where}: nothing held shows`);
    // The note that names what is held (as the topic periods do) aside, nothing of a held area shows.
    const body = (t: string) => t.replace(/ (Held for later:|Matters of) .*$/, "");
    assert.doesNotMatch(`${body(k.text)} ${body(k.textPlain)}`, /\b(longevity|potency|wife|husband|marriage|sons?|wealth|treasure-house|government service|commerce)\b|in-law/i, where);
    const tagged = PARASHARI_SIGNIFICATIONS.filter((s) => s.tier === "classical" && s.planet === k.lord && s.tags?.length).length;
    assert.equal(k.withheldCount, tagged, `${where}: tagged entries withheld`);
    if (k.held.length) {
      assert.match(k.textPlain, /are held for later\.$/, `${where}: plain says so`);
      assert.match(k.text, /Held for later: .+\.$/, `${where}: practitioner says so`);
    }
  }
  const venus = allLines(ten).find((l) => l.k.level === "dasa" && l.k.lord === "Venus")!.k;
  assert.deepEqual(venus.held, [
    { area: "wealth", from: 16 },
    { area: "marriage", from: 18 },
  ]);
  assert.equal(venus.withheldCount, 1, "Venus's potency (BPHS 3.12-13)");
  assert.ok(venus.words.includes("music") && venus.words.includes("charming speech"));
  const saturn = allLines(ten).find((l) => l.k.level === "dasa" && l.k.lord === "Saturn")!.k;
  assert.equal(saturn.withheldCount, 2, "Saturn's longevity (BPHS 32.22-24, Phaladeepika 2.7)");
  assert.deepEqual(saturn.held, [{ area: "children", from: 18 }]);

  // At 17 work and money are open; marriage and children wait for 18.
  const seventeen = readAtAge("Sachin Tendulkar", 17);
  const sun = allLines(seventeen).find((l) => l.k.level === "dasa" && l.k.lord === "Sun")!.k;
  assert.ok(sun.words.includes("government service"), "career opens at 16");
  for (const { k, where } of allLines(seventeen)) {
    assert.deepEqual(heldItem(k, ["marriage", "children"]), [], where);
    assert.ok(k.held.every((h) => h.from === 18), where);
  }

  // An adult sees every classical entry.
  const thirty = readAtAge("Sachin Tendulkar", 30);
  assert.equal(thirty.opts.withheld, false);
  for (const { k, where } of allLines(thirty)) {
    const all = PARASHARI_SIGNIFICATIONS.filter((s) => s.tier === "classical" && s.planet === k.lord);
    assert.deepEqual(k.entries, all, where);
    assert.deepEqual(k.held, []);
    assert.equal(k.withheldCount, 0);
  }
});

function walkSections(ss: ReportSection[], f: (s: ReportSection) => void) {
  for (const s of ss) {
    f(s);
    if (s.sub) walkSections(s.sub, f);
  }
}

test("period significations: the report carries the line in both readings; the node note only in the practitioner appendix", () => {
  for (const name of ["Sachin Tendulkar", "Jawaharlal Nehru"]) {
    const c = FIGURES.find((f) => f.name === name)!;
    const r = computeChart(asChart(c));
    for (const plain of [true, false]) {
      const doc = buildReport(r, { plain });
      const dasaSubs: ReportSection[] = [];
      let nodeNote: ReportSection | undefined;
      walkSections(doc.sections, (s) => {
        if (/^dasa-/.test(s.id)) dasaSubs.push(s);
        if (s.id === "node-aspects") nodeNote = s;
      });
      assert.ok(dasaSubs.length >= 5, `${name}: dasa sections`);
      for (const s of dasaSubs) {
        const lines = s.paras.filter((p) =>
          (p.text ?? "").includes(plain ? "own matters come forward in this period" : "(Parashara 47.2; Phaladeepika 21.1)") ||
          (plain && /^The classical lists give (Rahu|Ketu)/.test(p.text ?? "")),
        );
        assert.ok(lines.length >= 1, `${name} ${s.id} (${plain ? "plain" : "practitioner"}): the line`);
        const line = lines[0];
        assert.equal(line.provisional, true);
        assert.equal(line.tone, undefined, "shown, not counted: no tone");
        assert.match(line.text ?? "", plain ? /Shown for context, not counted\.$/ : /Shown, not counted: the period's own lines/);
        if (plain) assert.deepEqual(plainViolations(line.text ?? ""), []);
      }
      if (plain) assert.equal(nodeNote, undefined, `${name}: no node note in the plain report`);
      else {
        assert.ok(nodeNote, `${name}: node note in the practitioner appendix`);
        const text = nodeNote!.paras.map((p) => p.text ?? "").join(" ");
        assert.match(text, /^Modern convention, not used by Parashara \(BPHS 26\)\./);
        assert.match(text, /Rahu in \w+ \(\d+(st|nd|rd|th) house\): 5th on/);
        assert.match(text, /Ketu in \w+ \(\d+(st|nd|rd|th) house\), disputed: 5th on/);
      }
    }
  }
  // The living figure's running sub-period has its own line.
  const t = computeChart(asChart(FIGURES.find((f) => f.name === "Sachin Tendulkar")!));
  for (const plain of [true, false]) {
    const all: string[] = [];
    walkSections(buildReport(t, { plain }).sections, (s) => all.push(...s.paras.map((p) => p.text ?? "")));
    assert.ok(all.some((x) => (plain ? /^In the running \w+ sub-period, / : /^Running \w+ bhukti\. /).test(x)), `running sub-period (${plain})`);
  }
});
