/**
 * The period tints of the life timelines:
 * - Parashari dasas lean by the count of their favourable and trying lines (shared/parashari-dasa.ts leanOf),
 *   recounted after the minors' gate;
 * - the dasa-start Ashtakavarga line reads five or more of eight as favourable, four even, three or fewer adverse;
 * - BNN matter rows light where a passage brings the area's own lines to life (shared/timing.ts areaTouches).
 */
import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import type { Finding } from "@shared/rules";
import { computeParashari } from "@shared/parashari";
import {
  leanOf,
  verdictOfLean,
  leanWithCounts,
  type Tone,
} from "@shared/parashari-dasa";
import { areaTouches, readTransits, LINE_AREAS } from "@shared/timing";
import { computeChart } from "../server/routes";

const tones = (s: number, x: number, m = 0): Tone[] => [
  ...Array<Tone>(s).fill("support"),
  ...Array<Tone>(x).fill("strain"),
  ...Array<Tone>(m).fill("mixed"),
];

test("lean: three to one decides, three to two leans, closer is balanced", () => {
  const step = (s: number, x: number, m = 0) => leanOf(tones(s, x, m)).step;
  assert.equal(step(3, 1), "favourable");
  assert.equal(step(16, 4), "favourable");
  assert.equal(step(3, 2), "leans-favourable");
  assert.equal(step(13, 5), "leans-favourable");
  assert.equal(step(5, 4), "balanced");
  assert.equal(step(6, 6), "balanced");
  assert.equal(step(2, 3), "leans-trying");
  assert.equal(step(1, 3), "trying");
  assert.equal(step(0, 0, 7), "balanced", "mixed lines take neither side");
  assert.equal(step(4, 1, 9), "favourable", "mixed lines do not dilute the lean");
  // Fewer than three decisive lines can lean but not decide.
  assert.equal(step(2, 0), "leans-favourable");
  assert.equal(step(0, 2), "leans-trying");
  assert.equal(step(1, 0), "leans-favourable");
});

test("lean: the three-way verdict and the count label", () => {
  assert.equal(verdictOfLean(leanOf(tones(3, 1))), "support");
  assert.equal(verdictOfLean(leanOf(tones(3, 2))), "support");
  assert.equal(verdictOfLean(leanOf(tones(5, 4))), "mixed");
  assert.equal(verdictOfLean(leanOf(tones(2, 3))), "strain");
  assert.equal(verdictOfLean(leanOf(tones(1, 3))), "strain");
  assert.equal(leanWithCounts(leanOf(tones(5, 2, 4))), "leans favourable (5 favourable, 2 trying)");
  assert.equal(leanWithCounts(leanOf(tones(0, 0, 3))), "no clear lean");
});

const ADULT: Chart = {
  id: 0,
  name: "Synthetic adult",
  gender: "male",
  birthDate: "1968-07-02",
  birthTime: "14:35",
  timezone: "Asia/Kolkata",
  timeStandard: "auto",
  place: "Pune, India",
  latitude: 18.5204,
  longitude: 73.8567,
  ayanamsa: "lahiri",
  nodeType: "mean",
  sunriseDef: "edge",
  parashariHouseMethod: "rashi",
  notes: "",
  deathDate: null,
  timeUncertaintyMin: 0,
  events: [],
};
const AS_OF = "2026-10-17T12:00:00.000Z";
const result = computeChart(ADULT);
const run = (withhold: boolean) =>
  computeParashari(
    result.positions,
    result.jaimini.lagna.lon,
    result.utc,
    AS_OF,
    result.shadbala,
    result.dasaStarts,
    undefined,
    withhold,
  );

test("dasa readings carry the lean of their own lines", () => {
  const par = run(false);
  assert.ok(par.dasaReadings.length >= 9);
  for (const d of par.dasaReadings) {
    const l = leanOf(d.notes.map((n) => n.tone));
    assert.deepEqual(d.lean, l, d.lord);
    assert.equal(d.verdict, verdictOfLean(l), d.lord);
  }
  // Not every period comes out mixed any more (the old rule needed every line to agree).
  assert.ok(par.dasaReadings.some((d) => d.verdict !== "mixed"));
});

test("after the minors' gate the lean and the antar verdicts are recounted from what remains", () => {
  const gated = run(true);
  for (const d of gated.dasaReadings) {
    const l = leanOf(d.notes.map((n) => n.tone));
    assert.deepEqual(d.lean, l, d.lord);
    assert.equal(d.verdict, verdictOfLean(l), d.lord);
    for (const a of d.antars) {
      assert.equal(a.facts.maraka ?? null, null);
      const s = a.facts.favourable.length,
        n = a.facts.adverse.length;
      // antarVerdict without the maraka fact.
      const expect =
        s && !n ? "support" : n && !s ? "strain" : s >= 3 && n <= 1 ? "support" : n >= 3 && s <= 1 ? "strain" : "mixed";
      assert.equal(a.verdict, expect, `${d.lord}/${a.lord}`);
    }
  }
});

test("dasa-start Ashtakavarga line: five or more favourable, four even, three or fewer adverse", () => {
  const par = run(false);
  let seen = 0;
  for (const d of par.dasaReadings) {
    const n = d.notes.find((x) => x.id === `${d.lord}-66-transit`);
    if (!n) continue;
    seen++;
    const rk = Number(/carries (\d) of 8 rekhas/.exec(n.text)?.[1]);
    const adverseBand = n.text.includes("below 25 and adverse");
    const expect = rk >= 5 && !adverseBand ? "support" : rk <= 3 || adverseBand ? "strain" : "mixed";
    assert.equal(n.tone, expect, n.text);
    if (rk === 4) assert.ok(n.text.includes("an even sign"), n.text);
    assert.ok(n.detail?.includes("five or more"), "the count is labelled as the app's");
  }
  assert.ok(seen > 0);
});

const F = (area: Finding["area"], planets: Finding["planets"], extra: Partial<Finding> = {}): Finding => ({
  ruleId: `${area}-${planets.join("-")}`,
  area,
  text: `${planets.join(" with ")}: a line on ${area}.`,
  score: 2,
  planets,
  relation: null,
  viaRetro: false,
  ...extra,
});

test("matter rows: an area lights at the most direct contact among the lines the passage activates", () => {
  const touches = areaTouches(
    {
      conjunct: ["Saturn"],
      trine: ["Moon", "Mercury"],
      opposite: ["Mars"],
      activated: [
        F("career", ["Mercury", "Saturn"]),
        F("career", ["Moon", "Jupiter"]),
        F("health", ["Moon", "Ketu"]),
        F("wealth", ["Mars", "Venus"]),
        F("family", ["Saturn", "Sun"], { score: 0 }),
        F("family", ["Saturn", "Moon"], { grade: { level: "cancelled", ratio: 0, reasons: [] } }),
        F("marriage", ["Saturn", "Venus"]),
      ],
    },
    LINE_AREAS,
  );
  const by = Object.fromEntries(touches.map((t) => [t.area, t]));
  assert.deepEqual(Object.keys(by).sort(), ["career", "health", "wealth"], "cancelled and empty lines light nothing; unlisted areas are left out");
  assert.equal(by.career.contact, "over");
  assert.equal(by.career.strength, 1);
  assert.deepEqual(by.career.planets, ["Saturn"]);
  assert.equal(by.career.findings.length, 2);
  assert.equal(by.health.contact, "trine");
  assert.equal(by.health.strength, 0.75);
  assert.equal(by.wealth.contact, "7th");
  assert.equal(by.wealth.strength, 0.5);
});

test("matter rows follow the Timing list: a row lights only for areas the passage activates", () => {
  const rs = readTransits(result.transits, result.positions, result.reading.findings, result.utc, result.reading.roles);
  let lit = 0;
  for (const r of rs) {
    for (const t of areaTouches(r, LINE_AREAS)) {
      lit++;
      assert.ok(r.areas.includes(t.area), `${r.period.planet} ${r.period.sign}: ${t.area}`);
      assert.ok(t.findings.every((f) => r.activated.includes(f)));
    }
  }
  assert.ok(lit > 0);
  // Quiet passages light nothing.
  for (const r of rs.filter((x) => x.weight === 0)) assert.equal(areaTouches(r, LINE_AREAS).length, 0);
});
