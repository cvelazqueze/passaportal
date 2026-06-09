export const DEFAULT_PIPELINE_STAGES = [
  { name: "Interested", color: "bg-slate-100", sortOrder: 0 },
  { name: "Applied", color: "bg-blue-100", sortOrder: 1 },
  { name: "Recruiter Contact", color: "bg-indigo-100", sortOrder: 2 },
  { name: "Screening", color: "bg-purple-100", sortOrder: 3 },
  { name: "Technical Assessment", color: "bg-violet-100", sortOrder: 4 },
  { name: "Technical Interview", color: "bg-amber-100", sortOrder: 5 },
  { name: "Client Interview", color: "bg-orange-100", sortOrder: 6 },
  { name: "Final Interview", color: "bg-yellow-100", sortOrder: 7 },
  { name: "Offer", color: "bg-green-100", sortOrder: 8 },
  { name: "Accepted", color: "bg-emerald-100", sortOrder: 9 },
  { name: "Rejected", color: "bg-red-100", sortOrder: 10 },
  { name: "Ghosted", color: "bg-gray-200", sortOrder: 11 },
  { name: "Withdrawn", color: "bg-gray-100", sortOrder: 12 },
] as const;

export const DEFAULT_REJECTION_REASONS = [
  "Salary Expectations",
  "Missing Experience",
  "Technical Assessment",
  "Cultural Fit",
  "Internal Candidate",
  "Position Closed",
  "No Feedback",
  "Candidate Withdrawal",
] as const;

export const SKILL_CATEGORIES = [
  "Programming",
  "Frameworks",
  "Databases",
  "Cloud & DevOps",
  "Soft Skills",
  "Tools",
  "Other",
] as const;
