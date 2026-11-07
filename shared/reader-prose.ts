/**
 * Reviewed, optional editorial paraphrases of specific existing Nadi findings.
 * The source clause must still match: if the underlying rule changes, the reader falls
 * back to its existing plain theme instead of presenting an obsolete paraphrase.
 */
import type { Finding } from "./rules";
import type { PlainTopic } from "./topic-brief";

interface EditorialPassage {
  topic: PlainTopic;
  clause: string;
  en: string;
  ml: string;
}
const PASSAGES: Record<string, EditorialPassage> = {
  "t-ju-sa-me": { topic: "career", clause: "a career in accounts, law, teaching or writing; scholarly, methodical livelihood.",
    en: "One combination associates work with a methodical or scholarly approach. The source gives accounts, law, teaching and writing as possible examples.",
    ml: "ഒരു ഗ്രഹസംബന്ധത്തെ നാഡി വായന ക്രമബദ്ധമായതോ വിജ്ഞാനാധിഷ്ഠിതമായതോ ആയ തൊഴിലുമായി ബന്ധിപ്പിക്കുന്നു. അക്കൗണ്ട്സ്, നിയമം, അധ്യാപനം, എഴുത്ത് എന്നിവ ഉദാഹരണങ്ങളായി ഉറവിടം പറയുന്നു." },
  "t-ju-sa-su": { topic: "career", clause: "a government or institutional post of authority; administrative career.",
    en: "Another interpretation points toward administration or a position of responsibility in government or an institution.",
    ml: "മറ്റൊരു വ്യാഖ്യാനം ഭരണനിർവഹണത്തിലേക്കോ സർക്കാർ അല്ലെങ്കിൽ സ്ഥാപനങ്ങളിലെ ഉത്തരവാദിത്തമുള്ള സ്ഥാനങ്ങളിലേക്കോ വിരൽചൂണ്ടുന്നു." },
  "t-ju-sa-ma": { topic: "career", clause: "engineering or construction is the life's work; property is built through personal labour.",
    en: "A further rule names engineering and construction, and connects the building of property with personal effort.",
    ml: "മറ്റൊരു നിയമം എൻജിനീയറിങ്ങിനെയും നിർമാണമേഖലയെയും പരാമർശിക്കുന്നു; സ്വന്തം പരിശ്രമത്തിലൂടെ സ്വത്ത് ഉണ്ടാക്കുന്നതിനെയും ഇത് ബന്ധിപ്പിക്കുന്നു." },
  "t-ju-sa-ke": { topic: "career", clause: "technical or research work; a career with a break and a return, or a late spiritual turn.",
    en: "One source describes technical or research work and also raises the possibility of a break followed by a return, or a later spiritual turn.",
    ml: "ഒരു ഉറവിടം സാങ്കേതികമോ ഗവേഷണപരമോ ആയ ജോലിയെ വിവരിക്കുന്നു. തൊഴിലിൽ ഇടവേളയ്ക്കുശേഷം തിരിച്ചുവരാനുള്ള സാധ്യതയോ പിന്നീട് ആത്മീയതയിലേക്കുള്ള തിരിവോ അതിൽ പറയുന്നു." },
  "t-sa-ma-me": { topic: "career", clause: "technical and analytical profession; engineering, software, mathematics or mechanical trades.",
    en: "One combination points to technical and analytical work; the source's examples include engineering, software, mathematics and mechanical trades.",
    ml: "ഒരു ഗ്രഹസംബന്ധം സാങ്കേതികവും വിശകലനപരവുമായ ജോലിയെ സൂചിപ്പിക്കുന്നു. എൻജിനീയറിങ്, സോഫ്റ്റ്‌വെയർ, ഗണിതം, മെക്കാനിക്കൽ ജോലികൾ എന്നിവ ഉറവിടത്തിലെ ഉദാഹരണങ്ങളാണ്." },
  "t-sa-me-ra": { topic: "career", clause: "information technology, foreign languages or international trade; work for overseas clients.",
    en: "Another connects work with information technology, foreign languages or international trade, including work with clients abroad.",
    ml: "മറ്റൊരു സൂചന വിവരസാങ്കേതികവിദ്യ, വിദേശഭാഷകൾ, അന്താരാഷ്ട്ര വ്യാപാരം എന്നിവയുമായി ജോലിയെ ബന്ധിപ്പിക്കുന്നു; വിദേശത്തുള്ള ഉപഭോക്താക്കളുമായി പ്രവർത്തിക്കുന്നതും അതിൽ ഉൾപ്പെടുന്നു." },
  "t-sa-me-ke": { topic: "career", clause: "computing, coding, statistics or research; introverted, detail-driven livelihood.",
    en: "Another source names computing, coding, statistics and research, alongside work that calls for attention to detail.",
    ml: "മറ്റൊരു ഉറവിടം കമ്പ്യൂട്ടിങ്, കോഡിങ്, സ്ഥിതിവിവരക്കണക്ക്, ഗവേഷണം എന്നിവയും വിശദാംശങ്ങൾ ശ്രദ്ധിക്കുന്ന തൊഴിലുകളും പരാമർശിക്കുന്നു." },
  "t-sa-ve-ma": { topic: "career", clause: "vehicles, real estate, machinery or design; profit through property and technical craft.",
    en: "A separate rule mentions vehicles, property, machinery and design; it also associates property or technical craft with potential income.",
    ml: "വേറൊരു നിയമം വാഹനങ്ങൾ, ഭൂസ്വത്ത്, യന്ത്രങ്ങൾ, രൂപകൽപ്പന എന്നിവ പരാമർശിക്കുന്നു. ഭൂസ്വത്തിൽ നിന്നോ സാങ്കേതിക കരവിരുതിൽ നിന്നോ വരുമാനസാധ്യതയും അത് പറയുന്നു." },
  "t-ve-me-ra": { topic: "marriage", clause: "a spouse met through work, study or online; foreign or multilingual partner.",
    en: "One traditional interpretation considers the possibility of meeting a partner through work, study or online, or of a connection across places or languages.",
    ml: "ജോലിയിലൂടെയോ പഠനത്തിലൂടെയോ ഓൺലൈനായോ പങ്കാളിയെ കണ്ടുമുട്ടാനുള്ള സാധ്യത ഒരു പരമ്പരാഗത വ്യാഖ്യാനം പറയുന്നു. വിദേശബന്ധമോ ഒന്നിലധികം ഭാഷകളുമായുള്ള ബന്ധമോ അതിൽ ഉൾപ്പെടുന്നു." },
  "t-ve-ma-ra": { topic: "marriage", clause: "love marriage across community or nationality; intense, unconventional relationship.",
    en: "Another source describes a possible relationship across communities or nationalities, with an intense or unconventional quality.",
    ml: "മറ്റൊരു ഉറവിടം സമുദായങ്ങളോ ദേശീയതകളോ കടന്നുള്ള പ്രണയവിവാഹത്തിന്റെ സാധ്യതയും തീവ്രമോ പരമ്പരാഗതമല്ലാത്തതോ ആയ ബന്ധവും വിവരിക്കുന്നു." },
  "ve-sa": { topic: "marriage", clause: "delayed or duty-bound marriage; spouse may be older, hard-working or met through the workplace.",
    en: "A different rule brings responsibility and questions of timing into the picture; it also mentions a possible connection through work.",
    ml: "വേറൊരു നിയമം ബന്ധത്തിലെ ഉത്തരവാദിത്തത്തെയും സമയത്തെക്കുറിച്ചുള്ള ചോദ്യങ്ങളെയും മുന്നോട്ടുവയ്ക്കുന്നു; ജോലിയിലൂടെയുള്ള ബന്ധസാധ്യതയും അതിൽ പറയുന്നു." },
  "ve-ju": { topic: "marriage", clause: "a wise, supportive spouse who raises the native's fortune; marriage brings growth.",
    en: "Another interpretation associates partnership with support and growth.",
    ml: "മറ്റൊരു വ്യാഖ്യാനം പങ്കാളിത്തത്തെ പിന്തുണയോടും വളർച്ചയോടും ബന്ധിപ്പിക്കുന്നു." },
  "ve-su": { topic: "marriage", clause: "spouse from an influential family; ego and status enter the relationship.",
    en: "Another rule mentions a partner's family background and the possible role of status or pride in the relationship.",
    ml: "പങ്കാളിയുടെ കുടുംബപശ്ചാത്തലവും ബന്ധത്തിൽ സ്ഥാനമാനത്തിനോ അഭിമാനത്തിനോ ഉണ്ടാകാവുന്ന പങ്കും മറ്റൊരു നിയമം പരാമർശിക്കുന്നു." },
};

/** Only prose already selected for this topic, backed by the matching evaluated rule. */
export function readerPassage(topic: PlainTopic, ruleId: string | undefined, findings: readonly Finding[]): EditorialPassage | undefined {
  const passage = ruleId ? PASSAGES[ruleId] : undefined;
  if (!passage || passage.topic !== topic) return undefined;
  const finding = findings.find((f) => f.ruleId === ruleId && f.area === topic);
  return finding?.text.includes(passage.clause) ? passage : undefined;
}
