import type { PanchangaDay } from "./panchanga";
import type { SensitiveGate } from "./life-stage";
import { z } from "zod";
import type { PlanetPosition, TransitPeriod, NakshatraPeriod, SignPeriod, PlanetSignPeriod } from "./astro";
import type { FatherArishtaWindow } from "./father-arishta";
import type { Reading } from "./rules";
import type { JaiminiResult } from "./jaimini";
import type { KpBase } from "./kp";
import type { ShadbalaBase, DasaStartTransit } from "./shadbala";
import { chartEventsSchema, type ChartEvent } from "./events";
import type { TimeBasis } from "./time-basis";

// The chart is the request/response shape for every endpoint. The server is stateless: charts are
// saved in the visitor's browser, so this schema exists only to validate and type the birth data,
// not to address a database. It is written as plain Zod rather than derived from an ORM table.
export const insertChartSchema = z.object({
  /** Human label shown on the home page and reports. */
  name: z.string(),
  gender: z.string().optional(),
  birthDate: z.string(), // YYYY-MM-DD (local civil date)
  birthTime: z.string(), // HH:MM (local civil time, 24h)
  timezone: z.string(), // IANA tz id
  /** How the civil time is turned into an instant: "auto" | "zone" | "lmt" | a fixed offset such as "+05:30". */
  timeStandard: z.string().optional(),
  place: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  ayanamsa: z.string().optional(),
  nodeType: z.string().optional(),
  /** Which instant counts as sunrise: "edge" (upper limb, refracted), "centre" (disc centre, refracted), "edge-true" (upper limb, no refraction), "centre-true" (disc centre, no refraction). */
  sunriseDef: z.string().optional(),
  /** House placement for the Parashari house, node, house-effects and house-lord readings: "rashi" (whole sign, the default) | "sripati" | "equal" (bhava chalit). */
  parashariHouseMethod: z.string().optional(),
  notes: z.string().optional(),
  /** Optional date of passing (YYYY-MM-DD). Fixes the age the readings use and lets the lifespan methods be tested on the deceased; never used to compute or display a forecast. */
  deathDate: z.string().nullable().optional(),
  /** How sure the birth time is, as ± minutes (0 = as stated). The Nadi reading marks lines whose direction or bond changes inside the band; nothing else uses it. */
  timeUncertaintyMin: z.number().int().optional(),
  /** Remembered life events (matter, date, outcome, note), kept beside the birth data. */
  events: chartEventsSchema.optional(),
});

export type InsertChart = z.infer<typeof insertChartSchema>;

/** A saved chart: every field present (defaults filled in), plus its local id. */
export interface Chart {
  id: number;
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  timezone: string;
  timeStandard: string;
  place: string;
  latitude: number;
  longitude: number;
  ayanamsa: string;
  nodeType: string;
  sunriseDef: string;
  parashariHouseMethod: string;
  notes: string;
  deathDate: string | null;
  timeUncertaintyMin: number;
  events: ChartEvent[];
}

/** Birth-time band choices, ± minutes. */
export const TIME_UNCERTAINTY_OPTIONS = [0, 2, 5, 10, 15, 30, 60] as const;

export const AYANAMSAS = [
  { id: "lahiri", label: "Lahiri (Chitrapaksha)" },
  { id: "raman", label: "B.V. Raman" },
  { id: "kp", label: "Krishnamurti (KP)" },
  { id: "yukteshwar", label: "Sri Yukteshwar" },
] as const;

export const SUNRISE_DEFINITIONS = [
  {
    id: "edge",
    label: "Upper limb, with refraction",
    short: "edge",
    note: "The first edge of the disc appears over the horizon; the civil and newspaper convention, Drik Panchang's default and the Swiss Ephemeris default.",
  },
  {
    id: "centre",
    label: "Disc centre, with refraction",
    short: "centre",
    note: "The middle of the disc appears over the horizon (Drik Panchang's \"middle limb\"); about a minute after the edge.",
  },
  {
    id: "edge-true",
    label: "Upper limb, no refraction",
    short: "true edge",
    note: "The edge of the disc is geometrically on the horizon, ignoring the atmosphere; Jagannatha Hora's \"true rise of tip\", about two minutes after the edge.",
  },
  {
    id: "centre-true",
    label: "Disc centre, no refraction",
    short: "true centre",
    note: "The centre of the disc is geometrically on the horizon: the classical madhya-limb sunrise of the Surya Siddhanta computation and Jagannatha Hora's \"true rise of centre\", three to four minutes after the edge.",
  },
] as const;
export type SunriseDefinition = (typeof SUNRISE_DEFINITIONS)[number]["id"];
export const SUNRISE_DEF_IDS = SUNRISE_DEFINITIONS.map((d) => d.id) as SunriseDefinition[];
export const normaliseSunriseDef = (v: unknown): SunriseDefinition =>
  (SUNRISE_DEF_IDS as string[]).includes(v as string) ? (v as SunriseDefinition) : "edge";

export const PARASHARI_HOUSE_METHOD_IDS = ["rashi", "sripati", "equal"] as const;
export type ParashariHouseMethodId = (typeof PARASHARI_HOUSE_METHOD_IDS)[number];
export const normaliseParashariHouseMethod = (v: unknown): ParashariHouseMethodId =>
  (PARASHARI_HOUSE_METHOD_IDS as readonly string[]).includes(v as string) ? (v as ParashariHouseMethodId) : "rashi";

export interface ChartResult {
  chart: Chart;
  utc: string; // ISO instant of birth
  /** The offset actually applied to the civil birth time, and why. */
  timeBasis: TimeBasis;
  jd: number;
  ayanamsaValue: number;
  positions: PlanetPosition[];
  reading: Reading;
  transits: TransitPeriod[];
  now: { positions: PlanetPosition[]; asOf: string; lagnaLon?: number };
  /** Jaimini module: ascendant-based, kept separate from the BNN reading. */
  jaimini: JaiminiResult;
  /** Krishnamurti Paddhati base data (KP ayanamsa, Placidus cusps); the reading is derived in the client. */
  kp: KpBase;
  /** Ephemeris facts for Shadbala (BPHS ch. 27); the strengths are derived in the client. */
  shadbala?: ShadbalaBase;
  /** The five limbs of the birth day (Surya Siddhanta 1.36, 2.64-69), read at the birth instant. */
  panchanga?: PanchangaDay;
  /** Gulika (Mandi), the upagraha: its sidereal longitude and sign, and whether the birth was by day. */
  gulika?: { lon: number; signIndex: number; day: boolean };
  /** The time-based sphutas read at the query instant (Prasna Marga 5.20-23). */
  timeSphutas?: { pranasphutaAlt: number; mrityusphutaAlt: number; kalasphuta: number };
  /** Where each Vimshottari dasa lord stands when its dasa begins, for BPHS 48.8. */
  dasaStarts?: DasaStartTransit[];
  /** Saturn's nakshatra ingresses from birth to 100 years, for the Ashtakavarga transit points of BPHS ch. 70. */
  saturnNakshatras?: NakshatraPeriod[];
  /** Saturn passages over the father's Ashtakavarga point with Rahu, Saturn or Mars in the 4th from the Sun, BPHS 70.12-14. */
  fatherArishta?: FatherArishtaWindow[];
  /** The sensitive-content gate for this native: when `withheld`, length-of-life, maraka, arishta and parent-loss statements have been stripped server-side and every computing module strips its own. */
  sensitive?: SensitiveGate;
  /** The Moon's sign passages for thirty days from the day the chart was computed, for BPHS 70.21. */
  moonMonth?: SignPeriod[];
  /** Mars, Mercury and Venus sign passages from six months before to two years after the day the chart was computed, for BPHS 70.24-36. */
  fastTransits?: PlanetSignPeriod[];
  /** Nakshatra wealth rules of the DNA Astrology of Wealth book (twenty stars, pp. 96-169); needs the lagna, so it is computed server-side. */
  nakshatraWealth?: import("./nakshatra-wealth").NakshatraWealthReading;
}

export interface GeoHit {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
