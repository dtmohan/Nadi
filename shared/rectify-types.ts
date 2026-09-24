/** Types shared by the KP birth time rectification route and its panel. */
import type { Planet } from "./astro";
import type { RulingPlanets } from "./kp";
import type { DashaFit, JaiminiArea } from "./jaimini-areas";

export interface RectifyEvent {
  label: string;
  /** YYYY-MM-DD in the birth zone. */
  date: string;
  houses: number[];
  /** Cusp whose sub lord must promise the matter (optional). */
  cusp?: number;
  /** Life area the matter belongs to in the Jaimini reading (optional; matters without one are skipped by the chara dasha method). */
  area?: JaiminiArea;
}

import type { InsertChart } from "./schema";

/** Where the astrologer is judging from; the birth place when absent. */
export interface JudgePlaceInput {
  latitude: number;
  longitude: number;
  timezone: string;
  label?: string;
}

export interface RectifyRequest {
  chart: InsertChart;
  windowMinutes: number;
  events: RectifyEvent[];
  judge?: JudgePlaceInput;
}

export interface RectifyEventCheck {
  label: string;
  date: string;
  houses: number[];
  dasa: Planet;
  bhukti: Planet;
  antara: Planet;
  /** Whether each of dasa, bhukti, antara signifies one of the houses (four-step). */
  hits: [boolean, boolean, boolean];
  /** Houses each lord signifies among the matter's houses. */
  signified: [number[], number[], number[]];
  /** Sub lord of the matter's cusp, and whether it signifies the matter. */
  cuspSubLord?: Planet;
  promised?: boolean;
  score: number;
  max: number;
  /**
   * Transit check (Part 2 p. 203): where the dasa and bhukti lords were transiting on the day of
   * the event, and whether the lords of that sign, star and sub signify the matter in this candidate.
   */
  transit: { dasa: TransitCheck; bhukti: TransitCheck; score: number; max: number };
  /**
   * Jaimini check (K.N. Rao): the chara dasha and antardasha running at the event, for the lagna sign of this
   * interval, carry the matter's area. Null when the matter has no Jaimini area or the event precedes the birth.
   */
  jaimini: DashaFit | null;
}

export interface TransitCheck {
  planet: Planet;
  lon: number;
  signLord: Planet;
  starLord: Planet;
  subLord: Planet;
  /** sign lord, star lord, sub lord each signify one of the matter's houses. */
  hits: [boolean, boolean, boolean];
}

export interface MoonLordsCheck {
  /** Birth star and Moon sign in this interval. */
  birthStar: string;
  birthStarLord: Planet;
  moonSign: string;
  moonSignLord: Planet;
  /** The lagna sub lord and its own chain of lords at the birth time. */
  subLord: Planet;
  chain: { starLord: Planet; subLord: Planet; subSubLord: Planet; sookshmaLord: Planet };
  /**
   * How the lagna sub lord reaches the birth star lord: 4 = it is the birth star lord; 3 = its star lord is;
   * 2 = its sub, sub-sub or sookshma lord is; 1 = the chain of its own sub lord reaches it (second step); 0 = no link.
   */
  star: { level: 0 | 1 | 2 | 3 | 4; via: string };
  /** Moon sign link: the sub lord owns the Moon sign, or stands in it. */
  sign: { owns: boolean; occupies: boolean };
  score: number;
  max: number;
}

export interface RectifySegment {
  /** Local civil times in the birth zone, HH:mm:ss. */
  start: string;
  end: string;
  mid: string;
  startIso: string;
  endIso: string;
  /** Lagna at the two ends of the interval. */
  lagnaFrom: number;
  lagnaTo: number;
  sign: string;
  signLord: Planet;
  starLord: Planet;
  subLord: Planet;
  /** Which of the three lagna lords are ruling planets (or represented by one). */
  rp: { sign: boolean; star: boolean; sub: boolean; score: number; max: number; via: Partial<Record<"sign" | "star" | "sub", string>> };
  /** Sub lords of the twelve cusps at the middle of the interval. */
  cuspSubLords: Planet[];
  /** Moon's star and sub lord at the middle of the interval. */
  moon: { starLord: Planet; subLord: Planet };
  /**
   * Moon lords check (M.P. Shanmugham, Astro Secrets & KP Part 2 pp. 80-82): the lagna sub lord must tell the
   * birth star, directly or through the chain of its own star, sub, sub-sub and sookshma lords, or failing that
   * the Moon sign. Telling the very birth star is the stronger confirmation.
   */
  moonLords: MoonLordsCheck;
  /** Sun-transit hint (Part 2 p. 192): the lagna's sub (or star) lord is the sub lord the Sun transits on the day of judgement. */
  sunHint: { star: boolean; sub: boolean; score: number; max: number };
  /** Lagna sign in the chart's own ayanamsa, which the Jaimini check is read from (sign-level only). */
  jaiminiSign: { index: number; name: string; direction: "forward" | "backward" };
  events: RectifyEventCheck[];
  score: number;
  max: number;
  /** True when the recorded birth time falls in this interval. */
  given: boolean;
}

export interface RectifyResult {
  ruling: RulingPlanets;
  /** The place the ruling planets were taken for. */
  judgedAt: { label: string; timezone: string };
  /** The Sun's transit at the moment of judgement. */
  sunNow: { lon: number; signLord: Planet; starLord: Planet; subLord: Planet };
  /** Every planet accepted as a ruling planet or an agent of one, with the reason. */
  accepted: Array<{ planet: Planet; reason: string; weight: number }>;
  windowMinutes: number;
  given: { time: string; lagna: number };
  segments: RectifySegment[];
  best: number[];
}

