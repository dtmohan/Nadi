import type { ChildrenReading } from "./children";
import { translate } from "./localization";
import { list } from "./report/types";

/** Translate only complete, recognised sentences after the caller's life-stage gate. */
export function bnnChildrenNotesMalayalam(c: ChildrenReading, source: string): string | undefined {
  if (!c.notes.length || source !== c.notes.join(" ").trim()) return undefined;
  const sign = translate("ml", c.fifthSign);
  const names = [...c.inFifth, ...c.aspectingFifth, ...c.takenOver.flatMap((x) => [x.planet, x.by])];
  if (sign === c.fifthSign || names.some((p) => translate("ml", p) === p)) return undefined;
  const planets = (ps: typeof c.inFifth) => ps.map((p) => translate("ml", p)).join(", ");
  const known = new Map<string, string>();
  if (c.inFifth.length) {
    const en = `${list(c.inFifth)} in ${c.fifthSign}, the 5th from Jupiter${c.aspectingFifth.length ? `, with ${list(c.aspectingFifth)} aspecting it` : ""}. Some traditional readings count these placements, but they cannot determine the number or sex of children.`;
    known.set(en, `വ്യാഴത്തിൽനിന്നുള്ള അഞ്ചാം രാശിയായ ${sign} രാശിയിൽ ${planets(c.inFifth)} സ്ഥിതിചെയ്യുന്നു${c.aspectingFifth.length ? `; ${planets(c.aspectingFifth)} അതിനെ ദൃഷ്ടി ചെയ്യുന്നു` : ""}. ചില പരമ്പരാഗത വായനകൾ ഈ സ്ഥാനങ്ങൾ എണ്ണുന്നു, എന്നാൽ ഇവയ്ക്ക് കുട്ടികളുടെ എണ്ണമോ ലിംഗമോ നിർണയിക്കാനാവില്ല.`);
  } else if (c.aspectingFifth.length) {
    known.set(`The 5th from Jupiter (${c.fifthSign}) is empty, but ${list(c.aspectingFifth)} aspect it. These placements do not determine the number or sex of children.`, `വ്യാഴത്തിൽനിന്നുള്ള അഞ്ചാം രാശിയായ ${sign} രാശിയിൽ ഗ്രഹങ്ങളില്ല, പക്ഷേ ${planets(c.aspectingFifth)} അതിനെ ദൃഷ്ടി ചെയ്യുന്നു. ഈ സ്ഥാനങ്ങൾ കുട്ടികളുടെ എണ്ണമോ ലിംഗമോ നിർണയിക്കുന്നില്ല.`);
  } else {
    known.set(`The 5th from Jupiter (${c.fifthSign}) is empty and unaspected in this sign-based calculation; no conclusion about children follows.`, `രാശി അടിസ്ഥാനമാക്കിയ ഈ കണക്കിൽ വ്യാഴത്തിൽനിന്നുള്ള അഞ്ചാം രാശിയായ ${sign} രാശിയിൽ ഗ്രഹങ്ങളോ ദൃഷ്ടികളോ ഇല്ല; ഇതിൽനിന്ന് സന്താനത്തെക്കുറിച്ച് ഒരു നിഗമനവും വരുന്നില്ല.`);
  }
  known.set(`${c.fifthSign}, the 5th from Jupiter, is a watery sign. The traditional classification cannot assess fertility or pregnancy.`, `വ്യാഴത്തിൽനിന്നുള്ള അഞ്ചാം രാശിയായ ${sign} ഒരു ജലരാശിയാണ്. ഈ പരമ്പരാഗത വർഗീകരണത്തിന് പ്രത്യുത്പാദനശേഷിയോ ഗർഭധാരണമോ വിലയിരുത്താനാവില്ല.`);
  if (c.takenOver.length) {
    const en = list(c.takenOver.map((t) => `${t.planet} (linked to ${t.by} at ${t.via === "degree" ? "the same degree" : "its star"})`));
    const ml = c.takenOver.map((t) => `${translate("ml", t.planet)} (${translate("ml", t.by)}യുമായി ${t.via === "degree" ? "ഒരേ അംശത്തിൽ" : "അതിന്റെ നക്ഷത്രത്തിൽ"} ബന്ധപ്പെട്ടിരിക്കുന്നു)`).join(", ");
    known.set(`${en}. The star extension is provisional; these links cannot establish timing or a route to parenthood.`, `${ml}. നക്ഷത്രത്തിലേക്കുള്ള വിപുലീകരണം താൽക്കാലികമാണ്; ഈ ബന്ധങ്ങൾക്ക് സമയമോ മാതാപിതൃത്വത്തിലേക്കുള്ള വഴിയോ നിർണയിക്കാനാവില്ല.`);
  }
  const fixed: Record<string, string> = {
    "Rahu is linked to the Sun by the traditional node rule; the calculation cannot determine a child's sex.": "പരമ്പരാഗത രാഹുകേതു നിയമപ്രകാരം രാഹു സൂര്യനുമായി ബന്ധപ്പെട്ടിരിക്കുന്നു; ഈ കണക്കിന് കുട്ടിയുടെ ലിംഗം നിർണയിക്കാനാവില്ല.",
    "Ketu with or in trine to Venus: a traditional family-related link, not evidence of a difficulty.": "കേതു ശുക്രനോടൊപ്പമോ ത്രികോണത്തിലോ: കുടുംബവുമായി ബന്ധപ്പെട്ട പരമ്പരാഗത ബന്ധമാണിത്; ബുദ്ധിമുട്ടിന്റെ തെളിവല്ല.",
    "Saturn with or in trine to Venus: some Nadi readers consider Saturn a timing factor; it does not establish a delay.": "ശനി ശുക്രനോടൊപ്പമോ ത്രികോണത്തിലോ: ചില നാഡി വായനക്കാർ ശനിയെ സമയവുമായി ബന്ധപ്പെട്ട ഘടകമായി കാണുന്നു; അത് താമസം സ്ഥാപിക്കുന്നില്ല.",
    "Rahu with or in trine to the Sun: a traditional link that cannot determine a child's sex or health.": "രാഹു സൂര്യനോടൊപ്പമോ ത്രികോണത്തിലോ: കുട്ടിയുടെ ലിംഗമോ ആരോഗ്യമോ നിർണയിക്കാനാവാത്ത ഒരു പരമ്പരാഗത ബന്ധം.",
    "Jupiter is linked to the Sun, and the node rule also links Rahu to the Sun; it cannot determine a child's sex.": "വ്യാഴം സൂര്യനുമായി ബന്ധപ്പെട്ടിരിക്കുന്നു; രാഹുകേതു നിയമം രാഹുവിനെയും സൂര്യനുമായി ബന്ധിപ്പിക്കുന്നു. ഇതിന് കുട്ടിയുടെ ലിംഗം നിർണയിക്കാനാവില്ല.",
    "Jupiter with or in trine to the Sun: a traditional children-related link; it cannot determine a child's sex.": "വ്യാഴം സൂര്യനോടൊപ്പമോ ത്രികോണത്തിലോ: സന്താനവുമായി ബന്ധപ്പെട്ട പരമ്പരാഗത ബന്ധം; കുട്ടിയുടെ ലിംഗം നിർണയിക്കാനാവില്ല.",
    "Sun, Mars and Jupiter are linked by sign; traditional counts from this combination cannot determine the number or sex of children.": "സൂര്യനും ചൊവ്വയും വ്യാഴവും രാശിയിലൂടെ ബന്ധപ്പെട്ടിരിക്കുന്നു; ഈ കൂട്ടുകെട്ടിൽനിന്നുള്ള പരമ്പരാഗത എണ്ണങ്ങൾക്ക് കുട്ടികളുടെ എണ്ണമോ ലിംഗമോ നിർണയിക്കാനാവില്ല.",
    "Moon with or in trine to Jupiter: a traditional association of children and care, not an assessment of conception.": "ചന്ദ്രൻ വ്യാഴത്തോടൊപ്പമോ ത്രികോണത്തിലോ: സന്താനവും പരിചരണവുമായി ബന്ധപ്പെട്ട പരമ്പരാഗത സൂചന; ഗർഭധാരണത്തിന്റെ വിലയിരുത്തലല്ല.",
  };
  for (const [en, ml] of Object.entries(fixed)) known.set(en, ml);
  for (const relation of ["with", "in trine to"] as const) {
    const rel = relation === "with" ? "ഒപ്പം" : "ത്രികോണത്തിൽ";
    known.set(`Saturn ${relation} Jupiter: some Nadi readers consider this a timing factor; it does not establish a delay.`, `ശനി വ്യാഴത്തിന്റെ ${rel}: ചില നാഡി വായനക്കാർ ഇത് സമയവുമായി ബന്ധപ്പെട്ട ഘടകമായി കാണുന്നു; അത് താമസം സ്ഥാപിക്കുന്നില്ല.`);
    known.set(`Rahu ${relation} Jupiter: a traditional family-related link; it cannot determine the circumstances of parenthood.`, `രാഹു വ്യാഴത്തിന്റെ ${rel}: കുടുംബവുമായി ബന്ധപ്പെട്ട പരമ്പരാഗത ബന്ധം; മാതാപിതൃത്വത്തിന്റെ സാഹചര്യങ്ങൾ ഇതിന് നിർണയിക്കാനാവില്ല.`);
    known.set(`Ketu ${relation} Jupiter: a traditional family-related link with differing interpretations; no individual outcome is established.`, `കേതു വ്യാഴത്തിന്റെ ${rel}: വ്യത്യസ്ത വ്യാഖ്യാനങ്ങളുള്ള ഒരു പരമ്പരാഗത കുടുംബബന്ധം; വ്യക്തിയുടെ ഫലം സ്ഥാപിക്കുന്നില്ല.`);
  }
  for (const node of [undefined, "Rahu", "Ketu"] as const) {
    const en = `Jupiter with or in trine to Venus${node ? `, with a ${node} link` : ""}: a traditional family-related indicator, not a prediction of a child's sex or circumstances.`;
    const ml = `വ്യാഴം ശുക്രനോടൊപ്പമോ ത്രികോണത്തിലോ${node ? `, ${translate("ml", node)} ബന്ധത്തോടെയും` : ""}: കുടുംബവുമായി ബന്ധപ്പെട്ട പരമ്പരാഗത സൂചന; കുട്ടിയുടെ ലിംഗമോ സാഹചര്യങ്ങളോ പ്രവചിക്കുന്നില്ല.`;
    known.set(en, ml);
  }
  for (const nodes of [["Rahu"], ["Ketu"], ["Rahu", "Ketu"]] as const) {
    known.set(`Jupiter, Saturn and ${list([...nodes])} are linked by sign without Venus: a traditional timing interpretation that cannot determine a delay or route to parenthood.`, `വ്യാഴവും ശനിയും ${nodes.map((n) => translate("ml", n)).join(", ")}യും ശുക്രനില്ലാതെ രാശിയിലൂടെ ബന്ധപ്പെട്ടിരിക്കുന്നു: താമസമോ മാതാപിതൃത്വത്തിലേക്കുള്ള വഴിയോ നിർണയിക്കാനാവാത്ത പരമ്പരാഗത സമയവ്യാഖ്യാനം.`);
  }
  const translated = c.notes.map((n) => known.get(n));
  return translated.every(Boolean) ? translated.join(" ") : undefined;
}
