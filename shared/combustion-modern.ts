// Modern readings of combustion, set beside the verses. Display only: nothing here is counted, and no rule,
// verdict or kernel code may import this module (guarded in scripts/combustion-modern.test.ts). The period card
// and the Planetary states list in client/src/components/parashari-panel.tsx, and the report's period section in
// shared/report/parashari.ts, are its only readers.
//
// C3, "through the Sun": in PVR Narasimha Rao's example a combust Venus is too weak to act and the Sun gives the
// result (Lessons on Vedic Astrology vol. I, p. 6); he calls combustion important but overrated (p. 201), and has
// a Mars very close to the Sun behave like the Sun (p. 202). Visti Larsen's fifth example ties a combust Mercury's
// sub-period, which brought an initiation at the father's urging, to Mercury ruling the 9th from the Sun
// (Astangata, pp. 17-18). The nearest classical parallel is narrow: in Parashara's renunciation (pravrajya) verses,
// weak planets combust by a strong Sun give a renunciation of the Sun's order (verse 5, as Larsen gives it, p. 17).
//
// C4, PVR's qualifiers: combustion is not as bad when the Sun is debilitated in Libra, and Jupiter and Mars, the
// Sun's friends, are little harmed (p. 84); with Mars it does not matter and even for Jupiter it is not bad, while
// Venus suffers most (p. 91; also p. 6). He also weighs a very close Jupiter as more of a problem than a very close
// Mars (p. 202). The Venus qualifier is for the practitioner view only (gentle-results policy).
//
// Combustion here is the app's: the Surya Siddhanta orbs (9.6-9), as in shared/combustion.ts.

import type { Planet, PlanetPosition } from "./astro";
import type { DasaSource } from "./parashari-dasa";
import { BPHS_URL } from "./parashari-data";
import { ssCombust, sunDistance } from "./combustion";

export const PVR_LESSONS_URL = "https://www.vedicastrologer.org/classes/book1-for-CD.pdf";
export const LARSEN_ASTANGATA_URL = "https://srigaruda.com/wp-content/uploads/2008/08/astangata-asta.pdf";

const PVR = (pages: string): DasaSource => ({
  label: `PVR Narasimha Rao, Lessons on Vedic Astrology vol. I, ${pages}`,
  url: PVR_LESSONS_URL,
  provisional: true,
});
const LARSEN = (pages: string): DasaSource => ({
  label: `Visti Larsen, Astangata, ${pages}`,
  url: LARSEN_ASTANGATA_URL,
  provisional: true,
});

export interface ModernCombustNote {
  id: string;
  /** Practitioner wording, with the distance from the Sun and the pages. */
  text: string;
  /** Plain wording; absent when the note is for the practitioner view only. */
  plain?: string;
  sources: DasaSource[];
}

/** Said once under the notes, in both views. */
export const MODERN_COMBUST_NOT_COUNTED = "Modern readings, shown beside the texts and not counted.";
export const MODERN_COMBUST_NOT_COUNTED_PLAIN = "Shown for context, not counted.";

const NAMED: Planet[] = ["Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const listJoin = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const thePlanet = (p: Planet) => (p === "Sun" || p === "Moon" ? `the ${p}` : p);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function sunOf(positions: PlanetPosition[]): PlanetPosition | undefined {
  return positions.find((x) => x.planet === "Sun");
}

/** The planets combust in this chart, by the Surya Siddhanta orbs, with their distance from the Sun. */
export function combustPlanets(positions: PlanetPosition[]): Array<{ planet: Planet; distance: number }> {
  const sun = sunOf(positions);
  if (!sun) return [];
  return positions
    .filter((p) => NAMED.includes(p.planet) && ssCombust(p, sun.lon))
    .map((p) => ({ planet: p.planet, distance: sunDistance(p, sun.lon) }));
}

/** PVR's qualifiers for a combust planet (C4), for the period card and the Planetary states line. */
export function combustQualifiers(planet: Planet, positions: PlanetPosition[]): ModernCombustNote[] {
  const sun = sunOf(positions);
  const p = positions.find((x) => x.planet === planet);
  if (!sun || !p || !NAMED.includes(planet) || !ssCombust(p, sun.lon)) return [];
  const out: ModernCombustNote[] = [];
  if (sun.dignity === "Debilitated")
    out.push({
      id: `${planet}-modern-sun-debilitated`,
      plain: "A modern view holds that being close to the Sun weighs less when the Sun is itself weak by sign, as it is here.",
      text: `Modern (PVR Narasimha Rao): combustion is not as bad when the Sun is debilitated in Libra, as it is here (Lessons vol. I, p. 84).`,
      sources: [PVR("p. 84")],
    });
  if (planet === "Jupiter" || planet === "Mars")
    out.push({
      id: `${planet}-modern-sun-friend`,
      plain: `A modern view counts Jupiter and Mars, the Sun's friends, as little harmed by being close to it.`,
      text:
        `Modern (PVR Narasimha Rao): Jupiter and Mars are the Sun's friends, so combustion does them little harm (p. 84); with Mars it does not matter, and even for Jupiter it is not bad (p. 91).` +
        (planet === "Jupiter" ? " He also weighs a very close Jupiter as more of a problem than a very close Mars (p. 202)." : ""),
      sources: [PVR(planet === "Jupiter" ? "pp. 84, 91, 202" : "pp. 84, 91")],
    });
  if (planet === "Venus")
    out.push({
      id: "Venus-modern-most-harmed",
      text: "Modern (PVR Narasimha Rao): Venus is the planet combustion harms most (Lessons vol. I, pp. 6, 84, 91).",
      sources: [PVR("pp. 6, 84, 91")],
    });
  return out;
}

/**
 * The modern readings for a main period (C3 with C4). For a combust lord: that it may also deliver through the
 * Sun, then PVR's qualifiers. For the Sun: the combust companions whose matters its period may carry, pointing to
 * the classical lines on the Sun's companions (BPHS 47.7-11, 48.15, 50.84).
 */
export function periodModernNotes(lord: Planet, positions: PlanetPosition[]): ModernCombustNote[] {
  const combust = combustPlanets(positions);
  if (lord === "Sun") {
    if (!combust.length) return [];
    const names = combust.map((c) => thePlanet(c.planet));
    const one = combust.length === 1;
    return [
      {
        id: "Sun-modern-companions",
        plain:
          `${cap(listJoin(names))} ${one ? "is" : "are"} close to the Sun in this chart. A modern reading lets the Sun's period carry ${one ? "its" : "their"} matters too. ` +
          "Where Parashara speaks of the planets joined with the Sun, those lines are among this period's own.",
        text:
          `Combust by the Surya Siddhanta orbs: ${combust.map((c) => `${thePlanet(c.planet)} ${c.distance.toFixed(1)}°`).join(", ")} from the Sun. ` +
          "Modern: the Sun may give the results of a planet it combusts; in PVR Narasimha Rao's example a combust Venus is too weak to act and the Sun gives the result (Lessons vol. I, p. 6). " +
          "The classical lines on the Sun's companions are 47.7-11 (joined with the 2nd, 5th, 9th or 10th lord), 48.15 (joined with an angle or trine lord placed in a trine or angle) and 50.84 (the 9th lord and Jupiter related to the lord); those that apply are among this period's lines.",
        sources: [PVR("p. 6"), { label: "Parashara 47.7-11", url: BPHS_URL(47) }, { label: "Parashara 48.15", url: BPHS_URL(48) }, { label: "Parashara 50.84", url: BPHS_URL(50) }],
      },
    ];
  }
  const me = combust.find((c) => c.planet === lord);
  if (!me) return [];
  return [
    {
      id: `${lord}-modern-through-sun`,
      plain: `Close to the Sun, ${thePlanet(lord)} may also deliver through the Sun's channels: authority, the father, standing. This is a modern reading.`,
      text:
        `${cap(thePlanet(lord))} is ${me.distance.toFixed(1)}° from the Sun, combust by the Surya Siddhanta orbs. Modern: a combust planet may give its results through the Sun. In PVR Narasimha Rao's example a combust Venus is too weak to act and the Sun gives the result (Lessons vol. I, p. 6); he calls combustion important but overrated (p. 201), and has a Mars very close to the Sun behave like the Sun (p. 202). ` +
        "In Visti Larsen's fifth example (Ashtottari periods) a combust Mercury's sub-period brought an initiation at the father's urging, which he ties to Mercury ruling the 9th from the Sun (Astangata, pp. 17-18). " +
        "The nearest classical parallel is narrow: in Parashara's renunciation (pravrajya) verses, weak planets combust by a strong Sun give a renunciation of the Sun's order (verse 5, as Larsen gives it, p. 17).",
      sources: [PVR("pp. 6, 201-202"), LARSEN("pp. 17-18")],
    },
    ...combustQualifiers(lord, positions),
  ];
}
