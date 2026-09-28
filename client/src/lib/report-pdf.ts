// Downloads the server-rendered report PDF for a chart: the whole report, or the modules named.
import { apiRequest } from "@/lib/queryClient";
import type { Chart } from "@shared/schema";
import type { RectifyExportState } from "@shared/rectify-methods";

export interface ReportPdfOptions {
  plain: boolean;
  /** Module ids to include (shared/report REPORT_MODULE_IDS); the whole report when omitted. */
  modules?: string[];
  /** Inputs the tool modules need: the Rectify tab's current scan. Validate needs only the chart's events. */
  tools?: { rectify?: RectifyExportState };
}

export async function downloadReportPdf(chart: Chart, opts: ReportPdfOptions) {
  const res = await apiRequest("POST", "/api/report.pdf", {
    ...chart,
    plain: opts.plain,
    modules: opts.modules,
    tools: opts.tools,
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = chart.name.replace(/[^\w.-]+/g, "_").slice(0, 60) || "chart";
  const tag = opts.modules?.length === 1 ? `-${opts.modules[0]}` : "";
  a.href = url;
  a.download = `nadi-report-${safe}${tag}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
