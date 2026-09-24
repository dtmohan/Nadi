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
  /** Jupiter's transit that day against the natal chart, the Nadi timer. */
  bnn: {
    jupiterSign: Sign;
    saturnSign: Sign;
    /** Natal planets in the sign Jupiter transits, in trine to it, and opposite it. */
    conjunct: Planet[];
    trine: Planet[];
    opposite: Planet[];
    /** Sign Jupiter transits counted from natal Jupiter, 1..12. */
    fromJeeva: number;
    /** Natal planets in the sign Saturn transits. */
    saturnOver: Planet[];
  };
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
    /** Planets whose expected and observed nature agree, and those that conflict. */
    agree: number;
    conflict: number;
  };
}
