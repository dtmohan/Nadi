/** Exact-source Malayalam for the existing Ashtalakshmi report, without new predictions. */
import { translate } from "./localization";
import type { LakshmiForm, LakshmiReading } from "./lakshmi";
import { fmtMonth } from "./report/types";
import { periodStateLabel } from "./life-stage";

const names: Record<string, [string, string, string]> = {
  Sun: ["Vijaya / Rajya Lakshmi", "victory, authority and royalty; the book adds that this pair can make the spouse and the father very powerful", "വിജയ / രാജ്യ ലക്ഷ്മി|വിജയം, അധികാരം, രാജകീയത; ഈ ഗ്രഹജോടി ജീവിതപങ്കാളിയെയും അച്ഛനെയും വളരെ ശക്തരാക്കാമെന്നും പുസ്തകം പറയുന്നു"],
  Moon: ["Dhanya Lakshmi", "harvest and grains: nourishment, food and steady sustenance", "ധാന്യ ലക്ഷ്മി|വിളവും ധാന്യങ്ങളും: പോഷണം, ഭക്ഷണം, സ്ഥിരമായ ഉപജീവനം"],
  Mars: ["Veera / Dhairya Lakshmi", "valour, vigour and patience in trouble; wealth won through courage", "വീര / ധൈര്യ ലക്ഷ്മി|പരാക്രമം, ഊർജം, പ്രതിസന്ധിയിലെ ക്ഷമ; ധൈര്യത്തിലൂടെ നേടിയ ധനം"],
  Mercury: ["Vidya Lakshmi", "knowledge and learning: study, skill, teaching and trade", "വിദ്യാ ലക്ഷ്മി|അറിവും പഠനവും: പഠനം, കഴിവ്, അധ്യാപനം, വ്യാപാരം"],
  Jupiter: ["Santana Lakshmi", "offspring and progeny; wealth that grows through the family line", "സന്താന ലക്ഷ്മി|സന്താനവും പിൻതലമുറയും; കുടുംബപരമ്പരയിലൂടെ വളരുന്ന ധനം"],
  Saturn: ["Aadi Lakshmi", "wealth earned by dedication, hard work and honest effort", "ആദി ലക്ഷ്മി|സമർപ്പണം, കഠിനാധ്വാനം, സത്യസന്ധ പരിശ്രമം എന്നിവയിലൂടെ നേടിയ ധനം"],
  Rahu: ["Dhana Lakshmi", "material wealth, often in magnitude or suddenness", "ധന ലക്ഷ്മി|ഭൗതികസമ്പത്ത്; പലപ്പോഴും വലിയ അളവിലോ പെട്ടെന്നോ ലഭിക്കുന്നത്"],
  Ketu: ["Gaja Lakshmi", "power and strength; wealth from position, force and detachment", "ഗജ ലക്ഷ്മി|ശക്തിയും ബലവും; സ്ഥാനം, ബലം, നിസ്സംഗത എന്നിവയിൽനിന്നുള്ള ധനം"],
};
const details = (f: LakshmiForm) => {
  const row = names[f.planet], planet = translate("ml", f.planet);
  if (!row || f.form !== row[0] || f.domain !== row[1] || planet === f.planet || !Number.isInteger(f.house) || f.house < 1 || f.house > 12 || !["diagram", "case-study"].includes(f.via)) return undefined;
  const [form, domain] = row[2].split("|");
  return { planet, form, domain };
};
const ord = (h: number) => `${h}${["th", "st", "nd", "rd"][h % 10 < 4 && (h < 11 || h > 13) ? h % 10 : 0]}`;
const list = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export function lakshmiFormMalayalam(f: LakshmiForm, source: string): string | undefined {
  const expected = `${f.planet} in the ${ord(f.house)} from Venus — ${f.form}: ${f.domain}.${f.via === "case-study" ? " Read in the book's case studies, beyond the chapter diagrams." : ""}`;
  const d = details(f);
  if (!d || source !== expected) return undefined;
  return `ശുക്രനിൽനിന്ന് ${f.house}-ാം ഭാവത്തിൽ ${d.planet} — ${d.form}: ${d.domain}.${f.via === "case-study" ? " അധ്യായത്തിലെ ചിത്രങ്ങൾക്കപ്പുറം പുസ്തകത്തിലെ കേസ്പഠനങ്ങളിൽ ഇങ്ങനെ വായിക്കുന്നു." : ""}`;
}

export function lakshmiHeadlineMalayalam(r: LakshmiReading, source: string): string | undefined {
  const sign = translate("ml", r.venusSign), forms = r.forms.map(details);
  if (sign === r.venusSign || forms.some((f) => !f)) return undefined;
  const short = r.forms.map((f) => f.form.split(" / ").pop()!.replace(" Lakshmi", ""));
  const expected = r.forms.length === 0 ? `Venus in ${r.venusSign} stands alone in the Lakshmi scheme: no planet occupies the houses the book sets for her forms. Wealth is read from the Rao/Naik combinations instead.` : r.forms.length === 1 ? `Venus in ${r.venusSign}: one of her eight forms stands in this chart — ${short[0]} Lakshmi, through ${r.forms[0].planet} in the ${ord(r.forms[0].house)} from Venus.` : `Venus in ${r.venusSign}: ${r.forms.length} of her eight forms stand in this chart — ${list(short)} Lakshmi, each through its planet's place from Venus.`;
  if (source !== expected) return undefined;
  if (!r.forms.length) return `${sign} രാശിയിലെ ശുക്രൻ ലക്ഷ്മീപദ്ധതിയിൽ ഒറ്റയ്ക്കാണ്: പുസ്തകം രൂപങ്ങൾക്കായി നിശ്ചയിച്ച ഭാവങ്ങളിൽ ഗ്രഹങ്ങളൊന്നുമില്ല. ധനം പകരം റാവു/നായിക് സംയോഗങ്ങളിൽനിന്ന് വായിക്കുന്നു.`;
  if (r.forms.length === 1) return `${sign} രാശിയിലെ ശുക്രൻ: എട്ടു രൂപങ്ങളിൽ ഒന്ന് ഈ ജാതകത്തിലുണ്ട് — ശുക്രനിൽനിന്ന് ${r.forms[0].house}-ാം ഭാവത്തിലെ ${forms[0]!.planet} വഴി ${forms[0]!.form}.`;
  return `${sign} രാശിയിലെ ശുക്രൻ: എട്ടു രൂപങ്ങളിൽ ${r.forms.length} എണ്ണം ഈ ജാതകത്തിലുണ്ട് — ${forms.map((f) => f!.form).join(", ")}; ഓരോന്നും ശുക്രനിൽനിന്നുള്ള അതത് ഗ്രഹത്തിന്റെ സ്ഥാനത്തിലൂടെയാണ്.`;
}

const staticNotes: [string, string][] = [
  ["Each form ripens in the dasha of its planet: the book times its first case to the Rahu mahadasha for Rahu in the 2nd from Venus (p. 173). The dasha years are shown beside each form.", "ഓരോ രൂപവും അതിന്റെ ഗ്രഹത്തിന്റെ ദശയിൽ ഫലം നൽകുമെന്ന് പുസ്തകം പറയുന്നു: ആദ്യ കേസിൽ ശുക്രനിൽനിന്ന് രണ്ടാമതുള്ള രാഹുവിന് രാഹു മഹാദശയാണ് സമയം (പേജ് 173). ഓരോ രൂപത്തിനും സമീപം ദശാവർഷങ്ങൾ കാണിക്കുന്നു."],
  ["The house sets are broad — four to ten of the twelve houses from Venus qualify for each planet — so most charts carry several forms at once. This is a promise-and-timing reading, not a test; the book's own case 2 reads three forms together (p. 177).", "ഭാവങ്ങളുടെ കൂട്ടങ്ങൾ വിശാലമാണ് — ശുക്രനിൽനിന്നുള്ള പന്ത്രണ്ടിൽ നാലു മുതൽ പത്തു വരെ ഭാവങ്ങൾ ഓരോ ഗ്രഹത്തിനും യോഗ്യമാണ് — അതിനാൽ മിക്ക ജാതകങ്ങളിലും ഒരേസമയം പല രൂപങ്ങളുണ്ടാകും. ഇത് സാധ്യതയും സമയവും വായിക്കുന്ന രീതിയാണ്, ഒരു പരിശോധനയല്ല; പുസ്തകത്തിലെ രണ്ടാം കേസിൽ മൂന്നു രൂപങ്ങൾ ഒരുമിച്ച് വായിക്കുന്നു (പേജ് 177)."],
  ["Source: S. Prakash, DNA Astrology of Wealth (2022) — a modern research work on Bhrigu Nandi Nadi, not a classical text. It is read alongside the Rao/Naik combinations, never in their place.", "ഉറവിടം: എസ്. പ്രകാശ്, DNA Astrology of Wealth (2022) — ഭൃഗു നന്ദി നാഡിയെക്കുറിച്ചുള്ള ആധുനിക ഗവേഷണകൃതിയാണ്; ക്ലാസിക്കൽ ഗ്രന്ഥമല്ല. റാവു/നായിക് സംയോഗങ്ങൾക്കൊപ്പം ഇത് വായിക്കുന്നു, അവയ്ക്കു പകരമായല്ല."],
];

export function lakshmiNotesMalayalam(r: LakshmiReading, source: string): string | undefined {
  const ext = r.forms.filter((f) => f.via === "case-study");
  const extLine = ext.length ? `${list(ext.map((f) => `${f.planet} in the ${ord(f.house)} from Venus`))} ${ext.length === 1 ? "is" : "are"} read in the book's case studies though the chapter diagrams do not show ${ext.length === 1 ? "it" : "them"} — carried as case-study-supported.` : undefined;
  if (source !== [...staticNotes.map(([en]) => en), ...(extLine ? [extLine] : [])].join(" ") || ext.some((f) => !details(f))) return undefined;
  const tail = ext.length ? ` ${ext.map((f) => `ശുക്രനിൽനിന്ന് ${f.house}-ാം ഭാവത്തിലെ ${details(f)!.planet}`).join(", ")} അധ്യായത്തിലെ ചിത്രങ്ങളിൽ കാണിക്കുന്നില്ലെങ്കിലും പുസ്തകത്തിലെ കേസ്പഠനങ്ങളിൽ വായിക്കുന്നു; കേസ്പഠന പിന്തുണയോടെ ഇവിടെ ഉൾപ്പെടുത്തിയിരിക്കുന്നു.` : "";
  return `${staticNotes.map(([, ml]) => ml).join(" ")}${tail}`;
}

export function lakshmiPeriodMalayalam(p: { start: string; end: string; current?: boolean }, lifeAt: string, deceased: boolean, source: string): string | undefined {
  const state = periodStateLabel(p, lifeAt, deceased);
  const expected = `Mahadasha ${fmtMonth(p.start)} to ${fmtMonth(p.end)}${state}`;
  if (source !== expected) return undefined;
  const suffix = state === " (running at passing)" ? " (മരണസമയത്ത് നടന്നുകൊണ്ടിരുന്നത്)" : state === " (running)" ? " (നടന്നുകൊണ്ടിരിക്കുന്നു)" : state === " (passed)" ? " (കഴിഞ്ഞു)" : "";
  return `മഹാദശ ${fmtMonth(p.start)} മുതൽ ${fmtMonth(p.end)} വരെ${suffix}`;
}
