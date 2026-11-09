import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { julianDay, positionsAt } from "../server/ephemeris";
import { describePosition, type Planet } from "../shared/astro";
import { applyBand, bandSentence, evaluate, RULES } from "../shared/rules";
import { findingProvenance, findingQualifiers } from "../shared/reading-rule-audit";
import { computeChart } from "../server/routes";
import { buildReadingInput, composeReading } from "../shared/reading-prose";
import type { Chart } from "../shared/schema";
import { bnnFindingContext } from "../shared/chart-explanations";

const base = () => positionsAt(julianDay(DateTime.fromISO("1990-01-01T06:30:00Z", { zone: "utc" })), { ayanamsa: "lahiri", nodeType: "mean" });
const moved = (changes: Array<[Planet, number]>) => base().map((p) => {
  const next = changes.find(([planet]) => planet === p.planet);
  return next ? describePosition(p.planet, next[1], 1) : p;
});
const rule = (id: string) => {
  const r = RULES.find((x) => x.id === id);
  assert.ok(r, id);
  return r;
};
const syntheticChart = { id: 0, name: "Synthetic", gender: "female", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;

test("Jupiter changes only the qualified Mars–Ketu clause and does not add a second score", () => {
  const r = rule("f-ma-ke");
  assert.equal(r.when.without?.planet, "Jupiter");
  const joined = moved([["Mars", 5], ["Ketu", 10], ["Jupiter", 15]]);
  const reading = evaluate(joined, [r], "female");
  assert.equal(reading.findings.length, 1);
  const f = reading.findings[0];
  assert.match(f.text, /ordinary job or one given to detachment/);
  assert.match(f.text, /Jupiter joins.*exception to misunderstandings applies/);
  assert.doesNotMatch(f.text, /misunderstandings between the couple unless/);
  const { without: _without, ...oldWhen } = r.when;
  const noException = evaluate(joined, [{ ...r, when: oldWhen }], "female").findings[0];
  assert.equal(f.score, noException.score);
  assert.equal(f.base, noException.base);
  assert.deepEqual(f.grade, noException.grade);

  const separated = moved([["Mars", 5], ["Ketu", 10], ["Jupiter", 95]]);
  const normal = evaluate(separated, [r], "female").findings[0];
  assert.equal(normal.text, r.text);
  assert.deepEqual(findingQualifiers(normal, separated), { tested: ["The source adds: unless Jupiter joins."], untested: [] });
  assert.deepEqual(findingQualifiers(normal, separated.filter((p) => p.planet !== "Jupiter")), { tested: [], untested: ["The source adds: unless Jupiter joins."] });
});

test("provenance keeps a same-sign extra companion and the adjacent primary relation", () => {
  const r = rule("f-t-ma-ke-ve");
  const positions = moved([["Mars", 5], ["Ketu", 35], ["Venus", 10], ["Jupiter", 125]]);
  const reading = evaluate(positions, [r], "female");
  const f = reading.findings.find((x) => x.ruleId === r.id)!;
  assert.ok(f);
  assert.equal(f.relation, "next");
  assert.equal(reading.relations.find((x) => x.subject === "Mars" && x.object === "Venus")?.relation, "conjunct");
  assert.equal(findingProvenance(f, reading.relations), "mixed");
  assert.equal(findingProvenance(f, reading.relations.filter((x) => !(x.subject === "Mars" && x.object === "Venus"))), "unresolved");
  assert.deepEqual(findingQualifiers(f, positions), { tested: [], untested: ["The source adds a Jupiter-aspect qualifier."] });
});

test("unencoded Moon-strength and Jupiter-aspect qualifiers remain untested", () => {
  const p = base();
  assert.deepEqual(findingQualifiers({ ruleId: "f-ma-mo", text: "misunderstandings if the Moon is weak" }, p), { tested: [], untested: ["The source adds: if the Moon is weak."] });
  assert.deepEqual(findingQualifiers({ ruleId: "f-t-ma-ke-ve", text: "Jupiter's aspect on the combination brings compromise" }, p), { tested: [], untested: ["The source adds a Jupiter-aspect qualifier."] });
});

test("birth-time bands expose a changed Jupiter exception even while the pair still fires", () => {
  const center = moved([["Mars", 5], ["Ketu", 10], ["Jupiter", 29.9]]);
  const later = moved([["Mars", 5], ["Ketu", 10], ["Jupiter", 30.1]]);
  const reading = evaluate(center, RULES, "female");
  applyBand(reading, center, later, 15, "female");
  const f = reading.findings.find((x) => x.ruleId === "f-ma-ke")!;
  assert.ok(f);
  assert.equal(f.band?.later?.fires, true);
  assert.equal(f.band?.later?.interpretationChanged, true);
  const text = bandSentence(f, true)!;
  assert.match(text, /later end the source's conditional interpretation changes/);
  assert.doesNotMatch(text, /bond changes from one sign to one sign|no longer share a direction/);
  const context = bnnFindingContext(f, reading.relations);
  assert.match(context.text, /conditional interpretation changes/);
  assert.doesNotMatch(context.text, /connection or direction changes/);
  assert.match(context.textMl, /വ്യവസ്ഥയെ ആശ്രയിച്ച വ്യാഖ്യാനം/);
});

test("the reading tells the reader which Jupiter exception was actually checked", () => {
  const baseResult = computeChart(syntheticChart), r = rule("f-ma-ke");
  const read = (jupiter: number) => {
    const positions = moved([["Mars", 5], ["Ketu", 10], ["Jupiter", jupiter]]);
    const reading = evaluate(positions, [r], "female");
    const doc = composeReading(buildReadingInput({ ...baseResult, positions, reading }));
    return doc.sections.find((s) => s.id === "bonds")?.paragraphs.find((p) => p.id === "area-marriage")?.text ?? "";
  };
  const joined = read(15), separate = read(95);
  assert.match(joined, /ordinary job or one given to detachment/);
  assert.match(joined, /Jupiter joins.*exception to misunderstandings applies/);
  assert.doesNotMatch(joined, /misunderstandings between the couple unless/);
  assert.match(separate, /unless Jupiter joins.*The app checks this condition/);
  assert.doesNotMatch(separate, /app does not test this condition/);
});

test("the reading distinguishes a mixed trio from an extension-only trio", () => {
  const baseResult = computeChart(syntheticChart), r = rule("f-t-ma-ke-ve");
  const read = (venus: number) => {
    const positions = moved([["Mars", 5], ["Ketu", 35], ["Venus", venus], ["Jupiter", 125]]);
    const reading = evaluate(positions, [r], "female");
    assert.ok(reading.findings.some((f) => f.ruleId === r.id));
    const doc = composeReading(buildReadingInput({ ...baseResult, positions, reading }));
    return doc.sections.find((s) => s.id === "bonds")?.paragraphs.find((p) => p.id === "area-marriage")?.text ?? "";
  };
  const mixed = read(10), extension = read(335);
  assert.match(mixed, /source conjunction or trine and an adjacent-sign extension/);
  assert.doesNotMatch(mixed, /extension, not a source conjunction or trine/);
  assert.match(extension, /extension, not a source conjunction or trine/);
  assert.match(mixed, /Jupiter-aspect qualifier.*does not test this condition/);
});
