// Prasna Marga, harvested for the natal chart.
//
// Prasna Marga (attributed to Panakkattu Namboodiri, Kerala) is a horary text, but a set of its
// chapters reads a chart by the bhavas and planets, and those are harvestable for the natal
// reader. The first slice is "Effects of Planets in Houses" (B.V. Raman's translation, Chapter XIV,
// stanzas 50–65): for each of the twelve houses, what a malefic brings and what a benefic brings.
//
// "Malefic" and "benefic" are this app's natural classification (Jupiter and Venus; the waxing
// Moon; Mercury unless with a malefic — BPHS 3.11), applied because the stanzas name "evil" and
// "good" planets without defining them; that choice is provisional. Houses are whole signs counted
// from the ascendant. Every text is paraphrased and cited by chapter and stanza.

import type { PlanetPosition } from "./astro";
import { houseFrom } from "./astro";
import { naturalBenefic } from "./parashari";

export interface PrasnaHouseRule {
  house: number; // 1..12 from the ascendant
  stanza: string; // "51", "57-58", ...
  malefic: string;
  benefic: string;
}

/** "Effects of Planets in Houses", Chapter XIV, stanzas 51–64 (Raman tr.). */
export const PRASNA_HOUSE_EFFECTS: PrasnaHouseRule[] = [
  {
    house: 1,
    stanza: "51",
    malefic:
      "An evil planet in the Lagna brings failure, disease of the head, sorrow, dishonour, displacement, loss of money and bodily discomfort.",
    benefic:
      "A benefic in the Lagna gives comfort, success, good health, financial prosperity, fame and promotion.",
  },
  {
    house: 2,
    stanza: "52",
    malefic:
      "A malefic in the 2nd brings loss of ancestral property, disease of the face, sickness in the family, trouble to the right eye, scandal and loss of vessels.",
    benefic:
      "A benefic in the 2nd increases family wealth, brings gains of vessels, family amity and happiness.",
  },
  {
    house: 3,
    stanza: "53",
    malefic:
      "A malefic in the 3rd brings misunderstanding with friends and helpers, misfortune to brothers, disease of the chest, neck and right ear, mental affliction, bad conduct and cowardice.",
    benefic:
      "A benefic in the 3rd gives good conduct, courage, happiness to brothers, help from others and good health.",
  },
  {
    house: 4,
    stanza: "54",
    malefic:
      "A malefic in the 4th causes distress to the mother and maternal relations, loss of cattle, beds, landed property and vehicles, heart trouble and general misery.",
    benefic:
      "A benefic in the 4th confers vehicles, lands, cattle, beds and general prosperity and health.",
  },
  {
    house: 5,
    stanza: "55",
    malefic:
      "A malefic in the 5th, afflicted by combustion and the like, brings illness or danger to children, mental uneasiness, an irritable temper and trouble to the native's advisers.",
    benefic:
      "A benefic in the 5th brings children, good health, peace of mind, influence and an increase of good deeds.",
  },
  {
    house: 6,
    stanza: "56",
    malefic:
      "A malefic in the 6th brings a wound or ulcer in the organ ruled by the 6th sign, fear from thieves and enemies, trouble in the waist and navel, obstacles and the ailments signified by the occupying planet.",
    benefic:
      "A benefic in the 6th vanquishes enemies and makes diseases disappear, and new ones do not arise.",
  },
  {
    house: 7,
    stanza: "57-58",
    malefic:
      "Malefics in the 7th bring sickness, separation from the life-partner, disturbance to journeys and urinary trouble; fire may break out in the spouse's house.",
    benefic:
      "Benefics in the 7th indicate marriage, recovery of lost wealth, enjoyment, happiness and the safe return of relations from foreign countries.",
  },
  {
    house: 8,
    stanza: "59-60",
    malefic:
      "Malefics in the 8th bring illness to servants, obstacles in all works, disease of the anus, quarrels, loss of wealth through thieves, rulers or enemies, loss of appetite and a bad name.",
    benefic:
      "A benefic in the 8th gives freedom from disease, courage, longevity and facilities to acquire new houses and build institutions.",
  },
  {
    house: 9,
    stanza: "61",
    malefic:
      "Malefics in the 9th cause illness to elders, the father and grandchildren, ill luck, divine wrath, disinclination to charity, decline of merit, ruin of penance and hard-heartedness.",
    benefic:
      "Benefics in the 9th bring blessings from elders and parents, mental happiness, divine grace, increase of fortune, inclination to good acts and happiness from grandchildren.",
  },
  {
    house: 10,
    stanza: "62",
    malefic:
      "Malefics in the 10th bring failure in efforts, a bad name, loss of respect, ruin to servants, breaks in profession, disease of the ankle and exile.",
    benefic:
      "Benefics in the 10th bring success in all attempts, increase of prestige and influence, rise in profession and acquisition of servants.",
  },
  {
    house: 11,
    stanza: "63",
    malefic:
      "Malefics in the 11th bring illness to elder brothers and sons, fresh ailments in the left ear and legs, but also the gain of articles.",
    benefic:
      "Benefics in the 11th bring abatement of grief, accomplishment of desired objects and fresh sources of wealth.",
  },
  {
    house: 12,
    stanza: "64",
    malefic:
      "Malefics in the 12th bring squandering of money, fall from position, trouble in the soles of the feet and the left eye, and falls through carelessness and sinful acts.",
    benefic:
      "Benefics in the 12th cause heavy expenditure for good purposes, gradual ending of sinful acts and abatement of sickness.",
  },
];

export interface PrasnaHouseReading {
  house: number;
  stanza: string;
  occupants: PlanetPosition[];
  malefics: PlanetPosition[];
  benefics: PlanetPosition[];
  maleficText?: string;
  beneficText?: string;
  source: string;
}

const PM = (stanza: string) => `Prasna Marga 14.${stanza}`;

/**
 * Read "Effects of Planets in Houses" for a chart: for each house that a planet occupies, state
 * the malefic result and the benefic result as the occupants fall. Houses are whole signs counted
 * from the ascendant. Empty houses are left silent (the text reads them by their lord elsewhere).
 */
export function computePrasna(
  positions: PlanetPosition[],
  lagnaIdx: number,
): PrasnaHouseReading[] {
  const out: PrasnaHouseReading[] = [];
  for (const rule of PRASNA_HOUSE_EFFECTS) {
    const occupants = positions.filter(
      (p) => houseFrom(lagnaIdx, p.signIndex) === rule.house,
    );
    if (!occupants.length) continue;
    const malefics = occupants.filter((p) => !naturalBenefic(p, positions));
    const benefics = occupants.filter((p) => naturalBenefic(p, positions));
    out.push({
      house: rule.house,
      stanza: rule.stanza,
      occupants,
      malefics,
      benefics,
      maleficText: malefics.length ? rule.malefic : undefined,
      beneficText: benefics.length ? rule.benefic : undefined,
      source: PM(rule.stanza),
    });
  }
  return out;
}

export const PRASNA_CAVEATS = [
  "Effects of Planets in Houses, Prasna Marga Chapter XIV, stanzas 50–65 (B.V. Raman's English translation). Houses are whole signs counted from the ascendant.",
  "\"Malefic\" and \"benefic\" are this app's natural classification (Jupiter and Venus; the waxing Moon; Mercury unless with a malefic — BPHS 3.11); the stanzas name \"evil\" and \"good\" planets without defining them, so that choice is provisional.",
  "The text's special effects for each planet-and-house combination, and its reading of empty houses by their lords, are not yet entered — this is the first slice.",
];
