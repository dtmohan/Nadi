import { SIGNS } from "./astro";
import type { ManleyNatalEvidence } from "./manley-evidence";

/** Compact projections of the actual natal frames; no period or verdict. */
export function manleyNatalSummaries(e: ManleyNatalEvidence) {
  return (["D1", e.division] as const).map((chart, index) => {
    const frames = e.planets.map((p) => ({ planet: p.planet, frame: p.frames[index] }));
    const pairs = new Set<string>();
    const yoga: string[] = [];
    for (const { planet, frame } of frames) {
      const f = frame.functional, pair = f?.yogaPair;
      if (!f || !pair) continue;
      const key = [planet, pair.partner].sort().join("/");
      if (pairs.has(key)) continue;
      pairs.add(key);
      const partner = frames.find((x) => x.planet === pair.partner)?.frame.functional;
      yoga.push(`${planet} in ${SIGNS[f.sign]} house ${f.house} (owns ${f.owns.join(", ")}) and ${pair.partner}${partner ? ` in ${SIGNS[partner.sign]} house ${partner.house} (owns ${partner.owns.join(", ")})` : ""}: ${pair.formation?.join(", ") || "no listed formation"}${pair.links.length ? `; ${pair.links.join("; ")}` : ""}`);
    }
    const nodes = frames.filter((x) => x.frame.nodeDispositor).map(({ planet, frame }) => {
      const n = frame.nodeDispositor!, f = frame.functional!;
      const direct = [...frame.primary.house, ...frame.primary.houseLord, ...frame.primary.karaka];
      return `${planet} in ${SIGNS[f.sign]} house ${f.house}; direct links: ${direct.join("; ") || "none listed"}; sign ruler ${n.planet} in ${SIGNS[n.sign]} house ${n.house}, owns ${n.owns.join(", ")}; indirect links: ${n.links.join("; ") || "none listed"}`;
    });
    const combinations = frames.filter((x) => x.frame.eventCombination?.matched).map(({ frame }) =>
      `${frame.functional!.planet}: ${frame.eventCombination!.explanations.join("; ")}`);
    const planets = frames.map(({ planet, frame }) => {
      const f = frame.functional!;
      const primary = [...frame.primary.house, ...frame.primary.houseLord, ...frame.primary.karaka];
      const supporting = [...frame.supporting.ascendant, ...frame.supporting.natalHouseLord,
        ...frame.supporting.bhavat, ...frame.supporting.nodes];
      return `${planet}: ${SIGNS[f.sign]} house ${f.house}; owns ${f.owns.join(", ") || "none"}; ${f.classification}, ${f.dignity}; primary links: ${primary.join("; ") || "none listed"}; other links: ${supporting.join("; ") || "none listed"}`;
    });
    return { chart, ascendant: frames[0].frame.ascendant, house: e.house, yoga, nodes, combinations, planets };
  });
}
