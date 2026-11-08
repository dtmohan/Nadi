/** Translate only complete, recognized Jaimini timing triggers; unknown clauses stay English. */
const PLANETS: Record<string, string> = { Sun: "സൂര്യൻ", Moon: "ചന്ദ്രൻ", Mars: "ചൊവ്വ", Mercury: "ബുധൻ", Jupiter: "വ്യാഴം", Venus: "ശുക്രൻ", Saturn: "ശനി", Rahu: "രാഹു", Ketu: "കേതു" };
const SIGNS: Record<string, string> = { Aries: "മേടം", Taurus: "ഇടവം", Gemini: "മിഥുനം", Cancer: "കർക്കടകം", Leo: "ചിങ്ങം", Virgo: "കന്നി", Libra: "തുലാം", Scorpio: "വൃശ്ചികം", Sagittarius: "ധനു", Capricorn: "മകരം", Aquarius: "കുംഭം", Pisces: "മീനം" };
const HOUSE_MATTERS: Record<string, string> = {
  "rise in work and position": "ജോലിയിലും സ്ഥാനത്തിലും ഉയർച്ച",
  accumulation: "സമ്പാദ്യം", gains: "ലാഭം", outflow: "ചെലവ്",
  partnership: "പങ്കാളിത്തം", "children and study": "സന്താനവും പഠനവും",
  "home and mother": "വീടും അമ്മയും", "father and fortune": "അച്ഛനും ഭാഗ്യവും",
  "separation or residence away from home": "വേർപിരിയലോ വീട്ടിൽനിന്ന് അകലെയുള്ള താമസമോ",
  "illness, disputes, rivals": "രോഗം, തർക്കങ്ങൾ, എതിരാളികൾ", "reversals and serious obstacles": "തിരിച്ചടികളും ഗുരുതര തടസ്സങ്ങളും",
};
const PADA_MATTERS: Record<string, string> = {
  "image, name and public standing": "പ്രതിച്ഛായ, പേര്, പൊതുസ്ഥാനം",
  "savings, family wealth and what is accumulated": "സമ്പാദ്യം, കുടുംബസമ്പത്ത്, ശേഖരിച്ചവ",
  "siblings, courage and undertakings": "സഹോദരങ്ങൾ, ധൈര്യം, സംരംഭങ്ങൾ",
  "home, property, mother and comfort": "വീട്, സ്വത്ത്, അമ്മ, സുഖം",
  "children, students and one's visible talents": "സന്താനം, വിദ്യാർഥികൾ, പ്രകടമായ കഴിവുകൾ",
  "enemies, disputes, debts and illness": "ശത്രുക്കൾ, തർക്കങ്ങൾ, കടങ്ങൾ, രോഗം",
  "partnership, business and the partner as seen by others": "പങ്കാളിത്തം, വ്യാപാരം, മറ്റുള്ളവർ കാണുന്ന പങ്കാളി",
  "reversals, inheritance and hidden trouble": "തിരിച്ചടികൾ, അനന്തരാവകാശം, മറഞ്ഞിരിക്കുന്ന ബുദ്ധിമുട്ട്",
  "father, teachers, fortune and travel": "അച്ഛൻ, അധ്യാപകർ, ഭാഗ്യം, യാത്ര",
  "career, rank and recognition": "തൊഴിൽ, പദവി, അംഗീകാരം",
  "income, gains and allies": "വരുമാനം, ലാഭം, സഹായികൾ",
  "the marriage, the spouse's family and the marital home": "വിവാഹം, പങ്കാളിയുടെ കുടുംബം, വൈവാഹിക ഭവനം",
};
const KARAKA_MATTERS: Record<string, string> = {
  "the self, its purpose and standing": "സ്വയം, ജീവിതലക്ഷ്യം, സ്ഥാനം",
  "work, position, advisers and one's role in the world": "ജോലി, പദവി, ഉപദേശകർ, സമൂഹത്തിലെ പങ്ക്",
  "siblings, the guru and one's own initiative": "സഹോദരങ്ങൾ, ഗുരു, സ്വന്തം മുൻകൈ",
  "mother, home, property and inner comfort": "അമ്മ, വീട്, സ്വത്ത്, മനസ്സുഖം",
  "father, lineage, dharma and protection": "അച്ഛൻ, പാരമ്പര്യം, ധർമം, സംരക്ഷണം",
  "children, students, creativity and merit": "സന്താനം, വിദ്യാർഥികൾ, സർഗാത്മകത, പുണ്യം",
  "relatives, rivals, disputes and illness": "ബന്ധുക്കൾ, എതിരാളികൾ, തർക്കങ്ങൾ, രോഗം",
  "the spouse, partnerships and close alliances": "പങ്കാളി, പങ്കാളിത്തം, അടുത്ത ബന്ധങ്ങൾ",
  "the spouse and the marriage": "പങ്കാളിയും വിവാഹവും", "marriage and partnership": "വിവാഹവും പങ്കാളിത്തവും", "the soul's own agenda": "ആത്മാവിന്റെ സ്വന്തം ലക്ഷ്യം",
};
const join = (xs: string[]) => xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const planets = (source: string) => {
  const xs = source.replace(/ and /g, ", ").split(", ");
  return xs.length && xs.every((x) => PLANETS[x]) && join(xs) === source ? xs.map((x) => PLANETS[x]).join(", ") : undefined;
};
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const house = (s: string) => { const n = parseInt(s, 10); return n >= 1 && n <= 12 && ordinal(n) === s ? n : undefined; };
const pada = (s: string) => /^(AL|A[2-9]|A10|A11|UL)$/.test(s) ? s : undefined;
const karakaIds = new Set(["AK", "AmK", "BK", "MK", "PiK", "PK", "GK", "DK"]);
const anchor = (s: string): string | undefined => {
  if (s === "the Karakamsa") return "കാരകാംശം";
  let m = /^(AK|AmK|BK|MK|PiK|PK|GK|DK) (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)$/.exec(s);
  if (m) return `${m[1]} ${PLANETS[m[2]]}`;
  m = /^the navamsa sign of DK (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)$/.exec(s);
  if (m) return `DK ${PLANETS[m[1]]}-ന്റെ നവാംശരാശി`;
  m = /^the 7th lord (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)$/.exec(s);
  return m ? `ഏഴാം ഭാവാധിപൻ ${PLANETS[m[1]]}` : undefined;
};
const strength = (source: string): string | undefined => {
  if (!source) return "";
  const m = /^ (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn) is (exalted by sign|in its moolatrikona sign|in its own sign|in a friendly sign|debilitated by sign|in an inimical sign) there, (which is a supportive sign-level clue|a sign-level clue of possible effort or delay)\.$/.exec(source);
  if (!m) return undefined;
  const dignity: Record<string, string> = { "exalted by sign": "ഉച്ചരാശിയിൽ", "in its moolatrikona sign": "മൂലത്രികോണരാശിയിൽ", "in its own sign": "സ്വന്തം രാശിയിൽ", "in a friendly sign": "മിത്രരാശിയിൽ", "debilitated by sign": "നീചരാശിയിൽ", "in an inimical sign": "ശത്രുരാശിയിൽ" };
  return ` ${PLANETS[m[1]]} അവിടെ ${dignity[m[2]]} ആണ്; ${m[3].startsWith("which") ? "ഇത് അനുകൂലമായ രാശിതല സൂചനയാണ്" : "ഇത് ശ്രമമോ കാലതാമസമോ ഉണ്ടാകാമെന്ന രാശിതല സൂചനയാണ്"}.`;
};

export function jaiminiTimingMalayalam(source: string): string | undefined {
  // This sentence also contains “in the 8th from”; check it before the planet-list form.
  let m = /^The Atmakaraka falls in the 8th from (\w+): predictions must be made carefully \(Rao\)\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]]; return sign ? `ആത്മകാരകൻ ${sign} രാശിയിൽനിന്ന് എട്ടാം ഭാവത്തിലാണ്: പ്രവചനങ്ങൾ ശ്രദ്ധയോടെ നടത്തണം (റാവു).` : undefined; }
  m = /^(.+?)(?: \(([^)]+)\))? in the (\d+(?:st|nd|rd|th)) from (\w+): (.+)\.$/.exec(source);
  if (m) {
    const ps = planets(m[1]), h = house(m[3]), sign = SIGNS[m[4]];
    if (!ps || !h || !sign) return undefined;
    const roles = m[2]?.split(", ");
    if (roles && (!roles.every((r) => karakaIds.has(r)) || roles.join(", ") !== m[2])) return undefined;
    let ending: string | undefined;
    let gloss: string | undefined;
    if (m[5].startsWith("the area's own karaka stands in its house, the strongest sign for ")) {
      gloss = HOUSE_MATTERS[m[5].slice("the area's own karaka stands in its house, the strongest sign for ".length)];
      if (roles && gloss) ending = `ഈ വിഷയത്തിന്റെ കാരകൻ സ്വന്തം ഭാവത്തിൽ നിൽക്കുന്നു; ${gloss} സംബന്ധിച്ച ഏറ്റവും ശക്തമായ സൂചന`;
    } else if (!roles && m[5].startsWith("benefic support for ")) {
      gloss = HOUSE_MATTERS[m[5].slice("benefic support for ".length)]; if (gloss) ending = `${gloss} സംബന്ധിച്ച് ശുഭഗ്രഹ പിന്തുണ`;
    } else if (!roles && m[5].startsWith("effort or conflict around ")) {
      gloss = HOUSE_MATTERS[m[5].slice("effort or conflict around ".length)]; if (gloss) ending = `${gloss} സംബന്ധിച്ച് പ്രയത്നമോ സംഘർഷമോ`;
    } else if (!roles && m[5].endsWith(" kept mild by benefics")) {
      gloss = HOUSE_MATTERS[m[5].slice(0, -" kept mild by benefics".length)]; if (gloss) ending = `${gloss} ശുഭഗ്രഹങ്ങളാൽ ലഘൂകരിക്കപ്പെടുന്നു`;
    } else if (!roles && HOUSE_MATTERS[m[5]]) ending = HOUSE_MATTERS[m[5]];
    return ending ? `${sign} രാശിയിൽനിന്ന് ${h}-ാം ഭാവത്തിൽ ${ps}${roles ? ` (${roles.join(", ")})` : ""}: ${ending}.` : undefined;
  }
  m = /^(\w+) is the (AL|A[2-9]|A10|A11|UL) sign: (.+) are on stage\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]], p = pada(m[2]), matter = PADA_MATTERS[m[3]]; return sign && p && matter ? `${sign} ${p} രാശിയാണ്: ${matter} എന്നീ വിഷയങ്ങൾ മുന്നിലുണ്ട്.` : undefined; }
  m = /^(\w+) is 7th from the (AL|A[2-9]|A10|A11|UL): it faces the pada across the 1–7 axis, so (.+) are activated \(Rao\)\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]], p = pada(m[2]), matter = PADA_MATTERS[m[3]]; return sign && p && matter ? `${sign} ${p}-യിൽനിന്ന് ഏഴാമതാണ്: 1–7 അക്ഷത്തിൽ പദത്തിന് അഭിമുഖമായതിനാൽ ${matter} സജീവമാകുന്നു (റാവു).` : undefined; }
  m = /^(\w+) aspects the (AL|A[2-9]|A10|A11|UL) \((\w+)\) by rasi drishti: a lighter touch on (.+)\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]], target = SIGNS[m[3]], p = pada(m[2]), matter = PADA_MATTERS[m[4]]; return sign && target && p && matter ? `${sign} ${p}-നെ (${target}) രാശിദൃഷ്ടിയാൽ ദൃഷ്ടിക്കുന്നു: ${matter} വിഷയങ്ങളിൽ താരതമ്യേന ലഘുവായ സ്പർശം.` : undefined; }
  m = /^(\w+) holds (.+?): (.+?) come to the front\.(.*)$/.exec(source);
  if (m) { const sign = SIGNS[m[1]], a = anchor(m[2]), matter = KARAKA_MATTERS[m[3]], s = strength(m[4]); return sign && a && matter && s !== undefined ? `${sign} രാശിയിൽ ${a} ഉണ്ട്: ${matter} മുന്നിലെത്തുന്നു.${s}` : undefined; }
  m = /^(\w+) is (the navamsa sign of DK (?:Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)): (.+) come to the front\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]], a = anchor(m[2]), matter = KARAKA_MATTERS[m[3]]; return sign && a && matter ? `${sign} ${a} ആണ്: ${matter} മുന്നിലെത്തുന്നു.` : undefined; }
  m = /^(\w+) is 7th from (.+?): it faces the karaka across the 1–7 axis, so (.+) are activated\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]], a = anchor(m[2]), matter = KARAKA_MATTERS[m[3]]; return sign && a && matter ? `${sign} ${a}-യിൽനിന്ന് ഏഴാമതാണ്: 1–7 അക്ഷത്തിൽ കാരകന് അഭിമുഖമായതിനാൽ ${matter} സജീവമാകുന്നു.` : undefined; }
  m = /^(\w+) aspects (.+?) by rasi drishti: a lighter touch on (.+)\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]], a = anchor(m[2]), matter = KARAKA_MATTERS[m[3]]; return sign && a && matter ? `${sign} ${a}-നെ രാശിദൃഷ്ടിയാൽ ദൃഷ്ടിക്കുന്നു: ${matter} വിഷയങ്ങളിൽ താരതമ്യേന ലഘുവായ സ്പർശം.` : undefined; }
  m = /^(\w+) periods are known for rises and falls(, especially as sub-periods)? \(Rao\)\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]]; return sign ? `${sign} കാലങ്ങൾ ഉയർച്ചകൾക്കും താഴ്ചകൾക്കും അറിയപ്പെടുന്നു${m[2] ? ", പ്രത്യേകിച്ച് ഉപകാലങ്ങളായി വരുമ്പോൾ" : ""} (റാവു).` : undefined; }
  m = /^(\w+) holds the Atmakaraka: a period that tests the self; Rao asks for care, since AK periods can bring a fall as well as a rise\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]]; return sign ? `${sign} രാശിയിൽ ആത്മകാരകനുണ്ട്: സ്വയത്തെ പരീക്ഷിക്കുന്ന കാലം; ആത്മകാരക കാലങ്ങൾ ഉയർച്ചയ്ക്കൊപ്പം താഴ്ചയും വരുത്താമെന്നതിനാൽ റാവു ശ്രദ്ധ ആവശ്യപ്പെടുന്നു.` : undefined; }
  m = /^(\w+) is the Karakamsa sign \(Swamsa\): the soul's own agenda comes forward\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]]; return sign ? `${sign} കാരകാംശരാശിയാണ് (സ്വാംശം): ആത്മാവിന്റെ സ്വന്തം ലക്ഷ്യം മുന്നിലെത്തുന്നു.` : undefined; }
  m = /^(\w+) is the Arudha lagna: standing and image are on show\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]]; return sign ? `${sign} ആരൂഢലഗ്നമാണ്: സ്ഥാനവും പ്രതിച്ഛായയും പ്രകടമാകുന്നു.` : undefined; }
  m = /^(\w+) is the dasha sign itself: the mahadasha themes for this area come forward on their own, without a second lens\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]]; return sign ? `${sign} ദശാരാശി തന്നെയാണ്: ഈ വിഷയത്തിലെ മഹാദശാ സൂചനകൾ മറ്റൊരു കാഴ്ചപ്പാടിന്റെ ആവർത്തനമില്ലാതെ സ്വയം മുന്നിലെത്തുന്നു.` : undefined; }
  m = /^(\w+) is the dasha sign itself: the mahadasha themes come forward on their own\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]]; return sign ? `${sign} ദശാരാശി തന്നെയാണ്: മഹാദശാ സൂചനകൾ സ്വയം മുന്നിലെത്തുന്നു.` : undefined; }
  m = /^(\w+) is the 6th from the lagna, the 2nd from the 5th and so a maraka house for children: care is needed for their health \(Rao\)\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]]; return sign ? `${sign} ലഗ്നത്തിൽനിന്ന് ആറാമത്തെയും അഞ്ചിൽനിന്ന് രണ്ടാമത്തെയും ഭാവമാണ്; അതിനാൽ സന്താനത്തിന്റെ മാരകഭാവമായി കാണുന്നു. അവരുടെ ആരോഗ്യത്തിൽ ശ്രദ്ധ ആവശ്യമാണ് (റാവു).` : undefined; }
  m = /^(\w+) is the (6th|8th) from the mahadasha sign (\w+): a sub-period to be careful in(, more so as the Atmakaraka aspects it)? \(Rao\)\.$/.exec(source);
  if (m) { const sign = SIGNS[m[1]], major = SIGNS[m[3]]; return sign && major ? `${sign} മഹാദശാരാശിയായ ${major}-ത്തിൽനിന്ന് ${m[2] === "6th" ? "ആറാമത്തേത്" : "എട്ടാമത്തേത്"} ആണ്: ശ്രദ്ധ വേണ്ട ഉപകാലം${m[4] ? "; ആത്മകാരകൻ അതിനെ ദൃഷ്ടിക്കുന്നതിനാൽ കൂടുതൽ ശ്രദ്ധ" : ""} (റാവു).` : undefined; }
  if (source === "Sagittarius aspected by the Atmakaraka: Rao warns of violent events to the self or the family.") return "ആത്മകാരകന്റെ ദൃഷ്ടിയുള്ള ധനു: വ്യക്തിക്കോ കുടുംബത്തിനോ നേരെയുള്ള അക്രമസംഭവങ്ങളെക്കുറിച്ച് റാവു മുന്നറിയിപ്പ് നൽകുന്നു.";
  return undefined;
}
