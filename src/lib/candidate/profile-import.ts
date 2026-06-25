import { db } from "@/lib/db";
import type { ParsedResume } from "@/lib/resume/pdf-parser";
import { computeAndSaveProfileCompleteness } from "@/lib/candidate/profile-completeness";

function normalizeOptionalUrl(value?: string): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("linkedin.com") || trimmed.startsWith("github.com")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Full restructure: replaces all resume-derived profile data with the new import.
 */
export async function applyParsedResumeToProfile(
  talentPassportId: string,
  userId: string,
  parsed: ParsedResume
) {
  await db.$transaction(async (tx) => {
    await tx.experience.deleteMany({ where: { talentPassportId } });
    await tx.education.deleteMany({ where: { talentPassportId } });
    await tx.certification.deleteMany({ where: { talentPassportId } });
    await tx.skill.deleteMany({ where: { talentPassportId } });

    await tx.talentPassport.update({
      where: { id: talentPassportId },
      data: {
        professionalTitle: parsed.professionalTitle ?? null,
        professionalSummary: parsed.professionalSummary ?? null,
        phone: parsed.phone ?? null,
        linkedIn: normalizeOptionalUrl(parsed.linkedIn),
        github: normalizeOptionalUrl(parsed.github),
        technologies: parsed.technologies,
      },
    });

    if (parsed.firstName && parsed.lastName) {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: parsed.firstName,
          lastName: parsed.lastName,
        },
      });
    }

    for (let i = 0; i < parsed.experiences.length; i++) {
      const exp = parsed.experiences[i];
      await tx.experience.create({
        data: {
          talentPassportId,
          company: exp.company,
          location: exp.location ?? null,
          position: exp.position,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: exp.isCurrent,
          achievements: exp.bullets,
          responsibilities: [],
          technologies: exp.technologies,
          sortOrder: i,
        },
      });
    }

    for (let i = 0; i < parsed.education.length; i++) {
      const edu = parsed.education[i];
      await tx.education.create({
        data: {
          talentPassportId,
          institution: edu.institution,
          location: edu.location ?? null,
          degree: edu.degree,
          startDate: edu.startDate,
          endDate: edu.endDate,
          sortOrder: i,
        },
      });
    }

    for (let i = 0; i < parsed.certifications.length; i++) {
      const cert = parsed.certifications[i];
      await tx.certification.create({
        data: {
          talentPassportId,
          name: cert.name,
          issuer: cert.issuer ?? "Certification",
          issueDate: cert.year ? new Date(cert.year, 0, 1) : undefined,
          sortOrder: i,
        },
      });
    }

    const skills = [...new Set(parsed.skills)];
    for (let i = 0; i < skills.length; i++) {
      await tx.skill.create({
        data: {
          talentPassportId,
          name: skills[i],
          category: categorizeSkill(skills[i]),
          sortOrder: i,
        },
      });
    }
  });

  return computeAndSaveProfileCompleteness(talentPassportId);
}

function categorizeSkill(name: string): string {
  const lower = name.toLowerCase();
  if (["typescript", "javascript", "java", "python", "ruby", "groovy"].some((t) => lower.includes(t))) {
    return "Programming";
  }
  if (["react", "node", "express", "graphql", "spring"].some((t) => lower.includes(t))) {
    return "Frameworks";
  }
  if (["postgresql", "mongodb", "sql"].some((t) => lower.includes(t))) {
    return "Databases";
  }
  if (["aws", "azure", "terraform", "docker", "kubernetes", "ci/cd"].some((t) => lower.includes(t))) {
    return "Cloud & DevOps";
  }
  return "Tools";
}
