/** Types shared by the event validation route and its panel. */
import type { Planet, Sign } from "./astro";
import type { DashaFit } from "./jaimini-areas";
import type { EventOutcome } from "./events";
import type { TransitCheck } from "./rectify-types";

export type KpVerdict = "confirmed" | "partial" | "missed";

export interface EventValidation {
  id: string;
  matter: string;
  label: string;
  date: string;
  /** Age at the event, in years to one decimal. */
  age: number;
  /** The recorded outcome, else the matter's own nature. */
  outcome: EventOutcome;
  houses: number[];
  cusp: number;
  kp: {
    dasa: Planet;
    bhukti: Planet;
    antara: Planet;
    /** Whether dasa, bhukti and antara lord each signify one of the matter's houses (four-step). */
    hits: [boolean, boolean, boolean];
    /** The matter's houses each lord signifies. */
    signified: [number[], number[], number[]];
    cuspSubLord: Planet;
    /** The cusp sub lord signifies one of the matter's houses: the matter is promised. */
    promised: boolean;
    /** Houses the cusp sub lord signifies, for the tooltip. */
    cuspSignified: number[];
    transit: { dasa: TransitCheck; bhukti: TransitCheck; score: number; max: number };
    /** Period-lord hits plus the promise: 0..4. */
    score: number;
    max: 4;
    /** confirmed: promised and both dasa and bhukti lords signify; partial: something links; missed: nothing does. */
    verdict: KpVerdict;
  };
  /** Chara dasha running at the event and whether it carries the matter's area (K.N. Rao); null when the matter has no area. */
  jaimini: (DashaFit & { mdSignName: Sign; adSignName: Sign }) | null;
  /** Jupiter's and Saturn's transits that day against the natal chart, the Nadi timers, scored for the matter. */
  bnn: BnnFit;
}

export type BnnContact = "over" | "trine" | "opposite";
export type BnnVerdict = "strong" | "some" | "quiet";

export interface BnnFit {
  jupiterSign: Sign;
  saturnSign: Sign;
  /** Natal planets in the sign Jupiter transits, in trine to it, and opposite it. */
  conjunct: Planet[];
  trine: Planet[];
  opposite: Planet[];
  /** Sign Jupiter transits counted from natal Jupiter, 1..12. */
  fromJeeva: number;
  /** Female chart only: the same count from the natal Deha (Venus). */
  fromDeha: number | null;
  /** Natal planets in the sign Saturn transits. */
  saturnOver: Planet[];
  /** The matter's Nadi karakas, resolved for this chart's gender. */
  karakas: Planet[];
  /** Best contact Jupiter makes with a karaka that day: over it (2), in trine (1) or opposite (1). */
  jupiter: { contact: BnnContact; planet: Planet } | null;
  /** Best contact Saturn makes with a karaka that day (1). */
  saturn: { contact: BnnContact; planet: Planet } | null;
  /** Both timers touch the same karaka at once (1). */
  double: boolean;
  /** Jupiter's count from the Jeeva (or the Deha) falls in the matter's signs (1). */
  progression: boolean;
  /** A natal combination of the matter's own area that Jupiter's passage brings to life (1), by rule text. */
  combination: string | null;
  score: number;
  max: 6;
  /** strong: 4 or more of 6; some: 2 or 3; quiet: 0 or 1. */
  verdict: BnnVerdict;
}

export type Nature = "benefic" | "malefic" | "mixed" | "unknown";

export interface PlanetTally {
  planet: Planet;
  /** Houses the planet signifies (four-step), for the KP expectation. */
  signifies: number[];
  /** Of those, the favourable (2, 3, 10, 11) and the harmful (6, 8, 12). */
  good: number[];
  evil: number[];
  expected: Nature;
  /** Events in whose periods this planet ran, by level. */
  ran: Array<{ eventId: string; label: string; date: string; level: "dasa" | "bhukti" | "antara"; outcome: EventOutcome }>;
  /** Weighted tally of outcomes: dasa and bhukti count 2, antara 1. */
  favourable: number;
  unfavourable: number;
  mixed: number;
  observed: Nature;
  /** true when expected and observed agree, false when they conflict, null when either is unknown or mixed. */
  agrees: boolean | null;
}

export interface ValidationResult {
  birthTime: string;
  lagna: { sign: Sign; degree: number };
  events: EventValidation[];
  planets: PlanetTally[];
  summary: {
    events: number;
    confirmed: number;
    partial: number;
    missed: number;
    kpScore: number;
    kpMax: number;
    transitScore: number;
    transitMax: number;
    jaiminiScore: number;
    jaiminiMax: number;
    /** Events with a Jaimini area. */
    jaiminiEvents: number;
    bnnScore: number;
    bnnMax: number;
    bnnStrong: number;
    /** Planets whose expected and observed nature agree, and those that conflict. */
    agree: number;
    conflict: number;
  };
}
