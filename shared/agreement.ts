// Where the systems agree.
//
// Each system on the chart page reads the same life on its own terms and the app keeps them apart. This module
// lines up the four systems that give area verdicts (Nadi, Parashari, Jaimini, KP) on six questions and says
// plainly whether they agree, lean one way, are mixed, or disagree. It holds the adapters, each of which turns
// one school's findings into a voice; all combining is done by shared/kernel.ts, the same way at every level.
//
// - Nadi, Jaimini and KP are each read by one method with its own verdict rule, and the voice is the verdict
//   their own tab shows. For father and mother the same rule is applied to the rules that name the parent.
// - Parashari is read from three books. Each book's rules are weighed on their own, and the kernel combines the
//   three book voices into the Parashari voice, so a dispute between the books stays visible.
// - The cross-school verdict is the kernel's combination of the four school voices.
//
// Statements withheld for a minor never reach the kernel: the age gate removes them first, and the kernel
// refuses any that arrive. The weighing and the comparison are the app's conventions (provisional).

import {
  firstClause,
  gist,
  synthesize,
  synthesizeArea,
  toneIsKeyword,
  toneOf,
  type AreaSynthesis,
} from "./synthesis";
import type { LifeArea, Reading } from "./rules";
import { readAreas, type AreaReading, type Note } from "./jaimini-areas";
import { JAIMINI_TEXT_SOURCE } from "./rules-jaimini";
import {
  computeParashari,
  DEFAULT_ASPECT_FLOOR,
  type ParashariFinding,
  type ParashariResult,
} from "./parashari";
import { BPHS_URL } from "./parashari-data";
import { computeKp, isConditional, nearestChangeText, type KpResult } from "./kp";
import type { KpFinding } from "./rules-kp";
import type { AyurResult } from "./jaimini-ayur";
import {
  SC_BHAVA_RULES,
  sarvarthaLeftOut,
  sarvarthaTone,
  type SarvarthaFinding,
  type SarvarthaResult,
} from "./sarvartha";
import { areaSeason, lifeAsOf, sensitiveGate, withholdText } from "./life-stage";
import { normaliseParashariHouseMethod, type ChartResult } from "./schema";
import {
  KernelInputError,
  leadOf,
  makeKernel,
  type Cite,
  type Evidence,
  type SourceManifest,
  type Stance,
  type Tier,
  type Verdict,
  type Voice,
} from "./kernel";

export type { Stance, Tier } from "./kernel";

export type AgreementTopic =
  | "marriage"
  | "children"
  | "career"
  | "father"
  | "mother"
  | "lifespan";

export type AgreementSystem = "bnn" | "parashari" | "jaimini" | "kp";

export type AgreementVerdict = Verdict;

/** A book's voice inside a school, as the panel and the report show it. */
export interface TextStance {
  id: string;
  label: string;
  stance: Stance;
  word: string;
  note: string;
  tier: Tier;
  reason?: string;
}

export interface SystemStance extends Voice {
  system: AgreementSystem;
  /** The word used in the sentence: "promised", "denied", "strained", "partly promised"... */
  word: string;
  /** Parashari: the voices of its books, in manifest order. */
  texts?: TextStance[];
}

export interface TopicAgreement {
  topic: AgreementTopic;
  label: string;
  stances: SystemStance[];
  /** The kernel's combination of the school voices; the verdict is read off it. */
  stance: Stance;
  verdict: AgreementVerdict;
  /** Weakest provenance among the schools that spoke. */
  tier: Tier;
  reason?: string;
  /** "Marriage: promised by Nadi and Parashari, strained by Jaimini, denied by KP: the systems disagree." */
  sentence: string;
}

/** The schools and the books each is read from. The kernel accepts no other voice. */
export const AGREEMENT_SOURCES = {
  bnn: { label: "Nadi", texts: {} },
  parashari: {
    label: "Parashari",
    texts: {
      bphs: { label: "BPHS" },
      phaladeepika: { label: "Phaladeepika" },
      sarvartha: { label: "Sarvartha Chintamani" },
    },
  },
  jaimini: { label: "Jaimini", texts: {} },
  kp: { label: "KP", texts: {} },
} satisfies SourceManifest;

const K = makeKernel(AGREEMENT_SOURCES);

export const AGREEMENT_SYSTEM_LABEL: Record<AgreementSystem, string> = {
  bnn: "Nadi",
  parashari: "Parashari",
  jaimini: "Jaimini",
  kp: "KP",
};

export const AGREEMENT_TOPIC_LABEL: Record<AgreementTopic, string> = {
  marriage: "Marriage",
  children: "Children",
  career: "Career",
  father: "Father",
  mother: "Mother",
  lifespan: "Life span",
};

export const AGREEMENT_TOPICS: AgreementTopic[] = [
  "marriage",
  "children",
  "career",
  "father",
  "mother",
  "lifespan",
];

/** What each school's stance is made from, for the method note in the panel, the report and the About page. */
export const AGREEMENT_METHOD: Record<AgreementSystem, string> = {
  bnn: "the life-area verdict of the Nadi tab, from R.G. Rao's Bhrigu Nandi Nadi and S. Naik's Prediction Secrets. Nadi rules carry no tone of their own; the direction of each is read from its wording.",
  parashari:
    "three books, each weighed on its own and then combined: BPHS in Santhanam's translation (the house chapters and the house judgement of 11.14-16), Phaladeepika 8.25-33 on the nodes, and Sarvartha Chintamani in Bhasin's translation, whose stanzas carry no tone in the app, so their direction is read from the wording.",
  jaimini:
    "the balance of the chara karaka and arudha pada notes on the Jaimini tab; the notes are the app's encoding, cited to no sutra or page (provisional). The span of life is the three-pairs method of Jaimini Sutras 2.1.1-14.",
  kp: "the cusp sub-lord rules of the KP tab, from Astro Secrets & KP and Dr. Andrew Dutta's free KP bhava rules, with the principal cusp's sub lord deciding (Part 3 p. 12).",
};

export const AGREEMENT_PARENTS_NOTE =
  "Father and mother take only the rules that name the parent, and the Sarvartha Chintamani stanzas filed under each. BPHS 11.5 gives the mother to the 4th house and 11.11 the father to the 10th, so the general judgement of those houses (11.14-16) counts as well; the 9th's does not, since 11.10 does not list the father. Jaimini reads the father from the Pitrikaraka and A9, the mother from the Matrikaraka and A4.";

export const AGREEMENT_NOTE =
  "Nadi, Jaimini and KP stances are the verdicts their own tabs show. Parashari's comes from three books, each weighed on its own: a book supports or strains when two-thirds of its rules that fire point that way, and is mixed otherwise. Books, and then schools, are combined by which stances are present, never by how many voices hold them: support beside strain is a dispute, one way beside a mixed reading only leans, and two books of one school never count as agreement between schools. Statements withheld for a minor are removed before anything is weighed. The two-thirds rule and the comparison are the app's conventions (provisional). KP stances rest on a cusp sub lord that changes every few minutes of birth time.";

/** The life-area key each topic is gated by (age season), when any. */
const TOPIC_SEASON: Partial<Record<AgreementTopic, string>> = {
  marriage: "marriage",
  children: "children",
  career: "career",
};

export interface AgreementInput {
  /** The Nadi reading (result.reading), redacted on the server for a minor. */
  reading: Reading;
  parashari: ParashariResult;
  /** Sarvartha Chintamani findings: one of Parashari's three books. Required, so no caller can leave it out. */
  sarvartha: SarvarthaResult | undefined;
  jaimini: AreaReading[];
  kp: KpResult;
  /** Jaimini ayur, when computed; null when withheld. */
  ayur: AyurResult | null | undefined;
  /** Sensitive-content gate: under 18, the life span row is dropped and withheld statements are refused. */
  withheld: boolean;
  /** Plain reading: the life span row is a practitioner matter and is dropped. */
  plain: boolean;
  /**
   * A date of passing is recorded. Only then is the life span row shown, as a test of the method against a life that
   * has run its course; for the living the app does not judge the span, and the Jaimini tab keeps its own framing.
   */
  deceased: boolean;
  inSeason: (area: string) => boolean;
}

// ---- Words ------------------------------------------------------------------------------------

type Words = Record<Exclude<Stance, "silent">, string>;

const PROMISE: Words = {
  supports: "promised",
  "leans-supports": "partly promised",
  mixed: "mixed",
  contested: "contested",
  "leans-strains": "partly strained",
  strains: "strained",
};

const SUPPORT: Words = {
  supports: "supported",
  "leans-supports": "partly supported",
  mixed: "mixed",
  contested: "contested",
  "leans-strains": "partly strained",
  strains: "strained",
};

// "supports" and "strains" read differently for a promise than for a span.
const SPAN: Words = {
  supports: "read long",
  "leans-supports": "leans long",
  mixed: "read middling",
  contested: "contested",
  "leans-strains": "leans short",
  strains: "read short",
};

const WORDS: Record<AgreementTopic, Words> = {
  marriage: PROMISE,
  children: PROMISE,
  career: SUPPORT,
  father: SUPPORT,
  mother: SUPPORT,
  lifespan: SPAN,
};

const wordOf = (topic: AgreementTopic, s: Stance, silent = "not read") =>
  s === "silent" ? silent : WORDS[topic][s];

const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const clip = (s: string, n = 110) =>
  s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : s;

function firstSentence(t: string): string {
  const m = t.match(/^[^.;]+/);
  return (m ? m[0] : t).trim();
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function joinList(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function assertTopic(topic: string): asserts topic is AgreementTopic {
  if (!AGREEMENT_TOPICS.includes(topic as AgreementTopic))
    throw new KernelInputError(`unknown topic "${topic}"`);
}

// ---- Parents ------------------------------------------------------------------------------------

type Parent = "father" | "mother";
const isParent = (t: AgreementTopic): t is Parent => t === "father" || t === "mother";

// A rule speaks to a parent when the statement as shown names the parent (or both parents). Step-parents and
// in-laws are not the parent. A statement redacted for a minor no longer names the parent, so it drops out here.
const PARENT_RE: Record<Parent, RegExp> = {
  father: /(?<![-\w])(father|parents)\b(?!-in-law)/i,
  mother: /(?<![-\w])(mother|parents)\b(?!-in-law)/i,
};

export const namesParent = (p: Parent, text: string) => PARENT_RE[p].test(text);

// ---- Nadi -------------------------------------------------------------------------------------

const BNN_AREA: Record<AgreementTopic, LifeArea | null> = {
  marriage: "marriage",
  children: "children",
  career: "career",
  father: "family",
  mother: "family",
  lifespan: null,
};

const BNN_KEYWORD_REASON =
  "Nadi rules carry no tone of their own; the direction of each is read from its wording";

function bnnVoice(
  topic: AgreementTopic,
  input: AgreementInput,
  areas: AreaSynthesis[],
  gate: Gate,
): Voice {
  const key = BNN_AREA[topic];
  let a: AreaSynthesis | undefined;
  if (key && isParent(topic)) {
    // The family area's own rule, applied to the rules that name this parent.
    const items = input.reading.findings.filter(
      (f) => f.area === key && namesParent(topic, f.text),
    );
    a = items.length
      ? synthesizeArea(key, items, input.reading, input.reading.roles.gender)
      : undefined;
  } else if (key) a = areas.find((x) => x.area === key);
  if (!a || a.tone === "quiet")
    return K.schoolVoice("bnn", {
      stance: "silent",
      tier: "sourced",
      note: !key
        ? "The Nadi rules in use do not judge the span of life."
        : isParent(topic)
          ? `Few Nadi rules on the ${topic} fire here.`
          : "Few Nadi signatures fall here.",
      cites: [],
    });
  const stance: Stance =
    a.tone === "supportive"
      ? "supports"
      : a.tone === "care"
        ? "strains"
        : a.tone === "contested"
          ? "contested"
          : "mixed";
  // The evidence is the key rule that carries the stance, not the area headline.
  const want =
    stance === "supports" ? "good" : stance === "strains" ? "hard" : null;
  const lead =
    (want && a.key.find((f) => toneOf(f) === want)) ??
    (a.contest ? a.contest.good : a.key[0]);
  const note = lead
    ? a.contest
      ? `${firstClause(gist(a.contest.good.text))}; yet ${lc(firstClause(gist(a.contest.hard.text)))}`
      : firstClause(gist(lead.text))
    : a.headline;
  const all = [...a.key, ...a.rest];
  const keyword = all.some((f) => toneOf(f) !== "neutral" && toneIsKeyword(f));
  const cites: Cite[] = Array.from(
    new Set(all.map((f) => f.source).filter((s): s is string => !!s)),
  ).map((label) => ({ label }));
  return K.schoolVoice(
    "bnn",
    {
      stance,
      tier: keyword ? "keyword" : "sourced",
      reason: keyword ? BNN_KEYWORD_REASON : undefined,
      note: clip(note.replace(/\s*\([^)]*$/, "")),
      cites,
    },
    { gate, texts: all.map((f) => f.text) },
  );
}

// ---- Parashari: three books --------------------------------------------------------------------

/** The houses whose chapter rules speak to a topic; father and mother take the rules that name them instead. */
const PAR_HOUSES: Record<Exclude<AgreementTopic, Parent>, number[]> = {
  marriage: [7],
  children: [5],
  career: [10],
  lifespan: [],
};

/** The houses whose general judgement (11.14-16) speaks to a topic, by the matters 11.2-13 give each house. */
const PAR_JUDGED: Record<AgreementTopic, { house: number; verse: string }[]> = {
  marriage: [{ house: 7, verse: "11.8" }],
  children: [{ house: 5, verse: "11.6" }],
  career: [{ house: 10, verse: "11.11" }],
  father: [{ house: 10, verse: "11.11" }],
  mother: [{ house: 4, verse: "11.5" }],
  lifespan: [],
};

type Gate = ((text: string) => boolean) | undefined;

const toneOfFinding = (t: ParashariFinding["tone"]): Evidence["tone"] =>
  t === "support" ? "support" : t === "strain" ? "strain" : "both";

/** Which of Parashari's books a finding comes from, by its citation; any other source is refused. */
function bookOf(f: ParashariFinding): "bphs" | "phaladeepika" {
  if (f.source.label.startsWith("Parashara")) return "bphs";
  if (f.source.label.startsWith("Phaladeepika")) return "phaladeepika";
  throw new KernelInputError(
    `${f.id}: cited to "${f.source.label}", which is not one of Parashari's books in the manifest`,
  );
}

function inPool(topic: AgreementTopic, f: ParashariFinding): boolean {
  if (isParent(topic)) return namesParent(topic, `${f.title}. ${f.text}`);
  return PAR_HOUSES[topic].includes(f.house ?? -1);
}

const CHALIT_REASON = "read in the bhava-chalit construction the chart is set to";

function bphsVoice(topic: AgreementTopic, par: ParashariResult, gate: Gate): Voice {
  const ev: Evidence[] = [];
  const chalit = par.houseMethod !== "rashi";
  for (const { house, verse } of PAR_JUDGED[topic]) {
    const bj = par.bhavaJudgement.find((b) => b.house === house);
    if (!bj) continue;
    const cite = { label: `Parashara 11.14-16 (${verse})`, url: BPHS_URL(11) };
    // The Parashari module marks its house judgement provisional: the avastha clauses are not applied, and a lord
    // in its own house is not counted as failing to aspect it (parashari-houses.ts, BHAVA_JUDGEMENT_CAVEATS).
    const tier: Tier = chalit || bj.source.provisional ? "provisional" : "sourced";
    const reason = chalit
      ? CHALIT_REASON
      : bj.source.provisional
        ? "the house judgement leaves out the avastha clauses of 11.14-16 and settles a case the text leaves open"
        : undefined;
    for (const s of bj.support)
      ev.push({ tone: "support", text: `${ordinal(house)} house: ${s}`, cite, tier, reason });
    for (const s of bj.strain)
      ev.push({ tone: "strain", text: `${ordinal(house)} house: ${s}`, cite, tier, reason });
  }
  for (const f of par.findings) {
    if (f.kind !== "house" || bookOf(f) !== "bphs" || !inPool(topic, f)) continue;
    ev.push({
      tone: toneOfFinding(f.tone),
      text: f.text,
      cite: { label: f.source.label, url: f.source.url },
      tier: f.source.provisional ? "provisional" : "sourced",
      reason: f.source.provisional ? "the text does not state the rule as applied" : undefined,
    });
  }
  return K.weigh("bphs", ev, {
    gate,
    note: (stance, xs) => {
      const lead = leadOf(stance, xs);
      if (!lead) return "No house rule fires.";
      const m = lead.text.match(/^(\d+(?:st|nd|rd|th)) house: (.*)$/);
      return m
        ? `${m[1]} house judged by 11.14-16: ${m[2]}`
        : firstSentence(lead.text);
    },
  });
}

function phaladeepikaVoice(topic: AgreementTopic, par: ParashariResult, gate: Gate): Voice {
  const ev: Evidence[] = par.findings
    .filter((f) => f.kind === "house" && bookOf(f) === "phaladeepika" && inPool(topic, f))
    .map((f) => ({
      tone: toneOfFinding(f.tone),
      text: f.text,
      cite: { label: f.source.label, url: f.source.url },
      tier: f.source.provisional ? ("provisional" as Tier) : ("sourced" as Tier),
      reason: f.source.provisional ? CHALIT_REASON : undefined,
    }));
  return K.weigh("phaladeepika", ev, {
    gate,
    note: (stance, xs) => {
      const lead = leadOf(stance, xs);
      if (!lead) return "No node rule falls here.";
      const where = firstSentence(lead.text).replace(/,.*$/, "");
      const reads = lead.text.match(/Mantreswara reads ([^.;]+)/);
      return reads ? `${where}: ${reads[1]}` : firstSentence(lead.text);
    },
  });
}

const SC_KEYWORD_REASON =
  "Sarvartha Chintamani's stanzas carry no tone in the app; the direction is read from the wording";

function scChapter(f: SarvarthaFinding): number {
  const h = SC_BHAVA_RULES.find((x) => x.house === f.house);
  if (!h) throw new KernelInputError(`Sarvartha Chintamani: no chapter for the ${ordinal(f.house)} house`);
  return h.chapter;
}

function sarvarthaVoice(
  topic: AgreementTopic,
  sc: SarvarthaResult | undefined,
  gate: Gate,
  plain: boolean,
  withheld: boolean,
): Voice {
  const pool = (sc?.findings ?? []).filter((f) =>
    isParent(topic) ? f.topic === topic : PAR_HOUSES[topic].includes(f.house),
  );
  const ev: Evidence[] = pool.map((f) => {
    const t = sarvarthaTone(f.text);
    return {
      tone: t === "good" ? "support" : t === "hard" ? "strain" : "both",
      // The same text the server's age gate is applied to (server/routes.ts).
      text: `${f.topic}: ${f.text}`,
      cite: { label: `Sarvartha Chintamani ${scChapter(f)}.${f.stanza}` },
      tier: "keyword",
      reason: SC_KEYWORD_REASON,
    };
  });
  return K.weigh("sarvartha", ev, {
    gate,
    note: (stance, xs) => {
      // Counted either way, but a stanza the plain reading leaves out is never quoted in it.
      const shown = xs.filter((e, i) => !sarvarthaLeftOut(pool[i].topic, pool[i].text, plain, withheld));
      const lead = leadOf(stance, shown);
      if (!lead) return xs.length ? "rests on stanzas the plain reading leaves out" : "No stanza fires here.";
      return `${lead.cite.label.replace("Sarvartha Chintamani ", "")}: ${lead.text.replace(/^[^:]*:\s*/, "")}`;
    },
  });
}

const PAR_TEXT_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(AGREEMENT_SOURCES.parashari.texts).map(([k, v]) => [k, v.label]),
);

function parashariVoice(topic: AgreementTopic, input: AgreementInput, gate: Gate): Voice {
  if (topic === "lifespan")
    return K.schoolVoice("parashari", {
      stance: "silent",
      tier: "sourced",
      note: "Parashara's span of life is read on its own tab, with its spread between methods.",
      cites: [],
    });
  const books = [
    bphsVoice(topic, input.parashari, gate),
    phaladeepikaVoice(topic, input.parashari, gate),
    sarvarthaVoice(topic, input.sarvartha, gate, input.plain, input.withheld),
  ];
  return K.combineTexts("parashari", books, {
    note: (stance, vs) => {
      const label = (v: Voice) => PAR_TEXT_LABEL[v.id];
      const spoken = vs.filter((v) => v.stance !== "silent");
      if (!spoken.length) {
        const houses = isParent(topic)
          ? `rule names the ${topic}`
          : `house rule fires for the ${PAR_HOUSES[topic].map(ordinal).join(" and ")}`;
        return `No ${houses}.`;
      }
      const up = spoken.find((v) => v.stance === "supports" || v.stance === "leans-supports");
      const down = spoken.find((v) => v.stance === "strains" || v.stance === "leans-strains");
      if (stance === "contested" && up && down)
        return clip(`${label(up)}: ${up.note}; yet ${label(down)}: ${lc(down.note)}`, 160);
      const lead = (stance === "supports" || stance === "leans-supports" ? up : down) ?? spoken[0];
      return clip(`${label(lead)}: ${lead.note}`, 160);
    },
  });
}

// ---- Jaimini ----------------------------------------------------------------------------------

const JAI_AREA: Record<AgreementTopic, string | null> = {
  marriage: "marriage",
  children: "children",
  career: "career",
  father: "family",
  mother: "family",
  lifespan: null,
};

/** The family area's karaka and pada for each parent (shared/jaimini-areas.ts). */
const JAI_PARENT: Record<Parent, { karaka: string; pada: number }> = {
  father: { karaka: "PiK", pada: 9 },
  mother: { karaka: "MK", pada: 4 },
};

const JAI_CITE: Cite = {
  label: "Jaimini Sutras: chara karakas and arudha padas (the notes are the app's encoding)",
  url: JAIMINI_TEXT_SOURCE.url,
};

function jaiminiVoice(
  topic: AgreementTopic,
  areas: AreaReading[],
  ayur: AyurResult | null | undefined,
  gate: Gate,
): Voice {
  if (topic === "lifespan") {
    if (!ayur)
      return K.schoolVoice("jaimini", {
        stance: "silent",
        tier: "sourced",
        note: "The Jaimini span needs the lagna and Hora lagna.",
        cites: [],
      });
    const stance: Stance =
      ayur.term === "long" ? "supports" : ayur.term === "short" ? "strains" : "mixed";
    return K.schoolVoice(
      "jaimini",
      {
        stance,
        tier: "sourced",
        note: `${ayur.range}: ${lc(ayur.decidedBy)}`,
        cites: [{ label: "Jaimini Sutras 2.1.1-14", url: JAIMINI_TEXT_SOURCE.url }],
      },
      { gate },
    );
  }
  const key = JAI_AREA[topic];
  const a = key ? areas.find((x) => x.area === key) : undefined;
  const p = isParent(topic) ? JAI_PARENT[topic] : null;
  const notes: Note[] = a
    ? [
        ...a.karakas.filter((k) => !p || k.karaka === p.karaka).flatMap((k) => k.notes),
        ...a.padas.filter((x) => !p || x.house === p.pada).flatMap((x) => x.notes),
      ]
    : [];
  const up = notes.filter((n) => n.tone === "support").length;
  const down = notes.filter((n) => n.tone === "strain").length;
  // Fail closed: with no note that takes a direction, Jaimini does not read the question.
  if (!a || up + down === 0)
    return K.schoolVoice("jaimini", {
      stance: "silent",
      tier: "sourced",
      note: "No karaka or pada note takes a direction here.",
      cites: [],
    });
  const balance = up - down;
  const stance: Stance = balance > 0 ? "supports" : balance < 0 ? "strains" : "mixed";
  const want = stance === "supports" ? "support" : stance === "strains" ? "strain" : null;
  const lead = (want && notes.find((n) => n.tone === want)) ?? notes.find((n) => n.tone !== "neutral");
  return K.schoolVoice(
    "jaimini",
    {
      stance,
      tier: "provisional",
      reason: "the karaka and pada notes are the app's encoding of the method, cited to no sutra or page",
      note: clip(lead ? firstSentence(lead.text) : a.blurb),
      cites: [JAI_CITE],
    },
    { gate, texts: notes.map((n) => n.text) },
  );
}

// ---- KP ---------------------------------------------------------------------------------------

const KP_CUSPS: Record<Exclude<AgreementTopic, Parent>, { cusps: number[]; topics: string[] }> = {
  marriage: { cusps: [7], topics: ["Marriage", "Partner", "Married life", "Love"] },
  children: { cusps: [5], topics: ["Children"] },
  career: { cusps: [10], topics: ["Career", "Standing", "Public life"] },
  lifespan: { cusps: [1, 8, 11], topics: ["Longevity"] },
};

function kpVoice(topic: AgreementTopic, kp: KpResult, gate: Gate): Voice {
  const w = WORDS[topic];
  // Notes overruled by the principal cusp's sub lord (Part 3 p. 12) do not take a stance.
  const fs: KpFinding[] = kp.findings.filter((f) =>
    f.standing === "note"
      ? false
      : isParent(topic)
        ? namesParent(topic, f.text)
        : KP_CUSPS[topic].cusps.includes(f.cusp) && KP_CUSPS[topic].topics.includes(f.topic),
  );
  const good = fs.filter((f) => f.polarity === "good");
  const bad = fs.filter((f) => f.polarity === "bad");
  if (!good.length && !bad.length)
    return K.schoolVoice("kp", {
      stance: "silent",
      tier: "sourced",
      note: isParent(topic)
        ? `No KP rule on the ${topic} fires.`
        : `No rule fires for the ${KP_CUSPS[topic].cusps.map((c) => `${ordinal(c)} cusp`).join(" or ")}.`,
      cites: [],
    });
  const denied = bad.find((f) => /denied/.test(f.ruleId));
  const lead = denied ?? bad[0] ?? good[0];
  const cuspNo = isParent(topic) ? lead.cusp : KP_CUSPS[topic].cusps[0];
  const cusp = kp.cusps.find((c) => c.house === cuspNo);
  const sub = cusp ? `${ordinal(cuspNo)} sub lord ${cusp.subLord}` : "";
  // A verdict whose cusp sub lord changes within two minutes of the recorded time is conditional.
  const point = kp.stability?.cusps.find((p) => p.house === cuspNo);
  const cond = isConditional(point);
  const condWord = (x: string) => (cond ? `${x} (conditional)` : x);
  const condNote = cond && point ? `; the sub lord ${nearestChangeText(point)}` : "";
  const gistOf = (f: KpFinding) => lc(firstSentence(f.text.replace(/^[^:]*:\s*/, "")));
  const cites: Cite[] = [];
  for (const f of fs)
    if (!cites.some((c) => c.label === f.source)) cites.push({ label: f.source, url: f.sourceUrl });
  const voice = (stance: Stance, word: string, note: string) => ({
    ...K.schoolVoice(
      "kp",
      { stance, tier: "sourced", note: clip(note, 160), cites },
      { gate, texts: fs.map((f) => f.text) },
    ),
    word,
  });
  if (good.length && bad.length)
    // The book gives the cusp sub lord the last word, yet the rules here fire on the same cusp in both
    // directions; that is a contest inside KP, not a mixed verdict.
    return voice(
      "contested",
      condWord(w.contested),
      `${sub}: ${gistOf(good[0])}; yet ${gistOf(denied ?? bad[0])}${condNote}`,
    );
  if (bad.length)
    return voice(
      "strains",
      condWord(denied ? "denied or much delayed" : w.strains),
      `${sub}: ${gistOf(denied ?? bad[0])}${condNote}`,
    );
  return voice("supports", condWord(w.supports), `${sub}: ${gistOf(good[0])}${condNote}`);
}

// ---- Comparison -------------------------------------------------------------------------------

const ORDER: Stance[] = ["supports", "leans-supports", "mixed", "contested", "leans-strains", "strains"];

function sentenceFor(
  topic: AgreementTopic,
  stances: SystemStance[],
  verdict: AgreementVerdict,
): string {
  const label = AGREEMENT_TOPIC_LABEL[topic];
  const spoken = stances.filter((s) => s.stance !== "silent");
  const silent = stances.filter((s) => s.stance === "silent");
  // Group systems by the word they use, from support through strain.
  const groups: { word: string; systems: string[] }[] = [];
  for (const st of ORDER)
    for (const s of spoken.filter((x) => x.stance === st)) {
      const g = groups.find((x) => x.word === s.word);
      if (g) g.systems.push(AGREEMENT_SYSTEM_LABEL[s.system]);
      else groups.push({ word: s.word, systems: [AGREEMENT_SYSTEM_LABEL[s.system]] });
    }
  const body = groups.map((g) => `${g.word} by ${joinList(g.systems)}`).join(", ");
  // A dispute between systems, or only inside a system whose own rules or books pull both ways.
  const up = spoken.some((s) => s.stance === "supports" || s.stance === "leans-supports");
  const down = spoken.some((s) => s.stance === "strains" || s.stance === "leans-strains");
  const torn = spoken.filter((s) => s.stance === "contested").map((s) => AGREEMENT_SYSTEM_LABEL[s.system]);
  const tail: Record<AgreementVerdict, string> = {
    agree: "the systems agree",
    lean: "the systems lean one way without agreeing",
    mixed: "each system that reads it is mixed",
    disagree:
      up && down
        ? "the systems disagree"
        : up || down
          ? `the systems disagree, and ${joinList(torn)} ${torn.length === 1 ? "is" : "are"} split within`
          : `the readings are disputed within ${joinList(torn)}`,
    quiet: "too little is read to compare",
  };
  const unread = silent.length
    ? ` ${joinList(silent.map((s) => AGREEMENT_SYSTEM_LABEL[s.system]))} ${silent.length === 1 ? "does" : "do"} not read it.`
    : "";
  if (!spoken.length) return `${label}: no system reads it strongly.`;
  return `${label}: ${body}: ${tail[verdict]}.${unread}`;
}

/** Whether a topic may be read for this chart: the age seasons and the life span conditions. */
export function topicOpen(topic: AgreementTopic, input: AgreementInput): boolean {
  assertTopic(topic);
  const season = TOPIC_SEASON[topic];
  if (season && !input.inSeason(season)) return false;
  if (topic === "lifespan" && (input.withheld || input.plain || !input.deceased)) return false;
  return true;
}

interface Prepared {
  bnnAreas: AreaSynthesis[];
  gate: Gate;
}

const prepare = (input: AgreementInput): Prepared => ({
  bnnAreas: synthesize(input.reading, input.reading.roles.gender),
  gate: input.withheld ? withholdText : undefined,
});

const as = (system: AgreementSystem, topic: AgreementTopic, v: Voice & { word?: string }): SystemStance => ({
  ...v,
  system,
  word:
    v.word ??
    wordOf(topic, v.stance, system === "parashari" && topic === "lifespan" ? "not read here" : "not read"),
  texts: v.from?.map((t) => ({
    id: t.id,
    label: PAR_TEXT_LABEL[t.id] ?? t.id,
    stance: t.stance,
    word: wordOf(topic, t.stance),
    note: t.note,
    tier: t.tier,
    reason: t.reason,
  })),
});

/** One topic, read and combined. A topic the age gate or the life span conditions close is refused. */
export function readTopic(
  topic: AgreementTopic,
  input: AgreementInput,
  pre: Prepared = prepare(input),
): TopicAgreement {
  if (!topicOpen(topic, input))
    throw new KernelInputError(`${topic}: closed for this chart; it must not reach the kernel`);
  const stances: SystemStance[] = [
    as("bnn", topic, bnnVoice(topic, input, pre.bnnAreas, pre.gate)),
    as("parashari", topic, parashariVoice(topic, input, pre.gate)),
    as("jaimini", topic, jaiminiVoice(topic, input.jaimini, input.ayur, pre.gate)),
    as("kp", topic, kpVoice(topic, input.kp, pre.gate)),
  ];
  const c = K.combineSchools(stances);
  return {
    topic,
    label: AGREEMENT_TOPIC_LABEL[topic],
    stances,
    stance: c.stance,
    verdict: c.verdict,
    tier: c.tier,
    reason: c.reason,
    sentence: sentenceFor(topic, stances, c.verdict),
  };
}

export function computeAgreement(input: AgreementInput): TopicAgreement[] {
  const pre = prepare(input);
  return AGREEMENT_TOPICS.filter((t) => topicOpen(t, input)).map((t) => readTopic(t, input, pre));
}

/**
 * The agreement for a computed chart. The Agreement panel, the Overview, the report and the tests all read it
 * here, so they cannot be given different inputs. The age gate is the one the server applied when it redacted
 * the result, when recorded.
 */
export function agreementFor(result: ChartResult, plain: boolean): TopicAgreement[] {
  return computeAgreement(agreementInput(result, plain));
}

/** The adapters' input for a computed chart (exported for the tests). */
export function agreementInput(result: ChartResult, plain: boolean): AgreementInput {
  const asOf = result.now.asOf;
  const lifeAt = lifeAsOf(result.chart, asOf);
  const withheld =
    result.sensitive?.withheld ?? sensitiveGate(result.chart, result.utc, asOf).withheld;
  return {
    reading: result.reading,
    parashari: computeParashari(
      result.positions,
      result.jaimini.lagna.lon,
      result.utc,
      lifeAt,
      result.shadbala,
      result.dasaStarts,
      DEFAULT_ASPECT_FLOOR,
      withheld,
      normaliseParashariHouseMethod(result.chart.parashariHouseMethod),
    ),
    sarvartha: result.sarvartha,
    jaimini: readAreas(result.jaimini, result.positions, withheld),
    kp: computeKp(result.kp, result.utc, lifeAt, false, withheld),
    ayur: result.jaimini.ayur,
    withheld,
    plain,
    // The life span row is shown only against a recorded date of passing.
    deceased: lifeAt !== asOf,
    inSeason: (area) => areaSeason(area, result.utc, lifeAt).inSeason,
  };
}
