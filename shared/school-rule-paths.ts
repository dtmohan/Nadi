/**
 * Auditable coverage of the principal rule families. This is scope metadata, not a
 * rule executor or a claim that all rules of a school have event implementations.
 * A new family must be wired, qualified and tested before its paths become available.
 */
import type { RectifyMethod } from "./rectify-methods";

export type RulePath = "chart" | "dated-reading" | "validate" | "rectify" | "comparison";
export type PathStatus = "shared" | "natal-only" | "separate-method" | "not-implemented";
export interface RuleFamilyPath {
  school: "BNN" | "KP" | "Parashari" | "Jaimini" | "ALP" | "Prasna Marga" | "Brihat Jataka";
  label: string;
  evaluator: string;
  requires: readonly string[];
  paths: Readonly<Record<RulePath, PathStatus>>;
  limits: string;
}

export const SCHOOL_RULE_PATHS = {
  bnnNatal: { school: "BNN", label: "Natal combinations", evaluator: "evaluate", requires: ["natal frame"],
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "not-implemented", comparison: "shared" },
    limits: "Validation selects an applicable natal finding for its separate transit comparison. Rectify has no BNN event method." },
  kpNatal: { school: "KP", label: "Natal interpretations", evaluator: "computeKp / evaluateKp", requires: ["KP natal frame", "Placidus cusps", "reading settings"],
    paths: { chart: "shared", "dated-reading": "not-implemented", validate: "not-implemented", rectify: "not-implemented", comparison: "not-implemented" },
    limits: "The complete KP chart rule catalogue is not automatically an event score. The event family below uses its own qualified cusp and significator subset." },
  kpEvent: { school: "KP", label: "Event cusp, period and transit checks", evaluator: "createKpEventScorer", requires: ["KP natal frame", "mapped matter", "event instant", "event sky"],
    paths: { chart: "natal-only", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "Uses four-step event significators and named Aurora subsets; optional six-step chart reading and judgment-time diagnostics are separate." },
  kpDiagnostic: { school: "KP", label: "Moon and ruling-planet rectification", evaluator: "Moon and judgment-chart checks", requires: ["candidate KP natal frame", "judgment frame for ruling-planet variants"],
    paths: { chart: "not-implemented", "dated-reading": "not-implemented", validate: "not-implemented", rectify: "separate-method", comparison: "not-implemented" },
    limits: "Birth-time diagnostics; the ruling-planet variants need an actual judgment instant and are not event predictions." },
  parashariNatal: { school: "Parashari", label: "Natal house and yoga readings", evaluator: "computeParashari", requires: ["natal frame", "house method", "reading instant"],
    paths: { chart: "shared", "dated-reading": "not-implemented", validate: "not-implemented", rectify: "not-implemented", comparison: "not-implemented" },
    limits: "Full house and yoga findings are not automatically promoted to event scores; the shared research subset below uses whole-sign frames." },
  parashariEvent: { school: "Parashari", label: "Event and divisional checks", evaluator: "createParashariEventScorer", requires: ["natal frame", "mapped matter", "event instant", "event sky"],
    paths: { chart: "natal-only", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "Natal projections and dated checks share the implemented partial D1/divisional families, not every Parashari rule." },
  jaiminiNatal: { school: "Jaimini", label: "Natal readings", evaluator: "computeJaimini", requires: ["natal frame"],
    paths: { chart: "shared", "dated-reading": "natal-only", validate: "natal-only", rectify: "natal-only", comparison: "natal-only" },
    limits: "The event method consumes the Chara-dasha frame; other natal findings do not automatically become event scoring rules." },
  jaiminiDasha: { school: "Jaimini", label: "Chara-dasha event checks", evaluator: "dashaFitAt", requires: ["natal frame", "mapped area", "event instant"],
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "The chart's timing windows use the same underlying triggers; the dated check is available only for matters mapped to a Jaimini area." },
  alp: { school: "ALP", label: "Progressed-lagna readings", evaluator: "computeAlp / evaluateAlp", requires: ["natal frame", "reading instant", "ALP settings"],
    paths: { chart: "shared", "dated-reading": "separate-method", validate: "not-implemented", rectify: "not-implemented", comparison: "not-implemented" },
    limits: "The ALP date picker reads an ALP progression; it is not the Validate event scorer." },
  prasna: { school: "Prasna Marga", label: "House readings", evaluator: "computePrasna", requires: ["specified natal or sky frame", "reference sign"],
    paths: { chart: "shared", "dated-reading": "separate-method", validate: "not-implemented", rectify: "not-implemented", comparison: "not-implemented" },
    limits: "The natal house walk and stored sky snapshot have different inputs and do not form a shared event score." },
  kunda: { school: "Prasna Marga", label: "Kunda birth-time diagnostics", evaluator: "kundaCheck / kundaD81Check", requires: ["candidate ascendant", "natal Moon"],
    paths: { chart: "not-implemented", "dated-reading": "not-implemented", validate: "not-implemented", rectify: "separate-method", comparison: "not-implemented" },
    limits: "Raman's worked arithmetic and the D81 variant are distinct birth-time comparisons, not event scores." },
  bjMarks: { school: "Brihat Jataka", label: "Body-mark rectification", evaluator: "computeBodyMarks", requires: ["candidate natal frame", "confirmed body marks"],
    paths: { chart: "not-implemented", "dated-reading": "not-implemented", validate: "not-implemented", rectify: "separate-method", comparison: "not-implemented" },
    limits: "A separate candidate-to-observed-marks comparison; it is not a dated-event score." },
  bjNashta: { school: "Brihat Jataka", label: "Lost-horoscope diagnostic", evaluator: "nashtaNakshatra", requires: ["candidate ascendant", "natal planets", "natal Moon"],
    paths: { chart: "not-implemented", "dated-reading": "not-implemented", validate: "not-implemented", rectify: "separate-method", comparison: "not-implemented" },
    limits: "A separately qualified birth-star comparison; it is not a dated-event score." },
} as const satisfies Record<string, RuleFamilyPath>;

/** Every selectable rectification method must be assigned to an audited family. */
export const RECTIFY_RULE_FAMILY = {
  "kp-rp": "kpDiagnostic", "kp-nemani-rp": "kpDiagnostic", "kp-moon": "kpDiagnostic",
  "kp-events": "kpEvent", "kp-transit": "kpEvent", "kp-aurora": "kpEvent", "kp-aurora-v2": "kpEvent",
  "jaimini-dasha": "jaiminiDasha",
  "parashari-events": "parashariEvent", "parashari-events-v2": "parashariEvent", "parashari-events-v3": "parashariEvent",
  "bj-marks": "bjMarks", "bj-nashta": "bjNashta", kunda: "kunda", "kunda-d81": "kunda",
} as const satisfies Record<RectifyMethod, keyof typeof SCHOOL_RULE_PATHS>;
