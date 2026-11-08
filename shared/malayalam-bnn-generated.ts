/** Closed, exact-English templates for the entered BNN sign-lord and star-lord catalogues. */
const planets: Record<string, [string, string]> = {
  Sun: ["സൂര്യൻ", "സൂര്യന്റെ"], Moon: ["ചന്ദ്രൻ", "ചന്ദ്രന്റെ"], Mars: ["ചൊവ്വ", "ചൊവ്വയുടെ"],
  Mercury: ["ബുധൻ", "ബുധന്റെ"], Jupiter: ["വ്യാഴം", "വ്യാഴത്തിന്റെ"], Venus: ["ശുക്രൻ", "ശുക്രന്റെ"],
  Saturn: ["ശനി", "ശനിയുടെ"], Rahu: ["രാഹു", "രാഹുവിന്റെ"], Ketu: ["കേതു", "കേതുവിന്റെ"],
};
// English snapshots prevent a changed significator list from silently using a stale translation.
const significations: Record<string, [string, string]> = {
  Sun: ["father, authority, government", "അച്ഛൻ, അധികാരം, സർക്കാർ"],
  Moon: ["mother, mind, public", "അമ്മ, മനസ്സ്, പൊതുജനം"],
  Mars: ["siblings, land & property, courage", "സഹോദരങ്ങൾ, ഭൂമിയും സ്വത്തും, ധൈര്യം"],
  Mercury: ["education, speech, commerce", "വിദ്യാഭ്യാസം, സംസാരം, വാണിജ്യം"],
  Jupiter: ["the native, children, wisdom", "വ്യക്തി, സന്താനം, ജ്ഞാനം"],
  Venus: ["spouse, romance, arts", "ജീവിതപങ്കാളി, പ്രണയം, കലകൾ"],
  Saturn: ["profession, livelihood, labour", "തൊഴിൽ, ഉപജീവനം, അധ്വാനം"],
};
const standardStars: Record<string, [string, string]> = {
  Sun: ["authority, government and the father's line", "അധികാരം, സർക്കാർ, പിതൃപരമ്പര"],
  Moon: ["the public, mobility and the mother's line", "പൊതുജനം, സഞ്ചാരം, മാതൃപരമ്പര"],
  Mars: ["technical force, land and siblings", "സാങ്കേതികശക്തി, ഭൂമി, സഹോദരങ്ങൾ"],
  Mercury: ["learning, trade and communication", "പഠനം, വ്യാപാരം, ആശയവിനിമയം"],
  Jupiter: ["wisdom, teaching and children", "ജ്ഞാനം, അധ്യാപനം, സന്താനം"],
  Venus: ["wealth, art and partnership", "ധനം, കല, പങ്കാളിത്തം"],
  Saturn: ["labour, duty and long service", "അധ്വാനം, കടമ, ദീർഘകാല സേവനം"],
  Rahu: ["foreign lands, technology and the unconventional", "വിദേശസ്ഥലങ്ങൾ, സാങ്കേതികവിദ്യ, പാരമ്പര്യേതരമായ കാര്യങ്ങൾ"],
  Ketu: ["research, healing and detachment", "ഗവേഷണം, ചികിത്സ, വിരക്തി"],
};
const femaleStars: Record<string, [string, string]> = {
  ...standardStars,
  Moon: ["the public, care and movement", "പൊതുജനം, പരിചരണം, സഞ്ചാരം"],
  Mars: ["technical force, land and courage", "സാങ്കേതികശക്തി, ഭൂമി, ധൈര്യം"],
  Mercury: ["learning, trade and speech", "പഠനം, വ്യാപാരം, സംസാരം"],
  Jupiter: ["wisdom, teaching and law", "ജ്ഞാനം, അധ്യാപനം, നിയമം"],
  Venus: ["comfort, art and finance", "സുഖം, കല, ധനകാര്യം"],
  Saturn: ["labour, service and endurance", "അധ്വാനം, സേവനം, സഹിഷ്ണുത"],
};

const entries: Array<[string, string]> = [];
const signSubjects = [
  ["Saturn", "Livelihood takes the colour of", "ഉപജീവനം"],
  ["Jupiter", "The native's nature takes the colour of", "വ്യക്തിയുടെ സ്വഭാവം"],
  ["Venus", "The spouse takes the colour of", "ജീവിതപങ്കാളി"],
  ["Venus", "The native's nature takes the colour of", "വ്യക്തിയുടെ സ്വഭാവം"],
  ["Mars", "The husband takes the colour of", "ഭർത്താവ്"],
] as const;
for (const [subject, prefix, what] of signSubjects) {
  for (const [lord, [en, ml]] of Object.entries(significations)) {
    if (subject === lord) continue;
    const meanings: Array<[string, string]> = lord === "Jupiter" && (subject === "Mars" || subject === "Venus" && prefix === "The native's nature takes the colour of")
      ? [["wisdom, children, wealth", "ജ്ഞാനം, സന്താനം, ധനം"]] : [[en, ml]];
    for (const [source, target] of meanings) entries.push([
      `${subject} sits in a sign owned by ${lord}: ${prefix} ${lord}'s significations (${source}).`,
      `${planets[subject][0]} ${planets[lord][1]} രാശിയിൽ നിൽക്കുന്നു: ${what} ${planets[lord][1]} കാരകത്വങ്ങളുടെ സ്വഭാവം ഉൾക്കൊള്ളുന്നു (${target}).`,
    ]);
  }
}
const starSubjects: Array<[string, string, string, Record<string, [string, string]>]> = [
  ["Jupiter", "The native's inner nature", "വ്യക്തിയുടെ ആന്തരിക സ്വഭാവം", standardStars],
  ["Saturn", "The texture of the profession", "തൊഴിലിന്റെ സ്വഭാവം", standardStars],
  ["Venus", "The spouse's character", "ജീവിതപങ്കാളിയുടെ സ്വഭാവം", standardStars],
  ["Venus", "The native's inner nature", "വ്യക്തിയുടെ ആന്തരിക സ്വഭാവം", femaleStars],
  ["Mars", "The husband's character", "ഭർത്താവിന്റെ സ്വഭാവം", femaleStars],
];
for (const [subject, what, whatMl, stars] of starSubjects) for (const [lord, [en, ml]] of Object.entries(stars)) entries.push([
  `${subject} in a nakshatra of ${lord}: ${what} is shaded by ${en}.`,
  `${planets[subject][0]} ${planets[lord][1]} നക്ഷത്രത്തിൽ: ${whatMl} ${ml} എന്നിവയുടെ സ്വഭാവം ഉൾക്കൊള്ളുന്നു.`,
]);
for (const [lord, [en, ml]] of Object.entries(significations)) {
  entries.push([`Rahu in a sign of ${lord}: foreign or unconventional matters express through ${en}.`,
    `രാഹു ${planets[lord][1]} രാശിയിൽ: വിദേശമോ പാരമ്പര്യേതരമോ ആയ കാര്യങ്ങൾ ${ml} എന്നിവയിലൂടെ പ്രകടമാകുന്നു.`]);
  entries.push([`Ketu in a sign of ${lord}: detachment and past-life skill touch ${en}.`,
    `കേതു ${planets[lord][1]} രാശിയിൽ: വിരക്തിയും മുൻജന്മത്തിലെ കഴിവും ${ml} എന്നിവയെ സ്പർശിക്കുന്നു.`]);
}

export const MALAYALAM_BNN_GENERATED: Record<string, string> = Object.fromEntries(entries);
