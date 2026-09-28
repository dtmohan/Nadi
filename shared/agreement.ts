// Where the systems agree.
//
// Each system on the chart page reads the same life on its own terms and the app keeps them
// apart. What it never did was say, in one place, where they land on the same question. This
// module lines up the four systems that give area verdicts (Nadi, Parashari, Jaimini, KP) on
// five topics and states plainly whether they agree, lean one way or disagree. Nothing is blended:
// every stance is taken from the system's own verdict as its tab shows it, and the sentence only
// reports the comparison. The comparison itself is the app's convention (provisional).

import { firstClause, gist, toneOf, type AreaSynthesis } from "./synthesis";
import type { AreaReading } from "./jaimini-areas";
import type { ParashariResult } from "./parashari";
import type { KpResult } from "./kp";
import type { AyurResult } from "./jaimini-ayur";

export type AgreementTopic =
  "marriage" | "children" | "career" | "parents" | "lifespan";

export type AgreementSystem = "bnn" | "parashari" | "jaimini" | "kp";

/** Coarse category used to compare systems; the word shown is per system and topic. */
export type Stance = "supports" | "strains" | "mixed" | "contested" | "silent";

export interface SystemStance {
  system: AgreementSystem;
  stance: Stance;
  /** The word used in the sentence: "promised", "denied", "strained", "long span"... */
  word: string;
  /** One clause of evidence, as the tab states it. */
  note: string;
}

export type AgreementVerdict = "agree" | "lean" | "disagree" | "quiet";

export interface TopicAgreement {
  topic: AgreementTopic;
  label: string;
  stances: SystemStance[];
  verdict: AgreementVerdict;
  /** "Marriage: promised by Nadi and Parashari, strained by Jaimini, denied by KP: the systems disagree." */
  sentence: string;
}

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
  parents: "Parents",
  lifespan: "Life span",
};

/** The life-area key each topic is gated by (age season), when any. */
const TOPIC_SEASON: Partial<Record<AgreementTopic, string>> = {
  marriage: "marriage",
  children: "children",
  career: "career",
};

export interface AgreementInput {
  bnn: AreaSynthesis[];
  parashari: ParashariResult;
  jaimini: AreaReading[];
  kp: KpResult;
  /** Jaimini ayur, when computed; null when withheld. */
  ayur: AyurResult | null | undefined;
  /** Sensitive-content gate: under 18, the life span row is dropped. */
  withheld: boolean;
  /** Plain reading: the life span row is a practitioner matter and is dropped. */
  plain: boolean;
  inSeason: (area: string) => boolean;
}

// Words per topic. "supports" and "strains" read differently for a promise than for a span.
const WORDS: Record<
  AgreementTopic,
  { supports: string; strains: string; mixed: string; contested: string }
> = {
  marriage: {
    supports: "promised",
    strains: "strained",
    mixed: "mixed",
    contested: "contested",
  },
  children: {
    supports: "promised",
    strains: "strained",
    mixed: "mixed",
    contested: "contested",
  },
  career: {
    supports: "supported",
    strains: "strained",
    mixed: "mixed",
    contested: "contested",
  },
  parents: {
    supports: "supported",
    strains: "strained",
    mixed: "mixed",
    contested: "contested",
  },
  lifespan: {
    supports: "read long",
    strains: "read short",
    mixed: "read middling",
    contested: "contested",
  },
};

const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const clip = (s: string, n = 110) =>
  s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : s;

function firstSentence(t: string): string {
  const m = t.match(/^[^.;]+/);
  return (m ? m[0] : t).trim();
}

// ---- Nadi -------------------------------------------------------------------------------------

const BNN_AREA: Record<AgreementTopic, string | null> = {
  marriage: "marriage",
  children: "children",
  career: "career",
  parents: "family",
  lifespan: null,
};

function bnnStance(
  topic: AgreementTopic,
  areas: AreaSynthesis[],
): SystemStance {
  const key = BNN_AREA[topic];
  const a = key ? areas.find((x) => x.area === key) : undefined;
  const w = WORDS[topic];
  if (!a || a.tone === "quiet")
    return {
      system: "bnn",
      stance: "silent",
      word: "not read",
      note: key
        ? "Few Nadi signatures fall here."
        : "The Nadi rules in use do not judge the span of life.",
    };
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
  return {
    system: "bnn",
    stance,
    word: w[stance],
    note: clip(note.replace(/\s*\([^)]*$/, "")),
  };
}

// ---- Parashari --------------------------------------------------------------------------------

const PAR_HOUSES: Record<AgreementTopic, number[]> = {
  marriage: [7],
  children: [5],
  career: [10],
  parents: [9, 4],
  lifespan: [],
};

function parashariStance(
  topic: AgreementTopic,
  par: ParashariResult,
): SystemStance {
  const w = WORDS[topic];
  const houses = PAR_HOUSES[topic];
  if (!houses.length)
    return {
      system: "parashari",
      stance: "silent",
      word: "not read here",
      note: "Parashara's span of life is read on its own tab, with its spread between methods.",
    };
  let support = 0;
  let strain = 0;
  const notes: string[] = [];
  for (const h of houses) {
    const bj = par.bhavaJudgement.find((b) => b.house === h);
    if (bj) {
      if (bj.tone === "support" || bj.tone === "mixed")
        support += bj.support.length;
      if (bj.tone === "strain" || bj.tone === "mixed")
        strain += bj.strain.length;
      if (bj.tone !== "none")
        notes.push(
          `${ordinal(h)} house ${bj.tone === "support" ? "prospers" : bj.tone === "strain" ? "fails" : "is mixed"} by 11.14-16`,
        );
    }
    for (const f of par.findings) {
      if (f.kind !== "house" || f.house !== h) continue;
      if (f.tone === "support") support++;
      else if (f.tone === "strain") strain++;
      else {
        support += 0.5;
        strain += 0.5;
      }
    }
  }
  if (!support && !strain)
    return {
      system: "parashari",
      stance: "silent",
      word: "not read",
      note: `No house rule fires for the ${houses.map(ordinal).join(" and ")}.`,
    };
  const stance: Stance =
    support && strain
      ? Math.abs(support - strain) <= 1
        ? "mixed"
        : support > strain
          ? "supports"
          : "strains"
      : support
        ? "supports"
        : "strains";
  const lead = par.findings.find(
    (f) =>
      f.kind === "house" &&
      houses.includes(f.house ?? -1) &&
      (stance === "mixed" ||
        f.tone === (stance === "supports" ? "support" : "strain")),
  );
  return {
    system: "parashari",
    stance,
    word: w[stance],
    note: clip(lead ? firstSentence(lead.text) : notes.join("; ")),
  };
}

// ---- Jaimini ----------------------------------------------------------------------------------

const JAI_AREA: Record<AgreementTopic, string | null> = {
  marriage: "marriage",
  children: "children",
  career: "career",
  parents: "family",
  lifespan: null,
};

function jaiminiStance(
  topic: AgreementTopic,
  areas: AreaReading[],
  ayur: AyurResult | null | undefined,
): SystemStance {
  const w = WORDS[topic];
  if (topic === "lifespan") {
    if (!ayur)
      return {
        system: "jaimini",
        stance: "silent",
        word: "not read",
        note: "The Jaimini span needs the lagna and Hora lagna.",
      };
    const stance: Stance =
      ayur.term === "long"
        ? "supports"
        : ayur.term === "short"
          ? "strains"
          : "mixed";
    return {
      system: "jaimini",
      stance,
      word: w[stance],
      note: `${ayur.range}: ${lc(ayur.decidedBy)}`,
    };
  }
  const key = JAI_AREA[topic];
  const a = key ? areas.find((x) => x.area === key) : undefined;
  if (!a || (!a.karakas.length && !a.padas.length))
    return {
      system: "jaimini",
      stance: "silent",
      word: "not read",
      note: "No karaka or pada rule fires here.",
    };
  const stance: Stance =
    a.balance > 0 ? "supports" : a.balance < 0 ? "strains" : "mixed";
  const notes = [
    ...a.karakas.flatMap((k) => k.notes),
    ...a.padas.flatMap((p) => p.notes),
  ];
  const want =
    stance === "supports" ? "support" : stance === "strains" ? "strain" : null;
  const lead = (want && notes.find((n) => n.tone === want)) ?? notes[0];
  return {
    system: "jaimini",
    stance,
    word: w[stance],
    note: clip(lead ? firstSentence(lead.text) : a.blurb),
  };
}

// ---- KP ---------------------------------------------------------------------------------------

const KP_CUSPS: Record<AgreementTopic, { cusps: number[]; topics: string[] }> =
  {
    marriage: { cusps: [7], topics: ["Marriage", "Partner", "Married life"] },
    children: { cusps: [5], topics: ["Children"] },
    career: { cusps: [10], topics: ["Career", "Standing", "Public life"] },
    parents: { cusps: [9, 4], topics: ["Father", "Mother", "Parents"] },
    lifespan: { cusps: [1, 8, 11], topics: ["Longevity"] },
  };

function kpStance(topic: AgreementTopic, kp: KpResult): SystemStance {
  const w = WORDS[topic];
  const { cusps, topics } = KP_CUSPS[topic];
  const fs = kp.findings.filter(
    (f) => cusps.includes(f.cusp) && topics.includes(f.topic),
  );
  const good = fs.filter((f) => f.polarity === "good");
  const bad = fs.filter((f) => f.polarity === "bad");
  if (!good.length && !bad.length)
    return {
      system: "kp",
      stance: "silent",
      word: "not read",
      note: `No rule fires for the ${cusps.map((c) => `${ordinal(c)} cusp`).join(" or ")}.`,
    };
  const denied = bad.find((f) => /denied/.test(f.ruleId));
  const cusp = kp.cusps.find((c) => c.house === cusps[0]);
  const sub = cusp ? `${ordinal(cusps[0])} sub lord ${cusp.subLord}` : "";
  if (good.length && bad.length) {
    // The book gives the cusp sub lord the last word, yet the rules here fire on the same cusp in
    // both directions; that is a contest inside KP, not a mixed verdict.
    return {
      system: "kp",
      stance: "contested",
      word: w.contested,
      note: clip(
        `${sub}: ${lc(firstSentence(good[0].text.replace(/^[^:]*:\s*/, "")))}; yet ${lc(firstSentence((denied ?? bad[0]).text.replace(/^[^:]*:\s*/, "")))}`,
      ),
    };
  }
  if (bad.length)
    return {
      system: "kp",
      stance: "strains",
      word: denied ? "denied or much delayed" : w.strains,
      note: clip(
        `${sub}: ${lc(firstSentence((denied ?? bad[0]).text.replace(/^[^:]*:\s*/, "")))}`,
      ),
    };
  return {
    system: "kp",
    stance: "supports",
    word: w.supports,
    note: clip(
      `${sub}: ${lc(firstSentence(good[0].text.replace(/^[^:]*:\s*/, "")))}`,
    ),
  };
}

// ---- Comparison -------------------------------------------------------------------------------

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function joinList(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function compare(stances: SystemStance[]): AgreementVerdict {
  const spoken = stances.filter((s) => s.stance !== "silent");
  if (spoken.length < 2) return "quiet";
  const up = spoken.filter((s) => s.stance === "supports").length;
  const down = spoken.filter((s) => s.stance === "strains").length;
  const torn = spoken.filter(
    (s) => s.stance === "mixed" || s.stance === "contested",
  ).length;
  if (up && down) return "disagree";
  if ((up || down) && !torn) return "agree";
  if (up || down) return "lean";
  return "lean";
}

function sentenceFor(
  topic: AgreementTopic,
  stances: SystemStance[],
  verdict: AgreementVerdict,
): string {
  const label = AGREEMENT_TOPIC_LABEL[topic];
  const spoken = stances.filter((s) => s.stance !== "silent");
  const silent = stances.filter((s) => s.stance === "silent");
  // Group systems by the word they use, in the order supports, mixed/contested, strains.
  const order: Stance[] = ["supports", "mixed", "contested", "strains"];
  const groups: { word: string; systems: string[] }[] = [];
  for (const st of order)
    for (const s of spoken.filter((x) => x.stance === st)) {
      const g = groups.find((x) => x.word === s.word);
      if (g) g.systems.push(AGREEMENT_SYSTEM_LABEL[s.system]);
      else
        groups.push({
          word: s.word,
          systems: [AGREEMENT_SYSTEM_LABEL[s.system]],
        });
    }
  const body = groups
    .map((g) => `${g.word} by ${joinList(g.systems)}`)
    .join(", ");
  const tail: Record<AgreementVerdict, string> = {
    agree: "the systems agree",
    lean: "the systems lean one way without agreeing",
    disagree: "the systems disagree",
    quiet: "too little is read to compare",
  };
  const unread = silent.length
    ? ` ${joinList(silent.map((s) => AGREEMENT_SYSTEM_LABEL[s.system]))} ${silent.length === 1 ? "does" : "do"} not read it.`
    : "";
  if (!spoken.length) return `${label}: no system reads it strongly.`;
  return `${label}: ${body}: ${tail[verdict]}.${unread}`;
}

export const AGREEMENT_TOPICS: AgreementTopic[] = [
  "marriage",
  "children",
  "career",
  "parents",
  "lifespan",
];

export function computeAgreement(input: AgreementInput): TopicAgreement[] {
  const out: TopicAgreement[] = [];
  for (const topic of AGREEMENT_TOPICS) {
    const season = TOPIC_SEASON[topic];
    if (season && !input.inSeason(season)) continue;
    if (topic === "lifespan" && (input.withheld || input.plain)) continue;
    const stances: SystemStance[] = [
      bnnStance(topic, input.bnn),
      parashariStance(topic, input.parashari),
      jaiminiStance(topic, input.jaimini, input.ayur),
      kpStance(topic, input.kp),
    ];
    const verdict = compare(stances);
    out.push({
      topic,
      label: AGREEMENT_TOPIC_LABEL[topic],
      stances,
      verdict,
      sentence: sentenceFor(topic, stances, verdict),
    });
  }
  return out;
}

export const AGREEMENT_NOTE =
  "Each stance is the verdict the system's own tab shows; nothing is blended. The comparison is the app's convention (provisional). KP stances rest on a cusp sub lord that changes every few minutes of birth time.";
