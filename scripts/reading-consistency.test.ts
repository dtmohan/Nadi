// The summaries that name the same thing must say the same thing (the 24 Oct test reading, items 3 and 6-8):
// the strength qualifier gives the real percentage and owns its cut-off as the app's; the Overview and the Nadi tab
// build one sentence; a mixed area's headline names both sides; KP tells "no verdict" from "nothing read"; the
// cinema line is read as the book lists it; a class note's summary shows its parts under it.
// Synthetic charts only.
import test from "node:test";
import assert from "node:assert/strict";
import type { Chart } from "@shared/schema";
import { computeChart } from "../server/routes";
import { computeKp } from "@shared/kp";
import { agreementFor } from "@shared/agreement";
import { gist, synthesize, toneOf } from "@shared/synthesis";
import { areaWord, nadiAreasClauses } from "@shared/life-areas";
import { strengthQualifier, strengthQualifierPlain } from "@shared/shadbala";
import { KP_RULES, kpDisplayOrder } from "@shared/rules-kp";

const chart = (
  name: string,
  gender: "male" | "female",
  birthDate: string,
  birthTime: string,
  timezone: string,
  place: string,
  latitude: number,
  longitude: number,
): Chart =>
  ({
    id: 0,
    name,
    gender,
    birthDate,
    birthTime,
    timezone,
    timeStandard: "auto",
    place,
    latitude,
    longitude,
    ayanamsa: "lahiri",
    nodeType: "mean",
    sunriseDef: "edge",
    parashariHouseMethod: "rashi",
    notes: "",
    deathDate: null,
    timeUncertaintyMin: 0,
    events: [],
  }) as unknown as Chart;

const PORTLAND = chart("Synthetic female, Portland", "female", "1994-07-12", "08:15", "America/Los_Angeles", "Portland, Oregon", 45.52345, -122.67621);
const CHENNAI = chart("Synthetic male, Chennai", "male", "1975-03-14", "06:10", "Asia/Kolkata", "Chennai, India", 13.0827, 80.2707);
const BOSTON = chart("Synthetic female, Boston", "female", "1969-05-30", "14:20", "America/New_York", "Boston, Massachusetts", 42.3601, -71.0589);
const LAGOS = chart("Synthetic male, Lagos", "male", "1992-12-16", "11:45", "Africa/Lagos", "Lagos, Nigeria", 6.5244, 3.3792);
const CHARTS = [PORTLAND, CHENNAI, BOSTON, LAGOS];

const cache = new Map<Chart, ReturnType<typeof computeChart>>();
const resultOf = (c: Chart) => {
  if (!cache.has(c)) cache.set(c, computeChart(c));
  return cache.get(c)!;
};

test("the strength qualifier gives the percentage and owns its cut-off as the app's (BPHS 24.145, 27.32-33)", () => {
  const half = { total: 292, required: 300, effect: "half" as const };
  const quarter = { total: 180, required: 300, effect: "quarter" as const };
  const full = { total: 355, required: 330, effect: "full" as const };
  assert.equal(
    strengthQualifierPlain("Mars", half),
    "Mars has 97% of the strength Parashara asks for; short of full strength, expect about half of this",
  );
  assert.equal(
    strengthQualifierPlain("Mars", quarter),
    "Mars has 60% of the strength Parashara asks for, well short of it, so expect only a little of this",
  );
  assert.equal(strengthQualifierPlain("Venus", full), "Venus is strong enough by Parashara's measure to give this in full");
  assert.match(strengthQualifier("Mars", half), /292 of the 300 virupas .*97%, so expect about half the effect: medium strength, which the app takes as 75-99% .*\(provisional\)\.$/);
  assert.match(strengthQualifier("Mars", quarter), /under 75% of the requirement.*\(provisional\)\.$/);
  assert.doesNotMatch(strengthQualifier("Venus", full), /provisional/);
});

test("the Overview and the Nadi tab name every firm area in one sentence", () => {
  for (const c of CHARTS) {
    const areas = synthesize(resultOf(c).reading, c.gender as "male" | "female");
    const s = nadiAreasClauses(areas);
    const firm = areas.filter((a) => a.tone === "supportive");
    if (!firm.length) continue;
    assert.ok(s, c.name);
    const head = s!.split(" on firm ground")[0];
    for (const a of firm) assert.ok(head.includes(areaWord(a.area)), `${c.name}: ${areaWord(a.area)} named as firm`);
    // No firm area is counted among the rest.
    if (areas.every((a) => a.tone === "supportive" || a.tone === "quiet")) assert.doesNotMatch(s!, /mixed/);
  }
  const many = CHARTS.some((c) => synthesize(resultOf(c).reading, c.gender as "male" | "female").filter((a) => a.tone === "supportive").length > 3);
  assert.ok(many, "a synthetic chart has more than three firm areas, the case the Nadi tab used to cut short");
});

test("a mixed area's headline names one line from each side", () => {
  let checked = 0;
  for (const c of CHARTS) {
    const areas = synthesize(resultOf(c).reading, c.gender as "male" | "female");
    for (const a of areas.filter((x) => x.tone === "mixed")) {
      // The area's kept findings: the key ones and the rest, less those a larger combination covers.
      const all = [...a.key, ...a.rest.filter((f) => !a.coveredBy[f.ruleId])];
      if (!all.some((f) => toneOf(f) === "good") || !all.some((f) => toneOf(f) === "hard")) continue;
      assert.match(a.headline, /^A mixed picture\. .+; yet .+\.$/, `${c.name} ${a.area}: ${a.headline}`);
      assert.equal(toneOf(a.key[0]), "good", `${c.name} ${a.area}: the supportive line leads the key findings`);
      assert.equal(toneOf(a.key[1]), "hard", `${c.name} ${a.area}: the hard line follows it`);
      checked++;
    }
  }
  assert.ok(checked >= 2, `mixed areas checked: ${checked}`);
  // The children reading's own headline no longer speaks for a mixed children area (CHENNAI).
  const children = synthesize(resultOf(CHENNAI).reading, "male").find((a) => a.area === "children")!;
  assert.equal(children.tone, "mixed");
  assert.notEqual(children.headline, resultOf(CHENNAI).reading.children.headline);
});

test("a supportive or care headline quotes only its own side when it has two such lines", () => {
  let checked = 0;
  for (const c of CHARTS)
    for (const a of synthesize(resultOf(c).reading, c.gender as "male" | "female")) {
      if (a.contest || (a.tone !== "supportive" && a.tone !== "care")) continue;
      if (/^(Well supported|Asks for care)\./.test(a.headline) === false) continue; // a topic reading's own headline
      const side = a.tone === "supportive" ? "good" : "hard";
      if (a.key.filter((f) => toneOf(f) === side).length < 2) continue;
      for (const f of a.key.filter((x) => toneOf(x) !== side && toneOf(x) !== "neutral")) {
        const g = gist(f.text).split(/[.;]/)[0].trim().toLowerCase();
        assert.ok(!a.headline.toLowerCase().includes(g), `${c.name} ${a.area}: "${a.headline}" quotes "${g}"`);
      }
      checked++;
    }
  assert.ok(checked >= 3, `areas checked: ${checked}`);
  const lagos = synthesize(resultOf(LAGOS).reading, "male").find((a) => a.area === "children")!;
  assert.equal(lagos.tone, "care");
  assert.match(lagos.headline, /^Asks for care\./);
  assert.notEqual(lagos.headline, resultOf(LAGOS).reading.children.headline, "the children reading's promise does not head a care area");
});

test("KP marks a topic with only descriptive rules as no verdict, not as unread", () => {
  let seen = 0;
  for (const c of CHARTS)
    for (const t of agreementFor(resultOf(c), true)) {
      const kp = t.stances.find((s) => s.system === "kp")!;
      if (kp.word !== "no verdict") continue;
      seen++;
      assert.equal(kp.stance, "silent");
      assert.match(kp.note, /^No promise or denial rule fires .+; the KP rules that do fire describe it: .+\.$/);
      assert.match(t.sentence, /KP has no verdict here, only rules that describe it\./);
      assert.doesNotMatch(t.sentence, /KP does not read it/);
    }
  assert.ok(seen >= 3, `no-verdict cells seen: ${seen}`);
});

test("the cinema line needs all four houses the book connects (Astro Secrets & KP Part 1, p. 152)", () => {
  const rule = KP_RULES.find((r) => r.id === "kp5-actor")!;
  assert.deepEqual(rule.when.all, [5, 7, 10, 11]);
  assert.equal(rule.when.minOf, undefined);
  for (const c of CHARTS) {
    const r = resultOf(c);
    const f = computeKp(r.kp, r.utc, r.now.asOf).findings.find((x) => x.ruleId === "kp5-actor");
    if (f) for (const h of [5, 7, 10, 11]) assert.ok(f.used.includes(h), `${c.name}: house ${h}`);
  }
});

test("a class note's summary shows its parts under it, counted as they were (KP class 4.1)", () => {
  const r = resultOf(BOSTON);
  const kp = computeKp(r.kp, r.utc, r.now.asOf);
  const second = kp.findings.filter((f) => f.cusp === 2 && f.topic !== "Sources of income");
  const parts = second.filter((f) => f.partOf === "kp2-wealth-mixed");
  assert.ok(parts.length, "BOSTON's 2nd sub lord fires the mixed summary with a part");
  for (const f of parts) {
    assert.ok(["kp2-gain", "kp2-loss"].includes(f.ruleId));
    assert.equal(f.standing, undefined, "a part keeps its standing; partOf is display only");
  }
  const order = kpDisplayOrder(second).map((f) => f.ruleId);
  const at = order.indexOf("kp2-wealth-mixed");
  assert.deepEqual(order.slice(at + 1, at + 1 + parts.length).sort(), parts.map((f) => f.ruleId).sort());
});
