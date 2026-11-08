import test from "node:test";
import assert from "node:assert/strict";
import { kpStabilityMalayalam } from "../shared/malayalam-kp-stability";
import type { KpStability, KpStabilityPoint } from "../shared/kp";

test("KP stability note retains the conditional cusp, Moon change, threshold and fallback", () => {
  const point = { label: "cusp", starLord: "Venus", subLord: "Moon", before: 30, after: 150, prevSub: "Sun", nextSub: "Mars" } as KpStabilityPoint;
  const stability: KpStability = { cuspWindow: 3600, moonWindow: 3600, cusps: [{ ...point, house: 1 }], moon: { ...point, before: 30, after: 150 } };
  const source = "A cusp moves about a degree every four minutes and a sub spans 46' to 2°13', so a cusp sub lord holds for minutes; the books make a correct birth time the first condition of a reading. One cusp (1st) changes its sub lord within 2 minutes of the recorded time, so its verdict is conditional on the minute. The Moon's sub lord was Sun until 30 s earlier. The two-minute margin is the app's convention.";
  const ml = kpStabilityMalayalam(stability, source)!;
  for (const text of ["1-ാം", "2 മിനിറ്റിനുള്ളിൽ", "ചന്ദ്രന്റെ", "സൂര്യൻ", "30 സെക്കൻഡ്", "ആപ്പിന്റെ രീതിയാണ്"]) assert.ok(ml.includes(text), text);
  assert.equal(kpStabilityMalayalam(stability, `${source} Added condition.`), undefined);
  assert.equal(kpStabilityMalayalam({ ...stability, moon: { ...stability.moon, prevSub: null } }, source), undefined);
});
