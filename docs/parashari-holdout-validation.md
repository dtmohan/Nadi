# Parashari ranking: new public-case evaluation

The first fixed five-factor implementation **did not recover the reported-time band in any of these eight cases**. The highest input-event score never occurred in an interval touching ±5 minutes of the reported birth time. This is a small, retrospective, selectively assembled test; it is not a statistical verdict on Parashari astrology or proof that any birth record is correct. It is evidence that this particular automated ranking is not ready to select a birth time.

The [protocol](parashari-ranking-protocol.md) records the sources, score and split before the scores were run. The [case manifest](../scripts/fixtures/parashari-holdout-cases.json) links each reported birth time and event to published sources and notes uncertainty. The cases were not in the prior seven-person pilot: they cover a scientist born in Poland, an artist born in Japan, a musician born in Colombia, an actor born in India, an entrepreneur born in South Africa, and an actor, a martial artist and a public official born in the United States. All are public figures, however, and some times are rounded, remembered, disputed or quoted from rather than independently checked against an original record.

For each chart, alternate distinct dates were input and held out over a ±30-minute scan. The table reports the duration of the hour occupied by intervals with the highest input score at their sampled midpoints; whether those intervals touch the reported-time ±5-minute band; the diagnostic top-scoring midpoint nearest the reported time; and the summed held-out score at the exact reported time versus that midpoint. Selecting the midpoint nearest the reported time uses the answer and is **not blind**. Scores are five app-defined matches per eligible event, not event probabilities. The raw numbers and per-event factors are in the [machine-readable results](parashari-holdout-results.json).

| Published case | Input / held-out dates | Top-score coverage | Touches ±5 min? | Chosen offset | Held-out: reported / chosen |
|---|---:|---:|:---:|---:|---:|
| Marie Curie | 2 / 1 | 21.9% | No | −13.6 min | 2/5 / 1/5 |
| Yoko Ono | 1 / 1 | 14.6% | No | +22.1 min | 2/5 / 3/5 |
| Shakira | 1 / 1 | 25.9% | No | +14.9 min | 2/5 / 4/5 |
| Aamir Khan | 2 / 2 | 17.3% | No | +21.0 min | 7/10 / 5/10 |
| Elon Musk | 1 / 1 | 41.9% | No | −13.0 min | 0/5 / 2/5 |
| Marilyn Monroe | 2 / 1 | 20.1% | No | −18.4 min | 3/5 / 3/5 |
| Bruce Lee | 2 / 1 | 18.2% | No | −15.4 min | 3/5 / 3/5 |
| Kamala Harris | 2 / 1 | 20.0% | No | −17.3 min | 2/5 / 2/5 |

The chosen time scored higher on held-out events in three cases, lower in two, and the same in three. Those differences concern the same unvalidated match score, not whether an event happened or which time is accurate. Three cases use only one input event. The holdout can occur before an input event and is a retrospective cross-check, not a forecast. Several candidates score well away from rounded or disputed reported times; neither side of that difference should be treated as established truth.

Top-score intervals cover 22.5% of the hour on average. As a descriptive reference, if a reference time were selected uniformly within each already-scored hour, the fraction of possible reference times whose ±5-minute band would touch a top interval averages 37.0%. This accounts for interval length, gaps and the five-minute band, but is not an independent population test, an event-date control, or a significance claim. Each scan itself is centred on the reported time.

Across held-out events there were five childbirth events (reported-time total 9/25; chosen-time total 13/25), three marriages (10/15 versus 8/15), and one new job/office event (2/5 versus 2/5). These totals pool correlated events and are too small to assess the categories separately. In particular, the career extension has only one held-out event. The public biographies do not provide a complete or representative set of life events, and some event times are assumed to be noon.

The method is available for inspection with a prominent warning. It does not deny a difficult marriage, childbirth or career, and it does not score job loss as the opposite of career support. No weights were tuned after seeing this evaluation. A better next experiment would establish clearer event-specific rules with practitioners, freeze them in advance, and test on a **new** set with independent birth records and suitable age- and event-aware controls. Reusing these eight cases to fit a rule would make them development cases, not an independent holdout.

Reproduce from the repository root:

```sh
node --import tsx scripts/eval-parashari-holdout.ts > docs/parashari-holdout-results.json
```
