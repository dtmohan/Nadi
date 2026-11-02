/** The ordinary ALP evaluator projected to reviewed topic associations at an event instant. */
import { DateTime } from "luxon";
import { alpLonAt, alpPointAt, alpRate, arpLonAt, computeAlpEventFrame, DEFAULT_ALP_CONFIG, type AlpResult } from "./alp";
import { norm360 } from "./astro";
import { ALP_PLAIN_TOPIC_RULES } from "./school-topics-expanded";
import type { AlpFinding } from "./rules-alp";
import type { SchoolTopic } from "./school-topic-brief";
import type { PlanetContext } from "./planet-context";
import type { AlpMarriageContext } from "./alp-marriage";
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
  marriage?: AlpMarriageContext;
  findings: Array<{ finding: AlpFinding; topicMeaning: string }>;
}
interface CacheEntry {
  start: number; end: number;
  point: NonNullable<AlpEventEvidence["point"]>;
  akshaya: NonNullable<AlpEventEvidence["akshaya"]>;
  marriage: AlpMarriageContext;
  /** The ordinary ALP rule evaluation is independent of the event's topic. */
  findings: AlpFinding[];
}

/** The same precise progressed point for normal readings and birth-time scans. */
export function alpEventPoint(lagna: number, birthMs: number, eventMs: number) {
  const natalLon = norm360(lagna);
  const startLon = DEFAULT_ALP_CONFIG.start === "sign" ? Math.floor(natalLon / 30) * 30 : natalLon;
  const quickLon = norm360(startLon + alpRate(DEFAULT_ALP_CONFIG) * Math.max(0, (eventMs - birthMs) / 86400000));
  const pada = quickLon / (360 / 108);
  const lon = Math.abs(pada - Math.round(pada)) < 1e-7
    ? alpLonAt(lagna, DateTime.fromMillis(birthMs, { zone: "utc" }), DateTime.fromMillis(eventMs, { zone: "utc" }), DEFAULT_ALP_CONFIG)
    : quickLon;
  return alpPointAt(lon);
}

/** The cache is scoped to one natal candidate. Discrete ALP and ARP points are
 * recalculated at every instant; the stored result also cannot cross the ARP
 * dasa or bhukti boundary. No result is shared between candidates. */
export function createAlpEventScorer(context: PlanetContext, lagna: number, birthIso: string,
  chart: { deathDate?: string | null }, readingAsOf: string, allowed?: (matter: string) => boolean) {
  const cache = new Map<string, CacheEntry[]>();
  const birthMs = Date.parse(birthIso);
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
    const days = Math.max(0, (ms - birthMs) / 86400000);
    let instant: DateTime | undefined;
    const when = () => instant ??= DateTime.fromMillis(ms, { zone: "utc" });
    // Use elapsed UTC milliseconds for the cache key; at a pada boundary use the ordinary
    // Luxon arithmetic to avoid a floating-point rounding disagreement.
    const ap = alpEventPoint(lagna, birthMs, ms);
    const rp = alpPointAt(arpLonAt(moon, days));
    const pointKey = [ap.signIndex, ap.nakshatraIndex, ap.pada, ap.navamsaSign,
      rp.signIndex, rp.nakshatraIndex, rp.pada, rp.navamsaSign].join(":");
    const cacheKey = `${withhold ? 1 : 0}:${pointKey}`;
    // The timeline's ISO rounding and direct longitude can disagree at an
    // exact boundary. Re-evaluate on both sides rather than trusting a cached
    // period in the small rounding margin.
    const project = (point: CacheEntry["point"], akshaya: CacheEntry["akshaya"], findings: AlpFinding[], marriage: AlpMarriageContext): AlpEventEvidence => ({
      matter, topic, status, asOf, point, akshaya,
      ...(matter === "marriage" ? { marriage } : {}),
      findings: findings.flatMap((finding) => {
        const topicMeaning = ALP_PLAIN_TOPIC_RULES[finding.ruleId]?.[topic];
        return topicMeaning ? [{ finding, topicMeaning }] : [];
      }),
    });
    const previous = cache.get(cacheKey)?.find((e) => e.start + 2000 < ms && ms < e.end - 2000);
    if (previous) return project(previous.point, previous.akshaya, previous.findings, previous.marriage);
    const a = computeAlpEventFrame(context, lagna, birthIso, when().toISO()!, DEFAULT_ALP_CONFIG, withhold);
    const point = { sign: a.point.sign, nakshatra: a.point.nakshatra, pada: a.point.pada,
      lord: a.point.lord, nakshatraLord: a.point.nakshatraLord, navamsaSign: a.point.navamsaSign };
    const akshaya = { sign: a.arp.point.sign, nakshatra: a.arp.point.nakshatra, pada: a.arp.point.pada,
      dasa: a.arp.dasa.lord, bhukti: a.arp.bhukti.lord };
    const result = project(point, akshaya, a.findings, a.marriage);
    // Point-dependent conditions are guarded by the exact pointKey above;
    // only the independently changing period bounds need to be stored here.
    const spans = [a.arp.dasa, a.arp.bhukti];
    if (spans.every((v) => v && v.start && v.end)) {
      const start = Math.max(...spans.map((v) => Date.parse(v!.start)));
      const end = Math.min(...spans.map((v) => Date.parse(v!.end)));
      if (start <= ms && ms < end) {
        const entries = cache.get(cacheKey) ?? [];
        entries.push({ start, end, point, akshaya, findings: a.findings, marriage: a.marriage });
        cache.set(cacheKey, entries);
      }
    }
    return result;
  };
}
