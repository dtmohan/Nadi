# The Reading Room

A design fork of Nadi: a new editorial surface over the same computed chart, and a deterministic prose layer that turns the rule engine's fragments into a reading a person can follow.

The workbench stays where it was. The room is the **primary entry after casting**: the chart header makes **Reading room** primary, the saved-chart card opens it, and the guided reader links across. The room lives at:

```
/#/chart/:id/room
/#/chart/:id/room/working
/#/chart/:id/room/critical
```

![The Reading Room at desktop width](reading-room/desktop.png)

## Why a separate room

The existing chart page is a workbench: ten tabs, each faithful to one school, each with its own working. That is the right shape for checking a rule. It is not the shape of a reading.

The review's finding was that Nadi already computes the apparatus — the rule, the source, the grade, the provisional marks — and keeps it one toggle away in Practitioner. The room keeps that finding but changes the hierarchy: **the prose first, the evidence at the claim, the working one layer down, and the apparatus at the end.**

The three layers are explicit:

- **Reading** — the argument, with source marks and a "Why this" link at the edge.
- **Working** — the same argument, plus the rule text, score, grade and source that carry each paragraph.
- **Critical** — the working, plus the grade reasons, birth-time band notes, the school methods and the provenance.

The layer lives in the URL, so a reader can link to a working paragraph or a critical view.

## V2: four chapters, eleven areas

The first release read five areas. V2 reads the whole life without becoming eleven equal sections.

| Chapter | Life areas | What it does |
|---|---|---|
| **The native** | self, health | The person first; the body as a traditional indication, not a diagnosis. |
| **Work & means** | career, authority, wealth | The working life, public standing and money as separate questions. |
| **Bonds** | marriage, children, family | The chapter where disagreement is the finding; family is read member by member. |
| **Mind & meaning** | education, spirituality, travel | The descriptive areas: learning, inner life and distance. |
| **Time** | — | The Vimshottari period, the sub-period and the slow sky, as clocks rather than events. |
| **The schools** | — | The comparison of bases: five general topics × four schools, no vote. |
| **The apparatus** | — | Sources, caveats, provenance, school cards, marks and citation. |

Every one of the eleven areas sits in the **contents rail**, nested under its chapter, with a small tone mark. The rail jumps to the area's paragraph. The chapter is the argument; the contents rail is the completeness.

**In brief** is a run-in epigraph under the standfirst: one sentence per chapter, generated from the same tones and period. It is part of the header, not a card. The five-line summary survives as the data behind it.

The **chapter preamble** is now the technical frame in the reading: the lagna and relevant houses, their lords and occupants, degrees, dignities and strength, the Jaimini karakas (with D9), and the KP cusp and sub-lord. It assumes the reader knows **lagna, bhava, lord, karaka, D9, dasha, bhukti, pratyantar, bindus and cusp sub-lord**. It does not gloss them. The per-area Parashari frame remains in Working.

**Jaimini** contributes AK/AmK/DK/PK and their D9 signs; **KP** contributes the cusp sub-lord and its verdict — often “no general verdict fires.” ALP is still not mapped, and Prasna Marga is not a natal voice; both stay out of the prose rather than being forced in.

## The practitioner register

This is the deliberate split:

- The **guided reader** (`#/chart/:id/reading`) is the plain, bilingual, one-theme-at-a-time entry.
- The **full room** is the practitioner edition. It assumes the terms; it gives the chart facts before the interpretation; the glossary is for the app's own conventions, not for the tradition's vocabulary.

Each chapter now has three registers:

1. **The preamble** — technical, muted, at the top of the chapter: houses, lords, degrees, dignities, strength, Jaimini, KP.
2. **The area paragraphs** — the human argument: claim, the area's fixed structure anchor, the reviewed Nadi lines, bridge, limit.
3. **The coda** — a short closing paragraph, marked with a vermilion square, that states the chapter's pattern across its areas.

The reading is longer because it is no longer a trailer. The Einstein chart runs to roughly 1,900 words and nine or ten minutes; the preambles carry the facts a practitioner would otherwise look up in the tabs, and every area names its configuration in its own fixed form.

## The prose layer

`shared/reading-prose.ts` is the enrichment module. It is pure and deterministic: the same chart always produces the same prose, and the prose never adds a rule that the engine did not compute. The fixed structures live in [`shared/reading-lexicon.ts`](../shared/reading-lexicon.ts); the editorial rules are in [prose-lexicon.md](prose-lexicon.md).

```ts
const input = buildReadingInput(result); // synthesise + agreementFor + briefingFor + readerExperience
const doc = composeReading(input);       // chapters, summary, index, comparison, timing, provenance
```

Each chapter follows the same movement:

1. **Technical preamble** — the houses, lords, degrees, dignities, strength, Jaimini and KP facts, in the reader's own vocabulary.
2. **Area claim** — what the chart says about the area: "Work is the chart's most public fact", "Marriage is where the chart becomes an argument", "The body asks for care rather than confidence."
3. **Structure anchor** — the combination in the form fixed for that area: "The configuration is Saturn, Mercury and Ketu linked by sign"; "The weight sits in the Sun with Saturn."
4. **Reviewed Nadi lines** — every selected paraphrase from the upstream reader, not just the first: "Another source names computing, coding, statistics and research…"
5. **Bridge** — the writer's sentence that says what the testimonies mean together, where the sources support one.
6. **Limit** — what the reading will not claim: "The app does not average the two", "It is a traditional indication, not a diagnosis", "It names a direction, not an appointment."
7. **Coda** — a short closing paragraph that states the chapter's pattern: the 10th lord in the ninth, the 2nd lord in the sixth, the 11th lord in the eighth. It is marked with a vermilion square.

The details that make it read like English rather than a table:

- **Role-aware naming.** Jupiter is "the Jeeva", Saturn "the Karma", Venus "the Kalatra" in a male chart and the spouse karaka in the app's frame. The writer expands the rule's shorthand without overloading the sentence.
- **Fixed structures, controlled variation.** Every area's claim, anchor form and limit are fixed in the lexicon; no structural choice is random. Only the evidence frames vary deterministically, and the variation never changes the argument.
- **Given/new.** The lead starts with the birth, the rising sign and the chart's centre of gravity; later sections refer back to "the tenth" and "the same working signature" instead of re-listing positions.
- **A lexicon, not a phrase picker.** The eleven claims are unique; the anchor forms are distinct; the tone words are topic-specific. "Clearest line", "The line is" and the generic "The chart offers these as directions" are banned by the lint, and "well supported" is allowed once, not six times.
- **Source fidelity.** The rule text is never rewritten into a stronger claim. The prose paraphrases the gist and leaves the exact sentence in the evidence drawer.
- **Uncertainty in the grammar.** A contested area is allowed to be an argument; a provisional rule keeps its mark; a calculation's grade is in the working, not hidden in a footnote.
- **No forecast.** The timing section names the period and the sky and says, in the same breath, that the app does not turn them into an event.

For the Einstein chart the reading is about 1,900 words and nine or ten minutes, with eleven area paragraphs, four technical preambles and four chapter codas. The lead is:

> Albert Einstein was born on 14 March 1879 at 11:30 local time in Ulm, Baden-Wurttemberg, Germany, with Gemini rising at 19°28′. The chart's centre of gravity is Jupiter, the Jeeva, standing alone in Aquarius at 5°19′. Pisces — the tenth sign from the rising — gathers the Sun, Mercury, Saturn, and Venus, which is where the work theme begins. The Moon is in Scorpio, Jyeshtha 2, the sixth house from the rising.

## The display modules

- **The chart card.** The South Indian D1 stays beside the prose at wide widths; below 900px it becomes a Chart button and a focused modal. It is the same chart as the workbench, not a decorative ring.
- **Chapters with a spine.** The chart, the native, work & means, bonds, mind & meaning, the schools, time, the apparatus. Each chapter has a number and a rule above it; each area has a subheading.
- **The marginal spine.** At wide widths, a vertical folio runs down the outer margin — the room's signature, not an app chrome.
- **In brief and the contents rail.** The summary is a run-in epigraph; the eleven areas are nested in the contents rail, not in a card grid. The rail is also the chapter navigation.
- **The preamble and the frames.** Each chapter opens with the technical preamble; every area still carries its Parashari house frame in Working, and each chapter carries the Jaimini and KP lines.
- **Why this.** Every paragraph with evidence carries the mark types and a button that opens the exact rule text, source and grade.
- **The comparison.** Five general topics × four schools. Each cell is the school's own verdict and the object it judged; the row carries the combined reading. No vote is counted. Life span is a separate, gated topic and is not folded in.
- **Time.** The Vimshottari period, the sub-period, the third-level period, and the slow sky, as a structured timeline, not forty pages of paryanthar prose.
- **The apparatus.** The sources with citation counts, the caveats, the provenance, the school cards, the evidence legend, and a copyable citation.
- **The fingerprint.** A local checksum of the birth data and ayanamsa, so the same reading can be recognised. It is explicitly not a cryptographic manifest.

![The chapter preamble in the practitioner register](reading-room/chapter.png)

![The contents rail doubles as the eleven-area index](reading-room/contents.png)

![A practitioner chapter on a phone](reading-room/mobile-chapter.png)

![Working layer: the frame, the rule text and the source](reading-room/working.png)

![The comparison basis, not a vote count](reading-room/schools.png)

![The evidence drawer](reading-room/drawer.png)

## Evidence marks

The marks are the review's five kinds, plus the silent case:

| Mark | Meaning |
|---|---|
| **Source** | A rule with a named source. |
| **Provisional** | The rule, or the app's extension of it, is provisional. |
| **Calculated** | The app's grading changed the weight; the reasons are in the working. |
| **Statistical** | A statistical comparison; sampling and protocol matter. |
| **App convention** | A convention, not a rule from the tradition. |
| **Silent** | No rule fires, or the school does not read the topic. |

## Run and verify

```bash
cd nadi-reading-room
npm install
npm run dev
```

Open a saved chart, then choose **Reading room** beside Report. If you want the Einstein fixture, the test composes it from `scripts/fixtures/einstein.json`; the browser needs the chart in its own Cache Storage, as the app's privacy model requires.

```bash
npm run check
npx tsx --test scripts/reading-prose.test.ts
npm run build
```

The three prose tests check the chapter shape, the four preambles and codas, all eleven area paragraphs and their frames, the five-line summary and the eleven-area contents, determinism across two compositions, the lexicon lint (no "clearest line", no universal "The line is", small allowances for repeated tone words), unique area claims, and the presence of source, provisional and calculation marks.

A teardown of a mainstream 108-page Parashari report, and what to borrow or avoid, is in [mainstream-reference.md](mainstream-reference.md).

## What this is not

- It is not an LLM. The prose is deterministic and source-bound; there is no free-form generation.
- It is not a new astrology engine. Every claim comes from the existing `synthesize`, `agreementFor`, `briefingFor` and `readerExperience` outputs; the upstream guided reader supplies the reviewed Nadi prose and the school chart contexts.
- It is not the final critical edition. Edition, page, Sanskrit variant and the app's decision are still not attached to each sentence in a formal apparatus; the drawer is the first layer of that.
- It is English-only. The upstream guided reader is bilingual and plain; the full room is the English practitioner edition and does not yet carry Malayalam through its prose.
- It is not tested with readers. The prose is a design hypothesis about how this data can be made human; the next test is a reading group, not another screen.
- It does not include remedies, Prasna, or an ALP life reading. Those are separate tools, not natal voices, and forcing them into the prose would repeat the mainstream report's mistake.

## Light and dark

The room uses the app's theme tokens; there is no separate palette. The drop cap, the rules and the chart colours all come from the same set.

![The room in dark mode](reading-room/dark.png)

![The room on a phone](reading-room/mobile.png)

![The chart on a phone](reading-room/mobile-chart.png)
