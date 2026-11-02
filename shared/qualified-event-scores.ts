/** Source-scoped experiments. These counts are Nadi conventions, not probabilities
 * or a claim that the cited books prescribe numerical scores. */
import type { Planet, PlanetPosition } from "./astro";
import type { EventOutcome } from "./events";
import type { KpEventRules } from "./kp-event-evidence";
import type { ParashariDivisionalCheck } from "./parashari-divisional";
import type { ParashariDatedCatalogue } from "./parashari-event-natal-rules";
import type { AdditionalSchoolNatalEvidence } from "./additional-school-event-rules";
import type { AlpEventEvidence } from "./alp-event-evidence";

export const QUALIFIED_SCORE_KEYS = ["kp", "parashari", "alp", "bnn"] as const;
export type QualifiedScoreKey = typeof QUALIFIED_SCORE_KEYS[number];
export interface QualifiedEventScore {
  score: number;
  max: number;
  /** True and false refer to the named condition, not to whether the event occurred. */
  conditions: Array<{ id: string; label: string; status: "matched" | "unresolved" | "not-reached"; detail?: string;
    /** One date-independent condition within this candidate and matter. */
    oncePerCandidate?: string }>;
}
export type QualifiedEventScores = Partial<Record<QualifiedScoreKey, QualifiedEventScore>>;

/** Every caller supplies the exact same event sky, natal evidence and outcome.
 * Missing evidence, unsupported types, uncertain gender and non-favourable
 * events are unavailable, never silently treated as a zero. */
export function qualifiedEventScores(input: {
  matter?: string;
  outcome: EventOutcome;
  custom?: boolean;
  afterDeath?: boolean;
  birthIso: string;
  eventIso: string;
  gender?: string | null;
  natalPositions: ReadonlyArray<Pick<PlanetPosition, "planet" | "signIndex">>;
  sky: ReadonlyArray<Pick<PlanetPosition, "planet" | "signIndex">>;
  kp: KpEventRules;
  divisional?: ParashariDivisionalCheck;
  ordinary?: ParashariDatedCatalogue;
  additional?: AdditionalSchoolNatalEvidence;
  alp?: AlpEventEvidence;
}): QualifiedEventScores {
  const result: QualifiedEventScores = {};
  if (input.outcome !== "favourable" || !input.matter || input.custom || input.afterDeath || !Number.isFinite(Date.parse(input.eventIso)) ||
      !Number.isFinite(Date.parse(input.birthIso)) || Date.parse(input.eventIso) < Date.parse(input.birthIso)) return result;

  const natal = input.kp.natalRules;
  if (natal?.status === "assessed" && natal.rules.some((r) => r.role === "promise")) {
    const condition = natal.indication.status === "support";
    const conditions: QualifiedEventScore["conditions"] = [{ id: "natal", label: "Registered natal promise clues",
      status: condition ? "matched" : "unresolved", detail: `Natal indication: ${natal.indication.status}`,
      oncePerCandidate: `kp:${input.matter}:natal` }];
    let passes = condition;
    ["Dasa", "Bhukti", "Antara"].forEach((label, i) => {
      const reached = passes;
      const matched = reached && input.kp.hits[i];
      conditions.push({ id: label.toLowerCase(), label: `${label} links to a matter house`,
        status: !reached ? "not-reached" : matched ? "matched" : "unresolved",
        detail: `Linked houses: ${input.kp.signified[i].join(", ") || "none in this subset"}` });
      passes = !!matched;
    });
    result.kp = { score: conditions.filter((c) => c.status === "matched").length, max: 4, conditions };
  }

  const div = input.divisional;
  const ordinary = input.ordinary?.natal;
  if (div && ordinary?.status === "assessed") {
    const natalFactors = new Set(["d1-support", "division-support", "d10-lords"]);
    const conditions: QualifiedEventScore["conditions"] = div.factors.map((f) => ({ id: f.id, label: f.label,
      status: f.matched ? "matched" : "unresolved", detail: f.details.join("; "),
      ...(natalFactors.has(f.id) ? { oncePerCandidate: `parashari:${input.matter}:${div.division}:${f.id}` } : {}) }));
    if (input.matter === "child") {
      const clue = ordinary.rules.find((r) => r.finding.id === "pa-h5-16-16")?.finding;
      conditions.push({ id: "pa-h5-16-16", label: "BPHS 16.16 fifth-lord children clue",
        status: clue ? "matched" : "unresolved", detail: clue?.text ?? `No match in the selected ${ordinary.houseMethod} house frame`,
        oncePerCandidate: `parashari:child:${ordinary.houseMethod}:pa-h5-16-16` });
    }
    result.parashari = { score: conditions.filter((c) => c.status === "matched").length,
      max: input.matter === "child" ? 9 : 8, conditions };
  }

  if (input.matter === "marriage" && input.alp?.status === "assessed") {
    const matched = input.alp.findings.some((f) => f.finding.ruleId === "b2-marriage-navamsa-touches");
    result.alp = { score: Number(matched), max: 1, conditions: [{ id: "b2-marriage-navamsa-touches",
      label: "ALP marriage pada-navamsa condition", status: matched ? "matched" : "unresolved" }] };
  }

  if (input.matter === "marriage" && input.additional?.bnn.status === "assessed" &&
      (input.gender === "male" || input.gender === "female")) {
    const target: Planet = input.gender === "female" ? "Mars" : "Venus";
    const transiting = input.sky.find((p) => p.planet === "Jupiter");
    const natalTarget = input.natalPositions.find((p) => p.planet === target);
    if (transiting && natalTarget) {
      const matched = transiting.signIndex === natalTarget.signIndex;
      result.bnn = { score: Number(matched), max: 1, conditions: [{ id: `jupiter-${target.toLowerCase()}-same-sign`,
        label: `Jupiter in natal ${target}'s sign`, status: matched ? "matched" : "unresolved",
        detail: input.gender === "male" ? "Partial Venus clue: the cited example also specifies Jupiter's second round, which is not checked." : "One same-sign interpretation of the female-chart Mars clue." }] };
    }
  }
  return result;
}

/** Aggregate only when every recorded eligible event has exactly the same
 * eligibility in each comparison set. Missing checks are not zeroes. */
export function qualifiedTotals(rows: Array<QualifiedEventScores | undefined>, key: QualifiedScoreKey): { score: number; max: number } {
  const total = { score: 0, max: 0 };
  const seen = new Map<string, "matched" | "unresolved" | "not-reached">();
  for (const row of rows) {
    const value = row?.[key];
    if (!value) continue;
    // Compatibility for older saved results that do not carry condition details.
    if (value.conditions.length !== value.max) {
      total.score += value.score;
      total.max += value.max;
      continue;
    }
    for (const condition of value.conditions) {
      if (condition.oncePerCandidate) {
        const previous = seen.get(condition.oncePerCandidate);
        if (previous !== undefined) {
          if (previous !== condition.status) throw new Error(`Inconsistent natal condition: ${condition.oncePerCandidate}`);
          continue;
        }
        seen.set(condition.oncePerCandidate, condition.status);
      }
      total.max++;
      if (condition.status === "matched") total.score++;
    }
  }
  return total;
}
export function qualifiedComparable(actual: Array<QualifiedEventScores | undefined>, sample: Array<QualifiedEventScores | undefined>, key: QualifiedScoreKey): boolean {
  return actual.length === sample.length && actual.every((row, i) => {
    const a = row?.[key], b = sample[i]?.[key];
    if ((a?.max ?? 0) !== (b?.max ?? 0)) return false;
    if (!a || !b) return !a && !b;
    return a.conditions.length === b.conditions.length && a.conditions.every((c, j) =>
      c.id === b.conditions[j].id && c.oncePerCandidate === b.conditions[j].oncePerCandidate);
  });
}
