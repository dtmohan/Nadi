import { PLANETS, SIGNS } from "./astro";
import { translate } from "./localization";

const PLAIN: Record<string, string> = {
  "Kendra-trikona raja yoga: A ruler of one of the chart's pillars (an angle) is linked with a ruler of fortune (a trine). Parashara calls this the classic royal yoga and promises rise and recognition (34.11-12).": "കേന്ദ്രത്രികോണ രാജയോഗം: ജാതകത്തിന്റെ തൂണുകളിലൊന്നായ കേന്ദ്രത്തിന്റെ അധിപൻ ഭാഗ്യവുമായി ബന്ധപ്പെട്ട ത്രികോണത്തിന്റെ അധിപനുമായി ബന്ധപ്പെട്ടിരിക്കുന്നു. പരാശരൻ ഇതിനെ പരമ്പരാഗത രാജയോഗമെന്നു വിളിക്കുകയും ഉയർച്ചയും അംഗീകാരവും വാഗ്ദാനം ചെയ്യുകയും ചെയ്യുന്നു (34.11–12).",
  "Kendra-trikona raja yoga: A ruler of one of the chart's pillars (an angle) is linked with a ruler of fortune (a trine). Parashara calls this the classic royal yoga and promises rise and recognition (34.11-12). One of the two also rules a harder house, which he says dilutes it.": "കേന്ദ്രത്രികോണ രാജയോഗം: ജാതകത്തിന്റെ തൂണുകളിലൊന്നായ കേന്ദ്രത്തിന്റെ അധിപൻ ഭാഗ്യവുമായി ബന്ധപ്പെട്ട ത്രികോണത്തിന്റെ അധിപനുമായി ബന്ധപ്പെട്ടിരിക്കുന്നു. പരാശരൻ ഇതിനെ പരമ്പരാഗത രാജയോഗമെന്നു വിളിക്കുകയും ഉയർച്ചയും അംഗീകാരവും വാഗ്ദാനം ചെയ്യുകയും ചെയ്യുന്നു (34.11–12). ഇവരിൽ ഒരാൾ ബുദ്ധിമുട്ടു സൂചിപ്പിക്കുന്ന മറ്റൊരു ഭാവത്തിന്റെയും അധിപനാണ്; അതു യോഗത്തെ ദുർബലപ്പെടുത്തുമെന്നു പരാശരൻ പറയുന്നു.",
  "Wealth-giving periods: The rulers of the 5th and 9th, the houses of merit and fortune, are the planets Parashara names as wealth-givers; their periods are the ones to watch for gains.": "ധനം നൽകുന്ന കാലങ്ങൾ: പുണ്യത്തിന്റെയും ഭാഗ്യത്തിന്റെയും ഭാവങ്ങളായ അഞ്ചിന്റെയും ഒമ്പതിന്റെയും അധിപന്മാരെ പരാശരൻ ധനം നൽകുന്ന ഗ്രഹങ്ങളായി പറയുന്നു; നേട്ടങ്ങൾക്കായി അവയുടെ കാലങ്ങൾ ശ്രദ്ധിക്കണമെന്ന് ഈ വായന പറയുന്നു.",
  "Sankha yoga (second form): The rulers of the rising sign and the 10th sit in movable signs, with a strong 9th lord. Parashara promises wealth, spouse and children, kindness, merit, intelligence and a long life.": "ശംഖ യോഗം (രണ്ടാം രൂപം): ലഗ്നത്തിന്റെയും പത്തിന്റെയും അധിപന്മാർ ചരരാശികളിൽ നിൽക്കുകയും ഒമ്പതാം അധിപന് ബലമുണ്ടാകുകയും ചെയ്യുന്നു. ധനം, പങ്കാളി, സന്താനം, ദയ, പുണ്യം, ബുദ്ധി, ദീർഘായുസ്സ് എന്നിവ പരാശരൻ വാഗ്ദാനം ചെയ്യുന്നു.",
  "Kalpadruma yoga: The chain of rulers that starts from the ruler of the rising sign is all well placed: the 'wish-fulfilling tree'. Parashara promises wealth of every kind, high standing, devotion, strength, a competitive spirit and compassion.": "കൽപദ്രുമ യോഗം: ലഗ്നാധിപനിൽനിന്നു തുടങ്ങുന്ന അധിപന്മാരുടെ ശൃംഖലയിലെല്ലാവരും നല്ല സ്ഥാനത്താണ്: ‘ആഗ്രഹങ്ങൾ നിറവേറ്റുന്ന വൃക്ഷം’. എല്ലാതരം ധനം, ഉയർന്ന സ്ഥാനം, ഭക്തി, ശക്തി, മത്സരമനോഭാവം, കരുണ എന്നിവ പരാശരൻ വാഗ്ദാനം ചെയ്യുന്നു.",
  "Vosi yoga: A planet stands in the 12th from the Sun. Parashara promises skill, generosity, a good name, learning and strength.": "വോശി യോഗം: സൂര്യനിൽനിന്ന് പന്ത്രണ്ടാം സ്ഥാനത്ത് ഒരു ഗ്രഹമുണ്ട്. വൈദഗ്ധ്യം, ഔദാര്യം, നല്ല പേര്, പഠനം, ശക്തി എന്നിവ പരാശരൻ വാഗ്ദാനം ചെയ്യുന്നു.",
  "Amatyakaraka with the Atmakaraka's dispositor: Parashara promises sharp intelligence and the standing of a senior adviser (a minister, in his words).": "ആത്മകാരകന്റെ രാശ്യാധിപനോടൊപ്പം അമാത്യകാരകൻ: തീക്ഷ്ണബുദ്ധിയും മുതിർന്ന ഉപദേശകന്റെ സ്ഥാനവും പരാശരൻ വാഗ്ദാനം ചെയ്യുന്നു; അദ്ദേഹത്തിന്റെ പദം മന്ത്രി എന്നാണ്.",
  "Karakas in angles or trines: Parashara promises the favour and backing of people in power, and happiness from it.": "കാരകർ കേന്ദ്രങ്ങളിലോ ത്രികോണങ്ങളിലോ: അധികാരത്തിലുള്ളവരുടെ അനുകൂല്യവും പിന്തുണയും അതിൽനിന്നുള്ള സന്തോഷവും പരാശരൻ വാഗ്ദാനം ചെയ്യുന്നു.",
  "Exchange of the lagna and 10th lords: The rulers of the self and of work trade places. Parashara promises close and lasting ties with those in power.": "ലഗ്നാധിപന്റെയും പത്താം അധിപന്റെയും പരിവർത്തനം: സ്വയത്തിന്റെയും തൊഴിലിന്റെയും അധിപന്മാർ സ്ഥാനം പരസ്പരം കൈമാറുന്നു. അധികാരത്തിലുള്ളവരുമായി അടുത്തതും നിലനിൽക്കുന്നതുമായ ബന്ധം പരാശരൻ വാഗ്ദാനം ചെയ്യുന്നു.",
  "Lord of the 10th in the lagna: The ruler of work sits in the rising sign. Parashara reads that you may rise beyond your father's standing.": "പത്താം അധിപൻ ലഗ്നത്തിൽ: തൊഴിലിന്റെ അധിപൻ ലഗ്നരാശിയിലാണ്. അച്ഛന്റെ സ്ഥാനത്തിനപ്പുറം ഉയരാമെന്ന് പരാശരൻ വായിക്കുന്നു.",
};

/** Translates only complete, known generated yoga sentences; additional qualifiers fall back. */
export function parashariYogaMalayalam(source: string): string | undefined {
  if (PLAIN[source]) return PLAIN[source];
  const planetList = (value: string): string | undefined => {
    const pieces = value.replace(/ and /g, ", ").split(", ");
    if (!pieces.length || pieces.some((p) => !(PLANETS as readonly string[]).includes(p))) return undefined;
    const expected = pieces.length < 2 ? pieces.join("") : `${pieces.slice(0, -1).join(", ")} and ${pieces[pieces.length - 1]}`;
    if (value !== expected) return undefined;
    const names = pieces.map((p) => translate("ml", p));
    return names.every((v, i) => v !== pieces[i]) ? names.join(", ") : undefined;
  };
  const houses = (value: string): string | undefined => {
    const entries = value.split(" and ");
    if (!entries.length || entries.some((h) => !/^(?:1st|2nd|3rd|[4-9]th|1[0-2]th)$/.test(h))) return undefined;
    return entries.map((h) => `${parseInt(h, 10)}-ാം`).join(", ");
  };
  const kt = /^Kendra-trikona raja yoga: (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn) \(lord of the ([^)]+)\) and (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn) \(lord of the ([^)]+)\) are (conjoined|in mutual exchange|in mutual aspect)\. A relationship between an angle lord and a trine lord confers yoga\.( One of the pair also owns a 3rd, 6th, 8th, 11th or 12th, which Parashara says dilutes the yoga \(34\.14-15\)\.)?$/.exec(source);
  if (kt) {
    const first = planetList(kt[1]), second = planetList(kt[3]), a = houses(kt[2]), b = houses(kt[4]);
    if (!first || !second || !a || !b) return undefined;
    const relation = { conjoined: "ഒന്നിച്ചിരിക്കുന്നു", "in mutual exchange": "പരസ്പരം രാശിപരിവർത്തനത്തിലാണ്", "in mutual aspect": "പരസ്പര ദൃഷ്ടിയിലാണ്" }[kt[5]];
    return `കേന്ദ്രത്രികോണ രാജയോഗം: ${a} ഭാവാധിപനായ ${first}യും ${b} ഭാവാധിപനായ ${second}യും ${relation}. കേന്ദ്രാധിപനും ത്രികോണാധിപനും തമ്മിലുള്ള ബന്ധം യോഗം നൽകുന്നു.${kt[6] ? " ഈ രണ്ടിൽ ഒരു ഗ്രഹം 3, 6, 8, 11 അല്ലെങ്കിൽ 12-ാം ഭാവത്തിന്റെ അധിപൻ കൂടിയാണ്; ഇതു യോഗത്തെ ദുർബലപ്പെടുത്തുമെന്ന് പരാശരൻ പറയുന്നു (34.14–15)." : ""}`;
  }
  const wealth = /^Wealth-giving periods: (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn) \(5th lord\) and (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn) \(9th lord\) can bestow wealth(?:, as can (.+?) joined to them)?\. Their dasa periods are the ones to watch for gains, read together with their strength and functional nature \(41\.17\)\.$/.exec(source);
  if (wealth) {
    const a = planetList(wealth[1]), b = planetList(wealth[2]);
    const joined = wealth[3]?.split(", ");
    if (!a || !b || joined?.some((p) => !(PLANETS as readonly string[]).includes(p))) return undefined;
    const names = joined?.map((p) => translate("ml", p));
    if (names?.some((name, i) => name === joined![i])) return undefined;
    return `ധനം നൽകുന്ന കാലങ്ങൾ: അഞ്ചാം അധിപനായ ${a}യും ഒമ്പതാം അധിപനായ ${b}യും ധനം നൽകാൻ കഴിയുന്ന ഗ്രഹങ്ങളാണ്${names?.length ? `; അവരോടൊപ്പമുള്ള ${names.join(", ")} എന്നീ ഗ്രഹങ്ങൾക്കും അതിനു കഴിയും` : ""}. നേട്ടങ്ങൾക്കായി ഇവയുടെ ദശാകാലങ്ങൾ ശ്രദ്ധിക്കാം; അവയുടെ ബലവും ലഗ്നമനുസരിച്ചുള്ള സ്വഭാവവും ചേർത്തു വായിക്കണം (41.17).`;
  }
  const dispenser = /^Amatyakaraka with the Atmakaraka's dispositor: (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) \(Amatyakaraka\) is with (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn), dispositor of Atmakaraka (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu), in ([A-Za-z]+)\. Parashara gives great intelligence and the standing of a minister\.$/.exec(source);
  if (dispenser && (SIGNS as readonly string[]).includes(dispenser[4])) {
    const names = dispenser.slice(1).map((v) => translate("ml", v));
    if (names.some((v, i) => v === dispenser[i + 1])) return undefined;
    return `ആത്മകാരകന്റെ രാശ്യാധിപനോടൊപ്പം അമാത്യകാരകൻ: അമാത്യകാരകനായ ${names[0]} ${names[3]} രാശിയിൽ ആത്മകാരകനായ ${names[2]}ന്റെ രാശ്യാധിപൻ ${names[1]}നോടൊപ്പമാണ്. വലിയ ബുദ്ധിശക്തിയും മന്ത്രിയുടെ സ്ഥാനവും പരാശരൻ പറയുന്നു.`;
  }
  const trine = /^Amatyakaraka in a trine: (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) \(Amatyakaraka\) is in the (1st|5th|9th)\. Parashara gives a minister's office and fame, without doubt\.$/.exec(source);
  if (trine) {
    const planet = planetList(trine[1]);
    return planet ? `ത്രികോണത്തിൽ അമാത്യകാരകൻ: അമാത്യകാരകനായ ${planet} ${parseInt(trine[2], 10)}-ാം ഭാവത്തിലാണ്. മന്ത്രിസ്ഥാനവും പ്രശസ്തിയും സംശയമില്ലാതെ ലഭിക്കുമെന്ന് പരാശരൻ പറയുന്നു.` : undefined;
  }
  const karaka = /^Karakas in angles or trines: (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) \((Atmakaraka|Amatyakaraka)\) in the (1st|4th|5th|7th|9th|10th)(?: and (Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) \((Atmakaraka|Amatyakaraka)\) in the (1st|4th|5th|7th|9th|10th))?\. Parashara gives the favour and patronage of those in power, and happiness from it\.$/.exec(source);
  if (karaka) {
    const a = planetList(karaka[1]), b = karaka[4] ? planetList(karaka[4]) : undefined;
    if (!a || (karaka[4] && !b)) return undefined;
    const role = (value: string) => value === "Atmakaraka" ? "ആത്മകാരകൻ" : "അമാത്യകാരകൻ";
    return `കാരകർ കേന്ദ്രങ്ങളിലോ ത്രികോണങ്ങളിലോ: ${role(karaka[2])} ${a} ${parseInt(karaka[3], 10)}-ാം ഭാവത്തിൽ${b ? `, ${role(karaka[5])} ${b} ${parseInt(karaka[6], 10)}-ാം ഭാവത്തിൽ` : ""}. അധികാരത്തിലുള്ളവരുടെ അനുകൂല്യവും രക്ഷാകർതൃത്വവും അതിൽനിന്നുള്ള സന്തോഷവും പരാശരൻ പറയുന്നു.`;
  }
  const lunar = /^(Sunapha yoga|Anapha yoga): (.+?) in the (2nd|12th) from the Moon\. (Parashara gives kingly standing or its equal, intelligence, fame and self-earned wealth\.|Parashara gives kingly standing, freedom from disease, virtue, fame, charm and happiness\.)$/.exec(source);
  if (lunar) {
    const planets = planetList(lunar[2]);
    if (!planets) return undefined;
    if (lunar[1] === "Sunapha yoga" && lunar[3] === "2nd" && lunar[4] === "Parashara gives kingly standing or its equal, intelligence, fame and self-earned wealth.")
      return `സുനഫ യോഗം: ചന്ദ്രനിൽനിന്ന് രണ്ടാം സ്ഥാനത്ത് ${planets}. രാജാവിന്റെയോ തുല്യമായതോ ആയ സ്ഥാനം, ബുദ്ധി, പ്രശസ്തി, സ്വപ്രയത്നത്താൽ നേടിയ ധനം എന്നിവ പരാശരൻ പറയുന്നു.`;
    if (lunar[1] === "Anapha yoga" && lunar[3] === "12th" && lunar[4] === "Parashara gives kingly standing, freedom from disease, virtue, fame, charm and happiness.")
      return `അനഫ യോഗം: ചന്ദ്രനിൽനിന്ന് പന്ത്രണ്ടാം സ്ഥാനത്ത് ${planets}. രാജകീയ സ്ഥാനം, രോഗമില്ലായ്മ, സദ്ഗുണം, പ്രശസ്തി, ആകർഷണീയത, സന്തോഷം എന്നിവ പരാശരൻ പറയുന്നു.`;
    return undefined;
  }
  const solar = /^(Vesi yoga|Vosi yoga): (.+?) in the (2nd|12th) from the Sun\. (Parashara gives even sight, truthfulness, a tall frame, indolence, happiness and modest wealth\.|Parashara gives skill, charity, fame, learning and strength\.)( Formed by malefics, so 38\.4 gives the contrary effects\.| Formed by a mix of benefics and malefics; 38\.4 gives the stated effects for the benefics and their contrary for the malefics\.)?$/.exec(source);
  if (solar) {
    const planets = planetList(solar[2]);
    if (!planets) return undefined;
    const qualification = !solar[5] ? "" : solar[5].startsWith(" Formed by malefics,")
      ? " പാപഗ്രഹങ്ങൾ രൂപപ്പെടുത്തുന്നതിനാൽ 38.4 വിപരീതഫലങ്ങൾ പറയുന്നു."
      : " ശുഭഗ്രഹങ്ങളും പാപഗ്രഹങ്ങളും ചേർന്നാണ് രൂപം; 38.4 ശുഭഗ്രഹങ്ങൾക്ക് പറഞ്ഞ ഫലങ്ങളും പാപഗ്രഹങ്ങൾക്ക് അവയുടെ വിപരീതവും നൽകുന്നു.";
    if (solar[1] === "Vesi yoga" && solar[3] === "2nd" && solar[4] === "Parashara gives even sight, truthfulness, a tall frame, indolence, happiness and modest wealth.")
      return `വേശി യോഗം: സൂര്യനിൽനിന്ന് രണ്ടാം സ്ഥാനത്ത് ${planets}. സമമായ കാഴ്ച, സത്യസന്ധത, ഉയരമുള്ള ശരീരം, അലസത, സന്തോഷം, മിതമായ ധനം എന്നിവ പരാശരൻ പറയുന്നു.${qualification}`;
    if (solar[1] === "Vosi yoga" && solar[3] === "12th" && solar[4] === "Parashara gives skill, charity, fame, learning and strength.")
      return `വോശി യോഗം: സൂര്യനിൽനിന്ന് പന്ത്രണ്ടാം സ്ഥാനത്ത് ${planets}. വൈദഗ്ധ്യം, ദാനശീലം, പ്രശസ്തി, പഠനം, ശക്തി എന്നിവ പരാശരൻ പറയുന്നു.${qualification}`;
  }
  return undefined;
}
