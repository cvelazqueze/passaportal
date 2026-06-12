"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { OutreachHub } from "@/components/candidate/outreach-hub";

export default function OutreachPage() {
  return (
    <DashboardLayout>
      <OutreachHub />
    </DashboardLayout>
  );
}
