import { GentleNote } from "@/lib/gentle";
import {
  formatYears,
  REDUCTION_LABEL,
  type AyurdayaResult,
  type AyurPlanet,
  type Reduction,
} from "@shared/ayurdaya";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlanetName, SignName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { ModeText, SectionTitle } from "@/components/mode-text";
import { cn } from "@/lib/utils";

function ReductionNote({ list }: { list: Reduction[] }) {
  if (!list.length) return <span className="text-muted-foreground">none</span>;
  return (
    <span>
      {list.map((r, i) => (
        <span
          key={i}
          className={cn(
            "block",
            r.applied ? "" : "text-muted-foreground line-through",
            r.fraction === 0 && "text-muted-foreground no-underline",
          )}
          style={r.fraction === 0 ? { textDecoration: "none" } : undefined}
          title={REDUCTION_LABEL[r.kind]}
        >
          {r.note}
        </span>
      ))}
    </span>
  );
}

/** Span of life, Brihat Jataka adhyaya 7. */
export function AyurdayaSection({
  a,
  ageYears,
  otherEstimates,
}: {
  a: AyurdayaResult;
  /** Age at the as-of date, in years, when the birth date is known. */
  ageYears?: number;
  otherEstimates?: { label: string; value: string }[];
}) {
  const src = a.sources;
  const rows = a.planets;
  const below = (total: number) => ageYears !== undefined && total < ageYears;
  return (
    <div data-testid="parashari-ayurdaya">
      <SectionTitle
        plain="How long the life runs"
        technical="Ayurdaya (Brihat Jataka 7)"
        term="bj-ayurdaya"
      />
      <GentleNote testId="ayurdaya-gentle-note" />
      <ModeText
        plain={
          <>
            Varahamihira adds up years granted by each of the seven planets and
            by the rising sign. In the first method a planet gives most when it
            stands at its strongest degree and half that at its weakest; in the
            second, preferred by Varahamihira, a planet gives as many years as
            the ninth-parts of the zodiac it has passed through, doubled or
            trebled in favourable places. Both totals are then cut for planets
            weakened by the Sun, by an enemy's sign or by standing in the houses
            behind the horizon. The results are estimates of the whole span, not
            predictions of a date.
          </>
        }
        practitioner={
          <>
            Pindayu from the exaltation years 19, 25, 15, 12, 15, 21, 20,{" "}
            <SourceLink source={src.v1} />, halved at debilitation and
            proportioned between, with the lagna's share and the enemy's-sign
            and combustion losses of <SourceLink source={src.v2} />, the
            chakrapata losses of <SourceLink source={src.v3} /> and the
            krurodaya cut on the total in <SourceLink source={src.v4} />. Amsayu
            after Satya: navamsas passed as years,{" "}
            <SourceLink source={src.v9} /> and <SourceLink source={src.v10} />,
            trebled when exalted or retrograde and doubled in vargottama, own
            navamsa, own sign or own drekkana, <SourceLink source={src.v11} />,
            the lagna by signs when strong under{" "}
            <SourceLink source={src.v119} /> and no krurodaya,{" "}
            <SourceLink source={src.v12} />, only the largest multiplier
            counting, <SourceLink source={src.v13} />. Checked against{" "}
            <SourceLink source={src.iyer} />, the Sanskrit of{" "}
            <SourceLink source={src.adyar} /> and Parashara's parallel in{" "}
            <SourceLink source={src.bphsYears} /> and{" "}
            <SourceLink source={src.bphsReductions} />.
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <div data-testid="ayur-total-pinda">
          <span className="text-muted-foreground">Pindayu </span>
          <span className="font-medium tabular-nums">
            {formatYears(a.pinda.total)}
          </span>
          {below(a.pinda.total) && (
            <span className="ml-1 text-muted-foreground">
              (already exceeded)
            </span>
          )}
        </div>
        <div data-testid="ayur-total-amsa">
          <span className="text-muted-foreground">Amsayu </span>
          <span className="font-medium tabular-nums">
            {formatYears(a.amsa.total)}
          </span>
          {below(a.amsa.total) && (
            <span className="ml-1 text-muted-foreground">
              (already exceeded)
            </span>
          )}
        </div>
        {ageYears !== undefined && (
          <div className="text-muted-foreground" data-testid="ayur-age">
            Present age {formatYears(ageYears)}
          </div>
        )}
        {otherEstimates?.map((o) => (
          <div key={o.label} className="text-muted-foreground">
            {o.label} <span className="tabular-nums">{o.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs font-medium">
        Pindayu, years from the exaltation degree
      </div>
      <Table
        className="mt-1 text-xs max-sm:[&_td]:px-2 max-sm:[&_th]:px-2"
        data-testid="ayur-pinda"
      >
        <TableHeader>
          <TableRow>
            <TableHead>Planet</TableHead>
            <TableHead className="hidden sm:table-cell">Stands in</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              At exaltation
            </TableHead>
            <TableHead className="text-right">Proportioned</TableHead>
            <TableHead className="w-2/5 min-w-[9rem]">Reduction</TableHead>
            <TableHead className="text-right">Years</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p: AyurPlanet) => (
            <TableRow key={p.planet} data-testid={`ayur-row-pinda-${p.planet}`}>
              <TableCell className="whitespace-nowrap">
                <PlanetName planet={p.planet} />
                {p.retrograde && (
                  <span className="ml-1 text-muted-foreground">(R)</span>
                )}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap sm:table-cell">
                <SignName signIndex={p.signIndex} abbr />, house {p.house}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-right tabular-nums sm:table-cell">
                {p.pinda.base}
              </TableCell>
              <TableCell
                className="whitespace-nowrap text-right tabular-nums"
                title={`${p.pinda.fromDebilitation.toFixed(1)}° from the debilitation point`}
              >
                {formatYears(p.pinda.proportioned)}
              </TableCell>
              <TableCell>
                <ReductionNote list={p.pinda.reductions} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums font-medium">
                {formatYears(p.pinda.final)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow data-testid="ayur-row-pinda-lagna">
            <TableCell>Lagna</TableCell>
            <TableCell className="hidden whitespace-nowrap sm:table-cell">
              <SignName signIndex={a.lagna.signIndex} abbr />{" "}
              {a.lagna.degInSign.toFixed(2)}°
            </TableCell>
            <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
              —
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <span className="whitespace-nowrap">
                {formatYears(a.lagna.navamsasRisen)}
              </span>{" "}
              /{" "}
              <span className="whitespace-nowrap">
                {formatYears(a.lagna.signsFromAries)}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              Takes {a.lagna.pindaChoiceNote}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right tabular-nums font-medium">
              {formatYears(a.lagna.pindaYears)}
            </TableCell>
          </TableRow>
          <TableRow data-testid="ayur-row-krurodaya">
            <TableCell colSpan={2} className="text-muted-foreground">
              Sum {formatYears(a.pinda.subtotal)}. Krurodaya, 7.4:{" "}
              {a.pinda.krurodaya.malefics.length ? (
                <>
                  {a.pinda.krurodaya.malefics.map((m, i) => (
                    <span key={m}>
                      {i > 0 && ", "}
                      <PlanetName planet={m} />
                    </span>
                  ))}{" "}
                  in the lagna, so the sum loses navamsas-from-Aries over 108
                  {a.pinda.krurodaya.aspectedBy.length ? (
                    <>
                      , halved for the aspect of{" "}
                      {a.pinda.krurodaya.aspectedBy.map((m, i) => (
                        <span key={m}>
                          {i > 0 && ", "}
                          <PlanetName planet={m} />
                        </span>
                      ))}
                    </>
                  ) : null}
                  : {(a.pinda.krurodaya.fraction * 100).toFixed(1)}%. The other
                  reading, navamsas risen in the sign over 108, would take{" "}
                  {(a.pinda.krurodaya.altFraction * 100).toFixed(1)}%.
                </>
              ) : (
                "no malefic in the lagna, so nothing is cut from the sum."
              )}
            </TableCell>
            <TableCell className="hidden sm:table-cell" />
            <TableCell className="hidden sm:table-cell" />
            <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
              {a.pinda.krurodaya.years
                ? `-${formatYears(a.pinda.krurodaya.years)}`
                : ""}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right tabular-nums font-medium">
              {formatYears(a.pinda.total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="mt-5 text-xs font-medium">
        Amsayu, years from the navamsas passed (Satya)
      </div>
      <Table
        className="mt-1 text-xs max-sm:[&_td]:px-2 max-sm:[&_th]:px-2"
        data-testid="ayur-amsa"
      >
        <TableHeader>
          <TableRow>
            <TableHead>Planet</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Navamsas
            </TableHead>
            <TableHead className="text-right">Years</TableHead>
            <TableHead>Multiplier</TableHead>
            <TableHead className="w-2/5 min-w-[9rem]">Reduction</TableHead>
            <TableHead className="text-right">Years</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p: AyurPlanet) => (
            <TableRow key={p.planet} data-testid={`ayur-row-amsa-${p.planet}`}>
              <TableCell className="whitespace-nowrap">
                <PlanetName planet={p.planet} />
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-right tabular-nums sm:table-cell">
                {p.amsa.navamsas.toFixed(2)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">
                {formatYears(p.amsa.base)}
              </TableCell>
              <TableCell>
                {p.amsa.multiplier === 1 ? (
                  <span className="text-muted-foreground">none</span>
                ) : (
                  <>
                    <span className="font-medium">
                      x{p.amsa.multiplier}, {formatYears(p.amsa.multiplied)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {p.amsa.multiplierReasons.join(", ")}
                    </span>
                  </>
                )}
              </TableCell>
              <TableCell>
                <ReductionNote list={p.amsa.reductions} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums font-medium">
                {formatYears(p.amsa.final)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow data-testid="ayur-row-amsa-lagna">
            <TableCell>Lagna</TableCell>
            <TableCell className="hidden whitespace-nowrap text-right tabular-nums sm:table-cell">
              {((a.lagna.lon * 108) / 360).toFixed(2)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right tabular-nums">
              {formatYears(a.lagna.navamsasFromAries)}
            </TableCell>
            <TableCell colSpan={2} className="text-muted-foreground">
              {a.lagna.strong ? (
                <>
                  The rising sign is strong under 1.19 (
                  {a.lagna.strongBy.map((m, i) => (
                    <span key={m}>
                      {i > 0 && ", "}
                      <PlanetName planet={m} />
                    </span>
                  ))}
                  ), so the signs from Aries are taken,{" "}
                  {formatYears(a.lagna.signsFromAries)}.
                </>
              ) : (
                "The rising sign is not strong under 1.19 (no lord, Jupiter or Mercury in or aspecting it), so the navamsas are taken."
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right tabular-nums font-medium">
              {formatYears(a.lagna.amsaYears)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground">
              No krurodaya cut in Satya's method, 7.12.
            </TableCell>
            <TableCell className="hidden sm:table-cell" />
            <TableCell className="whitespace-nowrap text-right tabular-nums font-medium">
              {formatYears(a.amsa.total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="mt-3 text-xs" data-testid="ayur-amita">
        <span className="font-medium">Amitayu, 7.14: </span>
        {a.amita.applies ? (
          <>
            all eight conditions are met, so the chapter's rules do not apply
            and the span is called unlimited.
          </>
        ) : (
          <>
            {a.amita.met.length} of 8 conditions met
            {a.amita.met.length ? ` (${a.amita.met.join(", ")})` : ""}, so the
            exception does not apply.
          </>
        )}{" "}
        <SourceLink source={src.v14} />
      </div>

      {a.sharedSigns.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {a.sharedSigns.map((s) => (
            <div key={s.signIndex}>
              <SignName signIndex={s.signIndex} /> holds{" "}
              {s.planets.map((m, i) => (
                <span key={m}>
                  {i > 0 && ", "}
                  <PlanetName planet={m} />
                </span>
              ))}
              ; only <PlanetName planet={s.reduced} />, the strongest, takes the
              chakrapata loss, <SourceLink source={src.v3} />.
            </div>
          ))}
        </div>
      )}

      <div
        className="mt-3 text-xs text-muted-foreground"
        data-testid="ayur-caveats"
      >
        <div className="font-medium">Readings marked provisional</div>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {a.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
