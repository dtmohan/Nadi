import type { Locale } from "@shared/localization";

/** The editorial room is English-only for now; retain a direct Malayalam reading. */
export function readingEntryPath(id: string | number, locale: Locale): string {
  return `/chart/${id}/${locale === "ml" ? "reading" : "room"}`;
}

/** Shared by the room and all existing chart edits; never create a separate stale room cache. */
export function readingRoomChartKey(id: string | undefined) {
  return ["chart-result", id] as const;
}
