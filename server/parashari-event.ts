/** Shared real-event and comparison-date Parashari evaluation at one natal candidate. */
import { SIGN_LORD, type Planet, type PlanetPosition } from "@shared/astro";
import { vimshottariLordsAtMs } from "@shared/kp";
import { createManleyEvidenceScorer, manleyTopicFor, type ManleyEvidence } from "@shared/manley-evidence";
import { parashariVargaEvidence, parashariVargaPeriods, vargaTopicFor, type ParashariVargaEvidence } from "@shared/parashari-varga-evidence";
import { parashariPromiseCheck, type ParashariPromiseCheck } from "@shared/parashari-promise";
import { parashariSpecificCheck, type ParashariSpecificCheck } from "@shared/parashari-specific";
import { parashariDivisionalCheck, type ParashariDivisionalCheck } from "@shared/parashari-divisional";
import { stagedObservation, type ParashariObservation } from "@shared/parashari-comparison";
import { createParashariHierarchyScorer, type HierarchyEvent } from "@shared/parashari-hierarchy";
import { functionalObservation } from "@shared/parashari-functional";
import { conditionalObservations } from "@shared/parashari-conditional";

export interface ParashariEventInput {
  label: string;
  matter?: string;
  outcome?: "favourable" | "unfavourable" | "mixed";
  time?: string;
  timezone?: string;
}

export interface ParashariEventResult {
  varga?: ParashariVargaEvidence;
  manley?: ManleyEvidence;
  promise?: ParashariPromiseCheck;
  specific?: ParashariSpecificCheck;
  divisional?: ParashariDivisionalCheck;
  hierarchy?: HierarchyEvent;
}

export function parashariObservation(result: ParashariEventResult, outcome?: ParashariEventInput["outcome"]): ParashariObservation {
  return { v1: result.promise?.score, v2: result.specific?.score, v3: result.divisional?.score,
    staged: stagedObservation(result.manley), hierarchy: result.hierarchy?.passes, crossTiming: result.hierarchy?.crossChart?.timing,
    functional: functionalObservation(result.manley, outcome), conditional: conditionalObservations(result.manley, outcome) };
}

/**
 * Cache only natal/period frames for this candidate. The score is recomputed
 * with each event date's own transit sky and the input's own outcome.
 */
export function createParashariEventScorer(natal: PlanetPosition[], lagna: number, birthIso: string, birthZone: string) {
  const moon = natal.find((p) => p.planet === "Moon");
  if (!moon) throw new Error("Parashari event check requires the natal Moon");
  const birthMs = Date.parse(birthIso);
  const scoreManley = createManleyEvidenceScorer(natal, lagna);
  const scoreHierarchy = createParashariHierarchyScorer(natal, lagna);
  const natalVargaCache = new Map<string, ParashariVargaEvidence>();
  const vargaCache = new Map<string, ParashariVargaEvidence>();
  const manleyCache = new Map<string, ManleyEvidence>();
  const hierarchyCache = new Map<string, HierarchyEvent>();
  // These two source-adapted checks use sign-based transit positions. Their
  // natal frames, first two periods and relevant transit signs determine the
  // result; dates and labels are restored on each returned event below.
  const interpretationCache = new Map<string, { promise?: ParashariPromiseCheck; specific?: ParashariSpecificCheck }>();
  return (event: ParashariEventInput, date: string, eventIso: string, sky: PlanetPosition[]): ParashariEventResult => {
    const millis = Date.parse(eventIso);
    if (!Number.isFinite(millis) || !Number.isFinite(birthMs)) throw new Error("Invalid Parashari event instant");
    const periods: [Planet, Planet, Planet] | null = millis >= birthMs
      ? vimshottariLordsAtMs(moon.lon, birthMs, millis) : null;
    const key = `${event.matter ?? ""}|${periods?.join(":") ?? "before-birth"}`;
    let varga: ParashariVargaEvidence | undefined;
    if (vargaTopicFor(event.matter)) {
      let template = vargaCache.get(key);
      if (!template) {
        const matter = event.matter!;
        let base = natalVargaCache.get(matter);
        if (!base) {
          base = parashariVargaEvidence({ label: event.label, date, matter }, natal, lagna, null);
          if (base) natalVargaCache.set(matter, base);
        }
        if (base) {
          template = { ...base, label: event.label, date, periods: parashariVargaPeriods(base, natal, periods) };
          vargaCache.set(key, template);
        }
      }
      if (template) varga = { ...template, label: event.label, date };
    }
    let manley: ManleyEvidence | undefined;
    if (periods && manleyTopicFor(event.matter)) {
      let template = manleyCache.get(key);
      if (!template) {
        template = scoreManley({ ...event, date, birthTimezone: birthZone }, periods);
        if (template) manleyCache.set(key, template);
      }
      if (template) manley = { ...template, label: event.label, date,
        moment: { time: event.time ?? "12:00", timeAssumed: !event.time,
          timezone: event.timezone ?? birthZone, timezoneAssumed: !event.timezone } };
    }
    const relevantPlanets: Planet[] = ["Jupiter", "Saturn"];
    if (event.matter === "child" && varga) relevantPlanets.push(SIGN_LORD[varga.rashi.lagnaSign], varga.rashi.houseLord);
    const skyKey = relevantPlanets.map((p) => `${p}:${sky.find((position) => position.planet === p)?.signIndex ?? "missing"}`).join(":");
    const interpretationKey = `${event.matter ?? ""}|${event.outcome ?? ""}|${periods?.slice(0, 2).join(":") ?? "before-birth"}|${skyKey}`;
    let cached = interpretationCache.get(interpretationKey);
    if (!cached) {
      const promise = parashariPromiseCheck(varga, event.outcome, natal, sky);
      const specific = parashariSpecificCheck(varga, event.outcome, natal, sky, promise);
      cached = { promise, specific };
      interpretationCache.set(interpretationKey, cached);
    }
    const promise = cached.promise ? { ...cached.promise, label: event.label, date } : undefined;
    const specific = cached.specific ? { ...cached.specific, label: event.label, date } : undefined;
    const hierarchyKey = `${key}|${event.outcome ?? ""}`;
    let hierarchy = hierarchyCache.get(hierarchyKey);
    if (!hierarchy) {
      hierarchy = scoreHierarchy(manley, event.outcome);
      if (hierarchy) hierarchyCache.set(hierarchyKey, hierarchy);
    }
    if (hierarchy) hierarchy = { ...hierarchy, label: event.label, date, moment: manley?.moment };
    return { varga, manley, promise, specific, divisional: parashariDivisionalCheck(specific, manley), hierarchy };
  };
}
