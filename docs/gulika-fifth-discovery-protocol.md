# Fifth-house Gulika: discovery protocol

This is an exploratory follow-up to the earlier parent-selected sample, which contained no
fifth-house placements. It searches for the placement first, then checks independently published
family outcomes. It does not estimate predictive accuracy in a representative population.

## Source and eligibility

Use Astrodienst's [public C-name research sample](https://www.astro.com/adbexport/), revision
19 September 2026, in a local temporary directory. Only use its public birth data for the screen;
do not read the export's restricted `research_data` for selection or republish that section.
Follow individual public source links to check birth records and seek separate family-history
sources. Do not include the bulk export in this repository.

Predefine eligible records as: a named public figure, AA birth-data rating, Gregorian birth in
1880–1960 inclusive, explicit birth instant and coordinates, individual Astro-Databank and
Wikipedia links, a local offset within three seconds of a whole minute and at most 14 hours,
and absolute latitude below 65°. Exclude records already
used in the earlier Gulika parenthood check. AA is a catalogue rating, not a guarantee of
minute-level accuracy; independently inspect the published notes for each retained case.

Calculate using the published UTC instant and local offset, Lahiri ayanamsa, refracted upper-limb
sunrise, the Kerala weekday constants, and whole-sign houses from the ascendant. Require Gulika
in the fifth at the recorded time and at ±5 minutes, with the same day/night interval. These
requirements select computationally stable cases; ±5 minutes does not establish the true time.
Each retained result will also be checked at ±15 minutes, around sunrise, and under other
Gulika conventions where relevant. The export's instant and stated civil time must agree with
the individual's current Astro-Databank page before the case is used.

## Ordering and outcomes

Give eligible records the ascending SHA-256 order of the exact UTF-8 string
`Nadi-gulika-fifth-2026:<adb_id>`. First fix a discovery list of 20 eligible fifth-house cases
from the screen, allowing at most four births in any one country to broaden geographic coverage.
State and territorial entries flagged as United States in the source are counted as the US
for this limit; other entries retain their source country label.
Freeze the list before checking outcomes. A case is assessed only when public independent
sources document parenthood or a sufficiently clear completed-life account of childlessness;
unknown or conflicting family histories remain unknown, not assumed childless. Report all 20
screened names and the status of every case investigated; do not select only confirmations.

The literal standalone hypothesis is: the source's fifth-house statement means a person has no
children. A documented child is a counterexample to this hypothesis, not proof of normal
fertility or absence of family difficulties. Other possible readings, mitigating combinations,
adoption and time-specific interpretations are recorded separately, not assumed to rescue or
refute the literal claim. A horary judgment requires a recorded question chart and cannot be
validated by this natal case series. Selection by placement and availability of public biography,
one-letter sampling, repeated prior searches, and no equivalent non-fifth control mean this is
not a random, blinded, preregistered population study or a measure of predictive performance.

## Reproducing the screen

Download and extract the source's C sample locally, then run:

```sh
python3 scripts/prepare-gulika-discovery.py /path/to/c_sample.xml > /tmp/gulika-input.json
node --import tsx scripts/screen-gulika-fifth-discovery.ts /tmp/gulika-input.json
```

The first command outputs only public selection fields to a temporary file; the second prints
the counts and selected IDs, names and hashes. Compare them with
`docs/gulika-fifth-discovery-screen.json`. The source may update its export; reproduce the
specific revision identified above when comparing results.
