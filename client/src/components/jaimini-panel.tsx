import { Soft } from "@/lib/gentle";
import {
  VerdictCard,
  type VerdictSignature,
  type VerdictTiming,
} from "@/components/verdict-card";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ChartResult } from "@shared/schema";
import {
  PLANET_ABBR,
  SIGNS,
  SIGN_ABBR,
  SIGN_QUALITY,
  fmtDegShort,
  houseFrom,
  type Planet,
} from "@shared/astro";
import {
  CHARA_KARAKA_INFO,
  SAVYA,
  argalaOn,
  influencesOn,
  signsAspectedBy,
  type CharaDashaPeriod,
  type JaiminiFinding,
} from "@shared/jaimini";
import {
  JAIMINI_GROUP_LABEL,
  JAIMINI_TEXT_SOURCE,
} from "@shared/rules-jaimini";
import { AYUR_TERM_LABEL } from "@shared/jaimini-ayur";
import { SENSITIVE_WITHHELD_NOTE, sensitiveGate } from "@shared/life-stage";
import { Working } from "@/components/working";
import {
  ModeText,
  SectionTitle,
  usePlain,
  NowWord,
  useNowLabel,
} from "@/components/mode-text";
import { readAreas, currentFor, isHot } from "@shared/jaimini-areas";
import {
  ageYears,
  areaSeason,
  lifeStage,
  STAGE_LABEL,
  lifeAsOf,
} from "@shared/life-stage";
import {
  SignName,
  ElementLegend,
  elementColor,
  planetColor,
} from "@/components/planet-name";
import { LifeTimeline, type TlWindow } from "@/components/life-timeline";
import { charaBands, eventMarks, transitBand } from "@/lib/timeline-data";
import { Term } from "@/components/term";
import { SourceLink } from "@/components/source-link";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { JaiminiAreas } from "@/components/jaimini-areas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vimshottari, type KpPeriod } from "@shared/kp";
import { INDU_SOURCE } from "@shared/indu-lagna";
import { cn } from "@/lib/utils";

const PLAIN_KARAKA: Record<string, string> = {
  AK: "self",
  AmK: "career",
  BK: "siblings",
  MK: "mother",
  PiK: "father",
  PK: "children",
  GK: "relatives",
  DK: "spouse",
};

/** The Jaimini answer, first: the balance of the life areas, the three strongest karaka or pada signatures, and the running Chara period. */
function JaiminiVerdict({ result }: { result: ChartResult }) {
  const nowLabel = useNowLabel();
  const { jaimini: j, positions } = result;
  const asOf = result.now.asOf;
  const withheld =
    result.sensitive?.withheld ??
    sensitiveGate(result.chart, result.utc, asOf).withheld;
  const allAreas = useMemo(
    () => readAreas(j, positions, withheld),
    [j, positions, withheld],
  );
  // Areas not yet in season at the native's age are held out of the verdict (the Jaimini "children" area also carries learning, so it stays).
  const deferred = allAreas
    .map((a) => a.area)
    .filter(
      (a) => a !== "children" && !areaSeason(a, result.utc, asOf).inSeason,
    );
  const areas = allAreas.filter((a) => !deferred.includes(a.area));
  const age = ageYears(result.utc, lifeAsOf(result.chart, asOf));
  const ak = j.karakas[0];
  const dk = j.karakas.find((k) => k.karaka === "DK");
  const amk = j.karakas.find((k) => k.karaka === "AmK");
  const al = j.arudhas[0];
  const ul = j.arudhas[11];
  const md = j.charaDasha.periods.find((p) => p.start <= asOf && asOf < p.end);
  const ad = md?.antardashas.find((a) => a.start <= asOf && asOf < a.end);
  const supported = areas
    .filter((a) => a.balance >= 2)
    .map((a) => a.label.toLowerCase());
  const strained = areas
    .filter((a) => a.balance <= -2)
    .map((a) => a.label.toLowerCase());
  const active = areas.filter((a) => {
    const c = currentFor(a.timing, asOf);
    return c.period && (isHot(c.period.triggers) || c.window);
  });
  const list = (xs: string[]) =>
    xs.length === 0
      ? "none"
      : xs.length === 1
        ? xs[0]
        : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
  const fmtY = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");

  const parts: string[] = [];
  if (supported.length)
    parts.push(
      `${list(supported)} ${supported.length === 1 ? "rests" : "rest"} on firm ground`,
    );
  if (strained.length)
    parts.push(
      `${list(strained)} ${strained.length === 1 ? "is" : "are"} under strain`,
    );
  const headline = parts.length
    ? `${parts.join("; ")}; the rest ${supported.length + strained.length === areas.length - 1 ? "is" : "are"} mixed.`.replace(
        /^./,
        (c) => c.toUpperCase(),
      )
    : "No life area rests wholly on firm ground or wholly under strain; the karakas and padas pull both ways.";

  const signatures: VerdictSignature[] = useMemo(() => {
    const out: VerdictSignature[] = [];
    const ranked = [...areas].sort(
      (x, y) => Math.abs(y.balance) - Math.abs(x.balance),
    );
    for (const a of ranked) {
      if (out.length >= 3 || a.balance === 0) break;
      const want = a.balance > 0 ? "support" : "strain";
      const k = a.karakas.find((k) => k.notes.some((n) => n.tone === want));
      const pd = a.padas.find((p) => p.notes.some((n) => n.tone === want));
      const note =
        k?.notes.find((n) => n.tone === want) ??
        pd?.notes.find((n) => n.tone === want);
      if (!note) continue;
      out.push({
        planets: k ? [k.planet] : pd?.occupants.slice(0, 2),
        label: a.label,
        text: note.text.replace(/\.$/, ""),
        tone: a.balance > 0 ? "good" : "bad",
      });
    }
    return out;
  }, [areas]);

  const timing: VerdictTiming[] = [];
  if (md)
    timing.push({
      label: nowLabel,
      when: "present",
      text: (
        <>
          {md.signName} period, {fmtY(md.start)} to {fmtY(md.end)}
          {ad ? (
            <>
              ; {ad.signName} sub-period until {fmtY(ad.end)}
            </>
          ) : null}
        </>
      ),
    });
  if (active.length === areas.length)
    timing.push({
      label: "Active",
      when: "present",
      text: <>the running period touches every life area</>,
    });
  else if (active.length > areas.length / 2)
    timing.push({
      label: "Active",
      when: "present",
      text: (
        <>
          the running period touches most areas,{" "}
          {list(active.slice(0, 2).map((a) => a.label.toLowerCase()))} among
          them
        </>
      ),
    });
  else if (active.length)
    timing.push({
      label: "Active",
      when: "present",
      text: (
        <>
          the running period brings{" "}
          {list(active.map((a) => a.label.toLowerCase()))} to the fore
        </>
      ),
    });

  const lines = [
    {
      label: "Self",
      text: (
        <>
          {ak.planet}, the furthest along in its sign (
          {fmtDegShort(ak.rankDegree)}), is the planet of the self; in the
          ninth-cut chart it falls in {j.karakamsa.sign}.
          {amk ? (
            <>
              {" "}
              {amk.planet} is the planet of career
              {dk ? ` and ${dk.planet} the planet of the spouse` : ""}.
            </>
          ) : null}
        </>
      ),
    },
    {
      label: "Appearance",
      text: (
        <>
          The world sees this person through {al.sign}; marriage and the spouse
          are read from {ul.sign}.
        </>
      ),
    },
    ...(md
      ? [
          {
            label: "Period",
            text: (
              <>
                The {md.signName} period runs {md.years}{" "}
                {md.years === 1 ? "year" : "years"}; during it {md.signName}{" "}
                acts as the rising sign.
              </>
            ),
          },
        ]
      : []),
    {
      label: "From the text",
      text: (
        <>
          {j.findings.length} {j.findings.length === 1 ? "line" : "lines"} of
          Jaimini's sutras {j.findings.length === 1 ? "matches" : "match"} this
          chart, written out below.
        </>
      ),
    },
  ];

  return (
    <VerdictCard
      system="Jaimini"
      headline={headline}
      lead={
        <>
          Read from the eight chara karakas, the arudha padas and the Chara
          dasha by K.N. Rao's method. Nothing here feeds the Nadi reading.
          {deferred.length ? (
            <>
              {" "}
              At age {Math.floor(age)} ({STAGE_LABEL[lifeStage(age)]}){" "}
              {list(
                deferred.map((a) =>
                  allAreas.find((x) => x.area === a)!.label.toLowerCase(),
                ),
              )}{" "}
              {deferred.length === 1 ? "is" : "are"} not yet in season and{" "}
              {deferred.length === 1 ? "is" : "are"} held for later (onset ages
              are provisional conventions).
            </>
          ) : null}
        </>
      }
      signatures={signatures}
      timing={timing}
      lines={lines}
      caveat="Jaimini Sutras and the Upapada chapter of Brihat Parashara Hora Sastra; a starting set of rules, not a verdict."
      testid="jaimini-verdict"
      className="mt-4"
    />
  );
}

function ordinal(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}

function fmt(iso: string) {
  return DateTime.fromISO(iso).toFormat("d LLL yyyy");
}

function DashaRow({
  p,
  now,
  birth,
  open,
  onToggle,
}: {
  p: CharaDashaPeriod;
  now: DateTime;
  birth: DateTime;
  open: boolean;
  onToggle: () => void;
}) {
  const start = DateTime.fromISO(p.start);
  const end = DateTime.fromISO(p.end);
  const current = now >= start && now < end;
  const past = now >= end;
  return (
    <li
      className={cn(
        "rounded-md border",
        current && "border-primary/60 bg-primary/5",
      )}
      data-testid={`dasha-${p.cycle}-${p.sign}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-left"
        data-testid={`button-dasha-${p.cycle}-${p.sign}`}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span
          className={cn(
            "w-28 font-medium",
            past && !current && "text-muted-foreground",
          )}
        >
          <SignName signIndex={p.sign} />
        </span>
        <span className="tabular w-16 text-sm text-muted-foreground">
          {p.years} {p.years === 1 ? "year" : "years"}
        </span>
        <span className="tabular text-sm text-muted-foreground">
          {fmt(p.start)} – {fmt(p.end)}
        </span>
        <span className="tabular text-xs text-muted-foreground">
          age {p.ageStart}–{p.ageStart + p.years}
        </span>
        {current && (
          <Badge
            variant="secondary"
            className="no-default-hover-elevate ml-auto text-2xs"
          >
            <NowWord />
          </Badge>
        )}
      </button>
      {open && (
        <div className="border-t px-3 py-2 text-xs">
          <p className="text-muted-foreground">
            {p.lord} in {SIGNS[p.lordSign]}, counted{" "}
            {SAVYA.has(p.sign) ? "forward" : "backward"} from {p.signName}
            {p.note ? `; ${p.note}` : ""}. Antardashas run{" "}
            {SAVYA.has(p.sign) ? "forward" : "backward"} from the next sign and
            end on {p.signName}.
          </p>
          <ul
            className="mt-2 grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3"
            data-testid={`antardashas-${p.cycle}-${p.sign}`}
          >
            {p.antardashas.map((a) => {
              const s = DateTime.fromISO(a.start);
              const e = DateTime.fromISO(a.end);
              const cur = now >= s && now < e;
              return (
                <li
                  key={a.sign}
                  className={cn(
                    "tabular flex justify-between gap-2 border-b py-1",
                    cur && "font-semibold text-primary",
                  )}
                >
                  <span>{a.signName}</span>
                  <span className="text-muted-foreground">
                    {s.toFormat("LLL yyyy")} – {e.toFormat("LLL yyyy")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}

export function JaiminiPanel({ result }: { result: ChartResult }) {
  const { jaimini: j, positions, chart } = result;
  const now = DateTime.fromISO(result.now.asOf);
  const birth = DateTime.fromISO(result.utc);
  const [openDasha, setOpenDasha] = useState<string | null>(() => {
    const cur = j.charaDasha.periods.find(
      (p) => now >= DateTime.fromISO(p.start) && now < DateTime.fromISO(p.end),
    );
    return cur ? `${cur.cycle}-${cur.sign}` : null;
  });
  const [showAll, setShowAll] = useState(false);
  const [focusSign, setFocusSign] = useState<number>(j.lagna.signIndex);
  const [showPrimer, setShowPrimer] = useState(false);
  const plain = usePlain();

  // Vimshottari mahadashas, for the Indu Lagna reading's timing clauses.
  const moonPos = positions.find((x) => x.planet === "Moon")!;
  let dasas: KpPeriod[] = [];
  try {
    dasas = vimshottari(moonPos.lon, result.utc, result.now.asOf).dasas;
  } catch {
    dasas = [];
  }
  const dasaOf = (planet: Planet) => dasas.find((d) => d.lord === planet);

  // Shared timeline: Chara periods with Jupiter's passages, the antardashas each area runs hot in, and the recorded events.
  const tlBands = useMemo(
    () => [
      ...charaBands(j.charaDasha, result.now.asOf),
      transitBand(result.transits, "Jupiter", result.now.asOf),
    ],
    [j.charaDasha, result.transits, result.now.asOf],
  );
  const tlWindows = useMemo<TlWindow[]>(() => {
    // One thin lane per life area; a mahadasha is drawn when it carries the area at Rao's threshold, darker the more triggers it has.
    const out: TlWindow[] = [];
    readAreas(
      j,
      positions,
      result.sensitive?.withheld ??
        sensitiveGate(result.chart, result.utc, result.now.asOf).withheld,
    ).forEach((a, lane) => {
      const max = Math.max(1, ...a.timing.periods.map((p) => p.score));
      for (const p of a.timing.periods) {
        if (!isHot(p.triggers)) continue;
        const support = p.triggers
          .filter((t) => t.tone === "support")
          .reduce((n, t) => n + t.weight, 0);
        const strain = p.triggers
          .filter((t) => t.tone === "strain")
          .reduce((n, t) => n + t.weight, 0);
        out.push({
          start: p.start,
          end: p.end,
          label: `${a.label} in the ${SIGNS[p.sign]} period`,
          tone: strain > support ? "bad" : support > strain ? "good" : "mixed",
          strength: p.score / max,
          lane,
        });
      }
    });
    return out;
  }, [j, positions]);
  const tlMarks = useMemo(
    () => eventMarks(chart.events, chart.timezone),
    [chart.events, chart.timezone],
  );

  const tags = useMemo(
    () =>
      Object.fromEntries(j.karakas.map((k) => [k.planet, k.karaka])) as Partial<
        Record<Planet, string>
      >,
    [j.karakas],
  );
  const rasiBadges = useMemo(() => {
    const b: Record<number, string[]> = {};
    for (const a of j.arudhas)
      if (a.label === "AL" || a.label === "UL")
        (b[a.signIndex] ??= []).push(a.label);
    return b;
  }, [j.arudhas]);
  const d9Badges = useMemo(
    () => ({ [j.karakamsa.signIndex]: ["Karakamsa"] }),
    [j.karakamsa.signIndex],
  );
  const ak = j.karakas[0].planet;

  const currentMd = j.charaDasha.periods.find(
    (p) => now >= DateTime.fromISO(p.start) && now < DateTime.fromISO(p.end),
  );
  const currentAd = currentMd?.antardashas.find(
    (a) => now >= DateTime.fromISO(a.start) && now < DateTime.fromISO(a.end),
  );
  const visiblePeriods = showAll
    ? j.charaDasha.periods
    : j.charaDasha.periods.filter((p) => p.cycle === 1);

  const grouped = useMemo(() => {
    const g = new Map<string, JaiminiFinding[]>();
    for (const f of j.findings) g.set(f.group, [...(g.get(f.group) ?? []), f]);
    return g;
  }, [j.findings]);

  const al = j.arudhas[0];
  const ul = j.arudhas[11];
  const ageYears = birth.isValid
    ? DateTime.fromISO(lifeAsOf(result.chart, result.now.asOf)).diff(
        birth,
        "years",
      ).years
    : null;
  const rasiInfluence = (sign: number) => influencesOn(sign, positions);
  const dashaSignNotes = (p: CharaDashaPeriod) => {
    const notes: string[] = [];
    const occ = positions
      .filter((x) => x.signIndex === p.sign)
      .map((x) => x.planet);
    if (occ.length) notes.push(`holds ${occ.join(", ")}`);
    const asp = positions
      .filter((x) => signsAspectedBy(x.signIndex).includes(p.sign))
      .map((x) => x.planet);
    if (asp.length) notes.push(`is aspected by ${asp.join(", ")}`);
    if (p.sign === al.signIndex)
      notes.push("is the Arudha lagna sign: a period about image and standing");
    if (p.sign === ul.signIndex)
      notes.push(
        "is the Upapada sign: marriage and the spouse's family come forward",
      );
    if (p.sign === j.karakamsa.signIndex)
      notes.push("is the Karakamsa sign (Swamsa): the soul's own agenda");
    const ks = j.karakas
      .filter(
        (k) =>
          positions.find((x) => x.planet === k.planet)!.signIndex === p.sign,
      )
      .map((k) => `${k.karaka} ${k.planet}`);
    if (ks.length) notes.push(`holds the ${ks.join(" and ")}`);
    notes.push(
      `is the ${ordinal(houseFrom(j.lagna.signIndex, p.sign))} from the lagna and the ${ordinal(houseFrom(al.signIndex, p.sign))} from the Arudha lagna`,
    );
    return notes;
  };

  return (
    <div data-testid="jaimini-panel">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge
          variant="outline"
          className="no-default-hover-elevate tabular"
          data-testid="text-jaimini-lagna"
        >
          <Term k="lagna">Lagna</Term>&nbsp;{j.lagna.sign}{" "}
          {fmtDegShort(j.lagna.lon)}
        </Badge>
        <Badge variant="outline" className="no-default-hover-elevate">
          <Term k="d9">Navamsa lagna</Term>&nbsp;{j.navamsaLagna.sign}
        </Badge>
        <Badge
          variant="outline"
          className="no-default-hover-elevate"
          data-testid="text-karakamsa"
        >
          <Term k="karakamsa">Karakamsa</Term>&nbsp;{j.karakamsa.sign} (
          {PLANET_ABBR[ak]}&nbsp;<Term k="ak">AK</Term>)
        </Badge>
        {j.special && (
          <Badge
            variant="outline"
            className="no-default-hover-elevate"
            data-testid="text-special-lagnas"
            title="Hora lagna and Ghatika lagna (Jaimini 1.1.31-32): the Sun's position at sunrise advanced by 30° and 75° per hour of birth"
          >
            <Term k="hl">HL</Term>&nbsp;{j.special.horaLagna.sign}&nbsp;·&nbsp;
            <Term k="gl">GL</Term>&nbsp;{j.special.ghatikaLagna.sign}
          </Badge>
        )}
        <Badge variant="outline" className="no-default-hover-elevate">
          <Term k="chara-dasha">Chara dasha</Term>&nbsp;{j.charaDasha.direction}
        </Badge>
        {currentMd && (
          <Badge
            variant="secondary"
            className="no-default-hover-elevate"
            data-testid="text-current-dasha"
          >
            Now: {currentMd.signName}
            {currentAd ? ` / ${currentAd.signName}` : ""}
          </Badge>
        )}
      </div>

      <JaiminiVerdict result={result} />

      <ModeText
        className="mt-4 max-w-[76ch] text-sm"
        plain={
          <>
            Jaimini's method ranks the planets by how far each has travelled in
            its sign and gives each a role: the highest becomes the planet of
            the self, the next the planet of career, and so on down to the
            planet of the spouse. It reads the world's view of each house from a
            mirrored point, lets signs rather than planets cast aspects, and
            times life by signs, each ruling for a fixed number of years. Hover
            a dotted term for its meaning; switch to Practitioner for the tables
            and sutra references.
          </>
        }
        practitioner={
          <>
            Chara karakas by degree, arudha padas, rasi drishti and argala,
            Chara dasha by K.N. Rao's method, and the Karakamsa, Arudha and
            Upapada sutras. Nothing here feeds the Nadi reading.
          </>
        }
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[5fr_4fr] lg:items-start">
        <div>
          <SouthIndianChart
            positions={positions}
            title="Rasi"
            subtitle="Rasi with lagna and padas"
            lagnaSign={j.lagna.signIndex}
            badges={rasiBadges}
            accent={[ak]}
            footer="Rasi · houses from the lagna"
            highlightSign={focusSign}
            secondarySigns={signsAspectedBy(focusSign)}
            onSignClick={setFocusSign}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">As</span> ascendant ·
            numbers are houses from the lagna ·{" "}
            <span className="font-semibold text-primary">AL</span>{" "}
            <Term k="al">Arudha lagna</Term> ·{" "}
            <span className="font-semibold text-primary">UL</span>{" "}
            <Term k="ul">Upapada</Term> ·{" "}
            <span className="font-semibold text-primary">
              {PLANET_ABBR[ak]}
            </span>{" "}
            <Term k="ak">Atmakaraka</Term>. Click a sign to see its{" "}
            <Term k="rasi-drishti">rasi drishti</Term>: the solid cell is the
            chosen sign, dashed cells are the signs it aspects.
          </p>
        </div>
        <div>
          <SouthIndianChart
            positions={j.navamsa}
            title="Navamsa"
            subtitle="D9 with chara karakas"
            lagnaSign={j.navamsaLagna.signIndex}
            badges={d9Badges}
            tags={tags}
            accent={[ak]}
            footer="Navamsa · houses from the D9 lagna"
          />
          <ModeText
            className="mt-2"
            plain={
              <>
                The ninth-cut chart, with each planet's role written beside it.
                The sign where the planet of the self falls here is the chart's
                inner seat; Jaimini reads work, temperament and devotion from
                the houses counted from it.
              </>
            }
            practitioner={
              <>
                Planets carry their chara karaka. The Atmakaraka's D9 sign is
                the Karakamsa; Jaimini reads career, temperament and devotion
                from the houses counted from it.
              </>
            }
          />
        </div>
      </div>

      <section className="mt-10" data-testid="section-karakas">
        <SectionTitle
          as="h2"
          plain="The eight planets and their roles"
          technical="Chara karakas"
          term="karaka"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              Jaimini ranks the eight planets by how far each has travelled in
              its sign. The furthest along is the planet of the self, then
              career, siblings, mother, father, children, relatives and spouse.
              The roles change from chart to chart, which is why they are called
              movable.
            </>
          }
          practitioner={
            <>
              Eight movable significators ranked by degree within sign; Rahu is
              ranked by thirty minus its degree because it moves backward.
            </>
          }
        />
        <Working id="karakas" label="Show the ranking table" className="mt-3">
          <Table className="tabular mt-3" cards>
            <TableHeader>
              <TableRow>
                <TableHead>Karaka</TableHead>
                <TableHead>Planet</TableHead>
                <TableHead className="text-right">Rank degree</TableHead>
                <TableHead className="hidden sm:table-cell">Rasi</TableHead>
                <TableHead className="hidden sm:table-cell">Navamsa</TableHead>
                <TableHead className="hidden md:table-cell">
                  Signifies
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {j.karakas.map((k) => {
                const rp = positions.find((p) => p.planet === k.planet)!;
                const dp = j.navamsa.find((p) => p.planet === k.planet)!;
                return (
                  <TableRow
                    key={k.karaka}
                    data-testid={`row-karaka-${k.karaka}`}
                  >
                    <TableCell className="py-2">
                      <span className="font-semibold text-primary">
                        {k.karaka}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {CHARA_KARAKA_INFO[k.karaka].name}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 font-medium">
                      {k.planet}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {k.rankDegree.toFixed(2)}°
                    </TableCell>
                    <TableCell className="hidden py-2 sm:table-cell">
                      {rp.sign}
                    </TableCell>
                    <TableCell className="hidden py-2 sm:table-cell">
                      {dp.sign}
                    </TableCell>
                    <TableCell className="hidden py-2 text-muted-foreground md:table-cell">
                      {CHARA_KARAKA_INFO[k.karaka].meaning}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Working>
      </section>

      <section className="mt-10" data-testid="section-arudhas">
        <SectionTitle
          as="h2"
          plain="How each house appears to the world"
          technical="Arudha padas"
          term="pada"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              Each house has a mirror image: count from the house to its ruler,
              then the same distance again. The image of the 1st house is how
              others see the person; the image of the 12th is read for the
              spouse and marriage. A starred pada was moved by Jaimini's
              exception rule.
            </>
          }
          practitioner={
            <>
              Count from a house to its lord, then as far again. When the
              reflection lands in the house or its 7th it is moved to the 10th
              from there (marked with an asterisk). Traditional lords are used
              for Scorpio and Aquarius.
            </>
          }
        />
        <Working
          id="arudhas"
          label="Show the mirror points for all twelve houses"
          className="mt-3"
        >
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {j.arudhas.map((a) => (
              <Card
                key={a.label}
                className={cn(
                  a.label === "AL" || a.label === "UL"
                    ? "border-primary/40"
                    : "",
                )}
                data-testid={`arudha-${a.label}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">
                      {a.label}
                      {a.corrected ? "*" : ""}
                    </span>
                    <span className="text-sm">{a.sign}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {ordinal(a.house)} house {SIGN_ABBR[a.houseSign]}, lord{" "}
                    {a.lord} in {SIGN_ABBR[a.lordSign]}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {a.name}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Working>
      </section>

      <section className="mt-10" data-testid="section-indu">
        <SectionTitle
          as="h2"
          plain="The wealth ascendant"
          technical="Indu Lagna"
          term="indu-lagna"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              A second rising point built only for money: the ninth lord from
              the birth ascendant and the ninth lord from the Moon each carry a
              fixed number of rays, the two numbers are added, and the
              remainder is counted round the zodiac from the Moon. What sits in
              that sign, its second and its eleventh, is read for the scale of
              wealth.
            </>
          }
          practitioner={
            <>
              Indu Lagna, the wealth ascendant of Uttara Kalamrita IV.27
              (Kalidasa; Sastri's translation, public-domain e-text at{" "}
              <SourceLink source={INDU_SOURCE} />
              ): the kalas of the ninth lord from the lagna and of the ninth
              lord from the Moon are summed, divided by twelve, and the
              remainder counted from the Moon's sign. A Parashari-lineage
              technique shown here beside the other special lagnas; it feeds
              nothing in the Nadi reading. Reading rules: DNA Astrology of
              Wealth, pp. 92-93.
            </>
          }
        />
        <Working
          id="indu"
          label="Show the Indu Lagna working and its wealth readings"
          className="mt-3"
        >
          <Card data-testid="card-indu" className="mt-3">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="text-base font-semibold">
                  Indu Lagna ·{" "}
                  <span data-testid="text-indu-lagna">{j.indu.sign}</span>
                </h3>
                <span className="tabular text-xs text-muted-foreground">
                  {j.indu.ninthFromLagna.lord} {j.indu.ninthFromLagna.kala} +{" "}
                  {j.indu.ninthFromMoon.lord} {j.indu.ninthFromMoon.kala} ={" "}
                  {j.indu.sum} → {j.indu.remainder}
                </span>
              </div>
              <p
                className="mt-2 text-sm leading-relaxed"
                data-testid="text-indu-working"
              >
                The 9th from the lagna is {j.indu.ninthFromLagna.sign} (
                {j.indu.ninthFromLagna.lord}, {j.indu.ninthFromLagna.kala}{" "}
                kalas); the 9th from the Moon in {moonPos.sign} is{" "}
                {j.indu.ninthFromMoon.sign} ({j.indu.ninthFromMoon.lord},{" "}
                {j.indu.ninthFromMoon.kala} kalas). Their sum {j.indu.sum}{" "}
                leaves a remainder of {j.indu.remainder} modulo twelve, so the
                {" "}
                {ordinal(j.indu.remainder)} sign from the Moon is the Indu
                Lagna: {j.indu.sign}.
                {j.indu.sameLord
                  ? ` ${j.indu.ninthFromLagna.lord} rules both ninths and its kalas are counted twice, as the verse adds the two lords' values.`
                  : ""}
              </p>
              <div className="mt-3 space-y-1.5 text-sm leading-relaxed">
                {[...j.indu.classical, ...j.indu.findings].map((f) => {
                  const d = f.planets
                    .map((pl) => dasaOf(pl))
                    .filter((x): x is KpPeriod => !!x);
                  const state = d.some((x) => x.current)
                    ? " (running)"
                    : d.length && d.every((x) => DateTime.fromISO(x.end) < now)
                      ? " (passed)"
                      : "";
                  return (
                    <p
                      key={f.id}
                      className="text-muted-foreground"
                      data-testid={`indu-${f.id}`}
                    >
                      {f.planets.map((pl, i) => (
                        <span key={pl}>
                          {i > 0 ? " " : ""}
                          <span style={{ color: planetColor(pl) }}>{pl}</span>
                        </span>
                      ))}
                      {f.planets.length ? " — " : ""}
                      <span className="text-foreground">{f.text}</span>
                      {d.length &&
                      ["il-ben-dasha", "il-ben-trine", "il-ben-kendra", "il-second"].includes(f.id)
                        ? ` Mahadasha${d.length === 1 ? "" : "s"} ${d
                            .map(
                              (x) =>
                                `${DateTime.fromISO(x.start).toFormat("yyyy")}–${DateTime.fromISO(x.end).toFormat("yyyy")}`,
                            )
                            .join(", ")}${state}.`
                        : ""}{" "}
                      <span className="text-xs">
                        ({f.source === "classical" ? f.sourceLabel ?? INDU_SOURCE.label : f.pages})
                      </span>
                    </p>
                  );
                })}
              </div>
              <ul className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
                {j.indu.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Working>
      </section>

      <section className="mt-10" data-testid="section-drishti">
        <SectionTitle
          as="h2"
          plain="How signs see each other"
          technical="Rasi drishti and argala"
          term="rasi-drishti"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              In Jaimini's system signs, not planets, look at one another, so
              every planet in a sign shares that sign's view. Planets in certain
              neighbouring signs also step into a house's affairs, for good or
              ill, and planets opposite them can block that step. Click a sign
              on the chart above to see whom it looks at.
            </>
          }
          practitioner={
            <>
              Signs aspect signs: movable signs see the fixed signs except the
              next one, fixed signs see the movable signs except the previous
              one, dual signs see each other. Planets in the 2nd, 4th and 11th
              from a sign intervene in its affairs (argala); the 12th, 10th and
              3rd obstruct them.
            </>
          }
        />
        <Working
          id="drishti"
          label="Show the sign-aspect and intervention tables"
          className="mt-3"
        >
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 -ml-2"
            onClick={() => setShowPrimer((v) => !v)}
            data-testid="button-drishti-primer"
            aria-expanded={showPrimer}
          >
            {showPrimer ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            How this differs from Parashari aspects
          </Button>
          {showPrimer && (
            <div
              className="mt-1 grid gap-3 rounded-md border bg-muted/30 p-4 text-sm md:grid-cols-2"
              data-testid="drishti-primer"
            >
              <div>
                <div className="font-medium">Parashari (graha drishti)</div>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Planets aspect. Every planet sees the 7th house from itself.
                  </li>
                  <li>
                    Special aspects: Mars 4th and 8th, Jupiter 5th and 9th,
                    Saturn 3rd and 10th.
                  </li>
                  <li>
                    Counted by house or by degree; the 7th is always present.
                  </li>
                </ul>
              </div>
              <div>
                <div className="font-medium">Jaimini (rasi drishti)</div>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Signs aspect. A planet simply inherits the aspects of the
                    sign it occupies, so a whole group in one sign aspects
                    together.
                  </li>
                  <li>
                    Movable sees fixed (except the adjacent one), fixed sees
                    movable (except the one before it), dual sees dual. In house
                    terms that is the 5th, 8th and 11th from a movable sign; the
                    3rd, 6th and 9th from a fixed sign; the 4th, 7th and 10th
                    from a dual sign.
                  </li>
                  <li>
                    There is no universal 7th: Aries and Libra do not see each
                    other, nor do Taurus and Scorpio. Only the dual signs share
                    a 7th aspect.
                  </li>
                  <li>
                    Aspect is mutual: if Libra sees Taurus, Taurus sees Libra.
                  </li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <div className="font-medium">Argala is not an aspect</div>
                <p className="mt-1 text-muted-foreground">
                  Argala is positional intervention, read from a sign regardless
                  of aspect: planets in the 2nd, 4th and 11th from it press on
                  its affairs (the 5th weakly). Planets in the 12th, 10th and
                  3rd respectively push back (the 9th for the 5th); when the
                  obstructing house holds as many or more planets, the argala is
                  cancelled. Jaimini reads a sign through what occupies it, what
                  aspects it and what gives it argala; this app's "influencing"
                  rules use all three.
                </p>
              </div>
            </div>
          )}
          <Card
            className="mt-3 border-primary/40"
            data-testid="card-drishti-explorer"
          >
            <CardContent className="p-3 text-sm">
              {(() => {
                const q = SIGN_QUALITY[focusSign];
                const seen = signsAspectedBy(focusSign);
                const skipped =
                  q === "Movable"
                    ? (focusSign + 1) % 12
                    : q === "Fixed"
                      ? (focusSign + 11) % 12
                      : undefined;
                const inf = influencesOn(focusSign, positions);
                const occupants = positions.filter(
                  (p) => p.signIndex === focusSign,
                );
                const arg = argalaOn(focusSign, positions);
                const labels = [
                  focusSign === j.lagna.signIndex ? "lagna" : null,
                  focusSign === al.signIndex ? "Arudha lagna" : null,
                  focusSign === ul.signIndex ? "Upapada" : null,
                  focusSign === j.karakamsa.signIndex ? "Karakamsa sign" : null,
                ].filter(Boolean);
                return (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="font-medium">
                        {SIGNS[focusSign]}{" "}
                        <span className="text-muted-foreground">
                          ({q.toLowerCase()} sign,{" "}
                          {ordinal(houseFrom(j.lagna.signIndex, focusSign))}{" "}
                          house
                          {labels.length ? `, ${labels.join(", ")}` : ""})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[
                          j.lagna.signIndex,
                          al.signIndex,
                          ul.signIndex,
                          j.karakamsa.signIndex,
                        ]
                          .filter((v, i, arr) => arr.indexOf(v) === i)
                          .map((sg) => (
                            <Button
                              key={sg}
                              size="sm"
                              variant={focusSign === sg ? "secondary" : "ghost"}
                              className="h-7 px-2 text-xs"
                              onClick={() => setFocusSign(sg)}
                              data-testid={`button-focus-${sg}`}
                            >
                              {sg === j.lagna.signIndex
                                ? "Lagna"
                                : sg === al.signIndex
                                  ? "AL"
                                  : sg === ul.signIndex
                                    ? "UL"
                                    : "Karakamsa"}{" "}
                              {SIGN_ABBR[sg]}
                            </Button>
                          ))}
                      </div>
                    </div>
                    <div className="mt-2 grid gap-x-6 gap-y-1 text-xs md:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Aspects </span>
                        {seen
                          .map(
                            (sg) =>
                              `${SIGNS[sg]} (${ordinal(houseFrom(focusSign, sg))})`,
                          )
                          .join(", ")}
                        {skipped !== undefined && (
                          <span className="text-muted-foreground">
                            ; skips {SIGNS[skipped]}, the adjacent{" "}
                            {SIGN_QUALITY[skipped].toLowerCase()} sign
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Planets here{" "}
                        </span>
                        {occupants.length
                          ? `${occupants.map((p) => p.planet).join(", ")} therefore aspect ${seen.map((sg) => SIGN_ABBR[sg]).join(", ")}`
                          : "none"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Aspected by{" "}
                        </span>
                        {inf.aspecting.length
                          ? inf.aspecting
                              .map(
                                (pl) =>
                                  `${pl} (${SIGN_ABBR[positions.find((p) => p.planet === pl)!.signIndex]})`,
                              )
                              .join(", ")
                          : "no planet"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Argala </span>
                        {arg.filter((a) => a.planets.length).length === 0
                          ? "none"
                          : arg
                              .filter((a) => a.planets.length)
                              .map(
                                (a) =>
                                  `${ordinal(a.house)} ${a.planets.join(", ")}${a.obstructed ? ` (obstructed by ${a.obstructedBy.join(", ")} in the ${ordinal(a.obstructingHouse)})` : a.obstructedBy.length ? ` (${a.obstructedBy.join(", ")} in the ${ordinal(a.obstructingHouse)} ${a.obstructedBy.length === 1 ? "resists" : "resist"})` : ""}`,
                              )
                              .join("; ")}
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {j.argala.map((g) => {
              const inf = rasiInfluence(g.sign);
              return (
                <Card
                  key={g.target}
                  data-testid={`drishti-${g.target.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <CardContent className="p-3 text-sm">
                    <div className="font-medium">
                      {g.target}{" "}
                      <span className="text-muted-foreground">
                        {SIGNS[g.sign]}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Occupied by{" "}
                      {inf.occupants.length
                        ? inf.occupants.join(", ")
                        : "no planet"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Aspected by{" "}
                      {inf.aspecting.length
                        ? inf.aspecting.join(", ")
                        : "no planet"}
                    </div>
                    <ul className="mt-2 space-y-1 text-xs">
                      {g.items.length === 0 && (
                        <li className="text-muted-foreground">No argala.</li>
                      )}
                      {g.items.map((it) => (
                        <li key={it.house}>
                          <span
                            className={cn(
                              it.obstructed &&
                                "text-muted-foreground line-through decoration-muted-foreground/60",
                            )}
                          >
                            {ordinal(it.house)}{" "}
                            {it.kind === "secondary" ? "(secondary) " : ""}
                            {it.planets.join(", ")}
                          </span>
                          {it.obstructedBy.length > 0 && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {ordinal(it.obstructingHouse)}{" "}
                              {it.obstructedBy.join(", ")}{" "}
                              {it.obstructed
                                ? it.obstructedBy.length === 1
                                  ? "obstructs"
                                  : "obstruct"
                                : it.obstructedBy.length === 1
                                  ? "resists"
                                  : "resist"}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Working>
      </section>

      <section className="mt-10" data-testid="section-chara-dasha">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <SectionTitle
              as="h2"
              plain="Life periods by sign"
              technical="Chara dasha (K.N. Rao)"
              term="chara-dasha"
              className="text-base"
            />
            <ModeText
              className="text-sm"
              plain={
                <>
                  Each sign takes a turn ruling the life, from one to twelve
                  years, starting with the rising sign and running{" "}
                  {j.charaDasha.direction} around the zodiac. During a sign's
                  period that sign acts as the rising sign and the planets are
                  read from it. Select a period to see what it brings and its
                  sub-periods.
                </>
              }
              practitioner={
                <>
                  Sequence from the lagna, {j.charaDasha.direction} because the
                  9th house ({SIGNS[j.charaDasha.ninthSign]}) is{" "}
                  {SAVYA.has(j.charaDasha.ninthSign)
                    ? "a savya sign"
                    : "an apasavya sign"}
                  . Years: count from the sign to its lord, less one; a lord in
                  its own sign gives twelve. No exaltation or debilitation
                  adjustment.
                </>
              }
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            data-testid="button-toggle-second-cycle"
          >
            {showAll ? "First cycle only" : "Show second cycle"}
          </Button>
        </div>
        {currentMd && (
          <Card
            className="mt-3 border-primary/40"
            data-testid="card-current-dasha"
          >
            <CardContent className="p-3 text-sm">
              <div className="font-medium">
                {currentMd.signName} mahadasha
                {currentAd ? `, ${currentAd.signName} antardasha` : ""}{" "}
                <span className="text-muted-foreground">
                  (age {Math.floor(now.diff(birth, "years").years)})
                </span>
              </div>
              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                {dashaSignNotes(currentMd).map((n, i) => (
                  <li key={i}>
                    {currentMd.signName} {n}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        <LifeTimeline
          className="mt-4"
          testid="jaimini-timeline"
          birthIso={result.utc}
          asOfIso={result.now.asOf}
          bands={tlBands}
          windows={tlWindows}
          windowsLabel="Hot"
          marks={tlMarks}
          horizonYears={showAll ? 120 : 60}
        />
        <ElementLegend className="mt-3" />
        <p className="mt-1 text-2xs text-muted-foreground">
          {plain
            ? "The Hot stripes are the seven life areas in the order of the cards above (self, career, wealth, marriage, children, family, health): a stripe is drawn where a sign period carries that area strongly by Rao's rules, green where it supports it, red where it strains it, darker the stronger. Jupiter's passages are shown for comparison with the Nadi timing; they are not part of the Chara reading."
            : "The Hot stripes are the seven areas in card order (self, career, wealth, marriage, children, family, health); a mahadasha is drawn where it carries the area at Rao's threshold (a weight-2 trigger or score ≥ 3), tinted by the balance of support and strain and shaded by score. Jupiter's sign passages are drawn for comparison with the Nadi timing only."}
        </p>
        <ul className="mt-3 space-y-1.5">
          {visiblePeriods.map((p) => {
            const key = `${p.cycle}-${p.sign}`;
            return (
              <DashaRow
                key={key}
                p={p}
                now={now}
                birth={birth}
                open={openDasha === key}
                onToggle={() => setOpenDasha(openDasha === key ? null : key)}
              />
            );
          })}
        </ul>
      </section>

      <JaiminiAreas result={result} />

      <section className="mt-10" data-testid="section-jaimini-findings">
        <SectionTitle
          as="h2"
          plain="What Jaimini's text says of this chart"
          technical="What the sutras say"
          className="text-base"
        />
        <ModeText
          className="text-sm"
          plain={
            <>
              Every line of Jaimini's text that matches this chart, grouped by
              subject. Lines about the self and work come from the ninth-cut
              chart; lines about reputation and marriage from the mirror points
              in the birth chart. Each is written out in softened wording with
              its reference.
            </>
          }
          practitioner={
            <>
              Karakamsa rules are read in the navamsa; Arudha and Upapada rules
              in the rasi chart with rasi drishti. Each finding names its sutra.
            </>
          }
        />
        <Working
          id="sutra-findings"
          label="Show every finding with its sutra"
          className="mt-3"
        >
          {j.findings.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              No rule in the current set fires for this chart.
            </p>
          )}
          {Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group} className="mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {JAIMINI_GROUP_LABEL[group as keyof typeof JAIMINI_GROUP_LABEL]}
              </h3>
              <ul className="mt-1 divide-y">
                {items.map((f) => (
                  <li
                    key={f.id}
                    className="py-2"
                    data-testid={`jaimini-finding-${f.id}`}
                  >
                    <div className="text-sm">
                      <Soft>{f.text}</Soft>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {f.planets.length ? `${f.planets.join(" · ")} — ` : ""}
                      {f.chart === "navamsa" ? "navamsa" : "rasi"} · weight{" "}
                      {f.weight} · <SourceLink source={f.source} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Working>
      </section>

      <section className="mt-10" data-testid="section-ayur">
        <SectionTitle
          as="h2"
          plain="Span of life, as the text classifies it"
          technical="Span of life (Ayurdaya), a classical classification"
          term="ayurdaya"
          className="font-display text-lg"
        />
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Jaimini 2.1 sorts every chart into one of three broad brackets by
          pairing signs and reading their nature (movable, fixed, dual).
          Presented here as a description of how the chart is classified in the
          text, not as a forecast: the brackets are wide, the tradition itself
          disputes the details, and no chart reading can stand in for medical
          care.{" "}
          <SourceLink
            source={{
              label: "Jaimini Sutras 2.1.1-14",
              url: JAIMINI_TEXT_SOURCE.url,
              sutra: "2.1.1-14",
            }}
          />
        </p>
        {!j.ayur || plain ? (
          <p
            className="mt-3 max-w-3xl text-sm text-muted-foreground"
            data-testid="jaimini-ayur-gate"
          >
            {!j.ayur
              ? SENSITIVE_WITHHELD_NOTE
              : "Shown in the practitioner reading only."}
          </p>
        ) : (
          <Working id="ayur" label="Show the classification" className="mt-3">
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_20rem]">
              <ul className="divide-y sm:hidden">
                {j.ayur.pairs.map((p) => (
                  <li key={p.id} className="py-2.5 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span>
                        {p.label}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({p.sutra})
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {AYUR_TERM_LABEL[p.term]}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {p.a.planet ? `${p.a.planet} in ` : ""}
                      {p.a.sign} ({p.a.nature}) ·{" "}
                      {p.b.planet ? `${p.b.planet} in ` : ""}
                      {p.b.sign} ({p.b.nature})
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pair</TableHead>
                      <TableHead>First</TableHead>
                      <TableHead>Second</TableHead>
                      <TableHead>Reads as</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {j.ayur.pairs.map((p) => (
                      <TableRow key={p.id} data-testid={`ayur-pair-${p.id}`}>
                        <TableCell className="text-sm">
                          {p.label}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({p.sutra})
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.a.planet ? `${p.a.planet} in ` : ""}
                          {p.a.sign}{" "}
                          <span className="text-xs text-muted-foreground">
                            {p.a.nature}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.b.planet ? `${p.b.planet} in ` : ""}
                          {p.b.sign}{" "}
                          <span className="text-xs text-muted-foreground">
                            {p.b.nature}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {AYUR_TERM_LABEL[p.term]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Card>
                <CardContent className="p-4 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Classification
                  </div>
                  <div
                    className="mt-1 font-medium"
                    data-testid="text-ayur-term"
                  >
                    {AYUR_TERM_LABEL[j.ayur.term]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {j.ayur.range} in the classical scheme
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Decided by: {j.ayur.decidedBy}.
                  </p>
                  {j.ayur.adjustments.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {j.ayur.adjustments.map((a, i) => (
                        <li key={i}>
                          <Soft>{a.text}</Soft>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!j.ayur.hasHoraLagna && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      The Hora lagna could not be computed, so only the first
                      two pairs are read.
                    </p>
                  )}
                  {ageYears !== null &&
                    j.ayur.term === "short" &&
                    ageYears > 32 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        The chart's owner is already past this bracket, which
                        the text itself anticipates: the classification is a
                        rough sort, not a measure.
                      </p>
                    )}
                  {ageYears !== null &&
                    j.ayur.term === "middle" &&
                    ageYears > 66 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        The chart's owner is already past this bracket, which
                        the text itself anticipates: the classification is a
                        rough sort, not a measure.
                      </p>
                    )}
                </CardContent>
              </Card>
            </div>
          </Working>
        )}
      </section>
    </div>
  );
}
