import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describePosition, NAKSHATRA_LORD, PLANETS } from "@shared/astro";
import { birthStarPosition } from "@shared/birth-star";
import { nakshatraContext, naikSolarContact } from "@shared/nakshatra-context";
import { zodiacQuarter, sameZodiacQuarter } from "@shared/zodiac-quarter";
import { VARGA_BY_KEY } from "@shared/vargas";
import { vargaSignAt } from "@shared/varga-sign";
import { navamsaOf } from "@shared/jaimini";
import { navamsaOf as cancellationNavamsa } from "@shared/neechabhanga";
import { navamsaSign } from "@shared/shadbala";
import { nakshatraOf } from "@shared/panchanga";
import { alpPointAt } from "@shared/alp";
import { kpPoint, lordsAt } from "@shared/kp";
import { ssCombust } from "@shared/combustion";
import { createPlanetContext, natalPlanetContext, kpPlanetContext } from "@shared/planet-context";
import { nakshatraDisplayRows } from "@shared/nakshatra-context-display";
import { insertChartSchema } from "@shared/schema";
import { buildReport } from "@shared/report";
import { NakshatraContextPanel } from "../client/src/components/nakshatra-context";
import { computeChart } from "../server/routes";
import { rectify } from "../server/rectify";
import { matterOf } from "@shared/events";
import { evaluate } from "@shared/rules";
import { readFileSync } from "node:fs";

test("all 108 quarter edges and both sides agree across the chart engines", () => {
  for (let edge = 0; edge <= 108; edge++) for (const offset of [-1e-6, 0, 1e-6]) {
    const longitude = edge * 10 / 3 + offset;
    const expected = ((edge + (offset < 0 ? -1 : 0)) % 108 + 108) % 108;
    const q = zodiacQuarter(longitude), p = describePosition("Moon", longitude, 1);
    const star = birthStarPosition(longitude)!;
    const kp = kpPoint(longitude), alp = alpPointAt(longitude), pan = nakshatraOf(longitude);
    const label = `edge ${edge}, offset ${offset}`;
    assert.equal(q.quarterIndex, expected, label);
    assert.equal(q.starIndex, Math.floor(expected / 4), label);
    assert.equal(q.pada, expected % 4 + 1, label);
    assert.equal(q.navamsaSign, expected % 12, label);
    for (const value of [p.nakshatraIndex, star.starIndex, kp.nakshatraIndex, alp.nakshatraIndex, pan.index]) assert.equal(value, q.starIndex, label);
    for (const value of [p.pada, star.pada, alp.pada, pan.pada]) assert.equal(value, q.pada, label);
    for (const value of [star.navamsaSign, alp.navamsaSign, navamsaOf(longitude).signIndex,
      vargaSignAt("D9", longitude), VARGA_BY_KEY.D9.signOf(p.signIndex, p.degInSign),
      navamsaSign(p.signIndex, p.degInSign), cancellationNavamsa(p)]) assert.equal(value, q.navamsaSign, label);
    assert.ok(q.fraction >= 0 && q.fraction < 1, label);
    assert.ok(q.starFraction >= 0 && q.starFraction < 1, label);
    if (offset === 0 && expected % 4 === 0) {
      const kpLords = lordsAt(longitude);
      assert.equal(kpLords.starLord, NAKSHATRA_LORD[q.starIndex], label);
      assert.equal(kpLords.subLord, kpLords.starLord, label);
      assert.equal(kpLords.subSubLord, kpLords.starLord, label);
    }
  }
  assert.throws(() => zodiacQuarter(NaN), RangeError);
  assert.throws(() => zodiacQuarter(Infinity), RangeError);
});

test("same-solar-pada is not a 3°20′ angular orb; Parashari stays separate", () => {
  const sun = 3 + 19 / 60, across = 3 + 21 / 60, inside = 1 / 60;
  assert.equal(sameZodiacQuarter(sun, across), false);
  assert.equal(sameZodiacQuarter(sun, inside), true);
  assert.equal(sameZodiacQuarter(359 + 59 / 60, 1 / 60), false);
  assert.deepEqual([naikSolarContact("Venus", across, sun)!.samePada, naikSolarContact("Venus", across, sun)!.withinPadaWidth], [false, true]);
  assert.equal(describePosition("Venus", across, 1, sun).combust, false);
  assert.equal(describePosition("Venus", inside, 1, sun).combust, true);
  assert.equal(ssCombust(describePosition("Venus", across, 1, sun), sun), true);
  for (const p of ["Sun", "Rahu", "Ketu"] as const) {
    assert.equal(naikSolarContact(p, inside, sun), undefined);
    assert.equal(describePosition(p, inside, 1, sun).combust, false);
  }
});

test("a published cross-boundary Mercury case changes the applicable BNN reading", () => {
  const fixture = JSON.parse(readFileSync("scripts/fixtures/nakshatra-context-targeted.json", "utf8"));
  const raw = fixture.cases.find((c: { name: string }) => c.name === "Henri Cartier-Bresson").chart;
  const chart = computeChart({ id: 0, timeStandard: "auto", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi",
    notes: "", deathDate: null, timeUncertaintyMin: 0, ...raw, events: [] });
  const context = natalPlanetContext(chart);
  const mercury = context.requirePlanet("Mercury");
  assert.equal(mercury.naikSolarContact?.samePada, false);
  assert.equal(mercury.naikSolarContact?.withinPadaWidth, true);
  const legacy = chart.positions.map((p) => ({ ...p, combust: context.requirePlanet(p.planet).naikSolarContact?.withinPadaWidth ?? false }));
  const oldReading = evaluate(createPlanetContext(legacy, { ...context.frame }), undefined, "male");
  assert.ok(oldReading.findings.some((f) => f.ruleId === "me-combust"));
  assert.ok(!chart.reading.findings.some((f) => f.ruleId === "me-combust"));
});

test("the frozen context, display and report use the same frame-specific facts", () => {
  const input = insertChartSchema.parse({ name: "Synthetic quarter", birthDate: "1990-01-01", birthTime: "12:00", gender: "male",
    timezone: "Asia/Kolkata", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946, ayanamsa: "raman", nodeType: "true" });
  const chart = computeChart({ ...input, id: 0, gender: "male", timeStandard: "auto", ayanamsa: "raman", nodeType: "true",
    sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] });
  const natal = natalPlanetContext(chart), kp = kpPlanetContext(chart);
  assert.equal(natal.planets.length, PLANETS.length);
  assert.equal(natal.frame.ayanamsa, "raman");
  assert.equal(kp.frame.ayanamsa, "kp");
  for (const p of natal.planets) {
    assert.deepEqual(p.nakshatra, nakshatraContext(p.position.lon));
    assert.ok(Object.isFrozen(p.nakshatra) && Object.isFrozen(p.nakshatra.sutton));
  }
  const rows = nakshatraDisplayRows(natal);
  assert.equal(rows.length, 10);
  const html = renderToStaticMarkup(createElement(NakshatraContextPanel, { context: natal }));
  const report = buildReport(chart, { plain: false, modules: ["panchanga"] });
  const allParas = (sections: typeof report.sections): typeof report.sections[number]["paras"] =>
    sections.flatMap((s) => [...s.paras, ...allParas(s.sub ?? [])]);
  const tables = allParas(report.sections).filter((p) => p.head?.includes("BNN solar quarter"));
  assert.equal(tables.length, 1);
  assert.deepEqual(tables[0].rows, rows.map((r) => [r.point, r.star, r.starLord, r.navamsa, r.qualifications, r.solar]));
  for (const row of rows) assert.ok(html.includes(`nakshatra-row-${row.point}`));
  assert.match(html, /not independent confirmation/);
});

test("a rectification midpoint exposes the same quarter facts as a cast chart", () => {
  const event = { id: "wedding", matter: "marriage", date: "2013-03-11", timezone: "Asia/Kolkata" };
  const chart = insertChartSchema.parse({ name: "Synthetic candidate", birthDate: "1990-01-01", birthTime: "12:00", gender: "male",
    timezone: "Asia/Kolkata", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946, ayanamsa: "lahiri", events: [event] });
  const m = matterOf(event.matter);
  const scan = rectify({ chart, windowMinutes: 1, events: [{ ...event, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }], includeComparisons: false });
  const segment = scan.segments.find((s) => s.given && s.selectable)!;
  assert.ok(segment?.candidate && segment.candidate.ascendantLon !== undefined);
  const candidate = segment.candidate!;
  const ctx = createPlanetContext(candidate.positions, { kind: "natal", ascendant: candidate.ascendantLon, ayanamsa: "lahiri" });
  const full = computeChart({ ...chart, id: 0, birthDate: segment.midDate ?? chart.birthDate, birthTime: segment.mid, gender: "male", timeStandard: "auto",
    ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [event] });
  assert.deepEqual(nakshatraDisplayRows(ctx), nakshatraDisplayRows(natalPlanetContext(full)));
});
