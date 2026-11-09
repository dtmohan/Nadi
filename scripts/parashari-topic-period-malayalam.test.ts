import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Settings } from "luxon";
import { topicPeriods, type TopicPeriodsInput } from "../shared/parashari-topic-periods";
import { parashariTopicPeriodMalayalam } from "../shared/malayalam-parashari-topic-period";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import type { Chart } from "../shared/schema";

test("topic period translation keeps dates, lordship, lean and all conditional qualifications", () => {
  const input: TopicPeriodsInput = {
    bhavas: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, signIndex: i, lord: [4, 6, 9, 10].includes(i + 1) ? "Sun" as const : "Moon" as const, lordIn: 1, lordSignIndex: 0 })),
    dasaReadings: [{ lord: "Sun", start: "2021-01-01T00:00:00Z", end: "2027-01-01T00:00:00Z", ageStart: 20, ageEnd: 26, current: true, lean: { step: "favourable", favour: 6, against: 1 } }],
  };
  const topics = topicPeriods(input, { birthIso: "2000-01-01T00:00:00Z", asOfIso: "2025-01-01T00:00:00Z", deceased: false });
  const health = topics.find((t) => t.topic === "health")!.periods[0];
  for (const plain of [true, false]) {
    const src = plain ? health.textPlain : health.text;
    const ml = parashariTopicPeriodMalayalam(health, "health", src, plain)!;
    for (const expected of ["സൂര്യൻ", "6-ാം", "2021", "2027", "20", "26", "ഇപ്പോൾ", plain ? "കാഠിന്യം കുറയ്ക്കുന്നു" : "48.1, 48.8"]) assert.ok(ml.includes(expected), expected);
    assert.equal(parashariTopicPeriodMalayalam(health, "health", src + " Additional condition.", plain), undefined);
    assert.equal(parashariTopicPeriodMalayalam({ ...health, houses: [7] }, "health", src, plain), undefined);
  }
  const wealth = topics.find((t) => t.topic === "wealth")!.periods[0];
  const ml = parashariTopicPeriodMalayalam(wealth, "wealth", wealth.textPlain, true)!;
  assert.ok(ml.includes("4-ാം") && ml.includes("9-ാം") && ml.includes("ഭാവങ്ങളുടെ"));
  assert.ok(ml.includes("വീടോ ഭൂമിയോ") && ml.includes("അപ്രതീക്ഷിത"));
});

test("published report topic periods keep citations, tones and provisional flags", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  Settings.now = () => Date.parse(fixture.asOf);
  try {
    const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
    const result = computeChart(chart);
    const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
    let count = 0;
    for (const plain of [true, false]) {
      const en = flat(buildReport(result, { plain, modules: ["parashari"], locale: "en" }).sections).filter((s) => s.id.startsWith("topic-"));
      const ml = flat(buildReport(result, { plain, modules: ["parashari"], locale: "ml" }).sections).filter((s) => s.id.startsWith("topic-"));
      assert.deepEqual(ml.map((s) => s.id), en.map((s) => s.id));
      for (let i = 0; i < en.length; i++) for (let j = 0; j < en[i].paras.length; j++) {
        if (ml[i].paras[j].lang !== "ml" || !en[i].paras[j].text?.includes("Parashara")) continue;
        assert.deepEqual(ml[i].paras[j].cites, en[i].paras[j].cites);
        assert.equal(ml[i].paras[j].tone, en[i].paras[j].tone);
        assert.equal(ml[i].paras[j].provisional, en[i].paras[j].provisional);
        count++;
      }
    }
    assert.ok(count > 0);
  } finally { Settings.now = () => Date.now(); }
});
