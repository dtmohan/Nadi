import {
  isDeceased,
  lifeAsOf,
  sensitiveGate,
  redactSensitive,
  redactProse,
  SENSITIVE_WITHHELD_NOTE,
} from "@shared/life-stage";
import { GentleNote, Soft } from "@/lib/gentle";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { PLANET_ABBR, SIGNS, SIGN_LORD, type Planet } from "@shared/astro";
import {
  computeParashari,
  ord,
  listH,
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
import { AVASTHA_CH, type AvasthaResult } from "@shared/parashari-avasthas";
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
import { VerdictCard, type VerdictSignature } from "@/components/verdict-card";
import { gist, firstClause } from "@shared/synthesis";
import { AvTimelineSection } from "@/components/av-timeline";
import { readFatherArishta } from "@shared/father-arishta";
import { readMotherPoint } from "@shared/mother-point";
import { readKinTransits } from "@shared/kin-transits";
import { KinTransitsSection } from "@/components/kin-transits";
import { computeVargas, type SpouseReading } from "@shared/vargas";
import { VargasSection } from "@/components/vargas";
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
import { SarvarthaSection } from "@/components/sarvartha-section";
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
  useNowLabel,
} from "@/components/mode-text";
import { Working } from "@/components/working";
import { BjCrossSection, BjCross } from "@/components/bj-cross";
import { BJ_CROSS_BY_KEY } from "@shared/bj-cross";
import { Term } from "@/components/term";

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

function Finding({ f }: { f: ParashariFinding }) {
  return (
    <div
      className={cn(
        "rounded-md border border-l-4 bg-card p-3",
        TONE_CLASS[f.tone],
      )}
      data-testid={`parashari-finding-${f.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{f.title}</span>
        <span className="flex gap-1">
          {f.planets.map((p) => (
            <PlanetName key={p} planet={p} abbr tone className="text-xs" />
          ))}
        </span>
        {f.source.provisional && (
          <Badge variant="outline" className="text-2xs">
            provisional
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        <Soft>{f.text}</Soft>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        <SourceLink source={f.source} mark={false} />
      </p>
    </div>
  );
}

export function ParashariPanel({ result }: { result: ChartResult }) {
  const { positions, chart } = result;
  // Everything "current" is read at the reading date, or at the recorded date of passing: after a
  // death date nothing here is a forecast, and the running dasa is the one that was running then.
  const asOfIso = lifeAsOf(chart, result.now.asOf);
  const [aspectFloor, setAspectFloor] =
    useState<AspectFloor>(DEFAULT_ASPECT_FLOOR);
  // The sensitive-content gate comes from the server; older cached results fall back to the same rule computed here.
  const withheld =
    result.sensitive?.withheld ??
    sensitiveGate(chart, result.utc, asOfIso).withheld;
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
  const vargas = useMemo(
    () => computeVargas(positions, result.jaimini.lagna.lon),
    [positions, result.jaimini.lagna.lon],
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
  const [focusHouse, setFocusHouse] = useState<number | null>(null);
  const [section, setSection] = useState<
    "lords" | "yogas" | "houses" | "evils" | "timing"
  >("yogas");
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
  const cur = r.dashas.find((d) => d.current);
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

  return (
    <div data-testid="parashari-panel">
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

      <ParashariVerdict r={r} cur={cur} yogas={yogas} spouse={vargas.spouse} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:overflow-y-auto lg:pr-1">
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

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="tablist"
            aria-label="Parashari section"
            className="inline-flex flex-wrap rounded-md border p-0.5 text-sm"
          >
            <button
              role="tab"
              aria-selected={section === "yogas"}
              onClick={() => setSection("yogas")}
              className={cn(
                "rounded px-3 py-1",
                section === "yogas"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-testid="parashari-section-yogas"
            >
              {plain ? "Notable combinations" : "Yogas and combinations"} (
              {yogas.length})
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
            <button
              role="tab"
              aria-selected={section === "houses"}
              onClick={() => setSection("houses")}
              className={cn(
                "rounded px-3 py-1",
                section === "houses"
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
              aria-selected={section === "evils"}
              onClick={() => setSection("evils")}
              className={cn(
                "rounded px-3 py-1",
                section === "evils"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-testid="parashari-section-evils"
            >
              {plain
                ? "Early trials, remedies and past-life debts"
                : "Evils, antidotes and curses (ch. 9-10, 83)"}{" "}
              ({evils.length})
            </button>
            <button
              role="tab"
              aria-selected={section === "timing"}
              onClick={() => setSection("timing")}
              className={cn(
                "rounded px-3 py-1",
                section === "timing"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-testid="parashari-section-timing"
            >
              {plain
                ? "When things happen"
                : "Timing (dasas, chakras, transits)"}
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

        {section === "yogas" && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {yogas.map((f) => (
              <Finding key={f.id} f={f} />
            ))}
            <p className="text-xs text-muted-foreground md:col-span-2">
              {YOGA_CAVEATS.join(" ")} {ROYAL_CAVEATS.join(" ")}{" "}
              {FATHER_YOGA_CAVEATS.join(" ")} Kendra-trikona and node
              yogakarakas are from chapter 34, Neechabhanga from Phaladeepika 7,
              the raja yogas from debility from chapter 39 and the wealth and
              penury verses from chapters 41-42.
            </p>
          </div>
        )}
        {section === "evils" && (
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
        {section === "houses" && (
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
                        j.support.join("; ")
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 align-top text-xs">
                      {j.strain.length ? (
                        j.strain.join("; ")
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 align-top text-xs text-muted-foreground">
                      {(() => {
                        const fs =
                          result.sarvartha?.findings.filter(
                            (f) => f.house === j.house,
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
                                {f.text}
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
              <SourceLink source={BHAVA_JUDGEMENT_SOURCE} mark={false} />.{" "}
              {BHAVA_JUDGEMENT_CAVEATS.join(" ")}
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
              <p className="text-xs text-muted-foreground md:col-span-2">
                {HOUSE_CAVEATS.join(" ")} Verses on the loss of children,
                co-born, spouse or father are shown in Parashara's sense but
                worded plainly; weigh them against the supporting verses and the
                strength pass before reading them as outcomes.{" "}
                {NODES_CAVEATS.join(" ")}
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
                ? "The qualifier in each card uses the Shadbala below: full at or above the requirement of 27.32-33, half from three quarters of it, a quarter below that; the thresholds for half and quarter are not stated in the text."
                : "Strength (Shadbala) needs a recomputed chart; open the chart again to fetch it."}
            </p>
          </div>
        )}
        {section === "timing" && (
          <div data-testid="parashari-timing">
            <p className="mt-3 text-xs text-muted-foreground">
              {plain
                ? "Parashara's clocks for this chart, all read from the same birth positions: the three-ring wheel turning year by year, the life periods and their sub-periods, the sign-based and Kalachakra periods, Varahamihira's planetary years, and the transits scored against the points tables."
                : "The Parashari timing methods, read from the same natal positions: Sudarshana chakra (ch. 74), Vimshottari with antar dasas (ch. 46-60), the conditional and rasi dasas, Kalachakra (ch. 46, 50), Brihat Jataka 8, and the Ashtakavarga transits (ch. 66-72). Gochara from the Moon stays in the Panchanga tab, being Brihat Samhita and Phaladeepika, not Parashara."}
            </p>
            <div className="mt-3" data-testid="parashari-sudarshana">
              <SudarshanaSection s={sudarshana} events={sudarshanaEvents} />
            </div>
            <div className="mt-8">
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
                          {roleLabel(d.functional, r.withheld)}
                        </span>
                        {d.summary}
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
                  Running now: {cur.lord} dasa,{" "}
                  {cur.owns.length
                    ? `lord of the ${listH(cur.owns)}`
                    : "a node"}{" "}
                  in the {ord(cur.house)}.
                </p>
              )}
            </div>
            {selDasa && (
              <DasaEffects
                d={selDasa}
                open={antarOpen}
                setOpen={setAntarOpen}
                birthIso={result.utc}
                asOfIso={asOfIso}
                withheld={withheld}
              />
            )}
            <ConditionalDasasSection cd={r.conditionalDasas} />
            <RasiDasasSection d={r.rasiDasas} />

            <KalachakraSection k={r.kalachakra} />
            {!withheld && (
              <Working
                id="parashari-bj-dasa"
                label="Show the planetary-year dasas (Brihat Jataka 8)"
                className="mt-8"
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
        )}
      </div>

      {r.shadbala && (
        <Working
          id="parashari-shadbala"
          label="Show how strong each planet is (Shadbala)"
          className="mt-8"
        >
          <ShadbalaSection
            sb={r.shadbala}
            open={balaOpen}
            setOpen={setBalaOpen}
            phala={r.bhavaPhala}
            varga={r.vargaPhala}
          />
        </Working>
      )}
      <VargasSection v={vargas} name={chart.name} />
      <Working
        id="parashari-portions"
        label="Show where each planet stands within its sign (hora, decanate, trimsamsa)"
        className="mt-8"
      >
        <PortionsSection r={portions} />
      </Working>
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
      <Working
        id="parashari-ashtakavarga"
        label="Show the sign-by-sign points table (Ashtakavarga)"
        className="mt-8"
      >
        <AshtakavargaSection
          av={r.ashtakavarga}
          lagnaIdx={r.lagna.signIndex}
          withheld={withheld}
        />
      </Working>
      <Working
        id="parashari-karmajiva"
        label="Show where the living comes from (Brihat Jataka 10)"
        className="mt-8"
      >
        <KarmajivaSection k={karmajiva} />
      </Working>
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
      <Working
        id="parashari-bj-cross"
        label="Show the cross-check of the ground rules with Brihat Jataka 1-2"
        className="mt-8"
      >
        <BjCrossSection />
      </Working>

      <PadasSection p={r.padas} />
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
      <AvasthasSection a={r.avasthas} />
      <SarvarthaSection sarvartha={result.sarvartha} />
    </div>
  );
}

function KalachakraSection({ k }: { k: KalachakraResult }) {
  const plain = usePlain();
  const curIdx = k.periods.findIndex((p) => p.current);
  const [pick, setPick] = useState<number>(curIdx >= 0 ? curIdx : 0);
  const [caveats, setCaveats] = useState(false);
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
      <button
        type="button"
        onClick={() => setCaveats((v) => !v)}
        className="mt-3 text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
        data-testid="kalachakra-caveats-toggle"
      >
        {caveats ? "Hide" : "Show"} how this is computed
      </button>
      {caveats && (
        <p className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {k.caveats.join(" ")}
        </p>
      )}
    </div>
  );
}

function PadasSection({ p }: { p: PadaResult }) {
  const plain = usePlain();
  const [caveats, setCaveats] = useState(false);
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
            here are rasi drishti. Findings are kept out of the synthesis above.
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
      <button
        type="button"
        onClick={() => setCaveats((v) => !v)}
        className="mt-3 text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
        data-testid="padas-caveats-toggle"
      >
        {caveats ? "Hide" : "Show"} how this is computed
      </button>
      {caveats && (
        <div className="mt-2 space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {p.caveats.map((c, i) => (
            <p key={i}>{c}</p>
          ))}
        </div>
      )}
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
  const [caveats, setCaveats] = useState(false);
  const [written, setWritten] = useState(false);
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
                  <span className="text-muted-foreground">
                    (paired with a {s.span} life)
                  </span>
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
          <button
            type="button"
            onClick={() => setWritten((v) => !v)}
            className="mt-3 text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
            data-testid="marakas-written-toggle"
          >
            {written ? "Hide" : "Show"} the 3rd and 8th house verses on the
            manner of the end (44.25-37), shown as written
          </button>
          {written && (
            <div
              className="mt-2 grid gap-2 sm:grid-cols-2"
              data-testid="marakas-written"
            >
              {m.asWritten.map((f) => (
                <Finding key={f.id} f={f} />
              ))}
            </div>
          )}
        </>
      ) : null}
      <button
        type="button"
        onClick={() => setCaveats((v) => !v)}
        className="mt-3 block text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
        data-testid="marakas-caveats-toggle"
      >
        {caveats ? "Hide" : "Show"} how this is computed
      </button>
      {caveats && (
        <div className="mt-2 space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {m.caveats.map((c, i) => (
            <p key={i}>{c}</p>
          ))}
        </div>
      )}
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
  const [caveats, setCaveats] = useState(false);
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
            strength, which is shown under each reading.
          </>
        }
        practitioner={
          <>
            Baladi 45.3-4, Jagradadi 45.5-6, Deeptadi 45.7-10, Lajjitadi
            45.11-29 and Sayanadi 45.30-155. Relations by 3.55-58; aspect is
            graha drishti; ghatis from the computed sunrise. The Sayanadi state
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
                      {x.sayanadi.effect}{" "}
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
      {a.findings.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {a.findings.map((f) => (
            <Finding key={f.id} f={f} />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setCaveats((v) => !v)}
        className="mt-3 text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
        data-testid="avasthas-caveats-toggle"
      >
        {caveats ? "Hide" : "Show"} how this is computed
      </button>
      {caveats && (
        <div className="mt-2 space-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {a.caveats.map((c, i) => (
            <p key={i}>{c}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function RasiDasasSection({ d }: { d: RasiDasasResult }) {
  const plain = usePlain();
  const [pick, setPick] = useState<string>("chara");
  const [openPeriod, setOpenPeriod] = useState<number | null>(null);
  const [showYears, setShowYears] = useState(false);
  const [caveats, setCaveats] = useState(false);
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
      <div className="mt-3 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setShowYears((v) => !v)}
          className="underline decoration-dotted underline-offset-2"
          data-testid="rasi-dasa-years-toggle"
        >
          {showYears ? "Hide" : "Show"} the Chara years of each sign and the
          Brahma planet
        </button>
        <button
          type="button"
          onClick={() => setCaveats((v) => !v)}
          className="underline decoration-dotted underline-offset-2"
          data-testid="rasi-dasa-caveats-toggle"
        >
          {caveats ? "Hide" : "Show"} how these are computed
        </button>
      </div>
      {showYears && (
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
      )}
      {caveats && (
        <div className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <p>{d.caveats.join(" ")}</p>
          <p className="mt-1">{d.notComputed.join(" ")}</p>
        </div>
      )}
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
  const [showRest, setShowRest] = useState(false);
  const [caveats, setCaveats] = useState(false);
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
          <button
            type="button"
            onClick={() => setShowRest((v) => !v)}
            className="underline decoration-dotted underline-offset-2"
            data-testid="conditional-dasa-rest-toggle"
          >
            {showRest ? "Hide" : "Show"} the {rest.length} systems whose
            condition does not hold
          </button>
          {showRest && (
            <ul className="mt-2 space-y-1">
              {rest.map((s) => (
                <li key={s.id} data-testid={`conditional-dasa-rest-${s.id}`}>
                  {s.name}: {s.condition} (46.{s.verses}). {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setCaveats((v) => !v)}
        className="mt-3 text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
        data-testid="conditional-dasa-caveats-toggle"
      >
        {caveats ? "Hide" : "Show"} how these are computed
      </button>
      {caveats && (
        <p className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {cd.caveats.join(" ")}
        </p>
      )}
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
}: {
  r: ReturnType<typeof computeParashari>;
  cur: DashaGloss | undefined;
  yogas: ParashariFinding[];
  spouse: SpouseReading;
}) {
  const nowLabel = useNowLabel();
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
                    {cur.lord} period, {fmt(cur.start)} to {fmt(cur.end)}; for
                    this rising sign {cur.lord} is{" "}
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
}: {
  sb: ShadbalaResult;
  open: string | null;
  setOpen: (k: string | null) => void;
  phala?: BhavaPhala[];
  varga?: VargaPhala[];
}) {
  const [caveats, setCaveats] = useState(false);
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
      <button
        className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
        onClick={() => setCaveats((v) => !v)}
        data-testid="parashari-shadbala-caveats"
      >
        {caveats ? "Hide" : "Show"} how the chapters were applied (
        {allCaveats.length} notes)
      </button>
      {caveats && (
        <ul
          className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
          data-testid="parashari-shadbala-caveat-list"
        >
          {allCaveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
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
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {LAYER_LABEL[n.layer]} · <SourceLink source={n.source} />
      </p>
    </li>
  );
}

function DasaEffects({
  d,
  open,
  setOpen,
  birthIso,
  asOfIso,
  withheld,
}: {
  d: DasaReading;
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
  return (
    <div className="mt-8" data-testid="parashari-dasa-effects">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">
          <PlanetName planet={d.lord} /> {plainDE ? "period" : "dasa"},{" "}
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
            {d.lord} placed as it is here, judged by the house it stands in, its
            strength, its leaning towards good or ill, and where it was moving
            when the period began. Every matching line is listed, favourable and
            unfavourable alike, so you can see where they pull against each
            other.
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
      <p
        className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        data-testid="parashari-dasa-timing"
      >
        <Soft>{d.timing.text}</Soft> <SourceLink source={d.timing.source} />
      </p>
      <ul className="mt-3 space-y-2">
        {layers
          .flatMap((l) => d.notes.filter((n) => n.layer === l))
          .map((n) => (
            <Note key={n.id} n={n} />
          ))}
      </ul>

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
                Each sub-period divides again into nine shorter spells, weeks to
                months long. The text gives only general effects for these, and
                adds that the ill ones do not follow when the spell's planet is
                well placed. Select one to divide it further.
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

      <div data-testid="parashari-sookshmas-heading">
        <SectionTitle
          as="h4"
          className="mt-6"
          plain={`Fourth-level spells within ${dasaLord}–${antarLord}–${pratyantar.lord}`}
          technical={`Sookshma dasas in the ${dasaLord}–${antarLord}–${pratyantar.lord} pratyantar`}
        />
      </div>
      <ModeText
        plain={
          <>
            Days-long spells, each planet's share in proportion to its period
            length. General effects only. Select one to divide it into hours.
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
              plain={`Hours-long spells within the ${sookshma.lord} spell, ${fmtD(sookshma.start)} to ${fmtD(sookshma.end)}`}
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
    </>
  );
}

function Facts({ a }: { a: AntarReading }) {
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
        <span className="text-verdict-bad">{a.facts.maraka}</span>
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
          "cursor-pointer",
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
  const [caveats, setCaveats] = useState(false);
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

      <button
        className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
        onClick={() => setCaveats((v) => !v)}
        data-testid="parashari-av-caveats"
      >
        {caveats ? "Hide" : "Show"} how the chapters were applied (
        {av.caveats.length} notes)
      </button>
      {caveats && (
        <ul
          className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"
          data-testid="parashari-av-caveat-list"
        >
          {av.caveats.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
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
