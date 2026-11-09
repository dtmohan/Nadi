# Rule audit: text, encoded condition, reading

This audit exists because the reading can be faithful to the rule **text** and still be wrong about the rule **condition**. The prose inherits the sentence; the engine inherits `when`. Where those diverge, the edge is smoothed.

The original audit-only pass covered the 420 rules in the Nadi/BNN layer. Subsequent fixes to the reading and the Jupiter-joins exception are described below; the latter can change live scores.

## Three questions per rule

1. **Text → condition.** Does the sentence state a condition, exception or qualifier that is not in `when`?
2. **Condition → text.** Does `when` use a relation, planet or extension that the sentence does not state?
3. **Reading → source.** Does the sentence preserve the source's caveat, or does it promote a provisional extension into the rule?

The first two are machine-assisted in [`scripts/rule-audit.ts`](../scripts/rule-audit.ts). The third is a manual read of the prose.

## First pass: 420 rules, 90 flags

| Flag | Count | Meaning |
|---|---:|---|
| **Silent extension** | 43 | The sentence says “linked by sign”; `when` includes the 2nd/12th adjacent-sign extension. |
| **Provenance** | 44 | The source field marks the adjacent-sign extension provisional; the sentence does not. |
| **Lost exception** | 2 | The text gives Jupiter a qualifying role; Jupiter is not in `when`. |
| **Conditional text** | 1 | The text says “if the Moon is weak”; no strength condition is encoded. |

The same rule can carry both a silent-extension and a provenance flag, so the counts overlap.

## 1. The 12th is doing three different jobs

| Layer | Includes the 12th? | What it does | Source |
|---|---|---|---|
| **Neecha Bhanga** | **No** | Dispositor/exaltation lord in a kendra from lagna or Moon; mutual kendras; dispositor aspect; navamsa lord; etc. | Phaladeepika 7.26-29; Jataka Parijata 7.13/14/20 |
| **Nadi strength** | **Yes** | A friendly planet in the 12th, 2nd, 7th or a trine counts as a friendly neighbour; a debilitated planet is “softened” and set to Neutral. | Rao’s basic rules / Naik, `shared/strength.ts` |
| **Rule relation weight** | **Yes** | The 12th-from link gets a 0.7 weight; it ranks the line. | App convention, `shared/bnn-relations.ts` |

The Neecha Bhanga engine in `shared/neechabhanga.ts` has **no 12th-house condition**. The `Debilitation softened: friend Sun and Moon support it · Naik` line is the **Nadi strength** layer, not Neecha Bhanga.

That strength layer sets:

```ts
friendNeighbours = [...conj, ...second, ...twelfth, ...seventh, ...trines]
effectiveDignity = "Neutral"
```

A friendly 12th therefore becomes a **cancellation-like set-aside**. The source says the 12th **indicates support or its absence**; it does not say a friendly 12th cancels debilitation. If classical Neecha Bhanga also applies, the chart can get both. This is the double-counting risk.

The rule-level `supportAxisNote` added in `shared/rules.ts` is separate: it is **note-only** and does not change the score.

## 2. The marriage trio fires through an adjacent-sign extension

The trio helpers in `shared/rules-female.ts` and `shared/rules-bnn.ts` use:

```ts
const NEAR = ["conjunct", "trine", "prev", "next"]; // prev = 12th from, next = 2nd from
```

The source comment is explicit:

> Rao: a trio “may be in one sign or 5th or 9th to each other” — trines count as combination.
> The adjacent-sign extension is this app’s provisional interpretation, not established by that quotation.

But the generated sentence is:

> “Mars, Moon and Venus **linked by sign (not necessarily in the same sign)**.”

The sentence hides the difference between:

- **source-approved** — same sign, trine;
- **app extension** — 2nd from, 12th from.

In a reference female chart:

- `f-t-ma-ra-ve` fires through **Rahu in trine** (source-approved) and **Venus in the 12th** (app extension). It is mixed provenance.
- `f-t-ma-mo-ve` fires through **Moon in the 12th** and **Venus in the 12th** — both app extension. There is no conjunction or trine to Mars. The rule is, in that chart, **entirely an adjacent-sign extension**, yet the reading presents it as “the rule reads.”

The source string says “adjacent-sign extension provisional”; the sentence does not. That is the provenance gap.

**Fix direction:** carry an `extension: true` flag on the finding and make the sentence say “the app’s adjacent-sign extension” when it fires through `prev`/`next`. Do not average it with a source-approved conjunction/trine.

## 3. Exceptions in the text are not in `when`

| Rule | Text edge | Encoded `when` | Consequence |
|---|---|---|---|
| `f-ma-ke` | “misunderstandings … unless Jupiter joins” | Mars–Ketu only | Jupiter’s exception is not checked. |
| `f-t-ma-ke-ve` | “Jupiter’s aspect on the combination brings compromise” | Mars–Ketu with Venus | Jupiter is not checked. |
| `f-t-ma-sa-ra` | “Jupiter’s aspect minimises it” | Mars–Saturn with Rahu | Jupiter is not checked. |
| `f-ma-mo` | “misunderstandings if the Moon is weak” | Mars–Moon relation only | The Moon’s strength is not checked. |

These are **lost edges**, not wording problems. Either the engine should encode the qualifier or the reading must carry it explicitly; it currently does neither.

## 4. The 0.7 is a weight, not support

`BNN_RELATION_STRENGTH.prev = 0.7` is a relation weight. `shared/grade.ts` says the sign relation is **weight** and does not set the grade. The “supports” in the strength line is a separate Nadi strength note.

The 12th-support note is now derived in `shared/reading-prose.ts`; it is note-only. It does not change the weight or the score.

## What the audit found

1. **Extension becomes rule.** The adjacent 12th/2nd connection was printed as “linked by sign,” indistinguishable from a source trine. The reading now labels the extension/mixed provenance.
2. **Support becomes cancellation.** A friendly 12th in the Nadi strength layer sets effective dignity to Neutral even though it is not Neecha Bhanga. **Open.**
3. **Exception disappears.** The Jupiter-joins exception is now encoded and labelled as tested. Jupiter-aspect and weak-Moon qualifiers remain untested and are labelled accordingly.
4. **Weight becomes support.** The 0.7 relation weight is now kept separate from the reading’s support note.

## Next slices

- Decide whether and how to encode the two Jupiter-aspect qualifiers and the weak-Moon qualifier; until then, the reading explicitly marks them untested.
- Separate `nadiSupport` from `effectiveDignity`; no 12th-only cancellation.
- Audit the house rules, Parashari findings, Jaimini and KP with the same three questions.
- Audit source paraphrases against the cited texts, starting with the Naik 12th-support passage and Rao’s trio statement.

## Reproduce

```bash
npx tsx scripts/rule-audit.ts
```

The output is JSON: `totalRules`, `flags`, `byKind`, and the flagged rows with the rule text, the encoded `when`, and the source.

## Fixes in this pass

- **`f-ma-ke` encodes “unless Jupiter joins”** as `when.without = { planet: "Jupiter", relation: ["conjunct"] }`. The source line also contains a separate job/detachment statement. When Jupiter conjoins Mars or Ketu, the evaluator retains that unqualified statement once, with the same base rule weight, and explicitly notes the tested exception to the relationship warning. This deliberately restores one finding when the earlier all-or-nothing implementation suppressed it; it does not add a second score. The existing weight of 3 is an app scoring convention, not a number stated by the source; retaining that full weight can change live marriage synthesis and event scores compared with the earlier all-or-nothing implementation. The immutable historical snapshot strips the new condition before hashing and its stored hashes are not regenerated.
- **`PlanetStrength` now has a separate `nadiSupport` field.** A friendly 12th is recorded there, not called Neecha Bhanga. `effectiveDignity` still becomes Neutral for the historical snapshot; the score split remains a model-version decision. The reading labels the note “Nadi support; not a Neecha Bhanga cancellation.”
- **Provenance is derived from the structured directed planetary relations**, not from grade-explanation text, and is not stored on `Finding`, so historical grade outputs stay unchanged. This retains conjunct extra companions as well as adjacent edges. When an edge cannot be recovered, its provenance is marked unresolved rather than guessed.
- **Qualifiers are derived in the reading** from the rule text: “unless Jupiter joins”, “Jupiter’s aspect …” and “if the Moon is weak.” The Jupiter-joins case is encoded and identified as checked; the aspect and weak-Moon cases remain reading-only and are identified as untested.
- **The Nadi support note is labelled in the reading**: “Nadi support: … this is not a Neecha Bhanga cancellation.” `effectiveDignity` is still set to Neutral by the Nadi strength layer; the split is not a score change yet.
- **The 12th support note is in the reading**, not in the grade reasons, so it does not alter the historical grade snapshots.

The audit flags remain in the script because the rule text still says “linked by sign” and the `when` still includes the extension. The reading now carries the provenance that the text alone does not.

The first pass is not a verdict on the 420 rules. It is a map of where to look.
