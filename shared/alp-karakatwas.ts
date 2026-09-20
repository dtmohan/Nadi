// Planet karakatwas and panchanga notes from the practitioner's basic ALP class (handwritten notes,
// typed up). These are the significations the ALP texts read with; Book 1's chapter on planetary
// characteristics is not in hand, so the class notes stand in for it. Nothing here is a chart rule;
// it is the vocabulary the rules and the "questions to expect" gloss draw on.

import type { Planet } from "./astro";

export const CLASS_NOTES_SOURCE = "Basic ALP class notes (practitioner's own): planets and panchanga";

export interface PlanetKarakatwa {
  planet: Planet;
  /** One-line summary used in the questions gloss. */
  summary: string;
  /** Qualities, people and professions. */
  people: string[];
  /** Places, things and materials. */
  things: string[];
  /** Body parts. */
  body: string[];
  disease: string;
  metal: string;
  cereal: string;
  flower: string;
  taste?: string;
  colour?: string;
  gemstone: string;
  deity: string;
}

export const ALP_PLANET_KARAKATWAS: PlanetKarakatwa[] = [
  {
    planet: "Sun",
    summary: "body, soul, authority, government and its officers, fame, leadership, determination, anger, the right eye, fever",
    people: ["authority", "government, king, prime minister, president, government employees, politicians", "leadership and influencing power", "straightforwardness", "determination", "expecting respect", "anger", "fame, brightness", "a king's life"],
    things: ["capitals", "right-side window", "gold and copper", "wheat, lotus", "spicy taste"],
    body: ["the body as a whole", "soul", "right eye"],
    disease: "fever",
    metal: "gold and copper",
    cereal: "wheat",
    flower: "lotus",
    taste: "spicy",
    colour: "red",
    gemstone: "ruby",
    deity: "Siva",
  },
  {
    planet: "Moon",
    summary: "mind and subconscious, mother-like nature, emotion, imagination and creative work, water bodies, agriculture, hotels and groceries, the left eye, water retention",
    people: ["mind, subconscious mind", "mother-like nature", "emotional", "stealthy nature", "imaginative work: essays, poems, paintings and other creative work", "astrology of the mind"],
    things: ["milk and milk products", "agriculture", "hotels, grocery stores", "rivers, ponds, lakes and other water bodies", "left-side window, bathing room", "clouds", "cotton cloth", "all Amman temples"],
    body: ["left eye"],
    disease: "water retention, arthritis",
    metal: "lead and bronze",
    cereal: "paddy",
    flower: "white oleander",
    colour: "white",
    gemstone: "pearl",
    deity: "Parvathy",
  },
  {
    planet: "Mars",
    summary: "protection and uniformed service, engineers, surgeons, sportspeople, hard work and harshness, house and housing plots, land, mountains and mines, metal work, teeth, blood, bone and marrow, blood pressure",
    people: ["soldiers, security, uniformed service personnel", "protection", "engineers", "sportspeople", "head of an employee council", "surgeons", "harsh", "hard-working", "the art of cooking", "antique collecting"],
    things: ["transformers, motors", "stones, cutting stones", "pottery, brick kilns", "metal workshops", "house, housing plots", "mountains, mines, rocks, minerals"],
    body: ["teeth", "blood", "bones and bone marrow"],
    disease: "blood pressure and other blood-related illness",
    metal: "copper",
    cereal: "toor dal",
    flower: "chembakam",
    taste: "astringent",
    colour: "bright red",
    gemstone: "coral",
    deity: "Lord Shanmugha",
  },
  {
    planet: "Mercury",
    summary: "friendliness and mingling, communication and speech, trade and commerce, accounts, intellect, poets and painters, teachers and scientists, calculation astrology, investigation, the shoulders, nerves and thyroid",
    people: ["mingling with everyone, friendly", "trade and commerce, business", "book selling", "accountants", "humorous", "intellectuals", "poets, painters", "professors and lecturers", "scientists", "calculation-based astrology", "tantric shastras", "investigation"],
    things: ["study room", "parks", "green vegetables", "communication, speech", "postal department", "embassies"],
    body: ["shoulders", "speech"],
    disease: "nervous problems, thyroid, stammering and difficulty speaking",
    metal: "brass",
    cereal: "green gram",
    flower: "white lotus",
    taste: "salt",
    colour: "green",
    gemstone: "emerald",
    deity: "Maha Vishnu",
  },
  {
    planet: "Jupiter",
    summary: "wisdom, great wealth, spiritual and religious service, judiciary and advocates, teachers and guides, patience, modesty, philosophy, body fat and cholesterol, cramps and bloating",
    people: ["wisdom", "huge wealth", "judicial departments, advocates", "spiritual service, religious preachers", "guides, teachers, ministers of education", "event compeers", "yoga practitioners, Vedic practitioners", "religious and charitable departments, charitable trusts", "huge respect", "patience, modesty", "philosophy"],
    things: ["puja room", "honey"],
    body: ["body fat, cholesterol"],
    disease: "brine-related (salt and fluid) complaints, muscular cramps, bloating",
    metal: "gold",
    cereal: "channa dal",
    flower: "Arabian jasmine",
    taste: "sweet",
    colour: "yellow",
    gemstone: "yellow sapphire",
    deity: "Brahma",
  },
  {
    planet: "Venus",
    summary: "music, dance and acting, beauty and cosmetics, luxury and perfume, finance and banks, textiles, tasty food, diamonds, tourist places, the cheek, sperm and uterus, kidney trouble",
    people: ["music, dance, acting", "lyric writers", "makeup artists, beauty contests", "finance sector, banks, fund raising, finance minister", "diamond business", "sculptural work"],
    things: ["alcohol shops", "textile stores", "beauty and cosmetics, perfumes", "luxurious things", "tasty foods, fruit, juice shops", "musical instruments", "tourist places", "auditoriums"],
    body: ["cheek", "sperm", "uterus"],
    disease: "kidney problems",
    metal: "silver",
    cereal: "moong beans",
    flower: "white lotus",
    taste: "sweet",
    gemstone: "diamond",
    deity: "Mahalakshmi",
  },
  {
    planet: "Saturn",
    summary: "career and profession, life expectancy, servitude, employees, hard work for little income, iron, oil, coal, waste, animal husbandry, granite, cemeteries, footwear, barbers and cleaning, the foot and digestive organs, nerves and epilepsy",
    people: ["career or profession", "life expectancy", "slavery, servitude", "hard work for less income", "employees", "animal husbandry", "working in cemeteries", "footwear stitching and manufacture", "barbers", "cleaning work"],
    things: ["iron-related business or work", "oil business", "coal mines", "selling waste products", "black stones and rocks, granite"],
    body: ["foot", "digestive organs"],
    disease: "nerve-related illness, epilepsy",
    metal: "iron",
    cereal: "black sesame",
    flower: "blackberry",
    taste: "bitter",
    colour: "grey and black",
    gemstone: "blue sapphire",
    deity: "a deity with weapons in hand",
  },
  {
    planet: "Rahu",
    summary: "pleasure, paternal grandparents, going abroad and foreign languages, photography, roads and entrances, illusion, corruption, smuggling and illegal trade, black magic, explosives, prisons, the intestines, dry skin, baldness",
    people: ["pleasure", "paternal grandparents", "going abroad, foreign languages", "photography", "smuggling, drug trafficking, illegal business", "corruption, cheating others", "black magic", "making explosives", "jobs in prisons"],
    things: ["prime entrance, roads", "the magnificent", "mirage or illusion", "umbrella", "dead trees", "accident-prone areas", "snake's mouth, snake parts", "coffee beans", "plastics"],
    body: ["intestines", "skin (dryness)"],
    disease: "baldness, leprosy",
    metal: "black stone",
    cereal: "black gram dal",
    flower: "mandhara",
    taste: "tangy",
    colour: "black",
    gemstone: "gomedha (hessonite)",
    deity: "Maha Kaali",
  },
  {
    planet: "Ketu",
    summary: "moksha, maternal grandparents, secrecy, sanyasis and mantra healing, archaeology, roots and herbs, ropes, wires and networks, tailoring, narrow passages, staircases and backyards, the genitals, nail inflammation, cancer",
    people: ["moksha", "maternal grandparents", "secret behaviour", "sanyasis", "healing with mantra", "archaeology department", "tailors, stitching", "rope business"],
    things: ["staircase", "chimney or exhaust", "backyard", "narrow passage", "saffron cloth", "roots, herbal plants", "chain networks, electric lines and wires", "mats, baskets"],
    body: ["genital organs", "anus", "beard"],
    disease: "nail inflammation, cancer",
    metal: "rusted iron",
    cereal: "horse gram",
    flower: "red oleander",
    colour: "saffron red",
    gemstone: "cat's eye",
    deity: "Lord Ganesha",
  },
];

export interface WeekdayNote {
  day: string;
  planet: string;
  deity: string;
  note: string;
}

export const ALP_WEEKDAYS: WeekdayNote[] = [
  { day: "Sunday", planet: "Sun", deity: "Siva", note: "Pink; a one-eyed day; not good for travel." },
  { day: "Monday", planet: "Moon", deity: "Durga", note: "Movable; cloudy white; a one-eyed day; tulsi." },
  { day: "Tuesday", planet: "Mars", deity: "Shanmugha", note: "Power and heat; good for ending fights or war, making weapons, starting exercise; not good for pilgrimage or auspicious events; red; a blind day; wood apple." },
  { day: "Wednesday", planet: "Mercury (also given to Rahu)", deity: "Maha Vishnu; Durga and Hanuman for Rahu", note: "Good to start education; good for agriculture; a neutral, two-eyed, auspicious day; pilgrimages begun today can bring fear; pomegranate leaf." },
  { day: "Thursday", planet: "Jupiter (also allotted to Ketu)", deity: "Brahma, all saints; Ganesha for Ketu", note: "Good for marriage, opening bank accounts, pilgrimages; yellow; a two-eyed auspicious day; peepal (aal) leaf." },
  { day: "Friday", planet: "Venus", deity: "Indra, Maha Lakshmi", note: "Cleaning, haircutting; good to go and see a bride; golden; a two-eyed auspicious day." },
  { day: "Saturday", planet: "Saturn", deity: "Yama and the village deities", note: "Fixed focus; good for meditation, oil bath for men, metal work." },
];

export const ALP_HORA_NOTE = "Each of the seven planets rules three hours a day, twenty-one in all; the remaining three hours go to Rahu and Ketu.";

export const ALP_TITHI_NOTE = "The Moon moves away from the Sun about 12 degrees a day, one tithi; Moon and Sun together is amavasya.";

export interface YogaNote {
  yoga: string;
  meaning: string;
}

/** Nitya yogas as covered in the class (the first ten; the rest were not taken down). */
export const ALP_YOGAS: YogaNote[] = [
  { yoga: "Vishkambha", meaning: "prevails over others and enemies; obtains property; rich" },
  { yoga: "Preeti", meaning: "fondness; well liked by everybody" },
  { yoga: "Ayushman", meaning: "long-lived; full of energy" },
  { yoga: "Saubhagya", meaning: "good fortune; a comfortable and happy life" },
  { yoga: "Shobhana", meaning: "splendour; a lustrous body; obsessed with sex" },
  { yoga: "Atiganda", meaning: "danger and obstacles; a difficult life through obstacles and accidents; angry, vengeful" },
  { yoga: "Sukarma", meaning: "virtuous; noble deeds" },
  { yoga: "Dhriti", meaning: "enjoys the wealth of others" },
  { yoga: "Shoola", meaning: "confrontational, quarrelsome" },
  { yoga: "Ganda", meaning: "(not taken down)" },
  { yoga: "Vriddhi", meaning: "growth" },
];

export interface ElementHour {
  from: string;
  to: string;
  element: string;
}

/** The five elements through the day, as noted in class; gaps are the notes' own. */
export const ALP_ELEMENT_HOURS: ElementHour[] = [
  { from: "6:00 am", to: "8:24 am", element: "ether" },
  { from: "8:25 am", to: "10:48 am", element: "air" },
  { from: "10:49 am", to: "1:12 pm", element: "fire" },
  { from: "1:13 pm", to: "3:36 pm", element: "water" },
  { from: "3:37 pm", to: "6:00 pm", element: "(not taken down; earth by the pattern)" },
  { from: "6:00 pm", to: "8:24 pm", element: "air" },
  { from: "8:25 pm", to: "10:48 pm", element: "(not taken down)" },
  { from: "10:49 pm", to: "1:12 am", element: "fire" },
  { from: "1:13 am", to: "3:36 am", element: "air" },
  { from: "3:37 am", to: "6:00 am", element: "ether" },
];

export const ALP_PANCHANGA_ELEMENTS: { limb: string; element: string; fasting: string }[] = [
  { limb: "Tithi", element: "water", fasting: "fasting on the birth tithi works on economic condition" },
  { limb: "Nakshatra", element: "fire", fasting: "fasting on the janma nakshatra washes sins" },
  { limb: "Yoga", element: "air", fasting: "fasting on the birth yoga heals" },
  { limb: "Karana", element: "ether", fasting: "fasting on the birth karana fulfils desires" },
];

export const ALP_PLANET_THEMES: Record<Planet, string> = Object.fromEntries(ALP_PLANET_KARAKATWAS.map((k) => [k.planet, k.summary])) as Record<Planet, string>;
