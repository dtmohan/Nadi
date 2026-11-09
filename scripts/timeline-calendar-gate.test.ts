import assert from "node:assert/strict";
import test from "node:test";
import type { ChartResult } from "../shared/schema";
import type { TransitReading } from "../shared/timing";
import { bnnAreaRows } from "../client/src/lib/timeline-data";

test("the BNN career band opens at local midnight on the sixteenth birthday", () => {
  const chart = { birthDate: "2008-03-10", timezone: "America/Los_Angeles", deathDate: null } as ChartResult["chart"];
  const reading = {
    period: { planet: "Jupiter", sign: "Aries", start: "2024-03-09T00:00:00Z", end: "2024-03-12T00:00:00Z" },
    conjunct: ["Mercury"], trine: [], opposite: [],
    activated: [{ area: "career", planets: ["Mercury"], score: 2, text: "A career clue." }],
  } as unknown as TransitReading;
  const rows = bnnAreaRows([reading], ["career"], "2008-03-10T18:00:00Z", true, (s) => s, chart);
  assert.equal(rows[0].windows.length, 1);
  assert.equal(rows[0].windows[0].start, "2024-03-10T08:00:00.000Z");
});
