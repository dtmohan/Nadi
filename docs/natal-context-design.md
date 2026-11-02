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

## Practical migration

Nadi already has a `PlanetPosition` structure, BNN relationship evaluations, KP natal frames,
Parashari house and divisional evidence, and a rule-qualification inventory. However,
`PlanetPosition` currently contains computed dignity and a Nadi-specific combustion convention,
and KP builds its own KP-ayanamsa frame. Those fields cannot be assumed to mean the same thing
in every school.

This change adds a **small first step**, not a whole-application migration:
[`point-relations.ts`](../shared/point-relations.ts) represents a directional full sign aspect
or same-sign relationship, and [`gulika-clues.ts`](../shared/gulika-clues.ts) uses it for the
Prasna birth-chart comparison and its holdout. It is explicitly labelled by convention and does
not change KP, BNN, Jaimini, existing event scores or rectification. The existing
[`rule-qualifications.ts`](../shared/rule-qualifications.ts) is an inventory for selected KP and
Parashari research, not yet a universal execution registry.

A migration should proceed one school and one frame at a time, starting with read-only adapters
that prove parity against current results. Cache keys must include all relevant birth and frame
settings, any as-of/event inputs, and calculation/rule versions. A rule should be enabled in a
new reading only after its scope is qualified and tests cover natal versus horary, alternate
ayanamsas, alternative house methods, conjunction versus directional aspect, missing inputs and
date-dependent context. Existing chart, validation, rectification and random-date pathways must
be checked for parity before a shared rule changes those workflows.
