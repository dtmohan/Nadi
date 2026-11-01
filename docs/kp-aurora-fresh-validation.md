# Aurora strict adapter: fresh-case result

The frozen procedure is in [the protocol](kp-aurora-validation-protocol.md). The [case manifest](../scripts/fixtures/kp-aurora-fresh-cases.json) links each reported birth and event to its source, and the [machine-readable output](kp-aurora-fresh-results.json) records the stages, assumptions, samples and controls. Run `node --import tsx scripts/eval-kp-aurora.ts` from the repository root to reproduce it.

**Result: the strict app adapter did not narrow any of the sampled windows.** None of the 12 distinct recorded events across the four people completed its chain at the primary reported anchor. All 31 sampled points in each ±30-minute window tied at zero on the training events. Both AM/PM windows for Paul McCartney had the same result. This is a failure of the app's strict operationalization to discriminate in this small test; it is not evidence that the events did not occur, that the birth reports are wrong, or that Aurora herself would reject the charts.

| Case and anchor | Training / held-out dates | Highest training score; tied samples | Held-out at anchor | Actual full chains / mean of 200 comparison sets |
|---|---:|---:|---:|---:|
| Carl XVI Gustaf, 10:30 | 2 / 2 | 0/2; 31/31 | 0/2 | 0/4 / 0 |
| Grace Kelly, 05:31 | 2 / 2 | 0/2; 31/31 | 0/2 | 0/4 / 0 |
| Paul McCartney, 02:00 | 2 / 1 | 0/2; 31/31 | 0/1 | 0/3 / 0 |
| Paul McCartney, 14:00 alternative | 2 / 1 | 0/2; 31/31 | 0/1 | 0/3 / 0 |
| Frida Kahlo, 08:30 LMT | 1 / 0 | 0/1; 31/31 | — | No eligible multi-date comparison |

The King's alternative 10:20 report also has a 0/2 training and 0/2 held-out result. The two McCartney anchors concern one person and the same events; they are not two independent cases. His birth-time accounts differ by twelve hours, and Mary McCartney's conflicting reported dates were excluded. Kahlo's 1940 remarriage was not treated as a first marriage. Kelly's civil and religious ceremonies occurred on successive days; the registered civil date was used. Full source and event-time uncertainties are in the manifest.

At the primary anchors, every event stops at a mixed first cusp stage. In McCartney's 14:00 alternative, the marriage stage is silent rather than mixed. Later raw stages remain visible as descriptions but are not promoted past that predecessor. The date-only checks at 00:00, noon and 23:59 did not change the stage signatures in this sample; the sky itself can still change, and no exact event time follows from this check. Comparison dates are sampled alternatives, not verified non-events.

As a **post-hoc diagnostic**, the reported anchors were also recalculated using true rather than mean nodes, Lahiri rather than KP ayanamsa, and latitude/longitude shifted together by ±0.05° at the same birth instant. None produced a complete chain. The recorded stage signatures did change in some Lahiri and location variants; lack of a stage change does not mean the underlying longitudes were identical. Lahiri is an alternative sensitivity check, not Aurora's KP setting; the arbitrary coordinate perturbation is not a measurement of each birthplace's uncertainty. These diagnostics were not used to tune the rule.

## Source-conformance limitation

Two independent book examples support the empty-star interpretation of self-significators, and the book's Rahu example supports its cusp-sub associations. The supplied 1982 ruling-planet example also reproduces the stated first/ninth cusp sub lords in the same third house under the documented location and ephemeris assumptions. This is narrower than a complete rectification rule; retrograde and node-substitution exceptions remain unresolved.

The strict screen additionally rejects any stage whose chosen star or sub layer contains an adverse house. That is a Nadi convention, not a universal Aurora rule. In her 2022 marriage example the author proceeds through a mixed Jupiter script while explicitly setting some adverse houses aside; other parts of the book emphasize sub-lord denial. The current strict adapter therefore cannot be represented as a faithful automatic reproduction of that judgment. An improved interpretation must be specified from source examples first and then evaluated on a new independent set; fitting a relaxation to the people above would contaminate that test.

The integrations use the same shared evaluator for the chart's matter-and-date panel, saved-event validation, rectification candidates, and each random-date trial. The source examples and synthetic integration tests verify this consistency, not predictive accuracy. This evidence is displayed separately from the older KP reading and its scores. The event model does not yet implement a complete Aurora ruling-planet procedure, fifth-level period interpretation, numbered horary chart, or a transit gate.
