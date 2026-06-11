"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { JobsHub } from "@/components/recruiter/jobs-hub";

export default function RecruiterJobsPage() {
  return (
    <DashboardLayout>
      <JobsHub />
    </DashboardLayout>
  );
}
