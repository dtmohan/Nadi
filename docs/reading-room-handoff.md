# Reading-room handoff

Branch: `reading-room-v2`
Base: upstream `6a6274f` (Expand Malayalam reports and technical readings)
This branch contains the reading-room work and the rule audit. It is not a proposal to merge into `main` without review.

## Please preserve these decisions

1. **The 12th is not a Neecha Bhanga condition.** Neecha Bhanga lives in `shared/neechabhanga.ts` and uses the classical conditions (dispositor/exaltation lord in a kendra from lagna or Moon, mutual kendras, dispositor aspect, navamsa lord, later-practice additions). The Mars Neecha Bhanga in the reference chart is Saturn in the 1st, an angle — not the Moon or Venus in the 12th.

2. **Nadi support is a separate layer.** `PlanetStrength.nadiSupport` records friends in the 2nd/12th/7th/trines. The reading calls this “Nadi support; not a Neecha Bhanga cancellation.” `effectiveDignity` still becomes Neutral for the historical snapshot; a score split needs a model-version migration, not a silent hash rewrite.

3. **`unless Jupiter joins` is encoded.** `f-ma-ke` has `when.without = { planet: "Jupiter", relation: ["conjunct"] }`. The immutable school-context snapshot strips this new condition before hashing. Do not remove that strip; the live rule keeps it.

4. **The trio’s 12th/2nd connection is an app extension.** `NEAR` in `rules-female.ts` and `rules-bnn.ts` includes `prev`/`next`; Rao’s stated trio is one sign, 5th or 9th. The reading derives `source` / `mixed` / `extension` provenance and says when a rule fires only through the adjacent extension. Do not print “linked by sign” as if the extension were source.

5. **Jupiter-aspect and weak-Moon qualifiers are reading-only.** The rule text’s condition is carried as a qualifier; it is not silently dropped, but it is not yet an engine check. Do not describe those as tested.

6. **The 0.7 relation weight is an app convention.** It is not a number from Naik and it is not the 12th-support rule.

7. **The historical school-context fixture is immutable.** `scripts/school-context-legacy.test.ts` strips new fields/conditions to compare the old baseline. Do not regenerate its hashes to make a semantic change pass.

## Verification

- `npx tsc --noEmit`
- `npm test` — 692 tests on this rebase
- `npm run build`

The build is about 5.0 MB because of the Malayalam catalogues.

## Open work

- `effectiveDignity` is still Neutral for Nadi support; score separation needs a versioned migration.
- Jupiter’s aspect and “if the Moon is weak” are still reading qualifiers, not engine conditions.
- The new audit language is English-only; the Malayalam reader/report does not yet carry it.
- The docs screenshots and word count predate the latest notes; the room currently reads about 2,754 words / 14 minutes.
- House, Parashari, Jaimini and KP rule families still need the same three-way audit (text → condition → reading).

See `docs/rule-audit.md`, `docs/nadi-12th-support.md`, `scripts/rule-audit.ts` and `scripts/rule-audit.test.ts`.
