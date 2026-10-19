// Phaladeepika ch. 8: the nine planets in the twelve houses (shared/phaladeepika-houses.ts, shared/parashari-nodes.ts).
// The table's entries, the verse conditions it keeps, the directions of the results the prose-engine review found
// reversed in the harvested tags, the minors' gate result by result, and the plain wording. Synthetic charts only.
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";

import type { Planet, PlanetPosition } from "@shared/astro";
import type { Chart } from "@shared/schema";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import {
  PLACEMENT_TABLE,
  placementEntry,
  placementReading,
  readsPlain,
  readsPractitioner,
  toneOfSaid,
  type PlacementTopic,
} from "@shared/phaladeepika-houses";
import { withholdText } from "@shared/life-stage";
import { plainViolations, soften } from "@shared/gentle";
import { computeChart } from "../server/routes";

const NINE = Object.keys(PLACEMENT_TABLE) as Planet[];
const VERSES: Record<Planet, [number, number]> = {
  Sun: [1, 4],
  Moon: [5, 7],
  Mars: [8, 10],
  Mercury: [11, 13],
  Jupiter: [14, 16],
  Venus: [17, 19],
  Saturn: [20, 24],
  Rahu: [25, 27],
  Ketu: [28, 33],
};
const TOPICS = new Set<PlacementTopic>([
  "longevity", "health", "looks", "wealth", "home", "happiness", "learning", "speech",
  "children", "spouse", "father", "mother", "siblings", "friends", "status", "conduct",
]);

const at = (planet: Planet, lon: number) => ({ planet, lon, signIndex: Math.floor(lon / 30) % 12 }) as PlanetPosition;

/** Each slot under every case its verse condition can take: every sign, a waxing and a waning Moon. */
function cases(planet: Planet, house: number) {
  const out: { p: PlanetPosition; positions: PlanetPosition[] }[] = [];
  for (let sign = 0; sign < 12; sign++)
    for (const elong of [90, 270]) {
      const sun = at("Sun", sign * 30 + 15);
      const moon = at("Moon", (sign * 30 + 15 + elong) % 360);
      const p = planet === "Sun" ? sun : planet === "Moon" ? moon : at(planet, sign * 30 + 15);
      out.push({ p, positions: [sun, moon, p] });
    }
  return out.filter((_, i) => typeof PLACEMENT_TABLE[planet][house - 1] === "function" || i === 0);
}

const reading = (planet: Planet, house: number, withhold = false, c = cases(planet, house)[0]) =>
  placementReading(planet, house, c.p, c.positions, withhold)!;

test("8.1-33: every planet has twelve entries, in its own verses and in house order", () => {
  for (const planet of NINE) {
    assert.equal(PLACEMENT_TABLE[planet].length, 12, planet);
    let last = 0;
    for (let h = 1; h <= 12; h++)
      for (const c of cases(planet, h)) {
        const e = placementEntry(planet, h, c.p, c.positions);
        const v = Number(e.v);
        const [lo, hi] = VERSES[planet];
        assert.ok(v >= lo && v <= hi, `${planet} ${h}: 8.${e.v} is outside 8.${lo}-${hi}`);
        assert.ok(v >= last, `${planet} ${h}: 8.${e.v} comes before the previous house's verse`);
        last = Math.max(last, v);
        assert.ok(e.said.length > 0, `${planet} ${h}: no results`);
        for (const [pol, t, o] of e.said) {
          assert.ok(pol === "+" || pol === "-" || pol === "0", `${planet} ${h}: ${t}`);
          assert.ok(t.trim() === t && t.length > 2, `${planet} ${h}: "${t}"`);
          const on = o?.on === undefined ? [] : Array.isArray(o.on) ? o.on : [o.on];
          for (const x of on) assert.ok(TOPICS.has(x), `${planet} ${h}: unknown topic ${x}`);
          // A result the plain reading names by topic carries no plain wording of its own.
          if (o?.h) assert.equal(o.p, undefined, `${planet} ${h}: "${t}" has both a plain wording and a harder-line topic`);
        }
      }
  }
});

test("the directions the harvested tags had reversed follow the verses", () => {
  const tone = (planet: Planet, h: number) => reading(planet, h).tone;
  const on = (planet: Planet, h: number, topic: PlacementTopic) => reading(planet, h).topics[topic];
  assert.equal(tone("Sun", 7), "strain"); // 8.3: the ruler's displeasure, no wife, humiliation
  assert.equal(on("Sun", 8, "wealth"), "-"); // 8.3: wealth and friends lost
  assert.equal(on("Sun", 9, "children"), "+"); // 8.4: with children and kin
  assert.equal(on("Sun", 9, "father"), "-"); // 8.4: the loss of the father
  assert.equal(on("Sun", 12, "children"), "-"); // 8.4: without wealth or children
  assert.equal(tone("Moon", 12), "strain"); // 8.7: disliked, sorrowful, humiliated, idle
  assert.equal(tone("Mars", 2), "strain"); // 8.8: no learning or wealth, bad company
  assert.equal(on("Mars", 4, "home"), "-"); // 8.8: no land, home or vehicles
  assert.equal(on("Mars", 5, "children"), "-"); // 8.9: no children
  assert.equal(on("Mars", 8, "wealth"), "-"); // 8.9: poverty
});

test("the verse conditions: the Sun in the 1st by sign, the Moon by waxing, Saturn by own sign or exaltation", () => {
  const sun = (sign: number) => {
    const s = at("Sun", sign * 30 + 15);
    return placementReading("Sun", 1, s, [s, at("Moon", sign * 30 + 105)], false)!;
  };
  assert.ok(sun(6).said.some((s) => s.t === "the loss of children"), "Libra adds the loss of children");
  assert.ok(sun(6).said.some((s) => s.t === "poverty"), "Libra adds poverty");
  assert.ok(sun(4).said.some((s) => s.t === "night blindness"), "Leo adds night blindness");
  assert.equal(sun(4).said.length, sun(8).said.length + 1, "Sagittarius adds nothing");
  assert.equal(sun(6).said.length, sun(8).said.length + 2);
  assert.match(sun(8).cond![0], /none applies/);

  const moon = (elong: number) => {
    const s = at("Sun", 15);
    const m = at("Moon", 15 + elong);
    return placementReading("Moon", 1, m, [s, m], false)!;
  };
  assert.equal(moon(90).tone, "support");
  assert.ok(moon(90).said.some((s) => s.t === "a long life"));
  assert.equal(moon(270).tone, "strain");
  assert.match(moon(270).cond![0], /waning/);

  const saturn = (sign: number) => {
    const p = at("Saturn", sign * 30 + 15);
    return placementReading("Saturn", 1, p, [at("Sun", 15), at("Moon", 105), p], false)!;
  };
  for (const sign of [6, 9, 10]) assert.equal(saturn(sign).tone, "support", `Saturn rising in sign ${sign}`);
  for (const sign of [0, 3, 4, 11]) assert.equal(saturn(sign).tone, "strain", `Saturn rising in sign ${sign}`);
});

test("tone: unfavourable results at most a third of the favourable read well, and the reverse", () => {
  assert.equal(toneOfSaid([["+", "a"], ["+", "b"], ["+", "c"], ["-", "d"]]), "support");
  assert.equal(toneOfSaid([["+", "a"], ["+", "b"], ["-", "d"]]), "mixed");
  assert.equal(toneOfSaid([["+", "a"], ["-", "b"], ["-", "c"], ["-", "d"]]), "strain");
  assert.equal(toneOfSaid([["0", "a"], ["-", "b"]]), "strain");
  // An entry may state the verse's balance; it stands only while every result is shown.
  assert.equal(reading("Sun", 9).tone, "mixed");
  assert.equal(reading("Sun", 9, true).tone, "support");
});

test("the minors' gate drops the gated results in both readings, and what is left trips no regex gate", () => {
  for (const planet of NINE)
    for (let h = 1; h <= 12; h++)
      for (const c of cases(planet, h)) {
        const e = placementEntry(planet, h, c.p, c.positions);
        const gated = new Set(e.said.filter((s) => s[2]?.g).map((s) => s[1]));
        const r = placementReading(planet, h, c.p, c.positions, true);
        if (!r) {
          assert.equal(gated.size, e.said.length, `${planet} ${h}: dropped with results left`);
          continue;
        }
        for (const s of r.said) assert.ok(!gated.has(s.t), `${planet} ${h}: "${s.t}" shown to a minor`);
        // No pointer to a result the gate removed.
        const hardLeft = new Set(e.said.filter((s) => s[2]?.h && !s[2]?.g).map((s) => s[2]!.h!));
        for (const x of r.harder) assert.ok(hardLeft.has(x), `${planet} ${h}: points a minor to "${x}"`);
        assert.ok(!withholdText(readsPractitioner(r)), `${planet} ${h}: ${readsPractitioner(r)}`);
        assert.ok(!withholdText(readsPlain(r)), `${planet} ${h}: ${readsPlain(r)}`);
      }
});

test("the plain wording passes the deny-list, needs no softening, and never quotes a result it names by topic", () => {
  for (const planet of NINE)
    for (let h = 1; h <= 12; h++)
      for (const c of cases(planet, h))
        for (const withhold of [false, true]) {
          const r = placementReading(planet, h, c.p, c.positions, withhold);
          if (!r) continue;
          const plain = [readsPlain(r), r.cond?.[1] ?? "", r.note?.[1] ?? ""].join(" ").trim();
          assert.deepEqual(plainViolations(plain), [], `${planet} ${h}: ${plain}`);
          assert.equal(soften(plain), plain, `${planet} ${h}: the softener rewrites "${plain}"`);
          for (const s of r.said) if (s.p === null) assert.ok(!plain.includes(s.t), `${planet} ${h}: quotes "${s.t}"`);
          assert.ok(!/\b(his|him|he|the native)\b/i.test(plain), `${planet} ${h}: third person in "${plain}"`);
        }
});

const chart = (birthDate: string, birthTime: string, method: "rashi" | "sripati"): Chart => ({
  id: 0,
  name: "Synthetic",
  gender: "male",
  birthDate,
  birthTime,
  timezone: "Asia/Kolkata",
  timeStandard: "auto",
  place: "Synthetic, India",
  latitude: 20,
  longitude: 78,
  ayanamsa: "lahiri",
  nodeType: "mean",
  sunriseDef: "edge",
  parashariHouseMethod: method,
  notes: "",
  deathDate: null,
  timeUncertaintyMin: 0,
  events: [],
});

test("a chart carries one placement finding per planet, cited to its verse, provisional only when the bhava moves it", () => {
  for (const method of ["rashi", "sripati"] as const) {
    const r = computeChart(chart("2003-07-29", "06:40", method));
    const par = computeParashari(
      r.positions,
      r.jaimini.lagna.lon,
      r.utc,
      "2026-01-01T00:00:00Z",
      r.shadbala,
      r.dasaStarts,
      DEFAULT_ASPECT_FLOOR,
      false,
      method,
    );
    const pl = par.findings.filter((f) => f.placement);
    assert.deepEqual(pl.map((f) => f.planets[0]), NINE, method);
    for (const f of pl) {
      const r8 = f.placement!;
      assert.equal(f.kind, "house");
      assert.equal(f.house, r8.house);
      assert.ok(f.source.label.startsWith(`Phaladeepika ${r8.verse}`), f.source.label);
      assert.match(f.source.url ?? "", Number(r8.verse.slice(2)) <= 3 ? /sanskritdocuments\.org/ : /wisdomlib\.org/);
      const moved = f.source.label.includes("bhava-chalit");
      assert.equal(!!f.source.provisional, moved, `${f.id}: provisional without a moved bhava`);
      if (method === "rashi") assert.ok(!moved, f.id);
      assert.ok(f.text.includes(readsPractitioner(r8)), f.id);
      assert.ok(f.textPlain!.includes(readsPlain(r8)), f.id);
      assert.ok(f.textPlain!.includes(`in your ${f.house}`), f.id);
    }
  }
});
