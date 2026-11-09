import assert from "node:assert/strict";
import test from "node:test";
import { heldAreasAt } from "../shared/life-stage";
import type { AlpFinding } from "../shared/rules-alp";
import { alpHeldAreas, visibleAlpFindings } from "../client/src/lib/alp-visible-findings";

test("ALP hides a generic finding when its evidence names a held subject", () => {
  const chart = { birthDate: "2008-03-10", timezone: "America/Los_Angeles", deathDate: null };
  const findings = [
    { ruleId: "held", text: "The houses connect.", here: ["The seventh concerns marriage and spouse."] },
    { ruleId: "safe", text: "The houses connect.", here: ["The first concerns personal effort."] },
  ] as AlpFinding[];
  const birth = "2008-03-10T18:00:00Z";
  assert.deepEqual(visibleAlpFindings(findings, heldAreasAt(birth, "2026-03-10T06:00:00Z", chart)).map((f) => f.ruleId), ["safe"]);
  assert.deepEqual(visibleAlpFindings(findings, heldAreasAt(birth, "2026-03-10T08:00:00Z", chart)).map((f) => f.ruleId), ["held", "safe"]);
  const futureSelection = alpHeldAreas(birth, "2027-03-10", "2026-03-10T06:00:00Z", chart);
  assert.deepEqual(visibleAlpFindings(findings, futureSelection).map((f) => f.ruleId), ["safe"]);
});
