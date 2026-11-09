import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { computeChart } from "../server/routes";
import { appendixTableHeadMalayalam, appendixTableRowMalayalam } from "../shared/malayalam-appendix-tables";
import { ANTAR_DASA } from "../shared/parashari-dasa-data";
import { ANTAR_CONDITION_ML } from "../shared/malayalam-antar-conditions";
import { buildReport, type ReportSection } from "../shared/report";
import type { Chart } from "../shared/schema";

test("nakshatra and house rows retain all named quarters, distinctions and placements", () => {
  const nakHead = ["Point", "Star · quarter", "Star lord", "D9 sign", "Qualifications", "BNN solar quarter"];
  const n = appendixTableRowMalayalam(nakHead, ["Sun", "Purva Ashadha 3", "Venus", "Libra", "vargottama, Sutton gandanta, D9 exaltation", "near, different quarter"]);
  assert.ok(n);
  assert.match(n[1], /3-ാം പാദം/);
  assert.match(n[4], /വർഗോത്തമം.*ഗണ്ഡാന്തം.*ഉച്ചം/);
  assert.match(n[5], /സമീപം.*മറ്റൊരു പാദം/);
  assert.equal(appendixTableRowMalayalam(nakHead, ["Sun", "Purva Ashadha 3", "Venus", "Libra", "vargottama, unknown condition", "same quarter"]), undefined);
  const quarters = appendixTableRowMalayalam(["Bhava chalit (equal) house", "Intersecting stars and quarters (partial where marked)"], ["H12", "Aries · Ashwini 1 (partial), 2–4; Taurus · Krittika 2, 3 (partial)"]);
  assert.ok(quarters);
  assert.match(quarters[0], /12-ാം/);
  assert.match(quarters[1], /1 \(ഭാഗികം\), 2–4/);
  assert.match(quarters[1], /2, 3 \(ഭാഗികം\)/);
  assert.equal(appendixTableRowMalayalam(["Bhava chalit (equal) house", "Intersecting stars and quarters (partial where marked)"], ["H12", "Aries · Ashwini 1 (unverified)"]), undefined);
  const loc = appendixTableRowMalayalam(["Point", "Sign lord", "Star lord", "D9 sign lord"], ["Ascendant", "Venus: D1 Libra, H1 (1st sign from point); D9 Taurus, H8", "Sun: position unavailable", "Jupiter: D1 Sagittarius (3rd sign from point); D9 Pisces"]);
  assert.ok(loc);
  assert.match(loc[1], /D1.*1-ാം ഭാവം.*1-ാം രാശി.*D9.*8-ാം ഭാവം/);
  assert.match(loc[2], /സ്ഥാനം ലഭ്യമല്ല/);
  assert.match(loc[3], /3-ാം രാശി/);
});

test("period tables retain dates, ages and the running or passing qualification", () => {
  const head = ["ALP sign", "From", "To", "Ages"];
  const row = ["Libra (at passing)", "1 Jan 2019", "2 Jan 2020", "35–36"];
  const result = appendixTableRowMalayalam(head, row);
  assert.ok(result);
  assert.match(result[0], /വിയോഗസമയത്ത്/);
  assert.deepEqual(result.slice(1), row.slice(1));
  assert.equal(appendixTableRowMalayalam(head, ["Libra (at passing; tentative)", ...row.slice(1)]), undefined);
  assert.equal(appendixTableRowMalayalam([...head, "Source"], [...row, "book"]), undefined);
});

test("varga grid and strength tables preserve every value and distinction", () => {
  const head = ["", "D1", "D2", "D3", "D4", "D7", "D9", "D10", "D12", "D16", "D20", "D24", "D27", "D30", "D40", "D45", "D60"];
  const row = ["Sa (V)", ...Array.from({ length: 16 }, (_, i) => i % 2 ? "Li" : "Ar")];
  const ml = appendixTableRowMalayalam(head, row);
  assert.ok(ml);
  assert.match(ml[0], /ശനി.*വർഗോത്തമം/);
  assert.equal(ml.length, row.length);
  assert.equal(ml[1], ml[3]);
  assert.notEqual(ml[1], ml[2]);
  assert.equal(appendixTableRowMalayalam(head, [...row.slice(0, -1), "unknown"]), undefined);
  const strengthHead = ["Planet", "Sthana", "Dig", "Kala", "Chesta", "Naisargika", "Drik", "Total", "Required", "Standing"];
  const strength = ["Saturn", "2.00", "0.20", "1.42", "0.80", "0.12", "-0.30", "4.24", "5.00", "weak (0.85)"];
  const translated = appendixTableRowMalayalam(strengthHead, strength);
  assert.ok(translated);
  assert.deepEqual(translated.slice(1, 9), strength.slice(1, 9));
  assert.match(translated[9], /ബലം കുറഞ്ഞത് \(0.85\)/);
  assert.equal(appendixTableRowMalayalam(strengthHead, [...strength.slice(0, 9), "weak (0.85; estimated)"]), undefined);
  const d = appendixTableRowMalayalam(["Dasa", "From", "To", "Ages", "Parashara's tone"], ["Mars (running)", "1 Jan 2021", "1 Jan 2028", "38–45", "leans favourable (5 favourable, 2 trying)"]);
  assert.ok(d);
  assert.match(d[0], /നടക്കുന്നു/);
  assert.equal(d[3], "38–45");
  assert.match(d[4], /5 അനുകൂലം, 2 ബുദ്ധിമുട്ട്/);
  const ashtakaHead = ["House", "Sign", "Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Lagna", "Sarva", "Band"];
  const a = ["1st", "Libra", "4", "4", "3", "5", "2", "5", "1", "2", "24", "adverse"];
  const aMl = appendixTableRowMalayalam(ashtakaHead, a);
  assert.ok(aMl);
  assert.deepEqual(aMl.slice(2, 11), a.slice(2, 11));
  assert.equal(aMl[11], "പ്രതികൂലം");
  assert.equal(appendixTableHeadMalayalam(ashtakaHead)?.length, ashtakaHead.length);
  assert.equal(appendixTableHeadMalayalam([...ashtakaHead, "extra"]), undefined);
  const scheme = ["Planet", "Shadvarga (of 20)", "Saptavarga (of 20)", "Dasavarga (of 20)", "Shodasavarga (of 20)", "Designation"];
  const v = appendixTableRowMalayalam(scheme, ["Sun", "4.0 below five", "6.0 some good", "12.0 middling", "18.0 wholly favourable", "Chaamara, Chandana Vana"]);
  assert.ok(v);
  assert.match(v[1], /4.0.*അഞ്ചിൽ താഴെ/);
  assert.match(v[4], /18.0.*അനുകൂലം/);
  assert.equal(appendixTableRowMalayalam(scheme, ["Sun", "4.0 below five", "6.0 some good", "12.0 middling", "18.0 wholly favourable", "Unrecognized"]), undefined);
});

test("pada and natal cusp rows preserve topic, planets, house lists and ineligible raw status", () => {
  const pada = ["Pada", "Of the", "House sign", "Lord", "Falls in", "Matters"];
  const p = appendixTableRowMalayalam(pada, ["A8", "8th", "Scorpio", "Mars", "Aries", "longevity, inheritance, secrets"]);
  assert.ok(p);
  assert.equal(p[0], "പദം A8");
  assert.match(p[5], /ആയുർദൈർഘ്യം.*അനന്തരാവകാശം.*രഹസ്യങ്ങൾ/);
  assert.equal(appendixTableRowMalayalam(pada, ["A8", "8th", "Scorpio", "Mars", "Aries", "longevity, inheritance, secrets, extra"]), undefined);
  assert.equal(appendixTableRowMalayalam(pada, ["A7", "8th", "Scorpio", "Mars", "Aries", "longevity, inheritance, secrets"]), undefined);
  const cusp = ["Matter", "Script", "Cusp stage", "Planet", "Star houses", "Sub houses", "Status"];
  const row = ["Marriage", "Mixed v2", "Cusp 7 sub lord", "Venus", "Moon: 2, 7, 11", "Saturn: 1, 12", "not counted (raw: supported-with-caution)"];
  const c = appendixTableRowMalayalam(cusp, row);
  assert.ok(c);
  assert.match(c[2], /7-ാം.*സഹാധിപൻ/);
  assert.match(c[4], /2, 7, 11/);
  assert.match(c[5], /1, 12/);
  assert.match(c[6], /കണക്കിലെടുത്തിട്ടില്ല.*അടിസ്ഥാന സ്ഥിതി.*ജാഗ്രത/);
  assert.equal(appendixTableRowMalayalam(cusp, [...row.slice(0, 6), "not counted (raw: changed-condition)"]), undefined);
  assert.equal(appendixTableRowMalayalam(cusp, [...row.slice(0, 4), "Moon: 13", ...row.slice(5)]), undefined);
  const varga = ["Chart", "Matter house", "House lord", "Occupants", "Full aspects"];
  const v = appendixTableRowMalayalam(varga, ["D9", "house 7: Taurus", "Venus in house 2, Libra (own sign)", "Moon, Saturn", "none"]);
  assert.ok(v);
  assert.equal(v[0], "D9");
  assert.match(v[1], /7-ാം ഭാവം/);
  assert.match(v[2], /2-ാം ഭാവത്തിൽ.*സ്വക്ഷേത്രം/);
  assert.match(v[3], /ചന്ദ്രൻ.*ശനി/);
  assert.equal(v[4], "ഒന്നുമില്ല");
  assert.equal(appendixTableRowMalayalam(varga, ["D9", "house 7: Taurus", "Venus in house 2, Libra (other new condition)", "Moon", "none"]), undefined);
});

test("Saturn and Mars bhukti conditions match complete sources and preserve unknown/redacted wording", () => {
  const head = ["Bhukti", "From", "To", "Favourable when", "Trying when"];
  let seen = 0;
  for (const [name, entry] of [...Object.entries(ANTAR_DASA.Saturn), ...Object.entries(ANTAR_DASA.Mars)]) {
    if (!entry) continue;
    seen++;
    assert.ok(ANTAR_CONDITION_ML[entry.favourable.conditions], `favourable ${name}`);
    assert.ok(ANTAR_CONDITION_ML[entry.adverse.conditions], `adverse ${name}`);
    const row = [`${name} (running)`, "1 Jan 2020", "31 Jan 2021", entry.favourable.conditions, entry.adverse.conditions];
    const ml = appendixTableRowMalayalam(head, row);
    assert.ok(ml);
    assert.match(ml[0], /നടക്കുന്നു/);
    assert.deepEqual(ml.slice(1, 3), row.slice(1, 3));
    assert.equal(ml[3], ANTAR_CONDITION_ML[row[3]]);
    assert.equal(ml[4], ANTAR_CONDITION_ML[row[4]]);
    const changed = `${row[4]} Additional condition.`;
    assert.equal(appendixTableRowMalayalam(head, [...row.slice(0, 4), changed])?.[4], changed);
  }
  assert.equal(seen, 18);
});

test("practitioner report applies row translations without changing table structure or citations", () => {
  const data = JSON.parse(readFileSync("research/malayalam-technical/cases.json", "utf8"));
  const sample = data.cases[0];
  const result = computeChart({ id: 0, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", timeUncertaintyMin: 0, events: [], ...sample } as Chart);
  const flatten = (s: ReportSection[]): ReportSection[] => s.flatMap((x) => [x, ...flatten(x.sub ?? [])]);
  const en = buildReport(result, { plain: false, locale: "en" });
  const ml = buildReport(result, { plain: false, locale: "ml" });
  assert.deepEqual(ml.cites, en.cites);
  const a = flatten(en.sections), b = flatten(ml.sections).filter((s) => s.id !== "translation-notice");
  let matched = 0;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < a[i].paras.length; j++) {
    const p = a[i].paras[j], q = b[i].paras[j];
    for (let k = 0; k < (p.rows?.length ?? 0); k++) {
      const expected = appendixTableRowMalayalam(p.head, p.rows![k]);
      if (!expected) continue;
      matched++;
      assert.deepEqual(q.rows?.[k], expected);
      assert.equal(q.rows?.[k].length, p.rows![k].length);
    }
  }
  assert.ok(matched >= 20, `only ${matched} recognised rows`);
});
