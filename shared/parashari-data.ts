// Parashari reference data, paraphrased from Brihat Parashara Hora Sastra (BPHS).
// Chapter 24 (lords of houses in houses, verses 1-144) and chapter 34 (nature of the planets by rising sign, verses 19-44).
// Wording is softened and modernised; the verse number is kept so the reading can be checked against the text.

import type { Planet } from "./astro";

/** LORD_IN_HOUSE[owned - 1][placed - 1]: effect of the lord of `owned` placed in `placed`, with the BPHS 24 verse. */
export const LORD_IN_HOUSE: Array<Array<{ verse: number; text: string; tone: "support" | "strain" | "mixed" }>> = [
  // Lord of the 1st
  [
    { verse: 1, text: "Good health and vigour; a quick, restless mind; strong attachments.", tone: "support" },
    { verse: 2, text: "Gainful and learned; a happy, principled and respected person.", tone: "support" },
    { verse: 3, text: "Courage like a lion, wealth of every kind, honour and intelligence.", tone: "support" },
    { verse: 4, text: "Happiness through both parents, many siblings, charm and virtue.", tone: "support" },
    { verse: 5, text: "Moderate happiness through children, with a loss around the first; honour, a quick temper, favour from those in power.", tone: "mixed" },
    { verse: 6, text: "With a malefic and no benefic aspect: poor health and trouble from rivals.", tone: "strain" },
    { verse: 7, text: "A malefic here strains the spouse's health; a benefic here gives wandering and want unless strong, when it gives high position.", tone: "mixed" },
    { verse: 8, text: "Deep learning, but poor health, anger, and a taste for risk and hidden things.", tone: "mixed" },
    { verse: 9, text: "Fortunate and popular, devout, skilled and eloquent; blessed with family and wealth.", tone: "support" },
    { verse: 10, text: "Happiness from the father, honour from the state, fame, and self-earned wealth.", tone: "support" },
    { verse: 11, text: "Constant gains, good qualities, fame and a wide circle.", tone: "support" },
    { verse: 12, text: "Without benefic aspect or company: poor health, fruitless spending and anger.", tone: "strain" },
  ],
  // Lord of the 2nd
  [
    { verse: 13, text: "Children and wealth, but at odds with the family; hard-headed and working for others.", tone: "mixed" },
    { verse: 14, text: "Wealth and pride; more than one union; children scarce.", tone: "mixed" },
    { verse: 15, text: "With a benefic: brave, wise, virtuous and thrifty; with a malefic: unorthodox.", tone: "mixed" },
    { verse: 16, text: "Wealth of every kind; exalted and with Jupiter, standing equal to a ruler.", tone: "support" },
    { verse: 17, text: "Wealthy, and the children too are set on earning.", tone: "support" },
    { verse: 18, text: "With a benefic, wealth through rivals; with a malefic, loss through them and injury to the legs.", tone: "mixed" },
    { verse: 19, text: "Attraction outside the marriage; a healer's occupation; a malefic here touches the spouse's conduct.", tone: "mixed" },
    { verse: 20, text: "Abundant land and wealth, but little comfort, and no happiness from an elder brother.", tone: "mixed" },
    { verse: 21, text: "Wealthy, diligent and skilled; sickly in childhood, healthy later; pilgrimages and religious observance.", tone: "support" },
    { verse: 22, text: "Passionate, honoured, learned; several unions and much wealth, but little happiness from children.", tone: "mixed" },
    { verse: 23, text: "Wealth of every kind, constant effort, honour and fame.", tone: "support" },
    { verse: 24, text: "Adventurous but without wealth, drawn to others' money; the eldest child is a worry.", tone: "strain" },
  ],
  // Lord of the 3rd
  [
    { verse: 25, text: "Self-made wealth, devotion and courage; intelligent though not bookish.", tone: "support" },
    { verse: 26, text: "Heavy-set, low in drive and effort, unhappy, with an eye on others' partners and money.", tone: "strain" },
    { verse: 27, text: "Happiness through siblings, wealth and children; cheerful.", tone: "support" },
    { verse: 28, text: "Happy, wealthy and intelligent, but the spouse is difficult.", tone: "mixed" },
    { verse: 29, text: "Children and virtue; with a malefic on it, a formidable spouse.", tone: "mixed" },
    { verse: 30, text: "At odds with siblings, well off, distant from the maternal uncle, dear to the maternal aunt.", tone: "mixed" },
    { verse: 31, text: "Service to authority; an unhappy childhood, happiness late in life.", tone: "mixed" },
    { verse: 32, text: "Livelihood in others' service; a taste for what is not one's own; the end comes near the seat of power.", tone: "strain" },
    { verse: 33, text: "Little from the father; fortune through the spouse; children and pleasures.", tone: "mixed" },
    { verse: 34, text: "Every kind of happiness and self-made wealth; questionable company.", tone: "support" },
    { verse: 35, text: "Steady gains in trade; clever though unlettered; adventurous; serves others.", tone: "support" },
    { verse: 36, text: "Spending on wrong ends; a difficult father; fortune through a woman.", tone: "mixed" },
  ],
  // Lord of the 4th
  [
    { verse: 37, text: "Learning, virtue, ornaments, land, vehicles and happiness through the mother.", tone: "support" },
    { verse: 38, text: "Pleasures, wealth of every kind, family life and honour; adventurous and shrewd.", tone: "support" },
    { verse: 39, text: "Courageous, with helpers; generous, virtuous, charitable; self-earned wealth; free from disease.", tone: "support" },
    { verse: 40, text: "A minister's standing and every kind of wealth; skilled, honoured, learned, happy and well disposed to the spouse.", tone: "support" },
    { verse: 41, text: "Happy and liked by all; devout, honoured; self-earned wealth.", tone: "support" },
    { verse: 42, text: "No happiness through the mother; anger, cunning and self-will.", tone: "strain" },
    { verse: 43, text: "High education; the inheritance is given up; silent in assemblies.", tone: "mixed" },
    { verse: 44, text: "Without domestic comfort; little from the parents.", tone: "strain" },
    { verse: 45, text: "Dear to everyone, devoted, virtuous, honoured, and happy in every way.", tone: "support" },
    { verse: 46, text: "Honour from the state, mastery of a craft, great contentment and self-command.", tone: "support" },
    { verse: 47, text: "Fear of a hidden illness; generous, virtuous, charitable and helpful.", tone: "mixed" },
    { verse: 48, text: "Without domestic comfort; vices, folly and idleness.", tone: "strain" },
  ],
  // Lord of the 5th
  [
    { verse: 49, text: "Scholarly and happy through children, but tight-fisted and crooked with others' money.", tone: "mixed" },
    { verse: 50, text: "Many children and wealth; head of the family, honoured, attached to the spouse, famous.", tone: "support" },
    { verse: 51, text: "Attached to siblings; a gossip and a miser; absorbed in one's own work.", tone: "mixed" },
    { verse: 52, text: "Happy, with the mother's blessing, wealth and intelligence; a ruler, minister or teacher.", tone: "support" },
    { verse: 53, text: "Children when a benefic is related, none when a malefic is; virtuous and dear to friends.", tone: "mixed" },
    { verse: 54, text: "Children who act as rivals, or their loss, or an adopted child.", tone: "strain" },
    { verse: 55, text: "Honoured, devout, happy through children and helpful to others.", tone: "support" },
    { verse: 56, text: "Little happiness through children; chest and lung complaints; anger.", tone: "strain" },
    { verse: 57, text: "Princely standing, an author of works, famous, the light of the family.", tone: "support" },
    { verse: 58, text: "A raja yoga: many pleasures and great fame.", tone: "support" },
    { verse: 59, text: "Learned and popular, an author, very skilled; many children and wealth.", tone: "support" },
    { verse: 60, text: "No happiness from one's own children; an adopted child.", tone: "strain" },
  ],
  // Lord of the 6th
  [
    { verse: 61, text: "Sickly but famous; at odds with one's own people; rich, honoured, adventurous and virtuous.", tone: "mixed" },
    { verse: 62, text: "Adventurous, famous among one's people, living away from home; a skilled speaker absorbed in one's own work.", tone: "mixed" },
    { verse: 63, text: "Anger without courage; at odds with every sibling; unruly helpers.", tone: "strain" },
    { verse: 64, text: "No happiness through the mother; clever, a gossip, jealous and restless, but very rich.", tone: "mixed" },
    { verse: 65, text: "Fluctuating finances; friction with children and friends; happy, selfish and kind.", tone: "mixed" },
    { verse: 66, text: "Friction with kin, friendship elsewhere; middling wealth.", tone: "mixed" },
    { verse: 67, text: "Little happiness in marriage; famous, virtuous, honoured, adventurous and wealthy.", tone: "mixed" },
    { verse: 68, text: "Sickly, hostile, covetous of others' wealth and partners.", tone: "strain" },
    { verse: 69, text: "Trade in timber, stone or chemicals; fluctuating professional fortunes.", tone: "mixed" },
    { verse: 70, text: "Known among one's people; distant from the father; happy abroad; a gifted speaker.", tone: "mixed" },
    { verse: 71, text: "Wealth through rivals; virtuous and adventurous; some want in the matter of children.", tone: "mixed" },
    { verse: 72, text: "Spending on vices, hostile to the learned, hard on living things.", tone: "strain" },
  ],
  // Lord of the 7th
  [
    { verse: 73, text: "Attraction outside the marriage; skilled but timid; wind and nerve complaints.", tone: "strain" },
    { verse: 74, text: "More than one union; wealth through the spouse; a habit of putting things off.", tone: "mixed" },
    { verse: 75, text: "Loss of children or a single child kept with difficulty; a daughter more likely.", tone: "strain" },
    { verse: 76, text: "A spouse who will not be governed; truthful, intelligent and religious; dental trouble.", tone: "mixed" },
    { verse: 77, text: "Honoured and endowed with every virtue; always cheerful; wealth of every kind.", tone: "support" },
    { verse: 78, text: "A sickly spouse and friction with them; anger and little happiness.", tone: "strain" },
    { verse: 79, text: "Happiness through the spouse; courageous, skilled and intelligent; wind complaints.", tone: "support" },
    { verse: 80, text: "Marital happiness withheld; the spouse ill, difficult and independent.", tone: "strain" },
    { verse: 81, text: "Many attachments yet well disposed to the spouse; many undertakings.", tone: "mixed" },
    { verse: 82, text: "A spouse who goes their own way; religious; wealth and children.", tone: "mixed" },
    { verse: 83, text: "Wealth through the spouse; less happiness from children; daughters.", tone: "mixed" },
    { verse: 84, text: "Want and miserliness; a livelihood in cloth; a spouse who spends.", tone: "strain" },
  ],
  // Lord of the 8th
  [
    { verse: 85, text: "Poor health and injuries; hostile to the pious.", tone: "strain" },
    { verse: 86, text: "Low vigour, little wealth, and what is lost is not recovered.", tone: "strain" },
    { verse: 87, text: "No happiness through siblings; idle, without helpers or strength.", tone: "strain" },
    { verse: 88, text: "Separation from the mother; no house, land or comfort; false to friends.", tone: "strain" },
    { verse: 89, text: "Slow-witted, few children, but long-lived and wealthy.", tone: "mixed" },
    { verse: 90, text: "Victory over rivals; illness; danger from snakes and water in childhood.", tone: "mixed" },
    { verse: 91, text: "Two unions; with a malefic here, a fall in business.", tone: "strain" },
    { verse: 92, text: "Long life; if weak here, medium life and a blaming, blameworthy nature.", tone: "mixed" },
    { verse: 93, text: "Turns from one's faith; a difficult spouse; takes what is not one's own.", tone: "strain" },
    { verse: 94, text: "No happiness from the father, a gossip, without a livelihood; a benefic aspect cancels these.", tone: "strain" },
    { verse: 95, text: "With a malefic: no wealth, a hard youth and a happy later life; with a benefic: long life.", tone: "mixed" },
    { verse: 96, text: "Spending on wrong ends and a short life, more so with a malefic there too.", tone: "strain" },
  ],
  // Lord of the 9th
  [
    { verse: 97, text: "Fortunate, honoured by the state and the public; virtuous, charming and learned.", tone: "support" },
    { verse: 98, text: "A scholar dear to all; wealthy, pleasure-loving, happy through spouse and children.", tone: "support" },
    { verse: 99, text: "Happiness through siblings; wealthy, virtuous and charming.", tone: "support" },
    { verse: 100, text: "Houses, vehicles and happiness; wealth of every kind; devoted to the mother.", tone: "support" },
    { verse: 101, text: "Children and prosperity; devoted to elders; bold, charitable and learned.", tone: "support" },
    { verse: 102, text: "Meagre fortune; no happiness from the mother's side; troubled by rivals.", tone: "strain" },
    { verse: 103, text: "Happiness after marriage; virtuous and famous.", tone: "support" },
    { verse: 104, text: "Fortune withheld; no happiness from an elder brother.", tone: "strain" },
    { verse: 105, text: "Abundant fortune, virtue and beauty; much happiness through siblings.", tone: "support" },
    { verse: 106, text: "A ruler or the equal of one, a minister or commander; virtuous and dear to all.", tone: "support" },
    { verse: 107, text: "Gains that grow day by day; devoted to elders; virtuous and meritorious.", tone: "support" },
    { verse: 108, text: "Loss of fortune; spending on good causes; impoverished by hospitality.", tone: "strain" },
  ],
  // Lord of the 10th
  [
    { verse: 109, text: "Scholarly, famous, a poet; illness in childhood, happiness later; wealth that grows day by day.", tone: "support" },
    { verse: 110, text: "Wealthy, virtuous, honoured by the state, charitable; happiness from the father.", tone: "support" },
    { verse: 111, text: "Happiness through siblings and helpers; brave, virtuous, eloquent and truthful.", tone: "support" },
    { verse: 112, text: "Happy; devoted to the mother's welfare; master of vehicles, land and houses; virtuous and wealthy.", tone: "support" },
    { verse: 113, text: "Every kind of learning; always cheerful; wealth and children.", tone: "support" },
    { verse: 114, text: "No happiness from the father; skilled but without wealth; troubled by rivals.", tone: "strain" },
    { verse: 115, text: "Happiness through the spouse; intelligent, virtuous, eloquent, truthful and religious.", tone: "support" },
    { verse: 116, text: "Without worthy work; long-lived; given to blaming others.", tone: "strain" },
    { verse: 117, text: "Rulership for the well-born, the equal of it for others; wealth and happiness through children.", tone: "support" },
    { verse: 118, text: "Skilled in every task; brave, truthful and devoted to elders.", tone: "support" },
    { verse: 119, text: "Wealth, happiness and children.", tone: "support" },
    { verse: 120, text: "Spending through the powerful; fear of rivals; worried despite skill.", tone: "strain" },
  ],
  // Lord of the 11th
  [
    { verse: 121, text: "Genuine, rich, happy and even-handed; a poet and speaker; always gaining.", tone: "support" },
    { verse: 122, text: "Every kind of wealth and accomplishment; charitable, religious and happy.", tone: "support" },
    { verse: 123, text: "Skilled in every task; wealthy; happiness through siblings; occasional joint pain.", tone: "support" },
    { verse: 124, text: "Gains from the mother's side; pilgrimages; happiness of house and land.", tone: "support" },
    { verse: 125, text: "Children who are happy, educated and good; a religious and contented life.", tone: "support" },
    { verse: 126, text: "Illness, harshness, life in foreign places, trouble from rivals.", tone: "strain" },
    { verse: 127, text: "Gains through the spouse's family; generous, virtuous, pleasure-loving; the spouse leads.", tone: "mixed" },
    { verse: 128, text: "Reversals in undertakings; long life; the spouse goes first.", tone: "strain" },
    { verse: 129, text: "Fortunate, skilled, truthful, honoured by the state and affluent.", tone: "support" },
    { verse: 130, text: "Honoured by the state; virtuous, devout, intelligent, truthful and self-controlled.", tone: "support" },
    { verse: 131, text: "Gains in every undertaking; learning and happiness that grow day by day.", tone: "support" },
    { verse: 132, text: "Spending on good deeds; pleasure-loving; many attachments; friends among foreigners.", tone: "mixed" },
  ],
  // Lord of the 12th
  [
    { verse: 133, text: "A spender of weak constitution; phlegmatic complaints; short of wealth and learning.", tone: "strain" },
    { verse: 134, text: "Spending on good causes; religious, soft-spoken, virtuous and happy.", tone: "support" },
    { verse: 135, text: "No happiness through siblings; ill will to others; self-serving.", tone: "strain" },
    { verse: 136, text: "No happiness through the mother; losses in land, vehicles and houses.", tone: "strain" },
    { verse: 137, text: "Children and learning withheld; spending and pilgrimage in hope of a child.", tone: "strain" },
    { verse: 138, text: "Enmity with one's own people; anger, wrongdoing and misery.", tone: "strain" },
    { verse: 139, text: "Spending on account of the spouse; no marital happiness; short of learning and strength.", tone: "strain" },
    { verse: 140, text: "Always gaining; pleasant of speech; a medium life; good qualities.", tone: "support" },
    { verse: 141, text: "Disrespect to elders; hostile even to friends; bent on one's own ends.", tone: "strain" },
    { verse: 142, text: "Spending through the powerful; moderate happiness from the father.", tone: "mixed" },
    { verse: 143, text: "Losses; raised by others; occasional gains through others.", tone: "strain" },
    { verse: 144, text: "Heavy spending; poor health; irritable and spiteful.", tone: "strain" },
  ],
];

export type FunctionalRole = "auspicious" | "malefic" | "yogakaraka" | "yogaPair" | "maraka" | "neutral";

export interface LagnaNature {
  verses: string;
  auspicious: Planet[];
  malefic: Planet[];
  /** Planets owning both a kendra and a trikona from this lagna — the single-planet yogakaraka of 34.13-14 — whether the lagna verse names it or the rule does (byRule). */
  yogakaraka: Planet[];
  /** Planets owning a kendra and a trikona together by the general rule of 34.13-14, not named so in the lagna verse. */
  byRule?: Planet[];
  /** The verse's dual: two planets (a kendra lord and a trikona lord) it names in the dual as the raja-yoga or yoga kārakas. They give the yoga only together — each alone owns just one of the two. */
  yogaPair?: [Planet, Planet];
  /** Planets named as killers (independently or by association). */
  maraka: Planet[];
  neutral: Planet[];
  note: string;
}

/** BPHS 34.19-44, by rising sign (Aries = 0). */
export const LAGNA_NATURE: LagnaNature[] = [
  { verses: "34.19-22", auspicious: ["Jupiter", "Sun"], malefic: ["Saturn", "Mercury", "Venus"], yogakaraka: [], maraka: ["Venus"], neutral: ["Mars"], note: "Mars, though 8th lord, helps the benefics. Saturn and Jupiter together give no yoga; Jupiter under a malefic turns bad. Saturn kills only in Venus's company." },
  { verses: "34.23-24", auspicious: ["Saturn", "Sun"], malefic: ["Jupiter", "Venus", "Moon"], yogakaraka: ["Saturn"], byRule: ["Saturn"], maraka: ["Jupiter", "Mars"], neutral: ["Mercury"], note: "Saturn gives raja yoga, owning the 9th and 10th. Mercury is mildly auspicious." },
  { verses: "34.25-26", auspicious: ["Venus"], malefic: ["Mars", "Jupiter", "Sun"], yogakaraka: [], maraka: ["Moon"], neutral: ["Saturn", "Mercury"], note: "Venus is the only benefic. The Moon is the prime killer, by association." },
  { verses: "34.27-28", auspicious: ["Mars", "Jupiter", "Moon"], malefic: ["Venus", "Mercury"], yogakaraka: ["Mars"], byRule: ["Mars"], maraka: ["Saturn", "Sun"], neutral: [], note: "Mars alone gives a full yoga, owning the 5th and 10th." },
  { verses: "34.29-30", auspicious: ["Mars", "Jupiter", "Sun"], malefic: ["Mercury", "Venus", "Saturn"], yogakaraka: ["Mars"], byRule: ["Mars"], maraka: ["Saturn", "Moon"], neutral: [], note: "Mars owns the 4th and 9th and is yogakaraka by the general rule of 34.13-14; the verse names it only as auspicious. Jupiter and Venus together give no good, though they own a trine and an angle." },
  { verses: "34.31-32", auspicious: ["Mercury", "Venus"], malefic: ["Mars", "Jupiter", "Moon"], yogakaraka: [], yogaPair: ["Venus", "Mercury"], maraka: ["Venus"], neutral: ["Sun", "Saturn"], note: "The verse names Venus and Mercury in the dual as the two yogakarakas (bhārgavendusutāv eva bhavetāṃ yogakārakau): Venus owns the 9th trine, Mercury the 10th angle, and they give the yoga only as a pair — neither owns an angle and a trine alone. Venus is also a killer. The Sun follows its company." },
  { verses: "34.33-34", auspicious: ["Saturn", "Mercury"], malefic: ["Jupiter", "Sun", "Mars"], yogakaraka: ["Saturn"], byRule: ["Saturn"], yogaPair: ["Moon", "Mercury"], maraka: ["Mars"], neutral: ["Venus"], note: "Saturn alone owns the 4th angle and the 5th trine, and is the single-planet yogakaraka by 34.13-14; the verse names it only as auspicious. The Moon and Mercury become the two karakas of raja yoga (bhavetāṃ rājayogasya kārakau, dual) — the 10th and 9th lords, a yoga only as a pair. Jupiter and the other malefics can also kill." },
  { verses: "34.35-36", auspicious: ["Jupiter", "Moon"], malefic: ["Venus", "Mercury", "Saturn"], yogakaraka: [], yogaPair: ["Sun", "Moon"], maraka: ["Venus"], neutral: ["Mars"], note: "The verse names the Sun and the Moon in the dual as the two yogakarakas (sūryācandramasāv eva bhavetāṃ yogakārakau): the Sun owns the 10th angle, the Moon the 9th trine, and the yoga comes only from the pair — this lagna has no single-planet yogakaraka. Venus and the other malefics acquire killing power." },
  { verses: "34.37-38", auspicious: ["Mars", "Sun"], malefic: ["Venus"], yogakaraka: [], yogaPair: ["Sun", "Mercury"], maraka: ["Saturn", "Venus"], neutral: ["Jupiter", "Moon"], note: "Only Venus is inauspicious. The yoga arises through the Sun and Mercury together (yogo bhāskarasaumyābhyām, dual instrumental) — the 9th and 10th lords as a pair, not singly. Saturn is the killer." },
  { verses: "34.39-40", auspicious: ["Venus", "Mercury"], malefic: ["Mars", "Jupiter", "Moon"], yogakaraka: ["Venus"], byRule: ["Venus"], maraka: ["Mars"], neutral: ["Sun", "Saturn"], note: "Only Venus gives a superior yoga, owning the 5th and 10th. Saturn does not kill on its own." },
  { verses: "34.41-42", auspicious: ["Venus", "Saturn"], malefic: ["Jupiter", "Moon", "Mars"], yogakaraka: ["Venus"], byRule: ["Venus"], maraka: ["Jupiter", "Sun", "Mars"], neutral: ["Mercury"], note: "Venus is the only raja yoga planet, owning the 4th and 9th. Mercury gives mixed effects." },
  { verses: "34.43-44", auspicious: ["Mars", "Moon"], malefic: ["Saturn", "Venus", "Sun", "Mercury"], yogakaraka: [], yogaPair: ["Mars", "Jupiter"], maraka: ["Saturn", "Mercury"], neutral: ["Jupiter"], note: "The verse names Mars and Jupiter in the dual as the two yogakarakas (mahīsutagurū yogakārakau): Mars owns the 9th trine, Jupiter the 10th angle, and they give the yoga only as a pair. Mars is a killer but not on its own." },
];

export const BPHS_URL = (ch: number) => `http://jyotishvidya.com/ch${ch}.htm`;
