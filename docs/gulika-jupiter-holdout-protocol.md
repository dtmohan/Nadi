# Jupiter–Gulika aspect: fresh placement-first exploration

This protocol was fixed before the family outcomes of the selected cases were searched. It is a
follow-up to, not a blinded preregistration independent of, the earlier Gulika discovery research.
It investigates whether Jupiter's full fifth or ninth **sign aspect** on Kerala Gulika might be a
useful clue in the presence of a fifth-house Gulika. It does not test a genuine horary question or
establish that an aspect cancels any statement.

## Selection

Use the same 19 September 2026 Astro-Databank C-sample revision, public input extraction, fixed
offsets and AA birth-data eligibility as the [previous discovery protocol](gulika-fifth-discovery-protocol.md).
Exclude **all 20** of that protocol's frozen discovery list, in addition to the earlier thirteen
parent-selected examples already excluded by the extractor. No family field is used to select.

With Lahiri ayanamsa, apparent upper-limb sunrise, Kerala weekday constants and whole-sign
houses, require Gulika in the fifth at the reported birth time and at ±5 minutes with the same
day/night interval. Determine the group at the reported time:

* **Aspect:** Jupiter is in the fifth or ninth sign from Gulika. Equivalently, Gulika is in the
  ninth or fifth sign from Jupiter; these are Jupiter's special full sign aspects. Same-sign
  conjunction is not an aspect for this primary comparison.
* **No fifth/ninth aspect:** Jupiter is neither fifth nor ninth from Gulika. Same-sign conjunctions
  remain in this group and will be identified separately, because some uses of *trine* include the
  occupied sign and conjunction is not the same as a planetary aspect. Jupiter's seventh aspect
  is also possible in this group; identify it separately rather than describing every case as
  having no Jupiter aspect of any kind. The machine-readable group key `noAspect` refers only
  to the special fifth/ninth aspect defined in this protocol.

Within each group order by ascending SHA-256 of exact UTF-8
`Nadi-gulika-aspect-holdout-2026:<adb_id>`; select up to 10 per group with no more than four
births per country within that group, applying the same US state/territory normalization as the
previous protocol. If a group has fewer eligible cases, retain all under that quota and state the
shortfall. Freeze both lists before seeking outcomes.

Check the birth record on its current individual source, and obtain an independent published
family source. A known child is parenthood; a completed-life source explicitly stating no
biological children is a narrower category, not a diagnosis. Record unknowns and disputed birth
data as unresolved. Follow all selected cases, not only those matching the expectation.

For reported cases, re-evaluate the placement and aspect at ±15/±5 minutes; samples do not
prove an exact birth time. Independently assess whether the same-sign Gulika association with
the existing Beeja/Kshetra point (Prasna Marga **19.8**, natal) is present; the app's sign-based
association and earlier sphuta conventions are explicitly approximations, and no Gulika aspect is
assumed. Record the older comparison of natural benefics' full sign aspects or occupation of the
fifth separately; it overlaps the Jupiter–Gulika aspect when Gulika is in the fifth.

Source clarification after the case review: the Gulika sentence in 19.8 follows a Kshetra
discussion; treating Beeja the same way is an exploratory extension. This clarification does
not change the fixed sample or comparison groups.

## Interpretation

Report each case and unresolved outcome. Describe the observed counts by group, but do not call
them predictive accuracy, fertility rates, causal evidence or a population probability. The two
groups are convenience samples without matching, blinded ascertainment, controls for age, family
formation, time accuracy or other chart variables. A documented parent without Jupiter's aspect
does not disprove that the aspect could be one among several mitigating conditions; a parent
with the aspect does not prove a causal cancellation. The horoscope comparison of a rule from
the question-chart discussion in Prasna Marga **18.68** is a labelled research extrapolation.

Reproduce after locally extracting the original C sample:

```sh
python3 scripts/prepare-gulika-discovery.py /path/to/c_sample.xml > /tmp/gulika-input.json
node --import tsx scripts/screen-gulika-jupiter-holdout.ts /tmp/gulika-input.json
```
