// Generic PDF renderer for the report model (shared/report). It walks ReportDoc sections and
// paragraphs and knows nothing about any astrological system: headings, lead and body text,
// asides, tables, provisional marks, tone colour, and numbered notes with their URLs at the end.
import PDFDocument from "pdfkit";
import type { ChartResult } from "@shared/schema";
import type { ReportDoc, ReportPara, ReportSection } from "@shared/report";
import { displayLocal } from "@shared/time-basis";
import { PLANET_ABBR } from "@shared/astro";
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
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(sec.kicker.toUpperCase(), PAGE.m, y, { characterSpacing: 0.6 });
    }
    doc
      .font("Times-Bold")
      .fontSize(16)
      .fillColor(INK)
      .text(sec.title, PAGE.m, sec.kicker ? doc.y + 1 : y);
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
    doc
      .font("Times-Bold")
      .fontSize(11.5)
      .fillColor(INK)
      .text(sec.title, PAGE.m);
    doc.y += 3;
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
    doc.text(`${text}${sup(p.cites)} `, PAGE.m, y0, {
      width: CONTENT_W - 10,
      lineGap: 1.5,
      continued: true,
    });
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(VERMILION)
      .text("PROVISIONAL", { characterSpacing: 0.5 });
  } else {
    doc.text(`${text}${sup(p.cites)}`, PAGE.m, y0, {
      width: CONTENT_W - 10,
      lineGap: 1.5,
    });
  }
  if (p.aside) {
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
    ensureSpace(doc, 14);
    doc.text(p.aside, PAGE.m, doc.y + 1, { width: CONTENT_W - 10 });
  }
  doc.y += p.kind === "note" ? 4 : 6;
  doc.x = PAGE.m;
}

/** Column widths from content: measure each column's widest cell; narrow columns keep their natural width, the rest share what is left. */
function widths(
  doc: Doc,
  head: string[],
  rows: string[][],
  fontSize: number,
): number[] {
  doc.font("Helvetica").fontSize(fontSize);
  const pad = 9;
  const raw = head.map((h, i) => {
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
    return {
      full: Math.min(w, CONTENT_W * 0.5) + pad,
      min: Math.max(word, 18) + pad,
    };
  });
  const total = raw.reduce((a, b) => a + b.full, 0);
  if (Math.abs(total - CONTENT_W) < 1) return raw.map((r) => r.full);
  // Columns narrower than 48pt keep their natural width; the others scale to fill the page,
  // never below the widest single word so nothing breaks mid-word.
  const fixed = raw.map((r) => r.full < 48 + pad);
  const fixedW = raw.reduce((a, r, i) => a + (fixed[i] ? r.full : 0), 0);
  const flexW = total - fixedW;
  if (flexW <= 0)
    return raw.map((r) => r.full + (CONTENT_W - total) / raw.length);
  const k = (CONTENT_W - fixedW) / flexW;
  return raw.map((r, i) => (fixed[i] ? r.full : Math.max(r.min, r.full * k)));
}

function table(doc: Doc, p: ReportPara) {
  const head = p.head ?? [];
  const rows = p.rows ?? [];
  if (!head.length || !rows.length) return;
  const dense = head.length > 8;
  const fs = dense ? 6.5 : head.length > 5 ? 7.5 : 8.5;
  const cols = widths(doc, head, rows, fs);
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
      doc.text(c, x + pad, y + pad, {
        width: cols[i] - pad * 2,
        lineBreak: true,
      });
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
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: PAGE.m, bottom: 20, left: PAGE.m, right: PAGE.m },
    bufferPages: true,
    info: { Title: `${rep.title} — Nadi report`, Author: "Nadi" },
  });
  const { chart, positions, now } = result;

  // Title block.
  doc
    .font("Times-Bold")
    .fontSize(22)
    .fillColor(INK)
    .text(rep.title, PAGE.m, PAGE.m);
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(rep.subtitle);
  doc
    .fontSize(8)
    .text(
      `${rep.meta.join("  ·  ")}  ·  ${rep.plain ? "plain reading" : "practitioner reading"}  ·  as of ${rep.generated}`,
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
    const transit = now.positions.filter(
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
    doc
      .font("Times-Roman")
      .fontSize(10)
      .fillColor(INK)
      .text(lead?.text ?? "", tx, y0 + 2, {
        width: PAGE.w - PAGE.m - tx,
        lineGap: 1.5,
      });
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(MUTED)
      .text(
        `${PLANET_ABBR[result.reading.roles.native]} Jeeva · Sa Karma · tJu tSa transits as of ${rep.generated}`,
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
    heading(doc, { id: "notes", title: "Notes", paras: [] }, 0);
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
    doc.text(
      `${rep.title} · Nadi report · ${rep.modules.join(", ")}`,
      PAGE.m,
      PAGE.h - 36,
      { lineBreak: false },
    );
    doc.text(`${i + 1} / ${range.count}`, PAGE.m, PAGE.h - 36, {
      width: CONTENT_W,
      align: "right",
      lineBreak: false,
    });
  }
  doc.end();
  return doc;
}
