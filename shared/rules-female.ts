// Female-chart Bhrigu Nandi Nadi rules. Rao: in a female horoscope Venus represents the
// native and Mars the husband; the husband, his nature and profession are read from the
// planets with Mars and in the 2nd, 5th, 7th and 9th from him. Jupiter keeps his own
// karakatwa (children, wisdom, wealth, dharma) and, for many teachers, also speaks for the
// husband's dharma, so Jupiter with Venus or Mars is read as a blessing on the marriage.
// These rules replace the male-framed Jupiter-as-Jeeva and Venus-as-wife rules.

import type { Planet, Relation } from "./astro";
import { KARAKA } from "./astro";
import type { Rule, LifeArea } from "./rules";

const RAO = "R.G. Rao, Fundamentals of Rao's System of Nadi Astrology";
const NAIK = "S. Naik, Prediction Secrets: Naadi Astrology";
const SAKURKAR = "B. Sakurkar, Nadi principles for marriage (Saptarishis)";

const NEAR: Relation[] = ["conjunct", "trine", "prev", "next"];
const ALL: Relation[] = ["conjunct", "prev", "next", "trine", "opposite"];

const f = (r: Rule): Rule => ({ ...r, frame: "female" });

const pair = (id: string, area: LifeArea, subject: Planet, object: Planet, text: string, weight: 1 | 2 | 3 = 2, relation: Relation[] = ALL, source = RAO): Rule =>
  f({ id, area, when: { subject, object, relation }, text, weight, source });

const ahead = (id: string, area: LifeArea, subject: Planet, object: Planet, text: string, weight: 1 | 2 | 3 = 2): Rule => pair(id, area, subject, object, text, weight, ["next"]);
const behind = (id: string, area: LifeArea, subject: Planet, object: Planet, text: string, weight: 1 | 2 | 3 = 2): Rule => pair(id, area, subject, object, text, weight, ["prev"]);

const exchange = (id: string, area: LifeArea, a: Planet, b: Planet, text: string, weight: 1 | 2 | 3 = 3): Rule =>
  f({ id, area, when: { subject: a, object: b, exchange: true }, text, weight, source: NAIK });

const trio = (id: string, area: LifeArea, subject: Planet, object: Planet, third: Planet, text: string, weight: 1 | 2 | 3 = 3, source = RAO): Rule =>
  f({ id, area, when: { subject, object, relation: NEAR, with: [{ planet: third, relation: NEAR }] }, text, weight, source });

const quad = (id: string, area: LifeArea, subject: Planet, object: Planet, third: Planet, fourth: Planet, text: string, weight: 1 | 2 | 3 = 3): Rule =>
  f({ id, area, when: { subject, object, relation: NEAR, with: [{ planet: third, relation: NEAR }, { planet: fourth, relation: NEAR }] }, text, weight, source: RAO });

export const FEMALE_RULES: Rule[] = [
  // ───────────── Venus as Jeeva: the native herself ─────────────
  pair("f-ve-sa", "self", "Venus", "Saturn", "Jeeva (Venus) bound to Karma: a working woman whose life is organised around duty and profession; maturity early, comforts earned slowly.", 3),
  pair("f-ve-ju", "self", "Venus", "Jupiter", "Jeeva (Venus) with Jupiter: a fortunate, principled native; wisdom, children and a blessed marriage shape the life path.", 3),
  pair("f-ve-me", "self", "Venus", "Mercury", "Jeeva (Venus) with Mercury: articulate, sociable and quick; learning, communication, trade or the arts are her field.", 3),
  pair("f-ve-ma", "self", "Venus", "Mars", "Jeeva (Venus) with Mars, the husband: the marriage is central to her life; a strong bond from a previous birth, with occasional heat and temporary separations.", 3),
  pair("f-ve-su", "self", "Venus", "Sun", "Jeeva (Venus) with the Sun: dignity and closeness to authority; the father's standing marks her life; she may work with government or in a position of status.", 3),
  pair("f-ve-mo", "self", "Venus", "Moon", "Jeeva (Venus) with the Moon: a sensitive, popular and mobile nature; the mother and the public are prominent; strong feeling, romance before or around marriage.", 3),
  pair("f-ve-ra", "self", "Venus", "Rahu", "Jeeva (Venus) with Rahu: an unconventional life; foreign ties, ambition and modern professions; she crosses her family's tradition.", 3),
  pair("f-ve-ke", "self", "Venus", "Ketu", "Jeeva (Venus) with Ketu: introspective and detached; periods of withdrawal; interest in healing, research or the spiritual.", 3),
  f({ id: "f-ve-retro", area: "self", when: { subject: "Venus", subjectRetro: true }, text: "Retrograde Venus, the Jeeva: the native revisits her choices and also carries the qualities of the previous sign.", weight: 2, source: NAIK }),
  f({ id: "f-alone-ve", area: "self", when: { subject: "Venus", alone: true }, text: "Venus, the Jeeva, stands alone: a self-made woman who relies on her own judgement; an independent path with few early helpers.", weight: 1, source: NAIK }),
  f({ id: "f-ve-fire", area: "self", when: { subject: "Venus", subjectElement: ["Fire"] }, text: "Venus in a fiery sign: confident, ambitious, drawn to leadership and initiative.", weight: 1 }),
  f({ id: "f-ve-earth", area: "self", when: { subject: "Venus", subjectElement: ["Earth"] }, text: "Venus in an earthy sign: practical, patient, attached to land, money and tangible results.", weight: 1 }),
  f({ id: "f-ve-air", area: "self", when: { subject: "Venus", subjectElement: ["Air"] }, text: "Venus in an airy sign: communicative, intellectual, sociable; ideas and networks are her wealth.", weight: 1 }),
  f({ id: "f-ve-water", area: "self", when: { subject: "Venus", subjectElement: ["Water"] }, text: "Venus in a watery sign: emotional depth, intuition and devotion; she flows with circumstances.", weight: 1 }),

  f({ id: "f-ve-exalt", area: "self", when: { subject: "Venus", subjectDignity: ["Exalted", "Own sign", "Moolatrikona"] }, text: "Venus, the Jeeva, is dignified: grace, prosperity and natural charm; the native is well protected.", weight: 2 }),
  f({ id: "f-ve-debil", area: "self", when: { subject: "Venus", subjectDignity: ["Debilitated"] }, text: "Venus, the Jeeva, debilitated: self-worth must be earned; comforts come by effort and adjustment.", weight: 2 }),
  f({ id: "f-ma-exalt", area: "marriage", when: { subject: "Mars", subjectDignity: ["Exalted", "Own sign", "Moolatrikona"] }, text: "Mars, the husband's karaka, is dignified: a capable, established husband; property and standing through the marriage.", weight: 2 }),
  f({ id: "f-ma-debil", area: "marriage", when: { subject: "Mars", subjectDignity: ["Debilitated"] }, text: "Mars, the husband's karaka, debilitated: the husband's circumstances may be modest or his temper uneven; adjustments in marriage.", weight: 2 }),
  f({ id: "f-ju-exalt", area: "wealth", when: { subject: "Jupiter", subjectDignity: ["Exalted", "Own sign", "Moolatrikona"] }, text: "Jupiter dignified: fortune, children and sound counsel protect the native; the husband's side is respected.", weight: 2 }),
  f({ id: "f-ju-debil", area: "wealth", when: { subject: "Jupiter", subjectDignity: ["Debilitated"] }, text: "Jupiter debilitated: fortune and guidance must be built by effort; delays with children or learning.", weight: 2 }),

  // ───────────── Direction around the Jeeva (Venus) ─────────────
  ahead("f-ve-next-sa", "career", "Venus", "Saturn", "Saturn ahead of Venus: the native moves toward work; a career taken up by choice, gains through patience.", 2),
  behind("f-ve-prev-sa", "career", "Venus", "Saturn", "Saturn behind Venus: Karma pushes the Jeeva; work begins early, often from necessity, and becomes the ground she stands on.", 2),
  ahead("f-ve-next-ma", "marriage", "Venus", "Mars", "Mars ahead of Venus: the native moves toward the husband; marriage is a chosen step, the husband's affairs become her next chapter.", 2),
  behind("f-ve-prev-ma", "marriage", "Venus", "Mars", "Mars behind Venus: the husband stands behind her, supporting from the background; his circumstances shape what she inherits.", 2),
  ahead("f-ve-next-ju", "wealth", "Venus", "Jupiter", "Jupiter ahead of Venus: fortune and children lie ahead; growth comes after marriage or a move.", 2),
  behind("f-ve-prev-ju", "wealth", "Venus", "Jupiter", "Jupiter behind Venus: born into fortune and learning; the family's wisdom carries her forward.", 2),
  ahead("f-ve-next-me", "education", "Venus", "Mercury", "Mercury ahead of Venus: education and communication are the next step; study or trade after the early years.", 1),
  behind("f-ve-prev-me", "education", "Venus", "Mercury", "Mercury behind Venus: a learned background; education and speech are inherited strengths.", 1),
  ahead("f-ve-next-ra", "travel", "Venus", "Rahu", "Rahu ahead of Venus: a foreign land or an unconventional path lies ahead.", 1),
  behind("f-ve-prev-ra", "travel", "Venus", "Rahu", "Rahu behind Venus: a foreign or unusual background; migration in the family's past.", 1),

  // ───────────── Mars as Kalatra: the husband ─────────────
  pair("f-ma-su", "marriage", "Mars", "Sun", "Husband (Mars) with the Sun: a proud, short-tempered husband from a well-to-do family; ego and status enter the marriage.", 3),
  pair("f-ma-mo", "marriage", "Mars", "Moon", "Husband (Mars) with the Moon: a husband with a travelling job, emotional and changeable; misunderstandings if the Moon is weak.", 3),
  pair("f-ma-me", "marriage", "Mars", "Mercury", "Husband (Mars) with Mercury: an intellectual, commercial or technical husband; sharp words and never-ending arguments, yet property and wealth are gained together.", 3),
  pair("f-ma-ju", "marriage", "Mars", "Jupiter", "Husband (Mars) with Jupiter: early or timely marriage; a principled husband, an administrator, manager, teacher or guide.", 3),
  pair("f-ma-ve", "marriage", "Mars", "Venus", "Husband (Mars) with the Jeeva (Venus): union of husband and wife promised from a previous birth; strong attraction, with Mars's heat bringing temporary separations.", 3),
  pair("f-ma-sa", "marriage", "Mars", "Saturn", "Husband (Mars) with Saturn: delayed marriage, generally in Saturn's second round; a hard-working, older or duty-bound husband.", 3, ALL, SAKURKAR),
  pair("f-ma-ra", "marriage", "Mars", "Rahu", "Husband (Mars) with Rahu: a very short-tempered husband, possibly from another community or country; late marriage and obstacles before it.", 3),
  pair("f-ma-ke", "marriage", "Mars", "Ketu", "Husband (Mars) with Ketu: a husband in an ordinary job or one given to detachment; misunderstandings between the couple unless Jupiter joins.", 3),
  f({ id: "f-ma-retro", area: "marriage", when: { subject: "Mars", subjectRetro: true }, text: "Retrograde Mars, the husband's karaka: a relationship that returns or is reconsidered; the husband also carries qualities of the previous sign.", weight: 2, source: NAIK }),
  f({ id: "f-alone-ma", area: "marriage", when: { subject: "Mars", alone: true }, text: "Mars, the husband's karaka, stands alone: the husband comes from outside the family's circle; the marriage is her own choice and responsibility.", weight: 1, source: NAIK }),
  f({ id: "f-ma-combust", area: "marriage", when: { subject: "Mars", subjectCombust: true }, text: "Mars within the Sun's pada: the husband lives in the shadow of his father or an authority; marriage arranged around status.", weight: 2, source: NAIK }),
  f({ id: "f-ma-fire", area: "marriage", when: { subject: "Mars", subjectElement: ["Fire"] }, text: "Mars in a fiery sign: an energetic, commanding husband; passion and occasional friction.", weight: 1 }),
  f({ id: "f-ma-earth", area: "marriage", when: { subject: "Mars", subjectElement: ["Earth"] }, text: "Mars in an earthy sign: a practical, steady husband who values property and security.", weight: 1 }),
  f({ id: "f-ma-air", area: "marriage", when: { subject: "Mars", subjectElement: ["Air"] }, text: "Mars in an airy sign: a sociable, articulate husband; friendship at the heart of the marriage.", weight: 1 }),
  f({ id: "f-ma-water", area: "marriage", when: { subject: "Mars", subjectElement: ["Water"] }, text: "Mars in a watery sign: a sensitive, protective husband; a deep emotional bond.", weight: 1 }),

  // ───────────── Direction around the husband: 2nd shows his next step ─────────────
  ahead("f-ma-next-mo", "marriage", "Mars", "Moon", "Moon in the 2nd to Mars: the husband comes from a distant or foreign place, or his work keeps him travelling.", 2),
  ahead("f-ma-next-me", "marriage", "Mars", "Mercury", "Mercury in the 2nd to Mars: the husband's step is commerce, communication or a luxurious trade.", 2),
  ahead("f-ma-next-sa", "marriage", "Mars", "Saturn", "Saturn in the 2nd to Mars: the husband's path is heavy work and slow gains; marriage itself is delayed.", 2),
  ahead("f-ma-next-ju", "marriage", "Mars", "Jupiter", "Jupiter in the 2nd to Mars: the husband rises through learning or position; children follow soon after marriage.", 2),
  ahead("f-ma-next-ra", "marriage", "Mars", "Rahu", "Rahu in the 2nd to Mars: the husband's affairs turn foreign or unconventional after marriage.", 2),
  behind("f-ma-prev-sa", "marriage", "Mars", "Saturn", "Saturn in the 12th to Mars: the husband's background is toil and modest means; he has worked for what he has.", 1),
  behind("f-ma-prev-ju", "marriage", "Mars", "Jupiter", "Jupiter in the 12th to Mars: a husband from a learned or respected family.", 1),

  // ───────────── Exchanges ─────────────
  exchange("f-x-ve-ma", "marriage", "Venus", "Mars", "Venus and Mars exchange signs: the native and husband exchange fortunes; a love marriage or a bond that reverses both lives."),
  exchange("f-x-ve-ju", "self", "Venus", "Jupiter", "Venus and Jupiter exchange signs: fortune and the native are intertwined; marriage and children are decisive turns in her life."),
  exchange("f-x-ve-sa", "career", "Venus", "Saturn", "Venus and Saturn exchange signs: the native's life and her profession are one; a career in finance, luxury, arts or design."),
  exchange("f-x-ve-me", "self", "Venus", "Mercury", "Venus and Mercury exchange signs: eloquence and grace; a life in communication, trade or the arts."),
  exchange("f-x-ma-sa", "marriage", "Mars", "Saturn", "Mars and Saturn exchange signs: the husband is a man of hard work and technical trade; the marriage is slow to arrive but durable."),

  // ───────────── Three- and four-planet combinations (Rao) ─────────────
  trio("f-t-ma-sa-ve", "marriage", "Mars", "Saturn", "Venus", "Mars, Saturn and Venus together: the husband works in a financial institution, a bank, or a luxury trade."),
  trio("f-t-ma-ju-ve", "marriage", "Mars", "Jupiter", "Venus", "Mars, Jupiter and Venus together: the husband is a manager, administrator or guide with commercial leanings; another woman may have a hand in his affairs."),
  trio("f-t-ma-me-ve", "marriage", "Mars", "Mercury", "Venus", "Mars, Mercury and Venus together: an intellectual husband and constant quarrels, yet property and wealth are gained; he may follow a luxurious commercial profession."),
  trio("f-t-ma-su-ve", "marriage", "Mars", "Sun", "Venus", "Mars, Sun and Venus together: a husband of standing whose word carries at home; the wife defers to him."),
  trio("f-t-ma-ra-ve", "marriage", "Mars", "Rahu", "Venus", "Mars, Rahu and Venus together: the wife holds authority in the marriage and the husband must listen, else hostility; an unsettled married life.", 3, SAKURKAR),
  trio("f-t-ma-ke-ve", "marriage", "Mars", "Ketu", "Venus", "Mars, Ketu and Venus together: disputes between husband and wife, separation possible; Jupiter's aspect on the combination brings compromise.", 3, SAKURKAR),
  trio("f-t-ma-mo-ve", "marriage", "Mars", "Moon", "Venus", "Mars, Moon and Venus together: late marriage; a husband who listens to tales and travels for his career; misunderstandings at home."),
  trio("f-t-ma-mo-ke", "marriage", "Mars", "Moon", "Ketu", "Mars, Moon and Ketu together: the husband is often away from his wife and leads a disturbed life; an ordinary job."),
  trio("f-t-ma-sa-ra", "marriage", "Mars", "Saturn", "Rahu", "Mars, Saturn and Rahu together: denial or a very late marriage; Jupiter's aspect minimises it.", 3, SAKURKAR),
  trio("f-t-ma-sa-ke", "marriage", "Mars", "Saturn", "Ketu", "Mars, Saturn and Ketu together: denial or a very late marriage; with Jupiter the husband is a doctor or in a healing profession.", 3, SAKURKAR),
  trio("f-t-ma-me-ke", "marriage", "Mars", "Mercury", "Ketu", "Mars, Mercury and Ketu together: sharp words followed by cold detachment; the husband may keep an attachment outside the marriage; risk of separation.", 3, SAKURKAR),
  trio("f-t-ma-su-ra", "marriage", "Mars", "Sun", "Rahu", "Mars, Sun and Rahu together: a very short-tempered, egoistic husband."),
  trio("f-t-ma-me-ju", "marriage", "Mars", "Mercury", "Jupiter", "Mars, Mercury and Jupiter together: a learned, advisory husband; law, teaching, consultancy or administration."),
  trio("f-t-ma-sa-ju", "marriage", "Mars", "Saturn", "Jupiter", "Mars, Saturn and Jupiter together: a husband in a disciplined profession, engineering, medicine or law; marriage steady once made."),
  trio("f-t-ve-mo-me", "self", "Venus", "Moon", "Mercury", "Venus, Moon and Mercury together: a charming, restless heart; more than one attachment is possible.", 2, SAKURKAR),
  trio("f-t-ve-me-ke", "marriage", "Venus", "Mercury", "Ketu", "Venus, Mercury and Ketu together: an attachment outside the marriage on the native's side, or a friendship that turns cold.", 2, SAKURKAR),
  trio("f-t-ve-sa-ke", "marriage", "Venus", "Saturn", "Ketu", "Venus, Saturn and Ketu together: the native's own life is austere and delayed in marriage; a spiritual or detached turn.", 2),
  quad("f-q-ma-me-ju-ra", "marriage", "Mars", "Mercury", "Jupiter", "Rahu", "Mars, Mercury, Jupiter and Rahu together: a husband of erratic judgement; grand plans, poor follow-through."),
  quad("f-q-ma-mo-ra-sa", "marriage", "Mars", "Moon", "Rahu", "Saturn", "Mars, Moon, Rahu and Saturn together: a husband of doubtful honesty; caution in money matters between the couple."),
  quad("f-q-ma-sa-ju-ke", "marriage", "Mars", "Saturn", "Jupiter", "Ketu", "Mars, Saturn, Jupiter and Ketu together: the husband is a doctor or in a healing, research or technical-medical profession."),

  // ───────────── Jupiter's blessing on the marriage (many teachers read Jupiter for the husband) ─────────────
  pair("f-ju-ve-bless", "marriage", "Jupiter", "Venus", "Jupiter with the Jeeva (Venus): timely marriage and a husband of good character; Jupiter is also read for the husband's dharma in a female chart.", 2, ["conjunct", "trine"]),
  pair("f-ju-ra", "marriage", "Jupiter", "Rahu", "Jupiter with Rahu in a female chart: the husband's side has a foreign or unconventional strand; ambition in the marriage.", 1, ["conjunct"]),

  // ───────────── Children and career for the female native ─────────────
  pair("f-ju-mo-child", "family", "Jupiter", "Moon", "Jupiter with the Moon: children and motherhood are a source of joy; the native's mother is a strong support.", 2, ["conjunct", "trine"]),
  pair("f-sa-ve-career", "career", "Saturn", "Venus", "Saturn with the Jeeva (Venus): the native works; finance, arts, design, luxury goods, beauty or hospitality are her fields.", 2, ["conjunct", "trine"]),
  pair("f-sa-ma-career", "career", "Saturn", "Mars", "Saturn with Mars in a female chart: the husband's work is technical or laborious, and the couple's fortunes rise through property or engineering.", 2, ["conjunct", "trine"]),
  pair("f-ve-me-career", "career", "Venus", "Mercury", "Venus with Mercury: livelihood through communication, teaching, media, design or trade.", 1, ["conjunct", "trine"]),
];

// Sign-lord and nakshatra-lord colouring for the female Jeeva and the husband.
const LORDS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
for (const [subject, area, prefix] of [
  ["Venus", "self", "The native's nature takes the colour of"],
  ["Mars", "marriage", "The husband takes the colour of"],
] as const) {
  for (const lord of LORDS) {
    if (lord === subject) continue;
    FEMALE_RULES.push(
      f({
        id: `f-${subject.toLowerCase().slice(0, 2)}-lord-${lord.toLowerCase().slice(0, 2)}`,
        area,
        when: { subject, subjectSignLord: [lord] },
        text: `${subject} sits in a sign owned by ${lord}: ${prefix} ${lord}'s significations (${(lord === "Jupiter" ? ["wisdom", "children", "wealth"] : KARAKA[lord].significations.slice(0, 3)).join(", ")}).`,
        weight: 1,
        source: NAIK,
      }),
    );
  }
}

const STAR_TEXT: Record<Planet, string> = {
  Sun: "authority, government and the father's line",
  Moon: "the public, care and movement",
  Mars: "technical force, land and courage",
  Mercury: "learning, trade and speech",
  Jupiter: "wisdom, teaching and law",
  Venus: "comfort, art and finance",
  Saturn: "labour, service and endurance",
  Rahu: "foreign lands, technology and the unconventional",
  Ketu: "research, healing and detachment",
};
for (const [subject, area, what] of [
  ["Venus", "self", "The native's inner nature"],
  ["Mars", "marriage", "The husband's character"],
] as const) {
  for (const lord of Object.keys(STAR_TEXT) as Planet[]) {
    FEMALE_RULES.push(
      f({
        id: `f-${subject.toLowerCase().slice(0, 2)}-star-${lord.toLowerCase().slice(0, 2)}`,
        area,
        when: { subject, subjectNakshatraLord: [lord] },
        text: `${subject} in a nakshatra of ${lord}: ${what} is shaded by ${STAR_TEXT[lord]}.`,
        weight: 1,
        source: NAIK,
      }),
    );
  }
}

/** Male-framed rule ids (Jupiter as the native, Venus as the wife) that female charts replace. */
export const MALE_FRAME_IDS: RegExp[] = [
  /^ju-(sa|ve|me|ma|su|mo|ra|ke|retro)$/,
  /^ju-(next|prev)-/,
  /^ju-(fire|earth|air|water)$/,
  /^ju-lord-/,
  /^ju-star-/,
  /^alone-ju$/,
  /^ve-(sa|ma|me|ju|su|mo|ra|ke|retro|combust|exalt|debil)$/,
  /^ju-(exalt|debil)$/,
  /^ve-(fire|earth|air|water)$/,
  /^ve-lord-/,
  /^ve-star-/,
  /^alone-ve$/,
  /^x-ju-ve$/,
  /^x-ve-/,
  /^t-ve-/,
  /^t-ju-sa-ve$/,
  /^ra-ve-travel$/,
];
