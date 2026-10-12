/**
 * Divisional charts in the readings: the 6.53 exclusions (combust, defeated, weak, Sayana), the lagna
 * lord's grade of 36.38-39, the twenty-point strength in the period reading (7.26-27, 7.30-32), and
 * the birth-time windows of the sixteen lagnas with the marks on readings that rest on them.
 */
import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import { computeParashari } from "@shared/parashari";
import { computeVargas, vargaExclusions } from "@shared/vargas";
import { computeAvasthas } from "@shared/parashari-avasthas";
import { computeShadbala } from "@shared/shadbala";
import { timeRest, timeRestText, crossedBy } from "@shared/time-windows";
import { computeChart } from "../server/routes";

const base: Chart = {
  id: 0,
  name: "Synthetic",
  gender: "female",
  birthDate: "1975-03-14",
  birthTime: "06:10",
  timezone: "UTC",
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
};
const AS_OF = "2026-10-11T12:00:00.000Z";
const BIRTHS = [
  ["1948-01-07", "01:10"],
  ["1962-04-19", "13:25"],
  ["1975-03-14", "06:10"],
  ["1983-08-02", "01:10"],
  ["1997-11-23", "13:25"],
  ["2004-04-19", "01:10"],
  ["1991-06-30", "09:40"],
  ["1969-12-01", "18:05"],
];
const charts = BIRTHS.map(([birthDate, birthTime]) =>
  computeChart({ ...base, birthDate, birthTime }),
);
const read = (r: (typeof charts)[number]) =>
  computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, AS_OF, r.shadbala, r.dasaStarts);

test("6.53: weak, defeated and Sayana planets lose their designation, with the reason", () => {
  const r = charts[0];
  const plainV = computeVargas(r.positions, r.jaimini.lagna.lon);
  const ex = { weak: ["Jupiter" as const], defeated: ["Mars" as const], sayana: ["Venus" as const] };
  const v = computeVargas(r.positions, r.jaimini.lagna.lon, ex);
  for (const p of v.planets.filter((x) => x.designation)) {
    const before = plainV.planets.find((x) => x.planet === p.planet)!;
    const hit = (["Jupiter", "Mars", "Venus"] as string[]).includes(p.planet);
    if (hit) {
      assert.ok(Object.values(p.designation!).every((d) => d.name === null), `${p.planet} keeps a designation`);
      assert.ok(p.excluded!.length >= 1);
    } else assert.deepEqual(p.designation, before.designation);
    // The good-varga count itself is unchanged; only the designation is withheld.
    assert.deepEqual(
      Object.values(p.designation!).map((d) => d.good),
      Object.values(before.designation!).map((d) => d.good),
    );
  }
  assert.match(v.planets.find((x) => x.planet === "Jupiter")!.excluded!.join(), /Shadbala/);
  assert.match(v.planets.find((x) => x.planet === "Mars")!.excluded!.join(), /planetary war/);
  assert.match(v.planets.find((x) => x.planet === "Venus")!.excluded!.join(), /Sayana/);
});

test("6.53 exclusions are drawn from Shadbala and the Sayanadi avasthas", () => {
  for (const r of charts.slice(0, 4)) {
    const lagnaIdx = r.jaimini.lagna.signIndex;
    const sb = computeShadbala(r.positions, lagnaIdx, r.shadbala!);
    const av = computeAvasthas(r.positions, lagnaIdx, { aspect: () => 0, benefic: () => true }, sb, r.shadbala);
    const ex = vargaExclusions(sb, av)!;
    assert.deepEqual(ex.weak, sb.planets.filter((p) => !p.strong).map((p) => p.planet));
    assert.deepEqual(ex.defeated, Array.from(new Set(sb.wars.map((w) => w.loser))));
    assert.deepEqual(ex.sayana, av.planets.filter((a) => a.sayanadi?.name === "Sayana").map((a) => a.planet));
    // computeParashari carries the same exclusions for the panels and the report.
    assert.deepEqual(read(r).vargaExclusions, ex);
  }
});

test("36.38-39: the lagna lord's ten-chart grade, after the exclusions, gives the verse's result", () => {
  const NAMED = ["Parijata", "Uttama", "Gopura", "Simhasana", "Paravata", "Devaloka", "Sakravahana"];
  let fired = 0;
  for (const r of charts) {
    const p = read(r);
    const v = computeVargas(r.positions, r.jaimini.lagna.lon, p.vargaExclusions);
    const l1 = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"][r.jaimini.lagna.signIndex];
    const g = v.planets.find((x) => x.planet === l1)!.designation!.dasa;
    const f = p.findings.filter((x) => x.id.startsWith("pa-yoga-36-38-"));
    if (g.name && NAMED.includes(g.name)) {
      fired++;
      assert.equal(f.length, 1);
      assert.equal(f[0].id, `pa-yoga-36-38-${g.name.toLowerCase()}`);
      assert.match(f[0].text, /the ascendant lord "in /);
      assert.deepEqual(f[0].planets, [l1]);
      assert.equal(f[0].source.provisional, g.name === "Uttama" || g.name === "Sakravahana");
      assert.ok(f[0].plain && f[0].gist);
    } else assert.equal(f.length, 0, `${l1} grade ${g.name} should give no 36.38-39 finding`);
  }
  assert.ok(fired >= 1, "no chart in the sample has a named grade for its lagna lord");
});

test("7.30-32: each planet's mahadasa carries its twenty-point band; antars use the ends of the bands", () => {
  for (const r of charts.slice(0, 3)) {
    const p = read(r);
    const v = computeVargas(r.positions, r.jaimini.lagna.lon, p.vargaExclusions);
    for (const d of p.dasaReadings) {
      const n = d.notes.find((x) => x.id === `${d.lord}-7-vimsopaka`);
      const vp = v.planets.find((x) => x.planet === d.lord)?.vimsopaka;
      if (!vp) {
        assert.equal(n, undefined, `${d.lord} is a node and has no twenty-point strength`);
        continue;
      }
      const s16 = vp.find((x) => x.scheme === "shodasa")!;
      assert.ok(n, `${d.lord} dasa has no twenty-point note`);
      assert.equal(n!.layer, "strength");
      assert.equal(n!.tone, s16.band === "wholly favourable" ? "support" : s16.band === "below five" ? "strain" : "mixed");
      assert.match(n!.text, new RegExp(`^Twenty-point strength ${s16.total.toFixed(1)} of 20`));
      assert.match(n!.detail!, /ten charts .* seven charts .* six charts/);
      assert.ok(n!.source.provisional);
      for (const a of d.antars) {
        const av = v.planets.find((x) => x.planet === a.lord)?.vimsopaka?.find((x) => x.scheme === "shodasa");
        const fav = a.facts.favourable.some((x) => x.startsWith("twenty-point strength"));
        const adv = a.facts.adverse.some((x) => x.startsWith("twenty-point strength"));
        assert.equal(fav, av?.band === "wholly favourable", `${d.lord}/${a.lord}`);
        assert.equal(adv, av?.band === "below five", `${d.lord}/${a.lord}`);
      }
    }
  }
});

test("with the viswa of 7.24-25 no twenty-point total falls below five", () => {
  for (const r of charts)
    for (const p of computeVargas(r.positions, r.jaimini.lagna.lon).planets)
      for (const s of p.vimsopaka ?? []) assert.ok(s.total >= 5 && s.total <= 20, `${p.planet} ${s.scheme} ${s.total}`);
});

test("lagna windows: the finer the chart, the shorter the window (Steve Jobs, public data)", () => {
  const r = computeChart({
    ...base,
    name: "Steve Jobs",
    birthDate: "1955-02-24",
    birthTime: "19:15",
    timezone: "America/Los_Angeles",
    place: "San Francisco",
    latitude: 37.7749,
    longitude: -122.4194,
  });
  const w = r.lagnaWindows!;
  assert.ok(w.D1 && w.D9 && w.D60);
  // Leo rises at 29 deg: the rasi lagna turns to Virgo about 4.6 minutes after the recorded time.
  assert.ok(Math.abs(w.D1!.after - 4.6) <= 0.3, `D1 after ${w.D1!.after}`);
  assert.ok(Math.abs(w.D9!.before + w.D9!.after - 16.3) <= 0.4, `D9 ${w.D9!.before}+${w.D9!.after}`);
  assert.ok(Math.abs(w.D60!.before + w.D60!.after - 2.4) <= 0.3, `D60 ${w.D60!.before}+${w.D60!.after}`);
  const span = (k: "D1" | "D9" | "D16" | "D60") => w[k]!.before + w[k]!.after;
  assert.ok(span("D1") > span("D9") && span("D9") > span("D16") && span("D16") > span("D60"));
  for (const x of Object.values(w)) assert.ok(x!.before >= 0 && x!.after >= 0);

  // 18.32 reads Venus in the navamsa lagna: marked, and time-sensitive once a ±10-minute band is stated.
  const t0 = timeRest("pa-h7-18-32", "", w, 0)!;
  assert.equal(t0.varga, "D9");
  assert.equal(t0.sensitive, false);
  const t10 = timeRest("pa-h7-18-32", "", w, 10)!;
  assert.equal(t10.sensitive, true);
  assert.match(timeRestText(t10, 10), /±10-minute band could change it/);
  assert.equal(timeRest("pa-yoga-36-38-gopura", "", w, 0)!.varga, "D1");
  assert.equal(timeRest("pa-h7-18-19", "the 7th house belongs to Saturn", w, 10), undefined);
  assert.equal(timeRest("pa-h7-18-19", "and the 7th navamsa belongs to Mercury", w, 10)!.varga, "D9");
  assert.equal(timeRest("pa-yoga-kalpadruma", "", w, 10), undefined);
  assert.equal(crossedBy(w.D1!, 4), false);
  assert.equal(crossedBy(w.D1!, 5), true);
});
