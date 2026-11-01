/** Shared real-event and comparison-date Parashari evaluation at one natal candidate. */
import type { Planet, PlanetPosition } from "@shared/astro";
import { vimshottariLordsAt } from "@shared/kp";
import { manleyEvidence, manleyTopicFor, type ManleyEvidence } from "@shared/manley-evidence";
import { parashariVargaEvidence, vargaTopicFor, type ParashariVargaEvidence } from "@shared/parashari-varga-evidence";
import { parashariPromiseCheck, type ParashariPromiseCheck } from "@shared/parashari-promise";
import { parashariSpecificCheck, type ParashariSpecificCheck } from "@shared/parashari-specific";
import { parashariDivisionalCheck, type ParashariDivisionalCheck } from "@shared/parashari-divisional";
import { stagedObservation, type ParashariObservation } from "@shared/parashari-comparison";

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
}

export function parashariObservation(result: ParashariEventResult): ParashariObservation {
  return { v1: result.promise?.score, v2: result.specific?.score, v3: result.divisional?.score,
    staged: stagedObservation(result.manley) };
}

/**
 * Cache only natal/period frames for this candidate. The score is recomputed
 * with each event date's own transit sky and the input's own outcome.
 */
export function createParashariEventScorer(natal: PlanetPosition[], lagna: number, birthIso: string, birthZone: string) {
  const moon = natal.find((p) => p.planet === "Moon");
  if (!moon) throw new Error("Parashari event check requires the natal Moon");
  const birthMs = Date.parse(birthIso);
  const vargaCache = new Map<string, ParashariVargaEvidence>();
  const manleyCache = new Map<string, ManleyEvidence>();
  return (event: ParashariEventInput, date: string, eventIso: string, sky: PlanetPosition[]): ParashariEventResult => {
    const millis = Date.parse(eventIso);
    if (!Number.isFinite(millis) || !Number.isFinite(birthMs)) throw new Error("Invalid Parashari event instant");
    const periods: [Planet, Planet, Planet] | null = millis >= birthMs
      ? vimshottariLordsAt(moon.lon, birthIso, eventIso) : null;
    const key = `${event.matter ?? ""}|${periods?.join(":") ?? "before-birth"}`;
    let varga: ParashariVargaEvidence | undefined;
    if (vargaTopicFor(event.matter)) {
      let template = vargaCache.get(key);
      if (!template) {
        template = parashariVargaEvidence({ label: event.label, date, matter: event.matter }, natal, lagna, periods);
        if (template) vargaCache.set(key, template);
      }
      if (template) varga = { ...template, label: event.label, date };
    }
    let manley: ManleyEvidence | undefined;
    if (periods && manleyTopicFor(event.matter)) {
      let template = manleyCache.get(key);
      if (!template) {
        template = manleyEvidence({ ...event, date, birthTimezone: birthZone }, natal, lagna, periods);
        if (template) manleyCache.set(key, template);
      }
      if (template) manley = { ...template, label: event.label, date,
        moment: { time: event.time ?? "12:00", timeAssumed: !event.time,
          timezone: event.timezone ?? birthZone, timezoneAssumed: !event.timezone } };
    }
    const promise = parashariPromiseCheck(varga, event.outcome, natal, sky);
    const specific = parashariSpecificCheck(varga, event.outcome, natal, sky);
    return { varga, manley, promise, specific, divisional: parashariDivisionalCheck(specific, manley) };
  };
}
