import { useState } from "react";
import { SIGN_LORD } from "@shared/astro";
import {
  VARGAS,
  VARGA_BY_KEY,
  VARGA_SOURCES,
  type VargaChart,
  type VargaKey,
} from "@shared/vargas";
import {
  VARGA_MEANING_BY_KEY,
  VARGA_MEANING_NOTES,
  houseOrdinal,
  housesRead,
  type VargaCite,
} from "@shared/varga-meanings";
import {
  HOUSE_AREAS_PLAIN,
  HOUSE_MATTERS,
  HOUSE_MATTERS_SOURCE,
} from "@shared/parashari-houses";
import { redactProse, withholdText } from "@shared/life-stage";
import { PlanetName, SignName } from "@/components/planet-name";
import { SourceLink } from "@/components/source-link";
import { SectionTitle, usePlain } from "@/components/mode-text";
import { cn } from "@/lib/utils";
import { useSoften } from "@/lib/gentle";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A minor's chart hides a whole line the shared age gate flags, rather than leaving a fragment. */
const gateLine = (s: string | undefined, withheld: boolean) =>
  s && !(withheld && withholdText(s)) ? s : "";

function Cites({ cites }: { cites: VargaCite[] }) {
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {cites.map((c) =>
        c.url ? (
          <SourceLink
            key={c.voice + c.ref}
            source={{ label: `Parashara ${c.ref}`, url: c.url }}
            mark={false}
          />
        ) : (
          <span
            key={c.voice + c.ref}
            className="whitespace-nowrap rounded border border-border/70 bg-muted/40 px-1 py-0.5 font-mono text-2xs text-muted-foreground"
          >
            {c.voice}, {c.ref}
          </span>
        ),
      )}
    </span>
  );
}

/** What the selected chart is for, in each source's words. */
export function VargaMeaningBox({
  varga,
  withheld,
}: {
  varga: VargaKey;
  withheld: boolean;
}) {
  const plain = usePlain();
  const def = VARGA_BY_KEY[varga];
  const m = VARGA_MEANING_BY_KEY[varga];
  const soft = useSoften();
  const mehta = soft(gateLine(m.mehta?.text, withheld));
  const pande = soft(gateLine(m.pande?.text, withheld));
  return (
    <div
      className="mt-3 rounded-md border bg-card p-3 text-xs"
      data-testid="varga-meaning"
    >
      <p className="text-sm font-medium">
        {plain ? "What this chart speaks to" : `What the ${def.key} is for`}
      </p>
      <p className="mt-1 text-sm" data-testid="varga-meaning-plain">
        {cap(m.plain)}.
      </p>
      <dl className="mt-2 grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-2 gap-y-1">
        <dt className="text-muted-foreground">Parashara</dt>
        <dd data-testid="varga-meaning-parashara">
          {cap(def.matter)} <SourceLink source={VARGA_SOURCES.uses} mark={false} />
        </dd>
        {mehta && m.mehta && (
          <>
            <dt className="text-muted-foreground">Mehta</dt>
            <dd data-testid="varga-meaning-mehta">
              {cap(mehta)}{" "}
              <Cites cites={[{ voice: "Mehta", ref: m.mehta.ref }]} />
            </dd>
          </>
        )}
        {pande && m.pande && (
          <>
            <dt className="text-muted-foreground">Pande</dt>
            <dd data-testid="varga-meaning-pande">
              {cap(pande)} <Cites cites={[{ voice: "Pande", ref: m.pande.ref }]} />
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}

/** The twelve houses of the selected chart: the ones a source reads, and the rest by convention. */
export function VargaHouses({
  varga,
  chart,
  withheld,
}: {
  varga: VargaKey;
  chart: VargaChart;
  withheld: boolean;
}) {
  const plain = usePlain();
  const def = VARGA_BY_KEY[varga];
  const m = VARGA_MEANING_BY_KEY[varga];
  const rasi = varga === "D1";
  const usual = (house: number) => {
    if (plain) return HOUSE_AREAS_PLAIN[house];
    const full = HOUSE_MATTERS[house - 1].matters;
    if (!withheld) return full;
    return redactProse(full) || HOUSE_AREAS_PLAIN[house];
  };
  const rows = Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const sign = (chart.lagnaSign + i) % 12;
    const planets = chart.positions
      .filter((p) => p.signIndex === sign)
      .map((p) => p.planet);
    const lord = SIGN_LORD[sign];
    const lp = chart.positions.find((p) => p.planet === lord);
    const lordHouse = lp ? ((lp.signIndex - chart.lagnaSign + 12) % 12) + 1 : null;
    const read = m.houses.find((h) => h.house === house);
    return { house, sign, planets, lord, lordHouse, read };
  });
  return (
    <div
      className="mt-4 rounded-md border bg-card p-3 text-xs"
      data-testid="varga-houses"
    >
      <SectionTitle
        plain="What each house of this chart is read for"
        technical={`Houses in the ${def.key}`}
      />
      {m.notByHouses ? (
        <p className="mt-1" data-testid="varga-houses-not">
          {plain
            ? m.notByHouses.plain
            : gateLine(m.notByHouses.text, withheld) || m.notByHouses.plain}{" "}
          <Cites cites={m.notByHouses.cites} />
        </p>
      ) : (
        <>
          <p className="mt-1 text-muted-foreground" data-testid="varga-houses-note">
            {rasi
              ? "In the birth chart each house carries the matters of 11.2-13."
              : m.houses.length
                ? VARGA_MEANING_NOTES.houses
                : `No source names a house to read in the ${def.key}. Each house shows its birth-chart meaning (11.2-13); reading it for this chart's matter is the app's extension, so it is provisional.`}{" "}
            <SourceLink
              source={{ ...HOUSE_MATTERS_SOURCE, provisional: !rasi }}
              mark={false}
            />
          </p>
          <ul className="mt-2 divide-y" data-testid="varga-houses-list">
            {rows.map((r) => (
              <li
                key={r.house}
                className={cn(
                  "grid grid-cols-[6rem_minmax(0,1fr)] gap-x-2 px-1 py-1.5",
                  r.read && "rounded bg-primary/5",
                )}
                data-testid={`varga-house-${r.house}`}
              >
                <div>
                  <div className="font-medium">{houseOrdinal(r.house)}</div>
                  <div className="whitespace-nowrap text-muted-foreground">
                    <SignName signIndex={r.sign} />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    {r.planets.length ? (
                      r.planets.map((p) => <PlanetName key={p} planet={p} abbr />)
                    ) : (
                      <span className="text-muted-foreground">no planet</span>
                    )}
                    {r.lordHouse && (
                      <span className="text-muted-foreground">
                        · lord <PlanetName planet={r.lord} abbr /> in the{" "}
                        {houseOrdinal(r.lordHouse)}
                      </span>
                    )}
                  </div>
                  {r.read && (
                    <p
                      className="mt-0.5 font-medium"
                      data-testid={`varga-house-read-${r.house}`}
                    >
                      {plain
                        ? cap(r.read.plain)
                        : cap(gateLine(r.read.text, withheld) || r.read.plain)}
                      {plain && r.read.withLord && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · and its lord
                        </span>
                      )}
                      <Cites cites={r.read.cites} />
                    </p>
                  )}
                  <p
                    className="mt-0.5 text-muted-foreground"
                    data-testid={`varga-house-usual-${r.house}`}
                  >
                    {rasi ? "" : plain ? "In the birth chart: " : "Birth-chart matters: "}
                    {usual(r.house)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** All sixteen charts at a glance; a row picks its chart. */
export function VargaOverview({
  current,
  onPick,
  withheld,
}: {
  current: VargaKey;
  onPick: (k: VargaKey) => void;
  withheld: boolean;
}) {
  const [open, setOpen] = useState(false);
  const soft = useSoften();
  return (
    <div className="mt-3">
      <button
        type="button"
        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        data-testid="toggle-varga-overview"
      >
        {open ? "Hide" : "Show"} what each of the sixteen charts is for
      </button>
      {open && (
        <div
          className="mt-2 rounded-md border bg-card p-3 text-xs"
          data-testid="varga-overview"
        >
          <p>
            {VARGA_MEANING_NOTES.base}{" "}
            <Cites cites={[{ voice: "Mehta", ref: VARGA_MEANING_NOTES.baseRef }]} />{" "}
            {VARGA_MEANING_NOTES.time}{" "}
            <Cites cites={[{ voice: "Pande", ref: VARGA_MEANING_NOTES.timeRef }]} />
          </p>
          <ul className="mt-2 divide-y">
            {VARGAS.map((d) => {
              const m = VARGA_MEANING_BY_KEY[d.key];
              const mehta = soft(gateLine(m.mehta?.text, withheld));
              return (
                <li key={d.key} data-testid={`varga-overview-${d.key}`}>
                  <button
                    type="button"
                    onClick={() => onPick(d.key)}
                    aria-pressed={current === d.key}
                    className={cn(
                      "grid w-full grid-cols-[3rem_minmax(0,1fr)] gap-x-2 px-1 py-1.5 text-left hover:bg-muted/40",
                      current === d.key && "rounded bg-primary/5",
                    )}
                    data-testid={`varga-overview-pick-${d.key}`}
                  >
                    <span className="font-medium">{d.key}</span>
                    <span className="min-w-0">
                      <span className="block">
                        <span className="font-medium">{d.name}</span>: {m.plain}
                      </span>
                      <span className="block text-muted-foreground">
                        Parashara: {d.matter}
                        {mehta ? ` · Mehta: ${mehta}` : ""} · Houses read:{" "}
                        {housesRead(m)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-muted-foreground">
            {VARGA_MEANING_NOTES.mehtaRef}{" "}
            <SourceLink source={VARGA_SOURCES.uses} mark={false} />
          </p>
        </div>
      )}
    </div>
  );
}
