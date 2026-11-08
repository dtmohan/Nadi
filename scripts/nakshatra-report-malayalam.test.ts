import test from "node:test";
import assert from "node:assert/strict";
import { createPlanetContext } from "../shared/planet-context";
import { nakshatraContextParas } from "../shared/report/nakshatra-context";
import { nakshatraFrameNoteMalayalam } from "../shared/malayalam-nakshatra-report";
import { Cites } from "../shared/report/types";
import { computeChart } from "../server/routes";
import type { Chart } from "../shared/schema";

test("nakshatra report methods retain the distinct KP and BNN limitations", () => {
  const chart = { id: 0, name: "Synthetic", gender: "female", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;
  const result = computeChart(chart);
  for (const kp of [false, true]) {
    const ctx = createPlanetContext(result.positions, { kind: "natal", ayanamsa: kp ? "kp" : "lahiri", houseMethod: kp ? "placidus" : "rashi" });
    const label = kp ? "KP frame: house, star and dispositor context" : "Planet and ascendant quarters";
    const paras = nakshatraContextParas(ctx, new Cites(), label);
    assert.ok(paras[0].translationMl);
    assert.match(paras[0].translationMl!.text, /സ്വതന്ത്രമായ സ്ഥിരീകരണങ്ങളല്ല/);
    assert.equal(nakshatraFrameNoteMalayalam(label, ctx.frame.ayanamsa, `${paras[0].text} Extra condition.`), undefined);
    assert.ok(paras[2].translationMl);
    assert.match(paras[2].translationMl!.text, /സംഭവസ്കോറിലേക്ക് പോയിന്റുകൾ ചേർക്കുന്നില്ല/);
    assert.ok(paras[3].translationMl);
    assert.match(paras[3].translationMl!.text, /KP സഹാധിപനല്ല/);
    assert.ok(paras[0].cites?.length);
    assert.ok(paras[2].cites?.length);
  }
  assert.equal(nakashatraUnknown(), undefined);
});

function nakashatraUnknown() {
  const label = "New unreviewed frame";
  const text = `${label}: selected lahiri ayanamsa. A star quarter is one D9 interval; the two descriptions are not independent confirmations. Boundaries depend on the birth time and calculation settings.`;
  return nakshatraFrameNoteMalayalam(label, "lahiri", text);
}
