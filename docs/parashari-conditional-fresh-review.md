# Conditional observations: fresh public-case review

The [protocol](parashari-conditional-protocol.md) and [case fixture](../scripts/fixtures/parashari-conditional-fresh.json) were frozen before evaluation. The full event-level frames, alternate scenarios, six comparison dates per held-out event, boundary sides, Monte Carlo summaries and file hashes are in [the raw results](parashari-conditional-fresh-results.json). Reproduce from the repository root with `node --import tsx scripts/eval-parashari-conditional.ts`. This is a small exploratory test, not evidence that astrology can determine birth times.

| Measure | Present at reported time, all events | Held-out events present | Nearby dates with the same flag as held-out |
| --- | ---: | ---: | ---: |
| Formed, event-related named yoga pair | 0/15 | 0/5 | 30/30 |
| One-hop node-ruler event link | 4/15 | 1/5 | 23/30 |
| Event-house placement plus direct lord/karaka link | 4/15 | 2/5 | 28/30 |

The yoga rule had **no positive reported-time examples** here, so the sample does not validate its positive predictions. Nearby dates are not verified non-events, and a matching false flag is not a successful prediction. The weak change across nearby dates nevertheless makes the measured flags poor date discriminators in this sample. It is also unsurprising that periods lasting months or years make nearby dates similar. Flags overlap and should not be added into an aggregate score. These were convenience cases with selected significant events, no verified negative-event cohort, several related events and a different mixture of event types per person. Three reference events from the same individual or a shared period are not independent tests.

| Person and reported reference | Reported-time reference flags (pair / node / combination) | Nearest D1 boundary, reference counts on reported-sign side vs other side | Held-out finding at reported time |
| --- | --- | --- | --- |
| Ronald Reagan, 04:16, Sagittarius | 0 / 2 / 1 | pair 0–0, node 2–1, combination 1–0 | Presidential inauguration: none of the three flags. Birth certificate has no time; 08:25 and 02:00 scenarios also retained. |
| Suzanne Vega, 05:18, Gemini | 0 / 0 / 0 | pair 0–0, node 0–1, combination 0–0 | First wedding: none of the flags. Event zones assumed. |
| Benjamin Bratt, 22:45, Leo | 0 / 1 / 0 | pair 0–0, node 2–2, combination 0–0 | First child: node and event combination; alternative date also tested. |
| Priyanka Gandhi, 17:05, Gemini | 0 / 0 / 1 | pair 0–0, node 1–1, combination 0–0 | Parliamentary oath: event combination. Wedding invitation time 17:00 is a sensitivity scenario. |
| Flavio Bolsonaro, 20:10, Scorpio | 0 / 0 / 0 | pair 0–2, node 0–0, combination 0–2 | Senate term start: none of the flags. The election and term start describe one career transition. |

The boundary comparison uses two event-independent samples 30 seconds either side of the **nearest** calculated D1 boundary. These samples can be far from the reported clock and have different divisional ascendants and period boundaries; they do not isolate D1 alone. In the node comparison, one reported-sign side had more reference flags, one had fewer and three tied. In the event-combination comparison, one had more, one had fewer and three tied. For the yoga-pair comparison, one had fewer and four tied. A reported-sign side is not known ground truth, especially for Reagan's disputed clocks. None of these counts is a probability or a valid birth-time ranking.

Examples illustrate why the new distinctions matter. In Reagan's wedding, Rahu's D1 sign ruler Mars aspects the marriage house and shares a sign with its lord Mercury; Mars also owns the twelfth, so the evidence should not be labelled uniformly positive. For Bratt's second child's birth, Rahu's D1 ruler Mercury is in the fifth but also owns the second and eleventh; Rahu is repeated as main and subperiod lord, so this is one event flag, not two independent confirmations. In Priyanka Gandhi's wedding, Mercury occupies the seventh and shares its sign with Jupiter, that frame's seventh lord. Her mother and grandmother appeared in earlier fixtures; the family observations are not independent of the larger research history.

These results support keeping the new rules as inspectable context and fair random-date comparisons. They do not justify promoting them to the main ranking, treating a missing clue as a failed promise, or narrowing a birth time. In particular, they do not resolve the translations' different wording for BPHS 34.17 or establish a universal node-yoga rule.
