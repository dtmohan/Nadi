/**
 * Prose lint.
 *
 * A small, explicit list of editorial tics that the room must not fall into.
 * The lexicon fixes the structures; this keeps the resulting prose honest.
 */

export interface ProseTic {
  phrase: string;
  max: number;
  why: string;
}

export const PROSE_TICS: ProseTic[] = [
  { phrase: "clearest line", max: 0, why: "the room's old default metaphor" },
  { phrase: "The line is", max: 0, why: "line used as a universal hinge" },
  { phrase: "The chart's line", max: 0, why: "line used as a universal hinge" },
  { phrase: "The combination is", max: 0, why: "one anchor form for every area" },
  { phrase: "The chart offers these as directions", max: 0, why: "repeated generic limit" },
  { phrase: "well supported", max: 2, why: "the brief and coda may share it once; no more" },
  { phrase: "asks for care", max: 2, why: "the two care claims; no summary echo" },
  { phrase: "It holds", max: 1, why: "strength percentages need varied verbs" },
  { phrase: "separate lines", max: 0, why: "family has testimonies, not lines" },
  { phrase: "The reading for", max: 0, why: "hand-holding opener" },
];

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Return one message per tic that exceeds its allowance. */
export function lintProse(text: string): string[] {
  return PROSE_TICS.flatMap(({ phrase, max, why }) => {
    const count = (text.match(new RegExp(escape(phrase), "gi")) ?? []).length;
    return count > max ? [`“${phrase}” appears ${count} times (max ${max}); ${why}.`] : [];
  });
}
