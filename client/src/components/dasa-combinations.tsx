import { useState } from "react";
import { DateTime } from "luxon";
import type { ParashariFinding } from "@shared/parashari";
import { BPHS_URL } from "@shared/parashari-data";
import type {
  AntarShare,
  DasaCombinations,
  RunningCombination,
  TextCite,
} from "@shared/timing-now";
import { levelName } from "@shared/timing-now";
import { Badge } from "@/components/ui/badge";
import { PlanetName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { cn } from "@/lib/utils";

// The combinations of the running dasa and how its sub-periods carry them, after Laghu Parashari
// 2.18 and 4.29-31 as Mehta's ch. XV gives them. Display only: nothing here moves a verdict.

const fmtM = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
const pct = (x: number) => `${Math.round(x * 100)}%`;
/** "the Sun", "the Moon"; the other planets go without the article. */
const nm = (p: string) => (p === "Sun" || p === "Moon" ? `the ${p}` : p);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "a", "a and b", "a, b and c". */
const andList = (xs: string[]) =>
  xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
/** The partners of a planet in a combination, leaving out any the title already names. */
const partners = (c: RunningCombination, lord: string) =>
  c.finding.planets.filter((p) => p !== lord && !c.finding.title.includes(p));

const TONE_PILL: Record<ParashariFinding["tone"], string> = {
  support: "bg-verdict-good/15 text-verdict-good",
  mixed: "bg-verdict-mixed/15 text-verdict-mixed",
  strain: "bg-verdict-bad/10 text-verdict-bad",
};
const TONE_WORD: Record<ParashariFinding["tone"], string> = {
  support: "favourable",
  mixed: "mixed",
  strain: "unfavourable",
};

function Pill({ tone }: { tone: ParashariFinding["tone"] }) {
  return (
    <span
      className={cn("rounded px-1.5 py-0.5 text-xs font-medium", TONE_PILL[tone])}
    >
      {TONE_WORD[tone]}
    </span>
  );
}

function Cites({ cites }: { cites: TextCite[] }) {
  return (
    <>
      {cites.map((c) =>
        c.url ? (
          <SourceLink key={c.label} source={{ label: c.label, url: c.url }} />
        ) : (
          <span
            key={c.label}
            className="rounded border bg-muted/40 px-1 py-px font-mono text-2xs text-muted-foreground"
          >
            {c.label}
          </span>
        ),
      )}
    </>
  );
}

function Provisional() {
  return (
    <Badge variant="outline" className="text-2xs">
      provisional link
    </Badge>
  );
}

const TIE_PLAIN: Record<NonNullable<AntarShare["tie"]>, string> = {
  conjoined: "in the same sign as",
  "mutual aspect": "in mutual aspect with",
  exchange: "in exchange of signs with",
};
const TIE_NOUN: Record<NonNullable<AntarShare["tie"]>, string> = {
  conjoined: "conjunction",
  "mutual aspect": "mutual aspect",
  exchange: "exchange",
};
const TIE_PAIR: Record<NonNullable<AntarShare["tie"]>, string> = {
  conjoined: "in one sign",
  "mutual aspect": "in mutual aspect",
  exchange: "in exchange of signs",
};

/** One line on how a sub-period's lord stands to the dasa lord. */
function linkLine(a: AntarShare, md: string, plain: boolean): string {
  const titles = a.together.map((c) => c.finding.title).join("; ");
  const who = cap(nm(a.lord));
  const kind = a.kind === "favourable" ? (plain ? "favourable" : "auspicious") : plain ? "unfavourable" : "malefic";
  if (plain) {
    switch (a.link) {
      case "own":
        return `${cap(nm(md))}'s own sub-period. A planet need not give its own results here, though Mehta says some effect is felt.`;
      case "partner":
        return `${who} takes part with ${nm(md)} in ${titles}, so both planets of ${a.together.length > 1 ? "these combinations" : "this combination"} are running${a.tie ? `; the two are ${TIE_PAIR[a.tie]}` : ""}.`;
      case "related":
        return `${who} is ${TIE_PLAIN[a.tie!]} ${nm(md)}, so this sub-period carries the ${md} dasa's results.`;
      case "alike":
        return `${who} is of ${nm(md)}'s kind (both ${kind} by the houses they rule), so this sub-period carries the dasa's results.`;
      default:
        return `${who} is not tied to ${nm(md)} and is not of its kind; its sub-period gives its own results, weighed against ${nm(md)}'s.`;
    }
  }
  switch (a.link) {
    case "own":
      return "Own antar of the dasa lord.";
    case "partner":
      return `Yoga partner of the dasa lord: ${titles}${a.tie ? `; sambandha by ${TIE_NOUN[a.tie]}` : ""}.`;
    case "related":
      return `Sambandha with the dasa lord by ${TIE_NOUN[a.tie!]}: gives the dasa's results.`;
    case "alike":
      return `Sadharmin: both ${kind} by lordship; gives the dasa's results.`;
    default:
      return "Neither related to the dasa lord nor alike: its results are weighed on their own.";
  }
}

function ComboItem({
  c,
  lord,
  plain,
  testId,
}: {
  c: RunningCombination;
  /** The planet whose combinations these are; the others are named as partners. */
  lord: string;
  plain: boolean;
  testId: string;
}) {
  const others = partners(c, lord);
  return (
    <li
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1"
      data-testid={testId}
    >
      <span className="font-medium">{c.finding.title}</span>
      {plain && c.finding.gist && <span>({c.finding.gist})</span>}
      <Pill tone={c.finding.tone} />
      {(others.length > 0 || c.finding.planets.length === 1) && (
        <span className="text-xs text-muted-foreground">
          {others.length
            ? `with ${andList(others.map(nm))}`
            : `${cap(nm(lord))} alone`}
        </span>
      )}
      {c.sourced ? (
        <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {plain ? "tied to its planets' periods by" : "tied to the periods by"}
          <Cites cites={c.tiedBy} />
        </span>
      ) : (
        <Provisional />
      )}
    </li>
  );
}

function AntarRow({
  a,
  md,
  plain,
  deceased,
}: {
  a: AntarShare;
  md: string;
  plain: boolean;
  deceased: boolean;
}) {
  return (
    <li
      className={cn(
        "rounded-md border px-2.5 py-1.5",
        a.current ? "border-primary/40 bg-primary/5" : "bg-card",
        a.past && !a.current && "opacity-70",
      )}
      data-testid={`dasa-antar-${a.lord}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-medium">
          <PlanetName planet={a.lord} />
        </span>
        <span className="tabular text-xs text-muted-foreground">
          {fmtM(a.start)} to {fmtM(a.end)}
        </span>
        <span
          className="tabular text-xs text-muted-foreground"
          data-testid={`dasa-antar-share-${a.lord}`}
        >
          {pct(a.share)} of the dasa
        </span>
        {a.current && (
          <Badge variant="secondary" className="text-2xs">
            {deceased ? "at passing" : "now"}
          </Badge>
        )}
      </div>
      <p
        className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs"
        data-testid={`dasa-antar-link-${a.lord}`}
      >
        <span>{linkLine(a, md, plain)}</span>
        <Cites cites={a.cites} />
        {!a.sourced && <Provisional />}
      </p>
      {a.adds.length > 0 && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {plain ? `${cap(nm(a.lord))} also brings: ` : "Own yogas: "}
          {a.adds
            .map((c) => {
              const others = partners(c, a.lord);
              return `${c.finding.title}${others.length ? ` with ${andList(others.map(nm))}` : ""}${plain && c.finding.gist ? ` (${c.finding.gist})` : ""}`;
            })
            .join("; ")}
        </p>
      )}
    </li>
  );
}

/** The body of the "Combinations" row in Now and next. */
export function DasaCombinationsBody({
  dc,
  plain,
  deceased = false,
}: {
  dc: DasaCombinations;
  plain: boolean;
  /** After a recorded death the running state is the one at that date. */
  deceased?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const md = dc.lord;
  const now = dc.antars.find((a) => a.current);
  const L = pct(dc.linked),
    P = pct(dc.provisional);
  const hasL = dc.linked > 0.0005,
    hasP = dc.provisional > 0.0005;
  const tiedPart = `sub-periods of planets tied to ${nm(md)} or forming its combinations with it`;
  const shareText = plain
    ? hasL
      ? `By length, ${L} of the ${md} dasa runs in ${tiedPart}${hasP ? `, and ${P} in sub-periods whose link is provisional` : ""}.`
      : hasP
        ? `No sub-period of the ${md} dasa belongs to a planet tied to ${nm(md)}; by length, ${P} of it runs in sub-periods whose link is provisional.`
        : `No sub-period of the ${md} dasa belongs to a planet tied to ${nm(md)} or of its kind.`
    : hasL || hasP
      ? `By length: ${[hasL ? `${L} of the dasa in antars of yoga partners or related planets (LP 2.18, 4.30)` : "", hasP ? `${P} on a provisional link` : ""].filter(Boolean).join("; ")}.`
      : "No antar lord is a yoga partner of the dasa lord, related to it, or alike.";
  return (
    <div data-testid="dasa-combinations">
      <span className="text-muted-foreground">
        {dc.combos.length
          ? plain
            ? `Under the ${md} ${levelName("dasa", true)}, ${fmtM(dc.start)} to ${fmtM(dc.end)}, these combinations of the chart ${deceased ? "were" : "are"} in play:`
            : `Yogas of the ${md} dasa, ${fmtM(dc.start)} to ${fmtM(dc.end)}:`
          : plain
            ? `The ${md} ${levelName("dasa", true)}, ${fmtM(dc.start)} to ${fmtM(dc.end)}, takes part in none of this chart's combinations; its sub-periods still carry its own results, as below.`
            : `The ${md} dasa lord forms no yoga in this chart.`}
      </span>
      {dc.combos.length > 0 && (
        <ul className="mt-1 space-y-1">
          {dc.combos.map((c) => (
            <ComboItem
              key={c.finding.id}
              c={c}
              lord={md}
              plain={plain}
              testId={`timing-now-combination-${c.finding.id}`}
            />
          ))}
        </ul>
      )}
      {now && (
        <div className="mt-2" data-testid="dasa-combinations-now">
          <span className="text-muted-foreground">
            {plain
              ? `${deceased ? "At passing" : "Now"}, the ${now.lord} ${levelName("antar", true)}, ${fmtM(now.start)} to ${fmtM(now.end)}: `
              : `${now.lord} antar${deceased ? " at passing" : ""}, ${fmtM(now.start)} to ${fmtM(now.end)}: `}
          </span>
          <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span>{linkLine(now, md, plain)}</span>
            <Cites cites={now.cites} />
            {!now.sourced && <Provisional />}
          </span>
          {now.adds.length > 0 && (
            <>
              <span className="mt-1 block text-muted-foreground">
                {plain
                  ? `${cap(nm(now.lord))} also takes part in these, without ${nm(md)}:`
                  : `Yogas of the antar lord without the dasa lord:`}
              </span>
              <ul className="mt-1 space-y-1">
                {now.adds.map((c) => (
                  <ComboItem
                    key={c.finding.id}
                    c={c}
                    lord={now.lord}
                    plain={plain}
                    testId={`timing-now-antar-combination-${c.finding.id}`}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <p className="mt-2" data-testid="dasa-combinations-share">
        {shareText}{" "}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          data-testid="toggle-dasa-antars"
          aria-expanded={open}
        >
          {open
            ? "hide the sub-periods"
            : plain
              ? "show each sub-period"
              : "show each antar"}
        </button>
      </p>
      {open && (
        <ol className="mt-1.5 space-y-1.5" data-testid="dasa-antars">
          {dc.antars.map((a) => (
            <AntarRow
              key={`${a.lord}-${a.start}`}
              a={a}
              md={md}
              plain={plain}
              deceased={deceased}
            />
          ))}
        </ol>
      )}
      <p
        className="mt-1.5 text-xs text-muted-foreground"
        data-testid="dasa-combinations-note"
      >
        {plain
          ? "Laghu Parashari, a short text on the periods ascribed to Parashara, holds that a combination works in the periods of the planets that form it (2.18), and that a dasa lord gives its own results in the sub-periods of planets tied to it or of its own kind (4.30), not necessarily in its own (4.29). Mehta gives the same rules in his chapter on the dasha (ch. XV). Tied means in one sign, in mutual aspect, or in exchange of signs, the ties Parashara names for angle and trine lords. No source splits a period's results between the two lords by percentage, so the shares above are lengths of time, not weights."
          : "Laghu Parashari 2.18 (yoga in the dasas of its makers), 4.29 (no full results in the own antar), 4.30 (the dasa's results in the antars of related or like-natured planets) and 4.31 (the others judged on their own), as Mehta gives them in ch. XV. Sambandha is read as conjunction, mutual aspect or exchange; like nature as the same functional nature by lordship, which is provisional. No text weights the dasa and antar lords by percentage; the shares are Vimshottari lengths."}{" "}
        <SourceLink source={{ label: "Parashara 34.11-13", url: BPHS_URL(34) }} />
      </p>
    </div>
  );
}
