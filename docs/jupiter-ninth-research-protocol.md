# Jupiter in the fifth: ninth-sign exception, exploratory protocol

The source is the user-supplied transcript **Jupiter in your Horoscope**, a 2026 masterclass
by Raman Suprajarama. At approximately 16–19 minutes he interprets Jupiter in the fifth as
reducing a person's interest in reproduction rather than automatically denying children; at
22:25–22:59 he says a planet in the ninth sign from Jupiter nullifies the *karako bhava
nashaya* concern and attributes this instruction to B. V. Raman. We have not independently
located that exception in a published work by B. V. Raman. The recording transcript does not
specify whether lunar nodes count. This protocol, including sample and outcome definitions,
was fixed locally before seeking outcomes for the selected cases; it is not independent or
prospectively preregistered.

## Question and limits

Does the suggested ninth-sign condition distinguish accounts of reproductive intention among
people whose birth chart has Jupiter in the fifth? The talk describes an inward inclination,
not a reliably recorded event. Documented parenthood, number of children, involuntary
childlessness, infertility, and whether someone married **cannot** establish that inclination.
Personal accounts of wanting children, or choosing not to, also cannot prove a lifelong trait.
We separately collect independently documented parenthood only as descriptive context; we do
not call it a direct test of the lecturer's intention claim or of fertility. Unknown, ambiguous,
conflicting, and unpublished accounts remain unresolved. This is a small feasibility and
falsification-oriented study, not predictive accuracy or population inference.

## Selection, fixed before outcome searches

Use the public birth fields from the Astro-Databank C-name research sample revision
19 September 2026, extracted locally with `scripts/prepare-gulika-discovery.py`. Do not read,
redistribute, or select on the export's restricted `research_data`. The extractor limits the
sample to public figures, AA rating, 1880–1960 Gregorian births, usable coordinates and UTC
offsets and published individual links. AA is reported source provenance, not independent
verification of a clock or certificate. Exclude names already appearing in earlier project
research documents or published case fixtures; the exclusion compares complete names against
those local files, case-insensitively.

Calculate D1 at the source's published birth instant, using Lahiri, mean nodes, whole-sign
houses from the ascendant, the source's fixed UTC offset and its coordinates. Require Jupiter
in the fifth at the reported time and at both ±5 minutes. Also report ±15-minute sensitivity.
Classify ninth-from-Jupiter sign occupancy at the reported instant into three mutually exclusive
groups, without inspecting outcomes:

1. `classical`: at least one of Sun, Moon, Mars, Mercury, Venus and Saturn.
2. `node_only`: no classical planet, but Rahu or Ketu.
3. `empty`: neither of those classical planets nor a node.

Jupiter cannot occupy its own ninth sign. The three groups keep the unspecified node question
visible rather than silently deciding it. Same-sign, sign aspect and exact-degree aspect are
different observations; this study uses inclusive whole-sign counting only.

Within each group sort by ascending SHA-256 of UTF-8 `Nadi-jupiter-ninth-2026:<adb_id>` and
retain the first six after allowing at most two people from any one birthplace country in a
group (US states are combined). Keep all selected cases, including unresolved ones. Retain and report any
shortfall. Save the fixed list before searching the individuals' family histories. Individually
check the current reported birth data and the distinct outcome sources; treat inaccessible,
conflicting or rounded birth details as limitations. Public-figure selection and biography
availability introduce substantial bias, and the C-sample is not representative.

## Outcome coding

Independently seek sources for (a) the reported birth data, (b) the person's own clear statement
about wanting or not wanting children, or another sufficiently explicit attributed account,
and (c) any separately documented children. Classify (b) as `wanted`, `did_not_want`,
`mixed_or_changed`, or `unknown`; supply direct source and explanation. Do not infer a position
from a wedding, profession, number of children, age, no obituary mention, or adoption. Code
parenthood as `documented_parent`, `explicitly_no_children`, or `unknown`; report the stated
relationship and avoid inferring biological parenthood. Do not use unpublished personal data.
Retain birth and outcome conflicts and all failed lookups.

The main comparison is the count of *assessable intention accounts* by group. If no sufficiently
documented accounts are found, the exception is unresolved; parenthood cannot substitute for
that missing outcome. Any retrospective case pattern generates a hypothesis only. No event,
rectification, random-date, or school scores use this teaching.

## Reproduction

```sh
python3 scripts/prepare-gulika-discovery.py /path/to/c_sample_260919_1519.xml > /tmp/nadi-jupiter-input.json
node --import tsx scripts/screen-jupiter-ninth.ts /tmp/nadi-jupiter-input.json > /tmp/nadi-jupiter-screen.json
```

Save only selected public birth fields and calculated flags in the project. The `excluded`
search covers earlier `docs` text/JSON and `scripts/fixtures` as they stood before this study;
the screening script excludes its own result files to keep reruns stable. Public outcome
searches and comparison live in the separate review.

The first screen reused the nominal planetary positions at the ±5/±15-minute samples. After
some outcome searches had begun, this was corrected to recompute all planet positions at each
sample as well as the ascendant. A rerun retained exactly the same 18 IDs and group assignments;
the committed screen is the corrected one. Six selected charts change Jupiter's house at one
±15-minute sample, as recorded individually. No outcome was used to replace a case.
