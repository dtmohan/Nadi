/**
 * A separate, modern reading of the Moon's birth nakshatra, paraphrased from the user's copy of
 * Komilla Sutton, The Nakshatras: The Stars Beyond the Zodiac (Wessex, 2014), ch. 4.
 * Quarter qualifications follow her ch. 3; the 48-minute gandanta limit follows ch. 7.
 *
 * Pages refer to the supplied e-book footer, "Page N of 339", not the extraction's screen count.
 * Where a screen has no footer, the next footer supplies the page; ranges are used where the
 * footers skip. The publisher URL identifies the book; it is not an online transcription.
 * No book prose or case-study charts are reproduced. This module changes no other system's
 * verdicts, period scores, agreement, validation or rectification. It reads the Moon only.
 */
import { NAKSHATRAS, SIGNS, type Planet } from "./astro";
import { redactSensitive, withholdText } from "./life-stage";

export const BIRTH_STAR_BOOK_URL = "https://www.wessexastrologer.com/product/wanak001/";
export const BIRTH_STAR_BOOK = "Komilla Sutton, The Nakshatras: The Stars Beyond the Zodiac (Wessex, 2014)";
export interface BirthStarSource { label: string; url: string }
export const birthStarSource = (chapter: number, pages: number | string): BirthStarSource => ({
  label: `Sutton 2014, ch. ${chapter}, e-book ${String(pages).includes("–") ? "pp." : "p."} ${pages}`,
  url: BIRTH_STAR_BOOK_URL,
});

type Pada = 1 | 2 | 3 | 4;
type Guna = "rajas" | "tamas" | "sattva";
type Aim = "dharma" | "artha" | "kama" | "moksha";
interface Passage { page: number | string; text: string; plain: string }
const r = (page: number | string, text: string, plain = text): Passage => ({ page, text, plain });
interface StarFacts {
  deity: string;
  deityPlain?: string;
  symbol: string;
  symbolPlain?: string;
  animal: string;
  aim: Aim;
  aimPage: number;
  gana: "deva" | "manushya" | "rakshasa";
  gunas: [Guna, Guna, Guna];
  dosha: "vata" | "pitta" | "kapha";
  quality: "light" | "fierce" | "mixed" | "fixed" | "soft" | "sharp" | "mutable";
}
export interface BirthStarEntry {
  index: number;
  name: (typeof NAKSHATRAS)[number];
  suttonName: string;
  lord: Planet;
  pages: [number, number];
  facts: StarFacts;
  nature: Passage;
  moon: Passage;
  early: Passage;
  relations?: Passage;
  padas?: Partial<Record<Pada, Passage>>;
  /** A sign-specific Moon remark, applied only in the stated rashi. */
  signMoon?: { sign: number; reading: Passage }[];
  gandanta?: Passage;
  notes?: { text: string; cite: BirthStarSource }[];
}
function star(
  no: number, suttonName: string, lord: Planet, pages: [number, number], facts: StarFacts,
  nature: Passage, moon: Passage, early: Passage,
  extra: Partial<Pick<BirthStarEntry, "relations" | "padas" | "signMoon" | "gandanta" | "notes">> = {},
): BirthStarEntry {
  return { index: no - 1, name: NAKSHATRAS[no - 1], suttonName, lord, pages, facts, nature, moon, early, ...extra };
}
const R: Guna = "rajas", T: Guna = "tamas", S: Guna = "sattva";

/** All 27 star chapters, in zodiacal order. The longer text is still a paraphrase, never a quotation. */
export const BIRTH_STARS: BirthStarEntry[] = [
  star(1, "Ashwini", "Ketu", [37, 43], {
    deity: "Ashwini Kumaras, the twin physicians", symbol: "Horse's head", animal: "Male horse",
    aim: "dharma", aimPage: 39, gana: "deva", gunas: [R, R, R], dosha: "vata", quality: "light",
  }, r("37–39", "Sutton links the horse-tamer and the dawn with fresh energy, healing and learning to direct desire. Its ethical purpose can become self-righteousness."),
  r(40, "A quick, fiery mind needs expression and fresh challenges. Sutton contrasts a self-centred use of that energy with the wish to heal and serve.", "Sutton sees a lively mind that needs room for new ideas and challenges. Directing that energy towards helping others gives it a constructive outlet."),
  r(40, "The opening Ketu period can be unconventional, with a child feeling rejected or insufficiently appreciated.", "Her early-years theme is an unusual start and a need to have one's abilities noticed and encouraged."), {
    relations: r(40, "Sutton cautions that sensual impulses can draw this Moon into unsuitable relationships.", "In close relationships, her caution is to pause before acting on a strong attraction."),
    padas: { 2: r(43, "The Taurus pada exalts the Moon in navamsa; Sutton sees it steadying Ashwini's adventurous and passionate energy.", "In this quarter she finds a steadier base for the star's adventurous energy.") },
    notes: [{ text: "Dosha: the Ashwini fact box says kapha, but its dosha paragraph and the chapter 2 table say vata. Vata is used here; the fact-box disagreement remains open.", cite: birthStarSource(4, "37–40") }, { text: "The supporting dosha table is in chapter 2.", cite: birthStarSource(2, 21) }],
  }),
  star(2, "Bharani", "Venus", [44, 50], {
    deity: "Yama, god of death and dharma", deityPlain: "Yama, associated with duty and restraint",
    symbol: "Yoni, the female sexual organ", symbolPlain: "Yoni, an image of creative power", animal: "Elephant",
    aim: "artha", aimPage: 46, gana: "manushya", gunas: [R, R, T], dosha: "pitta", quality: "fierce",
  }, r("44–46", "Bharani's nourishing imagery carries ideas into practical form. Sutton reads its material involvement alongside the need for discipline and self-restraint."),
  r(47, "An intense Moon can initially pursue excess; learning to regulate wayward emotions is central to Sutton's reading.", "Her theme is strong feeling and creative energy that becomes more useful as it gains steadiness and limits."),
  r("47–48", "Venus as the first period is associated with comfort and an early taste for life's good things."), {
    relations: r(47, "Sutton warns of unwise relationship choices and of sexual excess exhausting one's inner resources.", "Her relationship caution is to keep attraction in proportion and leave room for other sources of fulfilment."),
    notes: [{ text: "Gana is unresolved within the book: the Bharani fact box says divine, while the chapter 2 gana table puts it among humans. Manushya follows that table provisionally, not a claimed correction of the author.", cite: birthStarSource(4, 44) }, { text: "The alternative human classification is in the chapter 2 gana table.", cite: birthStarSource(2, 24) }],
  }),
  star(3, "Krittika", "Sun", [51, 58], {
    deity: "Agni, the fire deity", symbol: "Razor", animal: "Goat or sheep",
    aim: "kama", aimPage: 53, gana: "rakshasa", gunas: [R, R, S], dosha: "kapha", quality: "mixed",
  }, r("51–53", "Sutton associates cutting and challenge with clearing away what obstructs a purpose; the same intensity needs care in how it is used."),
  r(55, "Her Moon reading joins the healer and the warrior: facing inner difficulties and taking up causes, while watching the impulse to destroy. She stresses purification and control of the mind.", "She sees courage to face difficult feelings and to help or stand up for a cause. The useful balance is determination without needless harshness."),
  r(55, "The opening Sun period brings questions of strengths, limitations, identity and purpose into the early years."), {
    padas: { 2: r("56–57", "This Capricorn pada contains 3° Taurus, the Moon's exact rashi exaltation degree; it is not a Taurus navamsa. Sutton associates the quarter with realism, mental control and security.", "This quarter contains the Moon's strongest point in Taurus. Sutton connects it with a more realistic outlook and a mind that feels supported.") },
  }),
  star(4, "Rohini", "Moon", [59, 67], {
    deity: "Brahma", symbol: "Chariot", animal: "Serpent",
    aim: "moksha", aimPage: 60, gana: "manushya", gunas: [R, T, R], dosha: "kapha", quality: "fixed",
  }, r("59–61", "Rohini's red imagery links affection, earthly involvement and creativity with a search for deeper fulfilment."),
  r(62, "A bright, committed mind can work for the long term, but dissatisfaction and repeated indulgence can disturb a favourable placement. Sutton places the Moon in its exaltation sign, beyond the exact exaltation degree.", "Sutton sees a bright mind with staying power. Enjoyment and creativity are strengths; appreciating what is already good helps keep restlessness in proportion."),
  r("62–63", "The first Moon period can be enjoyable, though restlessness starts early. Sutton suggests directing it into ideas, creative work and varied interests."), {
    relations: r(62, "Through the myth of the Moon's many wives, Sutton raises the possibility of multiple partners and dissatisfaction with steadiness.", "Her relationship theme is learning to value steadiness rather than always seeking something new."),
    padas: {
      2: r(65, "Taurus is both vargottama and pushkara here; Sutton especially emphasises the Moon's energy in this quarter.", "She finds this a particularly steadying and nourishing quarter for the Moon."),
      4: r(65, "Sutton singles out this Cancer pada as favourable for the Moon, which is in its own navamsa.", "She finds this quarter a comfortable setting for the Moon."),
    },
  }),
  star(5, "Mrigasira", "Mars", [67, 74], {
    deity: "Soma, the Moon deity", symbol: "Deer's head", animal: "Serpent",
    aim: "moksha", aimPage: 69, gana: "deva", gunas: [R, T, T], dosha: "pitta", quality: "soft",
  }, r("67–69", "The searching deer represents a sensitive, inquisitive mind; Sutton connects its outward search with a deeper wish for fulfilment."),
  r(71, "Restlessness, sensitivity and uncertainty about self-image can make the search for security self-defeating. Sutton advises exploration rather than demanding certainty.", "Her theme is a curious, sensitive mind. Exploring with confidence can be more helpful than waiting until everything feels certain."),
  r(71, "Mars as the first period gives the early years abundant energy."), {
    signMoon: [
      { sign: 1, reading: r(71, "In the Taurus half, Sutton describes the Moon as brighter, calmer and more settled.", "In this half of the star she sees a steadier base for curiosity.") },
      { sign: 2, reading: r(71, "In the Gemini half, competing directions can bring stress and indecision.", "In this half, choosing among many directions may take more patience.") },
    ],
    padas: { 4: r(73, "The Scorpio pada debilitates the Moon in navamsa; Sutton treats this as a particularly difficult quarter for it.", "She sees this quarter as emotionally demanding, with steadiness needing extra attention.") },
  }),
  star(6, "Ardra", "Rahu", [75, 83], {
    deity: "Rudra, a form of Shiva", symbol: "Head, teardrop or jewel", animal: "Dog",
    aim: "kama", aimPage: 77, gana: "manushya", gunas: [R, T, S], dosha: "vata", quality: "sharp",
  }, r("75–77", "Moisture and tears become Sutton's images for renewal: dissatisfaction can begin a search for knowledge rather than remain mere discontent."),
  r(78, "She reads the Moon here as tempestuous and often unclear, but capable of intellectual fertility when its emotional storms are understood and directed.", "Her image is of strong inner weather. Understanding it can make room for new ideas and growth rather than being swept along by it."),
  r("78–79", "The opening Rahu period can bring an unsettled childhood, large ambitions and disappointments whose emotional residue needs work later.", "Her early-years theme is change and uncertainty, with reliable support helping a child make sense of a less conventional start.")),
  star(7, "Punarvasu", "Jupiter", [83, 91], {
    deity: "Aditi, associated with infinity", symbol: "Bow", animal: "Cat",
    aim: "artha", aimPage: 85, gana: "deva", gunas: [R, S, R], dosha: "vata", quality: "mutable",
  }, r("83–85", "Return, light and finding another home are Sutton's central images. The search is for surroundings where knowledge, affection and spiritual aims can take practical form."),
  r(86, "An intuitive, changeable Moon may remain unsettled by too many possible directions. Sutton emphasises the mothering impulse and the wish for family, groups or belonging.", "She sees intuition and many possibilities, together with a strong wish to care for others and feel part of a family or community."),
  r(86, "Jupiter as the first period is read as a comparatively supportive beginning, qualified by Jupiter's condition elsewhere in the chart."), {
    padas: { 4: r(89, "Cancer is both pushkara and vargottama; Sutton describes extra strength for the Moon in this quarter.", "She finds this quarter especially supportive of a settled, receptive mind.") },
  }),
  star(8, "Pushya", "Saturn", [91, 98], {
    deity: "Brihaspati", symbol: "Flower, arrow or circle", animal: "Goat or sheep",
    aim: "dharma", aimPage: 93, gana: "deva", gunas: [R, S, T], dosha: "pitta", quality: "light",
  }, r("91–93", "Nourishing and helping others thrive sit beside responsibility and limits in Sutton's account of Pushya."),
  r(94, "Apart from its debilitated pada, Sutton reads the Moon as comfortable, intuitive and wise, seeking happiness and a secure home.", "Her Moon theme is making a comfortable, secure home while developing intuition and good judgement; the quarter can qualify that ease."),
  r(94, "The first Saturn period can feel restrictive: a child may feel older than their years or carry responsibility early.", "Her early-years theme is learning responsibility early, while still needing space to be a child."), {
    padas: { 4: r(96, "The Scorpio pada debilitates the Moon; Sutton associates it with fixed patterns of thought and living.", "In this quarter she cautions against becoming too set in familiar ways of thinking.") },
  }),
  star(9, "Ashlesha", "Mercury", [98, 104], {
    deity: "Nagas, the serpents", symbol: "Serpent", animal: "Cat",
    aim: "dharma", aimPage: 100, gana: "rakshasa", gunas: [R, S, S], dosha: "kapha", quality: "sharp",
  }, r("98–100", "Embracing life and shedding an old skin become images of transformation, with insight to be used responsibly."),
  r("101–102", "Sutton opposes a one-sided reading of jealousy, possessiveness and vindictiveness with Ashlesha's knowledge, inspiration and mysticism. Inner difficulty is part of her transformation theme, not its whole identity.", "She asks the reader not to reduce this star to its difficult side. Insight, depth and inspiration can help reshape the present even when the past cannot be changed."),
  r(102, "Mercury as the first period is generally read positively, with a separate qualification for a Moon close to the water–fire junction."), {
    gandanta: r("101–102", "For a gandanta Moon, Sutton describes a potentially traumatic beginning and flags the end of Mercury's period as especially demanding.", "At this close junction, her theme is a more unsettled beginning and a need for extra steadiness through early changes."),
  }),
  star(10, "Magha", "Ketu", [106, 113], {
    deity: "Pitris, the ancestors", symbol: "Palanquin", animal: "Rat",
    aim: "artha", aimPage: 108, gana: "rakshasa", gunas: [T, R, R], dosha: "kapha", quality: "fierce",
  }, r("106–108", "Greatness, ancestral inheritance and an inner sense of direction join worldly ambition in Sutton's account; inherited values are a resource rather than a rank."),
  r(109, "The Magha Moon can be visionary, yet a sense of rejection can inhibit honest expression. Sutton encourages trust in intuition and connection with one's ancestral legacy.", "She sees idealism and the ability to offer a fresh vision. Trusting one's judgement can help ideas find expression even when they are not immediately understood."),
  r("109–110", "The opening Ketu period can make a child feel different or unrecognised, caught between idealism and practical demands.", "Her early-years theme is finding recognition for an individual path, without measuring every child's development in the same way."), {
    padas: {
      2: r(111, "Taurus exalts the Moon in navamsa; Sutton sees a happier, more settled and secure mind.", "She finds this quarter particularly settling for the Moon."),
      4: r(112, "Cancer is the Moon's own navamsa here, a quarter Sutton describes as favourable.", "She finds this quarter a comfortable setting for the Moon."),
    },
  }),
  star(11, "Purva Phalguni", "Venus", [114, 120], {
    deity: "Bhaga, associated with good fortune", symbol: "Fireplace, bed or platform", animal: "Rat",
    aim: "kama", aimPage: 117, gana: "manushya", gunas: [T, R, T], dosha: "pitta", quality: "fierce",
  }, r("114–117", "The earlier Phalguni carries the fruit-of-good-actions imagery towards creativity, enjoyment and the warmth of family life."),
  r(117, "Sutton reads this Moon as happy creating in ordinary life, with its security centred on family."),
  r(117, "The opening Venus period is associated with an enjoyable childhood."), {
    padas: { 4: r(120, "Sutton qualifies the general ease here: Scorpio is a difficult, debilitated pada for the Moon.", "This quarter is her qualification to the star's general ease; emotional balance needs more care.") },
  }),
  star(12, "Uttara Phalguni", "Sun", [121, 127], {
    deity: "Aryaman, associated with honour and social bonds", symbol: "Four legs of a cot", animal: "Bull",
    aim: "moksha", aimPage: 122, gana: "manushya", gunas: [T, R, S], dosha: "vata", quality: "fixed",
  }, r("121–123", "The later Phalguni connects good actions with social responsibility, honour and the search for meaning within worldly life."),
  r("123–124", "Sutton sees the Moon adapting through social rules and analysis rather than leading. Emotional questioning needs realistic standards by which to live.", "Her theme is finding workable standards for everyday life, rather than letting constant analysis decide how one ought to feel."),
  r("123–124", "The first Sun period is read as useful for learning social rules and interaction early."), {
    signMoon: [{ sign: 5, reading: r("123–124", "In the Virgo part, self-criticism can crowd out intuition.", "Here she cautions against letting self-criticism silence intuition.") }],
  }),
  star(13, "Hasta", "Moon", [128, 136], {
    deity: "Savitar, the solar deity", symbol: "Palm of the hand", animal: "Buffalo",
    aim: "moksha", aimPage: 130, gana: "deva", gunas: [T, T, R], dosha: "vata", quality: "light",
  }, r("128–130", "The hand represents the power to accomplish things; Sutton balances personal effort and the wish for perfection with recognition of what is not under one's control."),
  r(131, "A bright, inspired but unsettled mind can become indecisive when it tries too hard to control itself.", "She sees a bright, inventive mind that benefits from focus and a calmer relationship with uncertainty."),
  r("131–132", "The opening Moon period can be enjoyable and intellectually lively, though many changes may make life feel unsettled."), {
    padas: { 2: r(134, "Taurus is an exalted, pushkara pada for the Moon; Sutton reads it as offering peace and a calmer mind.", "She finds this quarter a calmer and more nourishing setting for the Moon.") },
  }),
  star(14, "Chitra", "Mars", [136, 142], {
    deity: "Tvashtar, the celestial architect", symbol: "Pearl", animal: "Tiger",
    aim: "kama", aimPage: 137, gana: "rakshasa", gunas: [T, T, T], dosha: "pitta", quality: "soft",
  }, r("136–138", "The beautiful image is a reflection of potential. Sutton connects creative expression with the tension between outward appearances and inner purpose."),
  r(139, "A creative Moon may become too absorbed in outer pursuits. Sutton advises against squandering its resources through indecision and excessive analysis.", "Her theme is to keep creating rather than letting too much analysis interrupt good ideas."),
  r(139, "The first Mars period can be positive, but Sutton does not assume an easy childhood; the following Rahu period can introduce uncertainty.", "Her early-years account mixes initiative with changing circumstances, rather than promising a uniformly easy beginning."), {
    padas: { 4: r(142, "Sutton describes Scorpio as a difficult, debilitated pada for the Moon.", "She finds this quarter emotionally demanding and in need of steadiness.") },
  }),
  star(15, "Swati", "Rahu", [143, 150], {
    deity: "Vayu, associated with wind and life breath", symbol: "Coral", animal: "Buffalo",
    aim: "artha", aimPage: 144, gana: "deva", gunas: [T, T, S], dosha: "kapha", quality: "mutable",
  }, r("143–145", "Sutton's sword imagery concerns making a way through obstacles. Independence and practical ambition need care over how one's influence is used."),
  r(146, "The Swati Moon can build its own world and influence others, while forgetting that others also shape that world. Refinement can coexist with an unpolished edge.", "She sees an independent inner world and an ability to influence others, with a reminder to stay open to their influence too."),
  r("146–147", "Rahu as the first period can foster ambition without satisfaction; Sutton associates it with an uncertain, unconventional childhood.", "Her early-years theme is an individual, changeable path in which goals may keep moving.")),
  star(16, "Vishakha", "Jupiter", [151, 158], {
    deity: "Agni and Indra", symbol: "Potter's wheel or archway", animal: "Male tiger",
    aim: "dharma", aimPage: 153, gana: "rakshasa", gunas: [T, S, R], dosha: "kapha", quality: "mixed",
  }, r("151–153", "The threshold and entry imagery concern a change of direction: outward achievement begins to give way to an inward search and the wish to act rightly."),
  r(155, "The Moon seeks a higher life, but emotional churning accompanies change. Treating fulfilment as always elsewhere can produce dissatisfaction.", "Her theme is a strong wish for a more meaningful life. Finding something worthwhile in the present can make change less restless."),
  r(155, "The first Jupiter period is usually read as comfortable; Saturn follows, so the shift towards responsibility can feel abrupt."), {
    signMoon: [{ sign: 7, reading: r(155, "In Scorpio, debilitation complicates the Moon's transformation; Sutton warns against jealousy, possessiveness and resistance to change.", "In this part of the star she places more emphasis on accepting change and loosening fixed expectations.") }],
    padas: { 4: r(158, "This Cancer navamsa is the Moon's own, but its rashi span includes 3° Scorpio, the exact debilitation degree. One qualification does not erase the other.", "She finds support in the quarter alongside the more demanding Scorpio placement; neither makes the other disappear.") },
  }),
  star(17, "Anuradha", "Saturn", [160, 166], {
    deity: "Mitra, associated with light", symbol: "Lotus", animal: "Deer",
    aim: "dharma", aimPage: 162, gana: "deva", gunas: [T, S, T], dosha: "pitta", quality: "soft",
  }, r("160–162", "A small spark of insight and the lotus are Sutton's images for devotion, right action and finding a larger perspective."),
  r(163, "Although the Moon remains in Scorpio, Sutton reads movement beyond its exact debilitation point as opening greater vision and peace. Restraining immediate desires helps it move past inner blocks.", "She reads this as a chance to find a wider, calmer perspective, especially when immediate wants do not set every direction."),
  r(163, "Saturn as the first period suggests discipline and adult-like responsibilities during childhood.", "Her early-years theme is taking responsibility early while learning how to use structure well."), {
    relations: r(163, "Sutton notes that idealised hopes of love can leave this Moon disappointed.", "Her relationship caution is to leave room for real people rather than expecting a bond to match an ideal."),
    padas: { 4: r("165–166", "The Moon is both vargottama and debilitated in Scorpio. Sutton describes unusual intensity and warns against possessiveness or unethical uses of influence.", "The same-sign quarter intensifies rather than simply improves this placement. She asks for care with strong feelings and the wish to control outcomes.") },
  }),
  star(18, "Jyeshta", "Mercury", [168, 176], {
    deity: "Indra", symbol: "Earring", animal: "Male deer",
    aim: "artha", aimPage: 170, gana: "rakshasa", gunas: [T, S, S], dosha: "vata", quality: "sharp",
  }, r("168–170", "The elder-sister imagery carries esteem and responsibility, while Sutton places practical achievement beside a growing spiritual search."),
  r("171–172", "An unsettled, uncertain mind is learning to adapt to spiritual life. Sutton cautions against going beyond one's capacity, particularly in occult practice.", "Her theme is learning to manage uncertainty without pushing inner exploration faster than one can comfortably handle."),
  r(172, "The first Mercury period may conceal later angst, but the bond with the mother can be influential. Sutton also regards the close of Mercury's period as demanding.", "Her early-years account emphasises the importance of the mothering bond and support through changes."), {
    relations: r(171, "Sutton warns that an unsettled mind can lead into inappropriate sexual relationships.", "Her relationship caution is to avoid making close commitments while emotionally unsettled."),
    gandanta: r("171–172", "At the last degrees in gandanta, Sutton describes intense early transformation as Mercury's period gives way to Ketu soon after birth.", "At this close junction she emphasises a rapid change early in life, with reliable support especially valuable."),
  }),
  star(19, "Mula", "Ketu", [177, 185], {
    deity: "Nirriti, goddess of death and destruction", deityPlain: "Nirriti, associated with dismantling old forms",
    symbol: "Lion's tail or elephant's goad", animal: "Male dog",
    aim: "kama", aimPage: 179, gana: "rakshasa", gunas: [S, R, R], dosha: "vata", quality: "sharp",
  }, r("177–180", "The root is Sutton's image for both foundations and entanglement. Change needs to preserve what still nourishes life rather than remove every attachment at once."),
  r("180–181", "The Moon needs practical foundations for its spiritual search. Sutton describes a difficult mothering bond, from over-attachment to rejection, and trouble connecting emotionally.", "Her theme is building a dependable emotional and practical base before asking too much of an inward search."),
  r("180–181", "The opening Ketu period can be unconventional and transforming, with abilities insufficiently recognised in childhood.", "Her early-years theme is an unusual beginning and the importance of noticing talents that may not fit familiar expectations."), {
    padas: { 2: r("183–184", "Taurus exalts the Moon in navamsa, yet Sutton does not treat this as cancelling Mula's uncertainty. She locates its steadier ground in spiritual endeavour.", "She sees a steadier base in this quarter, while keeping the star's larger theme of finding one's footing.") },
    gandanta: r("180–181", "For the gandanta Moon, Sutton makes the struggle over identity and emotional roots particularly intense.", "At this close junction she gives extra emphasis to finding steady support and a workable sense of direction."),
  }),
  star(20, "Purva Ashadha", "Venus", [186, 193], {
    deity: "Apas, associated with water", symbol: "Elephant's tusk", animal: "Male monkey",
    aim: "moksha", aimPage: 188, gana: "manushya", gunas: [S, R, T], dosha: "pitta", quality: "fierce",
  }, r("186–188", "The earlier unconquered star represents talents that persist despite obstacles; Sutton's water imagery asks how they can be kept clear and used constructively."),
  r(190, "An unsettled Moon is readily coloured by its surroundings and company. Sutton advises care over the influences one admits.", "Her theme is a receptive mind: choosing company and influences thoughtfully helps it stay clear and steady."),
  r(190, "The opening Venus period is usually positive for creativity. Sutton stresses education and building mental steadiness early in life.")),
  star(21, "Uttara Ashadha", "Sun", [195, 203], {
    deity: "Vishwadevas, the universal deities", symbol: "Planks of a bed", animal: "Mongoose",
    aim: "moksha", aimPage: 197, gana: "manushya", gunas: [S, R, S], dosha: "kapha", quality: "fixed",
  }, r("195–198", "The later unconquered star carries the previous star's emerging talents towards self-discipline and a less ego-centred purpose."),
  r("198–199", "The Moon can find the star's austerity lonely and joyless unless it adapts; Sutton finds Sagittarius easier than Capricorn.", "Her theme is learning to live well with discipline, while remembering the need for warmth and enjoyment."),
  r("198–199", "The first Sun period can make the relationship with the father uneasy, while introducing questions of power and authority early.", "Her early-years theme is learning about authority, with room needed for a supportive relationship as well as rules."), {
    padas: {
      1: r("198–199", "Sutton says the Moon copes better in this first, vargottama quarter.", "She finds the first quarter more integrated and manageable for the Moon."),
      2: r("198–199", "Sutton says the Moon copes better in this second, vargottama quarter.", "She finds the second quarter more integrated and manageable for the Moon."),
      3: r("198–199", "Sutton describes the Moon as more unsettled in the last two quarters.", "She finds this quarter less settled and in need of patient adjustment."),
      4: r("198–199", "Sutton describes the Moon as more unsettled in the last two quarters.", "She finds this quarter less settled and in need of patient adjustment."),
    },
  }),
  star(22, "Shravana", "Moon", [207, 213], {
    deity: "Vishnu, the preserver", symbol: "Ear or three footsteps", animal: "Monkey",
    aim: "artha", aimPage: 210, gana: "deva", gunas: [S, T, R], dosha: "kapha", quality: "mutable",
  }, r("207–210", "Listening is the route to knowledge in Sutton's account. Quiet attention matters as much as accumulating information."),
  r(210, "The Moon in its own star emphasises emotion while meeting Saturn's limits. Sutton suggests detachment, study, philosophy and quiet practice as ways towards equilibrium.", "Her theme is balancing feeling with steadiness, helped by thoughtful study and time for a quieter mind."),
  r("210–211", "The first Moon period is read as comparatively easy and studious, with a lasting appetite for learning."), {
    padas: { 2: r(213, "The Taurus pada exalts the Moon; Sutton describes a peaceful mind able to receive Shravana's lesson.", "She finds this quarter especially calming and receptive for the Moon.") },
  }),
  star(23, "Dhanishta", "Mars", [216, 224], {
    deity: "The eight Vasus", symbol: "Mridanga drum and flute", animal: "Lion",
    aim: "dharma", aimPage: 217, gana: "rakshasa", gunas: [S, T, T], dosha: "pitta", quality: "mutable",
  }, r("216–218", "Sutton interprets wealth here as richness of mind, character and spirit, developed through useful work and less attachment to personal credit."),
  r(219, "A giving, responsible Moon must also respect its own needs rather than be overwhelmed by others' demands. Determination can become stubbornness.", "Her theme is generosity with boundaries: caring for others works better when one's own needs are not forgotten."),
  r(219, "The opening Mars period can be positive, but Rahu follows; Sutton associates the sequence with an unusual start and a sense of being an outsider.", "Her early-years theme is initiative alongside an individual path that may feel different from those around it."), {
    padas: { 4: r("221–222", "The Scorpio navamsa debilitates a Moon already uncomfortable in Aquarius; Sutton describes an unsettled search for peace.", "She finds this quarter more emotionally demanding, with room needed to find a calmer footing.") },
  }),
  star(24, "Shatabhishak", "Rahu", [224, 232], {
    deity: "Varuna, associated with the sea", symbol: "Hundred stars", animal: "Horse",
    aim: "dharma", aimPage: 226, gana: "rakshasa", gunas: [S, T, S], dosha: "vata", quality: "mutable",
  }, r("224–226", "Sutton draws a contrast between the star's difficult and healing sides; the task is to use insight for something beyond one's inner conflict."),
  r(228, "The Moon may become elusive, unable to confide and responsible for its own isolation. Sutton also associates the star with talents in herbs and healing.", "Her theme is a private, complex inner life. Building trust and sharing with others can ease isolation; she also associates the star with an interest in healing."),
  r(228, "The opening Rahu period is described as demanding, with fears of failing one's larger purpose.", "Her early-years theme is uncertainty about a large inner task, rather than a fixed prediction of what happens in childhood."), {
    notes: [{ text: "Aim: this chapter's fact box and aim section agree on dharma; the chapter 2 table instead gives moksha. The chapter reading is used, with the disagreement retained.", cite: birthStarSource(4, "224–226") }, { text: "The conflicting aim appears in the chapter 2 purushartha table.", cite: birthStarSource(2, 24) }],
  }),
  star(25, "Purva Bhadra", "Jupiter", [232, 239], {
    deity: "Aja Ekapada, the one-footed goat", symbol: "Sword", animal: "Lion",
    aim: "artha", aimPage: 234, gana: "manushya", gunas: [S, S, R], dosha: "vata", quality: "fierce",
  }, r("232–235", "The earlier blessed star searches for answers beyond material achievement. Sutton pairs its forceful aspiration with the need to understand both sides of an experience."),
  r(236, "A strong-minded but divided Moon does not yet see the whole picture. Spiritual adventure can outpace practical confidence.", "Her theme is a strong inward search, with patience needed while confidence and practical direction catch up."),
  r(236, "The first Jupiter period is usually positive; the following Saturn period introduces restriction and another side of the star's nature."), {
    padas: { 2: r(238, "Taurus is an exalted and pushkara pada for the Moon; Sutton describes greater contentment and steadiness on the spiritual path.", "She finds this quarter more settled and content with its chosen direction.") },
    notes: [{ text: "Aim: the chapter fact box and aim section give artha, but the chapter 2 table gives kama. Artha follows the chapter; the table variant is not silently corrected.", cite: birthStarSource(4, "232–234") }, { text: "The conflicting aim appears in the chapter 2 purushartha table.", cite: birthStarSource(2, 24) }],
  }),
  star(26, "Uttara Bhadra", "Saturn", [240, 249], {
    deity: "Ahir Budhnya, the deep-ocean serpent", symbol: "Twins", animal: "Cow",
    aim: "kama", aimPage: 244, gana: "manushya", gunas: [S, S, T], dosha: "pitta", quality: "fixed",
  }, r("240–244", "The later blessed star brings depth and patient development. Sutton reads its passion as service and inward growth, not merely personal gratification."),
  r(244, "The Moon can be bright and spiritual yet held back by its own corrosive patterns of thought. Sutton places its blessings on a subtler plane than ordinary success.", "Her theme is insight and imagination, with attention needed to habits of thought that make growth harder."),
  r("244–245", "The first Saturn period can be frustrating or miserable, with adult responsibilities taken on too early; maturity can put the same discipline to better use.", "Her early-years theme is a demanding sense of responsibility that can become a useful resource with maturity and support."), {
    padas: { 4: r(247, "The Scorpio pada debilitates the Moon; Sutton describes emotional storms and resistance to transformation.", "She finds this quarter emotionally intense, with flexibility helpful when familiar wants meet change.") },
    notes: [{ text: "Aim: the chapter fact box and aim section give kama, while the chapter 2 table gives artha. The chapter reading is used; its passion is interpreted spiritually in the text.", cite: birthStarSource(4, "240–244") }, { text: "The conflicting aim appears in the chapter 2 purushartha table.", cite: birthStarSource(2, 24) }],
  }),
  star(27, "Revati", "Mercury", [249, 257], {
    deity: "Pushan, a solar deity", symbol: "Fish", animal: "Elephant",
    aim: "moksha", aimPage: 252, gana: "deva", gunas: [S, S, S], dosha: "kapha", quality: "soft",
  }, r("249–252", "Sutton reads abundance as spiritual as well as material, with nourishment and completing a cycle preparing the ground for a new one."),
  r(252, "An intensely idealistic, spiritual Moon can neglect practical skills and feel insecure or disappointed when life fails to match its ideals.", "Her theme is a strong inward ideal. Keeping practical skills and realistic expectations alongside it helps give that ideal a workable home."),
  r(252, "Mercury as the first period is generally read positively, with a separate qualification for a Moon very close to the end of the star."), {
    gandanta: r(252, "Near the final gandanta junction, Sutton describes major changes from birth as Ketu's period begins soon afterwards, heightening insecurity.", "At this close junction she emphasises early change and the value of dependable support while finding one's footing."),
    notes: [{ text: "Aim: the Revati chapter fact box and aim section give moksha, while the chapter 2 table gives dharma. Moksha follows the chapter; the variant remains documented.", cite: birthStarSource(4, "249–252") }, { text: "The conflicting aim appears in the chapter 2 purushartha table.", cite: birthStarSource(2, 24) }],
  }),
];

const AIM_PLAIN: Record<Aim, string> = {
  dharma: "Duty and right action", artha: "Practical purpose and resources",
  kama: "Desire and fulfilment", moksha: "Inner freedom and realisation",
};
export interface BirthStarFact {
  key: string; label: string; technical?: string; text: string; plain: string;
  cite: BirthStarSource; practitionerOnly?: boolean;
}
export interface BirthStarItem {
  id: string; title: string; technical?: string; text: string; plain: string;
  cite: BirthStarSource; area?: "marriage";
}
export interface BirthStarReading {
  name: string; suttonName: string; lord: Planet; chapterPages: [number, number];
  moonLon: number; signIndex: number; starIndex: number; pada: Pada; navamsaSign: number;
  /** Degrees into the star; the navamsa's place within its sign, 1-9; distance to the nearest water-fire junction. */
  offsetDeg: number; navamsaOfSign: number; junctionDeg: number; withhold: boolean;
  flags: { vargottama: boolean; pushkara: boolean; ashtamamsha: boolean; gandanta: boolean };
  facts: BirthStarFact[]; items: BirthStarItem[];
  notes: { text: string; cite: BirthStarSource }[];
}

/** 48 arcminutes to either side of 0° Aries, Leo and Sagittarius (Sutton ch. 7). */
export const GANDANTA_DEG = 48 / 60;
export function birthStarPosition(moonLon: number) {
  if (!Number.isFinite(moonLon)) return null;
  const lon = ((moonLon % 360) + 360) % 360;
  // A tiny arithmetic tolerance at the exact 3°20′ boundaries, not an astrological orb.
  const quarter = Math.min(107, Math.floor(lon * 3 / 10 + 1e-10));
  const starIndex = Math.floor(quarter / 4);
  const pada = (quarter % 4 + 1) as Pada;
  const signIndex = Math.floor(lon / 30);
  const navamsaSign = quarter % 12;
  const partOfSign = quarter % 9;
  const pushkaraParts = [[6, 8], [2, 4], [5, 7], [0, 2]][signIndex % 4];
  const distance = Math.min(...[0, 120, 240].map((b) => Math.abs(((lon - b + 540) % 360) - 180)));
  return {
    moonLon: lon, starIndex, pada, signIndex, navamsaSign,
    offsetDeg: lon - starIndex * (40 / 3), navamsaOfSign: partOfSign + 1, junctionDeg: distance,
    flags: {
      vargottama: signIndex === navamsaSign,
      pushkara: pushkaraParts.includes(partOfSign),
      ashtamamsha: (navamsaSign - signIndex + 12) % 12 === 7,
      gandanta: distance <= GANDANTA_DEG + 1e-10,
    },
  };
}

/** Only the selected star is returned, with sensitive topics removed before either renderer sees it. */
export function birthStarReading(moonLon: number, options: { withhold: boolean } = { withhold: true }): BirthStarReading | null {
  const p = birthStarPosition(moonLon);
  if (!p) return null;
  const e = BIRTH_STARS[p.starIndex];
  const f = e.facts;
  const cite = birthStarSource(4, e.pages[0]);
  const fact = (key: string, label: string, text: string, plain = text, practitionerOnly = false, source = cite, technical?: string): BirthStarFact => ({
    key, label, technical, text: options.withhold && withholdText(text) ? plain : text,
    plain, cite: source, practitionerOnly,
  });
  const facts = [
    fact("ruler", "Star ruler", e.lord, e.lord, false, cite, "Nakshatra lord"),
    fact("deity", "Deity", f.deity, f.deityPlain ?? f.deity),
    fact("symbol", "Symbol", f.symbol, f.symbolPlain ?? f.symbol),
    fact("aim", "Life aim", f.aim, AIM_PLAIN[f.aim], false, birthStarSource(4, f.aimPage), "Purushartha"),
    fact("animal", "Animal emblem", f.animal, f.animal, true, cite, "Yoni animal"),
    fact("gana", "Gana", e.index === 1 ? `${f.gana} (provisional)` : f.gana, e.index === 1 ? `${f.gana} (provisional)` : f.gana, true, e.index === 1 ? birthStarSource(2, 24) : cite),
    fact("gunas", "Guna sequence", f.gunas.join(" · "), f.gunas.join(" · "), true),
    fact("dosha", "Dosha", f.dosha, f.dosha, true, e.index === 0 ? birthStarSource(4, "37–40") : cite),
    fact("quality", "Quality", f.quality, f.quality, true),
  ];
  const item = (id: string, title: string, passage: Passage, technical?: string, area?: "marriage"): BirthStarItem => ({
    id, title, technical, area, text: passage.text, plain: passage.plain, cite: birthStarSource(4, passage.page),
  });
  const items: BirthStarItem[] = [
    item("nature", "The star's imagery", e.nature),
    item("moon", "The Moon here", e.moon),
    item("early", "Early years", e.early, "First Vimshottari period"),
  ];
  if (e.relations) items.push(item("relations", "Close relationships", e.relations, undefined, "marriage"));
  for (const s of e.signMoon ?? []) if (s.sign === p.signIndex) items.push(item("sign", "This part of the star", s.reading, "Rashi qualification"));
  if (e.padas?.[p.pada]) items.push(item("quarter", "The Moon's quarter", e.padas[p.pada]!, `Pada ${p.pada}: Sutton's Moon remark`));
  const addFlag = (id: string, title: string, technical: string, text: string, plain: string, chapter: number, pages: number | string) =>
    items.push({ id, title, technical, text, plain, cite: birthStarSource(chapter, pages) });
  if (!e.padas?.[p.pada] && (p.navamsaSign === 1 || p.navamsaSign === 3 || p.navamsaSign === 7)) {
    const dignity = p.navamsaSign === 1 ? "exalted" : p.navamsaSign === 3 ? "in its own sign" : "debilitated";
    addFlag("pada-strength", "The Moon's smaller division", `Moon ${dignity} in navamsa`,
      `The ${SIGNS[p.navamsaSign]} navamsa places the Moon ${dignity}. This is a quarter-level qualification, not a replacement for its rashi position or a whole-chart verdict.`,
      p.navamsaSign === 7 ? "On this smaller division, Sutton treats the Moon as needing more steadiness. That alone does not decide the reading." : "On this smaller division, Sutton treats the Moon as having a more supportive footing. That alone does not decide the reading.", 3, 28);
  }
  if (p.flags.vargottama) addFlag("vargottama", "The same sign in both divisions", "Vargottama",
    `Rashi and navamsa are both ${SIGNS[p.signIndex]}. Sutton reads this as greater integration; it does not turn every demanding placement into an easy one.`,
    "The Moon occupies the same sign in the main and smaller divisions. Sutton reads this as a more integrated expression, not an automatic promise of ease.", 3, "28–30");
  if (p.flags.pushkara) addFlag("pushkara", "A nourishing quarter", "Pushkara navamsa",
    "This is one of Sutton's 24 pushkara quarters, which she reads as nourishing the planet's expression.",
    "Sutton includes this among the quarters that nourish a planet's expression. It is one supportive qualification, not a separate prediction.", 3, "30–31");
  if (p.flags.ashtamamsha) addFlag("ashtamamsha", "Inner and outer demands", "Ashtamamsha",
    "The navamsa sign is eighth from the rashi sign. Sutton interprets this as inner conflict between aims and circumstances, requiring sensitive handling and adjustment.",
    "Her reading of this smaller division emphasises the work of bringing inner aims and everyday circumstances into better alignment.", 3, "33–37");
  if (p.flags.gandanta) {
    addFlag("gandanta", "At a sensitive junction", "Nakshatra gandanta · within 48′",
      "The Moon lies within 48 arcminutes of a water–fire junction where both sign and star change. Sutton links it with a demanding transition between Mercury's ending period and Ketu's opening one.",
      "The Moon is very close to a junction where both the sign and the star change. Sutton reads this symbolically as a sensitive transition needing steadiness and support, not a forecast of an event.", 7, "267–270");
    if (e.gandanta) items.push(item("gandanta-moon", "The junction in this star", e.gandanta, "Sutton's gandanta Moon remark"));
  }
  const output: BirthStarReading = {
    ...p, name: e.name, suttonName: e.suttonName, lord: e.lord, chapterPages: [e.pages[0], e.pages[1]],
    withhold: options.withhold, facts, items, notes: e.notes ?? [],
  };
  return options.withhold ? redactSensitive(output) : output;
}

/** One display selection for the screen and the report, after the topic gate above. */
export function shownBirthStarItems(s: BirthStarReading, plain: boolean, relationshipsInSeason: boolean) {
  return s.items
    .filter((i) => !plain || !(i.area === "marriage" && !relationshipsInSeason))
    .map((i) => ({ ...i, early: i.area === "marriage" && !relationshipsInSeason }));
}

export const BIRTH_STAR_CAVEATS = [
  "A modern, single-author reading, paraphrased from Sutton's 27 star chapters. Mythic and contemplative descriptions are not psychological or medical assessments, and one Moon placement is not a complete chart reading.",
  "This layer reads the natal Moon's star and quarter only. It does not reinterpret the other planets or the ascendant, add Abhijit, or reproduce the book's example charts.",
  "Quarter qualifications follow Sutton's definitions of vargottama, pushkara and ashtamamsha. They remain separate observations; no points, net verdict or automatic cancellation are invented from them.",
  "The early-years lines paraphrase her comments on the first Vimshottari period. No period dates or fixed childhood age ranges are calculated here.",
  "The same selected reading serves the screen and report. Adult-topic withholding is applied before rendering in both modes; the general reading also uses gentler wording.",
  "This reading feeds no BNN, Parashari, Jaimini, ALP or KP verdict, no cross-system agreement, and no validation or rectification score.",
];
