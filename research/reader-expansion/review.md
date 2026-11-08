# Reader presentation review, 7 November 2026

This is a review of presentation and translation fidelity, not a test of whether astrology predicts life outcomes. The input list and individual birth-data sources are in [cases.json](cases.json). Run `node --import tsx scripts/eval-reader-expansion.ts` to reproduce the full structured output at the fixed reading instant in that manifest. The evaluator uses the actual chart engine and reader adapters; it does not contain the user's private chart.

Five public cases were selected for a variety of countries, occupations and backgrounds before their reader outputs were inspected. Translations were then expanded using those cases and the full catalogue of possible plain Nadi themes. Theodore Maiman was added afterward, before examining his output, as a fresh presentation check. These are famous people selected with knowledge of their careers: the sample is neither blinded nor representative, and the six cases do not establish predictive accuracy. Birth times and historical time zones have not been independently authenticated. A source's AA label describes its reported documentary provenance, not a guarantee of minute-level accuracy.

## What the displayed career alternatives said

All three selected Nadi themes are included below, including alternatives that do not match the known career. A broad overlap among many alternatives is weak evidence, not a successful prediction.

| Person | Selected work themes, condensed from the displayed reader | Comparison with independently documented work |
| --- | --- | --- |
| [Julia Child](https://hollisarchives.lib.harvard.edu/catalog/sch00222) | Advice/teaching/law/finance/religious institutions; technical/computing/healing/research with interruptions; public/food/liquids/shipping/travel with changing routines. | Teaching and food overlap her documented work as a cooking teacher and author; the other occupational possibilities remain in the reading. |
| [Catherine Deneuve](https://www.festival-cannes.com/p/catherine-deneuve/) | Police/defence/government engineering/administration; early work and responsibility; changes of field or reversals. | The selected career alternatives do not identify her work as a film actor. |
| [Evelyn Glennie](https://www.evelyn.co.uk/about/) | Changes of field or reversals; steady respected work and responsibility; public/food/liquids/shipping/travel. | Public work and travel are broad overlaps, but the selected career alternatives do not identify solo percussion or composing. Her education themes mention arts and music separately. |
| [Rajiv Gandhi](https://cms.rajyasabha.nic.in/UploadedFiles/ElectronicPublications/Rajiv.pdf) | Advising/teaching/finance/arts; technology/foreign or unconventional and high-risk fields; communication/IT/trade/aviation/intellectual work. | Aviation overlaps his airline-pilot work. The broad lists do not by themselves identify his later role as prime minister. |
| [César Chávez](https://www.nps.gov/articles/000/new-era-of-farm-worker-organizing.htm) | Accounts/law/teaching/writing; changes or reversals; engineering/machinery/land/construction/defence/surgery. | Land is a broad overlap with agricultural work; these selected alternatives do not identify farmworker organizing. |
| [Theodore Maiman](https://engineering.stanford.edu/about/history/heroes/2012-heroes/theodore-maiman) | Public/food/liquids/shipping/travel; accounts/law/teaching/writing; engineering/construction and building property. | Engineering has a broad connection to his training; the selected alternatives do not identify his physics research or first working laser. |

The other schools' cards are not interpreted as career guesses: they report their own house, cusp, significator or selected-rule scope. A house shared by several subjects does not give a separate verdict for each. For deceased individuals, date-specific readings are capped at the recorded date of passing by the existing app logic.

## Birth-time sensitivity

Astro-Databank records a quoted 12:41 birth time for Glennie but also a previous approximate 17:30 report. The two inputs produce Virgo and Scorpio sidereal ascendants, respectively. For Chávez, Astro-Databank supplies UTC−08:00, while [another published chart](https://www.astro-charts.com/persons/chart/cesar-chavez/) supplies UTC−07:00 for the same local time; the corresponding sidereal ascendants are Leo and Cancer. Gandhi's two reported time conventions produce Leo in this calculation, though finer factors may still differ. These comparisons do not determine which input is correct.

## Malayalam coverage in these six primary readings

At the fixed reading instant, all 170 selected Nadi theme instances have either reviewed bilingual prose or an exact-match Malayalam theme translation; 107 use the expanded prose. All 390 selected school-card summaries and all 304 existing school-context explanation instances have Malayalam text. Chart-specific reader context is present on 341 of the 390 school cards; the remainder have no supported context paragraph in their selected scope. These counts include repeated cards and are coverage counts, not independent examples or a linguistic-quality score.

The 243 selected source-detail instances include 201 with Malayalam and **42 still shown in English**. Other source bases and the full practitioner readings also remain only partly translated. Unknown or changed wording deliberately falls back to English; it is not silently replaced by an approximate translation. This sample cannot establish coverage for every chart, rule, report or timing condition. Malayalam wording has been reviewed against its English selection, but has not received an independent native-editor review.
