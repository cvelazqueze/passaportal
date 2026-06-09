import { PrismaClient, UserRole, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(32);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

const prisma = new PrismaClient();

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEMO_SEED !== "true"
  ) {
    console.error(
      "Refusing to seed demo data in production. Set ALLOW_DEMO_SEED=true only for intentional staging seeds."
    );
    process.exit(1);
  }

  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword) {
    console.error(
      "SEED_DEMO_PASSWORD is not set. Add it to your .env file before running db:seed."
    );
    process.exit(1);
  }

  console.log("Seeding PassaPortal database...");

  // Create permissions
  const permissions = [
    { name: "passport:read", resource: "passport", action: "read", description: "Read talent passport" },
    { name: "passport:write", resource: "passport", action: "write", description: "Write talent passport" },
    { name: "passport:export", resource: "passport", action: "export", description: "Export talent passport" },
    { name: "job:read", resource: "job", action: "read", description: "Read jobs" },
    { name: "job:write", resource: "job", action: "write", description: "Write jobs" },
    { name: "job:manage", resource: "job", action: "manage", description: "Manage jobs" },
    { name: "candidate:read", resource: "candidate", action: "read", description: "Read candidates" },
    { name: "candidate:search", resource: "candidate", action: "search", description: "Search candidates" },
    { name: "application:read", resource: "application", action: "read", description: "Read applications" },
    { name: "application:manage", resource: "application", action: "manage", description: "Manage applications" },
    { name: "org:manage", resource: "org", action: "manage", description: "Manage organization" },
    { name: "platform:admin", resource: "platform", action: "admin", description: "Platform administration" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  const passwordHash = hashPassword(demoPassword);

  // Platform Admin
  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@passaportal.app" },
    update: {},
    create: {
      email: "admin@passaportal.app",
      firstName: "Platform",
      lastName: "Admin",
      passwordHash,
      role: UserRole.PLATFORM_ADMIN,
    },
  });

  // Organization
  const org = await prisma.organization.upsert({
    where: { slug: "acme-recruiting" },
    update: {},
    create: {
      name: "Acme Recruiting",
      slug: "acme-recruiting",
      type: "AGENCY",
      subscription: {
        create: {
          plan: SubscriptionPlan.PROFESSIONAL,
          status: SubscriptionStatus.ACTIVE,
        },
      },
    },
  });

  // Agency Admin
  const agencyAdmin = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      email: "admin@acme.com",
      firstName: "Sarah",
      lastName: "Johnson",
      passwordHash,
      role: UserRole.AGENCY_ADMIN,
      organizationMember: {
        create: {
          organizationId: org.id,
          role: UserRole.AGENCY_ADMIN,
        },
      },
    },
  });

  // Recruiter
  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@acme.com" },
    update: {},
    create: {
      email: "recruiter@acme.com",
      firstName: "Mike",
      lastName: "Chen",
      passwordHash,
      role: UserRole.RECRUITER,
      recruiterProfile: { create: { title: "Senior Recruiter" } },
      organizationMember: {
        create: {
          organizationId: org.id,
          role: UserRole.RECRUITER,
        },
      },
    },
  });

  // Hiring Manager
  const hiringManager = await prisma.user.upsert({
    where: { email: "hm@acme.com" },
    update: {},
    create: {
      email: "hm@acme.com",
      firstName: "Lisa",
      lastName: "Park",
      passwordHash,
      role: UserRole.HIRING_MANAGER,
      hiringManagerProfile: {
        create: { title: "Engineering Director", department: "Engineering" },
      },
      organizationMember: {
        create: {
          organizationId: org.id,
          role: UserRole.HIRING_MANAGER,
        },
      },
    },
  });

  // Candidates
  const candidate1 = await prisma.user.upsert({
    where: { email: "alex@example.com" },
    update: {},
    create: {
      email: "alex@example.com",
      firstName: "Alex",
      lastName: "Rivera",
      passwordHash,
      role: UserRole.CANDIDATE,
      candidateProfile: {
        create: {
          talentPassport: {
            create: {
              professionalTitle: "Senior Software Engineer",
              technologies: ["TypeScript", "Node.js", "React", "PostgreSQL", "AWS", "Docker"],
              phone: "+1-555-0101",
              linkedIn: "https://linkedin.com/in/alexrivera",
              github: "https://github.com/alexrivera",
              city: "San Francisco",
              country: "USA",
              professionalSummary:
                "Senior software engineer with 8+ years of experience building scalable web applications. Passionate about clean code, system design, and mentoring junior developers.",
              careerGoals:
                "Seeking a Staff Engineer role at a product-focused company where I can lead technical initiatives.",
              completeness: 85,
              experiences: {
                create: [
                  {
                    company: "TechCorp Inc.",
                    position: "Senior Software Engineer",
                    startDate: new Date("2020-03-01"),
                    isCurrent: true,
                    achievements: [
                      "Led migration to microservices, reducing deployment time by 60%",
                      "Mentored team of 5 junior engineers",
                    ],
                    responsibilities: [
                      "Design and implement backend services",
                      "Code review and technical leadership",
                    ],
                    technologies: ["TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker"],
                    impactMetrics: ["Reduced API latency by 40%", "99.9% uptime maintained"],
                    sortOrder: 0,
                  },
                  {
                    company: "StartupXYZ",
                    position: "Full Stack Developer",
                    startDate: new Date("2017-06-01"),
                    endDate: new Date("2020-02-28"),
                    achievements: ["Built MVP from scratch serving 10K users"],
                    responsibilities: ["Full stack development", "DevOps"],
                    technologies: ["React", "Python", "MongoDB"],
                    sortOrder: 1,
                  },
                ],
              },
              skills: {
                create: [
                  { name: "TypeScript", yearsExperience: 5, proficiency: "EXPERT", sortOrder: 0 },
                  { name: "React", yearsExperience: 6, proficiency: "EXPERT", sortOrder: 1 },
                  { name: "Node.js", yearsExperience: 7, proficiency: "ADVANCED", sortOrder: 2 },
                  { name: "PostgreSQL", yearsExperience: 5, proficiency: "ADVANCED", sortOrder: 3 },
                  { name: "AWS", yearsExperience: 4, proficiency: "INTERMEDIATE", sortOrder: 4 },
                  { name: "Docker", yearsExperience: 3, proficiency: "ADVANCED", sortOrder: 5 },
                ],
              },
              education: {
                create: [
                  {
                    institution: "University of California, Berkeley",
                    degree: "B.S. Computer Science",
                    startDate: new Date("2013-09-01"),
                    endDate: new Date("2017-05-15"),
                    sortOrder: 0,
                  },
                ],
              },
              certifications: {
                create: [
                  {
                    name: "AWS Solutions Architect",
                    issuer: "Amazon Web Services",
                    issueDate: new Date("2022-06-01"),
                    sortOrder: 0,
                  },
                ],
              },
            },
          },
        },
      },
    },
  });

  const candidate2 = await prisma.user.upsert({
    where: { email: "jordan@example.com" },
    update: {},
    create: {
      email: "jordan@example.com",
      firstName: "Jordan",
      lastName: "Kim",
      passwordHash,
      role: UserRole.CANDIDATE,
      candidateProfile: {
        create: {
          talentPassport: {
            create: {
              city: "New York",
              country: "USA",
              professionalSummary: "DevOps engineer specializing in cloud infrastructure and CI/CD pipelines.",
              completeness: 60,
              skills: {
                create: [
                  { name: "Kubernetes", yearsExperience: 4, proficiency: "EXPERT", sortOrder: 0 },
                  { name: "Terraform", yearsExperience: 3, proficiency: "ADVANCED", sortOrder: 1 },
                  { name: "Python", yearsExperience: 5, proficiency: "ADVANCED", sortOrder: 2 },
                ],
              },
            },
          },
        },
      },
    },
  });

  // Client
  const client = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "GlobalTech Solutions",
      contactEmail: "hr@globaltech.com",
      website: "https://globaltech.com",
    },
  });

  // Jobs
  const job1 = await prisma.job.create({
    data: {
      organizationId: org.id,
      clientId: client.id,
      title: "Senior Backend Engineer",
      description:
        "We are looking for a Senior Backend Engineer to join our platform team. You will design and build scalable microservices.",
      requirements: [
        "5+ years backend development experience",
        "Strong system design skills",
        "Experience with cloud platforms",
      ],
      requiredSkills: ["TypeScript", "Node.js", "PostgreSQL", "AWS"],
      preferredSkills: ["Docker", "Kubernetes", "GraphQL"],
      location: "San Francisco, CA",
      remote: true,
      salaryMin: 150000,
      salaryMax: 200000,
      status: "OPEN",
    },
  });

  const job2 = await prisma.job.create({
    data: {
      organizationId: org.id,
      title: "DevOps Engineer",
      description: "Join our infrastructure team to build and maintain our cloud platform.",
      requiredSkills: ["Kubernetes", "Terraform", "Python", "AWS"],
      preferredSkills: ["ArgoCD", "Prometheus"],
      location: "Remote",
      remote: true,
      salaryMin: 130000,
      salaryMax: 170000,
      status: "OPEN",
    },
  });

  const candidateProfile1 = await prisma.candidateProfile.findUnique({
    where: { userId: candidate1.id },
  });

  // Candidate Copilot workspace setup
  const pipelineStages = [
    "Interested", "Applied", "Recruiter Contact", "Screening",
    "Technical Assessment", "Technical Interview", "Client Interview",
    "Final Interview", "Offer", "Accepted", "Rejected", "Ghosted", "Withdrawn",
  ];
  const stageColors = [
    "bg-slate-100", "bg-blue-100", "bg-indigo-100", "bg-purple-100",
    "bg-violet-100", "bg-amber-100", "bg-orange-100", "bg-yellow-100",
    "bg-green-100", "bg-emerald-100", "bg-red-100", "bg-gray-200", "bg-gray-100",
  ];

  async function setupCandidateWorkspace(profileId: string, passportId: string) {
    const stageCount = await prisma.candidatePipelineStage.count({
      where: { candidateProfileId: profileId },
    });
    if (stageCount === 0) {
      await prisma.candidatePipelineStage.createMany({
        data: pipelineStages.map((name, i) => ({
          candidateProfileId: profileId,
          name,
          color: stageColors[i] ?? "bg-slate-100",
          sortOrder: i,
          isSystemDefault: true,
        })),
      });
      await prisma.rejectionReason.createMany({
        data: [
          "Salary Expectations", "Missing Experience", "Technical Assessment",
          "Cultural Fit", "Internal Candidate", "Position Closed",
          "No Feedback", "Candidate Withdrawal",
        ].map((label) => ({ candidateProfileId: profileId, label, isSystemDefault: true })),
      });
      await prisma.resumeVersion.create({
        data: {
          talentPassportId: passportId,
          name: "Master Resume",
          isMaster: true,
          isDefault: true,
          template: "ATS",
          targetRole: "General",
        },
      });
    }
    return prisma.candidatePipelineStage.findFirst({
      where: { candidateProfileId: profileId, name: "Technical Interview" },
    });
  }

  const passport1 = await prisma.talentPassport.findUnique({
    where: { candidateProfileId: candidateProfile1?.id },
  });

  if (candidateProfile1 && passport1) {
    const techInterviewStage = await setupCandidateWorkspace(
      candidateProfile1.id,
      passport1.id
    );

    await prisma.application.deleteMany({
      where: { candidateProfileId: candidateProfile1.id },
    });

    await prisma.application.create({
      data: {
        candidateProfileId: candidateProfile1.id,
        jobId: job1.id,
        title: "Senior Backend Engineer",
        company: "GlobalTech Solutions",
        stage: "TECHNICAL_INTERVIEW",
        pipelineStageId: techInterviewStage?.id,
        appliedAt: new Date("2025-05-15"),
        salaryMin: 150000,
        salaryMax: 200000,
        technologies: ["TypeScript", "Node.js", "PostgreSQL", "AWS"],
        source: "Recruiter",
        recruiterName: "Mike Chen",
        score: 87.5,
      },
    });

    await prisma.language.create({
      data: {
        talentPassportId: passport1.id,
        name: "English",
        proficiency: "EXPERT",
        sortOrder: 0,
      },
    });

    await prisma.skill.updateMany({
      where: { talentPassportId: passport1.id, name: "TypeScript" },
      data: { category: "Programming" },
    });
  }

  const candidateProfile2 = await prisma.candidateProfile.findUnique({
    where: { userId: candidate2.id },
  });
  const passport2 = await prisma.talentPassport.findUnique({
    where: { candidateProfileId: candidateProfile2?.id },
  });
  if (candidateProfile2 && passport2) {
    await setupCandidateWorkspace(candidateProfile2.id, passport2.id);
  }

  // Talent Pool
  const pool = await prisma.talentPool.create({
    data: {
      organizationId: org.id,
      name: "Backend Engineers",
      description: "Experienced backend engineers for client placements",
      criteria: {
        requiredSkills: ["TypeScript", "Node.js"],
        minYearsExperience: 3,
      },
    },
  });

  if (candidateProfile1) {
    await prisma.talentPoolMember.create({
      data: {
        talentPoolId: pool.id,
        candidateProfileId: candidateProfile1.id,
        rank: 1,
        score: 87.5,
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log("\nDemo accounts (password from SEED_DEMO_PASSWORD in .env):");
  console.log("  Platform Admin: admin@passaportal.app");
  console.log("  Agency Admin:   admin@acme.com");
  console.log("  Recruiter:      recruiter@acme.com");
  console.log("  Hiring Manager: hm@acme.com");
  console.log("  Candidate:      alex@example.com");
  console.log("  Candidate:      jordan@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
