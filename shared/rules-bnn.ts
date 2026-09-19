// Extended Bhrigu Nandi Nadi rule set: directional (2nd/12th) readings, sign exchange,
// three-planet combinations, nakshatra-lord colouring, solitary planets, dignity, combustion
// and further pairings. Only types are imported from ./rules so there is no runtime cycle.

import type { Planet, Relation } from "./astro";
import { KARAKA } from "./astro";
import type { Rule, LifeArea } from "./rules";

const RAO = "R.G. Rao, Bhrigu Nandi Nadi";
const NAIK = "S. Naik, Prediction Secrets: Naadi Astrology";

const NEAR: Relation[] = ["conjunct", "prev", "next"];
const ALL: Relation[] = ["conjunct", "prev", "next", "trine", "opposite"];

const pair = (id: string, area: LifeArea, subject: Planet, object: Planet, text: string, weight: 1 | 2 | 3 = 2, relation: Relation[] = ALL, source = RAO): Rule => ({
  id,
  area,
  when: { subject, object, relation },
  text,
  weight,
  source,
});

const ahead = (id: string, area: LifeArea, subject: Planet, object: Planet, text: string, weight: 1 | 2 | 3 = 2): Rule => pair(id, area, subject, object, text, weight, ["next"]);
const behind = (id: string, area: LifeArea, subject: Planet, object: Planet, text: string, weight: 1 | 2 | 3 = 2): Rule => pair(id, area, subject, object, text, weight, ["prev"]);

const exchange = (id: string, area: LifeArea, a: Planet, b: Planet, text: string, weight: 1 | 2 | 3 = 3): Rule => ({
  id,
  area,
  when: { subject: a, object: b, exchange: true },
  text,
  weight,
  source: NAIK,
});

const trio = (id: string, area: LifeArea, subject: Planet, object: Planet, third: Planet, text: string, weight: 1 | 2 | 3 = 3): Rule => ({
  id,
  area,
  when: { subject, object, relation: NEAR, with: [{ planet: third, relation: NEAR }] },
  text,
  weight,
  source: RAO,
});

export const EXTRA_RULES: Rule[] = [
  // ───────────── Direction: what stands ahead of and behind the Jeeva ─────────────
  ahead("ju-next-sa", "career", "Jupiter", "Saturn", "Saturn ahead of Jupiter: the native walks toward the profession; career ambition dominates the middle years and effort is rewarded late.", 3),
  behind("ju-prev-sa", "career", "Jupiter", "Saturn", "Saturn behind Jupiter: Karma pushes the Jeeva. Work begins early, often from necessity; the native carries responsibilities from youth.", 3),
  ahead("ju-next-ve", "marriage", "Jupiter", "Venus", "Venus ahead of Jupiter: the native moves toward the spouse; marriage and partnership are a chosen goal and improve life after they arrive.", 3),
  behind("ju-prev-ve", "marriage", "Jupiter", "Venus", "Venus behind Jupiter: the spouse or partner pushes the native forward; support, comfort and finance come through the partnership.", 3),
  ahead("ju-next-me", "education", "Jupiter", "Mercury", "Mercury ahead of Jupiter: the native seeks learning and trade; education continues into adulthood and communication is a tool of progress.", 2),
  behind("ju-prev-me", "education", "Jupiter", "Mercury", "Mercury behind Jupiter: early education and a talkative, scholarly background shape the native; younger relatives or students lend support.", 2),
  ahead("ju-next-ma", "wealth", "Jupiter", "Mars", "Mars ahead of Jupiter: the native acquires land, buildings or machinery; initiative and courage are the road forward.", 2),
  behind("ju-prev-ma", "family", "Jupiter", "Mars", "Mars behind Jupiter: siblings or ancestral property push the native's path; a forceful early environment.", 2),
  ahead("ju-next-su", "self", "Jupiter", "Sun", "Sun ahead of Jupiter: the native aims at status and authority; recognition from government or institutions arrives with age.", 2),
  behind("ju-prev-su", "family", "Jupiter", "Sun", "Sun behind Jupiter: the father stands behind the native, shaping the early direction; paternal legacy is the starting capital.", 2),
  ahead("ju-next-mo", "self", "Jupiter", "Moon", "Moon ahead of Jupiter: the native moves toward the public, travel or a new home; emotional fulfilment is sought actively.", 2),
  behind("ju-prev-mo", "family", "Jupiter", "Moon", "Moon behind Jupiter: the mother's influence pushes the native; a nurturing but mobile childhood.", 2),
  ahead("ju-next-ra", "travel", "Jupiter", "Rahu", "Rahu ahead of Jupiter: the native heads toward foreign lands or unconventional pursuits; life takes an unexpected direction mid-way.", 3),
  behind("ju-prev-ra", "self", "Jupiter", "Rahu", "Rahu behind Jupiter: a hidden or foreign influence propels the native; ambition is inherited or imposed.", 2),
  ahead("ju-next-ke", "spirituality", "Jupiter", "Ketu", "Ketu ahead of Jupiter: the life path turns toward detachment, research or spirituality; worldly aims lose their pull later in life.", 3),
  behind("ju-prev-ke", "self", "Jupiter", "Ketu", "Ketu behind Jupiter: the native leaves something behind early: a place, a faith or a family pattern; the past is cut away.", 2),

  // Direction from the Karma karaka
  ahead("sa-next-ve", "career", "Saturn", "Venus", "Venus ahead of Saturn: the profession moves toward finance, luxury or the arts; income rises with the partner's arrival.", 2),
  behind("sa-prev-ve", "career", "Saturn", "Venus", "Venus behind Saturn: a partner or wealth supports the profession from behind; family business or a spouse's capital.", 2),
  ahead("sa-next-me", "career", "Saturn", "Mercury", "Mercury ahead of Saturn: the profession grows into consulting, writing or trade; documentation and communication increase with seniority.", 2),
  behind("sa-prev-me", "career", "Saturn", "Mercury", "Mercury behind Saturn: education and paperwork are the foundation of the career; the native is a trained professional.", 2),
  ahead("sa-next-ma", "career", "Saturn", "Mars", "Mars ahead of Saturn: the career moves into engineering, construction or management of machines and people.", 2),
  behind("sa-prev-ma", "career", "Saturn", "Mars", "Mars behind Saturn: technical training or a sibling's help launched the career; the profession runs on physical or mechanical energy.", 2),
  ahead("sa-next-ra", "career", "Saturn", "Rahu", "Rahu ahead of Saturn: the profession heads overseas or into new technology; a foreign posting or unconventional venture.", 2),
  ahead("sa-next-ke", "career", "Saturn", "Ketu", "Ketu ahead of Saturn: the career narrows into a specialist, technical or research niche; late-career withdrawal or sabbatical.", 2),

  // ───────────── Sign exchange (parivartana) ─────────────
  exchange("x-ju-sa", "career", "Jupiter", "Saturn", "Jupiter and Saturn exchange signs: the native and the profession are bound together; identity comes from work and work from identity. Steady rise."),
  exchange("x-ju-ve", "marriage", "Jupiter", "Venus", "Jupiter and Venus exchange signs: the native and spouse exchange fortunes; marriage is decisive for wealth and comfort."),
  exchange("x-ju-me", "education", "Jupiter", "Mercury", "Jupiter and Mercury exchange signs: learning and wisdom reinforce each other; teaching, writing or advisory success."),
  exchange("x-ju-ma", "wealth", "Jupiter", "Mars", "Jupiter and Mars exchange signs: property and courage feed the native's growth; engineering or land brings gains."),
  exchange("x-ju-su", "family", "Jupiter", "Sun", "Jupiter and the Sun exchange signs: father and native share fortunes; status through paternal line or government."),
  exchange("x-ju-mo", "self", "Jupiter", "Moon", "Jupiter and the Moon exchange signs: mind and wisdom in harmony; popular, generous and protected by the mother's side."),
  exchange("x-sa-ve", "career", "Saturn", "Venus", "Saturn and Venus exchange signs: profession and partnership intertwine; work in finance, luxury or with the spouse."),
  exchange("x-sa-me", "career", "Saturn", "Mercury", "Saturn and Mercury exchange signs: a career built on communication, commerce or documentation; steady intellectual work."),
  exchange("x-sa-ma", "career", "Saturn", "Mars", "Saturn and Mars exchange signs: engineering, land, defence or heavy industry; discipline meets force."),
  exchange("x-sa-su", "career", "Saturn", "Sun", "Saturn and the Sun exchange signs: government or institutional career; authority earned through service."),
  exchange("x-sa-mo", "career", "Saturn", "Moon", "Saturn and the Moon exchange signs: profession with the public, liquids or hospitality; the mind is disciplined by work."),
  exchange("x-ve-me", "marriage", "Venus", "Mercury", "Venus and Mercury exchange signs: an eloquent, educated spouse; romance through communication or shared studies."),
  exchange("x-ve-ma", "marriage", "Venus", "Mars", "Venus and Mars exchange signs: strong mutual attraction; love marriage or a spouse with a technical, athletic nature."),
  exchange("x-ve-mo", "marriage", "Venus", "Moon", "Venus and the Moon exchange signs: an emotional, caring spouse; the mother and the spouse are alike or close."),
  exchange("x-ma-me", "education", "Mars", "Mercury", "Mars and Mercury exchange signs: sharp technical intellect; mathematics, engineering, debate or surgery."),
  exchange("x-su-me", "education", "Sun", "Mercury", "Sun and Mercury exchange signs: father supports education; administrative or medical learning."),

  // ───────────── Three-planet combinations ─────────────
  trio("t-ju-sa-ve", "wealth", "Jupiter", "Saturn", "Venus", "Jupiter, Saturn and Venus together: wealth through profession and partnership; the spouse may work in finance or the native in luxury trades."),
  trio("t-ju-sa-me", "career", "Jupiter", "Saturn", "Mercury", "Jupiter, Saturn and Mercury together: a career in accounts, law, teaching or writing; scholarly, methodical livelihood."),
  trio("t-ju-sa-ma", "career", "Jupiter", "Saturn", "Mars", "Jupiter, Saturn and Mars together: engineering or construction is the life's work; property is built through personal labour."),
  trio("t-ju-sa-su", "career", "Jupiter", "Saturn", "Sun", "Jupiter, Saturn and the Sun together: a government or institutional post of authority; administrative career."),
  trio("t-ju-sa-ra", "travel", "Jupiter", "Saturn", "Rahu", "Jupiter, Saturn and Rahu together: profession and fortune in a foreign land; emigration for work."),
  trio("t-ju-sa-ke", "career", "Jupiter", "Saturn", "Ketu", "Jupiter, Saturn and Ketu together: technical or research work; a career with a break and a return, or a late spiritual turn."),
  trio("t-ju-ve-me", "career", "Jupiter", "Venus", "Mercury", "Jupiter, Venus and Mercury together: refined intellect; advisor, teacher, financier or artist; pleasant speech wins support."),
  trio("t-ju-mo-ve", "wealth", "Jupiter", "Moon", "Venus", "Jupiter, Moon and Venus together: comforts, popularity and prosperity; an artistic, generous nature; helpful women in life."),
  trio("t-ju-su-ma", "self", "Jupiter", "Sun", "Mars", "Jupiter, Sun and Mars together: commanding personality; leadership in engineering, defence or administration."),
  trio("t-sa-ma-me", "career", "Saturn", "Mars", "Mercury", "Saturn, Mars and Mercury together: technical and analytical profession; engineering, software, mathematics or mechanical trades."),
  trio("t-sa-me-ra", "career", "Saturn", "Mercury", "Rahu", "Saturn, Mercury and Rahu together: information technology, foreign languages or international trade; work for overseas clients."),
  trio("t-sa-me-ke", "career", "Saturn", "Mercury", "Ketu", "Saturn, Mercury and Ketu together: computing, coding, statistics or research; introverted, detail-driven livelihood."),
  trio("t-sa-ve-ra", "career", "Saturn", "Venus", "Rahu", "Saturn, Venus and Rahu together: finance, travel, luxury or entertainment with a foreign dimension; income from abroad."),
  trio("t-sa-ve-ma", "career", "Saturn", "Venus", "Mars", "Saturn, Venus and Mars together: vehicles, real estate, machinery or design; profit through property and technical craft."),
  trio("t-sa-su-ma", "career", "Saturn", "Sun", "Mars", "Saturn, Sun and Mars together: police, defence, engineering in government or heavy administration; command over labour."),
  trio("t-sa-ma-ke", "health", "Saturn", "Mars", "Ketu", "Saturn, Mars and Ketu together: surgery, accidents or chronic injury; also indicates a surgeon, soldier or mechanic."),
  trio("t-sa-ma-ra", "career", "Saturn", "Mars", "Rahu", "Saturn, Mars and Rahu together: heavy machinery, mining, chemicals or hazardous technical work, often abroad."),
  trio("t-ve-ma-ra", "marriage", "Venus", "Mars", "Rahu", "Venus, Mars and Rahu together: love marriage across community or nationality; intense, unconventional relationship."),
  trio("t-ve-sa-ke", "marriage", "Venus", "Saturn", "Ketu", "Venus, Saturn and Ketu together: marriage is delayed, austere or marked by detachment; the spouse may be spiritually inclined."),
  trio("t-ve-me-ra", "marriage", "Venus", "Mercury", "Rahu", "Venus, Mercury and Rahu together: a spouse met through work, study or online; foreign or multilingual partner."),
  trio("t-ve-mo-ra", "travel", "Venus", "Moon", "Rahu", "Venus, Moon and Rahu together: travel for pleasure, media or fashion; the mother or spouse has foreign connections."),
  trio("t-su-me-ve", "family", "Sun", "Mercury", "Venus", "Sun, Mercury and Venus together: the father is educated and prosperous, in finance, arts or administration; eloquent family."),
  trio("t-mo-me-ve", "self", "Moon", "Mercury", "Venus", "Moon, Mercury and Venus together: charming, artistic, socially skilled; success in media, design or hospitality."),
  trio("t-ma-ke-ra", "health", "Mars", "Ketu", "Rahu", "Mars with the nodes: sudden injuries, burns or surgery; also aptitude for explosives, electronics or emergency work.", 2),

  // ───────────── Solitary planets ─────────────
  { id: "alone-ju", area: "self", when: { subject: "Jupiter", alone: true }, text: "Jupiter stands alone: a self-made native who relies on inner judgement; independent path with few early helpers.", weight: 2, source: NAIK },
  { id: "alone-sa", area: "career", when: { subject: "Saturn", alone: true }, text: "Saturn stands alone: independent livelihood, self-employment or a solitary professional role; work is done one's own way.", weight: 2, source: NAIK },
  { id: "alone-ve", area: "marriage", when: { subject: "Venus", alone: true }, text: "Venus stands alone: the spouse comes from outside the family's circle; partnership is the native's own choice and responsibility.", weight: 2, source: NAIK },
  { id: "alone-me", area: "education", when: { subject: "Mercury", alone: true }, text: "Mercury stands alone: self-taught intellect; learning pursued independently of formal support.", weight: 1, source: NAIK },

  // ───────────── Dignity of the remaining planets ─────────────
  { id: "su-exalt", area: "family", when: { subject: "Sun", subjectDignity: ["Exalted", "Own sign"] }, text: "Sun dignified: a respected father and a native with strong self-esteem and vitality.", weight: 2 },
  { id: "su-debil", area: "family", when: { subject: "Sun", subjectDignity: ["Debilitated"] }, text: "Sun debilitated: the father's position is uncertain or strained; the native must build confidence independently.", weight: 2 },
  { id: "mo-exalt", area: "self", when: { subject: "Moon", subjectDignity: ["Exalted", "Own sign"] }, text: "Moon dignified: a steady, receptive mind and a supportive mother; comfort with the public.", weight: 2 },
  { id: "mo-debil", area: "self", when: { subject: "Moon", subjectDignity: ["Debilitated"] }, text: "Moon debilitated: intensity and secrecy in feeling; the mother's health or circumstances need attention.", weight: 2 },
  { id: "ma-exalt", area: "wealth", when: { subject: "Mars", subjectDignity: ["Exalted", "Own sign"] }, text: "Mars dignified: property and technical ability come easily; siblings are capable.", weight: 2 },
  { id: "ma-debil", area: "family", when: { subject: "Mars", subjectDignity: ["Debilitated"] }, text: "Mars debilitated: caution with land dealings and disputes; siblings need support.", weight: 2 },
  { id: "me-exalt", area: "education", when: { subject: "Mercury", subjectDignity: ["Exalted", "Own sign"] }, text: "Mercury dignified: excellent analysis and speech; success in examinations, trade and writing.", weight: 2 },
  { id: "me-debil", area: "education", when: { subject: "Mercury", subjectDignity: ["Debilitated"] }, text: "Mercury debilitated: intuitive rather than systematic learning; interruptions in formal study.", weight: 2 },

  // ───────────── Retrogression and combustion ─────────────
  { id: "ma-retro", area: "wealth", when: { subject: "Mars", subjectRetro: true }, text: "Retrograde Mars: property is lost and regained, or disputes return; energy is spent in bursts.", weight: 1, source: NAIK },
  { id: "me-combust", area: "education", when: { subject: "Mercury", subjectCombust: true }, text: "Mercury within the Sun's pada: learning and speech carry the father's or an institution's stamp; the native's own voice matures late, and results come in lesser degree.", weight: 1 },
  { id: "ve-combust", area: "marriage", when: { subject: "Venus", subjectCombust: true }, text: "Venus within the Sun's pada: marriage and comforts are arranged around the father, status or authority; romance is restrained and arrives in lesser degree.", weight: 1 },
  { id: "ma-combust", area: "health", when: { subject: "Mars", subjectCombust: true }, text: "Mars within the Sun's pada: courage is spent in the father's or an authority's cause; heat, haste and friction with superiors.", weight: 1 },
  { id: "sa-combust", area: "career", when: { subject: "Saturn", subjectCombust: true }, text: "Saturn combust: the profession is tied to the father or to government; hard work goes unrecognised early.", weight: 1 },

  // ───────────── Elements for Jeeva and Kalatra ─────────────
  { id: "ju-fire", area: "self", when: { subject: "Jupiter", subjectElement: ["Fire"] }, text: "Jupiter in a fiery sign: confident, ambitious, drawn to leadership and initiative.", weight: 1 },
  { id: "ju-earth", area: "self", when: { subject: "Jupiter", subjectElement: ["Earth"] }, text: "Jupiter in an earthy sign: practical, patient, attached to land, money and tangible results.", weight: 1 },
  { id: "ju-air", area: "self", when: { subject: "Jupiter", subjectElement: ["Air"] }, text: "Jupiter in an airy sign: communicative, intellectual, sociable; ideas and networks are the native's wealth.", weight: 1 },
  { id: "ju-water", area: "self", when: { subject: "Jupiter", subjectElement: ["Water"] }, text: "Jupiter in a watery sign: emotional depth, intuition and devotion; the native flows with circumstances.", weight: 1 },
  { id: "ve-fire", area: "marriage", when: { subject: "Venus", subjectElement: ["Fire"] }, text: "Venus in a fiery sign: an energetic, independent spouse; passion and occasional friction.", weight: 1 },
  { id: "ve-earth", area: "marriage", when: { subject: "Venus", subjectElement: ["Earth"] }, text: "Venus in an earthy sign: a practical, loyal spouse who values security and property.", weight: 1 },
  { id: "ve-air", area: "marriage", when: { subject: "Venus", subjectElement: ["Air"] }, text: "Venus in an airy sign: a sociable, articulate spouse; friendship at the heart of the marriage.", weight: 1 },
  { id: "ve-water", area: "marriage", when: { subject: "Venus", subjectElement: ["Water"] }, text: "Venus in a watery sign: a sensitive, nurturing spouse; deep emotional bond.", weight: 1 },

  // ───────────── Further pairs ─────────────
  pair("su-ma", "family", "Sun", "Mars", "Sun with Mars: a forceful father, possibly in engineering, defence or property; the native inherits drive and temper.", 2),
  pair("su-me", "family", "Sun", "Mercury", "Sun with Mercury: an educated, articulate father; the native is quick-witted and administratively able.", 2),
  pair("su-ve", "family", "Sun", "Venus", "Sun with Venus: a prosperous, refined father; wealth and comforts in the paternal home.", 2),
  pair("su-mo", "family", "Sun", "Moon", "Sun with the Moon: parents closely bound; a new-moon birth gives an inward, self-reliant nature.", 1),
  pair("mo-me", "self", "Moon", "Mercury", "Moon with Mercury: a quick, talkative, trading mind; the mother is educated or in business.", 2),
  pair("mo-ve", "self", "Moon", "Venus", "Moon with Venus: artistic, pleasure-loving temperament; a graceful mother and comfortable home.", 2),
  pair("mo-ma", "self", "Moon", "Mars", "Moon with Mars: a courageous, impatient mind; the mother is strong-willed; property through the mother's side.", 2),
  pair("ma-me", "education", "Mars", "Mercury", "Mars with Mercury: technical intelligence; engineering, mathematics, surgery or sharp argument.", 2),
  pair("ma-ve", "wealth", "Mars", "Venus", "Mars with Venus: gains through property, vehicles or design; strong desires drive acquisition.", 2),
  pair("ma-ke", "health", "Mars", "Ketu", "Mars with Ketu: injuries, surgery or accidents; technical skill with tools, electronics or medicine.", 2),
  pair("ma-ra", "self", "Mars", "Rahu", "Mars with Rahu: bold, risk-taking energy; machinery, land speculation or foreign technical work; guard against haste.", 2),
  pair("me-ke-health", "health", "Mercury", "Ketu", "Mercury with Ketu: nervous sensitivity, speech or hearing concerns; a mind that withdraws to research.", 1),
  pair("sa-ke-health", "health", "Saturn", "Ketu", "Saturn with Ketu: chronic or slow-moving ailments; joints, nerves and long convalescence.", 1),
  pair("ve-sa-health", "health", "Venus", "Saturn", "Venus with Saturn: reproductive, kidney or hormonal balance needs care; pleasures are rationed.", 1),
  pair("su-ra-health", "health", "Sun", "Rahu", "Sun with Rahu: eyes, heart and immunity under an eclipse-like shadow; irregular vitality.", 1),
  pair("mo-ra-health", "health", "Moon", "Rahu", "Moon with Rahu: anxiety, sleep disturbance or phobias; the mind magnifies.", 1),
  pair("mo-ke-health", "health", "Moon", "Ketu", "Moon with Ketu: emotional numbness or sudden withdrawal; benefit from meditation.", 1),
  pair("ve-ra-wealth", "wealth", "Venus", "Rahu", "Venus with Rahu: sudden luxuries, foreign money or speculative gains; spending matches earning.", 1),
  pair("me-ra-wealth", "wealth", "Mercury", "Rahu", "Mercury with Rahu: income through technology, foreign trade or clever dealing.", 1),
  pair("sa-ra-career2", "career", "Saturn", "Rahu", "Saturn with Rahu: service under foreign management; shift work, factories or large anonymous organisations.", 1, ALL, NAIK),
  pair("ke-ra-n-a", "spirituality", "Ketu", "Saturn", "Ketu supported by Saturn: disciplined practice; austerity yields insight over years.", 1, ["trine"], NAIK),
];

// Nakshatra-lord colouring for the three primary karakas.
const STAR_TEXT: Record<Planet, string> = {
  Sun: "authority, government and the father's line",
  Moon: "the public, mobility and the mother's line",
  Mars: "technical force, land and siblings",
  Mercury: "learning, trade and communication",
  Jupiter: "wisdom, teaching and children",
  Venus: "wealth, art and partnership",
  Saturn: "labour, duty and long service",
  Rahu: "foreign lands, technology and the unconventional",
  Ketu: "research, healing and detachment",
};
for (const [subject, area, what] of [
  ["Jupiter", "self", "The native's inner nature"],
  ["Saturn", "career", "The texture of the profession"],
  ["Venus", "marriage", "The spouse's character"],
] as const) {
  for (const lord of Object.keys(STAR_TEXT) as Planet[]) {
    EXTRA_RULES.push({
      id: `${subject.toLowerCase().slice(0, 2)}-star-${lord.toLowerCase().slice(0, 2)}`,
      area,
      when: { subject, subjectNakshatraLord: [lord] },
      text: `${subject} in a nakshatra of ${lord}: ${what} is shaded by ${STAR_TEXT[lord]}.`,
      weight: 1,
      source: NAIK,
    });
  }
}

// Sign-lord colouring for the nodes.
for (const lord of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as Planet[]) {
  EXTRA_RULES.push({
    id: `ra-lord-${lord.toLowerCase().slice(0, 2)}`,
    area: "travel",
    when: { subject: "Rahu", subjectSignLord: [lord] },
    text: `Rahu in a sign of ${lord}: foreign or unconventional matters express through ${KARAKA[lord].significations.slice(0, 3).join(", ")}.`,
    weight: 1,
    source: NAIK,
  });
  EXTRA_RULES.push({
    id: `ke-lord-${lord.toLowerCase().slice(0, 2)}`,
    area: "spirituality",
    when: { subject: "Ketu", subjectSignLord: [lord] },
    text: `Ketu in a sign of ${lord}: detachment and past-life skill touch ${KARAKA[lord].significations.slice(0, 3).join(", ")}.`,
    weight: 1,
    source: NAIK,
  });
}
