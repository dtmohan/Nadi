// Net effects of the houses, BPHS 28.13-20, combining bhava bala (27.26-31), the lord's Shadbala and
// Ishta/Kashta (ch. 27-28), the planets in and aspecting the house, the lord's dignity (28.7-10) and the
// Sarvashtakavarga rekhas of the sign (ch. 72). The verses name the ingredients and the direction of each
// adjustment but not a scale, so every step here is a stated reading and the whole is provisional.
import { norm360, type Planet, type PlanetPosition } from "./astro";
import { BPHS_URL } from "./parashari-data";
import type { AshtakavargaResult } from "./ashtakavarga";
import { SEVEN, sphutaDrishti, type BalaSource, type Seven, type ShadbalaResult } from "./shadbala";
import type { HouseView } from "./house-view";

export interface PhalaPart {
  label: string;
  subha: number;
  asubha: number;
  source: BalaSource;
}

export interface BhavaPhala {
  house: number;
  signIndex: number;
  lord: Seven;
  subha: number;
  asubha: number;
  net: number;
  /** Good share of the whole, 0 to 1. */
  share: number;
  verdict: "auspicious" | "inauspicious" | "even";
  parts: PhalaPart[];
}

export interface VargaPhala {
  planet: Seven;
  /** 28.13-14: the seven-varga subhanka and asubhanka scaled by the planet's Shadbala total over the 60-virupa unit. */
  subha: number;
  asubha: number;
}

const S = (ch: number, verse: string, provisional?: boolean): BalaSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });

export const PHALA_SOURCES = {
  varga: S(28, "13-14", true),
  base: S(28, "15", true),
  occupant: S(28, "16-17", true),
  aspect: S(28, "17", true),
  dignity: S(28, "18", true),
  ashtakavarga: S(28, "19-20", true),
};

export function computeVargaPhala(sb: ShadbalaResult): VargaPhala[] {
  return sb.planets.map((r) => {
    const ik = sb.ishta.find((x) => x.planet === r.planet)!;
    const unit = r.total / 60;
    return { planet: r.planet, subha: (ik.saptavargaSubha * unit) / 7, asubha: (ik.saptavargaAsubha * unit) / 7 };
  });
}

/**
 * 28.15-20 for the twelve houses. Benefic and malefic follow the same rule as Shadbala's Drik bala
 * (Jupiter, Venus, the waxing Moon, and Mercury without a malefic in its sign).
 */
export function computeBhavaPhala(positions: PlanetPosition[], sb: ShadbalaResult, av: AshtakavargaResult, view?: HouseView): BhavaPhala[] {
  const pos = (p: Planet) => positions.find((x) => x.planet === p)!;
  const sun = pos("Sun"), moon = pos("Moon");
  const waxing = norm360(moon.lon - sun.lon) < 180;
  const isBenefic = (p: Seven) => {
    if (p === "Jupiter" || p === "Venus") return true;
    if (p === "Moon") return waxing;
    if (p === "Mercury") return !positions.some((x) => x.signIndex === pos("Mercury").signIndex && ["Sun", "Mars", "Saturn", "Rahu", "Ketu"].includes(x.planet));
    return false;
  };
  const bala = (p: Seven) => sb.planets.find((r) => r.planet === p)!;
  const ik = (p: Seven) => sb.ishta.find((r) => r.planet === p)!;

  return sb.bhavas.map((b) => {
    const parts: PhalaPart[] = [];
    // Placement follows the selected house view: the sign the house is named after, its lord and its
    // occupants. Bhava bala (b.total) stays as measured on the equal cusps in the Shadbala pass; cusp
    // aspects stay on that same cusp — a stated approximation under Sripati, exact under equal.
    const house = b.house;
    const si = view ? view.signOfHouse(house) : b.signIndex;
    // SIGN_LORD holds only the seven classical lords (Parashara: the nodes own no house), so the cast is safe.
    const lord = (view ? view.lordOf(house) : b.lord) as Seven;
    const occupies = (q: Seven) => (view ? view.occupantsOf(house).some((p) => p.planet === q) : pos(q).signIndex === si);
    const L = bala(lord), LI = ik(lord);
    // 28.15: the effect is a combination of the bhava's and the lord's strength; the lord's Ishta and Kashta
    // split that combined strength into its auspicious and inauspicious shares.
    const combined = b.total + L.total;
    parts.push({ label: `Bhava bala ${b.total.toFixed(0)} and lord ${lord} ${L.total.toFixed(0)}, split by the lord's Ishta ${LI.ishta.toFixed(0)} / Kashta ${LI.kashta.toFixed(0)}`, subha: (combined * LI.ishta) / 60, asubha: (combined * LI.kashta) / 60, source: PHALA_SOURCES.base });
    // 28.16-17: a benefic in the house adds its Ishta to the good and takes it from the ill; a malefic the reverse with its Kashta.
    for (const q of SEVEN) {
      if (!occupies(q)) continue;
      const good = isBenefic(q), v = good ? ik(q).ishta : ik(q).kashta;
      parts.push({ label: `${q} in the house (${good ? "benefic" : "malefic"}), ${good ? "Ishta" : "Kashta"} ${v.toFixed(0)}`, subha: good ? v : -v, asubha: good ? -v : v, source: PHALA_SOURCES.occupant });
    }
    // 28.17 "similarly aspects": each aspect on the cusp, weighted by the aspecting planet's Ishta or Kashta share.
    for (const q of SEVEN) {
      if (occupies(q)) continue;
      const d = sphutaDrishti(q, b.cusp - pos(q).lon);
      if (d <= 0) continue;
      const good = isBenefic(q);
      const v = (d * (good ? ik(q).ishta : ik(q).kashta)) / 60;
      parts.push({ label: `${q} aspects the cusp (${d.toFixed(0)} of 60, ${good ? "benefic" : "malefic"})`, subha: good ? v : -v, asubha: good ? -v : v, source: PHALA_SOURCES.aspect });
    }
    // 28.18 with 28.10: the lord's rasi dignity, auspicious in the first five places, neutral in the sixth, ill in the last three.
    const rasi = L.sthana.saptavarga[0];
    if (rasi.subhanka >= 15) parts.push({ label: `Lord ${lord} in rasi: ${rasi.relation}, subhanka ${rasi.subhanka}`, subha: rasi.subhanka, asubha: -rasi.subhanka, source: PHALA_SOURCES.dignity });
    else if (rasi.subhanka <= 4) parts.push({ label: `Lord ${lord} in rasi: ${rasi.relation}, asubhanka ${60 - rasi.subhanka}`, subha: -(60 - rasi.subhanka), asubha: 60 - rasi.subhanka, source: PHALA_SOURCES.dignity });
    else parts.push({ label: `Lord ${lord} in a neutral sign: no dignity adjustment (28.10)`, subha: 0, asubha: 0, source: PHALA_SOURCES.dignity });
    // 28.19: Ashtakavarga rekhas of the sign added to the good, the dots (56 less the rekhas in the aggregate) taken.
    const rek = av.sarva[si], dots = 56 - rek;
    parts.push({ label: `Sarvashtakavarga ${rek} rekhas, ${dots} dots in the sign`, subha: rek - dots, asubha: dots - rek, source: PHALA_SOURCES.ashtakavarga });

    const subha = parts.reduce((a, p) => a + p.subha, 0);
    const asubha = parts.reduce((a, p) => a + p.asubha, 0);
    const net = subha - asubha;
    const share = subha + asubha > 0 ? subha / (subha + asubha) : 0.5;
    return { house: b.house, signIndex: si, lord, subha, asubha, net, share, verdict: share >= 0.6 ? "auspicious" : share <= 0.4 ? "inauspicious" : "even", parts };
  });
}

export const BHAVA_PHALA_CAVEATS = [
  "28.13-14 says the seven-varga figures are to be multiplied by the planet's Shadbala pinda; the auspicious and inauspicious strengths shown take the subhanka and asubhanka totals of 28.7-9, scale them by the Shadbala total over 60 and average across the seven vargas. The verse fixes no unit, so the figures are comparative only.",
  "28.15 reads the house effect as the sum of bhava bala and the lord's Shadbala, divided into good and ill by the lord's Ishta and Kashta. 28.16-17 adds a resident benefic's Ishta to the good side and takes it from the ill (the reverse with a malefic's Kashta); aspects on the cusp are weighted the same way. 28.18 uses the lord's rasi subhanka when auspicious and its asubhanka when the placement is one of the three ill ones (28.10). 28.19 adds the sign's Sarvashtakavarga rekhas and takes its dots. Each step is the direction the text gives; the amounts are a reading and the whole is provisional.",
  "The two-sign case of 28.20 does not arise, since the cusps here stay inside their whole-sign houses. A house is called auspicious when the good side holds three fifths or more of the whole, inauspicious at two fifths or less, and even between; the thresholds are not in the text.",
];
