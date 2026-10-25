// Modern readings of combustion beside the verses (C3, C4), the practitioner details on the combust period lines (C5),
// and the periods' matters on the life-periods graphic (T3). Public figures only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { Chart } from "@shared/schema";
import type { Planet, PlanetPosition } from "@shared/astro";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "@shared/parashari";
import { combustPlanets, combustQualifiers, periodModernNotes } from "@shared/combustion-modern";
import { antarSignifications, dasaSignifications, itemAreas } from "@shared/parashari-period-significations";
import { computeChart } from "../server/routes";

const FIXTURES: Array<Record<string, unknown> & { name: string }> = JSON.parse(
  readFileSync("scripts/fixtures/public-figures.json", "utf8"),
).charts;
function chartOf(name: string) {
  const c0 = FIXTURES.find((c) => c.name === name)!;
  const r = computeChart({ id: 0, sunriseDef: "edge", parashariHouseMethod: "rashi", timeUncertaintyMin: 0, ...c0 } as unknown as Chart);
  const par = computeParashari(r.positions, r.jaimini.lagna.lon, r.utc, "2026-10-25T00:00:00Z", r.shadbala, r.dasaStarts, DEFAULT_ASPECT_FLOOR, false, "rashi");
  return { r, par };
}

test("combustion-modern: display only, read by the period card, the states list and the report alone", () => {
  const allowed = new Set(["client/src/components/parashari-panel.tsx", "shared/report/parashari.ts"]);
  const root = process.cwd();
  const importers: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && /combustion-modern["']/.test(readFileSync(full, "utf8")))
        importers.push(relative(root, full));
    }
  };
  for (const d of ["shared", "server", "client/src"]) walk(join(root, d));
  assert.deepEqual(importers.filter((f) => !allowed.has(f)), []);
  // Nothing modern enters the period's counted lines.
  const { par } = chartOf("Sachin Tendulkar");
  for (const d of par.dasaReadings) assert.ok(!d.notes.some((n) => n.id.includes("modern")), d.lord);
});

test("C3: a combust lord may deliver through the Sun; the Sun's period names its combust companions", () => {
  const t = chartOf("Sachin Tendulkar");
  const venus = periodModernNotes("Venus", t.r.positions);
  const through = venus.find((n) => n.id === "Venus-modern-through-sun")!;
  assert.equal(
    through.plain,
    "Close to the Sun, Venus may also deliver through the Sun's channels: authority, the father, standing. This is a modern reading.",
  );
  for (const s of ["3.8° from the Sun", "p. 6", "(p. 201)", "(p. 202)", "pp. 17-18", "verse 5"]) assert.ok(through.text.includes(s), s);
  const e = chartOf("Albert Einstein");
  assert.deepEqual(
    combustPlanets(e.r.positions).map((c) => c.planet),
    ["Mercury", "Saturn"],
  );
  const sun = periodModernNotes("Sun", e.r.positions);
  assert.equal(sun.length, 1);
  assert.ok(sun[0].plain!.startsWith("Mercury and Saturn are close to the Sun in this chart."));
  for (const s of ["Mercury 9.6°", "Saturn 10.7°", "47.7-11", "48.15", "50.84"]) assert.ok(sun[0].text.includes(s), s);
  // No combust planet, no line; the nodes are never combust.
  const g = chartOf("Mohandas Gandhi");
  assert.deepEqual(periodModernNotes("Sun", g.r.positions), []);
  for (const f of FIXTURES)
    assert.ok(!combustPlanets(chartOf(f.name).r.positions).some((c) => c.planet === "Rahu" || c.planet === "Ketu"));
});

test("C4: PVR's qualifiers are labelled, and the Venus one is for the practitioner view only", () => {
  const P = (planet: Planet, lon: number, dignity = "Neutral"): PlanetPosition =>
    ({ planet, lon, signIndex: Math.floor(lon / 30), dignity, retrograde: false }) as unknown as PlanetPosition;
  // A synthetic Libra cluster with the Sun debilitated.
  const pos = [P("Sun", 185, "Debilitated"), P("Jupiter", 190), P("Mars", 195), P("Venus", 180), P("Saturn", 30), P("Rahu", 186)];
  const ids = (pl: Planet) => combustQualifiers(pl, pos).map((n) => n.id);
  assert.deepEqual(ids("Jupiter"), ["Jupiter-modern-sun-debilitated", "Jupiter-modern-sun-friend"]);
  assert.deepEqual(ids("Mars"), ["Mars-modern-sun-debilitated", "Mars-modern-sun-friend"]);
  assert.deepEqual(ids("Venus"), ["Venus-modern-sun-debilitated", "Venus-modern-most-harmed"]);
  assert.deepEqual(ids("Saturn"), [], "not combust");
  assert.deepEqual(ids("Rahu"), [], "the nodes are exempt");
  const ju = combustQualifiers("Jupiter", pos);
  assert.ok(ju.every((n) => n.plain && n.text.startsWith("Modern (PVR Narasimha Rao)")));
  assert.ok(ju[1].text.includes("p. 202"), "the close-Jupiter caution stays in the practitioner text");
  assert.ok(!combustQualifiers("Mars", pos)[1].text.includes("p. 202"));
  const ve = combustQualifiers("Venus", pos).find((n) => n.id === "Venus-modern-most-harmed")!;
  assert.equal(ve.plain, undefined);
  // Tendulkar: the Sun is exalted, so only the Venus note.
  assert.deepEqual(
    combustQualifiers("Venus", chartOf("Sachin Tendulkar").r.positions).map((n) => n.id),
    ["Venus-modern-most-harmed"],
  );
});

test("C5: the combust period lines carry 9.19, the longevity-only exemption and the time-degree caveat as detail", () => {
  const t = chartOf("Sachin Tendulkar").par.dasaReadings.find((d) => d.lord === "Venus")!;
  const tv = t.notes.find((n) => n.id === "Venus-pd-20-57" || n.id === "Venus-pd-20-30")!;
  for (const s of ["Phaladeepika 9.19", "Saravali 40.10", "Brihat Jataka 7.2", "time-degrees at the horizon"])
    assert.ok(tv.detail!.includes(s), s);
  assert.ok(!tv.text.includes("9.19"), "no plain wording");
  const e = chartOf("Albert Einstein").par.dasaReadings.find((d) => d.lord === "Mercury")!;
  const em = e.notes.find((n) => n.id === "Mercury-pd-20-57" || n.id === "Mercury-pd-20-30")!;
  assert.ok(em.detail!.includes("Phaladeepika 9.19") && em.detail!.includes("time-degrees"));
  assert.ok(!em.detail!.includes("Saravali 40.10"), "the exemption is for Venus and Saturn");
});

test("T3: the life-periods line carries the period's matters, with the minor's holds of the Timing line", () => {
  const { r, par } = chartOf("Albert Einstein");
  const adult = { birthIso: r.utc, asOfIso: "1930-01-01T00:00:00Z", withheld: false };
  const minor = { birthIso: r.utc, asOfIso: "1889-01-01T00:00:00Z", withheld: true };
  let heldSeen = 0;
  for (const d of par.dasaReadings) {
    const k = dasaSignifications(d, r.positions, adult);
    assert.ok(k.timelinePlain.startsWith(`${d.lord} period: `), k.timelinePlain);
    assert.ok(!/\d\.\d|\(|condition/.test(k.timelinePlain), `plain words alone: ${k.timelinePlain}`);
    assert.ok(k.timeline.startsWith(`${d.lord} dasa (Parashara 47.2; Phaladeepika 21.1): `), k.timeline);
    assert.ok(k.timeline.includes(`; condition ${k.tag}.`), k.timeline);
    // A minor: the held items leave both lines, and the hold is said.
    const m = dasaSignifications(d, r.positions, minor);
    if (m.held.length) {
      heldSeen++;
      assert.ok(m.timeline.includes("Held for later:") && m.timelinePlain.includes("held for later"));
      const heldAreas = new Set(m.held.map((h) => h.area));
      for (const s of k.entries)
        for (const it of s.word.split(/,\s*/))
          if (itemAreas(it).some((a) => heldAreas.has(a)))
            // The plain hold names the area ("Matters of marriage from 18 are held for later"), so check the list.
            assert.ok(!m.timeline.includes(`${it} (`) && !m.timelinePlain.split(" Matters of ")[0].includes(it), `${d.lord}: ${it}`);
    }
    for (const a of d.antars.slice(0, 2)) {
      const ka = antarSignifications(d.lord, a, adult);
      assert.ok(ka.timelinePlain.startsWith(`${a.lord} sub-period: `));
      assert.ok(ka.timeline.startsWith(`${d.lord}–${a.lord} bhukti: `) && ka.timeline.includes(`(Parashara ch. ${a.entry.ch})`));
    }
  }
  assert.ok(heldSeen > 0, "some period holds matters for a minor");
  // The condition tag follows the period's own combustion line (Phaladeepika 20.57 for a relieved combust lord).
  const me = par.dasaReadings.find((d) => d.lord === "Mercury")!;
  const km = dasaSignifications(me, r.positions, adult);
  if (me.notes.some((n) => n.id === "Mercury-pd-20-57")) assert.ok(km.tag.includes("Phaladeepika 20.57"));
  else assert.ok(km.tag.includes("Phaladeepika 20.30"));
});
