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
  /** Reasons a rule changed the house verdict (26.41 marks, dignity or combustion 26.31-32, aspect 26.30); pooled across merged stretches. */
  note?: string;
  /** Set when PD 26.41 made an unfavourable house good by the planet's own Ashtakavarga marks. */
  avGood?: boolean;
  /** Planets whose aspect voided the house's good or ill (PD 26.30), pooled across merged stretches. */
  aspectBy?: Planet[];
  /** Which the aspect voided: the good of a good house or the ill of a bad one. */
  aspectVoids?: "good" | "ill";
}

export interface GocharaPlanetCalendar {
  planet: Planet;
  segments: GocharaSegment[];
}

/** The houses from the Moon whose Saturn passages practice names (see saturnPracticeName in shared/gochara.ts). */
export const SATURN_NAMED_HOUSES = [12, 1, 2, 4, 7, 8, 10];

/**
 * Saturn's stay in one of the named houses from the natal Moon. The results are the texts' own, house by house
 * (Brihat Samhita 104.39-45, Phaladeepika 26.22-23); the names are regional practice and provisional.
 */
export interface SaturnPassage {
  start: string;
  end: string;
  house: number;
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
  "The Moon has no row here and is counted neither as an obstructor nor as an aspecting planet: its 2¼-day sign transits, the vedha it causes and its aspect belong to the day view above. Phaladeepika 26.3-8 does count the Moon among the obstructors, so a favourable stretch here can still be briefly obstructed or its verdict briefly changed on a given day.",
  "Verdicts use the same rules as the day view: favourable houses (Brihat Samhita 104.4, Phaladeepika 26.2), the planet's own Ashtakavarga marks (26.41), vedha (26.3-8), dignity and combustion (26.31-32, Brihat Samhita 104.53, 55), aspects (26.30) and the danger houses (26.33-34). The order of the rules and the reading of 26.30 and 26.41 are provisional; see the notes in the day view.",
  "Saturn's stays in the 12th, 1st and 2nd from the Moon (sade sati) and in the 4th, 7th, 8th and 10th are listed with the names practice gives them; neither Brihat Samhita 104 nor Phaladeepika 26 uses the names, and the houses each covers vary by region, so the labels are provisional. The results are the texts' own, house by house (BS 104.39-45, PD 26.22-23).",
  "Results are conditioned by the running dasa and the person's station (Brihat Samhita 104.46); a calendar of transits is not a calendar of events.",
];
