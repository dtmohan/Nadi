import type { Planet } from "./astro";
import type { Flow } from "./flow";
import type { Finding, BandEdge } from "./rules";
import { translate } from "./localization";

// These snapshots deliberately do not import the mutable English gloss tables.
// A new significator or changed wording must be translated and reviewed explicitly.
const GIVES: Record<Planet, [string, string]> = {
  Sun: ["authority, the father and status", "അധികാരം, അച്ഛൻ, സ്ഥാനമാനം"],
  Moon: ["the mind, the mother and the public", "മനസ്സ്, അമ്മ, പൊതുജനം"],
  Mars: ["drive, property and technical force", "പ്രവർത്തനശക്തി, സ്വത്ത്, സാങ്കേതികശക്തി"],
  Mercury: ["learning, speech and commerce", "പഠനം, സംസാരം, വാണിജ്യം"],
  Jupiter: ["the native's own purpose, wisdom and wealth", "വ്യക്തിയുടെ സ്വന്തം ജീവിതലക്ഷ്യം, ജ്ഞാനം, സമ്പത്ത്"],
  Venus: ["the spouse, comforts and the arts", "ജീവിതപങ്കാളി, സുഖസൗകര്യങ്ങൾ, കലകൾ"],
  Saturn: ["work, duty and delay", "തൊഴിൽ, കടമ, കാലതാമസം"],
  Rahu: ["foreign ties, ambition and the unconventional", "വിദേശബന്ധങ്ങൾ, അഭിലാഷം, പാരമ്പര്യേതരമായ കാര്യങ്ങൾ"],
  Ketu: ["detachment, spirit and endings", "വിരക്തി, ആത്മീയത, അവസാനങ്ങൾ"],
};
const RECEIVES: Record<Planet, [string, string]> = {
  Sun: ["the father and career standing", "അച്ഛനും തൊഴിൽസ്ഥാനവും"],
  Moon: ["the mother and the emotional life", "അമ്മയും വൈകാരിക ജീവിതവും"],
  Mars: ["siblings, property and courage", "സഹോദരങ്ങൾ, സ്വത്ത്, ധൈര്യം"],
  Mercury: ["education, speech and trade", "വിദ്യാഭ്യാസം, സംസാരം, വ്യാപാരം"],
  Jupiter: ["the native's life direction", "വ്യക്തിയുടെ ജീവിതദിശ"],
  Venus: ["marriage and comforts", "വിവാഹവും സുഖസൗകര്യങ്ങളും"],
  Saturn: ["the profession", "തൊഴിൽ"],
  Rahu: ["foreign and worldly ambitions", "വിദേശവും ഭൗതികവുമായ അഭിലാഷങ്ങൾ"],
  Ketu: ["the spiritual path", "ആത്മീയ പാത"],
};
const FEMALE_GIVES: Partial<Record<Planet, [string, string]>> = {
  Venus: ["her own person, comforts and the arts", "അവളുടെ വ്യക്തിത്വം, സുഖസൗകര്യങ്ങൾ, കലകൾ"],
  Mars: ["the husband, drive and property", "ഭർത്താവ്, പ്രവർത്തനശക്തി, സ്വത്ത്"],
};
const FEMALE_RECEIVES: Partial<Record<Planet, [string, string]>> = {
  Venus: ["her own person and comforts", "അവളുടെ വ്യക്തിത്വവും സുഖസൗകര്യങ്ങളും"],
  Mars: ["the husband, siblings and property", "ഭർത്താവ്, സഹോദരങ്ങൾ, സ്വത്ത്"],
};

function clause(flow: Flow, female: boolean): { en: string; ml: string } | undefined {
  const giver = female && FEMALE_GIVES[flow.from] || GIVES[flow.from];
  const receiver = female && FEMALE_RECEIVES[flow.to] || RECEIVES[flow.to];
  if (!giver || !receiver) return undefined;
  const planet = translate("ml", flow.from);
  if (planet === flow.from) return undefined;
  const enPlanet = flow.from === "Sun" || flow.from === "Moon" ? `the ${flow.from}` : flow.from;
  return { en: `${enPlanet} is ahead by degree, so ${giver[0]} colour ${receiver[0]}`, ml: `അംശത്തിൽ ${planet} മുന്നിലുള്ളതിനാൽ ${giver[1]} എന്നിവ ${receiver[1]} എന്ന വിഷയങ്ങൾക്ക് സ്വഭാവം നൽകുന്നു` };
}

const BONDS: Record<Flow["tier"], [string, string, number]> = {
  pada: ["one pada", "ഒരു പാദം", 4], degree: ["the same degree", "ഒരേ അംശം", 3],
  nakshatra: ["one nakshatra", "ഒരു നക്ഷത്രം", 2], sign: ["one sign", "ഒരു രാശി", 1], trine: ["the trine", "ത്രികോണം", 1],
};
const RELATIONS: Record<string, [string, string]> = {
  conjunct: ["in the same sign as", "ഒരേ രാശിയിൽ"], prev: ["in the 12th from", "പന്ത്രണ്ടാമതായി"],
  next: ["in the 2nd from", "രണ്ടാമതായി"], trine: ["in trine to", "ത്രികോണത്തിൽ"],
  opposite: ["in the 7th from", "ഏഴാമതായി"], none: ["unrelated to", "ബന്ധമില്ലാതെ"],
};

/** Reconstruct each edge independently, so a changed English clause cannot revive a stale translation. */
function bandPart(label: "earlier" | "later", edge: BandEdge | undefined, finding: Finding, female: boolean): { en: string; ml: string } | null | undefined {
  if (!edge) return null;
  const position = label === "earlier" ? "നേരത്തെയുള്ള" : "പിന്നീടുള്ള";
  const enPrefix = `at the ${label} end`;
  const mlPrefix = `${position} അതിരിൽ`;
  if (!edge.fires) return { en: `${enPrefix} this line does not fire`, ml: `${mlPrefix} ഈ നിയമം ബാധകമാകുന്നില്ല` };
  const original = finding.flow;
  if (edge.flow && original && edge.flow.from === original.from && edge.flow.to === original.to) {
    const oldBond = BONDS[original.tier], newBond = BONDS[edge.flow.tier];
    if (!oldBond || !newBond) return undefined;
    const change = newBond[2] > oldBond[2] ? ["tightens", "കൂടുതൽ അടുത്തതാകുന്നു"] : newBond[2] < oldBond[2] ? ["loosens", "അയയുന്നു"] : ["changes", "മാറുന്നു"];
    return { en: `${enPrefix} the bond ${change[0]} from ${oldBond[0]} to ${newBond[0]}`, ml: `${mlPrefix} ബന്ധം ${oldBond[1]} എന്ന നിലയിൽനിന്ന് ${newBond[1]} എന്ന നിലയിലേക്ക് ${change[1]}` };
  }
  if (edge.flow) {
    const c = clause(edge.flow, female);
    if (!c) return undefined;
    return { en: `${enPrefix} the order ${original ? "reverses" : "is"}: ${c.en}`, ml: `${mlPrefix} ക്രമം ${original ? "വിപരീതമാകുന്നു" : "ഇപ്രകാരമാണ്"}: ${c.ml}` };
  }
  const [subject, object] = finding.planets;
  if (edge.relation && object) {
    const rel = RELATIONS[edge.relation], a = translate("ml", subject), b = translate("ml", object);
    if (!rel || a === subject || b === object) return undefined;
    return { en: `${enPrefix} ${object} is ${rel[0]} ${subject}`, ml: `${mlPrefix} ${b} ${a}-യിൽനിന്ന് ${rel[1]} നിൽക്കുന്നു` };
  }
  if (edge.house && object) {
    if (!Number.isInteger(edge.house) || edge.house < 1 || edge.house > 12) return undefined;
    const a = translate("ml", subject), b = translate("ml", object), h = edge.house;
    if (a === subject || b === object) return undefined;
    const ordinal = `${h}${h % 10 === 1 && h !== 11 ? "st" : h % 10 === 2 && h !== 12 ? "nd" : h % 10 === 3 && h !== 13 ? "rd" : "th"}`;
    return { en: `${enPrefix} ${object} is in the ${ordinal} from ${subject}`, ml: `${mlPrefix} ${b} ${a}-യിൽനിന്ന് ${h}-ാം സ്ഥാനത്താണ്` };
  }
  if (original) return { en: `${enPrefix} the two no longer share a direction`, ml: `${mlPrefix} ഈ രണ്ടും ഇനി ഒരേ ദിശയിൽ അല്ല` };
  return null;
}

/** Translate the complete direction and birth-time-band line only when the source matches. */
export function bnnDirectionMalayalam(finding: Finding, female: boolean, source: string): string | undefined {
  if (!finding.flow) return undefined;
  const main = clause(finding.flow, female);
  if (!main) return undefined;
  let en = `Direction: ${main.en}.`, ml = `ദിശ: ${main.ml}.`;
  if (finding.band) {
    const early = bandPart("earlier", finding.band.earlier, finding, female);
    const late = bandPart("later", finding.band.later, finding, female);
    if (early === undefined || late === undefined) return undefined;
    const parts = [early, late].filter((part): part is { en: string; ml: string } => part !== null);
    if (parts.length) {
      en += ` Within the ±${finding.band.minutes}-minute birth-time band: ${parts.map((p) => p.en).join("; ")}.`;
      ml += ` ജനനസമയത്തിന്റെ ±${finding.band.minutes} മിനിറ്റ് പരിധിക്കുള്ളിൽ: ${parts.map((p) => p.ml).join("; ")}.`;
    }
  }
  return source === en ? ml : undefined;
}
