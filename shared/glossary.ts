// Plain-language glossary for the terms the readings lean on. One map, used by the web client
// (hover tooltips) and the PDF (a short glossary page).

export interface GlossaryEntry {
  term: string;
  short: string;
  system: "bnn" | "jaimini" | "alp" | "kp" | "parashari" | "both";
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  "kp-sub-lord": {
    term: "Sub lord",
    short:
      "Each nakshatra is split into nine unequal subs in Vimshottari proportion, starting with its own lord. The lord of the sub a cusp falls in decides whether that house delivers.",
    system: "kp",
  },
  "kp-significator": {
    term: "Significator",
    short:
      "A planet signifies the houses its star lord occupies and owns, then the houses it occupies and owns itself. Events come in the joint periods of the significators of the houses concerned.",
    system: "kp",
  },
  "kp-badhaka": {
    term: "Badhaka",
    short:
      "The obstructing house: the 11th for a movable lagna, the 9th for a fixed lagna, the 7th for a dual lagna. Worse than a maraka (2nd, 7th) for health and longevity.",
    system: "kp",
  },
  "kp-rectification": {
    term: "Birth time rectification",
    short:
      "Fixing a doubtful birth time. In KP the lagna's sign, star and sub lords at the true time agree with the ruling planets of the moment of judgement, the lagna sub lord tells the birth star, and the period lords at known events must signify the houses of those events.",
    system: "kp",
  },
  "kp-ruling-planets": {
    term: "Ruling planets",
    short:
      "The lords of the rising sign and star, of the Moon's sign and star, and of the weekday at the moment of judgement, taken for the place where the astrologer is judging. Used to rectify birth time and to choose between competing significators.",
    system: "kp",
  },
  karaka: {
    term: "Karaka",
    short:
      "The planet that stands for a matter. In Nadi, Jupiter is the native, Saturn the work, Venus the wife or the woman herself, Mars the husband.",
    system: "both",
  },
  jeeva: {
    term: "Jeeva karaka",
    short:
      "Jupiter as the life force, the native at the subtle level. The whole Nadi reading is counted from it.",
    system: "bnn",
  },
  deha: {
    term: "Deha karaka",
    short:
      "The native as a person: Jupiter in a male chart, Venus in a female chart (Naik). Marriage and comforts are counted from it.",
    system: "bnn",
  },
  karma: {
    term: "Karma karaka",
    short: "Saturn as the profession and the duties of the life.",
    system: "bnn",
  },
  kalatra: {
    term: "Kalatra karaka",
    short: "Venus as the wife or partner in a male chart.",
    system: "bnn",
  },
  putra: {
    term: "Putra karaka",
    short:
      "Jupiter read for children; the 5th sign from it gives their count and sex.",
    system: "bnn",
  },
  vidya: {
    term: "Vidya karaka",
    short: "Mercury as learning, speech and trade.",
    system: "bnn",
  },
  combust: {
    term: "Combust",
    short:
      "Within the Sun's pada (about 3° 20'). The planet delivers its results in lesser degree; friends nearby ease it.",
    system: "bnn",
  },
  retrograde: {
    term: "Retrograde",
    short:
      "Appearing to move backwards. Nadi reads a retrograde planet from its own sign and, at half strength, from the sign before it.",
    system: "bnn",
  },
  "degree-order": {
    term: "Degree order",
    short:
      "Among planets in one sign, the one ahead by degree hands its matters to the one behind; the one behind takes the colour of the one ahead.",
    system: "bnn",
  },
  "set-aside": {
    term: "Set aside",
    short:
      "A dignity (exaltation, debilitation) cancelled by a Nadi rule, for example a debilitated planet whose sign lord is exalted.",
    system: "bnn",
  },
  trine: {
    term: "Trine",
    short:
      "The 5th and 9th signs from a planet. In Nadi they act almost as strongly as sharing a sign.",
    system: "both",
  },
  dusthana: {
    term: "Dusthana",
    short:
      "The 6th, 8th and 12th houses; matters placed there meet obstruction, illness or loss.",
    system: "both",
  },
  ak: {
    term: "Atmakaraka (AK)",
    short:
      "The planet with the highest degree in its sign: the king of the chart and the soul's agenda.",
    system: "jaimini",
  },
  amk: {
    term: "Amatyakaraka (AmK)",
    short:
      "Second by degree: the minister who carries out the soul's work; read for career.",
    system: "jaimini",
  },
  bk: {
    term: "Bhratrikaraka (BK)",
    short: "Third by degree: siblings, the teacher and courage.",
    system: "jaimini",
  },
  mk: {
    term: "Matrikaraka (MK)",
    short: "Fourth by degree: mother, home and property.",
    system: "jaimini",
  },
  pik: {
    term: "Pitrikaraka (PiK)",
    short: "Fifth by degree: father, children and learning.",
    system: "jaimini",
  },
  gk: {
    term: "Gnatikaraka (GK)",
    short: "Sixth by degree: rivals, illness and hard karma.",
    system: "jaimini",
  },
  dk: {
    term: "Darakaraka (DK)",
    short: "Lowest by degree: the spouse and partnerships.",
    system: "jaimini",
  },
  karakamsa: {
    term: "Karakamsa",
    short:
      "The navamsa (D9) sign of the Atmakaraka: the soul's own agenda and the seat from which Jaimini reads talents and inclination.",
    system: "jaimini",
  },
  swamsa: {
    term: "Swamsa",
    short: "Another name for the Karakamsa, the Atmakaraka's navamsa sign.",
    system: "jaimini",
  },
  "indu-lagna": {
    term: "Indu Lagna",
    short:
      "The wealth ascendant (Uttara Kalamrita IV.27): add the ray-numbers of the ninth lords from the lagna and from the Moon, divide by twelve, and count the remainder from the Moon's sign. Read for the scale of wealth.",
    system: "jaimini",
  },
  d9: {
    term: "Navamsa (D9)",
    short:
      "The ninth harmonic chart: each sign split into nine parts of 3° 20'. Jaimini reads the soul and marriage from it.",
    system: "jaimini",
  },
  al: {
    term: "Arudha lagna (AL)",
    short:
      "The image: how the world sees the native. Found by counting from the lagna to its lord and the same distance again.",
    system: "jaimini",
  },
  ul: {
    term: "Upapada (UL)",
    short:
      "The arudha of the 12th house: marriage, the spouse and the marriage's fortunes.",
    system: "jaimini",
  },
  pada: {
    term: "Arudha pada",
    short:
      "The reflection of a house in the world; A1 to A12, each showing how that house's matters appear in public.",
    system: "jaimini",
  },
  "rasi-drishti": {
    term: "Rasi drishti",
    short:
      "Sign aspect. A movable sign sees the three fixed signs except the one beside it; a fixed sign sees the movable signs except the one beside it; dual signs see one another.",
    system: "jaimini",
  },
  argala: {
    term: "Argala",
    short:
      "Intervention. Planets in the 2nd, 4th and 11th from a point support it; those in the 12th, 10th and 3rd obstruct that support.",
    system: "jaimini",
  },
  "chara-dasha": {
    term: "Chara dasha",
    short:
      "Jaimini's sign-based periods. Each sign rules for as many years as the count from it to its lord, read in K.N. Rao's manner.",
    system: "jaimini",
  },
  antardasha: {
    term: "Antardasha",
    short:
      "A sub-period inside a dasha: each sign of the running period gets an equal share.",
    system: "jaimini",
  },
  hl: {
    term: "Hora lagna (HL)",
    short:
      "A special ascendant advancing one sign every two and a half hours from sunrise; read for wealth and, with the lagna and Moon, longevity.",
    system: "jaimini",
  },
  gl: {
    term: "Ghatika lagna (GL)",
    short:
      "A special ascendant advancing one sign every 24 minutes from sunrise; read for power and position.",
    system: "jaimini",
  },
  ayurdaya: {
    term: "Ayurdaya",
    short:
      "Span of life, classified as short, middle or long from three pairs of points (lagna and HL, Moon and Saturn, the lagna lord and 8th lord).",
    system: "jaimini",
  },
  "kakshya-hrasa": {
    term: "Kakshya hrasa",
    short:
      "A step down: Saturn in the lagna or Rahu in the 8th lowers the longevity class by one.",
    system: "jaimini",
  },
  "kakshya-vriddhi": {
    term: "Kakshya vriddhi",
    short:
      "A step up: Jupiter or other benefics in the lagna raise the longevity class by one.",
    system: "jaimini",
  },
  mahadasha: {
    term: "Mahadasha",
    short: "A main period of the Chara dasha, counted in whole years.",
    system: "jaimini",
  },
  transit: {
    term: "Transit",
    short:
      "Where a planet stands in the sky now, as against the birth chart. Jupiter and Saturn transits time what the natal chart promises.",
    system: "both",
  },
  "double-transit": {
    term: "Double transit",
    short:
      "Jupiter and Saturn both touching the same natal point at once, by placement or aspect. The strongest timing signal.",
    system: "both",
  },
  nakshatra: {
    term: "Nakshatra",
    short:
      "One of the 27 lunar mansions of 13° 20'. A planet takes the flavour of its nakshatra's lord.",
    system: "both",
  },
  ayanamsa: {
    term: "Ayanamsa",
    short:
      "The offset between the tropical and sidereal zodiacs. Lahiri is the Indian standard.",
    system: "both",
  },
  "alp-lagna": {
    term: "ALP lagna",
    short:
      "The ascendant moved forward with age: ten years to a sign, one pada in about 1 year 1 month 10 days (Akshaya Lagna Paddhati). Natal planets are read as houses from it.",
    system: "alp",
  },
  "akshaya-rasi": {
    term: "Akshaya rasi",
    short:
      "The mind's counterpart to the ALP lagna (Book 2). The Moon moves from its birth nakshatra to the next with each Vimshottari dasa, a pada per quarter-dasa; the sign the current pada falls in is the Akshaya rasi, read with the dasa lord.",
    system: "alp",
  },
  "alp-pada": {
    term: "ALP pada",
    short:
      "The quarter of a nakshatra the ALP lagna currently occupies; nine padas make a sign. Its navamsa sign is said to be activated for the period.",
    system: "alp",
  },
  lagna: {
    term: "Lagna",
    short:
      "The ascendant: the sign rising in the east at birth. Nadi does not use it; Jaimini counts from it.",
    system: "both",
  },
  // Parashari
  bhava: {
    term: "Bhava (house)",
    short:
      "One of twelve life areas. Here each house is a whole sign counted from the rising sign: the rising sign is the 1st, the next sign the 2nd, and so on.",
    system: "parashari",
  },
  kendra: {
    term: "Kendra (angle)",
    short:
      "The 1st, 4th, 7th and 10th houses, the strongest positions. A planet here acts openly and early.",
    system: "parashari",
  },
  trikona: {
    term: "Trikona (trine)",
    short:
      "The 1st, 5th and 9th houses, the fortunate positions. Their lords are counted as helpers whatever their nature.",
    system: "parashari",
  },
  yogakaraka: {
    term: "Yogakaraka",
    short:
      "The planet that does most good for a given rising sign, usually because it rules both an angle and a trine. Parashara names one for most rising signs.",
    system: "parashari",
  },
  maraka: {
    term: "Maraka",
    short:
      "A planet whose periods can bring illness or loss: the lords of the 2nd and 7th houses, and planets joined with them.",
    system: "parashari",
  },
  benefic: {
    term: "Benefic",
    short:
      "A planet that tends to help: Jupiter, Venus, a bright Moon and Mercury in good company. The opposite is a malefic.",
    system: "parashari",
  },
  malefic: {
    term: "Malefic",
    short:
      "A planet that tends to test or take away: Saturn, Mars, the Sun, a dark Moon, Mercury in bad company, Rahu and Ketu.",
    system: "parashari",
  },
  shadbala: {
    term: "Shadbala",
    short:
      "Six measures of a planet's strength added into one score and compared with the minimum Parashara asks of it. A strong planet keeps its promises fully; a weak one only in part.",
    system: "parashari",
  },
  "bhava-bala": {
    term: "Bhava bala",
    short:
      "The strength of a house, built from the aspects on it, its lord's strength and the planets in it.",
    system: "parashari",
  },
  varga: {
    term: "Varga (divisional chart)",
    short:
      "A chart made by cutting each sign into equal pieces and mapping each piece to a sign. Each cut speaks to one area of life: the ninth-cut (navamsa) to marriage, the seventh to children, the tenth to career.",
    system: "parashari",
  },
  navamsa: {
    term: "Navamsa",
    short:
      "The ninth-cut chart, each sign split into nine pieces of 3°20'. Parashara reads the spouse from it, and a planet in the same sign here and in the birth chart is held to be steadier.",
    system: "parashari",
  },
  vargottama: {
    term: "Vargottama",
    short:
      "A planet in the same sign in the birth chart and the navamsa. Held to act more like a planet in its own sign.",
    system: "parashari",
  },
  vimsopaka: {
    term: "Vimsopaka",
    short:
      "A score out of 20 for how comfortably a planet sits across the divisional charts: full marks in its own sign, fewer in a friend's, fewest in an enemy's. Above 15 is wholly favourable, below 5 gives nothing.",
    system: "parashari",
  },
  hora: {
    term: "Hora",
    short:
      "Half a sign, 15 degrees. Each half belongs to the Sun or the Moon; some planets act more strongly in the Sun's half, others in the Moon's.",
    system: "parashari",
  },
  drekkana: {
    term: "Drekkana (decanate)",
    short:
      "A third of a sign, 10 degrees. Parashara reads brothers and sisters from it.",
    system: "parashari",
  },
  trimsamsa: {
    term: "Trimsamsa",
    short:
      "An unequal split of each sign into five parts ruled by Mars, Saturn, Jupiter, Mercury and Venus. Parashara reads troubles and character from it.",
    system: "parashari",
  },
  chalit: {
    term: "Bhava chalit",
    short:
      "Houses drawn from the exact rising degree rather than by whole signs, so a house can straddle two signs. Shown in two constructions (Sripati and Phaladeepika 8.34 equal houses) as a cross-check; every rule is still read on the whole-sign chart, and the chalit only adds an annotation where a planet would read a different house or stands in a sandhi.",
    system: "parashari",
  },
  sandhi: {
    term: "Sandhi",
    short:
      "The boundary between two houses in the chalit. A planet right on one belongs clearly to neither.",
    system: "parashari",
  },
  karmajiva: {
    term: "Karmajiva",
    short:
      "Varahamihira's reading of livelihood (Brihat Jataka 10): a planet in the tenth from the rising sign or the Moon names the person wealth comes through; otherwise the lord of the tenth is followed into its navamsa, whose lord names the calling.",
    system: "parashari",
  },
  "bj-ayurdaya": {
    term: "Ayurdaya",
    short:
      "Varahamihira's span of life (Brihat Jataka 7): Pindayu sums years each planet grants between its exaltation and debilitation degrees, Amsayu (Satya's method) counts the navamsas each planet has passed, with the lagna's share, multipliers and the losses for combustion, enemy's sign and the houses behind the horizon.",
    system: "parashari",
  },
  "bj-balarishta": {
    term: "Balarishta",
    short:
      "Varahamihira's combinations for death in infancy (Brihat Jataka 6): twelve verses on the Moon's place, her company and her aspects, with the stated terms (at once, a month, four or eight years) and the timing by her return; the commentator's counteracting yogas are provisional.",
    system: "parashari",
  },
  "bj-dasa": {
    term: "Dasa (Brihat Jataka 8)",
    short:
      "Varahamihira's own planetary periods, run on the years of chapter 7: the strongest of lagna, Sun and Moon first, then the planets in kendras, panapharas and apoklimas from it; antardasa shares 1, 1/2, 1/3, 1/7, 1/4; each dasa named Sampurna, Rikta, Arohini, Avarohini and so on by its lord's position. Distinct from Vimsottari.",
    system: "parashari",
  },
  "bj-cross": {
    term: "Cross-check with Brihat Jataka",
    short:
      "The elementary rules the Parashari tab applies (aspects by quarters, benefics and malefics, friendships, exaltation and moolatrikona, the varga lords, house classes, the sign risings and the Shadbala components) set against Varahamihira's statements of the same rules in Brihat Jataka chapters 1 and 2, with agreement, qualitative match or difference recorded. Nothing is computed from the table.",
    system: "parashari",
  },
  "body-marks": {
    term: "Marks on the body",
    short:
      "Brihat Jataka 5.24-26: the twelve houses are the limbs of the body, head first, taken by the rising drekkana. A malefic in a house gives a wound in that limb, a benefic or its aspect a mole or mark; the pattern changes at every ten degrees of the rising sign, so it can test a birth time.",
    system: "parashari",
  },
  sudarshana: {
    term: "Sudarshana chakra",
    short:
      "The twelve houses drawn three times, from the rising sign, the Moon and the Sun, one ring inside the other. Each house is judged by the planets in or aspecting its three signs, and the houses take turns ruling one year and one month each.",
    system: "parashari",
  },
  ashtakavarga: {
    term: "Ashtakavarga",
    short:
      "A points system in which the seven planets and the rising sign each award marks to signs. Signs with more marks are easier ground for planets passing through; fewer marks, harder.",
    system: "parashari",
  },
  rekha: {
    term: "Rekha (benefic mark)",
    short:
      "One point in the Ashtakavarga. A sign can hold at most 8 from one planet's chart and 56 in total.",
    system: "parashari",
  },
  vimshottari: {
    term: "Vimshottari dasa",
    short:
      "The 120-year cycle of planetary periods that gives each planet its turn to deliver what the birth chart promises. The period running now colours the present years.",
    system: "parashari",
  },
  pratyantar: {
    term: "Pratyantar",
    short:
      "The third level of the period system: a sub-period of a sub-period, usually weeks to months long.",
    system: "parashari",
  },
};

export const glossaryFor = (system: "bnn" | "jaimini" | "alp") =>
  Object.values(GLOSSARY).filter(
    (g) => g.system === system || g.system === "both",
  );
