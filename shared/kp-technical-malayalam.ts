import type { KpPlanet, SignificatorLevel } from "./kp";
import { kpStageLabel } from "./chart-explanations";
import { KP_HOUSE_GLOSS, listJoin, ordH, withGloss } from "./house-gloss";
import { kpHouseMalayalam } from "./school-topic-malayalam";
import { translate } from "./localization";
import type { KpCuspTrace } from "./kp-event-natal-rules";
import type { KpFinding } from "./rules-kp";
import { thePlanet } from "./house-gloss";
import { PLANETS } from "./astro";

// Frozen glosses ensure the translation is not reused if the source meaning changes.
const gloss = ["", "health, appearance and temperament", "money, speech and family", "siblings, communications and short travel", "mother, education, home and vehicles", "children, intelligence and love affairs", "service, enemies and obstacles", "marriage, partners and agreements", "inheritance, insurance and debts", "worship, research and long journeys", "profession, name and honour", "gains, fulfilment of desires and friends", "expenses, investment and going abroad"];
const houseOk = (n: number) => n >= 1 && n <= 12 && KP_HOUSE_GLOSS[n] === gloss[n] && !!kpHouseMalayalam[n];
const ml = (s: string) => { const value = translate("ml", s); return value !== s ? value : undefined; };

/** The translation is used only for the unchanged chart-specific sentence. */
export function kpPlanetDetailMalayalam(p: KpPlanet, source: string): string | undefined {
  if (!houseOk(p.house)) return undefined;
  const expected = `In this chart ${p.planet} is in ${p.sign}, in the ${ordH(p.house)} house (${KP_HOUSE_GLOSS[p.house]}). Its star lord is ${p.starLord} and its sub-lord is ${p.subLord}.`;
  const planet = ml(p.planet), sign = ml(p.sign), star = ml(p.starLord), sub = ml(p.subLord);
  if (source !== expected || !planet || !sign || !star || !sub) return undefined;
  return `ഈ ജാതകത്തിൽ ${planet} ${sign} രാശിയിൽ ${p.house}-ാം ഭാവത്തിലാണ് (${kpHouseMalayalam[p.house]}). നക്ഷത്രാധിപൻ ${star}, സഹാധിപൻ ${sub} ആണ്.`;
}

/** Translate the exact selected stage and all its houses; preserve the node convention. */
export function kpStageDetailMalayalam(p: KpPlanet, stage: SignificatorLevel, houses: number[], source: string): string | undefined {
  if (!houses.length || houses.some((n) => !houseOk(n))) return undefined;
  const prefix = kpStageLabel(p, stage);
  if (source !== `${prefix} the ${listJoin(houses.map((n) => withGloss("kp", n)))}.`) return undefined;
  const prefixes: Record<string, string> = {
    "Its star lord occupies": "അതിന്റെ നക്ഷത്രാധിപൻ നിൽക്കുന്ന ഭാവങ്ങൾ",
    "It occupies": "അത് നിൽക്കുന്ന ഭാവങ്ങൾ",
    "Its star lord represents, through its sign lord and companions": "അതിന്റെ നക്ഷത്രാധിപൻ രാശ്യാധിപനിലൂടെയും ഒപ്പമുള്ള ഗ്രഹങ്ങളിലൂടെയും പ്രതിനിധീകരിക്കുന്ന ഭാവങ്ങൾ",
    "Its star lord rules": "അതിന്റെ നക്ഷത്രാധിപൻ ഭരിക്കുന്ന ഭാവങ്ങൾ",
    "It represents, through its sign lord and companions": "അത് രാശ്യാധിപനിലൂടെയും ഒപ്പമുള്ള ഗ്രഹങ്ങളിലൂടെയും പ്രതിനിധീകരിക്കുന്ന ഭാവങ്ങൾ",
    "It rules": "അത് ഭരിക്കുന്ന ഭാവങ്ങൾ",
    "Its sub-lord occupies": "അതിന്റെ സഹാധിപൻ നിൽക്കുന്ന ഭാവങ്ങൾ",
    "Its sub-lord represents, through its sign lord and companions": "അതിന്റെ സഹാധിപൻ രാശ്യാധിപനിലൂടെയും ഒപ്പമുള്ള ഗ്രഹങ്ങളിലൂടെയും പ്രതിനിധീകരിക്കുന്ന ഭാവങ്ങൾ",
    "Its sub-lord rules": "അതിന്റെ സഹാധിപൻ ഭരിക്കുന്ന ഭാവങ്ങൾ",
  };
  if (!prefixes[prefix]) return undefined;
  return `${prefixes[prefix]}: ${houses.map((n) => `${n}-ാം ഭാവം (${kpHouseMalayalam[n]})`).join(", ")}.`;
}

/** A complete four-step event trace; a modified clause or unknown planet stays English. */
export function kpCuspTraceMalayalam(t: KpCuspTrace, source: string): string | undefined {
  const list = (houses: number[]) => houses.join(", ") || "none";
  const expected = `Cusp ${t.cusp}: sign lord ${t.cuspSignLord}, star lord ${t.cuspStarLord}, sub lord ${t.subLord}. The sub lord occupies KP house ${t.subLordHouse} and owns ${list(t.subLordOwns)}; its star lord ${t.subLordStarLord} occupies house ${t.starLordHouse} and owns ${list(t.starLordOwns)}${t.starLordAgency?.length ? ` (star lord node agency: ${t.starLordAgency.join(", ")})` : ""}. Four-step house links A ${list(t.levels.A)}, B ${list(t.levels.B)}, C ${list(t.levels.C)}, D ${list(t.levels.D)}${t.agency?.length ? `; sub lord node agency ${t.agency.join(", ")}` : ""}. Matter-house links: ${list(t.matchingHouses)}. This trace is contextual; it does not assess the full script or add points.`;
  const planets = [t.cuspSignLord, t.cuspStarLord, t.subLord, t.subLordStarLord, ...(t.starLordAgency ?? []), ...(t.agency ?? [])];
  const values = planets.map(ml);
  const houses = [t.cusp, t.subLordHouse, t.starLordHouse, ...t.subLordOwns, ...t.starLordOwns, ...t.levels.A, ...t.levels.B, ...t.levels.C, ...t.levels.D, ...t.matchingHouses];
  if (source !== expected || values.some((p) => !p) || houses.some((n) => !Number.isInteger(n) || n < 1 || n > 12)) return undefined;
  const mlList = (xs: number[]) => xs.join(", ") || "ഒന്നുമില്ല";
  const agency = (xs: string[] | undefined) => xs?.map((p) => ml(p)).join(", ") ?? "";
  return `കസ്പ് ${t.cusp}: രാശ്യാധിപൻ ${values[0]}, നക്ഷത്രാധിപൻ ${values[1]}, സഹാധിപൻ ${values[2]}. സഹാധിപൻ KP ഭാവം ${t.subLordHouse}-ൽ നിൽക്കുന്നു; ഉടമസ്ഥത ${mlList(t.subLordOwns)}. അതിന്റെ നക്ഷത്രാധിപൻ ${values[3]} ${t.starLordHouse}-ാം ഭാവത്തിൽ നിൽക്കുന്നു; ഉടമസ്ഥത ${mlList(t.starLordOwns)}${t.starLordAgency?.length ? ` (നക്ഷത്രാധിപനായ രാഹു/കേതു പ്രതിനിധീകരിക്കുന്ന ഗ്രഹങ്ങൾ: ${agency(t.starLordAgency)})` : ""}. നാലുഘട്ട ഭാവബന്ധങ്ങൾ A ${mlList(t.levels.A)}, B ${mlList(t.levels.B)}, C ${mlList(t.levels.C)}, D ${mlList(t.levels.D)}${t.agency?.length ? `; സഹാധിപനായ രാഹു/കേതു പ്രതിനിധീകരിക്കുന്ന ഗ്രഹങ്ങൾ ${agency(t.agency)}` : ""}. വിഷയവുമായി പൊരുത്തപ്പെടുന്ന ഭാവബന്ധങ്ങൾ: ${mlList(t.matchingHouses)}. ഇത് പശ്ചാത്തലവിവരമാണ്; പൂർണ സ്ക്രിപ്റ്റ് വിലയിരുത്തുകയോ പോയിന്റുകൾ കൂട്ടുകയോ ചെയ്യുന്നില്ല.`;
}

/** Translate exactly the raw evidence printed in event details, including every extra fact. */
export function kpRawEvidenceMalayalam(f: KpFinding, source: string): string | undefined {
  if (!houseOk(f.cusp) || (f.inHouse && !houseOk(f.inHouse)) || f.used?.some((h) => !houseOk(h))) return undefined;
  const parts = [`${f.subLord} is the sub lord of cusp ${f.cusp}`];
  if (f.used?.length) parts.push(`signifies ${f.used.join(", ")}`);
  for (const fact of f.facts ?? []) parts.push(fact.replace(/^(in the (?:star|sub) of) the (Sun|Moon)$/, "$1 $2"));
  if (f.inHouse) parts.push(`posited in the ${ordH(f.inHouse)}`);
  if (source !== parts.join("; ")) return undefined;
  const p = ml(f.subLord); if (!p) return undefined;
  const quality: Record<string, string> = { "in a movable sign": "ചരരാശിയിൽ", "in a fixed sign": "സ്ഥിരരാശിയിൽ", "in a dual sign": "ഉഭയരാശിയിൽ" };
  const possessive: Record<string, string> = { Sun: "സൂര്യന്റെ", Moon: "ചന്ദ്രന്റെ", Mars: "ചൊവ്വയുടെ", Mercury: "ബുധന്റെ", Jupiter: "വ്യാഴത്തിന്റെ", Venus: "ശുക്രന്റെ", Saturn: "ശനിയുടെ", Rahu: "രാഹുവിന്റെ", Ketu: "കേതുവിന്റെ" };
  const translatedFacts: string[] = [];
  for (const fact of f.facts ?? []) {
    if (quality[fact]) { translatedFacts.push(quality[fact]); continue; }
    const planet = PLANETS.find((x) => fact === `in the star of ${thePlanet(x)}` || fact === `in the sub of ${thePlanet(x)}`);
    if (!planet) return undefined;
    translatedFacts.push(fact.startsWith("in the star") ? `${possessive[planet]} നക്ഷത്രത്തിൽ` : `${possessive[planet]} ഉപവിഭാഗത്തിൽ`);
  }
  const items = [`${p} കസ്പ് ${f.cusp}-ന്റെ സഹാധിപൻ`];
  if (f.used?.length) items.push(`${f.used.join(", ")} സൂചിപ്പിക്കുന്നു`);
  items.push(...translatedFacts);
  if (f.inHouse) items.push(`${f.inHouse}-ാം ഭാവത്തിൽ സ്ഥിതിചെയ്യുന്നു`);
  return items.join("; ");
}
