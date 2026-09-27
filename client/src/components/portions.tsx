import { useState } from "react";
import {
  STAGE_EFFECT,
  type PlanetPortions,
  type PortionPlace,
  type PortionsResult,
} from "@shared/portions";
import { PlanetName, SignName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ModeText, SectionTitle } from "@/components/mode-text";

const ord = (n: number) =>
  `${n}${["th", "st", "nd", "rd"][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

const STAGE_CLASS = {
  beginning: "bg-verdict-good/15 text-verdict-good",
  middle: "bg-verdict-mixed/15 text-verdict-mixed",
  end: "bg-muted text-muted-foreground",
};

function Stage({ p, n }: { p: PortionPlace; n: number }) {
  return (
    <span className="whitespace-nowrap">
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-xs font-medium",
          STAGE_CLASS[p.stage],
        )}
      >
        {STAGE_EFFECT[p.stage]}
      </span>
      <span className="ml-1 text-xs text-muted-foreground">
        {ord(p.index)} of {n}, {Math.round(p.fraction * 100)}%
      </span>
    </span>
  );
}

function HoraCell({
  h,
  planet,
}: {
  h: PlanetPortions["hora"];
  planet: string;
}) {
  return (
    <div className="space-y-0.5 whitespace-nowrap">
      <div>
        <span className="text-xs">{h.horaOf}'s</span>{" "}
        <Stage p={h.place} n={2} />
      </div>
      <div className="flex flex-wrap gap-1 text-xs">
        {h.fits === "both" ? (
          <span className="rounded bg-verdict-good/15 px-1.5 py-0.5 font-medium text-verdict-good">
            either hora
          </span>
        ) : h.fits ? (
          <span className="rounded bg-verdict-good/15 px-1.5 py-0.5 font-medium text-verdict-good">
            pronounced
          </span>
        ) : planet === "Rahu" || planet === "Ketu" ? null : (
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
            not its hora
          </span>
        )}
        {h.powerful ? (
          <span className="rounded bg-verdict-good/15 px-1.5 py-0.5 font-medium text-verdict-good">
            powerful hora
          </span>
        ) : (
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
            weaker hora here
          </span>
        )}
      </div>
    </div>
  );
}

export function PortionsSection({ r }: { r: PortionsResult }) {
  const [caveats, setCaveats] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-8" data-testid="parashari-portions">
      <SectionTitle
        plain="Where each planet stands within its sign"
        technical="Hora, decanate and trimsamsa effects"
        term="hora"
      >
        <SourceLink source={r.sources.horaFit} />{" "}
        <SourceLink source={r.sources.stagesWidth} />
      </SectionTitle>
      <ModeText
        plain={
          <>
            A sign is 30 degrees wide, and where a planet stands inside it
            matters. Each half of a sign belongs to the Sun or the Moon, and
            some planets act more strongly in one half than the other. Within
            any segment (a half, a third, a quarter, a ninth) a planet early in
            the segment gives its full effect, in the middle a medium one, and
            near the end little. The last column judges each planet by the ruler
            of its trimsamsa, an unequal five-way split. The equal-thirds split
            is this app's reading of the verse, not stated in it.
          </>
        }
        practitioner={
          <>
            Jupiter, the Sun and Mars give pronounced effects in the Sun's hora,
            the Moon, Venus and Saturn in the Moon's, Mercury in either (7.13);
            the Moon's hora is the powerful one in an even sign and the Sun's in
            an odd sign (7.14). A planet's effect is full, medium or nil in the
            beginning, middle or end of its hora, and likewise of its decanate,
            chaturthamsa and navamsa (7.15). In the trimsamsa the Sun is judged
            as Mars and the Moon as Venus, with rasi effects applying (7.16).
            The split of each portion into equal thirds is a reading of 7.15,
            not stated in it, and is provisional.
          </>
        }
      />
      <div className="min-w-0 overflow-x-auto">
        <Table className="mt-2" data-testid="portions-table">
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 sm:px-4">Planet</TableHead>
              <TableHead className="px-2 sm:px-4">Hora</TableHead>
              <TableHead className="hidden px-2 md:table-cell md:px-4">
                Decanate
              </TableHead>
              <TableHead className="hidden px-2 lg:table-cell lg:px-4">
                Chaturthamsa
              </TableHead>
              <TableHead className="hidden px-2 sm:table-cell sm:px-4">
                Navamsa
              </TableHead>
              <TableHead className="hidden px-2 lg:table-cell lg:px-4">
                Trimsamsa
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.planets.map((p) => (
              <>
                <TableRow
                  key={p.planet}
                  className="cursor-pointer"
                  onClick={() =>
                    setOpen((x) => (x === p.planet ? null : p.planet))
                  }
                  data-testid={`portions-row-${p.planet}`}
                >
                  <TableCell className="px-2 py-1.5 align-top sm:px-4">
                    <div className="whitespace-nowrap">
                      <PlanetName planet={p.planet} />
                    </div>
                    <div className="whitespace-nowrap text-xs text-muted-foreground">
                      <SignName signIndex={p.signIndex} abbr />{" "}
                      {p.deg.toFixed(2)}°
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1.5 align-top sm:px-4">
                    <HoraCell h={p.hora} planet={p.planet} />
                  </TableCell>
                  <TableCell className="hidden px-2 py-1.5 align-top md:table-cell md:px-4">
                    <Stage p={p.drekkana} n={3} />
                  </TableCell>
                  <TableCell className="hidden px-2 py-1.5 align-top lg:table-cell lg:px-4">
                    <Stage p={p.chaturthamsa} n={4} />
                  </TableCell>
                  <TableCell className="hidden px-2 py-1.5 align-top sm:table-cell sm:px-4">
                    <Stage p={p.navamsa} n={9} />
                  </TableCell>
                  <TableCell className="hidden px-2 py-1.5 align-top lg:table-cell lg:px-4">
                    {p.trimsamsa ? (
                      <div>
                        <div className="whitespace-nowrap">
                          <PlanetName planet={p.trimsamsa.lord} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.trimsamsa.relation}
                          {p.trimsamsa.judgedAs !== p.planet && (
                            <> as {p.trimsamsa.judgedAs}</>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
                {open === p.planet && (
                  <TableRow
                    key={`${p.planet}-detail`}
                    data-testid={`portions-detail-${p.planet}`}
                  >
                    <TableCell
                      colSpan={6}
                      className="bg-muted/30 px-2 py-2 text-xs sm:px-4"
                    >
                      <ul className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-1">
                        <li className="contents">
                          <span className="text-muted-foreground">Hora</span>
                          <span>
                            {p.hora.horaOf}'s (
                            <SignName signIndex={p.hora.place.signIndex} />
                            ), {ord(p.hora.place.index)} half,{" "}
                            {Math.round(p.hora.place.fraction * 100)}% through:{" "}
                            {STAGE_EFFECT[p.hora.place.stage]} effect (7.15).{" "}
                            {p.hora.fits === "both"
                              ? "Mercury is effective in both horas (7.13)."
                              : p.hora.fits
                                ? "This is the hora in which the planet gives pronounced effects (7.13)."
                                : p.planet === "Rahu" || p.planet === "Ketu"
                                  ? "7.13 does not name the nodes."
                                  : "Not the hora 7.13 assigns to this planet."}{" "}
                            {p.hora.powerful
                              ? "This hora is the powerful one for the sign's parity (7.14)."
                              : `In this ${p.signIndex % 2 === 0 ? "odd" : "even"} sign the ${p.hora.powerfulIn}'s hora is the powerful one (7.14).`}
                          </span>
                        </li>
                        <li className="contents">
                          <span className="text-muted-foreground">
                            Decanate
                          </span>
                          <span>
                            {ord(p.drekkana.index)} of 3 (
                            <SignName signIndex={p.drekkana.signIndex} />
                            ), {Math.round(p.drekkana.fraction * 100)}% through:{" "}
                            {STAGE_EFFECT[p.drekkana.stage]} effect.
                          </span>
                        </li>
                        <li className="contents">
                          <span className="text-muted-foreground">
                            Chaturthamsa
                          </span>
                          <span>
                            {ord(p.chaturthamsa.index)} of 4 (
                            <SignName signIndex={p.chaturthamsa.signIndex} />
                            ), {Math.round(p.chaturthamsa.fraction * 100)}%
                            through: {STAGE_EFFECT[p.chaturthamsa.stage]}{" "}
                            effect.
                          </span>
                        </li>
                        <li className="contents">
                          <span className="text-muted-foreground">Navamsa</span>
                          <span>
                            {ord(p.navamsa.index)} of 9 (
                            <SignName signIndex={p.navamsa.signIndex} />
                            ), {Math.round(p.navamsa.fraction * 100)}% through:{" "}
                            {STAGE_EFFECT[p.navamsa.stage]} effect.
                          </span>
                        </li>
                        {p.trimsamsa && (
                          <li className="contents">
                            <span className="text-muted-foreground">
                              Trimsamsa
                            </span>
                            <span>
                              <SignName signIndex={p.trimsamsa.signIndex} />,
                              lord <PlanetName planet={p.trimsamsa.lord} />
                              {p.trimsamsa.judgedAs !== p.planet
                                ? `; judged as ${p.trimsamsa.judgedAs} by 7.16, `
                                : "; "}
                              the relationship is {p.trimsamsa.relation}, so
                              rasi effects of a{" "}
                              {p.trimsamsa.relation === "own"
                                ? "planet in its own sign"
                                : `${p.trimsamsa.relation}'s sign`}{" "}
                              apply (7.16, provisional).
                            </span>
                          </li>
                        )}
                      </ul>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      <button
        className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
        onClick={() => setCaveats((x) => !x)}
        data-testid="portions-caveats"
      >
        {caveats ? "Hide" : "Show"} reading notes ({r.caveats.length})
      </button>
      {caveats && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {r.caveats.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
