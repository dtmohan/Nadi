/** Scope inventory for review and parity tests. Registration does not itself
 * implement a rule or render its output; those steps must also be tested. */
import type { KpEventRules } from "./kp-event-evidence";
import type { ManleyFrame } from "./manley-evidence";
import type { RectifyMethod } from "./rectify-methods";
import type { KpEventNatalRules } from "./kp-event-natal-rules";
import type { ParashariNatalCatalogue, ParashariDatedCatalogue } from "./parashari-event-natal-rules";
import type { AdditionalSchoolNatalEvidence } from "./additional-school-event-rules";
import type { AlpEventEvidence } from "./alp-event-evidence";

type FieldScope = "natal" | "dated" | "derived-dated";
export const KP_EVENT_FIELDS = {
  signified: "dated", hits: "derived-dated", cuspSubLord: "natal", cuspSignified: "natal",
  promised: "natal", filtered: "dated", effective: "derived-dated", deniedAtCusp: "natal",
  score: "derived-dated", max: "derived-dated", transit: "dated", aurora: "dated", auroraV2: "dated", natalRules: "natal",
} as const satisfies Record<keyof KpEventRules, FieldScope>;

/** New catalogue outputs require an explicit date scope before they can be
 * added; a registration alone does not authorise a score or timing rule. */
export const KP_NATAL_CATALOGUE_FIELDS = {
  matter: "natal", convention: "natal", status: "natal", rules: "natal", indication: "natal",
} as const satisfies Record<keyof KpEventNatalRules, FieldScope>;
export const PARASHARI_NATAL_CATALOGUE_FIELDS = {
  matter: "natal", status: "natal", subjectHouse: "natal", houseMethod: "natal", aspectFloor: "natal",
  houseMethodNote: "natal", assessment: "natal", rules: "natal",
} as const satisfies Record<keyof ParashariNatalCatalogue, FieldScope>;
export const PARASHARI_DATED_CATALOGUE_FIELDS = {
  natal: "natal", periods: "dated",
} as const satisfies Record<keyof ParashariDatedCatalogue, FieldScope>;
export const ADDITIONAL_SCHOOL_FIELDS = {
  matter: "natal", bnn: "natal", jaimini: "natal", prasna: "natal",
} as const satisfies Record<keyof AdditionalSchoolNatalEvidence, FieldScope>;
export const ALP_EVENT_FIELDS = {
  matter: "natal", topic: "natal", status: "dated", asOf: "dated", point: "dated", akshaya: "dated", findings: "dated",
} as const satisfies Record<keyof AlpEventEvidence, FieldScope>;

/** Every current frame field must receive an explicit scope when it is added. */
export const MANLEY_FRAME_FIELDS = {
  chart: "natal", ascendant: "natal", house: "natal", houseSign: "natal", houseLord: "natal",
  bhavatHouse: "natal", bhavatLord: "natal", primary: "natal", supporting: "natal", functional: "natal",
  angleTrinePairs: "natal", nodeDispositor: "natal", eventCombination: "natal",
} as const satisfies Record<keyof ManleyFrame, FieldScope>;

type ScopedMethod = Extract<RectifyMethod, `kp-${string}` | `parashari-${string}`>;
type MethodScope = { inputs: "chart" | "chart+event" | "chart+judgment" | "chart+event+judgment";
  shared: string; boundary: string };
export const RECTIFY_RULE_SCOPE = {
  "kp-moon": { inputs: "chart", shared: "natal KP frame", boundary: "birth-time diagnostic, not an event prediction" },
  "kp-rp": { inputs: "chart+judgment", shared: "natal KP frame", boundary: "candidate versus judgment-time ruling planets" },
  "kp-nemani-rp": { inputs: "chart+judgment", shared: "natal KP frame", boundary: "separate judgment-chart procedure" },
  "kp-events": { inputs: "chart+event", shared: "KP cusp and three period-lord event checks", boundary: "four-step event significators" },
  "kp-transit": { inputs: "chart+event+judgment", shared: "KP event checks and period-lord transits", boundary: "judgment Sun hint is separate from event-day score" },
  "kp-aurora": { inputs: "chart+event", shared: "Aurora strict cusp and period stages", boundary: "mapped topics only; research convention" },
  "kp-aurora-v2": { inputs: "chart+event", shared: "Aurora mixed cusp and period stages", boundary: "mapped topics only; research convention" },
  "parashari-events": { inputs: "chart+event", shared: "partial D1/divisional support, periods, double transit", boundary: "favourable marriage, child or job; v1 experimental tally" },
  "parashari-events-v2": { inputs: "chart+event", shared: "event-specific v2 factors", boundary: "favourable marriage, child or job; experimental tally" },
  "parashari-events-v3": { inputs: "chart+event", shared: "v2 and divisional period links", boundary: "favourable marriage, child or job; experimental tally" },
} as const satisfies Record<ScopedMethod, MethodScope>;
