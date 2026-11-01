import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import { agreementInput, readTopic } from "../shared/agreement";
import { computeKp } from "../shared/kp";
import { evaluateKp, KP_RULES, type KpFinding } from "../shared/rules-kp";
import { synthesize, synthesizeArea } from "../shared/synthesis";
import type { Finding } from "../shared/rules";
import type { Chart } from "../shared/schema";
import { resolveTimeBasis } from "../shared/time-basis";
import { DateTime } from "luxon";

// A synthetic chart: the user's birth data are deliberately not part of the test suite.
const chart = { id: 0, name: "Synthetic reading scope", gender: "male", birthDate: "1975-03-14", birthTime: "06:10", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Chennai", latitude: 13.0827, longitude: 80.2707, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;
const result = computeChart(chart);

test("a small historical mean-time offset produces a parseable display zone", () => {
  for (const longitude of [-0.1667, 0.1667]) {
    const basis = resolveTimeBasis("1815-12-10", "13:00", "Europe/London", longitude, "lmt", 51.5);
    assert.equal(DateTime.fromISO("1815-12-10T13:00", { zone: basis.displayZone }).isValid, true, basis.displayZone);
    assert.equal(DateTime.fromISO("1815-12-10T13:00", { zone: basis.displayZone }).offset, Math.round(basis.offsetSeconds / 60));
  }
});

test("KP harmony uses the actual three-of-four condition, and reports only houses matched", () => {
  const kp = structuredClone(computeKp(result.kp, result.utc, result.now.asOf));
  kp.cusps[6].subLord = "Saturn";
  const saturn = kp.significators.find((s) => s.planet === "Saturn")!;
  const find = (houses: number[]) => {
    saturn.houses = houses;
    return evaluateKp(kp).find((f) => f.ruleId === "kp7-harmony");
  };
  assert.equal(find([2, 5]), undefined);
  const three = find([2, 5, 7])!;
  assert.deepEqual(three.used, [2, 5, 7]);
  assert.match(three.evidence, /signifies 2, 5, 7$/);
  assert.match(three.text, /at least three of 2, 5, 7 and 11/);
  assert.deepEqual(find([2, 5, 7, 11])!.used, [2, 5, 7, 11]);
  for (const id of ["kp7-opponent", "kp11-marital", "kp10-employment", "kp5-children-certain", "kp5-children-denied-full"]) {
    const rule = KP_RULES.find((r) => r.id === id)!;
    assert.match(rule.text, /at least (two|three) of/, id);
  }
  assert.equal(KP_RULES.find((r) => r.id === "kp10-reinstatement-denied")?.sourceUrl, "https://kpastrologylearning.com/free-kp-astrology-rules/");
});

const f = (ruleId: string, topic: string, cusp: number, polarity: KpFinding["polarity"]): KpFinding => ({
  ruleId, topic, cusp, polarity, text: `${topic}: a condition specific to this matter.`, source: "Test source", evidence: "Test evidence", subLord: "Saturn", used: [2, 5, 7],
});
const kpStance = (topic: "career" | "marriage" | "children", findings: KpFinding[]) => {
  const input = agreementInput(result, true);
  input.inSeason = () => true;
  input.kp = { ...input.kp, findings };
  return readTopic(topic, input).stances.find((x) => x.system === "kp")!;
};

test("KP question-specific findings do not decide the existence of a career", () => {
  const specific = [f("kp10-reinstatement-denied", "Reinstatement", 10, "bad"), f("kp10-tax", "Tax scrutiny", 10, "bad")];
  const onlySpecific = kpStance("career", specific);
  assert.equal(onlySpecific.stance, "silent");
  assert.equal(onlySpecific.word, "no verdict");
  assert.match(onlySpecific.note, /separate rule about reinstatement/i);
  const withEmployment = kpStance("career", [...specific, f("kp10-employment", "Career", 10, "good")]);
  assert.equal(withEmployment.stance, "supports");
  assert.doesNotMatch(withEmployment.word, /denied|strained/);
});

test("KP marriage quality and a particular party do not decide marriage in general", () => {
  const specific = [f("kp7-harmony", "Marriage", 7, "good"), f("kp7-marriage-denied", "Marriage with a particular party", 7, "bad")];
  assert.equal(kpStance("marriage", specific).stance, "silent");
  assert.equal(kpStance("marriage", [...specific, f("kp7-marriage", "Marriage", 7, "good")]).stance, "supports");
});

test("a KP finding about a particular child does not become a general children verdict", () => {
  assert.equal(kpStance("children", [f("kp5-child-eyes", "Children", 5, "bad")]).stance, "silent");
});

test("career presentation preserves the strongest findings and adds a distinct karaka without changing scores", () => {
  const mk = (ruleId: string, score: number, planets: Finding["planets"], text: string): Finding => ({ ruleId, area: "career", score, planets, text, relation: "conjunct", viaRetro: false, tone: "good" });
  const items = [mk("a", 4.2, ["Jupiter", "Saturn", "Mercury"], "A: work in teaching."), mk("b", 4.1, ["Jupiter", "Saturn", "Sun"], "B: government."), mk("c", 4, ["Jupiter", "Venus", "Mercury"], "C: trade."), mk("d", 2.68, ["Saturn", "Mercury", "Rahu"], "D: information technology.")];
  const area = synthesizeArea("career", items, result.reading, "male");
  assert.deepEqual(area.key.map((x) => x.ruleId), ["a", "b", "c"]);
  assert.equal(area.careerAlternative?.ruleId, "d");
  assert.equal(area.careerAlternative?.score, 2.68);
  assert.match(area.headline, /information technology/);
  assert.match(area.headline, /alternatives, not a predicted occupation/);
  assert.equal(new Set([...area.key, ...area.rest, area.careerAlternative!].map((x) => x.ruleId)).size, items.length);
  const tooWeak = synthesizeArea("career", [...items.slice(0, 3), { ...items[3], score: 2.4 }], result.reading, "male");
  assert.equal(tooWeak.careerAlternative, undefined);
});

test("BNN children text is descriptive throughout the shared calculation and overview", () => {
  const children = synthesize(result.reading, "male").find((a) => a.area === "children")!;
  assert.equal(children.tone, "quiet");
  const findings = result.reading.findings.filter((x) => x.area === "children");
  assert.ok(findings.length);
  assert.ok(findings.every((x) => x.tone === "neutral"));
  for (const legacy of ["sons", "daughters", "undecided", "cancelled"]) assert.equal(legacy in result.reading.children, false);
  const text = [children.headline, result.reading.children.headline, ...result.reading.children.notes, ...findings.map((x) => x.text)].join(" ");
  assert.doesNotMatch(text, /children after long delay and by an unconventional path|a daughter is indicated|a son is indicated|conception is easy|remedies and medical care are indicated/i);
  assert.match(text, /cannot (establish|determine|assess)/i);
  assert.equal(readTopic("children", { ...agreementInput(result, true), inSeason: () => true }).stances.find((x) => x.system === "bnn")?.word, "no verdict");
});
