// Generic PDF renderer for the report model (shared/report). It walks ReportDoc sections and
// paragraphs and knows nothing about any astrological system: headings, lead and body text,
// asides, tables, provisional marks, tone colour, and numbered notes with their URLs at the end.
import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ChartResult } from "@shared/schema";
import type { ReportDoc, ReportPara, ReportSection } from "@shared/report";
import { displayLocal } from "@shared/time-basis";
import { PLANET_ABBR } from "@shared/astro";
import { translate } from "@shared/localization";
import { isDeceased } from "@shared/life-stage";
import {
  CONTENT_W,
  INK,
  MUTED,
  PAGE,
  RULE,
  VERMILION,
  INDIGO,
  drawSouthIndianChart,
} from "./pdf";

type Doc = InstanceType<typeof PDFDocument>;

const GREEN = "#3d6b4a";
const BOTTOM = PAGE.h - PAGE.m - 24;

/** PDF glyph reordering is visual; ActualText keeps Malayalam searchable and copyable. */
function actualText(doc: Doc, text: string, draw: () => void) {
  const marked = /[\u0d00-\u0d7f]/.test(text);
  if (marked) doc.markContent("Span", { actual: text, lang: "ml" });
  try { draw(); } finally { if (marked) doc.endMarkedContent(); }
}

/** Keep marked content on a single page. Otherwise PDF readers can repeat the full ActualText
 * once for every page a long paragraph spans. Split at word boundaries and preserve the words. */
function paragraphText(doc: Doc, text: string, x: number, y: number, continued: boolean) {
  const width = CONTENT_W - 10;
  const opts = { width, lineGap: 1.5 };
  const draw = (piece: string, at: number, last: boolean) => actualText(doc, piece, () => doc.text(piece, x, at, { ...opts, continued: last && continued }));
  if (!/[\u0d00-\u0d7f]/.test(text) || doc.heightOfString(text, opts) <= BOTTOM - y - 4) {
    draw(text, y, true);
    return;
  }
  const words = text.match(/\S+\s*/g) ?? [text];
  let start = 0;
  doc.y = y;
  while (start < words.length) {
    if (BOTTOM - doc.y < 32) doc.addPage();
    const available = BOTTOM - doc.y - 5;
    let low = start + 1, high = words.length, end = start + 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const piece = words.slice(start, mid).join("").trimEnd();
      if (doc.heightOfString(piece, opts) <= available) { end = mid; low = mid + 1; }
      else high = mid - 1;
    }
    const piece = words.slice(start, end).join("").trimEnd();
    draw(piece, doc.y, end === words.length);
    start = end;
    if (start < words.length) doc.addPage();
  }
}

function ensureSpace(doc: Doc, needed: number) {
  if (doc.y + needed > BOTTOM) doc.addPage();
}

function sup(cites?: number[]): string {
  return cites?.length ? ` [${cites.join(", ")}]` : "";
}

function heading(doc: Doc, sec: ReportSection, level: number) {
  doc.x = PAGE.m;
  if (level === 0) {
    ensureSpace(doc, 70);
    doc.moveDown(1);
    const y = doc.y;
    if (sec.kicker) {
      actualText(doc, sec.kicker, () => doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(sec.kicker!.toUpperCase(), PAGE.m, y, { characterSpacing: 0.6 }));
    }
    actualText(doc, sec.title, () => doc
      .font("Times-Bold")
      .fontSize(16)
      .fillColor(INK)
      .text(sec.title, PAGE.m, sec.kicker ? doc.y + 1 : y));
    const ly = doc.y + 4;
    doc
      .moveTo(PAGE.m, ly)
      .lineTo(PAGE.w - PAGE.m, ly)
      .lineWidth(0.6)
      .strokeColor(RULE)
      .stroke();
    doc.y = ly + 10;
  } else {
    ensureSpace(doc, 48);
    doc.moveDown(0.7);
    // A section's own parts (level 2 and below) a step smaller than the parts of a chapter.
    actualText(doc, sec.title, () => doc
      .font("Times-Bold")
      .fontSize(level >= 2 ? 10.5 : 11.5)
      .fillColor(INK)
      .text(sec.title, PAGE.m));
    doc.y += level >= 2 ? 2 : 3;
  }
  doc.x = PAGE.m;
}

function para(doc: Doc, p: ReportPara) {
  doc.x = PAGE.m;
  if (p.kind === "table") return table(doc, p);
  const text = (p.text ?? "").trim();
  if (!text) return;
  const size = p.kind === "lead" ? 10.5 : p.kind === "note" ? 8.5 : 9.5;
  const font =
    p.kind === "lead"
      ? "Times-Roman"
      : p.kind === "note"
        ? "Helvetica-Oblique"
        : "Times-Roman";
  const color = p.kind === "note" ? MUTED : INK;
  doc.font(font).fontSize(size);
  const body = `${text}${sup(p.cites)}${p.provisional ? "  provisional" : ""}`;
  const h = doc.heightOfString(body, { width: CONTENT_W - 10, lineGap: 1.5 });
  ensureSpace(doc, Math.min(h, 120) + 8);
  const y0 = doc.y;
  // Tone bar in the margin: green support, vermilion strain, indigo mixed.
  if (p.tone) {
    const c =
      p.tone === "support" ? GREEN : p.tone === "strain" ? VERMILION : INDIGO;
    doc
      .rect(PAGE.m - 8, y0 + 1, 1.6, Math.min(h, BOTTOM - y0 - 2))
      .fillColor(c)
      .fill();
  }
  doc.font(font).fontSize(size).fillColor(color);
  if (p.provisional) {
    // Body first, then the provisional tag continued in small caps grey.
    paragraphText(doc, `${text}${sup(p.cites)} `, PAGE.m, y0, true);
    const tag = p.lang === "ml" ? translate("ml", "Provisional") : "PROVISIONAL";
    actualText(doc, tag, () => doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(VERMILION)
      .text(tag, { characterSpacing: 0.5 }));
  } else {
    paragraphText(doc, `${text}${sup(p.cites)}`, PAGE.m, y0, false);
  }
  if (p.aside) {
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
    ensureSpace(doc, 14);
    actualText(doc, p.aside, () => doc.text(p.aside!, PAGE.m, doc.y + 1, { width: CONTENT_W - 10 }));
  }
  doc.y += p.kind === "note" ? 4 : 6;
  doc.x = PAGE.m;
}

/** Measure columns before splitting a wide table. Long words may wrap within a column. */
function columnMetrics(
  doc: Doc,
  head: string[],
  rows: string[][],
  fontSize: number,
) {
  doc.font("Helvetica").fontSize(fontSize);
  const pad = 9;
  return head.map((h, i) => {
    let w = doc.widthOfString(h);
    let word = 0;
    for (const part of h.split(/\s+/))
      word = Math.max(word, doc.widthOfString(part));
    for (const r of rows) {
      const c = r[i] ?? "";
      w = Math.max(w, doc.widthOfString(c));
      for (const part of c.split(/\s+/))
        word = Math.max(word, doc.widthOfString(part));
    }
    const min = Math.min(Math.max(word, 18) + pad, CONTENT_W * 0.4);
    return {
      full: Math.max(min, Math.min(w, CONTENT_W * 0.5) + pad),
      min,
    };
  });
}

/** Keep the first column in each continuation, so each row remains identifiable. */
function columnGroups(metrics: ReturnType<typeof columnMetrics>): number[][] {
  if (!metrics.length) return [];
  const groups: number[][] = [];
  let group = [0], used = metrics[0].min;
  for (let i = 1; i < metrics.length; i++) {
    if (group.length > 1 && used + metrics[i].min > CONTENT_W) {
      groups.push(group);
      group = [0];
      used = metrics[0].min;
    }
    group.push(i);
    used += metrics[i].min;
  }
  groups.push(group);
  return groups;
}

function widths(metrics: ReturnType<typeof columnMetrics>): number[] {
  const minimum = metrics.reduce((sum, m) => sum + m.min, 0);
  if (minimum >= CONTENT_W) return metrics.map((m) => m.min * CONTENT_W / minimum);
  const extra = metrics.reduce((sum, m) => sum + m.full - m.min, 0);
  const remaining = CONTENT_W - minimum;
  return metrics.map((m) => m.min + remaining * (extra ? (m.full - m.min) / extra : 1 / metrics.length));
}

function table(doc: Doc, p: ReportPara) {
  const head = p.head ?? [];
  const rows = p.rows ?? [];
  if (!head.length || !rows.length) return;
  const dense = head.length > 8;
  const fs = dense ? 6.5 : head.length > 5 ? 7.5 : 8.5;
  const metrics = columnMetrics(doc, head, rows, fs);
  const groups = columnGroups(metrics);
  if (groups.length > 1) {
    groups.forEach((group, i) => table(doc, {
      ...p,
      head: group.map((index) => head[index]),
      rows: rows.map((row) => group.map((index) => row[index] ?? "")),
      ...(i < groups.length - 1 ? { text: undefined, cites: undefined } : {}),
    }));
    return;
  }
  const cols = widths(metrics);
  const pad = 3;
  const rowH = (cells: string[], bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(fs);
    let h = 0;
    cells.forEach((c, i) => {
      h = Math.max(
        h,
        doc.heightOfString(c || " ", { width: cols[i] - pad * 2 }),
      );
    });
    return h + pad * 2;
  };
  const drawRow = (cells: string[], bold: boolean, shade: boolean) => {
    const h = rowH(cells, bold);
    const y = doc.y;
    if (shade) doc.rect(PAGE.m, y, CONTENT_W, h).fillColor("#f7f4ee").fill();
    let x = PAGE.m;
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fs)
      .fillColor(bold ? MUTED : INK);
    cells.forEach((c, i) => {
      actualText(doc, c, () => doc.text(c, x + pad, y + pad, {
        width: cols[i] - pad * 2,
        lineBreak: true,
      }));
      x += cols[i];
    });
    doc.y = y + h;
    doc
      .moveTo(PAGE.m, doc.y)
      .lineTo(PAGE.w - PAGE.m, doc.y)
      .lineWidth(0.3)
      .strokeColor(RULE)
      .stroke();
    return h;
  };
  ensureSpace(doc, 40);
  doc.y += 2;
  drawRow(head, true, false);
  rows.forEach((r, i) => {
    const cells = r.map((c) => c ?? "");
    // Break before a row that will not fit, and repeat the header on the new page.
    if (doc.y + rowH(cells) + 2 > BOTTOM) {
      doc.addPage();
      doc.y = PAGE.m;
      drawRow(head, true, false);
    }
    drawRow(cells, false, i % 2 === 1);
  });
  if (p.cites?.length || p.text) {
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(MUTED)
      .text(`${p.text ?? ""}${sup(p.cites)}`.trim(), PAGE.m, doc.y + 2, {
        width: CONTENT_W,
      });
  }
  doc.y += 8;
  doc.x = PAGE.m;
}

function section(doc: Doc, sec: ReportSection, level: number) {
  if (!sec.paras.length && !sec.sub?.length) return;
  heading(doc, sec, level);
  for (const p of sec.paras) para(doc, p);
  for (const s of sec.sub ?? []) section(doc, s, level + 1);
}

export function renderReportPdf(
  result: ChartResult,
  rep: ReportDoc,
): PDFKit.PDFDocument {
  // Full OpenType fonts are bundled at build time; browser WOFF2 subsets are not usable here.
  const fontDir = existsSync(join(process.cwd(), "dist/fonts/Manjari-Regular.ttf")) ? "dist/fonts" : "server/assets/fonts";
  const regular = join(process.cwd(), fontDir, "Manjari-Regular.ttf");
  const bold = join(process.cwd(), fontDir, "Manjari-Bold.ttf");
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: PAGE.m, bottom: 20, left: PAGE.m, right: PAGE.m },
    bufferPages: true,
    info: { Title: `${rep.title} — Nadi report`, Author: "Nadi" },
    ...(rep.locale === "ml" ? { font: regular } : {}),
  });
  if (rep.locale === "ml") {
    for (const name of ["Helvetica", "Helvetica-Oblique", "Times-Roman"]) doc.registerFont(name, regular);
    for (const name of ["Helvetica-Bold", "Times-Bold"]) doc.registerFont(name, bold);
  }
  const { chart, positions, now } = result;

  // Title block.
  actualText(doc, rep.title, () => doc
    .font("Times-Bold")
    .fontSize(22)
    .fillColor(INK)
    .text(rep.title, PAGE.m, PAGE.m));
  actualText(doc, rep.subtitle, () => doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(rep.subtitle));
  doc
    .fontSize(8)
    .text(
      `${rep.meta.join("  ·  ")}  ·  ${rep.plain ? "plain reading" : "practitioner reading"}  ·  ${isDeceased(chart, now.asOf) ? "generated" : "as of"} ${rep.generated}`,
    );
  doc.moveDown(0.6);
  doc
    .moveTo(PAGE.m, doc.y)
    .lineTo(PAGE.w - PAGE.m, doc.y)
    .lineWidth(0.8)
    .strokeColor(INK)
    .stroke();
  doc.y += 14;

  // The South Indian chart beside the first section's lead, when the chart section is present.
  const first = rep.sections[0];
  if (first?.id === "chart") {
    const size = 200;
    const y0 = doc.y;
    const birthLocal = displayLocal(
      result.utc,
      result.timeBasis,
      chart.timezone,
    );
    // Today’s planetary positions are not the sky at a recorded passing.
    const transit = isDeceased(chart, now.asOf) ? [] : now.positions.filter(
      (p) => p.planet === "Jupiter" || p.planet === "Saturn",
    );
    drawSouthIndianChart(
      doc,
      PAGE.m,
      y0,
      size,
      positions,
      transit,
      chart.name,
      birthLocal.toFormat("d LLL yyyy · HH:mm"),
      {
        lagnaSign: result.jaimini.lagna.signIndex,
      },
    );
    const tx = PAGE.m + size + 16;
    const lead = first.paras.find((p) => p.kind === "lead");
    actualText(doc, lead?.text ?? "", () => doc
      .font("Times-Roman")
      .fontSize(10)
      .fillColor(INK)
      .text(lead?.text ?? "", tx, y0 + 2, {
        width: PAGE.w - PAGE.m - tx,
        lineGap: 1.5,
      }));
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(MUTED)
      .text(
        `${PLANET_ABBR[result.reading.roles.native]} Jeeva · Sa Karma${transit.length ? ` · tJu tSa transits as of ${rep.generated}` : ""}`,
        PAGE.m,
        y0 + size + 6,
        { width: size },
      );
    doc.y = Math.max(doc.y, y0 + size + 24);
    doc.x = PAGE.m;
    for (const p of first.paras.filter((p) => p.kind !== "lead")) para(doc, p);
    for (const s of first.sub ?? []) section(doc, s, 1);
  }

  for (const sec of rep.sections.slice(first?.id === "chart" ? 1 : 0))
    section(doc, sec, 0);

  // Notes.
  if (rep.cites.length) {
    heading(doc, { id: "notes", title: translate(rep.locale ?? "en", "Notes"), paras: [] }, 0);
    doc.font("Helvetica").fontSize(7.5).fillColor(INK);
    for (const c of rep.cites) {
      ensureSpace(doc, 14);
      const line = `${c.n}. ${c.label}${c.url ? `  ${c.url}` : ""}`;
      doc.fillColor(INK).text(`${c.n}. ${c.label}`, PAGE.m, doc.y, {
        width: CONTENT_W,
        continued: !!c.url,
      });
      if (c.url)
        doc
          .fillColor(INDIGO)
          .text(`  ${c.url}`, { link: c.url, underline: false });
      void line;
      doc.y += 1.5;
    }
  }

  // Footer.
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(7).fillColor(MUTED);
    const footer = `${rep.title} · Nadi report · ${rep.modules.join(", ")}`;
    actualText(doc, footer, () => doc.text(
      footer,
      PAGE.m,
      PAGE.h - 36,
      { lineBreak: false },
    ));
    doc.text(`${i + 1} / ${range.count}`, PAGE.m, PAGE.h - 36, {
      width: CONTENT_W,
      align: "right",
      lineBreak: false,
    });
  }
  doc.end();
  return doc;
}
