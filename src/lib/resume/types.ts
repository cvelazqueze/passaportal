export interface ResumeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  linkedIn?: string | null;
  portfolio?: string | null;
  github?: string | null;
  city?: string | null;
  country?: string | null;
  professionalTitle?: string | null;
  technologies?: string[];
  experiences: {
    company: string;
    position: string;
    location?: string | null;
    startDate: Date;
    endDate?: Date | null;
    isCurrent: boolean;
    achievements: string[];
    responsibilities: string[];
    technologies: string[];
  }[];
  skills: { name: string; proficiency: string }[];
  education: {
    institution: string;
    degree: string;
    location?: string | null;
    startDate: Date;
    endDate?: Date | null;
  }[];
  certifications: {
    name: string;
    issuer: string;
    issueDate?: Date | null;
  }[];
  projects: {
    title: string;
    description?: string | null;
    technologies: string[];
  }[];
}
