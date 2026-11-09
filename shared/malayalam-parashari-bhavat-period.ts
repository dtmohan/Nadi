import { DateTime } from "luxon";
import { SIGNS } from "./astro";
import { ordH, thePlanet } from "./house-gloss";
import { translate } from "./localization";
import { BOOK_PAIRS, LORD_DISTANCE, lordDistance } from "./parashari-bhavat";
import type { PairPeriod, TopicPeriod, TopicPeriodsInput } from "./parashari-topic-periods";

const PAIR_SNAPSHOT = [
  { base: 5, house: 9, text: "grandchildren, and the 5th's intellect grown into wisdom", plain: "grandchildren, and learning that grows into wisdom", ml: "കൊച്ചുമക്കളെയും അഞ്ചാം ഭാവത്തിന്റെ ബുദ്ധി വിവേകമായി വളരുന്നതിനെയും", plainMl: "കൊച്ചുമക്കളെയും പഠനം വിവേകമായി വളരുന്നതിനെയും" },
  { base: 10, house: 7, text: "business and trade, weighed against the employment of the 10th", plain: "business and trade of your own, set beside the job your 10th house shows", ml: "പത്താം ഭാവത്തിലെ ജോലിയുമായി താരതമ്യം ചെയ്തുള്ള വ്യാപാരവും വാണിജ്യവും", plainMl: "പത്താം ഭാവം കാണിക്കുന്ന ജോലിക്കൊപ്പം സ്വന്തം വ്യാപാരവും വാണിജ്യവും" },
];

/** Translate a pair only when its complete source sentence and book-reading snapshot match. */
export function bhavatPairMalayalam(p: PairPeriod, pair: { base: number; house: number }, source: string, plain: boolean): string | undefined {
  const book = BOOK_PAIRS.find((x) => x.base === pair.base && x.house === pair.house);
  const snapshot = PAIR_SNAPSHOT.find((x) => x.base === pair.base && x.house === pair.house);
  if (!book || !snapshot || book.text !== snapshot.text || book.plain !== snapshot.plain) return undefined;
  const start = DateTime.fromISO(p.start).toUTC(), end = DateTime.fromISO(p.end).toUTC();
  if (!start.isValid || !end.isValid) return undefined;
  const planet = translate("ml", p.lord);
  if (planet === p.lord) return undefined;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const en = `${p.lord} dasa, ${start.toFormat("LLL yyyy")} to ${end.toFormat("LLL yyyy")} (ages ${Math.floor(p.ageStart)}-${Math.floor(p.ageEnd)})${p.current ? ", running" : ""}: lord of the ${ordH(pair.house)}, the ${ordH(pair.base)} from the ${ordH(pair.base)}; Shweta reads the ${ordH(pair.house)} as ${snapshot.text} (§2.2).`;
  const enPlain = `${cap(thePlanet(p.lord))}'s period, ${start.toFormat("LLLL yyyy")} to ${end.toFormat("LLLL yyyy")} (ages ${Math.floor(p.ageStart)} to ${Math.floor(p.ageEnd)})${p.current ? ", running now" : ""}: ${thePlanet(p.lord)} rules your ${ordH(pair.house)} house, the ${ordH(pair.base)} counted from your ${ordH(pair.base)}, which Shweta, a modern author, reads as ${snapshot.plain}.`;
  if (source !== (plain ? enPlain : en)) return undefined;
  const dates = `${start.setLocale("ml-IN").toFormat("LLLL yyyy")} മുതൽ ${end.setLocale("ml-IN").toFormat("LLLL yyyy")} വരെ`;
  const ages = `പ്രായം ${Math.floor(p.ageStart)} മുതൽ ${Math.floor(p.ageEnd)} വരെ`;
  return plain
    ? `${planet}-ന്റെ കാലയളവ്, ${dates} (${ages})${p.current ? ", ഇപ്പോൾ നടക്കുന്നു" : ""}: ${planet} നിങ്ങളുടെ ${pair.house}-ാം ഭാവത്തിന്റെ അധിപനാണ്. അത് നിങ്ങളുടെ ${pair.base}-ാം ഭാവത്തിൽനിന്ന് എണ്ണുന്ന ${pair.base}-ാം ഭാവമാണ്; ആധുനിക എഴുത്തുകാരിയായ ശ്വേത അത് ${snapshot.plainMl} ആയി വായിക്കുന്നു.`
    : `${planet} ദശ, ${dates} (${ages})${p.current ? ", ഇപ്പോൾ നടക്കുന്നു" : ""}: ${pair.house}-ാം ഭാവാധിപൻ; അത് ${pair.base}-ാം ഭാവത്തിൽനിന്നുള്ള ${pair.base}-ാം ഭാവമാണ്. ശ്വേത ${pair.house}-ാം ഭാവത്തെ ${snapshot.ml} ആയി വായിക്കുന്നു (§2.2).`;
}

// Practitioner and softened source snapshots, paired with their Malayalam paraphrases.
const DISTANCE_SNAPSHOT = [
  ["the house run by its own lord, secure and working with its own means", "a house that runs on its own means", "§1.3", "സ്വന്തം അധിപൻ ഭരിക്കുന്ന, സുരക്ഷിതവും സ്വന്തം വിഭവങ്ങളാൽ പ്രവർത്തിക്കുന്നതുമായ ഭാവം", "സ്വന്തം വിഭവങ്ങളാൽ പ്രവർത്തിക്കുന്ന ഭാവം"],
  ["wealth and accumulation", "growth in money and resources", "§2.3, §14.12", "ധനവും ശേഖരണവും", "പണത്തിലും വിഭവങ്ങളിലും വളർച്ച"],
  ["effort", "results that come through your own effort", "§14.1", "പരിശ്രമം", "സ്വന്തം പരിശ്രമത്തിലൂടെ വരുന്ന ഫലങ്ങൾ"],
  ["comfort and a stable base", "comfort and a stable base", "§13.1, §14.2", "സുഖവും സുസ്ഥിരമായ അടിത്തറയും", "സുഖവും സുസ്ഥിരമായ അടിത്തറയും"],
  ["intelligence, romance and children, a trine to the house", "intelligence, creativity and children", "§10.11, §12.1", "ബുദ്ധി, പ്രണയം, സന്താനം; ഭാവത്തിൽനിന്നുള്ള ത്രികോണം", "ബുദ്ധി, സർഗാത്മകത, സന്താനം"],
  ["delay, dispute or hard labour", "steady work and patience", "ch. 2, key takeaways", "കാലതാമസം, തർക്കം അല്ലെങ്കിൽ കഠിനാധ്വാനം", "തുടർച്ചയായ പരിശ്രമവും ക്ഷമയും"],
  ["a mutual gaze with its own house", "a strong, direct link back to the house", "§10.1", "സ്വന്തം ഭാവവുമായി പരസ്പര ദൃഷ്ടി", "ഭാവവുമായുള്ള ശക്തവും നേരിട്ടുള്ളതുമായ ബന്ധം"],
  ["sudden change, transformation or hidden crisis", "change and renewal", "§2.3, §12.4", "പെട്ടെന്നുള്ള മാറ്റം, രൂപാന്തരം അല്ലെങ്കിൽ മറഞ്ഞ പ്രതിസന്ധി", "മാറ്റവും പുതുക്കലും"],
  ["luck and dharma", "good fortune and guidance", "§10.3, §14.7", "ഭാഗ്യവും ധർമ്മവും", "ഭാഗ്യവും മാർഗനിർദേശവും"],
  ["action, career and authority", "visible action and standing", "§2.2", "പ്രവൃത്തി, തൊഴിൽ, അധികാരം", "ദൃശ്യമായ പ്രവർത്തനവും സ്ഥാനവും"],
  ["gains", "gains", "§9.4", "നേട്ടങ്ങൾ", "നേട്ടങ്ങൾ"],
  ["loss, expenditure or letting go", "spending or letting go", "§2.2, §14.10", "നഷ്ടം, ചെലവ് അല്ലെങ്കിൽ വിട്ടുകൊടുക്കൽ", "ചെലവഴിക്കൽ അല്ലെങ്കിൽ വിട്ടുകൊടുക്കൽ"],
] as const;

/** Translate the complete delivery aside only after recreating it from the selected chart. */
export function bhavatDeliveryMalayalam(par: TopicPeriodsInput, p: TopicPeriod, source: string, plain: boolean): string | undefined {
  if (!p.houses.length || !p.delivery) return undefined;
  const rows = p.houses.map((h, i) => lordDistance(par, h, i > 0));
  if (rows.some((r) => r.lord !== p.lord)) return undefined;
  const expected = rows.map((r) => plain ? r.textPlain : r.text).join(" ");
  if (source !== expected) return undefined;
  const parts: string[] = [];
  for (const row of rows) {
    const b = par.bhavas.find((x) => x.house === row.house), snapshot = DISTANCE_SNAPSHOT[row.places - 1], original = LORD_DISTANCE[row.places - 1];
    if (!b || !snapshot || !original || original.text !== snapshot[0] || original.plain !== snapshot[1] || original.cite !== snapshot[2]) return undefined;
    const sign = SIGNS[b.signIndex], lordSign = SIGNS[b.lordSignIndex];
    if (!sign || !lordSign) return undefined;
    const signMl = translate("ml", sign), lordSignMl = translate("ml", lordSign), planetMl = translate("ml", row.lord);
    if (signMl === sign || lordSignMl === lordSign || planetMl === row.lord) return undefined;
    parts.push(plain
      ? `നിങ്ങളുടെ ${row.house}-ാം ഭാവത്തിനായി ഉപയോഗിക്കുന്ന ${signMl} രാശിയിൽനിന്ന് എണ്ണുമ്പോൾ ${lordSignMl} രാശിയിലുള്ള ${planetMl} ${row.places}-ാം രാശിയിലാണ്; തിരഞ്ഞെടുത്ത ഭാവരീതിയിൽ ഇത് നിങ്ങളുടെ ${row.lordIn}-ാം ഭാവത്തിലാണ്. ആധുനിക എഴുത്തുകാരിയായ ശ്വേത ഈ രാശിയെണ്ണത്തെ ${snapshot[4]} ആയി വായിക്കുന്നു${row.resonance ? "; ഭാവം ഫലപ്രാപ്തിയിലെത്തുന്നതായും വായിക്കുന്നു" : ""}.`
      : `${row.house}-ാം ഭാവത്തിനായി ഉപയോഗിക്കുന്ന ${signMl} രാശിയിൽനിന്ന് എണ്ണുമ്പോൾ ${lordSignMl} രാശിയിലുള്ള ${planetMl} ${row.places}-ാം രാശിയിലാണ്; തിരഞ്ഞെടുത്ത ഭാവസ്ഥാനം ${row.lordIn}-ാം ഭാവമാണ്. ശ്വേത ഈ രാശിയെണ്ണത്തെ ${snapshot[3]} ആയി വായിക്കുന്നു (${snapshot[2]})${row.resonance ? "; ലഗ്നത്തിൽനിന്നും അധിപനിലേക്കുമുള്ള തുല്യ രാശിയെണ്ണത്തെ ഭാവത്തിന്റെ ഫലപ്രാപ്തിയായും വായിക്കുന്നു (§2.2)" : ""}.`);
  }
  return parts.join(" ");
}
