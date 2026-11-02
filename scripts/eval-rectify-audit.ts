/** Reproduce the rectification-audit examples using existing public fixtures. */
import { readFileSync } from "node:fs";
import { matterOf, type ChartEvent } from "@shared/events";
import { baselineFor, groupMethodSegments, highlightedCandidates, methodScore, rawScoreCoverage, type RectifyMethod } from "@shared/rectify-methods";
import { insertChartSchema } from "@shared/schema";
import { rectify } from "../server/rectify";

type Fixture = { name: string; chart: Record<string, unknown>; events: ChartEvent[] };
const fixtures = ["alp-kp-matched-fresh", "alp-photo-fresh", "reliability-fresh-cases", "transit-audit-holdout"]
  .flatMap((name) => (JSON.parse(readFileSync(`scripts/fixtures/${name}.json`, "utf8")) as { cases: Fixture[] }).cases);
const names = process.argv.slice(2).length ? process.argv.slice(2) : ["Cindy Crawford", "Flore Landru", "Manuel Rodríguez Lozano"];
const methods: RectifyMethod[] = ["kp-events", "kp-qualified", "kp-transit", "kp-aurora-v2", "parashari-events-v4", "jaimini-dasha", "bnn-marriage"];
const reports = names.map((name) => {
  const fixture = fixtures.find((x) => x.name === name);
  if (!fixture) throw new Error(`No public fixture for ${name}`);
  const chart = insertChartSchema.parse(fixture.chart);
  const events = fixture.events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
  const start = performance.now();
  const scan = rectify({ chart, events, windowMinutes: 15, includeComparisons: true, judgedAsOf: "2026-11-01T12:00:00.000Z" });
  const measured = methods.map((method) => {
    const rows = scan.segments.map((s) => ({ s, ...methodScore(s, method), b: baselineFor(s, method) }));
    const marked = highlightedCandidates(rows);
    const given = rows.find((r) => r.s.given);
    const coverage = rawScoreCoverage(rows.map((r) => ({ score: r.score, startIso: r.s.startIso, endIso: r.s.endIso, given: r.s.given })));
    return { method, given: given && { score: given.score, max: given.max, comparison: given.b }, coverage,
      marked: marked.length, markedScores: Array.from(new Set(marked.map((i) => rows[i].score))).sort((a, b) => a - b),
      above: rows.filter((r) => r.b?.verdict === "above").length };
  });
  return { name, seconds: Math.round((performance.now() - start) / 10) / 100, segments: scan.segments.length,
    unselectable: scan.segments.filter((s) => s.selectable === false).length, methods: measured,
    kpGroups: groupMethodSegments(scan.segments, "kp-events").length,
    bnnGroups: groupMethodSegments(scan.segments, "bnn-marriage").length,
    alpBands: scan.alpComparisonBands?.length ?? 0, alpBandsCompared: scan.alpComparisonBands?.filter((b) => !!b.baseline).length ?? 0,
    matched: scan.segments.find((s) => s.given)?.alpMatched?.status ?? "none" };
});
process.stdout.write(JSON.stringify(reports, null, 2) + "\n");
