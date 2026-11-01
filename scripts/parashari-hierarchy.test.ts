import assert from "node:assert/strict";
import test from "node:test";
import type { ManleyEvidence, ManleyFrame } from "@shared/manley-evidence";
import { hierarchyEventFromFoundations, hierarchyWindowStages, type HierarchyEvent, type HierarchyNatalCheck } from "@shared/parashari-hierarchy";
import { summarizeParashariComparisons, type ParashariObservation } from "@shared/parashari-comparison";

const frame = (chart: "D1" | "D9", hit: boolean) => ({ chart,
  primary: { house: hit ? ["a house link"] : [], houseLord: [], karaka: [] } } as unknown as ManleyFrame);
const evidence = (hits: Array<[boolean, boolean]>): ManleyEvidence => ({
  label: "wedding", date: "2000-01-01", matter: "marriage", division: "D9", subject: "marriage", house: 7, karakas: ["Venus"],
  periods: ["dasa", "bhukti"].map((level, i) => ({ level, planet: "Venus", frames: [frame("D1", hits[i][0]), frame("D9", hits[i][1])] })),
  antara: { level: "antara", planet: "Mercury", frames: [frame("D1", hits[2][0]), frame("D9", hits[2][1])] },
} as ManleyEvidence);
const natal = (status: HierarchyNatalCheck["status"]): HierarchyNatalCheck => ({ house: 7, status, support: [], strain: [] });
const check = (d1: HierarchyNatalCheck["status"], division: HierarchyNatalCheck["status"], hits: Array<[boolean, boolean]>) =>
  hierarchyEventFromFoundations(evidence(hits), { d1: natal(d1), divisionCheck: natal(division) });
const all: Array<[boolean, boolean]> = [[true, true], [true, true], [true, true]];

test("each period requires D1, its own division, and every earlier period", () => {
  assert.deepEqual(check("supported", "supported", all).passes, { d1: true, division: true, major: true, sub: true, third: true });
  for (const failed of ["mixed", "unresolved"] as const) {
    assert.deepEqual(check(failed, "supported", all).passes, { d1: false, division: false, major: false, sub: false, third: false });
    assert.deepEqual(check("supported", failed, all).passes, { d1: true, division: false, major: false, sub: false, third: false });
  }
  assert.deepEqual(check("supported", "supported", [[true, false], all[1], all[2]]).passes,
    { d1: true, division: true, major: false, sub: false, third: false });
  assert.deepEqual(check("supported", "supported", [all[0], [false, true], all[2]]).passes,
    { d1: true, division: true, major: true, sub: false, third: false });
  assert.deepEqual(check("supported", "supported", [all[0], all[1], [true, false]]).passes,
    { d1: true, division: true, major: true, sub: true, third: false });
});

test("window intersection retains prior events and never demands D4 of marriage", () => {
  const selections = [{ matter: "move" }, { matter: "marriage" }, { matter: "abroad" }];
  const event = (d1: boolean, sub: boolean, third: boolean) => ({ passes: { d1, division: sub, major: sub, sub, third } } as HierarchyEvent);
  const rows = [
    [event(true, true, true), event(true, true, true), null],
    [event(true, false, false), event(true, true, true), null],
    [event(true, true, true), event(true, false, false), null],
    [event(true, true, false), event(true, true, true), null],
    [event(true, true, true), event(false, true, true), null],
    [event(true, true, true), null, null],
  ];
  const result = hierarchyWindowStages(selections, rows);
  assert.deepEqual(result.eligible, [0, 1]);
  assert.deepEqual(result.unassessed, [2]);
  assert.deepEqual(result.stages.map((s) => s.indices), [[0, 1, 2, 3], [0, 2, 3], [0, 3], [0]]);
});

test("conditional third-period comparison keeps the same predecessors for every sampled date", () => {
  const obs = (sub: boolean, third: boolean): ParashariObservation => ({ hierarchy: {
    d1: true, division: true, major: true, sub, third: sub && third,
  } });
  const actual = [obs(true, true), obs(false, true)];
  const trials = [[obs(true, true), obs(true, true)], [obs(true, false), obs(true, true)], [obs(false, true), obs(false, false)]];
  const h = summarizeParashariComparisons(actual, trials).hierarchy!;
  assert.equal(h.sub.actual, 1);
  assert.deepEqual(h.qualifyingDraws, [2]);
  assert.equal(h.third?.actual, 1);
  assert.equal(h.third?.mean, 0.5);
});
