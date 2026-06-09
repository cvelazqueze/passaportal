"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Calendar,
  Settings,
  LogOut,
  Bell,
  Search,
  BarChart3,
  Building2,
  Shield,
  User,
  Users,
  Target,
  Lightbulb,
  XCircle,
  DollarSign,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useT } from "@/components/locale-provider";
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
  { labelKey: "interviewHub", href: "/candidate/interviews", icon: Calendar },
  { labelKey: "rejections", href: "/candidate/rejections", icon: XCircle },
  { labelKey: "offers", href: "/candidate/offers", icon: DollarSign },
  { labelKey: "analytics", href: "/candidate/analytics", icon: BarChart3 },
  { labelKey: "insights", href: "/candidate/insights", icon: Lightbulb },
];

const recruiterNav: NavItem[] = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { label: "Candidates", href: "/recruiter/candidates", icon: Users },
  { label: "Talent Pools", href: "/recruiter/pools", icon: Users },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
  { label: "Search", href: "/recruiter/search", icon: Search },
];

const hiringManagerNav: NavItem[] = [
  { label: "Dashboard", href: "/hiring-manager/dashboard", icon: LayoutDashboard },
  { label: "Candidates", href: "/hiring-manager/candidates", icon: Users },
  { label: "Interviews", href: "/hiring-manager/interviews", icon: Calendar },
  { label: "Scorecards", href: "/hiring-manager/scorecards", icon: FileText },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Team", href: "/admin/team", icon: Users },
  { label: "Clients", href: "/admin/clients", icon: Building2 },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const platformNav: NavItem[] = [
  { label: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
  { label: "Tenants", href: "/platform/tenants", icon: Building2 },
  { label: "Subscriptions", href: "/platform/subscriptions", icon: FileText },
  { label: "Audit Logs", href: "/platform/audit", icon: Shield },
  { label: "Security", href: "/platform/security", icon: Shield },
  { label: "Settings", href: "/platform/settings", icon: Settings },
];

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case UserRole.CANDIDATE:
      return candidateNav;
    case UserRole.RECRUITER:
      return recruiterNav;
    case UserRole.HIRING_MANAGER:
      return hiringManagerNav;
    case UserRole.AGENCY_ADMIN:
      return adminNav;
    case UserRole.PLATFORM_ADMIN:
      return platformNav;
    default:
      return [];
  }
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useT();
  const role = session?.user?.role ?? UserRole.CANDIDATE;
  const navItems = getNavItems(role);

  const nameParts = session?.user?.name?.split(" ") ?? ["U", "S"];
  const initials = getInitials(nameParts[0] ?? "U", nameParts[1] ?? "S");

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              P
            </div>
            <span className="font-semibold text-lg">{t.brand}</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.labelKey ? t.nav[item.labelKey] : item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-lg font-semibold">
            {pathname
              .split("/")
              .filter(Boolean)
              .slice(1)
              .map((segment) => getBreadcrumbLabel(segment, t))
              .join(" / ") || t.nav.dashboard}
          </h1>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
