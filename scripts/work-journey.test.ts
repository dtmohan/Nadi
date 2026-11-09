import test from "node:test";
import assert from "node:assert/strict";
import { Settings } from "luxon";
import { computeChart } from "../server/routes";
import { buildWorkJourney, workConnections, type WorkTheme } from "../shared/work-journey";
import { mentionsHeldArea, withholdText } from "../shared/life-stage";
import type { Chart } from "../shared/schema";
import { BNN_SOURCE_SNAPSHOT } from "../shared/malayalam-bnn-snapshot";

const synthetic = (birthDate: string, deathDate: string | null = null, birthTime = "12:00") => ({
  id: 0, name: "Synthetic", gender: "female", birthDate, birthTime, timezone: "Asia/Kolkata",
  timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59,
  ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi",
  notes: "", timeUncertaintyMin: 0, events: [], deathDate,
} as Chart);
const previousNow = Settings.now;
Settings.now = () => Date.parse("2026-11-08T12:00:00Z");
test.after(() => { Settings.now = previousNow; });

test("work themes retain their evaluated source and do not mutate chart findings", () => {
  const result = computeChart(synthetic("1990-02-01"));
  const before = JSON.stringify(result.reading.findings);
  const journey = buildWorkJourney(result);
  assert.equal(journey.state, "available");
  assert.ok(journey.themes.length > 0);
  for (const item of journey.themes) {
    const source = result.reading.findings.find((f) => f.area === "career" && f.ruleId === item.evidence.ruleId);
    assert.ok(source, `source for ${item.id}`);
    if (item.evidence.sourceText) assert.equal(item.evidence.sourceText, source.text);
    assert.equal(item.evidence.source, source.source);
    assert.ok(item.text.en && item.evidence.en && item.evidence.ml);
  }
  assert.equal(JSON.stringify(result.reading.findings), before);
});

test("shared themes require two distinct explicit sources, and do not turn negation into agreement", () => {
  const make = (id: string, en: string): WorkTheme => ({ id, text: { en }, evidence: {
    ruleId: id, en: "source context", ml: "ഉറവിടം", sourceText: en, planets: [], provisional: false,
    timeSensitive: false, sourceUnverified: false, provenance: "source", testedQualifiers: [], untestedQualifiers: [],
  } });
  assert.deepEqual(workConnections([make("a", "Technical work."), make("a", "Software work.")]), []);
  assert.deepEqual(workConnections([make("a", "Technical work."), make("b", "Not software work.")]), []);
  assert.deepEqual(workConnections([make("a", "Technical work."), make("b", "Software work when a condition applies.")]), []);
  const paired = workConnections([make("a", "Technical work and a possible break."), make("b", "Software and research work.")]);
  assert.equal(paired.length, 1);
  assert.deepEqual(paired[0].themeIds, ["a", "b"]);
  assert.match(paired[0].text.en, /more than one.*technical/i);
  assert.ok(/[\u0D00-\u0D7F]/.test(paired[0].text.ml));
});

test("held careers expose no themes, timing or school evidence", () => {
  for (const [birth, passing] of [["2018-01-01", null], ["2000-01-01", "2012-01-01"]] as const) {
    const journey = buildWorkJourney(computeChart(synthetic(birth, passing)));
    assert.equal(journey.state, "held");
    assert.deepEqual(journey.themes, []);
    assert.deepEqual(journey.windows, []);
    assert.deepEqual(journey.schools, []);
  }
});

test("eligible work source evidence never exposes another held or sensitive topic", () => {
  for (const birthTime of ["01:00", "07:00", "13:00", "19:00"]) {
    const journey = buildWorkJourney(computeChart(synthetic("2009-01-01", null, birthTime)));
    assert.equal(journey.state, "available");
    const held = (area: string) => area === "marriage" || area === "children";
    for (const theme of journey.themes) {
      for (const value of [theme.text.en, theme.evidence.en, theme.evidence.sourceText ?? "", ...theme.evidence.testedQualifiers, ...theme.evidence.untestedQualifiers]) {
        assert.equal(mentionsHeldArea(value, held), false);
        assert.equal(withholdText(value), false);
      }
    }
    for (const school of journey.schools) {
      for (const value of [school.summary, school.basis, school.limit, ...(school.explanation ?? []), ...(school.details ?? []).map((d) => d.text)]) {
        assert.equal(mentionsHeldArea(value, held), false);
      }
    }
  }
});

test("an unreviewed career source with a held marriage clause is omitted", () => {
  const result = computeChart(synthetic("2009-01-01"));
  result.reading.findings = [{
    ruleId: "synthetic-work-conditional", area: "career", text: "Work: technical work; delays in marriage.",
    score: 5, planets: ["Saturn", "Mercury"], relation: "conjunct", viaRetro: false,
    source: "Synthetic test source",
  }];
  const journey = buildWorkJourney(result);
  const theme = journey.themes.find((t) => t.evidence.ruleId === "synthetic-work-conditional");
  assert.equal(theme, undefined);
  assert.doesNotMatch(journey.contrast ?? "", /marriage/i);
});

test("changed source conditions cannot reuse an old editorial paraphrase", () => {
  const result = computeChart(synthetic("1990-02-01"));
  const source = BNN_SOURCE_SNAPSHOT["t-sa-me-ke"];
  assert.ok(source);
  result.reading.findings = [{
    ruleId: "t-sa-me-ke", area: "career", text: `${source} This interpretation applies only with an added condition.`,
    score: 5, planets: ["Saturn", "Mercury", "Ketu"], relation: "conjunct", viaRetro: false,
    source: "Synthetic test source",
  }];
  const theme = buildWorkJourney(result).themes.find((t) => t.evidence.ruleId === "t-sa-me-ke");
  assert.ok(theme);
  assert.doesNotMatch(theme.text.en, /^Another source names computing/);
  assert.match(theme.text.en, /added condition/);
  assert.equal(theme.text.ml, undefined);
  assert.match(theme.evidence.sourceText ?? "", /added condition/);
});

test("only the exact reviewed break-and-return contrast is omitted when its meaning is already present", () => {
  const original = BNN_SOURCE_SNAPSHOT["t-ju-sa-ke"];
  assert.ok(original);
  const result = computeChart(synthetic("1990-02-01"));
  result.reading.findings = [{
    ruleId: "t-ju-sa-ke", area: "career", text: original, score: 5,
    planets: ["Jupiter", "Saturn", "Ketu"], relation: "conjunct", viaRetro: false,
    source: "Synthetic test source",
  }];
  const exact = buildWorkJourney(result);
  assert.match(exact.themes[0]?.text.en ?? "", /break followed by a return, or a later spiritual turn/);
  assert.equal(exact.contrast, undefined);
  const changed = structuredClone(result);
  changed.reading.findings[0].text = original.replace("or a late spiritual turn", "or a late spiritual turn with an added qualification");
  const revised = buildWorkJourney(changed);
  assert.match(revised.contrast ?? "", /added qualification/);
});

test("ambiguous duplicate finding ids do not produce untraceable themes", () => {
  const result = computeChart(synthetic("1990-02-01"));
  const source = result.reading.findings.find((f) => f.area === "career");
  assert.ok(source);
  result.reading.findings = [source, { ...source, text: `${source.text} Additional text.` }];
  assert.equal(buildWorkJourney(result).themes.length, 0);
});

test("the work journey uses a past passing date, and ignores a future passing date", () => {
  const deceased = buildWorkJourney(computeChart(synthetic("1980-01-01", "2010-01-01")));
  const future = buildWorkJourney(computeChart(synthetic("1980-01-01", "2090-01-01")));
  assert.equal(deceased.past, true);
  assert.match(deceased.asOf, /^2010-01-01/);
  assert.equal(future.past, false);
  assert.match(future.asOf, /^2026-11-08/);
  for (const window of deceased.windows) assert.ok(Date.parse(window.start) <= Date.parse(deceased.asOf));
});
