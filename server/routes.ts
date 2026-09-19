import type { Express } from "express";
import type { Server } from "node:http";
import { storage } from "./storage";
import { insertChartSchema, type Chart, type ChartResult, type GeoHit } from "@shared/schema";
import { RULES, evaluate } from "@shared/rules";
import { localToUtc, julianDay, positionsAt, ayanamsaAt, transitPeriods, nowJd, type EphemerisOptions } from "./ephemeris";
import { DateTime } from "luxon";
import { buildChartPdf } from "./pdf";

const resultCache = new Map<string, ChartResult>();

export function computeChart(chart: Chart): ChartResult {
  const key = JSON.stringify({ ...chart, id: undefined, name: undefined, notes: undefined, day: DateTime.utc().toISODate() });
  const cached = resultCache.get(key);
  if (cached) return { ...cached, chart };

  const opts: EphemerisOptions = { ayanamsa: chart.ayanamsa, nodeType: chart.nodeType === "true" ? "true" : "mean" };
  const utc = localToUtc(chart.birthDate, chart.birthTime, chart.timezone);
  const jd = julianDay(utc);
  const positions = positionsAt(jd, opts);
  const reading = evaluate(positions);
  const endJd = jd + 100 * 365.25;
  const transits = [...transitPeriods("Jupiter", jd, endJd, opts), ...transitPeriods("Saturn", jd, endJd, opts)];
  const nj = nowJd();
  const result: ChartResult = {
    chart,
    utc: utc.toISO()!,
    jd,
    ayanamsaValue: ayanamsaAt(jd, opts),
    positions,
    reading,
    transits,
    now: { positions: positionsAt(nj, opts), asOf: DateTime.utc().toISO()! },
  };
  resultCache.set(key, result);
  if (resultCache.size > 200) resultCache.delete(resultCache.keys().next().value!);
  return result;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/charts", async (_req, res) => {
    res.json(await storage.listCharts());
  });

  app.get("/api/charts/:id", async (req, res) => {
    const chart = await storage.getChart(Number(req.params.id));
    if (!chart) return res.status(404).json({ message: "Chart not found" });
    try {
      res.json(computeChart(chart));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/charts/:id/pdf", async (req, res) => {
    const chart = await storage.getChart(Number(req.params.id));
    if (!chart) return res.status(404).json({ message: "Chart not found" });
    try {
      const result = computeChart(chart);
      const safe = chart.name.replace(/[^\w.-]+/g, "_").slice(0, 60) || "chart";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="nadi-${safe}.pdf"`);
      buildChartPdf(result).pipe(res);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/charts", async (req, res) => {
    const parsed = insertChartSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid chart", issues: parsed.error.issues });
    try {
      // Validate the datetime before saving
      localToUtc(parsed.data.birthDate, parsed.data.birthTime, parsed.data.timezone);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
    const chart = await storage.createChart(parsed.data);
    res.status(201).json(chart);
  });

  app.patch("/api/charts/:id", async (req, res) => {
    const parsed = insertChartSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid chart", issues: parsed.error.issues });
    const chart = await storage.updateChart(Number(req.params.id), parsed.data);
    if (!chart) return res.status(404).json({ message: "Chart not found" });
    res.json(chart);
  });

  app.delete("/api/charts/:id", async (req, res) => {
    const ok = await storage.deleteChart(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Chart not found" });
    res.status(204).end();
  });

  // Preview without saving
  app.post("/api/compute", async (req, res) => {
    const parsed = insertChartSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid chart", issues: parsed.error.issues });
    try {
      res.json(computeChart({ id: 0, ...parsed.data } as Chart));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/rules", (_req, res) => {
    res.json(RULES);
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
