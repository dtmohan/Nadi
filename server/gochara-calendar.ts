/**
 * Gochara calendar: for each planet, the stretches over which its transit verdict from the natal
 * Moon stays the same, with the change instants narrowed to the hour. Rules are the day-view rules
 * in shared/gochara.ts (Brihat Samhita 104, Phaladeepika 26); this file only walks them over time.
 */
import { computeGochara, type GocharaRow, type OwnMarks } from "@shared/gochara";
import { CALENDAR_PLANETS, GOCHARA_CALENDAR_NOTES, SATURN_NAMED_HOUSES, type GocharaCalendar, type GocharaPlanetCalendar, type GocharaSegment, type SaturnPassage } from "@shared/gochara-calendar";
import type { Planet, PlanetPosition } from "@shared/astro";
import { positionsLite, jdToIso, type EphemerisOptions } from "./ephemeris";

interface State {
  row: GocharaRow;
  key: string;
}

/** The Moon is left out as an obstructor and as an aspecting planet here; see GOCHARA_CALENDAR_NOTES. */
function rowsAt(jd: number, moonSign: number, opts: EphemerisOptions, ownMarks?: OwnMarks, withhold = false): Map<Planet, State> {
  const positions: PlanetPosition[] = positionsLite(jd, opts).filter((p) => p.planet !== "Moon");
  // For a minor the danger houses are withheld before anything is rendered (shared/gochara.ts, as in the day view).
  const reading = computeGochara(moonSign, positions, jdToIso(jd), withhold, { ownMarks });
  const out = new Map<Planet, State>();
  for (const row of reading.rows) {
    if (!CALENDAR_PLANETS.includes(row.planet)) continue;
    const key = `${row.signIndex}|${row.verdict}|${row.vedhaBy.join(",")}|${row.dignityNote?.text ?? ""}|${row.aspectNote?.text ?? ""}|${row.avNote ? "av" : ""}`;
    out.set(row.planet, { row, key });
  }
  return out;
}

function toSegment(row: GocharaRow, start: number, end: number, positions: PlanetPosition[]): GocharaSegment {
  const pos = positions.find((p) => p.planet === row.planet)!;
  // The day-view rules decide whether the danger houses of 26.33-34 stand or are set aside (26.41, 26.31, 26.30).
  const danger = !row.danger ? undefined : row.danger.source.label.endsWith("26.33") ? "33" : "34";
  // Compact reasons for the calendar; the aspecting planets are pooled across merged stretches in `aspectBy`.
  const note = [
    row.avNote ? `${row.avMarks} of 8 own Ashtakavarga marks make the house good (26.41).` : undefined,
    row.dignityNote && row.verdict === "neutral" ? row.dignityNote.text : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    start: jdToIso(start),
    end: jdToIso(end),
    signIndex: row.signIndex,
    house: row.house,
    verdict: row.verdict,
    vedhaBy: row.vedhaBy,
    dignity: pos.dignity,
    combust: pos.combust,
    ...(danger ? { danger } : {}),
    ...(row.avNote ? { avGood: true } : {}),
    ...(row.aspectNote
      ? { aspectBy: [...row.aspectNote.by], aspectVoids: row.favourable || row.avNote ? ("good" as const) : ("ill" as const) }
      : {}),
    ...(note ? { note } : {}),
  };
}

/** "inimical in transit: X" + "combust in transit: X" -> "inimical, combust in transit: X"; otherwise keep both. */
function mergeNotes(a: string | undefined, b: string): string {
  if (!a || a === b) return a ?? b;
  const re = /^(.*?) in (transit|a favourable house): (.*)$/;
  const ma = a.match(re);
  const mb = b.match(re);
  if (ma && mb && ma[2] === mb[2] && ma[3] === mb[3]) {
    const reasons = ma[1].split(", ");
    if (!reasons.includes(mb[1])) reasons.push(mb[1]);
    return `${reasons.join(", ")} in ${ma[2]}: ${ma[3]}`;
  }
  return a.includes(b) ? a : `${a} ${b}`;
}

export function gocharaCalendar(
  moonSign: number,
  jdStart: number,
  jdEnd: number,
  opts: EphemerisOptions,
  ownMarks?: OwnMarks,
  withhold = false,
): GocharaCalendar {
  const STEP = 1; // day
  const RESOLVE = 1 / 24; // hour
  const open = new Map<Planet, { state: State; start: number }>();
  const segments = new Map<Planet, GocharaSegment[]>(CALENDAR_PLANETS.map((p) => [p, []]));

  let prevJd = jdStart;
  let prev = rowsAt(prevJd, moonSign, opts, ownMarks, withhold);
  for (const p of CALENDAR_PLANETS) open.set(p, { state: prev.get(p)!, start: jdStart });

  const close = (planet: Planet, at: number) => {
    const o = open.get(planet)!;
    const positions = positionsLite((o.start + at) / 2, opts);
    segments.get(planet)!.push(toSegment(o.state.row, o.start, at, positions));
  };

  for (let jd = jdStart + STEP; jd < jdEnd + STEP; jd += STEP) {
    const t1 = Math.min(jd, jdEnd);
    const cur = rowsAt(t1, moonSign, opts, ownMarks, withhold);
    for (const planet of CALENDAR_PLANETS) {
      const a = prev.get(planet)!;
      const b = cur.get(planet)!;
      if (a.key === b.key) continue;
      // narrow the change between prevJd (state a) and t1 (state b)
      let lo = prevJd;
      let hi = t1;
      while (hi - lo > RESOLVE) {
        const mid = (lo + hi) / 2;
        const m = rowsAt(mid, moonSign, opts, ownMarks, withhold).get(planet)!;
        if (m.key === a.key) lo = mid;
        else hi = mid;
      }
      close(planet, hi);
      open.set(planet, { state: b, start: hi });
    }
    prev = cur;
    prevJd = t1;
    if (t1 >= jdEnd) break;
  }
  for (const planet of CALENDAR_PLANETS) close(planet, jdEnd);

  // Merge adjacent stretches that share sign and verdict; obstructors and reasons are pooled so a
  // favourable house obstructed in turn by the Sun, Mercury and Venus reads as one obstructed stretch.
  for (const planet of CALENDAR_PLANETS) {
    const merged: GocharaSegment[] = [];
    for (const s of segments.get(planet)!) {
      const last = merged[merged.length - 1];
      if (last && last.signIndex === s.signIndex && last.verdict === s.verdict && last.end === s.start) {
        last.end = s.end;
        for (const q of s.vedhaBy) if (!last.vedhaBy.includes(q)) last.vedhaBy.push(q);
        last.combust = last.combust || s.combust;
        if (s.avGood) last.avGood = true;
        if (s.aspectBy) {
          const by = last.aspectBy ?? [];
          for (const q of s.aspectBy) if (!by.includes(q)) by.push(q);
          last.aspectBy = by;
        }
        if (s.note) last.note = mergeNotes(last.note, s.note);
      } else merged.push({ ...s, vedhaBy: [...s.vedhaBy] });
    }
    segments.set(planet, merged);
  }

  // Saturn through the houses practice names (12th, 1st and 2nd; 4th, 7th, 8th, 10th), merged across verdict changes within a house.
  const saturnPassages: SaturnPassage[] = [];
  for (const s of segments.get("Saturn")!) {
    if (!SATURN_NAMED_HOUSES.includes(s.house)) continue;
    const last = saturnPassages[saturnPassages.length - 1];
    if (last && last.house === s.house && last.end === s.start) last.end = s.end;
    else saturnPassages.push({ start: s.start, end: s.end, house: s.house });
  }

  const planets: GocharaPlanetCalendar[] = CALENDAR_PLANETS.map((planet) => ({ planet, segments: segments.get(planet)! }));
  // For a minor the danger houses are withheld, so the method note does not list them among the rules.
  const notes = withhold
    ? GOCHARA_CALENDAR_NOTES.map((n) => n.replace(", aspects (26.30) and the danger houses (26.33-34).", " and aspects (26.30)."))
    : GOCHARA_CALENDAR_NOTES;
  return { moonSignIndex: moonSign, from: jdToIso(jdStart), to: jdToIso(jdEnd), planets, saturnPassages, notes };
}
