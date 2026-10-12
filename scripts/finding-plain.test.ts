/**
 * Plain meanings for the Parashari combinations (shared/finding-plain.ts): every combination the
 * Combinations chapter can show has a plain line and a gist, the lines are gentle, the minors' gate
 * strips them with the findings, the solar yogas reverse for malefics, and every id in the table is
 * one the code can produce.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

import type { Chart } from "@shared/schema";
import { computeParashari, type ParashariFinding } from "@shared/parashari";
import { plainMeaning } from "@shared/finding-plain";
import { isSensitive } from "@shared/gentle";
import { withholdText } from "@shared/life-stage";
import { computeChart } from "../server/routes";

const base: Chart = {
  id: 0,
  name: "Synthetic",
  gender: "female",
  birthDate: "1975-03-14",
  birthTime: "06:10",
  timezone: "UTC",
  timeStandard: "auto",
  place: "Chennai, India",
  latitude: 13.0827,
  longitude: 80.2707,
  ayanamsa: "lahiri",
  nodeType: "mean",
  sunriseDef: "edge",
  parashariHouseMethod: "rashi",
  notes: "",
  deathDate: null,
  timeUncertaintyMin: 0,
  events: [],
};
const AS_OF = "2026-10-11T12:00:00.000Z";
const BIRTHS = [
  ["1948-01-07", "01:10"],
  ["1962-04-19", "13:25"],
  ["1975-03-14", "06:10"],
  ["1983-08-02", "01:10"],
  ["1997-11-23", "13:25"],
  ["2004-04-19", "01:10"],
];

function combos(withhold: boolean): ParashariFinding[] {
  const out: ParashariFinding[] = [];
  for (const [birthDate, birthTime] of BIRTHS) {
    const r = computeChart({ ...base, birthDate, birthTime });
    const p = computeParashari(
      r.positions,
      r.jaimini.lagna.lon,
      r.utc,
      AS_OF,
      r.shadbala,
      r.dasaStarts,
      undefined,
      withhold,
    );
    out.push(
      ...p.findings.filter((f) => f.kind === "yoga" || f.kind === "strain"),
    );
  }
  return out;
}

test("every combination shown has a plain line and a gist, in gentle words", () => {
  const all = combos(false);
  assert.ok(all.length > 50);
  for (const f of all) {
    assert.ok(f.plain && f.gist, `${f.id} (${f.title}) has no plain meaning`);
    assert.ok(!isSensitive(f.plain!), `${f.id}: ${f.plain}`);
    assert.ok(
      !/\bkingly\b|\bthe native\b/i.test(f.plain!),
      `${f.id} keeps the old register: ${f.plain}`,
    );
    assert.ok(f.gist!.length <= 40, `${f.id} gist too long: ${f.gist}`);
  }
});

test("the minors' gate leaves no withheld topic in a plain line", () => {
  for (const f of combos(true))
    if (f.plain) assert.ok(!withholdText(f.plain), `${f.id}: ${f.plain}`);
});

test("solar yogas formed by malefics reverse their gifts", () => {
  const f = (tone: ParashariFinding["tone"]): ParashariFinding => ({
    id: "pa-solar-vesi",
    kind: "yoga",
    title: "Vesi yoga",
    text: "",
    tone,
    planets: ["Sun", "Mars"],
    source: { label: "Parashara 38.1-4", url: "" },
  });
  assert.match(plainMeaning(f("strain"))!.plain, /reverses/);
  assert.doesNotMatch(plainMeaning(f("support"))!.plain, /reverses/);
  assert.match(plainMeaning(f("mixed"))!.plain, /mixed/);
});

test("every id in the table is one the code produces", () => {
  const src = readdirSync("shared")
    .filter((n) => n.startsWith("parashari") && n.endsWith(".ts"))
    .map((n) => readFileSync(`shared/${n}`, "utf8"))
    .join("\n");
  const table = readFileSync("shared/finding-plain.ts", "utf8");
  const ids = Array.from(table.matchAll(/^\s+"(pa-[a-z0-9-]+)":/gm)).map(
    (m) => m[1],
  );
  assert.ok(ids.length > 80);
  for (const id of ids) {
    const nabhasa = /^pa-nabhasa-(.+)$/.exec(id)?.[1];
    const found =
      src.includes(`"${id}"`) ||
      (nabhasa !== undefined && src.includes(`akriti("${nabhasa}"`)) ||
      (/^pa-yoga-(hari|hara|brahma)$/.test(id) &&
        src.includes(`tri("${id.slice(8)}"`));
    assert.ok(found, `${id} is not produced anywhere`);
  }
});
