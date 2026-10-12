/**
 * Plain meanings for the Parashari combinations (the yoga and strain findings of the Combinations
 * chapter): a modern sentence saying what the combination is read to bring, and a short gist for
 * lists. Each line restates the result the finding's own source gives, in today's register
 * ("kingly standing" becomes high standing, "a minister" a senior post); where the line draws on
 * verses beyond the ones the finding cites, it names them. Where the source states no result, the
 * line says only what the configuration is. Harsh results are worded gently and read as patterns to
 * weigh, never as verdicts. The gate for minors strips these lines with the rest of the finding
 * (computeParashari runs redactSensitive over the whole result).
 *
 * Sources for the lines whose findings state no result in their own text:
 * - Kendra-trikona and node yogas: BPHS 34.11-17 ("One born in such a yoga will become a king and
 *   be famous"; a node in an angle or trine with the other kind of lord "will become Yogakaraka").
 * - Raja yogas of ch. 39: 39.1-2 (yogas "making one entitled to royal honors"), 39.19-31.
 * - Pancha Mahapurusha: 75.3-22, the descriptions of the five natives (the ages at death are left out).
 * - Penury, ch. 42: 42.2-6 ("the native will be penniless"), 42.16 (Mars and Saturn in the 2nd).
 * All at jyotishvidya.com (chapters 34, 39, 42 and 75).
 */
import type { ParashariFinding } from "./parashari";

export interface PlainMeaning {
  /** One or two sentences in plain words. */
  plain: string;
  /** A few words for lists. */
  gist: string;
}

type Make = (f: ParashariFinding) => PlainMeaning | undefined;
const E = (plain: string, gist: string): PlainMeaning => ({ plain, gist });

const suffix = (id: string) => id.slice(id.lastIndexOf("-") + 1);

/** The solar yogas (38.1-4) reverse their gifts when formed by malefics. */
const solar =
  (where: string, gifts: string, gist: string): Make =>
  (f) =>
    f.tone === "support"
      ? E(`${where} Parashara promises ${gifts}.`, gist)
      : f.tone === "strain"
        ? E(
            `${where} The planets there are malefics, so Parashara reverses this yoga's usual gifts (${gifts}); read it as a mild check on them.`,
            `a check on ${gist}`,
          )
        : E(
            `${where} Benefics and malefics form it together, so it comes mixed: the benefics bring ${gifts}, the malefics their opposite.`,
            `${gist}, mixed`,
          );

const PENURY_CARE =
  "read it as a call for care with money and savings, weighed with the wealth combinations above.";

const MAHAPURUSHA: Record<string, PlainMeaning> = {
  Mars: E(
    "Mars, strong in an angle, forms Ruchaka, one of the five yogas of an exceptional person. Parashara describes someone vigorous and enterprising who prevails over rivals and is drawn to contest (75.3-7).",
    "drive and victory over rivals",
  ),
  Mercury: E(
    "Mercury, strong in an angle, forms Bhadra, one of the five yogas of an exceptional person. Parashara describes someone learned and independent, fond of comfort, who looks after the family and shares good fortune with friends (75.8-12).",
    "learning, independence and comfort",
  ),
  Jupiter: E(
    "Jupiter, strong in an angle, forms Hamsa, one of the five yogas of an exceptional person. Parashara describes someone of fine appearance and sharp intelligence, of high standing, who enjoys life fully (75.13-16).",
    "intelligence, standing and enjoyment",
  ),
  Venus: E(
    "Venus, strong in an angle, forms Malavya, one of the five yogas of an exceptional person. Parashara describes someone graceful and attractive who lives happily, in comfort and with standing (75.17-19).",
    "grace, comfort and happiness",
  ),
  Saturn: E(
    "Saturn, strong in an angle, forms Sasa, one of the five yogas of an exceptional person. Parashara describes someone brave and shrewd, who knows an opponent's weak points and rises to authority, though the verse also notes a grasping streak with others' wealth (75.20-22).",
    "courage, shrewdness and authority",
  ),
};

const SANKHYA: Record<string, PlainMeaning> = {
  "1": E(
    "All the planets crowd into one sign. Parashara reads strength, but lean means, little learning and sorrow; read it as a pattern to work against, weighed with the rest of the chart.",
    "strength, but lean times",
  ),
  "2": E(
    "All the planets crowd into two signs. Parashara reads an unconventional, isolated path, lean means and thin support from family; read it as a pattern to work against.",
    "an isolated, lean pattern",
  ),
  "3": E(
    "All the planets crowd into three signs. Parashara reads a sharp temper and a slow pace, lean means, and courage with fame won through conflict.",
    "courage and fame through conflict",
  ),
  "4": E(
    "The planets spread over four signs. Parashara reads usefulness to many, work on the land, truthfulness, happiness and wealth, with a changeable mind.",
    "usefulness, happiness and wealth",
  ),
  "5": E(
    "The planets spread over five signs. Parashara reads skill at work, a talkative nature and many people working for you, with cautions about being tied down and about being less than straight.",
    "skill and helpers, with cautions",
  ),
  "6": E(
    "The planets spread over six signs. Parashara promises a helpful nature, honestly earned wealth, comfort, a good name, many children, gems and courage.",
    "helpfulness and honest wealth",
  ),
  "7": E(
    "The planets spread over seven signs. Parashara promises a love of music and dance, skill, happiness, wealth and leadership.",
    "music, skill and leadership",
  ),
};

const RAJA_39 = (how: string): PlainMeaning =>
  E(
    `${how} Parashara counts this among the Raja yogas, the combinations for royal honours (39.1-2), read today as a lift in standing and recognition.`,
    "a lift in standing",
  );

const ASCETIC = (how: string): PlainMeaning =>
  E(
    `${how} Parashara reads a turn toward renunciation and a spiritual order; read today as a strong pull toward the spiritual life and detachment.`,
    "a pull toward the spiritual life",
  );

const EXACT: Record<string, PlainMeaning | Make> = {
  // Ch. 35, Nabhasa: patterns made by all seven planets together.
  "pa-nabhasa-rajju": E(
    "All the planets sit in movable signs, a restless, outward-looking pattern. Parashara reads a love of travel, charm and earnings abroad, and warns of a hard, mischievous edge.",
    "travel and earnings abroad",
  ),
  "pa-nabhasa-musala": E(
    "All the planets sit in fixed signs, a steady pattern. Parashara promises honour, wisdom, wealth, the favour of those in power, a good name, many children and a firm character.",
    "steadiness, honour and wealth",
  ),
  "pa-nabhasa-nala": E(
    "All the planets sit in dual signs, an adaptable pattern. Parashara reads great skill, a careful eye for saving, helpfulness to relatives and charm.",
    "skill and helpfulness",
  ),
  "pa-nabhasa-maala": E(
    "Benefics alone hold three of the angles, the chart's pillars. Parashara promises lasting happiness, vehicles, clothes, good food, pleasures and a fine presence.",
    "lasting comfort and happiness",
  ),
  "pa-nabhasa-sarpa": E(
    "Only harsher planets hold three of the angles. Parashara reads a hard, crooked streak and lean, dependent times; read it as a pattern to work against, weighed with the rest of the chart.",
    "a hard pattern to work against",
  ),
  "pa-nabhasa-gada": E(
    "The planets gather in two neighbouring angles. Parashara reads steady effort to earn, religious observance, learning and musical skill, and wealth in gold and gems.",
    "effort rewarded with wealth",
  ),
  "pa-nabhasa-sakata": E(
    "The planets gather in the rising sign and the 7th. Parashara reads hardship: poor health, heavy toil, lean means and few friends; read it as a pattern to work against.",
    "a pattern of hardship",
  ),
  "pa-nabhasa-vihaga": E(
    "The planets gather in the 4th and 10th. Parashara reads a roving life, work carrying messages and a quarrelsome streak.",
    "a roving life",
  ),
  "pa-nabhasa-sringataka": E(
    "The planets gather in the rising sign and the two trines. Parashara promises a fighting spirit, happiness, the favour of those in power, a good spouse and wealth, and adds a distrust of women.",
    "favour, a good spouse and wealth",
  ),
  "pa-nabhasa-hala": E(
    "The planets gather in three houses four apart. Parashara reads a large appetite, lean means, work on the land and service, with relatives drifting away; read it as a pattern to work against.",
    "a hard-working, lean pattern",
  ),
  "pa-nabhasa-vajra": E(
    "Benefics in the rising sign and 7th, malefics in the 4th and 10th. Parashara reads happiness at the start and end of life, courage and charm, but little drive or luck and a hostile streak.",
    "happy at the start and the end",
  ),
  "pa-nabhasa-yava": E(
    "Malefics in the rising sign and 7th, benefics in the 4th and 10th. Parashara reads religious discipline and good works, with happiness, wealth and children in middle life, generosity and firmness.",
    "good works and a happy middle life",
  ),
  "pa-nabhasa-kamala": E(
    "All the planets stand in the four angles. Parashara promises wealth, virtue, a long life, wide fame, integrity, many good deeds and high standing.",
    "wealth, fame and standing",
  ),
  "pa-nabhasa-vapi": E(
    "All the planets stand in the houses after the angles, or in those before them. Parashara promises lasting savings, happiness, children, good eyesight and high standing.",
    "lasting wealth and happiness",
  ),
  "pa-nabhasa-yupa": E(
    "The planets fill the four houses from the rising sign. Parashara reads spiritual knowledge, religious observance, a spouse, strength, self-discipline and distinction.",
    "spiritual knowledge and distinction",
  ),
  "pa-nabhasa-sara": E(
    "The planets fill the four houses from the 4th. Parashara reads livelihoods in harsh trades and a hard edge; read it as a pattern weighed with the rest of the chart.",
    "harsh trades and a hard edge",
  ),
  "pa-nabhasa-sakthi": E(
    "The planets fill the four houses from the 7th. Parashara reads lean means, setbacks, unhappiness and a slow pace, but a long life, fighting skill and firmness.",
    "setbacks, but firmness",
  ),
  "pa-nabhasa-danda": E(
    "The planets fill the four houses from the 10th. Parashara reads a hard pattern: strain in close family ties, lean means, coldness and service to others; read it as a pattern to work against, not a verdict.",
    "a hard pattern for family and means",
  ),
  "pa-nabhasa-nauka": E(
    "The planets fill the seven houses from the rising sign. Parashara reads a living connected with water, wealth and fame, with a mean, miserly streak.",
    "earnings by water, and fame",
  ),
  "pa-nabhasa-koota": E(
    "The planets fill the seven houses from the 4th. Parashara reads untruthfulness, work guarding prisons, lean means, craft and a life in rough country; read it as a pattern to work against.",
    "a rough, hard pattern",
  ),
  "pa-nabhasa-chatra": E(
    "The planets fill the seven houses from the 7th. Parashara promises help to one's own people, kindness, the regard of those in power, intelligence, happiness early and late in life, and a long life.",
    "kindness, regard and happiness",
  ),
  "pa-nabhasa-chapa": E(
    "The planets fill the seven houses from the 10th. Parashara reads secrecy, untruthfulness, wandering and poor luck, with happiness in middle life.",
    "a hard start, happier middle years",
  ),
  "pa-nabhasa-ardhachandra": E(
    "The planets fill seven houses in a row from a house that is not an angle. Parashara promises command, a fine presence, the favour of those in power, strength and riches; this definition is provisional.",
    "command, favour and riches",
  ),
  "pa-nabhasa-chakra": E(
    "The planets fill every other house from the rising sign. Parashara promises outstanding standing, with the powerful deferring to you.",
    "outstanding standing",
  ),
  "pa-nabhasa-samudra": E(
    "The planets fill every other house from the 2nd. Parashara promises gems, abundant and lasting wealth, pleasures, popularity and a good nature.",
    "abundant, lasting wealth",
  ),

  // Ch. 36.
  "pa-yoga-gajakesari": E(
    "Jupiter stands well placed in an angle and is helped by another benefic: the 'elephant and lion' yoga. Parashara promises a bright presence, wealth, intelligence and the regard of people in authority.",
    "wealth, intelligence and respect",
  ),
  "pa-yoga-parvata": E(
    "Benefics hold the angles, and the 7th and 8th are empty or hold only benefics. Parashara promises wealth, a gift for speech, learning and leadership in the community.",
    "wealth, eloquence and leadership",
  ),
  "pa-yoga-chamara": E(
    "A strong ruler of the rising sign blessed by Jupiter, or benefics paired in a key house. Parashara promises honour, a long life, learning and a gift for speech.",
    "honour, learning and eloquence",
  ),
  "pa-yoga-sankha": E(
    "The rulers of the 5th and 6th stand in angles from each other under a strong ruler of the rising sign. Parashara promises wealth, a good family, a kind nature and a long life.",
    "wealth, family and kindness",
  ),
  "pa-yoga-sankha-2": E(
    "The rulers of the rising sign and the 10th sit in movable signs, with a strong 9th lord. Parashara promises wealth, spouse and children, kindness, merit, intelligence and a long life.",
    "wealth, family and kindness",
  ),
  "pa-yoga-lakshmi": E(
    "The ruler of fortune (the 9th) stands in an angle in its own or exaltation sign, with a strong ruler of the rising sign. Parashara promises charm, high standing, children and abundant wealth.",
    "abundance and high standing",
  ),
  "pa-yoga-khadga": E(
    "The rulers of wealth (the 2nd) and fortune (the 9th) trade places while the ruler of the rising sign stands in an angle or trine. Parashara promises wealth, good fortune, learning and skill.",
    "fortune, learning and skill",
  ),
  "pa-yoga-kalanidhi": E(
    "Jupiter stands in the 2nd or 5th, looked at by Mercury and Venus. Parashara promises virtue, honour, good health, wealth and learning.",
    "honour, health and learning",
  ),
  "pa-yoga-subha": E(
    "Benefics strengthen the rising sign, standing in it or on both sides of it. Parashara promises a gift for speech, charm and good character.",
    "eloquence, charm and good character",
  ),
  "pa-yoga-asubha": E(
    "Harsher planets press on the rising sign, standing in it or on both sides of it. Parashara reads a pull toward pleasure and self-interest and a reliance on other people's money; a tendency to watch, not a verdict.",
    "a self-serving streak to watch",
  ),
  "pa-yoga-kahala": E(
    "Parashara promises energy, daring and the ability to lead, with authority over a modest domain, and adds a streak of cunning.",
    "energy, daring and command",
  ),
  "pa-yoga-bheri": E(
    "With a strong ruler of fortune (the 9th), Parashara promises wealth, spouse and children, high standing, a good name, virtue, good conduct and pleasures.",
    "wealth, family and standing",
  ),
  "pa-yoga-mridanga": E(
    "A strong ruler of the rising sign, with every other planet in a good house or sign. Parashara promises high standing, or its equal, and happiness.",
    "standing and happiness",
  ),
  "pa-yoga-srinatha": E(
    "The ruler of partnership sits in the house of work, and the ruler of work is exalted with the ruler of fortune. Parashara compares such a person to Indra, king of the gods, his image for the highest standing and enjoyment.",
    "the highest standing",
  ),
  "pa-yoga-sarada": E(
    "Parashara promises wealth, spouse and children, happiness, learning, the favour of those in power, devotion and virtue.",
    "wealth, learning and favour",
  ),
  "pa-yoga-matsya": E(
    "Parashara describes someone kind, upright, strong, good-looking, well known, learned and devout, with a gift for astrology.",
    "learning, kindness and repute",
  ),
  "pa-yoga-koorma": E(
    "Well placed benefics in the 5th, 6th and 7th, and well placed malefics in the 1st, 3rd and 11th. Parashara promises high standing, courage, virtue, a good name, a helpful nature, happiness and leadership.",
    "standing, courage and leadership",
  ),
  "pa-yoga-kusuma": E(
    "With a fixed sign rising, Parashara promises high standing or its equal, generosity, pleasures, happiness and a leading place among one's people.",
    "standing and generosity",
  ),
  "pa-yoga-kalpadruma": E(
    "The chain of rulers that starts from the ruler of the rising sign is all well placed: the 'wish-fulfilling tree'. Parashara promises wealth of every kind, high standing, devotion, strength, a competitive spirit and compassion.",
    "wealth of every kind",
  ),
  "pa-yoga-hari": E(
    "Benefics hold the 2nd, 12th and 8th counted from the ruler of wealth. Parashara promises happiness, learning, wealth and children.",
    "happiness, learning and wealth",
  ),
  "pa-yoga-hara": E(
    "Benefics hold the 4th, 9th and 8th counted from the ruler of partnership. Parashara promises happiness, learning, wealth and children.",
    "happiness, learning and wealth",
  ),
  "pa-yoga-brahma": E(
    "Benefics hold the 4th, 10th and 11th counted from the ruler of the rising sign. Parashara promises happiness, learning, wealth and children.",
    "happiness, learning and wealth",
  ),
  // 36.38-39, the lagna lord's grade over the ten finer charts.
  "pa-yoga-36-38-parijata": E(
    "The ruler of the rising sign is well placed in two of the ten finer charts, the grade called Parijata. Parashara reads this as happiness.",
    "happiness",
  ),
  "pa-yoga-36-38-uttama": E(
    "The ruler of the rising sign is well placed in three of the ten finer charts, the grade called Uttama. Parashara reads this as freedom from illness; the grade's name in the verse is uncertain.",
    "good health",
  ),
  "pa-yoga-36-38-gopura": E(
    "The ruler of the rising sign is well placed in four of the ten finer charts, the grade called Gopura. Parashara reads this as wealth and plentiful provisions.",
    "wealth and provisions",
  ),
  "pa-yoga-36-38-simhasana": E(
    "The ruler of the rising sign is well placed in five of the ten finer charts, the grade called Simhasana, 'the throne'. Parashara reads this as high standing.",
    "high standing",
  ),
  "pa-yoga-36-38-paravata": E(
    "The ruler of the rising sign is well placed in six of the ten finer charts, the grade called Paravata. Parashara reads this as learning and scholarship.",
    "scholarship",
  ),
  "pa-yoga-36-38-devaloka": E(
    "The ruler of the rising sign is well placed in seven of the ten finer charts, the grade called Devaloka. Parashara reads this as plenty and vehicles.",
    "plenty and vehicles",
  ),
  "pa-yoga-36-38-sakravahana": E(
    "The ruler of the rising sign is well placed in nine of the ten finer charts, the grade called Sakravahana. Parashara reads this as fame and honour from those in authority; the grade's name in the verse is uncertain.",
    "fame and honour",
  ),
  "pa-yoga-lagnadhi": E(
    "Benefics hold the 7th and 8th, untouched by malefics. Parashara promises greatness, learning and happiness.",
    "greatness and learning",
  ),

  // Ch. 37, the Moon.
  "pa-lunar-37-1": (f) => {
    const grade = /as (little|middling|excellent) for/.exec(f.text)?.[1];
    const word = grade === "little" ? "modest" : grade;
    return word
      ? E(
          `The Moon's distance from the Sun sets a baseline for wealth, intelligence and skill; for this placement Parashara grades it ${word}.`,
          `${word === "excellent" ? "an" : "a"} ${word} baseline for wealth`,
        )
      : undefined;
  },
  "pa-lunar-37-2": (f) =>
    /neutral/.test(f.title)
      ? E(
          "The Moon has the helping aspect this rule asks for, but from a neutral portion of its sign. Parashara reads the contrary case as little wealth; taking this as the contrary is provisional.",
          "modest means (provisional)",
        )
      : E(
          "The Moon is helped by Jupiter (in a day birth) or Venus (at night) from a friendly portion of its sign. Parashara promises wealth and happiness.",
          "wealth and happiness",
        ),
  "pa-lunar-adhi": E(
    "Benefics stand in the 6th, 7th and 8th from the Moon. Parashara promises high office (a ruler, a senior minister or a commander, by the strength of the planets that form it).",
    "high office",
  ),
  "pa-lunar-dhana": (f) =>
    E(
      `Benefics stand in the Moon's houses of growth (the 3rd, 6th, 10th and 11th from it). Parashara promises ${f.text.includes("great affluence") ? "great affluence" : "a middling measure of wealth"}.`,
      f.text.includes("great affluence")
        ? "great affluence"
        : "a middling measure of wealth",
    ),
  "pa-lunar-duradhara": E(
    "Planets stand on both sides of the Moon. Parashara promises comforts, a generous nature, wealth, vehicles and good people around you.",
    "comfort, wealth and good company",
  ),
  "pa-lunar-sunapha": E(
    "A planet stands in the 2nd from the Moon. Parashara promises high standing or its equal, intelligence, a good name and self-made wealth.",
    "self-made wealth and repute",
  ),
  "pa-lunar-anapha": E(
    "A planet stands in the 12th from the Moon. Parashara promises high standing, good health, virtue, a good name, charm and happiness.",
    "health, repute and happiness",
  ),
  "pa-lunar-kemadruma": (f) =>
    /cancelled/.test(f.title)
      ? E(
          "The Moon stands alone by Parashara's test, but the relief that later texts name applies, so the lonely Moon is read as eased.",
          "a lonely Moon, eased",
        )
      : E(
          "The Moon stands alone: no planet beside it, on either side of it, or in an angle. Parashara reads harder times: criticism, little learning and lean means. Weigh it against the supportive yogas in this chart.",
          "a lonely Moon, to be weighed",
        ),

  // Ch. 38, the Sun.
  "pa-solar-ubhayachari": solar(
    "Planets stand on both sides of the Sun.",
    "high standing or its equal, and happiness",
    "standing and happiness",
  ),
  "pa-solar-vesi": solar(
    "A planet stands in the 2nd from the Sun.",
    "steady sight, truthfulness, a tall frame, an easygoing nature, happiness and modest wealth",
    "truthfulness and contentment",
  ),
  "pa-solar-vosi": solar(
    "A planet stands in the 12th from the Sun.",
    "skill, generosity, a good name, learning and strength",
    "skill and generosity",
  ),

  // Ch. 39, Raja yogas from weakness in the difficult houses.
  "pa-raja-39-19": RAJA_39(
    "Fallen planets sit in the 3rd, 6th or 8th while a strong ruler of the rising sign looks at it.",
  ),
  "pa-raja-39-20": RAJA_39(
    "The rulers of the difficult houses are weak while a strong ruler of the rising sign looks at it.",
  ),
  "pa-raja-39-28": RAJA_39(
    "A fallen ruler of a difficult house looks at the rising sign, which Parashara says is enough.",
  ),
  "pa-raja-39-29": RAJA_39(
    "A fallen planet in a difficult house, or in the 3rd or 11th, looks at the rising sign.",
  ),

  // Ch. 40, association with those in power.
  "pa-royal-40-1": E(
    "Parashara promises a leading place among those in power, today a senior post in government or a large institution.",
    "a senior post",
  ),
  "pa-royal-40-2": E(
    "Parashara promises a leading place among those in power.",
    "a leading place",
  ),
  "pa-royal-40-3": E(
    "Parashara promises sharp intelligence and the standing of a senior adviser (a minister, in his words).",
    "a senior adviser's standing",
  ),
  "pa-royal-40-4": E(
    "Parashara says you will surely serve those in power as a senior adviser (a minister, in his words).",
    "a senior adviser's role",
  ),
  "pa-royal-40-5": E(
    "Parashara promises a senior post (a minister's office) and a good name.",
    "office and repute",
  ),
  "pa-royal-40-6": E(
    "Parashara promises the favour and backing of people in power, and happiness from it.",
    "the backing of the powerful",
  ),
  "pa-royal-40-7": E(
    "Parashara promises command, an army chief in his words; today, the lead of a large force or organisation.",
    "command",
  ),
  "pa-royal-40-8": E(
    "Parashara promises a senior post (a minister's office).",
    "a senior post",
  ),
  "pa-royal-40-9": E(
    "Parashara promises a senior post (a minister's office) in later years.",
    "a senior post later in life",
  ),
  "pa-royal-40-10": E(
    "Parashara promises wealth through the backing of people in power.",
    "wealth through patronage",
  ),
  "pa-royal-40-11": E(
    "Parashara promises ties with ruling circles.",
    "ties with those in power",
  ),
  "pa-royal-40-12": E(
    "Parashara promises gains through ties with those in power.",
    "gains through the powerful",
  ),
  "pa-royal-40-13": E(
    "The rulers of the self and of work trade places. Parashara promises close and lasting ties with those in power.",
    "close ties with the powerful",
  ),
  "pa-royal-40-14": E(
    "Parashara promises the marks of authority.",
    "the marks of authority",
  ),
  "pa-royal-40-15": E(
    "Parashara promises a senior post (a minister's office).",
    "a senior post",
  ),

  // Ch. 41.
  "pa-wealth-5-9": E(
    "The rulers of the 5th and 9th, the houses of merit and fortune, are the planets Parashara names as wealth-givers; their periods are the ones to watch for gains.",
    "gains in their periods",
  ),

  // Ch. 42, strain on finances (worded gently).
  "pa-penury-42-2": E(
    `The ruler of the self and the ruler of expenses trade places. Parashara lists this among the combinations that strain finances; ${PENURY_CARE}`,
    "strain on finances",
  ),
  "pa-penury-42-3": E(
    `The ruler of the self and the ruler of debts and disputes trade places. Parashara lists this among the combinations that strain finances; ${PENURY_CARE}`,
    "strain on finances",
  ),
  "pa-penury-42-4": E(
    `Ketu sits with the rising sign or the Moon while the ruler of the self is in the 8th. Parashara lists this among the combinations that strain finances; ${PENURY_CARE}`,
    "strain on finances",
  ),
  "pa-penury-42-5": E(
    `The ruler of the self sits with a malefic in a difficult house while the ruler of wealth is weak. Parashara says even one born to wealth may lose it; ${PENURY_CARE}`,
    "strain on finances",
  ),
  "pa-penury-42-6": E(
    `The ruler of the self keeps company with a ruler of a difficult house, or with Saturn, without a benefic's help. Parashara lists this among the combinations that strain finances; ${PENURY_CARE}`,
    "strain on finances",
  ),
  "pa-penury-42-16": E(
    "Mars and Saturn sit together in the house of wealth. Parashara warns that wealth can be lost, then names reliefs that this reading does not check yet.",
    "a risk to savings",
  ),

  // Ch. 70, the father.
  "pa-father-70-17": E(
    "Parashara reads a dutiful, respectful bond with the father.",
    "a dutiful bond with the father",
  ),
  "pa-father-70-18": E(
    "The ruler of work sits in the rising sign. Parashara reads that you may rise beyond your father's standing.",
    "rising beyond the father",
  ),

  // Ch. 79, renunciation.
  "pa-ascetic-79-6": ASCETIC(
    "The ruler of the Moon's sign, itself unaspected, looks at Saturn.",
  ),
  "pa-ascetic-79-7": ASCETIC(
    "A weak ruler of the Moon's sign is looked at by Saturn alone.",
  ),
  "pa-ascetic-79-8": ASCETIC(
    "The Moon, in Saturn's or Mars's portion, is looked at by Saturn.",
  ),
  "pa-ascetic-79-14": E(
    "Jupiter is in the 9th, the house of faith, and Saturn looks at Jupiter, the Moon and the rising sign. With a Raja yoga as well, Parashara reads the founder of a school of thought or a spiritual order.",
    "a founder of a school of thought",
  ),
  "pa-ascetic-79-15": E(
    "Saturn stands alone in the 9th, the house of faith. Parashara reads renunciation: with a Raja yoga, after rising high; without one, a wandering religious life. Read today as a strong pull toward detachment.",
    "a pull toward detachment",
  ),
};

const PREFIX: [string, Make][] = [
  [
    "pa-yoga-kt-",
    (f) =>
      E(
        `A ruler of one of the chart's pillars (an angle) is linked with a ruler of fortune (a trine). Parashara calls this the classic royal yoga and promises rise and recognition (34.11-12).${f.tone === "mixed" ? " One of the two also rules a harder house, which he says dilutes it." : ""}`,
        f.tone === "mixed"
          ? "rise and recognition, diluted"
          : "rise and recognition",
      ),
  ],
  [
    "pa-yoga-node-",
    (f) => {
      const node = suffix(f.id);
      return E(
        `${node} sits in an angle or trine with the ruler of the other kind of house. Rahu and Ketu give the results of the planets they join, so Parashara makes ${node} a yoga-giver here (34.16-17).`,
        `${node} turns helpful`,
      );
    },
  ],
  ["pa-yoga-mp-", (f) => MAHAPURUSHA[suffix(f.id)]],
  [
    "pa-yoga-amala-",
    () =>
      E(
        "Only benefics stand in the 10th from the rising sign or the Moon, the house of work and reputation. Parashara promises a lasting good name, honour from those in authority and a generous, helpful nature.",
        "a lasting good name",
      ),
  ],
  ["pa-nabhasa-sankhya-", (f) => SANKHYA[suffix(f.id)]],
  [
    "pa-neecha-",
    (f) => {
      const pl = suffix(f.id);
      return /not cancelled/.test(f.title)
        ? E(
            `${pl} is in its sign of fall, and none of the reliefs Mantreswara names applies, so the weakness stands.`,
            "the weakness stands",
          )
        : E(
            `${pl} is in its sign of fall, but a relief Mantreswara names applies, and he promises standing and means instead.`,
            "standing despite a fall",
          );
    },
  ],
  [
    "pa-ascetic-79-2-",
    () =>
      ASCETIC(
        "Four or more strong planets share one house; the strongest of them names the order.",
      ),
  ],
];

/** The plain meaning of a finding, or undefined when none is written for its kind. */
export function plainMeaning(f: ParashariFinding): PlainMeaning | undefined {
  const e = EXACT[f.id];
  if (e) return typeof e === "function" ? e(f) : e;
  for (const [p, make] of PREFIX) if (f.id.startsWith(p)) return make(f);
  return undefined;
}
