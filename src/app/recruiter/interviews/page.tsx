"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { InterviewsHub } from "@/components/recruiter/interviews-hub";

export default function RecruiterInterviewsPage() {
  return (
    <DashboardLayout>
      <InterviewsHub />
    </DashboardLayout>
  );
}
