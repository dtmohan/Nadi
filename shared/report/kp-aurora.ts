import type { AuroraEventEvidence } from "../kp-aurora";
import { auroraV2StageCounts, type AuroraV2Evidence, type AuroraV2StageComparison } from "../kp-aurora-v2";
import type { ReportPara } from "./types";

export function auroraEvidenceParas(e: AuroraEventEvidence, label: string, source: number): ReportPara[] {
  return [
    { kind: "note", provisional: true, cites: [source], text: `${label}: Aurora-style staged research adapter. ${e.allSupported ? "All stages passed the strict app convention" : `Unresolved at ${e.firstUnresolved ?? "a stage"}`}. Supporting houses ${e.supporting.join(", ")}; adverse houses ${e.adverse.join(", ")}. Nadi's four-step houses, cusp additions and no-adverse threshold are app conventions. In a small fresh-case test no chains passed; the result does not establish an event or birth time.` },
    { kind: "table", appendix: true, head: ["Stage", "Planet", "Star layer houses", "Sub layer houses", "Chain"], rows: e.layers.map((l) => [
      l.role, `${l.planet}${l.ownStar ? " (own star)" : ""}`, `${l.star.planet}: ${l.star.houses.join(", ") || "—"}`,
      `${l.sub.planet}: ${l.sub.houses.join(", ") || "—"}`, l.eligible ? l.status : `not counted (raw ${l.status})`,
    ]) },
    { kind: "p", provisional: true, text: `Event sky (descriptive): ${e.transit.map((t) => `${t.role} ${t.planet}: ${t.signLord}/${t.starLord}/${t.subLord}`).join("; ") || "unavailable"}. Later stages cannot rescue an unresolved predecessor.` },
  ];
}

export function auroraV2EvidenceParas(e: AuroraV2Evidence, label: string, source: number): ReportPara[] {
  return [
    { kind: "note", provisional: true, cites: [source], text: `${label}: Aurora mixed-script v2 research adapter. ${e.allSupported ? `The chain passed, with ${e.cautions} caution stage(s)` : `Unresolved at ${e.firstUnresolved ?? "a stage"}`}. Mixed stars may proceed with a supportive sub; mixed subs remain unresolved. In an initial check of 12 events for four people, no complete chains passed at the reported times and every sampled training window tied; this is not validated for ranking birth times. Node aspects, self promotion and repeated star/sub handling are app conventions. No result establishes a birth time or an event.` },
    { kind: "table", appendix: true, head: ["Stage", "Planet", "Star layer houses", "Sub layer houses", "Chain"], rows: e.layers.map((l) => [
      l.role, `${l.planet}${l.ownStar ? " (own star)" : ""}${l.repeatedStarSub ? " (repeated star/sub)" : ""}`,
      `${l.star.planet}: ${l.star.houses.join(", ") || "—"}`, `${l.sub.planet}: ${l.sub.houses.join(", ") || "—"}`,
      l.eligible ? l.status : `not counted (raw ${l.status})`,
    ]) },
    { kind: "p", provisional: true, text: `Event sky (descriptive): ${e.transit.map((t) => `${t.role} ${t.planet}: ${t.signLord}/${t.starLord}/${t.subLord}`).join("; ") || "unavailable"}. Later stages cannot rescue an unresolved predecessor.` },
  ];
}

export function auroraV2StagesParas(items: Array<AuroraV2Evidence | undefined>,
  comparison?: AuroraV2StageComparison<{ actual: number; mean: number }>, trials?: number): ReportPara[] {
  const c = auroraV2StageCounts(items);
  if (!c.eligibleEvents) return [];
  const comp = comparison?.eligibleEvents === c.eligibleEvents ? comparison : undefined;
  const rows = [["Required cusps", "cusps"], ["Then major period", "major"], ["Then sub-period", "sub"],
    ["Then third period", "third"]] as const;
  return [{ kind: "note", provisional: true, text: `Cumulative Aurora v2 stages for ${c.eligibleEvents} eligible events: ${rows.map(([label, key]) => `${label} ${c[key]}${comp ? ` (random-date mean ${comp[key].mean})` : ""}`).join("; ")}. Each row requires all earlier rows to pass; supported-with-caution counts. These period lords are not positional star/sub/sub-sub lords. V2 uses a planet's positional sub-sub in special cases and does not separately apply the book's repeated-star/sub cusp exception. ${comp ? `The same gates were used for ${trials ?? 200} comparison sets. The natal cusp result is fixed at this candidate. Random dates are not known non-events.` : ""}` }];
}
