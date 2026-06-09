import { NextResponse } from "next/server";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { buildResumeData } from "@/lib/resume/build-resume-data";
import { parseResumeSelection } from "@/lib/resume/resume-selection";
import { generateDocx } from "@/lib/resume/generator";
import { db } from "@/lib/db";
import { getServerLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_").slice(0, 80);
}

async function resolveMasterResume(talentPassportId: string, resumeId?: string | null) {
  if (resumeId) {
    return db.resumeVersion.findFirst({
      where: { id: resumeId, talentPassportId },
    });
  }
  return db.resumeVersion.findFirst({
    where: { talentPassportId, isMaster: true, status: "ACTIVE" },
  });
}

export async function GET(request: Request) {
  try {
    const { profile, session } = await requireCandidateProfile();
    const passport = profile.talentPassport;
    if (!passport) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "docx";
    const resumeId = searchParams.get("resumeId");

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const fullPassport = await db.talentPassport.findUnique({
      where: { id: passport.id },
      include: {
        experiences: { orderBy: { sortOrder: "asc" } },
        skills: { orderBy: { sortOrder: "asc" } },
        education: { orderBy: { sortOrder: "asc" } },
        certifications: { orderBy: { sortOrder: "asc" } },
        projects: { orderBy: { sortOrder: "asc" } },
        languages: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!fullPassport) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const resumeVersion = await resolveMasterResume(passport.id, resumeId);
    const template = resumeVersion?.template ?? "ATS";
    const selection = parseResumeSelection(resumeVersion?.includedSections);
    const resumeData = buildResumeData(user, fullPassport, selection);
    const baseName = sanitizeFilename(
      resumeVersion?.name ?? `${user.firstName}_${user.lastName}_Resume`
    );

    if (format === "docx") {
      const locale = await getServerLocale();
      const buffer = await generateDocx(resumeData, template, locale);

      if (resumeVersion) {
        await db.resumeExportHistory.create({
          data: {
            resumeVersionId: resumeVersion.id,
            format: "DOCX",
          },
        });
      }

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseName}.docx"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported format. Use docx or open Print / Save PDF." },
      { status: 400 }
    );
  } catch (error) {
    return apiError(error);
  }
}
