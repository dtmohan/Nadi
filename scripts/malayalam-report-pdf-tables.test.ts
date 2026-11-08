import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { computeChart } from "../server/routes";
import { renderReportPdf } from "../server/report-pdf";
import type { Chart } from "../shared/schema";
import type { ReportDoc } from "../shared/report";

test("wide Malayalam PDF tables retain every column and repeat the row identifier", async (t) => {
  if (spawnSync("pdftotext", ["-v"], { encoding: "utf8" }).error) return t.skip("pdftotext is not installed");
  const chart = { id: 0, name: "Synthetic", gender: "male", birthDate: "1990-01-01", birthTime: "12:00", timezone: "Asia/Kolkata", timeStandard: "auto", place: "Bengaluru", latitude: 12.97, longitude: 77.59, ayanamsa: "lahiri", nodeType: "mean", sunriseDef: "edge", parashariHouseMethod: "rashi", notes: "", deathDate: null, timeUncertaintyMin: 0, events: [] } as Chart;
  const head = ["ഗ്രഹം", "രാശി", "നക്ഷത്രം", "സഹാധിപൻ", "നക്ഷത്രാധിപൻ", "ഭാവസ്ഥാനം", "രാശ്യാധിപൻ", "പാദം", "ഗ്രഹബന്ധങ്ങൾ", "ആദ്യഘട്ടം", "രണ്ടാംഘട്ടം", "മൂന്നാംഘട്ടം", "നാലാംഘട്ടം", "ശേഷകാലം", "വിലയിരുത്തൽ", "അവസാനപരിശോധന"];
  const values = head.map((_, i) => `വിവരം${i + 1}`);
  const report: ReportDoc = { title: "Synthetic", subtitle: "", meta: [], generated: "", plain: false, modules: [], locale: "ml", cites: [], sections: [{ id: "sample", title: "വിശദ പട്ടിക", paras: [{ kind: "table", head, rows: [values] }] }] };
  const dir = mkdtempSync(join(tmpdir(), "nadi-wide-table-"));
  try {
    const doc = renderReportPdf(computeChart(chart), report);
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    await new Promise<void>((resolve, reject) => { doc.on("end", resolve); doc.on("error", reject); });
    const file = join(dir, "report.pdf");
    writeFileSync(file, Buffer.concat(chunks));
    const extracted = spawnSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
    assert.equal(extracted.status, 0, extracted.stderr);
    for (const text of [...head, ...values]) assert.ok(extracted.stdout.includes(text), `Missing ${text}`);
    assert.ok(extracted.stdout.split(head[0]).length >= 3, "Continuation repeats the first column");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
