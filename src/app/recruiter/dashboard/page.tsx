import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  Plus,
} from "lucide-react";

export default async function RecruiterDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const member = await db.organizationMember.findUnique({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  const orgId = member?.organizationId;

  const [openJobs, totalCandidates, upcomingInterviews, recentApplications] =
    await Promise.all([
      orgId
        ? db.job.count({ where: { organizationId: orgId, status: "OPEN" } })
        : 0,
      orgId
        ? db.talentPoolMember.count({
            where: { talentPool: { organizationId: orgId } },
          })
        : 0,
      orgId
        ? db.interview.count({
            where: {
              status: "SCHEDULED",
              scheduledAt: { gte: new Date() },
              application: { job: { organizationId: orgId } },
            },
          })
        : 0,
      orgId
        ? db.application.findMany({
            where: { job: { organizationId: orgId } },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
              candidateProfile: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
              job: { select: { title: true } },
            },
          })
        : [],
    ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Recruiter Dashboard</h2>
            <p className="text-muted-foreground">
              {member?.organization.name ?? "Manage your recruiting pipeline"}
            </p>
          </div>
          <Button asChild>
            <Link href="/recruiter/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Talent Pool</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCandidates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Interviews
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingInterviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pipeline Health
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <Progress value={75} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest candidate submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No applications yet. Post a job to start receiving candidates.
              </p>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {app.candidateProfile.user.firstName}{" "}
                        {app.candidateProfile.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {app.job?.title ?? "Direct Application"}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {app.stage.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
