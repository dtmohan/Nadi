/** Types shared by the KP birth time rectification route and its panel. */
import type { Planet } from "./astro";
import type { RulingPlanets } from "./kp";

export interface RectifyEvent {
  label: string;
  /** YYYY-MM-DD in the birth zone. */
  date: string;
  houses: number[];
  /** Cusp whose sub lord must promise the matter (optional). */
  cusp?: number;
}

import type { InsertChart } from "./schema";

export interface RectifyRequest {
  chart: InsertChart;
  windowMinutes: number;
  events: RectifyEvent[];
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
  events: RectifyEventCheck[];
  score: number;
  max: number;
  /** True when the recorded birth time falls in this interval. */
  given: boolean;
}

export interface RectifyResult {
  ruling: RulingPlanets;
  /** Every planet accepted as a ruling planet or an agent of one, with the reason. */
  accepted: Array<{ planet: Planet; reason: string; weight: number }>;
  windowMinutes: number;
  given: { time: string; lagna: number };
  segments: RectifySegment[];
  best: number[];
}

