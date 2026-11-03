import { SIGNS } from "@shared/astro";
import { MANLEY_SOURCE } from "@shared/manley-evidence";
import type { RectifyResult } from "@shared/rectify-types";
import { Cite } from "@/components/source-link";

const SUBJECT: Record<string, string> = {
  D1: "birth chart", D4: "home and moves", D7: "children", D9: "marriage",
  D10: "career", D24: "education", D60: "general indications",
};

/** Show the intervals without deciding which ascendant is correct. */
export function VargaWindowsPanel({ rows, birthDate }: { rows: NonNullable<RectifyResult["vargaWindows"]>; birthDate: string }) {
  const display = (time: string, iso: string, civilDate?: string) => {
    const date = civilDate ?? iso.slice(0, 10);
    return date === birthDate ? time : `${date} ${time}`;
  };
  return <details className="nadi-info-disclosure mt-3" data-testid="manley-varga-windows">
    <summary className="nadi-info-summary">Divisional ascendant windows · D1 to D60</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>These show where each ascendant changes within the scanned window, following the sequence in Manley's book. They do not select or confirm a birth time. Planetary divisional positions and period lords can also change within one ascendant window. Windows are clipped to the scan and use the chart's selected ayanamsa and divisional conventions. Boundaries are sampled and rounded to seconds; very rapid motion at extreme latitudes can be missed. D60 is especially sensitive.</p>
      {rows.map(({ division, windows }) => <details key={division} className="nadi-info-disclosure">
        <summary className="nadi-info-summary">{division} · {SUBJECT[division]} · {windows.length} {windows.length === 1 ? "window" : "windows"}</summary>
        <ul className="mt-1 space-y-1">{windows.map((w, i) => <li key={`${w.startIso}-${i}`}>
          {display(w.start, w.startIso, w.startDate)}–{display(w.end, w.endIso, w.endDate)} · {SIGNS[w.sign]}{w.given ? " · recorded time" : ""}
        </li>)}</ul>
      </details>)}
      <p><Cite>{MANLEY_SOURCE.label}</Cite></p>
    </div>
  </details>;
}
