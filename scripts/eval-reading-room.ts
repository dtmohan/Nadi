/** Consistency audit for public cases, or a local private manifest (never written to this repository). */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { areaSeason, isDeceased, lifeAsOf } from "../shared/life-stage";
import { buildReadingInput, composeReading } from "../shared/reading-prose";
import type { Chart } from "../shared/schema";

type Case = Partial<Chart> & { name: string; alternatives?: Array<{ label: string; birthTime?: string }> };
const path = process.argv[2] ?? "research/reading-room-validation/cases.json";
const anonymous = process.argv.includes("--anonymous");
const manifest = JSON.parse(readFileSync(path, "utf8")) as { asOf: string; cases: Case[] };
Settings.now = () => Date.parse(manifest.asOf);
const defaults = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [] } as const;
const entries = manifest.cases.flatMap((c) => [c, ...(c.alternatives ?? []).map(({ label, ...values }) => ({ ...c, ...values, name: `${c.name} (${label})` }))]);
const words = { supportive: "supportive", care: "challenging", mixed: "mixed", contested: "contested", descriptive: "descriptive", quiet: "lightly indicated" } as const;
const findings = entries.map((entry, i) => {
  const chart = { ...defaults, ...entry } as Chart;
  const result = computeChart(chart);
  const input = buildReadingInput(result);
  const doc = composeReading(input);
  const actualAsOf = lifeAsOf(chart, result.now.asOf);
  assert.equal(doc.meta.past, isDeceased(chart, result.now.asOf), `case ${i + 1}: life status`);
  assert.equal(doc.meta.asOf.slice(0, 10), actualAsOf.slice(0, 10), `case ${i + 1}: reading date`);
  assert.equal(JSON.stringify(doc), JSON.stringify(composeReading(buildReadingInput(result))), `case ${i + 1}: deterministic output`);
  const getTone = (area: string) => input.areas.find((a) => a.area === area)?.tone;
  const paragraphs = doc.sections.flatMap((s) => s.paragraphs);
  for (const entry of doc.index) {
    const tone = getTone(entry.topic);
    if (tone) assert.equal(entry.tone, tone, `case ${i + 1}: index tone for ${entry.topic}`);
  }
  for (const p of paragraphs.filter((p) => p.id.startsWith("area-"))) for (const e of p.evidence) {
    assert.ok(result.reading.findings.some((f) => f.ruleId === e.finding.ruleId && f.text === e.finding.text && JSON.stringify(f.planets) === JSON.stringify(e.finding.planets)), `case ${i + 1}: area evidence matches selected natal finding`);
  }
  for (const area of ["career", "wealth", "marriage", "children"]) {
    if (areaSeason(area, result.utc, actualAsOf, chart).inSeason) continue;
    assert.ok(!doc.index.some((x) => x.topic === area || (area === "career" && x.topic === "authority")), `case ${i + 1}: held index ${area}`);
    assert.ok(!paragraphs.some((p) => p.id === `area-${area}` || (area === "career" && p.id === "area-authority")), `case ${i + 1}: held paragraph ${area}`);
    if (area === "marriage") assert.ok(!paragraphs.some((p) => p.id === "marriage-frame"));
    if (area === "children") assert.ok(!paragraphs.some((p) => p.id === "family-frame"));
  }
  const work = doc.summary.find((s) => s.label === "Work & means")?.text;
  const bonds = doc.summary.find((s) => s.label === "Bonds")?.text;
  const careerTone = getTone("career"), marriageTone = getTone("marriage");
  if (work && careerTone) assert.ok(work.includes(`Work is ${words[careerTone]}`), `case ${i + 1}: career tone`);
  if (bonds && marriageTone) assert.ok(bonds.includes(`Marriage is ${words[marriageTone]}`), `case ${i + 1}: marriage tone`);
  for (const p of paragraphs.filter((p) => p.id.startsWith("area-") && p.id !== "area-marriage")) {
    assert.ok(!/long marriage can hold|not a verdict on the marriage/i.test(p.text), `case ${i + 1}: misplaced marriage prose in ${p.id}`);
  }
  return { case: anonymous ? `candidate ${i + 1}` : entry.name, past: doc.meta.past, visibleAreas: doc.index.length,
    sections: doc.sections.length, paragraphs: paragraphs.length, evidence: paragraphs.reduce((n, p) => n + p.evidence.length, 0),
    careerTone: anonymous ? undefined : careerTone, marriageTone: anonymous ? undefined : marriageTone };
});
process.stdout.write(JSON.stringify({ cases: findings }, null, 2) + "\n");
