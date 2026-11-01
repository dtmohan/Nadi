/** Frozen public-case audit: node --import tsx scripts/eval-reading-parity.ts */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DateTime } from "luxon";
import { matterOf, type ChartEvent } from "@shared/events";
import { conditionalObservations } from "@shared/parashari-conditional";
import { kpNatalConditions, parashariNatalConditions } from "@shared/natal-reading-evidence";
import { KP_EVENT_FIELDS } from "@shared/reading-rule-catalog";
import { insertChartSchema, type InsertChart } from "@shared/schema";
import type { EventValidation } from "@shared/validate-types";
import { computeChart } from "../server/routes";
import { rectify } from "../server/rectify";
import { topicReading } from "../server/topic-reading";
import { validateEvents } from "../server/validate";

type CaseEvent = ChartEvent & { sources: string[]; alternateTimes?: string[] };
type Case = { name: string; category: string; birthSource: string; birthQuality: string;
  chart: InsertChart; alternateBirthTimes?: string[]; events: CaseEvent[] };
const protocol = "docs/reading-parity-fresh-protocol.md";
const fixturePath = "scripts/fixtures/reading-parity-fresh.json";
const cases = (JSON.parse(readFileSync(fixturePath, "utf8")) as { cases: Case[] }).cases;
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const oldNames = new Set<string>();
for (const file of readdirSync("scripts/fixtures").filter((p) => p.endsWith(".json") && `scripts/fixtures/${p}` !== fixturePath)) {
  const data = JSON.parse(readFileSync(`scripts/fixtures/${file}`, "utf8"));
  const list = Array.isArray(data) ? data : data.cases ?? data.charts ?? [];
  if (Array.isArray(list)) for (const row of list) {
    const name = row?.name ?? row?.chart?.name ?? row?.chartName;
    if (name) oldNames.add(norm(name));
  }
}

const asOf = "2026-11-01T12:00:00Z";
function compact(v: EventValidation) {
  return { kp: v.kp.score, kpTransit: v.kp.transit.score, strict: v.kp.aurora?.allSupported ?? null,
    mixed: v.kp.auroraV2?.allSupported ?? null,
    v1: v.parashariPromise?.score ?? null, v2: v.parashariSpecific?.score ?? null, v3: v.parashariDivisional?.score ?? null,
    conditional: conditionalObservations(v.manley, v.outcome) ?? null };
}
function checkNatal(chart: ReturnType<typeof computeChart>, event: CaseEvent, v: EventValidation) {
  const kp = kpNatalConditions(chart).find((x) => x.matter === event.matter)!;
  assert.ok(kp, `${event.id} natal KP matter`);
  assert.deepEqual([kp.basic.cuspSubLord, kp.basic.signified, kp.basic.matched, kp.basic.deniedAtCusp],
    [v.kp.cuspSubLord, v.kp.cuspSignified, v.kp.promised, v.kp.deniedAtCusp], `${event.id} cusp`);
  if (kp.strict) assert.deepEqual(kp.strict.layers, v.kp.aurora!.layers.filter((l) => l.role.startsWith("Cusp ")));
  if (kp.mixed) assert.deepEqual(kp.mixed.layers, v.kp.auroraV2!.layers.filter((l) => l.role.startsWith("Cusp ")));
  const para = parashariNatalConditions(chart).find((x) => x.matter === event.matter);
  if (!para || !v.manley) throw new Error(`${event.id} has no mapped natal Parashari frame`);
  for (const period of [...v.manley.periods, v.manley.antara!])
    assert.deepEqual(para.planets.find((p) => p.planet === period.planet)?.frames, period.frames, `${event.id} ${period.level}`);
  if (v.parashariPromise && para.support) for (const key of ["d1Support", "d1Strain", "divisionSupport", "divisionStrain"] as const)
    assert.deepEqual(para.support[key], v.parashariPromise[key], `${event.id} ${key}`);
  if (v.parashariHierarchy && para.foundation) {
    assert.deepEqual(para.foundation.d1, v.parashariHierarchy.d1);
    assert.deepEqual(para.foundation.divisionCheck, v.parashariHierarchy.divisionCheck);
    assert.deepEqual(para.foundation.planets, v.parashariHierarchy.crossChart?.planets);
  }
}
function checkRectify(chart: InsertChart, event: CaseEvent) {
  const m = matterOf(event.matter);
  const scan = rectify({ chart, windowMinutes: 1, events: [{ ...event, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }] });
  const s = scan.segments.find((x) => x.given && x.selectable);
  if (!s) throw new Error(`${chart.name}: no selectable recorded midpoint`);
  const candidate = { ...chart, birthDate: s.midDate ?? chart.birthDate, birthTime: s.mid };
  const v = topicReading(candidate, event, asOf), r = s.events[0];
  for (const key of Object.keys(KP_EVENT_FIELDS) as Array<keyof typeof KP_EVENT_FIELDS>) {
    if (key === "transit") { const { evidence: _unused, ...common } = v.kp.transit; assert.deepEqual(r.transit, common, `${chart.name} ${key}`); }
    else assert.deepEqual(r[key], v.kp[key], `${chart.name} ${key}`);
  }
  assert.deepEqual([s.parashariVargas?.[0], s.manley?.[0], s.parashariPromise?.[0], s.parashariSpecific?.[0],
    s.parashariDivisional?.[0], s.parashariHierarchy?.[0]],
  [v.parashariVargas, v.manley, v.parashariPromise, v.parashariSpecific, v.parashariDivisional, v.parashariHierarchy], chart.name);
  return { date: s.midDate ?? chart.birthDate, time: s.mid, event: event.id, allRegisteredKpFieldsEqual: true,
    completeParashariEvidenceEqual: true };
}

const results = cases.map((c, index) => {
  if (oldNames.has(norm(c.name))) throw new Error(`Previously used case: ${c.name}`);
  process.stderr.write(`Checking ${c.name}\n`);
  const chart = insertChartSchema.parse(c.chart);
  const natal = computeChart({ ...chart, id: index + 1, gender: chart.gender ?? "unspecified",
    timeStandard: chart.timeStandard ?? "auto", ayanamsa: chart.ayanamsa ?? "lahiri", nodeType: chart.nodeType ?? "mean",
    sunriseDef: chart.sunriseDef ?? "edge", parashariHouseMethod: chart.parashariHouseMethod ?? "rashi",
    notes: chart.notes ?? "", deathDate: chart.deathDate ?? null, timeUncertaintyMin: chart.timeUncertaintyMin ?? 0, events: chart.events ?? [] });
  natal.now.asOf = asOf;
  const events = c.events.map((e) => {
    const actual = topicReading(chart, e, asOf);
    assert.deepEqual(actual, validateEvents({ ...chart, events: [e] }).events[0], `${e.id} dated/Validate`);
    checkNatal(natal, e, actual);
    const controls = [-180, -120, -60, 60, 120, 180].map((offsetDays) => {
      const date = DateTime.fromISO(e.date, { zone: "utc" }).plus({ days: offsetDays }).toISODate()!;
      return { offsetDays, date, ...compact(topicReading(chart, { ...e, date }, asOf)) };
    });
    const alternateTimes = (e.alternateTimes ?? []).map((time) => ({ time, ...compact(topicReading(chart, { ...e, time }, asOf)) }));
    return { id: e.id, matter: e.matter, date: e.date, localTime: e.time ?? "12:00 assumed", timezone: e.timezone,
      sources: e.sources, natalAndDatedEqual: true, datedAndValidateEqual: true, actual: compact(actual), controls, alternateTimes };
  });
  const alternateBirths = (c.alternateBirthTimes ?? []).map((birthTime) => ({ birthTime,
    events: c.events.map((e) => ({ id: e.id, ...compact(topicReading({ ...chart, birthTime }, e, asOf)) })) }));
  return { name: c.name, category: c.category, birthSource: c.birthSource, birthQuality: c.birthQuality,
    reportedBirth: `${chart.birthDate} ${chart.birthTime} ${chart.timezone}`, events,
    midpoint: checkRectify(chart, c.events[0]), alternateBirths };
});
const hashed = [protocol, fixturePath, "scripts/eval-reading-parity.ts", "shared/reading-rule-catalog.ts", "shared/events.ts",
  "shared/kp.ts", "shared/kp-event-evidence.ts", "shared/kp-aurora.ts", "shared/kp-aurora-v2.ts", "shared/natal-reading-evidence.ts",
  "shared/manley-evidence.ts", "shared/parashari-promise.ts", "shared/parashari-specific.ts", "shared/parashari-divisional.ts",
  "shared/parashari-hierarchy.ts", "shared/parashari-functional.ts", "shared/parashari-conditional.ts",
  "server/topic-reading.ts", "server/validate.ts", "server/rectify.ts", "server/parashari-event.ts", "server/ephemeris.ts", "server/event-time.ts"];
process.stdout.write(JSON.stringify({ protocol, hashes: Object.fromEntries(hashed.map((p) => [p, sha(p)])),
  caveat: "These are convenience cases, not an accuracy study. Birth and event clocks are uncertain; fixed-offset dates are not verified non-events.", results }, null, 2) + "\n");
