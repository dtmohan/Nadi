/**
 * Prasna Marga Ch. XXIII, "Diseases: Causes and Remedies": the Karma Vipaka table, which names
 * for each disease the prohibited act of a past life said to be its cause and the remedial measure
 * (japa, homa, dana). The causes are the text's own and are given gently here; the remedies are
 * kept as written. This is reference material, not a diagnosis — the app shows the classical
 * mapping, not a forecast of illness.
 */

export interface PrasnaDiseaseRemedy {
  disease: string;
  cause: string;
  remedy: string;
  source: string;
}

export const PRASNA_DISEASE_REMEDIES: PrasnaDiseaseRemedy[] = [
  { disease: "Consumption", cause: "harm to Brahmins, hatred of preceptors and elders, intimacy at eclipses", remedy: "Sahasra Nama, Rudra and Aindragni Suktas with Homa, and gifts of clothes", source: "Prasna Marga 23.2" },
  { disease: "Emaciation", cause: "stealing food", remedy: "gift an image of Siva", source: "Prasna Marga 23.3" },
  { disease: "Leprosy", cause: "harming Brahmins, the preceptor's wife, selling medicines wrongly, attempting poison", remedy: "Rudra and Ayus Suktas, gift Sun and bull images of gold, Kushmanda Homa", source: "Prasna Marga 23.4" },
  { disease: "White leprosy", cause: "as leprosy, plus taking cotton rolls, clothes and bronze vessels", remedy: "as for leprosy", source: "Prasna Marga 23.5" },
  { disease: "Serpis", cause: "harm to serpents", remedy: "Nagadana — gift an image of a serpent", source: "Prasna Marga 23.6" },
  { disease: "Leucoderma", cause: "taking the wealth of Deities and Brahmins, forbidden foods", remedy: "Kushmanda Homa and a gift of gold", source: "Prasna Marga 23.7" },
  { disease: "Dysentery", cause: "destroying tanks and wells", remedy: "Rudra and Varuna Suktas", source: "Prasna Marga 23.8" },
  { disease: "Disease of the face", cause: "harming lips, teeth and tongues, disparaging elders, false witness", remedy: "Kushmanda Homa, Gayatri Japa, gift of a gold elephant, grains and medicines", source: "Prasna Marga 23.9" },
  { disease: "Piles", cause: "taking the wealth of the learned and the blind, stealing food, intimacy on prohibited days, harm to cows", remedy: "gift a gold figure of a cow", source: "Prasna Marga 23.10" },
  { disease: "Eye disease", cause: "ingratitude, casting glances at other women, injuring eyes", remedy: "payasa, gold and ghee, a gift of Garuda, Homas, Netra-raksha mantra", source: "Prasna Marga 23.11" },
  { disease: "Partial blindness", cause: "injuring a cow's eyes", remedy: "gift an image of Gopala", source: "Prasna Marga 23.12" },
  { disease: "Ear disease", cause: "back-biting, harming ears, obstructing others' work", remedy: "gifts of land, gold, grains and wool, Surya mantra", source: "Prasna Marga 23.13" },
  { disease: "Disease of the tongue", cause: "scolding preceptors and elders, falsehood, causing grief, harming tongues", remedy: "gifts of grains and medicines, Kushmanda Homa, Rahu mantra", source: "Prasna Marga 23.14" },
  { disease: "Rheumatism", cause: "criticising the pious, hating parents and preceptors, stealing food", remedy: "gift a copper deer with clothes and food, Vayu Sukta", source: "Prasna Marga 23.15" },
  { disease: "Colic", cause: "intimacy with virgins, animals, widows or servants, forbidden food, back-biting, poisoning or wounding", remedy: "thila dana and padma dana, gift a silver or gold trident", source: "Prasna Marga 23.16" },
  { disease: "Disease of the spleen", cause: "enmity to the preceptor, envy, misusing another's food", remedy: "Aindragni Homa, Rudra and Vayu Suktas, Gayatri, gift of Ganapati", source: "Prasna Marga 23.17" },
  { disease: "Prameha", cause: "intimacy with animals, virgins, the preceptor's wife or widows; hatred of teachers; stealing Brahmins' food", remedy: "Homas and gifts of gold, cow, water and food, Varuna mantra", source: "Prasna Marga 23.18-19" },
  { disease: "Dropsy", cause: "intimacy with the preceptor's wife, causing abortion", remedy: "Rudra and Varuna Suktas, gift an image of a crocodile and water", source: "Prasna Marga 23.20" },
  { disease: "Urinary disease", cause: "intimacy with virgins, animals or widows, ill-treating Brahmins", remedy: "gifts of gingelly seeds and lotus flowers", source: "Prasna Marga 23.21" },
  { disease: "Fistula", cause: "disregarding elders and preceptors, intimacy with the preceptor's wife", remedy: "gifts of jewels, silver, gold and a gold elephant; Gayatri, Aditya and Rudra Suktas", source: "Prasna Marga 23.22" },
  { disease: "Vidhradhi", cause: "stealing fruits", remedy: "amradana as the Smritis enjoin", source: "Prasna Marga 23.23" },
  { disease: "Throat disease", cause: "stealing public property", remedy: "Grahasanti and gifts of gems", source: "Prasna Marga 23.24" },
  { disease: "Headache", cause: "hatred of Brahmins", remedy: "repentance and a gift of the sacred thread", source: "Prasna Marga 23.25" },
  { disease: "Asrugadhara", cause: "destroying sacred trees, injuring cows", remedy: "gift a red cow", source: "Prasna Marga 23.26" },
  { disease: "Epilepsy", cause: "harming preceptors and masters", remedy: "Japa and Dana as the Smritis enjoin", source: "Prasna Marga 23.27" },
  { disease: "Dumbness and insanity", cause: "ridiculing elders, pursuing pleasure, coveting others' wives, broken promises", remedy: "gift an image of an elephant", source: "Prasna Marga 23.28" },
  { disease: "Fevers", cause: "intimidating others with a dog", remedy: "Abhisheka of Vishnu and Siva, Panchadurga mantra, Rudra Sukta", source: "Prasna Marga 23.29" },
  { disease: "Extreme thirst", cause: "intimacy with the preceptor's wife", remedy: "give water to the thirsty", source: "Prasna Marga 23.30" },
  { disease: "Ulcers", cause: "stealing vegetables, obstructing speech, maltreating others, destroying trees", remedy: "gift a gem, pearls or a precious ring", source: "Prasna Marga 23.31" },
  { disease: "Ulcers of the hands and legs", cause: "causing abortion, intimacy with the preceptor's wife", remedy: "gift a gem to Brahmins", source: "Prasna Marga 23.32" },
  { disease: "Childlessness", cause: "harming children, eating eggs, hating preceptors and children, causing discord between mother and child", remedy: "gift a gold image of a cow", source: "Prasna Marga 23.33" },
  { disease: "Aruchi and Chardhi", cause: "charity given without devotion; betraying one who trusts you", remedy: "suitable remedies left to the learned", source: "Prasna Marga 23.34" },
  { disease: "Muteness", cause: "plagiarism", remedy: "gift an image of Saraswati", source: "Prasna Marga 23.35" },
  { disease: "Blindness", cause: "eating without washing the feet and hands", remedy: "gift an image of Garuda", source: "Prasna Marga 23.36" },
  { disease: "Intestinal trouble", cause: "obstructing the performance of a Yagna", remedy: "gift an image of Vishnu", source: "Prasna Marga 23.37" },
];

export const PRASNA_DISEASE_NOTES = [
  "The causes are Karma Vipaka's own; the text reads each disease as the fruit of a past-life act, and the remedy is a gift, Homa or mantra (23.1). The app shows the classical mapping as reference, never as a diagnosis.",
  "General gifts (23.38-40): iron vessels for Gulma, silver coins for leprosy, cow's milk for rheumatism, gold coins in ghee for eye disease, beds and pillows for body pain, fertile ground for stomach disease; for piles and fistula, gold and diamonds with the Rudra Sukta.",
  "For all diseases the text adds the Sahasranama, Satarudreeya and Rudra Sukta (23.39), and names the gift of health — feeding and medicating the sick — the greatest gift of all (23.40-41).",
];
