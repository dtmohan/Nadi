// The report registry: one module per system, each building its own sections from the same
// ChartResult. buildReport assembles the chosen modules in reading order, applies the sensitive
// gate and the plain-reading softening once, and returns the document the screen and the PDF share.
import { SIGNS, type Planet } from "../astro";
import { displayLocal } from "../time-basis";
import {
  ageYears,
  areaSeason,
  lifeAsOf,
  sensitiveGate,
  AREA_ONSET,
  SENSITIVE_WITHHELD_NOTE,
  redactProse,
} from "../life-stage";
import { soften } from "../gentle";
import type { ChartResult } from "../schema";
import {
  Cites,
  cap,
  fmtDate,
  type ReportContext,
  type ReportDoc,
  type ReportModule,
  type ReportPara,
  type ReportSection,
  type ReportTools,
  type ReportCite,
} from "./types";
import { chartModule } from "./chart";
import { panchangaModule } from "./panchanga";
import { bnnModule } from "./bnn";
import { parashariModule } from "./parashari";
import { jaiminiModule } from "./jaimini";
import { kpModule } from "./kp";
import { alpModule } from "./alp";
import { rectifyModule } from "./rectify";
import { validateModule } from "./validate";
import {
  AGREEMENT_METHOD,
  AGREEMENT_NOTE,
  AGREEMENT_PARENTS_NOTE,
  AGREEMENT_SYSTEM_LABEL,
  agreementFor,
  type AgreementSystem,
  type SystemStance,
} from "../agreement";

const AGREEMENT_SYSTEMS: AgreementSystem[] = [
  "bnn",
  "parashari",
  "jaimini",
  "kp",
];

/** A table cell: the stance word and its evidence, the books behind Parashari's, and any provisional footing. */
function stanceCell(s: SystemStance, S: (t: string) => string): string {
  const books = s.texts?.length
    ? ` (${s.texts.map((b) => `${b.label} ${b.stance === "silent" ? "silent" : b.word}`).join("; ")})`
    : "";
  const footing = s.stance !== "silent" && s.tier !== "sourced" && s.reason ? ` Provisional: ${s.reason}.` : "";
  return `${cap(s.word)}: ${S(s.note)}${books}.${footing}`.replace(/\.\./g, ".");
}

export * from "./types";

/** Reading order. The Panchanga module contributes the day of birth after the chart and the sky today near the end. */
export const REPORT_MODULES: ReportModule[] = [
  chartModule,
  panchangaModule,
  bnnModule,
  parashariModule,
  jaiminiModule,
  kpModule,
  alpModule,
  rectifyModule,
  validateModule,
];

export const REPORT_MODULE_IDS = REPORT_MODULES.map((m) => m.id);
/** The reading systems: what the whole report carries by default. Tools are exported only by name. */
export const READING_MODULE_IDS = REPORT_MODULES.filter((m) => !m.tool).map(
  (m) => m.id,
);

export interface BuildReportOptions {
  plain: boolean;
  /** Module ids to include; all when omitted. The chart and closing sections are always present. */
  modules?: string[];
  /** Server-computed tool results for the rectify and validate modules. */
  tools?: ReportTools;
}

export function buildContext(
  result: ChartResult,
  plain: boolean,
  tools: ReportTools = {},
): ReportContext {
  const { chart, positions, reading, now } = result;
  const asOf = now.asOf;
  const lifeAt = lifeAsOf(chart, asOf);
  const deceased = lifeAt !== asOf;
  return {
    result,
    plain,
    S: (t: string) => (plain ? soften(t) : t),
    cites: new Cites(),
    asOf,
    lifeAt,
    deceased,
    age: ageYears(result.utc, lifeAt),
    withheld:
      result.sensitive?.withheld ??
      sensitiveGate(chart, result.utc, asOf).withheld,
    inSeason: (area: string) => areaSeason(area, result.utc, lifeAt).inSeason,
    female: reading.roles.gender === "female",
    pos: (p: Planet) => positions.find((x) => x.planet === p)!,
    lagnaIdx: result.jaimini.lagna.signIndex,
    birthLocal: displayLocal(result.utc, result.timeBasis, chart.timezone),
    tools,
  };
}

export function buildReport(
  result: ChartResult,
  opts: BuildReportOptions,
): ReportDoc {
  const ctx = buildContext(result, opts.plain, opts.tools);
  const wanted = new Set(
    opts.modules?.length ? [...opts.modules, "chart"] : READING_MODULE_IDS,
  );
  const modules = REPORT_MODULES.filter((m) => wanted.has(m.id));

  // Reading order: the chart; how to read the report; the systems side by side at a glance; the day of
  // birth (Panchanga, then the birth star); each system in its own part; the sky today; and, in the
  // practitioner report only, an appendix of the data tables the readings rest on.
  const built: ReportSection[] = [];
  for (const m of modules) built.push(...m.build(ctx));
  const { body, tables } = splitAppendix(built);
  const DAY = ["day", "birth-star"];
  const chartSec = body.find((s) => s.id === "chart");
  const skyToday = body.find((s) => s.id === "now");
  const agreement = agreementSection(ctx, modules);
  const ordered: ReportSection[] = [
    ...(chartSec ? [chartSec] : []),
    closing(ctx, modules),
    ...(agreement ? [agreement] : []),
    ...DAY.flatMap((id) => body.filter((s) => s.id === id)),
    ...body.filter((s) => s !== chartSec && s !== skyToday && !DAY.includes(s.id)),
    ...(skyToday ? [skyToday] : []),
    ...(!ctx.plain && tables.length
      ? [
          {
            id: "appendix",
            title: "Appendix: the tables",
            kicker: "For practitioners",
            paras: [
              {
                kind: "note" as const,
                text: "The data the readings above rest on, system by system: strengths, divisions and points for Parashara, the karakas, padas and Chara dasha periods for Jaimini, the cusps and significators for KP, and the progressed lagna's houses and periods for ALP. The plain report leaves them out.",
              },
            ],
            sub: tables,
          },
        ]
      : []),
  ];
  // The sensitive-content gate: for a native under 18 every statement on length of life, marakas, arishta or the loss of a parent is removed, in either reading mode.
  const gated = ctx.withheld ? withholdSections(ordered) : ordered;
  // Notes are numbered by first appearance in the final order; a note no paragraph cites is dropped.
  const { sections, cites } = renumberCites(gated, ctx.cites.list);

  const { chart } = result;
  return {
    title: chart.name,
    subtitle: `${ctx.birthLocal.toFormat("d LLLL yyyy, HH:mm")} · ${chart.place}`,
    meta: [
      `${SIGNS[ctx.lagnaIdx]} rising`,
      `Moon in ${ctx.pos("Moon").nakshatra}`,
      `${chart.ayanamsa} ayanamsa`,
      result.timeBasis.label,
    ],
    generated: fmtDate(ctx.asOf),
    plain: opts.plain,
    modules: modules.map((m) => m.id),
    sections,
    cites,
  };
}

/**
 * Data tables leave the reading: a section marked as tables moves whole, and a table marked within a
 * reading moves under its section's title, so the appendix keeps each system's tables together.
 */
function splitAppendix(sections: ReportSection[]): {
  body: ReportSection[];
  tables: ReportSection[];
} {
  const body: ReportSection[] = [];
  const tables: ReportSection[] = [];
  for (const s of sections) {
    if (s.appendix) {
      tables.push(s);
      continue;
    }
    const pulled: ReportPara[] = [];
    const strip = (x: ReportSection): ReportSection => ({
      ...x,
      paras: x.paras.filter((p) => {
        if (!p.appendix) return true;
        pulled.push(p);
        return false;
      }),
      ...(x.sub ? { sub: x.sub.map(strip) } : {}),
    });
    body.push(strip(s));
    if (pulled.length)
      tables.push({
        id: `${s.id}-tables`,
        title: s.title,
        ...(s.kicker ? { kicker: s.kicker } : {}),
        paras: pulled,
      });
  }
  return { body, tables };
}

function renumberCites(
  sections: ReportSection[],
  list: ReportCite[],
): { sections: ReportSection[]; cites: ReportCite[] } {
  const byN = new Map(list.map((c) => [c.n, c]));
  const next = new Map<number, number>();
  const cites: ReportCite[] = [];
  const num = (n: number) => {
    if (!next.has(n)) {
      const c = byN.get(n);
      if (!c) return n;
      next.set(n, cites.length + 1);
      cites.push({ ...c, n: cites.length + 1 });
    }
    return next.get(n)!;
  };
  const sec = (s: ReportSection): ReportSection => ({
    ...s,
    paras: s.paras.map((p) => (p.cites ? { ...p, cites: p.cites.map(num) } : p)),
    ...(s.sub ? { sub: s.sub.map(sec) } : {}),
  });
  return { sections: sections.map(sec), cites };
}

/**
 * Where the systems agree: present only when the four systems that give area verdicts are all in
 * the document, so the comparison never speaks for a system the reader cannot see.
 */
function agreementSection(
  ctx: ReportContext,
  modules: ReportModule[],
): ReportSection | undefined {
  const ids = new Set(modules.map((m) => m.id));
  if (!["bnn", "parashari", "jaimini", "kp"].every((id) => ids.has(id)))
    return undefined;
  const { result, plain, S } = ctx;
  // The same builder as the Agreement panel, with Sarvartha Chintamani among Parashari's three books.
  const topics = agreementFor(result, plain);
  if (!topics.length) return undefined;
  return {
    id: "agreement",
    title: "At a glance: where the systems agree or differ",
    kicker: "Across the readings",
    paras: [
      {
        kind: "p",
        text: "Each system's part below reads the same life on its own terms. Here their stances are set side by side on the questions a reader asks first. No reading is merged into another: Parashari's three books are weighed one by one, and where books or systems disagree the disagreement is the finding.",
      },
      ...topics.map((t): ReportPara => ({
        kind: "p",
        text: S(t.sentence),
        tone:
          t.verdict === "agree"
            ? "support"
            : t.verdict === "disagree"
              ? "strain"
              : "mixed",
      })),
      {
        kind: "table",
        head: [
          "Topic",
          ...AGREEMENT_SYSTEMS.map((s) => AGREEMENT_SYSTEM_LABEL[s]),
        ],
        rows: topics.map((t) => [t.label, ...t.stances.map((s) => stanceCell(s, S))]),
      },
      {
        kind: "note",
        text: AGREEMENT_SYSTEMS.map((s) => `${AGREEMENT_SYSTEM_LABEL[s]}: ${AGREEMENT_METHOD[s]}`).join(" "),
      },
      ...(topics.some((t) => t.topic === "father" || t.topic === "mother")
        ? [{ kind: "note" as const, text: AGREEMENT_PARENTS_NOTE, provisional: true }]
        : []),
      { kind: "note", text: AGREEMENT_NOTE, provisional: true },
    ],
  };
}

function closing(ctx: ReportContext, modules: ReportModule[]): ReportSection {
  const { plain, withheld, deceased } = ctx;
  const systems = modules.filter(
    (m) => m.tab !== "chart" && m.tab !== "panchanga" && !m.tool,
  );
  const tools = modules.filter((m) => m.tool);
  return {
    id: "reading",
    title: "How to read this report",
    paras: [
      {
        kind: "p",
        text:
          systems.length > 1
            ? "Each system below is read on its own terms and none is used to correct another: the Nadi reading has no houses, Parashara and Krishnamurti read from the rising sign in different ways, Jaimini ranks the planets by degree, and ALP moves the lagna itself. Where they agree, the agreement is worth noting; where they differ, the difference is real and is left standing."
            : systems.length === 1
              ? "This report carries one system's reading on its own terms; the full report in the app sets it beside the others without using any one to correct another."
              : "This export carries a tool's output rather than a reading: it checks the chart against dated events or scans the minutes around the recorded time; the full report in the app carries the readings themselves.",
      },
      {
        kind: "p",
        text: "Every statement carries a numbered note to the text it comes from. A statement marked provisional applies a rule the text does not state in that form, or reads a verse whose wording is uncertain; treat it as the app's reading, not the author's.",
      },
      {
        kind: "p",
        text: plain
          ? "Sensitive matters are worded as risk and strain rather than in the old texts' terms; the practitioner reading in the app shows the verse wording."
          : "This is the practitioner reading: the texts' own wording is kept, including where it speaks of loss.",
      },
      {
        kind: "p",
        text: `Matters not yet in season at ${plain ? "your" : "the native's"} age (marriage and children from ${AREA_ONSET.marriage}, work and wealth from ${AREA_ONSET.career}) are held back rather than read. The classical length-of-life and infancy checks, the maraka planets and the remedies and mantras of the period chapters are not part of this report${tools.length ? "" : "; nor are rectification and validation, which are tools rather than readings"}.${deceased && !plain && !withheld ? " The one exception: for a life that has run its course, the agreement table sets the Jaimini span beside the recorded life, as a test of the method." : ""}${withheld ? ` ${SENSITIVE_WITHHELD_NOTE}` : ""}`,
      },
      {
        kind: "p",
        text: "One chart is one witness. What is written here can be checked against the life as it happens, and the Validate tab is built for that; it cannot prove the methods.",
      },
    ],
  };
}

function withholdSections(sections: ReportSection[]): ReportSection[] {
  return sections.map((sec) => ({
    ...sec,
    paras: sec.paras
      .map((p) => ({
        ...p,
        text: p.text === undefined ? undefined : redactProse(p.text),
        aside: p.aside === undefined ? undefined : redactProse(p.aside),
        rows: p.rows?.map((r) => r.map((c) => redactProse(c) || "—")),
      }))
      .filter((p) => p.kind === "table" || (p.text ?? "") !== ""),
    sub: sec.sub ? withholdSections(sec.sub) : undefined,
  }));
}
