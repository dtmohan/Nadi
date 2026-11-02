# Transit audit: independent case protocol

This protocol was fixed before running `eval-transit-audit-holdout.ts`. It is an exploratory comparison of source-faithful implementations, not a test establishing astrology or a birth time. It does not tune a score, select the nearest birth-time candidate, or add a rule to production event scores.

Use every event in `scripts/fixtures/transit-audit-holdout.json`. People and events were chosen for an attributed birth time and a date corroborated independently of the astrological database; they were not selected by calculated outcomes. Historical offsets, conflicting source dates, and unknown event times are recorded in the fixture. A reported birth time is a hypothesis, even where the database reports a certificate. Some sources reuse the same announcement, and royal cases are not representative of the population. The supplied event instant is used; noon is a placeholder where the time is unknown. Repeat observations at 00:00, 06:00, 12:00 and 18:00 for events whose time is unknown.

For each event, use 200 unique reproducible dates between 8 and 365 days before or after it, at the same local clock and timezone, excluding invalid or ambiguous local times using `comparisonDates`. These are date shifts, not verified non-events, and seasonal and related-event effects remain. Use the same dates for all comparisons of a given event.

The prespecified measurements are:

1. The count of Jupiter and Saturn whose full shared Moon-gochara verdict is `favourable`, including its stated provisional modifier ordering.
2. The count of those two planets in the basic favourable Moon-houses before modifiers.
3. The main Vimshottari period lord's basic favourable-house flag from the natal Moon, the direction read by Sastri's translation of [Phaladeepika 20.60](https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621592.html), using the same basic table as the shared context. This table mapping is an app interpretation, not a rule to score a particular event. Use the selected Lahiri natal Moon and the actual event instant. When the lord is Rahu or Ketu, leave the flag ungraded; drop ungraded observations from that metric rather than assuming failure.

Report each event's result and midrank against controls, the event-weighted and person-weighted means, tie counts and time sensitivity. A 50% midrank is the control-distribution midpoint, not an event probability or accuracy rate. Do not combine the measurements or infer independent observations from several events of one person. Verify actual events and the first control through the production Validate path, including the shared Moon-context and period-lord result. This checks computational parity, not predictive validity. The private chart is evaluated separately from stdin and its data are not written to the repository.

The fixture is independent of the earlier Moon-gochara fixture; one scientist is related to a person used in an earlier unrelated chart fixture, but the selected scientist's chart and event were not used there. Selection across public figures remains biased toward accessible documents and is not a representative sample.
