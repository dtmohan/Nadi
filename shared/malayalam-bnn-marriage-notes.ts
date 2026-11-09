import type { MarriageReading, nextMarriageWindow } from "./marriage";
import { translate } from "./localization";
import { fmtMonth } from "./report/types";

/** Translate only a complete set of known marriage notes after life-stage and wording gates. */
export function bnnMarriageNotesMalayalam(m: MarriageReading, source: string): string | undefined {
  if (m.spouse !== "Mars" && m.spouse !== "Venus") return undefined;
  const spouse = translate("ml", m.spouse);
  if (spouse === m.spouse) return undefined;
  const spouseTogether = m.spouse === "Mars" ? "ചൊവ്വയോടൊപ്പം" : "ശുക്രനോടൊപ്പം";
  const spouseTrine = m.spouse === "Mars" ? "ചൊവ്വയുമായി ത്രികോണത്തിൽ" : "ശുക്രനുമായി ത്രികോണത്തിൽ";
  const spouseOpposite = m.spouse === "Mars" ? "ചൊവ്വയ്ക്ക്" : "ശുക്രന്";
  const expected = m.notes.join(" ").trim() || "The headline above is the whole of what the karakas say; no further note applies.";
  if (source !== expected) return undefined;
  if (!m.notes.length) return "മുകളിലെ പ്രധാന വാചകത്തിൽ കാരകങ്ങൾ പറയുന്ന മുഴുവൻ കാര്യവും ഉൾപ്പെടുന്നു; കൂടുതൽ കുറിപ്പില്ല.";
  const known = new Map<string, string>();
  for (const rel of ["with", "in trine to"] as const) {
    known.set(`Saturn ${rel} ${m.spouse}: the classic delay; marriage tends to come later than the family norm (the delay is sourced; any specific age is provisional).`, `ശനി ${rel === "with" ? spouseTogether : spouseTrine}: പരമ്പരാഗതമായ താമസസൂചന; കുടുംബത്തിൽ സാധാരണയുള്ളതിനേക്കാൾ വിവാഹം വൈകി നടക്കാനുള്ള പ്രവണത (താമസത്തിന് ഉറവിടമുണ്ട്; ഏതെങ്കിലും പ്രത്യേക പ്രായം താൽക്കാലികമാണ്).`);
    known.set(`Jupiter ${rel} Venus: timely or early marriage; Jupiter's passages over Venus's sign or its trines bring it.`, `വ്യാഴം ${rel === "with" ? "ശുക്രനോടൊപ്പം" : "ശുക്രനുമായി ത്രികോണത്തിൽ"}: യഥാസമയത്തോ നേരത്തെയോ വിവാഹം; ശുക്രന്റെ രാശിയിലൂടെയോ അതിന്റെ ത്രികോണങ്ങളിലൂടെയോ വ്യാഴം കടന്നുപോകുമ്പോൾ അത് സംഭവിക്കുമെന്ന് ഈ വായന പറയുന്നു.`);
    known.set(`Jupiter ${rel} Mars: the husband's karaka is blessed; timely marriage, a principled husband.`, `വ്യാഴം ${rel === "with" ? "ചൊവ്വയോടൊപ്പം" : "ചൊവ്വയുമായി ത്രികോണത്തിൽ"}: ഭർത്താവിന്റെ കാരകത്തിന് അനുഗ്രഹം; യഥാസമയത്ത് വിവാഹവും തത്ത്വനിഷ്ഠനായ ഭർത്താവും.`);
  }
  known.set(`Saturn opposite ${m.spouse}: delay, or a partner of very different temperament.`, `ശനി ${spouseOpposite} എതിർവശത്ത്: താമസം അല്ലെങ്കിൽ വളരെ വ്യത്യസ്ത സ്വഭാവമുള്ള പങ്കാളി.`);
  known.set("Jupiter with or in trine to Venus: in a female chart many teachers read Jupiter itself for the husband, so this too favours marriage.", "വ്യാഴം ശുക്രനോടൊപ്പമോ ത്രികോണത്തിലോ: സ്ത്രീയുടെ ജാതകത്തിൽ പല അധ്യാപകരും വ്യാഴത്തെത്തന്നെ ഭർത്താവിനായി വായിക്കുന്നതിനാൽ ഇതും വിവാഹത്തിന് അനുകൂലമായി കാണുന്നു.");
  const sets = [["Rahu"], ["Ketu"], ["Rahu", "Ketu"]] as const;
  for (const nodes of sets) for (const jupiter of [false, true]) {
    const en = nodes.join(" and ");
    const ml = nodes.length === 2 ? "രാഹുവും കേതുവും" : translate("ml", nodes[0]);
    known.set(`${m.spouse}, Saturn and ${en} in one sign: Nadi reads this as denial or a very late, unconventional marriage${jupiter ? "; Jupiter's aspect softens it to compromise" : ""}.`, `${spouse}, ശനി, ${ml} എന്നിവർ ഒരേ രാശിയിൽ: നാഡി ഇതിനെ നിഷേധമായോ വളരെ വൈകിയതും അസാധാരണവുമായ വിവാഹമായോ വായിക്കുന്നു${jupiter ? "; വ്യാഴത്തിന്റെ ദൃഷ്ടി അതിനെ ഒത്തുതീർപ്പിലേക്ക് മയപ്പെടുത്തുന്നു" : ""}.`);
    for (const inSign of [false, true]) {
      const hasRahu = nodes.some((n) => n === "Rahu");
      const sourceText = `${en} ${inSign ? "with" : "in trine to"} ${m.spouse}: obstacles before marriage and disputes after it${inSign ? "" : ", at trine strength"}${hasRahu ? "; a partner from another community, region or country is likely" : ""}${jupiter ? "; Jupiter's aspect brings compromise" : ""}.`;
      const exact = `${ml} ${inSign ? spouseTogether : spouseTrine}: വിവാഹത്തിനു മുമ്പ് തടസ്സങ്ങളും ശേഷം തർക്കങ്ങളും${inSign ? "" : ", ത്രികോണത്തിന്റെ ബലത്തിൽ"}${hasRahu ? "; മറ്റൊരു സമുദായത്തിൽനിന്നോ പ്രദേശത്തുനിന്നോ രാജ്യത്തുനിന്നോ ഉള്ള പങ്കാളിക്ക് സാധ്യത" : ""}${jupiter ? "; വ്യാഴത്തിന്റെ ദൃഷ്ടി ഒത്തുതീർപ്പു കൊണ്ടുവരുന്നു" : ""}.`;
      known.set(sourceText, exact);
    }
  }
  known.set("Mars, Venus and Rahu together: a passionate but unsettled married life.", "ചൊവ്വയും ശുക്രനും രാഹുവും ഒരുമിച്ച്: ആവേശമുള്ളതെങ്കിലും അസ്വസ്ഥമായ ദാമ്പത്യജീവിതം.");
  for (const jupiter of [false, true]) known.set(`Mars, Venus and Ketu together: disputes between the partners, separation possible${jupiter ? "; Jupiter's aspect brings compromise" : ""}.`, `ചൊവ്വയും ശുക്രനും കേതുവും ഒരുമിച്ച്: പങ്കാളികൾ തമ്മിൽ തർക്കങ്ങൾ, വേർപിരിയൽ സാധ്യം${jupiter ? "; വ്യാഴത്തിന്റെ ദൃഷ്ടി ഒത്തുതീർപ്പു കൊണ്ടുവരുന്നു" : ""}.`);
  known.set("Venus hemmed between Mars and Mercury: the heart is divided between a lover and the spouse.", "ശുക്രൻ ചൊവ്വയ്ക്കും ബുധനും ഇടയിൽ വലയപ്പെട്ടിരിക്കുന്നു: ഹൃദയം പ്രണയിതാവിനും പങ്കാളിക്കും ഇടയിൽ വിഭജിക്കപ്പെടുന്നു.");
  known.set("With no direct link, Nadi reads the dispositor of the spouse karaka and waits for Jupiter's passage over it.", "നേരിട്ടുള്ള ബന്ധമില്ലെങ്കിൽ നാഡി പങ്കാളികാരകത്തിന്റെ രാശ്യാധിപനെ വായിക്കുകയും അതിലൂടെ വ്യാഴം കടന്നുപോകുന്നത് കാത്തിരിക്കുകയും ചെയ്യുന്നു.");
  const translated = m.notes.map((note) => known.get(note));
  return translated.every(Boolean) ? translated.join(" ") : undefined;
}

/** Keep the displayed date range and the distinction between over and trine. */
export function bnnMarriageWindowMalayalam(m: MarriageReading, win: ReturnType<typeof nextMarriageWindow>, deceased: boolean, source: string): string | undefined {
  const expected = `Jupiter over ${m.spouseSign} or its trines brings the matter forward${win && !deceased ? `; next: Jupiter ${win.kind === "over" ? "over" : "in trine from"} ${win.period.sign}, ${fmtMonth(win.period.start)} to ${fmtMonth(win.period.end)}` : ""}.`;
  if (source !== expected) return undefined;
  const sign = translate("ml", m.spouseSign);
  if (sign === m.spouseSign) return undefined;
  const nextSign = win && !deceased ? translate("ml", win.period.sign) : undefined;
  if (win && !deceased && (!nextSign || nextSign === win.period.sign)) return undefined;
  return `വ്യാഴം ${sign} രാശിയിലൂടെയോ അതിന്റെ ത്രികോണങ്ങളിലൂടെയോ കടന്നുപോകുമ്പോൾ ഈ വിഷയം മുന്നോട്ടു വരുന്നു${win && !deceased ? `; അടുത്തത്: വ്യാഴം ${nextSign} രാശിയിൽ ${win.kind === "over" ? "നേരിട്ട്" : "ത്രികോണത്തിൽ"}, ${fmtMonth(win.period.start)} മുതൽ ${fmtMonth(win.period.end)} വരെ` : ""}.`;
}
