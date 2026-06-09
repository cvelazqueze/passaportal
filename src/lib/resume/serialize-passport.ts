/** JSON-safe passport snapshot for client-side resume preview. */
export interface SerializedPassport {
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
    startDate: string;
    endDate: string | null;
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
    startDate: string;
    endDate: string | null;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    issueDate: string | null;
  }[];
  projects: {
    id: string;
    title: string;
    description: string | null;
    technologies: string[];
  }[];
}

type DbPassport = {
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

export function serializePassport(passport: DbPassport): SerializedPassport {
  return {
    professionalTitle: passport.professionalTitle,
    professionalSummary: passport.professionalSummary,
    phone: passport.phone,
    linkedIn: passport.linkedIn,
    portfolio: passport.portfolio,
    github: passport.github,
    city: passport.city,
    country: passport.country,
    technologies: passport.technologies,
    experiences: passport.experiences.map((e) => ({
      ...e,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() ?? null,
    })),
    skills: passport.skills,
    languages: passport.languages,
    education: passport.education.map((e) => ({
      ...e,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() ?? null,
    })),
    certifications: passport.certifications.map((c) => ({
      ...c,
      issueDate: c.issueDate?.toISOString() ?? null,
    })),
    projects: passport.projects,
  };
}

export function deserializePassport(passport: SerializedPassport) {
  return {
    ...passport,
    experiences: passport.experiences.map((e) => ({
      ...e,
      startDate: new Date(e.startDate),
      endDate: e.endDate ? new Date(e.endDate) : null,
    })),
    education: passport.education.map((e) => ({
      ...e,
      startDate: new Date(e.startDate),
      endDate: e.endDate ? new Date(e.endDate) : null,
    })),
    certifications: passport.certifications.map((c) => ({
      ...c,
      issueDate: c.issueDate ? new Date(c.issueDate) : null,
    })),
  };
}
