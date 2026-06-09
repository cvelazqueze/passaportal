import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/candidate/page-header";
import { ResumeHubWorkspace } from "@/components/candidate/resume-hub-workspace";
import { TemplateGrid } from "@/components/candidate/template-grid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Archive, Download, Pencil } from "lucide-react";
import Link from "next/link";
import { serializePassport } from "@/lib/resume/serialize-passport";
import { getServerDictionary } from "@/lib/i18n/server";
import { ResumeTemplate } from "@prisma/client";

export default async function ResumeHubPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, t } = await getServerDictionary();

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
  const versions = resumes.filter((r) => !r.isMaster && r.status === "ACTIVE");
  const archived = resumes.filter((r) => r.status === "ARCHIVED");
  const previewTemplate = (master?.template ?? ResumeTemplate.ATS) as ResumeTemplate;
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={t.resumeHub.title}
          description={t.resumeHub.description}
          action={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/candidate/profile">
                  <Pencil className="mr-2 h-4 w-4" />
                  {t.resumeHub.editResumeData}
                </Link>
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t.resumeHub.newVersion}
              </Button>
            </div>
          }
        />

        <ResumeHubWorkspace
          user={user}
          passport={serializePassport(passport)}
          resumes={activeResumes.map((r) => ({
            id: r.id,
            name: r.name,
            isMaster: r.isMaster,
            status: r.status,
            template: r.template,
            targetRole: r.targetRole,
            includedSections: r.includedSections,
          }))}
        />

        <div>
          <h3 className="mb-4 text-lg font-semibold">{t.resumeHub.createFromTemplate}</h3>
          <TemplateGrid activeTemplate={previewTemplate} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.resumeHub.resumeVersions}</CardTitle>
            <CardDescription>{t.resumeHub.versionsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.resumeHub.noVersions}</p>
            ) : (
              <div className="space-y-3">
                {versions.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{resume.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {resume.template}
                        {resume.targetRole && ` · ${resume.targetRole}`}
                      </p>
                      {resume.exportHistory[0] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.resumeHub.lastExported}: {resume.exportHistory[0].format}{" "}
                          {new Date(resume.exportHistory[0].exportedAt).toLocaleDateString(locale)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" title={t.common.duplicate}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title={t.resumeHub.print} asChild>
                        <Link href={`/candidate/resumes/print?auto=1&resumeId=${resume.id}`}>
                          <Download className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" title={t.common.archive}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {archived.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-muted-foreground">
                {t.resumeHub.archivedVersions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {archived.map((r) => (
                  <p key={r.id} className="text-sm text-muted-foreground">{r.name}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
