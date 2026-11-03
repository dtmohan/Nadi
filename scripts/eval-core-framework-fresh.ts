/** Reproducible public-case engineering audit. This is not a predictive study. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { houseFrom, SIGNS } from "@shared/astro";
import { houseQuarterFrames, pointDispositors } from "@shared/house-dispositor-context";
import { computeKarmajiva } from "@shared/karmajiva";
import { createPlanetContext, natalPlanetContext } from "@shared/planet-context";
import { lordDistance, placesFrom } from "@shared/parashari-bhavat";
import { computeParashari } from "@shared/parashari";
import { insertChartSchema, type Chart } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import { zodiacSeparation } from "@shared/zodiac-quarter";
import { ayanamsaAt } from "../server/ephemeris";
import { computeChart } from "../server/routes";
import { validateEvents } from "../server/validate";
import { topicReading } from "../server/topic-reading";
import { rectify } from "../server/rectify";

const manifest = JSON.parse(readFileSync("scripts/fixtures/core-framework-fresh.json", "utf8"));
const asOf = "2026-10-30T00:00:00Z";
const full = (raw: any, events: ChartEvent[]): Chart => ({ id: 0, gender: "unspecified", timeStandard: "auto", ayanamsa: "lahiri",
  nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null,
  timeUncertaintyMin: 0, ...raw, events });
const summaries: object[] = [];
for (const c of manifest.cases) {
  const input = insertChartSchema.parse({ ...c.chart, events: c.events });
  const result = computeChart(full(input, input.events ?? []));
  const ctx = natalPlanetContext(result);
  const aya = ayanamsaAt(result.jd, { ayanamsa: "lahiri", nodeType: "mean" });
  const error = (planet: "Sun" | "Moon", expected: number) => zodiacSeparation(ctx.requirePlanet(planet).position.lon + aya, expected) * 60;
  const tropicalErrorsArcmin = { sun: error("Sun", c.tropicalSun), moon: error("Moon", c.tropicalMoon) };
  assert.ok(tropicalErrorsArcmin.sun < 2 && tropicalErrorsArcmin.moon < 2, `${c.name}: ${JSON.stringify(tropicalErrorsArcmin)}`);
  const frames = houseQuarterFrames(ctx, result.shadbala);
  assert.equal(frames[0].houses.length, 12);
  assert.ok(frames[0].houses.every((h) => h.segments.length === 9 && h.segments.every((q) => !q.partial)));
  const byFrame: object[] = [];
  let ordinary: ReturnType<typeof computeParashari> | undefined;
  for (const method of ["rashi", "sripati", "equal"] as const) {
    const par = computeParashari(ctx, result.jaimini.lagna.lon, result.utc, asOf, result.shadbala, result.dasaStarts, undefined, false, method);
    if (method === "rashi") ordinary = par;
    const changed: string[] = [];
    for (const b of par.bhavas) {
      const row = lordDistance(par, b.house);
      assert.equal(row.places, houseFrom(b.signIndex, ctx.requirePlanet(b.lord).position.signIndex));
      assert.equal(row.bhavaPlaces, placesFrom(b.house, b.lordIn));
      if (row.places !== row.bhavaPlaces) changed.push(`H${b.house}: ${row.bhavaPlaces} bhavas / ${row.places} signs`);
    }
    byFrame.push({ method, changedCounts: changed, ownLordAspectHouses: par.bhavaJudgement.filter((j) => j.lordAspectClue).map((j) => j.house) });
  }
  const careerResult = computeKarmajiva(ctx, ctx.ascendantNakshatra!.signIndex);
  assert.deepEqual(careerResult, computeKarmajiva(result.positions, ctx.ascendantNakshatra!.signIndex));
  const career = careerResult.references.find((r) => r.reference === "Lagna")!;
  const linked = pointDispositors(ctx, career.tenthLord)!;
  assert.equal(linked.d9Sign, career.navamsaSign);
  assert.equal(linked.lords[2].planet, career.navamsaLord);
  const events: object[] = [];
  const validation = (input.events ?? []).length ? validateEvents(input, asOf) : null;
  for (let i = 0; i < (input.events ?? []).length; i++) {
    const e = input.events![i];
    const dated = topicReading(input, e, asOf);
    assert.deepEqual(dated.additionalNatal, validation!.events[i].additionalNatal);
    assert.deepEqual(dated.parashariOrdinary, validation!.events[i].parashariOrdinary);
    const h = dated.parashariOrdinary!.natal.subjectHouse!;
    assert.deepEqual(dated.parashariOrdinary!.natal.assessment, ordinary!.bhavaJudgement[h - 1]);
    const example = validation!.baseline?.example?.[i];
    assert.ok(example, `${c.name}: comparison-date example`);
    const replay = topicReading(input, { ...e, date: example.date }, asOf);
    assert.deepEqual(replay.additionalNatal, example.additionalNatal);
    assert.deepEqual(replay.parashariOrdinary, example.parashariOrdinary);
    events.push({ matter: e.matter, date: e.date, trials: validation!.baseline!.trials, natalParity: "matched on event and replayed comparison" });
  }
  summaries.push({ name: c.name, tropicalErrorsArcmin, ascendant: SIGNS[ctx.ascendantNakshatra!.signIndex], byFrame,
    partialQuarterCounts: frames.map((f) => ({ frame: f.label, count: f.houses.flatMap((h) => h.segments).filter((s) => s.partial).length })),
    karmajiva: { tenthLord: career.tenthLord, d9Sign: SIGNS[career.navamsaSign], d9Lord: career.navamsaLord }, events });
}

// The second case has a fifth-house own-lord aspect, so this exercise tests the
// newly qualified clue rather than only the case where it is absent.
const first = manifest.cases[1];
const input = insertChartSchema.parse({ ...first.chart, events: first.events });
const requested = input.events!.map((event) => { const m = matterOf(event.matter); return { ...event, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
const scan = rectify({ chart: input, windowMinutes: 1, events: requested, judgedAsOf: asOf });
const segment = scan.segments.find((s) => s.given && s.selectable)!;
assert.ok(segment?.candidate);
assert.ok(segment.parashariOrdinary?.some((x) => x?.natal.assessment?.lordAspectClue));
const candidate = { ...input, birthDate: segment.midDate ?? input.birthDate, birthTime: segment.mid };
const validation = validateEvents(candidate, asOf);
assert.deepEqual(segment.baseline!.catalogueComparison, validation.baseline!.catalogueComparison);
for (let i = 0; i < input.events!.length; i++) {
  assert.deepEqual(segment.events[i].additionalNatal, validation.events[i].additionalNatal);
  assert.deepEqual(segment.parashariOrdinary?.[i], validation.events[i].parashariOrdinary);
  const example = segment.baseline!.catalogueExample![i];
  const replay = topicReading(candidate, { ...input.events![i], date: example.date }, asOf);
  assert.deepEqual(example.additionalNatal, replay.additionalNatal);
  assert.deepEqual(example.parashariOrdinary, replay.parashariOrdinary);
}
const candidateContext = createPlanetContext(segment.candidate!.positions, { kind: "natal", ascendant: segment.candidate!.ascendantLon, ayanamsa: "lahiri" });
const cast = computeChart(full(candidate, candidate.events ?? []));
assert.deepEqual(pointDispositors(candidateContext, "Saturn"), pointDispositors(natalPlanetContext(cast), "Saturn"));
console.log(JSON.stringify({ protocol: manifest.selection, cases: summaries,
  rectificationParity: { name: first.name, midpoint: segment.mid, trials: validation.baseline?.trials,
    actualAndReplayedComparison: "matched", candidateDispositors: "matched to a cast chart" } }, null, 2));
