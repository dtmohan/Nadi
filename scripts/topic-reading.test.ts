import assert from "node:assert/strict";
import test from "node:test";
import { Writable } from "node:stream";
import { finished } from "node:stream/promises";
import { KP_TIMING_TOPICS, matterOf, type ChartEvent } from "@shared/events";
import { natalEventEvidence, eventReadingAllowed } from "@shared/event-reading";
import { buildReport } from "@shared/report";
import { rectify } from "../server/rectify";
import { computeChart, registerRoutes } from "../server/routes";
import { topicReading } from "../server/topic-reading";
import { validateEvents } from "../server/validate";
import { ascendantAt, birthInstant, julianDay, positionsAt, positionsLite } from "../server/ephemeris";
import { eventInstant } from "../server/event-time";
import { computeGochara, natalOwnMarks } from "@shared/gochara";
import { taraOf } from "@shared/tara";

const chart = {
  name: "Synthetic chart", birthDate: "1990-01-01", birthTime: "12:00",
  timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru",
  latitude: 12.9716, longitude: 77.5946, ayanamsa: "raman", nodeType: "true",
} as Parameters<typeof rectify>[0]["chart"];
const event: ChartEvent = {
  id: "synthetic-marriage", matter: "marriage", date: "2013-03-11", time: "11:15", timezone: "America/New_York",
};
const asOf = "2026-10-31T12:00:00Z";

test("a chosen date uses the identical event conditions as Validate", () => {
  const seen = topicReading(chart, event, asOf);
  const validated = validateEvents({ ...chart, events: [event] }).events[0];
  assert.deepEqual(seen, validated);
  assert.ok(seen.parashariSpecific);
  assert.ok(seen.manley?.antara);
  assert.equal(seen.kp.transit.evidence?.length, 9);
  assert.equal(seen.timezone, event.timezone);
  assert.equal(seen.moonTransit?.asOf, "2013-03-11T15:15:00.000Z");
  const mixed = { ...event, outcome: "mixed" as const };
  const mixedReading = topicReading(chart, mixed, asOf);
  assert.deepEqual(mixedReading, validateEvents({ ...chart, events: [mixed] }).events[0]);
  assert.equal(mixedReading.parashariSpecific, undefined);
  assert.ok(mixedReading.manley, "the descriptive staged clues remain separate from outcome-based scoring");

  const m = matterOf(event.matter);
  const scan = rectify({ chart, windowMinutes: 1, events: [{ label: m.label, matter: m.id,
    date: event.date, time: event.time, timezone: event.timezone, houses: m.houses, cusp: m.cusp, area: m.area }] });
  const segment = scan.segments.find((s) => s.given && s.selectable)!;
  const midpoint = topicReading({ ...chart, birthDate: segment.midDate ?? chart.birthDate, birthTime: segment.mid }, event, asOf);
  assert.deepEqual(segment.parashariVargas?.[0], midpoint.parashariVargas);
  assert.deepEqual(segment.parashariSpecific?.[0], midpoint.parashariSpecific);
  assert.deepEqual(segment.parashariDivisional?.[0], midpoint.parashariDivisional);
  assert.deepEqual(segment.manley?.[0], midpoint.manley);
  assert.equal(segment.events[0].transit.score, midpoint.kp.transit.score);
  assert.equal(segment.events[0].jaimini?.score, midpoint.jaimini?.score);
});

test("event-time gochara matches the main gochara engine and changes the tara at a same-day crossing", () => {
  const early = { ...event, time: "00:00" }, late = { ...event, time: "12:00" };
  const a = topicReading(chart, early, asOf).moonTransit!, b = topicReading(chart, late, asOf).moonTransit!;
  assert.notEqual(a.transitMoonStar, b.transitMoonStar);
  assert.notEqual(a.tara.name, b.tara.name);
  assert.deepEqual(b.tara, taraOf(b.birthStar, b.transitMoonStar));
  const opts = { ayanamsa: "raman", nodeType: "true" as const }, birth = julianDay(birthInstant(chart).utc);
  const natal = positionsAt(birth, opts), lagna = ascendantAt(birth, chart.latitude, chart.longitude, opts);
  const moon = natal.find((p) => p.planet === "Moon")!;
  const moment = eventInstant(late.date, late, chart.timezone).toUTC();
  const sky = positionsLite(julianDay(moment), opts);
  const direct = computeGochara(moon.signIndex, sky, moment.toISO()!, true, { ownMarks: natalOwnMarks(natal, lagna) });
  assert.equal(b.asOf, moment.toISO());
  assert.deepEqual(b.rows.map((r) => [r.planet, r.moonHouse, r.favourableByHouse, r.verdict, r.vedhaBy, r.avOverride, r.aspectBy]),
    direct.rows.map((r) => [r.planet, r.house, r.favourable, r.verdict, r.vedhaBy, !!r.avNote, r.aspectNote?.by ?? []]));
});

test("the first random comparison set uses the same event-time context as a direct replay", () => {
  const job = { id: "synthetic-job", matter: "job", date: "2016-09-07", time: "10:30", timezone: "America/Los_Angeles" };
  const result = validateEvents({ ...chart, events: [event, job] });
  assert.ok(result.baseline?.example?.length === 2);
  for (const example of result.baseline!.example!) {
    const original = [event, job].find((e) => matterOf(e.matter).label === example.label)!;
    assert.ok(original);
    const replay = topicReading(chart, { ...original, date: example.date }, asOf);
    assert.deepEqual(example.moonTransit, replay.moonTransit);
  }
});

test("the chart-reading API runs the shared check and rejects an invalid matter", async () => {
  const handlers = new Map<string, (req: any, res: any) => void>();
  const app = { post: (path: string, fn: (req: any, res: any) => void) => { handlers.set(path, fn); }, get: () => {} };
  await registerRoutes({} as Parameters<typeof registerRoutes>[0], app as unknown as Parameters<typeof registerRoutes>[1]);
  const handler = handlers.get("/api/topic-reading")!;
  const call = (body: unknown) => {
    const result: { status: number; body?: any } = { status: 200 };
    const res = { status: (status: number) => { result.status = status; return res; }, json: (value: unknown) => { result.body = value; return res; } };
    handler({ body }, res);
    return result;
  };
  const good = call({ chart, event });
  assert.equal(good.status, 200);
  assert.deepEqual(good.body, topicReading(chart, event));
  const bad = call({ chart, event: { ...event, matter: "unknown" } });
  assert.equal(bad.status, 400);
});

test("a chart-tab PDF accepts and renders a selected matter and date", async () => {
  const handlers = new Map<string, (req: any, res: any) => void>();
  const app = { post: (path: string, fn: (req: any, res: any) => void) => { handlers.set(path, fn); }, get: () => {} };
  await registerRoutes({} as Parameters<typeof registerRoutes>[0], app as unknown as Parameters<typeof registerRoutes>[1]);
  const chunks: Buffer[] = [];
  const response = new Writable({ write(chunk, _encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); } }) as Writable & {
    setHeader: (name: string, value: string) => void; status: (code: number) => typeof response; json: (value: unknown) => typeof response;
  };
  const headers: Record<string, string> = {};
  response.setHeader = (name, value) => { headers[name.toLowerCase()] = value; };
  response.status = (code) => { throw new Error(`Unexpected HTTP ${code}`); };
  response.json = (value) => { throw new Error(`Unexpected JSON ${JSON.stringify(value)}`); };
  await handlers.get("/api/report.pdf")!({ body: { ...chart, plain: false, modules: ["parashari"],
    tools: { topicReadings: { parashari: event } } } }, response);
  await finished(response);
  assert.equal(headers["content-type"], "application/pdf");
  assert.equal(Buffer.concat(chunks).subarray(0, 4).toString(), "%PDF");
});

test("a report PDF accepts a selected ALP day and the Prasna natal module", async () => {
  const handlers = new Map<string, (req: any, res: any) => void>();
  const app = { post: (path: string, fn: (req: any, res: any) => void) => { handlers.set(path, fn); }, get: () => {} };
  await registerRoutes({} as Parameters<typeof registerRoutes>[0], app as unknown as Parameters<typeof registerRoutes>[1]);
  const chunks: Buffer[] = [];
  const response = new Writable({ write(chunk, _encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); } }) as Writable & {
    setHeader: (name: string, value: string) => void; status: (code: number) => typeof response; json: (value: unknown) => typeof response;
  };
  const headers: Record<string, string> = {};
  response.setHeader = (name, value) => { headers[name.toLowerCase()] = value; };
  response.status = (code) => { throw new Error(`Unexpected HTTP ${code}`); };
  response.json = (value) => { throw new Error(`Unexpected JSON ${JSON.stringify(value)}`); };
  await handlers.get("/api/report.pdf")!({ body: { ...chart, plain: true, modules: ["alp", "prasna"], tools: { alpAsOf: "2006-07-04" } } }, response);
  await finished(response);
  assert.equal(headers["content-type"], "application/pdf");
  assert.equal(Buffer.concat(chunks).subarray(0, 4).toString(), "%PDF");
});

test("KP chart topics use the saved-event house and cusp definitions", () => {
  for (const topic of KP_TIMING_TOPICS) if (topic.matter) {
    const m = matterOf(topic.matter);
    assert.deepEqual(topic.houses, m.houses, topic.id);
    assert.equal(topic.cusp, m.cusp, topic.id);
  }
  assert.equal(KP_TIMING_TOPICS.find((t) => t.id === "children")?.matter, "child");
  assert.equal(KP_TIMING_TOPICS.find((t) => t.id === "foreign")?.matter, "abroad");
  assert.equal(KP_TIMING_TOPICS.find((t) => t.id === "recovery")?.matter, undefined);
});

test("natal foundations match the event evaluator before periods and transit are added", () => {
  const fullChart = { ...chart, id: 91, gender: "male", timeStandard: "auto", ayanamsa: "raman", nodeType: "true",
    sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] };
  const result = computeChart(fullChart);
  const natal = natalEventEvidence(result);
  assert.deepEqual(natal.map((e) => e.division), ["D9", "D7", "D10"]);
  const dated = topicReading(chart, event, asOf).parashariVargas!;
  assert.deepEqual(natal[0].rashi, dated.rashi);
  assert.deepEqual(natal[0].varga, dated.varga);
  assert.deepEqual(natal[0].rashiAssessment, dated.rashiAssessment);
  assert.deepEqual(natal[0].rashiLordInVarga, dated.rashiLordInVarga);
  assert.deepEqual(natal[0].vargaLagnaLord, dated.vargaLagnaLord);
  assert.equal(natal[0].periods.length, 0);
});

test("chart date checks respect birth, recorded passing, and the ordinary reading's age gates", () => {
  assert.throws(() => topicReading(chart, { ...event, date: chart.birthDate, time: "01:00", timezone: chart.timezone }, asOf), /at or after birth/);
  assert.throws(() => topicReading({ ...chart, deathDate: "2012-01-01" }, event, asOf), /before the recorded date of passing/);
  const child = { ...chart, birthDate: "2015-01-01" };
  const childBirth = "2015-01-01T06:30:00.000Z";
  const childNow = "2025-06-01T12:00:00Z";
  assert.equal(eventReadingAllowed("marriage", childBirth, childNow, child), false);
  assert.equal(eventReadingAllowed("education", childBirth, childNow, child), true);
  assert.throws(() => topicReading(child, { ...event, date: "2035-01-01" }, childNow), /not available/);
  const study = topicReading(child, { id: "school", matter: "education", date: "2024-03-20" }, childNow);
  assert.ok(study.manley);
  assert.equal(study.jaimini, null, "education maps to a Jaimini area held back in this chart");
  assert.throws(() => topicReading(child, { id: "injury", matter: "accident", date: "2024-03-20" }, childNow), /not available/);
});

test("the chart report includes the selected system's exact dated checks and natal foundations", () => {
  const fullChart = { ...chart, id: 92, gender: "male", timeStandard: "auto", ayanamsa: "raman", nodeType: "true",
    sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] };
  const result = computeChart(fullChart);
  const checked = topicReading(chart, event, asOf);
  const report = buildReport(result, { plain: false, modules: ["kp", "parashari", "jaimini", "bnn"],
    tools: { topicReadings: { kp: checked, parashari: checked, jaimini: checked, bnn: checked } } });
  for (const system of ["kp", "parashari", "jaimini", "bnn"]) {
    const section = report.sections.find((s) => s.id === `${system}-topic-reading`);
    assert.ok(section, system);
    assert.ok(section.paras.some((p) => p.text?.includes(event.date)), system);
    assert.ok(section.paras.some((p) => p.text?.includes("Moon-based transit context")), system);
    const jupiter = checked.moonTransit!.rows.find((row) => row.planet === "Jupiter")!;
    assert.ok(section.paras.some((p) => p.text?.includes(`Jupiter: house ${jupiter.moonHouse} from the Moon, ${jupiter.verdict}`)), system);
  }
  const para = report.sections.find((s) => s.id === "parashari-topic-reading")!;
  assert.ok(para.paras.some((p) => p.text?.includes(checked.parashariSpecific!.factors[2].label)));
  assert.ok(para.paras.some((p) => p.text?.includes("Earlier divisional-only staged experiment")));
  assert.ok(para.paras.some((p) => p.text?.includes(`D1 → ${checked.parashariHierarchy!.division} gate`)));
  assert.ok(para.paras.some((p) => p.text?.includes(`D1 house ${checked.parashariHierarchy!.d1.house}: ${checked.parashariHierarchy!.d1.status}`)));
  const foundations = report.sections.flatMap((s) => s.sub ?? []).find((s) => s.id === "parashari-natal-event-foundations");
  assert.ok(foundations);
  assert.ok(foundations.paras.some((p) => p.text?.includes("D9 for marriage")));
  assert.ok(!foundations.paras.some((p) => p.text?.includes("precedes birth")));
});
