# Parashari and KP rule-by-rule parity audit

This inventory describes implemented subsets, not the completeness or validity of either tradition. A chart-only fact may be displayed before choosing a date; a period or transit cannot. Natal observations are descriptive, and an absent clue is not proof that an event will not occur. The older scores and funnels remain research tools, not birth-time proof. For the fresh-case replay and its limitations see `reading-parity-fresh-review.md`.

## Common boundaries

* The ordinary Parashari house reading uses the user's house/aspect settings. These event-research subsets instead use whole-sign houses and full sign-based aspects in D1 and divisions, and are labelled accordingly. They use the chart's selected ayanamsa. Applying D1 functional-lordship tables to divisional ascendants is provisional.
* KP event checks use KP ayanamsa, the selected node type, and the four-step A–D significator union. The ordinary KP timing view can separately offer a six-step convention; selecting that view does **not** switch the event, Validate or Rectify checks to six-step. KP and Parashari are never merged into one score.
* A dated chart reading calls the same Validate event evaluator. Rectify builds its own candidate chart, then calls the same KP and Parashari event scorers with that candidate, the event's actual or explicitly assumed time and zone, running lords, and the event sky. Monte Carlo re-evaluates these conditions at each sampled instant; its dates are not known non-events. For performance, Aurora transit descriptions are retained on the actual date and the first displayed trial; the staged results and scoring gates are applied on every trial.
* Chart-reading age and sensitivity gates still apply. To avoid unsolicited sensitive subjects, the plain natal KP overview and plain report omit sensitive event headings; eligible adults can inspect them in practitioner mode or select the matter and date. Rules only run for mapped matters; outcome restrictions remain explicit. A user-selected custom Rectify house/cusp definition can differ from the registered matter definition, so parity requires matching inputs.

## KP inventory

| Implemented rule | Natal chart | Chosen date / Validate / Rectify and trials | Qualification |
| --- | --- | --- | --- |
| KP cusps, planetary sign/star/sub and four-step house significators | Shared frame; cusp evidence for each permitted registered matter | Same frame at the candidate | Optional six-step display is separate. |
| Matter cusp sub lord, matched houses and twelfth-from-cusp condition | Shown for each permitted registered matter | Same cusp scorer | The twelfth condition is a limited filter, not proof of denial. |
| Dasa/bhukti/antara house links and raw points | Natal house links are visible, without assigning periods | Same event scorer | The period sequence needs a selected instant. |
| House-wise cusp-sub filters, effective links and denial condition | The required natal cusps and significators are visible | Same event scorer; descriptive in Rectify and dated reading | These filters do not change the legacy raw event tally. |
| Major/subperiod planet transit sign/star/sub and their significators | Not applicable until an event instant is supplied | Same event scorer and per-date sky | Only the two period-lord transits feed this transit score. |
| Sun/Moon transit links to the period lords | Not applicable without an event instant | Same event scorer; displayed as descriptive evidence | Not another score or independent confirmation. |
| Nine-point transit context | Natal KP points are visible in the chart | Dated chart and Validate show context from the same event sky | Rectify's event score does not depend on the broader nine-point description. |
| Aurora self-significators and first/ninth cusp links | KP chart and report | The strict/mixed scripts use the same natal frame | Ascendant links are descriptive, not a genetic test. |
| Aurora strict cusp stages; own-star adjustment and ordered gate | Mapped matters show the actual cusp stages | Same strict cusp stages followed by date-dependent periods; trials retain the same gate | Marriage, child, job and business mappings only. Mixed/silent does not pass the strict app threshold. |
| Aurora mixed v2 nodes, self-significator promotion, repeated-star/sub handling and ordered gate | Same mapped cusp stages | Same cusp stages followed by date-dependent periods; trials retain the same gate | Mixed star with supporting sub may proceed cautiously; mixed sub remains unresolved. Thresholds and node conventions are provisional. |
| `kp-moon` Moon–ascendant ruler check | Natal positions are available, but no event conclusion is inferred | Rectify only | Tests a birth-time hypothesis. |
| `kp-rp` and `kp-nemani-rp` | Natal positions are available | Rectify only with a judgment chart | Separate procedures; no judgment instant is fabricated for a natal prediction. The `kp-transit` judgment-Sun hint is also separate from event-day scoring. |

Sources and their specific scope are recorded in `shared/rectify-methods.ts`, the Rule Book and the two Aurora modules. Four-step and node adapters are app interpretations, not comprehensive implementations of the books.

## Parashari inventory

| Implemented rule | Natal chart | Chosen date / Validate / Rectify and trials | Qualification |
| --- | --- | --- | --- |
| D1 event house and relevant D7/D9/D10 occupants, aspects, lord, dignity, supportive and contrary factors | Shared natal frame and partial support/strain | Same frame used by v1–v3 and the dated hierarchy | Marriage, child and job; not a complete promise. |
| D1 matter lord, divisional matter lord and karaka in D1 and Dn | Shared foundation, placement, sign dignity and limited relationship | Same foundation in the event hierarchy | A strong divisional placement is evidence alongside D1, not automatic cancellation. |
| Move D4, child D7, marriage D9, career D10, education D24 matter, lord, karaka and secondary links | All nine planets' D1 and Dn frames in the regular chart/report | The same frames are selected for the running periods | Education D24 fourth-house view remains separate from Manley's fifth-house comparison. |
| Owned houses, functional classification, dignity and named conditional yoga pair | All planets in each matter's D1 and Dn frame | Same frame for running periods; distinct-lord diagnostic uses main/sub only | BPHS natal table in Dn and the named-pair relationship filter are app conventions. The latter includes conjunction in any house and does not assess all placement or adverse-lordship conditions. |
| Other connected angle/trine lords | All planets in each matter's D1 and Dn frame | Same frame selected for event periods; descriptive only | Distinct 4/7/10 and 5/9 lords, with exchange, mutual full aspect or conjunction in an angle/trine. Manley's Raman D7 Jupiter/Venus example is reproduced, while their other lordships remain visible. The first lord and other relations are excluded; BPHS exceptions and full strength remain unresolved. The existing named-pair score is unchanged. |
| Node sign ruler, ruler's houses and one-hop links | Both nodes shown in each matter's frames | Same selected node frames for event periods | Separate from direct node connections; no blanket benefic label. |
| Same-frame event-house placement plus relation to lord/karaka | All planets' actual combinations | Same selected frames and event flags | Overlaps other factors; no added ranking points. |
| v1: D1 support; division support; each of two main period links; same-target Jupiter/Saturn transit | Natal portions only | Same five app-defined factors on favourable marriage, child and new-job/promotion events | Equal points and broad application are experimental; a period/transit is not invented at birth. |
| v2 marriage: D1/D9 links for each of two period lords; Jupiter/Saturn shared target; Jupiter aspect on Vivah Saham | D1/D9 frames and natal Saham target | Same dated four factors after support factors | Narrow source-informed subset; placement on Saham is not counted as aspect. |
| v2 child: two period membership checks; Jupiter trine to fifth-from-Jupiter lord; ascendant-lord transit targets | Natal eligible planet set and D1/D9 target signs | Same dated four factors after support factors | Ascendant-lord transit uses a limited target set. |
| v2 career: two period membership checks; double-transit targets; D1 tenth/D10 ascendant lord relation | Natal eligible planet set and D10 lord relationship | Same dated four factors after support factors | The D10 relationship is natal; the other timing facts need a date. |
| v3 divisional event-house/lord/karaka connections for two main period lords | All planets' primary links in both frames | Same two period-specific checks added to v2 | Third period remains descriptive; v1–v3 totals do not gate later points on D1. |
| Earlier strict D1 → relevant Dn → period funnel; separate cross-chart timing clues | Partial D1/Dn foundation displayed | Same event hierarchy and predecessor gates | Known incomplete/over-restrictive screen; not used to exclude a candidate. Each matter uses its own relevant division. |

Sources include [BPHS 7, 11 and 34](https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf), [P.V.R. Narasimha Rao, *Vedic Astrology: An Integrated Approach*](https://www.vedicastrologer.org/articles/vedic_astro_textbook.pdf), Paul Manley, *Birth Time Rectification* (2022), ch. 4, and the event-specific sources linked in the Rule Book. See the versioned protocols in `docs/` for exact adapters and earlier published-case results.

## Adding a rule

1. Implement it once in the appropriate shared, system-specific evaluator and state the required chart, matter, period, event sky and/or judgment inputs. Preserve unknown and mixed outcomes. Register supported topics in `MANLEY_TOPICS`, `AURORA_MATTERS` or `EVENT_MATTERS` only when the rule really applies.
2. Give any new evidence field or Rectify method an explicit scope in `reading-rule-catalog.ts`; its exhaustive TypeScript records and method-inventory test require review of newly added fields/methods. The KP event output is propagated through both consumers from one result type. Registering a matter propagates the existing eligible natal checks.
3. Add or update a shared explanation/projection and the applicable chart, dated, report, Validate, Rectify and trial consumers. A new arbitrary rule does **not** automatically write a user-facing interpretation or change a score merely because it was added to a registry. Deliberately register and test those decisions.
4. Add an independent source/worked-example test, cross-surface parity tests, input/age/outcome edge tests, and a predeclared fresh-case comparison before making claims about accuracy. Matching code output across screens proves consistency, not astrological prediction.
