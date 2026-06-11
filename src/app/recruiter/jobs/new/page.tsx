"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { JobsHub } from "@/components/recruiter/jobs-hub";

export default function NewJobPage() {
  return (
    <DashboardLayout>
      <JobsHub initialShowForm />
    </DashboardLayout>
  );
}
