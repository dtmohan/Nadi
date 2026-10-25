import { useState } from "react";
import { Soft } from "@/lib/gentle";
import { SIGNS, type Planet } from "@shared/astro";
import {
  VARGAS,
  VARGA_BY_KEY,
  SCHEMES,
  VISWA,
  type VargasResult,
  type VargaKey,
  type SchemeKey,
  type PlanetVargas,
  type SchemeScore,
} from "@shared/vargas";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { PlanetName, SignName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { BjCross } from "@/components/bj-cross";
import { BJ_CROSS_BY_KEY } from "@shared/bj-cross";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ModeText, SectionTitle, usePlain } from "@/components/mode-text";
import {
  crossedBy,
  fmtMin,
  restOn,
  timeRestText,
  type LagnaWindows,
} from "@shared/time-windows";
import {
  VargaHouses,
  VargaMeaningBox,
  VargaOverview,
} from "@/components/varga-meanings";
import { Expander, HOW_COMPUTED } from "@/components/working";

const BAND_PILL: Record<SchemeScore["band"], string> = {
  "wholly favourable": "bg-verdict-good/15 text-verdict-good",
  middling: "bg-verdict-mixed/15 text-verdict-mixed",
  "some good": "bg-muted text-muted-foreground",
  "below five": "bg-verdict-bad/10 text-verdict-bad",
};

const ord = (n: number) =>
  `${n}${["th", "st", "nd", "rd"][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

function Pill({
  active,
  onClick,
  children,
  testid,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      aria-pressed={active}
      className={cn(
        "rounded px-1.5 py-0.5 text-xs font-medium tabular-nums transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}

function VargaRow({
  p,
  varga,
  scheme,
  open,
  toggle,
}: {
  p: PlanetVargas;
  varga: VargaKey;
  scheme: SchemeKey;
  open: boolean;
  toggle: () => void;
}) {
  const sc = p.vimsopaka?.find((s) => s.scheme === scheme);
  const des = p.designation?.[scheme];
  const seven = !!p.vimsopaka;
  return (
    <>
      <TableRow
        className={cn(seven && "cursor-pointer")}
        onClick={seven ? toggle : undefined}
        data-testid={`varga-row-${p.planet}`}
        aria-expanded={seven ? open : undefined}
      >
        <TableCell className="px-2 py-1.5 sm:px-4">
          <PlanetName planet={p.planet} />
        </TableCell>
        <TableCell className="hidden px-2 py-1.5 sm:table-cell sm:px-4">
          <SignName signIndex={p.signs.D1} />
        </TableCell>
        <TableCell className="px-2 py-1.5 sm:px-4">
          <SignName signIndex={p.signs[varga]} />
          {varga === "D9" && p.vargottama && (
            <span className="ml-1.5 whitespace-nowrap rounded bg-primary/10 px-1 py-0.5 text-2xs font-medium text-primary">
              vargottama
            </span>
          )}
        </TableCell>
        <TableCell className="px-2 py-1.5 text-right tabular-nums sm:px-4">
          {sc ? sc.total.toFixed(1) : "—"}
        </TableCell>
        <TableCell className="px-2 py-1.5 sm:px-4">
          {sc && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium sm:whitespace-nowrap",
                BAND_PILL[sc.band],
              )}
            >
              {sc.band}
            </span>
          )}
        </TableCell>
      </TableRow>
      {open && sc && (
        <TableRow data-testid={`varga-detail-${p.planet}`}>
          <TableCell colSpan={5} className="bg-muted/30 px-2 py-2 sm:px-4">
            {des && (
              <p
                className="mb-1.5 text-xs"
                data-testid={`varga-designation-${p.planet}`}
              >
                Good vargas (6.42-53): {des.good} of {sc.cells.length}
                {des.name
                  ? `, ${des.name}`
                  : des.good < 2
                    ? ", no designation"
                    : ""}
                {p.excluded && p.excluded.length > 0 && (
                  <span
                    className="text-muted-foreground"
                    data-testid={`varga-excluded-${p.planet}`}
                  >
                    {" "}
                    · {p.excluded.join(", ")}
                    {p.combust ? " (Surya Siddhanta orbs, 9.6-9)" : ""},
                    so 6.53 withholds the designation
                  </span>
                )}
              </p>
            )}
            <ul className="grid grid-cols-[2.5rem_6rem_minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 text-xs tabular-nums">
              {sc.cells.map((c) => (
                <li key={c.varga} className="contents">
                  <span className="font-medium">{c.varga}</span>
                  <span>{SIGNS[c.signIndex]}</span>
                  <span className="truncate text-muted-foreground">
                    {c.lord === p.planet
                      ? "own sign"
                      : `${c.lord}, ${c.relation}`}
                  </span>
                  <span className="whitespace-nowrap text-right text-muted-foreground">
                    {c.weight} × {VISWA[c.relation]}/20 = {c.score.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function VargasSection({
  v,
  name,
  windows,
  band = 0,
  withheld = false,
}: {
  v: VargasResult;
  name: string;
  /** Minutes either side of the recorded birth time over which each lagna keeps its sign. */
  windows?: LagnaWindows;
  /** The chart's stated birth-time uncertainty, minutes either way. */
  band?: number;
  /** The age gate: a minor's chart hides the lines it flags. */
  withheld?: boolean;
}) {
  const [varga, setVarga] = useState<VargaKey>("D9");
  const [scheme, setScheme] = useState<SchemeKey>("shodasa");
  const [open, setOpen] = useState<Planet | null>(null);
  const def = VARGA_BY_KEY[varga];
  const chart = v.charts[varga];
  const sch = SCHEMES.find((s) => s.key === scheme)!;
  const sp = v.spouse;
  const plain = usePlain();
  const win = windows?.[varga];
  const d9Rest = restOn("D9", "the navamsa lagna", windows, band);
  return (
    <div className="mt-8" data-testid="parashari-vargas">
      <SectionTitle
        plain="Finer charts and how comfortably each planet sits"
        technical="Divisional charts and Vimsopaka strength"
        term="varga"
      />
      <ModeText
        plain={
          <>
            Each sign can be cut into finer pieces, and each cut gives a new
            chart that speaks to one area of life: the ninth-cut (navamsa, shown
            first) to marriage, the seventh to children, the tenth to career,
            the twelfth to parents. Pick a cut to see its chart. The score out
            of 20 says how comfortably a planet sits across all the cuts: above
            15 wholly favourable, 10 to 15 middling, 5 to 10 some good, below 5
            nothing. Open a row for the working.
          </>
        }
        practitioner={
          <>
            The sixteen divisions of a sign from{" "}
            <SourceLink source={v.sources.divisions} />, each read for the
            matter <SourceLink source={v.sources.uses} /> assigns it: the
            navamsa for the spouse, saptamsa for children, dasamsa for position,
            dvadasamsa for parents. The strength column is the twenty-point
            Vimsopaka of <SourceLink source={v.sources.vimsopaka} />: each
            division's weight in the chosen scheme, kept whole in the planet's
            own sign and reduced with the planet's compound relationship to the
            division's lord. Below five gives nothing auspicious, five to ten
            some good, up to fifteen middling, above fifteen wholly favourable
            (7.26-27). Open a row for the working.
          </>
        }
      />
      <div className="mt-3 flex flex-wrap gap-1" data-testid="varga-picker">
        {VARGAS.map((d) => (
          <Pill
            key={d.key}
            active={varga === d.key}
            onClick={() => setVarga(d.key)}
            testid={`varga-pick-${d.key}`}
          >
            {d.key}
          </Pill>
        ))}
      </div>
      <VargaOverview current={varga} onPick={setVarga} withheld={withheld} />
      <div className="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <div>
          <SouthIndianChart
            positions={chart.positions}
            title={name}
            subtitle={`${def.name} (${def.key}) · ${def.matter}`}
            lagnaSign={chart.lagnaSign}
            footer={`Lagna ${SIGNS[chart.lagnaSign]} · houses from the ${def.name} lagna`}
          />
          <p
            className="mt-2 text-xs text-muted-foreground"
            data-testid="varga-def"
          >
            <SourceLink source={def.source} />
            {def.cross && BJ_CROSS_BY_KEY[def.cross] && (
              <>
                {" "}
                · also <BjCross c={BJ_CROSS_BY_KEY[def.cross]} />
              </>
            )}
            {def.note && <> · {def.note}</>}
          </p>
          {win && (
            <p
              className={cn(
                "mt-1 text-xs",
                crossedBy(win, band)
                  ? "text-verdict-mixed"
                  : "text-muted-foreground",
              )}
              data-testid="varga-lagna-window"
            >
              {plain ? "This chart's rising sign" : `The ${def.key} lagna`}{" "}
              holds from {fmtMin(win.before, win.beforeCapped)} before to{" "}
              {fmtMin(win.after, win.afterCapped)} after the recorded birth time
              {crossedBy(win, band)
                ? `, so the stated ±${band}-minute band could change it.`
                : "."}
            </p>
          )}
          <VargaMeaningBox varga={varga} withheld={withheld} />
        </div>
        <div>
          <div
            className="flex flex-wrap items-center gap-1 text-xs"
            data-testid="scheme-picker"
          >
            <span className="mr-1 text-muted-foreground">Scheme</span>
            {SCHEMES.map((s) => (
              <Pill
                key={s.key}
                active={scheme === s.key}
                onClick={() => setScheme(s.key)}
                testid={`scheme-pick-${s.key}`}
              >
                {s.name}
              </Pill>
            ))}
            <span className="ml-1 text-muted-foreground">
              <SourceLink source={sch.source} />
            </span>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <Table className="mt-2" data-testid="varga-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2 sm:px-4">Planet</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {plain ? "Birth chart" : "Rasi"}
                  </TableHead>
                  <TableHead className="px-2 sm:px-4">{def.name}</TableHead>
                  <TableHead className="px-2 text-right sm:px-4">
                    <span className="sm:hidden">Points</span>
                    <span className="hidden sm:inline">
                      {plain ? "Score / 20" : "Vimsopaka"}
                    </span>
                  </TableHead>
                  <TableHead className="px-2 sm:px-4">
                    {plain ? "Reading" : "Verdict (7.26-27)"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {v.planets.map((p) => (
                  <VargaRow
                    key={p.planet}
                    p={p}
                    varga={varga}
                    scheme={scheme}
                    open={open === p.planet}
                    toggle={() => setOpen(open === p.planet ? null : p.planet)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <VargaHouses varga={varga} chart={chart} withheld={withheld} />
      <div
        className="mt-4 rounded-md border bg-card p-3 text-xs"
        data-testid="varga-spouse"
      >
        <SectionTitle
          as="h4"
          plain="Marriage, from the ninth-cut chart"
          technical="Spouse from the navamsa"
          term="navamsa"
        />
        <p className="mt-1">
          <SourceLink source={v.sources.uses} /> reads the spouse from the
          navamsa. The navamsa lagna is <SignName signIndex={v.lagna.D9} />, so
          the 7th falls in <SignName signIndex={sp.seventhSign} />
          {sp.occupants.length > 0 ? (
            <>
              , holding{" "}
              {sp.occupants.map((p, i) => (
                <span key={p}>
                  {i > 0 && ", "}
                  <PlanetName planet={p} />
                </span>
              ))}
            </>
          ) : (
            ", empty"
          )}
          . Its lord <PlanetName planet={sp.seventhLord} /> stands in{" "}
          <SignName signIndex={sp.lordSign} />, the {ord(sp.lordHouse)} of the
          navamsa. Venus, karaka of the matter, is in{" "}
          <SignName signIndex={sp.venusSign} /> there, its {sp.venusRelation}.
          The chapter closes by saying the lord of a bhava counts as much as the
          bhava; it gives no further weighing, so this is a placement report
          rather than a verdict.
        </p>
        {d9Rest && (
          <p
            className={cn(
              "mt-1",
              d9Rest.sensitive ? "text-verdict-mixed" : "text-muted-foreground",
            )}
            data-testid="varga-spouse-time"
          >
            {timeRestText(d9Rest, band)}
          </p>
        )}
      </div>
      {windows && (
        <div
          className="mt-4 rounded-md border bg-card p-3 text-xs"
          data-testid="varga-time-windows"
        >
          <SectionTitle
            as="h4"
            plain="How much the birth time matters"
            technical="Lagna windows around the birth time"
            term="varga"
          />
          <p className="mt-1 text-muted-foreground">
            {plain ? (
              <>
                The rising sign of a finer chart changes faster than the birth
                chart's: the ninth-cut chart's about nine times as fast. These
                are the minutes before and after the recorded time during which
                each chart keeps its rising sign.
              </>
            ) : (
              <>
                In the D-n chart the lagna moves n times as fast as in the rasi.
                These are the minutes either side of the recorded time over
                which each divisional lagna keeps its sign, from the ephemeris.
                Readings of a chart's houses rest on its window; a planet's own
                divisional placement moves far more slowly.
              </>
            )}{" "}
            {band > 0
              ? `Rows marked "in band" change inside the stated ±${band}-minute band.`
              : "No time uncertainty is recorded for this chart; set one in the chart settings to mark the charts it could change."}
          </p>
          <div className="min-w-0 overflow-x-auto">
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2 sm:px-4">Chart</TableHead>
                  <TableHead className="whitespace-nowrap px-2 text-right sm:px-4">
                    Before, min
                  </TableHead>
                  <TableHead className="whitespace-nowrap px-2 text-right sm:px-4">
                    After, min
                  </TableHead>
                  <TableHead className="hidden px-2 sm:table-cell sm:px-4">
                    {plain ? "Rising sign" : "Lagna"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {VARGAS.map((d) => {
                  const w = windows[d.key];
                  if (!w) return null;
                  const hit = crossedBy(w, band);
                  return (
                    <TableRow
                      key={d.key}
                      className={cn(hit && "bg-verdict-mixed/10")}
                      data-testid={`varga-window-${d.key}`}
                    >
                      <TableCell className="px-2 py-1 sm:px-4">
                        <span className="font-medium">{d.key}</span>{" "}
                        <span className="hidden text-muted-foreground sm:inline">
                          {d.name}
                        </span>
                        {hit && (
                          <span className="ml-1 whitespace-nowrap text-verdict-mixed">
                            in band
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 text-right tabular-nums sm:px-4">
                        {w.beforeCapped ? `> ${Math.round(w.before)}` : w.before >= 100 ? Math.round(w.before) : w.before.toFixed(1)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1 text-right tabular-nums sm:px-4">
                        {w.afterCapped ? `> ${Math.round(w.after)}` : w.after >= 100 ? Math.round(w.after) : w.after.toFixed(1)}
                      </TableCell>
                      <TableCell className="hidden px-2 py-1 sm:table-cell sm:px-4">
                        {SIGNS[v.lagna[d.key]]}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      <Expander
        testId="varga-caveats"
        label={HOW_COMPUTED}
        count={v.caveats.length}
        className="mt-2"
        contentClassName=""
      >
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {v.caveats.map((c, i) => (
            <li key={i}><Soft>{c}</Soft></li>
          ))}
        </ul>
      </Expander>
    </div>
  );
}
