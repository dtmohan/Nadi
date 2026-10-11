// Guards for the Parashari significations table (display only). The chart is synthetic (no real
// person's data).
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import type { Chart } from "@shared/schema";
import { PLANETS } from "@shared/astro";
import { redactProse, sensitiveTags } from "@shared/life-stage";
import { computeParashari } from "@shared/parashari";
import {
  MODERN_HOUSE_READINGS,
  PARASHARI_SIGNIFICATIONS,
  SIGNIFICATION_CONFLICTS,
  eraShows,
  significationView,
} from "@shared/parashari-significations";
import { computeChart } from "../server/routes";

const SYNTHETIC: Chart = {
  id: 0,
  name: "Synthetic adult",
  gender: "female",
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
};

test("significations: every entry has a tier, a source and a reference; every Mehta entry has a page", () => {
  for (const s of PARASHARI_SIGNIFICATIONS) {
    const id = `${s.planet}: ${s.word}`;
    assert.ok(PLANETS.includes(s.planet), id);
    assert.ok(s.word.trim() && s.ref.trim(), id);
    if (s.tier === "classical") {
      assert.ok(s.source === "BPHS" || s.source === "Phaladeepika", id);
      assert.match(s.ref, /^\d+\.\d+(-\d+)?$/, `${id}: a classical entry is cited by verse`);
      assert.equal(s.since, undefined, `${id}: the era rule is for modern readings only`);
    } else {
      assert.ok(s.source === "Mehta" || s.source === "Aggarwal", id);
    }
    if (s.source === "Mehta") assert.match(s.ref, /\bpp?\. \d+/, `${id}: a Mehta entry carries its page`);
    if (s.source === "Aggarwal") assert.match(s.ref, /^Part \d/, `${id}: an Aggarwal entry carries its part`);
  }
  for (const h of MODERN_HOUSE_READINGS) assert.match(h.ref, /\bpp?\. \d+/, `house ${h.house}`);
});

test("significations: declared tags agree with the shared age gate", () => {
  for (const s of PARASHARI_SIGNIFICATIONS) {
    const declared = [...(s.tags ?? [])].sort();
    const found = [...new Set(sensitiveTags(s.word))].sort();
    assert.deepEqual(declared, found, `${s.planet}: ${s.word}`);
  }
  for (const h of MODERN_HOUSE_READINGS) assert.deepEqual(sensitiveTags(h.reading), [], `house ${h.house}`);
});

test("significations: the minor's view withholds potency and longevity, and keeps the rest", () => {
  const tagged = PARASHARI_SIGNIFICATIONS.filter((s) => s.tags?.length);
  assert.ok(tagged.some((s) => s.word === "potency" && s.planet === "Venus"));
  const minor = significationView({ birthYear: 2015, withheld: true });
  assert.equal(minor.withheldCount, tagged.length);
  assert.ok(minor.shown.every((s) => !s.tags?.length));
  assert.ok(!minor.shown.some((s) => /potency|longevity/.test(s.word)));
  const adult = significationView({ birthYear: 1975, withheld: false });
  assert.equal(adult.withheldCount, 0);
  assert.ok(adult.shown.some((s) => s.word === "potency"));
  assert.equal(adult.shown.length + adult.eraHidden.length, PARASHARI_SIGNIFICATIONS.length);
});

test("significations: potency is withheld as a topic keyword, so a list loses only that item", () => {
  assert.deepEqual(sensitiveTags("potency"), ["intimacy"]);
  const out = redactProse("Body constituents: Sun bones, Moon blood, Mars marrow, Mercury skin, Jupiter fat, Venus semen, Saturn sinews");
  assert.ok(!/semen/.test(out), out);
  assert.ok(/Saturn sinews/.test(out) && /Sun bones/.test(out), out);
});

test("significations: era rule, a birth in 1869 shows electronics but not software or AI", () => {
  const words = (y: number) => significationView({ birthYear: y, withheld: false }).shown.map((s) => s.word);
  const old = words(1869);
  assert.ok(old.includes("electronics"));
  assert.ok(!old.includes("computer education, software"));
  assert.ok(!old.includes("AI, internet, robotics"));
  assert.ok(!significationView({ birthYear: 1869, withheld: false }).conflicts.some((c) => c.matter === "Software"));
  const modern = words(1955);
  assert.ok(modern.includes("computer education, software") && modern.includes("AI, internet, robotics"));
  assert.ok(eraShows({ since: 1990 }, undefined), "an unknown birth year hides nothing");
  assert.ok(SIGNIFICATION_CONFLICTS.length >= 7);
});

test("significations: display only, imported by display code alone", () => {
  const allowed = new Set([
    "client/src/components/parashari-significations.tsx",
    "client/src/components/parashari-panel.tsx",
  ]);
  const root = process.cwd();
  const importers: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && /parashari-significations["']/.test(readFileSync(full, "utf8")))
        importers.push(relative(root, full));
    }
  };
  for (const d of ["shared", "server", "client/src"]) walk(join(root, d));
  const stray = importers.filter((f) => !allowed.has(f) && f !== "shared/parashari-significations.ts");
  assert.deepEqual(stray, []);
});

test("significations: the chapter 32 constants agree with the table, and 2.25 follows the day or night", () => {
  const result = computeChart(SYNTHETIC);
  const r = computeParashari(
    result.positions,
    result.jaimini.lagna.lon,
    result.utc,
    result.now.asOf,
    result.shadbala,
    result.dasaStarts,
  );
  const KEY: Record<string, string> = {
    father: "father", mother: "mother", brothers: "brother", maternal: "maternal",
    paternal: "grandfather", husband: "husband", sons: "sons", spouse: "parents-in-law",
  };
  for (const c of r.padas.constants) {
    const first = c.matter.split(/[\s,;(]+/)[0].toLowerCase();
    const key = KEY[first];
    assert.ok(key, `no keyword for the constant "${c.matter}"`);
    const words = PARASHARI_SIGNIFICATIONS.filter(
      (s) => s.planet === c.planet && s.source === "BPHS" && s.ref.startsWith("32."),
    ).map((s) => s.word).join(" | ");
    assert.ok(words.includes(key), `${c.matter} -> ${c.planet}: "${words}"`);
  }
  const pb = r.padas.parentsByBirth;
  assert.ok(pb, "Shadbala is present, so the day or night is known");
  assert.deepEqual([pb.father, pb.mother], pb.daytime ? ["Sun", "Venus"] : ["Saturn", "Moon"]);
});
