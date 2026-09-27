import type { SunriseDefinition } from "./schema";
/**
 * Panchanga — the five limbs of the Hindu day: vara (weekday), tithi (lunar day), nakshatra (the Moon's asterism),
 * nitya yoga (Sun + Moon) and karana (half-tithi). The definitions follow the Surya Siddhanta as translated by
 * Burgess (1860): tithi from the Moon's longitude less the Sun's in portions of 12° (2.66), nakshatra from the Moon in
 * portions of 13°20' (2.64), yoga from the sum of the two longitudes in the same portion (2.65), karana as a half-tithi
 * with four fixed and seven movable names (2.67-69), and the civil day running from one sunrise to the next (1.36).
 * The arithmetic here is pure; the server finds the exact ending times with the ephemeris.
 */
import { NAKSHATRAS, NAKSHATRA_LORD, norm360, type Planet } from "./astro";

export const SURYA_SIDDHANTA_URL = "https://archive.org/stream/SuryaSiddhantaTranslation/surya_siddhanta_english_djvu.txt";

export interface PanchangaSource {
  label: string;
  url: string;
  provisional?: boolean;
}

export const SS = (verse: string, provisional?: boolean): PanchangaSource => ({
  label: `Surya Siddhanta ${verse}`,
  url: SURYA_SIDDHANTA_URL,
  ...(provisional ? { provisional: true } : {}),
});

export const TITHI_NAMES = [
  "Pratipada",
  "Dvitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dvadashi",
  "Trayodashi",
  "Chaturdashi",
] as const;

export const YOGA_NAMES = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarman",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyan",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
] as const;

export const MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"] as const;

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const WEEKDAY_LORD: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export type Paksha = "Shukla" | "Krishna";

export interface TithiInfo {
  /** 1..30 counted from Shukla Pratipada; 15 is Purnima and 30 Amavasya. */
  index: number;
  paksha: Paksha;
  name: string;
  /** Fraction of the tithi elapsed, 0..1. */
  elapsed: number;
}

export interface NakshatraInfo {
  index: number; // 0..26
  name: string;
  pada: number; // 1..4
  lord: Planet;
  elapsed: number;
}

export interface YogaInfo {
  index: number; // 0..26
  name: string;
  elapsed: number;
}

export interface KaranaInfo {
  /** 0..59 half-tithi slot from Shukla Pratipada. */
  slot: number;
  name: string;
  fixed: boolean;
  elapsed: number;
}

const TITHI_ARC = 12;
const NAK_ARC = 360 / 27;

/** Moon less Sun, 0..360. */
export const elongation = (moonLon: number, sunLon: number) => norm360(moonLon - sunLon);

export function tithiOf(moonLon: number, sunLon: number): TithiInfo {
  const e = elongation(moonLon, sunLon);
  const i = Math.min(29, Math.floor(e / TITHI_ARC));
  const paksha: Paksha = i < 15 ? "Shukla" : "Krishna";
  const within = i % 15;
  const name = within === 14 ? (paksha === "Shukla" ? "Purnima" : "Amavasya") : TITHI_NAMES[within];
  return { index: i + 1, paksha, name, elapsed: (e - i * TITHI_ARC) / TITHI_ARC };
}

export function nakshatraOf(moonLon: number): NakshatraInfo {
  const l = norm360(moonLon);
  const i = Math.min(26, Math.floor(l / NAK_ARC));
  const within = l - i * NAK_ARC;
  return { index: i, name: NAKSHATRAS[i], pada: Math.min(4, Math.floor(within / (NAK_ARC / 4)) + 1), lord: NAKSHATRA_LORD[i], elapsed: within / NAK_ARC };
}

export function yogaOf(moonLon: number, sunLon: number): YogaInfo {
  const s = norm360(moonLon + sunLon);
  const i = Math.min(26, Math.floor(s / NAK_ARC));
  return { index: i, name: YOGA_NAMES[i], elapsed: (s - i * NAK_ARC) / NAK_ARC };
}

/**
 * Karana: half a tithi (2.69). Kimstughna takes the first half of Shukla Pratipada; Shakuni the second half of Krishna
 * Chaturdashi, Chatushpada and Naga the two halves of Amavasya (2.67 with Burgess's note); the seven movable names
 * cycle eight times through the fifty-six halves between (2.68).
 */
export function karanaOf(moonLon: number, sunLon: number): KaranaInfo {
  const e = elongation(moonLon, sunLon);
  const slot = Math.min(59, Math.floor(e / (TITHI_ARC / 2)));
  const elapsed = (e - slot * (TITHI_ARC / 2)) / (TITHI_ARC / 2);
  if (slot === 0) return { slot, name: "Kimstughna", fixed: true, elapsed };
  if (slot === 57) return { slot, name: "Shakuni", fixed: true, elapsed };
  if (slot === 58) return { slot, name: "Chatushpada", fixed: true, elapsed };
  if (slot === 59) return { slot, name: "Naga", fixed: true, elapsed };
  return { slot, name: MOVABLE_KARANAS[(slot - 1) % 7], fixed: false, elapsed };
}

/** Index (0..59) of the karana slot for a given elongation, used by the server to find slot changes. */
export const karanaSlot = (moonLon: number, sunLon: number) => Math.min(59, Math.floor(elongation(moonLon, sunLon) / (TITHI_ARC / 2)));
export const tithiIndex = (moonLon: number, sunLon: number) => Math.min(29, Math.floor(elongation(moonLon, sunLon) / TITHI_ARC));
export const nakshatraIndex = (moonLon: number) => Math.min(26, Math.floor(norm360(moonLon) / NAK_ARC));
export const yogaIndex = (moonLon: number, sunLon: number) => Math.min(26, Math.floor(norm360(moonLon + sunLon) / NAK_ARC));

/** Moon phase from the elongation: waxing until 180°, then waning. */
export function moonPhase(moonLon: number, sunLon: number): { waxing: boolean; illumination: number } {
  const e = elongation(moonLon, sunLon);
  return { waxing: e < 180, illumination: (1 - Math.cos((e * Math.PI) / 180)) / 2 };
}

/** One limb's run of the day: the element in force at sunrise first, then each successor until the next sunrise. */
export interface LimbSegment {
  name: string;
  detail?: string;
  /** ISO instant when this element ends; undefined when it outlasts the day. */
  end?: string;
  /** True for the element in force at the requested instant (sunrise, or the birth time). */
  current: boolean;
}

export interface PanchangaDay {
  date: string;
  timezone: string;
  latitude: number;
  longitude: number;
  /** Which instant counts as sunrise (see SUNRISE_DEFINITIONS in schema.ts); older results may lack it, meaning "edge". */
  sunriseDef?: SunriseDefinition;
  /** ISO instants of the sunrise that opens the day, the sunset, and the next sunrise. */
  sunrise: string;
  sunset: string;
  nextSunrise: string;
  /** The instant the limbs are read at: sunrise, or the birth instant for a birth panchanga. */
  at: string;
  weekday: number;
  vara: { name: string; lord: Planet };
  tithi: TithiInfo;
  nakshatra: NakshatraInfo;
  yoga: YogaInfo;
  karana: KaranaInfo;
  phase: { waxing: boolean; illumination: number };
  /** Sidereal Sun and Moon at `at`. */
  sunLon: number;
  moonLon: number;
  /** Day-long runs for each limb from sunrise to the next sunrise. */
  runs: { tithi: LimbSegment[]; nakshatra: LimbSegment[]; yoga: LimbSegment[]; karana: LimbSegment[] };
  /** Ayanamsa name and value used. */
  ayanamsa: { key: string; value: number };
}

export const PANCHANGA_SOURCES = {
  day: SS("1.36"),
  nakshatra: SS("2.64"),
  yoga: SS("2.65"),
  tithi: SS("2.66"),
  karana: SS("2.67-69"),
  /** The weekday lords in Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn order are universal usage; the Surya Siddhanta derives them in ch. 12 but the verse has not been checked here. */
  varaLords: SS("ch. 12, verse unverified", true),
  /** Nakshatra lords are the Vimshottari lords of BPHS 46.12-14. */
  nakshatraLord: { label: "BPHS 46.12-14", url: "http://jyotishvidya.com/ch46.htm" } as PanchangaSource,
};

export const PANCHANGA_CAVEATS: string[] = [
  "Surya Siddhanta references are to the Burgess translation (1860). Tithi, nakshatra, yoga and karana are read from sidereal longitudes with the chart's ayanamsa; ending times come from the ephemeris and are given in the chart's time zone.",
  "The day runs from sunrise to sunrise (Surya Siddhanta 1.36); the weekday shown is the one in force at that sunrise, so a birth before sunrise carries the previous civil weekday.",
  "Sunrise here is the upper limb with refraction, as computed by the Swiss Ephemeris; Indian almanacs differ on limb and refraction, which can move a boundary by a few minutes.",
  "Tithi and nakshatra lords, deities, and muhurta qualities (Rahu kala, hora, auspicious tithis) are not shown because no classical source has been checked for them here.",
];
