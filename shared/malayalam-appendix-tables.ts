import { NAKSHATRAS, PLANETS, PLANET_ABBR, SIGN_ABBR, SIGNS } from "./astro";
import { EVENT_MATTERS } from "./events";
import { ANTAR_CONDITION_ML } from "./malayalam-antar-conditions";
import { translate } from "./localization";

const has = (list: readonly string[], x: string) => list.includes(x);
const known = (list: readonly string[], value: string): string | undefined => {
  if (!has(list, value)) return undefined;
  const ml = translate("ml", value);
  return ml === value ? undefined : ml;
};
const planet = (s: string) => known(PLANETS, s);
const sign = (s: string) => known(SIGNS, s);
const star = (s: string) => known(NAKSHATRAS, s);
const point = (s: string) => s === "Ascendant" ? "ലഗ്നം" : planet(s);
const ordinal = (s: string) => {
  const m = /^(1st|2nd|3rd|[4-9]th|1[0-2]th)$/.exec(s);
  return m ? `${parseInt(m[1], 10)}-ാം` : undefined;
};
const exactHead = (head: string[] | undefined, expected: string[]) => JSON.stringify(head) === JSON.stringify(expected);

function location(value: string): string | undefined {
  const unavailable = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu): position unavailable$/.exec(value);
  if (unavailable) return `${planet(unavailable[1])}: സ്ഥാനം ലഭ്യമല്ല`;
  const m = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu): D1 ([A-Za-z]+)(, H(?:[1-9]|1[0-2]))? \((1st|2nd|3rd|[4-9]th|1[0-2]th) sign from point\); D9 ([A-Za-z]+)(, H(?:[1-9]|1[0-2]))?$/.exec(value);
  if (!m || !planet(m[1]) || !sign(m[2]) || !sign(m[5])) return undefined;
  const house = (v?: string) => v ? `, ${Number(v.slice(3))}-ാം ഭാവം` : "";
  return `${planet(m[1])}: D1 ${sign(m[2])}${house(m[3])} (ബിന്ദുവിൽനിന്ന് ${ordinal(m[4])} രാശി); D9 ${sign(m[5])}${house(m[6])}`;
}

function starQuarter(value: string): string | undefined {
  const m = /^(.+) ([1-4])$/.exec(value);
  const translated = m && star(m[1]);
  return m && translated ? `${translated} ${m[2]}-ാം പാദം` : undefined;
}

function qualifications(value: string): string | undefined {
  if (value === "—") return value;
  const labels: Record<string, string> = {
    vargottama: "വർഗോത്തമം", "Sutton pushkara": "സട്ടൺ പുഷ്കരം", "Sutton ashtamamsha": "സട്ടൺ അഷ്ടമാംശം", "Sutton gandanta": "സട്ടൺ ഗണ്ഡാന്തം",
    "D9 exaltation": "D9 ഉച്ചം", "D9 own": "D9 സ്വക്ഷേത്രം", "D9 debilitation": "D9 നീചം",
  };
  const parts = value.split(", ");
  if (parts.some((p) => !labels[p])) return undefined;
  return parts.map((p) => labels[p]).join(", ");
}

function quarters(value: string): string | undefined {
  const groups = value.split("; ");
  const out: string[] = [];
  for (const group of groups) {
    const prefix = /^(\w+) · (.+?) ([1-4].*)$/.exec(group);
    if (!prefix || !sign(prefix[1]) || !star(prefix[2])) return undefined;
    const parts = prefix[3].split(", ");
    if (parts.some((p) => !/^[1-4](?:–[1-4]| \(partial\))?$/.test(p))) return undefined;
    out.push(`${sign(prefix[1])} · ${star(prefix[2])} ${parts.map((p) => p.replace(" (partial)", " (ഭാഗികം)")).join(", ")}`);
  }
  return out.join("; ");
}

const RUNNING: Record<string, string> = { "": "", " (running)": " (നടക്കുന്നു)", " (at passing)": " (വിയോഗസമയത്ത്)" };
const ASHTAKA_HEAD = ["House", "Sign", "Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Lagna", "Sarva", "Band"];

/** Planet abbreviations are localised only where their table meaning is fixed. */
export function appendixTableHeadMalayalam(head: string[] | undefined): string[] | undefined {
  if (!exactHead(head, ASHTAKA_HEAD)) return undefined;
  return ["ഭാവം", "രാശി", ...PLANETS.slice(0, 7).map((p) => planet(p)!), "ലഗ്നം", "സർവം", "വിഭാഗം"];
}
function namedPeriod(value: string, names: readonly string[], allowEmpty = false): string | undefined {
  const m = /^(.*?)( \(running\)| \(at passing\))?$/.exec(value);
  if (!m) return undefined;
  if (!m[1] && allowEmpty && !m[2]) return "";
  const n = known(names, m[1]);
  return n === undefined ? undefined : `${n}${RUNNING[m[2] ?? ""]}`;
}

/** Translate a row only for an exact known table schema and fully recognised generated cells. */
export function appendixTableRowMalayalam(head: string[] | undefined, row: string[]): string[] | undefined {
  if (!head || row.length !== head.length) return undefined;
  const same = (h: string[]) => exactHead(head, h);
  if (same(["Point", "Star · quarter", "Star lord", "D9 sign", "Qualifications"]) || same(["Point", "Star · quarter", "Star lord", "D9 sign", "Qualifications", "BNN solar quarter"])) {
    const translated = [point(row[0]), starQuarter(row[1]), planet(row[2]), sign(row[3]), qualifications(row[4])];
    if (row.length === 6) {
      const solar: Record<string, string> = { "—": "—", "same quarter": "അതേ പാദം", "near, different quarter": "സമീപം, മറ്റൊരു പാദം", "different quarter": "മറ്റൊരു പാദം" };
      translated.push(solar[row[5]]);
    }
    return translated.some((x) => x === undefined) ? undefined : translated as string[];
  }
  if (same(["Point", "Sign lord", "Star lord", "D9 sign lord"])) {
    const fields = [point(row[0]), ...row.slice(1).map(location)];
    return fields.some((x) => x === undefined) ? undefined : fields as string[];
  }
  if (["Rashi (whole sign) house", "Bhava chalit (Sripati) house", "Bhava chalit (equal) house", "KP Placidus cusps house"].some((h) => same([h, "Intersecting stars and quarters (partial where marked)"]))) {
    const h = /^H([1-9]|1[0-2])$/.exec(row[0]);
    const q = quarters(row[1]);
    return h && q !== undefined ? [`${h[1]}-ാം ഭാവം`, q] : undefined;
  }
  if (same(["House from ALP", "Sign", "Lord", "Planets", "House from janma"])) {
    const p = row[3] === "—" ? "—" : row[3].split(", ").map(planet);
    const fields = [ordinal(row[0]), sign(row[1]), planet(row[2]), Array.isArray(p) ? (p.every(Boolean) ? p.join(", ") : undefined) : p, ordinal(row[4])];
    return fields.some((x) => x === undefined) ? undefined : fields as string[];
  }
  if (same(["ALP sign", "From", "To", "Ages"]) || same(["Chara dasha", "From", "To", "Years"])) {
    const name = namedPeriod(row[0], SIGNS);
    return name === undefined ? undefined : [name, ...row.slice(1)];
  }
  if (same(["Nakshatra in this sign", "Lord", "From", "To"])) {
    const n = namedPeriod(row[0], NAKSHATRAS, true), l = row[1] ? planet(row[1]) : "";
    return n === undefined || l === undefined ? undefined : [n, l, row[2], row[3]];
  }
  if (same(["Karaka", "Planet", "Sign", "Degree"])) {
    const names: Record<string, string> = { Atmakaraka: "ആത്മകാരകൻ", Amatyakaraka: "അമാത്യകാരകൻ", Bhratrikaraka: "ഭ്രാതൃകാരകൻ", Matrikaraka: "മാതൃകാരകൻ", Pitrikaraka: "പിതൃകാരകൻ", Putrakaraka: "പുത്രകാരകൻ", Gnatikaraka: "ജ്ഞാതികാരകൻ", Darakaraka: "ദാരകാരകൻ" };
    const fields = [names[row[0]], planet(row[1]), sign(row[2]), row[3]];
    return fields.some((x) => x === undefined) ? undefined : fields as string[];
  }
  if (same(["Pada", "Of the", "House sign", "Lord", "Falls in", "Matters"])) {
    const matters: Record<string, [string, string]> = {
      AL: ["image, standing, how the world sees the native", "പ്രതിച്ഛായ, സ്ഥാനമാനം, ലോകം വ്യക്തിയെ എങ്ങനെ കാണുന്നു"],
      A2: ["perceived wealth and family", "മറ്റുള്ളവർ കാണുന്ന ധനവും കുടുംബവും"],
      A3: ["siblings, courage, effort", "സഹോദരങ്ങൾ, ധൈര്യം, പരിശ്രമം"],
      A4: ["home, mother, property", "വീട്, അമ്മ, സ്വത്ത്"],
      A5: ["children, learning, counsel", "കുട്ടികൾ, പഠനം, ഉപദേശം"],
      A6: ["enemies, illness, debts", "ശത്രുക്കൾ, രോഗം, കടങ്ങൾ"],
      A7: ["partners and business", "പങ്കാളികളും ബിസിനസും"],
      A8: ["longevity, inheritance, secrets", "ആയുർദൈർഘ്യം, അനന്തരാവകാശം, രഹസ്യങ്ങൾ"],
      A9: ["fortune, father, dharma", "ഭാഗ്യം, അച്ഛൻ, ധർമ്മം"],
      A10: ["career and public work", "തൊഴിലും പൊതുപ്രവർത്തനവും"],
      A11: ["gains and friends", "നേട്ടങ്ങളും സുഹൃത്തുക്കളും"],
      UL: ["marriage and the spouse's family", "വിവാഹവും പങ്കാളിയുടെ കുടുംബവും"],
    };
    const m = matters[row[0]], h = ordinal(row[1]), sourceSign = sign(row[2]), lord = planet(row[3]), target = sign(row[4]);
    if (!m || m[0] !== row[5] || !h || !sourceSign || !lord || !target) return undefined;
    const label = row[0] === "AL" ? "ആരൂഢലഗ്നം (AL)" : row[0] === "UL" ? "ഉപപദം (UL)" : `പദം ${row[0]}`;
    return [label, h, sourceSign, lord, target, m[1]];
  }
  if (same(["Matter", "Script", "Cusp stage", "Planet", "Star houses", "Sub houses", "Status"])) {
    const item = EVENT_MATTERS.find((e) => e.label === row[0]);
    const itemMl = item && translate("ml", item.label);
    const method: Record<string, string> = { Strict: "കർശന രീതി (Strict)", "Mixed v2": "സമ്മിശ്ര രീതി v2" };
    const cusp = /^Cusp ([1-9]|1[0-2]) sub lord$/.exec(row[2]);
    const coordinator = (text: string) => {
      const m = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu): (—|(?:[1-9]|1[0-2])(?:, (?:[1-9]|1[0-2]))*)$/.exec(text);
      return m && planet(m[1]) ? `${planet(m[1])}: ${m[2]}` : undefined;
    };
    const states: Record<string, string> = { support: "പിന്തുണ", mixed: "സമ്മിശ്രം", adverse: "പ്രതികൂലം", silent: "സൂചനയില്ല", supported: "പിന്തുണയുണ്ട്", "supported-with-caution": "ജാഗ്രതയോടെ പിന്തുണ", "mixed-sub": "സഹതലത്തിൽ സമ്മിശ്രം", opposed: "വിരുദ്ധം", unresolved: "തീർപ്പായിട്ടില്ല" };
    const raw = /^not counted \(raw: ([a-z-]+)\)$/.exec(row[6]);
    const status = raw ? states[raw[1]] && `കണക്കിലെടുത്തിട്ടില്ല (അടിസ്ഥാന സ്ഥിതി: ${states[raw[1]]})` : states[row[6]];
    const names = [planet(row[3]), coordinator(row[4]), coordinator(row[5])];
    if (!itemMl || itemMl === row[0] || !method[row[1]] || !cusp || !status || names.some((x) => x === undefined)) return undefined;
    return [itemMl, method[row[1]], `${cusp[1]}-ാം ഭാവസ്ഫുട സഹാധിപൻ`, ...names as string[], status];
  }
  if (same(["Chart", "Matter house", "House lord", "Occupants", "Full aspects"])) {
    if (!/^(D1|D7|D9|D10)$/.test(row[0])) return undefined;
    const h = /^house ([1-9]|1[0-2]): ([A-Za-z]+)$/.exec(row[1]);
    const l = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) in house ([1-9]|1[0-2]), ([A-Za-z]+)(?: \((own sign|exaltation sign|debilitation sign)\))?$/.exec(row[2]);
    const dignity: Record<string, string> = { "own sign": "സ്വക്ഷേത്രം", "exaltation sign": "ഉച്ചരാശി", "debilitation sign": "നീചരാശി" };
    const list = (source: string) => {
      if (source === "none") return "ഒന്നുമില്ല";
      const p = source.split(", ").map(planet);
      return p.every(Boolean) ? p.join(", ") : undefined;
    };
    const occupants = list(row[3]), aspects = list(row[4]);
    if (!h || !l || !sign(h[2]) || !planet(l[1]) || !sign(l[3]) || occupants === undefined || aspects === undefined) return undefined;
    return [row[0], `${h[1]}-ാം ഭാവം: ${sign(h[2])}`, `${planet(l[1])} ${l[2]}-ാം ഭാവത്തിൽ, ${sign(l[3])}${l[4] ? ` (${dignity[l[4]]})` : ""}`, occupants, aspects];
  }
  if (same(["", "D1", "D2", "D3", "D4", "D7", "D9", "D10", "D12", "D16", "D20", "D24", "D27", "D30", "D40", "D45", "D60"])) {
    const p = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)( \(V\))?$/.exec(row[0]);
    const pName = p && PLANETS.find((x) => PLANET_ABBR[x] === p[1]);
    const first = row[0] === "Lagna" ? "ലഗ്നം" : pName ? `${planet(pName)}${p?.[2] ? " (വർഗോത്തമം)" : ""}` : undefined;
    const values = row.slice(1).map((abbrev) => {
      const index = SIGN_ABBR.indexOf(abbrev);
      return index >= 0 ? sign(SIGNS[index]) : undefined;
    });
    return first === undefined || values.some((x) => x === undefined) ? undefined : [first, ...values as string[]];
  }
  if (same(["Planet", "Sthana", "Dig", "Kala", "Chesta", "Naisargika", "Drik", "Total", "Required", "Standing"])) {
    const p = planet(row[0]);
    const standing = /^(strong|weak) \((-?\d+\.\d{2})\)$/.exec(row[9]);
    if (!p || !standing || row.slice(1, 9).some((x) => !/^-?\d+\.\d{2}$/.test(x))) return undefined;
    return [p, ...row.slice(1, 9), `${standing[1] === "strong" ? "ബലമുള്ളത്" : "ബലം കുറഞ്ഞത്"} (${standing[2]})`];
  }
  if (same(["House", "Sign", "Lord's bala", "Dig", "Drishti", "Total"])) {
    const h = ordinal(row[0]), s = sign(row[1]);
    if (!h || !s || row.slice(2).some((x) => !/^-?\d+\.\d{2}$/.test(x))) return undefined;
    return [h, s, ...row.slice(2)];
  }
  if (same(ASHTAKA_HEAD)) {
    const h = ordinal(row[0]), s = sign(row[1]);
    const labels: Record<string, string> = { favourable: "അനുകൂലം", medium: "മധ്യം", adverse: "പ്രതികൂലം" };
    if (!h || !s || row.slice(2, 11).some((x) => !/^\d+$/.test(x)) || !labels[row[11]]) return undefined;
    return [h, s, ...row.slice(2, 11), labels[row[11]]];
  }
  if (same(["Planet", "Shadvarga (of 20)", "Saptavarga (of 20)", "Dasavarga (of 20)", "Shodasavarga (of 20)", "Designation"])) {
    const bands: Record<string, string> = { "below five": "അഞ്ചിൽ താഴെ", "some good": "അൽപ്പം നന്മ", middling: "മധ്യം", "wholly favourable": "പൂർണമായും അനുകൂലം" };
    const names: Record<string, string> = {
      Kimsuka: "കിംശുകം", Vyanjana: "വ്യഞ്ജനം", Chaamara: "ചാമരം", Chhatra: "ഛത്രം", Kundala: "കുണ്ഡലം", Mukuta: "മുകുടം",
      Parijata: "പാരിജാതം", Uttama: "ഉത്തമം", Gopura: "ഗോപുരം", Simhasana: "സിംഹാസനം", Paravata: "പാരാവതം", Devaloka: "ദേവലോകം", Brahmaloka: "ബ്രഹ്മലോകം", Sakravahana: "ശക്രവാഹനം", Sridhama: "ശ്രീധാമം",
      Bhedaka: "ഭേദകം", Kusuma: "കുസുമം", Nagapushpa: "നാഗപുഷ്പം", Kanduka: "കന്ദുകം", Kerala: "കേരളം", Kalpavriksha: "കൽപവൃക്ഷം", "Chandana Vana": "ചന്ദനവനം", Poornachandra: "പൂർണചന്ദ്രം", Uchchaisrava: "ഉച്ചൈശ്രവസ്", Dhanvantari: "ധന്വന്തരി", Suryakanta: "സൂര്യകാന്തം", Vidruma: "വിദ്രുമം", Sakrasimhasana: "ശക്രസിംഹാസനം", Goloka: "ഗോലോകം", "Sri Vallabha": "ശ്രീവല്ലഭം",
    };
    const p = planet(row[0]);
    const scores = row.slice(1, 5).map((x) => {
      if (x === "—") return x;
      const m = /^(\d+\.\d) (below five|some good|middling|wholly favourable)$/.exec(x);
      return m ? `${m[1]} ${bands[m[2]]}` : undefined;
    });
    const words = row[5] === "—" ? ["—"] : row[5].split(", ").map((x) => names[x]);
    if (!p || scores.some((x) => x === undefined) || words.some((x) => x === undefined)) return undefined;
    return [p, ...scores as string[], words.join(", ")];
  }
  if (same(["Dasa", "From", "To", "Ages", "Parashara's tone"])) {
    const p = namedPeriod(row[0], PLANETS);
    const labels: Record<string, string> = { favourable: "അനുകൂലം", "leans favourable": "അനുകൂലത്തിലേക്ക് ചായുന്നു", balanced: "സമനില", "leans trying": "ബുദ്ധിമുട്ടിലേക്ക് ചായുന്നു", trying: "ബുദ്ധിമുട്ട്" };
    const m = /^(favourable|leans favourable|balanced|leans trying|trying) \((\d+) favourable, (\d+) trying\)$/.exec(row[4]);
    const tone = row[4] === "no clear lean" ? "വ്യക്തമായ ചായ്വില്ല" : m ? `${labels[m[1]]} (${m[2]} അനുകൂലം, ${m[3]} ബുദ്ധിമുട്ട്)` : undefined;
    return p === undefined || tone === undefined ? undefined : [p, row[1], row[2], row[3], tone];
  }
  if (same(["Bhukti", "From", "To", "Favourable when", "Trying when"])) {
    const p = namedPeriod(row[0], PLANETS);
    if (p === undefined) return undefined;
    // Each condition is a full source sentence; a changed or redacted cell remains English.
    return [p, row[1], row[2], ANTAR_CONDITION_ML[row[3]] ?? row[3], ANTAR_CONDITION_ML[row[4]] ?? row[4]];
  }
  return undefined;
}
