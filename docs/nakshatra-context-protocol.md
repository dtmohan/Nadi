# Nakshatra and pada context: protocol

Freeze `scripts/fixtures/nakshatra-context-fresh.json` before calculating the
seven public cases. They cover different countries and occupations, selected
without seeing whether a pada or combustion change occurs. Their AA clocks are
reported by Astro-Databank; original certificates have not been examined and
rounded clocks remain uncertain. The two dated weddings have independent
contemporary reports; wedding clocks are missing and use local noon. A second,
independently documented event (Lima's 2012 child) was added after the natal
baseline capture and before event comparison, to enable random-date checks. Its
reported 13:00 time comes from a representative. The other
cases exercise natal geometry and readings without inventing event dates.
The initial capture also exposed that putting a fixed UTC offset in `timezone`
while leaving `timeStandard` on automatic selects local mean time. Hashimoto
and Ahrends now use an IANA zone plus the explicitly published fixed offset in
`timeStandard`; the original captured values for those two cases are invalid.
Their old-pada comparison is recomputed at the corrected instant rather than
claimed as an independent pre-change capture.

The additional `nakshatra-context-targeted.json` profiles were selected after
screening AA public birth data for near-Sun, across-quarter placements. They
exercise Venus, Mercury and Jupiter boundary cases; they are intentionally
selected and not a holdout or a measure of predictive performance. Birth
records were not independently examined. Curtis's wedding is reported in two
outlets. The Cartier-Bresson sources disagree about an exhibition date by one
day; the Carr spaceflight does not have a faithful event-category mapping, so
neither is turned into a timed event.

The 27 equal stars contain four 3°20′ quarters each; in the BPHS D9 scheme
each is one navamsa interval. Compute one canonical half-open subdivision at
full precision. Compare against independently published tropical Sun and Moon
positions, adjusted for the same ayanamsa; compare the 108 boundaries and tiny
offsets with an independent integer-arc calculation. Expose the actual frame
and keep KP ayanamsa separate. Placements and modern Sutton quarter flags are
descriptive observations, not new event points, forecasts or promises.

Satyanarayana Naik, *Prediction Secrets – Naadi Astrology*, "Modified Moods
of Planets", [says](https://www.everand.com/book/589336080/Prediction-Secrets-Naadi-Astrology)
that a planet in the Sun's same pada is combust. Implement that literal shared
quarter for the existing eligible planets and retain the prior 3°20′ distance
as a labelled diagnostic, not the same test. Sun and the nodes remain excluded
by the app's existing convention, which Naik's brief rule does not settle.
Keep Parashari's independently sourced, planet-specific orbs separate. Test
same-quarter and cross-boundary examples, Sun/node exclusions, and 0°/360°.
Report actual changes to BNN findings and natal evidence in all cases, including
zero changes and any contradictions. Do not infer predictive accuracy from
birth-time geometry, coarse biographies, or the presence of an occupation.

Compare chart, dated topic and Validate findings, and the Rectify candidate
against those same ordinary natal findings. For a case with two dated events,
check comparison-date parity without adding natal tags to timing scores. For
the user's chart, keep identifying data and results outside the repository and
compare the previously discussed candidates using the user's provided events.
Separate potential changes in raw scores from any claim of correct birth time.
