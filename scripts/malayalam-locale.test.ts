import test from "node:test";
import assert from "node:assert/strict";
import { NAKSHATRAS, PLANETS, SIGNS } from "../shared/astro";
import { translate } from "../client/src/lib/i18n";
import { malayalamNadiGlance } from "../client/src/lib/overview-locale";
import { eventsSummary } from "../client/src/components/life-events";

test("Malayalam chart identity covers every planet, sign and birth star", () => {
  for (const name of [...PLANETS, ...SIGNS, ...NAKSHATRAS]) {
    const value = translate("ml", name);
    assert.notEqual(value, name, `${name} must have a Malayalam chart label`);
    assert.match(value, /[\u0D00-\u0D7F]/);
    assert.equal(translate("en", name), name);
  }
  assert.equal(new Set(NAKSHATRAS.map((name) => translate("ml", name))).size, 27);
  assert.equal(translate("ml", "Dhanishta"), "അവിട്ടം");
  assert.equal(translate("ml", "Libra"), "തുലാം");
});

test("translations keep the different lords distinct and leave unknown wording in English", () => {
  assert.equal(translate("ml", "House lord"), "ഭാവാധിപൻ");
  assert.equal(translate("ml", "Sign lord"), "രാശ്യാധിപൻ");
  assert.equal(translate("ml", "Star lord"), "നക്ഷത്രാധിപൻ");
  assert.match(translate("ml", "Sub lord"), /സഹാധിപൻ.*sub-lord/);
  assert.match(translate("ml", "Randomly selected comparison dates"), /ക്രമരഹിതമായി തിരഞ്ഞെടുത്ത തീയതികൾ/);
  assert.equal(translate("ml", "An untranslated source sentence."), "An untranslated source sentence.");
});

test("Malayalam Nadi summary preserves the chart's supportive, care, contested and mixed states", () => {
  const text = malayalamNadiGlance([
    { area: "career", tone: "supportive", balance: 2 },
    { area: "wealth", tone: "supportive", balance: 4 },
    { area: "health", tone: "care", balance: -1 },
    { area: "marriage", tone: "contested", balance: 0 },
    { area: "children", tone: "mixed", balance: 0 },
    { area: "family", tone: "quiet", balance: 0 },
  ]);
  assert.match(text, /ധനം, ജീവിതവൃത്തി — അനുകൂല സൂചനകൾ/);
  assert.match(text, /ആരോഗ്യം — ശ്രദ്ധ ആവശ്യപ്പെടുന്ന സൂചനകൾ/);
  assert.match(text, /വിവാഹം — അനുകൂലവും പ്രതികൂലവുമായ ശക്തമായ സൂചനകൾ/);
  assert.match(text, /മറ്റ് സൂചനകളുള്ള മേഖലകൾ സമ്മിശ്രമാണ്/);
  assert.doesNotMatch(text, /മാതാപിതാക്കൾ/);
  assert.match(malayalamNadiGlance([{ area: "children", tone: "mixed", balance: 0 }]), /സൂചനകൾ സമ്മിശ്രമാണ്/);
  assert.match(malayalamNadiGlance([]), /ശക്തമായ സൂചന നൽകുന്നില്ല/);
});

test("event summaries preserve the event and date in both languages", () => {
  const events = [{ id: "test", matter: "marriage", date: "2010-02-09" }];
  assert.equal(eventsSummary(events, "Asia/Kolkata"), "Marriage Feb 2010");
  assert.match(eventsSummary(events, "Asia/Kolkata", "ml"), /^വിവാഹം .*2010$/);
  assert.equal(eventsSummary([], "Asia/Kolkata", "ml"), "സംഭവങ്ങളൊന്നും സൂക്ഷിച്ചിട്ടില്ല");
});
