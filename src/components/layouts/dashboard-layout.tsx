"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Calendar,
  LogOut,
  Bell,
  BarChart3,
  User,
  Target,
  Lightbulb,
  XCircle,
  DollarSign,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useT } from "@/components/locale-provider";
import { BrandLogo } from "@/components/brand-logo";
import type { Dictionary } from "@/lib/i18n";
import { getBreadcrumbLabel } from "@/lib/i18n/helpers";
import { UserRole } from "@prisma/client";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey?: keyof Dictionary["nav"];
  label?: string;
}

const candidateNav: NavItem[] = [
  { labelKey: "dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { labelKey: "profileHub", href: "/candidate/profile", icon: User },
  { labelKey: "resumeHub", href: "/candidate/resumes", icon: FileText },
  { labelKey: "jobWorkspace", href: "/candidate/jobs", icon: Target },
  { labelKey: "opportunities", href: "/candidate/opportunities", icon: Briefcase },
  { labelKey: "outreach", href: "/candidate/outreach", icon: Mail },
  { labelKey: "interviewHub", href: "/candidate/interviews", icon: Calendar },
  { labelKey: "rejections", href: "/candidate/rejections", icon: XCircle },
  { labelKey: "offers", href: "/candidate/offers", icon: DollarSign },
  { labelKey: "analytics", href: "/candidate/analytics", icon: BarChart3 },
  { labelKey: "insights", href: "/candidate/insights", icon: Lightbulb },
];

function getNavItems(role: UserRole): NavItem[] {
  return role === UserRole.CANDIDATE ? candidateNav : [];
}

function getPageTitle(pathname: string, t: Dictionary): string {
  return (
    pathname
      .split("/")
      .filter(Boolean)
      .slice(1)
      .map((segment) => getBreadcrumbLabel(segment, t, pathname))
      .join(" / ") || t.nav.dashboard
  );
}

interface SidebarProps {
  navItems: NavItem[];
  pathname: string;
  t: Dictionary;
  sessionName?: string | null;
  sessionEmail?: string | null;
  initials: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}

function Sidebar({
  navItems,
  pathname,
  t,
  sessionName,
  sessionEmail,
  initials,
  onNavigate,
  showClose,
  onClose,
}: SidebarProps) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:h-16">
        <BrandLogo imageClassName="h-8" />
        {showClose && onClose ? (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
            aria-label={t.common.closeMenu}
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 md:p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-blue/10 text-brand-blue font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {item.labelKey ? t.nav[item.labelKey] : item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-3 border-t p-3 md:p-4">
        <LanguageToggle variant="sidebar" />
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{sessionName}</p>
            <p className="truncate text-xs text-muted-foreground">{sessionEmail}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.assign("/");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useT();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const role = session?.user?.role ?? UserRole.CANDIDATE;
  const navItems = getNavItems(role);

  const nameParts = session?.user?.name?.split(" ") ?? ["U", "S"];
  const initials = getInitials(nameParts[0] ?? "U", nameParts[1] ?? "S");
  const pageTitle = getPageTitle(pathname, t);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const sidebarProps: SidebarProps = {
    navItems,
    pathname,
    t,
    sessionName: session?.user?.name,
    sessionEmail: session?.user?.email,
    initials,
    onNavigate: () => setMobileNavOpen(false),
  };

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <Sidebar {...sidebarProps} />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t.common.closeMenu}
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-[min(100%,18rem)] max-w-[85vw] flex-col border-r bg-card shadow-xl">
            <Sidebar
              {...sidebarProps}
              showClose
              onClose={() => setMobileNavOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:h-16 md:px-6 md:pt-0">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t.common.openMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="truncate text-base font-semibold md:text-lg">
              {pageTitle}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1 md:gap-2">
            <LanguageToggle className="md:hidden" />
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
