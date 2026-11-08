/** Exact report-method notes: altered source or unsupported frame labels remain English. */
export function nakshatraFrameNoteMalayalam(label: string, ayanamsa: string | undefined, source: string): string | undefined {
  const expected = `${label}: selected ${ayanamsa ?? "unspecified"} ayanamsa. A star quarter is one D9 interval; the two descriptions are not independent confirmations. Boundaries depend on the birth time and calculation settings.`;
  if (source !== expected) return undefined;
  const labels: Record<string, string> = {
    "Planet and ascendant quarters": "ഗ്രഹങ്ങളുടെയും ലഗ്നത്തിന്റെയും നക്ഷത്രപാദങ്ങൾ",
    "Birth-chart star and D9 context": "ജനനജാതകത്തിലെ നക്ഷത്രവും D9 പശ്ചാത്തലവും",
    "KP frame: house, star and dispositor context": "KP ചട്ടക്കൂട്: ഭാവം, നക്ഷത്രം, അധിപന്മാർ എന്നിവയുടെ പശ്ചാത്തലം",
  };
  const frame = labels[label];
  const ayanamsas: Record<string, string> = { lahiri: "ലാഹിരി", raman: "രാമൻ", kp: "KP", yukteshwar: "യുക്തേശ്വർ", unspecified: "പറഞ്ഞിട്ടില്ലാത്ത" };
  const ay = ayanamsas[ayanamsa ?? "unspecified"];
  if (!frame || !ay) return undefined;
  return `${frame}: തിരഞ്ഞെടുത്ത അയനാംശം ${ay}. ഒരു നക്ഷത്രപാദം ഒരു D9 ഇടവേളയാണ്; ഈ രണ്ടു വിവരണങ്ങളും സ്വതന്ത്രമായ സ്ഥിരീകരണങ്ങളല്ല. അതിർത്തികൾ ജനനസമയത്തെയും കണക്കുകൂട്ടൽ ക്രമീകരണങ്ങളെയും ആശ്രയിക്കുന്നു.`;
}

export const NAKSHATRA_REPORT_NOTES: Record<string, string> = {
  "This is the KP ayanamsa and Placidus frame. D9 and Sutton labels are comparative geometry, not KP sub-lords or KP event conditions. Qualifications do not add event-score points.": "ഇത് KP അയനാംശവും പ്ലാസിഡസ് രീതിയും ഉപയോഗിക്കുന്ന ചട്ടക്കൂടാണ്. D9-ഉം സട്ടണിന്റെ പേരുകളും താരതമ്യത്തിനുള്ള ജ്യാമിതീയ വിവരണങ്ങളാണ്; KP സഹാധിപന്മാരോ KP സംഭവവ്യവസ്ഥകളോ അല്ല. ഈ പ്രത്യേകതകൾ സംഭവസ്കോറിലേക്ക് പോയിന്റുകൾ ചേർക്കുന്നില്ല.",
  "Qualifications are descriptive and do not add event-score points. Sutton's ashtamamsha counts D9 from the point's D1 sign. Naik's BNN solar condition uses the Sun's same quarter; within 3°20′ across a boundary does not satisfy it. Sun and nodes are excluded by the app's convention. Parashari has separate solar orbs. The corrected BNN condition can change BNN readings.": "ഈ പ്രത്യേകതകൾ വിവരണത്തിനുള്ളതാണ്; സംഭവസ്കോറിലേക്ക് പോയിന്റുകൾ ചേർക്കുന്നില്ല. സട്ടണിന്റെ അഷ്ടമാംശം ബിന്ദുവിന്റെ D1 രാശിയിൽനിന്ന് D9 എണ്ണുന്നു. നായിക്കിന്റെ BNN സൗരവ്യവസ്ഥ സൂര്യന്റെ അതേ പാദമാണ് ഉപയോഗിക്കുന്നത്; അതിർത്തി കടന്ന് 3°20′-നുള്ളിൽ വന്നാൽ അതു വ്യവസ്ഥ നിറവേറ്റുന്നില്ല. സൂര്യനെയും രാഹു–കേതുക്കളെയും ഒഴിവാക്കുന്നത് ആപ്പിന്റെ രീതിയാണ്. പരാശരിയിൽ സൂര്യനോടുള്ള അകലത്തിന് വേറെ പരിധികളുണ്ട്. തിരുത്തിയ BNN വ്യവസ്ഥ BNN വായനകളെ മാറ്റാം.",
  "Lord placements use this frame's D1 and D9 whole-sign houses; the count runs from the point to the lord. The D9 sign lord is not a KP sub-lord. These are descriptive facts, with no new points or event prediction.": "അധിപന്മാരുടെ സ്ഥാനങ്ങൾ ഈ ചട്ടക്കൂടിലെ D1, D9 പൂർണരാശി ഭാവങ്ങൾ ഉപയോഗിക്കുന്നു; ബിന്ദുവിൽനിന്ന് അധിപനിലേക്കാണ് എണ്ണുന്നത്. D9 രാശ്യാധിപൻ KP സഹാധിപനല്ല. ഇവ വിവരണത്തിനുള്ള വിവരങ്ങളാണ്; പുതിയ പോയിന്റുകളോ സംഭവപ്രവചനമോ നൽകുന്നില്ല.",
};
