# The prose lexicon

The room no longer picks a phrase variant at random. Each area has **one fixed rhetorical structure**, a controlled set of anchor forms, and a limit. The structure follows the area's tone; the wording follows the grammar rules below.

The code is [`shared/reading-lexicon.ts`](../shared/reading-lexicon.ts); the lint is [`shared/reading-lint.ts`](../shared/reading-lint.ts).

## Structures

| Tone | Shape | What it does |
|---|---|---|
| **Supportive** | claim → signature/configuration/weight/hinge/support/direction → evidence → limit | names the productive combination, then stops it becoming a promise |
| **Care** | claim → caution/strain → evidence → limit | names the weak point and what supports it |
| **Contested** | claim → first rule → second rule → no average | keeps two readings in view without a verdict |
| **Quiet** | claim → small mark → no individual claim | says the chart is describing a link, not a person |
| **Descriptive** | claim → one testimony → another → keep separate | prevents a family verdict |

## The eleven areas

| Area | Claim | Anchor form | Close | Status |
|---|---|---|---|---|
| Self | The native is warmly marked. | The chart's signature is this: … | It is a temperament to work with, not a verdict. | well supported |
| Health | The body asks for care rather than confidence. | The caution sits in … | It is a traditional indication, not a diagnosis. | a caution |
| Career | Work is the chart's most public fact. | The configuration is … | It names a direction, not an appointment. | a strength |
| Authority | Standing is unusually clear. | The weight sits in … | It describes a public weight, not an office. | clear |
| Wealth | Money follows the work. | It turns on … | It is a reading of means, not a promise of gain. | supported |
| Marriage | Marriage is where the chart becomes an argument. | — (two rules) | It is a contested reading, not a verdict on the marriage. | contested |
| Children | Children are lightly marked. | The mark is small: … | It is a light mark, not a claim about children. | lightly marked |
| Family | Family is a set of separate testimonies, not one verdict. | One testimony reads: … | It keeps the testimonies separate. | read separately |
| Education | Learning asks for care rather than confidence. | The strain shows in … | It is a caution about the instrument, not a limit on the mind. | a caution |
| Spirituality | The inner life carries unusual support. | The support sits in … | It is a direction, not a doctrine. | supported |
| Travel | Travel is one of the chart's open directions. | The direction is … | It is an opening, not an itinerary. | open |

## Grammar rules

1. **No universal "line".** Use *signature, configuration, weight, hinge, support, direction, caution, strain, mark, testimony*. "Clearest line", "the line is" and "the chart's line" are banned by the lint.
2. **One claim per area.** Claims are unique and are not varied by tone alone. A new claim is a lexicon change, not a random pick.
3. **Articles for the luminaries.** *The Sun* and *The Moon*; *Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu* without "the". Never "the Mars".
4. **Lords take commas.** "its lord, the Moon, is in the sixth"; "its lord Mars is in the eighth".
5. **Houses are ordinal words.** "the tenth", "the sixth"; not "the 10th house" in prose. Degrees use ° and ′; nakshatras and padas use their names.
6. **Karaka labels stay compact.** "AK Venus in Pisces (tenth), D9 Aquarius"; "AmK", "DK", "PK". The preamble may assume them.
7. **Dashas are named.** *dasa, bhukti, pratyantar, Chara dasha*; do not flatten them to "period".
8. **Limits are topic-specific.** No shared "The chart offers these as directions" close.
9. **Tone words are topic-specific.** "Well supported" appears once (self), not six times. "Work is a strength", "money is supported", "standing is clear".
10. **Factual repetition is allowed; rhetorical repetition is not.** A preamble may repeat "in the tenth" because it is stating the chart. The prose may not repeat a metaphor.

## The test

`scripts/reading-prose.test.ts` runs `lintProse` over the full reading. It also checks that every area's opening claim is unique. The current allowances are intentionally small: "well supported" ≤ 2, "asks for care" ≤ 2, "It holds" ≤ 1, and the banned forms at zero.
