import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown, Printer } from "lucide-react";
import type { ChartResult } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { chartsStore } from "@/lib/charts-store";
import { useReadingMode } from "@/lib/reading-mode";
import { ReadingModeToggle } from "@/components/working";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildReport,
  REPORT_MODULES,
  type ReportPara,
  type ReportSection,
} from "@/lib/report-builder";
import { downloadReportPdf } from "@/lib/report-pdf";
import { useToast } from "@/hooks/use-toast";

/** The systems a reader can leave out of the report; the chart section is always present and the two tools export from their own tabs. */
const PICKABLE = REPORT_MODULES.filter((m) => m.id !== "chart" && !m.tool);

const TONE_RULE: Record<NonNullable<ReportPara["tone"]>, string> = {
  support: "border-verdict-good/50",
  strain: "border-verdict-mixed/60",
  mixed: "border-border",
};

function Cites({ ns }: { ns?: number[] }) {
  if (!ns?.length) return null;
  return (
    <sup className="ml-0.5 font-mono text-[0.65em] text-muted-foreground">
      {ns.map((n, i) => (
        <span key={n}>
          {i > 0 && ","}
          <a href={`#fn-${n}`} className="hover:text-foreground">
            {n}
          </a>
        </span>
      ))}
    </sup>
  );
}

function Para({ p }: { p: ReportPara }) {
  if (p.kind === "table")
    return (
      <div className="my-4 overflow-x-auto print:overflow-visible">
        <table
          className={cn(
            "w-full",
            (p.head?.length ?? 0) > 8
              ? "text-[0.72em] whitespace-nowrap"
              : "text-[0.85em]",
          )}
        >
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              {p.head?.map((h) => (
                <th key={h} className="py-1 pr-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.rows?.map((r, i) => (
              <tr key={i} className="border-b border-border/50 align-top">
                {r.map((c, j) => (
                  <td key={j} className={cn("py-1 pr-3", j > 0 && "tabular")}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if (p.kind === "note")
    return (
      <p className="my-3 rounded border border-border/60 bg-muted/30 px-3 py-2 text-[0.85em] leading-relaxed text-muted-foreground print:bg-transparent">
        {p.text}
        <Cites ns={p.cites} />
      </p>
    );
  const lead = p.kind === "lead";
  return (
    <div
      className={cn(
        "relative my-3",
        p.provisional && "border-l-2 border-amber-500/70 pl-3",
        !p.provisional && p.tone && "border-l-2 pl-3",
        !p.provisional && p.tone && TONE_RULE[p.tone],
      )}
    >
      {p.provisional && (
        <span
          className="absolute -left-2 top-0 -translate-x-full text-[0.65em] uppercase tracking-wider text-amber-700 dark:text-amber-400 max-lg:hidden print:hidden"
          aria-hidden
        >
          provisional
        </span>
      )}
      <p
        className={cn(
          "leading-relaxed",
          lead && "font-display text-[1.08em] leading-relaxed",
        )}
      >
        {p.provisional && (
          <span className="mr-1.5 text-[0.7em] uppercase tracking-wider text-amber-700 dark:text-amber-400 lg:hidden print:inline">
            provisional
          </span>
        )}
        {p.text}
        <Cites ns={p.cites} />
      </p>
      {p.aside && (
        <p className="mt-0.5 text-[0.8em] text-muted-foreground">{p.aside}</p>
      )}
    </div>
  );
}

function Section({ s, level }: { s: ReportSection; level: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <section
      id={s.id}
      className={cn(level === 2 ? "mt-12 break-before-auto" : "mt-6")}
      data-testid={`report-section-${s.id}`}
    >
      {s.kicker && (
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {s.kicker}
        </p>
      )}
      <H
        className={cn(
          "font-display font-semibold",
          level === 2 ? "text-xl" : "text-base",
        )}
      >
        {s.title}
      </H>
      {s.paras.map((p, i) => (
        <Para key={i} p={p} />
      ))}
      {s.sub?.map((x) => (
        <Section key={x.id} s={x} level={3} />
      ))}
    </section>
  );
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { mode } = useReadingMode();
  const { data, isLoading, error } = useQuery<ChartResult>({
    queryKey: ["chart-result", id],
    queryFn: async () => {
      const chart = await chartsStore.get(Number(id));
      if (!chart) throw new Error("Chart not found in this browser");
      const result = (await (
        await apiRequest("POST", "/api/compute", chart)
      ).json()) as ChartResult;
      return { ...result, chart };
    },
  });
  // Which systems the report carries; all of them until the reader turns some off.
  const [off, setOff] = useState<Set<string>>(new Set());
  const modules = useMemo(
    () => PICKABLE.map((m) => m.id).filter((id) => !off.has(id)),
    [off],
  );
  const toggle = (id: string) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < PICKABLE.length - 1) next.add(id);
      return next;
    });
  const doc = useMemo(
    () =>
      data ? buildReport(data, { plain: mode === "plain", modules }) : null,
    [data, mode, modules],
  );
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const exportPdf = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await downloadReportPdf(data.chart, {
        plain: mode === "plain",
        modules: off.size ? modules : undefined,
      });
    } catch (e: any) {
      toast({
        title: "Could not export PDF",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };
  useEffect(() => {
    document.documentElement.classList.add("report-print");
    return () => document.documentElement.classList.remove("report-print");
  }, []);
  useEffect(() => {
    if (doc) document.title = `${doc.title} — Nadi report`;
    return () => {
      document.title = "Nadi";
    };
  }, [doc]);

  if (isLoading)
    return (
      <div
        className="p-6 text-sm text-muted-foreground"
        data-testid="report-loading"
      >
        Preparing the report…
      </div>
    );
  if (error || !doc)
    return (
      <div className="p-6 text-sm" data-testid="report-error">
        {(error as Error)?.message ?? "Could not build the report."}
      </div>
    );

  return (
    <div
      className="mx-auto max-w-3xl px-6 pb-16 pt-6 lg:pl-28"
      data-testid="report"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={`/chart/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          data-testid="link-report-back"
        >
          <ArrowLeft className="h-4 w-4" /> Back to the chart
        </Link>
        <div className="flex items-center gap-2">
          <ReadingModeToggle />
          <Button
            size="sm"
            variant="outline"
            onClick={exportPdf}
            disabled={exporting}
            data-testid="button-report-pdf"
          >
            <FileDown className="h-4 w-4" />
            {exporting ? "Preparing PDF" : "Download PDF"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.print()}
            data-testid="button-report-print"
            title="Print this page from the browser"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div
        className="mb-6 flex flex-wrap items-center gap-1.5 print:hidden"
        role="group"
        aria-label="Systems in the report"
        data-testid="report-modules"
      >
        <span className="mr-1 text-xs text-muted-foreground">Include</span>
        {PICKABLE.map((m) => {
          const on = !off.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(m.id)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                on
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground line-through hover:text-foreground",
              )}
              title={m.label}
              data-testid={`report-module-${m.id}`}
            >
              {m.short}
            </button>
          );
        })}
      </div>

      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Nadi · reading report · {doc.generated}
        </p>
        <h1
          className="mt-1 font-display text-xl font-bold"
          data-testid="report-title"
        >
          {doc.title}
        </h1>
        <p className="text-sm text-muted-foreground">{doc.subtitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {doc.meta.join(" · ")} ·{" "}
          {doc.plain ? "plain reading" : "practitioner reading"}
        </p>
      </header>

      <nav
        className="mt-6 text-sm text-muted-foreground print:hidden"
        aria-label="Contents"
        data-testid="report-contents"
      >
        {doc.sections.map((s, i) => (
          <span key={s.id}>
            {i > 0 && " · "}
            <a href={`#${s.id}`} className="hover:text-foreground">
              {s.title}
            </a>
          </span>
        ))}
      </nav>

      <article className="text-[15px]">
        {doc.sections.map((s) => (
          <Section key={s.id} s={s} level={2} />
        ))}
      </article>

      <section id="notes" className="mt-12" data-testid="report-notes">
        <h2 className="font-display text-xl font-semibold">Notes</h2>
        <ol className="mt-3 space-y-1 text-[0.85em] text-muted-foreground">
          {doc.cites.map((c) => (
            <li key={c.n} id={`fn-${c.n}`} className="flex gap-2">
              <span className="w-6 shrink-0 text-right font-mono">{c.n}.</span>
              <span>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-border underline-offset-2 hover:text-foreground"
                  >
                    {c.label}
                  </a>
                ) : (
                  c.label
                )}
                {c.url && (
                  <span className="hidden print:inline"> — {c.url}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
