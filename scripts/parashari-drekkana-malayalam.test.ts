import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parashariDrekkanaMalayalam } from "../shared/malayalam-parashari-drekkana";
import type { DasaReading } from "../shared/parashari-dasa";
import type { PlanetPosition } from "../shared/astro";
import { computeChart } from "../server/routes";
import { buildReport, type ReportSection } from "../shared/report";
import type { Chart } from "../shared/schema";

test("drekkana timing preserves degrees, placement and retrograde reversal", () => {
  const source = "Mars at 2.0 deg of Aries is in the 1st drekkana, retrograde, so the order reverses: its results are felt mainly at the end of the dasa.";
  const position = { planet: "Mars", signIndex: 0, degInSign: 2, retrograde: true } as PlanetPosition;
  const d = { lord: "Mars", timing: { third: 3, reversed: true, text: source } } as DasaReading;
  const ml = parashariDrekkanaMalayalam(d, [position], source)!;
  for (const part of ["ചൊവ്വ", "മേടം", "2.0", "1-ാം", "വക്രഗതിയായതിനാൽ", "അവസാനത്തിൽ"]) assert.ok(ml.includes(part), part);
  assert.equal(parashariDrekkanaMalayalam(d, [position], source + " Extra condition."), undefined);
  assert.equal(parashariDrekkanaMalayalam({ ...d, timing: { ...d.timing, third: 1 } }, [position], source), undefined);
  assert.equal(parashariDrekkanaMalayalam(d, [{ ...position, retrograde: false }], source), undefined);
  const middle = "Mars at 19.9 deg of Aries is in the 2nd drekkana: its results are felt mainly at the middle of the dasa.";
  const direct = { ...position, degInSign: 19.9, retrograde: false };
  assert.match(parashariDrekkanaMalayalam({ ...d, timing: { ...d.timing, third: 2, reversed: false, text: middle } }, [direct], middle)!, /2-ാം.*മധ്യത്തിൽ/);
});

test("reports translate period timing in both modes without changing citation or provisional flags", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const chart = { id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...fixture.cases[0] } as Chart;
  const result = computeChart(chart);
  const flat = (xs: ReportSection[]): ReportSection[] => xs.flatMap((s) => [s, ...flat(s.sub ?? [])]);
  for (const plain of [true, false]) {
    const en = flat(buildReport(result, { plain, modules: ["parashari"], locale: "en" }).sections).filter((s) => s.id.startsWith("dasa-"));
    const ml = flat(buildReport(result, { plain, modules: ["parashari"], locale: "ml" }).sections).filter((s) => s.id.startsWith("dasa-"));
    let count = 0;
    for (let i = 0; i < en.length; i++) {
      const j = en[i].paras.findIndex((p) => p.text?.includes("drekkana") && p.text.includes("results are felt mainly"));
      if (j < 0) continue;
      assert.equal(ml[i].paras[j].lang, "ml");
      assert.deepEqual(ml[i].paras[j].cites, en[i].paras[j].cites);
      assert.equal(ml[i].paras[j].provisional, en[i].paras[j].provisional);
      count++;
    }
    assert.ok(count >= 6, `${count} period timing paragraphs`);
  }
});
