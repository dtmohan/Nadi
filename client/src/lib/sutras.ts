export interface Sutra {
  ref: string;
  ch: number;
  pd: number;
  n: number;
  sanskrit: string;
  text: string;
  notes: string;
}

export const PADA_TITLE: Record<string, string> = {
  "1.1": "Definitions: aspects, argala, karakas, arudha, special lagnas",
  "1.2": "Karakamsa: the Atmakaraka's navamsa and the houses from it",
  "1.3": "Arudha lagna: wealth, its sources and raja yogas",
  "1.4": "Upapada: the spouse, children and siblings",
  "2.1": "Longevity: the three pairs, Rudra, Maheswara and Brahma",
  "2.2": "Parents, Shoola dasa",
  "2.3": "Sthira dasa and sources of strength",
  "2.4": "Navamsa dasa and Bhoga rasis",
};

/** Parse "1.2.16" or "1.2.2-13" (also "1.2.106-108") into a predicate over sutras. */
export function parseRef(ref: string): { ch: number; pd: number; from: number; to: number } | null {
  const m = /^(\d)\.(\d)\.(\d+)(?:-(\d+))?$/.exec(ref.trim());
  if (!m) return null;
  const from = Number(m[3]);
  return { ch: Number(m[1]), pd: Number(m[2]), from, to: m[4] ? Number(m[4]) : from };
}

export function matchesRef(s: Sutra, ref: string): boolean {
  const r = parseRef(ref);
  if (!r) return false;
  return s.ch === r.ch && s.pd === r.pd && s.n >= r.from && s.n <= r.to;
}

/** A rule source may cite several ranges ("1.2.14, 1.4.2"); link to the first. */
export function sutraHref(ref: string): string {
  const first = ref.split(",")[0].trim();
  return `#/sutras/${encodeURIComponent(first)}`;
}
