import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ResumePreview } from "@/components/candidate/resume-preview";
import { AutoPrint } from "@/components/candidate/auto-print";
import { ResumePrintToolbar } from "@/components/candidate/resume-print-toolbar";
import { buildResumeData } from "@/lib/resume/build-resume-data";
import { parseResumeSelection } from "@/lib/resume/resume-selection";
import { getServerDictionary } from "@/lib/i18n/server";
import styles from "@/components/candidate/ats-resume-print.module.css";
import { ResumeTemplate } from "@prisma/client";

interface PrintPageProps {
  searchParams: Promise<{ auto?: string; resumeId?: string }>;
}

export default async function ResumePrintPage({ searchParams }: PrintPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const params = await searchParams;
  const autoPrint = params.auto === "1";
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
          resumeVersions: true,
        },
      },
    },
  });

  const passport = profile?.talentPassport;
  if (!passport) redirect("/candidate/dashboard");

  const master = params.resumeId
    ? passport.resumeVersions.find((r) => r.id === params.resumeId)
    : passport.resumeVersions.find((r) => r.isMaster);

  const template = (master?.template ?? ResumeTemplate.ATS) as ResumeTemplate;
  const selection = parseResumeSelection(master?.includedSections);
  const resumeData = buildResumeData(user, passport, selection);

  return (
    <div className={styles.printShell}>
      {autoPrint && <AutoPrint />}
      <ResumePrintToolbar />
      <div className={styles.previewArea}>
        <ResumePreview
          template={template}
          data={resumeData}
          locale={locale}
          labels={t.resume}
          hubLabels={t.resumeHub}
          variant="print"
        />
      </div>
    </div>
  );
}
