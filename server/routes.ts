import type { Express } from "express";
import type { Server } from "node:http";
import { insertChartSchema, type Chart, type ChartResult, type GeoHit } from "@shared/schema";
import { RULES, evaluate } from "@shared/rules";
import { localToUtc, julianDay, positionsAt, ayanamsaAt, transitPeriods, nowJd, ascendantAt, specialLagnas, kpBase, judgementNow, type EphemerisOptions } from "./ephemeris";
import { computeJaimini } from "@shared/jaimini";
import { JAIMINI_RULE_INFO } from "@shared/rules-jaimini";
import JAIMINI_SUTRAS from "@shared/data/jaimini-sutras.json";
import { DateTime } from "luxon";
import { buildChartPdf } from "./pdf";
import { rectify } from "./rectify";
import { z } from "zod";

const resultCache = new Map<string, ChartResult>();

const opts0 = (chart: Chart): EphemerisOptions => ({ ayanamsa: chart.ayanamsa, nodeType: chart.nodeType === "true" ? "true" : "mean" });

export function computeChart(chart: Chart): ChartResult {
  const key = JSON.stringify({ ...chart, id: undefined, name: undefined, notes: undefined, day: DateTime.utc().toISODate() });
  const cached = resultCache.get(key);
  if (cached) return { ...cached, chart, kp: { ...cached.kp, now: kpBase(cached.jd, chart.latitude, chart.longitude, chart.timezone, opts0(chart).nodeType).now } };

  const opts: EphemerisOptions = { ayanamsa: chart.ayanamsa, nodeType: chart.nodeType === "true" ? "true" : "mean" };
  const utc = localToUtc(chart.birthDate, chart.birthTime, chart.timezone);
  const jd = julianDay(utc);
  const positions = positionsAt(jd, opts);
  const reading = evaluate(positions, undefined, (chart.gender as "male" | "female" | "unspecified") ?? "unspecified");
  const endJd = jd + 100 * 365.25;
  const transits = [...transitPeriods("Jupiter", jd, endJd, opts), ...transitPeriods("Saturn", jd, endJd, opts)];
  const nj = nowJd();
  let special: { horaLagna: number; ghatikaLagna: number } | undefined;
  try {
    special = specialLagnas(jd, chart.latitude, chart.longitude, opts);
  } catch {
    special = undefined;
  }
  const jaimini = computeJaimini(positions, ascendantAt(jd, chart.latitude, chart.longitude, opts), utc.toISO()!, special);
  const result: ChartResult = {
    chart,
    utc: utc.toISO()!,
    jd,
    ayanamsaValue: ayanamsaAt(jd, opts),
    positions,
    reading,
    transits,
    now: { positions: positionsAt(nj, opts), asOf: DateTime.utc().toISO()! },
    jaimini,
    kp: kpBase(jd, chart.latitude, chart.longitude, chart.timezone, opts.nodeType),
  };
  resultCache.set(key, result);
  if (resultCache.size > 200) resultCache.delete(resultCache.keys().next().value!);
  return result;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Charts are kept in the visitor's browser. The server only computes: nothing sent here is stored.
  app.post("/api/pdf", async (req, res) => {
    const parsed = insertChartSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid chart", issues: parsed.error.issues });
    try {
      const chart = { id: 0, ...parsed.data } as Chart;
      const result = computeChart(chart);
      const safe = chart.name.replace(/[^\w.-]+/g, "_").slice(0, 60) || "chart";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="nadi-${safe}.pdf"`);
      buildChartPdf(result).pipe(res);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Compute a reading (used for both new and saved charts; nothing is stored)
  app.post("/api/compute", async (req, res) => {
    const parsed = insertChartSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid chart", issues: parsed.error.issues });
    try {
      res.json(computeChart({ id: 0, ...parsed.data } as Chart));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Ruling planets for the astrologer's own place at this moment (nothing is stored)
  const judgeSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), timezone: z.string().min(1).max(64), label: z.string().max(120).optional() });
  app.post("/api/kp/ruling", (req, res) => {
    const parsed = judgeSchema.extend({ nodeType: z.enum(["mean", "true"]).default("mean") }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request", issues: parsed.error.issues });
    try {
      const { latitude, longitude, timezone, nodeType } = parsed.data;
      res.json(judgementNow(latitude, longitude, timezone, nodeType));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Birth time rectification: scan a window around the recorded time (nothing is stored)
  const rectifySchema = z.object({
    chart: insertChartSchema,
    judge: judgeSchema.optional(),
    windowMinutes: z.number().min(1).max(180).default(30),
    events: z
      .array(z.object({ label: z.string().max(80), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), houses: z.array(z.number().int().min(1).max(12)).min(1).max(12), cusp: z.number().int().min(1).max(12).optional(), area: z.enum(["self", "career", "wealth", "marriage", "children", "family", "health"]).optional() }))
      .max(12)
      .default([]),
  });
  app.post("/api/kp/rectify", (req, res) => {
    const parsed = rectifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request", issues: parsed.error.issues });
    try {
      res.json(rectify(parsed.data));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/rules", (_req, res) => {
    res.json(RULES);
  });

  app.get("/api/jaimini-rules", (_req, res) => {
    res.json(JAIMINI_RULE_INFO);
  });

  app.get("/api/jaimini-sutras", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(JAIMINI_SUTRAS);
  });

  // Place search via Open-Meteo geocoding (no key required)
  app.get("/api/geocode", async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) return res.json([]);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
      const r = await fetch(url);
      const data = (await r.json()) as any;
      const hits: GeoHit[] = (data.results ?? []).map((h: any) => ({
        name: h.name,
        admin1: h.admin1,
        country: h.country,
        latitude: h.latitude,
        longitude: h.longitude,
        timezone: h.timezone,
      }));
      res.json(hits);
    } catch (e: any) {
      res.status(502).json({ message: "Geocoding unavailable", detail: e.message });
    }
  });

  return httpServer;
}
