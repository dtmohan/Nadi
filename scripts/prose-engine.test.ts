import test from "node:test";
import assert from "node:assert/strict";
import type { PlanetPosition } from "@shared/astro";
import { renderPlanetFragments } from "@shared/prose-engine";
import { birthInstant, julianDay, positionsAt, ascendantAt } from "../server/ephemeris";

// A made-up birth moment, not any real person: 8 Aug 2003, 05:50 IST at 20°N 78°E (Cancer lagna,
// Venus rising and combust). Positions come from the app's own ephemeris.
const opts = { ayanamsa: "lahiri", nodeType: "mean" } as const;
const { utc } = birthInstant({ birthDate: "2003-08-08", birthTime: "05:50", timezone: "Asia/Kolkata" } as never);
const jd = julianDay(utc);
const chart: PlanetPosition[] = positionsAt(jd, opts as never);
const LAGNA = Math.floor((ascendantAt(jd, 20, 78, opts as never) % 360) / 30);

test("determinism — identical input renders identical output", () => {
  const a = JSON.stringify(renderPlanetFragments(chart, LAGNA));
  const b = JSON.stringify(renderPlanetFragments(chart, LAGNA));
  assert.equal(a, b);
});

test("every fragment carries a non-empty source note", () => {
  for (const f of renderPlanetFragments(chart, LAGNA)) {
    assert.ok(f.source.length > 20, `short source on ${f.planet}/${f.kind}`);
    assert.match(f.source, /BPHS|PD|Brihat|Sara|Ch\./);
  }
});

test("Venus in H1 renders the PD Ch.8 graha-in-bhava string", () => {
  const frags = renderPlanetFragments(chart, LAGNA);
  const v = frags.filter((f) => f.planet === "Venus" && f.kind === "graha_in_bhava");
  assert.equal(v.length, 1);
  assert.ok(v[0].text.length > 20);
});

test("dignity substitution replaces {graha} with the planet name", () => {
  const frags = renderPlanetFragments(chart, LAGNA);
  const saturn = frags.filter((f) => f.planet === "Saturn" && f.kind === "dignity");
  assert.equal(saturn.length, 1);
  assert.ok(!saturn[0].text.includes("{graha}"));
  assert.ok(saturn[0].text.includes("Saturn"));
});

test("combustion fragment fires only for combust planets", () => {
  const frags = renderPlanetFragments(chart, LAGNA);
  assert.equal(frags.filter((f) => f.planet === "Venus" && f.kind === "combustion").length, 1);
  assert.equal(frags.filter((f) => f.planet === "Sun" && f.kind === "combustion").length, 0);
});

test("renderer emits only the four fragment kinds", () => {
  const kinds = new Set(renderPlanetFragments(chart, LAGNA).map((f) => f.kind));
  assert.deepEqual(Array.from(kinds).sort(), ["combustion", "dignity", "graha_in_bhava", "nakshatra"]);
});
