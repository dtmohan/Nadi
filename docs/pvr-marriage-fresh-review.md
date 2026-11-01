# PVR-inspired marriage check: fresh public cases

The research-only reconstruction reproduces the period sequence in Rao's
published computational examples and the D4/D24 relationships in his example
130. That tests the translation of specific examples into code; it does not
verify the astrological interpretation or reproduce the 2019 video. The
[protocol](pvr-rectification-research-protocol.md), [case fixture](../scripts/fixtures/pvr-marriage-fresh.json),
and [results with hashes](pvr-marriage-fresh-results.json) document the
separate exploratory evaluation.

The match to example 130 is not exact at every point. At the book's approximate
corrected 10:42:30 clock, our Lahiri/mean-node calculation starts its Taurus
subperiod around 20 January 1997, whereas Rao's approximate illustration
aims for the end of 1996. His example uses approximate motions, and choices of
calculation settings may also matter. We have not established the cause or
confirmed the book's corrected clock.

The four-alternative D9/Kalachakra subperiod diagnostic matched the actual
wedding day at the **reported birth time in 2 of 4 cases**. It matched 11 of
24 nearby comparison dates. Several controls share a long subperiod with the
wedding. The controls are not verified non-events; no inference of predictive
accuracy or birth-time correctness follows from these figures.

| Case | Actual day | Matching nearby dates | Sampled birth window matching actual day |
| --- | --- | ---: | ---: |
| Tom Hanks | Sagittarius subperiod = D9 ascendant | 4 / 6 | 45% |
| Mina | Libra subperiod = D9 seventh house | 6 / 6 | 51.67% |
| Puneeth Rajkumar | No listed subperiod clue | 1 / 6 | 28.33% |
| Aaron Novick | No listed subperiod clue | 0 / 6 | 25% |

The full local day, including its possible period changes, is checked for the
event and each shifted date; no case changes the diagnostic within its actual
day. Window coverage uses 120 points, 30 seconds apart, not an exact interval
solver. It describes a single known event used to define the diagnostic, not a
held-out selection. No birth time was selected. Source reports of birth records
were not independently examined; Novick's published fixed offset is preserved;
and Hanks's corrected 30 April wedding date conflicts with the Astro-Databank
event list. Source details are in the fixture.

Reproduce with `node --import tsx scripts/eval-pvr-marriage.ts`. This is a
small convenience sample and an app-defined subset of qualitative examples.
It is not evidence for or against the whole of PVR's approach. In particular,
do not put this diagnostic into the main rectification score or use it as a
mandatory gate based on these results.
