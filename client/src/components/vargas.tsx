import { useState } from "react";
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
                {p.combust && (
                  <span className="text-muted-foreground">
                    {" "}
                    · combust by the Surya Siddhanta orbs under 7.28-29, so 6.53
                    withholds the designation
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

export function VargasSection({ v, name }: { v: VargasResult; name: string }) {
  const [varga, setVarga] = useState<VargaKey>("D9");
  const [scheme, setScheme] = useState<SchemeKey>("shodasa");
  const [open, setOpen] = useState<Planet | null>(null);
  const [caveats, setCaveats] = useState(false);
  const def = VARGA_BY_KEY[varga];
  const chart = v.charts[varga];
  const sch = SCHEMES.find((s) => s.key === scheme)!;
  const sp = v.spouse;
  const plain = usePlain();
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
      </div>
      <button
        className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
        onClick={() => setCaveats((x) => !x)}
        data-testid="varga-caveats"
      >
        {caveats ? "Hide" : "Show"} how chapters 6 and 7 were applied (
        {v.caveats.length} notes)
      </button>
      {caveats && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {v.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
