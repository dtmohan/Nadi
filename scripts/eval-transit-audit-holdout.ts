/** Independent public-case transit comparison. --stdin keeps private inputs out of the repository. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { SIGNS } from "@shared/astro";
import { computeAshtakavarga } from "@shared/ashtakavarga";
import type { ChartEvent } from "@shared/events";
import { computeGochara } from "@shared/gochara";
import { readKinTransits } from "@shared/kin-transits";
import { vimshottariLordsAt } from "@shared/kp";
import { computePrasnaTransits, computePrasnaVedha, computePrasnaVipareetaVedha } from "@shared/rules-prasna";
import { buildSarvarthaContext, computeSarvartha } from "@shared/sarvartha";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import { periodLordMoonHouse, type MoonTransitRow } from "@shared/transit-context";
import { positionsLite, julianDay } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { dasaStartTransits } from "../server/routes";
import { validateEvents } from "../server/validate";
import { comparisonDates, midrank, researchFrame, type ResearchFrame } from "./moon-gochara-research";

type Event = ChartEvent & { clockQuality?: string; sources?: string[] };
type Case = { name: string; category: string; birthSource: string; birthQuality: string; chart: InsertChart; events: Event[] };
const fixturePath = "scripts/fixtures/transit-audit-holdout.json";
const protocol = "docs/transit-audit-holdout-protocol.md";
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const format = (data: unknown) => JSON.stringify(data, null, 2)
  .replace(/\[\n((?:[ \t]+(?:-?\d+|null),?\n)+)[ \t]*\]/g, (_, values: string) => `[${values.trim().replace(/\s+/g, " ")}]`);

function observation(frame: ResearchFrame, event: Event, date = event.date) {
  const dt = eventInstant(date, event, frame.chart.timezone).toUTC(), iso = dt.toISO()!;
  const sky = positionsLite(julianDay(dt), frame.opts);
  const g = computeGochara(frame.moon.signIndex, sky, iso, false, { ownMarks: frame.ownMarks });
  const pick = (planet: "Jupiter" | "Saturn") => {
    const row = g.rows.find((r) => r.planet === planet)!;
    return { house: row.house, favourableByHouse: row.favourable, verdict: row.verdict,
      marks: row.avMarks ?? null, voided: row.voided ?? null, conflictingAspect: row.modifierConflict?.by ?? [] };
  };
  const jupiter = pick("Jupiter"), saturn = pick("Saturn");
  const lord = vimshottariLordsAt(frame.moon.lon, frame.birthIso, iso)[0];
  const periodLord = periodLordMoonHouse(lord, frame.moon.signIndex, sky)!;
  return { date, iso, jupiter, saturn, periodLord,
    full: Number(jupiter.verdict === "favourable") + Number(saturn.verdict === "favourable"),
    house: Number(jupiter.favourableByHouse) + Number(saturn.favourableByHouse),
    lordFlag: periodLord.favourableByHouse === null ? null : Number(periodLord.favourableByHouse) };
}
type Observation = ReturnType<typeof observation>;

function rank(actual: number | null, control: Array<number | null>) {
  if (actual === null) return { midrank: null, controls: 0, ties: 0 };
  const available = control.filter((x): x is number => x !== null);
  if (!available.length) return { midrank: null, controls: 0, ties: 0 };
  return { midrank: midrank(actual, available, (a, b) => a - b), controls: available.length,
    ties: available.filter((x) => x === actual).length };
}

function extraObservations(frame: ResearchFrame, event: Event) {
  const dt = eventInstant(event.date, event, frame.chart.timezone).toUTC(), iso = dt.toISO()!;
  const sky = positionsLite(julianDay(dt), frame.opts);
  const venus = (variant: "22.42" | "22.50") => ({
    vedha: computePrasnaVedha(sky, frame.moon.signIndex, { venusVariant: variant }).filter((v) => v.planet === "Venus"),
    vipareeta: computePrasnaVipareetaVedha(sky, frame.moon.signIndex, { venusVariant: variant }).filter((v) => v.planet === "Venus"),
  });
  const av = computeAshtakavarga(frame.natal, Math.floor(frame.lagna / 30));
  const mars = sky.find((p) => p.planet === "Mars")!;
  const kin = readKinTransits(av, frame.natal, [{ planet: "Mars", signIndex: mars.signIndex, start: iso,
    end: dt.plus({ hours: 1 }).toISO()! }], undefined, iso).rows.Mars[0];
  const saturn = computePrasnaTransits(frame.moon.signIndex, sky).find((r) => r.planet === "Saturn")!;
  return { venus22_42: venus("22.42"), venus22_50: venus("22.50"),
    prasnaSaturn: { house: saturn.house, tone: saturn.tone },
    mars: { sign: SIGNS[mars.signIndex], original: kin.rekhas, reduced: kin.trikona, verdict: kin.verdict } };
}

function checkValidate(chart: InsertChart, event: Event, expected: Observation) {
  const result = validateEvents({ ...chart, events: [event] }).events[0];
  assert.ok(result?.moonTransit, `missing event context for ${chart.name}/${event.id}`);
  assert.deepEqual(result.moonTransit.periodLordFromMoon, expected.periodLord, `period lord parity: ${chart.name}/${event.id}`);
  for (const [name, expectedRow] of [["Jupiter", expected.jupiter], ["Saturn", expected.saturn]] as const) {
    const row: MoonTransitRow = result.moonTransit.rows.find((r: MoonTransitRow) => r.planet === name)!;
    assert.deepEqual([row.moonHouse, row.favourableByHouse, row.verdict],
      [expectedRow.house, expectedRow.favourableByHouse, expectedRow.verdict], `${name} parity: ${chart.name}/${event.id}`);
  }
}

function evaluateEvent(chart: InsertChart, frame: ResearchFrame, event: Event, key: string, checkPaths: boolean) {
  const actual = observation(frame, event), dates = comparisonDates(chart, event, key);
  const controls = dates.map((d) => observation(frame, event, d.date));
  if (checkPaths) {
    checkValidate(chart, event, actual);
    checkValidate(chart, { ...event, date: dates[0].date }, controls[0]);
  }
  const uncertainClock = !event.clockQuality || /unknown|not independently|reported by Astro-Databank/i.test(event.clockQuality);
  const clockSensitivity = uncertainClock ? ["00:00", "06:00", "12:00", "18:00"].map((time) => {
    const o = observation(frame, { ...event, time });
    return { time, full: o.full, house: o.house, lordFlag: o.lordFlag, lord: o.periodLord.lord };
  }) : [];
  return { id: event.id, matter: event.matter, date: event.date, clockQuality: event.clockQuality, sources: event.sources,
    actual, additional: extraObservations(frame, event), clockSensitivity,
    ranks: { full: rank(actual.full, controls.map((o) => o.full)), house: rank(actual.house, controls.map((o) => o.house)),
      lord: rank(actual.lordFlag, controls.map((o) => o.lordFlag)) },
    controls: controls.map((o, i) => [dates[i].offset, o.full, o.house, o.lordFlag]) };
}

type EvaluatedEvent = ReturnType<typeof evaluateEvent>;
function summary(cases: { events: EvaluatedEvent[] }[]) {
  const fields = ["full", "house", "lord"] as const, all = cases.flatMap((c) => c.events);
  const values = (events: EvaluatedEvent[], field: typeof fields[number]) => events.map((e) => e.ranks[field].midrank).filter((v): v is number => v !== null);
  return { people: cases.length, events: all.length,
    eventWeightedMeanMidrank: Object.fromEntries(fields.map((f) => [f, mean(values(all, f))])),
    personWeightedMeanMidrank: Object.fromEntries(fields.map((f) => [f, mean(cases.map((c) => mean(values(c.events, f))).filter((v): v is number => v !== null))])),
    gradedEvents: Object.fromEntries(fields.map((f) => [f, values(all, f).length])),
    tiedControls: Object.fromEntries(fields.map((f) => [f, all.reduce((n, e) => n + e.ranks[f].ties, 0)])),
    sensitivity: { eventsChecked: all.filter((e) => e.clockSensitivity.length).length,
      fullChanges: all.filter((e) => new Set(e.clockSensitivity.map((x) => x.full)).size > 1).length,
      lordFlagChanges: all.filter((e) => new Set(e.clockSensitivity.map((x) => x.lordFlag)).size > 1).length } };
}

if (process.argv.includes("--stdin")) {
  const input = JSON.parse(readFileSync(0, "utf8")) as { chart: InsertChart; events: Event[]; candidateTimes: string[] };
  const cases = input.candidateTimes.map((time) => {
    const chart = insertChartSchema.parse({ ...input.chart, birthTime: time }), frame = researchFrame(chart);
    const events = input.events.map((e) => evaluateEvent(chart, frame, e, `private/${e.id}`, false));
    return { time, ascendant: SIGNS[Math.floor(frame.lagna / 30)], ascendantLongitude: frame.lagna,
      natalMoon: SIGNS[frame.moon.signIndex], moonLongitude: frame.moon.lon, summary: summary([{ events }]),
      events: events.map(({ controls, ...rest }) => rest) };
  });
  process.stdout.write(JSON.stringify({ protocol, cases }, null, 2) + "\n");
} else {
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { cases: Case[] };
  const oldNames = new Set<string>();
  for (const file of readdirSync("scripts/fixtures").filter((p) => p.endsWith(".json") && `scripts/fixtures/${p}` !== fixturePath)) {
    const j = JSON.parse(readFileSync(`scripts/fixtures/${file}`, "utf8"));
    const list = Array.isArray(j) ? j : j.cases ?? j.charts ?? [];
    if (Array.isArray(list)) for (const item of list) {
      const name = item?.name ?? item?.chart?.name ?? item?.chartName;
      if (name) oldNames.add(String(name).toLowerCase());
    }
  }
  const cases = fixture.cases.map((item) => {
    if (oldNames.has(item.name.toLowerCase())) throw new Error(`Previously used public case: ${item.name}`);
    process.stderr.write(`Evaluating ${item.name}\n`);
    const chart = insertChartSchema.parse(item.chart), frame = researchFrame(chart);
    const events = item.events.map((e) => evaluateEvent(chart, frame, e, `${item.name}/${e.id}`, true));
    const firstStart = dasaStartTransits(frame.moon.lon, frame.birthIso, frame.opts)[0];
    const atBirth = frame.natal.find((p) => p.planet === firstStart.lord)!;
    const findings = computeSarvartha(frame.natal, frame.lagna).findings.filter((f) => f.house === 2);
    const sc36 = findings.some((f) => f.stanza === 36);
    const sc40 = findings.some((f) => f.stanza === 40);
    const sc41 = findings.some((f) => f.stanza === 41);
    if (sc36 || sc40 || sc41) {
      const c = buildSarvarthaContext(frame.natal, frame.lagna);
      if (sc36) assert.ok((c.houseHas(2, "Mars") && c.houseHas(2, "Moon") && c.houseAspected(2, "Mercury")) || c.isKendra(c.houseOf("Mercury")));
      if (sc40) {
        assert.ok(c.lordAspected(2, "Sun") && c.lordAspected(2, "Mars"));
        assert.ok(c.lordDignity(2) === "Exalted" || c.lordMoolatrikona(2));
      }
      if (sc41) assert.ok(c.lordOf(2) === "Jupiter" && c.strong("Jupiter") && c.lordAspected(2, "Sun") && c.lordAspected(2, "Venus"));
    }
    return { name: item.name, category: item.category, birthSource: item.birthSource, birthQuality: item.birthQuality,
      ascendant: SIGNS[Math.floor(frame.lagna / 30)], natalMoon: SIGNS[frame.moon.signIndex],
      sarvartha336Fired: sc36, sarvartha340Fired: sc40, sarvartha341Fired: sc41,
      firstPeriodStart: { lord: firstStart.lord, actualStart: firstStart.actualStart,
        signAtStart: SIGNS[firstStart.signIndex], signAtBirth: SIGNS[atBirth.signIndex] }, events };
  });
  const files = [protocol, fixturePath, "scripts/eval-transit-audit-holdout.ts", "scripts/moon-gochara-research.ts", "shared/gochara.ts",
    "shared/rules-prasna.ts", "shared/transit-context.ts", "shared/kin-transits.ts", "shared/sarvartha.ts", "server/routes.ts"];
  process.stdout.write(format({ protocol, sha256: Object.fromEntries(files.map((f) => [f, sha(f)])), summary: summary(cases), cases }) + "\n");
}
