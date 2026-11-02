/** Public, reproducible engineering checks; not a study of predictive accuracy. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { zodiacSeparation } from "@shared/zodiac-quarter";
import { nakshatraDisplayRows } from "@shared/nakshatra-context-display";
import { createPlanetContext, natalPlanetContext } from "@shared/planet-context";
import { evaluate, type Finding } from "@shared/rules";
import { insertChartSchema, type Chart } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import type { ChanceBaseline } from "@shared/validate-types";
import type { RectifySegmentBaseline } from "@shared/rectify-types";
import { computeChart } from "../server/routes";
import { ayanamsaAt } from "../server/ephemeris";
import { validateEvents } from "../server/validate";
import { topicReading } from "../server/topic-reading";
import { rectify } from "../server/rectify";

const manifest = JSON.parse(readFileSync("scripts/fixtures/nakshatra-context-fresh.json", "utf8"));
const targeted = JSON.parse(readFileSync("scripts/fixtures/nakshatra-context-targeted.json", "utf8"));
const asOf = "2026-10-30T00:00:00Z";
const key = (f: Finding) => JSON.stringify([f.ruleId, f.area, f.planets, f.relation, f.viaRetro, f.house]);
const full = (raw: any, events: ChartEvent[]): Chart => ({ id: 0, gender: "unspecified", timeStandard: "auto", ayanamsa: "lahiri",
  nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null,
  timeUncertaintyMin: 0, ...raw, events });
const summaries: object[] = [];
for (const c of [...manifest.cases, ...targeted.cases]) {
  const input = insertChartSchema.parse({ ...c.chart, events: c.events });
  const result = computeChart(full(input, input.events ?? []));
  const ctx = natalPlanetContext(result);
  const aya = ayanamsaAt(result.jd, { ayanamsa: "lahiri", nodeType: "mean" });
  const difference = (planet: "Sun" | "Moon", expected: number) => zodiacSeparation(ctx.requirePlanet(planet).position.lon + aya, expected);
  const tropicalErrorsArcmin = { sun: difference("Sun", c.tropicalSun) * 60, moon: difference("Moon", c.tropicalMoon) * 60 };
  // Astro-Databank rounds its published values to minutes; allow two arcminutes for independent ephemeris conventions.
  assert.ok(tropicalErrorsArcmin.sun < 2 && tropicalErrorsArcmin.moon < 2, `${c.name}: ${JSON.stringify(tropicalErrorsArcmin)}`);
  const legacyPositions = result.positions.map((p) => ({ ...p,
    combust: ctx.requirePlanet(p.planet).naikSolarContact?.withinPadaWidth ?? false }));
  const legacy = evaluate(createPlanetContext(legacyPositions, { ...ctx.frame }), undefined,
    (input.gender ?? "unspecified") as "male" | "female" | "unspecified");
  const old = new Map(legacy.findings.map((f) => [key(f), f]));
  const now = new Map(result.reading.findings.map((f) => [key(f), f]));
  const removed = Array.from(old.keys()).filter((k) => !now.has(k)).map((k) => old.get(k)!.ruleId);
  const added = Array.from(now.keys()).filter((k) => !old.has(k)).map((k) => now.get(k)!.ruleId);
  const rescored = Array.from(now.keys()).filter((k) => old.has(k) && Math.abs(now.get(k)!.score - old.get(k)!.score) > 1e-8).length;
  const changedFlags = ctx.planets.filter((p) => p.naikSolarContact?.withinPadaWidth && !p.naikSolarContact.samePada).map((p) => p.planet);
  if (c.expectedChanged) assert.deepEqual(changedFlags, c.expectedChanged, c.name);
  const eventChecks = (input.events ?? []).map((event) => {
    const validation = validateEvents({ ...input, events: [event] }, asOf).events[0];
    const dated = topicReading(input, event, asOf);
    assert.deepEqual(validation.bnn, dated.bnn);
    assert.deepEqual(validation.additionalNatal, dated.additionalNatal);
    if (validation.bnn.combination) assert.ok(result.reading.findings.some((f) => f.text === validation.bnn.combination));
    return { matter: event.matter, date: event.date, bnn: validation.bnn.score, bnnMax: validation.bnn.max, natalParity: "matched" };
  });
  summaries.push({ name: c.name, selection: c.expectedChanged ? "targeted" : "preselected", category: c.category, tropicalErrorsArcmin, changedFlags,
    legacyFindings: legacy.findings.length, currentFindings: result.reading.findings.length, removed, added, rescored, eventChecks,
    ascendant: nakshatraDisplayRows(ctx)[0] });
}

const selected = manifest.cases[0];
const input = insertChartSchema.parse({ ...selected.chart, events: selected.events });
const events = input.events!;
const validation = validateEvents(input, asOf);
assert.equal(validation.baseline?.trials, 200);
for (let i = 0; i < events.length; i++) {
  const dated = topicReading(input, events[i], asOf);
  assert.deepEqual(dated.bnn, validation.events[i].bnn);
  assert.deepEqual(dated.additionalNatal, validation.events[i].additionalNatal);
  const example: NonNullable<ChanceBaseline["example"]>[number] = validation.baseline!.example![i];
  const replay = topicReading(input, { ...events[i], date: example.date }, asOf);
  assert.deepEqual(example.additionalNatal, replay.additionalNatal);
}
const requested = events.map((event) => { const m = matterOf(event.matter); return { ...event, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
const scan = rectify({ chart: input, windowMinutes: 1, events: requested, judgedAsOf: asOf });
const segment = scan.segments.find((s) => s.given && s.selectable)!;
assert.ok(segment?.candidate);
const candidate = { ...input, birthDate: segment.midDate ?? input.birthDate, birthTime: segment.mid };
const candidateValidation = validateEvents(candidate, asOf);
assert.equal(segment.baseline?.catalogueComparison?.length, events.length);
assert.deepEqual(segment.baseline!.catalogueComparison, candidateValidation.baseline?.catalogueComparison);
for (let i = 0; i < events.length; i++) {
  assert.deepEqual(segment.events[i].additionalNatal, candidateValidation.events[i].additionalNatal);
  const example: NonNullable<RectifySegmentBaseline["catalogueExample"]>[number] = segment.baseline!.catalogueExample![i];
  const replay = topicReading(candidate, { ...events[i], date: example.date }, asOf);
  assert.deepEqual(example.additionalNatal, replay.additionalNatal);
}
console.log(JSON.stringify({ protocol: "Seven preselected and three targeted public natal cases; observations, not prediction accuracy.", cases: summaries,
  eventParity: { name: selected.name, events: events.map((e) => ({ matter: e.matter, date: e.date })),
    comparisonTrials: validation.baseline!.trials, candidateMidpoint: segment.mid,
    candidateTrials: scan.baseline?.trials, natalParity: "matched", replayedComparisonExamples: events.length,
    scores: validation.events.map((e) => ({ label: e.label, bnn: e.bnn.score, bnnMax: e.bnn.max })) } }, null, 2));
