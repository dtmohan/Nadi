// Period lords in transit (T5): Phaladeepika 20.34-38 and 20.59-61, display only. The verse readings on synthetic
// stretches and positions; the server's sampler against the ephemeris at each stretch's midpoint; the request limits;
// the plain view's gentle words; the minors' topic gate; the Overview's Moon line; and the import guard.
// Public figures and synthetic positions only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { DateTime } from "luxon";
import type { Chart } from "@shared/schema";
import type { Planet, PlanetPosition } from "@shared/astro";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import type { AntarReading } from "@shared/parashari-dasa";
import { dasaCondition } from "@shared/parashari-period-significations";
import { SS_COMBUST_ORB, ssCombust, type CombustPlanet } from "@shared/combustion";
import { agreementInput } from "@shared/agreement";
import { briefingFor } from "@shared/briefing";
import {
  dasaLordStrip,
  decodePeriodTransits,
  moonFromDasaLord,
  periodLordSpans,
  subLordStrip,
  verse34,
  verse37,
  verse38Signs,
  PERIOD_TRANSIT_YEARS,
  type LordSpan,
  type Strip,
} from "@shared/period-lord-transits";
import { computeChart } from "../server/routes";
import { julianDay, planetLonAt } from "../server/ephemeris";
import {
  periodTransits,
  periodTransitsSchema,
  PERIOD_TRANSIT_MAX_SPANS,
  type PeriodTransitsRequest,
} from "../server/period-transits";

const ASOF = "2026-10-25T00:00:00Z";
const YEAR_MS = 365.25 * 86400e3;
const FIXTURES: Array<Record<string, unknown> & { name: string }> = JSON.parse(
  readFileSync("scripts/fixtures/public-figures.json", "utf8"),
).charts;

const requestOf = (spans: LordSpan[]): PeriodTransitsRequest => ({
  spans: spans.map((s) => ({ planet: s.planet as PeriodTransitsRequest["spans"][number]["planet"], start: s.start, end: s.end })),
  sun: true,
});
function build(name: string) {
  const c0 = FIXTURES.find((c) => c.name === name)!;
  const r = computeChart({ id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, ...c0 } as unknown as Chart);
  const par = computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, ASOF, r.shadbala, r.dasaStarts, DEFAULT_ASPECT_FLOOR, false, "rashi");
  const spans = periodLordSpans(par.vimshottari, r.utc);
  const pt = decodePeriodTransits(periodTransits(requestOf(spans)));
  return { r, par, spans, pt };
}
const cache = new Map<string, ReturnType<typeof build>>();
const fig = (name: string) => {
  if (!cache.has(name)) cache.set(name, build(name));
  return cache.get(name)!;
};

/** Both strips as the panel builds them. */
function stripsOf(name: string, plain: boolean, asOfIso = ASOF) {
  const { r, par, spans, pt } = fig(name);
  const antarOf = new Map<string, AntarReading>();
  for (const d of par.dasaReadings) for (const a of d.antars) antarOf.set(`${d.lord}|${a.lord}|${a.start}`, a);
  const natalOf = (lord: Planet) => {
    const d = par.dasaReadings.find((x) => x.lord === lord);
    return d ? dasaCondition(d, r.positions).condition : undefined;
  };
  const dasa = dasaLordStrip(spans, pt, {
    dasas: par.vimshottari.dasas,
    lagnaSign: par.lagna.signIndex,
    natalOf,
    birthIso: r.utc,
    asOfIso,
    plain,
  });
  const bhukti = subLordStrip(spans, pt, {
    bhuktis: par.vimshottari.bhuktis,
    verdictOf: (b) => antarOf.get(`${b.dasaLord}|${b.lord}|${b.start}`)?.verdict,
    jupiter: r.transits.filter((t) => t.planet === "Jupiter"),
    birthIso: r.utc,
    asOfIso,
    plain,
  });
  return { dasa, bhukti };
}
const textsOf = (s: Strip) => [
  ...s.pieces.flatMap((p) => [p.readout, p.title, p.matters ?? ""]),
  ...s.marks.flatMap((m) => [m.readout, m.title]),
];

// Synthetic positions: sign and retrograde motion are all these rules read.
const P = (planet: Planet, lon: number, retrograde = false): PlanetPosition =>
  ({ planet, lon, signIndex: Math.floor(lon / 30), degInSign: lon % 30, dignity: "Neutral", retrograde }) as unknown as PlanetPosition;
const seg = (signIndex: number, retro = false, combust = false) => ({ signIndex, retro, combust });

test("20.37: own sign, exaltation or retrograde is happiness; debilitation, an enemy's sign or combust is hardship; both at once is mixed", () => {
  assert.deepEqual(verse37("Venus", seg(11, true)), { state: "good", good: ["exalted", "retrograde"], hard: [] });
  assert.deepEqual(verse37("Venus", seg(5, false, true)), { state: "hard", good: [], hard: ["debilitated", "combust"] });
  assert.deepEqual(verse37("Jupiter", seg(3, false, true)), { state: "mixed", good: ["exalted"], hard: ["combust"] });
  assert.deepEqual(verse37("Jupiter", seg(2)), { state: "hard", good: [], hard: ["enemy"] });
  assert.deepEqual(verse37("Mercury", seg(11, true)), { state: "mixed", good: ["retrograde"], hard: ["debilitated"] });
  // A friend's sign is not one of 20.37's states.
  assert.equal(verse37("Venus", seg(2)).state, "none");
  assert.deepEqual(verse37("Sun", seg(6)), { state: "hard", good: [], hard: ["debilitated"] });
  assert.deepEqual(verse37("Sun", seg(4)), { state: "good", good: ["own"], hard: [] });
  assert.deepEqual(verse37("Sun", seg(10)), { state: "hard", good: [], hard: ["enemy"] });
  assert.deepEqual(verse37("Mars", seg(0)), { state: "good", good: ["own"], hard: [] });
  // The nodes and the Moon are not graded.
  assert.equal(verse37("Rahu", seg(1, true)).state, "none");
  assert.equal(verse37("Ketu", seg(7, true)).state, "none");
  assert.equal(verse37("Moon", seg(1)).state, "none");
});

test("20.38's signs: own and exaltation for a favourable sub-lord; debilitation and enemies' signs for a trying one", () => {
  assert.deepEqual(verse38Signs("Jupiter"), { good: [3, 8, 11], hard: [1, 2, 5, 6, 9] });
  assert.deepEqual(verse38Signs("Moon").hard, [7]);
  assert.deepEqual(verse38Signs("Venus"), { good: [1, 6, 11], hard: [3, 4, 5] });
  assert.deepEqual(verse38Signs("Mercury"), { good: [2, 5], hard: [3, 11] });
  assert.deepEqual(verse38Signs("Rahu"), { good: [], hard: [] });
});

test("20.34 and 20.35: a supported lord builds in its own, exaltation or a friend's sign; a strained one marks loss only when also weak in transit", () => {
  assert.deepEqual(verse34("Venus", "supported", seg(9)), { state: "good", why: ["friend"] });
  assert.deepEqual(verse34("Jupiter", "supported", seg(3)), { state: "good", why: ["exalted"] });
  const enemy = verse34("Venus", "supported", seg(4));
  assert.equal(enemy.state, "none");
  assert.match(enemy.because ?? "", /20\.34 needs/);
  assert.deepEqual(verse34("Mars", "strained", seg(6, false, true)), { state: "hard", why: ["combust"] });
  assert.deepEqual(verse34("Mars", "strained", seg(3)), { state: "hard", why: ["debilitated"] });
  // The narrow reading: weak at birth alone marks nothing.
  const plainStrained = verse34("Mars", "strained", seg(6));
  assert.equal(plainStrained.state, "none");
  assert.match(plainStrained.because ?? "", /read narrowly/);
  for (const natal of ["moderate", "mixed", "ungraded", undefined] as const) assert.equal(verse34("Saturn", natal, seg(6)).state, "none");
  assert.equal(verse34("Rahu", "supported", seg(2)).state, "none");
});

test("20.36 with 20.60-61: the Moon is counted from the dasa lord's position in the sky", () => {
  const natal = [P("Moon", 40)];
  const third = moonFromDasaLord("Jupiter", [P("Jupiter", 10), P("Moon", 70)], natal, true)!;
  assert.equal(third.tone, "good");
  assert.equal(third.line, "Today the Moon is 3rd from Jupiter, the main-period planet: a helpful day (Phaladeepika 20.36, 20.61).");
  assert.equal(third.detail, undefined);

  const second = moonFromDasaLord("Jupiter", [P("Jupiter", 10), P("Moon", 40)], natal, true)!;
  assert.equal(second.tone, "trouble");
  assert.match(second.line, /a day to go gently \(Phaladeepika 20\.36\)/);
  assert.doesNotMatch(second.line, /trouble/i);
  const secondP = moonFromDasaLord("Jupiter", [P("Jupiter", 10), P("Moon", 40)], natal, false)!;
  assert.match(secondP.line, /trouble \(20\.36; 20\.60 as vedicpupil reads it\)/);
  assert.match(secondP.detail ?? "", /Wisdomlib's 20\.60 counts the other way/);
  assert.match(secondP.detail ?? "", /not judged here/);

  // The 1st from the lord: 20.36 leaves it out, 20.61's trikona may count it.
  assert.equal(moonFromDasaLord("Jupiter", [P("Jupiter", 40), P("Moon", 50)], natal, false)!.tone, "both");
  // The lord's exaltation sign, and a friend's sign, are good at any count.
  const exalt = moonFromDasaLord("Jupiter", [P("Jupiter", 130), P("Moon", 100)], natal, false)!;
  assert.equal(exalt.tone, "good");
  assert.match(exalt.line, /Jupiter's exaltation sign/);
  assert.equal(moonFromDasaLord("Jupiter", [P("Jupiter", 10), P("Moon", 220)], natal, true)!.tone, "good");
  // A node dasa reads the count only.
  assert.equal(moonFromDasaLord("Rahu", [P("Rahu", 10, true), P("Moon", 100)], natal, false)!.tone, "trouble");
  assert.equal(moonFromDasaLord("Rahu", [P("Rahu", 10, true), P("Moon", 70)], natal, false)!.tone, "good");
  assert.match(moonFromDasaLord("Rahu", [P("Rahu", 10, true), P("Moon", 100)], natal, false)!.detail ?? "", /only the count is read/);
  // A Moon dasa reads the sign part only.
  const moonLeo = moonFromDasaLord("Moon", [P("Moon", 130)], natal, false)!;
  assert.equal(moonLeo.tone, "good");
  assert.doesNotMatch(moonLeo.line, /20\.60/);
  assert.equal(moonFromDasaLord("Moon", [P("Moon", 40)], natal, true)!.tone, "good");
  assert.equal(moonFromDasaLord("Moon", [P("Moon", 10)], natal, true)!.tone, "open");
});

test("The periods walked: no Moon dasa, no Moon or node bhuktis, and a hundred years from birth", () => {
  for (const name of ["Barack Obama", "Albert Einstein"]) {
    const { r, spans } = fig(name);
    const birth = Date.parse(r.utc);
    assert.ok(spans.some((s) => s.level === "dasa") && spans.some((s) => s.level === "bhukti"));
    assert.ok(!spans.some((s) => s.level === "dasa" && s.planet === "Moon"));
    assert.ok(!spans.some((s) => s.level === "bhukti" && ["Moon", "Rahu", "Ketu"].includes(s.planet)));
    for (const s of spans) {
      assert.ok(Date.parse(s.start) >= birth && Date.parse(s.end) <= birth + PERIOD_TRANSIT_YEARS * YEAR_MS + 1);
      assert.ok(Date.parse(s.end) > Date.parse(s.start));
    }
    const firstBhukti = spans.findIndex((s) => s.level === "bhukti");
    assert.ok(spans.slice(firstBhukti).every((s) => s.level === "bhukti"), "dasas first, then bhuktis");
    assert.ok(periodTransitsSchema.safeParse(requestOf(spans)).success);
  }
});

test("The sampler: stretches are contiguous, each boundary is a change, and the ephemeris agrees at each midpoint", () => {
  const { spans } = fig("Barack Obama");
  const pick: LordSpan[] = [];
  for (const lord of ["Mercury", "Venus", "Mars", "Jupiter", "Sun"] as Planet[]) {
    const s = spans.find((x) => x.level === "bhukti" && x.planet === lord);
    if (s) pick.push(s);
  }
  for (const lord of ["Saturn", "Rahu"] as Planet[]) {
    const s = spans.find((x) => x.level === "dasa" && x.planet === lord);
    if (s) pick.push(s);
  }
  const pt = decodePeriodTransits(periodTransits(requestOf(pick)));
  const opts = { ayanamsa: "lahiri", nodeType: "mean" as const };
  const jdAt = (ms: number) => julianDay(DateTime.fromMillis(ms, { zone: "utc" }));
  assert.equal(pt.spans.length, pick.length);
  let checked = 0;
  let combustSeen = 0;
  let retroSeen = 0;
  pt.spans.forEach((sp, i) => {
    assert.equal(sp.planet, pick[i].planet);
    assert.equal(sp.segments[0].start, pick[i].start);
    assert.equal(sp.segments[sp.segments.length - 1].end, pick[i].end);
    sp.segments.forEach((g, j) => {
      const a = Date.parse(g.start);
      const b = Date.parse(g.end);
      assert.ok(b > a);
      if (j > 0) {
        const prev = sp.segments[j - 1];
        assert.equal(g.start, prev.end);
        assert.ok(prev.signIndex !== g.signIndex || prev.retro !== g.retro || prev.combust !== g.combust, `${sp.planet} ${g.start}`);
      }
      if (b - a < 6 * 3600e3) return;
      const jd = jdAt((a + b) / 2);
      const p = planetLonAt(sp.planet, jd, opts);
      assert.equal(Math.floor(p.lon / 30) % 12, g.signIndex, `${sp.planet} sign at ${g.start}`);
      if (sp.planet === "Sun" || sp.planet === "Rahu" || sp.planet === "Ketu") {
        assert.equal(g.retro, false);
        assert.equal(g.combust, false);
      } else {
        const retro = p.speed < 0;
        assert.equal(g.retro, retro, `${sp.planet} retrograde at ${g.start}`);
        assert.equal(g.combust, ssCombust({ planet: sp.planet, retrograde: retro, lon: p.lon }, planetLonAt("Sun", jd, opts).lon), `${sp.planet} combust at ${g.start}`);
        if (g.combust) {
          combustSeen++;
          const orb = SS_COMBUST_ORB[sp.planet as CombustPlanet][g.retro ? 1 : 0];
          assert.ok(g.closest !== undefined && g.closest <= orb + 0.05, `${sp.planet} closest ${g.closest} of ${orb}`);
        } else assert.equal(g.closest, undefined);
        if (g.retro) retroSeen++;
      }
      checked++;
    });
  });
  assert.ok(checked > 20 && combustSeen > 0 && retroSeen > 0, `${checked} ${combustSeen} ${retroSeen}`);
  // The Sun: one sign after another, about a month each.
  assert.ok(pt.sun.length > 12);
  pt.sun.forEach((s, j) => {
    if (j === 0) return;
    assert.equal(s.start, pt.sun[j - 1].end);
    assert.equal(s.signIndex, (pt.sun[j - 1].signIndex + 1) % 12);
    const days = (Date.parse(s.end) - Date.parse(s.start)) / 86400e3;
    if (j < pt.sun.length - 1) assert.ok(days > 27 && days < 33, `${days} days`);
  });
});

test("The request: the schema and the limits", () => {
  const one = { planet: "Venus" as const, start: "2000-01-01T00:00:00Z", end: "2001-01-01T00:00:00Z" };
  assert.equal(periodTransitsSchema.safeParse({ spans: [one] }).success, true);
  assert.equal(periodTransitsSchema.safeParse({ spans: [{ ...one, planet: "Moon" }] }).success, false);
  assert.equal(periodTransitsSchema.safeParse({ spans: [] }).success, false);
  assert.equal(periodTransitsSchema.safeParse({ spans: [{ ...one, start: "not a date" }] }).success, false);
  assert.equal(periodTransitsSchema.safeParse({ spans: Array.from({ length: PERIOD_TRANSIT_MAX_SPANS + 1 }, () => one) }).success, false);
  assert.throws(() => periodTransits({ spans: [{ ...one, planet: "Saturn", end: "2022-01-02T00:00:00Z" }] }), /21 years/);
  assert.throws(() => periodTransits({ spans: [{ ...one, start: "2001-01-01T00:00:00Z", end: "2000-01-01T00:00:00Z" }] }), /end after/);
  const twenty = { planet: "Rahu" as const, start: "2000-01-01T00:00:00Z", end: "2020-01-01T00:00:00Z" };
  assert.throws(() => periodTransits({ spans: Array.from({ length: 13 }, () => twenty) }), /250 years/);
  assert.throws(
    () => periodTransits({ spans: [{ ...twenty, start: "1900-01-01T00:00:00Z", end: "1919-01-01T00:00:00Z" }, { ...twenty, start: "2011-01-01T00:00:00Z", end: "2030-01-01T00:00:00Z" }], sun: true }),
    /125 years/,
  );
});

test("The plain view softens: Mantreswara's hardship, loss and trouble stay in the practitioner view", () => {
  const banned = /hardship|\bloss\b|trouble|enemy's|kashta/i;
  let practitionerWords = 0;
  for (const { name } of FIXTURES) {
    const plain = stripsOf(name, true);
    for (const t of [...textsOf(plain.dasa), ...textsOf(plain.bhukti)]) assert.doesNotMatch(t, banned, `${name}: ${t}`);
    const pract = stripsOf(name, false);
    practitionerWords += [...textsOf(pract.dasa), ...textsOf(pract.bhukti)].filter((t) => /hardship|\bloss\b/.test(t)).length;
    // The same pieces and marks in both views, in the same places.
    const shape = (st: Strip) => [st.pieces.map((p) => [p.start, p.end, p.state, p.label]), st.marks.map((m) => [m.start, m.end])];
    assert.deepEqual(shape(plain.dasa), shape(pract.dasa), name);
    assert.deepEqual(shape(plain.bhukti), shape(pract.bhukti), name);
    const { r, par } = fig(name);
    const lord = par.dashas.find((d) => d.current)?.lord;
    if (lord) assert.doesNotMatch(moonFromDasaLord(lord, r.now.positions, r.positions, true)!.line, banned);
  }
  assert.ok(practitionerWords > 0);
});

test("Minors: houses 5, 7 and 10 are drawn blank on the dasa strip and held for later", () => {
  const name = "Sachin Tendulkar";
  const { r } = fig(name);
  const asOf = new Date(Date.parse(r.utc) + 10 * YEAR_MS).toISOString();
  const gated = (p: { short?: string }) => ["5", "7", "10"].includes(p.short ?? "");
  for (const plain of [true, false]) {
    const held = stripsOf(name, plain, asOf).dasa.pieces.filter(gated);
    assert.ok(held.length > 0);
    for (const p of held) {
      assert.equal(p.state, "none");
      assert.match(p.matters ?? "", /held for later, read from age 1[68]\./);
      assert.doesNotMatch(`${p.readout} ${p.title}`, /builds|care|loss/);
    }
    // The same chart read as an adult draws them.
    assert.ok(stripsOf(name, plain).dasa.pieces.filter(gated).every((p) => !/held/.test(p.matters ?? "")));
  }
});

test("The Overview's Running-now card: the Moon line for the living, none at a recorded passing", () => {
  const { r } = fig("Barack Obama");
  for (const plain of [true, false]) {
    const b = briefingFor(r, agreementInput(r, plain));
    const row = b.now.find((x) => x.id === "pa-moon-today");
    assert.ok(row, "the Moon line is in the card");
    assert.equal(row.system, "Parashari");
    assert.equal(row.lean, undefined);
    assert.match(row.line ?? "", /20\.36/);
    if (plain) assert.equal(row.detail, undefined);
    else assert.match(row.detail ?? "", /Wisdomlib's 20\.60/);
    assert.ok(b.now.findIndex((x) => x.id === "pa-moon-today") > b.now.findIndex((x) => x.id === "pa-dasa"));
  }
  const jobs = fig("Steve Jobs").r;
  const atPassing = briefingFor(jobs, agreementInput(jobs, true));
  assert.equal(atPassing.past, true);
  assert.ok(!atPassing.now.some((x) => x.id === "pa-moon-today"));
});

test("Import guard: the module is display only, read by the strips, the endpoint and the briefing", () => {
  const allowed = [
    "client/src/components/parashari-panel.tsx",
    "client/src/lib/timeline-data.ts",
    "server/period-transits.ts",
    "shared/briefing.ts",
  ];
  const root = process.cwd();
  const importers: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && /period-lord-transits["']/.test(readFileSync(full, "utf8"))) importers.push(relative(root, full));
    }
  };
  for (const d of ["shared", "server", "client/src"]) walk(join(root, d));
  assert.deepEqual(importers.sort(), allowed);
  // It reads no verdict, rule or kernel module: positions, combustion distances, house words and the topic gate only.
  const own = readFileSync("shared/period-lord-transits.ts", "utf8");
  const specs = Array.from(own.matchAll(/from "([^"]+)"/g), (m) => m[1]).sort();
  assert.deepEqual(specs, ["./astro", "./combustion", "./house-gloss", "./life-stage"]);
  // The timeline helpers take its types only.
  assert.match(readFileSync("client/src/lib/timeline-data.ts", "utf8"), /import type \{ Strip, StripState \} from "@shared\/period-lord-transits"/);
});
