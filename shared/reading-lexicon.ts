/**
 * The editorial lexicon.
 *
 * The room does not choose a structure at random. Each life area has one
 * fixed rhetorical frame: a claim, the form in which its combination is
 * named, a limit, and the status word used in the brief and the coda.
 *
 * Add an area only by adding an entry here, and keep the prose lint green.
 */

export type StructureTopic =
  | "self"
  | "health"
  | "career"
  | "authority"
  | "wealth"
  | "marriage"
  | "children"
  | "family"
  | "education"
  | "spirituality"
  | "travel";

export interface AreaStructure {
  /** The opening claim. One per area; never shared. */
  claim: string;
  /** The form that names the combination. Contested areas use two rules instead. */
  anchor?: (label: string) => string;
  /** The limit, after the evidence. */
  close: string;
  /** The word used in the brief and the chapter coda. */
  status: string;
}

/** Lowercase an initial article so the label reads inside a sentence. */
export function inlineLabel(label: string): string {
  return /^(The|A|An)\b/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

export const AREA_STRUCTURES: Record<StructureTopic, AreaStructure> = {
  self: {
    claim: "The native is warmly marked.",
    anchor: (label) => `The chart's signature is this: ${inlineLabel(label)}.`,
    close: "It is a temperament to work with, not a verdict.",
    status: "well supported",
  },
  health: {
    claim: "The body asks for care rather than confidence.",
    anchor: (label) => `The caution sits in ${inlineLabel(label)}.`,
    close: "It is a traditional indication, not a diagnosis.",
    status: "a caution",
  },
  career: {
    claim: "Work is the chart's most public fact.",
    anchor: (label) => `The configuration is ${inlineLabel(label)}.`,
    close: "It names a direction, not an appointment.",
    status: "a strength",
  },
  authority: {
    claim: "Standing is unusually clear.",
    anchor: (label) => `The weight sits in ${inlineLabel(label)}.`,
    close: "It describes a public weight, not an office.",
    status: "clear",
  },
  wealth: {
    claim: "Money follows the work.",
    anchor: (label) => `It turns on ${inlineLabel(label)}.`,
    close: "It is a reading of means, not a promise of gain.",
    status: "supported",
  },
  marriage: {
    claim: "Marriage is where the chart becomes an argument.",
    close: "It is a contested reading, not a verdict on the marriage.",
    status: "contested in D1",
  },
  children: {
    claim: "Children are lightly marked.",
    anchor: (label) => `The mark is small: ${inlineLabel(label)}.`,
    close: "It is a light mark, not a claim about children.",
    status: "lightly marked",
  },
  family: {
    claim: "Family is a set of separate testimonies, not one verdict.",
    anchor: (label) => `One testimony reads: ${inlineLabel(label)}.`,
    close: "It keeps the testimonies separate.",
    status: "read separately",
  },
  education: {
    claim: "Learning asks for care rather than confidence.",
    anchor: (label) => `The strain shows in ${inlineLabel(label)}.`,
    close: "It is a caution about the instrument, not a limit on the mind.",
    status: "a caution",
  },
  spirituality: {
    claim: "The inner life carries unusual support.",
    anchor: (label) => `The support sits in ${inlineLabel(label)}.`,
    close: "It is a direction, not a doctrine.",
    status: "supported",
  },
  travel: {
    claim: "Travel is one of the chart's open directions.",
    anchor: (label) => `The direction is ${inlineLabel(label)}.`,
    close: "It is an opening, not an itinerary.",
    status: "open",
  },
};
