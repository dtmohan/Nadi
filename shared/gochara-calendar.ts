import type { Planet } from "./astro";
import type { GocharaVerdict } from "./gochara";

/** One stretch during which a planet's sign, verdict and obstructors stay the same. */
export interface GocharaSegment {
  start: string; // ISO UTC
  end: string; // ISO UTC
  signIndex: number;
  house: number;
  verdict: GocharaVerdict;
  vedhaBy: Planet[];
  dignity: string;
  combust: boolean;
  /** Set when PD 26.33 or 26.34 names this house a danger house for the planet. */
  danger?: "33" | "34";
  /** Reason(s) for a neutral verdict (dignity or combustion), from PD 26.31-32; pooled across merged stretches. */
  note?: string;
}

export interface GocharaPlanetCalendar {
  planet: Planet;
  segments: GocharaSegment[];
}

/** Saturn's passage through the 12th, 1st and 2nd from the natal Moon, read from Brihat Samhita 104.44-45 and Phaladeepika 26.23. */
export interface SaturnPassage {
  start: string;
  end: string;
  house: 12 | 1 | 2;
}

export interface GocharaCalendar {
  moonSignIndex: number;
  from: string;
  to: string;
  planets: GocharaPlanetCalendar[];
  saturnPassages: SaturnPassage[];
  notes: string[];
}

export const CALENDAR_PLANETS: Planet[] = ["Sun", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const GOCHARA_CALENDAR_NOTES: string[] = [
  "Each planet's verdict is sampled once a day and every change is then narrowed to the hour; two changes inside one day may show as one. Adjacent stretches with the same sign and verdict are shown as one, with every obstructor that took part listed.",
  "Combustion appears where it changes the verdict (a favourable house made void, 26.32) or as a flag; the aggravation of an unfavourable house by combustion is read on the day view.",
  "The Moon has no row here and is not counted as an obstructor: its 2¼-day sign transits and the vedha it causes belong to the day view above. Phaladeepika 26.3-8 does count the Moon among the obstructors, so a favourable stretch here can still be briefly obstructed on a given day.",
  "Verdicts use the same rules as the day view: favourable houses (Brihat Samhita 104.4, Phaladeepika 26.2), vedha (26.3-8), dignity and combustion (26.31-32, Brihat Samhita 104.53, 55) and the danger houses (26.33-34).",
  "Saturn's passage through the 12th, 1st and 2nd from the Moon is listed from Brihat Samhita 104.44-45 and Phaladeepika 26.23; the popular name for it (sade sati) does not occur in either text, so the label is provisional.",
  "Results are conditioned by the running dasa and the person's station (Brihat Samhita 104.46); a calendar of transits is not a calendar of events.",
];
