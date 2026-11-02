/**
 * Per-planet index over already evaluated, policy-filtered school readings. The index never
 * runs a rule or turns a missing finding into a denial. Attribution is deliberately limited
 * to fields in the existing results that explicitly identify a planet.
 */
import type { Planet } from "./astro";
import type { PlanetContext, PlanetFacts, PlanetFrame } from "./planet-context";
import type { Reading } from "./rules";
import type { KpResult, KpPlanet, KpSignificators } from "./kp";
import type { JaiminiResult } from "./jaimini";
import type { ParashariResult } from "./parashari";
import type { AlpResult } from "./alp";
import type { PrasnaHouseReading } from "./rules-prasna";

type Snapshot<T> = { context: PlanetContext; result: T };
export interface SchoolRuleSnapshots {
  bnn?: Snapshot<Pick<Reading, "findings">>;
  kp?: Snapshot<Pick<KpResult, "findings" | "planets" | "significators" | "cusps">>;
  jaimini?: Snapshot<Pick<JaiminiResult, "findings">>;
  parashari?: Snapshot<Pick<ParashariResult, "findings">>;
  alp?: Snapshot<Pick<AlpResult, "findings" | "asOf">>;
  prasna?: Snapshot<readonly PrasnaHouseReading[]>;
}
export type ContextSchool = keyof SchoolRuleSnapshots;
export interface PlanetRuleLink {
  ruleId: string;
  text: string;
  source?: string;
  sourceUrl?: string;
  /** The explicit field by which the existing result associates this planet. */
  attribution: "listed planet" | "cusp sub-lord" | "house occupant";
  /** A date-sensitive rule cannot be mistaken for a timeless natal rule. */
  scope: "natal" | "date-dependent" | "frame-dependent";
  asOf?: string;
  chart?: "D1" | "D9";
}
export interface KpPlanetDetail {
  /** The KP-ayanamsa point, including sign, star and sub lords and cusp-based house. */
  point: KpPlanet;
  /** Four-step A–D event significators; optional six-step display remains distinct. */
  significators: KpSignificators | undefined;
  cuspSubLordOf: number[];
}
export function kpPlanetDetail(context: PlanetContext, result: Pick<KpResult, "planets" | "significators" | "cusps">, planet: Planet): KpPlanetDetail | undefined {
  if (context.frame.ayanamsa !== "kp") throw new Error("KP planet details require a KP-ayanamsa frame");
  const fact = context.planet(planet), point = result.planets.find((p) => p.planet === planet);
  if (!fact || !point) return undefined;
  if (Math.abs(point.lon - fact.position.lon) > 1e-9 || (context.frame.cusps &&
      (context.frame.cusps.length !== result.cusps.length || context.frame.cusps.some((c, i) => c !== result.cusps[i].lon))))
    throw new Error("KP planet details do not match their frame");
  return { point, significators: result.significators.find((p) => p.planet === planet),
    cuspSubLordOf: result.cusps.filter((c) => c.subLord === planet).map((c) => c.house) };
}
export type PlanetSchoolRules =
  | { status: "not-evaluated"; rules: readonly [] }
  | { status: "planet-missing"; frame: Readonly<PlanetFrame>; rules: readonly [] }
  | { status: "evaluated"; frame: Readonly<PlanetFrame>; facts: PlanetFacts; rules: readonly PlanetRuleLink[]; coverage: string; kp?: KpPlanetDetail };

/**
 * Pass the same gated readings used by the visible chart; this function does not bypass
 * age, sensitivity, selected-house, or topic gates. It indexes fired findings, not all
 * possible rules, and it does not claim every indirect dependency is represented.
 */
export function planetRulesBySchool(planet: Planet, snapshots: SchoolRuleSnapshots): Record<ContextSchool, PlanetSchoolRules> {
  if (snapshots.kp && snapshots.kp.context.frame.ayanamsa !== "kp")
    throw new Error("KP rule evidence requires a KP-ayanamsa frame");
  const from = <T>(snapshot: Snapshot<T> | undefined, coverage: string, build: (result: T) => PlanetRuleLink[]): PlanetSchoolRules => {
    if (!snapshot) return { status: "not-evaluated", rules: [] };
    const facts = snapshot.context.planet(planet);
    if (!facts) return { status: "planet-missing", frame: snapshot.context.frame, rules: [] };
    return { status: "evaluated", frame: snapshot.context.frame, facts, rules: build(snapshot.result), coverage };
  };
  const kp = from(snapshots.kp, "Fired findings where the planet is the cusp sub-lord; other referenced planets are not exhaustively attributed.", (r) =>
    r.findings.filter((f) => f.subLord === planet).map((f) => ({ ruleId: f.ruleId, text: f.text,
      source: f.source, sourceUrl: f.sourceUrl, attribution: "cusp sub-lord", scope: "natal" })));
  return {
    bnn: from(snapshots.bnn, "Fired findings listing the planet; not every indirect condition.", (r) =>
      r.findings.filter((f) => f.planets.includes(planet)).map((f) => ({ ruleId: f.ruleId, text: f.text,
        source: f.source, attribution: "listed planet", scope: "natal" }))),
    kp: kp.status === "evaluated" && snapshots.kp ? { ...kp, kp: kpPlanetDetail(snapshots.kp.context, snapshots.kp.result, planet) } : kp,
    jaimini: from(snapshots.jaimini, "Fired findings listing the planet; each keeps its own rasi or navamsa scope.", (r) =>
      r.findings.filter((f) => f.planets.includes(planet)).map((f) => ({ ruleId: f.id, text: f.text,
        source: f.source.label, sourceUrl: f.source.url, attribution: "listed planet", scope: "frame-dependent",
        chart: f.chart === "navamsa" ? "D9" : "D1" }))),
    parashari: from(snapshots.parashari, "Fired findings listing the planet; house prose and other derived sections are separate.", (r) =>
      r.findings.filter((f) => f.planets.includes(planet)).map((f) => ({ ruleId: f.id, text: f.text,
        source: f.source.label, sourceUrl: f.source.url, attribution: "listed planet", scope: "natal" }))),
    alp: from(snapshots.alp, "Fired findings listing the planet for the selected ALP date.", (r) =>
      r.findings.filter((f) => f.planets.includes(planet)).map((f) => ({ ruleId: f.ruleId, text: f.text,
        source: f.source, sourceUrl: f.sourceUrl, attribution: "listed planet", scope: "date-dependent", asOf: r.asOf }))),
    prasna: from(snapshots.prasna, "The entered house-occupancy effects; other Prasna rules are separate.", (rows) =>
      rows.flatMap((r) => {
        const benefic = r.benefics.some((p) => p.planet === planet);
        const malefic = r.malefics.some((p) => p.planet === planet);
        const text = benefic ? r.beneficText : malefic ? r.maleficText : undefined;
        return text ? [{ ruleId: `prasna-house-${r.house}-${benefic ? "benefic" : "malefic"}`, text,
          source: r.source, attribution: "house occupant" as const, scope: "frame-dependent" as const }] : [];
      })),
  };
}
