import type { MouseEventHandler } from "react";
import { DateTime } from "luxon";
import { AYANAMSAS, type ChartResult } from "@shared/schema";
import { SIGNS, type Planet } from "@shared/astro";
import { SouthIndianChart } from "@/components/south-indian-chart";
import { useLocale, useT } from "@/lib/i18n";
import { chartReferenceFrame, referenceDegree } from "@/lib/chart-reference";

/** A factual D1 reference; no prediction or school verdict is created here. */
export function ReferenceChart({ result, mode, selected, onSelect, showTransits, onToggleTransits, instance, onEnlarge }: {
  result: ChartResult;
  mode: string;
  selected: Planet | null;
  onSelect: (planet: Planet | null) => void;
  showTransits: boolean;
  onToggleTransits: () => void;
  instance: "rail" | "dialog";
  onEnlarge?: MouseEventHandler<HTMLButtonElement>;
}) {
  const t = useT();
  const { locale } = useLocale();
  const frame = chartReferenceFrame(result, mode);
  if (!frame) return <p className="text-sm text-muted-foreground" role="status">{t("Birth chart reference is unavailable for this reading.")}</p>;

  const chosen = frame.positions.find((p) => p.planet === selected);
  const ayanamsa = frame.kind === "kp" ? "Krishnamurti (KP)" :
    AYANAMSAS.find((a) => a.id === result.chart.ayanamsa)?.label ?? result.chart.ayanamsa;
  const instant = DateTime.fromISO(frame.transitAsOf, { setZone: true }).setZone(result.chart.timezone || "UTC").setLocale(locale === "ml" ? "ml-IN" : "en");
  const asOf = instant.isValid ? instant.toFormat("d LLL yyyy, HH:mm ZZZZ") : frame.transitAsOf;
  const selectId = `reference-planet-${instance}`;

  return <section data-testid={`reference-chart-${instance}`} data-frame={frame.kind} className="space-y-3">
    {instance === "rail" && <h2 className="font-display text-base font-semibold">{t("Birth chart reference")}</h2>}
    <p className="text-xs leading-relaxed text-muted-foreground">{t("Birth positions")} · {t(ayanamsa)}</p>
    <div className={instance === "dialog" ? "mx-auto w-full max-w-[26rem]" : undefined}>
    <SouthIndianChart
      positions={frame.positions}
      transit={showTransits ? frame.transits : []}
      lagnaSign={frame.risingSign}
      highlightSign={chosen?.signIndex ?? null}
      accent={[]}
      layout={frame.kind === "kp" ? "south" : undefined}
      showHouseNumbers={false}
      compactPlanets={instance === "rail"}
      ariaLabel={t("Birth positions by sign")}
      title="D1"
      footer={t("Birth positions")}
    />
    </div>
    {onEnlarge && <button type="button" aria-haspopup="dialog" onClick={onEnlarge} className="min-h-11 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" data-testid="reference-enlarge">{t("Open full chart")}</button>}
    <p className="text-sm"><strong>{t("Rising sign")}:</strong> {t(SIGNS[frame.risingSign])}</p>
    <p className="text-xs leading-relaxed text-muted-foreground">{t("As marks the rising sign. R means a planet appeared to move backward in the sky.")}</p>
    <p className="text-xs leading-relaxed text-muted-foreground">{t("This is the birth chart at the entered time, not a divisional, event or question chart.")}</p>
    {mode === "bnn" && <p className="text-xs leading-relaxed text-muted-foreground">{t("Nadi reads planets by sign. The birth rising sign is marked for orientation, not used as an input to that reading.")}</p>}
    {mode === "alp" && <p className="text-xs leading-relaxed text-muted-foreground">{t("This reference marks the birth rising sign. ALP's moving rising point is shown in its own reading.")}</p>}
    {(mode === "rectify" || mode === "validate") && <p className="text-xs leading-relaxed text-muted-foreground">{t("Candidate times and event-date skies are shown in their own tools; this reference keeps the entered birth time.")}</p>}
    {frame.kind === "kp" && <p className="text-xs leading-relaxed text-muted-foreground" data-testid={`reference-kp-note-${instance}`}>{t("KP uses its own ayanamsa and Placidus cusps. This sign chart does not show cusps or assign planets to KP houses.")} {t("A cusp is the point where a KP house begins.")}</p>}
    {frame.kind === "kp" && <p className="text-xs leading-relaxed text-muted-foreground">{t("The KP reference uses a South Indian sign grid so it cannot be mistaken for a Placidus house chart.")}</p>}
    {(result.chart.timeUncertaintyMin ?? 0) > 0 && <p className="text-xs leading-relaxed text-muted-foreground">{locale === "ml"
      ? `നൽകിയ ജനനസമയത്തിൽ ±${result.chart.timeUncertaintyMin} മിനിറ്റിന്റെ അനിശ്ചിതത്വമുണ്ട്; ചില സ്ഥാനങ്ങൾ മാറാം.`
      : `The entered birth time has an uncertainty of ±${result.chart.timeUncertaintyMin} minutes; some positions may change.`}</p>}

    <div>
      <label htmlFor={selectId} className="text-sm font-medium">{t("Explore a planet")}</label>
      <select id={selectId} value={selected ?? ""} onChange={(event) => onSelect((event.target.value || null) as Planet | null)}
        className="mt-1 min-h-11 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        data-testid={`reference-planet-select-${instance}`}>
        <option value="">{t("Choose a planet")}</option>
        {frame.positions.map((p) => <option key={p.planet} value={p.planet}>{t(p.planet)}</option>)}
      </select>
      <div aria-live="polite" className="mt-2 text-sm leading-relaxed" data-testid={`reference-selected-${instance}`}>
        {chosen ? locale === "ml"
          ? `ജനനസമയത്തെ ${t(chosen.planet)} സ്ഥാനം — രാശി: ${t(chosen.sign)}; അംശം: ${referenceDegree(chosen.lon)}; നക്ഷത്രം: ${t(chosen.nakshatra)}; പാദം: ${chosen.pada}; നക്ഷത്രാധിപൻ: ${t(chosen.nakshatraLord)}.`
          : `At birth, ${chosen.planet} was in ${chosen.sign} at ${referenceDegree(chosen.lon)}, in the star section ${chosen.nakshatra}, quarter ${chosen.pada}. Its traditional star ruler is ${chosen.nakshatraLord}.`
          : t("Choose a planet to highlight its birth sign and see its position.")}
      </div>
    </div>

    <button type="button" aria-pressed={showTransits} onClick={onToggleTransits}
      className="min-h-11 rounded-md border px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      data-testid={`reference-transits-${instance}`}>
      {t(showTransits ? "Hide Jupiter and Saturn in the sky snapshot" : "Show Jupiter and Saturn in the sky snapshot")}
    </button>
    {showTransits && <div className="text-xs leading-relaxed text-muted-foreground" data-testid={`reference-sky-${instance}`}>
      <p>{t("Sky snapshot")}: {asOf}</p>
      <p>{frame.transits.map((p) => `${t(p.planet)}: ${t(p.sign)} ${referenceDegree(p.lon)}`).join(" · ")}</p>
      <p>{t("tJu and tSa mark these sky positions; the other symbols are birth positions.")}</p>
    </div>}

    <details className="rounded-md border px-3 py-2" data-testid={`reference-positions-${instance}`}>
      <summary className="cursor-pointer text-sm font-medium">{t("All birth positions")}</summary>
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">{t("Birth positions by sign")}</caption>
        <thead><tr><th scope="col" className="py-1 pr-3">{t("Planet")}</th><th scope="col" className="py-1">{t("Birth position")}</th></tr></thead>
        <tbody>{frame.positions.map((p) => <tr key={p.planet} className="border-t"><th scope="row" className="py-1.5 pr-3 font-medium">{t(p.planet)}</th><td className="py-1.5">{t(p.sign)} {referenceDegree(p.lon)}{p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? ` · ${t("retrograde")}` : ""}</td></tr>)}</tbody>
      </table>
    </details>
  </section>;
}
