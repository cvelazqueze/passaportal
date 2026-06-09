import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/encryption";
import { registerSchema } from "@/lib/validations";
import { UserRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit/logger";
import { AuditAction } from "@prisma/client";

import { initializeCandidateWorkspace } from "@/lib/candidate/onboarding";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, role } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const userRole = role === "RECRUITER" ? UserRole.RECRUITER : UserRole.CANDIDATE;

    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: userRole,
        ...(userRole === UserRole.CANDIDATE && {
          candidateProfile: {
            create: {
              talentPassport: { create: {} },
            },
          },
        }),
        ...(userRole === UserRole.RECRUITER && {
          recruiterProfile: { create: {} },
        }),
      },
      include: {
        candidateProfile: { include: { talentPassport: true } },
      },
    });

    if (userRole === UserRole.CANDIDATE && user.candidateProfile?.talentPassport) {
      await initializeCandidateWorkspace(
        user.candidateProfile.id,
        user.candidateProfile.talentPassport.id
      );
    }

    await createAuditLog({
      userId: user.id,
      action: AuditAction.CREATE,
      resource: "user",
      resourceId: user.id,
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
