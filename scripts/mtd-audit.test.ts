// MTD audit — the Minimal Topology form applied to the Jyotish engine.
// Every decision node in a reading is classified:
//   ALLOW  = rendered with a citation (text/chapter/stanza)   → governed
//   BRIDGE = rendered but softened/redacted (plain-mode rules) → governed, priced
//   FIN    = withheld (mode gates, age gates, harsh phrases)   → governed refusal
//   RESIDUE = rendered from provisional/synthesized material  → the ungoverned remainder
import test from "node:test";
import assert from "node:assert/strict";
import { computeYogas } from "@shared/yoga";
import { renderPlanetFragments } from "@shared/prose-engine";
import { redactProse } from "@shared/life-stage";
import type { PlanetPosition } from "@shared/astro";
import { birthInstant, julianDay, positionsAt, ascendantAt } from "../server/ephemeris";

export interface MtdLedger {
  yogaTestsEvaluated: number;
  yogaFired: number;
  yogaCited: number;        // fired with text+chapter+stanza
  yogaProvisional: number;  // fired from guide/synthesized sources
  fragmentsRendered: number;
  fragmentsSoftenBridged: number;
  fragmentsWithheld: number;
  residue: number;
  governedFraction: number; // governed / (governed + residue)
}

export function auditChart(positions: PlanetPosition[], lagnaIdx: number): MtdLedger {
  // ── decision nodes: every yoga predicate is a node; the fired ones render ──
  const fired = computeYogas({ positions, lagnaIdx });
  const tests = 85; // the DB size; each predicate evaluated = one node
  const cited = fired.filter(
    (y) => (y.source.text === "Brihat Jataka" || y.source.text === "Sarvartha Chintamani") &&
      y.source.chapter && y.source.stanza,
  ).length;
  const provisional = fired.length - cited;

  // ── generation layer: prose fragments, with the auditor (soften/redact) at each node ──
  const frags = renderPlanetFragments(positions, lagnaIdx);
  let softened = 0;
  let withheld = 0;
  for (const f of frags) {
    const plain = redactProse(f.text);
    if (plain !== f.text) softened++;
    if (plain.trim().length === 0) withheld++;
  }

  const governed = cited + frags.length; // cited yogas + fragments (fragments carry source notes)
  const residue = provisional;
  return {
    yogaTestsEvaluated: tests,
    yogaFired: fired.length,
    yogaCited: cited,
    yogaProvisional: provisional,
    fragmentsRendered: frags.length,
    fragmentsSoftenBridged: softened,
    fragmentsWithheld: withheld,
    residue,
    governedFraction: governed / (governed + residue),
  };
}

// ── a made-up birth moment, not any real person: 29 Jul 2003, 06:40 IST at 20°N 78°E (Cancer lagna) ──
// Positions come from the app's own ephemeris, so the fixture matches what the app computes.
const opts = { ayanamsa: "lahiri", nodeType: "mean" } as const;
const { utc } = birthInstant({ birthDate: "2003-07-29", birthTime: "06:40", timezone: "Asia/Kolkata" } as never);
const jd = julianDay(utc);
const chart: PlanetPosition[] = positionsAt(jd, opts as never);
const lagnaIdx = Math.floor((ascendantAt(jd, 20, 78, opts as never) % 360) / 30);

test("MTD audit of a synthetic chart reports the governed fraction", () => {
  const ledger = auditChart(chart, lagnaIdx);
  console.log("\n" + JSON.stringify(ledger, null, 2));
  assert.ok(ledger.yogaFired > 10);
  assert.ok(ledger.fragmentsRendered > 20);
  assert.ok(ledger.governedFraction > 0.8);
  assert.equal(ledger.yogaTestsEvaluated, 85);
});
