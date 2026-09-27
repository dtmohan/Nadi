import { Fragment, useState } from "react";
import type {
  BjDasaResult,
  DasaEntry,
  DasaNature,
  DasaScheme,
} from "@shared/bj-dasa";
import { BJ_DASA_READING, DASA_EFFECTS, BJ8_URL } from "@shared/bj-dasa";
import { formatYears, type Seven } from "@shared/ayurdaya";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SourceLink } from "@/components/source-link";
import { ModeText, SectionTitle } from "@/components/mode-text";
import { PlanetName, SignName } from "@/components/planet-name";
import { cn } from "@/lib/utils";

function NatureMark({ n }: { n: DasaNature }) {
  return (
    <span
      data-testid={`bj-dasa-nature-${n}`}
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide",
        n === "benefic" &&
          "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
        n === "malefic" &&
          "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
        n === "mixed" &&
          "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
      )}
    >
      {n}
    </span>
  );
}

function Lord({ lord }: { lord: DasaEntry["lord"] }) {
  return lord === "Lagna" ? <span>Lagna</span> : <PlanetName planet={lord} />;
}

const GROUP_LABEL: Record<DasaEntry["group"], string> = {
  first: "reference",
  kendra: "kendra",
  panaphara: "panaphara",
  apoklima: "apoklima",
};

/** Varahamihira's planetary-year dasas, Brihat Jataka adhyaya 8. */
export function BjDasaSection({
  d,
  ageYears,
  scheme,
  onScheme,
}: {
  d: BjDasaResult;
  ageYears?: number;
  scheme: DasaScheme;
  onScheme: (s: DasaScheme) => void;
}) {
  const [open, setOpen] = useState<string | null>(
    d.current ? d.current.lord : null,
  );
  const src = d.sources;
  const cur = d.current;
  return (
    <div data-testid="parashari-bj-dasa">
      <SectionTitle
        plain="Periods of life by the planetary years"
        technical="Dasa and antardasa (Brihat Jataka 8)"
        term="bj-dasa"
      />
      <ModeText
        plain={
          <>
            Varahamihira's own periods take the years each planet grants in the
            life-span reckoning above and hand them out one planet at a time:
            first the strongest of the rising sign, Sun and Moon, then the
            planets in the angles from it, then the succeeding houses, then the
            cadent ones. Each period is judged good, poor or mixed by where its
            planet stands between its strongest and weakest degrees, and the
            chapter names what each planet's good or poor period brings. This is
            not Vimsottari, which the tab keeps separately; it is shown as a
            second voice beside it.
          </>
        }
        practitioner={
          <>
            Order from the strongest of lagna, Sun and Moon, then kendras,
            panapharas and apoklimas from it, <SourceLink source={src.order} />;
            antardasa shares 1, 1/2, 1/3, 1/7, 1/4 over a common denominator,{" "}
            <SourceLink source={src.antar} />; the names Sampurna, Rikta,
            Anishta, Avarohini, Madhyama, Arohini, Adhama and Misraphala,{" "}
            <SourceLink source={src.grades} />; the lagna dasa by drekkana,{" "}
            <SourceLink source={src.lagnaGrade} />; the natural dasas,{" "}
            <SourceLink source={src.naisargika} />; results,{" "}
            <SourceLink source={src.effects} />; reading rules,{" "}
            <SourceLink source={src.reading} />. Checked against{" "}
            <SourceLink source={src.iyer} /> and the Adyar 1951 Sanskrit pp.
            369-425. The nature of each named grade follows{" "}
            <SourceLink source={src.natureNames} />.
          </>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Years scheme"
        >
          <span className="text-muted-foreground">Years from</span>
          {(["pinda", "amsa"] as DasaScheme[]).map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`bj-dasa-scheme-${s}`}
              onClick={() => onScheme(s)}
              aria-pressed={scheme === s}
              className={cn(
                "rounded border px-2 py-0.5",
                scheme === s
                  ? "border-foreground/40 bg-muted font-medium"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "pinda" ? "Pindayu" : "Amsayu"}
            </button>
          ))}
        </div>
        <div data-testid="bj-dasa-reference">
          <span className="text-muted-foreground">Reference </span>
          <span className="font-medium">
            <Lord lord={d.reference} />
          </span>
        </div>
        <div data-testid="bj-dasa-total">
          <span className="text-muted-foreground">Sum of periods </span>
          <span className="font-medium tabular-nums">
            {formatYears(d.total)}
          </span>
        </div>
        {ageYears !== undefined && (
          <div className="text-muted-foreground">
            Present age {formatYears(ageYears)}
          </div>
        )}
      </div>
      <p
        className="mt-1 text-xs text-muted-foreground"
        data-testid="bj-dasa-reference-note"
      >
        {d.referenceNote}
      </p>

      {cur ? (
        <div
          className="mt-3 rounded border border-border/70 bg-muted/30 px-3 py-2 text-xs"
          data-testid="bj-dasa-current"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Running now</span>
            <span className="font-medium">
              <Lord lord={cur.lord} /> dasa
            </span>
            <NatureMark n={cur.grade.nature} />
            <span className="text-muted-foreground">
              {cur.grade.names.join(", ")} · {formatYears(cur.start)} to{" "}
              {formatYears(cur.end)}
            </span>
            {d.currentAntar && (
              <span>
                · <PlanetName planet={d.currentAntar.lord} /> antardasa,{" "}
                <span className="text-muted-foreground">
                  {formatYears(d.currentAntar.start)} to{" "}
                  {formatYears(d.currentAntar.end)}
                </span>
              </span>
            )}
          </div>
          {cur.lord !== "Lagna" && (
            <p className="mt-1">
              <span className="text-muted-foreground">
                {cur.grade.nature === "malefic"
                  ? "Malefic results, 8."
                  : cur.grade.nature === "benefic"
                    ? "Benefic results, 8."
                    : "Mixed, both sides of 8."}
                {DASA_EFFECTS[cur.lord as Seven].verse}:
              </span>{" "}
              {cur.grade.nature === "malefic"
                ? DASA_EFFECTS[cur.lord as Seven].malefic
                : cur.grade.nature === "benefic"
                  ? DASA_EFFECTS[cur.lord as Seven].benefic
                  : `${DASA_EFFECTS[cur.lord as Seven].benefic}; and ${DASA_EFFECTS[cur.lord as Seven].malefic}`}
            </p>
          )}
          {cur.lord === "Lagna" && (
            <p className="mt-1 text-muted-foreground">
              The lagna dasa takes the results of its lord's dasa, 8.19.
            </p>
          )}
          {d.naisargikaCurrent && (
            <p
              className="mt-1 text-muted-foreground"
              data-testid="bj-dasa-coincide"
            >
              Natural dasa of <PlanetName planet={d.naisargikaCurrent.lord} />{" "}
              (8.9)
              {d.coincide
                ? "; it coincides with the planetary dasa, which the verse calls prosperous."
                : "; no coincidence with the planetary dasa."}
            </p>
          )}
        </div>
      ) : (
        ageYears !== undefined && (
          <p
            className="mt-3 text-xs text-muted-foreground"
            data-testid="bj-dasa-current"
          >
            The present age lies beyond the sum of the periods under this
            scheme.
          </p>
        )
      )}

      <Table className="mt-3" data-testid="bj-dasa-table">
        <TableHeader>
          <TableRow>
            <TableHead>Dasa</TableHead>
            <TableHead className="hidden sm:table-cell">Class</TableHead>
            <TableHead className="text-right">Years</TableHead>
            <TableHead className="hidden sm:table-cell text-right">
              From
            </TableHead>
            <TableHead>Grade</TableHead>
            <TableHead className="hidden md:table-cell">Why</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {d.order.map((e) => {
            const isOpen = open === e.lord;
            return (
              <Fragment key={e.lord}>
                <TableRow
                  data-testid={`bj-dasa-row-${e.lord}`}
                  className={cn("cursor-pointer", e.current && "bg-muted/40")}
                  onClick={() => setOpen(isOpen ? null : e.lord)}
                >
                  <TableCell className="py-1.5 text-xs">
                    <Lord lord={e.lord} />
                    <span className="ml-1 text-muted-foreground">
                      <SignName signIndex={e.signIndex} abbr />
                    </span>
                    {e.current && (
                      <span className="ml-1 text-2xs uppercase tracking-wide text-muted-foreground">
                        now
                      </span>
                    )}
                    <span className="block text-2xs text-muted-foreground sm:hidden">
                      {GROUP_LABEL[e.group]}, from {formatYears(e.start)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden py-1.5 text-xs text-muted-foreground sm:table-cell">
                    {GROUP_LABEL[e.group]}
                    {e.group !== "first" && ` (${e.houseFromRef})`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-1.5 text-right text-xs tabular-nums">
                    {formatYears(e.years)}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap py-1.5 text-right text-xs tabular-nums text-muted-foreground sm:table-cell">
                    {formatYears(e.start)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs">
                    <NatureMark n={e.grade.nature} />
                    <span className="ml-1 text-muted-foreground">
                      {e.grade.names.join(", ")}
                    </span>
                    {e.grade.provisional && (
                      <span className="ml-1 text-2xs uppercase tracking-wide text-muted-foreground">
                        prov.
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden py-1.5 text-xs text-muted-foreground md:table-cell">
                    {e.grade.reasons.join("; ")}
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow data-testid={`bj-dasa-antar-${e.lord}`}>
                    <TableCell colSpan={6} className="bg-muted/20 py-2 text-xs">
                      <div className="mb-1 text-muted-foreground md:hidden">
                        {e.grade.reasons.join("; ")}
                      </div>
                      <div className="text-muted-foreground">
                        Antardasas, 8.3-4
                        {e.lord !== "Lagna" && (
                          <>
                            {" "}
                            · results of the {e.lord} dasa, 8.
                            {DASA_EFFECTS[e.lord as Seven].verse}:{" "}
                            <span className="text-foreground">
                              {e.grade.nature === "malefic"
                                ? DASA_EFFECTS[e.lord as Seven].malefic
                                : e.grade.nature === "benefic"
                                  ? DASA_EFFECTS[e.lord as Seven].benefic
                                  : `${DASA_EFFECTS[e.lord as Seven].benefic}; and ${DASA_EFFECTS[e.lord as Seven].malefic}`}
                            </span>
                          </>
                        )}
                      </div>
                      {e.antardasas.length === 0 ? (
                        <p className="mt-1 text-muted-foreground">
                          No planet in the places the verse names.
                        </p>
                      ) : (
                        <ul className="mt-1 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                          {e.antardasas.map((a) => (
                            <li
                              key={a.lord}
                              className={cn(
                                "flex justify-between gap-2 tabular-nums",
                                a.current && "font-medium",
                              )}
                            >
                              <span>
                                <PlanetName planet={a.lord} />{" "}
                                <span className="text-muted-foreground">
                                  {a.fraction}, {a.placement}
                                </span>
                              </span>
                              <span>
                                {formatYears(a.start)} to {formatYears(a.end)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      <h4 className="mt-5 text-sm font-medium">Natural dasas, 8.9</h4>
      <div
        className="mt-1 flex flex-wrap gap-1.5 text-xs"
        data-testid="bj-dasa-naisargika"
      >
        {d.naisargika.map((n) => (
          <span
            key={n.lord}
            className={cn(
              "rounded border border-border/70 px-2 py-0.5 tabular-nums",
              n.current && "border-foreground/40 bg-muted font-medium",
            )}
          >
            <PlanetName planet={n.lord} /> {n.years}
            <span className="text-muted-foreground">
              {" "}
              ({formatYears(n.start)} to {formatYears(n.end)})
            </span>
          </span>
        ))}
      </div>

      <h4 className="mt-5 text-sm font-medium">Reading rules, 8.19-23</h4>
      <ul className="mt-1 space-y-1 text-xs" data-testid="bj-dasa-reading">
        {BJ_DASA_READING.map((r) => (
          <li key={r.verse}>
            <a
              href={BJ8_URL(parseInt(r.verse, 10))}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground underline decoration-dotted"
            >
              8.{r.verse}
            </a>{" "}
            {r.rule}
          </li>
        ))}
      </ul>

      <ul
        className="mt-4 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
        data-testid="bj-dasa-caveats"
      >
        {d.caveats.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
