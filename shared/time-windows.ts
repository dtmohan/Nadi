// How long each divisional lagna holds around the recorded birth time, and which readings rest on it.
// In the D-n chart the lagna moves n times as fast as in the rasi, so the finer the chart, the shorter
// the window. The windows are measured on the server from the ephemeris (server/lagna-windows.ts);
// this module is shared so that the panels and the report read them the same way. No reading changes
// here: a reading that rests on a lagna is only marked, and the mark says how far the time can move.
import type { VargaKey } from "./vargas";

export interface LagnaWindow {
  /** Minutes before the recorded time during which this chart's lagna keeps its sign. */
  before: number;
  /** Minutes after the recorded time. */
  after: number;
  /** The search stopped at its limit on that side. */
  beforeCapped?: boolean;
  afterCapped?: boolean;
}

export type LagnaWindows = Partial<Record<VargaKey, LagnaWindow>>;

/** How far each way the server looks, in minutes. */
export const WINDOW_LIMIT_MIN = 360;

/** Readings that rest on a lagna, by finding id: the navamsa lagna, or the rasi lagna that picks the lord. */
export const LAGNA_READINGS: {
  varga: VargaKey;
  what: string;
  match: (id: string, text: string) => boolean;
}[] = [
  { varga: "D9", what: "the navamsa lagna", match: (id) => id === "pa-h7-18-32" },
  {
    varga: "D9",
    what: "the navamsa lagna (which places the 7th of the navamsa)",
    match: (id, text) => id === "pa-h7-18-19" && text.includes("7th navamsa"),
  },
  { varga: "D1", what: "the lagna (which picks the lagna lord)", match: (id) => id.startsWith("pa-yoga-36-38-") },
  { varga: "D1", what: "the lagna (which picks the 2nd lord)", match: (id) => id === "pa-h2-13-11" },
];

export interface TimeRest {
  varga: VargaKey;
  what: string;
  window: LagnaWindow;
  /** Minutes to the nearer change of sign, and on which side of the recorded time it falls. */
  nearest: number;
  side: "before" | "after";
  /** The chart's stated time uncertainty reaches past the nearer change. */
  sensitive: boolean;
}

/** Whether a window is crossed by the stated uncertainty (minutes either way). */
export const crossedBy = (w: LagnaWindow, bandMin: number) =>
  bandMin > 0 && Math.min(w.before, w.after) < bandMin;

export function restOn(varga: VargaKey, what: string, windows: LagnaWindows | undefined, bandMin: number): TimeRest | undefined {
  const w = windows?.[varga];
  if (!w) return undefined;
  const side = w.before <= w.after ? "before" : "after";
  return { varga, what, window: w, nearest: Math.min(w.before, w.after), side, sensitive: crossedBy(w, bandMin) };
}

export function timeRest(id: string, text: string, windows: LagnaWindows | undefined, bandMin: number): TimeRest | undefined {
  const r = LAGNA_READINGS.find((x) => x.match(id, text));
  return r ? restOn(r.varga, r.what, windows, bandMin) : undefined;
}

export const fmtMin = (m: number, capped?: boolean) =>
  capped ? `over ${Math.round(m / 60)} hours` : m >= 100 ? `${Math.round(m)} min` : `${m.toFixed(1)} min`;

/** One sentence for a reading that rests on a lagna. */
export function timeRestText(t: TimeRest, bandMin: number): string {
  const w = t.window;
  const span = `${t.what} holds from ${fmtMin(w.before, w.beforeCapped)} before to ${fmtMin(w.after, w.afterCapped)} after the recorded birth time`;
  return t.sensitive
    ? `Rests on the birth time: ${span}, so the stated ±${bandMin}-minute band could change it.`
    : `Rests on the birth time: ${span}.`;
}
