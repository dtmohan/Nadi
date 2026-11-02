/** Types shared by the KP birth time rectification route and its panel. */
import type { Planet, PlanetPosition } from "./astro";
import type { RulingPlanets } from "./kp";
import type { DashaFit, JaiminiArea } from "./jaimini-areas";
import type { BodyMarksResult } from "./body-marks";
import type { ParashariVargaEvidence } from "./parashari-varga-evidence";
import type { ParashariPromiseCheck } from "./parashari-promise";
import type { ParashariSpecificCheck } from "./parashari-specific";
import type { ParashariDivisionalCheck } from "./parashari-divisional";
import type { NemaniRpMoonCheck } from "./kp-nemani-rp";
import type { ManleyDivision, ManleyEvidence } from "./manley-evidence";
import type { HierarchyEvent } from "./parashari-hierarchy";
import type { ParashariComparison, ParashariComparisonExample } from "./parashari-comparison";
import type { AuroraAscendantLinks, AuroraEventEvidence } from "./kp-aurora";
import type { AuroraV2Evidence, AuroraV2StageComparison } from "./kp-aurora-v2";
import type { ParashariDatedCatalogue } from "./parashari-event-natal-rules";
import type { AdditionalSchoolNatalEvidence } from "./additional-school-event-rules";
import type { AlpEventEvidence } from "./alp-event-evidence";
import type { QualifiedEventScores, QualifiedScoreKey } from "./qualified-event-scores";

export interface RectifyEvent {
  label: string;
  /** Native event category, used only to select relevant Parashari divisional evidence. */
  matter?: string;
  outcome?: "favourable" | "unfavourable" | "mixed";
  /** YYYY-MM-DD in the event's zone, falling back to the birth zone. */
  date: string;
  time?: string;
  timezone?: string;
  houses: number[];
  /** Cusp whose sub lord must promise the matter (optional). */
  cusp?: number;
  /** Life area the matter belongs to in the Jaimini reading (optional; matters without one are skipped by the chara dasha method). */
  area?: JaiminiArea;
}

import type { InsertChart } from "./schema";
import type { KpEventRules } from "./kp-event-evidence";

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
  /** Preserve a scan's actual judgment instant when rebuilding its report. */
  judgedAsOf?: string;
}

export interface RectifyEventCheck extends KpEventRules {
  additionalNatal?: AdditionalSchoolNatalEvidence;
  alp?: AlpEventEvidence;
  qualifiedScores?: QualifiedEventScores;
  label: string;
  date: string;
  time?: string;
  timezone?: string;
  houses: number[];
  dasa: Planet;
  bhukti: Planet;
  antara: Planet;
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
  chain: {
    starLord: Planet;
    subLord: Planet;
    subSubLord: Planet;
    sookshmaLord: Planet;
  };
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

/**
 * Cusp sub-lord stability sampled at the start, midpoint and end. The scan also cuts at
 * relevant event-cusp changes, but other cusps can change within a segment.
 */
export interface RectifySegmentStability {
  /** Cusps (1-12) whose sub lord is the same at the start, middle and end of the interval. */
  firm: number;
  /** Houses whose sub lord changes inside the interval. */
  changing: number[];
  /** Length of the interval in seconds. */
  seconds: number;
  /** Cusps the dated events name (RectifyEvent.cusp); empty when none do. */
  matterCusps: number[];
  /** True when every matter cusp is firm; undefined when no event names a cusp. */
  matterFirm?: boolean;
}

/**
 * Nadi's Dutta-inspired mixed-chart RP-Moon linkage ("Birth Time Rectification through KP Astrology", first
 * testing): the lagna's sign, star and sub lords at the candidate time must each link to the sign,
 * star and sub lords of the Moon ruling at the moment of judgement. Linkage is any of: the same
 * planet; one in the sub of the other; one in the star of the other; one in the other's sign; or
 * X in the star or sub of a third planet that rules Z at its star or sub level. All three levels
 * linking is not proof of a birth time. Nadi compares the natal position of X with the judgment
 * position of Z; Nemani's separate check uses judgment positions for both. Weighting is an app convention.
 */
export interface DuttaRpMoonCheck {
  /** The RP Moon's sign, star and sub lords at the moment of judgement (fixed for the whole scan). */
  moon: { signLord: Planet; starLord: Planet; subLord: Planet };
  linked: { sign: boolean; star: boolean; sub: boolean };
  via: { sign: string; star: string; sub: string };
  score: number;
  max: number;
}

/**
 * The Kunda check (Prasna Marga 5.8-9): the lagna in arc-minutes, times 81, with multiples of 12
 * expunged, read as a nakshatra counted from Aswini. When that nakshatra is the birth star or its
 * trines, the lagna reads accurate. Raman's translation divides by 12, which reaches only the first
 * twelve nakshatras (provisional).
 */
export interface KundaCheck {
  /** Remainder from the named arithmetic; D81 uses a longitude in degrees. */
  remainder: number;
  kundaNakshatra: number;
  birthStar: number;
  trine: boolean;
  via: string;
  score: number;
  max: number;
}

/** A separately scanned D81 Kunda interval, in the birth time's display zone. */
export interface KundaD81Window {
  start: string;
  end: string;
  mid: string;
  midDate: string;
  startIso: string;
  endIso: string;
  check: KundaCheck;
  given: boolean;
  /** The rounded whole-second midpoint is still inside the calculated interval. */
  selectable: boolean;
}

/** Brihat Jataka 26.9-10 Lost Horoscope nakshatra check against the birth star. */
export interface BjNashtaCheck {
  nakshatra: number;
  birthStar: number;
  trine: boolean;
  via: string;
  score: number;
  max: number;
}

export interface RectifySegment {
  /** Descriptive source example; no genetic or birth-time conclusion. */
  auroraAscendant?: AuroraAscendantLinks;
  /** Local civil times in the birth zone, HH:mm:ss. */
  start: string;
  end: string;
  mid: string;
  /** Civil date of the midpoint in the chart's display basis. */
  midDate?: string;
  startIso: string;
  endIso: string;
  /** The rounded midpoint is inside this interval; older results may omit it. */
  selectable?: boolean;
  /** Lagna at the two ends of the interval. */
  lagnaFrom: number;
  lagnaTo: number;
  sign: string;
  signLord: Planet;
  starLord: Planet;
  subLord: Planet;
  /** Which of the three lagna lords are ruling planets (or represented by one). */
  rp: {
    sign: boolean;
    star: boolean;
    sub: boolean;
    score: number;
    max: number;
    via: Partial<Record<"sign" | "star" | "sub", string>>;
  };
  /** Sub lords of the twelve cusps at the middle of the interval. */
  cuspSubLords: Planet[];
  /** Cusp sub-lord firmness across the interval; absent on results computed before it was added. */
  stability?: RectifySegmentStability;
  /** Moon's star and sub lord at the middle of the interval. */
  moon: { starLord: Planet; subLord: Planet };
  /**
   * Moon lords check (M.P. Shanmugham, Astro Secrets & KP Part 2 pp. 80-82): the lagna sub lord must tell the
   * birth star, directly or through the chain of its own star, sub, sub-sub and sookshma lords, or failing that
   * the Moon sign. Telling the very birth star is the stronger confirmation.
   */
  moonLords: MoonLordsCheck;
  /**
 * Nadi's Dutta-inspired mixed-chart linkage: the lagna's
   * sign, star and sub lords link, level to level, to the Moon ruling at the moment of judgement. Absent on
   * results computed before it was added.
   */
  dutta?: DuttaRpMoonCheck;
  /** Nemani's separate three-level test, using judgment-chart positions on both sides. */
  nemani?: NemaniRpMoonCheck;
  /** Sun-transit hint (Part 2 p. 192): the lagna's sub (or star) lord is the sub lord the Sun transits on the day of judgement. */
  sunHint: { star: boolean; sub: boolean; score: number; max: number };
  /** Lagna sign in the chart's own ayanamsa, which the Jaimini check is read from (sign-level only). */
  jaiminiSign: {
    index: number;
    name: string;
    direction: "forward" | "backward";
  };
  /** Inputs for drawing the period timeline at this candidate, not at the recorded time. */
  candidate?: {
    birthUtc: string;
    kpMoonLon: number;
    positions: PlanetPosition[];
    kpPlanets: Array<Pick<PlanetPosition, "planet" | "lon">>;
    kpCusps: number[];
  };
  /** Rising drekkana of the interval in the chart's own ayanamsa, 0-35 (sign x 3 + third); key into RectifyResult.marks. */
  drekkana: number;
  /** Body-mark calculation at this midpoint; can differ within one drekkana. */
  marksKey?: number;
  /** Prasna Marga 5.8-9 Kunda check of the lagna against the birth star. */
  kunda?: KundaCheck;
  /** D81 variant at this interval's midpoint; exact D81 intervals are returned separately. */
  kundaD81?: KundaCheck;
  /** Brihat Jataka 26.9-10 Lost Horoscope nakshatra check. */
  bjNashta?: BjNashtaCheck;
  events: RectifyEventCheck[];
  /** Separate, descriptive Parashari evidence; never included in the KP or Jaimini score. */
  parashariVargas?: ParashariVargaEvidence[];
  /** Ordinary natal catalogue and dated period-lord participants, by event. */
  parashariOrdinary?: Array<ParashariDatedCatalogue | undefined>;
  /** Source-informed exploratory matches, independent of KP/Jaimini. */
  parashariPromise?: ParashariPromiseCheck[];
  /** Event-specific version 2; kept separate so version 1 remains reviewable. */
  parashariSpecific?: ParashariSpecificCheck[];
  /** Experimental v3: v2 plus two divisional period-lord factors. */
  parashariDivisional?: ParashariDivisionalCheck[];
  /** Descriptive Manley event clues, separate from every ranking. */
  manley?: ManleyEvidence[];
  /** Aligned with selected events; null means this event was not assessed. */
  parashariHierarchy?: Array<HierarchyEvent | null>;
  score: number;
  max: number;
  /** True when the recorded birth time falls in this interval. */
  given: boolean;
  /**
   * Event scores at random dates drawn from the span the real events cover. These describe
   * the selected comparison distribution; they do not establish a probability of correctness.
   */
  baseline?: RectifySegmentBaseline;
}

export interface RectifyBaselineStat {
  actual: number;
  mean: number;
  sd: number;
  /** Mid-rank percentile of the real score among the random trials, 0-100. */
  percentile: number;
  verdict: "above" | "chance" | "below";
}

export interface RectifySegmentBaseline {
  /** First comparison set carries the same candidate-specific natal rule evidence. */
  catalogueExample?: Array<{ label: string; date: string; natalRules?: KpEventRules["natalRules"]; parashariOrdinary?: ParashariDatedCatalogue; additionalNatal?: AdditionalSchoolNatalEvidence; alp?: AlpEventEvidence; qualifiedScores?: QualifiedEventScores }>;
  qualified?: Partial<Record<QualifiedScoreKey, RectifyBaselineStat>>;
  /** Date-dependent ordinary rule frequencies, descriptive and separate from ranking. */
  catalogueComparison?: import("./catalogue-comparison").EventCatalogueComparison[];
  kpEvents: RectifyBaselineStat;
  transit: RectifyBaselineStat;
  jaimini: RectifyBaselineStat;
  aurora?: RectifyBaselineStat;
  auroraV2?: RectifyBaselineStat;
  /** Cumulative v2 stages, real and independently drawn comparison dates. */
  auroraV2Stages?: AuroraV2StageComparison<RectifyBaselineStat>;
  auroraExample?: Array<{ label: string; date: string; time?: string; timezone?: string; evidence?: AuroraEventEvidence }>;
  auroraV2Example?: Array<{ label: string; date: string; time?: string; timezone?: string; evidence?: AuroraV2Evidence }>;
  /** Descriptive comparisons; these do not alter candidate ranking. */
  parashari?: ParashariComparison;
  parashariExample?: ParashariComparisonExample[];
}

export interface RectifyResult {
  /** Snapshot of the inputs the hierarchy examined, in event order. */
  hierarchySelections?: RectifyEvent[];
  ruling: RulingPlanets;
  /** The place the ruling planets were taken for. */
  judgedAt: { label: string; timezone: string };
  /** The Sun's transit at the moment of judgement. */
  sunNow: { lon: number; signLord: Planet; starLord: Planet; subLord: Planet };
  /** Every planet accepted as a ruling planet or an agent of one, with the reason. */
  accepted: Array<{ planet: Planet; reason: string; weight: number }>;
  windowMinutes: number;
  /**
   * Marks on the body (Brihat Jataka 5.22-26), keyed by RectifySegment.marksKey.
   * Older results used the drekkana as the key.
   */
  marks: Record<number, BodyMarksResult>;
  given: { time: string; lagna: number };
  segments: RectifySegment[];
  /** D81 is scanned independently: its boundaries need not match KP intervals. */
  kundaD81?: KundaD81Window[];
  /** Independently sampled ascendant windows for the book's divisions. */
  vargaWindows?: Array<{
    division: "D1" | ManleyDivision | "D60";
    windows: Array<{ start: string; end: string; startIso: string; endIso: string; sign: number; given: boolean }>;
  }>;
  /** Real event-day skies at the supplied or assumed time, shared by candidates. */
  eventTransits?: Array<{
    date: string;
    positions: Array<Pick<PlanetPosition, "planet" | "lon">>;
    /** The same event in the first random-date set, when a comparison was run. */
    example?: { date: string; time?: string; timezone?: string; positions: Array<Pick<PlanetPosition, "planet" | "lon">> };
  }>;
  best: number[];
  /** Random-date comparison; null when there are too few events or too short a span. */
  baseline: { trials: number; span: [string, string] } | null;
}
