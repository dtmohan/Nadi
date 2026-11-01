import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RULE_QUALIFICATIONS, RECTIFY_QUALIFICATION } from "@shared/rule-qualifications";
import { RECTIFY_METHODS } from "@shared/rectify-methods";
import { kpNatalConditions, parashariNatalConditions } from "@shared/natal-reading-evidence";
import { kpQualifiedSummary, parashariQualifiedSummary } from "@shared/qualified-natal-summary";
import { buildReport } from "@shared/report";
import { insertChartSchema } from "@shared/schema";
import { RuleQualificationList } from "../client/src/components/rule-qualification-list";
import { KpNatalRules, ParashariNatalRules } from "../client/src/components/natal-rule-evidence";
import { computeChart } from "../server/routes";

const base = insertChartSchema.parse({ name: "Synthetic qualification", gender: "female", birthDate: "1990-01-01",
  birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "zone", place: "Bengaluru",
  latitude: 12.9716, longitude: 77.5946, ayanamsa: "lahiri", nodeType: "mean" });
const chart = computeChart({ ...base, id: 1, gender: "female", timeStandard: "zone", ayanamsa: "lahiri", nodeType: "mean",
  sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] });
chart.now.asOf = "2026-11-01T12:00:00Z";

test("each event rectification method is attached to an explicit and visible qualification", () => {
  const ids = RULE_QUALIFICATIONS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  const methods = RECTIFY_METHODS.filter((m) => m.system === "KP" || m.system === "Parashari").map((m) => m.id);
  assert.deepEqual(Object.keys(RECTIFY_QUALIFICATION).sort(), methods.sort());
  for (const id of Object.values(RECTIFY_QUALIFICATION)) assert.ok(ids.includes(id));
  for (const system of ["KP", "Parashari"] as const) {
    const html = renderToStaticMarkup(createElement(RuleQualificationList, { system }));
    for (const rule of RULE_QUALIFICATIONS.filter((r) => r.system === system)) {
      assert.ok(rule.needs && rule.checks && rule.limits && rule.source.label, rule.id);
      assert.match(html, new RegExp(`qualified-rule-${rule.id}`));
    }
  }
});

test("the plain natal summary preserves mixed clues and does not turn missing clues into an event denial", () => {
  const original = parashariNatalConditions(chart).find((x) => x.matter === "marriage")!;
  const f = original.foundation!;
  const synthetic = { ...original, foundation: { ...f, planets: [],
    d1: { ...f.d1, support: ["a listed supportive factor"], strain: ["a listed difficult factor"] },
    divisionCheck: { ...f.divisionCheck, support: [], strain: [] } } };
  const row = parashariQualifiedSummary([synthetic])[0];
  assert.match(row.text, /support such as a listed supportive factor; strain such as a listed difficult factor/);
  assert.match(row.text, /no listed support; no listed strain/);
  assert.doesNotMatch(row.text, /denied|promised|will occur/i);

  const kp = kpNatalConditions(chart).find((x) => x.matter === "marriage")!;
  const silent = { ...kp, basic: { ...kp.basic, signified: [], matched: false },
    strict: kp.strict && { ...kp.strict, allCuspsSupported: false }, mixed: kp.mixed && { ...kp.mixed, allCuspsSupported: true } };
  const krow = kpQualifiedSummary([silent])[0];
  assert.match(krow.text, /no listed matter-house link/);
  assert.match(krow.text, /unresolved and supported, respectively/);
  assert.doesNotMatch(krow.text, /denied|promised|will occur/i);
  if (silent.mixed) {
    const cautious = { ...silent, mixed: { ...silent.mixed, cautions: 1 } };
    assert.match(kpQualifiedSummary([cautious])[0].text, /supported with caution/);
  }
});

test("chart and report use the same qualified natal summaries", () => {
  const ps = parashariQualifiedSummary(parashariNatalConditions(chart));
  const ks = kpQualifiedSummary(kpNatalConditions(chart));
  const ph = renderToStaticMarkup(createElement(ParashariNatalRules, { result: chart }));
  const kh = renderToStaticMarkup(createElement(KpNatalRules, { result: chart, plain: true }));
  const report = buildReport(chart, { plain: false, modules: ["parashari", "kp"] });
  const texts = report.sections.flatMap((section) => section.sub ?? []).flatMap((s) => s.paras.map((p) => p.text ?? ""));
  for (const row of ps) { assert.ok(ph.includes(row.text), row.matter); assert.ok(texts.includes(`${row.label}: ${row.text}`)); }
  for (const row of ks) { assert.ok(kh.includes(row.text), row.matter); assert.ok(texts.includes(`${row.label}: ${row.text}`)); }
  assert.match(ph, /a missing clue does not settle an outcome/i);
  assert.match(kh, /research interpretations/);
});
