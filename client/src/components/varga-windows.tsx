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
  const display = (time: string, iso: string) => iso.slice(0, 10) === birthDate ? time : `${iso.slice(0, 10)} ${time}`;
  return <details className="mt-3 rounded-md border px-3 py-2 text-xs" data-testid="manley-varga-windows">
    <summary className="cursor-pointer font-medium">Divisional ascendant windows · D1 to D60</summary>
    <div className="mt-2 space-y-2 text-muted-foreground">
      <p>These show where each ascendant changes within the scanned window, following the sequence in Manley's book. They do not select or confirm a birth time. Planetary divisional positions and period lords can also change within one ascendant window. Windows are clipped to the scan and use the chart's selected ayanamsa and divisional conventions. Boundaries are sampled and rounded to seconds; very rapid motion at extreme latitudes can be missed. D60 is especially sensitive.</p>
      {rows.map(({ division, windows }) => <details key={division} className="rounded border px-2 py-1.5">
        <summary className="cursor-pointer font-medium">{division} · {SUBJECT[division]} · {windows.length} {windows.length === 1 ? "window" : "windows"}</summary>
        <ul className="mt-1 space-y-1">{windows.map((w, i) => <li key={`${w.startIso}-${i}`}>
          {display(w.start, w.startIso)}–{display(w.end, w.endIso)} · {SIGNS[w.sign]}{w.given ? " · recorded time" : ""}
        </li>)}</ul>
      </details>)}
      <p><Cite>{MANLEY_SOURCE.label}</Cite></p>
    </div>
  </details>;
}
