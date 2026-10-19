// Parashara: houses, lords and yogas; the Vimshottari periods; and the tables of strength
// (Shadbala), divisions (vargas) and points (Ashtakavarga) that the Parashari tab shows.
import { SIGNS, SIGN_ABBR, PLANET_ABBR } from "../astro";
import {
  computeParashari,
  DEFAULT_ASPECT_FLOOR,
  type ParashariResult,
} from "../parashari";
import { HOUSE_MATTERS } from "../parashari-houses";
import { HOUSE_PROSE_NOTE, HOUSE_PROSE_NOTE_PLAIN } from "../parashari-house-prose";
import { TOPIC_PERIODS_NOTE, TOPIC_PERIODS_NOTE_PLAIN, topicPeriods } from "../parashari-topic-periods";
import { HOUSE_AREAS_PLAIN } from "../house-gloss";
import { LAGNA_NATURE, BPHS_URL } from "../parashari-data";
import { leanWithCounts, type DasaLean } from "../parashari-dasa";
import { computeVargas, VARGAS, SCHEMES } from "../vargas";
import { normaliseParashariHouseMethod } from "../schema";
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
    normaliseParashariHouseMethod(result.chart.parashariHouseMethod),
  );
}

/** The period's lean with the counts of its favourable and trying lines (parashari-dasa.ts leanOf). */
function dasaTone(d: { lean: DasaLean }): string {
  return leanWithCounts(d.lean);
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
  // The house-by-house reading (shared/parashari-house-prose.ts): the same parts, in the same order, as
  // the Houses chapter on screen. The plain parts are already in the second person and softened.
  paras.push({ kind: "note", text: ctx.plain ? HOUSE_PROSE_NOTE_PLAIN : HOUSE_PROSE_NOTE });
  const sub: ReportSection[] = [];
  for (const hp of par.houseProse ?? []) {
    const h = hp.house;
    const title = ctx.plain ? `Your ${ORD(h)} house` : `The ${ORD(h)} house`;
    const area = HOUSE_AREA[h];
    if (area && !inSeason(area)) {
      sub.push({
        id: `house-${h}`,
        title,
        paras: [
          {
            kind: "note",
            text: S(
              ctx.plain
                ? `Your ${ORD(h)} house covers ${HOUSE_AREAS_PLAIN[h]}. Held for later: read from age ${AREA_ONSET[area]}.`
                : `${cap(HOUSE_MATTERS[h - 1].matters)}. Held for later: read from age ${AREA_ONSET[area]}.`,
            ),
          },
        ],
      });
      continue;
    }
    const ps: ReportPara[] = hp.parts.map((part) => {
      const prov = part.sources.some((x) => x.provisional);
      return {
        kind: part.key === "both" ? ("note" as const) : ("p" as const),
        text: S(endStop(ctx.plain ? part.textPlain : part.text)),
        cites: part.sources.map((x) => cites.add(x.label, x.url)),
        ...(prov ? { provisional: true } : {}),
        ...(part.tone ? { tone: part.tone } : {}),
      };
    });
    sub.push({ id: `house-${h}`, title, paras: ps });
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
          text: S(`${f.title}: ${endStop(ctx.plain && f.plain ? f.plain : f.text)}`),
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
            text: S(`${f.title}: ${endStop(ctx.plain && f.plain ? f.plain : f.text)}`),
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
          dasaTone(d),
        ]),
    },
  ];
  paras.push({
    kind: "note",
    text: ctx.plain
      ? "Each period's tone weighs the text's lines that favour it against those that go against it. It reads favourable or trying when one side outnumbers the other three to one or more, leans that way at three to two or more, and is balanced in between. This counting is the app's own way of reading which side is stronger, and is provisional; the counts are of the lines, not their weight."
      : "Tone: the lean of the period's lines from chapters 47 to 50 with the strength and Ashtakavarga lines (ch. 7, 27-28, 66.70-72, 72.3-6). Parashara judges a period by which side predominates (28.1, 28.11-12). Favourable or trying at three to one or more, leaning at three to two or more, balanced in between; fewer than three decisive lines can lean but not decide. Counting lines rather than weighing them, and both ratios, are app conventions (provisional).",
    cites: [
      cites.add("Parashara 28.1, 28.11-12", BPHS_URL(28)),
      cites.add("Parashara 47-48", BPHS_URL(47)),
    ],
    provisional: true,
  });
  // Periods by topic (shared/parashari-topic-periods.ts): first, as the question a reader asks; then the
  // periods in date order.
  const topics = topicPeriods(par, { birthIso: ctx.result.utc, asOfIso: ctx.lifeAt, deceased });
  const sub: ReportSection[] = [
    {
      id: "periods-by-topic",
      title: ctx.plain ? "Good periods by topic" : "Periods by topic",
      paras: [
        {
          kind: "note",
          text: ctx.plain ? TOPIC_PERIODS_NOTE_PLAIN : TOPIC_PERIODS_NOTE,
          cites: [cites.add("Parashara 48.1-8", BPHS_URL(48))],
          provisional: true,
        },
      ],
      sub: topics.map((t) => ({
        id: `topic-${t.topic}`,
        title: ctx.plain ? t.labelPlain : t.label,
        paras: t.periods.length
          ? t.periods.map(
              (p): ReportPara => ({
                kind: "p",
                text: S(ctx.plain ? p.textPlain : p.text),
                cites: p.sources.map((x) => cites.add(x.label, x.url)),
                provisional: true,
                tone: p.tone,
              }),
            )
          : [{ kind: "note" as const, text: S(ctx.plain ? t.summaryPlain : t.summary) }],
      })),
    },
  ];
  const shown = par.dasaReadings.filter(
    (d) => d.ageStart < (deceased ? age + 0.01 : 100),
  );
  for (const d of shown) {
    const ps: ReportPara[] = [];
    const gloss = par.dashas.find(
      (g) => g.lord === d.lord && g.start === d.start,
    );
    if (gloss) ps.push({ kind: "p", text: S(endStop(ctx.plain ? gloss.plain : gloss.summary)) });
    const notes = d.notes.filter((n) => n.layer !== "condition").slice(0, 6);
    for (const n of notes)
      ps.push({
        kind: "p",
        text: S(endStop(n.detail && !ctx.plain ? `${n.text} ${n.detail}` : n.text)),
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
  const vg = computeVargas(result.positions, result.jaimini.lagna.lon, par.vargaExclusions);
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
    appendix: true,
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
