/** Report-only labels: exact text or closed patterns, never a free-form translation. */
const LABELS: Record<string, string> = {
  "The chart": "ജനനജാതകം",
  "How to read this report": "ഈ റിപ്പോർട്ട് എങ്ങനെ വായിക്കാം",
  "At a glance: where the systems agree or differ": "ഒറ്റനോട്ടത്തിൽ: രീതികൾ എവിടെ യോജിക്കുന്നു, എവിടെ വ്യത്യാസപ്പെടുന്നു",
  "The day of birth": "ജനിച്ച ദിവസം",
  "The birth star": "ജന്മനക്ഷത്രം",
  "The star's imagery": "നക്ഷത്രത്തിന്റെ പ്രതീകങ്ങൾ",
  "The Moon here": "ഈ സ്ഥാനത്തെ ചന്ദ്രൻ",
  "The Moon's quarter": "ചന്ദ്രന്റെ നക്ഷത്രപാദം",
  "Early years": "ആദ്യകാല ജീവിതം",
  "Close relationships": "അടുത്ത ബന്ധങ്ങൾ",
  "The Nadi reading": "നാഡി വായന",
  "Wealth: the eight Lakshmi forms": "ധനം: ലക്ഷ്മിയുടെ എട്ടു രൂപങ്ങൾ",
  "Wealth: the twenty nakshatras": "ധനം: ഇരുപതു നക്ഷത്രങ്ങൾ",
  "Houses, lords and yogas": "ഭാവങ്ങളും അധിപന്മാരും യോഗങ്ങളും",
  "Yogas": "യോഗങ്ങൾ",
  "Strains and their remedies in the chart": "ജാതകത്തിലെ പ്രയാസസൂചനകളും പരിഹാരങ്ങളും",
  "Natal foundations for event topics": "ജീവിതസംഭവങ്ങൾക്കുള്ള ജനനജാതക അടിസ്ഥാനം",
  "Natal yoga pairs, nodes and matter-house combinations": "ജനനജാതകത്തിലെ യോഗജോഡികൾ, രാഹുകേതുക്കൾ, വിഷയഭാവ കൂട്ടുകൾ",
  "The periods of life": "ജീവിതത്തിലെ ദശാകാലങ്ങൾ",
  "Good periods by topic": "ഓരോ വിഷയത്തിനുമുള്ള അനുകൂല കാലങ്ങൾ",
  "Periods by topic": "ഓരോ വിഷയത്തിനുമുള്ള കാലങ്ങൾ",
  "Work and standing": "തൊഴിലും സ്ഥാനമാനവും",
  "Money and property": "ധനവും സ്വത്തും",
  "The Jaimini reading": "ജൈമിനി വായന",
  "Indu Lagna": "ഇന്ദുലഗ്നം",
  "The cusps and their sub lords": "കസ്പുകളും സഹാധിപന്മാരും",
  "Natal event cusp scripts": "ജീവിതസംഭവങ്ങൾക്കുള്ള ജനനജാതക കസ്പ് പരിശോധനകൾ",
  "The progressed lagna": "മുന്നോട്ടു നീങ്ങുന്ന ലഗ്നം",
  "The birth-chart houses": "ജനനജാതകത്തിലെ ഭാവങ്ങൾ",
  "First Vimshottari period": "ആദ്യത്തെ വിമ്ശോത്തരി ദശ",
  "Appendix: the tables": "അനുബന്ധം: പട്ടികകൾ",
  "Parashara's tables": "പരാശരി പട്ടികകൾ",
  "Planetary strength (Shadbala)": "ഗ്രഹബലം (ഷഡ്ബലം)",
  "The sixteen divisions (vargas)": "പതിനാറ് വിഭാഗങ്ങൾ (വർഗങ്ങൾ)",
  "The points tables (Ashtakavarga)": "ബിന്ദുപട്ടികകൾ (അഷ്ടകവർഗം)",
  "Modern node aspects (not counted)": "രാഹുകേതുക്കളുടെ ആധുനിക ദൃഷ്ടികൾ (കണക്കിൽ ഉൾപ്പെടുത്തിയിട്ടില്ല)",
  "The sky today": "ഇന്നത്തെ ഗ്രഹനില",
  "Pushkara navamsa": "പുഷ്കര നവാംശം",
  "A nourishing quarter": "പോഷണം നൽകുന്ന പാദം",
  "Across the readings": "വിവിധ വായനകളിൽ",
  "For practitioners": "വിദഗ്ധർക്കായി",
  "Panchanga · Surya Siddhanta": "പഞ്ചാംഗം · സൂര്യസിദ്ധാന്തം",
  "A modern reading · Sutton, The Nakshatras (2014)": "ആധുനിക വായന · സട്ടൺ, The Nakshatras (2014)",
  "Bhrigu Nandi Nadi · Rao, Naik": "ഭൃഗു നന്ദി നാഡി · റാവു, നായിക്",
  "Brihat Parashara Hora Sastra": "ബൃഹത് പരാശര ഹോര ശാസ്ത്രം",
  "Vimshottari dasa · Parashara ch. 46-48, 52-60": "വിമ്ശോത്തരി ദശ · പരാശരൻ അധ്യായങ്ങൾ 46–48, 52–60",
  "Jaimini Sutras · K.N. Rao's Chara dasha": "ജൈമിനി സൂത്രങ്ങൾ · കെ. എൻ. റാവുവിന്റെ ചരദശ",
  "Krishnamurti Paddhati": "കൃഷ്ണമൂർത്തി പദ്ധതി",
  "Astro Lagna Paddhati": "ആസ്ട്രോ ലഗ്ന പദ്ധതി",
  "Strength, divisions and points · Parashara ch. 6-7, 27, 66-72": "ബലം, വർഗങ്ങൾ, ബിന്ദുക്കൾ · പരാശരൻ അധ്യായങ്ങൾ 6–7, 27, 66–72",
  "Sign": "രാശി", "Degree": "അംശം", "Nakshatra": "നക്ഷത്രം", "Topic": "വിഷയം",
  "Matter house": "വിഷയഭാവം", "Occupants": "ഭാവത്തിലുള്ള ഗ്രഹങ്ങൾ", "Full aspects": "പൂർണ ദൃഷ്ടികൾ",
  "Dasa": "ദശ", "From": "മുതൽ", "To": "വരെ", "Ages": "പ്രായം", "Parashara's tone": "പരാശരി സൂചന",
  "Matter": "വിഷയം", "Script": "പരിശോധനാരീതി", "Cusp stage": "കസ്പ് ഘട്ടം", "Star houses": "നക്ഷത്ര ഭാവങ്ങൾ", "Sub houses": "സഹാധിപ ഭാവങ്ങൾ", "Status": "സ്ഥിതി",
  "Fact": "വിവരം", "Sutton": "സട്ടൺ", "Where": "സ്ഥാനം", "Point": "ബിന്ദു", "Star · quarter": "നക്ഷത്രം · പാദം",
  "D9 sign": "D9 രാശി", "Qualifications": "പരിമിതികളും വ്യവസ്ഥകളും", "BNN solar quarter": "BNN സൗരപാദം", "D9 sign lord": "D9 രാശ്യാധിപൻ",
  "Rashi (whole sign) house": "രാശി (പൂർണരാശി) ഭാവം", "Intersecting stars and quarters (partial where marked)": "ഭാവത്തിൽ വരുന്ന നക്ഷത്രങ്ങളും പാദങ്ങളും (അപൂർണമെങ്കിൽ അടയാളപ്പെടുത്തിയിരിക്കുന്നു)",
  "Bhava chalit (Sripati) house": "ഭാവചലിതം (ശ്രീപതി) ഭാവം", "Bhava chalit (equal) house": "ഭാവചലിതം (സമഭാവം) ഭാവം",
  "Sthana": "സ്ഥാനബലം", "Dig": "ദിഗ്ബലം", "Kala": "കാലബലം", "Chesta": "ചേഷ്ടാബലം", "Naisargika": "നൈസർഗികബലം", "Drik": "ദൃഗ്ബലം",
  "Total": "ആകെ", "Required": "ആവശ്യമായത്", "House": "ഭാവം", "Lord's bala": "അധിപന്റെ ബലം", "Drishti": "ദൃഷ്ടി",
  "Shadvarga (of 20)": "ഷഡ്വർഗം (20-ൽ)", "Saptavarga (of 20)": "സപ്തവർഗം (20-ൽ)", "Dasavarga (of 20)": "ദശവർഗം (20-ൽ)", "Shodasavarga (of 20)": "ഷോഡശവർഗം (20-ൽ)",
  "Designation": "വർഗീകരണം", "Lagna": "ലഗ്നം", "Sarva": "സർവം", "Band": "വിഭാഗം", "Karaka": "കാരകൻ", "Pada": "പദം",
  "Of the": "ഇതിന്റെ", "House sign": "ഭാവരാശി", "Lord": "അധിപൻ", "Falls in": "വരുന്നത്", "Matters": "വിഷയങ്ങൾ", "Chara dasha": "ചരദശ", "Years": "വർഷങ്ങൾ",
  "Cusp": "കസ്പ്", "Sign and degree": "രാശിയും അംശവും", "Sub lord holds (before / after)": "സഹാധിപൻ നിലനിൽക്കുന്ന സമയം (മുമ്പ് / ശേഷം)", "In house": "ഭാവസ്ഥാനം", "Signifies (A-D)": "സൂചിപ്പിക്കുന്നത് (A–D)",
  "KP Placidus cusps house": "KP പ്ലാസിഡസ് കസ്പ് ഭാവം", "House from ALP": "ALP-യിൽനിന്നുള്ള ഭാവം", "Planets": "ഗ്രഹങ്ങൾ", "House from janma": "ജന്മലഗ്നത്തിൽനിന്നുള്ള ഭാവം", "ALP sign": "ALP രാശി",
  "Bhukti": "ഭുക്തി", "Favourable when": "അനുകൂലമാകുമ്പോൾ", "Trying when": "ബുദ്ധിമുട്ടാകുമ്പോൾ", "Position": "സ്ഥാനം", "Verdict": "വിലയിരുത്തൽ", "Effect": "ഫലം", "Check": "പരിശോധന", "Reading": "വായന", "Nakshatra in this sign": "ഈ രാശിയിലെ നക്ഷത്രം",
};

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
for (let n = 1; n <= 12; n++) {
  LABELS[`Your ${ordinal(n)} house`] = `നിങ്ങളുടെ ${n}-ാം ഭാവം`;
  LABELS[`The ${ordinal(n)} house`] = `${n}-ാം ഭാവം`;
  LABELS[`The ${ordinal(n)} cusp`] = `${n}-ാം കസ്പ്`;
}
const PLANETS: Record<string, string> = { Sun: "സൂര്യൻ", Moon: "ചന്ദ്രൻ", Mars: "ചൊവ്വ", Mercury: "ബുധൻ", Jupiter: "വ്യാഴം", Venus: "ശുക്രൻ", Saturn: "ശനി", Rahu: "രാഹു", Ketu: "കേതു" };

export function reportMalayalamLabel(source: string): string | undefined {
  if (LABELS[source]) return LABELS[source];
  const period = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) dasa, ages (\d+) to (\d+)( \(running\))?$/.exec(source);
  if (period) return `${PLANETS[period[1]]} ദശ, ${period[2]} മുതൽ ${period[3]} വയസ്സ് വരെ${period[4] ? " (ഇപ്പോൾ നടക്കുന്നു)" : ""}`;
  return undefined;
}
