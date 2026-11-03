import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * A minimal, dependency-free localisation layer. `Locale` is "en" or "ml"; the dictionary is keyed
 * by the English source string and returns the Malayalam (script) rendering when the locale is ml.
 * This is an incremental translation: untranslated text deliberately falls back to English.
 * Translations of generated readings must preserve their source's qualifications and uncertainty.
 */

export type Locale = "en" | "ml";

const ML: Record<string, string> = {
  // ── Home · casting ─────────────────────────────────────────────────────────
  "Start here": "ഇവിടെ തുടങ്ങുക",
  "Cast a chart": "ജാതകം ഉണ്ടാക്കുക",
  "Sidereal positions from the Swiss Ephemeris. No lagna is needed: Nadi reads the planets by sign alone.":
    "സ്വിസ് എഫെമെറിസ് ഉപയോഗിച്ചുള്ള നിരയണ (സിഡീരിയൽ) ഗ്രഹസ്ഥാനങ്ങൾ. നാഡി വായനയ്ക്ക് ലഗ്നം ആവശ്യമില്ല; ഗ്രഹങ്ങളെ രാശി അടിസ്ഥാനമാക്കിയാണ് വായിക്കുന്നത്.",
  "Cast a chart — a name, a date, a time and a place are enough — or import a backup file under Saved charts.": "ജാതകം ഉണ്ടാക്കാൻ പേര്, ജനനത്തീയതി, സമയം, സ്ഥലം എന്നിവ നൽകുക. അല്ലെങ്കിൽ സൂക്ഷിച്ച ജാതകങ്ങളുടെ ഭാഗത്ത് ഒരു ബാക്കപ്പ് ഫയൽ ഇംപോർട്ട് ചെയ്യാം.",
  "Read the Nadi tab first: the planets read against each other by sign, with no houses. Every other tab is one more system and each is kept separate; none is blended into another.": "ആദ്യം നാഡി ഭാഗം വായിക്കുക. അവിടെ ഭാവങ്ങൾ ഉപയോഗിക്കാതെ ഗ്രഹങ്ങളെ രാശികളിൽ പരസ്പരം താരതമ്യം ചെയ്യുന്നു. മറ്റു ഭാഗങ്ങൾ ഓരോന്നും വേറിട്ട രീതികളാണ്; അവയുടെ വായനകൾ കൂട്ടിക്കലർത്തുന്നില്ല.",
  "Compare the systems in “Where the systems agree or differ”, above the tabs on the chart page: each gives its own verdict on marriage, children, career and parents.": "ജാതകപ്പേജിൽ വിവിധ രീതികളുടെ താരതമ്യം കാണാം. വിവാഹം, സന്താനം, തൊഴിൽ, മാതാപിതാക്കൾ എന്നിവയെക്കുറിച്ച് ഓരോ രീതിയുടെയും സൂചനകൾ അവിടെ വേറിട്ട് കാണിക്കുന്നു.",
  "Test it: add dated life events to the chart, then let Rectify check a birth time and Validate read the events back at their dates. Checks, not readings.": "പരിശോധിക്കാൻ ജീവിതസംഭവങ്ങളും അവയുടെ തീയതികളും ചേർക്കുക. തുടർന്ന് ജനനസമയം പരിശോധിക്കാനും ആ തീയതികളിലെ സൂചനകൾ താരതമ്യം ചെയ്യാനും കഴിയും. ഇവ പരിശോധനകളാണ്; പൂർണ വായനകളല്ല.",
  "Method page": "രീതികളുടെ പേജ്",
  "explains what each system reads and where its rules come from.": "ഓരോ രീതിയും എന്താണ് പരിശോധിക്കുന്നതെന്നും അതിന്റെ നിയമങ്ങൾ എവിടെ നിന്നാണ് എടുത്തതെന്നും വിശദീകരിക്കുന്നു.",
  Name: "പേര്",
  "Who is this chart for?": "ഈ ജാതകം ആർക്കുവേണ്ടി?",
  Gender: "ലിംഗം",
  Unspecified: "പറയാത്തത്",
  Female: "സ്ത്രീ",
  Male: "പുരുഷൻ",
  "Date of birth": "ജനനത്തീയതി",
  "Local time": "പ്രാദേശിക സമയം",
  "Date of passing": "വിയോഗത്തീയതി",
  "(optional)": "(നിർബന്ധമില്ല)",
  "Place of birth": "ജനനസ്ഥലം",
  "Ayanamsa, nodes & time standard": "അയനാംശം, രാഹു-കേതു, സമയ നിലവാരം",
  Ayanamsa: "അയനാംശം",
  "Rahu / Ketu": "രാഹു / കേതു",
  "Mean node": "ശരാശരി നോഡ്",
  "True node": "യഥാർത്ഥ നോഡ്",
  Sunrise: "സൂര്യോദയം",
  "Time zone": "സമയ മേഖല",
  "Time standard": "സമയ നിലവാരം",
  Latitude: "അക്ഷാംശം",
  Longitude: "രേഖാംശം",
  "Cast and read": "ഗണിച്ച് വായിക്കുക",
  "Saved charts": "സൂക്ഷിച്ച ജാതകങ്ങൾ",
  Import: "ഇംപോർട്ട്",
  Export: "എക്സ്പോർട്ട്",
  "No charts saved yet.": "ഇതുവരെ ജാതകങ്ങൾ സൂക്ഷിച്ചിട്ടില്ല.",
  "Once you cast one, you will see Jupiter as the Jeeva karaka (the native), Saturn as the Karma karaka (the profession), and how the other planets sit with them by sign, adjacency, trine and opposition.": "ജാതകം ഉണ്ടാക്കിക്കഴിഞ്ഞാൽ വ്യാഴത്തെ ജീവകാരകനായും (വ്യക്തി), ശനിയെ കർമകാരകനായും (തൊഴിൽ) കാണാം. മറ്റു ഗ്രഹങ്ങൾക്ക് അവയുമായുള്ള രാശി, തൊട്ടടുത്ത രാശി, ത്രികോണം, എതിർരാശി എന്നീ ബന്ധങ്ങളും കാണാം.",
  "Female charts are read with Venus as the native and Mars as the husband (Rao). Unspecified reads as male.": "റാവുവിന്റെ നാഡി രീതിയിൽ സ്ത്രീജാതകത്തിൽ ശുക്രനെ വ്യക്തിയായും ചൊവ്വയെ ഭർത്താവായും വായിക്കുന്നു. ലിംഗം വ്യക്തമാക്കിയില്ലെങ്കിൽ പുരുഷജാതകമായി വായിക്കുന്നു.",
  "Optional. Fixes the age the readings use and lets the lifespan methods be checked against a life that has run its course. Never used to compute or show a forecast.": "നിർബന്ധമില്ല. വായനയിലെ വയസ്സ് നിശ്ചയിക്കാനും പൂർണമായ ഒരു ജീവിതത്തെ അടിസ്ഥാനമാക്കി ആയുർദായ രീതികൾ പരിശോധിക്കാനും ഉപയോഗിക്കുന്നു. പ്രവചനം കണക്കാക്കാനോ കാണിക്കാനോ ഇത് ഉപയോഗിക്കുന്നില്ല.",
  "Import charts from a backup file": "ബാക്കപ്പ് ഫയലിൽ നിന്ന് ജാതകങ്ങൾ ഇംപോർട്ട് ചെയ്യുക",
  "Download every saved chart as a backup file": "സൂക്ഷിച്ച എല്ലാ ജാതകങ്ങളുടെയും ബാക്കപ്പ് ഫയൽ ഡൗൺലോഡ് ചെയ്യുക",
  "Summary unavailable; open the chart to read it.": "ചുരുക്കം ലഭ്യമല്ല; വായിക്കാൻ ജാതകം തുറക്കുക.",
  "Today": "ഇന്ന്",
  "(its natal sign)": "(ജനനരാശി)",
  "Randomly selected comparison dates": "താരതമ്യത്തിനായി ക്രമരഹിതമായി തിരഞ്ഞെടുത്ത തീയതികൾ",
  "House lord": "ഭാവാധിപൻ",
  "Sign lord": "രാശ്യാധിപൻ",
  "Star lord": "നക്ഷത്രാധിപൻ",
  "Sub lord": "സഹാധിപൻ (sub-lord)",
  age: "വയസ്സ്",
  "Language / ഭാഷ": "ഭാഷ / Language",
  "New chart": "പുതിയ ജാതകം",
  "Rule book": "നിയമപുസ്തകം",
  Method: "രീതികൾ",
  "Bhrigu Nandi reader": "ഭൃഗു നന്ദി വായന",
  "None yet. Cast one to begin.": "ഇതുവരെ ജാതകങ്ങളില്ല. തുടങ്ങാൻ ഒരു ജാതകം ഉണ്ടാക്കുക.",
  "Light mode": "വെളിച്ചമുള്ള പശ്ചാത്തലം",
  "Dark mode": "ഇരുണ്ട പശ്ചാത്തലം",
  "City of birth": "ജനിച്ച നഗരം",
  "Place search is unavailable. Try again or enter coordinates manually.": "സ്ഥലം തിരയാൻ ഇപ്പോൾ കഴിയുന്നില്ല. വീണ്ടും ശ്രമിക്കുകയോ അക്ഷാംശവും രേഖാംശവും നേരിട്ട് നൽകുകയോ ചെയ്യുക.",
  "No matching places found. Try another name or enter coordinates manually.": "പൊരുത്തമുള്ള സ്ഥലം കണ്ടെത്തിയില്ല. മറ്റൊരു പേര് നൽകുകയോ അക്ഷാംശവും രേഖാംശവും നേരിട്ട് നൽകുകയോ ചെയ്യുക.",
  "Select a place from the suggestions, or enter its coordinates and time zone in the advanced settings.": "പട്ടികയിൽ നിന്ന് ഒരു സ്ഥലം തിരഞ്ഞെടുക്കുക. അല്ലെങ്കിൽ കൂടുതൽ ക്രമീകരണങ്ങളിൽ അക്ഷാംശം, രേഖാംശം, സമയ മേഖല എന്നിവ നൽകുക.",
  "Automatic": "സ്വയമേവ",
  "Zone database": "സമയമേഖലാ ഡാറ്റാബേസ്",
  "Local mean time": "പ്രാദേശിക ശരാശരി സമയം",
  "Fixed offset": "നിശ്ചിത സമയവ്യത്യാസം",
  "Zone database, except before standard time, when the birthplace's own mean time is used; a short table of legal exceptions (Paris, Dublin, Amsterdam, Bombay, Calcutta, India War Time) overrides both.": "സാധാരണ സമയമേഖലാ ഡാറ്റാബേസ് ഉപയോഗിക്കുന്നു. ഒരു സ്ഥലത്ത് സ്റ്റാൻഡേർഡ് സമയം നിലവിൽ വരുന്നതിനു മുമ്പ് ജനനസ്ഥലത്തിന്റെ ശരാശരി സമയമാണ് ഉപയോഗിക്കുന്നത്. ചില നിയമപരമായ സമയവ്യത്യാസങ്ങൾക്കുള്ള പട്ടിക ഇതിന് മുൻഗണന നൽകുന്നു (പാരീസ്, ഡബ്ലിൻ, ആംസ്റ്റർഡാം, ബോംബെ, കൽക്കട്ട, ഇന്ത്യയിലെ യുദ്ധകാല സമയം).",
  "Always the IANA offset, even for dates before standard time (reference-city mean time).": "സ്റ്റാൻഡേർഡ് സമയം നിലവിൽ വരുന്നതിനു മുമ്പുള്ള തീയതികളിലും IANA സമയവ്യത്യാസം ഉപയോഗിക്കുന്നു (റഫറൻസ് നഗരത്തിന്റെ ശരാശരി സമയം).",
  "Mean solar time of the birthplace: four minutes per degree of longitude.": "ജനനസ്ഥലത്തെ ശരാശരി സൗരസമയം: ഓരോ ഡിഗ്രി രേഖാംശത്തിനും നാല് മിനിറ്റ് വീതം.",
  "An offset from UTC that you supply, such as +05:30 or +05:53:20.": "UTC-യിൽ നിന്നുള്ള സമയവ്യത്യാസം നേരിട്ട് നൽകുക; ഉദാഹരണത്തിന് +05:30 അല്ലെങ്കിൽ +05:53:20.",
  "This preview cannot keep charts between reloads; the published site saves them on your device. Nothing is stored online.": "ഈ പ്രിവ്യൂവിൽ പേജ് വീണ്ടും തുറക്കുമ്പോൾ ജാതകങ്ങൾ നിലനിൽക്കില്ല. പ്രസിദ്ധീകരിച്ച സൈറ്റ് അവ നിങ്ങളുടെ ഉപകരണത്തിൽ സൂക്ഷിക്കും; ഓൺലൈനിൽ സൂക്ഷിക്കില്ല.",
  "Saved on this device only. Nothing is stored online; export a backup to keep them or move them to another device.": "ജാതകങ്ങൾ ഈ ഉപകരണത്തിൽ മാത്രമാണ് സൂക്ഷിക്കുന്നത്; ഓൺലൈനിൽ സൂക്ഷിക്കുന്നില്ല. മറ്റൊരു ഉപകരണത്തിലേക്ക് മാറ്റാനോ പകർപ്പ് സൂക്ഷിക്കാനോ എക്സ്പോർട്ട് ചെയ്യുക.",
  "Overview": "അവലോകനം",
  "Bhrigu Nandi Nadi": "ഭൃഗു നന്ദി നാഡി",
  "Jaimini": "ജൈമിനി",
  "Parashari": "പരാശരി",
  "Prasna Marga": "പ്രശ്ന മാർഗം",
  "Prasna": "പ്രശ്നം",
  "Panchanga": "പഞ്ചാംഗം",
  "Rectify": "ജനനസമയം തിരുത്തൽ",
  "Validate": "സംഭവ പരിശോധന",
  "Reading system": "ജ്യോതിഷ രീതി",
  "Reading depth": "വായനയുടെ വിശദത",
  "Plain reading": "ലളിതമായ വായന",
  "Practitioner": "വിദഗ്ധ വായന",
  "Report": "റിപ്പോർട്ട്",
  "Export PDF": "PDF എക്സ്പോർട്ട് ചെയ്യുക",
  "Preparing PDF": "PDF തയ്യാറാക്കുന്നു",
  "This tab as PDF": "ഈ ഭാഗം PDF ആയി",
  "Chart unavailable": "ജാതകം ലഭ്യമല്ല",
  "Life events": "ജീവിതസംഭവങ്ങൾ",
  "none saved": "സംഭവങ്ങളൊന്നും സൂക്ഷിച്ചിട്ടില്ല",
  "Birth of a child": "കുഞ്ഞിന്റെ ജനനം",
  "New job, promotion": "പുതിയ ജോലി, സ്ഥാനക്കയറ്റം",
  "Loss of job": "ജോലി നഷ്ടം",
  "Started a business": "ബിസിനസ് ആരംഭിച്ചു",
  "Bought a house or land": "വീടോ സ്ഥലമോ വാങ്ങി",
  "Bought a vehicle": "വാഹനം വാങ്ങി",
  "Admission to higher study": "ഉപരിപഠന പ്രവേശനം",
  "Went abroad": "വിദേശത്തേക്ക് പോയി",
  "Returned from abroad": "വിദേശത്തുനിന്ന് മടങ്ങി",
  "Illness, operation, hospital": "രോഗം, ശസ്ത്രക്രിയ, ആശുപത്രി",
  "Accident": "അപകടം",
  "Loss of father": "അച്ഛന്റെ വിയോഗം",
  "Loss of mother": "അമ്മയുടെ വിയോഗം",
  "Loss of spouse": "പങ്കാളിയുടെ വിയോഗം",
  "Change of residence": "താമസസ്ഥലം മാറ്റി",
  "Won a case": "കേസിൽ വിജയം",
  "Loan or large receipt": "വായ്പ അല്ലെങ്കിൽ വലിയ തുക ലഭിച്ചത്",
  "Edit time": "ജനനസമയം തിരുത്തുക",
  "Birth time": "ജനനസമയം",
  "Save time": "സമയം സേവ് ചെയ്യുക",
  "Saving…": "സൂക്ഷിക്കുന്നു…",
  "Cancel": "റദ്ദാക്കുക",
  "Enter a time as HH:MM or HH:MM:SS": "സമയം HH:MM അല്ലെങ്കിൽ HH:MM:SS രൂപത്തിൽ നൽകുക",
  "Birth time updated": "ജനനസമയം പുതുക്കി",
  "Could not change the birth time": "ജനനസമയം മാറ്റാനായില്ല",
  "The chart keeps its name and life events; every reading recomputes from the new time, and the change is added to the notes.": "ജാതകത്തിന്റെ പേരും ജീവിതസംഭവങ്ങളും നിലനിൽക്കും. പുതിയ സമയം ഉപയോഗിച്ച് എല്ലാ വായനകളും വീണ്ടും കണക്കാക്കും; മാറ്റം കുറിപ്പുകളിൽ ചേർക്കും.",
  "Not found.": "കണ്ടെത്താനായില്ല.",
  "Back": "തിരികെ",
  "Across the systems": "വിവിധ രീതികളുടെ താരതമ്യം",
  "Where the systems agree or differ": "രീതികൾ എവിടെ യോജിക്കുന്നു, എവിടെ വ്യത്യാസപ്പെടുന്നു",
  "agree": "യോജിക്കുന്നു",
  "lean": "ഒരു ദിശയിലേക്ക് ചായുന്നു",
  "mixed": "സമ്മിശ്രം",
  "disagree": "വ്യത്യാസപ്പെടുന്നു",
  "quiet": "വ്യക്തമായ സൂചനയില്ല",
  "Life span": "ആയുസ്സ്",
  "The whole chart in a minute: what rests on firm ground, what asks for care, and the period and slow planets running now.": "ജാതകത്തിന്റെ ഒരു ചുരുക്കം: അനുകൂല സൂചനകൾ, ശ്രദ്ധ വേണ്ട മേഖലകൾ, ഇപ്പോഴത്തെ ദശയും സാവധാനം സഞ്ചരിക്കുന്ന ഗ്രഹങ്ങളും.",
  "See other schools": "മറ്റു രീതികളും കാണുക",
  "Other birth-chart conditions": "ജനനജാതകത്തിലെ മറ്റ് അവസ്ഥകൾ",
  "These short readings use the Nadi method. Other schools have their own readings.": "ഈ ചുരുക്കവായനകൾ നാഡി രീതി ഉപയോഗിക്കുന്നു. മറ്റു രീതികൾക്ക് അവരുടേതായ വായനകളുണ്ട്.",
  "Open a topic to compare selected interpretations from the other schools. Their coverage differs; ALP is date-specific and Prasna Marga here uses the birth chart.": "മറ്റു രീതികളിലെ തിരഞ്ഞെടുത്ത വ്യാഖ്യാനങ്ങൾ താരതമ്യം ചെയ്യാൻ ഒരു വിഷയം തുറക്കുക. ഓരോ രീതിയും പരിശോധിക്കുന്ന കാര്യങ്ങൾ വ്യത്യസ്തമാണ്. ALP ഒരു പ്രത്യേക തീയതിയെ അടിസ്ഥാനമാക്കുന്നു; ഇവിടത്തെ പ്രശ്ന മാർഗ വായന ജനനജാതകത്തെ അടിസ്ഥാനമാക്കുന്നു.",
  "These are alternative interpretations, not a prediction of a particular occupation, promotion or job change. The full reading shows the other findings.": "ഇവ പരസ്പരം വ്യത്യസ്തമായ വ്യാഖ്യാനങ്ങളാണ്; ഒരു പ്രത്യേക തൊഴിൽ, സ്ഥാനക്കയറ്റം, ജോലി മാറ്റം എന്നിവയെക്കുറിച്ചുള്ള പ്രവചനമല്ല. പൂർണ വായനയിൽ മറ്റ് സൂചനകളും കാണാം.",
  "The selected Nadi rules describe these possible work themes or experiences:": "തിരഞ്ഞെടുത്ത നാഡി നിയമങ്ങൾ തൊഴിൽ സംബന്ധിച്ച് താഴെ പറയുന്ന സാധ്യതകൾ സൂചിപ്പിക്കുന്നു:",
  "The Nadi rules selected here do not give a specific work theme.": "ഇവിടെ തിരഞ്ഞെടുത്ത നാഡി നിയമങ്ങൾ തൊഴിൽ സംബന്ധിച്ച് ഒരു പ്രത്യേക സൂചന നൽകുന്നില്ല.",
  "Police, defence, engineering in government or heavy administration.": "പോലീസ്, പ്രതിരോധം, സർക്കാർ എഞ്ചിനീയറിങ് അല്ലെങ്കിൽ വലിയ തോതിലുള്ള ഭരണനിർവഹണം.",
  "Technical and analytical profession.": "സാങ്കേതികവും വിശകലനപരവുമായ തൊഴിൽ.",
  "Vehicles, real estate, machinery or design.": "വാഹനങ്ങൾ, ഭൂസ്വത്ത്, യന്ത്രങ്ങൾ അല്ലെങ്കിൽ രൂപകൽപ്പന.",
  "Advisor, teacher, financier or artist.": "ഉപദേശകൻ, അധ്യാപകൻ, ധനകാര്യ പ്രവർത്തകൻ അല്ലെങ്കിൽ കലാകാരൻ.",
  "Computing, coding, statistics or research.": "കമ്പ്യൂട്ടിങ്, കോഡിങ്, സ്ഥിതിവിവരക്കണക്ക് അല്ലെങ്കിൽ ഗവേഷണം.",
  "Government, administration or a large institution.": "സർക്കാർ, ഭരണനിർവഹണം അല്ലെങ്കിൽ ഒരു വലിയ സ്ഥാപനം.",
  "Information technology, foreign languages or international trade.": "വിവരസാങ്കേതികവിദ്യ, വിദേശഭാഷകൾ അല്ലെങ്കിൽ അന്താരാഷ്ട്ര വ്യാപാരം.",
  "A career in accounts, law, teaching or writing.": "അക്കൗണ്ട്സ്, നിയമം, അധ്യാപനം അല്ലെങ്കിൽ എഴുത്ത് മേഖലയിലെ തൊഴിൽ.",
  "Profession linked to finance, arts, luxury goods, vehicles, hospitality or women-centred fields.": "ധനകാര്യം, കല, ആഡംബരവസ്തുക്കൾ, വാഹനങ്ങൾ, അതിഥിസൽക്കാരം അല്ലെങ്കിൽ സ്ത്രീകൾക്കായുള്ള മേഖലകളുമായി ബന്ധപ്പെട്ട തൊഴിൽ.",
  "Livelihood through commerce, accounts, writing, communication, teaching or documentation.": "വ്യാപാരം, അക്കൗണ്ട്സ്, എഴുത്ത്, ആശയവിനിമയം, അധ്യാപനം അല്ലെങ്കിൽ രേഖപ്പെടുത്തൽ എന്നിവയിലൂടെയുള്ള ഉപജീവനം.",
  "Work and personal identity may be closely linked.": "തൊഴിലും വ്യക്തിത്വവും അടുത്ത ബന്ധമുള്ളവയാകാം.",
  "Advisory, teaching, law, finance or religious institutions.": "ഉപദേശം, അധ്യാപനം, നിയമം, ധനകാര്യം അല്ലെങ്കിൽ മതസ്ഥാപനങ്ങൾ.",
  "Engineering, machinery, land, construction, defence or surgery.": "എഞ്ചിനീയറിങ്, യന്ത്രങ്ങൾ, ഭൂമി, നിർമാണം, പ്രതിരോധം അല്ലെങ്കിൽ ശസ്ത്രക്രിയ.",
  "Profession and partnership intertwine.": "തൊഴിലും പങ്കാളിത്തവും പരസ്പരം ബന്ധപ്പെട്ടിരിക്കുന്നു.",
  "Technical, computing, healing or research work.": "സാങ്കേതികം, കമ്പ്യൂട്ടിങ്, ചികിത്സ അല്ലെങ്കിൽ ഗവേഷണം സംബന്ധിച്ച തൊഴിൽ.",
  "A spouse met through work, study or online; foreign or multilingual partner.": "തൊഴിൽ, പഠനം അല്ലെങ്കിൽ ഓൺലൈൻ വഴി പരിചയപ്പെടുന്ന പങ്കാളി; വിദേശിയോ പല ഭാഷകൾ സംസാരിക്കുന്നയാളോ ആയ പങ്കാളി.",
  "One interpretation raises questions about timing or delays; see the source finding for its wording.": "ഒരു വ്യാഖ്യാനം വിവാഹസമയത്തെയോ കാലതാമസത്തെയോ കുറിച്ചുള്ള ചോദ്യങ്ങൾ ഉയർത്തുന്നു. മൂല സൂചനയിലെ വാചകം വിശദവായനയിൽ കാണാം.",
  "One interpretation raises questions about commitment or boundaries; see the source finding for its wording.": "ഒരു വ്യാഖ്യാനം ബന്ധത്തിലെ പ്രതിബദ്ധതയെയോ അതിരുകളെയോ കുറിച്ചുള്ള ചോദ്യങ്ങൾ ഉയർത്തുന്നു. മൂല സൂചനയിലെ വാചകം വിശദവായനയിൽ കാണാം.",
  "One interpretation raises questions about communication or conflict; see the source finding for its wording.": "ഒരു വ്യാഖ്യാനം ആശയവിനിമയത്തെയോ അഭിപ്രായവ്യത്യാസങ്ങളെയോ കുറിച്ചുള്ള ചോദ്യങ്ങൾ ഉയർത്തുന്നു. മൂല സൂചനയിലെ വാചകം വിശദവായനയിൽ കാണാം.",
  "One interpretation raises questions about communication or conflict and timing or delays; see the source finding for its wording.": "ഒരു വ്യാഖ്യാനം ആശയവിനിമയം, അഭിപ്രായവ്യത്യാസങ്ങൾ, വിവാഹസമയം അല്ലെങ്കിൽ കാലതാമസം എന്നിവയെക്കുറിച്ചുള്ള ചോദ്യങ്ങൾ ഉയർത്തുന്നു. മൂല സൂചനയിലെ വാചകം വിശദവായനയിൽ കാണാം.",
  "One interpretation raises questions about distance or time apart; see the source finding for its wording.": "ഒരു വ്യാഖ്യാനം അകലത്തെയോ വേർപിരിഞ്ഞു കഴിയുന്ന സമയത്തെയോ കുറിച്ചുള്ള ചോദ്യങ്ങൾ ഉയർത്തുന്നു. മൂല സൂചനയിലെ വാചകം വിശദവായനയിൽ കാണാം.",
  "A relationship that returns or is reconsidered.": "തിരികെ വരുന്നതോ വീണ്ടും പരിഗണിക്കപ്പെടുന്നതോ ആയ ഒരു ബന്ധം.",
  "Spouse from an influential family; ego and status enter the relationship.": "സ്വാധീനമുള്ള കുടുംബത്തിൽ നിന്നുള്ള പങ്കാളി; ബന്ധത്തിൽ അഹംഭാവവും സ്ഥാനമാനവും വിഷയങ്ങളാകാം.",
  "This Nadi check does not find its usual direct or indirect link for marriage. That does not rule out a marriage or a relationship.": "ഈ നാഡി പരിശോധനയിൽ വിവാഹത്തിനായി പരിശോധിക്കുന്ന സാധാരണ നേരിട്ടുള്ളതോ പരോക്ഷമായതോ ആയ ബന്ധം കണ്ടെത്തിയില്ല. അതുകൊണ്ട് വിവാഹമോ ബന്ധമോ ഉണ്ടാകില്ലെന്ന് അർഥമില്ല.",
  "This Nadi check finds an indirect link between the planets it uses for you and a partner. It treats that as an indication related to marriage.": "നിങ്ങളെയും പങ്കാളിയെയും സൂചിപ്പിക്കാൻ ഈ നാഡി രീതി ഉപയോഗിക്കുന്ന ഗ്രഹങ്ങൾ തമ്മിൽ പരോക്ഷബന്ധം കാണുന്നു. വിവാഹവുമായി ബന്ധപ്പെട്ട ഒരു സൂചനയായി ഈ രീതി അതിനെ കാണുന്നു.",
  "This Nadi check finds a link for marriage through Saturn. The method associates it with responsibility or possible delay.": "ഈ നാഡി പരിശോധനയിൽ ശനിയിലൂടെ വിവാഹവുമായി ബന്ധപ്പെട്ട ഒരു സൂചന കാണുന്നു. ഈ രീതി അതിനെ ഉത്തരവാദിത്തവുമായോ കാലതാമസത്തിനുള്ള സാധ്യതയുമായോ ബന്ധിപ്പിക്കുന്നു.",
  "This Nadi check finds a direct link between the planets it uses for you and a partner. The method reads that as supportive of the possibility of marriage.": "നിങ്ങളെയും പങ്കാളിയെയും സൂചിപ്പിക്കാൻ ഈ നാഡി രീതി ഉപയോഗിക്കുന്ന ഗ്രഹങ്ങൾ തമ്മിൽ നേരിട്ടുള്ള ബന്ധം കാണുന്നു. വിവാഹസാധ്യതയെ പിന്തുണയ്ക്കുന്ന ഒരു സൂചനയായി ഈ രീതി അതിനെ വായിക്കുന്നു.",
  "This Nadi check does not find its usual Jupiter–Venus connection for this topic. That does not rule out having children.": "സന്താനവുമായി ബന്ധപ്പെട്ട് ഈ നാഡി പരിശോധനയിൽ സാധാരണ പരിശോധിക്കുന്ന വ്യാഴം–ശുക്രൻ ബന്ധം കണ്ടെത്തിയില്ല. അതുകൊണ്ട് സന്താനമുണ്ടാകില്ലെന്ന് അർഥമില്ല.",
  "This Nadi check finds a traditional connection between Jupiter and Venus that it associates with children and family.": "സന്താനവും കുടുംബവുമായി ഈ നാഡി രീതി ബന്ധിപ്പിക്കുന്ന വ്യാഴം–ശുക്രൻ ബന്ധം ഇവിടെ കാണുന്നു.",
  "This is a traditional association. It cannot determine fertility, pregnancy, the number or sex of children, or whether, when or how someone becomes a parent.": "ഇത് ഒരു പരമ്പരാഗത ബന്ധമാണ്. പ്രത്യുത്പാദനശേഷി, ഗർഭധാരണം, കുട്ടികളുടെ എണ്ണം അല്ലെങ്കിൽ ലിംഗം, ഒരാൾ മാതാപിതാവാകുമോ, എപ്പോൾ, എങ്ങനെ എന്നതൊന്നും ഇതിലൂടെ നിർണയിക്കാനാവില്ല.",
  "Other Nadi findings describe both supportive and difficult relationship themes; their details are available in the Nadi reading.": "മറ്റ് നാഡി സൂചനകളിൽ ബന്ധങ്ങൾക്ക് അനുകൂലവും വിഷമകരവുമായ വ്യാഖ്യാനങ്ങളുണ്ട്. വിശദാംശങ്ങൾ നാഡി വായനയിൽ കാണാം.",
  "Other selected Nadi rules describe these possible relationship themes:": "തിരഞ്ഞെടുത്ത മറ്റ് നാഡി നിയമങ്ങൾ ബന്ധങ്ങളെക്കുറിച്ച് താഴെ പറയുന്ന സാധ്യതകളും സൂചിപ്പിക്കുന്നു:",
  "This is a traditional indication, not a guarantee of marriage, its timing or the quality of a relationship.": "ഇത് ഒരു പരമ്പരാഗത സൂചനയാണ്; വിവാഹമോ അതിന്റെ സമയമോ ബന്ധത്തിന്റെ ഗുണമോ ഉറപ്പുനൽകുന്നില്ല.",
  "Other methods read this topic differently. Their findings remain separate in the comparison.": "മറ്റു രീതികൾ ഈ വിഷയത്തെ വ്യത്യസ്തമായി വായിക്കുന്നു. താരതമ്യത്തിൽ അവയുടെ സൂചനകൾ വേറിട്ടുതന്നെ കാണിക്കുന്നു.",
  "No matching Nadi passage is shown in this briefing. That is not a conclusion about whether an event can occur.": "ഈ ചുരുക്കത്തിൽ പൊരുത്തമുള്ള നാഡി ഗോചരകാലം കാണിച്ചിട്ടില്ല. അതുകൊണ്ട് ഒരു സംഭവം നടക്കുമോ ഇല്ലയോ എന്ന നിഗമനത്തിലെത്താനാവില്ല.",
  "Dates use the birth-place time zone; transitions may occur during the displayed day. These selected passages are not predicted event dates. Topic selection is the app's convention.": "തീയതികൾ ജനനസ്ഥലത്തെ സമയമേഖലയിലാണ്. കാണിച്ച ദിവസത്തിനുള്ളിൽ മാറ്റം സംഭവിക്കാം. ഇവ തിരഞ്ഞെടുത്ത ഗോചരകാലങ്ങളാണ്; സംഭവം നടക്കുമെന്ന് പ്രവചിച്ച തീയതികളല്ല. വിഷയങ്ങളുമായുള്ള ബന്ധം ആപ്പിന്റെ രീതിയാണ്.",
  "Transit passages are not presented here as health forecasts.": "ഗോചരകാലങ്ങൾ ഇവിടെ ആരോഗ്യ പ്രവചനങ്ങളായി കാണിക്കുന്നില്ല.",
  "About timing": "കാലത്തെക്കുറിച്ച്",
  "These traditions use different rules to interpret the same birth chart. Their labels describe chart indications, not established facts about a person or their family.": "ഒരേ ജനനജാതകം വായിക്കാൻ ഈ രീതികൾ വ്യത്യസ്ത നിയമങ്ങളാണ് ഉപയോഗിക്കുന്നത്. അവയുടെ വിലയിരുത്തലുകൾ ജാതകസൂചനകളാണ്; വ്യക്തിയെക്കുറിച്ചോ കുടുംബത്തെക്കുറിച്ചോ തെളിയിക്കപ്പെട്ട വസ്തുതകളല്ല.",
  "The schools give differing indications, so the app cannot combine them into a single conclusion.": "രീതികൾ നൽകുന്ന സൂചനകൾ വ്യത്യസ്തമാണ്; അതിനാൽ ആപ്പിന് അവയെ ഒറ്റ നിഗമനമായി ചേർക്കാനാവില്ല.",
  "The combined indications are mixed, without a clear overall direction.": "സൂചനകൾ സമ്മിശ്രമാണ്; പൊതുവായ ഒരു ദിശ വ്യക്തമല്ല.",
  "The combined indications lean supportive, but the schools do not all agree.": "സൂചനകൾ അനുകൂല ദിശയിലേക്ക് ചായുന്നു; എന്നാൽ എല്ലാ രീതികളും ഒരേ അഭിപ്രായത്തിലല്ല.",
  "The combined indications lean challenging, but the schools do not all agree.": "സൂചനകൾ കൂടുതൽ ശ്രദ്ധ ആവശ്യപ്പെടുന്ന ദിശയിലേക്ക് ചായുന്നു; എന്നാൽ എല്ലാ രീതികളും ഒരേ അഭിപ്രായത്തിലല്ല.",
  "The combined indications lean in one direction, but the schools do not all agree.": "സൂചനകൾ ഒരു ദിശയിലേക്ക് ചായുന്നു; എന്നാൽ എല്ലാ രീതികളും ഒരേ അഭിപ്രായത്തിലല്ല.",
  "supportive indications": "അനുകൂല സൂചനകൾ",
  "indications leaning supportive": "അനുകൂല ദിശയിലേക്ക് ചായുന്ന സൂചനകൾ",
  "mixed indications": "സമ്മിശ്ര സൂചനകൾ",
  "conflicting indications": "പരസ്പരവിരുദ്ധമായ സൂചനകൾ",
  "indications leaning challenging": "ശ്രദ്ധ ആവശ്യപ്പെടുന്ന ദിശയിലേക്ക് ചായുന്ന സൂചനകൾ",
  "challenging indications": "ശ്രദ്ധ ആവശ്യപ്പെടുന്ന സൂചനകൾ",
  "no conclusion in this comparison": "ഈ താരതമ്യത്തിൽ നിഗമനമില്ല",
  "See the schools' labels": "ഓരോ രീതിയുടെയും വിലയിരുത്തൽ കാണുക",
  "Each school is shown separately. ALP is a progressed reading for the date shown; Prasna Marga here uses the birth chart, not a question chart. Specific questions can use additional rules.": "ഓരോ രീതിയും വേറിട്ട് കാണിക്കുന്നു. ALP കാണിച്ച തീയതിയിലെ പുരോഗമന വായനയാണ്; ഇവിടെ പ്രശ്ന മാർഗം ഉപയോഗിക്കുന്നത് ജനനജാതകമാണ്, പ്രശ്നജാതകമല്ല. പ്രത്യേക ചോദ്യങ്ങൾക്ക് അധിക നിയമങ്ങൾ ഉപയോഗിക്കാം.",

  // ── Overview · frame and fixed labels ──────────────────────────────────────
  "Overview · the chart in a minute": "അവലോകനം · ഒരു നിമിഷത്തിൽ ജാതകം",
  Rising: "ലഗ്നം",
  Sun: "സൂര്യൻ",
  Moon: "ചന്ദ്രൻ",
  Mars: "ചൊവ്വ",
  Mercury: "ബുധൻ",
  Jupiter: "വ്യാഴം",
  Venus: "ശുക്രൻ",
  Saturn: "ശനി",
  Rahu: "രാഹു",
  Ketu: "കേതു",
  Aries: "മേടം",
  Taurus: "ഇടവം",
  Gemini: "മിഥുനം",
  Cancer: "കർക്കടകം",
  Leo: "ചിങ്ങം",
  Virgo: "കന്നി",
  Libra: "തുലാം",
  Scorpio: "വൃശ്ചികം",
  Sagittarius: "ധനു",
  Capricorn: "മകരം",
  Aquarius: "കുംഭം",
  Pisces: "മീനം",
  Ashwini: "അശ്വതി",
  Bharani: "ഭരണി",
  Krittika: "കാർത്തിക",
  Rohini: "രോഹിണി",
  Mrigashira: "മകയിരം",
  Ardra: "തിരുവാതിര",
  Punarvasu: "പുണർതം",
  Pushya: "പൂയം",
  Ashlesha: "ആയില്യം",
  Magha: "മകം",
  "Purva Phalguni": "പൂരം",
  "Uttara Phalguni": "ഉത്രം",
  Hasta: "അത്തം",
  Chitra: "ചിത്തിര",
  Swati: "ചോതി",
  Vishakha: "വിശാഖം",
  Anuradha: "അനിഴം",
  Jyeshtha: "തൃക്കേട്ട",
  Mula: "മൂലം",
  "Purva Ashadha": "പൂരാടം",
  "Uttara Ashadha": "ഉത്രാടം",
  Shravana: "തിരുവോണം",
  Dhanishta: "അവിട്ടം",
  Shatabhisha: "ചതയം",
  "Purva Bhadrapada": "പൂരുരുട്ടാതി",
  "Uttara Bhadrapada": "ഉത്രട്ടാതി",
  Revati: "രേവതി",
  "Birth star": "ജന്മനക്ഷത്രം",
  "Firm ground": "ഉറച്ച അടിത്തറ",
  "Asks for care": "ശ്രദ്ധ വേണ്ടത്",
  Nadi: "നാഡി",
  "Right now": "ഇപ്പോൾ",
  "At passing": "വിയോഗ സമയത്ത്",
  "Past the periods": "ദശാകാലം കഴിഞ്ഞു",
  "Before you read": "വായിക്കുന്നതിന് മുമ്പ്",
  "Now and next": "ഇപ്പോഴും ഇനി വരുന്നതും",
  "Life topics": "ജീവിതവിഷയങ്ങൾ",
  "More life topics": "കൂടുതൽ ജീവിതവിഷയങ്ങൾ",
  "More passages": "കൂടുതൽ കാലഘട്ടങ്ങൾ",
  "Periods to explore": "പരിശോധിക്കാവുന്ന കാലഘട്ടങ്ങൾ",
  Why: "കാരണം",
  "See Nadi details": "നാഡി വിശദാംശങ്ങൾ കാണുക",
  "See the transit details": "ഗ്രഹഗോചര വിശദാംശങ്ങൾ കാണുക",
  "Running now": "ഇപ്പോൾ നടക്കുന്നത്",
  "Next {n} months": "അടുത്ത {n} മാസം",
  "Planets in play": "സജീവമായ ഗ്രഹങ്ങൾ",
  "From the Moon": "ചന്ദ്രനിൽ നിന്ന്",
  Period: "ദശ",
  Next: "അടുത്തത്",
  dasa: "ദശ",
  bhukti: "ഭുക്തി",
  "Age ": "വയസ്സ് ",
  "Read at age ": "വിയോഗ സമയത്തെ വയസ്സ് ",

  // ── Notable-planet phrases ─────────────────────────────────────────────────
  retrograde: "വക്രം",
  "in own sign": "സ്വക്ഷേത്രത്തിൽ",
  "in inimical sign": "ശത്രു രാശിയിൽ",
  "in moolatrikona": "മൂലത്രികോണത്തിൽ",
  "in the moolatrikona sign": "മൂലത്രികോണ രാശിയിൽ",
  exalted: "ഉച്ചം",
  debilitated: "നീചം",
  "(set aside)": "(മാറ്റിവച്ചത്)",

  // ── Life areas (areaNoun) ──────────────────────────────────────────────────
  Self: "സ്വയം",
  Career: "ജീവിതവൃത്തി",
  Standing: "സ്ഥാനമാനം",
  Marriage: "വിവാഹം",
  Children: "സന്താനം",
  Wealth: "ധനം",
  Education: "വിദ്യാഭ്യാസം",
  Family: "കുടുംബം",
  Father: "അച്ഛൻ",
  Mother: "അമ്മ",
  Health: "ആരോഗ്യം",
  "Money and assets": "ധനവും സ്വത്തുക്കളും",
  Learning: "പഠനം",
  "Parents and family": "മാതാപിതാക്കളും കുടുംബവും",
  "Well-being": "ആരോഗ്യവും ക്ഷേമവും",
  "Spiritual life": "ആത്മീയ ജീവിതം",
  "Travel and living abroad": "യാത്രയും വിദേശജീവിതവും",
  Parents: "മാതാപിതാക്കൾ",
  "Spiritual path": "ആത്മീയ മാർഗം",
  Travel: "യാത്ര",

  // ── Tone labels (AREA_TONE_LABEL) ──────────────────────────────────────────
  Supportive: "അനുകൂലം",
  Mixed: "സമ്മിശ്രം",
  "Needs care": "ശ്രദ്ധ വേണം",
  Contested: "ഭിന്നാഭിപ്രായം",
  "Separate themes": "വേറിട്ട വിഷയങ്ങൾ",
  "Lightly marked": "നേരിയ സൂചന",
};

const LocaleCtx = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: "en",
  setLocale: () => {},
});

const CACHE_NAME = "nadi-prefs-v1";
const CACHE_KEY = "/__nadi__/locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const changed = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (typeof caches === "undefined") return;
        const cache = await caches.open(CACHE_NAME);
        const res = await cache.match(CACHE_KEY);
        const saved = res ? ((await res.json()) as { locale?: unknown }).locale : undefined;
        if (mounted && !changed.current && (saved === "en" || saved === "ml")) setLocaleState(saved);
      } catch {
        /* preview frames without Cache Storage keep the choice for the session only */
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    changed.current = true;
    setLocaleState(l);
    // Serialize writes so the last choice wins even when the user switches quickly.
    writes.current = writes.current.then(async () => {
      try {
        if (typeof caches !== "undefined") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(
            CACHE_KEY,
            new Response(JSON.stringify({ locale: l }), {
              headers: { "content-type": "application/json" },
            }),
          );
        }
      } catch {
        /* keep the session-only choice */
      }
    });
  }, []);

  return <LocaleCtx.Provider value={{ locale, setLocale }}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx);
}

/** Returns a translator bound to the current locale: t("Cast a chart"). */
export function translate(locale: Locale, text: string): string {
  return locale === "ml" ? (ML[text] ?? text) : text;
}

export function useT() {
  const { locale } = useLocale();
  return useCallback((text: string) => translate(locale, text), [locale]);
}

/** Mark an English fallback for assistive technology when a sentence is not translated yet. */
export function LocalizedText({ children }: { children: string }) {
  const { locale } = useLocale();
  const value = translate(locale, children);
  return <span lang={locale === "ml" && value === children ? "en" : locale}>{value}</span>;
}

/** Be explicit about the scope until each reading and export has been reviewed. */
export function TranslationNotice() {
  const { locale } = useLocale();
  if (locale !== "ml") return null;
  return <div className="mx-auto max-w-6xl px-5 pt-4 md:px-10" lang="ml" data-testid="translation-notice">
    <p className="nadi-info-note text-sm" role="status">മലയാള പരിഭാഷ വികസിപ്പിച്ചുകൊണ്ടിരിക്കുന്നു. ചില നിയന്ത്രണങ്ങളും വിശദവായനകളും നിയമങ്ങളുടെ ഉറവിടങ്ങളും റിപ്പോർട്ടുകളും PDF ഫയലുകളും ഇപ്പോഴും ഇംഗ്ലീഷിലാണ്.</p>
  </div>;
}

/** Language choices are named in their own languages. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const btn = (active: boolean) =>
    `rounded px-1.5 py-0.5 text-xs ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`;
  return (
    <div
      className={`flex items-center rounded-md border p-0.5 ${className ?? ""}`}
      role="group"
      aria-label="Language / ഭാഷ"
      data-testid="language-toggle"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={btn(locale === "en")}
        aria-pressed={locale === "en"}
        lang="en"
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLocale("ml")}
        className={btn(locale === "ml")}
        aria-pressed={locale === "ml"}
        lang="ml"
      >
        മലയാളം
      </button>
    </div>
  );
}
