import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReadingModeProvider } from "@/lib/reading-mode";
import { LocaleProvider, LanguageToggle } from "@/lib/i18n";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme";
import { ChartFocusProvider } from "@/components/chart-focus";
import Home from "@/pages/home";
import ChartPage from "@/pages/chart";
import ReportPage from "@/pages/report";
import RulesPage from "@/pages/rules";
import AboutPage from "@/pages/about";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chart/:id" component={ChartPage} />
      <Route path="/chart/:id/report" component={ReportPage} />
      <Route path="/rules" component={RulesPage} />
      <Route path="/sutras/:ref?" component={RulesPage} />
      <Route path="/about" component={AboutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ReadingModeProvider>
            <LocaleProvider>
            <ChartFocusProvider>
              <Router hook={useHashLocation}>
                <SidebarProvider
                  style={style as React.CSSProperties}
                  className="h-svh max-h-svh overflow-hidden"
                >
                  <div className="flex h-full min-h-0 w-full">
                    <AppSidebar />
                    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
                        <SidebarTrigger data-testid="button-sidebar-toggle" />
                        <span className="font-display text-base font-bold">
                          Nadi
                        </span>
                        <LanguageToggle className="ml-auto" />
                      </header>
                      <main className="min-h-0 flex-1 overflow-y-auto [overscroll-behavior:contain]">
                        <AppRouter />
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
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
