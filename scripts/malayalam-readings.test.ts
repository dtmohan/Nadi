import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { RULES, type Finding } from "../shared/rules";
import { synthesizeArea } from "../shared/synthesis";
import { plainTopicNatal } from "../shared/topic-brief";
import { translate } from "../shared/localization";
import { soften } from "../shared/gentle";
import { KP_RULES, kpFindingPlain } from "../shared/rules-kp";
import { ALP_PLAIN_TOPIC_RULES, expandedSchoolTopicBriefs } from "../shared/school-topics-expanded";
import { agreementInput, computeAgreement } from "../shared/agreement";
import { buildReport, localizeReportMalayalam, type ReportDoc, type ReportSection } from "../shared/report";
import { bnnFindingContext } from "../shared/chart-explanations";
import { kpHereMalayalam, kpTimingMalayalam, parashariLordMalayalam } from "../shared/school-topic-malayalam";
import { renderReportPdf } from "../server/report-pdf";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { Chart } from "../shared/schema";
import type { BriefSchool } from "../shared/school-topic-brief";

const chart = (birthDate = "1990-01-01"): Chart => ({ id: 0, name: "Synthetic", gender: "male", birthDate, birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart);
const result = computeChart(chart());
result.now.asOf = "2026-11-01T12:00:00.000Z";
const hasMalayalam = (s: string | undefined) => /[\u0d00-\u0d7f]/.test(s ?? "");
const sections = (ss: ReportSection[]): ReportSection[] => ss.flatMap((s) => [s, ...sections(s.sub ?? [])]);

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

test("BNN evidence retains actual relation, retrograde convention, and time uncertainty", () => {
  const f: Finding = { ruleId: "example", area: "career", text: "example", score: 2, planets: ["Saturn", "Mercury"], relation: "trine", viaRetro: true, band: { minutes: 2 }, source: "Example source" };
  const e = bnnFindingContext(f);
  assert.match(e.textMl, /ശനി/); assert.match(e.textMl, /ബുധൻ/); assert.match(e.textMl, /അഞ്ചാം അല്ലെങ്കിൽ ഒമ്പതാം/);
  assert.match(e.textMl, /വക്രഗതി/); assert.match(e.textMl, /ജനനസമയ പരിധി/); assert.equal(e.source, "Example source");
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

test("KP evidence never drops extra facts and its timing retains none, one and every planet", () => {
  const f = { cusp: 7, subLord: "Venus" as const, used: [2, 7, 11], inHouse: 4, facts: [] };
  assert.match(kpHereMalayalam(f)!, /ശുക്രൻ/); assert.match(kpHereMalayalam(f)!, /11-ാം/);
  assert.equal(kpHereMalayalam({ ...f, facts: ["in a dual sign"] }), undefined);
  assert.match(kpTimingMalayalam([2, 7], [], 9), /ഗ്രഹങ്ങളില്ല/);
  assert.match(kpTimingMalayalam([2, 7], [], 9), /ഏതെങ്കിലും/);
  assert.match(kpTimingMalayalam([2, 7], ["Venus"], 9), /ശുക്രൻ/);
  assert.match(kpTimingMalayalam([2, 7], ["Venus"], 1), /എല്ലാ ഗ്രഹങ്ങളും/);
});

test("Malayalam PDF embeds a font and preserves multi-page text without duplicating it", async (t) => {
  const probe = spawnSync("pdftotext", ["-v"], { encoding: "utf8" });
  if (probe.error) return t.skip("pdftotext is not installed");
  const text = Array.from({ length: 75 }, (_, i) => `${i + 1}. ജനനജാതകത്തിലെ സഹാധിപനും നക്ഷത്രാധിപനും ഒരുമിച്ച് പരിശോധിക്കുന്നു.`).join(" ");
  const doc: ReportDoc = { title: "Synthetic", subtitle: "", meta: [], generated: "", plain: true, modules: ["kp"], locale: "ml", cites: [], sections: [{ id: "sample", title: "സാധാരണ പരിശോധന", paras: [{ kind: "p", lang: "ml", text }] }] };
  const pdf = renderReportPdf(result, doc);
  const chunks: Buffer[] = []; pdf.on("data", (c: Buffer) => chunks.push(c));
  await new Promise<void>((resolve, reject) => { pdf.on("end", resolve); pdf.on("error", reject); });
  const dir = mkdtempSync(join(tmpdir(), "nadi-ml-pdf-"));
  try {
    const path = join(dir, "report.pdf"); writeFileSync(path, Buffer.concat(chunks));
    const extracted = spawnSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" });
    assert.equal(extracted.status, 0, extracted.stderr);
    const markers = Array.from(extracted.stdout.matchAll(/(?:^|\s)(\d{1,2})\.\s*ജനനജാതകത്തിലെ/g), (m) => Number(m[1]));
    assert.deepEqual(markers, Array.from({ length: 75 }, (_, i) => i + 1));
    assert.match(extracted.stdout, /സഹാധിപനും നക്ഷത്രാധിപനും/);
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
