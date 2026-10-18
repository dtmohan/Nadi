import test from "node:test";
import assert from "node:assert/strict";
import type { PlanetPosition } from "@shared/astro";
import { renderPlanetFragments } from "@shared/prose-engine";

const chart: PlanetPosition[] = [
  { planet: "Sun", lon: 115, signIndex: 3, sign: "Cancer", degInSign: 25, speed: 0.96, retrograde: false, nakshatraIndex: 8, nakshatra: "Ashlesha", nakshatraLord: "Mercury", pada: 3, signLord: "Moon", dignity: "Friendly", combust: false },
  { planet: "Moon", lon: 292.7, signIndex: 9, sign: "Capricorn", degInSign: 22.7, speed: 13.59, retrograde: false, nakshatraIndex: 21, nakshatra: "Shravana", nakshatraLord: "Moon", pada: 4, signLord: "Saturn", dignity: "Neutral", combust: false },
  { planet: "Mars", lon: 315, signIndex: 10, sign: "Aquarius", degInSign: 15, speed: -0.17, retrograde: true, nakshatraIndex: 23, nakshatra: "Shatabhisha", nakshatraLord: "Rahu", pada: 3, signLord: "Saturn", dignity: "Neutral", combust: false },
  { planet: "Mercury", lon: 142.2, signIndex: 4, sign: "Leo", degInSign: 22.2, speed: 1.07, retrograde: false, nakshatraIndex: 10, nakshatra: "Purva Phalguni", nakshatraLord: "Venus", pada: 3, signLord: "Sun", dignity: "Friendly", combust: false },
  { planet: "Jupiter", lon: 122.7, signIndex: 4, sign: "Leo", degInSign: 2.7, speed: 0.22, retrograde: false, nakshatraIndex: 9, nakshatra: "Magha", nakshatraLord: "Ketu", pada: 1, signLord: "Sun", dignity: "Friendly", combust: false },
  { planet: "Venus", lon: 113.1, signIndex: 3, sign: "Cancer", degInSign: 23.1, speed: 1.23, retrograde: false, nakshatraIndex: 8, nakshatra: "Ashlesha", nakshatraLord: "Mercury", pada: 2, signLord: "Moon", dignity: "Inimical", combust: true },
  { planet: "Saturn", lon: 74.7, signIndex: 2, sign: "Gemini", degInSign: 14.7, speed: 0.11, retrograde: false, nakshatraIndex: 5, nakshatra: "Ardra", nakshatraLord: "Rahu", pada: 3, signLord: "Mercury", dignity: "Friendly", combust: false },
  { planet: "Rahu", lon: 31.3, signIndex: 1, sign: "Taurus", degInSign: 1.3, speed: -0.05, retrograde: true, nakshatraIndex: 2, nakshatra: "Krittika", nakshatraLord: "Sun", pada: 2, signLord: "Venus", dignity: "—", combust: false },
  { planet: "Ketu", lon: 211.3, signIndex: 7, sign: "Scorpio", degInSign: 1.3, speed: -0.05, retrograde: true, nakshatraIndex: 15, nakshatra: "Vishakha", nakshatraLord: "Jupiter", pada: 4, signLord: "Mars", dignity: "—", combust: false },
];

test("determinism — identical input renders identical output", () => {
  const a = JSON.stringify(renderPlanetFragments(chart, 3));
  const b = JSON.stringify(renderPlanetFragments(chart, 3));
  assert.equal(a, b);
});

test("every fragment carries a non-empty source note", () => {
  for (const f of renderPlanetFragments(chart, 3)) {
    assert.ok(f.source.length > 20, `short source on ${f.planet}/${f.kind}`);
    assert.match(f.source, /BPHS|PD|Brihat|Sara|Ch\./);
  }
});

test("Venus in H1 renders the PD Ch.8 graha-in-bhava string", () => {
  const frags = renderPlanetFragments(chart, 3);
  const v = frags.filter((f) => f.planet === "Venus" && f.kind === "graha_in_bhava");
  assert.equal(v.length, 1);
  assert.ok(v[0].text.length > 20);
});

test("dignity substitution replaces {graha} with the planet name", () => {
  const frags = renderPlanetFragments(chart, 3);
  const saturn = frags.filter((f) => f.planet === "Saturn" && f.kind === "dignity");
  assert.equal(saturn.length, 1);
  assert.ok(!saturn[0].text.includes("{graha}"));
  assert.ok(saturn[0].text.includes("Saturn"));
});

test("combustion fragment fires only for combust planets", () => {
  const frags = renderPlanetFragments(chart, 3);
  assert.equal(frags.filter((f) => f.planet === "Venus" && f.kind === "combustion").length, 1);
  assert.equal(frags.filter((f) => f.planet === "Sun" && f.kind === "combustion").length, 0);
});

test("renderer emits only the four fragment kinds", () => {
  const kinds = new Set(renderPlanetFragments(chart, 3).map((f) => f.kind));
  assert.deepEqual(Array.from(kinds).sort(), ["combustion", "dignity", "graha_in_bhava", "nakshatra"]);
});
