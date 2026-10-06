/**
 * Graded lines.
 *
 * A combination that fires is a promise of a given strength, not a yes or no. Each line carries a
 * grade (full, enhanced, reduced or cancelled) and the reasons behind it, each with its source.
 * The principle behind a reason may be classical, but the size of every weight is this app's own
 * convention, and is labelled provisional wherever the grade is shown.
 */

export type GradeLevel = "full" | "enhanced" | "reduced" | "cancelled";

export interface GradeReason {
  /** Plain statement of the factor, e.g. "Venus in the 12th from Mercury". */
  text: string;
  /**
   * "up" and "down" move the grade; "weight" is already in the line's score and ranks it (the
   * sign relation, companions apart) but does not set the grade; "note" carries no weight.
   */
  effect: "up" | "down" | "weight" | "note";
  /** Multiplier for an up, down or weight reason. */
  factor?: number;
  /** Where the principle is stated; absent when the reason is this app's own convention. */
  source?: string;
  /**
   * The principle itself is this app's reading, not a stated rule (the bond's tightness and
   * approach). It moves the grade but not the line's score, so it cannot decide which lines print.
   */
  gradeOnly?: boolean;
}

export interface Grade {
  level: GradeLevel;
  /** Net strength multiplier that sets the level (1 = the combination as written). */
  ratio: number;
  reasons: GradeReason[];
}

export const GRADE_LABEL: Record<GradeLevel, string> = {
  full: "Full",
  enhanced: "Enhanced",
  reduced: "Reduced",
  cancelled: "Cancelled",
};

/** Dots for scanning a list: enhanced 3, full 2, reduced 1, cancelled none. */
export const GRADE_DOTS: Record<GradeLevel, number> = {
  enhanced: 3,
  full: 2,
  reduced: 1,
  cancelled: 0,
};

export function levelOf(ratio: number): GradeLevel {
  if (ratio >= 1.05) return "enhanced";
  if (ratio >= 0.95) return "full";
  return "reduced";
}

/** Strength reasons never move a line by more than this, in either direction. */
export const GRADE_FLOOR = 0.5;
export const GRADE_CEILING = 1.35;

export const GRADE_NOTE =
  "Each line carries a grade: full, enhanced or reduced. The grade is the planets' strength under Rao's basic rules and Naik (dignity and its cancellations, hemming, combustion, the degree contest, retrogression's half strength) and, for planets in one direction, how tight and how close the bond is. The sign relation (same sign, trine, 2nd, 12th or 7th) is printed as the line's weight and ranks the lines, but does not set the grade: each is a Nadi combination in its own right, and their relative weights are this app's. The bond's tightness and approach are this app's reading, not a stated rule, so they move the grade but not which lines are printed. The principles are cited beside each line; the size of every weight is this app's own convention.";

const fmtFactor = (x: number) => `×${x.toFixed(2).replace(/0$/, "").replace(/\.$/, "")}`;

/**
 * One line for a grade. `detail` adds sources, weights and the reasons that carry no weight;
 * without it the line names only what raised or lowered the grade.
 */
export function gradeSummary(g: Grade, detail = false): string {
  return `${GRADE_LABEL[g.level]}: ${gradeReasons(g, detail)}`;
}

/** The reasons alone, joined for one line. */
export function gradeReasons(g: Grade, detail = false): string {
  const moved = g.reasons.filter((r) => r.effect === "up" || r.effect === "down");
  // Without detail: the sign relation (its weight) and what moved the grade; a line nothing moved
  // shows its notes instead.
  const shown = detail
    ? g.reasons
    : moved.length
      ? g.reasons.filter((r) => r.effect !== "note")
      : g.reasons;
  const bits = shown.map((r) => {
    const tail: string[] = [];
    if (detail && r.source) tail.push(r.source);
    if (detail && r.gradeOnly) tail.push("this app's reading, grade only");
    if (detail && r.factor !== undefined && r.effect !== "note")
      tail.push(r.effect === "weight" ? `weight ${fmtFactor(r.factor)}` : fmtFactor(r.factor));
    return tail.length ? `${r.text} (${tail.join(", ")})` : r.text;
  });
  return bits.length ? bits.join("; ") : "nothing raises or lowers it";
}

export const DIRECTION_NOTE =
  "A direction line says which planet leads by degree: the planet ahead gives its significations to the one behind (Rao's basic rules; Naik). What each planet gives and receives is this app's wording, and is provisional.";
