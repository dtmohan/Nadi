/** Scope inventory for review and parity tests. Registration does not itself
 * implement a rule or render its output; those steps must also be tested. */
import type { KpEventRules } from "./kp-event-evidence";
import type { ManleyFrame } from "./manley-evidence";
import type { RectifyMethod } from "./rectify-methods";

type FieldScope = "natal" | "dated" | "derived-dated";
export const KP_EVENT_FIELDS = {
  signified: "dated", hits: "derived-dated", cuspSubLord: "natal", cuspSignified: "natal",
  promised: "natal", filtered: "dated", effective: "derived-dated", deniedAtCusp: "natal",
  score: "derived-dated", max: "derived-dated", transit: "dated", aurora: "dated", auroraV2: "dated",
} as const satisfies Record<keyof KpEventRules, FieldScope>;

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
