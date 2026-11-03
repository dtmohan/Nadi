/** Public-case engineering and diagnostic audit; not a predictive study. */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { SIGNS } from "@shared/astro";
import { computeAlpEventFrame } from "@shared/alp";
import { threeWaysFor } from "@shared/rules-alp";
import { additionalSchoolNatalConditions, kpNatalConditions } from "@shared/natal-reading-evidence";
import { computeKarmajiva, karmajivaCareerContext } from "@shared/karmajiva";
import { kpNatalFrame } from "@shared/kp";
import { kpPlanetContext, natalPlanetContext } from "@shared/planet-context";
import { insertChartSchema, type Chart } from "@shared/schema";
import { matterOf, type ChartEvent } from "@shared/events";
import type { RectifySegmentBaseline } from "@shared/rectify-types";
import { zodiacSeparation } from "@shared/zodiac-quarter";
import { ayanamsaAt } from "../server/ephemeris";
import { computeChart } from "../server/routes";
import { validateEvents } from "../server/validate";
import { topicReading } from "../server/topic-reading";
import { rectify } from "../server/rectify";

const manifest = JSON.parse(readFileSync("scripts/fixtures/school-dispositor-fresh.json", "utf8"));
const asOf = "2026-11-02T00:00:00Z";
const full = (raw: any, events: ChartEvent[]): Chart => ({ id: 0, gender: "unspecified", timeStandard: "auto", ayanamsa: "lahiri",
  nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null,
  timeUncertaintyMin: 0, ...raw, events });
const caseResults: object[] = [];
const scanResults: object[] = [];
for (const c of manifest.cases) {
  const input = insertChartSchema.parse({ ...c.chart, events: c.events });
  const chart = computeChart(full(input, input.events ?? []));
  chart.now.asOf = asOf;
  const context = natalPlanetContext(chart);
  const aya = ayanamsaAt(chart.jd, { ayanamsa: "lahiri", nodeType: "mean" });
  const error = (planet: "Sun" | "Moon", expected: number) => zodiacSeparation(context.requirePlanet(planet).position.lon + aya, expected) * 60;
  const errors = { sun: error("Sun", c.tropicalSun), moon: error("Moon", c.tropicalMoon) };
  assert.ok(errors.sun < 2 && errors.moon < 2, `${c.name}: tropical errors ${JSON.stringify(errors)}`);
  const natalAdditional = additionalSchoolNatalConditions(chart);
  const natalKp = kpNatalConditions(chart);
  const kpFrame = kpNatalFrame(kpPlanetContext(chart), chart.kp.cusps);
  const livelihood = karmajivaCareerContext(computeKarmajiva(context, chart.jaimini.lagna.signIndex));
  const validation = validateEvents(input, asOf);
  const eventResults: object[] = [];
  for (let i = 0; i < input.events!.length; i++) {
    const event = input.events![i], dated = topicReading(input, event, asOf), observed = validation.events[i];
    assert.deepEqual(dated, observed, `${c.name}: selected date vs validation`);
    assert.deepEqual(dated.additionalNatal, natalAdditional.find((v) => v.matter === event.matter));
    assert.deepEqual(dated.kp.natalRules, natalKp.find((v) => v.matter === event.matter)?.natalRules);
    const trace = dated.kp.natalRules?.cuspTrace;
    assert.ok(trace, `${c.name}: missing KP trace`);
    const sub = kpFrame.planets.find((p) => p.planet === trace.subLord)!;
    const sig = kpFrame.significators.find((p) => p.planet === trace.subLord)!;
    assert.equal(trace.subLordStarLord, sub.starLord);
    assert.deepEqual(trace.starLordAgency, kpFrame.significators.find((p) => p.planet === sub.starLord)?.agentFor);
    assert.deepEqual(trace.levels, { A: sig.levels.A, B: sig.levels.B, C: sig.levels.C, D: sig.levels.D });
    assert.deepEqual(trace.matchingHouses, sig.houses.filter((h) => matterOf(event.matter).houses.includes(h)));
    if (event.matter === "job") assert.deepEqual(dated.additionalNatal?.brihatJataka?.career, livelihood);
    const alp = dated.alp!;
    assert.equal(alp.status, "assessed");
    const ordinaryAlp = computeAlpEventFrame(context, chart.jaimini.lagna.lon, chart.utc, alp.asOf);
    assert.deepEqual(alp.natalThreeWays, threeWaysFor(ordinaryAlp.natalLagna, ordinaryAlp.natalLagna.signIndex, context));
    assert.deepEqual(alp.progressedThreeWays, threeWaysFor(ordinaryAlp.point, ordinaryAlp.point.signIndex, context));
    const example = validation.baseline?.example?.[i];
    let comparison: object | undefined;
    if (example) {
      const replay = topicReading(input, { ...event, date: example.date }, asOf);
      assert.deepEqual(example.natalRules, replay.kp.natalRules);
      assert.deepEqual(example.parashariOrdinary, replay.parashariOrdinary);
      assert.deepEqual(example.additionalNatal, replay.additionalNatal);
      assert.deepEqual(example.alp, replay.alp);
      assert.deepEqual(dated.kp.natalRules, replay.kp.natalRules);
      assert.deepEqual(dated.parashariOrdinary?.natal, replay.parashariOrdinary?.natal);
      assert.deepEqual(dated.additionalNatal, replay.additionalNatal);
      comparison = { date: example.date, replay: "identical", natalUnchanged: true,
        alpProgressedGroups: example.alp?.progressedThreeWays?.map((w) => w.group) };
    }
    const house = dated.parashariOrdinary?.natal.assessment;
    eventResults.push({ matter: event.matter, date: event.date,
      kp: { cusp: trace.cusp, subLord: trace.subLord, subLordStarLord: trace.subLordStarLord, levels: trace.levels, matchingHouses: trace.matchingHouses },
      parashari: { house: house?.house, lord: house?.lord, ownLordOccupies: !!house?.lordOccupancyClue,
        ownLordAspects: !!house?.lordAspectClue, qualifiers: (house?.lordOccupancyClue ?? house?.lordAspectClue)?.qualifiers },
      alp: { natalGroups: alp.natalThreeWays?.map((w) => w.group), progressedGroups: alp.progressedThreeWays?.map((w) => w.group) }, comparison });
  }
  const career = livelihood.references.find((r) => r.reference === "Lagna")!;
  caseResults.push({ name: c.name, tropicalErrorsArcmin: errors, ascendant: SIGNS[context.ascendantNakshatra!.signIndex],
    career: { tenthLord: career.tenthLord, d9Sign: SIGNS[career.navamsaSign], d9Lord: career.navamsaLord },
    randomTrials: validation.baseline?.trials ?? 0, events: eventResults });

  if (c.name === "Tereza Cristina" || c.name === "Britt Ekland") {
    const events = input.events!.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
    const started = performance.now();
    const scan = rectify({ chart: input, windowMinutes: 1, events, judgedAsOf: asOf });
    const segment = scan.segments.find((s) => s.given && s.selectable)!;
    assert.ok(segment?.candidate && segment.baseline?.catalogueExample);
    const candidate = { ...input, birthDate: segment.midDate ?? input.birthDate, birthTime: segment.mid };
    const candidateValidation = validateEvents(candidate, asOf);
    assert.deepEqual(segment.baseline.catalogueComparison, candidateValidation.baseline!.catalogueComparison);
    for (let i = 0; i < input.events!.length; i++) {
      const observed = candidateValidation.events[i];
      assert.deepEqual(segment.events[i].natalRules, observed.kp.natalRules);
      assert.deepEqual(segment.events[i].additionalNatal, observed.additionalNatal);
      assert.deepEqual(segment.events[i].alp, observed.alp);
      assert.deepEqual(segment.parashariOrdinary?.[i], observed.parashariOrdinary);
      const sample: NonNullable<RectifySegmentBaseline["catalogueExample"]>[number] = segment.baseline.catalogueExample[i];
      const replay = topicReading(candidate, { ...input.events![i], date: sample.date }, asOf);
      assert.deepEqual(sample.natalRules, replay.kp.natalRules);
      assert.deepEqual(sample.parashariOrdinary, replay.parashariOrdinary);
      assert.deepEqual(sample.additionalNatal, replay.additionalNatal);
      assert.deepEqual(sample.alp, replay.alp);
    }
    scanResults.push({ name: c.name, midpoint: segment.mid, actualAndComparisonReplay: "identical",
      elapsedSecondsIncludingCandidateValidation: Math.round((performance.now() - started) / 100) / 10 });
  }
}
const output = { protocol: "docs/school-dispositor-fresh-protocol.md", cases: caseResults, rectification: scanResults };
writeFileSync("docs/school-dispositor-fresh-results.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output, null, 2));
