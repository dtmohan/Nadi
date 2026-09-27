// Server-side PDF report for a chart, drawn with PDFKit (vector South Indian chart,
// positions, reading, relations and Jupiter/Saturn timing).

import { displayLocal } from "@shared/time-basis";
import PDFDocument from "pdfkit";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANETS, PLANET_ABBR, SIGNS, SIGN_ABBR, SOUTH_INDIAN_CELLS, fmtDeg, fmtDegShort, houseFrom, type Planet, type PlanetPosition } from "@shared/astro";
import { LIFE_AREAS, RELATION_LABEL, type LifeArea, areaKarakaLabel } from "@shared/rules";
import { synthesize, AREA_TONE_LABEL } from "@shared/synthesis";
import { GLOSSARY } from "@shared/glossary";
import type { Gender } from "@shared/marriage";
import type { PlanetStrength } from "@shared/strength";
import { readTransits, type TransitReading } from "@shared/timing";
import { chainSummary, tierLabel } from "@shared/flow";
import { housesFrom, retroNotes, HOUSE_CLASS_LABEL } from "@shared/houses";
import { nextMarriageWindow } from "@shared/marriage";
import { nextChildWindow } from "@shared/children";
import { CHARA_KARAKA_INFO, SAVYA, influencesOn, type CharaDashaPeriod } from "@shared/jaimini";
import { JAIMINI_GROUP_LABEL } from "@shared/rules-jaimini";
import { AYUR_TERM_LABEL } from "@shared/jaimini-ayur";
import { JAIMINI_AREAS, RAO_SOURCE, currentFor, isHot, readAreas, type TransitTarget } from "@shared/jaimini-areas";
import { TRANSIT_GRADE_LABEL, confirmTransits, summarizeTouches } from "@shared/jaimini-transit";
import { computeAshtakavarga } from "@shared/ashtakavarga";
import { GOCHARA_AV_NOTES, SOLAR_MONTH_NOTES, avMarkText, gocharaAvMark, solarMonthReading } from "@shared/gochara-av";
import { PANCHANGA_CAVEATS, PANCHANGA_SOURCES, SURYA_SIDDHANTA_URL, type LimbSegment } from "@shared/panchanga";
import { computeGochara, GOCHARA_CAVEATS, BS_URL, PD_URL } from "@shared/gochara";
import { gocharaCalendar } from "./gochara-calendar";
import { nowJd } from "./ephemeris";

const INK = "#2b241e";
const MUTED = "#7a6f66";
const RULE = "#cfc6b8";
const VERMILION = "#a83e22";
const INDIGO = "#45507d";
const PAPER = "#f4f0e6";

const CLASSICAL = new Set<Planet>(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]);

let JEEVA: Planet = "Jupiter";
function planetColor(p: Planet): string {
  if (p === JEEVA) return VERMILION;
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
  if (note) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
    const tw = doc.font("Times-Bold").fontSize(15).widthOfString(title) + 16;
    doc.font("Helvetica").fontSize(8.5);
    let n = note;
    while (n.length > 20 && doc.widthOfString(n) > CONTENT_W - tw) n = n.replace(/\s*·[^·]*$/, "");
    doc.text(n, PAGE.m + tw, y + 5, { width: CONTENT_W - tw, align: "right", lineBreak: false });
  }
  doc.moveTo(PAGE.m, y + 22).lineTo(PAGE.w - PAGE.m, y + 22).lineWidth(0.6).strokeColor(RULE).stroke();
  doc.x = PAGE.m;
  doc.y = y + 30;
}

interface DrawPlanet {
  planet: Planet;
  signIndex: number;
  degInSign: number;
  lon?: number;
  retrograde?: boolean;
}
interface DrawOpts {
  /** Mark the ascendant sign. */
  lagnaSign?: number;
  /** Superscript tag after a planet; replaces the degree. */
  tags?: Partial<Record<Planet, string>>;
  /** Labels at the foot of a cell. */
  badges?: Record<number, string[]>;
  footer?: string;
  /** Planets drawn in vermilion (overrides BNN colouring). */
  accent?: Planet[];
}

function drawSouthIndianChart(doc: Doc, x: number, y: number, size: number, positions: DrawPlanet[], transit: PlanetPosition[], title: string, subtitle: string, opts: DrawOpts = {}) {
  const cell = size / 4;
  const colorOf = (pl: Planet) => (opts.accent ? (opts.accent.includes(pl) ? VERMILION : INK) : planetColor(pl));
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

  const bySign = new Map<number, DrawPlanet[]>();
  for (const p of positions) bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
  const tBySign = new Map<number, PlanetPosition[]>();
  for (const p of transit) tBySign.set(p.signIndex, [...(tBySign.get(p.signIndex) ?? []), p]);

  for (const c of SOUTH_INDIAN_CELLS) {
    const cx = x + c.col * cell;
    const cy = y + c.row * cell;
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(SIGN_ABBR[c.signIndex], cx + 4, cy + 4, { lineBreak: false });
    if (opts.lagnaSign === c.signIndex) doc.font("Helvetica-Bold").fontSize(6.5).fillColor(VERMILION).text("As", cx + 4, cy + cell - 11, { lineBreak: false });
    if (opts.badges?.[c.signIndex]?.length) doc.font("Helvetica-Bold").fontSize(6).fillColor(INDIGO).text(opts.badges[c.signIndex].join(" "), cx, cy + cell - 11, { width: cell - 4, align: "right", lineBreak: false });
    const ps = bySign.get(c.signIndex) ?? [];
    const twoCol = ps.length > 3;
    ps.forEach((p, i) => {
      const col = twoCol ? i % 2 : 0;
      const row = twoCol ? Math.floor(i / 2) : i;
      const px = cx + 5 + col * (cell / 2 - 2);
      const py = cy + 15 + row * 11;
      if (py > cy + cell - 10) return;
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colorOf(p.planet));
      const label = PLANET_ABBR[p.planet];
      doc.text(label, px, py, { lineBreak: false });
      const lw = doc.widthOfString(label);
      const tag = opts.tags?.[p.planet];
      if (tag) {
        doc.font("Helvetica-Bold").fontSize(5.5).fillColor(VERMILION).text(tag, px + lw + 1.5, py - 1, { lineBreak: false });
      } else {
        const lon = p.lon ?? p.signIndex * 30 + p.degInSign;
        const deg = twoCol ? `${Math.floor(p.degInSign)}°` : fmtDegShort(lon);
        doc.font("Helvetica").fontSize(6).fillColor(MUTED).text(`${deg}${p.retrograde && CLASSICAL.has(p.planet) ? " R" : ""}`, px + lw + 2, py + 1.5, { lineBreak: false });
      }
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
  doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(opts.footer ?? "Rasi · sidereal", x + cell, y + cell * 3 - 14, { width: cell * 2, align: "center" });
  doc.restore();
}

const ORD = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

function jaiminiSection(doc: Doc, result: ChartResult) {
  const { chart, positions, jaimini: j } = result;
  const birth = DateTime.fromISO(result.utc);
  const nowDt = DateTime.fromISO(result.now.asOf);
  const ak = j.karakas[0].planet;
  const al = j.arudhas[0];
  const ul = j.arudhas[11];

  doc.addPage();
  sectionTitle(doc, "Jaimini", "a separate, ascendant-based reading; nothing here feeds the Nadi reading above");
  doc.font("Helvetica").fontSize(8.5).fillColor(INK);
  doc.text(
    `Lagna ${j.lagna.sign} ${fmtDegShort(j.lagna.lon)} · Navamsa lagna ${j.navamsaLagna.sign} · Atmakaraka ${ak} · Karakamsa ${j.karakamsa.sign} · Arudha lagna ${al.sign} · Upapada ${ul.sign} · Chara dasha runs ${j.charaDasha.direction} (9th house ${SIGNS[j.charaDasha.ninthSign]})`,
    PAGE.m,
    doc.y,
    { width: CONTENT_W },
  );
  doc.moveDown(0.6);

  // two charts side by side
  const size = (CONTENT_W - 16) / 2;
  const top = doc.y;
  const rasiBadges: Record<number, string[]> = {};
  for (const a of j.arudhas) if (a.label === "AL" || a.label === "UL") (rasiBadges[a.signIndex] ??= []).push(a.label);
  const tags = Object.fromEntries(j.karakas.map((k) => [k.planet, k.karaka])) as Partial<Record<Planet, string>>;
  drawSouthIndianChart(doc, PAGE.m, top, size, positions, [], chart.name, "Rasi · lagna and padas", { lagnaSign: j.lagna.signIndex, badges: rasiBadges, accent: [ak], footer: "As ascendant · AL, UL padas" });
  drawSouthIndianChart(doc, PAGE.m + size + 16, top, size, j.navamsa, [], "Navamsa", "D9 · chara karakas", { lagnaSign: j.navamsaLagna.signIndex, badges: { [j.karakamsa.signIndex]: ["Karakamsa"] }, tags, accent: [ak], footer: "planets carry their karaka" });
  doc.y = top + size + 12;

  // karaka table
  sectionTitle(doc, "Chara karakas", "ranked by degree in sign; Rahu by 30 minus its degree");
  const kc = [PAGE.m, PAGE.m + 34, PAGE.m + 120, PAGE.m + 180, PAGE.m + 240, PAGE.m + 300];
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
  ["Karaka", "Name", "Planet", "Degree", "Rasi", "Navamsa · signifies"].forEach((h, i) => doc.text(h, kc[i], doc.y, { lineBreak: false }));
  doc.y += 11;
  for (const k of j.karakas) {
    const rp = positions.find((p) => p.planet === k.planet)!;
    const dp = j.navamsa.find((p) => p.planet === k.planet)!;
    const y = doc.y;
    doc.moveTo(PAGE.m, y - 2).lineTo(PAGE.w - PAGE.m, y - 2).lineWidth(0.3).strokeColor(RULE).stroke();
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(VERMILION).text(k.karaka, kc[0], y, { lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor(INK).text(CHARA_KARAKA_INFO[k.karaka].name, kc[1], y, { lineBreak: false });
    doc.text(k.planet, kc[2], y, { lineBreak: false });
    doc.fillColor(MUTED).text(`${k.rankDegree.toFixed(2)}°`, kc[3], y, { lineBreak: false });
    doc.fillColor(INK).text(rp.sign, kc[4], y, { lineBreak: false });
    doc.text(`${dp.sign} · `, kc[5], y, { continued: true, width: CONTENT_W - 300 }).fillColor(MUTED).text(CHARA_KARAKA_INFO[k.karaka].meaning);
    doc.y = Math.max(doc.y, y + 11) + 1;
  }

  // arudhas
  ensureSpace(doc, 90);
  sectionTitle(doc, "Arudha padas", "* moved to the 10th because the reflection fell in the house or its 7th");
  const ac = [PAGE.m, PAGE.m + 40, PAGE.m + 110, PAGE.m + 200];
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
  ["Pada", "Sign", "From", "Governs"].forEach((h, i) => doc.text(h, ac[i], doc.y, { lineBreak: false }));
  doc.y += 11;
  for (const a of j.arudhas) {
    const y = doc.y;
    doc.moveTo(PAGE.m, y - 2).lineTo(PAGE.w - PAGE.m, y - 2).lineWidth(0.3).strokeColor(RULE).stroke();
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(a.label === "AL" || a.label === "UL" ? VERMILION : INK).text(`${a.label}${a.corrected ? "*" : ""}`, ac[0], y, { lineBreak: false });
    doc.font("Helvetica").fontSize(8).fillColor(INK).text(a.sign, ac[1], y, { lineBreak: false });
    doc.fillColor(MUTED).text(`${ORD(a.house)} ${SIGN_ABBR[a.houseSign]}, ${a.lord} in ${SIGN_ABBR[a.lordSign]}`, ac[2], y, { lineBreak: false });
    doc.fillColor(INK).text(a.name, ac[3], y, { lineBreak: false });
    doc.y = y + 11;
  }
  doc.moveDown(0.4);

  // drishti / argala
  ensureSpace(doc, 70);
  sectionTitle(doc, "Rasi drishti and argala", "on the lagna, the Arudha lagna and the Upapada");
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(
    "Jaimini aspects are between signs, not planets, and there is no universal 7th aspect: a movable sign sees the fixed signs except the adjacent one (its 5th, 8th and 11th), a fixed sign sees the movable signs except the one before it (its 3rd, 6th and 9th), and the dual signs see one another (4th, 7th, 10th). A planet inherits the aspects of its sign. Argala is positional intervention from the 2nd, 4th and 11th (5th weakly), obstructed from the 12th, 10th and 3rd (9th).",
    PAGE.m,
    doc.y,
    { width: CONTENT_W },
  );
  doc.moveDown(0.5);
  for (const g of j.argala) {
    const inf = influencesOn(g.sign, positions);
    const lines = [
      `${g.target} ${SIGNS[g.sign]}: occupied by ${inf.occupants.length ? inf.occupants.join(", ") : "no planet"}; aspected by ${inf.aspecting.length ? inf.aspecting.join(", ") : "no planet"}.`,
      ...g.items.map((it) => `  ${ORD(it.house)}${it.kind === "secondary" ? " (secondary)" : ""} argala: ${it.planets.join(", ")}${it.obstructedBy.length ? ` · ${ORD(it.obstructingHouse)} ${it.obstructedBy.join(", ")} ${it.obstructed ? (it.obstructedBy.length === 1 ? "obstructs" : "obstruct") : it.obstructedBy.length === 1 ? "resists" : "resist"}` : ""}`),
    ];
    if (!g.items.length) lines.push("  No argala.");
    doc.font("Helvetica").fontSize(8);
    ensureSpace(doc, doc.heightOfString(lines.join("\n"), { width: CONTENT_W }) + 6);
    doc.fillColor(INK).text(lines[0], PAGE.m, doc.y, { width: CONTENT_W });
    doc.fillColor(MUTED).text(lines.slice(1).join("\n"), PAGE.m, doc.y, { width: CONTENT_W });
    doc.moveDown(0.3);
  }

  // chara dasha
  ensureSpace(doc, 320);
  sectionTitle(doc, "Chara dasha (K.N. Rao)", `from ${j.lagna.sign}, ${j.charaDasha.direction} (9th house ${SIGNS[j.charaDasha.ninthSign]})`);
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(
    "Years are the count from a sign to its lord less one, savya signs forward and apasavya backward; a lord in its own sign gives twelve. No exaltation or debilitation adjustment. Antardashas are twelve equal parts, starting from the next sign in the dasha sign's direction.",
    PAGE.m,
    doc.y,
    { width: CONTENT_W },
  );
  doc.moveDown(0.6);
  const current = j.charaDasha.periods.find((p) => nowDt >= DateTime.fromISO(p.start) && nowDt < DateTime.fromISO(p.end));
  const dc = [PAGE.m, PAGE.m + 40, PAGE.m + 110, PAGE.m + 150, PAGE.m + 260];
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
  ["Age", "Sign", "Years", "Period", "Lord and count"].forEach((h, i) => doc.text(h, dc[i], doc.y, { lineBreak: false }));
  doc.y += 12;
  const drawRow = (p: CharaDashaPeriod) => {
    const isCur = p === current;
    const start = DateTime.fromISO(p.start);
    const end = DateTime.fromISO(p.end);
    const note = `${p.lord} in ${SIGNS[p.lordSign]}, ${SAVYA.has(p.sign) ? "forward" : "backward"}${p.note ? ` · ${p.note}` : ""}`;
    doc.font("Helvetica").fontSize(7.5);
    const hNote = doc.heightOfString(note, { width: CONTENT_W - 260 });
    const h = Math.max(13, hNote + 3);
    ensureSpace(doc, h + (isCur ? 80 : 0));
    const y = doc.y;
    if (isCur) doc.rect(PAGE.m - 4, y - 3, CONTENT_W + 8, h).fillColor("#f3e4dc").fill();
    doc.moveTo(PAGE.m, y - 3).lineTo(PAGE.w - PAGE.m, y - 3).lineWidth(0.3).strokeColor(RULE).stroke();
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(p.ageStart === 0 && p.cycle === 1 ? "Birth" : `${p.ageStart}`, dc[0], y, { lineBreak: false });
    doc.font(isCur ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(INK).text(p.signName, dc[1], y, { lineBreak: false });
    doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(`${p.years}`, dc[2], y, { lineBreak: false });
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`${start.toFormat("d LLL yyyy")} – ${end.toFormat("d LLL yyyy")}`, dc[3], y, { width: 108, lineBreak: false });
    doc.text(note, dc[4], y, { width: CONTENT_W - 260 });
    doc.y = y + h;
    if (isCur) {
      // antardashas of the running dasha
      doc.font("Helvetica").fontSize(7).fillColor(MUTED).text(`Antardashas of ${p.signName}, ${SAVYA.has(p.sign) ? "forward" : "backward"} from the next sign:`, dc[1], doc.y + 1, { width: CONTENT_W - 40 });
      const cols = 3;
      const cw = (CONTENT_W - 40) / cols;
      const y0 = doc.y + 2;
      p.antardashas.forEach((a, i) => {
        const s = DateTime.fromISO(a.start);
        const e = DateTime.fromISO(a.end);
        const cur = nowDt >= s && nowDt < e;
        const cx = dc[1] + (i % cols) * cw;
        const cy = y0 + Math.floor(i / cols) * 10;
        doc.font(cur ? "Helvetica-Bold" : "Helvetica").fontSize(7).fillColor(cur ? VERMILION : INK).text(a.signName, cx, cy, { lineBreak: false });
        doc.font("Helvetica").fontSize(7).fillColor(MUTED).text(`${s.toFormat("LLL yyyy")} – ${e.toFormat("LLL yyyy")}`, cx + 50, cy, { lineBreak: false });
      });
      doc.y = y0 + Math.ceil(p.antardashas.length / cols) * 10 + 6;
    }
  };
  for (const p of j.charaDasha.periods.filter((p) => p.cycle === 1)) drawRow(p);
  const second = j.charaDasha.periods.filter((p) => p.cycle === 2 && p.ageStart < 100);
  if (second.length) {
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("Second cycle (same years)", PAGE.m, doc.y);
    doc.y += 4;
    for (const p of second) drawRow(p);
  }

  // life areas (Rao: the running dasha sign as a temporary lagna)
  jaiminiAreasSection(doc, result);

  // findings
  ensureSpace(doc, 80);
  sectionTitle(doc, "What the sutras say", `${j.findings.length} findings · Karakamsa rules read in the navamsa, pada rules in the rasi`);
  const groups = new Map<string, typeof j.findings>();
  for (const f of j.findings) groups.set(f.group, [...(groups.get(f.group) ?? []), f]);
  for (const [g, items] of Array.from(groups.entries())) {
    ensureSpace(doc, 40);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INDIGO).text(JAIMINI_GROUP_LABEL[g as keyof typeof JAIMINI_GROUP_LABEL], PAGE.m, doc.y + 4);
    doc.y += 2;
    for (const f of items) {
      doc.font("Helvetica").fontSize(8.5);
      const meta = `${f.planets.length ? f.planets.join(", ") + " · " : ""}${f.chart} · ${f.source.label} · ${f.source.url}`;
      const h = doc.heightOfString(f.text, { width: CONTENT_W - 10 }) + doc.heightOfString(meta, { width: CONTENT_W - 10 }) + 8;
      ensureSpace(doc, h);
      const y = doc.y;
      scoreDots(doc, PAGE.m, y + 3, f.weight);
      doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(f.text, PAGE.m + 22, y, { width: CONTENT_W - 22 });
      doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(meta, PAGE.m + 22, doc.y + 1, { width: CONTENT_W - 22, link: f.source.url });
      doc.y += 5;
    }
  }
  if (!j.findings.length) doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text("No rule in the current set fires for this chart.", PAGE.m, doc.y);

  // span of life (Jaimini 2.1), a classification, not a forecast
  ensureSpace(doc, 110);
  sectionTitle(doc, "Span of life (Ayurdaya)", "a classical classification, Jaimini Sutras 2.1.1-14 · not a forecast");
  doc.font("Helvetica").fontSize(8.5).fillColor(INK);
  for (const p of j.ayur.pairs) {
    const a = `${p.a.planet ? p.a.planet + " in " : ""}${p.a.sign} (${p.a.nature})`;
    const b = `${p.b.planet ? p.b.planet + " in " : ""}${p.b.sign} (${p.b.nature})`;
    const rowY = doc.y;
    doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(`${p.label} (${p.sutra}): ${a} and ${b}`, PAGE.m, rowY, { width: CONTENT_W - 120, lineBreak: false });
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(AYUR_TERM_LABEL[p.term], PAGE.m + CONTENT_W - 115, rowY, { width: 115, lineBreak: false });
    doc.y = rowY + 12;
  }
  doc.y += 2;
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(`${AYUR_TERM_LABEL[j.ayur.term]}, ${j.ayur.range} in the classical scheme.`, PAGE.m, doc.y, { width: CONTENT_W });
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`Decided by: ${j.ayur.decidedBy}.${j.ayur.adjustments.length ? " " + j.ayur.adjustments.map((a) => a.text).join(" ") : ""}`, PAGE.m, doc.y + 1, { width: CONTENT_W });
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("The brackets are wide and the tradition disputes the pair table; no chart reading stands in for medical care. Text: https://archive.org/details/in.ernet.dli.2015.134405", PAGE.m, doc.y + 1, { width: CONTENT_W });
}

function jaiminiAreasSection(doc: Doc, result: ChartResult) {
  const areas = readAreas(result.jaimini, result.positions);
  const nowIso = result.now.asOf;
  const now = DateTime.fromISO(nowIso);
  const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
  const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
  ensureSpace(doc, 120);
  sectionTitle(doc, "Life areas", "K.N. Rao: the running dasha sign read as the lagna");
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(
    `Each area rests on a chara karaka, its arudha pada and a house from the Karakamsa. For timing the running Chara dasha sign is treated as the lagna and the houses from it are read for the area; antardashas the same way. The transit check under each period is Rao's confirming step: Jupiter and Saturn on or aspecting the area's anchors (Jupiter 5/7/9, Saturn 3/7/10), best both at once. Rao also asks for confirmation against Vimshottari and the navamsa. ${RAO_SOURCE.url}`,
    PAGE.m,
    doc.y,
    { width: CONTENT_W, link: RAO_SOURCE.url },
  );
  doc.moveDown(0.6);
  const toneColor = (t: string) => (t === "support" ? "#3f6b55" : t === "strain" ? "#9b3a2a" : MUTED);
  const bullet = (text: string, tone: string, indent = 0) => {
    doc.font("Helvetica").fontSize(8);
    const h = doc.heightOfString(text, { width: CONTENT_W - 12 - indent }) + 2;
    ensureSpace(doc, h);
    const y = doc.y;
    doc.circle(PAGE.m + 3 + indent, y + 4, 1.6).fillColor(toneColor(tone)).fill();
    doc.fillColor(INK).text(text, PAGE.m + 12 + indent, y, { width: CONTENT_W - 12 - indent });
    doc.y += 2;
  };
  const transitLine = (targets: TransitTarget[], start: string, end: string, indent: number) => {
    const c = confirmTransits(targets, result.transits, start, end);
    doc.font("Helvetica").fontSize(7);
    const dbl = c.double.slice(0, 3).map((d) => `${d.target.label} ${fmt(d.start)} – ${fmt(d.end)} (Jupiter ${d.jupiter.relation === "in" ? "in" : "from"} ${SIGNS[d.jupiter.from]}, Saturn ${d.saturn.relation === "in" ? "in" : "from"} ${SIGNS[d.saturn.from]})`);
    const single = c.double.length ? [] : [...summarizeTouches(c.touches, "Jupiter"), ...summarizeTouches(c.touches, "Saturn")].slice(0, 2);
    const text = `Transit check: ${TRANSIT_GRADE_LABEL[c.grade]}${dbl.length ? `. Double transit on ${dbl.join("; ")}${c.double.length > 3 ? ` and ${c.double.length - 3} more` : ""}` : single.length ? `. ${single.join(". ")}` : ""}.`;
    const h = doc.heightOfString(text, { width: CONTENT_W - 12 - indent }) + 2;
    ensureSpace(doc, h);
    doc.fillColor(MUTED).text(text, PAGE.m + 12 + indent, doc.y, { width: CONTENT_W - 12 - indent });
    doc.y += 2;
  };
  for (const a of areas) {
    const spec = JAIMINI_AREAS[a.area];
    const cur = currentFor(a.timing, nowIso);
    ensureSpace(doc, 110);
    doc.moveDown(0.5);
    const y = doc.y;
    const balance = a.balance >= 2 ? "supported" : a.balance <= -2 ? "strained" : "mixed";
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(a.label, PAGE.m, y, { lineBreak: false });
    const labelW = doc.widthOfString(a.label);
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(balance, PAGE.m + labelW + 8, y + 2, { lineBreak: false });
    if (cur.period) {
      const status = isHot(cur.period.triggers) || cur.window ? "active" : "quiet";
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`now ${SIGNS[cur.period.sign]}${cur.window ? ` / ${SIGNS[cur.window.adSign]}` : ""} · ${status}`, PAGE.m, y + 2, { width: CONTENT_W, align: "right", lineBreak: false });
    }
    doc.y = y + 14;
    // foundations line
    const found: string[] = [
      ...a.karakas.map((k) => `${k.karaka} ${k.planet} in ${SIGNS[k.sign]} (${k.dignity.toLowerCase()}), ${ordinal(k.houseFromLagna)} house, D9 ${SIGNS[k.d9Sign]}`),
      ...a.padas.map((p) => `${p.label} ${SIGNS[p.sign]}${p.occupants.length ? ` with ${p.occupants.join(", ")}` : " (empty)"}${p.aspectedBy.length ? `, aspected by ${p.aspectedBy.join(", ")}` : ""}`),
      ...a.karakamsa.map((x) => `${ordinal(x.house)} from the Karakamsa: ${x.planets.join(", ")}`),
    ];
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(found.join(" · "), PAGE.m, doc.y, { width: CONTENT_W });
    doc.y += 3;
    const notes = [...a.karakas.flatMap((k) => k.notes), ...a.padas.flatMap((p) => p.notes)].slice(0, 5);
    for (const n of notes) bullet(n.text, n.tone);
    const findings = a.findingIds.map((id) => result.jaimini.findings.find((f) => f.id === id)!).filter(Boolean);
    for (const f of findings.slice(0, 3)) bullet(`${f.text} (${f.source.label})`, "neutral");
    // timing
    if (cur.period) {
      doc.y += 2;
      ensureSpace(doc, 48);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(INDIGO).text(`Now: ${SIGNS[cur.period.sign]} mahadasha, age ${cur.period.ageStart}–${cur.period.ageStart + cur.period.years}`, PAGE.m, doc.y);
      doc.y += 1;
      if (!cur.period.triggers.length) bullet(`Nothing in this period points at ${spec.short}.`, "neutral");
      for (const t of cur.period.triggers.slice(0, 4)) bullet(t.text, t.tone);
      transitLine([...a.anchors, { label: `${SIGNS[cur.period.sign]} (dasha sign)`, sign: cur.period.sign }], cur.period.start, cur.period.end, 0);
      if (cur.window) {
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MUTED).text(`${SIGNS[cur.window.adSign]} antardasha, ${fmt(cur.window.start)} – ${fmt(cur.window.end)}`, PAGE.m + 12, doc.y + 1);
        doc.y += 1;
        for (const t of cur.window.triggers.slice(0, 3)) bullet(t.text, t.tone, 12);
        transitLine([...a.anchors, { label: `${SIGNS[cur.window.adSign]} (antardasha sign)`, sign: cur.window.adSign }], cur.window.start, cur.window.end, 12);
      }
    }
    const upcoming = a.timing.periods
      .flatMap((p) => p.windows)
      .filter((w) => DateTime.fromISO(w.start) > now)
      .slice(0, 3);
    if (upcoming.length) {
      ensureSpace(doc, 48);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(INDIGO).text("Next antardashas that carry the area", PAGE.m, doc.y + 2);
      doc.y += 1;
      for (const w of upcoming) {
        bullet(`${SIGNS[w.mdSign]} / ${SIGNS[w.adSign]}, ${fmt(w.start)} – ${fmt(w.end)}: ${w.triggers.map((t) => t.text).join(" ")}`, w.triggers.some((t) => t.tone === "strain") && !w.triggers.some((t) => t.tone === "support") ? "strain" : w.triggers.some((t) => t.tone === "support") ? "support" : "neutral");
        transitLine([...a.anchors, { label: `${SIGNS[w.adSign]} (antardasha sign)`, sign: w.adSign }], w.start, w.end, 12);
      }
    }
  }
}

/** The five limbs of the birth day with their changes, then the transits from the natal Moon, each line cited to its verse. */
function panchangaSection(doc: Doc, result: ChartResult) {
  const day = result.panchanga;
  if (!day) return;
  const zone = result.chart.timezone;
  const local = (iso: string) => displayLocal(iso, result.timeBasis, zone);
  const t = (iso: string) => local(iso).toFormat("HH:mm");
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const runText = (run: LimbSegment[]) => run.map((s) => `${s.name}${s.detail ? ` (${s.detail})` : ""}${s.end ? ` ends ${t(s.end)}` : " past next sunrise"}`).join(" · ");

  doc.addPage();
  sectionTitle(doc, "Panchanga", `the five limbs of the birth day · Surya Siddhanta 1.36, 2.64-69 (tr. Burgess)`);
  doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(
    `${local(day.at).toFormat("d LLLL yyyy HH:mm")} at ${result.chart.place} (${result.timeBasis?.label ?? zone}). Sunrise ${t(day.sunrise)}, sunset ${t(day.sunset)}, next sunrise ${t(day.nextSunrise)}. Moon ${day.phase.waxing ? "waxing" : "waning"}, ${pct(day.phase.illumination)} lit. Ayanamsa ${day.ayanamsa.key} ${day.ayanamsa.value.toFixed(3)}°.`,
    PAGE.m,
    doc.y,
    { width: CONTENT_W },
  );
  doc.y += 6;

  const limbs: Array<{ limb: string; value: string; detail: string; run: LimbSegment[]; source: { label: string; url: string; provisional?: boolean } }> = [
    { limb: "Vara", value: day.vara.name, detail: `lord ${day.vara.lord}; from sunrise ${t(day.sunrise)} to ${t(day.nextSunrise)}`, run: [], source: PANCHANGA_SOURCES.day },
    { limb: "Tithi", value: `${day.tithi.paksha} ${day.tithi.name}`, detail: `${day.tithi.index} of 30, ${pct(day.tithi.elapsed)} elapsed`, run: day.runs.tithi, source: PANCHANGA_SOURCES.tithi },
    { limb: "Nakshatra", value: `${day.nakshatra.name} ${day.nakshatra.pada}`, detail: `lord ${day.nakshatra.lord}, ${pct(day.nakshatra.elapsed)} elapsed`, run: day.runs.nakshatra, source: PANCHANGA_SOURCES.nakshatra },
    { limb: "Yoga", value: day.yoga.name, detail: `${day.yoga.index + 1} of 27, ${pct(day.yoga.elapsed)} elapsed`, run: day.runs.yoga, source: PANCHANGA_SOURCES.yoga },
    { limb: "Karana", value: day.karana.name, detail: `${day.karana.fixed ? "fixed" : "movable"}, ${pct(day.karana.elapsed)} elapsed`, run: day.runs.karana, source: PANCHANGA_SOURCES.karana },
  ];
  const cols = [0, 0.14, 0.4].map((f) => PAGE.m + f * CONTENT_W);
  doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
  ["Limb", "At birth", "Through the day (sunrise to sunrise)"].forEach((h, i) => doc.text(h, cols[i], doc.y, { lineBreak: false }));
  doc.y += 12;
  doc.moveTo(PAGE.m, doc.y - 2).lineTo(PAGE.w - PAGE.m, doc.y - 2).lineWidth(0.5).strokeColor(RULE).stroke();
  for (const l of limbs) {
    const runW = CONTENT_W - (cols[2] - PAGE.m);
    const run = l.run.length ? runText(l.run) : l.detail;
    doc.font("Helvetica").fontSize(8);
    const h = Math.max(24, doc.heightOfString(run, { width: runW }) + 12);
    ensureSpace(doc, h + 4);
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(l.limb, cols[0], y, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(l.value, cols[1], y, { width: cols[2] - cols[1] - 6 });
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(l.run.length ? l.detail : "", cols[1], doc.y, { width: cols[2] - cols[1] - 6 });
    const leftEnd = doc.y;
    doc.font("Helvetica").fontSize(8).fillColor(INK).text(run, cols[2], y, { width: runW });
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(`${l.source.label}${l.source.provisional ? " · provisional" : ""}${l.limb === "Vara" ? ` · lord: ${PANCHANGA_SOURCES.varaLords.label}, provisional` : ""}`, cols[2], doc.y + 1, { width: runW, link: l.source.url });
    doc.y = Math.max(doc.y, leftEnd) + 5;
    doc.moveTo(PAGE.m, doc.y - 3).lineTo(PAGE.w - PAGE.m, doc.y - 3).lineWidth(0.3).strokeColor(RULE).stroke();
  }
  doc.y += 2;
  doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(`Surya Siddhanta: ${SURYA_SIDDHANTA_URL}`, PAGE.m, doc.y, { width: CONTENT_W, link: SURYA_SIDDHANTA_URL });
  for (const c of PANCHANGA_CAVEATS) {
    ensureSpace(doc, 20);
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(`• ${c}`, PAGE.m, doc.y + 1, { width: CONTENT_W });
  }

  // gochara
  const moon = result.positions.find((p) => p.planet === "Moon")!;
  const g = computeGochara(moon.signIndex, result.now.positions, result.now.asOf);
  ensureSpace(doc, 120);
  sectionTitle(doc, "Gochara from the natal Moon", `Brihat Samhita 104 · Phaladeepika 26 · planets as of ${DateTime.fromISO(result.now.asOf).setZone(zone).toFormat("d LLL yyyy HH:mm")}`);
  doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(
    `Natal Moon in ${SIGNS[moon.signIndex]}. Each planet's sign is counted as a house from it (Phaladeepika 26.1). Favourable houses per Brihat Samhita 104.4 and Phaladeepika 26.2; vedha per 26.3-8; dignity per 26.31-32 and Brihat Samhita 104.53, 55; danger houses per 26.33-34. Verdicts: favourable, obstructed (favourable house under vedha), unfavourable, neutral (dignity cancels the house). Not Parashari.`,
    PAGE.m,
    doc.y,
    { width: CONTENT_W },
  );
  doc.y += 6;
  for (const r of g.rows) {
    const lines: Array<{ text: string; muted?: boolean; url?: string }> = [];
    if (r.effect.bs) lines.push({ text: `${r.effect.bs.source.label}: ${r.effect.bs.text}` });
    if (r.effect.pd) lines.push({ text: `${r.effect.pd.source.label}${r.effect.pd.source.provisional ? " (provisional)" : ""}: ${r.effect.pd.text}` });
    const meta = [
      `${r.favourable ? "favourable" : "not favourable"} house (${r.favourableSources.map((s) => s.label + (s.provisional ? ", provisional" : "")).join("; ")})`,
      r.favourable ? `vedha point ${ORD(r.vedhaPoint!)}${r.vedhaBy.length ? `, occupied by ${r.vedhaBy.join(", ")}` : ", clear"} (${r.vedhaSource.label}${r.vedhaSource.provisional ? ", provisional" : ""})` : "",
      `felt in: ${r.portion.bs ? `BS ${r.portion.bs}; ` : ""}PD ${r.portion.pd}`,
    ].filter(Boolean).join(" · ");
    lines.push({ text: meta, muted: true });
    if (r.dignityNote) lines.push({ text: `${r.dignityNote.text} (${r.dignityNote.sources.map((s) => s.label).join(", ")})` });
    if (r.danger) lines.push({ text: `${r.danger.text} (${r.danger.source.label})` });
    doc.font("Helvetica").fontSize(8);
    const h = 14 + lines.reduce((a, l) => a + doc.heightOfString(l.text, { width: CONTENT_W - 12 }) + 2, 0) + 6;
    ensureSpace(doc, h);
    const y = doc.y;
    const head = `${r.planet}${r.retrograde && CLASSICAL.has(r.planet) ? " R" : ""}`;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(planetColor(r.planet)).text(head, PAGE.m, y, { lineBreak: false });
    doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(`${SIGNS[r.signIndex]} ${r.degInSign.toFixed(1)}° · ${ORD(r.house)} from the Moon`, PAGE.m + 70, y, { lineBreak: false });
    const verdictColor = r.verdict === "favourable" ? INDIGO : r.verdict === "unfavourable" ? VERMILION : MUTED;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(verdictColor).text(r.verdict, PAGE.m, y, { width: CONTENT_W, align: "right", lineBreak: false });
    doc.y = y + 13;
    for (const l of lines) {
      doc.font("Helvetica").fontSize(l.muted ? 6.5 : 8).fillColor(l.muted ? MUTED : INK).text(l.text, PAGE.m + 12, doc.y, { width: CONTENT_W - 12 });
      doc.y += 2;
    }
    doc.y += 4;
    doc.moveTo(PAGE.m, doc.y - 2).lineTo(PAGE.w - PAGE.m, doc.y - 2).lineWidth(0.3).strokeColor(RULE).stroke();
  }
  doc.y += 2;
  doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(`Brihat Samhita ch. 104 (tr. Iyer, 1884): ${BS_URL}`, PAGE.m, doc.y, { width: CONTENT_W, link: BS_URL });
  doc.text(`Phaladeepika ch. 26 (tr. Sastri, 1937): ${PD_URL}`, PAGE.m, doc.y + 1, { width: CONTENT_W, link: PD_URL });
  for (const c of GOCHARA_CAVEATS) {
    ensureSpace(doc, 20);
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(`• ${c}`, PAGE.m, doc.y + 1, { width: CONTENT_W });
  }

  // calendar: the slow movers over the next five years, plus Saturn's 12th-1st-2nd passage
  const jd0 = Math.floor(nowJd() - 0.5) + 0.5;
  const cal = gocharaCalendar(moon.signIndex, jd0, jd0 + 5 * 365.25, { ayanamsa: result.chart.ayanamsa, nodeType: result.chart.nodeType === "true" ? "true" : "mean" });
  const d = (iso: string) => DateTime.fromISO(iso).setZone(zone).toFormat("d LLL yyyy");
  const av = computeAshtakavarga(result.positions, Math.floor((((result.jaimini.lagna.lon % 360) + 360) % 360) / 30));
  const avText = (planet: Planet, signIndex: number) => avMarkText(gocharaAvMark(av, planet, signIndex));
  ensureSpace(doc, 120);
  sectionTitle(doc, "Gochara calendar", `Slow movers from the Moon, solar months · ${d(cal.from)} to ${d(cal.to)} · Ashtakavarga marks (BPHS 66.70-72, 70.19-20, 72.3-29)`);
  if (cal.saturnPassages.length) {
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INDIGO).text("Saturn over the 12th, 1st and 2nd from the Moon (BS 104.44-45; PD 26.23; the name sade sati is not in either text)", PAGE.m, doc.y, { width: CONTENT_W });
    doc.y += 2;
    for (const p of cal.saturnPassages) {
      ensureSpace(doc, 14);
      const y = doc.y;
      const psign = (cal.moonSignIndex + p.house - 1) % 12;
      doc.font("Helvetica").fontSize(8).fillColor(INK).text(`${ORD(p.house)} from the Moon · ${SIGNS[psign]}`, PAGE.m, y, { lineBreak: false });
      doc.fillColor(MUTED).text(`Ashtakavarga ${avText("Saturn", psign)}`, PAGE.m + 0.42 * CONTENT_W, y, { lineBreak: false });
      doc.fillColor(MUTED).text(`${d(p.start)} – ${d(p.end)}`, PAGE.m, y, { width: CONTENT_W, align: "right", lineBreak: false });
      doc.y = y + 12;
    }
    doc.y += 4;
  }
  // solar months of the first year: 70.19-20 fitness for functions and the 72.11-29 month reading
  const sunSegs = cal.planets.find((q) => q.planet === "Sun")?.segments ?? [];
  const months: { start: string; end: string; signIndex: number }[] = [];
  for (const s of sunSegs) {
    const last = months[months.length - 1];
    if (last && last.signIndex === s.signIndex && last.end === s.start) last.end = s.end;
    else months.push({ start: s.start, end: s.end, signIndex: s.signIndex });
  }
  const yearEnd = DateTime.fromISO(cal.from).plus({ years: 1 }).toMillis();
  const firstYear = months.filter((m) => DateTime.fromISO(m.start).toMillis() < yearEnd);
  if (firstYear.length) {
    ensureSpace(doc, 60);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INDIGO).text("Solar months by Ashtakavarga, first year (BPHS 70.19-20; 72.11-29)", PAGE.m, doc.y + 2, { width: CONTENT_W });
    const mcols = [0, 0.14, 0.28, 0.41, 0.55].map((f) => PAGE.m + f * CONTENT_W);
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED);
    const mhy = doc.y + 1;
    ["From", "To", "Sun in", "Functions (Sun's chart)", "Month (aggregate)"].forEach((h, i) => doc.text(h, mcols[i], mhy, { lineBreak: false }));
    doc.y = mhy + 10;
    doc.moveTo(PAGE.m, doc.y - 2).lineTo(PAGE.w - PAGE.m, doc.y - 2).lineWidth(0.4).strokeColor(RULE).stroke();
    for (const m of firstYear) {
      const r = solarMonthReading(av, m.signIndex);
      const mtext = `${r.sarva} · ${r.effect}${r.remedy ? ` · remedy: ${r.remedy}` : ""}`;
      doc.font("Helvetica").fontSize(7.5);
      const h = Math.max(11, doc.heightOfString(mtext, { width: CONTENT_W - (mcols[4] - PAGE.m) }) + 3);
      ensureSpace(doc, h);
      const y = doc.y;
      doc.fillColor(INK).text(d(m.start), mcols[0], y, { lineBreak: false });
      doc.text(d(m.end), mcols[1], y, { lineBreak: false });
      doc.text(SIGNS[m.signIndex], mcols[2], y, { lineBreak: false });
      const fc = r.functions === "fit" ? INDIGO : r.functions === "unfit" ? VERMILION : MUTED;
      doc.fillColor(fc).text(`${r.functions} · ${r.sunRekhas} of 8`, mcols[3], y, { lineBreak: false });
      doc.fillColor(r.sarva > 30 ? INDIGO : r.sarva < 25 ? VERMILION : MUTED).text(mtext, mcols[4], y, { width: CONTENT_W - (mcols[4] - PAGE.m) });
      doc.y = y + h;
    }
    doc.y += 4;
  }
  const ccols = [0, 0.14, 0.28, 0.41, 0.49, 0.66].map((f) => PAGE.m + f * CONTENT_W);
  for (const planet of ["Jupiter", "Saturn", "Rahu", "Ketu"] as const) {
    const pc = cal.planets.find((q) => q.planet === planet);
    if (!pc) continue;
    ensureSpace(doc, 40);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(planetColor(planet)).text(planet, PAGE.m, doc.y + 2);
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED);
    const hy = doc.y + 1;
    ["From", "To", "Sign", "House", "Ashtakavarga", "Verdict · why"].forEach((h, i) => doc.text(h, ccols[i], hy, { lineBreak: false }));
    doc.y = hy + 10;
    doc.moveTo(PAGE.m, doc.y - 2).lineTo(PAGE.w - PAGE.m, doc.y - 2).lineWidth(0.4).strokeColor(RULE).stroke();
    for (const s of pc.segments) {
      const why = [s.vedhaBy.length ? `vedha by ${s.vedhaBy.join(", ")}` : "", s.note ? s.note.replace(/ \((26\.3[12]|26\.32; BS 104\.53)\)\.?/g, "").replace(/\.\s*$/, "") : s.combust ? "combust for part of the stretch" : "", s.danger ? (s.danger === "33" ? "danger house, 26.33" : "worst house, 26.34") : ""].filter(Boolean).join(" · ");
      doc.font("Helvetica").fontSize(7.5);
      const text = `${s.verdict}${why ? ` · ${why}` : ""}`;
      const h = Math.max(11, doc.heightOfString(text, { width: CONTENT_W - (ccols[5] - PAGE.m) }) + 3);
      ensureSpace(doc, h);
      const y = doc.y;
      doc.fillColor(INK).text(d(s.start), ccols[0], y, { lineBreak: false });
      doc.text(d(s.end), ccols[1], y, { lineBreak: false });
      doc.text(SIGNS[s.signIndex], ccols[2], y, { lineBreak: false });
      doc.text(ORD(s.house), ccols[3], y, { lineBreak: false });
      doc.fillColor(MUTED).text(avText(planet, s.signIndex), ccols[4], y, { lineBreak: false });
      const vc = s.verdict === "favourable" ? INDIGO : s.verdict === "unfavourable" ? VERMILION : MUTED;
      doc.fillColor(vc).text(text, ccols[5], y, { width: CONTENT_W - (ccols[5] - PAGE.m) });
      doc.y = y + h;
    }
    doc.y += 4;
  }
  for (const c of [...cal.notes, ...GOCHARA_AV_NOTES, ...SOLAR_MONTH_NOTES]) {
    ensureSpace(doc, 20);
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED).text(`• ${c}`, PAGE.m, doc.y + 1, { width: CONTENT_W });
  }
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
  JEEVA = reading.roles.native;
  const birthLocal = displayLocal(result.utc, result.timeBasis, chart.timezone);
  const birthStr = birthLocal.toFormat("d LLLL yyyy, HH:mm");

  // ── Header ──
  doc.font("Times-Bold").fontSize(22).fillColor(INK).text(chart.name, PAGE.m, PAGE.m);
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(`${birthStr} · ${chart.place}`);
  doc.fontSize(8).text(`Ayanamsa ${chart.ayanamsa} ${result.ayanamsaValue.toFixed(3)}°  ·  ${chart.nodeType} node  ·  ${chart.timezone}${result.timeBasis ? ` (${result.timeBasis.label})` : ""}  ·  ${chart.latitude.toFixed(3)}°, ${chart.longitude.toFixed(3)}°`);
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
  doc.text(`${PLANET_ABBR[reading.roles.native]} Jeeva · Sa Karma${reading.roles.deha !== reading.roles.native ? ` · ${PLANET_ABBR[reading.roles.deha]} Deha (female chart)` : ""} · R retrograde · c combust (Sun's pada) · w leads an enemy by degree · struck dignity set aside by a Nadi rule · tJu tSa transits as of ${DateTime.fromISO(now.asOf).toFormat("d LLL yyyy")}`, PAGE.m, chartY + chartSize + 6, { width: chartSize });
  doc.y = Math.max(chartY + chartSize + 36, tableEnd + 6);

  // ── Karakas ──
  sectionTitle(doc, "Jeeva and Karma");
  const karakaBlocks: Array<readonly [string, typeof reading.jeeva, Planet]> = [
    [`${reading.roles.native} · Jeeva karaka · the native${reading.roles.gender === "female" ? " at the subtle level (female chart)" : ""}`, reading.jeeva, reading.roles.native],
    ["Saturn · Karma karaka · the profession", reading.karma, "Saturn"],
  ];
  if (reading.deha) karakaBlocks.push([`${reading.roles.deha} · Deha karaka · the native herself (female chart: Venus is her person, Mars the husband)`, reading.deha, reading.roles.deha]);
  for (const [label, data, planet] of karakaBlocks) {
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
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(`${genderNote}: ${m.native} is the native${m.gender === "female" ? " as a person (Deha)" : ""}, ${m.spouse} the ${spouseWord}; no house lords, the karakas are read against each other.`, { width: CONTENT_W });
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
  {
    const c = reading.children;
    const win = nextChildWindow(c, transits, now.asOf.slice(0, 10), result.utc);
    const counted = c.inFifth.length + c.aspectingFifth.length;
    ensureSpace(doc, 60);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(planetColor("Jupiter")).text(`Jupiter · Putra karaka · children`);
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(`No 5th lord: promise from Jupiter's link with Venus; count and sex from the planets in and aspecting the 5th from Jupiter (${c.karakaSign} to ${c.fifthSign}).`, { width: CONTENT_W });
    const label = { strong: "Promised, strong", moderate: "Promised, moderate", weak: "Promised, lesser strength", faint: "Faint signature", unsigned: "No Venus signature" }[c.promised];
    doc.font("Helvetica").fontSize(9).fillColor(INK).text(`${label}. ${c.headline}`, { width: CONTENT_W });
    if (counted > 0) {
      doc.text(
        `Count from the 5th: ${counted} planet${counted === 1 ? "" : "s"}, giving ${c.sons} son${c.sons === 1 ? "" : "s"}, ${c.daughters} daughter${c.daughters === 1 ? "" : "s"}${c.undecided.filter((p) => p === "Rahu" || p === "Ketu").length ? `, ${c.undecided.filter((p) => p === "Rahu" || p === "Ketu").join(" and ")} left open` : ""}${c.undecided.filter((p) => p === "Mercury" || p === "Saturn").length ? ` (${c.undecided.filter((p) => p === "Mercury" || p === "Saturn").join(", ")} by sign parity)` : ""}. An upper bound, not a promise.`,
        { width: CONTENT_W },
      );
    }
    for (const n of c.notes) doc.text(`• ${n}`, PAGE.m + 8, doc.y + 1, { width: CONTENT_W - 8 });
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(
      `Triggers: Jupiter's return over ${c.karakaSign}, or his passage over ${c.fifthSign} and its trines.${win ? ` Next (from age 18): Jupiter ${win.kind === "return" ? "returns to" : win.kind === "fifth" ? "over the 5th," : "in trine,"} ${win.period.sign}, ${DateTime.fromISO(win.period.start).toFormat("LLL yyyy")} – ${DateTime.fromISO(win.period.end).toFormat("LLL yyyy")}.` : ""}`,
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
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text("Degree order by direction", PAGE.m, doc.y, { width: CONTENT_W });
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text("The three signs of a trine are one direction, read as one combination in degree order: the planet ahead hands its matters to the one behind (Rao, rule 1). A shared pada is the tightest bond; across signs, planets within a degree stand at the same degree. Direct planets move to higher degrees, retrograde ones and the nodes to lower, so closing pairs bind more strongly.", PAGE.m, doc.y + 1, { width: CONTENT_W });
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

  // ── Houses from the Jeeva karaka and from Saturn ──
  for (const karaka of Array.from(new Set<Planet>([reading.roles.native, reading.roles.deha, "Saturn"]))) {
    const houses = housesFrom(positions, karaka).filter((h) => h.planets.length || h.viaRetro.length || h.house === 1);
    const stayPut = retroNotes(positions, karaka);
    ensureSpace(doc, 40);
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(`Houses from ${karaka}`, PAGE.m, doc.y, { width: CONTENT_W });
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`Whole signs counted from ${karaka}'s rashi as the 1st; no ascendant is used. Only occupied houses are listed.`, PAGE.m, doc.y + 1, { width: CONTENT_W });
    for (const h of houses) {
      const planets = h.house === 1 ? [karaka, ...h.planets] : h.planets;
      const text = `${h.house}. ${h.sign} (${HOUSE_CLASS_LABEL[h.cls]}): ${planets.length ? planets.join(", ") : "empty"}${h.viaRetro.length ? ` (+ ${h.viaRetro.join(", ")} by retrogression, half strength)` : ""}. ${h.meaning}`;
      doc.font("Helvetica").fontSize(8.5);
      const hh = doc.heightOfString(text, { width: CONTENT_W }) + 3;
      ensureSpace(doc, hh);
      doc.fillColor(INK).text(text, PAGE.m, doc.y + 2, { width: CONTENT_W });
    }
    if (stayPut.length) {
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(stayPut.map((n) => `${n.planet} is retrograde but stays in house ${n.house}: ${n.reason}.`).join(" "), PAGE.m, doc.y + 2, { width: CONTENT_W });
    }
  }
  doc.moveDown(0.3);

  // ── Reading ──
  sectionTitle(doc, "Reading", `${reading.findings.length} findings from ${reading.findings.length ? "the rule book" : "no rules"}`);
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text("Each area opens with the balance of what the Nadi rules say and the signatures that carry it; the working follows, strongest first. A finding marked with a dagger is already said within a larger combination above it.", PAGE.m, doc.y, { width: CONTENT_W });
  doc.moveDown(0.5);
  for (const s of synthesize(reading, reading.roles.gender as Gender)) {
    const area = s.area;
    const items = [...s.key, ...s.rest];
    ensureSpace(doc, 70);
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK).text(LIFE_AREAS[area].label, PAGE.m, doc.y);
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(`${AREA_TONE_LABEL[s.tone]} · karaka ${areaKarakaLabel(area, reading.roles.gender)}`, PAGE.m, doc.y - 11, { width: CONTENT_W, align: "right" });
    doc.y += 4;
    doc.font("Helvetica").fontSize(9.5).fillColor(INK).text(s.headline, PAGE.m, doc.y, { width: CONTENT_W });
    if (s.reconciliation) doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(s.reconciliation, PAGE.m, doc.y + 1, { width: CONTENT_W });
    doc.y += 6;
    for (const f of items) {
      const covered = s.coveredBy[f.ruleId];
      const textX = PAGE.m + 24;
      const textW = CONTENT_W - 24;
      doc.font("Helvetica").fontSize(9);
      const h = doc.heightOfString(f.text, { width: textW }) + 12;
      ensureSpace(doc, h + 6);
      const y = doc.y;
      scoreDots(doc, PAGE.m + 3, y + 5, f.score);
      doc.fillColor(covered ? MUTED : INK).text(`${covered ? "† " : ""}${f.text}`, textX, y, { width: textW });
      const flow = f.flow ? `${f.flow.from} ahead > ${f.flow.to}${f.flow.tier !== "sign" ? ` (${tierLabel(f.flow.tier)})` : ""}${f.flow.approach === "closing" ? " closing" : ""}` : null;
      const house = f.house ? `in the ${f.house}${f.house === 1 ? "st" : f.house === 2 ? "nd" : f.house === 3 ? "rd" : "th"} from ${f.planets[0]}` : null;
      const meta = [f.planets.join(" · "), f.relation ? RELATION_LABEL[f.relation] : null, house, flow, f.viaRetro ? "via retrogression" : null, f.modifier ?? null, f.source ?? null].filter(Boolean).join(" — ");
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
  const timing = readTransits(transits, positions, reading.findings, result.utc, reading.roles);

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

  // ── Jaimini (separate system) ──
  jaiminiSection(doc, result);

  // ── Panchanga and gochara (Surya Siddhanta; Brihat Samhita 104, Phaladeepika 26) ──
  panchangaSection(doc, result);

  // ── Glossary ──
  doc.addPage();
  sectionTitle(doc, "Glossary", "the terms this reading leans on, in plain language");
  for (const g of Object.values(GLOSSARY).filter((g) => g.system !== "alp" && g.system !== "kp" && g.system !== "parashari")) {
    doc.font("Helvetica").fontSize(8.5);
    const h = doc.heightOfString(`${g.term}. ${g.short}`, { width: CONTENT_W }) + 4;
    ensureSpace(doc, h);
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(`${g.term}.`, PAGE.m, y, { continued: true, width: CONTENT_W });
    doc.font("Helvetica").fillColor(MUTED).text(` ${g.short}`, { width: CONTENT_W });
    doc.y += 3;
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
    "Positions from the Swiss Ephemeris (Astrodienst). Nadi text follows the general principles of Bhrigu Nandi Nadi as taught by R.G. Rao and Satyanarayana Naik; Jaimini text follows the Jaimini Sutras and BPHS chapter 30, with Chara dasha by K.N. Rao's method. Panchanga follows the Surya Siddhanta (tr. Burgess); gochara follows Brihat Samhita ch. 104 (tr. Iyer) and Phaladeepika ch. 26 (tr. Sastri). All are starting sets of rules meant to be extended, not a verdict.",
    PAGE.m,
    PAGE.h - PAGE.m - 14,
    { width: CONTENT_W },
  );
  doc.end();
  return doc;
}
