import { CHARA_KARAKA_INFO, type CharaKarakaId, type JaiminiResult } from "./jaimini";
import { translate } from "./localization";
import { fmtDate, fmtMonth, list, ORD } from "./report/types";
import type { InduLagnaResult } from "./indu-lagna";
import type { Sign } from "./astro";

const names: Record<CharaKarakaId, [string, string]> = {
  AK: ["Atmakaraka", "ആത്മകാരകൻ"], AmK: ["Amatyakaraka", "അമാത്യകാരകൻ"], BK: ["Bhratrikaraka", "ഭ്രാതൃകാരകൻ"], MK: ["Matrikaraka", "മാതൃകാരകൻ"],
  PiK: ["Pitrikaraka", "പിതൃകാരകൻ"], PK: ["Putrakaraka", "പുത്രകാരകൻ"], GK: ["Gnatikaraka", "ജ്ഞാതികാരകൻ"], DK: ["Darakaraka", "ദാരകാരകൻ"],
};
const translated = (s: string) => { const m = translate("ml", s); return m !== s ? m : undefined; };

/** Only translate the exact list already withheld by the age gate. */
export function jaiminiHeldMalayalam(held: string[], source: string): string | undefined {
  const labels: Record<string, string> = {
    "self & purpose": "സ്വയവും ജീവിതലക്ഷ്യവും", "career & position": "തൊഴിലും സ്ഥാനവും", "wealth & gains": "ധനവും നേട്ടങ്ങളും",
    "marriage & partnership": "വിവാഹവും പങ്കാളിത്തവും", "children & learning": "സന്താനവും പഠനവും",
    "parents, siblings & home": "മാതാപിതാക്കളും സഹോദരങ്ങളും വീടും", "health & conflict": "ആരോഗ്യവും സംഘർഷവും",
  };
  if (!held.length || held.some((x) => !labels[x]) || source !== `Held for later at this age: ${list(held)}.`) return undefined;
  return `ഈ പ്രായത്തിൽ പിന്നീട് കാണിക്കാൻ മാറ്റിവച്ച വിഷയങ്ങൾ: ${held.map((x) => labels[x]).join(", ")}.`;
}

/** All roles, planets and signs must match the whole source paragraph. */
export function jaiminiLeadMalayalam(j: JaiminiResult, source: string): string | undefined {
  const ak = j.karakas[0];
  if (!ak || !j.arudhas[0] || !j.arudhas[11]) return undefined;
  if (j.karakas.some((k) => !names[k.karaka] || CHARA_KARAKA_INFO[k.karaka].name !== names[k.karaka][0])) return undefined;
  const expected = `Jaimini ranks the planets by their degrees. ${ak.planet} is the Atmakaraka, the self; ${list(j.karakas.slice(1).map((k) => `${k.planet} the ${CHARA_KARAKA_INFO[k.karaka].name}`))}. The Karakamsa, ${ak.planet}'s navamsa sign, is ${j.karakamsa.sign}; the Arudha Lagna is ${j.arudhas[0].sign} and the Upapada ${j.arudhas[11].sign}.`;
  const ps = j.karakas.map((k) => translated(k.planet));
  const signs = [j.karakamsa.sign, j.arudhas[0].sign, j.arudhas[11].sign].map(translated);
  if (source !== expected || ps.some((p) => !p) || signs.some((s) => !s)) return undefined;
  const roles = j.karakas.slice(1).map((k, i) => `${ps[i + 1]} ${names[k.karaka][1]}`);
  return `ജൈമിനി ഗ്രഹങ്ങളെ അവയുടെ അംശമനുസരിച്ച് ക്രമപ്പെടുത്തുന്നു. സ്വയത്തെ സൂചിപ്പിക്കുന്ന ആത്മകാരകൻ ${ps[0]} ആണ്; ${roles.join(", ")}. ${ps[0]}-ന്റെ നവാംശരാശിയായ കാരകാംശം ${signs[0]} ആണ്; ആരൂഢലഗ്നം ${signs[1]} രാശിയിലും ഉപപദം ${signs[2]} രാശിയിലുമാണ്.`;
}

/** Preserve whether the reading is current or at passing, all dates and every next period. */
export function jaiminiPeriodMalayalam(j: JaiminiResult, lifeAt: string, deceased: boolean, source: string): string | undefined {
  const md = j.charaDasha.periods.find((p) => p.start <= lifeAt && lifeAt < p.end);
  if (!md) return undefined;
  const ad = md.antardashas.find((a) => a.start <= lifeAt && lifeAt < a.end);
  const next = j.charaDasha.periods.filter((p) => p.start > lifeAt).slice(0, 3);
  const expected = `${deceased ? "At the date of passing the" : "The"} Chara dasha ${deceased ? "was" : "is"} ${md.signName} (${fmtDate(md.start)} to ${fmtDate(md.end)}, ${md.years} years)${ad ? `, ${ad.signName} antardasha` : ""}.${next.length && !deceased ? ` Next come ${list(next.map((p) => `${p.signName} (${fmtMonth(p.start)} to ${fmtMonth(p.end)})`))}.` : ""}`;
  const sign = translated(md.signName), antar = ad && translated(ad.signName);
  const following = next.map((p) => translated(p.signName));
  if (source !== expected || !sign || (ad && !antar) || (!deceased && following.some((s) => !s))) return undefined;
  const prefix = deceased ? "വിയോഗത്തീയതിയിലെ ചരദശ" : "നിലവിലെ ചരദശ";
  const later = next.length && !deceased ? ` തുടർന്ന് ${next.map((p, i) => `${following[i]} (${fmtMonth(p.start)} മുതൽ ${fmtMonth(p.end)} വരെ)`).join(", ")}.` : "";
  return `${prefix} ${sign} ആണ് (${fmtDate(md.start)} മുതൽ ${fmtDate(md.end)} വരെ, ${md.years} വർഷം)${ad ? `; അന്തർദശ ${antar}` : ""}.${later}`;
}

/** The calculation summary remains an explanation of the entered method, not an independent prediction. */
export function jaiminiInduMalayalam(i: InduLagnaResult, moonSign: Sign, source: string): string | undefined {
  const expected = `The Indu Lagna, the wealth ascendant: the 9th from the lagna is ${i.ninthFromLagna.sign} (${i.ninthFromLagna.lord}, ${i.ninthFromLagna.kala} kalas) and the 9th from the Moon in ${moonSign} is ${i.ninthFromMoon.sign} (${i.ninthFromMoon.lord}, ${i.ninthFromMoon.kala} kalas). Their sum ${i.sum} leaves a remainder of ${i.remainder} modulo twelve, so the ${ORD(i.remainder)} sign from the Moon is the Indu Lagna: ${i.sign}.${i.sameLord ? ` ${i.ninthFromLagna.lord} rules both ninths and its kalas are counted twice.` : ""}`;
  const values = [i.ninthFromLagna.sign, i.ninthFromLagna.lord, moonSign, i.ninthFromMoon.sign, i.ninthFromMoon.lord, i.sign].map(translated);
  if (source !== expected || values.some((x) => !x) || i.remainder < 1 || i.remainder > 12) return undefined;
  return `ധനലഗ്നമായ ഇന്ദുലഗ്നം: ലഗ്നത്തിൽനിന്നുള്ള ഒമ്പതാം രാശി ${values[0]} ആണ് (${values[1]}, ${i.ninthFromLagna.kala} കലകൾ); ${values[2]} രാശിയിലെ ചന്ദ്രനിൽനിന്നുള്ള ഒമ്പതാം രാശി ${values[3]} ആണ് (${values[4]}, ${i.ninthFromMoon.kala} കലകൾ). ഇവയുടെ തുകയായ ${i.sum}-നെ പന്ത്രണ്ടുകൊണ്ട് ഹരിക്കുമ്പോൾ ശിഷ്ടം ${i.remainder}; അതിനാൽ ചന്ദ്രനിൽനിന്നുള്ള ${i.remainder}-ാം രാശിയായ ${values[5]} ഇന്ദുലഗ്നമാണ്.${i.sameLord ? ` ${values[1]} രണ്ട് ഒമ്പതാം രാശികളുടെയും അധിപനായതിനാൽ അതിന്റെ കലകൾ രണ്ടുതവണ എണ്ണുന്നു.` : ""}`;
}
