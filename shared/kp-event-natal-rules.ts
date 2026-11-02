/**
 * Ordinary KP natal catalogue rules qualified for an event matter.
 * A registration supplies scope, not another score or an assertion that an
 * unmatched positive rule denies an event. Rule conditions and citations live
 * in KP_RULES and are evaluated by the ordinary chart evaluator.
 */
import { SIGN_QUALITY } from "./astro";
import { EVENT_MATTERS } from "./events";
import { badhakaHouse, MARAKA_HOUSES, type KpCusp, type KpPlanet, type KpSignificators } from "./kp";
import { applyKpPrecedence, evaluateKp, KP_RULES, type KpFinding, type KpRuleFrame } from "./rules-kp";
import { redactSensitive } from "./life-stage";

export type KpEventRuleRole = "promise" | "modifier" | "context";
interface Registration { matter: string; id: string; role: KpEventRuleRole }
const rows = (matter: string, role: KpEventRuleRole, ids: string): Registration[] =>
  ids.trim().split(/\s+/).map((id) => ({ matter, id, role }));

/** Explicitly qualified by subject. For example, the horary rule about a
 * particular party and general marital-quality rules are not wedding-date
 * promises; neither is a prediction of a child's sex a birth-event rule. */
export const KP_EVENT_NATAL_RULES: readonly Registration[] = [
  ...rows("marriage", "promise", "kp7-marriage kp7-no-marriage kp7-star-in-12 kp7-denied-by-6 kp2-marriage kp11-marriage-desired"),
  ...rows("marriage", "modifier", "kp7-delayed kp7-mixed-lordship"),
  ...rows("marriage", "context", "kp7-early kp7-love-marriage kp7-love-separation kp7-multiple kp7-multiple-dual"),
  ...rows("child", "promise", "kp5-children kp5-children-denied kp5-children-certain kp5-children-none-4 kp5-children-destined kp5-children-denied-full kp2-children"),
  ...rows("child", "modifier", "kp5-children-limited"),
  ...rows("job", "promise", "kp10-employment"),
  ...rows("job", "modifier", "kp10-transfer kp10-transfer-new-job kp10-promotion-transfer kp10-promotion-transfer-far kp10-no-occupation"),
  ...rows("job", "context", "kp6-promotion kp6-service kp10-service kp10-both kp10-self kp10-start-profession kp10-change-occupation"),
  ...rows("job-loss", "context", "kp10-loss kp10-wife-property-job-loss kp12-loss-profession"),
  ...rows("business", "context", "kp10-business kp10-both kp10-self kp11-institution kp11-profession"),
  ...rows("property", "promise", "kp4-house kp4-property kp4-buy-house kp4-buy-land kp6-success-house kp10-buy-house kp10-buy-house-profit kp10-no-house kp11-buy-house kp12-buy-house"),
  ...rows("vehicle", "context", "kp3-vehicles-owned kp4-vehicle-saturn kp4-vehicle-mars kp4-vehicle-four kp4-vehicle-air kp4-vehicle-ship"),
  ...rows("education", "context", "kp4-education kp4-higher kp4-breaks kp4-edu-intermediate kp4-edu-highest kp4-edu-no-11 kp4-edu-no-9 kp4-edu-none kp4-lower-edu"),
  ...rows("abroad", "context", "kp9-abroad kp9-abroad-node kp9-abroad-node-weak kp12-foreign kp12-foreign-work kp12-settle-abroad kp12-wandering kp12-gain-abroad"),
  ...rows("move", "context", "kp4-transfer kp4-move kp4-permanent-post"),
  ...rows("accident", "context", "kp1-accident kp8-accident kp8-accident-grave kp12-accident kp8-harmless kp8-diverted"),
  ...rows("illness", "context", "kp6-illness kp8-surgery kp6-incurable kp6-sickness kp6-sickness-part3"),
  ...rows("litigation", "context", "kp3-appeal kp6-litigation"),
  ...rows("loan", "context", "kp6-inflow kp8-borrowing kp8-repays kp8-perpetual-debt"),
];

export interface KpRegisteredNatalRule {
  id: string;
  role: KpEventRuleRole;
  source: string;
  sourceUrl?: string;
  matched: boolean;
  /** The exact ordinary chart finding; absent does not mean the converse is true. */
  finding?: KpFinding;
}
export interface KpEventNatalRules {
  matter: string;
  convention: "four-step";
  status: "assessed" | "unmapped" | "custom-event" | "withheld";
  rules: KpRegisteredNatalRule[];
  /** The registered promise-role clues only; never a hard event veto. */
  indication: { status: "support" | "strain" | "mixed" | "unresolved" | "context-only" | "unavailable";
    supports: string[]; strains: string[] };
}

/** A finding demoted by the ordinary principal-cusp precedence remains visible
 * as a note, but cannot reverse or create the summary indication. */
export function summarizeKpNatalIndication(status: KpEventNatalRules["status"], rules: KpRegisteredNatalRule[]): KpEventNatalRules["indication"] {
  const promise = rules.filter((rule) => rule.role === "promise");
  const active = promise.filter((rule) => rule.finding?.standing !== "note");
  const supports = active.filter((rule) => rule.finding?.polarity === "good").map((rule) => rule.id);
  const strains = active.filter((rule) => rule.finding?.polarity === "bad").map((rule) => rule.id);
  return { supports, strains, status: status !== "assessed" ? "unavailable" : !promise.length ? "context-only"
    : supports.length && strains.length ? "mixed" : supports.length ? "support" : strains.length ? "strain" : "unresolved" };
}

export function kpRuleFrame(cusps: KpCusp[], planets: KpPlanet[], significators: KpSignificators[]): KpRuleFrame {
  const lagnaSign = cusps[0]?.signIndex;
  if (lagnaSign === undefined) throw new Error("KP rule evaluation requires the ascendant cusp");
  return { cusps, planets, significators, badhaka: badhakaHouse(lagnaSign),
    marakas: MARAKA_HOUSES, lagnaQuality: SIGN_QUALITY[lagnaSign] };
}

/** Compute once for one candidate, then reuse for every event and random date. */
export function createKpEventNatalRules(frame: KpRuleFrame, options: { withhold?: boolean; allowed?: (matter: string) => boolean } = {}) {
  const evaluated = applyKpPrecedence(evaluateKp(frame, false));
  const findings = options.withhold ? redactSensitive(evaluated) : evaluated;
  const byId = new Map(findings.map((finding) => [finding.ruleId, finding]));
  const cache = new Map<string, KpEventNatalRules>();
  return (matter: string | undefined, houses?: number[], cusp?: number): KpEventNatalRules | undefined => {
    if (!matter) return undefined;
    const known = EVENT_MATTERS.find((item) => item.id === matter);
    const selected = KP_EVENT_NATAL_RULES.filter((item) => item.matter === matter &&
      (!options.withhold || redactSensitive(KP_RULES.filter((rule) => rule.id === item.id)).length > 0));
    const custom = !!known && ((cusp !== undefined && cusp !== known.cusp) ||
      (houses !== undefined && [...houses].sort((a,b) => a-b).join(",") !== [...known.houses].sort((a,b) => a-b).join(",")));
    const status = options.allowed && !options.allowed(matter) ? "withheld" : custom ? "custom-event" : known && selected.length ? "assessed" : "unmapped";
    const key = `${matter}|${status}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const rules = status === "assessed" ? selected.map(({ id, role }): KpRegisteredNatalRule => {
      const catalog = KP_RULES.filter((rule) => rule.id === id);
      if (catalog.length !== 1) throw new Error(`Expected one KP catalogue rule for ${id}; found ${catalog.length}`);
      const finding = byId.get(id);
      return { id, role, source: catalog[0].source, sourceUrl: catalog[0].sourceUrl, matched: !!finding, ...(finding ? { finding } : {}) };
    }) : [];
    const indication = summarizeKpNatalIndication(status, rules);
    const result: KpEventNatalRules = { matter, convention: "four-step", status, rules, indication };
    cache.set(key, result);
    return result;
  };
}
