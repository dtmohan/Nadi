import { AGREEMENT_SYSTEM_LABEL, AGREEMENT_TOPIC_LABEL, type AgreementSystem, type TopicAgreement } from "./agreement";
import type { Stance } from "./kernel";

/** Translate only a complete, reconstructed agreement sentence; do not infer missing voices. */
export function agreementSentenceMalayalam(t: TopicAgreement, source: string): string | undefined {
  const topic: Record<string, string> = { marriage: "വിവാഹം", children: "സന്താനം", career: "ജീവിതവൃത്തി", father: "അച്ഛൻ", mother: "അമ്മ", lifespan: "ആയുർദൈർഘ്യം" };
  const systems: Record<AgreementSystem, string> = { bnn: "നാഡി", parashari: "പരാശരി", jaimini: "ജൈമിനി", kp: "KP" };
  const words: Record<string, string> = { promised: "വാഗ്ദാനം ചെയ്യുന്നു", "partly promised": "ഭാഗികമായി വാഗ്ദാനം ചെയ്യുന്നു", indicated: "സൂചിപ്പിക്കുന്നു", "partly indicated": "ഭാഗികമായി സൂചിപ്പിക്കുന്നു", supported: "പിന്തുണയ്ക്കുന്നു", "partly supported": "ഭാഗികമായി പിന്തുണയ്ക്കുന്നു", mixed: "സമ്മിശ്രമാണ്", contested: "വ്യത്യസ്ത സൂചനകളുണ്ട്", "partly strained": "ഭാഗികമായി ബുദ്ധിമുട്ട് സൂചിപ്പിക്കുന്നു", strained: "ബുദ്ധിമുട്ട് സൂചിപ്പിക്കുന്നു", "read long": "ദീർഘമായി വായിക്കുന്നു", "leans long": "ദീർഘത്തിലേക്ക് ചായുന്നു", "read middling": "മധ്യമായി വായിക്കുന്നു", "leans short": "കുറവിലേക്ക് ചായുന്നു", "read short": "കുറവായി വായിക്കുന്നു" };
  const order: Stance[] = ["supports", "leans-supports", "mixed", "contested", "leans-strains", "strains"];
  if (!topic[t.topic] || t.label !== AGREEMENT_TOPIC_LABEL[t.topic] || t.stances.some((s) => !systems[s.system])) return undefined;
  const spoken = t.stances.filter((s) => s.stance !== "silent"), silent = t.stances.filter((s) => s.stance === "silent");
  if (spoken.some((s) => !order.includes(s.stance) || !words[s.word])) return undefined;
  const joinEn = (xs: string[]) => xs.length < 2 ? xs[0] ?? "" : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
  const joinMl = (xs: string[]) => xs.length < 2 ? xs[0] ?? "" : `${xs.slice(0, -1).join(", ")} കൂടാതെ ${xs[xs.length - 1]}`;
  const groups: { word: string; ids: AgreementSystem[] }[] = [];
  for (const stance of order) for (const s of spoken.filter((x) => x.stance === stance)) {
    const g = groups.find((x) => x.word === s.word);
    if (g) g.ids.push(s.system); else groups.push({ word: s.word, ids: [s.system] });
  }
  const up = spoken.some((s) => s.stance === "supports" || s.stance === "leans-supports");
  const down = spoken.some((s) => s.stance === "strains" || s.stance === "leans-strains");
  const torn = spoken.filter((s) => s.stance === "contested").map((s) => s.system);
  const english = (ids: AgreementSystem[]) => joinEn(ids.map((id) => AGREEMENT_SYSTEM_LABEL[id]));
  const malayalam = (ids: AgreementSystem[]) => joinMl(ids.map((id) => systems[id]));
  const tail: Record<TopicAgreement["verdict"], string> = { agree: "the systems agree", lean: "the systems lean one way without agreeing", mixed: "each system that reads it is mixed", disagree: up && down ? "the systems disagree" : up || down ? `the systems disagree, and ${english(torn)} ${torn.length === 1 ? "is" : "are"} split within` : `the readings are disputed within ${english(torn)}`, quiet: "too little is read to compare" };
  const tailMl: Record<TopicAgreement["verdict"], string> = { agree: "രീതികൾ യോജിക്കുന്നു", lean: "രീതികൾ യോജിക്കാതെ ഒരു ദിശയിലേക്കു ചായുന്നു", mixed: "ഇത് വായിക്കുന്ന ഓരോ രീതിയിലും സമ്മിശ്രമാണ്", disagree: up && down ? "രീതികൾ വിയോജിക്കുന്നു" : up || down ? `രീതികൾ വിയോജിക്കുന്നു; ${malayalam(torn)} രീതിക്കുള്ളിലും അഭിപ്രായഭിന്നതയുണ്ട്` : `${malayalam(torn)} രീതിക്കുള്ളിൽ വായനകൾ വിയോജിക്കുന്നു`, quiet: "താരതമ്യം ചെയ്യാൻ വായന വളരെ കുറവാണ്" };
  const quiet = silent.filter((s) => s.word !== "no verdict").map((s) => s.system), describing = silent.filter((s) => s.word === "no verdict").map((s) => s.system);
  const unread = (quiet.length ? ` ${english(quiet)} ${quiet.length === 1 ? "does" : "do"} not read it.` : "") + (describing.length ? ` ${english(describing)} ${describing.length === 1 ? "has" : "have"} no verdict on this general question.` : "");
  const expected = !spoken.length ? `${t.label}: no system reads it strongly.` : `${t.label}: ${groups.map((g) => `${g.word} by ${english(g.ids)}`).join(", ")}: ${tail[t.verdict]}.${unread}`;
  if (source !== expected) return undefined;
  if (!spoken.length) return `${topic[t.topic]}: ഒരു രീതിയും ഇതിനെ ശക്തമായി വായിക്കുന്നില്ല.`;
  return `${topic[t.topic]}: ${groups.map((g) => `${malayalam(g.ids)} ${words[g.word]}`).join("; ")}. ${tailMl[t.verdict]}.${quiet.length ? ` ${malayalam(quiet)} ഇത് വായിക്കുന്നില്ല.` : ""}${describing.length ? ` ഈ പൊതുചോദ്യത്തിൽ ${malayalam(describing)} ഒരു നിഗമനം നൽകുന്നില്ല.` : ""}`;
}
