// The INTERPRETIVE THESAURUS, harvested from the Jyotish Engine v11 (Internal Ear lineage,
// March–April 2026) — the hand-curated, source-cited prose content that powered the
// "LLM synthesizes, never derives" narrator. Ported wholesale so the deterministic app
// can render it without a generator.
//
// Fidelity notes are preserved as the _note fields on each block — they are the source
// metadata (pinned vs provisional) and must travel with every rendered fragment.

export const PROSE_THESAURUS = {
 "nakshatra": {
  "_note": "[Source: BPHS, Nakshatra Phala; Brihat Samhita Ch.97-98; Taittiriya Brahmana; Hora Sara. Core meanings from classical texts; personality/shadow extensions synthesized from traditional commentaries. 27 nakshatras × 3 fields (core, personality, shadow).]",
  "Ashwini": {
   "core": "Initiatory impulse, healing capacity, speed of action. First flash of consciousness — beginnings without deliberation.",
   "personality": "Quick to act, impatient with stagnation, natural healer or first-responder temperament. Pioneering but may lack follow-through.",
   "shadow": "Impulsiveness, starting without finishing, restlessness mistaken for vitality."
  },
  "Bharani": {
   "core": "Capacity to bear and transform. The womb and the funeral pyre — creation through endurance of intense process.",
   "personality": "Intensity in relationships, capacity for sacrifice, strong sense of duty. Can bear what others cannot.",
   "shadow": "Possessiveness, moral rigidity, tendency to suffer in silence rather than seek release."
  },
  "Krittika": {
   "core": "Purifying flame. Cuts away what is false — sharp discernment, sometimes sharp tongue.",
   "personality": "Direct speech, strong appetite (literal and metaphorical), protective of dependents, critical eye.",
   "shadow": "Harshness in criticism, burning bridges, appetite becoming excess."
  },
  "Rohini": {
   "core": "Fertile ground. Growth, beauty, material abundance — the creative power of desire itself.",
   "personality": "Attractive presence, sensual appreciation, material ambition. Growth-oriented, values comfort and beauty.",
   "shadow": "Attachment to comfort, jealousy, difficulty with austerity or deprivation."
  },
  "Mrigashira": {
   "core": "The search itself. Perpetual seeking — intellectual curiosity that finds satisfaction in the hunt, not the capture.",
   "personality": "Curious, restless intellect, gentle despite Mars rulership. Researcher temperament — follows trails of inquiry.",
   "shadow": "Never satisfied, fickleness, starting many inquiries and completing few."
  },
  "Ardra": {
   "core": "Destruction that precedes renewal. The storm clears the air — transformative upheaval serving eventual clarity.",
   "personality": "Penetrating intellect, comfort with chaos, capacity for radical transformation. Sharp analytical mind.",
   "shadow": "Destructiveness mistaken for transformation, emotional storms, cruelty born of frustration."
  },
  "Punarvasu": {
   "core": "Return to source. The arrow that comes back — resilience, renewal, capacity to recover from setback.",
   "personality": "Optimistic, philosophical, bounces back from adversity. Generous, nurturing, values freedom within security.",
   "shadow": "Over-optimism ignoring real danger, restlessness masked as philosophical seeking."
  },
  "Pushya": {
   "core": "Nourishment through discipline. The most auspicious nakshatra — steady, reliable, sustaining force.",
   "personality": "Nurturing through structure, reliable, patient builder. Respects tradition, values service over display.",
   "shadow": "Over-caution, rigidity disguised as tradition, difficulty accepting change."
  },
  "Ashlesha": {
   "core": "Serpentine intelligence. Coiling, hypnotic, penetrating — the power of the unseen, the whispered, the implied.",
   "personality": "Strategic mind, psychological insight, capacity for manipulation or healing through the same power. Intense gaze.",
   "shadow": "Manipulation, suspicion, emotional toxicity when threatened."
  },
  "Magha": {
   "core": "Throne and lineage. Ancestral power, royal bearing — connection to those who came before.",
   "personality": "Natural authority, respect for tradition and hierarchy. Dignified, may struggle with modern egalitarianism.",
   "shadow": "Arrogance, living in past glory, expectation of deference without earning it."
  },
  "P.Phalguni": {
   "core": "Creative rest. The enjoyment that follows creation — celebration, pleasure, the arts as expression of divine play.",
   "personality": "Artistic, pleasure-seeking, generous host. Creative talent, especially performative arts. Values leisure.",
   "shadow": "Vanity, hedonism, creative talent wasted in self-indulgence."
  },
  "U.Phalguni": {
   "core": "Contractual partnership. The marriage bed — commitment, social contracts, duty within relationship.",
   "personality": "Reliable partner, organizational skill, sense of social obligation. Charitable, values fairness in exchange.",
   "shadow": "Rigidity in relationships, transactional approach to love, resentment when unreciprocated."
  },
  "Hasta": {
   "core": "Skilled hands. The craftsman's precision — dexterity, cunning, the power to manifest through technique.",
   "personality": "Skilled with hands, clever, humorous. Practical intelligence, good at games and trades. Adaptable.",
   "shadow": "Trickery, restlessness of hands and mind, superficial cleverness without depth."
  },
  "Chitra": {
   "core": "The jewel. Brilliant, multifaceted, visually stunning — the architect's vision made manifest.",
   "personality": "Aesthetic sense, architectural mind, attraction to beauty and design. Charismatic, image-conscious.",
   "shadow": "Narcissism, superficial beauty worship, the jewel without the setting."
  },
  "Swati": {
   "core": "Independent movement. The young shoot bending in wind — flexibility, independence, self-propelled growth.",
   "personality": "Independent, business-minded, diplomatic. Values personal freedom. Skilled in commerce and negotiation.",
   "shadow": "Restlessness, difficulty with commitment, independence becoming isolation."
  },
  "Vishakha": {
   "core": "Forked purpose. The triumphal arch — single-pointed determination toward a specific goal, splitting obstacles.",
   "personality": "Goal-oriented, determined, competitive. Leadership through focused will. Religious or philosophical zeal.",
   "shadow": "Obsession with goals at expense of relationships, jealousy, religious fanaticism."
  },
  "Anuradha": {
   "core": "Devoted following. The disciple's heart — capacity for friendship, devotion, and organizational loyalty.",
   "personality": "Devoted friend, organizational talent, capacity for deep loyalty. Spiritual seeker through devotion rather than renunciation.",
   "shadow": "Co-dependence, suppressing self for group, living through others' achievements."
  },
  "Jyeshtha": {
   "core": "Elder authority. The chief's burden — protective power, seniority, the weight of responsibility.",
   "personality": "Natural leader, protective of clan, competitive for top position. Sense of seniority and entitlement to respect.",
   "shadow": "Jealousy of others' success, misuse of authority, the tyrant who was once protector."
  },
  "Moola": {
   "core": "The root. Uprooting and investigation — getting to the bottom of things, even if it destroys surface structures.",
   "personality": "Investigative, philosophical, drawn to root causes. May experience foundational upheaval that redirects life purpose.",
   "shadow": "Destructiveness, nihilism, tearing things apart without capacity to rebuild."
  },
  "P.Ashadha": {
   "core": "Invincible early force. The war-fan — declaration of truth, purification through water, the conviction that wins hearts.",
   "personality": "Persuasive, truthful, purifying influence. Philosophical conviction expressed as gentle but firm assertion.",
   "shadow": "Premature declaration of victory, overconfidence before the battle is won."
  },
  "U.Ashadha": {
   "core": "Latter victory. The elephant's tusk — unchallengeable final triumph, earned through sustained effort.",
   "personality": "Universal appeal, leadership earned through merit. Patient builder who achieves lasting victory.",
   "shadow": "Loneliness at the top, inflexibility once committed, victory without joy."
  },
  "Shravana": {
   "core": "The ear. Listening as power — learning through hearing, oral tradition, the counselor who absorbs before advising.",
   "personality": "Good listener, learns through auditory channels. Connection to oral traditions, counseling ability.",
   "shadow": "Gossip, over-sensitivity to criticism, paralysis through too much listening and not enough action."
  },
  "Dhanishta": {
   "core": "The drum. Wealth and rhythm — abundance expressed through music, martial arts, and group coordination.",
   "personality": "Musical talent, wealth capacity, group leadership. Charitable, rhythmic in approach to life.",
   "shadow": "Aggression in group dynamics, miserliness despite abundance, rhythm becoming rigidity."
  },
  "Shatabhisha": {
   "core": "The hundred physicians. Healing through isolation — the hermit who cures by understanding what others cannot face.",
   "personality": "Independent thinker, healing capacity (especially alternative/unconventional), comfortable with solitude. Secretive, philosophical.",
   "shadow": "Isolation becoming pathological, eccentricity for its own sake, difficulty with intimacy."
  },
  "P.Bhadra": {
   "core": "The funeral pyre. Intense transformation — the two-faced man who sees both worlds simultaneously.",
   "personality": "Intense passion, philosophical extremism, capacity for radical transformation. Oscillates between worldly and renunciate.",
   "shadow": "Fanaticism, two-faced behavior, intensity that burns relationships."
  },
  "U.Bhadra": {
   "core": "Depth of the cosmic ocean. The serpent that guards hidden treasure — patient wisdom, kundalini potential.",
   "personality": "Deep thinker, patient, drawn to hidden knowledge. Charitable, controlled, builds wealth slowly and deliberately.",
   "shadow": "Excessive secrecy, laziness disguised as patience, hoarding (material or knowledge)."
  },
  "Revati": {
   "core": "The journey completed. Safe passage — the guide who brings travelers home. Nurturing, final, comprehensive.",
   "personality": "Compassionate, protective of the vulnerable, creative imagination. Good with animals and children. Dreamy, spiritual.",
   "shadow": "Over-idealism, victim mentality, difficulty with practical demands of material world."
  }
 },
 "dignity": {
  "_note": "[Source: BPHS Ch.3 (Graha Dignity); PD Ch.3 (Planetary Strengths); Saravali Ch.2. Exaltation/debilitation degrees per BPHS. Own sign/mooltrikona per BPHS Ch.3. Compound friendship (Panchadha) per BPHS Ch.3 v.55.]",
  "Exalted": {
   "effect": "{graha}'s significations manifest with maximum structural support. Full capacity to deliver results of houses lorded and occupied.",
   "quality": "Confident, natural, effortless expression of {graha}'s karakatwa.",
   "caveat": "Exaltation does not guarantee good results if {graha} lords dusthana houses — it delivers those results efficiently too."
  },
  "Mooltrikona": {
   "effect": "{graha} operates in its preferred working zone — stronger than own sign, focused and productive.",
   "quality": "Optimal functional expression. {graha} is most effective at producing results here.",
   "caveat": "Mooltrikona applies only within specific degree ranges of the sign."
  },
  "Debilitated": {
   "effect": "{graha}'s significations are structurally compromised. Difficulty expressing its karakatwa without external support.",
   "quality": "Diminished confidence in {graha}'s domain, reliance on compensatory mechanisms, delayed manifestation.",
   "caveat": "Debilitation does not destroy — it introduces friction. Check for neechbhanga conditions. Results arrive through indirect paths."
  },
  "Own Sign": {
   "effect": "{graha} operates in comfortable, familiar territory. Stable, reliable expression of its significations.",
   "quality": "At home — neither strained nor overpowered. Consistent delivery, self-sufficient in its domain.",
   "caveat": "Own sign is stable but not extraordinary. Less dynamic than exaltation, more dependable."
  },
  "Intimate Friend Sign": {
   "effect": "{graha} operates with strong support and enthusiastic cooperation from the sign lord.",
   "quality": "Warmly received — {graha}'s significations flow with ease and external support. Almost as comfortable as own sign.",
   "caveat": "Results depend on the sign lord's own condition. A struggling host cannot fully support even a welcome guest."
  },
  "Friend Sign": {
   "effect": "{graha} operates with support from the sign lord — cooperative, facilitated expression.",
   "quality": "Comfortable but reliant on the sign lord's condition. Results flow through alliance.",
   "caveat": "Check sign lord's own condition — a friend in poor condition cannot fully support."
  },
  "Neutral Sign": {
   "effect": "{graha} operates without particular support or resistance — functional but unassisted.",
   "quality": "Workable. {graha} can express its significations but has no environmental advantage or disadvantage.",
   "caveat": "Neutral placement means results depend more heavily on aspects, conjunctions, and lordship than on placement comfort."
  },
  "Enemy Sign": {
   "effect": "{graha} operates against resistance from the sign lord — friction, compromise, conditional expression.",
   "quality": "Uncomfortable. {graha}'s significations manifest with effort, delay, or through negotiation with opposing forces.",
   "caveat": "Enemy sign is not debilitation — it introduces social or environmental resistance, not constitutional weakness."
  },
  "Bitter Enemy Sign": {
   "effect": "{graha} operates under active hostility from the sign lord — significant friction and obstruction.",
   "quality": "Deeply uncomfortable. {graha}'s significations are suppressed or distorted. Expression requires overcoming substantial environmental resistance.",
   "caveat": "Bitter enemy sign is still not debilitation — the planet retains its nature but faces maximum environmental opposition."
  }
 },
 "combustion": {
  "_note": "[Source: BPHS Ch.3 v.47 (combustion degrees); PD Ch.3 v.5 (combustion ranges); Jataka Parijata Ch.2 (combust effects). Degrees: Moon 12°, Mars 17°, Mercury 14° (12° retro), Jupiter 11°, Venus 10°, Saturn 15°. Combustion = planet's significations overshadowed by Sun's ego-principle.]",
  "Moon": {
   "effect": "Emotional self eclipsed by paternal/authority dynamics. Mind becomes reactive to ego-concerns.",
   "manifestation": "Difficulty distinguishing personal feelings from inherited expectations. Mother-figure may be overshadowed by father-figure.",
   "recovery": "Moon recovers fastest from combustion as it separates from Sun monthly."
  },
  "Mars": {
   "effect": "Initiative and courage subordinated to ego-validation. Action becomes performance rather than genuine assertion.",
   "manifestation": "Anger that serves appearance rather than genuine boundary-setting.",
   "recovery": "Mars maturation (age 28) often marks shift from ego-driven to purposeful action."
  },
  "Mercury": {
   "effect": "Intellectual capacity overshadowed by identity concerns. Communication filtered through 'how will this look'.",
   "manifestation": "Self-doubt in speech or writing despite inherent analytical ability.",
   "recovery": "Mercury maturation (age 32) typically brings communicative confidence. Writing often precedes speaking."
  },
  "Jupiter": {
   "effect": "Wisdom and philosophical capacity internalized rather than externalized. The guru principle operates privately.",
   "manifestation": "Difficulty claiming teacher/advisor roles despite deep philosophical understanding.",
   "recovery": "Jupiter maturation (age 16) is early — wisdom may feel premature. Full expression often waits for Saturn maturation."
  },
  "Venus": {
   "effect": "Relational and aesthetic capacity burns in proximity to ego-needs. Partnership entangled with identity questions.",
   "manifestation": "Charm exists structurally but native may not feel ownership. Relationships serve identity-building.",
   "recovery": "Venus maturation (age 25) and own-sign/exaltation dignity provide structural counterweight."
  },
  "Saturn": {
   "effect": "Discipline and long-term capacity subordinated to short-term ego concerns.",
   "manifestation": "Self-imposed pressure, difficulty receiving recognition for sustained effort.",
   "recovery": "Saturn maturation (age 36) is the key threshold. Before 36, frustration; after, discipline integrates."
  }
 },
 "aspect": {
  "_note": "[Source: BPHS Ch.3, Graha Drishti (7 planets × full and special aspects); PD Ch.3 (aspect strengths); Saravali Ch.6 (aspect effects). All planets cast 7th (full). Mars: special 4th,8th. Jupiter: special 5th,9th. Saturn: special 3rd,10th. Rahu/Ketu aspects DISPUTED — accepted by some schools (B.V. Raman), denied by others.]",
  "Sun": {
   "general": "Solar gaze brings visibility, authority pressure, and ego-dimension to the target."
  },
  "Moon": {
   "general": "Lunar gaze brings emotional content, public dimension, and fluctuation to the target."
  },
  "Mars": {
   "general": "Martian gaze brings energy, aggression, technical capacity, and potential conflict.",
   "special4": "Protective/aggressive energy on foundation matters.",
   "special8": "Transformative/destructive energy on hidden matters."
  },
  "Jupiter": {
   "general": "Jovian gaze brings expansion, protection, wisdom, and optimism. The most benefic aspect.",
   "special5": "Creative/dharmic expansion — children, intelligence, past merit activated.",
   "special9": "Fortune/dharmic protection — guru's blessing, higher learning supported."
  },
  "Venus": {
   "general": "Venusian gaze brings harmony, aesthetic quality, relational dimension, and pleasure."
  },
  "Saturn": {
   "general": "Saturnine gaze brings discipline, restriction, delay, maturation pressure, and structural demand.",
   "special3": "Discipline/restriction on courage, siblings, communication — measured expression.",
   "special10": "Structural demand on career, authority — career built through persistent effort."
  },
  "Rahu": {
   "general": "Rahu's gaze (DISPUTED) brings obsession, foreign/unconventional influence, amplification and distortion.",
   "disputed": true
  },
  "Ketu": {
   "general": "Ketu's gaze (DISPUTED) brings detachment, spiritual dissolution, past-life impressions.",
   "disputed": true
  }
 },
 "graha_in_bhava": {
  "_note": "[Source: PD Ch.8 (primary — Subramanya Sastri translation, IGNCA edition); BPHS Bhava Phala; Saravali Ch.24-30; Brihat Jataka Ch.17-18. PD citations are direct translations. Narrative descriptions synthesized from multiple classical and modern sources.]",
  "Sun": {
   "H1": "Identity tied to authority, leadership, self-reliance. Constitution: pitta-dominant. [PD Ch.8]: wealth challenged; courage/valor; harsh temperament; lethargy; impulsive temperament; children: challenges; health: eye/vision concerns.",
   "H2": "Wealth through government/authority. Speech carries authority. [PD Ch.8]: shamelessness; speech: stammering.",
   "H3": "Courage in leadership, strained sibling relations. Self-effort directed toward authoritative pursuits. [PD Ch.8]: wealth indicated; generosity; sibling: strained relations.",
   "H4": "Domestic life influenced by authority/status concerns. Mother may be strong-willed. [PD Ch.8]: government service indicated.",
   "H5": "Creative intelligence channeled through leadership. Authoritative relationship with children. [PD Ch.8]: wealth indicated; sharp intellect; children: challenges.",
   "H6": "Strong capacity to overcome enemies. Government service favorable. Health: pitta. [PD Ch.8]: high status/authority; wealth indicated.",
   "H7": "Partnership with authoritative individuals. Marriage tied to career/social position. [PD Ch.8]: high status/authority; marriage: difficulties.",
   "H8": "Transformation through authority crises. Hidden aspects of power. Inheritance from father-figures. [PD Ch.8]: longevity reduced; wealth indicated; health: eye/vision concerns.",
   "H9": "Father as significant influence. Fortune through authority, government, institutional contexts. [PD Ch.8]: children: challenges.",
   "H10": "Natural career authority. Dig bala — Sun thrives here. Public recognition. [PD Ch.8]: high status/authority; wealth indicated; children: blessed; vehicles/conveyances indicated.",
   "H11": "Gains through authority networks. Aspirations tied to status and recognition. [PD Ch.8]: longevity indicated; high status/authority; wealth indicated.",
   "H12": "Authority exercised in seclusion or foreign lands. Father-figure may be distant. [PD Ch.8]: wealth challenged; children: blessed; health: eye/vision concerns."
  },
  "Moon": {
   "H1": "Emotional responsiveness defines personality. Public-facing, fluctuating self-image. Mother's influence strong. [PD Ch.8]: longevity indicated; wealth indicated.",
   "H2": "Wealth fluctuates. Nurturing speech. Food/nourishment as significant life theme. [PD Ch.8]: health: limb defect possible; speech: sweet/eloquent.",
   "H3": "Emotional courage, communicative about feelings. Sibling relationships emotionally charged. [PD Ch.8]: sibling themes active.",
   "H4": "Dig bala — Moon thrives here. Deep comfort-seeking, strong mother bond. Emotional security as core need. [PD Ch.8]: generosity; happiness/contentment; vehicles/conveyances indicated.",
   "H5": "Creative emotional intelligence. Children bring emotional fulfillment. [PD Ch.8]: high status/authority; children: blessed.",
   "H6": "Emotional sensitivity to conflict/service. Health fluctuations, especially digestive/fluid-related. [PD Ch.8]: longevity reduced; dullness of mind; health: stomach/digestive.",
   "H7": "Emotional fulfillment through partnership. Public-facing spouse. Marriage subject to emotional tides. [PD Ch.8]: marriage: favorable.",
   "H8": "Emotional depth, transformation through crisis. Anxiety-prone. Occult emotional sensitivity. [PD Ch.8]: longevity reduced.",
   "H9": "Fortune through emotional intelligence. Mother as dharmic influence. [PD Ch.8]: wealth indicated; virtuous conduct; children: blessed.",
   "H10": "Career involves public, nurturing, or caretaking roles. Professional fluctuations.",
   "H11": "Gains through social/emotional networks. Aspirations tied to emotional security. [PD Ch.8]: longevity indicated; wealth indicated; children: blessed.",
   "H12": "Emotional life operates in private/seclusion. Sleep disturbances possible. [PD Ch.8]: happiness/contentment; discontent."
  },
  "Mars": {
   "H1": "Bold, assertive personality. Physical vitality, competitive drive. Manglik consideration. [PD Ch.8]: longevity reduced; harsh temperament.",
   "H2": "Aggressive speech, wealth through effort/competition. Family dynamics involve conflict. [PD Ch.8]: high status/authority.",
   "H3": "Excellent placement — Mars thrives in upachaya. Courage, technical communication skills. [PD Ch.8]: happiness/contentment; sibling: strained relations.",
   "H4": "Property through effort but domestic conflict possible. Mother relationship strong but tense. [PD Ch.8]: vehicles/conveyances indicated.",
   "H5": "Competitive intelligence, athletic children. Speculative courage. [PD Ch.8]: children: blessed.",
   "H6": "Excellent placement — defeats enemies, overcomes disease. Military/surgical professions favored. [PD Ch.8]: high status/authority; wealth indicated; generosity.",
   "H7": "Partnership with assertive individuals. Manglik dosha — marriage requires compatible energy. [PD Ch.8]: health: disease-prone.",
   "H8": "Transformation through crisis/surgery. Hidden strength. Occult research capacity. [PD Ch.8]: longevity reduced; wealth indicated; health: disease-prone.",
   "H9": "Fortune through courage and initiative. Dharma expressed through action. [PD Ch.8]: high status/authority; father: separation/hardship.",
   "H10": "Dig bala — Mars thrives here. Careers in engineering, military, surgery, athletics. [PD Ch.8]: high status/authority; harsh temperament.",
   "H11": "Gains through effort, competition, technical skills. Aspirations achieved through action. [PD Ch.8]: wealth indicated; courage/valor; happiness/contentment.",
   "H12": "Expenses through conflict, surgery, or hidden enemies. Mars energy operates privately. [PD Ch.8]: harsh temperament; health: eye/vision concerns."
  },
  "Mercury": {
   "H1": "Dig bala — Mercury thrives here. Intellectual personality, communicative, youthful. [PD Ch.8]: longevity indicated; learning/scholarship.",
   "H2": "Articulate speech, wealth through communication/commerce/writing. [PD Ch.8]: speech: sweet/eloquent.",
   "H3": "Excellent placement — communication mastery, writing ability, media skills. [PD Ch.8]: courage/valor; sibling themes active.",
   "H4": "Education and intellectual comfort paramount. Mother intellectually influential. [PD Ch.8]: wealth indicated; learning/scholarship.",
   "H5": "Creative intelligence, analytical children. Educational pursuits as creative expression. [PD Ch.8]: learning/scholarship; happiness/contentment; children: blessed.",
   "H6": "Analytical approach to enemies/disease. Health: nervous system, skin. [PD Ch.8]: speech themes active.",
   "H7": "Partnership with intellectual/commercial individuals. Business partnerships favorable. [PD Ch.8]: wealth indicated; learning/scholarship.",
   "H8": "Research mind, occult investigation, insurance/tax analysis. [PD Ch.8]: longevity indicated.",
   "H9": "Higher learning, philosophical writing. Multiple educational qualifications likely. [PD Ch.8]: high status/authority; wealth indicated; learning/scholarship; virtuous conduct.",
   "H10": "Career in communication, commerce, writing, education. Professional versatility. [PD Ch.8]: learning/scholarship; virtuous conduct; happiness/contentment.",
   "H11": "Gains through intellect, commerce, social networking. Multiple income sources. [PD Ch.8]: longevity indicated; wealth indicated.",
   "H12": "Intellectual pursuits in seclusion. Writing in isolation. Foreign education possible. [PD Ch.8]: wealth challenged; harsh temperament."
  },
  "Jupiter": {
   "H1": "Dig bala — Jupiter thrives here. Wise, expansive personality. Philosophical outlook. [PD Ch.8]: longevity indicated; virtuous conduct.",
   "H2": "Wealth through wisdom, teaching, advisory roles. Truthful speech. [PD Ch.8]: learning/scholarship; speech themes active.",
   "H3": "Courage through wisdom rather than force. Teaching/advisory communication style. [PD Ch.8]: wicked tendencies; sinful conduct; sibling themes active.",
   "H4": "Happiness through learning, property, and maternal wisdom. Education extensive. [PD Ch.8]: happiness/contentment; mother themes active; children: blessed.",
   "H5": "Excellent placement — intelligent children, creative wisdom, speculative success. [PD Ch.8]: high status/authority; learning/scholarship; children: blessed.",
   "H6": "Overcomes enemies through righteousness. Health generally protected. [PD Ch.8]: lethargy.",
   "H7": "Wise, generous spouse. Partnership through dharmic connection. [PD Ch.8]: father: significant influence; children: blessed.",
   "H8": "Longevity protected. Occult wisdom. Transformation through philosophical insight. [PD Ch.8]: wealth challenged.",
   "H9": "Strongest natural placement. Fortune through dharma, teaching, law, philosophy. [PD Ch.8]: high status/authority; wealth indicated; virtuous conduct; children: blessed.",
   "H10": "Career in teaching, law, advisory, finance, religion. Authority through wisdom. [PD Ch.8]: high status/authority; wealth indicated; virtuous conduct.",
   "H11": "Gains through wisdom, elder connections. Large aspirations realized. [PD Ch.8]: longevity indicated; wealth indicated; children: blessed; vehicles/conveyances indicated.",
   "H12": "Spiritual expenditure. Jupiter protects even in dusthana. Moksha-orientation. [PD Ch.8]: sinful conduct."
  },
  "Venus": {
   "H1": "Attractive personality, refinement, artistic sensibility. Relationship-oriented identity. [PD Ch.8]: longevity indicated; happiness/contentment.",
   "H2": "Wealth through beauty, art, luxury goods. Sweet speech. Family appreciates aesthetics.",
   "H3": "Artistic communication. Creative courage. Short travels for pleasure. [PD Ch.8]: wealth challenged.",
   "H4": "Dig bala — Venus thrives here. Beautiful home, vehicles, comfort. [PD Ch.8]: vehicles/conveyances indicated.",
   "H5": "Creative arts, romantic intelligence, attractive children. Entertainment industries. [PD Ch.8]: high status/authority; wealth indicated; learning/scholarship; children: blessed.",
   "H6": "Beauty/relationship standards challenged. Health: reproductive system, kidneys. [PD Ch.8]: wealth challenged.",
   "H7": "Excellent for partnership — beautiful/artistic/wealthy spouse. Marriage harmonious (unless afflicted). [PD Ch.8]: marriage: favorable.",
   "H8": "Transformation through relationships. Hidden wealth. Inheritance through spouse. [PD Ch.8]: longevity indicated.",
   "H9": "Fortune through relationships, art, luxury. Spouse from learned background. [PD Ch.8]: high status/authority; children: blessed.",
   "H10": "Career in arts, entertainment, beauty, luxury, hospitality, diplomacy. [PD Ch.8]: virtuous conduct.",
   "H11": "Gains through artistic/social networks. Aspirations aesthetic and material. [PD Ch.8]: wealth indicated.",
   "H12": "Expenditure on luxury, relationships. Bed pleasures prominent."
  },
  "Saturn": {
   "H1": "Serious, mature personality beyond years. Discipline defines self-image. Health: vata concerns. [PD Ch.8]: high status/authority.",
   "H2": "Wealth accumulates slowly through persistent effort. Speech measured. [PD Ch.8]: vehicles/conveyances indicated.",
   "H3": "Good placement (upachaya) — courage through endurance. Communication deliberate. [PD Ch.8]: sharp intellect; happiness/contentment; discontent.",
   "H4": "Domestic responsibilities heavy. Mother may be burdened. Property delayed but durable. [PD Ch.8]: happiness/contentment; discontent.",
   "H5": "Delayed children or serious relationship with children. Intelligence methodical. [PD Ch.8]: wealth indicated; wicked tendencies; children: blessed.",
   "H6": "Good placement — defeats enemies through persistence. Chronic conditions manageable. Service-oriented. [PD Ch.8]: wealth indicated.",
   "H7": "Dig bala — Saturn thrives here. Older/mature spouse. Marriage delayed but durable. [PD Ch.8]: happiness/contentment; discontent.",
   "H8": "Longevity indicated. Chronic health concerns. Transformation through endurance. [PD Ch.8]: wealth challenged; harsh temperament.",
   "H9": "Father may be burdened/distant. Fortune through persistent effort, not luck. [PD Ch.8]: wicked tendencies; children: blessed.",
   "H10": "Career authority earned through long service. Professional peak typically after 36. [PD Ch.8]: high status/authority.",
   "H11": "Gains come slowly but are durable. Aspirations require patience — fulfilled later.",
   "H12": "Expenses through chronic obligations. Isolation may be imposed. Spiritual discipline. [PD Ch.8]: wealth challenged; dullness of mind."
  },
  "Rahu": {
   "H1": "Unconventional personality, foreign influences. Ambition through unusual paths. [PD Ch.8]: longevity reduced; wealth indicated; health: disease-prone.",
   "H2": "Wealth through unconventional/foreign means. Speech may be unusually persuasive. [PD Ch.8]: high status/authority; health: disease-prone; speech themes active.",
   "H3": "Courage through unconventional means. Communication involves technology/foreign elements. [PD Ch.8]: longevity indicated; wealth indicated.",
   "H4": "Unconventional home environment. Mother may be foreign or unusual. [PD Ch.8]: happiness: seldom; troubled mind.",
   "H5": "Unconventional intelligence, foreign education. Speculative obsession — high risk/reward. [PD Ch.8]: health: stomach/digestive; speech themes active.",
   "H6": "Complex position — obsessive energy directed at enemies/disease. [PD Ch.8]: troubled BY enemies; longevity indicated; wealth indicated. [Note]: Modern Jyotish reads 'defeats enemies' but PD states the opposite.",
   "H7": "Spouse from foreign/unconventional background. Non-traditional arrangements possible.",
   "H8": "Powerful occult potential. Sudden transformations. Research into hidden/forbidden knowledge. [PD Ch.8]: children: few; short life; health: disease-prone.",
   "H9": "Dharma through unconventional/foreign paths. Fortune through foreign connections. [PD Ch.8]: speech themes active.",
   "H10": "Career in foreign/technological/unconventional domains. Success through breaking conventions. [PD Ch.8]: high status/authority.",
   "H11": "Gains through foreign/technological networks. Large ambitions, unusual friend circle. [PD Ch.8]: longevity indicated; wealth indicated; health: disease-prone.",
   "H12": "Foreign residence likely. Spiritual seeking through unconventional paths. [PD Ch.8]: sinful conduct; health: disease-prone."
  },
  "Ketu": {
   "H1": "Detached personality, spiritual inclination. Identity feels incomplete or searching. [PD Ch.8]: ungrateful; unhappy; deformed; outcaste; health: disease-prone.",
   "H2": "Detachment from wealth/family. Speech may be abrupt or mystical. [PD Ch.8]: learning: denied; dependent on others for food; speech: defective.",
   "H3": "Courage through detachment. Communication terse but insightful. Past-life skills emerge. [PD Ch.8]: longevity indicated; wealth indicated; wife: happy.",
   "H4": "Emotional detachment from home/mother. Inner life rich but difficult to articulate.",
   "H5": "Unusual intelligence, past-life merit surfaces. Intuitive rather than analytical mind. [PD Ch.8]: children: denied or few; evil-minded; stomach disorders.",
   "H6": "Good placement — overcomes enemies through detachment. Mysterious health issues resolve suddenly.",
   "H7": "Partnership with spiritual/detached individuals. Marriage may involve separation themes. [PD Ch.8]: marriage: difficulties; health: disease-prone.",
   "H8": "Strong occult capacity, past-life karmic debts surface. Detachment from fear. [PD Ch.8]: longevity reduced.",
   "H9": "Spiritual dharma, past-life religious merit. Fortune through surrender rather than pursuit. [PD Ch.8]: sinful conduct; father: separation/hardship.",
   "H10": "Career in spiritual/healing/research domains. Recognition comes unexpectedly. [PD Ch.8]: wicked tendencies.",
   "H11": "Gains arrive unexpectedly, not through planned effort. Aspirations transcend material. [PD Ch.8]: high status/authority; wealth indicated.",
   "H12": "Strong moksha placement. Spiritual liberation as life theme. [PD Ch.8]: wealth indicated; sinful conduct; health: eye/vision concerns; squanders money."
  }
 },
 "yoga": {
  "Malavya": "Refinement, artistic talent, comfortable material life. Diplomatic skill. Strongest when Venus in kendra in own/exalted. [PD Ch.6]: strong limbs, very rich, blessed with wife, children and good fortune, good vehicles, renowned and learned.",
  "Shasha": "Discipline, organizational authority, leadership through persistence. Position earned through competence. [PD Ch.6 Sasa]: head of village or king, good servants, strong, wicked by nature.",
  "Hamsa": "Wisdom, dharmic orientation, attractive speech. Teaching/advisory natural role. [PD Ch.6]: king or high dignitary, respected by good people, beautiful body, virtuous.",
  "Ruchaka": "Martial courage, physical strength, leadership in competitive fields. Bold in crisis. [PD Ch.6]: long face, wealth through courageous deeds, powerful, conquers enemies, famous, commander of an army.",
  "Bhadra": "Intellectual brilliance, commercial acumen, youthful appearance. Quick-witted, versatile. [PD Ch.6]: longlived, intelligent, praised by learned persons, very rich and prosperous, eloquent speech.",
  "Gajakesari": "Recognition, wisdom, lasting reputation. Public presence commands respect. [BPHS 36.4, Chandra Yogas; PD Ch.6: Jupiter in kendra from Moon — prosperous, intelligent, enjoys royal favor.]",
  "Budhaditya": "Intelligent speech, analytical capacity. When combust: intellectual self-doubt despite ability. [BPHS 36, Solar Yogas; Saravali: Sun-Mercury conjunction in same sign. Note: most common yoga due to Mercury never being >28° from Sun — quality depends on combustion status and sign.]",
  "Chandra-Mangal": "Wealth through emotional intensity and assertive action. Moon-Mars combination indicates property, land acquisition, financial drive through competitive instinct. [BPHS 36, Chandra Yogas; Saravali: Moon conjunct Mars — earthy wealth, property, maternal strength.]",
  "Sunapha": "Planet(s) in 2nd from Moon: self-made wealth, intellectual capacity, earned reputation. The specific planet(s) color the mode of acquisition.",
  "Anapha": "Planet(s) in 12th from Moon: strong personality, comfortable life, fame. The specific planet(s) determine the arena of prominence.",
  "Durudhara": "Planets flanking Moon (2nd and 12th): generous, wealthy, blessed with conveyances and comforts. Combines Sunapha + Anapha — Moon supported on both sides.",
  "Adhi": "Benefics in 6th/7th/8th from Moon: commander, minister, or king. Polite, trustworthy, healthy, victorious over enemies. [PD Ch.6].",
  "Amala": "Benefic in 10th from Lagna/Moon: unblemished reputation, virtuous conduct, lasting fame. Honored by authority, amiable nature. [PD Ch.6 v.12].",
  "Veshi": "Planet(s) in 2nd from Sun: benefic Veshi brings eloquence, wealth, high status; malefic Veshi brings boldness and conflict.",
  "Voshi": "Planet(s) in 12th from Sun: benefic Voshi brings learning, charitable nature, sharp intellect; malefic Voshi brings physical strength but moral challenges.",
  "Ubhayachari": "Planets flanking Sun (2nd and 12th): eloquent, handsome, equal to a king. Sun supported on both sides, strengthening authority and recognition.",
  "Dharma-Karmadhipati": "Fortune supports career, career serves dharma. Life direction aligns with deeper purpose. [BPHS, Yoga Adhyaya; PD Ch.6: 9th and 10th lords connected — one of the highest Raja Yoga combinations.]",
  "Raja": "Kendra lord conjoins trikona lord: formula for power and fortune. Specific houses determine domain — career authority, spiritual power, or material success. [BPHS, Kendra-Trikona Lordship; PD Ch.6 vv.42-47; Laghu Parashari.]",
  "Viparita Raja": "Dusthana lords (6/8/12) in other dusthanas: rise through adversity, sudden reversals in native's favor. Enemies defeat themselves. [PD Ch.6; BPHS, Yoga Adhyaya. Some traditions dispute — DISPUTED between authorities.]",
  "Neechbhanga Raja": "Debilitation compensated — NOT cancelled. Rise through overcoming the specific weakness. [PD Ch.7 vv.27-30]: 5 classical conditions. [BPHS, Graha Dignity]: 2 additional conditions. Engine checks all 7: (1) dispositor in kendra from lagna/Moon, (2) exaltation lord in kendra from lagna/Moon, (3) debilitated planet aspected by dispositor, (4) debilitated planet aspected by exaltation lord, (5) debilitated planet in exaltation in navamsha, (6) dispositor of debilitated planet is exalted, (7) planet is retrograde while debilitated. Result: powerful King of Kings [PD Ch.7 v.30].",
  "Vargottama": "Rootedness, consistency between outer expression and inner nature. Reliable delivery across dimensions. [BPHS, Varga Dignity; Saravali: planet in same sign in rashi and navamsha gains extra strength and consistency.]",
  "Kemadruma": "Emotional self-reliance required. Fluctuating fortune, periods of isolation. Check cancellation conditions. [PD Ch.6]: cancelled if planet in kendra from Moon.",
  "Kala Sarpa": "[MODERN — NOT CLASSICAL] Life themes dominated by karmic patterns. Struggle followed by eventual breakthrough. This yoga does not appear in BPHS, Brihat Jataka, Phaladeepika, Saravali, or any pre-modern text. It entered Jyotish literature in the 20th century. Treat with appropriate skepticism.",
  "Guru Chandala": "Wisdom tainted by obsession or unconventional belief. Brilliant but heterodox. [BPHS, Rahu-Ketu Phala; Classical: Jupiter-Rahu conjunction contaminates wisdom with obsession. PD Ch.18 v.43: Rahu contaminates associated planet.]",
  "Lakshmi": "Material prosperity with dharmic foundation. Wealth through righteous means. [PD Ch.6]: Moon in own/exalted in kendra/trikona aspected by Jupiter.",
  "Saraswati": "Jupiter, Venus, Mercury in kendra/trikona with Jupiter strong: learning, eloquence, mastery of arts and sciences. [PD Ch.6].",
  "Yogakaraka": "Single planet lords both kendra and trikona: functionally the most benefic planet for that lagna. Its periods and placements carry amplified positive results. [BPHS, Kendra-Trikona Lordship; PD Ch.20 vv.41-47; Laghu Parashari.]",
  "Dhana": "Lords of 2nd and 11th connected, or connected with lagna lord: wealth accumulation indicated. Dignity of participating planets determines magnitude. [BPHS, Dhana Yoga Adhyaya; PD Ch.6; Saravali Ch.15.]",
  "Shakata": "Moon in 6th/8th/12th from Jupiter: fluctuating fortune, reversals, periods of hardship. Cancelled if Moon in kendra from lagna. [PD Ch.6].",
  "Vasumati": "Benefics in upachaya houses (3/6/10/11) from Moon: wealth through persistent effort, commercially successful, materially comfortable.",
  "Parivartana (Maha)": "Mutual exchange between kendra/trikona lords — houses linked become synergistic. [BPHS, Yoga Adhyaya; PD Ch.6: lords in each other's signs create Maha (great) exchange when both are benefic houses.]",
  "Parivartana (Dainya)": "Mutual exchange involving dusthana — one planet supports the struggling one. [BPHS, Yoga Adhyaya; Uttara Kalamrita: exchange involving 6th/8th/12th lord creates difficulty for the non-dusthana house involved.]"
 },
 "dasha_template": "During {graha} Mahadasha, themes of houses lorded ({lords}) and the house occupied ({occupies}) become prominent. {graha}'s dignity ({dignity}) determines HOW these themes manifest. Aspects received color the period's texture.",
 "dasha_keys": {
  "kendra_lord": "Angular themes — identity, home, partnership, career. Structural periods.",
  "trikona_lord": "Fortune, intelligence, dharma activated. Generally favorable.",
  "dusthana_lord": "Obstacles, enemies, transformation, loss. Growth through difficulty.",
  "upachaya_lord": "Improvement over time. Starts challenging, improves progressively.",
  "maraka_lord": "Health caution, transitions, endings/beginnings. Transitional."
 },
 "planet_dasha": {
  "Sun": {
   "well": "Wealth through authority and bold action. Renown, success in ventures. Devotion to duty. [PD Ch.19 v.6]",
   "ill": "Quarrels, displeasure of authority. Relatives suffer disease. Wandering, mental anguish. Danger to stored wealth from fire. Wife and children in distress. Eye/abdominal/dental disorders. [PD Ch.19 vv.5,18]"
  },
  "Moon": {
   "well": "Peace of mind, success in ventures. Wealth, wife, children, clothes, ornaments. Agricultural land, good food. Gain through religious merit and influential persons. [PD Ch.19 vv.7,19]",
   "ill": "Animosity with wicked people. Loss of wealth. Rheumatic complaints. Effects proportional to paksha bala. [PD Ch.19 vv.8,19]"
  },
  "Mars": {
   "well": "Earnings through lands, litigation, authority. Agricultural lands and cattle. Kingdom if exalted in H10/H11. Destruction of enemies. [PD Ch.19 vv.20,25]",
   "ill": "Wealth through questionable means. Bilious complaints, blood impurity, fever. Improper relationships. Quarrels with family. Loss through fire. [PD Ch.19 vv.9,20]"
  },
  "Mercury": {
   "well": "Benefits of learning — becomes learned teacher. Gains of lands, horses, money. Association with high-status persons. Eloquence admired. Immense wealth. [PD Ch.19 vv.10,24]",
   "ill": "Tri-dosha imbalance (wind, heat, phlegm). Loss of benefits. [PD Ch.19 v.24]"
  },
  "Jupiter": {
   "well": "Religious involvement. Children's happiness. Honor from authority. Vehicles, conveyances. Ambitions fulfilled. Cordial family relations. Servants, dignity. [PD Ch.19 vv.11,22]",
   "ill": "Separation from elders. Ear disease. Phlegmatic troubles. [PD Ch.19 v.22]"
  },
  "Venus": {
   "well": "Happiness, good vehicles, precious stones, ornaments, treasure. Intellectual pursuits. Royal honors. Auspicious celebrations. Wealth from trade, agriculture. Great glory if strong in H10/H11/H12. [PD Ch.19 vv.12,26]",
   "ill": "Separation from elders/parents. Loss of peace. Distress to kinsmen. [PD Ch.19 v.26]"
  },
  "Saturn": {
   "well": "Wealth from wartime/disturbance opportunities. Servants, cattle. Systematic accumulation. [PD Ch.19 v.23]",
   "ill": "Family suffering gout/rheumatism. Loss in agriculture. Evil talk. Desertion of servants. Separation from wealth. Windy/phlegmatic diseases, piles. [PD Ch.19 vv.13,23]"
  },
  "Rahu": {
   "well": "If with benefic or in auspicious house: king-like splendor. Success in ventures, happy home. Lasting wealth, wide fame. In Vi/Pi/Sc: honor, lands, servants — BUT lost at dasha end. [PD Ch.19 vv.15-16]",
   "ill": "Danger from authority, thieves, poison, fire, weapons. Distress to children. Mental tension. Loss of kinsmen, reputation. Failure in ventures. Demotion. Eye/heart diseases. [PD Ch.19 vv.14,21]"
  },
  "Ketu": {
   "well": "Results of associated planet and occupied house. Good in kendra/trikona with yogakaraka connection. [PD Ch.19, Laghu Parashari]",
   "ill": "Sorrow from females. Trouble from rich. Loss of wealth. Injustice to others. Banishment. Dental trouble, leg pain, phlegmatic troubles. [PD Ch.19 vv.17,25]"
  }
 },
 "house_lord_dasha": {
  "H1": {
   "strong": "Eminence, healthy body, lustre, increasing prosperity, happy life. [PD Ch.20 v.2]",
   "weak": "Imprisonment, life incognito, fear, diseases, mental anguish, loss of position. [PD Ch.20 v.15]"
  },
  "H2": {
   "strong": "Family, good food, earning through speech/lectures, eloquence appreciated. [PD Ch.20 v.3]",
   "weak": "Foolish behavior, breaks promises, eye troubles, harsh tongue, heavy expenditure. [PD Ch.20 v.15]"
  },
  "H3": {
   "strong": "Sibling cooperation, auspicious news, courage exhibited, honor, popularity. [PD Ch.20 v.4]",
   "weak": "Loss of siblings. Adverse criticism. Secret enemies. Humiliation. [PD Ch.20 v.16]"
  },
  "H4": {
   "strong": "Success in agriculture, happy with wife, vehicles, lands, houses, higher status. [PD Ch.20 v.5]",
   "weak": "Mother/friends distressed. Destruction of house, lands, cattle. Danger from water. [PD Ch.20 v.16]"
  },
  "H5": {
   "strong": "Birth of son, kinsmen happiness, minister/advisor role, honors, virtuous praise. [PD Ch.20 v.6]",
   "weak": "Loss of son, aberration of mind, deception, aimless wandering, stomach disorders. [PD Ch.20 v.17]"
  },
  "H6": {
   "strong": "Overcoming enemies, freedom from disease, generous, powerful, prosperous. [PD Ch.20 v.7]",
   "weak": "Thieves, poverty, overpowered, diseases, humiliation, bodily injuries. [PD Ch.20 v.17]"
  },
  "H7": {
   "strong": "New clothes/ornaments, happy with wife, physical strength, auspicious celebrations, pleasure trips. [PD Ch.20 v.8]",
   "weak": "Son-in-law distressed, separation from wife, venereal diseases, aimless wandering. [PD Ch.20 v.18]"
  },
  "H8": {
   "strong": "Debts cleared, professional progress, disputes end, cattle and servants acquired. [PD Ch.20 v.9]",
   "weak": "Great sorrow, loss of intelligence, jealousy, poverty, sickness, humiliation. Life may end. [PD Ch.20 v.18]"
  },
  "H9": {
   "strong": "Continuous prosperity with family, meritorious deeds, royal favor, respectful. [PD Ch.20 v.10]",
   "weak": "Wife/children trouble, divine displeasure, father/brother death possible, penury. [PD Ch.20 v.19]"
  },
  "H10": {
   "strong": "Success in every venture, happy, name/fame/reputation, virtuous actions. [PD Ch.20 v.11]",
   "weak": "Failure in undertakings, wicked actions, exile, loss of honor. [PD Ch.20 v.19]"
  },
  "H11": {
   "strong": "Continuous prosperity growth, relatives, servants, domestic happiness. [PD Ch.20 v.12]",
   "weak": "Elder brother trouble, sickly son, misery, deception, ear diseases. [PD Ch.20 v.20]"
  },
  "H12": {
   "strong": "Spending on good causes, meritorious acts, royal honors. [PD Ch.20 v.13]",
   "weak": "Many diseases, dishonor, slavery, wealth disappears. [PD Ch.20 v.20]"
  }
 },
 "conjunction": {
  "Sun_Moon": "Skilled in machinery/stone work. Technical aptitude. [PD Ch.18 v.1]",
  "Sun_Mars": "Sinful tendencies, aggressive nature, prone to conflict. [PD Ch.18 v.1]",
  "Sun_Mercury": "Talented, intelligent, renowned, happy. Literary/intellectual achievement. [PD Ch.18 v.1]",
  "Sun_Jupiter": "Cruel yet intent on helping others. Harsh exterior, beneficent intent. [PD Ch.18 v.1]",
  "Sun_Venus": "Earns through performing arts — dance, singing, theatre, cinema. Or martial skill. [PD Ch.18 v.1]",
  "Sun_Saturn": "Skillful in metallurgy, pottery, crafting with metals/earth. Technical craftsmanship. [PD Ch.18 v.1]",
  "Moon_Mars": "Dealer in rough instruments, earthen pots. Disobedient to mother. Manufacturing trade. [PD Ch.18 v.2]",
  "Moon_Mercury": "Soft-spoken, clever in interpretation/finance. Fortunate, famous. [PD Ch.18 v.2]",
  "Moon_Jupiter": "Victorious over enemies, fickle-minded. Head of family, very wealthy. [PD Ch.18 v.2]",
  "Moon_Venus": "Specializes in weaving, tailoring, dyeing. Textile/fashion industry. [PD Ch.18 v.2]",
  "Moon_Saturn": "Mother was widow who remarried or disrupted maternal lineage. Difficult maternal circumstances. [PD Ch.18 v.2]",
  "Mars_Mercury": "Dealer in herbs, plants, books, oil, drugs. Clever in combat. Pharmaceutical/publishing. [PD Ch.18 v.3]",
  "Mars_Jupiter": "Administrator of city/town. King or wealthy Brahmin. Governance authority. [PD Ch.18 v.3]",
  "Mars_Venus": "Owner of court/arena. Wrestler. Affairs with others' partners. Gambler. Clever. [PD Ch.18 v.3]",
  "Mars_Saturn": "Unhappy, condemned by all, breaks promises. Difficult reputation. [PD Ch.18 v.3]",
  "Mercury_Jupiter": "Actor, fond of singing, well-versed in dancing. Performing arts. [PD Ch.18 v.4]",
  "Mercury_Venus": "Eloquent speech, owner of lands, head of assembly. Communication leadership. [PD Ch.18 v.4]",
  "Mercury_Saturn": "Expert cheat, addicted to licentious pleasures. Deceptive intelligence. [PD Ch.18 v.4]",
  "Jupiter_Venus": "Learned, possesses wealth and wife. Noble qualities. Cultured prosperity. [PD Ch.18 v.4]",
  "Jupiter_Saturn": "Barber, potter, or cook. Manual craft despite wisdom. Service-oriented. [PD Ch.18 v.4]",
  "Venus_Saturn": "Short-sighted. Wealth through woman. Well-versed in painting and writing. Artistic. [PD Ch.18 v.5]"
 },
 "dignity_dasha_scale": {
  "_note": "Benefic/lord of benefic house good effects scale. Malefic reversed.",
  "exalted": "Max good effects — full house promise delivery. [PD Ch.20 v.30]",
  "moolatrikona": "Three-fourths of max good effects. [PD Ch.20 v.30]",
  "own": "Half of max good effects. Stable but not spectacular. [PD Ch.20 v.30]",
  "friend": "One-fourth of good effects. Moderate. [PD Ch.20 v.30]",
  "enemy": "Very little good effects. Struggles. [PD Ch.20 v.30]",
  "debilitated": "Almost nil good effects. House promise unfulfilled. [PD Ch.20 v.30]",
  "combust": "Effects similar to debilitation — severely diminished. [PD Ch.20 v.30]",
  "vargottama": "Very favorable dasha effects. Mixed if also debilitated/combust. [PD Ch.20 v.22]",
  "arohi": "Ascending from debilitation — effects improve over dasha. Good latter half. [PD Ch.20 v.56]",
  "avarohi": "Descending from exaltation — effects deteriorate over dasha. [PD Ch.20 v.56]",
  "mixed": "Debilitated/combust but in auspicious house/navamsa: mixed effects, good latter half. [PD Ch.20 v.57]"
 },
 "dasha_rules": {
  "benefic_kendra_lord": "Natural benefic as kendra lord does not produce benefic effects (kendradhipati dosha). Jupiter/Venus as kendra lords in 2/7 become powerful marakas. [PD Ch.20 vv.41,50]",
  "malefic_kendra_lord": "Natural malefic as kendra lord becomes more auspicious. [PD Ch.20 v.41]",
  "trikona_always_good": "Lords of trikonas (1,5,9) always favorable in dasha. [PD Ch.20 v.41]",
  "trikona_kendra_yoga": "Trikona lord+kendra lord connected = yogakaraka pair. Very favorable dasha/antardasha. [PD Ch.20 vv.42,45-47]",
  "lords_3_6_11_evil": "Lords of 3/6/11 produce evil even if benefic. 11th lord biggest papi. [PD Ch.20 notes]",
  "eighth_lord_exception": "8th lord also lagna lord = auspicious. Sun/Moon as 8th lord give good. [PD Ch.20 v.41]",
  "rahu_ketu_yoga": "Rahu/Ketu in kendra/trikona connected with kendra/trikona lord = yogakaraka. [PD Ch.20 v.52]",
  "rahu_contaminates": "Rahu affects associated planet — that planet gives evil at END of dasha. [PD Ch.20 v.39]",
  "dusthana_pair": "Dasha of 6/8/12 lord + antardasha of another 6/8/12 lord = adverse. [PD Ch.20 v.22]",
  "maraka_houses": "2nd/7th are maraka houses. Powerful lords/occupants cause death in dasha. [PD Ch.20 v.40]"
 },
 "house_lord_patterns": {
  "lagna_lord_strong": "Long-lived, wealthy, praiseworthy, virtuous, honored, fortunate, fearless, happy family. [PD Ch.16 v.2]",
  "lagna_lord_weak": "Miserable, undesirable place, calamities, unhappy, sickly. [PD Ch.16 v.4]",
  "second_lord_with_jupiter": "Well-versed in Vedas/scriptures. [PD Ch.16 v.6]",
  "second_lord_with_mercury": "Specializes in economics. [PD Ch.16 v.6]",
  "second_lord_with_venus": "Expert in amorous topics. [PD Ch.16 v.6]",
  "second_lord_with_saturn": "Bereft of learning. [PD Ch.16 v.5]",
  "malefics_in_2nd": "Fool, without wealth. [PD Ch.16 v.6]",
  "fourth_lord_dusthana_sun_mars": "House of birth burnt/destroyed. [PD Ch.16 v.14]",
  "tenth_lord_strong": "Fortunate, long-lived, renowned, virtuous. [PD Ch.16 v.27]",
  "saturn_rahu_ketu_in_10th": "Nefarious activities. [PD Ch.16 v.28]"
 },
 "node_conjunction": {
  "_note": "Conjunction is the PRIMARY coloring of any node. The node amplifies (Rahu) or dissolves (Ketu) the conjunct planet's nature. [Source: BPHS, Rahu-Ketu Phala; PD Ch.18 (conjunction principles); Saravali Ch.33-34 (node combinations). Modern synthesis from B.V. Raman, KN Rao.]",
  "Rahu": {
   "Sun": "Rahu amplifies ego-drive and authority hunger. Obsessive pursuit of recognition, unconventional path to status. May eclipse father-figures or create power struggles with authority. Grahan dosha (eclipse axis) if within orb.",
   "Moon": "Rahu amplifies emotional intensity and mental restlessness. Mind becomes obsessive, prone to anxiety or fixation. Unconventional relationship with mother. Grahan dosha. Emotional intelligence is powerful but unstable.",
   "Mars": "Rahu amplifies aggression, ambition, and technical capacity. Exceptional drive but risk of explosive anger, reckless action. Engineering/technology talent. Angarak-like intensity without the conjunction name.",
   "Mercury": "Rahu amplifies intellect toward unconventional or foreign knowledge domains. Brilliant but potentially deceptive communication. Technology, research, foreign languages. Speculative mind.",
   "Jupiter": "Guru Chandala Yoga — wisdom tainted by obsession or heterodox beliefs. Brilliant philosophical mind but may reject conventional paths. Guru-figures unreliable or unconventional. Foreign spiritual traditions.",
   "Venus": "Rahu amplifies desire, luxury-seeking, and relational intensity. Unconventional relationships, foreign partners, obsessive romantic patterns. Artistic talent through unusual media. Material excess.",
   "Saturn": "Rahu amplifies discipline toward unconventional goals. Foreign work, institutional outsider status, persistent drive against obstacles. Can indicate exile, immigration, or systematic rule-breaking."
  },
  "Ketu": {
   "Sun": "Ketu dissolves ego-attachment. Detachment from authority and recognition. Father-figure absent or spiritual. Native may have deep power but no desire to wield it visibly.",
   "Moon": "Ketu dissolves emotional attachment. Detached mind, spiritual insight, but difficulty with emotional intimacy. Mother relationship involves separation or spiritual themes. Moksha karaka activation.",
   "Mars": "Ketu dissolves aggressive impulse into surgical precision. Past-life martial or technical skills surface. Action without ego-investment. Can indicate injury or surgical events.",
   "Mercury": "Ketu dissolves conventional intellect into intuitive knowing. Speech becomes terse, cryptic, or mystical. Past-life knowledge emerges. Difficulty with formal education but innate wisdom.",
   "Jupiter": "Ketu dissolves conventional wisdom into direct spiritual experience. Renunciation tendency, disillusionment with organized religion. Deep philosophical insight without scholarly framework.",
   "Venus": "Ketu dissolves relational attachment. Detachment from luxury and partnership. May indicate past-life completion of relational karma. Aesthetic sense is spiritual rather than material.",
   "Saturn": "Ketu dissolves fear of structure and limitation. Detachment from career ambition and social status. Renunciate quality in professional life. Past-life discipline resurfaces without effort."
  }
 },
 "node_dispositor": {
  "_note": "Dispositor is the MANAGER — determines how the node's energy flows. A well-placed dispositor gives the node a constructive channel. A poorly-placed one leaves the node chaotic. [Source: BPHS, Rahu-Ketu Phala (nodes take on dispositor's nature); Laghu Parashari (Ketu gives results of its lord); Uttara Kalamrita. Classical principle — nodes as chaya grahas have no independent nature.]",
  "Rahu": {
   "Sun": "Authority-channeled ambition. Rahu's hunger directed toward leadership, government, institutional power. Father-figures become the gateway. Dispositor's house shows WHERE the authority manifests.",
   "Moon": "Emotionally-channeled obsession. Rahu's hunger directed through nurturing, public connection, caretaking. Mother-figures become the gateway. Fluctuating but powerful social instincts.",
   "Mars": "Action-channeled ambition. Rahu's hunger directed through competition, engineering, surgery, athletics. Energy is intense and focused but risk of reckless pursuit. Technical mastery as obsession.",
   "Mercury": "Intellect-channeled ambition. Rahu's hunger directed through communication, commerce, technology. Foreign languages, coding, trading. Mind is sharp but may be deceptive or manipulative.",
   "Jupiter": "Wisdom-channeled ambition. Rahu's hunger directed through philosophy, teaching, law, finance. Expansive ambition moderated by dharmic framework — IF Jupiter is well-placed. If Jupiter is weak, the channeling fails and Rahu runs unchecked.",
   "Venus": "Desire-channeled ambition. Rahu's hunger directed through beauty, luxury, relationships, diplomacy. Material acquisition and relational networking as primary expression. Refined but potentially excessive.",
   "Saturn": "Discipline-channeled ambition. Rahu's hunger directed through persistent structural effort. Foreign work, institutional climbing, systematic accumulation. Slow but relentless. Saturn constrains Rahu's impulsiveness."
  },
  "Ketu": {
   "Sun": "Authority-channeled detachment. Ketu's spiritual impulse expressed through leadership that doesn't seek recognition. Power wielded from behind the scenes. Father as spiritual catalyst.",
   "Moon": "Emotionally-channeled detachment. Ketu's spiritual impulse expressed through emotional surrender. Intuitive healing capacity. Mother-figure involves spiritual or separation themes.",
   "Mars": "Action-channeled detachment. Ketu's spiritual impulse expressed through precise action without ego-investment. Martial arts, surgery, engineering from past-life mastery. Action as meditation.",
   "Mercury": "Intellect-channeled detachment. Ketu's spiritual impulse expressed through intuitive knowing rather than learned knowledge. Cryptic communication. Research into hidden or esoteric subjects.",
   "Jupiter": "Wisdom-channeled detachment. Ketu's spiritual impulse expressed through direct knowing, bypassing scholarly framework. Natural wisdom without formal education. Guru-like quality without seeking the role.",
   "Venus": "Desire-channeled detachment. Ketu's spiritual impulse expressed through aesthetic minimalism or spiritual beauty. Detachment from luxury that paradoxically attracts it. Tantric or devotional art.",
   "Saturn": "Discipline-channeled detachment. Ketu's spiritual impulse expressed through effortless renunciation of worldly structures. Past-life discipline resurfaces. Institutional roles held without attachment."
  }
 },
 "node_in_bhava": {
  "_note": "These REPLACE the basic graha_in_bhava entries for Rahu/Ketu. Include axis awareness. [Source: PD Ch.8 (primary — Subramanya Sastri translation); BPHS Rahu-Ketu Phala; Saravali Ch.33-34. Modern extensions from B.V. Raman, KN Rao, Sanjay Rath. Where classical and modern diverge, BOTH views are presented with [CLASSICAL vs MODERN DIVERGENCE] flag.]",
  "Rahu": {
   "H1": "Identity shaped by obsessive ambition and unconventional self-presentation. The native's personality IS the hunger — for recognition, foreign experience, breaking conventions. Appearance may be distinctive or deliberately unusual. Life path defined by what is NOT traditional. Ketu in H7: detachment from conventional partnership balances Rahu's self-focused intensity. [PD Ch.8]: longevity reduced; wealth indicated; health: disease-prone.",
   "H2": "Wealth through unconventional or foreign means. Speech carries unusual persuasive power — may be deceptive or magnetically convincing. Family of origin involves foreign elements, unusual customs, or disrupted lineage. Food habits unconventional. Ketu in H8: detachment from hidden resources, occult disinterest. [PD Ch.8]: high status/authority; happiness/contentment; health: disease-prone; speech themes active.",
   "H3": "Courage and initiative through unconventional channels. Communication involves technology, foreign media, or unusual subject matter. Siblings in unusual circumstances. Short journeys to foreign or unconventional places. Ketu in H9: detachment from conventional dharma and father. [PD Ch.8]: longevity indicated; wealth indicated.",
   "H4": "Domestic life disrupted by unconventional circumstances. Home in foreign location or unusual style. Mother may be foreign or non-traditional. Property through unusual means. Emotional restlessness at the foundation. Ketu in H10: detachment from conventional career ambition. [PD Ch.8]: happiness: seldom; troubled mind. [CLASSICAL vs MODERN DIVERGENCE]: Modern Jyotish reads Rahu H4 as innovative domestic life; PD emphasizes disturbance and unhappiness. Both views should be weighed against dispositor strength.",
   "H5": "Intelligence and creativity channeled through unconventional or foreign education. Children in unusual circumstances. Speculative obsession — high-risk gambling, foreign investments. Romance follows unconventional patterns. Ketu in H11: detachment from social networks and conventional gains. [PD Ch.8]: health: stomach/digestive; speech themes active.",
   "H6": "Rahu in 6th — complex placement. Obsessive energy directed at overcoming obstacles, but method is unconventional and may create new enemies in the process. Health concerns: mysterious, difficult-to-diagnose, foreign-origin conditions. Service in unusual or technological capacity. Ketu in H12: spiritual liberation through surrender. [PD Ch.8]: troubled BY enemies; longevity indicated; wealth indicated. [CLASSICAL vs MODERN DIVERGENCE]: Modern Jyotish reads Rahu H6 as 'defeats enemies through unconventional means'; PD Ch.8 actually states the native is troubled BY enemies. The modern reading likely derives from the upachaya improvement principle (Rahu in upachaya improves over time per Saravali). Both may be true at different life stages — pre-maturation vs post-maturation (Rahu matures at 42).",
   "H7": "Partnership with foreign, unconventional, or non-traditional individuals. Marriage may cross cultural boundaries. Business partnerships involve foreign elements. Spouse as carrier of Rahu's hunger — the partner represents what the native obsessively seeks. Ketu in H1: detached self-identity.",
   "H8": "Powerful position for occult research and hidden knowledge. Sudden transformations through unconventional means. Inheritance from unusual sources. Sexuality involves unconventional elements. Longevity through unconventional healing. Ketu in H2: detachment from family wealth and speech. [PD Ch.8]: children: few; short life; health: disease-prone.",
   "H9": "Dharma through unconventional or foreign spiritual paths. Father may be absent, foreign, or unconventional. Fortune through foreign connections, technology, or breaking religious conventions. Long journeys to foreign lands. Ketu in H3: detachment from conventional courage and siblings. [PD Ch.8]: speech themes active.",
   "H10": "Career in foreign, technological, or convention-breaking domains. Public image involves novelty and unconventional achievement. Success through methods that others haven't tried. Government connections through unusual channels. Ketu in H4: emotional detachment from homeland. [PD Ch.8]: high status/authority.",
   "H11": "Gains through foreign and technological networks. Social circle is unusual, international, or counter-cultural. Aspirations are large and unconventional. Elder siblings in unusual circumstances. Ketu in H5: detachment from conventional intelligence and children matters. [PD Ch.8]: longevity indicated; wealth indicated; health: disease-prone.",
   "H12": "Foreign residence highly likely. Expenses through unusual or foreign circumstances. Spiritual seeking through unconventional paths. Isolation by choice in foreign environments. Dreams vivid and prophetic. Ketu in H6: past-life mastery over enemies, effortless overcoming. [PD Ch.8]: sinful conduct; health: disease-prone. [CLASSICAL vs MODERN DIVERGENCE]: Modern Jyotish reads Rahu H12 as spiritual foreign residence; PD emphasizes sinful conduct and disease. The modern reading may apply when dispositor is strong and benefic aspects are present."
  },
  "Ketu": {
   "H1": "Identity marked by detachment, spiritual inclination, and past-life impressions. The native's personality feels incomplete or searching — as if remembering something from before. Appearance may be ascetic or understated. Natural moksha orientation. Rahu in H7: obsessive hunger for partnership and public engagement. [PD Ch.8]: ungrateful; unhappy; deformed body; associated with outcastes; health: disease-prone. [CLASSICAL vs MODERN DIVERGENCE]: Modern Jyotish reads Ketu H1 as 'spiritual seeker with past-life wisdom'; PD is consistently negative — unhappiness, ingratitude, physical affliction. The modern reading may apply when Ketu's dispositor is strong and Jupiter aspects lagna.",
   "H2": "Detachment from family wealth, lineage, and accumulated resources. Speech may be abrupt, minimal, or mystically charged. Family dynamics involve separation or spiritual undercurrents. Indifference to food or material accumulation. Rahu in H8: obsessive research into hidden matters. [PD Ch.8]: learning: denied; dependent on others for food; speech: defective or harsh.",
   "H3": "Courage through detachment — fearless because unconcerned with outcome. Siblings may be distant or spiritual. Communication terse but penetrating. Past-life skills emerge through self-effort without training. Rahu in H9: obsessive pursuit of foreign dharma. [PD Ch.8]: longevity indicated; wealth indicated; wife: happy; sibling themes active.",
   "H4": "Emotional detachment from home, homeland, and mother-figures. Inner life is rich but difficult to articulate. Property matters subject to sudden change. Education disrupted or unconventional. Rahu in H10: obsessive career ambition compensates for rootlessness.",
   "H5": "Past-life intelligence surfaces as intuition. Children may be few, spiritually inclined, or involve unusual circumstances. Creativity is channeled through spiritual or abstract domains. Formal education may be disrupted but innate wisdom runs deep. Rahu in H11: obsessive social networking and gain-seeking. [PD Ch.8]: children: denied or few; evil-minded; stomach disorders. [CLASSICAL vs MODERN DIVERGENCE]: Modern Jyotish reads Ketu H5 as 'past-life merit and intuitive intelligence'; PD is negative on children and character. The modern reading may apply when dispositor is strong and 5th house receives benefic aspects.",
   "H6": "Excellent position — overcomes enemies and disease through detachment and past-life mastery. Mysterious health conditions that resolve as suddenly as they appear. Service without ego-investment. Healing capacity. Rahu in H12: foreign spiritual seeking, expenses in foreign lands.",
   "H7": "Partnership with spiritual, detached, or unusual individuals. Marriage may involve separation themes — not necessarily divorce, but emotional distance or spiritual focus over romantic. Partner carries Ketu's otherworldly quality. Rahu in H1: obsessive self-projection compensates. [PD Ch.8]: marriage: difficulties; health: disease-prone.",
   "H8": "Strong occult capacity from past-life practice. Transformation comes suddenly and completely. Detachment from fear of death enables deep research into hidden subjects. Karmic debts surface for resolution. Rahu in H2: obsessive wealth accumulation. [PD Ch.8]: longevity reduced.",
   "H9": "Deep spiritual dharma from past-life merit. Father may be spiritual, distant, or ascetic. Fortune through surrender rather than pursuit — what is needed arrives without seeking. Pilgrimage and renunciation as natural impulse. Rahu in H3: obsessive communication and self-promotion. [PD Ch.8]: sinful conduct; father: separation/hardship. [CLASSICAL vs MODERN DIVERGENCE]: Modern Jyotish reads Ketu H9 as 'deep spiritual dharma'; PD emphasizes sinful conduct and father-loss. The modern reading may apply with strong Jupiter aspect or benefic dispositor.",
   "H10": "Career in spiritual, healing, or research domains. Professional achievement comes unexpectedly and without conventional ambition. Authority is held lightly. Recognition arrives precisely when not sought. Rahu in H4: obsessive homebuilding and emotional security-seeking. [PD Ch.8]: wicked tendencies; health: disease-prone. [CLASSICAL vs MODERN DIVERGENCE]: Modern Jyotish reads Ketu H10 as 'spiritual career'; PD says 'wicked tendencies'. The modern reading may apply when 10th lord is strong and Saturn does not additionally afflict.",
   "H11": "Gains arrive unexpectedly, not through planned networking. Friends may be eccentric, spiritual, or from past-life connections. Aspirations transcend material — if material gains come, the native is indifferent. Rahu in H5: obsessive pursuit of intelligence, children, speculation. [PD Ch.8]: high status/authority; wealth indicated.",
   "H12": "Powerful moksha placement in modern interpretation. Spiritual liberation as dominant life theme. Expenses dissolve naturally. Foreign connections to ashrams, spiritual centers, or retreat environments. Past-life spiritual practice continues. Rahu in H6: obsessive service and enemy-defeating. [PD Ch.8]: wealth indicated; sinful conduct; health: eye/vision concerns; squanders money. [CLASSICAL vs MODERN DIVERGENCE]: This is the widest gap in the entire Rahu-Ketu corpus. Modern Jyotish reads Ketu H12 as 'Ketu's most comfortable position — moksha karaka in moksha sthana'; PD says sinful conduct, squanders money, eye disease. The modern reading applies ONLY when dispositor is strong, Jupiter aspects, and no malefic conjunction. Without these supports, PD's assessment dominates."
  }
 }
} as const;

export type Thesaurus = typeof PROSE_THESAURUS;

export function thesaurusNote(block: Record<string, unknown>): string {
  const n = (block as Record<string, unknown>)._note;
  return typeof n === "string" ? n : "";
}
