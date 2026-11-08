/**
 * A first-pass audit of rule text against the condition the engine actually evaluates.
 *
 * It does not decide whether a rule is right. It flags the places where the text says more,
 * less, or something different from `when`, so a human can review the source.
 */
import { RULES } from "../shared/rules";
import type { Rule } from "../shared/rules";

interface Flag {
  id: string;
  area: string;
  frame?: string;
  kind: "lost-exception" | "silent-extension" | "provenance" | "conditional-text";
  text: string;
  when: string;
  source?: string;
  why: string;
}

const flags: Flag[] = [];
const lower = (s: string) => s.toLowerCase();
const whenText = (r: Rule) => lower(JSON.stringify(r.when));

for (const r of RULES) {
  const text = lower(r.text);
  const when = whenText(r);
  const source = lower(r.source ?? "");

  if (/unless|except/.test(text) && !/jupiter|subjectdignity|subjectcombust|subjectretro|alone/.test(when)) {
    flags.push({ id: r.id, area: r.area, frame: r.frame, kind: "lost-exception", text: r.text, when: JSON.stringify(r.when), source: r.source, why: "The text states an exception that is not in when." });
  }
  if (/jupiter/.test(text) && /(aspect|minimis|unless|joins)/.test(text) && !/jupiter/.test(when)) {
    flags.push({ id: r.id, area: r.area, frame: r.frame, kind: "lost-exception", text: r.text, when: JSON.stringify(r.when), source: r.source, why: "The text gives Jupiter a qualifying role; Jupiter is not in when." });
  }
  if (/if the moon is weak|moon is weak|weak moon/.test(text) && !/dignity|strength|subjectdignity/.test(when)) {
    flags.push({ id: r.id, area: r.area, frame: r.frame, kind: "conditional-text", text: r.text, when: JSON.stringify(r.when), source: r.source, why: "The text makes the result conditional on the Moon's strength; no strength condition is encoded." });
  }
  if (/not necessarily in the same sign/.test(text) && /"prev"|"next"/.test(when)) {
    flags.push({ id: r.id, area: r.area, frame: r.frame, kind: "silent-extension", text: r.text, when: JSON.stringify(r.when), source: r.source, why: "The text says 'linked by sign'; the encoding includes the 2nd/12th adjacent-sign extension." });
  }
  if ((/"prev"/.test(when) || /"next"/.test(when)) && /adjacent-sign extension provisional/.test(source)) {
    flags.push({ id: r.id, area: r.area, frame: r.frame, kind: "provenance", text: r.text, when: JSON.stringify(r.when), source: r.source, why: "The source field marks the adjacent-sign extension provisional; the sentence does not." });
  }
}

const byKind = flags.reduce<Record<string, number>>((m, f) => ((m[f.kind] = (m[f.kind] ?? 0) + 1), m), {});
console.log(JSON.stringify({ totalRules: RULES.length, flags: flags.length, byKind, rows: flags }, null, 2));
