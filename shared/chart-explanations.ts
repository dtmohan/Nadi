/** Display-only explanations of evaluated chart facts. No rule, score or event outcome is changed. */
import { SIGNS, SIGN_LORD, type Planet } from "./astro";
import { houseGloss, listJoin, ordH, withGloss } from "./house-gloss";
import type { Bhava, PlanetNature } from "./parashari";
import type { PlanetCheck } from "./parashari-checks";
import type { KpCusp, KpPlanet, SignificatorLevel } from "./kp";
import type { GocharaRow } from "./gochara";
import type { VargaChart, VargaKey, PlanetVargas } from "./vargas";
import type { Finding, PairRelation } from "./rules";
import { sensitiveTags } from "./life-stage";

/** Do not surface categorical sensitive source claims as a plain planetary reading. */
export function concealAvasthaEffect(text: string): boolean {
  return sensitiveTags(text).length > 0 || /\b(ruin|penury|destitution|poverty|harm|suicid\w*|self[- ]destruct\w*|self[- ]harm|disease|illness|death|injur\w*)\b/i.test(text);
}

/** The selected house view supplies both the sign and the ruler's house. */
export function parashariHouseContext(b: Bhava): string {
  const occupants = b.occupants.length ? `${listJoin(b.occupants)} ${b.occupants.length === 1 ? "occupies" : "occupy"} it` : "No planet occupies it";
  return `The ${ordH(b.house)} house covers ${houseGloss("parashari", b.house)}. In this chart it falls in ${b.sign}; its ruler ${b.lord} is in the ${withGloss("parashari", b.lordIn)} house. ${occupants}.${b.occupants.length ? "" : " An empty house still has a ruler and can receive aspects."}`;
}

/** Reuses the already evaluated, selected-house checks, rather than recomputing dignity. */
export function parashariPlanetContext(n: PlanetNature, checks: PlanetCheck[]): string[] {
  const owned = n.owns.length ? `It rules the ${listJoin(n.owns.map((h) => withGloss("parashari", h)))} ${n.owns.length === 1 ? "house" : "houses"}.` : "In this house-lordship scheme it rules no sign.";
  const place = `${n.planet} is in the ${withGloss("parashari", n.house)} house. ${owned}`;
  const selected = checks.filter((c) => ["dignity", "strength", "combust", "war", "aspects", "with"].includes(c.kind)).map((c) => c.plain);
  return [place, ...selected];
}

/** KP uses its own cusp houses and the caller's selected four- or six-step set. */
export function kpHouseContext(c: KpCusp, sl: KpPlanet, houses: number[], sixStep: boolean): string {
  const topics = houseGloss("kp", c.house);
  const links = houses.length ? listJoin(houses.map((h) => ordH(h))) : "no houses in the selected table";
  return `KP uses the ${ordH(c.house)} cusp for ${topics}. Its sub-lord is ${c.subLord}; ${c.subLord} occupies house ${sl.house} and is in ${sl.starLord}'s star. In the ${sixStep ? "six" : "four"}-step table it signifies ${links}. A link is a factor for the specific rule below, not a complete prediction on its own.`;
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
  const intro = `${p.planet} is in ${SIGNS[sign]} in ${key}; this chart is traditionally read for ${m.plain}. Its birth-chart sign is ${SIGNS[p.signs.D1]}.`;
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
  const basic = `The birth Moon is in ${SIGNS[moonSign]}; ${r.planet} in ${SIGNS[r.signIndex]} is the ${ordH(r.house)} sign from it. The cited transit table lists this position as ${r.favourable ? "favourable" : "not among the favourable positions"} for ${r.planet}.`;
  const vedha = r.vedhaBy.length && r.vedhaPoint ? ` ${listJoin(r.vedhaBy)} ${r.vedhaBy.length === 1 ? "occupies" : "occupy"} the ${ordH(r.vedhaPoint)} obstruction point.` : "";
  const mods = r.avNote || r.dignityNote || r.aspectNote || r.modifierConflict ? " The result also reflects the modifiers and any conflicting indication shown below." : "";
  return `${basic}${vedha}${mods} This is a general transit layer, not a prediction of a specific event.`;
}

/** Trace one displayed BNN theme back to its actual finding, without inferring missing conditions. */
export function bnnFindingContext(f: Finding, relations: readonly PairRelation[] = []): { text: string; source?: string; ruleId: string } {
  const named = f.planets.length ? listJoin(f.planets) : "the chart factors named in the source finding";
  const words = { conjunct: "in the same sign", prev: "in the previous sign", next: "in the next sign", trine: "in a trine", opposite: "in the seventh sign", none: "unrelated" } as const;
  const [subject, ...others] = f.planets;
  const contacts = others.flatMap((other) => {
    const recorded = relations.find((r) => r.subject === subject && r.object === other);
    const relation = f.planets.length === 2 ? f.relation : recorded?.relation;
    if (!relation || relation === "none") return [];
    const retro = f.planets.length === 2 ? f.viaRetro : recorded?.viaRetro;
    return [`${other} is ${words[relation]}${retro ? " through the retrograde convention" : ""}`];
  });
  const explanation = subject && contacts.length ? ` From ${subject}, ${listJoin(contacts)}.` : "";
  return { ruleId: f.ruleId, text: `This selected Nadi rule involves ${named}.${explanation}${f.band ? " Its connection or direction changes within the stated birth-time range." : ""}`, source: f.source };
}
