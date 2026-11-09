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

import { translate, type Locale } from "@shared/localization";
export { translate, type Locale } from "@shared/localization";

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
export function useT() {
  const { locale } = useLocale();
  return useCallback((text: string) => translate(locale, text), [locale]);
}

/** Mark an English fallback for assistive technology when a sentence is not translated yet. */
export function LocalizedText({ children }: { children: string }) {
  const { locale } = useLocale();
  return <LocalizedTextValue locale={locale}>{children}</LocalizedTextValue>;
}

/** Render a label with its actual language, including an untranslated English fallback. */
export function LocalizedTextValue({ locale, children }: { locale: Locale; children: string }) {
  const value = translate(locale, children);
  return <span lang={locale === "ml" && !/[\u0d00-\u0d7f]/.test(value) ? "en" : locale}>{value}</span>;
}

/** Be explicit about the scope until each reading and export has been reviewed. */
export function TranslationNotice() {
  const { locale } = useLocale();
  if (locale !== "ml") return null;
  return <div className="mx-auto max-w-6xl px-5 pt-4 md:px-10" lang="ml" data-testid="translation-notice">
    <details className="nadi-info-note text-sm">
      <summary className="cursor-pointer">മലയാള പരിഭാഷ പുരോഗമിക്കുന്നു; ചില ഭാഗങ്ങൾ ഇംഗ്ലീഷിലാണ്.</summary>
      <p className="mt-2">വിശദവായനകളിലെയും റിപ്പോർട്ടുകളിലെയും PDF ഫയലുകളിലെയും പരിഭാഷ പൂർത്തിയാകാത്ത ഭാഗങ്ങളും ചില നിയന്ത്രണങ്ങളും ഉറവിടങ്ങളും ഇംഗ്ലീഷിൽ കാണിക്കും.</p>
    </details>
  </div>;
}

/** Language choices are named in their own languages. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const btn = (active: boolean) =>
    `min-h-10 rounded px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`;
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
