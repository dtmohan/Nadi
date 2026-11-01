# KP and BNN reading audit protocol

These cases are a convenience sample of public, reported birth data not used in the earlier rectification fixtures. They were selected for different occupations and birthplaces before the new reading was run. An AA rating describes the reported source of a birth time, not proof that the time or an astrological interpretation is correct; A times are recollections and may be rounded. The fixture records the source and time basis for each case. A published career is not independent of the selection of a famous person.

The purpose is to check implementation and presentation, not establish that astrology predicts careers or fertility. The unchanged chart computation is run with Lahiri, mean nodes and the reported birth time. For each case, capture the BNN career headline and its displayed key findings, the children headline and notes, and the KP career overview. Then compare a before-change snapshot with the same script after the change. The known occupations below are fixed before inspecting the results:

* Hamilton, Wozniak and Turing: computing or technical work.
* Angelou: writing or poetry.
* Piaf and Rahman: music or performance.
* Kasparov: chess, competition or sport.

For a repeatable but deliberately coarse coverage check, a displayed headline or key finding counts as mentioning the category when it contains a word beginning with one of these stems: technical `engineer`, `technical`, `technology`, `information technology`, `software`, `comput`, `machine`, `mechanic`, `mathematic`, `research`, `electronic`; writing `writ`, `author`, `poet`, `publish`, `journalis`, `literar`; music `music`, `sing`, `vocal`, `perform`, `entertain`, `cinema`, `artis`; chess/sport `chess`, `sport`, `athlet`, `competition`, `competitive`, `game`. An author must be a complete word (or plural), not part of “authority”. These tests cannot tell whether a broad list would be useful or correct for a person. Report examples and misses, not just the totals; retain the entire generated output.

For children, review the output as a communication and scope check: it must not make unverified claims of infertility, child loss, assisted conception, number or sex of children, or treatment. Where a reliable public source confirms a child, record that fact only as a cross-check against categorical denial. Publicly unknown details are unknown, not negatives. The computer-generated checks cannot establish the absence of every problematic implication, so inspect the text as well.

For KP, inspect the actual houses used by the harmony, opponent and eleventh-cusp marriage rules where they fire and verify that their wording describes the implemented minimum, including any of the four possible houses. Verify that a reinstatement-specific finding is not promoted to a verdict about whether a career exists. This audit is not a new evaluation of the underlying source rules or of event prediction.

Run `node --import tsx scripts/eval-reading-cases.ts`. A personal chart is evaluated separately in a temporary local process; its birth data and output are not included in this fixture or results file.

After inspecting the seven-case development sample and fixing the matcher and presentation, a separate four-person sample was selected before running it: Lovelace and Mitnick (technical), Lee (music), and Neruda (writing). Run it with `node --import tsx scripts/eval-reading-cases.ts --fixture scripts/fixtures/reading-audit-holdout.json`. Results were subsequently visible while a historical time-zone error and general scope and wording issues were corrected, so this is not a clean final holdout. It is a small, non-random convenience sample; nobody was blind to the public occupations and the sources themselves can be uncertain.
