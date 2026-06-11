"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SearchHub } from "@/components/recruiter/search-hub";

export default function RecruiterSearchPage() {
  return (
    <DashboardLayout>
      <SearchHub />
    </DashboardLayout>
  );
}
