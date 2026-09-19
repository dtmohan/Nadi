import type { Rule } from "./rules";

/**
 * Rules for planets in houses counted from a karaka.
 *
 * The 1st, 2nd, 12th, 5th, 9th and 7th are already covered by the combination rules (conjunct,
 * next, prev, trine, opposite). These read the remaining houses, and Saturn's 12th, where the
 * texts give specific results. Houses are whole signs from the karaka; no ascendant is used.
 */

const S_SITHAR = "Sitharsastrology, The 12 houses counted from Jupiter";
const S_BOOT = "BNN Bootcamp 10, Profession";
const S_BHRIGU = "Bhrigu Naadi principles";

export const HOUSE_RULES: Rule[] = [
  // ── From Jupiter, the life force ──
  { id: "h-ju-3-me", area: "education", when: { subject: "Jupiter", object: "Mercury", house: [3] }, text: "Mercury in the 3rd from Jupiter: communication gifts are amplified; writing, skills and short journeys serve the life path.", weight: 1, source: S_SITHAR },
  { id: "h-ju-3-ma", area: "self", when: { subject: "Jupiter", object: "Mars", house: [3] }, text: "Mars in the 3rd from Jupiter: courage and initiative; younger siblings are energetic or contentious.", weight: 1, source: S_SITHAR },
  { id: "h-ju-4-mo", area: "family", when: { subject: "Jupiter", object: "Moon", house: [4] }, text: "Moon in the 4th from Jupiter: a strong bond with the mother and the home; emotional roots steady the life force.", weight: 1, source: S_SITHAR },
  { id: "h-ju-4-sa", area: "family", when: { subject: "Jupiter", object: "Saturn", house: [4] }, text: "Saturn in the 4th from Jupiter: home ownership comes late or through effort; the mother may know hardship.", weight: 1, source: S_SITHAR },
  { id: "h-ju-4-ma", area: "wealth", when: { subject: "Jupiter", object: "Mars", house: [4, 10] }, text: "Mars in or aspecting the 4th from Jupiter: landed property; the native buys or builds a house when Jupiter's transit touches the 4th.", weight: 2, source: S_BHRIGU },
  { id: "h-ju-4-ra", area: "family", when: { subject: "Jupiter", object: "Rahu", house: [4] }, text: "Rahu in the 4th from Jupiter: an unusual or distant home; property abroad or an unconventional domestic life.", weight: 1, source: S_SITHAR },
  { id: "h-ju-6-ma", area: "health", when: { subject: "Jupiter", object: "Mars", house: [6] }, text: "Mars in the 6th from Jupiter: strength to overcome enemies and illness; competitive vigour.", weight: 1, source: S_SITHAR },
  { id: "h-ju-6-ke", area: "health", when: { subject: "Jupiter", object: "Ketu", house: [6] }, text: "Ketu in the 6th from Jupiter: hard-to-diagnose ailments, or a life of service; hidden adversaries dissolve on their own.", weight: 1, source: S_SITHAR },
  { id: "h-ju-6-sa", area: "health", when: { subject: "Jupiter", object: "Saturn", house: [6] }, text: "Saturn in the 6th from Jupiter: chronic but manageable ailments; duty-bound service and long-running debts.", weight: 1, source: S_SITHAR },
  { id: "h-ju-8-ke", area: "spirituality", when: { subject: "Jupiter", object: "Ketu", house: [8] }, text: "Ketu in the 8th from Jupiter: deep spiritual and occult interests; sudden inner transformations.", weight: 1, source: S_SITHAR },
  { id: "h-ju-8-ma", area: "health", when: { subject: "Jupiter", object: "Mars", house: [8] }, text: "Mars in the 8th from Jupiter: surgical events or inheritance disputes; sudden, forceful changes.", weight: 1, source: S_SITHAR },
  { id: "h-ju-8-sa", area: "health", when: { subject: "Jupiter", object: "Saturn", house: [8] }, text: "Saturn in the 8th from Jupiter: long life with slow, deep transformations; inheritance arrives late.", weight: 1, source: S_SITHAR },
  { id: "h-ju-10-sa", area: "career", when: { subject: "Jupiter", object: "Saturn", house: [10] }, text: "Saturn in the 10th from Jupiter: strong career focus and eventual authority; status is earned by persistence.", weight: 2, source: S_SITHAR },
  { id: "h-ju-10-su", area: "career", when: { subject: "Jupiter", object: "Sun", house: [10] }, text: "Sun in the 10th from Jupiter: recognition and leadership; public standing through government or authority.", weight: 2, source: S_SITHAR },
  { id: "h-ju-10-ra", area: "career", when: { subject: "Jupiter", object: "Rahu", house: [10] }, text: "Rahu in the 10th from Jupiter: an unconventional or foreign-facing public role; ambition drives status.", weight: 1, source: S_SITHAR },
  { id: "h-ju-11-ra", area: "wealth", when: { subject: "Jupiter", object: "Rahu", house: [11] }, text: "Rahu in the 11th from Jupiter: gains through unconventional or foreign sources; wide, unusual networks.", weight: 1, source: S_SITHAR },
  { id: "h-ju-11-ve", area: "wealth", when: { subject: "Jupiter", object: "Venus", house: [11] }, text: "Venus in the 11th from Jupiter: income through comforts, arts or the spouse's side; pleasant friendships.", weight: 1, source: S_SITHAR },
  { id: "h-ju-11-sa", area: "wealth", when: { subject: "Jupiter", object: "Saturn", house: [11] }, text: "Saturn in the 11th from Jupiter: gains build slowly through steady work; older friends and elder siblings matter.", weight: 1, source: S_SITHAR },

  // ── From Saturn, the karma karaka ──
  { id: "h-sa-3-su", area: "career", when: { subject: "Saturn", object: "Sun", house: [3] }, text: "Sun in the 3rd from Saturn: the profession starts well, under authority or government; Saturn's 3rd aspect marks the start of the career.", weight: 1, source: S_BOOT },
  { id: "h-sa-3-su-me", area: "career", when: { subject: "Saturn", object: "Sun", house: [3], with: [{ planet: "Mercury", relation: ["conjunct"] }] }, text: "Sun with Mercury in the 3rd from Saturn: large-scale business or trade.", weight: 2, source: S_BOOT },
  { id: "h-sa-7-10-su", area: "career", when: { subject: "Saturn", object: "Sun", house: [7, 10] }, text: "Sun in the 7th or 10th from Saturn: large-scale work with machinery, land, coaching or the police; never a low rank or low pay.", weight: 2, source: S_BOOT },
  { id: "h-sa-12-ma", area: "career", when: { subject: "Saturn", object: "Mars", house: [12] }, text: "Mars in the 12th from Saturn: a harsh or hazardous work environment; friction and haste in the background of the job.", weight: 1, source: S_BOOT },
  { id: "h-sa-12-ra", area: "career", when: { subject: "Saturn", object: "Rahu", house: [12] }, text: "Rahu in the 12th from Saturn: an unsettled or foreign work environment; work taken up under pressure of circumstance.", weight: 1, source: S_BOOT },
  { id: "h-sa-12-ke", area: "career", when: { subject: "Saturn", object: "Ketu", house: [12] }, text: "Ketu in the 12th from Saturn: a detached or unsatisfying work environment; the job may not be by choice.", weight: 1, source: S_BOOT },
  { id: "h-sa-12-ve", area: "career", when: { subject: "Saturn", object: "Venus", house: [12] }, text: "Venus in the 12th from Saturn: a comfortable, pleasant work environment; the native enjoys the work.", weight: 1, source: S_BOOT },
  { id: "h-sa-12-ju", area: "career", when: { subject: "Saturn", object: "Jupiter", house: [12] }, text: "Jupiter in the 12th from Saturn: a respected, principled work environment; the native enjoys the work.", weight: 1, source: S_BOOT },
  { id: "h-sa-12-su", area: "career", when: { subject: "Saturn", object: "Sun", house: [12] }, text: "Sun in the 12th from Saturn: an authoritative, well-regarded work environment; the native enjoys the work.", weight: 1, source: S_BOOT },
  { id: "h-sa-12-me", area: "career", when: { subject: "Saturn", object: "Mercury", house: [12] }, text: "Mercury in the 12th from Saturn: a communicative, commercial work environment; the native enjoys the work.", weight: 1, source: S_BOOT },
];
