import { PLANETS } from "./astro";
import { translate } from "./localization";

/** Translate complete, known BPHS house-chapter sentences only. Unknown clauses fall back. */
export function parashariHouseChapterMalayalam(source: string, plain: boolean): string | undefined {
  const p = "(?:Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)";
  const person = plain ? "(?:The Sun|The Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)" : p;
  const h = "(?:1st|2nd|3rd|[4-9]th|1[0-2]th)";
  const mlPlanet = (name: string) => {
    const raw = name.replace(/^(?:The|the) /, "");
    if (!(PLANETS as readonly string[]).includes(raw)) return undefined;
    const ml = translate("ml", raw);
    return ml === raw ? undefined : ml;
  };
  const house = (value: string) => `${parseInt(value, 10)}-ാം`;
  let m = new RegExp(`^(${person}), ${plain ? "ruler of your 1st house" : "lord of the lagna"}, is in ${plain ? "your" : "the"} (${h}), free of malefic company\\. Parashara promises comforts of the body at all times\\.$`).exec(source);
  if (m) {
    const planet = mlPlanet(m[1]);
    return planet ? `ലഗ്നാധിപനായ ${planet} പാപഗ്രഹ കൂട്ടുകെട്ടില്ലാതെ ${house(m[2])} ഭാവത്തിലാണ്. എല്ലായ്‌പ്പോഴും ശാരീരിക സുഖസൗകര്യങ്ങൾ പരാശരൻ വാഗ്ദാനം ചെയ്യുന്നു.` : undefined;
  }
  m = new RegExp(`^(${person}), ${plain ? "ruler of your 2nd house" : "lord of the 2nd"}, is in ${plain ? "your" : "the"} (${h}), (its own house|an angle or trine)\\. Parashara says ${plain ? "the ruler of your 2nd house" : "the 2nd lord"} so placed promotes wealth\\.$`).exec(source);
  if (m && (m[3] !== "its own house" || m[2] === "2nd")) {
    const planet = mlPlanet(m[1]);
    return planet ? `രണ്ടാം ഭാവാധിപനായ ${planet} ${house(m[2])} ഭാവത്തിലാണ്; ${m[3] === "its own house" ? "അത് സ്വന്തം ഭാവമാണ്" : "അത് കേന്ദ്രമോ ത്രികോണമോ ആണ്"}. ഈ സ്ഥാനത്തുള്ള രണ്ടാം അധിപൻ ധനം വർധിപ്പിക്കുമെന്ന് പരാശരൻ പറയുന്നു.` : undefined;
  }
  m = new RegExp(`^(${person}), ${plain ? "ruler of your 2nd house" : "lord of the 2nd"}, is in ${plain ? "your" : "the"} (6th|8th|12th)\\. Parashara says financial conditions decline when ${plain ? "the ruler of your 2nd house is in your 6th, 8th or 12th" : "the 2nd lord is in the 6th, 8th or 12th"}\\.$`).exec(source);
  if (m) {
    const planet = mlPlanet(m[1]);
    return planet ? `രണ്ടാം ഭാവാധിപനായ ${planet} ${house(m[2])} ഭാവത്തിലാണ്. രണ്ടാം അധിപൻ ആറിലോ എട്ടിലോ പന്ത്രണ്ടിലോ നിൽക്കുമ്പോൾ സാമ്പത്തിക നില കുറയുമെന്ന് പരാശരൻ പറയുന്നു.` : undefined;
  }
  m = new RegExp(`^(${person}), ${plain ? "ruler of your 5th house" : "lord of the 5th"}, is (exalted|in ${plain ? "your" : "the"} (?:2nd|5th|9th)|joined by Jupiter|aspected by Jupiter)\\. Parashara says children are obtained\\.$`).exec(source);
  if (m) {
    const planet = mlPlanet(m[1]);
    const why = m[2] === "exalted" ? "ഉച്ചത്തിലാണ്" : m[2] === "joined by Jupiter" ? "വ്യാഴത്തോടു ചേർന്നിരിക്കുന്നു" : m[2] === "aspected by Jupiter" ? "വ്യാഴത്തിന്റെ ദൃഷ്ടിയിലാണ്" : `${house(m[2].split(" ").slice(-1)[0])} ഭാവത്തിലാണ്`;
    return planet ? `അഞ്ചാം ഭാവാധിപനായ ${planet} ${why}. സന്താനലാഭമുണ്ടാകുമെന്ന് പരാശരൻ പറയുന്നു.` : undefined;
  }
  m = new RegExp(`^(${person}), ${plain ? "ruler of your 7th house" : "lord of the 7th"}, is (exalted|in its own sign)\\. Parashara promises full happiness through the spouse and marriage\\.(?: (${plain ? "Parashara adds that particular exaltation of the ruler of your 7th house can also mean more than one marriage" : "18\\.6 adds that particular exaltation of the 7th lord can also mean more than one marriage"})\\.)?$`).exec(source);
  if (m && (!m[3] || m[2] === "exalted")) {
    const planet = mlPlanet(m[1]);
    return planet ? `ഏഴാം ഭാവാധിപനായ ${planet} ${m[2] === "exalted" ? "ഉച്ചത്തിലാണ്" : "സ്വക്ഷേത്രത്തിലാണ്"}. പങ്കാളിയിലൂടെയും വിവാഹത്തിലൂടെയും പൂർണ സന്തോഷം പരാശരൻ വാഗ്ദാനം ചെയ്യുന്നു.${m[3] ? ` ${plain ? "ഏഴാം അധിപന്റെ പ്രത്യേക ഉച്ചസ്ഥാനം" : "18.6 അനുസരിച്ച് ഏഴാം അധിപന്റെ പ്രത്യേക ഉച്ചസ്ഥാനം"} ഒന്നിലധികം വിവാഹങ്ങളും സൂചിപ്പിക്കാമെന്ന് പരാശരൻ കൂട്ടിച്ചേർക്കുന്നു.` : ""}` : undefined;
  }
  m = new RegExp(`^(${person}), ${plain ? "ruler of your 12th house" : "lord of the 12th"}, is in ${plain ? "your" : "the"} (${h}), an angle or trine\\. Parashara says ${plain ? "you" : "the native"} will have a spouse\\.$`).exec(source);
  if (m) {
    const planet = mlPlanet(m[1]);
    return planet ? `പന്ത്രണ്ടാം ഭാവാധിപനായ ${planet} കേന്ദ്രമോ ത്രികോണമോ ആയ ${house(m[2])} ഭാവത്തിലാണ്. ഒരു പങ്കാളി ഉണ്ടാകുമെന്ന് പരാശരൻ പറയുന്നു.` : undefined;
  }
  const prefix = plain ? "Your 3rd is " : "The 3rd is ";
  const suffix = plain ? ". Parashara says you have siblings and are courageous." : ". Parashara says the native has co-born and is courageous.";
  if (source.startsWith(prefix) && source.endsWith(suffix)) {
    const middle = source.slice(prefix.length, -suffix.length);
    const pair = /^(?:occupied by (.+?))?(?: and )?(?:aspected by (.+))?$/.exec(middle);
    const parse = (value: string | undefined) => {
      if (!value) return [];
      const names = value.replace(/ and /g, ", ").split(", ");
      const rebuilt = names.length < 2 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
      const translated = names.map(mlPlanet);
      const articlesMatch = names.every((name) => {
        const raw = name.replace(/^the /, "");
        return name === (plain && (raw === "Sun" || raw === "Moon") ? `the ${raw}` : raw);
      });
      return value === rebuilt && articlesMatch && translated.every(Boolean) ? translated as string[] : undefined;
    };
    if (!pair || (!pair[1] && !pair[2])) return undefined;
    const occupants = parse(pair[1]), aspects = parse(pair[2]);
    const rebuilt = [pair[1] ? `occupied by ${pair[1]}` : "", pair[2] ? `aspected by ${pair[2]}` : ""].filter(Boolean).join(" and ");
    if (!occupants || !aspects || middle !== rebuilt) return undefined;
    return `മൂന്നാം ഭാവത്തിൽ ${occupants.length ? `${occupants.join(", ")} സ്ഥിതിചെയ്യുന്നു` : ""}${occupants.length && aspects.length ? "; " : ""}${aspects.length ? `${aspects.join(", ")} ദൃഷ്ടി നൽകുന്നു` : ""}. സഹോദരങ്ങൾ ഉണ്ടെന്നും ധൈര്യമുണ്ടെന്നും പരാശരൻ പറയുന്നു.`;
  }
  return undefined;
}
