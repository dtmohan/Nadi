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

const r = (
  id: string,
  subject: Planet,
  object: Planet | undefined,
  relation: Relation[] | undefined,
  text: string,
  weight: 1 | 2 | 3,
  source = BNN,
  extra: Partial<Rule["when"]> = {},
): Rule => ({
  id,
  area: "children",
  when: { subject, ...(object ? { object, relation } : {}), ...extra },
  text,
  weight,
  source,
});

export const CHILDREN_RULES: Rule[] = [
  // Promise from the Jupiter–Venus link.
  r(
    "ch-ju-ve",
    "Jupiter",
    "Venus",
    ["conjunct"],
    "Jupiter with Venus in one sign: a Jupiter–Venus connection that this Nadi tradition considers relevant to children; it does not establish whether, how or when someone has children.",
    3,
  ),
  r(
    "ch-ju-ve-trine",
    "Jupiter",
    "Venus",
    ["trine"],
    "Jupiter in trine to Venus: a Jupiter–Venus connection traditionally considered relevant to children; it does not establish timing or outcome.",
    2,
  ),
  r(
    "ch-ju-ve-opp",
    "Jupiter",
    "Venus",
    ["opposite"],
    "Jupiter opposite Venus: a Jupiter–Venus connection that this tradition reads with reduced weight; individual family circumstances cannot be inferred.",
    1,
  ),
  r(
    "ch-ju-ve-axis",
    "Jupiter",
    "Venus",
    ["prev", "next"],
    "Venus in the 2nd or 12th from Jupiter: a more distant Jupiter–Venus connection in this tradition; it does not establish the number or timing of children.",
    1,
  ),

  // Sons and daughters.
  r(
    "ch-ju-su",
    "Jupiter",
    "Sun",
    CLOSE,
    "Jupiter with or in trine to the Sun: a traditional children-related indicator; it cannot establish a child's sex or the nature of a relationship.",
    2,
    NAIK,
  ),
  r(
    "ch-ju-me",
    "Jupiter",
    "Mercury",
    CLOSE,
    "Jupiter with or in trine to Mercury: a traditional link between children and learning; it does not determine a child's interests or abilities.",
    1,
  ),
  r(
    "ch-ju-mo",
    "Jupiter",
    "Moon",
    CLOSE,
    "Jupiter with or in trine to the Moon: a traditional association of children and care; it does not establish fertility or ease of conception.",
    2,
    RAO,
  ),
  {
    id: "ch-t-su-ma-ju",
    area: "children",
    when: {
      subject: "Jupiter",
      object: "Sun",
      relation: NEAR,
      with: [{ planet: "Mars", relation: NEAR }],
    },
    text: "Sun, Mars and Jupiter linked by sign: Rao discusses a children-related combination; its proposed count and sex are not reliable individual predictions.",
    weight: 2,
    source: RAO,
  },

  // Delay, diversion, loss.
  r(
    "ch-ju-sa",
    "Jupiter",
    "Saturn",
    CLOSE,
    "Jupiter with or in trine to Saturn: some Nadi readers consider Saturn a timing factor; the connection does not establish a delay or number of children.",
    2,
  ),
  r(
    "ch-ju-ra",
    "Jupiter",
    "Rahu",
    CLOSE,
    "Jupiter with or in trine to Rahu: some Nadi readers consider Rahu a factor in family circumstances; the connection cannot identify a route to parenthood or a child's future.",
    2,
  ),
  r(
    "ch-ju-ke",
    "Jupiter",
    "Ketu",
    CLOSE,
    "Jupiter with or in trine to Ketu: a traditional children-related combination with differing interpretations; it does not establish a personal outcome.",
    2,
  ),
  r(
    "ch-ve-ke",
    "Venus",
    "Ketu",
    CLOSE,
    "Ketu with or in trine to Venus: a traditional family-related combination; it does not establish a delay or difficulty having children.",
    2,
    NAIK,
  ),
  r(
    "ch-ve-ra",
    "Venus",
    "Rahu",
    CLOSE,
    "Rahu with or in trine to Venus: a traditional family-related combination; it cannot assess conception or a child's health.",
    1,
    NAIK,
  ),
  r(
    "ch-sa-ve",
    "Saturn",
    "Venus",
    CLOSE,
    "Saturn with or in trine to Venus: some Nadi readers consider Saturn a timing factor; no individual delay can be inferred.",
    1,
    NAIK,
  ),
  r(
    "ch-ra-su",
    "Rahu",
    "Sun",
    CLOSE,
    "Rahu with or in trine to the Sun: a traditional association involving children; it cannot determine a child's sex or health.",
    1,
    NAIK,
  ),
  r(
    "ch-ke-su",
    "Ketu",
    "Sun",
    CLOSE,
    "Ketu with or in trine to the Sun: a traditional association involving children; it does not establish an obstacle or a child's sex.",
    1,
    NAIK,
  ),
  r(
    "ch-mo-ve",
    "Moon",
    "Venus",
    ["conjunct"],
    "Moon with Venus: a traditional family-related combination; it cannot assess conception or pregnancy outcomes.",
    1,
    NAIK,
  ),
  {
    id: "ch-t-ju-sa-node",
    area: "children",
    when: {
      subject: "Jupiter",
      object: "Saturn",
      relation: NEAR,
      with: [{ planet: "Ketu", relation: NEAR }],
    },
    text: "Jupiter, Saturn and Ketu linked by sign: some Nadi readers consider this a timing factor; it cannot establish a delay or route to parenthood.",
    weight: 3,
  },
  {
    id: "ch-t-ju-sa-rahu",
    area: "children",
    when: {
      subject: "Jupiter",
      object: "Saturn",
      relation: NEAR,
      with: [{ planet: "Rahu", relation: NEAR }],
    },
    text: "Jupiter, Saturn and Rahu linked by sign: some Nadi readers consider this a timing factor; it cannot establish a delay or route to parenthood. The adjacent-sign extension is provisional.",
    weight: 3,
    source: NAIK,
  },

  // The 5th from Jupiter.
  r(
    "ch-ju-water",
    "Jupiter",
    undefined,
    undefined,
    "Jupiter in a watery sign, so the 5th from Jupiter is watery too: a traditional classification that cannot assess fertility or pregnancy.",
    2,
    "Bhrigu Naadi principles (Srinivasan)",
    { subjectElement: ["Water"] },
  ),
];
