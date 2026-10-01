/**
 * Phaladeepika ch. 8, slokas 25-33: Rahu in each of the twelve houses (8.25-27)
 * and Ketu in each of the twelve houses (8.28-33), read by house placement alone.
 * Text: Mantreswara's Phaladeepika, ch. 8 (wisdomlib.org translation, doc1621580).
 * The verses are paraphrased; the table carries no condition on sign, aspect or strength,
 * and that is how it is shown.
 */
import { SIGNS, SIGN_LORD, houseFrom, type Planet, type PlanetPosition } from "./astro";
import type { ParashariFinding, ParashariSource } from "./parashari";

const P = (verse: string): ParashariSource => ({
  label: `Phaladeepika 8.${verse}`,
  url: "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621580.html",
});

export const PHALADEEPIKA_CH8_URL = P("25-33").url;

export const NODES_CAVEATS = [
  "Phaladeepika ch. 8 reads each node by house placement alone, with no condition on sign, aspect or strength; the table is shown exactly so, as one classical source's placement reading. Mantreswara's own tones are kept, including the favourable seats of Ketu in the 6th and 11th.",
  "The nodes own no signs; Parashara 34.16-17, shown in the planets list, reads them through their sign lords, and the two texts are not reconciled here. Each reading names the node's sign and its lord so the two can be weighed together.",
  "Life-length and loss phrases in these verses are placement readings, not the chart's longevity assessment; they are weighed against it and withheld for a native under the sensitive age by the app's gate.",
];

const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

/** 8.25-27, paraphrased. Tone follows the verse's own balance. */
const RAHU: { tone: ParashariFinding["tone"]; text: (h: number, sign: string, disp: Planet) => string }[] = [
  { tone: "mixed", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. A placement reading of the span of life is weighed against the chart's longevity assessment. Mantreswara reads wealth and bodily strength, with ailments that settle in the head and face, and a span of life his verse calls short.` },
  { tone: "mixed", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads speech that wavers from sincerity and ailments of the mouth, joined to a tender heart, wealth that comes through those in power, and anger and happiness in turn.` },
  { tone: "mixed", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads pride and a will of his own, set against his brothers, and still grants the native long life and wealth.` },
  { tone: "mixed", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads a dull mind, sorrow brought on others, friends kept, and a span his verse calls short, though the native knows happiness at times.` },
  { tone: "strain", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads a nasal quality to the voice, a hard heart, trouble in the stomach, and the matter of children as failing (childless, in his word).` },
  { tone: "mixed", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads trouble from enemies and oppression by the malefics his verse calls demons, a disorder of the lower gut, and still wealth and a long life.` },
  { tone: "strain", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads wealth lost through affairs with women, separation from the beloved, and the loss of his manhood (read today as vitality), with a self-willed and simple nature.` },
  { tone: "strain", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. This is the harshest seat in his table, to be weighed against the 8th house's own strength. Mantreswara reads a short span, impure acts, a defect in a limb, wind complaints, and little issue.` },
  { tone: "mixed", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads a contrary way of speaking, yet the headship of a clan, a village headman's place or a city's mayoralty, with deeds his verse calls unrighteous.` },
  { tone: "mixed", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads fame, engagement in other people's business, few children, no good act his verse can name, and fearlessness.` },
  { tone: "mixed", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads prosperity, a long life, few children, and an ailment of the ears.` },
  { tone: "strain", text: (h, sign, disp) => `Rahu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads sinful acts done in secret, heavy spending, and a water disease.` },
];

/** 8.28-33, paraphrased. */
const KETU: { tone: ParashariFinding["tone"]; text: (h: number, sign: string, disp: Planet) => string }[] = [
  { tone: "strain", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads an ungrateful and unhappy nature given to tale-bearing, an outcast fallen from position, a body his verse calls deformed, and the company of the wicked.` },
  { tone: "strain", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads learning and riches as absent, speech of poor quality and a sinister look, and dependence on another's table.` },
  { tone: "mixed", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads long life, strength, wealth and fame, happiness with the wife and good food, and the loss of a brother.` },
  { tone: "strain", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads the loss of lands, vehicles, and happiness, and the loss of the mother. The native leaves his own country, dwells in a foreign place and lives at another's bounty.` },
  { tone: "strain", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads the loss of children, a disease of the stomach, trouble from goblins (his word), and a mind his verse calls evil and wicked.` },
  { tone: "support", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads magnanimity and the best qualities, lasting fame, firmness and high authority, enemies destroyed and wishes realised — the one wholly favourable seat of Ketu in his table.` },
  { tone: "strain", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads disrespect, the company of bad women, a disease of the bowels, and the loss of the wife and of vital power.` },
  { tone: "strain", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. A hard seat, weighed against the 8th house's own strength. Mantreswara reads a short span, separation from dear friends, quarrels, injury from a weapon, and disappointment in undertakings.` },
  { tone: "strain", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads a sinful course, unrighteous acts, the loss of the father, misfortune and want, and slander of the good.` },
  { tone: "mixed", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads obstacles to good acts and impure engagements, yet energy, boldness and wide renown.` },
  { tone: "support", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads money hoarded and many good qualities, enjoyment, command of the means of getting what he requires, and success in obtaining it.` },
  { tone: "strain", text: (h, sign, disp) => `Ketu is in the ${ord(h)}, in ${sign}, ${disp}'s sign. Mantreswara reads sinful acts done in secret, spending on vile things, wealth destroyed, forbidden conduct, and diseases of the eye.` },
];

export function nodeFindings(
  positions: PlanetPosition[],
  lagnaIdx: number,
): ParashariFinding[] {
  const F: ParashariFinding[] = [];
  for (const node of ["Rahu", "Ketu"] as const) {
    const p = positions.find((x) => x.planet === node)!;
    const h = houseFrom(lagnaIdx, p.signIndex);
    const sign = SIGNS[p.signIndex];
    const disp = SIGN_LORD[p.signIndex];
    const entry = (node === "Rahu" ? RAHU : KETU)[h - 1];
    F.push({
      id: `pa-node-${node.toLowerCase()}`,
      kind: "house",
      house: h,
      title: `${node} in the ${ord(h)}`,
      text: entry.text(h, sign, disp),
      tone: entry.tone,
      planets: [node as Planet],
      source: node === "Rahu" ? P("25-27") : P("28-33"),
    });
  }
  return F;
}
