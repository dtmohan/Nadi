/**
 * Phaladeepika ch. 8, slokas 25-33: Rahu in each of the twelve houses (8.25-27)
 * and Ketu in each of the twelve houses (8.28-33), read by house placement alone.
 * Text: Mantreswara's Phaladeepika, ch. 8 (wisdomlib.org translation, doc1621580), checked against
 * the Sanskrit at sanskritdocuments.org. The verses are paraphrased; the table carries no condition
 * on sign, aspect or strength, and that is how it is shown. The entries use the format of the seven
 * planets' table (phaladeepika-houses.ts), which renders all nine.
 */
import type { PlacementSlot } from "./phaladeepika-houses";

export const PHALADEEPIKA_CH8_URL =
  "https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621580.html";

export const NODES_CAVEATS = [
  "Mantreswara's own tones for the nodes are kept, including the favourable seats of Ketu in the 6th and 11th.",
  "The nodes own no signs; Parashara 34.16-17, shown in the planets list, reads them through their sign lords, and the two texts are not reconciled here. Each node's reading names its sign and the sign's lord so the two can be weighed together.",
];

/** 8.25-27, paraphrased. */
// prettier-ignore
export const RAHU: PlacementSlot[] = [
  { v: "25", said: [["-", "a short life (a placement reading, weighed against the chart's longevity assessment)", { on: "longevity", g: "longevity", h: "health" }], ["+", "wealth", { on: "wealth" }], ["+", "bodily strength", { on: "health" }], ["-", "ailments of the head and face", { p: "care needed for the head and face", on: "health" }]] },
  { v: "25", said: [["-", "speech that wavers from sincerity", { p: "speech that is not always candid", on: "speech" }], ["-", "ailments of the mouth", { p: "care needed for the mouth", on: "health" }], ["+", "a tender heart"], ["+", "wealth through the ruler", { p: "wealth through those in power", on: "wealth" }], ["0", "anger and happiness in turn", { p: "moods that swing between anger and happiness" }]] },
  { v: "25", tone: "mixed", said: [["0", "pride"], ["+", "a firm mind"], ["-", "opposition to brothers", { p: "friction with brothers and sisters", on: "siblings" }], ["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "wealth", { on: "wealth" }]] },
  { v: "25", said: [["-", "a dull mind", { p: "a slower wit", on: "learning" }], ["-", "sorrow caused to others", { p: "grief caused to others at times" }], ["+", "friends kept", { on: "friends" }], ["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["+", "happiness at times", { on: "happiness" }]] },
  { v: "26", said: [["-", "a nasal voice", { on: "speech" }], ["-", "no children", { on: "children", g: "child-loss", h: "children" }], ["-", "a hard heart", { p: "a guarded heart" }], ["-", "stomach trouble", { p: "a sensitive stomach", on: "health" }]] },
  { v: "26", said: [["-", "trouble from enemies and from malefic planets", { p: "trouble from rivals" }], ["-", "a disorder of the lower gut", { p: "a sensitive digestion", on: "health" }], ["+", "wealth", { on: "wealth" }], ["+", "a long life", { on: "longevity", g: "longevity" }]] },
  { v: "26", said: [["-", "wealth lost through affairs with women", { on: ["wealth", "spouse"], g: "intimacy", h: "marriage" }], ["-", "separation from the wife", { on: "spouse", g: "spouse-loss", h: "marriage" }], ["-", "the loss of manhood (vitality, in today's reading)", { p: "low vitality", on: "health", g: "intimacy" }], ["0", "a self-willed and simple nature", { p: "an independent and simple nature" }]] },
  { v: "26", note: ["This is the harshest seat in his table, to be weighed against the 8th house's own strength.", "This is the hardest seat in Mantreswara's table, and it is read together with the strength of your 8th house."], said: [["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["-", "impure acts", { p: "lapses in conduct", on: "conduct" }], ["-", "a defective limb", { p: "a body that needs care", on: "health" }], ["-", "wind complaints", { p: "a tendency to wind (vata) complaints", on: "health" }], ["-", "few children", { p: "a small family", on: "children" }]] },
  { v: "27", said: [["-", "contrary speech", { p: "a contrary way of speaking", on: "speech" }], ["+", "the headship of a clan, a town or a village", { p: "a leading role in your community", on: "status" }], ["-", "want of merit", { p: "little done for merit", on: "conduct" }]] },
  { v: "27", said: [["+", "fame"], ["-", "few children", { p: "a small family", on: "children" }], ["0", "engagement in other people's business", { p: "work on other people's affairs" }], ["-", "no good deeds to one's name", { p: "little done for merit", on: "conduct" }], ["+", "fearlessness"]] },
  { v: "27", said: [["+", "prosperity", { on: "wealth" }], ["-", "few children", { p: "a small family", on: "children" }], ["+", "a long life", { on: "longevity", g: "longevity" }], ["-", "ear trouble", { p: "ears that need care", on: "health" }]] },
  { v: "27", said: [["-", "sins done in secret", { p: "hidden lapses in conduct", on: "conduct" }], ["-", "heavy spending", { on: "wealth" }], ["-", "a water-borne disease", { p: "care needed with water-related complaints", on: "health" }]] },
];

/** 8.28-33, paraphrased. */
// prettier-ignore
export const KETU: PlacementSlot[] = [
  { v: "28", said: [["-", "ingratitude", { p: "a hard time feeling thankful" }], ["-", "unhappiness", { p: "low spirits at times", on: "happiness" }], ["-", "tale-bearing", { p: "loose talk" }], ["-", "the loss of caste and position", { p: "a fall in standing", on: "status" }], ["-", "a deformed body", { p: "a body that needs care", on: "health" }], ["-", "wicked company", { p: "the wrong company" }]] },
  { v: "28", said: [["-", "no learning or riches", { p: "strain on learning and money", on: ["learning", "wealth"] }], ["-", "base speech", { p: "careless speech", on: "speech" }], ["-", "a sinister look (kudrishti)", { p: "a hard look" }], ["-", "living off another's table", { p: "dependence on others" }]] },
  { v: "29", said: [["+", "a long life", { on: "longevity", g: "longevity" }], ["+", "strength"], ["+", "wealth", { on: "wealth" }], ["+", "fame"], ["+", "happiness with the wife and good food", { p: "happiness with your partner and good food", on: "spouse" }], ["-", "the loss of a brother", { on: "siblings", g: "sibling-loss", h: "brothers and sisters" }]] },
  { v: "29", said: [["-", "the loss of lands and vehicles", { p: "strain on property and vehicles", on: "home" }], ["-", "the loss of the mother", { on: "mother", g: "parent-loss", h: "the mother" }], ["-", "the loss of happiness", { p: "low spirits at times", on: "happiness" }], ["-", "the loss of one's birthplace", { p: "a life away from your birthplace", on: "home" }], ["-", "a life in another's house", { p: "a home in another's house", on: "home" }]] },
  { v: "30", said: [["-", "the loss of children", { on: "children", g: "child-loss", h: "children" }], ["-", "stomach disease", { p: "a sensitive stomach", on: "health" }], ["-", "trouble from goblins (pishacha)", { p: "troubles the text puts down to spirits" }], ["-", "an evil mind and a wicked nature", { on: "conduct", h: "conduct" }]] },
  { v: "30", said: [["+", "magnanimity"], ["+", "the best qualities"], ["+", "firmness"], ["+", "wide fame"], ["+", "high authority", { on: "status" }], ["+", "enemies destroyed", { p: "the upper hand over rivals" }], ["+", "wishes fulfilled"]] },
  { v: "31", said: [["-", "disrespect", { p: "slights from others" }], ["-", "the company of unchaste women", { on: "spouse", g: "intimacy", h: "marriage" }], ["-", "bowel disease", { p: "a sensitive digestion", on: "health" }], ["-", "separation from the wife", { on: "spouse", g: "spouse-loss", h: "marriage" }], ["-", "the loss of vital fluid", { p: "low vitality", on: "health", g: "intimacy" }]] },
  { v: "31", note: ["A hard seat, weighed against the 8th house's own strength.", "It is read together with the strength of your 8th house."], said: [["-", "a short life", { on: "longevity", g: "longevity", h: "health" }], ["-", "separation from dear ones", { p: "distance from dear ones", on: "friends" }], ["-", "quarrels", { p: "disputes" }], ["-", "injury from a weapon", { on: "health", g: "peril", h: "health" }], ["-", "obstacles in every undertaking", { p: "delays in what you take on" }]] },
  { v: "32", said: [["-", "a sinful course", { p: "lapses in conduct", on: "conduct" }], ["-", "misfortune", { p: "setbacks" }], ["-", "the loss of the father", { on: "father", g: "parent-loss", h: "the father" }], ["-", "want", { p: "strain on money", on: "wealth" }], ["-", "slander of good people", { p: "harsh words about good people" }]] },
  { v: "32", said: [["-", "obstacles to good deeds", { p: "delays in doing good" }], ["-", "impurity and vile acts", { p: "lapses in conduct", on: "conduct" }], ["+", "energy"], ["+", "boldness"], ["+", "wide renown", { on: "status" }]] },
  { v: "33", said: [["+", "money saved", { on: "wealth" }], ["+", "many good qualities"], ["+", "enjoyment", { on: "happiness" }], ["+", "good things and the means to them"], ["+", "success in all aims"]] },
  { v: "33", said: [["-", "sins done in secret", { p: "hidden lapses in conduct", on: "conduct" }], ["-", "spending on base things", { p: "spending on the wrong things", on: "wealth" }], ["-", "wealth destroyed", { p: "strain on money", on: "wealth" }], ["-", "a contrary course", { p: "a contrary course in life" }], ["-", "eye disease", { p: "eyes that need care", on: "health" }]] },
];
