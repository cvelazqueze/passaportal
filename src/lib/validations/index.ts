import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  role: z.enum(["CANDIDATE", "RECRUITER"]).default("CANDIDATE"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const contactInfoSchema = z.object({
  phone: z.string().optional(),
  linkedIn: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  isCurrent: z.boolean().default(false),
  achievements: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  impactMetrics: z.array(z.string()).default([]),
});

export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  yearsExperience: z.number().min(0).optional(),
  proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
});

export const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  location: z.string().optional(),
  remote: z.boolean().default(false),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default("USD"),
});

export const scorecardSchema = z.object({
  technicalSkills: z.enum(["POOR", "BELOW_AVERAGE", "AVERAGE", "GOOD", "EXCELLENT"]).optional(),
  communication: z.enum(["POOR", "BELOW_AVERAGE", "AVERAGE", "GOOD", "EXCELLENT"]).optional(),
  leadership: z.enum(["POOR", "BELOW_AVERAGE", "AVERAGE", "GOOD", "EXCELLENT"]).optional(),
  problemSolving: z.enum(["POOR", "BELOW_AVERAGE", "AVERAGE", "GOOD", "EXCELLENT"]).optional(),
  teamwork: z.enum(["POOR", "BELOW_AVERAGE", "AVERAGE", "GOOD", "EXCELLENT"]).optional(),
  overallRecommendation: z.enum(["STRONG_NO", "NO", "NEUTRAL", "YES", "STRONG_YES"]).optional(),
  notes: z.string().optional(),
});

export const FORBIDDEN_FIELDS = [
  "homeAddress",
  "governmentId",
  "passportNumber",
  "driverLicense",
  "ssn",
  "taxId",
  "creditCard",
  "birthDate",
  "gender",
  "maritalStatus",
  "race",
  "religion",
  "politicalAffiliation",
] as const;

export function validateNoForbiddenFields(data: Record<string, unknown>): boolean {
  return !FORBIDDEN_FIELDS.some((field) => field in data && data[field] != null);
}
