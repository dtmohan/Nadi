// The combining kernel.
//
// Readings in the app come from separate witnesses: the books inside a school (BPHS, Phaladeepika and Sarvartha
// Chintamani inside Parashari) and the schools themselves (Nadi, Parashari, Jaimini, KP). This module is the one
// place they are combined, and the same functions serve every level and every topic.
//
// - weigh(): the rules of one book are parts of one teaching, so they are weighed. A book supports when at least
//   two-thirds of the rules that fire point that way, strains likewise, and is mixed otherwise. No classical text
//   gives this threshold; it is the app's convention (provisional).
// - combineTexts() and combineSchools(): separate books, and separate schools, are separate witnesses. Combining
//   them depends only on which stances are present, never on how many voices hold them, so the number of books
//   cannot decide a result and a dissent is never averaged away: some support and some strain is "contested";
//   all firmly one way is that way; one way beside voices that do not commit "leans" that way; no direction at
//   all is "mixed". A contested voice already holds support and strain, so it carries both into any further
//   combination. A silent voice changes nothing.
//
// Inputs are checked before anything is combined, and a failed check throws (fail closed): an unknown source, a
// voice that speaks without a citation, two voices with one id, a book voice where a school voice belongs, two
// voices of one school in a cross-school comparison, and evidence the age gate withholds. A combined stance
// carries the weakest provenance among the voices that spoke.
//
// The kernel says whether readings line up, not whether they are right; that stays with the validation suite.
// It imports no school code: the adapters (shared/agreement.ts) turn each school's findings into voices.

/** A voice's position on one question. */
export type Stance =
  | "supports"
  | "strains"
  | "leans-supports"
  | "leans-strains"
  | "mixed"
  | "contested"
  | "silent";

export const STANCES: readonly Stance[] = [
  "supports",
  "leans-supports",
  "mixed",
  "contested",
  "leans-strains",
  "strains",
  "silent",
];

/**
 * How the direction of a piece of evidence was established, strongest first. "sourced": the rule and its
 * direction are cited to a verse, sutra or page. "provisional": the rule rests on a reading the app marks
 * provisional, or is cited only to a method. "keyword": the direction is read from the rule's wording.
 */
export type Tier = "sourced" | "provisional" | "keyword";

export const TIERS: readonly Tier[] = ["sourced", "provisional", "keyword"];

const TIER_RANK: Record<Tier, number> = { sourced: 2, provisional: 1, keyword: 0 };

/** Default reason shown for a voice below "sourced". */
export const TIER_REASON: Record<Exclude<Tier, "sourced">, string> = {
  provisional: "rests on a reading the app marks provisional",
  keyword: "the direction is read from the rule's wording",
};

export interface Cite {
  label: string;
  url?: string;
}

/** One rule that fired, as its book gives it. */
export interface Evidence {
  /** "both": a rule that pulls both ways; it counts half to each side. */
  tone: "support" | "strain" | "both";
  /** The statement as the reader is shown it, after any redaction; the age gate is checked on this text. */
  text: string;
  cite: Cite;
  tier: Tier;
  /** Why the item is below "sourced", when it is. */
  reason?: string;
}

export type VoiceKind = "text" | "school";

export interface Voice {
  /** A source id from the manifest: a book ("bphs") or a school ("parashari"). */
  id: string;
  kind: VoiceKind;
  /** The school the voice belongs to; a school's own voice has its own id here. */
  school: string;
  stance: Stance;
  /** Weakest provenance among what the voice rests on; "sourced" when silent. */
  tier: Tier;
  /** Why the voice is below "sourced", when it is. */
  reason?: string;
  /** One clause of evidence. */
  note: string;
  cites: Cite[];
  /** For a combined voice: the voices it was made from, in input order. */
  from?: Voice[];
}

/** Agreement across schools. "mixed": every school that reads the question is mixed or split within itself. */
export type Verdict = "agree" | "lean" | "mixed" | "disagree" | "quiet";

export interface Corroboration {
  stance: Stance;
  verdict: Verdict;
  tier: Tier;
  reason?: string;
  /** Schools that took a stance. */
  spoken: number;
  voices: Voice[];
}

/** The books each school is read from, by id. The kernel accepts no voice that is not listed here. */
export interface SourceManifest {
  [school: string]: { label: string; texts: Record<string, { label: string }> };
}

export class KernelInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KernelInputError";
  }
}

const fail = (message: string): never => {
  throw new KernelInputError(message);
};

const isUp = (s: Stance) => s === "supports" || s === "leans-supports";
const isDown = (s: Stance) => s === "strains" || s === "leans-strains";
// A contested voice holds support and strain already; combining must not average its dispute away.
const holdsUp = (s: Stance) => isUp(s) || s === "contested";
const holdsDown = (s: Stance) => isDown(s) || s === "contested";
const isFirm = (s: Stance) => s === "supports" || s === "strains";

/**
 * The combining rule for independent voices. The result depends only on the set of stances present: order and
 * repetition do not matter, and a silent voice changes nothing.
 */
export function combineStances(stances: readonly Stance[]): Stance {
  for (const s of stances) if (!STANCES.includes(s)) fail(`unknown stance "${String(s)}"`);
  const spoken = stances.filter((s) => s !== "silent");
  if (!spoken.length) return "silent";
  const up = spoken.some(holdsUp);
  const down = spoken.some(holdsDown);
  if (up && down) return "contested";
  // All firm and none opposed: every voice holds the same direction.
  if (spoken.every(isFirm)) return spoken[0];
  if (up) return "leans-supports";
  if (down) return "leans-strains";
  return "mixed";
}

/** The weighing rule inside one book: two-thirds of the rules that fire (the app's convention, provisional). */
export function proportion(support: number, strain: number): Stance {
  if (!(support >= 0) || !(strain >= 0)) fail("rule counts must be non-negative numbers");
  if (support + strain === 0) return "silent";
  if (support >= 2 * strain) return "supports";
  if (strain >= 2 * support) return "strains";
  return "mixed";
}

/** The cross-school verdict read off the combined stance. One school alone cannot agree with itself. */
export function verdictOf(stance: Stance, spoken: number): Verdict {
  if (spoken < 2) return "quiet";
  if (stance === "contested") return "disagree";
  if (isFirm(stance)) return "agree";
  if (stance === "mixed") return "mixed";
  return "lean";
}

function weakest<T extends { tier: Tier; reason?: string }>(xs: readonly T[]): { tier: Tier; reason?: string } {
  let out: { tier: Tier; reason?: string } = { tier: "sourced" };
  for (const x of xs)
    if (TIER_RANK[x.tier] < TIER_RANK[out.tier])
      out = { tier: x.tier, reason: x.reason ?? TIER_REASON[x.tier as Exclude<Tier, "sourced">] };
  return out;
}

function uniqueCites(cs: readonly Cite[]): Cite[] {
  const seen = new Set<string>();
  const out: Cite[] = [];
  for (const c of cs)
    if (!seen.has(c.label)) {
      seen.add(c.label);
      out.push(c);
    }
  return out;
}

/** The rule that leads a book's voice: the first that points the way the book does, else the first. */
export function leadOf(stance: Stance, evidence: readonly Evidence[]): Evidence | undefined {
  const want = stance === "supports" ? "support" : stance === "strains" ? "strain" : null;
  return (want && evidence.find((e) => e.tone === want)) || evidence[0];
}

function checkTier(t: Tier, what: string) {
  if (!TIERS.includes(t)) fail(`${what}: unknown provenance tier "${String(t)}"`);
}

function checkVoice(v: Voice) {
  if (!STANCES.includes(v.stance)) fail(`${v.id}: unknown stance "${String(v.stance)}"`);
  checkTier(v.tier, v.id);
  if (v.stance !== "silent" && !v.cites.some((c) => c.label.trim()))
    fail(`${v.id}: a voice that takes a stance must cite its source`);
}

function checkDistinct(vs: readonly Voice[]) {
  const ids = new Set<string>();
  for (const v of vs) {
    if (ids.has(v.id)) fail(`${v.id}: one voice per source; it was given twice`);
    ids.add(v.id);
  }
}

export interface WeighOptions {
  /** True for a statement the age gate withholds; such evidence must be removed before weighing. */
  gate?: (text: string) => boolean;
  /** The voice's note. By default, the first rule that points the way the book does, or the first rule. */
  note?: (stance: Stance, evidence: readonly Evidence[]) => string;
}

export interface SchoolVoiceOptions {
  /** As for weigh(): checked on the note and on every statement the voice rests on. */
  gate?: (text: string) => boolean;
  texts?: readonly string[];
}

export interface CombineOptions {
  note?: (stance: Stance, voices: readonly Voice[]) => string;
}

/** The kernel, bound to the manifest of schools and books it may combine. */
export function makeKernel(manifest: SourceManifest) {
  const schoolOf = (textId: string): string | undefined =>
    Object.keys(manifest).find((s) => textId in manifest[s].texts);

  const knownSchool = (id: string) => {
    if (!(id in manifest)) fail(`unknown school "${id}"`);
  };

  /** One book's voice: its rules that fired, weighed by proportion. */
  function weigh(textId: string, evidence: readonly Evidence[], opts: WeighOptions = {}): Voice {
    const school = schoolOf(textId) ?? fail(`unknown book "${textId}"`);
    let support = 0;
    let strain = 0;
    for (const e of evidence) {
      if (e.tone !== "support" && e.tone !== "strain" && e.tone !== "both")
        fail(`${textId}: unknown tone "${String(e.tone)}"`);
      checkTier(e.tier, textId);
      if (!e.cite?.label?.trim()) fail(`${textId}: every rule must cite its verse or page`);
      if (opts.gate?.(e.text)) fail(`${textId}: a statement the age gate withholds reached the kernel`);
      if (e.tone === "support") support += 1;
      else if (e.tone === "strain") strain += 1;
      else {
        support += 0.5;
        strain += 0.5;
      }
    }
    const stance = proportion(support, strain);
    const prov = stance === "silent" ? { tier: "sourced" as Tier } : weakest(evidence);
    return {
      id: textId,
      kind: "text",
      school,
      stance,
      ...prov,
      note: opts.note ? opts.note(stance, evidence) : (leadOf(stance, evidence)?.text ?? ""),
      cites: uniqueCites(evidence.map((e) => e.cite)),
    };
  }

  /** A school's own voice, for a school read by one method with its own verdict rule (Nadi, Jaimini, KP). */
  function schoolVoice(
    school: string,
    v: Omit<Voice, "id" | "kind" | "school" | "from">,
    opts: SchoolVoiceOptions = {},
  ): Voice {
    knownSchool(school);
    if (opts.gate)
      for (const t of [v.note, ...(opts.texts ?? [])])
        if (opts.gate(t)) fail(`${school}: a statement the age gate withholds reached the kernel`);
    const out: Voice = { ...v, id: school, kind: "school", school };
    checkVoice(out);
    return out;
  }

  /** A school's voice from its books' voices. */
  function combineTexts(school: string, voices: readonly Voice[], opts: CombineOptions = {}): Voice {
    knownSchool(school);
    for (const v of voices) {
      if (v.kind !== "text") fail(`${v.id}: only book voices combine into a school's voice`);
      if (v.school !== school || !(v.id in manifest[school].texts))
        fail(`${v.id}: not a book of ${manifest[school].label}`);
      checkVoice(v);
    }
    checkDistinct(voices);
    const stance = combineStances(voices.map((v) => v.stance));
    const spoken = voices.filter((v) => v.stance !== "silent");
    return {
      id: school,
      kind: "school",
      school,
      stance,
      ...weakest(spoken),
      note: opts.note ? opts.note(stance, voices) : (spoken[0]?.note ?? ""),
      cites: uniqueCites(spoken.flatMap((v) => v.cites)),
      from: [...voices],
    };
  }

  /** Corroboration across schools: one voice per school, and books never stand in for schools. */
  function combineSchools(voices: readonly Voice[]): Corroboration {
    for (const v of voices) {
      if (v.kind !== "school") fail(`${v.id}: a book's voice cannot stand in for a school`);
      knownSchool(v.id);
      checkVoice(v);
    }
    checkDistinct(voices);
    const stance = combineStances(voices.map((v) => v.stance));
    const spokenVoices = voices.filter((v) => v.stance !== "silent");
    return {
      stance,
      verdict: verdictOf(stance, spokenVoices.length),
      ...weakest(spokenVoices),
      spoken: spokenVoices.length,
      voices: [...voices],
    };
  }

  return { weigh, schoolVoice, combineTexts, combineSchools };
}
