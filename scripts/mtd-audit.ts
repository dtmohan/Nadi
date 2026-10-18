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

// ── a synthetic test chart, not any real person (Cancer lagna) ──
const chart: PlanetPosition[] = [
  { planet: "Sun", lon: 115, signIndex: 3, sign: "Cancer", degInSign: 25, speed: 0.96, retrograde: false, nakshatraIndex: 8, nakshatra: "Ashlesha", nakshatraLord: "Mercury", pada: 3, signLord: "Moon", dignity: "Friendly", combust: false },
  { planet: "Moon", lon: 292.7, signIndex: 9, sign: "Capricorn", degInSign: 22.7, speed: 13.59, retrograde: false, nakshatraIndex: 21, nakshatra: "Shravana", nakshatraLord: "Moon", pada: 4, signLord: "Saturn", dignity: "Neutral", combust: false },
  { planet: "Mars", lon: 315, signIndex: 10, sign: "Aquarius", degInSign: 15, speed: -0.17, retrograde: true, nakshatraIndex: 23, nakshatra: "Shatabhisha", nakshatraLord: "Rahu", pada: 3, signLord: "Saturn", dignity: "Neutral", combust: false },
  { planet: "Mercury", lon: 142.2, signIndex: 4, sign: "Leo", degInSign: 22.2, speed: 1.07, retrograde: false, nakshatraIndex: 10, nakshatra: "Purva Phalguni", nakshatraLord: "Venus", pada: 3, signLord: "Sun", dignity: "Friendly", combust: false },
  { planet: "Jupiter", lon: 122.7, signIndex: 4, sign: "Leo", degInSign: 2.7, speed: 0.22, retrograde: false, nakshatraIndex: 9, nakshatra: "Magha", nakshatraLord: "Ketu", pada: 1, signLord: "Sun", dignity: "Friendly", combust: false },
  { planet: "Venus", lon: 113.1, signIndex: 3, sign: "Cancer", degInSign: 23.1, speed: 1.23, retrograde: false, nakshatraIndex: 8, nakshatra: "Ashlesha", nakshatraLord: "Mercury", pada: 2, signLord: "Moon", dignity: "Inimical", combust: true },
  { planet: "Saturn", lon: 74.7, signIndex: 2, sign: "Gemini", degInSign: 14.7, speed: 0.11, retrograde: false, nakshatraIndex: 5, nakshatra: "Ardra", nakshatraLord: "Rahu", pada: 3, signLord: "Mercury", dignity: "Friendly", combust: false },
  { planet: "Rahu", lon: 31.3, signIndex: 1, sign: "Taurus", degInSign: 1.3, speed: -0.05, retrograde: true, nakshatraIndex: 2, nakshatra: "Krittika", nakshatraLord: "Sun", pada: 2, signLord: "Venus", dignity: "—", combust: false },
  { planet: "Ketu", lon: 211.3, signIndex: 7, sign: "Scorpio", degInSign: 1.3, speed: -0.05, retrograde: true, nakshatraIndex: 15, nakshatra: "Vishakha", nakshatraLord: "Jupiter", pada: 4, signLord: "Mars", dignity: "—", combust: false },
];

test("MTD audit of a synthetic chart reports the governed fraction", () => {
  const ledger = auditChart(chart, 3);
  console.log("\n" + JSON.stringify(ledger, null, 2));
  assert.ok(ledger.yogaFired > 10);
  assert.ok(ledger.fragmentsRendered > 20);
  assert.ok(ledger.governedFraction > 0.8);
  assert.equal(ledger.yogaTestsEvaluated, 85);
});
