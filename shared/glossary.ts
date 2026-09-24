// Plain-language glossary for the terms the readings lean on. One map, used by the web client
// (hover tooltips) and the PDF (a short glossary page).

export interface GlossaryEntry {
  term: string;
  short: string;
  system: "bnn" | "jaimini" | "alp" | "kp" | "both";
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  "kp-sub-lord": { term: "Sub lord", short: "Each nakshatra is split into nine unequal subs in Vimshottari proportion, starting with its own lord. The lord of the sub a cusp falls in decides whether that house delivers.", system: "kp" },
  "kp-significator": { term: "Significator", short: "A planet signifies the houses its star lord occupies and owns, then the houses it occupies and owns itself. Events come in the joint periods of the significators of the houses concerned.", system: "kp" },
  "kp-badhaka": { term: "Badhaka", short: "The obstructing house: the 11th for a movable lagna, the 9th for a fixed lagna, the 7th for a dual lagna. Worse than a maraka (2nd, 7th) for health and longevity.", system: "kp" },
  "kp-rectification": { term: "Birth time rectification", short: "Fixing a doubtful birth time. In KP the lagna's sign, star and sub lords at the true time agree with the ruling planets of the moment of judgement, and the period lords at known events must signify the houses of those events.", system: "kp" },
  "kp-ruling-planets": { term: "Ruling planets", short: "The lords of the rising sign and star, of the Moon's sign and star, and of the weekday at the moment of judgement, taken for the place where the astrologer is judging. Used to rectify birth time and to choose between competing significators.", system: "kp" },
  karaka: { term: "Karaka", short: "The planet that stands for a matter. In Nadi, Jupiter is the native, Saturn the work, Venus the wife or the woman herself, Mars the husband.", system: "both" },
  jeeva: { term: "Jeeva karaka", short: "Jupiter as the life force, the native at the subtle level. The whole Nadi reading is counted from it.", system: "bnn" },
  deha: { term: "Deha karaka", short: "The native as a person: Jupiter in a male chart, Venus in a female chart (Naik). Marriage and comforts are counted from it.", system: "bnn" },
  karma: { term: "Karma karaka", short: "Saturn as the profession and the duties of the life.", system: "bnn" },
  kalatra: { term: "Kalatra karaka", short: "Venus as the wife or partner in a male chart.", system: "bnn" },
  putra: { term: "Putra karaka", short: "Jupiter read for children; the 5th sign from it gives their count and sex.", system: "bnn" },
  vidya: { term: "Vidya karaka", short: "Mercury as learning, speech and trade.", system: "bnn" },
  combust: { term: "Combust", short: "Within the Sun's pada (about 3° 20'). The planet delivers its results in lesser degree; friends nearby ease it.", system: "bnn" },
  retrograde: { term: "Retrograde", short: "Appearing to move backwards. Nadi reads a retrograde planet from its own sign and, at half strength, from the sign before it.", system: "bnn" },
  "degree-order": { term: "Degree order", short: "Among planets in one sign, the one ahead by degree hands its matters to the one behind; the one behind takes the colour of the one ahead.", system: "bnn" },
  "set-aside": { term: "Set aside", short: "A dignity (exaltation, debilitation) cancelled by a Nadi rule, for example a debilitated planet whose sign lord is exalted.", system: "bnn" },
  trine: { term: "Trine", short: "The 5th and 9th signs from a planet. In Nadi they act almost as strongly as sharing a sign.", system: "both" },
  dusthana: { term: "Dusthana", short: "The 6th, 8th and 12th houses; matters placed there meet obstruction, illness or loss.", system: "both" },
  ak: { term: "Atmakaraka (AK)", short: "The planet with the highest degree in its sign: the king of the chart and the soul's agenda.", system: "jaimini" },
  amk: { term: "Amatyakaraka (AmK)", short: "Second by degree: the minister who carries out the soul's work; read for career.", system: "jaimini" },
  bk: { term: "Bhratrikaraka (BK)", short: "Third by degree: siblings, the teacher and courage.", system: "jaimini" },
  mk: { term: "Matrikaraka (MK)", short: "Fourth by degree: mother, home and property.", system: "jaimini" },
  pik: { term: "Pitrikaraka (PiK)", short: "Fifth by degree: father, children and learning.", system: "jaimini" },
  gk: { term: "Gnatikaraka (GK)", short: "Sixth by degree: rivals, illness and hard karma.", system: "jaimini" },
  dk: { term: "Darakaraka (DK)", short: "Lowest by degree: the spouse and partnerships.", system: "jaimini" },
  karakamsa: { term: "Karakamsa", short: "The navamsa (D9) sign of the Atmakaraka: the soul's own agenda and the seat from which Jaimini reads talents and inclination.", system: "jaimini" },
  swamsa: { term: "Swamsa", short: "Another name for the Karakamsa, the Atmakaraka's navamsa sign.", system: "jaimini" },
  d9: { term: "Navamsa (D9)", short: "The ninth harmonic chart: each sign split into nine parts of 3° 20'. Jaimini reads the soul and marriage from it.", system: "jaimini" },
  al: { term: "Arudha lagna (AL)", short: "The image: how the world sees the native. Found by counting from the lagna to its lord and the same distance again.", system: "jaimini" },
  ul: { term: "Upapada (UL)", short: "The arudha of the 12th house: marriage, the spouse and the marriage's fortunes.", system: "jaimini" },
  pada: { term: "Arudha pada", short: "The reflection of a house in the world; A1 to A12, each showing how that house's matters appear in public.", system: "jaimini" },
  "rasi-drishti": { term: "Rasi drishti", short: "Sign aspect. A movable sign sees the three fixed signs except the one beside it; a fixed sign sees the movable signs except the one beside it; dual signs see one another.", system: "jaimini" },
  argala: { term: "Argala", short: "Intervention. Planets in the 2nd, 4th and 11th from a point support it; those in the 12th, 10th and 3rd obstruct that support.", system: "jaimini" },
  "chara-dasha": { term: "Chara dasha", short: "Jaimini's sign-based periods. Each sign rules for as many years as the count from it to its lord, read in K.N. Rao's manner.", system: "jaimini" },
  antardasha: { term: "Antardasha", short: "A sub-period inside a dasha: each sign of the running period gets an equal share.", system: "jaimini" },
  hl: { term: "Hora lagna (HL)", short: "A special ascendant advancing one sign every two and a half hours from sunrise; read for wealth and, with the lagna and Moon, longevity.", system: "jaimini" },
  gl: { term: "Ghatika lagna (GL)", short: "A special ascendant advancing one sign every 24 minutes from sunrise; read for power and position.", system: "jaimini" },
  ayurdaya: { term: "Ayurdaya", short: "Span of life, classified as short, middle or long from three pairs of points (lagna and HL, Moon and Saturn, the lagna lord and 8th lord).", system: "jaimini" },
  "kakshya-hrasa": { term: "Kakshya hrasa", short: "A step down: Saturn in the lagna or Rahu in the 8th lowers the longevity class by one.", system: "jaimini" },
  "kakshya-vriddhi": { term: "Kakshya vriddhi", short: "A step up: Jupiter or other benefics in the lagna raise the longevity class by one.", system: "jaimini" },
  mahadasha: { term: "Mahadasha", short: "A main period of the Chara dasha, counted in whole years.", system: "jaimini" },
  transit: { term: "Transit", short: "Where a planet stands in the sky now, as against the birth chart. Jupiter and Saturn transits time what the natal chart promises.", system: "both" },
  "double-transit": { term: "Double transit", short: "Jupiter and Saturn both touching the same natal point at once, by placement or aspect. The strongest timing signal.", system: "both" },
  nakshatra: { term: "Nakshatra", short: "One of the 27 lunar mansions of 13° 20'. A planet takes the flavour of its nakshatra's lord.", system: "both" },
  ayanamsa: { term: "Ayanamsa", short: "The offset between the tropical and sidereal zodiacs. Lahiri is the Indian standard.", system: "both" },
  "alp-lagna": { term: "ALP lagna", short: "The ascendant moved forward with age: ten years to a sign, one pada in about 1 year 1 month 10 days (Akshaya Lagna Paddhati). Natal planets are read as houses from it.", system: "alp" },
  "akshaya-rasi": { term: "Akshaya rasi", short: "The mind's counterpart to the ALP lagna (Book 2). The Moon moves from its birth nakshatra to the next with each Vimshottari dasa, a pada per quarter-dasa; the sign the current pada falls in is the Akshaya rasi, read with the dasa lord.", system: "alp" },
  "alp-pada": { term: "ALP pada", short: "The quarter of a nakshatra the ALP lagna currently occupies; nine padas make a sign. Its navamsa sign is said to be activated for the period.", system: "alp" },
  lagna: { term: "Lagna", short: "The ascendant: the sign rising in the east at birth. Nadi does not use it; Jaimini counts from it.", system: "both" },
};

export const glossaryFor = (system: "bnn" | "jaimini" | "alp") => Object.values(GLOSSARY).filter((g) => g.system === system || g.system === "both");
