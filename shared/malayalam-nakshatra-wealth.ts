import { PLANETS, NAKSHATRAS } from "./astro";
import type { NakshatraWealthHit, NakshatraWealthReading } from "./nakshatra-wealth";
import { translate } from "./localization";

/** Complete source-phrase mappings: in particular, keep AND distinct from OR. */
const CONDITIONS: Record<string, string> = {
  "": "",
  " in wealth-giving houses": " ധനദായക ഭാവങ്ങളിൽ",
  " in wealth-giving houses, with the Moon in trine to Venus": " ധനദായക ഭാവങ്ങളിൽ; ചന്ദ്രൻ ശുക്രനിൽനിന്ന് ത്രികോണത്തിൽ",
  " in Kendra or Trikon houses": " കേന്ദ്രത്തിലോ ത്രികോണത്തിലോ ഉള്ള ഭാവങ്ങളിൽ",
  " in Kendra houses": " കേന്ദ്രഭാവങ്ങളിൽ",
  " in wealth-giving or Kendra houses": " ധനദായകമോ കേന്ദ്രമോ ആയ ഭാവങ്ങളിൽ",
  " in wealth or Kendra houses": " ധനദായകമോ കേന്ദ്രമോ ആയ ഭാവങ്ങളിൽ",
  " in Kendra or wealth-giving houses": " കേന്ദ്രമോ ധനദായകമോ ആയ ഭാവങ്ങളിൽ",
  " in Trikon and wealth-giving houses": " ത്രികോണവും ധനദായകവുമായ ഭാവങ്ങളിൽ",
  " in Trikon or wealth-giving houses": " ത്രികോണമോ ധനദായകമോ ആയ ഭാവങ്ങളിൽ",
  " in the 2nd or 11th house": " രണ്ടാമത്തെയോ പതിനൊന്നാമത്തെയോ ഭാവത്തിൽ",
  " in the 10th or wealth-giving houses": " പത്താം ഭാവത്തിലോ ധനദായക ഭാവങ്ങളിലോ",
  " in the 9th house": " ഒമ്പതാം ഭാവത്തിൽ",
  " in the 2nd house of wealth": " ധനത്തിന്റെ രണ്ടാം ഭാവത്തിൽ",
  ", with the Moon in trine to Venus": "; ചന്ദ്രൻ ശുക്രനിൽനിന്ന് ത്രികോണത്തിൽ",
  ", in trine with Mars": "; ചൊവ്വയുമായി ത്രികോണത്തിൽ",
  " (the book lists Saturn twice; the second entry is carried once)": " (ഗ്രന്ഥത്തിൽ ശനിയെ രണ്ടുതവണ പട്ടികപ്പെടുത്തിയിട്ടുണ്ട്; രണ്ടാമത്തെ രേഖ ഇവിടെ ഒരിക്കൽ ഉൾപ്പെടുത്തിയിരിക്കുന്നു)",
};

/** Translate only a complete recognized book sentence, with its planet, star and all conditions. */
export function nakshatraWealthHitMalayalam(h: NakshatraWealthHit, source: string): string | undefined {
  if (source !== h.text) return undefined;
  const match = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|Lagna)(?: and (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu))?( conjunct)? in ([A-Za-z ]+?)( in (?:wealth-giving houses, with the Moon in trine to Venus|wealth-giving houses|Kendra or Trikon houses|Kendra houses|wealth-giving or Kendra houses|wealth or Kendra houses|Kendra or wealth-giving houses|Trikon and wealth-giving houses|Trikon or wealth-giving houses|the 2nd or 11th house|the 10th or wealth-giving houses|the 9th house|the 2nd house of wealth)|, with the Moon in trine to Venus|, in trine with Mars| \(the book lists Saturn twice; the second entry is carried once\))?\.$/.exec(source);
  if (!match) return undefined;
  const [, first, second, conjunct, star, condition = ""] = match;
  if (star !== h.nakshatra || !(NAKSHATRAS as readonly string[]).includes(star)) return undefined;
  if (first === "Lagna" ? h.planet !== null : h.planet !== first || !(PLANETS as readonly string[]).includes(first)) return undefined;
  if ((second ?? undefined) !== h.conjunctWith || conjunct && !second) return undefined;
  const firstMl = first === "Lagna" ? "ലഗ്നം" : translate("ml", first);
  const secondMl = second ? translate("ml", second) : undefined;
  const starMl = translate("ml", star);
  if (first !== "Lagna" && firstMl === first || second && secondMl === second || starMl === star || CONDITIONS[condition] === undefined) return undefined;
  const subjects = secondMl ? `${firstMl}, ${secondMl}` : firstMl;
  return `${subjects} ${starMl} നക്ഷത്രത്തിൽ${CONDITIONS[condition]}${conjunct ? " കൂടിച്ചേർന്നു നിൽക്കുന്നു" : " നിൽക്കുന്നു"}.`;
}

const join = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export function nakshatraWealthHeadlineMalayalam(reading: NakshatraWealthReading, source: string): string | undefined {
  const stars = Array.from(new Set(reading.hits.map((h) => h.nakshatra)));
  const expected = reading.hits.length === 0 ? "No nakshatra wealth rule of the book's twenty stars fires in this chart."
    : `${reading.hits.length} rule${reading.hits.length === 1 ? "" : "s"} fire${reading.hits.length === 1 ? "s" : ""} across ${stars.length} of the book's twenty wealth nakshatras${stars.length ? ` (${join(stars)})` : ""}.`;
  if (source !== expected || stars.some((s) => !(NAKSHATRAS as readonly string[]).includes(s) || translate("ml", s) === s)) return undefined;
  return !reading.hits.length ? "ഈ ജാതകത്തിൽ ഗ്രന്ഥത്തിലെ ഇരുപത് ധനനക്ഷത്ര നിയമങ്ങളിലൊന്നും ബാധകമാകുന്നില്ല."
    : `ഗ്രന്ഥത്തിലെ ഇരുപത് ധനനക്ഷത്രങ്ങളിൽ ${stars.length} എണ്ണവുമായി ബന്ധപ്പെട്ട ${reading.hits.length} നിയമങ്ങൾ ബാധകമാണ്${stars.length ? ` (${stars.map((s) => translate("ml", s)).join(", ")})` : ""}.`;
}

const NOTES = "Wealth-giving houses are 2, 5, 9, 11 (the book, p. 24); Kendra 1/4/7/10, Trikon 1/5/9. Houses are whole-sign from the lagna. Source: S. Prakash, DNA Astrology of Wealth (2022), the twenty wealth nakshatras, pp. 96-169 — a modern research work, read alongside the Lakshmi and Rao/Naik layers, never in their place.";
export function nakshatraWealthNotesMalayalam(source: string): string | undefined {
  return source === NOTES ? "ധനദായക ഭാവങ്ങൾ 2, 5, 9, 11 ആണ് (ഗ്രന്ഥം, പേജ് 24); കേന്ദ്രങ്ങൾ 1/4/7/10, ത്രികോണങ്ങൾ 1/5/9. ലഗ്നത്തിൽനിന്നുള്ള പൂർണരാശി ഭാവങ്ങളാണ് ഉപയോഗിക്കുന്നത്. ഉറവിടം: എസ്. പ്രകാശ്, DNA Astrology of Wealth (2022), ഇരുപത് ധനനക്ഷത്രങ്ങൾ, പേജുകൾ 96–169. ഇത് ആധുനിക ഗവേഷണഗ്രന്ഥമാണ്; ലക്ഷ്മി, റാവു/നായിക് തലങ്ങൾക്കൊപ്പം വായിക്കേണ്ടതാണ്, അവയ്ക്കു പകരമായി ഒരിക്കലും അല്ല." : undefined;
}

/** Keep page numbers in their original form while translating the named star. */
export function nakshatraWealthAsideMalayalam(h: NakshatraWealthHit, source: string): string | undefined {
  const expected = `${h.nakshatra} · ${h.pages.replace("DNA Astrology of Wealth, ", "")}`;
  const star = translate("ml", h.nakshatra);
  return source === expected && star !== h.nakshatra ? `${star} · ${h.pages.replace("DNA Astrology of Wealth, ", "")}` : undefined;
}
