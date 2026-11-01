# Parashari divisional-period experiment: fresh-case results

The additional divisional period-lord checks narrowed the highest-scoring set in this sample, but did **not** improve recovery of the published times. At the reported birth times, held-out event dates scored much like nearby comparison dates. This experiment does not support using the v3 ranking to rectify a birth time.

## Design

The [v3 protocol](parashari-divisional-v3-protocol.md), [case manifest](../scripts/fixtures/parashari-divisional-v3-cases.json), and [scorer](../scripts/eval-parashari-divisional-v3.ts) were fixed before calculating these results. The manifest contains 10 fresh people, 21 input events and 15 held-out events, with local event zones and source/precision notes. Each person was scanned over a one-hour window centered on their published birth time. Alternating distinct dates were used for ranking and validation. V2 and v3 use the same segments and events; no near-reported-time tie-break is applied. Full tied intervals, factors, date-control values and run hashes are in [machine-readable results](parashari-divisional-v3-results.json).

The subjects are public figures from India, Brazil, Spain, the United States, France, Canada, England, the Netherlands and Scotland. They are a convenience sample, heavily weighted towards famous people, family events and politics. Emily Deschanel, Johan Cruyff and Donald Trump have only one input event each. Multiple children or marriages for one person and the same role in nonconsecutive terms are correlated. The published birth times are not certified by this project; sources include quoted records, recollections and biography, and there are important conflicts in some cases. Event dates and times, including those sourced to astrology databases, are not all independently verified. Date-only events use local noon. These limitations mean neither a success nor a miss demonstrates the true birth time.

## Paired results

| Measure | V2 | V3 |
| --- | ---: | ---: |
| Top set touches published time ±5 minutes | 4/10 | 4/10 |
| Top set touches published time ±10 minutes | 7/10 | 6/10 |
| Mean share of scanned hour in top set | 41.5% | 28.7% |
| Mean geometric ±5-minute-band touch reference | 55.1% | 43.8% |
| Mean percentile of published-time input score | 46.6 | 36.1 |
| Mean normalized held-out score at published time | 0.53 | 0.60 |
| Mean normalized held-out score across all tied top intervals | 0.55 | 0.61 |

The band-touch reference is the fraction of the scanned hour covered by each top set expanded by five minutes and then averaged across cases. It is a descriptive geometric reference for broad or fragmented sets, not a p-value, probability of accuracy, or an independent randomization test. The held-out means are averages of per-person normalized scores, and versions use different denominators. The 10-minute band is the prespecified sensitivity check for uncertain or rounded birth times.

| Subject | V2 top coverage | V2 ±5 touch | V3 top coverage | V3 ±5 touch |
| --- | ---: | :---: | ---: | :---: |
| Dhanush | 49.4% | No | 9.7% | No |
| Luciana Gimenez | 28.9% | No | 28.9% | No |
| Queen Letizia | 5.8% | Yes | 11.4% | Yes |
| Emily Deschanel | 82.1% | Yes | 50.5% | Yes |
| Nicolas Sarkozy | 23.5% | No | 23.5% | No |
| Jim Carrey | 37.3% | No | 37.3% | No |
| David Beckham | 68.7% | Yes | 19.9% | Yes |
| Johan Cruyff | 67.9% | No | 67.9% | No |
| Tony Blair | 25.6% | No | 12.4% | No |
| Donald Trump | 25.4% | Yes | 25.4% | Yes |

The manifest documents material uncertainties, including differing published times for Sarkozy and Letizia, differing birth years for Gimenez, a rounded interview-reported time for Carrey, and conflicting databases for the date of Beckham's daughter. The ±5-minute touch criterion may include a top interval that does not contain the exact published minute; it must not be interpreted as exact recovery.

## Held-out date comparisons and saturation

At the reported birth times, the 15 held-out events comprised 10 childbirths, 2 marriages and 3 career starts. For each event, we evaluated six dates offset by 60, 120 and 180 days in both directions: 90 control dates total. These dates are not confirmed non-events and are highly correlated, not 90 independent observations.

V2 averaged **2.73/6** on the actual held-out dates and **2.83/6** across the nearby controls. V3 averaged **4.27/8** on actual dates and **4.34/8** across controls. Under v3, 6 of 15 actual dates scored above their own control-date mean, 1 tied, and 8 scored below it. The small category counts prohibit reliable category-specific conclusions; individual actual and control scores are retained in the JSON.

Across the 36 event-by-hour scans, the added dasa factor was constant throughout the hour for 21 events and the bhukti factor for 18. Both were always matched for 14 events. Averaged across event-hours, dasa matched 71.3% of the hour and bhukti matched 77.1%; both matched for 60.8%. Main and subperiod lords were the same over 23.9% of event-hours, and the same planet generated two matched points over 20.8%. These figures expose factor saturation and duplication; they are not rates in a representative population.

The eight equally weighted points are a Nadi experiment, not Manley's published scoring formula. Several new checks overlap v2's marriage links, and an identical main and subperiod lord can earn both new points. The implementation omits Manley's full qualitative funnel, negative judgments and finer-period analysis. A more elaborate rule does not by itself establish either the event or the birth time.

## Reproduce

From the repository root, run `node --import tsx scripts/eval-parashari-divisional-v3.ts > docs/parashari-divisional-v3-results.json`. The initial results SHA-256 is `905f87a9e6e2fd1d70b3b09b23137bcff0d04e97206a8d204eb3dfc96e1e7435`; the results also record hashes of the manifest, protocol, scorer and relevant rule files. Revisions to the rules or fixture after observing these results would require a genuinely new case set to be called fresh validation.
