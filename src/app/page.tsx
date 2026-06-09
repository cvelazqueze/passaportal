import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/rbac/permissions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import {
  Shield,
  Users,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(getRoleDashboardPath(session.user.role));
  }

  const { t } = await getServerDictionary();

  const features = [
    {
      icon: FileText,
      title: t.landing.talentPassport,
      description: t.landing.talentPassportDesc,
    },
    {
      icon: Lock,
      title: t.landing.privacyFirst,
      description: t.landing.privacyFirstDesc,
    },
    {
      icon: Users,
      title: t.landing.sharedWorkspace,
      description: t.landing.sharedWorkspaceDesc,
    },
    {
      icon: Shield,
      title: t.landing.enterpriseSecurity,
      description: t.landing.enterpriseSecurityDesc,
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
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              P
            </div>
            <span className="font-semibold text-lg">{t.brand}</span>
          </div>
          <nav className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t.auth.signIn}
            </Link>
            <Button asChild>
              <Link href="/auth/register">{t.auth.getStarted}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            {t.landing.heroTitle}{" "}
            <span className="text-primary">{t.landing.heroHighlight}</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            {t.landing.heroSubtitle}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
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
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
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
              <p className="mt-4 text-muted-foreground">
                {t.landing.benefitsSubtitle}
              </p>
              <ul className="mt-8 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border bg-card p-8">
              <h3 className="text-xl font-semibold">{t.landing.forCandidates}</h3>
              <p className="mt-2 text-muted-foreground">
                {t.landing.forCandidatesDesc}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/auth/register?role=candidate">
                  {t.landing.joinCandidate}
                </Link>
              </Button>
              <div className="my-6 border-t" />
              <h3 className="text-xl font-semibold">{t.landing.forRecruiters}</h3>
              <p className="mt-2 text-muted-foreground">
                {t.landing.forRecruitersDesc}
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/auth/register?role=recruiter">
                  {t.landing.joinRecruiter}
                </Link>
              </Button>
            </div>
          </div>
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
