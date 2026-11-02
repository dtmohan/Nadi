import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { drishtiQuarters, type PlanetPosition } from "@shared/astro";
import { createPlanetContext, natalPlanetContext, kpPlanetContext } from "@shared/planet-context";
import { createDivisionalPlanetContext } from "@shared/divisional-planet-context";
import { vargaSignAt } from "@shared/varga-sign";
import { planetRulesBySchool } from "@shared/planet-rule-context";
import { RECTIFY_RULE_FAMILY, SCHOOL_RULE_PATHS } from "@shared/school-rule-paths";
import { RECTIFY_METHODS } from "@shared/rectify-methods";
import { evaluate } from "@shared/rules";
import { kpNatalFrame, computeKp } from "@shared/kp";
import { rasiAspects } from "@shared/jaimini-core";
import { computeParashari } from "@shared/parashari";
import { computeAlp } from "@shared/alp";
import { computePrasna } from "@shared/rules-prasna";
import { matterOf, type ChartEvent } from "@shared/events";
import { computeChart } from "../server/routes";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { validateEvents } from "../server/validate";
import { julianDay, positionsAt } from "../server/ephemeris";

const base = { name: "Synthetic context", id: 42, gender: "male", birthDate: "1990-01-01", birthTime: "12:00:00",
  timezone: "Asia/Kolkata", timeStandard: "zone", place: "Bengaluru", latitude: 12.9716, longitude: 77.5946,
  ayanamsa: "raman", nodeType: "true", sunriseDef: "edge", gulikaMethod: "kerala-ghati", parashariHouseMethod: "sripati",
  notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] };

test("planet contexts isolate frame data and keep directional conventions separate", () => {
  const jd = julianDay(DateTime.fromISO("1990-01-01T06:30:00Z"));
  const positions = positionsAt(jd, { ayanamsa: "lahiri", nodeType: "mean" });
  const ascendant = 180, cusps = [1, 2, 3];
  const context = createPlanetContext(positions, { kind: "natal", ayanamsa: "lahiri", ascendant, cusps, precision: "full" });
  const saved = context.requirePlanet("Jupiter").position.signIndex;
  positions.find((p) => p.planet === "Jupiter")!.signIndex = (saved + 1) % 12;
  cusps[0] = 999;
  assert.equal(context.requirePlanet("Jupiter").position.signIndex, saved);
  assert.equal(context.frame.cusps?.[0], 1);
  assert.ok(Object.isFrozen(context.positions) && Object.isFrozen(context.requirePlanet("Jupiter").position));
  for (const a of context.planets) for (const b of context.planets) {
    const pa = a.position, pb = b.position;
    assert.equal(context.parashariRelation(a.planet, b.planet).fullAspect,
      drishtiQuarters(a.planet, pa.signIndex, pb.signIndex) >= 4);
    assert.equal(context.jaiminiAspect(a.planet, b.planet), rasiAspects(pa.signIndex, pb.signIndex));
  }
  const reading = evaluate(context, undefined, "male");
  for (const r of reading.relations) {
    const relation = context.bnnRelation(r.subject, r.object)!;
    assert.deepEqual([relation.relation, relation.viaRetro, relation.aSign, relation.bSign],
      [r.relation, r.viaRetro, r.subjectSign, r.objectSign]);
  }
  const lite = createPlanetContext(context.positions as PlanetPosition[], { kind: "natal", precision: "lite" });
  assert.throws(() => lite.bnnRelation("Jupiter", "Venus"), /retrograde-entry/);
  assert.throws(() => context.requirePlanet("missing" as never), /Missing/);
  assert.throws(() => createPlanetContext([positions[0], positions[0]], { kind: "natal" }), /Duplicate/);
});

test("the per-planet index uses the actual school results and refuses a mismatched KP frame", () => {
  const chart = computeChart(base);
  const natal = natalPlanetContext(chart), kpFrame = kpPlanetContext(chart);
  assert.equal(natal.frame.ayanamsa, "raman");
  assert.equal(kpFrame.frame.ayanamsa, "kp");
  assert.equal(kpFrame.frame.houseMethod, "placidus");
  assert.notEqual(natal.requirePlanet("Moon").position.lon, kpFrame.requirePlanet("Moon").position.lon);
  assert.throws(() => kpNatalFrame(natal, chart.kp.cusps), /KP ayanamsa/);
  const changedCusps = [...chart.kp.cusps]; changedCusps[0] += 0.1;
  assert.throws(() => kpNatalFrame(kpFrame, changedCusps), /do not belong/);
  const asOf = "2025-01-01T00:00:00Z";
  const kp = computeKp(chart.kp, chart.utc, asOf);
  const parashari = computeParashari(natal, chart.jaimini.lagna.lon, chart.utc, asOf, chart.shadbala);
  const alp = computeAlp(natal, chart.jaimini.lagna.lon, chart.utc, asOf);
  const prasna = computePrasna(natal, chart.jaimini.lagna.signIndex);
  const index = planetRulesBySchool("Jupiter", {
    bnn: { context: natal, result: chart.reading }, kp: { context: kpFrame, result: kp },
    jaimini: { context: natal, result: chart.jaimini }, parashari: { context: natal, result: parashari },
    alp: { context: natal, result: alp }, prasna: { context: natal, result: prasna },
  });
  for (const entry of Object.values(index)) assert.equal(entry.status, "evaluated");
  assert.deepEqual(index.bnn.rules.map((r) => r.ruleId), chart.reading.findings.filter((f) => f.planets.includes("Jupiter")).map((f) => f.ruleId));
  assert.deepEqual(index.kp.rules.map((r) => r.ruleId), kp.findings.filter((f) => f.subLord === "Jupiter").map((f) => f.ruleId));
  assert.equal(index.kp.status === "evaluated" ? index.kp.kp?.point.subLord : undefined,
    kp.planets.find((p) => p.planet === "Jupiter")?.subLord);
  assert.deepEqual(index.kp.status === "evaluated" ? index.kp.kp?.cuspSubLordOf : undefined,
    kp.cusps.filter((c) => c.subLord === "Jupiter").map((c) => c.house));
  assert.ok(index.alp.rules.every((r) => r.scope === "date-dependent" && r.asOf === alp.asOf));
  assert.ok(index.jaimini.rules.every((r) => r.chart === "D1" || r.chart === "D9"));
  assert.equal(planetRulesBySchool("Jupiter", {}).kp.status, "not-evaluated");
  assert.throws(() => planetRulesBySchool("Jupiter", { kp: { context: natal, result: kp } }), /KP-ayanamsa/);
  assert.equal(SCHOOL_RULE_PATHS.kpEvent.paths.rectify, "shared");
  assert.equal(SCHOOL_RULE_PATHS.alp.paths.validate, "not-implemented");
  assert.deepEqual(Object.keys(RECTIFY_RULE_FAMILY).sort(), RECTIFY_METHODS.map((m) => m.id).sort());
  for (const family of Object.values(RECTIFY_RULE_FAMILY))
    assert.ok(["shared", "separate-method"].includes(SCHOOL_RULE_PATHS[family].paths.rectify));
});

test("divisional frames keep their own signs and houses while preserving the natal longitude", () => {
  const chart = computeChart(base), natal = natalPlanetContext(chart);
  for (const division of ["D1", "D4", "D7", "D9", "D10", "D24"] as const) {
    const frame = createDivisionalPlanetContext(natal, division, chart.jaimini.lagna.lon);
    assert.equal(frame.ascendantSign, vargaSignAt(division, chart.jaimini.lagna.lon));
    assert.equal(frame.natal, natal);
    for (const point of frame.planets) {
      const position = natal.requirePlanet(point.planet).position;
      assert.equal(point.natalLongitude, position.lon);
      assert.equal(point.signIndex, vargaSignAt(division, position.lon));
      assert.equal(point.house, ((point.signIndex - frame.ascendantSign + 12) % 12) + 1);
      for (let target = 0; target < 12; target++)
        assert.equal(frame.fullAspect(point.planet, target), drishtiQuarters(point.planet, point.signIndex, target) >= 4);
    }
  }
  const transit = createPlanetContext(chart.now.positions, { kind: "transit" });
  assert.throws(() => createDivisionalPlanetContext(transit, "D9", chart.jaimini.lagna.lon), /natal frame/);
  assert.throws(() => createDivisionalPlanetContext(natal, "D9", chart.jaimini.lagna.lon + 1), /Ascendant/);
});

test("BNN and Jaimini use their chart rules consistently in dated readings, scans, and eligible comparisons", () => {
  const events: ChartEvent[] = [
    { id: "wedding", matter: "marriage", date: "2013-03-11", time: "11:15", timezone: "America/New_York" },
    { id: "career", matter: "job", date: "2016-11-21", time: "09:20", timezone: "Asia/Kolkata" },
  ];
  const requestEvents = events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
  const scan = rectify({ chart: base, windowMinutes: 1, events: requestEvents, judgedAsOf: "2026-10-01T00:00:00Z" });
  const segment = scan.segments.find((s) => s.given && s.selectable)!;
  const candidate = { ...base, birthDate: segment.midDate ?? base.birthDate, birthTime: segment.mid, events };
  const validation = validateEvents(candidate);
  const chart = computeChart(candidate);
  for (let i = 0; i < events.length; i++) {
    const dated = topicReading(candidate, events[i], "2026-11-01T12:00:00Z");
    assert.deepEqual(dated.bnn, validation.events[i].bnn);
    assert.deepEqual(dated.jaimini, validation.events[i].jaimini);
    const fit = validation.events[i].jaimini;
    assert.ok(fit);
    const { mdSignName: _md, adSignName: _ad, ...shared } = fit;
    assert.deepEqual(segment.events[i].jaimini, shared);
    const combination = validation.events[i].bnn.combination;
    if (combination) assert.ok(chart.reading.findings.some((f) => f.text === combination));
  }
  assert.deepEqual(segment.baseline?.jaimini, validation.baseline?.jaimini);
});
