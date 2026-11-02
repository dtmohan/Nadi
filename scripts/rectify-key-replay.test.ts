import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matterOf, type ChartEvent } from "@shared/events";
import { insertChartSchema } from "@shared/schema";
import { rectify } from "../server/rectify";

test("narrower segmentation preserves the earlier KP and Aurora evidence at interior public-case samples", () => {
  const reference = JSON.parse(readFileSync("scripts/fixtures/rectify-key-reference.json", "utf8")) as {
    cases: Array<{ name: string; samples: Array<{ birthUtc: string; hash: string }> }>;
  };
  const fixtures = JSON.parse(readFileSync("scripts/fixtures/alp-kp-matched-fresh.json", "utf8")) as {
    cases: Array<{ name: string; chart: Record<string, unknown>; events: ChartEvent[] }>;
  };
  for (const item of reference.cases) {
    const fixture = fixtures.cases.find((c) => c.name === item.name)!;
    const events = fixture.events.map((e) => { const m = matterOf(e.matter); return { ...e, label: m.label, houses: m.houses, cusp: m.cusp, area: m.area }; });
    const scan = rectify({ chart: insertChartSchema.parse(fixture.chart), events, windowMinutes: 15,
      includeComparisons: false, judgedAsOf: "2026-11-01T12:00:00Z" });
    let compared = 0;
    for (const sample of item.samples) {
      const at = Date.parse(sample.birthUtc);
      const segment = scan.segments.find((s) => Date.parse(s.startIso) <= at && at < Date.parse(s.endIso));
      // The source scan resolves boundaries to 0.2 s and displays rounded
      // seconds. Do not claim to resolve a sample on that rounded boundary.
      if (!segment || at - Date.parse(segment.startIso) <= 1000 || Date.parse(segment.endIso) - at <= 1000) continue;
      const evidence = { moonLords: segment.moonLords, auroraAscendant: segment.auroraAscendant,
        events: segment.events.map((e) => ({ hits: e.hits, promised: e.promised, filtered: e.filtered,
          effective: e.effective, natalRules: e.natalRules, aurora: e.aurora, auroraV2: e.auroraV2 })) };
      const hash = createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
      assert.equal(hash, sample.hash, `${item.name} at ${sample.birthUtc}`);
      compared++;
    }
    assert.ok(compared >= 55, `${item.name}: only ${compared} interior points`);
  }
});
