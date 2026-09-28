// The prose report: one document that walks the chart in reading order, built from what the
// app already computes. Every statement keeps its source as a numbered note and every rule the
// texts do not state as applied keeps its provisional mark. Nothing here is computed afresh;
// the sections call the same shared functions the tabs use.
import { DateTime } from "luxon";
import { SUNRISE_DEFINITIONS, type ChartResult } from "@shared/schema";
import {
  fmtDeg,
  houseFrom,
  SIGNS,
  type Planet,
  type PlanetPosition,
} from "@shared/astro";
import { displayLocal } from "@shared/time-basis";
import {
  LIFE_AREAS,
  RELATION_LABEL,
  type Finding,
  type LifeArea,
} from "@shared/rules";
import { synthesize, AREA_TONE_LABEL } from "@shared/synthesis";
import { nextMarriageWindow } from "@shared/marriage";
import { nextChildWindow } from "@shared/children";
import {
  ageYears,
  areaSeason,
  lifeAsOf,
  sensitiveGate,
  AREA_ONSET,
  HOUSE_AREA,
  SENSITIVE_WITHHELD_NOTE,
  redactProse,
} from "@shared/life-stage";
import { soften, GENTLE_NOTE } from "@shared/gentle";
import { PANCHANGA_SOURCES } from "@shared/panchanga";
import {
  computeParashari,
  DEFAULT_ASPECT_FLOOR,
  type ParashariFinding,
} from "@shared/parashari";
import { HOUSE_MATTERS, HOUSE_MATTERS_SOURCE } from "@shared/parashari-houses";
import { LAGNA_NATURE, BPHS_URL } from "@shared/parashari-data";
import { CHARA_KARAKA_INFO } from "@shared/jaimini";
import { readAreas } from "@shared/jaimini-areas";
import { computeKp } from "@shared/kp";

export interface ReportCite {
  n: number;
  label: string;
  url?: string;
}

export interface ReportPara {
  kind: "p" | "note" | "table" | "lead";
  text?: string;
  cites?: number[];
  provisional?: boolean;
  tone?: "support" | "strain" | "mixed";
  /** Small grey line under the paragraph: evidence, relation, dates. */
  aside?: string;
  head?: string[];
  rows?: string[][];
}

export interface ReportSection {
  id: string;
  title: string;
  /** Small label above the title naming the system and its sources. */
  kicker?: string;
  paras: ReportPara[];
  sub?: ReportSection[];
}

export interface ReportDoc {
  title: string;
  subtitle: string;
  meta: string[];
  generated: string;
  plain: boolean;
  sections: ReportSection[];
  cites: ReportCite[];
}

const ORD = (n: number) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const fmtDate = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");
const fmtMonth = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
const list = (xs: string[]) =>
  xs.length <= 1
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const endStop = (s: string) =>
  /[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`;

class Cites {
  list: ReportCite[] = [];
  private key = new Map<string, number>();
  add(label: string, url?: string): number {
    const k = `${label}|${url ?? ""}`;
    const had = this.key.get(k);
    if (had) return had;
    const n = this.list.length + 1;
    this.list.push({ n, label, url });
    this.key.set(k, n);
    return n;
  }
}

export function buildReport(
  result: ChartResult,
  opts: { plain: boolean },
): ReportDoc {
  const { chart, positions, reading, transits, now } = result;
  const plain = opts.plain;
  const S = (t: string) => (plain ? soften(t) : t);
  const cites = new Cites();
  const asOf = now.asOf;
  const lifeAt = lifeAsOf(chart, asOf);
  const deceased = lifeAt !== asOf;
  const age = ageYears(result.utc, lifeAt);
  const withheld =
    result.sensitive?.withheld ??
    sensitiveGate(chart, result.utc, asOf).withheld;
  const inSeason = (area: string) =>
    areaSeason(area, result.utc, lifeAt).inSeason;
  const female = reading.roles.gender === "female";
  const pos = (p: Planet) => positions.find((x) => x.planet === p)!;
  const lagnaIdx = result.jaimini.lagna.signIndex;
  const birthLocal = displayLocal(result.utc, result.timeBasis, chart.timezone);

  const sections: ReportSection[] = [];

  // ── 1. The chart ──
  {
    const moon = pos("Moon");
    const paras: ReportPara[] = [];
    paras.push({
      kind: "lead",
      text: `${chart.name} was born on ${birthLocal.toFormat("cccc d LLLL yyyy")} at ${birthLocal.toFormat("HH:mm")} in ${chart.place}, with ${SIGNS[lagnaIdx]} rising at ${fmtDeg(result.jaimini.lagna.lon)} and the Moon in ${moon.nakshatra}, pada ${moon.pada}, in ${moon.sign}. The clock used is ${result.timeBasis.label}; the sidereal positions follow the ${chart.ayanamsa} ayanamsa (${result.ayanamsaValue.toFixed(3)}°) with the ${chart.nodeType} node.${deceased ? ` A date of passing is recorded (${fmtDate(chart.deathDate!)}); the ages in this report stop there and nothing here is a forecast.` : ` The native is ${Math.floor(age)} at the time of writing.`}`,
    });
    paras.push({
      kind: "table",
      head: ["Planet", "Sign", "Degree", "Nakshatra", "Notes"],
      rows: positions.map((p) => [
        p.planet,
        p.sign,
        fmtDeg(p.lon),
        `${p.nakshatra} ${p.pada}`,
        [
          p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu"
            ? "retrograde"
            : "",
          p.combust ? "combust" : "",
          p.dignity !== "Neutral" && p.dignity !== "—"
            ? p.dignity.toLowerCase()
            : "",
        ]
          .filter(Boolean)
          .join(", "),
      ]),
    });
    sections.push({ id: "chart", title: "The chart", paras });
  }

  // ── 2. The day of birth ──
  if (result.panchanga) {
    const p = result.panchanga;
    const src = (k: keyof typeof PANCHANGA_SOURCES) =>
      cites.add(
        `Surya Siddhanta ${PANCHANGA_SOURCES[k].label.replace(/^Surya Siddhanta\s*/, "")}`,
        PANCHANGA_SOURCES[k].url,
      );
    const rise = displayLocal(
      p.sunrise,
      result.timeBasis,
      chart.timezone,
    ).toFormat("HH:mm");
    const set = displayLocal(
      p.sunset,
      result.timeBasis,
      chart.timezone,
    ).toFormat("HH:mm");
    sections.push({
      id: "day",
      title: "The day of birth",
      kicker: "Panchanga · Surya Siddhanta",
      paras: [
        {
          kind: "p",
          text: `The birth fell on a ${p.vara.name}, the day of ${p.vara.lord}, counted from the sunrise at ${rise} (sunset ${set}; sunrise taken as the ${(SUNRISE_DEFINITIONS.find((d) => d.id === (p.sunriseDef ?? "edge"))?.label ?? "upper limb, with refraction").toLowerCase()}). The Moon stood ${Math.round(p.tithi.elapsed * 100)}% through ${p.tithi.name} of the ${p.tithi.paksha === "Shukla" ? "bright" : "dark"} fortnight, in ${p.nakshatra.name} (pada ${p.nakshatra.pada}, lord ${p.nakshatra.lord}); the yoga was ${p.yoga.name} and the karana ${p.karana.name}.`,
          cites: [
            src("day"),
            src("tithi"),
            src("nakshatra"),
            src("yoga"),
            src("karana"),
          ],
        },
        {
          kind: "note",
          text: "These are the five limbs of the day as the Surya Siddhanta defines them. The texts this report cites do not read character or fortune from the weekday, tithi, yoga or karana of birth, so no such reading is given here.",
        },
      ],
    });
  }

  // ── 3. The Nadi reading ──
  {
    const roles = reading.roles;
    const areas = synthesize(reading, roles.gender);
    const rao = (s?: string) => cites.add(s ?? "R.G. Rao, Bhrigu Nandi Nadi");
    const relOf = (f: Finding) => {
      if (f.planets.length === 2) {
        if (f.relation && f.relation !== "conjunct")
          return `${f.planets[1]} ${RELATION_LABEL[f.relation]}${f.viaRetro ? ", via retrogression" : ""}`;
        return undefined;
      }
      const [subject, ...rest] = f.planets;
      const apart = rest
        .map((pl) => ({
          pl,
          r: reading.relations.find(
            (x) => x.subject === subject && x.object === pl,
          ),
        }))
        .filter((x) => x.r && x.r.relation !== "conjunct")
        .map((x) => `${x.pl} ${RELATION_LABEL[x.r!.relation]}`);
      return apart.length ? apart.join(", ") : undefined;
    };
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Bhrigu Nandi Nadi reads no houses. Jupiter is the Jeeva, the life itself${female ? ", and in a woman's chart Venus is the Deha, her person" : ""}; Saturn is the Karma, the work; the other planets are read by where they stand from these two, in the same sign, in trine, in the seventh, or in the signs before and behind. ${roles.spouse} stands for the ${female ? "husband" : "wife"}.`,
        cites: [
          rao(),
          cites.add("S. Naik, Prediction Secrets: Naadi Astrology"),
        ],
      },
      { kind: "p", text: S(reading.jeeva.summary) },
      { kind: "p", text: S(reading.karma.summary) },
    ];
    if (reading.deha) paras.push({ kind: "p", text: S(reading.deha.summary) });

    const sub: ReportSection[] = [];
    const deferred: string[] = [];
    for (const a of areas) {
      if (!inSeason(a.area)) {
        deferred.push(
          `${LIFE_AREAS[a.area].label.toLowerCase()} (from age ${AREA_ONSET[a.area]})`,
        );
        continue;
      }
      const ps: ReportPara[] = [
        {
          kind: "p",
          text: S(a.headline),
          tone:
            a.tone === "supportive"
              ? "support"
              : a.tone === "care"
                ? "strain"
                : "mixed",
          aside: AREA_TONE_LABEL[a.tone],
        },
      ];
      if (a.reconciliation) ps.push({ kind: "p", text: S(a.reconciliation) });
      for (const f of a.key) {
        ps.push({
          kind: "p",
          text: S(endStop(f.text)),
          cites: [rao(f.source)],
          aside:
            [relOf(f), f.modifier].filter(Boolean).join(" · ") || undefined,
          provisional: /provisional/i.test(f.text),
        });
      }
      if (a.area === "marriage") {
        const m = reading.marriage;
        const win = nextMarriageWindow(m, transits, asOf.slice(0, 10));
        ps.push({
          kind: "p",
          text: S(
            m.notes.join(" ").trim() ||
              "The headline above is the whole of what the karakas say; no further note applies.",
          ),
          cites: [rao()],
          aside: `Jupiter over ${m.spouseSign} or its trines brings the matter forward${win && !deceased ? `; next: Jupiter ${win.kind === "over" ? "over" : "in trine from"} ${win.period.sign}, ${fmtMonth(win.period.start)} to ${fmtMonth(win.period.end)}` : ""}.`,
        });
      }
      if (a.area === "children") {
        const c = reading.children;
        const win = nextChildWindow(c, transits, asOf.slice(0, 10), result.utc);
        const counted = c.inFifth.length + c.aspectingFifth.length;
        ps.push({
          kind: "p",
          text: S(
            `${c.notes.join(" ")}${counted ? ` The count from the fifth sign from Jupiter gives ${counted} planet${counted === 1 ? "" : "s"}, an upper bound rather than a promise.` : ""}`.trim() ||
              "The headline above is the whole of what the karaka says; no further note applies.",
          ),
          cites: [rao()],
          aside:
            win && !deceased
              ? `Next: Jupiter ${win.kind === "return" ? "returns to" : win.kind === "fifth" ? "over the fifth," : "in trine,"} ${win.period.sign}, ${fmtMonth(win.period.start)} to ${fmtMonth(win.period.end)}.`
              : undefined,
        });
      }
      sub.push({
        id: `bnn-${a.area}`,
        title: LIFE_AREAS[a.area].label,
        paras: ps,
      });
    }
    if (deferred.length)
      paras.push({
        kind: "note",
        text: `Held for later at this age: ${list(deferred)}. The combinations exist in the chart; they are read when the matter comes into season.`,
      });
    sections.push({
      id: "bnn",
      title: "The Nadi reading",
      kicker: "Bhrigu Nandi Nadi · Rao, Naik",
      paras,
      sub,
    });
  }

  // ── 4. Houses and their lords (Parashara) ──
  const par = computeParashari(
    positions,
    result.jaimini.lagna.lon,
    result.utc,
    asOf,
    result.shadbala,
    result.dasaStarts,
    DEFAULT_ASPECT_FLOOR,
    withheld,
  );
  {
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
        text: `Parashara reads from the rising sign. With ${SIGNS[lagnaIdx]} rising, ${list(nature.auspicious)} ${nature.auspicious.length === 1 ? "is" : "are"} auspicious and ${list(nature.malefic)} ${nature.malefic.length === 1 ? "is" : "are"} not${nature.yogakaraka.length ? `; ${list(nature.yogakaraka)} can give yoga` : ""}. ${S(nature.note)}`,
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
    sections.push({
      id: "parashari",
      title: "Houses, lords and yogas",
      kicker: "Brihat Parashara Hora Sastra",
      paras,
      sub,
    });
  }

  // ── 5. Periods (Vimshottari) ──
  {
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
    sections.push({
      id: "timing",
      title: "The periods of life",
      kicker: "Vimshottari dasa · Parashara ch. 46-48, 52-60",
      paras,
      sub,
    });
  }

  // ── 6. Jaimini ──
  {
    const j = result.jaimini;
    const ak = j.karakas[0];
    const kar = (id: string) => j.karakas.find((k) => k.karaka === id);
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Jaimini ranks the planets by their degrees. ${ak.planet} is the Atmakaraka, the self; ${list(
          j.karakas
            .slice(1)
            .map((k) => `${k.planet} the ${CHARA_KARAKA_INFO[k.karaka].name}`),
        )}. The Karakamsa, ${ak.planet}'s navamsa sign, is ${j.karakamsa.sign}; the Arudha Lagna is ${j.arudhas[0].sign} and the Upapada ${j.arudhas[11].sign}.`,
        cites: [
          cites.add(
            "Jaimini Sutras 1.1",
            "https://www.wisdomlib.org/hinduism/book/jaimini-sutras",
          ),
        ],
      },
    ];
    const md = j.charaDasha.periods.find(
      (p) => p.start <= lifeAt && lifeAt < p.end,
    );
    if (md) {
      const ad = md.antardashas.find(
        (a) => a.start <= lifeAt && lifeAt < a.end,
      );
      const next = j.charaDasha.periods
        .filter((p) => p.start > lifeAt)
        .slice(0, 3);
      paras.push({
        kind: "p",
        text: `${deceased ? "At the date of passing the" : "The"} Chara dasha ${deceased ? "was" : "is"} ${md.signName} (${fmtDate(md.start)} to ${fmtDate(md.end)}, ${md.years} years)${ad ? `, ${ad.signName} antardasha` : ""}.${next.length && !deceased ? ` Next come ${list(next.map((p) => `${p.signName} (${fmtMonth(p.start)} to ${fmtMonth(p.end)})`))}.` : ""}`,
        aside:
          "Chara dasha by K.N. Rao's method: forward when the ninth from the lagna is a savya sign, twelve equal antardashas.",
      });
    }
    const sub: ReportSection[] = [];
    const areas = readAreas(j, positions, withheld);
    const held: string[] = [];
    for (const a of areas) {
      if (a.area !== "children" && !inSeason(a.area)) {
        held.push(a.label.toLowerCase());
        continue;
      }
      const fs = a.findingIds
        .map((id) => j.findings.find((f) => f.id === id))
        .filter(Boolean) as typeof j.findings;
      if (!fs.length && !a.blurb) continue;
      const ps: ReportPara[] = [
        {
          kind: "p",
          text: S(endStop(a.blurb)),
          aside:
            a.balance > 0
              ? "leans supportive"
              : a.balance < 0
                ? "leans strained"
                : "balanced",
        },
      ];
      for (const f of fs)
        ps.push({
          kind: "p",
          text: S(endStop(f.text)),
          cites: [
            cites.add(
              f.source.sutra
                ? `${f.source.label} ${f.source.sutra}`
                : f.source.label,
              f.source.url,
            ),
          ],
          aside: f.chart === "navamsa" ? "read in the navamsa" : undefined,
        });
      sub.push({ id: `jaimini-${a.area}`, title: a.label, paras: ps });
    }
    if (held.length)
      paras.push({
        kind: "note",
        text: `Held for later at this age: ${list(held)}.`,
      });
    sections.push({
      id: "jaimini",
      title: "The Jaimini reading",
      kicker: "Jaimini Sutras · K.N. Rao's Chara dasha",
      paras,
      sub,
    });
  }

  // ── 7. KP ──
  {
    const kp = computeKp(result.kp, result.utc, asOf, false, withheld);
    const lagna = kp.cusps[0];
    const paras: ReportPara[] = [
      {
        kind: "lead",
        text: `Krishnamurti Paddhati divides each nakshatra into nine subs and judges a house by the sub lord of its cusp. The lagna cusp at ${fmtDeg(lagna.lon)} ${lagna.sign} falls in ${lagna.nakshatra}, star lord ${lagna.starLord}, sub lord ${lagna.subLord}.`,
        cites: [cites.add("Astro Secrets & KP, Part 1 (uploaded PDF)")],
      },
      {
        kind: "table",
        head: ["Cusp", "Sign and degree", "Star lord", "Sub lord"],
        rows: kp.cusps.map((c) => [
          ORD(c.house),
          `${c.sign} ${fmtDeg(c.lon)}`,
          c.starLord,
          c.subLord,
        ]),
      },
    ];
    const sub: ReportSection[] = [];
    const byCusp = new Map<number, typeof kp.findings>();
    for (const f of kp.findings)
      byCusp.set(f.cusp, [...(byCusp.get(f.cusp) ?? []), f]);
    const held: number[] = [];
    for (const [cusp, fs] of Array.from(byCusp.entries()).sort(
      (a, b) => a[0] - b[0],
    )) {
      const area = HOUSE_AREA[cusp];
      if (area && !inSeason(area)) {
        held.push(cusp);
        continue;
      }
      sub.push({
        id: `kp-${cusp}`,
        title: `The ${ORD(cusp)} cusp`,
        paras: fs.map((f) => ({
          kind: "p" as const,
          text: S(`${f.topic}: ${endStop(f.text)}`),
          cites: [cites.add(f.source, f.sourceUrl)],
          aside: f.evidence,
          tone:
            f.polarity === "good"
              ? "support"
              : f.polarity === "bad"
                ? "strain"
                : "mixed",
        })),
      });
    }
    if (held.length)
      paras.push({
        kind: "note",
        text: `Held for later at this age: the ${list(held.map(ORD))} cusp${held.length === 1 ? "" : "s"}.`,
      });
    sections.push({
      id: "kp",
      title: "The cusps and their sub lords",
      kicker: "Krishnamurti Paddhati",
      paras,
      sub,
    });
  }

  // ── 8. Transits now ──
  if (!deceased) {
    const ju = now.positions.find((p) => p.planet === "Jupiter")!;
    const sa = now.positions.find((p) => p.planet === "Saturn")!;
    const jeeva = pos(reading.roles.native);
    const hj = houseFrom(jeeva.signIndex, ju.signIndex);
    const hs = houseFrom(jeeva.signIndex, sa.signIndex);
    const rel = (h: number) =>
      h === 1
        ? "over"
        : [5, 9].includes(h)
          ? "in trine to"
          : h === 7
            ? "opposite"
            : `in the ${ORD(h)} from`;
    sections.push({
      id: "now",
      title: "The sky today",
      kicker: `Transits as of ${fmtDate(asOf)}`,
      paras: [
        {
          kind: "p",
          text: `Jupiter stands in ${ju.sign}, ${rel(hj)} the natal Jeeva in ${jeeva.sign}; Saturn stands in ${sa.sign}, ${rel(hs)} it. In the Nadi method Jupiter's yearly passage is the clock and Saturn's the second hand: a matter ripens when Jupiter comes over its karaka or in trine to it while the chart already carries the combination.`,
          cites: [cites.add("R.G. Rao, Bhrigu Nandi Nadi")],
        },
      ],
    });
  }

  // ── 9. How to read this report ──
  sections.push({
    id: "reading",
    title: "How to read this report",
    paras: [
      {
        kind: "p",
        text: "Each system above is read on its own terms and none is used to correct another: the Nadi reading has no houses, Parashara and Krishnamurti read from the rising sign in different ways, and Jaimini ranks the planets by degree. Where they agree, the agreement is worth noting; where they differ, the difference is real and is left standing.",
      },
      {
        kind: "p",
        text: "Every statement carries a numbered note to the text it comes from. A statement marked provisional applies a rule the text does not state in that form, or reads a verse whose wording is uncertain; treat it as the app's reading, not the author's.",
      },
      {
        kind: "p",
        text: plain
          ? "Sensitive matters are worded as risk and strain rather than in the old texts' terms; the practitioner reading in the app shows the verse wording."
          : "This is the practitioner reading: the texts' own wording is kept, including where it speaks of loss.",
      },
      {
        kind: "p",
        text: `Matters not yet in season at the native's age (marriage and children from ${AREA_ONSET.marriage}, work and wealth from ${AREA_ONSET.career}) are held back rather than read. The classical length-of-life and infancy checks, the maraka planets and the remedies and mantras of the period chapters are not part of this report; nor are rectification and validation, which are tools rather than readings.${withheld ? ` ${SENSITIVE_WITHHELD_NOTE}` : ""}`,
      },
      {
        kind: "p",
        text: "One chart is one witness. What is written here can be checked against the life as it happens, and the Validate tab is built for that; it cannot prove the methods.",
      },
    ],
  });

  return {
    title: chart.name,
    subtitle: `${birthLocal.toFormat("d LLLL yyyy, HH:mm")} · ${chart.place}`,
    meta: [
      `${SIGNS[lagnaIdx]} rising`,
      `Moon in ${pos("Moon").nakshatra}`,
      `${chart.ayanamsa} ayanamsa`,
      result.timeBasis.label,
    ],
    generated: fmtDate(asOf),
    plain,
    // The sensitive-content gate: for a native under 18 every statement on length of life, marakas, arishta or the loss of a parent is removed, in either reading mode.
    sections: withheld ? withholdSections(sections) : sections,
    cites: cites.list,
  };
}

function withholdSections(sections: ReportSection[]): ReportSection[] {
  return sections.map((sec) => ({
    ...sec,
    paras: sec.paras
      .map((p) => ({
        ...p,
        text: p.text === undefined ? undefined : redactProse(p.text),
        aside: p.aside === undefined ? undefined : redactProse(p.aside),
        rows: p.rows?.map((r) => r.map((c) => redactProse(c) || "—")),
      }))
      .filter((p) => p.kind === "table" || (p.text ?? "") !== ""),
    sub: sec.sub ? withholdSections(sec.sub) : undefined,
  }));
}
