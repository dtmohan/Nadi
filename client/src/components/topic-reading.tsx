import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DateTime } from "luxon";
import type { ChartResult } from "@shared/schema";
import { describeEventMoment, EVENT_MATTERS, matterOf, sanitiseEvents, type ChartEvent, type EventOutcome } from "@shared/events";
import { eventReadingAllowed, natalEventEvidence } from "@shared/event-reading";
import { EVENT_TRANSIT_SCOPE } from "@shared/transit-context";
import { isDeceased } from "@shared/life-stage";
import { stagedObservation } from "@shared/parashari-comparison";
import { vargaTopicFor } from "@shared/parashari-varga-evidence";
import { manleyTopicFor } from "@shared/manley-evidence";
import { RAO_SOURCE } from "@shared/jaimini-areas";
import type { EventValidation } from "@shared/validate-types";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cite, SourceLink } from "@/components/source-link";
import { Soft } from "@/lib/gentle";
import { KpTransitEvidencePanel } from "@/components/kp-transit-evidence";
import { AuroraEventPanel, AuroraV2Panel } from "@/components/kp-aurora-evidence";
import { ParashariVargaEvidencePanel } from "@/components/parashari-varga-evidence";
import { ParashariPromisePanel } from "@/components/parashari-promise";
import { ParashariSpecificPanel } from "@/components/parashari-specific";
import { ManleyEvidencePanel } from "@/components/manley-evidence";
import { ParashariHierarchyEvent } from "@/components/parashari-hierarchy";

export type TopicReadingSystem = "kp" | "parashari" | "jaimini" | "bnn";

/** The chart-reading view asks the same one-event evaluator used by Validate. */
export function TopicReadingPanel({ result, system, onSelected }: {
  result: ChartResult;
  system: TopicReadingSystem;
  onSelected?: (event: ChartEvent | null) => void;
}) {
  const { chart } = result;
  const topics = useMemo(() => EVENT_MATTERS.filter((m) =>
    (system !== "parashari" || vargaTopicFor(m.id) || manleyTopicFor(m.id)) && eventReadingAllowed(m.id, result.utc, result.now.asOf, chart)),
  [system, result.utc, result.now.asOf, chart]);
  const natal = useMemo(() => system === "parashari" ? natalEventEvidence(result) : [], [system, result]);
  const [draft, setDraft] = useState<ChartEvent>(() => ({
    id: "chart-reading", matter: topics.find((m) => m.id === "marriage")?.id ?? topics[0]?.id ?? "education",
    date: isDeceased(chart, result.now.asOf) && chart.deathDate
      ? chart.deathDate : DateTime.fromISO(result.now.asOf, { setZone: true }).setZone(chart.timezone).toISODate()!,
  }));
  const [saved, setSaved] = useState("");
  const [shown, setShown] = useState<{ event: ChartEvent; reading: EventValidation } | null>(null);
  const selectedRef = useRef(onSelected);
  selectedRef.current = onSelected;
  const generation = useRef(0);
  const chartKey = JSON.stringify([chart.id, chart.birthDate, chart.birthTime, chart.timezone, chart.timeStandard,
    chart.latitude, chart.longitude, chart.ayanamsa, chart.nodeType, chart.gender, chart.deathDate, chart.events]);
  const savedEvents = sanitiseEvents(chart.events).filter((e) => topics.some((m) => m.id === e.matter));
  const read = useMutation({
    mutationFn: async ({ event }: { event: ChartEvent; generation: number }) => {
      const { id: _id, notes: _notes, events: _events, ...birth } = chart;
      return (await (await apiRequest("POST", "/api/topic-reading", { chart: { ...birth, events: [] }, event })).json()) as EventValidation;
    },
    onSuccess: (reading, input) => {
      if (input.generation === generation.current) { setShown({ event: input.event, reading }); selectedRef.current?.(input.event); }
    },
  });
  useEffect(() => {
    generation.current++;
    setShown(null);
    read.reset();
    setSaved("");
    setDraft((old) => {
      const matter = topics.some((m) => m.id === old.matter) ? old.matter : topics[0]?.id ?? "education";
      const lastDate = isDeceased(chart, result.now.asOf) ? chart.deathDate : null;
      const date = old.date < chart.birthDate ? chart.birthDate : lastDate && old.date > lastDate ? lastDate : old.date;
      return { ...old, matter, date, ...(matter !== old.matter ? { outcome: undefined } : {}) };
    });
    selectedRef.current?.(null);
    return () => { generation.current++; selectedRef.current?.(null); };
    // The signature covers every chart field and saved event used by this check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartKey]);
  const change = (event: ChartEvent, savedId = "") => {
    setDraft(event);
    setSaved(savedId);
    setShown(null);
    read.reset();
    onSelected?.(null);
  };
  const disabled = read.isPending;
  const stage = stagedObservation(shown?.reading.manley);

  return <section className="mt-6 max-w-4xl space-y-3" data-testid={`topic-reading-${system}`}>
    <div>
      <h2 className="text-lg font-semibold">Explore a matter and date</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose a saved event or investigate a possible date. This uses the same event conditions as Validate; a match does not mean the event happened or will happen. The chosen date is not saved.</p>
      <p className="mt-1 text-xs text-muted-foreground" data-testid="topic-transit-scope">{EVENT_TRANSIT_SCOPE}</p>
    </div>
    {system === "parashari" && natal.length > 0 && <details className="rounded-md border px-3 py-2 text-xs" data-testid="topic-reading-natal">
      <summary className="cursor-pointer font-medium">Natal foundations · D1 and the relevant divisional charts</summary>
      <p className="mt-2 text-muted-foreground">These are the same partial house factors used in the dated checks, before adding periods or transits. They use whole-sign houses, including when another house view is selected for the main reading.</p>
      {natal.map((e) => <ParashariVargaEvidencePanel key={e.matter} evidence={e} natalOnly />)}
    </details>}
    {topics.length === 0 ? <p className="text-sm text-muted-foreground">No supported matter is available in this reading.</p> : <form className="space-y-3 rounded-md border px-3 py-3" onSubmit={(e) => { e.preventDefault(); read.mutate({ event: draft, generation: generation.current }); }}>
      {savedEvents.length > 0 && <label className="block text-xs font-medium" htmlFor={`${system}-topic-saved`}>
        Saved event (optional)
        <select id={`${system}-topic-saved`} className="mt-1 block h-9 w-full rounded-md border bg-background px-2 text-sm" value={saved} disabled={disabled}
          onChange={(e) => {
            const selected = savedEvents.find((v) => v.id === e.target.value);
            if (selected) { const { note: _note, ...event } = selected; change(event, selected.id); }
            else { setSaved(""); setShown(null); read.reset(); onSelected?.(null); }
          }}>
          <option value="">Choose a date below</option>
          {savedEvents.map((e) => <option key={e.id} value={e.id}>{e.date} · {matterOf(e.matter).label}</option>)}
        </select>
      </label>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-medium" htmlFor={`${system}-topic-matter`}>Matter
          <select id={`${system}-topic-matter`} className="mt-1 block h-9 w-full rounded-md border bg-background px-2 text-sm" value={draft.matter} disabled={disabled}
            onChange={(e) => change({ ...draft, matter: e.target.value, outcome: undefined })}>
            {topics.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium" htmlFor={`${system}-topic-date`}>Date
          <Input id={`${system}-topic-date`} className="mt-1" type="date" value={draft.date} min={chart.birthDate}
            max={isDeceased(chart, result.now.asOf) ? chart.deathDate ?? undefined : undefined} disabled={disabled}
            onChange={(e) => change({ ...draft, date: e.target.value })} />
        </label>
        <label className="text-xs font-medium" htmlFor={`${system}-topic-time`}>Local time (optional)
          <Input id={`${system}-topic-time`} className="mt-1" type="time" value={draft.time ?? ""} disabled={disabled}
            onChange={(e) => change({ ...draft, time: e.target.value || undefined })} />
        </label>
        <label className="text-xs font-medium" htmlFor={`${system}-topic-zone`}>Time zone (optional)
          <Input id={`${system}-topic-zone`} className="mt-1" value={draft.timezone ?? ""} placeholder={chart.timezone} disabled={disabled}
            onChange={(e) => change({ ...draft, timezone: e.target.value || undefined })} />
        </label>
        <label className="text-xs font-medium" htmlFor={`${system}-topic-outcome`}>Outcome (optional)
          <select id={`${system}-topic-outcome`} className="mt-1 block h-9 w-full rounded-md border bg-background px-2 text-sm" value={draft.outcome ?? ""} disabled={disabled}
            onChange={(e) => change({ ...draft, outcome: (e.target.value || undefined) as EventOutcome | undefined })}>
            <option value="">Default for matter</option>
            <option value="favourable">Favourable</option>
            <option value="mixed">Mixed</option>
            <option value="unfavourable">Unfavourable</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Without a time, the check uses noon; without a zone, it uses {chart.timezone}.{draft.outcome ? ` Outcome used: ${draft.outcome}.` : " The matter's default outcome applies where needed."}</p>
      <Button type="submit" size="sm" disabled={disabled || !draft.date}>{disabled ? "Checking…" : "Check this date"}</Button>
      {read.isError && <p role="alert" className="text-xs text-destructive">{read.error instanceof Error ? read.error.message : "Could not check this date."}</p>}
    </form>}
    {shown && <div className="space-y-2 rounded-md border px-3 py-3 text-xs" data-testid={`topic-reading-result-${system}`}>
      <p className="font-medium">{shown.reading.label} · {shown.reading.date} · {describeEventMoment(shown.event, chart.timezone)}</p>
      {system === "parashari" && <>
        <p className="text-muted-foreground">The natal, period-lord and event-specific transit observations below come from the same Parashari checks as Validate. Favourable-event checks describe that scenario; they do not predict the outcome. The points are experimental app conventions; the staged links are a partial check.</p>
        {shown.reading.parashariVargas && <ParashariVargaEvidencePanel evidence={shown.reading.parashariVargas} />}
        {shown.reading.parashariPromise && <ParashariPromisePanel check={shown.reading.parashariPromise} />}
        {shown.reading.parashariSpecific && <ParashariSpecificPanel check={shown.reading.parashariSpecific} />}
        {shown.reading.parashariDivisional && <ParashariSpecificPanel check={shown.reading.parashariDivisional} />}
        {shown.reading.parashariVargas && !shown.reading.parashariPromise && <p className="text-muted-foreground">The favourable-event score is not applied to this matter or recorded outcome. The displayed placements remain descriptive and do not decide the outcome.</p>}
        {stage && <p data-testid="topic-reading-stage" className="rounded border px-2 py-2 text-muted-foreground">Earlier divisional-only experiment: {stage.first ? "both initial links found" : "unresolved"}. Third period: {stage.first ? (stage.third ? "a primary link was found" : "unresolved") : "blocked by the earlier stage"}. This older experiment does not require D1 and is retained for comparison with previous research.</p>}
        {shown.reading.parashariHierarchy && <ParashariHierarchyEvent event={shown.reading.parashariHierarchy} />}
        {shown.reading.manley && <ManleyEvidencePanel evidence={shown.reading.manley} />}
        {!shown.reading.parashariVargas && !shown.reading.manley && <p>No Parashari rule in this subset covers the selected matter.</p>}
      </>}
      {system === "kp" && <>
        <p className="text-muted-foreground">This is Validate's four-step event check, even if the timing window above uses the optional six-step view. The cusp and period matches are a limited check alongside the fuller cusp rules.</p>
        <p>Cusp {shown.reading.cusp} sub lord {shown.reading.kp.cuspSubLord} signifies {shown.reading.kp.cuspSignified.join(", ") || "none of the selected houses"}; matter houses {shown.reading.houses.join(", ")}.</p>
        {shown.reading.kp.deniedAtCusp && <p className="text-muted-foreground">The app's twelfth-from-cusp condition is also present. This limited filter is not proof that an event cannot occur.</p>}
        <p>{(["dasa", "bhukti", "antara"] as const).map((level, i) => `${level} ${shown.reading.kp[level]}: ${shown.reading.kp.signified[i].join(", ") || "no selected house"}`).join(" · ")}.</p>
        <details className="rounded border px-2 py-2"><summary className="cursor-pointer font-medium">Cusp filters and the two period-lord transits</summary>
          {(["dasa", "bhukti", "antara"] as const).map((level, i) => <p key={level} className="mt-1">{level} {shown.reading.kp[level]}: {shown.reading.kp.filtered[i].length ? shown.reading.kp.filtered[i].map((f) => `house ${f.house} via cusp sub lord ${f.cuspSubLord}: ${f.denied ? "denied in this filter" : f.kept ? "kept" : "directed elsewhere"}`).join("; ") : "no selected house to filter"}.</p>)}
          {(["dasa", "bhukti"] as const).map((level) => { const t = shown.reading.kp.transit[level]; return <p key={level} className="mt-1">{level} {t.planet} in the sign, star and sub of {t.signLord}, {t.starLord}, {t.subLord}; matter-house links {t.hits.map((hit) => hit ? "yes" : "no").join(" / ")}.</p>; })}
          <p className="mt-1">Sun / Moon linked to a running period lord on this date: {shown.reading.kp.transit.luminary.sun ? "yes" : "no"} / {shown.reading.kp.transit.luminary.moon ? "yes" : "no"}. This is descriptive, not an extra score.</p>
        </details>
        <p>Period-lord transit points: {shown.reading.kp.transit.score}/{shown.reading.kp.transit.max}. The broader sky below is descriptive and is not added to that total.</p>
        {shown.reading.kp.aurora && <AuroraEventPanel evidence={shown.reading.kp.aurora} label={shown.reading.label} />}
        {shown.reading.kp.auroraV2 && <AuroraV2Panel evidence={shown.reading.kp.auroraV2} label={shown.reading.label} />}
        {shown.reading.kp.transit.evidence && <KpTransitEvidencePanel label={shown.reading.label} date={shown.reading.date}
          when={describeEventMoment(shown.event, chart.timezone)} evidence={shown.reading.kp.transit.evidence} />}
      </>}
      {system === "jaimini" && (shown.reading.jaimini ? <>
        <p className="text-muted-foreground">Validate maps this matter to Jaimini's {shown.reading.jaimini.area} area and uses its Chara dasha checks. That broad area mapping and the count are app conventions; they are not an event-specific forecast. <SourceLink source={RAO_SOURCE} /></p>
        <p>Main period: {shown.reading.jaimini.mdSignName} · <Soft>{shown.reading.jaimini.md.triggers.join("; ") || "no listed trigger"}</Soft>.</p>
        <p>Subperiod: {shown.reading.jaimini.adSignName} · <Soft>{shown.reading.jaimini.ad.triggers.join("; ") || "no listed trigger"}</Soft>.</p>
        <p>Partial area links: {shown.reading.jaimini.score}/{shown.reading.jaimini.max}.</p>
      </> : <p>No Jaimini event-area check is available for this matter and date in this reading.</p>)}
      {system === "bnn" && <>
        <p className="text-muted-foreground">Validate maps this matter to the Nadi {matterOf(shown.reading.matter).bnn.area} area and uses the same natal findings and Jupiter/Saturn timing observations. The mapping and combined count are app conventions, not a forecast. <Cite>R.G. Rao, Bhrigu Nandi Nadi</Cite></p>
        <p>Jupiter in {shown.reading.bnn.jupiterSign}; Saturn in {shown.reading.bnn.saturnSign}; matter significators: {shown.reading.bnn.karakas.join(", ")}.</p>
        <p>Jupiter contact: {shown.reading.bnn.jupiter ? `${shown.reading.bnn.jupiter.contact} ${shown.reading.bnn.jupiter.planet}` : "none listed"}; Saturn contact: {shown.reading.bnn.saturn ? `${shown.reading.bnn.saturn.contact} ${shown.reading.bnn.saturn.planet}` : "none listed"}; both contact the same significator: {shown.reading.bnn.double ? "yes" : "no"}.</p>
        <p>Jupiter's count from natal Jeeva: {shown.reading.bnn.fromJeeva}{shown.reading.bnn.fromDeha !== null ? `; from natal Deha: ${shown.reading.bnn.fromDeha}` : ""}; listed count match: {shown.reading.bnn.progression ? "yes" : "no"}. Partial timing points: {shown.reading.bnn.score}/{shown.reading.bnn.max}.</p>
        {shown.reading.bnn.combination && <p>Related natal rule: <Soft>{shown.reading.bnn.combination}</Soft>{(() => {
          const finding = result.reading.findings.find((f) => f.text === shown.reading.bnn.combination);
          return finding ? <> · {finding.ruleId}{finding.source && <> · <Cite>{finding.source}</Cite></>}</> : null;
        })()}</p>}
      </>}
    </div>}
  </section>;
}
