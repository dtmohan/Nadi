import test from "node:test";
import assert from "node:assert/strict";
import { computeChart } from "../server/routes";
import type { Chart } from "../shared/schema";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { alpHouseLordInterpretations, expandedSchoolTopicBriefs } from "../shared/school-topics-expanded";
import { synthesize, firstClause } from "../shared/synthesis";
import { plainTopicNatal } from "../shared/topic-brief";
import { computeVargas } from "../shared/vargas";
import { VARGA_MEANING_BY_KEY } from "../shared/varga-meanings";
import { computeGochara } from "../shared/gochara";
import { SIGNS } from "../shared/astro";
import { PRASNA_HOUSE_EFFECT_PLAIN } from "../shared/prasna-plain";
import { concealAvasthaEffect, divisionalPlanetContext, gocharaContext, kpHouseContext, kpStageLabel, parashariHouseContext, parashariPlanetContext } from "../shared/chart-explanations";
import { buildReport } from "../shared/report";
import { kpFindingPlain } from "../shared/rules-kp";
import { plainSarvarthaHighlights } from "../shared/sarvartha-plain";
import { SC_BHAVA_RULES } from "../shared/sarvartha";

// A synthetic chart, not a personal case or an assertion of predictive validity.
const chart = { id: 0, name: "Synthetic explanation", gender: "male", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 5, notes: "", deathDate: null, events: [] } as Chart;
const result = computeChart(chart);
result.now.asOf = "2026-11-01T12:00:00Z";
const input = agreementInput(result, true);

test("Parashari explanations use the evaluated house, lord and planet checks", () => {
  for (const h of input.parashari.bhavas) {
    const text = parashariHouseContext(h);
    assert.ok(text.includes(h.sign));
    assert.ok(text.includes(h.lord));
    assert.ok(text.includes(`${h.lordIn}${[1, 2, 3].includes(h.lordIn) ? ["", "st", "nd", "rd"][h.lordIn] : "th"}`));
    for (const p of h.occupants) assert.ok(text.includes(p));
  }
  for (const n of input.parashari.natures) {
    const lines = parashariPlanetContext(n, input.parashari.checks[n.planet] ?? []);
    assert.ok(lines[0].includes(n.planet));
    assert.equal(lines.length, 1 + (input.parashari.checks[n.planet] ?? []).filter((c) => c.kind !== "place").length);
  }
});

test("KP explanation uses the requested four- or six-step set and the KP cusp frame", () => {
  const c = input.kp.cusps[6];
  const p = input.kp.planets.find((x) => x.planet === c.subLord)!;
  const s = input.kp.significators.find((x) => x.planet === c.subLord)!;
  const four = kpHouseContext(c, p, s.houses, false);
  const six = kpHouseContext(c, p, s.housesSix, true);
  assert.match(four, /four-step/);
  assert.match(six, /six-step/);
  assert.ok(four.includes(c.subLord) && four.includes(p.starLord));
  for (const house of s.houses) assert.match(four, new RegExp(`\\b${house}(st|nd|rd|th)\\b`));
  for (const house of s.housesSix) assert.match(six, new RegExp(`\\b${house}(st|nd|rd|th)\\b`));
  const node = input.kp.planets.find((x) => x.planet === "Rahu")!;
  assert.match(kpStageLabel(node, "D"), /represents/);
  assert.doesNotMatch(kpStageLabel(node, "D"), /rules/);
  assert.match(kpStageLabel({ ...node, starLord: "Ketu", subLord: "Rahu" }, "C"), /represents/);
  assert.match(kpStageLabel({ ...node, starLord: "Ketu", subLord: "Rahu" }, "F"), /represents/);
});

test("divisional explanations use the actual division and avoid house readings for D2 and D30", () => {
  const v = computeVargas(result.positions, result.jaimini.lagna.lon);
  for (const key of ["D2", "D9", "D10", "D30"] as const) {
    for (const p of v.planets) {
      const lines = divisionalPlanetContext(p, v.charts[key], key, VARGA_MEANING_BY_KEY[key]);
      assert.ok(lines[0].includes(SIGNS[p.signs[key]]));
      assert.ok(lines[0].includes(SIGNS[p.signs.D1]));
      if (key === "D2" || key === "D30") assert.ok(!lines.some((line) => /occupies the \d+(st|nd|rd|th) house/.test(line)));
      else assert.ok(lines.some((line) => /occupies the \d+(st|nd|rd|th) house/.test(line)));
    }
  }
});

test("Moon-based transit explanation uses the actual reference and retains vedha", () => {
  const moon = result.positions.find((p) => p.planet === "Moon")!;
  const reading = computeGochara(moon.signIndex, result.now.positions, result.now.asOf, false);
  for (const row of reading.rows) {
    const text = gocharaContext(row, moon.signIndex);
    assert.ok(text.includes(SIGNS[moon.signIndex]) && text.includes(SIGNS[row.signIndex]));
    assert.ok(text.includes(`${row.house}${[1, 2, 3].includes(row.house) ? ["", "st", "nd", "rd"][row.house] : "th"}`));
    assert.equal(text.includes("obstruction point"), row.vedhaBy.length > 0 && !!row.vedhaPoint);
  }
});

test("each displayed Nadi theme retains the identity and source of its own evaluated finding", () => {
  for (const area of synthesize(result.reading, result.reading.roles.gender)) {
    const plain = plainTopicNatal(area.area, area, result.reading);
    for (const evidence of plain.detailEvidence ?? []) {
      if (!evidence) continue;
      const f = result.reading.findings.find((x) => x.ruleId === evidence.ruleId);
      assert.ok(f && f.area === area.area);
      assert.equal(evidence.source, f.source);
      for (const p of f.planets) assert.ok(evidence.text.includes(p));
    }
  }
});

test("plain Sarvartha highlights only paraphrase matched, identifiable source rules", () => {
  const actual = result.sarvartha?.findings ?? [];
  for (const f of plainSarvarthaHighlights(actual)) {
    const match = actual.find((x) => x.house === f.house && x.stanza === f.stanza)!;
    const chapter = SC_BHAVA_RULES.find((x) => x.house === f.house)!;
    assert.ok(match && chapter.rules.some((r) => r.stanza === f.stanza));
    assert.equal(f.ref, `${chapter.chapter}.${f.stanza}`);
    assert.equal(f.provisional, match.fidelity === "provisional");
  }
  assert.deepEqual(plainSarvarthaHighlights([{ house: 2, stanza: 15, topic: "support", text: "no one to help him in his living", fidelity: "cited" }]), []);
  const family = plainSarvarthaHighlights([{ house: 2, stanza: 12, topic: "support", text: "protects and rears his family and many others, with very nice speech", fidelity: "cited" }]);
  assert.equal(family[0].ref, "3.12");
  assert.match(family[0].text, /family.*speech/);
});

test("school contexts and report expose the same facts without changing stances or scored inputs", () => {
  const before = JSON.stringify({ p: input.parashari, kp: input.kp, nadi: result.reading });
  const agreement = computeAgreement(input);
  const par = expandedSchoolTopicBriefs(result, "parashari", input, agreement).find((b) => b.topic === "career")!;
  const kp = expandedSchoolTopicBriefs(result, "kp", input, agreement).find((b) => b.topic === "marriage")!;
  assert.ok(par.explanation?.[0].includes(input.parashari.bhavas[9].lord));
  assert.ok(kp.explanation?.[0].includes(input.kp.cusps[6].subLord));
  const report = buildReport(result, { plain: true, modules: ["parashari", "kp"] });
  for (const [school, b] of [["parashari", par], ["kp", kp]] as const) {
    const section = report.sections.find((s) => s.id === `${school}-plain-topics`)!;
    assert.ok(section.paras.some((p) => p.text === b.explanation?.[0]));
  }
  assert.equal(JSON.stringify({ p: input.parashari, kp: input.kp, nadi: result.reading }), before);
});

test("source-page abbreviations do not truncate summaries, and children wording is qualified", () => {
  assert.equal(firstClause("Children and learning (p. 36). Another line."), "Children and learning (p. 36)");
  assert.equal(firstClause("Rule 3.2 is noted; a second clause"), "Rule 3.2 is noted");
  assert.equal(Object.keys(PRASNA_HOUSE_EFFECT_PLAIN).length, 12);
  assert.match(PRASNA_HOUSE_EFFECT_PLAIN[5].malefic, /requires affliction/);
  assert.match(PRASNA_HOUSE_EFFECT_PLAIN[5].benefic, /does not establish a family outcome/);
  assert.match(kpFindingPlain({ ruleId: "kp1-suicidal", text: "self-destructive claim" }), /cannot assess/);
  assert.doesNotMatch(kpFindingPlain({ ruleId: "kp1-suicidal", text: "self-destructive claim" }), /self-destructive/);
  assert.match(kpFindingPlain({ ruleId: "kp7-marriage", text: "marriage is promised" }), /do not guarantee/);
  assert.equal(concealAvasthaEffect("harm to the spouse and financial ruin"), true);
  assert.equal(concealAvasthaEffect("knowledge and interest in music"), false);
});

test("ALP house-lord explanations use only a fired, reviewed rule for that house", () => {
  const finding = { ruleId: "b2c12-10th-lord-in-5", chapter: "book2-ch12", text: "original source", weight: 2 as const, source: "Book 2, pp. 86–87", planets: ["Mars" as const], here: ["10th lord Mars in the 5th"] };
  const selected = alpHouseLordInterpretations(10, [finding]);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].ruleId, finding.ruleId);
  assert.equal(selected[0].source, finding.source);
  assert.match(selected[0].text, /stagnation in work/);
  assert.deepEqual(alpHouseLordInterpretations(4, [finding]), []);
  assert.deepEqual(alpHouseLordInterpretations(10, []), []);
});
