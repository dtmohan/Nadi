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
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  buildReport,
  REPORT_MODULES,
  type ReportPara,
  type ReportSection,
} from "@/lib/report-builder";
import { downloadReportPdf } from "@/lib/report-pdf";
import { useToast } from "@/hooks/use-toast";
import { LocalizedText, useLocale } from "@/lib/i18n";

/** The systems a reader can leave out of the report; the chart section is always present and the two tools export from their own tabs. */
const PICKABLE = REPORT_MODULES.filter((m) => m.id !== "chart" && !m.tool);

const TONE_RULE: Record<NonNullable<ReportPara["tone"]>, string> = {
  support: "border-verdict-good/50",
  strain: "border-verdict-mixed/60",
  mixed: "border-border",
};

/** Report anchors must not replace the app's hash route. */
function jumpToReportTarget(event: React.MouseEvent<HTMLAnchorElement>, target: string) {
  event.preventDefault();
  const element = document.getElementById(target);
  if (!element) return;
  element.scrollIntoView({ block: "start" });
  element.focus({ preventScroll: true });
}

function Cites({ ns }: { ns?: number[] }) {
  if (!ns?.length) return null;
  return (
    <sup className="ml-0.5 font-mono text-[0.65em] text-muted-foreground">
      {ns.map((n, i) => (
        <span key={n}>
          {/* A break opportunity after each comma: a long run of note numbers wraps instead of running off a phone screen. */}
          {i > 0 && (
            <>
              ,<wbr />
            </>
          )}
          <a href={`#fn-${n}`} onClick={(event) => jumpToReportTarget(event, `fn-${n}`)} className="hover:text-foreground">
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
        <Table wrapperClassName="report-table-scroll my-5 print:overflow-visible"
          className={cn(
            "report-data-table w-full",
            (p.head?.length ?? 0) > 8
              ? "text-[0.72em] whitespace-nowrap"
              : "text-[0.85em]",
          )}
        >
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              {p.head?.map((h, i) => (
                <th key={i} scope="col" lang={/[\u0d00-\u0d7f]/.test(h) ? "ml" : "en"} className="py-2.5 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.rows?.map((r, i) => (
              <tr key={i} className="align-top">
                {r.map((c, j) => (
                  <td key={j} lang={/[\u0d00-\u0d7f]/.test(c) ? "ml" : "en"} className={cn("py-2.5 pr-4", j > 0 && "tabular")}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
    );
  if (p.kind === "note")
    return (
      <p lang={p.lang} className="report-note my-4 text-[0.85em] leading-relaxed text-muted-foreground">
        {p.provisional && <span className="mr-1.5 text-[0.8em] font-semibold text-amber-700 dark:text-amber-400"><LocalizedText>Provisional</LocalizedText></span>}
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
      <p
        lang={p.lang}
        className={cn(
          "leading-relaxed",
          lead && "font-display text-[1.08em] leading-relaxed",
        )}
      >
        {p.provisional && (
          <span className="mr-1.5 text-[0.7em] uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <LocalizedText>Provisional</LocalizedText>
          </span>
        )}
        {p.text}
        <Cites ns={p.cites} />
      </p>
      {p.aside && (
        <p lang={/[\u0d00-\u0d7f]/.test(p.aside) ? "ml" : "en"} className="mt-0.5 text-[0.8em] text-muted-foreground">{p.aside}</p>
      )}
    </div>
  );
}

function Section({ s, level }: { s: ReportSection; level: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <section
      id={s.id}
      tabIndex={-1}
      className={cn("scroll-mt-6", level === 2 ? "report-section mt-12 break-before-auto" : "mt-8")}
      data-testid={`report-section-${s.id}`}
    >
      {s.kicker && (
        <p lang={/[\u0d00-\u0d7f]/.test(s.kicker) ? "ml" : "en"} className="text-xs uppercase tracking-wider text-muted-foreground">
          {s.kicker}
        </p>
      )}
      <H
        lang={s.lang}
        className={cn(
          "font-display font-semibold",
          level === 2 ? "text-2xl" : "text-lg",
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
  const { locale } = useLocale();
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
      data ? buildReport(data, { plain: mode === "plain", modules, locale }) : null,
    [data, mode, modules, locale],
  );
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const exportPdf = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await downloadReportPdf(data.chart, {
        plain: mode === "plain",
        locale,
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
      className="mx-auto max-w-3xl px-5 pb-16 pt-6 sm:px-8"
      data-testid="report"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={`/chart/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          data-testid="link-report-back"
        >
          <ArrowLeft className="h-4 w-4" /> <LocalizedText>Back to the chart</LocalizedText>
        </Link>
        {/* On a phone the export buttons wrap together under the reading-depth toggle. */}
        <div className="flex flex-wrap items-center gap-2">
          <ReadingModeToggle />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportPdf}
              disabled={exporting}
              data-testid="button-report-pdf"
            >
              <FileDown className="h-4 w-4" />
              <LocalizedText>{exporting ? "Preparing PDF" : "Download PDF"}</LocalizedText>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.print()}
              data-testid="button-report-print"
              title="Print this page from the browser"
            >
              <Printer className="h-4 w-4" /> <LocalizedText>Print</LocalizedText>
            </Button>
          </div>
        </div>
      </div>

      <div
        className="mb-6 flex flex-wrap items-center gap-1.5 print:hidden"
        role="group"
        aria-label="Systems in the report"
        data-testid="report-modules"
      >
        <span className="mr-1 text-xs text-muted-foreground"><LocalizedText>Include</LocalizedText></span>
        {PICKABLE.map((m) => {
          const on = !off.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(m.id)}
              className={cn(
                "min-h-9 rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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

      <header className="report-hero">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Nadi · reading report · {doc.generated}
        </p>
        <h1
          className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          data-testid="report-title"
        >
          {doc.title}
        </h1>
        <p className="text-sm text-muted-foreground">{doc.subtitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {doc.meta.join(" · ")} ·{" "}
          <LocalizedText>{doc.plain ? "Plain reading" : "Practitioner reading"}</LocalizedText>
        </p>
      </header>

      <nav
        className="report-contents mt-8 print:hidden"
        lang={locale}
        aria-label={locale === "ml" ? "ഈ റിപ്പോർട്ടിൽ" : "In this report"}
        data-testid="report-contents"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{locale === "ml" ? "ഈ റിപ്പോർട്ടിൽ" : "In this report"}</p>
        <ol className="flex flex-wrap gap-x-5 gap-y-2">
          {doc.sections.map((s, i) => <li key={s.id}>
            <a href={`#${s.id}`} onClick={(event) => jumpToReportTarget(event, s.id)} lang={s.lang} className="inline-flex items-baseline gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <span aria-hidden className="font-mono text-xs text-primary/75">{String(i + 1).padStart(2, "0")}</span>{s.title}
            </a>
          </li>)}
        </ol>
      </nav>

      <article className="text-[15px]">
        {doc.sections.map((s) => (
          <Section key={s.id} s={s} level={2} />
        ))}
      </article>

      <section id="notes" className="mt-12" data-testid="report-notes">
        <h2 className="font-display text-xl font-semibold"><LocalizedText>Notes</LocalizedText></h2>
        <ol lang="en" className="mt-3 space-y-1 text-[0.85em] text-muted-foreground">
          {doc.cites.map((c) => (
            <li key={c.n} id={`fn-${c.n}`} tabIndex={-1} className="flex scroll-mt-6 gap-2">
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
