import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PLANETS } from "../shared/astro";
import { directionClause, type Flow } from "../shared/flow";
import { bandSentence, type Finding } from "../shared/rules";
import { bnnDirectionMalayalam } from "../shared/malayalam-bnn-direction";
import { translate } from "../shared/localization";
import { buildReport, type ReportSection } from "../shared/report";
import { computeChart } from "../server/routes";
import type { Chart } from "../shared/schema";

const findingOf = (flow: Flow): Finding => ({ ruleId: "test", area: "career", text: "", score: 0, planets: [flow.from, flow.to], relation: null, viaRetro: false, flow });

test("BNN direction translations cover known roles while refusing changed sources", () => {
  for (const from of PLANETS) for (const to of PLANETS) for (const female of [false, true]) {
    const flow: Flow = { from, to, tier: "sign", approach: "following", sameSign: true };
    const source = `Direction: ${directionClause(flow, female)}.`;
    const f = findingOf(flow);
    const ml = bnnDirectionMalayalam(f, female, source);
    assert.ok(ml, source);
    assert.ok(ml.includes(translate("ml", from)));
    assert.equal(bnnDirectionMalayalam(f, female, `${source} New condition.`), undefined);
    assert.equal(bnnDirectionMalayalam(f, female, `${source} Within the ±5-minute birth-time band: at the earlier end this line does not fire.`), undefined);
  }
  const mars: Flow = { from: "Mars", to: "Venus", tier: "trine", approach: "closing", sameSign: false };
  const male = bnnDirectionMalayalam(findingOf(mars), false, `Direction: ${directionClause(mars, false)}.`)!;
  const female = bnnDirectionMalayalam(findingOf(mars), true, `Direction: ${directionClause(mars, true)}.`)!;
  assert.ok(female.includes("ഭർത്താവ്"));
  assert.ok(female.includes("അവളുടെ വ്യക്തിത്വവും"));
  assert.ok(male.includes("വിവാഹവും"));
  assert.notEqual(male, female);
});

test("birth-time band translations retain both edges, relation and flow changes", () => {
  const flow: Flow = { from: "Mars", to: "Venus", tier: "sign", approach: "following", sameSign: true };
  const f = findingOf(flow);
  for (const earlier of [
    { fires: false },
    { fires: true, flow: { ...flow, tier: "pada" as const } },
    { fires: true, flow: { ...flow, from: "Venus" as const, to: "Mars" as const } },
    { fires: true, relation: "opposite" as const },
    { fires: true, house: 2 },
    { fires: true },
  ]) {
    f.band = { minutes: 15, earlier, later: { fires: false } };
    const source = `Direction: ${directionClause(flow, true)}. ${bandSentence(f, true)}`;
    const ml = bnnDirectionMalayalam(f, true, source);
    assert.ok(ml, source);
    assert.ok(ml.includes("±15"));
    assert.ok(ml.includes("പിന്നീടുള്ള"));
    assert.equal(bnnDirectionMalayalam(f, true, `${source} Extra condition.`), undefined);
  }
});

test("practitioner BNN report keeps direction citations and provisional flags in Malayalam", () => {
  const person = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases[0];
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...person } as Chart;
  const result = computeChart(chart);
  const flatten = (ss: ReportSection[]): ReportSection[] => ss.flatMap((s) => [s, ...flatten(s.sub ?? [])]);
  const en = flatten(buildReport(result, { plain: false, modules: ["bnn"], locale: "en" }).sections);
  const ml = flatten(buildReport(result, { plain: false, modules: ["bnn"], locale: "ml" }).sections);
  let count = 0;
  for (const section of en) {
    const translated = ml.find((s) => s.id === section.id)!;
    section.paras.forEach((p, i) => {
      if (!p.text?.startsWith("Direction:")) return;
      const q = translated.paras[i];
      assert.equal(q.lang, "ml");
      assert.equal(q.provisional, true);
      assert.deepEqual(q.cites, p.cites);
      count++;
    });
  }
  assert.ok(count > 0);
});
