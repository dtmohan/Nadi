import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { buildReadingInput, composeReading } from "../shared/reading-prose";
import { mentionsHeldArea, withholdText } from "../shared/life-stage";
import type { Chart } from "../shared/schema";

const cases = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases;
const base = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [] };
function compute(name: string) {
  const person = cases.find((x: { name: string }) => x.name === name);
  assert.ok(person, name);
  return computeChart({ ...base, ...person } as Chart);
}
const synthetic = { ...base, name: "Synthetic", gender: "female", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59 };
const previousNow = Settings.now;
Settings.now = () => Date.parse("2026-11-08T12:00:00Z");
test.after(() => { Settings.now = previousNow; });

test("the brief follows each chart's computed area tone rather than a fixed template", () => {
  const result = compute("Pina Bausch"), input = buildReadingInput(result);
  const career = input.areas.find((a) => a.area === "career");
  assert.ok(career);
  const variant = (tone: typeof career.tone) => composeReading({ ...input, areas: input.areas.map((a) => a.area === "career" ? { ...a, tone } : a) });
  assert.match(variant("care").summary.find((x) => x.label === "Work & means")!.text, /Work is challenging/);
  assert.match(variant("supportive").summary.find((x) => x.label === "Work & means")!.text, /Work is supportive/);
  const adult = buildReadingInput(compute("John Michael Kosterlitz"));
  const marriage = adult.areas.find((a) => a.area === "marriage");
  assert.equal(marriage?.tone, "supportive");
  assert.match(composeReading(adult).summary.find((x) => x.label === "Bonds")!.text, /Marriage is supportive/);
});

test("a contested career does not receive marriage-specific interpretation", () => {
  const input = buildReadingInput(compute("Rod Suskin"));
  assert.equal(input.areas.find((a) => a.area === "career")?.tone, "contested");
  const para = composeReading(input).sections.flatMap((s) => s.paragraphs).find((p) => p.id === "area-career")!;
  assert.match(para.text, /indications that disagree/);
  assert.doesNotMatch(para.text, /long marriage|verdict on the marriage|prediction of separation/i);
});

test("children's reading reports whether the chart has the traditional connection", () => {
  for (const [name, link] of [["John Michael Kosterlitz", "strong"], ["Adriana Lima", "unsigned"]] as const) {
    const result = compute(name);
    assert.equal(result.reading.children.promised, link);
    const doc = composeReading(buildReadingInput(result));
    const text = doc.sections.flatMap((s) => s.paragraphs).find((p) => p.id === "area-children")!.text;
    if (link === "strong") assert.match(text, /finds a traditional connection between Jupiter and Venus/);
    else {
      assert.match(text, /does not find its usual Jupiter–Venus connection/);
      assert.match(text, /does not rule out having children/);
    }
    assert.match(text, /cannot determine fertility, pregnancy, the number or sex of children/i);
  }
});

test("age-held topics cannot leak through chapters, summaries, conditions or evidence", () => {
  for (const [birthDate, deathDate] of [["2020-01-01", null], ["2000-01-01", "2010-01-01"]] as const) {
    const result = computeChart({ ...synthetic, birthDate, deathDate } as Chart);
    const doc = composeReading(buildReadingInput(result));
    assert.equal(result.sensitive?.withheld, true);
    for (const id of ["area-career", "area-authority", "area-wealth", "area-marriage", "area-children", "marriage-frame", "family-frame"]) {
      assert.ok(!doc.sections.flatMap((s) => s.paragraphs).some((p) => p.id === id), id);
    }
    assert.ok(doc.index.every((e) => !["career", "authority", "wealth", "marriage", "children"].includes(e.topic)));
    assert.equal(doc.conditions.length, 0);
    assert.equal(doc.comparison.length, 0);
    assert.equal(doc.timing.length, 0);
    assert.ok(doc.sections.every((s) => s.paragraphs.every((p) => p.evidence.length === 0)));
    assert.ok(!doc.sections.some((s) => s.preamble));
    const printed = [doc.standfirst, ...doc.summary.map((s) => s.text), ...doc.sections.flatMap((s) => s.paragraphs.map((p) => p.text))].join(" ");
    assert.doesNotMatch(printed, /separation|husband|spouse|marriage|\bchildren\b/i);
  }
});

test("at seventeen the work topics can open while marriage and children remain held", () => {
  const result = computeChart({ ...synthetic, birthDate: "2009-01-01", deathDate: null } as Chart);
  const doc = composeReading(buildReadingInput(result));
  const ids = doc.sections.flatMap((s) => s.paragraphs.map((p) => p.id));
  for (const id of ["area-career", "area-authority", "area-wealth"]) assert.ok(ids.includes(id), id);
  for (const id of ["area-marriage", "area-children", "marriage-frame", "family-frame"]) assert.ok(!ids.includes(id), id);
  assert.ok(doc.sections.every((s) => s.paragraphs.every((p) => p.evidence.length === 0)));
});

test("minor section text stays clear of held and sensitive claims across different charts", () => {
  for (const birthTime of ["01:00", "07:00", "13:00", "19:00"]) {
    const result = computeChart({ ...synthetic, birthDate: "2018-02-01", birthTime, deathDate: null } as Chart);
    const doc = composeReading(buildReadingInput(result));
    const paragraphs = doc.sections.flatMap((s) => s.paragraphs.map((p) => p.text));
    for (const text of paragraphs) {
      assert.equal(mentionsHeldArea(text, () => true), false, `${birthTime}: ${text}`);
      assert.equal(withholdText(text), false, `${birthTime}: ${text}`);
    }
  }
});

test("a future passing date stays present, while a recorded past date fixes the snapshot", () => {
  const birthDate = "1980-01-01";
  const future = computeChart({ ...synthetic, birthDate, deathDate: "2090-01-01" } as Chart);
  const futureDoc = composeReading(buildReadingInput(future));
  assert.equal(futureDoc.meta.past, false);
  assert.equal(futureDoc.meta.asOf.slice(0, 10), future.now.asOf.slice(0, 10));
  assert.doesNotMatch(futureDoc.sections.find((s) => s.id === "time")!.paragraphs[0].text, /date of passing/);
  const past = computeChart({ ...synthetic, birthDate, deathDate: "2020-01-01" } as Chart);
  const pastDoc = composeReading(buildReadingInput(past));
  assert.equal(pastDoc.meta.past, true);
  assert.equal(pastDoc.meta.asOf.slice(0, 10), "2020-01-01");
  assert.match(pastDoc.sections.find((s) => s.id === "time")!.paragraphs[0].text, /date of passing/);
});
