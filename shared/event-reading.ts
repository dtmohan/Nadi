/** Shared subject gates and natal evidence for a chart reading and its event checks. */
import type { ChartResult } from "./schema";
import { EVENT_MATTERS, eventReadingArea, matterOf, sensitiveEventMatter } from "./events";
import { areaSeason, lifeAsOf, sensitiveGate } from "./life-stage";
import { parashariVargaEvidence, type ParashariVargaEvidence } from "./parashari-varga-evidence";

/** Use the same reading-age policy as the main chart, even when the selected date is in the future. */
export function eventReadingAllowed(matter: string, birthIso: string, asOf: string,
  chart: { deathDate?: string | null }): boolean {
  if (!EVENT_MATTERS.some((m) => m.id === matter)) return false;
  if (sensitiveGate(chart, birthIso, asOf).withheld && sensitiveEventMatter(matter)) return false;
  const area = eventReadingArea(matter);
  return !area || areaSeason(area, birthIso, lifeAsOf(chart, asOf), chart).inSeason;
}

/** The same D1/divisional natal frames used by the event scorer, without inventing a date or period. */
export function natalEventEvidence(result: Pick<ChartResult, "positions" | "jaimini" | "utc" | "chart" | "now">): ParashariVargaEvidence[] {
  return ["marriage", "child", "job"].flatMap((matter) => {
    if (!eventReadingAllowed(matter, result.utc, result.now.asOf, result.chart)) return [];
    const evidence = parashariVargaEvidence({ label: matterOf(matter).label, date: result.chart.birthDate, matter },
      result.positions, result.jaimini.lagna.lon, null);
    return evidence ? [evidence] : [];
  });
}
