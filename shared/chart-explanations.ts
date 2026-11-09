/** Display-only explanations of evaluated chart facts. No rule, score or event outcome is changed. */
import { SIGNS, SIGN_LORD, type Planet, type PlanetPosition } from "./astro";
import { houseGloss, listJoin, ordH, thePlanet, withGloss } from "./house-gloss";
import type { Bhava, PlanetNature } from "./parashari";
import type { PlanetCheck } from "./parashari-checks";
import type { KpCusp, KpPlanet, SignificatorLevel } from "./kp";
import type { GocharaRow } from "./gochara";
import type { VargaChart, VargaKey, PlanetVargas } from "./vargas";
import type { Finding, PairRelation } from "./rules";
import { sensitiveTags } from "./life-stage";
import { translate } from "./localization";

/** Do not surface categorical sensitive source claims as a plain planetary reading. */
export function concealAvasthaEffect(text: string): boolean {
  return sensitiveTags(text).length > 0 || /\b(ruin|penury|destitution|poverty|harm|suicid\w*|self[- ]destruct\w*|self[- ]harm|disease|illness|death|injur\w*)\b/i.test(text);
}

/** The recorded natal star and quarter describe a position, not a stand-alone personality reading. */
export function plainNatalStar(p: Pick<PlanetPosition, "nakshatra" | "pada" | "nakshatraLord">): string {
  return `At birth it was in ${p.nakshatra}, quarter ${p.pada}. A nakshatra is one of 27 sections of the zodiac, and a quarter is one of its four parts. Its traditional star ruler is ${thePlanet(p.nakshatraLord)}; schools use that connection in different ways.`;
}

/** The selected house view supplies both the sign and the ruler's house. */
export function parashariHouseContext(b: Bhava): string {
  const occupants = b.occupants.length ? `${listJoin(b.occupants)} ${b.occupants.length === 1 ? "occupies" : "occupy"} it` : "No planet occupies it";
  return `The ${ordH(b.house)} house is a part of the chart associated with ${houseGloss("parashari", b.house)}; it is not a physical house. In this chart it falls in ${b.sign}, one of the twelve zodiac signs. ${b.lord} is the planet traditionally assigned to that sign, called its ruler; here it is in the ${withGloss("parashari", b.lordIn)} house. ${occupants}.${b.occupants.length ? "" : " An empty house still has a ruler and can receive aspects, the traditional connections calculated between chart positions."}`;
}

/** Reuses the already evaluated, selected-house checks, rather than recomputing dignity. */
export function parashariPlanetContext(n: PlanetNature, checks: PlanetCheck[]): string[] {
  const owned = n.owns.length ? `It rules the ${listJoin(n.owns.map((h) => withGloss("parashari", h)))} ${n.owns.length === 1 ? "house" : "houses"}.` : "In this house-lordship scheme it rules no sign.";
  const place = `${n.planet} is in the ${withGloss("parashari", n.house)} house. A house is a chart area associated with life topics, not a physical home. ${owned} A planet is called a ruler because it is traditionally assigned to the sign of a house; it does not control that part of a person's life.`;
  const explanation: Partial<Record<PlanetCheck["kind"], string>> = {
    dignity: "This describes the planet's traditional standing in its sign, not the worth or ability of a person.",
    strength: "This compares calculated planetary factors with a reference, not a person's strength or ability.",
    combust: "Combustion here means a calculated closeness to the Sun at birth.",
    war: "Planetary war is a traditional name for a close planetary pairing, not a conflict between people.",
    aspects: "An aspect is a relationship calculated between positions in the chart.",
    with: "Sharing a sign is one chart relationship that a school may consider alongside other factors.",
  };
  const selected = checks.filter((c) => ["dignity", "strength", "combust", "war", "aspects", "with"].includes(c.kind)).map((c) => `${c.plain} ${explanation[c.kind] ?? ""}`.trim());
  return [place, ...selected];
}

/** KP uses its own cusp houses and the caller's selected four- or six-step set. */
export function kpHouseContext(c: KpCusp, sl: KpPlanet, houses: number[], sixStep: boolean): string {
  const topics = houseGloss("kp", c.house);
  const links = houses.length ? listJoin(houses.map((h) => ordH(h))) : "no houses in the selected table";
  return `KP examines ${topics} using the start of the ${ordH(c.house)} house, a chart area associated with those topics. That starting point is called a cusp. KP divides each of the 27 star sections of the zodiac into smaller parts; the planet assigned to the part containing this cusp is its sub-lord, here ${c.subLord}. In KP's chart ${c.subLord} occupies house ${sl.house} and is in the star assigned to ${sl.starLord}. The ${sixStep ? "six" : "four"}-step table links it to ${links}; the linked houses name other topics considered by a particular rule, not a complete prediction on their own.`;
}

/** Nodes represent other planets' house ownership; they do not own signs in KP. */
export function kpStageLabel(p: KpPlanet, stage: SignificatorLevel): string {
  const isNode = (planet: Planet) => planet === "Rahu" || planet === "Ketu";
  if (stage === "A") return "Its star lord occupies";
  if (stage === "B") return "It occupies";
  if (stage === "C") return isNode(p.starLord) ? "Its star lord represents, through its sign lord and companions" : "Its star lord rules";
  if (stage === "D") return isNode(p.planet) ? "It represents, through its sign lord and companions" : "It rules";
  if (stage === "E") return "Its sub-lord occupies";
  return isNode(p.subLord) ? "Its sub-lord represents, through its sign lord and companions" : "Its sub-lord rules";
}

/** Do not turn the D2 or D30 sign-only tradition into a house reading. */
export function divisionalPlanetContext(p: PlanetVargas, chart: VargaChart, key: VargaKey, m: {
  plain: string; notByHouses?: { plain: string }; houses: Array<{ house: number; withLord: boolean; plain: string }>;
}): string[] {
  const sign = p.signs[key];
  const intro = `${p.planet} is in ${SIGNS[sign]} in ${key}; this chart is traditionally read for ${m.plain}. Its birth-chart sign is ${SIGNS[p.signs.D1]}.${key === "D1" ? " D1 is the main birth chart." : ` ${key} is a divisional chart: another view calculated from the same birth positions, designed for a particular topic. It is not a second, independent chart of the sky.`}`;
  if (m.notByHouses) return [intro, m.notByHouses.plain];
  const house = ((sign - chart.lagnaSign + 12) % 12) + 1;
  const read = m.houses.find((h) => h.house === house);
  const ruled = m.houses.filter((h) => h.withLord && SIGN_LORD[(chart.lagnaSign + h.house - 1) % 12] === p.planet);
  const focus = key === "D1" ? `, which Parashara associates with ${houseGloss("parashari", house)}` : read ? read.plain.startsWith("read ") ? `; a cited source says to ${read.plain}` : `, which a cited source associates with ${read.plain}` : "; no selected source assigns this house a specific role in this division";
  const where = `${p.planet} occupies the ${ordH(house)} house counted from the ${key} rising sign${focus}.`;
  const lord = ruled.length ? `It also rules the ${listJoin(ruled.map((h) => ordH(h.house)))} ${ruled.length === 1 ? "house" : "houses"} that the selected source asks the reader to examine.` : "";
  return [intro, where, lord, key === "D9" && p.vargottama ? "It occupies the same sign in D1 and D9 (vargottama). D9 is derived from the same birth longitude, not independent evidence." : ""].filter(Boolean);
}

/** These are Moon-relative transit houses, not natal house significations. */
export function gocharaContext(r: GocharaRow, moonSign: number): string {
  const basic = `At birth the Moon was in ${SIGNS[moonSign]}; on the reading date ${r.planet} is in ${SIGNS[r.signIndex]}. This current position is called a transit. Counting the birth Moon's sign as the first, ${r.planet} is in the ${ordH(r.house)} sign from it. The cited transit table lists that position as ${r.favourable ? "favourable" : "not among the favourable positions"} for ${r.planet}.`;
  const vedha = r.vedhaBy.length && r.vedhaPoint ? ` ${listJoin(r.vedhaBy)} ${r.vedhaBy.length === 1 ? "occupies" : "occupy"} the ${ordH(r.vedhaPoint)} obstruction point; this traditional check is called vedha and can modify the basic reading.` : "";
  const mods = r.avNote || r.dignityNote || r.aspectNote || r.modifierConflict ? " The result also reflects the modifiers and any conflicting indication shown below." : "";
  return `${basic}${vedha}${mods} This is a general transit layer, not a prediction of a specific event.`;
}

/** Trace one displayed BNN theme back to its actual finding, without inferring missing conditions. */
export function bnnFindingContext(f: Finding, relations: readonly PairRelation[] = []): { text: string; textMl: string; source?: string; ruleId: string; provisional: boolean; timeSensitive: boolean; sourceUnverified: boolean } {
  const named = f.planets.length ? listJoin(f.planets) : "the chart factors named in the source finding";
  const words = { conjunct: "in the same sign", prev: "in the previous sign", next: "in the next sign", trine: "in a trine (the fifth or ninth sign, counted from it)", opposite: "in the seventh sign", none: "unrelated" } as const;
  const [subject, ...others] = f.planets;
  const relationFacts = others.flatMap((other) => {
    const recorded = relations.find((r) => r.subject === subject && r.object === other);
    const relation = f.planets.length === 2 ? f.relation : recorded?.relation;
    if (!relation || relation === "none") return [];
    const retro = f.planets.length === 2 ? f.viaRetro : recorded?.viaRetro;
    return [{ other, relation, retro }];
  });
  const contacts = relationFacts.map(({ other, relation, retro }) => `${other} is ${words[relation]}${retro ? " through the retrograde convention" : ""}`);
  const explanation = subject && contacts.length ? ` From ${subject}, ${listJoin(contacts)}.` : "";
  const mlNames = f.planets.length ? f.planets.map((planet) => translate("ml", planet)).join(", ") : "മൂലസൂചനയിൽ പറഞ്ഞിരിക്കുന്ന ജാതകഘടകങ്ങൾ";
  const mlRelation = { conjunct: "അതേ രാശിയിൽ", prev: "മുൻ രാശിയിൽ", next: "അടുത്ത രാശിയിൽ", trine: "ത്രികോണത്തിൽ (അഞ്ചാം അല്ലെങ്കിൽ ഒമ്പതാം രാശിയിൽ)", opposite: "ഏഴാം രാശിയിൽ" } as const;
  const mlContacts = relationFacts.map(({ other, relation, retro }) => `${translate("ml", other)} ${mlRelation[relation]}${retro ? " (വക്രഗതി പരിഗണിക്കുന്ന രീതി പ്രകാരം)" : ""}`);
  const mlExplanation = subject && mlContacts.length ? ` അടിസ്ഥാനഗ്രഹം: ${translate("ml", subject)}. അതിൽ നിന്ന് മറ്റ് ഗ്രഹങ്ങളുടെ സ്ഥാനം: ${mlContacts.join("; ")}.` : "";
  const edges = f.band ? [f.band.earlier, f.band.later].filter(Boolean) : [];
  const conditionChanges = edges.some((edge) => edge?.interpretationChanged);
  const relationChanges = edges.some((edge) => edge && (!edge.interpretationChanged || !edge.fires || edge.flow || edge.relation || edge.house));
  const bandEn = !f.band ? "" : conditionChanges && relationChanges
    ? " Its connection, direction or conditional interpretation changes within the stated birth-time range."
    : conditionChanges ? " Its conditional interpretation changes within the stated birth-time range."
      : " Its connection or direction changes within the stated birth-time range.";
  const bandMl = !f.band ? "" : conditionChanges && relationChanges
    ? " നൽകിയ ജനനസമയ പരിധിക്കുള്ളിൽ ഈ ബന്ധമോ ദിശയോ വ്യവസ്ഥയെ ആശ്രയിച്ച വ്യാഖ്യാനമോ മാറാം."
    : conditionChanges ? " നൽകിയ ജനനസമയ പരിധിക്കുള്ളിൽ വ്യവസ്ഥയെ ആശ്രയിച്ച വ്യാഖ്യാനം മാറാം."
      : " നൽകിയ ജനനസമയ പരിധിക്കുള്ളിൽ ഈ ബന്ധമോ ദിശയോ മാറാം.";
  return { ruleId: f.ruleId,
    text: `This selected Nadi rule involves ${named}.${explanation}${bandEn}`,
    textMl: `തിരഞ്ഞെടുത്ത ഈ നാഡി നിയമത്തിൽ ഉൾപ്പെടുന്നത്: ${mlNames}.${mlExplanation}${bandMl}`,
    source: f.source,
    provisional: /\bprovisional\b/i.test(`${f.text} ${f.source ?? ""}`),
    timeSensitive: !!f.band,
    sourceUnverified: /\b(?:not verified|unverified)\b/i.test(f.source ?? "") };
}
