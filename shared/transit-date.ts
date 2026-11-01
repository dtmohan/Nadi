import { DateTime } from "luxon";

/** A transit instant displayed as a calendar day in the explicitly chosen chart zone. */
export function transitDay(iso: string, zone: string): string {
  const d = DateTime.fromISO(iso, { zone });
  return d.isValid ? d.toFormat("d LLL yyyy") : iso.slice(0, 10);
}
