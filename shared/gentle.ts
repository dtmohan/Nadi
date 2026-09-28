// Gentle wording for sensitive results. The classical texts speak plainly of death, loss and
// disease; the plain reading of the app does not. `soften` rewrites the fixed phrases the rule
// modules use into the register of risk, loss and strain, leaving the technical names (maraka,
// Balarishta, Baladi's mrita) intact. Practitioner mode shows the text as written. The map is
// deliberately explicit, phrase by phrase, so that no rule's meaning is changed by a blind
// substitution; a short generic fallback covers stray words.
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
  [/(family|sight|losses|spouse), death(?=[,;)]|$)/gi, "$1, the span of life"],
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
  [/death-like (suffering|distress|danger)/gi, "grave $1"],
  [/sickness or death/gi, "sickness or grave risk"],
  [/equivalent to death/gi, "of the gravest kind"],
  [/time of death/gi, "close of the span"],
  [/longevity and death/gi, "longevity"],
  [/doubts about death/gi, "doubts about the span"],
  [/one's own death/gi, "one's own end"],
  [/a parent's death/gi, "loss of a parent"],
  [/father's death/gi, "father's passing"],
  [/mother's death/gi, "mother's passing"],
  [/death among kinsmen/gi, "loss among kinsmen"],
  [
    /death of (father|mother|spouse|parents|an elder|cattle and friends)/gi,
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
  // Disease and confinement
  [/\bleprosy\b/gi, "serious skin disease"],
  [/\bimprisonment\b/gi, "confinement"],
  // Generic fallbacks
  [/\bdeath\b/gi, "risk to life"],
  [/\bdies\b/gi, "is at risk"],
  [/\bkiller\b/gi, "maraka"],
];

/** Rewrite sensitive phrases into the register of risk and loss; the technical names stay. */
export function soften(text: string): string {
  let out = text;
  for (const [re, rep] of PHRASES) out = out.replace(re, rep);
  // Restore a leading capital lost to a replacement.
  if (/^[a-z]/.test(out) && /^[A-Z]/.test(text))
    out = out[0].toUpperCase() + out.slice(1);
  return out;
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
