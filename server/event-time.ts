import { DateTime } from "luxon";

type EventClock = { time?: string; timezone?: string };

/** Supplied event-local time and zone, otherwise noon and the birth zone. */
export function eventInstant(date: string, event: EventClock, birthZone: string): DateTime {
  const time = event.time ?? "12:00";
  const zone = event.timezone ?? birthZone;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw new Error(`Invalid event date or time: ${date} ${time}`);
  const local = DateTime.fromISO(`${date}T${time}`, { zone });
  if (!local.isValid || local.toISODate() !== date || local.toFormat("HH:mm") !== time)
    throw new Error(`Invalid or nonexistent event time: ${date} ${time} (${zone})`);
  if (local.getPossibleOffsets().length > 1)
    throw new Error(`Ambiguous event time: ${date} ${time} (${zone}). Use a fixed UTC offset, such as UTC-04:00, or omit the time.`);
  return local;
}

/** Backward-compatible helper for date-only callers and tests. */
export function eventAtNoon(date: string, zone: string): DateTime {
  return eventInstant(date, {}, zone);
}

/** Draw a date at which that event's local time exists and is unambiguous. */
export function comparisonDate(
  rnd: () => number, lo: number, hi: number, event: EventClock, birthZone: string,
): string {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const date = DateTime.fromMillis(lo + Math.floor(rnd() * (hi - lo)), { zone: "utc" }).toISODate()!;
    try { eventInstant(date, event, birthZone); return date; } catch { /* retry a DST gap/fold */ }
  }
  throw new Error("Could not draw a valid comparison date for the event time and zone");
}
