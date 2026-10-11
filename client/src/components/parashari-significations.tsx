import { useMemo } from "react";
import { PlanetName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionTitle, usePlain } from "@/components/mode-text";
import { Soft } from "@/lib/gentle";
import {
  ERA_WINDOW_YEARS,
  SIGNIFICATION_SOURCES,
  significationView,
  significationsByPlanet,
  type Signification,
  type SignificationSource,
} from "@shared/parashari-significations";
import { SENSITIVE_MIN_AGE } from "@shared/life-stage";

const SOURCE_LABEL: Record<SignificationSource, string> = {
  BPHS: "Parashara",
  Phaladeepika: "Phaladeepika",
  Mehta: "Mehta",
  Aggarwal: "Aggarwal",
};

function Item({ s, plain }: { s: Signification; plain: boolean }) {
  const extra = [
    !plain && s.verseNote ? s.verseNote : null,
    !plain && s.root ? `cf. ${s.root}` : null,
  ].filter(Boolean);
  return (
    <span>
      <Soft>{s.word}</Soft>
      {s.note ? `, ${s.note}` : ""}
      <span className="text-muted-foreground">
        {" "}
        ({s.ref}
        {extra.length ? `; ${extra.join("; ")}` : ""})
      </span>
    </span>
  );
}

function Group({
  source,
  items,
  plain,
  testid,
}: {
  source: SignificationSource;
  items: Signification[];
  plain: boolean;
  testid: string;
}) {
  if (!items.length) return null;
  return (
    <div className="leading-snug" data-testid={testid}>
      <span className="font-medium text-foreground">{SOURCE_LABEL[source]}:</span>{" "}
      {items.map((s, i) => (
        <span key={`${s.ref}-${s.word}`}>
          {i ? "; " : ""}
          <Item s={s} plain={plain} />
        </span>
      ))}
    </div>
  );
}

/** Planet significations by tier (display only), with the era rule and the minor's gate applied. */
export function ParashariSignifications({
  birthYear,
  withheld,
}: {
  birthYear?: number;
  withheld: boolean;
}) {
  const plain = usePlain();
  const view = useMemo(
    () => significationView({ birthYear, withheld }),
    [birthYear, withheld],
  );
  const rows = useMemo(() => significationsByPlanet(view.shown), [view]);
  const pick = (list: Signification[], source: SignificationSource) =>
    list.filter((s) => s.source === source);
  return (
    <div className="mt-5" data-testid="parashari-significations">
      <SectionTitle
        as="h4"
        plain="What each planet signifies"
        technical="Planet significations (BPHS 3, 32; Phaladeepika 2; modern authors)"
      />
      <div className="mt-1 text-xs text-muted-foreground">
        {plain
          ? "The classical texts first, cited by verse, then two modern authors, cited by page or part. These are what each planet stands for, not readings of this chart; none of them changes a finding."
          : "Classical tier by verse; modern tier by author, Mehta first and Aggarwal only where Mehta is silent. Display only: no rule, verdict or summary reads this table."}{" "}
        <Badge variant="outline" className="ml-1 text-2xs">
          modern tier provisional
        </Badge>
      </div>
      <Table className="mt-2" data-testid="parashari-significations-table" cards>
        <TableHeader>
          <TableRow>
            <TableHead>Planet</TableHead>
            <TableHead className="w-[46%]">Classical</TableHead>
            <TableHead className="w-[46%]">Modern</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ planet, classical, modern }) => {
            const key = planet.toLowerCase();
            return (
              <TableRow key={planet} data-testid={`parashari-significations-${key}`}>
                <TableCell className="whitespace-nowrap py-1.5 align-top">
                  <PlanetName planet={planet} />
                </TableCell>
                <TableCell className="py-1.5 align-top text-xs text-muted-foreground">
                  <div className="space-y-0.5">
                    <Group source="BPHS" items={pick(classical, "BPHS")} plain={plain} testid={`parashari-significations-${key}-bphs`} />
                    <Group source="Phaladeepika" items={pick(classical, "Phaladeepika")} plain={plain} testid={`parashari-significations-${key}-pd`} />
                  </div>
                </TableCell>
                <TableCell className="py-1.5 align-top text-xs text-muted-foreground">
                  <div className="space-y-0.5">
                    <Group source="Mehta" items={pick(modern, "Mehta")} plain={plain} testid={`parashari-significations-${key}-mehta`} />
                    <Group source="Aggarwal" items={pick(modern, "Aggarwal")} plain={plain} testid={`parashari-significations-${key}-aggarwal`} />
                    {!modern.length ? <span>none</span> : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
        <p data-testid="parashari-significations-sources">
          Sources: <SourceLink source={SIGNIFICATION_SOURCES.BPHS3} mark={false} />,{" "}
          <SourceLink source={SIGNIFICATION_SOURCES.BPHS32} mark={false} />;{" "}
          <SourceLink source={SIGNIFICATION_SOURCES.Phaladeepika} mark={false} />;{" "}
          {SIGNIFICATION_SOURCES.Mehta}; {SIGNIFICATION_SOURCES.Aggarwal}. The
          glosses are short paraphrases of the translations.
          {!plain
            ? " Kindle pages are those the reader shows at the top of the screen, so a passage may fall on the next page."
            : ""}
        </p>
        {view.eraHidden.length ? (
          <p data-testid="parashari-significations-era">
            Left out for a birth in {birthYear}, because the field arose after
            the native's {ERA_WINDOW_YEARS}th year:{" "}
            {view.eraHidden.map((s) => s.word).join("; ")} (an app convention,
            provisional).
          </p>
        ) : !plain ? (
          <p data-testid="parashari-significations-era">
            A modern reading that names a recent field (electronics, software,
            AI) shows only when the field arose by the native's{" "}
            {ERA_WINDOW_YEARS}th year (an app convention, provisional).
          </p>
        ) : null}
        {view.withheldCount ? (
          <p data-testid="parashari-significations-withheld">
            Some readings are not shown for a native under {SENSITIVE_MIN_AGE}{" "}
            (a policy of this app, provisional).
          </p>
        ) : null}
      </div>
      {!plain ? (
        <div className="mt-3" data-testid="parashari-significations-conflicts">
          <div className="text-sm font-medium">Where the sources differ</div>
          <Table className="mt-1" cards>
            <TableHeader>
              <TableRow>
                <TableHead>Matter</TableHead>
                <TableHead>Parashara</TableHead>
                <TableHead>Phaladeepika</TableHead>
                <TableHead>Mehta</TableHead>
                <TableHead>Aggarwal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.conflicts.map((c) => (
                <TableRow key={c.matter}>
                  <TableCell className="py-1.5 align-top text-xs font-medium">{c.matter}</TableCell>
                  <TableCell className="py-1.5 align-top text-xs text-muted-foreground">{c.bphs}</TableCell>
                  <TableCell className="py-1.5 align-top text-xs text-muted-foreground">{c.phaladeepika}</TableCell>
                  <TableCell className="py-1.5 align-top text-xs text-muted-foreground">{c.mehta}</TableCell>
                  <TableCell className="py-1.5 align-top text-xs text-muted-foreground">{c.aggarwal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-1 text-xs text-muted-foreground">
            Each source keeps its own column; nothing is merged, and every
            Parashari rule still rests on the classical texts.
          </p>
        </div>
      ) : null}
    </div>
  );
}
