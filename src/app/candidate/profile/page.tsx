import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/candidate/page-header";
import { Progress } from "@/components/ui/progress";
import { ProfileEditor } from "@/components/candidate/profile-editor";
import { generateAutoSummary } from "@/lib/resume/auto-summary";
import { getCompletenessSections } from "@/lib/candidate/profile-completeness";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function ProfileHubPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { t } = await getServerDictionary();

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      talentPassport: {
        include: {
          experiences: { orderBy: { sortOrder: "asc" } },
          skills: { orderBy: { sortOrder: "asc" } },
          languages: { orderBy: { sortOrder: "asc" } },
          education: { orderBy: { sortOrder: "asc" } },
          certifications: { orderBy: { sortOrder: "asc" } },
          projects: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  const passport = profile?.talentPassport;
  if (!passport) redirect("/candidate/dashboard");

  const autoSummary = generateAutoSummary({
    professionalTitle: passport.professionalTitle,
    experiences: passport.experiences,
    skills: passport.skills,
    education: passport.education,
    technologies: passport.technologies,
  });

  const sections = getCompletenessSections(passport, t);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={t.profile.title}
          description={t.profile.description}
          action={
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t.profile.completeness}</p>
                <p className="text-lg font-bold">{passport.completeness}%</p>
              </div>
              <Progress value={passport.completeness} className="w-32" />
              <Button variant="outline" asChild>
                <Link href="/candidate/resumes">{t.nav.resumeHub}</Link>
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {sections.map((s) => (
            <div
              key={s.key}
              className={`rounded-lg border p-3 text-center text-sm ${
                s.done ? "border-success/30 bg-success/5" : "bg-muted/30"
              }`}
            >
              <p className="font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">
                {s.done ? t.common.complete : t.common.incomplete}
              </p>
            </div>
          ))}
        </div>

        <ProfileEditor
          email={session.user.email!}
          passport={passport}
          autoSummary={autoSummary}
        />
      </div>
    </DashboardLayout>
  );
}
