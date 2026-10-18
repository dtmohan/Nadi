// Research harness (not part of npm test): run the ported circuit engine on a cast chart and
// compare its lit set with the text-fired yogas, under the original, monotone-shuffled and
// fully-shuffled dignity ladders. This is the prior-neutralisation experiment.
import { readFileSync } from "node:fs";
import {
  buildCircuit,
  dijkstra,
  DIGNITY_LADDER,
  monotoneLadder,
  randomLadder,
  type CircuitOptions,
} from "@shared/graph-engine";
import { computeYogas } from "@shared/yoga";
import { vimshottari } from "@shared/kp";

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

function namedPlanets(text: string): Set<string> {
  const out = new Set<string>();
  for (const p of PLANETS) if (new RegExp(`\\b${p}\\b`).test(text)) out.add(p);
  return out;
}

/** Walk one shortest-path segment from `from` to `to` over the circuit edges. */
function segment(c: ReturnType<typeof buildCircuit>, from: string, to: string): string[] {
  const d = dijkstra(c, from);
  if (!isFinite(d.get(to)!)) return [];
  const seg: string[] = [];
  let cur: string | undefined = to;
  while (cur && cur !== from) {
    seg.push(cur);
    let best = Infinity;
    let next: string | undefined;
    for (const e of c.edges) {
      if (e.to === cur || e.from === cur) {
        const other = e.to === cur ? e.from : e.to;
        const cand = (d.get(other) ?? Infinity) + e.cost;
        if (cand < best) {
          best = cand;
          next = other;
        }
      }
    }
    cur = next;
    if (seg.length > 40) break;
  }
  return seg.reverse();
}

/** The path constrained to pass through MD → AD → PD in order (GraphEngine pathfinder's rule). */
function dashaPath(c: ReturnType<typeof buildCircuit>, waypoints: string[]) {
  const out: string[] = [];
  let from = "P:Ketu";
  for (const w of waypoints) {
    const seg = segment(c, from, w);
    if (!seg.length) return [];
    out.push(...seg);
    from = w;
  }
  out.push(...segment(c, from, "P:Rahu"));
  return out;
}

function experiment(chart: any, label: string, trials = 200) {
  const lagnaIdx = Math.floor((((chart.jaimini.lagna.lon % 360) + 360) % 360) / 30);
  const moon = chart.positions.find((p: any) => p.planet === "Moon");
  const vim = vimshottari(moon.lon, chart.utc, chart.now.asOf);
  const waypoints = [vim.current.dasa.lord, vim.current.bhukti.lord, vim.current.antara.lord]
    .filter((x, i, a) => a.indexOf(x) === i)
    .map((x) => `P:${x}`);
  const fired = computeYogas({ positions: chart.positions, lagnaIdx });
  const named = new Set<string>();
  for (const y of fired) for (const p of Array.from(namedPlanets((y as any).here ?? ""))) named.add(p);

  const run = (opts: CircuitOptions) => {
    const c = buildCircuit(chart.positions, lagnaIdx, opts);
    const path = dashaPath(c, waypoints);
    const pathSet = new Set(path);
    const pathPlanets = path
      .filter((n) => n.startsWith("P:"))
      .map((n) => ({ planet: n.slice(2), conductance: c.conductance.get(n) ?? 0 }))
      .sort((a, b) => b.conductance - a.conductance);
    let litHits = 0;
    for (const p of Array.from(named)) if (pathSet.has(`P:${p}`)) litHits++;
    return {
      litHits,
      n: named.size,
      dominant: pathPlanets[0]?.planet ?? null,
      path: path.join(" → "),
      planets: pathPlanets.map((x) => `${x.planet}(${x.conductance})`).join(" "),
    };
  };

  const base = run({ dignityLadder: DIGNITY_LADDER });
  const mono = Array.from({ length: trials }, () => run({ dignityLadder: monotoneLadder() }));
  const rand = Array.from({ length: trials }, () => run({ dignityLadder: randomLadder() }));
  const stat = (xs: { litHits: number; dominant: string | null }[]) => {
    const m = xs.reduce((a, b) => a + b.litHits, 0) / xs.length;
    const domCount = new Map<string, number>();
    for (const x of xs) if (x.dominant) domCount.set(x.dominant, (domCount.get(x.dominant) ?? 0) + 1);
    const topDom = Array.from(domCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return `${(m / Math.max(1, base.n)).toFixed(3)} (dominant spread: ${topDom.map(([p, c]) => `${p}×${c}`).join(", ") || "—"})`;
  };

  console.log(`\n=== ${label} ===`);
  console.log(`dasha: ${vim.current.dasa.lord} → ${vim.current.bhukti.lord} → ${vim.current.antara.lord}`);
  console.log(`fired yogas: ${fired.length}; named planets: ${named.size} (${Array.from(named).join(", ")})`);
  console.log(`baseline: lit ${base.litHits}/${base.n}, dominant=${base.dominant}`);
  console.log(`baseline path: ${base.path}`);
  console.log(`planets on path: ${base.planets}`);
  console.log(
    `agreement (lit) — baseline ${(base.litHits / Math.max(1, base.n)).toFixed(3)} | monotone-shuffle ${stat(mono)} | random-shuffle ${stat(rand)}`,
  );
  return { base, monoMean: stat(mono), randMean: stat(rand) };
}

const chartPath = process.argv[2] ?? "/tmp/cast.json";
const chart = JSON.parse(readFileSync(chartPath, "utf8"));
console.log(`lagna ${chart.jaimini.lagna.sign} · born ${chart.chart.birthDate}`);
experiment(chart, chartPath);
