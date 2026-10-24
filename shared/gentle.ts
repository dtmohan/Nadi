// Gentle wording for sensitive results. The classical texts speak plainly of death, loss and
// disease; the plain reading of the app does not. `soften` rewrites them in three layers, and the
// practitioner reading shows the text as written:
//  1. Statements: whole clauses the rule modules use that no word swap can make gentle (a span
//     "his verse calls short", an attachment outside the marriage), each rewritten in full.
//  2. Hard verses: a sentence the modules mark "shown as written" keeps its place and its weighing,
//     but not the verse's wording: "Parashara has a harder line here on marriage, given in full in
//     the practitioner view". The topic is read from the clause itself.
//  3. Phrases: the fixed phrases of death, loss and disease, into the register of risk, loss and
//     strain, leaving the technical names (maraka, Balarishta, Baladi's mrita) intact.
// Every map is deliberately explicit, phrase by phrase, so that no rule's meaning is changed by a
// blind substitution; a short generic fallback covers stray words. PLAIN_DENY lists what the plain
// reading must never print; scripts/gentle-plain.test.ts holds the reports to it.
const PHRASES: [RegExp, string][] = [
  // Brihat Jataka 6 and BPHS 9
  [/mother and child die/gi, "danger to mother and child"],
  [/the child dies/gi, "the child is at risk"],
  [
    /death of mother and child, or of the child/gi,
    "risk to mother and child, or to the child",
  ],
  [
    /death of the child, or of mother and child/gi,
    "risk to the child, or to mother and child",
  ],
  [
    /immediate death of the child with its mother/gi,
    "grave risk to the child and its mother",
  ],
  [/death within a month of birth/gi, "grave risk in the first month"],
  [
    /death and an early end for the mother/gi,
    "risk to life and a shortened span for the mother",
  ],
  [/combinations for death in infancy/gi, "combinations of risk in infancy"],
  [/death soon after birth/gi, "risk in infancy"],
  [/death at once/gi, "immediate risk"],
  [/death at the stated term/gi, "risk within the stated term"],
  [/timing of the death/gi, "timing of the risk"],
  [/the death falls when/gi, "the risk falls when"],
  [/kills at once/gi, "marks immediate risk"],
  [/early death/gi, "risk in infancy"],
  // Marakas, mother point, dasa readings
  [/the death does not take place/gi, "the risk does not materialise"],
  [/bring her death/gi, "bring a hard period for her"],
  [/allows death only when/gi, "allows the gravest result only when"],
  [/rather than death/gi, "rather than the gravest result"],
  [/death only at an advanced age/gi, "the end only at an advanced age"],
  [/the death clause/gi, "the harshest clause"],
  [/own death/gi, "own end"],
  [/(family|sight|losses|spouse), death(?=[,;).]|$)/gi, "$1, the span of life"],
  [/Sons; death/g, "Sons; the span of life"],
  [
    /death when an unfavourable dasa runs/gi,
    "the risk when an unfavourable dasa runs",
  ],
  [/death is possible/gi, "risk to life is possible"],
  [/death may be feared/gi, "risk to life may be feared"],
  [/death of, or distress to, the mother/gi, "a hard period for the mother"],
  [/her death may occur/gi, "a hard period for her is possible"],
  [/death may occur/gi, "a hard period is possible"],
  [/death or distress/gi, "a hard period"],
  [/possibility of death/gi, "risk to life"],
  [/danger of death from/gi, "grave danger from"],
  [/danger of death/gi, "risk to life"],
  [/danger from death/gi, "risk to life"],
  [/fear of death/gi, "deep fear"],
  [/falls from vehicles or heights/gi, "care around vehicles and heights"],
  [/death-like (suffering|distress|danger)/gi, "grave $1"],
  [/sickness or death/gi, "illness, or a hard spell for health"],
  [/equivalent to death/gi, "of the gravest kind"],
  [/time of death/gi, "close of the span"],
  [/longevity and death/gi, "longevity"],
  [/doubts about death/gi, "doubts about the span"],
  [/one's own death/gi, "one's own end"],
  [/a parent's death/gi, "loss of a parent"],
  [/father's death/gi, "father's passing"],
  [/mother's death/gi, "mother's passing"],
  [/death among kinsmen/gi, "loss among kinsmen"],
  [/death of (?:the )?spouse/gi, "a hard time for the spouse"],
  [
    /death of (father|mother|parents|an elder|cattle and friends)/gi,
    "loss of $1",
  ],
  [/heaven after death/gi, "a good passage hereafter"],
  [/passage after death/gi, "passage hereafter"],
  [/wealth of the dead/gi, "inheritance"],
  [/through calumny or death/gi, "through calumny or loss"],
  [/\bdeath,/gi, "risk to life,"],
  // Killers
  [/a maraka \(killer\) planet/gi, "a maraka planet"],
  [/killer planet/gi, "maraka planet"],
  [/prime killer/gi, "prime maraka"],
  [/named as killers/gi, "named as marakas"],
  [/is a killer/gi, "is a maraka"],
  [/is also a killer/gi, "is also a maraka"],
  [/kills only in/gi, "acts as maraka only in"],
  [/kills first/gi, "acts as maraka first"],
  [/can also kill/gi, "can also act as maraka"],
  [/does not kill/gi, "is not a maraka"],
  [/killing power/gi, "maraka power"],
  [/killing and torture/gi, "hardship"],
  [/committing a murder inadvertently/gi, "causing grave harm inadvertently"],
  [/\bmurder\b/gi, "grave violence"],
  // Marriage rules
  [/a young widow or widower/gi, "someone young who has lost a partner"],
  [/a widow or widower/gi, "someone who has lost a partner"],
  [/previously widowed/gi, "who has lost a partner before"],
  [/was widowed before/gi, "has lost a partner before"],
  [/\bwidowed\b/gi, "who has lost a partner"],
  // The mother (Nadi Moon with Ketu, BPHS 24)
  [/\bSeparation from the mother\b/g, "Distance from the mother"],
  [/\bseparation from the mother\b/g, "distance from the mother"],
  // Disease and confinement
  [/\bleprosy\b/gi, "serious skin disease"],
  [/\bimprisonment\b/gi, "confinement"],
  [/confinement and restriction of movement/gi, "restricted movement"],
  [/periods of confinement or restricted freedom of movement/gi, "periods of restricted freedom of movement"],
  [/\bconfinement\b/gi, "restriction"],
  [/danger to life/gi, "strain on health"],
  [/\ba short life\b/gi, "care needed with health"],
  [/\ba short span\b/gi, "care with health"],
  [/\bshort-lived\b/gi, "of delicate health"],
  // Generic fallbacks
  [/\bdeath\b/gi, "risk to life"],
  [/\bdies\b/gi, "is at risk"],
  [/\bkiller\b/gi, "maraka"],
];

// Layer 1: whole statements, each rewritten in full. Grouped by the module that writes them.
const STATEMENTS: [RegExp, string][] = [
  // Card titles (BPHS 18-20).
  [/\bSpouse's life (?:under threat|at risk)/g, "Strain on the spouse's health"],
  [/\bFather's life at risk/g, "A hard time for the father"],
  [/\bMother's life at risk/g, "A hard time for the mother"],
  [/\bSpan curtailed\b/g, "Health asks for care"],
  [/\bSpan questioned\b/g, "Health to watch"],
  // BPHS 9.9-11 and 19 (the 8th house).
  [/whose 12th-house place shortens life/g, "whose 12th-house place asks for care with health"],
  [/Parashara counts this among the short-life yogas/g, "Parashara counts this among the combinations that ask for care with health"],
  [/Parashara puts the span between \d+ and \d+ years here/g, "Parashara has a harder line here on health"],
  // BPHS 46: the Shula dasa and the maraka sign.
  [
    /The Shula dasa is written for the time of death \(46\.181-182\); it is listed with its periods, and the death clause is shown as written without judgement\./g,
    "The Shula dasa (46.181-182) is listed with its periods; its verse on the span of life is given in the practitioner view, without judgement.",
  ],
  [
    /Death is possible in the dasa of the stronger maraka sign \(46\.182\)\. Shown as written; /g,
    "The text marks the dasa of the stronger maraka sign as one to watch for health (46.182); ",
  ],
  // BPHS 83: the curses keep their remedy.
  [
    /Parashara reads want of a male issue through ([^;]+?) and prescribes ([^;]+?) \((83\.[\d-]+)\); shown as written\./g,
    "Parashara links a delay with children to $1 and prescribes $2 ($3).",
  ],
  // BPHS 35: Paasa yoga, as finding-plain.ts words it.
  [
    /Parashara reads a liability to confinement, skill in work, a deceptive disposition, much talk and many servants\./g,
    "Parashara reads skill in work, much talk and many people working for you, with cautions about being tied down and about straight dealing.",
  ],
  // Kalachakra (BPHS 46, 49).
  [/the text gives danger to life, shown as written, worse when/g, "the text reads a hard spell for health, more so when"],
  [/the text speaks of an early end, shown as written/g, "the text reads a strain on health"],
  [/death-like danger, shown as written/g, "a hard spell for health"],
  [/danger to life, shown as written/g, "a hard spell for health"],
  [/sinful, shown as written/g, "one with faults to overcome"],
  // Phaladeepika on the nodes.
  [/, and a span his verse calls short, though/g, ", though"],
  [
    /Mantreswara reads a short span, impure acts, a defect in a limb, wind complaints, and little issue\./g,
    "Mantreswara reads care with health, a defect in a limb, wind complaints and few children.",
  ],
  [
    /Mantreswara reads a short span, separation from dear friends, quarrels, injury from a weapon, and disappointment in undertakings\./g,
    "Mantreswara reads care with health, distance from dear friends, quarrels, injury, and disappointment in undertakings.",
  ],
  // KP, the lagna sub lord on maraka and badhaka (Krishnamurti Part 1 ch. 16).
  [
    /the book reads a short span — [^]*?(?= The 8th cusp is weighed with it before saying so)/g,
    "the book reads this as a caution for health, not a span, whatever the lagna.",
  ],
  // Nadi marriage lines (Sakurkar).
  [
    /the husband may keep an attachment outside the marriage; risk of separation/g,
    "distance between the partners that asks for openness and care",
  ],
  [
    /an attachment outside the marriage on the native's side, or a friendship that turns cold/g,
    "restlessness within the marriage on the native's side, or a friendship that turns cold",
  ],
  // Nadi children (Rao, Naik).
  [
    /the indication of a son gives way entirely — difficulty for a male child read at its strictest/g,
    "this line leaves the question of a son open",
  ],
  [/difficulty for a male child, or a son of delicate health/g, "a son may need extra care, especially with health"],
  [/difficulty for a male child/g, "extra care for a son"],
  [/the heaviest progeny signature/g, "the strongest signature of delay for children"],
  [/\bThe heaviest progeny signature/g, "The strongest signature of delay for children"],
  // Jaimini, the Upapada (BPHS 30).
  [/strain in the marriage, separation or loss of the spouse/g, "strain in the marriage that asks for care"],
  // Prasna Marga, the houses.
  [/wounds and death due to enemies or weapons/g, "wounds and harm from enemies or weapons"],
  [/Ruin of everything, dangers/g, "Setbacks, dangers"],
  [/the cause and place of death, /g, ""],
  // Gochara (Brihat Samhita 104, Phaladeepika 26).
  [/loss of children and cattle/g, "worry over children and property"],
  [/separation from spouse and children/g, "time apart from spouse and children"],
  [/loss of wealth and children/g, "strain on wealth and on children"],
  [/\bloss of children\b/g, "worry over children"],
  [/loss of spouse, relations and wealth/g, "strain on the marriage, on relations and on wealth"],
  [/fatigue of travel, chest pain, humiliation, wasting/g, "tiring travel, care with health, a knock to standing, low energy"],
  [/\bchest pain\b/g, "care with health"],
  [/humiliation through loss/g, "a knock to standing through losses"],
  [/\bhumiliation\b/g, "a knock to standing"],
  [/disease; funeral rites/g, "illness, and a heavy time in the family"],
  [/death of an elder/g, "worry over an elder"],
  [/poison and fire, exile from kin/g, "care around poison and fire, distance from kin"],
  // Notes, caveats and signification lists shown in the plain reading.
  [/Verses on the loss of children, co-born, spouse or father/g, "Verses on hard times for children, co-born, spouse or father"],
  [/which concern death at or soon after birth/g, "which concern the first days of life"],
  [/for want of a male issue through a curse/g, "for a delay with children through a curse"],
  [/childlessness in this chapter means want of a male issue/g, "the chapter's concern is a son in particular"],
  // Planetary states (BPHS 45), the nodes (Phaladeepika), dasa effects (BPHS 47-60), Kalachakra and early trials (BPHS 9).
  [/adolescent, old and dead through/g, "adolescent, old and spent through"],
  [/, where the translation has loss of a child/g, ", where the translation is harder"],
  [/losses through others' spouses/g, "losses through entanglements"],
  [/and a span of life his verse calls short/g, "and health his verse says to guard"],
  [/and the loss of the wife and of vital power/g, "and strain on the marriage and on vitality"],
  [/loss of a spouse, sorrow in the family/g, "strain for the spouse, sorrow in the family"],
  [/loss of spouse and children/g, "strain on spouse and children"],
  [/loss of spouse and wealth/g, "strain on the marriage and on wealth"],
  [/Parashara reads an early end for/g, "Parashara reads a hard start in life for"],
  // Prasna Marga: causes of disease (23), results (21), the tertiary planets.
  [/\b[Ii]ntimacy with (?:(?:virgins|animals|widows|servants|the preceptor's wife)(?:, | or |,? or )?)+/g, "improper intimacy"],
  [/\bLoss of children\b/g, "Worry over children"],
  [/\bBecomes a thief\b/g, "Prone to dishonesty"],
  // Sarvartha Chintamani lines the plain reading still shows.
  [/trouble through a dead spirit/g, "trouble the text puts down to spirits"],
  [/trouble from the souls of the dead and water/g, "trouble the text puts down to spirits, and from water"],
  [/quarrelsome and becomes a thief/g, "quarrelsome and prone to dishonesty"],
  [/no son even with many wives/g, "a son hard to come by, even after more than one marriage"],
  [/a wife like a prostitute, hard and a thief/g, "a difficult, hard-natured spouse"],
  [/an adulterous, sinful wife of bad character/g, "a strained marriage"],
  // Nabhasa and two-planet yogas.
  [/skilled in work, adulterous, a gambler/g, "skilled in work, unsteady in relationships, a gambler"],
  [/\badultery\b/g, "questions of fidelity"],
  [/\badulterous\b/g, "restless within the marriage"],
  [/in own sign: loss of the spouse only late in life/g, "in own sign: the marriage holds until late in life"],
  [/\bfall into hell\b/g, "the hereafter"],
  // Lords in houses (BPHS 24), the Upapada (Jaimini) and Gulika at a query (Prasna Marga).
  [/a taste for what is not one's own; the end comes near the seat of power/g, "a taste for more than one's share; later life spent near people in authority"],
  [/takes what is not one's own/g, "may be tempted to take more than a fair share"],
  [/Loss of children or a single child kept with difficulty/g, "Few children, or a single child raised with extra care"],
  [/loss of the spouse through slander or bereavement/g, "strain on the marriage through gossip or grief"],
  [/\bShort life, chronic complaints/g, "Health that needs guarding, chronic complaints"],
  [/death from poison, weapon or fire/g, "a need for care around poisons, weapons and fire"],
  // The 2nd house (BPHS 13.7): the verse's word, read as money that is tight from early on.
  [/\bPenury from birth\b/g, "Money tight from early life"],
  [/\bspeaks of penury from birth\b/g, "reads money as tight from early life"],
  // Rahu holding the Sun (the Nadi children reading): the cancellation withdraws one line; it denies nothing.
  [
    /would indicate a son, but Rahu holds the Sun \(([^)]*)\): the indication of a son gives way/g,
    "would point to a son, but Rahu holds the Sun ($1), so this line leaves the question open",
  ],
  [
    /would indicate a son, but Rahu holds the Sun: the son indication gives way/g,
    "would point to a son, but Rahu holds the Sun, so this line leaves the question open",
  ],
  [/the (?:indication of a son|son indication) gives way/g, "the question of a son is left open"],
];

// Layer 2: hard verses. The modules mark a verse kept in its own hard wording; the plain reading
// keeps the sentence's place, its lead-in and its weighing, and names only the topic.
const HARD_MARK = /shown as written|\(as written\)|his words, to be weighed|Parashara's phrase is/i;
const SPEAKER = /\b(Parashara|Mantreswara|Varahamihira|Kalidasa|[Tt]he text)\b/;
const HARD_TOPICS: [RegExp, string][] = [
  [/\bhell\b|hereafter/i, "the life hereafter"],
  [/\btrades?\b/i, "work"],
  [/others' spouses|not one's own|\bthief\b|theft|\bsteals?\b|falsehood|cruel|crooked|bad deeds|deceit|sinful|reproach|licentious|courtesans?|\bwicked\b|\bjail\b|\bprison\b/i, "conduct"],
  [/\bparents\b/i, "the parents"],
  [/\bchild|children|\bsons?\b|male issue|progeny/i, "children"],
  [/father/i, "the father"],
  [/mother/i, "the mother"],
  [/co-born|brother|sister/i, "brothers and sisters"],
  [/spouse|marriages?\b|wife|husband/i, "marriage"],
  [/death|danger to life|early end|\bspan\b|\blife\b/i, "health"],
  [/poverty|penury|indigence|penniless|want of wealth|misery/i, "means"],
  [/noble family/i, "family standing"],
  [/deities/i, "worship"],
  [/ugly/i, "appearance"],
];

function hardSentence(s: string): string {
  // A sentence that only marks the one before it.
  const lead = s.match(/^Shown as written[;,.]?\s*/);
  if (lead) {
    const rest = s.slice(lead[0].length);
    return rest ? rest[0].toUpperCase() + rest.slice(1) : "";
  }
  const marks = Array.from(s.matchAll(new RegExp(HARD_MARK.source, "gi")));
  const last = marks[marks.length - 1];
  let end = last.index! + last[0].length;
  let weigh = "";
  if (/^\(as written\)$/i.test(last[0])) {
    // Inside a list: the hard clause runs to the end of the sentence or clause.
    const stop = s.slice(end).search(/;|\.(?!\d)/);
    end = stop < 0 ? s.length : end + stop;
  } else {
    const tail = s.slice(end);
    const w = /^his words/i.test(last[0])
      ? tail.match(/^ ((?:against|with) (?:[^.;]|\.(?=\d))+)/)
      : tail.match(/^(?:,| and) to be weighed ((?:against|with) (?:[^.;]|\.(?=\d))+)/);
    if (w) {
      weigh = w[1].trim();
      end += w[0].length;
    } else {
      // A comma after the mark carries the hard clause on ("..., worse when ..."), and a colon introduces it
      // ("a list of faults, shown as written: ..."): either way it goes with the mark.
      const cont = tail.match(/^[,:](?:[^.;]|\.(?=\d))*/);
      if (cont) end += cont[0].length;
    }
  }
  const sp = s.match(SPEAKER);
  const start = sp && sp.index! <= last.index! ? sp.index! : 0;
  const prefix = s.slice(0, start);
  const clause = s.slice(start, end);
  const rest = s.slice(end);
  const named = sp && start === sp.index && !/^[Tt]he text$/.test(sp[1]);
  const who = named ? sp![1] : prefix && !/[.!?]\s*$/.test(prefix) ? "the text" : "The text";
  const topic = HARD_TOPICS.find(([re]) => re.test(clause))?.[1];
  const line = `${who} has a harder line here${topic ? ` on ${topic}` : ""}, given in full in the practitioner view${weigh ? `; weigh it ${weigh}` : ""}`;
  return `${prefix}${line}${rest}`;
}

// Layer 0: a clause marked ", as written" (the Sayanadi effects, 45.40-146). The plain reading keeps the clause's
// condition and its milder items and names only the topic of the hard ones.
const AS_WRITTEN_AFTER = /(^|[:;]\s*|\.\s+)([^:;.]*?), as written(?=[;.]|$)/g;
const AS_WRITTEN_BEFORE = /\band, as written, ([^;.]+)/g;

function markedClause(clause: string): string {
  const cond = clause.match(/^(elsewhere|otherwise)\s+/i);
  const body = cond ? clause.slice(cond[0].length) : clause;
  const items = body.split(/,\s*/);
  const hard = items.map((x) => HARD_TOPICS.find(([re]) => re.test(x))?.[1]);
  const keep = items.filter((_, i) => !hard[i]);
  const topic = hard.find(Boolean);
  const line = `a harder line${topic ? ` on ${topic}` : ""}, given in full in the practitioner view`;
  const out = !topic || !keep.length ? line : `${keep.join(", ")}, and ${line}`;
  return cond ? `${cond[1]}: ${out}` : out;
}

/** The text split into sentences, so a hard verse is rewritten without touching its neighbours. */
const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z(])/);

/** Rewrite sensitive statements and phrases into the register of risk and strain; the technical names stay. */
export function soften(text: string): string {
  let out = text
    .replace(AS_WRITTEN_AFTER, (_m, pre: string, clause: string) => `${pre}${markedClause(clause)}`)
    .replace(AS_WRITTEN_BEFORE, (_m, clause: string) => `and ${markedClause(clause)}`);
  for (const [re, rep] of STATEMENTS) out = out.replace(re, rep);
  if (HARD_MARK.test(out))
    out = sentences(out)
      .map((x) => (HARD_MARK.test(x) ? hardSentence(x) : x))
      .filter(Boolean)
      .join(" ");
  for (const [re, rep] of PHRASES) out = out.replace(re, rep);
  // Restore a leading capital lost to a replacement.
  if (/^[a-z]/.test(out) && /^[A-Z]/.test(text))
    out = out[0].toUpperCase() + out.slice(1);
  return out;
}

/**
 * What the plain reading must never print, whatever the chart: the hard verses' own words on death, the span of
 * life, the hereafter, abandonment, infidelity, the loss of spouse or children, confinement and crime.
 * scripts/gentle-plain.test.ts holds the plain reports to this list; the practitioner reading is exempt.
 */
export const PLAIN_DENY: RegExp[] = [
  /\bhell\b/i,
  /\bdeath\b/i,
  /\bdie[sd]?\b/i,
  /\bdead\b/i,
  /\bkill(?:s|ed|er|ing)?\b/i,
  /\bmurder/i,
  /shortens? (?:the )?life/i,
  /\bshort[- ](?:life|lived|span)\b/i,
  /\bspan\b[^.;]{0,30}\bshort\b/i,
  /\bcut short\b/i,
  /\bearly end\b/i,
  /\bspan between \d+/i,
  /to its fate/i,
  /\babandon/i,
  /attachment outside the marriage/i,
  /others' spouses/i,
  /not one's own/i,
  /\badulter/i,
  /\billicit\b/i,
  /\bloss of (?:the |a |his |her )?(?:spouse|husband|wife|child|children|son|sons)\b/i,
  /\blosing the spouse\b/i,
  /destruction of the spouse/i,
  /difficulty for a male child/i,
  /son of delicate health/i,
  /\bno son\b/i,
  /want of (?:a son|a male issue|male issue)/i,
  /heaviest progeny/i,
  /\bimprison/i,
  /\bjail\b/i,
  /\bprison\b/i,
  /\bthief\b/i,
  /deceptive disposition/i,
  /\bconfinement\b/i,
  /shown as written/i,
  /\(as written\)/i,
  /\bwidow/i,
  /\bleprosy\b/i,
  /grave risk/i,
  /danger to life/i,
  /life (?:under threat|at risk)/i,
  /\bspan curtailed\b/i,
  /penury from birth/i,
  /\bcurse of (?:a|the)\b/i,
  /indication of a son gives way|son indication gives way/i,
  /separation from the mother/i,
  /chest pain/i,
  /\bhumiliation\b/i,
  /\bfuneral\b/i,
];

/** The deny-list phrases a text contains, each with a little context. */
export function plainViolations(text: string): string[] {
  const hits: string[] = [];
  for (const re of PLAIN_DENY) {
    const m = text.match(re);
    if (m) {
      const i = m.index ?? 0;
      hits.push(`${re.source} :: …${text.slice(Math.max(0, i - 60), i + m[0].length + 40)}…`);
    }
  }
  return hits;
}

/**
 * A combination's working without the text's reading: the sentences that say what the configuration is, not what
 * the verse makes of it. The plain reading pairs it with the finding's plain meaning (finding-plain.ts), which says
 * that in today's words.
 */
export function formationOnly(text: string): string {
  const kept = sentences(text).filter(
    (x) => !/^(?:Parashara|Mantreswara|Varahamihira|The text)\b(?:'s)?\s+(?:reads|promises|says|speaks|counts|gives|names|words|word|phrase|list|calls|holds)\b/.test(x),
  );
  return kept.length ? kept.join(" ") : text;
}

/** True when the text contains a phrase the gentle reading would rewrite. */
export function isSensitive(text: string): boolean {
  return PHRASES.some(([re]) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

export const GENTLE_NOTE =
  "Classical rules on length of life and loss follow. The app shows them as checks of the text against the chart, never as a forecast of an event or its date; the plain reading rewords them, the practitioner reading keeps the verse wording.";
