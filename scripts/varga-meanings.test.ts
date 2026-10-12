// Guards for what each divisional chart is for and which of its houses the sources read (display
// only). No chart is computed here.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { VARGAS } from "@shared/vargas";
import { sensitiveTags, withholdText } from "@shared/life-stage";
import {
  VARGA_MEANINGS,
  VARGA_MEANING_BY_KEY,
  VARGA_MEANING_NOTES,
  houseOrdinal,
  housesRead,
} from "@shared/varga-meanings";

test("varga meanings: one entry per chart, in the chart order", () => {
  assert.deepEqual(
    VARGA_MEANINGS.map((m) => m.key),
    VARGAS.map((d) => d.key),
  );
});

test("varga meanings: every house read is a house, names a source, and links Parashara's verses", () => {
  for (const m of VARGA_MEANINGS) {
    for (const h of m.houses) {
      assert.ok(h.house >= 1 && h.house <= 12, `${m.key} ${h.house}`);
      assert.ok(h.cites.length > 0, `${m.key} ${h.house}`);
      for (const c of h.cites) if (c.voice === "Parashara") assert.ok(c.url, `${m.key} ${c.ref}`);
    }
    assert.equal(new Set(m.houses.map((h) => h.house)).size, m.houses.length, m.key);
    if (m.notByHouses) assert.equal(m.houses.length, 0, m.key);
  }
  // The birth chart's houses are 11.2-13 itself; the hora and trimsamsa are not read by houses.
  assert.equal(VARGA_MEANING_BY_KEY.D1.houses.length, 0);
  assert.ok(VARGA_MEANING_BY_KEY.D2.notByHouses && VARGA_MEANING_BY_KEY.D30.notByHouses);
  assert.deepEqual(VARGA_MEANING_BY_KEY.D9.houses.map((h) => h.house), [1, 7]);
  assert.deepEqual(VARGA_MEANING_BY_KEY.D12.houses.map((h) => h.house), [1, 4, 9]);
  assert.deepEqual(VARGA_MEANING_BY_KEY.D24.houses.map((h) => h.house), [4, 5]);
});

test("varga meanings: the plain words pass the age gate; only Mehta's arishta line is hidden for a minor", () => {
  const plain: string[] = [VARGA_MEANING_NOTES.base, VARGA_MEANING_NOTES.time, VARGA_MEANING_NOTES.houses];
  const flagged: string[] = [];
  for (const m of VARGA_MEANINGS) {
    plain.push(m.plain, ...m.houses.map((h) => h.plain));
    if (m.notByHouses) plain.push(m.notByHouses.plain);
    for (const s of [m.mehta?.text, m.pande?.text, m.notByHouses?.text, ...m.houses.map((h) => h.text)])
      if (s && withholdText(s)) flagged.push(m.key);
  }
  for (const s of plain) assert.deepEqual(sensitiveTags(s), [], s);
  assert.deepEqual(flagged, ["D30"]);
});

test("varga meanings: house labels", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12].map(houseOrdinal), ["1st", "2nd", "3rd", "4th", "11th", "12th"]);
  assert.equal(housesRead(VARGA_MEANING_BY_KEY.D7), "lagna, 5th");
  assert.equal(housesRead(VARGA_MEANING_BY_KEY.D12), "lagna, 4th, 9th");
  assert.equal(housesRead(VARGA_MEANING_BY_KEY.D2), "not read by houses");
  assert.equal(housesRead(VARGA_MEANING_BY_KEY.D60), "none named");
});

test("varga meanings: display only, imported by display code alone", () => {
  const root = process.cwd();
  const importers: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && /(@shared|\.)\/varga-meanings["']/.test(readFileSync(full, "utf8")))
        importers.push(relative(root, full));
    }
  };
  for (const d of ["shared", "server", "client/src"]) walk(join(root, d));
  assert.deepEqual(importers, ["client/src/components/varga-meanings.tsx"]);
});
