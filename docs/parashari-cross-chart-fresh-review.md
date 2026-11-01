# D1 and divisional clues: fresh public-case review

The earlier binary D1 screen is too narrow to rule out a birth time. It can halt on a mixed or unsupported partial D1 house assessment before displaying the D1 house lord or a natural significator in the relevant division. The new display presents these placements and their contrary indications together. It does not assign an automatic rescue, score, natal promise, or candidate exclusion. The earlier result remains reproducible as a diagnostic experiment.

The scope and case selection were recorded in [the protocol](parashari-cross-chart-protocol.md) before this run. Paul Manley's *Birth Time Rectification*, capture pp. 64–67 and 132–133, discusses the natal fifth lord as a possible childbirth period-giver in the D7 analysis. [P.V.R. Narasimha Rao's worked example 5](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf#page=513) reads the D1 seventh lord in D9. These illustrate cross-chart interpretation; neither provides the app's particular two-chart Boolean timing convention or establishes a universal automatic cancellation rule. The source-transcription regression for Raman's chart is not one of the independent cases below.

## Results

At each reported birth time, Nadi checked main- and subperiod clues for two recorded events and compared them with 200 random-date sets. A third event was held out and compared with six dates at ±60, ±120 and ±180 days. A listed timing clue means that the period lord has at least one of the implemented links in each chart; it is not a complete natal promise.

| Published case | Recorded events with first two clues | Random-date mean | Held-out event | Nearby dates with first two clues |
| --- | ---: | ---: | --- | ---: |
| Jimmy Carter | 1 of 2 | 1.0 of 2 | Present | 6 of 6 |
| Angelina Jolie | 1 of 2 | 1.5 of 2 | Present | 6 of 6 |
| Jacques Cousteau | 2 of 2 | 2.0 of 2 | Present | 6 of 6 |

The conditional third-period clue was present on 2 of 3 held-out dates and 15 of 18 nearby dates. Thus, these broad timing links did not distinguish the held-out dates from the nearby comparison dates in this small check. The nearby dates are not verified non-events, so neither specificity nor false-positive rates can be estimated from this experiment. The sample is a small convenience sample, not a representative evaluation or independent evidence that astrology predicts events. The 200 random dates per case do not necessarily preserve plausible ages or event order.

Birth times, event clocks and even some event dates have uncertainty. Carter's database time is rounded and uses a stated UTC−06:00 offset; its time basis needs verification. Reports disagree on the date of Jolie's 2006 birth event; illustrative scenarios for both dates leave these timing clues unchanged. Cousteau's source has a 13:06 display and a 13:15 source note, and older biographies conflict with his family's dates for the children; the alternate clock was examined instead of silently resolving the discrepancy. See [the fixture](../scripts/fixtures/parashari-cross-chart-fresh.json) for birth and event sources, and [the full results](parashari-cross-chart-fresh-results.json) for assumptions, detailed observations and calculation hashes.

Reproduce with `node --import tsx scripts/eval-parashari-cross-chart.ts`. No rules were adjusted to improve these results. This check does not rank candidate birth times or justify narrowing a personal birth window.
