# Parashari event-specific version 2: fresh-case evaluation

The revised event-specific method is **not ready to select a birth time**. Its highest-scoring intervals touched the reported-time ±5-minute band in eight of nine newly selected cases, but those intervals covered an average of **35.3% of the scanned hour**. At the reported birth times, the 12 held-out events averaged **3.17/6** matches, versus **3.13/6** on six nearby comparison dates per event. This small difference does not establish that the timing rule distinguishes an event date from nearby dates.

The [protocol](parashari-specific-v2-protocol.md), [case manifest](../scripts/fixtures/parashari-specific-v2-cases.json), and scoring code were fixed before the first case run. The [machine-readable results](parashari-specific-v2-results.json) include file hashes, every interval, event split, control date and factor match. Version 1 and version 2 were scored on the same candidate intervals for a paired comparison. The new scan can split an earlier version-1 interval more finely to capture version-2 or held-out-event transitions, so this run should not be expected to reproduce every midpoint of the earlier eight-person study bit-for-bit.

The cases are nine public figures born in seven countries: a cricketer in India, a footballer in Argentina, a tennis player in Switzerland, a teacher and politician in Canada, a banker and politician in France, a tennis player in the United States, a royal and a scientist in England, and an Australian-American actor born in the United States. They were not in either earlier Nadi case fixture. They are a convenience sample, not a representative set. The manifest gives the published birth-time and event sources. Birth times are not independently certified here: four are quoted as birth-record quality, four as remembered/news-reported, and one as biographical; Messi's record conflicts with another account and Goodall's reported half-hour time may be rounded. Event times are often unknown, so noon is used in the stated event zone.

An additional source discrepancy was found after scoring: a [later account](https://www.lanacion.com.ar/deportes/cuantos-anos-tienen-y-donde-nacieron-los-hijos-de-lionel-messi-nid31102023/) gives March 11 for the birth of Messi's youngest child, while a [contemporaneous March 10 report](https://www.antena3.com/noticias/deportes/futbol/messi-baja-ultima-hora-malaga-motivos-personales_201803105aa3a8eb0cf23f53ffc4aa7c.html) and the source in the manifest support March 10. The date and scores were not changed after the run.

Each ±30-minute window used alternate distinct dates as input and held out the remaining dates. All listed events were calculated together to establish candidate boundaries, but only input events entered the ranking. Two cases had only one input event. Held-out scores were averaged across **all** tied top-score intervals by their duration; no single midpoint was selected using its nearness to the reported time. A held-out event can precede an input event: this is retrospective testing, not a prospective forecast. The top-interval indicator asks whether *any* top interval touches the ±5-minute band, not whether the midpoint or an estimated time is within it.

| Case | Input / held-out events | V1 top coverage; band touched | V2 top coverage; band touched | V2 held-out score: reported / top intervals' weighted mean |
|---|---:|---|---|---:|
| Sunil Gavaskar | 2 / 1 | 17.4%; yes | 15.4%; **no** | 5/6 / 5.0 |
| Lionel Messi | 2 / 2 | 12.9%; no | 43.5%; yes | 9/12 / 9.0 |
| Roger Federer | 2 / 1 | 35.4%; no | 34.6%; yes | 1/6 / 1.0 |
| Justin Trudeau | 2 / 2 | 12.7%; yes | 22.7%; yes | 5/12 / 5.2 |
| Emmanuel Macron | 2 / 1 | 16.9%; yes | 36.6%; yes | 2/6 / 2.8 |
| Serena Williams | 1 / 1 | 34.9%; yes | 87.9%; yes | 5/6 / 4.5 |
| Prince William | 2 / 2 | 31.0%; yes | 17.4%; yes | 4/12 / 6.0 |
| Jane Goodall | 1 / 1 | 56.4%; yes | 56.4%; yes | 3/6 / 2.6 |
| Nicole Kidman | 2 / 1 | 7.6%; yes | 3.5%; yes | 4/6 / 4.0 |

On these same nine cases, V1's top intervals touched the reported band in seven cases and covered 25.0% of the hour on average. V2 was narrower in four cases, wider in four, and equal in one. The comparison is sensitive to case selection and source uncertainty; it does not show that either score establishes a birth time. As a geometric reference only, a uniformly chosen reference time within each already-scored hour would have its ±5-minute band touch a V2 top interval **57.2%** of the time on average (V1: **43.2%**). The scan is centred on the reported time, so this reference is not an independent population experiment or significance test.

For V2, the duration-weighted mean held-out score over all top intervals was higher than the recorded-time held-out score in three cases, lower in two, and equal in four after rounding to one decimal place. Both sides use the same unvalidated point count. There were eight held-out childbirth events, two marriages and two new jobs/appointments. These counts are too small to assess each category; events within one person and family are correlated.

For the nearby-date check, each held-out event's date was shifted by ±60, ±120 and ±180 days, keeping its supplied or assumed local clock time and zone. All 72 controls were usable. At the recorded birth time, the V2 actual event had a higher score than its own six-control average for seven events, a lower score for three, and an equal score for two; the pooled difference was **0.04 of one point per event**. V1 averaged 2.25/5 on the events versus 2.26/5 on controls. These dates are correlated, can include implausible event ages or circumstances, and do not form a calibrated probability or independent population sample. The D1 and division-support components depend on the birth chart, so they remain unchanged across dates; slow transits and period lords can also remain unchanged over nearby dates. Thus a high total on an actual event can also be common on other dates.

The version-2 rules are separated by event: marriage adds direct D1/D9 ascendant/seventh relationships and Vivah Saham; childbirth uses the listed Phaladeepika timing set and its own transit checks; career uses a distinct ascendant/tenth/exaltation period subset and D10 relationship. Their exact strict interpretations and exclusions are in the protocol. The six equal weights are Nadi's convention, not a quoted textual formula. No weights or eligibility rules were tuned after these cases were scored. A worthwhile next study needs stronger independent birth records, preselected event classes, practitioner review of these interpretations, and further fresh cases; treating these nine as tuning data would end their role as an independent holdout.

Reproduce from the repository root:

```sh
node --import tsx scripts/eval-parashari-specific-v2.ts > docs/parashari-specific-v2-results.json
```
