import { db } from "@/lib/db";

export async function computeAndSaveProfileCompleteness(talentPassportId: string) {
  const passport = await db.talentPassport.findUnique({
    where: { id: talentPassportId },
    include: {
      experiences: { take: 1 },
      skills: { take: 1 },
      languages: { take: 1 },
      education: { take: 1 },
      certifications: { take: 1 },
      projects: { take: 1 },
    },
  });

  if (!passport) return 0;

  const weights = {
    title: passport.professionalTitle ? 10 : 0,
    summary: passport.professionalSummary ? 10 : 0,
    contact: passport.phone || passport.linkedIn ? 10 : 0,
    experience: passport.experiences.length > 0 ? 25 : 0,
    skills: passport.skills.length > 0 ? 20 : 0,
    education: passport.education.length > 0 ? 10 : 0,
    projects: passport.projects.length > 0 ? 10 : 0,
    certifications: passport.certifications.length > 0 ? 5 : 0,
    languages: passport.languages.length > 0 ? 5 : 0,
    links: passport.github || passport.portfolio ? 5 : 0,
  };

  const completeness = Object.values(weights).reduce((a, b) => a + b, 0);

  await db.talentPassport.update({
    where: { id: talentPassportId },
    data: { completeness },
  });

  return completeness;
}

export { getCompletenessSections } from "@/lib/i18n/helpers";
