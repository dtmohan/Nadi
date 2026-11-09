import { LAGNA_NATURE } from "./parashari-data";
import { SIGNS, PLANETS } from "./astro";
import { translate } from "./localization";

// Snapshots preserve verse-specific limits: a pair-only yoga must never become a single-planet yoga.
const NOTES: Record<number, { en: string; ml: string; plainEn?: string; plainMl?: string }> = {
  0: {
    en: "Mars, though 8th lord, helps the benefics. Saturn and Jupiter together give no yoga; Jupiter under a malefic turns bad. Saturn kills only in Venus's company.",
    plainEn: "Mars, though 8th lord, helps the benefics. Saturn and Jupiter together give no yoga; Jupiter under a malefic turns bad. Saturn acts as maraka only in Venus's company.",
    ml: "ചൊവ്വ എട്ടാം അധിപനാണെങ്കിലും ശുഭഗ്രഹങ്ങളെ സഹായിക്കുന്നു. ശനിയും വ്യാഴവും ഒരുമിച്ച് യോഗം നൽകുന്നില്ല; പാപഗ്രഹത്തിന്റെ സ്വാധീനത്തിലുള്ള വ്യാഴം ദോഷകരമാകുന്നു. ശനിക്കു ശുക്രന്റെ കൂട്ടത്തിൽ മാത്രമേ കൊല്ലാൻ കഴിയൂ.",
    plainMl: "ചൊവ്വ എട്ടാം അധിപനാണെങ്കിലും ശുഭഗ്രഹങ്ങളെ സഹായിക്കുന്നു. ശനിയും വ്യാഴവും ഒരുമിച്ച് യോഗം നൽകുന്നില്ല; പാപഗ്രഹത്തിന്റെ സ്വാധീനത്തിലുള്ള വ്യാഴം ദോഷകരമാകുന്നു. ശനി ശുക്രന്റെ കൂട്ടത്തിൽ മാത്രമേ മാരകമായി പ്രവർത്തിക്കൂ.",
  },
  1: { en: "Saturn gives raja yoga, owning the 9th and 10th. Mercury is mildly auspicious.", ml: "ഒമ്പതിന്റെയും പത്തിന്റെയും അധിപനായ ശനി രാജയോഗം നൽകുന്നു. ബുധൻ നേരിയ തോതിൽ ശുഭനാണ്." },
  2: {
    en: "Venus is the only benefic. The Moon is the prime killer, by association.",
    plainEn: "Venus is the only benefic. The Moon is the prime maraka, by association.",
    ml: "ശുക്രൻ മാത്രമാണ് ശുഭഗ്രഹം. ചന്ദ്രൻ ബന്ധം മൂലം പ്രധാന മരണകാരകനാണ്.",
    plainMl: "ശുക്രൻ മാത്രമാണ് ശുഭഗ്രഹം. ചന്ദ്രൻ ബന്ധം മൂലം പ്രധാന മാരകമാണ്.",
  },
  3: { en: "Mars alone gives a full yoga, owning the 5th and 10th.", ml: "അഞ്ചിന്റെയും പത്തിന്റെയും അധിപനായ ചൊവ്വ ഒറ്റയ്ക്കുതന്നെ പൂർണ യോഗം നൽകുന്നു." },
  4: { en: "Mars owns the 4th and 9th and is yogakaraka by the general rule of 34.13-14; the verse names it only as auspicious. Jupiter and Venus together give no good, though they own a trine and an angle.", ml: "ചൊവ്വ നാലിന്റെയും ഒമ്പതിന്റെയും അധിപനാണ്; 34.13–14-ലെ പൊതുനിയമമനുസരിച്ച് യോഗകാരകനുമാണ്. ശ്ലോകം അതിനെ ശുഭനായി മാത്രമാണ് പറയുന്നത്. വ്യാഴവും ശുക്രനും ത്രികോണത്തിന്റെയും കേന്ദ്രത്തിന്റെയും അധിപന്മാരാണെങ്കിലും ഒന്നിച്ച് നന്മ നൽകുന്നില്ല." },
  5: {
    en: "The verse names Venus and Mercury in the dual as the two yogakarakas (bhārgavendusutāv eva bhavetāṃ yogakārakau): Venus owns the 9th trine, Mercury the 10th angle, and they give the yoga only as a pair — neither owns an angle and a trine alone. Venus is also a killer. The Sun follows its company.",
    plainEn: "The verse names Venus and Mercury in the dual as the two yogakarakas (bhārgavendusutāv eva bhavetāṃ yogakārakau): Venus owns the 9th trine, Mercury the 10th angle, and they give the yoga only as a pair — neither owns an angle and a trine alone. Venus is also a maraka. The Sun follows its company.",
    ml: "ശ്ലോകം ശുക്രനെയും ബുധനെയും ദ്വിവചനത്തിൽ രണ്ടു യോഗകാരകരായി പറയുന്നു (bhārgavendusutāv eva bhavetāṃ yogakārakau): ശുക്രൻ ഒമ്പതാം ത്രികോണത്തിന്റെയും ബുധൻ പത്താം കേന്ദ്രത്തിന്റെയും അധിപനാണ്; ഇവർ ഒരുമിച്ച് മാത്രമേ യോഗം നൽകൂ. രണ്ടിലൊന്നും ഒറ്റയ്ക്ക് കേന്ദ്രത്തിന്റെയും ത്രികോണത്തിന്റെയും അധിപനല്ല. ശുക്രൻ മരണകാരകനുമാണ്. സൂര്യൻ തനിക്കൊപ്പമുള്ളവരുടെ സ്വഭാവം പിന്തുടരുന്നു.",
    plainMl: "ശ്ലോകം ശുക്രനെയും ബുധനെയും ദ്വിവചനത്തിൽ രണ്ടു യോഗകാരകരായി പറയുന്നു (bhārgavendusutāv eva bhavetāṃ yogakārakau): ശുക്രൻ ഒമ്പതാം ത്രികോണത്തിന്റെയും ബുധൻ പത്താം കേന്ദ്രത്തിന്റെയും അധിപനാണ്; ഇവർ ഒരുമിച്ച് മാത്രമേ യോഗം നൽകൂ. രണ്ടിലൊന്നും ഒറ്റയ്ക്ക് കേന്ദ്രത്തിന്റെയും ത്രികോണത്തിന്റെയും അധിപനല്ല. ശുക്രൻ മാരകവുമാണ്. സൂര്യൻ തനിക്കൊപ്പമുള്ളവരുടെ സ്വഭാവം പിന്തുടരുന്നു.",
  },
  6: {
    en: "Saturn alone owns the 4th angle and the 5th trine, and is the single-planet yogakaraka by 34.13-14; the verse names it only as auspicious. The Moon and Mercury become the two karakas of raja yoga (bhavetāṃ rājayogasya kārakau, dual) — the 10th and 9th lords, a yoga only as a pair. Jupiter and the other malefics can also kill.",
    plainEn: "Saturn alone owns the 4th angle and the 5th trine, and is the single-planet yogakaraka by 34.13-14; the verse names it only as auspicious. The Moon and Mercury become the two karakas of raja yoga (bhavetāṃ rājayogasya kārakau, dual) — the 10th and 9th lords, a yoga only as a pair. Jupiter and the other malefics can also act as maraka.",
    ml: "നാലാം കേന്ദ്രത്തിന്റെയും അഞ്ചാം ത്രികോണത്തിന്റെയും അധിപൻ ശനി മാത്രമാണ്; 34.13–14 അനുസരിച്ച് അത് ഒറ്റഗ്രഹ യോഗകാരകനാണ്. ശ്ലോകം അതിനെ ശുഭനായി മാത്രമാണ് പറയുന്നത്. പത്തിന്റെയും ഒമ്പതിന്റെയും അധിപന്മാരായ ചന്ദ്രനും ബുധനും രാജയോഗത്തിന്റെ രണ്ടു കാരകരാകുന്നു (bhavetāṃ rājayogasya kārakau, ദ്വിവചനം); ഒരുമിച്ചുള്ള യോഗം മാത്രമാണിത്. വ്യാഴത്തിനും മറ്റു പാപഗ്രഹങ്ങൾക്കും കൊല്ലാനും കഴിയും.",
    plainMl: "നാലാം കേന്ദ്രത്തിന്റെയും അഞ്ചാം ത്രികോണത്തിന്റെയും അധിപൻ ശനി മാത്രമാണ്; 34.13–14 അനുസരിച്ച് അത് ഒറ്റഗ്രഹ യോഗകാരകനാണ്. ശ്ലോകം അതിനെ ശുഭനായി മാത്രമാണ് പറയുന്നത്. പത്തിന്റെയും ഒമ്പതിന്റെയും അധിപന്മാരായ ചന്ദ്രനും ബുധനും രാജയോഗത്തിന്റെ രണ്ടു കാരകരാകുന്നു (bhavetāṃ rājayogasya kārakau, ദ്വിവചനം); ഒരുമിച്ചുള്ള യോഗം മാത്രമാണിത്. വ്യാഴത്തിനും മറ്റു പാപഗ്രഹങ്ങൾക്കും മാരകമായി പ്രവർത്തിക്കാം.",
  },
  7: {
    en: "The verse names the Sun and the Moon in the dual as the two yogakarakas (sūryācandramasāv eva bhavetāṃ yogakārakau): the Sun owns the 10th angle, the Moon the 9th trine, and the yoga comes only from the pair — this lagna has no single-planet yogakaraka. Venus and the other malefics acquire killing power.",
    plainEn: "The verse names the Sun and the Moon in the dual as the two yogakarakas (sūryācandramasāv eva bhavetāṃ yogakārakau): the Sun owns the 10th angle, the Moon the 9th trine, and the yoga comes only from the pair — this lagna has no single-planet yogakaraka. Venus and the other malefics acquire maraka power.",
    ml: "ശ്ലോകം സൂര്യനെയും ചന്ദ്രനെയും ദ്വിവചനത്തിൽ രണ്ടു യോഗകാരകരായി പറയുന്നു (sūryācandramasāv eva bhavetāṃ yogakārakau): സൂര്യൻ പത്താം കേന്ദ്രത്തിന്റെയും ചന്ദ്രൻ ഒമ്പതാം ത്രികോണത്തിന്റെയും അധിപനാണ്; ഈ ജോഡിയിൽനിന്നു മാത്രമാണ് യോഗം. ഈ ലഗ്നത്തിന് ഒറ്റഗ്രഹ യോഗകാരകനില്ല. ശുക്രനും മറ്റു പാപഗ്രഹങ്ങൾക്കും കൊല്ലാനുള്ള ശക്തി ലഭിക്കുന്നു.",
    plainMl: "ശ്ലോകം സൂര്യനെയും ചന്ദ്രനെയും ദ്വിവചനത്തിൽ രണ്ടു യോഗകാരകരായി പറയുന്നു (sūryācandramasāv eva bhavetāṃ yogakārakau): സൂര്യൻ പത്താം കേന്ദ്രത്തിന്റെയും ചന്ദ്രൻ ഒമ്പതാം ത്രികോണത്തിന്റെയും അധിപനാണ്; ഈ ജോഡിയിൽനിന്നു മാത്രമാണ് യോഗം. ഈ ലഗ്നത്തിന് ഒറ്റഗ്രഹ യോഗകാരകനില്ല. ശുക്രനും മറ്റു പാപഗ്രഹങ്ങൾക്കും മാരകശക്തി ലഭിക്കുന്നു.",
  },
  8: {
    en: "Only Venus is inauspicious. The yoga arises through the Sun and Mercury together (yogo bhāskarasaumyābhyām, dual instrumental) — the 9th and 10th lords as a pair, not singly. Saturn is the killer.",
    plainEn: "Only Venus is inauspicious. The yoga arises through the Sun and Mercury together (yogo bhāskarasaumyābhyām, dual instrumental) — the 9th and 10th lords as a pair, not singly. Saturn is the maraka.",
    ml: "ശുക്രൻ മാത്രമാണ് അശുഭൻ. ഒമ്പതിന്റെയും പത്തിന്റെയും അധിപന്മാരായ സൂര്യനും ബുധനും ഒരുമിച്ചാണ് യോഗം ഉണ്ടാകുന്നത്; ഒറ്റയ്ക്കല്ല (yogo bhāskarasaumyābhyām, ദ്വിവചന തൃതീയാവിഭക്തി). ശനി മരണകാരകനാണ്.",
    plainMl: "ശുക്രൻ മാത്രമാണ് അശുഭൻ. ഒമ്പതിന്റെയും പത്തിന്റെയും അധിപന്മാരായ സൂര്യനും ബുധനും ഒരുമിച്ചാണ് യോഗം ഉണ്ടാകുന്നത്; ഒറ്റയ്ക്കല്ല (yogo bhāskarasaumyābhyām, ദ്വിവചന തൃതീയാവിഭക്തി). ശനി മാരകമാണ്.",
  },
  9: {
    en: "Only Venus gives a superior yoga, owning the 5th and 10th. Saturn does not kill on its own.",
    plainEn: "Only Venus gives a superior yoga, owning the 5th and 10th. Saturn is not a maraka on its own.",
    ml: "അഞ്ചിന്റെയും പത്തിന്റെയും അധിപനായ ശുക്രൻ മാത്രമാണ് ഉയർന്ന യോഗം നൽകുന്നത്. ശനി ഒറ്റയ്ക്ക് കൊല്ലുന്നില്ല.",
    plainMl: "അഞ്ചിന്റെയും പത്തിന്റെയും അധിപനായ ശുക്രൻ മാത്രമാണ് ഉയർന്ന യോഗം നൽകുന്നത്. ശനി ഒറ്റയ്ക്ക് മാരകമല്ല.",
  },
  10: { en: "Venus is the only raja yoga planet, owning the 4th and 9th. Mercury gives mixed effects.", ml: "നാലിന്റെയും ഒമ്പതിന്റെയും അധിപനായ ശുക്രൻ മാത്രമാണ് രാജയോഗഗ്രഹം. ബുധൻ സമ്മിശ്ര ഫലങ്ങൾ നൽകുന്നു." },
  11: {
    en: "The verse names Mars and Jupiter in the dual as the two yogakarakas (mahīsutagurū yogakārakau): Mars owns the 9th trine, Jupiter the 10th angle, and they give the yoga only as a pair. Mars is a killer but not on its own.",
    plainEn: "The verse names Mars and Jupiter in the dual as the two yogakarakas (mahīsutagurū yogakārakau): Mars owns the 9th trine, Jupiter the 10th angle, and they give the yoga only as a pair. Mars is a maraka but not on its own.",
    ml: "ശ്ലോകം ചൊവ്വയെയും വ്യാഴത്തെയും ദ്വിവചനത്തിൽ രണ്ടു യോഗകാരകരായി പറയുന്നു (mahīsutagurū yogakārakau): ചൊവ്വ ഒമ്പതാം ത്രികോണത്തിന്റെയും വ്യാഴം പത്താം കേന്ദ്രത്തിന്റെയും അധിപനാണ്; ഇവർ ഒരുമിച്ച് മാത്രമേ യോഗം നൽകൂ. ചൊവ്വ മരണകാരകനാണ്, പക്ഷേ ഒറ്റയ്ക്കല്ല.",
    plainMl: "ശ്ലോകം ചൊവ്വയെയും വ്യാഴത്തെയും ദ്വിവചനത്തിൽ രണ്ടു യോഗകാരകരായി പറയുന്നു (mahīsutagurū yogakārakau): ചൊവ്വ ഒമ്പതാം ത്രികോണത്തിന്റെയും വ്യാഴം പത്താം കേന്ദ്രത്തിന്റെയും അധിപനാണ്; ഇവർ ഒരുമിച്ച് മാത്രമേ യോഗം നൽകൂ. ചൊവ്വ മാരകമാണ്, പക്ഷേ ഒറ്റയ്ക്കല്ല.",
  },
};

export function parashariLagnaNatureMalayalam(index: number, source: string, plain: boolean): string | undefined {
  const note = NOTES[index], nature = LAGNA_NATURE[index], sign = SIGNS[index];
  if (!note || !nature || nature.note !== note.en || !sign) return undefined;
  const groups = [nature.auspicious, nature.malefic, nature.yogakaraka, ...(nature.yogaPair ? [nature.yogaPair] : [])];
  if (groups.some((g) => g.some((p) => !(PLANETS as readonly string[]).includes(p) || translate("ml", p) === p))) return undefined;
  const list = (v: string[]) => v.length === 0 ? "" : v.length === 1 ? v[0] : `${v.slice(0, -1).join(", ")} and ${v[v.length - 1]}`;
  const noteSource = plain ? note.plainEn ?? note.en : note.en;
  const expected = `Parashara reads from the rising sign. With ${sign} rising, ${list(nature.auspicious)} ${nature.auspicious.length === 1 ? "is" : "are"} auspicious and ${list(nature.malefic)} ${nature.malefic.length === 1 ? "is" : "are"} not${nature.yogakaraka.length ? `; ${list(nature.yogakaraka)} can give yoga alone, owning an angle and a trine` : ""}${nature.yogaPair ? `; ${nature.yogaPair[0]} and ${nature.yogaPair[1]} give the raja yoga only as a pair, the verse naming the two in the dual` : ""}. ${noteSource}`;
  if (source !== expected) return undefined;
  const names = (v: string[]) => v.map((p) => translate("ml", p)).join(", ");
  return `പരാശരൻ ലഗ്നരാശിയിൽനിന്നാണ് വായിക്കുന്നത്. ${translate("ml", sign)} ലഗ്നത്തിൽ ${names(nature.auspicious)} ശുഭരും ${names(nature.malefic)} ശുഭരല്ലാത്തവരുമാണ്${nature.yogakaraka.length ? `; കേന്ദ്രത്തിന്റെയും ത്രികോണത്തിന്റെയും അധിപനായ ${names(nature.yogakaraka)} ഒറ്റയ്ക്ക് യോഗം നൽകാം` : ""}${nature.yogaPair ? `; ${names(nature.yogaPair)} ഒരുമിച്ചു മാത്രമേ രാജയോഗം നൽകൂ; ശ്ലോകം ഇവരെ ദ്വിവചനത്തിലാണ് പറയുന്നത്` : ""}. ${plain ? note.plainMl ?? note.ml : note.ml}`;
}
