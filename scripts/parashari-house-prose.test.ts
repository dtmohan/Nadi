// The house-by-house reading (shared/parashari-house-prose.ts): every house in order with its parts in the fixed
// order, one occupant part per planet the placement findings put in the house, the plain register (second
// person, softened, no verse tags), the minors' gate in both registers, the PDF sections built from the same
// parts, and the wording helpers. Synthetic charts only.
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";

import type { Chart } from "@shared/schema";
import { computeParashari, DEFAULT_ASPECT_FLOOR, type ParashariResult } from "@shared/parashari";
import { plainChapter, toYou, yourHouses } from "@shared/parashari-house-prose";
import { ordH } from "@shared/house-gloss";
import { sensitiveGate, withholdText } from "@shared/life-stage";
import { plainViolations, soften } from "@shared/gentle";
import { buildReport } from "@shared/report";
import { computeChart } from "../server/routes";

const AS_OF = "2026-10-19T00:00:00Z";

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

// Four adults and two minors (on AS_OF), each by whole sign and by Sripati.
const BIRTHS: [string, string][] = [
  ["1951-03-14", "05:10"],
  ["1968-07-02", "14:35"],
  ["1979-04-17", "09:50"],
  ["1990-02-28", "16:45"],
  ["2016-03-14", "09:30"],
  ["2020-05-05", "05:05"],
];

interface Run {
  label: string;
  minor: boolean;
  par: ParashariResult;
}

const RUNS: Run[] = [];
for (const [d, t] of BIRTHS)
  for (const method of ["rashi", "sripati"] as const) {
    const c = chart(d, t, method);
    const r = computeChart(c);
    const minor = sensitiveGate(c, r.utc, AS_OF).withheld;
    const par = computeParashari(
      r.positions,
      r.jaimini.lagna.lon,
      r.utc,
      AS_OF,
      r.shadbala,
      r.dasaStarts,
      DEFAULT_ASPECT_FLOOR,
      minor,
      method,
    );
    RUNS.push({ label: `${d} ${t} ${method}${minor ? " minor" : ""}`, minor, par });
  }

const ORDER = /^covers lord (?:(?:planet )+|empty )aspects (?:chapter )*(?:both )?weighing$/;

test("every house is read in order, its parts in the fixed order", () => {
  for (const { label, par } of RUNS) {
    const prose = par.houseProse ?? [];
    assert.deepEqual(prose.map((hp) => hp.house), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], label);
    for (const hp of prose) {
      const keys = hp.parts.map((p) => p.key).join(" ");
      assert.match(keys, ORDER, `${label} h${hp.house}: ${keys}`);
      assert.equal(hp.titlePlain, `Your ${ordH(hp.house)} house`);
      assert.ok(hp.title.startsWith(`${ordH(hp.house)} house (`), hp.title);
      for (const p of hp.parts) {
        assert.ok(p.text.trim() && p.textPlain.trim(), `${label} h${hp.house} ${p.key}: empty`);
        if (p.key !== "empty") assert.ok(p.sources.length > 0, `${label} h${hp.house} ${p.key}: no source`);
        for (const s of p.sources) assert.ok(s.label && /^https?:\/\//.test(s.url ?? ""), `${label} ${s.label}`);
      }
    }
  }
});

test("one occupant part per planet the placement findings put in the house, in their order", () => {
  for (const { label, par } of RUNS)
    for (const hp of par.houseProse ?? []) {
      const placed = par.findings.filter((f) => f.placement && f.house === hp.house);
      const parts = hp.parts.filter((p) => p.key === "planet");
      assert.deepEqual(parts.map((p) => p.planet), placed.map((f) => f.placement!.planet), `${label} h${hp.house}`);
      parts.forEach((p, i) => {
        assert.equal(p.text, placed[i].text, `${label} h${hp.house} ${p.planet}`);
        assert.equal(p.sources[0].label, placed[i].source.label);
        assert.ok(p.textPlain.startsWith(`Since `) && p.textPlain.includes(` is in your ${ordH(hp.house)} house`), p.textPlain);
      });
      assert.equal(hp.parts.some((p) => p.key === "empty"), placed.length === 0, `${label} h${hp.house}`);
    }
});

test("the plain register: second person, softened, no verse tags or jargon", () => {
  for (const { label, par } of RUNS)
    for (const hp of par.houseProse ?? [])
      for (const t of [hp.titlePlain, hp.summaryPlain, ...hp.parts.map((p) => p.textPlain)]) {
        const at = `${label} h${hp.house}: "${t}"`;
        assert.ok(!/\b\d+\.\d+\b/.test(t), `verse tag in ${at}`);
        assert.ok(!/\bnative\b|\bone's\b|\boneself\b/i.test(t), `third person in ${at}`);
        assert.ok(!/\blagna\b|Shadbala|\bdispositor\b/.test(t), `jargon in ${at}`);
        assert.deepEqual(plainViolations(t), [], at);
        assert.equal(soften(t), t, `the softener rewrites ${at}`);
      }
});

test("the minors' gate holds in both registers", () => {
  const minors = RUNS.filter((r) => r.minor);
  assert.ok(minors.length >= 2, "the sweep has minors");
  for (const { label, par } of minors)
    for (const hp of par.houseProse ?? [])
      for (const t of [hp.summary, hp.summaryPlain, ...hp.parts.flatMap((p) => [p.text, p.textPlain])])
        assert.ok(!withholdText(t), `${label} h${hp.house}: withheld matter in "${t}"`);
});

test("the PDF reads each house from the same parts, holding back the houses not yet in season", () => {
  const c = chart("1968-07-02", "14:35", "rashi");
  const result = computeChart(c);
  for (const plain of [true, false]) {
    const doc = buildReport(result, { plain, modules: ["parashari"] });
    const sec = doc.sections.find((s) => s.id === "parashari")!;
    const par = computeParashari(
      result.positions,
      result.jaimini.lagna.lon,
      result.utc,
      AS_OF,
      result.shadbala,
      result.dasaStarts,
      DEFAULT_ASPECT_FLOOR,
      false,
      "rashi",
    );
    for (const hp of par.houseProse ?? []) {
      const sub = sec.sub?.find((s) => s.id === `house-${hp.house}`);
      assert.ok(sub, `house-${hp.house}`);
      assert.equal(sub.title, plain ? `Your ${ordH(hp.house)} house` : `The ${ordH(hp.house)} house`);
      assert.equal(sub.paras.length, hp.parts.length, `house-${hp.house}`);
      sub.paras.forEach((para, i) => {
        const part = hp.parts[i];
        assert.equal(para.kind, part.key === "both" ? "note" : "p");
        assert.ok(para.text!.startsWith((plain ? part.textPlain : part.text).trim().replace(/\.$/, "")), `house-${hp.house} ${part.key}`);
        assert.equal(para.cites?.length ?? 0, part.sources.length);
      });
    }
  }
});

test("helpers: the native's clause in the second person, houses as the reader's own, years as ordinals", () => {
  assert.equal(
    toYou("Parashara says the native looks after his people, helps others and becomes famous."),
    "Parashara says you look after your people, help others and become famous.",
  );
  assert.equal(toYou("Parashara reads a native who begs for food."), "Parashara reads that you beg for food.");
  assert.equal(toYou("Parashara reads a virtuous native."), "Parashara reads you as virtuous.");
  assert.equal(toYou("Parashara reads a virtuous and wealthy native."), "Parashara reads you as virtuous and wealthy.");
  assert.equal(yourHouses("Mercury, lord of the 2nd, is in the 12th."), "Mercury, ruler of your 2nd house, is in your 12th.");
  assert.equal(yourHouses("The lagna lord is strong."), "The ruler of your 1st house is strong.");
  assert.equal(yourHouses("Saturn is in the 7th from the Moon."), "Saturn is in the 7th from the Moon.");
  // A "though 19.8 ..." clause no longer takes the reading with it.
  const c = plainChapter(
    "Saturn, lord of the 8th, is in the 7th, an angle. Parashara reads long life, though 19.8 sets the lagna lord's weakness against the same placement, and Mercury is short of its Shadbala requirement here.",
  );
  assert.match(c, /Parashara reads long life, though he sets a weak ruler of your 1st house against the same placement/);
  assert.ok(!/\d+\.\d+|lagna|Shadbala/.test(c), c);
  assert.deepEqual(
    [1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 42, 101, 111, 112].map(ordH),
    ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "42nd", "101st", "111th", "112th"],
  );
});

test("the house chapters: ordinals for years as well as houses, and 14.4 says what it reads", () => {
  const WRONG = /\b(?:\d*[02-9])?[123]th\b|\b\d*1[123](?:st|nd|rd)\b/;
  for (const { label, par } of RUNS)
    for (const f of par.findings) {
      assert.ok(!WRONG.test(f.text), `${label} ${f.id}: "${f.text}"`);
      assert.ok(!WRONG.test(f.title), `${label} ${f.id}: "${f.title}"`);
      if (f.id === "pa-h3-14-4")
        assert.match(f.text, /Parashara (?:reads younger (?:sisters|brothers)\.|says a mixed picture)/, `${label}: ${f.text}`);
    }
});
