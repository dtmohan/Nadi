import {
  BJ_CROSS,
  BJ_CROSS_CAVEATS,
  type CrossCitation,
  type CrossStanding,
} from "@shared/bj-cross";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SourceLink, Cite } from "@/components/source-link";
import { ModeText, SectionTitle } from "@/components/mode-text";
import { cn } from "@/lib/utils";

const IYER = "https://archive.org/details/brihatjatakavar00iyergoog";
const ADYAR = "https://archive.org/details/in.ernet.dli.2015.382698";

const STANDING_LABEL: Record<CrossStanding, string> = {
  agrees: "agrees",
  partial: "qualitative",
  differs: "differs",
};
const STANDING_CLASS: Record<CrossStanding, string> = {
  agrees: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
  partial: "border-border text-muted-foreground",
  differs: "border-amber-500/50 text-amber-700 dark:text-amber-400",
};

export function StandingBadge({ standing }: { standing: CrossStanding }) {
  return (
    <span
      className={cn(
        "rounded border px-1 text-2xs uppercase tracking-wide",
        STANDING_CLASS[standing],
      )}
      data-testid={`bj-standing-${standing}`}
    >
      {STANDING_LABEL[standing]}
    </span>
  );
}

/** Inline chip pair: the Brihat Jataka verse and how it stands to the Parashara rule. */
export function BjCross({ c }: { c: CrossCitation }) {
  return (
    <span className="whitespace-nowrap" data-testid={`bj-cross-${c.key}`}>
      <SourceLink source={c.bj} /> <StandingBadge standing={c.standing} />
    </span>
  );
}

/** Cross-check of the elementary rules against Brihat Jataka chapters 1 and 2. */
export function BjCrossSection() {
  const counts = BJ_CROSS.reduce(
    (a, c) => ({ ...a, [c.standing]: a[c.standing] + 1 }),
    { agrees: 0, partial: 0, differs: 0 } as Record<CrossStanding, number>,
  );
  return (
    <div data-testid="parashari-bj-cross">
      <SectionTitle
        plain="The same ground rules in Varahamihira"
        technical="Cross-check with Brihat Jataka 1-2"
        term="bj-cross"
      />
      <ModeText
        plain={
          <>
            The building blocks this tab uses from Parashara, such as which
            planets are friends, how far each planet sees, where each is
            strongest and the exaltation points, are also stated in the first
            two chapters of Varahamihira's Brihat Jataka. This table shows where
            the two texts say the same thing, where Varahamihira gives only the
            idea and Parashara the numbers, and where they part. The readings
            above follow Parashara throughout.
          </>
        }
        practitioner={
          <>
            Elementary rules of Parashara ch. 3, 4, 6, 11, 26 and 27 set against
            Brihat Jataka 1 (Rasiprabheda) and 2 (Grahabheda): {counts.agrees}{" "}
            agree, {counts.partial} are stated without values by Varahamihira,{" "}
            {counts.differs} {counts.differs === 1 ? "differs" : "differ"}.
            Nothing is computed from these rows. Verse text from Neely
            (wisdomlib) and <Cite href={IYER}>Iyer 1885, pp. 5-24</Cite>; the
            Sanskrit checked in <Cite href={ADYAR}>Adyar 1951, pp. 14-183</Cite>
            .
          </>
        }
      />
      <div className="min-w-0 overflow-x-auto">
        <Table className="mt-3 max-sm:[&_td]:px-2" data-testid="bj-cross-table">
          <TableHeader>
            <TableRow>
              <TableHead className="sm:w-[30%]">Rule as applied</TableHead>
              <TableHead className="hidden sm:table-cell sm:w-40">
                Parashara
              </TableHead>
              <TableHead className="hidden sm:table-cell sm:w-44">
                Brihat Jataka
              </TableHead>
              <TableHead className="hidden md:table-cell">
                What Varahamihira states
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BJ_CROSS.map((c) => (
              <TableRow key={c.key} data-testid={`bj-cross-row-${c.key}`}>
                <TableCell className="py-1.5 text-xs">
                  {c.rule}
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground sm:hidden">
                    <SourceLink source={c.parashara} />
                    <SourceLink source={c.bj} />
                    <StandingBadge standing={c.standing} />
                    <span className="text-2xs">
                      Iyer {c.iyer} · Adyar {c.adyar}
                    </span>
                  </span>
                  <span className="mt-1 block text-muted-foreground md:hidden">
                    {c.note}
                  </span>
                </TableCell>
                <TableCell className="hidden py-1.5 text-xs sm:table-cell">
                  <SourceLink source={c.parashara} />
                </TableCell>
                <TableCell className="hidden py-1.5 text-xs sm:table-cell">
                  <div className="flex flex-col items-start gap-1">
                    <SourceLink source={c.bj} />
                    <StandingBadge standing={c.standing} />
                    <span className="text-2xs text-muted-foreground">
                      Iyer {c.iyer} · Adyar {c.adyar}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden py-1.5 text-xs text-muted-foreground md:table-cell">
                  {c.note}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul
        className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
        data-testid="bj-cross-caveats"
      >
        {BJ_CROSS_CAVEATS.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
