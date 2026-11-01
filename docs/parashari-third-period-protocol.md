# Third-period divisional evidence: evaluation protocol

This protocol is fixed before the new third-level experiment is run on the two public fixtures named below. It was motivated by a user's private chart; that chart is excluded from all public fixtures and cannot validate the rule. This is a small, observational experiment, not proof that astrological rectification works.

## Sources and the implemented evidence

Paul Manley, *Birth Time Rectification: How to Find Your Exact Birth Time* (2022), ch. 4 pp. 98–128, describes a qualitative comparison of the event house, its lord and significators in D1 and an event-specific division. His later three/four/five-level discussion recommends exact event dates. The provided book is not redistributed here. Nadi's third-level frame reuses its existing partial house/lord/significator relations for the pratyantardasha lord: same-sign placement; full sign-based planetary aspects in either direction; and a node's sign lord. Nodes receive but do not cast aspects. This is an app-defined subset, not the book's full funnel, complete judgment, or a new promise of an event.

For education, Manley's D24 fifth-house interpretation is kept distinct from the additional D24 fourth-house interpretation in P.V.R. Narasimha Rao, [*Vedic Astrology: An Integrated Approach*](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf), chapter 8 (PDF page 103). The fourth house and its lord are shown as separate descriptive evidence and are not silently added to Manley's fifth-house condition. Finer periods are shown using the event's own clock and zone; a missing clock defaults to local noon, with that assumption visible. A missing zone defaults to the chart's birth zone and is also identified as an assumption.

No existing production method, v1/v2/v3 score, weight, eligibility, time-standard rule, or baseline is changed. The third level is unweighted evidence in Rectify and Validate. A repeated lord is not independent confirmation, even when two or three levels match. Event clocks, node conventions and the ayanamsa affect interpretation; placements and aspects are not assigned a uniformly favourable meaning. D16 vehicle rules, fourth/fifth dasha levels, the full Manley funnel and Rao's distinct divisional transit technique are not introduced by this experiment.

## Offline comparison

The evaluator uses the source-specific primary house, house-lord and significator links already returned for D4, D7, D9, D10 or D24. It compares two **research-only** counts on the same segments:

* M2: one Boolean point each if the main and subperiod lord has at least one primary link.
* M3: M2 plus one Boolean point if the third lord has at least one primary link.

These counts are a deliberately simple Nadi research operationalization, not Manley's formula, a production ranking, or probabilities. A third lord already equal to a matching main/sub lord can earn another experimental point; report how often that happens. As a prespecified sensitivity, repeat with only house and house-lord links, excluding karaka-only matches. For education, report the Rao fourth-house contact separately; do not add it to the primary counts. Unsupported matters and event types before birth are excluded, not assigned zero.

## Cases

Run two cohorts separately. First, reanalyse the previously published `scripts/fixtures/parashari-divisional-v3-cases.json` cases. Their earlier v3 results were already seen, so these are reused exploratory cases, not a fresh independent sample. Second, use the separately prepared `scripts/fixtures/parashari-third-period-fresh-cases.json` manifest. Its subjects do not occur in prior Nadi fixtures or the user's supplied Manley worked examples, and its sources, event dates, locations and caveats are recorded before the new third-level results are inspected. The fresh group is a small convenience sample, largely public figures; no original birth certificate is claimed to have been personally inspected. Date-only events use noon in the documented or explicitly assumed local zone.

The fresh sample contains one independently documented first day of university classes, so D24 results cannot generalize to education rectification. In the historical U.S. case where the database reports local mean time but the applicable civil standard is uncertain, use the source's stated basis for the primary run and the IANA zone as a sensitivity. Never use an astrologically rectified time as ground truth. Record other known source conflicts and do not quietly resolve them based on the scores.

## Metrics

For every case, group events on the same date, sort distinct dates, and alternate them into ranking inputs and held-out events. The first date is an input. Scan the same ±30-minute window and boundaries for M2 and M3; do not break ties by proximity to the reported time. Report all tied top intervals, their duration coverage, whether any interval touches the reported time ±5 minutes and ±10 minutes, and the reported-time score percentile. A broad top set has an inherent geometric advantage; report the share of the scanned hour covered by each ±5-minute-expanded top set as a descriptive reference, not a p-value or probability.

At the reported birth time compare each held-out event with six dates offset by ±60, ±120 and ±180 days, preserving zone and local event clock and excluding dates before birth or equal to a known event. These comparison dates are not verified non-events and are correlated; report actual and comparison matches and sample counts rather than claim a significance test. Report the third factor's duration-weighted coverage, constant-across-window rate, and whether its matching lord repeats a main/sub lord. Surface category counts and missing event times. Sensitivity for 00:01, noon and 23:59 on date-only events at the reported birth time measures clock dependence; it does not exhaust all unknown-time combinations or change the primary noon scan.

Hash this protocol, the two manifests and evaluator with the results. Freeze the fresh manifest before running the evaluator; do not select or remove cases based on results. If the samples are too small or contradictory, say so. Reanalyse the user's case only as a separate private exercise if requested; do not place the user's birth or event data in the repository or public results.
