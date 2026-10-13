// The plain reading's gentle filter, and the readings the texts themselves cancel, on synthetic charts (no real
// person's data). The plain reading must never print the deny-listed phrasings (shared/gentle.ts PLAIN_DENY), whatever
// the chart or the date; the practitioner reading keeps the verse wording. Where a text settles two opposite readings
// itself, the reading follows it rather than printing both: the Upapada affliction gives way to a benefic (BPHS 30.22),
// a transit house a rule voids says so (Phaladeepika 26.30-41), one planet's contrary lordship readings are set aside
// (BPHS 24.145-148), and Rahu holding the Sun withdraws the son line.
//
// Run from the repository root: `npm test` (the ephemeris wrapper finds ./ephe by cwd).

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { DateTime } from "luxon";

import type { Chart, ChartResult } from "@shared/schema";
import { normaliseParashariHouseMethod } from "@shared/schema";
import { buildReport } from "@shared/report";
import type { ReportDoc, ReportSection } from "@shared/report/types";
import { soften, plainViolations, formationOnly } from "@shared/gentle";
import { RULES } from "@shared/rules";
import { JAIMINI_RULES } from "@shared/rules-jaimini";
import { LORD_IN_HOUSE } from "@shared/parashari-data";
import {
  PRASNA_HOUSE_EFFECTS,
  PRASNA_PLANET_DISPOSITIONS,
  PRASNA_BHAVA_SIGNIFICATIONS,
  PRASNA_KARAKAS,
  PRASNA_TRANSIT_EFFECTS,
  PRASNA_GULIKA_EFFECTS,
} from "@shared/rules-prasna";
import { computeGochara, gocharaPlainEffect, natalOwnMarks, HOUSE_TEXT } from "@shared/gochara";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import { rahuHoldsSun } from "@shared/children";
import { sarvarthaLeftOut } from "@shared/sarvartha";
import { computeChart } from "../server/routes";
import { julianDay, positionsAt } from "../server/ephemeris";

const chart = (
  name: string,
  gender: "male" | "female",
  birthDate: string,
  birthTime: string,
  timezone: string,
  place: string,
  latitude: number,
  longitude: number,
): Chart => ({
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
});

// Synthetic charts. PORTLAND has Rahu holding the Sun and Ketu in the 2nd from the Upapada with a benefic on it;
// BOSTON (Virgo rising) has Mars, lord of the 3rd and the 8th, in the 3rd, and Jupiter, lord of the 4th and the 7th,
// in the 1st, each pair reading opposite ways.
const PORTLAND = chart("Synthetic female, Portland", "female", "1994-07-12", "08:15", "America/Los_Angeles", "Portland, USA", 45.52345, -122.67621);
const CHENNAI = chart("Synthetic adult", "male", "1975-03-14", "06:10", "Asia/Kolkata", "Chennai, India", 13.0827, 80.2707);
const BOSTON = chart("Synthetic female, Boston", "female", "1969-05-30", "14:20", "America/New_York", "Boston, USA", 42.3601, -71.0589);
const LAGOS = chart("Synthetic male, Lagos", "male", "1992-12-16", "11:45", "Africa/Lagos", "Lagos, Nigeria", 6.5244, 3.3792);

const results = new Map<Chart, ChartResult>();
const resultOf = (c: Chart) => {
  if (!results.has(c)) results.set(c, computeChart(c));
  return results.get(c)!;
};

function texts(doc: ReportDoc): string[] {
  const out: string[] = [];
  const walk = (s: ReportSection) => {
    out.push(s.title, s.kicker ?? "");
    for (const p of s.paras) {
      out.push(p.text ?? "", p.aside ?? "");
      for (const h of p.head ?? []) out.push(h);
      for (const r of p.rows ?? []) out.push(...r);
    }
    for (const x of s.sub ?? []) walk(x);
  };
  for (const s of doc.sections) walk(s);
  return out.filter(Boolean);
}

const parashariOf = (r: ChartResult) =>
  computeParashari(
    r.positions,
    r.jaimini.lagna.lon,
    r.utc,
    r.now.asOf,
    r.shadbala,
    r.dasaStarts,
    DEFAULT_ASPECT_FLOOR,
    false,
    normaliseParashariHouseMethod(r.chart.parashariHouseMethod),
  );

test("every static rule text reads within the deny-list once softened", () => {
  const tables: Record<string, string[]> = {
    nadi: RULES.map((r) => r.text),
    jaimini: JAIMINI_RULES.map((r) => r.text),
    lords: LORD_IN_HOUSE.flat().map((e) => e.text),
    prasnaHouses: PRASNA_HOUSE_EFFECTS.flatMap((r) => [r.malefic, r.benefic]),
    prasnaPlanets: PRASNA_PLANET_DISPOSITIONS.flatMap((r) => [r.favourable, r.unfavourable]),
    prasnaBhavas: PRASNA_BHAVA_SIGNIFICATIONS.map((r) => r.text),
    prasnaKarakas: PRASNA_KARAKAS.map((r) => r.text),
    prasnaTransits: Object.values(PRASNA_TRANSIT_EFFECTS).flat() as string[],
    prasnaGulika: PRASNA_GULIKA_EFFECTS,
    gochara: Object.values(HOUSE_TEXT).flatMap((h) =>
      Object.values(h).flatMap((x) => [x.bs?.text, x.pd?.text].filter((t): t is string => !!t)),
    ),
  };
  const hits = Object.entries(tables).flatMap(([name, ts]) =>
    ts.filter((t) => typeof t === "string").flatMap((t) => plainViolations(soften(t)).map((v) => `${name}: ${v}`)),
  );
  assert.deepEqual(hits, []);
});

// Literals the sweep below leaves alone, each for a stated reason. Anything else in shared/ that the plain reading
// would print with a deny-listed phrase fails the test until the filter rewrites it.
const SWEEP_EXEMPT: { file: string; test: (t: string) => boolean; why: string }[] = [
  { file: "events.ts", test: (t) => /^Loss of (father|mother|spouse)$/.test(t), why: "event types the user records, not readings" },
  { file: "alp-karakatwas.ts", test: (t) => t === "dead trees", why: "a signification (Saturn's), not a reading" },
  { file: "glossary.ts", test: (t) => t.startsWith("Span of life, classified as"), why: "a glossary definition" },
  { file: "life-stage.ts", test: () => true, why: "the patterns that detect sensitive text" },
  {
    file: "parashari-houses.ts",
    test: (t) => t.includes("Parashara's phrase is that the native goes to hell"),
    why: "a template whose mark sits in a substitution; its full text is checked in the next test",
  },
  {
    file: "sarvartha.ts",
    test: (t) => /short life/.test(t),
    why: "the longevity rules, left out of the plain reading whole (sarvarthaLeftOut, and the chapter 10-11 list)",
  },
];

test("no string in the shared text modules reaches the plain reading with a deny-listed phrase", () => {
  const hits: string[] = [];
  for (const name of fs.readdirSync("shared").filter((f) => f.endsWith(".ts") && f !== "gentle.ts")) {
    const file = `shared/${name}`;
    const src = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (n: ts.Node) => {
      let t: string | undefined;
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) t = n.text;
      else if (ts.isTemplateExpression(n)) t = n.head.text + n.templateSpans.map((x) => `X${x.literal.text}`).join("");
      if (t && /\s/.test(t) && !SWEEP_EXEMPT.some((e) => e.file === name && e.test(t!))) {
        const v = plainViolations(soften(t));
        if (v.length) hits.push(`${file}:${src.getLineAndCharacterOfPosition(n.getStart()).line + 1} ${v[0]}`);
      }
      ts.forEachChild(n, visit);
    };
    visit(src);
  }
  assert.deepEqual(hits, []);
  // The exemption for Sarvartha's longevity rules holds only while the plain reading leaves them out.
  assert.equal(sarvarthaLeftOut("longevity", "short life; neutral, middle; a friend, long", true, false), true);
});

test("soften rewrites hard verses by statement, names the topic, and is idempotent", () => {
  const hell =
    "The 12th lord with the Sun. Parashara's phrase is that the native goes to hell; the Sun-with-12th-lord clause is a common one and is shown as written, to be weighed against 23.1 and 23.10.";
  const s = soften(hell);
  assert.deepEqual(plainViolations(s), []);
  assert.match(s, /the life hereafter/);
  assert.match(s, /23\.1 and 23\.10/, "the weighing against the other verses stays");
  for (const t of [
    hell,
    "Loss of children or a single child kept with difficulty; a daughter more likely.",
    "Short life, chronic complaints, sharp intelligence, and death from poison, weapon or fire.",
    "Saturn and Rahu in the 2nd from the Upapada: loss of the spouse through slander or bereavement; guard the marriage.",
  ])
    assert.equal(soften(soften(t)), soften(t));
  assert.equal(
    formationOnly("Mars and Saturn join in the 7th. Parashara reads a liability to confinement."),
    "Mars and Saturn join in the 7th.",
  );
  // A clause marked ", as written" keeps its condition and milder items (the Sayanadi effects, 45.40-146).
  assert.equal(
    soften("Feared by those in power; in the 5th: loss of children and spouse, as written; with Rahu: a severe fall"),
    "Feared by those in power; in the 5th: a harder line on children, given in full in the practitioner view; with Rahu: a severe fall",
  );
  assert.equal(
    soften("Without a position, drawn to others' spouses, steals others' wealth, as written"),
    "Without a position, and a harder line on conduct, given in full in the practitioner view",
  );
});

test("the plain report carries none of the deny-listed phrasings", () => {
  for (const c of [PORTLAND, CHENNAI, BOSTON, LAGOS]) {
    const hits = texts(buildReport(resultOf(c), { plain: true })).flatMap(plainViolations);
    assert.deepEqual(hits, [], c.name);
  }
});

test("the practitioner report keeps the verse wording", () => {
  const all = texts(buildReport(resultOf(PORTLAND), { plain: false })).join("\n");
  assert.match(all, /goes to hell/);
});

test("a transit house a rule voids gives the rule, not the voided text (Phaladeepika 26.30-41)", () => {
  const r = resultOf(PORTLAND);
  const moon = r.positions.find((p) => p.planet === "Moon")!;
  const asOf = "2026-01-15T00:00:00.000Z";
  const sky = positionsAt(julianDay(DateTime.fromISO(asOf, { zone: "utc" })), { ayanamsa: "lahiri", nodeType: "mean" });
  const g = computeGochara(moon.signIndex, sky, asOf, false, {
    ownMarks: natalOwnMarks(r.positions, r.jaimini.lagna.lon),
  });
  const voided = g.rows.filter((x) => x.voided);
  assert.ok(voided.some((x) => x.voided === "ill") && voided.some((x) => x.voided === "good"), "both kinds occur on this sky");
  for (const row of g.rows) {
    const plain = gocharaPlainEffect(row);
    if (row.voided === "ill") {
      assert.notEqual(row.verdict, "unfavourable", row.planet);
      assert.match(plain, /^The usual difficulty of this house does not apply: .+\(26\.(30|31|41)\)\.$/, row.planet);
    } else if (row.voided === "good") {
      assert.notEqual(row.verdict, "favourable", row.planet);
      assert.match(plain, /^The usual good of this house is held back/, row.planet);
    } else {
      assert.equal(plain, [row.effect.bs?.text, row.effect.pd?.text].filter(Boolean).join("; "), row.planet);
    }
  }
});

test("the Upapada affliction gives way to a benefic on the same sign (BPHS 30.22)", () => {
  for (const c of [PORTLAND, CHENNAI, BOSTON, LAGOS]) {
    const ids = new Set(resultOf(c).jaimini.findings.map((f) => f.id));
    assert.ok(!(ids.has("ju-2nd-afflicted") && ids.has("ju-2nd-benefic")), c.name);
  }
  // Ketu, a malefic, stands in the 2nd from the Upapada here, and a benefic touches the sign.
  const r = resultOf(PORTLAND);
  const ul = r.jaimini.arudhas[11].signIndex;
  assert.ok(r.positions.some((p) => p.planet === "Ketu" && p.signIndex === (ul + 1) % 12));
  const ids = new Set(r.jaimini.findings.map((f) => f.id));
  assert.ok(ids.has("ju-2nd-benefic"));
  assert.ok(!ids.has("ju-2nd-afflicted"));
});

test("one planet's contrary lordship readings from one house are set aside (BPHS 24.145-148)", () => {
  const par = parashariOf(resultOf(BOSTON));
  const by = new Map(par.findings.map((f) => [f.id, f]));
  for (const [a, b] of [
    ["pa-lord-3-3", "pa-lord-8-3"],
    ["pa-lord-4-1", "pa-lord-7-1"],
  ]) {
    const fa = by.get(a)!;
    const fb = by.get(b)!;
    assert.ok(fa && fb, `${a} and ${b} fire`);
    assert.notEqual(fa.tone, fb.tone);
    assert.equal(fa.nullified?.with, b);
    assert.equal(fb.nullified?.with, a);
    assert.match(fa.nullified!.text, /24\.145-148/);
    assert.equal(fa.nullified!.source.provisional, true);
  }
  // A planet whose two readings agree, or that rules one house, is left alone.
  for (const f of par.findings.filter((x) => x.nullified))
    assert.notEqual(f.tone, by.get(f.nullified!.with)!.tone);
  // The plain report prints the setting-aside, not the two readings.
  const plain = texts(buildReport(resultOf(BOSTON), { plain: true })).join("\n");
  assert.match(plain, /so both are set aside here/);
  for (const [house, lordIn] of [
    [3, 3],
    [8, 3],
  ])
    assert.ok(!plain.includes(soften(LORD_IN_HOUSE[house - 1][lordIn - 1].text)), `${house}th lord in the ${lordIn}rd`);
  const prac = texts(buildReport(resultOf(BOSTON), { plain: false })).join("\n");
  assert.ok(prac.includes(LORD_IN_HOUSE[7][2].text), "the practitioner report keeps both readings");
});

test("Rahu holding the Sun withdraws the son line (Nadi children reading)", () => {
  const r = resultOf(PORTLAND);
  assert.ok(rahuHoldsSun(r.positions));
  const f = r.reading.findings.find((x) => x.ruleId === "ch-ju-su");
  assert.ok(f, "the Jupiter-Sun line fires");
  assert.equal(f!.tone, "neutral");
  assert.match(f!.text, /the indication of a son gives way/);
  assert.match(r.reading.children.notes.join(" "), /gives way/);
});
