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
import { synthesize } from "../synthesis";
import { readAreas } from "../jaimini-areas";
import { computeParashari, DEFAULT_ASPECT_FLOOR } from "../parashari";
import { computeKp } from "../kp";
import {
  AGREEMENT_NOTE,
  AGREEMENT_SYSTEM_LABEL,
  computeAgreement,
  type AgreementSystem,
} from "../agreement";

const AGREEMENT_SYSTEMS: AgreementSystem[] = [
  "bnn",
  "parashari",
  "jaimini",
  "kp",
];

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

  // Each module returns its sections; the sky-today section from Panchanga is moved to the end
  // so the document keeps its reading order: chart, day, readings, transits, how to read.
  const sections: ReportSection[] = [];
  let skyToday: ReportSection | undefined;
  for (const m of modules) {
    for (const s of m.build(ctx)) {
      if (s.id === "now") skyToday = s;
      else sections.push(s);
    }
  }
  if (skyToday) sections.push(skyToday);
  const agreement = agreementSection(ctx, modules);
  if (agreement) sections.push(agreement);
  sections.push(closing(ctx, modules));

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
    // The sensitive-content gate: for a native under 18 every statement on length of life, marakas, arishta or the loss of a parent is removed, in either reading mode.
    sections: ctx.withheld ? withholdSections(sections) : sections,
    cites: ctx.cites.list,
  };
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
  const { result, plain, withheld, lifeAt, inSeason, S } = ctx;
  const topics = computeAgreement({
    bnn: synthesize(result.reading, result.reading.roles.gender),
    jaimini: readAreas(result.jaimini, result.positions, withheld),
    parashari: computeParashari(
      result.positions,
      result.jaimini.lagna.lon,
      result.utc,
      lifeAt,
      result.shadbala,
      result.dasaStarts,
      DEFAULT_ASPECT_FLOOR,
      withheld,
    ),
    kp: computeKp(result.kp, result.utc, lifeAt, false, withheld),
    ayur: result.jaimini.ayur,
    withheld,
    plain,
    inSeason,
  });
  if (!topics.length) return undefined;
  return {
    id: "agreement",
    title: "Where the systems agree or differ",
    kicker: "Across the readings",
    paras: [
      {
        kind: "p",
        text: "Each system above reads the same life on its own terms. This table sets their verdicts side by side on the questions a reader asks first; nothing is blended, and where they disagree the disagreement is the finding.",
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
        rows: topics.map((t) => [
          t.label,
          ...t.stances.map((s) => `${cap(s.word)}: ${S(s.note)}`),
        ]),
      },
      { kind: "note", text: AGREEMENT_NOTE, provisional: true },
    ],
  };
}

function closing(ctx: ReportContext, modules: ReportModule[]): ReportSection {
  const { plain, withheld } = ctx;
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
            ? "Each system above is read on its own terms and none is used to correct another: the Nadi reading has no houses, Parashara and Krishnamurti read from the rising sign in different ways, Jaimini ranks the planets by degree, and ALP moves the lagna itself. Where they agree, the agreement is worth noting; where they differ, the difference is real and is left standing."
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
        text: `Matters not yet in season at the native's age (marriage and children from ${AREA_ONSET.marriage}, work and wealth from ${AREA_ONSET.career}) are held back rather than read. The classical length-of-life and infancy checks, the maraka planets and the remedies and mantras of the period chapters are not part of this report${tools.length ? "" : "; nor are rectification and validation, which are tools rather than readings"}.${withheld ? ` ${SENSITIVE_WITHHELD_NOTE}` : ""}`,
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
