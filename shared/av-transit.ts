// Ashtakavarga transit timeline for Saturn and Jupiter, BPHS chapters 66, 70 and 72.
//
// Each sign the planet passes is read three ways:
//   1. by the planet's own Ashtakavarga: transit through a sign marked with rekhas is favourable, through a sign
//      marked with dots unfavourable (66.70-72); for Saturn the same in 70.43-44 in terms of "more rekhas" and
//      "more dots". A sign holds eight marks in all, so more rekhas than dots means five or more.
//   2. by the Sarvashtakavarga band of the sign (72.3-5: a planet in a sign with a favourable count gives good
//      effects, in an adverse sign evil) and, for Jupiter's year (samvatsara), 72.29.
//   3. for Saturn, by the transit points of chapter 70: the nakshatra and the sign (with their trines) whose
//      transit brings distress in each matter. Nakshatra hits use Saturn's nakshatra ingresses from the server.
// Jupiter's year is also read by the Sun's Ashtakavarga (70.19-20). The verse speaks of the mean Jupiter; the
// ephemeris gives the true one, so that reading is marked provisional.
import { SIGNS, NAKSHATRAS, type TransitPeriod, type NakshatraPeriod } from "./astro";
import type { AshtakavargaResult, SaturnPoint } from "./ashtakavarga";
import type { BalaSource } from "./shadbala";
import { BPHS_URL } from "./parashari-data";

export type AvTone = "support" | "mixed" | "strain";

export interface AvHit {
  matter: string;
  /** Exact point or one of its trines. */
  kind: "sign" | "trine" | "nakshatra" | "trine nakshatra";
  source: BalaSource;
}

export interface AvTransitRow {
  planet: "Jupiter" | "Saturn";
  signIndex: number;
  /** Whole-sign house from the lagna. */
  house: number;
  start: string;
  end: string;
  retrogradeEntry: boolean;
  /** Age at entry, years. */
  age: number;
  current: boolean;
  /** The planet's own Ashtakavarga marks in the sign: which of the eight contributors gave a rekha. */
  ownRekhas: number;
  givers: string[];
  ownVerdict: "favourable" | "even" | "adverse";
  sarva: number;
  band: "favourable" | "medium" | "adverse";
  /** Jupiter only: the Sun's rekhas in the sign (70.19-20). */
  sunRekhas?: number;
  hits: AvHit[];
  tone: AvTone;
  notes: { text: string; source: BalaSource }[];
}

export interface AvNakshatraRow {
  nakshatraIndex: number;
  start: string;
  end: string;
  retrogradeEntry: boolean;
  age: number;
  current: boolean;
  hits: AvHit[];
}

export interface AvTimeline {
  saturn: AvTransitRow[];
  jupiter: AvTransitRow[];
  /** Saturn's nakshatra periods that touch a chapter-70 point or its trines. */
  saturnNakshatras: AvNakshatraRow[];
  /** Whether the nakshatra list was available (older saved results lack it until reopened). */
  hasNakshatras: boolean;
  /** 70.37-40: ages counted by Saturn's rekhas, with the dates they fall on. */
  distressYears: { label: string; age: number; date: string }[];
  sources: Record<string, BalaSource>;
  caveats: string[];
}

const S = (ch: number, verse: string, provisional?: boolean): BalaSource => ({ label: `Parashara ${ch}.${verse}`, url: BPHS_URL(ch), provisional });

export const AV_TRANSIT_SOURCES: Record<string, BalaSource> = {
  own: S(66, "70-72"),
  saturnOwn: S(70, "43-44"),
  sarva: S(72, "3-5"),
  samvatsara: S(72, "29"),
  sunYear: S(70, "19-20", true),
  distressYears: S(70, "37-40"),
  points: S(70, "7-42"),
};

export const AV_TRANSIT_CAVEATS = [
  "A sign carries eight marks, one from each of the seven planets and the lagna, so the own-chart reading of 66.70-72 is taken as favourable at five or more rekhas, adverse at three or fewer and even at four. The verse states the rule per contributor; the count is the stated reading of it.",
  "The overall tone joins the own-chart reading with the Sarvashtakavarga band: favourable on both counts reads supportive, adverse on both reads straining, and any other pair mixed. A chapter-70 point struck in the sign or nakshatra is shown beside the tone rather than folded into it.",
  "70.19-20 reads the year by the mean Jupiter's sign; the timeline uses the true Jupiter from the ephemeris, so the Sun-chart reading of Jupiter's years is marked provisional. Re-entries by retrograde motion are listed as separate periods.",
  "Nakshatra hits use the equal 13°20' nakshatras of the sidereal zodiac from Saturn's ingress dates computed at cast time. Saved results from before this feature show the nakshatra list only after the chart is reopened.",
  "72.29 speaks of the samvatsara, month and nakshatra of a sign with more than 30 rekhas; only the samvatsara (Jupiter's year in the sign) is applied here.",
];

const ageAt = (birthIso: string, iso: string) => (Date.parse(iso) - Date.parse(birthIso)) / (365.25 * 86400e3);

function ownVerdict(rekhas: number): AvTransitRow["ownVerdict"] {
  return rekhas >= 5 ? "favourable" : rekhas <= 3 ? "adverse" : "even";
}

function tone(own: AvTransitRow["ownVerdict"], band: AvTransitRow["band"]): AvTone {
  if (own === "favourable" && band === "favourable") return "support";
  if (own === "adverse" && band === "adverse") return "strain";
  return "mixed";
}

function signHits(points: SaturnPoint[], signIndex: number): AvHit[] {
  const hits: AvHit[] = [];
  for (const p of points) {
    if (p.transitSignIndex === signIndex) hits.push({ matter: p.matter, kind: "sign", source: p.source });
    else if (p.trineSigns.includes(signIndex)) hits.push({ matter: p.matter, kind: "trine", source: p.source });
  }
  return hits;
}

function nakshatraHits(points: SaturnPoint[], nakshatraIndex: number): AvHit[] {
  const hits: AvHit[] = [];
  for (const p of points) {
    if (p.nakshatraIndex === nakshatraIndex) hits.push({ matter: p.matter, kind: "nakshatra", source: p.source });
    else if (p.trineNakshatras.includes(nakshatraIndex)) hits.push({ matter: p.matter, kind: "trine nakshatra", source: p.source });
  }
  return hits;
}

export function computeAvTimeline(
  av: AshtakavargaResult,
  lagnaIdx: number,
  transits: TransitPeriod[],
  saturnNakshatras: NakshatraPeriod[] | undefined,
  birthIso: string,
  asOfIso: string,
): AvTimeline {
  const now = Date.parse(asOfIso);
  const chartOf = (owner: string) => av.charts.find((c) => c.owner === owner)!;
  const sunChart = chartOf("Sun");

  const rows = (planet: "Jupiter" | "Saturn"): AvTransitRow[] => {
    const own = chartOf(planet);
    return transits
      .filter((t) => t.planet === planet)
      .map((t) => {
        const s = t.signIndex;
        const rekhas = own.rekhas[s];
        const ov = ownVerdict(rekhas);
        const band = av.band[s];
        const hits = planet === "Saturn" ? signHits(av.saturnPoints, s) : [];
        const notes: AvTransitRow["notes"] = [];
        const ownSrc = planet === "Saturn" ? AV_TRANSIT_SOURCES.saturnOwn : AV_TRANSIT_SOURCES.own;
        const dots = 8 - rekhas;
        notes.push({
          text:
            ov === "favourable"
              ? `${SIGNS[s]} holds ${rekhas} rekhas against ${dots} dots in ${planet}'s own chart: a favourable passage.`
              : ov === "adverse"
                ? `${SIGNS[s]} holds only ${rekhas} rekhas against ${dots} dots in ${planet}'s own chart: an unfavourable passage.`
                : `${SIGNS[s]} holds four rekhas and four dots in ${planet}'s own chart: an even passage.`,
          source: ownSrc,
        });
        notes.push({
          text: `The sign carries ${av.sarva[s]} rekhas in the aggregate (${band}), the ${ordinal(((s - lagnaIdx + 12) % 12) + 1)} house.`,
          source: AV_TRANSIT_SOURCES.sarva,
        });
        let sunRekhas: number | undefined;
        if (planet === "Jupiter") {
          if (av.sarva[s] > 40) notes.push({ text: "More than 40 rekhas: a year of increase in wealth, property, children and repute.", source: AV_TRANSIT_SOURCES.samvatsara });
          else if (av.sarva[s] > 30) notes.push({ text: "More than 30 rekhas: a year of all-round increase in wealth, happiness from children and enjoyments.", source: AV_TRANSIT_SOURCES.samvatsara });
          sunRekhas = sunChart.rekhas[s];
          notes.push({
            text:
              sunRekhas >= 5
                ? `The Sun's chart gives ${SIGNS[s]} ${sunRekhas} rekhas: a year fit for auspicious undertakings.`
                : sunRekhas <= 3
                  ? `The Sun's chart gives ${SIGNS[s]} only ${sunRekhas} rekhas: no auspicious undertakings in this year.`
                  : `The Sun's chart gives ${SIGNS[s]} four rekhas: an even year for undertakings.`,
            source: AV_TRANSIT_SOURCES.sunYear,
          });
        }
        for (const h of hits) notes.push({ text: `${capital(h.matter)}: ${h.kind === "sign" ? "the sign" : "a trine of the sign"} marked for distress in this matter.`, source: h.source });
        return {
          planet,
          signIndex: s,
          house: ((s - lagnaIdx + 12) % 12) + 1,
          start: t.start,
          end: t.end,
          retrogradeEntry: t.retrogradeEntry,
          age: ageAt(birthIso, t.start),
          current: Date.parse(t.start) <= now && now < Date.parse(t.end),
          ownRekhas: rekhas,
          givers: own.givers[s],
          ownVerdict: ov,
          sarva: av.sarva[s],
          band,
          sunRekhas,
          hits,
          tone: tone(ov, band),
          notes,
        };
      });
  };

  const nak: AvNakshatraRow[] = (saturnNakshatras ?? [])
    .map((n) => ({
      nakshatraIndex: n.nakshatraIndex,
      start: n.start,
      end: n.end,
      retrogradeEntry: n.retrogradeEntry,
      age: ageAt(birthIso, n.start),
      current: Date.parse(n.start) <= now && now < Date.parse(n.end),
      hits: nakshatraHits(av.saturnPoints, n.nakshatraIndex),
    }))
    .filter((r) => r.hits.length > 0);

  const birth = new Date(birthIso);
  const dateAtAge = (y: number) => {
    const d = new Date(birth);
    d.setUTCFullYear(d.getUTCFullYear() + y);
    return d.toISOString();
  };
  const dy = av.distressYears;
  const distressYears = [
    { label: "rekhas from lagna to Saturn", age: dy.lagnaToSaturn, date: dateAtAge(dy.lagnaToSaturn) },
    { label: "rekhas from Saturn to lagna", age: dy.saturnToLagna, date: dateAtAge(dy.saturnToLagna) },
    { label: "their sum, grave if an arishta dasa also runs", age: dy.lagnaToSaturn + dy.saturnToLagna, date: dateAtAge(dy.lagnaToSaturn + dy.saturnToLagna) },
  ];

  return {
    saturn: rows("Saturn"),
    jupiter: rows("Jupiter"),
    saturnNakshatras: nak,
    hasNakshatras: !!saturnNakshatras,
    distressYears,
    sources: AV_TRANSIT_SOURCES,
    caveats: AV_TRANSIT_CAVEATS,
  };
}

export const nakshatraLabel = (i: number) => NAKSHATRAS[i];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
