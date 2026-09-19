// Server-side PDF report for a chart, drawn with PDFKit (vector South Indian chart,
// positions, reading, relations and Jupiter/Saturn timing).

import PDFDocument from "pdfkit";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANETS, PLANET_ABBR, SIGNS, SIGN_ABBR, SOUTH_INDIAN_CELLS, fmtDeg, fmtDegShort, houseFrom, type Planet, type PlanetPosition } from "@shared/astro";
import { LIFE_AREAS, RELATION_LABEL, type LifeArea } from "@shared/rules";
import type { PlanetStrength } from "@shared/strength";
import { readTransits, type TransitReading } from "@shared/timing";
import { chainSummary } from "@shared/flow";
import { nextMarriageWindow } from "@shared/marriage";

const INK = "#2b241e";
const MUTED = "#7a6f66";
const RULE = "#cfc6b8";
const VERMILION = "#a83e22";
const INDIGO = "#45507d";
const PAPER = "#f4f0e6";

const CLASSICAL = new Set<Planet>(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]);

function planetColor(p: Planet): string {
  if (p === "Jupiter") return VERMILION;
  if (p === "Saturn") return INDIGO;
  return INK;
}

type Doc = InstanceType<typeof PDFDocument>;

const PAGE = { w: 595.28, h: 841.89, m: 48 }; // A4 portrait, points
const CONTENT_W = PAGE.w - PAGE.m * 2;

function ensureSpace(doc: Doc, needed: number) {
  if (doc.y + needed > PAGE.h - PAGE.m - 24) doc.addPage();
}

function sectionTitle(doc: Doc, title: string, note?: string) {
  doc.x = PAGE.m;
  ensureSpace(doc, 60);
  doc.moveDown(0.8);
  const y = doc.y;
  doc.font("Times-Bold").fontSize(15).fillColor(INK).text(title, PAGE.m, y, { lineBreak: false });
  if (note) doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(note, PAGE.m, y + 5, { width: CONTENT_W, align: "right", lineBreak: false });
  doc.moveTo(PAGE.m, y + 22).lineTo(PAGE.w - PAGE.m, y + 22).lineWidth(0.6).strokeColor(RULE).stroke();
  doc.x = PAGE.m;
  doc.y = y + 30;
}

function drawSouthIndianChart(doc: Doc, x: number, y: number, size: number, positions: PlanetPosition[], transit: PlanetPosition[], title: string, subtitle: string) {
  const cell = size / 4;
  doc.save();
  doc.rect(x, y, size, size).fillColor(PAPER).fill();
  // grid
  doc.lineWidth(0.8).strokeColor(INK);
  doc.rect(x, y, size, size).stroke();
  for (const c of SOUTH_INDIAN_CELLS) {
    doc.rect(x + c.col * cell, y + c.row * cell, cell, cell).stroke();
  }
  // centre block overlays inner 2x2
  doc.rect(x + cell, y + cell, cell * 2, cell * 2).fillColor(PAPER).fill();
  doc.rect(x + cell, y + cell, cell * 2, cell * 2).lineWidth(0.8).strokeColor(INK).stroke();

  const bySign = new Map<number, PlanetPosition[]>();
  for (const p of positions) bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
  const tBySign = new Map<number, PlanetPosition[]>();
  for (const p of transit) tBySign.set(p.signIndex, [...(tBySign.get(p.signIndex) ?? []), p]);

  for (const c of SOUTH_INDIAN_CELLS) {
    const cx = x + c.col * cell;
    const cy = y + c.row * cell;
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(SIGN_ABBR[c.signIndex], cx + 4, cy + 4, { lineBreak: false });
    const ps = bySign.get(c.signIndex) ?? [];
    const twoCol = ps.length > 3;
    ps.forEach((p, i) => {
      const col = twoCol ? i % 2 : 0;
      const row = twoCol ? Math.floor(i / 2) : i;
      const px = cx + 5 + col * (cell / 2 - 2);
      const py = cy + 15 + row * 11;
      if (py > cy + cell - 10) return;
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(planetColor(p.planet));
      const label = PLANET_ABBR[p.planet];
      doc.text(label, px, py, { lineBreak: false });
      const lw = doc.widthOfString(label);
      const deg = twoCol ? `${Math.floor(p.degInSign)}°` : fmtDegShort(p.lon);
      doc.font("Helvetica").fontSize(6).fillColor(MUTED).text(`${deg}${p.retrograde && CLASSICAL.has(p.planet) ? " R" : ""}`, px + lw + 2, py + 1.5, { lineBreak: false });
    });
    const ts = tBySign.get(c.signIndex) ?? [];
    if (ts.length) {
      doc.font("Helvetica-Oblique").fontSize(6.5).fillColor(MUTED);
      doc.text(ts.map((t) => `t${PLANET_ABBR[t.planet]}`).join(" "), cx, cy + cell - 11, { width: cell - 4, align: "right", lineBreak: false });
    }
  }
  // centre text
  doc.font("Times-Bold").fontSize(11).fillColor(INK).text(title, x + cell, y + cell + cell * 0.75, { width: cell * 2, align: "center" });
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(subtitle, x + cell, doc.y + 2, { width: cell * 2, align: "center" });
  doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text("Rasi · sidereal", x + cell, y + cell * 3 - 14, { width: cell * 2, align: "center" });
  doc.restore();
}

function planetTable(doc: Doc, x: number, y: number, w: number, positions: PlanetPosition[], strength: PlanetStrength[]) {
  const stOf = (p: Planet) => strength.find((q) => q.planet === p);
  const cols = [0, 0.18, 0.36, 0.55, 0.82].map((f) => x + f * w);
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
  const headers = ["Planet", "Sign", "Degree", "Nakshatra", "Dignity"];
  headers.forEach((h, i) => doc.text(h, cols[i], y, { lineBreak: false }));
  let ry = y + 12;
  doc.moveTo(x, ry - 2).lineTo(x + w, ry - 2).lineWidth(0.5).strokeColor(RULE).stroke();
  for (const p of positions) {
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(planetColor(p.planet)).text(p.planet, cols[0], ry, { lineBreak: false });
    const st = stOf(p.planet);
    const flags = `${p.retrograde && CLASSICAL.has(p.planet) ? " R" : ""}${p.combust ? " c" : ""}${st?.winningOver.length ? " w" : ""}`;
    if (flags) {
      const pw = doc.widthOfString(p.planet);
      doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(flags, cols[0] + pw + 1, ry + 1, { lineBreak: false });
    }
    doc.font("Helvetica").fontSize(8).fillColor(INK).text(p.sign, cols[1], ry, { lineBreak: false });
    doc.text(fmtDeg(p.lon), cols[2], ry, { lineBreak: false });
    doc.text(`${p.nakshatra} ${p.pada}`, cols[3], ry, { lineBreak: false });
    if (st && st.effectiveDignity !== p.dignity) {
      doc.fillColor(MUTED).text(p.dignity, cols[4], ry, { lineBreak: false, strike: true });
    } else {
      doc.fillColor(MUTED).text(p.dignity, cols[4], ry, { lineBreak: false });
    }
    ry += 14;
    doc.moveTo(x, ry - 3).lineTo(x + w, ry - 3).lineWidth(0.3).strokeColor(RULE).stroke();
  }
  return ry;
}

function scoreDots(doc: Doc, x: number, y: number, score: number) {
  const n = Math.max(1, Math.min(3, Math.round(score)));
  for (let i = 1; i <= 3; i++) {
    doc.circle(x + (i - 1) * 6, y, 1.8).fillColor(i <= n ? INK : RULE).fill();
  }
}

export function buildChartPdf(result: ChartResult): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margins: { top: PAGE.m, bottom: 20, left: PAGE.m, right: PAGE.m }, bufferPages: true, info: { Title: `${result.chart.name} — Nadi reading`, Author: "Nadi" } });
  const { chart, positions, reading, transits, now } = result;
  const birthLocal = DateTime.fromISO(result.utc).setZone(chart.timezone);
  const birthStr = birthLocal.toFormat("d LLLL yyyy, HH:mm");

  // ── Header ──
  doc.font("Times-Bold").fontSize(22).fillColor(INK).text(chart.name, PAGE.m, PAGE.m);
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(`${birthStr} · ${chart.place}`);
  doc.fontSize(8).text(`Ayanamsa ${chart.ayanamsa} ${result.ayanamsaValue.toFixed(3)}°  ·  ${chart.nodeType} node  ·  ${chart.timezone}  ·  ${chart.latitude.toFixed(3)}°, ${chart.longitude.toFixed(3)}°`);
  doc.moveDown(0.6);
  doc.moveTo(PAGE.m, doc.y).lineTo(PAGE.w - PAGE.m, doc.y).lineWidth(0.8).strokeColor(INK).stroke();
  doc.y += 14;

  // ── Chart + table side by side ──
  const chartSize = 220;
  const chartY = doc.y;
  const transitNow = now.positions.filter((p) => p.planet === "Jupiter" || p.planet === "Saturn");
  drawSouthIndianChart(doc, PAGE.m, chartY, chartSize, positions, transitNow, chart.name, birthLocal.toFormat("d LLL yyyy · HH:mm"));
  const tableX = PAGE.m + chartSize + 18;
  const tableEnd = planetTable(doc, tableX, chartY + 2, PAGE.w - PAGE.m - tableX, positions, reading.strength);
  doc.font("Helvetica").fontSize(6.5).fillColor(MUTED);
  doc.text(`Ju Jeeva · Sa Karma · R retrograde · c combust (Sun's pada) · w leads an enemy by degree · struck dignity set aside by a Nadi rule · tJu tSa transits as of ${DateTime.fromISO(now.asOf).toFormat("d LLL yyyy")}`, PAGE.m, chartY + chartSize + 6, { width: chartSize });
  doc.y = Math.max(chartY + chartSize + 36, tableEnd + 6);

  // ── Karakas ──
  sectionTitle(doc, "Jeeva and Karma");
  for (const [label, data, planet] of [
    ["Jupiter · Jeeva karaka · the native", reading.jeeva, "Jupiter"],
    ["Saturn · Karma karaka · the profession", reading.karma, "Saturn"],
  ] as const) {
    ensureSpace(doc, 40);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(planetColor(planet)).text(label);
    doc.font("Helvetica").fontSize(9).fillColor(INK).text(data.summary, { width: CONTENT_W });
    doc.moveDown(0.5);
  }
  {
    const m = reading.marriage;
    const win = nextMarriageWindow(m, transits, now.asOf.slice(0, 10));
    const spouseWord = m.gender === "female" ? "husband" : m.gender === "male" ? "wife" : "spouse";
    const genderNote = m.gender === "female" ? "female chart" : m.gender === "male" ? "male chart" : "gender not set, read as male";
    ensureSpace(doc, 60);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(planetColor(m.spouse)).text(`${m.spouse} · Kalatra karaka · marriage`);
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(`${genderNote}: ${m.native} is the native, ${m.spouse} the ${spouseWord}; no house lords, the karakas are read against each other.`, { width: CONTENT_W });
    const label = { strong: "Promised, strong", moderate: "Promised, half strength", weak: "Promised, lesser strength", "by-karma": "Promised through Saturn", "through-dispositor": "Indirect, via dispositor", absent: "No structural signature" }[m.promised];
    doc.font("Helvetica").fontSize(9).fillColor(INK).text(`${label}. ${m.headline}`, { width: CONTENT_W });
    for (const n of m.notes) doc.text(`• ${n}`, PAGE.m + 8, doc.y + 1, { width: CONTENT_W - 8 });
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(
      `Triggers: Jupiter over ${m.spouseSign} (full) or its trines ${m.triggerSigns.slice(1).join(", ")} (three-quarter).${win ? ` Next: Jupiter ${win.kind === "over" ? "over" : "in trine from"} ${win.period.sign}, ${DateTime.fromISO(win.period.start).toFormat("LLL yyyy")} – ${DateTime.fromISO(win.period.end).toFormat("LLL yyyy")}.` : ""}`,
      PAGE.m,
      doc.y + 2,
      { width: CONTENT_W },
    );
    doc.moveDown(0.5);
  }

  // ── Strength notes ──
  const strengthRows = reading.strength.filter((st) => st.notes.length);
  if (strengthRows.length || reading.chains.length) {
    sectionTitle(doc, "Planetary strength", "Rao's basic rules · Naik");
    for (const st of strengthRows) {
      doc.font("Helvetica").fontSize(8.5);
      const text = st.notes.join(". ") + ".";
      const h = doc.heightOfString(text, { width: CONTENT_W - 60 }) + 5;
      ensureSpace(doc, h);
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(planetColor(st.planet)).text(st.planet, PAGE.m, y, { lineBreak: false });
      doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(text, PAGE.m + 60, y, { width: CONTENT_W - 60 });
      doc.y = y + h;
    }
    if (reading.chains.length) {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text("Degree order within a sign", PAGE.m, doc.y, { width: CONTENT_W });
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("The planet ahead by degree hands its matters to the one behind (Rao, rule 1); a shared pada is the tightest bond.", PAGE.m, doc.y + 1, { width: CONTENT_W });
      for (const c of reading.chains) {
        const text = chainSummary(c);
        doc.font("Helvetica").fontSize(8.5);
        const h = doc.heightOfString(text, { width: CONTENT_W }) + 4;
        ensureSpace(doc, h);
        doc.fillColor(INK).text(text, PAGE.m, doc.y + 2, { width: CONTENT_W });
      }
      doc.moveDown(0.3);
    }
  }

  // ── Reading ──
  sectionTitle(doc, "Reading", `${reading.findings.length} findings from ${reading.findings.length ? "the rule book" : "no rules"}`);
  for (const area of Object.keys(LIFE_AREAS) as LifeArea[]) {
    const items = reading.findings.filter((f) => f.area === area);
    if (!items.length) continue;
    ensureSpace(doc, 50);
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK).text(LIFE_AREAS[area].label, PAGE.m, doc.y);
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`karaka ${LIFE_AREAS[area].karaka}`, PAGE.m, doc.y - 11, { width: CONTENT_W, align: "right" });
    doc.y += 4;
    for (const f of items) {
      const textX = PAGE.m + 24;
      const textW = CONTENT_W - 24;
      doc.font("Helvetica").fontSize(9);
      const h = doc.heightOfString(f.text, { width: textW }) + 12;
      ensureSpace(doc, h + 6);
      const y = doc.y;
      scoreDots(doc, PAGE.m + 3, y + 5, f.score);
      doc.fillColor(INK).text(f.text, textX, y, { width: textW });
      const flow = f.flow ? `${f.flow.from} ahead > ${f.flow.to}${f.flow.tier === "pada" ? " (same pada)" : f.flow.tier === "nakshatra" ? " (same nakshatra)" : ""}` : null;
      const meta = [f.planets.join(" · "), f.relation ? RELATION_LABEL[f.relation] : null, flow, f.viaRetro ? "via retrogression" : null, f.modifier ?? null, f.source ?? null].filter(Boolean).join(" — ");
      doc.font("Helvetica").fontSize(7).fillColor(MUTED).text(meta, textX, doc.y, { width: textW });
      doc.y += 6;
    }
    doc.moveDown(0.4);
  }

  // ── Relations ──
  doc.addPage();
  sectionTitle(doc, "Relations by sign", "C conjunct · 2 second · 12 twelfth · T trine · 7 seventh · * via retrograde");
  const rel = new Map(reading.relations.map((r) => [`${r.subject}|${r.object}`, r]));
  const ABBR: Record<string, string> = { conjunct: "C", next: "2", prev: "12", trine: "T", opposite: "7" };
  const gx = PAGE.m;
  const gy = doc.y;
  const labelW = 60;
  const cw = (CONTENT_W - labelW) / 9;
  const rh = 18;
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("subject / object", gx, gy + 5, { lineBreak: false });
  PLANETS.forEach((p, i) => doc.font("Helvetica-Bold").fontSize(8).fillColor(INK).text(PLANET_ABBR[p], gx + labelW + i * cw, gy + 5, { width: cw, align: "center", lineBreak: false }));
  PLANETS.forEach((s, ri) => {
    const y = gy + rh * (ri + 1);
    doc.moveTo(gx, y).lineTo(gx + CONTENT_W, y).lineWidth(0.3).strokeColor(RULE).stroke();
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(planetColor(s)).text(s, gx, y + 5, { lineBreak: false });
    PLANETS.forEach((o, ci) => {
      const cx = gx + labelW + ci * cw;
      if (s === o) {
        doc.rect(cx, y + 0.5, cw, rh - 1).fillColor("#e9e3d6").fill();
        return;
      }
      const r = rel.get(`${s}|${o}`);
      const txt = r ? `${ABBR[r.relation] ?? ""}${r.viaRetro ? "*" : ""}` : "·";
      doc.font(r?.relation === "conjunct" ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(r ? INK : RULE).text(txt, cx, y + 5, { width: cw, align: "center", lineBreak: false });
    });
  });
  doc.y = gy + rh * 10 + 10;

  // ── Timing ──
  const birth = DateTime.fromISO(result.utc);
  const nowDt = DateTime.fromISO(now.asOf);
  const timing = readTransits(transits, positions, reading.findings, result.utc);

  // Current passages first.
  const currentReadings = (["Jupiter", "Saturn"] as const)
    .map((pl) => timing.find((r) => r.period.planet === pl && nowDt >= DateTime.fromISO(r.period.start) && nowDt < DateTime.fromISO(r.period.end)))
    .filter((r): r is TransitReading => !!r);
  if (currentReadings.length) {
    sectionTitle(doc, "Where the karakas stand now", `as of ${nowDt.toFormat("d LLL yyyy")}`);
    for (const r of currentReadings) {
      const t = r.period;
      doc.font("Helvetica").fontSize(8.5);
      const body = [r.headline, ...r.activated.slice(0, 3).map((f) => `• ${LIFE_AREAS[f.area].label}: ${f.text}`), ...r.notes].join("\n");
      const h = doc.heightOfString(body, { width: CONTENT_W }) + 26;
      ensureSpace(doc, h);
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(planetColor(t.planet)).text(`${t.planet} in ${t.sign}`, PAGE.m, y, { lineBreak: false });
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`${DateTime.fromISO(t.start).toFormat("d LLL yyyy")} – ${DateTime.fromISO(t.end).toFormat("d LLL yyyy")}`, PAGE.m, y + 1, { width: CONTENT_W, align: "right", lineBreak: false });
      doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(r.headline, PAGE.m, y + 14, { width: CONTENT_W });
      for (const f of r.activated.slice(0, 3)) doc.fillColor(INK).text(`• ${LIFE_AREAS[f.area].label}: ${f.text}`, PAGE.m + 8, doc.y + 1, { width: CONTENT_W - 8 });
      doc.fontSize(7.5).fillColor(MUTED);
      for (const n of r.notes) doc.text(n, PAGE.m, doc.y + 1, { width: CONTENT_W });
      doc.y += 8;
    }
  }

  for (const track of ["Jupiter", "Saturn"] as const) {
    sectionTitle(doc, `${track} passages over or in trine to natal planets`, track === "Jupiter" ? "one sign a year, twelve-year cycle" : "about two and a half years a sign");
    const rows = timing
      .filter((r) => r.period.planet === track && (r.conjunct.length > 0 || r.trine.length >= 2))
      .map((r) => {
        const start = DateTime.fromISO(r.period.start);
        const end = DateTime.fromISO(r.period.end);
        return { r, start, end, age: Math.max(0, start.diff(birth, "years").years), current: nowDt >= start && nowDt < end };
      });
    const c = [PAGE.m, PAGE.m + 48, PAGE.m + 118, PAGE.m + 240];
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
    ["Age", "Sign", "Period", "What ripens"].forEach((h, i) => doc.text(h, c[i], doc.y, { lineBreak: false }));
    doc.y += 12;
    const colW = CONTENT_W - 240;
    for (const { r, start, end, age, current } of rows) {
      const t = r.period;
      const bullets = r.activated.slice(0, current ? 3 : 2).map((f) => `• ${f.text}`);
      const notes = r.notes.slice(0, 2);
      doc.font("Helvetica").fontSize(8);
      const hHead = doc.heightOfString(r.headline, { width: colW });
      doc.fontSize(7.5);
      const hBul = bullets.length ? doc.heightOfString(bullets.join("\n"), { width: colW - 6 }) + 2 : 0;
      doc.fontSize(7);
      const hNotes = notes.length ? doc.heightOfString(notes.join("\n"), { width: colW }) + 2 : 0;
      const h = Math.max(22, hHead + hBul + hNotes + 9);
      ensureSpace(doc, h);
      const y = doc.y;
      if (current) doc.rect(PAGE.m - 4, y - 3, CONTENT_W + 8, h).fillColor("#f3e4dc").fill();
      doc.moveTo(PAGE.m, y - 3).lineTo(PAGE.w - PAGE.m, y - 3).lineWidth(0.3).strokeColor(RULE).stroke();
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(age < 0.02 ? "Birth" : `Age ${Math.floor(age)}`, c[0], y, { lineBreak: false });
      doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(`${t.sign}${t.retrogradeEntry ? " R" : ""}`, c[1], y, { lineBreak: false });
      doc.font("Helvetica").fontSize(7).fillColor(MUTED).text(r.conjunct.length ? `over ${r.conjunct.map((p) => PLANET_ABBR[p]).join(" ")}` : `trine ${r.trine.map((p) => PLANET_ABBR[p]).join(" ")}`, c[1], y + 11, { lineBreak: false });
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`${start.toFormat("d LLL yyyy")} – ${end.toFormat("d LLL yyyy")}`, c[2], y, { width: 118, lineBreak: false });
      doc.font("Helvetica").fontSize(8).fillColor(INK).text(r.headline, c[3], y, { width: colW });
      if (bullets.length) doc.fontSize(7.5).fillColor(INK).text(bullets.join("\n"), c[3] + 6, doc.y + 2, { width: colW - 6 });
      if (notes.length) doc.fontSize(7).fillColor(MUTED).text(notes.join("\n"), c[3], doc.y + 2, { width: colW });
      doc.y = y + h;
    }
    doc.moveDown(0.5);
  }

  // ── Footer on every page ──
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(7).fillColor(MUTED);
    doc.text(`${chart.name} · Bhrigu Nandi Nadi reading · Nadi`, PAGE.m, PAGE.h - 36, { lineBreak: false });
    doc.text(`${i + 1} / ${range.count}`, PAGE.m, PAGE.h - 36, { width: CONTENT_W, align: "right", lineBreak: false });
  }
  doc.switchToPage(range.start + range.count - 1);
  doc.font("Helvetica").fontSize(7).fillColor(MUTED);
  doc.text(
    "Positions from the Swiss Ephemeris (Astrodienst). Interpretive text follows the general principles of Bhrigu Nandi Nadi as taught by R.G. Rao and Satyanarayana Naik; it is a starting set of rules meant to be extended, not a verdict.",
    PAGE.m,
    PAGE.h - PAGE.m - 14,
    { width: CONTENT_W },
  );
  doc.end();
  return doc;
}
