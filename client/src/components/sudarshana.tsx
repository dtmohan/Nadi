import { Fragment, useState } from "react";
import { DateTime } from "luxon";
import { PLANET_ABBR, SIGN_ABBR, type Planet } from "@shared/astro";
import {
  type ChakraBhava,
  type Placement,
  type Ring,
  type SudarshanaResult,
  type SudarshanaYear,
  type Verdict,
} from "@shared/sudarshana";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlanetName, SignName, planetColor } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { ModeText, SectionTitle, usePlain } from "@/components/mode-text";
import { cn } from "@/lib/utils";

const fmtD = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");
const fmtM = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL");
const fmtY = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");

const VERDICT_LABEL: Record<Verdict, string> = {
  advances: "advances",
  harmed: "harmed",
  mixed: "mixed",
};
const YEAR_LABEL = {
  favourable: "favourable",
  unfavourable: "unfavourable",
  mixed: "mixed",
} as const;

function verdictClass(v: Verdict | SudarshanaYear["verdict"]) {
  return v === "advances" || v === "favourable"
    ? "text-verdict-good"
    : v === "harmed" || v === "unfavourable"
      ? "text-verdict-bad"
      : "text-verdict-mixed";
}
function verdictDot(v: Verdict | SudarshanaYear["verdict"]) {
  return v === "advances" || v === "favourable"
    ? "bg-emerald-500"
    : v === "harmed" || v === "unfavourable"
      ? "bg-rose-500"
      : "bg-amber-500";
}
function verdictFill(v: Verdict) {
  return v === "advances"
    ? "hsl(var(--verdict-good) / 0.14)"
    : v === "harmed"
      ? "hsl(var(--verdict-bad) / 0.14)"
      : "hsl(var(--verdict-mixed) / 0.10)";
}

const RING_LABEL: Record<Ring, string> = {
  Lagna: "inner ring, from the lagna",
  Moon: "middle ring, from the Moon",
  Sun: "outer ring, from the Sun",
};

/** Three concentric rings of twelve bhavas, the 1st at the top and the count running anticlockwise. */
function Chakra({
  s,
  selected,
  onSelect,
}: {
  s: SudarshanaResult;
  selected: number;
  onSelect: (h: number) => void;
}) {
  const C = 230;
  const radii = [44, 106, 168, 226];
  const polar = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
  };
  const arc = (r0: number, r1: number, a0: number, a1: number) => {
    const [x0, y0] = polar(r1, a0);
    const [x1, y1] = polar(r1, a1);
    const [x2, y2] = polar(r0, a1);
    const [x3, y3] = polar(r0, a0);
    return `M${x0},${y0} A${r1},${r1} 0 0 0 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 1 ${x3},${y3} Z`;
  };
  const centreAngle = (h: number) => -90 - (h - 1) * 30;
  const cur = s.currentYear?.house;
  const curM = s.currentMonth?.house;
  return (
    <svg
      viewBox="0 0 460 460"
      className="mx-auto w-full max-w-[26rem]"
      role="img"
      aria-label="Sudarshana chakra"
      data-testid="sudarshana-chakra"
    >
      {s.bhavas.map((b) => {
        const a0 = centreAngle(b.house) + 15;
        const a1 = centreAngle(b.house) - 15;
        const isSel = b.house === selected;
        return (
          <g
            key={b.house}
            className="cursor-pointer"
            onClick={() => onSelect(b.house)}
            data-testid={`sudarshana-sector-${b.house}`}
          >
            {b.cells.map((c, i) => {
              const r0 = radii[i];
              const r1 = radii[i + 1];
              const rm = (r0 + r1) / 2;
              const [tx, ty] = polar(rm, centreAngle(b.house));
              const occ = c.occupants;
              const rows: Planet[][] = [];
              for (let k = 0; k < occ.length; k += 3)
                rows.push(occ.slice(k, k + 3));
              return (
                <g key={c.ring}>
                  <path
                    d={arc(r0, r1, a0, a1)}
                    fill={verdictFill(b.verdict)}
                    stroke={
                      isSel
                        ? "hsl(var(--foreground) / 0.7)"
                        : "hsl(var(--border))"
                    }
                    strokeWidth={isSel ? 1.5 : 0.75}
                  />
                  <text
                    x={tx}
                    y={ty - (rows.length ? 6 + (rows.length - 1) * 5 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fill="hsl(var(--muted-foreground))"
                    className="font-mono"
                  >
                    {SIGN_ABBR[c.signIndex]}
                  </text>
                  {rows.map((row, ri) => (
                    <text
                      key={ri}
                      x={tx}
                      y={ty + 6 + ri * 11 - (rows.length - 1) * 5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {row.map((p, pi) => (
                        <tspan key={p} fill={planetColor(p)} dx={pi ? 3 : 0}>
                          {PLANET_ABBR[p]}
                        </tspan>
                      ))}
                    </text>
                  ))}
                </g>
              );
            })}
            {(() => {
              const [nx, ny] = polar(radii[0] - 14, centreAngle(b.house));
              return (
                <text
                  x={nx}
                  y={ny}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill={
                    isSel
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted-foreground))"
                  }
                  className="font-mono"
                >
                  {b.house}
                </text>
              );
            })()}
            {cur === b.house && (
              <path
                d={arc(radii[3] + 3, radii[3] + 6, a0, a1)}
                fill="hsl(var(--primary))"
                data-testid="sudarshana-year-marker"
              />
            )}
            {curM === b.house && curM !== cur && (
              <path
                d={arc(radii[3] + 3, radii[3] + 6, a0, a1)}
                fill="hsl(var(--primary) / 0.45)"
                data-testid="sudarshana-month-marker"
              />
            )}
          </g>
        );
      })}
      <text
        x={C}
        y={C - 4}
        textAnchor="middle"
        fontSize={8}
        fill="hsl(var(--muted-foreground))"
        className="font-mono"
      >
        L · Mo · Su
      </text>
      <text
        x={C}
        y={C + 7}
        textAnchor="middle"
        fontSize={7}
        fill="hsl(var(--muted-foreground))"
      >
        in to out
      </text>
    </svg>
  );
}

function PlacementList({ items }: { items: Placement[] }) {
  if (!items.length) return <span className="text-muted-foreground">none</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-0.5">
      {items.map((x, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 whitespace-nowrap"
          title={x.note}
        >
          <PlanetName planet={x.planet} abbr />
          <span className="text-muted-foreground">
            {x.ring === "Lagna" ? "L" : x.ring === "Moon" ? "Mo" : "Su"}
          </span>
        </span>
      ))}
    </span>
  );
}

function BhavaDetail({ b, s }: { b: ChakraBhava; s: SudarshanaResult }) {
  const notes = [
    ...b.benefics,
    ...b.malefics,
    ...b.neutrals,
    ...b.beneficAspects,
    ...b.maleficAspects,
  ]
    .filter((x) => x.note)
    .reduce<Placement[]>(
      (acc, x) =>
        acc.some((y) => y.planet === x.planet && y.note === x.note)
          ? acc
          : [...acc, x],
      [],
    );
  return (
    <div
      className="rounded-md border p-3 text-sm"
      data-testid={`sudarshana-bhava-${b.house}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold">Bhava {b.house}</div>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            verdictClass(b.verdict),
          )}
        >
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              verdictDot(b.verdict),
            )}
            aria-hidden
          />
          {VERDICT_LABEL[b.verdict]}
        </div>
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {b.cells.map((c) => (
          <li
            key={c.ring}
            className="flex flex-wrap items-center gap-x-2 gap-y-0.5"
          >
            <span className="w-24 shrink-0 text-muted-foreground">
              {RING_LABEL[c.ring].split(",")[0]}
            </span>
            <SignName signIndex={c.signIndex} />
            <span className="text-muted-foreground">lord</span>
            <PlanetName planet={c.lord} abbr />
            {c.occupants.length > 0 && (
              <>
                <span className="text-muted-foreground">holds</span>
                {c.occupants.map((p) => (
                  <PlanetName key={p} planet={p} abbr />
                ))}
              </>
            )}
            {c.aspects.length > 0 && (
              <>
                <span className="text-muted-foreground">aspected by</span>
                {c.aspects.map((a) => (
                  <span
                    key={a.planet}
                    className="inline-flex items-center gap-0.5"
                  >
                    <PlanetName planet={a.planet} abbr />
                    <span className="text-muted-foreground tabular-nums">
                      {a.quarters}
                    </span>
                  </span>
                ))}
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{b.text}</p>
      <div className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Benefics: </span>
          <PlacementList items={[...b.benefics, ...b.beneficAspects]} />
        </div>
        <div>
          <span className="text-muted-foreground">Malefics: </span>
          <PlacementList items={[...b.malefics, ...b.maleficAspects]} />
        </div>
        {b.neutrals.length > 0 && (
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Set aside: </span>
            <PlacementList items={b.neutrals} />
          </div>
        )}
      </div>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          {notes.map((x, i) => (
            <li key={i}>
              {x.planet}: {x.note}.
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        <SourceLink source={s.sources.bhava} />{" "}
        {b.basis === "strength" && (
          <SourceLink source={s.sources.tieStrength} />
        )}
        {b.basis === "lord" && <SourceLink source={s.sources.lordFallback} />}
      </p>
    </div>
  );
}

export function SudarshanaSection({ s }: { s: SudarshanaResult }) {
  const plain = usePlain();
  const [sel, setSel] = useState<number>(s.currentYear?.house ?? 1);
  const [yearOpen, setYearOpen] = useState<number | null>(null);
  const b = s.bhavas.find((x) => x.house === sel)!;
  const src = s.sources;
  return (
    <div data-testid="parashari-sudarshana">
      <SectionTitle
        plain="The three-ring wheel"
        technical="Sudarshana chakra"
        term="sudarshana"
      />
      <ModeText
        plain={
          <>
            The same twelve houses drawn three times: from the rising sign, from
            the Moon and from the Sun, one inside the other. Each house is
            judged by the helpful and harsh planets sitting in or looking at its
            three signs, and each house then rules one year of life in turn, and
            one month inside each year.
          </>
        }
        practitioner={
          <>
            Three circles of twelve bhavas from the lagna, the Moon and the Sun,{" "}
            <SourceLink source={src.drawing} />; the lagna, Moon and Sun each
            stand for the first bhava, the Sun is auspicious only there, and an
            exalted malefic does no harm, <SourceLink source={src.reading} />. A
            bhava advances under a benefic or its lord and suffers under a
            malefic, by majority, then by strength, then by its lord,{" "}
            <SourceLink source={src.bhava} />; a planet's saptavarga standing
            can cancel its natural class, <SourceLink source={src.vargas} />.
            Aspects follow the floor set in the bhavas table above.
          </>
        }
      />
      <p
        className={cn(
          "mt-2 rounded-md border px-3 py-2 text-xs",
          s.applicable
            ? "text-muted-foreground"
            : "border-amber-500/40 bg-amber-500/5",
        )}
        data-testid="sudarshana-applicability"
        data-applicable={s.applicable}
      >
        {s.applicabilityText} <SourceLink source={src.applicability} />
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,26rem)_1fr] md:items-start">
        <div>
          <Chakra s={s} selected={sel} onSelect={setSel} />
          <p className="mt-1 text-center text-2xs text-muted-foreground">
            Inner ring from the lagna, middle from the Moon, outer from the Sun.
            Bhava 1 at the top, counting anticlockwise. Tint shows the bhava's
            verdict; the outer mark is the current year's bhava
            {s.currentMonth && s.currentMonth.house !== s.currentYear?.house
              ? ", the paler mark the current month's"
              : ""}
            . Select a bhava for its working.
          </p>
        </div>
        <BhavaDetail b={b} s={s} />
      </div>

      <div className="mt-6">
        <SectionTitle
          as="h4"
          plain="Year by year"
          technical="Bhava dasa of the chakra"
          className="text-xs"
        />
        <ModeText
          plain={
            <>
              From birth, each house rules one year in turn, so the cycle
              repeats every twelve years; inside a year each house rules one
              month. A year goes well when helpful planets stand in good places
              from that year's house, and badly when they fall in its 6th or
              12th or when the house itself holds only Rahu or Ketu or more
              harsh planets than helpful ones. The house's own verdict from the
              wheel leads, and the points table is the second opinion.
            </>
          }
          practitioner={
            <>
              Each bhava from the 1st rules one year and, within a year, one
              month, repeating through the 120 years,{" "}
              <SourceLink source={src.dasa} />. Benefics in the 1st, 4th, 5th,
              7th, 8th, 9th or 10th from the year-lagna favour the year;
              benefics in its 6th or 12th, a year-lagna held only by a node, or
              one holding more malefics than benefics, work against it; malefics
              in its 3rd, 6th and 11th are auspicious,{" "}
              <SourceLink source={src.effects} />. The year-lagna bhava's own
              verdict leads; the tally confirms it or, when it contradicts,
              softens the year to mixed <SourceLink source={src.yearRules} />.
              The Sarvashtakavarga of the year-lagna's sign is read beside it:
              full effect where both agree, weighed where they differ,{" "}
              <SourceLink source={src.av} />.
            </>
          }
        />
        <Table className="mt-2" data-testid="sudarshana-years">
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 sm:px-4">Age</TableHead>
              <TableHead className="hidden px-2 sm:table-cell sm:px-4">
                Period
              </TableHead>
              <TableHead className="px-2 sm:px-4">Year-lagna</TableHead>
              <TableHead className="px-2 sm:px-4">Chakra</TableHead>
              <TableHead className="px-2 text-right sm:px-4">Rekhas</TableHead>
              <TableHead className="hidden px-2 sm:table-cell sm:px-4">
                Agreement
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {s.years.map((y) => {
              const open = yearOpen === y.age;
              const lagnaCell = s.bhavas[y.house - 1].cells[0];
              return (
                <Fragment key={y.age}>
                  <TableRow
                    className={cn(
                      "cursor-pointer",
                      y.current && "bg-primary/5 font-medium",
                    )}
                    onClick={() => setYearOpen(open ? null : y.age)}
                    data-testid={`sudarshana-year-${y.age}`}
                    data-current={y.current}
                  >
                    <TableCell className="px-2 tabular-nums sm:px-4">
                      {y.age}
                      <div className="text-2xs text-muted-foreground sm:hidden">
                        {fmtY(y.start)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-2 text-xs tabular-nums text-muted-foreground sm:table-cell sm:px-4">
                      {fmtD(y.start)} – {fmtD(y.end)}
                    </TableCell>
                    <TableCell className="px-2 sm:px-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="tabular-nums">{y.house}</span>
                        <SignName signIndex={lagnaCell.signIndex} abbr />
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-2 text-xs sm:px-4",
                        verdictClass(y.verdict),
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-block h-2 w-2 rounded-full",
                            verdictDot(y.verdict),
                          )}
                          aria-hidden
                        />
                        {YEAR_LABEL[y.verdict]}
                      </span>
                      <div className="text-2xs text-muted-foreground">
                        bhava {VERDICT_LABEL[s.bhavas[y.house - 1].verdict]} ·
                        tally{" "}
                        <span className="tabular-nums">
                          +{y.plus} −{y.minus}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 text-right text-xs tabular-nums sm:px-4">
                      {y.av.rekhas}{" "}
                      <span className="text-muted-foreground">{y.av.band}</span>
                    </TableCell>
                    <TableCell className="hidden px-2 text-xs text-muted-foreground sm:table-cell sm:px-4">
                      {y.agreement === "agree"
                        ? "agree: full effect"
                        : y.agreement === "differ"
                          ? "differ: weigh both"
                          : "open"}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="bg-muted/30">
                      <TableCell
                        colSpan={6}
                        className="px-2 py-2 text-xs sm:px-4"
                        data-testid={`sudarshana-year-detail-${y.age}`}
                      >
                        {y.favourable.length > 0 && (
                          <p>
                            <span className="text-verdict-good">For: </span>
                            {y.favourable.join("; ")}.
                          </p>
                        )}
                        {y.unfavourable.length > 0 && (
                          <p className={y.favourable.length ? "mt-1" : ""}>
                            <span className="text-verdict-bad">Against: </span>
                            {y.unfavourable.join("; ")}.
                          </p>
                        )}
                        {!y.favourable.length && !y.unfavourable.length && (
                          <p>
                            None of the 74.24-26 conditions applies; the year is
                            read from its bhava alone.
                          </p>
                        )}
                        {y.current && s.months.length > 0 && (
                          <div className="mt-2">
                            <div className="text-muted-foreground">
                              Months of this year (bhava ruling each twelfth):
                            </div>
                            <div
                              className="mt-1 flex flex-wrap gap-1"
                              data-testid="sudarshana-months"
                            >
                              {s.months.map((m) => (
                                <span
                                  key={m.index}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 tabular-nums",
                                    m.current &&
                                      "border-primary bg-primary/10 font-medium",
                                  )}
                                  title={`${fmtM(m.start)} – ${fmtM(m.end)}: ${[...m.favourable, ...m.unfavourable].join("; ") || "no 74.24-26 condition"}`}
                                  data-testid={`sudarshana-month-${m.index}`}
                                  data-current={m.current}
                                >
                                  <span
                                    className={cn(
                                      "inline-block h-1.5 w-1.5 rounded-full",
                                      verdictDot(m.verdict),
                                    )}
                                    aria-hidden
                                  />
                                  {fmtM(m.start)} · {m.house}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
        <p className="mt-1 text-2xs text-muted-foreground">
          Showing the twelve-year cycle in progress; the sequence repeats
          through 120 years. Select a year for its working
          {s.currentYear ? " and, for the current year, its months" : ""}.
        </p>
      </div>

      {!plain && (
        <div
          className="mt-3 text-xs text-muted-foreground"
          data-testid="sudarshana-caveats"
        >
          <div className="font-medium">Conventions marked provisional</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {s.caveats.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <p className="mt-1">
            <SourceLink source={src.ringCount} />{" "}
            <SourceLink source={src.yearStart} />{" "}
            <SourceLink source={src.avMapping} />
          </p>
        </div>
      )}
    </div>
  );
}
