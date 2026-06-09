import { NextResponse } from "next/server";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { parseResumeText } from "@/lib/resume/pdf-parser";
import { extractPdfText } from "@/lib/resume/pdf-extract.server";
import { applyParsedResumeToProfile } from "@/lib/candidate/profile-import";
import { apiError } from "@/lib/api/error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { profile, session } = await requireCandidateProfile();
    const passport = profile.talentPassport;
    if (!passport) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer);
    const parsed = parseResumeText(text);

    if (parsed.experiences.length === 0 && parsed.education.length === 0) {
      return NextResponse.json(
        { error: "Could not extract experience or education from this PDF. Try an ATS-formatted resume." },
        { status: 422 }
      );
    }

    const completeness = await applyParsedResumeToProfile(
      passport.id,
      session.user.id,
      parsed
    );

    return NextResponse.json({
      message: "Profile restructured from resume",
      parsed: {
        experiences: parsed.experiences.length,
        education: parsed.education.length,
        certifications: parsed.certifications.length,
        skills: parsed.skills.length,
        professionalTitle: parsed.professionalTitle,
      },
      completeness,
    });
  } catch (error) {
    return apiError(error);
  }
}
