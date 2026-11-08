import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { RULES, type Finding } from "../shared/rules";
import { synthesizeArea } from "../shared/synthesis";
import { plainTopicNatal } from "../shared/topic-brief";
import { translate } from "../shared/localization";
import { soften } from "../shared/gentle";
import { KP_RULES, kpFindingPlain, kpUsedGloss, type KpFinding } from "../shared/rules-kp";
import { ALP_PLAIN_TOPIC_RULES, defaultAlpForTopics, expandedSchoolTopicBriefs } from "../shared/school-topics-expanded";
import { ALP_RULES } from "../shared/rules-alp";
import { ALP_SOURCE_SNAPSHOT } from "../shared/malayalam-alp-snapshot";
import { MALAYALAM_ALP_RULES } from "../shared/malayalam-alp-rules";
import { alpEvidenceClauseMalayalam } from "../shared/malayalam-alp-evidence";
import { BNN_SOURCE_SNAPSHOT } from "../shared/malayalam-bnn-snapshot";
import { MALAYALAM_BNN_RULES } from "../shared/malayalam-bnn-rules";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { buildReport, localizeReportMalayalam, type ReportDoc, type ReportSection } from "../shared/report";
import { reportMalayalamLabel } from "../shared/malayalam-report-labels";
import { bnnFindingContext } from "../shared/chart-explanations";
import { kpEvidenceMalayalam, kpHereMalayalam, kpTimingMalayalam, parashariLordMalayalam, parashariLordPractitionerMalayalam } from "../shared/school-topic-malayalam";
import { LORD_IN_HOUSE } from "../shared/parashari-data";
import { MALAYALAM_PARASHARI_LORDS } from "../shared/malayalam-parashari-lords";
import { SUTRA_RULES } from "../shared/rules-jaimini-sutras";
import { PRASNA_HOUSE_EFFECT_PLAIN } from "../shared/prasna-plain";
import { computePrasnaFructification, PRASNA_BHAVA_SIGNIFICATIONS, PRASNA_GULIKA_EFFECTS, PRASNA_HOUSE_EFFECTS, PRASNA_TRANSIT_EFFECTS } from "../shared/rules-prasna";
import { plainFructificationMalayalam, practitionerFructificationMalayalam } from "../shared/report/prasna";
import { renderReportPdf } from "../server/report-pdf";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Settings } from "luxon";
import type { Chart } from "../shared/schema";
import type { BriefSchool } from "../shared/school-topic-brief";

const chart = (birthDate = "1990-01-01"): Chart => ({ id: 0, name: "Synthetic", gender: "male", birthDate, birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart);
const result = computeChart(chart());
result.now.asOf = "2026-11-01T12:00:00.000Z";
const hasMalayalam = (s: string | undefined) => /[\u0d00-\u0d7f]/.test(s ?? "");
const sections = (ss: ReportSection[]): ReportSection[] => ss.flatMap((s) => [s, ...sections(s.sub ?? [])]);

test("report labels retain period ranges and unknown wording falls back", () => {
  assert.equal(reportMalayalamLabel("The 7th cusp"), "7-ാം കസ്പ്");
  assert.match(reportMalayalamLabel("Jupiter dasa, ages 36 to 52 (running)")!, /വ്യാഴം.*36.*52.*ഇപ്പോൾ/);
  assert.equal(reportMalayalamLabel("Jupiter dasa, ages 36 to 52 (running). Another condition."), undefined);
  const en = buildReport(result, { plain: false, locale: "en" });
  const ml = buildReport(result, { plain: false, locale: "ml" });
  const allEn = sections(en.sections), allMl = sections(ml.sections);
  const source = allEn.find((s) => s.kicker === "For practitioners")!;
  assert.equal(allMl.find((s) => s.id === source.id)?.kicker, "വിദഗ്ധർക്കായി");
  assert.deepEqual(ml.cites, en.cites);
});

// Exercise every individually selected rule, rather than counting dictionary entries.
test("all selected BNN career and marriage rule themes have translations after plain softening", () => {
  let count = 0;
  for (const rule of RULES.filter((r) => r.area === "career" || r.area === "marriage")) {
    const f: Finding = { ruleId: rule.id, area: rule.area, text: rule.text, score: rule.weight, planets: [rule.when.subject, ...(rule.when.object ? [rule.when.object] : []), ...(rule.when.with?.map((v) => v.planet) ?? [])], relation: "conjunct", viaRetro: false, source: rule.source };
    const area = synthesizeArea(rule.area, [f], result.reading, result.reading.roles.gender);
    const natal = plainTopicNatal(rule.area, area, result.reading);
    for (const text of natal.details ?? []) { const plain = soften(text); assert.notEqual(translate("ml", plain), plain, `${rule.id}: ${plain}`); count++; }
  }
  assert.ok(count >= 180);
});

test("the entire entered Parashari house-lord and Jaimini Sutra catalogues have source-matched translations", () => {
  const lords = LORD_IN_HOUSE.flat();
  assert.equal(lords.length, 144);
  assert.equal(Object.keys(MALAYALAM_PARASHARI_LORDS).length, 144);
  for (const entry of lords) {
    assert.equal(MALAYALAM_PARASHARI_LORDS[entry.verse]?.source, entry.text, `BPHS 24.${entry.verse}`);
    assert.ok(hasMalayalam(MALAYALAM_PARASHARI_LORDS[entry.verse]?.text), `BPHS 24.${entry.verse}`);
  }
  assert.equal(SUTRA_RULES.length, 44);
  for (const rule of SUTRA_RULES) {
    assert.notEqual(translate("ml", rule.text), rule.text, rule.id);
    assert.equal(translate("ml", `${rule.text} New condition.`), `${rule.text} New condition.`);
  }
});

test("generated Jaimini deity translations retain all planets and forms, with an exact-pattern fallback", () => {
  const en = "Ishta devata from the 12th of the Karakamsa (Venus, Jupiter): Lakshmi; Shiva with Uma (Samba-Shiva).";
  const ml = translate("ml", en);
  for (const word of ["ശുക്രൻ", "വ്യാഴം", "ലക്ഷ്മി", "ഉമയോടുകൂടിയ ശിവൻ"]) assert.ok(ml.includes(word));
  assert.equal(translate("ml", en + " Another condition."), en + " Another condition.");
  const unknown = "Ishta devata from the 12th of the Karakamsa (Unknown): Lakshmi.";
  assert.equal(translate("ml", unknown), unknown);
});

test("every entered KP and reviewed ALP career or marriage plain source has an exact translation", () => {
  const kp = KP_RULES.filter((r) => r.cusp === 7 && ["Marriage", "Married life", "Partner", "Love"].includes(r.topic) || r.cusp === 10 && ["Career", "Employment", "Profession"].includes(r.topic));
  assert.equal(kp.length, 52);
  for (const rule of kp) { const text = soften(kpFindingPlain({ ruleId: rule.id, text: rule.text })); assert.notEqual(translate("ml", text), text, rule.id); }
  let count = 0;
  for (const [id, mappings] of Object.entries(ALP_PLAIN_TOPIC_RULES)) for (const topic of ["career", "marriage"] as const) {
    const text = mappings[topic]; if (text) { assert.notEqual(translate("ml", text), text, id); count++; }
  }
  assert.equal(count, 16);
  for (const [id, mappings] of Object.entries(ALP_PLAIN_TOPIC_RULES)) for (const text of Object.values(mappings))
    assert.notEqual(translate("ml", text), text, `${id}: ${text}`);
});

test("the complete first seven KP cusp plain-rule catalogues have exact-source translations", () => {
  const rules = KP_RULES.filter((r) => r.cusp <= 7);
  assert.equal(rules.length, 278);
  for (const rule of rules) {
    const text = soften(kpFindingPlain({ ruleId: rule.id, text: rule.text }));
    assert.ok(hasMalayalam(translate("ml", text)), `${rule.id}: ${text}`);
    assert.ok(hasMalayalam(translate("ml", rule.text)), `practitioner ${rule.id}`);
    assert.equal(translate("ml", `${text} New condition.`), `${text} New condition.`);
  }
});

test("the ninth KP cusp catalogue retains its source conditions in both registers", () => {
  const rules = KP_RULES.filter((r) => r.cusp === 9);
  assert.equal(rules.length, 20);
  for (const rule of rules) {
    const text = soften(kpFindingPlain({ ruleId: rule.id, text: rule.text }));
    assert.ok(hasMalayalam(translate("ml", text)), `${rule.id}: plain`);
    assert.ok(hasMalayalam(translate("ml", rule.text)), `${rule.id}: practitioner`);
    assert.equal(translate("ml", `${text} New condition.`), `${text} New condition.`);
  }
});

test("KP report labels and important source qualifications survive translation", () => {
  for (const topic of Array.from(new Set(KP_RULES.map((r) => r.topic))))
    assert.notEqual(translate("ml", topic), topic, topic);
  const property = KP_RULES.find((r) => r.id === "kp3-vehicles-owned")!;
  const ml = translate("ml", property.text);
  assert.match(ml, /ഈ നിയമം അതു കണക്കാക്കുന്നില്ല/);
  assert.match(ml, /2, 4, 10, 11/);
  const education = KP_RULES.find((r) => r.id === "kp4-edu-no-11")!;
  assert.match(translate("ml", education.text), /എല്ലാം ഇവിടെ ഉൾപ്പെടുത്തിയിട്ടില്ല/);
  const children = KP_RULES.find((r) => r.id === "kp5-children-denied")!;
  assert.match(translate("ml", children.text), /വ്യക്തിഗത|സന്താനമുണ്ടാകുമോ/);
  assert.match(translate("ml", children.text), /താൽക്കാലിക/);
  const sex = KP_RULES.find((r) => r.id === "kp5-child-male")!;
  assert.match(translate("ml", soften(kpFindingPlain({ ruleId: sex.id, text: sex.text }))), /നിർണയിക്കാനാവില്ല/);
});

test("BNN evidence retains actual relation, retrograde convention, and time uncertainty", () => {
  const f: Finding = { ruleId: "example", area: "career", text: "example", score: 2, planets: ["Saturn", "Mercury"], relation: "trine", viaRetro: true, band: { minutes: 2 }, source: "Example source" };
  const e = bnnFindingContext(f);
  assert.match(e.textMl, /ശനി/); assert.match(e.textMl, /ബുധൻ/); assert.match(e.textMl, /അഞ്ചാം അല്ലെങ്കിൽ ഒമ്പതാം/);
  assert.match(e.textMl, /വക്രഗതി/); assert.match(e.textMl, /ജനനസമയ പരിധി/); assert.equal(e.source, "Example source");
  assert.equal(e.timeSensitive, true);
  assert.equal(e.provisional, false);
  const tentative = bnnFindingContext({ ...f, text: "A provisional interpretation.", source: "Specific source not verified", band: undefined });
  assert.equal(tentative.provisional, true);
  assert.equal(tentative.sourceUnverified, true);
  assert.equal(tentative.timeSensitive, false);
});

test("all five schools localize their actual career and marriage brief without changing evidence or inputs", () => {
  const input = agreementInput(result, true); const agreement = computeAgreement(input);
  const before = JSON.stringify({ result, input, agreement });
  for (const school of ["parashari", "kp", "jaimini", "alp", "prasna"] as BriefSchool[]) {
    for (const topic of ["career", "marriage"] as const) {
      const b = expandedSchoolTopicBriefs(result, school, input, agreement).find((v) => v.topic === topic)!;
      assert.ok(b, `${school} ${topic}`); assert.ok(hasMalayalam(b.ml?.summary), `${school} ${topic} summary`);
      assert.ok(hasMalayalam(b.ml?.limit), `${school} ${topic} limit`);
      if (b.explanation?.length && school !== "alp") assert.ok(b.ml?.explanation?.every(hasMalayalam), `${school} ${topic} technical context`);
    }
  }
  assert.equal(JSON.stringify({ result, input, agreement }), before);
});

test("all five schools cover their other topic summaries without bypassing their limits", () => {
  const input = agreementInput(result, true); const agreement = computeAgreement(input);
  for (const school of ["parashari", "kp", "jaimini", "alp", "prasna"] as const) {
    const briefs = expandedSchoolTopicBriefs(result, school, input, agreement);
    assert.equal(briefs.length, 13);
    for (const b of briefs) {
      assert.ok(hasMalayalam(b.ml?.summary), `${school} ${b.topic} summary`);
      assert.ok(hasMalayalam(b.ml?.limit), `${school} ${b.topic} limit`);
      if (school === "alp" || school === "prasna") for (const d of b.details ?? []) assert.ok(hasMalayalam(b.ml?.details?.[d.id]), `${school} ${b.topic} ${d.id}`);
    }
  }
});

test("Parashari lord translations follow the exact source and strength qualifier into reports", () => {
  const input = agreementInput(result, true); const par = input.parashari;
  const b = expandedSchoolTopicBriefs(result, "parashari", input, computeAgreement(input)).find((x) => x.topic === "career")!;
  const bhava = par.bhavas.find((h) => h.house === 10)!;
  const part = par.houseProse!.find((h) => h.house === 10)!.parts.find((p) => p.key === "lord")!;
  const ml = parashariLordMalayalam(par, bhava, part);
  assert.ok(ml && hasMalayalam(ml));
  assert.ok(b.ml?.details?.[b.details![0].id].endsWith(ml!));
  assert.equal(parashariLordMalayalam(par, bhava, { ...part, textPlain: part.textPlain + " A new condition." }), undefined);
  const report = buildReport(result, { plain: true, modules: ["parashari"], locale: "ml" });
  assert.ok(sections(report.sections).find((s) => s.id === "house-10")?.paras.some((p) => p.text === ml));
});

test("a softened Parashari source translation does not restore its stronger original wording", () => {
  const par = agreementInput(result, true).parashari;
  const sample = par.bhavas.find((b) => b.house === 7)!;
  const bhava = { ...sample, house: 7, lord: "Mars" as const, lordIn: 3 };
  const safePar = { ...par, shadbala: undefined, findings: par.findings.filter((f) => f.id !== "pa-lord-7-3") };
  const samplePart = par.houseProse!.flatMap((h) => h.parts).find((p) => p.key === "lord")!;
  const textPlain = "Since Mars, ruler of your 7th house, sits in your 3rd (courage and siblings), Parashara reads: worry over children or a single child kept with difficulty; a daughter more likely.";
  const part = { ...samplePart, key: "lord" as const, textPlain };
  const ml = parashariLordMalayalam(safePar, bhava, part);
  assert.ok(ml);
  assert.match(ml, /ആശങ്ക/);
  assert.doesNotMatch(ml, /സന്താനനഷ്ടം/);
  assert.equal(parashariLordMalayalam(safePar, bhava, { ...part, textPlain: textPlain + " New condition." }), undefined);
});

test("practitioner house translations retain strength, source guards and report citations", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const r = computeChart({ ...chart(), ...fixture.cases[0] });
  const par = agreementInput(r, false).parashari;
  const selected = par.houseProse!.flatMap((h) => {
    const bhava = par.bhavas.find((b) => b.house === h.house)!;
    return h.parts.flatMap((part) => {
      const ml = parashariLordPractitionerMalayalam(par, bhava, part);
      return ml ? [{ bhava, part, ml }] : [];
    });
  });
  assert.ok(selected.length > 0);
  const first = selected[0];
  assert.match(first.ml, /വിരൂപ/);
  assert.equal(parashariLordPractitionerMalayalam(par, first.bhava, { ...first.part, text: first.part.text + " New condition." }), undefined);
  assert.equal(parashariLordPractitionerMalayalam({ ...par, withheld: true }, first.bhava, first.part), undefined);
  const report = buildReport(r, { plain: false, modules: ["parashari"], locale: "ml" });
  assert.ok(sections(report.sections).find((s) => s.id === `house-${first.bhava.house}`)?.paras.some((p) => p.text === first.ml && p.cites?.length));
});

test("KP evidence never drops extra facts and its timing retains none, one and every planet", () => {
  const f = { cusp: 7, subLord: "Venus" as const, used: [2, 7, 11], inHouse: 4, facts: [] };
  assert.match(kpHereMalayalam(f)!, /ശുക്രൻ/); assert.match(kpHereMalayalam(f)!, /11-ാം/);
  assert.match(kpHereMalayalam({ ...f, facts: ["in a dual sign", "in the star of the Moon", "in the sub of Mars"] })!, /ഉഭയരാശി/);
  assert.match(kpHereMalayalam({ ...f, facts: ["in the star of the Moon"] })!, /ചന്ദ്രന്റെ/);
  assert.equal(kpHereMalayalam({ ...f, facts: ["an unrecognized condition"] }), undefined);
  assert.match(kpTimingMalayalam([2, 7], [], 9), /ഗ്രഹങ്ങളില്ല/);
  assert.match(kpTimingMalayalam([2, 7], [], 9), /ഏതെങ്കിലും/);
  assert.match(kpTimingMalayalam([2, 7], ["Venus"], 9), /ശുക്രൻ/);
  assert.match(kpTimingMalayalam([2, 7], ["Venus"], 1), /എല്ലാ ഗ്രഹങ്ങളും/);
});

test("KP practitioner evidence retains every fact and rejects a changed aside", () => {
  const finding: KpFinding = { ruleId: "synthetic", cusp: 7, topic: "Marriage", text: "source", polarity: "neutral", source: "source", subLord: "Venus", used: [2, 7], inHouse: 4,
    facts: ["in the star of the Moon", "in the sub of Mars", "in a dual sign"], evidence: "Venus is the sub lord of cusp 7; signifies 2, 7; in the star of Moon; in the sub of Mars; in a dual sign; posited in the 4th" };
  const aside = `${finding.evidence} (${kpUsedGloss(finding.used)})`;
  const ml = kpEvidenceMalayalam(finding, aside)!;
  for (const word of ["ശുക്രൻ", "ചന്ദ്രന്റെ", "ചൊവ്വയുടെ", "ഉഭയരാശി", "4-ാം", "2-ാം", "7-ാം"]) assert.ok(ml.includes(word), word);
  assert.equal(kpEvidenceMalayalam(finding, `${aside}; new condition`), undefined);
  assert.equal(kpEvidenceMalayalam({ ...finding, facts: [...finding.facts!, "new condition"] }, aside), undefined);
  const doc: ReportDoc = { title: "Synthetic", subtitle: "", meta: [], generated: "", plain: false, modules: [], cites: [], sections: [{ id: "sample", title: "Sample", paras: [{ kind: "p", text: "Source", aside, asideTranslationMl: { source: aside, text: ml } }, { kind: "p", text: "Source", aside: `${aside}; edited`, asideTranslationMl: { source: aside, text: ml } }] }] };
  const translated = localizeReportMalayalam(doc).sections.find((s) => s.id === "sample")!;
  assert.equal(translated.paras[0].aside, ml);
  assert.equal(translated.paras[1].aside, `${aside}; edited`);
  const report = buildReport(result, { plain: false, modules: ["kp"], locale: "ml" });
  assert.ok(sections(report.sections).flatMap((s) => s.paras).some((p) => hasMalayalam(p.aside) && p.cites?.length));
});

test("Prasna house paraphrases and printed strength facts retain their source scope", () => {
  for (const effect of Object.values(PRASNA_HOUSE_EFFECT_PLAIN).flatMap((x) => [x.benefic, x.malefic])) {
    assert.ok(hasMalayalam(translate("ml", effect)), effect);
    assert.equal(translate("ml", `${effect} New condition.`), `${effect} New condition.`);
  }
  const lagna = result.jaimini.lagna.signIndex;
  const facts = computePrasnaFructification(result.positions, result.reading.strength, lagna);
  for (const f of facts) {
    assert.ok(hasMalayalam(plainFructificationMalayalam(f, result, lagna)), String(f.house));
    assert.equal(plainFructificationMalayalam({ ...f, notePlain: `Changed. ${f.notePlain}` }, result, lagna), undefined);
    assert.ok(hasMalayalam(practitionerFructificationMalayalam(f, result, lagna)), String(f.house));
    assert.equal(practitionerFructificationMalayalam({ ...f, note: `${f.note} New condition.` }, result, lagna), undefined);
  }
  const en = buildReport(result, { plain: true, modules: ["prasna"], locale: "en" });
  const ml = buildReport(result, { plain: true, modules: ["prasna"], locale: "ml" });
  const original = sections(en.sections).find((s) => s.id === "prasna")!;
  const translated = sections(ml.sections).find((s) => s.id === "prasna")!;
  const houses = original.paras.flatMap((p, i) => /^\d+(st|nd|rd|th) house:/.test(p.text ?? "") ? [{ p, m: translated.paras[i] }] : []);
  assert.equal(houses.length, 12);
  for (const { p, m } of houses) {
    assert.ok(hasMalayalam(m.text));
    assert.match(m.text!, /ഭാഗിക വിലയിരുത്തൽ/);
    assert.deepEqual(m.cites, p.cites);
    assert.equal(m.provisional, p.provisional);
  }
});

test("Prasna practitioner house and Gulika sources preserve qualifications and exact text", () => {
  const source = [...PRASNA_HOUSE_EFFECTS.flatMap((r) => [r.benefic, r.malefic]), ...PRASNA_BHAVA_SIGNIFICATIONS.map((r) => r.text), ...PRASNA_GULIKA_EFFECTS];
  assert.equal(source.length, 48);
  for (const text of source) {
    assert.ok(hasMalayalam(translate("ml", text)), text);
    assert.equal(translate("ml", `${text} New condition.`), `${text} New condition.`);
  }
  assert.match(translate("ml", PRASNA_HOUSE_EFFECTS[4].malefic), /അസ്തംഗതിയാലോ മറ്റോ പീഡിതമാണെങ്കിൽ/);
  assert.match(translate("ml", PRASNA_GULIKA_EFFECTS[4]), /സ്ഥാപിക്കാനാവില്ല/);
  const report = buildReport(result, { plain: false, modules: ["prasna"], locale: "ml" });
  const section = sections(report.sections).find((s) => s.id === "prasna")!;
  const houses = section.paras.filter((p) => /^\d+-ാം ഭാവം:/.test(p.text ?? ""));
  assert.equal(houses.length, 12);
  for (const p of houses) { assert.equal(p.provisional, true); assert.ok(p.cites?.length); }
});

test("all entered Prasna transit sources translate in both registers without restoring stronger text", () => {
  const sources = Object.values(PRASNA_TRANSIT_EFFECTS).flat() as string[];
  assert.equal(sources.length, 84);
  for (const source of sources) {
    assert.ok(hasMalayalam(translate("ml", source)), source);
    assert.ok(hasMalayalam(translate("ml", soften(source))), source);
    assert.equal(translate("ml", `${source} New condition.`), `${source} New condition.`);
  }
  const source = PRASNA_TRANSIT_EFFECTS.Saturn![4];
  assert.match(translate("ml", source), /സന്താനമരണം/);
  assert.match(translate("ml", soften(source)), /അപകടസാധ്യത/);
  assert.doesNotMatch(translate("ml", soften(source)), /സന്താനമരണം/);
});

test("all entered ALP rule sources have snapshot-matched Malayalam in both registers", () => {
  assert.equal(ALP_RULES.length, 108);
  assert.equal(Object.keys(MALAYALAM_ALP_RULES).length, ALP_RULES.length);
  for (const r of ALP_RULES) {
    assert.equal(ALP_SOURCE_SNAPSHOT[r.id], r.text, r.id);
    assert.ok(hasMalayalam(translate("ml", r.text)), r.id);
    assert.ok(hasMalayalam(translate("ml", soften(r.text))), r.id);
    assert.equal(translate("ml", `${r.text} New condition.`), `${r.text} New condition.`);
  }
  const sensitive = ALP_RULES.find((r) => r.id === "ch17-dasa-1-bhukti-9-nak-8")!;
  assert.match(translate("ml", sensitive.text), /മരണതുല്യ/);
  assert.doesNotMatch(translate("ml", soften(sensitive.text)), /മരണതുല്യ/);
});

test("entered BNN translations preserve source snapshots and all generated lord details", () => {
  for (const [id, ml] of Object.entries(MALAYALAM_BNN_RULES)) {
    const rule = RULES.find((r) => r.id === id);
    assert.ok(rule, id);
    assert.equal(rule.text, BNN_SOURCE_SNAPSHOT[id]);
    assert.ok(hasMalayalam(ml));
    assert.ok(hasMalayalam(translate("ml", rule.text)));
    assert.ok(hasMalayalam(translate("ml", soften(rule.text))));
    assert.equal(translate("ml", `${rule.text} New condition.`), `${rule.text} New condition.`);
  }
  const generated = RULES.filter((r) => r.id.includes("-star-") || /^(?:f-)?(?:ju|sa|ve|ma|ra|ke)-lord-/.test(r.id));
  assert.equal(generated.length, 89);
  for (const r of generated) {
    assert.ok(hasMalayalam(translate("ml", r.text)), r.id);
    assert.equal(translate("ml", `${r.text} New condition.`), `${r.text} New condition.`);
  }
  const original = RULES.find((r) => r.id === "mo-ke-fam")!;
  assert.match(translate("ml", original.text), /വേർപാട്/);
  assert.match(translate("ml", soften(original.text)), /അകലം/);
  assert.doesNotMatch(translate("ml", soften(original.text)), /വേർപാട്/);
});

test("ALP report translates recognized chart evidence without dropping new conditions", () => {
  const e = "the activated navamsa sign, Aquarius, is the 1st from the ALP lagna (self and how life is handled) and the 8th from the janma lagna";
  const ml = alpEvidenceClauseMalayalam(e)!;
  assert.ok(ml.includes("കുംഭം")); assert.ok(ml.includes("1-ാം")); assert.ok(ml.includes("8-ാം"));
  assert.equal(alpEvidenceClauseMalayalam(`${e}; another condition`), undefined);
  assert.equal(alpEvidenceClauseMalayalam(e.replace("self and how life is handled", "changed meaning")), undefined);
  const alp = defaultAlpForTopics(result, false);
  const eligible = alp.findings.filter((f) => f.here.every((h) => !!alpEvidenceClauseMalayalam(h)));
  assert.ok(eligible.length > 0);
  const en = buildReport(result, { plain: false, modules: ["alp"], locale: "en" });
  const translated = buildReport(result, { plain: false, modules: ["alp"], locale: "ml" });
  const a = sections(en.sections).find((s) => s.id === "alp")!;
  const b = sections(translated.sections).find((s) => s.id === "alp")!;
  for (const f of eligible) {
    const i = a.paras.findIndex((p) => p.text?.startsWith(f.text));
    assert.ok(i >= 0, f.ruleId);
    assert.ok(hasMalayalam(b.paras[i].text), f.ruleId);
    assert.deepEqual(b.paras[i].cites, a.paras[i].cites);
    assert.equal(b.paras[i].provisional, a.paras[i].provisional);
  }
});

test("Malayalam PDF embeds a font and preserves multi-page text without duplicating it", async (t) => {
  const probe = spawnSync("pdftotext", ["-v"], { encoding: "utf8" });
  if (probe.error) return t.skip("pdftotext is not installed");
  const text = Array.from({ length: 75 }, (_, i) => `${i + 1}. ജനനജാതകത്തിലെ സഹാധിപനും നക്ഷത്രാധിപനും ഒരുമിച്ച് പരിശോധിക്കുന്നു.`).join(" ");
  const doc: ReportDoc = { title: "Synthetic", subtitle: "", meta: [], generated: "", plain: true, modules: ["kp"], locale: "ml", cites: [], sections: [{ id: "sample", title: "സാധാരണ പരിശോധന", kicker: "വിദഗ്ധർക്കായി", paras: [{ kind: "p", lang: "ml", text }] }] };
  const pdf = renderReportPdf(result, doc);
  const chunks: Buffer[] = []; pdf.on("data", (c: Buffer) => chunks.push(c));
  await new Promise<void>((resolve, reject) => { pdf.on("end", resolve); pdf.on("error", reject); });
  const dir = mkdtempSync(join(tmpdir(), "nadi-ml-pdf-"));
  try {
    const path = join(dir, "report.pdf"); writeFileSync(path, Buffer.concat(chunks));
    const extracted = spawnSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" });
    assert.equal(extracted.status, 0, extracted.stderr);
    // A page footer can appear between a number and the following word in extracted text.
    const markers = Array.from(extracted.stdout.matchAll(/(?:^|\s)(\d{1,2})\.(?=\s)/g), (m) => Number(m[1]));
    assert.deepEqual(markers, Array.from({ length: 75 }, (_, i) => i + 1));
    assert.equal(extracted.stdout.match(/ജനനജാതകത്തിലെ/g)?.length, 75);
    assert.match(extracted.stdout, /സഹാധിപനും നക്ഷത്രാധിപനും/);
    assert.match(extracted.stdout, /വിദഗ്ധർക്കായി/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("reports preserve school sections, citations, gates and provisional flags across languages on published cases", () => {
  const fixture = JSON.parse(readFileSync("scripts/fixtures/school-topics-fresh-cases.json", "utf8"));
  for (const entry of fixture.cases) {
    const c = { ...entry, id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", timeStandard: "auto", timeUncertaintyMin: 5, notes: "", deathDate: null, events: [] } as Chart;
    const r = computeChart(c); r.now.asOf = `${entry.asOfDay}T12:00:00.000Z`;
    const en = buildReport(r, { plain: true }); const ml = buildReport(r, { plain: true, locale: "ml" });
    const enS = sections(en.sections), mlS = sections(ml.sections).filter((s) => s.id !== "translation-notice");
    assert.deepEqual(mlS.map((s) => s.id), enS.map((s) => s.id), entry.name);
    assert.deepEqual(ml.cites, en.cites, entry.name);
    for (let i = 0; i < enS.length; i++) {
      assert.equal(mlS[i].paras.length, enS[i].paras.length, `${entry.name} ${enS[i].id}`);
      for (let j = 0; j < enS[i].paras.length; j++) {
        assert.deepEqual(mlS[i].paras[j].cites, enS[i].paras[j].cites);
        assert.equal(mlS[i].paras[j].provisional, enS[i].paras[j].provisional);
      }
    }
    for (const id of ["bnn-career", "bnn-marriage", "parashari-plain-topics", "kp-plain-topics", "jaimini-plain-topics", "alp-plain-topics", "prasna-plain-topics"]) {
      const section = mlS.find((s) => s.id === id); assert.ok(section, `${entry.name} ${id}`);
      assert.ok(section!.paras.some((p) => hasMalayalam(p.text)), `${entry.name} ${id}`);
    }
  }
});

test("a stale or redacted source cannot restore a pre-redaction Malayalam translation", () => {
  const doc: ReportDoc = { title: "test", subtitle: "", meta: [], generated: "", plain: true, modules: [], cites: [], sections: [{ id: "x", title: "x", paras: [{ kind: "p", text: "Only the safe sentence remains.", translationMl: { source: "A longer removed sentence. Only the safe sentence remains.", text: "മറച്ചുവച്ച വാചകം" } }] }] };
  const p = localizeReportMalayalam(doc).sections.find((s) => s.id === "x")!.paras[0];
  assert.equal(p.text, "Only the safe sentence remains."); assert.equal(p.lang, "en"); assert.equal(p.translationMl, undefined);
  const minor = computeChart(chart("2018-01-01")); minor.now.asOf = "2026-11-01T12:00:00.000Z";
  const report = buildReport(minor, { plain: true, locale: "ml" });
  assert.ok(!sections(report.sections).some((s) => s.id === "bnn-marriage" || s.id === "bnn-career"));
});

test("fresh public charts preserve report structure, citations and provisional flags in both modes", () => {
  const fixture = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const prior = Settings.now;
  Settings.now = () => Date.parse(fixture.asOf);
  try {
    for (const entry of fixture.cases) {
      const r = computeChart({ ...chart(), ...entry });
      for (const plain of [true, false]) {
        const en = buildReport(r, { plain, locale: "en" });
        const ml = buildReport(r, { plain, locale: "ml" });
        const es = sections(en.sections), ms = sections(ml.sections).filter((s) => s.id !== "translation-notice");
        assert.deepEqual(ms.map((s) => s.id), es.map((s) => s.id), `${entry.name} ${plain}`);
        assert.deepEqual(ml.cites, en.cites);
        for (let i = 0; i < es.length; i++) {
          assert.equal(ms[i].paras.length, es[i].paras.length);
          for (let j = 0; j < es[i].paras.length; j++) {
            assert.deepEqual(ms[i].paras[j].cites, es[i].paras[j].cites);
            assert.equal(ms[i].paras[j].provisional, es[i].paras[j].provisional);
            assert.equal(ms[i].paras[j].kind, es[i].paras[j].kind);
          }
        }
      }
    }
  } finally { Settings.now = prior; }
});
