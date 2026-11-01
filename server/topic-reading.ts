import { DateTime } from "luxon";
import type { InsertChart } from "@shared/schema";
import type { ChartEvent } from "@shared/events";
import { eventReadingAllowed } from "@shared/event-reading";
import { areaSeason, isDeceased, lifeAsOf, redactSensitive, sensitiveGate } from "@shared/life-stage";
import type { EventValidation } from "@shared/validate-types";
import { birthInstant } from "./ephemeris";
import { eventInstant } from "./event-time";
import { validateEvents } from "./validate";

/**
 * Investigate one matter and local moment using the same event evaluator as
 * Validate. The proposed date is not added to the chart or treated as an event
 * that occurred. No random-date comparison is generated for a single date.
 */
export function topicReading(chart: InsertChart, event: ChartEvent, asOf = DateTime.utc().toISO()!): EventValidation {
  const birth = birthInstant(chart).utc;
  if (!eventReadingAllowed(event.matter, birth.toISO()!, asOf, chart))
    throw new Error("This matter is not available in the chart reading at the native's age.");
  const instant = eventInstant(event.date, event, chart.timezone).toUTC();
  if (instant.toMillis() < birth.toMillis()) throw new Error("Choose a date and time at or after birth.");
  if (isDeceased(chart, asOf) && chart.deathDate && event.date > chart.deathDate)
    throw new Error("Choose a date on or before the recorded date of passing.");
  let result = validateEvents({ ...chart, events: [event] }).events[0];
  if (!result) throw new Error("This matter could not be evaluated.");
  // A mapped area may be broader than the topic label (e.g. education is
  // mapped to Jaimini's children area); keep the ordinary reading's age gate.
  if (result.jaimini && !areaSeason(result.jaimini.area, birth.toISO()!, lifeAsOf(chart, asOf)).inSeason)
    result = { ...result, jaimini: null };
  if (sensitiveGate(chart, birth.toISO()!, asOf).withheld) result = redactSensitive(result);
  return result;
}
