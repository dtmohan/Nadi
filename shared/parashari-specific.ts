/**
 * Version 2 of the exploratory Parashari event check. This is an app-defined
 * six-point operationalisation of distinct cited methods, not a published
 * numerical formula. See docs/parashari-specific-v2-protocol.md.
 */
import { drishtiQuarters, EXALTATION, norm360, SIGN_LORD, SIGNS, type Planet, type PlanetPosition } from "./astro";
import { parashariPromiseCheck, type ParashariPromiseCheck } from "./parashari-promise";
import { vargaSignAt, type ParashariVargaEvidence } from "./parashari-varga-evidence";
import type { VargaKey } from "./vargas";

export interface SpecificFactor {
  id: string;
  label: string;
  matched: boolean;
  details: string[];
}

export interface ParashariSpecificCheck {
  version: 2;
  label: string;
  date: string;
  matter: "marriage" | "child" | "job";
  division: "D7" | "D9" | "D10";
  score: number;
  max: 6;
  factors: SpecificFactor[];
  d1Strain: string[];
  divisionStrain: string[];
}

const contact = (p: Planet, from: number, target: number) =>
  from === target || drishtiQuarters(p, from, target) >= 4;
const mutuallyConnected = (p: Planet, pSign: number, q: Planet, qSign: number) =>
  p === q || pSign === qSign || drishtiQuarters(p, pSign, qSign) >= 4 || drishtiQuarters(q, qSign, pSign) >= 4;
const inTrine = (from: number, target: number) => [0, 4, 8].includes((from - target + 12) % 12);

export function parashariSpecificCheck(
  evidence: ParashariVargaEvidence | undefined,
  outcome: "favourable" | "unfavourable" | "mixed" | undefined,
  natal: PlanetPosition[],
  sky: Array<Pick<PlanetPosition, "planet" | "signIndex">>,
  precomputedBase?: ParashariPromiseCheck,
): ParashariSpecificCheck | undefined {
  const base = precomputedBase ?? parashariPromiseCheck(evidence, outcome, natal, sky);
  if (!base || !evidence) return undefined;
  const byPlanet = new Map(natal.map((p) => [p.planet, p]));
  const skyByPlanet = new Map(sky.map((p) => [p.planet, p]));
  const natalOf = (p: Planet) => {
    const value = byPlanet.get(p);
    if (!value) throw new Error(`Missing natal ${p}`);
    return value;
  };
  const transitOf = (p: Planet) => {
    const value = skyByPlanet.get(p);
    if (!value) throw new Error(`Missing event-day ${p}`);
    return value;
  };
  const signAt = (p: Planet, division: VargaKey) => vargaSignAt(division, natalOf(p).lon);
  const lagna = evidence.rashi.lagnaSign;
  const house = evidence.rashi.house;
  const ascLord = SIGN_LORD[lagna];
  const matterLord = evidence.rashi.houseLord;
  const factors: SpecificFactor[] = [
    { id: "d1-support", label: "D1 partial house support", matched: base.factors[0], details: base.d1Support },
    { id: "division-support", label: `${evidence.division} partial house support`, matched: base.factors[1], details: base.divisionSupport },
  ];
  const dasa = evidence.periods[0].planet;
  const bhukti = evidence.periods[1].planet;
  const jupiter = transitOf("Jupiter");
  const saturn = transitOf("Saturn");
  const target = (sign: number, label: string) => ({ sign, label });
  const ascTargets = [target(lagna, "D1 ascendant"), target(natalOf(ascLord).signIndex, `D1 ascendant lord ${ascLord}`)];
  const matterTargets = [target(evidence.rashi.houseSign, `D1 house ${house}`), target(evidence.rashi.lordSign, `D1 house ${house} lord ${matterLord}`)];
  const sharedTargets = (targets: Array<{ sign: number; label: string }>) => targets
    .filter((t) => contact("Jupiter", jupiter.signIndex, t.sign) && contact("Saturn", saturn.signIndex, t.sign))
    .map((t) => `${t.label} (${SIGNS[t.sign]})`);

  if (base.matter === "marriage") {
    const links = (period: Planet, chart: "D1" | "D9") => {
      const frame = chart === "D1" ? evidence.rashi : evidence.varga;
      const periodSign = signAt(period, chart);
      const result: string[] = [];
      for (const [label, sign] of [["ascendant", frame.lagnaSign], ["house 7", frame.houseSign]] as const) {
        const lord = SIGN_LORD[sign];
        if (contact(period, periodSign, sign)) result.push(`${chart}: ${period} occupies or aspects ${label}`);
        if (mutuallyConnected(period, periodSign, lord, signAt(lord, chart))) result.push(`${chart}: ${period} connects to ${label} lord ${lord}`);
      }
      return result;
    };
    for (const [level, planet] of [["dasa", dasa], ["bhukti", bhukti]] as const) {
      const d1 = links(planet, "D1"), d9 = links(planet, "D9");
      factors.push({ id: level, label: `${level} lord links in both D1 and D9`, matched: d1.length > 0 && d9.length > 0,
        details: [`${planet}: ${d1.length ? d1.join("; ") : "no D1 link"}`, d9.length ? d9.join("; ") : "no D9 link"] });
    }
    const shared = sharedTargets([...ascTargets, ...matterTargets]);
    factors.push({ id: "double-transit", label: "Jupiter and Saturn share an ascendant or seventh target", matched: shared.length > 0, details: shared });
    const saham = Math.floor(norm360(natalOf(ascLord).lon + natalOf(matterLord).lon) / 30);
    const aspectsSaham = drishtiQuarters("Jupiter", jupiter.signIndex, saham) >= 4;
    factors.push({ id: "vivah-saham", label: "Jupiter aspects Vivah Saham sign", matched: aspectsSaham,
      details: [`Vivah Saham ${SIGNS[saham]}; transiting Jupiter ${SIGNS[jupiter.signIndex]}`] });
  } else if (base.matter === "child") {
    const seventhLord = SIGN_LORD[(lagna + 6) % 12];
    const possible = new Map<Planet, string[]>();
    const add = (p: Planet, why: string) => possible.set(p, [...(possible.get(p) ?? []), why]);
    add(ascLord, "D1 ascendant lord");
    add(seventhLord, "D1 seventh lord");
    add(matterLord, "D1 fifth lord");
    add("Jupiter", "Jupiter");
    for (const p of evidence.rashi.occupants) add(p, "occupies D1 fifth");
    for (const p of evidence.rashi.fullAspects) add(p, "aspects D1 fifth");
    for (const [level, planet] of [["dasa", dasa], ["bhukti", bhukti]] as const) {
      factors.push({ id: level, label: `${level} lord belongs to childbirth timing set`, matched: possible.has(planet),
        details: [`${planet}: ${(possible.get(planet) ?? ["no listed direct link"]).join(", ")}`] });
    }
    const fifthFromJupiter = SIGN_LORD[(natalOf("Jupiter").signIndex + 4) % 12];
    const rashiTarget = signAt(fifthFromJupiter, "D1"), navamsaTarget = signAt(fifthFromJupiter, "D9");
    factors.push({ id: "jupiter-trine", label: "Jupiter in a trine to the fifth-from-Jupiter lord", matched: inTrine(jupiter.signIndex, rashiTarget) || inTrine(jupiter.signIndex, navamsaTarget),
      details: [`${fifthFromJupiter}: D1 ${SIGNS[rashiTarget]}, D9 ${SIGNS[navamsaTarget]}; transiting Jupiter ${SIGNS[jupiter.signIndex]}`] });
    const transitAsc = transitOf(ascLord).signIndex, transitFifth = transitOf(matterLord).signIndex;
    const matches = [
      ...(transitAsc === evidence.rashi.houseSign ? ["natal fifth-house sign"] : []),
      ...(transitAsc === evidence.rashi.lordSign ? ["natal fifth-lord sign"] : []),
      ...(transitAsc === transitFifth ? [`transiting fifth lord ${matterLord}`] : []),
    ];
    factors.push({ id: "asc-lord-transit", label: "Transiting ascendant lord reaches a childbirth target", matched: matches.length > 0,
      details: [`${ascLord} in ${SIGNS[transitAsc]}${matches.length ? `: ${matches.join(", ")}` : ": no listed target"}`] });
  } else {
    const careerSet = new Map<Planet, string[]>();
    const add = (p: Planet, why: string) => careerSet.set(p, [...(careerSet.get(p) ?? []), why]);
    add(ascLord, "D1 ascendant lord");
    add(matterLord, "D1 tenth lord");
    for (const p of natal) if (EXALTATION[p.planet]?.sign === p.signIndex) add(p.planet, "exalted in D1");
    for (const [level, planet] of [["dasa", dasa], ["bhukti", bhukti]] as const) {
      factors.push({ id: level, label: `${level} lord belongs to the career timing subset`, matched: careerSet.has(planet),
        details: [`${planet}: ${(careerSet.get(planet) ?? ["no listed direct link"]).join(", ")}`] });
    }
    const asc = sharedTargets(ascTargets), career = sharedTargets(matterTargets);
    factors.push({ id: "double-transit", label: "Jupiter and Saturn share both ascendant and career targets", matched: asc.length > 0 && career.length > 0,
      details: [`Ascendant targets: ${asc.join(", ") || "none"}`, `Career targets: ${career.join(", ") || "none"}`] });
    const a = evidence.rashiLordInVarga, b = evidence.vargaLagnaLord;
    factors.push({ id: "d10-lords", label: "D1 tenth lord connects with the D10 ascendant lord", matched: mutuallyConnected(a.planet, a.sign, b.planet, b.sign),
      details: [`${a.planet} in ${SIGNS[a.sign]}; ${b.planet} in ${SIGNS[b.sign]} (D10)`] });
  }
  return { version: 2, label: base.label, date: base.date, matter: base.matter, division: base.division,
    factors, score: factors.filter((f) => f.matched).length, max: 6,
    d1Strain: base.d1Strain, divisionStrain: base.divisionStrain };
}
