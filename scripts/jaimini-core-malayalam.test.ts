import test from "node:test";
import assert from "node:assert/strict";
import { JAIMINI_RULES } from "../shared/rules-jaimini";
import { JAIMINI_CORE_SNAPSHOT } from "../shared/malayalam-jaimini-core-snapshot";
import { MALAYALAM_JAIMINI_CORE_RULES } from "../shared/malayalam-jaimini-core";
import { JAIMINI_AREAS } from "../shared/jaimini-areas";
import { translate } from "../shared/localization";
import { soften } from "../shared/gentle";
import { jaiminiAreaNoteMalayalam } from "../shared/malayalam-jaimini-area-notes";
import { jaiminiTimingMalayalam } from "../shared/malayalam-jaimini-timing";

test("Jaimini core translations match their full recorded sources in both registers", () => {
  const core = JAIMINI_RULES.filter((r) => r.id in JAIMINI_CORE_SNAPSHOT);
  assert.equal(core.length, Object.keys(MALAYALAM_JAIMINI_CORE_RULES).length);
  for (const rule of core) {
    assert.equal(JAIMINI_CORE_SNAPSHOT[rule.id], rule.text, rule.id);
    for (const source of [rule.text, soften(rule.text)]) {
      assert.match(translate("ml", source), /[\u0d00-\u0d7f]/, rule.id);
      assert.equal(translate("ml", `${source} Additional condition.`), `${source} Additional condition.`);
    }
  }
  const safe = soften(core.find((r) => r.id === "ju-2nd-afflicted")!.text);
  assert.doesNotMatch(translate("ml", safe), /വേർപിരിയൽ|നഷ്ടപ്പെടൽ/);
});

test("Jaimini area descriptions retain their complete original text or fall back", () => {
  for (const area of Object.values(JAIMINI_AREAS)) {
    assert.match(translate("ml", area.blurb), /[\u0d00-\u0d7f]/);
    assert.equal(translate("ml", `${area.blurb} Extra condition.`), `${area.blurb} Extra condition.`);
  }
  const wealth = translate("ml", JAIMINI_AREAS.wealth.blurb);
  assert.match(wealth, /ഇവിടെ ചെയ്യുന്നില്ല/);
  assert.match(wealth, /1\.3\.17/);
});

test("Jaimini generated spouse details preserve each known planet and reject extra claims", () => {
  const source = "7th from the Karakamsa describes the spouse. Moon: a beautiful, gentle spouse; Mercury: a spouse skilled in the arts.";
  const ml = translate("ml", source);
  assert.match(ml, /ചന്ദ്രൻ/);
  assert.match(ml, /ബുധൻ/);
  assert.equal(translate("ml", `${source} Extra condition.`), `${source} Extra condition.`);
  const changed = source.replace("Moon: a beautiful, gentle spouse", "Moon: new condition");
  assert.equal(translate("ml", changed), changed);
});

test("generated Jaimini natal notes keep planets, signs, dignity and all qualifiers", () => {
  const source = "In the navamsa Jupiter is in a friendly sign in Leo; this sign-level strength may mitigate the rasi placement, alongside other factors.";
  const ml = jaiminiAreaNoteMalayalam(source)!;
  for (const word of ["നവാംശത്തിൽ", "വ്യാഴം", "ചിങ്ങം", "മിത്രരാശിയിൽ", "ലഘൂകരിച്ചേക്കാം", "മറ്റു ഘടകങ്ങളോടൊപ്പം"]) assert.ok(ml.includes(word), word);
  assert.equal(jaiminiAreaNoteMalayalam(`${source} New condition.`), undefined);
  const joined = "Joined by Sun, Mars and Saturn: the karaka is afflicted, so the spouse, partnerships and close alliances meet resistance.";
  const joinedMl = jaiminiAreaNoteMalayalam(joined)!;
  for (const word of ["സൂര്യൻ", "ചൊവ്വ", "ശനി", "പങ്കാളി", "പങ്കാളിത്തം", "പ്രതിരോധം"]) assert.ok(joinedMl.includes(word), word);
  assert.equal(jaiminiAreaNoteMalayalam(joined.replace("Saturn", "Unknown")), undefined);
  const empty = "A10 in Libra is empty; read it from its lord Venus in Sagittarius and from the planets aspecting it.";
  const emptyMl = translate("ml", empty);
  for (const word of ["A10", "തുലാം", "ധനു", "ശുക്രൻ", "ദൃഷ്ടിക്കുന്ന"]) assert.ok(emptyMl.includes(word), word);
  assert.equal(translate("ml", `${empty} Extra.`), `${empty} Extra.`);
});

test("Jaimini timing preserves relevant planets, house, period sign, padas and stated qualifications", () => {
  const strong = "Venus and Saturn (AmK, AK) in the 10th from Pisces: the area's own karaka stands in its house, the strongest sign for rise in work and position.";
  const ml = jaiminiTimingMalayalam(strong)!;
  for (const value of ["ശുക്രൻ", "ശനി", "AmK", "AK", "10-ാം", "മീനം", "ഏറ്റവും ശക്തമായ"]) assert.ok(ml.includes(value), value);
  const aspect = "Taurus aspects the A10 (Libra) by rasi drishti: a lighter touch on career, rank and recognition.";
  const aspectMl = translate("ml", aspect);
  for (const value of ["ഇടവം", "A10", "തുലാം", "രാശിദൃഷ്ടി", "ലഘുവായ"]) assert.ok(aspectMl.includes(value), value);
  const facing = "Capricorn is 7th from the A2: it faces the pada across the 1–7 axis, so savings, family wealth and what is accumulated are activated (Rao).";
  assert.match(translate("ml", facing), /1–7/);
  assert.match(translate("ml", facing), /റാവു/);
  const testing = "Sagittarius holds the Atmakaraka: a period that tests the self; Rao asks for care, since AK periods can bring a fall as well as a rise.";
  assert.match(translate("ml", testing), /ഉയർച്ചയ്ക്കൊപ്പം താഴ്ചയും/);
  assert.equal(jaiminiTimingMalayalam(`${aspect} Extra condition.`), undefined);
  assert.equal(jaiminiTimingMalayalam(strong.replace("Venus", "Unknown")), undefined);
  assert.equal(jaiminiTimingMalayalam(strong.replace("10th", "10st")), undefined);
  assert.equal(jaiminiTimingMalayalam(strong.replace("rise in work and position", "an unknown outcome")), undefined);
});

test("same-period and Rao caution translations keep their exact frame and optional aspect", () => {
  const repeated = "Taurus is the dasha sign itself: the mahadasha themes for this area come forward on their own, without a second lens.";
  assert.match(translate("ml", repeated), /മറ്റൊരു കാഴ്ചപ്പാടിന്റെ ആവർത്തനമില്ലാതെ/);
  const caution = "Virgo is the 6th from the mahadasha sign Aries: a sub-period to be careful in, more so as the Atmakaraka aspects it (Rao).";
  const ml = translate("ml", caution);
  for (const word of ["കന്നി", "ആറാമത്തേത്", "മേടം", "ഉപകാലം", "ആത്മകാരകൻ", "കൂടുതൽ ശ്രദ്ധ", "റാവു"]) assert.ok(ml.includes(word), word);
  const noAspect = caution.replace(", more so as the Atmakaraka aspects it", "");
  assert.doesNotMatch(translate("ml", noAspect), /ആത്മകാരകൻ/);
  assert.equal(translate("ml", `${caution} Extra condition.`), `${caution} Extra condition.`);
  const child = "Libra is the 6th from the lagna, the 2nd from the 5th and so a maraka house for children: care is needed for their health (Rao).";
  for (const word of ["തുലാം", "ലഗ്നത്തിൽനിന്ന് ആറാമത്തെയും", "അഞ്ചിൽനിന്ന് രണ്ടാമത്തെയും", "മാരകഭാവമായി", "ആരോഗ്യത്തിൽ ശ്രദ്ധ"]) assert.ok(translate("ml", child).includes(word), word);
  const eighth = "The Atmakaraka falls in the 8th from Taurus: predictions must be made carefully (Rao).";
  for (const word of ["ആത്മകാരകൻ", "ഇടവം", "എട്ടാം", "ശ്രദ്ധയോടെ", "റാവു"]) assert.ok(translate("ml", eighth).includes(word), word);
});
