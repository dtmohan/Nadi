import test from "node:test";
import assert from "node:assert/strict";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { computeKarmajiva, KARMAJIVA_SOURCES } from "../shared/karmajiva";
import { natalPlanetContext } from "../shared/planet-context";
import { buildWorkKarmajiva } from "../shared/work-karmajiva";
import { mentionsHeldArea, withholdText } from "../shared/life-stage";
import type { Chart } from "../shared/schema";

const makeChart = (birthDate: string, overrides: Partial<Chart> = {}): Chart => ({
  id: 0, name: "Synthetic", gender: "female", birthDate, birthTime: "12:00", timezone: "Asia/Kolkata",
  timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59,
  ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi",
  notes: "", timeUncertaintyMin: 0, events: [], deathDate: null, ...overrides,
} as Chart);
const before = Settings.now;
Settings.now = () => Date.parse("2026-11-09T12:00:00Z");
test.after(() => { Settings.now = before; });

test("livelihood chains preserve the independently calculated three references and source examples", () => {
  const result = computeChart(makeChart("1990-02-01", { timeUncertaintyMin: 15 }));
  const calculation = computeKarmajiva(natalPlanetContext(result), result.jaimini.lagna.signIndex);
  const view = buildWorkKarmajiva(result);
  assert.ok(calculation.caveats.some((c) => /Aiyar's translation reads all three.*without an empty-tenth requirement/.test(c)));
  assert.ok(!calculation.caveats.some((c) => /Iyer reads.*fallback/i.test(c)));
  assert.equal(view.state, "available");
  assert.equal(view.birthTimeSensitive, true);
  assert.deepEqual(view.references.map((r) => r.reference), ["Lagna", "Moon", "Sun"]);
  view.references.forEach((reference, i) => {
    const source = calculation.references[i];
    assert.equal(reference.tenthLord, source.tenthLord);
    assert.equal(reference.navamsaLord, source.navamsaLord);
    assert.equal(reference.callingEn, source.calling);
    assert.ok(reference.en.includes(source.calling));
    assert.ok(/[\u0D00-\u0D7F]/.test(reference.ml));
    assert.ok(/[\u0D00-\u0D7F]/.test(reference.callingMl));
    assert.equal(reference.sourceUrl, KARMAJIVA_SOURCES.v1.url);
    assert.ok([KARMAJIVA_SOURCES.v2.url, KARMAJIVA_SOURCES.v3.url].includes(reference.callingSourceUrl));
  });
  assert.match(view.qualificationEn, /without requiring the tenth house to be empty/i);
  assert.match(view.qualificationMl, /അയ്യര/);
});

test("livelihood is held before its birthday and stays at recorded death when young", () => {
  for (const chart of [makeChart("2011-11-10"), makeChart("2000-01-01", { deathDate: "2010-04-10" })]) {
    const view = buildWorkKarmajiva(computeChart(chart));
    assert.equal(view.state, "held");
    assert.deepEqual(view.references, []);
  }
  const past = buildWorkKarmajiva(computeChart(makeChart("1980-01-01", { deathDate: "2010-04-10" })));
  assert.equal(past.past, true);
  assert.match(past.asOf, /^2010-04-10/);
});

test("age-eligible young reader does not see withheld traditional examples", () => {
  for (const birthTime of ["01:00", "07:00", "13:00", "19:00"]) {
    const result = computeChart(makeChart("2009-01-01", { birthTime }));
    const view = buildWorkKarmajiva(result);
    assert.equal(view.state, "available");
    for (const reference of view.references) {
      assert.equal(withholdText(reference.callingEn), false);
      assert.equal(mentionsHeldArea(reference.callingEn, (area) => area === "marriage" || area === "children"), false);
      assert.ok(reference.en.includes(reference.callingEn));
    }
  }
});
