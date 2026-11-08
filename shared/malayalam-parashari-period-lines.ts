/** Complete, closed-set translations of BPHS 47.5–6 and 48.2–7 period lines. */
import { SIGNS } from "./astro";
import { translate } from "./localization";

const lordLines: Record<string, string> = {
  "As lord of the 1st: physical well-being.": "1-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: ശാരീരിക സൗഖ്യം.",
  "As lord of the 2nd: distress and a threat to life (maraka).": "2-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: വിഷമവും ജീവന് ഭീഷണിയും (മാരകം).",
  "As lord of the 3rd: unfavourable results.": "3-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: പ്രതികൂല ഫലങ്ങൾ.",
  "As lord of the 4th: acquisition of house and land.": "4-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: വീടും ഭൂമിയും ലഭിക്കൽ.",
  "As lord of the 5th: progress in learning, happiness from children.": "5-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: പഠനത്തിൽ പുരോഗതി, സന്താനത്തിലൂടെ സന്തോഷം.",
  "As lord of the 6th: danger from enemies and ill health.": "6-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: ശത്രുക്കളിൽനിന്നുള്ള അപകടവും ആരോഗ്യക്കുറവും.",
  "As lord of the 7th: distress to the spouse and a threat to life (maraka).": "7-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: പങ്കാളിക്കു വിഷമവും ജീവന് ഭീഷണിയും (മാരകം).",
  "As lord of the 8th: danger to life and financial losses.": "8-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: ജീവന് അപകടവും സാമ്പത്തിക നഷ്ടങ്ങളും.",
  "As lord of the 9th: learning, religious inclination, unexpected gains.": "9-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: അറിവ്, മതാഭിമുഖ്യം, അപ്രതീക്ഷിത നേട്ടങ്ങൾ.",
  "As lord of the 10th: recognition and awards from authority.": "10-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: അധികാരികളിൽനിന്നുള്ള അംഗീകാരവും പുരസ്കാരങ്ങളും.",
  "As lord of the 11th: obstacles to gains and possible disease.": "11-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: നേട്ടങ്ങൾക്ക് തടസ്സങ്ങളും രോഗസാധ്യതയും.",
  "As lord of the 12th: distress and danger from disease.": "12-ാം ഭാവാധിപൻ എന്ന നിലയിൽ: വിഷമവും രോഗം മൂലമുള്ള അപകടവും.",
};
const positive: Record<string, string> = {
  "in the lagna": "ലഗ്നത്തിലാണ്", exalted: "ഉച്ചസ്ഥിതിയിലാണ്", moolatrikona: "മൂലത്രികോണത്തിലാണ്",
  "own sign": "സ്വക്ഷേത്രത്തിലാണ്", "in a friendly sign": "മിത്രരാശിയിലാണ്",
};
const weak: Record<string, string> = { debilitated: "നീചസ്ഥിതിയിലാണ്", inimical: "ശത്രുരാശിയിലാണ്" };
const planets = "Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu";

export function parashariPeriodLineMalayalam(source: string): string | undefined {
  if (lordLines[source]) return lordLines[source];
  let match = source.match(new RegExp(`^(${planets}) is (in the lagna|exalted|moolatrikona|own sign|in a friendly sign) \\(([^()]+)\\): the general rule reads the dasa as favourable\\.$`));
  if (match) {
    const [, p, state, sign] = match;
    if (!SIGNS.includes(sign as typeof SIGNS[number])) return undefined;
    const pm = translate("ml", p), sm = translate("ml", sign);
    if (pm === p || sm === sign) return undefined;
    return `${pm} ${sm} രാശിയിൽ ${positive[state]}; പൊതുനിയമം ഈ ദശയെ അനുകൂലമായി വായിക്കുന്നു.`;
  }
  match = source.match(new RegExp(`^(${planets}) is (in the (6th|8th|12th)|debilitated|inimical)(?: and (debilitated|inimical))?: the general rule reads the dasa as unfavourable\\.$`));
  if (!match) return undefined;
  const [, p, state, house, second] = match;
  if (second && !house) return undefined;
  const pm = translate("ml", p);
  if (pm === p) return undefined;
  const place = house ? `${parseInt(house, 10)}-ാം ഭാവത്തിലാണ്` : weak[state];
  return `${pm} ${place}${second ? `; കൂടാതെ ${weak[second]}` : ""}. പൊതുനിയമം ഈ ദശയെ പ്രതികൂലമായി വായിക്കുന്നു.`;
}
