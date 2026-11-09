import assert from "node:assert/strict";
import test from "node:test";
import { BASELINE_LABEL_ML, baselineExplanation } from "../client/src/lib/validation-localization";

test("random-date comparison preserves the sample, dates and limitations in Malayalam", () => {
  const b = { trials: 137, span: ["2001-01-01", "2018-12-31"] as [string, string] };
  const ml = baselineExplanation(b, "ml");
  for (const fact of ["137", "2001-01-01", "2018-12-31", "പകുതിയും", "സാധ്യതയല്ല"]) assert.ok(ml.title.includes(fact));
  for (const caveat of ["ഗോചരസ്ഥാനങ്ങൾ", "അതേ ജനനജാതകത്തിനെതിരെ", "പകുതിയായി", "തിരുത്തൽ വരുത്തിയിട്ടില്ല", "ക്രമമോ"]) assert.ok(ml.family.includes(caveat));
  const en = baselineExplanation(b, "en");
  assert.match(en.title, /137 sets.*2001-01-01.*2018-12-31/);
  assert.match(en.family, /same natal chart/);
  assert.deepEqual(Object.keys(BASELINE_LABEL_ML).sort(), ["bnn", "bnnWindow", "confirmed", "jaimini", "kp", "kpFullWindow", "kpStrictFullWindow", "kpStrictWindow", "kpWindow", "luminary", "transit"].sort());
  assert.ok(Object.values(BASELINE_LABEL_ML).every(Boolean));
});
