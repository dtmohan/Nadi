/** A user-facing inventory of the event-rule subsets added during the
 * rectification research. This describes the implementation; it does not
 * certify an astrological outcome or assign a confidence percentage. */
import type { RectifyMethod } from "./rectify-methods";

export type RuleQualification = {
  id: string;
  system: "KP" | "Parashari" | "BNN" | "ALP";
  title: string;
  status: "Source-adapted subset" | "Research convention" | "Birth-time diagnostic";
  needs: string;
  checks: string;
  limits: string;
  source: { label: string; url?: string };
};

const bphs = { label: "Brihat Parashara Hora Shastra, chapters 11 and 34", url: "https://vedic-astro.s3.amazonaws.com/books/bhrihat_parasara_hora_shastra.pdf" };
const manley = { label: "Paul Manley, Birth Time Rectification (2022), supplied capture pp. 64–72, 98–128" };
const aurora = { label: "Leena Aurora, The Ultimate Guide to KP Astrology Techniques (2024), supplied capture pp. 252–262 and matter chapters" };
const astroSecrets = { label: "Astro Secrets & KP, Part 1 pp. 167–172; Part 2 pp. 192, 203; Part 3 ch. 5" };

export const RULE_QUALIFICATIONS = [
  { id: "kp-cusp", system: "KP", title: "Matter cusp and house links", status: "Source-adapted subset", needs: "Birth chart and a mapped matter",
    checks: "The matter cusp's sub-lord and its four-step matter-house links.", limits: "A listed link is partial evidence, not a complete promise. The optional six-step chart view is a separate convention.", source: astroSecrets },
  { id: "kp-filter", system: "KP", title: "House-by-house cusp filter", status: "Source-adapted subset", needs: "Birth chart, matter and period lords",
    checks: "For each period-lord house link, examine what that house's cusp sub-lord signifies, including the app's twelfth-from-cusp condition.", limits: "The filter is descriptive and does not change the older event tally. A limited denial condition is not proof the event cannot occur.", source: astroSecrets },
  { id: "kp-periods", system: "KP", title: "Running period links", status: "Source-adapted subset", needs: "Birth chart, matter and dated event",
    checks: "The three running Vimshottari lords are compared with the matter houses.", limits: "The older tally counts an identical natal cusp link once per matter and house set, while the period links remain per event. Equal points are not a source-prescribed probability; deeper period levels are not generally scored.", source: astroSecrets },
  { id: "kp-transits", system: "KP", title: "Period-lord transits and event sky", status: "Source-adapted subset", needs: "Birth chart and event date, time and zone",
    checks: "The transiting main/subperiod planets' sign, star and sub rulers are checked against natal significators. A broader nine-point sky is shown separately.", limits: "The six-point tally is an app convention; the broader sky is descriptive and the event clock may be assumed.", source: astroSecrets },
  { id: "kp-luminaries", system: "KP", title: "Sun and Moon period links", status: "Research convention", needs: "Birth chart and event date, time and zone",
    checks: "Whether a transiting luminary's sign, star or sub ruler matches one of the running period lords.", limits: "The source's reference to sensitive positions permits other interpretations. The app's link is descriptive, not independent confirmation or a score.", source: { label: "Astro Secrets & KP, Part 2 p. 26" } },
  { id: "kp-self", system: "KP", title: "Self-significators and cusp links", status: "Source-adapted subset", needs: "Birth chart",
    checks: "The source's unoccupied-star, own-star and mutual-star cases, plus separately shown first/ninth cusp links.", limits: "The unoccupied-star wording is interpreted from the author's example. Cusp links alone do not establish a birth time.", source: aurora },
  { id: "kp-strict", system: "KP", title: "Aurora strict staged script", status: "Research convention", needs: "Birth chart, mapped matter and event date for period stages",
    checks: "Cusp and period script layers in order; a later stage cannot pass an unresolved predecessor.", limits: "The no-adverse threshold is Nadi's strict choice and does not reproduce every mixed example. In the small case tests no complete chains passed; the method cannot yet rank birth times.", source: aurora },
  { id: "kp-mixed", system: "KP", title: "Aurora mixed staged script", status: "Research convention", needs: "Birth chart, mapped matter and event date for period stages",
    checks: "A supportive sub can carry a mixed star with caution; a mixed sub remains unresolved. Nodes and self-significators have explicit app treatments.", limits: "The node, promotion and repeated-star conventions are incomplete interpretations; no complete chains passed in the small published-case tests. An unresolved stage is not an event denial.", source: aurora },
  { id: "kp-qualified", system: "KP", title: "Natal clues before period links", status: "Research convention", needs: "Birth chart and favourable mapped event at a dated instant",
    checks: "Registered natal promise-role findings, then dasa, bhukti and antara links in order. A later stage is not counted if an earlier stage is unresolved.", limits: "Mixed, absent or adverse clues remain unresolved, not denial. The four-step house sets and stage count are a partial app interpretation, not Aurora's complete method.", source: aurora },
  { id: "kp-rp", system: "KP", title: "Moon and ruling-planet rectification", status: "Birth-time diagnostic", needs: "Candidate birth chart; ruling-planet variants also need a judgment instant and place",
    checks: "Separate Moon-lord, mixed-chart ruling-planet and Nemani judgment-chart comparisons.", limits: "These test a candidate birth time and do not turn into an ordinary event prediction. Their respective source interpretations are not blended.", source: { label: "Astro Secrets & KP Part 2 pp. 80–82; Nemani, Birth Time Rectification Methods vol. 1 ch. 4" } },
  { id: "para-support", system: "Parashari", title: "D1 and divisional support and strain", status: "Source-adapted subset", needs: "Birth chart and mapped matter",
    checks: "Selected house occupants, full aspects and house-lord sign dignity in D1 and the relevant division.", limits: "This is not a complete promise. A missing condition or difficult D1 clue does not automatically deny an event or cancel the division.", source: bphs },
  { id: "para-divisions", system: "Parashari", title: "Event house, ruler and significator", status: "Source-adapted subset", needs: "Birth chart and mapped matter; a date identifies running lords",
    checks: "D4 residence, D7 children, D9 marriage, D10 work and D24 education frames. Natal planet links are later selected by running periods.", limits: "The listed connections are a subset of Manley's qualitative method. D24 fourth-house education is kept separately from his fifth-house view.", source: manley },
  { id: "para-functional", system: "Parashari", title: "Functional lordship", status: "Source-adapted subset", needs: "Birth chart and rising sign",
    checks: "Each planet's owned houses and the selected BPHS rising-sign classification.", limits: "The classification alone does not establish strength or an event. Applying the natal table to a divisional ascendant is a provisional app choice.", source: bphs },
  { id: "para-named-pair", system: "Parashari", title: "Named BPHS pairs", status: "Research convention", needs: "Birth chart and rising sign",
    checks: "For named pairs in the app's rising-sign table, show both lordships and the app's conjunction, exchange or mutual-aspect relationship filter.", limits: "The filter is not a complete yoga judgment: the text's placement and adverse-lordship conditions need further assessment. The pair does not make either planet independently auspicious.", source: bphs },
  { id: "para-angle-trine", system: "Parashari", title: "Angle–trine lord connections", status: "Source-adapted subset", needs: "Birth chart and a D1 or divisional frame",
    checks: "Distinct lords of 4/7/10 and 5/9 connected by exchange, mutual full aspect, or conjunction in an angle or trine.", limits: "Other lordships, strength and BPHS exceptions remain visible but are not resolved. First-lord combinations and other relationships are outside this subset. It adds no score.", source: { label: "BPHS 34.11–15; Manley, supplied capture p. 66", url: bphs.url } },
  { id: "para-nodes", system: "Parashari", title: "Node sign-ruler links", status: "Source-adapted subset", needs: "Birth chart and mapped matter; a date identifies period lords",
    checks: "Rahu or Ketu's sign ruler, all of its houses and its one-hop relationship to the event house, its lord or significators.", limits: "Indirect links remain distinct from direct links and do not transfer a blanket benefic label or decide a node yoga.", source: manley },
  { id: "para-combination", system: "Parashari", title: "Matter-house plus ruler or significator", status: "Research convention", needs: "Birth chart and mapped matter; a date identifies period lords",
    checks: "A planet occupies the event house and has a direct relationship to its ruler or a listed significator in the same frame.", limits: "This source-inspired flag overlaps other clues, is not a complete promise and adds no ranking points.", source: manley },
  { id: "para-v1", system: "Parashari", title: "D1, division and timing tally · v1", status: "Research convention", needs: "Birth chart and favourable marriage, childbirth or job event with date",
    checks: "Two partial natal support checks, two period links and a Jupiter–Saturn same-target transit.", limits: "Five equally weighted points are an app synthesis. The small public-case tests did not establish reliable time selection.", source: { label: "BPHS 7 and 11; Mehta, Analysing Horoscope Through Modern Techniques ch. XVIII; Rao-guided marriage and childbirth sources", url: bphs.url } },
  { id: "para-v2", system: "Parashari", title: "Event-specific tally · v2", status: "Research convention", needs: "Birth chart and favourable marriage, childbirth or job event with date",
    checks: "Partial D1/divisional support plus the app's selected event-specific period, lordship and transit factors.", limits: "Six equal points combine source subsets; they are not a published formula or a probability. Event-specific rules and outcomes need broader validation.", source: { label: "Rao-guided Astrology and Timing of Marriage ch. 2; Astrological Assessment of Timing of Childbirth §§2.6–2.7; Bhaskar, Advanced Techniques vol. 1 pp. 23–24" } },
  { id: "para-v3", system: "Parashari", title: "Divisional period links · v3", status: "Research convention", needs: "Birth chart and favourable marriage, childbirth or job event with date",
    checks: "Adds the main/subperiod lords' primary divisional house, lord or significator links to v2.", limits: "The eight equal points can overlap, and later points do not require D1 to pass. The third period is descriptive; neither this tally nor the separate earlier D1 gate is validated as a time selector.", source: manley },
  { id: "para-v4", system: "Parashari", title: "Children natal clue · v4", status: "Research convention", needs: "Birth chart and favourable childbirth event",
    checks: "Adds the ordinary BPHS 16.16 fifth-lord finding as one child-event condition alongside v3.", limits: "The shared natal condition counts once per candidate and matter, while timing factors remain per event. The added point overlaps v3 and uses the selected ordinary house method, while v3 uses whole signs. Other indications can conflict; no match is not a denial. Marriage and career retain v3.", source: { label: "Brihat Parashara Hora Shastra 16.16; Manley, Birth Time Rectification", url: bphs.url } },
  { id: "para-gate", system: "Parashari", title: "Earlier D1-to-division funnel", status: "Research convention", needs: "Birth chart and a mapped favourable event with date",
    checks: "An older strict screen checks D1, the matter's own division and period links in order.", limits: "It omits many possibilities and can stop before considering a strong divisional clue. It must not exclude a candidate or prove a denial.", source: manley },
  { id: "alp-marriage", system: "ALP", title: "Marriage pada-navamsa clue", status: "Research convention", needs: "Birth chart and favourable marriage date and time",
    checks: "The ordinary ALP evaluator's marriage-pada finding at the event instant.", limits: "One partial clue, not a complete natal promise. At the reported anchors in an earlier small fresh set, none of five weddings matched it. Those birth records were not independently examined. A zero is not a denial and can persist for long periods.", source: { label: "S. Pothuvudaimoorthy, Akshaya Lagna Paddhathi vol. 2 p. 35", url: "https://www.scribd.com/document/972735161/Jyotish-S-Pothuvudai-Moorthy-Akshaya-Lagna-Pathathi-ALP-Part-2-2021" } },
  { id: "bnn-marriage", system: "BNN", title: "Marriage Jupiter contact clue", status: "Research convention", needs: "Birth chart, chart gender and favourable marriage date and time",
    checks: "Transiting Jupiter in the same sign as natal Venus in a male chart or Mars in a female chart.", limits: "Same sign is a narrow interpretation of touch. The Venus example specifies Jupiter's second round, not evaluated here. Gender-unspecified charts are unassessed; a zero does not deny an event.", source: { label: "N. Srinivasan Shastry, Brighu Naadi Sangraha", url: "https://ashramsofindia.com/wp-content/uploads/2023/09/Brighu-Naadi-Sangraha-by-N-Srinivasan-Shastry.pdf" } },
] as const satisfies readonly RuleQualification[];

/** Every KP and Parashari rectification method must point at a qualification.
 * Other reading rules can have more than one scope or source. */
type ScopedMethod = Extract<RectifyMethod, `kp-${string}` | `parashari-${string}`>;
type QualificationId = (typeof RULE_QUALIFICATIONS)[number]["id"];
export const RECTIFY_QUALIFICATION = {
  "kp-moon": "kp-rp", "kp-rp": "kp-rp", "kp-nemani-rp": "kp-rp",
  "kp-events": "kp-periods", "kp-transit": "kp-transits", "kp-aurora": "kp-strict", "kp-aurora-v2": "kp-mixed", "kp-qualified": "kp-qualified",
  "parashari-events": "para-v1", "parashari-events-v2": "para-v2", "parashari-events-v3": "para-v3", "parashari-events-v4": "para-v4",
} as const satisfies Record<ScopedMethod, QualificationId>;
