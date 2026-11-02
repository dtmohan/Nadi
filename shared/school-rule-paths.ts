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
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "Mapped natal area findings are shared as context at each candidate and comparison date. Validate's separate transit score selects a touched finding; Rectify has no BNN event ranking method." },
  kpNatal: { school: "KP", label: "Natal interpretations", evaluator: "computeKp / evaluateKp", requires: ["KP natal frame", "Placidus cusps", "reading settings"],
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "A reviewed event-specific subset uses the ordinary four-step rule evaluator at every candidate and trial. Other catalogue rules are not automatically event rules; the existing event score remains separate. Custom houses or cusps are not silently mapped." },
  kpEvent: { school: "KP", label: "Event cusp, period and transit checks", evaluator: "createKpEventScorer", requires: ["KP natal frame", "mapped matter", "event instant", "event sky"],
    paths: { chart: "natal-only", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "Uses four-step event significators and named Aurora subsets; optional six-step chart reading and judgment-time diagnostics are separate." },
  kpDiagnostic: { school: "KP", label: "Moon and ruling-planet rectification", evaluator: "Moon and judgment-chart checks", requires: ["candidate KP natal frame", "judgment frame for ruling-planet variants"],
    paths: { chart: "not-implemented", "dated-reading": "not-implemented", validate: "not-implemented", rectify: "separate-method", comparison: "not-implemented" },
    limits: "Birth-time diagnostics; the ruling-planet variants need an actual judgment instant and are not event predictions." },
  parashariNatal: { school: "Parashari", label: "Natal house and yoga readings", evaluator: "computeParashari", requires: ["natal frame", "house method", "reading instant"],
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "The ordinary subject-house/lord findings and yogas involving that lord are carried as context with the selected house method and default aspect floor. Their named period-lord participants are descriptive; the separate event research uses whole signs and full aspects." },
  parashariEvent: { school: "Parashari", label: "Event and divisional checks", evaluator: "createParashariEventScorer", requires: ["natal frame", "mapped matter", "event instant", "event sky"],
    paths: { chart: "natal-only", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "Natal projections and dated checks share the implemented partial D1/divisional families, not every Parashari rule." },
  jaiminiNatal: { school: "Jaimini", label: "Natal readings", evaluator: "computeJaimini", requires: ["natal frame"],
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "Existing mapped-area natal findings are shared as broad context. They do not automatically become event scoring rules; the Chara-dasha check remains separate." },
  jaiminiDasha: { school: "Jaimini", label: "Chara-dasha event checks", evaluator: "dashaFitAt", requires: ["natal frame", "mapped area", "event instant"],
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "The chart's timing windows use the same underlying triggers; the dated check is available only for matters mapped to a Jaimini area." },
  alp: { school: "ALP", label: "Progressed-lagna readings", evaluator: "computeAlp / evaluateAlp", requires: ["natal frame", "reading instant", "ALP settings"],
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "Reviewed topic findings reuse the default ordinary ALP evaluator at the exact actual or sampled event instant; comparison frequencies are descriptive, without an event score. The chart date picker uses the start of a day and may differ at a boundary." },
  prasna: { school: "Prasna Marga", label: "House readings", evaluator: "computePrasna", requires: ["specified natal or sky frame", "reference sign"],
    paths: { chart: "shared", "dated-reading": "shared", validate: "shared", rectify: "shared", comparison: "shared" },
    limits: "The selected natal-house and Gulika clues are shared as context; they do not form a horary question chart or event score. A stored sky snapshot and actual question chart require separate inputs." },
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
