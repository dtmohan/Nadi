import { DateTime } from "luxon";
import { displayLocal, type TimeBasis } from "@shared/time-basis";

/** Preserve the clock basis used to display and save each rectification candidate. */
export function rectificationCandidateChart<T extends { birthDate: string }>(chart: T, utc: DateTime, basis: TimeBasis): T {
  const birthDate = displayLocal(utc, basis, basis.displayZone).toISODate();
  if (!birthDate) throw new Error("Cannot determine candidate birth date");
  return { ...chart, birthDate };
}
