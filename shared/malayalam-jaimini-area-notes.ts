/** Closed-pattern translations of the Jaimini area's generated natal notes. */
const PLANET: Record<string, string> = { Sun: "സൂര്യൻ", Moon: "ചന്ദ്രൻ", Mars: "ചൊവ്വ", Mercury: "ബുധൻ", Jupiter: "വ്യാഴം", Venus: "ശുക്രൻ", Saturn: "ശനി", Rahu: "രാഹു", Ketu: "കേതു" };
const SIGN: Record<string, string> = { Aries: "മേടം", Taurus: "ഇടവം", Gemini: "മിഥുനം", Cancer: "കർക്കടകം", Leo: "ചിങ്ങം", Virgo: "കന്നി", Libra: "തുലാം", Scorpio: "വൃശ്ചികം", Sagittarius: "ധനു", Capricorn: "മകരം", Aquarius: "കുംഭം", Pisces: "മീനം" };
const DIGNITY: Record<string, string> = { "exalted by sign": "ഉച്ചരാശിയിൽ", "in its moolatrikona sign": "മൂലത്രികോണരാശിയിൽ", "in its own sign": "സ്വന്തം രാശിയിൽ", "in a friendly sign": "മിത്രരാശിയിൽ", "debilitated by sign": "നീചരാശിയിൽ", "in an inimical sign": "ശത്രുരാശിയിൽ" };
const MATTERS: Record<string, string> = {
  "the self, its purpose and standing": "സ്വയം, ജീവിതലക്ഷ്യം, സ്ഥാനം",
  "work, position, advisers and one's role in the world": "ജോലി, പദവി, ഉപദേശകർ, സമൂഹത്തിലെ പങ്ക്",
  "siblings, the guru and one's own initiative": "സഹോദരങ്ങൾ, ഗുരു, സ്വന്തം മുൻകൈ",
  "mother, home, property and inner comfort": "അമ്മ, വീട്, സ്വത്ത്, മനസ്സുഖം",
  "father, lineage, dharma and protection": "അച്ഛൻ, പാരമ്പര്യം, ധർമം, സംരക്ഷണം",
  "children, students, creativity and merit": "സന്താനം, വിദ്യാർഥികൾ, സർഗാത്മകത, പുണ്യം",
  "relatives, rivals, disputes and illness": "ബന്ധുക്കൾ, എതിരാളികൾ, തർക്കങ്ങൾ, രോഗം",
  "the spouse, partnerships and close alliances": "പങ്കാളി, പങ്കാളിത്തം, അടുത്ത ബന്ധങ്ങൾ",
};
const pList = (source: string): string | undefined => {
  const words = source.replace(/ and /g, ", ").split(", ");
  if (!words.length || words.some((p) => !PLANET[p])) return undefined;
  const expected = words.length === 1 ? words[0] : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
  return expected === source ? words.map((p) => PLANET[p]).join(", ") : undefined;
};

export function jaiminiAreaNoteMalayalam(source: string): string | undefined {
  let m = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) is (exalted by sign|in its moolatrikona sign|in its own sign|in a friendly sign|debilitated by sign|in an inimical sign) in (Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces): (a supportive sign-level clue to weigh with the rest of the chart|a sign-level clue of possible effort or delay)\.$/.exec(source);
  if (m) return `${PLANET[m[1]]} ${SIGN[m[3]]} രാശിയിൽ ${DIGNITY[m[2]]} ആണ്: ${m[4].startsWith("a supportive") ? "ജാതകത്തിന്റെ ബാക്കി ഭാഗങ്ങളോടൊപ്പം തൂക്കിനോക്കേണ്ട അനുകൂല രാശിതല സൂചന" : "ശ്രമമോ കാലതാമസമോ ഉണ്ടാകാമെന്ന രാശിതല സൂചന"}.`;
  m = /^In the navamsa (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) is (exalted by sign|in its moolatrikona sign|in its own sign|in a friendly sign|debilitated by sign|in an inimical sign) in (Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces); (this sign-level strength may mitigate the rasi placement, alongside other factors|consider this sign-level strain alongside the rasi support)\.$/.exec(source);
  if (m) return `നവാംശത്തിൽ ${PLANET[m[1]]} ${SIGN[m[3]]} രാശിയിൽ ${DIGNITY[m[2]]} ആണ്; ${m[4].startsWith("this sign-level") ? "മറ്റു ഘടകങ്ങളോടൊപ്പം ഈ രാശിതല ബലം ജനനരാശിയിലെ സ്ഥാനം ലഘൂകരിച്ചേക്കാം" : "ജനനരാശിയിലെ പിന്തുണയോടൊപ്പം ഈ രാശിതല സമ്മർദവും പരിഗണിക്കുക"}.`;
  m = /^Joined by (.+): benefic company increases what the karaka promises\.$/.exec(source);
  if (m) { const planets = pList(m[1]); return planets ? `${planets} കൂടെയുണ്ട്: ശുഭഗ്രഹസഹവാസം കാരകന്റെ വാഗ്ദാനം വർധിപ്പിക്കുന്നു.` : undefined; }
  m = /^Joined by (.+): the karaka is afflicted, so (.+) meet resistance\.$/.exec(source);
  if (m) { const planets = pList(m[1]), matters = MATTERS[m[2]]; return planets && matters ? `${planets} കൂടെയുണ്ട്: കാരകന് പീഡയുള്ളതിനാൽ ${matters} എന്നീ വിഷയങ്ങളിൽ പ്രതിരോധം നേരിടുന്നു.` : undefined; }
  m = /^Aspected by (.+) \(rasi drishti\): (support|pressure) from outside its own sign\.$/.exec(source);
  if (m) { const planets = pList(m[1]); return planets ? `${planets} ദൃഷ്ടിക്കുന്നു (രാശിദൃഷ്ടി): സ്വന്തം രാശിക്കു പുറത്തുനിന്ന് ${m[2] === "support" ? "പിന്തുണ" : "സമ്മർദം"}.` : undefined; }
  m = /^Aspected by (.+): (benefic rasi drishti supports it|malefic rasi drishti weighs on it)\.$/.exec(source);
  if (m) { const planets = pList(m[1]); return planets ? `${planets} ദൃഷ്ടിക്കുന്നു: ${m[2].startsWith("benefic") ? "ശുഭ രാശിദൃഷ്ടി പിന്തുണ നൽകുന്നു" : "പാപ രാശിദൃഷ്ടി സമ്മർദം നൽകുന്നു"}.` : undefined; }
  m = /^Unobstructed argala from (.+): (benefic intervention keeps the area moving|malefic intervention presses on it)\.$/.exec(source);
  if (m) { const planets = pList(m[1]); return planets ? `${planets} നൽകുന്ന തടസ്സമില്ലാത്ത അർഗള: ${m[2].startsWith("benefic") ? "ശുഭ ഇടപെടൽ ഈ വിഷയത്തെ മുന്നോട്ടു നീക്കുന്നു" : "പാപ ഇടപെടൽ ഈ വിഷയത്തിൽ സമ്മർദം ചെലുത്തുന്നു"}.` : undefined; }
  m = /^(AL|A[2-9]|A10|A11|UL) in (Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces) holds (.+): (the area shows well to the world|the outer face of the area is harder or contested)\.$/.exec(source);
  if (m) { const planets = pList(m[3]); return planets ? `${SIGN[m[2]]} രാശിയിലുള്ള ${m[1]}-ൽ ${planets} ഉണ്ട്: ${m[4].startsWith("the area") ? "വിഷയം ലോകത്തിന് അനുകൂലമായി പ്രകടമാകുന്നു" : "വിഷയത്തിന്റെ ബാഹ്യരൂപം കൂടുതൽ പ്രയാസമുള്ളതോ വിവാദമുള്ളതോ ആണ്"}.` : undefined; }
  m = /^(AL|A[2-9]|A10|A11|UL) in (Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces) is empty; read it from its lord (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) in (Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces) and from the planets aspecting it\.$/.exec(source);
  if (m) return `${SIGN[m[2]]} രാശിയിലുള്ള ${m[1]}-ൽ ഗ്രഹങ്ങളില്ല; ${SIGN[m[4]]} രാശിയിലെ അതിന്റെ അധിപനായ ${PLANET[m[3]]}-നെയും അതിനെ ദൃഷ്ടിക്കുന്ന ഗ്രഹങ്ങളെയും അടിസ്ഥാനമാക്കി വായിക്കുക.`;
  return undefined;
}
