/** The ordinary ALP evaluator projected to reviewed topic associations at an event instant. */
import { DateTime } from "luxon";
import { alpLonAt, alpPointAt, arpLonAt, computeAlpEventFrame, DEFAULT_ALP_CONFIG, type AlpResult } from "./alp";
import { ALP_PLAIN_TOPIC_RULES } from "./school-topics-expanded";
import type { AlpFinding } from "./rules-alp";
import type { SchoolTopic } from "./school-topic-brief";
import type { PlanetContext } from "./planet-context";
import { sensitiveGate } from "./life-stage";

const AREA: Readonly<Record<string, SchoolTopic>> = {
  marriage: "marriage", child: "children", job: "career", "job-loss": "career", business: "career",
  property: "wealth", education: "education", abroad: "travel", return: "travel", move: "family",
  father: "father", mother: "mother", loan: "wealth",
};
export interface AlpEventEvidence {
  matter: string;
  topic?: SchoolTopic;
  status: "assessed" | "unmapped" | "withheld" | "before-birth";
  asOf: string;
  /** Discrete positions; exact continuous longitude is not cached across instants. */
  point?: Pick<AlpResult["point"], "sign" | "nakshatra" | "pada" | "lord" | "nakshatraLord" | "navamsaSign">;
  akshaya?: { sign: AlpResult["arp"]["point"]["sign"]; nakshatra: string; pada: number; dasa: string; bhukti: string };
  findings: Array<{ finding: AlpFinding; topicMeaning: string }>;
}
interface CacheEntry { start: number; end: number; withheld: boolean; pointKey: string; result: AlpEventEvidence }

/** The cache is scoped to one natal candidate. Discrete ALP and ARP points are
 * recalculated at every instant; the stored result also cannot cross the ARP
 * dasa or bhukti boundary. No result is shared between candidates. */
export function createAlpEventScorer(context: PlanetContext, lagna: number, birthIso: string,
  chart: { deathDate?: string | null }, readingAsOf: string, allowed?: (matter: string) => boolean) {
  const cache = new Map<string, CacheEntry[]>();
  const birthMs = Date.parse(birthIso);
  const birth = DateTime.fromISO(birthIso, { setZone: true });
  const moon = context.requirePlanet("Moon").position.lon;
  const currentWithhold = sensitiveGate(chart, birthIso, readingAsOf).withheld;
  return (matter: string | undefined, asOf: string): AlpEventEvidence | undefined => {
    if (!matter) return undefined;
    const topic = AREA[matter];
    const ms = Date.parse(asOf);
    if (!Number.isFinite(ms)) throw new Error("Invalid ALP event instant");
    const status = allowed && !allowed(matter) ? "withheld" : !topic ? "unmapped" : ms < birthMs ? "before-birth" : "assessed";
    if (status !== "assessed" || !topic) return { matter, topic, status, asOf, findings: [] };
    const withhold = currentWithhold || sensitiveGate(chart, birthIso, asOf).withheld;
    const instant = DateTime.fromMillis(ms, { zone: "utc" });
    const ap = alpPointAt(alpLonAt(lagna, birth, instant, DEFAULT_ALP_CONFIG));
    const rp = alpPointAt(arpLonAt(moon, Math.max(0, (ms - birthMs) / 86400000)));
    const pointKey = [ap.signIndex, ap.nakshatraIndex, ap.pada, ap.navamsaSign,
      rp.signIndex, rp.nakshatraIndex, rp.pada, rp.navamsaSign].join(":");
    // The timeline's ISO rounding and direct longitude can disagree at an
    // exact boundary. Re-evaluate on both sides rather than trusting a cached
    // period in the small rounding margin.
    const previous = cache.get(matter)?.find((e) => e.withheld === withhold && e.pointKey === pointKey && e.start + 2000 < ms && ms < e.end - 2000);
    if (previous) return { ...previous.result, asOf };
    const a = computeAlpEventFrame(context, lagna, birthIso, instant.toISO()!, DEFAULT_ALP_CONFIG, withhold);
    const point = { sign: a.point.sign, nakshatra: a.point.nakshatra, pada: a.point.pada,
      lord: a.point.lord, nakshatraLord: a.point.nakshatraLord, navamsaSign: a.point.navamsaSign };
    const akshaya = { sign: a.arp.point.sign, nakshatra: a.arp.point.nakshatra, pada: a.arp.point.pada,
      dasa: a.arp.dasa.lord, bhukti: a.arp.bhukti.lord };
    const findings = a.findings.flatMap((finding) => {
      const topicMeaning = ALP_PLAIN_TOPIC_RULES[finding.ruleId]?.[topic];
      return topicMeaning ? [{ finding, topicMeaning }] : [];
    });
    const result: AlpEventEvidence = { matter, topic, status, asOf, point, akshaya, findings };
    // Point-dependent conditions are guarded by the exact pointKey above;
    // only the independently changing period bounds need to be stored here.
    const spans = [a.arp.dasa, a.arp.bhukti];
    if (spans.every((v) => v && v.start && v.end)) {
      const start = Math.max(...spans.map((v) => Date.parse(v!.start)));
      const end = Math.min(...spans.map((v) => Date.parse(v!.end)));
      if (start <= ms && ms < end) {
        const entries = cache.get(matter) ?? [];
        entries.push({ start, end, withheld: withhold, pointKey, result });
        cache.set(matter, entries);
      }
    }
    return result;
  };
}
