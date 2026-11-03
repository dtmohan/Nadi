import { Link, useLocation } from "wouter";
import { useSavedCharts } from "@/lib/charts-store";
import { PlusCircle, BookOpen, Info, Moon, Sun } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { Chart } from "@shared/schema";
import { useTheme } from "@/components/theme";
import { LanguageToggle, useT } from "@/lib/i18n";

export function Logo({ size = 28 }: { size?: number }) {
  // South Indian chart mark: outer ring of twelve houses around a still centre.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Nadi"
      role="img"
      className="text-foreground"
    >
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="9"
        y="9"
        width="14"
        height="14"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M9 2v7M16 2v7M23 2v7M9 23v7M16 23v7M23 23v7M2 9h7M2 16h7M2 23h7M23 9h7M23 16h7M23 23h7"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="16" cy="16" r="2.4" fill="hsl(var(--primary))" />
    </svg>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { data: charts } = useSavedCharts();
  const { theme, toggle } = useTheme();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobile = () => { if (isMobile) setOpenMobile(false); };
  const t = useT();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-5 pb-3">
        <Link
          href="/"
          onClick={closeMobile}
          className="flex items-center gap-3"
          data-testid="link-home"
        >
          <Logo />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">
              Nadi
            </div>
            <div className="text-xs text-muted-foreground">
              {t("Bhrigu Nandi reader")}
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" onClick={closeMobile} data-testid="link-new-chart">
                    <PlusCircle />
                    <span>{t("New chart")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/rules"}>
                  <Link href="/rules" onClick={closeMobile} data-testid="link-rules">
                    <BookOpen />
                    <span>{t("Rule book")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/about"}>
                  <Link href="/about" onClick={closeMobile} data-testid="link-about">
                    <Info />
                    <span>{t("Method")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("Saved charts")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {charts?.length === 0 && (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {t("None yet. Cast one to begin.")}
                </div>
              )}
              {charts?.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === `/chart/${c.id}` || location.startsWith(`/chart/${c.id}/`)}
                  >
                    <Link
                      href={`/chart/${c.id}`}
                      onClick={closeMobile}
                      data-testid={`link-chart-${c.id}`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground tabular">
                        {c.birthDate.slice(0, 4)}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <LanguageToggle className="self-start" />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="justify-start"
          data-testid="button-theme"
        >
          {theme === "dark" ? <Sun /> : <Moon />}
          <span>{t(theme === "dark" ? "Light mode" : "Dark mode")}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
