# Design: a shared, school-aware natal context

The user asks whether every planet could carry its relationships and applicable school rules so
that any reading can retrieve the same context. **Yes, as a shared queryable context, with
separate school-specific interpretations.** A single universal interpretation or duplicated
nested planet objects would mix incompatible assumptions and make updates hard to audit.

## Proposed layers

1. **Chart facts and provenance.** An immutable chart instance holds the birth instant, place,
   time standard, ayanamsa, node and sunrise conventions, house method, calculation version and
   source quality. Its planet, node, ascendant, cusp and calculated-point records have stable
   identifiers and positions in a named frame. A divisional chart, an event sky, and a horary
   chart are separate frames: a current transit must not become a natal fact.
2. **Typed relationships.** A directional relationship connects IDs, not embedded copies of
   other planets. It carries its kind, source and target, reference frame, calculation convention,
   value and provenance. For example, a Parashari full sign aspect, a BNN sign/retrogression
   relationship, a Jaimini rasi aspect and a KP star/sub-lord chain are distinct edges; no one is
   silently substituted for another. A conjunction is not automatically an aspect. House and
   point relationships can involve cusps, sphutas and Gulika as well as planets.
3. **School-specific rule evaluations.** Rules refer to facts/edges and declare their school,
   source and interpretation, required inputs, applicability, frame, convention, version,
   evidence, and whether the rule was satisfied, not satisfied, or cannot be evaluated. Natural
   benefic status and functional lordship are separate assessments. A rule belonging to one
   school does not become authoritative in another merely because both refer to Jupiter.
4. **Readings and event checks.** A reading requests the applicable rule results and presents
   their evidence and limitations. Event timing, validation and rectification can share an
   evaluator when their inputs and purpose match. Rules used in an exploratory comparison do not
   automatically add score points or become probability estimates. Repeated evidence must be
   identifiable, rather than counted twice just because multiple rules consume the same edge.

For example, a Jupiter record can be queried for its fifth-aspect relation to Gulika *in a
specific Lahiri D1 frame*. The same person may have KP positions computed with a different
ayanamsa and cusps; a D7 version has another frame; a query chart requires its actual question
instant and location. These cannot safely be embedded as one timeless, school-independent
property of Jupiter.

## Implemented migration

Nadi already has a `PlanetPosition` structure, BNN relationship evaluations, KP natal frames,
Parashari house and divisional evidence, and a rule-qualification inventory. However,
`PlanetPosition` currently contains computed dignity and a Nadi-specific combustion convention,
and KP builds its own KP-ayanamsa frame. Those fields cannot be assumed to mean the same thing
in every school.

[`planet-context.ts`](../shared/planet-context.ts) now snapshots a single frame and its planet
positions, indexes same-sign company and whole-sign houses, and provides separate directional
BNN, Parashari and Jaimini relationships. It records supplied frame metadata and snapshots KP
cusps when present. `kpNatalFrame` rejects a specified non-KP ayanamsa, a different house method
or mismatched stored cusps. A lite position frame cannot be used for the BNN retrograde-entry
calculation. An unspecified legacy array has explicitly unknown provenance, rather than a
fabricated birth or question instant. Point aspects, including Gulika, use the same directed
Parashari relationship helper.

[`divisional-planet-context.ts`](../shared/divisional-planet-context.ts) derives a separately
identified sign frame for D1 or a division, with its own ascendant, house positions and
full-sign aspects. Its original longitude is explicitly called `natalLongitude`; no divisional
longitude is invented. It rejects a transit frame or a mismatched natal ascendant. Manley period
links, the D1/divisional foundation and the event-house evidence use these same sign frames,
both in ordinary natal evidence and per-candidate event checks.

The main BNN, KP, Jaimini, Parashari, ALP and Prasna house evaluators now accept the context.
The chart calculation, natal projections, validation and each rectification candidate construct
their own matching natal and KP frames. A BNN pair is calculated by one extracted implementation
and cached only within that immutable frame. Random-date trials continue to use the same event
scorers with their own event instants and skies; no cross-candidate rule cache was introduced.
The client also uses a separately labelled transit snapshot for the stored-sky Prasna view; it is
not presented as a verified question chart.

[`planet-rule-context.ts`](../shared/planet-rule-context.ts) indexes already-fired, already-gated
school results by an explicitly identified planet, including source and frame information. It
distinguishes a school that was not evaluated from one with no matching finding, keeps ALP's
reading date and Jaimini's D1/D9 label, and rejects a KP result paired with a non-KP frame. Its
KP adapter also exposes the planet's sign, star, sub and finer lords, cusp house, owned houses,
four-step significators and cusps for which it is sub-lord, with frame-consistency checks. It
does not infer every indirect dependency from rule prose: for instance, KP attribution currently
indexes the cusp sub-lord, and the Prasna adapter covers the entered house effects. Practitioner
mode shows a short version for the displayed planets in the Overview. The index is descriptive;
registering a rule does not automatically add points or bypass age and sensitivity gates.

[`school-rule-paths.ts`](../shared/school-rule-paths.ts) and the Rule Book record which principal
families are shared, natal-only, separate methods or not implemented. The existing
[`rule-qualifications.ts`](../shared/rule-qualifications.ts) is still a selected KP/Parashari
inventory, not a universal rule executor. Individual submodules continue to receive the frozen
position array through compatibility adapters; they have **not** all been rewritten as typed
graph predicates. Parashari's full ordinary house and yoga catalogue and KP's full natal rule
catalogue are not automatically evaluated as event scores. BNN has no event-based Rectify
method; ALP and Prasna do not have equivalent Validate event scorers. These are explicit gaps,
not evidence that the conditions fail.

## Verification and follow-up

The migration is tested against full pre-migration outputs for three synthetic charts across
six schools, multiple ayanamsas, both node methods and all three Parashari house options.
Additional tests cover immutable snapshots, school-specific relationship direction, incorrect KP
frames, per-planet attribution, a candidate's Jaimini/BNN paths, KP/Parashari natal and dated
parity, and deterministic comparison trials. `scripts/benchmark-rectify.ts` checks the existing
scan workload. These checks establish code consistency for their covered inputs, not predictive
validity or universal coverage of astrological rules.

Further migration should qualify one additional rule family at a time, including its required
frame, inputs, provenance, source and output state, then explicitly connect and test each
appropriate reading and event path. No cache may be shared across charts without keys covering
the complete birth/frame settings, event or as-of inputs, and calculation/rule versions. A
separate source review and fresh-case test are required before changing a score or treating an
unimplemented method as available.
