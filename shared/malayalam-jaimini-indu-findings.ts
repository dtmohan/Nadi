/** Closed translations of complete Indu Lagna findings; changed source text remains English. */
const planets: Record<string, string> = { Sun: "സൂര്യൻ", Moon: "ചന്ദ്രൻ", Mars: "ചൊവ്വ", Mercury: "ബുധൻ", Jupiter: "വ്യാഴം", Venus: "ശുക്രൻ", Saturn: "ശനി", Rahu: "രാഹു", Ketu: "കേതു" };
const signs: Record<string, string> = { Aries: "മേടം", Taurus: "ഇടവം", Gemini: "മിഥുനം", Cancer: "കർക്കടകം", Leo: "ചിങ്ങം", Virgo: "കന്നി", Libra: "തുലാം", Scorpio: "വൃശ്ചികം", Sagittarius: "ധനു", Capricorn: "മകരം", Aquarius: "കുംഭം", Pisces: "മീനം" };
const dignity: Record<string, string> = { exalted: "ഉച്ചം", debilitated: "നീചം", friendly: "മിത്രരാശി", inimical: "ശത്രുരാശി", neutral: "സമരാശി", "own sign": "സ്വന്തം രാശി", moolatrikona: "മൂലത്രികോണം" };
const join = (xs: string[]) => xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
function planetList(s: string): string | undefined {
  const xs = s.replace(/ and /g, ", ").split(", ");
  return xs.every((x) => planets[x]) && join(xs) === s ? xs.map((x) => planets[x]).join(", ") : undefined;
}
function house(s: string): number | undefined {
  const n = Number.parseInt(s, 10), suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return n >= 1 && n <= 12 && s === `${n}${suffix}` ? n : undefined;
}
/** Report appends only available dasha dates; preserve them and reject any unknown suffix. */
function timingSuffix(s: string): string | undefined {
  if (!s) return "";
  if (s === " .") return " .";
  if (!s.startsWith(" ") || !s.endsWith(".")) return undefined;
  const text = s.slice(1, -1), entries = text.replace(/ and /g, ", ").split(", ");
  if (join(entries) !== text) return undefined;
  const translated = entries.map((e) => {
    const m = /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) (\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}) to (\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4})$/.exec(e);
    return m ? `${planets[m[1]]} ${m[2]} മുതൽ ${m[3]} വരെ` : undefined;
  });
  return translated.every(Boolean) ? ` ${translated.join(", ")}.` : undefined;
}
export function jaiminiInduFindingMalayalam(source: string): string | undefined {
  let m = /^The Indu Lagna \((\w+)\) stands empty\. The verse fixes its scale only for occupied signs, so its own tiers are silent here — the lagna is then read through its lord, below, the way any empty bhava is\.$/.exec(source);
  if (m) return signs[m[1]] ? `ഇന്ദുലഗ്നമായ ${signs[m[1]]} രാശിയിൽ ഗ്രഹങ്ങളില്ല. ഗ്രഹങ്ങൾ സ്ഥിതിചെയ്യുന്ന രാശികൾക്ക് മാത്രമാണ് ശ്ലോകം തോത് നിർണയിക്കുന്നത്; അതിനാൽ ആ നിലകൾ ഇവിടെ ബാധകമല്ല. മറ്റു ശൂന്യഭാവങ്ങളെപ്പോലെ ഇന്ദുലഗ്നത്തെയും അതിന്റെ അധിപനിലൂടെ താഴെ വിലയിരുത്തുന്നു.` : undefined;
  m = /^The Indu Lagna's own lord (\w+) stands in the (\d+(?:st|nd|rd|th)) from it, in (\w+)(?: \(([^)]+)\))?(?:, with (.+?)|, alone)(, and aspects the Indu Lagna)?\.$/.exec(source);
  if (m) {
    const p = planets[m[1]], h = house(m[2]), sign = signs[m[3]], d = m[4] ? dignity[m[4]] : "", others = m[5] ? planetList(m[5]) : "";
    return p && h && sign && d !== undefined && others !== undefined ? `ഇന്ദുലഗ്നാധിപനായ ${p} ഇന്ദുലഗ്നത്തിൽനിന്ന് ${h}-ാം ഭാവത്തിലെ ${sign} രാശിയിലാണ്${d ? ` (${d})` : ""}${others ? `; ${others} കൂടെയുണ്ട്` : "; മറ്റു ഗ്രഹങ്ങളില്ല"}${m[6] ? "; ഇന്ദുലഗ്നത്തെ ദൃഷ്ടിക്കുകയും ചെയ്യുന്നു" : ""}.` : undefined;
  }
  m = /^(\w+), lord of the Indu Lagna, stands in the (\d+(?:st|nd|rd|th)) from it(, one of IV\.11's houses)?(?:, in a (friendly|exalted|own sign|moolatrikona) sign)?, joined by benefics(?: \(([^)]+)\))?( and aspected by a benefic)?: Uttara Kalamrita IV\.11's prosperity clause for a bhava lord, read here against the Indu Lagna \(an extension; provisional\)\.$/.exec(source);
  if (m) {
    const p = planets[m[1]], h = house(m[2]), d = m[4] ? dignity[m[4]] : "", others = m[5] ? planetList(m[5]) : "";
    if (!p || !h || d === undefined || others === undefined || (m[5] && m[6])) return undefined;
    return `ഇന്ദുലഗ്നാധിപനായ ${p} അതിൽനിന്ന് ${h}-ാം ഭാവത്തിൽ നിൽക്കുന്നു${m[3] ? "; ഇത് IV.11-ൽ പറയുന്ന ഭാവങ്ങളിലൊന്നാണ്" : ""}${d ? `; ${d}യിലാണ്` : ""}; ശുഭഗ്രഹങ്ങൾ ഒപ്പമുണ്ട്${others ? ` (${others})` : ""}${m[6] ? "; ഒരു ശുഭഗ്രഹത്തിന്റെ ദൃഷ്ടിയുമുണ്ട്" : ""}. ഉത്തരകാലാമൃതം IV.11-ലെ ഭാവാധിപന്റെ അഭിവൃദ്ധി വ്യവസ്ഥ ഇന്ദുലഗ്നത്തിന് ഇവിടെ പ്രയോഗിക്കുന്നു (വിപുലീകരണം; താൽക്കാലിക നിഗമനം).`;
  }
  m = /^The 11th from the Indu Lagna is occupied or aspected by (.+): wealth promise, (by fair and unfair means both|by fair means|through an unfair medium)\.$/.exec(source);
  if (m) { const ps = planetList(m[1]), how: Record<string, string> = { "by fair and unfair means both": "ന്യായവും അന്യായവുമായ മാർഗങ്ങളിലൂടെ", "by fair means": "ന്യായമായ മാർഗങ്ങളിലൂടെ", "through an unfair medium": "അന്യായമായ മാർഗത്തിലൂടെ" }; return ps ? `ഇന്ദുലഗ്നത്തിൽനിന്ന് പതിനൊന്നാം ഭാവത്തിൽ ${ps} നിൽക്കുകയോ അതിനെ ദൃഷ്ടിക്കുകയോ ചെയ്യുന്നു: ${how[m[2]]} ധനസാധ്യത.` : undefined; }
  m = /^(.+) in the (2nd or 4th|5th, 9th or 11th) from the Indu Lagna: the book's (line|second line) for becoming wealthy\.$/.exec(source);
  if (m) { const ps = planetList(m[1]); if (!ps || (m[2] === "2nd or 4th") !== (m[3] === "line")) return undefined; return `ഇന്ദുലഗ്നത്തിൽനിന്ന് ${m[2] === "2nd or 4th" ? "രണ്ടിലോ നാലിലോ" : "അഞ്ചിലോ ഒമ്പതിലോ പതിനൊന്നിലോ"} ${ps}: ധനവാനാകുന്നതിനെക്കുറിച്ചുള്ള പുസ്തകത്തിലെ ${m[3] === "second line" ? "രണ്ടാമത്തെ " : ""}വരിയാണ് ഇത്.`; }
  m = /^Benefic (.+?) in (the Indu Lagna: the dasha period of (this planet|these planets) gives good results|trine \(the 5th or 9th\) from the Indu Lagna: its dasha period is beneficial|a Kendra \(the 4th, 7th or 10th\) from the Indu Lagna: its dasha period is beneficial)\.(.*)$/.exec(source);
  if (m) {
    const ps = planetList(m[1]), suffix = timingSuffix(m[4]);
    if (!ps || suffix === undefined || (m[3] && (m[3] === "this planet") !== !m[1].includes(" and "))) return undefined;
    const place = m[2].startsWith("the Indu") ? "ഇന്ദുലഗ്നത്തിൽ" : m[2].startsWith("trine") ? "ഇന്ദുലഗ്നത്തിൽനിന്നുള്ള ത്രികോണത്തിൽ (അഞ്ചിലോ ഒമ്പതിലോ)" : "ഇന്ദുലഗ്നത്തിൽനിന്നുള്ള കേന്ദ്രത്തിൽ (നാലിലോ ഏഴിലോ പത്തിലോ)";
    return `${place} ശുഭഗ്രഹമായ ${ps}: ${m[3] === "these planets" ? "ഈ ഗ്രഹങ്ങളുടെ" : "അതിന്റെ"} ദശാകാലം അനുകൂല ഫലം നൽകുന്നു.${suffix}`;
  }
  return undefined;
}
