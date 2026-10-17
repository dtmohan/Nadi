import {
  isDeceased,
  lifeAsOf,
  sensitiveGate,
  redactSensitive,
  redactProse,
  SENSITIVE_WITHHELD_NOTE,
} from "@shared/life-stage";
import { GentleNote, Soft } from "@/lib/gentle";
import { formationOnly } from "@shared/gentle";
import {
  ALL_CHAPTERS,
  Chapter,
  Chapters,
  useChapterNav,
  type ChapterDef,
} from "@/components/chapters";
import { ArrowLeft } from "lucide-react";
import type { PlanetCheck } from "@shared/parashari-checks";
import { createContext, useContext, useMemo, useState } from "react";
import {
  levelName,
  dasaCombinations,
  timingNow,
  type TimingNow,
} from "@shared/timing-now";
import {
  TimingContents,
  TimingNowPanel,
  jumpTo,
} from "@/components/parashari-timing-now";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, SIGNS, SIGN_LORD, type Planet } from "@shared/astro";
import {
  computeParashari,
  ord,
  listH,
  runningNowText,
  roleLabel,
  LORDSHIP_LABEL,
  KENDRA,
  ASPECT_FLOOR_LABEL,
  DEFAULT_ASPECT_FLOOR,
  type AspectFloor,
  type ParashariFinding,
  type DashaGloss,
} from "@shared/parashari";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PHALADEEPIKA_CH7_URL } from "@shared/neechabhanga";
import {
  HOUSE_MATTERS,
  HOUSE_MATTERS_SOURCE,
  BHAVA_JUDGEMENT_SOURCE,
  BHAVA_JUDGEMENT_CAVEATS,
  houseBothWays,
  HOUSE_CAVEATS,
} from "@shared/parashari-houses";
import { YOGA_CAVEATS } from "@shared/parashari-yogas";
import { ROYAL_CAVEATS } from "@shared/parashari-royal";
import { FATHER_YOGA_CAVEATS } from "@shared/parashari-father";
import { NODES_CAVEATS, PHALADEEPIKA_CH8_URL } from "@shared/parashari-nodes";
import { normaliseParashariHouseMethod } from "@shared/schema";
import { HOUSE_METHOD_CAVEAT } from "@shared/house-view";
import { EVIL_CAVEATS } from "@shared/parashari-evils";
import { CURSE_CAVEATS } from "@shared/parashari-curses";
import type {
  ConditionalDasasResult,
  ConditionalDasa,
} from "@shared/conditional-dasas";
import {
  KC_SUB_VERSES,
  KC_CH49,
  type KalachakraResult,
  type KcPeriod,
} from "@shared/kalachakra";
import { KC_CH64, KC_CH65, VERSES_65 } from "@shared/kalachakra-effects";
import { PADA_CH, type PadaResult } from "@shared/parashari-padas";
import { MARAKA_CH, type MarakaResult } from "@shared/parashari-marakas";
import {
  AVASTHA_CH,
  type AvasthaResult,
  type StateLine,
} from "@shared/parashari-avasthas";
import {
  RASI_DASA_CH,
  KARAKA_NAME,
  type RasiDasasResult,
  type RasiDasa,
  type RasiPeriod,
} from "@shared/parashari-rasi-dasas";
import { LAGNA_NATURE, BPHS_URL } from "@shared/parashari-data";
import {
  LAYER_LABEL,
  finePeriodsOf,
  type DasaReading,
  type AntarReading,
  type DasaNote,
  type FinePeriod,
} from "@shared/parashari-dasa";
import {
  SHADBALA_SOURCES,
  type ShadbalaResult,
  type PlanetShadbala,
} from "@shared/shadbala";
import type { AshtakavargaResult, Bhinnashtaka } from "@shared/ashtakavarga";
import { computePrasnaAvReadings } from "@shared/prasna-av";
import {
  BHAVA_PHALA_CAVEATS,
  type BhavaPhala,
  type VargaPhala,
} from "@shared/bhava-phala";
import { NAKSHATRAS } from "@shared/astro";
import { computeAvTimeline } from "@shared/av-transit";
import { specialStars } from "@shared/special-stars";
import { VerdictCard, type VerdictSignature } from "@/components/verdict-card";
import { gist, firstClause } from "@shared/synthesis";
import { AvTimelineSection } from "@/components/av-timeline";
import { SpecialStarsSection } from "@/components/special-stars";
import { readFatherArishta } from "@shared/father-arishta";
import { readMotherPoint } from "@shared/mother-point";
import { readKinTransits } from "@shared/kin-transits";
import { KinTransitsSection } from "@/components/kin-transits";
import { computeVargas, type SpouseReading } from "@shared/vargas";
import { VargasSection } from "@/components/vargas";
import {
  restOn,
  timeRest,
  timeRestText,
  type LagnaWindows,
} from "@shared/time-windows";
import { computeChalit } from "@shared/chalit";
import { ChalitSection } from "@/components/chalit";
import { computeSudarshana } from "@shared/sudarshana";
import { computeKarmajiva } from "@shared/karmajiva";
import { KarmajivaSection } from "@/components/karmajiva";
import { computeAyurdaya, formatYears } from "@shared/ayurdaya";
import { computeBalarishta } from "@shared/balarishta";
import { computeBjDasa, type DasaScheme } from "@shared/bj-dasa";
import { naturalBenefic, ruleAspect } from "@shared/parashari";
import { AYUR_RANGE, AYUR_TERM_LABEL } from "@shared/jaimini-ayur";
import { AyurdayaSection } from "@/components/ayurdaya";
import { BalarishtaSection } from "@/components/balarishta";
import { BjDasaSection } from "@/components/bj-dasa";
import { SudarshanaSection } from "@/components/sudarshana";
import { compareSudarshanaEvents } from "@shared/sudarshana-events";
import { computePortions } from "@shared/portions";
import { PortionsSection } from "@/components/portions";
import { SarvarthaSection, sarvarthaLeftOut } from "@/components/sarvartha-section";
import { SC_SOURCE } from "@shared/sarvartha";
import { computeCombinations, CONJUNCTIONS_NOTE } from "@shared/combinations";
import { computeYogas, gateYogas, YOGA_CATEGORY_LABEL, YOGA_NOTE } from "@shared/yoga";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { PlanetName, SignName, planetColor } from "@/components/planet-name";
import { LifeTimeline, type TlWindow } from "@/components/life-timeline";
import { eventMarks, transitBand, vimshottariBands } from "@/lib/timeline-data";
import { SourceLink, Cite } from "@/components/source-link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ModeText,
  SectionTitle,
  usePlain,
  NowWord,
  useDeceased,
  useNowLabel,
} from "@/components/mode-text";
import {
  Expander,
  HOW_COMPUTED,
  HOW_FOUND,
  openExpander,
  Working,
} from "@/components/working";
import { BjCrossSection, BjCross } from "@/components/bj-cross";
import { BJ_CROSS_BY_KEY } from "@shared/bj-cross";
import { Term } from "@/components/term";
import { ParashariSignifications } from "@/components/parashari-significations";
import {
  MODERN_HOUSE_READINGS,
  PHALADEEPIKA_CH2_URL,
} from "@shared/parashari-significations";

/** First letter up, for plain items that read as clauses. */
const capFirst = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const fmt = (iso: string) => DateTime.fromISO(iso).toFormat("LLL yyyy");
const fmtD = (iso: string) => DateTime.fromISO(iso).toFormat("d LLL yyyy");

const VERDICT_CLASS: Record<ParashariFinding["tone"], string> = {
  support: "bg-verdict-good/15 text-verdict-good",
  strain: "bg-verdict-bad/10 text-verdict-bad",
  mixed: "bg-verdict-mixed/15 text-verdict-mixed",
};
const VERDICT_LABEL: Record<ParashariFinding["tone"], string> = {
  support: "favourable",
  strain: "unfavourable",
  mixed: "mixed",
};

const TONE_CLASS: Record<ParashariFinding["tone"], string> = {
  support: "border-l-verdict-good/70",
  strain: "border-l-verdict-bad/70",
  mixed: "border-l-verdict-mixed/70",
};

const ROLE_CLASS: Record<string, string> = {
  yogakaraka: "bg-verdict-good/15 text-verdict-good",
  yogaPair: "bg-verdict-good/15 text-verdict-good",
  auspicious: "bg-verdict-good/10 text-verdict-good",
  malefic: "bg-verdict-bad/10 text-verdict-bad",
  maraka: "bg-verdict-bad/15 text-verdict-bad",
  neutral: "bg-muted text-muted-foreground",
};

const ROLE_NAME: Record<string, string> = {
  yogakaraka: "yogakaraka",
  yogaPair: "raja-yoga pair",
  auspicious: "auspicious",
  malefic: "malefic",
  maraka: "maraka",
  neutral: "neutral",
};

/** Birth-time windows and the chart's stated uncertainty, for readings that rest on a lagna. */
const TimeRestCtx = createContext<{ windows?: LagnaWindows; band: number }>({
  band: 0,
});

/** Where "Back to the card" returns: the card, its chapter, and its panel to reopen. */
interface CardRef {
  testId: string;
  title: string;
  panelId: string;
}

/** The cards' "How this was found" panel: the standard checks per planet, and the way to the strength table. */
const FoundCtx = createContext<{
  checks: Partial<Record<Planet, PlanetCheck[]>>;
  showStrength: (planet: Planet, from: HTMLElement, card: CardRef) => void;
} | null>(null);

/** Run `fn` on the element once it is on the page, e.g. after a chapter switch or a section opening. */
function whenPresent(
  selector: string,
  fn: (el: HTMLElement) => void,
  tries = 40,
) {
  const el = document.querySelector<HTMLElement>(selector);
  if (el) return fn(el);
  if (tries > 0) setTimeout(() => whenPresent(selector, fn, tries - 1), 50);
}

/**
 * "How this was found" on a card: the standard checks for each planet the card names (house,
 * dignity, strength, combustion, war, aspects received, company), folded in both readings. Plain
 * words in the plain reading; figures and verses for practitioners.
 */
function FoundPanel({ f }: { f: ParashariFinding }) {
  const ctx = useContext(FoundCtx);
  const plain = usePlain();
  if (!ctx) return null;
  const planets = Array.from(new Set(f.planets)).filter(
    (p) => ctx.checks[p]?.length,
  );
  if (!planets.length) return null;
  const card: CardRef = {
    testId: `parashari-finding-${f.id}`,
    title: f.title,
    panelId: `found-${f.id}`,
  };
  return (
    <Expander
      id={card.panelId}
      testId={`parashari-found-toggle-${f.id}`}
      label={HOW_FOUND}
      className="mt-2"
    >
      <div
        className="space-y-2 text-xs"
        data-testid={`parashari-found-${f.id}`}
      >
        <p className="text-muted-foreground">
          {plain
            ? "The standard checks for the planets on this card. What the verse itself asks for is under How it forms."
            : "The standard checks for each planet the card names. The verse's own conditions are under How it forms; the rule's path through them is not recorded."}
        </p>
        {planets.map((p) => (
          <div key={p} data-testid={`parashari-found-${f.id}-${p}`}>
            <p className="font-medium">
              <PlanetName planet={p} />
            </p>
            <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-muted-foreground">
              {ctx.checks[p]!.map((c) => (
                <li key={c.kind}>
                  {plain ? c.plain : c.text}
                  {c.table === "shadbala" && (
                    <>
                      {" "}
                      <button
                        type="button"
                        className="underline underline-offset-2 hover:text-foreground"
                        onClick={(e) =>
                          ctx.showStrength(p, e.currentTarget, card)
                        }
                        data-testid={`parashari-found-strength-${f.id}-${p}`}
                      >
                        Full strength table
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Expander>
  );
}

function Finding({ f }: { f: ParashariFinding }) {
  const tr = useContext(TimeRestCtx);
  const plain = usePlain();
  const rest = timeRest(f.id, f.text, tr.windows, tr.band);
  return (
    <div
      className={cn(
        "rounded-md border border-l-4 bg-card p-3",
        f.nullified ? "border-l-border" : TONE_CLASS[f.tone],
      )}
      data-testid={`parashari-finding-${f.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">
          <Soft>{plain && f.titlePlain ? f.titlePlain : f.title}</Soft>
        </span>
        <span className="flex flex-wrap gap-1">
          {Array.from(new Set(f.planets)).map((p) => (
            <PlanetName key={p} planet={p} abbr tone className="text-xs" />
          ))}
        </span>
        {f.source.provisional && (
          <Badge variant="outline" className="text-2xs">
            provisional
          </Badge>
        )}
        {f.nullified && (
          <Badge
            variant="outline"
            className="text-2xs"
            data-testid={`parashari-finding-nullified-${f.id}`}
          >
            set aside
          </Badge>
        )}
        {rest?.sensitive && (
          <Badge
            variant="outline"
            className="border-verdict-mixed/60 text-2xs text-verdict-mixed"
            data-testid={`parashari-finding-time-sensitive-${f.id}`}
          >
            time-sensitive
          </Badge>
        )}
      </div>
      {f.nullified ? (
        <>
          {!plain && (
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          )}
          <p
            className="mt-1 text-sm"
            data-testid={`parashari-finding-nullified-text-${f.id}`}
          >
            {f.nullified.text}{" "}
            <SourceLink
              source={f.nullified.source}
              className="text-2xs text-muted-foreground"
            />
          </p>
        </>
      ) : f.plain ? (
        <>
          <p
            className="mt-1 text-sm"
            data-testid={`parashari-finding-plain-${f.id}`}
          >
            <Soft>{f.plain}</Soft>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium">How it forms: </span>
            <Soft>{plain ? formationOnly(f.text) : f.text}</Soft>
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          <Soft>{plain && f.textPlain ? f.textPlain : f.text}</Soft>
        </p>
      )}
      {rest && (
        <p
          className={cn(
            "mt-1 text-xs",
            rest.sensitive ? "text-verdict-mixed" : "text-muted-foreground",
          )}
          data-testid={`parashari-finding-time-${f.id}`}
        >
          {timeRestText(rest, tr.band)}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        <SourceLink source={f.source} mark={false} />
      </p>
      <FoundPanel f={f} />
    </div>
  );
}

export function ParashariPanel({ result }: { result: ChartResult }) {
  const { positions, chart } = result;
  const combinations = useMemo(
    () =>
      computeCombinations(
        positions,
        result.jaimini.lagna.signIndex,
        result.shadbala,
      ),
    [positions, result.jaimini.lagna.signIndex, result.shadbala],
  );
  // Everything "current" is read at the reading date, or at the recorded date of passing: after a
  // death date nothing here is a forecast, and the running dasa is the one that was running then.
  const asOfIso = lifeAsOf(chart, result.now.asOf);
  const [aspectFloor, setAspectFloor] =
    useState<AspectFloor>(DEFAULT_ASPECT_FLOOR);
  // The sensitive-content gate comes from the server; older cached results fall back to the same rule computed here.
  const withheld =
    result.sensitive?.withheld ??
    sensitiveGate(chart, result.utc, asOfIso).withheld;
  const firedYogas = useMemo(
    () =>
      gateYogas(
        computeYogas({
          positions,
          lagnaIdx: result.jaimini.lagna.signIndex,
        }).filter((y) => y.source.text !== "Jaimini"),
        withheld,
      ),
    [positions, result.jaimini.lagna.signIndex, withheld],
  );
  // Local civil birth year, for the era rule of the significations table.
  const birthYear = Number(chart.birthDate.slice(0, 4)) || undefined;
  const r = useMemo(
    () =>
      computeParashari(
        positions,
        result.jaimini.lagna.lon,
        result.utc,
        asOfIso,
        result.shadbala,
        result.dasaStarts,
        aspectFloor,
        withheld,
        normaliseParashariHouseMethod(chart.parashariHouseMethod),
      ),
    [
      positions,
      result.jaimini.lagna.lon,
      result.utc,
      asOfIso,
      result.shadbala,
      result.dasaStarts,
      aspectFloor,
      withheld,
      chart.parashariHouseMethod,
    ],
  );
  const fatherArishta = useMemo(
    () =>
      result.fatherArishta
        ? readFatherArishta(
            result.fatherArishta,
            r.bhavas[3].lord,
            r.dashas,
            r.dasaReadings,
            result.utc,
            asOfIso,
          )
        : undefined,
    [result.fatherArishta, r, result.utc, asOfIso],
  );
  const motherPoint = useMemo(() => {
    const m = readMotherPoint(
      r.ashtakavarga,
      result.transits,
      result.saturnNakshatras,
      result.moonMonth,
      r.dasaReadings,
      result.utc,
      asOfIso,
      withheld,
    );
    return withheld && m ? redactSensitive(m) : m;
  }, [
    r,
    result.transits,
    result.saturnNakshatras,
    result.moonMonth,
    result.utc,
    asOfIso,
    withheld,
  ]);
  const kinTransits = useMemo(
    () =>
      readKinTransits(
        r.ashtakavarga,
        positions,
        result.fastTransits,
        r.shadbala,
        asOfIso,
        withheld,
      ),
    [r, positions, result.fastTransits, asOfIso, withheld],
  );
  const avTimeline = useMemo(
    () =>
      computeAvTimeline(
        r.ashtakavarga,
        r.lagna.signIndex,
        result.transits,
        result.saturnNakshatras,
        result.utc,
        asOfIso,
      ),
    [r, result.transits, result.saturnNakshatras, result.utc, asOfIso],
  );
  const avTimelineShown = useMemo(
    () => (withheld ? redactSensitive(avTimeline) : avTimeline),
    [avTimeline, withheld],
  );
  // Special stars from the birth star: the gate drops the tagged readings inside specialStars, and
  // redactSensitive catches anything the tags miss.
  const stars = useMemo(() => {
    const s = specialStars({
      passages: result.specialStars,
      moonLon: positions.find((p) => p.planet === "Moon")!.lon,
      asOfIso,
      withheld,
    });
    return withheld ? redactSensitive(s) : s;
  }, [result.specialStars, positions, asOfIso, withheld]);
  const vargas = useMemo(
    () =>
      computeVargas(positions, result.jaimini.lagna.lon, r.vargaExclusions),
    [positions, result.jaimini.lagna.lon, r.vargaExclusions],
  );
  const timeCtx = useMemo(
    () => ({
      windows: result.lagnaWindows,
      band: Math.max(0, chart.timeUncertaintyMin ?? 0),
    }),
    [result.lagnaWindows, chart.timeUncertaintyMin],
  );
  const chalit = useMemo(
    () =>
      result.shadbala
        ? computeChalit(positions, result.shadbala.asc, result.shadbala.mc)
        : undefined,
    [positions, result.shadbala],
  );
  const portions = useMemo(() => computePortions(positions), [positions]);
  const karmajiva = useMemo(
    () => computeKarmajiva(positions, r.lagna.signIndex, r.shadbala),
    [positions, r.lagna.signIndex, r.shadbala],
  );
  const ayurdaya = useMemo(
    () =>
      computeAyurdaya(
        positions,
        result.jaimini.lagna.lon,
        r.shadbala,
        aspectFloor,
      ),
    [positions, result.jaimini.lagna.lon, r.shadbala, aspectFloor],
  );
  const deceased = isDeceased(chart, result.now.asOf);
  const ageYears = useMemo(() => {
    const birth = DateTime.fromISO(result.utc);
    const now = DateTime.fromISO(asOfIso);
    if (!birth.isValid || !now.isValid) return undefined;
    return now.diff(birth, "years").years;
  }, [result.utc, asOfIso, chart]);
  const balarishta = useMemo(
    () =>
      computeBalarishta(
        positions,
        result.jaimini.lagna.lon,
        { aspect: ruleAspect(aspectFloor), benefic: naturalBenefic },
        r.shadbala,
      ),
    [positions, result.jaimini.lagna.lon, r.shadbala, aspectFloor],
  );
  const [dasaScheme, setDasaScheme] = useState<DasaScheme>("amsa");
  const bjDasa = useMemo(
    () =>
      computeBjDasa(
        positions,
        result.jaimini.lagna.lon,
        ayurdaya,
        dasaScheme,
        r.shadbala,
        ageYears,
      ),
    [
      positions,
      result.jaimini.lagna.lon,
      ayurdaya,
      dasaScheme,
      r.shadbala,
      ageYears,
    ],
  );
  const ayurOthers = useMemo(
    () => [
      {
        label: "Ashtakavarga",
        value: formatYears(r.ashtakavarga.ayurdaya),
      },
      ...(result.jaimini.ayur
        ? [
            {
              label: "Jaimini",
              value: `${AYUR_TERM_LABEL[result.jaimini.ayur.term]}, ${AYUR_RANGE[result.jaimini.ayur.term]}`,
            },
          ]
        : []),
    ],
    [r.ashtakavarga.ayurdaya, result.jaimini.ayur],
  );
  const sudarshana = useMemo(
    () =>
      computeSudarshana(
        positions,
        r.lagna.signIndex,
        result.utc,
        asOfIso,
        r.ashtakavarga,
        r.shadbala,
        aspectFloor,
      ),
    [positions, r, result.utc, asOfIso, aspectFloor],
  );
  const sudarshanaEvents = useMemo(
    () =>
      compareSudarshanaEvents(sudarshana, chart.events ?? [], chart.timezone),
    [sudarshana, chart.events, chart.timezone],
  );
  const plain = usePlain();
  const [balaOpen, setBalaOpen] = useState<string | null>(null);
  // A card's "Full strength table" link opens the strength section at the planet's row; the
  // section then offers the way back to the card, in its own chapter.
  const [shadbalaOpen, setShadbalaOpen] = useState(false);
  const [strengthBack, setStrengthBack] = useState<
    (CardRef & { chapter?: string }) | null
  >(null);
  const navChapter = useChapterNav("parashari");
  const [focusHouse, setFocusHouse] = useState<number | null>(null);
  const [section, setSection] = useState<
    "lords" | "yogas" | "houses" | "evils" | "timing"
  >("houses");
  const [dasaPick, setDasaPick] = useState<string | null>(null);
  const [antarOpen, setAntarOpen] = useState<string | null>(null);

  const nature = LAGNA_NATURE[r.lagna.signIndex];
  const lords = r.findings.filter((f) => f.kind === "lord");
  const yogas = r.findings.filter(
    (f) => f.kind !== "lord" && f.kind !== "house" && f.kind !== "evil",
  );
  const evils = r.findings.filter((f) => f.kind === "evil");
  const houseFinds = r.findings.filter((f) => f.kind === "house");
  const shownHouses = focusHouse
    ? houseFinds.filter((f) => f.house === focusHouse)
    : houseFinds;
  const shownLords = focusHouse
    ? lords.filter(
        (f) =>
          f.id === `pa-lord-${focusHouse}-${r.bhavas[focusHouse - 1].lordIn}` ||
          f.id.endsWith(`-${focusHouse}`),
      )
    : lords;
  const focusBhava = focusHouse ? r.bhavas[focusHouse - 1] : null;
  // A focused house whose live readings (after 24.145-148) still point both ways gets one line on how they combine.
  const focusLive = focusHouse
    ? r.findings.filter(
        (f) =>
          !f.nullified &&
          ((f.kind === "house" && f.house === focusHouse) ||
            (f.kind === "lord" && f.id.startsWith(`pa-lord-${focusHouse}-`))),
      )
    : [];
  const focusBothWays =
    focusLive.some((f) => f.tone === "support") &&
    focusLive.some((f) => f.tone === "strain" || (focusHouse === 8 && f.tone === "mixed"));
  const cur = r.dashas.find((d) => d.current);
  const timing = useMemo(
    () =>
      timingNow({
        dasaReadings: r.dasaReadings,
        dashas: r.dashas,
        sudarshana,
        av: avTimelineShown,
        asOfIso,
        past: deceased,
      }),
    [r.dasaReadings, r.dashas, sudarshana, avTimelineShown, asOfIso, deceased],
  );
  const runningDasa = r.dasaReadings.find((d) => d.current);
  const dasaCombos = runningDasa
    ? dasaCombinations(yogas, runningDasa, r.ties, r.natures)
    : null;
  const nowWord = deceased ? "at passing" : "running now";
  const condApplying = r.conditionalDasas.systems.filter((s) => s.applies);
  const condLabel = condApplying.length
    ? `Conditional periods · ${nowWord}: ${condApplying
        .map((s) => {
          const p = s.periods.find((x) => x.current);
          const who = p
            ? p.yogini
              ? `${p.yogini} (${p.lord})`
              : p.lord
            : "none";
          return `${s.name.replace(/ \(.*\)$/, "")} ${who}`;
        })
        .join("; ")}`
    : "Conditional periods · none applies to this chart";
  const charaNow = r.rasiDasas.systems
    .find((s) => s.id === "chara")
    ?.periods.find((p) => p.current);
  const rasiLabel = `Sign-based periods${charaNow ? ` · ${nowWord}: Chara ${SIGNS[charaNow.sign]}, to ${fmt(charaNow.end)}` : ""}`;
  const kcNow = r.kalachakra.periods.find((p) => p.current);
  const kcLabel = `Kalachakra periods${kcNow ? ` · ${nowWord}: ${SIGNS[kcNow.sign]}, to ${fmt(kcNow.end)}` : ""}`;
  const bjLabel = `Varahamihira's planetary years${bjDasa?.current ? ` · ${nowWord}: ${bjDasa.current.lord}` : ""}`;
  const selDasa: DasaReading | undefined =
    r.dasaReadings.find((d) => d.lord === dasaPick) ??
    r.dasaReadings.find((d) => d.current) ??
    r.dasaReadings[0];

  // Shared timeline: the dasas and bhuktis with Saturn's passages, each dasa's verdict from ch. 47-48 as a tinted row, and the recorded events.
  const tlBands = useMemo(
    () => [
      ...vimshottariBands(r.vimshottari),
      transitBand(result.transits, "Saturn", asOfIso),
    ],
    [r.vimshottari, result.transits, asOfIso],
  );
  const tlWindows = useMemo<TlWindow[]>(
    () =>
      r.dasaReadings.map((d) => ({
        start: d.start,
        end: d.end,
        label: `${d.lord} dasa: ${d.verdict === "support" ? "favourable" : d.verdict === "strain" ? "trying" : "mixed"} (BPHS ch. 47-48)`,
        tone:
          d.verdict === "support"
            ? "good"
            : d.verdict === "strain"
              ? "bad"
              : "mixed",
        strength: 0.8,
      })),
    [r.dasaReadings],
  );
  const tlMarks = useMemo(
    () => eventMarks(chart.events, chart.timezone),
    [chart.events, chart.timezone],
  );
  const ageNow =
    DateTime.fromISO(asOfIso).diff(DateTime.fromISO(result.utc), "days").days /
    365.25;

  const badges: Record<number, string[]> = {};
  for (const b of r.bhavas) {
    if (KENDRA.includes(b.house) || [5, 9].includes(b.house))
      badges[b.signIndex] = [KENDRA.includes(b.house) ? "kendra" : "trikona"];
  }

  const chapterDefs: ChapterDef[] = [
    { id: "brief", plain: "In brief", technical: "Summary" },
    {
      id: "houses",
      plain: "Houses",
      technical: "Bhavas",
      blurb: "The twelve houses and their rulers, with what Parashara says of each (ch. 11-24) and the house-boundary check.",
    },
    {
      id: "planets",
      plain: "Planets",
      technical: "Grahas",
      blurb: "Helpers and hinderers for this rising sign, how strong each planet is, its state and the planets gathered together.",
    },
    {
      id: "yogas",
      plain: "Combinations",
      technical: "Yogas",
      count: yogas.length + firedYogas.length,
      blurb: "The named combinations that hold, from Parashara and from Brihat Jataka and Sarvartha Chintamani, each cited.",
    },
    {
      id: "timing",
      plain: "Timing",
      technical: "Dasas",
      blurb: "The life periods and their sub-periods, the three-ring wheel, the sign-based and Kalachakra periods, and transits.",
    },
    {
      id: "vargas",
      plain: "Finer charts",
      technical: "Vargas",
      blurb: "The divisional charts and how comfortably each planet sits in them (ch. 6-7).",
    },
    {
      id: "av",
      plain: "Points table",
      technical: "Ashtakavarga",
      blurb: "The sign-by-sign points of ch. 66-72, with the Prasna Marga readings on the same points.",
    },
    {
      id: "padas",
      plain: "Padas",
      technical: "Padas and Karakamsa",
      blurb: "How each house shows itself in the world, the marriage pada, the significators and the Karakamsa (ch. 29-33).",
    },
    {
      id: "trials",
      plain: "Trials",
      technical: "Arishta and marakas",
      blurb: "Early trials and their remedies, and the periods that strain health, in the gentle wording of the plain reading.",
    },
    {
      id: "sarvartha",
      plain: "Sarvartha",
      technical: "Sarvartha Chintamani",
      count: result.sarvartha?.findings.filter(
        (f) => !sarvarthaLeftOut(f.topic, f.text, plain, withheld),
      ).length,
      blurb: "Venkatesha's house-by-house rules, with the ones that apply to this chart first and the full text after.",
    },
    {
      id: "bj",
      plain: "Brihat Jataka",
      technical: "Brihat Jataka",
      blurb: "Varahamihira on where the living comes from (ch. 10) and the same ground rules checked in his text (ch. 1-2).",
    },
  ];

  const foundCtx = {
    checks: r.checks,
    showStrength: (planet: Planet, from: HTMLElement, card: CardRef) => {
      const chapter =
        from
          .closest("[data-active-chapter]")
          ?.getAttribute("data-active-chapter") ?? undefined;
      setStrengthBack({ ...card, chapter });
      setShadbalaOpen(true);
      setBalaOpen(planet);
      if (chapter !== ALL_CHAPTERS && chapter !== "planets")
        navChapter("planets");
      whenPresent('[data-testid="parashari-shadbala-back"]', (el) =>
        el.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    },
  };
  const backToCard = () => {
    const b = strengthBack;
    if (!b) return;
    setStrengthBack(null);
    if (b.chapter && b.chapter !== ALL_CHAPTERS && b.chapter !== "planets")
      navChapter(b.chapter);
    whenPresent(`[data-testid="${b.testId}"]`, (el) => {
      openExpander(b.panelId);
      setTimeout(
        () => el.scrollIntoView({ behavior: "smooth", block: "center" }),
        60,
      );
    });
  };

  return (
    <TimeRestCtx.Provider value={timeCtx}>
    <FoundCtx.Provider value={foundCtx}>
    <div data-testid="parashari-panel">
      <Chapters tab="parashari" chapters={chapterDefs}>
      <Chapter id="brief">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Parashari</h2>
          <ModeText
            className="mt-0 text-sm"
            plain={
              <>
                This chart's rising sign is {SIGNS[r.lagna.signIndex]}. This
                reading follows the classical text of Parashara: which planets
                help or hinder a person born with {SIGNS[r.lagna.signIndex]}{" "}
                rising, how strong each planet is, what the notable combinations
                promise, and what the life period running now says. Hover a
                dotted term for its meaning; switch to Practitioner for every
                rule and verse.
              </>
            }
            practitioner={
              <>
                {SIGNS[r.lagna.signIndex]} rising, whole-sign bhavas. Lords in
                houses from chapter 24, planetary nature for this lagna from
                chapter 34, aspects from chapter 26, house significations and
                their prosperity or failure from chapter 11, effects of the
                twelve houses from chapters 12-23, evils at birth and their
                antidotes from chapters 9-10, curses from the previous birth
                from chapter 83, yogas from chapters 34 to 42, 75 and 79 of{" "}
                <Cite href={BPHS_URL(24)}>Brihat Parashara Hora Sastra</Cite>{" "}
                (Santhanam translation). Nodes have no aspect in chapter 26 and
                own no house; they are read through their sign lord, and their
                house placements follow{" "}
                <Cite href={PHALADEEPIKA_CH8_URL}>Phaladeepika 8.25-33</Cite>,{" "}
                the one classical table of Rahu and Ketu in each house.
                Cancellation of debilitation follows{" "}
                <Cite href={PHALADEEPIKA_CH7_URL}>Phaladeepika 7.26-30</Cite>{" "}
                (Subrahmanya Sastri translation), since Parashara's verses do
                not state it; later-practice conditions are shown provisional
                and not applied. First pass.
              </>
            }
          />
        </div>
      </div>

      <ParashariVerdict
        r={r}
        cur={cur}
        yogas={yogas}
        spouse={vargas.spouse}
        timing={timing}
      />
      </Chapter>

      <Chapter id="houses">

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-14 lg:max-h-[calc(100svh-4.5rem)] lg:overflow-y-auto lg:pr-1">
          <SouthIndianChart
            positions={positions}
            title="Rasi"
            subtitle="Whole-sign bhavas from the lagna"
            lagnaSign={r.lagna.signIndex}
            badges={badges}
            accent={[r.bhavas[0].lord]}
            footer="Click a sign to read its bhava"
            highlightSign={
              focusHouse ? r.bhavas[focusHouse - 1].signIndex : null
            }
            onSignClick={(si) => {
              const h = ((si - r.lagna.signIndex + 12) % 12) + 1;
              setFocusHouse((cur) => (cur === h ? null : h));
            }}
          />
          <ModeText
            className="mt-2"
            plain={
              <>
                The birth chart. {r.bhavas[0].lord}, ruler of the rising sign,
                is in the primary colour. Angles and trines are the strong and
                fortunate houses; the 3rd, 6th, 8th, 11th and 12th are the ones
                Parashara treats with caution. Click a sign to read its house.
              </>
            }
            practitioner={
              <>
                Lagna lord {r.bhavas[0].lord} in the primary colour. Angles and
                trines are labelled; the 3rd, 6th, 8th, 11th and 12th are the
                houses Parashara treats with caution (34.4-6).
              </>
            }
          />
        </div>

        <div>
          <SectionTitle
            plain="The twelve houses"
            technical="Bhavas"
            term="bhava"
          />
          <Table className="mt-2" data-testid="parashari-bhavas" cards>
            <TableHeader>
              <TableRow>
                <TableHead>House</TableHead>
                <TableHead>Sign</TableHead>
                <TableHead>Lord → in</TableHead>
                <TableHead>Occupants</TableHead>
                <TableHead className="hidden md:table-cell">
                  Aspected by (quarters)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.bhavas.map((b) => (
                <TableRow
                  key={b.house}
                  className={cn(
                    "cursor-pointer",
                    focusHouse === b.house && "bg-primary/5",
                  )}
                  onClick={() =>
                    setFocusHouse((cur) => (cur === b.house ? null : b.house))
                  }
                  data-testid={`parashari-bhava-${b.house}`}
                >
                  <TableCell className="py-1.5 font-medium">
                    {b.house}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <SignName signIndex={b.signIndex} abbr />
                  </TableCell>
                  <TableCell className="py-1.5 whitespace-nowrap">
                    <PlanetName planet={b.lord} abbr />{" "}
                    <span className="text-muted-foreground">→ {b.lordIn}</span>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <span className="flex flex-wrap gap-1">
                      {b.occupants.map((p) => (
                        <PlanetName key={p} planet={p} abbr />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="hidden py-1.5 text-xs text-muted-foreground md:table-cell">
                    {b.aspects
                      .map((a) => `${PLANET_ABBR[a.planet]} ${a.quarters}`)
                      .join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-1 text-xs text-muted-foreground">
            Aspects are sign-based: every planet sees the 7th fully; Saturn the
            3rd and 10th, Jupiter the 5th and 9th, Mars the 4th and 8th fully;
            otherwise 3/10 a quarter, 5/9 a half, 4/8 three quarters,{" "}
            <SourceLink
              source={{ label: "Parashara 26.2-5", url: BPHS_URL(26) }}
            />
            ; the same quarters in <BjCross c={BJ_CROSS_BY_KEY.aspects} />.
          </p>
          <div
            className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
            data-testid="aspect-floor-row"
          >
            <span>Aspects counted by the rules:</span>
            <Select
              value={String(aspectFloor)}
              onValueChange={(v) => setAspectFloor(Number(v) as AspectFloor)}
            >
              <SelectTrigger
                className="h-7 w-44 text-xs"
                data-testid="select-aspect-floor"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([4, 2, 1] as AspectFloor[]).map((f) => (
                  <SelectItem
                    key={f}
                    value={String(f)}
                    className="text-xs"
                    data-testid={`aspect-floor-${f}`}
                  >
                    {ASPECT_FLOOR_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span data-testid="text-aspect-floor-note">
              Parashara grades the aspects but sets no threshold for the
              "aspected by" clauses of his rule chapters, so the strength that
              counts is a provisional convention. Full aspects only (the 7th and
              the special aspects) is the common reading; the table above always
              shows every quarter.
            </span>
          </div>
        </div>
      </div>

      </Chapter>

      <Chapter id="planets">
      <div className="mt-8">
        <SectionTitle
          plain={`Helpers and hinderers for ${SIGNS[r.lagna.signIndex]} rising`}
          technical={`Planets for ${SIGNS[r.lagna.signIndex]} rising`}
          term="yogakaraka"
        />
        <ModeText
          plain={
            <>
              The same planet helps one rising sign and troubles another,
              depending on which houses it rules. Parashara lists the roles for
              each rising sign; these are his for {SIGNS[r.lagna.signIndex]}. A{" "}
              <Term k="yogakaraka">yogakaraka</Term> is the chief helper — a
              planet ruling both an angle and a trine — while some rising
              signs instead name two planets that give their raja yoga only
              together, and a <Term k="maraka">maraka</Term> is a planet
              whose periods can bring illness or loss.
            </>
          }
          practitioner={
            <>
              Functional roles as Parashara states them for this rising sign,{" "}
              <SourceLink
                source={{
                  label: `Parashara ${nature.verses}`,
                  url: BPHS_URL(34),
                }}
              />
              . {withheld ? redactProse(nature.note) : nature.note}
              {nature.byRule?.length ? (
                <>
                  {" "}
                  A planet owning a kendra and a trikona together is a
                  yogakaraka in the special sense, and a malefic kendra lord
                  turns auspicious only by that double lordship,{" "}
                  <SourceLink
                    source={{ label: "Parashara 34.13-14", url: BPHS_URL(34) }}
                  />
                  .
                </>
              ) : null}
              {nature.yogaPair ? (
                <>
                  {" "}
                  The verse names {nature.yogaPair[0]} and{" "}
                  {nature.yogaPair[1]} in the dual as its yoga-givers: neither
                  owns both a kendra and a trikona, so they give the yoga only
                  as a pair, and the role table names each member a half of
                  that pair rather than a yogakaraka,{" "}
                  <SourceLink
                    source={{
                      label: "Parashara 34.13-14",
                      url: BPHS_URL(34),
                    }}
                  />
                  .
                </>
              ) : null}
            </>
          }
        />
        <Table className="mt-2" data-testid="parashari-natures" cards>
          <TableHeader>
            <TableRow>
              <TableHead>Planet</TableHead>
              <TableHead>Owns</TableHead>
              <TableHead>In</TableHead>
              <TableHead>Role here</TableHead>
              <TableHead className="hidden sm:table-cell">
                By lordship
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.natures.map((n) => (
              <TableRow
                key={n.planet}
                data-testid={`parashari-nature-${n.planet}`}
              >
                <TableCell className="py-1.5">
                  <PlanetName planet={n.planet} />
                </TableCell>
                <TableCell className="py-1.5">
                  {n.owns.length ? n.owns.join(", ") : "—"}
                </TableCell>
                <TableCell className="py-1.5">{n.house}</TableCell>
                <TableCell className="py-1.5">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      ROLE_CLASS[n.functional],
                    )}
                  >
                    {n.functional === "maraka" && withheld
                      ? "2nd/7th lord"
                      : (ROLE_NAME[n.functional] ?? n.functional)}
                  </span>
                  {n.naturalBenefic && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      natural benefic
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden py-1.5 text-xs text-muted-foreground sm:table-cell">
                  {LORDSHIP_LABEL[n.lordship]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      </Chapter>

      <Chapter id="houses">
      <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="House views"
          className="inline-flex flex-wrap rounded-md border p-0.5 text-sm"
        >
          <button
            role="tab"
            aria-selected={section !== "lords"}
            onClick={() => setSection("houses")}
            className={cn(
              "rounded px-3 py-1",
              section !== "lords"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid="parashari-section-houses"
          >
            {plain ? "What each house says" : "Houses (ch. 11-23)"} (
            {shownHouses.length}
            {focusHouse ? ` of ${houseFinds.length}` : ""})
          </button>
          <button
            role="tab"
            aria-selected={section === "lords"}
            onClick={() => setSection("lords")}
            className={cn(
              "rounded px-3 py-1",
              section === "lords"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid="parashari-section-lords"
          >
            {plain ? "Where each house's ruler sits" : "Lords in houses"} (
            {shownLords.length}
            {focusHouse ? ` of 12` : ""})
          </button>
        </div>
        {focusHouse && (
          <button
            className="text-xs text-muted-foreground underline underline-offset-2"
            onClick={() => setFocusHouse(null)}
            data-testid="parashari-clear-focus"
          >
            Clear focus on the {ord(focusHouse)}
          </button>
        )}
      </div>
      </Chapter>

      <Chapter id="yogas">
        <SectionTitle
          plain="Combinations Parashara names"
          technical="Yogas (BPHS 34-42)"
          className="mt-8"
        />
        {(
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {yogas.map((f) => (
              <Finding key={f.id} f={f} />
            ))}
            <p className="text-xs text-muted-foreground md:col-span-2">
              <Soft>{YOGA_CAVEATS.join(" ")}</Soft> <Soft>{ROYAL_CAVEATS.join(" ")}</Soft>{" "}
              <Soft>{FATHER_YOGA_CAVEATS.join(" ")}</Soft> Kendra-trikona and node
              yogakarakas are from chapter 34, Neechabhanga from Phaladeepika 7,
              the raja yogas from debility from chapter 39 and the wealth and
              penury verses from chapters 41-42.
            </p>
          </div>
        )}
      </Chapter>
      <Chapter id="trials">
        <SectionTitle
          plain="Early trials, remedies and past-life debts"
          technical="Evils, antidotes and curses (ch. 9-10, 83)"
          className="mt-8"
        />
        {(
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <GentleNote testId="evils-gentle-note" />
            </div>
            {evils.length ? (
              evils.map((f) => <Finding key={f.id} f={f} />)
            ) : (
              <p className="text-sm text-muted-foreground md:col-span-2">
                None of the chapter 9 combinations, and none of the chapter 10
                antidotes, holds in this chart.
              </p>
            )}
            <p className="text-xs text-muted-foreground md:col-span-2">
              <Soft>{[...EVIL_CAVEATS, ...CURSE_CAVEATS].join(" ")}</Soft>
            </p>
          </div>
        )}
      </Chapter>
      <Chapter id="houses">
        {section !== "lords" && (
          <div className="mt-3">
            <Table data-testid="parashari-house-judgement" cards>
              <TableHeader>
                <TableRow>
                  <TableHead>House</TableHead>
                  <TableHead>Signifies (11.2-13)</TableHead>
                  <TableHead>Prospers by (11.14-15)</TableHead>
                  <TableHead>Suffers by (11.16)</TableHead>
                  <TableHead>Sarvartha Chintamani adds</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.bhavaJudgement.map((j) => (
                  <TableRow
                    key={j.house}
                    className={cn(
                      "cursor-pointer",
                      focusHouse === j.house && "bg-primary/5",
                    )}
                    onClick={() =>
                      setFocusHouse((cur) => (cur === j.house ? null : j.house))
                    }
                    data-testid={`parashari-house-judgement-${j.house}`}
                  >
                    <TableCell className="whitespace-nowrap py-1.5 align-top">
                      <span className="font-medium">{j.house}</span>{" "}
                      <SignName signIndex={j.signIndex} abbr />
                      <span
                        className={cn(
                          "ml-1 inline-block h-2 w-2 rounded-full align-middle",
                          j.tone === "support"
                            ? "bg-emerald-500"
                            : j.tone === "strain"
                              ? "bg-rose-500"
                              : j.tone === "mixed"
                                ? "bg-amber-500"
                                : "bg-muted-foreground/30",
                        )}
                        aria-label={j.tone}
                      />
                    </TableCell>
                    <TableCell className="py-1.5 align-top text-xs text-muted-foreground">
                      <Soft>{HOUSE_MATTERS[j.house - 1].matters}</Soft>
                      {(() => {
                        const m = MODERN_HOUSE_READINGS.find(
                          (x) => x.house === j.house,
                        );
                        return m ? (
                          <div
                            className="mt-1 text-2xs"
                            data-testid={`parashari-house-modern-${j.house}`}
                          >
                            Modern (Mehta {m.ref}): {m.reading}
                            {m.note ? `, ${m.note}` : ""}
                            {!plain && m.root ? ` (cf. ${m.root})` : ""}
                          </div>
                        ) : null;
                      })()}
                      {j.chalitNote && (
                        <div
                          className="mt-1 text-2xs text-verdict-mixed"
                          data-testid={`parashari-house-chalit-${j.house}`}
                        >
                          {j.chalitNote}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 align-top text-xs">
                      {j.support.length ? (
                        capFirst((plain ? j.supportPlain : j.support).join("; "))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 align-top text-xs">
                      {j.strain.length ? (
                        capFirst((plain ? j.strainPlain : j.strain).join("; "))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 align-top text-xs text-muted-foreground">
                      {(() => {
                        const fs =
                          result.sarvartha?.findings.filter(
                            (f) =>
                              f.house === j.house &&
                              !sarvarthaLeftOut(f.topic, f.text, plain, withheld),
                          ) ?? [];
                        if (!fs.length)
                          return <span className="text-muted-foreground">—</span>;
                        return (
                          <>
                            {fs.slice(0, 3).map((f, i) => (
                              <div key={i} className="text-2xs leading-4">
                                <span className="font-medium text-foreground">
                                  {f.topic}:
                                </span>{" "}
                                <Soft>{f.text}</Soft>
                              </div>
                            ))}
                            {fs.length > 3 && (
                              <span className="text-2xs text-muted-foreground">
                                +{fs.length - 3} more
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-1 text-xs text-muted-foreground">
              Significations{" "}
              <SourceLink source={HOUSE_MATTERS_SOURCE} mark={false} />;
              prosperity and failure{" "}
              <SourceLink source={BHAVA_JUDGEMENT_SOURCE} mark={false} />. The
              Sarvartha Chintamani column is{" "}
              {SC_SOURCE.label}. <Soft>{BHAVA_JUDGEMENT_CAVEATS.join(" ")}</Soft>
            </p>
            <SectionTitle
              as="h4"
              className="mt-5"
              plain={
                focusHouse
                  ? `What the text says about the ${ord(focusHouse)} house`
                  : "What the text says about the twelve houses"
              }
              technical={
                focusHouse
                  ? `Effects of the ${ord(focusHouse)} house (ch. ${11 + focusHouse})`
                  : "Effects of the twelve houses (ch. 12-23)"
              }
            />
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {shownHouses.map((f) => (
                <Finding key={f.id} f={f} />
              ))}
              {shownHouses.length === 0 && (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  {focusHouse
                    ? `None of the stated combinations of chapter ${11 + focusHouse} hold in this chart.`
                    : "None of the stated combinations of chapters 12-23 hold in this chart."}
                </p>
              )}
              {focusHouse && focusBothWays && (
                <p
                  className="rounded border border-border/60 bg-muted/30 px-3 py-1.5 text-xs md:col-span-2"
                  data-testid="parashari-house-both-ways"
                >
                  {focusHouse === 8
                    ? "Parashara's length-of-life verses may read both ways on one chart; 19.7 leaves the decision to planetary strength, so the readings here are views of the text, not a contradiction."
                    : houseBothWays(
                        r.bhavaJudgement.find((x) => x.house === focusHouse)
                          ?.tone,
                      )}{" "}
                  <SourceLink
                    source={
                      focusHouse === 8
                        ? { label: "Parashara 19.7", url: BPHS_URL(19) }
                        : BHAVA_JUDGEMENT_SOURCE
                    }
                    mark={false}
                  />
                </p>
              )}
              <p className="text-xs text-muted-foreground md:col-span-2">
                <Soft>{`${HOUSE_CAVEATS.join(" ")} Verses on the loss of children, co-born, spouse or father are shown in Parashara's sense but worded plainly; weigh them against the supporting verses and the strength pass before reading them as outcomes. ${NODES_CAVEATS.join(" ")}`}</Soft>
              </p>
              {r.houseMethod !== "rashi" && (
                <p
                  className="rounded border border-verdict-mixed/30 bg-verdict-mixed/10 px-2 py-1.5 text-xs text-muted-foreground md:col-span-2"
                  data-testid="parashari-house-method-caveat"
                >
                  {HOUSE_METHOD_CAVEAT}
                  {r.houseMethodNote ? ` ${r.houseMethodNote}` : ""}
                </p>
              )}
            </div>
          </div>
        )}
      </Chapter>
      <Chapter id="houses">
        {section === "lords" && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {shownLords.map((f) => (
              <Finding key={f.id} f={f} />
            ))}
            <p className="text-xs text-muted-foreground md:col-span-2">
              Parashara qualifies all of these by the lord's strength: full
              effect when strong, half when middling, a quarter when weak; where
              a planet owns two houses and the results contradict, they cancel,{" "}
              <SourceLink
                source={{ label: "Parashara 24.145-148", url: BPHS_URL(24) }}
              />
              .{" "}
              {r.shadbala
                ? "The qualifier in each card uses the Shadbala in the planets chapter: full at or above the requirement of 27.32-33, half from three quarters of it, a quarter below that; the thresholds for half and quarter are not stated in the text."
                : "Strength (Shadbala) needs a recomputed chart; open the chart again to fetch it."}
            </p>
          </div>
        )}
      </Chapter>
      <Chapter id="timing">
        <SectionTitle
          plain="When things happen"
          technical="Timing: dasas, chakras and transits"
          className="mt-8"
        />
        {(
          <div data-testid="parashari-timing">
            <p className="mt-3 text-xs text-muted-foreground">
              {plain
                ? "Parashara's clocks for this chart, all read from the same birth positions. Where things stand now comes first; then the life periods and their sub-periods, the transits scored against the points tables, the three-ring wheel turning year by year, and the other period systems, folded."
                : "The Parashari timing methods, read from the same natal positions: the running levels first, then Vimshottari with antar dasas (ch. 46-60), the Ashtakavarga transits (ch. 66-72), the Sudarshana chakra (ch. 74), and the conditional and rasi dasas, Kalachakra (ch. 46, 50) and Brihat Jataka 8. Gochara from the Moon stays in the Panchanga tab, being Brihat Samhita and Phaladeepika, not Parashara."}
            </p>
            <TimingContents />
            <TimingNowPanel
              now={timing}
              dasaCombos={dasaCombos}
              deceased={deceased}
              states={r.avasthas.lines}
            />
            <div
              className="mt-8 scroll-mt-24"
              data-testid="parashari-timing-periods"
            >
              <SectionTitle
                plain="Life periods"
                technical="Vimshottari dasa, read by lordship"
                term="vimshottari"
              />
              <ModeText
                plain={
                  <>
                    Life is divided into planetary periods of fixed length, 120
                    years in all, starting from the Moon's position at birth.
                    The period running now colours the present years; each is
                    judged by the houses its planet rules and by its role for{" "}
                    {SIGNS[r.lagna.signIndex]} rising. Pick a period to read
                    what the text says about it and to see its sub-periods.
                  </>
                }
                practitioner={
                  <>
                    Same Vimshottari sequence as the KP panel but from the
                    Lahiri Moon (
                    {positions.find((p) => p.planet === "Moon")?.nakshatra}),
                    balance {r.vimshottari.balanceYears.toFixed(2)} years of{" "}
                    {r.vimshottari.dasas[0].lord}. Each lord is glossed by the
                    houses it owns and occupies and by its role for this rising
                    sign. Pick a dasa row to read its effects from ch. 47-48 and
                    ch. 50 and its antar dasas from ch. 52-60.
                  </>
                }
              />
              <LifeTimeline
                className="mt-3"
                testid="parashari-timeline"
                birthIso={result.utc}
                deathIso={chart.deathDate}
                asOfIso={asOfIso}
                bands={tlBands}
                windows={tlWindows}
                windowsLabel="Verdict"
                marks={tlMarks}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {plain
                  ? "The Verdict row tints each period by what the text says of its planet for this chart: green favourable, amber mixed, red trying. Saturn's passages are drawn for comparison only."
                  : "The Verdict row carries each dasa's balance of support and strain from BPHS ch. 47-48; Saturn's sign passages are shown for reference and are not part of the dasa judgement."}
              </p>
              <Table className="mt-3" data-testid="parashari-dashas" cards>
                <TableHeader>
                  <TableRow>
                    <TableHead>{plain ? "Period" : "Dasa"}</TableHead>
                    <TableHead className="text-right">Age</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Dates
                    </TableHead>
                    <TableHead>Reading</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.dashas.map((d) => (
                    <TableRow
                      key={d.lord + d.start}
                      className={cn(
                        "cursor-pointer",
                        d.current && "bg-primary/5",
                        selDasa?.lord === d.lord &&
                          "ring-1 ring-inset ring-primary/40",
                      )}
                      onClick={() => {
                        setDasaPick(d.lord);
                        setAntarOpen(null);
                      }}
                      data-testid={`parashari-dasa-${d.lord}`}
                    >
                      <TableCell className="py-1.5 whitespace-nowrap">
                        <PlanetName planet={d.lord} />
                        {d.current && (
                          <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-primary-foreground">
                            <NowWord />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5 text-right whitespace-nowrap">
                        {d.ageStart.toFixed(1)}–{d.ageEnd.toFixed(1)}
                      </TableCell>
                      <TableCell className="hidden py-1.5 text-muted-foreground sm:table-cell whitespace-nowrap">
                        {fmt(d.start)} – {fmt(d.end)}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "mr-1 rounded px-1.5 py-0.5 text-xs font-medium",
                            ROLE_CLASS[d.functional],
                          )}
                        >
                          {plain
                            ? r.withheld && d.functional === "maraka"
                              ? "lord of the 2nd or 7th"
                              : (PLAIN_ROLE[d.functional] ?? d.functional)
                            : roleLabel(d.functional, r.withheld)}
                        </span>
                        {plain ? d.plain : d.summary}
                        {plain &&
                          (() => {
                            const v = r.dasaReadings.find(
                              (x) => x.lord === d.lord && x.start === d.start,
                            )?.verdict;
                            return v ? (
                              <span
                                className={cn(
                                  "ml-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium",
                                  VERDICT_CLASS[v],
                                )}
                                data-testid={`parashari-dasa-row-verdict-${d.lord}`}
                              >
                                {VERDICT_LABEL[v]}
                              </span>
                            ) : null;
                          })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {cur && (
                <p
                  className="mt-2 text-xs text-muted-foreground"
                  data-testid="parashari-current"
                >
                  {runningNowText(cur, plain)}
                </p>
              )}
            </div>
            {selDasa && (
              <DasaEffects
                d={selDasa}
                states={r.avasthas.lines.find((l) => l.planet === selDasa.lord) ?? null}
                open={antarOpen}
                setOpen={setAntarOpen}
                birthIso={result.utc}
                asOfIso={asOfIso}
                withheld={withheld}
              />
            )}
            <div
              className="scroll-mt-24"
              data-testid="parashari-timing-transits"
            >
              <AvTimelineSection
                tl={avTimelineShown}
                asOfIso={asOfIso}
                arishta={fatherArishta}
                mother={motherPoint}
                withheld={withheld}
              />
              <Working
                id="parashari-kin"
                label="Show Mars, Mercury and Venus through their own point tables"
                className="mt-8"
              >
                <KinTransitsSection k={kinTransits} />
              </Working>
            </div>
            <div
              className="mt-8 scroll-mt-24"
              data-testid="parashari-timing-stars"
            >
              <SpecialStarsSection
                s={stars}
                asOfIso={asOfIso}
                birthIso={result.utc}
              />
            </div>
            <div
              className="mt-8 scroll-mt-24"
              data-testid="parashari-timing-year"
            >
              <SudarshanaSection s={sudarshana} events={sudarshanaEvents} />
            </div>
            <div
              className="mt-10 scroll-mt-24"
              data-testid="parashari-other-clocks"
            >
              <SectionTitle
                plain="Other clocks"
                technical="Conditional, rasi, Kalachakra and Brihat Jataka dasas"
              />
              <ModeText
                plain={
                  <>
                    Parashara gives other ways of dividing a life into periods,
                    some only for particular charts; the last here is
                    Varahamihira's. Each is folded with what it has running
                    now. Open one for its table and readings.
                  </>
                }
                practitioner={
                  <>
                    The conditional nakshatra dasas of ch. 46 with their
                    adoption tests, the rasi dasas of ch. 46 and 51, Kalachakra
                    (ch. 46, 49-50) and the planetary-year dasas of Brihat
                    Jataka 8.
                  </>
                }
              />
              <Working
                id="parashari-conditional"
                label={condLabel}
                className="mt-3"
              >
                <ConditionalDasasSection cd={r.conditionalDasas} />
              </Working>
              <Working id="parashari-rasi" label={rasiLabel} className="mt-2">
                <RasiDasasSection d={r.rasiDasas} />
              </Working>
              <Working
                id="parashari-kalachakra"
                label={kcLabel}
                className="mt-2"
              >
                <KalachakraSection k={r.kalachakra} />
              </Working>
              {!withheld && (
                <Working
                  id="parashari-bj-dasa"
                  label={bjLabel}
                  className="mt-2"
                >
                  <BjDasaSection
                    d={bjDasa}
                    ageYears={ageYears}
                    deceased={deceased}
                    scheme={dasaScheme}
                    onScheme={setDasaScheme}
                  />
                </Working>
              )}
            </div>
          </div>
        )}
      </Chapter>

      <Chapter id="planets">
      {r.shadbala && (
        <Working
          id="parashari-shadbala"
          label="Show how strong each planet is (Shadbala)"
          className="mt-8"
          open={shadbalaOpen}
          onOpenChange={setShadbalaOpen}
        >
          <ShadbalaSection
            sb={r.shadbala}
            open={balaOpen}
            setOpen={setBalaOpen}
            phala={r.bhavaPhala}
            varga={r.vargaPhala}
            back={strengthBack}
            onBack={backToCard}
          />
        </Working>
      )}
      </Chapter>
      <Chapter id="vargas">
      <VargasSection
        v={vargas}
        name={chart.name}
        windows={result.lagnaWindows}
        band={timeCtx.band}
        withheld={withheld}
      />
      </Chapter>
      <Chapter id="planets">
      <Working
        id="parashari-portions"
        label="Show where each planet stands within its sign (hora, decanate, trimsamsa)"
        className="mt-8"
      >
        <PortionsSection r={portions} />
      </Working>
      </Chapter>
      <Chapter id="houses">
      {chalit && (
        <Working
          id="parashari-chalit"
          label="Show the house-boundary cross-check (bhava chalit)"
          className="mt-8"
        >
          <ChalitSection
            c={chalit}
            defaultMethod={
              r.houseMethod === "sripati" || r.houseMethod === "equal"
                ? r.houseMethod
                : undefined
            }
          />
        </Working>
      )}
      </Chapter>
      <Chapter id="av">
      <div className="mt-8" data-testid="parashari-ashtakavarga">
        <AshtakavargaSection
          av={r.ashtakavarga}
          lagnaIdx={r.lagna.signIndex}
          withheld={withheld}
        />
      </div>
      </Chapter>
      <Chapter id="bj">
      <div className="mt-8" data-testid="parashari-karmajiva">
        <KarmajivaSection k={karmajiva} />
      </div>
      </Chapter>
      <Chapter id="trials">
      {/* Length-of-life and infancy checks: practitioner reading only, and never for a chart under 18. */}
      {!plain && !withheld ? (
        <>
          <Working
            id="parashari-ayurdaya"
            label="Show the span of life by planetary years (Brihat Jataka 7)"
            className="mt-8"
          >
            <AyurdayaSection
              a={ayurdaya}
              ageYears={ageYears}
              deceased={deceased}
              otherEstimates={ayurOthers}
            />
          </Working>
          <Working
            id="parashari-balarishta"
            label="Show the classical checks on infancy (Brihat Jataka 6)"
            className="mt-8"
          >
            <BalarishtaSection b={balarishta} ageYears={ageYears} />
          </Working>
        </>
      ) : (
        <p
          className="mt-8 text-xs text-muted-foreground"
          data-testid="parashari-lifespan-gate"
        >
          {withheld
            ? SENSITIVE_WITHHELD_NOTE
            : "The classical length-of-life and infancy checks (Brihat Jataka 6-7) are shown in the practitioner reading only."}
        </p>
      )}
      </Chapter>
      <Chapter id="bj">
      <div className="mt-8" data-testid="parashari-bj-cross">
        <BjCrossSection withheld={withheld} />
      </div>
      </Chapter>

      <Chapter id="padas">
      <PadasSection p={r.padas} birthYear={birthYear} withheld={withheld} />
      </Chapter>
      <Chapter id="trials">
      {r.marakas ? (
        <MarakasSection m={r.marakas} deceased={deceased} />
      ) : (
        <p
          className="mt-8 text-xs text-muted-foreground"
          data-testid="parashari-marakas-gate"
        >
          {SENSITIVE_WITHHELD_NOTE}
        </p>
      )}
      </Chapter>
      <Chapter id="planets">
      <AvasthasSection a={r.avasthas} />
      </Chapter>
      <Chapter id="sarvartha">
      <SarvarthaSection sarvartha={result.sarvartha} withheld={withheld} />
      </Chapter>

      <Chapter id="planets">
      <section className="mt-8" data-testid="conjunctions-section">
        <SectionTitle plain="Planets gathered together" technical="Conjunctions" />
        <ModeText
          plain={
            <>
              Where two or more planets stand in one sign, their matters
              gather. The planet ahead by degree leads the group; two of Mars
              to Saturn within one degree fight, the more northern one
              winning.
            </>
          }
          practitioner={<>{CONJUNCTIONS_NOTE}</>}
        />
        {combinations.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No sign holds two or more planets.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {combinations.map((c) => (
              <li
                key={c.signIndex}
                className="rounded-md border bg-card p-3 text-xs"
              >
                <span className="font-medium">
                  {c.count} planets in the {ord(c.house)} house ({c.sign})
                </span>{" "}
                <span className="text-muted-foreground">
                  — led by {c.lead.planet} (highest degree).
                </span>
                {c.wars.length > 0 && (
                  <div className="mt-1 text-verdict-mixed">
                    {c.wars
                      .map(
                        (w) =>
                          `${w.victor} defeats ${w.loser} (${w.separation.toFixed(1)}° apart)`,
                      )
                      .join("; ")}
                    .
                  </div>
                )}
                {c.combust.length > 0 && (
                  <div className="mt-1 text-verdict-mixed">
                    {c.combust.map((p) => p.planet).join(", ")} combust.
                  </div>
                )}
                <div className="mt-1 text-muted-foreground">
                  {c.planets
                    .map((p) => `${p.planet} ${p.degInSign.toFixed(1)}°`)
                    .join(" · ")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </Chapter>

      <Chapter id="yogas">
      <section className="mt-8" data-testid="yogas-section">
        <SectionTitle
          plain="Combinations in the later texts"
          technical="Yogas of Brihat Jataka and Sarvartha Chintamani"
        />
        <ModeText
          plain={
            <>
              Named combinations from Varahamihira&apos;s Brihat Jataka
              (chapters 11-16 and 22-23) and Venkatesha&apos;s Sarvartha
              Chintamani (chapter 9) that hold for this chart, each cited to its
              chapter and stanza. Jaimini&apos;s own raja yogas are read in the
              Jaimini tab.
            </>
          }
          practitioner={
            <>
              {YOGA_NOTE} Jaimini&apos;s raja yogas (chara karakas and sign
              aspects) are read in the Jaimini tab, not here.
            </>
          }
        />
        {firedYogas.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No Nabhasa yoga holds for this chart.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {firedYogas.map((y) => (
              <li
                key={y.id}
                className="rounded-md border bg-card p-3 text-xs"
              >
                <span className="font-medium">{y.name}</span>{" "}
                <span className="text-muted-foreground">
                  · {YOGA_CATEGORY_LABEL[y.category]} · {y.source.text} — {y.condition}.
                </span>{" "}
                <span>
                  <Soft>{capFirst(y.result)}</Soft>.
                </span>{" "}
                <SourceLink
                  source={{
                    label: `${y.source.text} ${y.source.chapter}${y.source.stanza ? `.${y.source.stanza}` : ""}`,
                    url: y.source.url ?? "",
                  }}
                  mark={false}
                />
                {y.here ? (
                  <span
                    className="mt-1 block text-muted-foreground"
                    data-testid={`yoga-here-${y.id}`}
                  >
                    Here: {plain && y.herePlain ? y.herePlain : y.here}.
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      </Chapter>
      </Chapters>
    </div>
    </FoundCtx.Provider>
    </TimeRestCtx.Provider>
  );
}

function KalachakraSection({ k }: { k: KalachakraResult }) {
  const plain = usePlain();
  const curIdx = k.periods.findIndex((p) => p.current);
  const [pick, setPick] = useState<number>(curIdx >= 0 ? curIdx : 0);
  const sel: KcPeriod | undefined = k.periods[pick];
  const readings = sel ? k.readingsFor(sel) : [];
  const subs = sel ? k.subPeriods(sel) : [];
  const yrs = (y: number) =>
    y.toFixed(Math.abs(y - Math.round(y)) < 0.005 ? 0 : 2);
  return (
    <div className="mt-8" data-testid="parashari-kalachakra">
      <SectionTitle
        plain="The wheel of time"
        technical="Kalachakra dasa (46.52-154, ch. 49)"
      />
      <ModeText
        plain={
          <>
            A second clock Parashara sets great store by. The Moon's birth star
            and quarter place the chart on one of two wheels and pick out nine
            signs in a fixed order; each sign rules a stretch of years given by
            its planet. Pick a stretch to read what the text says of it and its
            smaller divisions.
          </>
        }
        practitioner={
          <>
            {k.chakra} chakra: Moon in {k.nakshatra} pada {k.pada}, the{" "}
            {SIGNS[k.amsa]} navamsa (46.87-88), whose nine signs are{" "}
            {k.sequence.map((s) => SIGNS[s]).join(", ")} ({k.totalYears} years,
            46.89). Deha {SIGNS[k.deha]}, Jiva {SIGNS[k.jiva]} (46.94). Expired
            at birth {k.expiredYears.toFixed(2)} years by the elapsed part of
            the navamsa (46.93), so the dasa opens in {SIGNS[k.periods[0].sign]}{" "}
            with {k.balanceYears.toFixed(2)} years to run.
          </>
        }
      />
      {plain && (
        <p
          className="mt-2 text-sm text-muted-foreground"
          data-testid="kalachakra-summary"
        >
          Born with the Moon in {k.nakshatra}, quarter {k.pada}: the {k.chakra}{" "}
          wheel, signs {k.sequence.map((s) => SIGNS[s]).join(", ")},{" "}
          {k.totalYears} years in all; the first stretch,{" "}
          {SIGNS[k.periods[0].sign]}, had {k.balanceYears.toFixed(1)} years left
          at birth.
        </p>
      )}
      {k.amsaNature && (
        <p className="mt-2 text-sm">
          Born in the {SIGNS[k.amsa]} navamsa of the wheel, the text calls the
          native {k.amsaNature}.{" "}
          <SourceLink
            source={{
              label: "Parashara 46.120-122",
              url: k.dehaJiva[0].source.url,
            }}
          />
        </p>
      )}
      {k.dehaJiva.map((d, i) => (
        <p key={i} className="mt-2 text-sm" data-testid="kalachakra-deha-jiva">
          <Soft>{d.text}</Soft> <SourceLink source={d.source} />
        </p>
      ))}
      <Table className="mt-3" data-testid="kalachakra-periods" cards>
        <TableHeader>
          <TableRow>
            <TableHead>{plain ? "Stretch" : "Dasa"}</TableHead>
            <TableHead className="text-right">Years</TableHead>
            <TableHead className="text-right">Age</TableHead>
            <TableHead className="hidden sm:table-cell">Dates</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {k.periods.map((p, i) => (
            <TableRow
              key={i}
              className={cn(
                "cursor-pointer",
                i === pick && "bg-primary/10",
                p.repeated && "text-muted-foreground",
              )}
              onClick={() => setPick(i)}
              data-testid={`kalachakra-period-${i}`}
              aria-selected={i === pick}
            >
              <TableCell>
                <SignName signIndex={p.sign} />
                {p.current ? (
                  <Badge variant="secondary" className="ml-2">
                    <NowWord />
                  </Badge>
                ) : null}
                {p.gati ? (
                  <span
                    className="ml-1.5 text-2xs uppercase tracking-wide text-muted-foreground"
                    title={`From ${SIGNS[p.gatiFrom!]}`}
                  >
                    {p.gati}
                  </span>
                ) : null}
                {p.repeated ? (
                  <span className="ml-1.5 text-2xs uppercase tracking-wide text-muted-foreground">
                    repeated
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {yrs(p.years)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {Math.max(0, p.ageStart).toFixed(1)} to {p.ageEnd.toFixed(1)}
              </TableCell>
              <TableCell className="hidden sm:table-cell tabular-nums">
                {fmt(p.start)} to {fmt(p.end)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sel && (
        <div className="mt-4" data-testid="kalachakra-detail">
          <h4 className="text-sm font-semibold">
            {SIGNS[sel.sign]} {plain ? "stretch" : "dasa"}, {fmt(sel.start)} to{" "}
            {fmt(sel.end)}
          </h4>
          <ul className="mt-2 space-y-2">
            {readings.map((rd, i) => (
              <li
                key={i}
                className="text-sm"
                data-testid={`kalachakra-reading-${i}`}
              >
                <span
                  className={cn(
                    "mr-1.5 inline-block h-2 w-2 rounded-full align-middle",
                    rd.tone === "support"
                      ? "bg-emerald-500"
                      : rd.tone === "strain"
                        ? "bg-rose-500"
                        : "bg-amber-500",
                  )}
                  aria-label={rd.tone}
                />
                <span className="font-medium">{rd.label}.</span>{" "}
                <Soft>{rd.text}</Soft> <SourceLink source={rd.source} />
              </li>
            ))}
          </ul>
          <SectionTitle
            as="h4"
            className="mt-4"
            plain={`Smaller divisions of the ${SIGNS[sel.sign]} stretch`}
            technical={`Navamsa sub-periods of the ${SIGNS[sel.sign]} dasa (49.${KC_SUB_VERSES[sel.sign]})`}
          />
          <Table className="mt-2" data-testid="kalachakra-subs" cards>
            <TableHeader>
              <TableRow>
                <TableHead>{plain ? "Division" : "Navamsa"}</TableHead>
                <TableHead className="text-right">Years</TableHead>
                <TableHead className="hidden sm:table-cell">Dates</TableHead>
                <TableHead>{plain ? "Reading" : "Reading (49, 65)"}</TableHead>
                <TableHead>
                  {plain ? "By its planet" : "By lord (64)"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((sp, i) => (
                <TableRow
                  key={i}
                  className={cn(sp.current && "bg-primary/10")}
                  data-testid={`kalachakra-sub-${i}`}
                >
                  <TableCell>
                    <SignName signIndex={sp.sign} />
                    {sp.current ? (
                      <Badge variant="secondary" className="ml-2">
                        <NowWord />
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sp.years.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell tabular-nums">
                    {fmt(sp.start)} to {fmt(sp.end)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span>
                      {sp.effect ? (
                        <>
                          {sp.effect.charAt(0).toUpperCase()}
                          {sp.effect.slice(1)}.
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Not given in ch. 49.
                        </span>
                      )}
                      {sp.variant65 ? (
                        <span className="text-muted-foreground">
                          {" "}
                          Ch. 65 reads {sp.variant65}.
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span>
                      <PlanetName planet={sp.byLord.lord} />
                      {k.chakra === "Savya" ? (
                        sp.byLord.text ? (
                          <>
                            : <Soft>{sp.byLord.text}</Soft>.
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            : not given.
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground">
                          : judged by nature and friendship (64.56-58).
                        </span>
                      )}
                      {sp.byLord.relation !== "same" ? (
                        <span className="ml-1.5 whitespace-nowrap text-2xs uppercase tracking-wide text-muted-foreground">
                          {sp.byLord.relation} of {SIGN_LORD[sel.sign]}
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-1 text-xs text-muted-foreground">
            Sub-period readings from{" "}
            <Cite href={KC_CH49}>Parashara 49.{KC_SUB_VERSES[sel.sign]}</Cite>;
            49.7 adds that the planet occupying the sign must be weighed with
            them, and 49.35-37 that the raja-yoga dasa effects apply here too.
            Where <Cite href={KC_CH65}>Parashara 65.{VERSES_65[sel.sign]}</Cite>{" "}
            differs in sense it is shown beside. The lord column follows{" "}
            <Cite href={KC_CH64}>Parashara 64</Cite>
            {k.chakra === "Savya"
              ? ""
              : ", whose lists are for the Savya chakra; for Apsavya births 64.56-58 asks that a friend of the dasa lord be read as favourable and a benefic enemy as not"}
            ; spans follow 51.12.
          </p>
        </div>
      )}
      <Expander
        testId="kalachakra-caveats-toggle"
        label={HOW_COMPUTED}
        className="mt-3"
        contentClassName=""
      >
        <p className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Soft>{k.caveats.join(" ")}</Soft>
        </p>
      </Expander>
    </div>
  );
}

function PadasSection({
  p,
  birthYear,
  withheld,
}: {
  p: PadaResult;
  birthYear?: number;
  withheld: boolean;
}) {
  const plain = usePlain();
  const chapters: {
    ch: 29 | 30 | 31 | 32 | 33;
    title: string;
    plainTitle: string;
  }[] = [
    {
      ch: 32,
      title: "Karakas and yogakarakas (ch. 32)",
      plainTitle: "The chart's significators",
    },
    {
      ch: 29,
      title: "Bhava padas (ch. 29)",
      plainTitle: "The padas: what the world sees",
    },
    {
      ch: 30,
      title: "Upapada (ch. 30)",
      plainTitle: "The Upapada: spouse and kin",
    },
    {
      ch: 31,
      title: "Argala (ch. 31)",
      plainTitle: "Argala: planets that intervene",
    },
    {
      ch: 33,
      title: "Karakamsa (ch. 33)",
      plainTitle: "The Karakamsa: the soul's sign",
    },
  ];
  const byCh = (ch: number) =>
    p.findings.filter((f) => f.id.startsWith(`pd-${ch}-`));
  const houseArgalas = p.houseArgalas.filter((h) => h.net.length);
  return (
    <div className="mt-8" data-testid="parashari-padas">
      <SectionTitle
        plain="Padas, significators and the Karakamsa"
        technical="Bhava padas, Upapada, Argala, karakas and Karakamsa (ch. 29-33)"
      />
      <ModeText
        plain={
          <>
            Five short chapters where Parashara borrows the Jaimini toolkit. A
            pada is a sign found by counting from a house to its lord and as far
            again: it shows how that house appears to the world. The Upapada
            does this for the 12th and is read for the spouse. Argala is a
            planet standing in the 2nd, 4th, 11th or 5th from a point, helping
            or hindering it unless a planet opposite it intervenes. The karakas
            are the planets ranked by degree, and the Karakamsa is the
            ninth-division sign of the highest, read for character, learning and
            livelihood.
          </>
        }
        practitioner={
          <>
            Padas per 29.1-5 with the 7th exception; graha padas 29.6-7; Upapada
            as pada of the 12th (30.1); argala from the 2nd, 4th, 11th and 5th
            with obstruction from the 12th, 10th, 3rd and 9th, nodes reversed
            (31.1-6); seven karakas 32.1-17 with the Matri and Putra karakas
            merged (32.16); the Karakamsa as the Atmakaraka's navamsa sign
            (33.1), with planets counted from it in the navamsa. All aspects
            here are rasi drishti. Findings are kept out of the summary.
          </>
        }
      />
      <SectionTitle
        as="h4"
        className="mt-4"
        plain={chapters[0].plainTitle}
        technical={chapters[0].title}
      />
      <Table className="mt-2" data-testid="padas-karakas" cards>
        <TableHeader>
          <TableRow>
            <TableHead>Karaka</TableHead>
            <TableHead>Planet</TableHead>
            <TableHead className="text-right">Degree</TableHead>
            <TableHead className="hidden sm:table-cell">Signifies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {p.karakas.map((k) => (
            <TableRow key={k.id} data-testid={`padas-karaka-${k.id}`}>
              <TableCell>
                <span>
                  {k.id} <span className="text-muted-foreground">{k.name}</span>
                </span>
              </TableCell>
              <TableCell>
                <PlanetName planet={k.planet} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {k.degInSign.toFixed(2)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                <Soft>{k.matters}</Soft>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-1 text-xs text-muted-foreground">
        Seven karakas by degree, Rahu left out and the mother's and children's
        karakas merged (32.1-17); the Jaimini tab uses eight and may name a
        different Atmakaraka.{" "}
        <SourceLink source={{ label: "Parashara 32.1-17", url: PADA_CH[32] }} />
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-md border bg-card p-3"
          data-testid="padas-constants"
        >
          <div className="text-sm font-medium">
            {plain ? "Fixed significators" : "Constant karakas (32.18-24)"}
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            {p.constants.map((c) => (
              <li key={c.matter}>
                <span>
                  <Soft>{c.matter}</Soft>: <PlanetName planet={c.planet} />
                  {c.house ? (
                    <span className="text-muted-foreground">
                      , read from its {ord(c.house)}
                    </span>
                  ) : null}
                  {c.note ? (
                    <span className="text-muted-foreground"> ({c.note})</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {p.parentsByBirth ? (
            <p
              className="mt-2 text-xs text-muted-foreground"
              data-testid="padas-parents-by-birth"
            >
              Phaladeepika 2.25 reads the parents by day or night instead:
              father <PlanetName planet={p.parentsByBirth.father} />, mother{" "}
              <PlanetName planet={p.parentsByBirth.mother} /> (
              {p.parentsByBirth.daytime ? "a day birth" : "a night birth"}
              {p.parentsByBirth.twilight ? ", close to sunrise or sunset" : ""}
              ).{" "}
              <SourceLink
                source={{ label: "Phaladeepika 2.25", url: PHALADEEPIKA_CH2_URL }}
                mark={false}
              />
            </p>
          ) : null}
        </div>
        <div
          className="rounded-md border bg-card p-3"
          data-testid="padas-yogakarakas"
        >
          <div className="text-sm font-medium">
            {plain ? "Planets that work together" : "Yogakarakas (32.25-30)"}{" "}
            <Badge variant="outline" className="ml-1 text-2xs">
              provisional
            </Badge>
          </div>
          {p.yogaKarakas.length ? (
            <ul className="mt-1 space-y-1 text-sm">
              {p.yogaKarakas.map((y) => (
                <li key={y.planet}>
                  <span>
                    <PlanetName planet={y.planet} />{" "}
                    <span className="text-muted-foreground">
                      ({y.dignity.toLowerCase()}, {ord(y.house)})
                    </span>{" "}
                    with{" "}
                    {y.partners.map((q, i) => (
                      <span key={q}>
                        {i ? ", " : ""}
                        <PlanetName planet={q} abbr />
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              No two dignified planets stand in mutual angles.
            </p>
          )}
        </div>
      </div>
      <ParashariSignifications birthYear={birthYear} withheld={withheld} />
      <SectionTitle
        as="h4"
        className="mt-5"
        plain={chapters[1].plainTitle}
        technical={chapters[1].title}
      />
      <Table className="mt-2" data-testid="padas-table" cards>
        <TableHeader>
          <TableRow>
            <TableHead>Pada</TableHead>
            <TableHead>House</TableHead>
            <TableHead>Lord</TableHead>
            <TableHead>Falls in</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {p.padas.map((a) => (
            <TableRow key={a.label} data-testid={`padas-row-${a.label}`}>
              <TableCell>
                <span className="font-medium">{a.label}</span>
              </TableCell>
              <TableCell>
                <span>
                  {ord(a.house)}, <SignName signIndex={a.houseSign} abbr />
                </span>
              </TableCell>
              <TableCell>
                <span>
                  <PlanetName planet={a.lord} abbr /> in{" "}
                  <SignName signIndex={a.lordSign} abbr />
                </span>
              </TableCell>
              <TableCell>
                <span>
                  <SignName signIndex={a.signIndex} />
                  {a.exception ? (
                    <span
                      className="ml-1.5 text-2xs uppercase tracking-wide text-muted-foreground"
                      title="Fell in the house or its 7th; moved by 29.4-5"
                    >
                      moved
                    </span>
                  ) : null}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-1 text-xs text-muted-foreground">
        Graha padas (29.6-7):{" "}
        {p.grahaPadas.map((g, i) => (
          <span key={i}>
            {i ? "; " : ""}
            {PLANET_ABBR[g.planet]} from {SIGNS[g.ownSign].slice(0, 3)} to{" "}
            {SIGNS[g.signIndex]}
          </span>
        ))}
        . Where a planet owns two signs both are listed; 29.7 asks for the
        stronger.{" "}
        <SourceLink source={{ label: "Parashara 29.1-7", url: PADA_CH[29] }} />
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {byCh(29).map((f) => (
          <Finding key={f.id} f={f} />
        ))}
      </div>
      <SectionTitle
        as="h4"
        className="mt-5"
        plain={chapters[2].plainTitle}
        technical={chapters[2].title}
      />
      <p className="mt-2 text-sm">
        The Upapada is <SignName signIndex={p.padas[11].signIndex} />, the pada
        of the 12th; its 2nd is{" "}
        <SignName signIndex={(p.padas[11].signIndex + 1) % 12} />.{" "}
        <SourceLink
          source={{
            label: "Parashara 30.1",
            url: PADA_CH[30],
            provisional: true,
          }}
        />
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {byCh(30).map((f) => (
          <Finding key={f.id} f={f} />
        ))}
      </div>
      <SectionTitle
        as="h4"
        className="mt-5"
        plain={chapters[3].plainTitle}
        technical={chapters[3].title}
      />
      <Table className="mt-2" data-testid="padas-argala" cards>
        <TableHeader>
          <TableRow>
            <TableHead>On</TableHead>
            <TableHead>Sign</TableHead>
            <TableHead>
              {plain ? "Interventions" : "Argala (obstruction)"}
            </TableHead>
            <TableHead>{plain ? "Prevailing" : "Net argala"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {p.argalas.map((a) => (
            <TableRow
              key={a.target}
              data-testid={`padas-argala-${a.target.replace(/\W+/g, "-").toLowerCase()}`}
            >
              <TableCell>
                <span className="font-medium">{a.target}</span>
              </TableCell>
              <TableCell>
                <SignName signIndex={a.signIndex} />
              </TableCell>
              <TableCell className="text-sm">
                <span>
                  {a.entries.length ? (
                    a.entries.map((e, i) => (
                      <span
                        key={i}
                        className={cn(
                          "mr-2 whitespace-nowrap",
                          !e.prevails && "text-muted-foreground line-through",
                        )}
                        title={
                          e.obstructedBy.length
                            ? `Obstructed from the ${ord(e.obstructingHouse)} by ${e.obstructedBy.join(", ")}`
                            : "Unobstructed"
                        }
                      >
                        {ord(e.house)}:{" "}
                        {e.planets.map((q) => PLANET_ABBR[q]).join(" ")}
                        {e.vipareeta ? " (vipareeta)" : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">none</span>
                  )}
                </span>
              </TableCell>
              <TableCell>
                <span className="flex flex-wrap gap-1">
                  {a.net.length ? (
                    a.net.map((q) => (
                      <PlanetName key={q} planet={q} abbr tone />
                    ))
                  ) : (
                    <span className="text-muted-foreground">none</span>
                  )}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {houseArgalas.length ? (
        <p
          className="mt-2 text-sm text-muted-foreground"
          data-testid="padas-house-argala"
        >
          {plain ? "By house: " : "Argala on each house (31.12-17): "}
          {houseArgalas.map((h, i) => (
            <span key={h.house}>
              {i ? "; " : ""}
              <span
                className={cn(
                  h.tone === "support"
                    ? "text-verdict-good"
                    : h.tone === "strain"
                      ? "text-verdict-bad"
                      : "text-verdict-mixed",
                )}
              >
                {ord(h.house)}
              </span>{" "}
              {h.net.map((q) => PLANET_ABBR[q]).join(" ")} (
              <Soft>{h.matter}</Soft>)
            </span>
          ))}
          .{" "}
          <SourceLink
            source={{ label: "Parashara 31.1-17", url: PADA_CH[31] }}
          />
        </p>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {byCh(31).map((f) => (
          <Finding key={f.id} f={f} />
        ))}
      </div>
      <SectionTitle
        as="h4"
        className="mt-5"
        plain={chapters[4].plainTitle}
        technical={chapters[4].title}
      />
      <p className="mt-2 text-sm" data-testid="padas-karakamsa">
        <PlanetName planet={p.karakamsa.ak} />, the Atmakaraka, falls in the{" "}
        <SignName signIndex={p.karakamsa.signIndex} /> navamsa at{" "}
        {p.karakamsa.akDegNavamsa.toFixed(1)} degrees of it; the lagna's navamsa
        is <SignName signIndex={p.karakamsa.lagnaNavamsa} />. Navamsa signs:{" "}
        {p.navamsa.map((n, i) => (
          <span key={n.planet}>
            {i ? ", " : ""}
            {PLANET_ABBR[n.planet]} {SIGNS[n.signIndex].slice(0, 3)}
          </span>
        ))}
        .{" "}
        <SourceLink
          source={{
            label: "Parashara 33.1",
            url: PADA_CH[33],
            provisional: true,
          }}
        />
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {byCh(33).map((f) => (
          <Finding key={f.id} f={f} />
        ))}
      </div>
      <Expander
        testId="padas-caveats-toggle"
        label={HOW_COMPUTED}
        className="mt-3"
        contentClassName=""
      >
        <div className="mt-2 space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {p.caveats.map((c, i) => (
            <p key={i}><Soft>{c}</Soft></p>
          ))}
        </div>
      </Expander>
    </div>
  );
}

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "first rank",
  2: "second rank",
  3: "named for periods",
};

function MarakasSection({
  m,
  deceased = false,
}: {
  m: MarakaResult;
  deceased?: boolean;
}) {
  const plain = usePlain();
  return (
    <div className="mt-8" data-testid="parashari-marakas">
      <SectionTitle
        plain="Periods that strain health and vitality"
        technical="Maraka planets and periods (ch. 44)"
      />
      <GentleNote testId="marakas-gentle-note" />
      <ModeText
        plain={
          <>
            Parashara ranks the planets whose periods weigh most on health and
            vitality. He ties every one of them to the life span settled in
            chapter 43, which this app does not judge, and adds that many strong
            marakas give illness and misery in their periods rather than the
            gravest result. The list below is therefore read as periods calling
            for care of health, never as a term of life.
          </>
        }
        practitioner={
          <>
            Maraka houses are the 2nd and 7th, the 12th from the two houses of
            longevity, the 2nd stronger (44.2). First rank: lords of the 2nd and
            7th, malefics there or with their lords (44.3-5). Then the 8th lord,
            a benefic tied to the 12th lord and a first-rate malefic (44.6-7),
            the 6th lord with the sub-periods of the 6th, 8th and 12th lords and
            the Moon's 2nd and 12th lords (44.17-19), the star and drekkana
            lords of 44.15-17 and the nodes of 44.20-22. Sub-period rule 44.8.
            Life span from ch. 43 is not computed, so 44.19 governs the reading.
          </>
        }
      />
      <div
        className={cn(
          "mt-3 rounded-md border border-l-4 bg-card p-3",
          TONE_CLASS[m.current.tone],
        )}
        data-testid="marakas-current"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            {deceased
              ? plain
                ? "The period at passing"
                : "Dasa and bhukti at passing"
              : plain
                ? "The period now running"
                : "Current dasa and bhukti"}
          </span>
          <PlanetName planet={m.current.dasa} abbr tone className="text-xs" />
          <PlanetName planet={m.current.bhukti} abbr tone className="text-xs" />
          <Badge
            variant="outline"
            className={cn("text-2xs", VERDICT_CLASS[m.current.tone])}
          >
            {VERDICT_LABEL[m.current.tone]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          <Soft>{m.current.text}</Soft>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <SourceLink
            source={{
              label: `Parashara 44.${m.current.verse}`,
              url: MARAKA_CH,
            }}
            mark={false}
          />
        </p>
      </div>
      {m.saturnFirst && (
        <p
          className="mt-2 text-sm text-muted-foreground"
          data-testid="marakas-saturn"
        >
          {m.saturnFirst}
        </p>
      )}
      <Table className="mt-3" data-testid="marakas-table" cards>
        <TableHeader>
          <TableRow>
            <TableHead>Planet</TableHead>
            <TableHead>Rank</TableHead>
            <TableHead>Why Parashara names it</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {m.entries.map((e) => (
            <TableRow key={e.planet} data-testid={`marakas-row-${e.planet}`}>
              <TableCell>
                <PlanetName planet={e.planet} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-2xs",
                    e.tier === 1
                      ? ROLE_CLASS.maraka
                      : e.tier === 2
                        ? ROLE_CLASS.malefic
                        : ROLE_CLASS.neutral,
                  )}
                >
                  {TIER_LABEL[e.tier]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <span>
                  {e.reasons.map((r, i) => (
                    <span key={i}>
                      {i ? "; " : ""}
                      <Soft>{r.text}</Soft>{" "}
                      <span className="text-xs">
                        (44.{r.verse}
                        {r.provisional ? ", provisional" : ""})
                      </span>
                    </span>
                  ))}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-md border bg-card p-3"
          data-testid="marakas-stars"
        >
          <div className="text-sm font-medium">
            {plain
              ? "Stars counted from the birth star"
              : "Vipat, Pratyak and Vadha stars (44.15-17)"}
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            {m.starDasas.map((s) => (
              <li key={s.name}>
                <span>
                  {s.name}: {s.star}, lord <PlanetName planet={s.lord} abbr />{" "}
                  {!plain && (
                    <span className="text-muted-foreground">
                      (paired with a {s.span} life)
                    </span>
                  )}
                </span>
              </li>
            ))}
            <li>
              <span>
                23rd star: {m.star23.star}, lord{" "}
                <PlanetName planet={m.star23.lord} abbr />
              </span>
            </li>
            <li>
              <span>
                22nd drekkana:{" "}
                <SignName signIndex={m.drekkana22.signIndex} abbr />{" "}
                {ord(m.drekkana22.index + 1)}, lord{" "}
                <PlanetName planet={m.drekkana22.lord} abbr />{" "}
                <Badge variant="outline" className="text-2xs">
                  provisional
                </Badge>
              </span>
            </li>
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">
            The three life spans of 44.10-14 (up to 32, 64 and 100 years) decide
            which star applies; none is chosen here.
          </p>
        </div>
        <div
          className="rounded-md border bg-card p-3"
          data-testid="marakas-moon"
        >
          <div className="text-sm font-medium">
            {plain
              ? "Counted from the Moon, and the nodes"
              : "Lords of the 2nd and 12th from the Moon (44.17-18); nodes (44.20-22)"}
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            {m.moonLords.map((x) => (
              <li key={x.house}>
                <span>
                  {ord(x.house)} from the Moon:{" "}
                  <PlanetName planet={x.lord} abbr />{" "}
                  <span className="text-muted-foreground">
                    {x.malefic
                      ? "(malefic: a maraka)"
                      : "(benefic: illness only, not a maraka)"}
                  </span>
                </span>
              </li>
            ))}
            {m.nodes.length ? (
              m.nodes.map((n) => (
                <li key={n.planet}>
                  <span>
                    <PlanetName planet={n.planet} abbr /> {n.reason}: takes
                    maraka power
                  </span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">
                Neither node stands where 44.20-22 gives it maraka power.
              </li>
            )}
          </ul>
        </div>
      </div>
      {m.asWritten.length ? (
        <>
          <Expander
            testId="marakas-written-toggle"
            label={
              plain
                ? "Show the 3rd and 8th house verses on health (44.25-37)"
                : "Show the 3rd and 8th house verses on the manner of the end (44.25-37), shown as written"
            }
            openLabel={
              plain
                ? "Hide the 3rd and 8th house verses on health (44.25-37)"
                : "Hide the 3rd and 8th house verses on the manner of the end (44.25-37)"
            }
            className="mt-3"
            contentClassName=""
          >
            <div
              className="mt-2 grid gap-2 sm:grid-cols-2"
              data-testid="marakas-written"
            >
              {m.asWritten.map((f) => (
                <Finding key={f.id} f={f} />
              ))}
            </div>
          </Expander>
        </>
      ) : null}
      <Expander
        testId="marakas-caveats-toggle"
        label={HOW_COMPUTED}
        className="mt-3"
        contentClassName=""
      >
        <div className="mt-2 space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {m.caveats.map((c, i) => (
            <p key={i}><Soft>{c}</Soft></p>
          ))}
        </div>
      </Expander>
    </div>
  );
}

const LAJ_CLASS: Record<string, string> = {
  Garvita: "bg-verdict-good/15 text-verdict-good",
  Mudita: "bg-verdict-good/10 text-verdict-good",
  Lajjita: "bg-verdict-bad/10 text-verdict-bad",
  Kshudhita: "bg-verdict-bad/10 text-verdict-bad",
  Trushita: "bg-verdict-mixed/15 text-verdict-mixed",
  Kshobhita: "bg-verdict-bad/15 text-verdict-bad",
};
const DEEPTA_PLAIN: Record<string, string> = {
  Deepta: "bright",
  Swastha: "at ease",
  Pramudita: "glad",
  Santa: "calm",
  Deena: "poor",
  Vikala: "impaired",
  Khala: "ill-placed",
  Kopa: "angry",
};
const LAJ_PLAIN: Record<string, string> = {
  Garvita: "proud",
  Mudita: "delighted",
  Lajjita: "ashamed",
  Kshudhita: "hungry",
  Trushita: "thirsty",
  Kshobhita: "agitated",
};

function AvasthasSection({ a }: { a: AvasthaResult }) {
  const plain = usePlain();
  const [openLaj, setOpenLaj] = useState<Planet | null>(null);
  return (
    <div className="mt-8" data-testid="parashari-avasthas">
      <SectionTitle
        plain="The state each planet is in"
        technical="Avasthas of the planets (ch. 45)"
      />
      <ModeText
        plain={
          <>
            Parashara reads each planet's condition five ways: its age within
            the sign, whether it is awake, dreaming or asleep by the sign it
            holds, how content it is by dignity and company, six moods from
            house, company and aspect, and a twelve-fold state found by a small
            arithmetic on its star, its navamsa and the moment of birth. The
            moods and the twelve-fold state carry the chapter's stated effects.
            The twelve-fold state is not a verdict drawn from the other columns:
            it comes from its own arithmetic, and the text says how much of its
            effect to expect from the planet's age, the sign it holds and its
            strength, which is shown under each reading. A planet can be in
            several moods at once, some good and some harsh; Parashara has its
            strength decide which side shows, so each planet's moods are read
            together below.
          </>
        }
        practitioner={
          <>
            Baladi 45.3-4, Jagradadi 45.5-6, Deeptadi 45.7-10, Lajjitadi
            45.11-29 and Sayanadi 45.30-155. Relations by 3.55-58; aspects
            follow the aspect setting; ghatis from the computed sunrise.
            Lajjitadi follows the Sanskrit for 45.15-17 and 45.20-21 and is read
            per planet, with strength deciding between good and harsh states
            (45.19-20). The Sayanadi state
            is arithmetic on the star, navamsa and moment, not a summary of the
            other four columns; 45.38-39 grade its stated effects by the
            sub-state and by the planet's strength, so each reading carries the
            measures of 45.4 and 45.6 beside it. The sub-state itself needs the
            numeral of the name's first syllable and is left aside.
          </>
        }
      />
      <Table className="mt-3" data-testid="avasthas-table" cards>
        <TableHeader>
          <TableRow>
            <TableHead>Planet</TableHead>
            <TableHead>{plain ? "Age in sign" : "Baladi"}</TableHead>
            <TableHead>{plain ? "Awake or asleep" : "Jagradadi"}</TableHead>
            <TableHead>{plain ? "Condition" : "Deeptadi"}</TableHead>
            <TableHead>{plain ? "Moods" : "Lajjitadi"}</TableHead>
            <TableHead>{plain ? "Twelve-fold state" : "Sayanadi"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {a.planets.map((x) => (
            <TableRow key={x.planet} data-testid={`avasthas-row-${x.planet}`}>
              <TableCell>
                <PlanetName planet={x.planet} />
              </TableCell>
              <TableCell>
                <span>
                  {plain ? x.baladi.plain : x.baladi.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({x.baladi.result})
                  </span>
                </span>
              </TableCell>
              <TableCell>
                <span>
                  {plain ? x.jagradadi.plain : x.jagradadi.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({x.jagradadi.basis}, {x.jagradadi.result})
                  </span>
                </span>
              </TableCell>
              <TableCell>
                <span>
                  {x.deeptadi.names
                    .map((n) => (plain ? (DEEPTA_PLAIN[n] ?? n) : n))
                    .join(", ")}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({x.deeptadi.basis})
                  </span>
                </span>
              </TableCell>
              <TableCell>
                <span className="block">
                  {x.lajjitadi.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenLaj(openLaj === x.planet ? null : x.planet)
                      }
                      className="flex flex-wrap gap-1 text-left"
                      data-testid={`avasthas-laj-${x.planet}`}
                    >
                      {x.lajjitadi.map((l) => (
                        <Badge
                          key={l.name}
                          variant="outline"
                          className={cn("text-2xs", LAJ_CLASS[l.name])}
                        >
                          {plain ? LAJ_PLAIN[l.name] : l.name}
                        </Badge>
                      ))}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">none</span>
                  )}
                  {openLaj === x.planet && (
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {x.lajjitadi.map((l) => (
                        <li key={l.name}>
                          {l.name}: {l.why}
                        </li>
                      ))}
                    </ul>
                  )}
                </span>
              </TableCell>
              <TableCell>
                {x.sayanadi ? (
                  <span>
                    <span
                      className={cn(
                        "rounded px-1",
                        VERDICT_CLASS[x.sayanadi.tone],
                      )}
                    >
                      {plain ? x.sayanadi.plain : x.sayanadi.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      <Soft>{x.sayanadi.effect}</Soft>{" "}
                      <SourceLink
                        source={{
                          label: `45.${x.sayanadi.verse}`,
                          url: AVASTHA_CH,
                          provisional: true,
                        }}
                        mark={false}
                      />
                    </span>
                    <span
                      className="mt-0.5 block text-2xs text-muted-foreground"
                      data-testid={`avasthas-measure-${x.planet}`}
                    >
                      {x.sayanadi.measure}
                    </span>
                    {!plain && (
                      <span className="block text-2xs text-muted-foreground tabular-nums">
                        {x.sayanadi.working}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    needs sunrise
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-1 text-xs text-muted-foreground">
        {a.ghatis !== undefined
          ? `Birth ${a.ghatis} whole ghatis after sunrise. `
          : ""}
        The Sayanadi arithmetic is star × planet number × navamsa + birth star +
        ghatis + lagna count, remainder by twelve (45.30-35), provisional in its
        details.{" "}
        <SourceLink source={{ label: "Parashara 45.3-39", url: AVASTHA_CH }} />
      </p>
      {a.lines.length > 0 && (
        <div className="mt-4" data-testid="avasthas-lines">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {plain ? "The moods, planet by planet" : "Lajjitadi by planet (45.11-20)"}
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {plain
              ? "Each planet's moods read together. Where good and harsh moods meet, Parashara calls the result mixed and lets the planet's strength decide (45.19-20)."
              : "The states qualify the planet; 45.19 has the result judged by strength, and 45.20 reads delight joined with a harsh state as mixed, loss when weak and great results when strong. Strength is Shadbala at its requirement, a combust or war-defeated planet counting without it (6.53, 79.4-5). Not counted in any verdict."}
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {a.lines.map((l) => (
              <li
                key={l.planet}
                className={cn(
                  "rounded-md border border-l-4 bg-card px-3 py-2",
                  TONE_CLASS[l.tone],
                )}
                data-testid={`avasthas-line-${l.planet}`}
              >
                <span className="flex flex-wrap items-center gap-1">
                  <PlanetName planet={l.planet} />
                  {l.names.map((n) => (
                    <Badge
                      key={n}
                      variant="outline"
                      className={cn("text-2xs", LAJ_CLASS[n])}
                    >
                      {plain ? LAJ_PLAIN[n] : n}
                    </Badge>
                  ))}
                  {l.source.provisional && (
                    <Badge variant="outline" className="text-2xs">
                      provisional
                    </Badge>
                  )}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  <Soft>{plain ? l.plain : l.text}</Soft>{" "}
                  <SourceLink source={l.source} mark={false} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {a.effects.length > 0 && (
        <div className="mt-4" data-testid="avasthas-effects">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {plain ? "What each mood brings" : "Effects of the states (45.24-29)"}
          </h4>
          <ul className="mt-1 space-y-1.5">
            {a.effects.map((e) => (
              <li
                key={e.name}
                className="text-sm"
                data-testid={`avasthas-effect-${e.name}`}
              >
                <Badge
                  variant="outline"
                  className={cn("mr-1.5 text-2xs", LAJ_CLASS[e.name])}
                >
                  {plain ? LAJ_PLAIN[e.name] : e.name}
                </Badge>
                <span className="text-muted-foreground">
                  <Soft>{plain ? e.plain : e.text}</Soft>
                </span>{" "}
                <span className="text-xs text-muted-foreground">
                  ({e.planets.join(", ")})
                </span>{" "}
                <SourceLink source={e.source} mark={false} />
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">
            {plain
              ? "The text gives these effects for the planet's state, not for a period; how much shows depends on the planet's strength, as read above."
              : "The text gives these effects without a dasa; strength grades them (45.19-20)."}
          </p>
        </div>
      )}
      {a.findings.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {a.findings.map((f) => (
            <Finding key={f.id} f={f} />
          ))}
        </div>
      ) : null}
      <Expander
        testId="avasthas-caveats-toggle"
        label={HOW_COMPUTED}
        className="mt-3"
        contentClassName=""
      >
        <div className="mt-2 space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {a.caveats.map((c, i) => (
            <p key={i}><Soft>{c}</Soft></p>
          ))}
        </div>
      </Expander>
    </div>
  );
}

function RasiDasasSection({ d }: { d: RasiDasasResult }) {
  const plain = usePlain();
  const [pick, setPick] = useState<string>("chara");
  const [openPeriod, setOpenPeriod] = useState<number | null>(null);
  const sel: RasiDasa = d.systems.find((s) => s.id === pick) ?? d.systems[0];
  const curIdx = sel.periods.findIndex((p) => p.current);
  const open = openPeriod ?? (curIdx >= 0 ? curIdx : null);
  const shown = sel.periods;
  const yrs = (y: number) =>
    Number.isInteger(y)
      ? String(y)
      : y.toFixed(y * 2 === Math.round(y * 2) ? 1 : 2);
  const pickSystem = (id: string) => {
    setPick(id);
    setOpenPeriod(null);
  };
  return (
    <div className="mt-8" data-testid="parashari-rasi-dasas">
      <SectionTitle
        plain="Periods measured by signs"
        technical="Dasas of signs (ch. 46.155-190)"
      />
      <ModeText
        plain={
          <>
            Besides the planet periods above, Parashara gives ten ways of
            letting the signs take turns as periods, each with its own starting
            sign, order and lengths. The running sign in each is read with the
            text's rules for sign periods. These are shown for study and
            cross-checking against the planet periods, not as a second verdict.
          </>
        }
        practitioner={
          <>
            Chara (46.155-167), Sthira (168-173), Yogardha (174), Kendradi from
            the lagna and from the Atmakaraka (175-176), Karaka (178), Manduka
            (179-180), Shula (181-182), Trikona (183-184), Drig (185-187) and
            the nakshatra-based rasi dasa (188-190), with the sub-periods of
            51.5-12 and the effects of ch. 50 on the running sign. The Jaimini
            tab keeps K.N. Rao's Chara dasa; this section follows Parashara's
            text alone.
          </>
        }
      />
      <div
        role="tablist"
        aria-label="Rasi dasa"
        className="mt-3 inline-flex flex-wrap rounded-md border p-0.5 text-sm"
      >
        {d.systems.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={sel.id === s.id}
            onClick={() => pickSystem(s.id)}
            className={cn(
              "rounded px-3 py-1",
              sel.id === s.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`rasi-dasa-tab-${s.id}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="mt-3" data-testid={`rasi-dasa-detail-${sel.id}`}>
        <p className="text-sm">
          {sel.summary}{" "}
          <SourceLink
            source={{
              label: `Parashara 46.${sel.verses}`,
              url: sel.url,
              provisional: sel.provisional,
            }}
          />
        </p>
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          <li>
            Starts from <SignName signIndex={sel.start.sign} abbr />:{" "}
            {sel.start.why}
            {sel.start.provisional ? (
              <Badge variant="outline" className="ml-1 text-2xs">
                provisional
              </Badge>
            ) : null}
          </li>
          <li>Order: {sel.directionWhy}.</li>
          <li>
            Years: {sel.yearsRule}.
            {sel.balanceNote ? ` Balance at birth: ${sel.balanceNote}.` : ""}
          </li>
          {sel.asWritten ? <li>Shown as written: {sel.asWritten}</li> : null}
        </ul>
        <Table className="mt-3" cards data-testid="rasi-dasa-table">
          <TableHeader>
            <TableRow>
              <TableHead>{plain ? "Period" : "Dasa"}</TableHead>
              <TableHead className="text-right">Years</TableHead>
              <TableHead className="text-right">Age</TableHead>
              <TableHead className="hidden sm:table-cell">Dates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((p, i) => (
              <TableRow
                key={i}
                className={cn(
                  p.current && "bg-primary/10",
                  p.repeated && "text-muted-foreground",
                  "cursor-pointer",
                )}
                onClick={() => setOpenPeriod(open === i ? -1 : i)}
                data-testid={`rasi-dasa-period-${sel.id}-${i}`}
              >
                <TableCell>
                  <span>
                    <SignName signIndex={p.sign} />
                    {p.karaka ? (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {p.planet} as {plain ? KARAKA_NAME(p.karaka) : p.karaka}
                      </span>
                    ) : null}
                    {p.current ? (
                      <Badge variant="secondary" className="ml-2">
                        <NowWord />
                      </Badge>
                    ) : null}
                    {p.repeated ? (
                      <span className="ml-1.5 text-2xs uppercase tracking-wide text-muted-foreground">
                        repeated
                      </span>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {yrs(p.years)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {Math.max(0, p.ageStart).toFixed(1)} to {p.ageEnd.toFixed(1)}
                </TableCell>
                <TableCell className="hidden sm:table-cell tabular-nums">
                  {fmt(p.start)} to {fmt(p.end)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {open !== null && open >= 0 && shown[open] ? (
          <RasiPeriodDetail p={shown[open]} sel={sel} />
        ) : null}
      </div>
      <Expander
        testId="rasi-dasa-years-toggle"
        label="Show the Chara years of each sign and the Brahma planet"
        openLabel="Hide the Chara years of each sign and the Brahma planet"
        className="mt-3"
        contentClassName=""
      >
        <div className="mt-2" data-testid="rasi-dasa-years">
          <p className="text-xs text-muted-foreground">
            Brahma planet:{" "}
            {d.brahma.planet ? (
              <PlanetName planet={d.brahma.planet} abbr />
            ) : (
              "none"
            )}
            . {d.brahma.reason}{" "}
            <SourceLink
              source={{
                label: "Parashara 46.170-173",
                url: RASI_DASA_CH.ch46,
                provisional: d.brahma.provisional,
              }}
            />
          </p>
          <Table className="mt-2" cards>
            <TableHeader>
              <TableRow>
                <TableHead>Sign</TableHead>
                <TableHead>Lord</TableHead>
                <TableHead className="text-right">Years</TableHead>
                <TableHead>Working</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.charaYears.map((y) => (
                <TableRow
                  key={y.sign}
                  data-testid={`rasi-dasa-years-${SIGNS[y.sign]}`}
                >
                  <TableCell>
                    <SignName signIndex={y.sign} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span>
                      <PlanetName planet={y.lord} abbr /> in{" "}
                      <SignName signIndex={y.lordSign} abbr />
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {y.years}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span>
                      {y.note}
                      {y.provisional ? (
                        <Badge variant="outline" className="ml-1 text-2xs">
                          provisional
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Expander>
      <Expander
        testId="rasi-dasa-caveats-toggle"
        label={HOW_COMPUTED}
        className="mt-2"
        contentClassName=""
      >
        <div className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <p><Soft>{d.caveats.join(" ")}</Soft></p>
          <p className="mt-1"><Soft>{d.notComputed.join(" ")}</Soft></p>
        </div>
      </Expander>
    </div>
  );
}

function RasiPeriodDetail({ p, sel }: { p: RasiPeriod; sel: RasiDasa }) {
  const plain = usePlain();
  const readings = p.current ? sel.readings : [];
  return (
    <div
      className="mt-3 rounded-md border px-3 py-2"
      data-testid="rasi-dasa-period-detail"
    >
      <h4 className="text-sm font-semibold">
        {SIGNS[p.sign]} {plain ? "period" : "dasa"}, {fmt(p.start)} to{" "}
        {fmt(p.end)}
      </h4>
      {readings.length > 0 && (
        <ul className="mt-2 space-y-2">
          {readings.map((rd, i) => (
            <li
              key={i}
              className="text-sm"
              data-testid={`rasi-dasa-reading-${i}`}
            >
              <span
                className={cn(
                  "mr-1.5 inline-block h-2 w-2 rounded-full align-middle",
                  rd.tone === "support"
                    ? "bg-emerald-500"
                    : rd.tone === "strain"
                      ? "bg-rose-500"
                      : "bg-amber-500",
                )}
                aria-label={rd.tone}
              />
              <span className="font-medium">{rd.label}.</span>{" "}
              <Soft>{rd.text}</Soft> <SourceLink source={rd.source} />
            </li>
          ))}
        </ul>
      )}
      {!p.current && (
        <p className="mt-1 text-xs text-muted-foreground">
          Chapter 50 readings are shown for the running period only.
        </p>
      )}
      {p.antardasas ? (
        <>
          <p className="mt-3 text-xs text-muted-foreground">
            {plain ? "Smaller divisions" : "Sub-periods"}: {p.antarRule}; the
            first is <SignName signIndex={p.antarStart!.sign} abbr />,{" "}
            {p.antarStart!.sign === p.sign
              ? "the dasa sign itself"
              : "the 7th from the dasa sign"}{" "}
            ({p.antarStart!.why}) (51.6).{" "}
            <SourceLink
              source={{
                label: "Parashara 51.5-12",
                url: RASI_DASA_CH.ch51,
                provisional: true,
              }}
            />
          </p>
          <div
            className="mt-1 flex flex-wrap gap-1"
            data-testid="rasi-dasa-antars"
          >
            {p.antardasas.map((a, i) => (
              <span
                key={i}
                className={cn(
                  "rounded border px-1.5 py-0.5 text-xs tabular-nums",
                  a.current && "border-primary bg-primary/10",
                  a.note?.tone === "support" &&
                    "border-l-2 border-l-emerald-500",
                  a.note?.tone === "strain" && "border-l-2 border-l-rose-500",
                )}
                title={`${fmtD(a.start)} to ${fmtD(a.end)}${a.note ? `. ${a.note.text}` : ""}`}
              >
                <SignName signIndex={a.sign} abbr />{" "}
                <span className="text-muted-foreground">{fmt(a.start)}</span>
              </span>
            ))}
          </div>
          {p.current &&
            p.antardasas.find((a) => a.current)?.note &&
            (() => {
              const n = p.antardasas.find((a) => a.current)!.note!;
              return (
                <p
                  className="mt-1 text-xs text-muted-foreground"
                  data-testid="rasi-dasa-antar-note"
                >
                  <span
                    className={cn(
                      "mr-1.5 inline-block h-2 w-2 rounded-full align-middle",
                      n.tone === "support"
                        ? "bg-emerald-500"
                        : n.tone === "strain"
                          ? "bg-rose-500"
                          : "bg-amber-500",
                    )}
                    aria-label={n.tone}
                  />{" "}
                  Running now: <Soft>{n.text}</Soft>{" "}
                  <SourceLink source={n.source} />
                </p>
              );
            })()}
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          The text gives no sub-periods for the Karaka dasa in these verses.
        </p>
      )}
    </div>
  );
}

function ConditionalDasasSection({ cd }: { cd: ConditionalDasasResult }) {
  const plain = usePlain();
  const applying = cd.systems.filter((s) => s.applies);
  const rest = cd.systems.filter((s) => !s.applies);
  const [pick, setPick] = useState<string>(applying[0]?.id ?? "");
  const sel: ConditionalDasa | undefined =
    cd.systems.find((s) => s.id === pick) ?? applying[0];
  const ageTxt = (p: { ageStart: number; ageEnd: number }) =>
    `${Math.max(0, p.ageStart).toFixed(1)} to ${p.ageEnd.toFixed(1)}`;
  return (
    <div className="mt-8" data-testid="parashari-conditional-dasas">
      <SectionTitle
        plain="Other period systems the text indicates"
        technical="Conditional dasas (ch. 46)"
      />
      <ModeText
        plain={
          <>
            Parashara keeps the 120-year system above for most charts, and names
            nine other systems for special cases, each with a rule that says
            when it applies. The rules that hold for this chart are listed here
            with their periods, so events can be checked against more than one
            clock. The text does not rank them.
          </>
        }
        practitioner={
          <>
            Vimshottari is for the general populace (46.2-5); the other
            nakshatra dasas of 46.17-43 are adopted when their condition holds.{" "}
            {applying.length}{" "}
            {applying.length === 1 ? "condition holds" : "conditions hold"} in
            this chart. Yogini (46.195-199) is given without a condition. Lords,
            years and starting nakshatras are as stated in the chapter; see the
            notes for how the balance at birth is taken.
          </>
        }
      />
      <div
        role="tablist"
        aria-label="Conditional dasa"
        className="mt-3 inline-flex flex-wrap rounded-md border p-0.5 text-sm"
      >
        {applying.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={sel?.id === s.id}
            onClick={() => setPick(s.id)}
            className={cn(
              "rounded px-3 py-1",
              sel?.id === s.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`conditional-dasa-${s.id}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      {sel && (
        <div className="mt-3" data-testid={`conditional-dasa-detail-${sel.id}`}>
          <p className="text-sm">
            {plain ? "Applies because" : "Condition"}: {sel.condition}.{" "}
            {sel.reason}{" "}
            <SourceLink
              source={{
                label: `Parashara 46.${sel.verses}`,
                url: sel.url,
                provisional: sel.provisional,
              }}
            />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            First period {sel.firstLord}, balance {sel.balanceYears.toFixed(2)}{" "}
            years of {sel.totalYears} in the cycle. {sel.balanceNote}
          </p>
          <Table className="mt-3" cards>
            <TableHeader>
              <TableRow>
                <TableHead>{plain ? "Period" : "Dasa"}</TableHead>
                <TableHead className="text-right">Years</TableHead>
                <TableHead className="text-right">Age</TableHead>
                <TableHead className="hidden sm:table-cell">Dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sel.periods.map((p, i) => (
                <TableRow
                  key={i}
                  className={cn(
                    p.current && "bg-primary/10",
                    p.repeated && "text-muted-foreground",
                  )}
                  data-testid={`conditional-period-${sel.id}-${i}`}
                >
                  <TableCell>
                    <PlanetName planet={p.lord} />
                    {p.yogini ? (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {p.yogini}
                      </span>
                    ) : null}
                    {p.current ? (
                      <Badge variant="secondary" className="ml-2">
                        <NowWord />
                      </Badge>
                    ) : null}
                    {p.repeated ? (
                      <span className="ml-1.5 text-2xs uppercase tracking-wide text-muted-foreground">
                        repeated
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.years.toFixed(p.years % 1 ? 2 : 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {ageTxt(p)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell tabular-nums">
                    {fmt(p.start)} to {fmt(p.end)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {rest.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          <Expander
            testId="conditional-dasa-rest-toggle"
            label={`Show the ${rest.length} systems whose condition does not hold`}
            openLabel={`Hide the ${rest.length} systems whose condition does not hold`}
            contentClassName=""
          >
            <ul className="mt-2 space-y-1">
              {rest.map((s) => (
                <li key={s.id} data-testid={`conditional-dasa-rest-${s.id}`}>
                  {s.name}: {s.condition} (46.{s.verses}). {s.reason}
                </li>
              ))}
            </ul>
          </Expander>
        </div>
      )}
      <Expander
        testId="conditional-dasa-caveats-toggle"
        label={HOW_COMPUTED}
        className="mt-3"
        contentClassName=""
      >
        <p className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Soft>{cd.caveats.join(" ")}</Soft>
        </p>
      </Expander>
    </div>
  );
}

const PLAIN_ROLE: Record<string, string> = {
  yogakaraka: "the chief helper",
  yogaPair: "half of a raja-yoga pair",
  auspicious: "a helper",
  malefic: "a hinderer",
  maraka: "a planet whose periods can bring illness or loss",
  neutral: "neutral",
};

/** Plain-reading summary: five short statements a reader can take away before any table. */
function ParashariVerdict({
  r,
  cur,
  yogas,
  spouse,
  timing,
}: {
  r: ReturnType<typeof computeParashari>;
  cur: DashaGloss | undefined;
  yogas: ParashariFinding[];
  spouse: SpouseReading;
  timing: TimingNow;
}) {
  const nowLabel = useNowLabel();
  const tr = useContext(TimeRestCtx);
  const d9Rest = restOn("D9", "the navamsa lagna", tr.windows, tr.band);
  const helpers = r.natures
    .filter(
      (n) =>
        n.functional === "yogakaraka" ||
        n.functional === "yogaPair" ||
        n.functional === "auspicious",
    )
    .map((n) => n.planet);
  const hinderers = r.natures
    .filter((n) => n.functional === "malefic" || n.functional === "maraka")
    .map((n) => n.planet);
  const sb = r.shadbala?.planets.slice().sort((a, b) => b.ratio - a.ratio);
  const strong = sb?.filter((p) => p.strong).map((p) => p.planet) ?? [];
  const weak = sb?.filter((p) => !p.strong).map((p) => p.planet) ?? [];
  const curReading = r.dasaReadings.find((d) => d.current);
  const deceased = useDeceased();
  const plainV = usePlain();
  const nextChange = timing.next.find(
    (c) => c.kind === "period" || c.kind === "sub-period",
  );
  const good = yogas.filter((f) => f.tone === "support").length;
  const bad = yogas.filter((f) => f.tone === "strain").length;
  const mixed = yogas.filter((f) => f.tone === "mixed").length;
  const list = (xs: Planet[]) =>
    xs.length === 0
      ? "none"
      : xs.length === 1
        ? xs[0]
        : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
  const lagnaLordHouse = ord(
    r.natures.find((n) => n.planet === r.bhavas[0].lord)?.house ?? 1,
  );

  // The three strongest combinations: yogas first (they name whole life themes), supportive and testing before mixed, and prefer those carried by a strong planet.
  const signatures: VerdictSignature[] = [...yogas]
    .map((f) => ({
      f,
      w:
        (f.kind === "yoga" ? 3 : f.kind === "strain" ? 2 : 1) +
        (f.tone !== "mixed" ? 1 : 0) +
        (f.planets.some((p) => (strong as Planet[]).includes(p)) ? 1 : 0),
    }))
    .sort((a, b) => b.w - a.w)
    .slice(0, 3)
    .map(({ f }) => ({
      planets: f.planets.slice(0, 2),
      label: f.title,
      text: firstClause(gist(f.text)),
      tone:
        f.tone === "support" ? "good" : f.tone === "strain" ? "bad" : "mixed",
    }));

  const headline = (
    <>
      {SIGNS[r.lagna.signIndex]} rising, with its lord {r.bhavas[0].lord} in the{" "}
      {lagnaLordHouse} house
      {sb && sb.length ? <>; {sb[0].planet} is the strongest planet</> : null}
      {yogas.length ? (
        <>
          , and the text finds{" "}
          {[
            good ? `${good} favourable` : "",
            mixed ? `${mixed} mixed` : "",
            bad ? `${bad} testing` : "",
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/, ([^,]*)$/, " and $1")}{" "}
          {yogas.length === 1 ? "combination" : "combinations"}
        </>
      ) : null}
      .
    </>
  );

  return (
    <VerdictCard
      system="Parashari"
      headline={headline}
      lead={
        <>
          For {SIGNS[r.lagna.signIndex]} rising Parashara counts {list(helpers)}{" "}
          as {helpers.length === 1 ? "a helper" : "helpers"} and{" "}
          {list(hinderers)} as{" "}
          {hinderers.length === 1 ? "a hinderer" : "hinderers"}; the rest are
          neutral.
        </>
      }
      signatures={signatures}
      timing={
        cur
          ? [
              {
                label: nowLabel,
                when: "present",
                text: (
                  <>
                    {cur.lord} {levelName("dasa", plainV)}, {fmt(cur.start)}{" "}
                    to {fmt(cur.end)}
                    {timing.antar
                      ? deceased
                        ? `, then in its ${timing.antar.lord} ${levelName("antar", plainV)} to ${fmt(timing.antar.end)}`
                        : `, with its ${timing.antar.lord} ${levelName("antar", plainV)} running to ${fmt(timing.antar.end)}`
                      : ""}
                    ; for this rising sign {cur.lord} is{" "}
                    {PLAIN_ROLE[cur.functional] ?? cur.functional}
                    {curReading ? (
                      <>
                        , and the text's lines for the period come out{" "}
                        {VERDICT_LABEL[curReading.verdict]} on balance
                      </>
                    ) : null}
                  </>
                ),
              },
              ...(nextChange && nextChange.lord
                ? [
                    {
                      label: "Next",
                      when: "future" as const,
                      text: (
                        <>
                          {nextChange.lord}{" "}
                          {levelName(
                            nextChange.kind === "period" ? "dasa" : "antar",
                            plainV,
                          )}{" "}
                          from {fmtD(nextChange.date)}
                          {nextChange.kind === "period" && nextChange.gloss
                            ? `, ${nextChange.years} years; for this rising sign ${nextChange.lord} is ${
                                r.withheld &&
                                nextChange.gloss.functional === "maraka"
                                  ? "lord of the 2nd or 7th"
                                  : (PLAIN_ROLE[nextChange.gloss.functional] ??
                                    nextChange.gloss.functional)
                              }`
                            : ""}
                          {nextChange.tone
                            ? `, and the text's lines for it come out ${nextChange.tone} on balance`
                            : ""}
                        </>
                      ),
                    },
                  ]
                : []),
            ]
          : []
      }
      lines={[
        ...(sb
          ? [
              {
                label: "Strength",
                text: (
                  <>
                    {strong.length === 0
                      ? "No planet reaches the minimum strength Parashara asks for"
                      : `${list(strong)} ${strong.length === 1 ? "reaches" : "reach"} the minimum strength Parashara asks for`}
                    {weak.length > 0
                      ? `; ${list(weak)} ${weak.length === 1 ? "falls" : "fall"} short, so ${weak.length === 1 ? "its" : "their"} promises come in part`
                      : ""}
                    .
                  </>
                ),
              },
            ]
          : []),
        {
          label: "Combinations",
          text: (
            <>
              {yogas.length} notable{" "}
              {yogas.length === 1 ? "combination" : "combinations"} found; each
              is written out below with the reason and verse.
            </>
          ),
        },
        {
          label: "Marriage (D9)",
          text: (
            <>
              The partner's house in the ninth-cut chart is{" "}
              {SIGNS[spouse.seventhSign]}
              {spouse.occupants.length
                ? `, holding ${list(spouse.occupants)}`
                : ", empty"}
              ; its ruler {spouse.seventhLord} stands in{" "}
              {SIGNS[spouse.lordSign]}. Parashara gives no verdict on this
              placement, so it is reported, not judged.
              {d9Rest?.sensitive ? (
                <span data-testid="parashari-verdict-d9-time">
                  {" "}
                  {timeRestText(d9Rest, tr.band)}
                </span>
              ) : null}
            </>
          ),
        },
        ...(cur
          ? [
              {
                label: "Periods",
                text: "The running period's sub-periods are listed at the end of the page.",
              },
            ]
          : []),
      ]}
      caveat="Paraphrased from Brihat Parashara Hora Sastra (Santhanam translation), softened and with verse numbers kept for checking; strength, divisional and Ashtakavarga layers are applied mechanically. A first pass, not a verdict."
      testid="parashari-verdict"
      className="mt-6"
    />
  );
}

const fmtV = (v: number) =>
  Math.abs(v) < 0.05 ? "0" : v.toFixed(1).replace(/\.0$/, "");

function ShadbalaSection({
  sb,
  open,
  setOpen,
  phala,
  varga,
  back,
  onBack,
}: {
  sb: ShadbalaResult;
  open: string | null;
  setOpen: (k: string | null) => void;
  phala?: BhavaPhala[];
  varga?: VargaPhala[];
  /** Set when a card's "Full strength table" link led here. */
  back?: { title: string } | null;
  onBack?: () => void;
}) {
  const [phalaOpen, setPhalaOpen] = useState<number | null>(null);
  const allCaveats = phala
    ? [...sb.caveats, ...BHAVA_PHALA_CAVEATS]
    : sb.caveats;
  return (
    <div className="mt-8" data-testid="parashari-shadbala">
      <SectionTitle
        plain="How strong each planet is"
        technical="Strength of the planets (Shadbala)"
        term="shadbala"
      />
      <ModeText
        plain={
          <>
            Six kinds of strength (position, direction, time of birth, motion,
            nature and aspects) are added into one score and set against the
            minimum Parashara asks of each planet. A planet at or above its
            minimum keeps its promises fully; one below keeps them only in part.
            The last column is the planet's leaning towards good or ill. Open a
            row for the parts.
          </>
        }
        practitioner={
          <>
            The six strengths of{" "}
            <SourceLink
              source={{ label: "Parashara ch. 27", url: BPHS_URL(27) }}
            />{" "}
            in virupas (60 to a rupa): positional (Sthana), directional (Dig),
            temporal (Kala), motional (Chesta), natural (Naisargika) and
            aspectual (Drik), with aspect values from 26.6-12 and planetary
            relationships from 3.55-58. The total is set against the requirement
            of 27.32-33; nodes have none. The last column gives the Ishta and
            Kashta phala of{" "}
            <SourceLink source={{ label: "ch. 28", url: BPHS_URL(28) }} />, the
            benefic and malefic tendency out of 60. Open a row for the working.{" "}
            Lords of the {sb.daytime ? "day" : "night"} birth: year{" "}
            {sb.lords.varsha}, month {sb.lords.masa}, weekday {sb.lords.dina},
            hora {sb.lords.hora} (27.13).
            {sb.wars.length > 0 && (
              <>
                {" "}
                Planetary war (27.20):{" "}
                {sb.wars
                  .map(
                    (w) =>
                      `${w.victor} over ${w.loser}, ${w.separation.toFixed(2)} deg apart`,
                  )
                  .join("; ")}
                ; the difference of their totals moves to the victor.
              </>
            )}
          </>
        }
      />
      {back && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-2 inline-flex items-center gap-1 text-left text-xs font-medium text-primary hover:underline"
          data-testid="parashari-shadbala-back"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Back to the card: {back.title}
        </button>
      )}
      <Table className="mt-2" data-testid="parashari-shadbala-table">
        <TableHeader>
          <TableRow>
            <TableHead>Planet</TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Sthana
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Dig
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Kala
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Chesta
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Naisargika
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Drik
            </TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Needed</TableHead>
            <TableHead>Verdict</TableHead>
            <TableHead className="hidden whitespace-nowrap text-right sm:table-cell">
              Ishta / Kashta
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sb.planets.map((r) => (
            <BalaRows
              key={r.planet}
              r={r}
              sb={sb}
              varga={varga?.find((v) => v.planet === r.planet)}
              open={open === r.planet}
              toggle={() => setOpen(open === r.planet ? null : r.planet)}
            />
          ))}
        </TableBody>
      </Table>
      <SectionTitle
        as="h4"
        className="mt-6"
        plain="How strong each house is"
        technical="Strength of the houses (Bhava bala)"
        term="bhava-bala"
      />
      <ModeText
        plain={
          <>
            Each house is scored from the planets looking at it, its ruler's
            strength, the planets standing in it and the time of birth. No
            minimum is set; higher is stronger.
          </>
        }
        practitioner={
          <>
            Each cusp (lagna degree plus multiples of 30) measured from the
            point 27.26-28 name for its sign, a quarter of each aspect on it
            added or taken, the whole aspect of Jupiter and Mercury, the lord's
            Shadbala (27.29), a rupa for Jupiter or Mercury in the house and one
            less for the Sun, Mars or Saturn (27.30), and 15 virupas by the
            rising of the sign for a{" "}
            {sb.twilight ? "twilight" : sb.daytime ? "day" : "night"} birth
            (27.31). No requirement is stated; higher is stronger.
          </>
        }
      />
      <Table className="mt-2" data-testid="parashari-bhava-bala" cards>
        <TableHeader>
          <TableRow>
            <TableHead>House</TableHead>
            <TableHead>Sign</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Dig
            </TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Drishti
            </TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Lord
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Occupants
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Rising
            </TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sb.bhavas.map((b) => (
            <TableRow
              key={b.house}
              data-testid={`parashari-bhava-bala-${b.house}`}
            >
              <TableCell className="py-1.5">{b.house}</TableCell>
              <TableCell className="py-1.5">
                <SignName signIndex={b.signIndex} />
              </TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">
                {fmtV(b.dig)}
                <span className="ml-1 text-2xs text-muted-foreground">
                  from {b.reference}
                </span>
              </TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">
                {fmtV(b.drishti)}
              </TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">
                {fmtV(b.lordBala)}
                <span className="ml-1 text-2xs text-muted-foreground">
                  {PLANET_ABBR[b.lord]}
                </span>
              </TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums md:table-cell">
                {b.occupants.length
                  ? b.occupants
                      .map(
                        (o) =>
                          `${PLANET_ABBR[o.planet]} ${o.value > 0 ? "+" : ""}${o.value}`,
                      )
                      .join(", ")
                  : "—"}
              </TableCell>
              <TableCell className="hidden py-1.5 text-right tabular-nums md:table-cell">
                {b.udaya || "—"}
              </TableCell>
              <TableCell className="py-1.5 text-right font-medium tabular-nums">
                {b.total.toFixed(0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-1 text-xs text-muted-foreground">
        <SourceLink source={sb.sources.bhavaDig} /> ·{" "}
        <SourceLink source={sb.sources.bhavaDrishti} /> ·{" "}
        <SourceLink source={sb.sources.bhavaOccupant} /> ·{" "}
        <SourceLink source={sb.sources.bhavaUdaya} /> · rising of the signs{" "}
        <SourceLink source={sb.sources.udayaSigns} />, set against{" "}
        <BjCross c={BJ_CROSS_BY_KEY.risingSigns} /> (Sagittarius is back-rising
        there; Parashara's list is kept)
      </p>
      {phala && (
        <>
          <SectionTitle
            as="h4"
            className="mt-6"
            plain="What each house is likely to deliver"
            technical="Effects of the houses (28.15-20)"
          />
          <ModeText
            plain={
              <>
                Each house's score is combined with its ruler's, then nudged up
                for helpful planets in or looking at it and down for testing
                ones. Parashara gives the direction of each nudge, not its size,
                so the amounts are this app's reading and are marked
                provisional.
              </>
            }
            practitioner={
              <>
                Parashara combines each house's strength with its lord's, then
                adds to the good and takes from the ill for a benefic in the
                house, its aspects, the lord's dignity and the Ashtakavarga
                rekhas of the sign, reversing each for malefics,{" "}
                <SourceLink
                  source={{
                    label: "Parashara 28.15-20",
                    url: BPHS_URL(28),
                    provisional: true,
                  }}
                />
                . The verses give the direction of each step, not its scale; the
                amounts here are a stated reading (see the notes). Open a row
                for the parts.
              </>
            }
          />
          <Table className="mt-2" data-testid="parashari-bhava-phala">
            <TableHeader>
              <TableRow>
                <TableHead>House</TableHead>
                <TableHead>Sign</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Good
                </TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Ill
                </TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Reading</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phala.map((b) => (
                <PhalaRows
                  key={b.house}
                  b={b}
                  open={phalaOpen === b.house}
                  toggle={() =>
                    setPhalaOpen(phalaOpen === b.house ? null : b.house)
                  }
                />
              ))}
            </TableBody>
          </Table>
        </>
      )}
      <Expander
        testId="parashari-shadbala-caveats"
        label={HOW_COMPUTED}
        count={allCaveats.length}
        className="mt-2"
        contentClassName=""
      >
        <ul
          className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
          data-testid="parashari-shadbala-caveat-list"
        >
          {allCaveats.map((c, i) => (
            <li key={i}><Soft>{c}</Soft></li>
          ))}
        </ul>
      </Expander>
    </div>
  );
}

function PhalaRows({
  b,
  open,
  toggle,
}: {
  b: BhavaPhala;
  open: boolean;
  toggle: () => void;
}) {
  const cls =
    b.verdict === "auspicious"
      ? VERDICT_CLASS.support
      : b.verdict === "inauspicious"
        ? VERDICT_CLASS.strain
        : VERDICT_CLASS.mixed;
  return (
    <>
      <TableRow
        className={cn("cursor-pointer", open && "bg-muted/40")}
        onClick={toggle}
        data-testid={`parashari-bhava-phala-${b.house}`}
      >
        <TableCell className="py-1.5">{b.house}</TableCell>
        <TableCell className="py-1.5">
          <SignName signIndex={b.signIndex} />
        </TableCell>
        <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">
          {b.subha.toFixed(0)}
        </TableCell>
        <TableCell className="hidden py-1.5 text-right tabular-nums sm:table-cell">
          {b.asubha.toFixed(0)}
        </TableCell>
        <TableCell className="py-1.5 text-right font-medium tabular-nums">
          {b.net > 0 ? "+" : ""}
          {b.net.toFixed(0)}
        </TableCell>
        <TableCell className="py-1.5">
          <span
            className={cn(
              "whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium",
              cls,
            )}
          >
            {b.verdict} · {Math.round(b.share * 100)}% good
          </span>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell
            colSpan={6}
            className="px-3 py-2"
            data-testid={`parashari-bhava-phala-detail-${b.house}`}
          >
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {b.parts.map((p, i) => (
                <li key={i}>
                  {p.label}: good {p.subha > 0 ? "+" : ""}
                  {p.subha.toFixed(0)}, ill {p.asubha > 0 ? "+" : ""}
                  {p.asubha.toFixed(0)} <SourceLink source={p.source} />
                </li>
              ))}
            </ul>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function BalaRows({
  r,
  sb,
  varga,
  open,
  toggle,
}: {
  r: PlanetShadbala;
  sb: ShadbalaResult;
  varga?: VargaPhala;
  open: boolean;
  toggle: () => void;
}) {
  const src = sb.sources;
  const ik = sb.ishta.find((x) => x.planet === r.planet);
  const num = (v: number) => (
    <TableCell className="hidden py-1.5 text-right tabular-nums md:table-cell">
      {fmtV(v)}
    </TableCell>
  );
  return (
    <>
      <TableRow
        className={cn("cursor-pointer", open && "bg-muted/40")}
        onClick={toggle}
        data-testid={`parashari-shadbala-${r.planet}`}
      >
        <TableCell className="py-1.5 whitespace-nowrap">
          <PlanetName planet={r.planet} />
        </TableCell>
        {num(r.sthana.total)}
        {num(r.dig)}
        {num(r.kala.total)}
        {num(r.chesta)}
        {num(r.naisargika)}
        {num(r.drik)}
        <TableCell className="py-1.5 text-right font-medium tabular-nums">
          {r.total.toFixed(0)}
          {r.yuddha !== 0 && (
            <span className="block whitespace-nowrap text-2xs font-normal text-muted-foreground">
              war {r.yuddha > 0 ? "+" : ""}
              {r.yuddha.toFixed(0)}
            </span>
          )}
        </TableCell>
        <TableCell className="py-1.5 text-right tabular-nums text-muted-foreground">
          {r.required}
        </TableCell>
        <TableCell className="py-1.5">
          <span
            className={cn(
              "whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium",
              r.strong ? VERDICT_CLASS.support : VERDICT_CLASS.strain,
            )}
            data-testid={`parashari-shadbala-verdict-${r.planet}`}
          >
            {r.strong ? "strong" : "weak"} · {(r.ratio * 100).toFixed(0)}%
          </span>
        </TableCell>
        <TableCell
          className="hidden py-1.5 text-right tabular-nums sm:table-cell"
          data-testid={`parashari-ishta-${r.planet}`}
        >
          {ik ? (
            <>
              <span
                className={
                  ik.tendency === "benefic"
                    ? "text-verdict-good"
                    : "text-verdict-bad"
                }
              >
                {ik.ishta.toFixed(0)}
              </span>{" "}
              / {ik.kashta.toFixed(0)}
            </>
          ) : (
            "—"
          )}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell
            colSpan={11}
            className="px-3 py-3"
            data-testid={`parashari-shadbala-detail-${r.planet}`}
          >
            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="font-medium text-foreground">
                  Sthana bala {fmtV(r.sthana.total)}
                </p>
                <p>
                  Uchcha {fmtV(r.sthana.uchcha)}{" "}
                  <SourceLink source={src.uchcha} />
                </p>
                <p>
                  Saptavargaja {r.sthana.saptavargaTotal}{" "}
                  <SourceLink source={src.saptavarga} />:{" "}
                  {r.sthana.saptavarga
                    .map(
                      (v) =>
                        `${v.varga} ${v.lord === r.planet ? v.relation : `${v.lord}, ${v.relation}`} ${v.virupas}`,
                    )
                    .join("; ")}
                  . <SourceLink source={src.relations} />; natural table{" "}
                  <BjCross c={BJ_CROSS_BY_KEY.naturalFriends} />, temporary{" "}
                  <BjCross c={BJ_CROSS_BY_KEY.temporaryFriends} />
                </p>
                <p>
                  Ojhayugma {r.sthana.ojhayugma}{" "}
                  <SourceLink source={src.ojhayugma} /> · Kendradi{" "}
                  {r.sthana.kendradi} <SourceLink source={src.kendradi} /> ·
                  Drekkana {r.sthana.drekkana}{" "}
                  <SourceLink source={src.drekkana} />
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Kala bala {fmtV(r.kala.total)}
                </p>
                <p>
                  Nathonnatha {fmtV(r.kala.nathonnatha)}{" "}
                  <SourceLink source={src.nathonnatha} /> · Paksha{" "}
                  {fmtV(r.kala.paksha)} <SourceLink source={src.paksha} /> ·
                  Tribhaga {r.kala.tribhaga}{" "}
                  <SourceLink source={src.tribhaga} />
                </p>
                <p>
                  Year {r.kala.varsha}, month {r.kala.masa}, day {r.kala.dina},
                  hora {r.kala.hora} <SourceLink source={src.lords} /> · Ayana{" "}
                  {fmtV(r.kala.ayana)} <SourceLink source={src.ayana} /> · day,
                  night, fortnight and lords also in{" "}
                  <BjCross c={BJ_CROSS_BY_KEY.kalaBala} />
                </p>
                <p className="mt-1">
                  <span className="font-medium text-foreground">Dig</span>{" "}
                  {fmtV(r.dig)} <SourceLink source={src.dig} />{" "}
                  <BjCross c={BJ_CROSS_BY_KEY.digBala} /> ·{" "}
                  <span className="font-medium text-foreground">Chesta</span>{" "}
                  {fmtV(r.chesta)}{" "}
                  <SourceLink
                    source={
                      r.planet === "Sun" || r.planet === "Moon"
                        ? src.chestaLuminaries
                        : src.chesta
                    }
                  />{" "}
                  <BjCross c={BJ_CROSS_BY_KEY.chestaBala} /> ·{" "}
                  <span className="font-medium text-foreground">
                    Naisargika
                  </span>{" "}
                  {fmtV(r.naisargika)} <SourceLink source={src.naisargika} />{" "}
                  <BjCross c={BJ_CROSS_BY_KEY.naisargika} /> ·{" "}
                  <span className="font-medium text-foreground">Drik</span>{" "}
                  {fmtV(r.drik)} <SourceLink source={src.drik} />
                  {r.yuddha !== 0 && (
                    <>
                      {" "}
                      · War {r.yuddha > 0 ? "+" : ""}
                      {fmtV(r.yuddha)} <SourceLink source={src.yuddha} />
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Against the requirements
                </p>
                <p>
                  Total {r.total.toFixed(0)} of {r.required}{" "}
                  <SourceLink source={src.required} />
                </p>
                <p>
                  {r.components
                    .map(
                      (c) =>
                        `${c.name} ${c.value.toFixed(0)}/${c.required}${c.ok ? "" : " short"}`,
                    )
                    .join(" · ")}{" "}
                  <SourceLink source={src.componentsRequired} />
                </p>
                <p>
                  Effect for lord-in-house readings: {r.effect}{" "}
                  <SourceLink source={src.effect} />
                </p>
                {ik && (
                  <>
                    <p className="mt-2 font-medium text-foreground">
                      Ishta and Kashta (ch. 28)
                    </p>
                    <p>
                      Uchcha rasmi {ik.uchchaRasmi.toFixed(2)}, Chesta rasmi{" "}
                      {ik.chestaRasmi.toFixed(2)}{" "}
                      <SourceLink source={src.rasmi} /> · Subha{" "}
                      {ik.subhaRasmi.toFixed(2)}, Asubha{" "}
                      {ik.asubhaRasmi.toFixed(2)}{" "}
                      <SourceLink source={src.subhaRasmi} />
                    </p>
                    <p>
                      Ishta phala {ik.ishta.toFixed(1)}, Kashta phala{" "}
                      {ik.kashta.toFixed(1)}: {ik.tendency} tendency{" "}
                      <SourceLink source={src.ishta} />
                    </p>
                    <p>
                      Saptavarga subhanka {ik.saptavargaSubha.toFixed(1)} /
                      asubhanka {ik.saptavargaAsubha.toFixed(1)}{" "}
                      <SourceLink source={src.subhanka} /> · Dig as effect{" "}
                      {fmtV(ik.digSubha)} good, {fmtV(ik.digAsubha)} ill{" "}
                      <SourceLink source={src.digSubha} />
                    </p>
                    {varga && (
                      <p>
                        Varga effect scaled by the Shadbala total: good{" "}
                        {varga.subha.toFixed(1)}, ill {varga.asubha.toFixed(1)}{" "}
                        <SourceLink
                          source={{
                            label: "Parashara 28.13-14",
                            url: BPHS_URL(28),
                            provisional: true,
                          }}
                        />
                      </p>
                    )}
                  </>
                )}
                {r.notes.map((n, i) => (
                  <p key={i} className="mt-1">
                    {n}
                  </p>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function Note({ n }: { n: DasaNote }) {
  const plainN = usePlain();
  return (
    <li
      className={cn(
        "rounded-md border border-l-4 bg-card px-3 py-2",
        TONE_CLASS[n.tone],
      )}
      data-testid={`parashari-dasa-note-${n.id}`}
    >
      <p className="text-sm text-muted-foreground">
        <Soft>{n.text}</Soft>
        {!plainN && n.detail ? (
          <span data-testid={`parashari-dasa-note-detail-${n.id}`}>
            {" "}
            {n.detail}
          </span>
        ) : null}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {LAYER_LABEL[n.layer]} · <SourceLink source={n.source} />
      </p>
    </li>
  );
}

function DasaEffects({
  d,
  states,
  open,
  setOpen,
  birthIso,
  asOfIso,
  withheld,
}: {
  d: DasaReading;
  /** The lord's Lajjitadi states (45.19-20), null when it holds none; placed with the period provisionally (Mehta, ch. XV). */
  states?: StateLine | null;
  open: string | null;
  setOpen: (k: string | null) => void;
  birthIso: string;
  asOfIso: string;
  withheld: boolean;
}) {
  const plainDE = usePlain();
  const layers: DasaNote["layer"][] = [
    "general",
    "dignity",
    "strength",
    "ashtakavarga",
    "planet",
    "lordship",
    "relation",
    "condition",
  ];
  const running = d.antars.find((a) => a.current);
  const spell = running?.pratyantars?.find((p) => p.current);
  const runningKey = running ? `${d.lord}-${running.lord}` : null;
  const ordered = layers.flatMap((l) => d.notes.filter((n) => n.layer === l));
  const count = (t: DasaNote["tone"]) =>
    d.notes.filter((n) => n.tone === t).length;
  // 47.3-4 places the results by the lord's drekkana; 50.88 by how its sign rises.
  const w47 =
    d.timing.third === 1 ? "start" : d.timing.third === 2 ? "middle" : "end";
  const w50 =
    d.timing.rising === "head"
      ? "start"
      : d.timing.rising === "hind"
        ? "end"
        : "middle";
  const note88 = d.notes.find((n) => n.id === `${d.lord}-50-88`);
  const GROUPS: { tone: DasaNote["tone"]; plain: string; technical: string }[] =
    [
      { tone: "support", plain: "In its favour", technical: "Favourable" },
      { tone: "strain", plain: "Against it", technical: "Unfavourable" },
      { tone: "mixed", plain: "Mixed", technical: "Mixed" },
    ];
  return (
    <div className="mt-8" data-testid="parashari-dasa-effects">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">
          <PlanetName planet={d.lord} /> {levelName("dasa", plainDE)},{" "}
          {fmt(d.start)} to {fmt(d.end)}
        </h3>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium",
            VERDICT_CLASS[d.verdict],
          )}
          data-testid="parashari-dasa-verdict"
        >
          {VERDICT_LABEL[d.verdict]} on balance
        </span>
        {d.current && (
          <span className="rounded bg-primary px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-primary-foreground">
            <NowWord />
          </span>
        )}
      </div>
      <ModeText
        plain={
          <>
            What Parashara says a {d.lord} period brings for someone with{" "}
            {d.lord} placed as it is here:{" "}
            {running ? "the sub-period running now first, then " : ""}the
            balance of the text's lines and when in the period they are felt.
            The lines themselves follow, grouped by whether they help or
            hinder, favourable and unfavourable alike.
          </>
        }
        practitioner={
          <>
            Effects of the period from Brihat Parashara Hora Sastra ch. 47
            (placement of the lord) and ch. 48 (house lordship and
            relationships), matched mechanically on whole-sign houses and
            dignity, with the lord's Shadbala (ch. 27) set against the
            requirement of 27.32-33, its Ishta and Kashta phala (ch. 28), its
            transit house when the dasa begins (48.8), and the condition of the
            lord from ch. 50: its place on the circle from deep exaltation to
            deep debilitation (50.73-83, provisional as to degrees), the measure
            by angle, panaphara or apoklima (50.87), the Dharma lord and Jupiter
            (50.84), and the planet rules of 50.29-34 and 50.43-47; antar lords
            carry their compound friendship with the dasa lord (50.89). Not
            applied from ch. 50: the rules on the positions at the start and end
            of a dasa (50.35, 50.37-39, 50.45, 50.48-52). Every matched verse is
            listed, favourable and unfavourable alike, so contradictions stay
            visible.
          </>
        }
      />
      {states !== undefined && (
        <p
          className="mt-2 text-sm"
          data-testid="parashari-dasa-states"
        >
          <span className="font-medium">
            {plainDE ? `${d.lord}'s moods: ` : `Lajjitadi of ${d.lord}: `}
          </span>
          <span className="text-muted-foreground">
            {states ? (
              <Soft>{plainDE ? states.briefPlain : states.brief}</Soft>
            ) : plainDE ? (
              "none of the six moods."
            ) : (
              "none of the six states (45.11-17)."
            )}
          </span>{" "}
          {states && (
            <>
              <Badge variant="outline" className="text-2xs">
                provisional
              </Badge>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {plainDE
                  ? "Chapter 45 gives these moods no timing; reading them with the period follows Mehta. The Planets chapter has the full reading."
                  : "Placement provisional: ch. 45 gives the states no timing; Mehta reads a lord's state before judging its dasa (ch. XV). The full line is in the Planets chapter."}{" "}
                <SourceLink source={states.source} mark={false} />
              </span>
            </>
          )}
        </p>
      )}
      {running && runningKey && (
        <div
          className="mt-3 rounded-md border bg-primary/5 px-3 py-2"
          data-testid="parashari-dasa-running"
        >
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
            <span className="font-medium">
              <NowWord cap />:
            </span>
            <span>
              <PlanetName planet={running.lord} />{" "}
              {levelName("antar", plainDE)}, {fmtD(running.start)} to{" "}
              {fmtD(running.end)}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium",
                VERDICT_CLASS[running.verdict],
              )}
            >
              {VERDICT_LABEL[running.verdict]}
            </span>
            {spell && (
              <span className="text-muted-foreground">
                · <PlanetName planet={spell.lord} />{" "}
                {levelName("pratyantar", plainDE)}, {fmtD(spell.start)} to{" "}
                {fmtD(spell.end)}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {plainDE
              ? "What the text weighs for this antar: "
              : "Placements matched: "}
            <Facts a={running} /> <SourceLink source={running.source} />
          </p>
          {/* The pratyantar's general effects stay in its list for the plain reading: 61.2 cancels the ill ones for a well-placed lord, a test not applied here. */}
          {!plainDE && spell?.text && (
            <p className="mt-1 text-xs text-muted-foreground">
              Pratyantar: {spell.text} <SourceLink source={spell.source} />{" "}
              (general effects; 61.2 withholds the ill ones when the pratyantar
              lord is well placed)
            </p>
          )}
          <button
            type="button"
            className="mt-1 text-xs font-medium text-primary underline underline-offset-2"
            onClick={() => {
              setOpen(runningKey);
              requestAnimationFrame(() =>
                jumpTo(`parashari-antar-${runningKey}`),
              );
            }}
            data-testid="parashari-dasa-running-open"
          >
            {plainDE
              ? "Read the text for this sub-period"
              : "Open the antar's verses"}
          </button>
        </div>
      )}
      <p className="mt-3 text-sm" data-testid="parashari-dasa-synthesis">
        {plainDE
          ? `Of the ${d.notes.length} lines the text gives for this period, ${count("support")} favour it, ${count("strain")} go against it and ${count("mixed")} are mixed, so on balance it reads ${VERDICT_LABEL[d.verdict]}.`
          : `${d.notes.length} matched lines: ${count("support")} favourable, ${count("strain")} unfavourable, ${count("mixed")} mixed; on balance ${VERDICT_LABEL[d.verdict]}.`}
      </p>
      <div
        className="mt-2 grid gap-2 sm:grid-cols-2"
        data-testid="parashari-dasa-timing"
      >
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            {plainDE
              ? `By the planet's degree: mainly at the ${w47}`
              : `Drekkana (47.3-4): ${w47}`}
          </p>
          <p className="mt-0.5">
            <Soft>{d.timing.text}</Soft> <SourceLink source={d.timing.source} />
          </p>
        </div>
        {note88 && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              {plainDE
                ? `By how its sign rises: ${w50 === "middle" ? "in the middle" : `towards the ${w50}`}`
                : `Rising of the sign (50.88): ${w50}`}
            </p>
            <p className="mt-0.5">
              <Soft>{note88.text}</Soft> <SourceLink source={note88.source} />
            </p>
          </div>
        )}
      </div>
      {note88 && (
        <p
          className="mt-1 text-xs text-muted-foreground"
          data-testid="parashari-dasa-timing-agreement"
        >
          {w47 === w50
            ? `The two timing rules agree: the results come mainly at the ${w47} of the period.`
            : "The two timing rules point to different parts of the period, so both are shown."}
        </p>
      )}
      <Working
        id="parashari-dasa-notes"
        label={`Show the ${d.notes.length} lines this rests on`}
        className="mt-3"
      >
        <div className="space-y-3" data-testid="parashari-dasa-notes">
          {GROUPS.map((g) => {
            const ns = ordered.filter((n) => n.tone === g.tone);
            if (!ns.length) return null;
            return (
              <div key={g.tone}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {plainDE ? g.plain : g.technical} ({ns.length})
                </p>
                <ul className="mt-1.5 space-y-2">
                  {ns.map((n) => (
                    <Note key={n.id} n={n} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Working>

      <SectionTitle
        as="h4"
        className="mt-6"
        plain={`Sub-periods within the ${d.lord} period`}
        technical={`Antar dasas in the ${d.lord} dasa`}
        term="antardasha"
      />
      <ModeText
        plain={
          <>
            Each period is divided among the nine planets in turn. Each
            sub-period is judged by where its planet stands relative to the
            rising sign and to {d.lord}, by its dignity and company. Open a row
            for the text's own wording.
          </>
        }
        practitioner={
          <>
            Each sub-lord is checked against the placements Parashara names for
            it in the {d.lord} dasa chapter: angles and trines from the lagna,
            dignity, the house it holds from the dasa lord, company, and 2nd/7th
            lordship (maraka). Open a row for the chapter's own wording.
          </>
        }
      />
      <Table className="mt-2" data-testid="parashari-antars">
        <TableHeader>
          <TableRow>
            <TableHead>Antar</TableHead>
            <TableHead className="hidden sm:table-cell">Dates</TableHead>
            <TableHead>Verdict</TableHead>
            <TableHead className="hidden sm:table-cell">
              Placements matched
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {d.antars.map((a) => {
            const key = `${d.lord}-${a.lord}`;
            const isOpen = open === key;
            return (
              <AntarRows
                key={key}
                a={a}
                isOpen={isOpen}
                toggle={() => setOpen(isOpen ? null : key)}
                dasaLord={d.lord}
              />
            );
          })}
        </TableBody>
      </Table>

      {running?.pratyantars && (
        <div className="mt-6" data-testid="parashari-pratyantars">
          <SectionTitle
            as="h4"
            plain={`Third-level periods within the running ${d.lord}–${running.lord} sub-period`}
            technical={`Pratyantar dasas in the running ${d.lord}–${running.lord} antar`}
            term="pratyantar"
          />
          <ModeText
            plain={
              <>
                Each antar divides again into nine pratyantars (third-level
                periods), weeks to months long. The text gives only general
                effects for these, and adds that the ill ones do not follow when
                the pratyantar's planet is well placed. Select one to divide it
                further.
              </>
            }
            practitioner={
              <>
                General effects only, from{" "}
                <SourceLink
                  source={{ label: "Parashara 61.2-82", url: BPHS_URL(61) }}
                />
                . Verse 61.2 adds that the ill effects do not follow when the
                pratyantar lord is in a trine, owns or occupies an auspicious
                house, or is in a benefic varga; apply the same test to each
                line. Select a pratyantar to divide it further.
              </>
            }
          />
          <FineLevels
            dasaLord={d.lord}
            antarLord={running.lord}
            pratyantars={running.pratyantars}
            birthIso={birthIso}
            asOfIso={asOfIso}
            withheld={withheld}
          />
        </div>
      )}
    </div>
  );
}

const fmtDT = (iso: string) =>
  DateTime.fromISO(iso).toFormat("d LLL yyyy HH:mm");

function FineRow({
  p,
  testid,
  selected,
  onSelect,
  withTime,
}: {
  p: FinePeriod;
  testid: string;
  selected?: boolean;
  onSelect?: () => void;
  withTime: boolean;
}) {
  const inner = (
    <>
      <span className="w-16 shrink-0">
        <PlanetName planet={p.lord} abbr tone />
      </span>
      <span
        className={cn(
          "shrink-0 text-xs text-muted-foreground whitespace-nowrap tabular-nums",
          withTime ? "sm:w-64" : "sm:w-44",
        )}
      >
        {withTime
          ? `${fmtDT(p.start)} – ${fmtDT(p.end)}`
          : `${fmtD(p.start)} – ${fmtD(p.end)}`}
      </span>
      {p.current && (
        <span className="rounded bg-primary px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-primary-foreground">
          <NowWord />
        </span>
      )}
      <span className="min-w-0 basis-full text-xs text-muted-foreground sm:basis-0 sm:flex-1">
        <Soft>{p.text}</Soft> <SourceLink source={p.source} />
      </span>
    </>
  );
  const cls = cn(
    "flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-1.5",
    p.current && "bg-primary/5",
    selected && "ring-1 ring-inset ring-primary/40",
  );
  return (
    <li data-testid={testid} className={onSelect ? undefined : cls}>
      {onSelect ? (
        <button
          type="button"
          className={cn(cls, "w-full text-left")}
          onClick={onSelect}
          aria-pressed={selected}
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </li>
  );
}

function FineLevels({
  dasaLord,
  antarLord,
  pratyantars,
  birthIso,
  asOfIso,
  withheld,
}: {
  dasaLord: Planet;
  antarLord: Planet;
  pratyantars: NonNullable<AntarReading["pratyantars"]>;
  birthIso: string;
  asOfIso: string;
  withheld: boolean;
}) {
  const currentP = pratyantars.find((p) => p.current) ?? pratyantars[0];
  const [pSel, setPSel] = useState<string>(currentP.start);
  const pratyantar = pratyantars.find((p) => p.start === pSel) ?? currentP;
  const sookshmas = useMemo(
    () =>
      finePeriodsOf(
        [dasaLord, antarLord, pratyantar.lord],
        pratyantar.end,
        "sookshma",
        birthIso,
        asOfIso,
        withheld,
      ),
    [dasaLord, antarLord, pratyantar, birthIso, asOfIso, withheld],
  );
  const [sSel, setSSel] = useState<string | null>(null);
  const sookshma =
    sookshmas.find((s) => s.start === sSel) ??
    sookshmas.find((s) => s.current) ??
    sookshmas[0];
  const pranas = useMemo(
    () =>
      sookshma
        ? finePeriodsOf(
            [dasaLord, antarLord, pratyantar.lord, sookshma.lord],
            sookshma.end,
            "prana",
            birthIso,
            asOfIso,
            withheld,
          )
        : [],
    [dasaLord, antarLord, pratyantar, sookshma, birthIso, asOfIso, withheld],
  );
  return (
    <>
      <ul className="mt-2 divide-y rounded-md border text-sm">
        {pratyantars.map((p) => (
          <FineRow
            key={p.lord + p.start}
            p={p}
            testid={`parashari-pratyantar-${p.lord}`}
            selected={p.start === pratyantar.start}
            onSelect={() => {
              setPSel(p.start);
              setSSel(null);
            }}
            withTime={false}
          />
        ))}
      </ul>

      <Working
        id="parashari-fine-spells"
        label="Show the sookshma and prana levels, days and hours long"
        className="mt-4"
      >
        <div data-testid="parashari-sookshmas-heading">
        <SectionTitle
          as="h4"
          className="mt-6"
          plain={`Fourth-level periods within ${dasaLord}–${antarLord}–${pratyantar.lord}`}
          technical={`Sookshma dasas in the ${dasaLord}–${antarLord}–${pratyantar.lord} pratyantar`}
        />
      </div>
      <ModeText
        plain={
          <>
            Sookshmas, days long, each planet's share in proportion to its
            period length. General effects only. Select one to divide it into
            pranas, hours long.
          </>
        }
        practitioner={
          <>
            Each sookshma is the pratyantar multiplied by its lord's dasa years
            over 120{" "}
            <SourceLink
              source={{ label: "Parashara 62.1", url: BPHS_URL(62) }}
            />
            ; the effects are the general ones of{" "}
            <SourceLink
              source={{ label: "Parashara 62.2-82", url: BPHS_URL(62) }}
            />
            , keyed by the pratyantar lord. Select a sookshma to divide it into
            pranas.
          </>
        }
      />
      <ul
        className="mt-2 divide-y rounded-md border text-sm"
        data-testid="parashari-sookshmas"
      >
        {sookshmas.map((s) => (
          <FineRow
            key={s.lord + s.start}
            p={s}
            testid={`parashari-sookshma-${s.lord}`}
            selected={sookshma && s.start === sookshma.start}
            onSelect={() => setSSel(s.start)}
            withTime={false}
          />
        ))}
      </ul>

      {sookshma && (
        <>
          <div data-testid="parashari-pranas-heading">
            <SectionTitle
              as="h4"
              className="mt-6"
              plain={`Fifth-level periods within ${dasaLord}–${antarLord}–${pratyantar.lord}–${sookshma.lord}, ${fmtD(sookshma.start)} to ${fmtD(sookshma.end)}`}
              technical={`Prana dasas in the ${sookshma.lord} sookshma, ${fmtD(sookshma.start)} to ${fmtD(sookshma.end)}`}
            />
          </div>
          <ModeText
            plain={
              <>
                The finest level, hours long, shown in your device's time zone.
                Parashara asks that all five levels be weighed together before
                anything is predicted, so treat these as colour, not verdicts.
              </>
            }
            practitioner={
              <>
                Each prana is the sookshma multiplied by its lord's dasa years
                over 120{" "}
                <SourceLink
                  source={{ label: "Parashara 63.1", url: BPHS_URL(63) }}
                />
                , effects from{" "}
                <SourceLink
                  source={{ label: "Parashara 63.2-82", url: BPHS_URL(63) }}
                />{" "}
                keyed by the sookshma lord. Times are shown in your device's
                time zone; Parashara closes by asking that dasa, antar,
                pratyantar, sookshma and prana all be weighed together before
                predicting{" "}
                <SourceLink
                  source={{ label: "Parashara 63.83", url: BPHS_URL(63) }}
                />
                .
              </>
            }
          />
          <ul
            className="mt-2 divide-y rounded-md border text-sm"
            data-testid="parashari-pranas"
          >
            {pranas.map((p) => (
              <FineRow
                key={p.lord + p.start}
                p={p}
                testid={`parashari-prana-${p.lord}`}
                withTime
              />
            ))}
          </ul>
        </>
      )}
      </Working>
    </>
  );
}

function Facts({ a }: { a: AntarReading }) {
  const plain = usePlain();
  const maraka = plain && a.facts.marakaPlain ? a.facts.marakaPlain : a.facts.maraka;
  return (
    <>
      {a.facts.favourable.length > 0 && (
        <span className="text-verdict-good">
          {a.facts.favourable.join("; ")}
        </span>
      )}
      {a.facts.favourable.length > 0 &&
        (a.facts.adverse.length > 0 || a.facts.maraka) && <span> · </span>}
      {a.facts.adverse.length > 0 && (
        <span className="text-verdict-bad">{a.facts.adverse.join("; ")}</span>
      )}
      {a.facts.adverse.length > 0 && a.facts.maraka && <span> · </span>}
      {a.facts.maraka && (
        <span className="text-verdict-bad">{maraka}</span>
      )}
      {!a.facts.favourable.length &&
        !a.facts.adverse.length &&
        !a.facts.maraka && <span>none of the named placements</span>}
    </>
  );
}

function AntarRows({
  a,
  isOpen,
  toggle,
  dasaLord,
}: {
  a: AntarReading;
  isOpen: boolean;
  toggle: () => void;
  dasaLord: string;
}) {
  const e = a.entry;
  return (
    <>
      <TableRow
        className={cn(
          "cursor-pointer scroll-mt-24",
          a.current && "bg-primary/5",
          a.past && !a.current && "text-muted-foreground/80",
        )}
        onClick={toggle}
        data-testid={`parashari-antar-${dasaLord}-${a.lord}`}
        aria-expanded={isOpen}
      >
        <TableCell className="py-1.5 whitespace-nowrap">
          <PlanetName planet={a.lord} />
          {a.current && (
            <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-primary-foreground">
              <NowWord />
            </span>
          )}
        </TableCell>
        <TableCell className="hidden py-1.5 text-xs text-muted-foreground sm:table-cell whitespace-nowrap">
          {fmt(a.start)} – {fmt(a.end)}
        </TableCell>
        <TableCell className="py-1.5">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
              VERDICT_CLASS[a.verdict],
            )}
          >
            {VERDICT_LABEL[a.verdict]}
          </span>
        </TableCell>
        <TableCell className="hidden py-1.5 text-xs text-muted-foreground sm:table-cell">
          <Facts a={a} />
        </TableCell>
      </TableRow>
      <TableRow className="sm:hidden" onClick={toggle}>
        <TableCell
          colSpan={4}
          className="px-3 pb-2 pt-0 text-xs text-muted-foreground"
        >
          <span className="mr-2">
            {fmt(a.start)} – {fmt(a.end)}.
          </span>
          <Facts a={a} />
        </TableCell>
      </TableRow>
      {isOpen && e && (
        <TableRow
          className="bg-muted/30 hover:bg-muted/30"
          data-testid={`parashari-antar-text-${dasaLord}-${a.lord}`}
        >
          <TableCell colSpan={4} className="px-3 py-3">
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div
                className={cn(
                  "rounded-md border border-l-4 bg-card p-3",
                  TONE_CLASS.support,
                )}
              >
                <p className="font-medium">When favourable</p>
                <p className="mt-1 text-muted-foreground">
                  Conditions: {e.favourable.conditions}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {e.favourable.effects}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-md border border-l-4 bg-card p-3",
                  TONE_CLASS.strain,
                )}
              >
                <p className="font-medium">When adverse</p>
                <p className="mt-1 text-muted-foreground">
                  Conditions: {e.adverse.conditions}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {e.adverse.effects}
                </p>
              </div>
            </div>
            <dl className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
              {e.maraka && (
                <>
                  <dt className="font-medium">Maraka</dt>
                  <dd className="text-muted-foreground">{e.maraka}</dd>
                </>
              )}
              {e.phases && (
                <>
                  <dt className="font-medium">Course</dt>
                  <dd className="text-muted-foreground">{e.phases}</dd>
                </>
              )}
              {e.remedy && (
                <>
                  <dt className="font-medium">Remedy named</dt>
                  <dd className="text-muted-foreground">{e.remedy}</dd>
                </>
              )}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              <SourceLink source={a.source} /> · paraphrased from the Santhanam
              translation
            </p>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

const BAND_CLASS: Record<AshtakavargaResult["band"][number], string> = {
  favourable: VERDICT_CLASS.support,
  medium: VERDICT_CLASS.mixed,
  adverse: VERDICT_CLASS.strain,
};
const OWNER_ABBR = (o: Bhinnashtaka["owner"]) =>
  o === "Lagna" ? "La" : PLANET_ABBR[o];

function AshtakavargaSection({
  av,
  lagnaIdx,
  withheld,
}: {
  av: AshtakavargaResult;
  lagnaIdx: number;
  withheld: boolean;
}) {
  const [pick, setPick] = useState<Bhinnashtaka["owner"] | null>(null);
  const chart = pick ? av.charts.find((c) => c.owner === pick) : undefined;
  const src = av.sources;
  const prasnaAv = computePrasnaAvReadings(av);
  return (
    <div className="mt-8" data-testid="parashari-ashtakavarga">
      <SectionTitle
        plain="Points by sign"
        technical="Ashtakavarga"
        term="ashtakavarga"
      />
      <ModeText
        plain={
          <>
            A points system. The seven planets and the rising sign each award
            marks to signs; a sign can hold up to 56. Above 30 is favourable
            ground, 25 to 30 middling, below 25 hard going for planets passing
            through. Rows are the houses from the rising sign; pick a planet's
            column for its own table.
          </>
        }
        practitioner={
          <>
            Benefic marks (rekhas) that each of the seven planets and the lagna
            give to every sign in the chart of each planet,{" "}
            <SourceLink source={src.rekhas} />, summed into the Sarvashtakavarga
            of <SourceLink source={src.sarva} />: above 30 favourable, 25 to 30
            medium, below 25 adverse <SourceLink source={src.bands} />. Rows are
            the houses from the lagna; pick a planet's column for its reductions
            and pindas (ch. 67-69).
          </>
        }
      />
      <Table className="mt-2" data-testid="parashari-sarva">
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 sm:px-4">House</TableHead>
            <TableHead className="px-2 sm:px-4">Sign</TableHead>
            {av.charts.map((c) => (
              <TableHead
                key={c.owner}
                className={cn(
                  "hidden text-right md:table-cell",
                  c.owner === "Lagna" && "text-muted-foreground",
                )}
              >
                <button
                  className={cn(
                    "underline-offset-2 hover:underline",
                    pick === c.owner && "text-primary underline",
                  )}
                  onClick={() => setPick(pick === c.owner ? null : c.owner)}
                  data-testid={`parashari-av-pick-${c.owner}`}
                >
                  {OWNER_ABBR(c.owner)}
                </button>
              </TableHead>
            ))}
            <TableHead className="px-2 text-right sm:px-4">Total</TableHead>
            <TableHead className="px-2 sm:px-4">Band</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {av.houses.map((h) => (
            <TableRow key={h.house} data-testid={`parashari-sarva-${h.house}`}>
              <TableCell className="px-2 py-1.5 sm:px-4">{h.house}</TableCell>
              <TableCell className="px-2 py-1.5 sm:px-4">
                <SignName signIndex={h.signIndex} />
              </TableCell>
              {av.charts.map((c) => (
                <TableCell
                  key={c.owner}
                  className={cn(
                    "hidden py-1.5 text-right tabular-nums md:table-cell",
                    c.owner === "Lagna" && "text-muted-foreground",
                    pick === c.owner && "bg-primary/5 font-medium",
                  )}
                >
                  {c.rekhas[h.signIndex]}
                </TableCell>
              ))}
              <TableCell className="px-2 py-1.5 sm:px-4 text-right font-medium tabular-nums">
                {h.rekhas}
              </TableCell>
              <TableCell className="px-2 py-1.5 sm:px-4">
                <span
                  className={cn(
                    "whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium",
                    BAND_CLASS[h.band],
                  )}
                >
                  {h.band}
                </span>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="hover:bg-transparent">
            <TableCell
              className="px-2 py-1.5 sm:px-4 text-xs text-muted-foreground"
              colSpan={2}
            >
              Rekhas in each chart
            </TableCell>
            {av.charts.map((c) => (
              <TableCell
                key={c.owner}
                className="hidden px-2 py-1.5 sm:px-4 text-right text-xs tabular-nums text-muted-foreground md:table-cell"
              >
                {c.total}
              </TableCell>
            ))}
            <TableCell className="px-2 py-1.5 sm:px-4 text-right text-xs tabular-nums text-muted-foreground">
              {av.sarva.reduce((a, b) => a + b, 0)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
      <p className="mt-1 text-xs text-muted-foreground">
        The total leaves out the lagna's chart, which the text keeps apart; the
        seven planets give 337 rekhas in all.
      </p>
      <p
        className="mt-1 text-xs text-muted-foreground"
        data-testid="parashari-av-saravali"
      >
        {av.saravali.differing.length ? (
          <>
            Under the {av.saravali.label} (the table Raman and most software
            use, three cells of the Moon's row differ from Parashara's) these
            totals would read:{" "}
            {av.saravali.differing
              .map(
                (d) =>
                  `${SIGNS[d.signIndex]} ${d.saravali}${d.bandSaravali !== d.bandParashara ? ` (${d.bandSaravali})` : ""}`,
              )
              .join(", ")}
            .{" "}
            <Badge variant="outline" className="text-2xs">
              provisional
            </Badge>{" "}
            <SourceLink source={av.sources.moonRowBrihatJataka} mark={false} />{" "}
            <SourceLink source={av.sources.moonRowAdyar} mark={false} />
          </>
        ) : (
          <>
            The {av.saravali.label} gives the same totals for this chart.{" "}
            <SourceLink source={av.sources.moonRowBrihatJataka} mark={false} />{" "}
            <SourceLink source={av.sources.moonRowAdyar} mark={false} />
          </>
        )}
      </p>
      <p className="mt-1 text-2xs text-muted-foreground">
        The Jupiter cell of that row is a variant reading of Brihat Jataka 9.2:
        the wisdomlib text reads the 12th, the Adyar Library edition (Aiyangar
        1951, p. 432, commentary p. 433) reads the 2nd and agrees with
        Parashara; the Moon and Mars cells are the same in both editions.
      </p>
      {av.ekadhipatyaVariant.length > 0 && (
        <p
          className="mt-1 text-xs text-muted-foreground"
          data-testid="parashari-av-ekadhipatya-variant"
        >
          Ekadhipatya shodhana here brings an empty sign down to the occupied
          sign's figure (Phaladeepika 24.19); reading 68.3 as a subtraction
          would give Yoga pinda{" "}
          {av.ekadhipatyaVariant
            .map((v) => `${v.owner} ${v.yogaPinda}`)
            .join(", ")}
          .{" "}
          <Badge variant="outline" className="text-2xs">
            provisional
          </Badge>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1 md:hidden">
        {av.charts.map((c) => (
          <button
            key={c.owner}
            className={cn(
              "rounded border px-2 py-0.5 text-xs",
              pick === c.owner
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground",
            )}
            onClick={() => setPick(pick === c.owner ? null : c.owner)}
            data-testid={`parashari-av-pick-sm-${c.owner}`}
          >
            {c.owner}
          </button>
        ))}
      </div>
      {chart && (
        <div
          className="mt-3 rounded-md border bg-muted/30 p-3 text-xs"
          data-testid={`parashari-av-detail-${chart.owner}`}
        >
          <p className="font-medium">
            {chart.owner}'s Ashtakavarga: {chart.total} rekhas
          </p>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 text-xs sm:px-4">Sign</TableHead>
                <TableHead className="px-2 text-right text-xs sm:px-4">
                  Rekhas
                </TableHead>
                <TableHead className="hidden text-xs sm:table-cell">
                  Given by
                </TableHead>
                <TableHead className="px-2 text-right text-xs sm:px-4">
                  <span className="sm:hidden">Trik.</span>
                  <span className="hidden sm:inline">Trikona</span>
                </TableHead>
                <TableHead className="px-2 text-right text-xs sm:px-4">
                  <span className="sm:hidden">Ekad.</span>
                  <span className="hidden sm:inline">Ekadhipatya</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 12 }, (_, i) => (lagnaIdx + i) % 12).map(
                (s) => (
                  <TableRow key={s}>
                    <TableCell className="py-1">
                      <SignName signIndex={s} />
                    </TableCell>
                    <TableCell className="px-2 py-1 sm:px-4 text-right tabular-nums">
                      {chart.rekhas[s]}
                    </TableCell>
                    <TableCell className="hidden px-2 py-1 sm:px-4 text-muted-foreground sm:table-cell">
                      {chart.givers[s].map(OWNER_ABBR).join(" ") || "—"}
                    </TableCell>
                    <TableCell className="px-2 py-1 sm:px-4 text-right tabular-nums">
                      {chart.trikona[s]}
                    </TableCell>
                    <TableCell className="px-2 py-1 sm:px-4 text-right tabular-nums font-medium">
                      {chart.reduced[s]}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
          <p className="mt-2 text-muted-foreground">
            Trikona shodhana <SourceLink source={src.trikona} /> · Ekadhipatya
            shodhana <SourceLink source={src.ekadhipatya} /> · Rasi pinda{" "}
            {chart.rashiPinda}, Graha pinda {chart.grahaPinda}, Yoga pinda{" "}
            {chart.yogaPinda} <SourceLink source={src.pinda} />
            {chart.owner !== "Lagna" && (
              <>
                {" "}
                · Signifies {SIGNIFICATION_TEXT[chart.owner]}{" "}
                <SourceLink source={src.significations} />
              </>
            )}
          </p>
        </div>
      )}

      <SectionTitle
        as="h4"
        className="mt-6"
        plain="Where Saturn's passage tests each matter"
        technical="Saturn's transit points (ch. 70)"
      />
      <ModeText
        plain={
          <>
            For each matter (father, mother, brothers and so on) the text
            derives one lunar mansion and one sign from the points; Saturn
            passing through them, or through the signs in trine to them, is the
            time that matter is tested.
          </>
        }
        practitioner={
          <>
            For each matter Parashara multiplies the rekhas of the house named
            by the owner's Yoga pinda; the remainder by 27 marks the nakshatra
            and by 12 the sign whose transit by Saturn, or by its trines, brings
            distress in that matter,{" "}
            <SourceLink
              source={{ label: "Parashara 70.7-44", url: BPHS_URL(70) }}
            />
            .
          </>
        }
      />
      <Table className="mt-2" data-testid="parashari-av-saturn">
        <TableHeader>
          <TableRow>
            <TableHead className="px-2 sm:px-4">Matter</TableHead>
            <TableHead className="hidden sm:table-cell">House read</TableHead>
            <TableHead className="px-2 sm:px-4">Nakshatra</TableHead>
            <TableHead className="px-2 sm:px-4">Sign</TableHead>
            <TableHead className="hidden px-2 sm:px-4 lg:table-cell">
              After reductions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {av.saturnPoints.map((s) => (
            <TableRow
              key={s.matter}
              data-testid={`parashari-av-saturn-${s.owner}`}
            >
              <TableCell className="px-2 py-1.5 sm:px-4 text-xs">
                <Soft>{s.matter}</Soft> <SourceLink source={s.source} />
              </TableCell>
              <TableCell className="hidden px-2 py-1.5 sm:px-4 text-xs text-muted-foreground sm:table-cell">
                {ord(s.houseFrom)} from {s.owner}: {SIGNS[s.signIndex]},{" "}
                {s.rekhas} rekhas × pinda{" "}
                {s.rekhas ? s.product / s.rekhas : "—"}
              </TableCell>
              <TableCell className="px-2 py-1.5 sm:px-4 text-xs">
                {NAKSHATRAS[s.nakshatraIndex]}
                <span className="block text-2xs text-muted-foreground">
                  trines{" "}
                  {s.trineNakshatras
                    .slice(1)
                    .map((n) => NAKSHATRAS[n])
                    .join(", ")}
                </span>
              </TableCell>
              <TableCell className="px-2 py-1.5 sm:px-4 text-xs">
                {SIGNS[s.transitSignIndex]}
                <span className="block text-2xs text-muted-foreground">
                  trines{" "}
                  {s.trineSigns
                    .slice(1)
                    .map((n) => SIGNS[n])
                    .join(", ")}
                </span>
              </TableCell>
              <TableCell className="hidden px-2 py-1.5 sm:px-4 text-xs text-muted-foreground lg:table-cell">
                {s.reduced.rekhas ? (
                  <>
                    {NAKSHATRAS[s.reduced.nakshatraIndex]},{" "}
                    {SIGNS[s.reduced.transitSignIndex]}
                    <span className="block text-2xs">
                      {s.reduced.rekhas} rekhas left
                    </span>
                  </>
                ) : (
                  "no rekhas left"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SectionTitle
        as="h4"
        className="mt-6"
        plain="What the totals say"
        technical="Readings from the aggregate (ch. 70-72)"
      />
      <p className="mt-1 text-2xs text-muted-foreground">
        The last column reads the same point from the figure left after the two
        reductions, which 70.28-29 names; the tradition uses the unreduced
        figure, so the column is provisional.
      </p>
      <ul
        className="mt-1 space-y-1 text-xs text-muted-foreground"
        data-testid="parashari-av-readings"
      >
        <li>
          {av.wealthYoga.text} <SourceLink source={src.wealth} />
        </li>
        <li data-testid="parashari-av-progeny">
          {av.progeny.text} <SourceLink source={src.progeny} />
        </li>
        <li>
          Life in thirds:{" "}
          {av.lifeThirds
            .map(
              (t) =>
                `${t.span} (${t.houses}) ${t.verdict}${t.benefics.length || t.malefics.length ? ` with ${[...t.benefics, ...t.malefics].map((p) => PLANET_ABBR[p]).join(", ")}` : ", no planets"}`,
            )
            .join("; ")}
          . <SourceLink source={src.thirds} />
        </li>
        {withheld ? (
          <li data-testid="parashari-av-years-gate">
            {SENSITIVE_WITHHELD_NOTE}
          </li>
        ) : (
          <>
            <li>
              Years of distress by Saturn's rekhas:{" "}
              {av.distressYears.lagnaToSaturn} (lagna to Saturn) and{" "}
              {av.distressYears.saturnToLagna} (Saturn to lagna); their sum{" "}
              {av.distressYears.lagnaToSaturn + av.distressYears.saturnToLagna}{" "}
              is the year to watch if an arishta dasa also runs.{" "}
              <SourceLink source={src.longevityYears} />
            </li>
            <li>
              Longevity by the rekha table, half the eight charts' spans:{" "}
              {av.ayurdaya.toFixed(1)} years. <SourceLink source={src.ayus} />
            </li>
          </>
        )}
        <li>
          Saturn's transit through signs with more rekhas in its own chart is
          favourable, through signs with more dots only evil (
          {av.charts
            .find((c) => c.owner === "Saturn")!
            .rekhas.map((r, i) => (r >= 5 ? SIGNS[i] : null))
            .filter(Boolean)
            .join(", ") || "no sign reaches five rekhas"}{" "}
          carry five or more).{" "}
          <SourceLink
            source={{ label: "Parashara 70.43-44", url: BPHS_URL(70) }}
          />
        </li>
      </ul>

      {/* Prasna Marga Ch. 32: applications of the same collective Ashtakavarga. */}
      <div className="mt-4 rounded-md border border-card-border p-3" data-testid="parashari-av-prasna">
        <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          Prasna Marga readings on the same points
        </p>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed">
          <li data-testid="prasna-av-vithaya">
            <Soft>{prasnaAv.vithaya.text}</Soft>{" "}
            <span className="text-muted-foreground">({prasnaAv.sources.vithaya})</span>
          </li>
          <li data-testid="prasna-av-theertha">
            <Soft>{prasnaAv.theertha.text}</Soft>{" "}
            <span className="text-muted-foreground">({prasnaAv.sources.theertha})</span>
          </li>
          <li data-testid="prasna-av-categories">
            <Soft>{prasnaAv.categories.text}</Soft>{" "}
            <span className="text-muted-foreground">({prasnaAv.sources.categories})</span>
          </li>
          <li data-testid="prasna-av-antarbhaga">
            <Soft>{prasnaAv.antarbhaga.text}</Soft>{" "}
            <span className="text-muted-foreground">({prasnaAv.sources.antarbhaga})</span>
          </li>
          <li data-testid="prasna-av-life-thirds">
            The happy third of life by the two groupings:{" "}
            {prasnaAv.lifeThirds
              .map((t) => `${t.span} ${t.total} (${t.method})`)
              .join(" · ")}
            .{" "}
            <span className="text-muted-foreground">({prasnaAv.sources.lifeThirds})</span>
          </li>
        </ul>
        <p className="mt-2 text-2xs text-muted-foreground">
          Each house's rekhas against its required minimum (32.63):{" "}
          {prasnaAv.minimums
            .filter((m) => !m.met)
            .map((m) => `the ${m.house}${m.house === 1 ? "st" : m.house === 2 ? "nd" : m.house === 3 ? "rd" : "th"} (${m.actual}/${m.required})`)
            .join(", ") || "every house meets its minimum"}
          .
        </p>
      </div>

      <Expander
        testId="parashari-av-caveats"
        label={HOW_COMPUTED}
        count={av.caveats.length}
        className="mt-2"
        contentClassName=""
      >
        <ul
          className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
          data-testid="parashari-av-caveat-list"
        >
          {av.caveats.map((c, i) => (
            <li key={i}><Soft>{c}</Soft></li>
          ))}
        </ul>
      </Expander>
    </div>
  );
}

const SIGNIFICATION_TEXT: Record<string, string> = {
  Sun: "soul, nature, physical strength, joys and sorrows, father",
  Moon: "mind, wisdom, joy, mother",
  Mars: "co-borns, strength, qualities, land",
  Mercury: "business dealings, livelihood, friends",
  Jupiter: "nourishment of the body, learning, children, wealth and property",
  Venus: "marriage, enjoyments, conveyance, relations with women",
  Saturn: "longevity, source of maintenance, grief, danger, losses, death",
};
