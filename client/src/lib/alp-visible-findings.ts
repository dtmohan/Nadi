import { heldAreasAt, mentionsHeldArea, type AgeGateContext } from "@shared/life-stage";
import type { AlpFinding } from "@shared/rules-alp";

/** Both the selected date and the current life date must permit a topic. */
export function alpHeldAreas(birthIso: string, selected: string, now: string, chart: AgeGateContext) {
  const selectedHeld = heldAreasAt(birthIso, selected, chart);
  const nowHeld = heldAreasAt(birthIso, now, chart);
  return (area: string) => selectedHeld(area) || nowHeld(area);
}

/** A neutral headline can have evidence that names a topic held for later. */
export function visibleAlpFindings(findings: AlpFinding[], held: (area: string) => boolean): AlpFinding[] {
  return findings.filter((f) => !mentionsHeldArea([f.text, ...f.here].join(" "), held));
}
