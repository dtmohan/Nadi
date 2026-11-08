import { NAKSHATRAS, PLANETS, SIGNS } from "./astro";
import { ALP_HOUSE_GLOSS, listJoin, ordH } from "./house-gloss";
import { translate } from "./localization";

// The English phrases are snapshots: an edited house gloss must be reviewed before reuse.
const house = [
  ["self and how life is handled", "സ്വയവും ജീവിതത്തെ കൈകാര്യം ചെയ്യുന്ന രീതിയും"],
  ["income, education, family and speech", "വരുമാനം, വിദ്യാഭ്യാസം, കുടുംബം, സംസാരം"],
  ["efforts, communication and the younger sibling", "പരിശ്രമം, ആശയവിനിമയം, ഇളയ സഹോദരം"],
  ["house, vehicles and the mother", "വീട്, വാഹനങ്ങൾ, അമ്മ"],
  ["mind, love and children", "മനസ്സ്, പ്രണയം, സന്താനം"],
  ["short-term debts, enemies and disputes", "ഹ്രസ്വകാല കടങ്ങൾ, ശത്രുക്കൾ, തർക്കങ്ങൾ"],
  ["marriage, spouse and partnership", "വിവാഹം, ജീവിതപങ്കാളി, പങ്കാളിത്തം"],
  ["long-term debts, disputes and sudden luck", "ദീർഘകാല കടങ്ങൾ, തർക്കങ്ങൾ, പെട്ടെന്നുള്ള ഭാഗ്യം"],
  ["blessings, the father and spiritual travel", "അനുഗ്രഹങ്ങൾ, അച്ഛൻ, ആത്മീയ യാത്ര"],
  ["job, business and profession", "ജോലി, വ്യാപാരം, തൊഴിൽ"],
  ["gains, promotion and the elder sibling", "നേട്ടങ്ങൾ, സ്ഥാനക്കയറ്റം, മൂത്ത സഹോദരം"],
  ["travel, foreign lands, expenses and investments", "യാത്ര, വിദേശസ്ഥലങ്ങൾ, ചെലവുകൾ, നിക്ഷേപങ്ങൾ"],
] as const;

/** Return a house gloss only while the source description still matches its snapshot. */
export function alpHouseGlossMalayalam(n: number): string | undefined {
  const entry = house[n - 1];
  return entry && ALP_HOUSE_GLOSS[n] === entry[0] ? entry[1] : undefined;
}

const number = (s: string) => {
  const n = Number.parseInt(s, 10);
  return n >= 1 && n <= 12 && ordH(n) === s ? n : undefined;
};
const known = (s: string, values: readonly string[]) => values.includes(s) ? translate("ml", s) : undefined;
const planet = (s: string) => {
  const p = s.replace(/^the (?=Sun$|Moon$)/, "");
  return known(p, PLANETS);
};
const sign = (s: string) => known(s, SIGNS);
const star = (s: string) => known(s, NAKSHATRAS);
const position = (s: string, long: boolean) => {
  for (let i = 0; i < house.length; i++) {
    const n = i + 1;
    const expected = `the ${ordH(n)}${long ? " from the ALP lagna" : ""} (${house[i][0]})`;
    if (s === expected) return `${n}-ാം ഭാവത്തിൽ (${house[i][1]})`;
  }
  return undefined;
};
const role: Record<string, string> = {
  "lord of the ALP lagna": "ALP ലഗ്നാധിപൻ",
  "lord of the janma lagna": "ജന്മലഗ്നാധിപൻ",
  "lord of the ALP nakshatra": "ALP നക്ഷത്രാധിപൻ",
  "lord of the activated navamsa sign": "സജീവ നവാംശരാശിയുടെ അധിപൻ",
  "lord of the Akshaya rasi": "അക്ഷയരാശ്യാധിപൻ",
  "lord of the Akshaya nakshatra": "അക്ഷയ നക്ഷത്രാധിപൻ",
};
const group: Record<string, string> = { present: "വർത്തമാനം", past: "ഭൂതം", future: "ഭാവി" };

/** Closed patterns only: unknown facts and appended conditions remain untranslated. */
export function alpEvidenceClauseMalayalam(s: string): string | undefined {
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^the ALP lagna, (.+), is the (\d+(?:st|nd|rd|th)) from the janma lagna$/))) {
    const x = sign(m[1]), n = number(m[2]); if (x && n) return `ALP ലഗ്നം ${x} രാശിയിലാണ്; ജന്മലഗ്നത്തിൽനിന്ന് ${n}-ാം ഭാവം`;
  }
  if ((m = s.match(/^the ALP lagna, (.+), is the (\d+(?:st|nd|rd|th)) from (.+)$/))) {
    const x = sign(m[1]), n = number(m[2]), p = planet(m[3]); if (x && n && p) return `ALP ലഗ്നം ${x} രാശിയിലാണ്; ${p} നിൽക്കുന്ന രാശിയിൽനിന്ന് ${n}-ാം ഭാവം`;
  }
  if ((m = s.match(/^the activated navamsa sign, (.+), is (.+) and the (\d+(?:st|nd|rd|th)) from the janma lagna$/))) {
    const x = sign(m[1]), h = position(m[2], true), n = number(m[3]); if (x && h && n) return `സജീവ നവാംശരാശി ${x}: ALP ലഗ്നത്തിൽനിന്ന് ${h}; ജന്മലഗ്നത്തിൽനിന്ന് ${n}-ാം ഭാവം`;
  }
  if ((m = s.match(/^the activated navamsa sign, (.+), is (.+)$/))) {
    const x = sign(m[1]), h = position(m[2], true); if (x && h) return `സജീവ നവാംശരാശി ${x}: ALP ലഗ്നത്തിൽനിന്ന് ${h}`;
    const j = m[2].match(/^the (\d+(?:st|nd|rd|th)) from the janma lagna$/), n = j && number(j[1]);
    if (x && n) return `സജീവ നവാംശരാശി ${x}: ജന്മലഗ്നത്തിൽനിന്ന് ${n}-ാം ഭാവം`;
  }
  if ((m = s.match(/^the ALP nakshatra, (.+), is ruled by (.+?)(?:, which stands in (.+))?$/))) {
    const x = star(m[1]), p = planet(m[2]), h = m[3] && position(m[3], true);
    if (x && p && (!m[3] || h)) return `ALP നക്ഷത്രം ${x}; അതിന്റെ അധിപൻ ${p}${h ? `, ALP ലഗ്നത്തിൽനിന്ന് ${h} നിൽക്കുന്നു` : ""}`;
  }
  if ((m = s.match(/^the Akshaya rasi, (.+), is (.+)$/))) {
    const x = sign(m[1]), h = position(m[2], true); if (x && h) return `അക്ഷയരാശി ${x}: ALP ലഗ്നത്തിൽനിന്ന് ${h}`;
  }
  if ((m = s.match(/^(.+), lord of the (\d+(?:st|nd|rd|th)) from the ALP lagna, stands in (.+)$/))) {
    const p = planet(m[1]), n = number(m[2]), h = position(m[3], false); if (p && n && h) return `ALP ലഗ്നത്തിൽനിന്നുള്ള ${n}-ാം ഭാവാധിപൻ ${p}, ${h} നിൽക്കുന്നു`;
  }
  if ((m = s.match(/^(.+), (lord of the .+?), stands in (.+)$/))) {
    const p = planet(m[1]), r = role[m[2]], h = position(m[3], true);
    if (p && r && h) return `${r} ${p}, ALP ലഗ്നത്തിൽനിന്ന് ${h} നിൽക്കുന്നു`;
    const j = m[3].match(/^the (\d+(?:st|nd|rd|th)) from the janma lagna$/), n = j && number(j[1]);
    if (p && r && n) return `${r} ${p}, ജന്മലഗ്നത്തിൽനിന്ന് ${n}-ാം ഭാവത്തിൽ നിൽക്കുന്നു`;
    const a = m[3].match(/^the (\d+(?:st|nd|rd|th)) from it$/), an = a && number(a[1]);
    if (p && r && an && m[2] === "lord of the Akshaya rasi") return `${r} ${p}, അക്ഷയരാശിയിൽനിന്ന് ${an}-ാം ഭാവത്തിൽ നിൽക്കുന്നു`;
  }
  if ((m = s.match(/^(.+), (lord of the .+?), shares a sign with (.+)$/))) {
    const p = planet(m[1]), r = role[m[2]], originals = m[3].split(/, | and /), mates = originals.map(planet);
    if (p && r && listJoin(originals) === m[3] && mates.every(Boolean)) return `${r} ${p}, ${mates.join(", ")} എന്നിവരുമായി ഒരേ രാശിയിൽ നിൽക്കുന്നു`;
  }
  if ((m = s.match(/^(.+), (lord of the .+?), rules the (.+) from the ALP lagna$/))) {
    const p = planet(m[1]), r = role[m[2]];
    if (p && r) for (let i = 0; i < house.length; i++) for (let j = i; j < house.length; j++) {
      const items = i === j ? [i] : [i, j];
      const original = listJoin(items.map((k) => `${ordH(k + 1)} (${house[k][0]})`));
      if (m[3] === original) return `${r} ${p}, ALP ലഗ്നത്തിൽനിന്നുള്ള ${items.map((k) => `${k + 1}-ാം ഭാവം (${house[k][1]})`).join(", ")} ഭരിക്കുന്നു`;
    }
  }
  if ((m = s.match(/^(.+), (lord of the .+?), is the (\d+(?:st|nd|rd|th)) from the activated navamsa sign$/))) {
    const p = planet(m[1]), r = role[m[2]], n = number(m[3]); if (p && r && n) return `${r} ${p}, സജീവ നവാംശരാശിയിൽനിന്ന് ${n}-ാം ഭാവത്തിലാണ്`;
  }
  if ((m = s.match(/^(.+), (lord of the .+?), is the (\d+(?:st|nd|rd|th)) from (.+), (lord of the .+)$/))) {
    const p = planet(m[1]), r = role[m[2]], n = number(m[3]), q = planet(m[4]), t = role[m[5]];
    if (p && r && n && q && t) return `${r} ${p}, ${t} ${q} നിൽക്കുന്ന രാശിയിൽനിന്ന് ${n}-ാം ഭാവത്തിലാണ്`;
  }
  if ((m = s.match(/^the bhukti lord, (.+), is the (\d+(?:st|nd|rd|th)) from the dasa lord, (.+)$/))) {
    const p = planet(m[1]), n = number(m[2]), q = planet(m[3]); if (p && n && q) return `ഭുക്തിനാഥൻ ${p}, ദശാനാഥൻ ${q} നിൽക്കുന്ന രാശിയിൽനിന്ന് ${n}-ാം ഭാവത്തിലാണ്`;
  }
  if ((m = s.match(/^the (dasa|bhukti) lord, (.+), stands in (.+)$/))) {
    const p = planet(m[2]), r = m[1] === "dasa" ? "ദശാനാഥൻ" : "ഭുക്തിനാഥൻ", h = position(m[3], true);
    if (p && h) return `${r} ${p}, ALP ലഗ്നത്തിൽനിന്ന് ${h} നിൽക്കുന്നു`;
    const a = m[3].match(/^the (\d+(?:st|nd|rd|th)) from the Akshaya rasi$/), n = a && number(a[1]);
    if (p && n && m[1] === "dasa") return `${r} ${p}, അക്ഷയരാശിയിൽനിന്ന് ${n}-ാം ഭാവത്തിൽ നിൽക്കുന്നു`;
  }
  if ((m = s.match(/^(.+), lord of the (\d+(?:st|nd|rd|th)), and (.+), lord of the (\d+(?:st|nd|rd|th)), share a sign, in (.+)$/))) {
    const p = planet(m[1]), n = number(m[2]), q = planet(m[3]), j = number(m[4]), h = position(m[5], true);
    if (p && n && q && j && h) return `${n}-ാം ഭാവാധിപൻ ${p}, ${j}-ാം ഭാവാധിപൻ ${q} എന്നിവർ ഒരേ രാശിയിൽ, ALP ലഗ്നത്തിൽനിന്ന് ${h} നിൽക്കുന്നു`;
  }
  if ((m = s.match(/^(.+) and (.+), lords of the ALP lagna and the Akshaya rasi, share (.+), the (\d+(?:st|nd|rd|th)) from the janma lagna$/))) {
    const p = planet(m[1]), q = planet(m[2]), x = sign(m[3]), n = number(m[4]);
    if (p && q && x && n) return `ALP ലഗ്നാധിപൻ ${p}, അക്ഷയരാശ്യാധിപൻ ${q} എന്നിവർ ${x} രാശിയിൽ ഒരുമിച്ചാണ്; അത് ജന്മലഗ്നത്തിൽനിന്ന് ${n}-ാം ഭാവമാണ്`;
  }
  if ((m = s.match(/^(.+) stands in (.+)$/))) {
    const p = planet(m[1]), h = position(m[2], true); if (p && h) return `${p}, ALP ലഗ്നത്തിൽനിന്ന് ${h} നിൽക്കുന്നു`;
  }
  if ((m = s.match(/^(lagna lord|lagna nakshatra lord), (.+), in the (\d+(?:st|nd|rd|th)) from the lagna \((present|past|future)\)$/))) {
    const p = planet(m[2]), n = number(m[3]); if (p && n) return `${m[1] === "lagna lord" ? "ലഗ്നാധിപൻ" : "ലഗ്നനക്ഷത്രാധിപൻ"} ${p}, ലഗ്നത്തിൽനിന്ന് ${n}-ാം ഭാവത്തിൽ (${group[m[4]]})`;
  }
  if ((m = s.match(/^lagna nakshatra point, (.+) ([1-4]), in (.+): the (\d+(?:st|nd|rd|th)) sign of the kalapurusha \((present|past|future)\)$/))) {
    const a = star(m[1]), x = sign(m[3]), n = number(m[4]); if (a && x && n) return `ലഗ്ന നക്ഷത്രബിന്ദു ${a} ${m[2]}, ${x} രാശിയിൽ: കാലപുരുഷന്റെ ${n}-ാം രാശി (${group[m[5]]})`;
  }
  return undefined;
}
