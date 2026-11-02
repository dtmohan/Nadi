/**
 * Research utility: nested Vimshottari periods. The nine-lord order and year table
 * are given in BPHS 46.12–16; the nested subdivision is described in 62.1 and
 * 63.1. https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-46
 * The default 365.25-day elapsed civil-calendar year is Nadi's convention, not
 * a year length asserted by those verses; callers may specify a different year.
 */
import { NAKSHATRA_LORD, type Planet } from "./astro";
import { VIMSHOTTARI_ORDER, VIMSHOTTARI_YEARS } from "./kp";
import { zodiacQuarter } from "./zodiac-quarter";

export interface VimshottariLevel {
  level: number;
  lord: Planet;
  /** Half-open UTC millisecond interval. The span is not clipped to the birth instant. */
  startMs: number;
  endMs: number;
}

/**
 * Resolve one path through the period tree; unlike a tree expansion this costs only nine
 * comparisons per level. Levels 1–5 correspond to Manley's 345 method; level 6 is exposed
 * for calculation only. This utility makes no interpretive or precision claim.
 */
export function vimshottariPathAt(moonLon: number, birthMs: number, eventMs: number, depth = 5,
  options: { yearDays?: number } = {}): VimshottariLevel[] {
  if (![moonLon, birthMs, eventMs].every(Number.isFinite) || eventMs < birthMs)
    throw new RangeError("Use finite inputs and an event at or after birth");
  if (!Number.isInteger(depth) || depth < 1 || depth > 6)
    throw new RangeError("Depth must be an integer from 1 to 6");
  const dayMs = 86_400_000;
  const yearDays = options.yearDays ?? 365.25;
  if (!Number.isFinite(yearDays) || yearDays <= 0) throw new RangeError("yearDays must be positive and finite");
  const quarter = zodiacQuarter(moonLon);
  const nak = quarter.starIndex;
  const natalLord = NAKSHATRA_LORD[nak];
  const fraction = quarter.starFraction;
  let start = birthMs - VIMSHOTTARI_YEARS[natalLord] * fraction * yearDays * dayMs;
  let span = 120 * yearDays * dayMs;
  while (eventMs >= start + span) start += span;
  let firstIndex = VIMSHOTTARI_ORDER.indexOf(natalLord);
  const path: VimshottariLevel[] = [];
  for (let level = 1; level <= depth; level++) {
    let selected: VimshottariLevel | undefined;
    for (let i = 0; i < VIMSHOTTARI_ORDER.length; i++) {
      const lord = VIMSHOTTARI_ORDER[(firstIndex + i) % VIMSHOTTARI_ORDER.length];
      const childSpan = span * VIMSHOTTARI_YEARS[lord] / 120;
      const endMs = start + childSpan;
      if (eventMs < endMs || i === VIMSHOTTARI_ORDER.length - 1) {
        selected = { level, lord, startMs: start, endMs };
        span = childSpan;
        firstIndex = VIMSHOTTARI_ORDER.indexOf(lord);
        break;
      }
      start = endMs;
    }
    if (!selected) throw new Error("Failed to resolve Vimshottari period");
    path.push(selected);
  }
  return path;
}
