import type { ResumeData } from "./types";
import {
  applyResumeSelection,
  applyEmailVisibility,
  type ResumeSelection,
} from "./resume-selection";

type PassportInput = {
  professionalTitle: string | null;
  professionalSummary: string | null;
  phone: string | null;
  linkedIn: string | null;
  portfolio: string | null;
  github: string | null;
  city: string | null;
  country: string | null;
  technologies: string[];
  experiences: {
    id: string;
    company: string;
    position: string;
    location: string | null;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
    achievements: string[];
    responsibilities: string[];
    technologies: string[];
  }[];
  skills: { id: string; name: string; proficiency: string }[];
  languages: { id: string; name: string; proficiency: string }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    location: string | null;
    startDate: Date;
    endDate: Date | null;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    issueDate: Date | null;
  }[];
  projects: {
    id: string;
    title: string;
    description: string | null;
    technologies: string[];
  }[];
};

export function buildResumeData(
  user: { firstName: string; lastName: string; email: string },
  passport: PassportInput,
  selection?: ResumeSelection | null
): ResumeData {
  const normalized = {
    ...passport,
    languages: passport.languages ?? [],
    projects: passport.projects ?? [],
  };
  const filtered = applyResumeSelection(normalized, selection);

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: applyEmailVisibility(user.email, selection),
    phone: filtered.phone,
    linkedIn: filtered.linkedIn,
    portfolio: filtered.portfolio,
    github: filtered.github,
    city: filtered.city,
    country: filtered.country,
    professionalTitle: filtered.professionalTitle,
    professionalSummary: filtered.professionalSummary,
    technologies: passport.technologies,
    experiences: filtered.experiences.map((exp) => ({
      company: exp.company,
      position: exp.position,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      isCurrent: exp.isCurrent,
      achievements: exp.achievements,
      responsibilities: exp.responsibilities,
      technologies: exp.technologies,
    })),
    skills: filtered.skills.map((s) => ({
      name: s.name,
      proficiency: s.proficiency,
    })),
    languages: filtered.languages.map((l) => ({
      name: l.name,
      proficiency: l.proficiency,
    })),
    education: filtered.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      location: edu.location,
      startDate: edu.startDate,
      endDate: edu.endDate,
    })),
    certifications: filtered.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
    })),
    projects: filtered.projects.map((p) => ({
      title: p.title,
      description: p.description,
      technologies: p.technologies,
    })),
  };
}
