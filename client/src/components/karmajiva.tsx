import type { KarmajivaResult } from "@shared/karmajiva";
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

/** Livelihood, Brihat Jataka adhyaya 10. */
export function KarmajivaSection({ k }: { k: KarmajivaResult }) {
  const src = k.sources;
  return (
    <div data-testid="parashari-karmajiva">
      <SectionTitle
        plain="Where the living comes from"
        technical="Karmajiva"
        term="karmajiva"
      />
      <ModeText
        plain={
          <>
            Varahamihira reads the source of a person's living from the tenth
            house. A planet standing there, counted from the rising sign or from
            the Moon, names the person the money comes through. Failing that,
            the ruler of the tenth house is followed into its ninth-part chart,
            and the planet ruling that part names the trade. Three tenth houses
            are read: from the rising sign, from the Moon and from the Sun.
          </>
        }
        practitioner={
          <>
            A planet in the 10th from the lagna or the Moon gives wealth through
            the person it stands for; the calling follows the lord of the
            navamsa occupied by the lord of the 10th from the lagna, the Moon
            and the Sun, <SourceLink source={src.v1} />. The callings of each
            navamsa lord are in <SourceLink source={src.v2} /> and{" "}
            <SourceLink source={src.v3} />; the livelihood planet's sign and the
            10.4 clauses in <SourceLink source={src.v4} />. Checked against{" "}
            <SourceLink source={src.iyer} /> and the Sanskrit of{" "}
            <SourceLink source={src.adyar} />.
          </>
        }
      />

      <div className="mt-3 text-xs font-medium">
        Planets in the 10th from the lagna or the Moon
      </div>
      {k.tenthOccupants.length ? (
        <ul className="mt-1 space-y-1 text-xs" data-testid="karmajiva-tenth">
          {k.tenthOccupants.map((t) => (
            <li
              key={t.planet}
              className="flex flex-wrap items-baseline gap-x-2"
              data-testid={`karmajiva-tenth-${t.planet}`}
            >
              <PlanetName planet={t.planet} />
              <span className="text-muted-foreground">
                10th from {t.from.join(" and ")}: wealth through {t.wealthFrom}
                {t.gloss ? (
                  <>
                    {" "}
                    <span className="text-2xs">
                      ({t.gloss}, <SourceLink source={src.commentary} />)
                    </span>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="mt-1 text-xs text-muted-foreground"
          data-testid="karmajiva-tenth-empty"
        >
          None. The verse then turns to the navamsa of the 10th lord.
        </p>
      )}

      <div className="mt-4 text-xs font-medium">
        The 10th lord's navamsa from each reference
      </div>
      <Table className="mt-1" data-testid="karmajiva-references" cards>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>10th sign</TableHead>
            <TableHead>10th lord</TableHead>
            <TableHead>Its navamsa</TableHead>
            <TableHead>Navamsa lord</TableHead>
            <TableHead>Calling</TableHead>
            <TableHead>10.4</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {k.references.map((r) => {
            const stronger = k.strongerLuminary === r.reference;
            return (
              <TableRow
                key={r.reference}
                data-testid={`karmajiva-ref-${r.reference.toLowerCase()}`}
                className={cn(stronger && "bg-primary/5")}
              >
                <TableCell className="font-medium">
                  {r.reference}
                  {r.rupas !== undefined && (
                    <span className="ml-1 text-2xs text-muted-foreground">
                      {(r.rupas / 60).toFixed(1)} rupas
                      {stronger ? ", stronger" : ""}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <SignName signIndex={r.tenthSign} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <PlanetName planet={r.tenthLord} /> in{" "}
                  <SignName signIndex={r.tenthLordSign} abbr />
                </TableCell>
                <TableCell>
                  <SignName signIndex={r.navamsaSign} />
                </TableCell>
                <TableCell>
                  <PlanetName planet={r.navamsaLord} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.calling}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.relationNote}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="mt-1 text-2xs text-muted-foreground">
        The Sun and Moon rows carry their Shadbala when the base is known; the
        commentary's first reading takes only the strongest reference,{" "}
        <SourceLink source={src.commentary} />.
      </p>

      <ul className="mt-3 space-y-1 text-xs" data-testid="karmajiva-104">
        <li>
          {k.sunSelfEffort
            ? "The Sun is exalted and strong: wealth by one's own effort."
            : "The Sun is not exalted and strong, so the self-effort clause does not apply."}{" "}
          <SourceLink source={src.v4} />
        </li>
        <li>
          {k.beneficsInGain.length ? (
            <>
              Benefics in the 11th, lagna or 2nd:{" "}
              {k.beneficsInGain.map((p, i) => (
                <span key={p}>
                  {i > 0 && ", "}
                  <PlanetName planet={p} />
                </span>
              ))}
              , wealth in many ways.
            </>
          ) : (
            "No benefic in the 11th, lagna or 2nd, so the many-ways clause does not apply."
          )}{" "}
          <SourceLink source={src.v4} />
        </li>
      </ul>

      <div
        className="mt-3 text-xs text-muted-foreground"
        data-testid="karmajiva-caveats"
      >
        <div className="font-medium">Readings marked provisional</div>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {k.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
