/**
 * Life events saved with a chart.
 *
 * Events are the native's remembered, dated happenings (marriage, a child, a job). They are stored
 * beside the birth data so that rectification, prediction checks and planet-nature tallies can all
 * read the same list. The matter table gives each kind of event its KP houses, the cusp that must
 * promise it, and the Jaimini life area whose dasha triggers apply.
 */
import { z } from "zod";
import type { JaiminiArea } from "./jaimini-areas";
import type { LifeArea } from "./rules";
import type { Planet } from "./astro";

export const EVENT_OUTCOMES = ["favourable", "unfavourable", "mixed"] as const;
export type EventOutcome = (typeof EVENT_OUTCOMES)[number];

export const chartEventSchema = z.object({
  id: z.string().min(1).max(40),
  /** One of EVENT_MATTERS ids; unknown ids fall back to the first matter when read. */
  matter: z.string().min(1).max(40),
  /** YYYY-MM-DD in the birth zone. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  outcome: z.enum(EVENT_OUTCOMES).optional(),
  note: z.string().max(300).optional(),
});
export type ChartEvent = z.infer<typeof chartEventSchema>;

export const chartEventsSchema = z.array(chartEventSchema).max(100);

/** Keep only well-formed events, so an old or hand-edited backup never breaks a chart. */
export function sanitiseEvents(raw: unknown): ChartEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: ChartEvent[] = [];
  for (const r of raw) {
    const p = chartEventSchema.safeParse(r);
    if (p.success) out.push(p.data);
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function newEventId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Matters a dated event can be checked against: the houses KP times them by, the cusp that must promise them, and the Jaimini area. */
export interface EventMatter {
  id: string;
  label: string;
  houses: number[];
  cusp: number;
  area?: JaiminiArea;
  /** Whether the matter is, by nature, welcome (marriage) or not (loss of job); mixed matters are judged by the outcome the user records. */
  nature: "good" | "bad" | "mixed";
  /** Nadi timing: the karakas Jupiter (and Saturn) must touch by transit, and the signs from the natal Jeeva whose passage fits the matter. */
  bnn: BnnTiming;
}

/**
 * A karaka for Nadi transit timing. Named planets are fixed (Sun for the father, Saturn for the profession);
 * the roles resolve by gender: "spouse" is Venus in a male chart and Mars in a female one, "deha" is Jupiter
 * in a male chart and Venus in a female one (Naik), "native" is Jupiter in every chart.
 */
export type BnnKaraka = Planet | "spouse" | "deha" | "native";

export interface BnnTiming {
  karakas: BnnKaraka[];
  /** Signs counted from the natal Jeeva (1..12) whose transit by Jupiter fits the matter. */
  fromJeeva: number[];
  /** The Nadi life area whose combinations Jupiter's passage should be ripening. */
  area: LifeArea;
}

// Nadi karakas by matter (Rao: Sun father, Moon mother and home, Mars land and siblings, Mercury learning and
// trade, Jupiter the native and children, Venus wife and vehicles, Saturn work and longevity, Rahu foreign
// places, Ketu illness and endings). The from-Jeeva signs follow the same counting as the BNN transit reading.
const B = (karakas: BnnKaraka[], fromJeeva: number[], area: LifeArea): BnnTiming => ({ karakas, fromJeeva, area });

export const EVENT_MATTERS: EventMatter[] = [
  { id: "marriage", label: "Marriage", houses: [2, 7, 11], cusp: 7, area: "marriage", nature: "good", bnn: B(["spouse", "deha"], [7, 11], "marriage") },
  { id: "child", label: "Birth of a child", houses: [2, 5, 11], cusp: 5, area: "children", nature: "good", bnn: B(["native", "deha"], [1, 5, 9], "children") },
  { id: "job", label: "New job, promotion", houses: [2, 6, 10, 11], cusp: 10, area: "career", nature: "good", bnn: B(["Saturn"], [10, 11, 6], "career") },
  { id: "job-loss", label: "Loss of job", houses: [5, 8, 12], cusp: 10, area: "career", nature: "bad", bnn: B(["Saturn"], [8, 12, 6], "career") },
  { id: "business", label: "Started a business", houses: [2, 7, 10, 11], cusp: 10, area: "career", nature: "good", bnn: B(["Saturn", "Mercury"], [10, 11, 7], "career") },
  { id: "property", label: "Bought a house or land", houses: [4, 11, 12], cusp: 4, area: "family", nature: "good", bnn: B(["Mars", "Moon"], [4, 11], "wealth") },
  // Vehicles are a movement matter in KP: the 4th is the static house whose vehicles "though repaired cannot be put
  // on the road"; roadworthy ones come when the 4th (and 3rd) sub lords tie to 3, 11 and 12, and "from light to heavy
  // vehicles 3-12-11-1" (Astro Secrets & KP Part 1 pp. 135-137). Promise is still read at the 4th cusp.
  { id: "vehicle", label: "Bought a vehicle", houses: [3, 11, 12], cusp: 4, area: "wealth", nature: "good", bnn: B(["Venus"], [4, 11], "wealth") },
  { id: "education", label: "Admission to higher study", houses: [4, 9, 11], cusp: 4, area: "children", nature: "good", bnn: B(["Mercury", "native"], [5, 9, 4], "education") },
  { id: "abroad", label: "Went abroad", houses: [3, 9, 12], cusp: 12, area: "family", nature: "mixed", bnn: B(["Rahu"], [12, 9, 3], "travel") },
  { id: "return", label: "Returned from abroad", houses: [2, 4, 11], cusp: 4, area: "family", nature: "mixed", bnn: B(["Rahu", "Moon"], [4, 2], "travel") },
  { id: "illness", label: "Illness, operation, hospital", houses: [6, 8, 12], cusp: 6, area: "health", nature: "bad", bnn: B(["deha", "Ketu"], [6, 8, 12], "health") },
  { id: "accident", label: "Accident", houses: [6, 8, 12], cusp: 8, area: "health", nature: "bad", bnn: B(["Mars", "deha"], [6, 8], "health") },
  { id: "father", label: "Loss of father", houses: [3, 4, 8], cusp: 9, area: "family", nature: "bad", bnn: B(["Sun"], [9, 8], "family") },
  { id: "mother", label: "Loss of mother", houses: [3, 8, 11], cusp: 4, area: "family", nature: "bad", bnn: B(["Moon"], [4, 8], "family") },
  { id: "spouse", label: "Loss of spouse", houses: [1, 2, 6, 10], cusp: 7, area: "marriage", nature: "bad", bnn: B(["spouse"], [7, 8], "marriage") },
  { id: "move", label: "Change of residence", houses: [3, 12], cusp: 4, area: "family", nature: "mixed", bnn: B(["Moon", "Rahu"], [4, 12, 3], "family") },
  { id: "litigation", label: "Won a case", houses: [1, 6, 11], cusp: 6, area: "health", nature: "good", bnn: B(["Mars", "Saturn"], [6, 11], "self") },
  { id: "loan", label: "Loan or large receipt", houses: [2, 6, 11], cusp: 6, area: "wealth", nature: "mixed", bnn: B(["native", "Venus"], [2, 11, 6], "wealth") },
];

/** Resolve a matter's Nadi karakas for a chart's gender, without duplicates. */
export function bnnKarakasFor(t: BnnTiming, roles: { native: Planet; deha: Planet; spouse: Planet }): Planet[] {
  const out: Planet[] = [];
  for (const k of t.karakas) {
    const p = k === "spouse" ? roles.spouse : k === "deha" ? roles.deha : k === "native" ? roles.native : k;
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

export function matterOf(id: string): EventMatter {
  return EVENT_MATTERS.find((m) => m.id === id) ?? EVENT_MATTERS[0];
}

/** The outcome to judge a planet by: the recorded outcome, else the matter's own nature. */
export function effectiveOutcome(e: ChartEvent): EventOutcome {
  if (e.outcome) return e.outcome;
  const n = matterOf(e.matter).nature;
  return n === "good" ? "favourable" : n === "bad" ? "unfavourable" : "mixed";
}
