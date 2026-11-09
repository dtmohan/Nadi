/**
 * The editorial lexicon.
 *
 * The room does not choose a structure at random. Each life area has one
 * fixed rhetorical frame for naming a combination and stating a limit.
 * Claims and status words are derived from the individual chart's synthesis.
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
  /** The form that names the combination. Contested areas use two rules instead. */
  anchor?: (label: string) => string;
  /** The limit, after the evidence. */
  close: string;
}

/** Lowercase an initial article so the label reads inside a sentence. */
export function inlineLabel(label: string): string {
  return /^(The|A|An)\b/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

export const AREA_STRUCTURES: Record<StructureTopic, AreaStructure> = {
  self: {
    anchor: (label) => `The chart's signature is this: ${inlineLabel(label)}.`,
    close: "It is a temperament to work with, not a verdict.",
  },
  health: {
    anchor: (label) => `One selected indication is ${inlineLabel(label)}.`,
    close: "It is a traditional indication, not a diagnosis.",
  },
  career: {
    anchor: (label) => `The configuration is ${inlineLabel(label)}.`,
    close: "It names a direction, not an appointment.",
  },
  authority: {
    anchor: (label) => `The weight sits in ${inlineLabel(label)}.`,
    close: "It describes a public weight, not an office.",
  },
  wealth: {
    anchor: (label) => `It turns on ${inlineLabel(label)}.`,
    close: "It is a reading of means, not a promise of gain.",
  },
  marriage: {
    close: "It is a traditional reading, not a verdict on the marriage.",
  },
  children: {
    anchor: (label) => `One selected indication is ${inlineLabel(label)}.`,
    close: "The traditional indications do not establish an individual outcome.",
  },
  family: {
    anchor: (label) => `One testimony reads: ${inlineLabel(label)}.`,
    close: "It keeps the testimonies separate.",
  },
  education: {
    anchor: (label) => `One selected indication is ${inlineLabel(label)}.`,
    close: "These are traditional indications, not a limit on the mind.",
  },
  spirituality: {
    anchor: (label) => `One selected indication is ${inlineLabel(label)}.`,
    close: "It is a direction, not a doctrine.",
  },
  travel: {
    anchor: (label) => `The direction is ${inlineLabel(label)}.`,
    close: "It is an opening, not an itinerary.",
  },
};
