// Declared tones for the Nadi colouring rules. A rule whose text names a planet's significations or nature says what
// kind of matters the planet carries, not whether they go well, so its direction is declared and never read from the
// vocabulary put into its text. The guard below fails if a new rule interpolates that vocabulary without a tone.
//
// Run from the repository root: `npm test`.

import test from "node:test";
import assert from "node:assert/strict";

import { KARAKA, PLANETS } from "@shared/astro";
import { RULES, type Finding } from "@shared/rules";
import { FEMALE_RULES, FEMALE_STAR_TEXT } from "@shared/rules-female";
import { STAR_TEXT } from "@shared/rules-bnn";
import { synthesizeArea, toneIsKeyword, toneOf } from "@shared/synthesis";
import { computeChart } from "../server/routes";

const ALL_RULES = [...RULES, ...FEMALE_RULES];

/** Every run of two or more of a planet's significations as the rules join them, and every nakshatra-lord phrase. */
const VOCABULARY: string[] = [
  ...PLANETS.flatMap((p) => {
    const s = KARAKA[p].significations;
    return s.slice(1).map((_, i) => s.slice(0, i + 2).join(", "));
  }),
  ...Object.values(STAR_TEXT),
  ...Object.values(FEMALE_STAR_TEXT),
];

test("tone: every rule whose text carries signification vocabulary declares its tone", () => {
  const carrying = ALL_RULES.filter((r) => VOCABULARY.some((v) => r.text.includes(v)));
  assert.ok(carrying.length >= 80, `found ${carrying.length} colouring rules`);
  const undeclared = carrying.filter((r) => !r.tone).map((r) => r.id);
  assert.deepEqual(undeclared, []);
});

test("tone: a declared tone is not read from the words, and is not counted as keyword-toned", () => {
  const f: Finding = {
    ruleId: "sa-lord-su",
    area: "career",
    text: "Saturn sits in a sign owned by Sun: great wealth, success and fortune.",
    score: 1,
    planets: ["Saturn"],
    relation: null,
    viaRetro: false,
    tone: "neutral",
  };
  assert.equal(toneOf(f), "neutral");
  assert.equal(toneIsKeyword(f), false);
  assert.equal(toneOf({ ...f, tone: undefined }), "good");
  assert.equal(toneIsKeyword({ ...f, tone: undefined }), true);
});

test("tone: colouring rules that fire on a chart carry their declared tone and take no side in the area", () => {
  const result = computeChart({
    id: 0,
    name: "Synthetic adult",
    gender: "male",
    birthDate: "1975-03-14",
    birthTime: "06:10",
    timezone: "Asia/Kolkata",
    timeStandard: "auto",
    place: "Chennai, India",
    latitude: 13.0827,
    longitude: 80.2707,
    ayanamsa: "lahiri",
    nodeType: "mean",
    sunriseDef: "edge",
    parashariHouseMethod: "rashi",
    notes: "",
    deathDate: null,
    timeUncertaintyMin: 0,
    events: [],
  });
  const colouring = result.reading.findings.filter((f) => /-(lord|star)-[a-z]{2}$/.test(f.ruleId));
  assert.ok(colouring.length >= 5, `${colouring.length} colouring findings`);
  for (const f of colouring) assert.equal(f.tone, "neutral", f.ruleId);
  // Areas read from colouring rules alone take no side: never supportive, care or contested.
  for (const area of Array.from(new Set(colouring.map((f) => f.area)))) {
    const alone = synthesizeArea(area, colouring.filter((f) => f.area === area), result.reading, "male");
    assert.ok(!["supportive", "care", "contested"].includes(alone.tone), `${area}: ${alone.tone}`);
  }
});
