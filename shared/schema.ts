import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import type * as z from "zod/mini";
import type { PlanetPosition, TransitPeriod } from "./astro";
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
}

export interface GeoHit {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
