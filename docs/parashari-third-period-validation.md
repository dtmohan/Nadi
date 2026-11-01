# Third-period divisional evidence: public-case results

The third-level display is implemented, but this experiment does **not** support using its added match as a birth-time ranking rule. In seven newly selected public cases, adding one third-period point made the top sets narrower and reduced the number touching the published-time ±5-minute band from three to one. Held-out dates matched the third-period criterion no better than nearby comparison dates. This is a small convenience sample, not a population estimate or proof that any individual time is wrong.

**Scope clarification:** M3 is additive: a third-lord match can earn a point even when a main- or subperiod match is absent under this partial check. Manley's 345 discussion instead places the first two lords before finer-period refinement. This experiment therefore does **not** test a staged version of that method, and its results should not be read as a verdict on such a version. At the reported times in the seven fresh cases, six of the 20 events received a third-lord match while at least one earlier primary divisional link was absent; these links are only a subset of the book's evidence, so their absence is not proof that an earlier period fails the full method. The corresponding count in the reused cases was 11 of 36 events.

## What was tested

The [protocol](parashari-third-period-protocol.md), [fresh-case manifest](../scripts/fixtures/parashari-third-period-fresh-cases.json) and evaluator were written before the third-level results were calculated. A separate run reuses the ten earlier v3 public cases; those results were already known and are not fresh validation. The user's private chart was excluded. The new set comprises seven people, 20 events, 12 ranking-input dates and eight held-out dates. It includes one university first-class date, nine marriages, nine childbirths and one reported career appointment. Two cases have only one input event. Public figures, family events, two marriages of one person and related children are correlated and do not represent the general population.

The comparison here is **not** Nadi's existing v2/v3 ranking. Research-only M2 awards a point when each main/sub lord has at least one Manley-style divisional event-house, house-lord or significator link. Research-only M3 adds one point for the third lord under the same partial criterion. These are equal-weighted experimental counts, not the author's formula or probabilities; identical planets at multiple levels can be counted more than once. An additional prespecified sensitivity counts house/house-lord links only. The separately sourced D24 fourth house is reported descriptively and is not silently added to either count.

Each published birth time was scanned ±30 minutes; alternating distinct event dates were inputs and held out. All tied top intervals were retained, and duration rather than interval count determined coverage. The scan samples at five-second intervals and refines detected boundaries to within 200 milliseconds; a change that reverses between two samples could be missed. Missing event clocks used noon in the stated or explicitly assumed zone. The ±5-minute-expanded top-set coverage is a geometric reference for how much a broad set could touch under a uniform candidate-time comparison; it is not an independent probability, p-value or test of astrology.

## Paired results

| Cohort and measure | M2: first two lords | M3: adds third lord |
| --- | ---: | ---: |
| Fresh: top set touches reported time ±5 minutes | 3 / 7 | 1 / 7 |
| Fresh: top set touches reported time ±10 minutes | 4 / 7 | 3 / 7 |
| Fresh: mean share of hour in top set | 37.54% | 22.72% |
| Fresh: mean ±5-minute geometric reference | 50.64% | 38.19% |
| Reused: top set touches reported time ±5 minutes | 6 / 10 | 4 / 10 |
| Reused: top set touches reported time ±10 minutes | 8 / 10 | 8 / 10 |
| Reused: mean share of hour in top set | 57.20% | 39.80% |
| Reused: mean ±5-minute geometric reference | 70.35% | 58.89% |

The narrower M3 sets mechanically reduce the opportunity to touch a reported time, so the touch count alone is not a fair accuracy comparison. The coverage and reference are reported alongside it. Neither measure establishes a calibrated chance that a top interval contains the true birth time.

In the pre-specified **house/lord-only** sensitivity, fresh ±5-minute touches were four of seven for M2 and three of seven for M3, while mean top coverage fell from 39.57% to 29.26%. In the reused group, touches were five of ten and four of ten, with coverage falling from 33.50% to 19.83%. These alternative results show sensitivity to the operational rule, not a reason to select the better-looking version after the fact.

| Fresh subject | M2 coverage; ±5 touch | M3 coverage; ±5 touch | Source limitations |
| --- | --- | --- | --- |
| F. Scott Fitzgerald | 3.41%; no | 3.41%; no | Reported baby-book clock is rounded; Astro-Databank's local-mean-time assumption differs from the IANA civil-time interpretation. |
| Gerard Way | 75.79%; yes | 36.35%; no | Reported birth-certificate time was not inspected here; wedding clock and the child's quoted time need independent confirmation. |
| Guilherme Berenguer | 7.12%; no | 7.12%; no | One input event; child's birth zone is inferred from residence and clock is unknown. |
| Kareena Kapoor | 47.84%; no | 44.44%; no | Birth time comes from a family-friend report; a previous speculative time lies outside the scan. |
| Audrey Hepburn | 38.19%; yes | 38.19%; yes | Birth time may be rounded; sources distinguish or disagree about the first civil/religious wedding date. |
| Olivier Sarkozy | 88.04%; yes | 27.10%; no | Career date is an appointment/announcement, not verified first day; he is a half-brother of a reused-cohort subject. |
| Laura Dern | 2.40%; no | 2.40%; no | Birth record was not inspected here; event locations and clocks use stated assumptions. |

The [manifest](../scripts/fixtures/parashari-third-period-fresh-cases.json) links each birth and event source and records additional discrepancies. The original birth documents were not personally inspected. In particular, a published time rounded to a half-hour is not a trustworthy minute-level ground truth.

## Third-lord saturation and date controls

Across the fresh set's 20 event-by-hour scans, the third lord matched the primary criterion for **75.50%** of the hour on average. The third lord was the same as an earlier matching lord for **24.46%** of the hour on average. The primary third-factor result was constant across the entire hour for four events. These are descriptive averages over this particular small, correlated set, not general rates.

At the reported birth times, the third lord matched for **5/8** fresh held-out events, compared with **33/48** shifted comparison dates. Counting all three lord matches rather than the third alone, M3 averaged **2.375/3** on the held-out dates and **2.396/3** across the shifted dates. The offsets are ±60, ±120 and ±180 days, not confirmed non-events, and six offsets from one event are highly correlated. For the reused group, the corresponding third-lord matches were **10/15** actual versus **64/90** comparison dates.

Of 17 fresh date-only events, the sampled 00:01, noon and 23:59 scenarios changed the third lord for one event; its Boolean match did not change. In the 25 reused date-only events, one changed both the third lord and its Boolean match. These samples do not exhaust event-clock or location uncertainty and should not be taken as a general stability rate.

## The D24 first-day case

[Princeton University Library](https://manuscripts.blogs.princeton.edu/2013/09/) states that F. Scott Fitzgerald's first classes began on 24 September 1913. [Astro-Databank](https://www.astro.com/astro-databank/Fitzgerald%2C_F._Scott) reports a baby-book birth time of 15:30 in St. Paul and interprets it as local mean time; the record and historical time standard were not independently verified here.

At that reported LMT birth time, the education periods are Venus/Mercury/Mercury. Venus occupies the D24 fifth; Mercury matches as an education significator and repeats as sub- and third lord. The third criterion matches **the entire scanned hour** in this particular case, so it does not distinguish candidates. Both M2 and M3 put their shared highest set at the far end of the scan, about 28–30 minutes after the reported time; neither touches its ±5-minute band. This is a miss for the specified ranking experiment, not evidence that the baby-book time was wrong.

Astro-Databank's LMT interpretation gives 21:42:24 UTC, whereas applying the IANA civil-zone interpretation gives 21:30 UTC. With the latter convention, the separately displayed D24 fourth-house links change and both top sets still miss the ±5-minute band. This historical-basis difference is large enough to matter. **One education case cannot validate or invalidate D24 rectification.**

## Reproduce and interpret

Run `node --import tsx scripts/eval-parashari-third-period.ts > docs/parashari-third-period-results.json`. The [machine-readable result](parashari-third-period-results.json) records per-case intervals, the complete tied sets, individual period matches, assumed-time scenarios, comparison dates, source links and hashes of the protocol, fixtures, evaluator and calculation files. Two identical runs produced the same output; result SHA-256: `b3e5a4a23296c0d71f52b26b260b068598f97c5492516cfce5b0d1dcb44d72a2`.

Rectify and Validate therefore expose the third-period evidence and D24's separately sourced fourth-house clues for inspection, with event-clock assumptions visible. The existing v1/v2/v3 scoring is unchanged. Fourth/fifth period levels, the full manual funnel, D16 vehicle-event scoring and a validated automated birth-time verdict remain outside this implementation.
