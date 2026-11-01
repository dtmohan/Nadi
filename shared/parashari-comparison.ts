/** Research comparisons: the same event rules evaluated on real and trial dates. */
import type { ManleyEvidence } from "./manley-evidence";
import type { ParashariPromiseCheck } from "./parashari-promise";
import type { ParashariSpecificCheck } from "./parashari-specific";
import type { ParashariDivisionalCheck } from "./parashari-divisional";
import type { HierarchyEvent } from "./parashari-hierarchy";

export interface ComparisonStat {
  actual: number;
  mean: number;
  sd: number;
  percentile: number;
  verdict: "above" | "chance" | "below";
}
export interface StagedComparison {
  eligibleEvents: number;
  /** Main/subperiod support across the same eligible events. */
  first: ComparisonStat;
  /** For each actually supported event, the number of its trial dates that also pass the first stage. */
  qualifyingDraws: number[];
  /** Conditional third-level comparison for those events; absent if any has no qualifying trial. */
  third?: ComparisonStat;
}
export interface ParashariComparison {
  v1?: ComparisonStat;
  v2?: ComparisonStat;
  v3?: ComparisonStat;
  staged?: StagedComparison;
  hierarchy?: { eligibleEvents: number; d1: ComparisonStat; division: ComparisonStat; major: ComparisonStat;
    sub: ComparisonStat; third?: ComparisonStat; qualifyingDraws: number[] };
  /** Cross-chart period clues; natal indications remain qualitative and separate. */
  crossTiming?: StagedComparison;
  /** Narrow distinct favourable direct-lord subset, not a candidate ranking. */
  functional?: { eligibleEvents: number; stat: ComparisonStat };
  /** A trial lost an event eligible in the actual set, so the measure cannot be compared fairly. */
  unavailable?: Array<"v1" | "v2" | "v3" | "staged" | "hierarchy" | "crossTiming" | "functional">;
}
export interface ParashariObservation {
  v1?: number;
  v2?: number;
  v3?: number;
  /** Two gated observations for one event, or undefined when the event cannot be assessed. */
  staged?: { first: boolean; third: boolean };
  hierarchy?: HierarchyEvent["passes"];
  crossTiming?: { first: boolean; third: boolean };
  functional?: number;
}
/** One random-date event, for inspecting the very checks used in the trial. */
export interface ParashariComparisonExample {
  label: string;
  date: string;
  time?: string;
  timezone?: string;
  promise?: ParashariPromiseCheck;
  specific?: ParashariSpecificCheck;
  divisional?: ParashariDivisionalCheck;
  manley?: ManleyEvidence;
  hierarchy?: HierarchyEvent;
}

/** The exact partial event-level primary-link gate used by the staged research. */
export function stagedObservation(evidence: ManleyEvidence | undefined): ParashariObservation["staged"] {
  if (!evidence?.antara || evidence.periods.length !== 2) return undefined;
  const periods = [...evidence.periods, evidence.antara];
  const hits = periods.map((p) => {
    const f = p.frames.find((frame) => frame.chart === evidence.division);
    return !!f && !!(f.primary.house.length || f.primary.houseLord.length || f.primary.karaka.length);
  });
  const first = hits[0] && hits[1];
  return { first, third: first && hits[2] };
}

export function comparisonStat(xs: number[], actual: number): ComparisonStat {
  if (!xs.length) throw new Error("Comparison requires at least one trial");
  const mean = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((sum, x) => sum + (x - mean) ** 2, 0) / xs.length);
  const below = xs.filter((x) => x < actual).length;
  const equal = xs.filter((x) => x === actual).length;
  const percentile = Math.round(100 * (below + equal / 2) / xs.length);
  return { actual, mean: Math.round(mean * 10) / 10, sd: Math.round(sd * 10) / 10, percentile,
    verdict: percentile >= 95 ? "above" : percentile <= 5 ? "below" : "chance" };
}

/**
 * A comparison is omitted if a trial cannot evaluate an event eligible in the
 * real set. For third level, keep only real events passing stage one and, for
 * each such event, only its trials passing stage one. Independent event-date
 * draws are then recombined by convolving their empirical Bernoulli rates.
 */
export function summarizeParashariComparisons(actual: ParashariObservation[], trials: ParashariObservation[][]): ParashariComparison {
  const result: ParashariComparison = {};
  if (!trials.length || trials.some((t) => t.length !== actual.length)) return result;
  for (const version of ["v1", "v2", "v3"] as const) {
    const indices = actual.flatMap((a, i) => a[version] !== undefined ? [i] : []);
    if (!indices.length) continue;
    if (trials.some((trial) => indices.some((i) => trial[i][version] === undefined))) {
      (result.unavailable ??= []).push(version);
      continue;
    }
    const total = (set: ParashariObservation[]) => indices.reduce((sum, i) => sum + set[i][version]!, 0);
    result[version] = comparisonStat(trials.map(total), total(actual));
  }
  const functionalIndices = actual.flatMap((a, i) => a.functional === undefined ? [] : [i]);
  if (functionalIndices.length) {
    if (trials.some((trial) => functionalIndices.some((i) => trial[i].functional === undefined))) {
      (result.unavailable ??= []).push("functional");
    } else {
      const total = (set: ParashariObservation[]) => functionalIndices.reduce((sum, i) => sum + set[i].functional!, 0);
      result.functional = { eligibleEvents: functionalIndices.length, stat: comparisonStat(trials.map(total), total(actual)) };
    }
  }
  const crossIndices = actual.flatMap((a, i) => a.crossTiming ? [i] : []);
  if (crossIndices.length) {
    if (trials.some((trial) => crossIndices.some((i) => !trial[i].crossTiming))) {
      (result.unavailable ??= []).push("crossTiming");
    } else {
      const project = (set: ParashariObservation[]): ParashariObservation[] => set.map((o) => ({ staged: o.crossTiming }));
      result.crossTiming = summarizeParashariComparisons(project(actual), trials.map(project)).staged;
    }
  }
  const hierarchyIndices = actual.flatMap((a, i) => a.hierarchy ? [i] : []);
  if (hierarchyIndices.length) {
    if (trials.some((trial) => hierarchyIndices.some((i) => !trial[i].hierarchy))) {
      (result.unavailable ??= []).push("hierarchy");
    } else {
      const stat = (stage: "d1" | "division" | "major" | "sub") => {
        const count = (set: ParashariObservation[]) => hierarchyIndices.filter((i) => set[i].hierarchy![stage]).length;
        return comparisonStat(trials.map(count), count(actual));
      };
      // Reuse the conditional per-event third-level calculation. Each draw
      // must pass the same natal and period predecessors as the real event.
      const project = (set: ParashariObservation[]): ParashariObservation[] => set.map((o) => ({
        staged: o.hierarchy ? { first: o.hierarchy.sub, third: o.hierarchy.third } : undefined,
      }));
      const conditional = summarizeParashariComparisons(project(actual), trials.map(project)).staged!;
      result.hierarchy = { eligibleEvents: hierarchyIndices.length, d1: stat("d1"), division: stat("division"),
        major: stat("major"), sub: stat("sub"), third: conditional.third, qualifyingDraws: conditional.qualifyingDraws };
    }
  }
  const indices = actual.flatMap((a, i) => a.staged ? [i] : []);
  if (!indices.length) return result;
  if (trials.some((trial) => indices.some((i) => !trial[i].staged))) {
    (result.unavailable ??= []).push("staged");
    return result;
  }
  const firstCount = (set: ParashariObservation[]) => indices.filter((i) => set[i].staged!.first).length;
  const first = comparisonStat(trials.map(firstCount), firstCount(actual));
  const supported = indices.filter((i) => actual[i].staged!.first);
  const eligibleTrials = supported.map((i) => trials.filter((trial) => trial[i].staged!.first));
  const qualifyingDraws = eligibleTrials.map((set) => set.length);
  let third: ComparisonStat | undefined;
  if (supported.length && qualifyingDraws.every((n) => n > 0)) {
    const rates = eligibleTrials.map((set, n) =>
      set.filter((trial) => trial[supported[n]].staged!.third).length / set.length);
    // The simulation samples event dates independently. Convolving the empirical
    // conditional rates uses every qualifying event draw without requiring an
    // otherwise irrelevant pattern of failures across the whole event set.
    let distribution = [1];
    for (const p of rates) {
      const next = Array<number>(distribution.length + 1).fill(0);
      distribution.forEach((weight, count) => { next[count] += weight * (1 - p); next[count + 1] += weight * p; });
      distribution = next;
    }
    const observed = supported.filter((i) => actual[i].staged!.third).length;
    const mean = rates.reduce((sum, p) => sum + p, 0);
    const sd = Math.sqrt(rates.reduce((sum, p) => sum + p * (1 - p), 0));
    const below = distribution.slice(0, observed).reduce((sum, p) => sum + p, 0);
    const percentile = Math.round(100 * (below + distribution[observed] / 2));
    third = { actual: observed, mean: Math.round(mean * 10) / 10, sd: Math.round(sd * 10) / 10, percentile,
      verdict: percentile >= 95 ? "above" : percentile <= 5 ? "below" : "chance" };
  }
  result.staged = { eligibleEvents: indices.length, first, qualifyingDraws, third };
  return result;
}
