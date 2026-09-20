// Planetary strength the Nadi way (R.G. Rao's basic rules, S. Naik's Prediction Secrets).
//
// Dignity is not absolute in BNN: an exalted planet flanked by enemies, or with nobody to
// deliver its results, gives no exalted benefit; a debilitated planet in exchange or with
// friendly neighbours still functions. Combustion is a tight same-pada affair that a
// friendly association or exchange cancels. Degree order inside a sign decides who "wins".

import { ENEMIES, FRIENDS, PLANETS, houseFrom, type Dignity, type Planet, type PlanetPosition } from "./astro";

export interface PlanetStrength {
  planet: Planet;
  /** Dignity by sign alone. */
  dignity: Dignity;
  /** Dignity after Nadi cancellation rules. */
  effectiveDignity: Dignity;
  /** Why an exaltation or debilitation was set aside. */
  dignityNote: string | null;
  /** Within 3°20' of the Sun. */
  combust: boolean;
  /** Combustion neutralised by a friendly association or exchange. */
  combustNote: string | null;
  /** Combust and not cancelled: results arrive "in lesser degree". */
  effectiveCombust: boolean;
  /** Enemies sharing the sign that this planet leads by degree. */
  winningOver: Planet[];
  /** Enemies sharing the sign that lead this planet by degree. */
  losingTo: Planet[];
  /** Planet in exchange of signs with this one, if any. */
  exchangeWith: Planet | null;
  /** Neighbours in the 2nd and 12th signs. */
  hemmed: "friends" | "enemies" | "mixed" | null;
  /** Short human-readable notes for tables and PDF. */
  notes: string[];
}

const NODES = new Set<Planet>(["Rahu", "Ketu"]);

function isFriend(a: Planet, b: Planet) {
  return FRIENDS[a].includes(b);
}
function isEnemy(a: Planet, b: Planet) {
  return ENEMIES[a].includes(b);
}
function list(ps: Planet[]) {
  return ps.length <= 1 ? ps.join("") : `${ps.slice(0, -1).join(", ")} and ${ps[ps.length - 1]}`;
}

export function assessStrength(positions: PlanetPosition[]): PlanetStrength[] {
  const byPlanet = Object.fromEntries(positions.map((p) => [p.planet, p])) as Record<Planet, PlanetPosition>;
  const out: PlanetStrength[] = [];

  for (const planet of PLANETS) {
    const s = byPlanet[planet];
    if (!s) continue;
    const others = positions.filter((p) => p.planet !== planet);
    const at = (h: number) => others.filter((p) => houseFrom(s.signIndex, p.signIndex) === h).map((p) => p.planet);
    const conj = at(1);
    const second = at(2);
    const twelfth = at(12);
    const seventh = at(7);
    const trines = [...at(5), ...at(9)];
    const exchangeWith = others.find((o) => s.signLord === o.planet && o.signLord === planet)?.planet ?? null;
    const notes: string[] = [];

    // Winning / losing by degree among enemies in the same sign (Naik).
    const winningOver: Planet[] = [];
    const losingTo: Planet[] = [];
    for (const o of conj) {
      if (!isEnemy(planet, o) && !isEnemy(o, planet)) continue;
      if (s.degInSign > byPlanet[o].degInSign) winningOver.push(o);
      else losingTo.push(o);
    }
    if (winningOver.length) notes.push(`Leads ${list(winningOver)} by degree: winning planet`);
    if (losingTo.length) notes.push(`Behind ${list(losingTo)} by degree: yields to the enemy`);

    // Hemmed between neighbours in 2nd and 12th (Rao rule 4).
    let hemmed: PlanetStrength["hemmed"] = null;
    if (second.length && twelfth.length) {
      const all = [...second, ...twelfth];
      if (all.every((o) => isFriend(planet, o))) hemmed = "friends";
      else if (all.every((o) => isEnemy(planet, o))) hemmed = "enemies";
      else hemmed = "mixed";
      notes.push(hemmed === "friends" ? `Hemmed by friends ${list(all)}: significations flow freely` : hemmed === "enemies" ? `Hemmed by enemies ${list(all)}: significations obstructed` : `Flanked by ${list(all)}: mixed results`);
    }
    if (exchangeWith) notes.push(`Exchanges signs with ${exchangeWith}`);

    // Dignity cancellation (Rao rules 5 and 8; Naik on exchange and friendly neighbours).
    let effectiveDignity: Dignity = s.dignity;
    let dignityNote: string | null = null;
    if (!NODES.has(planet)) {
      const enemyNeighbours = [...conj, ...second, ...twelfth].filter((o) => isEnemy(planet, o));
      const friendNeighbours = [...conj, ...second, ...twelfth, ...seventh, ...trines].filter((o) => isFriend(planet, o));
      const anyDeliverer = conj.length + second.length + twelfth.length + seventh.length + trines.length > 0;
      if (s.dignity === "Exalted") {
        if (exchangeWith) {
          effectiveDignity = "Neutral";
          dignityNote = `Exaltation set aside by the exchange with ${exchangeWith}; results follow ${exchangeWith}`;
        } else if (enemyNeighbours.length) {
          effectiveDignity = "Neutral";
          dignityNote = `Exaltation blunted: enemy ${list(enemyNeighbours)} ${enemyNeighbours.length > 1 ? "sit" : "sits"} with or beside it (Rao rule 5)`;
        } else if (!anyDeliverer) {
          effectiveDignity = "Neutral";
          dignityNote = "Exalted but with no planet in its 2nd, 12th, 7th or trines to deliver the benefit (Rao rule 8)";
        }
      } else if (s.dignity === "Debilitated") {
        if (exchangeWith) {
          effectiveDignity = "Neutral";
          dignityNote = `Debilitation cancelled by the exchange with ${exchangeWith}; results follow ${exchangeWith}`;
        } else if (friendNeighbours.length) {
          effectiveDignity = "Neutral";
          dignityNote = `Debilitation softened: friend ${list(friendNeighbours)} ${friendNeighbours.length > 1 ? "support" : "supports"} it`;
        }
      }
      if (dignityNote) notes.push(dignityNote);
    }

    // Combustion (Naik: same pada; cancelled by friendly association, aspect or exchange).
    let combustNote: string | null = null;
    if (s.combust) {
      const friendsAround = [...conj, ...second, ...twelfth, ...seventh, ...trines].filter((o) => o !== "Sun" && isFriend(planet, o));
      const enemiesAround = [...conj, ...second, ...twelfth].filter((o) => o !== "Sun" && isEnemy(planet, o));
      if (exchangeWith && isFriend(planet, exchangeWith)) combustNote = `Combustion cancelled by the exchange with friend ${exchangeWith}`;
      else if (friendsAround.length) combustNote = `Combustion eased by friend ${list(friendsAround)}; the Sun's themes lead, and the planet's own results still come, in lesser degree`;
      notes.push(combustNote ?? (enemiesAround.length ? `Combust within the Sun's pada with enemy ${list(enemiesAround)} nearby: results much reduced` : "Combust within the Sun's pada: results come in lesser degree, coloured by the Sun"));
    }

    out.push({
      planet,
      dignity: s.dignity,
      effectiveDignity,
      dignityNote,
      combust: s.combust,
      combustNote,
      effectiveCombust: s.combust && !combustNote,
      winningOver,
      losingTo,
      exchangeWith,
      hemmed,
      notes,
    });
  }
  return out;
}

export function strengthSummary(st: PlanetStrength): string {
  const bits: string[] = [];
  if (st.effectiveDignity !== st.dignity) bits.push(`${st.dignity.toLowerCase()} (set aside)`);
  else if (st.dignity !== "—") bits.push(st.dignity.toLowerCase());
  if (st.effectiveCombust) bits.push("combust");
  if (st.winningOver.length) bits.push("winning");
  if (st.losingTo.length) bits.push("yielding");
  return bits.join(" · ");
}
