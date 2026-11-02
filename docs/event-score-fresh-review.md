# Fresh source-scoped event-score evaluation

**Historical result:** These figures were generated before the 2026-11-02
correction that counts repeated date-independent natal clues once per candidate
and matter. They do not validate the revised totals; see
[the reliability recheck](reliability-recheck.md) for the corrected analysis.

This is a small public convenience sample, not a test establishing that astrology
predicts events or that an algorithm can determine an unrecorded birth time. The
[protocol](event-score-integration-protocol.md) and
[public case manifest](../scripts/fixtures/event-score-fresh.json) were fixed before
running the new checks. Reproduce the full, hashed output with
`node --import tsx scripts/eval-qualified-event-fresh.ts`; the output is preserved in
[event-score-fresh-results.json](event-score-fresh-results.json). The user's chart
and life events are not in this repository.

The four people are a U.S. disability advocate, a U.S. politician, a French actor,
and a Peruvian-born Venezuelan singer. All reported birth clocks are attributed to
birth records by Astro-Databank, but the underlying certificates were not inspected.
Catherine Rich's 22:00 is rounded. Sources disagree on two wedding dates; the
manifest specifies the disputed dates and tests the alternatives. Annie Glenn's
published birth-zone offset differs from the America/New_York historical calculation;
both are checked. All unknown event times use local noon and the stated zone, which
may change period or transit results. Some event locations are assumed. One family
museum supplies both Glenn children's exact dates, so these are not independent
confirmations; two weddings or two children belonging to a person are correlated.

## What the scans show

Each row reports the recorded-time **segment midpoint**, then the highest midpoint
score and the percentage of the ±10-minute window occupied by tied highest-score
segments. They are app-defined counts on different scales and must not be compared
between methods. Segment boundaries are sampled, not exhaustive; a score can change
inside one segment. A tie at zero is not positive support.

| Person | KP natal then periods | Parashari v4 | ALP marriage | BNN marriage |
| --- | --- | --- | --- | --- |
| Annie Glenn | 0/12; top 8, 40.3% | 6/26; top 10, 26.2% | 0/1; top 1, 3.8% | 0/1; top 0, 100% |
| Gavin Newsom | 4/12; top 4, 50.2% | 12/24; top 17, 21.7% | 1/2; top 2, 41.6% | 0/2; top 0, 100% |
| Catherine Rich | 4/4; top 4, 24.4% | 3/8; top 5, 49.5% | 0/1; top 1, 6.7% | 0/1; top 0, 100% |
| Karina | 0/4; top 0, 100% | 6/8; top 6, 58.7% | 1/1; top 1, 67.5% | 0/1; top 0, 100% |

The KP sequence stopped at an unresolved natal stage for both Glenn children and
most other events; a missing clue is not an event denial. One of four people has a
flat zero KP score throughout the window, and another has a top score occupying
half its window. In every BNN scan the one same-sign clue was zero across the whole
window. The ALP clue matched two of five recorded marriages at the reported clock;
it is only one timing condition, without the book's full natal allowance. The new
Parashari children clue was absent for both Glenn children; it adds nothing to the
other two event types. Consequently this sample cannot establish the children's
clue's value, and the Parashari scores for three of the four people are unchanged
from v3. No overall method was calibrated or selected after seeing these results.

At the reported birth clocks, four dates 60 and 180 days before or after each event
were also checked. The total score matched the real-event score for KP on 31/32
nearby dates, Parashari on 20/32, ALP on 17/20 and BNN on 20/20. These are not
known non-events, and nearby dates are not independent; their purpose is to expose
coarse or flat checks. Glenn and Newsom additionally have 200 random sets spanning
their events. For the other two cases a random comparison is unavailable because
each has only one recorded event. The script verifies that the chosen-date reading,
Validate and the candidate midpoint agree; it also replays the first comparison set
and checks all 200-set aggregate statistics against the candidate's Validate result.
A synthetic automated test independently replays every one of the 200 sets.

For Glenn, changing only the assumed birth zone changed the exact wedding
Parashari score from 1/8 to 3/8 and the ALP clue from 0/1 to 1/1. This is a data
sensitivity result, not a choice of the correct historical zone. Rich's alternative
June 20 wedding changes her Parashari score from 3/8 to 2/8; the other scores are
unchanged. Karina's June 21 and June 27 alternatives have the same displayed counts
as June 20. The scores do not establish which account is correct.

## Scope and remaining gaps

The KP sequence tests the registered ordinary natal subset before the first three
periods; it does not implement all mixed-house, transit or sub-sub-lord practice.
Parashari v4 retains the earlier v3 weights, adds one overlapping fifth-lord clue
for children only, and can mix the selected ordinary house construction with v3's
whole-sign frame. The same natal fifth-lord clue is counted once per eligible child
event: two points for two children can come from the same natal condition, not two
independent indications. ALP and BNN each score one partial marriage clue, not an entire
system. For BNN, same-sign is a narrow interpretation of “touches”, and the
source's Venus example also specifies a second Jupiter round that is not checked.
Unspecified gender remains unassessed. No Prasna Marga horary score is inferred
from an event date: a proper question instant and location are required.

The random controls do not necessarily preserve an event's plausible age or
ordering, are not known non-events, and have not been corrected for examining many
candidate intervals or methods. None of the observed scores, comparisons or top
intervals should be used alone to replace a reported or remembered birth time.
