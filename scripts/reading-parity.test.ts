import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EVENT_MATTERS, matterOf, type ChartEvent } from "@shared/events";
import { eventReadingAllowed } from "@shared/event-reading";
import { MANLEY_TOPICS } from "@shared/manley-evidence";
import { kpNatalConditions, parashariNatalConditions } from "@shared/natal-reading-evidence";
import { KP_EVENT_FIELDS, MANLEY_FRAME_FIELDS, RECTIFY_RULE_SCOPE } from "@shared/reading-rule-catalog";
import { RECTIFY_METHODS } from "@shared/rectify-methods";
import { buildReport } from "@shared/report";
import { insertChartSchema } from "@shared/schema";
import { KpNatalRules, ParashariNatalRules } from "../client/src/components/natal-rule-evidence";
import { computeChart } from "../server/routes";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { validateEvents } from "../server/validate";

const base = insertChartSchema.parse({ name: "Synthetic parity", gender: "male", birthDate: "1990-01-01",
  birthTime: "12:00:00", timezone: "Asia/Kolkata", timeStandard: "zone", place: "Bengaluru",
  latitude: 12.9716, longitude: 77.5946, ayanamsa: "raman", nodeType: "true" });
const asOf = "2026-11-01T12:00:00Z";
const full = { ...base, id: 100, gender: "male", timeStandard: "zone", ayanamsa: "raman", nodeType: "true",
  sunriseDef: "edge", parashariHouseMethod: "sripati", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] };
const eventFor = (matter: string): ChartEvent => ({ id: matter, matter, date: "2013-03-11",
  time: "11:15", timezone: "America/New_York" });
const asRectifyEvent = (event: ChartEvent) => { const m = matterOf(event.matter);
  return { ...event, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; };

test("all scoped rectification methods are inventoried", () => {
  const expected = RECTIFY_METHODS.filter((m) => m.system === "KP" || m.system === "Parashari").map((m) => m.id).sort();
  assert.deepEqual(Object.keys(RECTIFY_RULE_SCOPE).sort(), expected);
});

test("natal evidence is the actual date-independent part of every registered event engine", () => {
  const chart = computeChart(full);
  chart.now.asOf = asOf;
  const para = parashariNatalConditions(chart), kp = kpNatalConditions(chart);
  assert.deepEqual(para.map((x) => x.matter), Object.keys(MANLEY_TOPICS).filter((m) => eventReadingAllowed(m, chart.utc, asOf, chart.chart)));
  assert.deepEqual(kp.map((x) => x.matter), EVENT_MATTERS.filter((m) => eventReadingAllowed(m.id, chart.utc, asOf, chart.chart)).map((m) => m.id));
  assert.equal(kp.find((x) => x.matter === "vehicle")?.strict, undefined);
  for (const topic of para) {
    const dated = topicReading(base, eventFor(topic.matter), asOf);
    assert.ok(dated.manley, topic.matter);
    for (const period of [...dated.manley.periods, dated.manley.antara!]) {
      const natal = topic.planets.find((p) => p.planet === period.planet)!;
      assert.deepEqual(natal.frames, period.frames, `${topic.matter}: ${period.level}`);
      assert.deepEqual(Object.keys(natal.frames[0]).sort(), Object.keys(MANLEY_FRAME_FIELDS).sort());
    }
    if (dated.manley.educationFourth) for (const item of dated.manley.educationFourth) {
      const frame = topic.educationFourth!.find((p) => p.planet === item.planet)!.frame;
      assert.deepEqual([frame.houseSign, frame.houseLord, frame.primary.house, frame.primary.houseLord],
        [item.houseSign, item.houseLord, item.house, item.houseLordLinks]);
    }
    if (dated.parashariPromise && topic.support) {
      for (const key of ["d1Support", "d1Strain", "divisionSupport", "divisionStrain"] as const)
        assert.deepEqual(topic.support[key], dated.parashariPromise[key], `${topic.matter}: ${key}`);
    }
    if (dated.parashariHierarchy && topic.foundation) {
      assert.deepEqual(topic.foundation.d1, dated.parashariHierarchy.d1);
      assert.deepEqual(topic.foundation.divisionCheck, dated.parashariHierarchy.divisionCheck);
      assert.deepEqual(topic.foundation.planets, dated.parashariHierarchy.crossChart?.planets);
    }
    const factors = dated.parashariSpecific?.factors ?? [];
    if (topic.specific?.careerLords) assert.deepEqual(topic.specific.careerLords, factors.find((f) => f.id === "d10-lords"));
    if (topic.specific?.periodSet) for (const f of factors.filter((v) => v.id === "dasa" || v.id === "bhukti")) {
      const planet = f.details[0].split(":")[0];
      assert.equal(f.matched, topic.specific.periodSet.some((p) => p.planet === planet));
    }
    const k = kp.find((x) => x.matter === topic.matter)!;
    assert.deepEqual([k.basic.cuspSubLord, k.basic.signified, k.basic.matched, k.basic.deniedAtCusp],
      [dated.kp.cuspSubLord, dated.kp.cuspSignified, dated.kp.promised, dated.kp.deniedAtCusp]);
    if (k.strict) assert.deepEqual(k.strict.layers, dated.kp.aurora!.layers.filter((l) => l.role.startsWith("Cusp ")));
    if (k.mixed) assert.deepEqual(k.mixed.layers, dated.kp.auroraV2!.layers.filter((l) => l.role.startsWith("Cusp ")));
  }
  const rendered = renderToStaticMarkup(createElement(ParashariNatalRules, { result: chart })) +
    renderToStaticMarkup(createElement(KpNatalRules, { result: chart }));
  assert.match(rendered, /All planets/);
  assert.match(rendered, /kp-natal-vehicle/);
  assert.match(rendered, /whole-sign houses/);
  const report = buildReport(chart, { plain: false, modules: ["parashari", "kp"] });
  const sections = report.sections.flatMap((s) => s.sub ?? []);
  assert.ok(sections.some((s) => s.id === "parashari-natal-conditional-rules"));
  assert.ok(sections.some((s) => s.id === "kp-natal-event-conditions"));
  assert.match(JSON.stringify(sections), /planet lordships and links/);
  assert.match(JSON.stringify(sections), /Loss of spouse/);
  const plain = buildReport(chart, { plain: true, modules: ["kp"] });
  const plainNatal = plain.sections.flatMap((s) => s.sub ?? []).find((s) => s.id === "kp-natal-event-conditions");
  assert.ok(plainNatal);
  assert.doesNotMatch(JSON.stringify(plainNatal), /Loss of spouse/);
  assert.doesNotMatch(renderToStaticMarkup(createElement(KpNatalRules, { result: chart, plain: true })), /Loss of spouse/);
});

test("a rectification midpoint and a chosen date use the same KP and Parashari event fields", () => {
  const event = eventFor("marriage");
  const scan = rectify({ chart: base, windowMinutes: 1, events: [asRectifyEvent(event)] });
  const s = scan.segments.find((x) => x.given && x.selectable)!;
  assert.ok(s);
  const candidate = { ...base, birthDate: s.midDate ?? base.birthDate, birthTime: s.mid };
  const dated = topicReading(candidate, event, asOf);
  assert.deepEqual(dated, validateEvents({ ...candidate, events: [event] }).events[0]);
  const eventCheck = s.events[0];
  assert.deepEqual(Object.keys(KP_EVENT_FIELDS).sort(), Object.keys(eventCheck).filter((key) => key in KP_EVENT_FIELDS).sort());
  for (const key of Object.keys(KP_EVENT_FIELDS) as Array<keyof typeof KP_EVENT_FIELDS>) {
    if (key === "transit") {
      const { evidence: _unused, ...common } = dated.kp.transit;
      assert.deepEqual(eventCheck.transit, common, key);
    } else assert.deepEqual(eventCheck[key], dated.kp[key], key);
  }
  assert.deepEqual(s.parashariVargas?.[0], dated.parashariVargas);
  assert.deepEqual(s.parashariPromise?.[0], dated.parashariPromise);
  assert.deepEqual(s.parashariSpecific?.[0], dated.parashariSpecific);
  assert.deepEqual(s.parashariDivisional?.[0], dated.parashariDivisional);
  assert.deepEqual(s.parashariHierarchy?.[0], dated.parashariHierarchy);
  assert.deepEqual(s.manley?.[0], dated.manley);
});

test("the new natal projections obey the ordinary age and sensitivity gates", () => {
  const minor = computeChart({ ...full, birthDate: "2015-01-01", id: 101 });
  minor.now.asOf = "2025-06-01T12:00:00Z";
  const kp = kpNatalConditions(minor).map((topic) => topic.matter);
  const para = parashariNatalConditions(minor).map((topic) => topic.matter);
  assert.ok(kp.includes("education"));
  assert.ok(para.includes("education"));
  for (const matter of ["marriage", "child", "accident", "father", "spouse"]) {
    assert.ok(!kp.includes(matter), matter);
    assert.ok(!para.includes(matter), matter);
  }
});
