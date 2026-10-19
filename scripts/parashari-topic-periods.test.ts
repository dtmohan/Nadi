// Periods by topic (shared/parashari-topic-periods.ts) and the report's reading order (shared/report/index.ts).
// The 48.2-8 statements filed by topic keep the chapter's direction; only house lords' periods are listed,
// each beside its own lean; the minors' gate holds the adult topics back; the plain wording is soft and
// untagged. The report runs chart, how to read, at a glance, the day of birth, the systems and the sky
// today, with the data tables in a practitioner-only appendix and the notes numbered in reading order.
// Synthetic charts only.
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import { computeParashari, DEFAULT_ASPECT_FLOOR, type ParashariResult } from "@shared/parashari";
import { HOUSE_LORD_DASA, verdictOfLean } from "@shared/parashari-dasa";
import { PERIOD_TOPICS, topicPeriods, type TopicPeriods } from "@shared/parashari-topic-periods";
import { sensitiveGate, withholdText } from "@shared/life-stage";
import { plainViolations, soften } from "@shared/gentle";
import { buildReport } from "@shared/report";
import type { ReportSection } from "@shared/report/types";
import { computeChart } from "../server/routes";

const AS_OF = "2026-10-19T00:00:00.000Z";

const chart = (birthDate: string, birthTime: string, deathDate: string | null = null): Chart => ({
  id: 0,
  name: "Synthetic",
  gender: "female",
  birthDate,
  birthTime,
  timezone: "Asia/Kolkata",
  timeStandard: "auto",
  place: "Synthetic, India",
  latitude: 20,
  longitude: 78,
  ayanamsa: "lahiri",
  nodeType: "mean",
  sunriseDef: "edge",
  parashariHouseMethod: "rashi",
  notes: "",
  deathDate,
  timeUncertaintyMin: 0,
  events: [],
});

interface Run {
  label: string;
  minor: boolean;
  deceased: boolean;
  utc: string;
  par: ParashariResult;
  topics: TopicPeriods[];
}

function run(d: string, t: string, deathDate: string | null = null): Run {
  const c = chart(d, t, deathDate);
  const r = computeChart(c);
  const asOf = deathDate ? `${deathDate}T00:00:00.000Z` : AS_OF;
  const minor = sensitiveGate(c, r.utc, asOf).withheld;
  const par = computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, asOf, r.shadbala, r.dasaStarts, DEFAULT_ASPECT_FLOOR, minor, "rashi");
  const topics = topicPeriods(par, { birthIso: r.utc, asOfIso: asOf, deceased: !!deathDate });
  return { label: `${d} ${t}${minor ? " minor" : ""}${deathDate ? " deceased" : ""}`, minor, deceased: !!deathDate, utc: r.utc, par, topics };
}

const RUNS: Run[] = [
  run("1951-03-14", "05:10"),
  run("1968-07-02", "14:35"),
  run("1979-04-17", "09:50"),
  run("1990-02-28", "16:45"),
  run("2016-03-14", "09:30"),
  run("1931-11-20", "06:15", "2004-05-01"),
];

test("48.2-8: each statement filed under a topic keeps the chapter's direction for that house", () => {
  for (const t of PERIOD_TOPICS)
    for (const s of t.statements) assert.equal(s.tone, HOUSE_LORD_DASA[s.house - 1].tone, `${t.topic} ${s.house}`);
  // The 2nd and 3rd lords' statements name no topic.
  const filed = new Set(PERIOD_TOPICS.flatMap((t) => t.statements.map((s) => s.house)));
  assert.ok(!filed.has(2) && !filed.has(3));
  assert.deepEqual(PERIOD_TOPICS.map((t) => t.topic), ["career", "wealth", "health", "family"]);
});

test("only house lords' periods are listed, under the houses they rule, each beside its own lean", () => {
  for (const { label, par, topics } of RUNS)
    for (const t of topics)
      for (const p of t.periods) {
        assert.ok(p.lord !== "Rahu" && p.lord !== "Ketu", `${label} ${t.topic}: ${p.lord}`);
        const rules = par.bhavas.filter((b) => b.lord === p.lord).map((b) => b.house);
        const filed = PERIOD_TOPICS.find((x) => x.topic === t.topic)!.statements.map((s) => s.house);
        assert.ok(p.houses.length > 0 && p.houses.every((h) => rules.includes(h) && filed.includes(h)), `${label} ${t.topic} ${p.lord}`);
        const d = par.dasaReadings.find((x) => x.lord === p.lord && x.start === p.start)!;
        assert.ok(d, `${label}: ${p.lord} ${p.start}`);
        assert.deepEqual(p.lean, d.lean);
        const lean = verdictOfLean(d.lean);
        const want = p.statementTone === "support" && lean === "support" ? "support" : p.statementTone === "strain" && lean === "strain" ? "strain" : "mixed";
        assert.equal(p.tone, want, `${label} ${t.topic} ${p.lord}`);
        assert.ok(p.sources.length > 0 && p.sources.every((s) => /^Parashara 48\.\d/.test(s.label) && s.provisional), `${label}`);
      }
});

test("the periods read: from the running one and three more for the living, the whole life for the deceased", () => {
  for (const { label, deceased, par, topics } of RUNS) {
    const all = topics.flatMap((t) => t.periods);
    if (deceased) {
      for (const p of all) assert.ok(p.start < "2004-05-01", `${label}: ${p.lord} ${p.start}`);
      assert.ok(all.every((p) => !p.current), `${label}: nothing runs after death`);
      continue;
    }
    const i = par.dasaReadings.findIndex((d) => d.end > AS_OF);
    const window = par.dasaReadings.slice(i, i + 4).filter((d) => d.ageStart < 90);
    for (const p of all) assert.ok(window.some((d) => d.lord === p.lord && d.start === p.start), `${label}: ${p.lord} ${p.start}`);
    for (const t of topics)
      if (!t.held && !t.periods.length) assert.match(t.summaryPlain, /outside the years read here|No period/, `${label} ${t.topic}`);
  }
});

test("the minors' gate: work, money and family held back with their onset ages; nothing withheld in any wording", () => {
  const minors = RUNS.filter((r) => r.minor);
  assert.ok(minors.length > 0);
  for (const { label, topics } of minors) {
    const by = new Map(topics.map((t) => [t.topic, t]));
    assert.match(by.get("career")!.held ?? "", /from age 16/, label);
    assert.match(by.get("wealth")!.held ?? "", /from age 16/, label);
    assert.match(by.get("family")!.held ?? "", /from age 18/, label);
    assert.equal(by.get("health")!.held, undefined, label);
    for (const t of topics) {
      if (t.held) assert.equal(t.periods.length, 0);
      for (const x of [t.summary, t.summaryPlain, ...t.periods.flatMap((p) => [p.text, p.textPlain])])
        assert.ok(!withholdText(x), `${label} ${t.topic}: "${x}"`);
    }
  }
});

test("the plain wording: second person, soft, no verse tags", () => {
  for (const { label, topics } of RUNS)
    for (const t of topics)
      for (const x of [t.labelPlain, t.summaryPlain, ...t.periods.map((p) => p.textPlain)]) {
        assert.ok(!/\b\d+\.\d+\b|\bdasa\b|\blord of\b|\bnative\b/.test(x), `${label} ${t.topic}: "${x}"`);
        assert.deepEqual(plainViolations(x), [], `${label} ${t.topic}: "${x}"`);
        assert.equal(soften(x), x, `${label} ${t.topic}: the softener rewrites "${x}"`);
      }
});

const ids = (secs: ReportSection[]) => secs.map((s) => s.id);
const walk = (secs: ReportSection[], f: (s: ReportSection) => void) => {
  for (const s of secs) {
    f(s);
    walk(s.sub ?? [], f);
  }
};

test("the report reads chart, how to read, at a glance, the day, the systems and the sky, tables last for practitioners", () => {
  const r = computeChart(chart("1968-07-02", "14:35"));
  for (const plain of [true, false]) {
    const doc = buildReport(r, { plain });
    const order = ids(doc.sections);
    assert.deepEqual(order.slice(0, 5), ["chart", "reading", "agreement", "day", "birth-star"], order.join(" "));
    const now = order.indexOf("now");
    for (const id of ["bnn", "parashari", "timing", "jaimini", "kp", "alp"]) {
      const i = order.indexOf(id);
      assert.ok(i > 4 && i < now, `${id} sits among the systems: ${order.join(" ")}`);
    }
    assert.ok(!order.includes("parashari-tables"), "the tables leave the reading");
    let appendixTables = 0;
    walk(doc.sections, (s) => {
      for (const p of s.paras) if (p.appendix) appendixTables++;
    });
    if (plain) {
      assert.equal(now, order.length - 1, "the sky today closes the plain report");
      assert.equal(appendixTables, 0, "no data table in the plain report");
    } else {
      assert.equal(order[order.length - 1], "appendix");
      const app = doc.sections[order.length - 1];
      assert.deepEqual(ids(app.sub ?? []).sort(), ["alp-tables", "jaimini-tables", "kp-tables", "parashari-tables"]);
      assert.ok(appendixTables >= 7, `${appendixTables} data tables in the appendix`);
      // Outside the appendix, no data table remains.
      walk(doc.sections.slice(0, -1), (s) => {
        for (const p of s.paras) assert.ok(!p.appendix, s.id);
      });
    }
    // The topic list opens the timing part.
    const timing = doc.sections.find((s) => s.id === "timing")!;
    assert.equal(timing.sub?.[0].id, "periods-by-topic");
    assert.deepEqual(ids(timing.sub![0].sub ?? []), ["topic-career", "topic-wealth", "topic-health", "topic-family"]);
    assert.ok(timing.sub![0].paras[0].provisional);
  }
});

test("the report's notes are numbered in reading order, and every note is cited", () => {
  const r = computeChart(chart("1968-07-02", "14:35"));
  for (const plain of [true, false]) {
    const doc = buildReport(r, { plain });
    const seen: number[] = [];
    walk(doc.sections, (s) => {
      for (const p of s.paras) for (const n of p.cites ?? []) if (!seen.includes(n)) seen.push(n);
    });
    assert.deepEqual(seen, seen.map((_, i) => i + 1), "first appearances run 1, 2, 3, ...");
    assert.deepEqual(doc.cites.map((c) => c.n), seen, "the notes list matches the cited numbers");
  }
});
