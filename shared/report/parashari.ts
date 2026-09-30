// Parashara: houses, lords and yogas; the Vimshottari periods; and the tables of strength
// (Shadbala), divisions (vargas) and points (Ashtakavarga) that the Parashari tab shows.
import { SIGNS, SIGN_ABBR, PLANET_ABBR } from "../astro";
import {
  computeParashari,
  DEFAULT_ASPECT_FLOOR,
  type ParashariFinding,
  type ParashariResult,
} from "../parashari";
import { HOUSE_MATTERS, HOUSE_MATTERS_SOURCE } from "../parashari-houses";
import { LAGNA_NATURE, BPHS_URL } from "../parashari-data";
import { computeVargas, VARGAS, SCHEMES } from "../vargas";
import { AREA_ONSET, HOUSE_AREA } from "../life-stage";
import { GENTLE_NOTE } from "../gentle";
import {
  cap,
  endStop,
  fmtDate,
  list,
  ORD,
  type ReportContext,
  type ReportModule,
  type ReportPara,
  type ReportSection,
} from "./types";

function computeFor(ctx: ReportContext): ParashariResult {
  const { result, lifeAt, withheld } = ctx;
  // Read at the reading date, or at the recorded date of passing.
  return computeParashari(
    result.positions,
    result.jaimini.lagna.lon,
    result.utc,
    lifeAt,
    result.shadbala,
    result.dasaStarts,
    DEFAULT_ASPECT_FLOOR,
    withheld,
  );
}

function housesSection(
  ctx: ReportContext,
  par: ParashariResult,
): ReportSection {
  const { S, cites, inSeason, lagnaIdx } = ctx;
  const bp = (label: string, url: string, prov?: boolean) => ({
    n: cites.add(label, url),
    prov,
  });
  const cite = (f: {
    source: { label: string; url: string; provisional?: boolean };
  }) => bp(f.source.label, f.source.url, f.source.provisional);
  const nature = LAGNA_NATURE[lagnaIdx];
  const paras: ReportPara[] = [
    {
      kind: "lead",
      text: `Parashara reads from the rising sign. With ${SIGNS[lagnaIdx]} rising, ${list(nature.auspicious)} ${nature.auspicious.length === 1 ? "is" : "are"} auspicious and ${list(nature.malefic)} ${nature.malefic.length === 1 ? "is" : "are"} not${nature.yogakaraka.length ? `; ${list(nature.yogakaraka)} can give yoga alone, owning an angle and a trine` : ""}${nature.yogaPair ? `; ${nature.yogaPair[0]} and ${nature.yogaPair[1]} give the raja yoga only as a pair, the verse naming the two in the dual` : ""}. ${S(nature.note)}`,
      cites: [cites.add(`Parashara ${nature.verses}`, BPHS_URL(34))],
    },
  ];
  const houseNo = (f: ParashariFinding): number | undefined => {
    if (f.house) return f.house;
    const m = f.title.match(/(\d+)(?:st|nd|rd|th)/);
    return m ? Number(m[1]) : undefined;
  };
  const sub: ReportSection[] = [];
  for (const b of par.bhavas) {
    const area = HOUSE_AREA[b.house];
    if (area && !inSeason(area)) {
      sub.push({
        id: `house-${b.house}`,
        title: `The ${ORD(b.house)} house`,
        paras: [
          {
            kind: "note",
            text: S(
              `${cap(HOUSE_MATTERS[b.house - 1].matters)}. Held for later: read from age ${AREA_ONSET[area]}.`,
            ),
          },
        ],
      });
      continue;
    }
    const ps: ReportPara[] = [];
    const hm = HOUSE_MATTERS[b.house - 1];
    const occ = b.occupants.length
      ? `${list(b.occupants)} ${b.occupants.length === 1 ? "stands" : "stand"} in it`
      : "no planet stands in it";
    const asp = b.aspects.filter((a) => a.quarters >= 3).map((a) => a.planet);
    ps.push({
      kind: "p",
      text: S(
        `${cap(hm.matters)}. The ${ORD(b.house)} is ${b.sign}, ruled by ${b.lord}, which stands in the ${ORD(b.lordIn)}; ${occ}${asp.length ? `, and ${list(asp)} ${asp.length === 1 ? "aspects" : "aspect"} it` : ""}.`,
      ),
      cites: [cites.add(`Parashara ${hm.verse}`, HOUSE_MATTERS_SOURCE.url)],
    });
    const fs = par.findings.filter(
      (f) =>
        (f.kind === "lord" || f.kind === "house") && houseNo(f) === b.house,
    );
    for (const f of fs) {
      const c = cite(f);
      ps.push({
        kind: "p",
        text: S(endStop(f.text)),
        cites: [c.n],
        provisional: c.prov,
        tone: f.tone,
      });
    }
    const j = par.bhavaJudgement.find((x) => x.house === b.house);
    if (j && j.tone !== "none") {
      const c = cite(j);
      ps.push({
        kind: "p",
        text: S(
          `${j.support.length ? `Signs of the house prospering: ${list(j.support)}.` : ""} ${j.strain.length ? `Signs against it: ${list(j.strain)}.` : ""}`.trim(),
        ),
        cites: [c.n],
        provisional: c.prov,
        tone: j.tone,
      });
    }
    sub.push({
      id: `house-${b.house}`,
      title: `The ${ORD(b.house)} house`,
      paras: ps,
    });
  }
  const yogas = par.findings.filter((f) => f.kind === "yoga");
  if (yogas.length)
    sub.push({
      id: "yogas",
      title: "Yogas",
      paras: yogas.map((f) => {
        const c = cite(f);
        return {
          kind: "p" as const,
          text: S(`${f.title}: ${endStop(f.text)}`),
          cites: [c.n],
          provisional: c.prov,
          tone: f.tone,
        };
      }),
    });
  const strains = par.findings.filter(
    (f) => f.kind === "strain" || f.kind === "evil",
  );
  if (strains.length)
    sub.push({
      id: "strains",
      title: "Strains and their remedies in the chart",
      paras: [
        { kind: "note", text: GENTLE_NOTE },
        ...strains.map((f) => {
          const c = cite(f);
          return {
            kind: "p" as const,
            text: S(`${f.title}: ${endStop(f.text)}`),
            cites: [c.n],
            provisional: c.prov,
            tone: f.tone,
          };
        }),
      ],
    });
  return {
    id: "parashari",
    title: "Houses, lords and yogas",
    kicker: "Brihat Parashara Hora Sastra",
    paras,
    sub,
  };
}

function timingSection(
  ctx: ReportContext,
  par: ParashariResult,
): ReportSection {
  const { S, cites, deceased, age, pos } = ctx;
  const v = par.vimshottari;
  const cur = v.current;
  const paras: ReportPara[] = [
    {
      kind: "lead",
      text: `The Vimshottari dasa runs from the Moon's nakshatra, ${pos("Moon").nakshatra}, whose lord ${v.dasas[0].lord} opened the life with ${v.balanceYears.toFixed(1)} years remaining.${deceased ? "" : ` The running period is the ${cur.dasa.lord} dasa (${fmtDate(cur.dasa.start)} to ${fmtDate(cur.dasa.end)}), ${cur.bhukti.lord} bhukti (${fmtDate(cur.bhukti.start)} to ${fmtDate(cur.bhukti.end)}), ${cur.antara.lord} antara.`}`,
      cites: [cites.add("Parashara 46.12-14", BPHS_URL(46))],
    },
    {
      kind: "table",
      head: ["Dasa", "From", "To", "Ages", "Parashara's tone"],
      rows: par.dasaReadings
        .filter((d) => d.ageStart < (deceased ? age + 0.01 : 100))
        .map((d) => [
          `${d.lord}${d.current && !deceased ? " (running)" : ""}`,
          fmtDate(d.start),
          fmtDate(d.end),
          `${Math.floor(d.ageStart)}–${Math.floor(d.ageEnd)}`,
          d.verdict === "support"
            ? "favourable"
            : d.verdict === "strain"
              ? "trying"
              : "mixed",
        ]),
    },
  ];
  const sub: ReportSection[] = [];
  const shown = par.dasaReadings.filter(
    (d) => d.ageStart < (deceased ? age + 0.01 : 100),
  );
  for (const d of shown) {
    const ps: ReportPara[] = [];
    const gloss = par.dashas.find(
      (g) => g.lord === d.lord && g.start === d.start,
    );
    if (gloss) ps.push({ kind: "p", text: S(endStop(gloss.summary)) });
    const notes = d.notes.filter((n) => n.layer !== "condition").slice(0, 6);
    for (const n of notes)
      ps.push({
        kind: "p",
        text: S(endStop(n.text)),
        cites: [cites.add(n.source.label, n.source.url)],
        provisional: n.source.provisional,
        tone: n.tone,
      });
    ps.push({
      kind: "p",
      text: S(endStop(d.timing.text)),
      cites: [cites.add(d.timing.source.label, d.timing.source.url)],
      provisional: d.timing.source.provisional,
    });
    if (d.current && !deceased && d.antars.length) {
      ps.push({
        kind: "table",
        head: ["Bhukti", "From", "To", "Favourable when", "Trying when"],
        rows: d.antars.map((a) => [
          `${a.lord}${a.current ? " (running)" : ""}`,
          fmtDate(a.start),
          fmtDate(a.end),
          S(a.entry.favourable.conditions),
          S(a.entry.adverse.conditions),
        ]),
      });
      ps.push({
        kind: "note",
        text: `The bhukti rows give Parashara's conditions from chapters 52 to 60; the effects he lists for each follow in the Parashari tab. The maraka and remedy lines of those chapters are left out of this report.`,
        cites: [
          cites.add(
            `Parashara ch. ${d.antars[0].entry.ch}`,
            BPHS_URL(d.antars[0].entry.ch),
          ),
        ],
      });
    }
    sub.push({
      id: `dasa-${d.lord}-${d.ageStart}`,
      title: `${d.lord} dasa, ages ${Math.floor(d.ageStart)} to ${Math.floor(d.ageEnd)}${d.current && !deceased ? " (running)" : ""}`,
      paras: ps,
    });
  }
  return {
    id: "timing",
    title: "The periods of life",
    kicker: "Vimshottari dasa · Parashara ch. 46-48, 52-60",
    paras,
    sub,
  };
}

/** The data tables of the Parashari tab: Shadbala, the sixteen divisions, and Ashtakavarga. */
function tablesSection(
  ctx: ReportContext,
  par: ParashariResult,
): ReportSection {
  const { result, cites, lagnaIdx, withheld, S } = ctx;
  const sub: ReportSection[] = [];

  // Shadbala, ch. 27.
  const sb = par.shadbala;
  if (sb) {
    const src = (k: string) =>
      sb.sources[k]
        ? cites.add(sb.sources[k].label, sb.sources[k].url)
        : undefined;
    const c = [
      src("uchcha"),
      src("dig"),
      src("naisargika"),
      src("required"),
    ].filter((x): x is number => x !== undefined);
    const ps: ReportPara[] = [
      {
        kind: "p",
        text: `The six strengths of chapter 27 for the seven planets, in rupas (sixty shashtiamsas each), against the requirement of 27.32-33; a planet at or above its requirement is strong. The birth was ${sb.daytime ? "by day" : "by night"}${sb.twilight ? ", within a ghati of sunrise or sunset" : ""}; the lords of the year, month, day and hour are ${sb.lords.varsha}, ${sb.lords.masa}, ${sb.lords.dina} and ${sb.lords.hora}.`,
        cites: c,
      },
      {
        kind: "table",
        head: [
          "Planet",
          "Sthana",
          "Dig",
          "Kala",
          "Chesta",
          "Naisargika",
          "Drik",
          "Total",
          "Required",
          "Standing",
        ],
        rows: sb.planets.map((p) => [
          p.planet,
          p.sthana.total.toFixed(2),
          p.dig.toFixed(2),
          p.kala.total.toFixed(2),
          p.chesta.toFixed(2),
          p.naisargika.toFixed(2),
          p.drik.toFixed(2),
          p.total.toFixed(2),
          p.required.toFixed(2),
          p.strong
            ? `strong (${p.ratio.toFixed(2)})`
            : `weak (${p.ratio.toFixed(2)})`,
        ]),
      },
      {
        kind: "table",
        head: ["House", "Sign", "Lord's bala", "Dig", "Drishti", "Total"],
        rows: sb.bhavas.map((b) => [
          ORD(b.house),
          SIGNS[b.signIndex],
          b.lordBala.toFixed(2),
          b.dig.toFixed(2),
          b.drishti.toFixed(2),
          b.total.toFixed(2),
        ]),
      },
    ];
    for (const cv of sb.caveats.slice(0, 2))
      ps.push({ kind: "note", text: cv });
    sub.push({
      id: "shadbala",
      title: "Planetary strength (Shadbala)",
      paras: ps,
    });
  }

  // The sixteen divisions, ch. 6-7.
  const vg = computeVargas(result.positions, result.jaimini.lagna.lon);
  {
    const keys = VARGAS.map((v) => v.key);
    const ps: ReportPara[] = [
      {
        kind: "p",
        text: `The sign each planet occupies in the sixteen divisions of chapter 6, the lagna first. A planet in the same sign in the rasi and the navamsa is marked vargottama. The Vimsopaka totals weigh the divisions by the four schemes of chapter 7; the designations of 6.42-53 count the good vargas.`,
        cites: [
          cites.add(vg.sources.divisions.label, vg.sources.divisions.url),
          cites.add(vg.sources.vimsopaka.label, vg.sources.vimsopaka.url),
          cites.add(
            vg.sources.classification.label,
            vg.sources.classification.url,
          ),
        ],
      },
      {
        kind: "table",
        head: ["", ...keys],
        rows: [
          ["Lagna", ...keys.map((k) => SIGN_ABBR[vg.lagna[k]])],
          ...vg.planets.map((p) => [
            `${PLANET_ABBR[p.planet]}${p.vargottama ? " (V)" : ""}`,
            ...keys.map((k) => SIGN_ABBR[p.signs[k]]),
          ]),
        ],
      },
      {
        kind: "table",
        head: [
          "Planet",
          ...SCHEMES.map((s) => `${s.name} (of 20)`),
          "Designation",
        ],
        rows: vg.planets
          .filter((p) => p.vimsopaka)
          .map((p) => [
            p.planet,
            ...SCHEMES.map((s) => {
              const sc = p.vimsopaka!.find((x) => x.scheme === s.key);
              return sc ? `${sc.total.toFixed(1)} ${sc.band}` : "—";
            }),
            p.designation
              ? Object.values(p.designation)
                  .map((d) => d.name)
                  .filter(Boolean)
                  .join(", ") || "—"
              : "—",
          ]),
      },
    ];
    for (const cv of vg.caveats.slice(0, 1))
      ps.push({ kind: "note", text: cv, provisional: true });
    sub.push({
      id: "vargas",
      title: "The sixteen divisions (vargas)",
      paras: ps,
    });
  }

  // Ashtakavarga, ch. 66-72.
  const av = par.ashtakavarga;
  {
    const src = (k: string) =>
      av.sources[k]
        ? cites.add(av.sources[k].label, av.sources[k].url)
        : undefined;
    const c = [src("rekhas"), src("sarva"), src("bands")].filter(
      (x): x is number => x !== undefined,
    );
    const ps: ReportPara[] = [
      {
        kind: "p",
        text: `Each of the seven planets and the lagna gives a point (rekha) to the signs the text names from each contributor; the Sarvashtakavarga sums the seven planets' charts, 337 points in all, and 72.3-6 reads a sign above 28 as favourable and below 25 as adverse. The rows below run from ${SIGNS[lagnaIdx]}, the rising sign, as the first house.`,
        cites: c,
      },
      {
        kind: "table",
        head: [
          "House",
          "Sign",
          ...av.charts.map(
            (ch) =>
              PLANET_ABBR[ch.owner as keyof typeof PLANET_ABBR] ??
              String(ch.owner),
          ),
          "Sarva",
          "Band",
        ],
        rows: av.houses.map((h) => [
          ORD(h.house),
          SIGNS[h.signIndex],
          ...av.charts.map((ch) => String(ch.rekhas[h.signIndex])),
          String(av.sarva[h.signIndex]),
          h.band,
        ]),
      },
      {
        kind: "p",
        text: S(av.wealthYoga.text),
        cites: [src("wealth")].filter((x): x is number => x !== undefined),
      },
      {
        kind: "p",
        text: S(av.progeny.text),
        cites: [src("progeny")].filter((x): x is number => x !== undefined),
      },
    ];
    if (withheld)
      ps.push({
        kind: "note",
        text: "The years of distress and the rekha longevity of chapters 70-71 are not shown for a native under 18.",
      });
    sub.push({
      id: "ashtakavarga",
      title: "The points tables (Ashtakavarga)",
      paras: ps,
    });
  }

  return {
    id: "parashari-tables",
    title: "Parashara's tables",
    kicker: "Strength, divisions and points · Parashara ch. 6-7, 27, 66-72",
    paras: [
      {
        kind: "note",
        text: "The figures the Parashari tab computes, set down for the record. They are inputs to the readings above rather than readings in themselves.",
      },
    ],
    sub,
  };
}

export const parashariModule: ReportModule = {
  id: "parashari",
  label: "Parashari: houses, periods and tables",
  short: "Parashari",
  tab: "parashari",
  build(ctx) {
    const par = computeFor(ctx);
    return [
      housesSection(ctx, par),
      timingSection(ctx, par),
      tablesSection(ctx, par),
    ];
  },
};
