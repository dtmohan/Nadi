/**
 * P.V.R. Narasimha Rao's 2000 textbook variant of Kalachakra dasa.
 *
 * This is a distinct research calculation, not a replacement for the BPHS
 * reading in kalachakra.ts. Rao's wheel continues into the next group of
 * nine signs instead of repeating the birth-pada's nine. He prefers a
 * 360-day savana year for this nakshatra dasa. See ch. 24, tables 42–48,
 * examples 95–97, and ch. 32 example 130:
 * https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=301
 *
 * Periods are astronomical calculations under named conventions. They do
 * not by themselves establish the occurrence of an event or a birth time.
 */
import { NAKSHATRAS } from "./astro";
import { KC_SIGN_YEARS, isSavya } from "./kalachakra";
import { zodiacQuarter } from "./zodiac-quarter";

const DAY_MS = 86_400_000;

// Zodiac indices: Aries=0. These are the two 24-sign wheels in Rao's table 43.
const SAVYA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 7, 6, 5, 3, 4, 2, 1, 0, 11, 10, 9, 8] as const;
const APASAVYA = [8, 9, 10, 11, 0, 1, 2, 4, 3, 5, 6, 7, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] as const;

export interface PvrKalaPeriod {
  sign: number;
  /** Full, half-open period, possibly beginning before birth. */
  startMs: number;
  endMs: number;
  /** Position in the 24-sign wheel; repeated signs are deliberately distinct. */
  wheelIndex: number;
}
export interface PvrKalaPath {
  nakshatra: string;
  pada: number;
  chakra: "Savya" | "Apasavya";
  birthSequence: number[];
  totalYears: number;
  yearDays: number;
  major: PvrKalaPeriod;
  sub: PvrKalaPeriod;
}

/** Resolve the major and subperiod at an event instant, including the first partial period. */
export function pvrKalachakraAt(moonLon: number, birthMs: number, eventMs: number,
  options: { yearDays?: number } = {}): PvrKalaPath {
  const yearDays = options.yearDays ?? 360;
  if (![moonLon, birthMs, eventMs, yearDays].every(Number.isFinite) || eventMs < birthMs || yearDays <= 0)
    throw new RangeError("Use finite inputs, a positive year length, and an event at or after birth");
  const quarter = zodiacQuarter(moonLon);
  const nak = quarter.starIndex;
  const pada = quarter.pada - 1;
  const fraction = quarter.fraction;
  const savya = isSavya(nak);
  const wheel: readonly number[] = savya ? SAVYA : APASAVYA;
  // Table 44/45 and 46/47 determine the subgroup's starting half of the wheel.
  const base = savya ? (nak % 3 === 1 ? 12 : 0) : (nak % 3 === 0 ? 0 : 12);
  const start = (base + pada * 9) % 24;
  const sequence = Array.from({ length: 9 }, (_, i) => wheel[(start + i) % 24]);
  const totalYears = sequence.reduce((sum, sign) => sum + KC_SIGN_YEARS[sign], 0);
  let expired = fraction * totalYears;
  let index = start;
  while (expired >= KC_SIGN_YEARS[wheel[index]]) {
    expired -= KC_SIGN_YEARS[wheel[index]];
    index = (index + 1) % 24;
  }
  const yearMs = yearDays * DAY_MS;
  let majorStart = birthMs - expired * yearMs;
  let majorEnd = majorStart + KC_SIGN_YEARS[wheel[index]] * yearMs;
  while (eventMs >= majorEnd) {
    majorStart = majorEnd;
    index = (index + 1) % 24;
    majorEnd = majorStart + KC_SIGN_YEARS[wheel[index]] * yearMs;
  }
  const major = { sign: wheel[index], startMs: majorStart, endMs: majorEnd, wheelIndex: index };
  const subs = Array.from({ length: 9 }, (_, i) => wheel[(index + i) % 24]);
  const subTotal = subs.reduce((sum, sign) => sum + KC_SIGN_YEARS[sign], 0);
  let subStart = majorStart;
  let sub: PvrKalaPeriod | undefined;
  for (let i = 0; i < subs.length; i++) {
    const subEnd = i === subs.length - 1 ? majorEnd
      : subStart + (majorEnd - majorStart) * KC_SIGN_YEARS[subs[i]] / subTotal;
    if (eventMs < subEnd) {
      sub = { sign: subs[i], startMs: subStart, endMs: subEnd, wheelIndex: (index + i) % 24 };
      break;
    }
    subStart = subEnd;
  }
  if (!sub) throw new Error("Failed to resolve PVR Kalachakra subperiod");
  return { nakshatra: NAKSHATRAS[nak], pada: pada + 1, chakra: savya ? "Savya" : "Apasavya",
    birthSequence: sequence, totalYears, yearDays, major, sub };
}
