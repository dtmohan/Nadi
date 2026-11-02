import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describePosition, type Planet } from "@shared/astro";
import { computeSarvartha, sarvarthaRuleComputable, SC_PENDING_SOURCE_REVIEW } from "@shared/sarvartha";
import { computePrasnaVedha, computePrasnaVipareetaVedha } from "@shared/rules-prasna";
import { vimshottari } from "@shared/kp";
import { computeDasaReadings } from "@shared/parashari-dasa";
import { PrasnaTransitModifiers } from "../client/src/components/prasna-transit-modifiers";
import { SchoolTopicExplanation } from "../client/src/components/school-topic-brief";
import { insertChartSchema } from "@shared/schema";
import { ascendantAt, birthInstant, julianDay, positionsAt } from "../server/ephemeris";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const planets: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const positions = (signs: Partial<Record<Planet, number>>) => planets.map((p) => describePosition(p, (signs[p] ?? 5) * 30 + 12, 1));
const finding = (lagna: number, signs: Partial<Record<Planet, number>>, house: number, stanza: number) =>
  computeSarvartha(positions(signs), lagna * 30).findings.find((f) => f.house === house && f.stanza === stanza);

test("incomplete or ambiguous Sarvartha predicates are explicitly reference-only for every ascendant", () => {
  const ids = [[2,15],[2,88],[2,149],[3,2],[3,24],[4,57],[4,110],[4,135],[4,148],
    [6,9],[6,12],[6,13],[7,12],[7,73],[8,17]];
  for (const [house, stanza] of ids) assert.equal(sarvarthaRuleComputable(house, stanza), false, `${house}.${stanza}`);
  for (let lagna = 0; lagna < 12; lagna++) {
    const out = computeSarvartha(positions({}), lagna * 30);
    for (const [house, stanza] of ids) assert.ok(!out.findings.some((f) => f.house === house && f.stanza === stanza));
  }
});

test("additional catalogue-predicate mismatches remain reference-only until their sources are reviewed", () => {
  assert.ok(SC_PENDING_SOURCE_REVIEW.size > 0);
  for (const key of Array.from(SC_PENDING_SOURCE_REVIEW)) {
    const [house, stanza] = key.split(".").map(Number);
    assert.equal(sarvarthaRuleComputable(house, stanza), false, key);
  }
  for (let lagna = 0; lagna < 12; lagna++) {
    const result = computeSarvartha(positions({}), lagna * 30);
    assert.ok(result.findings.every((f) => !SC_PENDING_SOURCE_REVIEW.has(`${f.house}.${f.stanza}`)));
  }
});

test("fresh published charts do not receive the removed unconditional Sarvartha readings", () => {
  const fixture = JSON.parse(readFileSync("scripts/fixtures/sarvartha-audit-fresh.json", "utf8"));
  assert.equal(fixture.cases.length, 4);
  for (const entry of fixture.cases) {
    const chart = insertChartSchema.parse(entry.chart);
    const opts = { ayanamsa: chart.ayanamsa || "lahiri", nodeType: chart.nodeType === "true" ? "true" as const : "mean" as const };
    const jd = julianDay(birthInstant(chart).utc);
    const lagna = ascendantAt(jd, chart.latitude, chart.longitude, opts);
    const result = computeSarvartha(positionsAt(jd, opts), lagna);
    assert.ok(!result.findings.some((f) => f.house === 3 && f.stanza === 24), chart.name);
    assert.ok(!result.findings.some((f) => f.house === 7 && f.stanza === 73), chart.name);
    assert.ok(!result.findings.some((f) => f.house === 8 && f.stanza === 17), chart.name);
    if (chart.name === "Ayrton Senna") assert.ok(result.findings.some((f) => f.house === 4 && f.stanza === 75));
  }
});

test("3.121 requires the second lord, Venus and Moon together in an angle", () => {
  const all = { Mercury: 4, Venus: 4, Moon: 4 } as const; // Leo rising: Mercury is second lord.
  assert.ok(finding(4, all, 2, 121));
  assert.equal(finding(4, { ...all, Moon: 5 }, 2, 121), undefined);
  assert.equal(finding(4, { ...all, Venus: 5 }, 2, 121), undefined);
  assert.equal(finding(4, { Mercury: 5, Venus: 5, Moon: 5 }, 2, 121), undefined);
});

test("4.75 follows the supplied Bhasin translation: the movable fourth is ruled by Mars", () => {
  for (let lagna = 0; lagna < 12; lagna++) {
    for (const mars of [0, 6, 10]) {
      const f = finding(lagna, { Mars: mars }, 4, 75);
      assert.equal(!!f, lagna === 9, `lagna ${lagna}, Mars sign ${mars}`);
      if (f) assert.match(f.condition!, /lord is Mars/);
    }
  }
});

test("8.30 requires sixth lord in tenth and Saturn with the tenth lord in an angle or trine", () => {
  const yes = { Mars: 11, Jupiter: 2, Saturn: 2 } as const; // Gemini rising.
  assert.ok(finding(2, yes, 10, 30));
  assert.equal(finding(2, { ...yes, Mars: 10 }, 10, 30), undefined);
  assert.equal(finding(2, { ...yes, Saturn: 3 }, 10, 30), undefined);
  assert.equal(finding(2, { ...yes, Jupiter: 3, Saturn: 3 }, 10, 30), undefined);
});

test("8.16 requires the tenth lord in an angle in addition to Sun and Mars in the tenth", () => {
  const yes = { Sun: 11, Mars: 11, Jupiter: 2 } as const; // Gemini rising, Jupiter 10L.
  assert.ok(finding(2, yes, 10, 16));
  assert.equal(finding(2, { ...yes, Jupiter: 3 }, 10, 16), undefined);
  assert.equal(finding(2, { ...yes, Mars: 10 }, 10, 16), undefined);
});

test("8.27 requires Jupiter, Venus and Mercury together in the twelfth", () => {
  const yes = { Jupiter: 11, Venus: 11, Mercury: 11 } as const; // Aries rising.
  assert.ok(finding(0, yes, 12, 27));
  for (const p of ["Jupiter", "Venus", "Mercury"] as const) {
    assert.equal(finding(0, { ...yes, [p]: 0 }, 12, 27), undefined, p);
  }
});

test("8.13 accepts conjunction or aspect from the Sun or ninth lord, not an unrelated placement", () => {
  const base = { Jupiter: 2, Sun: 3, Mercury: 4 } as const; // Capricorn rising: Jupiter 12L, Mercury 9L.
  assert.equal(finding(9, base, 12, 13), undefined);
  for (const extra of [{ Sun: 2 }, { Sun: 8 }, { Mercury: 2 }, { Mercury: 8 }]) {
    assert.ok(finding(9, { ...base, ...extra }, 12, 13), JSON.stringify(extra));
  }
});

test("3.36 explanation names only a passing alternative, not an abandoned conjunction", () => {
  const f = finding(0, { Mars: 1, Moon: 2, Mercury: 3 }, 2, 36);
  assert.ok(f);
  assert.match(f.here!.join("; "), /Mercury in the 4th/);
  assert.doesNotMatch(f.here!.join("; "), /Mars/);
});

test("alternative explanations omit positions and dignities from failed branches", () => {
  const badHouseAlternative = finding(0, { Sun: 7 }, 5, 16); // 5L in the 8th, not debilitated.
  assert.ok(badHouseAlternative);
  assert.match(badHouseAlternative.here!.join("; "), /in the 8th/);
  assert.doesNotMatch(badHouseAlternative.here!.join("; "), /friendly|enemy|debilitated/);

  const maleficAlternative = finding(11, { Saturn: 4, Mars: 9 }, 11, 2); // 11L not angular/trinal, malefic in 11.
  assert.ok(maleficAlternative);
  assert.match(maleficAlternative.here!.join("; "), /Mars/);
  assert.doesNotMatch(maleficAlternative.here!.join("; "), /lord of the 11th/);
});

test("transit cards include every obstructor, their selected Venus variant and reverse pairs", () => {
  const sky = positions({ Sun: 2, Mars: 8, Jupiter: 8 });
  const vd = computePrasnaVedha(sky, 0);
  const html = renderToStaticMarkup(createElement(PrasnaTransitModifiers, { planet: "Sun", vedha: vd, vipareeta: [] }));
  assert.match(html, /obstructed by Mars/);
  assert.match(html, /obstructed by Jupiter/);
  assert.doesNotMatch(html, /Vipareeta Vedha/);
  const reverse = computePrasnaVipareetaVedha(positions({ Sun: 8, Mars: 2 }), 0);
  const revHtml = renderToStaticMarkup(createElement(PrasnaTransitModifiers, { planet: "Sun", vedha: [], vipareeta: reverse }));
  assert.match(revHtml, /possible relief from Mars/);
  const venusSky = positions({ Venus: 0, Mars: 7 });
  const card = (variant: "22.50" | "22.42") => renderToStaticMarkup(createElement(PrasnaTransitModifiers, {
    planet: "Venus", vedha: computePrasnaVedha(venusSky, 0, { venusVariant: variant }), vipareeta: [],
  }));
  assert.doesNotMatch(card("22.50"), /obstructed by Mars/);
  assert.match(card("22.42"), /obstructed by Mars/);
});

test("provisional status is visible before the collapsed explanation", () => {
  const html = renderToStaticMarkup(createElement(SchoolTopicExplanation, { brief: {
    school: "alp", topic: "career", stance: "mixed", summary: "Summary", limit: "Limit", basis: "Basis",
    conditional: true, provisional: true, reason: "App convention.",
  } }));
  assert.match(html, /conditional on the birth time/);
  assert.ok(html.indexOf("Provisional: App convention.") < html.indexOf("<details"));
});

test("pre-birth dasa text uses a date labelled UTC, while calculation keeps the instant", () => {
  const birth = "2000-01-01T12:00:00.000Z", asOf = "2020-01-01T00:00:00.000Z";
  const ps = positions({ Moon: 1 });
  const vim = vimshottari(ps.find((p) => p.planet === "Moon")!.lon, birth, asOf);
  const d = vim.dasas[0];
  const actualStart = "1999-05-01T23:30:42.123Z";
  const transits = [{ lord: d.lord, start: d.start, actualStart, signIndex: 2, lon: 72 }];
  const readings = computeDasaReadings(ps, 0, [], vim, birth, asOf, undefined, transits);
  const line = readings[0].notes.find((n) => n.id === `${d.lord}-48-transit`)!;
  assert.match(line.text, /before birth \(1999-05-01 UTC\)/);
  assert.doesNotMatch(line.text, /T23:30/);
  assert.equal(transits[0].actualStart, actualStart);
});
