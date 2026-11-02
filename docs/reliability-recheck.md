# Reliability and audit recheck, 2 November 2026

The two external audits are useful leads, not authoritative specifications.
This note distinguishes reproduced defects, fixes and remaining limitations.
It contains no private chart or event data.

## Corrections made

- `julianDay` now converts its input instant to UTC itself. The defect was
  reproduced for non-UTC `DateTime` inputs, notably test fixtures; the main
  chart path already supplied UTC, so there is no basis to say every chart
  was shifted by the server's local time zone.
- Vimshottari display periods use elapsed UTC milliseconds, agree with the
  event scorer at tested boundaries and cover at least 120 years after birth.
  Repeated lords in the closing cycle retain their own subperiods and transit
  snapshots. Corrected UTC natal golden projections come from the independently
  archived pre-context commit, with floating-point canonicalization.
- Rectify's detected interval keys now include ALP state at actual marriage
  dates. A synthetic example previously crossed an ALP change inside a slice.
  This is still a sampled scan: ALP changes at random comparison dates and
  other unregistered boundaries can fall inside a slice.
- KP qualified, Parashari v1–v4 and their random-date comparisons count the
  registered date-independent natal clues once per candidate and matter;
  dated timing checks remain per event. Individual event details remain
  visible. This prevents repeated data entry from multiplying those natal
  contributions, but does not make the remaining factors independent or
  establish statistical significance. Older unrelated scoring methods have
  not been universally converted.
- BPHS 3.49–54's separate exaltation-sign, own-sign and degree-bounded
  moolatrikona facts are available in shared planet context and the Parashari
  planet view. Shadbala uses the same degree ranges, and the specific Venus
  period condition in BPHS 47.81–82 is now degree-bounded. The general
  single-label dignity and other school rules remain sign-based until each
  source and rule can be reviewed; overlapping facts are not silently collapsed.
- The Nadi family umbrella retains all findings but no longer nets findings
  about different relatives into one supportive/care/contested verdict.
  Parent-specific cross-school agreement is already evaluated separately.
- Missing daily solar events no longer cause available ordinary calculations
  to invent sunrise-dependent values. A latitude where Placidus cusps are
  unavailable still cannot produce a complete chart, and an unavailable
  judgment-day sunrise still prevents the current judgment calculation.
- Place editing clears stale coordinates; search now has keyboard and
  accessible combobox behavior and visible empty/error feedback. Source-checked
  Indian historical-name alternatives are offered alongside global matches,
  including Madras, Bombay, Calcutta, Bangalore, Banaras/Benares, Pondicherry
  and Cochin. They do not exhaust historical names, and a person must select
  the correct result.
- The Rectify interface defaults to quick scan and explicitly says its 200
  random comparisons were skipped. API callers omitting the option still
  receive the previous full scan. Light-theme contrast of the checked Sun,
  Moon, Jupiter, mixed-verdict and muted-text tokens was increased; faded
  text uses were removed. Topic cards no longer change column width when
  opened, and the long Nadi grading note can be opened when needed.

## Independent public-case diagnostic

The [predeclared protocol](reliability-recheck-protocol.md) and
[case manifest](../scripts/fixtures/reliability-fresh-cases.json) identify
four additional published people and the sources for their events. These are
new to the repository fixtures, but a small convenience sample: Astro-Databank's
birth-record ratings were not verified from original certificates, some event
clocks and locations are assumptions, and public reports are not necessarily
independent. Jeanne-Claude has only one eligible event, so no random baseline
is computed. The [full output](reliability-recheck-results.json) records
midpoints, selected code hashes, conditions and comparison dates.

The table is for Parashari v4 at the midpoint of the interval containing the
reported clock within a ±10-minute scan. “Top coverage” is the portion of that
scan tied for the highest midpoint score, not an accuracy or probability.

| Person | Recorded interval score | Top score | Top coverage | Actual / random mean |
| --- | ---: | ---: | ---: | ---: |
| Matthew McConaughey | 14/29 | 15/29 | 7.2% | 14 / 14.3 |
| Karine Ferri | 16/29 | 16/29 | 89.7% | 16 / 19.3 |
| Cécilia Attias | 15/29 | 15/29 | 80.7% | 15 / 15.2 |
| Jeanne-Claude | 5/9 | 5/9 | 55.4% | unavailable |

KP's qualified score at the reported interval was top only for Attias, whose
top score covered 90.1% of the window. For the three cases with a marriage,
the BNN marriage check was zero throughout each window. ALP top coverage was
25.5%–54.7%. These exploratory checks cannot establish a birth time or that
astrology predicts events. Random dates were not independently established
non-events. The table does not test larger windows, and it is not a held-out
study of a calibrated predictive model.

## Other audit claims checked

- The audit's claim of hundreds of thousands of daily transit calls and a
  predicted sub-120-ms chart response did not match the current implementation:
  transit searches already use coarser steps and targeted planetary positions.
  No such speedup is claimed. Current local synthetic ±10-minute, three-event
  samples took 0.66 s quick and 2.14 s full; they are not live-server guarantees.
- Several cited large benchmark file names in the audit were not present in
  this checkout, so the claimed 70-, 92- and 125-chart numbers were not
  independently reproduced and are not used as evidence here.
- The production client still bundles approximately 3.4 MB of JavaScript
  before gzip. The unknown-birth-time workflow, complete high-latitude support,
  comprehensive school-by-school dignity migration, additional historical
  aliases, mobile target-size checks and broader navigation/reading redesign
  remain open. A noon placeholder alone would be misleading when house and
  cusp readings depend on an unknown time.
