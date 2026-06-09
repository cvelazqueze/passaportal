import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/rbac/permissions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { PublicBrandLink } from "@/components/public-brand-link";
import {
  FileText,
  Layers,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const session = await auth();
  const dashboardPath = session?.user
    ? getRoleDashboardPath(session.user.role)
    : null;

  const { t } = await getServerDictionary();

  const features = [
    {
      icon: FileText,
      title: t.landing.jobPassport,
      description: t.landing.jobPassportDesc,
    },
    {
      icon: Layers,
      title: t.landing.tailoredResumes,
      description: t.landing.tailoredResumesDesc,
    },
    {
      icon: Target,
      title: t.landing.jobMatching,
      description: t.landing.jobMatchingDesc,
    },
    {
      icon: TrendingUp,
      title: t.landing.careerEvolution,
      description: t.landing.careerEvolutionDesc,
    },
  ];

  const benefits = [
    t.landing.benefit1,
    t.landing.benefit2,
    t.landing.benefit3,
    t.landing.benefit4,
    t.landing.benefit5,
    t.landing.benefit6,
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 min-h-14 items-center justify-between gap-2 px-4 sm:h-16">
          <PublicBrandLink />
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <ThemeToggle />
            {dashboardPath ? (
              <Button asChild size="sm" className="max-w-[10rem] truncate sm:max-w-none sm:px-4">
                <Link href={dashboardPath}>{t.landing.goToDashboard}</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
                >
                  {t.auth.signIn}
                </Link>
                <Button asChild size="sm" className="sm:size-default">
                  <Link href="/auth/register">{t.auth.getStarted}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-brand-purple">
            {t.landing.notJobBoard}
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            {t.landing.heroTitle}{" "}
            <span className="brand-gradient-text">{t.landing.heroHighlight}</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            {t.landing.heroSubtitle}
          </p>
          <p className="mt-4 text-base font-medium text-foreground/80">
            {t.landing.heroTagline}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="brand-gradient border-0 text-white hover:opacity-90">
              <Link href="/auth/register">
                {t.landing.createPassport}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">{t.auth.signIn}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            {t.landing.featuresTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            {t.landing.featuresSubtitle}
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl brand-gradient shadow-sm">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold">{t.landing.benefitsTitle}</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t.landing.benefitsSubtitle}
              </p>
              <ul className="mt-8 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-blue shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-8 shadow-sm">
              <h3 className="text-2xl font-semibold">{t.landing.ctaTitle}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {t.landing.ctaDesc}
              </p>
              <Button className="mt-6 brand-gradient border-0 text-white hover:opacity-90" asChild>
                <Link href="/auth/register?role=candidate">
                  {t.landing.ctaButton}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-foreground/90">
            {t.landing.closingLine}
          </p>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {t.brand}. {t.landing.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
