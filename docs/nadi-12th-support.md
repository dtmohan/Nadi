# The 12th as the support axis

## What the source says

Satyanarayana Naik, *Naadi Jyotisha (Based on Bhrigu Nandi Nadi System)*, chapter 2, rule 4:

> A planet in a sign will undergo modifications as per the planets posited in 2nd and 12th sign from it. The signification of a planet in 2nd sign indicates the nature of matter and the planet in 12th sign will indicate whether it is supported or not.

And later, on p. 77:

> In Navagraha Naadi studying a planet means, to select a planet for required matter and note the karakatwa of planets situated in trine, 2nd, 12th and 7th to a selected planet.

Source PDF: [Revelation from Naadi Jyotisha](https://archive.org/download/RevelationFromNaadiJyotisha/Revelation%20from%20naadi%20jyotisha.pdf), pp. 12 and 77.

This is **Navagraha Nadi**, not Parashari. In Parashari the 12th is a dusthana (loss, expenditure, foreign, dissolution); a planet there is not a general support, and the 12th is not a graha aspect. Specific 12th-house combinations can give positive results, but there is no universal support rule.

## What the app was doing

`shared/bnn-relations.ts` gives the 12th-from relation a weight of **0.7**:

```ts
conjunct: 1, trine: 0.75, prev: 0.7, next: 0.65, opposite: 0.5, none: 0
```

That is a **relation weight**, not a support test. `shared/grade.ts` says the sign relation is printed as weight and ranks the line; it does not set the grade, and the weights are the app's own convention.

So in a grade such as:

> with Venus in the 12th from Mars ×0.7

the `0.7` means “Venus is linked to Mars from the 12th, at this weight.” It does **not** mean “Venus supports Mars.” The “supports” in the next line —

> Mars: debilitation softened: friend Sun and Moon support it

— is the **Neecha Bhanga/strength** note, a separate mechanism.

## What the support axis actually asks

The 12th indicates support or its absence through the **occupant**, not through the house number alone:

- Is the 12th planet a friend or an enemy of the subject?
- Is it a natural benefic or malefic?
- Is it strong, dignified, combust, retrograde?
- Is it functionally benefic for the matter?

The reading now adds a **provisional support note** beside the weight, using natural friendship and natural benefic status:

```ts
// shared/rules.ts
supportAxisNote(planet, subject)
```

It is a `note`, not a score change.

## The two marriage rules

- `f-t-ma-ra-ve`: Mars / Rahu / Venus. Venus is in the 12th from Mars; Venus is a natural benefic but **not a friend** of Mars in the Nadi friendship table. The note reads **mixed support**. Rahu is in trine to Mars — a close link, not a 12th support. The rule remains a strain rule (hostility/unsettled marriage).
- `f-t-ma-mo-ve`: Mars / Moon / Venus. The Moon is in the 12th from Mars; the Moon is a **friend and a natural benefic**, so the note reads **supportive**. Venus is also in the 12th, but is **mixed**. The rule remains a strain rule (late marriage/misunderstandings).

The two rules are therefore not equally supported even though both carry two `0.7` links. The app previously flattened that difference into the relation weight.

The 0.7 weights and the grade scores stay unchanged. A supportive 12th qualifies a strain rule; it does not turn the rule into a promise. This is consistent with a long marriage that has both support and friction.

## Not Neecha Bhanga

The 12th is **not** a Neecha Bhanga condition. `shared/neechabhanga.ts` contains the classical conditions — dispositor/exaltation lord in a kendra from the lagna or Moon, mutual kendras, dispositor aspect, navamsa lord, and the later-practice additions — but no 12th-house clause.

The line `Debilitation softened: friend Sun and Moon support it` comes from `shared/strength.ts`, whose `friendNeighbours` includes the 2nd, 12th, 7th and trines. That is a **Nadi strength** note. It is not a classical cancellation, and the app should not present it as one. The line now says “Nadi support: … this is not a Neecha Bhanga cancellation.”

The strength layer still sets `effectiveDignity = "Neutral"` from those friends. That is the remaining overreach: support is being converted into a cancellation-like set-aside, and can double-count with a real Neecha Bhanga. The next engine change is to separate `nadiSupport` from `effectiveDignity`.

## Limits

- The support mapping is **provisional**: natural friendship and natural benefic only. It does not yet use functional benefic/malefic status, dignity, combustion or strength.
- The source says the 12th **indicates** support; it does not prescribe the app’s friend/benefic mapping.
- The relation weight remains the app’s own convention, not a number from Naik.
- The 12th support note appears in the reading edge note; it is not a separate score and does not change which lines print.
