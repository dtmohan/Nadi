/** Explicit conventions for time-derived Gulika/Mandi. The names do not assert universal identity. */
export const GULIKA_METHODS = [
  {
    id: "kerala-ghati",
    label: "Kerala weekday constants",
    short: "Kerala constants",
    note: "Prasna Marga (Raman, 5.14–16 notes) uses these Mandi constants for its Gulika; Prashnanushthana Paddhati 3.9–10 gives the same method.",
  },
  {
    id: "saturn-start",
    label: "Start of Saturn's portion",
    short: "Saturn portion: start",
    note: "The start convention for Gulika in Sreenadh's birth-time-rectification study, which interprets it from Parashara; other translations interpret the wording differently.",
  },
  {
    id: "saturn-middle",
    label: "Middle of Saturn's portion",
    short: "Saturn portion: middle",
    note: "The midpoint of the seven-lord Saturn portion, used for Mandi in Sarajit Poddar's daytime worked example. His printed night table differs on Wednesday–Saturday.",
  },
  {
    id: "poddar-table",
    label: "Poddar's printed Mandi table",
    short: "Poddar's table",
    note: "Poddar's published weekday table uses 32 parts. For Wednesday–Saturday nights its values differ by one eighth from a seven-lord Saturn midpoint; the reason is not stated.",
  },
  {
    id: "saturn-end",
    label: "End of Saturn's portion",
    short: "Saturn portion: end",
    note: "A Gulika convention described in Raman's Prasna Marga notes and in an Uttara Kalamrita translation; its house reading remains a cross-convention comparison.",
  },
] as const;

export type GulikaMethod = (typeof GULIKA_METHODS)[number]["id"];
export const DEFAULT_GULIKA_METHOD: GulikaMethod = "kerala-ghati";
export const normaliseGulikaMethod = (value: unknown): GulikaMethod =>
  GULIKA_METHODS.some((method) => method.id === value) ? value as GulikaMethod : DEFAULT_GULIKA_METHOD;

export interface GulikaPoint {
  lon: number;
  signIndex: number;
  day: boolean;
  /** UT Julian day of the source-specific rising instant. */
  risingJd: number;
}

export type GulikaComparisons = Record<GulikaMethod, GulikaPoint>;
