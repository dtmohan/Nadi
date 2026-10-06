import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * A minimal, dependency-free localisation layer. `Locale` is "en" or "ml"; the dictionary is keyed
 * by the English source string and returns the Malayalam (script) rendering when the locale is ml.
 * This is the proof-of-concept slice: the home page chrome and the Overview frame, plus the fixed
 * life-area and tone labels. The rule books and the sentence builders are the larger "content"
 * phase and stay English for now.
 */

export type Locale = "en" | "ml";

const ML: Record<string, string> = {
  // ── Home · casting ─────────────────────────────────────────────────────────
  "Start here": "ഇവിടെ തുടങ്ങുക",
  "Cast a chart": "ജാതകം ഉണ്ടാക്കുക",
  "Sidereal positions from the Swiss Ephemeris. No lagna is needed: Nadi reads the planets by sign alone.":
    "സ്വിസ് എഫെമെറിസിൽ നിന്നുള്ള നക്ഷത്ര (സിഡീരിയൽ) സ്ഥാനങ്ങൾ. ലഗ്നം ആവശ്യമില്ല — നാഡി ഗ്രഹങ്ങളെ രാശി കൊണ്ടു മാത്രം വായിക്കുന്നു.",
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
  age: "വയസ്സ്",

  // ── Overview · frame and fixed labels ──────────────────────────────────────
  "Overview · the chart in a minute": "അവലോകനം · ഒരു നിമിഷത്തിൽ ജാതകം",
  Rising: "ലഗ്നം",
  Sun: "സൂര്യൻ",
  Moon: "ചന്ദ്രൻ",
  "Birth star": "ജന്മനക്ഷത്രം",
  "Firm ground": "ഉറച്ച അടിത്തറ",
  "Asks for care": "ശ്രദ്ധ വേണ്ടത്",
  "Right now": "ഇപ്പോൾ",
  "At passing": "വിയോഗ സമയത്ത്",
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
  Health: "ആരോഗ്യം",

  // ── Tone labels (AREA_TONE_LABEL) ──────────────────────────────────────────
  Supportive: "അനുകൂലം",
  Mixed: "സമ്മിശ്രം",
  "Needs care": "ശ്രദ്ധ വേണം",
  Contested: "ഭിന്നാഭിപ്രായം",
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

  useEffect(() => {
    (async () => {
      try {
        if (typeof caches === "undefined") return;
        const cache = await caches.open(CACHE_NAME);
        const res = await cache.match(CACHE_KEY);
        if (res) setLocaleState(((await res.json()) as { locale?: Locale }).locale ?? "en");
      } catch {
        /* preview frames without Cache Storage keep the choice for the session only */
      }
    })();
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      if (typeof caches !== "undefined") {
        void caches.open(CACHE_NAME).then((cache) =>
          cache.put(
            CACHE_KEY,
            new Response(JSON.stringify({ locale: l }), {
              headers: { "content-type": "application/json" },
            }),
          ),
        );
      }
    } catch {
      /* keep the session-only choice */
    }
  }, []);

  return <LocaleCtx.Provider value={{ locale, setLocale }}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx);
}

/** Returns a translator bound to the current locale: t("Cast a chart"). */
export function useT() {
  const { locale } = useLocale();
  return useCallback(
    (text: string) => (locale === "ml" ? (ML[text] ?? text) : text),
    [locale],
  );
}

/** The en / മല switch, small enough to sit in a header. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const btn = (active: boolean) =>
    `rounded px-1.5 py-0.5 text-xs ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`;
  return (
    <div
      className={`flex items-center rounded-md border p-0.5 ${className ?? ""}`}
      role="group"
      aria-label="Language"
      data-testid="language-toggle"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={btn(locale === "en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("ml")}
        className={btn(locale === "ml")}
        aria-pressed={locale === "ml"}
      >
        മല
      </button>
    </div>
  );
}
