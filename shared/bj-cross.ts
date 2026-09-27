/**
 * Cross-citations from Varahamihira's Brihat Jataka, chapters 1 (Rasiprabheda, the signs) and 2 (Grahabheda, the
 * planets), for the elementary rules the Parashari tab applies from Parashara. Nothing here changes a computation:
 * every row records where the two texts state the same rule, where Varahamihira gives only a qualitative form of a
 * rule Parashara quantifies, and where they differ. The differences are kept as Parashara has them, since the tab is
 * his; the row says so.
 *
 * Sources: Neely's translation on wisdomlib (verse pages, doc1501563+N for 1.N and doc1501583+N for 2.N, checked
 * 2026-09-27), the public-domain Iyer 1885 translation on archive.org (pp. 5-24) and the Sanskrit of the Adyar Library
 * edition (Aiyangar 1951, pp. 14-183) for the verse text. Iyer's and Aiyangar's notes are commentary and are only
 * paraphrased where a row says "the commentary".
 */
import type { ParashariSource } from "./parashari";
import { BPHS_URL } from "./parashari-data";

const BJ_BASE =
  "https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/";

/** wisdomlib verse page for Brihat Jataka 1.N or 2.N. */
export const BJ_VERSE_URL = (ch: 1 | 2, verse: number) =>
  `${BJ_BASE}doc${(ch === 1 ? 1501563 : 1501583) + verse}.html`;

export type CrossStanding = "agrees" | "partial" | "differs";

export interface CrossCitation {
  key: string;
  /** Rule as the tab applies it. */
  rule: string;
  /** Parashara verse the tab cites. */
  parashara: ParashariSource;
  /** Brihat Jataka verse(s). */
  bj: ParashariSource;
  standing: CrossStanding;
  /** What Varahamihira states, and the difference where there is one. */
  note: string;
  /** Iyer 1885 page(s). */
  iyer: string;
  /** Adyar 1951 page(s). */
  adyar: string;
}

const BJ = (ch: 1 | 2, verses: string): ParashariSource => ({
  label: `Brihat Jataka ${ch}.${verses}`,
  url: BJ_VERSE_URL(ch, parseInt(verses, 10)),
});
const P = (ch: number, verses: string): ParashariSource => ({
  label: `Parashara ${ch}.${verses}`,
  url: BPHS_URL(ch),
});

export const BJ_CROSS: CrossCitation[] = [
  {
    key: "aspects",
    rule: "Aspects by quarters: 3rd and 10th a quarter, 5th and 9th a half, 4th and 8th three quarters, 7th full; Saturn, Jupiter and Mars see their special houses in full",
    parashara: P(26, "2-5"),
    bj: BJ(2, "13"),
    standing: "agrees",
    note: "The same quarters and the same three specials. Varahamihira does not name the nodes either.",
    iyer: "p. 19",
    adyar: "pp. 150-155",
  },
  {
    key: "benefics",
    rule: "Natural malefics: Sun, Mars, Saturn, the waning Moon, and Mercury in their company; the rest benefic",
    parashara: P(3, "11"),
    bj: BJ(2, "5"),
    standing: "agrees",
    note: "The same list for the seven; Parashara adds Rahu and Ketu to the malefics, Varahamihira does not name them here.",
    iyer: "p. 16",
    adyar: "pp. 113-126",
  },
  {
    key: "naturalFriends",
    rule: "Natural friends, enemies and neutrals of the seven planets",
    parashara: P(3, "55"),
    bj: BJ(2, "16-17"),
    standing: "agrees",
    note: "The two tables are identical planet for planet. Both texts derive the table from the lords of the 2nd, 4th, 5th, 8th, 9th and 12th from the moolatrikona sign with the exaltation lord (Brihat Jataka 2.15 gives this as Satyacharya's rule); the Moon has no enemy in either.",
    iyer: "pp. 20-21",
    adyar: "pp. 159-161",
  },
  {
    key: "temporaryFriends",
    rule: "Temporary friends: planets in the 2nd, 3rd, 4th, 10th, 11th and 12th from a planet; the rest enemies for the time",
    parashara: P(3, "56"),
    bj: BJ(2, "18"),
    standing: "agrees",
    note: "The same six houses. Varahamihira adds that some also count planets in the aspected planet's exaltation sign as friends; the tab does not apply that clause.",
    iyer: "p. 22",
    adyar: "p. 162",
  },
  {
    key: "exaltation",
    rule: "Exaltation signs and deep degrees: Sun Aries 10, Moon Taurus 3, Mars Capricorn 28, Mercury Virgo 15, Jupiter Cancer 5, Venus Pisces 27, Saturn Libra 20; debilitation in the 7th at the same degrees",
    parashara: P(3, "49-50"),
    bj: BJ(1, "13"),
    standing: "agrees",
    note: "Identical signs and degrees in both texts.",
    iyer: "pp. 9-10",
    adyar: "pp. 54-62",
  },
  {
    key: "moolatrikona",
    rule: "Moolatrikona signs: Sun Leo, Moon Taurus, Mars Aries, Mercury Virgo, Jupiter Sagittarius, Venus Libra, Saturn Aquarius",
    parashara: P(3, "51-54"),
    bj: BJ(1, "14"),
    standing: "partial",
    note: "Varahamihira names the signs only; the degree ranges the tab uses for dignity and Shadbala are Parashara's.",
    iyer: "pp. 10-11",
    adyar: "pp. 63-69",
  },
  {
    key: "vargottama",
    rule: "Vargottama: the same sign in rasi and navamsa",
    parashara: { label: "not a term of Parashara ch. 6-7", url: BPHS_URL(6) },
    bj: BJ(1, "14"),
    standing: "agrees",
    note: "Varahamihira defines it as the first navamsa of a movable sign, the middle one of a fixed sign and the last one of a dual sign, which with the navamsa rule of 1.6 is the same sign in both charts; he calls such planets auspicious.",
    iyer: "pp. 10-11",
    adyar: "pp. 63-69",
  },
  {
    key: "hora",
    rule: "Hora lords: Sun then Moon in an odd sign, Moon then Sun in an even sign",
    parashara: P(6, "5-6"),
    bj: BJ(1, "11"),
    standing: "agrees",
    note: "The same rule. Brihat Jataka 1.12 records another school (the lords of the sign and of its 11th), which Varahamihira reports without adopting; the tab does not use it.",
    iyer: "pp. 8-9",
    adyar: "pp. 46-53",
  },
  {
    key: "drekkana",
    rule: "Drekkana lords: the lords of the sign, its 5th and its 9th",
    parashara: P(6, "7-8"),
    bj: BJ(1, "11"),
    standing: "agrees",
    note: "The same rule. Brihat Jataka 1.12 records the other school's lords of the sign, its 12th and its 11th; not used.",
    iyer: "pp. 8-9",
    adyar: "pp. 46-53",
  },
  {
    key: "navamsa",
    rule: "Navamsa counting: a movable sign from itself, a fixed sign from its 9th, a dual sign from its 5th",
    parashara: P(6, "12"),
    bj: BJ(1, "6"),
    standing: "agrees",
    note: "Varahamihira states it as the navamsas of Aries, Taurus, Gemini and Cancer beginning with Aries, Capricorn, Libra and Cancer, which is the same count.",
    iyer: "p. 5",
    adyar: "pp. 19-30",
  },
  {
    key: "dwadasamsa",
    rule: "Dwadasamsa lords counted from the sign itself",
    parashara: P(6, "15"),
    bj: BJ(1, "6"),
    standing: "agrees",
    note: "The same rule in both texts.",
    iyer: "p. 5",
    adyar: "pp. 19-30",
  },
  {
    key: "trimsamsa",
    rule: "Trimsamsa lords and spans: Mars 5, Saturn 5, Jupiter 8, Mercury 7, Venus 5 in odd signs, reversed in even signs",
    parashara: P(6, "27-28"),
    bj: BJ(1, "7"),
    standing: "agrees",
    note: "The same lords and spans. Neither verse assigns a sign to each part, so the sign mapping stays the commentators' convention and remains provisional.",
    iyer: "pp. 6-7",
    adyar: "pp. 31-35",
  },
  {
    key: "houses",
    rule: "House matters (body, family, brothers, relations, sons, enemies, spouse, death, virtue, avocation, gain, loss) and house classes: kendra 1, 4, 7, 10; panaphara 2, 5, 8, 11; apoklima 3, 6, 9, 12; upachaya 3, 6, 10, 11; trikona 5 and 9",
    parashara: P(11, "2-13"),
    bj: BJ(1, "15-19"),
    standing: "partial",
    note: "Varahamihira gives one matter a house and the class names; Parashara's list is longer. Brihat Jataka 1.15 notes that some deny the upachaya class. The kendras are strongest, then panapharas, then apoklimas (1.19).",
    iyer: "pp. 11-14",
    adyar: "pp. 70-91",
  },
  {
    key: "risingSigns",
    rule: "Rising of the signs: head-rising Gemini, Leo, Virgo, Libra, Scorpio, Aquarius; back-rising Aries, Taurus, Cancer, Capricorn; Pisces both",
    parashara: P(4, "6-24"),
    bj: BJ(1, "10"),
    standing: "differs",
    note: "Varahamihira counts Sagittarius among the back-rising signs; Parashara's description of Sagittarius (4.17) has it rise with its head, and the tab keeps Parashara's list. The other eleven signs agree. Varahamihira also calls the back-rising signs (with Gemini) night-strong and the rest day-strong, which matches Parashara's sign descriptions except for Pisces, which Parashara calls night-strong.",
    iyer: "pp. 7-8",
    adyar: "pp. 42-43",
  },
  {
    key: "sthanaBala",
    rule: "Positional strength (Sthana bala)",
    parashara: P(27, "1-6"),
    bj: BJ(2, "19"),
    standing: "partial",
    note: "Varahamihira lists the places that give it (exaltation, a friend's sign, own drekkana, navamsa and sign) without values; Parashara's virupas are used.",
    iyer: "pp. 22-23",
    adyar: "pp. 163-169",
  },
  {
    key: "digBala",
    rule: "Directional strength: Mercury and Jupiter in the 1st, Sun and Mars in the 10th, Saturn in the 7th, Moon and Venus in the 4th",
    parashara: P(27, "7"),
    bj: BJ(2, "19"),
    standing: "agrees",
    note: "The same four directions in both texts (also Parashara 3.35-38); the 60-virupa scale is Parashara's.",
    iyer: "pp. 22-23",
    adyar: "pp. 163-169",
  },
  {
    key: "chestaBala",
    rule: "Motional strength: the Sun and Moon in Capricorn to Gemini; the others by their motion",
    parashara: P(27, "18-25"),
    bj: BJ(2, "20"),
    standing: "partial",
    note: "The luminaries' rule is the same (27.18). For the five, Varahamihira names retrogression, conjunction with the Moon, brightness and the northern place in a planetary war as sources of strength, without values; Parashara's eight motions and kendra method give the numbers.",
    iyer: "p. 23",
    adyar: "pp. 170-175",
  },
  {
    key: "kalaBala",
    rule: "Temporal strength: Moon, Mars and Saturn at night, Mercury always, Sun, Jupiter and Venus by day; malefics in the dark fortnight, benefics in the bright; the lords of the year, month, day and hora",
    parashara: P(27, "8-13"),
    bj: BJ(2, "21"),
    standing: "agrees",
    note: "The same components (Nathonnatha, Paksha and the lords); Parashara adds Tribhaga and Ayana bala, which Varahamihira does not have.",
    iyer: "p. 23",
    adyar: "pp. 176-183",
  },
  {
    key: "naisargika",
    rule: "Natural strength in the order Saturn, Mars, Mercury, Jupiter, Venus, Moon, Sun, each stronger than the one before",
    parashara: P(27, "14"),
    bj: BJ(2, "21"),
    standing: "agrees",
    note: "The same order in both texts.",
    iyer: "p. 23",
    adyar: "pp. 176-183",
  },
  {
    key: "karakatvas",
    rule: "Kalapurusha: Sun soul, Moon mind, Mars strength, Mercury speech, Jupiter knowledge and happiness, Venus desire, Saturn sorrow; the Sun and Moon kings, Mars the commander, Mercury the prince, Jupiter and Venus ministers, Saturn the servant",
    parashara: P(3, "12-15"),
    bj: BJ(2, "1"),
    standing: "agrees",
    note: "The same assignments in both texts. Shown for reference; the tab does not compute from them.",
    iyer: "p. 15",
    adyar: "pp. 96-103",
  },
  {
    key: "dhatus",
    rule: "Body constituents: Sun bones, Moon blood, Mars marrow, Mercury skin, Jupiter fat, Venus semen, Saturn sinews",
    parashara: P(3, "31"),
    bj: BJ(2, "11"),
    standing: "agrees",
    note: "The same seven assignments (Iyer renders Jupiter's medas as flesh, Parashara's translator as fat). Shown for reference; the tab does not compute from them.",
    iyer: "p. 17",
    adyar: "pp. 141-142",
  },
];

export const BJ_CROSS_BY_KEY: Record<string, CrossCitation> =
  Object.fromEntries(BJ_CROSS.map((c) => [c.key, c]));

export const BJ_CROSS_CAVEATS = [
  "Cross-citations only: the rules are computed as Parashara states them, and a Brihat Jataka row records agreement, a qualitative match or a difference. Where the two texts differ the tab keeps Parashara and says so.",
  "Verse text from Neely's translation (wisdomlib) and Iyer's 1885 translation; the Sanskrit checked in the Adyar Library edition (Aiyangar 1951). Notes by Iyer or Aiyangar are commentary and are not used as rules.",
];
