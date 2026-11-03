import { areaNoun } from "@shared/life-areas";
import type { AreaSynthesis } from "@shared/synthesis";
import { translate } from "@/lib/i18n";

/** Render the same filtered Nadi synthesis as the English overview, without parsing English prose. */
export function malayalamNadiGlance(areas: Pick<AreaSynthesis, "area" | "tone" | "balance">[]): string {
  const names = (tone: AreaSynthesis["tone"], order?: "up" | "down") => {
    const matching = areas.filter((area) => area.tone === tone);
    if (order) matching.sort((a, b) => order === "down" ? b.balance - a.balance : a.balance - b.balance);
    return matching.map((area) => translate("ml", areaNoun(area.area))).join(", ");
  };
  const firm = names("supportive", "down");
  const care = names("care", "up");
  const contested = names("contested");
  const mixed = areas.some((area) => area.tone === "mixed");
  const parts: string[] = [];
  if (firm) parts.push(`${firm} — അനുകൂല സൂചനകൾ`);
  if (care) parts.push(`${care} — ശ്രദ്ധ ആവശ്യപ്പെടുന്ന സൂചനകൾ`);
  if (contested) parts.push(`${contested} — അനുകൂലവും പ്രതികൂലവുമായ ശക്തമായ സൂചനകൾ`);
  if (mixed) parts.push(parts.length ? "മറ്റ് സൂചനകളുള്ള മേഖലകൾ സമ്മിശ്രമാണ്" : "സൂചനകൾ സമ്മിശ്രമാണ്");
  return parts.length
    ? `നാഡി വായനയിൽ: ${parts.join("; ")}.`
    : "ഈ ജാതകത്തിൽ തിരഞ്ഞെടുത്ത നാഡി നിയമങ്ങൾ ഒരു വശത്തേക്കും ശക്തമായ സൂചന നൽകുന്നില്ല.";
}
