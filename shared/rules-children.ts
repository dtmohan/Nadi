// Children and progeny in Bhrigu Nandi Nadi. No 5th lord: Jupiter is the putra karaka in
// both charts, Venus the progeny indicator, the Sun the son and Venus the daughter; Saturn
// delays, Rahu diverts, Ketu takes away. Sources: R.G. Rao (Nadi Astrology, Fundamentals),
// S. Naik (Prediction Secrets), Sakurkar (Progeny, Saptarishis), Astroindus BNN progeny notes.

import type { Planet, Relation } from "./astro";
import type { Rule } from "./rules";

const RAO = "R.G. Rao, Nadi Astrology";
const NAIK = "S. Naik, Prediction Secrets: Naadi Astrology";
const BNN = "BNN progeny sutras (Astroindus, Sakurkar)";

const NEAR: Relation[] = ["conjunct", "trine", "prev", "next"];
const CLOSE: Relation[] = ["conjunct", "trine"];

const r = (id: string, subject: Planet, object: Planet | undefined, relation: Relation[] | undefined, text: string, weight: 1 | 2 | 3, source = BNN, extra: Partial<Rule["when"]> = {}): Rule => ({
  id,
  area: "children",
  when: { subject, ...(object ? { object, relation } : {}), ...extra },
  text,
  weight,
  source,
});

export const CHILDREN_RULES: Rule[] = [
  // Promise from the Jupiter–Venus link.
  r("ch-ju-ve", "Jupiter", "Venus", ["conjunct"], "Jupiter with Venus in one sign: children strongly promised, usually more than one; a daughter is indicated.", 3),
  r("ch-ju-ve-trine", "Jupiter", "Venus", ["trine"], "Jupiter in trine to Venus: children promised in good time; a daughter is indicated.", 2),
  r("ch-ju-ve-opp", "Jupiter", "Venus", ["opposite"], "Jupiter opposite Venus: children promised at half strength; the parents differ on how to raise them.", 1),
  r("ch-ju-ve-axis", "Jupiter", "Venus", ["prev", "next"], "Venus in the 2nd or 12th from Jupiter: a faint progeny signature; children come later, fewer than hoped, or with focused effort.", 1),

  // Sons and daughters.
  r("ch-ju-su", "Jupiter", "Sun", CLOSE, "Jupiter with or in trine to the Sun: a son is indicated; the native and the son do well together.", 2, NAIK),
  r("ch-ju-me", "Jupiter", "Mercury", CLOSE, "Jupiter with or in trine to Mercury: learned, articulate children; a child takes to letters, trade or teaching.", 1),
  r("ch-ju-mo", "Jupiter", "Moon", CLOSE, "Jupiter with or in trine to the Moon: easy conception and children who bring joy; the mother's line is fertile.", 2, RAO),
  { id: "ch-t-su-ma-ju", area: "children", when: { subject: "Jupiter", object: "Sun", relation: NEAR, with: [{ planet: "Mars", relation: NEAR }] }, text: "Sun, Mars and Jupiter combined: Rao reads at least two male children; sons of drive and standing.", weight: 2, source: RAO },

  // Delay, diversion, loss.
  r("ch-ju-sa", "Jupiter", "Saturn", CLOSE, "Jupiter with or in trine to Saturn: a later first child and fewer children overall; delay rather than denial.", 2),
  r("ch-ju-ra", "Jupiter", "Rahu", CLOSE, "Jupiter with or in trine to Rahu: children by an unusual route, after a long wait, through medical help or in a foreign place; a child settles abroad or in technology.", 2),
  r("ch-ju-ke", "Jupiter", "Ketu", CLOSE, "Jupiter with or in trine to Ketu: anxiety around the first child; the classical texts read loss, the modern lineage delay and a child of spiritual or medical bent.", 2),
  r("ch-ve-ke", "Venus", "Ketu", CLOSE, "Ketu with or in trine to Venus: setbacks or delay in progeny; obstacles in having a child.", 2, NAIK),
  r("ch-ve-ra", "Venus", "Rahu", CLOSE, "Rahu with or in trine to Venus: difficulty in conceiving, or a child of delicate early health; remedies and medical care are indicated.", 1, NAIK),
  r("ch-sa-ve", "Saturn", "Venus", CLOSE, "Saturn with or in trine to Venus: delay in begetting a child.", 1, NAIK),
  r("ch-ra-su", "Rahu", "Sun", CLOSE, "Rahu with or in trine to the Sun: difficulty for a male child, or a son of delicate health.", 1, NAIK),
  r("ch-ke-su", "Ketu", "Sun", CLOSE, "Ketu with or in trine to the Sun: obstacles in having a child, especially a son.", 1, NAIK),
  r("ch-mo-ve", "Moon", "Venus", ["conjunct"], "Moon with Venus: conception may be delicate; Naik warns of difficulty conceiving or of a pregnancy that does not hold, so care is advised.", 1, NAIK),
  { id: "ch-t-ju-sa-node", area: "children", when: { subject: "Jupiter", object: "Saturn", relation: NEAR, with: [{ planet: "Ketu", relation: NEAR }] }, text: "Jupiter, Saturn and Ketu combined: the heaviest progeny signature; a very late child, or one raised as one's own by adoption.", weight: 3 },
  { id: "ch-t-ju-sa-rahu", area: "children", when: { subject: "Jupiter", object: "Saturn", relation: NEAR, with: [{ planet: "Rahu", relation: NEAR }] }, text: "Jupiter, Saturn and Rahu combined: children after long delay and by an unconventional path; medical intervention is common.", weight: 3, source: NAIK },

  // The 5th from Jupiter.
  r("ch-ju-water", "Jupiter", undefined, undefined, "Jupiter in a watery sign, so the 5th from Jupiter is watery too: trouble or delay in getting children; care in pregnancy.", 2, "Bhrigu Naadi principles (Srinivasan)", { subjectElement: ["Water"] }),
];
