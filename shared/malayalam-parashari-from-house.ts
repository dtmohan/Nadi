import { DateTime } from "luxon";
import { SIGNS } from "./astro";
import { listJoin, ordH, thePlanet } from "./house-gloss";
import { translate } from "./localization";
import { plainReasons, roleOf, type FromHouseReason } from "./parashari-bhavat";
import type { FromHousePeriod } from "./parashari-topic-periods";

type ReasonMl = { text: string; plain: string; also: string };
const ordinal = (s: string) => {
  const n = parseInt(s, 10);
  return n >= 1 && n <= 12 && ordH(n) === s ? n : undefined;
};
const where = (r: number, h: number) => r === 1 ? `in the ${ordH(h)} itself` : `in the ${ordH(r)} from the ${ordH(h)}`;
const wherePlain = (r: number, h: number) => r === 1 ? `in your ${ordH(h)} house itself` : `in the ${ordH(r)} counted from your ${ordH(h)} house`;
const whereMl = (r: number, h: number) => r === 1 ? `${h}-ാം ഭാവത്തിൽത്തന്നെ` : `${h}-ാം ഭാവത്തിൽനിന്നുള്ള ${r}-ാം സ്ഥാനത്ത്`;
const place = (text: string, h: number): number | undefined => {
  if (text === where(1, h)) return 1;
  const m = /^in the (\d+(?:st|nd|rd|th)) from the (\d+(?:st|nd|rd|th))$/.exec(text);
  if (!m || ordinal(m[2]) !== h) return undefined;
  const n = ordinal(m[1]);
  return n && text === where(n, h) ? n : undefined;
};
const complete = (r: FromHouseReason, role: FromHouseReason["role"], text: string, plain: string, also: string, ml: ReasonMl) =>
  r.role === role && r.text === text && r.plain === plain && r.plainAlso === also ? ml : undefined;

/** Each reason's full original and plain variants must match a recognized generated clause. */
function reasonMalayalam(reason: FromHouseReason, house: number): ReasonMl | undefined {
  const h = ordH(house);
  if (reason.clause === "eighth-lord") {
    const eighth = ordH(((house + 6) % 12) + 1);
    return complete(reason, "harms", `lord of the ${eighth}, the 8th from the ${h}`, `it rules your ${eighth} house, the 8th counted from your ${h}`, `it also rules your ${eighth} house, the 8th counted from your ${h}`,
      { text: `${house}-ാം ഭാവത്തിൽനിന്നുള്ള 8-ാം ഭാവമായ ${parseInt(eighth, 10)}-ാം ഭാവത്തിന്റെ അധിപൻ`, plain: `നിങ്ങളുടെ ${house}-ാം ഭാവത്തിൽനിന്നുള്ള 8-ാം ഭാവമായ ${parseInt(eighth, 10)}-ാം ഭാവത്തിന്റെ അധിപനാണ്`, also: `കൂടാതെ നിങ്ങളുടെ ${house}-ാം ഭാവത്തിൽനിന്നുള്ള 8-ാം ഭാവമായ ${parseInt(eighth, 10)}-ാം ഭാവത്തിന്റെ അധിപനുമാണ്` });
  }
  if (reason.clause === "drekkana") {
    const m = /^lord of the 22nd drekkana from the (\d+(?:st|nd|rd|th)) \(([^,]+), (\d+(?:st|nd|rd|th)) drekkana\)$/.exec(reason.text);
    if (!m || ordinal(m[1]) !== house || !SIGNS.includes(m[2] as typeof SIGNS[number]) || ![1, 2, 3].includes(ordinal(m[3]) ?? 0)) return undefined;
    const sign = translate("ml", m[2]);
    if (sign === m[2]) return undefined;
    return complete(reason, "harms", `lord of the 22nd drekkana from the ${h} (${m[2]}, ${m[3]} drekkana)`, `it rules a sensitive third of the 8th sign counted from your ${h} house`, `it also rules a sensitive third of the 8th sign counted from your ${h} house`,
      { text: `${house}-ാം ഭാവത്തിൽനിന്നുള്ള 22-ാം ദ്രേക്കാണത്തിന്റെ അധിപൻ (${sign}, ${parseInt(m[3], 10)}-ാം ദ്രേക്കാണം)`, plain: `നിങ്ങളുടെ ${house}-ാം ഭാവത്തിൽനിന്നുള്ള 8-ാം രാശിയിലെ ഒരു സെൻസിറ്റീവ് മൂന്നിലൊന്നിന്റെ അധിപനാണ്`, also: `കൂടാതെ നിങ്ങളുടെ ${house}-ാം ഭാവത്തിൽനിന്നുള്ള 8-ാം രാശിയിലെ ഒരു സെൻസിറ്റീവ് മൂന്നിലൊന്നിന്റെ അധിപനുമാണ്` });
  }
  if (reason.clause === "weak") {
    const m = /^weak by Shadbala \((\d+\.\d{2}) of the required\) (.+)$/.exec(reason.text);
    const n = m ? place(m[2], house) : undefined;
    if (!m || !n || ![6, 7, 8].includes(n)) return undefined;
    return complete(reason, "harms", `weak by Shadbala (${m[1]} of the required) ${where(n, house)}`, `it is weak and stands ${wherePlain(n, house)}`, `it is also weak and stands ${wherePlain(n, house)}`,
      { text: `ഷഡ്ബലപ്രകാരം ദുർബലമാണ് (ആവശ്യമായതിന്റെ ${m[1]}); ${whereMl(n, house)} നിൽക്കുന്നു`, plain: `ദുർബലമായി ${whereMl(n, house)} നിൽക്കുന്നു`, also: `കൂടാതെ ദുർബലമായി ${whereMl(n, house)} നിൽക്കുന്നു` });
  }
  if (reason.clause === "malefic") {
    const m = /^strong malefic (.+)$/.exec(reason.text), n = m ? place(m[1], house) : undefined;
    if (!n || ![3, 6, 11].includes(n)) return undefined;
    return complete(reason, "builds", `strong malefic ${where(n, house)}`, `it is strong and stands ${wherePlain(n, house)}, where a harsher planet helps`, `it also stands ${wherePlain(n, house)}, where a harsher planet helps`,
      { text: `ശക്തനായ പാപഗ്രഹം ${whereMl(n, house)}`, plain: `ശക്തമായി ${whereMl(n, house)} നിൽക്കുന്നു; അവിടെ കഠിന സ്വഭാവമുള്ള ഗ്രഹം സഹായിക്കുന്നു`, also: `കൂടാതെ ${whereMl(n, house)} നിൽക്കുന്നു; അവിടെ കഠിന സ്വഭാവമുള്ള ഗ്രഹം സഹായിക്കുന്നു` });
  }
  if (reason.clause === "benefic") {
    const m = /^strong benefic (.+), (a kendra and a trikona|a kendra|a trikona) from it$/.exec(reason.text), n = m ? place(m[1], house) : undefined;
    if (!m || !n || ![1, 4, 5, 7, 9, 10].includes(n)) return undefined;
    const category = n === 1 ? "a kendra and a trikona" : [4, 7, 10].includes(n) ? "a kendra" : "a trikona";
    const categoryMl = n === 1 ? "കേന്ദ്രവും ത്രികോണവും" : [4, 7, 10].includes(n) ? "കേന്ദ്രം" : "ത്രികോണം";
    return complete(reason, "builds", `strong benefic ${where(n, house)}, ${category} from it`, `it is strong, gentle by nature, and stands ${wherePlain(n, house)}`, `it is also gentle by nature and stands ${wherePlain(n, house)}`,
      { text: `ശക്തനായ ശുഭഗ്രഹം ${whereMl(n, house)}; അത് അവിടെനിന്നുള്ള ${categoryMl} ആണ്`, plain: `ശക്തവും സ്വഭാവത്തിൽ സൗമ്യവുമായ ഈ ഗ്രഹം ${whereMl(n, house)} നിൽക്കുന്നു`, also: `കൂടാതെ സ്വഭാവത്തിൽ സൗമ്യമായ ഈ ഗ്രഹം ${whereMl(n, house)} നിൽക്കുന്നു` });
  }
  if (reason.clause === "friend") {
    const m = /^strong natural friend of (the Sun|the Moon|Mars|Mercury|Jupiter|Venus|Saturn), the (\d+(?:st|nd|rd|th)) lord$/.exec(reason.text);
    if (!m || ordinal(m[2]) !== house) return undefined;
    const rawPlanet = m[1].replace(/^the /, ""), planet = translate("ml", rawPlanet);
    if (planet === rawPlanet) return undefined;
    return complete(reason, "builds", `strong natural friend of ${m[1]}, the ${h} lord`, `it is strong and a natural friend of ${m[1]}, ruler of your ${h} house`, `it is also a natural friend of ${m[1]}, ruler of your ${h} house`,
      { text: `${house}-ാം ഭാവാധിപനായ ${planet}-ന്റെ ശക്തനായ നൈസർഗിക മിത്രം`, plain: `നിങ്ങളുടെ ${house}-ാം ഭാവാധിപനായ ${planet}-ന്റെ ശക്തനായ നൈസർഗിക മിത്രമാണ്`, also: `കൂടാതെ നിങ്ങളുടെ ${house}-ാം ഭാവാധിപനായ ${planet}-ന്റെ നൈസർഗിക മിത്രവുമാണ്` });
  }
  return undefined;
}

/** Whole-sentence check retains every house, reason, tone, date and current-period marker. */
export function phaladeepikaFromHouseMalayalam(p: FromHousePeriod, source: string, plain: boolean): string | undefined {
  if (!p.houses.length || p.houses.some((h) => h.house < 1 || h.house > 12 || !h.reasons.length || roleOf(h.reasons) !== h.role)) return undefined;
  if (roleOf(p.houses.flatMap((h) => h.reasons)) !== p.role) return undefined;
  const reasons = p.houses.map((h) => h.reasons.map((r) => reasonMalayalam(r, h.house)));
  if (reasons.some((rs) => rs.some((r) => !r))) return undefined;
  const start = DateTime.fromISO(p.start).toUTC(), end = DateTime.fromISO(p.end).toUTC();
  const planet = translate("ml", p.lord);
  if (!start.isValid || !end.isValid || planet === p.lord) return undefined;
  const verb = (role: FromHousePeriod["role"]) => role === "builds" ? "so 15.7 counts it among the periods that build the house" : role === "harms" ? "so 15.7 counts it among the periods that strain the house" : "so 15.7 names it both among the periods that build the house and among those that strain it";
  const plainOf = (h: FromHousePeriod["houses"][number]) => {
    const lead = `counting from your ${ordH(h.house)} house, Phaladeepika says this period`;
    const builds = h.reasons.filter((r) => r.role === "builds"), harms = h.reasons.filter((r) => r.role === "harms");
    return h.role === "builds" ? `${lead} helps it, as ${plainReasons(builds)}` : h.role === "harms" ? `${lead} asks for care with it, as ${plainReasons(harms)}` : `${lead} both helps it, as ${plainReasons(builds)}, and asks for care with it, as ${plainReasons(harms)}`;
  };
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const ages = `${Math.floor(p.ageStart)}-${Math.floor(p.ageEnd)}`;
  const expected = `${p.lord} dasa, ${start.toFormat("LLL yyyy")} to ${end.toFormat("LLL yyyy")} (ages ${ages})${p.current ? ", running" : ""}: ${p.houses.map((h) => `from the ${ordH(h.house)}, ${listJoin(h.reasons.map((r) => r.text))}, ${verb(h.role)}`).join("; ")}.`;
  const expectedPlain = `${cap(thePlanet(p.lord))}'s period, ${start.toFormat("LLLL yyyy")} to ${end.toFormat("LLLL yyyy")} (ages ${Math.floor(p.ageStart)} to ${Math.floor(p.ageEnd)})${p.current ? ", running now" : ""}: ${p.houses.map(plainOf).join("; ")}.`;
  if (source !== (plain ? expectedPlain : expected)) return undefined;
  const lines = p.houses.map((h, i) => {
    const ml = reasons[i] as ReasonMl[];
    const group = (role: FromHouseReason["role"]) => h.reasons.flatMap((r, index) => r.role === role ? [ml[index]] : []);
    const list = (xs: ReasonMl[], mode: "text" | "plain") => xs.map((r, j) => mode === "text" ? r.text : j ? r.also : r.plain).join("; ");
    const lead = `${h.house}-ാം ഭാവത്തിൽനിന്ന് എണ്ണുമ്പോൾ`;
    if (!plain) return `${lead}: ${list(ml, "text")}; അതിനാൽ 15.7 ഈ കാലയളവിനെ ${h.role === "builds" ? "ഭാവത്തെ വളർത്തുന്ന" : h.role === "harms" ? "ഭാവത്തെ ബാധിക്കുന്ന" : "ഭാവത്തെ വളർത്തുന്നതും ബാധിക്കുന്നതുമായ"} കാലയളവുകളിൽ ഉൾപ്പെടുത്തുന്നു`;
    const b = group("builds"), s = group("harms");
    return h.role === "builds" ? `${lead} ഈ കാലയളവ് ഭാവത്തെ സഹായിക്കുമെന്ന് ഫലദീപിക പറയുന്നു, കാരണം ${list(b, "plain")}` : h.role === "harms" ? `${lead} ഭാവത്തിന്റെ കാര്യത്തിൽ ശ്രദ്ധ ആവശ്യമാണ് എന്ന് ഫലദീപിക പറയുന്നു, കാരണം ${list(s, "plain")}` : `${lead} ഈ കാലയളവ് ഭാവത്തെ സഹായിക്കുകയും ശ്രദ്ധ ആവശ്യപ്പെടുകയും ചെയ്യുമെന്ന് ഫലദീപിക പറയുന്നു: സഹായം, കാരണം ${list(b, "plain")}; ശ്രദ്ധ, കാരണം ${list(s, "plain")}`;
  });
  const dates = `${start.setLocale("ml-IN").toFormat("LLLL yyyy")} മുതൽ ${end.setLocale("ml-IN").toFormat("LLLL yyyy")} വരെ`;
  return `${planet}${plain ? "-ന്റെ കാലയളവ്" : " ദശ"}, ${dates} (പ്രായം ${Math.floor(p.ageStart)} മുതൽ ${Math.floor(p.ageEnd)} വരെ)${p.current ? ", ഇപ്പോൾ നടക്കുന്നു" : ""}: ${lines.join("; ")}.`;
}
