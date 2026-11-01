import React, { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { SIGNS } from "@shared/astro";
import { pvrKalachakraAt } from "@shared/pvr-kalachakra";

/** A dated comparison only; it does not change the standard chart or event score. */
export function PvrKalachakraResearch({ moonLon, birthIso, asOfIso, birthZone }: {
  moonLon: number; birthIso: string; asOfIso: string; birthZone: string;
}) {
  const initial = DateTime.fromISO(asOfIso, { setZone: true }).setZone(birthZone);
  const [date, setDate] = useState(initial.toISODate() ?? "");
  const [time, setTime] = useState("12:00");
  const [zone, setZone] = useState(birthZone);
  const outcome = useMemo(() => {
    if (!date || !time || !zone) return { error: "Enter a date, time and time zone." };
    const local = DateTime.fromISO(`${date}T${time}`, { zone });
    if (!local.isValid) return { error: "Enter a valid date, time and IANA time zone or fixed UTC offset." };
    if (local.toFormat("yyyy-MM-dd HH:mm") !== `${date} ${time}`)
      return { error: "That local time does not exist in this time zone." };
    if (local.getPossibleOffsets().length > 1)
      return { error: "That local time occurs twice; enter its fixed UTC offset instead." };
    const birth = Date.parse(birthIso);
    if (!Number.isFinite(birth) || local.toMillis() < birth) return { error: "Choose a time after birth." };
    return { path: pvrKalachakraAt(moonLon, birth, local.toMillis()) };
  }, [date, time, zone, birthIso, moonLon]);
  const fmt = (ms: number) => DateTime.fromMillis(ms, { zone }).toFormat("d LLL yyyy, HH:mm ZZZZ");
  return (
    <div className="mt-3 rounded-md border border-border p-3 text-sm" data-testid="pvr-kalachakra-research">
      <p className="font-medium">PVR Kalachakra comparison · research</p>
      <p className="mt-1 text-muted-foreground">
        A separate 24-sign continuation with 360-day years. Choose the event's local date, time and zone;
        noon and the birth zone are initial assumptions. This comparison does not change a rectification or validation score.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">Date
          <input className="rounded border border-input bg-background px-2 py-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">Local time
          <input className="rounded border border-input bg-background px-2 py-1" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">Time zone
          <input className="rounded border border-input bg-background px-2 py-1" value={zone} onChange={(e) => setZone(e.target.value)} spellCheck={false}
            placeholder="Asia/Kolkata or UTC+05:30" />
        </label>
      </div>
      {outcome.path ? (
        <p className="mt-3" data-testid="pvr-kalachakra-result">
          Major: <strong>{SIGNS[outcome.path.major.sign]}</strong> ({fmt(outcome.path.major.startMs)} to {fmt(outcome.path.major.endMs)}).
          {" "}Subperiod: <strong>{SIGNS[outcome.path.sub.sign]}</strong> ({fmt(outcome.path.sub.startMs)} to {fmt(outcome.path.sub.endMs)}).
        </p>
      ) : <p className="mt-3 text-muted-foreground" role="status">{outcome.error}</p>}
      <p className="mt-2 text-muted-foreground">
        Period endings are exclusive. Matching a date does not establish a birth time. {" "}
        <a className="underline" href="https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=301" target="_blank" rel="noreferrer">PVR, chapter 24</a>
      </p>
    </div>
  );
}
