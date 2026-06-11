import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/candidate/page-header";
import { ResumeHubWorkspace } from "@/components/candidate/resume-hub-workspace";
import { TemplateGrid } from "@/components/candidate/template-grid";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { serializePassport } from "@/lib/resume/serialize-passport";
import { getServerDictionary } from "@/lib/i18n/server";
import { ResumeTemplate } from "@prisma/client";

interface ResumeHubPageProps {
  searchParams: Promise<{ resumeId?: string }>;
}

export default async function ResumeHubPage({ searchParams }: ResumeHubPageProps) {
  const { resumeId } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { t } = await getServerDictionary();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true },
  });
  if (!user) redirect("/auth/login");

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      talentPassport: {
        include: {
          experiences: { orderBy: { sortOrder: "asc" } },
          skills: { orderBy: { sortOrder: "asc" } },
          education: { orderBy: { sortOrder: "asc" } },
          certifications: { orderBy: { sortOrder: "asc" } },
          projects: { orderBy: { sortOrder: "asc" } },
          languages: { orderBy: { sortOrder: "asc" } },
          resumeVersions: {
            include: { exportHistory: { orderBy: { exportedAt: "desc" }, take: 1 } },
            orderBy: [{ isMaster: "desc" }, { updatedAt: "desc" }],
          },
        },
      },
    },
  });

  const passport = profile?.talentPassport;
  if (!passport) redirect("/candidate/dashboard");

  const resumes = passport.resumeVersions;
  const activeResumes = resumes.filter((r) => r.status === "ACTIVE");
  const master = resumes.find((r) => r.isMaster);
  const previewTemplate = (master?.template ?? ResumeTemplate.ATS) as ResumeTemplate;
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={t.resumeHub.title}
          description={t.resumeHub.description}
          action={
            <Button variant="outline" asChild>
              <Link href="/candidate/profile">
                <Pencil className="mr-2 h-4 w-4" />
                {t.resumeHub.editResumeData}
              </Link>
            </Button>
          }
        />

        <ResumeHubWorkspace
          user={user}
          passport={serializePassport(passport)}
          initialResumeId={resumeId}
          resumes={activeResumes.map((r) => ({
            id: r.id,
            name: r.name,
            isMaster: r.isMaster,
            status: r.status,
            template: r.template,
            targetRole: r.targetRole,
            includedSections: r.includedSections,
            customizations: r.customizations,
          }))}
        />

        <div>
          <h3 className="mb-4 text-lg font-semibold">{t.resumeHub.createFromTemplate}</h3>
          <TemplateGrid activeTemplate={previewTemplate} />
        </div>

      </div>
    </DashboardLayout>
  );
}
