// The report model every system writes into and every renderer reads from. A module builds
// ReportSection[] from what the app already computes; the screen, the print stylesheet and the
// PDF renderer walk the same sections. Nothing here knows about any one system.
import { DateTime } from "luxon";
import type { ChartResult } from "../schema";
import type { Planet, PlanetPosition } from "../astro";
import type { ValidationResult } from "../validate-types";
import type { RectifyResult } from "../rectify-types";
import type { RectifyExportState } from "../rectify-methods";

/** Server-computed tool results a report may carry; absent when the module was not asked for. */
export interface ReportTools {
  /** Null when the chart has no dated events. */
  validation?: ValidationResult | null;
  /** The scan the Rectify tab was looking at, rerun on the server. */
  rectify?: { result: RectifyResult; state: RectifyExportState } | null;
}

export interface ReportCite {
  n: number;
  label: string;
  url?: string;
}

export interface ReportPara {
  kind: "p" | "note" | "table" | "lead";
  text?: string;
  cites?: number[];
  provisional?: boolean;
  tone?: "support" | "strain" | "mixed";
  /** Small grey line under the paragraph: evidence, relation, dates. */
  aside?: string;
  head?: string[];
  rows?: string[][];
}

export interface ReportSection {
  id: string;
  title: string;
  /** Small label above the title naming the system and its sources. */
  kicker?: string;
  paras: ReportPara[];
  sub?: ReportSection[];
}

export interface ReportDoc {
  title: string;
  subtitle: string;
  meta: string[];
  generated: string;
  plain: boolean;
  /** Module ids included, in order. */
  modules: string[];
  sections: ReportSection[];
  cites: ReportCite[];
}

/** Numbered notes, one per distinct label and URL. */
export class Cites {
  list: ReportCite[] = [];
  private key = new Map<string, number>();
  add(label: string, url?: string): number {
    const k = `${label}|${url ?? ""}`;
    const had = this.key.get(k);
    if (had) return had;
    const n = this.list.length + 1;
    this.list.push({ n, label, url });
    this.key.set(k, n);
    return n;
  }
}

/** What every module receives: the result plus the derived facts they all need. */
export interface ReportContext {
  result: ChartResult;
  plain: boolean;
  /** Soften a sentence in the plain reading; identity in the practitioner reading. */
  S: (t: string) => string;
  cites: Cites;
  asOf: string;
  /** The reading date, or the recorded date of passing. */
  lifeAt: string;
  deceased: boolean;
  age: number;
  /** The sensitive-content gate for a native under 18. */
  withheld: boolean;
  inSeason: (area: string) => boolean;
  female: boolean;
  pos: (p: Planet) => PlanetPosition;
  lagnaIdx: number;
  birthLocal: DateTime;
  tools: ReportTools;
}

export type ReportTab =
  | "chart"
  | "bnn"
  | "parashari"
  | "jaimini"
  | "kp"
  | "alp"
  | "panchanga"
  | "rectify"
  | "validate";

export interface ReportModule {
  id: string;
  /** Title used in section pickers and per-tab exports. */
  label: string;
  /** One or two words for chips and file names. */
  short: string;
  tab: ReportTab;
  /** Tools rather than readings: excluded from the Report page picker, exported from their own tab. */
  tool?: boolean;
  build: (ctx: ReportContext) => ReportSection[];
}

// ── shared formatting helpers ──
export const ORD = (n: number) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
export const fmtDate = (iso: string) =>
  DateTime.fromISO(iso).toFormat("d LLL yyyy");
export const fmtMonth = (iso: string) =>
  DateTime.fromISO(iso).toFormat("LLL yyyy");
export const list = (xs: string[]) =>
  xs.length <= 1
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const endStop = (s: string) =>
  /[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`;
