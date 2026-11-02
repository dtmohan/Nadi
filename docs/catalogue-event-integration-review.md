# Ordinary natal rules in event workflows: exploratory review

The six school evaluators now provide qualified evidence to a chosen-date chart reading,
Validate, a Rectify candidate and comparison dates. This is software parity for registered
scopes, not evidence that the complete traditions or every event rule are implemented. The
candidate's natal context is fixed across sampled dates. ALP's reviewed topic findings and
Parashari's ordinary finding/period participants are recomputed on all sampled dates; their
per-event frequencies are descriptive. The first comparison set also exposes the actual
findings. These additions do not change the existing point totals or impose a D1 veto.

The KP registration distinguishes event-promise clues, modifiers and general context. A
positive rule that does not match is unresolved, not the opposite of that rule. The registry
deliberately excludes a horary rule about a particular prospective partner and delivery-specific
rules from a generic parent/child event. Ordinary Parashari context uses the chosen house
construction; the separate D1/divisional research screen uses whole signs and full aspects.
BNN/Jaimini associations are broad area context; Prasna Marga uses natal house and selected
Gulika clues, not a question chart. ALP uses the event instant; the chart's date picker uses
the start of a day. See [the six-school path audit](planet-context-parity-audit.md) and
[the KP and Parashari audit](reading-rule-parity-audit.md) for precise remaining boundaries.

## Published cases and procedure

The discovery cohort and the later four-person cohort are documented in the two protocols
and fixture manifests. The latter comprised a French politician, a US actor, an Indian actor
and a Brazilian interpreter/campaigner; eight documented career, marriage or child events.
For examples, France's [official appointment decree](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000034719850)
confirms Édouard Philippe's 2017 appointment; the [Las Vegas Historical Society](https://lasvegashistoricalsociety.org/when-mia-was-21-and-frank-was-50/)
dates Mia Farrow's wedding; and [UOL](https://noticias.uol.com.br/eleicoes/2022/08/22/como-michelle-e-bolsonaro-se-conheceram-e-casaram.amp.htm)
gives Michelle Bolsonaro's two ceremonies. Full event and reported birth-time references are
in the [case manifest](../scripts/fixtures/catalogue-event-holdout.json).

The earlier discovery run led to correcting an over-broad KP job registration. The later
cohort was initially defined before its first run, but some display, registration and descriptive
comparison work continued after its results were inspected; the final run is exploratory
reanalysis, not a blinded holdout. Original birth certificates were not independently inspected.
Some event clocks were unknown or only reported in astrological sources; the 2010 mayoral date
and a 2012 childbirth date have conflicting reports. Celina Jaitly's 09:30 input is the midpoint
of a second-hand 09:00–10:00 report, not a recorded minute; her 2017 childbirth had a mixed
outcome. The two Bolsonaro ceremonies concern the same couple and are correlated.

For each event, the evaluator compares the same evidence at the reported chart input across the
ordinary chart, chosen-date reading and Validate. It recasts a selectable Rectify midpoint and
replays the first random-date set. It also compares the candidate's rule-frequency summaries
with Validate and checks six fixed offsets (±60, ±120 and ±180 days). The random and offset
dates are not verified non-events. The full reproducible output, assumptions and file hashes
are in [the result data](catalogue-event-holdout-results.json).

The legacy ranking was scanned in a ±5-minute window around each reported input. Coverage is
the fraction of that window occupied by tied highest-scoring segments; “included” refers to
the sampled segment containing the input, not independent verification of an exact minute.

| Case | KP top coverage | Input segment in KP top? | Parashari v3 top coverage | Input segment in v3 top? |
| --- | ---: | --- | ---: | --- |
| Édouard Philippe | 59.3% | Yes | 37.7% | No |
| Mia Farrow | 6.7% | No | 29.5% | No |
| Celina Jaitly | 100% | Yes, all tied | 30.3% | No |
| Michelle Bolsonaro | 24.5% | No | 90.3% | Yes |

All eight events had an **unresolved** registered KP promise indication at the reported input,
even though five received the legacy 4/4 KP point total. That mismatch reveals a limitation of
both the broad legacy point count and the current qualified rule subset; neither result proves
an event was impossible, nor establishes the reported birth time. The 2017 mixed-outcome
childbirth is excluded from the favourable-only Parashari v1–v3 point calculation. These results
do not validate predictive accuracy, and the comparison frequencies are not probabilities.
For Jaitly's two childbirth dates the reviewed ALP topic finding set was empty on the actual
dates and on all 200 sampled dates; that 200/200 identical-set count is a lack of discrimination,
not a positive match. Her ordinary Parashari period-participant sets were also empty and repeated
on 173/200 and 175/200 dates respectively.

The person's own chart and events were processed locally and are intentionally not included
in this public repository, fixture or report.

## Scan cost

On the synthetic three-event benchmark with 200 comparison sets, a ±10-minute scan took
about 5.5 seconds and produced 11.9 MB of JSON (about 2.4 MB with the endpoint's fast gzip).
A ±30-minute scan took about 16 seconds and produced 37.4 MB before compression. On the same
machine before this integration the ±10-minute benchmark was about 1.1 seconds and 5.5 MB.
Times vary by hardware and load, but the larger, slower response is a real regression to address
before assuming very wide windows will be inexpensive.

## Adding a rule

Add a rule to its school's ordinary evaluator once; record its source, required frame, scope,
exceptions and age/outcome restrictions. Explicitly register the matters where its meaning is
applicable; indicate whether it is a promise clue, modifier or context. Then wire the relevant
dated or candidate inputs and test ordinary/dated/Validate/Rectify/sampled-date parity, including
boundary and non-match cases. No rule automatically changes a score merely because it exists in
the ordinary catalogue. A source-backed timing method and independently tested aggregation are
needed before adding weights or turning descriptive context into a ranking.
