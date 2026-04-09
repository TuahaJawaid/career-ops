import { getDb } from "@/lib/db";
import { jobs, applications, applicationEvents } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Send, Calendar, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { type ApplicationStatus } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

async function getDashboardData() {
  try {
    const db = getDb();

    const [jobCount] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.isArchived, false));

    const allApps = await db
      .select({ status: applications.status, count: count() })
      .from(applications)
      .groupBy(applications.status);

    const recentEvents = await db
      .select({
        id: applicationEvents.id,
        toStatus: applicationEvents.toStatus,
        note: applicationEvents.note,
        createdAt: applicationEvents.createdAt,
        jobTitle: jobs.title,
        company: jobs.company,
      })
      .from(applicationEvents)
      .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applicationEvents.createdAt))
      .limit(10);

    const gradeBreakdown = await db
      .select({ grade: jobs.grade, count: count() })
      .from(jobs)
      .where(eq(jobs.isArchived, false))
      .groupBy(jobs.grade);

    return { jobCount: jobCount.count, allApps, recentEvents, gradeBreakdown };
  } catch {
    return { jobCount: 0, allApps: [], recentEvents: [], gradeBreakdown: [] };
  }
}

export default async function DashboardPage() {
  const { jobCount, allApps, recentEvents, gradeBreakdown } = await getDashboardData();

  const statusMap = Object.fromEntries(allApps.map((a) => [a.status, a.count]));
  const totalApps = allApps.reduce((sum, a) => sum + a.count, 0);
  const interviews = (statusMap["interview"] ?? 0) + (statusMap["technical"] ?? 0);
  const offers = statusMap["offer"] ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offers</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Start by adding jobs and creating applications.
              </p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={event.toStatus as ApplicationStatus} />
                      <span className="text-muted-foreground truncate max-w-48">
                        {event.jobTitle} at {event.company}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by Grade</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No jobs evaluated yet. Add a job and run AI evaluation.
              </p>
            ) : (
              <div className="space-y-2">
                {gradeBreakdown
                  .filter((g) => g.grade)
                  .sort((a, b) => (a.grade ?? "").localeCompare(b.grade ?? ""))
                  .map((g) => (
                    <div key={g.grade} className="flex items-center justify-between">
                      <Badge variant="outline">{g.grade}</Badge>
                      <span className="text-sm font-mono">{g.count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
