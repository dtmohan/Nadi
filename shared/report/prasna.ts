// Prasna Marga's natal house walk, using exactly the inputs of the on-screen birth-chart view.
// The interactive question chart has a separate selected Arudha and is not part of this export.
import { computePrasna, computePrasnaFructification, PRASNA_BHAVA_SIGNIFICATIONS } from "../rules-prasna";
import { natalPlanetContext } from "../planet-context";
import { HOUSE_AREA, redactProse } from "../life-stage";
import { PRASNA_HOUSE_GLOSS } from "../house-gloss";
import { PRASNA_HOUSE_EFFECT_PLAIN } from "../prasna-plain";
import { firstClause } from "../synthesis";
import { ORD, type ReportModule, type ReportPara } from "./types";
import { translate } from "../localization";
import { ordH, thePlanet } from "../house-gloss";
import type { PrasnaBhavaFructification } from "../rules-prasna";
import type { ChartResult } from "../schema";

/** Translate precisely the facts printed before the first full stop or semicolon. */
export function plainFructificationMalayalam(f: PrasnaBhavaFructification, result: ChartResult, lagna: number): string | undefined {
  const lord = result.positions.find((p) => p.planet === f.lord);
  const karaka = result.positions.find((p) => p.planet === f.karaka);
  if (!lord || !karaka) return undefined;
  const lh = (lord.signIndex - lagna + 12) % 12 + 1;
  const kh = (karaka.signIndex - lagna + 12) % 12 + 1;
  const st = (x: boolean | null) => x === null ? "of unknown strength" : x ? "strong" : "weak";
  const pl = (x: boolean | null) => x === null ? "neither well nor badly placed" : x ? "well placed" : "badly placed";
  const stm = (x: boolean | null) => x === null ? "ബലം നിർണയിച്ചിട്ടില്ല" : x ? "ബലമുള്ളതാണ്" : "ബലം കുറഞ്ഞതാണ്";
  const plm = (x: boolean | null) => x === null ? "സ്ഥാനത്തെ അനുകൂലമെന്നോ പ്രതികൂലമെന്നോ നിർണയിച്ചിട്ടില്ല" : x ? "സ്ഥാനം അനുകൂലമാണ്" : "സ്ഥാനം പ്രതികൂലമാണ്";
  const bothStrength = (x: boolean | null) => x === null ? "രണ്ടിന്റെയും ബലം നിർണയിച്ചിട്ടില്ല" : x ? "രണ്ടും ബലമുള്ളവയാണ്" : "രണ്ടിനും ബലം കുറവാണ്";
  const bothPlace = (x: boolean | null) => x === null ? "രണ്ടിന്റെയും സ്ഥാനം അനുകൂലമെന്നോ പ്രതികൂലമെന്നോ നിർണയിച്ചിട്ടില്ല" : x ? "രണ്ടിന്റെയും സ്ഥാനങ്ങൾ അനുകൂലമാണ്" : "രണ്ടിന്റെയും സ്ഥാനങ്ങൾ പ്രതികൂലമാണ്";
  const l = translate("ml", f.lord), k = translate("ml", f.karaka);
  if (l === f.lord || k === f.karaka) return undefined;
  let expected: string, ml: string;
  if (f.lord === f.karaka) {
    expected = `Its lord and karaka, ${thePlanet(f.lord)} in the ${ordH(lh)}, is ${st(f.lordStrong)} and ${pl(f.lordFavourable)}`;
    ml = `ഈ ഭാവത്തിന്റെ അധിപനും കാരകനുമായ ${l} ${lh}-ാം ഭാവത്തിലാണ്; ${stm(f.lordStrong)}, ${plm(f.lordFavourable)}.`;
  } else {
    const who = `Its lord, ${thePlanet(f.lord)} in the ${ordH(lh)}, and its karaka, ${thePlanet(f.karaka)} in the ${ordH(kh)}`;
    if (f.lordStrong === f.karakaStrong && f.lordFavourable === f.karakaFavourable) {
      expected = `${who}, are both ${st(f.lordStrong)} and ${pl(f.lordFavourable)}`;
      ml = `ഈ ഭാവത്തിന്റെ അധിപനായ ${l} ${lh}-ാം ഭാവത്തിലും കാരകനായ ${k} ${kh}-ാം ഭാവത്തിലുമാണ്. ${bothStrength(f.lordStrong)}; ${bothPlace(f.lordFavourable)}.`;
    } else if (f.lordStrong === f.karakaStrong) {
      // The existing report stops at the semicolon, before its two position assessments.
      expected = `${who}, are both ${st(f.lordStrong)}`;
      ml = `ഈ ഭാവത്തിന്റെ അധിപനായ ${l} ${lh}-ാം ഭാവത്തിലും കാരകനായ ${k} ${kh}-ാം ഭാവത്തിലുമാണ്. ${bothStrength(f.lordStrong)}.`;
    } else {
      // The existing report stops at the semicolon, before the karaka's facts.
      expected = `Its lord, ${thePlanet(f.lord)} in the ${ordH(lh)}, is ${st(f.lordStrong)} and ${pl(f.lordFavourable)}`;
      ml = `ഈ ഭാവത്തിന്റെ അധിപനായ ${l} ${lh}-ാം ഭാവത്തിലാണ്; ${stm(f.lordStrong)}, ${plm(f.lordFavourable)}.`;
    }
  }
  return firstClause(f.notePlain) === expected ? ml : undefined;
}

/** Practitioner mode prints both sets of facts and the source's verdict; retain all three. */
export function practitionerFructificationMalayalam(f: PrasnaBhavaFructification, result: ChartResult, lagna: number): string | undefined {
  const lord = result.positions.find((p) => p.planet === f.lord), karaka = result.positions.find((p) => p.planet === f.karaka);
  if (!lord || !karaka) return undefined;
  const lh = (lord.signIndex - lagna + 12) % 12 + 1, kh = (karaka.signIndex - lagna + 12) % 12 + 1;
  const st = (x: boolean | null) => x === null ? "of unknown strength" : x ? "strong" : "weak";
  const pl = (x: boolean | null) => x === null ? "neither well nor badly placed" : x ? "well placed" : "badly placed";
  const stm = (x: boolean | null) => x === null ? "ബലം നിർണയിച്ചിട്ടില്ല" : x ? "ബലമുള്ളതാണ്" : "ബലം കുറഞ്ഞതാണ്";
  const plm = (x: boolean | null) => x === null ? "സ്ഥാനം അനുകൂലമെന്നോ പ്രതികൂലമെന്നോ നിർണയിച്ചിട്ടില്ല" : x ? "സ്ഥാനം അനുകൂലമാണ്" : "സ്ഥാനം പ്രതികൂലമാണ്";
  const bothStrength = (x: boolean | null) => x === null ? "രണ്ടിന്റെയും ബലം നിർണയിച്ചിട്ടില്ല" : x ? "രണ്ടും ബലമുള്ളവയാണ്" : "രണ്ടിനും ബലം കുറവാണ്";
  const bothPlace = (x: boolean | null) => x === null ? "രണ്ടിന്റെയും സ്ഥാനം അനുകൂലമെന്നോ പ്രതികൂലമെന്നോ നിർണയിച്ചിട്ടില്ല" : x ? "രണ്ടിന്റെയും സ്ഥാനങ്ങൾ അനുകൂലമാണ്" : "രണ്ടിന്റെയും സ്ഥാനങ്ങൾ പ്രതികൂലമാണ്";
  const l = translate("ml", f.lord), k = translate("ml", f.karaka);
  if (l === f.lord || k === f.karaka) return undefined;
  let expected: string, ml: string;
  if (f.lord === f.karaka) {
    expected = `Its lord and karaka, ${thePlanet(f.lord)} in the ${ordH(lh)}, is ${st(f.lordStrong)} and ${pl(f.lordFavourable)}`;
    ml = `ഈ ഭാവത്തിന്റെ അധിപനും കാരകനുമായ ${l} ${lh}-ാം ഭാവത്തിലാണ്; ${stm(f.lordStrong)}, ${plm(f.lordFavourable)}.`;
  } else {
    const who = `Its lord, ${thePlanet(f.lord)} in the ${ordH(lh)}, and its karaka, ${thePlanet(f.karaka)} in the ${ordH(kh)}`;
    if (f.lordStrong === f.karakaStrong && f.lordFavourable === f.karakaFavourable) {
      expected = `${who}, are both ${st(f.lordStrong)} and ${pl(f.lordFavourable)}`;
      ml = `ഈ ഭാവത്തിന്റെ അധിപനായ ${l} ${lh}-ാം ഭാവത്തിലും കാരകനായ ${k} ${kh}-ാം ഭാവത്തിലുമാണ്. ${bothStrength(f.lordStrong)}; ${bothPlace(f.lordFavourable)}.`;
    } else if (f.lordStrong === f.karakaStrong) {
      expected = `${who}, are both ${st(f.lordStrong)}; the lord is ${pl(f.lordFavourable)}, the karaka ${pl(f.karakaFavourable)}`;
      ml = `ഈ ഭാവത്തിന്റെ അധിപനായ ${l} ${lh}-ാം ഭാവത്തിലും കാരകനായ ${k} ${kh}-ാം ഭാവത്തിലുമാണ്. ${bothStrength(f.lordStrong)}; അധിപന്റെ ${plm(f.lordFavourable)}, കാരകന്റെ ${plm(f.karakaFavourable)}.`;
    } else {
      expected = `Its lord, ${thePlanet(f.lord)} in the ${ordH(lh)}, is ${st(f.lordStrong)} and ${pl(f.lordFavourable)}; its karaka, ${thePlanet(f.karaka)} in the ${ordH(kh)}, is ${st(f.karakaStrong)} and ${pl(f.karakaFavourable)}`;
      ml = `ഈ ഭാവത്തിന്റെ അധിപനായ ${l} ${lh}-ാം ഭാവത്തിലാണ്; ${stm(f.lordStrong)}, ${plm(f.lordFavourable)}. കാരകനായ ${k} ${kh}-ാം ഭാവത്തിലാണ്; ${stm(f.karakaStrong)}, ${plm(f.karakaFavourable)}.`;
    }
  }
  const endings: Record<PrasnaBhavaFructification["verdict"], [string, string]> = {
    full: ["The house's promise is fully experienced.", "ഭാവത്തിന്റെ വാഗ്ദാനം പൂർണമായി അനുഭവപ്പെടുന്നു."],
    "seen-not-enjoyed": ["The promise exists, yet the native does not enjoy it.", "വാഗ്ദാനം ഉണ്ടെങ്കിലും വ്യക്തി അതിന്റെ ഫലം അനുഭവിക്കുന്നില്ല."],
    little: ["The promise is experienced, however little.", "ഫലം എത്ര ചെറുതായാലും വാഗ്ദാനം അനുഭവപ്പെടുന്നു."],
    mixed: ["The stated strength and position conditions are mixed or unresolved; no single result is established.", "പറഞ്ഞ ബലവും സ്ഥാനവും സംബന്ധിച്ച വ്യവസ്ഥകൾ സമ്മിശ്രമോ തീരുമാനിക്കാത്തതോ ആണ്; ഒരൊറ്റ ഫലം സ്ഥാപിച്ചിട്ടില്ല."],
    negative: ["The house's results turn negative.", "ഭാവത്തിന്റെ ഫലങ്ങൾ പ്രതികൂലമാകുന്നു."],
  };
  const ending = endings[f.verdict];
  return ending && f.note === `${expected}. ${ending[0]}` ? `${ml} ${ending[1]}` : undefined;
}

export const prasnaModule: ReportModule = {
  id: "prasna", label: "Prasna Marga: birth-chart houses", short: "Prasna Marga", tab: "prasna",
  build(ctx) {
    const { result, S, cites, withheld, inSeason } = ctx;
    const lagna = result.jaimini.lagna.signIndex;
    const readings = computePrasna(natalPlanetContext(result), lagna);
    const fructification = computePrasnaFructification(result.positions, result.reading.strength, lagna);
    const paras: ReportPara[] = [
      { kind: "lead", text: "These are the birth-chart houses counted from the natal rising sign. They are not a question-time chart and do not answer a horary question." },
      { kind: "note", text: "Each house covers several matters. For 14.40 the app uses a partial sign-based strength proxy: neutral and inimical signs remain unresolved. Other strength factors are not measured by this check. The house-karaka mapping and benefic/malefic classification are provisional; empty houses are not negative conclusions.", provisional: true },
    ];
    for (const sig of PRASNA_BHAVA_SIGNIFICATIONS) {
      const h = sig.house;
      if (HOUSE_AREA[h] && !inSeason(HOUSE_AREA[h])) continue;
      const r = readings.find((x) => x.house === h);
      const f = fructification.find((x) => x.house === h);
      const clean = (s: string) => withheld ? redactProse(s) : s;
      const effects = ctx.plain ? [r?.beneficText && PRASNA_HOUSE_EFFECT_PLAIN[h].benefic, r?.maleficText && PRASNA_HOUSE_EFFECT_PLAIN[h].malefic].filter((x): x is string => !!x)
        : [r?.beneficText, r?.maleficText].filter((x): x is string => !!x).map(clean).filter(Boolean);
      const raw = `${ORD(h)} house: ${ctx.plain ? PRASNA_HOUSE_GLOSS[h] : clean(sig.text)}. ${r ? `Occupants: ${r.occupants.map((p) => p.planet).join(", ")}.` : "No planet occupies this house."} ${effects.join(" ")} ${f ? ctx.plain ? `${firstClause(f.notePlain)}. This partial assessment covers the whole house, not a specific outcome.` : clean(f.note) : ""}`;
      const text = S(raw);
      const glossSource = ctx.plain ? PRASNA_HOUSE_GLOSS[h] : sig.text;
      const gloss = translate("ml", glossSource);
      const effectsMl = effects.map((effect) => translate("ml", effect));
      const occupants = r?.occupants.map((p) => translate("ml", p.planet));
      const facts = f ? ctx.plain ? plainFructificationMalayalam(f, result, lagna) : practitionerFructificationMalayalam(f, result, lagna) : "";
      const canTranslate = !withheld && text === raw && gloss !== glossSource &&
        effects.every((effect, i) => effectsMl[i] !== effect) && (!r || occupants?.every((p, i) => p !== r.occupants[i].planet)) && facts !== undefined;
      const ml = canTranslate ? `${h}-ാം ഭാവം: ${gloss}${/[.!?]$/.test(gloss) ? "" : "."} ${r ? `ഈ ഭാവത്തിലുള്ള ഗ്രഹങ്ങൾ: ${occupants!.join(", ")}.` : "ഈ ഭാവത്തിൽ ഗ്രഹങ്ങളില്ല."}${effectsMl.length ? ` ${effectsMl.join(" ")}` : ""}${f ? ` ${facts}${ctx.plain ? " ഈ ഭാഗിക വിലയിരുത്തൽ ഒരു പ്രത്യേക ഫലത്തെയല്ല, ഭാവത്തെ മുഴുവനായാണ് പരിശോധിക്കുന്നത്." : ""}` : ""}` : undefined;
      paras.push({
        kind: "p", text,
        ...(ml ? { translationMl: { source: text, text: ml } } : {}),
        cites: [cites.add(`Prasna Marga, B.V. Raman translation, ch. XIV, verses ${sig.stanza}, 39–41${r ? `, ${r.stanza}` : ""}`)], provisional: true,
      });
    }
    return [{ id: "prasna", title: "The birth-chart houses", kicker: "Prasna Marga", paras }];
  },
};
