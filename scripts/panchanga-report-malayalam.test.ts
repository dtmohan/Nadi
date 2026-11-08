import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { buildReport } from "../shared/report";
import { birthStarReading } from "../shared/birth-star";
import { birthStarLeadMalayalam, moonSkyMalayalam, nadiSkyMalayalam, panchangaDayMalayalam, PANCHANGA_REPORT_NOTES } from "../shared/malayalam-panchanga-report";
import type { Chart } from "../shared/schema";

test("public reports translate birth-day, star and sky paragraphs with citations intact", () => {
  const cases = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases.slice(0, 4);
  for (const person of cases) {
    const chart = computeChart({ id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...person } as Chart);
    for (const plain of [true, false]) {
      const report = buildReport(chart, { plain, modules: ["panchanga"], locale: "ml" });
      const day = report.sections.find((s) => s.id === "day")!;
      const star = report.sections.find((s) => s.id === "birth-star")!;
      assert.ok(day.paras[0].text?.includes("സൂര്യോദയം"));
      assert.equal(day.paras[0].lang, "ml");
      assert.ok(day.paras[0].cites?.length);
      assert.equal(star.paras[0].lang, "ml");
      assert.ok(star.paras[0].cites?.length);
      const sky = report.sections.find((s) => s.id === "now");
      if (sky) {
        assert.equal(sky.paras[0].lang, "ml");
        assert.ok(sky.paras.filter((p) => p.kind !== "table").every((p) => p.lang === "ml"));
      }
    }
  }
});

test("generated clauses reject changed source, unknown names and preserve quadrants", () => {
  const star = birthStarReading(15, { withhold: true })!;
  const moon = "Counted from the natal Moon in Aries, each transiting planet's sign is a house; the favourable houses and their vedha points follow the Brihat Samhita, the effects and the effective portion of each transit Phaladeepika 26.";
  assert.ok(moonSkyMalayalam("Aries", moon)?.includes("മേടം"));
  assert.equal(moonSkyMalayalam("Aries", `${moon} extra`), undefined);
  const sky = "Jupiter stands in Aries, in trine to the natal Jeeva in Leo; Saturn stands in Libra, opposite it. In the Nadi method Jupiter's yearly passage is the clock and Saturn's the second hand: a matter ripens when Jupiter comes over its karaka or in trine to it while the chart already carries the combination.";
  const ml = nadiSkyMalayalam("Aries", "Libra", "Leo", 5, 7, sky)!;
  assert.ok(ml.includes("ത്രികോണത്തിൽ") && ml.includes("ഏഴാം"));
  assert.equal(nadiSkyMalayalam("Aries", "Libra", "Leo", 5, 7, `${sky} extra`), undefined);
  assert.equal(birthStarLeadMalayalam(star, true, "modified"), undefined);
  const person = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8")).cases[0];
  const result = computeChart({ id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...person } as Chart);
  assert.equal(panchangaDayMalayalam(result.panchanga!, "00:00", "00:00", "modified"), undefined);
});

test("quarter descriptions retain uncertainty and only match their complete source", () => {
  const source = "Sutton includes this among the quarters that nourish a planet's expression. It is one supportive qualification, not a separate prediction.";
  assert.ok(PANCHANGA_REPORT_NOTES[source].includes("വേറിട്ട പ്രവചനമല്ല"));
  assert.equal(PANCHANGA_REPORT_NOTES[`${source} Additional condition.`], undefined);
});
