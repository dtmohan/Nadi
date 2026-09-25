import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import type * as z from "zod/mini";
import type { PlanetPosition, TransitPeriod, NakshatraPeriod, SignPeriod, PlanetSignPeriod } from "./astro";
import type { FatherArishtaWindow } from "./father-arishta";
import type { Reading } from "./rules";
import type { JaiminiResult } from "./jaimini";
import type { KpBase } from "./kp";
import type { ShadbalaBase, DasaStartTransit } from "./shadbala";
import { chartEventsSchema, type ChartEvent } from "./events";

export const charts = sqliteTable("charts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  gender: text("gender").notNull().default("unspecified"),
  birthDate: text("birth_date").notNull(), // YYYY-MM-DD (local civil date)
  birthTime: text("birth_time").notNull(), // HH:MM (local civil time, 24h)
  timezone: text("timezone").notNull(), // IANA tz id
  place: text("place").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  ayanamsa: text("ayanamsa").notNull().default("lahiri"),
  nodeType: text("node_type").notNull().default("mean"),
  notes: text("notes").notNull().default(""),
  /** Remembered life events (matter, date, outcome, note), kept beside the birth data. */
  events: text("events", { mode: "json" }).$type<ChartEvent[]>().notNull().default([]),
});

export const insertChartSchema = createInsertSchema(charts, { events: chartEventsSchema.optional() }).omit({ id: true });

export type InsertChart = z.infer<typeof insertChartSchema>;
export type Chart = typeof charts.$inferSelect;

export const AYANAMSAS = [
  { id: "lahiri", label: "Lahiri (Chitrapaksha)" },
  { id: "raman", label: "B.V. Raman" },
  { id: "kp", label: "Krishnamurti (KP)" },
  { id: "yukteshwar", label: "Sri Yukteshwar" },
] as const;

export interface ChartResult {
  chart: Chart;
  utc: string; // ISO instant of birth
  jd: number;
  ayanamsaValue: number;
  positions: PlanetPosition[];
  reading: Reading;
  transits: TransitPeriod[];
  now: { positions: PlanetPosition[]; asOf: string };
  /** Jaimini module: ascendant-based, kept separate from the BNN reading. */
  jaimini: JaiminiResult;
  /** Krishnamurti Paddhati base data (KP ayanamsa, Placidus cusps); the reading is derived in the client. */
  kp: KpBase;
  /** Ephemeris facts for Shadbala (BPHS ch. 27); the strengths are derived in the client. */
  shadbala?: ShadbalaBase;
  /** Where each Vimshottari dasa lord stands when its dasa begins, for BPHS 48.8. */
  dasaStarts?: DasaStartTransit[];
  /** Saturn's nakshatra ingresses from birth to 100 years, for the Ashtakavarga transit points of BPHS ch. 70. */
  saturnNakshatras?: NakshatraPeriod[];
  /** Saturn passages over the father's Ashtakavarga point with Rahu, Saturn or Mars in the 4th from the Sun, BPHS 70.12-14. */
  fatherArishta?: FatherArishtaWindow[];
  /** The Moon's sign passages for thirty days from the day the chart was computed, for BPHS 70.21. */
  moonMonth?: SignPeriod[];
  /** Mars, Mercury and Venus sign passages from six months before to two years after the day the chart was computed, for BPHS 70.24-36. */
  fastTransits?: PlanetSignPeriod[];
}

export interface GeoHit {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
