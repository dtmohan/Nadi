/**
 * The house-by-house reading of the Parashari tab and report: one reading per house, composed from
 * what the reading already holds, in the order agreed for the reader-first report:
 *   1. what the house covers (BPHS 11.2-13);
 *   2. where its ruler sits (ch. 24), with the strength qualifier of 24.145 and the cancellation of
 *      24.145-148 when the ruler's two lordships read opposite ways;
 *   3. the planets in it (Phaladeepika ch. 8; 8.25-33 for the nodes), by the chart's house method;
 *   4. the aspects the rules count (26.2-5, at the chosen floor);
 *   5. what Parashara's chapter on the house adds (ch. 12-23);
 *   6. his own weighing of the house (11.14-16; read as the house's lean, provisional).
 *
 * Every part has two registers. The practitioner text keeps the verse wording and the technical
 * terms; the verse tags travel in `sources`. The plain text addresses the reader as "you", names the
 * books in plain words and carries no verse tag. It is softened here (gentle.ts), on the verse's own
 * wording, before the second person replaces that wording, so the gentle rewrites still match; the
 * plain views soften again at render, which leaves it unchanged.
 *
 * Built after the sensitive-content gate, from the gated result, so a withheld statement cannot
 * reach the prose. The one table read here directly (the ch. 24 readings) is redacted the same way.
 */
import type { Planet } from "./astro";
import { HOUSE_AREAS_PLAIN, listJoin, ordH, thePlanet } from "./house-gloss";
import { BPHS_URL, LORD_IN_HOUSE } from "./parashari-data";
import { HOUSE_MATTERS, type BhavaJudgement } from "./parashari-houses";
import { readsPlain } from "./phaladeepika-houses";
import { soften } from "./gentle";
import { redactProse } from "./life-stage";
import type { AspectFloor, ParashariResult, ParashariSource } from "./parashari";
import { strengthQualifierPlain } from "./shadbala";

type Tone = "support" | "strain" | "mixed";

export type HouseProseKey = "covers" | "lord" | "planet" | "empty" | "aspects" | "chapter" | "both" | "weighing";

export interface HouseProsePart {
  key: HouseProseKey;
  /** Practitioner register: verse wording and technical terms. */
  text: string;
  /** Plain register: second person, softened, no verse tags. */
  textPlain: string;
  sources: ParashariSource[];
  tone?: Tone;
  /** For a "planet" part: the planet read. */
  planet?: Planet;
}

export interface HouseProse {
  house: number;
  /** "10th house (Cancer)". */
  title: string;
  /** "Your 10th house". */
  titlePlain: string;
  /** One line for the folded row. */
  summary: string;
  summaryPlain: string;
  /** The 11.14-16 lean of the house. */
  tone: BhavaJudgement["tone"];
  parts: HouseProsePart[];
}

export const HOUSE_PROSE_NOTE =
  "Each house in turn: its matters (11.2-13); the lord's placement (ch. 24), with the strength qualifier of 24.145; the occupants by Phaladeepika ch. 8 (8.25-33 for the nodes), in the chart's house method; the aspects at the rules' floor (26.2-5); the house chapter (ch. 12-23); and the test of 11.14-16, read as the house's lean (provisional).";

export const HOUSE_PROSE_NOTE_PLAIN =
  "Each house is read in the same order: what it covers, where its ruler sits, the planets in it, the planets that look at it, what Parashara's chapter on the house adds, and his own weighing of it. The house and ruler readings are Parashara's, from the Brihat Parashara Hora Sastra; the planets in each house are read from Mantreswara's Phaladeepika. Each line is one book's reading of one part of the chart, so the lines can pull different ways: read them as views to weigh, not as a sum.";

const PLANET = "Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu";
const ORDINAL = "\\d+(?:st|nd|rd|th)";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lcFirst = (s: string) =>
  new RegExp(`^(?:${PLANET}|Parashara|Mantreswara)\\b`).test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
const endStop = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const sentenceCaps = (s: string) => s.replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre: string, c: string) => pre + c.toUpperCase());

/** A verb in the third person singular put in the second person: "is" → "are", "carries" → "carry". */
function secondPerson(word: string): string {
  const irregular: Record<string, string> = { is: "are", has: "have", was: "were", does: "do", goes: "go" };
  const w = word.toLowerCase();
  if (irregular[w]) return irregular[w];
  if (!/s$/.test(w) || /(?:ous|ss|us|is)$/.test(w)) return word;
  if (/ies$/.test(w)) return word.slice(0, -3) + "y";
  if (/(?:sses|shes|ches|xes|zes|oes)$/.test(w)) return word.slice(0, -2);
  return word.slice(0, -1);
}

/**
 * The verse's third person put in the second: "the native is wealthy, looks after his people and becomes
 * famous" → "you are wealthy, look after your people and become famous"; "one's work" → "your work".
 * Only the clause that follows "the native" is re-voiced, item by item, so "his" elsewhere (Parashara's)
 * is left alone.
 */
export function toYou(s: string): string {
  const clause = (c: string) =>
    c
      .split(/(, and |, | and )/)
      .map((b, i) => {
        if (i % 2 === 1) return b;
        const fixed = b.replace(/\bhimself\b/g, "yourself").replace(/\bhis\b/g, "your").replace(/\bhim\b/g, "you");
        const m = fixed.match(/^(\S+)([\s\S]*)$/);
        return m ? secondPerson(m[1]) + m[2] : fixed;
      })
      .join("");
  return s
    .replace(/\breads an? native who ([^.;:]*)/g, (_m, c: string) => `reads that you ${clause(c)}`)
    .replace(/\breads an? native (?=governed|fond|endowed|devoid|bereft)/g, "reads you as ")
    .replace(/\breads an? ([a-z]+(?: and [a-z]+)?) native\b/g, "reads you as $1")
    .replace(/\bbetween father and native\b/g, "between your father and you")
    .replace(/\bthe native's\b/g, "your")
    .replace(/\b(?:such a|the) native\b(?!'s)\s+([^.;:]*)/g, (_m, c: string) => `you ${clause(c)}`)
    .replace(/\bone's own\b/g, "your own")
    .replace(/\bone's\b/g, "your")
    .replace(/\boneself\b/g, "yourself");
}

/** Houses and planets as the reader's own: "Mercury, lord of the 2nd" → "Mercury, ruler of your 2nd house". */
export function yourHouses(s: string): string {
  const the = (m: string) => (m[0] === "T" ? "The" : "the");
  const your = (m: string) => (m[0] === "T" ? "Your" : "your");
  return s
    .replace(new RegExp(`\\b(${PLANET}), lord of the lagna\\b`, "g"), "$1, ruler of your 1st house")
    .replace(new RegExp(`\\b(${PLANET}), lord of the (${ORDINAL})\\b`, "g"), "$1, ruler of your $2 house")
    .replace(new RegExp(`\\blords of the (${ORDINAL}) and (${ORDINAL})\\b`, "g"), "rulers of your $1 and $2 houses")
    .replace(/\b[Tt]he lagna lord\b/g, (m) => `${the(m)} ruler of your 1st house`)
    .replace(/\blord of the lagna\b/g, "ruler of your 1st house")
    .replace(new RegExp(`\\b[Tt]he (${ORDINAL}) lord\\b`, "g"), (m, h: string) => `${the(m)} ruler of your ${h} house`)
    .replace(new RegExp(`\\((${ORDINAL}) lord\\)`, "g"), "(ruler of your $1 house)")
    .replace(/\b([Ii])ts lord\b/g, (_m, i: string) => `${i}ts ruler`)
    .replace(/\b[Tt]he lagna\b/g, (m) => `${your(m)} 1st house`)
    .replace(/\blagna\b/g, "1st house")
    .replace(
      new RegExp(`\\b[Tt]he (${ORDINAL})\\b(?! from| or \\d| year|-year| navamsa| and ${ORDINAL} year)`, "g"),
      (m, h: string) => `${your(m)} ${h}`,
    )
    .replace(/(?<!\b(?:the|The|waning|waxing) )\b(Sun|Moon)\b/g, "the $1");
}

/** The strength terms of the Shadbala pass in plain words. */
function plainStrength(s: string): string {
  return s
    .replace(/\bhas strength above its (?:Shadbala )?requirement\b/g, "has more than the strength Parashara asks for")
    .replace(/\bits Shadbala requirement\b/g, "the strength Parashara asks for")
    .replace(/\bby Shadbala\b/g, "by its strength")
    .replace(/\bholds (\w+) in the dasavarga\b/g, "holds $1, a good rank, in the divisional charts")
    .replace(/\bco-born\b/g, "siblings")
    .replace(/\bthe lords of\b/g, "the rulers of")
    .replace(/\bboth lords\b/g, "both rulers")
    .replace(/\bits dispositor (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)\b/g, "$1, ruler of the sign it occupies,");
}

const VERSE = /\b\d+\.\d+(?:-\d+)?\b/;
/** Clauses that explain the app's reading of the verse rather than what the verse reads: practitioner detail. */
const ASIDES: RegExp[] = [
  /\bis read as\b/,
  /\bis accepted here\b/,
  /\bis not evaluated\b/,
  /\bthe wording is his\b/,
  /\bshown as written\b/,
  /\bis his and\b/,
  /\bSanthanam\b/,
  /\bprovisional\b/,
  /^Combustion follows\b/,
  /^He names\b/,
  /\bhe excludes\b/,
  /\bhis word for\b/,
  /\bhis stricter\b/,
  /^The combination is common\b/,
  /^Planet sex\b/,
  /\bhis alternative clause\b/,
  /^The text reads\b/,
  /\bis assumed\b/,
  /\bnot counted\b/,
  /\bis the counterweight\b/,
  /\balready past that age\b/,
];

/**
 * A chapter finding in the plain register: softened on the verse wording, the practitioner asides and
 * verse tags dropped, then the reader's own houses and the second person.
 */
export function plainChapter(text: string): string {
  const soft = soften(text)
    .replace(/\s*\((?=[^)]*(?:\d+\.\d+|not counted|good vargas|enmity))[^)]*\)/g, "")
    .replace(/\bthe contrary of \d+\.\d+(?:-\d+)? follows\b/g, "the opposite follows")
    .replace(/\bthough \d+\.\d+(?:-\d+)? sets the lagna lord's weakness against\b/g, "though he sets a weak ruler of your 1st house against");
  const clauses = soft.split(/(?<=[.;])\s+/);
  const kept: string[] = [];
  for (const c0 of clauses) {
    if (ASIDES.some((re) => re.test(c0))) continue;
    let c = c0
      .replace(/^(\d+\.\d+(?:-\d+)?) adds that\b/, "Parashara adds that")
      .replace(/ (?:by|under|from|of|in) (?:the )?\d+\.\d+(?:-\d+)?\b/g, "");
    if (VERSE.test(c)) {
      // "Parashara reads X here, and 16.8 counts ...;" keeps "Parashara reads X here".
      const end = /[.;]$/.test(c) ? c.slice(-1) : "";
      const subs = c.replace(/[.;]$/, "").split(/, (?=(?:and|but|while|though) )/);
      if (VERSE.test(subs[0])) continue;
      c = subs.filter((x) => !VERSE.test(x)).join(", ") + end;
    }
    kept.push(c);
  }
  let out = kept.join(" ").replace(/;(\s+[A-Z]|\s*$)/g, ".$1");
  out = toYou(yourHouses(plainStrength(out)));
  return sentenceCaps(endStop(out));
}

const QUARTER_PLAIN: Record<number, string> = { 1: "at a quarter strength", 2: "at half strength", 3: "at three-quarter strength", 4: "fully" };
const QUARTER: Record<number, string> = { 1: "1/4", 2: "1/2", 3: "3/4", 4: "full" };
const FLOOR_PLAIN: Record<AspectFloor, string> = { 4: " with full strength", 2: " with half strength or more", 1: "" };
const FLOOR: Record<AspectFloor, string> = { 4: "full aspects only", 2: "half or stronger", 1: "every quarter" };

const toneWordPlain: Record<BhavaJudgement["tone"], string> = {
  support: "Parashara's test finds it favoured.",
  strain: "Parashara's test finds it under strain.",
  mixed: "Parashara's test finds signs both ways.",
  none: "Parashara's test finds no sign either way.",
};

/**
 * One reading per house from the (gated) Parashari result. `withhold` redacts the ch. 24 table read here
 * directly, and the app's own notes, by the same sentence rule as the gate.
 */
export function composeHouseProse(par: Omit<ParashariResult, "houseProse">): HouseProse[] {
  const withhold = par.withheld;
  const G = (s: string) => (withhold ? redactProse(s) : s);
  const out: HouseProse[] = [];
  // N1: a line that states a cancelled debility carries the cancellation beside it, in both views.
  const withCancel = (text: string, textPlain: string, f?: { debilityCancelled?: { text: string; plain: string } }) =>
    f?.debilityCancelled
      ? { text: `${text} ${f.debilityCancelled.text}`, textPlain: `${textPlain} ${f.debilityCancelled.plain}` }
      : { text, textPlain };
  for (const b of par.bhavas) {
    const h = b.house;
    const parts: HouseProsePart[] = [];
    const hm = HOUSE_MATTERS[h - 1];
    // 1. What the house covers.
    parts.push({
      key: "covers",
      text: `The ${ordH(h)} house, ${b.sign}, lord ${b.lord}: ${G(hm.matters)}.`,
      textPlain: `Your ${ordH(h)} house covers ${HOUSE_AREAS_PLAIN[h]}. It falls in ${b.sign}, and its ruler is ${thePlanet(b.lord)}.`,
      sources: [{ label: `Parashara 11.${hm.verse}`, url: BPHS_URL(11) }],
    });

    // 2. Where its ruler sits (ch. 24).
    const lordCard = par.findings.find((f) => f.id === `pa-lord-${h}-${b.lordIn}`);
    const e = LORD_IN_HOUSE[h - 1][b.lordIn - 1];
    const effect = G(e.text);
    const sb = par.shadbala?.planets.find((x) => x.planet === b.lord);
    const Lord = cap(thePlanet(b.lord));
    const where = b.lordIn === h ? "in the house itself" : `in your ${ordH(b.lordIn)} (${HOUSE_AREAS_PLAIN[b.lordIn]})`;
    const lordSources: ParashariSource[] = [{ label: `Parashara 24.${e.verse}`, url: BPHS_URL(24) }];
    if (lordCard?.nullified) {
      const other = Number(lordCard.nullified.with.split("-")[2]);
      lordSources.push(lordCard.nullified.source);
      parts.push({
        key: "lord",
        text: `${lordCard.text} ${lordCard.nullified.text}`,
        textPlain: `${Lord}, ruler of your ${ordH(h)} house, sits ${where}. ${Lord} also rules your ${ordH(other)} house, and from where it sits Parashara's readings for its two houses run opposite ways; he sets such contrary readings aside, so neither is counted here.`,
        sources: lordSources,
      });
    } else {
      const qualifierPlain = !sb ? "" : ` ${strengthQualifierPlain(Lord, sb)}.`;
      if (sb) lordSources.push({ label: "Parashara 24.145", url: BPHS_URL(24) });
      parts.push({
        key: "lord",
        ...withCancel(
          lordCard?.text ?? `${b.lord}, lord of the ${ordH(h)}, stands in the ${ordH(b.lordIn)}.`,
          effect
            ? `Since ${thePlanet(b.lord)}, ruler of your ${ordH(h)} house, sits ${where}, Parashara reads: ${lcFirst(toYou(soften(effect)))}${qualifierPlain}`
            : `${Lord}, ruler of your ${ordH(h)} house, sits ${where}.`,
          lordCard,
        ),
        tone: effect ? e.tone : undefined,
        sources: lordSources,
      });
    }

    // 3. The planets in it (Phaladeepika ch. 8), by the chart's house method.
    const placed = par.findings.filter((f) => f.placement && f.house === h);
    for (const f of placed) {
      const r = f.placement!;
      const p = r.planet;
      const rashiHouse = par.bhavas.find((x) => x.occupants.includes(p))?.house ?? h;
      const moved = rashiHouse !== h;
      const methodName = par.houseMethod === "sripati" ? "Sripati" : "equal";
      const sign = f.text.match(/, in ([A-Z][a-z]+)/)?.[1];
      parts.push({
        key: "planet",
        planet: p,
        ...withCancel(
          f.text,
          [
            `Since ${thePlanet(p)} is in your ${ordH(h)} house${sign ? `, in ${sign}` : ""}, ${readsPlain(r)}`,
            r.cond?.[1] ?? "",
            r.note?.[1] ?? "",
            moved
              ? `This uses the ${methodName} house division; by whole sign ${thePlanet(p)} is in your ${ordH(rashiHouse)}, and Mantreswara counts by sign, so this reading is provisional.`
              : "",
          ]
            .filter(Boolean)
            .map((x) => soften(x))
            .join(" "),
          f,
        ),
        tone: f.tone,
        sources: [f.source],
      });
    }
    if (!placed.length)
      parts.push({
        key: "empty",
        text: `No planet occupies the ${ordH(h)}.`,
        textPlain: `No planet sits in your ${ordH(h)} house.`,
        sources: [],
      });

    // 4. The aspects the rules count.
    const floor = par.aspectFloor;
    const asp = b.aspects.filter((a) => a.quarters >= floor);
    parts.push({
      key: "aspects",
      text: asp.length
        ? `Aspected by ${listJoin(asp.map((a) => `${a.planet} (${QUARTER[a.quarters]})`))}; the rules count ${FLOOR[floor]}.`
        : `No aspect at the rules' floor (${FLOOR[floor]}).`,
      textPlain: asp.length
        ? `${cap(listJoin(asp.map((a) => (floor === 4 ? thePlanet(a.planet) : `${thePlanet(a.planet)} ${QUARTER_PLAIN[a.quarters]}`))))} ${asp.length === 1 ? "looks" : "look"} at your ${ordH(h)} house${floor === 4 ? " with full strength" : ""}.`
        : `No planet looks at your ${ordH(h)} house${FLOOR_PLAIN[floor]}.`,
      sources: [{ label: "Parashara 26.2-5", url: BPHS_URL(26) }],
    });

    // 5. What Parashara's chapter on the house adds (ch. 12-23).
    const chapter = par.findings.filter(
      (f) => f.kind === "house" && !f.placement && f.house === h && f.source.label.startsWith("Parashara "),
    );
    for (const f of chapter) {
      const plain = plainChapter(f.text);
      if (!plain.replace(/[.\s]/g, "")) continue;
      parts.push({ key: "chapter", ...withCancel(f.text, plain, f), tone: f.tone, sources: [f.source] });
    }

    // The readings above both ways: say so once, before the weighing.
    const j = par.bhavaJudgement.find((x) => x.house === h);
    const tones = parts.filter((x) => x.key === "lord" || x.key === "planet" || x.key === "chapter").map((x) => x.tone);
    const hasSupport = tones.includes("support");
    if (h === 8 && hasSupport && (tones.includes("strain") || tones.includes("mixed"))) {
      const text = G(
        "Parashara's length-of-life verses may read both ways on one chart; 19.7 leaves the decision to planetary strength, so the readings above are views of the text, not a contradiction.",
      );
      if (text)
        parts.push({
          key: "both",
          text,
          textPlain: G(
            "Parashara's verses on the length of life can read both ways on one chart. He leaves the decision to the strength of the planets, so read the lines above as views, not as a contradiction.",
          ),
          sources: [{ label: "Parashara 19.7", url: BPHS_URL(19) }],
        });
    } else if (hasSupport && tones.includes("strain")) {
      const lean =
        j?.tone === "support"
          ? "leans to the house prospering"
          : j?.tone === "strain"
            ? "leans against the house"
            : j?.tone === "mixed"
              ? "finds signs on both sides"
              : "finds no sign either way";
      parts.push({
        key: "both",
        text: `The readings above run both ways and the books do not rank them. Parashara's test for judging a house (11.14-16) ${lean}; read the verses as views to weigh, not a sum.`,
        textPlain: `The readings above run both ways, and the books do not rank them. Parashara's own test of a house, below, ${lean}; read the lines as views to weigh, not as a sum.`,
        sources: j ? [j.source] : [],
      });
    }

    // 6. His own weighing (11.14-16).
    if (j) {
      // The plain points name their verse where a rule is borrowed ("(3.11)"); the plain register drops the tag.
      const untag = (x: string) => yourHouses(x.replace(/\s*\(\d+\.\d+(?:-\d+)?\)/g, ""));
      const sp = j.supportPlain.map(untag);
      const st = j.strainPlain.map(untag);
      const text =
        j.tone === "none"
          ? "11.14-16: no sign of the house prospering or failing holds."
          : `${j.support.length ? `Signs of the house prospering: ${listJoin(j.support)}.` : ""} ${j.strain.length ? `Signs against it: ${listJoin(j.strain)}.` : ""}`.trim() +
            (j.chalitNote ? ` ${j.chalitNote}` : "");
      const textPlain =
        j.tone === "none"
          ? "Weighing the house as a whole, Parashara's test finds no sign either way."
          : j.tone === "support"
            ? `Weighing the house as a whole, Parashara finds signs in its favour: ${sp.join("; ")}.`
            : j.tone === "strain"
              ? `Weighing the house as a whole, Parashara finds signs against it: ${st.join("; ")}.`
              : `Weighing the house as a whole, Parashara finds signs both ways. In its favour: ${sp.join("; ")}. Against it: ${st.join("; ")}.`;
      parts.push({
        key: "weighing",
        text,
        textPlain: soften(textPlain),
        tone: j.tone === "none" ? undefined : j.tone,
        sources: [j.source],
      });
    }

    const occ = placed.map((f) => f.placement!.planet);
    out.push({
      house: h,
      title: `${ordH(h)} house (${b.sign})`,
      titlePlain: `Your ${ordH(h)} house`,
      summary: `${cap(G(hm.matters).split(", ").slice(0, 3).join(", "))}; lord ${b.lord} in the ${ordH(b.lordIn)}; ${occ.length ? occ.join(", ") : "no occupant"}; 11.14-16 ${j?.tone ?? "none"}`,
      summaryPlain: `${cap(HOUSE_AREAS_PLAIN[h])}. ${b.sign}, ruled by ${thePlanet(b.lord)}${occ.length ? `, with ${listJoin(occ.map(thePlanet))} in it` : ""}. ${toneWordPlain[j?.tone ?? "none"]}`,
      tone: j?.tone ?? "none",
      parts,
    });
  }
  return out;
}
