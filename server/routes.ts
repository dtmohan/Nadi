import type { Express } from "express";
import type { Server } from "node:http";
import {
  insertChartSchema,
  type Chart,
  type ChartResult,
  type GeoHit,
  normaliseSunriseDef,
} from "@shared/schema";
import { RULES, applyBand, evaluate } from "@shared/rules";
import { assessNakshatraWealth } from "@shared/nakshatra-wealth";
import {
  birthInstant,
  julianDay,
  positionsAt,
  ayanamsaAt,
  transitPeriods,
  nakshatraPeriods,
  signPeriodsOf,
  jdToIso,
  nowJd,
  ascendantAt,
  specialLagnas,
  kpBase,
  judgementNow,
  shadbalaBase,
  sunPath,
  panchangaAt,
  panchangaForDate,
  signStay,
  gulikaLongitude,
  timeSphutas,
  type EphemerisOptions,
} from "./ephemeris";
import { computeJaimini } from "@shared/jaimini";
import { computeSarvartha, SC_LIFESPAN_TOPICS } from "@shared/sarvartha";
import { computeVargas } from "@shared/vargas";
import { vimshottari } from "@shared/kp";
import type { DasaStartTransit } from "@shared/shadbala";
import { JAIMINI_RULE_INFO } from "@shared/rules-jaimini";
import JAIMINI_SUTRAS from "@shared/data/jaimini-sutras.json";
import { DateTime } from "luxon";
import { buildChartPdf } from "./pdf";
import { renderReportPdf } from "./report-pdf";
import {
  buildReport,
  REPORT_MODULE_IDS,
  type ReportTools,
} from "@shared/report";
import { RECTIFY_METHODS, type RectifyMethod } from "@shared/rectify-methods";
import { gocharaCalendar, calendarWithhold } from "./gochara-calendar";
import type { OwnMarks } from "@shared/gochara";
import { fatherArishtaWindows } from "./arishta";
import { rectify } from "./rectify";
import { validateEvents } from "./validate";
import { z } from "zod";
import { createHash } from "node:crypto";
import { sensitiveGate, redactSensitive, withholdText } from "@shared/life-stage";

// Computed readings kept briefly so repeat requests are quick. An entry holds no name, notes,
// life events or birth inputs (the request supplies those again on a hit), is looked up by a
// hash of the request, and expires after ten minutes. The derived timelines still imply the
// birth date, which is why entries do not outlive the TTL.
type CachedResult = Omit<ChartResult, "chart" | "utc" | "jd" | "timeBasis">;
const RESULT_TTL_MS = 10 * 60_000;
const RESULT_CACHE_MAX = 200;
const resultCache = new Map<string, { at: number; result: CachedResult }>();

function resultCacheKey(chart: Chart): string {
  const request = JSON.stringify({
    ...chart,
    id: undefined,
    name: undefined,
    notes: undefined,
    day: DateTime.utc().toISODate(),
  });
  return createHash("sha256").update(request).digest("hex");
}

function resultCacheGet(key: string): CachedResult | undefined {
  const now = Date.now();
  // Entries sit in insertion order, so the expired ones are at the front.
  for (;;) {
    const first = resultCache.entries().next();
    if (first.done || now - first.value[1].at <= RESULT_TTL_MS) break;
    resultCache.delete(first.value[0]);
  }
  return resultCache.get(key)?.result;
}

function resultCachePut(key: string, result: ChartResult): void {
  const { chart: _chart, utc: _utc, jd: _jd, timeBasis: _basis, ...derived } = result;
  resultCache.delete(key);
  resultCache.set(key, { at: Date.now(), result: derived });
  while (resultCache.size > RESULT_CACHE_MAX)
    resultCache.delete(resultCache.keys().next().value!);
}

const opts0 = (chart: Chart): EphemerisOptions => ({
  ayanamsa: chart.ayanamsa,
  nodeType: chart.nodeType === "true" ? "true" : "mean",
  sunrise: normaliseSunriseDef(chart.sunriseDef),
});

/** Sidereal position of each dasa lord at the start of its maha dasa (48.8). */
function dasaStartTransits(
  moonLon: number,
  birthIso: string,
  opts: EphemerisOptions,
): DasaStartTransit[] {
  const vim = vimshottari(moonLon, birthIso, birthIso);
  return vim.dasas.map((d) => {
    const p = positionsAt(
      julianDay(DateTime.fromISO(d.start).toUTC()),
      opts,
    ).find((x) => x.planet === d.lord)!;
    return { lord: d.lord, start: d.start, lon: p.lon, signIndex: p.signIndex };
  });
}

export function computeChart(chart: Chart): ChartResult {
  const key = resultCacheKey(chart);
  const cached = resultCacheGet(key);
  if (cached) {
    // The chart and its birth instant come from the request, never from the cache.
    const { utc, basis } = birthInstant(chart);
    const jd = julianDay(utc);
    const fresh = kpBase(
      jd,
      chart.latitude,
      chart.longitude,
      basis.displayZone,
      opts0(chart).nodeType,
    );
    return {
      ...cached,
      chart,
      utc: utc.toISO()!,
      timeBasis: basis,
      jd,
      kp: {
        ...cached.kp,
        stability: cached.kp.stability ?? fresh.stability,
        now: fresh.now,
      },
    };
  }

  const opts: EphemerisOptions = opts0(chart);
  const { utc, basis } = birthInstant(chart);
  const zone = basis.displayZone;
  const jd = julianDay(utc);
  const positions = positionsAt(jd, opts);
  const gender =
    (chart.gender as "male" | "female" | "unspecified") ?? "unspecified";
  const reading = evaluate(positions, undefined, gender);
  // Birth-time band: read the Nadi lines again at both ends; lines whose direction, bond or
  // firing changes inside the band say so. The reading at the stated time is unchanged.
  const band = Math.max(0, Math.min(180, Number(chart.timeUncertaintyMin ?? 0) || 0));
  if (band > 0)
    applyBand(
      reading,
      positionsAt(jd - band / 1440, opts),
      positionsAt(jd + band / 1440, opts),
      band,
      gender,
    );
  const endJd = jd + 100 * 365.25;
  const transits = [
    ...transitPeriods("Jupiter", jd, endJd, opts),
    ...transitPeriods("Saturn", jd, endJd, opts),
  ];
  const nj = nowJd();
  let special: { horaLagna: number; ghatikaLagna: number } | undefined;
  try {
    special = specialLagnas(jd, chart.latitude, chart.longitude, opts);
  } catch {
    special = undefined;
  }
  const asc = ascendantAt(jd, chart.latitude, chart.longitude, opts);
  const jaimini = computeJaimini(positions, asc, utc.toISO()!, special);
  const result: ChartResult = {
    chart,
    utc: utc.toISO()!,
    timeBasis: basis,
    jd,
    ayanamsaValue: ayanamsaAt(jd, opts),
    positions,
    reading,
    transits,
    now: {
      positions: positionsAt(nj, opts),
      asOf: DateTime.utc().toISO()!,
      lagnaLon: ascendantAt(nj, chart.latitude, chart.longitude, opts),
      gulika: gulikaLongitude(nj, chart.latitude, chart.longitude, zone, opts),
      marsStay: signStay("Mars", nj, opts),
    },
    jaimini,
    kp: kpBase(jd, chart.latitude, chart.longitude, zone, opts.nodeType),
    shadbala: shadbalaBase(jd, chart.latitude, chart.longitude, opts),
    panchanga: panchangaAt(jd, chart.latitude, chart.longitude, zone, opts),
    gulika: gulikaLongitude(jd, chart.latitude, chart.longitude, zone, opts),
    timeSphutas: timeSphutas(nowJd(), chart.latitude, chart.longitude, zone, opts),
    dasaStarts: dasaStartTransits(
      positions.find((p) => p.planet === "Moon")!.lon,
      utc.toISO()!,
      opts,
    ),
    saturnNakshatras: nakshatraPeriods("Saturn", jd, endJd, opts),
    fatherArishta: fatherArishtaWindows(
      positions,
      Math.floor((asc % 360) / 30),
      transits,
      opts,
    ),
    moonMonth: signPeriodsOf("Moon", nj, nj + 30, opts).map((m) => ({
      signIndex: m.signIndex,
      start: jdToIso(m.start),
      end: jdToIso(m.end),
    })),
    fastTransits: (["Mars", "Mercury", "Venus"] as const).flatMap((p) =>
      signPeriodsOf(p, nj - 183, nj + 731, opts).map((m) => ({
        planet: p,
        signIndex: m.signIndex,
        start: jdToIso(m.start),
        end: jdToIso(m.end),
      })),
    ),
    nakshatraWealth: assessNakshatraWealth(positions, asc),
    sarvartha: computeSarvartha(positions, asc, computeVargas(positions, asc)),
  };
  // One gate for every route: a native under the sensitive-content age gets the server-side
  // material stripped here; the client-side modules read `sensitive.withheld` and strip their own.
  const sensitive = sensitiveGate(chart, utc.toISO()!, result.now.asOf);
  result.sensitive = sensitive;
  if (sensitive.withheld) {
    result.jaimini = redactSensitive({ ...jaimini, ayur: null });
    result.reading = redactSensitive(reading);
    result.fatherArishta = [];
    // Sarvartha Chintamani's own length-of-life and loss rules are withheld the same way.
    if (result.sarvartha)
      result.sarvartha = {
        ...result.sarvartha,
        findings: result.sarvartha.findings.filter(
          (f) =>
            !SC_LIFESPAN_TOPICS.has(f.topic) &&
            !withholdText(`${f.topic}: ${f.text}`),
        ),
      };
  }
  resultCachePut(key, result);
  return result;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Charts are kept in the visitor's browser. The server only computes: nothing sent here is stored.
  app.post("/api/pdf", async (req, res) => {
    const parsed = insertChartSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid chart", issues: parsed.error.issues });
    try {
      const chart = { id: 0, ...parsed.data } as Chart;
      const result = computeChart(chart);
      const safe = chart.name.replace(/[^\w.-]+/g, "_").slice(0, 60) || "chart";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="nadi-${safe}.pdf"`,
      );
      buildChartPdf(result).pipe(res);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // The report PDF: the same sections the Report page shows, one module per system.
  // Body: the chart fields plus optional `plain` (reading mode) and `modules` (ids to include).
  app.post("/api/report.pdf", async (req, res) => {
    const { plain, modules, tools, ...body } = (req.body ?? {}) as Record<
      string,
      unknown
    >;
    const parsed = insertChartSchema.safeParse(body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid chart", issues: parsed.error.issues });
    const ids = Array.isArray(modules)
      ? (modules as unknown[]).filter(
          (m): m is string =>
            typeof m === "string" && REPORT_MODULE_IDS.includes(m),
        )
      : undefined;
    try {
      const chart = { id: 0, ...parsed.data } as Chart;
      const result = computeChart(chart);
      // The two tools are computed here only when their module is named; the Report page never asks for them.
      const toolResults: ReportTools = {};
      if (ids?.includes("validate"))
        toolResults.validation = parsed.data.events?.length
          ? validateEvents(parsed.data)
          : null;
      if (ids?.includes("rectify")) {
        const st = reportRectifySchema.safeParse(
          (tools as Record<string, unknown> | undefined)?.rectify,
        );
        if (!st.success)
          return res.status(400).json({
            message: "Invalid rectify state",
            issues: st.error.issues,
          });
        const state = st.data;
        toolResults.rectify = {
          result: rectify({
            chart: parsed.data,
            windowMinutes: state.windowMinutes,
            events: state.events,
            judge: state.judge,
          }),
          state,
        };
      }
      const rep = buildReport(result, {
        plain: plain !== false,
        modules: ids,
        tools: toolResults,
      });
      const safe = chart.name.replace(/[^\w.-]+/g, "_").slice(0, 60) || "chart";
      const tag = ids?.length === 1 ? `-${ids[0]}` : "";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="nadi-report-${safe}${tag}.pdf"`,
      );
      renderReportPdf(result, rep).pipe(res);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Compute a reading (used for both new and saved charts; nothing is stored)
  app.post("/api/compute", async (req, res) => {
    const parsed = insertChartSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid chart", issues: parsed.error.issues });
    try {
      res.json(computeChart({ id: 0, ...parsed.data } as Chart));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Card summary for the home page: natal signs, lagna, the running dasa and today's slow transits (nothing is stored)
  app.post("/api/summary", (req, res) => {
    const parsed = insertChartSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid chart", issues: parsed.error.issues });
    try {
      const chart = { id: 0, ...parsed.data } as Chart;
      const opts = opts0(chart);
      const { utc } = birthInstant(chart);
      const jd = julianDay(utc);
      const positions = positionsAt(jd, opts);
      const asc = ascendantAt(jd, chart.latitude, chart.longitude, opts);
      const moon = positions.find((p) => p.planet === "Moon")!;
      const asOf = DateTime.utc().toISO()!;
      const vim = vimshottari(moon.lon, utc.toISO()!, asOf);
      const now = positionsAt(nowJd(), opts);
      const sign = (planet: string) =>
        now.find((p) => p.planet === planet)!.signIndex;
      res.json({
        positions: positions.map((p) => ({
          planet: p.planet,
          signIndex: p.signIndex,
          degInSign: p.degInSign,
          retrograde: p.retrograde,
        })),
        lagnaIdx: Math.floor((((asc % 360) + 360) % 360) / 30),
        dasa: { lord: vim.current.dasa.lord, end: vim.current.dasa.end },
        bhukti: { lord: vim.current.bhukti.lord, end: vim.current.bhukti.end },
        transit: {
          jupiter: sign("Jupiter"),
          saturn: sign("Saturn"),
          moon: sign("Moon"),
        },
        asOf,
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Ruling planets for the astrologer's own place at this moment (nothing is stored)
  const judgeSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.string().min(1).max(64),
    label: z.string().max(120).optional(),
  });
  /** Panchanga for a calendar date at a place (Surya Siddhanta 1.36, 2.64-69), with the planets at that sunrise for gochara. */
  // Gochara calendar: verdict stretches per planet from the natal Moon over a span of years.
  app.post("/api/gochara-calendar", (req, res) => {
    const {
      moonSignIndex,
      from,
      years = 5,
      ayanamsa = "lahiri",
      nodeType = "mean",
    } = req.body ?? {};
    if (
      typeof moonSignIndex !== "number" ||
      moonSignIndex < 0 ||
      moonSignIndex > 11
    )
      return res.status(400).json({ message: "moonSignIndex must be 0-11" });
    if (typeof from !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(from))
      return res.status(400).json({ message: "from must be YYYY-MM-DD" });
    const span = Math.min(12, Math.max(1, Number(years) || 5));
    // The birth chart's own-Ashtakavarga marks (Phaladeepika 26.41), twelve 0-8 counts per planet; optional.
    const marks = z
      .object(
        Object.fromEntries(
          ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].map((p) => [
            p,
            z.array(z.number().int().min(0).max(8)).length(12).optional(),
          ]),
        ),
      )
      .strict()
      .optional()
      .safeParse(req.body?.ownMarks);
    if (!marks.success)
      return res.status(400).json({ message: "ownMarks must give twelve marks of 0-8 per planet" });
    try {
      const start = DateTime.fromISO(from, { zone: "utc" });
      const jdStart = julianDay(start);
      const jdEnd = julianDay(start.plus({ years: span }));
      res.json(
        gocharaCalendar(
          Math.floor(moonSignIndex),
          jdStart,
          jdEnd,
          { ayanamsa, nodeType },
          marks.data as OwnMarks | undefined,
          // The age gate, decided here from the birth instant sent with the request; withheld when none is sent.
          calendarWithhold(req.body ?? {}, new Date().toISOString()),
        ),
      );
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/panchanga", (req, res) => {
    const schema = judgeSchema.extend({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      ayanamsa: z.string().max(24).default("lahiri"),
      nodeType: z.enum(["mean", "true"]).default("mean"),
      sunriseDef: z.string().max(16).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid request", issues: parsed.error.issues });
    try {
      const {
        date,
        latitude,
        longitude,
        timezone,
        ayanamsa,
        nodeType,
        sunriseDef,
      } = parsed.data;
      if (!DateTime.fromISO(date, { zone: timezone }).isValid)
        return res.status(400).json({ message: "Invalid date or time zone" });
      const eopts = {
        ayanamsa,
        nodeType,
        sunrise: normaliseSunriseDef(sunriseDef),
      };
      const out = panchangaForDate(date, latitude, longitude, timezone, eopts);
      // Mars's stay in its sign at that sunrise, for the practitioner checks beside the gochara.
      const sunriseJd = julianDay(DateTime.fromISO(out.day.sunrise).toUTC());
      res.json({ ...out, marsStay: signStay("Mars", sunriseJd, eopts) });
    } catch (e) {
      res.status(500).json({ message: (e as Error).message });
    }
  });

  /** The Moon's nakshatra for each of the next days, for the adverse-tara / trijanma fortnight view. */
  app.post("/api/tara-fortnight", (req, res) => {
    const schema = judgeSchema.extend({
      days: z.number().int().min(7).max(31).default(14),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      ayanamsa: z.string().max(24).default("lahiri"),
      nodeType: z.enum(["mean", "true"]).default("mean"),
      sunriseDef: z.string().max(16).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid request", issues: parsed.error.issues });
    try {
      const {
        latitude,
        longitude,
        timezone,
        days,
        from,
        ayanamsa,
        nodeType,
        sunriseDef,
      } = parsed.data;
      const opts: EphemerisOptions = {
        ayanamsa,
        nodeType,
        sunrise: normaliseSunriseDef(sunriseDef),
      };
      const picked = from && DateTime.fromISO(from, { zone: timezone }).isValid
        ? DateTime.fromISO(from, { zone: timezone })
        : DateTime.now().setZone(timezone);
      const start = picked.startOf("day");
      const out: { date: string; nakshatraName: string }[] = [];
      for (let d = 0; d < days; d++) {
        const day = start.plus({ days: d });
        const pd = panchangaAt(
          julianDay(day.toUTC()),
          latitude,
          longitude,
          timezone,
          opts,
        );
        out.push({ date: day.toISODate()!, nakshatraName: pd.nakshatra.name });
      }
      res.json({ days: out });
    } catch (e) {
      res.status(500).json({ message: (e as Error).message });
    }
  });

  app.post("/api/kp/ruling", (req, res) => {
    const parsed = judgeSchema
      .extend({ nodeType: z.enum(["mean", "true"]).default("mean") })
      .safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid request", issues: parsed.error.issues });
    try {
      const { latitude, longitude, timezone, nodeType } = parsed.data;
      res.json(judgementNow(latitude, longitude, timezone, nodeType));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // The Sun's daily sidereal longitude (KP ayanamsa) over a span, for the transit check on event windows
  const sunPathSchema = z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });
  app.post("/api/kp/sun-path", (req, res) => {
    const parsed = sunPathSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid request", issues: parsed.error.issues });
    try {
      const a = DateTime.fromISO(parsed.data.start, { zone: "utc" }).set({
        hour: 12,
      });
      const b = DateTime.fromISO(parsed.data.end, { zone: "utc" }).set({
        hour: 12,
      });
      if (!a.isValid || !b.isValid || b < a)
        return res.status(400).json({ message: "Bad span" });
      if (b.diff(a, "years").years > 130)
        return res.status(400).json({ message: "Span too long" });
      const path = sunPath(julianDay(a), julianDay(b), {
        ayanamsa: "kp",
        nodeType: "mean",
      });
      res.json({
        start: a.toISODate(),
        lons: path.map((p) => Math.round(p.lon * 100) / 100),
      });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Birth time rectification: scan a window around the recorded time (nothing is stored)
  const rectifyEventsSchema = z
    .array(
      z.object({
        label: z.string().max(80),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        houses: z.array(z.number().int().min(1).max(12)).min(1).max(12),
        cusp: z.number().int().min(1).max(12).optional(),
        area: z
          .enum([
            "self",
            "career",
            "wealth",
            "marriage",
            "children",
            "family",
            "health",
          ])
          .optional(),
      }),
    )
    .max(100)
    .default([]);
  const rectifySchema = z.object({
    chart: insertChartSchema,
    judge: judgeSchema.optional(),
    windowMinutes: z.number().min(1).max(720).default(30),
    events: rectifyEventsSchema,
  });
  /** What the Rectify tab was looking at, sent with a report export so the same scan is rerun. */
  const reportRectifySchema = z.object({
    method: z.enum(
      RECTIFY_METHODS.map((m) => m.id) as [RectifyMethod, ...RectifyMethod[]],
    ),
    windowMinutes: z.number().min(1).max(720).default(30),
    events: rectifyEventsSchema,
    judge: judgeSchema.optional(),
    confirmedMarks: z.array(z.string().max(60)).max(40).default([]),
  });
  // Check the saved life events against the chart as it stands (nothing is stored)
  app.post("/api/validate", (req, res) => {
    const parsed = insertChartSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid chart", issues: parsed.error.issues });
    try {
      res.json(validateEvents(parsed.data));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/kp/rectify", (req, res) => {
    const parsed = rectifySchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid request", issues: parsed.error.issues });
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
      res
        .status(502)
        .json({ message: "Geocoding unavailable", detail: e.message });
    }
  });

  return httpServer;
}
