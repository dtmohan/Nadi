/**
 * The reading-room prose layer.
 *
 * The rule engines produce fragments: "Venus with the Sun: spouse from an influential family…".
 * A reader needs an argument: a claim, the configuration that carries it, the counterweight, and a
 * sentence that says what follows. This module turns the same computed data into that argument.
 *
 * It is deterministic. Every choice is a function of the chart and the rule id, so the same chart
 * always produces the same reading, and no sentence adds a rule that the app did not compute. The
 * source text stays in `evidence`; the prose is a paraphrase of it, not a replacement.
 */
import type { ChartResult } from "./schema";
import type { Gender } from "./marriage";
import { AYANAMSAS } from "./schema";
import { houseFrom, SIGNS, type Planet, type PlanetPosition } from "./astro";
import { LIFE_AREAS, type Finding, type LifeArea } from "./rules";
import type { AreaSynthesis } from "./synthesis";
import { synthesize } from "./synthesis";
import { agreementFor, agreementInput, type AgreementTopic, type SystemStance, type TopicAgreement } from "./agreement";
import { briefingFor, type Briefing, type BriefRow } from "./briefing";
import { readerExperience, type ReaderExperience, type ReaderTopic } from "./reader-experience";
import { PLAIN_TOPIC_LABEL, PLAIN_TOPIC_ORDER, type PlainTopic } from "./topic-brief";

// ── Public shapes ───────────────────────────────────────────────────────────────────────────────

export type ReadingLayer = "reading" | "working" | "critical";

/** The five marks from the review, plus the silent case. */
export type EvidenceMark = "source" | "provisional" | "calculation" | "statistical" | "convention" | "silent";

export interface EvidenceRef {
  id: string;
  finding: Finding;
  mark: EvidenceMark;
}

export interface ProseParagraph {
  id: string;
  text: string;
  evidence: EvidenceRef[];
  /** A subheading inside a chapter: "The person", "The work", "Money". */
  subhead?: string;
  /** The Parashari house frame, shown in Working and Critical. */
  frame?: string;
}

export interface ProseSection {
  id: string;
  kicker: string;
  title: string;
  paragraphs: ProseParagraph[];
  /** The chapter's other-school lines, shown in Working and Critical. */
  working?: Array<{ label: string; text: string }>;
  /** A line that belongs under the section, in the reading voice. */
  note?: string;
}

export interface SummaryLine {
  label: string;
  text: string;
}

export interface AreaIndexEntry {
  topic: PlainTopic;
  label: string;
  /** A short label for the contents rail. */
  short: string;
  tone: AreaSynthesis["tone"];
  chapter: string;
  id: string;
}

export interface ComparisonCell {
  system: "bnn" | "parashari" | "jaimini" | "kp";
  systemLabel: string;
  word: string;
  note: string;
  /** What this school was judging, in plain words. */
  judged: string;
  tier: string;
}

export interface ComparisonRow {
  topic: AgreementTopic;
  label: string;
  verdict: string;
  sentence: string;
  cells: ComparisonCell[];
}

export interface TimingFact {
  label: string;
  when: string;
  line?: string;
  system: string;
}

export interface SourceCount {
  source: string;
  count: number;
}

export interface SchoolCard {
  id: string;
  name: string;
  era: string;
  status: string;
  reads: string;
  texts: string;
  note: string;
}

export interface Provenance {
  birthLine: string;
  placeLine: string;
  ayanamsaLine: string;
  nodeLine: string;
  houseLine: string;
  sunriseLine: string;
  ephemerisLine: string;
  readingLine: string;
  fingerprint: string;
}

export interface ReadingDoc {
  title: string;
  standfirst: string;
  meta: {
    name: string;
    birthDate: string;
    birthTime: string;
    place: string;
    asOf: string;
    age: number;
    past: boolean;
    lagna: string;
    lagnaDegree: string;
    moon: string;
    sun: string;
  };
  sections: ProseSection[];
  /** The five-line map above the full reading. */
  summary: SummaryLine[];
  /** All eleven life areas, each pointing to its place in a chapter. */
  index: AreaIndexEntry[];
  comparison: ComparisonRow[];
  timing: TimingFact[];
  caveats: string[];
  sources: SourceCount[];
  schools: SchoolCard[];
  provenance: Provenance;
}

export interface ReadingInput {
  result: ChartResult;
  areas: AreaSynthesis[];
  agreement: TopicAgreement[];
  briefing: Briefing;
  experience: ReaderExperience;
}

// ── Small deterministic helpers ────────────────────────────────────────────────────────────────

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(seed: string, options: readonly T[]): T {
  return options[hash(seed) % options.length];
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lc = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const stripEnd = (s: string) => s.replace(/[\s.;:]+$/, "");
const tidy = (s: string) => s.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();

const ORD_WORDS = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];

function list(items: string[]): string {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs[0] ?? "";
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
}

function formatDate(iso: string | undefined | null): string {
  if (!iso) return "";
  const parts = iso.slice(0, 10).split("-").map(Number);
  const [y, m, day] = parts;
  if (!y || !m || !day || parts.length !== 3) return iso;
  return `${day} ${MONTHS[m - 1]} ${y}`;
}

function formatDegree(deg: number): string {
  let d = Math.floor(deg);
  let m = Math.round((deg - d) * 60);
  if (m === 60) { d += 1; m = 0; }
  return `${d}°${String(m).padStart(2, "0")}′`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function ageOn(birthIso: string, onIso: string): number {
  const b = new Date(`${birthIso.slice(0, 10)}T12:00:00Z`);
  const o = new Date(`${onIso.slice(0, 10)}T12:00:00Z`);
  let age = o.getUTCFullYear() - b.getUTCFullYear();
  if (o.getUTCMonth() < b.getUTCMonth() || (o.getUTCMonth() === b.getUTCMonth() && o.getUTCDate() < b.getUTCDate())) age--;
  return Math.max(0, age);
}

function sourceShort(source: string | undefined): string {
  if (!source) return "the source";
  if (/Naik/i.test(source)) return "Naik";
  if (/Rao/i.test(source)) return "Rao";
  if (/BPHS|Brihat Parashara/i.test(source)) return "BPHS";
  if (/Phaladeepika/i.test(source)) return "Phaladeepika";
  if (/Jaimini/i.test(source)) return "Jaimini";
  return "the source";
}

function canonicalSource(source: string): string {
  const s = source.trim();
  if (/^Naik$/i.test(s)) return "S. Naik, Prediction Secrets: Naadi Astrology";
  if (/^Rao['’]s basic rule/i.test(s)) return "R.G. Rao, Bhrigu Nandi Nadi";
  if (/^BPHS$/i.test(s)) return "BPHS (Santhanam)";
  return s;
}

function markFor(f: Finding): EvidenceMark {
  if (!f.source) return "convention";
  if (/provisional/i.test(f.source)) return "provisional";
  if (f.grade?.level === "reduced") return "calculation";
  return "source";
}

function cleanLabel(f: Finding, roles: ChartResult["reading"]["roles"]): string {
  let label = (f.text.split(": ")[0] ?? f.text).replace(/\s*\(not necessarily in the same sign\)/i, "").trim();
  label = label.replace(/\s*\([^)]*provisional[^)]*\)/i, "").trim();
  if (label.startsWith("Jeeva")) label = label.replace(/^Jeeva/, `${roles.native}, the Jeeva,`);
  if (label.startsWith("Karma")) label = label.replace(/^Karma/, `${roles.karma}, the Karma,`);
  if (label.startsWith("Kalatra")) label = label.replace(/^Kalatra/, `${roles.spouse}, the Kalatra,`);
  // "Jeeva bound to Karma" leaves the second role after the first replacement.
  if (label.includes("Karma") && !label.includes("the Karma")) label = label.replace(/\bKarma\b/, `${roles.karma}, the Karma`);
  if (label.includes("Kalatra") && !label.includes("the Kalatra")) label = label.replace(/\bKalatra\b/, `${roles.spouse}, the Kalatra`);
  return label.replace(/,\s*,/g, ",");
}

function gistOf(f: Finding): string {
  const i = f.text.indexOf(": ");
  let g = (i >= 0 ? f.text.slice(i + 2) : f.text).replace(/\s+/g, " ").trim();
  g = stripEnd(g);
  // The rule text is a fragment. Lower-case a common noun after the colon; keep proper names.
  if (/^(The|A|An|Spouse|Life|Marriage|Career|Profession|Wealth|Health|Children|Father|Mother|Education|Property|Vehicles|Travel|Foreign|Work|Mind|Body)\b/.test(g)) {
    g = lc(g);
  }
  return g;
}

function cleanedAreaHeadline(a: AreaSynthesis): string {
  let h = a.headline
    .replace(/^Well supported\.\s*/i, "")
    .replace(/^Asks for care\.\s*/i, "")
    .replace(/^The strong rules disagree\.\s*/i, "")
    .replace(/\s*Read both before deciding\.?$/i, "")
    .trim();
  return stripEnd(h);
}

function areaTheme(area: LifeArea): string {
  const map: Record<LifeArea, string> = {
    self: "sense of self",
    career: "work",
    authority: "public standing",
    marriage: "marriage",
    children: "children",
    wealth: "money",
    education: "education",
    family: "family",
    health: "health",
    spirituality: "inner life",
    travel: "travel",
  };
  return map[area];
}

function areaTitle(area: LifeArea): string {
  const map: Partial<Record<LifeArea, string>> = {
    self: "The native",
    career: "The work",
    marriage: "The marriage",
    wealth: "Money",
    health: "The body",
    education: "Education",
    family: "The family",
    spirituality: "The inner life",
    travel: "Travel",
    authority: "Standing",
    children: "Children",
  };
  return map[area] ?? LIFE_AREAS[area].label;
}

function cleanPeriod(what: string): string {
  const m = what.match(/^(\w+)\s+(dasa|antar|pratyantar)\b/i);
  if (m) {
    const lord = m[1];
    const kind = m[2].toLowerCase();
    if (kind === "dasa") return `${lord}’s main period`;
    if (kind === "antar") return `the ${lord} sub-period`;
    return `${lord}’s third-level period`;
  }
  if (/^the 5th house/i.test(what)) return "the 5th-house year";
  return what;
}

function cleanHouseMethod(m: string): string {
  if (m === "sripati") return "Sripati cusps";
  if (m === "equal") return "equal houses";
  return "whole-sign houses";
}

function cleanNode(n: string): string {
  return n === "true" ? "true node" : "mean node";
}

function cleanSunrise(s: string): string {
  const map: Record<string, string> = {
    edge: "upper limb, refracted",
    centre: "disc centre, refracted",
    "edge-true": "upper limb, no refraction",
    "centre-true": "disc centre, no refraction",
  };
  return map[s] ?? s;
}

function moonLabel(p: PlanetPosition | undefined): string {
  if (!p) return "";
  return `${p.sign} · ${p.nakshatra} ${p.pada}`;
}

function findPlanet(result: ChartResult, name: Planet): PlanetPosition | undefined {
  return result.positions.find((p) => p.planet === name);
}

function planetsInHouse(result: ChartResult, house: number): Planet[] {
  return result.positions
    .filter((p) => houseFrom(result.jaimini.lagna.signIndex, p.signIndex) === house)
    .map((p) => p.planet);
}

function fingerprint(result: ChartResult): string {
  const chart = result.chart;
  const seed = [
    chart.name,
    chart.birthDate,
    chart.birthTime,
    chart.place,
    chart.latitude,
    chart.longitude,
    chart.ayanamsa,
    chart.nodeType,
    chart.parashariHouseMethod,
    result.timeBasis.offsetSeconds,
    result.ayanamsaValue,
  ].join("|");
  return hash(seed).toString(16).padStart(8, "0");
}

const SYSTEM_LABEL: Record<"bnn" | "parashari" | "jaimini" | "kp", string> = {
  bnn: "Nadi",
  parashari: "Parashari",
  jaimini: "Jaimini",
  kp: "KP",
};

const TOPIC_CHAPTER: Record<PlainTopic, "native" | "work" | "bonds" | "mind"> = {
  self: "native",
  health: "native",
  career: "work",
  authority: "work",
  wealth: "work",
  marriage: "bonds",
  children: "bonds",
  family: "bonds",
  education: "mind",
  spirituality: "mind",
  travel: "mind",
};

const SHORT: Record<PlainTopic, string> = {
  self: "Self",
  health: "Body",
  career: "Career",
  authority: "Standing",
  wealth: "Money",
  marriage: "Marriage",
  children: "Children",
  family: "Family",
  education: "Learning",
  spirituality: "Inner life",
  travel: "Travel",
};

const SUBHEAD: Record<PlainTopic, string> = {
  self: "The person",
  health: "The body",
  career: "The work",
  authority: "Standing",
  wealth: "Money",
  marriage: "Marriage",
  children: "Children",
  family: "Family",
  education: "Learning",
  spirituality: "The inner life",
  travel: "Travel",
};

const AREA_NOUN: Record<PlainTopic, string> = {
  self: "The self",
  health: "The body",
  career: "Work",
  authority: "Standing",
  wealth: "Money",
  marriage: "Marriage",
  children: "Children",
  family: "Family",
  education: "Learning",
  spirituality: "The inner life",
  travel: "Travel",
};

const CHAPTER_NOTE: Record<"native" | "work" | "bonds" | "mind", string> = {
  native: "The self and the body are read together; the body section is a traditional indication, not a diagnosis.",
  work: "Career, standing and money are separate questions; the chapter keeps them separate.",
  bonds: "Marriage, children and family are not one verdict.",
  mind: "Learning, spiritual life and travel are descriptive areas; the chart gives directions, not achievements.",
};

const STATUS: Record<AreaSynthesis["tone"], string> = {
  supportive: "well supported",
  mixed: "mixed",
  care: "a caution",
  contested: "contested",
  quiet: "lightly marked",
  descriptive: "descriptive",
};

function firstSentence(text: string): string {
  return text.split(/(?<=\.)\s+/)[0] ?? text;
}

function ordinalWords(text: string): string {
  return text.replace(/\b(\d+)(?:st|nd|rd|th)\b/g, (_, n) => ORD_WORDS[Number(n)] ?? `${n}th`);
}

function cleanParashari(text: string): string {
  return tidy(
    ordinalWords(
      text
        .replace(/^In the selected Parashari house scheme,\s*/i, "")
        .replace(/\s*This position is part of the house reading; the house also covers other matters\.?$/i, ""),
    ),
  );
}

function cleanJaimini(text: string): string {
  return tidy(firstSentence(text.replace(/^For this shared Jaimini area,\s*/i, "")));
}

function cleanKp(text: string): string {
  const m = text.match(/(\d+)(?:st|nd|rd|th) house cusp.*?falls in ([A-Z][a-z]+)\. Its sub-lord is ([A-Z][a-z]+)/i);
  if (m) return `The ${ORD_WORDS[Number(m[1])] ?? m[1]} house cusp falls in ${m[2]}; its sub-lord is ${m[3]}.`;
  return tidy(firstSentence(text));
}

// ── The writer ─────────────────────────────────────────────────────────────────────────────────

class Writer {
  private readonly seed: string;
  private uses = 0;
  private frameOne = 0;
  private frameTwo = 0;
  private readonly native: Planet;
  private readonly karma: Planet;
  private readonly spouse: Planet;

  constructor(private readonly input: ReadingInput) {
    const r = input.result;
    this.seed = `${r.chart.name}|${r.chart.birthDate}|${r.chart.birthTime}|${r.ayanamsaValue}`;
    this.native = r.reading.roles.native;
    this.karma = r.reading.roles.karma;
    this.spouse = r.reading.roles.spouse;
  }

  take(key: string, options: readonly string[]): string {
    this.uses++;
    return pick(`${this.seed}|${key}|${this.uses}`, options);
  }

  private nextFrame(options: readonly string[], which: 1 | 2): string {
    const i = which === 1 ? this.frameOne++ : this.frameTwo++;
    return options[i % options.length];
  }

  get result() { return this.input.result; }
  get areas() { return this.input.areas; }
  get agreement() { return this.input.agreement; }
  get briefing() { return this.input.briefing; }
  get chart() { return this.input.result.chart; }
  get positions() { return this.input.result.positions; }
  get lagna() { return this.input.result.jaimini.lagna; }

  position(p: Planet): PlanetPosition | undefined {
    return this.positions.find((x) => x.planet === p);
  }

  get standard() {
    return this.position(this.result.reading.roles.native);
  }

  lead(): ProseParagraph[] {
    const r = this.result;
    const lagna = this.lagna;
    const lagnaSign = lagna.signIndex;
    const tenth = planetsInHouse(r, 10).sort((a, b) => (this.position(a)?.degInSign ?? 0) - (this.position(b)?.degInSign ?? 0));
    const native = this.position(this.native);
    const moon = this.position("Moon");

    const birth = `${this.chart.name} was born on ${formatDate(this.chart.birthDate)} at ${this.chart.birthTime} local time in ${this.chart.place}, with ${SIGNS[lagnaSign]} rising at ${formatDegree(lagna.degInSign)}.`;
    const centre = native
      ? ` The chart’s centre of gravity is ${this.native}, the Jeeva, ${this.describePlacement(native)}.`
      : "";
    const tenthNames = tenth.map((p) => (p === "Sun" ? "the Sun" : p));
    const tenthLine = tenth.length
      ? ` ${SIGNS[(lagnaSign + 9) % 12]} — the tenth sign from the rising — gathers ${list(tenthNames)}, which is where the work theme begins.`
      : "";
    const moonLine = moon
      ? ` The Moon is in ${moon.sign}, ${moon.nakshatra} ${moon.pada}, ${this.housePhrase(moon.signIndex)}.`
      : "";

    const p1: ProseParagraph = {
      id: "lead-1",
      text: tidy(`${birth}${centre}${tenthLine}${moonLine}`),
      evidence: [],
    };

    const p2: ProseParagraph = {
      id: "lead-2",
      text: this.leadPattern(),
      evidence: [],
    };

    return [p1, p2];
  }

  private describePlacement(p: PlanetPosition): string {
    const companions = this.positions.filter((x) => x.signIndex === p.signIndex && x.planet !== p.planet).map((x) => x.planet);
    const degree = formatDegree(p.degInSign);
    if (companions.length === 0) return `standing alone in ${p.sign} at ${degree}`;
    return `in ${p.sign} at ${degree}, with ${list(companions)}`;
  }

  private housePhrase(signIndex: number): string {
    const house = houseFrom(this.lagna.signIndex, signIndex);
    return `the ${ORD_WORDS[house]} house from the rising`;
  }

  private leadPattern(): string {
    const r = this.result;
    const jupiter = this.position(this.native);
    const saturn = this.position(this.karma);
    const moon = this.position("Moon");
    const sun = this.position("Sun");
    const tenth = planetsInHouse(r, 10);
    const hasSaturn = tenth.includes("Saturn");
    const hasMercury = tenth.includes("Mercury");
    const hasVenus = tenth.includes("Venus");
    const alone = jupiter && !this.positions.some((p) => p.signIndex === jupiter.signIndex && p.planet !== jupiter.planet);

    const opening = alone
      ? `The solitude of ${this.native} is the first thing to notice. In Nadi the native is read through the company the Jeeva keeps; here there is none, so the life is carried by the work itself.`
      : `The company ${this.native} keeps is the first thing to notice: the Jeeva is read through the planets that share its sign.`;

    const tenthBits = [
      hasSaturn ? "Saturn for patient method" : "",
      hasMercury ? "Mercury for analysis and speech" : "",
      hasVenus ? "Venus for form and value" : "",
    ].filter(Boolean);

    const second = hasSaturn || hasMercury || hasVenus
      ? `${cap(list(tenthBits))} gather in the tenth; that is the chart’s working signature, and it returns in almost every area below.`
      : "";

    const moonLine = moon && sun
      ? ` The Moon in ${moon.sign} and the Sun in ${sun.sign} give the reading its double register: one inward, one outward.`
      : "";

    return tidy([opening, second, moonLine].filter(Boolean).join(" "));
  }

  private areaClaim(a: AreaSynthesis): string {
    const key = `${a.area}|${a.tone}`;
    const noun = a.area === "marriage" ? "Marriage" : a.area === "career" ? "Work" : a.area === "health" ? "Health" : areaTitle(a.area);
    if (a.area === "career" && a.tone === "supportive") return "Work is the chart’s clearest line.";
    if (a.area === "wealth" && a.tone === "supportive") return "Money follows the work.";
    if (a.area === "self" && a.tone === "supportive") return "The native is warmly marked.";
    if (a.area === "health" && a.tone === "care") return "The body asks for care rather than confidence.";
    if (a.area === "children" && a.tone === "quiet") return "Children are lightly marked.";
    if (a.area === "family" && a.tone === "descriptive") return "Family is a set of separate lines, not one verdict.";
    if (a.tone === "contested") {
      return this.take(key, [
        `${noun} is where the chart becomes an argument.`,
        `${noun} is the chart’s open question.`,
        `The chart does not settle ${LC_AREA[a.area]}.`,
      ]);
    }
    if (a.tone === "care") {
      return this.take(key, [
        `${noun} is the chart’s caution.`,
        `${noun} asks for care rather than confidence.`,
        `${noun} carries a warning the chart does not soften.`,
      ]);
    }
    if (a.tone === "supportive") {
      return this.take(key, [
        `${noun} is one of the chart’s stronger lines.`,
        `${noun} is unusually clear.`,
        `The reading for ${LC_AREA[a.area]} carries more support than caution.`,
      ]);
    }
    if (a.tone === "quiet") return `${noun} is lightly marked.`;
    if (a.tone === "mixed") return `${noun} is mixed, and the chart says so.`;
    return `${noun} is descriptive rather than verdictive.`;
  }

  private config(f: Finding): string {
    return cleanLabel(f, this.result.reading.roles);
  }

  private evidenceFor(findings: Finding[]): EvidenceRef[] {
    return findings.map((f) => ({ id: `${f.area}:${f.ruleId}`, finding: f, mark: markFor(f) }));
  }

  private evidenceSentence(f: Finding, order: number, tone: AreaSynthesis["tone"]): string {
    const label = this.config(f);
    const gist = gistOf(f);
    const source = sourceShort(f.source);
    if (f.grade?.level === "cancelled") {
      return `${label} is cancelled by the app’s grading; the source’s line is not used.`;
    }
    if (order === 0) {
      if (source === "the source") {
        return this.nextFrame([
          `The rule reads ${label} — ${gist}.`,
          `The line is plain: ${label} — ${gist}.`,
          `The text has ${label} — ${gist}.`,
        ], 1);
      }
      return this.nextFrame([
        `${source}’s text has ${label} — ${gist}.`,
        `${source} puts it this way: ${label} — ${gist}.`,
        `The rule reads ${label} — ${gist}.`,
      ], 1);
    }
    const second = tone === "contested"
      ? [
          `The counterweight is ${label} — ${gist}.`,
          `Against that, ${label} — ${gist}.`,
          `The other side is ${label} — ${gist}.`,
          `The chart also holds ${label} — ${gist}.`,
        ]
      : tone === "care"
        ? [
            `The second caution is ${label} — ${gist}.`,
            `The same caution appears in ${label} — ${gist}.`,
            `A further line is ${label} — ${gist}.`,
            `Alongside it, ${label} — ${gist}.`,
          ]
        : [
            `A second line is ${label} — ${gist}.`,
            `The same pattern appears in ${label} — ${gist}.`,
            `Alongside it, ${label} — ${gist}.`,
            `The chart adds ${label} — ${gist}.`,
          ];
    return this.nextFrame(second, 2);
  }

  areaSection(a: AreaSynthesis): ProseSection {
    const findings = a.tone === "contested" && a.contest
      ? [a.contest.good, a.contest.hard]
      : a.key.slice(0, 2);
    const evidence = this.evidenceFor(findings);
    const claim = this.areaClaim(a);
    const sentences: string[] = [claim];

    findings.forEach((f, i) => sentences.push(this.evidenceSentence(f, i, a.tone)));
    const bridge = this.areaBridge(a);
    if (bridge) sentences.push(bridge);

    if (a.tone === "contested") {
      sentences.push(`The app does not average the two. It keeps support and delay in view, neither cancelling the other. Read together, they describe a ${this.contestedImage(a)}; the chart is not offering a promise or a denial.`);
    } else if (a.tone === "care") {
      sentences.push("This is a traditional indication, not a diagnosis. It names where the chart asks for attention, not what will happen.");
    } else if (a.tone === "supportive") {
      sentences.push(this.supportImage(a));
    } else if (a.tone === "quiet") {
      sentences.push("The chart is not making an individual claim here; it is describing a traditional link, and the difference matters.");
    } else {
      sentences.push("The chart gives these as directions, not as a verdict.");
    }

    return {
      id: a.area,
      kicker: "",
      title: areaTitle(a.area),
      paragraphs: [{ id: `area-${a.area}`, text: tidy(sentences.join(" ")), evidence }],
      note: a.tone === "contested" ? "The two strongest rules disagree; both are shown." : undefined,
    };
  }

  // ── v2: the eleven areas, the chapter frames, the summary ──────────────────────────────

  get experience() { return this.input.experience; }

  topicFor(topic: PlainTopic): ReaderTopic | undefined {
    return this.experience.topics.find((t) => t.natal.topic === topic);
  }

  private topicEvidence(rt: ReaderTopic | undefined, a: AreaSynthesis): EvidenceRef[] {
    const refs: EvidenceRef[] = [];
    for (const d of rt?.natal.detailEvidence ?? []) {
      if (!d?.ruleId) continue;
      const f = this.result.reading.findings.find((x) => x.ruleId === d.ruleId);
      if (!f || refs.some((r) => r.finding.ruleId === f.ruleId)) continue;
      refs.push({ id: `${f.area}:${f.ruleId}`, finding: f, mark: markFor(f) });
    }
    if (refs.length) return refs;
    return this.evidenceFor(a.key.slice(0, 2));
  }

  private parashariFrame(rt: ReaderTopic | undefined): string | undefined {
    if (!rt) return undefined;
    const index = rt.visibleSchools.findIndex((s) => s.school === "parashari");
    const ctx = rt.schoolContexts[index]?.find((c) => c.kind === "parashari-house");
    return ctx ? cleanParashari(ctx.en) : undefined;
  }

  private jaiminiFrame(rt: ReaderTopic | undefined): string | undefined {
    if (!rt) return undefined;
    const index = rt.visibleSchools.findIndex((s) => s.school === "jaimini");
    const ctx = rt.schoolContexts[index]?.find((c) => c.kind === "jaimini-karaka");
    return ctx ? cleanJaimini(ctx.en) : undefined;
  }

  private kpFrame(rt: ReaderTopic | undefined): string | undefined {
    if (!rt) return undefined;
    const index = rt.visibleSchools.findIndex((s) => s.school === "kp");
    const ctx = rt.schoolContexts[index]?.find((c) => c.kind === "kp-cusp");
    if (!ctx) return undefined;
    const line = cleanKp(ctx.en);
    const stance = this.agreement
      .find((a) => a.topic === (rt.natal.topic as AgreementTopic))
      ?.stances.find((s) => s.system === "kp");
    const verdict = stance?.word === "no verdict"
      ? " No general verdict fires."
      : stance?.word === "not read" ? " KP does not read it." : "";
    return `${line}${verdict}`;
  }

  private chapterWorking(topics: PlainTopic[]): Array<{ label: string; text: string }> {
    const primary = this.topicFor(topics[0]);
    const out: Array<{ label: string; text: string }> = [];
    const jaimini = this.jaiminiFrame(primary);
    const kp = this.kpFrame(primary);
    if (jaimini) out.push({ label: "Jaimini", text: jaimini });
    if (kp) out.push({ label: "KP", text: kp });
    return out;
  }

  private familySentences(rt: ReaderTopic | undefined, sentences: string[]): void {
    if (!rt) return;
    const details = rt.natal.details ?? [];
    const father = rt.prose?.[0]?.en;
    if (father) sentences.push(father);
    const rest = details
      .filter((d) => !(father && d.startsWith("Father:")))
      .map((d) => {
        const value = d.replace(/^[A-Z][a-z]+:\s*/, "");
        return /^Parents\b/.test(value) ? `The parents are ${lc(value.slice("Parents ".length))}` : value;
      });
    if (rest.length) sentences.push(`The other family lines are separate: ${rest.join(" ")}`);
    if (!father && !rest.length) sentences.push(rt.natal.summary);
    if (rt.natal.limit) sentences.push(rt.natal.limit);
  }

  private careClose(topic: PlainTopic): string {
    if (topic === "health") return "This is a traditional indication, not a diagnosis; it names where the chart asks for attention, not what will happen.";
    if (topic === "education") return "The chart names directions, not a degree.";
    return "The chart asks for care here; it does not predict an outcome.";
  }

  private areaParagraph(topic: PlainTopic, first: boolean): ProseParagraph {
    const a = this.areas.find((x) => x.area === topic);
    const rt = this.topicFor(topic);
    const frame = this.parashariFrame(rt);
    const evidence = a
      ? a.tone === "contested" && a.contest
        ? this.evidenceFor([a.contest.good, a.contest.hard])
        : this.topicEvidence(rt, a)
      : [];
    const sentences: string[] = [];
    if (a) sentences.push(this.areaClaim(a));
    else sentences.push(`${AREA_NOUN[topic]} is not read in this chart.`);
    if (first && frame) sentences.push(`In Parashari, ${lc(frame)}`);

    if (topic === "family" && rt) {
      this.familySentences(rt, sentences);
    } else if (a?.tone === "contested" && a.contest) {
      sentences.push(this.evidenceSentence(a.contest.good, 0, "contested"));
      sentences.push(this.evidenceSentence(a.contest.hard, 1, "contested"));
      sentences.push("The app does not average the two. It keeps support and delay in view, neither cancelling the other. Read together, they describe a partnership with weight and distance in it; the chart is not offering a promise or a denial.");
      if (rt?.natal.limit) sentences.push(rt.natal.limit);
    } else if (topic === "health") {
      const details = rt?.natal.details ?? [];
      if (details.length) {
        sentences.push(`The selected Nadi lines speak of ${list(details.map((d) => lc(d.replace(/\.$/, ""))))} rather than a named condition.`);
      } else if (a?.key[0]) {
        sentences.push(this.evidenceSentence(a.key[0], 0, a.tone));
      }
      if (rt?.natal.limit) sentences.push(rt.natal.limit);
    } else if (topic === "children") {
      sentences.push("The Nadi rules describe a traditional link between Jupiter and Venus, but not an individual outcome.");
      if (rt?.natal.limit) sentences.push(rt.natal.limit);
    } else if (a) {
      const reviewed = (rt?.prose ?? []).map((p) => p?.en).filter(Boolean) as string[];
      if (reviewed[0]) sentences.push(reviewed[0]);
      else if (a.key[0]) sentences.push(this.evidenceSentence(a.key[0], 0, a.tone));
      if (reviewed[1]) sentences.push(reviewed[1]);
      else if (!reviewed.length && a.key[1]) sentences.push(this.evidenceSentence(a.key[1], 1, a.tone));
      const bridge = this.areaBridge(a);
      if (bridge) sentences.push(bridge);

      if (a.tone === "care") sentences.push(this.careClose(topic));
      else if (a.tone === "quiet") sentences.push("The chart is not making an individual claim here; it is describing a traditional link, and the difference matters.");
      else if (a.tone === "descriptive") sentences.push("These are separate lines, not a combined verdict.");
      else if (a.tone === "supportive") sentences.push(this.supportImage(a));
      else sentences.push("The chart gives these as directions, not a verdict.");

      if (rt?.natal.limit && (topic === "marriage" || topic === "wealth" || topic === "education" || topic === "spirituality" || topic === "travel")) {
        sentences.push(rt.natal.limit);
      }
    }

    return {
      id: `area-${topic}`,
      text: tidy(sentences.join(" ")),
      evidence,
      subhead: SUBHEAD[topic],
      frame,
    };
  }

  chapterSection(
    id: "native" | "work" | "bonds" | "mind",
    kicker: string,
    title: string,
    topics: PlainTopic[],
  ): ProseSection {
    return {
      id,
      kicker,
      title,
      paragraphs: topics.map((topic, i) => this.areaParagraph(topic, i === 0)),
      working: this.chapterWorking(topics),
      note: CHAPTER_NOTE[id],
    };
  }

  summary(): SummaryLine[] {
    const status = (topic: PlainTopic, plural = false) => {
      const a = this.areas.find((x) => x.area === topic);
      if (!a) return "not read";
      if (a.tone === "care") return "asks for care";
      const verb = plural ? "are" : "is";
      if (a.tone === "descriptive") return `${verb} read separately`;
      return `${verb} ${STATUS[a.tone]}`;
    };
    const native = `The self ${status("self")}; the body ${status("health")}.`;
    const work = ["career", "authority", "wealth"].every((a) => this.areas.find((x) => x.area === a)?.tone === "supportive")
      ? "Work, money and standing are all well supported."
      : `Work ${status("career")}; money ${status("wealth")}; standing ${status("authority")}.`;
    const bonds = `Marriage ${status("marriage")}; children ${status("children", true)}; family ${status("family")}.`;
    const mind = `Learning ${status("education")}; the inner life ${status("spirituality")}; travel ${status("travel")}.`;
    const first = this.briefing.now[0];
    const time = `The reading is set at ${this.chart.deathDate ? "the recorded date" : "the present"}${first ? `, in ${cleanPeriod(first.what)}` : ""}.`;
    return [
      { label: "The native", text: native },
      { label: "Work & means", text: work },
      { label: "Bonds", text: bonds },
      { label: "Mind & meaning", text: mind },
      { label: "Time", text: time },
    ];
  }

  index(): AreaIndexEntry[] {
    const order: PlainTopic[] = ["self", "health", "career", "authority", "wealth", "marriage", "children", "family", "education", "spirituality", "travel"];
    return order.map((topic) => ({
      topic,
      label: PLAIN_TOPIC_LABEL[topic],
      short: SHORT[topic],
      tone: this.areas.find((a) => a.area === topic)?.tone ?? "quiet",
      chapter: TOPIC_CHAPTER[topic],
      id: `area-${topic}`,
    }));
  }

  private areaBridge(a: AreaSynthesis): string | null {
    if (a.tone === "contested") return null;
    if (a.area === "career") return "The two lines do not compete: analytical method and public form are two sides of the same working life.";
    if (a.area === "self") return "The warmth and the unconventional edge sit together without cancelling each other.";
    if (a.area === "health") return "The two lines agree on the same advice: protect the reserves, and do not mistake endurance for health.";
    return null;
  }

  private contestedImage(a: AreaSynthesis): string {
    if (a.area === "marriage") return "partnership with weight and distance in it";
    if (a.area === "career") return "working life pulled in two directions";
    return "life with two strong readings";
  }

  private supportImage(a: AreaSynthesis): string {
    if (a.area === "career") {
      return "The chart offers them as directions, not a job title.";
    }
    if (a.area === "wealth") {
      return "The chart gives a route, not an amount.";
    }
    if (a.area === "self") {
      return `The chart gives this as a temperament to work with, not a fate to obey.`;
    }
    return `The chart offers these as directions, not a prediction.`;
  }

  comparisonProse(): string {
    const label = (s: SystemStance) => SYSTEM_LABEL[s.system];
    const phrase = (s: SystemStance, i: number) =>
      `${label(s)} ${i === 0 ? "reads it as" : "as"} ${s.word}`;
    const speaks = (t: TopicAgreement | undefined) =>
      t ? t.stances.filter((s) => s.word !== "no verdict" && s.word !== "not read") : [];
    const quiet = (t: TopicAgreement | undefined) => {
      if (!t) return "";
      const q = t.stances.filter((s) => s.word === "no verdict" || s.word === "not read");
      return q.length ? `${list(q.map((s) => label(s)))} ${q.length > 1 ? "have" : "has"} no verdict.` : "";
    };
    const m = this.agreement.find((a) => a.topic === "marriage");
    const c = this.agreement.find((a) => a.topic === "career");
    const mSpeaks = speaks(m);
    const cSpeaks = speaks(c);
    const quietM = quiet(m);
    const quietC = quiet(c);
    const quietLine = quietM && quietC && quietM === quietC ? "KP has no verdict on either question." : [quietM, quietC].filter(Boolean).join(" ");
    return tidy([
      "The schools do not answer the same question.",
      m && mSpeaks.length ? `On marriage, ${list(mSpeaks.map(phrase))}.` : "",
      c && cSpeaks.length ? `On career, ${list(cSpeaks.map(phrase))}.` : "",
      quietLine,
      m && c ? `Marriage is a ${m.verdict === "disagree" ? "disagreement" : m.verdict}; career is a ${c.verdict}. Neither is a consensus.` : "",
      "Nadi reads a karaka and a sign relation; Jaimini reads the chara karakas and the padas; Parashari reads the bhava and its lord; KP reads the sub-lord of a cusp. The app keeps those objects apart.",
      "The disagreement is the finding, not a defect to be averaged away.",
    ].filter(Boolean).join(" "));
  }

  comparisonRows(): ComparisonRow[] {
    return this.agreement.map((a) => ({
      topic: a.topic,
      label: a.label,
      verdict: a.verdict,
      sentence: a.sentence,
      cells: a.stances.map((s) => ({
        system: s.system,
        systemLabel: SYSTEM_LABEL[s.system],
        word: s.word,
        note: s.note,
        judged: JUDGED[a.topic][s.system],
        tier: s.tier,
      })),
    }));
  }

  timingSection(): ProseSection {
    const rows = [...this.briefing.now];
    const date = this.chart.deathDate ? this.chart.deathDate : this.result.now.asOf;
    const age = ageOn(this.chart.birthDate, date);
    const past = !!this.chart.deathDate;
    const dateLine = past
      ? `The reading is set at the date of passing, ${formatDate(date)}, when the chart had run ${age} years.`
      : `The reading is set on ${formatDate(date)}, at age ${age}.`;

    const periodRows = rows.filter((r) => r.system === "Parashari").slice(0, 3);
    const skyRows = rows.filter((r) => r.system === "Ashtakavarga transit").slice(0, 2);
    const periods = periodRows.map((r) => `${cleanPeriod(r.what)}, ${r.when}`).join("; ");
    const sky = skyRows.map((r) => {
      const [place, houses = ""] = r.what.split(" · ");
      const houseWords = houses
        .split(", ")
        .map((h) => h.replace(/^(\d+)(st|nd|rd|th)\b/, (_, n) => `the ${ORD_WORDS[Number(n)]}`))
        .join(" and ");
      return `${place} — ${houseWords} — ${r.when}`;
    }).join("; ");
    const sentences = [
      dateLine,
      periods ? `The Vimshottari sequence reads ${periods}.` : "",
      sky ? `In the sky, ${sky}.` : "",
      "The tradition reads the period and the sky together; the app does not turn them into an event.",
    ].filter(Boolean);
    return {
      id: "time",
      kicker: "",
      title: "The timing",
      paragraphs: [{ id: "timing-1", text: tidy(sentences.join(" ")), evidence: [] }],
      note: "The period and transit lines are the app’s computed clocks; they are not a forecast.",
    };
  }

  sourceSection(): ProseSection {
    const caveats = [
      "The prose paraphrases the app’s rules. The rule text, source and grade sit in the evidence drawer; the prose does not add a rule of its own.",
      "A provisional mark is the app’s, not the tradition’s. It means the rule or the extension is the app’s working choice.",
      this.chart.timeUncertaintyMin
        ? `The birth time is stated with a ±${this.chart.timeUncertaintyMin}-minute band; lines that change inside it are marked in the working.`
        : "The birth time is stated to the minute; no uncertainty band is set, so the chart is read as given.",
      "This is a reading of a chart, not a forecast of events, a diagnosis, or a statement of what will happen.",
    ];
    return {
      id: "sources",
      kicker: "",
      title: "The apparatus",
      paragraphs: [{
        id: "sources-1",
        text: "A reading room is only as good as its apparatus. The sources, the marks and the provenance are below; the reading above is a paraphrase of them, not a substitute.",
        evidence: [],
      }],
      note: "The sources, marks and provenance are the apparatus; the reading above paraphrases them.",
    };
  }

  provenance(): Provenance {
    const r = this.result;
    const c = r.chart;
    const ayan = AYANAMSAS.find((a) => a.id === c.ayanamsa)?.label ?? c.ayanamsa;
    return {
      birthLine: `${formatDate(c.birthDate)} · ${c.birthTime} local time · ${c.place}`,
      placeLine: `${c.latitude.toFixed(4)}°, ${c.longitude.toFixed(4)}°`,
      ayanamsaLine: `${ayan} · ${formatDegree(r.ayanamsaValue)}`,
      nodeLine: cleanNode(c.nodeType),
      houseLine: cleanHouseMethod(c.parashariHouseMethod),
      sunriseLine: cleanSunrise(c.sunriseDef),
      ephemerisLine: "Swiss Ephemeris",
      readingLine: `Read ${formatDate(this.chart.deathDate ?? r.now.asOf)} · ascendant ${SIGNS[r.jaimini.lagna.signIndex]} ${formatDegree(r.jaimini.lagna.degInSign)}`,
      fingerprint: fingerprint(r),
    };
  }
}

const LC_AREA: Record<LifeArea, string> = {
  self: "the self",
  career: "the work",
  authority: "standing",
  marriage: "marriage",
  children: "children",
  wealth: "money",
  education: "education",
  family: "family",
  health: "health",
  spirituality: "the inner life",
  travel: "travel",
};

const JUDGED: Record<AgreementTopic, Record<"bnn" | "parashari" | "jaimini" | "kp", string>> = {
  marriage: {
    bnn: "karakas and sign relation",
    parashari: "7th bhava and its lord",
    jaimini: "chara karakas and padas",
    kp: "cusp sub-lord",
  },
  children: {
    bnn: "traditional links, not an outcome",
    parashari: "5th bhava and its lord",
    jaimini: "chara karakas and padas",
    kp: "cusp sub-lord",
  },
  career: {
    bnn: "karakas and sign relation",
    parashari: "10th bhava and its lord",
    jaimini: "chara karakas and padas",
    kp: "cusp sub-lord",
  },
  father: {
    bnn: "the father’s karaka links",
    parashari: "9th bhava and its lord",
    jaimini: "chara karakas and padas",
    kp: "not read",
  },
  mother: {
    bnn: "the mother’s karaka links",
    parashari: "4th bhava and its lord",
    jaimini: "chara karakas and padas",
    kp: "not read",
  },
  lifespan: {
    bnn: "not read",
    parashari: "ayurdaya methods",
    jaimini: "the three pairs",
    kp: "conditional cusp reading",
  },
};

const SCHOOLS: SchoolCard[] = [
  {
    id: "bnn",
    name: "Nadi",
    era: "Modern lineage, after R.G. Rao and S. Naik",
    status: "The reading’s lead voice",
    reads: "Planet-to-planet sign relations; no ascendant or houses. The Jeeva is Jupiter, the Karma Saturn.",
    texts: "R.G. Rao, Bhrigu Nandi Nadi · S. Naik, Prediction Secrets: Naadi Astrology",
    note: "The rules are compact and analogical. Their direction is often read from the wording; the app marks that as provisional where it applies.",
  },
  {
    id: "jaimini",
    name: "Jaimini",
    era: "Classical sutras with a modern commentarial layer",
    status: "A separate voice",
    reads: "Chara karakas, arudha padas, rasi drishti and Chara dasha. The app maps five general topics.",
    texts: "Jaimini Sutras · K.N. Rao’s commentary",
    note: "The notes are the app’s encoding, cited to no sutra or page; they are provisional.",
  },
  {
    id: "kp",
    name: "KP",
    era: "20th century",
    status: "A separate instrument",
    reads: "KP ayanamsa, Placidus cusps and sub-lords. It reads some topics and not others.",
    texts: "Krishnamurti Paddhati",
    note: "KP always uses its own ayanamsa and Placidus cusps, whatever the chart settings.",
  },
  {
    id: "parashari",
    name: "Parashari",
    era: "Classical corpus, several books",
    status: "The house-and-lord reading",
    reads: "Whole-sign bhavas, house lords, aspects, yogas and Vimshottari. Three books are weighed separately.",
    texts: "BPHS (Santhanam) · Phaladeepika · Sarvartha Chintamani (Bhasin)",
    note: "A first pass. A dispute between the three books stays visible in the working.",
  },
  {
    id: "alp",
    name: "ALP",
    era: "Modern framework",
    status: "Not mapped to these topics",
    reads: "The moving rising point and its progressions, shown in its own tab.",
    texts: "ALP",
    note: "The comparison says “not mapped” rather than “silent”: the app does not pretend to a verdict.",
  },
];

// ── Assembly ───────────────────────────────────────────────────────────────────────────────────

export function buildReadingInput(result: ChartResult): ReadingInput {
  const areas = synthesize(result.reading, result.chart.gender as Gender, result.reading.findings);
  const agreement = agreementFor(result, true);
  const briefing = briefingFor(result, agreementInput(result, true));
  const experience = readerExperience(result);
  return { result, areas, agreement, briefing, experience };
}

export function composeReading(input: ReadingInput): ReadingDoc {
  const w = new Writer(input);
  const r = input.result;
  const chart = r.chart;
  const lagna = r.jaimini.lagna;
  const moon = findPlanet(r, "Moon");
  const sun = findPlanet(r, "Sun");
  const date = chart.deathDate ? chart.deathDate : r.now.asOf;

  const sections: ProseSection[] = [
    {
      id: "chart",
      kicker: "01 · The chart",
      title: "The chart",
      paragraphs: w.lead(),
      note: "The birth chart is read as given; the reference chart beside the text is the same D1, in the South Indian layout.",
    },
  ];

  sections.push(w.chapterSection("native", "02 · The native", "The native", ["self", "health"]));
  sections.push(w.chapterSection("work", "03 · Work & means", "Work & means", ["career", "authority", "wealth"]));
  sections.push(w.chapterSection("bonds", "04 · Bonds", "Bonds", ["marriage", "children", "family"]));
  sections.push(w.chapterSection("mind", "05 · Mind & meaning", "Mind & meaning", ["education", "spirituality", "travel"]));

  const strongest = ["career", "wealth", "authority", "self"]
    .map((area) => input.areas.find((a) => a.area === area && a.tone === "supportive"))
    .find(Boolean) ?? input.areas[0];
  const contested = input.areas.find((a) => a.tone === "contested");
  const standfirst = contested && strongest
    ? `${cap(areaTheme(strongest.area))} is unusually clear in this chart — and ${areaTheme(contested.area)} is not.`
    : strongest
      ? `${cap(areaTheme(strongest.area))} is the chart’s clearest line.`
      : "A chart read in layers.";

  sections.push({
    id: "schools",
    kicker: "06 · The schools",
    title: "Where the schools differ",
    paragraphs: [{ id: "schools-1", text: w.comparisonProse(), evidence: [] }],
    note: "The table below shows each school’s verdict and the object it judged. No vote is counted.",
  });

  sections.push({ ...w.timingSection(), kicker: "07 · Time", title: "Time" });
  sections.push({ ...w.sourceSection(), kicker: "08 · The apparatus" });

  const comparison = w.comparisonRows();
  const timing = input.briefing.now.map((row: BriefRow) => ({
    label: `${row.system} · ${cleanPeriod(row.what)}`,
    when: row.when,
    line: row.line,
    system: row.system,
  }));

  return {
    title: `A reading for ${chart.name}`,
    standfirst,
    meta: {
      name: chart.name,
      birthDate: chart.birthDate,
      birthTime: chart.birthTime,
      place: chart.place,
      asOf: date,
      age: ageOn(chart.birthDate, date),
      past: !!chart.deathDate,
      lagna: SIGNS[lagna.signIndex],
      lagnaDegree: formatDegree(lagna.degInSign),
      moon: moonLabel(moon),
      sun: sun ? `${sun.sign} · ${sun.nakshatra} ${sun.pada}` : "",
    },
    sections,
    summary: w.summary(),
    index: w.index(),
    comparison,
    timing,
    caveats: [
      "The prose is a paraphrase of the app’s rules; the rules are the reading, and the source text is in the evidence drawer.",
      "A provisional mark belongs to the app, not to the tradition. It marks a working choice or an adjacent-sign extension.",
      chart.timeUncertaintyMin
        ? `The birth time carries a ±${chart.timeUncertaintyMin}-minute band; lines that change inside it are marked.`
        : "The birth time is stated to the minute; no band is set.",
      "This is not a forecast of events, a diagnosis, or a claim about what will happen.",
      "The room keeps the five general topics. Life span is a separate, gated topic and is not read here; maraka, arishta and kin-loss statements are withheld for living charts and minors.",
    ],
    sources: sourceCounts(sections),
    schools: SCHOOLS,
    provenance: w.provenance(),
  };
}

function sourceCounts(sections: ProseSection[]): SourceCount[] {
  const counts = new Map<string, number>();
  for (const s of sections) {
    for (const p of s.paragraphs) {
      for (const e of p.evidence) {
        const src = e.finding.source;
        if (!src) continue;
        // Split composite sources at the semicolon; keep the edition line readable.
        const key = src.split(";")[0].trim();
        counts.set(key, (counts.get(key) ?? 0) + 1);
        for (const reason of e.finding.grade?.reasons ?? []) {
          if (!reason.source) continue;
          const rkey = canonicalSource(reason.source);
          counts.set(rkey, (counts.get(rkey) ?? 0) + 1);
        }
      }
    }
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}
