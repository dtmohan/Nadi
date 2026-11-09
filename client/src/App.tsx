import { useEffect } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReadingModeProvider } from "@/lib/reading-mode";
import { LocaleProvider, LanguageToggle, TranslationNotice, useLocale } from "@/lib/i18n";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme";
import { ChartFocusProvider } from "@/components/chart-focus";
import Home from "@/pages/home";
import ChartPage from "@/pages/chart";
import ReadingRoom from "@/pages/reading-room";
import WorkJourneyPage from "@/pages/work-journey";
import ReportPage from "@/pages/report";
import ReaderPage from "@/pages/reader";
import RulesPage from "@/pages/rules";
import AboutPage from "@/pages/about";
import NotFound from "@/pages/not-found";

function EnglishFallback({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  return <div lang={locale === "ml" ? "en" : undefined}>{children}</div>;
}
const EnglishReport = () => <EnglishFallback><ReportPage /></EnglishFallback>;
const EnglishRules = () => <EnglishFallback><RulesPage /></EnglishFallback>;
const EnglishAbout = () => <EnglishFallback><AboutPage /></EnglishFallback>;

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chart/:id/report" component={EnglishReport} />
      <Route path="/chart/:id/reading" component={ReaderPage} />
      <Route path="/chart/:id/work" component={WorkJourneyPage} />
      <Route path="/chart/:id/room/:view?" component={ReadingRoom} />
      <Route path="/chart/:id/:mode?" component={ChartPage} />
      <Route path="/rules" component={EnglishRules} />
      <Route path="/sutras/:ref?" component={EnglishRules} />
      <Route path="/about" component={EnglishAbout} />
      <Route component={NotFound} />
    </Switch>
  );
}

/** The app scrolls inside main, so browser navigation alone cannot reset its position. */
function RouteScrollReset() {
  const [location] = useLocation();
  useEffect(() => {
    document.querySelector("main[data-app-scroll]")?.scrollTo({ top: 0 });
  }, [location]);
  return null;
}

function AppFrame() {
  const [location] = useLocation();
  // The reading room is a focused editorial surface: no sidebar, no app header, no duplicate brand.
  const isRoom = /^\/chart\/[^/]+\/(?:room(?:\/|$)|work$)/.test(location);
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };
  return (
    <SidebarProvider
      style={style as React.CSSProperties}
      className="h-svh max-h-svh overflow-hidden"
    >
      {isRoom ? (
        <main
          data-app-scroll
          className="h-full min-h-0 w-full flex-1 overflow-y-auto [overscroll-behavior:contain]"
        >
          <RouteScrollReset />
          <TranslationNotice />
          <AppRouter />
        </main>
      ) : (
        <div className="flex h-full min-h-0 w-full">
          <AppSidebar />
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex min-h-14 shrink-0 items-center gap-2 border-b px-3 lg:hidden">
              <SidebarTrigger className="h-11 w-11" data-testid="button-sidebar-toggle" />
              <span className="font-display text-base font-bold">
                Nadi
              </span>
              <LanguageToggle className="ml-auto" />
            </header>
            <main data-app-scroll className="min-h-0 flex-1 overflow-y-auto [overscroll-behavior:contain]">
              <RouteScrollReset />
              <TranslationNotice />
              <AppRouter />
            </main>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ReadingModeProvider>
            <LocaleProvider>
            <ChartFocusProvider>
              <Router hook={useHashLocation}>
                <AppFrame />
              </Router>
              <Toaster />
            </ChartFocusProvider>
            </LocaleProvider>
          </ReadingModeProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
