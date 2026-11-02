# Transit audit: fresh-case review

The [fixed protocol](transit-audit-holdout-protocol.md) was run on eight documented events from six people. The source links, time assumptions and historical-offset notes are in the [fixture](../scripts/fixtures/transit-audit-holdout.json); individual observations, comparison-date tuples and code hashes are in the [results](transit-audit-holdout-results.json). The events span a French scientist, a Dutch economist, a Japanese public figure, an Argentine-born Dutch public figure, and two US performers. This is a convenience sample, not a representative population.

Each event was compared to 200 reproducibly shifted dates at the same local time. Those dates are not verified non-events. A midrank of 50% is the midpoint of the shifted-date distribution, not a probability or an accuracy percentage.

| Observation | Event-weighted mean midrank | Person-weighted mean midrank | Events graded |
| --- | ---: | ---: | ---: |
| Full Jupiter + Saturn Moon-gochara verdict | 47.5% | 46.0% | 8 |
| Jupiter + Saturn basic favourable Moon-houses | 61.4% | 62.8% | 8 |
| Main-period lord's basic house from natal Moon | 46.8% | 39.0% | 7 |

The period-lord observation is deliberately ungraded for the one event in a node period. The full two-planet count was zero for seven actual events and two for one; 1,194 of its 1,600 comparisons tied their corresponding event. This is a coarse feature. Seven events had uncertain times and were also checked at 00:00, 06:00, 12:00 and 18:00; neither the two-planet count nor the period-lord flag changed at those four snapshots. That does not establish invariance over each entire day.

The results do not justify a new production event-score weight or a gate. The house-only result is higher than the control midpoint in this small sample, but its many ties, selected public figures, repeated events per person, unverified controls and multiple observations prevent a reliable conclusion. The lower full-verdict result also does not establish that any individual traditional modifier is wrong.

For the Japanese wedding, the fixture uses **10 April 1959**, supported by Japan's [Imperial Household Agency](https://www.kunaicho.go.jp/e-joko/pages/e-about/history/history01.html) and a [published academic account](https://www.kokugakuin.ac.jp/assets/uploads/2021/03/KJS2-full.pdf), rather than the conflicting March date in the astrology database. The academic account gives the 10:00 ceremony time. Birth-time quality is stated separately; the analysis does not ratify it.

The eight event snapshots did not produce a difference between the two Venus Vedha variants. The distinction and multiple-obstructor/reverse-pair cases are verified by targeted synthetic tests, not empirically validated by these events. Mars's original and Trikona-reduced values are reported without imposing a cutoff; five of the six first-period lords occupy different signs at their calculated pre-birth period start and at birth.

A post-hoc source check covered three neighbouring [Sarvartha Chintamani verses](https://vedicpupil.in/library/books/sarvartha-chintamani/chapter-3): 3.36 now checks the Mercury aspect and the alternate angular-Mercury condition, 3.40 checks both specified aspects and a bounded dignity, and 3.41 checks both specified aspects. The app's sign-based aspects, adopted dignity range and strength proxy make these provisional readings. Four of the six public charts triggered 3.36; none triggered 3.40 or 3.41. The fixture does not test their occupational claims, and the positive and missing-condition tests are synthetic checks of implementation, not validation of predictive value. Verse 3.29 remains reference-only while its alternatives are interpreted; this was not a complete audit of the wider Sarvartha catalogue.

Re-running the earlier [12-event Moon-gochara experiment](moon-gochara-fresh-review.md) with the revised engine gave a 54.4% event-weighted midrank for the full two-planet feature and 51.5% for the basic houses, versus the earlier 53.9% and 51.5%. The KP and Parashari event-score means were unchanged. The previous protocol remains historical and its original result file is not overwritten; both samples are too small to establish a predictive advantage.

The period-start calculation now uses the true start of the first Vimshottari period, even when the displayed timeline is clipped to the moment of birth. [Saravali 41.17–18](https://www.horasad.com/download/ebooks/Kalyana%20Varmas%20Saravali.pdf) places its Moon-at-period-start discussion in the Moola Dasa chapter; extending that specific rule to Vimshottari is not assumed here. The separate period-lord-from-natal-Moon observation follows one reading of [Phaladeepika 20.60](https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621592.html) with the 26.2 table as an explicitly provisional comparison, without Vedha and without changing scores.

To reproduce:

```sh
node --import tsx scripts/eval-transit-audit-holdout.ts > /tmp/nadi-transit-audit.json
node --import tsx scripts/eval-moon-gochara.ts > /tmp/nadi-moon-gochara-recheck.json
node --import tsx --test scripts/transit-audit.test.ts scripts/topic-reading.test.ts
```

Private chart candidates can be supplied to the holdout script's `--stdin` mode; no private chart is contained in the fixture or committed results.
