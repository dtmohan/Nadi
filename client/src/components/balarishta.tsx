import type { ArishtaStanding, BalarishtaResult } from "@shared/balarishta";
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
import { cn } from "@/lib/utils";

const STANDING_LABEL: Record<ArishtaStanding, string> = {
  holds: "holds",
  clear: "clear",
  partial: "partly",
  untested: "untested",
};

export function StandingMark({
  s,
  good,
}: {
  s: ArishtaStanding;
  /** For antidotes, where holding is the welcome outcome. */
  good?: boolean;
}) {
  return (
    <span
      data-testid={`arishta-standing-${s}`}
      className={cn(
        "inline-block rounded border px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide",
        s === "holds" &&
          !good &&
          "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
        ((s === "clear" && !good) || (s === "holds" && good)) &&
          "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
        s === "clear" && good && "border-border text-muted-foreground",
        s === "partial" &&
          "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
        s === "untested" && "border-border text-muted-foreground",
      )}
    >
      {STANDING_LABEL[s]}
    </span>
  );
}

/** Early death, Brihat Jataka adhyaya 6, as a second witness beside Parashara 9. */
export function BalarishtaSection({
  b,
  ageYears,
}: {
  b: BalarishtaResult;
  ageYears?: number;
}) {
  const past = ageYears !== undefined && ageYears > b.horizonYears;
  const antiHeld = b.antidotes.filter((a) => a.standing === "holds");
  return (
    <div data-testid="parashari-balarishta">
      <SectionTitle
        plain="Danger in infancy, Varahamihira's list"
        technical="Balarishta (Brihat Jataka 6)"
        term="bj-balarishta"
      />
      <ModeText
        plain={
          <>
            Varahamihira gives twelve verses, fourteen tests in all, for a child
            who would not survive infancy, most of them turning on where the
            Moon stands and which planets stand with or look at her. The tab
            tests each rule on the chart as written and marks it holds or clear.{" "}
            {past
              ? "This native is well past the years the chapter speaks of, so the rules that hold were lived through; they stand here as a check on Parashara's list of evils in the tab above, and the commentator's list of what wards them off is shown beneath."
              : "The terms are the chapter's own: at once, a month, four or eight years."}
          </>
        }
        practitioner={
          <>
            The twelve verses of <SourceLink source={b.sources.chapter} />,
            whole-sign houses from the lagna, Parashari drishti at the tab's
            floor, natural benefics per 3.11; Iyer 1885 pp. 53-58, Adyar 1951
            pp. 310-329. The counteracting yogas are the commentator's (
            <SourceLink source={b.sources.antidotes} />) and are provisional.
            {past &&
              " Read retrospectively: the native has outlived the chapter's horizon."}
          </>
        }
      />

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <div data-testid="balarishta-held">
          <span className="text-muted-foreground">Rules that hold </span>
          <span className="font-medium tabular-nums">
            {b.held} of {b.rules.length}
          </span>
        </div>
        <div data-testid="balarishta-antidotes-held">
          <span className="text-muted-foreground">Antidotes that hold </span>
          <span className="font-medium tabular-nums">
            {antiHeld.length} of {b.antidotes.length}
          </span>
        </div>
        {!b.shadbalaKnown && (
          <div className="text-muted-foreground">
            Shadbala absent; strength tests untested
          </div>
        )}
      </div>

      <Table className="mt-3" data-testid="balarishta-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Verse</TableHead>
            <TableHead>Rule</TableHead>
            <TableHead className="w-20">Standing</TableHead>
            <TableHead className="hidden md:table-cell">
              In this chart
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {b.rules.map((r) => (
            <TableRow
              key={r.key}
              data-testid={`balarishta-row-${r.key}`}
              className={cn(
                r.standing === "holds" && "bg-rose-50/40 dark:bg-rose-950/20",
              )}
            >
              <TableCell className="py-1.5 align-top text-xs">
                <SourceLink source={r.source} />
                <span className="mt-1 block text-2xs text-muted-foreground">
                  Iyer {r.iyer} · Adyar {r.adyar}
                </span>
              </TableCell>
              <TableCell className="py-1.5 align-top text-xs">
                {r.rule}
                <span className="block text-muted-foreground">{r.result}</span>
                {r.provisional && (
                  <span className="mt-1 block text-2xs text-muted-foreground">
                    Provisional: {r.provisional}
                  </span>
                )}
                <span className="mt-1 block text-2xs text-muted-foreground md:hidden">
                  {r.detail}
                </span>
              </TableCell>
              <TableCell className="py-1.5 align-top">
                <StandingMark s={r.standing} />
              </TableCell>
              <TableCell className="hidden py-1.5 align-top text-xs text-muted-foreground md:table-cell">
                {r.detail}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h4 className="mt-5 text-sm font-medium">
        What wards it off, the commentator's list
        <span className="ml-2 text-2xs font-normal uppercase tracking-wide text-muted-foreground">
          provisional
        </span>
      </h4>
      <ul
        className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2"
        data-testid="balarishta-antidotes"
      >
        {b.antidotes.map((a) => (
          <li
            key={a.key}
            data-testid={`balarishta-antidote-${a.key}`}
            className="flex items-start gap-2 rounded border border-border/60 px-2 py-1.5"
          >
            <StandingMark s={a.standing} good />
            <span>
              {a.rule}
              {a.detail && (
                <span className="block text-2xs text-muted-foreground">
                  {a.detail}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <ul
        className="mt-4 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
        data-testid="balarishta-caveats"
      >
        {b.caveats.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
