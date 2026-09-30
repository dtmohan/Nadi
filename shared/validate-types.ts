/** Types shared by the event validation route and its panel. */
import type { Planet, Sign } from "./astro";
import type { DashaFit } from "./jaimini-areas";
import type { EventOutcome } from "./events";
import type { TransitCheck } from "./rectify-types";
import type { WindowVerdict } from "./kp-windows";

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
    /** For each lord, its hit houses passed through the cusp filter (Part 3 ch. 5; Part 2 ch. 7). */
    filtered: [CuspFilter[], CuspFilter[], CuspFilter[]];
    /** Whether each lord keeps at least one hit house after the filter. */
    effective: [boolean, boolean, boolean];
    /** Not promised, and the matter's cusp sub lord signifies the 12th from that cusp: the book's denial. */
    deniedAtCusp: boolean;
    transit: {
      dasa: TransitCheck;
      bhukti: TransitCheck;
      score: number;
      max: number;
      /** Whether the transiting Sun and Moon stood in the sign, star or sub of a significator of the matter that day (Part 2 p. 26). */
      luminary: { sun: boolean; moon: boolean };
    };
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
  /**
   * The timing window each system itself names for the matter, open at this date; null when none was.
   * The KP window is the dasa-bhukti joint period; antaraSignifies says whether the third level also held.
   */
  windows: {
    bnn: BnnWindowHit | null;
    kp: (KpWindowHit & { antaraSignifies: boolean }) | null;
  };
}

/** A Nadi timing window: Jupiter's passage over the matter's karaka or in the matter's count from the Jeeva. */
export interface BnnWindowHit {
  sign: Sign;
  start: string;
  end: string;
  /** Best karaka contact the passage makes: over (2), trine or opposite (1); null when it qualifies by count only. */
  contact: BnnContact | null;
  karaka: Planet | null;
  /** Jupiter's count from the natal Jeeva during the passage, 1..12. */
  fromJeeva: number;
  via: "contact" | "count" | "both";
}

/**
 * A KP timing window: the conjoined period of the significators, the dasa and bhukti whose lords both
 * signify the matter's houses — the level the books' worked marriages are dated by (Part 3 pp. 25, 65).
 * The antara is a refinement, carried in fullAntaras: the sub-periods whose lord also signifies.
 */
export interface KpWindowHit {
  dasaLord: Planet;
  bhuktiLord: Planet;
  /** The dasa-bhukti span. */
  start: string;
  end: string;
  /** Antaras within whose lord also signifies the matter: the full three-level joint periods. */
  fullAntaras: { lord: Planet; start: string; end: string }[];
  /** Best Method I grade of the antara windows within. */
  verdict: WindowVerdict;
  score: number;
  max: number;
}

export interface WindowEventRef {
  id: string;
  label: string;
  date: string;
  /** How the event sat inside the window, when it needs saying (KP: the antara level). */
  note?: string;
}

export interface BnnWindowRow extends BnnWindowHit {
  matter: string;
  matterLabel: string;
  events: WindowEventRef[];
}

export interface KpWindowRow extends KpWindowHit {
  matter: string;
  matterLabel: string;
  events: WindowEventRef[];
}

/** The past windows of the recorded matters, read against the events that fell inside them. */
export interface WindowsReport {
  /** Past windows that caught at least one recorded event. */
  bnn: BnnWindowRow[];
  kp: KpWindowRow[];
  /** Events caught by each system's windows, of all events. */
  bnnCaught: number;
  /** Events inside a KP dasa-bhukti joint period of the matter's significators. */
  kpCaught: number;
  /** Of those, events whose antara lord also signified the matter: the full three-level match. */
  kpFull: number;
  /** Past windows the systems named for these matters, caught or not: the honest denominator. */
  bnnPast: number;
  kpPast: number;
  events: number;
}

/** One hit house of a period lord, seen through the sub lord of that house's cusp. */
export interface CuspFilter {
  house: number;
  cuspSubLord: Planet;
  /** Houses the cusp sub lord signifies: all the period lord can deliver for this house. */
  delivers: number[];
  /** The cusp sub lord signifies one of the matter's houses, so the hit stands. */
  kept: boolean;
  /** The cusp sub lord signifies the 12th from this house and not the house itself. */
  denied: boolean;
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
  /** What the planet can deliver through the sub lords of the cusps it signifies (Part 3 ch. 5 p. 34; Part 2 ch. 7 p. 54): the favourable and harmful houses among them. */
  goodKept: number[];
  evilKept: number[];
  expectedByCusp: Nature;
  /** Events in whose periods this planet ran, by level. */
  ran: Array<{
    eventId: string;
    label: string;
    date: string;
    level: "dasa" | "bhukti" | "antara";
    outcome: EventOutcome;
  }>;
  /** Weighted tally of outcomes: dasa and bhukti count 2, antara 1. */
  favourable: number;
  unfavourable: number;
  mixed: number;
  observed: Nature;
  /** true when expected and observed agree, false when they conflict, null when either is unknown or mixed. */
  agrees: boolean | null;
  /** The same comparison with the expectation read through the cusps. */
  agreesByCusp: boolean | null;
}

export type BaselineMeasure =
  | "confirmed"
  | "kp"
  | "transit"
  | "jaimini"
  | "bnn"
  | "bnnWindow"
  | "kpWindow"
  | "kpFullWindow"
  | "luminary";

export interface BaselineStat {
  actual: number;
  /** Mean and standard deviation of the same measure over random-date trials. */
  mean: number;
  sd: number;
  /** Share of random trials the real events beat (ties count half), 0-100. */
  percentile: number;
  /** above: beats 95% of random trials; below: worse than 95% of them; chance: indistinguishable. */
  verdict: "above" | "chance" | "below";
}

/** The same matters scored at random dates inside the span of the real events. */
export interface ChanceBaseline {
  trials: number;
  span: [string, string];
  confirmed: BaselineStat;
  kp: BaselineStat;
  transit: BaselineStat;
  jaimini: BaselineStat;
  bnn: BaselineStat;
  /** Events inside a Nadi window, against the same at random dates. */
  bnnWindow: BaselineStat;
  /** Events inside a KP window, against the same at random dates. */
  kpWindow: BaselineStat;
  /** Events inside a full three-level KP joint period, against the same at random dates. */
  kpFullWindow: BaselineStat;
  /** Days the luminaries' transit trigger held, against the same at random dates. */
  luminary: BaselineStat;
}

export interface ValidationResult {
  birthTime: string;
  lagna: { sign: Sign; degree: number };
  events: EventValidation[];
  planets: PlanetTally[];
  /** Past timing windows of the recorded matters, against the events that fell inside them. */
  windows: WindowsReport;
  /** Null when fewer than two events or a span under a year. */
  baseline: ChanceBaseline | null;
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
    /** The same counts with expectations read through the cusp sub lords. */
    agreeByCusp: number;
    conflictByCusp: number;
    /** Period-lord hits that the cusp filter diverts: the lord signifies the matter but the cusp sub lord takes it elsewhere. */
    diverted: number;
  };
}
