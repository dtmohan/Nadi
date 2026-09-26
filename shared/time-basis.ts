// Birth-time basis: how the civil birth time on the form is turned into an instant.
//
// The IANA database gives, for dates before a place adopted standard time, the local mean time of the zone's
// reference city (Berlin for Europe/Berlin, Howrah then Madras for Asia/Kolkata), not of the birthplace. A birth
// recorded in local time at Ulm in 1879 or Porbandar in 1869 must instead use the mean time of the birthplace
// itself: four minutes of time per degree of longitude. The "auto" standard detects the mean-time era and does
// that; the others let the practitioner force the database offset, the birthplace mean time, or a fixed offset.
import { DateTime, FixedOffsetZone, IANAZone } from "luxon";

export type TimeStandardMode = "auto" | "zone" | "lmt" | "fixed";

export const TIME_STANDARDS: {
  id: TimeStandardMode;
  label: string;
  help: string;
}[] = [
  {
    id: "auto",
    label: "Automatic",
    help: "Zone database, except before standard time, when the birthplace's own mean time is used.",
  },
  {
    id: "zone",
    label: "Zone database",
    help: "Always the IANA offset, even for dates before standard time (reference-city mean time).",
  },
  {
    id: "lmt",
    label: "Local mean time",
    help: "Mean solar time of the birthplace: four minutes per degree of longitude.",
  },
  {
    id: "fixed",
    label: "Fixed offset",
    help: "An offset from UTC that you supply, such as +05:30 or +05:53:20.",
  },
];

export interface TimeBasis {
  mode: Exclude<TimeStandardMode, "auto">;
  /** True when the automatic standard chose the mode. */
  auto: boolean;
  /** Offset applied to the civil time, in seconds east of UTC. */
  offsetSeconds: number;
  /** Offset the zone database would apply at that instant, in seconds. */
  zoneOffsetSeconds: number;
  /** Zone abbreviation or name reported by the runtime for the database offset. */
  zoneName: string;
  /** IANA id from the form. */
  zone: string;
  /** Human label of the applied offset, e.g. "LMT of birthplace +0:39:58". */
  label: string;
  /** A zone string Luxon accepts for displaying local times under this basis (minute precision). */
  displayZone: string;
  /** One sentence for the form and the chart header. */
  note: string;
  /** Set when the input could not be resolved (bad zone id or offset). */
  error?: string;
}

/** Parse "+05:30", "-07:52:58", "UTC+5:30", "5.5" into seconds east of UTC, or undefined. */
export function parseFixedOffset(s: string): number | undefined {
  const t = s.trim().replace(/^(UTC|GMT)/i, "");
  if (!t) return undefined;
  let m = t.match(/^([+-])?(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?$/);
  if (m) {
    const sign = m[1] === "-" ? -1 : 1;
    const h = Number(m[2]),
      mi = Number(m[3] ?? 0),
      se = Number(m[4] ?? 0);
    if (h > 14 || mi > 59 || se > 59) return undefined;
    return sign * (h * 3600 + mi * 60 + se);
  }
  m = t.match(/^([+-])?(\d{1,2}(?:\.\d+)?)$/);
  if (m) {
    const v = Number(m[2]);
    if (v > 14) return undefined;
    return (m[1] === "-" ? -1 : 1) * Math.round(v * 3600);
  }
  return undefined;
}

export const fmtOffset = (sec: number): string => {
  const sign = sec < 0 ? "-" : "+";
  const a = Math.abs(sec);
  const h = Math.floor(a / 3600),
    m = Math.floor((a % 3600) / 60),
    s = a % 60;
  return `${sign}${h}:${String(m).padStart(2, "0")}${s ? `:${String(s).padStart(2, "0")}` : ""}`;
};

/** Local mean time offset of a longitude, in seconds (4 minutes per degree). */
export const lmtOffsetSeconds = (longitude: number) =>
  Math.round(longitude * 240);

const displayZoneFor = (sec: number) => {
  const minutes = Math.round(sec / 60);
  return FixedOffsetZone.instance(minutes).name; // e.g. "UTC+0:40"
};

/**
 * Resolve the basis for a civil birth date and time.
 * `timeStandard` is "auto" | "zone" | "lmt" | "fixed", or an offset string such as "+05:30" (treated as fixed).
 */
export function resolveTimeBasis(
  date: string,
  time: string,
  zone: string,
  longitude: number,
  timeStandard = "auto",
): TimeBasis {
  const iana = IANAZone.isValidZone(zone) ? IANAZone.create(zone) : undefined;
  const civil = iana
    ? DateTime.fromISO(`${date}T${time}`, { zone: iana })
    : DateTime.fromISO(`${date}T${time}`, { zone: "utc" });
  const zoneOffsetSeconds =
    iana && civil.isValid ? Math.round(civil.offset * 60) : 0;
  let zoneName = zone;
  if (iana && civil.isValid) {
    try {
      zoneName =
        new Intl.DateTimeFormat("en-US", {
          timeZone: zone,
          timeZoneName: "long",
        })
          .formatToParts(civil.toJSDate())
          .find((p) => p.type === "timeZoneName")?.value ?? zone;
    } catch {
      zoneName = zone;
    }
  }
  const lmt = lmtOffsetSeconds(longitude);
  const unnamed = /^GMT[+-]\d{1,2}:\d{2}(:\d{2})?$/.test(zoneName);
  if (unnamed) zoneName = "mean time of the zone's reference city";
  const base = { auto: false, zoneOffsetSeconds, zoneName, zone };

  let mode: TimeBasis["mode"];
  let fixedSeconds: number | undefined;
  let auto = false;
  const std = (timeStandard || "auto").trim();
  if (std === "auto") {
    // Mean-time era: the database offset carries seconds, which standard times (whole minutes) never do.
    const meanTimeEra =
      zoneOffsetSeconds % 60 !== 0 || (unnamed && civil.year < 1900);
    mode = meanTimeEra || !iana ? "lmt" : "zone";
    auto = true;
  } else if (std === "zone" || std === "lmt") {
    mode = std;
  } else {
    mode = "fixed";
    fixedSeconds = parseFixedOffset(std === "fixed" ? "" : std);
  }

  if (mode === "zone") {
    if (!iana || !civil.isValid) {
      return {
        ...base,
        mode,
        auto,
        offsetSeconds: 0,
        label: zone,
        displayZone: "utc",
        note: `Unknown time zone "${zone}".`,
        error: `Unknown time zone "${zone}"`,
      };
    }
    const label = `${zoneName} ${fmtOffset(zoneOffsetSeconds)}`;
    const meanTimeEra = zoneOffsetSeconds % 60 !== 0;
    return {
      ...base,
      mode,
      auto,
      offsetSeconds: zoneOffsetSeconds,
      label,
      displayZone: meanTimeEra ? displayZoneFor(zoneOffsetSeconds) : zone,
      note: meanTimeEra
        ? `Zone database offset ${fmtOffset(zoneOffsetSeconds)} is the mean time of the zone's reference city, not of the birthplace (whose mean time is ${fmtOffset(lmt)}).`
        : `Zone database: ${label}.`,
    };
  }
  if (mode === "lmt") {
    const label = `Local mean time of birthplace ${fmtOffset(lmt)}`;
    const differs =
      iana && civil.isValid && Math.abs(lmt - zoneOffsetSeconds) >= 30;
    return {
      ...base,
      mode,
      auto,
      offsetSeconds: lmt,
      label,
      displayZone: displayZoneFor(lmt),
      note: auto
        ? `Before standard time here; the birthplace's own mean time ${fmtOffset(lmt)} is applied instead of the zone database's ${fmtOffset(zoneOffsetSeconds)} (${zoneName}).`
        : differs
          ? `Local mean time ${fmtOffset(lmt)} applied; the zone database would give ${fmtOffset(zoneOffsetSeconds)} (${zoneName}).`
          : `Local mean time ${fmtOffset(lmt)} applied.`,
    };
  }
  if (fixedSeconds === undefined) {
    return {
      ...base,
      mode: "fixed",
      auto,
      offsetSeconds: 0,
      label: "Fixed offset (unset)",
      displayZone: "utc",
      note: "Enter a fixed offset such as +05:30.",
      error: "Fixed offset not given",
    };
  }
  return {
    ...base,
    mode: "fixed",
    auto,
    offsetSeconds: fixedSeconds,
    label: `Fixed offset ${fmtOffset(fixedSeconds)}`,
    displayZone: displayZoneFor(fixedSeconds),
    note: `Fixed offset ${fmtOffset(fixedSeconds)} applied${iana && civil.isValid ? `; the zone database would give ${fmtOffset(zoneOffsetSeconds)} (${zoneName})` : ""}.`,
  };
}

/** The birth instant in UTC under the basis (exact to the second). */
export function birthUtc(
  date: string,
  time: string,
  basis: TimeBasis,
): DateTime {
  const civil = DateTime.fromISO(`${date}T${time}`, { zone: "utc" });
  if (!civil.isValid)
    throw new Error(`Invalid birth datetime: ${civil.invalidExplanation}`);
  return civil.minus({ seconds: basis.offsetSeconds });
}
