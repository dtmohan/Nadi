// Legal time standards the IANA database does not carry, or carries in a way the automatic
// standard would misread. The automatic standard treats a database offset with leftover
// seconds as the reference city's mean time and substitutes the birthplace's own mean time.
// That is right for a true local-mean-time era (Ulm 1879, New York 1880) and wrong where a
// national or municipal mean time was the legal clock: Paris Mean Time 1891-1911, Dublin
// Mean Time 1880-1916, Amsterdam time 1909-1940, and the Bombay and Calcutta times that
// outlived Indian Standard Time. Each row below names its source; rows whose dates are known
// only to the year are marked provisional and say so in the note.
import { DateTime } from "luxon";

export interface LegalTimeSource {
  label: string;
  url: string;
}

export interface LegalTimeRule {
  id: string;
  /** IANA zone ids the rule applies to (the geocoder's id for the place). */
  zones: string[];
  /** Optional bounding box [latMin, latMax, lonMin, lonMax]; the rule applies only inside it. */
  box?: [number, number, number, number];
  /** Civil dates, inclusive start, exclusive end (ISO). */
  from: string;
  to: string;
  /** "zone": trust the database offset here. "fixed": apply offsetSeconds. "neth": Dutch table below. */
  kind: "zone" | "fixed" | "neth";
  offsetSeconds?: number;
  label: string;
  note: string;
  source: LegalTimeSource;
  provisional?: boolean;
}

const WIKI = (p: string) => `https://en.wikipedia.org/wiki/${p}`;
const BACKZONE = "https://github.com/eggert/tz/blob/main/backzone";

export const LEGAL_TIME_RULES: LegalTimeRule[] = [
  {
    id: "gb-gmt-1847",
    zones: ["Europe/London"],
    from: "1847-12-01",
    to: "1880-08-02",
    kind: "zone",
    label: "Greenwich Mean Time (railway time)",
    note: "Greenwich time was in general use in Britain from December 1847 but became the legal time only with the Statutes (Definition of Time) Act of 2 August 1880; a birth recorded on a local clock in this interval may need Local mean time.",
    source: {
      label: "Statutes (Definition of Time) Act 1880",
      url: WIKI("Statutes_(Definition_of_Time)_Act_1880"),
    },
  },
  {
    id: "ni-dmt",
    zones: ["Europe/London", "Europe/Belfast"],
    box: [54.0, 55.4, -8.2, -5.4],
    from: "1880-08-02",
    to: "1916-05-21",
    kind: "fixed",
    offsetSeconds: -(25 * 60 + 21),
    label: "Dublin Mean Time -0:25:21",
    note: "The 1880 Act made Dublin Mean Time the legal time for the whole island of Ireland; the main IANA table folds Belfast into London and loses it.",
    source: { label: "IANA backzone, Europe/Belfast", url: BACKZONE },
  },
  {
    id: "ni-ist-1916",
    zones: ["Europe/London", "Europe/Belfast"],
    box: [54.0, 55.4, -8.2, -5.4],
    from: "1916-05-21",
    to: "1916-10-01",
    kind: "fixed",
    offsetSeconds: 34 * 60 + 39,
    label: "Irish Summer Time +0:34:39",
    note: "Summer time of 1916 on the Dublin Mean Time base; Greenwich time from 1 October 1916.",
    source: { label: "IANA backzone, Europe/Belfast", url: BACKZONE },
  },
  {
    id: "ie-dmt",
    zones: ["Europe/Dublin"],
    from: "1880-08-02",
    to: "1916-10-01",
    kind: "zone",
    label: "Dublin Mean Time",
    note: "Legal time for Ireland from the Statutes (Definition of Time) Act 1880 until 2 am on 1 October 1916 (Time (Ireland) Act 1916); the database carries it and it is applied as written.",
    source: {
      label: "Time in the Republic of Ireland",
      url: WIKI("Time_in_the_Republic_of_Ireland"),
    },
  },
  {
    id: "fr-pmt",
    zones: ["Europe/Paris"],
    from: "1891-03-15",
    to: "1911-03-11",
    kind: "zone",
    label: "Paris Mean Time",
    note: "Legal time for France and Algeria under the law of 14 March 1891, replaced by Greenwich time under the law of 9 March 1911; the database carries it and it is applied as written.",
    source: {
      label: "Loi du 14 mars 1891 (Archives de la Haute-Vienne)",
      url: "https://archives.haute-vienne.fr/decouvrir-apprendre/petites-et-grandes-histoires-de-la-haute-vienne/mettons-les-pendules-a-lheure-",
    },
  },
  {
    id: "nl-amt",
    zones: ["Europe/Amsterdam", "Europe/Brussels"],
    box: [50.7, 53.6, 3.3, 7.3],
    from: "1909-05-01",
    to: "1940-05-16",
    kind: "neth",
    label: "Amsterdam time",
    note: "Legal time for the Netherlands from 1 May 1909 to 16 May 1940: +0:19:32 (Amsterdam mean time), +0:20 from 1 July 1937, with the Dutch summer-time rules of 1916-1939. The main IANA table merged Amsterdam into Brussels in 2022 and lost these offsets.",
    source: {
      label: "IANA backzone, Europe/Amsterdam (Neth rules)",
      url: BACKZONE,
    },
  },
  {
    id: "nl-cest-1940",
    zones: ["Europe/Amsterdam", "Europe/Brussels"],
    box: [50.7, 53.6, 3.3, 7.3],
    from: "1940-05-16",
    to: "1940-05-20",
    kind: "fixed",
    offsetSeconds: 7200,
    label: "Central European Summer Time +2:00",
    note: "The Netherlands moved to German summer time on 16 May 1940, four days before the Brussels table does.",
    source: { label: "IANA backzone, Europe/Amsterdam", url: BACKZONE },
  },
  {
    id: "in-bombay",
    zones: ["Asia/Kolkata", "Asia/Calcutta"],
    box: [18.85, 19.35, 72.75, 73.1],
    from: "1884-01-01",
    to: "1956-01-01",
    kind: "fixed",
    offsetSeconds: 4 * 3600 + 51 * 60,
    label: "Bombay Time +4:51",
    note: "Bombay kept its own time, 4 h 51 min ahead of Greenwich, from 1884 until 1955 despite Indian Standard Time (1906). The start and end are known to the year only; a birth in 1884 or 1955 may fall on either side. Bombay's mean time (+4:51:16) differs by seconds.",
    source: { label: "Bombay Time", url: WIKI("Bombay_Time") },
    provisional: true,
  },
  {
    id: "in-calcutta",
    zones: ["Asia/Kolkata", "Asia/Calcutta"],
    box: [22.4, 22.75, 88.2, 88.5],
    from: "1884-01-01",
    to: "1949-01-01",
    kind: "fixed",
    offsetSeconds: 5 * 3600 + 53 * 60 + 20,
    label: "Calcutta Time +5:53:20",
    note: "Calcutta kept its own time, 5 h 53 min 20 s ahead of Greenwich, from 1884 until 1948 despite Indian Standard Time (1906). The end is known to the year only; a birth in 1948 may fall on either side.",
    source: { label: "Calcutta Time", url: WIKI("Calcutta_Time") },
    provisional: true,
  },
];

const inBox = (
  box: [number, number, number, number] | undefined,
  lat: number | undefined,
  lon: number,
) =>
  !box ||
  (lat !== undefined &&
    lat >= box[0] &&
    lat <= box[1] &&
    lon >= box[2] &&
    lon <= box[3]);

/** The legal-time rule, if any, covering a civil date at a place. */
export function findLegalTimeRule(
  date: string,
  zone: string,
  longitude: number,
  latitude?: number,
): LegalTimeRule | undefined {
  return LEGAL_TIME_RULES.find(
    (r) =>
      r.zones.includes(zone) &&
      date >= r.from &&
      date < r.to &&
      inBox(r.box, latitude, longitude),
  );
}

// Dutch summer time 1916-1939, transcribed from the IANA backzone "Neth" rules. Start and end
// are given as the civil clock reading at the moment of change (2:00 standard = 3:00 summer).
type Span = { start: DateTime; end: DateTime };

const firstWeekdayOnOrAfter = (
  y: number,
  m: number,
  d: number,
  weekday: number,
) => {
  let dt = DateTime.utc(y, m, d);
  while (dt.weekday !== weekday) dt = dt.plus({ days: 1 });
  return dt;
};
const lastWeekdayOf = (y: number, m: number, weekday: number) => {
  let dt = DateTime.utc(y, m, 1).endOf("month").startOf("day");
  while (dt.weekday !== weekday) dt = dt.minus({ days: 1 });
  return dt;
};
const at = (d: DateTime, h: number) => d.set({ hour: h });

function nethSummer(y: number): Span | undefined {
  const octEnd = at(firstWeekdayOnOrAfter(y, 10, 2, 7), 3);
  if (y === 1916)
    return { start: DateTime.utc(1916, 5, 1), end: DateTime.utc(1916, 10, 1) };
  if (y === 1917)
    return {
      start: at(DateTime.utc(1917, 4, 16), 2),
      end: at(DateTime.utc(1917, 9, 17), 3),
    };
  if (y >= 1918 && y <= 1921)
    return {
      start: at(firstWeekdayOnOrAfter(y, 4, 1, 1), 2),
      end: at(lastWeekdayOf(y, 9, 1), 3),
    };
  if (y === 1922 || y === 1924)
    return { start: at(lastWeekdayOf(y, 3, 7), 2), end: octEnd };
  if (y === 1923 || y === 1925)
    return { start: at(firstWeekdayOnOrAfter(y, 6, 1, 5), 2), end: octEnd };
  if (
    (y >= 1926 && y <= 1931) ||
    (y >= 1933 && y <= 1936) ||
    y === 1938 ||
    y === 1939
  )
    return { start: at(DateTime.utc(y, 5, 15), 2), end: octEnd };
  if (y === 1932 || y === 1937)
    return { start: at(DateTime.utc(y, 5, 22), 2), end: octEnd };
  return undefined;
}

/** Offset in seconds for a civil date-time in the Netherlands, 1 May 1909 to 16 May 1940. */
export function nethOffsetSeconds(civilIso: string): {
  offsetSeconds: number;
  label: string;
} {
  const c = DateTime.fromISO(civilIso, { zone: "utc" });
  const base = c >= DateTime.utc(1937, 7, 1) ? 20 * 60 : 19 * 60 + 32;
  const baseLabel = base === 1200 ? "+0:20" : "+0:19:32";
  const span = nethSummer(c.year);
  const summer = !!span && c >= span.start && c < span.end;
  return summer
    ? {
        offsetSeconds: base + 3600,
        label: `Netherlands Summer Time ${base === 1200 ? "+1:20" : "+1:19:32"}`,
      }
    : { offsetSeconds: base, label: `Amsterdam time ${baseLabel}` };
}

export const LEGAL_TIME_ABOUT =
  "The automatic standard reads a database offset with leftover seconds as the reference city's mean time and substitutes the birthplace's own. A short table of legal exceptions overrides that where a national or municipal mean time was the clock in law: Greenwich time in Britain from 1880, Dublin Mean Time to 1916 (including Belfast), Paris Mean Time 1891-1911, Amsterdam time 1909-1940 with the Dutch summer rules, Bombay Time to 1955 and Calcutta Time to 1948. Each row names its source; the Indian rows are dated to the year only and are marked provisional.";
