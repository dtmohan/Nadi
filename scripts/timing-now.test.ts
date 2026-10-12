/**
 * "Now and next" for the Parashari Timing chapter (shared/timing-now.ts), the plain period gloss
 * (DashaGloss.plain) and the 50.88 rising kind carried beside the 47.3-4 drekkana timing.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";

import type { Chart } from "@shared/schema";
import { computeParashari, type ParashariFinding } from "@shared/parashari";
import { HOUSE_AREAS_PLAIN } from "@shared/parashari-houses";
import { sensitiveTags } from "@shared/life-stage";
import { isSensitive } from "@shared/gentle";
import type { DasaReading } from "@shared/parashari-dasa";
import type { AvTimeline, AvTransitRow } from "@shared/av-transit";
import type { SudarshanaResult } from "@shared/sudarshana";
import { PERIOD_TIED_FINDINGS, levelName, runningCombinations, timingNow } from "@shared/timing-now";
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

const AS_OF = "2026-10-11T12:00:00.000Z";
const iso = (s: string) => DateTime.fromISO(s, { zone: "utc" }).toISO()!;

/** A minimal running dasa: Rahu, within it Mars, within that Venus then Sun. */
function readings(): DasaReading[] {
  const antar = (lord: string, start: string, end: string, current: boolean, extra: object = {}) => ({
    lord, start: iso(start), end: iso(end), ageStart: 0, ageEnd: 0, current, past: false,
    entry: { ch: 52, verses: "1", text: "" }, facts: { favourable: [], adverse: [], maraka: undefined },
    verdict: "mixed", source: { label: "Parashara 52.1", url: "" }, ...extra,
  });
  const dasa = (lord: string, start: string, end: string, current: boolean, verdict: string, antars: object[]) => ({
    lord, start: iso(start), end: iso(end), ageStart: 0, ageEnd: 0, current, verdict,
    timing: { third: 1, reversed: false, text: "", source: { label: "Parashara 47.3-4", url: "" }, rising: "head" },
    notes: [], antars,
  });
  return [
    dasa("Rahu", "2009-01-01", "2027-01-16", true, "mixed", [
      antar("Jupiter", "2011-09-01", "2014-01-01", false),
      antar("Mars", "2025-12-01", "2027-01-16", true, {
        verdict: "support",
        pratyantars: [
          { lord: "Venus", start: iso("2026-09-25"), end: iso("2026-11-28"), current: true, text: "", source: { label: "Parashara 61.2", url: "" } },
          { lord: "Sun", start: iso("2026-11-28"), end: iso("2026-12-17"), current: false, text: "", source: { label: "Parashara 61.2", url: "" } },
        ],
      }),
    ]),
    dasa("Jupiter", "2027-01-16", "2043-01-16", false, "strain", []),
  ] as unknown as DasaReading[];
}

const row = (planet: "Saturn" | "Jupiter", sign: number, house: number, start: string, end: string, current: boolean, tone: "support" | "mixed" | "strain", sarva: number): AvTransitRow =>
  ({ planet, signIndex: sign, house, start: iso(start), end: iso(end), retrogradeEntry: false, age: 0, current, ownRekhas: 4, givers: [], ownVerdict: "even", sarva, band: "medium", hits: [], tone, notes: [] });

const AV = {
  saturn: [row("Saturn", 11, 11, "2025-03-29", "2027-06-03", true, "mixed", 24), row("Saturn", 0, 12, "2027-06-03", "2027-10-20", false, "strain", 19)],
  jupiter: [row("Jupiter", 3, 3, "2026-06-02", "2026-10-31", true, "mixed", 30), row("Jupiter", 4, 4, "2026-10-31", "2027-01-25", false, "support", 31), row("Jupiter", 3, 3, "2027-01-25", "2027-06-26", false, "mixed", 30)],
  saturnNakshatras: [], hasNakshatras: false, distressYears: [], sources: {}, caveats: [],
} as unknown as AvTimeline;

const SUD = {
  applicable: true,
  currentYear: { age: 41, house: 6, start: iso("2026-03-15"), end: iso("2027-03-15"), current: true, verdict: "mixed", plus: 8, minus: 6 },
  years: [
    { age: 41, house: 6, start: iso("2026-03-15"), end: iso("2027-03-15"), current: true, verdict: "mixed", plus: 8, minus: 6 },
    { age: 42, house: 7, start: iso("2027-03-15"), end: iso("2028-03-15"), current: false, verdict: "favourable", plus: 9, minus: 3 },
  ],
} as unknown as SudarshanaResult;

test("timing-now: the running levels, this year and the slow planets now", () => {
  const t = timingNow({ dasaReadings: readings(), dashas: [], sudarshana: SUD, av: AV, asOfIso: AS_OF });
  assert.equal(t.dasa?.lord, "Rahu");
  assert.equal(t.dasa?.tone, "mixed");
  assert.equal(t.antar?.lord, "Mars");
  assert.equal(t.antar?.tone, "favourable");
  assert.equal(t.pratyantar?.lord, "Venus");
  assert.equal(t.pratyantar?.tone, undefined, "spells carry no verdict");
  assert.equal(t.year?.house, 6);
  assert.equal(t.saturn?.points, 24);
  assert.equal(t.jupiter?.house, 3);
});

test("timing-now: changes within eighteen months, earliest first, one sign change per slow planet", () => {
  const t = timingNow({ dasaReadings: readings(), dashas: [], sudarshana: SUD, av: AV, asOfIso: AS_OF });
  const kinds = t.next.map((c) => `${c.kind}:${c.lord ?? c.transit?.planet ?? c.house}`);
  assert.deepEqual(kinds, [
    "transit:Jupiter", // 31 Oct 2026, Leo
    "spell:Sun", // 28 Nov 2026
    "period:Jupiter", // 16 Jan 2027; the first sub-period of the new period is not listed apart
    "year:7", // 15 Mar 2027
    "transit:Saturn", // 3 Jun 2027, Aries
  ]);
  const dates = t.next.map((c) => DateTime.fromISO(c.date).toMillis());
  assert.deepEqual(dates, [...dates].sort((a, b) => a - b));
  const horizon = DateTime.fromISO(AS_OF).plus({ months: 18 }).toMillis();
  assert.ok(dates.every((d) => d > DateTime.fromISO(AS_OF).toMillis() && d <= horizon));
  const period = t.next.find((c) => c.kind === "period")!;
  assert.equal(period.years, 16);
  assert.equal(period.tone, "unfavourable");
  // A pratyantar change names the antar it falls within.
  const spell = t.next.find((c) => c.kind === "spell")!;
  assert.equal(spell.parent, t.antar?.lord);
});

test("timing-now: every level is named, with a plain gloss in the plain reading", () => {
  assert.equal(levelName("dasa", false), "dasa");
  assert.equal(levelName("antar", false), "antar");
  assert.equal(levelName("pratyantar", false), "pratyantar");
  assert.equal(levelName("dasa", true), "dasa (main period)");
  assert.equal(levelName("antar", true), "antar (sub-period)");
  assert.equal(levelName("pratyantar", true), "pratyantar (third-level period)");
});

test("timing-now: a shorter horizon drops the later changes", () => {
  const t = timingNow({ dasaReadings: readings(), dashas: [], sudarshana: SUD, av: AV, asOfIso: AS_OF, horizonMonths: 2 });
  assert.deepEqual(t.next.map((c) => c.kind), ["transit", "spell"]);
});

test("timing-now: after a recorded death the state is read at that date and nothing is listed ahead", () => {
  const t = timingNow({ dasaReadings: readings(), dashas: [], sudarshana: SUD, av: AV, asOfIso: AS_OF, past: true });
  assert.equal(t.dasa?.lord, "Rahu");
  assert.equal(t.next.length, 0);
});

test("timing-now: the year wheel is left out where the chakra does not apply (74.19-20)", () => {
  const t = timingNow({ dasaReadings: readings(), dashas: [], sudarshana: { ...SUD, applicable: false }, av: AV, asOfIso: AS_OF });
  assert.equal(t.year, undefined);
  assert.ok(!t.next.some((c) => c.kind === "year"));
});

test("timing-now: combinations of the running lords; only 41.16-17 is tied to the periods", () => {
  const f = (id: string, kind: ParashariFinding["kind"], planets: string[]): ParashariFinding =>
    ({ id, kind, title: id, text: "", tone: "support", planets, source: { label: "Parashara 41.16-17", url: "" } }) as unknown as ParashariFinding;
  const findings = [
    f("pa-wealth-5-9", "yoga", ["Mars", "Saturn"]),
    f("pa-raja-x", "yoga", ["Mars", "Jupiter"]),
    f("pa-strain-y", "strain", ["Rahu"]),
    f("pa-lord-1-5", "lord", ["Mars"]),
    f("pa-house-1", "house", ["Mars"]),
    f("pa-other", "yoga", ["Venus"]),
    f("pa-nabhasa-paasa", "strain", ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]),
  ];
  const c = runningCombinations(findings, ["Rahu", "Mars", "Mars"]);
  assert.deepEqual(c.map((x) => x.finding.id), ["pa-wealth-5-9", "pa-raja-x", "pa-strain-y"]);
  assert.deepEqual(c.map((x) => x.sourced), [true, false, false]);
  assert.deepEqual(c[0].lords, ["Mars"]);
  assert.ok(PERIOD_TIED_FINDINGS.has("pa-wealth-5-9"));
});

test("timing-now: the plain house areas are short and free of the gated and softened matters", () => {
  assert.deepEqual(Object.keys(HOUSE_AREAS_PLAIN).map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  for (const [h, text] of Object.entries(HOUSE_AREAS_PLAIN)) {
    assert.deepEqual(sensitiveTags(text), [], `house ${h}: ${text}`);
    assert.ok(!isSensitive(text), `house ${h}: ${text}`);
  }
});

test("timing-now: a real chart carries the plain gloss, the rising kind, and a consistent now", () => {
  const result = computeChart(SYNTHETIC);
  const r = computeParashari(result.positions, result.jaimini.lagna.lon, result.utc, AS_OF, result.shadbala, result.dasaStarts);
  for (const d of r.dashas) {
    assert.ok(d.plain.length > 0, d.lord);
    if (d.owns.length) assert.match(d.plain, /^Rules the /, d.lord);
    else assert.match(d.plain, /^In the \d+(st|nd|rd|th), giving the results of its sign lord /, d.lord);
  }
  for (const d of r.dasaReadings) {
    assert.ok(["head", "hind", "both"].includes(d.timing.rising), d.lord);
    const n88 = d.notes.find((n) => n.id === `${d.lord}-50-88`);
    assert.ok(n88, `${d.lord}: the 50.88 note`);
    const word = d.timing.rising === "head" ? "commencement" : d.timing.rising === "hind" ? "end" : "middle";
    assert.ok(n88.text.includes(word), `${d.lord}: ${n88.text}`);
  }
  const t = timingNow({ dasaReadings: r.dasaReadings, dashas: r.dashas, asOfIso: AS_OF });
  const cur = r.dasaReadings.find((d) => d.current)!;
  assert.equal(t.dasa?.lord, cur.lord);
  assert.equal(t.antar?.lord, cur.antars.find((a) => a.current)?.lord);
  assert.ok(t.pratyantar, "the running sub-period carries its spells");
  for (const c of t.next) if (c.kind === "period") assert.equal(c.gloss?.lord, c.lord);
});
