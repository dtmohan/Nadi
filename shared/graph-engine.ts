// The Jyotish Circuit Engine, ported faithfully from GraphEngine_v10 (graph.py/pathfinder.py):
// the horoscope as a resistor network with Ketu (source) → Rahu (sink), the Moon as a node,
// impedance edges (conjunction/lordship/aspect/house rings) and conductance nodes (dignity,
// house rings, combustion). This module is a research port — it computes the lit set and
// dominant planet; it feeds no app verdict. The weights are the v10 tables, exposed so the
// shuffle experiment can swap them.
import {
  SIGN_LORD,
  houseFrom,
  type PlanetPosition,
} from "./astro";

// v10 tables (graph.py).
export const EDGE_IMPEDANCE = {
  conjunction: 0.05,
  lordship: 0.15,
  aspect_full: 0.2,
  aspect_special: 0.2,
  aspect_partial: 0.5,
} as const;

export const DIGNITY_LADDER: Record<string, number> = {
  Exalted: 1.0,
  Moolatrikona: 0.85,
  Own: 0.75,
  "Great Friend": 0.65,
  Friend: 0.55,
  Neutral: 0.5,
  Enemy: 0.4,
  "Great Enemy": 0.35,
  Debilitated: 0.25,
};

export const HOUSE_CONDUCTANCE: Record<number, number> = {
  1: 1.0, // kendra ∩ trikona — maximum connectivity
  5: 0.9, 9: 0.9, // trikona
  4: 0.85, 7: 0.85, 10: 0.85, // kendra
  3: 0.7, 11: 0.7, // upachaya
  2: 0.55, // maraka
  6: 0.45, 8: 0.4, 12: 0.4, // dusthana
};

export interface CircuitOptions {
  /** Dignity class → conductance. Swap this for the shuffle experiment. */
  dignityLadder: Record<string, number>;
  edgeImpedance?: typeof EDGE_IMPEDANCE;
  houseConductance?: Record<number, number>;
  /** Randomize which sign counts as "own" for each planet (prior-neutralisation). */
  randomOwn?: () => number;
}

export interface Circuit {
  /** Node ids: P:Sun … P:Ketu, H:1 … H:12. */
  nodes: string[];
  edges: { from: string; to: string; cost: number; kind: string }[];
  conductance: Map<string, number>;
}

/** The Nadi dignity values mapped onto the v10 ladder classes. */
function ladderClass(dignity: string): string {
  switch (dignity) {
    case "Exalted": return "Exalted";
    case "Moolatrikona": return "Moolatrikona";
    case "Own sign": return "Own";
    case "Friendly": return "Friend";
    case "Inimical": return "Enemy";
    case "Debilitated": return "Debilitated";
    case "Neutral": case "—": return "Neutral";
    default: return "Neutral";
  }
}

const SPECIAL_ASPECTS: Record<string, number[]> = {
  Mars: [4, 8],
  Jupiter: [5, 9],
  Saturn: [3, 10],
  Rahu: [5, 9], // same as Jupiter [BPHS — PROVISIONAL, per GraphEngine constants]
  Ketu: [5, 9], // same as Jupiter [PROVISIONAL]
};

/** Classical drishti: the houses (counted from the planet's sign) a planet aspects at full strength. */
export function aspectsFrom(planet: string): number[] {
  const out = [7];
  for (const h of SPECIAL_ASPECTS[planet] ?? []) out.push(h);
  return out;
}

export function buildCircuit(
  positions: PlanetPosition[],
  lagnaIdx: number,
  opts: CircuitOptions,
): Circuit {
  const imp = opts.edgeImpedance ?? EDGE_IMPEDANCE;
  const hc = opts.houseConductance ?? HOUSE_CONDUCTANCE;
  const pos = (p: string) => positions.find((x) => x.planet === p)!;
  const sun = pos("Sun");
  const nodes: string[] = [
    ...positions.map((p) => `P:${p.planet}`),
    ...Array.from({ length: 12 }, (_, i) => `H:${i + 1}`),
  ];
  const edges: Circuit["edges"] = [];
  const conductance = new Map<string, number>();

  // Planet conductance: dignity ladder × combustion modifier (v10: ×(1 − comb·0.5); cazimi ≥ 0.90).
  for (const p of positions) {
    let base =
      opts.dignityLadder[ladderClass(p.dignity)] ?? opts.dignityLadder.Neutral ?? 0.5;
    if (p.planet !== "Sun" && p.planet !== "Rahu" && p.planet !== "Ketu") {
      const d = Math.abs((((p.lon - sun.lon) % 360) + 540) % 360 - 180);
      if (d < 1) base = Math.max(base, 0.9); // cazimi
      else if (d < 10) base = base * 0.5; // combust (simplified single orb)
    }
    conductance.set(`P:${p.planet}`, Math.round(base * 1000) / 1000);
  }
  for (let h = 1; h <= 12; h++) conductance.set(`H:${h}`, hc[h] ?? 0.5);

  // Conjunction edges: planets sharing a sign.
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (positions[i].signIndex === positions[j].signIndex) {
        edges.push({
          from: `P:${positions[i].planet}`,
          to: `P:${positions[j].planet}`,
          cost: imp.conjunction,
          kind: "conjunction",
        });
      }
    }
  }

  // Lordship edges: planet → the houses it rules (Rahu/Ketu lord nothing).
  for (const p of positions) {
    if (p.planet === "Rahu" || p.planet === "Ketu") continue;
    for (let sign = 0; sign < 12; sign++) {
      if (SIGN_LORD[sign] === p.planet) {
        edges.push({
          from: `P:${p.planet}`,
          to: `H:${houseFrom(lagnaIdx, sign)}`,
          cost: imp.lordship,
          kind: "lordship",
        });
      }
    }
  }

  // Aspect edges: planet → the houses its full drishti reaches (Rahu/Ketu cast Jupiter's, provisional).
  for (const p of positions) {
    for (const off of aspectsFrom(p.planet)) {
      const targetSign = (p.signIndex + off - 1) % 12;
      edges.push({
        from: `P:${p.planet}`,
        to: `H:${houseFrom(lagnaIdx, targetSign)}`,
        cost: off === 7 ? imp.aspect_full : imp.aspect_special,
        kind: "aspect",
      });
    }
  }

  // Rahu–Ketu axis: explicit bidirectional terminal edge (mutual 7th — aspect_full).
  edges.push({
    from: "P:Rahu",
    to: "P:Ketu",
    cost: imp.aspect_full,
    kind: "axis",
  });

  // House rings (v10): kendra quadrilateral 0.25, trikona triangle 0.20.
  const kendraRing = [[1, 4], [4, 7], [7, 10], [10, 1], [1, 7], [4, 10]];
  const trikonaRing = [[1, 5], [5, 9], [9, 1]];
  for (const [a, b] of kendraRing)
    edges.push({ from: `H:${a}`, to: `H:${b}`, cost: 0.25, kind: "ring-kendra" });
  for (const [a, b] of trikonaRing)
    edges.push({ from: `H:${a}`, to: `H:${b}`, cost: 0.2, kind: "ring-trikona" });

  return { nodes, edges, conductance };
}

/** Dijkstra distances from `source` over undirected edges. */
export function dijkstra(c: Circuit, source: string): Map<string, number> {
  const dist = new Map<string, number>(c.nodes.map((n) => [n, Infinity]));
  dist.set(source, 0);
  const adj = new Map<string, { to: string; cost: number }[]>();
  for (const e of c.edges) {
    (adj.get(e.from) ?? adj.set(e.from, []).get(e.from)!).push({ to: e.to, cost: e.cost });
    (adj.get(e.to) ?? adj.set(e.to, []).get(e.to)!).push({ to: e.from, cost: e.cost });
  }
  const done = new Set<string>();
  for (;;) {
    let u: string | null = null;
    let best = Infinity;
    for (const n of c.nodes) {
      if (!done.has(n) && dist.get(n)! < best) {
        best = dist.get(n)!;
        u = n;
      }
    }
    if (u === null) break;
    done.add(u);
    for (const e of adj.get(u) ?? []) {
      const nd = best + e.cost;
      if (nd < dist.get(e.to)!) dist.set(e.to, nd);
    }
  }
  return dist;
}

export interface EngineRead {
  /** Nodes that lie on some minimum-cost Ketu→Rahu path. */
  lit: string[];
  /** Planets on the lit set, by conductance. */
  litPlanets: { planet: string; conductance: number }[];
  /** The highest-conductance planet in the lit set. */
  dominant: string | null;
  pathCost: number;
}

export function readCircuit(c: Circuit): EngineRead {
  const dK = dijkstra(c, "P:Ketu");
  const dR = dijkstra(c, "P:Rahu");
  const best = dK.get("P:Rahu")!;
  if (!isFinite(best)) return { lit: [], litPlanets: [], dominant: null, pathCost: best };
  const lit = c.nodes.filter(
    (n) => isFinite(dK.get(n)!) && isFinite(dR.get(n)!) && dK.get(n)! + dR.get(n)! <= best + 1e-9,
  );
  const litPlanets = lit
    .filter((n) => n.startsWith("P:"))
    .map((n) => ({ planet: n.slice(2), conductance: c.conductance.get(n) ?? 0 }))
    .sort((a, b) => b.conductance - a.conductance);
  return {
    lit,
    litPlanets,
    dominant: litPlanets[0]?.planet ?? null,
    pathCost: best,
  };
}

/** A random monotone reassignment of the ladder (order preserved, magnitudes redrawn). */
export function monotoneLadder(): Record<string, number> {
  const order = [
    "Debilitated", "Great Enemy", "Enemy", "Neutral", "Friend",
    "Great Friend", "Own", "Moolatrikona", "Exalted",
  ];
  const vals = Array.from({ length: 9 }, () => Math.random()).sort((a, b) => a - b);
  const out: Record<string, number> = {};
  order.forEach((k, i) => (out[k] = vals[i]));
  return out;
}

/** A fully random ladder (no order preserved). */
export function randomLadder(): Record<string, number> {
  const keys = Object.keys(DIGNITY_LADDER);
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = Math.random();
  return out;
}
