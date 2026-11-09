/** Public fixture or local private manifest. Anonymous mode never prints chart content. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { areaSeason, lifeAsOf, isDeceased } from "../shared/life-stage";
import { buildWorkJourney } from "../shared/work-journey";
import type { Chart } from "../shared/schema";

type Case = Partial<Chart> & { name: string; alternatives?: Array<{ label: string; birthTime?: string }> };
const path = process.argv[2] ?? "research/work-journey/cases.json";
const anonymous = process.argv.includes("--anonymous");
const manifest = JSON.parse(readFileSync(path, "utf8")) as { asOf: string; cases: Case[] };
Settings.now = () => Date.parse(manifest.asOf);
const defaults = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [] } as const;
const entries = manifest.cases.flatMap((c) => [c, ...(c.alternatives ?? []).map(({ label, ...v }) => ({ ...c, ...v, name: `${c.name} (${label})` }))]);
const cases = entries.map((entry, i) => {
  const chart = { ...defaults, ...entry } as Chart;
  const result = computeChart(chart);
  const journey = buildWorkJourney(result);
  assert.equal(JSON.stringify(journey), JSON.stringify(buildWorkJourney(result)), `case ${i + 1}: deterministic`);
  assert.equal(journey.asOf, lifeAsOf(chart, result.now.asOf), `case ${i + 1}: life snapshot`);
  assert.equal(journey.past, isDeceased(chart, result.now.asOf), `case ${i + 1}: life status`);
  assert.equal(journey.state, areaSeason("career", result.utc, journey.asOf, chart).inSeason ? "available" : "held", `case ${i + 1}: age gate`);
  if (journey.state === "held") assert.equal(journey.themes.length, 0, `case ${i + 1}: held themes`);
  for (const theme of journey.themes) {
    const matching = result.reading.findings.filter((f) => f.area === "career" && f.ruleId === theme.evidence.ruleId);
    assert.equal(matching.length, 1, `case ${i + 1}: traceable rule`);
    if (theme.evidence.sourceText) assert.equal(theme.evidence.sourceText, matching[0].text, `case ${i + 1}: unaltered source`);
    assert.deepEqual(theme.evidence.planets, matching[0].planets, `case ${i + 1}: source planets`);
    assert.ok(theme.text.en.trim() && theme.evidence.en.trim() && theme.evidence.ml.trim());
  }
  return { case: anonymous ? `candidate ${i + 1}` : entry.name,
    state: journey.state, themes: journey.themes.length,
    themesMalayalam: journey.themes.filter((t) => !!t.text.ml).length,
    windows: journey.windows.length, windowsMalayalam: Object.keys(journey.malayalamWindows).length,
    ...(anonymous ? {} : { passages: journey.themes.map((t) => ({ text: t.text.en, ruleId: t.evidence.ruleId, malayalam: !!t.text.ml })), contrast: journey.contrast }) };
});
process.stdout.write(JSON.stringify({ cases }, null, 2) + "\n");
